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
    return function (boundTransportFn) {
        Object.keys(console).forEach(function (key) {
            var f;
            if ((f = console[key]) && typeof f === 'function') {
                console[key] = function () {
                    var data = Object.values(arguments).join(' ');
                    boundTransportFn(data, key);
                    f.apply(console, arguments);
                };
            }
        });
    };
});
