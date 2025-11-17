# G4PhysicsTable

## Overview

G4PhysicsTable is a **collection (container) of G4PhysicsVector pointers**, providing organized storage for multiple physics vectors indexed by material-cut couples, particle types, or processes. It extends `std::vector<G4PhysicsVector*>` with physics-specific functionality including file I/O and "recalc-needed" flags for optimization.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsTable.hh` (lines 1-125)
- Inline: `source/global/management/include/G4PhysicsTable.icc`
- Implementation: `source/global/management/src/G4PhysicsTable.cc`

**Inherits from:** `std::vector<G4PhysicsVector*>`

## Purpose

G4PhysicsTable organizes physics vectors for:

1. **Material-dependent data**: One vector per material (cross-sections, dE/dx, range)
2. **Material-cut couples**: One vector per (material, production cut) pair
3. **Multi-dimensional data**: Collections of related vectors
4. **Process tables**: Cross-sections for different processes
5. **Particle-specific data**: Separate tables per particle type

## Key Features

1. **STL vector interface**: Full compatibility with std::vector operations
2. **Persistent storage**: Save/load entire tables to/from files
3. **Recalc flags**: Track which vectors need recomputation
4. **Automatic memory management**: `clearAndDestroy()` helper
5. **Type preservation**: Can store/retrieve different vector types

## When to Use

**Use G4PhysicsTable when:**
- Need multiple related physics vectors
- Vectors are indexed by material, couple index, or particle
- Want to save/load collections of vectors
- Need per-vector recalculation flags

**Example scenarios:**
- Cross-section table for all materials
- dE/dx table for all material-cut couples
- Range tables per material
- Lambda tables for processes

## Constructors and Destructor

```cpp
G4PhysicsTable() = default;
```

Default constructor creates empty table.

---

```cpp
explicit G4PhysicsTable(size_t cap);
```

Constructor with capacity (reserves memory).

**Parameters:**
- `cap`: Initial capacity (number of vectors)

**Example:**
```cpp
// Pre-allocate for 100 materials
G4PhysicsTable* xsTable = new G4PhysicsTable(100);
```

---

```cpp
virtual ~G4PhysicsTable();
```

**WARNING:** Destructor does NOT delete contained vectors! Use `clearAndDestroy()` first.

```cpp
// WRONG - memory leak!
delete xsTable;

// CORRECT
xsTable->clearAndDestroy();
delete xsTable;
```

## Public Methods

### Access Operators

```cpp
G4PhysicsVector*& operator()(std::size_t);
G4PhysicsVector* const& operator()(std::size_t) const;
```

Access vector at index (same as `operator[]`).

**Example:**
```cpp
G4PhysicsVector* vec = (*table)(materialIndex);
// OR
G4PhysicsVector* vec = table->operator()(materialIndex);
```

### Adding Vectors

```cpp
void push_back(G4PhysicsVector*);
void insert(G4PhysicsVector*);  // Alias for push_back
```

Add vector to end of table.

**Example:**
```cpp
G4PhysicsTable* table = new G4PhysicsTable();

for (size_t i = 0; i < nMaterials; ++i) {
    G4PhysicsLogVector* vec = BuildCrossSectionVector(material[i]);
    table->push_back(vec);
}
```

---

```cpp
void insertAt(std::size_t, G4PhysicsVector*);
```

Insert vector at specific index.

**Example:**
```cpp
table->insertAt(5, crossSectionVec);
```

---

```cpp
void resize(std::size_t, G4PhysicsVector* vec = nullptr);
```

Resize table, optionally filling new slots with `vec`.

**Example:**
```cpp
// Resize to match number of material-cut couples
table->resize(nCouples, nullptr);

// Fill individual entries later
for (size_t i = 0; i < nCouples; ++i) {
    (*table)[i] = BuildVectorForCouple(i);
}
```

### Memory Management

```cpp
void clearAndDestroy();
```

**CRITICAL:** Deletes all contained vectors and clears table.

**Example:**
```cpp
// Proper cleanup
table->clearAndDestroy();  // Delete vectors
delete table;              // Delete table itself
```

### Query Methods

```cpp
std::size_t entries() const;
std::size_t length() const;  // Alias for entries()
```

Get number of vectors in table.

**Example:**
```cpp
G4cout << "Table contains " << table->entries() << " vectors" << G4endl;
```

---

```cpp
G4bool isEmpty() const;
```

Check if table is empty.

### File I/O

```cpp
G4bool StorePhysicsTable(const G4String& filename, G4bool ascii = false);
```

Save entire table to file.

**Parameters:**
- `filename`: Output file path
- `ascii`: true for ASCII format, false for binary (default)

**Returns:** true on success, false on failure

**File format:** Saves each vector sequentially with type information.

**Example:**
```cpp
// Save cross-section table
if (xsTable->StorePhysicsTable("xs_gamma.dat", true)) {
    G4cout << "Table saved successfully" << G4endl;
}
```

---

```cpp
G4bool RetrievePhysicsTable(const G4String& filename,
                            G4bool ascii = false,
                            G4bool spline = false);
