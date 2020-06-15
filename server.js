var http = require('http');
var url = require("url");
var express = require('express');
var app = express();
var fs = require("fs");
app.get('/', function (request, response) {
    var query = url.parse(request.url, true).query;
    http.get(query.url, (r) => {
        var body = '';
        r.on('data', function (data) {
            body += data;
        });
        r.on('end', function () {
            // 数据接收完成
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write(body);
            response.end();
        });
    })
})

var server = app.listen(process.env.PORT || 80, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Server running at http://%s:%s", host, port)

})

