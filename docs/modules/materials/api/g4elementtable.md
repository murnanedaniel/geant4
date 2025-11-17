# G4ElementTable

**File**: `source/materials/include/G4ElementTable.hh`

## Overview

G4ElementTable is a type definition for the global element table in Geant4. It is a vector of G4Element pointers that maintains all elements defined during a Geant4 session. This table is managed internally by the G4Element class and provides access to all registered elements.

## Type Definition

```cpp
using G4ElementTable = std::vector<G4Element*>;
```

**Location**: G4ElementTable.hh:33

A standard vector containing pointers to all G4Element instances created during the session.

## Purpose

The element table serves as:
- **Global registry**: Centralized storage of all elements
- **Lookup mechanism**: Enables finding elements by name or index
- **Building materials**: Materials access elements from this table
- **Memory management**: Elements are automatically cleaned up at end of session
- **Iteration support**: Allows loops over all defined elements

## Accessing the Element Table

### Get the Table

```cpp
static const G4ElementTable* GetElementTable();
```

Returns a const pointer to the global element table.

**Defined in**: G4Element class (G4Element.hh:154)

**Note**: Returns const pointer to prevent accidental modification of the table.

### Get Number of Elements

```cpp
static std::size_t GetNumberOfElements();
```

Returns the total number of elements in the table.

**Defined in**: G4Element class (G4Element.hh:156)

### Get Element by Name

```cpp
static G4Element* GetElement(const G4String& name, G4bool warning = true);
```

Retrieves an element by its name.

**Parameters**:
- `name`: Element name to search for
- `warning`: Print warning if element not found (default: true)

**Returns**: Pointer to element, or nullptr if not found

**Defined in**: G4Element class (G4Element.hh:162)

## Usage Examples

### Iterate Over All Elements

```cpp
#include "G4Element.hh"

// Get the element table
const G4ElementTable* elementTable = G4Element::GetElementTable();

// Iterate over all elements
for (size_t i = 0; i < elementTable->size(); i++) {
    G4Element* elm = (*elementTable)[i];
    G4cout << "Element " << i << ": "
           << elm->GetName() << " (" << elm->GetSymbol() << "), "
           << "Z = " << elm->GetZ()
           << ", A = " << elm->GetA()/(g/mole) << " g/mole"
           << G4endl;
}
```

### Print All Element Symbols

```cpp
// Using range-based for loop
const G4ElementTable* elementTable = G4Element::GetElementTable();
G4cout << "Defined elements: ";
for (auto elm : *elementTable) {
    G4cout << elm->GetSymbol() << " ";
}
G4cout << G4endl;
```

### Check Number of Elements

```cpp
std::size_t nElements = G4Element::GetNumberOfElements();
G4cout << "Total elements defined: " << nElements << G4endl;
```

### Find Element by Name

```cpp
// Search for oxygen element
G4Element* O = G4Element::GetElement("Oxygen");
if (O) {
    G4cout << "Oxygen found: Z = " << O->GetZ()
           << ", A = " << O->GetA()/(g/mole) << " g/mole" << G4endl;
} else {
    G4cout << "Oxygen not found in element table" << G4endl;
}

// Search without warning message
G4Element* elm = G4Element::GetElement("UnknownElement", false);
```

### Access Element by Index

```cpp
const G4ElementTable* elementTable = G4Element::GetElementTable();
if (!elementTable->empty()) {
    G4Element* firstElm = (*elementTable)[0];
    G4cout << "First element: " << firstElm->GetName()
           << " (" << firstElm->GetSymbol() << ")" << G4endl;
}
```

### Find Elements by Atomic Number

```cpp
const G4ElementTable* elementTable = G4Element::GetElementTable();

// Find all elements with Z = 6 (Carbon)
G4int targetZ = 6;
G4cout << "Elements with Z = " << targetZ << ": ";

for (auto elm : *elementTable) {
    if (elm->GetZasInt() == targetZ) {
        G4cout << elm->GetName() << " ";
    }
}
G4cout << G4endl;
```

### List Elements with Isotope Composition

