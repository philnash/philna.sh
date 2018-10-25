require 'webp-ffi'

module Jekyll
  module Webp
    class Transformer
      TRANSFORMABLE_EXTENSIONS = [
        '.jpg',
        '.jpeg',
        '.png'
      ]

      attr_reader :site
      def initialize(site)
        @site = site
      end

      def transform
        site.each_site_file do |file|
          transform_file(file.destination(site.dest))
        end
      end

      def transform_file(file_name)
        extension = File.extname(file_name)
        return unless TRANSFORMABLE_EXTENSIONS.include?(extension)
        compressed = "#{file_name}.webp"
        if extension == '.png'
          WebP.encode(file_name, compressed, lossless: 1)
        else
          WebP.encode(file_name, compressed)
        end
        File.delete(compressed) if File.size(compressed) > File.size(file_name)
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_write do |site|
  Jekyll::Webp::Transformer.new(site).transform
end