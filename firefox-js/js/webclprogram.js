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

Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");


var CLASSNAME =  "WebCLProgram";
var CID =        "{74d49a1e-31e0-41d5-8e98-8980a077fcb2}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLProgram;1";


function Program (owner)
{
  if (!this instanceof Program) return new Program ();

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
  //if (!this._owner) throw new Exception ();

  return this._wrapInternal (this._internal.getInfo (name));
};


Program.prototype.getBuildInfo = function (device, name)
{
  TRACE (this, "getBuildInfo", arguments);
  //if (!this._owner) throw new Exception ();

  var clDevice = this._unwrapInternalOrNull (device);
  return this._wrapInternal (this._internal.getBuildInfo (clDevice, name));
};


Program.prototype.build = function (devices, options, fnWhenFinished)
{
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

  this._internal.buildProgram (clDevices, options, callback);
};


Program.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);
  return this._wrapInternal (this._internal.createKernel(kernelName));
};


Program.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);
  return this._wrapInternal (this._internal.createKernelsInProgram());
};


Program.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  this._unregister ();

  this._internal.release ();
  this._internal = null;
};



//------------------------------------------------------------------------------
// Internal functions


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Program]);


} catch(e) { Components.utils.reportError ("program.js: "+EXCEPTIONSTR(e)); }
