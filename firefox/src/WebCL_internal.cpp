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

#include "WebCL_internal.h"
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

#include <cstdlib>
#include <cstdio>
#include <mozilla/StandardInteger.h>
#include <cstdarg>
#include <sstream>

#include "nsXPCOM.h"
#include "nsCOMPtr.h"
#include "nsStringAPI.h"
#include "nsCRT.h"
#include "nsComponentManagerUtils.h"  // do_CreateInstance
#include "nsIVariant.h"

#include "jsproxy.h"
#include "jswrapper.h"
#include "jsfriendapi.h"


nsresult WebCL_createTypesObject (JSContext *cx, nsIVariant** aResultOut)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aResultOut);
  nsresult rv;

  nsCOMPtr<nsIVariant> res;

  static struct { char const* name; int value; } types[] = {
    { "BYTE", types::BYTE },
    { "CHAR", types::CHAR },
    { "UCHAR", types::UCHAR },
    { "SHORT", types::SHORT },
    { "USHORT", types::USHORT },
    { "INT", types::INT },
    { "UINT", types::UINT },
    { "LONG", types::LONG },
    { "ULONG", types::ULONG },
    { "BOOL", types::BOOL },
    { "SIZE_T", types::SIZE_T },
    { "HALF", types::HALF },
    { "FLOAT", types::FLOAT },
    { "DOUBLE", types::DOUBLE },
    { "STRING", types::STRING },
    { "PLATFORM", types::PLATFORM },
    { "DEVICE", types::DEVICE },
    { "CONTEXT", types::CONTEXT },
    { "COMMAND_QUEUE", types::COMMAND_QUEUE },
    { "MEMORY_OBJECT", types::MEMORY_OBJECT },
    { "PROGRAM", types::PROGRAM },
    { "KERNEL", types::KERNEL },
    { "EVENT", types::EVENT },
    { "SAMPLER", types::SAMPLER },
    { "IMAGE_FORMAT", types::IMAGE_FORMAT },
    { "ADRESSING_MODE", types::ADRESSING_MODE },
    { "BUILD_STATUS", types::BUILD_STATUS },
    { "CHANNEL_ORDER", types::CHANNEL_ORDER },
    { "CHANNEL_TYPE", types::CHANNEL_TYPE },
    { "COMMAND_QUEUE_PROPERTIES", types::COMMAND_QUEUE_PROPERTIES },
    { "COMMAND_TYPE", types::COMMAND_TYPE },
    { "CONTEXT_PROPERTIES", types::CONTEXT_PROPERTIES },
    { "DEVICE_EXEC_CAPABILITIES", types::DEVICE_EXEC_CAPABILITIES },
    { "DEVICE_FP_CONFIG", types::DEVICE_FP_CONFIG },
    { "DEVICE_LOCAL_MEM_TYPE", types::DEVICE_LOCAL_MEM_TYPE },
    { "DEVICE_MEM_CACHE_TYPE", types::DEVICE_MEM_CACHE_TYPE },
    { "DEVICE_TYPE", types::DEVICE_TYPE },
    { "FILTER_MODE", types::FILTER_MODE },
    { "GL_OBJECT_TYPE", types::GL_OBJECT_TYPE },
    { "MAP_FLAGS", types::MAP_FLAGS },
    { "MEM_FENCE_FLAGS", types::MEM_FENCE_FLAGS },
    { "MEM_FLAGS", types::MEM_FLAGS },
    { "MEM_OBJECT_TYPE", types::MEM_OBJECT_TYPE },
    { "BYTE_V", types::BYTE_V },
    { "CHAR_V", types::CHAR_V },
    { "UCHAR_V", types::UCHAR_V },
    { "SHORT_V", types::SHORT_V },
    { "USHORT_V", types::USHORT_V },
    { "INT_V", types::INT_V },
    { "UINT_V", types::UINT_V },
    { "LONG_V", types::LONG_V },
    { "ULONG_V", types::ULONG_V },
    { "BOOL_V", types::BOOL_V },
    { "SIZE_T_V", types::SIZE_T_V },
    { "HALF_V", types::HALF_V },
    { "FLOAT_V", types::FLOAT_V },
    { "DOUBLE_V", types::DOUBLE_V },
    { "STRING_V", types::STRING_V },
    { "PLATFORM_V", types::PLATFORM_V },
    { "DEVICE_V", types::DEVICE_V },
    { "CONTEXT_V", types::CONTEXT_V },
    { "COMMAND_QUEUE_V", types::COMMAND_QUEUE_V },
    { "MEMORY_OBJECT_V", types::MEMORY_OBJECT_V },
    { "PROGRAM_V", types::PROGRAM_V },
    { "KERNEL_V", types::KERNEL_V },
    { "EVENT_V", types::EVENT_V },
    { "SAMPLER_V", types::SAMPLER_V }
  };

  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  JS_BeginRequest (cx);

  JSObject* jsObj = JS_NewObject (cx, NULL, NULL, NULL);

  if (jsObj)
  {
    for (size_t i = 0; i < sizeof(types)/sizeof(types[0]); ++i)
    {
      js::Value val;
      val.setInt32 (types[i].value);
      if (!JS_SetProperty(cx, jsObj, types[i].name, &val))
      {
        D_LOG (LOG_LEVEL_ERROR, "Failed to set types object property \"%s\" = %d",
               types[i].name, types[i].value);
        break;
      }
    }

    js::Value objVal;
    objVal.setObjectOrNull (jsObj);
    rv = xpc->JSToVariant (cx, objVal, getter_AddRefs (res));

  }
  else
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to create JSObject for types property.");
    rv = NS_ERROR_FAILURE;
  }

  JS_EndRequest(cx);

  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*aResultOut = res);
  return NS_OK;
}


