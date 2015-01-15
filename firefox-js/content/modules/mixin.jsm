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


var EXPORTED_SYMBOLS = [ "addMixin" ];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var Exception = Components.Exception;

Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");


// Deep clone an object
function clone (src)
{
  var result;
  if (src && Array.isArray (src))
  {
    result = [];
    for (var i = 0; i < src.length; ++i)
    {
      result[i] = clone (src[i]);
    }
  }
  else if (src && typeof(src) == "object")
  {
    if (src instanceof Date)
    {
      return new Date (src);
    }
    else if (src instanceof RegExp)
    {
      return new RegExp (src);
    }
    else if (src instanceof Error)
    {
      return new Error (src.message); // TODO
    }

    result = Object.create (src.constructor.prototype);

    var keys = Object.keys(src);
    for (var i = 0; i < keys.length; ++i)
    {
      if (src.hasOwnProperty(keys[i]))
      {
        result[keys[i]] = clone (src[keys[i]]);
      }
    }
  }
  else
  {
    result = src;
  }

  return result;
}


function addMixin (target, source)
{
  var _args = Array.prototype.slice.apply (arguments);

  var target = _args.shift();
  var source;
  while (source = _args.shift())
  {
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; ++i)
    {
      var propName = keys[i];
      if (source.hasOwnProperty(propName))
      {
        if (typeof (source[propName]) == "function")
        {
          target[propName] = source[propName];
        }
        else
        {
          target[propName] = clone (source[propName]);
        }
      }
    }
  }
}

