import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

export default function IndexController(container) {
  this._container = container;
  this._postsView = new PostsView(this._container);
  this._toastsView = new ToastsView(this._container);
  this._lostConnectionToast = null;
  this._openSocket();
  this._registerServiceWorker();
}


IndexController.prototype._registerServiceWorker = function() {


    var indexController = this;

    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      // If there's no controller, this page wasn't loaded via a service worker, so they're looking at the latest version.
      // In that case, exit early
      if (!navigator.serviceWorker.controller) return;

      // If there's an updated worker already waiting, call
      // indexController._updateReady()
      if (reg.waiting) {
        indexController._updateReady();
        return;
      }

      // If there's an updated worker installing, track its progress. If it becomes "installed", call
      // indexController._updateReady()
      if (reg.installing) {
        indexController._trackInstalling(reg.installing);
        return;
      }

      // TODO: otherwise, listen for new installing workers arriving.
      // If one arrives, track its progress.
      // If it becomes "installed", call
      // indexController._updateReady()
      reg.addEventListener('updatefound', function() {
        indexController._trackInstalling(reg.installing);
      });
    });


};

//A function the track the installation status of a worker
IndexController.prototype._trackInstalling = function(worker) {
  var indexController = this;

  //The worker will fire a statechange event when moving between 'installing', 'installed', 'active' etc
  worker.addEventListener('statechange', function() {
    //If the worker is now installed, let the user know that there is an update ready
    if (worker.state == 'installed') {
      indexController._updateReady();
    }
  });
};


//show new service worker again
IndexController.prototype._updateReady = function() {
    var toast = this._toastsView.show("New version available", {
        buttons: ['Refresh', 'Dismiss']
    });
    toast.answer.then(function(answer) {
      if ( answer != 'Refresh') return;
      self.addEventListener('install', function(event) {
  // The promise that skipWaiting() returns can be safely ignored.
  self.skipWaiting();

  // Perform any other actions required for your
  // service worker to install, potentially inside
  // of event.waitUntil();
});
    })
};
// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {
  var indexController = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location);
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function() {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function(event) {
    requestAnimationFrame(function() {
      indexController._onSocketMessage(event.data);
    });
  });

  ws.addEventListener('close', function() {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function() {
      indexController._openSocket();
    }, 5000);
  });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {
  var messages = JSON.parse(data);
  this._postsView.addPosts(messages);
};
