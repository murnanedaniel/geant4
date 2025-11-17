# G4IsotopeTable

**File**: `source/materials/include/G4Isotope.hh`

## Overview

G4IsotopeTable is a type definition for the global isotope table in Geant4. It is a vector of G4Isotope pointers that maintains all isotopes defined during a Geant4 session. This table is managed internally by the G4Isotope class and provides access to all registered isotopes.

## Type Definition

```cpp
using G4IsotopeTable = std::vector<G4Isotope*>;
```

**Location**: G4Isotope.hh:59

A standard vector containing pointers to all G4Isotope instances created during the session.

## Purpose

The isotope table serves as:
- **Global registry**: Centralized storage of all isotopes
- **Lookup mechanism**: Enables finding isotopes by name or index
- **Building elements**: Elements access isotopes from this table when defined with isotopic composition
- **Memory management**: Isotopes are automatically cleaned up at end of session
- **Iteration support**: Allows loops over all defined isotopes

## Accessing the Isotope Table

### Get the Table

```cpp
static const G4IsotopeTable* GetIsotopeTable();
```

Returns a const pointer to the global isotope table.

**Defined in**: G4Isotope class (G4Isotope.hh:93)

### Get Number of Isotopes

```cpp
static std::size_t GetNumberOfIsotopes();
```

Returns the total number of isotopes in the table.

**Defined in**: G4Isotope class (G4Isotope.hh:95)

### Get Isotope by Name

```cpp
static G4Isotope* GetIsotope(const G4String& name, G4bool warning = false);
```

Retrieves an isotope by its name.

**Parameters**:
- `name`: Isotope name to search for
- `warning`: Print warning if isotope not found (default: false)

**Returns**: Pointer to isotope, or nullptr if not found

**Defined in**: G4Isotope.hh:91

**Note**: Default warning is false for isotopes (different from elements and materials).

## Usage Examples

### Iterate Over All Isotopes

```cpp
#include "G4Isotope.hh"

// Get the isotope table
const G4IsotopeTable* isotopeTable = G4Isotope::GetIsotopeTable();

// Iterate over all isotopes
for (size_t i = 0; i < isotopeTable->size(); i++) {
    G4Isotope* isotope = (*isotopeTable)[i];
    G4cout << "Isotope " << i << ": "
           << isotope->GetName()
           << " (Z=" << isotope->GetZ()
           << ", N=" << isotope->GetN()
           << ", A=" << isotope->GetA()/(g/mole) << " g/mole)"
           << G4endl;
}
```

### Print All Isotope Names

```cpp
// Using range-based for loop
const G4IsotopeTable* isotopeTable = G4Isotope::GetIsotopeTable();
G4cout << "Defined isotopes: ";
for (auto isotope : *isotopeTable) {
    G4cout << isotope->GetName() << " ";
}
G4cout << G4endl;
```

### Check Number of Isotopes

```cpp
std::size_t nIsotopes = G4Isotope::GetNumberOfIsotopes();
G4cout << "Total isotopes defined: " << nIsotopes << G4endl;
```

### Find Isotope by Name

```cpp
// Search for U-235
G4Isotope* U235 = G4Isotope::GetIsotope("U235", true);
if (U235) {
    G4cout << "U-235 found: Z = " << U235->GetZ()
           << ", N = " << U235->GetN()
           << ", A = " << U235->GetA()/(g/mole) << " g/mole" << G4endl;
} else {
    G4cout << "U-235 not found in isotope table" << G4endl;
}
```

### Find Isotopes by Element

```cpp
const G4IsotopeTable* isotopeTable = G4Isotope::GetIsotopeTable();

// Find all carbon isotopes (Z = 6)
G4int targetZ = 6;
G4cout << "Carbon isotopes:" << G4endl;

for (auto isotope : *isotopeTable) {
    if (isotope->GetZ() == targetZ) {
        G4cout << "  " << isotope->GetName()
               << " (N=" << isotope->GetN() << ")" << G4endl;
    }
}
```

### List Isotopes with Isomer States

```cpp
const G4IsotopeTable* isotopeTable = G4Isotope::GetIsotopeTable();

G4cout << "Isotopes with isomer states:" << G4endl;
for (auto isotope : *isotopeTable) {
    G4int m = isotope->Getm();
    if (m > 0) {
        G4cout << "  " << isotope->GetName()
               << " (Z=" << isotope->GetZ()
               << ", N=" << isotope->GetN()
               << ", m=" << m << ")" << G4endl;
    }
}
```

### Create Element from Isotopes in Table

```cpp
// Find isotopes in the table
G4Isotope* U235 = G4Isotope::GetIsotope("U235");
G4Isotope* U238 = G4Isotope::GetIsotope("U238");

if (U235 && U238) {
    // Create enriched uranium element
    G4Element* enrichedU = new G4Element("EnrichedUranium", "U", 2);
    enrichedU->AddIsotope(U235, 5.0*perCent);   // 5% U-235
    enrichedU->AddIsotope(U238, 95.0*perCent);  // 95% U-238
}
```

### Summary by Atomic Number

```cpp
const G4IsotopeTable* isotopeTable = G4Isotope::GetIsotopeTable();

// Count isotopes per element
std::map<G4int, G4int> isotopesPerZ;

for (auto isotope : *isotopeTable) {
    isotopesPerZ[isotope->GetZ()]++;
}

G4cout << "Isotopes per element:" << G4endl;
for (const auto& pair : isotopesPerZ) {
    G4cout << "  Z = " << pair.first
           << ": " << pair.second << " isotopes" << G4endl;
}
```

