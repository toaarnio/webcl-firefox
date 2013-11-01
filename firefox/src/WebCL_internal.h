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

#ifndef _WEBCL_INTERNAL_H_
#define _WEBCL_INTERNAL_H_

#include "WebCLCommon.h"
#include "WebCLPlatform.h"
#include "WebCLDevice.h"
#include "WebCLContext.h"
#include "WebCLCommandQueue.h"
#include "WebCLMemoryObject.h"
#include "WebCLProgram.h"
#include "WebCLKernel.h"
#include "WebCLEvent.h"
#include "WebCLSampler.h"

#include <CL/opencl.h>

#include "nsError.h"
#include "jsapi.h"
#include "nsServiceManagerUtils.h"
#include "nsIXPConnect.h"
#include "nsIVariant.h"
#include "nsStringAPI.h" /*#include "nsStringGlue.h"*/
#include "nsTArray.h"


/** Return value for IDL functions when an error has been reported with
 * WebCL_reportJSError. Note that NS_OK is intentional, any "real" XPCOM
 * error code (e.g. NS_ERROR_FAILURE) will ignore the clear text error and
 * produce the usual XPCOM exception.
 */
#define WEBCL_XPCOM_ERROR   NS_OK




/**
 * Enumeration of supported types for the info parameter getters (getInfo)
 * and setKernelArg.
 */

namespace types {
enum CLType {
    UNKNOWN,

    BYTE,
    CHAR,
    UCHAR,
    SHORT,
    USHORT,

    // Basic types
    INT,                        // cl_int
    UINT,                       // cl_uint
    LONG,                       // cl_long
    ULONG,                      // cl_ulong
    BOOL,                       // cl_bool = cl_uint                    //10
    SIZE_T,                     // size_t
    HALF,                       // cl_half
    FLOAT,                      // cl_float
    DOUBLE,                     // cl_double

    // String types
    STRING,                     // char*

    // Class types
    PLATFORM,                   // cl_platform_id
    DEVICE,                     // cl_device_id
    CONTEXT,                    // cl_context
    COMMAND_QUEUE,              // cl_command_queue
    MEMORY_OBJECT,              // cl_mem                               //20
    PROGRAM,                    // cl_program
    KERNEL,                     // cl_kernel
    EVENT,                      // cl_event
    SAMPLER,                    // cl_sampler

    IMAGE_FORMAT,

    // Special types
    ADRESSING_MODE,             // cl_addressing_mode
    BUILD_STATUS,               // cl_build_status
    CHANNEL_ORDER,              // cl_channel_order
    CHANNEL_TYPE,               // cl_channel_type
    COMMAND_QUEUE_PROPERTIES,   // cl_command_queue_properties          //30
    COMMAND_TYPE,               // cl_command_type
    CONTEXT_PROPERTIES,         // cl_context_properties
    // cl_d3d10_device_set_khr, cl_d3d10_device_source_khr removed
    DEVICE_EXEC_CAPABILITIES,   // cl_device_exec_capabilities
    DEVICE_FP_CONFIG,           // cl_device_fp_config
    DEVICE_LOCAL_MEM_TYPE,      // cl_device_local_mem_type
    DEVICE_MEM_CACHE_TYPE,      // cl_device_mem_cache_type
    DEVICE_TYPE,                // cl_device_type
    FILTER_MODE,                // cl_filter_mode
    GL_OBJECT_TYPE,             // cl_gl_object_type
    MAP_FLAGS,                  // cl_map_flags                         //40
    MEM_FENCE_FLAGS,            // cl_mem_fence_flags
    MEM_FLAGS,                  // cl_mem_flags
    MEM_OBJECT_TYPE,            // cl_mem_object_type

    // Vector types
    BYTE_V,
    CHAR_V,
    UCHAR_V,
    SHORT_V,
    USHORT_V,
    INT_V,                      // cl_int*
    UINT_V,                     // cl_uint*                             //50
    LONG_V,                     // cl_long*
    ULONG_V,                    // cl_ulong*
    BOOL_V,                     // cl_bool*
    SIZE_T_V,                   // size_t*
    HALF_V,
    FLOAT_V,
    DOUBLE_V,
    STRING_V,                   // char**

    PLATFORM_V,
    DEVICE_V,                                                           //60
    CONTEXT_V,
    COMMAND_QUEUE_V,
    MEMORY_OBJECT_V,
    PROGRAM_V,
    KERNEL_V,
    EVENT_V,
    SAMPLER_V,

    LAST
};
}


/** Create the \c types object made available to script context as \c WebCL.types .
 * The resulting object will contain a property for each enumeration constant in
 * \c types::CLType from \c clwrappertypes.h. Each property is given numeric value of
 * respective enumeration constant.
 * \see clwrappertypes.h
 */
nsresult WebCL_createTypesObject (JSContext *cx, nsIVariant** aResultOut);

/** Create the version object made available to script context as WebCL.version.
 * The version object is an array of four integer elements containing the WebCL
 * major, minor and release version numbers, and version control revision number
 * respectively.
 * The C++ type of the object is nsIVariant.
 */