```cpp
const G4ElementTable* elementTable = G4Element::GetElementTable();

G4cout << "Elements built from isotopes:" << G4endl;
for (auto elm : *elementTable) {
    if (elm->GetNumberOfIsotopes() > 0) {
        G4cout << "  " << elm->GetName() << ": "
               << elm->GetNumberOfIsotopes() << " isotopes" << G4endl;
    }
}
```

### Summary Statistics

```cpp
const G4ElementTable* elementTable = G4Element::GetElementTable();

G4int nNatural = 0;
G4int nIsotopic = 0;

for (auto elm : *elementTable) {
    if (elm->GetNumberOfIsotopes() > 0) {
        nIsotopic++;
    } else {
        nNatural++;
    }
}

G4cout << "Element statistics:" << G4endl;
G4cout << "  Simple elements: " << nNatural << G4endl;
G4cout << "  Isotopic elements: " << nIsotopic << G4endl;
G4cout << "  Total: " << elementTable->size() << G4endl;
```

## Important Notes

### Memory Management

- **Do not delete elements**: Elements are automatically deleted at the end of the Geant4 session
- **Table ownership**: The element table is managed by G4Element class
- **Persistent storage**: Elements persist throughout the entire session
- **Const access**: GetElementTable() returns const pointer to prevent modification

### Thread Safety

The element table is shared across all worker threads in multi-threaded mode:
- Elements should be created in the master thread during initialization
- Worker threads have read-only access to the element table
- Do not create or modify elements during event processing in MT mode

### Element Registration

Elements are automatically added to the table upon creation:

```cpp
// This element is automatically registered in the global table
G4Element* H = new G4Element("Hydrogen", "H", 1., 1.01*g/mole);

// Now accessible via the table
G4Element* found = G4Element::GetElement("Hydrogen");
// found == H (same pointer)
```

### NIST Elements

Elements created via G4NistManager are also registered in the table:

```cpp
#include "G4NistManager.hh"

G4NistManager* nist = G4NistManager::Instance();
G4Element* Si = nist->FindOrBuildElement("Si");

// This element is now in the global table
G4Element* found = G4Element::GetElement("Si");
```

### Best Practices

1. **Name uniqueness**: Ensure element names and symbols are unique
2. **Access pattern**: Use `GetElement(name)` for lookups rather than iterating
3. **Initialization**: Define all elements during detector construction
4. **Reuse elements**: Check if element exists before creating new one

```cpp
// Good practice: reuse existing elements
G4Element* H = G4Element::GetElement("Hydrogen", false);
if (!H) {
    H = new G4Element("Hydrogen", "H", 1., 1.01*g/mole);
}
```

5. **Const correctness**: Use const pointer since table is returned as const

```cpp
// Good practice: use const for the table
const G4ElementTable* elementTable = G4Element::GetElementTable();
```

## Element Table vs. NIST Manager

There are two main ways to access elements:

### Direct Table Access

```cpp
// Access pre-defined user elements
G4Element* myElement = G4Element::GetElement("MyCustomElement");
```

### NIST Manager

```cpp
// Access standard NIST elements
G4NistManager* nist = G4NistManager::Instance();
G4Element* O = nist->FindOrBuildElement("O");
```

**Recommendation**: Use G4NistManager for standard elements, use direct construction only for custom elements with non-standard properties.

## Related Classes

- [G4Element](./g4element.md) - Element class that manages the element table
- [G4Isotope](./g4isotope.md) - Isotopes that compose elements
- [G4IsotopeTable](./g4isotopetable.md) - Similar table for isotopes
- [G4MaterialTable](./g4materialtable.md) - Similar table for materials
- [G4NistManager](./g4nistmanager.md) - Provides pre-defined NIST elements

## See Also

- [G4Material::GetMaterialTable()](./g4material.md#getmaterialtable) - Similar method for materials
- [G4Isotope::GetIsotopeTable()](./g4isotope.md#getisotopetable) - Similar method for isotopes
- [Materials Module Overview](../overview.md) - General materials documentation
