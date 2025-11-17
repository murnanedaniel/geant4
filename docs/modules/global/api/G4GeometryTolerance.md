# G4GeometryTolerance

## Overview

G4GeometryTolerance is a singleton class that manages the precision tolerances used throughout the Geant4 geometry system. It provides tolerances for surface boundaries, angular measurements, and radial distances. These tolerances are critical for determining when points are on surfaces, inside volumes, or at boundaries during particle tracking. The tolerance values can be computed automatically based on world volume extent or set to fixed values.

**Source Location**: `/source/global/management/include/G4GeometryTolerance.hh`

**Author**: G. Cosmo (2006)

## Class Definition

```cpp
class G4GeometryTolerance
{
    friend class G4GeometryManager;

public:
    static G4GeometryTolerance* GetInstance();

    G4double GetSurfaceTolerance() const;
    G4double GetAngularTolerance() const;
    G4double GetRadialTolerance() const;

    ~G4GeometryTolerance() = default;

protected:
    void SetSurfaceTolerance(G4double worldExtent);
    G4GeometryTolerance();

private:
    static G4ThreadLocal G4GeometryTolerance* fpInstance;
    G4double fCarTolerance;   // Cartesian (surface) tolerance
    G4double fAngTolerance;   // Angular tolerance
    G4double fRadTolerance;   // Radial tolerance
    G4bool fInitialised;
};
```

## Public Methods

### Singleton Access

```cpp
static G4GeometryTolerance* GetInstance()
```

**Returns**: Pointer to the unique G4GeometryTolerance instance (thread-local in MT mode)

**Description**: Creates the singleton instance if it doesn't exist and returns it. Each thread has its own instance in multithreaded mode.

### Tolerance Accessors

```cpp
G4double GetSurfaceTolerance() const
```

**Returns**: Current Cartesian (surface) tolerance value

**Description**: Returns the tolerance for surface boundaries. This defines the "thickness" of geometrical surfaces. Points within tolerance/2 of a surface are considered to be on the surface.

**Default**: 1E-9 mm (if not set based on world extent)

```cpp
G4double GetAngularTolerance() const
```

**Returns**: Current angular tolerance in radians

**Description**: Returns the tolerance for angular calculations in geometry operations.

**Default**: 1E-9 radians

```cpp
G4double GetRadialTolerance() const
```

**Returns**: Current radial tolerance value

**Description**: Returns the tolerance for radial distance calculations (used in curved surfaces).

**Default**: Same as surface tolerance

## Protected Methods

### SetSurfaceTolerance

```cpp
void SetSurfaceTolerance(G4double worldExtent)
```

**Parameters**:
- `worldExtent` - Maximum extent of the world volume

**Description**: Sets the Cartesian and radial tolerances based on the world volume size. This method can only be called once by G4GeometryManager during geometry initialization. The tolerance is computed to be appropriate for the scale of the geometry.

**Access**: Only accessible to G4GeometryManager (friend class)

## Usage Examples

### Getting Tolerance Values

```cpp
#include "G4GeometryTolerance.hh"

// Access the singleton instance
G4GeometryTolerance* geomTolerance = G4GeometryTolerance::GetInstance();

// Get surface tolerance
G4double surfTol = geomTolerance->GetSurfaceTolerance();
G4cout << "Surface tolerance: " << surfTol/mm << " mm" << G4endl;

// Get angular tolerance
G4double angTol = geomTolerance->GetAngularTolerance();
G4cout << "Angular tolerance: " << angTol << " rad" << G4endl;

// Get radial tolerance
G4double radTol = geomTolerance->GetRadialTolerance();
G4cout << "Radial tolerance: " << radTol/mm << " mm" << G4endl;
```

### Using Tolerances in Custom Code

```cpp
void CheckPointOnSurface(const G4ThreeVector& point, G4double surfaceZ) {
    G4GeometryTolerance* geomTol = G4GeometryTolerance::GetInstance();
    G4double tolerance = geomTol->GetSurfaceTolerance();

    // Check if point is on surface within tolerance
    G4double distance = std::abs(point.z() - surfaceZ);

    if (distance < tolerance/2.0) {
        G4cout << "Point is on surface" << G4endl;
    } else if (distance < tolerance) {
        G4cout << "Point is near surface (within tolerance)" << G4endl;
    } else {
        G4cout << "Point is away from surface" << G4endl;
    }
}
```

