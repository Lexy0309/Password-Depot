// pdBackgroundScript.js
// this is a utility function used by hot-reload
// to trigger any process before restart
// unused for the moment
function ApplicationInitDebugPhase(){
  return Promise.resolve(true)
}
//@if browser!='safari' && stage="dev" && browser!="firefox"
// @include ../../vendor/hot-reload.js
//@endif
// @include ../log.js
// @include ../options.js
// @include ../emitter.js
// @include ./messenger.js
// @include ./websocket.js
// @include ./nativemessenger.js
// @include ./proxy.js
// @include ./iconeApplication.js


// var onExtensionMounted = function (a, b, c) {
  
// };

var addonMgr = {
	initialize:function(){
    // initialize a native app communication or a websocket as a second choice
		proxyMgr.initialize({"cmd":"checkState"});
    // add this object as the receiver for all messages directed to "addonMgr"
		Messenger.addReceiver("addonMgr",this);
    // register a handler to capture a click on the addon icon
		chrome.browserAction.onClicked.addListener(()=>this.browserIconClicked());
    // set icon files for browser icon
    IconApplicationMgr.setIconMap(new Map([["ready","icons/48.png"],["running","icons/48off.png"],["locked","icons/48off.png"],["dead","icons/48dead.png"]]));
    // listen to unsollicitated client messages
    Emitter.on(this,"ClientMessage");
    // listen to client state changes
    Emitter.on(this,"ClientState");
	},
	browserIconClicked:function(){
		try {
     
      // ask Password Depot to show itself
      return proxyMgr.relay({cmd:'showPD'},null).then(response=>{
        console.log(response);
        log(response);
        return response;
      });
		}
		catch (e){
			log(e);
		}
  },
  
	// messages from the content script and popup script
	_onMessage_checkState:function(data, from){
    return proxyMgr.relay(data,from).then(response=>{
      return response;
    });
  },
	_onMessage_queryURL:function(data, from){
		return proxyMgr.relay(data,from).then(response=>{
      return response;
    });
  },
	_onMessage_loadWebForm:function(data, from){
    return proxyMgr.relay(data,from).then(response=>{
      return response;
    });
  },
	_onMessage_postWebForm:function(data, from){
    log("_onMessage_postWebForm: relaying ",data.xml)
    proxyMgr.relay(data,from).then(response=>{
      return response;
    });
    return true;
  },
  _onEventClientMessage:function(eventValue){
    switch(eventValue.cmd){
      case "loadWebForm":
        Messenger.sendToFrame(eventValue.tabId,eventValue.frameId,"ContentScript",eventValue.cmd,eventValue);
        //Messenger.sendToMainPage:(eventValue.tabId,"ContentScript",eventValue,eventValue);
      break;
    }
  },
  _onEventClientState:function(eventValue){
    log("_onEventClientState",eventValue)
    IconApplicationMgr.set(eventValue);
  },
};


addonMgr.initialize();

