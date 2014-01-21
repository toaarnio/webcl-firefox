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
                         "createWebCLUserEvent",
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



// Walk through owner chain and look for matching existing object.
function getExistingObjectIfAny (owner, value)
{
  if (!value || !owner) return null;
  try
  {
    let key = value.getIdentity ();
    let obj = null;
    let ownerWalk = owner;
    while (!obj && ownerWalk)
    {
      obj = ownerWalk._findObjectByKey (key);
      if (obj)
      {
        if ("retain" in value)
        {
          value.retain ();
        }

        return obj;
      }

      ownerWalk = ownerWalk._owner;
    }
  }
  catch (e)
  {
    DEBUG("webclconstructors/getExistingObjectIfAny failed: " + e);
  }
  return null;
}



var WebCLPlatform = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLPlatform;1");
function createWebCLPlatform (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLPlatform();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLDevice = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLDevice;1");
function createWebCLDevice (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLDevice();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLContext = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLContext;1");
function createWebCLContext (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLContext();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLCommandQueue = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLCommandQueue;1");
function createWebCLCommandQueue (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLCommandQueue();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLEvent = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLEvent;1");
function createWebCLEvent (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLEvent();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLUserEvent = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLUserEvent;1");
function createWebCLUserEvent (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLUserEvent();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLMemoryObject = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLMemoryObject;1");
function createWebCLMemoryObject (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLMemoryObject();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLBuffer = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLBuffer;1");
function createWebCLBuffer (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLBuffer();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLImage = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLImage;1");
function createWebCLImage (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLImage();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLProgram = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLProgram;1");
function createWebCLProgram (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLProgram();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLKernel = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLKernel;1");
function createWebCLKernel (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLKernel();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}

var WebCLSampler = Components.Constructor ("@webcl.nokiaresearch.com/IWebCLSampler;1");
function createWebCLSampler (owner, value)
{
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WebCLSampler();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
  }
  return o;
}


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

