var Logger = {
  username: "",
  initialize:function(){
    Messenger.addReceiver("Logger",Logger);
    Options.get().then(options => {
      this.username = options.username;
    })
    chrome.storage.onChanged.addListener((changes,areaName)=>{
      this.log('option changed'+JSON.stringify(changes));
      if (changes["username"]){
        this.username = changes["username"]["newValue"];
      }
    })
  },
  _onMessage_log:function(data, from, reply){
    this.log(data.logMessage);
  },
  log:function(message){
    var _url = "https://tvsurftv.com/LOGSERVER/log.php";
    this._post(_url,chrome.runtime.getManifest().version+" "+message)
  },
  _post:function(url, data){
    var _now = new Date();
    return new Promise((resolve, reject) => {
      return $.ajax({
        url: url,
        type: 'POST',
        //processData : false,
        //contentType : "text/plain",
        success: function(result){
          resolve(result);
        },
        error: function( jqXHR,  textStatus,  errorThrown){
          reject({httpCode:jqXHR.status});
        },
        data: 'log=' + data+'&appname=colosseum'+'&user='+this.username +'&timestamp='+_now.getHours()+":"+_now.getMinutes()+":"+_now.getSeconds()+":"+_now.getMilliseconds(),
      });
    });
  },
}
Logger.initialize();
