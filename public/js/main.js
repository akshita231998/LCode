/*
    This script is used in server.html
*/
var host_editor_link = "/HostEditor.html";
var client_home_pg_link = "/index.html";
var host_connected_text = "Party hosted! Join it";
var host_disconnected_text = "All Set Go!";
var host_status = "disconnected";
$(document).ready(function() {
    $("#submit-btn").click(function() {
        if($("#host_name").val() != "") {
            var random = (Math.floor(Math.random() * 10000) + 1000);
            if(random >=10000) {
                random-=1001;
            }
            $("#login_card").fadeOut(function() {
                $("#unique_id_card").fadeIn();
            });
            //Send unique code to the server
            $.post('/api/unique_code',{code : random}, function(res) {
                $("#unique_code").text(res);
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

    //Check if a party has been hosted already
    $.get("/api/host_status", function(res) {
        host_status = res;
        if(res == "disconnected") {
            console.log("Hello");
            $("#host_editor_link").attr("href",host_editor_link);
            $("#host_editor_link").text(host_disconnected_text);
            $("#host_editor_link").click(function() {
                var host_name = $("#host_name").val();
                console.log(host_name);
                $.post("set_host_session", {name: host_name}, function(res) {
                    window.location = "/HostEditor.html";
                });
            });
        } else {
            console.log("Bye");
            $("#host_editor_link").attr("href",client_home_pg_link);
            $("#host_editor_link").text(host_connected_text);
        }
    });
});
