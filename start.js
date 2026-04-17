const { cbbjsvmp } = require("./jiajianbian");
const outpath = "./outsrc/68799789.js"

const fs = require("fs");
// 引入核心模块
var http = require('http')
//引入url模块
var url = require("url");
const multiparty = require('multiparty');
const { Buffer } = require("safe-buffer");
const FileReader = require('filereader')
const qs = require('querystring');

var server = http.createServer((req, res) => {
})

// 绑定端口号(3000)
server.listen(3000, () => {
})

// 监听客户端发起的请求
server.on('request', (req, res) => {
  var parsedUrl = url.parse(req.url);
  var pathname = parsedUrl.pathname;
  if (pathname == '/stringUpload') { //接收字符串
    let bodyData = '';
    req.on('data', (chunk) => {
      bodyData += chunk;
    });
    req.on('end', () => {
      const formData = qs.parse(bodyData);
      //把解析的文件数据放到cbbjsvmp
      try {
        data = cbbjsvmp(formData.jsString, outpath);
      } catch (err) {
        res.statusCode = 400;
        res.end("文本出错,请检查");
      }
      res.end(data);
    });
  } else if (pathname == '/fileUpload') { //接收js文件
    var data;
    const form = new multiparty.Form();
    let fileData = null;
    form.on('part', part => {
      if (part.filename) {
        let buffers = [];
        part.on('data', data => {
          buffers.push(data);
        });
        part.on('end', () => {
          fileData = Buffer.concat(buffers);
        });
      }
    });
    form.on('close', () => {
      try {
        //把解析的文件数据放到cbbjsvmp
        var stringFile = fileData.toString('utf-8');
        var deleteString = "if(jsvmp!=='jsvmp.com'){\n" +" throw new Error(\"请勿删除jsvmp.com\");\n" +"}";
        var jsvmp = deleteString.concat("\n",stringFile);
        data = cbbjsvmp(jsvmp, outpath);
      } catch (err) {
        res.statusCode = 400;
        res.end("文本出错,请检查");
      } 
      res.end(data);
    });
    form.parse(req);
  }


}
)
server.on('error', (error) => {
  console.error('Server error occurred:', error);
});

/**
 * 此方法是使进程不终止
 */
process.on('uncaughtException', function (err) {

});