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

Cu.import ("resource://nrcwebcl/modules/mixin.jsm");
Cu.import ("resource://nrcwebcl/modules/mixins/securitycheckedcomponent.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");


var CLASSNAME =  "WebCLImageDescriptor";
var CID =        "{8f865901-2efb-422e-bb15-26e0beb0c845}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLImageDescriptor;1";


function WebCLImageDescriptor ()
{
  if (!this instanceof WebCLImageDescriptor) return new WebCLImageDescriptor ();

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLImageDescriptor,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];

  this.channelOrder = ocl_const.CL_RGBA;
  this.channelType = ocl_const.CL_UNORM_INT8;
  this.width = 0;
  this.height = 0;
  this.rowPitch = 0;
}


WebCLImageDescriptor.prototype = {
  classDescription: CLASSNAME,
  classID:          Components.ID(CID),
  contractID:       CONTRACTID,
  QueryInterface:   XPCOMUtils.generateQI ([ Ci.IWebCLImageDescriptor,
                                             Ci.nsISecurityCheckedComponent,
                                             Ci.nsISupportsWeakReference,
                                             Ci.nsIClassInfo
                                           ])
};

addMixin (WebCLImageDescriptor.prototype, SecurityCheckedComponentMixin);


WebCLImageDescriptor.prototype.getInterfaces = function (count)
{
  var interfaces = this._interfaces;
  if (!interfaces || !Array.isArray(interfaces))
  {
    interfaces = [];
  }

  count.value = interfaces.length;
  return interfaces;
};


var NSGetFactory = XPCOMUtils.generateNSGetFactory ([WebCLImageDescriptor]);


} catch(e) { Components.utils.reportError ("webclimagedescriptor.js: "+EXCEPTIONSTR(e)); }