nsresult WebCL_createVersionObject (JSContext *cx, nsIVariant** aResultOut)
{
  D_METHOD_START;

  nsresult rv;

  if (!cx)
  {
    return NS_ERROR_INVALID_ARG;
  }

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  JS_BeginRequest (cx);

  JSObject* jsArr = JS_NewArrayObject (cx, 4, NULL);
  if (!jsArr)
  {
    JS_EndRequest(cx);
    return NS_ERROR_OUT_OF_MEMORY;
  }

  js::Value val;

  val.setNumber ((double)WEBCL_VERSION_MAJOR);
  JS_SetElement (cx, jsArr, 0, &val);
  val.setNumber ((double)WEBCL_VERSION_MINOR);
  JS_SetElement (cx, jsArr, 1, &val);
  val.setNumber ((double)WEBCL_VERSION_RELEASE);
  JS_SetElement (cx, jsArr, 2, &val);
//  nsCString buildDate = WEBCL_BUILD_DATE;
  val = STRING_TO_JSVAL (JS_NewStringCopyZ (cx, (char const*)WEBCL_BUILD_DATE));
  JS_SetElement (cx, jsArr, 3, &val);

  JS_EndRequest(cx);

  nsCOMPtr<nsIVariant> value;
  js::Value jsValue;
  jsValue.setObject (*jsArr);
  rv = xpc->JSValToVariant(cx, &jsValue, getter_AddRefs(value));
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*aResultOut = value);

  return NS_OK;
}



