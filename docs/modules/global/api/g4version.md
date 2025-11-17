# G4Version.hh

Geant4 version identification and build information

## Overview

`G4Version.hh` provides compile-time and runtime version information for Geant4. It defines macros and variables that identify the specific Geant4 version, development cycle, build configuration (single-threaded vs. multi-threaded), and release date. This information is essential for ensuring version compatibility, debugging, and tracking which Geant4 version was used in simulations.

Version information is critical for reproducibility in scientific computing - knowing the exact Geant4 version allows others to reproduce simulation results.

## Source Location

**Header:** `/home/user/geant4/source/global/management/include/G4Version.hh` (lines 1-78)

**Author:** K. Murakami, 26.09.2005

## Version Identification Macros

### G4VERSION_NUMBER (lines 45-47)

```cpp
#ifndef G4VERSION_NUMBER
  #define G4VERSION_NUMBER 1140
#endif
```

**Type:** Preprocessor macro (integer)

**Description:** Integral value representing the current Geant4 version in a consecutive numbering scheme.

**Numbering Format:**
```
    1 1 4 0
    | | | |
    | | | +-- Patch number (single digit)
    | | +---- Minor version number (single digit)
    | +------ Major version number (up to two digits)
    +---------
```

**Example Interpretations:**
- `1140` = Version 11.4.0
- `1141` = Version 11.4.1 (patch 1)
- `1020` = Version 10.2.0
- `711` = Version 7.1.1

**Usage:**
```cpp
#if G4VERSION_NUMBER >= 1100
    // Code for Geant4 11.0 and later
#else
    // Legacy code for older versions
#endif
```

### G4VERSION_REFERENCE_TAG (lines 57-59)

```cpp
#ifndef G4VERSION_REFERENCE_TAG
  #define G4VERSION_REFERENCE_TAG 00
#endif
```

**Type:** Preprocessor macro (integer)

**Description:** Indicates the current development cycle or release status.

**Values:**
- `-1` : Official release (the version can be read from `G4VERSION_NUMBER`)
- `0-11` : Development version, incremented monthly during development cycle
  - `0` = December (start of new development cycle)
  - `1` = January
  - `2` = February
  - ...
  - `11` = November

**Usage:**
```cpp
#if G4VERSION_REFERENCE_TAG == -1
    // This is a release build
#else
    // This is a development build
    // Month: G4VERSION_REFERENCE_TAG (0=Dec, 1=Jan, etc.)
#endif
```

### G4VERSION_TAG (lines 61-63)

```cpp
#ifndef G4VERSION_TAG
  #define G4VERSION_TAG "$Name: geant4-11-04-beta-01 $"
#endif
```

**Type:** String macro

**Description:** String identifier for the version, following CVS/Git tag format.

**Format:** `"$Name: geant4-<major>-<minor>-<status>-<patch> $"`

**Examples:**
- `"$Name: geant4-11-04-beta-01 $"` - Beta release 11.4.0
- `"$Name: geant4-11-03-ref-06 $"` - Reference tag 6 of 11.3
- `"$Name: geant4-11-02 $"` - Official release 11.2.0

## Runtime Version Variables

### G4Version (lines 70-74)

```cpp
#ifdef G4MULTITHREADED
static const G4String G4Version = "$Name: geant4-11-04-beta-01 [MT]$";
#else
static const G4String G4Version = "$Name: geant4-11-04-beta-01 $";
#endif
```

**Type:** `const G4String` (static)

**Description:** Runtime version string that includes multi-threading information.

**Features:**
- Automatically includes `[MT]` suffix for multi-threaded builds
- Can be printed at runtime to identify build configuration
- Useful for log files and version reporting

**Usage:**
```cpp
G4cout << "Geant4 Version: " << G4Version << G4endl;
// Output: "Geant4 Version: $Name: geant4-11-04-beta-01 [MT]$"
```

### G4Date (line 75)

```cpp
static const G4String G4Date = "(26-June-2025)";
```

**Type:** `const G4String` (static)

**Description:** Release or build date for this version.

**Format:** `"(DD-Month-YYYY)"`

**Usage:**
```cpp
G4cout << "Release Date: " << G4Date << G4endl;
// Output: "Release Date: (26-June-2025)"
```

## Usage Examples

### Compile-Time Version Checking

```cpp
#include "G4Version.hh"

// Conditional compilation based on version
#if G4VERSION_NUMBER >= 1100
    // Use features available in Geant4 11.0+
    void UseNewFeature() {
        // New API calls
    }
#else
    // Fallback for older versions
    void UseNewFeature() {
        // Legacy implementation
    }
#endif
```

