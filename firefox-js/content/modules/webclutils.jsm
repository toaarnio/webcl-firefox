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

try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


var PREF_WEBCL_ALLOWED = "extensions.webcl.allowed";
var PREF_WEBCL_ALLOWED__NOT_SET = -1;
var PREF_WEBCL_ALLOWED__FALSE =   0;
var PREF_WEBCL_ALLOWED__TRUE =    1;

var PREF_OCLLIB = "extensions.webcl.opencllib";

var PREF_VALIDATOR_ENABLED = "extensions.webcl.enable-validator";



Cu.import("resource://gre/modules/Services.jsm");

Cu.import("chrome://nrcwebcl/content/modules/logger.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/platform.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/device.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/context.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/commandqueue.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/event.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/memoryobject.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/program.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/kernel.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/sampler.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/webclclasses.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webclconstructors.jsm");

var uuidGenerator = Cc["@mozilla.org/uuid-generator;1"]
                      .getService(Components.interfaces.nsIUUIDGenerator);




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
  // NOTE: Using weak reference
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
    // NOTE: Using weak reference
    prefs.addObserver (PREF_OCLLIB, observer, true);
  }
}


function getPref_validatorEnabled (setDefaultIfNeeded)
{
  var rv = true;

  try
  {
    rv = Services.prefs.getBoolPref (PREF_VALIDATOR_ENABLED);
    if (rv === undefined) throw new Error();
  }
  catch (e)
  {
    rv = true;

    if (setDefaultIfNeeded)
    {
      try {
        Services.prefs.setBoolPref (PREF_VALIDATOR_ENABLED, rv);
      } catch (e) {}
    }
  }

  return rv;
}


function setPrefObserver_validatorEnabled (observer)
{
  // NOTE: Using weak reference
  Services.prefs.addObserver (PREF_VALIDATOR_ENABLED, observer, true);
}


function generateIdentity ()
{
  return uuidGenerator.generateUUID().toString().slice(1,-1).replace("-", "", "g");
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
    if (o instanceof WEBCLCLASSES.WebCLPlatform || o instanceof WEBCLCLASSES.WebCLDevice ||
        o instanceof WEBCLCLASSES.WebCLContext || o instanceof WEBCLCLASSES.WebCLCommandQueue ||
        o instanceof WEBCLCLASSES.WebCLEvent || o instanceof WEBCLCLASSES.WebCLUserEvent ||
        o instanceof WEBCLCLASSES.WebCLMemoryObject ||
        o instanceof WEBCLCLASSES.WebCLBuffer || o instanceof WEBCLCLASSES.WebCLImage ||
        o instanceof WEBCLCLASSES.WebCLProgram || o instanceof WEBCLCLASSES.WebCLKernel ||
        o instanceof WEBCLCLASSES.WebCLSampler
    )
    {
      if (o.wrappedJSObject) o = o.wrappedJSObject;
      rv = o._internal;
    }
    else if (o instanceof WEBCLCLASSES.WebCLImageDescriptor)
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


    var exData = { name: "", message: "", type:null, context: null, fileName: "", lineNumber: null };
    exData.fileName = e.fileName;
    exData.lineNumber = e.lineNumber;

    if (e instanceof CLError || e instanceof CLUnsupportedInfo)
    {
      exData.name = e.name;
      exData.message = e.msg;
      exData.type = "cl";
      exData.context = e.context;
    }
    else if (e instanceof CLSyntaxError)
    {
      exData.name = "";
      exData.message = e.msg;
      exData.type = "syntaxerror";
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
    else if (e.name === "TypeError")  // "instanceof TypeError" does not work in this context
    {
      exData.name = "TypeError";
      exData.type = "typeerror";
      exData.message = e.message;
      exData.fileName = e.fileName;
      exData.lineNumber = e.lineNumber;
    }
    else if (e.name === "Error")  // "instanceof Error" does not work in this context
    {
      // input is a generic exception, probably internal error.
      LOG ("convertCLException: Error ("+s+")");
      exData.type = "internal";
      exData.message = e.name + ": " + e.message + " [" + e.fileName + ": line " + e.lineNumber + "]";
    }
    else if (e instanceof Exception)
    {
      // input is an XPCOM exception, probably internal error
      LOG ("convertCLException: Exception ("+s+")");
      exData.type = "internal";
      exData.message = e.name + ": " + e.message + " [" + e.fileName + ": line " + e.lineNumber + "]";
    }
    else
    {
      // Unexpected: input is something else, probably internal error
      LOG ("convertCLException: Unknown error ("+s+")");
      exData.type = "internal";
      exData.message = e.name + ": " + e.message + " [" + e.fileName + ": line " + e.lineNumber + "]";
    }

    //return "WEBCLEXCEPTION:" + btoa(JSON.stringify(exData));
    return exData;
  }
  catch (e)
  {
    ERROR ("convertCLException failed: " + s);
    return { name: "WEBCL_IMPLEMENTATION_FAILURE", message: "", type:null, context: null, fileName: "", lineNumber: null };
  }
}


