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

#ifndef _WEBCL_CLWRAPPER_H_
#define _WEBCL_CLWRAPPER_H_

#include <mozilla/StandardInteger.h>

#include "WebCLCommon.h"
#include "WebCLLogger.h"

#include "nsISupports.h"
#include "nsCOMPtr.h"
#include "nsStringAPI.h" /*#include "nsStringGlue.h"*/
#include "nsTArray.h"

#include <CL/opencl.h>


/** CL_SUCCEEDED evaluates to true if the OpenCL error value \c err
 * indicates successfull operation.
 */
#define CL_SUCCEEDED(err) (err == CL_SUCCESS)

/** CL_FAILED evaluates to true if the OpenCL error value \c err
 * indicates failed operation.
 */
#define CL_FAILED(err) (err != CL_SUCCESS)


// TODO: MOVE TO WebCLCommon.h?
typedef void* clobject;

typedef cl_int (CL_API_CALL *InfoFunc)(clobject aInstance, int aName, size_t aSize, void* aValueOut, size_t* aSizeOut);
typedef cl_int (CL_API_CALL *InfoFuncExtra)(clobject aInstance, clobject aExtra, int aName, size_t aSize, void* aValueOut, size_t* aSizeOut);



/* Explicit template specialization is not allowed within class, even though
 * some compilers allow it. We place our getInfo-related templates and their
 * specializations in WebCLLibWrapperDetail namespace
 */