### Geometry Validation

```cpp
#include "G4GeometryTolerance.hh"

void ValidateGeometry() {
    G4GeometryTolerance* geomTol = G4GeometryTolerance::GetInstance();
    G4double tolerance = geomTol->GetSurfaceTolerance();

    // Check if volumes overlap within tolerance
    G4double separation = CalculateMinimumSeparation();

    if (separation < -tolerance) {
        G4cerr << "ERROR: Volumes overlap beyond tolerance!" << G4endl;
    } else if (separation < 0) {
        G4cout << "WARNING: Volumes overlap within tolerance" << G4endl;
    } else if (separation < tolerance) {
        G4cout << "Volumes are touching (within tolerance)" << G4endl;
    } else {
        G4cout << "Volumes are properly separated" << G4endl;
    }
}
```

### Custom Distance Calculations

```cpp
class MyCustomSolid : public G4VSolid {
    G4double DistanceToSurface(const G4ThreeVector& p) const {
        G4GeometryTolerance* geomTol = G4GeometryTolerance::GetInstance();
        G4double kCarTolerance = geomTol->GetSurfaceTolerance();

        G4double distance = CalculateDistance(p);

        // Clamp small distances to zero within tolerance
        if (std::abs(distance) < kCarTolerance/2.0) {
            return 0.0;
        }

        return distance;
    }
};
```

### Angular Tolerance in Rotation Checks

```cpp
void CheckRotationAlignment(const G4RotationMatrix& rot1,
                           const G4RotationMatrix& rot2) {
    G4GeometryTolerance* geomTol = G4GeometryTolerance::GetInstance();
    G4double angularTol = geomTol->GetAngularTolerance();

    // Compare rotation matrices
    G4RotationMatrix diff = rot1.inverse() * rot2;
    G4double angle = diff.delta();  // Get rotation angle

    if (angle < angularTol) {
        G4cout << "Rotations are effectively identical" << G4endl;
    } else {
        G4cout << "Rotations differ by " << angle/deg << " degrees" << G4endl;
    }
}
```

### Radial Tolerance for Curved Surfaces

```cpp
class MyCylindricalDetector {
    void CheckRadialPosition(const G4ThreeVector& point) {
        G4GeometryTolerance* geomTol = G4GeometryTolerance::GetInstance();
        G4double radTol = geomTol->GetRadialTolerance();

        G4double r = std::sqrt(point.x()*point.x() + point.y()*point.y());
        G4double expectedRadius = 10.0*cm;

        if (std::abs(r - expectedRadius) < radTol) {
            G4cout << "Point is on cylindrical surface" << G4endl;
        }
    }
};
```

### Geometry Construction with Tolerance Awareness

```cpp
void ConstructDetector() {
    G4GeometryTolerance* geomTol = G4GeometryTolerance::GetInstance();
    G4double tolerance = geomTol->GetSurfaceTolerance();

    // When building geometry, ensure gaps/overlaps respect tolerance
    G4double detectorSpacing = 1.0*mm;

    // Ensure spacing is larger than tolerance to avoid touching volumes
    if (detectorSpacing < 10*tolerance) {
        G4cout << "WARNING: Detector spacing is close to tolerance" << G4endl;
        G4cout << "Consider increasing spacing to avoid geometry issues" << G4endl;
    }

    // Build geometry with proper spacing
    for (int i = 0; i < nDetectors; ++i) {
        G4double position = i * detectorSpacing;
        PlaceDetector(position);
    }
}
```

### Debugging Geometry Issues

```cpp
void DiagnoseGeometryProblem(const G4ThreeVector& problemPoint) {
    G4GeometryTolerance* geomTol = G4GeometryTolerance::GetInstance();

    G4cout << "Geometry Tolerance Information:" << G4endl;
    G4cout << "  Surface tolerance: "
           << geomTol->GetSurfaceTolerance()/mm << " mm" << G4endl;
    G4cout << "  Angular tolerance: "
           << geomTol->GetAngularTolerance()/degree << " deg" << G4endl;
    G4cout << "  Radial tolerance: "
           << geomTol->GetRadialTolerance()/mm << " mm" << G4endl;

    // Check if problem might be tolerance-related
    G4VPhysicalVolume* volume = navigator->LocateGlobalPointAndSetup(problemPoint);
    if (!volume) {
        G4cout << "Point may be in a tolerance gap between volumes" << G4endl;
    }
}
```

