var Messenger = {
	_methodPrefix:"_onMessage_",
	_receivers : [],
  _frameIds: [],
	_promises:[],
	_registerHandlers(){
    chrome.runtime.onMessage.addListener(this._onMessage.bind(this));
		chrome.runtime.onMessageExternal.addListener(this._onMessage.bind(this));
  },
  initialize:function(){
    this._registerHandlers();
		this.addReceiver("Messenger",this);
		Emitter.on(this,"TabDestroyed");
  },
  addReceiver: function(receiverName,receiver){
  	this._receivers[receiverName] = receiver;
  },
	_onEventTabDestroyed:function(tabId){
		this._onContextDestroy(tabId);
	},
	_onContextDestroy:function(tabId){
    if(this._promises[tabId]){
      log("Messenger._onContextDestroy releasing  tab info"+tabId);
      delete this._promises[tabId];
    }
  },
  _onMessage: function(message, from, reply){
      var error;
      if (typeof message !== "object") {
          log(error = "Got non-object message", message);
      } else if (!message.action) {
          log(error = "Message has no action", message);
      } else if (typeof message.action !== "string") {
          log(error = "Wrong action type", message);
      } //else if (!from || !from.tab || !from.tab.id) {
        //  log(error = "Only messages from tabs with available 'id' are served");
      //}
      if (error) {
          return reply({error});
      }

      var [receiver,method] = message.action.split(".");
      var promise = Promise.resolve();
      if (receiver === "self") {
          promise = promise.then(()=>{

              //return Promise.resolve(true);

              var p = new Promise((resolve, reject)=>{
                  chrome.tabs.sendMessage(
                      from.tab.id,
                      Object.assign({}, message, {action: method}),
                      {frameId: 0},
                      result=>{
                          if (chrome.runtime.lastError) {
                              return reject(chrome.runtime.lastError);
                          }
                          if (result.error) {
                              return reject(result.error);
                          }
                          resolve(result.data);
                      }
                  )
              })
              return true;
          });
      } else {
          var computedMethodName = this._methodPrefix+method;
          if (!this._receivers[receiver]) {
              log(error = `Got no receiver '${receiver}'`);
          } else if (!method) {
              log(error = "Empty method name", message);
          } else if (!this._receivers[receiver][computedMethodName]) {
              log(error = `Receiver '${receiver}' has no method '${method}'`);
          }
          if (error) {
              return reply({error});
          }

          promise = promise.then(()=>{
              // we can run sync and async methods
              //setting frame id if not set yet.
              if (from.tab){
                from.tab.frameId = from.tab.frameId || from.frameId;
              }
							try{
								if (message.data) message.data.cmd = method;
								else message.data = {cmd:method}
								_result = this._receivers[receiver][computedMethodName](message.data, from, reply);
								return _result;
							}
							catch(e){console.log(e)}
          });
      }
      log(`Messenger._onMessage: receving action '${message.action}'`);

      promise.then(data=>{
          reply({ok: true, data});
      }, error=>{
          if (typeof error === "object" && error.message) {
              return reply({error: error.message});
          }
          reply({error});
      });

      // we are async
      return true;
  },
  sendToMainPage: function (tabId,name,action,data){
    return new Promise(function(resolve, reject) {
      chrome.tabs.sendMessage(tabId,
        {name:name, action:action,data:data},
        {frameId: 0},
        function(result){
          if (chrome.runtime.lastError) {
            log("got error "+chrome.runtime.lastError.message+" "+tabId);
            reject(new Error("Can't send "+action+" to tab "+tabId));
          }
          else{
            resolve(result);
          }
        });
    });
  },
	sendToFrame: function (tabId,frameId,name,action,data){
    return new Promise(function(resolve, reject) {
      chrome.tabs.sendMessage(tabId,
        {name:name, action:action,data:data},
        {frameId: frameId},
        function(result){
          if (chrome.runtime.lastError) {
            log("got error "+chrome.runtime.lastError.message+" "+tabId);
            reject(new Error("Can't send "+action+" to tab "+tabId));
          }
          else{
            resolve(result);
          }
        });
    });
  },
  sendToSidebar: function (tabId,action,data){
    return new Promise(function(resolve, reject) {
      log("sending "+action+ " to Sidebar frameId="+Injector.getSidebarFrameId())
      chrome.tabs.sendMessage(tabId,
        {action:action,data:data},
        {frameId: Injector.getSidebarFrameId() },
        function(result){
          if (chrome.runtime.lastError) {
            log("got error "+chrome.runtime.lastError.message+" "+tabId);
            reject(new Error("Can't send "+action+" to tab "+tabId));
          }
          else{
            resolve(result);
          }
        });
    });
  },
	_rememberFramePromise:function(tabId,frameName,resolve){
		if (!this._promises[tabId]){
			this._promises[tabId] = [];
		}
		this._promises[tabId][frameName] = resolve;
	},
	getLastFrameResolveMethod(tabId, frameName){
		return this._promises[tabId][frameName];
	},
  sendToFrameByName:function(tabId, name, action,data) {
    return new Promise((resolve, reject)=>{
			// this is to resolve externally a dialog
			this._rememberFramePromise(tabId, name, resolve);
			var _timeInterval = setInterval(()=>{
				if (this._frameIds[tabId] && this._frameIds[tabId][name]){
					clearInterval(_timeInterval);
					chrome.tabs.sendMessage(tabId, {
	            action,
	            name,
	            data
	        },
	        {frameId: this._frameIds[tabId][name]},
	        message=>{
	            if (chrome.runtime.lastError) {
	                return reject(chrome.runtime.lastError);
	            }
	            if (message.error) {
	                log("got error", message.error);
	                return reject(new Error(message.error));
	            }
	            return resolve(message);
	        });
				}
			},200);
    });
  },
	_onMessage_mainScriptReady:function(data, from, reply){
		return Emitter.emit("MainScriptReady",{tabId:from.tab.id,from:from});
  },
  _onMessage_newFrame:function(data, from, reply){
    var tabId = from.tab.id;
    if (!this._frameIds[tabId]) {
      this._frameIds[tabId] = []
    }
    this._frameIds[tabId][data.name] = from.frameId;
    log("Messenger._onMessage_newFrame: newFrame: "+data.name+" "+from.frameId);
    return "ok-new-frame-"+from.frameId;
  }
};
Messenger.initialize();
