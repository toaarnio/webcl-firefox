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

#include "WebCLSampler.h"
#include "WebCLCommon.h"
#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "nsComponentManagerUtils.h"
#include "nsISecurityCheckedComponent.h"


NS_IMPL_ISUPPORTS2 (WebCLSampler, IWebCLSampler, nsISecurityCheckedComponent)
WEBCL_SECURITY_CHECKED_IMPL (WebCLSampler)


/* static */
InstanceRegistry<cl_sampler, WebCLSampler*> WebCLSampler::instanceRegistry;


/* static */
nsresult WebCLSampler::getInstance (cl_sampler aInternal, WebCLSampler** aResultOut,
                                    WebCL_LibCLWrapper* aLibWrapper)
{
  nsresult rv = NS_OK;

  WebCLSampler* existing = 0;
  if (instanceRegistry.findById (aInternal, &existing))
  {
    NS_IF_ADDREF (*aResultOut = existing);
  }
  else
  {
    nsCOMPtr<WebCLSampler> obj = do_CreateInstance (WEBCL_SAMPLER_CONTRACTID, &rv);
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


WebCLSampler::WebCLSampler()
  : IWebCLSampler(), WebCLCommon(),
    mInternal(0)
{
  D_METHOD_START;
}


WebCLSampler::~WebCLSampler()
{
  D_METHOD_START;
  if (mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (mWrapper)
      mWrapper->releaseSampler (mInternal);
    mInternal = 0;
  }
}


int WebCLSampler::getTypeForInfoName (int aName)
{
  D_METHOD_START;
  switch (aName)
  {
    case CL_SAMPLER_REFERENCE_COUNT: return types::UINT;
    case CL_SAMPLER_CONTEXT: return types::CONTEXT;
    case CL_SAMPLER_ADDRESSING_MODE: return types::ADRESSING_MODE;
    case CL_SAMPLER_FILTER_MODE: return types::FILTER_MODE;
    case CL_SAMPLER_NORMALIZED_COORDS: return types::BOOL;
    default: ;
  }
  return types::UNKNOWN;
}


/* nsIVariant getSamplerInfo (in long aName); */
NS_IMETHODIMP WebCLSampler::GetSamplerInfo(PRInt32 aName, JSContext *cx, nsIVariant **_retval NS_OUTPARAM)
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

  WEBCL_GETINFO_MEDIATOR_SWITCH (aName, type, mWrapper, getSamplerInfo, mInternal,
                                 variant, err, rv);

  NS_ADDREF (*_retval = variant);

  return NS_OK;
}


/* void releaseCLResources (); */
NS_IMETHODIMP WebCLSampler::ReleaseCLResources ()
{
  D_METHOD_START;
  if (mWrapper && mInternal)
  {
    instanceRegistry.remove (mInternal);
    if (CL_FAILED (mWrapper->releaseSampler (mInternal)))
      D_LOG (LOG_LEVEL_WARNING, "Failed to release CL resources.");
    mInternal = 0;
  }
  mWrapper = 0;
  return NS_OK;
}
