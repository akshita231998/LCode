var prev = "";
var cur = "";

function change_occured(data) {
    cur = data;
    var diffArray = JsDiff["diffChars"](prev, cur);
    prev = cur;
    console.dir(diffArray);
}
