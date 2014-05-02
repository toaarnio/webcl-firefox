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

var EXPORTED_SYMBOLS = [ "WebCLKernel" ];


try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


function WebCLKernel ()
{
  TRACE (this, "WebCLKernel", arguments);
  try {
    if (!(this instanceof WebCLKernel)) return new WebCLKernel ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_KERNEL;

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getInfo: "r",
      getWorkGroupInfo: "r",
      getArgInfo: "r",
      setArg: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclkernel.jsm:WebCLKernel failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLKernel = WebCLKernel;
WebCLKernel.prototype = Object.create (Base.prototype);
WebCLKernel.prototype.classDescription = "WebCLKernel";



WebCLKernel.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
    case ocl_info.CL_KERNEL_FUNCTION_NAME:
    case ocl_info.CL_KERNEL_NUM_ARGS:
    case ocl_info.CL_KERNEL_CONTEXT:
    case ocl_info.CL_KERNEL_PROGRAM:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);

    default:
      throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLKernel.prototype.getWorkGroupInfo = function (device, name)
{
  TRACE (this, "getWorkGroupInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2);

    if (!webclutils.validateDevice(device))
      throw new INVALID_DEVICE("'device' must be a valid WebCLDevice; was ", device);

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
    case ocl_info.CL_KERNEL_WORK_GROUP_SIZE:
    case ocl_info.CL_KERNEL_COMPILE_WORK_GROUP_SIZE:
    case ocl_info.CL_KERNEL_LOCAL_MEM_SIZE:
    case ocl_info.CL_KERNEL_PREFERRED_WORK_GROUP_SIZE_MULTIPLE:
    case ocl_info.CL_KERNEL_PRIVATE_MEM_SIZE:
      var clDevice = this._unwrapInternalOrNull (device);
      var clInfoItem = this._internal.getWorkGroupInfo (clDevice, name);
      return this._wrapInternal (clInfoItem);

    default:
      throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLKernel.prototype.getArgInfo = function ()
{
  TRACE (this, "getArgInfo", arguments);

  try
  {
    this._ensureValidObject();

    throw new Exception ("NOT IMPLEMENTED");
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLKernel.prototype.setArg = function (index, value)
{
  TRACE (this, "setArg", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2);

    if (!webclutils.validateNonNegativeInt32(index))
      throw new INVALID_ARG_INDEX("'index' must be a non-negative integer; was ", index);

    if (index >= (numArgs = this.getInfo(ocl_info.CL_KERNEL_NUM_ARGS)))
      throw new INVALID_ARG_INDEX("'index' must be at most "+(numArgs-1)+" for this kernel; was ", index);

    if (webclutils.validateMemObject(value))
      if (this.getInfo(ocl_info.CL_KERNEL_CONTEXT) !== value.getInfo(ocl_info.CL_MEM_CONTEXT))
        throw new INVALID_CONTEXT("the given WebCLMemoryObject and this WebCLKernel must have the same WebCLContext");

    if (webclutils.validateArrayBufferView(value) &&
        !(value.length === 1 || value.length === 2 || value.length === 4 ||
          value.length === 8 || value.length === 16 || value.length === 32))
      throw new INVALID_ARG_SIZE("the given ArrayBufferView must have a length of 1, 2, 4, 8, 16, or 32; was ", value.length);

    if (!webclutils.validateMemObject(value) &&
        !webclutils.validateSampler(value) &&
        !webclutils.validateArrayBufferView(value))
      throw new INVALID_ARG_VALUE("'value' must be a Buffer, Image, Sampler or ArrayBufferView; was ", value);

    // Handle arguments with local address space qualifier.
    // The number of bytes allocated is set using Uint32Array of length 1.
    // As we don't have getArgInfo we'll just test any such argument by treating
    // them initially as local arg and hope that CL driver fails that if they
    // weren't.
    try {
      if (value && typeof(value) == "object")
      {
        let re = /\[object (\w*)\]/.exec(Object.prototype.toString.call(value));
        if (re && re[1] && re[1] == "Uint32Array" && value.length == 1 && value[0] > 0)
        {
          DEBUG ("WebCLKernel.setArg: Possible local arg detected, index="+index+" size="+value[0]+".");
          this._internal.setArg (index, value[0]);

          // setArg didn't fail so arg seems to have been local.
          return;
        }
      }
    } catch(e) {}

    this._internal.setArg (index, this._unwrapInternal (value));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



} catch(e) { ERROR ("webclkernel.jsm: "+e); }
