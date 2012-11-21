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

#include "WebCLPlatform.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"
#include "nsTArray.h"


NS_IMPL_ISUPPORTS2 (WebCLPlatform, IWebCLPlatform, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLPlatform)

/* static */
InstanceRegistry<cl_platform_id, WebCLPlatform*> WebCLPlatform::instanceRegistry;


/* static */
nsresult WebCLPlatform::getInstance (cl_platform_id aInternal, WebCLPlatform** aResultOut,
                                     WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLPlatform* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLPlatform> obj = do_CreateInstance (WEBCL_PLATFORM_CONTRACTID, &rv);
    if (NS_FAILED (rv))
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to create instance. rv=%d.", rv);
      return rv;
    }

    obj->setWrapper (aLibWrapper);
    obj->mInternal = aInternal;

    instanceRegistry.add (obj->mInternal, obj);

    NS_IF_ADDREF (*aResultOut = obj);
  }

  return rv;
}


WebCLPlatform::WebCLPlatform()
  : IWebCLPlatform(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLPlatform::~WebCLPlatform()
{
  D_METHOD_START;
  if (mInternal)
    instanceRegistry.remove (mInternal);
}


int WebCLPlatform::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    case CL_PLATFORM_PROFILE: return types::STRING;
    case CL_PLATFORM_VERSION: return types::STRING;
    case CL_PLATFORM_NAME: return types::STRING;
    case CL_PLATFORM_VENDOR: return types::STRING;
    case CL_PLATFORM_EXTENSIONS: return types::STRING;
    default: ;
  }
  return types::UNKNOWN;
}

/* nsIVariant getPlatformInfo (in long aName); */
NS_IMETHODIMP WebCLPlatform::GetPlatformInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
{
  D_METHOD_START;

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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getPlatformInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* nsIVariant getDeviceIDs (in T_WebCLDeviceType aType); */
NS_IMETHODIMP WebCLPlatform::GetDeviceIDs(T_WebCLDeviceType aType, JSContext *cx, nsIVariant **_retval)
{
  return GetDevices (aType, cx, _retval);
}


/* nsIVariant getDevices (in T_WebCLDeviceType aType); */
NS_IMETHODIMP WebCLPlatform::GetDevices(T_WebCLDeviceType aType, JSContext *cx, nsIVariant **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsTArray<cl_device_id> devices;
  cl_int err = mWrapper->getDeviceIDs (mInternal, aType, devices);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<nsIVariant> res;
  rv = WebCL_convertVectorToJSArrayInVariant (cx, devices, types::DEVICE_V,
                                              getter_AddRefs (res), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = res);
  return NS_OK;
}


