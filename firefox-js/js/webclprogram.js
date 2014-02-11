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

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");


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
}


Program.prototype = Object.create (Base.prototype);


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
    return this._wrapInternal (this._internal.getInfo (name));
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
    var clDevice = this._unwrapInternalOrNull (device);
    return this._wrapInternal (this._internal.getBuildInfo (clDevice, name));
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


Program.prototype.build = function (devices, options, fnWhenFinished)
{
  TRACE (this, "build", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    if (!devices)
    {
      ERROR("WebCLProgram.build: 'devices === null' is not yet supported.")
    }

    if (devices.length === 0)
    {
      ERROR("WebCLProgram.build: 'devices === []' is not yet supported.")
    }

    if (!Array.isArray(devices))
    {
      ERROR("WebCLProgram.build: 'devices' must be an Array or null.")
    }

    var clDevices = [];
    for (var i = 0; i < devices.length; ++i)
    {
      var p = this._unwrapInternalOrNull (devices[i]);
      if (p && p instanceof Device)
      {
        clDevices.push (p);
      }
      else { ERROR("Program.build: invalid device at index " + i); /* TODO: INVALID DEVICE */ }
    }

    var callback = null;
    if (fnWhenFinished && typeof(fnWhenFinished) == "function")
    {
      // TODO: PROPER WEBCL CALLBACK!
      // TODO: THIS IS LIKELY TO BE TOTALLY UNSAFE!
      callback = fnWhenFinished;
    }

    this._internal.buildProgram (clDevices, options || "", callback);
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Program.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    return this._wrapInternal (this._internal.createKernel(kernelName));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Program.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);
  if(!this._ensureValidObject ()) throw new CLInvalidated();

  try
  {
    return this._wrapInternal (this._internal.createKernelsInProgram());
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//------------------------------------------------------------------------------
// Internal functions


Program.prototype._getRefCount = function ()
{
  try
  {
    if (this._internal && !this._invalid)
    {
      return this._internal.getInfo (ocl_info.CL_PROGRAM_REFERENCE_COUNT);
    }
    else
    {
      return 0;
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Program]);


} catch(e) { ERROR ("webclprogram.js: "+EXCEPTIONSTR(e)); }
