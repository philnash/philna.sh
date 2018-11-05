require 'webp-ffi'
require 'jekyll-assets'
require 'pathname'

module Jekyll
  module WebP
    class Transformer
      TRANSFORMABLE_EXTENSIONS = [
        '.jpg',
        '.jpeg',
        '.png'
      ]
      
      def initialize(path)
        @path = path
      end

      def transform
        files = Dir.glob(@path + "**/*{#{TRANSFORMABLE_EXTENSIONS.join(',')}}")
        files.each { |file| transform_file(file) }
      end

      def transform_file(file_name)
        extension = File.extname(file_name)
        return unless TRANSFORMABLE_EXTENSIONS.include?(extension)
        compressed = "#{file_name}.webp"
        if extension == '.png'
          ::WebP.encode(file_name, compressed, lossless: 1, quality: 100, method: 6)
        else
          ::WebP.encode(file_name, compressed, quality: 75)
        end
        File.delete(compressed) if File.size(compressed) > File.size(file_name)
      end
    end
  end
end

Jekyll::Assets::Hook.register :env, :after_write do |env, something|
  if Jekyll.env == "production"
    path = Pathname.new("#{env.jekyll.config["destination"]}#{env.prefix_url}")
    Jekyll::WebP::Transformer.new(path).transform
  end
end