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
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

var CLASSNAME =  "WebCLImageDescriptor";
var CID =        "{8f865901-2efb-422e-bb15-26e0beb0c845}";
var CONTRACTID = "@webcl.nokiaresearch.com/IWebCLImageDescriptor;1";


function ImageDescriptor ()
{
  TRACE (this, "ImageDescriptor", arguments);

  if (!(this instanceof ImageDescriptor)) return new ImageDescriptor ();

  Base.apply(this);

  this.wrappedJSObject = this;

  this._interfaces = [ Ci.IWebCLImageDescriptor,
                       Ci.nsISecurityCheckedComponent,
                       Ci.nsISupportsWeakReference,
                       Ci.nsIClassInfo,
                       Ci.nsISupports
                     ];
}


ImageDescriptor.prototype = Object.create (Base.prototype);


ImageDescriptor.prototype.classDescription = CLASSNAME;
ImageDescriptor.prototype.classID =          Components.ID(CID);
ImageDescriptor.prototype.contractID =       CONTRACTID;
ImageDescriptor.prototype.QueryInterface =   XPCOMUtils.generateQI ([ Ci.IWebCLImageDescriptor,
                                                                      Ci.nsISecurityCheckedComponent,
                                                                      Ci.nsISupportsWeakReference,
                                                                      Ci.nsIClassInfo
                                                                    ]);


//------------------------------------------------------------------------------
// IWebCLImageDescriptor

ImageDescriptor.prototype.channelOrder = ocl_const.CL_RGBA;
ImageDescriptor.prototype.channelType = ocl_const.CL_UNORM_INT8;
ImageDescriptor.prototype.width = 0;
ImageDescriptor.prototype.height = 0;
ImageDescriptor.prototype.rowPitch = 0;


//------------------------------------------------------------------------------
// Internal functions

var NSGetFactory = XPCOMUtils.generateNSGetFactory ([ImageDescriptor]);

} catch(e) { ERROR ("webclimagedescriptor.js: "+EXCEPTIONSTR(e)); }
