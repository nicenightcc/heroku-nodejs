'use strict';

let http = require('http');
let fs = require('fs');

let server = http.createServer((request, response) => {
    console.log(request.method + ': ' + request.url);
    if (request.method === 'GET') {
        response.writeHead(200, {
            'Content-Type': 'text/html'
        });
        fs.createReadStream('./404.html').pipe(response);
    }
});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
