module Jekyll
  module Drops
    class SiteDrop
      def date
        @date ||= time.to_datetime
      end
    end
  end
end