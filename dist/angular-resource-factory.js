(function() {
  angular.module("angular-resource-factory").factory("ResourceFactory", function(DeferredWithUpdate, CacheService, $http, ENV, BACKEND_URL, Auth, NetworkConnection, $log) {
    var ResourceFactory;
    return ResourceFactory = (function() {
      function ResourceFactory() {}

      ResourceFactory.prototype._getBaseUrl = function() {
        return "" + BACKEND_URL + "/api/v1";
      };

      ResourceFactory.prototype._createApiResource = function(_arg) {
        var $httpParams, cache, cacheKey, cacheValue, dataFromCache, deferredNetworkPromise, deferredPromise, extendResourceWithData, isArray, requestServer, resource, retryIfFails, transformCacheAfter, transformCacheBefore, transformResponse, unbindRetryCallback;
        $httpParams = _arg.$httpParams, transformResponse = _arg.transformResponse, isArray = _arg.isArray, cache = _arg.cache, cacheKey = _arg.cacheKey, retryIfFails = _arg.retryIfFails, transformCacheBefore = _arg.transformCacheBefore, transformCacheAfter = _arg.transformCacheAfter;
        if (cache == null) {
          cache = $httpParams.method === "GET";
        }
        if (cacheKey == null) {
          cacheKey = this._generateCacheKey($httpParams.url, $httpParams.params);
        }
        if (retryIfFails == null) {
          retryIfFails = cache;
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
        deferredPromise = DeferredWithUpdate.defer();
        deferredNetworkPromise = DeferredWithUpdate.defer();
        resource = isArray ? [] : {};
        resource.$promise = deferredPromise.promise;
        resource.$networkPromise = deferredNetworkPromise.promise;
        resource.$resolved = false;
        resource.$failed = false;
        resource.$loading = true;
        resource.$resolveWith = function(data) {
          var k, v, _ref;
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
          extendResourceWithData(data);
          deferredPromise.resolve(data);
          return deferredNetworkPromise.resolve(data);
        };
        extendResourceWithData = function(data) {
          return angular.extend(resource, data);
        };
        if (cache && (cacheValue = CacheService.forUrl(cacheKey))) {
          resource.$resolved = true;
          resource.$loading = false;
          dataFromCache = transformCacheAfter(angular.copy(cacheValue));
          extendResourceWithData(dataFromCache);
          deferredPromise.resolve(dataFromCache);
        }
        requestServer = function() {
          resource.$networkLoading = true;
          return $http($httpParams).success(function(data, status, headers, config) {
            var dataToCache;
            resource.$resolved = true;
            resource.$failed = false;
            data = transformResponse(data);
            if (cache && (ENV === "development" || CacheService.shouldUpdate(cacheKey, headers))) {
              dataToCache = transformCacheBefore(angular.copy(data));
              CacheService.update(cacheKey, headers, dataToCache);
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
        requestServer();
        resource.$retry = function() {
          return requestServer();
        };
        if (retryIfFails) {
          unbindRetryCallback = null;
          resource.$networkPromise["catch"](function() {
            return unbindRetryCallback || (unbindRetryCallback = NetworkConnection.onOnline(function() {
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

      ResourceFactory.prototype._generateCacheKey = function(url, params) {
        var k, v;
        params = angular.copy(params || {});
        delete params.auth_token;
        delete params.token;
        for (k in params) {
          v = params[k];
          if (angular.isNumber(v)) {
            params[k] = v.toString();
          }
        }
        return url + (_.isEmpty(params) ? "" : JSON.stringify(params));
      };

      return ResourceFactory;

    })();
  });

}).call(this);
