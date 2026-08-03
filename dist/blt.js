!function (root, factory) {
    if ('function' === typeof define && define.amd) {
        define('BLT', [], function () {
            return (root.mymodule = factory());
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
    var states = new WeakMap();
    var knownMethods = [
        'assert', 'debug', 'error', 'info', 'log', 'table', 'trace', 'warn'
    ];
    return function attachBrowserLoggingTransport(boundTransportFn) {
        if (typeof boundTransportFn !== 'function') {
            throw new TypeError('browser-logging-transport requires a transport function.');
        }
        var target = console;
        var state = states.get(target);
        if (!state) {
            state = {
                originals: new Map(),
                transports: new Set(),
                dispatching: false
            };
            states.set(target, state);
            var methodNames = Array.from(new Set(Object.keys(target).concat(knownMethods)));
            methodNames.forEach(function (key) {
                var original = target[key];
                if (typeof original !== 'function') {
                    return;
                }
                state.originals.set(key, original);
                target[key] = function () {
                    var args = Array.prototype.slice.call(arguments);
                    if (!state.dispatching) {
                        state.dispatching = true;
                        try {
                            var data = args.map(String).join(' ');
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
        var attached = true;
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
    };
});