nsresult WebCL_createVersionObject (JSContext *cx, nsIVariant** aResultOut);


/** Report an error message to the script context.
 */
nsresult WebCL_reportJSError (JSContext* cx, char const* aMsg, ...);


/** Parse OpenCL platform version information.
 */
nsresult WebCL_parseOpenCLVersion (nsCString const& aVersionStr,
                                   int& aVersionMajorOut,
                                   int& aVersionMinorOut,
                                   nsCString& aVendorSpecificInfoOut);

/** Convert an array of nsIVariants to vector.
 * \param aVariant nsIVariant containing the input array of nsIVariants.
 * Accepted variant types are nsIDataType::VTYPE_ARRAY, nsIDataType::VTYPE_EMPTY_ARRAY,
 * nsIDataType::VTYPE_INTERFACE and nsIDataType::VTYPE_INTERFACE_IS. Proxy objects
 * are unwrapped automatically.
 * \param aResultOut Resulting vector as out-parameter.
 * Any existing content will be removed WITHOUT calling NS_RELEASE.
 * \return Error value or NS_OK on success
 */
nsresult WebCL_getVariantsFromJSArray (JSContext *cx, nsIVariant* aVariant,
                                       nsTArray<nsIVariant*> & aResultOut);


/** Release nsIVariant objects contained in a vector.
 * Simply calls NS_RELEASE for each non-null item in the vector and then
 * clears the vector.
 * \param aVariants Input vector.
 */
void WebCL_releaseVariantVector (nsTArray<nsIVariant*> & aVariants);



// Vectors of basic types
/** Template function that converts a vector of basic type items to a JSArray
 * contained in nsIVariant.
 */
template<typename T>
nsresult WebCL_convertVectorToJSArrayInVariant(JSContext *cx,
                                               nsTArray<T> const& aVector,
                                               int aType, nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper*)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aResultOut);
  nsresult rv;

  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  JS_BeginRequest (cx);

  JSObject* jsArr = JS_NewArrayObject (cx, aVector.Length (), NULL);
  if (!jsArr)
  {
    JS_EndRequest(cx);
    return NS_ERROR_OUT_OF_MEMORY;
  }

  size_t cnt = 0;
  switch (aType)
  {
    case types::BYTE_V:
    case types::CHAR_V:
    case types::UCHAR_V:
    case types::SHORT_V:
    case types::USHORT_V:
    case types::INT_V:
    case types::UINT_V:
    case types::LONG_V:
    case types::ULONG_V:
    case types::SIZE_T_V:
    case types::HALF_V: // TODO: how should we handle HALF_V?
      // integers
      for (typename nsTArray<T>::index_type i = 0; i < aVector.Length(); ++i)
      {
        js::Value val;
        if (val.setNumber ((double)aVector[i]))
        {
          JS_SetElement (cx, jsArr, cnt++, &val);
        }
        else
        {
          WebCL_reportJSError (cx, "Failed to convert internal integer value to JavaScript value.");
          rv = NS_ERROR_FAILURE;
        }
      }
      break;
    case types::BOOL_V:
      // booleans
      for (typename nsTArray<T>::index_type i = 0; i < aVector.Length(); ++i)
      {
        js::Value val;
        val.setBoolean (aVector[i]);
        JS_SetElement (cx, jsArr, cnt++, &val);
      }
      break;
    case types::FLOAT_V:
    case types::DOUBLE_V:
      // floating points
      for (typename nsTArray<T>::index_type i = 0; i < aVector.Length(); ++i)
      {
        js::Value val;
        val.setDouble (aVector[i]);
        JS_SetElement (cx, jsArr, cnt++, &val);
      }
      break;
    default: {
        D_LOG (LOG_LEVEL_ERROR, "Unsupported type %d.", aType);
        // TODO: this error message is probably lost
        WebCL_reportJSError (cx, "Unsupported type %d.", aType);
        rv = NS_ERROR_FAILURE;
      }
      break;
  }

  JS_EndRequest(cx);
  if (NS_FAILED (rv))
    return rv;

  // Wrap the JSArray in an nsIVariant
  nsCOMPtr<nsIVariant> value;
  js::Value jsValue;
  jsValue.setObject (*jsArr);
  rv = xpc->JSValToVariant(cx, &jsValue, getter_AddRefs(value));
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*aResultOut = value);

  return NS_OK;
}


/* The following type-specific conversion functions are called by
 * WebCL_convertVectorToJSArrayInVariant template function specializations
 * below them. This approach allows the actual implementations to reside
 * in WebCLCommon.cpp while the template wrapper is exposed from this header.
 */

