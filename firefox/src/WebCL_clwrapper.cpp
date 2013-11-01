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

#include "WebCL_clwrapper.h"
#include "WebCL_libcl.h"
#include "WebCL_clsymbols.h"


#define WCLLIB_ERR_NO_INFOFUNC "Invalid infoFunc argument (null)."

#define VALIDATE_INFOFUNC() do{\
    if (!infoFunc) { \
      D_LOG (LOG_LEVEL_ERROR, WCLLIB_ERR_NO_INFOFUNC); \
      return CL_INVALID_VALUE; \
    }}while(0)

cl_int WebCLLibWrapperDetail::getInfoImpl_string (clobject aInstance, int aName, nsCString& aValueOut, InfoFunc infoFunc)
{
    D_METHOD_START;
    cl_int err = CL_SUCCESS;
    char* buf = 0;
    size_t sze = 0;
    VALIDATE_INFOFUNC ();
    err = infoFunc (aInstance, aName, 0, 0, &sze);
    if (err != CL_SUCCESS)
    {
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    buf = (char*)malloc (sizeof (char) * (sze + 1));
    if (!buf)
    {
        D_LOG (LOG_LEVEL_ERROR, "Memory allocation failed.");
        return CL_OUT_OF_HOST_MEMORY;
    }
    err = infoFunc (aInstance, aName, sze, (void*)buf, 0);
    if (err != CL_SUCCESS)
    {
        free (buf);
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    buf[sze] = '\0'; // Just to be safe..
    aValueOut = buf;
    free (buf);
    return err;
}


cl_int WebCLLibWrapperDetail::getInfoImpl_string_V (clobject aInstance, int aName, nsTArray<nsCString>& aValueOut, InfoFunc infoFunc)
{
    D_METHOD_START;
    char** buf = 0;
    size_t sze = 0;
    cl_int err = CL_SUCCESS;
    VALIDATE_INFOFUNC ();
    err = infoFunc (aInstance, aName, 0, 0, &sze);
    if (err != CL_SUCCESS)
    {
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    buf = (char**)malloc (sze);
    if (!buf)
    {
        D_LOG (LOG_LEVEL_ERROR, "Memory allocation failed.");
        return CL_OUT_OF_HOST_MEMORY;
    }

    err = infoFunc (aInstance, aName, sze, (void*)buf, 0);
    if (err != CL_SUCCESS)
    {
        free (buf);
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    aValueOut.Clear ();
    size_t num = sze / sizeof (char*);
    aValueOut.SetLength (num);
    for (size_t i = 0; i < num; ++i)
        aValueOut.AppendElement (nsCString (buf[i]));
    free (buf);
    return err;
}


cl_int WebCLLibWrapperDetail::getInfoImpl_ImageFormat (clobject aInstance, int aName, cl_image_format& aValueOut, InfoFunc infoFunc)
{
    D_METHOD_START;
    cl_int err = CL_SUCCESS;
    cl_image_format buf;
    size_t sze = 0;
    VALIDATE_INFOFUNC ();
    err = infoFunc (aInstance, aName, sizeof(buf), (void*)&buf, &sze);
    if (err != CL_SUCCESS)
    {
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    if (sizeof(buf) != sze)
    {
        D_LOG (LOG_LEVEL_ERROR,
             "getInfo returned a value of unexpected size %lu, expected (%lu bytes)",
             sze, sizeof(buf));
        return CL_INVALID_VALUE;
    }
    aValueOut = buf;
    return err;
}


#define IMPL_GET_INFO_FOR_OBJECT(name,clType) \
cl_int WebCLLibWrapperDetail::getInfoImpl_##name (clobject aInstance, int aName, clType& aValueOut, InfoFunc infoFunc) { \
    D_METHOD_START; \
    cl_int err = CL_SUCCESS; \
    size_t sze = 0; \
    clType clHandle = 0; \
    VALIDATE_INFOFUNC (); \
    err = infoFunc (aInstance, aName, sizeof(clType), (void*)&clHandle, &sze); \
    if (err != CL_SUCCESS) { \
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err); \
        return err; \
    } \
    if (sze != sizeof(clType)) { \
        D_LOG (LOG_LEVEL_ERROR, \
             "getInfo returned a value of unexpected size %lu, expected (%lu bytes)", \
             sze, sizeof(clType)); \
        return CL_INVALID_VALUE; \
    } \
    aValueOut = clHandle; \
    return err; \
}

IMPL_GET_INFO_FOR_OBJECT (Platform, cl_platform_id)
IMPL_GET_INFO_FOR_OBJECT (Device, cl_device_id)
IMPL_GET_INFO_FOR_OBJECT (Context, cl_context)
IMPL_GET_INFO_FOR_OBJECT (Event, cl_event)
IMPL_GET_INFO_FOR_OBJECT (CommandQueue, cl_command_queue)
IMPL_GET_INFO_FOR_OBJECT (MemoryObject, cl_mem)
IMPL_GET_INFO_FOR_OBJECT (Program, cl_program)
IMPL_GET_INFO_FOR_OBJECT (Kernel, cl_kernel)
IMPL_GET_INFO_FOR_OBJECT (Sampler, cl_sampler)



#define IMPL_GET_INFO_FOR_OBJECT_VECTOR(name,clType) \
cl_int WebCLLibWrapperDetail::getInfoImpl_##name##_V (clobject aInstance, int aName, nsTArray<clType>& aValueOut, InfoFunc infoFunc) { \
    D_METHOD_START; \
    size_t sze = 0; \
    cl_int err = CL_SUCCESS; \
    VALIDATE_INFOFUNC (); \
    err = infoFunc (aInstance, aName, 0, 0, &sze); \
    if (err != CL_SUCCESS) { \
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err); \
        return err; \
    } \
    nsTArray<clType> buf; \
    buf.SetLength (sze / sizeof(clType)); /* TODO: check success */ \
    err = infoFunc (aInstance, aName, sze, (void*)buf.Elements(), 0); \
    if (err != CL_SUCCESS) { \
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err); \
        return err; \
    } \
    aValueOut.SwapElements (buf); \
    return err; \
}

