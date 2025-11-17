# G4ElementData

**File**: `source/materials/include/G4ElementData.hh`

## Overview

G4ElementData is a versatile data structure for storing element-dependent physics data in Geant4. It provides organized storage and access to cross sections, shell cross sections, and isotope cross sections indexed by atomic number (Z) and optionally by a secondary index (component ID). This class is commonly used throughout Geant4 physics processes to store tabulated cross section data.

## Class Description

G4ElementData manages vectors of physics data (G4PhysicsVector and G4Physics2DVector) organized by atomic number. It supports:

- **Element-level data**: Single vector per element (indexed by Z)
- **Component data**: Multiple vectors per element (e.g., per isotope or per shell)
- **1D and 2D data**: Both G4PhysicsVector and G4Physics2DVector
- **Flexible indexing**: Data access via Z and component ID
- **Runtime checking**: Optional parameter validation

**Location**: G4ElementData.hh:56

**Added**: Version 10.03.2011 by V. Ivanchenko

**Extended**: Version 30.09.2023 with configurable data size

## Constructor & Destructor

### Constructor

```cpp
explicit G4ElementData(G4int length = 99);
```

Creates an element data container with specified capacity.

**Parameters**:
- `length`: Maximum number of elements (default: 99)

**Location**: G4ElementData.hh:59

**Note**: The length typically corresponds to maximum Z value expected. Default of 99 covers elements up to Einsteinium.

### Destructor

```cpp
~G4ElementData();
```

Destroys the container and all owned physics vectors.

**Location**: G4ElementData.hh:61

### Deleted Copy Operations

```cpp
G4ElementData& operator=(const G4ElementData& right) = delete;
G4ElementData(const G4ElementData&) = delete;
```

Copy construction and assignment are explicitly disabled.

**Location**: G4ElementData.hh:64-65

## Initialization Methods

### InitialiseForElement (1D vector)

```cpp
void InitialiseForElement(G4int Z, G4PhysicsVector* v);
```

Adds a 1D physics vector for a specific element.

**Parameters**:
- `Z`: Atomic number (0 to length-1)
- `v`: Pointer to physics vector (ownership transferred to G4ElementData)

**Location**: G4ElementData.hh:68

**Usage**: For element-level cross sections or other 1D data.

### InitialiseForElement (2D vector)

```cpp
void InitialiseForElement(G4int Z, G4Physics2DVector* v);
```

Adds a 2D physics vector for a specific element.

**Parameters**:
- `Z`: Atomic number
- `v`: Pointer to 2D physics vector (ownership transferred)

**Location**: G4ElementData.hh:71

**Usage**: For data depending on two variables (e.g., energy and angle).

### InitialiseForComponent

```cpp
void InitialiseForComponent(G4int Z, G4int nComponents = 0);
```

Reserves storage for component data (e.g., per-isotope or per-shell data).

**Parameters**:
- `Z`: Atomic number
- `nComponents`: Expected number of components (0 = no reservation)

**Location**: G4ElementData.hh:74

**Note**: Call before adding components with AddComponent().

### InitialiseFor2DComponent

```cpp
void InitialiseFor2DComponent(G4int Z, G4int nComponents = 0);
```

Reserves storage for 2D component data.

**Parameters**:
- `Z`: Atomic number
- `nComponents`: Expected number of 2D components

**Location**: G4ElementData.hh:77

## Adding Component Data

### AddComponent

```cpp
void AddComponent(G4int Z, G4int id, G4PhysicsVector* v);
```

Adds a 1D component vector for an element.

**Parameters**:
- `Z`: Atomic number
- `id`: Component identifier (e.g., isotope A, shell number)
- `v`: Pointer to physics vector (ownership transferred)

**Location**: G4ElementData.hh:80

**Usage**: For isotope-specific cross sections or shell-specific data.

### Add2DComponent

```cpp
void Add2DComponent(G4int Z, G4int id, G4Physics2DVector* v);
```

Adds a 2D component vector for an element.

**Parameters**:
- `Z`: Atomic number
- `id`: Component identifier
- `v`: Pointer to 2D physics vector (ownership transferred)

**Location**: G4ElementData.hh:83