/** Convert a vector of nsCString to a JSArray of strings contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_string(JSContext *cx,
                                                      nsTArray<nsCString> const& aVector,
                                                      int aType, nsIVariant** aResultOut,
                                                      WebCL_LibCLWrapper*);

/** Convert a vector of PlatformWrapper instance pointers to a JSArray of WebCLPlatforms contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLPlatform(JSContext *cx,
                                               nsTArray<cl_platform_id> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of DeviceWrapper instance pointers to a JSArray of WebCLDevices contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLDevice(JSContext *cx,
                                               nsTArray<cl_device_id> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of ContextWrapper instance pointers to a JSArray of WebCLContexts contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLContext(JSContext *cx,
                                               nsTArray<cl_context> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of CommandQueueWrapper instance pointers to a JSArray of WebCLCommandQueues contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLCommandQueue(JSContext *cx,
                                               nsTArray<cl_command_queue> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of MemoryObjectWrapper instance pointers to a JSArray of WebCLMemoryObjects contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLMemoryObject(JSContext *cx,
                                               nsTArray<cl_mem> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of ProgramWrapper instance pointers to a JSArray of WebCLPrograms contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLProgram(JSContext *cx,
                                               nsTArray<cl_program> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of KernelWrapper instance pointers to a JSArray of WebCLKernels contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLKernel(JSContext *cx,
                                               nsTArray<cl_kernel> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of EventWrapper instance pointers to a JSArray of WebCLEvents contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLEvent(JSContext *cx,
                                               nsTArray<cl_event> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);
/** Convert a vector of SamplerWrapper instance pointers to a JSArray of WebCLSamplers contained in nsIVariant. */
nsresult WebCL_convertVectorToJSArrayInVariant_WebCLSampler(JSContext *cx,
                                               nsTArray<cl_sampler> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper* aLibWrapper);


/** WebCL_convertVectorToJSArrayInVariant template function specializations for
 *  WebCL* object types. These implementations simply relay the call to
 *  type-specific implementation.
 *  NOTE: The second parameter, type, is ignored.
 */
#define CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF(C,T) \
  template<> inline \
  nsresult WebCL_convertVectorToJSArrayInVariant<T>(JSContext *cx, nsTArray<T> const& aVector, \
                                               int, nsIVariant** aResultOut, \
                                               WebCL_LibCLWrapper* aLibWrapper) { \
    return WebCL_convertVectorToJSArrayInVariant_##C (cx, (nsTArray<T> const)aVector, \
                                                      aResultOut, aLibWrapper); \
  }
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLPlatform, cl_platform_id)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLDevice, cl_device_id)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLContext, cl_context)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLCommandQueue, cl_command_queue)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLMemoryObject, cl_mem)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLProgram, cl_program)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLKernel, cl_kernel)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLEvent, cl_event)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_DEF (WebCLSampler, cl_sampler)


// String vectors
/** WebCL_convertVectorToJSArrayInVariant template function specializations for
 *  strings. This implementation simply relays the call to the type-specific
 *  implementation.
 */
template<> inline
nsresult WebCL_convertVectorToJSArrayInVariant<nsCString>(JSContext *cx,
                                                          nsTArray<nsCString> const& aVector,
                                                          int aType, nsIVariant** aResultOut,
                                                          WebCL_LibCLWrapper*)
{
  D_METHOD_START;
  return WebCL_convertVectorToJSArrayInVariant_string (cx, aVector, aType, aResultOut, 0);
}


// ImageFormatWrapper vectors
/** Convert a vector of ImageFormatWrappers to a JSArray contained in an nsIVariant.
 * NOTE: This is not a specialized template but an overloaded function!
 */
nsresult WebCL_convertVectorToJSArrayInVariant(JSContext *cx,
                                               nsTArray<cl_image_format> const& aVector,
                                               nsIVariant** aResultOut,
                                               WebCL_LibCLWrapper*);


/** Get JSObject from an nsIVariant.
 * \param aCx A valid JSContext or NULL.
 * \param aVariant An nsIVariant containing a JavaScript object.
 * \param aResultOut Out-pointer for result.
 * \return Error code or NS_OK on success.
 */
nsresult WebCL_variantToJSObject (JSContext* aCx, nsIVariant* aVariant, JSObject** aResultOut);


/** Convert an nsIVariant containing a JSObject to ImageFormatWrapper.
 * \param aVariant An nsIVariant containing a JSObject with \c channelOrder and
 * \c channelDataType properties. Also \c image_channel_order and
 * \c image_channel_data_type are accepted respectively, if primary properties
 * are not available.
 * \param aResultOut Out-parameter for result.
 * \return Error code or NS_OK on success.
 */
nsresult WebCL_variantToImageFormat (JSContext *cx, nsIVariant* aVariant, cl_image_format& aResultOut);


/** Convert ImageFormatWrapper to a JSObject in an nsIVariant.
 * Resulting JSObject will have properties \c channelOrder and \c channelDataType
 * containing values of respective ImageFormatWrapper members.
 * \param aImageFormat ImageFormatWrapper instance.
 * \param aResultOut Out-pointer for result.
 */
nsresult WebCL_imageFormatToVariant (JSContext *cx, cl_image_format const& aImageFormat, nsIVariant** aResultOut);


/** Template function that converts a vectpr of nsIVariants containing WebCL*
 * class instances to a vector of internal OpenCL resources.
 * \param aVariants A vector of nsIVariants containing instances of T_WebCLInterface.
 * \param aResultOut resulting vector as out-parameter.
 * Any existing content will be removed.
 * \return Error value or NS_OK on success
 */
