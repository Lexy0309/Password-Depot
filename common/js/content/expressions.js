var submitRegExps =[/login/i];
function IsSubmitButton(jlist,attributeName){
  return jlist.matchRegexps(submitRegExps,attributeName);
}
