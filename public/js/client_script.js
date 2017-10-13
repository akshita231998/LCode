/*
    Used in client_text_editor.html
*/
var socket;
var dmp = new diff_match_patch();
var prev = "";

$.get("/IpAddress",function(ip) {
     if(ip!=undefined && ip!=null) {
        
        /*
            Contains error proxy connection refused!
            Server disconnected error!
        */
        socket = io(ip);
        console.log(socket);
        console.log(socket.id);
        start();
    }
});

function start() {
    socket.on("connect",function() {
        console.log("Socket connected");
        

    });
    
     socket.on("init_text", function(init) {
      prev = init;
      host_editor.setValue(prev);
    })

    socket.on("disconnect", function() {
        console.log("Disconnected");
    });

    socket.on("client_patch", function(patch_list) {
      var res = dmp.patch_apply(patch_list, prev);
      console.log(res[0]);
      host_editor.setValue(res[0]);
      prev = res[0];
    });
    
    socket.on("chat_message_recieved", function(message)    
    {
        receive_text(message);
    });
}
 function receive_text(text) {
    	 var msg = document.createElement("div");
            msg.className = "receivedMsg";
            var msgText = document.createElement("p");
            msgText.innerHTML = text;            
            msg.appendChild(msgText);
            document.getElementById("msg-box").appendChild(msg);   
            document.getElementById("msg-box").scrollTop = document.getElementById("msg-box").lastChild.offsetTop + document.getElementById("msg-box").lastChild.offsetWidth;
    }             
/*
    Chat box functionality
    call on every enter press inside chat box
*/
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