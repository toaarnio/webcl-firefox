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

var CLASSNAME =  "WebCLSampler";
var CID =        "{dc9b25aa-2bdc-4efd-b295-b450c75d252c}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLSampler;1";


function Sampler (owner)
{
  if (!this instanceof Sampler) return new Sampler ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLSampler,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


Sampler.prototype = Object.create (Base.prototype);


Sampler.prototype.classDescription = CLASSNAME;
Sampler.prototype.classID =          Components.ID(CID);
Sampler.prototype.contractID =       CONTRACTID;
Sampler.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLSampler,
                                                              Ci.nsISecurityCheckedComponent,
                                                              Ci.nsISupportsWeakReference,
                                                              Ci.nsIClassInfo
                                                            ]);


//------------------------------------------------------------------------------
// IWebCLSampler

Sampler.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  //if (!this._owner) throw new Exception ();

  return this._wrapInternal (this._internal.getInfo (name));
};


Sampler.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  this._unregister ();

  this._internal.release ();
  this._internal = null;
};



//------------------------------------------------------------------------------
// Internal functions


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Sampler]);


} catch(e) { Components.utils.reportError ("sampler.js: "+EXCEPTIONSTR(e)); }
