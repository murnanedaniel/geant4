# G4LatticeReader

**File**: `source/processes/solidstate/phonon/include/G4LatticeReader.hh`

## Overview

G4LatticeReader parses lattice configuration files and velocity map tables, creating G4LatticeLogical objects with complete dispersion relation data. It handles file I/O, data parsing, and error checking for lattice property loading.

## Class Description

G4LatticeReader provides file parsing:

- **Configuration Files**: Reads `config.txt` with material parameters
- **Velocity Maps**: Loads dispersion relation tables (ω vs. k)
- **Direction Maps**: Loads group velocity direction data
- **Error Handling**: Validates file format and data consistency
- **Data Population**: Fills G4LatticeLogical with properties

**Note**: README states "This class will be moved to source/materials/ once Release 10.0 is deployed" (Lines 8-9, 29-30).

**Location**: `source/processes/solidstate/phonon/include/G4LatticeReader.hh:42`

## Constructor & Destructor

### Constructor

```cpp
G4LatticeReader(G4int vb = 0);
```

Creates lattice reader.

**Parameters**:
- `vb`: Verbosity level (default: 0 = quiet)

**Initialization**:
- Sets verbosity
- Initializes file stream pointer to nullptr
- Prepares internal buffers

**Location**: Line 44

### Destructor

```cpp
~G4LatticeReader();
```

Cleans up reader resources.

**Actions**:
- Closes any open files
- Releases file stream

**Location**: Line 45

## Configuration

### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int vb);
```

Sets verbosity for diagnostic messages.

**Parameters**:
- `vb`: Verbosity (0=quiet, 1=normal, 2=detailed)

**Location**: Line 47

## Main Method

### MakeLattice

```cpp
G4LatticeLogical* MakeLattice(const G4String& filepath);
```

Creates lattice from configuration file.

**Parameters**:
- `filepath`: Full path to config.txt

**Returns**: Pointer to newly created G4LatticeLogical, or nullptr on error

**Process**:
1. Opens configuration file
2. Parses header and parameters
3. Reads dynamical constants
4. Loads velocity map files
5. Populates G4LatticeLogical object
6. Returns lattice pointer

**Example**:
```cpp
G4LatticeReader reader(1);  // Verbosity 1
G4String path = std::getenv("G4LATTICEDATA");
path += "/Ge/config.txt";

G4LatticeLogical* lattice = reader.MakeLattice(path);
if (lattice) {
    // Use lattice
}
```

**Location**: Line 49

## Protected Methods

### OpenFile

```cpp
protected:
G4bool OpenFile(const G4String& filepath);
```

Opens configuration file for reading.

**Parameters**:
- `filepath`: File to open

**Returns**: `true` if successful, `false` on error

**Actions**:
- Creates std::ifstream
- Sets file position to beginning
- Checks for read errors

**Location**: Line 52

### ProcessToken

```cpp
protected:
G4bool ProcessToken();
```

Reads and processes next token from configuration file.

**Returns**: `true` if successful, `false` if error or EOF

**Token Types**:
- Parameter names (e.g., "dyn", "scat", "LDOS")
- Filenames (for velocity maps)
- Numerical values

**Location**: Line 53

### ProcessValue

```cpp
protected:
G4bool ProcessValue(const G4String& name);
```

Processes numerical parameter value.

**Parameters**:
- `name`: Parameter name

**Returns**: `true` if successful

**Handled Parameters**:
- Scalar values (LDOS, STDOS, FTDOS)
- Vector values (positions, dimensions)

**Location**: Line 54

### ProcessConstants

```cpp
protected:
G4bool ProcessConstants();
```

Processes dynamical constants (4 values).

**Returns**: `true` if successful

**Constants**: Four material-specific constants:
- Anharmonic coupling parameters
- Deformation potentials
- Elastic constants

**Format in file**:
```
dyn 0.141e12 0.141e12 0.366e12 0.366e12
```

**Location**: Line 55

### ProcessMap

```cpp
protected:
G4bool ProcessMap();
```

Processes velocity map file reference.

**Returns**: `true` if successful

**Actions**:
1. Reads map filename
2. Reads polarization code
3. Calls ReadMapInfo() to load data
4. Associates map with correct polarization

**Format in file**:
```
FT FT_map.ssv
ST ST_map.ssv
L L_map.ssv
```

**Location**: Line 56

### ProcessNMap

```cpp
protected:
G4bool ProcessNMap();
```

Processes direction (normal) vector map file.

**Returns**: `true` if successful

**Purpose**: Group velocity direction data (for anisotropic crystals).

**Note**: Not all lattice files include direction maps (often assume isotropic).

**Location**: Line 57

### ReadMapInfo

```cpp
protected:
G4bool ReadMapInfo();
```

Reads velocity map data from .ssv file.

**Returns**: `true` if successful

**File Format** (.ssv - Space Separated Values):
```
# kx [1/m]     ky [1/m]     velocity [m/s]
0.0           0.0          5400.0
1.0e8         0.0          5380.0
...
```

**Process**:
1. Opens map file
2. Parses grid dimensions
3. Reads velocity values
4. Populates 2D velocity table
5. Closes map file

**Location**: Line 58

### SkipComments

```cpp
protected:
G4bool SkipComments();
```

Advances file pointer past comment lines.

**Returns**: `true` if successful

**Comment Format**: Lines starting with '#'

**Usage**: Called before reading each data line.

**Location**: Line 59

### CloseFile

```cpp
protected:
void CloseFile();
```

Closes currently open file.

**Actions**:
- Closes ifstream
- Resets file pointer
- Clears internal buffers

**Location**: Line 60

## Private Data Members

### Verbosity

```cpp
private:
G4int verboseLevel;  // Line 63
```

Controls diagnostic output.

### File Stream

```cpp
private:
std::ifstream* psLatfile;  // Line 65
```

Input file stream for reading configuration.

### Lattice Under Construction

```cpp
private:
G4LatticeLogical* pLattice;  // Line 66
```

Pointer to lattice being populated (not owned by reader).

### Path Information

```cpp
private:
G4String fMapPath;  // Line 68
```

Directory path where config file was found (used to locate map files).

### Parsing Buffers

```cpp
private:
G4String fToken;   // Line 69: Current token
G4double fValue;   // Line 70: Current numerical value
G4String fMap;     // Line 71: Map filename
G4String fsPol;    // Line 71: Polarization string
G4int fPol;        // Line 72: Polarization code (0,1,2)
G4int fNX, fNY;    // Line 72: Map grid dimensions
```

Reusable buffers for file parsing.

### Data Directory

```cpp
private:
static const G4String fDataDir;  // Line 74
```

Path to $G4LATTICEDATA environment variable.

**Default**: "./CrystalMaps" if environment variable not set.

## Configuration File Format

### Main Configuration (config.txt)

```
# Germanium crystal lattice
# All SI units

