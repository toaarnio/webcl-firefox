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


var EXPORTED_SYMBOLS = [ "LibCLVWrapper" ];

try {

const Cu = Components.utils;
Cu.import ("resource://nrcwebcl/modules/logger.jsm");
Cu.import ("resource://gre/modules/ctypes.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_types.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_clv/clv_symbols.jsm");
Cu.import ("resource://nrcwebcl/modules/lib_clv/clv_libloader.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_clv/clv_program.jsm");

Cu.import ("resource://nrcwebcl/modules/lib_ocl/ocl_exception.jsm");


function LibCLVWrapper (addonLocation)
{
  if (!(this instanceof LibCLVWrapper)) return new LibCLVWrapper(addonLocation);
  this.classDescription = "CLVWrapper";

  this._lib = CLVLibraryInstance.loadLibrary (addonLocation);
}


// Enums / clv_program_status:
LibCLVWrapper.CLV_PROGRAM_VALIDATING = 0;
LibCLVWrapper.prototype.CLV_PROGRAM_VALIDATING = LibCLVWrapper.CLV_PROGRAM_VALIDATING;

LibCLVWrapper.CLV_PROGRAM_ILLEGAL = 1;
LibCLVWrapper.prototype.CLV_PROGRAM_ILLEGAL = LibCLVWrapper.CLV_PROGRAM_ILLEGAL;

LibCLVWrapper.CLV_PROGRAM_ACCEPTED_WITH_WARNINGS = 2;
LibCLVWrapper.prototype.CLV_PROGRAM_ACCEPTED_WITH_WARNINGS = LibCLVWrapper.CLV_PROGRAM_ACCEPTED_WITH_WARNINGS;

LibCLVWrapper.CLV_PROGRAM_ACCEPTED = 3;
LibCLVWrapper.prototype.CLV_PROGRAM_ACCEPTED = LibCLVWrapper.CLV_PROGRAM_ACCEPTED;


// Enums / clv_program_log_level:
LibCLVWrapper.CLV_LOG_MESSAGE_NOTE = 0;
LibCLVWrapper.prototype.CLV_LOG_MESSAGE_NOTE = LibCLVWrapper.CLV_LOG_MESSAGE_NOTE;

LibCLVWrapper.CLV_LOG_MESSAGE_WARNING = 1;
LibCLVWrapper.prototype.CLV_LOG_MESSAGE_WARNING = LibCLVWrapper.CLV_LOG_MESSAGE_WARNING;

LibCLVWrapper.CLV_LOG_MESSAGE_ERROR = 2;
LibCLVWrapper.prototype.CLV_LOG_MESSAGE_ERROR = LibCLVWrapper.CLV_LOG_MESSAGE_ERROR;



LibCLVWrapper.prototype.validate = function (sSource,
                                             asExtensions,
                                             asUserDefines,
                                             fnNotify)
{
  var clErr = new T.cl_int (0);
  var clv_program = new CLVTypes.clv_program ();

  var clv_extensions = null;
  if (asExtensions && Array.isArray(asExtensions) && asExtensions.length)
  {
    clv_extensions = ctypes.char.ptr.array()(asExtensions).address();
  }
  var clv_userDefines = null;
  if (asUserDefines && Array.isArray(asUserDefines) && asUserDefines.length)
  {
    clv_userDefines = ctypes.char.ptr.array()(asUserDefines).address();
  }


  clv_program.value = this._lib.clvValidate (sSource,
                                             clv_extensions,
                                             clv_userDefines,
                                             fnNotify || null,
                                             null, // notify_data
                                             clErr.address());

  if (clErr.value) throw new CLError (clErr.value, null, "validate");

  return new CLVProgram (clv_program, this._lib);
};


LibCLVWrapper.prototype.release = function ()
{
  if (this._lib) CLVLibraryInstance.unloadLibrary (this._lib);
  this._lib = null;
};


function getLibraryName (addonLocation)
{
  return CLVLibraryInstance.getLibraryNameForPlatform (addonLocation);
}
LibCLVWrapper.prototype.getLibraryName = getLibraryName;



} catch(e) { ERROR ("clv_wrapper.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
