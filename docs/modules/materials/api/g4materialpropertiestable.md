# G4MaterialPropertiesTable

**File**: `source/materials/include/G4MaterialPropertiesTable.hh`

## Overview

G4MaterialPropertiesTable is a container class that stores and manages both energy-dependent (vector) and constant material properties for Geant4 materials and surfaces. It serves as the primary interface for defining optical properties (refractive index, absorption, scintillation, etc.) and other material characteristics needed for particle physics simulations, particularly optical photon transport.

## Class Description

G4MaterialPropertiesTable acts as a hash table where:
- **Keys**: Property names (strings) or enumeration indices
- **Vector Properties**: G4MaterialPropertyVector objects (energy-dependent)
- **Constant Properties**: G4double values (energy-independent)

The class maintains internal vectors indexed by the enumerations defined in G4MaterialPropertiesIndex.hh, providing both fast indexed access and flexible string-based access.

## Key Features

- **Dual Property Types**: Stores both energy-dependent vectors and constant values
- **Multiple Access Methods**: String keys, enumeration indices, or integer indices
- **Automatic Group Velocity**: Calculates GROUPVEL automatically when RINDEX is set
- **Thread-Safe Reading**: Safe for multi-threaded simulations (reading only)
- **Validation**: Checks for increasing energy order and vector size consistency
- **Flexible Construction**: Properties can be added from vectors, arrays, or pre-built property vectors

## Constructor and Destructor

### Constructor

```cpp
G4MaterialPropertiesTable();
```

Creates an empty material properties table.

**Behavior**:
- Initializes internal vectors for all known properties
- Sets up property name mappings
- All properties initially undefined/null

**Location**: G4MaterialPropertiesTable.hh:62

**Implementation**: G4MaterialPropertiesTable.cc:62-176

### Destructor

```cpp
virtual ~G4MaterialPropertiesTable();
```

Destroys the table and releases all owned property vectors.

**Location**: G4MaterialPropertiesTable.hh:63

**Implementation**: G4MaterialPropertiesTable.cc:178-183

**Note**: Automatically deletes all G4MaterialPropertyVector objects added to the table

## Adding Properties

### AddProperty (from std::vector)

```cpp
G4MaterialPropertyVector* AddProperty(
    const G4String& key,
    const std::vector<G4double>& photonEnergies,
    const std::vector<G4double>& propertyValues,
    G4bool createNewKey = false,
    G4bool spline = false);
```

Adds an energy-dependent property from two vectors.

**Parameters**:
- `key`: Property name (e.g., "RINDEX", "ABSLENGTH")
- `photonEnergies`: Vector of photon energies in increasing order
- `propertyValues`: Vector of property values at each energy
- `createNewKey`: Allow creating new property key not in standard list (default: false)
- `spline`: Enable spline interpolation (default: false)

**Returns**: Pointer to created G4MaterialPropertyVector

**Requirements**:
- Vector sizes must match
- Energies must be in strictly increasing order
- At least 2 entries required (warning issued for single entry)

**Location**: G4MaterialPropertiesTable.hh:71-73

**Implementation**: G4MaterialPropertiesTable.cc:299-357

**Example**:
```cpp
auto* mpt = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 3.0*eV, 4.0*eV};
std::vector<G4double> rindex = {1.49, 1.50, 1.51};

mpt->AddProperty("RINDEX", energy, rindex);
// GROUPVEL automatically calculated
```

### AddProperty (from C arrays)

```cpp
G4MaterialPropertyVector* AddProperty(
    const char* key,
    G4double* photonEnergies,
    G4double* propertyValues,
    G4int numEntries,
    G4bool createNewKey = false,
    G4bool spline = false);
```

Adds an energy-dependent property from C-style arrays.

**Parameters**:
- `key`: Property name
- `photonEnergies`: Array of photon energies
- `propertyValues`: Array of property values
- `numEntries`: Number of entries in arrays
- `createNewKey`: Allow creating new property key
- `spline`: Enable spline interpolation

**Returns**: Pointer to created G4MaterialPropertyVector

**Location**: G4MaterialPropertiesTable.hh:77-78

