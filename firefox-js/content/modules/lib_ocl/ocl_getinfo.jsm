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


var EXPORTED_SYMBOLS = [ "getInfo_plain", "getInfo_array", "getInfo_string" ];


const Cu = Components.utils;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_constants.jsm");

Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_exception.jsm");


try {

// Get OpenCL info value for plain types incl. pointer types.
//
// fn:       (CData) OpenCL getInfo function
// internal: (CData ptr) OpenCL resource
// name:     (Number) OpenCL info name
// Type:     (CType) expected data type (result is cast to this)
// extra:    (CData) fn-specific extra argument, delivered after internal
function getInfo_plain (fn, internal, name, Type, extra)
{
// DEBUG("getInfo_plain: " + Type.name);
  try {
    var val = new Type();
    var sze = new ctypes.size_t (0);

    var err = 0;
    if (extra === undefined)
    {
      err = fn (internal, +name,
                Type.size, ctypes.cast (val.address(), T.voidptr_t), sze.address());
    }
    else
    {
      err = fn (internal, extra, +name,
                Type.size, ctypes.cast (val.address(), T.voidptr_t), sze.address());
    }
    if (err) throw new CLError (err);

    if (Type.size != sze.value) throw new CLInternalError ("Unexpected data size " + n.value +
                                                           ", expected " + sze.value);

    return val;
  }
  catch (e)
  {
    if (!(e instanceof CLError))
    {
      ERROR("getInfo_plain("+oclInfoToString(name)+","+Type.name+") failed: " + e);
      e = new CLInternalError (e);
    }
    throw e;
  }
}


// Get OpenCL info value for array types incl. pointer types.
//
// fn:       (CData) OpenCL getInfo function
// internal: (CData ptr) OpenCL resource
// name:     (Number) OpenCL info name
// BaseType: (CType) expected base data type (result array of this)
// extra:    (CData) fn-specific extra argument, delivered after internal
function getInfo_array (fn, internal, name, BaseType, extra)
{
// DEBUG("getInfo_array: " + BaseType.name);
  try {
    var sze = new T.size_t (0);
    var err = 0;
    if (extra === undefined)
    {
      err = fn (internal, +name, 0, null, sze.address());
    }
    else
    {
      err = fn (internal, extra, +name, 0, null, sze.address());
    }
    if (err) throw new CLError (err);

    var len = sze.value / BaseType.size;
    var val = BaseType.array(len)();
    if (extra === undefined)
    {
      err = fn (internal, name,
                sze.value, ctypes.cast(val.address(), T.voidptr_t), null);
    }
    else
    {
      err = fn (internal, extra, name,
                sze.value, ctypes.cast(val.address(), T.voidptr_t), null);
    }
    if (err) throw new CLError (err);

    // TODO: not optimal...
    var rv = [];
    for (var i = 0; i < len; ++i) rv[i] = val[i];
    return rv;
  }
  catch (e)
  {
    if (!(e instanceof CLError))
    {
      ERROR("getInfo_array("+oclInfoToString(name)+","+BaseType.name+") failed: " + e);
      e = new CLInternalError (e);
    }
    throw e;
  }
}


// Get OpenCL info value for strings
//
// fn:       (CData) OpenCL getInfo function
// internal: (CData ptr) OpenCL resource
// name:     (Number) OpenCL info name
// extra:    (CData) fn-specific extra argument, delivered after internal
function getInfo_string (fn, internal, name, extra)
{
// DEBUG("getInfo_string");
  try {
    var sze = new ctypes.size_t (0);
    var err = 0;
    if (extra === undefined)
    {
      err = fn (internal, name, 0, null, sze.address());
    }
    else
    {
      err = fn (internal, extra, name, 0, null, sze.address());
    }
    if (err) throw new CLError (err);

    var val = ctypes.char.array(sze.value)();
    if (extra === undefined)
    {
      err = fn (internal, name,
                sze.value, ctypes.cast(val.address(), ctypes.voidptr_t), null);
    }
    else
    {
      err = fn (internal, extra, name,
                sze.value, ctypes.cast(val.address(), ctypes.voidptr_t), null);
    }
    if (err) throw new CLError (err);

    //return val.readString ();
    return val.readStringReplaceMalformed ();
  }
  catch (e)
  {
    if (!(e instanceof CLError))
    {
      ERROR("getInfo_string("+oclInfoToString(name)+") failed: " + e);
      e = new CLInternalError (e);
    }
    throw e;
  }
}


/*
function getInfo_string_array (fn, internal, name)
{
  try {
    var sze = new ctypes.size_t (0);
    var err = 0;
    err = fn (internal, name, 0, null, sze.address());
    if (err) throw new CLError (err);

    var val = ctypes.char.ptr.array(sze.value)();
    err = fn (internal, name,
              sze.value, ctypes.cast(val.address(), ctypes.voidptr_t), null);
    if (err) throw new CLError (err);

    // The type of val is char**
    // TODO!
  }
  catch (e)
  {
    if (!(e instanceof CLError))
    {
      ERROR("getInfo_string_array("+oclInfoToString(name)+") failed: " + e);
      e = new CLInternalError (e);
    }
    throw e;
  }
}
*/


} catch(e) { ERROR ("getinfo.jsm: " + e + "."); throw e; }
