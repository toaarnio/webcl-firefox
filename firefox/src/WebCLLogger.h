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

#ifndef _WEBCLLOGGER_H_
#define _WEBCLLOGGER_H_

#include <cstdlib>
#include <cstdio>

// Logging-related functionality:

/* Log levels:
 *   0: none
 *   1: errors
 *   2: warnings
 *   3: info
 *   4: debug
 *   >4: all (reserved)
 */
#define LOG_LEVEL_NONE      0
#define LOG_LEVEL_ERROR     1
#define LOG_LEVEL_WARNING   2
#define LOG_LEVEL_INFO      3
#define LOG_LEVEL_DEBUG     4

#ifndef WEBCL_LOG_LEVEL_DEFAULT
# define WEBCL_LOG_LEVEL_DEFAULT 1
#endif

extern FILE* webcl_log_file;  // default: stderr or WEBCL_LOG_TO_FILE
extern int webcl_log_level;   // default: WEBCL_LOG_LEVEL_DEFAULT

// INTERNAL
void webcl_log_to_browser_console (char const* message);
void webcl_log_to_browser_console_v (char const* format, ...);

/** This INTERNAL FUNCTION handles logging system initialization. */
void webcl_init_logging ();
/** This INTERNAL FUNCTION performs logging level checks. */
bool webcl_log_check_level (int level);

#ifdef WEBCL_ENABLE_LOG

/**
 * \fn D_PRINT_RAW(...)
 * A variadic macro for printing arbitrary text to log output. In operation
 * only if logging is enabled.
 */
#  define D_PRINT_RAW(...) do{ \
  webcl_init_logging(); \
  fprintf(webcl_log_file, __VA_ARGS__);fflush(webcl_log_file);\
  /*webcl_log_to_browser_console_v (__VA_ARGS__);*/ \
}while(0)

/** \fn D_PRINT(fmt, ...)
 * A variadic macro for printing arbitrary text with source line information
 * to log output. In operation only if logging is enabled.
 * \param fmt Format argument similar to printf.
 * \see printf
 */
# ifdef WIN32
#  define D_PRINT(...) do{D_PRINT_RAW(" # # # [%s:%-4d] ", __FILE__, __LINE__, __VA_ARGS__); \
D_PRINT_RAW(__VA_ARGS__); D_PRINT_RAW("\n");}while(0)
# else
#  define D_PRINT(fmt, ...) D_PRINT_RAW(" # # # [%s:%-4d] " fmt "\n", \
__FILE__, __LINE__, ##__VA_ARGS__)
# endif /* WIN32 */


/** \fn D_LOG(lev, fmt, ...)
 * A variadic macro for printing log messages to log output webcl_log_file.
 * The message is sent to output if the value of \c lev is lower than
 * the current logging level.
 * In operation only if logging is enabled.
 * \param lev Logging level assigned to the following message.
 * \param fmt Format argument similar to printf.
 * \see webcl_log_file
 * \see webcl_log_level
 * \see printf
 */
#  ifdef WIN32
#   define D_LOG(lev, ...) do{if(webcl_log_check_level(lev)){ \
D_PRINT_RAW(" ##LOG## [%s:%-4d %s] ", __FILE__, __LINE__,__FUNCTION__); \
D_PRINT_RAW(__VA_ARGS__); D_PRINT_RAW("\n");}}while(0)
#  else
#   define D_LOG(lev, fmt, ...) do{if(webcl_log_check_level(lev)){ \
D_PRINT_RAW(" ##LOG## [%s:%-4d %s] "\
fmt "\n", __FILE__, __LINE__,\
__FUNCTION__, ##__VA_ARGS__);}}while(0)
#  endif /* WIN32 */

#else //WEBCL_ENABLE_LOG
# define D_PRINT_RAW(...) do{}while(0)
# define D_PRINT(...) do{}while(0)
# define D_LOG(...) do{}while(0)
#endif //WEBCL_ENABLE_LOG


/** \fn D_METHOD_START
 * This macro marks the beginning of generally important function calls.
 * Used for runtime function call tracing to log.
 */
#ifdef WEBCL_TRACE_FUNCTIONS
# define D_METHOD_START D_PRINT_RAW(" ##LOG## [%s:%-4d] ============ Entering function %s ============\n", \
__FILE__, __LINE__,__FUNCTION__)
#else //DWEBCL_TRACE_FUNCTIONS
# define D_METHOD_START do{}while(0)
#endif //DWEBCL_TRACE_FUNCTIONS

#if 0
/** \fn D_TRACE_ALLOC
 * This macro is used for logging dynamic memory allocation.
 * \fn D_TRACK_RELEASE
 * This macro is used for logging releasing of dynamically allocated memory.
 */
#ifdef WEBCL_TRACE_ALLOCS
# define D_TRACE_ALLOC(bytes,type,p) D_PRINT_RAW(" ##LOG## [%s:%-4d %s]  ALLOC  %ld bytes in (" #type "*)%p\n", \
__FILE__, __LINE__,__FUNCTION__, bytes, type, p)
# define D_TRACE_RELEASE(type,p) D_PRINT_RAW(" ##LOG## [%s:%-4d %s]  RELEASE  (" #type "*)%p\n", \
__FILE__, __LINE__,__FUNCTION__, type, p)
#else //WEBCL_TRACK_ALLOCS
# define D_TRACK_ALLOC do{}while(0)
# define D_TRACK_RELEASE do{}while(0)
#endif //WEBCL_TRACK_ALLOCS
#endif


#endif //_WEBCLLOGGER_H_
