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

/** \file WebCL.cpp
 * WebCL component implementation.
 */
#include "WebCLCommon.h"

#include "WebCL.h"

#include "WebCL_internal.h"
#include "WebCL_clwrapper.h"

#include "WebCLPlatform.h"
#include "WebCLContext.h"
#include "WebCLDevice.h"
#include "WebCLEvent.h"

#include "WebCLObserver.h"

#include "nsXPCOM.h"
#include "nsCOMPtr.h"
#include "nsError.h"
#include "nsCRT.h"
#include "jsapi.h"
#include "nsISupportsPrimitives.h"
#include "nsIClassInfoImpl.h"

#include "nsComponentManagerUtils.h"

#include "nsIVariant.h"

#include "nsIJSRuntimeService.h"
#include "nsIXPConnect.h"
#include "nsServiceManagerUtils.h"

#include "nsStringAPI.h"

// For prompter
#include "nsIPrompt.h"
#include "nsIWindowWatcher.h"
#include "nsIPrefBranch2.h"
#include "nsIPrefService.h"


#define WEBCL_PREF_ID__OCLLIB "extensions.webcl.opencllib"
#define WEBCL_PREF_ID__ALLOWED "extensions.webcl.allowed"
#define WEBCL_PREF_VALUE__ALLOWED__NOT_SET -1
#define WEBCL_PREF_VALUE__ALLOWED__FALSE 0
#define WEBCL_PREF_VALUE__ALLOWED__TRUE 1


#define WEBCL_ENSURE_USE_PERMITTED do{ \
  if(!mWebCLUsePermitted) { \
    if (mWebCLSecurityDialogNeeded) showSecurityPrompt (); \
    if (!mWebCLUsePermitted) { \
      D_LOG (LOG_LEVEL_ERROR, "WebCL use not permitted by user."); \
      return NS_ERROR_NOT_AVAILABLE; \
    } \
  } }while(0)


#define WEBCL_ENSURE_LIB_LOADED() do{ \
  if (mLibLoadFailed) { \
    WebCL_reportJSError (cx, "Failed to load OpenCL library."); \
    return WEBCL_XPCOM_ERROR; \
  } \
  if (!mWrapper) { \
    nsresult rv = loadLibrary (cx); \
    NS_ENSURE_SUCCESS (rv, rv); \
    NS_ENSURE_TRUE (mWrapper, NS_ERROR_NULL_POINTER); \
  } }while(0)


/* NOTE: We use the ClassInfo variant of NS_IMPL_ISUPPORTS to enable
 * the nice ClassInfo-provided features such as interface flattening,
 * i.e. no need to QI the global WebCL to Components.interfaces.IWebCL in JS.
 */
NS_IMPL_CLASSINFO (WebCL, NULL, 0, WEBCL_CID)
NS_IMPL_ISUPPORTS2_CI(WebCL, IWebCL, nsISecurityCheckedComponent)


