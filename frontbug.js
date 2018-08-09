(function (obj, init) {
    obj["FrontBug"] = init();
}(this, function () {
    var FrontBug = {},
        device = mobileType(),
        version = appInfo();
    //初始配置
    FrontBug.config = {
        reportTo: null,//上报地址
        reportPreFix: "",//前缀
        reportKey: "frontbug",//key
        isConsole: true,//输出到控制台
        reportImg:true,//上报image错误
        sampling:0.3, //采样率
        otherData: {
            device: device,
            env: version,
        }
    }
    //输出列表
    FrontBug.store = [];

    var methodList = ['log', 'info', 'warn', 'debug', 'error'];
    //装饰console.xx功能,添加到store
    methodList.forEach(function (item) {
        //之前的
        var method = console[item];

        //现在的
        console[item] = function () {
            FrontBug.store.push({
                type: item,
                logs: arguments
            })
            method.apply(console, arguments);
        }

    })
    //设置配置
    FrontBug.setConfig = function (config) {
        console.log(config);
        FrontBug.config = Object.assign(FrontBug.config, config);
    }
    FrontBug.addHandler = function (name, fn) {
        handler[name] = fn;
    }
    FrontBug.processStackMsg = function (msg) {
        return processStackMsg(msg)
    }


    //获取设备
    function mobileType() {
        var u = navigator.userAgent,
            app = navigator.appVersion;
        var type = { // 移动终端浏览器版本信息
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            iPad: u.indexOf('iPad') > -1, //是否iPad
            android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
            iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
            Mac:u.indexOf('Mac') > -1,
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile/i) || !!u.match(
                /MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/
            ), //是否为移动终端
            webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
        };

        var lists = Object.keys(type);
        for (var i = 0; i < lists.length; i++) {
            if (type[lists[i]]) {
                return lists[i];
            }
        }
    }

    function getObjectClass(obj) {
        if (obj && obj.constructor && obj.constructor.toString()) {
            //获取构造函数名称
            if (obj.constructor.name) {
                return obj.constructor.name;
            }
            var str = obj.constructor.toString();

            if (str.charAt(0) == '[') {
                //常规
                var arr = str.match(/\[\w+\s*(\w+)\]/);
            } else {
                //ie firefox
                var arr = str.match(/function\s*(\w+)/);
            }
            if (arr && arr.length == 2) {
                return arr[1];
            }
        }
        return undefined;
    };

    //promise错误
    window.addEventListener("unhandledrejection", function (e) {
        // Event新增属性
        // @prop {Promise} promise - 状态为rejected的Promise实例
        // @prop {String|Object} reason - 异常信息或rejected的内容

        // 会阻止异常继续抛出，不让Uncaught(in promise) Error产生
        console.log(e);
        window.onerror(e, e.reason.value, 0, 0, e)


        e.preventDefault()
    });
    // 获取当前浏览器名 及 版本号
    function appInfo() {
        var browser = {
                appname: 'unknown',
                version: 0
            },
            userAgent = window.navigator.userAgent.toLowerCase(); // 使用navigator.userAgent来判断浏览器类型
        //msie,firefox,opera,chrome,netscape  
        if (/(msie|firefox|opera|chrome|netscape)\D+(\d[\d.]*)/.test(userAgent)) {
            browser.appname = RegExp.$1;
            browser.version = RegExp.$2;
        } else if (/version\D+(\d[\d.]*).*safari/.test(userAgent)) { // safari  
            browser.appname = 'safari';
            browser.version = RegExp.$2;
        }
        return browser.appname + ":" + browser.version;
    }

    function processStackMsg(error) {
        var stack = error.stack
            .replace(/\n/gi, "") //换行符
            .split(/\bat\b/) //分割为数组
            .slice(0, 9) //最多取9个
            .join("@") //@分割每一个
            .replace(/\?[^:]+/gi, "") //替换问号

        var msg = error.toString()
        if (stack.indexOf(msg) < 0) {
            stack = msg + "@" + stack
        }
        return stack
    }
    var handler = {};

    handler.ReferenceError = handler.default = function (error, msg) {
        var message = msg;
        var emsg = "";
        if(typeof msg === "string"){
            emsg += msg;
        }
        if (error && error.stack) {
            emsg = processStackMsg(error)
        }
        // 判断是否是Event触发了错误
        if (Event.prototype.isPrototypeOf(message)) {
            emsg += (message.type?"--"+message.type+"--"+(message.target?(message.target.tagName+"::"+message.target.src):""):"");
            // emsg +=
            //     `${message.type?""+message.type+message.target?message.target.tagName+"::"+ message.target.src:"":""}`;
        }
       
        return emsg;
    }

    function getSrc(emsg,url,line,col,errorType) {
        //防止过大
        emsg = (emsg + "" || "").substr(0, 500);

        var setting = FrontBug.config;

        if (setting.reportTo) {
            var src = setting.reportTo;
            src += setting.reportTo.indexOf("?") > -1 ? "&" : "?" + setting.reportKey + "=" + (
                setting.reportPreFix ? "[" + setting.reportPreFix + "]" : "") + emsg;
            //拼接额外data
            Object.keys(setting.otherData).forEach(function (key) {
                src += "&" + key + "=" + setting.otherData[key];
            })
            src += "&t=" + new Date().getTime();
            src += "&url=" + url;
            src += "&l=" + line;
            src += "&c=" + col;
            src += "&e=" + errorType;
            // console.log(src)
            //提交report
            return src;
        }
    }
    window.onerror = function (msg, url, line, col, error) {
        console.log(getObjectClass(error));
        var errorType = getObjectClass(error);

        if (handler[errorType] == undefined) {
            console.log("默认");
            
            report(getSrc(handler.default(error, msg), url, line, col,errorType));

        } else {
            report(getSrc(handler[errorType](error, msg), url, line, col,errorType));
        }
        return FrontBug.config.isConsole;
    }

    function report(src) {
        // 只采集 30%
        if(Math.random() < FrontBug.config.sampling) {
            if (!src)
                return;
            var img = new Image();
            img.src = src;
            img.onload = function () {
                img = null;
            }
        }
       
    }
    //添加一个PromiseRejectionEvent处理 需返回一个错误信息的字符串！
    FrontBug.addHandler("PromiseRejectionEvent", function (error, msg) {
        console.log(error);
        return FrontBug.processStackMsg(error.reason)
    })

    //监听图片加载失败 事件捕获阶段
    FrontBug.config.reportImg && document.addEventListener("error", function (e) {
        var elem = e.target;
        if (elem.tagName.toLowerCase() == "img") {
            window.onerror(e,elem.src,0,0,e);
        }
    },true);

    //劫持document.createElement 为script添加result.crossOrigin
    var createElement = document.createElement;
    document.createElement = function(type){
        var el = createElement.call(document,type);
        if(type.toLowerCase() === "script"){
            el.crossOrigin = "anonymous";
        }
        return el;
    }
    //TODO:劫持xhr
    var OXMLHttpRequest = XMLHttpRequest;
    XMLHttpRequest = function _XMLHttpRequest(){
        // OXMLHttpRequest.call(this);
        var xhr = new OXMLHttpRequest();
        
        xhr.count = 0;
        var Oopen = xhr.open,
            Osend = xhr.send;
        xhr.open  = function (method,url,async=true){
            xhr.requestUrl = url;
            xhr.method = method;
            Oopen.call(xhr,method,url,async);
        }
        xhr.send = function (){
            xhr.sendStart = new Date().getTime();
            Osend.apply(xhr,arguments);
        }
        
        //绑定当前xhr
        function hs(e){
            handleStatus.call(xhr,hs,e);
        }
        function he(e){
            return handleError.call(xhr,he,e);
        }

        xhr.addEventListener("readystatechange",hs);
        xhr.addEventListener("error",he);
        
        return xhr;
    }
    function handleError(callback,e){
        var xhr = this;
       
        xhr.count = 1;
    
        var mes = "XHR ERROR "+window.location.href+" request to "+xhr.requestUrl+":"+xhr.method;
        // var e = new Error(mes);
        window.onerror(mes,xhr.requestUrl,0,0,e);
        xhr.removeEventListener("error",callback);
        xhr = null;
        
    }
    function handleStatus(){
        var xhr = this;
        if(xhr.readyState == 4){
            xhr.sendEnd = new Date().getTime();
            xhr.loadTime = xhr.sendEnd - xhr.sendStart;
        }
        if((xhr.status >= 400) && xhr.count == 0){
            xhr.count = 1;
            xhr.sendEnd = new Date().getTime();
            xhr.loadTime = xhr.sendEnd - xhr.sendStart;
            var mes = ""+xhr.status+":"+xhr.statusText+" loadtime="+xhr.loadTime+" @ "+xhr.responseURL;
            window.onerror(mes,xhr.responseURL,0,0,xhr);
            xhr.removeEventListener("readystatechange",callback);
            xhr = null;
        }
    }
    return FrontBug;
}))

