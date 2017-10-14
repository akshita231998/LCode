$(document).ready(function() {

   $.get("/api/test", function(data){
       console.log(data);
   });
   $("#submit-btn").click(function() {

       var name = $('#client_display_name').val();
       var unique_code = $("#unique_code").val();

      if(name != "" && unique_code != "" && unique_code.length == 4 && $.isNumeric(unique_code)) {
            $("#login_card").addClass("disabled");
            $("#progress_bar").removeClass("hidden");

            $.post("/api/validate_code", {code: unique_code, name: name}, function(res) {
                $("#progress_bar").addClass("hidden");
                $("#login_card").removeClass("disabled");
                if(res.valid_login == 0) {
                    console.log('hello');
                    /*
                    take appropriate actions
                    on Name already taken,
                    on server not started
                    */
                } else {
                    window.location.replace("/client_text_editor.html");
                }
          });
      }
       else {
           if($('#client_display_name').val() =="" )
           {
               $('#client_display_name').addClass("validate invalid") ;
           }
         $("#progress_bar").addClass("hidden");
         $("#login_card").removeClass("disabled");
         $("#unique_code").addClass("validate invalid");
         $("#unique_code").val("");
       }
   });
});
