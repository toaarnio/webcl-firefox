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

#include "WebCLKernel.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"
#include "nsStringAPI.h"

NS_IMPL_ISUPPORTS2 (WebCLKernel, IWebCLKernel, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLKernel)
WEBCL_ATTACHMENT_IMPL (WebCLKernel)


/* static */
InstanceRegistry<cl_kernel, WebCLKernel*> WebCLKernel::instanceRegistry;


/* static */
nsresult WebCLKernel::getInstance (cl_kernel aInternal, WebCLKernel** aResultOut,
                                   WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLKernel* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLKernel> obj ( new WebCLKernel () );
    if (!obj)
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to create instance. rv=%d.", rv);
      return NS_ERROR_OUT_OF_MEMORY;
    }

    obj->setWrapper (aLibWrapper);
    obj->mInternal = aInternal;

    instanceRegistry.add (obj->mInternal, obj);

    NS_IF_ADDREF (*aResultOut = obj);
  }

  return rv;
}


WebCLKernel::WebCLKernel()
  : IWebCLKernel(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLKernel::~WebCLKernel()
{
  D_METHOD_START;
  if (mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (mWrapper)
      mWrapper->releaseKernel (mInternal);
    mInternal = 0;
  }
}


int WebCLKernel::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    // getInfo
    case CL_KERNEL_FUNCTION_NAME: return types::STRING;
    case CL_KERNEL_NUM_ARGS: return types::UINT;
    case CL_KERNEL_REFERENCE_COUNT: return types::UINT;
    case CL_KERNEL_CONTEXT: return types::CONTEXT;
    case CL_KERNEL_PROGRAM: return types::PROGRAM;

    // getWorkGroupInfo
    case CL_KERNEL_WORK_GROUP_SIZE: return types::SIZE_T;
    case CL_KERNEL_COMPILE_WORK_GROUP_SIZE: return types::SIZE_T_V;
    case CL_KERNEL_LOCAL_MEM_SIZE: return types::ULONG;
    case CL_KERNEL_PREFERRED_WORK_GROUP_SIZE_MULTIPLE: return types::SIZE_T;
    case CL_KERNEL_PRIVATE_MEM_SIZE: return types::ULONG;

    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getKernelInfo (in long aName); */
NS_IMETHODIMP WebCLKernel::GetKernelInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_int err = CL_SUCCESS;
  int type = getTypeForInfoName (aName);
  if (type == types::UNKNOWN)
  {
    D_LOG (LOG_LEVEL_ERROR, "Info parameter name %d does not have a known type.", aName);
    WebCL_reportJSError (cx, "Info name %d is not supported by %s.",
                         aName, __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  nsCOMPtr<nsIWritableVariant> variant = do_CreateInstance(NS_VARIANT_CONTRACTID, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getKernelInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* nsIVariant getKernelWorkGroupInfo (in nsISupports aDevice, in long aName); */
NS_IMETHODIMP WebCLKernel::GetKernelWorkGroupInfo(nsISupports *aDevice, PRInt32 aName, JSContext *cx, nsIVariant **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (aDevice);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_int err = CL_SUCCESS;
  int type = getTypeForInfoName (aName);
  if (type == types::UNKNOWN)
  {
    D_LOG (LOG_LEVEL_ERROR, "Info parameter name %d does not have a known type.", aName);
    WebCL_reportJSError (cx, "Info name %d is not supported by %s.",
                         aName, __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  nsCOMPtr<WebCLDevice> device = do_QueryInterface (aDevice, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  nsCOMPtr<nsIWritableVariant> variant = do_CreateInstance(NS_VARIANT_CONTRACTID, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  WEBCL_GETINFO_MEDIATOR_EXTRA_SWITCH (device->getInternal(), aName, type,
                                       mWrapper, getKernelWorkGroupInfo, mInternal,
                                       variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


#define VARIANT_TO_CL_TYPE(Tcltype,Tvarianttype,Fvariantgetter,name) \
  inline static nsresult name (nsIVariant* aVariant, Tcltype* aResultOut) { \
    D_METHOD_START; \
    NS_ENSURE_ARG_POINTER (aVariant); \
    NS_ENSURE_ARG_POINTER (aResultOut); \
    nsresult rv; \
    Tvarianttype val; \
    rv = aVariant->Fvariantgetter (&val); \
    NS_ENSURE_SUCCESS (rv, rv); \
    *aResultOut = (Tcltype)val; \
    return NS_OK; \
  }
VARIANT_TO_CL_TYPE(cl_char, PRUint8, GetAsInt8, variantToCLChar)   // Yes, getAsInt8 returns PRUint8...
VARIANT_TO_CL_TYPE(cl_uchar, PRUint8, GetAsUint8, variantToCLUChar)
VARIANT_TO_CL_TYPE(cl_short, PRInt16, GetAsInt16, variantToCLShort)
VARIANT_TO_CL_TYPE(cl_ushort, PRUint16, GetAsUint16, variantToCLUShort)
VARIANT_TO_CL_TYPE(cl_int, PRInt32, GetAsInt32, variantToCLInt)
VARIANT_TO_CL_TYPE(cl_uint, PRUint32, GetAsUint32, variantToCLUInt)
VARIANT_TO_CL_TYPE(cl_long, PRInt64, GetAsInt64, variantToCLLong)
VARIANT_TO_CL_TYPE(cl_ulong, PRUint32, GetAsUint32, variantToCLULong)
VARIANT_TO_CL_TYPE(size_t, PRUint32, GetAsUint32, variantToCLSizeT) // NOTE: size_t to uint32
VARIANT_TO_CL_TYPE(cl_bool, bool, GetAsBool, variantToCLBool)
VARIANT_TO_CL_TYPE(cl_half, PRUint16, GetAsUint16, variantToCLHalf) // NOTE: cl_half to uint16
VARIANT_TO_CL_TYPE(cl_float, float, GetAsFloat, variantToCLFloat)
VARIANT_TO_CL_TYPE(cl_double, double, GetAsDouble, variantToCLDouble)


#define HANDLE_KERNEL_VECTOR_ARG(clType,variantType,variantGetter) \
do { \
  /* Let's see if it's a typed array we're given */ \
  rv = variantTypedArrayToData (cx, aValue, &value, &sze, 0, false); \
  bool okToFreeValue = false; \
  /* NOTE: DO NOT FREE value IF IT COMES FROM TYPED ARRAY! */ \
  if (NS_FAILED (rv)) \
  { \
    value = 0; \
    /* Not a typed array, try treating it as an array */ \
    nsTArray<nsIVariant*> variants; \
    rv = WebCL_getVariantsFromJSArray (cx, aValue, variants); \
    if (NS_FAILED (rv)) \
    { \
      break; \
    } \
    \
    value = (clType*)malloc (sze = sizeof (clType) * variants.Length()); \
    if (!value) \
    { \
      rv = NS_ERROR_OUT_OF_MEMORY; \
      WebCL_releaseVariantVector (variants); \
      break; \
    } \
    okToFreeValue = true; \
    for (nsTArray<size_t>::index_type i = 0; i < variants.Length(); ++i) \
    { \
      variantType val; \
      rv = variants[i]->variantGetter (&val); \
      if (NS_FAILED (rv)) \
      { \
        WebCL_releaseVariantVector (variants); \
        break; \
      } \
      \
      ((clType*)value)[i] = (clType)val; \
    } \
    WebCL_releaseVariantVector (variants); \
  } \
  cl_int err = mWrapper->setKernelArg (mInternal, aIndex, sze, value); \
  \
  if (okToFreeValue) \
  { \
    if (value) \
    { \
      free (value); \
    } \
  } \
  value = 0; \
  \
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper); \
  ENSURE_CL_OP_SUCCESS (err); \
  return NS_OK; \
} while(0)

/* void setKernelArg (in long aIndex, in nsIVariant aValue, [optional] in long aType); */
NS_IMETHODIMP WebCLKernel::SetKernelArg(PRInt32 aIndex, nsIVariant *aValue, PRInt32 aType, JSContext *cx)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (aValue);
  NS_ENSURE_ARG_POINTER (cx);
  nsresult rv = NS_OK;

  if (aType == types::UNKNOWN)
  {
    PRUint16 variantType = 0;
    rv = aValue->GetDataType (&variantType);
    // If the type is unknown or user chose not to use explicit type, we'll try
    // to guess it based on the type of the variant.
    switch (variantType)
    {
      case nsIDataType::VTYPE_INT8: return SetKernelArg (aIndex, aValue, types::CHAR, cx);
      case nsIDataType::VTYPE_INT16: return SetKernelArg (aIndex, aValue, types::SHORT, cx);
      case nsIDataType::VTYPE_INT32: return SetKernelArg (aIndex, aValue, types::INT, cx);
      case nsIDataType::VTYPE_INT64: return SetKernelArg (aIndex, aValue, types::LONG, cx);
      case nsIDataType::VTYPE_UINT8: return SetKernelArg (aIndex, aValue, types::UCHAR, cx);
      case nsIDataType::VTYPE_UINT16: return SetKernelArg (aIndex, aValue, types::USHORT, cx);
      case nsIDataType::VTYPE_UINT32: return SetKernelArg (aIndex, aValue, types::UINT, cx);
      case nsIDataType::VTYPE_UINT64: return SetKernelArg (aIndex, aValue, types::ULONG, cx);
      case nsIDataType::VTYPE_FLOAT: return SetKernelArg (aIndex, aValue, types::FLOAT, cx);
      case nsIDataType::VTYPE_DOUBLE: return SetKernelArg (aIndex, aValue, types::DOUBLE, cx);
      case nsIDataType::VTYPE_BOOL: return SetKernelArg (aIndex, aValue, types::BOOL, cx);

      case nsIDataType::VTYPE_CHAR:
      case nsIDataType::VTYPE_WCHAR: return SetKernelArg (aIndex, aValue, types::CHAR, cx);

      case nsIDataType::VTYPE_CHAR_STR:
      case nsIDataType::VTYPE_WCHAR_STR:
      case nsIDataType::VTYPE_UTF8STRING:
      case nsIDataType::VTYPE_ASTRING:
      case nsIDataType::VTYPE_CSTRING: return SetKernelArg (aIndex, aValue, types::STRING, cx);

      case nsIDataType::VTYPE_INTERFACE:
      case nsIDataType::VTYPE_INTERFACE_IS:
      {
        // Try conversions to supported WebCL interfaces.
        nsCOMPtr<IWebCLMemoryObject> memObj;
        rv = aValue->GetAsISupports (getter_AddRefs(memObj));
        if (NS_SUCCEEDED (rv)) return SetKernelArg (aIndex, aValue, types::MEMORY_OBJECT, cx);

        nsCOMPtr<IWebCLSampler> samplerObj;
        rv = aValue->GetAsISupports (getter_AddRefs(samplerObj));
        if (NS_SUCCEEDED (rv)) return SetKernelArg (aIndex, aValue, types::SAMPLER, cx);

        // None found, intentional leak to default
      }

      case nsIDataType::VTYPE_ARRAY:
      case nsIDataType::VTYPE_EMPTY_ARRAY:
        D_LOG (LOG_LEVEL_ERROR, "Array support not implemented.");
        WebCL_reportJSError (cx, "WebCLKernel::setKernelArg: Array support not implemented.");
        return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;

      case nsIDataType::VTYPE_EMPTY:
      case nsIDataType::VTYPE_VOID:
      case nsIDataType::VTYPE_ID:
      default:
        D_LOG (LOG_LEVEL_ERROR,
               "Unable to guess type from variant (type %u) and no type given by the user.",
               variantType);
        WebCL_reportJSError (cx, "WebCLKernel::setKernelArg: Unable to guess type from variant (type %u) and no type given by the user.",
                             variantType);
        return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
    }
  }

  size_t sze = 0;
  void* value = 0;

  switch (aType)
  {
    case types::BYTE:
    case types::CHAR:
      value = (void*)malloc (sze = sizeof (cl_char));
      if (value)
        rv = variantToCLChar (aValue, (cl_char*)value);
      break;

    case types::UCHAR:
      value = (void*)malloc (sze = sizeof (cl_uchar));
      if (value)
        rv = variantToCLUChar (aValue, (cl_uchar*)value);
      break;

    case types::SHORT:
      value = (void*)malloc (sze = sizeof (cl_short));
      if (value)
        rv = variantToCLShort (aValue, (cl_short*)value);
      break;

    case types::USHORT:
      value = (void*)malloc (sze = sizeof (cl_ushort));
      if (value)
        rv = variantToCLUShort (aValue, (cl_ushort*)value);
      break;

    case types::BUILD_STATUS:
    case types::INT:
      value = (void*)malloc (sze = sizeof (cl_int));
      if (value)
        rv = variantToCLInt (aValue, (cl_int*)value);
      break;

    case types::ADRESSING_MODE:
    case types::CHANNEL_ORDER:
    case types::CHANNEL_TYPE:
    case types::COMMAND_TYPE:
    case types::DEVICE_LOCAL_MEM_TYPE:
    case types::DEVICE_MEM_CACHE_TYPE:
    case types::FILTER_MODE:
    case types::GL_OBJECT_TYPE:
    case types::MEM_OBJECT_TYPE:
    case types::UINT:
      value = (void*)malloc (sze = sizeof (cl_uint));
      if (value)
        rv = variantToCLUInt (aValue, (cl_uint*)value);
      break;

    case types::LONG:
      value = (void*)malloc (sze = sizeof (cl_long));
      if (value)
        rv = variantToCLLong (aValue, (cl_long*)value);
      break;

    case types::COMMAND_QUEUE_PROPERTIES: // bitfield
    case types::DEVICE_EXEC_CAPABILITIES: // bitfield
    case types::DEVICE_FP_CONFIG: // bitfield
    case types::DEVICE_TYPE: // bitfield
    case types::MAP_FLAGS: // bitfield
    case types::MEM_FLAGS: // bitfield
    case types::ULONG:
      value = (void*)malloc (sze = sizeof (cl_ulong));
      if (value)
        rv = variantToCLULong (aValue, (cl_ulong*)value);
      break;

    case types::BOOL:
      value = (void*)malloc (sze = sizeof (cl_bool));
      if (value)
        rv = variantToCLBool (aValue, (cl_bool*)value);
      break;

    case types::SIZE_T:
      value = (void*)malloc (sze = sizeof (size_t));
      if (value)
        rv = variantToCLSizeT (aValue, (size_t*)value);
      break;

    case types::HALF:
      value = (void*)malloc (sze = sizeof (cl_half));
      if (value)
        rv = variantToCLHalf (aValue, (cl_half*)value);
      break;

    case types::FLOAT:
      value = (void*)malloc (sze = sizeof (cl_float));
      if (value)
        rv = variantToCLFloat (aValue, (cl_float*)value);
      break;

    case types::DOUBLE:
      value = (void*)malloc (sze = sizeof (cl_double));
      if (value)
        rv = variantToCLDouble (aValue, (cl_double*)value);
      break;

    case types::STRING:
    {
      nsCString str;
      rv = aValue->GetAsACString (str);
      if (NS_SUCCEEDED (rv))
      {
        cl_int err = mWrapper->setKernelArg (mInternal, aIndex, str.Length () + 1,
                                             (void*)str.get ());
        ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
        ENSURE_CL_OP_SUCCESS (err);
      }
      break;
    }

    case types::BYTE_V:
    case types::CHAR_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_char, uint8_t, GetAsInt8);
      break;
    case types::UCHAR_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_uchar, uint8_t, GetAsUint8);
      break;
    case types::SHORT_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_short, int16_t, GetAsInt16);
      break;
    case types::USHORT_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_ushort, uint16_t, GetAsUint16);
      break;
    case types::CONTEXT_PROPERTIES:
    case types::INT_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_int, int32_t, GetAsInt32);
      break;
    case types::BOOL_V:
    case types::UINT_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_uint, uint32_t, GetAsUint32);
      break;
    case types::LONG_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_long, int64_t, GetAsInt64);
      break;
    case types::SIZE_T_V:
    case types::ULONG_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_ulong, uint64_t, GetAsUint64);
      break;
    case types::HALF_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_half, float, GetAsFloat);
      break;
    case types::DOUBLE_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_double, double, GetAsDouble);
      break;
    case types::FLOAT_V:
      HANDLE_KERNEL_VECTOR_ARG (cl_float, float, GetAsFloat);
      break;
    /*
    {
      PRUint16 variantType = 0;
      rv = aValue->GetDataType (&variantType);

      nsTArray<nsIVariant*> variants;

      rv = WebCL_getVariantsFromJSArray (cx, aValue, variants);
      NS_ENSURE_SUCCESS (rv, rv);

      float* wrapped = (float*)malloc (sze = sizeof (float) * variants.Length());

      for (nsTArray<size_t>::index_type i = 0; i < variants.Length(); ++i)
      {
        float val;
        rv = variants[i]->GetAsFloat(&val);
        if (NS_FAILED (rv))
        {
          WebCL_reportJSError (cx, "%s: Failed to convert 3rd argument to an array of float.",__FUNCTION__);
          break;
        }
        wrapped[i] = val;
      }

      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(float) * variants.Length(),(void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }
    */

    case types::STRING_V:
      D_LOG (LOG_LEVEL_ERROR, "String array types are not supported.");
      WebCL_reportJSError (cx, "WebCLKernel::setKernelArg: Array types are not supported.");
      return WEBCL_XPCOM_ERROR; //NS_ERROR_NOT_IMPLEMENTED;

    case types::MEMORY_OBJECT:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLMemoryObject> memObject = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_mem wrapped = memObject->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_mem),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::SAMPLER:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLSampler> sampler = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_sampler wrapped = sampler->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_sampler),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::PLATFORM:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLPlatform> platform = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_platform_id wrapped = platform->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_platform_id),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::DEVICE:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLDevice> device = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_device_id wrapped = device->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_device_id),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::CONTEXT:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLContext> context = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_context wrapped = context->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_context),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::COMMAND_QUEUE:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLCommandQueue> cmdQueue = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_command_queue wrapped = cmdQueue->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_command_queue),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::PROGRAM:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLProgram> program = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_program wrapped = program->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_program),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::KERNEL:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLKernel> kernel = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_kernel wrapped = kernel->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_kernel),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    case types::EVENT:
    {
      nsCOMPtr<nsISupports> isu;
      rv = aValue->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv)) break;
      nsCOMPtr<WebCLEvent> event = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv)) break;
      cl_event wrapped = event->getInternal ();
      cl_int wrErr = mWrapper->setKernelArg (mInternal, aIndex, sizeof(cl_event),
                                             (void*)&wrapped);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (wrErr);
      return NS_OK;
    }

    default:
      D_LOG (LOG_LEVEL_ERROR, "Unsupported type %d at argument index %u", aType, aIndex);
      WebCL_reportJSError (cx, "WebCLKernel::setKernelArg: Unsupported type %d at argument index %u.", aType, aIndex);
      //rv = NS_ERROR_INVALID_ARG;
      return WEBCL_XPCOM_ERROR;
  }

  if (NS_SUCCEEDED (rv))
  {
    if (value)
    {
      cl_int err = mWrapper->setKernelArg (mInternal, aIndex, sze, value);
      ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
      ENSURE_CL_OP_SUCCESS (err);

    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Memory allocation failed for kernel argument at index %d.", aIndex);
      WebCL_reportJSError (cx, "WebCLKernel::setKernelArg: Memory allocation failed for kernel argument at index %d.", aIndex);
      rv = WEBCL_XPCOM_ERROR; //NS_ERROR_OUT_OF_MEMORY;
    }
  }
  else
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to convert kernel argument at index %d.", aIndex);
    WebCL_reportJSError (cx, "WebCLKernel::setKernelArg: Failed to convert kernel argument at index %d.", aIndex);
    rv = WEBCL_XPCOM_ERROR;
  }

  if (value)
    free (value);

  return rv;
}


/* void setKernelArgLocal (in long aIndex, in unsigned long aSize); */
NS_IMETHODIMP WebCLKernel::SetKernelArgLocal(PRInt32 aIndex, PRUint32 aSize, JSContext *cx)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  nsresult rv = NS_OK;
  NS_ENSURE_ARG_POINTER (cx);

  cl_int err = mWrapper->setKernelArg (mInternal, aIndex, aSize, 0);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  return rv;
}


/* void releaseCLResources (); */
NS_IMETHODIMP WebCLKernel::ReleaseCLResources ()
{
  D_METHOD_START;
  if (mWrapper && mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (CL_FAILED (mWrapper->releaseKernel (mInternal)))
      D_LOG (LOG_LEVEL_WARNING, "Failed to release CL resources.");
    mInternal = 0;
  }
  mWrapper = 0;
  return NS_OK;
}
