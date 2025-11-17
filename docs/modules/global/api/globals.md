# globals.hh

Master header for common Geant4 global definitions

## Overview

`globals.hh` is the master header file that provides a single include point for the most commonly used global definitions in Geant4. It aggregates fundamental type definitions, string handling, utility templates, I/O streams, exception handling, and environment utilities. This header is designed to be included in nearly every Geant4 source file to provide essential functionality.

Including `globals.hh` is the standard way to access basic Geant4 types and utilities without needing to include multiple individual headers.

## Source Location

**Header:** `/home/user/geant4/source/global/management/include/globals.hh` (lines 1-62)

**Author:** P. Kent, 30.06.1995 (Created)
**Revisions:** G. Cosmo, 1996-present

## What globals.hh Includes

The header aggregates the following essential components:

### 1. I/O Streams (line 35)
```cpp
#include "G4ios.hh"
```
Provides Geant4-specific I/O stream definitions and manipulators for formatted output.

### 2. Boolean Constants (lines 37-42)
```cpp
#ifndef FALSE
#  define FALSE 0
#endif
#ifndef TRUE
#  define TRUE 1
#endif
```
Legacy boolean constants for compatibility. **Note:** Use C++ `true`/`false` in new code.

### 3. Algorithm Utilities (line 44)
```cpp
#include <algorithm>
```
Standard C++ algorithms including `std::min`, `std::max`, `std::sort`, etc.

### 4. Fundamental Types (line 47)
```cpp
#include "G4Types.hh"
```
Core type definitions: `G4double`, `G4int`, `G4bool`, `G4long`, `G4float`, `G4complex`.

See: [G4Types.hh](g4types.md)

### 5. String Handling (line 50)
```cpp
#include "G4String.hh"
```
Geant4 string type (based on `std::string`) with additional utilities.

### 6. Template Utilities (line 53)
```cpp
#include "templates.hh"
```
Provides utility templates and constants:
- `sqr(x)` - Square function
- `G4SwapPtr()` - Pointer swap
- `G4SwapObj()` - Object swap
- `G4ConsumeParameters()` - Suppress unused parameter warnings
- `G4lrint()` - Long integer rounding
- Numeric limits: `DBL_MIN`, `DBL_MAX`, `FLT_MIN`, `FLT_MAX`, `INT_MAX`, etc.

### 7. Error Handling (line 56)
```cpp
#include "G4Exception.hh"
```
Global error and exception handling mechanism for reporting errors, warnings, and fatal exceptions.

### 8. Environment Utilities (line 59)
```cpp
#include "G4EnvironmentUtils.hh"
```
Cross-platform utilities for accessing environment variables and system information.

## Usage Examples

### Basic Usage

```cpp
// In most Geant4 source files
#include "globals.hh"

// Now you have access to:
// - G4double, G4int, G4bool, etc.
// - G4String
// - G4cout, G4cerr
// - G4Exception
// - std::min, std::max, etc.

class MyDetectorConstruction
{
public:
    G4VPhysicalVolume* Construct();

private:
    G4double fWorldSize;
    G4String fMaterialName;
    G4int fVerboseLevel;
};
```

### Using Included Types

```cpp
#include "globals.hh"

void ProcessParticle(G4double energy, G4int pdgCode)
{
    // G4double and G4int from G4Types.hh
    G4String particleName = "electron";  // G4String

    // Output using G4cout from G4ios.hh
    G4cout << "Processing " << particleName
           << " with energy " << energy << G4endl;

    // Using std::min from <algorithm>
    G4double maxEnergy = 1000.0;
    G4double limited = std::min(energy, maxEnergy);
}
```

### Error Handling

```cpp
#include "globals.hh"

void ValidateEnergy(G4double energy)
{
    // G4Exception from G4Exception.hh
    if (energy < 0.0) {
        G4Exception("ValidateEnergy()",
                    "ENERGY001",
                    FatalException,
                    "Energy cannot be negative!");
    }

    if (energy < 1.0) {
        G4Exception("ValidateEnergy()",
                    "ENERGY002",
                    JustWarning,
                    "Energy is very low.");
    }
}
```

### Using Template Utilities

```cpp
#include "globals.hh"

void DemonstrateutilityTemplates()
{
    // sqr() from templates.hh
    G4double x = 5.0;
    G4double x2 = sqr(x);  // 25.0

    // Swap pointers
    G4int* ptr1 = new G4int(10);
    G4int* ptr2 = new G4int(20);
    G4SwapPtr(ptr1, ptr2);  // Now ptr1 points to 20, ptr2 to 10

    // Numeric limits
    G4double maxDouble = DBL_MAX;
    G4double minDouble = DBL_MIN;
    G4int maxInt = INT_MAX;
}
```

