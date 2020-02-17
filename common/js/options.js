var Options = {
  set(options){
    return this.get().then(_options=>{
        for (var prop in options) {
          _options[prop]=options[prop];
        }
        chrome.storage.local.set( _options, function() {
          // Update status to let user know options were saved.
          return true;
        });
    });
  },
  get(){
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get({
        debugUseDevUrl:false,
        socketPortNumber: "25109",
      }, function(options) {
        resolve(options);
      });
    });
  }
};
