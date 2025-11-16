# G4Isotope

**File**: `source/materials/include/G4Isotope.hh`

## Overview

G4Isotope represents a chemical isotope defined by its fundamental nuclear properties. Isotopes are the most basic building blocks in Geant4's material system and can be assembled into elements via the G4Element class.

## Class Description

An isotope is defined by:
- **Name**: Unique identifier for the isotope
- **Z**: Atomic number (number of protons)
- **N**: Number of nucleons (protons + neutrons)
- **A**: Mass of a mole (optional, defaults to Geant4 database value)
- **m**: Isomer state/level (optional, default 0)

## Type Definitions

```cpp
using G4IsotopeTable = std::vector<G4Isotope*>;
```

A table of isotope pointers maintained as a static class member.

**Location**: G4Isotope.hh:59

## Constructors & Destructor

### Constructor

```cpp
G4Isotope(const G4String& name,
          G4int z,
          G4int n,
          G4double a = 0.,
          G4int mlevel = 0);
```

Creates a new isotope with the specified properties.

**Parameters**:
- `name`: Name of the isotope
- `z`: Atomic number (number of protons)
- `n`: Number of nucleons (A number)
- `a`: Mass of mole in Geant4 units (optional, defaults to database value)
- `mlevel`: Isomer level (optional, default 0 for ground state)

**Location**: G4Isotope.hh:65-69

**Notes**:
- If `a` is not provided (or is 0), the mass is taken from the Geant4 database
- The isotope is automatically added to the static isotope table

### Destructor

```cpp
~G4Isotope();
```

Destroys the isotope object.

**Location**: G4Isotope.hh:71

**Note**: It is recommended not to delete isotopes manually as they are managed by Geant4.

### Deleted Copy Constructor and Assignment

```cpp
G4Isotope(const G4Isotope&) = delete;
G4Isotope& operator=(const G4Isotope&) = delete;
```

Copy construction and assignment are explicitly disabled.

**Location**: G4Isotope.hh:73-74

## Accessor Methods

### GetName

```cpp
const G4String& GetName() const;
```

Returns the name of the isotope.

**Returns**: Reference to the isotope name string

**Location**: G4Isotope.hh:77

### GetZ

```cpp
G4int GetZ() const;
```

Returns the atomic number (number of protons).

**Returns**: Atomic number Z

**Location**: G4Isotope.hh:80

### GetN

```cpp
G4int GetN() const;
```

Returns the number of nucleons (mass number A).

**Returns**: Number of nucleons N

**Location**: G4Isotope.hh:83

**Note**: Despite the method name "GetN", this returns the mass number A (total nucleons), not the number of neutrons.

### GetA

```cpp
G4double GetA() const;
```

Returns the atomic mass of a mole in Geant4 units with electron shell contribution included.

**Returns**: Atomic mass A

**Location**: G4Isotope.hh:86

### Getm

```cpp
G4int Getm() const;
```

Returns the isomer level.

**Returns**: Isomer level (0 = ground state, >0 = excited state)

**Location**: G4Isotope.hh:89

### GetIndex

```cpp
std::size_t GetIndex() const;
```

Returns the index of this isotope in the global isotope table.

**Returns**: Index in the isotope table

**Location**: G4Isotope.hh:97

## Static Methods

### GetIsotope

```cpp
static G4Isotope* GetIsotope(const G4String& name,
                             G4bool warning = false);
```

Retrieves a pointer to an isotope by name from the global isotope table.

**Parameters**:
- `name`: Name of the isotope to find
- `warning`: If true, prints a warning if isotope not found (default: false)

**Returns**: Pointer to the isotope, or nullptr if not found

**Location**: G4Isotope.hh:91

**Added**: Version in which this was added mentioned in comments (04.08.98)

### GetIsotopeTable

```cpp
static const G4IsotopeTable* GetIsotopeTable();
```

Returns a pointer to the global table of all defined isotopes.

**Returns**: Const pointer to the isotope table

**Location**: G4Isotope.hh:93

### GetNumberOfIsotopes

```cpp
static std::size_t GetNumberOfIsotopes();
```

Returns the total number of isotopes currently defined.

**Returns**: Number of isotopes in the global table

**Location**: G4Isotope.hh:95

## Mutator Methods

### SetName

```cpp
void SetName(const G4String& name);
```

Sets or changes the name of the isotope.

**Parameters**:
- `name`: New name for the isotope

**Location**: G4Isotope.hh:108

## Operators

### Equality Operator

```cpp
G4bool operator==(const G4Isotope&) const;
```

Compares two isotopes for equality.

**Returns**: True if isotopes are equal

**Location**: G4Isotope.hh:105

### Inequality Operator

```cpp
G4bool operator!=(const G4Isotope&) const;
```

Compares two isotopes for inequality.

**Returns**: True if isotopes are not equal

**Location**: G4Isotope.hh:106

### Stream Output Operators

```cpp
friend std::ostream& operator<<(std::ostream&, const G4Isotope*);
friend std::ostream& operator<<(std::ostream&, const G4Isotope&);
friend std::ostream& operator<<(std::ostream&, const G4IsotopeTable&);
```

Enables printing of isotopes and isotope tables to output streams.

**Location**: G4Isotope.hh:99-103

## Data Members

### Private Members

```cpp
G4String fName;           // Name of the isotope
G4int fZ;                 // Atomic number
G4int fN;                 // Number of nucleons
G4double fA;              // Atomic mass of a mole
G4int fm;                 // Isomer level
std::size_t fIndexInTable; // Index in the isotope table
```

**Location**: G4Isotope.hh:111-119

## Usage Example

```cpp
// Create Carbon-12 isotope
G4Isotope* C12 = new G4Isotope("C12", 6, 12);

// Create Carbon-14 isotope with explicit mass
G4Isotope* C14 = new G4Isotope("C14", 6, 14, 14.003241*g/mole);

// Retrieve an isotope by name
G4Isotope* isotope = G4Isotope::GetIsotope("C12");

// Get properties
G4int Z = C12->GetZ();           // Returns 6
G4int N = C12->GetN();           // Returns 12
G4double A = C12->GetA();        // Returns mass in Geant4 units
```

## Version History

Key changes from header comments (G4Isotope.hh:40-48):

- **20.08.11**: Added flag fm for isomer level
- **15.11.05**: Added GetIsotope with warning parameter
- **31.03.05**: Made A parameter optional, defaults from NIST database
- **26.02.02**: Renewed fIndexInTable
- **14.09.01**: Added fCountUse for tracking element usage
- **13.09.01**: STL migration, suppression of original fIndexInTable
- **30.03.01**: Suppression of warning message in GetIsotope
- **04.08.98**: Added GetIsotope(isotopeName) method
- **17.01.97**: Aesthetic rearrangement

## See Also

- [G4Element](./g4element.md) - Elements are composed of isotopes
- [G4IsotopeVector](./g4isotopevector.md) - Vector type for storing isotopes
- [G4Material](./g4material.md) - Materials are composed of elements
