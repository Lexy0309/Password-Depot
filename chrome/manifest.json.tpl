{
    "name": "<%= name %>",
    "version": "<%= version %>",
    "manifest_version": 2,
    "description": "<%= description %>",
    "homepage_url": "<%= homepage_url %>",
    "default_locale" : "en",
<!-- @if browser='chrome' && stage!='production'-->
    <%= addon_key_section %>
<!-- @endif -->
<!-- @if browser='firefox' -->
    "applications": {
       "gecko": {
         "id": "<%= gecko_id %>"
       }
    },
<!-- @endif -->
    "icons": {
        "128": "icons/128.png",
        "48": "icons/48.png",
        "16": "icons/16.png"
    },
    "background": {
        "scripts": [
                    "vendor/jquery.js",
                    "vendor/uri.js",
                  "js/pdBackgroundScript.js"]
<!-- @if browser='chrome' -->
        ,"persistent": true
<!-- @endif -->
    },
    "content_scripts": [ {
      "all_frames": true,
      "js": [ "vendor/underscore.js","vendor/jquery.js","js/pdContentScript.js" ],
      "matches": [ "http://*/*", "https://*/*" ],
      "run_at": "document_start"
   } ],
    "options_ui": {
      "chrome_style": true,
      "page": "dialogs/options.html"
    },
    "browser_action": {
        "default_icon": "icons/48.png",
        "default_title": "Password Depot"
    },
    "permissions": [
        "tabs",
<!-- @if localDeployment=true -->
        "management",
<!-- @endif -->
        "nativeMessaging",
        "cookies",
        "storage"
    ],
    "web_accessible_resources": [
        "dialogs/*",
        "icons/48.png",
        "icons/16.png"
    ],

    "content_security_policy": "script-src 'self'; object-src 'self'"
}
