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
Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webclutils.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/webclclasses.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/webcl/webclprogram.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/program.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_clv/clv_wrapper.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/validatorasyncworkerapi.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_clv/clv_program.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


function WebCLValidatedProgram ()
{
  TRACE (this, "WebCLValidatedProgram", arguments);
  try {
    if (!(this instanceof WebCLValidatedProgram)) return new WebCLValidatedProgram ();

    WebCLProgram.apply (this);

    this.wrappedJSObject = this;
    this.validatorAvailable = false;

    // Set to true when the object is promoted to a full WebCLProgram.
    // Never reset after that.
    this._promoted = false;

    this._originalSource = "";
    this._internal = null;  // already set in Base, here for clarity!

    this._validatorProgram = null;

    // The owner object is stored in _interimOwner before the instance is promoted
    // to an actual WebCLProgram.
    this._interimOwner = null;

    // The options are stored in _interimOptions while the instance hasn't been
    // promoted to an actual WebCLProgram.
    this._interimOptions = null;

    // Reference to the XPConnect wrapper object.
    this._wrapperInstance = null;

    // __exposedProps__ inherited from WebCLProgram
  }
  catch (e)
  {
    ERROR ("webclvalidatedprogram.jsm:WebCLValidatedProgram: " + e + "\n" + e.stack);
    throw e;
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
    if (this._promoted) throw new Error ("Can't set original source after promotion.");

    this._originalSource = source;
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw e;
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
    throw e;
  }
};


WebCLValidatedProgram.prototype.getValidatedSource = function ()
{
  TRACE (this, "getValidatedSource", arguments);

  try
  {
    if (this._promoted)
    {
      return WebCLProgram.prototype.getInfo.call (this, ocl_info.CL_PROGRAM_SOURCE);
    }
    
    return "";
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw e;
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

    if (this._promoted)
    {
      ERROR ("WARNING: WebCLValidatedProgram.promoteToWebCLProgram: Trying to promote an already promoted object.");
    }

    if (this._internal)
    {
      ERROR ("WARNING: WebCLValidatedProgram.promoteToWebCLProgram: Trying to promote an object that already has internal.");
    }

    this._internal = internal;
    //this._identity = internal.getIdentity ();

    if (owner)
    {
      // If optional owner was given, replace _interimOwner
      this._interimOwner = owner;
    }

    // Set the real owner now that we have true internal and identity
    this._interimOwner._registerObject (this._wrapperInstance);

    // Clear unneeded properties
    this._interimOwner = null;
    this._interimOptions = null;
    this._wrapperInstance = null;
    
    this._promoted = true;
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw e;
  }
};


WebCLValidatedProgram.prototype.getInfo = function (name)
{
  TRACE (this, "getInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
      case ocl_info.CL_PROGRAM_NUM_DEVICES:
        if (this._promoted)
          return WebCLProgram.prototype.getInfo.call (this, name);
        else
          return (this._interimOwner ? this._interimOwner.getInfo(ocl_info.CL_CONTEXT_NUM_DEVICES) : null);
        break;

      case ocl_info.CL_PROGRAM_SOURCE:
        // NOTE: Override WebCLProgram functionality!
        return this._originalSource;
        break;

      case ocl_info.CL_PROGRAM_CONTEXT:
        if (this._promoted)
          return WebCLProgram.prototype.getInfo.call (this, name);
        else
          return this._interimOwner;
        break;

      case ocl_info.CL_PROGRAM_DEVICES:
        if (this._promoted)
          return WebCLProgram.prototype.getInfo.call (this, name);
        else
          return (this._interimOwner ? this._interimOwner.getInfo(ocl_info.CL_CONTEXT_DEVICES) : null);
        break;

      default:
        throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw e;
  }
};


function validatorBuildStatusToWebCLBuildStatus (v)
{
  switch (v)
  {
    case LibCLVWrapper.CLV_PROGRAM_VALIDATING:
      return ocl_const.CL_BUILD_IN_PROGRESS;

    case LibCLVWrapper.CLV_PROGRAM_ILLEGAL:
      return ocl_const.CL_BUILD_ERROR;

    case LibCLVWrapper.CLV_PROGRAM_ACCEPTED_WITH_WARNINGS:
      // NOTE: treating warnings as success!
    case LibCLVWrapper.CLV_PROGRAM_ACCEPTED:
      return ocl_const.CL_BUILD_SUCCESS;

    default:
      // Unexpected to end up in here!
      ERROR ("Unexpected validator status " + v + " in WebCLValidatedProgram.getBuildInfo!");
      return ocl_const.CL_BUILD_NONE;
  }
}


