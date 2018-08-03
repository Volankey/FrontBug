const router = require('koa-router')()
const logger = require('koa-logger')
var log4js = require('log4js');
log4js.configure({
  appenders: {
    out: {
      type: 'stdout'
    },
    app: {
      type: 'file',
      filename: './logs/info.log',
      compress: true,
      maxLogSize: 1024*1000,
      backups: 4, // 日志备份数量，大于该数则自动删除
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

var logger4 = log4js.getLogger("error");

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = 'koa2 string'
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

router.get("/report.cgi", async function (ctx, next) {
  ctx.body = "";
  var str = "";
  var a = decodeURIComponent(ctx.querystring).split("&");
  a.forEach(function (s, idx) {
    let pos = s.indexOf("=");
    str += s.substring(pos + 1) + (idx != a.length - 1 ? "\t|\t" : "");
  })
  logger4.debug(str);

})

module.exports = router