### Conditional Compilation

```cpp
#include "globals.hh"

void SomeFunction(G4int unusedParam)
{
#ifdef USE_FEATURE
    DoSomethingWith(unusedParam);
#else
    // Suppress unused parameter warning
    G4ConsumeParameters(unusedParam);
#endif
}
```

### Using Algorithm Utilities

```cpp
#include "globals.hh"
#include <vector>

void ProcessEnergyList()
{
    std::vector<G4double> energies = {100.0, 50.0, 200.0, 75.0};

    // std::min_element from <algorithm>
    auto minIt = std::min_element(energies.begin(), energies.end());
    G4cout << "Minimum energy: " << *minIt << G4endl;

    // std::sort from <algorithm>
    std::sort(energies.begin(), energies.end());

    // std::max from <algorithm>
    G4double maxEnergy = std::max(100.0, 150.0);
}
```

### Environment Variables

```cpp
#include "globals.hh"

void ConfigureFromEnvironment()
{
    // Using G4EnvironmentUtils
    // Check if GEANT4_DATA_DIR is set
    char* dataDir = std::getenv("GEANT4_DATA_DIR");
    if (dataDir != nullptr) {
        G4String path = dataDir;
        G4cout << "Data directory: " << path << G4endl;
    }
}
```

## Best Practices

1. **Include globals.hh in source files:**
   ```cpp
   // In .cc files - standard practice
   #include "globals.hh"

   // In .hh files - only if you need G4String, G4 types
   // Prefer forward declarations when possible
   ```

2. **Include globals.hh before other Geant4 headers:**
   ```cpp
   // Good order
   #include "globals.hh"
   #include "G4VUserDetectorConstruction.hh"
   #include "G4Material.hh"

   // Also acceptable
   #include "G4VUserDetectorConstruction.hh"  // Will include globals
   ```

3. **Don't include individual headers if globals.hh provides them:**
   ```cpp
   // Redundant
   #include "globals.hh"
   #include "G4Types.hh"      // Already in globals.hh
   #include "G4String.hh"     // Already in globals.hh

   // Better
   #include "globals.hh"
   ```

4. **Use modern C++ instead of legacy macros:**
   ```cpp
   // Old style - avoid
   G4bool flag = TRUE;
   if (flag == FALSE) { ... }

   // Modern C++ - preferred
   G4bool flag = true;
   if (!flag) { ... }
   ```

5. **Prefer G4 types in Geant4 code:**
   ```cpp
   // Good - consistent with Geant4 style
   G4double CalculateEnergy(G4double momentum);

   // Less preferred in Geant4 context
   double CalculateEnergy(double momentum);
   ```

## Common Pitfalls

1. **Assuming globals.hh includes units:**
   ```cpp
   #include "globals.hh"

   // WRONG - units not included in globals.hh
   // G4double length = 10 * cm;  // ERROR: 'cm' undeclared

   // CORRECT - need to include units separately
   #include "globals.hh"
   #include "G4SystemOfUnits.hh"
   G4double length = 10 * cm;  // OK
   ```

2. **Using legacy TRUE/FALSE in new code:**
   ```cpp
   // Avoid
   G4bool result = TRUE;

   // Prefer
   G4bool result = true;
   ```

3. **Including globals.hh in headers when not needed:**
   ```cpp
   // In header file - may cause unnecessary dependencies
   // MyClass.hh
   #include "globals.hh"  // Might not be needed

   class MyClass {
       G4double GetValue();
   };

   // Better - forward declare or just use double
   class MyClass {
       double GetValue();
   };

   // In MyClass.cc
   #include "MyClass.hh"
   #include "globals.hh"
   ```

4. **Forgetting that globals.hh doesn't include everything:**
   ```cpp
   #include "globals.hh"

   // These are NOT included:
   // - G4SystemOfUnits.hh (units)
   // - G4PhysicalConstants.hh (constants)
   // - G4ThreeVector.hh (vectors)
   // - Most Geant4 classes

   // Must include them separately when needed
   ```

5. **Namespace conflicts:**
   ```cpp
   #include "globals.hh"

   // Be careful if you have your own min/max
   // std::min and std::max are already included

   // If you want to use your own:
   namespace MyNamespace {
       template<typename T>
       T min(T a, T b) { return (a < b) ? a : b; }
   }
   ```

