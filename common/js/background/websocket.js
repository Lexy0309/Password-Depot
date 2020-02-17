const WS_HOST = 'ws://127.0.0.1';

var websocketMgr = {
  _ws:null,
  _connected:false,
  _msgToSend:null,
  initialize:function(msg){
  	try
  	{
  		this._connected = false;
      this.installListenerForPortchange();
      return new Promise(async (resolve,reject) =>{
        var options = await Options.get();
        if (!this._ws){
          this._ws = new WebSocket(WS_HOST + ':' + options.socketPortNumber);
        }
        this._msgToSend = msg;
    		this._ws.onopen = ()=>this.onOpen(resolve,reject);
    		this._ws.onclose = ()=>{
          this.onClose();
        };
    		this._ws.onerror = (event)=>this.onError(event,resolve,reject);
    		this._ws.onmessage = (event)=>this.onMessage(event);
      });
  	}
  	catch (e)
  	{
  		log(e);
  		this._ws = null;
  	}
  },
  installListenerForPortchange:function(){
    chrome.storage.onChanged.addListener((changes, namespace) => {
       for (key in changes) {
         var storageChange = changes[key];
         if (key == "socketPortNumber"){
           log('Storage key "%s" in namespace "%s" changed. ' +
                       'Old value was "%s", new value is "%s".',
                       key,
                       namespace,
                       storageChange.oldValue,
                       storageChange.newValue);
           if (this._ws) delete this._ws;
           //Emitter.emit("ClientCommunicationLoss",{})
           this.initialize(this._msgToSend);
         }

       }
    });
  },
  onOpen:function(resolve,reject) {
  	try
  	{
      log("Socket opened")
  		this._connected = true;
  		if (this._msgToSend) {
  		  this.send(this._msgToSend);
  		}
  	}
  	catch (e)
  	{
  		log(e);
  		this._connected = false;
      reject(e)
  	}
  	finally {
  		resolve(true)
  	}
  },
  onClose:function() {
    log("Socket closed")
  	try{
  		this._connected = false;
      delete this._ws;
  	}
  	catch(e){
  		console.error(e);
  	}
    Emitter.emit("ClientCommunicationLoss",{})
  },
  onError:function(event,resolve,reject) {
  	try{
  		this._connected = false;
  	}
  	catch(e){
  		console.error(e);
  	}
    reject(event)
  },
  // message from the PD websocket server
  onMessage:function(event) {
    if (event){
      try{
  			var _message = JSON.parse(event.data);
  			if (_message){
					Emitter.emit("WebsocketMessage",_message);
          //log("websocketMgr.onMessage:",event.data)
			  }
      }
      catch(e){
  		  //this._ws = null;
        //log("websocketMgr.onMessage: CRITICAL processing event.data["+event.data+"]")
  	  }
    }
  },
  send:function(message){
    message.clientVersion = "V12";
    if (this._connected && (this._ws.readyState == this._ws.OPEN)){
      this._ws.send(JSON.stringify(message));
      log("websocketMgr.send:",JSON.stringify(message))
    }
    else {
      this.initialize(message);
    }
  }
};