IMPL_GET_INFO_FOR_OBJECT_VECTOR (Platform, cl_platform_id)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (Device, cl_device_id)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (Context, cl_context)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (Event, cl_event)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (CommandQueue, cl_command_queue)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (MemoryObject, cl_mem)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (Program, cl_program)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (Kernel, cl_kernel)
IMPL_GET_INFO_FOR_OBJECT_VECTOR (Sampler, cl_sampler)


cl_int WebCLLibWrapperDetail::getInfoImpl_string (clobject aInstance, clobject aExtra, int aName, nsCString& aValueOut, InfoFuncExtra infoFunc)
{
    D_METHOD_START;
    cl_int err = CL_SUCCESS;
    char* buf = 0;
    size_t sze = 0;
    VALIDATE_INFOFUNC ();
    err = infoFunc (aInstance, aExtra, aName, 0, 0, &sze);
    if (err != CL_SUCCESS)
    {
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    buf = (char*)malloc (sizeof (char) * (sze + 1));
    if (!buf)
    {
        D_LOG (LOG_LEVEL_ERROR, "Memory allocation failed.");
        return CL_OUT_OF_HOST_MEMORY;
    }
    err = infoFunc (aInstance, aExtra, aName, sze, (void*)buf, 0);
    if (err != CL_SUCCESS)
    {
        free (buf);
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    buf[sze] = '\0'; // Just to be safe..
    aValueOut = buf;
    free (buf);
    return err;
}

cl_int WebCLLibWrapperDetail::getInfoImpl_string_V (clobject aInstance, clobject aExtra, int aName, nsTArray<nsCString>& aValueOut, InfoFuncExtra infoFunc)
{
    D_METHOD_START;
    char** buf = 0;
    size_t sze = 0;
    VALIDATE_INFOFUNC ();
    cl_int err = infoFunc (aInstance, aExtra, aName, 0, 0, &sze);
    if (err != CL_SUCCESS)
    {
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    buf = (char**)malloc (sze);
    if (!buf)
    {
        D_LOG (LOG_LEVEL_ERROR, "Memory allocation failed.");
        return CL_OUT_OF_HOST_MEMORY;
    }
    err = infoFunc (aInstance, aExtra, aName, sze, (void*)buf, 0);
    if (err != CL_SUCCESS)
    {
        free (buf);
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
        return err;
    }
    aValueOut.Clear ();
    size_t num = sze / sizeof (char*);
    aValueOut.SetLength (num);
    for (size_t i = 0; i < num; ++i)
    {
        aValueOut.AppendElement (nsCString (buf[i]));
    }
    free (buf);
    return err;
}


#define IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT(name,clType) \
cl_int WebCLLibWrapperDetail::getInfoImpl_##name (clobject aInstance, clobject aExtra, int aName, clType& aValueOut, InfoFuncExtra infoFunc) { \
    D_METHOD_START; \
    cl_int err = CL_SUCCESS; \
    size_t sze = 0; \
    clType clHandle = 0; \
    VALIDATE_INFOFUNC (); \
    err = infoFunc (aInstance, aExtra, aName, sizeof(clType), (void*)&clHandle, &sze); \
    if (err != CL_SUCCESS) { \
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err); \
        return err; \
    } \
    if (sze != sizeof(clType)) { \
        D_LOG (LOG_LEVEL_ERROR, \
             "getInfo returned a value of unexpected size %lu, expected (%lu bytes)", \
             sze, sizeof(clType)); \
        return CL_INVALID_VALUE; \
    } \
    aValueOut = clHandle; \
    return err; \
}

IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (Platform, cl_platform_id)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (Device, cl_device_id)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (Context, cl_context)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (Event, cl_event)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (CommandQueue, cl_command_queue)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (MemoryObject, cl_mem)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (Program, cl_program)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (Kernel, cl_kernel)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT (Sampler, cl_sampler)


#define IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR(name,clType) \
cl_int WebCLLibWrapperDetail::getInfoImpl_##name##_V (clobject aInstance, clobject aExtra, int aName, nsTArray<clType>& aValueOut, InfoFuncExtra infoFunc) { \
    D_METHOD_START; \
    cl_int err = CL_SUCCESS; \
    size_t sze = 0; \
    VALIDATE_INFOFUNC (); \
    err = infoFunc (aInstance, aExtra, aName, 0, 0, &sze); \
    if (err != CL_SUCCESS) { \
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err); \
        return err; \
    } \
    nsTArray<clType> buf; \
    buf.SetLength (sze / sizeof(clType)); /* TODO: check success */ \
    err = infoFunc (aInstance, aExtra, aName, sze, (void*)buf.Elements(), 0); \
    if (err != CL_SUCCESS) { \
        D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err); \
        return err; \
    } \
    aValueOut.SwapElements (buf); \
    return err; \
}

IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (Platform, cl_platform_id)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (Device, cl_device_id)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (Context, cl_context)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (Event, cl_event)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (CommandQueue, cl_command_queue)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (MemoryObject, cl_mem)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (Program, cl_program)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (Kernel, cl_kernel)
IMPL_GET_INFO_WITH_EXTRA_FOR_OBJECT_VECTOR (Sampler, cl_sampler)



//##############################################################################



NS_IMPL_ISUPPORTS0(WebCL_LibCLWrapper)


WebCL_LibCLWrapper::WebCL_LibCLWrapper (WebCL_LibCL* aLibCL)
  : nsISupports(),
    mLibCL(aLibCL), mStatus(SUCCESS)
{
}


WebCL_LibCLWrapper::~WebCL_LibCLWrapper ()
{
}


WebCL_LibCLWrapper::Status WebCL_LibCLWrapper::status () const
{
  return mStatus;
}


WebCL_LibCL* WebCL_LibCLWrapper::library ()
{
  return mLibCL;
}


cl_int WebCL_LibCLWrapper::getPlatformIDs (nsTArray<cl_platform_id>& aPlatformsOut)
{
  LIBCL_WRAPPER_BEGIN (clGetPlatformIDs, 0);

  cl_uint num = 0;
  cl_int err = mLibCL->symbols->clGetPlatformIDs (0, NULL, &num);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get number of platforms. (error %d)", err);
    return err;
  }

  nsTArray<cl_platform_id> platforms;
  platforms.SetLength (num);
  err = mLibCL->symbols->clGetPlatformIDs (num, (cl_platform_id*)platforms.Elements(), NULL);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get platforms. (error %d)", err);
    return err;
  }

  aPlatformsOut.SwapElements (platforms);

  return err;
}


cl_int WebCL_LibCLWrapper::getDeviceIDs (cl_platform_id aPlatform, int aDeviceType,
                                         nsTArray<cl_device_id>& aDevicesOut)
{
  LIBCL_WRAPPER_BEGIN (clGetDeviceIDs, 0);

  cl_uint num = 0;
  cl_int err = mLibCL->symbols->clGetDeviceIDs (aPlatform, aDeviceType, 0, NULL, &num);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get number of devices. (error %d)", err);
    return err;
  }

  nsTArray<cl_device_id> devices;
  devices.SetLength (num);
  err = mLibCL->symbols->clGetDeviceIDs (aPlatform, aDeviceType, num, devices.Elements(), NULL);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get devices. (error %d)", err);
    return err;
  }

  aDevicesOut.SwapElements (devices);

  return err;
}


cl_context WebCL_LibCLWrapper::createContext (cl_context_properties* aProperties,
                                              nsTArray<cl_device_id> const& aDevices,
                                              void (CL_CALLBACK *aNotify) (const char *, const void *, size_t cb, void *),
                                              void* aNotifyUserData,
                                              cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateContext, 0);

  cl_int err = CL_SUCCESS;
  cl_context ctx = mLibCL->symbols->clCreateContext (aProperties, aDevices.Length(), aDevices.Elements(),
                                                     aNotify, aNotifyUserData, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateContext failed with error %d.", err);
  }

  if (aErrorOut)
    *aErrorOut = err;

  return ctx;
}


cl_context WebCL_LibCLWrapper::createContextFromType (cl_context_properties* aProperties,
                                                      int aDeviceType,
                                                      void (CL_CALLBACK *aNotify) (const char *, const void *, size_t cb, void *),
                                                      void* aNotifyUserData,
                                                      cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateContextFromType, 0);

  cl_int err = CL_SUCCESS;
  cl_context ctx = mLibCL->symbols->clCreateContextFromType (aProperties, aDeviceType,
                                                             aNotify, aNotifyUserData, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateContextFromType failed with error %d.", err);
  }

  if (aErrorOut)
  {
    *aErrorOut = err;
  }

  return ctx;
}


cl_int WebCL_LibCLWrapper::retainContext (cl_context aContext)
{
  LIBCL_WRAPPER_BEGIN (clRetainContext, 0);

  cl_int err = mLibCL->symbols->clRetainContext (aContext);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clRetainContext failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::releaseContext (cl_context aContext)
{
  LIBCL_WRAPPER_BEGIN (clReleaseContext, 0);

  cl_int err = mLibCL->symbols->clReleaseContext (aContext);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clReleaseContext failed with error %d.", err);
  }
  return err;
}


cl_command_queue WebCL_LibCLWrapper::createCommandQueue (cl_context aContext,
                                                         cl_device_id aDevice,
                                                         cl_command_queue_properties aProperties,
                                                         cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateCommandQueue, 0);

  cl_int err = CL_SUCCESS;
  cl_command_queue cmdq = mLibCL->symbols->clCreateCommandQueue (aContext, aDevice, aProperties, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateCommandQueue failed with error %d.", err);
  }

  if (aErrorOut)
  {
    *aErrorOut = err;
  }

  return cmdq;
}


