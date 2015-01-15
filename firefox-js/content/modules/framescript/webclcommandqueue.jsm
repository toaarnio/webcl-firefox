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


var EXPORTED_SYMBOLS = [ "createConnector_WebCLCommandQueue" ];

try
{

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;


  Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
  Cu.import ("chrome://nrcwebcl/content/modules/framescript/misc.jsm");


  function createConnector_WebCLCommandQueue (ctx)
  {
    var className = "WebCLCommandQueue";

    return {
      enqueueCopyBuffer: createFnWrapper (ctx, className, "enqueueCopyBuffer"),
      enqueueCopyBufferRect: createFnWrapper (ctx, className, "enqueueCopyBufferRect"),
      enqueueCopyImage: createFnWrapper (ctx, className, "enqueueCopyImage"),
      enqueueCopyImageToBuffer: createFnWrapper (ctx, className, "enqueueCopyImageToBuffer"),
      enqueueCopyBufferToImage: createFnWrapper (ctx, className, "enqueueCopyBufferToImage"),
      enqueueReadBuffer: createFnWrapper (ctx, className, "enqueueReadBuffer"),
      enqueueReadBufferRect: createFnWrapper (ctx, className, "enqueueReadBufferRect"),
      enqueueReadImage: createFnWrapper (ctx, className, "enqueueReadImage"),
      enqueueWriteBuffer: createFnWrapper (ctx, className, "enqueueWriteBuffer"),
      enqueueWriteBufferRect: createFnWrapper (ctx, className, "enqueueWriteBufferRect"),
      enqueueWriteImage: createFnWrapper (ctx, className, "enqueueWriteImage"),
      enqueueNDRangeKernel: createFnWrapper (ctx, className, "enqueueNDRangeKernel"),
      enqueueMarker: createFnWrapper (ctx, className, "enqueueMarker"),
      enqueueBarrier: createFnWrapper (ctx, className, "enqueueBarrier"),
      enqueueWaitForEvents: createFnWrapper (ctx, className, "enqueueWaitForEvents"),
      finish: createFnWrapper (ctx, className, "finish"),
      flush: createFnWrapper (ctx, className, "flush"),
      getInfo: createFnWrapper (ctx, className, "getInfo"),
      release: createFnWrapper (ctx, className, "release")
    };
  }

  // NOTE: It seems at least typed arrays are copied over frame/page boundary,
  //       so for that reason we can't write the chrome->frame copy of a typed
  //       array to its final destination here. This affects enqueueReadBuffer,
  //       enqueueReadBufferRect and enqueueReadImage.
}
catch (e)
{
  let s = (e&&e.stack ? "\n"+e.stack : "");
  ERROR("modules/framescript/webclcommandqueue.jsm failed: "+e+s);
}
