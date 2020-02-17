var IconApplicationMgr={
  _states: new Map(),
  set:function(property){
    var iconeFile = this._states.get(property.clientState);
    if (iconeFile){
      chrome.browserAction.setIcon({path:iconeFile}, function(){});
    }
    else {
      log("Weird: can't find an icon for state "+property.clientState);
    }
  },
  setIconMap:function(map){
    this._states = map;
  },
  setBadgeValueAndColor:function(text, eraseText, color){
    if (text!=null){
      chrome.browserAction.setBadgeText({text:text});
    }
    if (eraseText){
      chrome.browserAction.setBadgeText({text:""});
    }
    if (color){
      chrome.browserAction.setBadgeBackgroundColor({color:color});
    }
  }
}
