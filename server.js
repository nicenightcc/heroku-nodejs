'use strict';

const URL = require('url');
const HTTP = require('http');
const HTTPS = require('https');

function btoa(s) {
    try {
        return Buffer.from(s).toString('base64');
    } catch (e) {
        console.log(['ERROR', e]);
    }
}

function atob(s) {
    try {
        return Buffer.from(s, 'base64').toString();
    } catch (e) {
        console.log(['ERROR', e]);
    }
}

function encodeURI(s) {
    return s.replace(/:/g, '%3A').replace(/\//g, '%2F')
}

function multitask(arr, fun) {
    return Promise.all(arr.map((item) => fun(item)));
}

function getHtml(url) {
    return new Promise((resolve) => {
        ! function get(url) {
            try {
                if (url.substring(0, 4) != 'http') url = 'http://' + url.replace(/^[\/]+/, '');
                (url[4] == "s" ? HTTPS.get : HTTP.get)(url, (res) => {
                    if (res.statusCode == 200) {
                        let body = '';
                        res.on('data', (data) => body += data);
                        res.on('end', () => {
                            let match = body.replace(/ /g, '').match(/metahttp-equiv=["']*refresh["']*content=["\d;]*url=([^"'>,]+)/);
                            if (match != null) {
                                get(match[1][0] == '/' ? (url.match(/^([a-z|A-Z]+:\/\/[^\/]+)/)[1] + match[1]) : match[1]);
                            } else {
                                resolve(body);
                            }
                        });
                    } else if (res.statusCode == 302) {
                        get(res.headers.location);
                    } else {
                        console.log(['ERROR', res.statusCode + ', ' + res.statusMessage + ', ' + url]);
                        resolve();
                    }
                }).on('error', (e) => {
                    console.log(['ERROR', e]);
                    resolve();
                });
            } catch (e) {
                console.log(['ERROR', e]);
                resolve();
            }
        }(url);
    });
}

function handle(request) {
    return new Promise((resolve) => {
        let query = URL.parse(request.url, true).query;
        if (typeof query.u === 'undefined') {
            return 'BAD REQUEST';
        }
        let urls = (query.u.startsWith('http') ? query.u : atob(query.u)).split(',');
        let matches = [];
        let decodes = [];

        multitask(urls, (url) =>
            getHtml(url).then(html => {
                if (html == null) return;
                let match = html.match(/([\w|-]+\/[\w|-]+\/[\w|-]+.png)/g);
                if (match == null) return;
                for (let m of match) matches.push(url + '/' + m);
                let match2 = html.match(/(vmess:\/\/[0-9|a-z|A-Z|=]+)/g);
                if (match2 != null)
                    for (let m of match2) decodes.push(m);
            })
        ).then(() =>
            multitask(matches, (url) =>
                getHtml('https://zxing.org/w/decode?u=' + url).then(html => {
                    if (html == null) return;
                    let match = html.match(/<pre>([a-z]+:\/\/[0-9|a-z|A-Z|=]+)<\/pre>/);
                    if (match != null) decodes.push(match[1]);
                }))
        ).then(() => {
            let result = decodes.join('\n');
            resolve(btoa(result));
        })
    });
}

const server = HTTP.createServer((request, response) => {
    console.log([request.method, request.url]);
    if (request.method === 'GET' && /^\/\?u=/.test(request.url)) {
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        try {
            handle(request).then(result => {
                response.write(result);
                response.end();
            });
        } catch (e) {
            console.log(['ERROR', e]);
            response.write('SERVER ERROR');
            response.end();
        }
    } else {
        response.end();
    }
});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
