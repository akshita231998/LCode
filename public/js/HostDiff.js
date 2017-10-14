var code,editor;
var dmp = new diff_match_patch();
var prev = "";
var cur = "";

var socket;

$.get("/IpAddress",function(ip) {
   socket = io(ip);
   start();
});

function start() {
    socket.on("connect",function() {
        console.log(socket.id);
        socket.emit("host_connected", socket.id);
        console.log("Socket connected");
    });

    socket.on("init_text", function(init) {
      prev = init;
      editor.setValue(prev);
    });

    socket.on("client_code", function(code){
        console.log(code);
        /*
            Call a function to display selected client's shared code.
        */
    });
    
    socket.on("disconnect", function() {
        console.log("Disconnected");
    });

    socket.on("chat_message_recieved", function(message){
        console.log(message);
//        recieve_text(message);
    });

    socket.on("connection_list", function(name_status_map){
        /*
            Call a function to display list
        */
        console.dir(name_status_map);
//        display_list(name_list);
    });
}

function change_occured(data) {
  cur = data;
  var diff = dmp.diff_main(prev,cur);
  if (diff.length > 2) {
    dmp.diff_cleanupSemantic(diff);
  }
  var patch_list = dmp.patch_make(prev, cur, diff);
  prev = cur;

  socket.emit("host_patch",patch_list);
}

function client_code_changed(client_name,complete_code) {
    var change_object = {
        name: client_name,
        code: complete_code
    };
    socket.emit("client_new_code",change_object);
}

function sendChatMessage(message) {
    var new_message = client_name +": "+message;
    socket.emit("client_message",new_message);
}

$(document).ready(function() {
  code = $(".codemirror-textarea")[0];
  editor = CodeMirror.fromTextArea(code,{
    theme : "nec",
    mode : "javascript",
    electricChars : true,
    smartIndent : true,
    lineNumbers : true
  });
  editor.on("changes", function(e) {
    change_occured(editor.getValue());
  });
});

function request_code(name, state)
{
    /*
        Call this function on name click, or while closing shared code
        If request started => state : 1
        If request disabled => state: 0
    */

    var status = {
        target_name: name,
        enabled: state
    };
    socket.emit("request_code", JSON.stringify(status));
}
