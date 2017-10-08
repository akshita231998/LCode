var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var unique_code = -1;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(function(req, res, next){
	console.log(`${req.method} requested for ${req.url}`);
	next();
});
app.use(express.static("./public"));
app.use(function(req, res, next){
		console.log(`${req.method} ---- ${JSON.stringify(req.body)}`);
		next();
});
app.post("/api/unique_code",function(req,res) {
	unique_code = req.body.code;
});
app.post("/api/validate_code",function(req,res) {
	var user_input = req.body.code;
	if(user_input == unique_code) {
		res.send("True");
	} else {
		res.send("False");
	}
});
app.listen(3000);
module.exports = app;
