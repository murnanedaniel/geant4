# G4Element

**File**: `source/materials/include/G4Element.hh`

## Overview

G4Element represents a chemical element that can be defined either directly by its atomic properties or as a collection of isotopes with specified relative abundances. Elements are intermediate building blocks between isotopes and materials in Geant4's material system.

## Class Description

An element can be defined in two ways:

1. **Direct Definition**: Specified by name, symbol, effective Z (atomic number), and effective A (mass of mole)
2. **From Isotopes**: Built from constituent isotopes with specified relative abundances

Elements contain both user-defined properties and computed derived quantities used in physics calculations.

## Type Definitions

```cpp
using G4ElementTable = std::vector<G4Element*>;
using G4ElementVector = std::vector<const G4Element*>;
```

Tables and vectors for managing collections of elements.

**Location**: G4ElementTable.hh:33, G4ElementVector.hh:33

## Constructors & Destructor

### Constructor (Direct Definition)

```cpp
G4Element(const G4String& name,
          const G4String& symbol,
          G4double Zeff,
          G4double Aeff);
```

Creates an element directly without reference to isotopes.

**Parameters**:
- `name`: Element name (e.g., "Hydrogen", "Carbon")
- `symbol`: Chemical symbol (e.g., "H", "C")
- `Zeff`: Effective atomic number
- `Aeff`: Effective mass of a mole

**Location**: G4Element.hh:94-97

**Usage**: For simple, single-isotope elements or when isotopic composition is not important.

### Constructor (From Isotopes)

```cpp
G4Element(const G4String& name,
          const G4String& symbol,
          G4int nbIsotopes);
```

Creates an element to be built from isotopes via AddIsotope().

**Parameters**:
- `name`: Element name
- `symbol`: Chemical symbol
- `nbIsotopes`: Number of isotopes to be added

**Location**: G4Element.hh:100-102

**Usage**: Must call AddIsotope() to add constituent isotopes after construction.

### Destructor

```cpp
virtual ~G4Element();
```

Destroys the element object.

**Location**: G4Element.hh:104

**Note**: It is strongly recommended not to delete elements in user code. All elements are automatically deleted at end of session.

### Deleted Copy Operations

```cpp
G4Element(G4Element&) = delete;
const G4Element& operator=(const G4Element&) = delete;
```

Copy construction and assignment are explicitly disabled.

**Location**: G4Element.hh:106-107

## Building Elements from Isotopes

### AddIsotope

```cpp
void AddIsotope(G4Isotope* isotope,
                G4double RelativeAbundance);
```

Adds an isotope to the element with specified abundance.

**Parameters**:
- `isotope`: Pointer to the isotope to add
- `RelativeAbundance`: Fraction of number of atoms per volume for this isotope

**Location**: G4Element.hh:110-112

**Usage**: Call this method for each constituent isotope after using the isotope constructor.

## Basic Property Accessors

### GetName

```cpp
const G4String& GetName() const;
```

Returns the element name.

**Returns**: Reference to element name string

**Location**: G4Element.hh:115

### GetSymbol

```cpp
const G4String& GetSymbol() const;
```

Returns the chemical symbol.

**Returns**: Reference to chemical symbol string

**Location**: G4Element.hh:116

### GetZ

```cpp
G4double GetZ() const;
```

Returns the effective atomic number as a double.

**Returns**: Effective atomic number Zeff

**Location**: G4Element.hh:119

### GetZasInt

```cpp
G4int GetZasInt() const;
```

Returns the atomic number as an integer.

**Returns**: Integer atomic number Z

**Location**: G4Element.hh:120

### GetN

```cpp
G4double GetN() const;
```

Returns the effective number of nucleons.

**Returns**: Effective N value

**Location**: G4Element.hh:123

### GetAtomicMassAmu

```cpp
G4double GetAtomicMassAmu() const;
```

Returns the atomic mass in atomic mass units (amu).

**Returns**: Atomic mass in amu (same as GetN())

**Location**: G4Element.hh:124

### GetA

```cpp
G4double GetA() const;
```

Returns the mass of a mole in Geant4 units for atoms with atomic shell.

**Returns**: Mass of a mole Aeff

**Location**: G4Element.hh:127

## Natural Abundance Methods

### GetNaturalAbundanceFlag

```cpp
G4bool GetNaturalAbundanceFlag() const;
```

Returns whether this element uses natural isotopic abundances.

**Returns**: True if natural abundances are used

**Location**: G4Element.hh:129, 223

### SetNaturalAbundanceFlag

```cpp
void SetNaturalAbundanceFlag(G4bool);
```

