/*
 * This file is part of WebCL – Web Computing Language.
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 *
 * The Original Contributor of this Source Code Form is
 * Nokia Research Center Tampere (http://webcl.nokiaresearch.com).
 *
 */


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://nrcwebcl/modules/common.jsm");

Cu.import("resource://nrcwebcl/modules/logger.jsm");
Cu.import("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("resource://nrcwebcl/modules/webcl/webcl.jsm");
Cu.import("resource://nrcwebcl/modules/webcl/webclevent.jsm");
Cu.import("resource://nrcwebcl/modules/webcl/webclimagedescriptor.jsm");


INFO ("WebCL Loader");
INFO ("Firefox version: " + Services.appinfo.version);



function WebCLLoader ()
{
  this.wrappedJSObject = this;

  INFO ("ABI: " + getRuntimeABI ());
  INFO ("OS_TARGET: " + getRuntimeOS ());

  this._allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
  webclutils.setPrefObserver_allowed (this);
}


WebCLLoader.prototype = {
  classDescription: "WebCLLoader",
  classID:          Components.ID("{f2e0f66e-615a-4b86-b0ea-2fd3c8729ac2}"),
  contractID:       "@webcl.nokiaresearch.com/WebCLLoader;1",

  QueryInterface: XPCOMUtils.generateQI ([ Ci.nsIObserver,
                                           Ci.nsISupportsWeakReference
                                         ])
};


function handle_profileAfterChange (ctx)
{
  var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  os.addObserver(ctx, "content-document-global-created", false);
}


function handle_contentDocumentGlobalCreated (ctx, domWindow)
{
  // Note that WebCL is made available for not only regular web pages, but all content except the
  // browser internal "chrome:" URIs.  This allows developers to bring up the Web Console and start
  // experimenting at any time.  It's particularly important to have WebCL enabled on "about:home"
  // and "about:blank".

  if (domWindow.document.baseURI.startsWith("chrome:")) return;

  if (ctx._allowed)
  {
    INFO ("WebCL Loader: Permission granted. Loading WebCL client side component. baseURI: " + domWindow.document.baseURI);

    domWindow.wrappedJSObject._NokiaWebCL = WebCL;
    domWindow.wrappedJSObject._NokiaWebCLEvent = WebCLEvent;
    domWindow.wrappedJSObject._NokiaWebCLImageDescriptor = WebCLImageDescriptor;

    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                            .getService (Ci.mozIJSSubScriptLoader);
    loader.loadSubScript ("chrome://nrcwebcl/content/webclclientwrapper.js",
                          domWindow.wrappedJSObject);

    INFO ("WebCL Loader: WebCL client side component successfully loaded.");

    // Another option? https://developer.mozilla.org/en-US/docs/Components.utils.createObjectIn
  } 
  else 
  {
    INFO ("WebCL Loader: Permission denied.");
  }
}


function handle_prefChanged (ctx, name)
{
  switch (name)
  {
    case webclutils.PREF_WEBCL_ALLOWED:
      ctx._allowed = (webclutils.getPref_allowed (true) !== webclutils.PREF_WEBCL_ALLOWED__FALSE);
      break;
  }
}


WebCLLoader.prototype.observe = function (subject, topic, data)
{
  TRACE (this, "observe", arguments);

  switch (topic) {
    case "profile-after-change":
      try {
        handle_profileAfterChange (this);
      } catch (e) {
        ERROR ("WebCLLoader#observe \"profile-after-change\": " +e);
        throw e;
      }
      break;

    case "content-document-global-created":
      try {
        handle_contentDocumentGlobalCreated (this, subject);
      } catch (e) {
        ERROR ("WebCLLoader#observe \"content-document-global-created\": " +e);
        throw e;
      }
      break;

    case "nsPref:changed":
      try {
        handle_prefChanged (this, data);
      } catch (e) {
        ERROR ("WebCLLoader#observe \"nsPref:changed\": " +e);
        throw e;
      }
      break;
  }
};


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([WebCLLoader]);
