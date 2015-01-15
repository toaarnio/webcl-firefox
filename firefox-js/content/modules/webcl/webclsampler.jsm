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

var EXPORTED_SYMBOLS = [ "WebCLSampler" ];


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


function WebCLSampler ()
{
  TRACE (this, "WebCLSampler", arguments);
  try {
    if (!(this instanceof WebCLSampler)) return new WebCLSampler ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_SAMPLER;

    this.__exposedProps__ =
    {
      getInfo: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclsampler.jsm:WebCLSampler failed: " + e);
    throw e;
  }
}

WEBCLCLASSES.WebCLSampler = WebCLSampler;
WebCLSampler.prototype = Object.create (Base.prototype);
WebCLSampler.prototype.classDescription = "WebCLSampler";



WebCLSampler.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (!webclutils.validatePositiveInt32(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
    case ocl_info.CL_SAMPLER_NORMALIZED_COORDS:
    case ocl_info.CL_SAMPLER_ADDRESSING_MODE:
    case ocl_info.CL_SAMPLER_FILTER_MODE:
    case ocl_info.CL_SAMPLER_CONTEXT:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);

    default:
      throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw e;
  }
};



} catch(e) { ERROR ("webclsampler.jsm: "+e); }