## Best Practices

### 1. Use Singleton Pattern Correctly

```cpp
// GOOD: Get instance when needed
G4double tolerance = G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();

// AVOID: Don't store pointer long-term (singleton is thread-local)
class MyClass {
    G4GeometryTolerance* fTolerance;  // Not recommended

    MyClass() {
        fTolerance = G4GeometryTolerance::GetInstance();  // May be wrong thread
    }
};

// BETTER: Get instance when needed
class MyClass {
    G4double GetTolerance() const {
        return G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();
    }
};
```

### 2. Respect Tolerance in Geometry

```cpp
// Ensure volume separations exceed tolerance
G4double minSeparation = 10 * G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();

// When placing volumes
G4double position = basePosition + minSeparation;
```

### 3. Use Appropriate Tolerance for Comparisons

```cpp
// For surface comparisons
G4double surfTol = G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();
if (std::abs(distance) < surfTol/2.0) {
    // On surface
}

// For angular comparisons
G4double angTol = G4GeometryTolerance::GetInstance()->GetAngularTolerance();
if (std::abs(angle) < angTol) {
    // Angles are effectively equal
}
```

### 4. Don't Try to Modify Tolerance

```cpp
// WRONG: Tolerance is set by G4GeometryManager only
// There's no public setter, and for good reason

// CORRECT: Design geometry to work with existing tolerance
// Or ensure world volume extent is appropriate when geometry is built
```

### 5. Be Aware of Scale

```cpp
// Tolerance depends on world size
// For small geometries (mm scale): tolerance ~ 1E-9 mm
// For large geometries (km scale): tolerance will be larger

// Design checks accordingly
void CheckGeometry() {
    G4double tol = G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();
    G4cout << "Working with tolerance: " << tol << G4endl;

    // Adjust validation criteria based on tolerance
    G4double minAllowableGap = 10 * tol;  // Adaptive to scale
}
```

## Common Pitfalls

### 1. Assuming Fixed Tolerance Value

```cpp
// WRONG: Assuming tolerance is always 1E-9 mm
if (distance < 1.0e-9*mm) {
    // May be incorrect for large geometries
}

// CORRECT: Query actual tolerance
G4double tol = G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();
if (distance < tol/2.0) {
    // Works for any geometry scale
}
```

### 2. Geometry Too Close to Tolerance

```cpp
// DANGEROUS: Gaps/overlaps near tolerance level
G4double gap = 2.0 * geomTolerance->GetSurfaceTolerance();
// May cause tracking issues

// SAFE: Gaps well above tolerance
G4double gap = 100.0 * geomTolerance->GetSurfaceTolerance();
```

### 3. Mixing Different Tolerances

```cpp
// WRONG: Using arbitrary tolerance
const G4double myTolerance = 1.0e-6*mm;
if (distance < myTolerance) { ... }

// CORRECT: Use geometry tolerance
G4double geomTol = G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();
if (distance < geomTol) { ... }
```

### 4. Forgetting Thread-Local Nature

```cpp
// In multithreaded mode, each thread has its own instance
// Usually they're identical, but be aware

// WRONG in MT: Storing instance from master thread
G4GeometryTolerance* masterTol = G4GeometryTolerance::GetInstance();
// Later in worker thread...
// masterTol may not be valid!

// CORRECT: Always get instance in current thread
G4GeometryTolerance* tol = G4GeometryTolerance::GetInstance();
```

## Thread Safety

**Thread-Safe**: Yes (thread-local singleton)

**Multithreading Behavior**:
- Each thread has its own `G4GeometryTolerance` instance (thread-local)
- Instances are typically identical across threads
- Initialized independently for each thread
- No synchronization needed (read-only after initialization)

**Usage in Multithreaded Mode**:

