---
title: "The yaml document from hell — JavaScript edition"
tags:
  - javascript
  - yaml
image: /posts/yaml/yaml-header.png
imageAlt: "The yaml logo and two emoji, one shrugging and the other face palming"
imageWidth: 1920
imageHeight: 600
socialImage: /posts/yaml/yaml-social.png
pubDate: "2023-02-02"
---

I recently came across this [blog post from Ruud van Asseldonk titled "The yaml document from hell"](https://ruudvanasseldonk.com/2023/01/11/the-yaml-document-from-hell). I've always heard that yaml has its pitfalls, but hadn't looked into the details and thankfully hadn't been affected, mainly due to my very infrequent and simple use of yaml. If you are in the same boat as me, I recommend reading [that article](https://ruudvanasseldonk.com/2023/01/11/the-yaml-document-from-hell) now as I almost can't believe I've avoided any issues with it.

The article digs into the issues in the yaml spec itself, and then describes what happens in Python's [PyYAML](https://pypi.org/project/PyYAML/6.0/) and [Golang's yaml library](https://github.com/go-yaml/yaml) with an example file, the titular yaml document from hell. I wanted to see how things were in the JavaScript ecosystem.

## Yaml in JavaScript

A search for JavaScript yaml parsers on npm brings up [yaml](https://github.com/eemeli/yaml/) (which I have used in [my own project](https://github.com/philnash/ngrok-for-vscode)) and [js-yaml](https://github.com/nodeca/js-yaml). js-yaml has the [most weekly downloads according to npm and the most stars on GitHub](https://npmtrends.com/js-yaml-vs-yaml) however yaml seems to be under more active development, having been most recently published (a month ago at the time of writing) compared to js-yaml's last publish date almost 2 years ago. There is also [yamljs](https://github.com/jeremyfa/yaml.js), but the project hasn't received a commit since November 2019 and hasn't been released for 6 years, so I am going to disregard it for now.

Let's see what yaml and js-yaml do with the yaml document from hell.

## The document itself

To save yourself from going back and forth between [van Asseldonk's article](https://ruudvanasseldonk.com/2023/01/11/the-yaml-document-from-hell) and this one, here is the yaml document.

```yaml
server_config:
  port_mapping:
    # Expose only ssh and http to the public internet.
    - 22:22
    - 80:80
    - 443:443

  serve:
    - /robots.txt
    - /favicon.ico
    - *.html
    - *.png
    - !.git  # Do not expose our Git repository to the entire world.

  geoblock_regions:
    # The legal team has not approved distribution in the Nordics yet.
    - dk
    - fi
    - is
    - no
    - se

  flush_cache:
    on: [push, memory_pressure]
    priority: background

  allow_postgres_versions:
    - 9.5.25
    - 9.6.24
    - 10.23
    - 12.13
```

So how do our JavaScript libraries handle this file?

## The failures

### Anchors, aliases, and tags

Let's start with the failures. As described in [the original article under the subhead "Anchors, aliases, and tags"](https://ruudvanasseldonk.com/2023/01/11/the-yaml-document-from-hell#anchors-aliases-and-tags) this section is invalid:

```yaml
  serve:
    - /robots.txt
    - /favicon.ico
    - *.html
    - *.png
    - !.git  # Do not expose our Git repository to the entire world.
```

This causes both of our JavaScript yaml libraries to throw an error, both referencing an undefined alias. This is because the `*` is a way to reference an anchor created earlier in the document using an `&`. In our document's case, that anchor was never created, so this is a parsing error.

If you want to learn more about anchors and aliases it seems like something that is important in build pipelines. Both [Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/yaml-anchors/) and [GitLab](https://docs.gitlab.com/ee/ci/yaml/yaml_optimization.html) have written about how to use anchors to avoid repeating sections in yaml files.

For the purposes of trying to get the file to parse, we can make those aliases strings as they were likely intended.

```yaml
  serve:
    - /robots.txt
    - /favicon.ico
    - "*.html"
    - "*.png"
    - !.git  # Do not expose our Git repository to the entire world.
```

Now we get another parsing error from our libraries; both of them complain about an unknown or unresolved tag. The `!` at the start of `!.git` is the character triggering this behaviour.

Tags seem to be the most complicated part of yaml to me. They depend on the parser you are using and allow that parser to do something custom with the content that follows the tag. My understanding is that you could use this in JavaScript to, say, tag some content to be parsed into a `Map` instead of an `Object` or a `Set` instead of an `Array`. Van Asseldonk explains this with this alarming sentence:

> This means that **loading an untrusted yaml document is generally unsafe**, as it may lead to arbitrary code execution.

PyYaml apparently has a `safe_load` method that will avoid this, but Go's yaml package doesn't. It seems that the JavaScript libraries also lack this feature, so the warning for untrusted yaml documents stands.

If you do want to take advantage of the tag feature in yaml, you can check out the [yaml package's documentation on custom data types](https://eemeli.org/yaml/#custom-data-types) or [js-yaml's supported yaml types](https://github.com/nodeca/js-yaml#supported-yaml-types) and [unsafe type extensions](https://github.com/nodeca/js-yaml-js-types).

To make the yaml file parse, let's encase all the weird yaml artifacts in quotes to make them strings:

```yaml
  serve:
    - /robots.txt
    - /favicon.ico
    - "*.html"
    - "*.png"
    - "!.git"  # Do not expose our Git repository to the entire world.
```

With the `serve` block looking it does above, the file now parses. So what happens to the rest of the potential yaml gotchas?

### Accidental numbers

One thing that I am gathering from this investigation so far is that if you need something to be a string, do not be ambiguous about it, surround it in quotes. That counted for the aliases and tags above and it also counts for accidental numbers. In the following section of the yaml file you see a list of version numbers:

```yaml
  allow_postgres_versions:
    - 9.5.25
    - 9.6.24
    - 10.23
    - 12.13
```

Version numbers are strings, numbers can't have more than one decimal point in them. But when this is parsed by either JavaScript library the result is as follows:

```javascript
  allow_postgres_versions: [ '9.5.25', '9.6.24', 10.23, 12.13 ]
```

Now we have an array of strings and numbers. If a yaml parser thinks something looks like a number it will parse it as such. And when you come to use those values they might not act as you expect.

#### Version numbers in GitHub Actions

I have had this issue within GitHub Actions before. It was [in a Ruby project](https://github.com/philnash/bitly/blob/main/.github/workflows/tests.yml#L11), but this applies to anyone trying to use version numbers in a GitHub Actions yaml file. I tried to use a list of Ruby version numbers, this worked fine up until Ruby version 3.1 was released. I had `3.0` in the array. Within GitHub Actions this was parsed as the integer `3`. This might seem fine, except that when you give an integer version to GitHub Actions it picks the latest minor point for that version. So, once Ruby 3.1 was released, the number `3.0` would select version 3.1. I had to make the version number a string, `"3.0"`, and then it was applied correctly.

Accidental numbers cause issues. If you need a string, make sure you provide a string.

## The successes

It's not all bad in the JavaScript world. After working through the issues above, we might now be in the clear. Let's take a look now at what parsed correctly from this yaml file.

### Sexagesimal numbers

Under the port mapping section of the yaml file we see:

```yaml
  port_mapping:
    # Expose only ssh and http to the public internet.
    - 22:22
    - 80:80
    - 443:443
```

That `22:22` is dangerous in yaml version 1.1 and PyYaml parses it as a sexagesimal (base 60) number, giving the result of `1342`. Thankfully both JavaScript libraries have implemented yaml 1.2 and `22:22` is parsed correctly as a string in this case.

```javascript
  port_mapping: [ '22:22', '80:80', '443:443' ]
```

### The Norway problem

In yaml 1.1 `no` is parsed as `false`. This is known as "the Norway problem" because listing countries as two character identifiers is fairly common and having this yaml:

```yaml
  geoblock_regions:
    - dk
    - fi
    - is
    - no
    - se
```

parsed into this JavaScript:

```javascript
  geoblock_regions: [ 'dk', 'fi', 'is', false, 'se' ]
```

is just not helpful. The good news is that, [unlike Go's yaml library](https://github.com/go-yaml/yaml/tree/v3.0.1#compatibility), both JavaScript libraries have implemented yaml 1.2 and dropped `no` as an alternative for `false`. The `geoblock_regions` sections is successfully parsed as follows:

```javascript
  geoblock_regions: [ 'dk', 'fi', 'is', 'no', 'se' ]
```

### Non-string keys

You might believe that keys in yaml would be parsed as strings, like JSON. However they can be any value. Once again there are values that may trip you up. Much like with the Norway problem in which `yes` and `no` can be parsed as `true` and `false`, the same goes for `on` and `off`. This is manifested in our yaml file in the `flush_cache` section:

```yaml
  flush_cache:
    on: [push, memory_pressure]
    priority: background
```

Here the key is `on`, but in some libraries it is parsed as a boolean. In Python, even more confusingly the boolean is then stringified and appears as the key `"True"`. Thankfully this is handled by the JavaScript libraries and `on` becomes the key `"on"`.

```javascript
  flush_cache: { on: [ 'push', 'memory_pressure' ], priority: 'background' }
```

This is of particular concern in GitHub Actions again, where `on` is used to determine what events should trigger an Action. I wonder if GitHub had to work around this when implementing their parsing.

## Parsing as yaml version 1.1

Many of the issues that our JavaScript libraries sidestep are problems from yaml 1.1 and both libraries have fully implemented yaml 1.2. If you do wish to throw caution to the wind, or you have to parse a yaml file explicitly with yaml 1.1 settings, the [yaml](https://github.com/eemeli/yaml/) library can do that for you. You can pass a second argument to the `parse` function to tell it to use version 1.1, like so:

```javascript
import { parse } from "yaml";
const yaml = parse(yamlContents, { version: "1.1" });
console.log(yaml);
```

Now you get a result with all of the fun described above:

```javascript
{
  server_config: {
    port_mapping: [ 1342, '80:80', '443:443' ],
    serve: [ '/robots.txt', '/favicon.ico', '*.html', '*.png', '!.git' ],
    geoblock_regions: [ 'dk', 'fi', 'is', false, 'se' ],
    flush_cache: { true: [ 'push', 'memory_pressure' ], priority: 'background' },
    allow_postgres_versions: [ '9.5.25', '9.6.24', 10.23, 12.13 ]
  }
}
```

Note that in this case I left the aliases and tags quoted as strings so that the file could be parsed successfully.

Stick with version 1.2, the default in both JavaScript yaml libraries, and you'll get a much more sensible result.

## Isn't yaml fun?

In this post we've seen that it's easy to write malformed yaml if you weren't aware of aliases or tags. It's also easy to write mixed arrays of strings and numbers. There are also languages and libraries in which yaml 1.1 is still hanging around and `on`. `yes`, `off`, and `no` are booleans and some numbers can be parsed into base 60.

My advice, after going through all of this, is to err on the side of caution when writing yaml. If you want a key or a value to be a string, surround it in quotes and explicitly make it a string.

On the other hand, if you are parsing someone else's yaml then you will need to program defensively and try to handle the edge cases, like accidental numbers, that can still cause issues.

Finally, if you have the option, choose a different format to yaml. Yaml is supposed to be human-friendly, but the surprises and the bugs that it can produce are certainly not developer-friendly and ultimately that defeats the purpose.

The [conclusion to the original yaml document from hell post suggests many alternatives to yaml](https://ruudvanasseldonk.com/2023/01/11/the-yaml-document-from-hell#alternative-configuration-formats) that will work better. I can't help but think that in the world of JavaScript that something JSON based, but  friendlier to author, should be the solution.

There is a package that simply [strips comments from JSON](https://www.npmjs.com/package/strip-json-comments) or there's [JSON5](https://www.npmjs.com/package/json5) a JSON format that aims to be easier to write and maintain by hand. JSON5 supports comments as well as trailing commas, multiline strings, and various number formats. Either of these are a good start if you want to make authoring JSON easier and parsing hand authored files more consistent.

If you can avoid yaml, I recommend it. If you can't, good luck.