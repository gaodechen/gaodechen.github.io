

module Jekyll
  module CleanString
    class RemoveAccents
      require 'i18n'
      I18n.config.available_locales = :en

      attr_accessor :string

      def initialize(string:)
        self.string = string
      end

      def digest!
        remove_accents
      end

      private

      def remove_accents
        I18n.transliterate(string)
      end
    end

    def remove_accents(string)
      RemoveAccents.new(string: string).digest!
    end
  end
end

Liquid::Template.register_filter(Jekyll::CleanString)
