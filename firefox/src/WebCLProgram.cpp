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

#include "WebCLProgram.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"
#include "WebCLPlatform.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"


NS_IMPL_ISUPPORTS2 (WebCLProgram, IWebCLProgram, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLProgram)
WEBCL_ATTACHMENT_IMPL (WebCLProgram)


/* static */
InstanceRegistry<cl_program, WebCLProgram*> WebCLProgram::instanceRegistry;


/* static */
nsresult WebCLProgram::getInstance (cl_program aInternal, WebCLProgram** aResultOut,
                                    WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLProgram* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLProgram> obj ( new WebCLProgram () );
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


WebCLProgram::WebCLProgram()
  : IWebCLProgram(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLProgram::~WebCLProgram()
{
  D_METHOD_START;
  if (mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (mWrapper)
      mWrapper->releaseProgram (mInternal);
    mInternal = 0;
  }
}


int WebCLProgram::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    // getInfo names
    case CL_PROGRAM_REFERENCE_COUNT: return types::UINT;
    case CL_PROGRAM_CONTEXT: return types::CONTEXT;
    case CL_PROGRAM_NUM_DEVICES: return types::UINT;
    case CL_PROGRAM_DEVICES: return types::DEVICE_V;
    case CL_PROGRAM_SOURCE: return types::STRING;
    case CL_PROGRAM_BINARY_SIZES: return types::SIZE_T_V;
    case CL_PROGRAM_BINARIES: return types::STRING_V;

    // getBuildInfo names
    case CL_PROGRAM_BUILD_STATUS: return types::BUILD_STATUS;
    case CL_PROGRAM_BUILD_OPTIONS: return types::STRING;
    case CL_PROGRAM_BUILD_LOG: return types::STRING;

    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getProgramInfo (in long aName); */
NS_IMETHODIMP WebCLProgram::GetProgramInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  // TODO NOTE CL_PROGRAM_BINARIES WORKAROUND - THIS PARAMETER SHOULD PROBABLY BE BLOCKED
  if (aName == CL_PROGRAM_BINARIES)
  {
    // CL_PROGRAM_BINARIES does not write it's result directly to the target buffer
    // but to an array pointers to additional buffers of allocated by caller. The sizes
    // of these buffers are queried using CL_PROGRAM_BINARY_SIZES
    nsTArray<size_t> binarySizes;
    mWrapper->getProgramInfo (mInternal, CL_PROGRAM_BINARY_SIZES, binarySizes);
    nsTArray<char*> binaries;
    binaries.SetLength (binarySizes.Length());
    for (size_t i = 0; i < binaries.Length(); ++i)
    {
      binaries[i] = (char*)malloc(sizeof(char) * binarySizes[i]);
      // Allocation failures produce NULL and we expect that OCL library knows
      // how to handle that.
    }

    err = mWrapper->library()->symbols->clGetProgramInfo (mInternal, CL_PROGRAM_BINARIES,
                                                          sizeof(char*) * binaries.Length(),
                                                          binaries.Elements(), NULL);
    if (CL_FAILED (err))
    {
      for (nsTArray<char*>::index_type i = 0; i < binaries.Length(); ++i)
      {
        free (binaries[i]);
      }
      D_LOG (LOG_LEVEL_ERROR, "getInfo for %d failed. (error %d)", aName, err);
      WebCL_reportJSError (cx, "%s failed with error %d.", __FUNCTION__, err);
      return WEBCL_XPCOM_ERROR; /*NS_ERROR_FAILURE;*/
    }

    // Convert result to something we can apply our standard mechanism to
    nsTArray<nsCString> results;
    results.SetCapacity (binaries.Length());
    for (size_t i = 0; i < binaries.Length(); ++i)
    {
      results.AppendElement (nsCString(binaries[i]));
      free (binaries[i]);
    }

    rv = WebCL_convertVectorToJSArrayInVariant (cx, results, types::STRING_V,
                                                (nsIVariant**)&variant, mWrapper);
    NS_ENSURE_SUCCESS (rv, rv);
  }
  else
  {
    WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getProgramInfo, mInternal,
                                   variant, err, rv);
  }

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* nsIVariant getProgramBuildInfo (in nsISupports aDevice, in long aName); */
NS_IMETHODIMP WebCLProgram::GetProgramBuildInfo(nsISupports* aDevice, PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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
                                       mWrapper, getProgramBuildInfo, mInternal,
                                       variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* void buildProgram (in nsIVariant aDevices, in string aOptions); */
NS_IMETHODIMP WebCLProgram::BuildProgram(nsIVariant *aDevices, const char *aOptions, JSContext *cx)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (aDevices);
  NS_ENSURE_ARG_POINTER (cx);
  nsresult rv;

  nsTArray<nsIVariant*> deviceVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aDevices, deviceVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_device_id> devices;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLDevice, cl_device_id> (deviceVariants,
                                                                              devices);
  WebCL_releaseVariantVector (deviceVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  cl_int err = mWrapper->buildProgram (mInternal, devices, nsCString(aOptions), 0, 0);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  return NS_OK;
}


/* IWebCLKernel createKernel (in string aKernelName); */
NS_IMETHODIMP WebCLProgram::CreateKernel(const char *aKernelName, JSContext *cx, IWebCLKernel **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_int err = CL_SUCCESS;
  cl_kernel kernel = mWrapper->createKernel (mInternal, nsCString(aKernelName), &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLKernel> xpcObj;
  rv = WebCLKernel::getInstance (kernel, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* nsIVariant createKernelsInProgram (); */
NS_IMETHODIMP WebCLProgram::CreateKernelsInProgram(JSContext *cx, nsIVariant **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_INTERNAL ();
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsTArray<cl_kernel> kernels;
  cl_int err = mWrapper->createKernelsInProgram (mInternal, kernels);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<nsIVariant> value;
  rv = WebCL_convertVectorToJSArrayInVariant (cx, kernels,
                                              types::KERNEL_V,
                                              getter_AddRefs (value),
                                              mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = value);

  return NS_OK;
}


/* void releaseCLResources (); */
NS_IMETHODIMP WebCLProgram::ReleaseCLResources ()
{
  D_METHOD_START;
  if (mWrapper && mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (CL_FAILED (mWrapper->releaseProgram (mInternal)))
      D_LOG (LOG_LEVEL_WARNING, "Failed to release CL resources.");
    mInternal = 0;
  }
  mWrapper = 0;
  return NS_OK;
}
