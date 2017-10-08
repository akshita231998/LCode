var host_input = document.getElementById('host_input');

var prev = "";
var cur = "";

function change_occured() {
    cur = host_input.value;
    var diffArray = JsDiff["diffChars"](prev, cur);
    prev = cur;
    console.dir(diffArray);
}
host_input.onkeyup = change_occured;