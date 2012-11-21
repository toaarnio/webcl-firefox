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

#include "WebCLEvent.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"


NS_IMPL_ISUPPORTS2 (WebCLEvent, IWebCLEvent, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLEvent)


/* static */
InstanceRegistry<cl_event, WebCLEvent*> WebCLEvent::instanceRegistry;


/* static */
nsresult WebCLEvent::getInstance (cl_event aInternal, WebCLEvent** aResultOut,
                                  WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLEvent* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLEvent> obj = do_CreateInstance (WEBCL_EVENT_CONTRACTID, &rv);
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


WebCLEvent::WebCLEvent()
  : IWebCLEvent(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLEvent::~WebCLEvent()
{
  D_METHOD_START;
  if (mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (mWrapper)
      mWrapper->releaseEvent (mInternal);
    mInternal = 0;
  }
}


int WebCLEvent::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    // getInfo
    case CL_EVENT_COMMAND_QUEUE: return types::COMMAND_QUEUE;
    case CL_EVENT_CONTEXT: return types::CONTEXT;
    case CL_EVENT_COMMAND_TYPE: return types::COMMAND_TYPE;
    case CL_EVENT_COMMAND_EXECUTION_STATUS: return types::INT;
    case CL_EVENT_REFERENCE_COUNT: return types::UINT;

    // getProfilingInfo
    case CL_PROFILING_COMMAND_QUEUED: return types::ULONG;
    case CL_PROFILING_COMMAND_SUBMIT: return types::ULONG;
    case CL_PROFILING_COMMAND_START: return types::ULONG;
    case CL_PROFILING_COMMAND_END: return types::ULONG;
    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getEventInfo (in long aName); */
NS_IMETHODIMP WebCLEvent::GetEventInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getEventInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* nsIVariant getEventProfilingInfo (in long aName); */
NS_IMETHODIMP WebCLEvent::GetEventProfilingInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getEventProfilingInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* void setUserEventStatus (in long aExecutionStatus); */
NS_IMETHODIMP WebCLEvent::SetUserEventStatus(PRInt32 aExecutionStatus, JSContext *cx)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (cx);

  cl_int err = mWrapper->setUserEventStatus (mInternal, aExecutionStatus);
  ENSURE_LIB_WRAPPER_SUCCESS (mWrapper);
  ENSURE_CL_OP_SUCCESS (err);

  return NS_OK;
}


/* void releaseCLResources (); */
NS_IMETHODIMP WebCLEvent::ReleaseCLResources ()
{
  D_METHOD_START;
  if (mWrapper && mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (CL_FAILED (mWrapper->releaseEvent (mInternal)))
      D_LOG (LOG_LEVEL_WARNING, "Failed to release CL resources.");
    mInternal = 0;
  }
  mWrapper = 0;
  return NS_OK;
}
