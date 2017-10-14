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
var map_socketid_socket = {};
var map_name_socket_id = {};
var connection_names = [];
var client_status_map={};
var host_connected = 0;
var host_id = null;
var host_name=null;

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

function getSocketfromName(name) {
    var socket_index = map_name_socket_id[name];
    if(socket_index!=-1) {
        return map_socketid_socket[socket_index];
    }
    else{
        console.log("Found an invalid socket name!");
        return null;
    }
}
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
//    connections.push(socket);
    
    map_socketid_socket[socket.id] = socket;
    if(host_connected==1) {
        map_socketid_socket[host_id].emit("connection_list", client_status_map);
    }
	
    socket.emit("socket_id", socket.id);
    
    socket.on("host_patch", function(patch_list) {
        socket.broadcast.emit("client_patch", patch_list);
        var res = dmp.patch_apply(patch_list, prev);
        prev = res[0];
    });
    
    
    socket.on("disconnect", function(){
//        connections.splice(connections.indexOf(this), 1);
        map_socketid_socket[host_id].emit("connection_list", client_status_map);
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
        // client -----> host
        console.log("Emitting on: ", host_id);
        map_socketid_socket[host_id].emit("client_code", code); 
    });
    
    socket.on("client_code_changed", function(change_object) {
        // host -------> client
        client_socket = getSocketfromName(change_object.name); 
        if(client_socket!=null) {
            client_socket.emit("new_code", change_object.code);
        }
        else {
            console.log("Trying to send code to an invalid client");        
        }
    });

    socket.on("host_connected", function(host_socket_id) {
//        host -----> server
        host_connected = 1;
        host_id = host_socket_id;
        map_socketid_socket[this.id] =this;
        map_name_socket_id[host_name] = this.id;
    });
    socket.on("client_message", function(message) {
//        host/client ------> everyone else
        socket.broadcast.emit("chat_message_recieved", message);
    });
    
    socket.on("request_code", function(status) {
        // host -----> particular client
        var status_object = JSON.parse(status);
        getSocketfromName(status_object.target_name).emit("change_sharing_status", status_object.status);
    });
    
    socket.on("client_sharing_status", function(client_status) {
        client_status_map[client_status.name] = client_status.status;
        map_socketid_socket[host_id].emit("client_details",client_status_map);
    });
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
    var user_name  = req.body.name;
    var indexOfName = connection_names.indexOf(user_name);
    var error_log ={
        name_valid: 0,
        unique_code_valid: 0,
        valid_login : 1
    };
    if(unique_code != -1 && user_input == unique_code && indexOfName==-1) {
        error_log.name_valid = 1;
        error_log.unique_code_valid = 1;
        sess = req.session;
        sess.loginStateasClient = "true";
        sess.client_name = user_name;
        var connection_details = {
            name: user_name,
            sharing_enabled: 0
        };
        connection_names.push(connection_names);
        var object = {
            status: 0
        };
        client_status_map[user_name] = object;
    } else {
        
        error_log.valid_login = 0;
        if(indexOfName == -1)
        {
            error_log.name_valid = 1;
        }
        if(unique_code==-1)
        {
            error_log.unique_code_valid = -1;
        }
        if(unique_code==user_input)
        {
           error_log.unique_code_valid = 1;
        }
        sess.loginStateasClient = "false";
    }
    res.send(error_log);
});

app.post("/set_host_session", function(req, res){
    var name = req.body.name;
    sess = req.session;
    host_name = name;
    sess.loginStateasHost = "true";
    sess.name = name;
    res.send(null);
});
app.post("/pair_name_socket_id", function(req, res){
     map_name_socket_id[req.session.name] = req.body.socket_id;
});
app.get("/api/get_host_session",function(req, res){
    sess = req.session;
    var details  = {
        name: "",
        status: ""
    };
    if(sess.loginStateasHost=="true"){
        details.status="valid";
        details.name=sess.name;
    }
    else{
        details.status = "invalid";
    }
    res.send(details);
});

app.get("/get_client_session", function(req, res) {
    console.log("Sess: ",req.session); 
    sess = req.session;
    var details = {
        name:"",
        status:""
    };
    if(sess.loginStateasClient == "true") {
        details.name = req.session.client_name;
        details.status = "valid";
    } else {
        details.status = "invalid";
    }
    res.send(details);
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

app.get("/api/get_user_name", function(req,res) {
   var name = req.session.client_name;
    res.send(name);
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