# Dynamical constants [Pa]
dyn 0.141e12 0.141e12 0.366e12 0.366e12

# Scattering parameters [s/m^4]
scat 3.67e-41 0 0 0

# Decay parameters [s^3]
decay 1.6e-54 0 0 0

# Density of states [s^3]
LDOS 0.0000093451
STDOS 0.0000093451
FTDOS 0.0000093451

# Velocity map files
FT FT_map.ssv
ST ST_map.ssv
L L_map.ssv
```

### Velocity Map Files (.ssv)

```
# Fast Transverse phonon dispersion for Ge
# kx [1/m]    ky [1/m]    velocity [m/s]
0.000000e+00  0.000000e+00  3420.000
1.000000e+07  0.000000e+00  3418.500
2.000000e+07  0.000000e+00  3415.200
...
```

**Grid**: Typically 100×100 to 200×200 points in k-space

**Coverage**: First Brillouin zone boundary

## Error Handling

### File Not Found

```cpp
if (!OpenFile(filepath)) {
    G4cerr << "G4LatticeReader: Cannot open " << filepath << G4endl;
    return nullptr;
}
```

### Invalid Format

```cpp
if (!ProcessToken()) {
    G4cerr << "G4LatticeReader: Parse error in " << filepath << G4endl;
    CloseFile();
    return nullptr;
}
```

### Missing Map Files

```cpp
if (!ReadMapInfo()) {
    G4cerr << "G4LatticeReader: Cannot read map " << fMap << G4endl;
    return nullptr;
}
```

## Usage Example

```cpp
#include "G4LatticeReader.hh"

// Create reader
G4LatticeReader reader;
reader.SetVerboseLevel(1);

// Get data directory
G4String dataPath = std::getenv("G4LATTICEDATA");
if (!dataPath) {
    dataPath = "./CrystalMaps";  // Default
}

// Load Germanium lattice
G4String configFile = dataPath + "/Ge/config.txt";
G4LatticeLogical* geLattice = reader.MakeLattice(configFile);

if (geLattice) {
    G4cout << "Successfully loaded Ge lattice" << G4endl;

    // Query properties
    G4double ldos = geLattice->GetLDOS();
    G4cout << "L density of states: " << ldos << " s^3" << G4endl;

    // Use with G4LatticeManager
    G4Material* Ge = ...;
    G4LatticeManager::GetLatticeManager()->RegisterLattice(Ge, geLattice);
} else {
    G4cerr << "Failed to load lattice!" << G4endl;
}
```

## Data Generation

Lattice files typically created using:

**Ab Initio Calculations**:
- Density Functional Theory (DFT)
- VASP, Quantum ESPRESSO, ABINIT
- Phonopy for post-processing

**Empirical Models**:
- Debye model (simple approximation)
- Born-von Karman models
- Force constant fitting to experiments

**Experimental Data**:
- Neutron scattering measurements
- Raman/Brillouin spectroscopy
- Ultrasonic measurements

## Performance Notes

**File Reading**: Slow (I/O bound)
- Configuration file: ~1 ms
- Each velocity map: ~10-100 ms (depending on grid size)
- Total lattice loading: ~100-500 ms

**Recommendation**: Load lattices once at initialization, not per event.

**Memory**: Moderate
- Velocity maps: ~100 KB to 1 MB per polarization
- Total per material: ~300 KB to 3 MB

## See Also

- [G4LatticeManager](g4latticemanager.md) - Uses reader to load lattices
- [G4VPhononProcess](g4vphononprocess.md) - Uses lattice data
- G4LatticeLogical - Populated by reader
- G4LatticePhysical - Oriented version
