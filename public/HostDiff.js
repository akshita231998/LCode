var dmp = new diff_match_patch();
var prev = "";
var cur = "";

var socket = io("http://localhost:3000");

socket.on("connect",function() {
  console.log("Socket connected");
});

socket.on("disconnect", function() {
    console.log("Disconnected");
});

function change_occured(data){
  cur = data;
  var diff = dmp.diff_main(prev,cur);
  if (diff.length > 2) {
    dmp.diff_cleanupSemantic(diff);
  }
  var patch_list = dmp.patch_make(prev, cur, diff);
  prev = cur;
  socket.emit("patch",patch_list);
}
