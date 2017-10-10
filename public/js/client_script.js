
var socket;
var dmp = new diff_match_patch();
var prev = "";
var text_area = document.getElementById('text');

$.get("/sessionCheck",function(response) {
    console.log(response);
    if(response=="invalid"){
        window.location = "index.html";      
    }
});
$.get("/IpAddress",function(ip) {
   console.log("IP address: ", ip);
   socket = io(ip);
   start();
});
function start()
{
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

    socket.on("client_patch", function(patch_list) {
      var res = dmp.patch_apply(patch_list, prev);
      console.log(res[0]);
      text_area.value = res[0];
      prev = res[0];
    });
}
