(function () {
  if (window.webcl) return;

   // == WebCL ====================================================================
  function _WebCL ()
  {
    if (!(this instanceof _WebCL)) return;

    try
    {
      this._identity = window.NRCWebCL.identity;
      this._connector = window.NRCWebCL.WebCL;
      this._name = "WebCL";
    }
    catch(e)
    {
      e = _wrap_error (e, "WebCL");
      console.log ("WebCL: Failed to create or initialize Nokia WebCL Object: " + e);
      throw e;
    }
  };

  _WebCL.prototype = new Object();
  _WebCL.prototype.version = _WebCL.version = window.NRCWebCL.version;
  _WebCL.prototype.getPlatforms = _createDefaultFunctionWrapper ("getPlatforms");
  _WebCL.prototype.createContext = _createDefaultFunctionWrapper ("createContext");
  _WebCL.prototype.getSupportedExtensions = _createDefaultFunctionWrapper ("getSupportedExtensions");
  _WebCL.prototype.enableExtension = _createDefaultFunctionWrapper ("enableExtension");
  _WebCL.prototype.waitForEvents = _createDefaultFunctionWrapper ("waitForEvents");
  _WebCL.prototype.releaseAll = _createDefaultFunctionWrapper ("releaseAll");

  // Add WebCL enums
  for (let name in window.NRCWebCL.enums)
  {
    _WebCL.prototype[name] = _WebCL[name] = window.NRCWebCL.enums[name];
  }



  // == Window ===================================================================
  window.webcl = new _WebCL();
  window.WebCL = _WebCL;
  window.WebCLPlatform = _Platform;
  window.WebCLDevice = _Device;
  window.WebCLContext = _Context;
  window.WebCLProgram = _Program;
  window.WebCLKernel = _Kernel;
  window.WebCLCommandQueue = _CommandQueue;
  window.WebCLMemoryObject = _MemoryObject;
  window.WebCLBuffer = _Buffer;
  window.WebCLImage = _Image;
  window.WebCLSampler = _Sampler;
  window.WebCLEvent = _Event;
  window.WebCLUserEvent = _UserEvent;
  window.WebCLImageDescriptor = _ImageDescriptor;
  window.WebCLKernelArgInfo = _KernelArgInfo;
  window.WebCLException = _WebCLException;



  // == Base =====================================================================
  function _Base (identity)
  {
    Object.defineProperty (this, "_identity", { writable: true, value: identity });
    Object.defineProperty (this, "_connector", { writable: true, value: null });
    Object.defineProperty (this, "_name", { writable: true, value: "object" });
  }

  _Base.prototype.getInfo = _createDefaultFunctionWrapper ("getInfo");

  _Base.prototype.toString = function () { return "[object " + this._name + "]"; }



  // == Platform =================================================================
  function _Platform (identity)
  {
    if (!(this instanceof _Platform)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLPlatform;
    this._name = "WebCLPlatform";
  }
  _Platform.prototype = Object.create (_Base.prototype);

  _Platform.prototype.getDevices = _createDefaultFunctionWrapper ("getDevices");
  _Platform.prototype.getSupportedExtensions = _createDefaultFunctionWrapper ("getSupportedExtensions");
  _Platform.prototype.enableExtension = _createDefaultFunctionWrapper ("enableExtension");



  // == Device ===================================================================
  function _Device (identity)
  {
    if (!(this instanceof _Device)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLDevice;
    this._name = "WebCLDevice";
  }
  _Device.prototype = Object.create (_Base.prototype);

  _Device.prototype.getSupportedExtensions = _createDefaultFunctionWrapper ("getSupportedExtensions");
  _Device.prototype.enableExtension = _createDefaultFunctionWrapper ("enableExtension");



  // == Context ==================================================================
  function _Context (identity) {
    if (!(this instanceof _Context)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLContext;
    this._name = "WebCLContext";
  }
  _Context.prototype = Object.create (_Base.prototype);

  _Context.prototype.createBuffer = _createDefaultFunctionWrapper ("createBuffer");
  _Context.prototype.createCommandQueue = _createDefaultFunctionWrapper ("createCommandQueue");
  _Context.prototype.createImage = _createDefaultFunctionWrapper ("createImage");
  _Context.prototype.createProgram = _createDefaultFunctionWrapper ("createProgram");
  _Context.prototype.createSampler = _createDefaultFunctionWrapper ("createSampler");
  _Context.prototype.createUserEvent = _createDefaultFunctionWrapper ("createUserEvent");
  _Context.prototype.getSupportedImageFormats = _createDefaultFunctionWrapper ("getSupportedImageFormats");
  _Context.prototype.release = _createDefaultFunctionWrapper ("release");
  _Context.prototype.releaseAll = _createDefaultFunctionWrapper ("releaseAll");



  // == Program ==================================================================
  function _Program (identity) {
    if (!(this instanceof _Program)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLProgram;
    this._name = "WebCLProgram";
  }
  _Program.prototype = Object.create (_Base.prototype);

  _Program.prototype.getBuildInfo = _createDefaultFunctionWrapper ("getBuildInfo");
  _Program.prototype.build = _createDefaultFunctionWrapper ("build");
  _Program.prototype.createKernel = _createDefaultFunctionWrapper ("createKernel");
  _Program.prototype.createKernelsInProgram = _createDefaultFunctionWrapper ("createKernelsInProgram");
  _Program.prototype.release = _createDefaultFunctionWrapper ("release");



  // == Kernel ===================================================================
  function _Kernel (identity) {
    if (!(this instanceof _Kernel)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLKernel;
    this._name = "WebCLKernel";
  }
  _Kernel.prototype = Object.create (_Base.prototype);

  _Kernel.prototype.getWorkGroupInfo = _createDefaultFunctionWrapper ("getWorkGroupInfo");
  _Kernel.prototype.getArgInfo = _createDefaultFunctionWrapper ("getArgInfo");
  _Kernel.prototype.setArg = _createDefaultFunctionWrapper ("setArg");
  _Kernel.prototype.release = _createDefaultFunctionWrapper ("release");



  // == CommandQueue =============================================================
  function _CommandQueue (identity) {
    if (!(this instanceof _CommandQueue)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLCommandQueue;
    this._name = "WebCLCommandQueue";
  }
  _CommandQueue.prototype = Object.create (_Base.prototype);

  _CommandQueue.prototype.enqueueCopyBuffer = _createDefaultFunctionWrapper ("enqueueCopyBuffer");
  _CommandQueue.prototype.enqueueCopyBufferRect = _createDefaultFunctionWrapper ("enqueueCopyBufferRect");
  _CommandQueue.prototype.enqueueCopyImage = _createDefaultFunctionWrapper ("enqueueCopyImage");
  _CommandQueue.prototype.enqueueCopyImageToBuffer = _createDefaultFunctionWrapper ("enqueueCopyImageToBuffer");
  _CommandQueue.prototype.enqueueCopyBufferToImage = _createDefaultFunctionWrapper ("enqueueCopyBufferToImage");

  _CommandQueue.prototype.enqueueReadBuffer = _createDefaultFunctionWrapper ("enqueueReadBuffer",
    create_commandQueue_readBuffer_preproc(4),
    create_commandQueue_readBuffer_postproc(4));
  _CommandQueue.prototype.enqueueReadBufferRect = _createDefaultFunctionWrapper ("enqueueReadBufferRect",
    create_commandQueue_readBuffer_preproc(9),
    create_commandQueue_readBuffer_postproc(9));
  _CommandQueue.prototype.enqueueReadImage = _createDefaultFunctionWrapper ("enqueueReadImage",
    create_commandQueue_readBuffer_preproc(5),
    create_commandQueue_readBuffer_postproc(5));

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


  //
  function create_commandQueue_readBuffer_preproc (hostBufferArgIdx)
  {
    return function (args, procCtx)
    {
      let blockingRead = procCtx.originalArguments[1];
      if (!!blockingRead)
      {
        // Synchronous
        procCtx.sync = true;
      }
      else
      {
        procCtx.sync = false;

        try {
          // Get the TypedArray host buffer argument
          procCtx.targetBuf = procCtx.originalArguments[hostBufferArgIdx];

          // Ensure host buffer seems valid. If not, give up and let
          // someone else handle with the problem.
          if (!procCtx.targetBuf || typeof(procCtx.targetBuf) != "object" && procCtx.targetBuf.buffer) {
            return args;
          }

          // Get and validate event argument, if given
          let ev = procCtx.originalArguments[hostBufferArgIdx+2],
              okToRelease = false;
          if (ev && !(ev instanceof window.WebCLEvent)) {
            return args;
          }

          // Generate transient object ID and let frame script know
          // it and the size of the replacement TypedArray it needs to
          // generate by replacing the TypedArray argument.
          procCtx.transientObjectId = window.NRCWebCL.WebCL._getUUID ();

          // Create a dummy argument to replace the host buffer and relay
          // the relevant information to chrome process.
          args[hostBufferArgIdx] = { bufByteSize: procCtx.targetBuf.byteLength,
                                     transientId: procCtx.transientObjectId };

          // If the user didn't give an event, we'll create our own.
          if (!ev)
          {
            ev = new window.WebCLEvent();
            okToRelease = true;

            args[hostBufferArgIdx+2] = ev;
          }

          // Hook to COMPLETE event. Then get the transient data containing
          // the actual result ArrayBuffer content from the frame script.
          // Finally, write new data to original argument TypedArray.
          ev.setCallback (WebCL.COMPLETE, function ()
          {
            var data = window.NRCWebCL.WebCL._getTransient (procCtx.transientObjectId);

            // Get compatible view to target buffer and set its contents from
            // the transient data.
            (new Uint8Array(procCtx.targetBuf.buffer)).set(data);

            if (okToRelease) ev.release ();
          });
        }
        catch (e) {
          // Failed to mangle args, maybe the typed array wasn't a typed array.
          procCtx.failure = true;
          args[hostBufferArgIdx] = procCtx.originalArguments[hostBufferArgIdx];
        }
      }
      return args;
    }
  }
  function create_commandQueue_readBuffer_postproc (hostBufferArgIdx)
  {
    return function (rv, args, procCtx)
    {
      if (procCtx.failure) return args;

      if (procCtx.sync)
      {
        if (!rv.error)
        {
          try{
            let tmp = new Uint8Array(rv.value.x);
            let target = procCtx.originalArguments[hostBufferArgIdx];
            (new Uint8Array(target.buffer)).set(tmp);
          }
          catch(e){
            console.error("[clientwrapper.js] create_commandQueue_readBuffer_postproc"+
                          "Failed to set target TypedArray: "+e+"\n"+e.stack);
            rv = { error: { name: "WEBCL_IMPLEMENTATION_FAILURE",
                            message: "",
                            ctx: procCtx.className + "." + procCtx.fname,
                            type: "internal" } };
          }
        }
      }
      else
      {
        // Nothing to do here, the magic takes place in a callback.
      }
      return rv;
    }
  }



  // == MemoryObject =============================================================
  function _MemoryObject (identity) {
    if (!(this instanceof _MemoryObject)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLMemoryObject;
    this._name = "WebCLMemoryObject";
  }
  _MemoryObject.prototype = Object.create (_Base.prototype);

  _MemoryObject.prototype.release = _createDefaultFunctionWrapper ("release");



  // == Buffer ===================================================================
  function _Buffer (identity)
  {
    if (!(this instanceof _Buffer)) return;
    _MemoryObject.call (this, identity);

    this._connector = window.NRCWebCL.WebCLMemoryObject;
    this._name = "WebCLBuffer";
  }
  _Buffer.prototype = Object.create (_MemoryObject.prototype);

  _Buffer.prototype.createSubBuffer = _createDefaultFunctionWrapper ("createSubBuffer");



  // == Image ====================================================================
  function _Image (identity)
  {
    if (!(this instanceof _Image)) return;
    _MemoryObject.call (this, identity);

    this._connector = window.NRCWebCL.WebCLMemoryObject;
    this._name = "WebCLImage";
  }
  _Image.prototype = Object.create (_MemoryObject.prototype);



  // == Sampler ==================================================================
  function _Sampler (identity) {
    if (!(this instanceof _Sampler)) return;
    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLSampler;
    this._name = "WebCLSampler";
  }
  _Sampler.prototype = Object.create (_Base.prototype);

  _Sampler.prototype.release = _createDefaultFunctionWrapper ("release");



  // == Event ====================================================================
  function _Event (identity) {
    if (!(this instanceof _Event)) return;

    // NOTE: Event's identity can be undefined or null

    _Base.call (this, identity);

    this._connector = window.NRCWebCL.WebCLEvent;
    this._name = "WebCLEvent";
  }
  _Event.prototype = Object.create (_Base.prototype);

  _Event.prototype.getProfilingInfo = _createDefaultFunctionWrapper ("getProfilingInfo");
  _Event.prototype.setCallback = _createDefaultFunctionWrapper ("setCallback");
  _Event.prototype.release = _createDefaultFunctionWrapper ("release");



  // == UserEvent ================================================================
  function _UserEvent (identity) {
    if (!(this instanceof _UserEvent)) return;
    _Event.call (this, identity);

    this._connector = window.NRCWebCL.WebCLEvent;
    this._name = "WebCLUserEvent";
  }
  _UserEvent.prototype = Object.create (_Event.prototype);

  _UserEvent.prototype.setStatus = _createDefaultFunctionWrapper ("setStatus");



  // == ImageDescriptor ==================================================================
  function _ImageDescriptor (identity) {
// TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (!(this instanceof _ImageDescriptor)) return;

    _Base.call (this, identity);

    this._name = "WebCLImageDescriptor";
  }
  _ImageDescriptor.prototype = Object.create (_Base.prototype);

  _ImageDescriptor.prototype.channelOrder = 0;
  _ImageDescriptor.prototype.channelType = 0;
  _ImageDescriptor.prototype.width = 0;
  _ImageDescriptor.prototype.height = 0;
  _ImageDescriptor.prototype.rowPitch = 0;
  delete _ImageDescriptor.prototype.getInfo;



  // == WebCLKernelArgInfo =====================================================
  function _KernelArgInfo (value)
  {
    this.name =             value ? value.name || null : null;
    this.typeName =         value ? value.typeName || null : null;
    this.addressQualifier = value ? value.addressQualifier || null : null;
    this.accessQualifier =  value ? value.accessQualifier || null : null;
  }

  _KernelArgInfo.prototype.name = null;
  _KernelArgInfo.prototype.typeName = null;
  _KernelArgInfo.prototype.addressQualifier = null;
  _KernelArgInfo.prototype.accessQualifier = null;



  // == WebCLException ===========================================================
  function _WebCLException (name, message, ctx) {
    this.name = name || "WEBCL_IMPLEMENTATION_FAILURE";
    this.message = message;
    this.ctx = ctx;
  }
  _WebCLException.prototype = new Object();

  _WebCLException.prototype.toString = function ()
  {
    return "[" + this.ctx + "] " + this.name + ": " + this.message;
  };



  // == Internal functions =====================================================

  // Wrap connector return value objects
  function _wrap_rv (val)
  {
    if (!val) return val;

    if (val.error)
    {
      return _wrap_error (val);
    }

    switch (val.type)
    {
      case "array":
        return Array.prototype.map.call (val.value, _wrap_rv);

      case "typedarray":
        return val.value;

      case "webclobj":
      {
        if (val.className)
        {
          switch (val.className)
          {
            case "WebCLPlatform":        return _createInstance (_Platform, val.value);
            case "WebCLDevice":          return _createInstance (_Device, val.value);
            case "WebCLContext":         return _createInstance (_Context, val.value);
            case "WebCLProgram":         return _createInstance (_Program, val.value);
            case "WebCLKernel":          return _createInstance (_Kernel, val.value);
            case "WebCLCommandQueue":    return _createInstance (_CommandQueue, val.value);
            case "WebCLMemoryObject":    return _createInstance (_MemoryObject, val.value);
            case "WebCLBuffer":          return _createInstance (_Buffer, val.value);
            case "WebCLImage":           return _createInstance (_Image, val.value);
            case "WebCLSampler":         return _createInstance (_Sampler, val.value);
            case "WebCLEvent":           return _createInstance (_Event, val.value);
            case "WebCLUserEvent":       return _createInstance (_UserEvent, val.value);
            case "WebCLImageDescriptor": {
              let o = _createInstance (_ImageDescriptor, val.value);
              if (val.extra) {
                if (val.extra.channelOrder) o.channelOrder = val.extra.channelOrder;
                if (val.extra.channelType) o.channelType = val.extra.channelType;
                if (val.extra.width) o.width = val.extra.width;
                if (val.extra.height) o.height = val.extra.height;
                if (val.extra.rowPitch) o.rowPitch = val.extra.rowPitch;
              }
              return o;
            }
            case "WebCLKernelArgInfo":   return new WebCLKernelArgInfo (val.value);
          }
        }
        return null;
      }
      break;

      case "plain":
        return val.value;

      default:
        console.error ("[WebCL clientwrapper.js] _wrap_rv: unknown value type \""+val.type+"\".");
    }
  }

  function _wrap_error (val, ctx)
  {
    if (val instanceof _WebCLException || val instanceof TypeError)
    {
      if (ctx) val.ctx = ctx;
      return val;
    }
    else if (val.error)
    {
      if (val.error.type == "typeerror")
      {
        return new TypeError (val.error.message, val.error.fileName, val.error.lineNumber);
      }

      ctx = ctx || val.error.ctx || " [" + val.error.fileName + ":" + val.error.lineNumber + "]";
      return new _WebCLException (val.error.name, val.error.message, ctx);
    }
    else
    {
      return new _WebCLException ("WEBCL_IMPLEMENTATION_FAILURE", undefined, ctx);
    }
  }


  function _unwrap (val)
  {
    return val;
  }


  function _createDefaultFunctionWrapper (fname, preProcFn, postProcFn)
  {
    return function ()
    {
      try
      {
// console.log("P "+this._name+"."+fname+"("+JSON.stringify(Array.prototype.slice.call(arguments))+")");

        if (!(this instanceof _WebCL) && !this._identity) {

          // Special case: WebCLEvents can be created in page context without
          // identity: it's filled in later in frame script (mangleArgs).
          if (!(this instanceof _Event))
          {
            let errName = _getInvalidObjectErrorName (this);
            throw new _WebCLException (errName,
                                      "Invalid identity: " + this._name,
                                      "_validateInternal");
          }
        }

        let args = Array.prototype.slice.call(arguments);


        var procCtx = { originalArguments: arguments,
                        className: this._connector.className,
                        fname: fname
                      };


        if (preProcFn && typeof(preProcFn) == "function")
        {
          args = preProcFn (args, procCtx);
        }


        // Special handling for release & releaseAll
        try
        {
          if (fname === "releaseAll")
          {
            let managedWrapperList = this._internal.getManagedIdentityList ();
            managedWrapperList.forEach(_unregisterWrapperInstance);
            _unregisterWrapperInstance (this._identity);
          }
          else if (fname === "release")
          {
            _unregisterWrapperInstance (this._identity);
          }
        }
        catch (e)
        {
          console.log ("WebCL client wrapper internal error: Failed to unregister wrapper on " + fname + ": " + e);
        }


        //let rv = this._connector[fname].apply (this, Array.prototype.map.call(args, _unwrap));
        let rv = this._connector[fname].apply (this, args);

        if (postProcFn && typeof(postProcFn) == "function")
        {
          rv = postProcFn (rv, args, procCtx);
        }

        rv = _wrap_rv (rv);

// console.log("P "+this._name+"."+fname+" ==> "+JSON.stringify(rv));
        if (rv instanceof _WebCLException) throw rv;
        if (rv instanceof TypeError) throw rv;

        return rv;
      }
      catch (e)
      {
        console.log (e+e.stack);
        throw _wrap_error (e, this._name+"."+fname);
      }
    };
  };


  function _getInvalidObjectErrorName (obj)
  {
    if (obj instanceof _WebCL)                return "WEBCL_IMPLEMENTATION_FAILURE";
    else if (obj instanceof _Context)         return "INVALID_CONTEXT";
    else if (obj instanceof _Program)         return "INVALID_PROGRAM";
    else if (obj instanceof _Kernel)          return "INVALID_KERNEL";
    else if (obj instanceof _CommandQueue)    return "INVALID_COMMAND_QUEUE";
    else if (obj instanceof _MemoryObject)    return "INVALID_MEM_OBJECT";
    else if (obj instanceof _Buffer)          return "INVALID_MEM_OBJECT";
    else if (obj instanceof _Image)           return "INVALID_MEM_OBJECT";
    else if (obj instanceof _Sampler)         return "INVALID_SAMPLER";
    else if (obj instanceof _Event)           return "INVALID_EVENT";
    else if (obj instanceof _UserEvent)       return "INVALID_EVENT";
    else if (obj instanceof _ImageDescriptor) return "INVALID_IMAGE_FORMAT_DESCRIPTOR";
    // else if (obj instanceof _KernelArgInfo) ; // NOTE: We don't expect to handle WebCLKernelArgInfo.
    else
      return "WEBCL_IMPLEMENTATION_FAILURE";
  }


  function IMPLEMENTATION_FAILURE ()
  {
    return new _WebCLException("WEBCL_IMPLEMENTATION_FAILURE");
  }



  // == Life cycle management ====================================================

  var gWrapperRegistry = {};

  function _createInstance(clazz, identity)
  {
    let wrapper = _lookForExistingWrapperInstance(identity);
    if (!wrapper)
    {
      wrapper = new clazz (identity);
      _registerWrapperInstance (wrapper);
    }
    return wrapper;
  }


  function _lookForExistingWrapperInstance (identity)
  {
    if (identity in gWrapperRegistry)
    {
      return gWrapperRegistry[identity].wrapper;
    }
    return null;
  }


  function _registerWrapperInstance (wrapper)
  {
    if (!(wrapper instanceof _Base))
    {
      let msg = "Bad wrapper instance, expected _Base, got: " + wrapper;
      console.log ("WebCL wrapper internal error: " + msg);
      throw new WebCLException (null, msg);
    }

    if (!wrapper._identity)
    {
      // Missing identity
      // console.log ("_registerWrapperInstance: missing identity!");
      return;
    }

    if (wrapper._identity in gWrapperRegistry)
    {
      // Identity already in registry
      // console.log ("_registerWrapperInstance: identity already in registry: " + wrapper._identity + "!");
      return;
    }

    // Create new container in registry
    gWrapperRegistry[wrapper._identity] = { wrapper: wrapper, refCnt: 1 };
  }


  function _unregisterWrapperInstance (wrapperOrIdentity)
  {
    let identity = null;
    if (wrapperOrIdentity instanceof _Base)
    {
      identity = wrapperOrIdentity._identity;
    }
    else
    {
      identity = wrapperOrIdentity;
    }

    if (identity && identity in gWrapperRegistry)
    {
      let container = gWrapperRegistry[identity];
      if (container.refCnt > 1)
      {
        --container.refCnt;
      }
      else
      {
        container.refCnt = 0;
        container.wrapper = null;
        delete gWrapperRegistry[identity];
      }
    }
    else
    {
      // console.log ("_unregisterWrapperInstance: identity " + identity + " not found!");
    }
  }

})();