## Thread Safety

**Thread-Safe:** Yes

All components included by `globals.hh` are thread-safe with proper usage:

- **Type definitions:** Thread-safe (compile-time)
- **Template functions:** Thread-safe (stateless)
- **G4Exception:** Thread-safe with proper error handling
- **I/O streams (G4cout, G4cerr):** Thread-safe in multi-threaded mode

**Notes:**
- In multi-threaded applications, each worker thread has its own G4cout buffer
- Shared state must still be protected by appropriate synchronization

## When to Include globals.hh

### Always Include:
- In `.cc` implementation files for Geant4 classes
- When you need basic G4 types (G4double, G4int, G4String)
- When you need G4Exception
- When you need G4cout/G4cerr for output

### Consider Not Including:
- In header files where forward declarations suffice
- In pure template headers with no Geant4-specific types
- In external utility code that doesn't use Geant4 types

### Include Additional Headers:
```cpp
#include "globals.hh"

// For units and constants:
#include "G4SystemOfUnits.hh"
#include "G4PhysicalConstants.hh"

// For specific functionality:
#include "G4ThreeVector.hh"
#include "G4RotationMatrix.hh"
// etc.
```

## What's NOT Included

Important headers that are **not** included by `globals.hh`:

- **G4SystemOfUnits.hh** - Physical units (include separately in .cc files)
- **G4PhysicalConstants.hh** - Physical constants (include separately)
- **G4ThreeVector.hh** - 3D vectors
- **G4RotationMatrix.hh** - Rotation matrices
- **G4Material.hh**, **G4Element.hh** - Material definitions
- Any specific Geant4 class headers

**Rationale:** Including too much in globals.hh would increase compilation time and create unnecessary dependencies.

## Compilation Impact

**Compilation Time:**
- `globals.hh` is designed to be lightweight
- Includes only frequently used, fundamental headers
- Avoiding including too many Geant4 class headers reduces compilation time

**Recommendations:**
- In header files: use forward declarations when possible
- In source files: include globals.hh and specific headers as needed
- For large projects: consider precompiled headers

## Historical Context

The `globals.hh` header has been part of Geant4 since version 1.0 (1995). Its design reflects the need for:

1. **Consistency:** Ensuring all Geant4 code uses the same fundamental types
2. **Portability:** Abstracting platform differences (Windows DLL exports, etc.)
3. **Convenience:** One-stop include for essential functionality
4. **Backward compatibility:** Supporting legacy code with TRUE/FALSE macros

Over time, some features (like TRUE/FALSE) have become legacy, but are retained for compatibility.

## Related Headers

- [G4Types.hh](g4types.md) - Fundamental type definitions (included)
- [G4SystemOfUnits.hh](g4systemofunits.md) - Physical units (NOT included, add separately)
- [G4PhysicalConstants.hh](g4physicalconstants.md) - Physical constants (NOT included)
- [G4String.hh](g4string.md) - String class (included)
- [G4ios.hh](g4ios.md) - I/O streams (included)
- [G4Exception.hh](g4exception.md) - Exception handling (included)
- [templates.hh](templates.md) - Utility templates (included)
- [G4EnvironmentUtils.hh](g4environmentutils.md) - Environment utilities (included)

## Version Information

**Introduced:** Geant4 1.0 (1995)
**Stability:** Very stable - core interface unchanged
**Evolution:** Content has been refined but backwards compatible

## Notes

- This is typically the first Geant4 header included in source files
- The header uses include guards to prevent multiple inclusion
- Some components (TRUE/FALSE macros) are legacy but maintained for compatibility
- The header is designed to compile quickly and not pull in heavy dependencies
- In multi-threaded builds, appropriate thread-safety mechanisms are automatically enabled
- The header structure has influenced other HEP software frameworks

## Migration from Old Code

If you have old Geant4 code (pre-version 10):

```cpp
// Old style
#include "globals.hh"
G4bool flag = TRUE;
if (condition == FALSE) { ... }

// Modern style
#include "globals.hh"
G4bool flag = true;
if (!condition) { ... }
```

## See Also

- [G4Types.hh](g4types.md) - Type definitions
- [G4SystemOfUnits.hh](g4systemofunits.md) - Units (include separately)
- [G4PhysicalConstants.hh](g4physicalconstants.md) - Constants (include separately)
- [G4Version.hh](g4version.md) - Version information
- Geant4 User's Guide: Getting Started
- Geant4 Application Developers Guide
