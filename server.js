'use strict';

const fs = require('fs');
const url = require('url');
const http = require('https');

const server = require('http').createServer((request, response) => {
    console.log(request.method + ': ' + request.url);
    if (request.method === 'GET') {
        let query = url.parse(request.url, true).query;
        http.get(query.url, (r) => {
            let body = '';
            r.on('data', function (data) {
                body += data;
            });
            r.on('end', function () {
                let matches = body.match(/img\/qr\/([0-9|a-z|A-Z]+[_|-]+[0-9|a-z|A-Z]+).png/g);
                response.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                for (var url of matches) {
                    response.write(url);
                }
                response.end();
            });
        })
    }
});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
