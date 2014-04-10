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

var EXPORTED_SYMBOLS = [ "WebCLPlatform" ];


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


function WebCLPlatform ()
{
  TRACE (this, "WebCLPlatform", arguments);
  try {
    if (!(this instanceof WebCLPlatform)) return new WebCLPlatform ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getInfo: "r",
      getDevices: "r",
      getSupportedExtensions: "r",
      enableExtension: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclplatform.jsm:WebCLPlatform failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLPlatform = WebCLPlatform;

WebCLPlatform.prototype = Object.create (Base.prototype);

WebCLPlatform.prototype.classDescription = "WebCLPlatform";



WebCLPlatform.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    webclutils.validateNumArgs(arguments.length, 1);

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
      case ocl_info.CL_PLATFORM_PROFILE:                  return "WEBCL_PROFILE";
      case ocl_info.CL_PLATFORM_VERSION:                  return "WebCL 1.0";
      case ocl_info.CL_PLATFORM_NAME:                     break;
      case ocl_info.CL_PLATFORM_VENDOR:                   break;
      case ocl_info.CL_PLATFORM_EXTENSIONS:               break;
      default:
        throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }

    return this._wrapInternal (this._internal.getInfo (name));
  }
  catch (e)
  {
    try { ERROR("webclplatform.jsm:getInfo failed: " + String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// getDevices()[i]._owner == this._owner == [WebCL]
//
WebCLPlatform.prototype.getDevices = function (deviceType)
{
  TRACE (this, "getDevices", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    webclutils.validateNumArgs(arguments.length, 0, 1);
    
    deviceType = (arguments.length === 0) ? ocl_const.CL_DEVICE_TYPE_ALL : deviceType;

    if (!webclutils.validateInteger(deviceType))
      throw new INVALID_DEVICE_TYPE("'deviceType' must be a valid DEVICE_TYPE; was ", deviceType);

    if (deviceType !== ocl_const.CL_DEVICE_TYPE_DEFAULT &&
        deviceType !== ocl_const.CL_DEVICE_TYPE_CPU &&
        deviceType !== ocl_const.CL_DEVICE_TYPE_GPU &&
        deviceType !== ocl_const.CL_DEVICE_TYPE_ACCELERATOR &&
        deviceType !== ocl_const.CL_DEVICE_TYPE_ALL)
      throw new INVALID_DEVICE_TYPE("'deviceType' must be a valid DEVICE_TYPE; was ", deviceType);

    return this._wrapInternal (this._internal.getDevices (deviceType));
  }
  catch (e)
  {
    try { ERROR("webclplatform.jsm:getDevices failed: " + String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLPlatform.prototype.getSupportedExtensions = function ()
{
  TRACE (this, "getSupportedExtensions", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    webclutils.validateNumArgs(arguments.length, 0);

    // TODO WebCLPlatform.getSupportedExtensions
    return [];
  }
  catch (e)
  {
    try { ERROR("webclplatform.jsm:getSupportedExtensions failed: " + String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLPlatform.prototype.enableExtension = function (extensionName)
{
  TRACE (this, "enableExtension", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    webclutils.validateNumArgs(arguments.length, 1);

    // TODO WebCLPlatform.enableExtension
    return false;
  }
  catch (e)
  {
    try { ERROR("webclplatform.jsm:enableExtension failed: " + String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



} catch(e) { ERROR ("webclplatform.jsm: "+e); }
