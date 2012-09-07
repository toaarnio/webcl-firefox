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

#include "WebCLLogger.h"

// Ensure vsnprintf is enabled on gcc:
#ifndef _BSD_SOURCE
#define _BSD_SOURCE
#endif

#undef _XOPEN_SOURCE
#define _XOPEN_SOURCE = 500

#ifndef _ISOC99_SOURCE
#define _ISOC99_SOURCE
#endif

// Prevent MSVC warnings about freopen
#define _CRT_SECURE_NO_WARNINGS

#include <cstdlib>
#include <cstdio>
#include <stdarg.h>


FILE* webcl_log_file = stderr;
int webcl_log_level = WEBCL_LOG_LEVEL_DEFAULT;

#ifdef WEBCL_LOG_TO_FILE
#include <ctime>
# ifndef WIN32
# include <cstring>
# include <cerrno>
# endif
#endif


#ifdef WIN32

#include "windows.h"

void webcl_init_logging ()
{
  static bool initialized = false;
  if (!initialized)
  {
    initialized = true; // Must set initialized here to prevent recursion.
    #ifdef WEBCL_LOG_TO_FILE
    if ((webcl_log_file = fopen (WEBCL_LOG_TO_FILE, "a")) == NULL)
    {
      AllocConsole();
      freopen("conout$", "w", stderr);
      webcl_log_file = stderr;
      D_PRINT ("Failed to open log file \"%s\".", WEBCL_LOG_TO_FILE);
    }
    else
    {
      time_t t = time(NULL);
      struct tm *tmp = localtime(&t);
      char timeStr[30] = {0};
      strftime (timeStr, 30, "%Y-%m-%d %M:%H:%S %Z", tmp);
      D_PRINT_RAW (" =============================================================================\n"
      "  WebCL log file opened %s.\n"
      " =============================================================================\n",
      timeStr);
    }
    #else //WEBCL_LOG_TO_FILE
    AllocConsole();
    freopen("conin$", "r", stdin);
    freopen("conout$", "w", stdout);
    freopen("conout$", "w", stderr);
    #endif //WEBCL_LOG_TO_FILE
  }
}

#else //WIN32

void webcl_init_logging ()
{
  static bool initialized = false;
  if (!initialized)
  {
    char* s = getenv("D_LOG_LEVEL");
    if (s)
    {
      webcl_log_level = atoi(s);
    }
    initialized = true; // Must set initialized here to prevent recursion.
    #ifdef WEBCL_LOG_TO_FILE
    if ((webcl_log_file = fopen (WEBCL_LOG_TO_FILE, "a")) == NULL)
    {
      webcl_log_file = stderr;
      D_PRINT ("Failed to open log file \"%s\": %s", WEBCL_LOG_TO_FILE, strerror(errno));
    }
    else
    {
      time_t t = time(NULL);
      struct tm *tmp = localtime(&t);
      char timeStr[30] = {0};
      strftime (timeStr, 30, "%Y-%m-%d %M:%H:%S %Z", tmp);
      D_PRINT_RAW (" =============================================================================\n"
      "  WebCL log file opened %s.\n"
      " =============================================================================\n",
      timeStr);
    }
    #endif //WEBCL_LOG_TO_FILE
  }
}

#endif //WIN32


#include "nsServiceManagerUtils.h"
#include "nsIConsoleService.h"
#include "nsStringAPI.h"
#include <cstdarg>

void webcl_log_to_browser_console (char const* message)
{
  if (!message)
    return;

  char const* title = "WebCL: ";
  size_t titleLen = strlen (title);
  size_t messageLen = strlen (message);
  char* titledMessage = (char*)malloc (titleLen + messageLen + 1);
  if (!titledMessage)
    return;

  strncpy (titledMessage, title, titleLen);
  strncat (titledMessage, message, messageLen);

  nsCOMPtr<nsIConsoleService> consoleService = do_GetService(NS_CONSOLESERVICE_CONTRACTID);
  if (!consoleService)
  {
    // Failed to get console service!
    return;
  }

  nsCString msg(titledMessage);
  consoleService->LogStringMessage(NS_ConvertUTF8toUTF16(message).get());
}


void webcl_log_to_browser_console_v (char const* format, ...)
{
  int initialSize = 128;  //Initial buffer size
  char* buf = (char*) malloc (initialSize);
  va_list ap;
  va_start (ap, format);
  int n = vsnprintf (buf, initialSize, format, ap);
  va_end (ap);
  if (n >= initialSize)
  {
    char* tmp = buf;
    buf = (char*) realloc (buf, n+1);
    if (!buf)
    {
      free (tmp);
      return;
    }
    va_start (ap, format);
    n = vsnprintf (buf, n, format, ap);
    va_end (ap);
  }
  if (n < 0)
  {
    // vsnprintf failed
    free (buf);
    return;
  }

  webcl_log_to_browser_console (buf);
  free (buf);
}


bool webcl_log_check_level (int level)
{
  return level <= webcl_log_level;
}