## Name Management

### SetName

```cpp
inline void SetName(const G4String& nam);
```

Sets a descriptive name for this data set.

**Parameters**:
- `nam`: Dataset name (e.g., "PhotonCrossSections")

**Location**: G4ElementData.hh:86

**Note**: Optional but helpful for debugging and identification.

### GetName

```cpp
inline const G4String& GetName() const;
```

Returns the dataset name.

**Location**: G4ElementData.hh:94

## Fast Access Methods (Unchecked)

These methods provide fast access without parameter validation. The caller is responsible for ensuring valid indices.

### GetElementData

```cpp
inline G4PhysicsVector* GetElementData(G4int Z) const;
```

Returns the 1D physics vector for an element.

**Parameters**:
- `Z`: Atomic number

**Returns**: Pointer to G4PhysicsVector, or nullptr if not set

**Location**: G4ElementData.hh:97

**Warning**: No bounds checking. Caller must ensure valid Z.

### GetElement2DData

```cpp
inline G4Physics2DVector* GetElement2DData(G4int Z) const;
```

Returns the 2D physics vector for an element.

**Parameters**:
- `Z`: Atomic number

**Returns**: Pointer to G4Physics2DVector, or nullptr if not set

**Location**: G4ElementData.hh:100

### GetComponentDataByID

```cpp
inline G4PhysicsVector* GetComponentDataByID(G4int Z, G4int id) const;
```

Returns a component vector by element and component ID.

**Parameters**:
- `Z`: Atomic number
- `id`: Component identifier

**Returns**: Pointer to G4PhysicsVector, or nullptr if not found

**Location**: G4ElementData.hh:103

**Usage**: Fast lookup when you know the component ID (e.g., isotope mass number).

### Get2DComponentDataByID

```cpp
inline G4Physics2DVector* Get2DComponentDataByID(G4int Z, G4int id) const;
```

Returns a 2D component vector by element and component ID.

**Location**: G4ElementData.hh:106

### GetValueForElement

```cpp
inline G4double GetValueForElement(G4int Z, G4double kinEnergy) const;
```

Returns cross section value for an element at given energy.

**Parameters**:
- `Z`: Atomic number
- `kinEnergy`: Kinetic energy

**Returns**: Cross section value

**Location**: G4ElementData.hh:109

**Note**: Calls Value() on the stored physics vector.

## Safe Access Methods (Checked)

These methods validate input parameters and may throw exceptions on error.

### GetNumberOfComponents

```cpp
inline std::size_t GetNumberOfComponents(G4int Z) const;
```

Returns the number of components for an element.

**Parameters**:
- `Z`: Atomic number

**Returns**: Number of components, or 0 if none

**Location**: G4ElementData.hh:116

### GetNumberOf2DComponents

```cpp
inline std::size_t GetNumberOf2DComponents(G4int Z) const;
```

Returns the number of 2D components for an element.

**Location**: G4ElementData.hh:119

### GetComponentID

```cpp
inline G4int GetComponentID(G4int Z, std::size_t idx) const;
```

Returns the component ID at a given index.

**Parameters**:
- `Z`: Atomic number
- `idx`: Component index (0 to GetNumberOfComponents-1)

**Returns**: Component ID, or 0 if invalid

**Location**: G4ElementData.hh:123

### GetComponentDataByIndex

```cpp
inline G4PhysicsVector* GetComponentDataByIndex(G4int Z, std::size_t idx) const;
```

Returns component vector by index rather than ID.

**Parameters**:
- `Z`: Atomic number
- `idx`: Component index

**Returns**: Pointer to G4PhysicsVector, or nullptr if invalid

**Location**: G4ElementData.hh:126-128

**Usage**: For iterating over all components when IDs are unknown.

### Get2DComponentDataByIndex

```cpp
inline G4Physics2DVector* Get2DComponentDataByIndex(G4int Z, std::size_t idx) const;
```

Returns 2D component vector by index.

**Location**: G4ElementData.hh:130-131

### GetValueForComponent

```cpp
inline G4double GetValueForComponent(G4int Z, std::size_t idx, G4double kinEnergy) const;
```

Returns cross section value for a component at given energy.