## Important Notes

### Memory Management

- **Do not delete isotopes**: Isotopes are automatically deleted at the end of the Geant4 session
- **Table ownership**: The isotope table is managed by G4Isotope class
- **Persistent storage**: Isotopes persist throughout the entire session
- **Automatic registration**: Isotopes are added to table upon construction

### Thread Safety

The isotope table is shared across all worker threads in multi-threaded mode:
- Isotopes should be created in the master thread during initialization
- Worker threads have read-only access to the isotope table
- Do not create or modify isotopes during event processing in MT mode

### Isotope Registration

Isotopes are automatically added to the table upon creation:

```cpp
// This isotope is automatically registered in the global table
G4Isotope* C12 = new G4Isotope("C12", 6, 12, 12.0*g/mole);

// Now accessible via the table
G4Isotope* found = G4Isotope::GetIsotope("C12");
// found == C12 (same pointer)
```

### Mass Specification

When creating isotopes, the mass parameter is optional:

```cpp
// Mass specified explicitly
G4Isotope* U235 = new G4Isotope("U235", 92, 235, 235.0439*g/mole);

// Mass taken from Geant4 database (recommended)
G4Isotope* U238 = new G4Isotope("U238", 92, 238);
```

**Recommendation**: Omit the mass parameter (use default 0) to use values from Geant4's nuclear database.

### Isomer States

Isotopes can have isomer levels specified:

```cpp
// Ground state (default)
G4Isotope* Co60 = new G4Isotope("Co60", 27, 60, 59.9338*g/mole, 0);

// Excited state (isomer)
G4Isotope* Co60m = new G4Isotope("Co60m", 27, 60, 59.9338*g/mole, 1);
```

**Parameter m**: Isomer level (0 = ground state, 1+ = excited states)

### Best Practices

1. **Name uniqueness**: Ensure isotope names are unique
2. **Naming convention**: Use element symbol + mass number (e.g., "U235", "C12")
3. **Access pattern**: Use `GetIsotope(name)` for lookups
4. **Initialization**: Define all isotopes during detector construction
5. **Reuse isotopes**: Check if isotope exists before creating new one

```cpp
// Good practice: reuse existing isotopes
G4Isotope* U235 = G4Isotope::GetIsotope("U235");
if (!U235) {
    U235 = new G4Isotope("U235", 92, 235);
}
```

6. **Database values**: Let Geant4 provide isotope masses from database

```cpp
// Recommended: use database mass
G4Isotope* isotope = new G4Isotope("N14", 7, 14);

// Not recommended unless you have more accurate values
G4Isotope* isotope = new G4Isotope("N14", 7, 14, 14.00307*g/mole);
```

## Isotope Table vs. NIST Manager

There are two main ways to access isotopes:

### Direct Table Access

```cpp
// Access pre-defined user isotopes
G4Isotope* myIsotope = G4Isotope::GetIsotope("MyCustomIsotope");
```

### NIST Manager

```cpp
// Access standard NIST isotopes
#include "G4NistManager.hh"
G4NistManager* nist = G4NistManager::Instance();
G4Element* elem = nist->FindOrBuildElement("U", true); // true = isotopic
```

**Recommendation**: Use G4NistManager for standard isotopes to get correct natural abundances and masses automatically.

## Related Classes

- [G4Isotope](./g4isotope.md) - Isotope class that manages the isotope table
- [G4Element](./g4element.md) - Elements composed of isotopes
- [G4ElementTable](./g4elementtable.md) - Similar table for elements
- [G4MaterialTable](./g4materialtable.md) - Similar table for materials
- [G4NistManager](./g4nistmanager.md) - Provides pre-defined NIST isotopes

## Isotope Naming Conventions

### Standard Naming

Follow the pattern: **ElementSymbol + MassNumber** (+ optional 'm' for isomers)

```cpp
G4Isotope* H1  = new G4Isotope("H1", 1, 1);      // Hydrogen-1 (protium)
G4Isotope* H2  = new G4Isotope("H2", 1, 2);      // Hydrogen-2 (deuterium)
G4Isotope* H3  = new G4Isotope("H3", 1, 3);      // Hydrogen-3 (tritium)
G4Isotope* C12 = new G4Isotope("C12", 6, 12);    // Carbon-12
G4Isotope* C13 = new G4Isotope("C13", 6, 13);    // Carbon-13
G4Isotope* C14 = new G4Isotope("C14", 6, 14);    // Carbon-14
G4Isotope* U235 = new G4Isotope("U235", 92, 235); // Uranium-235
G4Isotope* U238 = new G4Isotope("U238", 92, 238); // Uranium-238
```

### Isomer Naming

Add 'm' suffix for isomeric states:

```cpp
G4Isotope* Am242  = new G4Isotope("Am242", 95, 242, 242.0595*g/mole, 0);  // Ground state
G4Isotope* Am242m = new G4Isotope("Am242m", 95, 242, 242.0595*g/mole, 1); // Isomer
```

## See Also

- [G4Element::GetElementTable()](./g4element.md#getelementtable) - Similar method for elements
- [G4Material::GetMaterialTable()](./g4material.md#getmaterialtable) - Similar method for materials
- [Materials Module Overview](../overview.md) - General materials documentation