```

Load table from file.

**Parameters:**
- `filename`: Input file path
- `ascii`: true for ASCII format, false for binary
- `spline`: Enable spline interpolation for loaded vectors

**Returns:** true on success, false on failure

**Example:**
```cpp
G4PhysicsTable* table = new G4PhysicsTable();

if (table->RetrievePhysicsTable("xs_gamma.dat", true, true)) {
    G4cout << "Loaded " << table->entries() << " vectors" << G4endl;

    // Compute splines for all vectors
    for (size_t i = 0; i < table->entries(); ++i) {
        if ((*table)[i]) {
            (*table)[i]->FillSecondDerivatives();
        }
    }
} else {
    G4cerr << "Failed to load table" << G4endl;
}
```

---

```cpp
G4bool ExistPhysicsTable(const G4String& fileName) const;
```

Check if file exists and is readable.

**Example:**
```cpp
if (table->ExistPhysicsTable("xs_data.dat")) {
    table->RetrievePhysicsTable("xs_data.dat");
} else {
    // Build from scratch
    BuildPhysicsTable();
}
```

### Recalculation Flags

G4PhysicsTable maintains a boolean flag for each vector to track whether it needs recomputation.

```cpp
void ResetFlagArray();
```

Set all flags to true (all need recalculation).

**Example:**
```cpp
// After geometry or cuts change
table->ResetFlagArray();  // Mark all for recalc
```

---

```cpp
G4bool GetFlag(std::size_t i) const;
```

Get recalc flag for vector i.

**Returns:** true if vector i needs recalculation

---

```cpp
void ClearFlag(std::size_t i);
```

Set flag to false (mark as up-to-date).

**Example:**
```cpp
// Build/update only vectors that need it
for (size_t i = 0; i < table->entries(); ++i) {
    if (table->GetFlag(i)) {
        // Recompute vector i
        delete (*table)[i];
        (*table)[i] = BuildVector(i);
        table->ClearFlag(i);  // Mark as current
    }
}
```

## Complete Example: Cross-Section Table for All Materials

```cpp
#include "G4PhysicsTable.hh"
#include "G4MaterialTable.hh"
#include "G4PhysicsLogVector.hh"

class PhotoElectricCrossSectionTable
{
public:
    static G4PhysicsTable* Build(G4double eMin, G4double eMax, size_t nBins)
    {
        const G4MaterialTable* materialTable = G4Material::GetMaterialTable();
        size_t nMaterials = materialTable->size();

        G4cout << "Building photoelectric XS table for "
               << nMaterials << " materials..." << G4endl;

        G4PhysicsTable* xsTable = new G4PhysicsTable(nMaterials);

        for (size_t i = 0; i < nMaterials; ++i) {
            const G4Material* material = (*materialTable)[i];

            // Build cross-section vector for this material
            G4PhysicsLogVector* xs = new G4PhysicsLogVector(
                eMin, eMax, nBins, true);

            for (size_t j = 0; j < xs->GetVectorLength(); ++j) {
                G4double energy = xs->Energy(j);
                G4double crossSection = ComputePhotoelectricXS(material, energy);
                xs->PutValue(j, crossSection);
            }

            xs->FillSecondDerivatives();
            xsTable->push_back(xs);

            if ((i+1) % 20 == 0) {
                G4cout << "  Processed " << i+1 << " materials..." << G4endl;
            }
        }

        G4cout << "Table complete!" << G4endl;
        return xsTable;
    }

    static void SaveTable(G4PhysicsTable* table, const G4String& filename)
    {
        if (table->StorePhysicsTable(filename, true)) {
            G4cout << "Saved " << table->entries()
                   << " vectors to " << filename << G4endl;
        }
    }

