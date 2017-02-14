if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

document.addEventListener('DOMContentLoaded', function(event) {
  var shareLinks = [].slice.call(document.querySelectorAll('.share'));
  shareLinks.forEach(function(link) {
    link.addEventListener('click', function (event) {
      if (typeof navigator.share !== 'undefined') {
        var canonicalElement = document.querySelector('link[rel=canonical]');
        if(canonicalElement !== undefined) {
          var url = canonicalElement.href;
        } else {
          var url = window.location.href;
        }
        var pageTitle = document.querySelector('.post-title').textContent;
        return navigator.share({ title: pageTitle, url: url })
          .then(function() { return false; })
          .catch(function(err) { return true; });
      }
    })
  })
});