**Parameters**:
- `Z`: Atomic number
- `idx`: Component index
- `kinEnergy`: Kinetic energy

**Returns**: Cross section value, or 0.0 if invalid

**Location**: G4ElementData.hh:135-136

## Data Members

### Private Data

```cpp
const G4int maxNumElm;

std::vector<G4PhysicsVector*> elmData;
std::vector<G4Physics2DVector*> elm2Data;
std::vector<std::vector<std::pair<G4int, G4PhysicsVector*>>*> compData;
std::vector<std::vector<std::pair<G4int, G4Physics2DVector*>>*> comp2D;

G4String name{""};
```

**Location**: G4ElementData.hh:142-149

**Members**:
- `maxNumElm`: Maximum element capacity (set in constructor)
- `elmData`: Element-level 1D data vectors
- `elm2Data`: Element-level 2D data vectors
- `compData`: Component 1D data (vector of pairs: ID and vector)
- `comp2D`: Component 2D data
- `name`: Optional dataset name

## Usage Examples

### Simple Element Data

```cpp
#include "G4ElementData.hh"
#include "G4PhysicsVector.hh"

// Create container for photoelectric cross sections
G4ElementData* photoData = new G4ElementData();
photoData->SetName("PhotoelectricCrossSections");

// Add cross section for carbon (Z=6)
G4PhysicsVector* carbonXS = new G4PhysicsVector();
// ... fill vector with cross section data ...
photoData->InitialiseForElement(6, carbonXS);

// Later: retrieve and use the data
G4double energy = 10*keV;
G4double xs = photoData->GetValueForElement(6, energy);
```

### Isotope-Specific Data

```cpp
// Create container for isotope cross sections
G4ElementData* isotopeData = new G4ElementData();
isotopeData->SetName("NeutronCaptureCrossSections");

// Initialize for uranium (Z=92) with 2 isotopes
isotopeData->InitialiseForComponent(92, 2);

// Add U-235 data (A=235)
G4PhysicsVector* u235XS = new G4PhysicsVector();
// ... fill with U-235 cross sections ...
isotopeData->AddComponent(92, 235, u235XS);

// Add U-238 data (A=238)
G4PhysicsVector* u238XS = new G4PhysicsVector();
// ... fill with U-238 cross sections ...
isotopeData->AddComponent(92, 238, u238XS);

// Later: retrieve U-235 cross section
G4PhysicsVector* u235Data = isotopeData->GetComponentDataByID(92, 235);
G4double xs = u235Data->Value(1*MeV);
```

### Shell Cross Sections

```cpp
// Create container for shell ionization cross sections
G4ElementData* shellData = new G4ElementData();
shellData->SetName("ShellIonizationCrossSections");

// Initialize for oxygen (Z=8) with 2 shells (K and L)
shellData->InitialiseForComponent(8, 2);

// Add K-shell data (shell=0)
G4PhysicsVector* kShell = new G4PhysicsVector();
// ... fill with K-shell cross sections ...
shellData->AddComponent(8, 0, kShell);

// Add L-shell data (shell=1)
G4PhysicsVector* lShell = new G4PhysicsVector();
// ... fill with L-shell cross sections ...
shellData->AddComponent(8, 1, lShell);

// Iterate over all shells
std::size_t nShells = shellData->GetNumberOfComponents(8);
for (std::size_t i = 0; i < nShells; i++) {
    G4int shellID = shellData->GetComponentID(8, i);
    G4double xs = shellData->GetValueForComponent(8, i, 50*keV);
    G4cout << "Shell " << shellID << " XS = " << xs << G4endl;
}
```

### 2D Cross Section Data

```cpp
// Create container for angular differential cross sections
G4ElementData* angularData = new G4ElementData();
angularData->SetName("AngularDifferentialCrossSections");

// Add 2D data for iron (Z=26) - energy vs angle
G4Physics2DVector* ironAngularXS = new G4Physics2DVector();
// ... fill with cross sections as function of energy and angle ...
angularData->InitialiseForElement(26, ironAngularXS);

// Later: retrieve value at specific energy and angle
G4Physics2DVector* data = angularData->GetElement2DData(26);
G4double xs = data->Value(10*MeV, 45*degree);
```