Sets the natural abundance flag.

**Parameters**:
- Flag value (true for natural abundances)

**Location**: G4Element.hh:131, 225

**Added**: Version 17-10-06

## Atomic Shell Methods

### GetNbOfAtomicShells

```cpp
G4int GetNbOfAtomicShells() const;
```

Returns the number of atomic shells in this element.

**Returns**: Number of atomic shells

**Location**: G4Element.hh:134

### GetAtomicShell

```cpp
G4double GetAtomicShell(G4int index) const;
```

Returns the binding energy of the specified shell.

**Parameters**:
- `index`: Shell index (0 = ground/innermost shell)

**Returns**: Binding energy of the shell

**Location**: G4Element.hh:137

### GetNbOfShellElectrons

```cpp
G4int GetNbOfShellElectrons(G4int index) const;
```

Returns the number of electrons in the specified shell.

**Parameters**:
- `index`: Shell index (0 = ground/innermost shell)

**Returns**: Number of electrons in the shell

**Location**: G4Element.hh:140

**Added**: Version 17.09.09

## Isotope Composition Methods

### GetNumberOfIsotopes

```cpp
std::size_t GetNumberOfIsotopes() const;
```

Returns the number of isotopes constituting this element.

**Returns**: Number of constituent isotopes

**Location**: G4Element.hh:143

### GetIsotopeVector

```cpp
G4IsotopeVector* GetIsotopeVector() const;
```

Returns a vector of pointers to isotopes constituting this element.

**Returns**: Pointer to isotope vector

**Location**: G4Element.hh:146

### GetRelativeAbundanceVector

```cpp
G4double* GetRelativeAbundanceVector() const;
```

Returns a vector of relative abundances for each isotope.

**Returns**: Pointer to abundance array

**Location**: G4Element.hh:149

### GetIsotope

```cpp
const G4Isotope* GetIsotope(G4int iso) const;
```

Returns a pointer to a specific isotope by index.

**Parameters**:
- `iso`: Index of the isotope

**Returns**: Const pointer to the isotope

**Location**: G4Element.hh:151

## Static Methods

### GetElementTable

```cpp
static const G4ElementTable* GetElementTable();
```

Returns the static table of all defined elements.

**Returns**: Const pointer to the element table

**Location**: G4Element.hh:154

### GetNumberOfElements

```cpp
static std::size_t GetNumberOfElements();
```

Returns the total number of elements currently defined.

**Returns**: Number of elements in the global table

**Location**: G4Element.hh:156

### GetElement

```cpp
static G4Element* GetElement(const G4String& name,
                             G4bool warning = true);
```

Returns a pointer to an element given its name.

**Parameters**:
- `name`: Name of the element to find
- `warning`: If true, prints warning if not found (default: true)

**Returns**: Pointer to the element, or nullptr if not found

**Location**: G4Element.hh:162

**Added**: Version 04.08.98

### GetIndex

```cpp
std::size_t GetIndex() const;
```

Returns the index of this element in the global element table.

**Returns**: Index in the element table

**Location**: G4Element.hh:159

## Physics Calculation Methods

### GetfCoulomb

```cpp
G4double GetfCoulomb() const;
```

Returns the Coulomb correction factor.

**Returns**: Coulomb correction factor

**Location**: G4Element.hh:165

### GetfRadTsai

```cpp
G4double GetfRadTsai() const;
```

Returns the Tsai formula factor for radiation length calculation.

**Returns**: Radiation length factor from Tsai formula

**Location**: G4Element.hh:168

**Added**: Version 20-01-97

### GetIonisation

```cpp
G4IonisParamElm* GetIonisation() const;
```

Returns a pointer to the ionisation parameters object.

**Returns**: Pointer to ionisation parameters

**Location**: G4Element.hh:171

**Usage**: Provides access to computed ionisation parameters for physics processes.

## Mutator Methods

### SetName

```cpp
void SetName(const G4String& name);
```

Sets or changes the element name.

**Parameters**:
- `name`: New name for the element

**Location**: G4Element.hh:179

## Operators

### Deleted Comparison Operators

```cpp
G4bool operator==(const G4Element&) const = delete;
G4bool operator!=(const G4Element&) const = delete;
```

Comparison operators are explicitly disabled.

**Location**: G4Element.hh:181-182

### Stream Output Operators

```cpp
friend std::ostream& operator<<(std::ostream&, const G4Element*);
friend std::ostream& operator<<(std::ostream&, const G4Element&);
friend std::ostream& operator<<(std::ostream&, const G4ElementTable&);
friend std::ostream& operator<<(std::ostream&, const G4ElementVector&);
```

