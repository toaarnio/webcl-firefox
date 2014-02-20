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


var EXPORTED_SYMBOLS = [ "webclutils" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


var PREF_WEBCL_ALLOWED = "extensions.webcl.allowed";
var PREF_WEBCL_ALLOWED__NOT_SET = -1;
var PREF_WEBCL_ALLOWED__FALSE =   0;
var PREF_WEBCL_ALLOWED__TRUE =    1;

var PREF_OCLLIB = "extensions.webcl.opencllib";


Cu.import("resource://gre/modules/Services.jsm");

Cu.import("resource://nrcwebcl/modules/logger.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/platform.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/context.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/commandqueue.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/event.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/memoryobject.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/program.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/kernel.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/sampler.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("resource://nrcwebcl/modules/webclconstructors.jsm");



function getPref_allowed (setDefaultIfNeeded)
{
  var rv = -1;

  try
  {
    rv = Services.prefs.getIntPref (PREF_WEBCL_ALLOWED);
    if (rv === undefined) throw new Error();
  }
  catch (e)
  {
    rv = -1;

    if (setDefaultIfNeeded)
    {
      try {
        Services.prefs.setIntPref (PREF_WEBCL_ALLOWED, PREF_WEBCL_ALLOWED__NOT_SET);
      } catch (e) {}
    }
  }

  return rv;
}

function setPref_allowed (value)
{
  try {
    Services.prefs.setIntPref (PREF_WEBCL_ALLOWED, value);
  } catch (e) {
    LOG ("Failed to set " + PREF_WEBCL_ALLOWED + ": " + e);
  }
}

function setPrefObserver_allowed (observer)
{
  // NOTE: Usin weak reference
  //prefs.addObserver (PREF_WEBCL_ALLOWED, observer, true);
  Services.prefs.addObserver (PREF_WEBCL_ALLOWED, observer, true);
}

function getPref_openclLib (setDefaultIfNeeded)
{
  var rv = "";

  try
  {
    rv = Services.prefs.getCharPref (PREF_OCLLIB);
  }
  catch (e)
  {
    rv = "";
    if (setDefaultIfNeeded)
    {
      try {
        prefs.setCharPref (PREF_OCLLIB, "");
      } catch (e) {}
    }
  }

  return rv;
}

function setPrefObserver_openclLib (observer)
{
  var prefs = Cc["@mozilla.org/preferences-service;1"].getService (Ci.nsIPrefBranch);
  if (prefs)
  {
    // NOTE: Usin weak reference
    prefs.addObserver (PREF_OCLLIB, observer, true);
  }
}



function wrapInternal (value, owner)
{
  TRACE ("common", "wrapInternal", arguments);

  if (owner && owner.wrappedJSObject) owner = owner.wrappedJSObject;
  if (owner && !("_registerObject" in owner))
  {
    ERROR ("wrapInternal: owner doesn't seem right.");
    throw CLInternalError ("Invalid owner.");
  }

  var rv = value;

  if (Array.isArray(value))
  {
    var rv = [];
    for (var i = 0; i < value.length; ++i)
    {
      rv.push (wrapInternal (value[i], owner));
    }
  }
  else if (value instanceof Platform)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLPlatform");
    var rv = createWebCLPlatform (owner, value);
  }
  else if (value instanceof Device)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLDevice");
    var rv = createWebCLDevice (owner, value);
  }
  else if (value instanceof Context)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLContext");
    var rv = createWebCLContext (owner, value);
  }
  else if (value instanceof CommandQueue)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLCommandQueue");
    var rv = createWebCLCommandQueue (owner, value);
  }
  else if (value instanceof CLEvent)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLEvent");
    try {
      var type = value.getInfo (ocl_info.CL_EVENT_COMMAND_TYPE);
    } catch (e) { ERROR ("wrapInternal: Failed to get event type."); }

    switch (type)
    {
      case ocl_const.CL_COMMAND_USER:
        var rv = createWebCLUserEvent (owner, value);
        break;

      default:
        var rv = createWebCLEvent (owner, value);
        break;
    }

  }
  else if (value instanceof MemoryObject)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLMemoryObject");

    try {
      var type = value.getInfo (ocl_info.CL_MEM_TYPE);
    } catch (e) { ERROR ("wrapInternal: Failed to get memory object type."); }

    switch (type)
    {
      case ocl_const.CL_MEM_OBJECT_BUFFER:
        var rv = createWebCLBuffer (owner, value);
        break;

      case ocl_const.CL_MEM_OBJECT_IMAGE2D:
        var rv = createWebCLImage (owner, value);
        break;

      default:
        var rv = createWebCLMemoryObject (owner, value);
        break;
    }

  }
  else if (value instanceof Program)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLProgram");
    var rv = createWebCLProgram (owner, value);
  }
  else if (value instanceof Kernel)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLKernel");
    var rv = createWebCLKernel (owner, value);
  }
  else if (value instanceof Sampler)
  {
    if (!value) throw new CLInternalError ("Invalid internal", "WebCLSampler");
    var rv = createWebCLSampler (owner, value);
  }

  return rv;
}


