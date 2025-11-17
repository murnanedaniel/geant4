# G4OrderedTable

## Overview

G4OrderedTable is a **collection of G4DataVector pointers**, providing ordered storage for generic double-precision data vectors. It extends `std::vector<G4DataVector*>` with file I/O capabilities for saving and loading collections of numeric data.

**Source Files:**
- Header: `source/global/management/include/G4OrderedTable.hh` (lines 1-69)
- Implementation: `source/global/management/src/G4OrderedTable.cc`

**Inherits from:** `std::vector<G4DataVector*>`

## Purpose

G4OrderedTable provides organized storage for:

1. **Collections of numeric data**: Groups of related double vectors
2. **Tabulated values**: Non-physics generic numeric tables
3. **Utility data structures**: Temporary calculations, buffers
4. **Compatibility**: Legacy code support

## Key Difference from G4PhysicsTable

| Feature | G4OrderedTable | G4PhysicsTable |
|---------|----------------|----------------|
| Contains | `G4DataVector*` | `G4PhysicsVector*` |
| Purpose | Generic double data | Physics quantities (E, xs, dE/dx) |
| Interpolation | None (direct access) | Linear/spline |
| File I/O | ASCII/binary | ASCII/binary with type info |
| Typical use | Utility data | Cross-sections, ranges |

**When to use:**
- G4OrderedTable: Generic numeric arrays, utility calculations
- [G4PhysicsTable](g4physicstable.md): Physics data with energy dependence

## Constructors and Destructor

```cpp
G4OrderedTable() = default;
```

Creates empty table.

---

```cpp
explicit G4OrderedTable(std::size_t cap);
```

Constructor with capacity (reserves memory).

**Example:**
```cpp
G4OrderedTable* table = new G4OrderedTable(50);
```

---

```cpp
virtual ~G4OrderedTable() = default;
```

**WARNING:** Empty destructor - does NOT delete contained vectors!

## Public Methods

### Memory Management

```cpp
void clearAndDestroy();
```

Deletes all contained vectors and clears table.

**Example:**
```cpp
// Proper cleanup
table->clearAndDestroy();
delete table;
```

### File I/O

```cpp
G4bool Store(const G4String& filename, G4bool ascii = false);
```

Save table to file.

**Parameters:**
- `filename`: Output file path
- `ascii`: true for ASCII, false for binary (default)

**Returns:** true on success

**Example:**
```cpp
if (table->Store("data.dat", true)) {
    G4cout << "Table saved" << G4endl;
}
```

---

```cpp
G4bool Retrieve(const G4String& filename, G4bool ascii = false);
```

Load table from file.

**Example:**
```cpp
G4OrderedTable* table = new G4OrderedTable();
if (table->Retrieve("data.dat", true)) {
    G4cout << "Loaded " << table->size() << " vectors" << G4endl;
}
```

### Stream Output

```cpp
friend std::ostream& operator<<(std::ostream& out, G4OrderedTable& table);
```

Print table contents to stream.

**Example:**
```cpp
G4cout << *table << G4endl;
```

## Complete Example

```cpp
#include "G4OrderedTable.hh"
#include "G4DataVector.hh"

// Build table of numeric data
G4OrderedTable* BuildDataTable()
{
    G4OrderedTable* table = new G4OrderedTable();

    // Add several data vectors
    for (int i = 0; i < 10; ++i) {
        G4DataVector* vec = new G4DataVector(100, 0.0);

        for (size_t j = 0; j < vec->size(); ++j) {
            (*vec)[j] = i * 100 + j;  // Example data
        }

        table->push_back(vec);
    }

    return table;
}

// Save and load
void TestOrderedTable()
{
    G4OrderedTable* table = BuildDataTable();

    // Save
    table->Store("numeric_data.dat", true);

    // Load
    G4OrderedTable* loaded = new G4OrderedTable();
    loaded->Retrieve("numeric_data.dat", true);

    G4cout << "Loaded " << loaded->size() << " vectors" << G4endl;

    // Cleanup
    table->clearAndDestroy();
    delete table;

    loaded->clearAndDestroy();
    delete loaded;
}
```

## STL Vector Interface

Since G4OrderedTable inherits from `std::vector<G4DataVector*>`, all STL operations are available:

```cpp
G4OrderedTable* table = new G4OrderedTable();

// STL operations
table->push_back(new G4DataVector(10));
table->reserve(100);
table->resize(50);
size_t n = table->size();
G4DataVector* first = table->front();
G4DataVector* last = table->back();

// Iteration
for (auto* vec : *table) {
    // Process each vector
    for (auto value : *vec) {
        // Process each value
    }
}
```

## Thread Safety

**Same as std::vector:** Not thread-safe for concurrent modifications.

**Safe pattern:**
```cpp
// Master thread - build once
G4OrderedTable* table = BuildTable();

// Worker threads - read only
void Worker() {
    G4DataVector* vec = (*table)[index];  // Safe
    G4double val = (*vec)[j];             // Safe
}
```

## Related Classes

- [G4DataVector](g4datavector.md) - Elements stored in G4OrderedTable
- [G4PhysicsTable](g4physicstable.md) - Similar but for physics vectors
- std::vector - Base class

## See Also

- [G4DataVector documentation](g4datavector.md)
- [G4PhysicsTable documentation](g4physicstable.md)