Enables printing of elements, element tables, and element vectors to output streams.

**Location**: G4Element.hh:174-177

## Data Members

### Basic Data Members

```cpp
G4String fName;                        // Element name
G4String fSymbol;                      // Chemical symbol
G4double fZeff;                        // Effective atomic number
G4double fNeff;                        // Effective number of nucleons
G4double fAeff;                        // Effective mass of a mole
G4int fZ;                              // Integer atomic number
```

**Location**: G4Element.hh:196-201

### Atomic Shell Data

```cpp
G4int fNbOfAtomicShells;               // Number of atomic shells
G4double* fAtomicShells;               // Atomic shell binding energies
G4int* fNbOfShellElectrons;            // Number of electrons per shell
```

**Location**: G4Element.hh:203-205

### Isotope Composition Data

```cpp
G4int fNumberOfIsotopes;               // Number of isotopes
G4IsotopeVector* theIsotopeVector;     // Vector of constituent isotopes
G4double* fRelativeAbundanceVector;    // Fraction of atoms per volume
```

**Location**: G4Element.hh:207-210

### Table Management

```cpp
std::size_t fIndexInTable;             // Index in element table
G4bool fNaturalAbundance;              // Natural abundance flag
```

**Location**: G4Element.hh:213-214

### Derived Data Members

```cpp
G4double fCoulomb;                     // Coulomb correction factor
G4double fRadTsai;                     // Tsai formula for radiation length
G4IonisParamElm* fIonisation;          // Ionisation parameters
```

**Location**: G4Element.hh:218-220

## Private Methods

```cpp
void InitializePointers();
void ComputeDerivedQuantities();
void ComputeCoulombFactor();
void ComputeLradTsaiFactor();
void AddNaturalIsotopes();
static G4ElementTable& GetElementTableRef();
```

**Location**: G4Element.hh:185-192

These methods handle initialization, computation of derived quantities, and table management.

## Usage Examples

### Creating a Simple Element

```cpp
// Create hydrogen element directly
G4Element* H = new G4Element("Hydrogen", "H", 1., 1.01*g/mole);

// Create carbon element
G4Element* C = new G4Element("Carbon", "C", 6., 12.01*g/mole);
```

### Creating an Element from Isotopes

```cpp
// Create isotopes
G4Isotope* U235 = new G4Isotope("U235", 92, 235);
G4Isotope* U238 = new G4Isotope("U238", 92, 238);

// Create element from isotopes
G4Element* enrichedU = new G4Element("EnrichedUranium", "U", 2);
enrichedU->AddIsotope(U235, 0.05);  // 5% U-235
enrichedU->AddIsotope(U238, 0.95);  // 95% U-238

// Access properties
G4double Z = enrichedU->GetZ();
G4int nIsotopes = enrichedU->GetNumberOfIsotopes();
```

### Retrieving an Element

```cpp
// Get element by name from global table
G4Element* elem = G4Element::GetElement("Hydrogen");

// Get all elements
const G4ElementTable* table = G4Element::GetElementTable();
std::size_t nElements = G4Element::GetNumberOfElements();
```

## Version History

Key changes from header comments (G4Element.hh:55-75):

- **17.09.09**: Added fNbOfShellElectrons and methods
- **17-10-06**: Added Get/Set fNaturalAbundance
- **01-04-05**: Added fIndexZ to count elements with same Z
- **26-02-02**: Renewed fIndexInTable
- **14-09-01**: Added fCountUse for tracking material usage
- **13-09-01**: STL migration, suppression of fIndexInTable
- **17-07-01**: Migration to STL
- **04-08-98**: Added GetElement(elementName) method
- **16-11-98**: Subshell renamed to Shell
- **09-07-98**: Ionisation parameters removed from class
- **27-04-98**: Added atomic shell data
- **27-06-97**: Added GetIsotope(int) method
- **24-01-97**: Added fTaul and ComputeIonisationPara
- **21-01-97**: Removed mixture flag
- **20-01-97**: Tsai formula for radiation length
- **17-01-97**: Aesthetic rearrangement
- **09-07-96**: New data members added by L.Urban

## See Also

- [G4Isotope](./g4isotope.md) - Elements are composed of isotopes
- [G4Material](./g4material.md) - Materials are composed of elements
- [G4IonisParamElm](./g4ionisparamelm.md) - Ionisation parameters for elements
- [G4ElementTable](./g4elementtable.md) - Type definition for element tables
- [G4ElementVector](./g4elementvector.md) - Type definition for element vectors
