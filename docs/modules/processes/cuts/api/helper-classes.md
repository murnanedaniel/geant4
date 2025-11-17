# Helper Classes API Documentation

## Overview

This document covers the utility classes that support the cuts system: `G4PhysicsTableHelper` and `G4MCCIndexConversionTable`. These classes provide infrastructure for physics table management and persistent storage/retrieval of cuts data.

---

## G4PhysicsTableHelper

### Overview

`G4PhysicsTableHelper` is a static utility class that assists physics processes in preparing, resizing, and retrieving physics tables that are indexed by material-cuts couples.

**Header:** `source/processes/cuts/include/G4PhysicsTableHelper.hh`
**Source:** `source/processes/cuts/src/G4PhysicsTableHelper.cc`

### Purpose

- **Table Preparation**: Resize physics tables to match the current couple table size
- **Table Retrieval**: Load physics tables from persistent storage
- **Vector Management**: Set individual physics vectors at specific couple indices

### Class Declaration

```cpp
class G4PhysicsTableHelper
{
public:
    static G4PhysicsTable* PreparePhysicsTable(G4PhysicsTable* physTable);

    static G4bool RetrievePhysicsTable(G4PhysicsTable* physTable,
                                       const G4String& fileName,
                                       G4bool ascii,
                                       G4bool spline);

    static void SetPhysicsVector(G4PhysicsTable* physTable,
                                 std::size_t idx,
                                 G4PhysicsVector* vec);

    static void SetVerboseLevel(G4int value);
    static G4int GetVerboseLevel();

    // Deleted constructors (static class)
    G4PhysicsTableHelper(const G4PhysicsTableHelper&) = delete;
    G4PhysicsTableHelper& operator=(const G4PhysicsTableHelper&) = delete;

protected:
    G4PhysicsTableHelper();
    ~G4PhysicsTableHelper();

private:
    static G4int verboseLevel;
};
```

### Key Methods

#### PreparePhysicsTable()
`source/processes/cuts/include/G4PhysicsTableHelper.hh:46-49`

```cpp
static G4PhysicsTable* PreparePhysicsTable(G4PhysicsTable* physTable);
```

**Purpose:** Prepares a physics table for use by resizing it to match the current material-cuts couple table size.

**Parameters:**
- `physTable`: Pointer to physics table to prepare (can be `nullptr`)

**Returns:**
- Pointer to prepared table (creates new table if input is `nullptr`)
- Table resized to match `G4ProductionCutsTable::GetTableSize()`

**Behavior:**
- If `physTable == nullptr`: Creates new `G4PhysicsTable`
- Resizes table to accommodate all material-cuts couples
- Preserves existing physics vectors
- Adds `nullptr` entries for new couples

**Example:**
```cpp
// In a process BuildPhysicsTable() method
G4PhysicsTable* PreparePhysicsTable(const G4ParticleDefinition*) {
    // Prepare table (creates or resizes to match couple table)
    myPhysicsTable = G4PhysicsTableHelper::PreparePhysicsTable(myPhysicsTable);

    // Now build physics vectors for each couple
    for (std::size_t i = 0; i < myPhysicsTable->size(); ++i) {
        G4PhysicsVector* vec = BuildVectorForCouple(i);
        G4PhysicsTableHelper::SetPhysicsVector(myPhysicsTable, i, vec);
    }

    return myPhysicsTable;
}
```

#### RetrievePhysicsTable()
`source/processes/cuts/include/G4PhysicsTableHelper.hh:51-54`

```cpp
static G4bool RetrievePhysicsTable(G4PhysicsTable* physTable,
                                   const G4String& fileName,
                                   G4bool ascii,
                                   G4bool spline);
```

**Purpose:** Retrieves physics table from file storage.

**Parameters:**
- `physTable`: Table to fill with retrieved data
- `fileName`: Path to stored table file
- `ascii`: `true` for ASCII format, `false` for binary
- `spline`: `true` to enable spline interpolation for retrieved vectors

**Returns:**
- `true` if retrieval successful
- `false` if file not found or incompatible

**Example:**
```cpp
// Try to retrieve stored table
G4bool retrieved = G4PhysicsTableHelper::RetrievePhysicsTable(
    myPhysicsTable,
    "physics_tables/dEdx_electron.dat",
    false,  // binary format
    true    // enable spline
);

if (!retrieved) {
    // Build table from scratch
    BuildPhysicsTable();
}
```

#### SetPhysicsVector()
`source/processes/cuts/include/G4PhysicsTableHelper.hh:57-59`

```cpp
static void SetPhysicsVector(G4PhysicsTable* physTable,
                             std::size_t idx,
                             G4PhysicsVector* vec);
```

**Purpose:** Sets a physics vector at a specific index in the table.

