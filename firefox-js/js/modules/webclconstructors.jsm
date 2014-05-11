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

Cu.import ("resource://nrcwebcl/modules/webclclasses.jsm");


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



function createWebCLPlatform (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLPlatform",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLPlatform();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLPlatform", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLPlatform", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLDevice (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLDevice",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLDevice();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLDevice", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLDevice", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLContext (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLContext",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLContext();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLContext", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLContext", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLCommandQueue (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLCommandQueue",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLCommandQueue();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLCommandQueue", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLCommandQueue", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLEvent (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLEvent",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLEvent();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLEvent", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLEvent", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLUserEvent (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLUserEvent",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLUserEvent();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLUserEvent", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLUserEvent", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLMemoryObject (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLMemoryObject",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLMemoryObject();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLMemoryObject", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLMemoryObject", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLBuffer (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLBuffer",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLBuffer();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLBuffer", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLBuffer", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLImage (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLImage",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLImage();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLImage", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLImage", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLProgram (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLProgram",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLProgram();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLProgram", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLProgram", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLKernel (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLKernel",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLKernel();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLKernel", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLKernel", "using existing object, key="+o._getIdentity());

  return o;
}

function createWebCLSampler (owner, value)
{
  TRACE_RESOURCES (null, "createWebCLSampler",
                   "owner="+(owner?owner.classDescription:"<null>")
                   +" key="+(value && value.getIdentity?value.getIdentity():"<null>"));
  var o = getExistingObjectIfAny (owner, value);
  if (!o)
  {
    o = new WEBCLCLASSES.WebCLSampler();
    if (value)
    {
      o.wrappedJSObject._internal = value;
      o.wrappedJSObject._identity = value.getIdentity ();
      owner._registerObject (o);
    }
    TRACE_RESOURCES (null, "createWebCLSampler", "new object, key="+o._getIdentity());
    if (owner)
    {
      if (!owner._webclState) INFO ("WARNING: Owner missing _webclState when creating " + o.classDescription);
      o.wrappedJSObject._webclState = owner._webclState;
    }
  }
  else TRACE_RESOURCES (null, "createWebCLSampler", "using existing object, key="+o._getIdentity());

  return o;
}


function createWebCLImageDescriptor (values)
{
  var o = new WEBCLCLASSES.WebCLImageDescriptor ();
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

