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


var EXPORTED_SYMBOLS = [ "Sampler" ];


try {

const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_symbols.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_getinfo.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

function loadLazyModules ()
{
  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/context.jsm");

  Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_common.jsm");
}


} catch(e) { ERROR ("sampler.jsm failed to load modules: " + EXCEPTIONSTR(e) + "."); throw e; }
try {


function Sampler (internal, lib)
{
  if (!(this instanceof Sampler)) return new Sampler (internal);
  loadLazyModules ();

  this.classDescription = "Sampler";
  TRACE (this, "Sampler", arguments);

  this._internal = internal || null;
  this._lib = lib || null;
}


Sampler.prototype.getIdentity = function ()
{
  TRACE (this, "getIdentity", arguments);
  return ocl_common.getObjectIdentity (this);
}


Sampler.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  var rv;

  try
  {
    switch (name)
    {
      // cl_uint
      case ocl_info.CL_SAMPLER_REFERENCE_COUNT:
      case ocl_info.CL_SAMPLER_ADDRESSING_MODE: // cl_adressing_mode
      case ocl_info.CL_SAMPLER_FILTER_MODE: // cl_filter_mode
        rv = getInfo_plain (this._lib.clGetSamplerInfo, this._internal, name, T.cl_uint).value;
        break;

      // cl_context
      case ocl_info.CL_SAMPLER_CONTEXT:
        var p = getInfo_plain (this._lib.clGetSamplerInfo, this._internal, name, T.cl_context);
        rv = new Context (p, this._lib);
        break;

      // cl_bool
      case ocl_info.CL_SAMPLER_NORMALIZED_COORDS:
        return !!getInfo_plain (this._lib.clGetSamplerInfo, this._internal, name, T.cl_bool).value;
        break;

      default:
        throw new CLUnsupportedInfo (name, null, "Sampler.getInfo");
    }
  }
  catch (e)
  {
    if (e instanceof CLException)
    {
      e.context = "Sampler.getInfo";
    }
    throw e;
  }

  return rv;
};


Sampler.prototype.retain = function ()
{
  TRACE (this, "retain", arguments);

  var err = this._lib.clRetainSampler (this._internal);
  if (err) throw new CLError (err, null, "Sampler.retain");
};


Sampler.prototype.release = function ()
{
  TRACE (this, "release", arguments);

  var err = this._lib.clReleaseSampler (this._internal);
  if (err) throw new CLError (err, null, "Sampler.release");
};


} catch (e) { ERROR ("sampler.jsm: " + EXCEPTIONSTR(e) + "."); throw e; }