#define INITIAL_MSG_BUF_SIZE 128;
nsresult WebCL_reportJSError (JSContext* cx, char const* aMsg, ...)
{
  D_METHOD_START;
  nsresult rv = NS_OK;

  size_t sze = INITIAL_MSG_BUF_SIZE;
  char* msgBuf = NULL;
  va_list ap;
  while (true)
  {
    char* tmp = msgBuf;
    msgBuf = (char*)realloc (msgBuf, sze);
    if (!msgBuf)
    {
      if (tmp)
        free (tmp);
      return NS_ERROR_OUT_OF_MEMORY;
    }
    tmp = 0;

    va_start (ap, aMsg);
    int n = vsnprintf(msgBuf, sze, aMsg, ap);
    va_end (ap);

    if (n >= 0 && n < (int)sze)
    {
      // Successfull operation
      break;
    }
    else if (n > (int)sze)
    {
      // n more bytes needed for buffer
      sze = n + 1;
    }
    else if (n == -1)
    {
      // glibc 2.1 return -1 on truncate, grow the buffer and retry
      sze *= 2;
    }
    else
    {
      // Unexpected error occurred.
      D_LOG (LOG_LEVEL_WARNING, "Failed to format the message.");
      free (msgBuf);
      return NS_ERROR_FAILURE;
    }
  }

  nsCOMPtr<nsIXPConnect> xpc;

  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);

  xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  if (NS_FAILED(rv)) goto done;

  JS_BeginRequest (cx);

  D_LOG (LOG_LEVEL_ERROR, "Reporting error to JS: \"%s\"", msgBuf);
#if 1
  JS_ReportError(cx, msgBuf);
#else
  // JS_SetPendingException NOTE: caller must return with NS_OK or we'll just
  //                              get the usual MOZ exception msg
  {
    JSString *str = JS_NewStringCopyZ(cx, msgBuf);
    JS_SetPendingException (cx, STRING_TO_JSVAL(str));
    JS_ReportPendingException (cx);

    //JSErrorReport* report = JS_ErrorFromException (cx, STRING_TO_JSVAL(str));
    jsval expVal;
    if (JS_GetPendingException (cx, &expVal))
    {
      JSErrorReport* report = JS_ErrorFromException (cx, expVal);
      fprintf(stderr, "report: %p\n", (void*)report);
      if (report)
        JS_ThrowReportedError (cx, "Fooooools!", report);
    }
  }
  // TODO: Figure out a way to throw real JS exceptions with
  // custom information. Currently, only generic XPCOM
  // error-generated exception is thrown and the error
  // message reported by this function is written on the
  // JS error console.
#endif

  JS_EndRequest(cx);

done:
  free (msgBuf);
  return rv;
}


nsresult WebCL_parseOpenCLVersion (nsCString const& aVersionStr,
                                   int& aVersionMajorOut,
                                   int& aVersionMinorOut,
                                   nsCString& aVendorSpecificInfoOut)
{
  D_METHOD_START;

  // Sanity check: make sure the OpenCL version string is something valid.
  // It must begin with "OpenCL "
  PRInt32 m1 = aVersionStr.FindChar (' ');
  if (!nsCString(aVersionStr.get(), m1).EqualsLiteral("OpenCL"))
  {
    D_LOG (LOG_LEVEL_WARNING, "Version string does not begin with \"OpenCL\".");
    return NS_ERROR_FAILURE;
  }

  // Major version
  PRInt32 m2 = aVersionStr.FindChar('.', m1 + 1);
  nsresult rv;
  nsCOMPtr<nsIWritableVariant> variant = do_CreateInstance(NS_VARIANT_CONTRACTID, &rv);
  rv = variant->SetAsACString (nsCString(aVersionStr.get() + m1, m2-m1));
  NS_ENSURE_SUCCESS (rv, rv);
  rv = variant->GetAsInt32 (&aVersionMajorOut);
  NS_ENSURE_SUCCESS (rv, rv);

  // Minor version
  m1 = m2+1;
  m2 = aVersionStr.FindChar(' ', m1);
  rv = variant->SetAsACString (nsCString(aVersionStr.get() + m1, m2-m1));
  NS_ENSURE_SUCCESS (rv, rv);
  rv = variant->GetAsInt32 (&aVersionMinorOut);
  NS_ENSURE_SUCCESS (rv, rv);

  // Vendor specific information

  aVendorSpecificInfoOut = nsCString (aVersionStr.get() + m2 + 1);

  return NS_OK;
}


