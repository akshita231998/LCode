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
var map_socketid_socket = {};
var map_name_socket_id = {};
var connection_names = [];
var client_status_map = new Map();
var host_connected = 0;
var host_id = null;
var host_name = null;

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

//Function to get socket from client name
function getSocketfromName(name) {
    var socket_index = map_name_socket_id[name];
    if(socket_index != -1) {
        return map_socketid_socket[socket_index];
    } else {
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

    map_socketid_socket[socket.id] = socket;

    //Sending list of active connections to host everytime a client connects
    if(host_connected == 1) {
        map_socketid_socket[host_id].emit("connection_list", client_status_map);
    }

    //Send socket_id to client side
    socket.emit("socket_id", socket.id);

    //Broadcast the host code patch list to all the clients
    socket.on("host_patch", function(patch_list) {
        socket.broadcast.emit("client_patch", patch_list);
        var res = dmp.patch_apply(patch_list, prev);
        prev = res[0];
    });

    //Send list of new active client connections to host
     socket.on("disconnect", function(){
         if(this.id == host_id) {
             host_connected = 0;
             host_id = null;
         } else {
            Object.keys(map_name_socket_id).forEach(function(name) {
              var str = map_name_socket_id[name];
              if(!str.localeCompare(socket.id)) {
                delete map_name_socket_id[name];
                delete client_status_map[name];
                connection_names.splice(connection_names.indexOf(name),1);
              }
            });
            if(host_connected) {
              map_socketid_socket[host_id].emit("connection_list", client_status_map);
            }
         }
     });

    //Send initial host code to client
    socket.emit("init_text", prev);

    //Sending client code to host
    socket.on("client_code", function(code) {
        console.log("Emitting on: ", host_id);
        map_socketid_socket[host_id].emit("client_code", code);
    });

    //Sending client's edited code back to client
    socket.on("client_code_changed", function(change_object) {
        client_socket = getSocketfromName(change_object.name);
        if(client_socket != null) {
            client_socket.emit("new_code", change_object.code);
        } else {
            console.log("Trying to send code to an invalid client");
        }
    });

    //Storing host's info
    socket.on("host_connected", function(host_socket_id) {
        host_connected = 1;
        host_id = host_socket_id;
        map_socketid_socket[this.id] =this;
        map_name_socket_id[host_name] = this.id;
    });

    //Chat message functionality
    socket.on("client_message", function(message) {
        socket.broadcast.emit("chat_message_recieved", message);
    });

    //To change sharing status of client on host's request
    socket.on("request_code", function(status) {
        var status_object = JSON.parse(status);
        getSocketfromName(status_object.target_name).emit("change_sharing_status", status_object.status);
    });

    //Sending list of clients with their sharing status to host
    socket.on("client_sharing_status", function(client_status) {
        client_status_map[client_status.name] = client_status.status;
        map_socketid_socket[host_id].emit("client_details",client_status_map);
    });
});

//Sending unique code to the host (unique code will remain same)
app.post("/api/unique_code", function(req,res) {
    if(unique_code == -1) {
        unique_code = req.body.code;
    }
    res.send(unique_code);
});

//Validating unique code and name entered by client and sending error_log to client
app.post("/api/validate_code", function(req,res) {
    var user_input = req.body.code;
    var user_name  = req.body.name;
    var indexOfName = connection_names.indexOf(user_name);
    sess = req.session;
    var error_log ={
        name_valid: 0,
        unique_code_valid: 0,
        valid_login : 1
    };
    if(unique_code != -1 && user_input == unique_code && indexOfName == -1) {
        error_log.name_valid = 1;
        error_log.unique_code_valid = 1;
        sess.loginStateasClient = "true";
        sess.client_name = user_name;
        var connection_details = {
            name: user_name,
            sharing_enabled: 0
        };
        connection_names.push(user_name);
        var object = {
            status: 0
        };
        client_status_map[user_name] = object;
    } else {
        error_log.valid_login = 0;
        if(indexOfName == -1) {
            error_log.name_valid = 1;
        }
        if(unique_code==-1) {
            error_log.unique_code_valid = -1;
        }
        if(unique_code==user_input) {
           error_log.unique_code_valid = 1;
        }
        sess.loginStateasClient = "false";
    }
    res.send(error_log);
});

//Setting host session
app.post("/set_host_session", function(req, res){
    var name = req.body.name;
    sess = req.session;
    host_name = name;
    sess.loginStateasHost = "true";
    sess.name = name;
    res.send(null);
});

//Storing socket_id and name pairs for clients
app.post("/pair_name_socket_id", function(req, res) {
    console.log(req.session.client_name);
     map_name_socket_id[req.session.client_name] = req.body.socket_id;
});

app.post("/destroy_session", function(req, res){
    if(req.session != null) {
        req.session.destroy();
    }
});

//Check for valid host session to allow access to host editor only if it is a valid host session
app.get("/api/get_host_session",function(req, res){
    sess = req.session;
    var details  = {
        name: "",
        status: ""
    };
    if(sess.loginStateasHost == "true"){
        details.status = "valid";
        details.name = sess.name;
    } else {
        details.status = "invalid";
    }
    res.send(details);
});

//Check for valid client session to allow access to client editor only if it is a valid session
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

//Send ip_address to client to open socket connection
app.get("/IpAddress", function(req, res){
    if(ip_address == null || ip_address == undefined) {
        res.send("0");
    } else {
        res.send(ip_address+":"+port);
    }
});

//Send host status to check if party has been hosted or not
app.get("/api/host_status", function(req, res) {
    if(host_connected) {
        res.send("connected");
    } else {
        res.send("disconnected");
    }
});

console.log("Server running on port " + port);
