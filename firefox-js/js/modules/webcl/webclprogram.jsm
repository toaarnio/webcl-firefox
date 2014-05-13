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

var EXPORTED_SYMBOLS = [ "WebCLProgram" ];


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

Cu.import ("resource://nrcwebcl/modules/mixin.jsm");
Cu.import ("resource://nrcwebcl/modules/mixins/owner.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/device.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_constants.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");

Cu.import ("resource://nrcwebcl/modules/webclasyncworkerapi.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");


function WebCLProgram ()
{
  TRACE (this, "WebCLProgram", arguments);
  try {
    if (!(this instanceof WebCLProgram)) return new WebCLProgram ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_PROGRAM;

    this.buildOptions = "";  // TODO make this device-specific

    this.isBuilt = false;  // TODO make this device-specific

    this.buildInProgress = false;  // TODO make this device-specific

    this.kernelsAlreadyCreated = false;

    this._objectRegistry = {};

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getInfo: "r",
      getBuildInfo: "r",
      build: "r",
      createKernel: "r",
      createKernelsInProgram: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclprogram.jsm:WebCLProgram failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLProgram = WebCLProgram;
WebCLProgram.prototype = Object.create (Base.prototype);
addMixin (WebCLProgram.prototype, OwnerMixin);
WebCLProgram.prototype.classDescription = "WebCLProgram";



WebCLProgram.prototype.getInfo = function (name)
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
    case ocl_info.CL_PROGRAM_SOURCE:
    case ocl_info.CL_PROGRAM_CONTEXT:
    case ocl_info.CL_PROGRAM_DEVICES:
      var clInfoItem = this._internal.getInfo (name);
      // Note: no need to acquire ownership
      return this._wrapInternal (clInfoItem);

    default:
      throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLProgram.prototype.getBuildInfo = function (device, name)
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
      return this.buildOptions;
    case ocl_info.CL_PROGRAM_BUILD_STATUS:
    case ocl_info.CL_PROGRAM_BUILD_LOG:
      var clDevice = this._unwrapInternalOrNull (device);
      var clInfoItem = this._internal.getBuildInfo (clDevice, name);
      // Note: no need to acquire ownership
      return this._wrapInternal (clInfoItem);

    default:
      throw new INVALID_VALUE("'name' must be one of the accepted CLenums; was ", name);
    }
  }
  catch (e)
  {
    /*
    let d = "device";
    try { d = device.getInfo(ocl_info.CL_DEVICE_NAME); } catch(e2){}
    try { let se = String(e); }catch(e2){}
    DEBUG("WebCLProgram.getBuildInfo("+d+","+oclInfoToString(name)+"): "+se);
    */

    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLProgram.prototype.build = function (devices, options, whenFinished)
{
  TRACE (this, "build", arguments);

  var validBuildOptions = [
    "-cl-opt-disable",
    "-cl-single-precision-constant",
    "-cl-denorms-are-zero",
    "-cl-mad-enable",
    "-cl-no-signed-zeros",
    "-cl-unsafe-math-optimizations",
    "-cl-finite-math-only",
    "-cl-fast-relaxed-math",
    "-w",
    "-Werror",
  ];

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0, 3);

    devices = webclutils.defaultTo(devices, null);
    options = webclutils.defaultTo(options, null);
    whenFinished = webclutils.defaultTo(whenFinished, null);
    
    if (this.kernelsAlreadyCreated === true)
      throw new INVALID_OPERATION("cannot build a WebCLProgram that has kernels already attached to it");

    if (this.buildInProgress === true)
      throw new INVALID_OPERATION("cannot build a WebCLProgram that is already being built in another thread");

    if (devices !== null && (!Array.isArray(devices) || devices.length === 0))
      throw new INVALID_VALUE("'devices' must be null or an Array with at least one element; was ", devices);

    if (options !== null && typeof(options) !== 'string')
      throw new INVALID_BUILD_OPTIONS("'options' must be a string of valid build options or null; was ", options);

    if (options !== null && !webclutils.validateBuildOptions(options, validBuildOptions))
      throw new INVALID_BUILD_OPTIONS("'options' must be a string of valid build options or null; was ", options);

    if (whenFinished !== null && typeof(whenFinished) !== "function")
      throw new TypeError("'whenFinished' must be null or a WebCLCallback function; was " + whenFinished);

    var programDevices = this.getInfo(ocl_info.CL_PROGRAM_DEVICES);

    for (let i=0; devices !== null && i < devices.length; i++) {
      
      if (!webclutils.validateDevice(devices[i]))
        throw new INVALID_DEVICE("'devices' must only contain instances of WebCLDevice; devices["+i+"] = ", devices[i]);

      if (programDevices.indexOf(devices[i]) === -1)
        throw new INVALID_DEVICE("'devices' must all be associated with this WebCLProgram; devices["+i+"] was not");
    }

    var clDevices = (devices || programDevices).map(this._unwrapInternal);

    options = (options === null) ? "" : options;

    this.buildOptions = options;

    var supportsCL12 = true;
    var supportsVerboseMode = true;
    clDevices.forEach(function(device) {    // must use internal getters to get unmasked values
      var deviceVersion = device.getInfo(ocl_info.CL_DEVICE_VERSION);
      var deviceExtensions = device.getInfo(ocl_info.CL_DEVICE_EXTENSIONS);
      supportsCL12 = supportsCL12 && (deviceVersion.indexOf("OpenCL 1.2") >= 0);
      supportsVerboseMode = supportsVerboseMode && (deviceExtensions.indexOf("NV_compiler_options") >= 0);
    });

    if (supportsCL12 === true) {
      options += " -cl-kernel-arg-info";
    }

    if (supportsVerboseMode === true) {
      options += " -cl-nv-verbose";
    }

    try {
      if (whenFinished)
      {
        // Asynchronous mode

        let instance = this;

        instance.buildInProgress = true;

        let asyncWorker = new WebCLAsyncWorker (null, function (err) {

          if (err) {

            instance.buildInProgress = false;

            ERROR ("WebCLProgram.build, asyncWorker setup failed: " + err);

            instance._webclState.inCallback = true;
            try {
              whenFinished ();
            }
            finally {
              instance._webclState.inCallback = false;
              asyncWorker.close ();
            }

            return;
          }

          asyncWorker.buildProgram (instance._internal, clDevices, options, function (err) {
            
            instance.buildInProgress = false;

            if (err) {
              ERROR ("WebCLProgram.build, asyncWorker.buildProgram() failed: " + err);
              instance.isBuilt = false;
            } else {
              instance.isBuilt = true;
            }

            instance._webclState.inCallback = true;
            try {
              whenFinished ();
            }
            finally {
              instance._webclState.inCallback = false;
              asyncWorker.close ();
            }
          });

        });

      }
      else
      {
        // Synchronous mode

        if (this._webclState.inCallback)
          throw new INVALID_OPERATION ("the blocking form of this function cannot be called from a WebCLCallback");

        this._internal.buildProgram (clDevices, options);
        this.isBuilt = true;
      }
    } catch (e) {
      this.isBuilt = false;
      this.buildInProgress = false;
      if (e.name === "BUILD_PROGRAM_FAILURE") {
        var device = this.getInfo(ocl_info.CL_PROGRAM_DEVICES)[0];
        e.msg = this.getBuildInfo(device, ocl_info.CL_PROGRAM_BUILD_LOG);
      }
      throw e;
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createKernel(name)._owner == this._owner == [WebCLContext]
//
WebCLProgram.prototype.createKernel = function (kernelName)
{
  TRACE (this, "createKernel", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 1);

    if (!webclutils.validateString(kernelName))
      throw new INVALID_KERNEL_NAME("kernelName must be a non-empty string; was ", kernelName);

    if (!this.isBuilt)
      throw new INVALID_PROGRAM_EXECUTABLE("cannot create Kernel: the most recent build of this Program was not successful");

    // NOTE: Ensure proper memory management on certain platforms by acquiring
    //       ownership of created kernels. This ensures that on releaseAll
    //       kernels will be released before program.

    var clKernel = this._wrapInternal (this._internal.createKernel(kernelName), this);

    this.kernelsAlreadyCreated = true;

    return clKernel;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// createKernelsInProgram()._owner == this._owner == [WebCLContext]
//
WebCLProgram.prototype.createKernelsInProgram = function ()
{
  TRACE (this, "createKernelsInProgram", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 0);

    if (!this.isBuilt)
      throw new INVALID_PROGRAM_EXECUTABLE("cannot create Kernels: the most recent build of this Program was not successful");

    // NOTE: Ensure proper memory management on certain platforms by acquiring
    //       ownership of created kernels. This ensures that on releaseAll
    //       kernels will be released before program.

    var clKernels = this._wrapInternal (this._internal.createKernelsInProgram(), this);

    this.kernelsAlreadyCreated = true;

    return clKernels;
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


// NOTE: NOT EXPOSED, NOT VISIBLE TO JS!
WebCLProgram.prototype.releaseAll = function ()
{
  TRACE (this, "releaseAll", arguments);
  if (this._invalid) return;

  try
  {
    this._releaseAllChildren ();
    this._clearRegistry ();
    this.release ();
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};



} catch(e) { ERROR ("webclprogram.jsm: "+e); }
