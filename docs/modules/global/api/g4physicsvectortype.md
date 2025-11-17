# G4PhysicsVectorType

## Overview

G4PhysicsVectorType is an enumeration that defines the type of physics vector and spline interpolation used for storing and accessing physics data in Geant4.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsVectorType.hh` (lines 1-62)

## Purpose

This enum provides type identifiers for different physics vector implementations, allowing runtime type checking and optimized bin search algorithms based on the vector's energy binning scheme.

## Vector Type Enumeration

### G4PhysicsVectorType

```cpp
enum G4PhysicsVectorType
{
  T_G4PhysicsFreeVector = 0,    // Arbitrary binning
  T_G4PhysicsLinearVector,       // Linear energy binning
  T_G4PhysicsLogVector           // Logarithmic energy binning
};
```

**Values:**

| Enumerator | Value | Description |
|------------|-------|-------------|
| `T_G4PhysicsFreeVector` | 0 | Arbitrary energy binning - energies can be at any positions (must be monotonically increasing) |
| `T_G4PhysicsLinearVector` | 1 | Linear energy binning - equal spacing on linear scale |
| `T_G4PhysicsLogVector` | 2 | Logarithmic energy binning - equal spacing on log scale |

## Spline Type Enumeration

### G4SplineType

```cpp
enum class G4SplineType
{
  Simple = 0,      // 2nd derivative continuous
  Base,            // 3rd derivative continuous (default)
  FixedEdges       // 3rd derivative continuous with fixed 1st and last derivatives
};
```

**Values:**

| Enumerator | Value | Description | Continuity | Use Case |
|------------|-------|-------------|------------|----------|
| `Simple` | 0 | Simplified spline computation | 2nd derivative continuous | Fast computation, less smooth |
| `Base` | 1 | Standard spline (default) | 3rd derivative continuous | General purpose, good smoothness |
| `FixedEdges` | 2 | Fixed endpoint derivatives | 3rd derivative continuous | When boundary conditions are known |

## Usage in Type Detection

The physics vector type determines which bin search algorithm is used:

**Linear Vector (T_G4PhysicsLinearVector):**
```cpp
bin = (energy - edgeMin) * invdBin;  // Direct calculation - O(1)
```

**Log Vector (T_G4PhysicsLogVector):**
```cpp
bin = (log(energy) - logemin) * invdBin;  // Direct calculation - O(1)
```

**Free Vector (T_G4PhysicsFreeVector):**
```cpp
bin = BinarySearch(energy);  // Binary search - O(log n)
// Or logarithmic search if EnableLogBinSearch() was called
```

## When to Use Each Type

### Linear Vector
- **Use when:** Physics data varies smoothly over a relatively narrow energy range
- **Examples:** Low-energy particle ranges, energy loss in thin materials
- **Advantages:** Simple, uniform sampling
- **Disadvantages:** Inefficient for data spanning many orders of magnitude

### Log Vector
- **Use when:** Physics data spans many orders of magnitude in energy
- **Examples:** Cross-sections, photon attenuation coefficients, particle ranges
- **Advantages:** Efficient sampling for wide energy ranges, most common in physics
- **Disadvantages:** Cannot include zero energy

### Free Vector
- **Use when:** Energy points are irregularly spaced or come from external data
- **Examples:** Experimental data, tabulated data with varying resolution
- **Advantages:** Maximum flexibility
- **Disadvantages:** Slower lookup (binary search unless log search is enabled)

## Spline Interpolation

Spline interpolation provides smooth, continuous curves through physics data points. The choice of spline type affects:

1. **Computational cost:** Simple < Base < FixedEdges
2. **Smoothness:** Simple < Base ≈ FixedEdges
3. **Minimum points required:** Simple (4) < Base (5) < FixedEdges (4)

### Example: Enabling Spline Interpolation

```cpp
// Create vector with spline enabled
G4PhysicsLogVector* vec = new G4PhysicsLogVector(1*keV, 10*GeV, 100, true);

// Fill data
for (size_t i = 0; i < vec->GetVectorLength(); ++i) {
    G4double energy = vec->Energy(i);
    G4double value = ComputeCrossSection(energy);
    vec->PutValue(i, value);
}

// Compute spline coefficients
vec->FillSecondDerivatives(G4SplineType::Base);  // Default
```

## Performance Considerations

**Bin Search Complexity:**
- Linear vector: O(1) - direct calculation
- Log vector: O(1) - direct calculation
- Free vector: O(log n) - binary search
- Free vector with log search: O(1) average case

**Spline Interpolation:**
- Linear interpolation: 4 operations per lookup
- Spline interpolation: ~12 operations per lookup
- Trade-off: Accuracy vs. speed

## Related Classes

- [G4PhysicsVector](g4physicsvector.md) - Base class using these types
- [G4PhysicsLinearVector](g4physicslinearvector.md) - Linear binning implementation
- [G4PhysicsLogVector](g4physicslogvector.md) - Logarithmic binning implementation
- [G4PhysicsFreeVector](g4physicsfreevector.md) - Free binning implementation

## Thread Safety

These enumerations are thread-safe as they are compile-time constants. However, the physics vectors themselves have thread-safety considerations (see individual class documentation).

## See Also

- G4PhysicsVector for base functionality
- G4PhysicsTable for collections of vectors
- Physics Reference Manual, section on "Physics Tables"
