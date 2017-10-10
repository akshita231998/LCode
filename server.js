var express = require("express");
var http = require('http');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
var server = http.createServer(app).listen(3000);
var io = require("socket.io")(server);
var unique_code = -1;
var prev = "";
var DiffMatchPatch = require('diff-match-patch');
var dmp = new DiffMatchPatch();

app.use(express.static("./node_modules"));
app.use(express.static("./public"));
app.use(cors());
io.on("connection", function(socket)
{
	console.log("Hello");
	socket.emit("init_text", prev);
	socket.on("patch",function(patch_list) {
		socket.broadcast.emit("code_patch_client", patch_list);
		var res = dmp.patch_apply(patch_list, prev);
	  prev = res[0];
	});
	socket.on("error", function(e) {
		console.log(e.message);
	});
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(function(req, res, next){
	console.log(`${req.method} requested for ${req.url}`);
	next();
});

app.use(function(req, res, next){
		console.log(`${req.method} ---- ${JSON.stringify(req.body)}`);
		next();
});

app.post("/api/unique_code",function(req,res) {
	unique_code = req.body.code;
});

app.post("/api/validate_code",function(req,res) {
	var user_input = req.body.code;
	if(unique_code!=-1 && user_input == unique_code) {
		res.send("True");
	} else {
		res.send("False");
	}
});

console.log("Server running on port 3000");