**Implementation**: G4MaterialPropertiesTable.cc:359-370

**Example**:
```cpp
G4double energies[] = {1.5*eV, 2.0*eV, 2.5*eV, 3.0*eV};
G4double absorption[] = {100*cm, 150*cm, 200*cm, 180*cm};

mpt->AddProperty("ABSLENGTH", energies, absorption, 4);
```

### AddProperty (from G4MaterialPropertyVector)

```cpp
void AddProperty(const G4String& key,
                 G4MaterialPropertyVector* opv,
                 G4bool createNewKey = false);

void AddProperty(const char* key,
                 G4MaterialPropertyVector* opv,
                 G4bool createNewKey = false);
```

Adds a pre-constructed property vector to the table.

**Parameters**:
- `key`: Property name
- `opv`: Pointer to G4MaterialPropertyVector
- `createNewKey`: Allow creating new property key

**Location**: G4MaterialPropertiesTable.hh:82-83

**Implementation**: G4MaterialPropertiesTable.cc:372-425

**Note**: Table takes ownership of the vector pointer

**Example**:
```cpp
auto* scintSpectrum = new G4MaterialPropertyVector(energies, emissions, true);
mpt->AddProperty("SCINTILLATIONCOMPONENT1", scintSpectrum);
```

### AddProperty (from material database)

```cpp
void AddProperty(const G4String& key, const G4String& mat);
```

Adds a property from Geant4's built-in optical material properties database.

**Parameters**:
- `key`: Property name
- `mat`: Material name from G4OpticalMaterialProperties namespace

**Location**: G4MaterialPropertiesTable.hh:88

**Implementation**: G4MaterialPropertiesTable.cc:427-432

**Note**: Cannot create new keys with this method

**Example**:
```cpp
// Load pre-defined water properties
mpt->AddProperty("RINDEX", "Water");
```

### AddConstProperty

```cpp
void AddConstProperty(const G4String& key,
                     G4double propertyValue,
                     G4bool createNewKey = false);

void AddConstProperty(const char* key,
                     G4double propertyValue,
                     G4bool createNewKey = false);
```

Adds a constant (energy-independent) property.

**Parameters**:
- `key`: Property name (e.g., "SCINTILLATIONYIELD")
- `propertyValue`: Constant value
- `createNewKey`: Allow creating new property key

**Location**: G4MaterialPropertiesTable.hh:66-67

**Implementation**: G4MaterialPropertiesTable.cc:434-465

**Example**:
```cpp
mpt->AddConstProperty("SCINTILLATIONYIELD", 10000./MeV);
mpt->AddConstProperty("RESOLUTIONSCALE", 1.0);
mpt->AddConstProperty("SCINTILLATIONTIMECONSTANT1", 6*ns);
mpt->AddConstProperty("SCINTILLATIONRISETIME1", 0.9*ns);
```

### AddEntry

```cpp
void AddEntry(const G4String& key,
              G4double aPhotonEnergy,
              G4double aPropertyValue);

void AddEntry(const char* key,
              G4double aPhotonEnergy,
              G4double aPropertyValue);
```

Adds a single energy-value pair to an existing property vector.

**Parameters**:
- `key`: Property name (must already exist)
- `aPhotonEnergy`: Photon energy
- `aPropertyValue`: Property value at this energy

**Requirements**:
- Property vector must already exist
- Energy must not duplicate existing energies
- Automatically inserted in correct sorted position

**Location**: G4MaterialPropertiesTable.hh:120-121

**Implementation**: G4MaterialPropertiesTable.cc:489-529

**Usage**: For incrementally building property vectors

**Example**:
```cpp
// First create the property
mpt->AddProperty("RINDEX", energies, values);

// Later add more points
mpt->AddEntry("RINDEX", 3.5*eV, 1.505);
mpt->AddEntry("RINDEX", 4.5*eV, 1.515);
```

## Removing Properties

### RemoveProperty

```cpp
void RemoveProperty(const G4String& key);
void RemoveProperty(const char* key);
```

Removes an energy-dependent property from the table.

**Parameters**:
- `key`: Property name

**Location**: G4MaterialPropertiesTable.hh:95-96

