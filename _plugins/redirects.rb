module Jekyll
  class Redirects < Jekyll::Generator
    MAP = {
      "/@phil" => "https://mastodon.social/@philnash"
    }

    def redirects
      MAP.map { |k, v| "#{k} #{v}" }.join("\n")
    end

    def generate(site)
      destination = site.config["destination"]
      filename = File.join(destination, "_redirects")
      puts redirects
      File.open(filename, "w") do |file|
        file.write redirects
      end
    end
  end
end

Jekyll::Hooks.register :site, :after_init do |site|
  keep_files = site.config["keep_files"] || []
  site.config["keep_files"] = keep_files.push("_redirects").uniq
end