var gNeedToWaiveXrays = (Services.vc.compare(Services.appinfo.version, "32.0") >= 0);
function unray (value)
{
  if (gNeedToWaiveXrays)
  {
    // waive XRay vision only for objects
    if (value && typeof(value) == 'object')
    {
      return Cu.waiveXrays (value);
    }
  }

  return value;
}


function validateNumArgs (numArgs, minArgs, maxArgs)
{
  if (arguments.length === 2 && numArgs !== minArgs)
    throw new CLSyntaxError("Expected " + minArgs + " arguments, received " + numArgs);

  if (arguments.length === 3 && (numArgs < minArgs || numArgs > maxArgs))
    throw new CLSyntaxError("Expected between " + minArgs + " and " + maxArgs + " arguments, received " + numArgs);
};


function getNumChannels(descriptor)
{
  switch (descriptor.channelOrder)
  {
  case ocl_const.CL_R:
  case ocl_const.CL_A:
  case ocl_const.CL_INTENSITY:
  case ocl_const.CL_LUMINANCE:
    return 1;

  case ocl_const.CL_Rx:
  case ocl_const.CL_RG:
  case ocl_const.CL_RA:
    return 2;

  case ocl_const.CL_RGx:
  case ocl_const.CL_RGB:
    return 3;

  case ocl_const.CL_RGBx:
  case ocl_const.CL_RGBA:
  case ocl_const.CL_ARGB:
  case ocl_const.CL_BGRA:
    return 4;

  default:
    return undefined;
  };
}

function getBytesPerElement(descriptor)
{
  switch (descriptor.channelType)
  {
  case ocl_const.CL_SNORM_INT8:
  case ocl_const.CL_UNORM_INT8:
  case ocl_const.CL_SIGNED_INT8:
  case ocl_const.CL_UNSIGNED_INT8:
    return 1;

  case ocl_const.CL_SNORM_INT16:
  case ocl_const.CL_UNORM_INT16:
  case ocl_const.CL_SIGNED_INT16:
  case ocl_const.CL_UNSIGNED_INT16:
  case ocl_const.CL_HALF_FLOAT:
    return 2;

  case ocl_const.CL_SIGNED_INT32:
  case ocl_const.CL_UNSIGNED_INT32:
  case ocl_const.CL_FLOAT:
    return 4;

  case ocl_const.CL_UNORM_SHORT_565:
  case ocl_const.CL_UNORM_SHORT_555:
    return 2;

  case ocl_const.CL_UNORM_INT_101010:
    return 4;

  default:
    return undefined;
  };
}

