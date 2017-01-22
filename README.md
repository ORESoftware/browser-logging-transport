


# BLT - Browser Logging Transport


## Usage

```js

// in Node.js
const blt = require('browser-logging-transport');

const fs = require('fs');

const strm = fs.createWriteStream('output.log');


blt(function(data, level){

    strm.write(level);
    strm.write(data);

});


// in the browser

import * as blt from 'browser-logging-transport';
const socket = io.connect('localhost:3000');

blt(function(data, level){

   socket.emit('LOGS',{
       level:level,
       data:data
       
   })

});


// something cleverer like this is *not* yet supported:


const fn = socket.emit.bind(socket, 'LOGS');

blt(fn);

// soon we can run a check to see if the function is bount

```
