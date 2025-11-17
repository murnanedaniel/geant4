# G4DataVector

## Overview

G4DataVector is a **generic container for double-precision floating-point data**, extending `std::vector<G4double>` with additional utility methods and file I/O capabilities. It provides compatibility methods from legacy Rogue-Wave collections while leveraging STL performance.

**Source Files:**
- Header: `source/global/management/include/G4DataVector.hh` (lines 1-100)
- Inline: `source/global/management/include/G4DataVector.icc`
- Implementation: `source/global/management/src/G4DataVector.cc`

**Inherits from:** `std::vector<G4double>`

## Purpose

G4DataVector provides:

1. **Generic numeric storage**: Arrays of double values
2. **Utility methods**: Search, insert, remove operations
3. **File I/O**: Save/load numeric data
4. **STL compatibility**: Full std::vector interface
5. **Legacy support**: Rogue-Wave collection compatibility

## When to Use

**Use G4DataVector for:**
- Generic numeric arrays
- Temporary calculations
- Buffer storage
- Non-physics data structures
- Building blocks for custom containers

**Do NOT use for:**
- Energy-dependent physics data (use [G4PhysicsVector](g4physicsvector.md))
- Requires interpolation (use [G4PhysicsVector](g4physicsvector.md))

## Constructors

```cpp
G4DataVector() = default;
```

Default constructor - creates empty vector.

---

```cpp
G4DataVector(const G4DataVector&) = default;
G4DataVector(G4DataVector&&) = default;
```

Default copy and move constructors.

---

```cpp
explicit G4DataVector(std::size_t cap);
```

Constructor with capacity.

**Example:**
```cpp
G4DataVector vec(100);  // Allocates space for 100 elements
```

---

```cpp
G4DataVector(std::size_t cap, G4double value);
```

Constructor with size and initial value.

**Example:**
```cpp
G4DataVector vec(50, 0.0);  // 50 elements, all initialized to 0.0
```

## Public Methods

### STL Vector Interface

All `std::vector<G4double>` methods are available:

```cpp
G4DataVector vec;

// Standard operations
vec.push_back(3.14);
vec.resize(100);
vec.reserve(200);
size_t n = vec.size();
bool empty = vec.empty();
vec.clear();

// Element access
G4double first = vec.front();
G4double last = vec.back();
G4double val = vec[5];
G4double val = vec.at(10);  // With bounds checking

// Iteration
for (G4double v : vec) {
    // Process value
}
```

### Compatibility Methods

#### insertAt()

```cpp
inline void insertAt(std::size_t, const G4double&);
```

Insert element at position.

**Example:**
```cpp
G4DataVector vec = {1.0, 2.0, 4.0, 5.0};
vec.insertAt(2, 3.0);  // Insert 3.0 at index 2
// Result: {1.0, 2.0, 3.0, 4.0, 5.0}
```

---

#### index()

```cpp
inline std::size_t index(const G4double&) const;
```

Find index of first occurrence of value.

**Returns:** Index if found, `SIZE_MAX` if not found

**Example:**
```cpp
G4DataVector vec = {1.0, 2.0, 3.0, 2.0, 5.0};
std::size_t idx = vec.index(2.0);  // Returns 1
```

---

#### contains()

```cpp
inline G4bool contains(const G4double&) const;
```

Check if vector contains value.

**Example:**
```cpp
if (vec.contains(3.14)) {
    G4cout << "Found!" << G4endl;
}
```

---

#### remove()

```cpp
inline G4bool remove(const G4double&);
```

Remove first occurrence of value.

**Returns:** true if removed, false if not found

**Example:**
```cpp
G4DataVector vec = {1.0, 2.0, 3.0, 2.0};
vec.remove(2.0);  // Removes first 2.0
// Result: {1.0, 3.0, 2.0}
```

---

#### removeAll()

```cpp
inline std::size_t removeAll(const G4double&);
```

Remove all occurrences of value.

**Returns:** Number of elements removed

**Example:**
```cpp
G4DataVector vec = {1.0, 2.0, 3.0, 2.0, 2.0};
std::size_t n = vec.removeAll(2.0);  // Returns 3
// Result: {1.0, 3.0}
```

### File I/O

```cpp
G4bool Store(std::ofstream& fOut, G4bool ascii = false);
G4bool Retrieve(std::ifstream& fIn, G4bool ascii = false);
```

Save/load vector to/from file.

**Parameters:**
- `fOut`/`fIn`: File stream
- `ascii`: true for ASCII, false for binary

**Returns:** true on success

**Example:**
```cpp
// Save
G4DataVector vec = {1.0, 2.0, 3.0, 4.0, 5.0};
std::ofstream out("data.dat");
vec.Store(out, true);  // ASCII format
out.close();

// Load
G4DataVector loaded;
std::ifstream in("data.dat");
if (loaded.Retrieve(in, true)) {
    G4cout << "Loaded " << loaded.size() << " values" << G4endl;
}
in.close();
```

### Stream Output

```cpp
friend std::ostream& operator<<(std::ostream&, const G4DataVector&);
```

Print vector to stream.

**Example:**
```cpp
G4DataVector vec = {1.0, 2.0, 3.0};
G4cout << vec << G4endl;
```

## Complete Examples

### Example 1: Histogram Accumulation