function getBytesPerPixel(descriptor)
{
  var numChannels = getNumChannels(descriptor);

  if (numChannels === undefined)
    return undefined;

  switch (descriptor.channelType)
  {
  case ocl_const.CL_SNORM_INT8:
  case ocl_const.CL_UNORM_INT8:
  case ocl_const.CL_SIGNED_INT8:
  case ocl_const.CL_UNSIGNED_INT8:
    return 1 * numChannels;

  case ocl_const.CL_SNORM_INT16:
  case ocl_const.CL_UNORM_INT16:
  case ocl_const.CL_SIGNED_INT16:
  case ocl_const.CL_UNSIGNED_INT16:
  case ocl_const.CL_HALF_FLOAT:
    return 2 * numChannels;

  case ocl_const.CL_SIGNED_INT32:
  case ocl_const.CL_UNSIGNED_INT32:
  case ocl_const.CL_FLOAT:
    return 4 * numChannels;

  case ocl_const.CL_UNORM_SHORT_565:
  case ocl_const.CL_UNORM_SHORT_555:
    return 2;

  case ocl_const.CL_UNORM_INT_101010:
    return 4;

  default:
    return undefined;
  };
}

function validatePlatform (obj)        { return validateWrappedOrInternal(obj, Platform) && validateClassName(obj, "Platform"); }
function validateDevice (obj)          { return validateWrappedOrInternal(obj, Device) && validateClassName(obj, "Device"); }
function validateContext (obj)         { return validateWrappedOrInternal(obj, Context) && validateClassName(obj, "Context"); }
function validateQueue (obj)           { return validateWrappedOrInternal(obj, CommandQueue) && validateClassName(obj, "CommandQueue"); }
function validateMemObject( obj)       { return validateBuffer(obj) || validateImage(obj); }
function validateBuffer (obj)          { return validateWrappedOrInternal(obj, MemoryObject) && validateClassName(obj, "Buffer"); }
function validateImage (obj)           { return validateWrappedOrInternal(obj, MemoryObject) && validateClassName(obj, "Image"); }
function validateSampler (obj)         { return validateWrappedOrInternal(obj, Sampler) && validateClassName(obj, "Sampler"); }
function validateProgram (obj)         { return validateWrappedOrInternal(obj, Program) && validateClassName(obj, "Program"); }
function validateKernel (obj)          { return validateWrappedOrInternal(obj, Kernel) && validateClassName(obj, "Kernel"); }
function validateEvent(obj)            { return obj && obj instanceof WEBCLCLASSES.WebCLEvent; }
function validateEventEmpty(obj)       { return obj && obj instanceof WEBCLCLASSES.WebCLEvent && !unwrapInternalOrNull(obj); }
function validateEventPopulated(obj)   { return obj && obj instanceof WEBCLCLASSES.WebCLEvent && !!unwrapInternalOrNull(obj); }
function validateEventNotReleased(obj) { return validateEvent(obj) && validateNotReleased(obj); }

function validateImageDescriptor(obj)
{
  var isObject = validateObject(obj);
  var isRealDescriptor = isObject && (obj instanceof WEBCLCLASSES.WebCLImageDescriptor);
  var hasRequiredFields = isObject && (obj.width !== undefined && obj.height !== undefined);
  return isRealDescriptor || hasRequiredFields;
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

function validateNotReleased (obj)
{
  return !obj.wrappedJSObject || obj.wrappedJSObject._invalid === false;
}

function validateClassName (obj, name)
{
  return (obj && (obj.classDescription === name || obj.classDescription === "WebCL"+name));
}

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
  arr = unray(arr);
  if (arr === undefined || arr === null) return false;

  let buffer = arr.buffer ? unray(arr.buffer) : arr.buffer;

  var hasBuffer = validateObject(arr) && validateObject(buffer);
  var hasLength = hasBuffer && validateNumber(arr.length) && validateNumber(buffer.byteLength);
  var hasAttribs = hasBuffer && validateNumber(arr.BYTES_PER_ELEMENT) && validateNumber(arr.byteOffset);

  return hasLength && hasAttribs;
}

function validateBoolean (b)
{
  return (b !== null) && (typeof(b) === 'boolean');
}

function validateNumber (n)
{
  return (n !== null) && (typeof(n) === 'number') && (!isNaN(+n));
}

function validateInteger (n)
{
  return validateNumber(n) && (Math.floor(n) === n);
}

function validatePositiveInt32 (n)
{
  return validateInteger(n) && (n >= 1) && (n <= 0xffffffff);
}

