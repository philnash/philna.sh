module Jekyll
  module Drops
    class SiteDrop
      def date
        @date ||= time.to_date
      end
    end
  end
end