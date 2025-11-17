# G4MaterialTable

**File**: `source/materials/include/G4MaterialTable.hh`

## Overview

G4MaterialTable is a type definition for the global material table in Geant4. It is a vector of G4Material pointers that maintains all materials defined during a Geant4 session. This table is managed internally by the G4Material class and provides access to all registered materials.

## Type Definition

```cpp
using G4MaterialTable = std::vector<G4Material*>;
```

**Location**: G4MaterialTable.hh:33

A standard vector containing pointers to all G4Material instances created during the session.

## Purpose

The material table serves as:
- **Global registry**: Centralized storage of all materials
- **Lookup mechanism**: Enables finding materials by name or index
- **Memory management**: Materials are automatically cleaned up at end of session
- **Iteration support**: Allows loops over all defined materials

## Accessing the Material Table

### Get the Table

```cpp
static G4MaterialTable* GetMaterialTable();
```

Returns a pointer to the global material table.

**Defined in**: G4Material class (G4Material.hh:242)

### Get Number of Materials

```cpp
static std::size_t GetNumberOfMaterials();
```

Returns the total number of materials in the table.

**Defined in**: G4Material class (G4Material.hh:244)

### Get Material by Name

```cpp
static G4Material* GetMaterial(const G4String& name, G4bool warning = true);
```

Retrieves a material by its name.

**Parameters**:
- `name`: Material name to search for
- `warning`: Print warning if material not found (default: true)

**Returns**: Pointer to material, or nullptr if not found

**Defined in**: G4Material class (G4Material.hh:247)

## Usage Examples

### Iterate Over All Materials

```cpp
#include "G4Material.hh"

// Get the material table
G4MaterialTable* materialTable = G4Material::GetMaterialTable();

// Iterate over all materials
for (size_t i = 0; i < materialTable->size(); i++) {
    G4Material* mat = (*materialTable)[i];
    G4cout << "Material " << i << ": " << mat->GetName()
           << ", density = " << mat->GetDensity()/(g/cm3) << " g/cm3"
           << G4endl;
}
```

### Print All Material Names

```cpp
// Using range-based for loop
G4MaterialTable* materialTable = G4Material::GetMaterialTable();
for (auto mat : *materialTable) {
    G4cout << mat->GetName() << G4endl;
}
```

### Check Number of Materials

```cpp
std::size_t nMaterials = G4Material::GetNumberOfMaterials();
G4cout << "Total materials defined: " << nMaterials << G4endl;
```

### Find Material by Name

```cpp
// Search for water material
G4Material* water = G4Material::GetMaterial("Water");
if (water) {
    G4cout << "Water found: density = "
           << water->GetDensity()/(g/cm3) << " g/cm3" << G4endl;
} else {
    G4cout << "Water not found in material table" << G4endl;
}

// Search without warning message
G4Material* mat = G4Material::GetMaterial("UnknownMaterial", false);
```

### Access Material by Index

```cpp
G4MaterialTable* materialTable = G4Material::GetMaterialTable();
if (!materialTable->empty()) {
    G4Material* firstMat = (*materialTable)[0];
    G4cout << "First material: " << firstMat->GetName() << G4endl;
}
```

### Count Materials by State

```cpp
G4MaterialTable* materialTable = G4Material::GetMaterialTable();
G4int nSolids = 0, nLiquids = 0, nGases = 0;

for (auto mat : *materialTable) {
    G4State state = mat->GetState();
    if (state == kStateSolid) nSolids++;
    else if (state == kStateLiquid) nLiquids++;
    else if (state == kStateGas) nGases++;
}

G4cout << "Solids: " << nSolids << ", Liquids: " << nLiquids
       << ", Gases: " << nGases << G4endl;
```

## Important Notes

### Memory Management

- **Do not delete materials**: Materials are automatically deleted at the end of the Geant4 session
- **Table ownership**: The material table is managed by G4Material class
- **Persistent storage**: Materials persist throughout the entire session

### Thread Safety

The material table is shared across all worker threads in multi-threaded mode:
- Materials should be created in the master thread during initialization
- Worker threads have read-only access to the material table
- Do not create or modify materials during event processing in MT mode

### Material Registration

Materials are automatically added to the table upon creation:

```cpp
// This material is automatically registered in the global table
G4Material* water = new G4Material("Water", 1.0*g/cm3, 2);
water->AddElement(H, 2);
water->AddElement(O, 1);

// Now accessible via the table
G4Material* found = G4Material::GetMaterial("Water");
// found == water (same pointer)
```

### Best Practices

1. **Name uniqueness**: Ensure material names are unique to avoid confusion
2. **Access pattern**: Use `GetMaterial(name)` for lookups rather than iterating
3. **Initialization**: Define all materials during detector construction
4. **Const correctness**: Store const pointers when materials won't be modified

```cpp
// Good practice: use const for read-only access
const G4Material* water = G4Material::GetMaterial("Water");
```

## Related Classes

- [G4Material](./g4material.md) - Material class that manages the material table
- [G4Element](./g4element.md) - Elements that compose materials
- [G4ElementTable](./g4elementtable.md) - Similar table for elements
- [G4NistManager](./g4nistmanager.md) - Provides pre-defined NIST materials

## See Also

- [G4Element::GetElementTable()](./g4element.md#getelementtable) - Similar method for elements
- [G4Isotope::GetIsotopeTable()](./g4isotope.md#getisotopetable) - Similar method for isotopes
- [Materials Module Overview](../overview.md) - General materials documentation
