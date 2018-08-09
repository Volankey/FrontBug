var fs = require('fs');
var path = require('path')
var logsFile = path.join(__filename, '..', '..', 'logs','info.log');
var readableStream = fs.createReadStream(logsFile);
function getData() {

    return new Promise(function (resolve, reject) {
        var data = "";
        readableStream.setEncoding('utf8');
        readableStream.on('data', function (chunk) {
            data += chunk;
        });
        var result = [];
        readableStream.on('end', function () {

            var datas = data.split("\n").forEach(function (item) {
                result.push(item.split(" - ")[1]);
            });
            resolve(result.reverse())
        });
    })
}

module.exports = getData;