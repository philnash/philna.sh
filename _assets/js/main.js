document.addEventListener('DOMContentLoaded', function(event) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  var shareLinks = [].slice.call(document.querySelectorAll('.share'));
  shareLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      if (typeof navigator.share !== 'undefined') {
        event.preventDefault();
        var canonicalElement = document.querySelector('link[rel=canonical]');
        if (canonicalElement !== undefined) {
          var url = canonicalElement.href;
        } else {
          var url = window.location.href;
        }
        var pageTitle = document.querySelector('.post-title').textContent;
        navigator
          .share({ title: pageTitle, url: url })
          .then(function() {
            // track successful share
            ga('send', {
              hitType: 'event',
              eventCategory: 'Post',
              eventAction: 'share',
              eventLabel: 'success'
            });
          })
          .catch(function(err) {
            // track unsuccessful share
            ga('send', {
              hitType: 'event',
              eventCategory: 'Post',
              eventAction: 'share',
              eventLabel: 'fail'
            });
            window.open(event.target.href);
          });
        return false;
      } else {
        // track share click
        ga('send', {
          hitType: 'event',
          eventCategory: 'Post',
          eventAction: 'share',
          eventLabel: 'click'
        });
      }
    });
  });
});
