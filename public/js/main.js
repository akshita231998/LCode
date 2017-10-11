var host_editor_link = "/HostEditor.html";
var client_home_pg_link = "/index.html";
var host_connected_text = "Party hosted! Join it";
var host_disconnected_text = "All Set Go!";
var host_status = "disconnected";
$(document).ready(function() {
    $("#submit-btn").click(function() {
        if($("#host_name").val() != "") {
            var random = (Math.floor(Math.random() * 10000) + 1000);
            if(random >=10000)
            {
                random-=1001;
            }
            
            $("#login_card").fadeOut(function() {
                $("#unique_id_card").fadeIn();
            });
            
            $.post('/api/unique_code',{code : random}, function(res){
                if(res == "1") {
                    $("#unique_code").text(random);
                }
                else {
                    $("#unique_code").text(res);
                }
            });
        } else {
            $("#host_name").addClass("invalid");
        }
    });
    $("#cancel-party-btn").click(function() {
        $("#unique_id_card").fadeOut(function() {
            $("#login_card").fadeIn();
            $("#unique_code").text("");
        });
    });
    $.get("/api/host_status", function(res) {
        host_status = res;
        if(res == "disconnected") {
            $("#host_editor_link").attr("href",host_editor_link);
            $("#host_editor_link").text(host_disconnected_text);
            $("#host_editor_link").click(function() {
               $.get("set_host_session", null, function() {
                  window.location = "/HostEditor.html"; 
               });
                console.log("clicked");
            });
        } else {
            $("#host_editor_link").attr("href",client_home_pg_link);
            $("#host_editor_link").text(host_connected_text);
        }
    });
});