function validateNonNegativeInt32 (n)
{
  return validateInteger(n) && (n >= 0) && (n <= 0xffffffff);
}

function validateObject (o)
{
  return (o !== null) && (typeof(o) === 'object');
}

function validateString (str)
{
  return (typeof(str) === 'string' && str.length > 0);
}

function validateBitfield (bitfield, validMask)
{
  return validateInteger(bitfield) && (bitfield & ~validMask) === 0;
}

function validateMemFlags (memFlags)
{
  return (memFlags === ocl_const.CL_MEM_READ_WRITE ||
          memFlags === ocl_const.CL_MEM_WRITE_ONLY ||
          memFlags === ocl_const.CL_MEM_READ_ONLY);
}

function validateBuildOptions (options, validOptions)
{
  // First validate (and strip off) options of the form "-D foo=bar" and "-D foo".
  // TODO: Standardize the rules for acceptable -D options. Numeric values only?
  //
  var regex = /-D [A-Za-z]\w*(=[+\-]?\w*[\.]?\w+([+\-]?\d+[f]?)?)?/g;
  options = options.replace(regex, "", "g");

  // Then validate the remaining options against the given list of valid options.
  // Note that the empty string is also accepted.
  //
  var strings = options.split(" ");
  for (var i=0; i < strings.length; i++) {
    if (strings[i].length > 0 && validOptions.indexOf(strings[i]) === -1) {
      return false;
    }
  }
  return true;
}

function validateImageFormat (descriptor)
{
  return validateImageChannelOrder(descriptor) &&
    validateImageChannelType(descriptor) &&
    (function() {
      switch (descriptor.channelType) {
      case ocl_const.CL_UNORM_SHORT_565:
      case ocl_const.CL_UNORM_SHORT_555:
      case ocl_const.CL_UNORM_INT_101010:
        return descriptor.channelOrder === ocl_const.CL_RGB;
      default:
        return true;
      }
    })();
}

function validateImageChannelOrder (descriptor)
{
  return validatePositiveInt32(descriptor.channelOrder) && (getNumChannels(descriptor) !== undefined);
}

function validateImageChannelType (descriptor)
{
  return validatePositiveInt32(descriptor.channelType) && (getBytesPerElement(descriptor) !== undefined);
}

function defaultTo (value, defaultIfUndefined)
{
  return (value !== undefined) ? value : defaultIfUndefined;
}

function validateEventWaitList (eventWaitList, isBlocking, allowNullArray, allowEmptyArray, queueContext)
{
  if (eventWaitList === null && allowNullArray === true)
    return;

  if (eventWaitList === null && allowNullArray === false)
    throw new TypeError("eventWaitList must be an Array; was null");

  if (!Array.isArray(eventWaitList))
    throw new TypeError("eventWaitList must be an Array; was typeof " + typeof(eventWaitList));

  if (eventWaitList.length === 0 && allowEmptyArray === false)
    throw new INVALID_VALUE("eventWaitList must be a non-empty Array; was empty");

  eventWaitList.forEach(function(event, i) {

    if (!webclutils.validateEvent(event))
      throw new INVALID_EVENT_WAIT_LIST("eventWaitList must only contain valid events; eventWaitList["+i+"] was ", event);

    if (!webclutils.validateEventNotReleased(event))
      throw new INVALID_EVENT_WAIT_LIST("eventWaitList must only contain valid events; eventWaitList["+i+"] was already released");

    if (!webclutils.validateEventPopulated(event))
      throw new INVALID_EVENT_WAIT_LIST("eventWaitList must only contain populated events; " +
                                        "eventWaitList["+i+"] was still empty");

    let isUserEvent = event instanceof WEBCLCLASSES.WebCLUserEvent;
    let execStatus = event.getInfo(ocl_info.CL_EVENT_COMMAND_EXECUTION_STATUS);
    var ctx = (i===0) ? event.getInfo(ocl_info.CL_EVENT_CONTEXT) : ctx;

    if (isBlocking && isUserEvent)
      throw new INVALID_EVENT_WAIT_LIST("on a blocking call, eventWaitList must not contain user events; " +
                                        "eventWaitList["+i+"] was a user event");

    if (isBlocking && execStatus < 0)
      throw new EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST("on a blocking call, all events in eventWaitList must have non-negative " +
                                                          "execution status; eventWaitList["+i+"] had the status " + execStatus);

    if (isUserEvent && execStatus < 0)
      throw new EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST("eventWaitList must not contain user events with negative execution status; " +
                                                          "eventWaitList["+i+"] had the status " + execStatus);

    if (queueContext && ctx !== queueContext)
      throw new INVALID_CONTEXT("eventWaitList["+i+"] did not have the same Context as this WebCLCommandQueue");

    if (!queueContext && ctx !== event.getInfo(ocl_info.CL_EVENT_CONTEXT))
      throw new INVALID_CONTEXT("eventWaitList["+i+"] did not have the same Context as eventWaitList[0]");

  });

}