namespace WebCLLibWrapperDetail {
    // GetInfo implementations for strings
    cl_int getInfoImpl_string (clobject aInstance, int aName, nsCString& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_string_V (clobject aInstance, int aName, nsTArray<nsCString>& aValueOut, InfoFunc infoFunc);

    // GetInfo implementation for ImageFormat
    cl_int getInfoImpl_ImageFormat (clobject aInstance, int aName, cl_image_format& aValueOut, InfoFunc infoFunc);

    // GetInfo implementations functions for wrapper classes
    cl_int getInfoImpl_Platform (clobject aInstance, int aName, cl_platform_id& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Device (clobject aInstance, int aName, cl_device_id& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Context (clobject aInstance, int aName, cl_context& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Event (clobject aInstance, int aName, cl_event& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_CommandQueue (clobject aInstance, int aName, cl_command_queue& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_MemoryObject (clobject aInstance, int aName, cl_mem& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Program (clobject aInstance, int aName, cl_program& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Kernel (clobject aInstance, int aName, cl_kernel& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Sampler (clobject aInstance, int aName, cl_sampler& aValueOut, InfoFunc infoFunc);

    cl_int getInfoImpl_Platform_V (clobject aInstance, int aName, nsTArray<cl_platform_id>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Device_V (clobject aInstance, int aName, nsTArray<cl_device_id>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Context_V (clobject aInstance, int aName, nsTArray<cl_context>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Event_V (clobject aInstance, int aName, nsTArray<cl_event>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_CommandQueue_V (clobject aInstance, int aName, nsTArray<cl_command_queue>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_MemoryObject_V (clobject aInstance, int aName, nsTArray<cl_mem>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Program_V (clobject aInstance, int aName, nsTArray<cl_program>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Kernel_V (clobject aInstance, int aName, nsTArray<cl_kernel>& aValueOut, InfoFunc infoFunc);
    cl_int getInfoImpl_Sampler_V (clobject aInstance, int aName, nsTArray<cl_sampler>& aValueOut, InfoFunc infoFunc);

    // GetInfo implementations with extra for strings
    cl_int getInfoImpl_string (clobject aInstance, clobject aExtra, int aName, nsCString& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_string_V (clobject aInstance, clobject aExtra, int aName, nsTArray<nsCString>& aValueOut, InfoFuncExtra infoFunc);

    // GetInfo implementations functions with extra for wrapper classes
    cl_int getInfoImpl_Platform (clobject aInstance, clobject aExtra, int aName, cl_platform_id& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Device (clobject aInstance, clobject aExtra, int aName, cl_device_id& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Context (clobject aInstance, clobject aExtra, int aName, cl_context& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Event (clobject aInstance, clobject aExtra, int aName, cl_event& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_CommandQueue (clobject aInstance, clobject aExtra, int aName, cl_command_queue& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_MemoryObject (clobject aInstance, clobject aExtra, int aName, cl_mem& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Program (clobject aInstance, clobject aExtra, int aName, cl_program& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Kernel (clobject aInstance, clobject aExtra, int aName, cl_kernel& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Sampler (clobject aInstance, clobject aExtra, int aName, cl_sampler& aValueOut, InfoFuncExtra infoFunc);

    cl_int getInfoImpl_Platform_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_platform_id>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Device_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_device_id>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Context_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_context>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Event_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_event>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_CommandQueue_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_command_queue>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_MemoryObject_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_mem>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Program_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_program>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Kernel_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_kernel>& aValueOut, InfoFuncExtra infoFunc);
    cl_int getInfoImpl_Sampler_V (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_sampler>& aValueOut, InfoFuncExtra infoFunc);


    // Basic types
    template<typename T>
    cl_int getInfo (clobject aInstance, int aName, T& aValueOut, InfoFunc infoFunc)
    {
        D_METHOD_START;
        cl_int err = CL_SUCCESS;
        size_t sze = 0;
        if (!infoFunc)
        {
            D_LOG (LOG_LEVEL_ERROR, "Invalid infoFunc argument (null).");
            return CL_INVALID_VALUE;
        }
        err = infoFunc (aInstance, aName, sizeof(T), (void*)&aValueOut, &sze);
        if (err != CL_SUCCESS)
        {
            D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
            return err;
        }
        if (sze != sizeof(T))
        {
            D_LOG (LOG_LEVEL_ERROR,
                  "getInfo returned a value of unexpected size %lu, expected (%lu bytes)",
                  sze, sizeof(T));
            D_LOG (LOG_LEVEL_WARNING, "Returning synthetic error value.");
            return CL_INVALID_VALUE;
        }
        return err;
    }

    // Vectors of basic types
    template<typename T>
    cl_int getInfo_basicV (clobject aInstance, int aName, nsTArray<T>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        size_t sze = 0;
        cl_int err = CL_SUCCESS;
        if (!infoFunc)
        {
            D_LOG (LOG_LEVEL_ERROR, "Invalid infoFunc argument (null).");
            return CL_INVALID_VALUE;
        }
        err = infoFunc (aInstance, aName, 0, 0, &sze);
        if (err != CL_SUCCESS)
        {
            D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
            return err;
        }
        nsTArray<T> v;
        v.SetLength (sze / sizeof(T));
        // TODO: check that memory allocation didn't fail?
        err = infoFunc (aInstance, aName, sze, (void*)v.Elements(), 0);
        if (err != CL_SUCCESS) {
          D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
          return err;
        }
        aValueOut.SwapElements (v);
        return err;
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<int8_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<uint8_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<int16_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<uint16_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<int32_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<uint32_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<int64_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<uint64_t>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<float>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<double>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aName, aValueOut, infoFunc);
    }

    // Explicit specializations for strings and string vectors
    template <> inline
    cl_int getInfo<nsCString> (clobject aInstance, int aName, nsCString& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_string (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo<nsTArray<nsCString> > (clobject aInstance, int aName, nsTArray<nsCString>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_string_V (aInstance, aName, aValueOut, infoFunc);
    }

    // Explicit specializations for ImageFormats
    template <> inline
    cl_int getInfo<cl_image_format> (clobject aInstance, int aName, cl_image_format& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_ImageFormat (aInstance, aName, aValueOut, infoFunc);
    }

    // Explicit specializations for Wrapper-derived objects
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_platform_id& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Platform (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_device_id& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Device (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_context& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Context (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_event& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Event (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_command_queue& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_CommandQueue (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_mem& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_MemoryObject (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_program& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Program (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_kernel& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Kernel (aInstance, aName, aValueOut, infoFunc);
    }
    template <> inline
    cl_int getInfo (clobject aInstance, int aName, cl_sampler& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Sampler (aInstance, aName, aValueOut, infoFunc);
    }

    // Explicit specializations for vectors of Wrapper-derived objects
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_platform_id>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Platform_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_device_id>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Device_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_context>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Context_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_event>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Event_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_command_queue>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_CommandQueue_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_mem>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_MemoryObject_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_program>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Program_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_kernel>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Kernel_V (aInstance, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, int aName, nsTArray<cl_sampler>& aValueOut, InfoFunc infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Sampler_V (aInstance, aName, aValueOut, infoFunc);
    }


    // GetInfo with extra for basic types
    template<typename T>
    cl_int getInfo(clobject aInstance, clobject aExtra, int aName, T& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        cl_int err = CL_SUCCESS;
        size_t sze = 0;
        if (!infoFunc) {
            D_LOG (LOG_LEVEL_ERROR, "Invalid infoFunc argument (null).");
            return CL_INVALID_VALUE;
        }
        err = infoFunc(aInstance, aExtra, aName, sizeof(T), (void*)&aValueOut, &sze);
        if (err != CL_SUCCESS) {
            D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
            return err;
        }
        if (sze != sizeof(T)) {
            D_LOG (LOG_LEVEL_ERROR,
                    "getInfo returned a value of unexpected size %lu, expected (%lu bytes)",
                    sze, sizeof(T));
            D_LOG (LOG_LEVEL_WARNING, "Returning synthetic error value.");
            return CL_INVALID_VALUE;
        }
        return err;
    }

    // GetInfo with extra for vectors of basic types
    template<typename T>
    cl_int getInfo_basicV (clobject aInstance, clobject aExtra, int aName, nsTArray<T>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        size_t sze = 0;
        if (!infoFunc) {
            D_LOG (LOG_LEVEL_ERROR, "Invalid infoFunc argument (null).");
            return CL_INVALID_VALUE;
        }
        cl_int err = infoFunc (aInstance, aExtra, aName, 0, 0, &sze);
        if (err != CL_SUCCESS) {
            D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
            return err;
        }
        nsTArray<T> v;
        v.SetLength (sze / sizeof(T));
        // TODO: check that memory allocation didn't fail?
        err = infoFunc (aInstance, aExtra, aName, sze, (void*)v.Elements(), 0);
        if (err != CL_SUCCESS) {
          D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
          return err;
        }
        aValueOut.SwapElements (v);

        return err;
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<int8_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<uint8_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<int16_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<uint16_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<int32_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<uint32_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<int64_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<uint64_t>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<float>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<double>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfo_basicV (aInstance, aExtra, aName, aValueOut, infoFunc);
    }

    // GetInfo with extra for strings and string vectors
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsCString& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_string (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<nsCString>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_string_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }

    // GetInfo with extra for Wrapper-derived objects
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_platform_id& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Platform (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_device_id& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Device (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_context& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Context (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_event& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Event (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_command_queue& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_CommandQueue (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_mem& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_MemoryObject (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_program& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Program (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_kernel& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Kernel (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, cl_sampler& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Sampler (aInstance, aExtra, aName, aValueOut, infoFunc);
    }

    // GetInfo with extra for vectors of Wrapper-derived objects
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_platform_id>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Platform_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_device_id>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Device_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_context>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Context_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_event>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Event_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_command_queue>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_CommandQueue_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_mem>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_MemoryObject_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_program>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Program_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_kernel>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Kernel_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }
    template<> inline
    cl_int getInfo (clobject aInstance, clobject aExtra, int aName, nsTArray<cl_sampler>& aValueOut, InfoFuncExtra infoFunc) {
        D_METHOD_START;
        return getInfoImpl_Sampler_V (aInstance, aExtra, aName, aValueOut, infoFunc);
    }

}


// TODO! clGetSupportedImageFormats


#define LIBCL_ENSURE_LIB_LOADED(rv) do { \
  if (!mLibCL) { \
    D_LOG (LOG_LEVEL_ERROR, "OpenCL Library not loaded!"); \
    mStatus = NO_LIBRARY; \
    return rv; \
  } } while(0)

#define LIBCL_ENSURE_SYMBOL_LOADED(sym,rv) do { \
  if (!mLibCL->symbols->sym) { \
    D_LOG (LOG_LEVEL_ERROR, "Symbol %s not loaded in library %s.", #sym, mLibCL->libName()); \
    mStatus = NO_SYMBOL; \
    return rv; \
  } } while(0)

#define LIBCL_WRAPPER_BEGIN(sym,rv) do { \
  D_METHOD_START; \
  mStatus = SUCCESS; \
  LIBCL_ENSURE_LIB_LOADED (rv); \
  LIBCL_ENSURE_SYMBOL_LOADED (sym, rv); \
  } while (0)




#include "WebCL_libcl.h"
#include "WebCL_clsymbols.h"

class WebCL_LibCLWrapper : public nsISupports
{
public:
  enum Status {
    SUCCESS = 0,
    NO_LIBRARY,
    NO_SYMBOL,
    UNKNOWN
  };

  NS_DECL_ISUPPORTS

  explicit WebCL_LibCLWrapper (WebCL_LibCL* aLibCL);
  virtual ~WebCL_LibCLWrapper ();

  Status status () const;
  WebCL_LibCL* library ();

  // OpenCL 1.1 API

  // Query info parameters
  template <typename T>
  cl_int getPlatformInfo (cl_platform_id aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetPlatformInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetPlatformInfo);
                                           //libcl_infoFunc_Platform);
  }

  template <typename T>
  cl_int getDeviceInfo (cl_device_id aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetDeviceInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetDeviceInfo);
                                           //libcl_infoFunc_Device);
  }

  template <typename T>
  cl_int getContextInfo (cl_context aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetContextInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetContextInfo);
                                           //libcl_infoFunc_Context);
  }

  template <typename T>
  cl_int getCommandQueueInfo (cl_command_queue aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetCommandQueueInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetCommandQueueInfo);
                                           //libcl_infoFunc_CommandQueue);
  }

  template <typename T>
  cl_int getMemObjectInfo (cl_mem aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetMemObjectInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetMemObjectInfo);
                                           //libcl_infoFunc_MemObject);
  }

  template <typename T>
  cl_int getImageInfo (cl_mem aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetImageInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetImageInfo);
                                           //libcl_infoFunc_Image);
  }

  template <typename T>
  cl_int getSamplerInfo (cl_sampler aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetSamplerInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetSamplerInfo);
                                           //libcl_infoFunc_Sampler);
  }

  template <typename T>
  cl_int getProgramInfo (cl_program aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetProgramInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetProgramInfo);
                                           //libcl_infoFunc_Program);
  }

  template <typename T>
  cl_int getProgramBuildInfo (cl_program aInstance, cl_device_id aDevice, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetProgramBuildInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aDevice, aParamName, aValueOut,
                                           (InfoFuncExtra)mLibCL->symbols->clGetProgramBuildInfo);
                                           //libcl_infoFunc_ProgramBuild_E);
  }

  template <typename T>
  cl_int getKernelInfo (cl_kernel aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetKernelInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetKernelInfo);
                                           //libcl_infoFunc_Kernel);
  }

  template <typename T>
  cl_int getKernelWorkGroupInfo (cl_kernel aInstance, cl_device_id aDevice, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetKernelWorkGroupInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aDevice, aParamName, aValueOut,
                                           (InfoFuncExtra)mLibCL->symbols->clGetKernelWorkGroupInfo);
                                           //libcl_infoFunc_KernelWorkGroup_E);
  }

  template <typename T>
  cl_int getEventInfo (cl_event aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetEventInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetEventInfo);
                                           //libcl_infoFunc_Event);
  }

  template <typename T>
  cl_int getEventProfilingInfo (cl_event aInstance, int aParamName, T& aValueOut) {
    LIBCL_WRAPPER_BEGIN (clGetEventProfilingInfo, 0);
    return WebCLLibWrapperDetail::getInfo (aInstance, aParamName, aValueOut,
                                           (InfoFunc)mLibCL->symbols->clGetEventProfilingInfo);
                                           //libcl_infoFunc_EventProfiling);
  }


  // Query platform info

  cl_int getPlatformIDs (nsTArray<cl_platform_id>& aPlatformsOut);

  // Query devices

  cl_int getDeviceIDs (cl_platform_id aPlatform, int aDeviceType,
                       nsTArray<cl_device_id>& aDevicesOut);

  // Contexts

  cl_context createContext (cl_context_properties* aProperties,
                            nsTArray<cl_device_id> const& aDevices,
                            void (CL_CALLBACK *aNotify) (const char *, const void *, size_t cb, void *),
                            void* aNotifyUserData,
                            cl_int* aErrorOut);

  cl_context createContextFromType (cl_context_properties* aProperties, int aDeviceType,
                                    void (CL_CALLBACK *aNotify) (const char *, const void *, size_t cb, void *),
                                    void* aNotifyUserData,
                                    cl_int* aErrorOut);

  cl_int retainContext (cl_context aContext);

  cl_int releaseContext (cl_context aContext);

  // Command queues

  cl_command_queue createCommandQueue (cl_context aContext, cl_device_id aDevice,
                                       cl_command_queue_properties aProperties,
                                       cl_int* aErrorOut);

  cl_int retainCommandQueue (cl_command_queue aCmdQueue);

  cl_int releaseCommandQueue (cl_command_queue aCmdQueue);

  cl_int setCommandQueueProperty (cl_command_queue aCmdQueue,
                                  cl_command_queue_properties aProperties,
                                  cl_bool aEnable,
                                  cl_command_queue_properties* aOldProperties);

  // Memory objects

  cl_mem createBuffer (cl_context aContext, cl_mem_flags aFlags, size_t aSize,
                       void* aHostPtr, cl_int* aErrorOut);

  cl_mem createSubBuffer (cl_mem aBuffer, cl_mem_flags aFlags,
                          cl_buffer_create_type aCreateType, const void* aCreateInfo,
                          cl_int* aErrorOut);

  cl_int enqueueReadBuffer (cl_command_queue aCmdQueue, cl_mem aBuffer, cl_bool aBlocking,
                            size_t aOffset, size_t aCb, void* aPtr,
                            nsTArray<cl_event> const& aEventWaitList, cl_event* aEventOut);

  cl_int enqueueWriteBuffer (cl_command_queue aCmdQueue, cl_mem aBuffer, cl_bool aBlocking,
                             size_t aOffset, size_t aCb, void* aPtr,
                             nsTArray<cl_event> const& aEventWaitList, cl_event* aEventOut);

  cl_int enqueueReadBufferRect (cl_command_queue aCmdQueue, cl_mem aBuffer, cl_bool aBlocking,
                                size_t const aBufferOrigin[3], size_t const aHostOrigin[3],
                                size_t const aRegion[3],
                                size_t aBufferRowPitch, size_t aBufferSlicePitch,
                                size_t aHostRowPitch, size_t aHostSlicePitch, void* aPtr,
                                nsTArray<cl_event> const& aEventWaitList, cl_event* aEventOut);

  cl_int enqueueWriteBufferRect (cl_command_queue aCmdQueue, cl_mem aBuffer, cl_bool aBlocking,
                                 size_t const aBufferOrigin[3], size_t const aHostOrigin[3],
                                 size_t const aRegion[3],
                                 size_t aBufferRowPitch, size_t aBufferSlicePitch,
                                 size_t aHostRowPitch, size_t aHostSlicePitch, void* aPtr,
                                 nsTArray<cl_event> const& aEventWaitList, cl_event* aEventOut);

  cl_int retainMemObject (cl_mem aMemObject);

  cl_int releaseMemObject (cl_mem aMemObject);

  cl_int setMemObjectDestructorCallback (cl_mem aMemObject,
                                         void (CL_CALLBACK* aNotify)(cl_mem, void*),
                                         void* aUserData);

  cl_mem createImage2D (cl_context aContext, cl_mem_flags aFlags,
                        cl_image_format const* aImageFormat,
                        size_t aWidth, size_t aHeight, size_t aRowPitch,
                        void* aHostPtr, cl_int* aErrorOut);

  cl_mem createImage3D (cl_context aContext, cl_mem_flags aFlags,
                        cl_image_format const* aImageFormat,
                        size_t aWidth, size_t aHeight, size_t aDepth,
                        size_t aRowPitch, size_t aSlicePitch,
                        void* aHostPtr, cl_int* aErrorOut);

  cl_int getSupportedImageFormats (cl_context aContext, cl_mem_flags aFlags,
                                   cl_mem_object_type aMemObjectType,
                                   nsTArray<cl_image_format>& aImageFormatsOut);

  cl_int enqueueReadImage (cl_command_queue aCmdQueue, cl_mem aImage, cl_bool aBlocking,
                           size_t const aOrigin[3], size_t const aRegion[3],
                           size_t aRowPitch, size_t aSlicePitch, void* aPtr,
                           nsTArray<cl_event> const& aEventWaitList, cl_event* aEventOut);

  cl_int enqueueWriteImage (cl_command_queue aCmdQueue, cl_mem aImage, cl_bool aBlocking,
                            size_t const aOrigin[3], size_t const aRegion[3],
                            size_t aInputRowPitch, size_t aInputSlicePitch, void* aPtr,
                            nsTArray<cl_event> const& aEventWaitList, cl_event* aEventOut);

  cl_int enqueueCopyImage (cl_command_queue aCmdQueue, cl_mem aSrcImage, cl_mem aDstImage,
                           size_t const aSrcOrigin[3], size_t const aDstOrigin[3],
                           size_t const aRegion[3],
                           nsTArray<cl_event> const& aEventWaitList, cl_event* aEventOut);

  cl_int enqueueCopyImageToBuffer (cl_command_queue aCmdQueue,
                                   cl_mem aSrcImage, cl_mem aDstBuffer,
                                   size_t const aSrcOrigin[3], size_t const aRegion[3],
                                   size_t aDstOffset,
                                   nsTArray<cl_event> const& aEventWaitList,
                                   cl_event* aEventOut);

  cl_int enqueueCopyBufferToImage (cl_command_queue aCmdQueue,
                                   cl_mem aSrcBuffer, cl_mem aDstImage,
                                   size_t aSrcOffset, size_t const aDstOrigin[3],
                                   size_t const aRegion[3],
                                   nsTArray<cl_event> const& aEventWaitList,
                                   cl_event* aEventOut);

  cl_int enqueueCopyBufferRect (cl_command_queue aCmdQueue,
                                cl_mem aSrcBuffer, cl_mem aDstBuffer,
                                size_t const aSrcOrigin[3], size_t const aDstOrigin[3],
                                size_t const aRegion[3],
                                size_t aSrcRowPitch, size_t aSrcSlicePitch,
                                size_t aDstRowPitch, size_t aDstSlicePitch,
                                nsTArray<cl_event> const& aEventWaitList,
                                cl_event* aEventOut);

  void* enqueueMapBuffer (cl_command_queue aCmdQueue, cl_mem aBuffer, cl_bool aBlocking,
                          cl_map_flags aFlags, size_t aOffset, size_t aCb,
                          nsTArray<cl_event> const& aEventWaitList,
                          cl_event* aEventOut, cl_int* aErrorOut);

  void* enqueueMapImage (cl_command_queue aCmdQueue, cl_mem aImage,
                         cl_bool aBlocking, cl_map_flags aFlags,
                         size_t const aOrigin[3], size_t const aRegion[3],
                         size_t* aRowPitchOut, size_t* aSlicePitchOut,
                         nsTArray<cl_event> const& aEventWaitList,
                         cl_event* aEventOut, cl_int* aErrorOut);

  cl_int enqueueUnmapMemObject (cl_command_queue aCmdQueue, cl_mem aMemObject,
                                void* aMappedPtr,
                                nsTArray<cl_event> const& aEventWaitList,
                                cl_event* aEventOut);

  // Sampler objects

  cl_sampler createSampler (cl_context aContext, cl_bool aNormalizedCoords,
                            cl_addressing_mode aAdressingMode,
                            cl_filter_mode aFilterMode, cl_int* aErrorOut);

  cl_int retainSampler (cl_sampler aSampler);

  cl_int releaseSampler (cl_sampler aSampler);

  // Program objects

  cl_program createProgramWithSource (cl_context aContext, nsCString aSource,
                                      cl_int* aErrorOut);

  cl_program createProgramWithBinary (cl_context aContext,
                                      nsTArray<cl_device_id> const& aDevices,
                                      nsTArray<size_t> const& aBinaryLengths,
                                      nsTArray<unsigned char const*> const& aBinaries,
                                      nsTArray<cl_int>& aBinaryStatusOut,
                                      cl_int* aErrorOut);

  cl_int retainProgram (cl_program aProgram);

  cl_int releaseProgram (cl_program aProgram);

  cl_int unloadCompiler ();

  cl_int buildProgram (cl_program aProgram,
                       nsTArray<cl_device_id> const& aDevices,
                       nsCString const& aOptions,
                       void (CL_CALLBACK* aNotify)(cl_program, void*),
                       void* aUserData);

  // Kernel objects

  cl_kernel createKernel (cl_program aProgram, nsCString aKernelName,
                          cl_int* aErrorOut);

  cl_int createKernelsInProgram (cl_program aProgram,
                                 nsTArray<cl_kernel>& aKernelsOut);

  cl_int retainKernel (cl_kernel aKernel);

  cl_int releaseKernel (cl_kernel aKernel);

  cl_int setKernelArg (cl_kernel aKernel, cl_uint aIndex, size_t aSize,
                       const void* aValue);

  // Executing kernels

  cl_int enqueueNDRangeKernel (cl_command_queue aCmdQueue, cl_kernel aKernel,
                               cl_uint aWorkDim,
                               nsTArray<size_t> const& aGlobalWorkOffset,
                               nsTArray<size_t> const& aGlobalWorkSize,
                               nsTArray<size_t> const& aLocalWorkSize,
                               nsTArray<cl_event> const& aEventWaitList,
                               cl_event* aEventOut);

  cl_int enqueueTask (cl_command_queue aCmdQueue, cl_kernel aKernel,
                      nsTArray<cl_event> const& aEventWaitList,
                      cl_event* aEventOut);

  cl_int enqueueNativeKernel (cl_command_queue aCmdQueue,
                              void (CL_CALLBACK *aUserFunc)(void *),
                              void* aArgs, size_t aCbArgs,
                              nsTArray<cl_mem> const& aMemObjects,
                              const void** aArgsMemLoc,
                              nsTArray<cl_event> const& aEventWaitList,
                              cl_event* aEventOut);

  // Event objects

  cl_event createUserEvent (cl_context aContext, cl_int* aErrorOut);

  cl_int setUserEventStatus (cl_event aEvent, cl_int aExecutionStatus);

  cl_int waitForEvents (nsTArray<cl_event> const& aEvents);

  cl_int setEventCallback (cl_event aEvent, cl_int aCommandExecCallbackType,
                           void (CL_CALLBACK * aNotify)(cl_event, cl_int, void*),
                           void* aUserData);

  cl_int retainEvent (cl_event aEvent);

  cl_int releaseEvent (cl_event aEvent);

  // Execution of kernels and memory objects commands

  cl_int enqueueMarker (cl_command_queue aCmdQueue, cl_event* aEventOut);

  cl_int enqueueWaitForEvents (cl_command_queue aCmdQueue,
                               nsTArray<cl_event> const& aEventWaitList);

  cl_int enqueueBarrier (cl_command_queue aCmdQueue);

  // Profiling operations on memory objects and kernels

  // Flush and finish

  cl_int flush (cl_command_queue aCmdQueue);

  cl_int finish (cl_command_queue aCmdQueue);


protected:
  nsCOMPtr<WebCL_LibCL> mLibCL;
  Status mStatus;

private:
  WebCL_LibCLWrapper (WebCL_LibCLWrapper const&);
  WebCL_LibCLWrapper& operator= (WebCL_LibCLWrapper const&);
};

#endif //_WEBCL_CLWRAPPER_H_
