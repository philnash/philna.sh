require 'zlib'

module Jekyll
  class Gzip
    ZIPPABLE_EXTENSIONS = [
      '.html',
      '.css',
      '.js',
      '.txt',
      '.ttf',
      '.atom',
      '.stl',
      '.xml',
      '.svg',
      '.eot'
    ]

    def self.compress(site)
      site.each_site_file do |file|
        original = file.destination(site.dest)
        next unless ZIPPABLE_EXTENSIONS.include?(File.extname(original))
        zipped = "#{original}.gz"
        Zlib::GzipWriter.open(zipped, Zlib::BEST_COMPRESSION) do |gz|
          gz.mtime = File.mtime(original)
          gz.orig_name = original
          gz.write IO.binread(original)
        end
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  Jekyll::Gzip.compress(site)
end