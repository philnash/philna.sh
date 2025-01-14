---
title: "Troubles with multipart form data and fetch in Node.js"
tags:
  - javascript
  - nodejs
  - fetch
image: ../../assets/posts/node.png
imageAlt: "The Node.js logo"
imageWidth: 1920
imageHeight: 600
pubDate: "2025-01-14"
---

This is one of those cathartic blog posts. One in which I spent several frustrating hours trying to debug something that really should have just worked. Once I had finally found out what was going on I felt that I had to write it all down just in case someone else is out there dealing with the same issue. So if you have found yourself in a situation where using `fetch` in Node.js for a `multipart/form-data` request doesn't work, this might help you out.

If that doesn't apply to you, have a read anyway and share my pain.

## What happened?

Today, while trying to write a Node.js client for an API, I got stuck on one particular endpoint. It was an endpoint for uploading files, so it required the body to be formatted as `multipart/form-data`. JavaScript makes it easy to create such a request, you use a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object to gather your data, including files, and you submit it via [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch). The formatting of the request body is then handled for you and it normally just works.

Today it did not "just work".

## HTTP 422

Since version 18, Node.js has supported the `fetch` API, via a project called [undici](https://github.com/nodejs/undici). The undici project is added as a dependency to Node.js and the `fetch` function is exposed to the global scope.

To write the code for this upload endpoint should have been straightforward. I put together something like this:

```js
import { readFile } from "node:fs/promises";
import { extname, basename } from "node:path";

async function uploadFile(url, filePath) {
  const data = await readFile(filePath);
  const type = mime.getType(extname(filePath));
  const file = new File([data], basename(filePath), type);

  const form = new FormData();
  form.append("file", file);

  const headers = new Headers();
  headers.set("Accept", "application/json");

  return fetch(url, {
    method: "POST",
    headers,
    body: form
  });
}
```

The real code has a few more complexities, but this is a good approximation of what I expected to be able to write.

I lined up a test against the API, fired it off and was disappointed to receive a 422 response with the message "Invalid multipart formatting".

I pored back over the code, not that there was a lot of it, to try to work out what I had done wrong. Unable to find anything, I turned to other tools.

I tried to proxy and inspect my request to see if anything was obviously wrong. Then I tried sending the request from another tool to see if I could get the API endpoint to respond with a success. Using [Bruno](https://www.usebruno.com/) I was able to make a successful request.

With a correct request and an incorrect request, I compared the two. But I didn't get very far. The URL, the headers, and the request body all looked the same, yet one method of sending the request worked and the other didn't.

## Digging into the API

The API client I am writing is for [Langflow](https://www.langflow.org/). It's an open-source, low-code tool for building generative AI flows and agents. Langflow is part of [DataStax](https://www.datastax.com/), where I am working and doing things like [hooking Langflow up to Bluesky to create fun generative AI bots](https://www.datastax.com/blog/genai-bluesky-bot-with-langflow-typescript-node-js).

Because Langflow is open-source, once I had run out of ideas with my code I could dig into the code behind the API to see if I could work out what was going on there. I found [where the error message was coming from along with a hint as to what might be wrong](https://github.com/langflow-ai/langflow/blob/e7a20051887cb1f86c2c736ab3651c13986b0869/src/backend/base/langflow/main.py#L186-L193).

## Multipart requests

A multipart request is often made up of multiple parts that may not be of the same type. This is how you are able to submit text fields and upload an image file in the same request. To separate the different types, a multipart request comes up with a unique string to act as a boundary between the types of content. This boundary string is shared in the `Content-Type` header and looks like this:

```
Content-Type: multipart/form-data; boundary=ExampleBoundaryString
```

An example multipart request would then look like this:

```http
POST /foo HTTP/1.1
Content-Length: 68137
Content-Type: multipart/form-data; boundary=ExampleBoundaryString

--ExampleBoundaryString
Content-Disposition: form-data; name="description"

Description input value
--ExampleBoundaryString
Content-Disposition: form-data; name="myFile"; filename="foo.txt"
Content-Type: text/plain

[content of the file foo.txt chosen by the user]
--ExampleBoundaryString--
```

A server is then able to split up and parse the different parts of the request using the boundary.

This [`Content-Type` example is courtesy of MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_multipart_forms).

The Langflow API was checking to see whether the request body started with the boundary string and ended with the boundary string plus two dashes and then `\r\n`.

```python
boundary_start = f"--{boundary}".encode()
boundary_end = f"--{boundary}--\r\n".encode()

if not body.startswith(boundary_start) or not body.endswith(boundary_end):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Invalid multipart formatting"},
    )
```

The combination of a carriage return and line feed (CRLF), a holdover from the days of typewriters, turned out to be my undoing. After throwing some `print` lines in this code (I do not know how to debug Python any other way) I confirmed that the end of the body did not match because it was missing the CRLF.

A missing CRLF. Hours of debugging trying to spot a missing `\r\n`. A Python application causing me trouble over insignificant whitespace.

## Convention over specification

It turns out that spec for `multipart/form-data`, [RFC 7578](https://www.rfc-editor.org/rfc/rfc7578#page-4) does not mandate that the body of the request ends with a CRLF. It does say that each different part of the request must be delimited with a CRLF, "--", and then the value of the boundary parameter. It does not say that there needs to be a CRLF at the end of the body, nor does it say that there can't be a CRLF either.

In fact, it turns out that many popular HTTP clients, [including curl](https://github.com/curl/curl/blob/3434c6b46e682452973972e8313613dfa58cd690/lib/mime.c#L1029-L1030), do add this CRLF. It's a bit of a convention in HTTP clients, so it seems that when the team at Langflow wanted to implement a check on the validity of a multipart request, they included the CRLF in their expectations.

On the other hand, I can only presume the team building undici looked at the spec and realised they didn't need to add unnecessary whitespace and left the CRLF out.

And this is where I landed. Stuck between an HTTP client that wouldn't add a CRLF and an API that expected it. It took me far too long to figure this out.

## Fixing both sides

The latest version of Node.js, as I write this, is 23.6.0 and [it still behaves this way](https://github.com/nodejs/node/blob/v23.6.0/deps/undici/src/lib/web/fetch/body.js#L157). However, the code has been updated in undici version 7.1.0 to [include the trailing CRLF](https://github.com/KhafraDev/undici/blob/d48754e879645fe3818aaded1baef86196b0bcf4/lib/web/fetch/body.js#L158) and I am sure it will be in a release version of Node.js soon. I'm loathe to call this a fix as there was technically nothing wrong with what they were previously doing, but convention wins here.

On the other side of things, I made a [pull request to loosen Langflow's definition of a valid multipart request](https://github.com/langflow-ai/langflow/pull/5660). I'll have to wait to see how that goes.

As for my own code, I installed the latest version of undici into the project, imported `fetch` and it started working immediately.

So, if you're using `fetch` in Node.js between version 18.0.0 and 23.6.0 and you're making requests to a server that expects a multipart request to end in CRLF, you too have felt this pain and I am sorry. Yes, it's specific, but what else is the web for if not for sharing very specific problems and how you eventually mananaged to fix them?