(function() {
  var app;

  app = angular.module("jt-resource-factory", ["DeferredWithMultipleUpdates"]).service("jtCacheService", function(DSCacheFactory, ENV, $log) {
    var jtCacheService;
    return new (jtCacheService = (function() {
      function jtCacheService() {}

      jtCacheService.prototype.get = function(key) {
        var value;
        if (!((value = localStorage.getItem(key)) && value !== "undefined")) {
          return;
        }
        return JSON.parse(value);
      };

      jtCacheService.prototype.put = function(key, value) {
        return localStorage.setItem(key, JSON.stringify(value));
      };

      jtCacheService.prototype.shouldUpdate = function(cacheKey, headers) {
        return this.get("" + cacheKey + "-etag") !== headers("etag");
      };

      jtCacheService.prototype.update = function(cacheKey, headers, data, debug) {
        var ETag, k, _;
        if (debug == null) {
          debug = true;
        }
        data = angular.copy(data);
        for (k in data) {
          _ = data[k];
          if (k.indexOf("$") === 0) {
            delete data[k];
          }
        }
        if (ETag = typeof headers === "function" ? headers("etag") : void 0) {
          this.put("" + cacheKey + "-etag", ETag);
        }
        if (debug) {
          $log.debug("jtCacheService.update:", cacheKey, data);
        }
        return this.put(cacheKey, data);
      };

      return jtCacheService;

    })());
  }).service("jtNetworkConnection", function($rootScope) {
    var jtNetworkConnection;
    return new (jtNetworkConnection = (function() {
      function jtNetworkConnection() {}

      jtNetworkConnection.prototype.onOnline = function(callback) {
        var ngCallback;
        ngCallback = function() {
          return $rootScope.$applyAsync(callback);
        };
        if (typeof Offline !== "undefined" && Offline !== null) {
          Offline.on("up", ngCallback);
        }
        return function() {
          return typeof Offline !== "undefined" && Offline !== null ? Offline.off("up", ngCallback) : void 0;
        };
      };

      return jtNetworkConnection;

    })());
  }).factory("jtResourceFactory", function(DeferredWithMultipleUpdates, jtCacheService, $http, jtNetworkConnection, $log) {
    var jtResourceFactory;
    return jtResourceFactory = (function() {
      function jtResourceFactory() {}

      jtResourceFactory.prototype._createApiResource = function(_arg) {
        var $httpParams, cache, cacheKey, cacheValue, createRequestToServer, dataFromCache, deferredNetworkPromise, deferredPromise, extendResourceWithData, isArray, resource, retryIfFails, shouldCache, transformCacheAfter, transformCacheBefore, transformResponse, unbindRetryCallback;
        $httpParams = _arg.$httpParams, transformResponse = _arg.transformResponse, isArray = _arg.isArray, cache = _arg.cache, cacheKey = _arg.cacheKey, retryIfFails = _arg.retryIfFails, transformCacheBefore = _arg.transformCacheBefore, transformCacheAfter = _arg.transformCacheAfter;
        shouldCache = cache;
        if (shouldCache == null) {
          shouldCache = $httpParams.method === "GET";
        }
        if (cacheKey == null) {
          cacheKey = this._generateCacheKey($httpParams.url, $httpParams.params);
        }
        if (retryIfFails == null) {
          retryIfFails = shouldCache;
        }
        if (transformCacheBefore == null) {
          transformCacheBefore = angular.identity;
        }
        if (transformCacheAfter == null) {
          transformCacheAfter = angular.identity;
        }
        if (transformResponse == null) {
          transformResponse = angular.identity;
        }
        if (isArray == null) {
          isArray = false;
        }
        deferredPromise = DeferredWithMultipleUpdates.defer();
        deferredNetworkPromise = DeferredWithMultipleUpdates.defer();
        resource = isArray ? [] : {};
        resource.$promise = deferredPromise.promise;
        resource.$networkPromise = deferredNetworkPromise.promise;
        resource.$resolved = false;
        resource.$failed = false;
        resource.$loading = true;
        resource.$resolveWith = function(data, asNetworkResponse) {
          var k, v, _ref;
          if (asNetworkResponse == null) {
            asNetworkResponse = true;
          }
          if (resource.$data) {
            if (angular.isArray(resource.$data)) {
              resource.splice(0, resource.length);
            } else if (angular.isObject(resource.$data)) {
              _ref = resource.$data;
              for (k in _ref) {
                v = _ref[k];
                delete resource[k];
              }
            }
          }
          resource.$data = data;
          if (angular.isObject(data)) {
            extendResourceWithData(data);
          }
          deferredPromise.resolve(data);
          if (asNetworkResponse) {
            return deferredNetworkPromise.resolve(data);
          }
        };
        extendResourceWithData = function(data) {
          return angular.extend(resource, data);
        };
        if (shouldCache && (cacheValue = jtCacheService.get(cacheKey))) {
          resource.$resolved = true;
          resource.$loading = false;
          dataFromCache = transformCacheAfter(angular.copy(cacheValue));
          if (angular.isObject(dataFromCache)) {
            resource.$resolveWith(dataFromCache, false);
          }
        }
        createRequestToServer = function() {
          resource.$networkLoading = true;
          return $http($httpParams).success(function(data, status, headers, config) {
            var dataToCache;
            resource.$resolved = true;
            resource.$failed = false;
            data = transformResponse(data);
            if (shouldCache && jtCacheService.shouldUpdate(cacheKey, headers)) {
              dataToCache = transformCacheBefore(angular.copy(data));
              jtCacheService.update(cacheKey, headers, dataToCache);
              return resource.$resolveWith(data);
            } else {
              return resource.$resolveWith(data);
            }
          }).error(function(data, status, headers, config) {
            resource.$failed = true;
            deferredPromise.reject({
              data: data,
              status: status,
              headers: headers,
              config: config
            });
            return deferredNetworkPromise.reject({
              data: data,
              status: status,
              headers: headers,
              config: config
            });
          })["finally"](function() {
            resource.$loading = false;
            return resource.$networkLoading = false;
          });
        };
        createRequestToServer();
        resource.$retry = function() {
          return createRequestToServer();
        };
        if (retryIfFails) {
          unbindRetryCallback = null;
          resource.$networkPromise["catch"](function() {
            return unbindRetryCallback || (unbindRetryCallback = jtNetworkConnection.onOnline(function() {
              if (resource.$failed && !resource.$networkLoading) {
                return resource.$retry();
              }
            }));
          });
          resource.$networkPromise.then(function() {
            if (unbindRetryCallback) {
              unbindRetryCallback();
              return unbindRetryCallback = null;
            }
          });
        }
        return resource;
      };

      jtResourceFactory.prototype._generateCacheKey = function(url, params) {
        var k, v;
        params = angular.copy(params || {});
        delete params.auth_token;
        delete params.token;
        for (k in params) {
          v = params[k];
          if (angular.isNumber(v)) {
            params[k] = v.toString();
          }
          if (v == null) {
            delete params[k];
          }
        }
        return url + (angular.equals({}, params) ? "" : JSON.stringify(params));
      };

      return jtResourceFactory;

    })();
  });

}).call(this);