WebCL::WebCL()
  : IWebCL (),
    WebCLCommon (),
    mTypes (),
    mWebCLUsePermitted (false),
    mWebCLSecurityDialogNeeded (true),
    mLibLoadFailed(false),
    mObserver(new (std::nothrow) WebCLObserver)
{
  D_METHOD_START;

  nsresult rv;

  if (!mObserver)
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to create WebCL observer.");
    // TODO: report error to user
    return;
  }

  mObserver->setWebCL (this);

  // NOTE: Firefox 13 deprecates nsIPrefBranch2 in favor of nsIPrefBranch

  //extensions.webcl.allowed
  nsCOMPtr<nsIPrefBranch2> branch = do_GetService (NS_PREFSERVICE_CONTRACTID, &rv);
  if (NS_SUCCEEDED (rv))
  {

    PRInt32 val = WEBCL_PREF_VALUE__ALLOWED__NOT_SET;
    rv = branch->GetIntPref(WEBCL_PREF_ID__ALLOWED, &val);
    if (NS_SUCCEEDED (rv))
    {
      D_LOG (LOG_LEVEL_DEBUG, "%s: %d",WEBCL_PREF_ID__ALLOWED, val);
      if (val == WEBCL_PREF_VALUE__ALLOWED__NOT_SET)
      {
        mWebCLSecurityDialogNeeded = true;
      }
      else if (val == WEBCL_PREF_VALUE__ALLOWED__FALSE || val == WEBCL_PREF_VALUE__ALLOWED__TRUE)
      {
        mWebCLUsePermitted = (bool)val;
        mWebCLSecurityDialogNeeded = false;
      }
      else
      {
        D_LOG (LOG_LEVEL_ERROR, "Unexpected value for preferense "
               WEBCL_PREF_ID__ALLOWED ". Resetting to %d.", WEBCL_PREF_VALUE__ALLOWED__NOT_SET);
        rv = branch->SetIntPref(WEBCL_PREF_ID__ALLOWED, WEBCL_PREF_VALUE__ALLOWED__NOT_SET);
      }
    }
    else
    {
      rv = branch->SetIntPref(WEBCL_PREF_ID__ALLOWED, WEBCL_PREF_VALUE__ALLOWED__NOT_SET);
      D_LOG (LOG_LEVEL_DEBUG, "%s: %d  (created as default)",WEBCL_PREF_ID__ALLOWED, val);
    }

    rv = branch->AddObserver(WEBCL_PREF_ID__ALLOWED, mObserver, PR_FALSE);
    if (NS_SUCCEEDED (rv))
      branch->AddObserver(WEBCL_PREF_ID__OCLLIB, mObserver, PR_FALSE);

    if (NS_FAILED(rv))
    {
      D_LOG (LOG_LEVEL_ERROR, "Failed to add preference observer, rv=%X.", rv);
    }
    else
    {
      D_LOG (LOG_LEVEL_DEBUG, "Preference observer registered.");
    }
  }
  else
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get preference service.");
  }
}


WebCL::~WebCL()
{
  D_METHOD_START;

  nsresult rv;
  nsCOMPtr<nsIPrefBranch2> branch = do_GetService (NS_PREFSERVICE_CONTRACTID, &rv);
  if (NS_SUCCEEDED (rv))
  {
    // TODO: Is this OK or should we store the original nsIPrefBranch2 instance from constructor?
    rv = branch->RemoveObserver(WEBCL_PREF_ID__ALLOWED, mObserver);
    if (NS_FAILED (rv))
      D_LOG (LOG_LEVEL_WARNING, "Failed to unregister preference observer.");
  }
}


NS_IMETHODIMP WebCL::GetTypes(JSContext *cx, nsIVariant **aTypes)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aTypes);
  if (!mTypes)
  {
    nsresult rv = WebCL_createTypesObject (cx, getter_AddRefs (mTypes));
    NS_ENSURE_SUCCESS (rv, rv);
  }
  NS_ADDREF (*aTypes = mTypes);
  return NS_OK;
}


NS_IMETHODIMP WebCL::GetVersion(JSContext *cx, nsIVariant **aVersion)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aVersion);
  if (!mVersion)
 {
    nsresult rv = WebCL_createVersionObject (cx, getter_AddRefs (mVersion));
    NS_ENSURE_SUCCESS (rv, rv);
  }
  NS_ADDREF (*aVersion = mVersion);
  return NS_OK;
}


/* nsIVariant getPlatformIDs (); */
NS_IMETHODIMP WebCL::GetPlatformIDs(JSContext *cx, nsIVariant **_retval)
{
  return GetPlatforms (cx, _retval);
}

