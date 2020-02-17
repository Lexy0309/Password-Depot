var DomObserver = {
  observerConfig : {
      // we are tracking node additions
      childList: true,
      subtree: true
  },
  _observerSet:false,
  _round: 0,
  _timerId:-1,
  _callback:null,
  Observer : new MutationObserver((mutations) => {
    mutations.some((mutation) =>{
      var result = false;
      if (mutation.type == 'childList'){
        log("Observer: Added "+mutation.addedNodes.length)
        if (mutation.addedNodes.length){
          DomObserver._callback(mutation.addedNodes[0]);
        }
      }
    });
  }),
  setTarget : function(target,callback){
    this._callback = callback;
    if (this._observerSet){
      log("Changing observed target to "+attributes);
      this.disconnect();
    }
    this.Observer.observe(target, this.observerConfig);
    this._observerSet=true;
  },
  disconnect: function(){
    this.Observer.takeRecords();
    this.Observer.disconnect();
    log("Disconnecting observer");
    this.clearTimeout();
  },
};
