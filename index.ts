!function (root, factory) {

  if ('function' === typeof define && define.amd) {
    define('BLT', [], function () {
      return (root.mymodule = factory())
    });
  }

  else if ('object' === typeof module && module.exports) {
    module.exports = factory();
  }

  else {
    root['BLT'] = factory();
  }

}(this, function () {

  'use strict';

  const states = new WeakMap<object, {
    originals: Map<string, Function>,
    transports: Set<(data: string, key: string) => void>,
    dispatching: boolean
  }>();

  const knownMethods = [
    'assert', 'debug', 'error', 'info', 'log', 'table', 'trace', 'warn'
  ];

  return function attachBrowserLoggingTransport(
    boundTransportFn: (data: string, key: string) => void
  ): () => void {

    if (typeof boundTransportFn !== 'function') {
      throw new TypeError('browser-logging-transport requires a transport function.');
    }

    const target: any = console;
    let state = states.get(target);

    if (!state) {
      state = {
        originals: new Map<string, Function>(),
        transports: new Set<(data: string, key: string) => void>(),
        dispatching: false
      };
      states.set(target, state);

      const methodNames = Array.from(new Set(Object.keys(target).concat(knownMethods)));
      methodNames.forEach(function (key) {
        const original = target[key];
        if (typeof original !== 'function') {
          return;
        }

        state.originals.set(key, original);
        target[key] = function () {
          const args = Array.prototype.slice.call(arguments);

          if (!state.dispatching) {
            state.dispatching = true;
            try {
              const data = args.map(String).join(' ');
              Array.from(state.transports).forEach(function (transport) {
                try {
                  transport(data, key);
                }
                catch (err) {
                  // A logging transport must never suppress the application log.
                }
              });
            }
            finally {
              state.dispatching = false;
            }
          }

          return original.apply(target, args);
        };
      });
    }

    state.transports.add(boundTransportFn);
    let attached = true;

    return function detachBrowserLoggingTransport() {
      if (!attached) {
        return;
      }
      attached = false;
      state.transports.delete(boundTransportFn);

      if (state.transports.size < 1) {
        state.originals.forEach(function (original, key) {
          target[key] = original;
        });
        states.delete(target);
      }
    };
  }
});
