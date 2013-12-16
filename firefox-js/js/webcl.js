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

var Exception = Components.Exception;


Cu.import ("resource://nrcwebcl/modules/logger.jsm");

INFO ("WebCL, Nokia Research Center, 2013");

try {

Cu.import ("resource://nrcwebcl/modules/common.jsm");

Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/webclconstructors.jsm");

Cu.import ("resource://nrcwebcl/modules/mixin.jsm");
Cu.import ("resource://nrcwebcl/modules/mixins/owner.jsm");
Cu.import ("resource://nrcwebcl/modules/mixins/securitycheckedcomponent.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/wrapper.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/platform.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/context.jsm");

DEBUG ("webcl.js: modules loaded");

} catch (e) { ERROR ("webcl.js: Failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }

try {


var CLASSNAME =  "WebCL";
var CID =        "{dd8e0776-5030-4b4d-be81-ab5417dc54b7}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCL;1";


function WebCL ()
{
  if (!this instanceof WebCL) return new WebCL ();

  this.wrappedJSObject = this;

  this._usePermitted = false;
  this._securityDialogNeeded = true;
  this._initialized = false;

  this._oclLibPath = webclutils.getPref_openclLib (true);
  this._abi = getRuntimeABI ();
  this._os = getRuntimeOS ();

  this._internal = null;
}

addMixin (WebCL.prototype, OwnerMixin);
addMixin (WebCL.prototype, SecurityCheckedComponentMixin);


WebCL.prototype.classDescription = CLASSNAME;
WebCL.prototype.classID =          Components.ID(CID);
WebCL.prototype.contractID =       CONTRACTID;
WebCL.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCL,
                                                            //Ci.nsIDOMGlobalObjectConstructor,
                                                            Ci.nsISecurityCheckedComponent,
                                                            Ci.nsIObserver,
                                                            Ci.nsISupportsWeakReference,
                                                            Ci.nsIClassInfo
                                                          ]);


//------------------------------------------------------------------------------
// Class Info

WebCL.prototype.getInterfaces = function (count)
{
  var interfaces = [ Ci.IWebCL,
                     //Ci.nsIDOMGlobalObjectConstructor,
                     Ci.nsISecurityCheckedComponent,
                     Ci.nsIObserver,
                     Ci.nsISupportsWeakReference,
                     Ci.nsIClassInfo,
                     Ci.nsISupports
                   ];
  count.value = interfaces.length;
  return interfaces;
};


//------------------------------------------------------------------------------
// nsIObserver

WebCL.prototype.observe = function (subject, topic, data)
{
  DEBUG ("WebCL#observe: " + topic + " data=" + data);

  switch (topic) {
    case "nsPref:changed":
      if (data == webclutils.PREF_WEBCL_ALLOWED)
      {
        this.handlePrefAllowed (webclutils.getPref_allowed (true));
      }
      break;
  }
};


//------------------------------------------------------------------------------
// IWebCL

WebCL.prototype.init = function (domWindow)
{

  this.handlePrefAllowed (webclutils.getPref_allowed (true));

  webclutils.setPrefObserver_allowed (this);
  webclutils.setPrefObserver_openclLib (this);


  // Install onunload handler
  var instance = this;
  domWindow.addEventListener ("unload", function (ev)
  {
    LOG ("Unload event");
    instance.releaseAll ();
  });

  this._initialized = true;
};


WebCL.prototype.getPlatforms = function ()
{
  TRACE (this, "getPlatforms", arguments);

  this.ensureInitialized ();
  this.ensureUsePermitted ();
  this.ensureLibraryLoaded ();

  return webclutils.wrapInternal (this._internal.getPlatforms (), this);
};


WebCL.prototype.createContext = function (properties)
{
  TRACE (this, "createContext", arguments);

  this.ensureInitialized ();
  this.ensureUsePermitted ();
  this.ensureLibraryLoaded ();

  try {

    var devices = null, platform = null, deviceType = 0x1;

    if (typeof(properties) == "object")
    {
      if (Array.isArray(properties.devices))
      {
        devices = [];
        for (var i = 0; i < properties.devices.length; ++i)
        {
          var p = webclutils.unwrapInternalOrNull (properties.devices[i]);

          if (p && p instanceof Device)
          {
            devices.push (p);
          }
          else
          {
            // TODO: Invalid device: ERROR?!
          }
        }
      }

      if (typeof(properties.platform) == "object")
      {
        platform = webclutils.unwrapInternalOrNull (properties.platform);
        if (!platform || !platform instanceof Platform)
        {
          // TODO: Invalid platform: ERROR?!
          platform = null;
        }
      }

      if (properties.deviceType)
      {
        if (!isNaN(+properties.deviceType))
        {
          deviceType = +properties.deviceType;
        }
        else
        {
          // TODO: Invalid device type: ERROR?!
        }
      }
    }

    if (!platform)
    {
      // TODO: Using first platform as the default
      platform = this._internal.getPlatforms ()[0];
    }

    var clCtx;
    if (devices)
    {
      clCtx = this._internal.createContext([0x1084, platform, 0], devices);
    }
    else
    {
      clCtx = this._internal.createContextFromType([0x1084, platform, 0], deviceType);
    }

    var x = webclutils.wrapInternal (clCtx, this);
    return x;

  } catch (e) { throw Exception ("WebCL.createContext failed: " + e); }
};


WebCL.prototype.waitForEvents = function (eventList, whenFinished)
{
  TRACE (this, "waitForEvents", arguments);

  this.ensureInitialized ();
  this.ensureUsePermitted ();
  this.ensureLibraryLoaded ();

  var clEventWaitList = [];
  if (eventList)
  {
    clEventWaitList = this._convertEventWaitList (eventList);
  }

  // TODO: whenFinished

  this._internal.waitForEvents (clEventWaitList);
};


WebCL.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);

  this.ensureInitialized ();
  // NOTE: No need to ensure use permitted, in fact it should NOT be done or
  //       we'll have unwanted permission prompts on page unload.
  this.ensureLibraryLoaded ();

  this._forEachRegistered (function (o)
  {
    o._unregister();
    if ("release" in o)
    {
      o.release ();
    }
  });

  this._clearRegistry ();


  if (this._libWrapper)
  {
    try
    {
      this._libWrapper.unload ();
    } catch (e) { /* TODO? */ }
    this._libWrapper = null;
  }
};


