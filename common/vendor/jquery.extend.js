var JSextender = {
  extend:function(){
    // Extends jQuery to match text contents
    $.expr[':'].textEquals = function(el, i, m) {
      var searchText = m[3];
      var match = $(el).text().trim().match("^" + searchText + "$")
      return match && match.length > 0;
    };
    $.expr[':'].textMatchRegexp = function(el, i, m) {
      var searchText = m[3];
      var match = $(el).text().trim().match(new RegExp(searchText))
      return match && match.length > 0;
    };
    jQuery.fn.extend({
      matchRegexps: function(regExpSet,attributeName) {
        var _resultGlobal = false;
        this.each((index,elt) => {
          var _value ;
          switch(attributeName){
            case 'text':
              _value = $(elt).text();
            break;
            case 'value':
              _value = $(elt).val();
            break;
            default:
              _value = $(elt).attr(attributeName);
          }
          var _result = regExpSet.some((exp)=> {return exp.exec(_value)!=null});
          if (!_resultGlobal){
            _resultGlobal = _result;
          };
        });
        return _resultGlobal;
      },
    });
  },
};
