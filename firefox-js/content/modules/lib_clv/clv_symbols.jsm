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


var EXPORTED_SYMBOLS = [ "CLVSymbolDetails", "CLVTypes" ];

const Cu = Components.utils;

Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");


try {

// see: https://github.com/KhronosGroup/webcl-validator/blob/master/include/clv/clv.h

var T_clv_program = ctypes.voidptr_t;
// TODO: Do we need to handle T_clv_program_status as 64-bit value on 64-bit systems
var T_clv_program_status = ctypes.int32_t;
// TODO: Do we need to handle T_clv_program_log_level as 64-bit value on 64-bit systems
var T_clv_program_log_level = ctypes.int32_t;

var T_callback_clv_validate = ctypes.FunctionType(ctypes.default_abi,
                                                  ctypes.void_t,
                                                  [ T_clv_program, ctypes.voidptr_t ]);

var CLVTypes = {
  clv_program: T_clv_program,
  clv_program_status: T_clv_program_status,
  clv_program_log_level: T_clv_program_log_level,

  callback_clv_validate: T_callback_clv_validate
};

var CLVSymbolDetails = [
  { name: "clvValidate",
    rv:   T_clv_program,
    args: [ ctypes.char.ptr,            // input_source
            ctypes.char.ptr.ptr,        // active_extensions
            ctypes.char.ptr.ptr,        // user_defines
            T_callback_clv_validate.ptr,// pfn_notify
            ctypes.voidptr_t,           // notify_data
            T.cl_int.ptr                // errcode_ret
          ]
  },
  { name: "clvGetProgramStatus",
    rv:   T_clv_program_status,
    args: [ T_clv_program ]             // program
  },
  { name: "clvGetProgramLogMessageCount",
    rv:   T.cl_int,
    args: [ T_clv_program ]             // program
  },
  { name: "clvGetProgramLogMessageLevel",
    rv:   T_clv_program_log_level,
    args: [ T_clv_program,              // program
            T.cl_uint                   // n
          ]
  },
  { name: "clvGetProgramLogMessageText",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // n
            ctypes.size_t,              // buf_size
            ctypes.char.ptr,            // buf
            ctypes.size_t.ptr           // size_ret
          ]
  },
  { name: "clvProgramLogMessageHasSource",
    rv:   T.cl_bool,
    args: [ T_clv_program,              // program
            T.cl_uint                   // n
          ]
  },
  { name: "clvGetProgramLogMessageSourceOffset",
    rv:   T.cl_long,
    args: [ T_clv_program,              // program
            T.cl_uint                   // n
          ]
  },
  { name: "clvGetProgramLogMessageSourceLen",
    rv:   ctypes.size_t,
    args: [ T_clv_program,              // program
            T.cl_uint                   // n
          ]
  },
  { name: "clvGetProgramLogMessageSourceText",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // n
            T.cl_long,                  // offset
            ctypes.size_t,              // len
            ctypes.size_t,              // buf_size
            ctypes.char.ptr,            // buf
            ctypes.size_t.ptr           // size_ret
          ]
  },
  { name: "clvGetProgramKernelCount",
    rv:   T.cl_int,
    args: [ T_clv_program ]             // program
  },
  { name: "clvGetProgramKernelName",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // n
            ctypes.size_t,              // name_buf_size
            ctypes.char.ptr,            // name_buf
            ctypes.size_t.ptr           // name_size_ret
          ]
  },
  { name: "clvGetKernelArgCount",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            T.cl_uint                   // n
          ]
  },
  { name: "clvGetKernelArgName",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // kernel
            T.cl_uint,                  // arg
            ctypes.size_t,              // name_buf_size
            ctypes.char.ptr,            // name_buf
            ctypes.size_t.ptr           // name_size_ret
          ]
  },
  { name: "clvGetKernelArgType",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // kernel
            T.cl_uint,                  // arg
            ctypes.size_t,              // type_buf_size
            ctypes.char.ptr,            // type_buf
            ctypes.size_t.ptr           // type_size_ret
          ]
  },
  { name: "clvKernelArgIsPointer",
    rv:   T.cl_bool,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // kernel
            T.cl_uint                   // arg
          ]
  },
  { name: "clvGetKernelArgAddressQual",
    rv:   T.cl_kernel_arg_address_qualifier,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // kernel
            T.cl_uint                   // arg
          ]
  },
  { name: "clvKernelArgIsImage",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // kernel
            T.cl_uint                   // arg
          ]
  },
  { name: "clvGetKernelArgAccessQual",
    rv:   T.cl_kernel_arg_access_qualifier,
    args: [ T_clv_program,              // program
            T.cl_uint,                  // kernel
            T.cl_uint                   // arg
          ]
  },
  { name: "clvGetProgramValidatedSource",
    rv:   T.cl_int,
    args: [ T_clv_program,              // program
            ctypes.size_t,              // source_buf_size
            ctypes.char.ptr,            // source_buf
            ctypes.size_t.ptr           // source_size_ret
          ]
  },
  { name: "clvReleaseProgram",
    rv:   ctypes.void_t,
    args: [ T_clv_program ]             // program
  }
];


} catch(e) { ERROR ("clv_symbols.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
