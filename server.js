'use strict';

let http = require('http');
let fs = require('fs');
let url = require('url');

let server = http.createServer((request, response) => {
    console.log(request.method + ': ' + request.url);
    if (request.method === 'GET') {
        let query = url.parse(request.url, true).query;
        http.get(query.url, (r) => {
            let body = '';
            r.on('data', function (data) {
                body += data;
            });
            r.on('end', function () {
                response.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                response.write(body);
                response.end();
            });
        })
    }
});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
