'use strict';

const fs = require('fs');
const url = require('url');
const http = require('https');

console.log(Promise);

function getHtml(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (r) => {
            if (r.statusCode == 302) {
                getHtml(r.headers.location).then(r => {
                    resolve(r);
                });
            } else {
                let body = '';
                r.on('data', function (data) {
                    body += data;
                });
                r.on('end', function () {
                    resolve(body);
                });
            }
        })
    });
}

const server = require('http').createServer((request, response) => {
    console.log(request.method + ': ' + request.url);
    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    if (request.method === 'GET') {
        let query = url.parse(request.url, true).query;
        if (typeof query.url === 'undefined') {
            response.end();
            return;
        }
        getHtml(query.url).then(r => {
            response.write(r);
            response.end();
        });
    }
});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
