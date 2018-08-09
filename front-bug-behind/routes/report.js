const router = require('koa-router')()
const getData = require('../Funciton/read');

var log4js = require('log4js');
var fs = require('fs');
const utils = require('../utils');
const path = require('path');
var sourceMap = require('source-map');
var errorList = [];
var logger4 = log4js.getLogger("error");
var smDir = path.join(__filename, '..', '..', 'sourceMap');
var sourcesPathMap = Object.create(null);
//获取info数据
getData().then(function(data){
    errorList = data.slice(0,errorList.max).filter((item)=>item!=null).map(item=>JSON.parse(item));
    errorList.max = 200;
    errorList.add = function (res) {
        if (errorList.length > errorList.max) {
            errorList.pop();
        }
        errorList.unshift(res);
    }

})

//log4.js配置
log4js.configure({
    appenders: {
        out: {
            type: 'stdout'
        },
        app: {
            type: 'dateFile',
            pattern: '.yyyy-MM-dd',
            filename: './logs/info.log',
            maxLogSize: 1024 * 1000,
            backups: 30, // 日志备份数量，大于该数则自动删除
            category: 'music' // 记录器名  
        },

    },
    categories: {
        default: {
            appenders: ['out', 'app'],
            level: 'debug'
        }
    }
});
//寻找sourcemap
async function lookSourceMap(mapFile, line, col, callback) {
    fs.readFile(mapFile, function (err, data) {
        if (err) {
            // console.error(err);
            //没有map文件
            callback({
                line: line,
                column: col,
                sourcesContent: ""
            })

            return;
        }

        var fileContent = data.toString(),
            fileObj = JSON.parse(fileContent),
            sources = fileObj.sources;
        for (let item of sources) {
            sourcesPathMap[utils.fixPath(item)] = item;
        }
        //这么写会报错，不知为什么
        // var consumer = await new sourceMap.SourceMapConsumer(fileContent);

        new sourceMap.SourceMapConsumer(fileContent).then(function (consumer) {
            var lookup = {
                line: parseInt(line),
                column: parseInt(col)
            };
            var result = consumer.originalPositionFor(lookup);
            var originSource = sourcesPathMap[result.source],
                sourcesContent = fileObj.sourcesContent[sources.indexOf(originSource)];
            result.sourcesContent = sourcesContent;

            callback && callback(result);
        })
    })
}

router.get("/report.cgi", async function (ctx, next) {
    var res = {};
    ctx.body = "";
    var querystring = decodeURIComponent(ctx.querystring);
    var a = querystring.split("&");
    a.forEach(function (s) {
        let pos = s.indexOf("=");
        var key = s.substring(0, pos);
        var value = s.substring(pos + 1);
        res[key] = value;
    })

    //获取文件名
    var filename = path.basename(utils.getQueryString(querystring, "url"));
    var line = res.l;
    var col = res.c;

    lookSourceMap(path.join(smDir, (filename + ".map")), line, col, function (data) {

        var {
            line,
            column
        } = data;

        res.line = line || res.l;
        res.col = column || res.c;
        errorList.add(res);
        logger4.debug(JSON.stringify(res));
    });
});

router.get("/reports/get",async function(ctx){
    ctx.body = errorList;
})



module.exports = router