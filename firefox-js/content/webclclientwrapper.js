(function() {

  if (window.WebCL) return;


  try
  {
    var _handle = new _NokiaWebCL ();
    _handle.init (window);
  }
  catch (e)
  {
    return;
  }


  // == Internal functions =====================================================

  var _ASSERT = function(condition, errorName, errorMsg) {
    if (!condition) {
      throw new WebCLException(errorName, errorMsg);
    }
  }

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
      try {
        var re = /^\[xpconnect wrapped \(?([\w ,]+)\)?\]$/.exec (obj.toString());

        if (re)
        {
          var ifaceList = re[1].split(/\, */);
          for (let i = 0; i < ifaceList.length; ++i)
          {
            // TODO: Image, Buffer and UserEvent are expected to have their
            //       own interface listed before inherited interface.
            switch (ifaceList[i])
            {
              case "IWebCLPlatform":     return new _Platform (obj);
              case "IWebCLDevice":       return new _Device (obj);
              case "IWebCLContext":      return new _Context (obj);
              case "IWebCLProgram":      return new _Program (obj);
              case "IWebCLKernel":       return new _Kernel (obj);
              case "IWebCLCommandQueue": return new _CommandQueue (obj);
              case "IWebCLEvent":        return new _Event (obj);
              case "IWebCLUserEvent":    return new _UserEvent (obj);
              case "IWebCLMemoryObject": return new _MemoryObject (obj);
              case "IWebCLBuffer":       return new _Buffer (obj);
              case "IWebCLImage":        return new _Image (obj);
              case "IWebCLSampler":      return new _Sampler (obj);
            }
          }
        }
      } catch(e) { }
    }
    return obj;
  };

  var _wrapException = function (e, ctx)
  {
    if (e instanceof _WebCLException)
    {
      return e;
    }

    var name = "WEBCL_IMPLEMENTATION_FAILURE", msg = "";

    try {
      var re = /\'WEBCLEXCEPTION\:([\w=]*)\'.*/.exec(e.message);
      if (re)
      {
        var exData = JSON.parse(atob(re[1]));
        if (exData)
        {
          switch (exData.type)
          {
            case "cl":
              name = exData.name;
              msg = exData.message;
              break;

            case "internal":
              name = "WEBCL_IMPLEMENTATION_FAILURE";
              msg = (exData.message ? exData.message : "Internal error.");
              break;

            case "invalidargument":
              name = "INVALID_VALUE";
              msg = exData.message;
              break;

            case "notimplemented":
              name = "WEBCL_IMPLEMENTATION_FAILURE";
              msg = exData.message;
              break;

            default:
              throw "Invalid component exception type.";
          }
        }
      }
    } catch (e2) { msg = "_wrapException: Failed to process exception: " + e2; }

    return new _WebCLException (String(name), String(msg), String(ctx));
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
      if (obj instanceof _UserEvent) return obj._internal;
      if (obj instanceof _MemoryObject) return obj._internal;
      if (obj instanceof _Buffer) return obj._internal;
      if (obj instanceof _Image) return obj._internal;
      if (obj instanceof _Sampler) return obj._internal;

      // NOTE: We may get objects that contain _Base instances as properties,
      //       that would need unwrapping. Simple object cloning won't do since
      //       that would break e.g. ArrayBufferViews.
      //       The workaround is that for now webclutils.unwrapInternalOrNull
      //       will attempt a 2nd stage unwrap on objects with "_internal"
      //       property.
      /*
      var tmp = Object.create (obj.prototype || {});
      var keys = Object.keys(obj);
      for (var k = 0; k < keys.length; ++k)
      {
        if (obj.hasOwnProperty(keys[k]))
        {
          tmp[keys[k]] = _unwrapInternalObject(obj[keys[k]]);
        }
      }
      obj = tmp;
      */
    }
    return obj;
  };

  function _validateInternal (obj)
  {
    if (!obj || !obj._internal)
    {
      var err;
      if (obj instanceof _Context) err = "INVALID_CONTEXT";
      else if (obj instanceof _Program) err = "INVALID_PROGRAM";
      else if (obj instanceof _Kernel) err = "INVALID_KERNEL";
      else if (obj instanceof _CommandQueue) err = "INVALID_COMMAND_QUEUE";
      else if (obj instanceof _Event) err = "INVALID_EVENT";
      else if (obj instanceof _UserEvent) err = "INVALID_EVENT";
      else if (obj instanceof _MemoryObject) err = "INVALID_MEM_OBJECT";
      else if (obj instanceof _Buffer) err = "INVALID_MEM_OBJECT";
      else if (obj instanceof _Image) err = "INVALID_MEM_OBJECT";
      else if (obj instanceof _Sampler) err = "INVALID_SAMPLER";
      else err = "WEBCL_IMPLEMENTATION_FAILURE";

      throw new _WebCLException (err, "Invalid internal object.");
    }
  }

  var _createDefaultFunctionWrapper = function (fname)
  {
    return function ()
    {
      try
      {
        _validateInternal (this);

        var args = Array.prototype.slice.call(arguments);
        var rv = this._internal[fname].apply (this._internal, _unwrapInternalObject(args));
        if (rv !== undefined)
        {
          return _wrapInternalObject (rv);
        }
      }
      catch (e)
      {
        throw _wrapException (e, this._name+"."+fname);
      }
    };
  }

  var alreadyWarned = {};

  var WARN = function(funcName, msg)
  {
    if (!alreadyWarned[funcName]) {
      console.warn(msg);
      alreadyWarned[funcName] = true;
    }
  }


  // == WebCLException ===========================================================
  function _WebCLException (name, msg, ctx) {
    this.name = name || "WEBCL_IMPLEMENTATION_FAILURE";
    this.msg = msg || "Internal error.";
    this.ctx = ctx;
    this.message = "";
    if (this.ctx) this.message += "[" + this.ctx + "] ";
    if (this.name) this.message += (this.ctx ? " " : "") + this.name;
    //if (this.msg) this.message += (this.name ? ": " : "") + this.msg;
  }
  //_WebCLException.prototype = Object.create (DOMException.prototype);

  _WebCLException.prototype.toString = function ()
  {
    return this.message;
  };



  // == WebCLContextProperties ===================================================
  function _WebCLContextProperties (devices, platform, deviceType)
  {
    this.devices = devices || null;
    this.platform = platform || null;
    this.deviceType = deviceType || WebCL.DEVICE_TYPE_DEFAULT;
  }



  // == WebCL ====================================================================
  this.WebCL = { version : "2014-01-23" };
  this.webCL = WebCL;
  this.webcl = WebCL;

  window.WebCLPlatform = _Platform;
  window.WebCLDevice = _Device;
  window.WebCLContext = _Context;
  window.WebCLProgram = _Program;
  window.WebCLKernel = _Kernel;
  window.WebCLCommandQueue = _CommandQueue;
  window.WebCLEvent = _Event;
  window.WebCLUserEvent = _UserEvent;
  window.WebCLMemoryObject = _MemoryObject;
  window.WebCLBuffer = _Buffer;
  window.WebCLImage = _Image;
  window.WebCLSampler = _Sampler;

  window.WebCLException = _WebCLException;
  window.WebCLContextProperties = _WebCLContextProperties;


  WebCL.getPlatforms = function ()
  {
    try
    {
      if (!_ensureWebCLAvailable ()) return;
      return _wrapInternalObject (_handle.getPlatforms ());
    }
    catch (e)
    {
      throw _wrapException (e, this._name+".getPlatforms");
    }
  };

  WebCL.createContext = function()
  {
    try
    {
      if (!_ensureWebCLAvailable()) return;
      var args = _unwrapInternalObject(Array.prototype.slice.call(arguments));
      return _wrapInternalObject (_handle.createContext.apply (_handle, args));
    }
    catch (e)
    {
      throw _wrapException (e, this._name+".createContext");
    }
  };

  WebCL.getSupportedExtensions = function ()
  {
    try
    {
      if (!_ensureWebCLAvailable ()) return;
      var args = _unwrapInternalObject(Array.prototype.slice.call(arguments));
      return _wrapInternalObject (_handle.getSupportedExtensions.apply (_handle, args));
    }
    catch (e)
    {
      throw _wrapException (e, this._name+".getSupportedExtensions");
    }
  }

  WebCL.enableExtension = function ()
  {
    try
    {
      if (!_ensureWebCLAvailable ()) return;
      var args = _unwrapInternalObject(Array.prototype.slice.call(arguments));
      return _wrapInternalObject (_handle.enableExtension.apply (_handle, args));
    }
    catch (e)
    {
      throw _wrapException (e, this._name+".enableExtension");
    }
  }

  WebCL.waitForEvents = function ()
  {
    try
    {
      if (!_ensureWebCLAvailable ()) return;
      var args = _unwrapInternalObject(Array.prototype.slice.call(arguments));
      return _wrapInternalObject (_handle.waitForEvents.apply (_handle, args));
    }
    catch (e)
    {
      throw _wrapException (e, this._name+".waitForEvents");
    }
  };

  WebCL.releaseAll = function() {
    try
    {
      if (!_ensureWebCLAvailable ()) return;
      _handle.releaseAll ();
    }
    catch (e)
    {
      throw _wrapException (e, this._name+".releaseAll");
    }
  }



  // == Base =====================================================================
  function _Base (internal)
  {
    this._internal = internal;
    this._name = "object";

    // TODO: Implement instance equality. Detect owners by "releaseAll".
  }

  _Base.prototype.getInfo = _createDefaultFunctionWrapper ("getInfo");

  _Base.prototype.toString = function () { return "[object " + this._name + "]"; }



  // == Platform =================================================================
  function _Platform (internal)
  {
    if (!this instanceof _Platform) return;
    _Base.call (this, internal);

    this._name = "WebCLPlatform";
  }
  _Platform.prototype = Object.create (_Base.prototype);

  _Platform.prototype.getDevices = _createDefaultFunctionWrapper ("getDevices");
  _Platform.prototype.getSupportedExtensions = _createDefaultFunctionWrapper ("getSupportedExtensions");
  _Platform.prototype.enableExtension = _createDefaultFunctionWrapper ("enableExtension");



  // == Device ===================================================================
  function _Device (internal)
  {
    if (!this instanceof _Device) return;
    _Base.call (this, internal);

    this._name = "WebCLDevice";
  }
  _Device.prototype = Object.create (_Base.prototype);

  _Device.prototype.getSupportedExtensions = _createDefaultFunctionWrapper ("getSupportedExtensions");
  _Device.prototype.enableExtension = _createDefaultFunctionWrapper ("enableExtension");



  // == Context ==================================================================
  function _Context (internal) {
    if (!this instanceof _Context) return; // TODO
    _Base.call (this, internal);

    this._name = "WebCLContext";
  }
  _Context.prototype = Object.create (_Base.prototype);

  _Context.prototype.createBuffer = _createDefaultFunctionWrapper ("createBuffer");
  _Context.prototype.createCommandQueue = _createDefaultFunctionWrapper ("createCommandQueue");
  _Context.prototype.createImage = _createDefaultFunctionWrapper ("createImage");
  _Context.prototype.createProgram = _createDefaultFunctionWrapper ("createProgram");
  _Context.prototype.createSampler = _createDefaultFunctionWrapper ("createSampler");
  _Context.prototype.createUserEvent = _createDefaultFunctionWrapper ("createUserEvent");
  _Context.prototype.getSupportedImageFormats =  _createDefaultFunctionWrapper ("getSupportedImageFormats");
  _Context.prototype.release = _createDefaultFunctionWrapper ("release");
  _Context.prototype.releaseAll = _createDefaultFunctionWrapper ("releaseAll");

  _Context.prototype.getInfo = function (name)
  {
    try
    {
      _validateInternal (this);
      var rv = this._internal.getInfo (_unwrapInternalObject(name));
      if (name == 0x1082) // CONTEXT_PROPERTIES
      {
        return new WebCLContextProperties (rv.devices, rv.platform, rv.deviceType);
      }
      else
      {
        return _wrapInternalObject (rv);
      }
    }
    catch (e)
    {
      throw _wrapException (e, this._name+".getInfo");
    }
  };


  // == Program ==================================================================
  function _Program (internal) {
    if (!this instanceof _Program) return;
    _Base.call (this, internal);

    this._name = "WebCLProgram";
  }
  _Program.prototype = Object.create (_Base.prototype);

  _Program.prototype.getBuildInfo = _createDefaultFunctionWrapper ("getBuildInfo");
  _Program.prototype.build = _createDefaultFunctionWrapper ("build");
  _Program.prototype.createKernel = _createDefaultFunctionWrapper ("createKernel");
  _Program.prototype.createKernelsInProgram = _createDefaultFunctionWrapper ("createKernelsInProgram");
  _Program.prototype.release = _createDefaultFunctionWrapper ("release");



  // == Kernel ===================================================================
  function _Kernel (internal) {
    if (!this instanceof _Kernel) return;
    _Base.call (this, internal);

    this._name = "WebCLKernel";
  }
  _Kernel.prototype = Object.create (_Base.prototype);

  _Kernel.prototype.getWorkGroupInfo = _createDefaultFunctionWrapper ("getWorkGroupInfo");
  _Kernel.prototype.getArgInfo = _createDefaultFunctionWrapper ("getArgInfo");
  _Kernel.prototype.release = _createDefaultFunctionWrapper ("release");
  _Kernel.prototype.setArg = _createDefaultFunctionWrapper ("setArg");



  // == CommandQueue =============================================================
  function _CommandQueue (internal) {
    if (!this instanceof _CommandQueue) return;
    _Base.call (this, internal);

    this._name = "WebCLCommandQueue";
  }
  _CommandQueue.prototype = Object.create (_Base.prototype);

  _CommandQueue.prototype.enqueueCopyBuffer = _createDefaultFunctionWrapper ("enqueueCopyBuffer");
  _CommandQueue.prototype.enqueueCopyBufferRect = _createDefaultFunctionWrapper ("enqueueCopyBufferRect");
  _CommandQueue.prototype.enqueueCopyImage = _createDefaultFunctionWrapper ("enqueueCopyImage");
  _CommandQueue.prototype.enqueueCopyImageToBuffer = _createDefaultFunctionWrapper ("enqueueCopyImageToBuffer");
  _CommandQueue.prototype.enqueueCopyBufferToImage = _createDefaultFunctionWrapper ("enqueueCopyBufferToImage");

  _CommandQueue.prototype.enqueueReadBuffer = _createDefaultFunctionWrapper ("enqueueReadBuffer");
  _CommandQueue.prototype.enqueueReadBufferRect = _createDefaultFunctionWrapper ("enqueueReadBufferRect");
  _CommandQueue.prototype.enqueueReadImage = _createDefaultFunctionWrapper ("enqueueReadImage");

  _CommandQueue.prototype.enqueueWriteBuffer = _createDefaultFunctionWrapper ("enqueueWriteBuffer");
  _CommandQueue.prototype.enqueueWriteBufferRect = _createDefaultFunctionWrapper ("enqueueWriteBufferRect");
  _CommandQueue.prototype.enqueueWriteImage = _createDefaultFunctionWrapper ("enqueueWriteImage");

  _CommandQueue.prototype.enqueueNDRangeKernel = _createDefaultFunctionWrapper ("enqueueNDRangeKernel");
  _CommandQueue.prototype.enqueueMarker = _createDefaultFunctionWrapper ("enqueueMarker");
  _CommandQueue.prototype.enqueueBarrier = _createDefaultFunctionWrapper ("enqueueBarrier");
  _CommandQueue.prototype.enqueueWaitForEvents = _createDefaultFunctionWrapper ("enqueueWaitForEvents");
  _CommandQueue.prototype.finish = _createDefaultFunctionWrapper ("finish");
  _CommandQueue.prototype.flush = _createDefaultFunctionWrapper ("flush");
  _CommandQueue.prototype.release = _createDefaultFunctionWrapper ("release");



  // == Event ====================================================================
  function _Event (internal) {
    if (!this instanceof _Event) return;

    if (!internal)
    {
      internal = new _NokiaWebCLEvent ();
    }

    _Base.call (this, internal);

    this._name = "WebCLEvent";
  }
  _Event.prototype = Object.create (_Base.prototype);

  _Event.prototype.getProfilingInfo = _createDefaultFunctionWrapper ("getProfilingInfo");
  _Event.prototype.setCallback = _createDefaultFunctionWrapper ("setCallback");
  _Event.prototype.release = _createDefaultFunctionWrapper ("release");



  // == UserEvent ================================================================
  function _UserEvent (internal) {
    if (!this instanceof _UserEvent) return;
    _Event.call (this, internal);

    this._name = "WebCLUserEvent";
  }
  _UserEvent.prototype = Object.create (_Event.prototype);
  _UserEvent.prototype.setStatus = _createDefaultFunctionWrapper ("setStatus");



  // == MemoryObject =============================================================
  function _MemoryObject (internal) {
    if (!this instanceof _MemoryObject) return;
    _Base.call (this, internal);

    this._name = "WebCLMemoryObject";
  }
  _MemoryObject.prototype = Object.create (_Base.prototype);

  _MemoryObject.prototype.release = _createDefaultFunctionWrapper ("release");



  // == Buffer ===================================================================
  function _Buffer (internal)
  {
    if (!this instanceof _Buffer) return;
    _MemoryObject.call (this, internal);

    this._name = "WebCLBuffer";
  }
  _Buffer.prototype = Object.create (_MemoryObject.prototype);

  _Buffer.prototype.createSubBuffer = _createDefaultFunctionWrapper ("createSubBuffer");



  // == Image ====================================================================
  function _Image (internal)
  {
    if (!this instanceof _Image) return;
    _MemoryObject.call (this, internal);

    this._name = "WebCLImage";
  }
  _Image.prototype = Object.create (_MemoryObject.prototype);



  // == Sampler ==================================================================
  function _Sampler (internal) {
    if (!this instanceof _Sampler) return;
    _Base.call (this, internal);

    this._name = "WebCLSampler";
  }
  _Sampler.prototype = Object.create (_Base.prototype);

  _Sampler.prototype.release = _createDefaultFunctionWrapper ("release");



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

})();