nsresult WebCL_getVariantsFromJSArray (JSContext *cx, nsIVariant* aVariant,
                                       nsTArray<nsIVariant*> & aResultOut)
{
  D_METHOD_START;
  nsresult rv;

  NS_ENSURE_ARG_POINTER (aVariant);
  PRUint16 variantType = 0;
  rv = aVariant->GetDataType (&variantType);
  switch (variantType)
  {
    // Accept VTYPE_ARRAY, VTYPE_EMPTY_ARRAY
    case nsIDataType::VTYPE_ARRAY:
    case nsIDataType::VTYPE_EMPTY_ARRAY:
      // Array detected
      break;
    case nsIDataType::VTYPE_INTERFACE:
    case nsIDataType::VTYPE_INTERFACE_IS:
      // Might be a proxy object holding the array
      break;

    default:
      D_LOG (LOG_LEVEL_ERROR, "Argument aVariant is not an array (type: %u).", variantType);
      return NS_ERROR_INVALID_ARG;
  }

  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  js::Value jsVal;
  rv = xpc->VariantToJS(cx, JS_GetGlobalForScopeChain(cx), aVariant, &jsVal);
  NS_ENSURE_SUCCESS (rv, rv);

  if ( !jsVal.isObject ())
  {
    D_LOG (LOG_LEVEL_ERROR, "Argument aVariant is not a JSObject.");
    return NS_ERROR_INVALID_ARG;
  }

  JSObject* jsArrObj = jsVal.toObjectOrNull ();
  if (jsArrObj && js::IsObjectProxy (jsArrObj))
  {
    jsArrObj = js::GetProxyTargetObject (jsArrObj);
  }

  if (!jsArrObj || !JS_IsArrayObject (cx, jsArrObj))
  {
    D_LOG (LOG_LEVEL_ERROR, "Argument aVariant is not a JS Array Object.");
    return NS_ERROR_INVALID_ARG;
  }

  nsTArray <nsIVariant*> res;

  JS_BeginRequest (cx);

  JSBool ok = JS_TRUE;
  uint32_t jsArrLen = 0;
  ok = JS_GetArrayLength(cx, jsArrObj, &jsArrLen);
  if (!ok)
  {
    JS_EndRequest(cx);
    D_LOG (LOG_LEVEL_ERROR, "Failed to get array length.");
    return NS_ERROR_FAILURE;
  }

  res.SetCapacity (jsArrLen);

  for (uint32_t i = 0; i < jsArrLen; ++i)
  {
    jsval elem;
    JSBool ok = JS_GetElement (cx, jsArrObj, i, &elem);
    if (ok)
    {
      nsCOMPtr<nsIVariant> variant;
      rv = xpc->JSValToVariant (cx, &elem, getter_AddRefs(variant));
      if (NS_SUCCEEDED (rv))
      {
        res.AppendElement (variant);
        NS_ADDREF (variant);
      }
      else
      {
        D_LOG (LOG_LEVEL_WARNING,
              "Failed to convert element at position %d to nsIVariant. (rv %d)",
              i+1, rv);
      }
    }
    else
    {
        D_LOG (LOG_LEVEL_WARNING,
               "Failed to get element at position %d to nsIVariant. (rv %d)",
               i+1, rv);
    }
  }

  JS_EndRequest(cx);

  aResultOut.SwapElements (res);

  return NS_OK;
}


void WebCL_releaseVariantVector (nsTArray<nsIVariant*> & aVariants)
{
  D_METHOD_START;
  for (nsTArray<nsIVariant*>::index_type i = 0; i < aVariants.Length(); ++i)
  {
    if (aVariants[i])
      NS_RELEASE (aVariants[i]);
  }
  aVariants.Clear ();
}