**Implementation**: G4MaterialPropertiesTable.cc:480-487

**Note**: Deletes the property vector and sets pointer to nullptr

### RemoveConstProperty

```cpp
void RemoveConstProperty(const G4String& key);
void RemoveConstProperty(const char* key);
```

Removes a constant property from the table.

**Parameters**:
- `key`: Property name

**Location**: G4MaterialPropertiesTable.hh:91-92

**Implementation**: G4MaterialPropertiesTable.cc:467-478

**Note**: Marks property as undefined

## Retrieving Properties

### GetProperty

```cpp
G4MaterialPropertyVector* GetProperty(const G4String& key) const;
G4MaterialPropertyVector* GetProperty(const char* key) const;
G4MaterialPropertyVector* GetProperty(const G4int index) const;
```

Retrieves an energy-dependent property vector.

**Parameters**:
- `key`: Property name, or
- `index`: Property index from G4MaterialPropertyIndex enumeration

**Returns**:
- Pointer to G4MaterialPropertyVector if property exists
- nullptr if property not defined

**Location**: G4MaterialPropertiesTable.hh:115-117

**Implementation**: G4MaterialPropertiesTable.cc:270-297

**Usage**: Returns nullptr (not error) if property undefined - always check result

**Example**:
```cpp
G4MaterialPropertyVector* rindex = mpt->GetProperty("RINDEX");
if (rindex) {
    G4double n = rindex->Value(2.5*eV);
}

// Or using index
G4MaterialPropertyVector* abs = mpt->GetProperty(kABSLENGTH);
```

### GetConstProperty

```cpp
G4double GetConstProperty(const G4String& key) const;
G4double GetConstProperty(const char* key) const;
G4double GetConstProperty(const G4int index) const;
```

Retrieves a constant property value.

**Parameters**:
- `key`: Property name, or
- `index`: Property index from G4MaterialConstPropertyIndex enumeration

**Returns**: Property value

**Location**: G4MaterialPropertiesTable.hh:101-103

**Implementation**: G4MaterialPropertiesTable.cc:215-240

**Error**: Throws FatalException if property not defined - check with ConstPropertyExists() first

**Example**:
```cpp
if (mpt->ConstPropertyExists("SCINTILLATIONYIELD")) {
    G4double yield = mpt->GetConstProperty("SCINTILLATIONYIELD");
}
```

### ConstPropertyExists

```cpp
G4bool ConstPropertyExists(const G4String& key) const;
G4bool ConstPropertyExists(const char* key) const;
G4bool ConstPropertyExists(const G4int index) const;
```

Checks if a constant property has been defined.

**Parameters**:
- `key`: Property name, or
- `index`: Property index

**Returns**: True if property defined by user, false otherwise

**Location**: G4MaterialPropertiesTable.hh:109-111

**Implementation**: G4MaterialPropertiesTable.cc:242-268

**Note**: Returns false even if property name is valid but not set by user

**Example**:
```cpp
if (mpt->ConstPropertyExists("SCINTILLATIONYIELD")) {
    G4double yield = mpt->GetConstProperty("SCINTILLATIONYIELD");
} else {
    G4cout << "Scintillation yield not defined" << G4endl;
}
```

## Property Index Methods

### GetPropertyIndex

```cpp
G4int GetPropertyIndex(const G4String& key) const;
```

Returns the enumeration index for an energy-dependent property name.

**Parameters**:
- `key`: Property name

**Returns**: Integer index from G4MaterialPropertyIndex enumeration

**Location**: G4MaterialPropertiesTable.hh:131

**Implementation**: G4MaterialPropertiesTable.cc:201-213

**Error**: Throws FatalException if key not found

### GetConstPropertyIndex

```cpp
G4int GetConstPropertyIndex(const G4String& key) const;
```

Returns the enumeration index for a constant property name.

**Parameters**:
- `key`: Property name

**Returns**: Integer index from G4MaterialConstPropertyIndex enumeration

**Location**: G4MaterialPropertiesTable.hh:126

**Implementation**: G4MaterialPropertiesTable.cc:185-199

