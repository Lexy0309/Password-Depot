// @if showLogs=true
/*function log(a){
  var _now = new Date();
  console.log(_now.getMinutes()+" "+_now.getSeconds()+" "+_now.getMilliseconds(),a);
}*/
log = Function.prototype.bind.call(console.log,console);
// @endif
// @if showLogs=false
function log() {}
// @endif
