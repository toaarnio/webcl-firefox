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

#include "WebCLCommandQueue.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsXPCOM.h"
#include "nsError.h"
#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"
#include "nsIRunnable.h"
#include "nsIThread.h"
#include "nsThreadUtils.h"

#include "jsapi.h"
#include "jsproxy.h"
#include "jswrapper.h"
#include "jsfriendapi.h"


NS_IMPL_ISUPPORTS2 (WebCLCommandQueue, IWebCLCommandQueue, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLCommandQueue)


/* static */
InstanceRegistry<cl_command_queue, WebCLCommandQueue*> WebCLCommandQueue::instanceRegistry;


/* static */
nsresult WebCLCommandQueue::getInstance (cl_command_queue aInternal, WebCLCommandQueue** aResultOut,
                                         WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLCommandQueue* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLCommandQueue> obj ( new WebCLCommandQueue () );
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


WebCLCommandQueue::WebCLCommandQueue()
  : IWebCLCommandQueue(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLCommandQueue::~WebCLCommandQueue()
{
  D_METHOD_START;
  if (mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (mWrapper)
      mWrapper->releaseCommandQueue (mInternal);
    mInternal = 0;
  }

}


int WebCLCommandQueue::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    case CL_QUEUE_CONTEXT: return types::CONTEXT;
    case CL_QUEUE_DEVICE: return types::DEVICE;
    case CL_QUEUE_REFERENCE_COUNT: return types::UINT;
    case CL_QUEUE_PROPERTIES: return types::COMMAND_QUEUE_PROPERTIES;
    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getCommandQueueInfo (in long aName); */
NS_IMETHODIMP WebCLCommandQueue::GetCommandQueueInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getCommandQueueInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* IWebCLEvent enqueueNDRangeKernel (in nsISupports aKernel, in unsigned long aWorkDim, in nsIVariant aGlobalWorkOffset, in nsIVariant aGlobalWorkSize, in nsIVariant aLocalWorkSize, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueNDRangeKernel(nsISupports *aKernel, PRUint32 aWorkDim, nsIVariant *aGlobalWorkOffset, nsIVariant *aGlobalWorkSize, nsIVariant *aLocalWorkSize, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aKernel);
  NS_ENSURE_ARG_POINTER (aGlobalWorkOffset);
  NS_ENSURE_ARG_POINTER (aGlobalWorkSize);
  NS_ENSURE_ARG_POINTER (aLocalWorkSize);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;


  nsTArray<nsIVariant*> variants;
  nsTArray<size_t> globalOffset;
  nsTArray<size_t> globalSize;
  nsTArray<size_t> localSize;

  // Global work offset vector
  rv = WebCL_getVariantsFromJSArray (cx, aGlobalWorkOffset, variants);
  NS_ENSURE_SUCCESS (rv, rv);
  globalOffset.SetCapacity (variants.Length());
  for (nsTArray<size_t>::index_type i = 0; i < variants.Length(); ++i)
  {
    PRUint32 val;
    rv = variants[i]->GetAsUint32 (&val);
    if (NS_FAILED (rv))
    {
      WebCL_reportJSError (cx, "%s: Failed to convert 3rd argument to an array of integers.",
                           __FUNCTION__);
      break;
    }
    globalOffset.AppendElement (val);
  }
  WebCL_releaseVariantVector (variants);
  if (NS_FAILED (rv))
  {
    // Error reported by WebCL_reportJSError above.
    return WEBCL_XPCOM_ERROR;
  }

  // Global work size vector
  rv = WebCL_getVariantsFromJSArray (cx, aGlobalWorkSize, variants);
  NS_ENSURE_SUCCESS (rv, rv);
  globalSize.SetCapacity (variants.Length());
  for (nsTArray<size_t>::index_type i = 0; i < variants.Length(); ++i)
  {
    PRUint32 val;
    rv = variants[i]->GetAsUint32 (&val);
    if (NS_FAILED (rv))
    {
      WebCL_reportJSError (cx, "%s: Failed to convert 4th argument to an array of integers.",
                           __FUNCTION__);
      break;
    }
    globalSize.AppendElement (val);
  }
  WebCL_releaseVariantVector (variants);
  if (NS_FAILED (rv))
  {
    // Error reported by WebCL_reportJSError above.
    return WEBCL_XPCOM_ERROR;
  }

  // Local work size vector
  rv = WebCL_getVariantsFromJSArray (cx, aLocalWorkSize, variants);
  NS_ENSURE_SUCCESS (rv, rv);
  localSize.SetCapacity (variants.Length());
  for (nsTArray<size_t>::index_type i = 0; i < variants.Length(); ++i)
  {
    PRUint32 val;
    rv = variants[i]->GetAsUint32 (&val);
    if (NS_FAILED (rv))
    {
      WebCL_reportJSError (cx, "%s: Failed to convert 5th argument to an array of integers.",
                           __FUNCTION__);
      break;
    }
    localSize.AppendElement (val);
  }
  WebCL_releaseVariantVector (variants);
  if (NS_FAILED (rv))
  {
    // Error reported by WebCL_reportJSError above.
    return WEBCL_XPCOM_ERROR;
  }


  // Event list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  // Kernel
  nsCOMPtr<WebCLKernel> kernel = do_QueryInterface (aKernel, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  cl_int err = mWrapper->enqueueNDRangeKernel (mInternal, kernel->getInternal(),
                                               aWorkDim, globalOffset, globalSize, localSize,
                                               eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueTask (in nsISupports aKernel, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueTask(nsISupports *aKernel, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aKernel);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  // Kernel
  nsCOMPtr<WebCLKernel> kernel = do_QueryInterface (aKernel, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  // Event list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  cl_event event;
  cl_int err = mWrapper->enqueueTask (mInternal, kernel->getInternal(),
                                      eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


class HolderReleaserRunnable : public nsIRunnable
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSIRUNNABLE
  HolderReleaserRunnable (nsIXPConnectJSObjectHolder* target) : m_target(target) { }
private:
  nsIXPConnectJSObjectHolder* m_target;
};

NS_IMPL_THREADSAFE_ISUPPORTS1 (HolderReleaserRunnable, nsIRunnable);

NS_IMETHODIMP HolderReleaserRunnable::Run ()
{
  NS_RELEASE (m_target);
  return NS_OK;
}


static void* packBufferDataHolderUnrefCbUserData (WebCL_LibCLWrapper* aLibWrapper,
                                                  nsIXPConnectJSObjectHolder* aHolder)
{
  void** res = (void**)malloc (sizeof(void*) * 2);
  if (res)
  {
    res[0] = (void*)aLibWrapper;
    res[1] = (void*)aHolder;
  }
  return res;
}

static void unpackBufferDataHolderUnrefCbUserData (void** aUserData,
                                                   WebCL_LibCLWrapper** aLibWrapperOut,
                                                   nsIXPConnectJSObjectHolder** aHolderOut)
{
  if (aUserData)
  {
    if (aLibWrapperOut)
      *aLibWrapperOut = (WebCL_LibCLWrapper*)aUserData[0];
    if (aHolderOut)
      *aHolderOut = (nsIXPConnectJSObjectHolder*)aUserData[1];
  }
}

void CL_CALLBACK bufferDataHolderUnrefCb(cl_event event, cl_int event_command_exec_status, void *user_data)
{
  D_METHOD_START;
  // The user_data should always be nsIXPConnectJSObjectHolder pointer.
  // TODO: Is it possible that this this function is called multiple times for the same event?
  if (user_data && event_command_exec_status == CL_COMPLETE)
  {
    WebCL_LibCLWrapper* libWrapper = 0;
    nsIXPConnectJSObjectHolder* holder = 0;
    unpackBufferDataHolderUnrefCbUserData ((void**)user_data, &libWrapper, &holder);

    // Ensure the holder XPCOM object is released in the main thread
    nsCOMPtr<HolderReleaserRunnable> runnable ( new HolderReleaserRunnable (holder));
    if (!runnable || NS_FAILED (NS_DispatchToMainThread (runnable)))
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to dispatch releaser runnable for JS object holder.");
    }

    // Release the OpenCL event
    // We took an extra ref on the event when setting up this callback to
    // ensure that the object is not released too early.
    libWrapper->releaseEvent (event);
    NS_RELEASE (libWrapper);

    free (user_data);
  }
}


static nsresult variantTypedArrayToData (JSContext* cx, nsIVariant* aTypedArrayVariant,
                                         void** aDataOut, size_t* aLengthOut,
                                         nsIXPConnectJSObjectHolder** aHolderOut = 0)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (aTypedArrayVariant);
  NS_ENSURE_ARG_POINTER (aDataOut);
  NS_ENSURE_ARG_POINTER (aLengthOut);

  void* data = 0;
  size_t length = 0;
  nsresult rv;

  PRUint16 variantType = 0;
  rv = aTypedArrayVariant->GetDataType (&variantType);
  if ( !(variantType == nsIDataType::VTYPE_INTERFACE
         || variantType == nsIDataType::VTYPE_INTERFACE_IS))
  {
      D_LOG (LOG_LEVEL_ERROR, "Invalid variant type.");
      WebCL_reportJSError (cx, "%s: Invalid typed array argument"
                               "(variant type %d).", __FUNCTION__, variantType);
      return NS_ERROR_INVALID_ARG;
  }

  if (!cx)
  {
    nsCOMPtr<nsIThreadJSContextStack> stack = do_GetService ("@mozilla.org/js/xpc/ContextStack;1", &rv);
    NS_ENSURE_SUCCESS (rv, rv);
    cx = stack->GetSafeJSContext ();
    NS_ENSURE_TRUE (cx, NS_ERROR_FAILURE);
  }

  nsCOMPtr<nsIXPConnect> xpc = do_GetService (nsIXPConnect::GetCID (), &rv);
  NS_ENSURE_SUCCESS (rv, rv);
  js::Value jsVal;
  rv = xpc->VariantToJS(cx, JS_GetGlobalObject(cx), aTypedArrayVariant, &jsVal);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ENSURE_TRUE (jsVal.isObject(), NS_ERROR_INVALID_ARG);

  JSObject* jsObj = jsVal.toObjectOrNull();
  if (jsObj && js::IsObjectProxy (jsObj))
  {
    jsObj = js::UnwrapObject (jsObj);
  }

  if (!jsObj || !JS_IsTypedArrayObject (jsObj, cx))
  {
    WebCL_reportJSError (cx, "%s: Invalid typed array argument (not typed array).",
                         __FUNCTION__);
    return NS_ERROR_INVALID_ARG;
  }

  data = JS_GetArrayBufferViewData (jsObj, cx);
  D_LOG (LOG_LEVEL_DEBUG, "TypedArray data pointer: %p", data);
  if (!data)
  {
    D_LOG (LOG_LEVEL_ERROR, "Typed array has no data.");
    WebCL_reportJSError (cx, "WebCLCommandQueue::enqueueWriteBuffer: Typed array has no data.");
    return NS_ERROR_INVALID_ARG;
  }
  length = JS_GetArrayBufferViewByteLength (jsObj, cx);
  D_LOG (LOG_LEVEL_DEBUG, "TypedArray data length: %d bytes", length);

  if (aHolderOut)
  {
    rv = xpc->HoldObject (cx, jsObj, aHolderOut);
    NS_ENSURE_SUCCESS (rv, rv);
  }

  if (aDataOut)
    *aDataOut = data;
  if (aLengthOut)
    *aLengthOut = length;

  return NS_OK;
}


/* IWebCLEvent enqueueWriteBuffer (in nsISupports aBuffer, in boolean aBlockingWrite, in T_WebCLSize aOffset, in T_WebCLSize aSize, in nsIVariant aData, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueWriteBuffer(nsISupports *aBuffer, bool aBlockingWrite, T_WebCLSize aOffset, T_WebCLSize aSize, nsIVariant *aData, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aBuffer);
  NS_ENSURE_ARG_POINTER (aData);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> buffer = do_QueryInterface (aBuffer, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  void* data = 0;
  size_t length = 0;
  // The holder ensures that the JSObject (TypedArray) isn't
  // garbage collected before the enqueued operation finishes.
  nsCOMPtr<nsIXPConnectJSObjectHolder> holder;

  rv = variantTypedArrayToData (cx, aData, &data, &length, getter_AddRefs(holder));
  NS_ENSURE_SUCCESS (rv, WEBCL_XPCOM_ERROR);
  if (aSize > length)
  {
    D_LOG (LOG_LEVEL_ERROR, "aSize %d exceeds data buffer length %d.", aSize, length);
    WebCL_reportJSError (cx, "aSize exceeds data buffer length.");
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  cl_event event;
  cl_int err = mWrapper->enqueueWriteBuffer (mInternal, buffer->getInternal(),
                                             aBlockingWrite, aOffset, aSize, data,
                                             eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  // Holder for async operations
  if (!aBlockingWrite)
  {
    // The holder object must be addreffed so it's not automatically released by
    // nsCOMPtr. The holder ensures that GC doesn't collect the JSObject that
    // owns the target memory (data).
    NS_ADDREF (holder);

    // Take an extra ref on the event to ensure it's not released before
    // the callback is invoked.
    mWrapper->retainEvent (event);

    void* userData = packBufferDataHolderUnrefCbUserData (mWrapper, holder);

    if (userData)
    {
      NS_ADDREF (mWrapper);

      // The holder is released in an event callback when the event has completed.
      err = mWrapper->setEventCallback (event, CL_COMPLETE, bufferDataHolderUnrefCb,
                                        userData);
      if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS || CL_FAILED (err))
      {
        D_LOG (LOG_LEVEL_ERROR, "setEventCallback failed with error %d.", err);
        NS_RELEASE (holder);
        mWrapper->releaseEvent (event);
      }
    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to pack user data for event cb: "
      "Memory allocation failure?");
      NS_RELEASE (holder);
      mWrapper->releaseEvent (event);
    }
  }

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueReadBuffer (in nsISupports aBuffer, in boolean aBlockingRead, in T_WebCLSize aOffset, in T_WebCLSize aSize, in nsIVariant aData, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueReadBuffer(nsISupports *aBuffer, bool aBlockingRead, T_WebCLSize aOffset, T_WebCLSize aSize, nsIVariant *aData, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aBuffer);
  NS_ENSURE_ARG_POINTER (aData);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> buffer = do_QueryInterface (aBuffer, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  void* data = 0;
  size_t length = 0;
  nsCOMPtr<nsIXPConnectJSObjectHolder> holder;
  rv = variantTypedArrayToData (cx, aData, &data, &length, getter_AddRefs(holder));
  NS_ENSURE_SUCCESS (rv, WEBCL_XPCOM_ERROR);

  // The array buffer is expected to have sufficient size for
  // incoming data. If this is not the case, then we'll throw an error.
  if (aSize > length)
  {
    D_LOG (LOG_LEVEL_ERROR, "aSize %d exceeds data buffer length %d.", aSize, length);
    WebCL_reportJSError (cx, "%s: aSize exceeds data buffer length.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  cl_int err = mWrapper->enqueueReadBuffer (mInternal, buffer->getInternal(),
                                            aBlockingRead, aOffset, aSize, data,
                                            eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);


  // Holder for async operations, see EnqueueWriteBuffer for details
  if (!aBlockingRead)
  {
    NS_ADDREF (holder);
    mWrapper->retainEvent (event);
    void* userData = packBufferDataHolderUnrefCbUserData (mWrapper, holder);
    if (userData)
    {
      NS_ADDREF (mWrapper);

      err = mWrapper->setEventCallback (event, CL_COMPLETE, bufferDataHolderUnrefCb,
                                        userData);
      if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS || CL_FAILED (err))
      {
        D_LOG (LOG_LEVEL_ERROR, "setEventCallback failed with error %d.", err);
        NS_RELEASE (holder);
        mWrapper->releaseEvent (event);
      }
    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to pack user data for event cb: "
      "Memory allocation failure?");
      NS_RELEASE (holder);
      mWrapper->releaseEvent (event);
    }
  }

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueWriteBufferRect (in nsISupports aBuffer, in boolean aBlockingWrite, in nsIVariant aBufferOrigin, in nsIVariant aHostOrigin, in nsIVariant aRegion, in T_WebCLSize aBufferRowPitch, in T_WebCLSize aBufferSlicePitch, in T_WebCLSize aHostRowPitch, in T_WebCLSize aHostSlicePitch, in nsIVariant aData, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueWriteBufferRect(nsISupports *aBuffer, bool aBlockingWrite, nsIVariant *aBufferOrigin, nsIVariant *aHostOrigin, nsIVariant *aRegion, T_WebCLSize aBufferRowPitch, T_WebCLSize aBufferSlicePitch, T_WebCLSize aHostRowPitch, T_WebCLSize aHostSlicePitch, nsIVariant *aData, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aBuffer);
  NS_ENSURE_ARG_POINTER (aBufferOrigin);
  NS_ENSURE_ARG_POINTER (aHostOrigin);
  NS_ENSURE_ARG_POINTER (aRegion);
  NS_ENSURE_ARG_POINTER (aData);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> buffer = do_QueryInterface (aBuffer, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  nsTArray<size_t> bufOrigin;
  rv = WEBCL_variantToOrigin (cx, aBufferOrigin, bufOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: buffer origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> hostOrigin;
  rv = WEBCL_variantToOrigin (cx, aHostOrigin, hostOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: host origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> region;
  rv = WebCL_variantToRegion (cx, aRegion, region);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: region is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }


  void* data = 0;
  size_t length = 0;
  nsCOMPtr<nsIXPConnectJSObjectHolder> holder;
  rv = variantTypedArrayToData (cx, aData, &data, &length, getter_AddRefs(holder));
  NS_ENSURE_SUCCESS (rv, WEBCL_XPCOM_ERROR);


  // Check that data object has enough data to be written.
  // hostOrigin: (x, y, z)  region: (width, height, depth)
  size_t reqSize = 0;
  size_t rowPitch = aHostRowPitch != 0 ? aHostRowPitch : (hostOrigin[0] + region[0]);
  if (region[2] > 1)
  {
    // 3D region
    size_t slicePitch = aHostSlicePitch != 0 ? aHostSlicePitch : rowPitch * (hostOrigin[1] + region[1]);
    reqSize = (hostOrigin[2] + region[2]) * slicePitch;
  }
  else
  {
    // 2D region
    reqSize = (hostOrigin[1] + region[1]) * rowPitch;
  }
  if (reqSize > length)
  {
    D_LOG (LOG_LEVEL_ERROR,
           "Data buffer too small for region. "
           "(buffer size: %u, required: %u)", length, reqSize);
    WebCL_reportJSError (cx, "%s: Data buffer too small for region.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }


  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  cl_int err = mWrapper->enqueueWriteBufferRect (mInternal, buffer->getInternal(),
                                                 aBlockingWrite,
                                                 bufOrigin.Elements(),
                                                 hostOrigin.Elements(),
                                                 region.Elements(),
                                                 aBufferRowPitch, aBufferSlicePitch,
                                                 aHostRowPitch, aHostSlicePitch,
                                                 data, eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);


  // Holder for async operations, see EnqueueWriteBuffer for details
  if (!aBlockingWrite)
  {
    NS_ADDREF (holder);
    mWrapper->retainEvent (event);
    void* userData = packBufferDataHolderUnrefCbUserData (mWrapper, holder);
    if (userData)
    {
      NS_ADDREF (mWrapper);

      err = mWrapper->setEventCallback (event, CL_COMPLETE, bufferDataHolderUnrefCb,
                                        userData);
      if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS || CL_FAILED (err))
      {
        D_LOG (LOG_LEVEL_ERROR, "setEventCallback failed with error %d.", err);
        NS_RELEASE (holder);
        mWrapper->releaseEvent (event);
      }
    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to pack user data for event cb: "
      "Memory allocation failure?");
      NS_RELEASE (holder);
      mWrapper->releaseEvent (event);
    }
  }

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueReadBufferRect (in nsISupports aBuffer, in boolean aBlockingRead, in nsIVariant aBufferOrigin, in nsIVariant aHostOrigin, in nsIVariant aRegion, in T_WebCLSize aBufferRowPitch, in T_WebCLSize aBufferSlicePitch, in T_WebCLSize aHostRowPitch, in T_WebCLSize aHostSlicePitch, in nsIVariant aData, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueReadBufferRect(nsISupports *aBuffer, bool aBlockingRead, nsIVariant *aBufferOrigin, nsIVariant *aHostOrigin, nsIVariant *aRegion, T_WebCLSize aBufferRowPitch, T_WebCLSize aBufferSlicePitch, T_WebCLSize aHostRowPitch, T_WebCLSize aHostSlicePitch, nsIVariant *aData, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aBuffer);
  NS_ENSURE_ARG_POINTER (aBufferOrigin);
  NS_ENSURE_ARG_POINTER (aHostOrigin);
  NS_ENSURE_ARG_POINTER (aRegion);
  NS_ENSURE_ARG_POINTER (aData);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> buffer = do_QueryInterface (aBuffer, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  nsTArray<size_t> bufOrigin;
  rv = WEBCL_variantToOrigin (cx, aBufferOrigin, bufOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: buffer origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> hostOrigin;
  rv = WEBCL_variantToOrigin (cx, aHostOrigin, hostOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: host origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> region;
  rv = WebCL_variantToRegion (cx, aRegion, region);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: region is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }


  void* data = 0;
  size_t length = 0;
  nsCOMPtr<nsIXPConnectJSObjectHolder> holder;
  rv = variantTypedArrayToData (cx, aData, &data, &length, getter_AddRefs(holder));
  NS_ENSURE_SUCCESS (rv, WEBCL_XPCOM_ERROR);


  // Check that data object has enough data to be written.
  // hostOrigin: (x, y, z)  region: (width, height, depth)
  size_t reqSize = 0;
  size_t rowPitch = aHostRowPitch != 0 ? aHostRowPitch : (hostOrigin[0] + region[0]);
  if (region[2] > 1)
  {
    // 3D region
    size_t slicePitch = aHostSlicePitch != 0 ? aHostSlicePitch : rowPitch * (hostOrigin[1] + region[1]);
    reqSize = (hostOrigin[2] + region[2]) * slicePitch;
  }
  else
  {
    // 2D region
    reqSize = (hostOrigin[1] + region[1]) * rowPitch;
  }
  if (reqSize > length)
  {
    D_LOG (LOG_LEVEL_ERROR,
           "Data buffer too small for region. "
           "(buffer size: %u, required: %u)", length, reqSize);
    WebCL_reportJSError (cx, "%s: Data buffer too small for region.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }


  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  cl_int err = mWrapper->enqueueReadBufferRect (mInternal, buffer->getInternal(),
                                                aBlockingRead,
                                                bufOrigin.Elements(),
                                                hostOrigin.Elements(),
                                                region.Elements(),
                                                aBufferRowPitch, aBufferSlicePitch,
                                                aHostRowPitch, aHostSlicePitch,
                                                data, eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);


  // Holder for async operations, see EnqueueWriteBuffer for details
  if (!aBlockingRead)
  {
    NS_ADDREF (holder);
    mWrapper->retainEvent (event);
    void* userData = packBufferDataHolderUnrefCbUserData (mWrapper, holder);
    if (userData)
    {
      NS_ADDREF (mWrapper);

      err = mWrapper->setEventCallback (event, CL_COMPLETE, bufferDataHolderUnrefCb,
                                        userData);
      if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS || CL_FAILED (err))
      {
        D_LOG (LOG_LEVEL_ERROR, "setEventCallback failed with error %d.", err);
        NS_RELEASE (holder);
        mWrapper->releaseEvent (event);
      }
    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to pack user data for event cb: "
      "Memory allocation failure?");
      NS_RELEASE (holder);
      mWrapper->releaseEvent (event);
    }
  }

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueWriteImage (in nsISupports aImage, in boolean aBlockingWrite, in nsIVariant aOrigin, in nsIVariant aRegion, in T_WebCLSize aInputRowPitch, in T_WebCLSize aInputSlicePitch, in nsIVariant aData, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueWriteImage(nsISupports *aImage, bool aBlockingWrite, nsIVariant *aOrigin, nsIVariant *aRegion, T_WebCLSize aInputRowPitch, T_WebCLSize aInputSlicePitch, nsIVariant *aData, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aImage);
  NS_ENSURE_ARG_POINTER (aOrigin);
  NS_ENSURE_ARG_POINTER (aRegion);
  NS_ENSURE_ARG_POINTER (aData);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> image = do_QueryInterface (aImage, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  nsTArray<size_t> origin;
  rv = WEBCL_variantToOrigin (cx, aOrigin, origin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> region;
  rv = WebCL_variantToRegion (cx, aRegion, region);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: region is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }


  void* data = 0;
  size_t length = 0;
  nsCOMPtr<nsIXPConnectJSObjectHolder> holder;
  rv = variantTypedArrayToData (cx, aData, &data, &length, getter_AddRefs(holder));
  NS_ENSURE_SUCCESS (rv, WEBCL_XPCOM_ERROR);


  // Make sure the array buffer is large enough for the requested
  // image data.
  size_t imgElemSize = 0;
  cl_int err = mWrapper->getImageInfo (image->getInternal(),
                                         CL_IMAGE_ELEMENT_SIZE, imgElemSize);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get image element size. (error %d)", err);
    WebCL_reportJSError (cx, "%s: Failed to get image element size, error %d.",
                         __FUNCTION__, err);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  // If aInputRowPitch or aInputSlicePitch are zero, calculate appropriate values.
  size_t reqSize = 0;
  size_t rowPitch = aInputRowPitch != 0 ? aInputRowPitch : region[0] * imgElemSize;
  if (region[2] > 1)
  {
    // 3D image
    size_t slicePitch = aInputSlicePitch != 0 ? aInputSlicePitch : rowPitch * region[1];
    reqSize = region[2] * slicePitch;
  }
  else
  {
    // 2D image
    reqSize = region[1] * rowPitch;
  }
  if (reqSize > length)
  {
    D_LOG (LOG_LEVEL_ERROR,
           "Data buffer too small for region. "
           "(buffer size: %u, required: %u)", length, reqSize);
    WebCL_reportJSError (cx, "%s: Data buffer too small for region.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }


  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  err = mWrapper->enqueueWriteImage (mInternal, image->getInternal(),
                                     aBlockingWrite,
                                     origin.Elements(),
                                     region.Elements(),
                                     aInputRowPitch, aInputSlicePitch,
                                     data, eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);


  // Holder for async operations, see EnqueueWriteBuffer for details
  if (!aBlockingWrite)
  {
    NS_ADDREF (holder);
    mWrapper->retainEvent (event);
    void* userData = packBufferDataHolderUnrefCbUserData (mWrapper, holder);
    if (userData)
    {
      NS_ADDREF (mWrapper);

      err = mWrapper->setEventCallback (event, CL_COMPLETE, bufferDataHolderUnrefCb,
                                        userData);
      if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS || CL_FAILED (err))
      {
        D_LOG (LOG_LEVEL_ERROR, "setEventCallback failed with error %d.", err);
        NS_RELEASE (holder);
        mWrapper->releaseEvent (event);
      }
    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to pack user data for event cb: "
      "Memory allocation failure?");
      NS_RELEASE (holder);
      mWrapper->releaseEvent (event);
    }
  }

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueReadImage (in nsISupports aImage, in boolean aBlockingRead, in nsIVariant aOrigin, in nsIVariant aRegion, in T_WebCLSize aRowPitch, in T_WebCLSize aSlicePitch, in nsIVariant aData, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueReadImage(nsISupports *aImage, bool aBlockingRead, nsIVariant *aOrigin, nsIVariant *aRegion, T_WebCLSize aRowPitch, T_WebCLSize aSlicePitch, nsIVariant *aData, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aImage);
  NS_ENSURE_ARG_POINTER (aOrigin);
  NS_ENSURE_ARG_POINTER (aRegion);
  NS_ENSURE_ARG_POINTER (aData);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> image = do_QueryInterface (aImage, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  nsTArray<size_t> origin;
  rv = WEBCL_variantToOrigin (cx, aOrigin, origin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> region;
  rv = WebCL_variantToRegion (cx, aRegion, region);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: region is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }


  void* data = 0;
  size_t length = 0;
  nsCOMPtr<nsIXPConnectJSObjectHolder> holder;
  rv = variantTypedArrayToData (cx, aData, &data, &length, getter_AddRefs(holder));
  NS_ENSURE_SUCCESS (rv, WEBCL_XPCOM_ERROR);


  // Make sure the array buffer is large enough for the requested
  // image data.
  size_t imgElemSize = 0;
  cl_int err = mWrapper->getImageInfo (image->getInternal(),
                                         CL_IMAGE_ELEMENT_SIZE, imgElemSize);
  if (CL_FAILED (err))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get image element size. (error %d)", err);
    WebCL_reportJSError (cx, "%s: Failed to get image element size, error %d.",
                         __FUNCTION__, err);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  // If aRowPitch or aSlicePitch are zero, calculate appropriate values.
  size_t reqSize = 0;
  size_t rowPitch = aRowPitch != 0 ? aRowPitch : region[0] * imgElemSize;
  if (region[2] > 1)
  {
    // 3D image
    size_t slicePitch = aSlicePitch != 0 ? aSlicePitch : rowPitch * region[1];
    reqSize = region[2] * slicePitch;
  }
  else
  {
    // 2D image
    reqSize = region[1] * rowPitch;
  }
  if (reqSize > length)
  {
    D_LOG (LOG_LEVEL_ERROR,
           "Data buffer too small for region. "
           "(buffer size: %u, required: %u)", length, reqSize);
    WebCL_reportJSError (cx, "%s: Data buffer too small for region.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }


  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  err = mWrapper->enqueueReadImage (mInternal, image->getInternal(),
                                    aBlockingRead,
                                    origin.Elements(),
                                    region.Elements(),
                                    aRowPitch, aSlicePitch,
                                    data, eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);


  // Holder for async operations, see EnqueueWriteBuffer for details
  if (!aBlockingRead)
  {
    NS_ADDREF (holder);
    mWrapper->retainEvent (event);
    void* userData = packBufferDataHolderUnrefCbUserData (mWrapper, holder);
    if (userData)
    {
      NS_ADDREF (mWrapper);

      err = mWrapper->setEventCallback (event, CL_COMPLETE, bufferDataHolderUnrefCb,
                                        userData);
      if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS || CL_FAILED (err))
      {
        D_LOG (LOG_LEVEL_ERROR, "setEventCallback failed with error %d.", err);
        NS_RELEASE (holder);
        mWrapper->releaseEvent (event);
      }
    }
    else
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to pack user data for event cb: "
      "Memory allocation failure?");
      NS_RELEASE (holder);
      mWrapper->releaseEvent (event);
    }
  }

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueCopyImage (in nsISupports aSrcImage, in nsISupports aDstImage, in nsIVariant aSrcOrigin, in nsIVariant aDstOrigin, in nsIVariant aRegion, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueCopyImage(nsISupports *aSrcImage, nsISupports *aDstImage, nsIVariant *aSrcOrigin, nsIVariant *aDstOrigin, nsIVariant *aRegion, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aSrcImage);
  NS_ENSURE_ARG_POINTER (aDstImage);
  NS_ENSURE_ARG_POINTER (aSrcOrigin);
  NS_ENSURE_ARG_POINTER (aDstOrigin);
  NS_ENSURE_ARG_POINTER (aRegion);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> srcImage = do_QueryInterface (aSrcImage, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  nsCOMPtr<WebCLMemoryObject> dstImage = do_QueryInterface (aDstImage, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  nsTArray<size_t> srcOrigin;
  rv = WEBCL_variantToOrigin (cx, aSrcOrigin, srcOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: source origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> dstOrigin;
  rv = WEBCL_variantToOrigin (cx, aDstOrigin, dstOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: destination origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> region;
  rv = WebCL_variantToRegion (cx, aRegion, region);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: region is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }


  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  cl_int err = mWrapper->enqueueCopyImage (mInternal,
                                           srcImage->getInternal(),
                                           dstImage->getInternal(),
                                           srcOrigin.Elements(),
                                           dstOrigin.Elements(),
                                           region.Elements(), eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueCopyImageToBuffer (in nsISupports aSrcImage, in nsISupports aDstBuffer, in nsIVariant aSrcOrigin, in nsIVariant aRegion, in T_WebCLSize aDstOffset, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueCopyImageToBuffer(nsISupports *aSrcImage, nsISupports *aDstBuffer, nsIVariant *aSrcOrigin, nsIVariant *aRegion, T_WebCLSize aDstOffset, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aSrcImage);
  NS_ENSURE_ARG_POINTER (aDstBuffer);
  NS_ENSURE_ARG_POINTER (aSrcOrigin);
  NS_ENSURE_ARG_POINTER (aRegion);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> srcImage = do_QueryInterface (aSrcImage, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  nsCOMPtr<WebCLMemoryObject> dstBuffer = do_QueryInterface (aDstBuffer, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  nsTArray<size_t> srcOrigin;
  rv = WEBCL_variantToOrigin (cx, aSrcOrigin, srcOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: source origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> region;
  rv = WebCL_variantToRegion (cx, aRegion, region);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: region is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }


  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  cl_int err = mWrapper->enqueueCopyImageToBuffer (mInternal,
                                                   srcImage->getInternal(),
                                                   dstBuffer->getInternal(),
                                                   srcOrigin.Elements(),
                                                   region.Elements(),
                                                   aDstOffset, eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueCopyBufferToImage (in nsISupports aSrcBuffer, in nsISupports aDstImage, in T_WebCLSize aSrcOffset, in nsIVariant aDstOrigin, in nsIVariant aRegion, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueCopyBufferToImage(nsISupports *aSrcBuffer, nsISupports *aDstImage, T_WebCLSize aSrcOffset, nsIVariant *aDstOrigin, nsIVariant *aRegion, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aSrcBuffer);
  NS_ENSURE_ARG_POINTER (aDstImage);
  NS_ENSURE_ARG_POINTER (aDstOrigin);
  NS_ENSURE_ARG_POINTER (aRegion);
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  nsCOMPtr<WebCLMemoryObject> srcBuffer = do_QueryInterface (aSrcBuffer, &rv);
  NS_ENSURE_SUCCESS (rv, rv);

  nsCOMPtr<WebCLMemoryObject> dstImage = do_QueryInterface (aDstImage, &rv);
  NS_ENSURE_SUCCESS (rv, rv);


  nsTArray<size_t> dstOrigin;
  rv = WEBCL_variantToOrigin (cx, aDstOrigin, dstOrigin);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: destination origin is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }

  nsTArray<size_t> region;
  rv = WebCL_variantToRegion (cx, aRegion, region);
  if (NS_FAILED (rv))
  {
    WebCL_reportJSError (cx, "%s: region is not an array of 3 integers.", __FUNCTION__);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_INVALID_ARG;
  }


  // Event wait list
  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);


  cl_event event;
  cl_int err = mWrapper->enqueueCopyBufferToImage (mInternal,
                                                   srcBuffer->getInternal(),
                                                   dstImage->getInternal(),
                                                   aSrcOffset,
                                                   dstOrigin.Elements(),
                                                   region.Elements(),
                                                   eventList, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* IWebCLEvent enqueueMapBuffer (in nsISupports aBuffer, in boolean aBlockingMap, in T_WebCLMapFlags aMapFlags, in T_WebCLSize aOffset, in T_WebCLSize aSize, in nsIVariant aEventWaitList, in nsIVariant aData); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueMapBuffer(nsISupports *aBuffer, bool aBlockingMap, T_WebCLMapFlags aMapFlags, T_WebCLSize aOffset, T_WebCLSize aSize, nsIVariant *aEventWaitList, nsIVariant *aData, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // TODO: How do we map buffers to typed arrays?
  // TODO: One option would be to setup an event callback and create a fake
  // TODO: arraybuffer on completion, providing access to the mapped region.
  // TODO: Memory management would still be a huge issue and unmap might
  // TODO: open up a vulnerability.
  // TODO: The safest option may be to remove buffer/image mapping from WebCL.
  // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  WebCL_reportJSError (cx, "enqueueMapBuffer is currently not supported by this WebCL implementation.");
  return WEBCL_XPCOM_ERROR;
}


/* IWebCLEvent enqueueMapImage (in nsISupports aImage, in boolean aBlockingMap, in T_WebCLMapFlags aMapFlags, in nsIVariant aOrigin, in nsIVariant aRegion, in nsIVariant aEventWaitList, in nsIVariant aData); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueMapImage(nsISupports *aImage, bool aBlockingMap, T_WebCLMapFlags aMapFlags, nsIVariant *aOrigin, nsIVariant *aRegion, nsIVariant *aEventWaitList, nsIVariant *aData, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  // NOTE: see EnqueueMapBuffer
  WebCL_reportJSError (cx, "enqueueMapImage is currently not supported by this WebCL implementation.");
  return WEBCL_XPCOM_ERROR;
}


/* IWebCLEvent enqueueUnmapMemObject (in nsISupports aMemObject, in nsIVariant aMappedData, [optional] in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueUnmapMemObject(nsISupports *aMemObject, nsIVariant *aMappedData, nsIVariant *aEventWaitList, JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  // NOTE: see EnqueueMapBuffer
  WebCL_reportJSError (cx, "enqueueUnmapMemObject is currently not supported by this WebCL implementation.");
  return WEBCL_XPCOM_ERROR;
}


/* IWebCLEvent enqueueMarker (); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueMarker(JSContext *cx, IWebCLEvent **_retval)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (cx);
  nsresult rv;

  cl_event event;
  cl_int err = mWrapper->enqueueMarker (mInternal, &event);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  nsCOMPtr<WebCLEvent> xpcObj;
  rv = WebCLEvent::getInstance (event, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);

  return NS_OK;
}


/* void enqueueWaitForEvents (in nsIVariant aEventWaitList); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueWaitForEvents(nsIVariant *aEventWaitList, JSContext *cx)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aEventWaitList);
  NS_ENSURE_ARG_POINTER (cx);
  nsresult rv;

  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventWaitList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> eventList;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         eventList);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  cl_int err = mWrapper->enqueueWaitForEvents (mInternal, eventList);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  return NS_OK;
}


/* void enqueueBarrier (); */
NS_IMETHODIMP WebCLCommandQueue::EnqueueBarrier(JSContext *cx)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (cx);

  cl_int err = mWrapper->enqueueBarrier (mInternal);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  return NS_OK;
}


/* void flush (); */
NS_IMETHODIMP WebCLCommandQueue::Flush(JSContext *cx)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (cx);

  cl_int err = mWrapper->flush (mInternal);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  return NS_OK;
}


/* void finish (); */
NS_IMETHODIMP WebCLCommandQueue::Finish(JSContext *cx)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (cx);

  cl_int err = mWrapper->finish (mInternal);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  return NS_OK;
}


/* void releaseCLResources (); */
NS_IMETHODIMP WebCLCommandQueue::ReleaseCLResources ()
{
  D_METHOD_START;
  if (mWrapper && mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (CL_FAILED (mWrapper->releaseCommandQueue (mInternal)))
      D_LOG (LOG_LEVEL_WARNING, "Failed to release CL resources.");
    mInternal = 0;
  }
  mWrapper = 0;
  return NS_OK;
}