```cpp
// Master thread initialization
void MasterThread() {
    // Geometry manager sets tolerance based on world extent
    // This happens automatically during geometry construction
}

// Worker thread access
void WorkerThread() {
    // Each worker gets its own instance with same values
    G4GeometryTolerance* tol = G4GeometryTolerance::GetInstance();
    G4double surfTol = tol->GetSurfaceTolerance();
    // Use tolerance safely
}
```

**Key Points**:
1. Thread-local storage ensures thread safety
2. No locking required for access
3. Each thread's instance initialized independently
4. Values should be identical across threads (set by geometry manager)

## Implementation Details

### Tolerance Calculation

The surface tolerance is calculated based on world extent:
```
tolerance = f(worldExtent)
```

The exact formula ensures:
- Appropriate precision for geometry scale
- Sufficient accuracy for tracking
- Reasonable performance (not too strict)

### Default Values

If tolerance is not set explicitly:
- **Surface tolerance**: 1E-9 mm
- **Angular tolerance**: 1E-9 radians
- **Radial tolerance**: 1E-9 mm

### Initialization

Tolerance is set automatically by G4GeometryManager when geometry is closed:
```cpp
// Internal to G4GeometryManager
void G4GeometryManager::CloseGeometry(...) {
    G4double worldExtent = CalculateWorldExtent();
    G4GeometryTolerance::GetInstance()->SetSurfaceTolerance(worldExtent);
}
```

### One-Time Setting

The tolerance can only be set once (enforced by `fInitialised` flag). Subsequent attempts to set tolerance are ignored. This ensures consistency throughout a run.

## Advanced Usage

### Tolerance-Aware Solid Implementation

```cpp
class MyCustomSolid : public G4VSolid {
private:
    static constexpr G4double kCarTolerance =
        G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();

    EInside Inside(const G4ThreeVector& p) const override {
        G4double distance = DistanceToSurface(p);

        if (distance < -kCarTolerance/2.0) {
            return kInside;
        } else if (distance > kCarTolerance/2.0) {
            return kOutside;
        } else {
            return kSurface;
        }
    }
};
```

### Geometry Overlap Checker

```cpp
class GeometryOverlapChecker {
public:
    void CheckForOverlaps(G4VPhysicalVolume* volume) {
        G4double tolerance =
            G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();

        // Check for overlaps exceeding tolerance
        G4bool checkOverlaps = volume->CheckOverlaps(
            1000,           // Number of points
            tolerance,      // Tolerance
            true           // Verbose
        );

        if (checkOverlaps) {
            G4cout << "Overlaps detected beyond tolerance!" << G4endl;
        }
    }
};
```

## Performance Considerations

### 1. Caching Tolerance Values

```cpp
// If you use tolerance frequently, cache it
class MyDetector {
private:
    const G4double fTolerance;

public:
    MyDetector()
        : fTolerance(G4GeometryTolerance::GetInstance()->GetSurfaceTolerance())
    {}

    void ProcessPoint(const G4ThreeVector& p) {
        // Use cached value (fast)
        if (Distance(p) < fTolerance) { ... }
    }
};
```

### 2. Avoid Repeated Calls

```cpp
// INEFFICIENT: Getting instance repeatedly
for (int i = 0; i < 1000000; ++i) {
    if (distance[i] < G4GeometryTolerance::GetInstance()->GetSurfaceTolerance()) {
        // ...
    }
}

// EFFICIENT: Cache tolerance
G4double tol = G4GeometryTolerance::GetInstance()->GetSurfaceTolerance();
for (int i = 0; i < 1000000; ++i) {
    if (distance[i] < tol) {
        // ...
    }
}
```

## Related Classes

- **G4GeometryManager**: Sets tolerance based on world extent (friend class)
- **G4VSolid**: Uses tolerance in Inside(), DistanceToIn(), DistanceToOut()
- **G4Navigator**: Uses tolerance for boundary crossing decisions
- **G4VPhysicalVolume**: CheckOverlaps() uses tolerance

## See Also

- [G4GeometryManager Documentation](G4GeometryManager.md)
- [G4VSolid Documentation](G4VSolid.md)
- [Geant4 User Guide: Geometry Tolerance](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomTolerances.html)
