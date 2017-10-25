var bodyParser = require('body-parser');
var cors = require('cors');
var express = require("express");
var http = require('http');
var fs = require('fs');

var port = 4000;

var app = express();
var server = http.createServer(app).listen(port);
var io = require("socket.io")(server);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

io.on("connection", function(socket) {
  console.log("hello");
  var dir = './tmp';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  socket.on("download_host_code", function(code) {
    var host_path = dir+'/host_code';
    fs.writeFile(host_path, code);
  });
  socket.on("download_my_code", function(code) {
    var my_path = dir+'/my_code';
    fs.writeFile(my_path, code);
  });
  socket.on("shut_down_server", function(){
    console.log("close");
    server.close();
  });
});

console.log("Server running on port " + port);