### Iterating Over All Elements

```cpp
// Assuming data has been filled for multiple elements
G4ElementData* data = GetPhysicsData(); // your data source

for (G4int Z = 1; Z < 100; Z++) {
    G4PhysicsVector* vec = data->GetElementData(Z);
    if (vec != nullptr) {
        G4cout << "Element Z=" << Z << " has data" << G4endl;
        G4double xs = vec->Value(1*MeV);
        G4cout << "  Cross section at 1 MeV = " << xs << G4endl;
    }
}
```

### Complete Example: Shell Data Management

```cpp
class MyPhysicsProcess {
private:
    G4ElementData* fShellData;

public:
    MyPhysicsProcess() {
        // Create and initialize shell data
        fShellData = new G4ElementData(100);
        fShellData->SetName("MyShellCrossSections");
        InitializeShellData();
    }

    ~MyPhysicsProcess() {
        delete fShellData;
    }

    void InitializeShellData() {
        // Initialize for all elements with multiple shells
        for (G4int Z = 1; Z <= 92; Z++) {
            G4int nShells = GetNumberOfShells(Z);
            fShellData->InitialiseForComponent(Z, nShells);

            for (G4int shell = 0; shell < nShells; shell++) {
                G4PhysicsVector* vec = BuildCrossSectionVector(Z, shell);
                fShellData->AddComponent(Z, shell, vec);
            }
        }
    }

    G4double GetCrossSection(G4int Z, G4int shellID, G4double energy) {
        G4PhysicsVector* vec = fShellData->GetComponentDataByID(Z, shellID);
        if (vec) {
            return vec->Value(energy);
        }
        return 0.0;
    }

    void PrintShellData(G4int Z) {
        std::size_t nShells = fShellData->GetNumberOfComponents(Z);
        G4cout << "Element Z=" << Z << " has " << nShells << " shells" << G4endl;

        for (std::size_t i = 0; i < nShells; i++) {
            G4int shellID = fShellData->GetComponentID(Z, i);
            G4PhysicsVector* vec = fShellData->GetComponentDataByIndex(Z, i);
            G4cout << "  Shell " << shellID
                   << ": energy range [" << vec->Energy(0)
                   << ", " << vec->GetMaxEnergy() << "]" << G4endl;
        }
    }
};
```

## Important Notes

### Memory Management

- **Ownership transfer**: Physics vectors passed to G4ElementData are owned by it
- **Automatic cleanup**: All vectors are deleted in destructor
- **No sharing**: Do not delete vectors externally after adding them

### Thread Safety

- **Read-only safe**: Multiple threads can read data simultaneously
- **Initialization**: Populate data in master thread before worker threads start
- **No modification**: Do not modify data during event processing in MT mode

### Performance Considerations

1. **Unchecked methods**: Use GetElementData() and GetComponentDataByID() in performance-critical code
2. **Checked methods**: Use GetComponentDataByIndex() during initialization or when safety is important
3. **Component lookup**: GetComponentDataByID() is O(n) in number of components; cache frequently-used pointers

### Component ID Convention

The component ID can represent:
- **Isotope**: Mass number A (e.g., 235 for U-235)
- **Shell**: Shell index (0=K, 1=L, etc.)
- **Any integer**: User-defined meaning

Choose a convention and document it for your data set.

## Version History

Key changes from header comments (G4ElementData.hh:40-43):

- **30.09.2023**: Extended functionality, data size defined in constructor
- **10.03.2011**: Initial implementation by V. Ivanchenko

## Related Classes

- [G4PhysicsVector](./g4physicsvector.md) - 1D physics data vectors
- [G4Physics2DVector](./g4physics2dvector.md) - 2D physics data vectors
- [G4Element](./g4element.md) - Element class (provides Z values)
- [G4AtomicShells](./g4atomicshells.md) - Atomic shell binding energies (example user)

## See Also

- [G4VEmProcess](./g4vemprocess.md) - Uses G4ElementData for cross sections
- [G4VEnergyLossProcess](./g4venerglossprocess.md) - Energy loss process with element data
- [Materials Module Overview](../overview.md) - General materials documentation
