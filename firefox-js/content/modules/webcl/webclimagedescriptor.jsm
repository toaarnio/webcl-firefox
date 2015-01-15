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

var EXPORTED_SYMBOLS = [ "WebCLImageDescriptor" ];


try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;


Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webclutils.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/base.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/webclclasses.jsm");


function WebCLImageDescriptor ()
{
  TRACE (this, "WebCLImageDescriptor", arguments);
  try {
    if (!(this instanceof WebCLImageDescriptor)) return new WebCLImageDescriptor ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.__exposedProps__ =
    {
      channelOrder: "rw",
      channelType: "rw",
      width: "rw",
      height: "rw",
      rowPitch: "rw",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclimagedescriptor.jsm:WebCLImageDescriptor failed: " + e);
    throw e;
  }
}

WEBCLCLASSES.WebCLImageDescriptor = WebCLImageDescriptor;
WebCLImageDescriptor.prototype = Object.create (Base.prototype);
WebCLImageDescriptor.prototype.classDescription = "WebCLImageDescriptor";


WebCLImageDescriptor.prototype.channelOrder = ocl_const.CL_RGBA;
WebCLImageDescriptor.prototype.channelType = ocl_const.CL_UNORM_INT8;
WebCLImageDescriptor.prototype.width = 0;
WebCLImageDescriptor.prototype.height = 0;
WebCLImageDescriptor.prototype.rowPitch = 0;


} catch(e) { ERROR ("webclimagedescriptor.jsm: "+e); }
