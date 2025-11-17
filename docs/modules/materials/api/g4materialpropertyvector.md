# G4MaterialPropertyVector

**File**: `source/materials/include/G4MaterialPropertyVector.hh`

## Overview

G4MaterialPropertyVector represents a one-to-one mapping from photon energy to an optical or material property value. It is a type alias for G4PhysicsFreeVector, providing a physics vector with arbitrarily-spaced energy bins (not required to be linear or logarithmic). This class is fundamental to Geant4's optical photon simulation, storing energy-dependent material properties such as refractive index, absorption length, and scintillation emission spectra.

## Class Description

G4MaterialPropertyVector stores pairs of (energy, value) data points and provides interpolation between them. The energy bins must be in increasing order to enable efficient binary search. Optional spline interpolation can be enabled for smoother value retrieval between data points.

**Type Definition**:
```cpp
using G4MaterialPropertyVector = G4PhysicsFreeVector;
```

**Location**: G4MaterialPropertyVector.hh:48

**Base Class**: G4PhysicsFreeVector (derived from G4PhysicsVector)

**Base Class File**: `source/global/management/include/G4PhysicsFreeVector.hh`

## Key Features

- **Arbitrary Energy Spacing**: Energy bins can be irregularly spaced, matching experimental data
- **Binary Search**: Efficient lookup of values at arbitrary energies
- **Linear or Spline Interpolation**: Smooth interpolation between data points
- **Dynamic Insertion**: Add new energy-value pairs after construction
- **Thread-Safe Reading**: Multiple threads can read values simultaneously

## Constructors

### Default Constructor

```cpp
G4MaterialPropertyVector(G4bool spline = false);
```

Creates an empty property vector.

**Parameters**:
- `spline`: Enable spline interpolation (default: false, uses linear interpolation)

**Usage**: Vector must be filled later using `PutValues()`, `InsertValues()`, or `Retrieve()`

**Location**: G4PhysicsFreeVector.hh:61

### Constructor with Pre-allocated Size

```cpp
G4MaterialPropertyVector(std::size_t length, G4bool spline = false);
```

Creates a property vector with pre-allocated storage.

**Parameters**:
- `length`: Number of energy-value pairs to allocate
- `spline`: Enable spline interpolation

**Note**: Vectors are initialized with zeros; must be filled with actual values

**Location**: G4PhysicsFreeVector.hh:63

### Constructor from Vectors

```cpp
G4MaterialPropertyVector(const std::vector<G4double>& energies,
                        const std::vector<G4double>& values,
                        G4bool spline = false);
```

Creates and fills a property vector from two vectors.

**Parameters**:
- `energies`: Photon energies (must be in increasing order)
- `values`: Property values corresponding to each energy
- `spline`: Enable spline interpolation

**Requirements**:
- `energies` and `values` must have the same length
- `energies` must be strictly increasing
- Consecutive equal energies are allowed

**Location**: G4PhysicsFreeVector.hh:73-75

**Example**:
```cpp
std::vector<G4double> energies = {2.0*eV, 3.0*eV, 4.0*eV};
std::vector<G4double> rindex = {1.49, 1.50, 1.51};
auto* propVec = new G4MaterialPropertyVector(energies, rindex);
```

### Constructor from Arrays

```cpp
G4MaterialPropertyVector(const G4double* energies,
                        const G4double* values,
                        std::size_t length,
                        G4bool spline = false);
```

Creates and fills a property vector from C-style arrays.

**Parameters**:
- `energies`: Array of photon energies
- `values`: Array of property values
- `length`: Number of elements in arrays
- `spline`: Enable spline interpolation

**Location**: G4PhysicsFreeVector.hh:76-77

**Example**:
```cpp
G4double energies[] = {2.0*eV, 3.0*eV, 4.0*eV};
G4double absLength[] = {100*cm, 120*cm, 110*cm};
auto* propVec = new G4MaterialPropertyVector(energies, absLength, 3);
```

## Public Methods

### Adding and Modifying Data

#### PutValues

```cpp
void PutValues(const std::size_t index,
               const G4double energy,
               const G4double value);
```

Fills a specific entry in the vector with energy and value.

**Parameters**:
- `index`: Position in the vector (0-based)
- `energy`: Photon energy
- `value`: Property value at this energy

**Requirements**:
- Index must be within allocated size
- Energies must be in increasing order across all indices

**Location**: G4PhysicsFreeVector.hh:82-83

**Usage**: For pre-allocated vectors created with size constructor

**Example**:
```cpp
auto* vec = new G4MaterialPropertyVector(3);
vec->PutValues(0, 2.0*eV, 1.49);
vec->PutValues(1, 3.0*eV, 1.50);
vec->PutValues(2, 4.0*eV, 1.51);
```

