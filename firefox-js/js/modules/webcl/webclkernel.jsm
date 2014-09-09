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

var EXPORTED_SYMBOLS = [ "WebCLKernel" ];


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

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


function WebCLKernel ()
{
  TRACE (this, "WebCLKernel", arguments);
  try {
    if (!(this instanceof WebCLKernel)) return new WebCLKernel ();

    Base.apply(this);

    this.wrappedJSObject = this;

    this.exceptionType = INVALID_KERNEL;

    // Kernel index of this kernel. Assigned in WebCLValidatedProgram.createKernel
    // and WebCLValidatedProgram.createKernelsInProgram.
    this._kernelIndex = 0;

    // Mapping from webcl kernel argument index values to validated kernel
    // argument index values. There is a cumulative +1 offset for each
    // WebCLBuffer argument, i.e. non-image pointer type argument.
    // Set to null if index mapping is not available, e.g. if there is no validator.
    this._argIndexMapping = null;

    // Reference to validator program instance.
    this._validatorProgram = null;

    this.__exposedProps__ =
    {
      getExternalIdentity: "r",
      getInfo: "r",
      getWorkGroupInfo: "r",
      getArgInfo: "r",
      setArg: "r",
      release: "r",

      classDescription: "r"
    };
  }
  catch (e)
  {
    ERROR ("webclkernel.jsm:WebCLKernel failed: " + e);
    throw webclutils.convertCLException (e);
  }
}

WEBCLCLASSES.WebCLKernel = WebCLKernel;
WebCLKernel.prototype = Object.create (Base.prototype);
WebCLKernel.prototype.classDescription = "WebCLKernel";



WebCLKernel.prototype.getInfo = function (name)
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
    case ocl_info.CL_KERNEL_FUNCTION_NAME:
    case ocl_info.CL_KERNEL_CONTEXT:
    case ocl_info.CL_KERNEL_PROGRAM:
      var clInfoItem = this._internal.getInfo (name);
      return this._wrapInternal (clInfoItem);

    case ocl_info.CL_KERNEL_NUM_ARGS:
      if (this._validatorProgram)
      {
        // The argument count of validated programs may not match the original
        // source since buffers gain additional size arg.
        // Get the external argument count from validatorProgram instead
        // of the kernel.
        return this._validatorProgram.getKernelArgCount (this._kernelIndex);
      }
      else
      {
        // NOTE: same as the common case above!
        var clInfoItem = this._internal.getInfo (name);
        return this._wrapInternal (clInfoItem);
      }

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


