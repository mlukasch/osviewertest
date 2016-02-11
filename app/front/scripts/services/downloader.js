/**
 * Created by Ihor Borysyuk on 26.01.16.
 */

;(function(angular) {

  var app = angular.module('Application');

  app.factory('downloader', ['$q', '_', '$http', function($q, _, $http) {
    var proxy = 'http://gobetween.oklabs.org/pipe/{url}';
    var _cache = [];
    function getUrl(url, options) {
      return (options.proxy)? options.proxy.replace('{url}', encodeURIComponent(url)): url
    }

    return {
      get: function(url){
        var deferred = $q.defer();

        if (_cache[url]){
          deferred.resolve(_cache[url]);
        } else {
          fetch(getUrl( url , {proxy: proxy})).then(function(response){
            return response.text();
          }).then(function (text){
            _cache[url] = text;
            deferred.resolve(text);
          });
        }
        return deferred.promise;
      }
    }
  }]);

})(angular);