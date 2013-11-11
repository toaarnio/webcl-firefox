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

#include "WebCLContext.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"


NS_IMPL_ISUPPORTS2 (WebCLContext, IWebCLContext, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLContext)
WEBCL_ATTACHMENT_IMPL (WebCLContext)


/* static */
InstanceRegistry<cl_context, WebCLContext*> WebCLContext::instanceRegistry;


/* static */
nsresult WebCLContext::getInstance (cl_context aInternal, WebCLContext** aResultOut,
                                    WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLContext* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLContext> obj ( new WebCLContext () );
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


WebCLContext::WebCLContext()
  : IWebCLContext(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLContext::~WebCLContext()
{
  D_METHOD_START;
  if (mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (mWrapper)
      mWrapper->releaseContext (mInternal);
    mInternal = 0;
  }
}


int WebCLContext::getTypeForInfoName (int aName) {
  D_METHOD_START;
  switch (aName)
  {
    case CL_CONTEXT_REFERENCE_COUNT: return types::UINT;
    case CL_CONTEXT_NUM_DEVICES: return types::UINT;
    case CL_CONTEXT_DEVICES: return types::DEVICE_V;
    case CL_CONTEXT_PROPERTIES: return types::INT_V;
    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getContextInfo (in long aName); */
NS_IMETHODIMP WebCLContext::GetContextInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getContextInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* IWebCLProgram createProgramWithSource (in string aSource); */
NS_IMETHODIMP WebCLContext::CreateProgramWithSource(const char *aSource, JSContext *cx, IWebCLProgram **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (aSource);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_int err = CL_SUCCESS;
  cl_program program = mWrapper->createProgramWithSource (mInternal,
                                                          nsCString(aSource), &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLProgram> xpcObj;
  rv = WebCLProgram::getInstance (program, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLProgram createProgramWithBinary (in nsIVariant aDeviceArray, in nsIVariant aBinaryArray); */
NS_IMETHODIMP WebCLContext::CreateProgramWithBinary(nsIVariant *aDeviceArray, nsIVariant *aBinaryArray, JSContext *cx, IWebCLProgram **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (aDeviceArray);
  NS_ENSURE_ARG_POINTER (aBinaryArray);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsTArray<cl_device_id> devices;
  nsTArray<size_t> binaryLengths; // TODO
  nsTArray<unsigned char const*> binaries; // TODO
  nsTArray<cl_int> binaryStatusOut;

  // Temporary place for variants we unpack from agruments
  nsTArray<nsIVariant*> variants;


  // Build the device list

  rv = WebCL_getVariantsFromJSArray (cx, aDeviceArray, variants);
  NS_ENSURE_SUCCESS (rv, rv);

  rv = WebCL_convertVariantVectorToInternalVector<WebCLDevice, cl_device_id> (variants,
                                                                              devices);
  WebCL_releaseVariantVector (variants);
  NS_ENSURE_SUCCESS (rv, rv);


  // Build the binary list

  rv = WebCL_getVariantsFromJSArray (cx, aBinaryArray, variants);
  NS_ENSURE_SUCCESS (rv, rv);
  binaryLengths.SetCapacity (variants.Length());
  binaries.SetCapacity (variants.Length());
  for (nsTArray<unsigned char const*>::index_type i = 0; i < variants.Length(); ++i)
  {
    uint32_t str_length;
    char* str;
    rv = variants[i]->GetAsStringWithSize (&str_length, &str);
    if (NS_FAILED (rv))
    {
      WebCL_reportJSError (cx, "%s: Expecting kernel binary in string format (at index %d).",
                           __FUNCTION__, i+1);
      break;
    }
    // Free str with nsMemory::Free

    // Store binary length
    binaryLengths.AppendElement (str_length);
    // Store the kernel binary
    binaries.AppendElement ((unsigned char const*)str);
  }
  if (NS_FAILED (rv))
  {
    // Error reported by WebCL_reportJSError above.
    return WEBCL_XPCOM_ERROR;
  }


  cl_int err = CL_SUCCESS;
  cl_program program = mWrapper->createProgramWithBinary (mInternal,
                                                          devices,
                                                          binaryLengths,
                                                          binaries,
                                                          binaryStatusOut,
                                                          &err);

  for (nsTArray<unsigned char const*>::index_type i = 0; i < binaries.Length(); ++i)
  {
    nsMemory::Free ((void*)(binaries[i]));
  }
  binaries.Clear ();

  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLProgram> xpcObj;
  rv = WebCLProgram::getInstance (program, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLCommandQueue createCommandQueue (in IWebCLDevice aDevice, in T_WebCLCommandQueueProperties aProperties); */
NS_IMETHODIMP WebCLContext::CreateCommandQueue(nsISupports *aDevice, T_WebCLCommandQueueProperties aProperties, JSContext *cx, IWebCLCommandQueue **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLDevice> device (do_QueryInterface (aDevice, &rv));
  NS_ENSURE_SUCCESS (rv, rv);

  cl_int err = CL_SUCCESS;
  cl_command_queue cmd = mWrapper->createCommandQueue (mInternal, device->getInternal(),
                                                       aProperties, &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLCommandQueue> xpcObj;
  rv = WebCLCommandQueue::getInstance (cmd, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLMemoryObject createBuffer (in T_WebCLMemFlags aFlags, in T_WebCLSize aSize); */
NS_IMETHODIMP WebCLContext::CreateBuffer(T_WebCLMemFlags aFlags, T_WebCLSize aSize, JSContext *cx, IWebCLMemoryObject **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_int err = CL_SUCCESS;
  cl_mem mem = mWrapper->createBuffer (mInternal, aFlags, aSize, 0, &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLMemoryObject> xpcObj;
  rv = WebCLMemoryObject::getInstance (mem, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLMemoryObject createImage2D (in T_WebCLMemFlags aFlags, in nsIVariant aImageFormat, in T_WebCLSize aWidth, in T_WebCLSize aHeight, in T_WebCLSize aRowPitch); */
NS_IMETHODIMP WebCLContext::CreateImage2D(T_WebCLMemFlags aFlags, nsIVariant *aImageFormat, T_WebCLSize aWidth, T_WebCLSize aHeight, T_WebCLSize aRowPitch, JSContext *cx, IWebCLMemoryObject **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_image_format format;
  rv = WebCL_variantToImageFormat (cx, aImageFormat, format);
  NS_ENSURE_SUCCESS (rv, rv);

  cl_int err = CL_SUCCESS;
  cl_mem mem = mWrapper->createImage2D (mInternal, aFlags, &format,
                                        aWidth, aHeight, aRowPitch, 0, &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLMemoryObject> xpcObj;
  rv = WebCLMemoryObject::getInstance (mem, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLMemoryObject createImage3D (in T_WebCLMemFlags aFlags, in nsIVariant aImageFormat, in T_WebCLSize aWidth, in T_WebCLSize aHeight, in T_WebCLSize aDepth, in T_WebCLSize aRowPitch, in T_WebCLSize aSlicePitch); */
NS_IMETHODIMP WebCLContext::CreateImage3D(T_WebCLMemFlags aFlags, nsIVariant *aImageFormat, T_WebCLSize aWidth, T_WebCLSize aHeight, T_WebCLSize aDepth, T_WebCLSize aRowPitch, T_WebCLSize aSlicePitch, JSContext *cx, IWebCLMemoryObject **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_image_format format;
  rv = WebCL_variantToImageFormat (cx, aImageFormat, format);
  NS_ENSURE_SUCCESS (rv, rv);

  cl_int err = CL_SUCCESS;
  cl_mem mem = mWrapper->createImage3D (mInternal, aFlags, &format,
                                        aWidth, aHeight, aDepth,
                                        aRowPitch, aSlicePitch, 0, &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLMemoryObject> xpcObj;
  rv = WebCLMemoryObject::getInstance (mem, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLSampler createSampler (in boolean aNormalizedCoords, in T_WebCLAddressingMode aAddressingMode, in T_WebCLFilterMode aFilterMode); */
NS_IMETHODIMP WebCLContext::CreateSampler(bool aNormalizedCoords, T_WebCLAddressingMode aAddressingMode, T_WebCLFilterMode aFilterMode, JSContext *cx, IWebCLSampler **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_int err = CL_SUCCESS;
  cl_sampler sampler = mWrapper->createSampler (mInternal, aNormalizedCoords,
                                                aAddressingMode, aFilterMode, &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLSampler> xpcObj;
  rv = WebCLSampler::getInstance (sampler, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* nsIVariant getSupportedImageFormats (in T_WebCLMemFlags aFlags, in T_WebCLMemObjectType aImageType); */
NS_IMETHODIMP WebCLContext::GetSupportedImageFormats(T_WebCLMemFlags aFlags, T_WebCLMemObjectType aImageType, JSContext *cx, nsIVariant **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsTArray<cl_image_format> imageFormats;
  cl_int err = mWrapper->getSupportedImageFormats (mInternal, aFlags, aImageType,
                                                   imageFormats);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<nsIVariant> value;
  rv = WebCL_convertVectorToJSArrayInVariant (cx, imageFormats, getter_AddRefs (value),
                                              mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = value);
  return NS_OK;
}


/* IWebCLEvent createUserEvent (); */
NS_IMETHODIMP WebCLContext::CreateUserEvent(JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_int err = CL_SUCCESS;
  cl_event event = mWrapper->createUserEvent (mInternal, &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* void releaseCLResources (); */
NS_IMETHODIMP WebCLContext::ReleaseCLResources ()
{
  D_METHOD_START;
  if (mWrapper && mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (CL_FAILED (mWrapper->releaseContext (mInternal)))
      D_LOG (LOG_LEVEL_WARNING, "Failed to release CL resources.");
    mInternal = 0;
  }
  mWrapper = 0;
  return NS_OK;
}
