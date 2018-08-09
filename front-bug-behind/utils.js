
const utils = {
    getQueryString:function (source,name) { 
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
        var r = source.match(reg); 
        if (r != null) return unescape(r[2]); return null; 
    },
    fixPath:function(filepath) {
        return filepath.replace(/\.[\.\/]+/g, "");
    } 
}
module.exports=utils;