```cpp
#include "G4DataVector.hh"

class SimpleHistogram
{
public:
    SimpleHistogram(G4int nBins, G4double min, G4double max)
        : bins(nBins, 0.0), minVal(min), maxVal(max)
    {
        binWidth = (max - min) / nBins;
    }

    void Fill(G4double value, G4double weight = 1.0)
    {
        if (value < minVal || value >= maxVal) return;

        std::size_t bin = static_cast<std::size_t>((value - minVal) / binWidth);
        if (bin < bins.size()) {
            bins[bin] += weight;
        }
    }

    void Print() const
    {
        for (std::size_t i = 0; i < bins.size(); ++i) {
            G4double binCenter = minVal + (i + 0.5) * binWidth;
            G4cout << binCenter << " " << bins[i] << G4endl;
        }
    }

    void Save(const G4String& filename) const
    {
        std::ofstream out(filename);
        bins.Store(out, true);
        out.close();
    }

private:
    G4DataVector bins;
    G4double minVal, maxVal, binWidth;
};

// Usage
void TestHistogram()
{
    SimpleHistogram hist(100, 0.0, 10.0);  // 100 bins, 0-10 range

    // Fill with random data
    for (int i = 0; i < 10000; ++i) {
        G4double value = 10.0 * G4UniformRand();
        hist.Fill(value);
    }

    hist.Print();
    hist.Save("histogram.dat");
}
```

### Example 2: Running Statistics

```cpp
class RunningStats
{
public:
    void Add(G4double value)
    {
        data.push_back(value);
        sum += value;
        sumSq += value * value;
    }

    G4double Mean() const
    {
        return sum / data.size();
    }

    G4double StdDev() const
    {
        G4double mean = Mean();
        return std::sqrt(sumSq / data.size() - mean * mean);
    }

    G4double Median() const
    {
        G4DataVector sorted = data;
        std::sort(sorted.begin(), sorted.end());
        return sorted[sorted.size() / 2];
    }

    void Print() const
    {
        G4cout << "N = " << data.size() << G4endl;
        G4cout << "Mean = " << Mean() << G4endl;
        G4cout << "StdDev = " << StdDev() << G4endl;
        G4cout << "Median = " << Median() << G4endl;
    }

private:
    G4DataVector data;
    G4double sum = 0.0;
    G4double sumSq = 0.0;
};
```

### Example 3: Data Filtering

```cpp
// Filter values based on criteria
G4DataVector FilterValues(const G4DataVector& input,
                          G4double minValue,
                          G4double maxValue)
{
    G4DataVector output;

    for (G4double val : input) {
        if (val >= minValue && val <= maxValue) {
            output.push_back(val);
        }
    }

    return output;
}

// Remove outliers (values beyond N*sigma from mean)
G4DataVector RemoveOutliers(const G4DataVector& input, G4double nSigma)
{
    // Compute mean and std dev
    G4double sum = 0.0, sumSq = 0.0;
    for (G4double val : input) {
        sum += val;
        sumSq += val * val;
    }

    G4double mean = sum / input.size();
    G4double stdDev = std::sqrt(sumSq / input.size() - mean * mean);

    // Filter
    G4double threshold = nSigma * stdDev;
    G4DataVector filtered;

    for (G4double val : input) {
        if (std::abs(val - mean) <= threshold) {
            filtered.push_back(val);
        }
    }

    G4cout << "Removed " << input.size() - filtered.size()
           << " outliers" << G4endl;

    return filtered;
}
```

## Performance Considerations

G4DataVector has identical performance to `std::vector<G4double>`:

**Memory:**
```
sizeof(G4DataVector) = sizeof(std::vector<G4double>)
≈ 24-32 bytes (3-4 pointers)
Plus actual data: size * sizeof(G4double) = size * 8 bytes
```

**Operations:**
- Random access: O(1)
- Push back (amortized): O(1)
- Insert/remove: O(n)
- Search (contains, index): O(n)

## Thread Safety

**Read-only operations are thread-safe** after construction.

**Safe:**
```cpp
// Build in master
G4DataVector vec = BuildData();

// Read from workers
void Worker() {
    G4double val = vec[index];  // Safe
    for (G4double v : vec) { }  // Safe
}
```

**NOT safe:**
```cpp
// Concurrent modification
#pragma omp parallel
{
    vec.push_back(value);  // RACE CONDITION
}
```

## Common Patterns

### Pattern 1: Temporary Buffer

```cpp
// Accumulate intermediate results
G4DataVector buffer;
buffer.reserve(1000);  // Pre-allocate

for (auto& calculation : calculations) {
    buffer.push_back(ComputeValue(calculation));
}

// Process accumulated data
G4double total = std::accumulate(buffer.begin(), buffer.end(), 0.0);
```

### Pattern 2: Multi-dimensional Data

```cpp
// 2D array using vectors of vectors
std::vector<G4DataVector> matrix(nRows);
for (auto& row : matrix) {
    row.resize(nCols, 0.0);
}

// Access: matrix[i][j]
matrix[5][10] = 3.14;
```

### Pattern 3: Data Transformation

```cpp
// Apply function to all elements
G4DataVector input = {1, 2, 3, 4, 5};
G4DataVector output(input.size());

std::transform(input.begin(), input.end(), output.begin(),
              [](G4double x) { return x * x; });  // Square all elements
```

## Type Identifier

```cpp
enum { T_G4DataVector = 100 };
```

Reserved type identifier for G4DataVector (used internally for file I/O type checking).

## Related Classes

- [G4OrderedTable](g4orderedtable.md) - Collection of G4DataVectors
- [G4PhysicsVector](g4physicsvector.md) - Physics data with interpolation
- std::vector<G4double> - Base class

## See Also

- STL vector documentation
- [G4PhysicsVector](g4physicsvector.md) for physics-specific data
- [G4OrderedTable](g4orderedtable.md) for collections
