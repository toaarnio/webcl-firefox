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


var EXPORTED_SYMBOLS = [
                         "createWebCLPlatform",
                         "createWebCLDevice",
                         "createWebCLContext",
                         "createWebCLCommandQueue",
                         "createWebCLEvent",
                         "createWebCLMemoryObject",
                         "createWebCLBuffer",
                         "createWebCLImage",
                         "createWebCLProgram",
                         "createWebCLKernel",
                         "createWebCLSampler",

                         "createWebCLImageDescriptor"
                       ];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");


var WebCLPlatform = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLPlatform;1");
function createWebCLPlatform (owner) { var o = new WebCLPlatform(); o.wrappedJSObject._register(owner); return o; }

var WebCLDevice = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLDevice;1");
function createWebCLDevice (owner) { var o = new WebCLDevice(); o.wrappedJSObject._register(owner); return o; }

var WebCLContext = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLContext;1");
function createWebCLContext (owner) { var o = new WebCLContext(); o.wrappedJSObject._register(owner); return o; }

var WebCLCommandQueue = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLCommandQueue;1");
function createWebCLCommandQueue (owner) { var o = new WebCLCommandQueue(); o.wrappedJSObject._register(owner); return o; }

var WebCLEvent = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLEvent;1");
function createWebCLEvent (owner) { var o = new WebCLEvent(); o.wrappedJSObject._register(owner); return o; }

var WebCLMemoryObject = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLMemoryObject;1");
function createWebCLMemoryObject (owner) { var o = new WebCLMemoryObject(); o.wrappedJSObject._register(owner); return o; }

var WebCLBuffer = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLBuffer;1");
function createWebCLBuffer (owner) { var o = new WebCLBuffer(); o.wrappedJSObject._register(owner); return o; }

var WebCLImage = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLImage;1");
function createWebCLImage (owner) { var o = new WebCLImage(); o.wrappedJSObject._register(owner); return o; }

var WebCLProgram = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLProgram;1");
function createWebCLProgram (owner) { var o = new WebCLProgram(); o.wrappedJSObject._register(owner); return o; }

var WebCLKernel = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLKernel;1");
function createWebCLKernel (owner) { var o = new WebCLKernel(); o.wrappedJSObject._register(owner); return o; }

var WebCLSampler = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLSampler;1");
function createWebCLSampler (owner) { var o = new WebCLSampler(); o.wrappedJSObject._register(owner); return o; }


var WebCLImageDescriptor = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLImageDescriptor;1");
function createWebCLImageDescriptor (values)
{
  var o = new WebCLImageDescriptor ();
  var keys = [ "channelOrder", "channelType", "width", "height", "rowPitch" ];
  for (var k in keys)
  {
    if (values.hasOwnProperty(keys[k]))
    {
      o[keys[k]] = values[keys[k]];
    }
  }
  return o;
}

