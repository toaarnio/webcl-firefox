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


var EXPORTED_SYMBOLS = [ "T" ];

const Cu = Components.utils;

Cu.import ("resource://gre/modules/ctypes.jsm");


try {


  var cl_int =                       ctypes.int32_t;
  var cl_uint =                      ctypes.uint32_t;
  var cl_bitfield =                  ctypes.uint64_t;

  var T = {
    cl_platform_id:                  ctypes.voidptr_t,
    cl_device_id:                    ctypes.voidptr_t,
    cl_context:                      ctypes.voidptr_t,
    cl_command_queue:                ctypes.voidptr_t,
    cl_mem:                          ctypes.voidptr_t,
    cl_program:                      ctypes.voidptr_t,
    cl_kernel:                       ctypes.voidptr_t,
    cl_event:                        ctypes.voidptr_t,
    cl_sampler:                      ctypes.voidptr_t,

    cl_char:                         ctypes.int8_t,
    cl_uchar:                        ctypes.uint8_t,
    cl_short:                        ctypes.int16_t,
    cl_ushort:                       ctypes.uint16_t,
    cl_int:                          cl_int,
    cl_uint:                         cl_uint,
    cl_long:                         ctypes.int64_t,
    cl_ulong:                        ctypes.uint64_t,

    cl_half:                         ctypes.uint16_t,
    cl_float:                        ctypes.float,
    cl_double:                       ctypes.double,

    cl_bool:                         cl_uint,

    cl_device_type:                  cl_bitfield,
    cl_platform_info:                cl_uint,
    cl_device_info:                  cl_uint,
    cl_device_fp_config:             cl_bitfield,
    cl_device_mem_cache_type:        cl_uint,
    cl_device_local_mem_type:        cl_uint,
    cl_device_exec_capabilities:     cl_bitfield,
    cl_command_queue_properties:     cl_bitfield,
    cl_device_partition_property:    ctypes.int.ptr,
    cl_device_affinity_domain:       cl_bitfield,

    cl_context_properties:           ctypes.int.ptr,
    cl_context_info:                 cl_uint,
    cl_command_queue_info:           cl_uint,
    cl_channel_order:                cl_uint,
    cl_channel_type:                 cl_uint,
    cl_mem_flags:                    cl_bitfield,
    cl_mem_object_type:              cl_uint,
    cl_mem_info:                     cl_uint,
    cl_mem_migration_flags:          cl_bitfield,
    cl_image_info:                   cl_uint,
    cl_buffer_create_type:           cl_uint,
    cl_addressing_mode:              cl_uint,
    cl_filter_mode:                  cl_uint,
    cl_sampler_info:                 cl_uint,
    cl_map_flags:                    cl_bitfield,
    cl_program_info:                 cl_uint,
    cl_program_build_info:           cl_uint,
    cl_program_binary_type:          cl_uint,
    cl_build_status:                 cl_int,
    cl_kernel_info:                  cl_uint,
    cl_kernel_arg_info:              cl_uint,
    cl_kernel_arg_address_qualifier: cl_uint,
    cl_kernel_arg_access_qualifier:  cl_uint,
    cl_kernel_arg_type_qualifier:    cl_bitfield,
    cl_kernel_work_group_info:       cl_uint,
    cl_event_info:                   cl_uint,
    cl_command_type:                 cl_uint,
    cl_profiling_info:               cl_uint,

    char:                            ctypes.char,
    size_t:                          ctypes.size_t,
    void_t:                          ctypes.void_t,
    voidptr_t:                       ctypes.voidptr_t,

    cl_bitfield:                     cl_bitfield
  };

  T.cl_image_format = ctypes.StructType ("cl_image_format",
                                         [ { image_channel_order:     T.cl_channel_order },
                                           { image_channel_data_type: T.cl_channel_type } ] );

  T.cl_image_desc = ctypes.StructType ("cl_image_desc",
                                       [ { image_type:        T.cl_mem_object_type },
                                         { image_width:       T.size_t },
                                         { image_height:      T.size_t },
                                         { image_depth:       T.size_t },
                                         { image_array_size:  T.size_t },
                                         { image_row_pitch:   T.size_t },
                                         { image_slice_pitch: T.size_t },
                                         { num_mip_levels:    T.cl_uint },
                                         { num_samples:       T.cl_uint },
                                         { buffer:            T.cl_mem } ] );

  T.cl_buffer_region = ctypes.StructType ("cl_buffer_region",
                                          [ { origin: T.size_t },
                                            { size:   T.size_t } ] );

  T.callback_createContext = ctypes.FunctionType (ctypes.default_abi, T.void_t,
                                                  [T.char.ptr, T.voidptr_t, T.size_t, T.voidptr_t]);
  T.callback_memObjectDestructor = ctypes.FunctionType (ctypes.default_abi, T.void_t, [T.cl_mem, T.voidptr_t]);
  T.callback_buildProgram = ctypes.FunctionType (ctypes.default_abi, T.void_t, [T.cl_program, T.voidptr_t]);
  T.callback_enqueueNativeKernel = ctypes.FunctionType(ctypes.default_abi, T.void_t, [T.voidptr_t]);
  T.callback_event = ctypes.FunctionType(ctypes.default_abi, T.void_t, [T.cl_event, T.cl_int, T.voidptr_t]);


} catch (e) { ERROR ("Failed to create OpenCL wrapper types: " + e + ".");  throw e; }

