---
title: "gzip a file in Ruby"
tags:
  - ruby
  - gzip
  - zlib
  - file compression
image: ../../assets/posts/gzip/gzip-ruby.png
imageAlt: "An icon of a vice squeezing a ruby gem"
imageWidth: 1920
imageHeight: 600
pubDate: "2018-02-25"
---

At the start of the year I looked into how to better compress the output of a [Jekyll](https://jekyllrb.com/) site. I'll write up the results to that soon. For now, here's how to gzip a file using Ruby.

## Enter zlib

Contained within the Ruby standard library is the [`Zlib` module](http://ruby-doc.org/stdlib-2.5.0/libdoc/zlib/rdoc/Zlib.html) which gives access to the underlying [zlib library](https://zlib.net/). It is used to read and write files in gzip format. Here's a small program to read in a file, compress it and save it as a gzip file.

```ruby
require "zlib"

def compress_file(file_name)
  zipped = "#{file_name}.gz"

  Zlib::GzipWriter.open(zipped) do |gz|
    gz.write IO.binread(file_name)
  end
end
```

You can use any IO or IO-like object with `Zlib::GzipWriter`.

We can enhance this by adding the files original name into the compressed output. Also, it can be beneficial to set the file's modified time to the same as the original, particularly if you are using the file with [nginx's `gzip_static` module](http://nginx.org/en/docs/http/ngx_http_gzip_static_module.html).

```ruby
require "zlib"

def compress_file(file_name)
  zipped = "#{file_name}.gz"

  Zlib::GzipWriter.open(zipped) do |gz|
    gz.mtime = File.mtime(file_name)
    gz.orig_name = file_name
    gz.write IO.binread(file_name)
  end
end
```

Just to see how well this is working, we can print some statistics from the compression.

```ruby
require "zlib"

def print_stats(file_name, zipped)
  original_size = File.size(file_name)
  zipped_size = File.size(zipped)
  percentage_difference = ((original_size - zipped_size).to_f/original_size)*100
  puts "#{file_name}: #{original_size}"
  puts "#{zipped}: #{zipped_size}"
  puts "difference - #{'%.2f' % percentage_difference}%"
end

def compress_file(file_name)
  zipped = "#{file_name}.gz"

  Zlib::GzipWriter.open(zipped) do |gz|
    gz.mtime = File.mtime(file_name)
    gz.orig_name = file_name
    gz.write IO.binread(file_name)
  end

  print_stats(file_name, zipped)
end
```

Now you can pick a file and compress it with Ruby and gzip. For this quick test, I chose the uncompressed, unminified jQuery version 3.3.1. The results were:

```
./jquery.js: 271751
./jquery.js.gz: 80669
difference - 70.32%
```

Pretty good, but we can squeeze more out of it if we try a little harder.

## Compression levels

`Zlib::GzipWriter` takes a second argument to `open` which is the level of compression zlib applies. 0 is no compression and 9 is the best possible compression and there's a trade off as you progress from 0 to 9 between speed and compression. The default compression is a good compromise between speed and compression, but if time isn't a worry for you then you might as well make the file as small as possible, especially if you want to serve it over the web. To set the compression level to 9 you can just use the integer, but `Zlib` has a convenient constant for it: `Zlib::BEST_COMPRESSION`.

Changing the line with `Zlib::GzipWriter` in it to:

```ruby
  Zlib::GzipWriter.open(zipped, Zlib::BEST_COMPRESSION) do |gz|
```

and running the file against jQuery again gives you:

```
./jquery.js: 271751
./jquery.js.gz: 80268
difference - 70.46%
```

A difference of 0.14 percentage points! Ok, not a huge win, but if the time to generate the file doesn't matter then you might as well. And the difference is greater on even larger files.

## Streaming gzip

There's one last thing you might want to add. If you are compressing really large files, loading them entirely into memory isn't the most efficient way to work. Gzip is a streaming format though, so you can write chunks at a time to it. In this case, you just need to read the file you are compressing incrementally and write the chunks to the `GzipWriter`. Here's what it would look like to read the file in chunks of 16kb:

```ruby
def compress_file(file_name)
  zipped = "#{file_name}.gz"

  Zlib::GzipWriter.open(zipped, Zlib::BEST_COMPRESSION) do |gz|
    gz.mtime = File.mtime(file_name)
    gz.orig_name = file_name
    File.open(file_name) do |file|
      while chunk = file.read(16*1024) do
        gz.write(chunk)
      end
    end
  end
end
```

## gzip in Ruby

So that is how to gzip a file using Ruby and zlib, as well as how to add extra information and control the compression level to balance speed against final filesize. All of this went into a gem I created recently to use maximum gzip compression on the output of a Jekyll site. The gem is called [jekyll-gzip](https://github.com/philnash/jekyll-gzip) and I'll be writing more about it, as well as other tools that are better than the zlib implementation of gzip, soon.



<footer>
  <small>Header icons: <a href="https://thenounproject.com/term/diamond/315/">Diamond by Edward Boatman</a> and <a href="https://thenounproject.com/search/?q=vice&i=1554537">vice by Daniel Luft</a> from the Noun Project.</small>
</footer>