template <typename T_WebCLInterface, typename T_ocl>
nsresult WebCL_convertVariantVectorToInternalVector (nsTArray<nsIVariant*> const& aVariants,
                                                     nsTArray<T_ocl>& aWrappersOut)
{
  D_METHOD_START;
  nsresult rv;
  nsTArray<T_ocl> result;
  result.SetCapacity (aVariants.Length ());

  rv = NS_OK;
  for (typename nsTArray<nsIVariant*>::index_type i = 0; i < aVariants.Length(); ++i)
  {
    if (!aVariants[i])
    {
      D_LOG (LOG_LEVEL_ERROR, "Invalid non-variant element at position %d.", i+1);
      rv = NS_ERROR_FAILURE;
      break;
    }

    nsCOMPtr<nsISupports> isu;
    rv = aVariants[i]->GetAsISupports (getter_AddRefs(isu));
    if (NS_FAILED (rv))
    {
      D_LOG (LOG_LEVEL_ERROR,
             "Expected nsISupports element at position %d. (rv %d)", i+1, rv);
      break;
    }
    nsCOMPtr<T_WebCLInterface> impl = do_QueryInterface (isu, &rv);
    if (NS_FAILED (rv))
    {
      D_LOG (LOG_LEVEL_ERROR,
             "Failed to convert element at position %d to XPCOM implementation. (rv %d)",
             i+1, rv);
      break;
    }

    result.AppendElement ((T_ocl)(impl->getInternal ()));
  }
  NS_ENSURE_SUCCESS (rv, rv);

  aWrappersOut.SwapElements (result);
  return NS_OK;
}


nsresult WebCL_variantToRegion (JSContext* cx, nsIVariant* aVariant,
                                nsTArray<size_t>& aRegionOut);

nsresult WEBCL_variantToOrigin (JSContext* cx, nsIVariant* aVariant,
                                nsTArray<size_t>& aOriginOut);

nsresult WEBCL_variantToOffset (JSContext* cx, nsIVariant* aVariant,
                                nsTArray<size_t>& aOffsetOut);


nsresult variantTypedArrayToData (JSContext* cx, nsIVariant* aTypedArrayVariant,
                                  void** aDataOut, size_t* aLengthOut,
                                  nsIXPConnectJSObjectHolder** aHolderOut = 0,
                                  bool throwErrors = true);

//==============================================================================

/**
 * The following macros implement getInfo calls and type conversions of the
 * resulting values to nsIVariants.
 *
 * the _FUN_ variants take a function pointer to the actual info function wrapper,
 * whereas the non-_FUN_ variants take pointer to the wrapper instance itself.
 *
 * \param name The name (enum) of an info parameter.
 * \param infoFunc The getInfo class function from a Wrapper class.
 * \param internal Internal OpenCL resource.
 * \param variant An nsIVariant instance.
 * \param err Out-parameter for OpenCL error code.
 * \param rv Out-parameter for Mozilla error code.
 */

// Sadly, we can't use templates or other forms of function overloading here
// since e.g. cl_bool is typedef for cl_uint and we want to handle integers
// and booleans separately for nsIVariants.

#define GETINFO_MEDIATOR_FUN_CHAR(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_char val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt8 (val); \
    }

#define GETINFO_MEDIATOR_FUN_UCHAR(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_uchar val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint8 (val); \
    }

#define GETINFO_MEDIATOR_FUN_SHORT(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_short val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt16 (val); \
    }

#define GETINFO_MEDIATOR_FUN_USHORT(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_ushort val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint16 (val); \
    }

#define GETINFO_MEDIATOR_FUN_INT(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_int val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt32 (val); \
    }

#define GETINFO_MEDIATOR_FUN_UINT(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_uint val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint32 (val); \
    }

#define GETINFO_MEDIATOR_FUN_LONG(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_long val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt64 (val); \
    }

#define GETINFO_MEDIATOR_FUN_ULONG(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_ulong val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint64 (val); \
    }

#define GETINFO_MEDIATOR_FUN_BOOL(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_bool val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsBool (val); \
    }

#define GETINFO_MEDIATOR_FUN_SIZET(name,lib,infoFunc,internal,variant,err,rv) { \
      size_t val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint32 (val); /* FIXME: Proper type? */ \
    }

#define GETINFO_MEDIATOR_FUN_HALF(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_half val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint16 (val); \
    }

#define GETINFO_MEDIATOR_FUN_FLOAT(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_float val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsFloat (val); \
    }

#define GETINFO_MEDIATOR_FUN_DOUBLE(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_double val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsDouble (val); \
    }

#define GETINFO_MEDIATOR_FUN_STRING(name,lib,infoFunc,internal,variant,err,rv) { \
      nsCString val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsACString (val); \
    }

#define GETINFO_MEDIATOR_FUN_IMAGE_FORMAT(name,lib,infoFunc,internal,variant,err,rv) { \
      cl_image_format val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) { \
          nsIWritableVariant* res; \
          rv = WebCL_imageFormatToVariant (cx, val, (nsIVariant**)&res); \
          variant = already_AddRefed<nsIWritableVariant>(res); \
      } \
    }

