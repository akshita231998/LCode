var socket = io("192.168.43.158:3000");
var dmp = new diff_match_patch();
var prev = "";
var text_area = document.getElementById('text');

socket.on("connect",function() {
  console.log("Socket connected");
});

socket.on("init_text", function(init) {
  prev = init;
  text_area.value = prev;
})

socket.on("disconnect", function() {
    console.log("Disconnected");
});

socket.on("code_patch_client", function(patch_list) {
  var res = dmp.patch_apply(patch_list, prev);
  console.log(res[0]);
  text_area.value = res[0];
  prev = res[0];
});