/* nsIVariant getPlatforms (); */
NS_IMETHODIMP WebCL::GetPlatforms(JSContext *cx, nsIVariant **_retval)
{
  D_METHOD_START;

  WEBCL_ENSURE_USE_PERMITTED;
  NS_ENSURE_ARG_POINTER (_retval);
  WEBCL_ENSURE_LIB_LOADED ();
  nsresult rv;

  nsTArray<cl_platform_id> platforms;
  cl_int err = mWrapper->getPlatformIDs (platforms);
  if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS)
  {
    // TODO: report detailed error to user
    return NS_ERROR_NOT_IMPLEMENTED;
  }
  if (CL_FAILED (err))
  {
    WebCL_reportJSError (cx, "WebCL::getPlatforms Failed with error %d.", err);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  if (platforms.IsEmpty ())
  {
    D_LOG (LOG_LEVEL_WARNING, "No platforms found.");
    // This is not an error, so we'll return an empty array anyway.
  }

  nsCOMPtr<nsIVariant> value;
  rv = WebCL_convertVectorToJSArrayInVariant (cx, platforms,
                                              types::PLATFORM_V,
                                              getter_AddRefs (value),
                                              (WebCL_LibCLWrapper*)mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = value);

  return NS_OK;
}


/** Convert a JSArray of values or JSObjects to C array of cl_context_properties.
 * Designed to be compatible with ContextWrapper::createContext,
 * ContextWrapper::createContextFromType, clCreateContext and
 * clCreateContextFromType.
 * \param aProperties An input JSArray. Items must be integers or WebCLPlatform
 * instances where applicable.
 * \param aResultOut Out-pointer for result. Result may be NULL even when
 * return value is NS_OK if there were no properties in aProperties.
 * \return NS error code or NS_OK on success.
 */
static nsresult convertContextProperties (JSContext *cx, nsIVariant *aProperties,
                                          cl_context_properties** aResultOut)
{
  D_METHOD_START;
  nsresult rv;
  NS_ENSURE_ARG_POINTER (aProperties);

  nsTArray<nsIVariant*> elements;
  rv = WebCL_getVariantsFromJSArray (cx, aProperties, elements);
  if (NS_FAILED (rv))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get elements from argument aProperties. (rv %d)", rv);
    return NS_ERROR_INVALID_ARG;
  }

  cl_context_properties* clProperties = 0;

  if (!elements.IsEmpty ())
  {
    clProperties =  (cl_context_properties*)malloc(sizeof (cl_context_properties)
                                                   * (elements.Length () + 1));
    if (!clProperties)
    {
      D_LOG (LOG_LEVEL_ERROR, "Memory allocation failed.");
      WebCL_releaseVariantVector (elements);
      return NS_ERROR_OUT_OF_MEMORY;
    }

    size_t cnt = 0;
    rv = NS_OK;
    for (nsTArray<nsIVariant*>::index_type i = 0; i < elements.Length(); ++i)
    {
      if (!elements[i])
      {
        D_LOG (LOG_LEVEL_ERROR, "Invalid non-variant element at position %lu.", cnt+1);
        rv = NS_ERROR_FAILURE;
        break;
      }

      // Check expected non-integer types based previously converted property.
      if (cnt > 0 && clProperties[cnt - 1] == CL_CONTEXT_PLATFORM)
      {
        // Expected object: IWebCLPlatform
        nsCOMPtr<nsISupports> isu;
        rv = elements[i]->GetAsISupports (getter_AddRefs(isu));
        if (NS_FAILED (rv))
        {
          // TODO: this error message is probably lost
          WebCL_reportJSError (cx, "Expected nsISupports element at position %d.", i + 1);
          D_LOG (LOG_LEVEL_ERROR,
                 "Expected nsISupports element at position %d. (rv %d)", i+1, rv);
          break;
        }
        nsCOMPtr<WebCLPlatform> platform = do_QueryInterface (isu, &rv);
        if (NS_FAILED (rv))
        {
          // TODO: this error message is probably lost
          WebCL_reportJSError (cx, "Failed to convert element at position %d to WebCLPlatform.", i + 1);
          D_LOG (LOG_LEVEL_ERROR,
                 "Failed to convert element at position %d to WebCLPlatform. (rv %d)",
                 i+1, rv);
          break;
        }

        clProperties[cnt++] = (cl_context_properties) (platform->getInternal ());

      }
      else
      {
        // We generally assume all values are integers unless some other type
        // is required by property id.
        PRInt32 val = 0;
        rv = elements[i]->GetAsInt32 (&val);
        if (NS_FAILED (rv))
        {
          D_LOG (LOG_LEVEL_ERROR,
                "Unexpected non-integer element at position %d. (rv %d)",
                i+1, rv);
          break;
        }
        clProperties[cnt++] = (cl_context_properties)val;
      }

    }

    // Release variants
    WebCL_releaseVariantVector (elements);
    elements.Clear ();

    // Handle errors from within the previous loop.
    if (NS_FAILED (rv))
    {
      return rv;
    }

    clProperties [cnt] = 0;
  }

  if (aResultOut)
    *aResultOut = clProperties;

  return NS_OK;
}


