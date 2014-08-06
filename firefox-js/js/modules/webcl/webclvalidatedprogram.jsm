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

Cu.import ("resource://nrcwebcl/modules/validatorasyncworkerapi.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_clv/clv_program.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


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
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
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
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
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
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
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

    if (this._internal)
    {
      ERROR ("WARNING: WebCLValidatedProgram.promoteToWebCLProgram: Trying to promote an object that already has internal.");
    }

    this._internal = internal;
    this._identity = internal.getIdentity ();

    if (owner)
    {
      // If optional owner was given, replace _interimOwner
      this._interimOwner = owner;
    }

    // Set the real owner now that we have true internal and identity
    this._interimOwner._registerObject (this._wrapperInstance);

    // Clear unneeded propreties
    this._interimOwner = null;
    this._wrapperInstance = null;
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
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
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
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
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
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
      // ASYNC BUILD

      let instance = this;
      instance.buildInProgress = true;
      instance._webclState.releaseManager.numWorkersRunning++;

      try
      {
        let platformLibName = this._webclState.validator.getLibraryName (this._webclState.addonLocation);

        let validatorAsyncWorker = new ValidatorAsyncWorker (platformLibName,
                                                            function (err)
        {
          if (err)
          {
            instance.buildInProgress = false;
            instance._webclState.inCallback = true;
            try {
              whenFinished ();
            }
            finally {
              instance._webclState.inCallback = false;
              instance._webclState.releaseManager.numWorkersRunning--;

              validatorAsyncWorker.close ();
            }

            throw err;
          }

          validatorAsyncWorker.validate (instance._originalSource,
                                         null, // extensions
                                         null, // userDefines
                                         function (data)
          {
            if (data.err)
            {
              instance.buildInProgress = false;
              instance._webclState.inCallback = true;
              try {
                whenFinished ();
              }
              finally {
                instance._webclState.inCallback = false;
                instance._webclState.releaseManager.numWorkersRunning--;

                validatorAsyncWorker.close ();
              }

              throw data.err;
              // TODO: proper error handling!
            }

            instance._validatorProgram = new CLVProgram (data.program,
                                                         instance._webclState.validator._lib);

            instance.buildInProgress = false;

            if (instance._interimOwner)
            {
              // TODO: ensure _interimOwner is Context?
              let source = instance._validatorProgram.getProgramValidatedSource();
              let clProgram = instance._interimOwner._internal.createProgramWithSource (source);
              instance.promoteToWebCLProgram (clProgram);
            }

            try
            {
              WebCLProgram.prototype.build_execute.apply (instance, args);
            }
            finally
            {
              instance._webclState.releaseManager.numWorkersRunning--;
              validatorAsyncWorker.close ();
            }
          });
        });
      }
      catch (e)
      {
        instance.buildInProgress = false;
        instance._webclState.releaseManager.numWorkersRunning--;

        // TODO: We could fall back to sync mode here if we fail to create
        //       validator async worker:
        // this.build (devices, options, null);
        throw e;
      }

    }
    else
    {
      // SYNC BUILD

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
        throw new Error ("WebCLValidatedProgram: NEEDED VALIDATOR BUT IT'S NOT AVAILABLE!");
      }

      if (this._interimOwner)
      {
        // TODO: ensure _interimOwner is Context?

        let clProgram = this._interimOwner._internal.createProgramWithSource (source);
        this.promoteToWebCLProgram (clProgram);
      }

      WebCLProgram.prototype.build_execute.apply (this, args);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);

  try
  {
    if (!this.isBuilt || (!this._internal && this._interimOwner))
      throw new INVALID_PROGRAM_EXECUTABLE("cannot create Kernel: the most recent build of this Program was not successful");

    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (typeof(kernelName) !== 'string')
      throw new TypeError("'kernelName' must be a non-empty string; was " + kernelName);

    if (kernelName.length === 0)
      throw new INVALID_KERNEL_NAME("kernelName must not be empty");

    let kernel = WebCLProgram.prototype.createKernel.call (this, kernelName);
    kernel.wrappedJSObject._validatorProgram = this._validatorProgram._addref ();

    // By default kernel index is 0 (see WebCLProgram.createKernel), it needs to
    // be fixed to reflect the real kernel index in program
    let count = this._validatorProgram.getProgramKernelCount ();
    for (var i = 0; i < count; ++i)
    {
      if (kernelName == this._validatorProgram.getProgramKernelName(i))
      {
        kernel.wrappedJSObject._kernelIndex = i;
        break;
      }
    }
    if (i == count)
    {
      ERROR ("WARNING: Failed to get real kernel index. Using 0.");
      kernel.wrappedJSObject._kernelIndex = 0;
    }

    kernel.wrappedJSObject.updateArgIndexMapping ();
    return kernel;
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLValidatedProgram.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);

  try
  {
    webclutils.validateNumArgs(arguments.length, 0);

    if (this._internal)
    {
      let kernels = WebCLProgram.prototype.createKernelsInProgram.call (this);

      // NOTE: We assume that kernels are returned in indexed order.
      for (var i = 0; i < kernels.length; ++i)
      {
        kernels[i].wrappedJSObject._kernelIndex = i;

        kernels[i].wrappedJSObject._validatorProgram = this._validatorProgram._addref ();
        kernels[i].wrappedJSObject.updateArgIndexMapping ();
      }

      return kernels;
    }
    else
    {
      throw new INVALID_PROGRAM_EXECUTABLE("cannot create Kernel: the most recent build of this Program was not successful");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
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
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// Hook to release and release validatorProgram.
WebCLValidatedProgram.prototype.release = function ()
{
  if (this._validatorProgram)
  {
    this._validatorProgram._unref ();
    this._validatorProgram = null;
  }

  WebCLProgram.prototype.release.apply (this);
};


} catch(e) { ERROR ("webclvalidatedprogram.jsm: "+e+"\n"+e.stack); }
