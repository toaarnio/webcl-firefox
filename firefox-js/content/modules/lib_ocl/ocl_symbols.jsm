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


var EXPORTED_SYMBOLS = [ "OCLSymbolDetails" ];

const Cu = Components.utils;

Cu.import ("resource://gre/modules/ctypes.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/logger.jsm");
Cu.import ("chrome://nrcwebcl/content/modules/lib_ocl/ocl_types.jsm");


try {

var OCLSymbolDetails = [
  { name: "clGetPlatformIDs",
    rv:   T.cl_int,
    args: [ T.cl_uint, T.cl_platform_id.ptr, T.cl_uint.ptr ]
  },
  { name: "clGetPlatformInfo",
    rv:   T.cl_int,
    args: [ T.cl_platform_id, T.cl_platform_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clGetDeviceIDs",
    rv:   T.cl_int,
    args: [ T.cl_platform_id, T.cl_device_type, T.cl_uint, T.cl_device_id.ptr, T.cl_uint.ptr ]
  },
  { name: "clGetDeviceInfo",
    rv:   T.cl_int,
    args: [ T.cl_device_id, T.cl_device_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clCreateContext",
    rv:   T.cl_context,
    args: [ T.cl_context_properties.ptr, T.cl_uint, T.cl_device_id.ptr, T.callback_createContext.ptr, T.voidptr_t, T.cl_int.ptr ]
  },
  { name: "clCreateContextFromType",
    rv:   T.cl_context,
    args: [ T.cl_context_properties.ptr, T.cl_device_type, T.callback_createContext.ptr, T.voidptr_t, T.cl_int.ptr ]
  },
  { name: "clRetainContext",
    rv:   T.cl_int,
    args: [ T.cl_context ]
  },
  { name: "clReleaseContext",
    rv:   T.cl_int,
    args: [ T.cl_context ]
  },
  { name: "clGetContextInfo",
    rv:   T.cl_int,
    args: [ T.cl_context, T.cl_context_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clCreateCommandQueue",
    rv:   T.cl_command_queue,
    args: [ T.cl_context, T.cl_device_id, T.cl_command_queue_properties, T.cl_int.ptr ]
  },
  { name: "clRetainCommandQueue",
    rv:   T.cl_int,
    args: [ T.cl_command_queue ]
  },
  { name: "clReleaseCommandQueue",
    rv:   T.cl_int,
    args: [ T.cl_command_queue ]
  },
  { name: "clSetCommandQueueProperty",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_command_queue_properties, T.cl_bool, T.cl_command_queue_properties.ptr ]
  },
  { name: "clCreateBuffer",
    rv:   T.cl_mem,
    args: [ T.cl_context, T.cl_mem_flags, T.size_t, T.voidptr_t, T.cl_int.ptr ]
  },
  { name: "clCreateSubBuffer",
    rv:   T.cl_mem,
    args: [ T.cl_mem, T.cl_mem_flags, T.cl_buffer_create_type, T.voidptr_t, T.cl_int.ptr ]
  },
  { name: "clGetCommandQueueInfo",
    rv: T.cl_int,
    args: [ T.cl_command_queue, T.cl_command_queue_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clEnqueueReadBuffer",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.size_t, T.size_t, T.voidptr_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueWriteBuffer",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.size_t, T.size_t, T.voidptr_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueReadBufferRect",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.size_t.ptr, T.size_t.ptr, T.size_t.ptr, T.size_t, T.size_t, T.size_t, T.size_t, T.voidptr_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueWriteBufferRect",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.size_t.ptr, T.size_t.ptr, T.size_t.ptr, T.size_t, T.size_t, T.size_t, T.size_t, T.voidptr_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clRetainMemObject",
    rv:   T.cl_int,
    args: [ T.cl_mem ]
  },
  { name: "clReleaseMemObject",
    rv:   T.cl_int,
    args: [ T.cl_mem ]
  },
  { name: "clSetMemObjectDestructorCallback",
    rv:   T.cl_int,
    args: [ T.cl_mem, T.callback_memObjectDestructor.ptr, T.voidptr_t ]
  },
  { name: "clCreateImage2D",
    rv:   T.cl_mem,
    args: [ T.cl_context, T.cl_mem_flags, T.cl_image_format.ptr, T.size_t, T.size_t, T.size_t, T.voidptr_t, T.cl_int.ptr ]
  },
  { name: "clCreateImage3D",
    rv:   T.cl_mem,
    args: [ T.cl_context, T.cl_mem_flags, T.cl_image_format.ptr, T.size_t, T.size_t, T.size_t, T.size_t, T.size_t, T.voidptr_t, T.cl_int.ptr ]
  },
  { name: "clGetSupportedImageFormats",
    rv:   T.cl_int,
    args: [ T.cl_context, T.cl_mem_flags, T.cl_mem_object_type, T.cl_uint, T.cl_image_format.ptr, T.cl_uint.ptr ]
  },
  { name: "clEnqueueReadImage",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.size_t.ptr, T.size_t.ptr, T.size_t, T.size_t, T.voidptr_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueWriteImage",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.size_t.ptr, T.size_t.ptr, T.size_t, T.size_t, T.voidptr_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueCopyImage",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_mem, T.size_t.ptr, T.size_t.ptr, T.size_t.ptr, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueCopyImageToBuffer",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_mem, T.size_t.ptr, T.size_t.ptr, T.size_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueCopyBuffer",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_mem, T.size_t, T.size_t, T.size_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueCopyBufferRect",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_mem, T.size_t.ptr, T.size_t.ptr, T.size_t.ptr, T.size_t, T.size_t, T.size_t, T.size_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueCopyBufferToImage",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_mem, T.size_t, T.size_t.ptr, T.size_t.ptr, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueMapBuffer",
    rv:   T.voidptr_t,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.cl_map_flags, T.size_t, T.size_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr, T.cl_int.ptr ]
  },
  { name: "clEnqueueMapImage",
    rv:   T.voidptr_t,
    args: [ T.cl_command_queue, T.cl_mem, T.cl_bool, T.cl_map_flags, T.size_t.ptr, T.size_t.ptr, T.size_t.ptr, T.size_t.ptr, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr, T.cl_int.ptr ]
  },
  { name: "clEnqueueUnmapMemObject",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_mem, T.voidptr_t, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clGetMemObjectInfo",
    rv:   T.cl_int,
    args: [ T.cl_mem, T.cl_mem_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clGetImageInfo",
    rv:   T.cl_int,
    args: [ T.cl_mem, T.cl_image_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clCreateSampler",
    rv:   T.cl_sampler,
    args: [ T.cl_context, T.cl_bool, T.cl_addressing_mode, T.cl_filter_mode, T.cl_int.ptr ]
  },
  { name: "clRetainSampler",
    rv:   T.cl_int,
    args: [ T.cl_sampler ]
  },
  { name: "clReleaseSampler",
    rv:   T.cl_int,
    args: [ T.cl_sampler ]
  },
  { name: "clGetSamplerInfo",
    rv:   T.cl_int,
    args: [ T.cl_sampler, T.cl_sampler_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clCreateProgramWithSource",
    rv:   T.cl_program,
    args: [ T.cl_context, T.cl_uint, T.char.ptr.ptr, T.size_t.ptr, T.cl_int.ptr ]
  },
  { name: "clCreateProgramWithBinary",
    rv:   T.cl_program,
    args: [ T.cl_context, T.cl_uint, T.cl_device_id.ptr, T.size_t.ptr, T.cl_uchar.ptr.ptr, T.cl_int.ptr, T.cl_int.ptr ]
  },
  { name: "clRetainProgram",
    rv:   T.cl_int,
    args: [ T.cl_program ]
  },
  { name: "clReleaseProgram",
    rv:   T.cl_int,
    args: [ T.cl_program ]
  },
  { name: "clUnloadCompiler",
    rv:   T.cl_int,
    args: [  ]
  },
  { name: "clBuildProgram",
    rv:   T.cl_int,
    args: [ T.cl_program, T.cl_uint, T.cl_device_id.ptr, T.char.ptr, T.callback_buildProgram.ptr, T.voidptr_t ]
  },
  { name: "clGetProgramInfo",
    rv:   T.cl_int,
    args: [ T.cl_program, T.cl_program_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clGetProgramBuildInfo",
    rv:   T.cl_int,
    args: [ T.cl_program, T.cl_device_id, T.cl_program_build_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clCreateKernel",
    rv:   T.cl_kernel,
    args: [ T.cl_program, T.char.ptr, T.cl_int.ptr ]
  },
  { name: "clCreateKernelsInProgram",
    rv:   T.cl_int,
    args: [ T.cl_program, T.cl_uint, T.cl_kernel.ptr, T.cl_uint.ptr ]
  },
  { name: "clRetainKernel",
    rv:   T.cl_int,
    args: [ T.cl_kernel ]
  },
  { name: "clReleaseKernel",
    rv:   T.cl_int,
    args: [ T.cl_kernel ]
  },
  { name: "clSetKernelArg",
    rv:   T.cl_int,
    args: [ T.cl_kernel, T.cl_uint, T.size_t, T.voidptr_t ]
  },
  { name: "clGetKernelInfo",
    rv:   T.cl_int,
    args: [ T.cl_kernel, T.cl_kernel_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clGetKernelWorkGroupInfo",
    rv:   T.cl_int,
    args: [ T.cl_kernel, T.cl_device_id, T.cl_kernel_work_group_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clEnqueueNDRangeKernel",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_kernel, T.cl_uint, T.size_t.ptr, T.size_t.ptr, T.size_t.ptr, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueTask",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_kernel, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clEnqueueNativeKernel",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.callback_enqueueNativeKernel.ptr, T.voidptr_t, T.size_t, T.cl_uint, T.cl_mem.ptr, T.voidptr_t.ptr, T.cl_uint, T.cl_event.ptr, T.cl_event.ptr ]
  },
  { name: "clCreateUserEvent",
    rv:   T.cl_event,
    args: [ T.cl_context, T.cl_int.ptr ]
  },
  { name: "clSetUserEventStatus",
    rv:   T.cl_int,
    args: [ T.cl_event, T.cl_int ]
  },
  { name: "clWaitForEvents",
    rv:   T.cl_int,
    args: [ T.cl_uint, T.cl_event.ptr ]
  },
  { name: "clGetEventInfo",
    rv:   T.cl_int,
    args: [ T.cl_event, T.cl_event_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clSetEventCallback",
    rv:   T.cl_int,
    args: [ T.cl_event, T.cl_int, T.callback_event.ptr, T.voidptr_t ]
  },
  { name: "clRetainEvent",
    rv:   T.cl_int,
    args: [ T.cl_event ]
  },
  { name: "clReleaseEvent",
    rv:   T.cl_int,
    args: [ T.cl_event ]
  },
  { name: "clEnqueueMarker",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_event.ptr ]
  },
  { name: "clEnqueueWaitForEvents",
    rv:   T.cl_int,
    args: [ T.cl_command_queue, T.cl_uint, T.cl_event.ptr ]
  },
  { name: "clEnqueueBarrier",
    rv:   T.cl_int,
    args: [ T.cl_command_queue ]
  },
  { name: "clGetEventProfilingInfo",
    rv:   T.cl_int,
    args: [ T.cl_event, T.cl_profiling_info, T.size_t, T.voidptr_t, T.size_t.ptr ]
  },
  { name: "clFlush",
    rv:   T.cl_int,
    args: [ T.cl_command_queue ]
  },
  { name: "clFinish",
    rv:   T.cl_int,
    args: [ T.cl_command_queue ]
  }
];

} catch(e) { ERROR ("ocl_symbols.jsm:\n" + String(e) + ":\n" + e.stack); throw e; }
