需要对以下几点注意

>上报采用new Image().src来上报

>控制采样率

```
if(Math.random() < FrontBug.config.sampling) {
            if (!src)
                return;
            var img = new Image();
            img.src = src;
            img.onload = function () {
                img = null;
            }
        }
```

## 1、onerror捕获JavaScript异常，对应跨域检测也有方案；


```
window.onerror = function (msg, url, line, col, error) {
        console.log(getObjectClass(error))
        var errorType = getObjectClass(error);
        if (handler[errorType] == undefined) {
            console.log("默认");
            
            report(getSrc(handler.default(error, msg, url, line, col)));

        } else {
            report(getSrc(handler[errorType](error, msg, url, line, col)));
        }
        return FrontBug.config.isConsole;
    }
```

## 2.静态资源异常
addEventListener('error', handler, true)来捕获静态资源异常，包括js、img、css等**；在捕获阶段**,当然也可以根据perfomance.getEntries()遍历对比找到img的资源错误

这里采用addEventListener('error', handler, true)



```
//监听图片加载失败 事件捕获阶段
    FrontBug.config.reportImg && document.addEventListener("error", function (e) {
        var elem = e.target;
        if (elem.tagName.toLowerCase() == "img") {
            window.onerror(e,"",0,0,e);
        }
    },true);
```


### 3、Resource Timing API 和 Performance Timing API来进行性能检测和内存检测；


```
//TODO:
```


### 4、扩展XHR原型，检测返回的状态码，如404等，来检测ajax请求失败、错误；

```
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
        function hs(){
            handleStatus.call(xhr,hs);
        }
        function he(){
            return handleError.call(xhr,he);
        }

        xhr.addEventListener("readystatechange",hs);
        xhr.addEventListener("error",he);
        
        return xhr;
    }
    function handleError(callback){
        var xhr = this;
       
        xhr.count = 1;
    
        var mes = "XHR ERROR "+xhr.requestUrl+":"+xhr.method;
        // var e = new Error(mes);
        window.onerror(mes,"",0,0,undefined);
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
            window.onerror(mes,"",0,0,"");
            xhr.removeEventListener("readystatechange",callback);
            xhr = null;
        }
    }
```

### 5.对外链引入的script标签
>浏览器对非同源的script会进行错误屏蔽，避免信息安全泄露，在外源的script出错会返回Script Error， line 0， column 0， error null


对外链引入的script标签也需要进行对应的错误捕获，通过劫持 createElement函数为script添加crossOrigin="anonymous"属性
```
 //劫持document.createElement 为script添加result.crossOrigin
    var createElement = document.createElement;
    document.createElement = function(type){
        var el = createElement.call(document,type);
        if(type.toLowerCase() === "script"){
            el.crossOrigin = "anonymous";
        }
        return el;
    }
```


###### 同时 在后端需要配置 
```
Access-Control-Allow-Origin:*
```


### 6、source-map用来对压缩后的代码进行解析到正确的行列。

###### webpack4.x中配置

```
devtool: 'source-map',
```
然后将打包出来的的map文件拷贝到后端对应的文件夹中



###### 后端需要安装 source-map

```
npm install -S -D source-map
```
###### 后端代码

```
/**
 * 
 * @param {string} mapFile 文件名称
 * @param {number} line 压缩后的行
 * @param {number} col 压缩后的列
 * @param {function} callback 成功后的回掉 传入一个result数据 包含具体原始代码行列以及代码
 */
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

```



