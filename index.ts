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
    return function (boundTransportFn: (a: any, key: string) => void) {

        const str = String(boundTransportFn);

        if(/console\.log\(/.test(str)){
            throw new Error(' => If you call console.log() inside the bound function, you will get a stack overflow error.');
        }

        Object.keys(console).forEach(function (key) {

            let f;

            if ((f = console[key]) && typeof f === 'function') {

                console[key] = function () {

                    const data = Object.values(arguments).join(' ');
                    boundTransportFn(data, key);

                    f.apply(console, arguments);
                };
            }
        });

    }
});


