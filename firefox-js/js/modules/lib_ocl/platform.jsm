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


var EXPORTED_SYMBOLS = [ "Platform" ];


try {

const Cu = Components.utils;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_types.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

function loadLazyModules ()
{
  Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");

  Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("platform.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function Platform (internal, lib)
{
  if (!(this instanceof Platform)) return new Platform (internal);
  loadLazyModules ();

  this.classDescription = "Platform";
  TRACE (this, "Platform", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


Platform.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


Platform.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      case ocl_info.CL_PLATFORM_PROFILE:
      case ocl_info.CL_PLATFORM_VERSION:
      case ocl_info.CL_PLATFORM_NAME:
      case ocl_info.CL_PLATFORM_VENDOR:
      case ocl_info.CL_PLATFORM_EXTENSIONS:
        rv = getInfo_string (this._lib.clGetPlatformInfo, this._internal, name);
        break;
      default:
        throw new CLUnsupportedInfo (name, null, "Platform");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Platform.getInfo";
    }
    throw e;
  }

  return rv;
};


Platform.prototype.getDevices = function (deviceType)
{
  TRACE (this, "getDevices", arguments);

  if (deviceType === undefined)
  {
    deviceType = ocl_const.CL_DEVICE_TYPE_ALL;
  }

  if (deviceType !== ocl_const.CL_DEVICE_TYPE_ALL && 
     deviceType !== ocl_const.CL_DEVICE_TYPE_DEFAULT &&
     deviceType !== ocl_const.CL_DEVICE_TYPE_CPU &&
     deviceType !== ocl_const.CL_DEVICE_TYPE_GPU &&
     deviceType !== ocl_const.CL_DEVICE_TYPE_ACCELERATOR) 
  {
    throw new CLError(ocl_const.CL_INVALID_DEVICE_TYPE, null, "Platform.getDevices");
  }

  var n = new T.cl_uint (0);
  var err = 0;
  err = this._lib.clGetDeviceIDs (this._internal, deviceType, 0, null, n.address());
  if (err) throw new CLError (err, null, "Platform.getDevices");

  var val = T.cl_device_id.array (n.value)();
  err = this._lib.clGetDeviceIDs (this._internal, deviceType, n.value, val.addressOfElement(0), null);
  if (err) throw new CLError (err, null, "Platform.getDevices");

  var rv = [];
  for (var i = 0; i < val.length; ++i)
  {
    var p = new Device (val[i]);
    p._lib = this._lib;
    rv.push (p);
  }
  return rv;
};


} catch (e) { ERROR ("platform.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
