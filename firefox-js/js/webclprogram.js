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

Cu.import ("resource://nrcwebcl/modules/mixin.jsm");
Cu.import ("resource://nrcwebcl/modules/mixins/owner.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");


var CLASSNAME =  "WebCLProgram";
var CID =        "{74d49a1e-31e0-41d5-8e98-8980a077fcb2}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLProgram;1";


function Program ()
{
  if (!(this instanceof Program)) return new Program ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLProgram,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];

  this._objectRegistry = {};
}


Program.prototype = Object.create (Base.prototype);

addMixin (Program.prototype, OwnerMixin);


Program.prototype.classDescription = CLASSNAME;
Program.prototype.classID =          Components.ID(CID);
Program.prototype.contractID =       CONTRACTID;
Program.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLProgram,
                                                              Ci.nsISecurityCheckedComponent,
                                                              Ci.nsISupportsWeakReference,
                                                              Ci.nsIClassInfo
                                                            ]);


//------------------------------------------------------------------------------
// IWebCLProgram

Program.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLProgram.getInfo");

    switch (name)
    {
    case ocl_info.CL_PROGRAM_NUM_DEVICES:
    case ocl_info.CL_PROGRAM_SOURCE:
    case ocl_info.CL_PROGRAM_CONTEXT:
    case ocl_info.CL_PROGRAM_DEVICES:
      var clInfoItem = this._internal.getInfo (name);
      // Note: no need to acquire ownership
      return this._wrapInternal (clInfoItem);

    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLProgram.getInfo");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Program.prototype.getBuildInfo = function (device, name)
{
  TRACE (this, "getBuildInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateDevice(device))
      throw new CLError(ocl_errors.CL_INVALID_DEVICE, "'device' must be a valid WebCLDevice; was " + device, "WebCLProgram.getBuildInfo");

    if (!webclutils.validateNumber(name))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'name' must be a valid CLenum; was " + name, "WebCLProgram.getBuildInfo");

    switch (name)
    {
    case ocl_info.CL_PROGRAM_BUILD_STATUS:
    case ocl_info.CL_PROGRAM_BUILD_OPTIONS:
    case ocl_info.CL_PROGRAM_BUILD_LOG:
      var clDevice = this._unwrapInternalOrNull (device);
      var clInfoItem = this._internal.getBuildInfo (clDevice, name);
      // Note: no need to acquire ownership
      return this._wrapInternal (clInfoItem);

    default:
      throw new CLError (ocl_errors.CL_INVALID_VALUE, "Unrecognized enum " + name, "WebCLProgram.getBuildInfo");
    }
  }
  catch (e)
  {
    /*
    let d = "device";
    try { d = device.getInfo(ocl_info.CL_DEVICE_NAME); } catch(e2){}
    try { let se = String(e); }catch(e2){}
    DEBUG("Program.getBuildInfo("+d+","+oclInfoToString(name)+"): "+se);
    */

    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Program.prototype.build = function (devices, options, whenFinished)
{
  TRACE (this, "build", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  var validBuildOptions = [
    "-cl-opt-disable",
    "-cl-single-precision-constant",
    "-cl-denorms-are-zero",
    "-cl-mad-enable",
    "-cl-no-signed-zeros",
    "-cl-unsafe-math-optimizations",
    "-cl-finite-math-only",
    "-cl-fast-relaxed-math",
    "-w",
    "-Werror",
  ];

  devices = (devices === undefined) ? null : devices;
  options = (options === undefined) ? null : options;
  whenFinished = (whenFinished === undefined) ? null : whenFinished;

  try
  {
    if (devices !== null && (!Array.isArray(devices) || devices.length === 0))
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "devices", "'devices' must be null or an Array with at least one element; was " + devices);

    if (devices !== null && !webclutils.validateArray(devices, webclutils.validateDevice))
      throw new CLError(ocl_errors.CL_INVALID_DEVICE, "'devices' must only contain instances of WebCLDevice; was " + devices);

    if (options !== null && typeof(options) !== 'string')
      throw new CLError(ocl_errors.CL_INVALID_BUILD_OPTIONS, "invalid build options '"+options+"'");

    if (options !== null && !webclutils.validateBuildOptions(options, validBuildOptions))
      throw new CLError(ocl_errors.CL_INVALID_BUILD_OPTIONS, "invalid build options '"+options+"'");

    if (whenFinished !== null && typeof(whenFinished) !== "function")
      throw new CLError(ocl_errors.CL_INVALID_VALUE, "'whenFinished' must be null or a WebCLCallback function; was " + whenFinished);

    for (var i=0; devices !== null && i < devices.length; i++)
      devices[i] = this._unwrapInternalOrNull(devices[i]);

    // TODO: PROPER WEBCL CALLBACK!
    // TODO: THIS IS LIKELY TO BE TOTALLY UNSAFE!
    this._internal.buildProgram (devices, options, whenFinished);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createKernel(name)._owner == this._owner == [WebCLContext]
//
Program.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!webclutils.validateString(kernelName))
      throw new CLError(ocl_errors.CL_INVALID_KERNEL_NAME, "'kernelName' must be a non-empty string; was " + kernelName);

    // NOTE: Ensure proper memory management on certain platforms by acquiring
    //       ownership of created kernels. This ensures that on releaseAll
    //       kernel's will be released before program.
    return this._wrapInternal (this._internal.createKernel(kernelName), this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createKernelsInProgram()._owner == this._owner == [WebCLContext]
//
Program.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    // NOTE: Ensure proper memory management on certain platforms by acquiring
    //       ownership of created kernels. This ensures that on releaseAll
    //       kernel's will be released before program.
    return this._wrapInternal (this._internal.createKernelsInProgram(), this);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// NOTE: NOT VISIBLE TO XPCOM!
Program.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);
  if(!this._ensureValidObject ()) return;

  try
  {
    this._releaseAllChildren ();

    this._clearRegistry ();

    //this._unregister ();
    this.release ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


//------------------------------------------------------------------------------
// Internal functions


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Program]);


} catch(e) { ERROR ("webclprogram.js: "+EXCEPTIONSTR(e)); }