**Parameters:**
- `physTable`: Target physics table
- `idx`: Couple index
- `vec`: Physics vector to insert

**Behavior:**
- Deletes existing vector at index if present
- Inserts new vector at specified index
- Index must be < table size

**Example:**
```cpp
for (std::size_t i = 0; i < coupleTable->GetTableSize(); ++i) {
    G4PhysicsVector* crossSection = ComputeCrossSectionVector(i);
    G4PhysicsTableHelper::SetPhysicsVector(xsecTable, i, crossSection);
}
```

#### Verbosity Control

```cpp
static void SetVerboseLevel(G4int value);  // 0: silent, 1: warnings, 2: info
static G4int GetVerboseLevel();
```

### Usage Pattern

```cpp
class MyProcess : public G4VProcess {
private:
    G4PhysicsTable* fCrossSectionTable = nullptr;

public:
    void BuildPhysicsTable(const G4ParticleDefinition&) override {
        // Prepare table (resize to match couples)
        fCrossSectionTable =
            G4PhysicsTableHelper::PreparePhysicsTable(fCrossSectionTable);

        // Build vectors for each couple
        G4ProductionCutsTable* cutsTable =
            G4ProductionCutsTable::GetProductionCutsTable();

        for (std::size_t i = 0; i < cutsTable->GetTableSize(); ++i) {
            const G4MaterialCutsCouple* couple =
                cutsTable->GetMaterialCutsCouple(i);

            G4PhysicsVector* vec = ComputeVector(couple);

            G4PhysicsTableHelper::SetPhysicsVector(
                fCrossSectionTable, i, vec);
        }
    }

    G4bool StorePhysicsTable(const G4String& directory) override {
        return fCrossSectionTable->StorePhysicsTable(
            directory + "/MyProcess_XSection.dat", false);
    }

    G4bool RetrievePhysicsTable(const G4String& directory) override {
        fCrossSectionTable =
            G4PhysicsTableHelper::PreparePhysicsTable(fCrossSectionTable);

        return G4PhysicsTableHelper::RetrievePhysicsTable(
            fCrossSectionTable,
            directory + "/MyProcess_XSection.dat",
            false, // binary
            true); // spline
    }
};
```

---

## G4MCCIndexConversionTable

### Overview

`G4MCCIndexConversionTable` provides index mapping between stored material-cuts couples and runtime couples. This is essential when retrieving cuts from files, as couple indices may differ between storage and runtime due to geometry or material changes.

**Header:** `source/processes/cuts/include/G4MCCIndexConversionTable.hh`
**Source:** `source/processes/cuts/src/G4MCCIndexConversionTable.cc`

### Purpose

When cuts are stored to file:
- Each couple has a storage index (0, 1, 2, ...)

When cuts are retrieved in a new session:
- Geometry may have changed
- Materials may be in different order
- Some couples may no longer exist
- New couples may have been added

The conversion table maps old indices to new indices.

### Class Declaration

```cpp
class G4MCCIndexConversionTable
{
public:
    G4MCCIndexConversionTable();
    virtual ~G4MCCIndexConversionTable();

    void Reset(std::size_t size);

    G4bool IsUsed(std::size_t index) const;

    void SetNewIndex(std::size_t index, std::size_t new_value);

    G4int GetIndex(std::size_t index) const;

    std::size_t size() const;

protected:
    std::vector<G4int> vecNewIndex;
};
```

### Key Methods

#### Reset()
`source/processes/cuts/include/G4MCCIndexConversionTable.hh:55-56`

```cpp
void Reset(std::size_t size);
```

**Purpose:** Initialize conversion table with specified size.

**Parameters:**
- `size`: Number of couples in stored data

**Behavior:**
- Resizes internal vector
- Initializes all entries to -1 (indicating "not used")

#### IsUsed()
`source/processes/cuts/include/G4MCCIndexConversionTable.hh:58-60`
`source/processes/cuts/include/G4MCCIndexConversionTable.hh:82-87`

```cpp
inline G4bool IsUsed(std::size_t index) const;
```

**Parameters:**
- `index`: Storage index from file

**Returns:**
- `true` if this stored couple is used in current geometry
- `false` if couple no longer exists or not needed

**Implementation:**
```cpp
inline G4bool G4MCCIndexConversionTable::IsUsed(std::size_t index) const
{
  return ((index < vecNewIndex.size()) && (vecNewIndex[index] >= 0));
}
```

#### SetNewIndex()
`source/processes/cuts/include/G4MCCIndexConversionTable.hh:62-63`
`source/processes/cuts/include/G4MCCIndexConversionTable.hh:89-96`

```cpp
inline void SetNewIndex(std::size_t index, std::size_t new_value);
```

**Purpose:** Map stored index to runtime index.

**Parameters:**
- `index`: Index in stored file
- `new_value`: Corresponding index in current couple table

