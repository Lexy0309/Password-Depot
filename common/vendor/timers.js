(function(w) {
    var oldST = w.setTimeout;
    var oldSI = w.setInterval;
    var oldCI = w.clearInterval;
    var timersT = [];
    var timersI = [];
    w.timersT = timersT;
    w.timersI = timersI;
    w.setTimeout = function(fn, delay,track=true, title="NOTITLE") {
        var id = oldST(function() {
            fn && fn();
            removeTimer(id,timersT);
        }, delay);
        if (track){
          timersT.push({id,title:title+"-"+delay});
        }
        return id;
    };
    w.setInterval = function(fn, delay,track=true, title="NOTITLE") {
        var id = oldSI(fn, delay);
        if (track){
          timersI.push({id,title:title+"-"+delay});
        }
        return id;
    };
    w.clearInterval = function(id) {
        oldCI(id);
        removeTimer(id,timersI);
    };
    w.clearTimeout = w.clearInterval;

    function removeTimer(id,timers) {
        var index = timers.findIndex((t)=>{return t.id==id});
        if (index >= 0)
            timers.splice(index, 1);
    }
}(window));