/* Ensure that the OpenCL platform version of a device is at least 1.1.
 */
static nsresult ensureDeviceCLVersion (JSContext *cx, WebCL_LibCLWrapper* aLib,
                                       cl_device_id aDevice)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aDevice);
  nsresult rv;

  cl_int err = CL_SUCCESS;

  // Get name for error message purposes.
  nsCString name;
  aLib->getDeviceInfo (aDevice, CL_DEVICE_NAME, name);
  // Failure is OK here, though unexpected.

  // Get a char* to name so we can use it more directly.
  // Note: The memory is owned by nsCString!
  char const* const cName = name.get();

  // NOTE: We need to check the platform version string instead of the device
  //       version string. The latter is given from the point of view of
  //       device capabilities and may be limited to 1.0 even when the 1.1
  //       features we're interested in are there anyway.

  cl_platform_id platform;
  err = aLib->getDeviceInfo (aDevice, CL_DEVICE_PLATFORM, platform);
  if (CL_FAILED (err))
  {
    WebCL_reportJSError (cx, "Failed to get platform object for device %s. (err %d)", cName, err);
    return NS_ERROR_FAILURE;
  }

  nsCString versionStr;
  err = aLib->getPlatformInfo (platform, CL_PLATFORM_VERSION, versionStr);
  if (CL_FAILED (err))
  {
    WebCL_reportJSError (cx, "Failed to get platform version for device %s. (err %d)", cName, err);
    return NS_ERROR_FAILURE;
  }

  cl_int minor = 0, major = 0;
  nsCString vendorInfo;
  rv = WebCL_parseOpenCLVersion (versionStr, major, minor, vendorInfo);
  if (NS_FAILED (rv))
 {
    D_LOG (LOG_LEVEL_ERROR, "Failed to parse version string for device %s. (rv %d)", cName, rv);
    WebCL_reportJSError (cx, "Failed to parse version string for device %s.", cName);
    return rv;
  }

  // The OpenCL version must be 1.1 or more recent.
  if ( !(major > 1 || minor >= 1))
  {
    D_LOG (LOG_LEVEL_ERROR,
           "Platform version for device \"%s\" is \"%s\". WebCL requires OpenCL 1.1 or greater.",
           cName, versionStr.get());
    WebCL_reportJSError (cx, "Platform version for device \"%s\" is \"%s\". WebCL requires OpenCL 1.1 or greater.",
                         cName, versionStr.get());
    return NS_ERROR_INVALID_ARG;
  }

  return NS_OK;
}


/* Ensure that the versions of devices on the context are at least OpenCL 1.1.
 */
static nsresult ensureContextDevicesCompatibility (JSContext *cx, WebCL_LibCLWrapper* aLib,
                                                   cl_context aCtx)
{
  D_METHOD_START;
  NS_ENSURE_ARG_POINTER (aCtx);
  nsresult rv = NS_OK;
  nsTArray<cl_device_id> devices;

  cl_int wrErr = aLib->getContextInfo (aCtx, CL_CONTEXT_DEVICES, devices);
  if (CL_FAILED (wrErr))
  {
    return NS_ERROR_FAILURE;
  }

  for (nsTArray<cl_device_id>::index_type i = 0; i < devices.Length(); ++i)
  {
    rv = ensureDeviceCLVersion (cx, aLib, devices[i]);
    if (NS_FAILED (rv))
    {
      break;
    }
  }
  return rv;
}


