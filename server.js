'use strict';

const fs = require('fs');
const url = require('url');
const http = require('https');

function btoa(s) {
    return Buffer.from(s).toString('base64');
}

function atob(s) {
    return Buffer.from(s, 'base64').toString();
}

function getHtml(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (r) => {
            if (r.statusCode == 302) {
                getHtml(r.headers.location).then(res => {
                    resolve(res);
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
    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    if (request.method === 'GET') {
        let query = url.parse(request.url, true).query;
        if (typeof query.u === 'undefined') {
            response.write('404 NOT FOUND');
            response.end();
            return;
        }
        let queryu = atob(query.u);
        getHtml(queryu).then(r => {
            let matches = r.match(/img\/qr\/([0-9|a-z|A-Z]+[_|-]+[0-9|a-z|A-Z]+).png/g);
            if (matches == null) {
                response.write('404 NOT FOUND');
                response.end();
                return;
            }
            let promises = [];
            let decoded = [];
            for (let url of matches) {
                url = 'https://zxing.org/w/decode?u=' + queryu + '/' + url;
                promises.push(getHtml(url).then(r => {
                    let match = r.match(/<pre>([a-z]+:\/\/[0-9|a-z|A-Z|=]+)<\/pre>/);
                    if (match != null) {
                        let m = match[1];
                        decoded.push(m);
                    }
                }));
            }
            Promise.all(promises).then(() => {
                let result = decoded.join('\n');
                response.write(btoa(result));
                response.end();
            })
        });
    }
});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