/**
 * The following macros implement getInfo calls and type conversions of the
 * resulting values to nsIVariants for WebCL* object types.
 * \param cltype An internal OpenCL type of the resulting value.
 * \param Twebcl Respective WebCL* class of the resulting value.
 * Other params are similar to previous macros.
 * NOTE: Returns null object to JS if internal value equals to NULL.
 */
#define GETINFO_MEDIATOR_FUN_OBJECT(cltype,Twebcl,name,lib,infoFunc,internal,variant,err,rv) { \
      cltype val = 0; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) { \
        if (val == NULL) { \
          js::Value jsValue = OBJECT_TO_JSVAL (0); \
          nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv); \
          if (NS_SUCCEEDED (rv)) { \
            nsCOMPtr<nsIVariant> v; \
            rv = xpc->JSValToVariant(cx, &jsValue, getter_AddRefs(v)); \
            if (NS_SUCCEEDED (rv)) { \
              rv = variant->SetFromVariant (v); \
            } \
          } \
        } else { \
          nsCOMPtr<Twebcl> xpcObj; \
          rv = Twebcl::getInstance (val, getter_AddRefs(xpcObj), lib); \
          if (NS_FAILED (rv)) break; \
          rv = variant->SetAsInterface (NS_GET_IID (I##Twebcl), xpcObj); \
        } \
      } \
    }

/**
 * The following macros implement getInfo calls and type conversions of the
 * resulting values to nsIVariants for vector types types.
 * There must be a compatible specialization of WebCL_convertVectorToJSArrayInVariant
 * for the vector type.
 * \param Tvector The type of vector items.
 * \param Ttypes The type of expected interpretation of the data as an enum from
 * clwrappertypes.h .
 * Other params are similar to previous macros.
 *
 * \see WebCL_convertVectorToJSArrayInVariant
 * \see clwrappertypes.h
 */
#define GETINFO_MEDIATOR_FUN_VECTOR(Tvector,Ttypes,name,lib,infoFunc,internal,variant,err,rv) { \
      nsTArray<Tvector> val; \
      err = lib->infoFunc (internal, name, val); \
      if (CL_SUCCEEDED (err)) \
        rv = WebCL_convertVectorToJSArrayInVariant (cx, val, Ttypes, (nsIVariant**)&variant, lib); \
    }


/** The following macros build switch statement case labels from type enums in
 * clwrappertypes.h using the macros defined above.
 */