### Detecting Development vs. Release

```cpp
#include "G4Version.hh"

void CheckBuildType() {
#if G4VERSION_REFERENCE_TAG == -1
    G4cout << "Running official release version" << G4endl;
#else
    G4cout << "Running development version" << G4endl;
    G4cout << "Reference tag month: " << G4VERSION_REFERENCE_TAG << G4endl;
#endif
}
```

### Runtime Version Reporting

```cpp
#include "G4Version.hh"
#include "globals.hh"

void PrintVersionInfo() {
    G4cout << "========================================" << G4endl;
    G4cout << " Geant4 Version Information" << G4endl;
    G4cout << "========================================" << G4endl;
    G4cout << "Version: " << G4Version << G4endl;
    G4cout << "Date:    " << G4Date << G4endl;

#ifdef G4MULTITHREADED
    G4cout << "Build:   Multi-threaded" << G4endl;
#else
    G4cout << "Build:   Sequential" << G4endl;
#endif

    G4cout << "Version Number: " << G4VERSION_NUMBER << G4endl;
    G4cout << "========================================" << G4endl;
}
```

### Version Compatibility Checking

```cpp
#include "G4Version.hh"
#include "G4Exception.hh"

void CheckMinimumVersion() {
    const G4int MINIMUM_VERSION = 1100;  // Require 11.0.0 or later

    if (G4VERSION_NUMBER < MINIMUM_VERSION) {
        G4Exception("CheckMinimumVersion()",
                    "VERSION001",
                    FatalException,
                    "This application requires Geant4 11.0 or later!");
    }
}
```

### Logging Version Information

```cpp
#include "G4Version.hh"
#include <fstream>

void WriteSimulationHeader(const G4String& filename) {
    std::ofstream logFile(filename);

    logFile << "Simulation Log File\n";
    logFile << "===================\n\n";
    logFile << "Geant4 Version: " << G4Version << "\n";
    logFile << "Release Date: " << G4Date << "\n";
    logFile << "Version Code: " << G4VERSION_NUMBER << "\n";

#ifdef G4MULTITHREADED
    logFile << "Threading: Multi-threaded\n";
#else
    logFile << "Threading: Sequential\n";
#endif

    logFile << "\nSimulation Parameters:\n";
    // ... rest of configuration
}
```

### Version-Specific Bug Workarounds

```cpp
#include "G4Version.hh"

void ProcessData() {
#if G4VERSION_NUMBER < 1130
    // Workaround for issue in versions before 11.3
    ApplyLegacyMethod();
#else
    // Use corrected implementation
    ApplyNewMethod();
#endif
}
```

### Extracting Version Components

```cpp
#include "G4Version.hh"

void ParseVersion() {
    G4int versionNumber = G4VERSION_NUMBER;

    G4int patch = versionNumber % 10;
    versionNumber /= 10;
    G4int minor = versionNumber % 10;
    versionNumber /= 10;
    G4int major = versionNumber;

    G4cout << "Geant4 Version: "
           << major << "."
           << minor << "."
           << patch << G4endl;
}
```

### Build Configuration Detection

```cpp
#include "G4Version.hh"

class SimulationConfig {
public:
    static G4bool IsMultiThreaded() {
#ifdef G4MULTITHREADED
        return true;
#else
        return false;
#endif
    }

    static G4bool IsRelease() {
#if G4VERSION_REFERENCE_TAG == -1
        return true;
#else
        return false;
#endif
    }

    static G4String GetVersionString() {
        return G4Version;
    }

    static G4int GetVersionNumber() {
        return G4VERSION_NUMBER;
    }
};
```

## Best Practices

1. **Always log version information:**
   ```cpp
   // At application startup
   G4cout << "Starting simulation with " << G4Version << G4endl;
   ```

2. **Check version for critical features:**
   ```cpp
   #if G4VERSION_NUMBER < 1100
   #error "This code requires Geant4 11.0 or later"
   #endif
   ```

3. **Use version checking for compatibility:**
   ```cpp
   // Support multiple versions
   #if G4VERSION_NUMBER >= 1140
       UseOptimizedImplementation();
   #else
       UseLegacyImplementation();
   #endif
   ```

4. **Document version requirements:**
   ```cpp
   // In documentation or README:
   // This application requires Geant4 11.0 or later
   // Tested with Geant4 11.4.0
   ```

5. **Include version in output files:**
   ```cpp
   // Write version to data files for reproducibility
   rootFile->WriteObject(&G4Version, "Geant4Version");
   rootFile->WriteObject(&G4Date, "Geant4Date");
   ```