#### InsertValues

```cpp
void InsertValues(const G4double energy, const G4double value);
```

Dynamically inserts an energy-value pair into the vector.

**Parameters**:
- `energy`: Photon energy
- `value`: Property value

**Behavior**:
- Automatically maintains sorted order
- If energy equals an existing energy, new pair is inserted after it
- Vector size grows automatically

**Location**: G4PhysicsFreeVector.hh:88

**Usage**: For building vectors incrementally or adding points to existing vectors

**Example**:
```cpp
auto* vec = new G4MaterialPropertyVector();
vec->InsertValues(2.5*eV, 1.495);
vec->InsertValues(2.0*eV, 1.49);  // Automatically inserted in correct position
vec->InsertValues(3.0*eV, 1.50);
```

### Retrieving Data

#### Value (operator())

```cpp
G4double Value(G4double energy) const;
G4double operator()(G4double energy) const;
```

Returns the property value at a given energy using interpolation.

**Parameters**:
- `energy`: Photon energy

**Returns**: Interpolated property value

**Interpolation**:
- Linear interpolation by default
- Spline interpolation if enabled in constructor

**Extrapolation**:
- Below minimum energy: returns value at minimum energy
- Above maximum energy: returns value at maximum energy

**Location**: Inherited from G4PhysicsVector

**Example**:
```cpp
G4MaterialPropertyVector* rindex = mpt->GetProperty("RINDEX");
G4double photonEnergy = 2.7*eV;
G4double n = rindex->Value(photonEnergy);  // or (*rindex)(photonEnergy)
```

#### GetValue

```cpp
G4double GetValue(G4double energy, G4bool& isOutRange) const;
```

Returns value and indicates if energy is outside the defined range.

**Parameters**:
- `energy`: Photon energy
- `isOutRange`: Output parameter, set to true if energy is outside range

**Returns**: Interpolated or extrapolated property value

**Location**: Inherited from G4PhysicsVector

#### Energy

```cpp
G4double Energy(std::size_t index) const;
```

Returns the energy at a specific index.

**Parameters**:
- `index`: Position in the vector

**Returns**: Energy value at this index

**Location**: Inherited from G4PhysicsVector

**Example**:
```cpp
for (std::size_t i = 0; i < vec->GetVectorLength(); ++i) {
    G4double e = vec->Energy(i);
    G4double v = (*vec)[i];
    G4cout << "Energy: " << e/eV << " eV, Value: " << v << G4endl;
}
```

#### operator[]

```cpp
G4double operator[](std::size_t index) const;
```

Direct access to property value at a specific index (no interpolation).

**Parameters**:
- `index`: Position in the vector

**Returns**: Property value at this index

**Location**: Inherited from G4PhysicsVector

### Vector Properties

#### GetVectorLength

```cpp
std::size_t GetVectorLength() const;
```

Returns the number of energy-value pairs in the vector.

**Returns**: Number of entries

**Location**: Inherited from G4PhysicsVector

#### GetMinEnergy

```cpp
G4double GetMinEnergy() const;
```

Returns the minimum energy in the vector.

**Location**: Inherited from G4PhysicsVector

#### GetMaxEnergy

```cpp
G4double GetMaxEnergy() const;
```

Returns the maximum energy in the vector.

**Location**: Inherited from G4PhysicsVector

#### GetMinValue

```cpp
G4double GetMinValue() const;
```

Returns the minimum property value in the vector.

**Location**: Inherited from G4PhysicsVector

#### GetMaxValue

```cpp
G4double GetMaxValue() const;
```

Returns the maximum property value in the vector.

**Location**: Inherited from G4PhysicsVector

### Spline Interpolation

#### FillSecondDerivatives

```cpp
void FillSecondDerivatives();
```

Calculates second derivatives for spline interpolation.

**Usage**: Must be called after filling all data if spline interpolation is enabled

**Note**: Called automatically when using vector constructor with `spline=true`

**Location**: Inherited from G4PhysicsVector

#### SetSpline

```cpp
void SetSpline(G4bool spline);
```

Enables or disables spline interpolation.

**Parameters**:
- `spline`: True to enable spline, false for linear interpolation

**Note**: If enabling spline, must call `FillSecondDerivatives()` afterwards

**Location**: Inherited from G4PhysicsVector

### Optimization

#### EnableLogBinSearch

```cpp
void EnableLogBinSearch(const G4int n = 1);
```

Enables logarithmic bin search optimization for faster lookups.

**Parameters**:
- `n`: Number of bins per decade (default: 1)

**Usage**: For vectors with logarithmically-spaced energies

**Location**: G4PhysicsFreeVector.hh:90

### Utility Methods

#### DumpValues

```cpp
void DumpValues(G4double unitE = 1.0, G4double unitV = 1.0) const;
```