function unwrapInternalOrNull (object, /*optional*/ maxRecursion)
{
  rv = null;

  // TODO: Not sure if we should dedicate this function to just handling
  //       the object unwrapping and handle all recursion somewhere else.

  if (maxRecursion == undefined || isNaN(+maxRecursion))
  {
    // Set the default maxRecursion
    maxRecursion = 5;
  }

  if (maxRecursion <= 0)
  {
    LOG ("unwrapInternalOrNull: Maximum recursion level reached.");
    throw new Error ("unwrapInternalOrNull: Maximum recursion level reached.");  // TODO?
    // TODO: Throw error or just return object?
  }

  try
  {
    if (!object || typeof(object) != "object") return null;
    var o = object;
    if (o instanceof Ci.IWebCLPlatform || o instanceof Ci.IWebCLDevice ||
        o instanceof Ci.IWebCLContext || o instanceof Ci.IWebCLCommandQueue ||
        o instanceof Ci.IWebCLEvent || o instanceof Ci.IWebCLUserEvent ||
        o instanceof Ci.IWebCLMemoryObject ||
        o instanceof Ci.IWebCLBuffer || o instanceof Ci.IWebCLImage ||
        o instanceof Ci.IWebCLProgram || o instanceof Ci.IWebCLKernel ||
        o instanceof Ci.IWebCLSampler
    )
    {
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      rv = o._internal;
    }
    else if (o instanceof Ci.IWebCLImageDescriptor)
    {
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      rv = o;
    }
    else if ("_internal" in o)
    {
      // NOTE: The object was not identified as IWebCL* object but it quacks like
      // a client wrapper object. Those should be unwrapped on the client wrapper
      // side but due to issues in unwrapping objects containing IWebCL* objects
      // we might get client side wrappers here as well.
      // Try a 2nd stage unwrapping on the "_internal" member. If we don't get
      // anything out of that, then we'll just return the object as such.

      rv = unwrapInternal (o._internal, maxRecursion-1);
    }

  }
  catch(e) {
    ERROR ("unwrapInternalOrNull: " + e);
  }

  return rv;
}


function unwrapInternal (object, /*optional*/ maxRecursion)
{
  var rv = unwrapInternalOrNull (object, maxRecursion);
  if (rv == null) rv = object;
  return rv;
}


function convertCLException (e)
{
  try
  {
    try { var s = String(e); } catch (e) { var s = "<invalid exception>"; }


    var exData = { name: "", message: "", type:null, context: null };

    if (typeof(e) == "string" && e.startsWith("WEBCLEXCEPTION:"))
    {
      // Nothing needs to be done to WebCLException instances
      return e;
    }
    else if (e instanceof CLError || e instanceof CLUnsupportedInfo)
    {
      exData.name = e.name;
      exData.message = e.msg;
      exData.type = "cl";
      exData.context = e.context;
    }
    else if (e instanceof CLInternalError)
    {
      exData.name = "";
      exData.message = e.msg;
      exData.type = "internal";
      exData.context = e.context;
    }
    else if (e instanceof CLInvalidArgument)
    {
      exData.name = e.argName;
      exData.message = e.msg;
      exData.type = "invalidargument";
      exData.context = e.context;
    }
    else if (e instanceof CLNotImplemented)
    {
      exData.name = e.name;
      exData.message = e.msg;
      exData.type = "notimplemented";
      exData.context = e.context;
    }
    else if (e instanceof CLInvalidated)
    {
      exData.name = e.name;
      exData.message = e.msg;
      exData.type = "invalidobject";
      exData.context = e.context;
    }
    else if (e instanceof CLException)
    {
      LOG ("convertCLException: Unexpected CLException instance ("+s+")");
      exData.name = e.name;
      exData.message = e.msg;
      exData.type = "notimplemented";
      exData.context = e.context;
    }
    else if (e instanceof Error)
    {
      // input is a generic exception, probably internal error.
      LOG ("convertCLException: Error ("+s+")");
      exData.type = "internal";
    }
    else if (e instanceof Exception)
    {
      // input is an XPCOM exception, probably internal error
      LOG ("convertCLException: Exception ("+s+")");
      exData.type = "internal";
      exData.msg = e.message;
    }
    else
    {
      // Unexpected: input is something else, probably internal error
      LOG ("convertCLException: Unknown object ("+s+")");
      exData.type = "internal";
    }

    return "WEBCLEXCEPTION:" + btoa(JSON.stringify(exData));
  }
  catch (e)
  {
    ERROR ("convertCLException failed: " + s);
    return "WEBCLEXCEPTION:";
  }
}


