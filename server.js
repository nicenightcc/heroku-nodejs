'use strict';

const fs = require('fs');
const url = require('url');
const http = require('https');

function getHtml(url) {
    return new Promise((resolve, reject) => {
        http.get(query.url, (r) => {
            let body = '';
            r.on('data', function (data) {
                body += data;
            });
            r.on('end', function () {
                resolve(body);
            });
        })
    });
}

const server = require('http').createServer((request, response) => {
    console.log(request.method + ': ' + request.url);
    if (request.method === 'GET') {
        let query = url.parse(request.url, true).query;
        if (typeof query.url === 'undefined') {
            response.end();
            return;
        }
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        getHtml(query.url).then(r => {
            let matches = r.match(/img\/qr\/([0-9|a-z|A-Z]+[_|-]+[0-9|a-z|A-Z]+).png/g);
            let promises = [];
            let decoded = [];
            for (let url of matches) {
                promises.push(getHtml('https://zxing.org/w/decode?u=' + query.url + '/' + url).then(r => {
                    let m = r.match(/<pre>([a-z]+:\/\/[0-9|a-z|A-Z|=]+)</)[1];
                    decoded.push(m);
                    response.write(m);
                }));

            }
            Promise.all(promises).then(r => {
                response.end();
            })
        });
    }
});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