nsresult WebCL_convertVectorToJSArrayInVariant_string(JSContext *cx,
                                                      nsTArray<nsCString> const& aVector,
                                                      int aType, nsIVariant** aResultOut,
                                                      WebCL_LibCLWrapper*)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aResultOut);
  nsresult rv;

  switch (aType)
  {
    case types::STRING_V:
      // Accept string vector types
      break;
    default:
    {
      D_LOG (LOG_LEVEL_ERROR, "Unsupported type %d, expected types::STRING_V", aType);
      return NS_ERROR_FAILURE;
    }
  }

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
  for (nsTArray<nsCString>::index_type i = 0; i < aVector.Length(); ++i)
  {
    jsval val = STRING_TO_JSVAL (JS_NewStringCopyZ (cx, aVector[i].get ()));
    JS_SetElement (cx, jsArr, cnt++, &val);
  }

  JS_EndRequest(cx);

  // Wrap the JSArray in an nsIVariant
  nsCOMPtr<nsIVariant> value;
  js::Value jsValue;
  jsValue.setObjectOrNull (jsArr);
  rv = xpc->JSValToVariant(cx, &jsValue, getter_AddRefs(value));
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*aResultOut = value);

  return NS_OK;
}



/* The following macro implements type-specific WebCL* object helpers for
 * WebCL_convertVectorToJSArrayInVariant template function.
 */
// C: IWebCL class, T: OpenCL object type, CID: contract ID
#define CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL(C,T,CID) \
nsresult WebCL_convertVectorToJSArrayInVariant_##C (JSContext *cx,nsTArray<T> const& aVector, nsIVariant** aResultOut, WebCL_LibCLWrapper* aLibWrapper) \
{ \
  D_METHOD_START; \
  NS_ENSURE_ARG_POINTER (aResultOut); \
  nsresult rv; \
  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE); \
  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv); \
  NS_ENSURE_SUCCESS (rv, rv); \
  JS_BeginRequest (cx); \
  JSObject* jsArr = JS_NewArrayObject (cx, aVector.Length (), NULL); \
  if (!jsArr) { \
    JS_EndRequest(cx); \
    return NS_ERROR_OUT_OF_MEMORY; \
  } \
  size_t cnt = 0; \
  /* NOTE: aType is ignored. */ \
  for (nsTArray<T>::index_type i = 0; i < aVector.Length(); ++i) { \
    nsCOMPtr<C> xpcObj; \
    rv = C::getInstance (aVector[i], getter_AddRefs(xpcObj), aLibWrapper); \
    if (NS_FAILED (rv)) \
      break; \
    jsval val; \
    const nsIID iid = NS_GET_IID (I##C); \
    rv = xpc->WrapNativeToJSVal (cx, JS_GetGlobalForScopeChain(cx), xpcObj, 0, &iid, JS_TRUE, &val, 0); \
    if (NS_FAILED (rv)) \
      break; \
    JS_SetElement (cx, jsArr, cnt++, &val); \
  } \
  JS_EndRequest(cx); \
  if (NS_FAILED (rv)) \
    return rv; \
  /* Wrap the JSArray in an nsIVariant */ \
  nsCOMPtr<nsIVariant> value; \
  js::Value jsValue; \
  jsValue.setObjectOrNull (jsArr); \
  rv = xpc->JSValToVariant(cx, &jsValue, getter_AddRefs(value)); \
  NS_ENSURE_SUCCESS (rv, rv); \
  NS_ADDREF (*aResultOut = value); \
  return NS_OK; \
}

CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLPlatform, cl_platform_id, WEBCL_PLATFORM_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLDevice, cl_device_id, WEBCL_DEVICE_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLContext, cl_context, WEBCL_CONTEXT_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLCommandQueue, cl_command_queue, WEBCL_COMMANDQUEUE_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLMemoryObject, cl_mem, WEBCL_MEMORYOBJECT_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLProgram, cl_program, WEBCL_PROGRAM_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLKernel, cl_kernel, WEBCL_KERNEL_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLEvent, cl_event, WEBCL_EVENT_CONTRACTID)
CONVERT_TO_JSARRAY_IN_VARIANT_TEMPL_IMPL (WebCLSampler, cl_sampler, WEBCL_SAMPLER_CONTRACTID)