## Common Pitfalls

1. **Incorrect version number interpretation:**
   ```cpp
   // WRONG - treating as decimal
   // if (G4VERSION_NUMBER > 11.4) { ... }  // Won't compile

   // CORRECT - it's an integer
   if (G4VERSION_NUMBER >= 1140) { ... }
   ```

2. **Not checking version for new features:**
   ```cpp
   // Risky - feature may not exist in all versions
   UseNewFeature();  // Might fail on older versions

   // Better - check version
   #if G4VERSION_NUMBER >= 1140
       UseNewFeature();
   #endif
   ```

3. **Hardcoding version checks:**
   ```cpp
   // Fragile - exact version match
   #if G4VERSION_NUMBER == 1140
       // Only works with 11.4.0
   #endif

   // Better - range check
   #if G4VERSION_NUMBER >= 1140 && G4VERSION_NUMBER < 1200
       // Works with all 11.4.x versions
   #endif
   ```

4. **Ignoring threading mode:**
   ```cpp
   // Incomplete version info
   G4cout << "Version: " << G4VERSION_NUMBER << G4endl;

   // Better - include threading mode
   G4cout << "Version: " << G4Version << G4endl;  // Includes [MT]
   ```

5. **Not documenting version dependencies:**
   ```cpp
   // Missing documentation
   void UseAdvancedFeature() {
       // Uses features from 11.3+, but not documented
   }

   // Better
   /// @brief Uses advanced feature (requires Geant4 11.3+)
   void UseAdvancedFeature() {
       #if G4VERSION_NUMBER < 1130
       #error "Requires Geant4 11.3 or later"
       #endif
   }
   ```

## Thread Safety

**Thread-Safe:** Yes

All version macros and variables are:
- **Macros:** Compile-time constants (no runtime state)
- **Variables:** Read-only static strings
- **Concurrent access:** Safe from multiple threads

No synchronization needed when reading version information.

## Version Number History

**Evolution of numbering:**
- Geant4 1.0 → 3.x: Three-digit format (e.g., 310)
- Geant4 4.x → 9.x: Three-digit format (e.g., 910)
- Geant4 10.x+: Four-digit format to accommodate two-digit major versions (e.g., 1020)
- Geant4 11.x: Current format (e.g., 1140)

**Release Cycles:**
- Major releases: ~Yearly (incrementing major version)
- Minor releases: ~2-3 times per year
- Patch releases: As needed for critical bug fixes
- Development cycle: Monthly reference tags between releases

## Build System Integration

The version information can be set by the build system:

```cmake
# In CMake
add_definitions(-DG4VERSION_NUMBER=1140)
add_definitions(-DG4VERSION_REFERENCE_TAG=-1)
```

**Note:** The `#ifndef` guards allow override at compile time while providing defaults.

## Reproducibility Considerations

For scientific reproducibility, always record:

1. **Full version string:** `G4Version` (includes MT flag)
2. **Version number:** `G4VERSION_NUMBER`
3. **Release date:** `G4Date`
4. **Reference tag:** `G4VERSION_REFERENCE_TAG` (if development version)
5. **Build configuration:** Compiler, optimization level, etc.

**Example metadata:**
```
Geant4 Version: $Name: geant4-11-04-beta-01 [MT]$
Version Number: 1140
Release Date: (26-June-2025)
Reference Tag: 00
Compiler: GCC 11.3.0
Build Type: Release
```

## Related Headers

- [globals.hh](globals.md) - Master global definitions header
- [G4Types.hh](g4types.md) - Type definitions (G4String used here)
- Build system configuration files

## Version Information

**Introduced:** Geant4 7.0 (September 2005)
**Purpose:** Standardize version identification across toolkit
**Stability:** Stable - format unchanged since introduction

## Notes

- Version macros use `#ifndef` guards to allow override by build system
- The `$Name: ... $` format is a legacy from CVS version control but is still used
- Multi-threaded builds automatically append `[MT]` to version string
- Reference tag of `-1` specifically indicates an official release
- Monthly reference tags during development help track intermediate versions
- Version information is critical for bug reports and support requests
- Always include version information in simulation logs and output files
- The version number format allows simple integer comparison for version checking
- Some Geant4 data files may have version dependencies - check compatibility

## See Also

- [globals.hh](globals.md) - Main global definitions
- [G4Types.hh](g4types.md) - Type definitions
- Geant4 Release Notes
- Geant4 Installation Guide
- Geant4 Version History and Release Notes
- CMake Build Configuration