#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_SIMPLE(name,lib,infoFunc,internal,variant,err,rv) \
    case types::BYTE: \
    case types::CHAR: \
        GETINFO_MEDIATOR_FUN_CHAR (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::UCHAR: \
        GETINFO_MEDIATOR_FUN_UCHAR (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SHORT: \
        GETINFO_MEDIATOR_FUN_SHORT (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::USHORT: \
        GETINFO_MEDIATOR_FUN_USHORT (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::BUILD_STATUS: \
    case types::INT: \
        GETINFO_MEDIATOR_FUN_INT (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::ADRESSING_MODE: \
    case types::CHANNEL_ORDER: \
    case types::CHANNEL_TYPE: \
    case types::COMMAND_TYPE: \
    case types::DEVICE_LOCAL_MEM_TYPE: \
    case types::DEVICE_MEM_CACHE_TYPE: \
    case types::FILTER_MODE: \
    case types::GL_OBJECT_TYPE: \
    case types::MEM_OBJECT_TYPE: \
    case types::UINT: \
        GETINFO_MEDIATOR_FUN_UINT (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::LONG: \
        GETINFO_MEDIATOR_FUN_LONG (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::COMMAND_QUEUE_PROPERTIES: \
    case types::DEVICE_EXEC_CAPABILITIES: \
    case types::DEVICE_FP_CONFIG: \
    case types::DEVICE_TYPE: \
    case types::MAP_FLAGS: \
    case types::MEM_FLAGS: \
    case types::ULONG: \
        GETINFO_MEDIATOR_FUN_ULONG (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::BOOL: \
        GETINFO_MEDIATOR_FUN_BOOL (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SIZE_T: \
        GETINFO_MEDIATOR_FUN_SIZET (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::HALF: \
        GETINFO_MEDIATOR_FUN_HALF (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::FLOAT: \
        GETINFO_MEDIATOR_FUN_FLOAT (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DOUBLE: \
        GETINFO_MEDIATOR_FUN_DOUBLE (name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::IMAGE_FORMAT: \
        GETINFO_MEDIATOR_FUN_IMAGE_FORMAT (name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_STRINGS(name,lib,infoFunc,internal,variant,err,rv) \
    case types::STRING: \
        GETINFO_MEDIATOR_FUN_STRING (name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_OBJECTS(name,lib,infoFunc,internal,variant,err,rv) \
    case types::PLATFORM: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_platform_id, WebCLPlatform, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DEVICE: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_device_id, WebCLDevice, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::CONTEXT: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_context, WebCLContext, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::COMMAND_QUEUE: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_command_queue, WebCLCommandQueue, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::MEMORY_OBJECT: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_mem, WebCLMemoryObject, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::PROGRAM: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_program, WebCLProgram, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::KERNEL: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_kernel, WebCLKernel, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::EVENT: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_event, WebCLEvent, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SAMPLER: \
      GETINFO_MEDIATOR_FUN_OBJECT (cl_sampler, WebCLSampler, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS_SIMPLE(name,lib,infoFunc,internal,variant,err,rv) \
    case types::BYTE_V: \
    case types::CHAR_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_char, types::CHAR_V, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::UCHAR_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_uchar, types::UCHAR_V, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::SHORT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_short, types::SHORT_V, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::USHORT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_ushort, types::USHORT_V, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::CONTEXT_PROPERTIES: \
    case types::INT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_int, types::INT_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::UINT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_uint, types::UINT_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::LONG_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_long, types::LONG_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::ULONG_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_ulong, types::ULONG_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::BOOL_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_bool, types::BOOL_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SIZE_T_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (size_t, types::SIZE_T_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::HALF_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_half, types::HALF_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::FLOAT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_float, types::FLOAT_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DOUBLE_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_double, types::DOUBLE_V, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS_STRINGS(name,lib,infoFunc,internal,variant,err,rv) \
    case types::STRING_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (nsCString, types::STRING_V, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS_OBJECTS(name,lib,infoFunc,internal,variant,err,rv) \
    case types::PLATFORM_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_platform_id, types::PLATFORM_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DEVICE_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_device_id, types::DEVICE_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::CONTEXT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_context, types::CONTEXT_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::COMMAND_QUEUE_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_command_queue, types::COMMAND_QUEUE_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::MEMORY_OBJECT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_mem, types::MEMORY_OBJECT_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::PROGRAM_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_program, types::PROGRAM_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::KERNEL_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_kernel, types::KERNEL_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::EVENT_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_event, types::EVENT_V, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SAMPLER_V: \
        GETINFO_MEDIATOR_FUN_VECTOR (cl_sampler, types::SAMPLER_V, name, lib, infoFunc, internal, variant, err, rv); break;


#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS(name,lib,infoFunc,internal,variant,err,rv) \
    GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS_SIMPLE (name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS_STRINGS (name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS_OBJECTS (name, lib, infoFunc, internal, variant, err, rv)

#define GETINFO_MEDIATOR_SWITCH_HELPER_FUN_ALL(name,lib,infoFunc,internal,variant,err,rv) \
    GETINFO_MEDIATOR_SWITCH_HELPER_FUN_SIMPLE (name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_SWITCH_HELPER_FUN_STRINGS (name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_SWITCH_HELPER_FUN_OBJECTS (name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_SWITCH_HELPER_FUN_VECTORS (name, lib, infoFunc, internal, variant, err, rv)


/** This macro implements the switch statement for getXInfo using the
 * GETINFO_MEDIATOR_SWITCH_HELPER macros.
 * \param aName The property name enum.
 * \param aType The property type, e.g. types::UINT.
 * \param aFunc The getInfo helper function, e.g. ContextWrapper::getInfo.
 * \param aInternal Internal OpenCL resource.
 * \param aVariant An nsIVariant instance.
 * \param aErr A variable for the OpenCL error code.
 * \param aNSErr A variable for the NS error code (nsresult).
 * Note: Function return value must be nsresult.
 */
#define WEBCL_GETINFO_MEDIATOR_SWITCH(aName,aType,aLib,aFunc,aInternal,aVariant,aErr,aNSErr) do{ \
    switch (aType) { \
      GETINFO_MEDIATOR_SWITCH_HELPER_FUN_ALL (aName, aLib, aFunc, aInternal, aVariant, aErr, aNSErr)\
      default: {\
        D_LOG (LOG_LEVEL_ERROR, "Requested unsupported property %d.", aName); \
        WebCL_reportJSError (cx, "%s: Requested unsupported property %d with type %d.", __FUNCTION__, aName, aType); \
        return WEBCL_XPCOM_ERROR; /*NS_ERROR_INVALID_ARG;*/ \
      } \
    }\
    if (CL_FAILED (aErr) || NS_FAILED (aNSErr)) { \
      D_LOG (LOG_LEVEL_ERROR, "%s failed, clError: %d, mozError: %d", \
      __FUNCTION__, aErr, aNSErr); \
      WebCL_reportJSError (cx, "%s failed with error %d.", __FUNCTION__, aErr); \
      return WEBCL_XPCOM_ERROR; /*NS_ERROR_FAILURE;*/ \
    } \
  }while(0)



/** The following macros are similar to those defined above except that these
 * variants take an extra argument for use with e.g.
 * WebCLProgram::GetProgramBuildInfo .
 */
#define GETINFO_MEDIATOR_EXTRA_FUN_CHAR(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_char val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt8 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_UCHAR(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_uchar val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint8 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_SHORT(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_short val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt16 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_USHORT(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_ushort val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint16 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_INT(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_int val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt32 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_UINT(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_uint val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint32 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_LONG(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_long val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsInt64 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_ULONG(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_ulong val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint64 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_BOOL(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_bool val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsBool (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_SIZET(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      size_t val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint32 (val); /* FIXME: Proper type? */ \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_HALF(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_half val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsUint16 (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_FLOAT(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_float val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsFloat (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_DOUBLE(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_double val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsDouble (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_STRING(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      nsCString val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
          rv = variant->SetAsACString (val); \
    }

#define GETINFO_MEDIATOR_EXTRA_FUN_IMAGE_FORMAT(extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cl_image_format val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) { \
          nsIWritableVariant* res; \
          rv = WebCL_imageFormatToVariant (cx, val, (nsIVariant**)&res); \
          variant = already_AddRefed<nsIWritableVariant>(res); \
      } \
    }

/**
 * The following macros implement getInfo calls and type conversions of the
 * resulting values to nsIVariants for WebCL* object types.
 * \param cltype An internal OpenCL type of the resulting value.
 * \param Twebcl Respective WebCL* class of the resulting value.
 * Other params are similar to previous macros.
 */
#define GETINFO_MEDIATOR_EXTRA_FUN_OBJECT(cltype,Twebcl,extra,name,lib,infoFunc,internal,variant,err,rv) { \
      cltype val = 0; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) { \
        nsCOMPtr<Twebcl> xpcObj; \
        rv = Twebcl::getInstance (val, getter_AddRefs(xpcObj), lib); \
        if (NS_FAILED (rv)) break; \
        rv = variant->SetAsInterface (NS_GET_IID (I##Twebcl), xpcObj); \
      } \
    }

/**
 * The following macros implement getInfo calls and type conversions of the
 * resulting values to nsIVariants for vector types types.
 * There must be a compatible specialization of WebCL_convertVectorToJSArrayInVariant
 * for the vector type.
 * \param Tvector The type of vector items.
 * \param Ttypes The type of expected interpretation of the data as an enum from
 * clwrappertypes.h .
 * Other params are similar to previous macros.
 *
 * \see WebCL_convertVectorToJSArrayInVariant
 * \see clwrappertypes.h
 */
#define GETINFO_MEDIATOR_EXTRA_FUN_VECTOR(Tvector,Ttypes,extra,name,lib,infoFunc,internal,variant,err,rv) { \
      nsTArray<Tvector> val; \
      err = lib->infoFunc (internal, extra, name, val); \
      if (CL_SUCCEEDED (err)) \
        rv = WebCL_convertVectorToJSArrayInVariant (cx, val, Ttypes, (nsIVariant**)&variant, lib); \
    }


/** The following macros build switch statement case labels from type enums in
 * clwrappertypes.h using the macros defined above.
 */

#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_SIMPLE(extra,name,lib,infoFunc,internal,variant,err,rv) \
    case types::BYTE: \
    case types::CHAR: \
        GETINFO_MEDIATOR_EXTRA_FUN_CHAR (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::UCHAR: \
        GETINFO_MEDIATOR_EXTRA_FUN_UCHAR (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SHORT: \
        GETINFO_MEDIATOR_EXTRA_FUN_SHORT (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::USHORT: \
        GETINFO_MEDIATOR_EXTRA_FUN_USHORT (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::BUILD_STATUS: \
    case types::INT: \
        GETINFO_MEDIATOR_EXTRA_FUN_INT (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::ADRESSING_MODE: \
    case types::CHANNEL_ORDER: \
    case types::CHANNEL_TYPE: \
    case types::COMMAND_TYPE: \
    case types::DEVICE_LOCAL_MEM_TYPE: \
    case types::DEVICE_MEM_CACHE_TYPE: \
    case types::FILTER_MODE: \
    case types::GL_OBJECT_TYPE: \
    case types::MEM_OBJECT_TYPE: \
    case types::UINT: \
        GETINFO_MEDIATOR_EXTRA_FUN_UINT (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::LONG: \
        GETINFO_MEDIATOR_EXTRA_FUN_LONG (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::COMMAND_QUEUE_PROPERTIES: \
    case types::DEVICE_EXEC_CAPABILITIES: \
    case types::DEVICE_FP_CONFIG: \
    case types::DEVICE_TYPE: \
    case types::MAP_FLAGS: \
    case types::MEM_FLAGS: \
    case types::ULONG: \
        GETINFO_MEDIATOR_EXTRA_FUN_ULONG (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::BOOL: \
        GETINFO_MEDIATOR_EXTRA_FUN_BOOL (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SIZE_T: \
        GETINFO_MEDIATOR_EXTRA_FUN_SIZET (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::HALF: \
        GETINFO_MEDIATOR_EXTRA_FUN_HALF (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::FLOAT: \
        GETINFO_MEDIATOR_EXTRA_FUN_FLOAT (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DOUBLE: \
        GETINFO_MEDIATOR_EXTRA_FUN_DOUBLE (extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::IMAGE_FORMAT: \
        GETINFO_MEDIATOR_EXTRA_FUN_IMAGE_FORMAT (extra, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_STRINGS(extra,name,lib,infoFunc,internal,variant,err,rv) \
    case types::STRING: \
        GETINFO_MEDIATOR_EXTRA_FUN_STRING (extra, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_OBJECTS(extra,name,lib,infoFunc,internal,variant,err,rv) \
    case types::PLATFORM: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_platform_id, WebCLPlatform, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DEVICE: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_device_id, WebCLDevice, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::CONTEXT: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_context, WebCLContext, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::COMMAND_QUEUE: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_command_queue, WebCLCommandQueue, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::MEMORY_OBJECT: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_mem, WebCLMemoryObject, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::PROGRAM: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_program, WebCLProgram, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::KERNEL: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_kernel, WebCLKernel, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::EVENT: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_event, WebCLEvent, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SAMPLER: \
      GETINFO_MEDIATOR_EXTRA_FUN_OBJECT (cl_sampler, WebCLSampler, extra, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS_SIMPLE(extra,name,lib,infoFunc,internal,variant,err,rv) \
    case types::BYTE_V: \
    case types::CHAR_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_char, types::CHAR_V, extra, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::UCHAR_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_uchar, types::UCHAR_V, extra, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::SHORT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_short, types::SHORT_V, extra, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::USHORT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_ushort, types::USHORT_V, extra, name, lib, infoFunc, internal, variant, err, rv); \
        break; \
    case types::CONTEXT_PROPERTIES: \
    case types::INT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_int, types::INT_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::UINT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_uint, types::UINT_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::LONG_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_long, types::LONG_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::ULONG_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_ulong, types::ULONG_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::BOOL_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_bool, types::BOOL_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SIZE_T_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (size_t, types::SIZE_T_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::HALF_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_half, types::HALF_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::FLOAT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_float, types::FLOAT_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DOUBLE_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_double, types::DOUBLE_V, extra, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS_STRINGS(extra,name,lib,infoFunc,internal,variant,err,rv) \
    case types::STRING_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (nsCString, types::STRING_V, extra, name, lib, infoFunc, internal, variant, err, rv); break;

#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS_OBJECTS(extra,name,lib,infoFunc,internal,variant,err,rv) \
    case types::PLATFORM_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_platform_id, types::PLATFORM_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::DEVICE_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_device_id, types::DEVICE_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::CONTEXT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_context, types::CONTEXT_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::COMMAND_QUEUE_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_command_queue, types::COMMAND_QUEUE_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::MEMORY_OBJECT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_mem, types::MEMORY_OBJECT_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::PROGRAM_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_program, types::PROGRAM_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::KERNEL_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_kernel, types::KERNEL_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::EVENT_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_event, types::EVENT_V, extra, name, lib, infoFunc, internal, variant, err, rv); break; \
    case types::SAMPLER_V: \
        GETINFO_MEDIATOR_EXTRA_FUN_VECTOR (cl_sampler, types::SAMPLER_V, extra, name, lib, infoFunc, internal, variant, err, rv); break;


#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS(extra,name,lib,infoFunc,internal,variant,err,rv) \
    GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS_SIMPLE (extra, name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS_STRINGS (extra, name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS_OBJECTS (extra, name, lib, infoFunc, internal, variant, err, rv)

#define GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_ALL(extra,name,lib,infoFunc,internal,variant,err,rv) \
    GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_SIMPLE (extra, name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_STRINGS (extra, name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_OBJECTS (extra, name, lib, infoFunc, internal, variant, err, rv) \
    GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_VECTORS (extra, name, lib, infoFunc, internal, variant, err, rv)


/** This macro implements the switch statement for getXInfo using the
 * GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER macros.
 * \param aName The property name enum.
 * \param aType The property type, e.g. types::UINT.
 * \param aFunc The getInfo helper function, e.g. ContextWrapper::getInfo.
 * \param aInternal Internal OpenCL resource.
 * \param aVariant An nsIVariant instance.
 * \param aErr A variable for the OpenCL error code.
 * \param aNSErr A variable for the NS error code (nsresult).
 * Note: Function return value must be nsresult.
 */
#define WEBCL_GETINFO_MEDIATOR_EXTRA_SWITCH(aExtra,aName,aType,aLib,aFunc,aInternal,aVariant,aErr,aNSErr) do{ \
    switch (aType) { \
      GETINFO_MEDIATOR_EXTRA_SWITCH_HELPER_FUN_ALL (aExtra, aName, aLib, aFunc, aInternal, aVariant, aErr, aNSErr)\
      default: {\
        D_LOG (LOG_LEVEL_ERROR, "Requested unsupported property %d.", aName); \
        WebCL_reportJSError (cx, "%s: Requested unsupported property %d with type %d.", __FUNCTION__, aName, aType); \
        return WEBCL_XPCOM_ERROR; /*NS_ERROR_INVALID_ARG;*/ \
      } \
    }\
    if (CL_FAILED (aErr) || NS_FAILED (aNSErr)) { \
      D_LOG (LOG_LEVEL_ERROR, "%s failed, clError: %d, mozError: %d", \
      __FUNCTION__, aErr, aNSErr); \
      WebCL_reportJSError (cx, "%s failed with error %d.", __FUNCTION__, aErr); \
      return WEBCL_XPCOM_ERROR; /*NS_ERROR_FAILURE;*/ \
    } \
  }while(0)



#endif // _WEBCL_INTERNAL_H_

