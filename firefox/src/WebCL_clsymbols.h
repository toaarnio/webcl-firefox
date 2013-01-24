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

#ifndef _WEBCL_CLSYMBOLS_H_
#define _WEBCL_CLSYMBOLS_H_

#include <CL/opencl.h>

#define WEBCL_LIB_CL_ENTRY(retval_t,name,...) \
typedef retval_t (CL_API_CALL * _##name##_t)(__VA_ARGS__); \
retval_t (CL_API_CALL * name)(__VA_ARGS__)

struct WebCL_CLSymbols
{
  // OpenCL 1.1 API
  WEBCL_LIB_CL_ENTRY(cl_int, clGetPlatformIDs, cl_uint, cl_platform_id*, cl_uint*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetPlatformInfo, cl_platform_id, cl_platform_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetDeviceIDs, cl_platform_id, cl_device_type, cl_uint, cl_device_id*, cl_uint*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetDeviceInfo, cl_device_id, cl_device_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_context, clCreateContext, const cl_context_properties*, cl_uint, const cl_device_id*, void (CL_CALLBACK* )(const char*, const void*, size_t, void*), void*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_context, clCreateContextFromType, const cl_context_properties*, cl_device_type, void (CL_CALLBACK* )(const char*, const void*, size_t, void*), void*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clRetainContext, cl_context);
  WEBCL_LIB_CL_ENTRY(cl_int, clReleaseContext, cl_context);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetContextInfo, cl_context, cl_context_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_command_queue, clCreateCommandQueue, cl_context, cl_device_id, cl_command_queue_properties, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clRetainCommandQueue, cl_command_queue);
  WEBCL_LIB_CL_ENTRY(cl_int, clReleaseCommandQueue, cl_command_queue);
  WEBCL_LIB_CL_ENTRY(cl_int, clSetCommandQueueProperty, cl_command_queue aCmdQueue, cl_command_queue_properties aProperties, cl_bool aEnable, cl_command_queue_properties* aOldProperties);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetCommandQueueInfo, cl_command_queue, cl_command_queue_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateBuffer, cl_context, cl_mem_flags, size_t, void*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateSubBuffer, cl_mem, cl_mem_flags, cl_buffer_create_type, const void*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateImage2D, cl_context, cl_mem_flags, const cl_image_format*, size_t, size_t, size_t, void*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateImage3D, cl_context, cl_mem_flags, const cl_image_format*, size_t, size_t, size_t, size_t, size_t, void*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clRetainMemObject, cl_mem);
  WEBCL_LIB_CL_ENTRY(cl_int, clReleaseMemObject, cl_mem);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetSupportedImageFormats, cl_context, cl_mem_flags, cl_mem_object_type, cl_uint, cl_image_format*, cl_uint*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetMemObjectInfo, cl_mem, cl_mem_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetImageInfo, cl_mem, cl_image_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clSetMemObjectDestructorCallback, cl_mem, void (CL_CALLBACK* )( cl_mem, void* ), void*);
  WEBCL_LIB_CL_ENTRY(cl_sampler, clCreateSampler, cl_context, cl_bool, cl_addressing_mode, cl_filter_mode, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clRetainSampler, cl_sampler);
  WEBCL_LIB_CL_ENTRY(cl_int, clReleaseSampler, cl_sampler);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetSamplerInfo, cl_sampler, cl_sampler_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_program, clCreateProgramWithSource, cl_context, cl_uint, const char**, const size_t*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_program, clCreateProgramWithBinary, cl_context, cl_uint, const cl_device_id*, const size_t*, const unsigned char**, cl_int*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clRetainProgram, cl_program);
  WEBCL_LIB_CL_ENTRY(cl_int, clReleaseProgram, cl_program);
  WEBCL_LIB_CL_ENTRY(cl_int, clBuildProgram, cl_program, cl_uint, const cl_device_id*, const char*, void (CL_CALLBACK* )(cl_program, void* ), void*);
  WEBCL_LIB_CL_ENTRY(cl_int, clUnloadCompiler, void);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetProgramInfo, cl_program, cl_program_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetProgramBuildInfo, cl_program, cl_device_id, cl_program_build_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_kernel, clCreateKernel, cl_program, const char*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clCreateKernelsInProgram, cl_program, cl_uint, cl_kernel*, cl_uint*);
  WEBCL_LIB_CL_ENTRY(cl_int, clRetainKernel, cl_kernel);
  WEBCL_LIB_CL_ENTRY(cl_int, clReleaseKernel, cl_kernel);
  WEBCL_LIB_CL_ENTRY(cl_int, clSetKernelArg, cl_kernel, cl_uint, size_t, const void*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetKernelInfo, cl_kernel, cl_kernel_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetKernelWorkGroupInfo, cl_kernel, cl_device_id, cl_kernel_work_group_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clWaitForEvents, cl_uint, const cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetEventInfo, cl_event, cl_event_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_event, clCreateUserEvent, cl_context, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clRetainEvent, cl_event);
  WEBCL_LIB_CL_ENTRY(cl_int, clReleaseEvent, cl_event);
  WEBCL_LIB_CL_ENTRY(cl_int, clSetUserEventStatus, cl_event, cl_int);
  WEBCL_LIB_CL_ENTRY(cl_int, clSetEventCallback, cl_event, cl_int, void (CL_CALLBACK* )(cl_event, cl_int, void*), void*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetEventProfilingInfo, cl_event, cl_profiling_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clFlush, cl_command_queue);
  WEBCL_LIB_CL_ENTRY(cl_int, clFinish, cl_command_queue);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueReadBuffer, cl_command_queue, cl_mem, cl_bool, size_t, size_t, void*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueReadBufferRect, cl_command_queue, cl_mem, cl_bool, const size_t*, const size_t*, const size_t*, size_t, size_t, size_t, size_t, void*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueWriteBuffer, cl_command_queue, cl_mem, cl_bool, size_t, size_t, const void*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueWriteBufferRect, cl_command_queue, cl_mem, cl_bool, const size_t*, const size_t*, const size_t*, size_t, size_t, size_t, size_t, const void*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueCopyBuffer, cl_command_queue, cl_mem, cl_mem, size_t, size_t, size_t, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueCopyBufferRect, cl_command_queue, cl_mem, cl_mem, const size_t*, const size_t*, const size_t*, size_t, size_t, size_t, size_t, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueReadImage, cl_command_queue, cl_mem, cl_bool, const size_t*, const size_t*, size_t, size_t, void*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueWriteImage, cl_command_queue, cl_mem, cl_bool, const size_t*, const size_t*, size_t, size_t, const void*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueCopyImage, cl_command_queue, cl_mem, cl_mem, const size_t*, const size_t*, const size_t*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueCopyImageToBuffer, cl_command_queue, cl_mem, cl_mem, const size_t*, const size_t*, size_t, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueCopyBufferToImage, cl_command_queue, cl_mem, cl_mem, size_t, const size_t*, const size_t*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(void*, clEnqueueMapBuffer, cl_command_queue, cl_mem, cl_bool, cl_map_flags, size_t, size_t, cl_uint, const cl_event*, cl_event*, cl_int*);
  WEBCL_LIB_CL_ENTRY(void*, clEnqueueMapImage, cl_command_queue, cl_mem, cl_bool, cl_map_flags, const size_t*, const size_t*, size_t*, size_t*, cl_uint, const cl_event*, cl_event*, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueUnmapMemObject, cl_command_queue, cl_mem, void*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueNDRangeKernel, cl_command_queue, cl_kernel, cl_uint, const size_t*, const size_t*, const size_t*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueTask, cl_command_queue, cl_kernel, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueNativeKernel, cl_command_queue, void (*user_func)(void*), void*, size_t, cl_uint, const cl_mem*, const void**, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueMarker, cl_command_queue, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueWaitForEvents, cl_command_queue, cl_uint, const cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueBarrier, cl_command_queue);
  WEBCL_LIB_CL_ENTRY(void*, clGetExtensionFunctionAddress, const char*);

  // OpenCL 1.1 OpenGL interoperability API
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateFromGLBuffer, cl_context, cl_mem_flags, cl_GLuint, int*);
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateFromGLTexture2D, cl_context, cl_mem_flags, cl_GLenum, cl_GLint, cl_GLuint, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateFromGLTexture3D, cl_context, cl_mem_flags, cl_GLenum, cl_GLint, cl_GLuint, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_mem, clCreateFromGLRenderbuffer, cl_context, cl_mem_flags, cl_GLuint, cl_int*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetGLObjectInfo, cl_mem, cl_gl_object_type*, cl_GLuint*);
  WEBCL_LIB_CL_ENTRY(cl_int, clGetGLTextureInfo, cl_mem, cl_gl_texture_info, size_t, void*, size_t*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueAcquireGLObjects, cl_command_queue, cl_uint, const cl_mem*, cl_uint, const cl_event*, cl_event*);
  WEBCL_LIB_CL_ENTRY(cl_int, clEnqueueReleaseGLObjects, cl_command_queue, cl_uint, const cl_mem*, cl_uint, const cl_event*, cl_event*);
  #ifndef __APPLE__
    WEBCL_LIB_CL_ENTRY(cl_int, clGetGLContextInfoKHR, const cl_context_properties*, cl_gl_context_info, size_t, void*, size_t*);
  #endif
  // Loader impl. specific!
  void* libHandle;
};

#endif //_WEBCL_CLSYMBOLS_H_