//------------------------------------------------------------------------------
// Internal functions


WebCL.prototype.handlePrefAllowed = function (value)
{
  switch (value)
  {
    case webclutils.PREF_WEBCL_ALLOWED__NOT_SET:
      // Use is allowed but user must accept the security dialog
      this._usePermitted = true;
      break;

    case webclutils.PREF_WEBCL_ALLOWED__FALSE:
    default:
      // Use is not allowed
      this._usePermitted = false;
      this._securityDialogNeeded = false;
      break;

    case webclutils.PREF_WEBCL_ALLOWED__TRUE:
      // Use is explicitly allowed, no security dialog needed
      this._usePermitted = true;
      this._securityDialogNeeded = false;
      break;
  }
};


WebCL.prototype.showSecurityPrompt = function ()
{
  TRACE (this, "showSecurityPrompt", arguments);

  try
  {
    var prompter = Services.ww.getNewPrompter (null)
    if (!prompter) throw new Error();

    var allowed = webclutils.getPref_allowed();
    var makePermanent = {
      value: (allowed == webclutils.PREF_WEBCL_ALLOWED__NOT_SET ? false : true)
    };

    var title = "WebCL security warning";
    var msg = "WARNING! This WebCL implementation is experimental and"
              + " is likely to introduce severe security vulnerabilities"
              + " in your system. Use it cautiously and at your own risk."
              + " This setting is also available in Advanced Settings"
              + " (about:config) as " + webclutils.PREF_WEBCL_ALLOWED + ".";
    try
    {
      var response = prompter.confirmCheck (title, msg,
                                            "Remember this settings.",
                                            makePermanent);

      this._usePermitted = !!response;
      this._securityDialogNeeded = false;

      if (makePermanent.value)
      {
        setPref_allowed (1);
      }
    }
    catch (e)
    {
      LOG ("Failed to show security dialog: " + e);
    }
  }
  catch (e)
  {
    ERROR ("Failed to show security dialog: " + e);
    return false;
  }

  return true;
};


WebCL.prototype.ensureInitialized = function ()
{
  if (!(this && this._initialized))
  {
    throw new Exception (this.classDescription + " has not bee initialized!");
  }
};


WebCL.prototype.ensureUsePermitted = function ()
{
  if (this && this._usePermitted)
  {
    if (!this._securityDialogNeeded)
    {
      // Use permitted and security dialog not needed
      return;
    }

    if (this.showSecurityPrompt ())
    {
      // Security prompt accepted
      this._usePermitted = true;
      return;
    }
  }

  throw new Exception ("NOT PERMITTED.");
};


WebCL.prototype.ensureLibraryLoaded = function ()
{
  if (!this._internal)
  {
    try
    {
      this._internal = new LibOCLWrapper (this._oclLibPath);
    }
    catch (e)
    {
      throw new Exception ("Failed to load OpenCL library" +
                           (this._oclLibPath ? " \""+this._oclLibPath+"\"" : "") +
                           ": " + e + ".");
    }
  }
};


WebCL.prototype._convertEventWaitList = function (eventWaitList)
{
  var clEvents = [];
  for (var i = 0; i < eventWaitList.length; ++i)
  {
    var p = webclutils.unwrapInternalOrNull (eventWaitList[i], this);
    if (!webclutils.validateEvent (p))
    {
      // TODO: handle errors better...
      throw new Exception ("Invalid argument: eventWaitList[" + i + "].");
    }
    clEvents.push (p);
  }

  return clEvents;
}


//------------------------------------------------------------------------------
// Internal functions

var NSGetFactory = XPCOMUtils.generateNSGetFactory ([WebCL]);


} catch(e) { ERROR ("webcl.js: "+EXCEPTIONSTR(e)); throw e; }