/*
    Used in client_text_editor.html
*/
var socket;
var dmp = new diff_match_patch();
var prev = "";
var socket_id=null; 
var sharing_status=0;

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
        socket_id = this.id;
        $.post("pair_name_socket_id", {socket_id: this.id});
    });
    
    socket.on("socket_id", function(var_socket_id){
        socket_id = var_socket_id;

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
    socket.on("change_sharing_status", function(new_sharing_status){
        sharing_status =new_sharing_status; 
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
/*
    call this method as soon as code in client box changes
*/
function keyPressed(text){
    if(sharing_status == 1)
    {
        socket.emit("client_code", text);
    }
}