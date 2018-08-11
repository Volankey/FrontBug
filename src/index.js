// window.addEventListener("DOMContentLoaded",function(){
    FrontBug.setConfig({
        reportTo: "http://localhost:3000/report.cgi",
        reportKey: "fbug",
        reportPreFix: "test",
        sampling:1
    })
    // 无法监听 跨域错误具体信息，但可捕获到发生了错误，以及url和方法 跨域检测
    ajax("http://www.baidu.com", function (d) {
        console.log(d);
    })
    console.log(thisisabug)
    
// }) 



// // decodeURI('%2')
function ajax(url, fn) {
    // XMLHttpRequest对象用于在后台与服务器交换数据
    var xhr = new XMLHttpRequest();
    // console.log(xhr)
    xhr.open('GET', url, true);

    xhr.onreadystatechange = function () {
        // readyState == 4说明请求已完成
        if (xhr.readyState == 4 && xhr.status == 200 || xhr.status == 304) {
            // 从服务器获得数据
            fn.call(this, xhr.responseText);
        }
    };
    xhr.send();
}