WebCLValidatedProgram.prototype.getBuildInfo = function (device, name)
{
  TRACE (this, "getBuildInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2);

    if (!webclutils.validateDevice(device))
      throw new INVALID_DEVICE("'device' must be a valid WebCLDevice; was ", device);

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    switch (name)
    {
      case ocl_info.CL_PROGRAM_BUILD_OPTIONS:
        if (this._promoted)
          return WebCLProgram.prototype.getBuildInfo.call (this, device, name);
        else
          return this._interimOptions || "";
        break;

      case ocl_info.CL_PROGRAM_BUILD_STATUS:
        if (this._promoted)
        {
          return WebCLProgram.prototype.getBuildInfo.call (this, device, name);
        }
        else
        {
          if (this.buildInProgress)
          {
            // If we know that build is in progress, always return BUILD_IN_PROGRESS.
            // The validator might be running in async mode as a worker.
            return ocl_const.CL_BUILD_IN_PROGRESS;
          }
          else if (this._validatorProgram)
          {
            // We have the validator, query its state and generate compatible
            // build status.
            var v = this._validatorProgram.getProgramStatus ();
            return validatorBuildStatusToWebCLBuildStatus (v);
          }
          else
          {
            return ocl_const.CL_BUILD_NONE;
          }
        }
        break;

      case ocl_info.CL_PROGRAM_BUILD_LOG:
        if (this._promoted)
        {
          return WebCLProgram.prototype.getBuildInfo.call (this, device, name);
        }
        else if (this._validatorProgram)
        {
          let n = this._validatorProgram.getProgramLogMessageCount ();
          let msg = "";

          for (let i = 0; i < n; ++i)
          {
            let level = this._validatorProgram.getProgramLogMessageLevel (n);
            switch (level)
            {
              case LibCLVWrapper.CLV_LOG_MESSAGE_NOTE:
                msg += "note: ";
                break;
              case LibCLVWrapper.CLV_LOG_MESSAGE_WARNING:
                msg += "warning: ";
                break;
              case LibCLVWrapper.CLV_LOG_MESSAGE_ERROR:
                msg += "error: ";
                break;
            }

            msg += this._validatorProgram.getProgramLogMessageText (i);

            if (this._validatorProgram.programLogMessageHasSource (i))
            {
              msg += "\n" + this._validatorProgram.getProgramLogMessageSourceText(i);
            }

            msg += "\n";
          }

          return msg;
        }
        else
        {
          return "";
        }
        break;

      default:
        throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw e;
  }
};


WebCLValidatedProgram.prototype.build = function (devices, options, whenFinished)
{
  TRACE (this, "build", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0, 3);

    var args = [ devices, options, whenFinished ];
    args = this.build_prepare.apply (this, args);

    this._interimOptions = options;

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
                                         [ "cl_khr_fp64" ], // extensions
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

              // Validation failed, data.err should be CL_INVALID_VALUE.
              throw new CLError (data.err, null, "Program.buildProgram");
            }

            instance._validatorProgram = new CLVProgram (data.program,
                                                         instance._webclState.validator._lib);

            instance.buildInProgress = false;


            // Validation was successful but the program illegal: throw BUILD_PROGRAM_FAILURE
            let validationStatus = instance._validatorProgram.getProgramStatus ();
            if (validationStatus == LibCLVWrapper.CLV_PROGRAM_ILLEGAL)
              throw new BUILD_PROGRAM_FAILURE("WebCL Validator: Illegal kernel program.");

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
                                                                      [ "cl_khr_fp64" ],  // extensions
                                                                      null,  // userDefines
                                                                      null); // notify

        // Validation was successful but the program illegal: throw BUILD_PROGRAM_FAILURE
        let validationStatus = this._validatorProgram.getProgramStatus ();
        if (validationStatus == LibCLVWrapper.CLV_PROGRAM_ILLEGAL)
          throw new BUILD_PROGRAM_FAILURE("WebCL Validator: Illegal kernel program.");

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
    throw e;
  }
};


WebCLValidatedProgram.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);

  try
  {
    this._ensureValidObject();

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
    throw e;
  }
};


WebCLValidatedProgram.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0);

    if (this._promoted)
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
      throw new INVALID_PROGRAM_EXECUTABLE("cannot create Kernels: the most recent build of this Program was not successful");
    }
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw e;
  }
};


WebCLValidatedProgram.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);

  try
  {
    if (this._invalid) return;

    if (!this._promoted)
    {
      // Enable control to flow to WebCLProgram
      this._promoted = true;
    }

    WebCLProgram.prototype.releaseAll.call (this);
  }
  catch (e)
  {
    try { ERROR(String(e)+"\n"+e.stack); }catch(e){}
    throw e;
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

  this._interimOwner = null;
  this._wrapperInstance = null;

  WebCLProgram.prototype.release.apply (this);
};


} catch(e) { ERROR ("webclvalidatedprogram.jsm: "+e+"\n"+e.stack); }
