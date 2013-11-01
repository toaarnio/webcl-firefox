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

#include "WebCLMemoryObject.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"

#include "jsapi.h"
#include "jsproxy.h"
#include "jswrapper.h"


NS_IMPL_ISUPPORTS2 (WebCLMemoryObject, IWebCLMemoryObject, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLMemoryObject)
WEBCL_ATTACHMENT_IMPL (WebCLMemoryObject)


/* static */
InstanceRegistry<cl_mem, WebCLMemoryObject*> WebCLMemoryObject::instanceRegistry;


/* static */
nsresult WebCLMemoryObject::getInstance (cl_mem aInternal, WebCLMemoryObject** aResultOut,
                                         WebCL_LibCLWrapper* aLibWrapper)
{
  D_METHOD_START;
  nsresult rv = NS_OK;

  WebCLMemoryObject* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    D_LOG (LOG_LEVEL_DEBUG, "Found existing instance %p", existing);
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLMemoryObject> obj ( new WebCLMemoryObject () );
    if (!obj)
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to create instance. rv=%d.", rv);
      return NS_ERROR_OUT_OF_MEMORY;
    }
    D_LOG (LOG_LEVEL_DEBUG, "No existing instance, created %p (internal=%p)",
           (WebCLMemoryObject*)obj, (void*)aInternal);

    obj->setWrapper (aLibWrapper);
    obj->mInternal = aInternal;

    instanceRegistry.add (obj->mInternal, obj);

    NS_IF_ADDREF (*aResultOut = obj);
  }

  return rv;
}


WebCLMemoryObject::WebCLMemoryObject()
  : IWebCLMemoryObject(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLMemoryObject::~WebCLMemoryObject()
{
  D_METHOD_START;
  instanceRegistry.remove (mInternal);
  if (mInternal)
  {
    if (mWrapper)
      mWrapper->releaseMemObject (mInternal);
    mInternal = 0;
  }
}


int WebCLMemoryObject::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    // getInfo:
    case CL_MEM_TYPE: return types::MEM_OBJECT_TYPE;
    case CL_MEM_FLAGS: return types::MEM_FLAGS;
    case CL_MEM_SIZE: return types::SIZE_T;
    //NOT SUPPORTED: case CL_MEM_HOST_PTR: return types::
    case CL_MEM_MAP_COUNT: return types::UINT;
    case CL_MEM_REFERENCE_COUNT: return types::UINT;
    case CL_MEM_CONTEXT: return types::CONTEXT;
    case CL_MEM_ASSOCIATED_MEMOBJECT: return types::MEMORY_OBJECT;
    case CL_MEM_OFFSET: return types::SIZE_T;
    //NOT SUPPORTED: case CL_MEM_D3D10_RESOURCE_KHR: return types::

    // getImageInfo:
    case CL_IMAGE_FORMAT: return types::IMAGE_FORMAT;
    case CL_IMAGE_ELEMENT_SIZE: return types::SIZE_T;
    case CL_IMAGE_ROW_PITCH: return types::SIZE_T;
    case CL_IMAGE_SLICE_PITCH: return types::SIZE_T;
    case CL_IMAGE_WIDTH: return types::SIZE_T;
    case CL_IMAGE_HEIGHT: return types::SIZE_T;
    case CL_IMAGE_DEPTH: return types::SIZE_T;
    //NOT SUPPORTED: case CL_IMAGE_D3D10_SUBRESOURCE_KHR: return types::

    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getMemObjectInfo (in long aName); */
NS_IMETHODIMP WebCLMemoryObject::GetMemObjectInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getMemObjectInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* nsIVariant getImageInfo (in long aName); */
NS_IMETHODIMP WebCLMemoryObject::GetImageInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getImageInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* IWebCLMemoryObject createSubBuffer (in T_WebCLMemFlags aFlags, in nsIVariant aBufferRegion); */
NS_IMETHODIMP WebCLMemoryObject::CreateSubBuffer(T_WebCLMemFlags aFlags, nsIVariant *aBufferRegion, JSContext *cx, IWebCLMemoryObject **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aBufferRegion);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;
  // The variant must be an object
  PRUint16 variantType = 0;
  rv = aBufferRegion->GetDataType (&variantType);
  if ( !(variantType == nsIDataType::VTYPE_INTERFACE
         || variantType == nsIDataType::VTYPE_INTERFACE_IS))
  {
    D_LOG (LOG_LEVEL_ERROR, "Variant is not interface.");
    WebCL_reportJSError (cx, "%s: Invalid buffer region: not an object.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);
  JS::Rooted<js::Value> jsVal (cx);
  rv = xpc->VariantToJS(cx, JS::CurrentGlobalOrNull(cx), aBufferRegion, jsVal.address());
  NS_ENSURE_SUCCESS (rv, rv);

  if (!jsVal.isObject())
  {
    D_LOG (LOG_LEVEL_ERROR, "Variant is not an object.");
    WebCL_reportJSError (cx, "%s: Invalid buffer region: not an object.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  JS::Rooted<JSObject*> jsObj (cx, jsVal.toObjectOrNull ());
  if (jsObj && js::IsObjectProxy (jsObj))
  {
    jsObj = JS::Rooted<JSObject*> (cx, js::GetProxyTargetObject (jsObj));
  }

  if (!jsObj)
  {
    // jsval is reported as object but failed to either convert to such or unwrap.
    return NS_ERROR_INVALID_ARG;
  }

  JS::Rooted<js::Value> propOrigin (cx);
  if (!JS_LookupProperty (cx, jsObj, "origin", &propOrigin))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to read origin property.");
    return NS_ERROR_INVALID_ARG;
  }

  JS::Rooted<js::Value> propSize (cx);
  if (!JS_LookupProperty (cx, jsObj, "size", &propSize))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to read size property.");
    return NS_ERROR_INVALID_ARG;
  }

  cl_buffer_region region;
  region.origin = propOrigin.toInt32 ();
  region.size = propSize.toInt32 ();

  cl_int err = CL_SUCCESS;
  cl_mem mem = mWrapper->createSubBuffer (mInternal, aFlags, CL_BUFFER_CREATE_TYPE_REGION,
                                          (void const*)&region, &err);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLMemoryObject> xpcObj;
  rv = WebCLMemoryObject::getInstance (mem, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* void releaseCLResources (); */
NS_IMETHODIMP WebCLMemoryObject::ReleaseCLResources ()
{
  D_METHOD_START;
  if (mWrapper && mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (CL_FAILED (mWrapper->releaseMemObject (mInternal)))
      D_LOG (LOG_LEVEL_WARNING, "Failed to release CL resources.");
    mInternal = 0;
  }
  mWrapper = 0;
  return NS_OK;
}