cl_int WebCL_LibCLWrapper::retainCommandQueue (cl_command_queue aCmdQueue)
{
  LIBCL_WRAPPER_BEGIN (clRetainCommandQueue, 0);

  cl_int err = mLibCL->symbols->clRetainCommandQueue (aCmdQueue);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clRetainCommandQueue failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::releaseCommandQueue (cl_command_queue aCmdQueue)
{
  LIBCL_WRAPPER_BEGIN (clReleaseCommandQueue, 0);

  cl_int err = mLibCL->symbols->clReleaseCommandQueue (aCmdQueue);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clReleaseCommandQueue failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::setCommandQueueProperty (cl_command_queue aCmdQueue,
                                                    cl_command_queue_properties aProperties,
                                                    cl_bool aEnable,
                                                    cl_command_queue_properties* aOldProperties)
{
  LIBCL_WRAPPER_BEGIN (clSetCommandQueueProperty, 0);
  cl_int err = mLibCL->symbols->clSetCommandQueueProperty (aCmdQueue, aProperties, aEnable, aOldProperties);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clSetCommandQueueProperty failed with error %d.", err);
  }
  return err;
}


cl_mem WebCL_LibCLWrapper::createBuffer (cl_context aContext, cl_mem_flags aFlags, size_t aSize,
                                         void* aHostPtr, cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateBuffer, 0);
  cl_int err = CL_SUCCESS;
  cl_mem mem = mLibCL->symbols->clCreateBuffer (aContext, aFlags, aSize, aHostPtr, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateBuffer failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return mem;
}


cl_mem WebCL_LibCLWrapper::createSubBuffer (cl_mem aBuffer, cl_mem_flags aFlags,
                                            cl_buffer_create_type aCreateType,
                                            const void* aCreateInfo,
                                            cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateSubBuffer, 0);
  cl_int err = CL_SUCCESS;
  cl_mem mem = mLibCL->symbols->clCreateSubBuffer (aBuffer, aFlags, aCreateType,
                                                   aCreateInfo, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateSubBuffer failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return mem;
}


cl_int WebCL_LibCLWrapper::enqueueReadBuffer (cl_command_queue aCmdQueue, cl_mem aBuffer,
                                              cl_bool aBlocking,
                                              size_t aOffset, size_t aCb, void* aPtr,
                                              nsTArray<cl_event> const& aEventWaitList,
                                              cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueReadBuffer, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueReadBuffer (aCmdQueue, aBuffer, aBlocking,
                                                     aOffset, aCb, aPtr,
                                                     ewlen,
                                                     ewlen ? aEventWaitList.Elements () : NULL,
                                                     aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueReadBuffer failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueWriteBuffer (cl_command_queue aCmdQueue, cl_mem aBuffer,
                                               cl_bool aBlocking,
                                               size_t aOffset, size_t aCb, void* aPtr,
                                               nsTArray<cl_event> const& aEventWaitList,
                                               cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueWriteBuffer, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueWriteBuffer (aCmdQueue, aBuffer, aBlocking,
                                                      aOffset, aCb, aPtr,
                                                      ewlen,
                                                      ewlen ? aEventWaitList.Elements () : NULL,
                                                      aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueWriteBuffer failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueReadBufferRect (cl_command_queue aCmdQueue, cl_mem aBuffer,
                                                  cl_bool aBlocking,
                                                  size_t const aBufferOrigin[3],
                                                  size_t const aHostOrigin[3],
                                                  size_t const aRegion[3],
                                                  size_t aBufferRowPitch, size_t aBufferSlicePitch,
                                                  size_t aHostRowPitch, size_t aHostSlicePitch,
                                                  void* aPtr,
                                                  nsTArray<cl_event> const& aEventWaitList,
                                                  cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueReadBufferRect, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueReadBufferRect (aCmdQueue, aBuffer, aBlocking,
                                                         aBufferOrigin, aHostOrigin,
                                                         aRegion,
                                                         aBufferRowPitch, aBufferSlicePitch,
                                                         aHostRowPitch, aHostSlicePitch,
                                                         aPtr,
                                                         ewlen,
                                                         ewlen ? aEventWaitList.Elements () : NULL,
                                                         aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueReadBufferRect failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueWriteBufferRect (cl_command_queue aCmdQueue, cl_mem aBuffer,
                                                   cl_bool aBlocking,
                                                   size_t const aBufferOrigin[3],
                                                   size_t const aHostOrigin[3],
                                                   size_t const aRegion[3],
                                                   size_t aBufferRowPitch, size_t aBufferSlicePitch,
                                                   size_t aHostRowPitch, size_t aHostSlicePitch,
                                                   void* aPtr,
                                                   nsTArray<cl_event> const& aEventWaitList,
                                                   cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueWriteBufferRect, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueWriteBufferRect (aCmdQueue, aBuffer, aBlocking,
                                                          aBufferOrigin, aHostOrigin,
                                                          aRegion,
                                                          aBufferRowPitch, aBufferSlicePitch,
                                                          aHostRowPitch, aHostSlicePitch,
                                                          aPtr,
                                                          ewlen,
                                                          ewlen ? aEventWaitList.Elements () : NULL,
                                                          aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueWriteBufferRect failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::retainMemObject (cl_mem aMemObject)
{
  LIBCL_WRAPPER_BEGIN (clRetainMemObject, 0);
  cl_int err = mLibCL->symbols->clRetainMemObject (aMemObject);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clRetainMemObject failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::releaseMemObject (cl_mem aMemObject)
{
  LIBCL_WRAPPER_BEGIN (clReleaseMemObject, 0);
  cl_int err = mLibCL->symbols->clReleaseMemObject (aMemObject);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clReleaseMemObject failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::setMemObjectDestructorCallback (cl_mem aMemObject,
                                                           void (CL_CALLBACK* aNotify)(cl_mem, void*),
                                                           void* aUserData)
{
  LIBCL_WRAPPER_BEGIN (clSetMemObjectDestructorCallback, 0);
  cl_int err = mLibCL->symbols->clSetMemObjectDestructorCallback (aMemObject, aNotify, aUserData);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clSetMemObjectDestructorCallback failed with error %d.", err);
  }
  return err;
}


cl_mem WebCL_LibCLWrapper::createImage2D (cl_context aContext, cl_mem_flags aFlags,
                                          cl_image_format const* aImageFormat,
                                          size_t aWidth, size_t aHeight, size_t aRowPitch,
                                          void* aHostPtr, cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateImage2D, 0);
  cl_int err = CL_SUCCESS;
  cl_mem mem = mLibCL->symbols->clCreateImage2D (aContext, aFlags, aImageFormat,
                                                 aWidth, aHeight, aRowPitch,
                                                 aHostPtr, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateImage2D failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return mem;
}


cl_mem WebCL_LibCLWrapper::createImage3D (cl_context aContext, cl_mem_flags aFlags,
                                          cl_image_format const* aImageFormat,
                                          size_t aWidth, size_t aHeight, size_t aDepth,
                                          size_t aRowPitch, size_t aSlicePitch,
                                          void* aHostPtr, cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateImage3D, 0);
  cl_int err = CL_SUCCESS;
  cl_mem mem = mLibCL->symbols->clCreateImage3D (aContext, aFlags, aImageFormat,
                                                 aWidth, aHeight, aDepth,
                                                 aRowPitch, aSlicePitch,
                                                 aHostPtr, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateImage3D failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return mem;
}


cl_int WebCL_LibCLWrapper::getSupportedImageFormats (cl_context aContext, cl_mem_flags aFlags,
                                                     cl_mem_object_type aMemObjectType,
                                                     nsTArray<cl_image_format>& aImageFormatsOut)
{
  LIBCL_WRAPPER_BEGIN (clGetSupportedImageFormats, 0);
  cl_uint num = 0;
  cl_int err = mLibCL->symbols->clGetSupportedImageFormats (aContext, aFlags, aMemObjectType,
                                                            0, NULL, &num);
  if (CL_SUCCEEDED (err))
  {
    nsTArray<cl_image_format> imageFormats;
    imageFormats.SetLength (num);
    err = mLibCL->symbols->clGetSupportedImageFormats (aContext, aFlags, aMemObjectType,
                                                       num, imageFormats.Elements(), NULL);
    if (CL_SUCCEEDED (err))
    {
      aImageFormatsOut.SwapElements (imageFormats);
    }
  }

  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clGetSupportedImageFormats failed with error %d.", err);
  }

  return err;
}


cl_int WebCL_LibCLWrapper::enqueueReadImage (cl_command_queue aCmdQueue, cl_mem aImage,
                                             cl_bool aBlocking,
                                             size_t const aOrigin[3], size_t const aRegion[3],
                                             size_t aRowPitch, size_t aSlicePitch, void* aPtr,
                                             nsTArray<cl_event> const& aEventWaitList,
                                             cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueReadImage, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueReadImage (aCmdQueue, aImage, aBlocking,
                                                    aOrigin, aRegion, aRowPitch, aSlicePitch,
                                                    aPtr,
                                                    ewlen,
                                                    ewlen ? aEventWaitList.Elements () : NULL,
                                                    aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueReadImage failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueWriteImage (cl_command_queue aCmdQueue, cl_mem aImage,
                                              cl_bool aBlocking,
                                              size_t const aOrigin[3], size_t const aRegion[3],
                                              size_t aInputRowPitch, size_t aInputSlicePitch,
                                              void* aPtr,
                                              nsTArray<cl_event> const& aEventWaitList,
                                              cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueWriteImage, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueWriteImage (aCmdQueue, aImage, aBlocking,
                                                     aOrigin, aRegion,
                                                     aInputRowPitch, aInputSlicePitch,
                                                     aPtr,
                                                     ewlen,
                                                     ewlen ? aEventWaitList.Elements () : NULL,
                                                     aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueWriteImage failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueCopyImage (cl_command_queue aCmdQueue, cl_mem aSrcImage,
                                             cl_mem aDstImage,
                                             size_t const aSrcOrigin[3], size_t const aDstOrigin[3],
                                             size_t const aRegion[3],
                                             nsTArray<cl_event> const& aEventWaitList,
                                             cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueCopyImage, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueCopyImage (aCmdQueue, aSrcImage, aDstImage,
                                                    aSrcOrigin, aDstOrigin, aRegion,
                                                    ewlen,
                                                    ewlen ? aEventWaitList.Elements () : NULL,
                                                    aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueCopyImage failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueCopyImageToBuffer (cl_command_queue aCmdQueue,
                                                     cl_mem aSrcImage, cl_mem aDstBuffer,
                                                     size_t const aSrcOrigin[3],
                                                     size_t const aRegion[3],
                                                     size_t aDstOffset,
                                                     nsTArray<cl_event> const& aEventWaitList,
                                                     cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueCopyImageToBuffer, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueCopyImageToBuffer (aCmdQueue, aSrcImage, aDstBuffer,
                                                            aSrcOrigin, aRegion, aDstOffset,
                                                            ewlen,
                                                            ewlen ? aEventWaitList.Elements () : NULL,
                                                            aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueCopyImageToBuffer failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueCopyBufferToImage (cl_command_queue aCmdQueue,
                                                     cl_mem aSrcBuffer, cl_mem aDstImage,
                                                     size_t aSrcOffset, size_t const aDstOrigin[3],
                                                     size_t const aRegion[3],
                                                     nsTArray<cl_event> const& aEventWaitList,
                                                     cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueCopyBufferToImage, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueCopyBufferToImage (aCmdQueue, aSrcBuffer, aDstImage,
                                                            aSrcOffset,aDstOrigin,aRegion,
                                                            ewlen,
                                                            ewlen ? aEventWaitList.Elements () : NULL,
                                                            aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueCopyBufferToImage failed with error %d.", err);
  }
  return err;
}


/* TODO: Do we have counterpart for this on the IDL? */
cl_int WebCL_LibCLWrapper::enqueueCopyBufferRect (cl_command_queue aCmdQueue,
                                                  cl_mem aSrcBuffer, cl_mem aDstBuffer,
                                                  size_t const aSrcOrigin[3],
                                                  size_t const aDstOrigin[3],
                                                  size_t const aRegion[3],
                                                  size_t aSrcRowPitch, size_t aSrcSlicePitch,
                                                  size_t aDstRowPitch, size_t aDstSlicePitch,
                                                  nsTArray<cl_event> const& aEventWaitList,
                                                  cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueCopyBufferRect, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueCopyBufferRect (aCmdQueue, aSrcBuffer, aDstBuffer,
                                                         aSrcOrigin, aDstOrigin, aRegion,
                                                         aSrcRowPitch, aSrcSlicePitch,
                                                         aDstRowPitch, aDstSlicePitch,
                                                         ewlen,
                                                         ewlen ? aEventWaitList.Elements () : NULL,
                                                         aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueCopyBufferRect failed with error %d.", err);
  }
  return err;
}


void* WebCL_LibCLWrapper::enqueueMapBuffer (cl_command_queue aCmdQueue, cl_mem aBuffer,
                                            cl_bool aBlocking,
                                            cl_map_flags aFlags, size_t aOffset, size_t aCb,
                                            nsTArray<cl_event> const& aEventWaitList,
                                            cl_event* aEventOut, cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueMapBuffer, 0);
  cl_int err = CL_SUCCESS;
  cl_uint ewlen = aEventWaitList.Length ();
  void* res = mLibCL->symbols->clEnqueueMapBuffer (aCmdQueue, aBuffer, aBlocking,
                                                   aFlags, aOffset, aCb,
                                                   ewlen,
                                                   ewlen ? aEventWaitList.Elements () : NULL,
                                                   aEventOut, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueMapBuffer failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return res;
}


void* WebCL_LibCLWrapper::enqueueMapImage (cl_command_queue aCmdQueue, cl_mem aImage,
                                           cl_bool aBlocking, cl_map_flags aFlags,
                                           size_t const aOrigin[3], size_t const aRegion[3],
                                           size_t* aRowPitchOut, size_t* aSlicePitchOut,
                                           nsTArray<cl_event> const& aEventWaitList,
                                           cl_event* aEventOut, cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueMapImage, 0);
  cl_int err = CL_SUCCESS;
  cl_uint ewlen = aEventWaitList.Length ();
  void* res = mLibCL->symbols->clEnqueueMapImage (aCmdQueue, aImage, aBlocking,
                                                  aFlags, aOrigin, aRegion,
                                                  aRowPitchOut, aSlicePitchOut,
                                                  ewlen,
                                                  ewlen ? aEventWaitList.Elements () : NULL,
                                                  aEventOut, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueMapImage failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return res;
}


cl_int WebCL_LibCLWrapper::enqueueUnmapMemObject (cl_command_queue aCmdQueue, cl_mem aMemObject,
                                                  void* aMappedPtr,
                                                  nsTArray<cl_event> const& aEventWaitList,
                                                  cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueUnmapMemObject, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueUnmapMemObject (aCmdQueue, aMemObject, aMappedPtr,
                                                         ewlen,
                                                         ewlen ? aEventWaitList.Elements () : NULL,
                                                         aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueUnmapMemObject failed with error %d.", err);
  }
  return err;
}


cl_sampler WebCL_LibCLWrapper::createSampler (cl_context aContext, cl_bool aNormalizedCoords,
                          cl_addressing_mode aAdressingMode,
                          cl_filter_mode aFilterMode, cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateSampler, 0);
  cl_int err = CL_SUCCESS;
  cl_sampler sampler = mLibCL->symbols->clCreateSampler (aContext, aNormalizedCoords,
                                                         aAdressingMode, aFilterMode,
                                                         &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateSampler failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return sampler;
}


cl_int WebCL_LibCLWrapper::retainSampler (cl_sampler aSampler)
{
  LIBCL_WRAPPER_BEGIN (clRetainSampler, 0);
  cl_int err = mLibCL->symbols->clRetainSampler (aSampler);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clRetainSampler failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::releaseSampler (cl_sampler aSampler)
{
  LIBCL_WRAPPER_BEGIN (clReleaseSampler, 0);
  cl_int err = mLibCL->symbols->clReleaseSampler (aSampler);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clReleaseSampler failed with error %d.", err);
  }
  return err;
}


cl_program WebCL_LibCLWrapper::createProgramWithSource (cl_context aContext,
                                                        nsCString aSource,
                                                        cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateProgramWithSource, 0);
  cl_int err = CL_SUCCESS;
  char const* src = aSource.get();
  cl_program program = mLibCL->symbols->clCreateProgramWithSource (aContext,
                                                                   1, &src,
                                                                   NULL, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateProgramWithSource failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }
  return program;
}


cl_program WebCL_LibCLWrapper::createProgramWithBinary (cl_context aContext,
                                                        nsTArray<cl_device_id> const& aDevices,
                                                        nsTArray<size_t> const& aBinaryLengths,
                                                        nsTArray<unsigned char const*> const& aBinaries,
                                                        nsTArray<cl_int>& aBinaryStatusOut,
                                                        cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateProgramWithBinary, 0);

  cl_int err = CL_SUCCESS;

  // Ensure there's a binary for each device
  if (aDevices.Length() != aBinaries.Length())
  {
    D_LOG (LOG_LEVEL_ERROR,
           "The number of binaries (%d) does not match the number of devices (%d).",
           aBinaries.Length(), aDevices.Length());
  }

  if (aBinaries.Length() != aBinaryLengths.Length())
  {
    D_LOG (LOG_LEVEL_ERROR,
           "The number of binary lengths (%d) does not match the number of binaries (%d).",
           aBinaryLengths.Length(), aBinaries.Length());
  }

  if (CL_FAILED (err))
  {
    if (aErrorOut)
    {
      *aErrorOut = CL_INVALID_VALUE;
    }
    return 0;
  }

  nsTArray<cl_int> binaryStatus;
  binaryStatus.SetLength (aDevices.Length());


  cl_program program = mLibCL->symbols->clCreateProgramWithBinary (
                                             aContext,
                                             aDevices.Length(),
                                             aDevices.Elements(),
                                             aBinaryLengths.Elements(),
                                             (unsigned char const**)aBinaries.Elements(),
                                             (cl_int*)binaryStatus.Elements(),
                                             &err);

  // TODO: store and deliver binarystatus array
  /*
  for (unsigned i = 0; i < binaryStatus.Length(); ++i) {
    printf("       device %u: %d\n", i, ((cl_int*)binaryStatus.Elements())[i]);
  }
  */

  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateProgramWithBinary failed with error %d.", err);
  }

  if (aErrorOut)
  {
    *aErrorOut = err;
  }

  aBinaryStatusOut.SwapElements (binaryStatus);

  return program;
}


cl_int WebCL_LibCLWrapper::retainProgram (cl_program aProgram)
{
  LIBCL_WRAPPER_BEGIN (clRetainProgram, 0);
  cl_int err = mLibCL->symbols->clRetainProgram (aProgram);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clRetainProgram failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::releaseProgram (cl_program aProgram)
{
  LIBCL_WRAPPER_BEGIN (clReleaseProgram, 0);
  cl_int err = mLibCL->symbols->clReleaseProgram (aProgram);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clReleaseProgram failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::unloadCompiler ()
{
  LIBCL_WRAPPER_BEGIN (clUnloadCompiler, 0);
  cl_int err = mLibCL->symbols->clUnloadCompiler ();
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clUnloadCompiler failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::buildProgram (cl_program aProgram,
                                         nsTArray<cl_device_id> const& aDevices,
                                         nsCString const& aOptions,
                                         void (CL_CALLBACK* aNotify)(cl_program, void*),
                                         void* aUserData)
{
  LIBCL_WRAPPER_BEGIN (clBuildProgram, 0);
  cl_int err = mLibCL->symbols->clBuildProgram (aProgram,
                                                aDevices.Length(),
                                                aDevices.Elements(),
                                                aOptions.get(),
                                                aNotify, aUserData);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clBuildProgram failed with error %d.", err);
  }
  return err;
}


cl_kernel WebCL_LibCLWrapper::createKernel (cl_program aProgram,
                                            nsCString aKernelName,
                                            cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateKernel, 0);
  cl_int err = CL_SUCCESS;
  cl_kernel kernel = mLibCL->symbols->clCreateKernel (aProgram, aKernelName.get(),
                                                      &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateKernel failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }

  return kernel;
}


cl_int WebCL_LibCLWrapper::createKernelsInProgram (cl_program aProgram,
                                                   nsTArray<cl_kernel>& aKernelsOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateKernelsInProgram, 0);

  cl_uint num = 0;
  cl_int err = mLibCL->symbols->clCreateKernelsInProgram (aProgram, 0, NULL, &num);
  if (CL_SUCCEEDED (err))
  {
    nsTArray<cl_kernel> kernels;
    kernels.SetLength (num);
    err = mLibCL->symbols->clCreateKernelsInProgram (aProgram, kernels.Length(),
                                                     kernels.Elements(), NULL);
    if (CL_SUCCEEDED (err))
    {
      aKernelsOut.SwapElements (kernels);
    }
  }

  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateKernelsInProgram failed with error %d.", err);
  }

  return err;
}


cl_int WebCL_LibCLWrapper::retainKernel (cl_kernel aKernel)
{
  LIBCL_WRAPPER_BEGIN (clRetainKernel, 0);
  cl_int err = mLibCL->symbols->clRetainKernel (aKernel);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clRetainKernel failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::releaseKernel (cl_kernel aKernel)
{
  LIBCL_WRAPPER_BEGIN (clReleaseKernel, 0);
  cl_int err = mLibCL->symbols->clReleaseKernel (aKernel);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clReleaseKernel failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::setKernelArg (cl_kernel aKernel, cl_uint aIndex,
                                         size_t aSize, const void* aValue)
{
  LIBCL_WRAPPER_BEGIN (clSetKernelArg, 0);
  cl_int err = mLibCL->symbols->clSetKernelArg (aKernel, aIndex, aSize, aValue);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clSetKernelArg failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueNDRangeKernel (cl_command_queue aCmdQueue, cl_kernel aKernel,
                             cl_uint aWorkDim,
                             nsTArray<size_t> const& aGlobalWorkOffset,
                             nsTArray<size_t> const& aGlobalWorkSize,
                             nsTArray<size_t> const& aLocalWorkSize,
                             nsTArray<cl_event> const& aEventWaitList,
                             cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueNDRangeKernel, 0);

  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueNDRangeKernel (
                                    aCmdQueue, aKernel,
                                    aWorkDim,
                                    aGlobalWorkOffset.Length()?aGlobalWorkOffset.Elements():NULL,
                                    aGlobalWorkSize.Length()?aGlobalWorkSize.Elements():NULL,
                                    aLocalWorkSize.Length()?aLocalWorkSize.Elements():NULL,
                                    ewlen,
                                    ewlen ? aEventWaitList.Elements () : NULL,
                                    aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueNDRangeKernel failed with error %d.", err);
  }

  return err;
}


cl_int WebCL_LibCLWrapper::enqueueTask (cl_command_queue aCmdQueue, cl_kernel aKernel,
                    nsTArray<cl_event> const& aEventWaitList,
                    cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueTask, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueTask (aCmdQueue, aKernel,
                                               ewlen,
                                               ewlen ? aEventWaitList.Elements () : NULL,
                                               aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueTask failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueNativeKernel (cl_command_queue aCmdQueue,
                            void (CL_CALLBACK *aUserFunc)(void *),
                            void* aArgs, size_t aCbArgs,
                            nsTArray<cl_mem> const& aMemObjects,
                            const void** aArgsMemLoc,
                            nsTArray<cl_event> const& aEventWaitList,
                            cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueNativeKernel, 0);
  // TODO: WebCL_LibCLWrapper::enqueueNativeKernel NOT IMPLEMENTED
  D_LOG (LOG_LEVEL_ERROR, "NOT IMPLEMENTED!");
  return CL_INVALID_COMMAND_QUEUE;
}


cl_event WebCL_LibCLWrapper::createUserEvent (cl_context aContext, cl_int* aErrorOut)
{
  LIBCL_WRAPPER_BEGIN (clCreateUserEvent, 0);

  cl_int err = CL_SUCCESS;
  cl_event event = mLibCL->symbols->clCreateUserEvent (aContext, &err);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clCreateUserEvent failed with error %d.", err);
  }
  if (aErrorOut)
  {
    *aErrorOut = err;
  }

  return event;
}


cl_int WebCL_LibCLWrapper::setUserEventStatus (cl_event aEvent, cl_int aExecutionStatus)
{
  LIBCL_WRAPPER_BEGIN (clSetUserEventStatus, 0);
  cl_int err = mLibCL->symbols->clSetUserEventStatus (aEvent, aExecutionStatus);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clSetUserEventStatus failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::waitForEvents (nsTArray<cl_event> const& aEvents)
{
  LIBCL_WRAPPER_BEGIN (clWaitForEvents, 0);
  cl_int err = mLibCL->symbols->clWaitForEvents (aEvents.Length(), aEvents.Elements());
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clWaitForEvents failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::setEventCallback (cl_event aEvent, cl_int aCommandExecCallbackType,
                                             void (CL_CALLBACK * aNotify)(cl_event, cl_int, void*),
                                             void* aUserData)
{
  LIBCL_WRAPPER_BEGIN (clSetEventCallback, 0);
  cl_int err = mLibCL->symbols->clSetEventCallback (aEvent, aCommandExecCallbackType,
                                                    aNotify, aUserData);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clSetEventCallback failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::retainEvent (cl_event aEvent)
{
  LIBCL_WRAPPER_BEGIN (clRetainEvent, 0);
  cl_int err = mLibCL->symbols->clRetainEvent (aEvent);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clRetainEvent failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::releaseEvent (cl_event aEvent)
{
  LIBCL_WRAPPER_BEGIN (clReleaseEvent, 0);
  cl_int err = mLibCL->symbols->clReleaseEvent (aEvent);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clReleaseEvent failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueMarker (cl_command_queue aCmdQueue, cl_event* aEventOut)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueMarker, 0);
  cl_int err = mLibCL->symbols->clEnqueueMarker (aCmdQueue, aEventOut);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueMarker failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueWaitForEvents (cl_command_queue aCmdQueue,
                                                 nsTArray<cl_event> const& aEventWaitList)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueWaitForEvents, 0);
  cl_uint ewlen = aEventWaitList.Length ();
  cl_int err = mLibCL->symbols->clEnqueueWaitForEvents (aCmdQueue,
                                                        ewlen,
                                                        ewlen ? aEventWaitList.Elements () : NULL);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueWaitForEvents failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::enqueueBarrier (cl_command_queue aCmdQueue)
{
  LIBCL_WRAPPER_BEGIN (clEnqueueBarrier, 0);
  cl_int err = mLibCL->symbols->clEnqueueBarrier (aCmdQueue);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clEnqueueBarrier failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::flush (cl_command_queue aCmdQueue)
{
  LIBCL_WRAPPER_BEGIN (clFlush, 0);
  cl_int err = mLibCL->symbols->clFlush (aCmdQueue);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clFlush failed with error %d.", err);
  }
  return err;
}


cl_int WebCL_LibCLWrapper::finish (cl_command_queue aCmdQueue)
{
  LIBCL_WRAPPER_BEGIN (clFinish, 0);
  cl_int err = mLibCL->symbols->clFinish (aCmdQueue);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "clFinish failed with error %d.", err);
  }
  return err;
}

