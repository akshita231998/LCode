var dmp = new diff_match_patch();
var prev = "";
var cur = "";

function change_occured(data){
  cur = data;
  var diff = dmp.diff_main(prev,cur);
  if (diff.length > 2) {
    dmp.diff_cleanupSemantic(diff);
  }
  var patch_list = dmp.patch_make(prev, cur, diff);
  var res = dmp.patch_apply(patch_list, prev);
  console.log(res[1]);
  prev = cur;
}
