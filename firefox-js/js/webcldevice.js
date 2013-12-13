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


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");
Cu.import ("resource://nrcwebcl/modules/base.jsm");


try {


var CLASSNAME =  "WebCLDevice";
var CID =        "{f5352722-9a35-405b-95ae-54d5b4995576}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLDevice;1";


function Device (owner)
{
  if (!this instanceof Device) return new Device ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLDevice,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}

Device.prototype = Object.create (Base.prototype);

Device.prototype.classDescription = CLASSNAME;
Device.prototype.classID =          Components.ID(CID);
Device.prototype.contractID =       CONTRACTID;
Device.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLDevice,
                                                             Ci.nsISecurityCheckedComponent,
                                                             Ci.nsISupportsWeakReference,
                                                             Ci.nsIClassInfo
                                                           ]);


//------------------------------------------------------------------------------
// IWebCLDevice


Device.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  if (!this._owner) throw new Exception ();

  return this._wrapInternal (this._internal.getInfo (name));
};


Device.prototype.getSupportedExtensions = function ()
{
  TRACE (this, "getSupportedExtensions", arguments);
  // TODO!
  return [];
};


Device.prototype.enableExtension = function (extensionName)
{
  TRACE (this, "enableExtension", arguments);
  // TODO;
  return false;
};


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([Device]);


} catch(e) { ERROR ("device.js: "+e); throw e; }
