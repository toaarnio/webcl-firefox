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

#include "WebCLDevice.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"


NS_IMPL_ISUPPORTS2 (WebCLDevice, IWebCLDevice, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLDevice)
WEBCL_ATTACHMENT_IMPL (WebCLDevice)


/* static */
InstanceRegistry<cl_device_id, WebCLDevice*> WebCLDevice::instanceRegistry;


/* static */
nsresult WebCLDevice::getInstance (cl_device_id aInternal, WebCLDevice** aResultOut,
                                   WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLDevice* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLDevice> obj ( new WebCLDevice () );
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


WebCLDevice::WebCLDevice()
  : IWebCLDevice(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLDevice::~WebCLDevice()
{
  D_METHOD_START;
  if (mInternal)
    instanceRegistry.remove (mInternal);
}


int WebCLDevice::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    case CL_DEVICE_ADDRESS_BITS: return types::UINT;
    case CL_DEVICE_AVAILABLE: return types::BOOL;
    case CL_DEVICE_COMPILER_AVAILABLE: return types::BOOL;
    //case CL_DEVICE_DOUBLE_FP_CONFIG: return types::DEVICE_FP_CONFIG;
    case CL_DEVICE_ENDIAN_LITTLE: return types::BOOL;
    case CL_DEVICE_ERROR_CORRECTION_SUPPORT: return types::BOOL;
    case CL_DEVICE_EXECUTION_CAPABILITIES: return types::DEVICE_EXEC_CAPABILITIES;
    case CL_DEVICE_EXTENSIONS: return types::STRING;
    case CL_DEVICE_GLOBAL_MEM_CACHE_SIZE: return types::ULONG;
    case CL_DEVICE_GLOBAL_MEM_CACHE_TYPE: return types::DEVICE_MEM_CACHE_TYPE;
    case CL_DEVICE_GLOBAL_MEM_CACHELINE_SIZE: return types::UINT;
    case CL_DEVICE_GLOBAL_MEM_SIZE: return types::ULONG;
    //case CL_DEVICE_HALF_FP_CONFIG: return types::DEVICE_HALF_FP_CONFIG;
    case CL_DEVICE_IMAGE_SUPPORT: return types::BOOL;
    case CL_DEVICE_IMAGE2D_MAX_HEIGHT: return types::SIZE_T;
    case CL_DEVICE_IMAGE2D_MAX_WIDTH: return types::SIZE_T;
    case CL_DEVICE_IMAGE3D_MAX_DEPTH: return types::SIZE_T;
    case CL_DEVICE_IMAGE3D_MAX_HEIGHT: return types::SIZE_T;
    case CL_DEVICE_IMAGE3D_MAX_WIDTH: return types::SIZE_T;
    case CL_DEVICE_LOCAL_MEM_SIZE: return types::ULONG;
    case CL_DEVICE_LOCAL_MEM_TYPE: return types::DEVICE_LOCAL_MEM_TYPE;
    case CL_DEVICE_MAX_CLOCK_FREQUENCY: return types::UINT;
    case CL_DEVICE_MAX_COMPUTE_UNITS: return types::UINT;
    case CL_DEVICE_MAX_CONSTANT_ARGS: return types::UINT;
    case CL_DEVICE_MAX_CONSTANT_BUFFER_SIZE: return types::ULONG;
    case CL_DEVICE_MAX_MEM_ALLOC_SIZE: return types::ULONG;
    case CL_DEVICE_MAX_PARAMETER_SIZE: return types::SIZE_T;
    case CL_DEVICE_MAX_READ_IMAGE_ARGS: return types::UINT;
    case CL_DEVICE_MAX_SAMPLERS: return types::UINT;
    case CL_DEVICE_MAX_WORK_GROUP_SIZE: return types::SIZE_T;
    case CL_DEVICE_MAX_WORK_ITEM_DIMENSIONS: return types::UINT;
    case CL_DEVICE_MAX_WORK_ITEM_SIZES: return types::SIZE_T_V;
    case CL_DEVICE_MAX_WRITE_IMAGE_ARGS: return types::UINT;
    case CL_DEVICE_MEM_BASE_ADDR_ALIGN: return types::UINT;
    case CL_DEVICE_MIN_DATA_TYPE_ALIGN_SIZE: return types::UINT;
    case CL_DEVICE_NAME: return types::STRING;
    case CL_DEVICE_PLATFORM: return types::PLATFORM;
    case CL_DEVICE_PREFERRED_VECTOR_WIDTH_CHAR: return types::UINT;
    case CL_DEVICE_PREFERRED_VECTOR_WIDTH_SHORT: return types::UINT;
    case CL_DEVICE_PREFERRED_VECTOR_WIDTH_INT: return types::UINT;
    case CL_DEVICE_PREFERRED_VECTOR_WIDTH_LONG: return types::UINT;
    case CL_DEVICE_PREFERRED_VECTOR_WIDTH_FLOAT: return types::UINT;
    case CL_DEVICE_PREFERRED_VECTOR_WIDTH_DOUBLE: return types::UINT;
    case CL_DEVICE_PROFILE: return types::STRING;
    case CL_DEVICE_PROFILING_TIMER_RESOLUTION: return types::SIZE_T;
    case CL_DEVICE_QUEUE_PROPERTIES: return types::COMMAND_QUEUE_PROPERTIES;
    case CL_DEVICE_SINGLE_FP_CONFIG: return types::DEVICE_FP_CONFIG;
    case CL_DEVICE_TYPE: return types::DEVICE_TYPE;
    case CL_DEVICE_VENDOR: return types::STRING;
    case CL_DEVICE_VENDOR_ID: return types::UINT;
    case CL_DEVICE_VERSION: return types::STRING;
    case CL_DRIVER_VERSION: return types::STRING;
    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getDeviceInfo (in long aName); */
NS_IMETHODIMP WebCLDevice::GetDeviceInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getDeviceInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}
