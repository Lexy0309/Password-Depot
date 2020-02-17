const TIME_TO_CONNECT=2000;
var nativeMessenger={
  _port: null,
  _debug: true,
  _timerId : -1,
  _promise : null,
  initialize:function(initialMsg){
    if (this._debug){
      log("nativeMessenger.initialize: entering")
    }
    try
    {
      this._promise = new Promise((resolve,reject)=> {
        // @if browser="chrome"
        this._port = chrome.runtime.connectNative("de.acebit.passworddepot");
        //@endif
        // @if browser="firefox"
        this._port = browser.runtime.connectNative("password_depot_ff");
        //@endif
        if (this._port){
          this._port.onMessage.addListener((message)=>this._onMessage(message));
          var _onDisconnectedInitial = ()=>this._onDisconnectedInitial(resolve);
          this._port.onDisconnect.addListener(_onDisconnectedInitial);

          this._timerId = setTimeout(() => {
            log("nativeMessenger: port connected")
            resolve(true);
            this._port.onDisconnect.removeListener(_onDisconnectedInitial);
            this._port.onDisconnect.addListener(()=>this._onDisconnected());
            this.send(initialMsg)
          },TIME_TO_CONNECT)
        }
        else{
          console.error("initialize: native port is null!!")
        }
      })
      return this._promise;
    }
    catch(e)
    {
      console.error(e);
      this._port = null;
    }
    return this._port;
  },
  // message from native messaging host
	_onMessage:function(message){
    if (this._debug){
      log("nativeMessenger._onMessage: ",message)
    }
    if (message){
  		try
  		{
  			if (message.cmd == 'checkState') {
  				this._state = message.state;
  			}
        Emitter.emit("NativeMessage",message);
  		}
  		catch(e)
  		{
        console.error(e);
  		}
    }
	},
  clear:function(){
    log("nativeMessenger.clear: client is exiting")
    this._port = null;
  },
  _onDisconnectedInitial:function(resolve){
    log("nativeMessenger._onDisconnectedInitial: port disconnected")
		this._port = null;
    clearTimeout(this._timerId)
    resolve(false)
	},
	_onDisconnected:function(){
    log("nativeMessenger._onDisconnected: port disconnected")
		this._port = null;
    Emitter.emit("ClientCommunicationLoss",{})
	},
  getPort:function(){
    return this._port;
  },
  send:function(message){
    if (this._debug){
      log("nativeMessenger.send:",message)
    }
    this._port.postMessage(message);
  }
};
