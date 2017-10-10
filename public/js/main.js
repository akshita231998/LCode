$(document).ready(function() {
    $("#submit-btn").click(function() {
        if($("#host_name").val() != "") {
            var random = (Math.floor(Math.random() * 10000) + 1);
            
            $("#login_card").fadeOut(function() {
                $("#unique_id_card").fadeIn();
            });
            $.post('/api/unique_code',{code : random}, function(res){
                if(res=="1")
                {
                    $("#unique_code").text(random);
                }
                else
                {
                    $("#unique_code").text(res);
                }
            });
        }
        else {
            $("#host_name").addClass("invalid");
        }
    });
    $("#cancel-party-btn").click(function() {
        $("#unique_id_card").fadeOut(function() {
            $("#login_card").fadeIn();
            $("#unique_code").text("");
        });
    });
});
