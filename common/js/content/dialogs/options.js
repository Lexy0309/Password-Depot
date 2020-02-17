var optionMgr = {
  _options : {},
  initialize:function(){
    return Options.get().then(options=>{
      this._options = options;
      this.render(options);
    });
  },
  render:function(options){
    $("#socketPortNumber").val(options.socketPortNumber)
    $("#btn-ok").click(()=>{
      var mustFieldSelectors = ["#socketPortNumber"];
      var issue= false;
      mustFieldSelectors.forEach(selector=>{
        if ($(selector).val()==""){
          if (!issue){

          }
          issue = true;
          $(selector+"-asterisk").css("display","").css("color","red");
        }
      });
      if (issue){
        scrollTo(0,0);
        return false;
      }
      else {
        options.socketPortNumber = $("#socketPortNumber").val()
        Options.set(this._options).then(()=>{
          window.close();
        });
      }
    });
  }
};
optionMgr.initialize();
