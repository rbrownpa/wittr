var serviceWorkerCache = 'wittr-static-v6';
// install offline cache directories
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(serviceWorkerCache).then(function(cache) {
      return cache.addAll([
      '/',
      'js/main.js',
      'css/main.css',
      'imgs/icon.png',
      'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
      'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
      ]);
    })
  );
});


self.addEventListener('activate', function(event) {
  // wait for all pages 
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('wittr-') &&
            cacheName != serviceWorkerCache;
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  });



self.addEventListener('fetch', function(event){
// caches update caches with non-specified directories xxx
  event.respondWith(
   caches.match(event.request).then(function(response) {
     return response || fetch(event.request).then(function(response) {
       return caches.open(serviceWorkerCache).then(function(cache) {
         cache.put(event.request, response.clone());
         return response;
       });
     });
   })
 );


});
