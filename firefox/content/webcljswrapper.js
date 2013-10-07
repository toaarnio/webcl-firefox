(function() {

  if (this.WebCL) return;


  // == Internal functions =====================================================

  var _handle = NokiaWebCLInternal;


  var _ensureWebCLAvailable = function ()
  {
    // TODO
    if (!_handle)
    {
      alert ("No WebCL Implementation?");
    }

    return (!!_handle);
  };

  var _wrapInternalObject = function (obj)
  {
    if (Array.isArray(obj))
    {
      var tmp = [];
      for (var i = 0; i < obj.length; ++i)
      {
        tmp[i] = _wrapInternalObject (obj[i]);
      }
      obj = tmp;
    }
    else if (obj && typeof(obj) == "object")
    {
      var s = obj.toString ();
      if (s.startsWith ("[xpconnect wrapped "))
      {
        if (obj.getAttachment && typeof(obj.getAttachment) == "function")
        {
          var a = obj.getAttachment ();
          if (a)
          {
            return a;
          }
        }

        var id = s.substring (19);  // "[xpconnect wrapped ".length --> 19
        switch (id)
        {
          case "IWebCLPlatform]":     return new _Platform (obj);
          case "IWebCLDevice]":       return new _Device (obj);
          case "IWebCLContext]":      return new _Context (obj);
          case "IWebCLProgram]":      return new _Program (obj);
          case "IWebCLKernel]":       return new _Kernel (obj);
          case "IWebCLCommandQueue]": return new _CommandQueue (obj);
          case "IWebCLEvent]":        return new _Event (obj);
          case "IWebCLMemoryObject]": return new _MemoryObject (obj);
          case "IWebCLSampler]":      return new _Sampler (obj);
          /* default: try{ console.log ("_wrapInternalObject: Can't wrap object " + obj.toString()); }catch(e){}; break; */
        }
      }
    }
    return obj;
  };

  var _unwrapInternalObject = function (obj)
  {
    if (Array.isArray(obj))
    {
      var tmp = [];
      for (var i = 0; i < obj.length; ++i)
      {
        tmp[i] = _unwrapInternalObject (obj[i]);
      }
      obj = tmp;
    }
    else if (obj && typeof(obj) == "object")
    {
      if (obj instanceof _Platform) return obj._internal;
      if (obj instanceof _Device) return obj._internal;
      if (obj instanceof _Context) return obj._internal;
      if (obj instanceof _Program) return obj._internal;
      if (obj instanceof _Kernel) return obj._internal;
      if (obj instanceof _CommandQueue) return obj._internal;
      if (obj instanceof _Event) return obj._internal;
      if (obj instanceof _MemoryObject) return obj._internal;
      if (obj instanceof _Sampler) return obj._internal;
      /* try{ console.log("_unwrapInternalObject: Can't unwrap " + typeof(obj) + " object " + obj.toString()); }catch(e){} */
    }
    return obj;
  };

  var _createDefaultFunctionWrapperRv = function (fname)
  {
    return function ()
    {
      var args = Array.prototype.slice.call(arguments);
      var rv = this._internal[fname].apply (this._internal,
                                            _unwrapInternalObject(args));
      return _wrapInternalObject (rv);
    };
  }

  var _createDefaultFunctionWrapper = function (fname)
  {
    return function ()
    {
      var args = Array.prototype.slice.call(arguments);
      this._internal[fname].apply (this._internal, _unwrapInternalObject(args));
    };
  }


  // == WebCL ====================================================================
  this.WebCL = { };
  this.webCL = WebCL;

  window.WebCLPlatform = _Platform;
  window.WebCLDevice = _Device;
  window.WebCLContext = _Context;
  window.WebCLProgram = _Program;
  window.WebCLKernel = _Kernel;
  window.WebCLCommandQueue = _CommandQueue;
  window.WebCLEvent = _Event;
  window.WebCLMemoryObject = _MemoryObject;
  window.WebCLSampler = _Sampler;

  try { WebCL.types = _handle.types; } catch(e) { }
  try { WebCL.version = _handle.version; } catch(e) { }

  WebCL.getPlatforms = function ()
  {
    if (!_ensureWebCLAvailable ()) return;
    var rv = _handle.getPlatforms ();
    return _wrapInternalObject (rv);
  };

  WebCL.getPlatformIDs = WebCL.getPlatforms;

  WebCL.createContext = function ()
  {
    if (!_ensureWebCLAvailable ()) return;

    var rv;

    if (arguments.length === 1 && typeof(arguments[0]) == "object" )
    {
      var props = arguments[0];

      // TODO: The default platform is currently the platform at index zero.
      if (!props.platform)
      {
        props.platform = WebCL.getPlatforms ()[0];
      }

      if (!props.platform instanceof _Platform)
      {
        throw new Error ("WebCL#createContext  ERROR: invalid platform object.");
      }

      switch (props.deviceType)
      {
        case 0x1:
        default:
          props.deviceType = WebCL.DEVICE_TYPE_DEFAULT;
          break;
        // TODO: other device types? Are they going to match OCL enums?
      }

      if (props.devices)
      {
        var args = [ [WebCL.CONTEXT_PLATFORM, props.platform], [props.devices] ];
        rv = _handle.createContext.apply (_handle, _unwrapInternalObject(args));
      }
      else
      {
        var args = [ [WebCL.CONTEXT_PLATFORM, props.platform], props.deviceType ];
        rv = _handle.createContextFromType.apply (_handle, _unwrapInternalObject(args));
      }
    }
    else
    {
      var args = Array.prototype.slice.call(arguments);
      rv = _handle.createContext.apply (_handle, _unwrapInternalObject(args));
    }
    return _wrapInternalObject (rv);
  };

  WebCL.createContextFromType = function ()
  {
    if (!_ensureWebCLAvailable ()) return;
    var args = Array.prototype.slice.call(arguments);
    var rv = _handle.createContextFromType.apply (_handle, _unwrapInternalObject(args));
    return _wrapInternalObject (rv);
  };

  WebCL.waitForEvents = function ()
  {
    if (!_ensureWebCLAvailable ()) return;
    var args = Array.prototype.slice.call(arguments);
    _handle.waitForEvents.apply (_handle, _unwrapInternalObject(args));
  };

  WebCL.unloadCompiler = function ()
  {
    if (!_ensureWebCLAvailable ()) return;
    var args = Array.prototype.slice.call(arguments);
    _handle.unloadCompiler.apply (_handle, _unwrapInternalObject(args));
  };


  function _Base (internal)
  {
    this._internal = internal;

    /*
    if (internal.setAttachment && typeof(internal.setAttachment) == "function")
    {
      internal.setAttachment (this);
    }
    */
  }

  // == Platform =================================================================
  function _Platform (internal)
  {
    if (!this instanceof _Platform) return; // TODO
    _Base.call (this, internal);
  }

  _Platform.prototype = Object.create (_Base.prototype);
  _Platform.prototype.constructor = _Platform;

  _Platform.prototype.getInfo = _createDefaultFunctionWrapperRv ("getPlatformInfo");
  _Platform.prototype.getPlatformInfo = _Platform.prototype.getInfo;

  _Platform.prototype.getDevices = _createDefaultFunctionWrapperRv ("getDevices");
  _Platform.prototype.getDeviceIDs = _Platform.prototype.getDevices;


  // == Device ===================================================================
  function _Device (internal)
  {
    if (!this instanceof _Device) return; // TODO
    _Base.call (this, internal);
  }

  _Device.prototype = Object.create (_Base.prototype);
  _Device.prototype.constructor = _Device;

  _Device.prototype.getInfo = _createDefaultFunctionWrapperRv ("getDeviceInfo");
  _Device.prototype.getDeviceInfo = _Device.prototype.getInfo;


  // == Context ==================================================================
  function _Context (internal) {
    if (!this instanceof _Context) return; // TODO
    _Base.call (this, internal);
  }

  _Context.prototype = Object.create (_Base.prototype);
  _Context.prototype.constructor = _Context;

  _Context.prototype.getInfo = _createDefaultFunctionWrapperRv ("getContextInfo");
  _Context.prototype.getContextInfo = _Context.prototype.getInfo;

  _Context.prototype.createProgramWithSource =
        _createDefaultFunctionWrapperRv ("createProgramWithSource");

  _Context.prototype.createProgramWithBinary =
        _createDefaultFunctionWrapperRv ("createProgramWithBinary");

  _Context.prototype.createCommandQueue =
        _createDefaultFunctionWrapperRv ("createCommandQueue");

  _Context.prototype.createBuffer =
        _createDefaultFunctionWrapperRv ("createBuffer");

  _Context.prototype.createImage2D =
        _createDefaultFunctionWrapperRv ("createImage2D");

  _Context.prototype.createImage3D =
        _createDefaultFunctionWrapperRv ("createImage3D");

  _Context.prototype.createSampler =
        _createDefaultFunctionWrapperRv ("createSampler");

  _Context.prototype.getSupportedImageFormats =
        _createDefaultFunctionWrapperRv ("getSupportedImageFormats");

  _Context.prototype.createUserEvent =
        _createDefaultFunctionWrapperRv ("createUserEvent");

  _Context.prototype.releaseCLResources =
        _createDefaultFunctionWrapper ("releaseCLResources");


  // == Program ==================================================================
  function _Program (internal) {
    if (!this instanceof _Program) return; // TODO
    _Base.call (this, internal);
  }

  _Program.prototype = Object.create (_Base.prototype);
  _Program.prototype.constructor = _Program;

  _Program.prototype.getInfo = _createDefaultFunctionWrapperRv ("getProgramInfo");
  _Program.prototype.getProgramInfo = _Program.prototype.getInfo;

  _Program.prototype.getBuildInfo = _createDefaultFunctionWrapperRv ("getProgramBuildInfo");
  _Program.prototype.getProgramBuildInfo = _Program.prototype.getBuildInfo;

  _Program.prototype.buildProgram = _createDefaultFunctionWrapper ("buildProgram");

  _Program.prototype.createKernel = _createDefaultFunctionWrapperRv ("createKernel");

  _Program.prototype.createKernelsInProgram = _createDefaultFunctionWrapperRv ("createKernelsInProgram");

  _Program.prototype.releaseCLResources = _createDefaultFunctionWrapper ("releaseCLResources");


  // == Kernel ===================================================================
  function _Kernel (internal) {
    if (!this instanceof _Kernel) return; // TODO
    _Base.call (this, internal);
  }

  _Kernel.prototype = Object.create (_Base.prototype);
  _Kernel.prototype.constructor = _Kernel;

  _Kernel.prototype.getInfo = _createDefaultFunctionWrapperRv ("getKernelInfo");
  _Kernel.prototype.getKernelInfo = _Kernel.prototype.getInfo;

  _Kernel.prototype.getWorkGroupInfo = _createDefaultFunctionWrapperRv ("getKernelWorkGroupInfo");
  _Kernel.prototype.getKernelWorkGroupInfo = _Kernel.prototype.getWorkGroupInfo;

  _Kernel.prototype.setArg = _createDefaultFunctionWrapper ("setKernelArg");
  _Kernel.prototype.setKernelArg = _Kernel.prototype.setArg;

  _Kernel.prototype.setArgLocal = _createDefaultFunctionWrapper ("setKernelArgLocal");
  _Kernel.prototype.setKernelArgLocal = _Kernel.prototype.setArgLocal;

  _Kernel.prototype.releaseCLResources = _createDefaultFunctionWrapper ("releaseCLResources");


  // == CommandQueue =============================================================
  function _CommandQueue (internal) {
    if (!this instanceof _CommandQueue) return; // TODO
    _Base.call (this, internal);
  }

  _CommandQueue.prototype = Object.create (_Base.prototype);
  _CommandQueue.prototype.constructor = _CommandQueue;

  _CommandQueue.prototype.getInfo = _createDefaultFunctionWrapperRv ("getCommandQueueInfo");
  _CommandQueue.prototype.getCommandQueueInfo = _CommandQueue.prototype.getInfo;

  _CommandQueue.prototype.enqueueNDRangeKernel = _createDefaultFunctionWrapperRv ("enqueueNDRangeKernel");

  _CommandQueue.prototype.enqueueTask = _createDefaultFunctionWrapperRv ("enqueueTask");

  _CommandQueue.prototype.enqueueWriteBuffer = _createDefaultFunctionWrapperRv ("enqueueWriteBuffer");

  _CommandQueue.prototype.enqueueReadBuffer = _createDefaultFunctionWrapperRv ("enqueueReadBuffer");

  _CommandQueue.prototype.enqueueWriteBufferRect = _createDefaultFunctionWrapperRv ("enqueueWriteBufferRect");

  _CommandQueue.prototype.enqueueReadBufferRect = _createDefaultFunctionWrapperRv ("enqueueReadBufferRect");

  _CommandQueue.prototype.enqueueWriteImage = _createDefaultFunctionWrapperRv ("enqueueWriteImage");

  _CommandQueue.prototype.enqueueReadImage = _createDefaultFunctionWrapperRv ("enqueueReadImage");

  _CommandQueue.prototype.enqueueCopyImage = _createDefaultFunctionWrapperRv ("enqueueCopyImage");

  _CommandQueue.prototype.enqueueCopyImageToBuffer = _createDefaultFunctionWrapperRv ("enqueueCopyImageToBuffer");

  _CommandQueue.prototype.enqueueCopyBufferToImage = _createDefaultFunctionWrapperRv ("enqueueCopyBufferToImage");

  _CommandQueue.prototype.enqueueMapBuffer = _createDefaultFunctionWrapperRv ("enqueueMapBuffer");

  _CommandQueue.prototype.enqueueMapImage = _createDefaultFunctionWrapperRv ("enqueueMapImage");

  _CommandQueue.prototype.enqueueUnmapMemObject = _createDefaultFunctionWrapperRv ("enqueueUnmapMemObject");

  _CommandQueue.prototype.enqueueMarker = _createDefaultFunctionWrapperRv ("enqueueMarker");

  _CommandQueue.prototype.enqueueWaitForEvents = _createDefaultFunctionWrapper ("enqueueWaitForEvents");

  _CommandQueue.prototype.enqueueBarrier = _createDefaultFunctionWrapper ("enqueueBarrier");

  _CommandQueue.prototype.flush = _createDefaultFunctionWrapper ("flush");

  _CommandQueue.prototype.finish = _createDefaultFunctionWrapper ("finish");

  _CommandQueue.prototype.releaseCLResources = _createDefaultFunctionWrapper ("releaseCLResources");



  // == Event ====================================================================
  function _Event (internal) {
    if (!this instanceof _Event) return; // TODO
    _Base.call (this, internal);
  }

  _Event.prototype = Object.create (_Base.prototype);
  _Event.prototype.constructor = _Event;

  _Event.prototype.getInfo = _createDefaultFunctionWrapperRv ("getEventInfo");
  _Event.prototype.getEventInfo = _Event.prototype.getInfo;

  _Event.prototype.getProfilingInfo = _createDefaultFunctionWrapperRv ("getEventProfilingInfo");
  _Event.prototype.getEventProfilingInfo = _Event.prototype.getProfilingInfo;

  _Event.prototype.setUserEventStatus = _createDefaultFunctionWrapper ("setUserEventStatus");

  _Event.prototype.releaseCLResources = _createDefaultFunctionWrapper ("releaseCLResources");


  // == MemoryObject =============================================================
  function _MemoryObject (internal) {
    if (!this instanceof _MemoryObject) return; // TODO
    _Base.call (this, internal);
  }

  _MemoryObject.prototype = Object.create (_Base.prototype);
  _MemoryObject.prototype.constructor = _MemoryObject;

  _MemoryObject.prototype.getInfo = _createDefaultFunctionWrapperRv ("getMemObjectInfo");
  _MemoryObject.prototype.getMemObjectInfo = _MemoryObject.prototype.getInfo;

  _MemoryObject.prototype.getImageInfo = _createDefaultFunctionWrapperRv ("getImageInfo");

  _MemoryObject.prototype.createSubBuffer = _createDefaultFunctionWrapperRv ("createSubBuffer");

  _MemoryObject.prototype.releaseCLResources = _createDefaultFunctionWrapper ("releaseCLResources");


  // == Sampler ==================================================================
  function _Sampler (internal) {
    if (!this instanceof _Sampler) return; // TODO
    _Base.call (this, internal);
  }

  _Sampler.prototype = Object.create (_Base.prototype);
  _Sampler.prototype.constructor = _Sampler;

  _Sampler.prototype.getInfo = _createDefaultFunctionWrapperRv ("getSamplerInfo");
  _Sampler.prototype.getSamplerInfo = _Sampler.prototype.getInfo;

  _Sampler.prototype.releaseCLResources = _createDefaultFunctionWrapper ("releaseCLResources");



  // == Constants ================================================================
  WebCL.SUCCESS = 0;
  WebCL.DEVICE_NOT_FOUND = -1;
  WebCL.DEVICE_NOT_AVAILABLE = -2;
  WebCL.COMPILER_NOT_AVAILABLE = -3;
  WebCL.MEM_OBJECT_ALLOCATION_FAILURE = -4;
  WebCL.OUT_OF_RESOURCES = -5;
  WebCL.OUT_OF_HOST_MEMORY = -6;
  WebCL.PROFILING_INFO_NOT_AVAILABLE = -7;
  WebCL.MEM_COPY_OVERLAP = -8;
  WebCL.IMAGE_FORMAT_MISMATCH = -9;
  WebCL.IMAGE_FORMAT_NOT_SUPPORTED = -10;
  WebCL.BUILD_PROGRAM_FAILURE = -11;
  WebCL.MAP_FAILURE = -12;
  WebCL.MISALIGNED_SUB_BUFFER_OFFSET = -13;
  WebCL.EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST = -14;
  WebCL.INVALID_VALUE = -30;
  WebCL.INVALID_DEVICE_TYPE = -31;
  WebCL.INVALID_PLATFORM = -32;
  WebCL.INVALID_DEVICE = -33;
  WebCL.INVALID_CONTEXT = -34;
  WebCL.INVALID_QUEUE_PROPERTIES = -35;
  WebCL.INVALID_COMMAND_QUEUE = -36;
  WebCL.INVALID_HOST_PTR = -37;
  WebCL.INVALID_MEM_OBJECT = -38;
  WebCL.INVALID_IMAGE_FORMAT_DESCRIPTOR = -39;
  WebCL.INVALID_IMAGE_SIZE = -40;
  WebCL.INVALID_SAMPLER = -41;
  WebCL.INVALID_BINARY = -42;
  WebCL.INVALID_BUILD_OPTIONS = -43;
  WebCL.INVALID_PROGRAM = -44;
  WebCL.INVALID_PROGRAM_EXECUTABLE = -45;
  WebCL.INVALID_KERNEL_NAME = -46;
  WebCL.INVALID_KERNEL_DEFINITION = -47;
  WebCL.INVALID_KERNEL = -48;
  WebCL.INVALID_ARG_INDEX = -49;
  WebCL.INVALID_ARG_VALUE = -50;
  WebCL.INVALID_ARG_SIZE = -51;
  WebCL.INVALID_KERNEL_ARGS = -52;
  WebCL.INVALID_WORK_DIMENSION = -53;
  WebCL.INVALID_WORK_GROUP_SIZE = -54;
  WebCL.INVALID_WORK_ITEM_SIZE = -55;
  WebCL.INVALID_GLOBAL_OFFSET = -56;
  WebCL.INVALID_EVENT_WAIT_LIST = -57;
  WebCL.INVALID_EVENT = -58;
  WebCL.INVALID_OPERATION = -59;
  WebCL.INVALID_GL_OBJECT = -60;
  WebCL.INVALID_BUFFER_SIZE = -61;
  WebCL.INVALID_MIP_LEVEL = -62;
  WebCL.INVALID_GLOBAL_WORK_SIZE = -63;
  WebCL.INVALID_PROPERTY = -64;
  WebCL.VERSION_1_0 = 1;
  WebCL.VERSION_1_1 = 1;
  WebCL.FALSE = 0;
  WebCL.TRUE = 1;
  WebCL.PLATFORM_PROFILE = 0x0900;
  WebCL.PLATFORM_VERSION = 0x0901;
  WebCL.PLATFORM_NAME = 0x0902;
  WebCL.PLATFORM_VENDOR = 0x0903;
  WebCL.PLATFORM_EXTENSIONS = 0x0904;
  WebCL.DEVICE_TYPE_DEFAULT = (1<<0);
  WebCL.DEVICE_TYPE_CPU = (1<<1);
  WebCL.DEVICE_TYPE_GPU = (1<<2);
  WebCL.DEVICE_TYPE_ACCELERATOR = (1<<3);
  WebCL.DEVICE_TYPE_ALL = 0xFFFFFFFF;
  WebCL.DEVICE_TYPE = 0x1000;
  WebCL.DEVICE_VENDOR_ID = 0x1001;
  WebCL.DEVICE_MAX_COMPUTE_UNITS = 0x1002;
  WebCL.DEVICE_MAX_WORK_ITEM_DIMENSIONS = 0x1003;
  WebCL.DEVICE_MAX_WORK_GROUP_SIZE = 0x1004;
  WebCL.DEVICE_MAX_WORK_ITEM_SIZES = 0x1005;
  WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_CHAR = 0x1006;
  WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_SHORT = 0x1007;
  WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_INT = 0x1008;
  WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_LONG = 0x1009;
  WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_FLOAT = 0x100A;
  WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_DOUBLE = 0x100B;
  WebCL.DEVICE_MAX_CLOCK_FREQUENCY = 0x100C;
  WebCL.DEVICE_ADDRESS_BITS = 0x100D;
  WebCL.DEVICE_MAX_READ_IMAGE_ARGS = 0x100E;
  WebCL.DEVICE_MAX_WRITE_IMAGE_ARGS = 0x100F;
  WebCL.DEVICE_MAX_MEM_ALLOC_SIZE = 0x1010;
  WebCL.DEVICE_IMAGE2D_MAX_WIDTH = 0x1011;
  WebCL.DEVICE_IMAGE2D_MAX_HEIGHT = 0x1012;
  WebCL.DEVICE_IMAGE3D_MAX_WIDTH = 0x1013;
  WebCL.DEVICE_IMAGE3D_MAX_HEIGHT = 0x1014;
  WebCL.DEVICE_IMAGE3D_MAX_DEPTH = 0x1015;
  WebCL.DEVICE_IMAGE_SUPPORT = 0x1016;
  WebCL.DEVICE_MAX_PARAMETER_SIZE = 0x1017;
  WebCL.DEVICE_MAX_SAMPLERS = 0x1018;
  WebCL.DEVICE_MEM_BASE_ADDR_ALIGN = 0x1019;
  WebCL.DEVICE_MIN_DATA_TYPE_ALIGN_SIZE = 0x101A;
  WebCL.DEVICE_SINGLE_FP_CONFIG = 0x101B;
  WebCL.DEVICE_GLOBAL_MEM_CACHE_TYPE = 0x101C;
  WebCL.DEVICE_GLOBAL_MEM_CACHELINE_SIZE = 0x101D;
  WebCL.DEVICE_GLOBAL_MEM_CACHE_SIZE = 0x101E;
  WebCL.DEVICE_GLOBAL_MEM_SIZE = 0x101F;
  WebCL.DEVICE_MAX_CONSTANT_BUFFER_SIZE = 0x1020;
  WebCL.DEVICE_MAX_CONSTANT_ARGS = 0x1021;
  WebCL.DEVICE_LOCAL_MEM_TYPE = 0x1022;
  WebCL.DEVICE_LOCAL_MEM_SIZE = 0x1023;
  WebCL.DEVICE_ERROR_CORRECTION_SUPPORT = 0x1024;
  WebCL.DEVICE_PROFILING_TIMER_RESOLUTION = 0x1025;
  WebCL.DEVICE_ENDIAN_LITTLE = 0x1026;
  WebCL.DEVICE_AVAILABLE = 0x1027;
  WebCL.DEVICE_COMPILER_AVAILABLE = 0x1028;
  WebCL.DEVICE_EXECUTION_CAPABILITIES = 0x1029;
  WebCL.DEVICE_QUEUE_PROPERTIES = 0x102A;
  WebCL.DEVICE_NAME = 0x102B;
  WebCL.DEVICE_VENDOR = 0x102C;
  WebCL.DRIVER_VERSION = 0x102D;
  WebCL.DEVICE_PROFILE = 0x102E;
  WebCL.DEVICE_VERSION = 0x102F;
  WebCL.DEVICE_EXTENSIONS = 0x1030;
  WebCL.DEVICE_PLATFORM = 0x1031;
  WebCL.DEVICE_DOUBLE_FP_CONFIG = 0x1032;
  WebCL.DEVICE_HALF_FP_CONFIG = 0x1033;
  WebCL.DEVICE_PREFERRED_VECTOR_WIDTH_HALF = 0x1034;
  WebCL.DEVICE_HOST_UNIFIED_MEMORY = 0x1035;
  WebCL.DEVICE_NATIVE_VECTOR_WIDTH_CHAR = 0x1036;
  WebCL.DEVICE_NATIVE_VECTOR_WIDTH_SHORT = 0x1037;
  WebCL.DEVICE_NATIVE_VECTOR_WIDTH_INT = 0x1038;
  WebCL.DEVICE_NATIVE_VECTOR_WIDTH_LONG = 0x1039;
  WebCL.DEVICE_NATIVE_VECTOR_WIDTH_FLOAT = 0x103A;
  WebCL.DEVICE_NATIVE_VECTOR_WIDTH_DOUBLE = 0x103B;
  WebCL.DEVICE_NATIVE_VECTOR_WIDTH_HALF = 0x103C;
  WebCL.DEVICE_OPENCL_C_VERSION = 0x103D;
  WebCL.FP_DENORM = (1<<0);
  WebCL.FP_INF_NAN = (1<<1);
  WebCL.FP_ROUND_TO_NEAREST = (1<<2);
  WebCL.FP_ROUND_TO_ZERO = (1<<3);
  WebCL.FP_ROUND_TO_INF = (1<<4);
  WebCL.FP_FMA = (1<<5);
  WebCL.FP_SOFT_FLOAT = (1<<6);
  WebCL.NONE = 0x0;
  WebCL.READ_ONLY_CACHE = 0x1;
  WebCL.READ_WRITE_CACHE = 0x2;
  WebCL.LOCAL = 0x1;
  WebCL.GLOBAL = 0x2;
  WebCL.EXEC_KERNEL = (1<<0);
  WebCL.EXEC_NATIVE_KERNEL = (1<<1);
  WebCL.QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE = (1<<0);
  WebCL.QUEUE_PROFILING_ENABLE = (1<<1);
  WebCL.CONTEXT_REFERENCE_COUNT = 0x1080;
  WebCL.CONTEXT_DEVICES = 0x1081;
  WebCL.CONTEXT_PROPERTIES = 0x1082;
  WebCL.CONTEXT_NUM_DEVICES = 0x1083;
  WebCL.CONTEXT_PLATFORM = 0x1084;
  WebCL.QUEUE_CONTEXT = 0x1090;
  WebCL.QUEUE_DEVICE = 0x1091;
  WebCL.QUEUE_REFERENCE_COUNT = 0x1092;
  WebCL.QUEUE_PROPERTIES = 0x1093;
  WebCL.MEM_READ_WRITE = (1<<0);
  WebCL.MEM_WRITE_ONLY = (1<<1);
  WebCL.MEM_READ_ONLY = (1<<2);
  WebCL.MEM_USE_HOST_PTR = (1<<3);
  WebCL.MEM_ALLOC_HOST_PTR = (1<<4);
  WebCL.MEM_COPY_HOST_PTR = (1<<5);
  WebCL.R = 0x10B0;
  WebCL.A = 0x10B1;
  WebCL.RG = 0x10B2;
  WebCL.RA = 0x10B3;
  WebCL.RGB = 0x10B4;
  WebCL.RGBA = 0x10B5;
  WebCL.BGRA = 0x10B6;
  WebCL.ARGB = 0x10B7;
  WebCL.INTENSITY = 0x10B8;
  WebCL.LUMINANCE = 0x10B9;
  WebCL.Rx = 0x10BA;
  WebCL.RGx = 0x10BB;
  WebCL.RGBx = 0x10BC;
  WebCL.SNORM_INT8 = 0x10D0;
  WebCL.SNORM_INT16 = 0x10D1;
  WebCL.UNORM_INT8 = 0x10D2;
  WebCL.UNORM_INT16 = 0x10D3;
  WebCL.UNORM_SHORT_565 = 0x10D4;
  WebCL.UNORM_SHORT_555 = 0x10D5;
  WebCL.UNORM_INT_101010 = 0x10D6;
  WebCL.SIGNED_INT8 = 0x10D7;
  WebCL.SIGNED_INT16 = 0x10D8;
  WebCL.SIGNED_INT32 = 0x10D9;
  WebCL.UNSIGNED_INT8 = 0x10DA;
  WebCL.UNSIGNED_INT16 = 0x10DB;
  WebCL.UNSIGNED_INT32 = 0x10DC;
  WebCL.HALF_FLOAT = 0x10DD;
  WebCL.FLOAT = 0x10DE;
  WebCL.MEM_OBJECT_BUFFER = 0x10F0;
  WebCL.MEM_OBJECT_IMAGE2D = 0x10F1;
  WebCL.MEM_OBJECT_IMAGE3D = 0x10F2;
  WebCL.MEM_TYPE = 0x1100;
  WebCL.MEM_FLAGS = 0x1101;
  WebCL.MEM_SIZE = 0x1102;
  WebCL.MEM_HOST_PTR = 0x1103;
  WebCL.MEM_MAP_COUNT = 0x1104;
  WebCL.MEM_REFERENCE_COUNT = 0x1105;
  WebCL.MEM_CONTEXT = 0x1106;
  WebCL.MEM_ASSOCIATED_MEMOBJECT = 0x1107;
  WebCL.MEM_OFFSET = 0x1108;
  WebCL.IMAGE_FORMAT = 0x1110;
  WebCL.IMAGE_ELEMENT_SIZE = 0x1111;
  WebCL.IMAGE_ROW_PITCH = 0x1112;
  WebCL.IMAGE_SLICE_PITCH = 0x1113;
  WebCL.IMAGE_WIDTH = 0x1114;
  WebCL.IMAGE_HEIGHT = 0x1115;
  WebCL.IMAGE_DEPTH = 0x1116;
  WebCL.ADDRESS_NONE = 0x1130;
  WebCL.ADDRESS_CLAMP_TO_EDGE = 0x1131;
  WebCL.ADDRESS_CLAMP = 0x1132;
  WebCL.ADDRESS_REPEAT = 0x1133;
  WebCL.ADDRESS_MIRRORED_REPEAT = 0x1134;
  WebCL.FILTER_NEAREST = 0x1140;
  WebCL.FILTER_LINEAR = 0x1141;
  WebCL.SAMPLER_REFERENCE_COUNT = 0x1150;
  WebCL.SAMPLER_CONTEXT = 0x1151;
  WebCL.SAMPLER_NORMALIZED_COORDS = 0x1152;
  WebCL.SAMPLER_ADDRESSING_MODE = 0x1153;
  WebCL.SAMPLER_FILTER_MODE = 0x1154;
  WebCL.MAP_READ = (1<<0);
  WebCL.MAP_WRITE = (1<<1);
  WebCL.PROGRAM_REFERENCE_COUNT = 0x1160;
  WebCL.PROGRAM_CONTEXT = 0x1161;
  WebCL.PROGRAM_NUM_DEVICES = 0x1162;
  WebCL.PROGRAM_DEVICES = 0x1163;
  WebCL.PROGRAM_SOURCE = 0x1164;
  WebCL.PROGRAM_BINARY_SIZES = 0x1165;
  WebCL.PROGRAM_BINARIES = 0x1166;
  WebCL.PROGRAM_BUILD_STATUS = 0x1181;
  WebCL.PROGRAM_BUILD_OPTIONS = 0x1182;
  WebCL.PROGRAM_BUILD_LOG = 0x1183;
  WebCL.BUILD_SUCCESS = 0;
  WebCL.BUILD_NONE = -1;
  WebCL.BUILD_ERROR = -2;
  WebCL.BUILD_IN_PROGRESS = -3;
  WebCL.KERNEL_FUNCTION_NAME = 0x1190;
  WebCL.KERNEL_NUM_ARGS = 0x1191;
  WebCL.KERNEL_REFERENCE_COUNT = 0x1192;
  WebCL.KERNEL_CONTEXT = 0x1193;
  WebCL.KERNEL_PROGRAM = 0x1194;
  WebCL.KERNEL_WORK_GROUP_SIZE = 0x11B0;
  WebCL.KERNEL_COMPILE_WORK_GROUP_SIZE = 0x11B1;
  WebCL.KERNEL_LOCAL_MEM_SIZE = 0x11B2;
  WebCL.KERNEL_PREFERRED_WORK_GROUP_SIZE_MULTIPLE = 0x11B3;
  WebCL.KERNEL_PRIVATE_MEM_SIZE = 0x11B4;
  WebCL.EVENT_COMMAND_QUEUE = 0x11D0;
  WebCL.EVENT_COMMAND_TYPE = 0x11D1;
  WebCL.EVENT_REFERENCE_COUNT = 0x11D2;
  WebCL.EVENT_COMMAND_EXECUTION_STATUS = 0x11D3;
  WebCL.EVENT_CONTEXT = 0x11D4;
  WebCL.COMMAND_NDRANGE_KERNEL = 0x11F0;
  WebCL.COMMAND_TASK = 0x11F1;
  WebCL.COMMAND_NATIVE_KERNEL = 0x11F2;
  WebCL.COMMAND_READ_BUFFER = 0x11F3;
  WebCL.COMMAND_WRITE_BUFFER = 0x11F4;
  WebCL.COMMAND_COPY_BUFFER = 0x11F5;
  WebCL.COMMAND_READ_IMAGE = 0x11F6;
  WebCL.COMMAND_WRITE_IMAGE = 0x11F7;
  WebCL.COMMAND_COPY_IMAGE = 0x11F8;
  WebCL.COMMAND_COPY_IMAGE_TO_BUFFER = 0x11F9;
  WebCL.COMMAND_COPY_BUFFER_TO_IMAGE = 0x11FA;
  WebCL.COMMAND_MAP_BUFFER = 0x11FB;
  WebCL.COMMAND_MAP_IMAGE = 0x11FC;
  WebCL.COMMAND_UNMAP_MEM_OBJECT = 0x11FD;
  WebCL.COMMAND_MARKER = 0x11FE;
  WebCL.COMMAND_ACQUIRE_GL_OBJECTS = 0x11FF;
  WebCL.COMMAND_RELEASE_GL_OBJECTS = 0x1200;
  WebCL.COMMAND_READ_BUFFER_RECT = 0x1201;
  WebCL.COMMAND_WRITE_BUFFER_RECT = 0x1202;
  WebCL.COMMAND_COPY_BUFFER_RECT = 0x1203;
  WebCL.COMMAND_USER = 0x1204;
  WebCL.COMPLETE = 0x0;
  WebCL.RUNNING = 0x1;
  WebCL.SUBMITTED = 0x2;
  WebCL.QUEUED = 0x3;
  WebCL.BUFFER_CREATE_TYPE_REGION = 0x1220;
  WebCL.PROFILING_COMMAND_QUEUED = 0x1280;
  WebCL.PROFILING_COMMAND_SUBMIT = 0x1281;
  WebCL.PROFILING_COMMAND_START = 0x1282;
  WebCL.PROFILING_COMMAND_END = 0x1283;


  WebCL.CL_SUCCESS = 0;
  WebCL.CL_DEVICE_NOT_FOUND = -1;
  WebCL.CL_DEVICE_NOT_AVAILABLE = -2;
  WebCL.CL_COMPILER_NOT_AVAILABLE = -3;
  WebCL.CL_MEM_OBJECT_ALLOCATION_FAILURE = -4;
  WebCL.CL_OUT_OF_RESOURCES = -5;
  WebCL.CL_OUT_OF_HOST_MEMORY = -6;
  WebCL.CL_PROFILING_INFO_NOT_AVAILABLE = -7;
  WebCL.CL_MEM_COPY_OVERLAP = -8;
  WebCL.CL_IMAGE_FORMAT_MISMATCH = -9;
  WebCL.CL_IMAGE_FORMAT_NOT_SUPPORTED = -10;
  WebCL.CL_BUILD_PROGRAM_FAILURE = -11;
  WebCL.CL_MAP_FAILURE = -12;
  WebCL.CL_MISALIGNED_SUB_BUFFER_OFFSET = -13;
  WebCL.CL_EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST = -14;
  WebCL.CL_INVALID_VALUE = -30;
  WebCL.CL_INVALID_DEVICE_TYPE = -31;
  WebCL.CL_INVALID_PLATFORM = -32;
  WebCL.CL_INVALID_DEVICE = -33;
  WebCL.CL_INVALID_CONTEXT = -34;
  WebCL.CL_INVALID_QUEUE_PROPERTIES = -35;
  WebCL.CL_INVALID_COMMAND_QUEUE = -36;
  WebCL.CL_INVALID_HOST_PTR = -37;
  WebCL.CL_INVALID_MEM_OBJECT = -38;
  WebCL.CL_INVALID_IMAGE_FORMAT_DESCRIPTOR = -39;
  WebCL.CL_INVALID_IMAGE_SIZE = -40;
  WebCL.CL_INVALID_SAMPLER = -41;
  WebCL.CL_INVALID_BINARY = -42;
  WebCL.CL_INVALID_BUILD_OPTIONS = -43;
  WebCL.CL_INVALID_PROGRAM = -44;
  WebCL.CL_INVALID_PROGRAM_EXECUTABLE = -45;
  WebCL.CL_INVALID_KERNEL_NAME = -46;
  WebCL.CL_INVALID_KERNEL_DEFINITION = -47;
  WebCL.CL_INVALID_KERNEL = -48;
  WebCL.CL_INVALID_ARG_INDEX = -49;
  WebCL.CL_INVALID_ARG_VALUE = -50;
  WebCL.CL_INVALID_ARG_SIZE = -51;
  WebCL.CL_INVALID_KERNEL_ARGS = -52;
  WebCL.CL_INVALID_WORK_DIMENSION = -53;
  WebCL.CL_INVALID_WORK_GROUP_SIZE = -54;
  WebCL.CL_INVALID_WORK_ITEM_SIZE = -55;
  WebCL.CL_INVALID_GLOBAL_OFFSET = -56;
  WebCL.CL_INVALID_EVENT_WAIT_LIST = -57;
  WebCL.CL_INVALID_EVENT = -58;
  WebCL.CL_INVALID_OPERATION = -59;
  WebCL.CL_INVALID_GL_OBJECT = -60;
  WebCL.CL_INVALID_BUFFER_SIZE = -61;
  WebCL.CL_INVALID_MIP_LEVEL = -62;
  WebCL.CL_INVALID_GLOBAL_WORK_SIZE = -63;
  WebCL.CL_INVALID_PROPERTY = -64;
  WebCL.CL_VERSION_1_0 = 1;
  WebCL.CL_VERSION_1_1 = 1;
  WebCL.CL_FALSE = 0;
  WebCL.CL_TRUE = 1;
  WebCL.CL_PLATFORM_PROFILE = 0x0900;
  WebCL.CL_PLATFORM_VERSION = 0x0901;
  WebCL.CL_PLATFORM_NAME = 0x0902;
  WebCL.CL_PLATFORM_VENDOR = 0x0903;
  WebCL.CL_PLATFORM_EXTENSIONS = 0x0904;
  WebCL.CL_DEVICE_TYPE_DEFAULT = (1<<0);
  WebCL.CL_DEVICE_TYPE_CPU = (1<<1);
  WebCL.CL_DEVICE_TYPE_GPU = (1<<2);
  WebCL.CL_DEVICE_TYPE_ACCELERATOR = (1<<3);
  WebCL.CL_DEVICE_TYPE_ALL = 0xFFFFFFFF;
  WebCL.CL_DEVICE_TYPE = 0x1000;
  WebCL.CL_DEVICE_VENDOR_ID = 0x1001;
  WebCL.CL_DEVICE_MAX_COMPUTE_UNITS = 0x1002;
  WebCL.CL_DEVICE_MAX_WORK_ITEM_DIMENSIONS = 0x1003;
  WebCL.CL_DEVICE_MAX_WORK_GROUP_SIZE = 0x1004;
  WebCL.CL_DEVICE_MAX_WORK_ITEM_SIZES = 0x1005;
  WebCL.CL_DEVICE_PREFERRED_VECTOR_WIDTH_CHAR = 0x1006;
  WebCL.CL_DEVICE_PREFERRED_VECTOR_WIDTH_SHORT = 0x1007;
  WebCL.CL_DEVICE_PREFERRED_VECTOR_WIDTH_INT = 0x1008;
  WebCL.CL_DEVICE_PREFERRED_VECTOR_WIDTH_LONG = 0x1009;
  WebCL.CL_DEVICE_PREFERRED_VECTOR_WIDTH_FLOAT = 0x100A;
  WebCL.CL_DEVICE_PREFERRED_VECTOR_WIDTH_DOUBLE = 0x100B;
  WebCL.CL_DEVICE_MAX_CLOCK_FREQUENCY = 0x100C;
  WebCL.CL_DEVICE_ADDRESS_BITS = 0x100D;
  WebCL.CL_DEVICE_MAX_READ_IMAGE_ARGS = 0x100E;
  WebCL.CL_DEVICE_MAX_WRITE_IMAGE_ARGS = 0x100F;
  WebCL.CL_DEVICE_MAX_MEM_ALLOC_SIZE = 0x1010;
  WebCL.CL_DEVICE_IMAGE2D_MAX_WIDTH = 0x1011;
  WebCL.CL_DEVICE_IMAGE2D_MAX_HEIGHT = 0x1012;
  WebCL.CL_DEVICE_IMAGE3D_MAX_WIDTH = 0x1013;
  WebCL.CL_DEVICE_IMAGE3D_MAX_HEIGHT = 0x1014;
  WebCL.CL_DEVICE_IMAGE3D_MAX_DEPTH = 0x1015;
  WebCL.CL_DEVICE_IMAGE_SUPPORT = 0x1016;
  WebCL.CL_DEVICE_MAX_PARAMETER_SIZE = 0x1017;
  WebCL.CL_DEVICE_MAX_SAMPLERS = 0x1018;
  WebCL.CL_DEVICE_MEM_BASE_ADDR_ALIGN = 0x1019;
  WebCL.CL_DEVICE_MIN_DATA_TYPE_ALIGN_SIZE = 0x101A;
  WebCL.CL_DEVICE_SINGLE_FP_CONFIG = 0x101B;
  WebCL.CL_DEVICE_GLOBAL_MEM_CACHE_TYPE = 0x101C;
  WebCL.CL_DEVICE_GLOBAL_MEM_CACHELINE_SIZE = 0x101D;
  WebCL.CL_DEVICE_GLOBAL_MEM_CACHE_SIZE = 0x101E;
  WebCL.CL_DEVICE_GLOBAL_MEM_SIZE = 0x101F;
  WebCL.CL_DEVICE_MAX_CONSTANT_BUFFER_SIZE = 0x1020;
  WebCL.CL_DEVICE_MAX_CONSTANT_ARGS = 0x1021;
  WebCL.CL_DEVICE_LOCAL_MEM_TYPE = 0x1022;
  WebCL.CL_DEVICE_LOCAL_MEM_SIZE = 0x1023;
  WebCL.CL_DEVICE_ERROR_CORRECTION_SUPPORT = 0x1024;
  WebCL.CL_DEVICE_PROFILING_TIMER_RESOLUTION = 0x1025;
  WebCL.CL_DEVICE_ENDIAN_LITTLE = 0x1026;
  WebCL.CL_DEVICE_AVAILABLE = 0x1027;
  WebCL.CL_DEVICE_COMPILER_AVAILABLE = 0x1028;
  WebCL.CL_DEVICE_EXECUTION_CAPABILITIES = 0x1029;
  WebCL.CL_DEVICE_QUEUE_PROPERTIES = 0x102A;
  WebCL.CL_DEVICE_NAME = 0x102B;
  WebCL.CL_DEVICE_VENDOR = 0x102C;
  WebCL.CL_DRIVER_VERSION = 0x102D;
  WebCL.CL_DEVICE_PROFILE = 0x102E;
  WebCL.CL_DEVICE_VERSION = 0x102F;
  WebCL.CL_DEVICE_EXTENSIONS = 0x1030;
  WebCL.CL_DEVICE_PLATFORM = 0x1031;
  WebCL.CL_DEVICE_DOUBLE_FP_CONFIG = 0x1032;
  WebCL.CL_DEVICE_HALF_FP_CONFIG = 0x1033;
  WebCL.CL_DEVICE_PREFERRED_VECTOR_WIDTH_HALF = 0x1034;
  WebCL.CL_DEVICE_HOST_UNIFIED_MEMORY = 0x1035;
  WebCL.CL_DEVICE_NATIVE_VECTOR_WIDTH_CHAR = 0x1036;
  WebCL.CL_DEVICE_NATIVE_VECTOR_WIDTH_SHORT = 0x1037;
  WebCL.CL_DEVICE_NATIVE_VECTOR_WIDTH_INT = 0x1038;
  WebCL.CL_DEVICE_NATIVE_VECTOR_WIDTH_LONG = 0x1039;
  WebCL.CL_DEVICE_NATIVE_VECTOR_WIDTH_FLOAT = 0x103A;
  WebCL.CL_DEVICE_NATIVE_VECTOR_WIDTH_DOUBLE = 0x103B;
  WebCL.CL_DEVICE_NATIVE_VECTOR_WIDTH_HALF = 0x103C;
  WebCL.CL_DEVICE_OPENCL_C_VERSION = 0x103D;
  WebCL.CL_FP_DENORM = (1<<0);
  WebCL.CL_FP_INF_NAN = (1<<1);
  WebCL.CL_FP_ROUND_TO_NEAREST = (1<<2);
  WebCL.CL_FP_ROUND_TO_ZERO = (1<<3);
  WebCL.CL_FP_ROUND_TO_INF = (1<<4);
  WebCL.CL_FP_FMA = (1<<5);
  WebCL.CL_FP_SOFT_FLOAT = (1<<6);
  WebCL.CL_NONE = 0x0;
  WebCL.CL_READ_ONLY_CACHE = 0x1;
  WebCL.CL_READ_WRITE_CACHE = 0x2;
  WebCL.CL_LOCAL = 0x1;
  WebCL.CL_GLOBAL = 0x2;
  WebCL.CL_EXEC_KERNEL = (1<<0);
  WebCL.CL_EXEC_NATIVE_KERNEL = (1<<1);
  WebCL.CL_QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE = (1<<0);
  WebCL.CL_QUEUE_PROFILING_ENABLE = (1<<1);
  WebCL.CL_CONTEXT_REFERENCE_COUNT = 0x1080;
  WebCL.CL_CONTEXT_DEVICES = 0x1081;
  WebCL.CL_CONTEXT_PROPERTIES = 0x1082;
  WebCL.CL_CONTEXT_NUM_DEVICES = 0x1083;
  WebCL.CL_CONTEXT_PLATFORM = 0x1084;
  WebCL.CL_QUEUE_CONTEXT = 0x1090;
  WebCL.CL_QUEUE_DEVICE = 0x1091;
  WebCL.CL_QUEUE_REFERENCE_COUNT = 0x1092;
  WebCL.CL_QUEUE_PROPERTIES = 0x1093;
  WebCL.CL_MEM_READ_WRITE = (1<<0);
  WebCL.CL_MEM_WRITE_ONLY = (1<<1);
  WebCL.CL_MEM_READ_ONLY = (1<<2);
  WebCL.CL_MEM_USE_HOST_PTR = (1<<3);
  WebCL.CL_MEM_ALLOC_HOST_PTR = (1<<4);
  WebCL.CL_MEM_COPY_HOST_PTR = (1<<5);
  WebCL.CL_R = 0x10B0;
  WebCL.CL_A = 0x10B1;
  WebCL.CL_RG = 0x10B2;
  WebCL.CL_RA = 0x10B3;
  WebCL.CL_RGB = 0x10B4;
  WebCL.CL_RGBA = 0x10B5;
  WebCL.CL_BGRA = 0x10B6;
  WebCL.CL_ARGB = 0x10B7;
  WebCL.CL_INTENSITY = 0x10B8;
  WebCL.CL_LUMINANCE = 0x10B9;
  WebCL.CL_Rx = 0x10BA;
  WebCL.CL_RGx = 0x10BB;
  WebCL.CL_RGBx = 0x10BC;
  WebCL.CL_SNORM_INT8 = 0x10D0;
  WebCL.CL_SNORM_INT16 = 0x10D1;
  WebCL.CL_UNORM_INT8 = 0x10D2;
  WebCL.CL_UNORM_INT16 = 0x10D3;
  WebCL.CL_UNORM_SHORT_565 = 0x10D4;
  WebCL.CL_UNORM_SHORT_555 = 0x10D5;
  WebCL.CL_UNORM_INT_101010 = 0x10D6;
  WebCL.CL_SIGNED_INT8 = 0x10D7;
  WebCL.CL_SIGNED_INT16 = 0x10D8;
  WebCL.CL_SIGNED_INT32 = 0x10D9;
  WebCL.CL_UNSIGNED_INT8 = 0x10DA;
  WebCL.CL_UNSIGNED_INT16 = 0x10DB;
  WebCL.CL_UNSIGNED_INT32 = 0x10DC;
  WebCL.CL_HALF_FLOAT = 0x10DD;
  WebCL.CL_FLOAT = 0x10DE;
  WebCL.CL_MEM_OBJECT_BUFFER = 0x10F0;
  WebCL.CL_MEM_OBJECT_IMAGE2D = 0x10F1;
  WebCL.CL_MEM_OBJECT_IMAGE3D = 0x10F2;
  WebCL.CL_MEM_TYPE = 0x1100;
  WebCL.CL_MEM_FLAGS = 0x1101;
  WebCL.CL_MEM_SIZE = 0x1102;
  WebCL.CL_MEM_HOST_PTR = 0x1103;
  WebCL.CL_MEM_MAP_COUNT = 0x1104;
  WebCL.CL_MEM_REFERENCE_COUNT = 0x1105;
  WebCL.CL_MEM_CONTEXT = 0x1106;
  WebCL.CL_MEM_ASSOCIATED_MEMOBJECT = 0x1107;
  WebCL.CL_MEM_OFFSET = 0x1108;
  WebCL.CL_IMAGE_FORMAT = 0x1110;
  WebCL.CL_IMAGE_ELEMENT_SIZE = 0x1111;
  WebCL.CL_IMAGE_ROW_PITCH = 0x1112;
  WebCL.CL_IMAGE_SLICE_PITCH = 0x1113;
  WebCL.CL_IMAGE_WIDTH = 0x1114;
  WebCL.CL_IMAGE_HEIGHT = 0x1115;
  WebCL.CL_IMAGE_DEPTH = 0x1116;
  WebCL.CL_ADDRESS_NONE = 0x1130;
  WebCL.CL_ADDRESS_CLAMP_TO_EDGE = 0x1131;
  WebCL.CL_ADDRESS_CLAMP = 0x1132;
  WebCL.CL_ADDRESS_REPEAT = 0x1133;
  WebCL.CL_ADDRESS_MIRRORED_REPEAT = 0x1134;
  WebCL.CL_FILTER_NEAREST = 0x1140;
  WebCL.CL_FILTER_LINEAR = 0x1141;
  WebCL.CL_SAMPLER_REFERENCE_COUNT = 0x1150;
  WebCL.CL_SAMPLER_CONTEXT = 0x1151;
  WebCL.CL_SAMPLER_NORMALIZED_COORDS = 0x1152;
  WebCL.CL_SAMPLER_ADDRESSING_MODE = 0x1153;
  WebCL.CL_SAMPLER_FILTER_MODE = 0x1154;
  WebCL.CL_MAP_READ = (1<<0);
  WebCL.CL_MAP_WRITE = (1<<1);
  WebCL.CL_PROGRAM_REFERENCE_COUNT = 0x1160;
  WebCL.CL_PROGRAM_CONTEXT = 0x1161;
  WebCL.CL_PROGRAM_NUM_DEVICES = 0x1162;
  WebCL.CL_PROGRAM_DEVICES = 0x1163;
  WebCL.CL_PROGRAM_SOURCE = 0x1164;
  WebCL.CL_PROGRAM_BINARY_SIZES = 0x1165;
  WebCL.CL_PROGRAM_BINARIES = 0x1166;
  WebCL.CL_PROGRAM_BUILD_STATUS = 0x1181;
  WebCL.CL_PROGRAM_BUILD_OPTIONS = 0x1182;
  WebCL.CL_PROGRAM_BUILD_LOG = 0x1183;
  WebCL.CL_BUILD_SUCCESS = 0;
  WebCL.CL_BUILD_NONE = -1;
  WebCL.CL_BUILD_ERROR = -2;
  WebCL.CL_BUILD_IN_PROGRESS = -3;
  WebCL.CL_KERNEL_FUNCTION_NAME = 0x1190;
  WebCL.CL_KERNEL_NUM_ARGS = 0x1191;
  WebCL.CL_KERNEL_REFERENCE_COUNT = 0x1192;
  WebCL.CL_KERNEL_CONTEXT = 0x1193;
  WebCL.CL_KERNEL_PROGRAM = 0x1194;
  WebCL.CL_KERNEL_WORK_GROUP_SIZE = 0x11B0;
  WebCL.CL_KERNEL_COMPILE_WORK_GROUP_SIZE = 0x11B1;
  WebCL.CL_KERNEL_LOCAL_MEM_SIZE = 0x11B2;
  WebCL.CL_KERNEL_PREFERRED_WORK_GROUP_SIZE_MULTIPLE = 0x11B3;
  WebCL.CL_KERNEL_PRIVATE_MEM_SIZE = 0x11B4;
  WebCL.CL_EVENT_COMMAND_QUEUE = 0x11D0;
  WebCL.CL_EVENT_COMMAND_TYPE = 0x11D1;
  WebCL.CL_EVENT_REFERENCE_COUNT = 0x11D2;
  WebCL.CL_EVENT_COMMAND_EXECUTION_STATUS = 0x11D3;
  WebCL.CL_EVENT_CONTEXT = 0x11D4;
  WebCL.CL_COMMAND_NDRANGE_KERNEL = 0x11F0;
  WebCL.CL_COMMAND_TASK = 0x11F1;
  WebCL.CL_COMMAND_NATIVE_KERNEL = 0x11F2;
  WebCL.CL_COMMAND_READ_BUFFER = 0x11F3;
  WebCL.CL_COMMAND_WRITE_BUFFER = 0x11F4;
  WebCL.CL_COMMAND_COPY_BUFFER = 0x11F5;
  WebCL.CL_COMMAND_READ_IMAGE = 0x11F6;
  WebCL.CL_COMMAND_WRITE_IMAGE = 0x11F7;
  WebCL.CL_COMMAND_COPY_IMAGE = 0x11F8;
  WebCL.CL_COMMAND_COPY_IMAGE_TO_BUFFER = 0x11F9;
  WebCL.CL_COMMAND_COPY_BUFFER_TO_IMAGE = 0x11FA;
  WebCL.CL_COMMAND_MAP_BUFFER = 0x11FB;
  WebCL.CL_COMMAND_MAP_IMAGE = 0x11FC;
  WebCL.CL_COMMAND_UNMAP_MEM_OBJECT = 0x11FD;
  WebCL.CL_COMMAND_MARKER = 0x11FE;
  WebCL.CL_COMMAND_ACQUIRE_GL_OBJECTS = 0x11FF;
  WebCL.CL_COMMAND_RELEASE_GL_OBJECTS = 0x1200;
  WebCL.CL_COMMAND_READ_BUFFER_RECT = 0x1201;
  WebCL.CL_COMMAND_WRITE_BUFFER_RECT = 0x1202;
  WebCL.CL_COMMAND_COPY_BUFFER_RECT = 0x1203;
  WebCL.CL_COMMAND_USER = 0x1204;
  WebCL.CL_COMPLETE = 0x0;
  WebCL.CL_RUNNING = 0x1;
  WebCL.CL_SUBMITTED = 0x2;
  WebCL.CL_QUEUED = 0x3;
  WebCL.CL_BUFFER_CREATE_TYPE_REGION = 0x1220;
  WebCL.CL_PROFILING_COMMAND_QUEUED = 0x1280;
  WebCL.CL_PROFILING_COMMAND_SUBMIT = 0x1281;
  WebCL.CL_PROFILING_COMMAND_START = 0x1282;
  WebCL.CL_PROFILING_COMMAND_END = 0x1283;

})();
