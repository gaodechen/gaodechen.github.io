Jekyll::Hooks.register :site, :after_init do |site|
  require 'css_parser'
  require 'digest'
  require 'fileutils'
  require 'nokogiri'
  require 'open-uri'
  require 'uri'

  font_file_types = ['otf', 'ttf', 'woff', 'woff2']
  image_file_types = ['.gif', '.jpg', '.jpeg', '.png', '.webp']

  def download_and_change_rule_set_url(rule_set, rule, dest, dirname, config, file_types)

    if rule_set[rule].include?('url(')

      url = rule_set[rule].split('url(').last.split(')').first

      if url.start_with?('"') || url.start_with?("'")
        url = url[1..-2]
      end

      file_name = url.split('/').last.split('?').first

      if file_name.end_with?(*file_types)

        unless url.start_with?('https://')
          url = URI.join(url, url).to_s
        end

        download_file(url, File.join(dest, file_name))

        previous_rule = rule_set[rule]
        if config['baseurl']

          if rule_set[rule].split(' ').length > 1
            rule_set[rule] = "url(#{File.join(config['baseurl'], 'assets', 'libs', dirname, file_name)}) #{rule_set[rule].split(' ').last}"
          else
            rule_set[rule] = "url(#{File.join(config['baseurl'], 'assets', 'libs', dirname, file_name)})"
          end
        else

          if rule_set[rule].split(' ').length > 1
            rule_set[rule] = "url(#{File.join('/assets', 'libs', dirname, file_name)}) #{rule_set[rule].split(' ').last}"
          else
            rule_set[rule] = "url(#{File.join('/assets', 'libs', dirname, file_name)})"
          end
        end
        puts "Changed #{previous_rule} to #{rule_set[rule]}"
      end
    end
  end

  def download_file(url, dest)

    if url.start_with?('|')
      return
    end

    dir = File.dirname(dest)
    unless File.directory?(dir)
      FileUtils.mkdir_p(dir)
    end

    unless File.file?(dest)
      puts "Downloading #{url} to #{dest}"
      File.open(dest, "wb") do |saved_file|
        URI(url).open("rb") do |read_file|
          saved_file.write(read_file.read)
        end
      end

      unless File.file?(dest)
        raise "Failed to download #{url} to #{dest}"
      end
    end
  end

  def download_fonts(url, dest, file_types)

    if url.start_with?('|')
      return
    end

    unless File.directory?(dest) && !Dir.empty?(dest)
      puts "Downloading fonts from #{url} to #{dest}"

      doc = Nokogiri::HTML(URI(url).open("User-Agent" => "Ruby/#{RUBY_VERSION}"))
      doc.css('a').each do |link|

        file_name = link['href'].split('/').last.split('?').first

        if file_name.end_with?(*file_types)

          download_file(URI.join(url, link['href']).to_s, File.join(dest, file_name))
        end
      end
    end
  end

  def download_images(url, dest, file_types)

    if url.start_with?('|')
      return
    end

    unless File.directory?(dest) && !Dir.empty?(dest)
      puts "Downloading images from #{url} to #{dest}"

      doc = Nokogiri::HTML(URI(url).open("User-Agent" => "Ruby/#{RUBY_VERSION}"))
      doc.xpath('/html/body/div/div[3]/table/tbody/tr/td[1]/a').each do |link|

        file_name = link['href'].split('/').last.split('?').first

        if file_name.end_with?(*file_types)

          download_file(URI.join(url, link['href']).to_s, File.join(dest, file_name))
        end
      end
    end
  end

  def download_fonts_from_css(config, url, dest, lib_name, file_types)

    if url.start_with?('|')
      return
    end

    file_name = url.split('/').last.split('?').first

    if file_name == 'css'
      file_name = 'google-fonts.css'
    end

    unless File.file?(File.join(dest, file_name))
      puts "Downloading fonts from #{url} to #{dest}"

      doc = Nokogiri::HTML(URI(url).open("User-Agent" => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"))
      css = CssParser::Parser.new
      css.load_string! doc.document.text

      css.each_rule_set do |rule_set|

        download_and_change_rule_set_url(rule_set, 'src', File.join(dest, 'fonts'), File.join(lib_name, 'fonts'), config, file_types)
      end

      puts "Saving modified css file to #{File.join(dest, file_name)}"
      File.write(File.join(dest, file_name), css.to_s)
    end

    return file_name
  end

  site.config['third_party_libraries'].each do |key, value|
    if key != 'download'
      value['url'].each do |type, url|

        if url.is_a?(Hash)
          url.each do |type2, url2|

            if url2.include?('{{version}}')
              site.config['third_party_libraries'][key]['url'][type][type2] = url2.gsub('{{version}}', site.config['third_party_libraries'][key]['version'])
            end
          end
        else

          if url.include?('{{version}}')
            site.config['third_party_libraries'][key]['url'][type] = url.gsub('{{version}}', site.config['third_party_libraries'][key]['version'])
          end
        end
      end
    end
  end

  if site.config['third_party_libraries']['download']
    site.config['third_party_libraries'].each do |key, value|
      if key != 'download'
        value['url'].each do |type, url|

          if url.is_a?(Hash)
            url.each do |type2, url2|

              file_name = url2.split('/').last.split('?').first

              dest = File.join(site.source, 'assets', 'libs', key, file_name)
              download_file(url2, dest)

              if site.config['baseurl']
                site.config['third_party_libraries'][key]['url'][type][type2] = File.join(site.config['baseurl'], 'assets', 'libs', key, file_name)
              else
                site.config['third_party_libraries'][key]['url'][type][type2] = File.join('/assets', 'libs', key, file_name)
              end
            end

          else
            if type == 'fonts'

              file_name = url.split('/').last.split('?').first

              if file_name.end_with?('css')

                file_name = download_fonts_from_css(site.config, url, File.join(site.source, 'assets', 'libs', key), key, font_file_types)

                if site.config['baseurl']
                  site.config['third_party_libraries'][key]['url'][type] = File.join(site.config['baseurl'], 'assets', 'libs', key, file_name)
                else
                  site.config['third_party_libraries'][key]['url'][type] = File.join('/assets', 'libs', key, file_name)
                end
              else

                download_fonts(url, File.join(site.source, 'assets', 'libs', key, site.config['third_party_libraries'][key]['local'][type]), font_file_types)
              end

            elsif type == 'images'

              download_images(url, File.join(site.source, 'assets', 'libs', key, site.config['third_party_libraries'][key]['local'][type]), image_file_types)

            else

              file_name = url.split('/').last.split('?').first

              dest = File.join(site.source, 'assets', 'libs', key, file_name)
              download_file(url, dest)

              if site.config['baseurl']
                site.config['third_party_libraries'][key]['url'][type] = File.join(site.config['baseurl'], 'assets', 'libs', key, file_name)
              else
                site.config['third_party_libraries'][key]['url'][type] = File.join('/assets', 'libs', key, file_name)
              end
            end
          end
        end
      end
    end
  end
end