Prints all energy-value pairs to standard output.

**Parameters**:
- `unitE`: Energy unit for display (default: 1.0)
- `unitV`: Value unit for display (default: 1.0)

**Usage**: Debugging and verification

**Location**: Inherited from G4PhysicsVector

**Example**:
```cpp
vec->DumpValues(eV, 1.0);  // Print energies in eV
```

#### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int verboseLevel);
```

Sets verbosity level for diagnostic output.

**Parameters**:
- `verboseLevel`: 0 (silent), 1 (normal), 2+ (detailed)

**Location**: Inherited from G4PhysicsVector

## Usage Examples

### Creating Refractive Index vs Wavelength

```cpp
// Define refractive index for water (visible range)
// Note: Energies in increasing order
std::vector<G4double> photonEnergy = {
    1.55*eV,  // ~800 nm (red)
    2.07*eV,  // ~600 nm (yellow)
    2.48*eV,  // ~500 nm (green)
    3.10*eV   // ~400 nm (violet)
};

std::vector<G4double> refractiveIndex = {
    1.331,  // n at 800 nm
    1.333,  // n at 600 nm
    1.335,  // n at 500 nm
    1.342   // n at 400 nm
};

// Create with spline interpolation for smooth curve
auto* rindex = new G4MaterialPropertyVector(
    photonEnergy, refractiveIndex, true);

// Attach to material properties table
mpt->AddProperty("RINDEX", rindex);
```

### Creating Absorption Length

```cpp
// Absorption length for a scintillator
std::vector<G4double> absEnergy = {
    1.0*eV, 2.0*eV, 3.0*eV, 4.0*eV, 5.0*eV
};

std::vector<G4double> absLength = {
    200*cm, 300*cm, 350*cm, 300*cm, 150*cm
};

auto* absorption = new G4MaterialPropertyVector(absEnergy, absLength);
mpt->AddProperty("ABSLENGTH", absorption);
```

### Creating Scintillation Emission Spectrum

```cpp
// NaI(Tl) emission spectrum peaked at ~415 nm (~3.0 eV)
std::vector<G4double> scintEnergy = {
    2.5*eV, 2.7*eV, 2.9*eV, 3.0*eV, 3.1*eV, 3.3*eV, 3.5*eV
};

std::vector<G4double> scintEmission = {
    0.1, 0.3, 0.7, 1.0, 0.7, 0.3, 0.1  // Normalized to peak
};

auto* scintSpec = new G4MaterialPropertyVector(
    scintEnergy, scintEmission, true);  // Use spline

mpt->AddProperty("SCINTILLATIONCOMPONENT1", scintSpec);
```

### Building Vector Incrementally

```cpp
auto* complexRindex = new G4MaterialPropertyVector();

// Add data points from experimental measurements
complexRindex->InsertValues(1.5*eV, 1.45);
complexRindex->InsertValues(2.0*eV, 1.47);
complexRindex->InsertValues(2.5*eV, 1.49);
complexRindex->InsertValues(3.0*eV, 1.52);

// Enable spline interpolation
complexRindex->SetSpline(true);
complexRindex->FillSecondDerivatives();

mpt->AddProperty("RINDEX", complexRindex);
```

### Retrieving Values

```cpp
G4MaterialPropertyVector* rindex =
    material->GetMaterialPropertiesTable()->GetProperty("RINDEX");

if (rindex) {
    // Get value at specific energy
    G4double n_at_2eV = rindex->Value(2.0*eV);

    // Iterate through all data points
    for (std::size_t i = 0; i < rindex->GetVectorLength(); ++i) {
        G4double energy = rindex->Energy(i);
        G4double value = (*rindex)[i];
        G4cout << "E=" << energy/eV << " eV, n=" << value << G4endl;
    }

    // Check energy range
    G4double eMin = rindex->GetMinEnergy();
    G4double eMax = rindex->GetMaxEnergy();
    G4cout << "Valid range: " << eMin/eV << " to "
           << eMax/eV << " eV" << G4endl;
}
```

### Complex Refractive Index (Absorbing Materials)

```cpp
// For metals or strongly absorbing materials
std::vector<G4double> energy = {1.5*eV, 2.0*eV, 2.5*eV, 3.0*eV};

// Real part of n
std::vector<G4double> nReal = {0.15, 0.20, 0.25, 0.30};
auto* realPart = new G4MaterialPropertyVector(energy, nReal);
mpt->AddProperty("REALRINDEX", realPart);

