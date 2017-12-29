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
        File.open zipped, "w+" do |compressed_io|
          compressed_io << Zlib::Deflate.deflate(File.read(original), Zlib::BEST_COMPRESSION)
        end
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  Jekyll::Gzip.compress(site)
end