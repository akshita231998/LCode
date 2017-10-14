var code,editor;
var dmp = new diff_match_patch();
var prev = "";
var cur = "";

var socket;
function receive_text(text) {
    	 var msg = document.createElement("div");
            msg.className = "receivedMsg";
            var msgText = document.createElement("p");
            msgText.innerHTML = text;
            msg.appendChild(msgText);
            document.getElementById("msg-box").appendChild(msg);
            document.getElementById("msg-box").scrollTop = document.getElementById("msg-box").lastChild.offsetTop + document.getElementById("msg-box").lastChild.offsetWidth;
    }
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
        ed.setValue(code);
    });
    
    socket.on("disconnect", function() {
        console.log("Disconnected");
    });

    socket.on("chat_message_recieved", function(message){
        console.log(message);
       receive_text(message);
    });

    socket.on("connection_list", function(name_status_map){
        $.each( name_status_map, function( name, status ) {
            $("#connected_box").append('<div class="card connected_users"><div class="card-content"><h5>'+name+'</h5><p class="red-text">Wants to review!</p></div></div>');
        });
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

function send_text(e) {
        if(document.getElementById("msg_bar").value != "" && e.keyCode == 13) {
            var msg = document.createElement("div");
            msg.className = "sentMsg right";
            var msgText = document.createElement("p");
            var text_msg = document.getElementById("msg_bar").value;
            msgText.innerHTML = text_msg;
            sendChatMessage(text_msg);
            msg.appendChild(msgText);
            document.getElementById("msg-box").appendChild(msg);
            document.getElementById("msg-box").scrollTop = document.getElementById("msg-box").lastChild.offsetTop + document.getElementById("msg-box").lastChild.offsetWidth;
            document.getElementById("msg_bar").value = "";
        }
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
    code = $(".codemirror-textarea")[1];
  ed = CodeMirror.fromTextArea(code,{
    theme : "nec",
    mode : "javascript",
    electricChars : true,
    smartIndent : true,
    lineNumbers : true
  });
    ed.on("changes", function(e) {
        client_code_changed(client_name, editor.getValue());
  });
    $(".connected_users").click(function() {
        $("#host_editor").fadeOut(200, function() {
           $("#client_editor").fadeIn(200); 
        });
    });
    $("#host_card").click(function() {
        $("#client_editor").fadeOut(200, function() {
           $("#host_editor").fadeIn(200); 
        });
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