**Example:**
```
Stored couple [3] → Runtime couple [5]
SetNewIndex(3, 5);
```

#### GetIndex()
`source/processes/cuts/include/G4MCCIndexConversionTable.hh:66-68`
`source/processes/cuts/include/G4MCCIndexConversionTable.hh:98-104`

```cpp
inline G4int GetIndex(std::size_t index) const;
```

**Parameters:**
- `index`: Storage index

**Returns:**
- Runtime index if couple is used
- -1 if couple not used in current geometry

**Example:**
```cpp
G4int runtimeIndex = conversionTable->GetIndex(storageIndex);
if (runtimeIndex >= 0) {
    // Use this couple
    const G4MaterialCutsCouple* couple =
        cutsTable->GetMaterialCutsCouple(runtimeIndex);
}
```

### Usage Scenario

```cpp
// During cuts retrieval
void RetrieveCuts(const G4String& directory) {
    // Read stored cuts file
    std::ifstream inFile(directory + "/cuts.dat");

    std::size_t nStoredCouples;
    inFile >> nStoredCouples;

    // Initialize conversion table
    G4MCCIndexConversionTable conversionTable;
    conversionTable.Reset(nStoredCouples);

    // Build conversion mapping
    for (std::size_t i = 0; i < nStoredCouples; ++i) {
        G4String storedMaterialName;
        inFile >> storedMaterialName;

        // Find this material in current geometry
        const G4Material* mat =
            G4Material::GetMaterial(storedMaterialName);

        if (mat != nullptr) {
            // Find corresponding runtime couple
            const G4MaterialCutsCouple* couple =
                FindCoupleForMaterial(mat);

            if (couple != nullptr) {
                // Map storage index → runtime index
                conversionTable.SetNewIndex(i, couple->GetIndex());
            }
        }
    }

    // Read and apply cuts using conversion table
    for (std::size_t i = 0; i < nStoredCouples; ++i) {
        G4double storedCut;
        inFile >> storedCut;

        if (conversionTable.IsUsed(i)) {
            G4int runtimeIndex = conversionTable.GetIndex(i);
            ApplyCut(runtimeIndex, storedCut);
        } else {
            // Skip this couple (not in current geometry)
        }
    }
}
```

### Example Mapping Scenario

**Stored geometry:**
```
Index  Material   Cuts
  0    Water      1 mm
  1    Silicon    0.1 mm
  2    Lead       5 mm
  3    Air        10 mm
```

**Runtime geometry (Silicon and Lead swapped, Air removed):**
```
Index  Material   Cuts
  0    Water      1 mm
  1    Lead       5 mm
  2    Silicon    0.1 mm
```

**Conversion Table:**
```cpp
conversionTable.GetIndex(0) → 0  // Water: storage 0 → runtime 0
conversionTable.GetIndex(1) → 2  // Silicon: storage 1 → runtime 2
conversionTable.GetIndex(2) → 1  // Lead: storage 2 → runtime 1
conversionTable.GetIndex(3) → -1 // Air: not in runtime geometry
```

## Integration with ProductionCutsTable

Both helper classes are used internally by `G4ProductionCutsTable`:

```cpp
class G4ProductionCutsTable {
private:
    G4MCCIndexConversionTable mccConversionTable;

    G4bool RetrieveCutsTable(const G4String& directory, G4bool ascii) {
        // Load material-couple mapping
        CheckMaterialCutsCoupleInfo(directory, ascii);

        // mccConversionTable populated during check
        // Use it to map stored indices to runtime indices

        return RetrieveCutsInfo(directory, ascii);
    }

public:
    const G4MCCIndexConversionTable* GetMCCIndexConversionTable() const {
        return &mccConversionTable;
    }
};
```

## Related Classes

- [**G4ProductionCutsTable**](g4productioncutstable.md) - Uses these helpers for table management
- [**G4PhysicsTable**](../../global/) - Container managed by PhysicsTableHelper
- [**G4MaterialCutsCouple**](g4materialcutscouple.md) - Indices mapped by conversion table

## References

### G4PhysicsTableHelper
- **Header:** `source/processes/cuts/include/G4PhysicsTableHelper.hh`
- **Source:** `source/processes/cuts/src/G4PhysicsTableHelper.cc`

### G4MCCIndexConversionTable
- **Header:** `source/processes/cuts/include/G4MCCIndexConversionTable.hh`
- **Source:** `source/processes/cuts/src/G4MCCIndexConversionTable.cc`

### Module Documentation
- [Cuts Module Overview](../index.md)
- [G4ProductionCutsTable](g4productioncutstable.md)

---

::: info API Version
**Geant4 Version:** 11.4.0.beta
**Last Updated:** 2025-11-17
**Status:** Complete helper classes documentation
:::
