const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");


var CLASSNAME =  "WebCLJSWrapperLoader";
var CID =        "{f2e0f66e-615a-4b86-b0ea-2fd3c8729ac2}";
var CONTRACTID = "@webcl.nokiaresearch.com/WebCLJSWrapperLoader;1";


function WebCLJSWrapperLoader ()
{
  this.wrappedJSObject = this;
}


WebCLJSWrapperLoader.prototype = {
  classDescription: CLASSNAME,
  classID:          Components.ID(CID),
  contractID:       CONTRACTID,

  QueryInterface: XPCOMUtils.generateQI ([ Ci.nsIObserver ])
};


WebCLJSWrapperLoader.prototype.observe = function (subject, topic, data)
{
  //Cu.reportError ("WebCLJSWrapperLoader#observe: " + topic);

  switch (topic) {
    case "profile-after-change":
      var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
      os.addObserver(this, "content-document-global-created", false);
      break;

    case "content-document-global-created":
      var domWindow = subject;

      // Don't load WebCL Wrapper if we are on about: or chrome page.
      // TODO: Any other bad schemes? Should we limit to only http: and maybe file: ?
      if (domWindow.document.baseURI.startsWith("about:")) break;
      if (domWindow.document.baseURI.startsWith("chrome:")) break;

      var loader = Components.classes[ "@mozilla.org/moz/jssubscript-loader;1" ].getService( Components.interfaces.mozIJSSubScriptLoader );
      loader.loadSubScript("chrome://webcljswrapperloader/content/webcljswrapper.js",
                           domWindow.wrappedJSObject);
      break;
  }
};


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([WebCLJSWrapperLoader]);