var webclutils = {
  getPref_allowed:              getPref_allowed,
  setPref_allowed:              setPref_allowed,
  setPrefObserver_allowed:      setPrefObserver_allowed,
  getPref_openclLib:            getPref_openclLib,
  setPrefObserver_openclLib:    setPrefObserver_openclLib,

  getPref_validatorEnabled:     getPref_validatorEnabled,
  setPrefObserver_validatorEnabled: setPrefObserver_validatorEnabled,

  // Preference ids
  PREF_WEBCL_ALLOWED:           PREF_WEBCL_ALLOWED,
  PREF_OCLLIB:                  PREF_OCLLIB,
  PREF_VALIDATOR_ENABLED:       PREF_VALIDATOR_ENABLED,

  // Preference values
  PREF_WEBCL_ALLOWED__NOT_SET:  PREF_WEBCL_ALLOWED__NOT_SET,
  PREF_WEBCL_ALLOWED__FALSE:    PREF_WEBCL_ALLOWED__FALSE,
  PREF_WEBCL_ALLOWED__TRUE:     PREF_WEBCL_ALLOWED__TRUE,

  generateIdentity:             generateIdentity,

  wrapInternal:                 wrapInternal,
  unwrapInternalOrNull:         unwrapInternalOrNull,
  unwrapInternal:               unwrapInternal,
  convertCLException:           convertCLException,

  unray:                        unray,

  getNumChannels:               getNumChannels,
  getBytesPerPixel:             getBytesPerPixel,

  defaultTo:                    defaultTo,

  validateNumArgs:              validateNumArgs,

  validatePlatform:             validatePlatform,
  validateDevice:               validateDevice,
  validateContext:              validateContext,
  validateQueue:                validateQueue,
  validateBuffer:               validateBuffer,
  validateMemObject:            validateMemObject,
  validateImage:                validateImage,
  validateSampler:              validateSampler,
  validateProgram:              validateProgram,
  validateKernel:               validateKernel,
  validateEvent:                validateEvent,
  validateEventEmpty:           validateEventEmpty,
  validateEventPopulated:       validateEventPopulated,
  validateEventNotReleased:     validateEventNotReleased,
  validateImageDescriptor:      validateImageDescriptor,

  validateArray:                validateArray,
  validateArrayLength:          validateArrayLength,
  validateArrayBufferView:      validateArrayBufferView,
  validateBoolean:              validateBoolean,
  validateNumber:               validateNumber,
  validateInteger:              validateInteger,
  validatePositiveInt32:        validatePositiveInt32,
  validateNonNegativeInt32:     validateNonNegativeInt32,
  validateObject:               validateObject,
  validateString:               validateString,
  validateBitfield:             validateBitfield,
  validateMemFlags:             validateMemFlags,
  validateBuildOptions:         validateBuildOptions,
  validateImageFormat:          validateImageFormat,
  validateImageChannelOrder:    validateImageChannelOrder,
  validateImageChannelType:     validateImageChannelType,
  validateEventWaitList:        validateEventWaitList,
};


} catch(e) { ERROR ("webclutils.jsm: "+e); }