/* IWebCLContext createContext (in nsIVariant aProperties, in nsIVariant aDevices); */
NS_IMETHODIMP WebCL::CreateContext(nsIVariant *aProperties, nsIVariant *aDevices, JSContext *cx, IWebCLContext **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_USE_PERMITTED;
  NS_ENSURE_ARG_POINTER (aProperties);
  NS_ENSURE_ARG_POINTER (aDevices);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;
  bool reported = false;

  // Devices
  nsTArray<nsIVariant*> deviceVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aDevices, deviceVariants);
  if (NS_FAILED (rv))
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get elements from argument aDevices. (rv %d)", rv);
    return NS_ERROR_INVALID_ARG;
  }

  nsTArray<cl_device_id> devices;
  devices.SetCapacity (deviceVariants.Length ());
  if (!deviceVariants.IsEmpty ())
  {
    rv = NS_OK;
    for (nsTArray<nsIVariant*>::index_type i = 0; i < deviceVariants.Length(); ++i)
    {
      if (!deviceVariants[i])
      {
        D_LOG (LOG_LEVEL_ERROR, "Invalid non-variant element in aDevices at position %d.", i+1);
        WebCL_reportJSError (cx, "Invalid non-variant element in aDevices at position %d.", i+1);
        reported = true;
        rv = NS_ERROR_INVALID_ARG;
        break;
      }

      nsCOMPtr<nsISupports> isu;
      rv = deviceVariants[i]->GetAsISupports (getter_AddRefs(isu));
      if (NS_FAILED (rv))
      {
        D_LOG (LOG_LEVEL_ERROR,
               "Expected nsISupports element in aDevices at position %d. (rv %d)", i+1, rv);
        WebCL_reportJSError (cx, "Expected nsISupports element in aDevices at position %d.", i+1);
        reported = true;
        break;
      }
      nsCOMPtr<WebCLDevice> device = do_QueryInterface (isu, &rv);
      if (NS_FAILED (rv))
      {
        D_LOG (LOG_LEVEL_ERROR,
               "Failed to convert element in aDevices at position %d to WebCLDevice. (rv %d)",
               i+1, rv);
        WebCL_reportJSError (cx, "Failed to convert element in aDevices at position %d to WebCLDevice.", i+1);
        reported = true;
        break;
      }

      devices.AppendElement (device->getInternal ());
    }

    // Release variants
    WebCL_releaseVariantVector (deviceVariants);
    deviceVariants.Clear ();

    // Handle errors from within the previous loop.
    if (NS_FAILED (rv))
    {
      return reported ? WEBCL_XPCOM_ERROR : rv;
    }
  }

  // Context properties
  cl_context_properties* clProperties = 0;
  rv = convertContextProperties (cx, aProperties, &clProperties);
  // TODO: fix error reporting
  NS_ENSURE_SUCCESS (rv, rv);

  // Create context
  cl_int err = CL_SUCCESS;
  cl_context ctx = mWrapper->createContext (clProperties, devices, 0, 0, &err);

  if (clProperties)
    free (clProperties);

  if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS)
  {
    // TODO: report detailed error to user
    return NS_ERROR_NOT_IMPLEMENTED;
  }
  if (CL_FAILED (err) || !ctx)
  {
    WebCL_reportJSError (cx, "%s Failed with error %d.", __FUNCTION__, err);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  // Ensure that the devices in this context are suitable for WebCL.
  rv = ensureContextDevicesCompatibility (cx, mWrapper, ctx);
  if (NS_FAILED (rv))
  {
    mWrapper->releaseContext (ctx);
    // The error is reported in ensureContextDevicesCompatibility
    return WEBCL_XPCOM_ERROR;
  }

  nsCOMPtr<WebCLContext> xpcObj;
  rv = WebCLContext::getInstance (ctx, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);
  return NS_OK;
}