// Imaginary part of n (absorption)
std::vector<G4double> nImag = {3.0, 3.2, 3.5, 3.8};
auto* imagPart = new G4MaterialPropertyVector(energy, nImag);
mpt->AddProperty("IMAGINARYRINDEX", imagPart);
```

## Energy Units and Conventions

### Energy Convention
Geant4 uses **photon energy** (not wavelength) as the independent variable. Always specify energies in increasing order.

### Wavelength to Energy Conversion
```cpp
// Convert wavelength (nm) to energy (eV)
G4double lambda = 400.0;  // nm
G4double energy = (1239.84 / lambda) * eV;  // ~3.1 eV

// h*c / lambda in Geant4 units
G4double h_Planck = 4.135667662e-15 * eV*s;
G4double c_light = 299792458 * m/s;
G4double wavelength = 400*nm;
G4double photonE = h_Planck * c_light / wavelength;
```

### Common Energy Ranges
- **UV**: 3.1-6.2 eV (400-200 nm)
- **Visible**: 1.6-3.1 eV (800-400 nm)
- **Near-IR**: 0.8-1.6 eV (1500-800 nm)
- **X-ray**: 124 eV-124 keV (10 nm-0.01 nm)

## Thread Safety

G4MaterialPropertyVector is **thread-safe for reading** in multi-threaded simulations:
- Multiple threads can call `Value()` and other const methods simultaneously
- Do not modify vectors (InsertValues, PutValues) during event processing
- Construct and fill all property vectors during initialization phase

For multi-threaded applications:
```cpp
// OK: Read-only access in worker threads
G4double n = rindex->Value(photonEnergy);

// NOT OK: Modifying vector in worker threads
// rindex->InsertValues(newE, newValue);  // Don't do this!
```

## Performance Considerations

### Binary Search
- Energy lookup uses binary search: O(log N) complexity
- Efficient even for vectors with hundreds of data points
- EnableLogBinSearch() can further optimize for log-spaced data

### Spline vs Linear Interpolation
- **Linear**: Faster, sufficient for densely-sampled data
- **Spline**: Smoother, better for sparse data, slightly slower
- Spline requires additional memory for second derivatives

### Memory Usage
Each entry stores two G4double values (16 bytes) plus overhead:
- 100 entries: ~2 KB
- 1000 entries: ~20 KB
- Typical property vectors: 10-100 entries

## Common Pitfalls

### Energy Order
```cpp
// WRONG: Energies not in increasing order
std::vector<G4double> energies = {3.0*eV, 2.0*eV, 4.0*eV};  // Error!

// CORRECT: Increasing order
std::vector<G4double> energies = {2.0*eV, 3.0*eV, 4.0*eV};  // OK
```

### Mismatched Vector Sizes
```cpp
// WRONG: Different sizes
std::vector<G4double> energies = {2.0*eV, 3.0*eV};
std::vector<G4double> values = {1.5, 1.6, 1.7};  // Size mismatch!

// CORRECT: Same sizes
std::vector<G4double> energies = {2.0*eV, 3.0*eV, 4.0*eV};
std::vector<G4double> values = {1.5, 1.6, 1.7};  // OK
```

### Forgetting Spline Setup
```cpp
// WRONG: Spline enabled but derivatives not calculated
auto* vec = new G4MaterialPropertyVector(energies, values, true);
// Missing: vec->FillSecondDerivatives();

// CORRECT: Constructor calls it automatically
auto* vec = new G4MaterialPropertyVector(energies, values, true);
// Or manually:
auto* vec2 = new G4MaterialPropertyVector();
vec2->SetSpline(true);
// ... fill data ...
vec2->FillSecondDerivatives();
```

## Debugging

### Verify Vector Contents
```cpp
rindex->DumpValues(eV, 1.0);  // Print in eV units

// Check range
G4cout << "RINDEX range: " << rindex->GetMinEnergy()/eV
       << " to " << rindex->GetMaxEnergy()/eV << " eV" << G4endl;
G4cout << "Value range: " << rindex->GetMinValue()
       << " to " << rindex->GetMaxValue() << G4endl;

// Verify specific values
for (std::size_t i = 0; i < rindex->GetVectorLength(); ++i) {
    G4cout << i << ": E=" << rindex->Energy(i)/eV
           << " eV, n=" << (*rindex)[i] << G4endl;
}
```

## Version History

**Version 2.0** (2011-10-13): Simplified to typedef to G4PhysicsFreeVector by Peter Gumplinger

**Version 1.0** (1996-02-08): Original implementation by Juliet Armstrong

## See Also

- [G4MaterialPropertiesTable](./g4materialpropertiestable.md) - Container for multiple property vectors
- [G4MaterialPropertiesIndex](./g4materialpropertiesindex.md) - Property name enumerations
- [G4Material](./g4material.md) - Attaches properties to materials
- [G4PhysicsFreeVector](../../global/api/g4physicsvector.md) - Base class providing core functionality
- [G4OpticalPhoton](../processes/api/g4opticalphoton.md) - Optical photon transport
