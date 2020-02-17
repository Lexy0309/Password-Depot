var Emitter = {
  events:[],
  on:function(target,eventName){
    var result = false;
    for(event in this.events){
      if (event == eventName){
        result = true;
      }
    }
    if (!result){
      this.events[eventName]={};
      this.events[eventName].targets = [];
    }
    this.events[eventName].targets.push(target);
  },
  emit:function(eventName, value){
    var _result = null;
    if (this.events[eventName]){
      this.events[eventName].targets.forEach(target => {
        var method = "_onEvent"+eventName;
        if (target[method]){
          var _result0 = target[method](value);
          _result = _result?_result:_result0;
        }
        else{
          log("ERROR: emit: target has no method "+method);
        }
      });
    }
    else{
      log("ERROR: emit: event is not registered by any target "+eventName);
    }
    return _result;
  },
};
