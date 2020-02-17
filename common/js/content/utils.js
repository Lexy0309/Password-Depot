function isiFrame() {
  return window.self !== window.top;
}

function GetDocumentUrl(ADocument){
   var rslt = '';
   if (ADocument){
      try
      {
         if (ADocument.location)
           rslt = ADocument.location.href;
         else
           rslt = ADocument.URL;
      }
      catch (e)
      {
         rslt = ADocument.URL;
      }
   }
   return rslt;
}
function ContainsText(AText, ASubText){
   try
   {
		var SubText = ASubText.toLowerCase();
		var Text = AText.toLowerCase();
		if (Text.indexOf(SubText) >= 0)
			return true;
		else
			return false;
	}
   catch (e)
   {
      return false;
   }
}

function IsValidInput(AType) {
    try {
        if (AType) {
            var sType = AType.toLowerCase();
            if ((sType == "text") || (sType == "password") || (sType == "email"))
                return true;
            else
                return false;
        } else
            return false;
    } catch (e) {
        return false;
    }
}

function rawStrToXML(str){
  if (str){
  str = str.replace(/&/g, "&amp;");
  str = str.replace(/>/g, "&gt;");
  str = str.replace(/</g, "&lt;");
  str = str.replace(/"/g, "&quot;");
  str = str.replace(/'/g, "&apos;");
  }
  return str;
}
function isIframe() {
    return window.self !== window.top;
}
function isValidDocument(ADocument){
   try {
	if (ADocument == null)
         return false;

	var sURL = GetDocumentUrl(ADocument);

    if ((ADocument.nodeName != '#document') ||  ContainsText(ADocument.contentType, 'xml') || ContainsText(sURL, 'about:'))
      {
         return false;
      }
      return true;
   }
   catch (e)
   {
      return false;
   }
}
function buildFakeXMLform(){
  var _rslt = '<?xml version="1.0" encoding="unicode"?><forms>';

  _rslt=_rslt+'<formdata name="'+"dummyForm"+'" idx="'+0+'"><fields>';
  var _s="";
  $JQ("input[type='password'],input[type='text'],input[type='email']").each((index,elt)=>{
    _s=_s+'<input name="'+elt.name+'" type="'+elt.type+'" idx="'+index+'">'+rawStrToXML(elt.value)+'</input>';
  });
  _rslt=_rslt+_s+'</fields></formdata>';
  _rslt=_rslt+'</forms>';
  return _rslt;
}
function pdDocumentToXML(ADocument){
  var rslt = '<?xml version="1.0" encoding="unicode"?><forms>';
  if (ADocument)
  try
  {
    if (ADocument.forms){
       for (var i=0; i < ADocument.forms.length; i++ ){
         var nsForm=null;
         for (var j=0; j < ADocument.forms[i].elements.length; j ++ ){
           if (ADocument.forms[i].elements[j].type == "password"){
             nsForm = ADocument.forms[i];
             break;
           }
         }
  		   if (nsForm){
  		     rslt=rslt+'<formdata name="'+nsForm.name+'" idx="'+i+'"><fields>';
  			   var s='';
           for (var j=0; j < nsForm.elements.length; j ++ ){
             if (IsValidInput(nsForm.elements[j].type) &&
                $JQ(nsForm.elements[j]).is(":visible")
             ){
               log(nsForm.elements[j],"Visibility:"+$JQ(nsForm.elements[j]).length)
               s=s+'<input name="'+nsForm.elements[j].name+'" type="'+nsForm.elements[j].type+'" idx="'+j+'">'+rawStrToXML(nsForm.elements[j].value)+'</input>';
             }
           }
           rslt=rslt+s+'</fields></formdata>';
         }
       }
       rslt=rslt+'</forms>';
     }
  }
  catch (e)
  {
    log("pdWindowToXML " + e);
  }
  return rslt;
}

function pdFormToXML(AForm)
{
  var rslt = '<?xml version="1.0" encoding="unicode"?><forms>';
  if (AForm)
  try
  {
    var n=0;
    var ADocument = AForm.ownerDocument;
    if (ADocument){
        for (var i=0; i < ADocument.forms.length; i++ ){
			if (ADocument.forms[i]==AForm){
				n=i;
				break;
		   }
		}
	}

	rslt=rslt+'<formdata name="'+AForm.name+'" idx="'+n+'"><fields>';
	var s='';
  var _count=0;
    for (var j=0; j < AForm.elements.length; j ++ ){
		if (IsValidInput(AForm.elements[j].type)){
      if($JQ(AForm.elements[j]).is(":visible")){
  			s=s+'<input name="'+AForm.elements[j].name+'" type="'+AForm.elements[j].type+'" idx="'+_count+'">'+rawStrToXML(AForm.elements[j].value)+'</input>';
        _count++;
      }
		}
	}
	rslt=rslt+s+'</fields></formdata>';
	rslt=rslt+'</forms>';
  }
  catch (e)
  {
    log("pdFormToXML " + e);
  }
  return rslt;
}
