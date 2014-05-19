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

var EXPORTED_SYMBOLS = [ "WebCL" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");

INFO ("WebCL, Nokia Research Center, 2014");

try {

  Cu.import ("resource://nrcwebcl/modules/common.jsm");

  Cu.import ("resource://gre/modules/Services.jsm");
  Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
  Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
  Cu.import ("resource://nrcwebcl/modules/webclconstructors.jsm");

  Cu.import ("resource://nrcwebcl/modules/mixin.jsm");
  Cu.import ("resource://nrcwebcl/modules/mixins/owner.jsm");

  Cu.import ("resource://nrcwebcl/modules/lib_ocl/wrapper.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/platform.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/context.jsm");

  Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

  Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");

  DEBUG ("webcl.jsm: modules loaded");


  // Ensure all other WebCL classes get imported
  // TODO: Move this somewhere where it'll only get run if WebCL is being touched by the page.
  Cu.import ("resource://nrcwebcl/modules/webcl/webclplatform.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webcldevice.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclcontext.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclcommandqueue.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclevent.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclprogram.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclkernel.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclmemoryobject.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclsampler.jsm");
  Cu.import ("resource://nrcwebcl/modules/webcl/webclimagedescriptor.jsm");

  Cu.import ("resource://nrcwebcl/modules/webclasyncworkerapi.jsm");
  Cu.import ("resource://gre/modules/ctypes.jsm");


} catch (e) { ERROR ("webcl.jsm: Failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }

try {

function WebCL ()
{
  TRACE (this, "WebCL", arguments);
  try {
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

    this._webclState = { inCallback: false };

    this.__exposedProps__ =
    {
      init: "r",
      getManagedExternalIdentityList: "r",

      getPlatforms: "r",
      createContext: "r",
      getSupportedExtensions: "r",
      enableExtension: "r",
      waitForEvents: "r",
      releaseAll: "r",
      dumpTree: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webcl.jsm:WebCL failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCL = WebCL;
addMixin (WebCL.prototype, OwnerMixin);


// We need to look like XPCOM component to function as nsIObserver
WebCL.prototype.classDescription = "WebCL";
WebCL.prototype.classID =          Components.ID("{dd8e0776-5030-4b4d-be81-ab5417dc54b7}");
WebCL.prototype.contractID =       "@webcl.nokiaresearch.com/IWebCL;1";
WebCL.prototype.QueryInterface =   XPCOMUtils.generateQI ([ //Ci.IWebCL,
                                                            Ci.nsIObserver,
                                                            Ci.nsISupportsWeakReference,
                                                            Ci.nsIClassInfo
]);

// TODO: Class Info?


//------------------------------------------------------------------------------
// nsIObserver

WebCL.prototype.observe = function (subject, topic, data)
{
  TRACE (this, "observe", arguments);

  try
  {
    switch (topic) {
      case "nsPref:changed":
        if (data == webclutils.PREF_WEBCL_ALLOWED)
        {
          this.handlePrefAllowed (webclutils.getPref_allowed (true));
        }
        break;
    }
  }
  catch(e)
  {
    try { ERROR("webcl.jsm:WebCL.observe failed: " + String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


//------------------------------------------------------------------------------

WebCL.prototype.init = function (domWindow)
{
  TRACE (this, "init", arguments);

  try
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
  }
  catch(e)
  {
    try { ERROR("webcl.jsm:WebCL.init failed: " + String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
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

    webclutils.validateNumArgs(arguments.length, 0);

    return webclutils.wrapInternal (this._internal.getPlatforms (), this);
  }
  catch (e)
  {
    try { ERROR("webcl.jsm:WebCL.getPlatforms failed: " + String(e)); }catch(e){}
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

    webclutils.validateNumArgs(arguments.length, 0, 2);

    if (this._webclState.inCallback) throw new INVALID_OPERATION ("this function cannot be called from a WebCLCallback");

    if (arguments.length === 0)
      return createContextFromDeviceType.call(this, ocl_const.CL_DEVICE_TYPE_DEFAULT);

    if (arguments.length === 1)
    {
      if (webclutils.validateInteger(arguments[0]))
        return createContextFromDeviceType.call(this, arguments[0]);

      if (webclutils.validateDevice(arguments[0]))
        return createContextFromDevice.call(this, arguments[0]);
      
      if (webclutils.validatePlatform(arguments[0]))
        return createContextFromPlatform.call(this, arguments[0], ocl_const.CL_DEVICE_TYPE_DEFAULT);
      
      if (Array.isArray(arguments[0]))
        return createContextFromDeviceArray.call(this, arguments[0]);

      throw new INVALID_DEVICE_TYPE("the sole argument must be a valid DEVICE_TYPE enum, Platform, Device, or Device array; was ", arguments[0]);
    }

    if (arguments.length === 2)
    {
      if (!webclutils.validatePlatform(arguments[0]))
        throw new INVALID_PLATFORM("'platform' must be a valid WebCLPlatform; was ", arguments[0]);

      if (!webclutils.validateInteger(arguments[1]))
        throw new INVALID_DEVICE_TYPE("'deviceType' must be a valid DEVICE_TYPE enum; was ", arguments[1]);

      return createContextFromPlatform.call(this, arguments[0], arguments[1]);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); } catch(e) {}
    throw webclutils.convertCLException (e);
  }
};


WebCL.prototype.getSupportedExtensions = function ()
{
  TRACE (this, "getSupportedExtensions", arguments);

  try
  {
    webclutils.validateNumArgs(arguments.length, 0);

    // TODO implement getSupportedExtensions
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
    webclutils.validateNumArgs(arguments.length, 1);

    // TODO implement enableExtension
    return false;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCL.prototype.waitForEvents = function (eventWaitList, whenFinished)
{
  TRACE (this, "waitForEvents", arguments);

  try
  {
    this.ensureInitialized ();
    this.ensureUsePermitted ();
    this.ensureLibraryLoaded ();

    webclutils.validateNumArgs(arguments.length, 1, 2);

    whenFinished = webclutils.defaultTo(whenFinished, null);

    if (whenFinished !== null && typeof(whenFinished) !== "function")
      throw new TypeError("'whenFinished' must be null or a WebCLCallback function; was " + whenFinished);

    this._validateEventWaitList(eventWaitList, typeof(whenFinished) !== 'function');

    var clEventWaitList = eventWaitList.map(function(v) { return webclutils.unwrapInternal(v); });

    if (whenFinished)
    {
      var instance = this;
      let asyncWorker = new WebCLAsyncWorker (null, function (err)
      {
        if (err) {
          ERROR ("WebCL.waitForEvents: " + err);

          instance._webclState.inCallback = true;
          try {
            whenFinished ();
          }
          finally {
            instance._webclState.inCallback = false;
            asyncWorker.close ();
          }

          return;
        }

        asyncWorker.waitForEvents (clEventWaitList,
                                   function (err)
                                   {
                                     if (err) {
                                       ERROR ("WebCL.waitForEvents: " + err);
                                     }

                                     instance._webclState.inCallback = true;
                                     try {
                                       whenFinished ();
                                     }
                                     finally {
                                       instance._webclState.inCallback = false;
                                       asyncWorker.close ();
                                     }
                                   });
      });

    }
    else
    {
      if (this._webclState.inCallback)
        throw new INVALID_OPERATION ("the blocking form of this function cannot be called from a WebCLCallback");

      this._internal.waitForEvents (clEventWaitList);
    }
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
    webclutils.validateNumArgs(arguments.length, 0);

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
    throw new Exception (this.classDescription + " has not been initialized!");
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


WebCL.prototype._validateEventWaitList = function (eventWaitList, isBlocking)
{
  var eventWaitList = webclutils.defaultTo(eventWaitList, null);
  webclutils.validateEventWaitList(eventWaitList, isBlocking, false, false, null);
};


function createContextFromDeviceType(dt)
{
  TRACE (this, "createContextFromDeviceType", arguments);

  if (!(dt === 1 || dt === 2 || dt === 4 || dt === 8))
    throw new INVALID_DEVICE_TYPE("'deviceType' must be a valid DEVICE_TYPE enum; was ", dt);

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

  throw new DEVICE_NOT_FOUND("no Devices found matching the given deviceType ("+dt+") on any Platform");
};

function createContextFromPlatform(platform, dt)
{
  TRACE (this, "createContextFromPlatform", arguments);

  if (!(dt === 1 || dt === 2 || dt === 4 || dt === 8 || dt === ocl_const.CL_DEVICE_TYPE_ALL))
    throw new INVALID_DEVICE_TYPE("'deviceType' must be a valid DEVICE_TYPE enum; was ", dt);

  try {
    var platform = webclutils.unwrapInternal(platform);
    var clCtx = this._internal.createContextFromType([ocl_const.CL_CONTEXT_PLATFORM, platform, 0], dt);
    return webclutils.wrapInternal (clCtx, this);
  } catch (e) {
    if (e.name !== 'DEVICE_NOT_FOUND') throw e;
    else throw new DEVICE_NOT_FOUND("no Devices found matching the given deviceType ("+dt+") on the given Platform");
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
    throw new INVALID_VALUE("'devices.length' must not be zero");

  if (!webclutils.validateArray(devices, webclutils.validateDevice))
    throw new INVALID_DEVICE("'devices' must only contain valid instances of WebCLDevice; was ", devices);

  var clDevices = devices.map(function(v) { return webclutils.unwrapInternal(v); });
  var clCtx = this._internal.createContext(null, clDevices);
  return webclutils.wrapInternal (clCtx, this);
};


} catch(e) { ERROR ("webcl.jsm: "+EXCEPTIONSTR(e)); throw e; }
