/**
 * Created by oleg on 1/21/17.
 */


const blt = require('browser-logging-transport');

const fs = require('fs');

const strm = fs.createWriteStream('output.log');


blt(function(data, level){

    strm.write(level);
    strm.write(data);

});


console.log('jim');

console.warn('bob');



