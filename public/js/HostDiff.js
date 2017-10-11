var code,editor;
var dmp = new diff_match_patch();
var prev = "";
var cur = "";

var socket;

$.get("/IpAddress",function(ip) {
   socket = io(ip);
   start();
});

function start(){
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
    });
    socket.on("disconnect", function() {
        console.log("Disconnected");
    });
    
    socket.on("client_code", function(data){
        console.log(data);
    });
}
function change_occured(data){
  cur = data;
  var diff = dmp.diff_main(prev,cur);
  if (diff.length > 2) {
    dmp.diff_cleanupSemantic(diff);
  }
  var patch_list = dmp.patch_make(prev, cur, diff);
  prev = cur;
  socket.emit("host_patch",patch_list);
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
