var DELAY_ACCEPTED = 2000;
const ERROR_NATIVEAPP_NORESPONSE = 1;
const COMM_TYPE_SOCKET = 0;
const COMM_TYPE_NATIVEAPP = 1;
const SOCKET_RETRY_TIMER = 2000;

var proxyMgr = {
  _activeRequests:[],
  _debug:true,
  _state:'',
  _commType: -1,
  _initialMsg: null,
  _clientVersion:"",
  initialize:function(initialMsg){
    this._initialMsg = initialMsg;
    if (this._debug){
      log("proxyMgr.initialize: entering")
    }
    // add this object as the receiver for all messages directed to "addonMgr"
		Messenger.addReceiver("proxyMgr",this);
    Emitter.on(this,"WebsocketMessage");
    Emitter.on(this,"NativeMessage");
    Emitter.on(this,"ClientCommunicationLoss");

    this.initializeCommunication(initialMsg).then(result=>{
      if (result){
      }
    });
  },
  setClientVersion:function(version){
    log("setClientVersion: "+version)
    this._clientVersion = version;
  },
  initializeCommunication:function(initialMsg){
    log("proxyMgr: initializing communication...")
    return nativeMessenger.initialize(initialMsg).then((result)=>{
      if (result){
        this._commType = COMM_TYPE_NATIVEAPP;
        this.setClientVersion("V11");
        return true
      }
      else{
        return websocketMgr.initialize(initialMsg).then(result=>{
          this._commType = COMM_TYPE_SOCKET;
          // V10 fix, we consider starting in V10
          // we'll switch on checkState reply if required
          this.setClientVersion("V10");
          return result;
        }).catch((e)=>{
          return false;
        })
      }
    });
  },
  setState:function(state){
    this._state = state;
  },
  send:function(message){
    switch(this._commType){
      case COMM_TYPE_NATIVEAPP:
        nativeMessenger.send(message);
      break;
      case COMM_TYPE_SOCKET:
        websocketMgr.send(message);
      break;
    }
  },
  relay:function(message,from){
    if (this._debug){
      log("proxyMgr.relay:",message)
    }
    try{
      const _maxId = Math.pow(2,32);
      var _requestId = Math.floor(Math.random()*_maxId);
      return new Promise((resolve,reject)=>{
        var _timerId = setTimeout(()=>{
          log("relay: DELAY_ACCEPTED exceeded "+DELAY_ACCEPTED);
          delete this._activeRequests[_requestId];
          resolve({error:ERROR_NATIVEAPP_NORESPONSE,
                    msg:"Timeout exceeded for native app response",
                    clientVersion : this._clientVersion}
                  )
          Emitter.emit("ClientState",{clientState:"dead"});
        },DELAY_ACCEPTED);

        this._activeRequests[_requestId] = {resolve,message,timerId:_timerId};
        message.requestId = _requestId;
        if (from){
          message.tabId = from.tab.id;
          message.frameId = from.frameId;
        }
        this.send(message);
      });
    }
    catch(e){
      log(".relay: EXCEPTION ",e)
    }
  },
  _onEventClientCommunicationLoss:function(eventValue){
    Emitter.emit("ClientState",{clientState:"dead"});
    this.initializeCommunication(this._initialMsg);
  },
  _onEventWebsocketMessage:function(eventValue){
    if(this._debug) log("proxyMgr._onEventWebsocketMessage: ",eventValue);
		if (eventValue.cmd == 'checkState') {
			nativeMessenger.setState(message.state);
      // V10 FIX
      if (eventValue.version){
        this.setClientVersion("V12");
      }
		}
		chrome.tabs.query({active: true, currentWindow: true},
			(tabs)=> {
				Messenger.sendToMainPage(tabs[0].id,"pdContentScript",eventValue.cmd,eventValue);
		});
  },

	_onEventNativeMessage:function(eventValue){
    if(this._debug) log("proxyMgr._onEventNativeMessage: ",eventValue);
    if (eventValue.cmd=="checkState") Emitter.emit("ClientState",{clientState:(eventValue.clientAlive==1?eventValue.state:"dead")});
    this._resolveEvent(eventValue);
  },
  _onEventWebsocketMessage:function(eventValue){
    if(this._debug) log("proxyMgr._onEventWebsocketMessage: ",eventValue);

    if (eventValue.cmd=="checkState"){
      if (eventValue.clientVersion){
        try {
          this.setClientVersion("V"+eventValue.clientVersion.substr(0,2));
        } catch (err) {
          console.log("EXCEPTION: invalid client version",eventValue.clientVersion);
        }
      }
      Emitter.emit("ClientState",{clientState:(eventValue.clientAlive==1?eventValue.state:"dead")});
    }
    this._resolveEvent(eventValue);
  },
  _resolveEvent:function(eventValue){
    if(this._debug) log("proxyMgr._resolveEvent: ",eventValue.state);
    try{
      if (this._activeRequests[eventValue.requestId]){
        var _resolve = this._activeRequests[eventValue.requestId].resolve;
        var _timerId = this._activeRequests[eventValue.requestId].timerId;
        clearTimeout(_timerId);
        if (_resolve){
          eventValue.clientVersion = this._clientVersion;
          _resolve(eventValue);
          delete this._activeRequests[eventValue.requestId];
        }
        else{
          console.error("proxyMgr._resolveEvent: resolve method undefined")
        }
      }
      else{ // unsollicitated messages
        if(this._debug) log("proxyMgr._resolveEvent: unsollicitated:",eventValue);
        if (eventValue.cmd=="checkState" && !eventValue.clientAlive){
          this._commType == COMM_TYPE_NATIVEAPP ? nativeMessenger.clear() : null;
        }
        Emitter.emit("ClientMessage",eventValue);
      }
    }
    catch(e){
      console.error("proxyMgr._resolveEvent",e);
    }
	},
  _onMessage_getClientVersion:function(data, from){
    log("_onMessage_getClientVersion...")
    return {version: this._clientVersion};
  },
};
