var bodyParser = require('body-parser');
var cors = require('cors');
var DiffMatchPatch = require('diff-match-patch');
var express = require("express");
var http = require('http');
var ip_module = require("ip");
var session = require("express-session");

var port = 3000;
var prev = "";
var unique_code = -1;
var sess;
var connections = [];

var app = express();
var server = http.createServer(app).listen(port);
var io = require("socket.io")(server);
var dmp = new DiffMatchPatch();
var ip_address = ip_module.address();

app.use(session({secret: 'ABCDEF'}));
app.use(express.static("./node_modules"));
app.use(express.static("./public"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

io.on("connection", function(socket) {
    console.log(socket.id);
    connections.push(socket);
	
    socket.on("host_patch", function(patch_list) {
	socket.broadcast.emit("client_patch", patch_list);
	var res = dmp.patch_apply(patch_list, prev);
        prev = res[0];
    });
    
    socket.on("error", function(e) {
	console.log(e.message);
    });
	
    socket.on("disconnect", function(){
        connections.splice(connections.indexOf(this), 1);
    });
    
    socket.emit("init_text", prev);
    
    /*
    *   Correct it to emit only to host and not     bradcasting to everyone!
    */
    socket.on("client_code", function(code) {
        console.log("Emitting on: ", connections[0].id);
        connections[0].emit("client_code", code); 
    });
    
});

//app.use(function(req, res, next){
//	console.log(`${req.method} requested for ${req.url}`);
//	next();
//});
//
//app.use(function(req, res, next){
//		console.log(`${req.method} ---- ${JSON.stringify(req.body)}`);
//		next();
//});

app.post("/api/unique_code", function(req,res) {
    if(unique_code == -1) {
        unique_code = req.body.code;
        res.send("1");
    } else {   
        res.send(unique_code);
    }
});

app.post("/api/validate_code", function(req,res) {
    var user_input = req.body.code;
    if(unique_code != -1 && user_input == unique_code) {
        sess = req.session;
	console.log("Setting session");
	sess.loginState = "true";
	res.send("True");
    } else {
	res.send("False");
	sess.loginState = "false";
    }
});

app.get("/IpAddress", function(req, res){
    console.log(ip_address);
    if(ip_address == null || ip_address == undefined) {
        res.send("0");
    } else {
        console.log("sending");
        res.send(ip_address+":"+port); 
    }
});

app.get("/sessionCheck", function(req, res) {
    console.log("Sess: ",req.session);
    sess = req.session;
    if(sess.loginState == "true") {
        res.send("valid");
    } else {
        res.send("invalid");
    }
});

console.log("Server running on port " + port);