/* IWebCLContext createContextFromType (in nsIArray aProperties, in T_WebCLDeviceType aDeviceType); */
NS_IMETHODIMP WebCL::CreateContextFromType(nsIVariant *aProperties, T_WebCLDeviceType aDeviceType, JSContext *cx, IWebCLContext **_retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_USE_PERMITTED;
  NS_ENSURE_ARG_POINTER (aProperties);
  NS_ENSURE_ARG_POINTER (cx);
  NS_ENSURE_ARG_POINTER (_retval);
  nsresult rv;

  cl_context_properties* clProperties = 0;
  rv = convertContextProperties (cx, aProperties, &clProperties);
  NS_ENSURE_SUCCESS (rv, rv);

  // Create context
  cl_int err = CL_SUCCESS;
  cl_context ctx = mWrapper->createContextFromType (clProperties, aDeviceType, 0, 0, &err);

  if (clProperties)
  {
    free (clProperties);
  }

  if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS)
  {
    // TODO: report detailed error to user
    return NS_ERROR_NOT_IMPLEMENTED;
  }
  if (CL_FAILED (err) || !ctx)
  {
    WebCL_reportJSError (cx, "%s Failed with error %d.", __FUNCTION__, err);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  // Ensure that the devices in this context are suitable for WebCL.
  rv = ensureContextDevicesCompatibility (cx, mWrapper, ctx);
  if (NS_FAILED (rv))
  {
    mWrapper->releaseContext (ctx);
    // The error is reported in ensureContextDevicesCompatibility
    return WEBCL_XPCOM_ERROR;
  }

  nsCOMPtr<WebCLContext> xpcObj;
  rv = WebCLContext::getInstance (ctx, getter_AddRefs(xpcObj), mWrapper);
  NS_ENSURE_SUCCESS (rv, rv);

  NS_ADDREF (*_retval = xpcObj);
  return NS_OK;
}


