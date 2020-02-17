var pageMgr = {
  initialize:function(){
    log("pageMgr: initialize...")
    this.listenForNewDomElements();
    log("pageMgr: exiting...")
  },
  listenForNewDomElements:function(){
    var THROTTLING = 300;
    try {
      var lazyRescan = _.debounce((e)=>{
        this.actOnDomChange(e);
      }, THROTTLING);
      DomObserver.setTarget($JQ("body")[0], (target) => {
        lazyRescan(target);
      });
    } catch (err) {
      console.log("EXCEPTION: could not add dom listener",err)
    }

  },
  actOnDomChange:function(target){
    // && event.target.tagName.toLowerCase()!="iframe")
    if (target && target.type=="hidden"
      // now that we throttle, we can't afford
      // to filter anymore because throttling takes only
      // last event after the throtlinh period and that one may not pass
      // the criteria
          //||
          //event.target.tagName=="SCRIPT" ||
          //event.target.nodeType != Node.ELEMENT_NODE
    ){
      //log("pageMgr.DOMNodeInserted: node inserted but NO INTEREST ",event.target)
      return;
    }
    try{
      this.scanForms();
    }
    catch(e){
      log("EXCEPTION in DomInserted ",e)
    }
  },
  scanForms:function(){
    log('pageMgr.scanForms: entering...');

    var _forms = [];
    try{
        for (var i=0; i < document.forms.length; i++ ){
        //log("scanFormsTop:"+i)
          var _found = false;
          //for (var j=0; j < document.forms[i].elements.length; j ++ ){
            var _pwds = $JQ(document.forms[i]).find("[type='password'][pdUsed!='true']");
            if (_pwds.length){
              _pwds.attr("pdUsed","true")
              if (!_found) _forms.push(document.forms[i]);
              _found = true;
            }
          //}
        }
        log('pageMgr.scanForms: formsLength'+_forms.length);

        if (_forms.length){
            var sURL = GetDocumentUrl(document);
            var sTitle = (new URL(sURL)).hostname;
        chrome.runtime.sendMessage({ action: "addonMgr.queryURL", data:{url:sURL,title:sTitle}}, response=> {
          log("queryUrl response ",response)
          if (!response.data.error){
            if (response.data.matches > 0){
              var sURL = GetDocumentUrl(document);
              var sTitle = (new URL(sURL)).hostname;
              var sXML = pdDocumentToXML(document);
              chrome.runtime.sendMessage({ action: "addonMgr.loadWebForm", data:{url:sURL,title:sTitle,xml:sXML,x:window.screenX,y:window.screenY,w:window.innerWidth,h:window.innerHeight}}, response=> {
                this.addIconAndClickHdlrToAllInputFields();
                if (response.data.xml){
                  this.fillFormsFromXML(response.data.xml);
                }
              });
            }
          }
          for (var i=0;i<_forms.length;i++){
            if (!$JQ(_forms[i]).attr("formSubmitHandled")){
              this.addSubmitEventHandlers(_forms[i])
            }
          }
        });
      }
      else { // no form found with password
        var _pwds = $JQ("input[type='password'][pdUsed!='true']");
        if (_pwds.length){
          //TODO: add submit handler for creds saving
          // add an icon for assisted filling
          _pwds.attr("pdUsed","true")
          this.addIconAndClickHdlrToAllInputFields(false);
        }
      }
      log("pageMgr.scanForms: found "+_forms.length)
      return _forms;
    }
    catch (e){
          log("EXCEPTION: pageMgr.scanForms " + e);
        return false;
    }
  },
  addSubmitEventHandlers:function(form){
    log("pageMgr.addSubmitEventHandlers: ",form)
    $JQ(form).attr("formSubmitHandled",true)
    //this._forms[0].addEventListener('submit', (event)=>this.pdOnSubmit(event), true);
    //$(form).submit((event)=>this.pdOnSubmit(event));
    var _elements = $JQ(form).find("input[type='email'],input[type='text'],input[type='password'],input[type='submit'],a,button,div");
    for(var i=0;i<_elements.length;i++){
      var _elt = $JQ(_elements[i]);
      if (["text","email","password"].indexOf(_elt.attr("type"))!=-1){
        $JQ(_elt).on("keypress",(event)=>{
          if (event.key == "Enter"){
            this.pdOnSubmit(form)
          }
        })
      }
      else if (["submit"].indexOf(_elt.attr("type"))!=-1 ||
        _elt.prop("tagName")=="BUTTON" ||
        (["A,DIV"].indexOf(_elt.prop("tagName"))!=-1 && IsSubmitButton(_elt,"text"))
      ){
        log("pageMgr.addSubmitEventHandlers: adding click hdler to ",_elt)
// @if showLogs=true
        $JQ(_elt).css("background","white")
        $JQ(_elt).children().css("background","white")

        $JQ(_elt).css("color","black")
        $JQ(_elt).children().css("color","black")

        $JQ(_elt).css("border","2px dashed red")
// @endif
        $JQ(_elt).click((event)=>{
          this.pdOnSubmit(form)
        })
      }
    }
  },
  fireEvent:function(elt, evObj, evName){
    elt.dispatchEvent(new evObj(evName, { bubbles: true, cancelable: false }));
  },
  fireKeyboardEvent:function (elem, name){
    this.fireEvent(elem, KeyboardEvent, name);
  },
  emulateEvent:function(elem, name){
      try{
          elem.dispatchEvent(new Event(name));
      }
      catch (e){
      console.error("emulateEvent " + e);
      }
  },
  fillTextField : function(elt, value) {
    //log("fillTextField: filling ["+value+"]",elt)
    // fix autoscroll in case of false positive login
    return new Promise((resolve,reject) => {
      if (elt && typeof value !== 'undefined' && elt.value!=value) {
        // very basic keyboard simulation, may help in situations
        // where fields stay hidden or buttons are disabled until
        // user input is detected
        // JML fix, some sites like upwork.com require an input event for enabling the "login" button
        // 2nd JML Fix, moved after focus, fixing parse.com site issue
        var _scrollX = window.scrollX;
        var _scrollY = window.scrollY;
        elt.focus();
        window.scrollTo(_scrollX,_scrollY)
        window.setTimeout(()=>{
          elt.value = value || '';
          log("form-detection.js fillTextField: firing events 100ms");
          this.fireKeyboardEvent(elt, 'input');
          this.fireKeyboardEvent(elt, 'keydown');
          this.fireKeyboardEvent(elt, 'keypress');
          this.fireKeyboardEvent(elt, 'keyup');
          resolve(true);
        },100);
      }
      else resolve(false);
    });
  },
  addIconAndClickHdlrToAllInputFields:function(inForm=true){
    log("addIconAndClickHdlrToAllInputFields: entering inForm="+inForm);
    var _index=0;
    $JQ("input[type='text'][iconAdded!='true'],input[type='password'][iconAdded!='true'],input[type='email'][iconAdded!='true']").each((index,elt)=>{
      this.addIconToField(elt);
      this.addIconEventHandler(elt, inForm);
      _index = index;
    })
    log("addIconAndClickHdlrToAllInputFields: processed:"+_index);

  },
  addIconToField:function(elt){
    elt.style.setProperty('background-image', "url('" + chrome.extension.getURL('icons/16.png') + "')", 'important');
    elt.style.setProperty('background-position', "right center", 'important');
    elt.style.setProperty('background-repeat', "no-repeat", 'important');
    elt.setAttribute("iconAdded","true")
  },

  addIconEventHandler:function(elt, inForm){
    $JQ(elt).click((event)=>{
      var _rect = event.target.getBoundingClientRect();
      if (event.offsetX > _rect.width-16){
        log("pageMgr.addIconEventHandler: elt clicked",event.target);
        var sURL = GetDocumentUrl(document);
        var sTitle = (new URL(sURL)).hostname;
        var sXML ="";
        if (inForm){
          sXML = pdDocumentToXML(document);
        }
        else{
          sXML = buildFakeXMLform();
        }
        chrome.runtime.sendMessage({ action: "addonMgr.loadWebForm", data:{url:sURL,title:sTitle,xml:sXML,x:window.screenX,y:window.screenY,w:window.innerWidth,h:window.innerHeight}}, response=> {
          if (!response.data.error && response.data.xml){
            //this.fillFormsFromXML(response.data.xml);
            log("assisted filling",response.data.xml);
            return this.fillFormsFromXML(response.data.xml);
          }
        });
      }
    })
  },
  fillFormsFromXML:async function(AXML){
    try{
          var _elementsToFill = [];
          var Parser = new DOMParser();
          var _XMLDoc = Parser.parseFromString(AXML, "text/xml");
          var _XMLforms = _XMLDoc.getElementsByTagName("formdata");
      for (var i=0; i < _XMLforms.length; i++ ){
              var _XMLform=_XMLforms[i];
              var _HTMLform=document.forms[_XMLform.getAttribute("idx")];
        if (_HTMLform){
                  _elementsToFill =_HTMLform.elements;
        }
        else{
          $JQ("input[type='password'],input[type='text'],input[type='email']").each((index,elt)=>{
            _elementsToFill.push(elt);
          });
        }
        var _fieldsXML=_XMLforms[i].getElementsByTagName("input");
                for (var j=0; j < _elementsToFill.length; j ++ ){
                    var _elt = _elementsToFill[j];
                    if (IsValidInput(_elt.type)){
                        for (var m=0; m<_fieldsXML.length; m++){
                            if (_fieldsXML[m].getAttribute("type")==_elt.type &&
                  (_fieldsXML[m].getAttribute("name")==_elt.name||_fieldsXML[m].getAttribute("idx")==j.toString())){
                                var e = await this.fillTextField(_elt, _fieldsXML[m].textContent);
                            }
                        }
                    }
                }
      }
    }
    catch (e){
      log("fillFormsFromXML " + e);
    }
  },
  pdOnSubmit:function(nsForm){
    log("pageMgr.pdOnSubmit: entering")
      try{
          //var nsForm = AEvent.target;
          if (nsForm){
              if (ContainsText(nsForm.action, 'javascript:')){
                  return true;
              }
              var bPassword = false;
              for (var j=0; j < nsForm.elements.length; j ++ ){
                  if ((nsForm.elements[j].type == "password") && nsForm.elements[j].value){
                      bPassword = true;
                      break;
                  }
              }
              if (!bPassword){
                  return true;
              }
              var _doc = nsForm.ownerDocument;
              if ( !isValidDocument(_doc)){
                  return true;
              }
              var sXML=pdFormToXML(nsForm);
              var sURL = GetDocumentUrl(_doc);
              var sTitle = (new URL(sURL)).hostname;
        chrome.runtime.sendMessage({ action: "addonMgr.postWebForm", data:{url:sURL,title:sTitle,xml:sXML,x:window.screenX,y:window.screenY,w:window.innerWidth,h:window.innerHeight}}, result=> {});
          }
          return true;
    }
    catch(e)
    {
       log("onSubmit " + e);
     return null;
    }
    return this._forms;
  }
};