**Error**: Throws FatalException if key not found

## Persistence and Debugging

### DumpTable

```cpp
void DumpTable() const;
```

Prints all properties (both vector and constant) to standard output.

**Location**: G4MaterialPropertiesTable.hh:134

**Implementation**: G4MaterialPropertiesTable.cc:531-550

**Usage**: Debugging and verification of material properties

**Example Output**:
```
0: RINDEX
Energy (eV)  Value
2.00000      1.49000
3.00000      1.50000
4.00000      1.51000
10: SCINTILLATIONYIELD 10000
```

### GetMaterialPropertyNames

```cpp
const std::vector<G4String>& GetMaterialPropertyNames() const;
```

Returns vector of all energy-dependent property names.

**Returns**: Reference to vector of property name strings

**Location**: G4MaterialPropertiesTable.hh:137

**Usage**: GDML persistence, iteration over properties

### GetMaterialConstPropertyNames

```cpp
const std::vector<G4String>& GetMaterialConstPropertyNames() const;
```

Returns vector of all constant property names.

**Returns**: Reference to vector of constant property name strings

**Location**: G4MaterialPropertiesTable.hh:138

**Usage**: GDML persistence, iteration over properties

### GetProperties

```cpp
const std::vector<G4MaterialPropertyVector*>& GetProperties() const;
```

Returns vector of all property vector pointers.

**Returns**: Reference to vector of G4MaterialPropertyVector pointers

**Location**: G4MaterialPropertiesTable.hh:140

**Note**: nullptr entries indicate undefined properties

**Usage**: GDML persistence

### GetConstProperties

```cpp
const std::vector<std::pair<G4double, G4bool>>& GetConstProperties() const;
```

Returns vector of all constant property values.

**Returns**: Reference to vector of (value, isDefined) pairs

**Location**: G4MaterialPropertiesTable.hh:141

**Note**: The bool indicates whether property was set by user

**Usage**: GDML persistence

## Special Behaviors

### Automatic GROUPVEL Calculation

When the RINDEX property is set or modified, the table automatically calculates and sets the GROUPVEL (group velocity) property.

**Calculation**: Based on the dispersion relation:
```cpp
vg = c / (n + dn/d(ln E))
```

**Implementation**: G4MaterialPropertiesTable.cc:552-651

**Special Cases**:
- Single RINDEX entry: vg = c/n
- Normal dispersion enforced: vg limited to physical range
- Calculated at bin centers and endpoints

**Thread Safety**: Protected by mutex in multi-threaded mode

**Example**:
```cpp
mpt->AddProperty("RINDEX", energies, rindexValues);
// GROUPVEL automatically created - don't set it manually!

G4MaterialPropertyVector* groupvel = mpt->GetProperty("GROUPVEL");
// groupvel is now available
```

## Data Members

### Energy-Dependent Properties

```cpp
std::vector<G4MaterialPropertyVector*> fMP;
```

Vector of pointers to material property vectors.

**Location**: G4MaterialPropertiesTable.hh:150

**Organization**: Indexed by G4MaterialPropertyIndex enumeration

**Size**: kNumberOfPropertyIndex entries

**Note**: nullptr entries indicate undefined properties

### Constant Properties

```cpp
std::vector<std::pair<G4double, G4bool>> fMCP;
```

Vector of (value, isDefined) pairs for constant properties.

**Location**: G4MaterialPropertiesTable.hh:156

**Organization**: Indexed by G4MaterialConstPropertyIndex enumeration

**Size**: kNumberOfConstPropertyIndex entries

**Note**: The bool tracks whether user has set this property

### Property Names

```cpp
std::vector<G4String> fMatPropNames;       // Vector property names
std::vector<G4String> fMatConstPropNames;  // Constant property names
```

**Location**: G4MaterialPropertiesTable.hh:158-159

**Usage**: String-to-index mapping, persistence

## Usage Examples

### Complete Optical Material Setup

