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

var EXPORTED_SYMBOLS = [ "WebCLValidatedProgram" ];

// Validated program holds source until build without creating an actual
// underlaying OpenCL program. After build works identically to WebCLProgram.
// Validates program source before build.

try {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;

Cu.import ("resource://gre/modules/Services.jsm");
Cu.import ("resource://gre/modules/XPCOMUtils.jsm");
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/webclutils.jsm");

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");
Cu.import ("resource://nrcwebcl/modules/webcl/webclprogram.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/program.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_clv/clv_wrapper.jsm");


function WebCLValidatedProgram ()
{
  TRACE (this, "WebCLValidatedProgram", arguments);
  try {
    if (!(this instanceof WebCLValidatedProgram)) return new WebCLValidatedProgram ();

    WebCLProgram.apply (this);

    this.wrappedJSObject = this;
    this.validatorAvailable = false;

    this._originalSource = "";
    this._internal = null;  // already set in Base, here for clarity!

    this._validatorProgram = null;

    // The owner object is stored in _interimOwner before the instance is promoted
    // to an actual WebCLProgram.
    this._interimOwner = null;

    // Reference to the XPConnect wrapper object.
    this._wrapperInstance = null;

    // __exposedProps__ inherited from WebCLProgram
  }
  catch (e)
  {
    ERROR ("webclvalidatedprogram.jsm:WebCLValidatedProgram: " + e + "\n" + e.stack);
    throw webclutils.convertCLException (e);
  }
}
WEBCLCLASSES.WebCLValidatedProgram = WebCLValidatedProgram;
WebCLValidatedProgram.prototype = Object.create (WebCLProgram.prototype);
WebCLValidatedProgram.prototype.classDescription = "WebCLValidatedProgram";


WebCLValidatedProgram.prototype.setOriginalSource = function (source)
{
  TRACE (this, "setOriginalSource", arguments);

  try
  {
    if (this._internal) throw new Error ("Can't set original source after promotion.");

    this._originalSource = source;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.getOriginalSource = function ()
{
  TRACE (this, "getOriginalSource", arguments);

  try
  {
    return this._originalSource;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.getValidatedSource = function ()
{
  TRACE (this, "getValidatedSource", arguments);

  try
  {
    if (this._internal)
    {
      return WebCLProgram.prototype.getInfo.call (this, ocl_info.CL_PROGRAM_SOURCE);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.promoteToWebCLProgram = function (internal, // lib_ocl internal object
                                                                  owner)    // [optional] owning object
{
  TRACE (this, "promoteToWebCLProgram", arguments);

  try
  {
    if (!internal || !(internal instanceof Program))
    {
      throw new Error ("WebCLValidatedProgram.promoteToWebCLProgram: tried to promote using something other than Program: " +
                       String(internal) + ".");
    }

    this._internal = internal;
    this._identity = internal.getIdentity ();

    if (owner) this._interimOwner = owner;
    this._interimOwner._registerObject (this._wrapperInstance);

    // Clear unneeded propreties
    this._interimOwner = null;
    this._wrapperInstance = null;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    if (this._internal)
    {
      // Return original source as program source
      if (name == ocl_info.CL_PROGRAM_SOURCE)
      {
        return this._originalSource;
      }
      else
      {
        return WebCLProgram.prototype.getInfo.call (this, name);
      }
    }
    else
    {
      webclutils.validateNumArgs(arguments.length, 1);

      if (!webclutils.validateInteger(name))
        throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

      // Return synthetic infos
      switch (name)
      {
        case ocl_info.CL_PROGRAM_NUM_DEVICES:
          return (this._interimOwner ? this._interimOwner.getInfo(ocl_info.CL_CONTEXT_NUM_DEVICES) : null);

        case ocl_info.CL_PROGRAM_SOURCE:
          return this._originalSource;

        case ocl_info.CL_PROGRAM_CONTEXT:
          return this._interimOwner;

        case ocl_info.CL_PROGRAM_DEVICES:
          return (this._interimOwner ? this._interimOwner.getInfo(ocl_info.CL_CONTEXT_DEVICES) : null);

        default:
          throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
      }
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.getBuildInfo = function (device, name)
{
  TRACE (this, "getBuildInfo", arguments);

  try
  {
    if (this._internal)
    {
      return WebCLProgram.prototype.getBuildInfo.call (this, device, name);
    }
    else
    {
      webclutils.validateNumArgs(arguments.length, 2);

      if (!webclutils.validateDevice(device))
        throw new INVALID_DEVICE("'device' must be a valid WebCLDevice; was ", device);

      if (!webclutils.validateInteger(name))
        throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

      // Return synthetic build infos
      switch (name)
      {
        case ocl_info.CL_PROGRAM_BUILD_OPTIONS:
          return "";

        case ocl_info.CL_PROGRAM_BUILD_STATUS:
          return ocl_const.CL_BUILD_NONE;

        case ocl_info.CL_PROGRAM_BUILD_LOG:
          return "";

        default:
          throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
      }
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.build = function (devices, options, whenFinished)
{
  TRACE (this, "build", arguments);

  try
  {
    var args = [ devices, options, whenFinished ];
    args = this.build_prepare.apply (this, args);

    if (whenFinished)
    {
      WebCLProgram.prototype.build.apply (this, args);
      ERROR ("NOTE: TODO: ASYNC VALIDATOR!");
      throw new Error ("TODO: ASYNC VALIDATOR!");
    }
    else
    {
      var source = this._originalSource;

      if (this._webclState.validator)
      {
        this._validatorProgram = this._webclState.validator.validate (this._originalSource,
                                                                      null,  // extensions
                                                                      null,  // userDefines
                                                                      null); // notify

        var validationStatus = this._validatorProgram.getProgramStatus ();
        // TODO: check validationStatus. NOTE: continue on OK or WARNINGS
        // INFO("VALIDATION STATUS: " + validationStatus + ": " + this._validatorProgram.programStatusToString(validationStatus));
        source = this._validatorProgram.getProgramValidatedSource();
      }
      else
      {
        // TODO: VALIDATOR NOT AVAILABLE, WHAT NOW?
        ERROR ("WebCLValidatedProgram: NEEDED VALIDATOR BUT IT'S NOT AVAILABLE!");
      }

      var clProgram = this._interimOwner._internal.createProgramWithSource (source);

      this.promoteToWebCLProgram (clProgram);

      WebCLProgram.prototype.build_execute.apply (this, args);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);

  try
  {
    if (this._internal)
    {
      return WebCLProgram.prototype.createKernel.call (this, kernelName);
    }
    else
    {
      throw new INVALID_PROGRAM_EXECUTABLE("cannot create Kernel: the most recent build of this Program was not successful");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);

  try
  {
    if (this._internal)
    {
      return WebCLProgram.prototype.createKernelsInProgram.call (this);
    }
    else
    {
      throw new INVALID_PROGRAM_EXECUTABLE("cannot create Kernel: the most recent build of this Program was not successful");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);

  try
  {
    if (this._internal)
    {
      WebCLProgram.prototype.releaseAll.call (this);
    }
    else
    {
      // Ensure releaseAll works as specified even if we don't have an actual program.
      this._invalid = true;
      this._internal = true;
      // NOTE: Using dummy value for _internal: enable control to flow to WebCLProgram
      //       where _invalid=true causes _ensureValidObject to fail.

      this._interimOwner = null;
      this._wrapperInstance = null;
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// Hook to release and release validatorProgram.
WebCLValidatedProgram.prototype.release = function ()
{
  if (this._validatorProgram)
  {
    // TODO: We shouldn't release the validatorProgram if it's still being used by a kernel!
    this._validatorProgram.releaseProgram ();
    this._validatorProgram = null;
  }

  WebCLProgram.prototype.release.apply (this);
};


} catch(e) { ERROR ("webclvalidatedprogram.jsm: "+e+"\n"+e.stack); }
