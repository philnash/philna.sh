//= require includes/idb
/* global idb, ga */

function swSupport() {
  return 'serviceWorker' in navigator;
}

if (swSupport()) {
  navigator.serviceWorker.addEventListener('message', function(event) {
    console.log(event);
    var message = JSON.parse(event.data);
    var isRefresh = message.type === 'refresh';
    var lastETag = localStorage.getItem('currentETag');
    localStorage.setItem('currentETag', message.eTag);

    var isNew = lastETag !== message.eTag;

    if (isRefresh && isNew) {
      console.log('New stuff');
      if (lastETag) {
        if ('content' in document.createElement('template')) {
          var template = document.getElementById('fresh-notice');
          var clone = document.importNode(template.content, true);
          var notice = clone.querySelector('.notice');
          console.log(notice);
          document.querySelector('body').appendChild(clone);
          setTimeout(function() {
            notice.classList.remove('hidden');
          }, 1000);
        }
      }
    }
  });

  navigator.serviceWorker.ready.then(function() {
    openDb().then(function(db) {
      var objectStore = db
        .transaction('pages', 'readwrite')
        .objectStore('pages');
      objectStore.put({
        url: url,
        title: pageTitle,
        group: getGroupNumber()
      });
    });
  });

  navigator.serviceWorker.register('/sw.js');
}

function getCanonicalUrl() {
  var canonicalElement = document.querySelector('link[rel=canonical]');
  return canonicalElement !== undefined
    ? canonicalElement.href
    : window.location.href;
}

function getPageTitle() {
  var path = window.location.pathname;
  var h1 = document.querySelector('h1');
  if (path === '/') {
    return 'Home';
  }
  if (path.indexOf('/page/') > 0) {
    var pageNumber = path
      .split('/page/')
      .reverse()[0]
      .split('/')[0];
    return h1.textContent + ': page ' + pageNumber;
  }
  return h1.textContent;
}

function getGroupNumber() {
  var path = window.location.pathname;
  if (path === '/') {
    return 1;
  }
  if (path === '/blog/' || path.match(/\/blog\/page\/\d/)) {
    return 2;
  }
  return 3;
}

function openDb() {
  return idb.open('site', 1, function(upgradeDb) {
    upgradeDb.createObjectStore('pages', { keyPath: 'url' });
  });
}

var url = getCanonicalUrl();
var pageTitle = getPageTitle();

var shareLinks = [].slice.call(document.querySelectorAll('.share'));
shareLinks.forEach(function(link) {
  link.addEventListener('click', function(event) {
    if (typeof navigator.share !== 'undefined') {
      event.preventDefault();
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
        .catch(function() {
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

var offlineList = document.querySelector('.offline-pages');
if (swSupport() && !!offlineList) {
  var cacheRequests = navigator.serviceWorker.ready
    .then(function() {
      return caches.open(
        'v' + offlineList.getAttribute('data-sw-cache-version') + '-pages'
      );
    })
    .then(function(cache) {
      return cache.keys();
    });
  Promise.all([openDb(), cacheRequests])
    .then(function(promises) {
      var db = promises[0];
      var requestList = promises[1];
      return Promise.all(
        requestList.map(function(request) {
          return db
            .transaction('pages')
            .objectStore('pages')
            .get(request.url);
        })
      );
    })
    .then(function(pages) {
      offlineList.innerHTML = pages
        .filter(function(page) {
          return page && page.url.indexOf('/offline/') === -1;
        })
        .sort(function(a, b) {
          return a.group > b.group;
        })
        .map(function(page) {
          return '<li><a href="' + page.url + '">' + page.title + '</a></li>';
        })
        .join('');
    });
}
