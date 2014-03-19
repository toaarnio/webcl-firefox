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

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");


DEBUG ("webcl.js: modules loaded");

} catch (e) { ERROR ("webcl.js: Failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }

try {


var CLASSNAME =  "WebCL";
var CID =        "{dd8e0776-5030-4b4d-be81-ab5417dc54b7}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCL;1";


function WebCL ()
{
  if (!(this instanceof WebCL)) return new WebCL ();

  this.wrappedJSObject = this;

  this._usePermitted = false;
  this._securityDialogNeeded = true;
  this._initialized = false;

  this._oclLibPath = webclutils.getPref_openclLib (true);
  this._abi = getRuntimeABI ();
  this._os = getRuntimeOS ();

  this._internal = null;
  this._objectRegistry = {};
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


// getPlatforms()[i]._owner == this == [WebCL]
//
WebCL.prototype.getPlatforms = function ()
{
  TRACE (this, "getPlatforms", arguments);

  try
  {
    this.ensureInitialized ();
    this.ensureUsePermitted ();
    this.ensureLibraryLoaded ();

    return webclutils.wrapInternal (this._internal.getPlatforms (), this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createContext()._owner == this == [WebCL]
//
WebCL.prototype.createContext = function (arg0, deviceType)
{
  TRACE (this, "createContext", arguments);

  try
  {
    this.ensureInitialized ();
    this.ensureUsePermitted ();
    this.ensureLibraryLoaded ();

    if (arg0 === undefined || arg0 === null || webclutils.validateNumber(arg0))
      return createContextFromDeviceType.call(this, arg0);

    if (webclutils.validatePlatform(arg0))
      return createContextFromPlatform.call(this, arg0, deviceType);

    if (webclutils.validateDevice(arg0))
      return createContextFromDevice.call(this, arg0);

    if (Array.isArray(arg0))
      return createContextFromDeviceArray.call(this, arg0);

    throw new CLError(ocl_errors.CL_INVALID_DEVICE_TYPE, 
                      "first argument must be a valid DEVICE_TYPE, WebCLPlatform, WebCLDevice, or WebCLDevice array", 
                      "webcl.createContext");
  }
  catch (e)
  {
    try { ERROR(String(e)); } catch(e) {}
    throw webclutils.convertCLException (e);
  }
};

function createContextFromDeviceType(dt) 
{
  TRACE (this, "createContextFromDeviceType", arguments);

  if (dt === undefined || dt === null || dt === 1 || dt === 2 || dt === 4 || dt === 8) {
    dt = dt || ocl_const.CL_DEVICE_TYPE_DEFAULT;
  } else {
    LOG("createContextFromDeviceType: invalid deviceType: " + dt);
    throw new CLError (ocl_errors.CL_INVALID_DEVICE_TYPE, "deviceType must be a valid DEVICE_TYPE enum, or undefined");
  }

  // Let the OpenCL ICD driver find a matching device on any of the available Platforms.  This
  // approach often fails, so we ignore any exceptions and try again with a manual search (see
  // below).
  //
  try {
    LOG("createContextFromDeviceType: attempting to create a context for deviceType " + dt + " with platform == NULL");
    var clCtx = this._internal.createContextFromType(null, dt);
    LOG("createContextFromDeviceType: successfully created a context for deviceType " + dt + " with platform == NULL");
    return webclutils.wrapInternal (clCtx, this);
  } catch (e) {
    LOG("createContextFromDeviceType: failed to create a context for deviceType " + dt + " with platform == NULL");
  }
  
  // If the above automatic platform selection fails (as it typically does on current OpenCL
  // drivers), then manually loop through all platforms trying to find a device with the given
  // deviceType.
  //
  var platforms = this._internal.getPlatforms ();
  for (var p=0; p < platforms.length; p++) {
    platform = platforms[p];
    try {
      LOG("createContextFromDeviceType: attempting to create a context for deviceType " + dt + " on platform " + p);
      var clCtx = this._internal.createContextFromType([ocl_const.CL_CONTEXT_PLATFORM, platform, 0], dt);
      return webclutils.wrapInternal (clCtx, this);
    } catch (e) {
      LOG("createContextFromDeviceType: Could not create a context on platform " + p + ": " + e);
      if (e.name !== 'DEVICE_NOT_FOUND') throw e;
    }
  }

  throw new CLError(ocl_errors.CL_DEVICE_NOT_FOUND, "no Devices found matching the given deviceType on any Platform");
};

function createContextFromPlatform(platform, dt) 
{
  TRACE (this, "createContextFromPlatform", arguments);

  if (dt !== undefined && dt !== null && !webclutils.validateNumber(dt))
    throw new CLError (ocl_errors.CL_INVALID_DEVICE_TYPE, "deviceType must be a valid DEVICE_TYPE enum, or undefined");

  if (dt === undefined || dt === null || dt === 1 || dt === 2 || dt === 4 || dt === 8 || dt === ocl_const.CL_DEVICE_TYPE_ALL) {
    dt = dt || ocl_const.CL_DEVICE_TYPE_DEFAULT;
  } else {
    LOG("createContextFromPlatform: invalid deviceType: " + dt);
    throw new CLError (ocl_errors.CL_INVALID_DEVICE_TYPE, "deviceType must be a valid DEVICE_TYPE enum, or undefined");
  }
  
  try {
    var platform = webclutils.unwrapInternal(platform);
    var clCtx = this._internal.createContextFromType([ocl_const.CL_CONTEXT_PLATFORM, platform, 0], dt);
    return webclutils.wrapInternal (clCtx, this);
  } catch (e) {
    if (e.name !== 'DEVICE_NOT_FOUND') throw e;
    else throw new CLError(ocl_errors.CL_DEVICE_NOT_FOUND, "no Devices found matching the given deviceType on the given Platform");
  }
};

function createContextFromDevice(device) 
{
  TRACE (this, "createContextFromDevice", arguments);
  var devices = [ webclutils.unwrapInternal(device) ];
  var clCtx = this._internal.createContext(null, devices);
  return webclutils.wrapInternal (clCtx, this);
};

function createContextFromDeviceArray(devices) 
{
  TRACE (this, "createContextFromDeviceArray", arguments);
  
  if (devices.length === 0)
    throw new CLError(ocl_errors.CL_INVALID_VALUE, "'devices.length' must not be zero");
  
  devices.forEach(function(v, i) { 
    devices[i] = webclutils.unwrapInternal(v); 
  });

  if (!webclutils.validateArray(devices, webclutils.validateDevice))
    throw new CLError(ocl_errors.CL_INVALID_DEVICE, "'devices' must only contain instances of WebCLDevice");

  var clCtx = this._internal.createContext(null, devices);
  return webclutils.wrapInternal (clCtx, this);
};


WebCL.prototype.getSupportedExtensions = function ()
{
  TRACE (this, "getSupportedExtensions", arguments);

  try
  {
    // TODO!
    return [];
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCL.prototype.enableExtension = function (extensionName)
{
  TRACE (this, "enableExtension", arguments);

  try
  {
    // TODO;
    return false;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCL.prototype.waitForEvents = function (eventList, whenFinished)
{
  TRACE (this, "waitForEvents", arguments);

  try
  {
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
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCL.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);

  try
  {
    if (!this._initialized)
    {
      // No need to do anything if we haven't been initialized.
      return;
    }

    // NOTE: No need to ensure use permitted, in fact it should NOT be done or
    //       we'll have unwanted permission prompts on page unload.

    this._releaseAllChildren ();

    this._clearRegistry ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
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
                                            "Remember this setting.",
                                            makePermanent);

      this._usePermitted = !!response;
      this._securityDialogNeeded = false;

      if (makePermanent.value)
      {
        webclutils.setPref_allowed (response ? 1 : 0);
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

    if (!this.showSecurityPrompt ())
    {
      // Security prompt failed
      this._securityDialogNeeded = false;
      this._usePermitted = false;
      return;
    }

    // Return if OK
    if (this._usePermitted) return;
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
    if (!webclutils.validateNonEmptyEvent (p))
    {
      // TODO: handle errors better...
      throw new CLInvalidArgument ("eventWaitList[" + i + "].");
    }
    clEvents.push (p);
  }

  return clEvents;
}


//------------------------------------------------------------------------------
// Internal functions

var NSGetFactory = XPCOMUtils.generateNSGetFactory ([WebCL]);


} catch(e) { ERROR ("webcl.js: "+EXCEPTIONSTR(e)); throw e; }