```cpp
// Create material
G4Material* water = new G4Material("Water", 1.0*g/cm3, 2);
water->AddElement(H, 2);
water->AddElement(O, 1);

// Create properties table
auto* mpt = new G4MaterialPropertiesTable();

// Define refractive index
std::vector<G4double> photonEnergy = {
    1.55*eV, 2.07*eV, 2.48*eV, 3.10*eV, 4.13*eV
};
std::vector<G4double> refractiveIndex = {
    1.3330, 1.3340, 1.3355, 1.3418, 1.3535
};
mpt->AddProperty("RINDEX", photonEnergy, refractiveIndex);
// GROUPVEL automatically calculated

// Define absorption length
std::vector<G4double> absLength = {
    350*cm, 400*cm, 450*cm, 400*cm, 300*cm
};
mpt->AddProperty("ABSLENGTH", photonEnergy, absLength);

// Define Rayleigh scattering
std::vector<G4double> rayleigh = {
    100*cm, 150*cm, 200*cm, 250*cm, 300*cm
};
mpt->AddProperty("RAYLEIGH", photonEnergy, rayleigh);

// Attach to material
water->SetMaterialPropertiesTable(mpt);
```

### Scintillator Properties

```cpp
auto* mpt = new G4MaterialPropertiesTable();

// Scintillation emission spectrum
std::vector<G4double> scintEnergy = {
    2.5*eV, 2.7*eV, 2.9*eV, 3.0*eV, 3.1*eV, 3.3*eV, 3.5*eV
};
std::vector<G4double> scintFast = {
    0.0, 0.2, 0.6, 1.0, 0.6, 0.2, 0.0  // Fast component
};
std::vector<G4double> scintSlow = {
    0.0, 0.3, 0.7, 1.0, 0.7, 0.3, 0.0  // Slow component
};

mpt->AddProperty("SCINTILLATIONCOMPONENT1", scintEnergy, scintFast, false, true);
mpt->AddProperty("SCINTILLATIONCOMPONENT2", scintEnergy, scintSlow, false, true);

// Scintillation properties (constants)
mpt->AddConstProperty("SCINTILLATIONYIELD", 8000./MeV);  // photons/MeV
mpt->AddConstProperty("RESOLUTIONSCALE", 1.0);

// Multi-component scintillation
mpt->AddConstProperty("SCINTILLATIONYIELD1", 0.8);  // 80% fast
mpt->AddConstProperty("SCINTILLATIONYIELD2", 0.2);  // 20% slow

mpt->AddConstProperty("SCINTILLATIONTIMECONSTANT1", 2.1*ns);  // Fast decay
mpt->AddConstProperty("SCINTILLATIONTIMECONSTANT2", 14.2*ns); // Slow decay

mpt->AddConstProperty("SCINTILLATIONRISETIME1", 0.9*ns);
mpt->AddConstProperty("SCINTILLATIONRISETIME2", 0.9*ns);

// Attach to scintillator material
scintillator->SetMaterialPropertiesTable(mpt);
```

### Wavelength-Shifting Fiber

```cpp
auto* mpt = new G4MaterialPropertiesTable();

// WLS absorption spectrum
std::vector<G4double> wlsEnergy = {
    2.5*eV, 2.7*eV, 2.9*eV, 3.1*eV, 3.3*eV, 3.5*eV
};
std::vector<G4double> wlsAbsorption = {
    500*cm, 100*cm, 10*cm, 1*cm, 10*cm, 100*cm
};
mpt->AddProperty("WLSABSLENGTH", wlsEnergy, wlsAbsorption);

// WLS emission spectrum (shifted to longer wavelength)
std::vector<G4double> wlsEmEnergy = {
    1.5*eV, 1.8*eV, 2.1*eV, 2.4*eV, 2.7*eV
};
std::vector<G4double> wlsEmission = {
    0.0, 0.4, 1.0, 0.4, 0.0
};
mpt->AddProperty("WLSCOMPONENT", wlsEmEnergy, wlsEmission);

// WLS time constant
mpt->AddConstProperty("WLSTIMECONSTANT", 0.5*ns);
mpt->AddConstProperty("WLSMEANNUMBERPHOTONS", 0.9);  // Quantum efficiency

// Core fiber properties
std::vector<G4double> rindex = {1.59, 1.59, 1.59, 1.59, 1.59, 1.59};
mpt->AddProperty("RINDEX", wlsEnergy, rindex);

wlsFiber->SetMaterialPropertiesTable(mpt);
```

