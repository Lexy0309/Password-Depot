function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  _result = Math.round(number * factor) / factor;
  if (number >0 && _result==0){
    _result = 1.0;
  }
  return _result;
}
function uuid4() {
  function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
           .toString(16)
           .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}
function extractDomain(url){
  var _extract = TLDEXTRACT.extract(url);
  var _domain = _extract.domain+"."+_extract.tld;
  return _domain;
}
function extractSubAndDomain(url){
  var _extract = TLDEXTRACT.extract(url);
  var _domain = (_extract.subdomain?_extract.subdomain+".":"")+_extract.domain+"."+_extract.tld;
  _domain = _domain.replace(/^\./,"");
  return _domain;
}
function getBrowserType(){
  // @if browser='safari'
  return "Safari";
  // @endif
  // @if browser='firefox'
  return "Firefox";
  // @endif
  // @if browser='chrome'
  return "Chrome";
  // @endif

}