nsresult WebCL_convertVectorToJSArrayInVariant(JSContext *cx, nsTArray<cl_image_format> const& aVector,
                                               nsIVariant** aResultOut, WebCL_LibCLWrapper*)
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
  for (nsTArray<cl_image_format>::index_type i = 0; i < aVector.Length(); ++i)
  {
    JSObject* jsObj = JS_NewObject (cx, NULL, NULL, NULL);
    if (jsObj)
    {
      js::Value propChannelOrder;
      propChannelOrder.setInt32 (aVector[i].image_channel_order);
      js::Value propChannelDataType;
      propChannelDataType.setInt32 (aVector[i].image_channel_data_type);
      JS_SetProperty(cx, jsObj, "channelOrder", &propChannelOrder);
      JS_SetProperty(cx, jsObj, "channelDataType", &propChannelDataType);
      JS_SetProperty(cx, jsObj, "image_channel_order", &propChannelOrder);
      JS_SetProperty(cx, jsObj, "image_channel_data_type", &propChannelDataType);

      js::Value objVal;
      objVal.setObjectOrNull (jsObj);
      JS_SetElement (cx, jsArr, cnt++, &objVal);
    }
  }

  JS_EndRequest(cx);
  if (NS_FAILED (rv))
    return rv;

  // Wrap the JSArray in an nsIVariant
  nsCOMPtr<nsIVariant> value;
  js::Value jsValue;
  jsValue.setObjectOrNull (jsArr);
  rv = xpc->JSValToVariant(cx, &jsValue, getter_AddRefs(value));
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*aResultOut = value);

  return NS_OK;
}


nsresult WebCL_variantToJSObject (JSContext* aCx, nsIVariant* aVariant, JSObject** aResultOut)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aVariant);
  NS_ENSURE_ARG_POINTER (aResultOut);
  nsresult rv;
  JSObject* res = 0;

  PRUint16 variantType = 0;
  rv = aVariant->GetDataType (&variantType);
  if ( !(variantType == nsIDataType::VTYPE_INTERFACE
         || variantType == nsIDataType::VTYPE_INTERFACE_IS))
  {
    return NS_ERROR_INVALID_ARG;
  }

  NS_ENSURE_TRUE (aCx, NS_ERROR_FAILURE);

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);
  js::Value jsVal;
  rv = xpc->VariantToJS(aCx, JS_GetGlobalForScopeChain(aCx), aVariant, &jsVal);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ENSURE_TRUE (jsVal.isObject(), NS_ERROR_INVALID_ARG);

  res = jsVal.toObjectOrNull ();
  if (res && js::IsObjectProxy (res))
  {
    res = js::GetProxyTargetObject (res);
  }
  NS_ENSURE_TRUE (res, NS_ERROR_INVALID_ARG);

  *aResultOut = res;
  return NS_OK;
}


nsresult WebCL_variantToImageFormat (JSContext *cx, nsIVariant* aVariant, cl_image_format& aResultOut)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aVariant);
  nsresult rv;

  PRUint16 variantType = 0;
  rv = aVariant->GetDataType (&variantType);
  if ( !(variantType == nsIDataType::VTYPE_INTERFACE
         || variantType == nsIDataType::VTYPE_INTERFACE_IS))
  {
    return NS_ERROR_INVALID_ARG;
  }

  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);
  js::Value jsVal;
  rv = xpc->VariantToJS(cx, JS_GetGlobalForScopeChain(cx), aVariant, &jsVal);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ENSURE_TRUE (jsVal.isObject (), NS_ERROR_INVALID_ARG);

  JSObject* jsObj = jsVal.toObjectOrNull ();;
  if (jsObj && js::IsObjectProxy (jsObj))
  {
    jsObj = js::GetProxyTargetObject (jsObj);
  }
  if (!jsObj)
  {
    return NS_ERROR_INVALID_ARG;
  }

  js::Value propChannelOrder;
  if (!JS_LookupProperty (cx, jsObj, "channelOrder", &propChannelOrder))
  {
    if (!JS_LookupProperty (cx, jsObj, "image_channel_order", &propChannelOrder))
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to read channel order property.");
      return NS_ERROR_INVALID_ARG;
    }
  }

  js::Value propChannelDataType;
  if (!JS_LookupProperty (cx, jsObj, "channelDataType", &propChannelDataType))
  {
    if (!JS_LookupProperty (cx, jsObj, "image_channel_data_type", &propChannelDataType))
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to read channel data type property.");
      return NS_ERROR_INVALID_ARG;
    }
  }

  aResultOut.image_channel_order = propChannelOrder.toInt32 ();
  aResultOut.image_channel_data_type = propChannelDataType.toInt32 ();
  return NS_OK;
}