### Optical Surface Properties

```cpp
// For use with G4OpticalSurface
auto* surfaceMPT = new G4MaterialPropertiesTable();

// Energy-dependent reflectivity
std::vector<G4double> energy = {1.5*eV, 2.0*eV, 3.0*eV, 4.0*eV};
std::vector<G4double> reflectivity = {0.95, 0.95, 0.90, 0.85};
surfaceMPT->AddProperty("REFLECTIVITY", energy, reflectivity);

// Energy-dependent efficiency (for photon detectors)
std::vector<G4double> efficiency = {0.0, 0.15, 0.25, 0.20};
surfaceMPT->AddProperty("EFFICIENCY", energy, efficiency);

// Surface roughness (constant)
surfaceMPT->AddConstProperty("SURFACEROUGHNESS", 0.1);

// UNIFIED model parameters
surfaceMPT->AddProperty("SPECULARLOBECONSTANT", energy, {0.1, 0.1, 0.1, 0.1});
surfaceMPT->AddProperty("SPECULARSPIKECONSTANT", energy, {0.9, 0.9, 0.9, 0.9});
surfaceMPT->AddProperty("BACKSCATTERCONSTANT", energy, {0.0, 0.0, 0.0, 0.0});

opticalSurface->SetMaterialPropertiesTable(surfaceMPT);
```

### Metal with Complex Refractive Index

```cpp
auto* mpt = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    1.0*eV, 1.5*eV, 2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV
};

// Real part of refractive index
std::vector<G4double> realRIndex = {
    0.24, 0.26, 0.30, 0.35, 0.42, 0.50, 0.60
};
mpt->AddProperty("REALRINDEX", energy, realRIndex);

// Imaginary part (extinction coefficient)
std::vector<G4double> imagRIndex = {
    3.3, 3.4, 3.6, 3.9, 4.3, 4.8, 5.4
};
mpt->AddProperty("IMAGINARYRINDEX", energy, imagRIndex);

aluminum->SetMaterialPropertiesTable(mpt);
```

### Particle-Dependent Scintillation

```cpp
auto* mpt = new G4MaterialPropertiesTable();

// Different scintillation for different particles
// Energy-dependent yields (Birks' law can be implemented)
std::vector<G4double> particleE = {0.1*MeV, 1*MeV, 10*MeV, 100*MeV};

std::vector<G4double> electronYield = {1.0, 1.0, 1.0, 1.0};  // Normalized
mpt->AddProperty("ELECTRONSCINTILLATIONYIELD", particleE, electronYield);

std::vector<G4double> alphaYield = {0.2, 0.3, 0.4, 0.5};  // Quenched
mpt->AddProperty("ALPHASCINTILLATIONYIELD", particleE, alphaYield);

std::vector<G4double> protonYield = {0.5, 0.6, 0.7, 0.8};
mpt->AddProperty("PROTONSCINTILLATIONYIELD", particleE, protonYield);

// Particle-specific time constants
mpt->AddConstProperty("ELECTRONSCINTILLATIONTIMECONSTANT1", 2.1*ns);
mpt->AddConstProperty("ALPHASCINTILLATIONTIMECONSTANT1", 5.0*ns);
mpt->AddConstProperty("PROTONSCINTILLATIONTIMECONSTANT1", 3.5*ns);

organicScintillator->SetMaterialPropertiesTable(mpt);
```

### Checking and Iterating Properties

