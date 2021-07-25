---
layout: post
title: "Mistakes I've made treating file paths as strings"
tags:
  - ruby
  - node
  - strings
image: posts/paths
image_alt: "A terminal font with the text path/to/trouble"
image_width: 1920
image_height: 600
---

Some things you do as a developer can work for you for years, then turn around and bite you when you were least expecting. These are the things that you wish another developer had told you early in your career so you never had to make the mistakes. This post is about one of those things and if you're reading this, consider it me telling you.

File paths look like strings. You have a number of directories and maybe a file name with an extension at the end. You separate the directories and files with a `/` character and the result looks like `/path/to/file`. So you can treat them like strings, joining them or concatenating them until you pass them to another file method that is used to read from or write to the file. These were my thoughts from just a few months ago. Here's where I was wrong.

## Don't forget Windows

If you develop on a Mac, like I have the privilege of doing, or Linux then you might have read the above paragraph and not noticed anything wrong. If develop on Windows you probably sighed into your cup of coffee as you read the `/` character.

It's all too easy to forget when you work with a Mac and deploy to Linux environments, like I have done for years, that [Windows uses backslashes](https://www.howtogeek.com/181774/why-windows-uses-backslashes-and-everything-else-uses-forward-slashes/). It's all too painful to find out you've made that mistake when you work on a command line tool that needs to run on both types of platform. [create-twilio-function](https://github.com/twilio-labs/create-twilio-function) is one such command line tool that had to go through a [number](https://github.com/twilio-labs/create-twilio-function/commit/af3031dcd5947a2abb735f7769bcd8fdb7e1aa73) [of changes](https://github.com/twilio-labs/create-twilio-function/commit/fa281c1fce15db0915a8b403c4d19b9b2422da99) from things like:

```javascript
mkdir(path + '/' + dirName);
```

to

```javascript
const path = require('path');
mkdir(path.join(pathName, dirName));
```

so that it would work properly on Windows.

To Windows users, I'm sorry. To everyone else, when working with Node.js the [`path` module](https://nodejs.org/api/path.html) is your friend. Use [`path.join`](https://nodejs.org/api/path.html#path_path_join_paths) whenever you have to join two paths. And check out other utilities like [`path.relative`](https://nodejs.org/api/path.html#path_path_relative_from_to), which returns a relative path from one path to another, and [`path.normalize`](https://nodejs.org/api/path.html#path_path_normalize_path), which returns a path resolving segments like `.` or `..`.

Pay no attention to [`path.sep`](https://nodejs.org/api/path.html#path_path_sep), which returns a `/` or a `\` depending on the system you're working on, just use `path.join`.

## Paths behave differently to strings

To my second mistake, this time working in Ruby. This one was slightly more subtle and evaded my tests. You see, you can use the `Pathname` class to create fragments of paths and then concatenate them. For example:

```ruby
require "pathname"
path1 = Pathname.new("path")
path2 = Pathname.new("to")
path1 + path2
# => #<Pathname:path/to>
```

As you can see `Pathname` objects have a `+` operator that concatenates the paths, much like `+` concatenates strings. In fact, it also works with a mix of strings and paths:

```ruby
require "pathname"
path1 = Pathname.new("path")
path2 = "to"
path1 + path2
# => #<Pathname:path/to>
```

This all seems well and good, except it doesn't work the other way around.

```ruby
require "pathname"
path1 = "to"
path2 = Pathname.new("path")
path1 + path2
# => TypeError (no implicit conversion of Pathname into String)
```

A nice error like that means we've done something wrong, that was not the problem I had though. No, the issue I had stemmed from expecting to concatenate a pathname and a string and instead concatenating two strings. This manifested itself in [my Rubygem `jekyll-gzip`](https://github.com/philnash/jekyll-gzip/). You see, I was trying to create a glob of paths with the line:

```ruby
files = Dir.glob(dir + "**/*{#{extensions}}")
```

It turned out under some circumstances `dir` was actually a string instead of a pathname and it didn't include a separator. So the glob was looking for `"dirname**/*{#{extensions}}"` when I really wanted it to look for `"dirname/**/*{#{extensions}}"`. Concatenating two pathnames or a pathname and a string will add the separator ([as someone pointed out in a comment on my commit](https://github.com/philnash/jekyll-gzip/commit/6651b7f51b62cd14a3e256d77fa604a49eacb9d8#diff-392aaa6a279f62e98df890fff8d82d1eL54-R54)), but concatenating two strings will not. This meant that the gem happily went looking for the wrong pathname, found no files and then proceeded to successfully do nothing. Replacing the entire line with:

```ruby
files = Dir.glob(File.join(dir, "**", "*{#{extensions}}"))
```

fixed the issue. In this case [`File.join`](https://ruby-doc.org/core-2.6.2/File.html#method-c-join) is the method to use to avoid surprises with strings.

## Always use the built in path tools

Whether you're working in Node.js, Ruby, or any other language do not be tempted to treat file paths as strings. They behave differently on different platforms and mixing paths and strings together can cause hard to debug errors.

Use your standard library and save yourself the hassle.