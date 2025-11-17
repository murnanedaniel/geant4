# G4PhysicsOrderedFreeVector

## Overview

**G4PhysicsOrderedFreeVector is a type alias (typedef) for [G4PhysicsFreeVector](g4physicsfreevector.md).** It exists for backward compatibility and has identical functionality.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsOrderedFreeVector.hh` (lines 1-34)

## Definition

```cpp
using G4PhysicsOrderedFreeVector = G4PhysicsFreeVector;
```

## Historical Context

In earlier versions of Geant4 (before version 11.0), G4PhysicsOrderedFreeVector was a separate class that maintained sorted energy ordering. As of Geant4 11.0, all free vector functionality was consolidated into G4PhysicsFreeVector, which always maintains sorted order internally.

## Usage

The two names can be used interchangeably:

```cpp
// These are IDENTICAL
G4PhysicsOrderedFreeVector* vec1 = new G4PhysicsOrderedFreeVector();
G4PhysicsFreeVector* vec2 = new G4PhysicsFreeVector();

// Both support the same operations
vec1->InsertValues(10*keV, value1);
vec2->InsertValues(10*keV, value1);

// Can assign between them
vec1 = vec2;  // OK - same type
```

## Recommendation

**Use G4PhysicsFreeVector in new code.** G4PhysicsOrderedFreeVector is retained only for backward compatibility with legacy code.

```cpp
// PREFERRED (modern)
G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(true);

// LEGACY (works but discouraged)
G4PhysicsOrderedFreeVector* vec = new G4PhysicsOrderedFreeVector(true);
```

## Automatic Ordering

Both names refer to the same class, which automatically maintains sorted energy order:

```cpp
G4PhysicsOrderedFreeVector* vec = new G4PhysicsOrderedFreeVector();

// Energies don't need to be inserted in order
vec->InsertValues(100*keV, val1);
vec->InsertValues(10*keV, val2);   // Automatically inserted before 100 keV
vec->InsertValues(50*keV, val3);   // Automatically inserted between 10 and 100

// Energies are now ordered: 10, 50, 100 keV
```

## Migration Guide

If you have code using G4PhysicsOrderedFreeVector:

```cpp
// Old code (still works)
G4PhysicsOrderedFreeVector* vec = new G4PhysicsOrderedFreeVector();

// New code (recommended)
G4PhysicsFreeVector* vec = new G4PhysicsFreeVector();
```

**No functional changes needed** - just change the type name.

## Complete Documentation

For complete API documentation, features, examples, and usage patterns, see:

**[G4PhysicsFreeVector](g4physicsfreevector.md)**

All methods, constructors, and behavior are documented there.

## Related Classes

- [G4PhysicsFreeVector](g4physicsfreevector.md) - The actual implementation (read this)
- [G4PhysicsVector](g4physicsvector.md) - Base class
- [G4PhysicsLogVector](g4physicslogvector.md) - Logarithmic binning
- [G4PhysicsLinearVector](g4physicslinearvector.md) - Linear binning

## See Also

- Geant4 11.0 Release Notes - Consolidation of free vector classes
- [G4PhysicsFreeVector documentation](g4physicsfreevector.md) for full details