```cpp
// Check what properties are defined
auto* mpt = material->GetMaterialPropertiesTable();

if (mpt) {
    // Dump all properties
    mpt->DumpTable();

    // Check for specific properties
    if (mpt->GetProperty("RINDEX")) {
        G4cout << "RINDEX defined" << G4endl;
    }

    if (mpt->ConstPropertyExists("SCINTILLATIONYIELD")) {
        G4double yield = mpt->GetConstProperty("SCINTILLATIONYIELD");
        G4cout << "Scint. yield: " << yield << " photons/MeV" << G4endl;
    }

    // Iterate through all vector properties
    const auto& propNames = mpt->GetMaterialPropertyNames();
    const auto& props = mpt->GetProperties();

    for (std::size_t i = 0; i < props.size(); ++i) {
        if (props[i]) {
            G4cout << "Property: " << propNames[i]
                   << ", entries: " << props[i]->GetVectorLength()
                   << G4endl;
        }
    }

    // Iterate through constant properties
    const auto& constNames = mpt->GetMaterialConstPropertyNames();
    const auto& constProps = mpt->GetConstProperties();

    for (std::size_t i = 0; i < constProps.size(); ++i) {
        if (constProps[i].second) {  // If defined
            G4cout << "Const property: " << constNames[i]
                   << " = " << constProps[i].first << G4endl;
        }
    }
}
```

## Common Property Combinations

### Transparent Dielectric (Glass, Water)
Required:
- RINDEX (automatically generates GROUPVEL)

Optional:
- ABSLENGTH (absorption)
- RAYLEIGH (Rayleigh scattering)

### Scintillator
Required:
- RINDEX
- SCINTILLATIONCOMPONENT1 (emission spectrum)
- SCINTILLATIONYIELD (photons/MeV)
- SCINTILLATIONTIMECONSTANT1 (decay time)

Optional:
- ABSLENGTH
- RAYLEIGH
- SCINTILLATIONCOMPONENT2, COMPONENT3 (additional components)
- RESOLUTIONSCALE (energy resolution)
- Particle-specific properties

### Wavelength-Shifting Material
Required:
- RINDEX
- WLSABSLENGTH (WLS absorption)
- WLSCOMPONENT (WLS emission)
- WLSTIMECONSTANT (WLS delay)
- WLSMEANNUMBERPHOTONS (WLS efficiency)

### Photon Detector (Surface)
Required:
- EFFICIENCY (quantum efficiency vs energy)

Optional:
- REFLECTIVITY (for partially reflective detectors)

### Optical Surface (Mirror, etc.)
Required:
- REFLECTIVITY

Optional (for UNIFIED model):
- SPECULARLOBECONSTANT
- SPECULARSPIKECONSTANT
- BACKSCATTERCONSTANT
- SURFACEROUGHNESS

## Thread Safety

### Multi-Threaded Access

**Safe Operations** (in worker threads during event processing):
- GetProperty() - read only
- GetConstProperty() - read only
- ConstPropertyExists() - read only
- Property vector value lookup

**Unsafe Operations** (must be done during initialization):
- AddProperty()
- AddConstProperty()
- RemoveProperty()
- RemoveConstProperty()
- AddEntry()

**Internal Protection**:
- CalculateGROUPVEL() is protected by mutex in multi-threaded builds
- Property vectors themselves are thread-safe for reading

**Best Practice**:
```cpp
// In DetectorConstruction::Construct() or ConstructMaterials()
auto* mpt = new G4MaterialPropertiesTable();
// ... add all properties ...
material->SetMaterialPropertiesTable(mpt);

// Later in worker threads (safe):
G4MaterialPropertyVector* rindex =
    material->GetMaterialPropertiesTable()->GetProperty("RINDEX");
G4double n = rindex->Value(photonEnergy);
```

## Error Handling

### Property Not Found

```cpp
// GetProperty returns nullptr if not found (no exception)
G4MaterialPropertyVector* prop = mpt->GetProperty("NONEXISTENT");
if (!prop) {
    G4cout << "Property not found" << G4endl;
}

// GetConstProperty throws FatalException if not found
// Always check first:
if (mpt->ConstPropertyExists("SCINTILLATIONYIELD")) {
    G4double yield = mpt->GetConstProperty("SCINTILLATIONYIELD");
}
```

### Energy Order Validation

```cpp
// This will throw FatalException:
std::vector<G4double> badEnergies = {3.0*eV, 2.0*eV, 4.0*eV};  // Not increasing!
// mpt->AddProperty("RINDEX", badEnergies, values);  // Fatal error

// Correct:
std::vector<G4double> goodEnergies = {2.0*eV, 3.0*eV, 4.0*eV};
mpt->AddProperty("RINDEX", goodEnergies, values);  // OK
```

