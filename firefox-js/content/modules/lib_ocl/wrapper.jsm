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


var EXPORTED_SYMBOLS = [ "LibOCLWrapper" ];


try
{
  try
  {
    const Cu = Components.utils;

    Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
    Cu.import ("resource://gre/modules/ctypes.jsm");
    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_libloader.jsm");
    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");
    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_symbols.jsm");
    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");

    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/platform.jsm");
    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/device.jsm");
    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/context.jsm");
    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/event.jsm");

    Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

  } catch(e) { ERROR ("wrapper.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }


function LibOCLWrapper (libName)
{
  if (!(this instanceof LibOCLWrapper)) return new LibOCLWrapper(libName);

  this.classDescription = "OpenCLWrapper";

  this._libName = libName;
  this._lib = OCLLibraryInstance.loadLibrary (this._libName);
}


// Converts the given context properties array to native OpenCL format.
//
function convertContextPropertiesArray(properties)
{
  var clProps = null;

  if (properties !== null) {

    if (!Array.isArray(properties))
      throw new CLInvalidArgument ("properties", null, "createContext");

    clProps = T.cl_context_properties.array(properties.length + 1)();
    
    var i;
    for (i = 0; i < properties.length; ++i)
    {
      if (i > 0 && ctypes.cast(clProps[i-1], ctypes.int).value == ocl_const.CL_CONTEXT_PLATFORM)
      {
        if (!(properties[i] instanceof Platform))
          throw new CLInvalidArgument ("properties", "Invalid platform object at index " + i + " on ", "createContext");

        clProps[i] = ctypes.cast(properties[i]._internal, ctypes.int.ptr);
      }
      else
      {
        ctypes.cast(clProps[i], ctypes.int).value = properties[i];
      }
    }
    ctypes.cast(clProps[i], ctypes.int).value = 0;
  }

  return clProps ? ctypes.cast (clProps.address(), T.cl_context_properties.ptr) : null;
};


// Converts the given Device array to native OpenCL format.
//
function convertDeviceArray(devices)
{
  if (!Array.isArray(devices))
    throw new CLInvalidArgument ("devices", null, "createContext");

  var clDevs = T.cl_device_id.array(devices.length)();

  for (var i=0; i < devices.length; ++i) 
  {
    if (!(devices[i] instanceof Device))
      throw new CLInvalidArgument ("devices", "Invalid device object at index " + i + " on ", "createContext");

    clDevs[i] = devices[i]._internal;
  }

  return ctypes.cast (clDevs.address(), T.cl_device_id.ptr);
};


LibOCLWrapper.prototype.destroy = function ()
{
  if (this._lib)
  {
    this._lib.unload ();
  }
};


LibOCLWrapper.prototype.getPlatforms = function ()
{
  TRACE (this, "getPlatforms", arguments);

  var n = new T.cl_uint (0);
  var err = 0;
  err = this._lib.clGetPlatformIDs (0, null, n.address());
  if (err) throw new CLError (err, null, "Context.getPlatforms");

  var values = T.cl_platform_id.array(n.value)();
  err = this._lib.clGetPlatformIDs (n.value,
                                    ctypes.cast (values.address(), T.cl_platform_id.ptr),
                                    null);
  if (err) throw new CLError (err, null, "Context.getPlatforms");

  var result = [];
  for (var i = 0; i < values.length; ++i)
  {
    result.push (new Platform (values[i], this._lib));
  }

  return result;
};

LibOCLWrapper.prototype.createContext = function (properties, devices, callback, userData)
{
  TRACE (this, "createContext", arguments);

  var clErr = new T.cl_int (0);
  var clContext = new T.cl_context ();
  clContext.value = this._lib.clCreateContext (
    convertContextPropertiesArray(properties),
    devices.length,
    convertDeviceArray(devices),
    callback || null,
    null,               // TODO: USERDATA NOT IMPLEMENTED!
    clErr.address());

  if (clErr.value) throw new CLError (clErr.value, null, "createContext");

  return new Context (clContext, this._lib);
};


LibOCLWrapper.prototype.createContextFromType = function (properties, deviceType, callback, userData)
{
  TRACE (this, "createContextFromType", arguments);

  var clErr = new T.cl_int (0);
  var clContext = new T.cl_context ();
  clContext.value = this._lib.clCreateContextFromType (
    convertContextPropertiesArray(properties),
    +deviceType,
    callback || null,
    null,               // TODO: USERDATA NOT IMPLEMENTED!
    clErr.address());

  if (clErr.value) throw new CLError (clErr.value, null, "createContextFromType");

  return new Context (clContext, this._lib);
};


LibOCLWrapper.prototype.waitForEvents = function (eventList)
{
  TRACE (this, "waitForEvents", arguments);

  if (!Array.isArray(eventList)) throw new CLInvalidArgument ("eventList", null, "waitForEvents");

  var values = T.cl_event.array(eventList.length)();

  for (var i = 0; i < eventList.length; ++i)
  {
    if (!(eventList[i] instanceof CLEvent))
    {
      throw new CLInvalidArgument ("eventList", "Invalid event object at index " + i + " on ", "waitForEvents");
    }

    values[i] = eventList[i]._internal;
  }

  var err = this._lib.clWaitForEvents (values.length,
                                       ctypes.cast (values.address(), T.cl_event.ptr));
  if (err) throw new CLError (err, null, "waitForEvents");
};


LibOCLWrapper.prototype.unloadCompiler = function ()
{
  TRACE (this, "unloadCompiler", arguments);

  var err = this._lib.clUnloadCompiler ();
  if (err) throw new CLError (err, null, "unloadCompiler");
};



} catch (e) { ERROR ("Failed to create OpenCL wrapper: " + EXCEPTIONSTR(e) + "."); throw e; }
