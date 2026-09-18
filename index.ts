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

  type Transport = (data: string, key: string) => void;

  const states = new WeakMap<object, {
    originals: Map<string, Function>,
    transports: Map<Transport, number>,
    dispatching: boolean
  }>();

  const knownMethods = [
    'assert', 'debug', 'error', 'info', 'log', 'table', 'trace', 'warn'
  ];

  return function attachBrowserLoggingTransport(
    boundTransportFn: Transport
  ): () => void {

    if (typeof boundTransportFn !== 'function') {
      throw new TypeError('browser-logging-transport requires a transport function.');
    }

    const target: any = console;
    let state = states.get(target);

    if (!state) {
      state = {
        originals: new Map<string, Function>(),
        transports: new Map<Transport, number>(),
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
              Array.from(state.transports.keys()).forEach(function (transport) {
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

    state.transports.set(
      boundTransportFn,
      (state.transports.get(boundTransportFn) || 0) + 1
    );
    let attached = true;

    return function detachBrowserLoggingTransport() {
      if (!attached) {
        return;
      }
      attached = false;

      const subscriptionCount = state.transports.get(boundTransportFn) || 0;
      if (subscriptionCount > 1) {
        state.transports.set(boundTransportFn, subscriptionCount - 1);
      }
      else {
        state.transports.delete(boundTransportFn);
      }

      if (state.transports.size < 1) {
        state.originals.forEach(function (original, key) {
          target[key] = original;
        });
        states.delete(target);
      }
    };
  }
});