    static G4PhysicsTable* LoadTable(const G4String& filename)
    {
        G4PhysicsTable* table = new G4PhysicsTable();

        if (table->RetrievePhysicsTable(filename, true, true)) {
            G4cout << "Loaded " << table->entries() << " vectors" << G4endl;

            // Compute splines
            for (size_t i = 0; i < table->entries(); ++i) {
                if ((*table)[i]) {
                    (*table)[i]->FillSecondDerivatives();
                }
            }
            return table;
        } else {
            delete table;
            return nullptr;
        }
    }

    static G4double GetCrossSection(G4PhysicsTable* table,
                                    size_t materialIndex,
                                    G4double energy)
    {
        if (materialIndex >= table->entries()) return 0.0;

        G4PhysicsVector* vec = (*table)[materialIndex];
        if (!vec) return 0.0;

        return vec->Value(energy);
    }
};

// Usage
void TestPhotoElectricTable()
{
    // Build or load table
    G4PhysicsTable* xsTable;

    if (G4PhysicsTable().ExistPhysicsTable("photoelectric.dat")) {
        xsTable = PhotoElectricCrossSectionTable::LoadTable("photoelectric.dat");
    } else {
        xsTable = PhotoElectricCrossSectionTable::Build(1*keV, 100*GeV, 200);
        PhotoElectricCrossSectionTable::SaveTable(xsTable, "photoelectric.dat");
    }

    // Use table
    size_t materialIndex = 5;  // e.g., index for Lead
    G4double energy = 100*keV;

    G4double xs = PhotoElectricCrossSectionTable::GetCrossSection(
        xsTable, materialIndex, energy);

    G4cout << "Cross-section at " << energy/keV << " keV: "
           << xs/barn << " barn" << G4endl;

    // Cleanup
    xsTable->clearAndDestroy();
    delete xsTable;
}
```

## Example: Material-Cut Couple Tables (dE/dx)

```cpp
// Build dE/dx table for all material-cut couples
G4PhysicsTable* BuildDEDXTable(const G4ParticleDefinition* particle)
{
    const G4ProductionCutsTable* cutTable =
        G4ProductionCutsTable::GetProductionCutsTable();
    size_t nCouples = cutTable->GetTableSize();

    G4PhysicsTable* dedxTable = new G4PhysicsTable();
    dedxTable->resize(nCouples, nullptr);

    G4cout << "Building dE/dx table for " << nCouples
           << " material-cut couples..." << G4endl;

    for (size_t i = 0; i < nCouples; ++i) {
        const G4MaterialCutsCouple* couple =
            cutTable->GetMaterialCutsCouple(i);
        const G4Material* material = couple->GetMaterial();
        G4double cutEnergy = GetCutEnergyForCouple(couple, particle);

        // Build dE/dx vector
        G4PhysicsLogVector* dedx = new G4PhysicsLogVector(
            cutEnergy, 100*TeV, 240, true);

        for (size_t j = 0; j < dedx->GetVectorLength(); ++j) {
            G4double energy = dedx->Energy(j);
            G4double stoppingPower = ComputeStoppingPower(
                particle, material, energy, cutEnergy);
            dedx->PutValue(j, stoppingPower);
        }

        dedx->FillSecondDerivatives();
        (*dedxTable)[i] = dedx;
    }

    G4cout << "dE/dx table complete!" << G4endl;
    return dedxTable;
}

// Use in stepping
G4double GetDEDX(G4PhysicsTable* dedxTable,
                 const G4MaterialCutsCouple* couple,
                 G4double kineticEnergy)
{
    size_t coupleIndex = couple->GetIndex();

    if (coupleIndex >= dedxTable->entries()) return 0.0;

    G4PhysicsVector* vec = (*dedxTable)[coupleIndex];
    if (!vec) return 0.0;

    return vec->Value(kineticEnergy);
}
```

## Example: Selective Recalculation

```cpp
// Update only tables that need recalculation
void UpdatePhysicsTables(G4PhysicsTable* table)
{
    // Reset flags when geometry/cuts change
    if (geometryChanged || cutsChanged) {
        table->ResetFlagArray();
    }

    size_t nRecalc = 0;

    for (size_t i = 0; i < table->entries(); ++i) {
        if (table->GetFlag(i)) {
            // This vector needs updating
            delete (*table)[i];
            (*table)[i] = BuildNewVector(i);
            table->ClearFlag(i);
            ++nRecalc;
        }
    }

    G4cout << "Recalculated " << nRecalc << " of "
           << table->entries() << " vectors" << G4endl;
}
```

## Memory Management Patterns

### Pattern 1: RAII Wrapper

```cpp
class PhysicsTableGuard
{
public:
    explicit PhysicsTableGuard(G4PhysicsTable* t) : table(t) {}