function validateWrapped (obj, type)
{
  return validateInternal(unwrapInternalOrNull(obj), type);
}

function validateInternal (obj, type)
{
  return (obj && obj instanceof type && obj._internal && !obj._internal.isNull());
}

function validateWrappedOrInternal (obj, type)
{
  return validateInternal(obj, type) || validateWrapped(obj, type);
}

function validatePlatform (obj) { return validateWrappedOrInternal(obj, Platform); }
function validateDevice (obj)   { return validateWrappedOrInternal(obj, Device); }
function validateContext (obj)  { return validateWrappedOrInternal(obj, Context); }
function validateQueue (obj)    { return validateWrappedOrInternal(obj, CommandQueue); }
function validateBuffer (obj)   { return validateWrappedOrInternal(obj, MemoryObject); }
function validateImage (obj)    { return validateWrappedOrInternal(obj, MemoryObject); }
function validateSampler (obj)  { return validateWrappedOrInternal(obj, Sampler); }
function validateProgram (obj)  { return validateWrappedOrInternal(obj, Program); }
function validateKernel (obj)   { return validateWrappedOrInternal(obj, Kernel); }
function validateEvent (obj)    { return validateWrappedOrInternal(obj, CLEvent); }

function validateArray (arr, itemValidator)
{
  if (Array.isArray(arr))
  {
    if (itemValidator && typeof(itemValidator) == "function")
    {
      for (var i = 0; i < arr.length; ++i)
      {
        if (!itemValidator(arr[i])) return false;
      }
      return true;
    }
  }
  return false;
}

function validateArrayLength (arr, lengthValidator)
{
  if (Array.isArray(arr))
  {
    if (lengthValidator && typeof(lengthValidator) == "function")
    {
      if (lengthValidator(arr)) return true;
    }
  }
  return false;
}

function validateArrayBufferView (arr) // TODO more robust type validation
{
  var hasBuffer = validateObject(arr) && validateObject(arr.buffer);
  var hasLength = hasBuffer && validateNumber(arr.length) && validateNumber(arr.buffer.byteLength);
  var hasAttribs = hasBuffer && validateNumber(arr.BYTES_PER_ELEMENT) && validateNumber(arr.byteOffset);
  return hasLength && hasAttribs;
}

function validateNumber (n)
{
  return (n !== null) && (typeof(n) === 'number') && (!isNaN(+n));
}

function validateObject (o)
{
  return (typeof(o) === 'object') && (o !== null);
}

function validateBuildOptions (options, validOptions)
{
  var strings = options.split(" ");
  for (var i=0; i < strings.length; i++) {
    if (strings[i] === "-D" && !strings[i+1]) {
      return false;
    }
    if (strings[i].length > 0 && validOptions.indexOf(strings[i]) === -1) {
      if (strings[i-1] !== "-D") {
        return false;
      }
    }
  }
  return true;
}


var webclutils = {
  getPref_allowed:              getPref_allowed,
  setPref_allowed:              setPref_allowed,
  setPrefObserver_allowed:      setPrefObserver_allowed,
  getPref_openclLib:            getPref_openclLib,
  setPrefObserver_openclLib:    setPrefObserver_openclLib,

  // Preference ids
  PREF_WEBCL_ALLOWED:           PREF_WEBCL_ALLOWED,
  PREF_OCLLIB:                  PREF_OCLLIB,

  // Preference values
  PREF_WEBCL_ALLOWED__NOT_SET:  PREF_WEBCL_ALLOWED__NOT_SET,
  PREF_WEBCL_ALLOWED__FALSE:    PREF_WEBCL_ALLOWED__FALSE,
  PREF_WEBCL_ALLOWED__TRUE:     PREF_WEBCL_ALLOWED__TRUE,

  wrapInternal:                 wrapInternal,
  unwrapInternalOrNull:         unwrapInternalOrNull,
  unwrapInternal:               unwrapInternal,
  convertCLException:           convertCLException,

  validatePlatform:             validatePlatform,
  validateDevice:               validateDevice,
  validateContext:              validateContext,
  validateQueue:                validateQueue,
  validateBuffer:               validateBuffer,
  validateImage:                validateImage,
  validateSampler:              validateSampler,
  validateProgram:              validateProgram,
  validateKernel:               validateKernel,
  validateEvent:                validateEvent,

  validateArray:                validateArray,
  validateArrayLength:          validateArrayLength,
  validateArrayBufferView:      validateArrayBufferView,
  validateNumber:               validateNumber,
  validateObject:               validateObject,
  validateBuildOptions:         validateBuildOptions,
};