WebCLKernel.prototype.getWorkGroupInfo = function (device, name)
{
  TRACE (this, "getWorkGroupInfo", arguments);

  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2);

    device = webclutils.defaultTo(device, null);

    if (device !== null && !webclutils.validateDevice(device))
      throw new INVALID_DEVICE("'device' must be a valid WebCLDevice or null; was ", device);

    if (!webclutils.validateInteger(name))
      throw new INVALID_VALUE("'name' must be a valid CLenum; was ", name);

    var ctx = this.getInfo(ocl_info.CL_KERNEL_CONTEXT);
    var devices = ctx.getInfo(ocl_info.CL_CONTEXT_DEVICES);
    var program = this.getInfo(ocl_info.CL_KERNEL_PROGRAM);

    if (device === null && devices.length > 1)
      throw new INVALID_DEVICE("'device' must not be null: there is more than one device associated with the Context of this Kernel");

    if (device !== null && devices.indexOf(device) < 0)
      throw new INVALID_DEVICE("'device' is not associated with the Context of this Kernel");

    if (device !== null && program.getBuildInfo(device, ocl_info.CL_PROGRAM_BUILD_STATUS) !== ocl_const.CL_BUILD_SUCCESS)
      throw new INVALID_DEVICE("the Program containing this Kernel has not yet been successfully built for the given 'device'");

    switch (name)
    {
    case ocl_info.CL_KERNEL_WORK_GROUP_SIZE:
    case ocl_info.CL_KERNEL_COMPILE_WORK_GROUP_SIZE:
    case ocl_info.CL_KERNEL_LOCAL_MEM_SIZE:
    case ocl_info.CL_KERNEL_PREFERRED_WORK_GROUP_SIZE_MULTIPLE:
    case ocl_info.CL_KERNEL_PRIVATE_MEM_SIZE:

      // OPENCL DRIVER BUG WORKAROUND: Passing 'null' for a device does not work on the AMD APP SDK,
      // so we have to pass the real Device object instead (not a big issue because we've already
      // obtained it for argument validation purposes).
      //
      var clDevice = this._unwrapInternalOrNull (device || devices[0]);
      var clInfoItem = this._internal.getWorkGroupInfo (clDevice, name);
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


WebCLKernel.prototype.getArgInfo = function (index)
{
  TRACE (this, "getArgInfo", arguments);

  try
  {
    this._ensureValidObject();

    if (!this._validatorProgram)
    {
      throw new KERNEL_ARG_INFO_NOT_AVAILABLE();
    }

    // Validate index
    let cnt = this._validatorProgram.getKernelArgCount (this._kernelIndex);
    if (index < 0 || index >= cnt)
    {
      throw new INVALID_ARG_INDEX();
    }

    // Get kernel argument address qualifier
    // DOMString addressQualifier; // 'global', 'local', 'constant', or 'private'
    let addressQual = this._validatorProgram.getKernelArgAddressQual (this._kernelIndex, index);
    switch (addressQual)
    {
      case ocl_const.CL_KERNEL_ARG_ADDRESS_GLOBAL:
        addressQual = "global"; break;
      case ocl_const.CL_KERNEL_ARG_ADDRESS_LOCAL:
        addressQual = "local"; break;
      case ocl_const.CL_KERNEL_ARG_ADDRESS_CONSTANT:
        addressQual = "constant"; break;
      case ocl_const.CL_KERNEL_ARG_ADDRESS_PRIVATE:
        addressQual = "private"; break;
      default:
        throw new Error("Internal error: getKernelArgAddressQual returned an unexpected value "+addressQual+".");
    }

    // Get kernel argument access qualifier
    // DOMString accessQualifier;  // 'read_only', 'write_only', or 'none'
    let accessQual = this._validatorProgram.getKernelArgAccessQual (this._kernelIndex, index);
    switch (accessQual)
    {
      case ocl_const.CL_KERNEL_ARG_ACCESS_READ_ONLY:
        accessQual = "read_only"; break;
      case ocl_const.CL_KERNEL_ARG_ACCESS_WRITE_ONLY:
        accessQual = "write_only"; break;
      case ocl_const.CL_KERNEL_ARG_ACCESS_READ_WRITE:
        // WebCL specification 1.0.0: "or none". => fall through to none.
      case ocl_const.CL_KERNEL_ARG_ACCESS_NONE:
        accessQual = "none"; break;
      default:
        throw new Error("Internal error: getKernelArgAccessQual returned an unexpected value "+accessQual+".");
    }

    // Get kernel argument name
    let name = this._validatorProgram.getKernelArgName (this._kernelIndex, index);

    // Get kernel argument type
    // DOMString typeName;         // 'char', 'float', 'uint4', 'image2d_t', 'sampler_t', etc.
    let typeName = this._validatorProgram.getKernelArgType (this._kernelIndex, index);

    return {
      name:             name,
      typeName:         typeName,
      addressQualifier: addressQual,
      accessQualifier:  accessQual,

      // Expose relevant properties to unprivileged context
      __exposedProps__: {
        name:             "r",
        typeName:         "r",
        addressQualifier: "r",
        accessQualifier:  "r"
      }
    };
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLKernel.prototype.setArg = function (index, value)
{
  TRACE (this, "setArg", arguments);
  try
  {
    this._ensureValidObject();

    webclutils.validateNumArgs(arguments.length, 2);

    if (!webclutils.validateNonNegativeInt32(index))
      throw new INVALID_ARG_INDEX("'index' must be a non-negative integer; was ", index);

    if (index >= (numArgs = this.getInfo(ocl_info.CL_KERNEL_NUM_ARGS)))
      throw new INVALID_ARG_INDEX("'index' must be at most "+(numArgs-1)+" for this kernel; was ", index);

    value = webclutils.unray(value);

    if (this._validatorProgram)
    {
      this.setArg_validator (index, value);
    }
    else
    {
      this.setArg_no_validator (index, value);
    }
  }
  catch (e)
  {
    try { ERROR(String(e)); }catch(e){}
    throw webclutils.convertCLException (e);
  }
};


WebCLKernel.prototype.updateArgIndexMapping = function ()
{
  TRACE (this, "updateArgIndexMapping", arguments);

  this._ensureValidObject();
  if (!(this._validatorProgram)) return;

  let webclIdx = 0;
  let kernelIdx = 0;

  this._argIndexMapping = {};

  let argCnt = this._validatorProgram.getKernelArgCount (this._kernelIndex);
  for (let i = 0; i < argCnt; ++i)
  {
    this._argIndexMapping[webclIdx] = kernelIdx;

    try
    {
      if (this._validatorProgram.kernelArgIsPointer (this._kernelIndex, i))
      {
        // offset index only for buffers
        if (!this._validatorProgram.kernelArgIsImage (this._kernelIndex, i))
        {
          ++kernelIdx;
        }
      }
    }
    catch (e)
    {
      ERROR ("Failed to test if kernel arg at index "+i+" is pointer: "+e+"\n"+e.stack);
    }

    ++kernelIdx;
    ++webclIdx;
  }
}


WebCLKernel.prototype.setArg_validator = function (index, value)
{
  TRACE (this, "setArg_validator", arguments);


  // Mangle index: any argument index coming after a memory object must be
  // cumulatively offset by +1 for internal indexing.
  let internalIndex = +index;
  if (this._argIndexMapping) internalIndex = +(this._argIndexMapping[index]);

  var addressQual = this._validatorProgram.getKernelArgAddressQual (this._kernelIndex, index);
  if (addressQual == ocl_const.CL_KERNEL_ARG_ADDRESS_LOCAL)
  {
    let re = undefined;
    if (!value
        || typeof(value) != "object"
        || !(re = /\[object (\w*)\]/.exec(Object.prototype.toString.call(value)))
        || !re[1]
        || re[1] != "Uint32Array"
        || value.length != 1)
    {
      throw new INVALID_ARG_VALUE ("Kernel argument at index " + index + " has the 'local' address space qualifier but 'value' is not a Uint32Array of length 1; was ", value);
    }

    if (value[0] == 0)
    {
      throw new INVALID_ARG_VALUE ("Cannot set local memory size to zero.");
    }

    this._internal.setArg (internalIndex, value[0]);
  }
  else
  {
    let argTypeName = this._validatorProgram.getKernelArgType (this._kernelIndex, index);

    if (this._validatorProgram.kernelArgIsPointer (this._kernelIndex, index))
    {
      // Memory object

      if (!webclutils.validateMemObject(value))
      {
        throw new INVALID_ARG_VALUE("'value' for kernel argument " + index + " must be a WebCLMemoryObject; was ", value);
      }

      if (this.getInfo(ocl_info.CL_KERNEL_CONTEXT) !== value.getInfo(ocl_info.CL_MEM_CONTEXT))
      {
        throw new INVALID_MEM_OBJECT("the given WebCLMemoryObject and this WebCLKernel must have the same WebCLContext");
      }

      // Image
      if (this._validatorProgram.kernelArgIsImage (this._kernelIndex, index))
      {
        if (!webclutils.validateImage (value))
        {
          throw new INVALID_ARG_VALUE("'value' for kernel argument " + index + " must be a WebCLImage; was ", value);
        }

        this._internal.setArg (internalIndex, this._unwrapInternal (value));
      }
      // Buffer
      else
      {
        if (!webclutils.validateBuffer (value))
        {
          throw new INVALID_ARG_VALUE("'value' for kernel argument " + index + " must be a WebCLBuffer; was ", value);
        }

        this._internal.setArg (internalIndex, this._unwrapInternal (value));

        let bufByteSize = Int32Array([0, value.byteLength]);
        this._internal.setArg (internalIndex+1, bufByteSize);
      }
    }
    else if (argTypeName == "sampler_t")
    {
      // Sampler
      if (!webclutils.validateSampler(value))
      {
        throw new INVALID_SAMPLER("'value' for kernel argument " + index + " must be a WebCLSampler; was ", value);
      }

      this._internal.setArg (internalIndex, this._unwrapInternal (value));
    }
    else
    {
      // Scalar or vector values

      if (!webclutils.validateArrayBufferView(value))
      {
        throw new INVALID_ARG_VALUE("'value' for kernel argument " + index + " must be an ArrayBufferView; was ", value);
      }

      let bufTypeName = (/\[object (\w*)\]/.exec(Object.prototype.toString.call(value)))[1];

      let argTypeBaseName = argTypeName;
      let argVectorDims = 1;

      let re = /(\D*)(\d*)/.exec(argTypeName);
      if (re)
      {
        argTypeBaseName = re[1];
        if (re[2])
        {
          argVectorDims = +(re[2]);
        }
      }

      // By default we expect one element per value in array. For 64-bit values
      // we need to have 2 elements per value. The correct ordering is expected
      // to be handled by the user.
      let multiElemFactor = 1;

      switch (argTypeBaseName)
      {
        case "bool":
          switch (bufTypeName)
          {
            case "Int8Array":
            case "Uint8Array":
            case "Uint8ClampedArray":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have unit size of 1 byte.");
          }
          break;

        // signed 8 bit types
        case "char":
          switch (bufTypeName)
          {
            case "Int8Array":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an integer unit size of 1 byte.");
          }
          break;

        // unsigned 8 bit types
        case "unsigned char":
        case "uchar":
          switch (bufTypeName)
          {
            case "Uint8Array":
            case "Uint8ClampedArray":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an unsigned integer unit size of 1 byte.");
          }
          break;

        // signed 16 bit types
        case "short":
          switch (bufTypeName)
          {
            case "Int16Array":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an integer unit size of 2 bytes.");
          }
          break;

        // unsigned 16 bit types
        case "unsigned short":
        case "ushort":
          switch (bufTypeName)
          {
            case "Uint16Array":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an unsigned integer unit size of 2 bytes.");
          }
          break;

        // signed 32 bit types
        case "int":
          switch (bufTypeName)
          {
            case "Int32Array":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an integer unit size of 4 bytes.");
          }
          break;

        // unsigned 32 bit types
        case "unsigned int":
        case "uint":
          switch (bufTypeName)
          {
            case "Uint32Array":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an unsigned integer unit size of 4 bytes.");
          }
          break;

        // signed 64 bit types
        case "long":
          switch (bufTypeName)
          {
            case "Int32Array":
            case "Uint32Array":
              // Set multiElemFactor to 2 to indicate that we expect 2 elements per value.
              multiElemFactor = 2;

              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an integer unit size of 4 bytes.");
          }
          break;

        // unsigned 64 bit types
        case "unsigned long":
        case "ulong":
          switch (bufTypeName)
          {
            case "Uint32Array":
              // Set multiElemFactor to 2 to indicate that we expect 2 elements per value.
              multiElemFactor = 2;

              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an unsigned integer unit size of 4 bytes.");
          }
          break;

        // 16 bit floating point types
        case "half":
          //TODO: Half values not supported!
          throw new INVALID_ARG_VALUE("Unsupported argument type 'half' at index "+index+".");
          break;

        // 32 bit floating point types
        case "float":
          switch (bufTypeName)
          {
            case "Float32Array":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have a floating point unit size of 4 bytes.");
          }
          break;

        // 64 bit floating point types
        case "double":
          switch (bufTypeName)
          {
            case "Float64Array":
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have a floating point unit size of 8 bytes.");
          }
          break;

        // address size specific types
        case "size_t":
        case "ptrdiff_t":
        case "intptr_t":
        case "uintptr_t":
          switch (bufTypeName)
          {
            case "Int32Array":
            case "Uint32Array":
              if (value.length == 2)
              {
                // TODO: handle 64-bit case properly?
                multiElemFactor = 2;
              }
              break;
            default:
              throw new INVALID_ARG_VALUE ("the given ArrayBufferView must have an integer unit size of 4 bytes.");
          }
          break;

        case "void":
        default:
          // TODO: use correct exception!
          throw new INVALID_ARG_VALUE ("Internal error, unknown internal type name '" + argTypeName + "'.");
      }

      // Ensure array buffer view element count equals vector type dimension
      // (or is 1 for non-vector type).
      if (value.length != (argVectorDims * multiElemFactor))
      {
        throw new INVALID_ARG_VALUE("argument at index " + index + " requires an ArrayBufferView with length of " + argVectorDims + "; was ", value.length);
      }


      // Mangle value if its type is vector3: the data size must actually be
      // equal to vector4 (see cl_platform.h).
      if (argVectorDims == 3)
      {
        // Build a vector with vector3 element padded to vector4, supporting
        // values with multiple array elements.
        let vec = [];
        let p = 0;
        for (let i = 0; i <= 3; ++i)
        {
          for (let k = 0; k < multiElemFactor; ++k)
          {
            let val = 0;
            if (i < 3)
            {
              val = value[p];
            }
            vec.push (val);
            ++p;
          }
        }
        //value = value.constructor.call(null, [value[0], value[1], value[2], 0]);
        value = value.constructor.call(null, vec);
      }


      this._internal.setArg (internalIndex, value);
    }
  }
};


WebCLKernel.prototype.setArg_no_validator = function (index, value)
{
  TRACE (this, "setArg_no_validator", arguments);

  if (webclutils.validateMemObject(value))
    if (this.getInfo(ocl_info.CL_KERNEL_CONTEXT) !== value.getInfo(ocl_info.CL_MEM_CONTEXT))
      throw new INVALID_MEM_OBJECT("the given WebCLMemoryObject and this WebCLKernel must have the same WebCLContext");

  if (webclutils.validateArrayBufferView(value) &&
      (value.length === 0 || (value.length > 4 && value.length !== 6 && value.length !== 8 && value.length !== 16 && value.length !== 32)))
    throw new INVALID_ARG_VALUE("the given ArrayBufferView must have a length of 1, 2, 3, 4, 6, 8, 16, or 32; was ", value.length);

  if (!webclutils.validateMemObject(value) &&
      !webclutils.validateSampler(value) &&
      !webclutils.validateArrayBufferView(value))
    throw new INVALID_ARG_VALUE("'value' must be a Buffer, Image, Sampler or ArrayBufferView; was ", value);


  // Handle arguments with local address space qualifier.
  // The number of bytes allocated is set using Uint32Array of length 1.
  // As we don't have getArgInfo we'll just test any such argument by treating
  // them initially as local arg and hope that CL driver fails that if they
  // weren't.
  try {
    if (value && typeof(value) == "object")
    {
      let re = /\[object (\w*)\]/.exec(Object.prototype.toString.call(value));
      if (re && re[1] && re[1] == "Uint32Array" && value.length == 1 && value[0] > 0)
      {
        DEBUG ("WebCLKernel.setArg: Possible local arg detected, index="+index+" size="+value[0]+".");
        this._internal.setArg (index, value[0]);

        // NOTE: without validator we can't guard against setting zero value here, so:
        // TODO: convert INVALID_ARG_SIZE to an INVALID_ARG_VALUE with a meaningful
        //       explanation.

        // setArg didn't fail so arg seems to have been local.
        return;
      }
    }
  } catch(e) {}

  this._internal.setArg (index, this._unwrapInternal (value));
};





} catch(e) { ERROR ("webclkernel.jsm: "+e+"\n"+e.stack); }