### Size Mismatch

```cpp
// This will throw FatalException:
std::vector<G4double> energies = {2.0*eV, 3.0*eV};
std::vector<G4double> values = {1.5, 1.6, 1.7};  // Different size!
// mpt->AddProperty("RINDEX", energies, values);  // Fatal error
```

### Creating New Keys

```cpp
// This will throw FatalException if CUSTOM_PROP not in standard list:
// mpt->AddProperty("CUSTOM_PROP", energies, values);  // Error

// Must set createNewKey flag:
mpt->AddProperty("CUSTOM_PROP", energies, values, true);  // OK
```

## Performance Considerations

### Memory Usage
- Each property vector: ~16 bytes per entry + overhead
- Typical table: 5-10 vector properties (50-100 entries each) + 10-20 constants
- Total: ~10-20 KB per material

### Lookup Performance
- String-based: O(N) linear search through property names (~28 entries)
- Index-based: O(1) direct array access
- Property value interpolation: O(log N) binary search

**Recommendation**: Use index-based access in performance-critical code:
```cpp
// Faster (direct indexing):
G4MaterialPropertyVector* rindex = mpt->GetProperty(kRINDEX);

// Slower (string search):
G4MaterialPropertyVector* rindex = mpt->GetProperty("RINDEX");
```

## Debugging Tips

### Verify All Properties

```cpp
// Print complete table
mpt->DumpTable();

// Verify specific property
G4MaterialPropertyVector* rindex = mpt->GetProperty("RINDEX");
if (rindex) {
    G4cout << "RINDEX: " << rindex->GetVectorLength() << " entries" << G4endl;
    G4cout << "  Range: " << rindex->GetMinEnergy()/eV << " to "
           << rindex->GetMaxEnergy()/eV << " eV" << G4endl;
    rindex->DumpValues(eV, 1.0);
}
```

### Check GROUPVEL Calculation

```cpp
mpt->AddProperty("RINDEX", energies, rindexValues);

G4MaterialPropertyVector* groupvel = mpt->GetProperty("GROUPVEL");
if (groupvel) {
    G4cout << "GROUPVEL automatically calculated" << G4endl;
    groupvel->DumpValues(eV, (m/s));
} else {
    G4cout << "WARNING: GROUPVEL not calculated" << G4endl;
}
```

### Validate Energy Ranges

```cpp
// Check all properties cover the same energy range
auto checkRange = [](const G4String& name, G4MaterialPropertyVector* vec) {
    if (vec) {
        G4cout << name << ": " << vec->GetMinEnergy()/eV << " - "
               << vec->GetMaxEnergy()/eV << " eV" << G4endl;
    }
};

checkRange("RINDEX", mpt->GetProperty("RINDEX"));
checkRange("ABSLENGTH", mpt->GetProperty("ABSLENGTH"));
checkRange("RAYLEIGH", mpt->GetProperty("RAYLEIGH"));
```

## Version History

**Version 1.0** (1996-02-08): Created by Juliet Armstrong

**Key Updates**:
- 2005-05-12: Added automatic GROUPVEL calculation by P. Gumplinger
- 2002-11-05: Added named material constants by P. Gumplinger
- 1999-11-05: Migration from G4RWTPtrHashDictionary to STL by John Allison

**Location**: G4MaterialPropertiesTable.hh:38-42

## See Also

- [G4MaterialPropertyVector](./g4materialpropertyvector.md) - Stores energy-dependent properties
- [G4MaterialPropertiesIndex](./g4materialpropertiesindex.md) - Property enumeration indices
- [G4Material](./g4material.md) - Attaches properties table to materials
- [G4OpticalSurface](../geometry/api/g4opticalsurface.md) - Uses properties for optical surfaces
- [G4OpticalMaterialProperties](./g4opticalmaterialproperties.md) - Pre-defined material properties
- [G4Scintillation](../processes/api/g4scintillation.md) - Uses scintillation properties
- [G4OpBoundaryProcess](../processes/api/g4opboundaryprocess.md) - Uses optical boundary properties
