# angular-resource-factory

API Resource factory using Angular's $http with support for cache and useful properties like $promise, $networkPromise, $resolved etc.

### How to use?

1. Run `bower install --save angular-resource-factory`.

2. Add those files to your index.html:

  - `bower_components/DeferredWithMultipleUpdates.js/lib/deferred-with-multiple-updates.js`
  - `bower_components/angular-resource-factory/dist/angular-resource-factory.js`

3. Include `angular-resource-factory` to your angular.module dependencies, f.e. `angular.module("APP_NAME", ["angular-resource-factory"])`.

4. Use the `ResourceFactory` factory! =)

## Documentation

See `src/angular-resource-factory.coffee`.
