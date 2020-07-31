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

function multitask(arr, fun) {
    let tryfun = async (item) => {
        try {
            await fun(item);
        } catch (e) {
            console.log(['ERROR', e]);
        }
    };
    return Promise.all(arr.map(item => tryfun(item)));
    // let promises = [];
    // for (let item of arr) {
    //     promises.push(tryfun(item));
    // }
    // return Promise.all(arr.map(async (item) => {
    //     try {
    //         await fun(item);
    //     } catch (e) {
    //         console.log(['ERROR', e]);
    //     }
    // }));
}

function getHtml(url) {
    return new Promise((resolve) => {
        ! function get(url) {
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
        }(url);
    });
}

async function handle(request) {
    let query = URL.parse(request.url, true).query;
    if (typeof query.u === 'undefined') {
        return 'BAD REQUEST';
    }
    let urls = (query.u.startsWith('http') ? query.u : atob(query.u)).split(',');
    let matches = [];
    let decodes = [];
    await multitask(urls, async (url) => {
        let html = await getHtml(url);
        if (html == null) return;
        let match = html.match(/([\w|-]+\/[\w|-]+\/[\w|-]+.png)/g);
        if (match == null) return;
        for (let m of match) matches.push(url + '/' + m);
    });
    await multitask(matches, async (url) => {
        url = 'https://zxing.org/w/decode?u=' + url;
        let html = await getHtml(url);
        if (html == null) return;
        let match = html.match(/<pre>([a-z]+:\/\/[0-9|a-z|A-Z|=]+)<\/pre>/);
        if (match != null) decodes.push(match[1]);
    });
    let result = decodes.join('\n');
    return btoa(result);
}

const server = HTTP.createServer(async (request, response) => {
    console.log([request.method, request.url]);
    if (request.method === 'GET' && /^\/\?u=/.test(request.url)) {
        response.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        try {
            let result = await handle(request);
            response.write(result);
        } catch (e) {
            console.log(['ERROR', e]);
            response.write('SERVER ERROR');
        }
    }
    response.end();

});

let serverPort = process.env.PORT || 5000;

server.listen(serverPort);

console.log(`Server Running at http://127.0.0.1:${serverPort}/`);