/* void waitForEvents (in nsIVariant aEventList); */
NS_IMETHODIMP WebCL::WaitForEvents(nsIVariant *aEventList, JSContext *cx)
{
  D_METHOD_START;
  WEBCL_ENSURE_USE_PERMITTED;
  nsresult rv;

  nsTArray<nsIVariant*> eventVariants;
  rv = WebCL_getVariantsFromJSArray (cx, aEventList, eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  nsTArray<cl_event> events;
  rv = WebCL_convertVariantVectorToInternalVector<WebCLEvent, cl_event> (eventVariants,
                                                                         events);
  WebCL_releaseVariantVector (eventVariants);
  NS_ENSURE_SUCCESS (rv, rv);

  cl_int err = mWrapper->waitForEvents (events);
  if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS)
  {
    // TODO: report detailed error to user
    return NS_ERROR_NOT_IMPLEMENTED;
  }
  if (CL_FAILED (err))
  {
    WebCL_reportJSError (cx, "%s Failed with error %d.", __FUNCTION__, err);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  return NS_OK;
}


/* void unloadCompiler (); */
NS_IMETHODIMP WebCL::UnloadCompiler(JSContext *cx)
{
  D_METHOD_START;
  WEBCL_ENSURE_USE_PERMITTED;

  cl_int err = mWrapper->unloadCompiler ();
  if (mWrapper->status() != WebCL_LibCLWrapper::SUCCESS)
  {
    // TODO: report detailed error to user
    return NS_ERROR_NOT_IMPLEMENTED;
  }
  if (CL_FAILED (err))
  {
    WebCL_reportJSError (cx, "%s Failed with error %d.", __FUNCTION__, err);
    return WEBCL_XPCOM_ERROR; //NS_ERROR_FAILURE;
  }

  return NS_OK;
}



// nsISecurityCheckedComponent

NS_IMETHODIMP
WebCL::CanCreateWrapper (const nsIID* aIID,
                            char** _retval)
{
  D_METHOD_START;
//  WEBCL_ENSURE_USE_PERMITTED;
  *_retval = NS_strdup (C_COM_SECURITY_ALL_ACCESS);
  return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY;
}

NS_IMETHODIMP
WebCL::CanCallMethod (const nsIID* aIID, const PRUnichar* aMethodName,
                        char** _retval)
{
  D_METHOD_START;
  WEBCL_ENSURE_USE_PERMITTED;
  NS_ENSURE_TRUE (_retval, NS_ERROR_NULL_POINTER);
  *_retval = NS_strdup (C_COM_SECURITY_ALL_ACCESS);
  return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY;
}

NS_IMETHODIMP
WebCL::CanGetProperty (const nsIID* aIID, const PRUnichar* aPropertyName,
                          char** _retval)
{
  D_METHOD_START;
  NS_ENSURE_TRUE (_retval, NS_ERROR_NULL_POINTER);
  *_retval = NS_strdup (C_COM_SECURITY_ALL_ACCESS);
  return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY;
}

NS_IMETHODIMP
WebCL::CanSetProperty (const nsIID* aIID, const PRUnichar* aPropertyName,
                          char** _retval)
{
  D_METHOD_START;
//  WEBCL_ENSURE_USE_PERMITTED;
  NS_ENSURE_TRUE (_retval, NS_ERROR_NULL_POINTER);
  *_retval = NS_strdup (C_COM_SECURITY_NO_ACCESS);
  return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY;
}


// Called from WebCLObserver
nsresult WebCL::preferenceChanged (nsISupports* aSubject, const char* aTopic, const PRUnichar* aData)
{
  D_METHOD_START;
  nsresult rv = NS_OK;
  if (!strcmp(aTopic, NS_PREFBRANCH_PREFCHANGE_TOPIC_ID))
  {
    nsCOMPtr<nsIPrefBranch> branch = do_QueryInterface(aSubject);
    if (!branch)
    {
      D_LOG (LOG_LEVEL_ERROR, "No preference branch!");
      return NS_ERROR_FAILURE;
    }

    // extensions.webcl.allowed
    PRInt32 val = WEBCL_PREF_VALUE__ALLOWED__NOT_SET;
    rv = branch->GetIntPref(WEBCL_PREF_ID__ALLOWED, &val);
    if (NS_SUCCEEDED(rv))
    {
      if (val == WEBCL_PREF_VALUE__ALLOWED__NOT_SET)
      {
        mWebCLSecurityDialogNeeded = true;
      }
      else if (val == WEBCL_PREF_VALUE__ALLOWED__FALSE || val == WEBCL_PREF_VALUE__ALLOWED__TRUE)
      {
        mWebCLUsePermitted = (bool)val;
        mWebCLSecurityDialogNeeded = false;
      }
      else
      {
        D_LOG (LOG_LEVEL_ERROR, "Unexpected value for preferense " WEBCL_PREF_ID__ALLOWED);
      }
    }
    else
    {
      D_LOG (LOG_LEVEL_WARNING, "failed to read preference %s: %d", WEBCL_PREF_ID__ALLOWED, rv);
    }

  }

  // extensions.webcl.opencllib
  // We don't handle the actual value here but just enable the library loading
  // to be retried just.
  mLibLoadFailed = false;

  return NS_OK;
}


// Private & protected methods

nsresult WebCL::loadLibrary (JSContext *cx)
{
  if (mWrapper && mWrapper->library())
  {
    // Library OK
    return NS_OK;
  }

  nsresult rv;
  nsCOMPtr<nsIPrefBranch2> branch = do_GetService (NS_PREFSERVICE_CONTRACTID, &rv);
  NS_ENSURE_SUCCESS (rv, rv);
  nsCString settingsLibPath;
  rv = branch->GetCharPref(WEBCL_PREF_ID__OCLLIB, getter_Copies(settingsLibPath));
  char const* libPath = 0;
  if (NS_SUCCEEDED(rv))
  {
    D_LOG (LOG_LEVEL_DEBUG, "%s: %s",WEBCL_PREF_ID__OCLLIB, settingsLibPath.get());
    libPath = settingsLibPath.get();
  }
  else
  {
    rv = branch->SetCharPref(WEBCL_PREF_ID__OCLLIB, "");
    D_LOG (LOG_LEVEL_DEBUG, "%s: \"\"  (created as default)",WEBCL_PREF_ID__OCLLIB);
    libPath = "";
  }

  if (strlen(libPath) == 0)
  {
    libPath = "OpenCL";
  }

  nsCString errStr;
  nsCOMPtr<WebCL_LibCL> libCL;
  if (!WebCL_LibCL::load(libPath, getter_AddRefs(libCL), &errStr))
  {
    mWrapper = 0;
    mLibLoadFailed = true;

    if (cx)
    {
      WebCL_reportJSError (cx, "Failed to load OpenCL library \"%s\": %s",
                           libPath, errStr.get());
      return WEBCL_XPCOM_ERROR;
    }

    return NS_ERROR_FAILURE;
  }

  mWrapper = new WebCL_LibCLWrapper (libCL);
  mLibLoadFailed = false;

  return NS_OK;
}


nsresult WebCL::showSecurityPrompt ()
{
  D_METHOD_START;
  nsresult rv;

  // Deny use if prompter fails.
  mWebCLUsePermitted = false;

  nsCOMPtr<nsIPrompt> prompter;
  nsCOMPtr<nsIWindowWatcher> wwatch(do_GetService(NS_WINDOWWATCHER_CONTRACTID, &rv));
  NS_ENSURE_SUCCESS (rv, rv);

  rv = wwatch->GetNewPrompter(0, getter_AddRefs(prompter));
  if (NS_FAILED (rv) || !prompter)
  {
    D_LOG (LOG_LEVEL_ERROR, "Failed to get prompt service.");
    return NS_FAILED(rv) ? rv : NS_ERROR_FAILURE;
  }

  // Default to deny. Just in case the dialog fails somehow..
  bool response = false;
  bool makePermanent = false;

  nsCOMPtr<nsIPrefBranch2> branch = do_GetService (NS_PREFSERVICE_CONTRACTID, &rv);
  PRInt32 val = WEBCL_PREF_VALUE__ALLOWED__NOT_SET;
  if (NS_SUCCEEDED(rv) && branch)
  {
    rv = branch->GetIntPref(WEBCL_PREF_ID__ALLOWED, &val);
  }
  if (NS_FAILED (rv))
  {
    D_LOG (LOG_LEVEL_WARNING, "Failed to access preferences.");
  }
  makePermanent = (val == WEBCL_PREF_VALUE__ALLOWED__NOT_SET ? PR_FALSE : PR_TRUE);


  nsString msg = NS_LITERAL_STRING("WARNING! This WebCL implementation is experimental and");
  msg.Append(NS_LITERAL_STRING(" is likely to introduce severe security vulnerabilities"));
  msg.Append(NS_LITERAL_STRING(" in your system. Use it cautiously and at your own risk."));
  msg.Append(NS_LITERAL_STRING(" This setting is also available in Advanced Settings"));
  msg.Append(NS_LITERAL_STRING(" (about:config) as "));
  msg.Append(NS_LITERAL_STRING(WEBCL_PREF_ID__ALLOWED));
  msg.Append(NS_LITERAL_STRING(" ."));
  rv = prompter->ConfirmCheck(NS_LITERAL_STRING("WebCL security warning").get(),
                              msg.get (),
                              NS_LITERAL_STRING("Remember this setting.").get(),
                              &makePermanent,
                              &response);
  if (NS_SUCCEEDED (rv))
  {
    mWebCLUsePermitted = (bool)response;
    mWebCLSecurityDialogNeeded = false;

    if (makePermanent && branch)
    {
      PRInt32 val = (mWebCLUsePermitted ? WEBCL_PREF_VALUE__ALLOWED__TRUE : WEBCL_PREF_VALUE__ALLOWED__FALSE);
      rv = branch->SetIntPref(WEBCL_PREF_ID__ALLOWED, val);
      if (NS_FAILED (rv))
        D_LOG (LOG_LEVEL_ERROR, "Failed to set preference " WEBCL_PREF_ID__ALLOWED);
    }
  }

  return rv;
}

