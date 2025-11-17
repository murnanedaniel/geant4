# G4Types.hh

Fundamental type definitions for Geant4

## Overview

`G4Types.hh` defines the fundamental native types used throughout the Geant4 toolkit. It provides platform-independent type aliases that decouple Geant4 from specific library implementations, ensuring portability across different platforms and compilers. This header also defines DLL export/import macros for Windows platforms and Thread Local Storage (TLS) definitions for multi-threaded builds.

This is the most fundamental header in Geant4 - nearly every Geant4 class depends on these type definitions.

## Source Location

**Header:** `/home/user/geant4/source/global/management/include/G4Types.hh` (lines 1-96)

**Author:** G. Cosmo (CERN), 1995

## Type Definitions

### Fundamental Numeric Types

All fundamental types are defined using C++ type aliases to provide platform independence:

```cpp
using G4double  = double;    // Double-precision floating point (lines 83)
using G4float   = float;     // Single-precision floating point (lines 84)
using G4int     = int;       // Integer type (lines 85)
using G4bool    = bool;      // Boolean type (lines 86)
using G4long    = long;      // Long integer type (lines 87)
using G4complex = std::complex<G4double>;  // Complex number (lines 88)
```

### Special Types

**__void__** (line 93)
```cpp
class __void__;
```
Forward declaration of a void-type argument used in direct object persistency to define fake default constructors.

## Platform-Specific Macros

### Windows DLL Support (lines 40-72)

On Windows platforms (when `WIN32` is defined), several macros are defined for DLL support:

- **G4DLLEXPORT** - Mark symbols for export from DLL
- **G4DLLIMPORT** - Mark symbols for import from DLL
- **G4GLOB_DLL** - Export/import macro for global module
- **G4MTGLOB_DLL** - Export/import macro for multi-threaded global module

**Behavior:**
- When `G4LIB_BUILD_DLL` is defined and `G4MULTITHREADED` is NOT defined:
  - `G4DLLEXPORT` = `__declspec(dllexport)`
  - `G4DLLIMPORT` = `__declspec(dllimport)`
- When `G4GLOB_ALLOC_EXPORT` is defined:
  - `G4GLOB_DLL` = `__declspec(dllexport)`
  - `G4MTGLOB_DLL` = `__declspec(dllexport)`
- Otherwise:
  - `G4GLOB_DLL` = `__declspec(dllimport)`
  - `G4MTGLOB_DLL` = `__declspec(dllimport)`

On non-Windows platforms, all these macros are defined as empty.

### Compiler Warnings (lines 45)

On Windows, warning C4786 is disabled (identifier truncation in debug info):
```cpp
#pragma warning(disable : 4786)
```

## Thread Local Storage

The header includes `tls.hh` (line 78) which provides:

- **G4ThreadLocal** - Macro for thread-local variables
- **G4ThreadLocalStatic** - Macro for static thread-local variables

In multi-threaded builds (`G4MULTITHREADED` defined), these expand to `thread_local` or platform-specific equivalents. In sequential builds, they are empty or static.

## Dependencies

- **G4GlobalConfig.hh** (line 37) - Build configuration (not included if `G4GMAKE` is defined)
- **std::complex** (line 74) - C++ standard complex number support
- **tls.hh** (line 78) - Thread Local Storage definitions

## Usage Examples

### Basic Type Usage

```cpp
#include "G4Types.hh"

// Declare variables using Geant4 types
G4double energy = 10.0;      // Energy in default units
G4int particleCount = 100;   // Integer count
G4bool isAlive = true;       // Boolean flag
G4complex amplitude(1.0, 0.5); // Complex number

// These are equivalent to:
double energy = 10.0;
int particleCount = 100;
bool isAlive = true;
std::complex<double> amplitude(1.0, 0.5);
```

### Thread-Local Variables

```cpp
#include "G4Types.hh"

// Declare a thread-local counter
G4ThreadLocal G4int eventCounter = 0;

// In multi-threaded mode: each thread has its own copy
// In sequential mode: behaves as a regular variable
```

### DLL Export/Import (Windows)

