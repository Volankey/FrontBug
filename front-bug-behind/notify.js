var nodemailer  = require('nodemailer');

var mailTransport = nodemailer.createTransport({
    host : 'smtp.qq.com',
    secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
    auth : {
        user : '56228105@qq.com',
        pass : 'xjnmowtdnteobgjh'
    },
});
var options = {
    from        : '"cvte" <56228105@qq.com>',
    to          : '"白集文" <volankey@qq.com>',
    // cc         : ''  //抄送
    // bcc      : ''    //密送
    subject        : 'cvte结果已出',
    text          : 'cvte结果已出',
    html           : '<h1>你好，这是一封来cvte的邮件！</h1><p><img src="cid:00000001"/></p>',
    // attachments : 
    //             [
    //                 {
    //                     filename: 'img1.png',            // 改成你的附件名
    //                     path: 'public/images/img1.png',  // 改成你的附件路径
    //                     cid : '00000001'                 // cid可被邮件使用
    //                 },
    //                 {
    //                     filename: 'img2.png',            // 改成你的附件名
    //                     path: 'public/images/img2.png',  // 改成你的附件路径
    //                     cid : '00000002'                 // cid可被邮件使用
    //                 },
    //             ]
};

mailTransport.sendMail(options, function(err, msg){
    if(err){
        console.log(err);
        // res.render('index', { title: err });
    }
    else {
        console.log(msg);
        // res.render('index', { title: "已接收："+msg.accepted});
    }
});