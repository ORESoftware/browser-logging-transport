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
    return function (boundTransportFn: Function) {

        Object.keys(console).forEach(function (key) {

            let f;

            if ((f = console[key]) && typeof f === 'function') {

                console[key] = function () {

                    Object.values(arguments).forEach(function (a) {
                        boundTransportFn(a, key);
                    });

                    f.apply(console, arguments);

                };
            }
        });

    }
});