nsresult WebCL_imageFormatToVariant (JSContext *cx, cl_image_format const& aImageFormat, nsIVariant** aResultOut)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aResultOut);
  nsresult rv = NS_OK;
  nsCOMPtr<nsIVariant> res;

  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  JS_BeginRequest (cx);

  JSObject* jsObj = JS_NewObject (cx, NULL, NULL, NULL);

  if (jsObj)
  {
    js::Value propChannelOrder;
    propChannelOrder.setInt32 (aImageFormat.image_channel_order);
    js::Value propChannelDataType;
    propChannelDataType.setInt32 (aImageFormat.image_channel_data_type);

    if ( JS_SetProperty(cx, jsObj, "channelOrder", &propChannelOrder)
        && JS_SetProperty(cx, jsObj, "channelDataType", &propChannelDataType)
        && JS_SetProperty(cx, jsObj, "image_channel_order", &propChannelOrder)
        && JS_SetProperty(cx, jsObj, "image_channel_data_type", &propChannelDataType) )
    {

      js::Value objVal;
      objVal.setObjectOrNull (jsObj);
      rv = xpc->JSToVariant (cx, objVal, getter_AddRefs (res));

    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to set JSObject properties for image format.");
      rv = NS_ERROR_FAILURE;
    }
  }
  else
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to create JSObject for image format.");
    rv = NS_ERROR_FAILURE;
  }

  JS_EndRequest(cx);

  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*aResultOut = res);
  return NS_OK;
}


static inline nsresult WebCL_variantToInternalVector3 (JSContext* cx, nsIVariant* aVariant,
                                                       nsTArray<size_t>& aRegionOut)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (aVariant);
  nsresult rv;

  nsTArray<nsIVariant*> variants;
  rv = WebCL_getVariantsFromJSArray (cx, aVariant, variants);
  NS_ENSURE_SUCCESS (rv, rv);
  if (variants.Length () != 3)
  {
    D_LOG (LOG_LEVEL_ERROR, "Variant array has %d items instead of exactly 3.",
           variants.Length());
    return NS_ERROR_FAILURE;
  }

  nsTArray<size_t> result;
  result.SetCapacity (3);
  for (nsTArray<nsIVariant*>::index_type i = 0; i < variants.Length(); ++i)
  {
    PRInt32 val;
    rv = variants[i]->GetAsInt32 (&val);
    if (NS_FAILED (rv)) {
      D_LOG (LOG_LEVEL_ERROR, "Variant array index %d can not be converted to integer.",
             i);
      break;
    }
    result.AppendElement ((size_t)val);
  }
  WebCL_releaseVariantVector (variants);
  NS_ENSURE_SUCCESS (rv, rv);

  aRegionOut.SwapElements (result);
  return NS_OK;
}

nsresult WebCL_variantToRegion (JSContext* cx, nsIVariant* aVariant,
                                nsTArray<size_t>& aRegionOut)
{
  // Add any region-specific checks/modifications here
  return WebCL_variantToInternalVector3 (cx, aVariant, aRegionOut);
}

nsresult WEBCL_variantToOrigin (JSContext* cx, nsIVariant* aVariant,
                                nsTArray<size_t>& aOriginOut)
{
  // Add any origin-specific checks/modifications here
  return WebCL_variantToInternalVector3 (cx, aVariant, aOriginOut);
}

nsresult WEBCL_variantToOffset (JSContext* cx, nsIVariant* aVariant,
                                nsTArray<size_t>& aOffsetOut)
{
  // Add any offset-specific checks/modifications here
  return WebCL_variantToInternalVector3 (cx, aVariant, aOffsetOut);
}