    ~PhysicsTableGuard() {
        if (table) {
            table->clearAndDestroy();
            delete table;
        }
    }

    G4PhysicsTable* get() { return table; }
    G4PhysicsTable* release() {
        G4PhysicsTable* t = table;
        table = nullptr;
        return t;
    }

private:
    G4PhysicsTable* table;
    PhysicsTableGuard(const PhysicsTableGuard&) = delete;
    PhysicsTableGuard& operator=(const PhysicsTableGuard&) = delete;
};

// Usage
void SafeTableUsage()
{
    PhysicsTableGuard guard(new G4PhysicsTable());
    G4PhysicsTable* table = guard.get();

    // Use table...

    // Automatic cleanup when guard goes out of scope
}
```

### Pattern 2: Smart Pointer

```cpp
#include <memory>

struct PhysicsTableDeleter
{
    void operator()(G4PhysicsTable* table) const {
        if (table) {
            table->clearAndDestroy();
            delete table;
        }
    }
};

using PhysicsTablePtr = std::unique_ptr<G4PhysicsTable, PhysicsTableDeleter>;

// Usage
PhysicsTablePtr table(new G4PhysicsTable());
// Automatic cleanup
```

## Performance Considerations

### Table Size

```cpp
// 100 materials, each with 200-point vector
// Memory: 100 * (200 * 8 * 3) ≈ 480 KB (with spline)
G4PhysicsTable* table = new G4PhysicsTable(100);
```

### Access Speed

```cpp
// Direct vector access: O(1)
G4PhysicsVector* vec = (*table)[index];  // ~5 ns

// Value lookup: O(1) for log/linear vectors
G4double val = vec->Value(energy);  // ~30-150 ns
```

### File I/O

```cpp
// ASCII: Human-readable, larger files, slower I/O
table->StorePhysicsTable("table.dat", true);   // ~10 MB, ~100 ms

// Binary: Compact, faster I/O
table->StorePhysicsTable("table.bin", false);  // ~5 MB, ~10 ms
```

## Thread Safety

G4PhysicsTable itself is **NOT thread-safe** for modifications, but **read-only access is safe** after construction.

**Safe pattern:**
```cpp
// Master thread - build once
G4PhysicsTable* table = BuildTable();

// Worker threads - read only
void WorkerThread(int tid) {
    size_t index = GetMaterialIndex();
    G4PhysicsVector* vec = (*table)[index];  // Safe

    std::size_t idx = 0;  // Thread-local
    G4double val = vec->Value(energy, idx);  // Safe
}
```

**NOT safe:**
```cpp
// Concurrent modification - WRONG
#pragma omp parallel for
for (size_t i = 0; i < nMaterials; ++i) {
    (*table)[i] = BuildVector(i);  // RACE CONDITION
}
```

## Common Geant4 Usage

G4PhysicsTable is used extensively in Geant4:

1. **G4VEnergyLossProcess**: dE/dx, range, inverse range tables
2. **G4VEmProcess**: Cross-section, lambda tables
3. **G4VMultipleScattering**: Transport cross-section tables
4. **G4MaterialCutsCouple**: Per-couple physics data

**Example from G4VEnergyLossProcess:**
```cpp
// Energy loss process has multiple tables
G4PhysicsTable* theDEDXTable;           // dE/dx vs energy
G4PhysicsTable* theRangeTableForLoss;   // Range vs energy
G4PhysicsTable* theInverseRangeTable;   // Energy vs range
G4PhysicsTable* theLambdaTable;         // Lambda vs energy
```

## Related Classes

- [G4PhysicsVector](g4physicsvector.md) - Individual physics vectors stored in table
- [G4PhysicsLogVector](g4physicslogvector.md) - Most common vector type in tables
- [G4OrderedTable](g4orderedtable.md) - Table of G4DataVectors
- [G4MaterialCutsCouple](https://geant4.web.cern.ch) - Index for tables
- G4VEnergyLossProcess - Major user of physics tables

## See Also

- Application Developer Guide, "Physics Tables"
- Physics Reference Manual, "Cross Section and Energy Loss Tables"
- G4ProductionCutsTable - Material-cuts couple management
- G4PhysicsTableHelper - Utility class for table operations
