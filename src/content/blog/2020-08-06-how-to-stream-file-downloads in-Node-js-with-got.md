---
title: "How to stream file downloads in Node.js with Got"
tags:
  - nodejs
  - http
  - webdev
image: /posts/got-header.png
imageAlt: "The Got logo"
socialImage: /posts/got-social-header.png
imageWidth: 1920
imageHeight: 600
pubDate: "2020-08-06"
---

[Got is a Node.js library for making HTTP requests](https://www.npmjs.com/package/got). It has both promise and stream based APIs and in this post I want to explore how to use the stream API to download files.

## Using Got

If you use HTTP libraries for making API requests, then the promise method is likely the best for you. Making a basic HTTP request with Got looks like this:

```javascript
const got = require("got");

got(url)
  .then(response => console.log(response.body))
  .catch(error => console.log(error.response.body));
```

The stream API gives us some extra benefits though. The promise API will load responses into memory until the response is finished before fulfilling the promise, but with the stream API you can act on chunks of the response as they arrive. This makes streams more memory efficient, particularly for large responses.

## Streaming a file download with Got

You can create a stream with Got using the `stream` method or by setting `isStream` to `true` in the options.

```javascript
got.stream(url);
// or
got(url, { isStream: true });
```

A Got stream is a [duplex stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex), which means it is both readable and writable. For the purposes of downloading a file, we will just be using its readable properties.

To download a file we need to send the response to the file system somehow. Streams allow you to pipe the data from one stream to another. To write to the file system we can create a writable stream using the [`fs` module's `createWriteStream`](https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options).

To test this out we'll need a file we can stream. The URL in the following examples is a 500KB gif that you might like.

The simplest way to use a Got stream and write the file to the file system looks like this:

```javascript
const got = require("got");
const { createWriteStream } = require("fs");

const url =
  "https://media0.giphy.com/media/4SS0kfzRqfBf2/giphy.gif";

got.stream(url).pipe(createWriteStream('image.gif'));
```

This code creates a Got stream of the image URL and pipes the data to a stream that writes the data into a file called "image.jpg".

## Handling progress and errors

The above code will download the file as long as there are no problems. If an error occurs the code will crash with an unhandled exception. There is also no feedback, so if your file is large you will not see any result until the download is complete. We can listen to events on the stream to handle both of these cases.

Let's start by rearranging the code above. We'll get individual handles to the Got stream and the file writer stream.

```javascript
const got = require("got");
const { createWriteStream } = require("fs");

const url = "https://media0.giphy.com/media/4SS0kfzRqfBf2/giphy.gif";
const fileName = "image.gif";

const downloadStream = got.stream(url);
const fileWriterStream = createWriteStream(fileName);
```

Now, before we pipe the `downloadStream` into the `fileWriterStream` attach some event listeners.

To get feedback on the progress of the download we can listen to the `downloadProgress` event on the `downloadStream`. The event fires with an object with 3 properties:

* `transferred`: the number of bytes transferred so far
* `total`: the total number of bytes
* `percent`: the proportion of the transfer that is complete (between 0 and 1)

If the server you are downloading from doesn't return a `Content-Length` header for the file, then `total` will be undefined and `percent` will be 0 until the download is complete.

We can handle errors on both the `downloadStream` and `fileWriterStream` by listening for the `error` event. It is good to handle both of these errors as it gives us information over what failed. If the `downloadStream` emits an error then there is a problem with the URL, the network or the remote server. If the `fileWriterStream` emits an error then there is a problem with the file system.

For one last piece of feedback, we can also listen to the [`finish` event](https://nodejs.org/api/stream.html#stream_event_finish) on the `fileWriterStream`. This event is fired once all data has been written to the file system.

Let's complete the above code by adding these events and piping the `downloadStream` to the `fileWriterStream`.

```javascript
const got = require("got");
const { createWriteStream } = require("fs");

const url = "https://media0.giphy.com/media/4SS0kfzRqfBf2/giphy.gif";
const fileName = "image.gif";

const downloadStream = got.stream(url);
const fileWriterStream = createWriteStream(fileName);

downloadStream
  .on("downloadProgress", ({ transferred, total, percent }) => {
    const percentage = Math.round(percent * 100);
    console.error(`progress: ${transferred}/${total} (${percentage}%)`);
  })
  .on("error", (error) => {
    console.error(`Download failed: ${error.message}`);
  });

fileWriterStream
  .on("error", (error) => {
    console.error(`Could not write file to system: ${error.message}`);
  })
  .on("finish", () => {
    console.log(`File downloaded to ${fileName}`);
  });

downloadStream.pipe(fileWriterStream);
```

If you run the above code in a terminal you will see your download progress logged to the terminal and the image will be downloaded successfully.

<figure class="post-image post-image-outside">
  <img src="/posts/got-download.png" alt="Running the code shows the download progress up to 100% then displays that the image has been downloaded." loading="lazy">
  </picture>
</figure>

## Getting fancy with more stream methods

Using streams to download files is more efficient than Got's promise methods, but the code above has taken a bit of a backward step in terms of developer experience. Rather than dealing with promises, which could be simplified with `async/await`, we now have to handle events with calbacks.

We can get back to this experience using the [Stream module `pipeline` function](https://nodejs.org/api/stream.html#stream_stream_pipeline_streams_callback). `pipeline` takes a number of streams as arguments and pipes the data between them. It also takes a callback function which is called if there is an error within the pipeline or once the pipeline is finished.

This still deals with callbacks, but we can use the Util module's `promisify` function to turn it into a promise.

Putting this together, we can simplify the above code to the following:

```javascript
const got = require("got");
const { createWriteStream } = require("fs");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

const url = "https://media0.giphy.com/media/4SS0kfzRqfBf2/giphy.gif";
const fileName = "image.gif";

const downloadStream = got.stream(url);
const fileWriterStream = createWriteStream(fileName);

downloadStream.on("downloadProgress", ({ transferred, total, percent }) => {
  const percentage = Math.round(percent * 100);
  console.error(`progress: ${transferred}/${total} (${percentage}%)`);
});

pipeline(downloadStream, fileWriterStream)
  .then(() => console.log(`File downloaded to ${fileName}`))
  .catch((error) => console.error(`Something went wrong. ${error.message}`));
```

Or adding in `async/await` for the final step:

```javascript
(async () => {
  try {
    await pipeline(downloadStream, fileWriterStream);
    console.log(`File downloaded to ${fileName}`);
  } catch (error) {
    console.error(`Something went wrong. ${error.message}`);
  }
})();
```

## Node streams are cool 😎

Downloading a file is just one use of Node streams, you can find streams popping up all over the place. In this post we used a readable stream to download the file and a writable stream to write it to disk. You can also create readable streams of files and, if you are making `POST` requests with Got, you can stream the upload of data too. Objects like `process.stdin`, `process.stdout` and `process.stderr` are streams, as are HTTP [requests](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [responses](https://nodejs.org/api/http.html#http_class_http_serverresponse).

For more on streams, check the [Node.js stream documentation](https://nodejs.org/api/stream.html#stream_stream) and, for more in depth understanding, this guide on [backpressuring in streams](https://nodejs.org/en/docs/guides/backpressuring-in-streams/).