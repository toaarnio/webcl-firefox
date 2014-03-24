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
  }
  return o;
}

function createWebCLDevice (owner, value)
{
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
  }
  return o;
}

function createWebCLContext (owner, value)
{
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
  }
  return o;
}

function createWebCLCommandQueue (owner, value)
{
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
  }
  return o;
}

function createWebCLEvent (owner, value)
{
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
  }
  return o;
}

function createWebCLUserEvent (owner, value)
{
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
  }
  return o;
}

function createWebCLMemoryObject (owner, value)
{
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
  }
  return o;
}

function createWebCLBuffer (owner, value)
{
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
  }
  return o;
}

function createWebCLImage (owner, value)
{
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
  }
  return o;
}

function createWebCLProgram (owner, value)
{
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
  }
  return o;
}

function createWebCLKernel (owner, value)
{
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
  }
  return o;
}

function createWebCLSampler (owner, value)
{
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
  }
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

