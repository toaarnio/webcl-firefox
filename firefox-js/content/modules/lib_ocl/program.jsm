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


var EXPORTED_SYMBOLS = [ "Program" ];


try {

const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

function loadLazyModules ()
{
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/context.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/device.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/kernel.jsm");

  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("program.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function Program (internal, lib)
{
  if (!(this instanceof Program)) return new Program (internal, lib);
  loadLazyModules ();

  this.classDescription = "Program";
  TRACE (this, "Program", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


Program.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


Program.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_uint
      case ocl_info.CL_PROGRAM_REFERENCE_COUNT:
      case ocl_info.CL_PROGRAM_NUM_DEVICES:
        rv = getInfo_plain (this._lib.clGetProgramInfo, this._internal, name, T.cl_uint).value;
        break;

      // cl_context
      case ocl_info.CL_PROGRAM_CONTEXT:
        var p = getInfo_plain (this._lib.clGetProgramInfo, this._internal, name, T.cl_context);
        rv = new Context (p, this._lib);
        break;

      // [cl_device_id]
      case ocl_info.CL_PROGRAM_DEVICES:
        var val = getInfo_array (this._lib.clGetProgramInfo, this._internal, name, T.cl_device_id);
        rv = [];
        for (var i = 0; i < val.length; ++i)
        {
          var p = new Device (val[i]);
          p._lib = this._lib;
          rv.push (p);
        }
        break;

        // [size_t]
      case ocl_info.CL_PROGRAM_BINARY_SIZES:
        rv = getInfo_array (this._lib.clGetProgramInfo, this._internal, name, T.size_t);
        for (var i in rv) rv[i] = ctypes.UInt64.lo (rv[i]);
        break;

      // string
      case ocl_info.CL_PROGRAM_SOURCE:
        rv = getInfo_string (this._lib.clGetProgramInfo, this._internal, name);
        break;

        // [string]
      case ocl_info.CL_PROGRAM_BINARIES:
        // CL_PROGRAM_BINARIES does not write it's result directly to the target buffer
        // but to an array of pointers to additional buffers of allocated by caller.
        // The sizes of these buffers are queried using CL_PROGRAM_BINARY_SIZES
        try {
          var binarySizes = this.getInfo (ocl_info.CL_PROGRAM_BINARY_SIZES);
          if (!Array.isArray(binarySizes)) throw "Unable to get binary sizes";
          var binaries = ctypes.char.ptr.array(binarySizes.length)();
          for (var i = 0; i < binaries.length; ++i)
          {
            var c = ctypes.char.array (+binarySizes[i]);
            binaries[i] = ctypes.cast (c.address(), ctypes.char.ptr);
          }
          err = fn (internal, name,
                    binaries.constructor.size,
                    ctypes.cast(binaries.address(), ctypes.voidptr_t),
                    null);
          if (err) throw new CLError (err);

          rv = [];
          for (var i = 0; i < binaries.length; ++i)
          {
            if (binaries[i].isNull())
              rv [i] = null;
            else
              rv[i] = binaries[i].readStringReplaceMalformed ();
          }
        }
        catch (e)
        {
          if (!(e instanceof CLError)) e = new CLInternalError (e);
          throw e;
        }

        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Program.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Program.getInfo";
    }
    throw e;
  }

  return rv;
};


Program.prototype.getBuildInfo = function (device, name)
{
  TRACE (this, "getBuildInfo", arguments);

  var rv;

  // TODO: Program.getBuildInfo: validate device

  try
  {
    switch (name)
    {
      // cl_int
      case ocl_info.CL_PROGRAM_BUILD_STATUS:  // cl_build_status
        rv = getInfo_plain (this._lib.clGetProgramBuildInfo, this._internal,
                            name, T.cl_int,
                            device._internal).value;
        break;

      // string
      case ocl_info.CL_PROGRAM_BUILD_OPTIONS:
      case ocl_info.CL_PROGRAM_BUILD_LOG:
        rv = getInfo_string (this._lib.clGetProgramBuildInfo, this._internal,
                             name,
                             device._internal);
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Program.getBuildInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Program.getBuildInfo";
    }
    throw e;
  }

  return rv;
};


// Assumptions:
//  * devices is either null or a pre-validated Array of Device instances
//  * options is either null or a pre-validated String of compiler options
//  * callback is either null or a pre-validated WebCLCallback function
//
Program.prototype.buildProgram = function (devices, options, callback, userData)
{
  TRACE (this, "buildProgram", arguments);

  var clOptions = options || "";

  var clCallback = callback ? T.callback_buildProgram.ptr (function() { callback() }) : null;
  if (clCallback !== null)
    throw new CLError (ocl_errors.CL_INVALID_OPERATION, "program.build() callbacks not implemented yet", "Program.buildProgram");

  if (devices === null)
  {
    var err = this._lib.clBuildProgram (this._internal, 0, null, clOptions, clCallback, null);
    if (err) throw new CLError (err, null, "Program.buildProgram");
  } 
  else 
  {
    var clDeviceList = T.cl_device_id.array(devices.length)();
    for (var i = 0; i < devices.length; ++i)  {
      clDeviceList[i] = devices[i]._internal;
    }
    var err = this._lib.clBuildProgram (this._internal, clDeviceList.length,
                                    ctypes.cast(clDeviceList.address(), T.cl_device_id.ptr),
                                    clOptions, clCallback, null);
    if (err) throw new CLError (err, null, "Program.buildProgram");
  }
};


Program.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);

  if (typeof(kernelName) != "string")
  {
    throw new CLInvalidArgument ("kernelName", null, "Program.createKernel");
  }

  var clErr = new T.cl_int (0);
  var clKernel = this._lib.clCreateKernel (this._internal, kernelName, clErr.address());
  if (clErr.value) throw new CLError (clErr.value, null, "Program.createKernel");

  return new Kernel (clKernel, this._lib);
};


Program.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);

  var numKernels = new T.cl_uint (0);
  var err = this._lib.clCreateKernelsInProgram (this._internal, 0, null, numKernels.address());
  if (err) throw new CLError (err, null, "Program.createKernelsInProgram");

  var clKernelList = T.cl_kernel.array(numKernels.value)();
  var err = this._lib.clCreateKernelsInProgram (this._internal,
                                                numKernels.value,
                                                ctypes.cast(clKernelList.address(), T.cl_kernel.ptr),
                                                null);
  if (err) throw new CLError (err, null, "Program.createKernelsInProgram");

  var rv = [];
  for (var i = 0; i < clKernelList.length; ++i)
  {
    rv.push (new Kernel (clKernelList[i], this._lib));
  }

  return rv;
};


Program.prototype.retain = function ()
{
  TRACE (this, "retain", arguments);

  var err = this._lib.clRetainProgram (this._internal);
  if (err) throw new CLError (err, null, "Program.retain");
};


Program.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  var err = this._lib.clReleaseProgram (this._internal);
  if (err) throw new CLError (err, null, "Program.release");
};




} catch (e) { ERROR ("program.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
