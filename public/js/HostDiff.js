var code,editor;
var dmp = new diff_match_patch();
var prev = "";
var cur = "";
var last_client_name="";
var ed_can_emit = 1;
var name_status_map_local={};
var socket;
var client_code_status = 0;

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
        ed_can_emit = 0;
        console.log(code);
        ed.setValue(code);
        ed_can_emit = 1;
    });

    socket.on("disconnect", function() {
        console.log("Disconnected");
    });

    socket.on("chat_message_recieved", function(message){
        console.log(message);
       receive_text(message);
    });

    socket.on("check_client_logout", function(client_name) {
      if(!client_name.localeCompare(last_client_name) && client_code_status == 1) {
        $("#client_editor").fadeOut(200, function() {
               $("#host_editor").fadeIn(200);
        });
      }
    });

    socket.on("connection_list", function(name_status_map){
        console.log("Here map ",name_status_map);
        name_status_map_local = name_status_map;
        $("#connected_box").html('<h4>Connected</h4><div class="card" id="host_card"><div class="card-content" onclick="back_to_host();"><h5>Your code</h5></div></div>');
        $.each(name_status_map, function( name, status ) {

            if(status.status == 1)
            {
                $("#connected_box").append('<div class="card connected_users" onclick="change_editor(this);"><div class="card-content"><h5>'+name+'</h5><i class="material-icons blue-text">fiber_manual_record</i></div></div>');
            }
            else{
                $("#connected_box").append('<div class="card connected_users"><div class="card-content"><h5>'+name+'</h5></div></div>');
            }

        });
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
    if(ed_can_emit == 1)
    {
        var change_object = {
            name: client_name,
            code: complete_code
        };
        socket.emit("client_new_code",change_object);
    }
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

function change_editor(obj) {
    console.dir();
    if(last_client_name!="") {
        request_code(last_client_name, 0);
        client_code_status = 0;
    }
    last_client_name = obj.children[0].children[0].innerHTML;
    $("#client_name_box").html(last_client_name+'\'s code');
    request_code(last_client_name, 1);
    client_code_status = 1;
    $("#host_editor").fadeOut(200, function() {
       $("#client_editor").fadeIn(200);
    });
};

function back_to_host() {
    if(last_client_name != "") {
        request_code(last_client_name, 0);
        $("#client_editor").fadeOut(200, function() {
               $("#host_editor").fadeIn(200);
        });
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
        client_code_changed(last_client_name, ed.getValue());
  });

});

$('.logout_button').on('click',function() {
  alert("You are logging out. Save your work before leaving.");
  logout();
});

function request_code(name, state) {
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

function logout() {
  socket.disconnect();
  $.post("/destroy_host_session");
  socket = null;
  window.location = "server.html";
}