```cpp
#include "G4Types.hh"

// Export a class from the global module DLL
class G4GLOB_DLL MyGlobalClass
{
public:
    void DoSomething();
};

// Export a function
extern G4GLOB_DLL void MyGlobalFunction();
```

## Best Practices

1. **Always use G4 types in Geant4 code:** Use `G4double`, `G4int`, etc. instead of native types for consistency
   ```cpp
   // Good
   G4double CalculateEnergy(G4double momentum);

   // Avoid
   double CalculateEnergy(double momentum);
   ```

2. **Include via globals.hh:** Most Geant4 source files should include `globals.hh` which includes `G4Types.hh`
   ```cpp
   #include "globals.hh"  // Includes G4Types.hh and other essentials
   ```

3. **Don't modify type definitions:** Never redefine these types - they ensure ABI compatibility

4. **Use G4complex for complex arithmetic:**
   ```cpp
   G4complex wavefunction(1.0, 0.0);
   G4double amplitude = std::abs(wavefunction);
   ```

## Common Pitfalls

1. **Mixing native and G4 types:**
   ```cpp
   // Problematic - mixing types
   void ProcessParticle(double energy, G4int id);

   // Better - consistent types
   void ProcessParticle(G4double energy, G4int id);
   ```

2. **Assuming specific type sizes:**
   ```cpp
   // Don't assume G4int is always 32-bit
   // Don't assume G4double is always 64-bit
   // Use std::numeric_limits if you need guarantees
   ```

3. **Platform-specific code without proper guards:**
   ```cpp
   // Wrong - using __declspec directly
   class __declspec(dllexport) MyClass {};

   // Correct - using Geant4 macros
   class G4GLOB_DLL MyClass {};
   ```

4. **Incorrect thread-local usage:**
   ```cpp
   // Wrong in multi-threaded mode - shared between threads
   static G4int counter = 0;

   // Correct - each thread has its own copy
   G4ThreadLocalStatic G4int counter = 0;
   ```

## Thread Safety

### Type Definitions
The type definitions themselves are compile-time constructs and are inherently thread-safe.

### Thread-Local Storage
When `G4MULTITHREADED` is defined:
- Variables declared with `G4ThreadLocal` have separate instances per thread
- Variables declared with `G4ThreadLocalStatic` are static within each thread's context
- This prevents data races on thread-specific data

### Sequential Mode
When `G4MULTITHREADED` is NOT defined:
- `G4ThreadLocal` expands to nothing
- `G4ThreadLocalStatic` expands to `static`
- Standard single-threaded behavior applies

## Platform Support

The header supports multiple platforms with specific handling for:

- **Windows (WIN32):** DLL export/import, MSVC-specific pragmas
- **Linux:** Standard C++11 thread_local support
- **macOS:** Clang and GCC support for thread_local
- **AIX:** IBM compiler support
- **Intel Compiler:** Version-specific TLS support

## Related Headers

- [globals.hh](globals.md) - Includes G4Types.hh along with other common headers
- [tls.hh](tls.md) - Thread Local Storage implementation details
- [G4String.hh](g4string.md) - String type based on std::string
- [templates.hh](templates.md) - Additional utility templates (sqr, swap functions)

## Version Information

**Introduced:** Geant4 1.0 (1995)
**Last Modified:** Ongoing updates for new platforms and compilers
**Stability:** Stable - fundamental interface rarely changes

## Notes

- This header is automatically included by `globals.hh`, so explicit inclusion is rarely needed
- The type aliases provide a layer of indirection that could theoretically allow changing underlying types, but in practice they have remained stable since Geant4's inception
- The `G4GlobalConfig.hh` dependency is generated by the build system and contains platform-specific configurations
- Thread local storage support varies by platform and compiler version - see `tls.hh` for detailed implementation
- The `__void__` class is used internally for ROOT I/O and should not be used in user code

## See Also

- [G4SystemOfUnits.hh](g4systemofunits.md) - Physical unit definitions
- [G4PhysicalConstants.hh](g4physicalconstants.md) - Physical constants
- [G4Version.hh](g4version.md) - Version information
- Geant4 User's Guide: Multi-threaded Applications
