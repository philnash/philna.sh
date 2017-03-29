function getCanonicalUrl() {
  var canonicalElement = document.querySelector('link[rel=canonical]');
  return (canonicalElement !== undefined) ? canonicalElement.href : window.location.href;
}

function getPageTitle() {
  var path = window.location.pathname;
  var h1 = document.querySelector('h1');
  if (path === '/') { return "Home" }
  if (path.indexOf('/page/') > 0) {
    var pageNumber = path.split('/page/').reverse()[0].split('/')[0];
    return h1.textContent + ": page " + pageNumber;
  }
  return h1.textContent;
}

function getGroupNumber() {
  var path = window.location.pathname;
  if (path === '/') { return 1; }
  if (path === '/blog/' || path.match(/\/blog\/page\/\d/)) { return 2; }
  return 3;
}

function openDb() {
  return idb.open('site', 1, function(upgradeDb) {
    upgradeDb.createObjectStore('pages', { keyPath: 'url' });
  });
}

function swSupport() {
  return 'serviceWorker' in navigator;
}

if (swSupport()) {
  navigator.serviceWorker.register('/sw.js');
}

document.addEventListener('DOMContentLoaded', function(event) {
  var url = getCanonicalUrl();
  var pageTitle = getPageTitle();

  var shareLinks = [].slice.call(document.querySelectorAll('.share'));
  shareLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      if (typeof navigator.share !== 'undefined') {
        event.preventDefault();
        navigator.share({ title: pageTitle, url: url })
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
    })
  });

  if (swSupport()) {
    navigator.serviceWorker.ready
      .then(function(reg) {
        openDb()
          .then(function(db) {
          var objectStore = db.transaction('pages', 'readwrite').objectStore('pages');
          return objectStore.put({
            url: url,
            title: pageTitle,
            group: getGroupNumber()
          });
        });
      });
  }
});
