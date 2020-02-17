// pdContentScript.js
// @include ../log.js
// @include ./utils.js
// @include ./expressions.js
// @include ./mutationObserver.js
// @include ./pageMgr.js
var $JQ = $.noConflict();

var contentScriptMgr = {
  _autoFillTimerID:0,
  _forms:[],
  _actionsMessage: ["loadWebForm"],
  _onBackgroundMessage:function(message, sender, reply){
    if (!message.name || !message.action || this._actionsMessage.indexOf(message.action) === -1) {
      return false;
    }
    this[`_onMessage_${message.action}`](message, sender, reply);
    return true; //async reply
  },
  initialize:function(){
    log("pdContentScript: starting script..."+document.URL)
    //JSextender.extend(); // enrich jquery with text seraching selectors
    chrome.runtime.onMessage.addListener(this._onBackgroundMessage.bind(this));
    //window.addEventListener('submit', pdOnSubmit, true);
    if (!isiFrame()){
      log("Getting version...")
      this.getClientVersion().then(version =>{
        log("Version:"+version)
        if (version == "V11" || version == "V10"){
          pageMgr.initialize();
          this._forms = pageMgr.scanForms();
        }
        else{
          chrome.runtime.sendMessage({action: "addonMgr.checkState", data:null}, result=> {
            if(result && (result.data.clientAlive && result.data.state=="ready")){
              pageMgr.initialize();
              this._forms = pageMgr.scanForms();
            }
          });
        }
      })
    }
    else {
      pageMgr.initialize();
      this._forms = pageMgr.scanForms();
    }

  },
  getClientVersion:function(){
    var _p = new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({action: "proxyMgr.getClientVersion", data:null}, result=> {
        resolve(result.data.version);
      });
    });
    return _p;
  },
  _onMessage_loadWebForm:function(message){
    pageMgr.fillFormsFromXML(message.data.xml);
  },
  stopAutoFill:function(){
    if (this._autoFillTimerID){
      clearTimeout(this._autoFillTimerID);
      this._autoFillTimerID = 0;
    }
  },
}
$JQ(document).ready(function(){contentScriptMgr.initialize()});

var DEBUG_MODE = 0;
