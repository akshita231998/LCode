$(document).ready(function() {
   $("#submit-btn").click(function() {
      if($("#unique_code").val() != "" && $("#unique_code").val().length == 4 && $.isNumeric($("#unique_code").val())) {
            $("#login_card").addClass("disabled");
            $("#progress_bar").removeClass("hidden");

            $.post("/api/validate_code", {code: $("#unique_code").val()}, function(res) {
              if(res.toString() == 'False') {
                console.log('hello');
                $("#progress_bar").addClass("hidden");
                $("#login_card").removeClass("disabled");
                $("#unique_code").addClass("validate invalid");
                $("#unique_code").val("");
              } else {
                // window.location.replace("/");
              }
            });
      }
       else {
         $("#progress_bar").addClass("hidden");
         $("#login_card").removeClass("disabled");
         $("#unique_code").addClass("validate invalid");
         $("#unique_code").val("");
       }
   });
});
