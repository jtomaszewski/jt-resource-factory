# jt-resource-factory

API Resource factory using Angular's $http with support for cache and useful properties like $promise, $networkPromise, $resolved etc.

### How to use?

1. Run `bower install --save jt-resource-factory`.

2. Add those files to your index.html:

  - `bower_components/DeferredWithMultipleUpdates.js/lib/deferred-with-multiple-updates.js`
  - `bower_components/jt-resource-factory/dist/jt-resource-factory.js`

  or

  - `bower_components/jt-resource-factory/dist/jt-resource-factory.min.js`

3. Include `jt-resource-factory` to your angular.module dependencies, f.e. `angular.module("APP_NAME", ["jt-resource-factory"])`.

4. Use the `jtResourceFactory` factory! =)

## Documentation

See `src/jt-resource-factory.coffee`.
