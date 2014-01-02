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

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

var CLASSNAME =  "WebCLKernel";
var CID =        "{5d1be1d7-aad2-4eb3-918b-e9551079d634}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLKernel;1";


function Kernel (owner)
{
  if (!this instanceof Kernel) return new Kernel ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLKernel,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


Kernel.prototype = Object.create (Base.prototype);


Kernel.prototype.classDescription = CLASSNAME;
Kernel.prototype.classID =          Components.ID(CID);
Kernel.prototype.contractID =       CONTRACTID;
Kernel.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLKernel,
                                                             Ci.nsISecurityCheckedComponent,
                                                             Ci.nsISupportsWeakReference,
                                                             Ci.nsIClassInfo
                                                           ]);


//------------------------------------------------------------------------------
// IWebCLKernel

Kernel.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

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


Kernel.prototype.getWorkGroupInfo = function (device, name)
{
  TRACE (this, "getWorkGroupInfo", arguments);

  try
  {
    var clDevice = this._unwrapInternalOrNull (device);

    return this._wrapInternal (this._internal.getWorkGroupInfo (clDevice, name));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Kernel.prototype.getArgInfo = function ()
{
  TRACE (this, "getArgInfo", arguments);

  try
  {
    throw new Exception ("NOT IMPLEMENTED");
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Kernel.prototype.setArg = function (index, value)
{
  TRACE (this, "setArg", arguments);

  try
  {
    // Handle arguments with local address space qualifier.
    // The number of bytes allocated is set using Uint32Array of length 1.
    // As we don't have getArgInfo we'll just test any such argument by treating
    // them initially as local arg and hope that CL driver fails that if they
    // weren't.
    try {
      if (value && typeof(value) == "object")
      {
        let re = /\[object (\w*)\]/.exec(Object.prototype.toString.call(value));
        if (re && re[1] && re[1] == "Uint32Array" && value.length == 1)
        {
          DEBUG ("Kernel.setArg: Possible local arg detected, index="+index+" size="+value[0]+".");
          this._internal.setArg (+index, +(value[0]));

          // setArg didn't fail so arg seems to have been local.
          return;
        }
      }
    } catch(e) {}

    this._internal.setArg (+index, this._unwrapInternal (value));
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


Kernel.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  try
  {
    this._unregister ();

    this._internal.release ();
    this._internal = null;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



//------------------------------------------------------------------------------
// Internal functions


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Kernel]);


} catch(e) { ERROR ("webclkernel.js: "+EXCEPTIONSTR(e)); }
