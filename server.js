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
var host_connected = 0;
var host_id = null;

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
app.use(bodyParser.urlencoded({extended: false}));

app.use('/',function(req, res, next) {
	console.log(`${req.method} requested for ${req.url}`);
	next();
});

app.use(function(req, res, next){
		console.log(`${req.method} ---- ${JSON.stringify(req.body)}`);
		next();
});

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
        if(this.id == host_id) {
            host_connected = 0;
            host_id = null;
        }
    });
    
    socket.emit("init_text", prev);
    
    /*
    *   Correct it to emit only to host and not     bradcasting to everyone!
    */
    socket.on("client_code", function(code) {
        console.log("Emitting on: ", connections[0].id);
        connections[0].emit("client_code", code); 
    });
    
    socket.on("host_connected", function(host_socket_id) {
        host_connected = 1;
        host_id = host_socket_id;
    })
    
});


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
	sess.loginStateasClient = "true";
	res.send("True");
    } else {
	res.send("False");
	sess.loginStateasClient = "false";
    }
});

app.get("/set_host_session", function(req, res){
     sess = req.session;
        console.log(sess, " in set host");
     sess.loginStateasHost = "true";
    console.log(sess, " after it is set");
    res.send(null);
});
app.get("/api/get_host_session",function(req, res){
    sess = req.session;
    console.log(sess, " in get host");
    if(sess.loginStateasHost=="true"){
        res.send('valid');
    }
    else{
        res.send('invalid');
    }
});

app.get("/get_client_session", function(req, res) {
    console.log("Sess: ",req.session); 
    sess = req.session;
    if(sess.loginStateasClient == "true") {
        res.send("valid");
    } else {
        res.send("invalid");
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
app.get("/api/host_status", function(req, res) {
    if(host_connected) {
        res.send("connected");
    } else {
        res.send("disconnected");
    }
});

console.log("Server running on port " + port);

app.get("/api/test", function(req, res)
{
        var session= req.session;
        session.sampleText ="Hello";
    res.send("hello");
});
app.get("/api/print", function(req, res){
    console.log(req.session, " in api");
});