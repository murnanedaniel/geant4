# G4Transform3D API Documentation

## Overview

`G4Transform3D` represents a general 3D transformation combining rotation and translation. It is an alias to CLHEP's `HepGeom::Transform3D` class and provides comprehensive functionality for geometric transformations in Geant4 detector construction, particle tracking, and coordinate system conversions.

The class supports composition of transformations, inverse operations, and includes specialized types for rotations, translations, reflections, and scaling operations.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/G4Transform3D.hh`
**Implementation:** CLHEP library (`CLHEP/Geometry/Transform3D.h`)
:::

## Type Definitions

### Core Transformation
`source/global/HEPGeometry/include/G4Transform3D.hh:33`

```cpp
using G4Transform3D = HepGeom::Transform3D;
```

**Purpose:** General 3D transformation (rotation + translation)

**Representation:** 4×3 affine transformation matrix
```
| Rxx Rxy Rxz Tx |
| Ryx Ryy Ryz Ty |
| Rzx Rzy Rzz Tz |
```

Where R is a 3×3 rotation matrix and T is a 3D translation vector.

### Rotation Transformations

#### General Rotation
`source/global/HEPGeometry/include/G4Transform3D.hh:35`

```cpp
using G4Rotate3D = HepGeom::Rotate3D;
```

**Purpose:** Rotation around arbitrary axis

**Constructor:**
```cpp
G4Rotate3D(G4double angle, const G4ThreeVector& axis);
```

**Parameters:**
- `angle`: Rotation angle (in radians)
- `axis`: Rotation axis (automatically normalized)

**Example:**
```cpp
// Rotate 45 degrees around axis (1,1,0)
G4ThreeVector axis(1, 1, 0);
G4Rotate3D rotation(45*deg, axis);

// Apply to point
G4ThreeVector point(10*cm, 0, 0);
G4ThreeVector rotated = rotation * point;
```

#### Axis-Specific Rotations
`source/global/HEPGeometry/include/G4Transform3D.hh:36-38`

```cpp
using G4RotateX3D = HepGeom::RotateX3D;  // Rotation around X-axis
using G4RotateY3D = HepGeom::RotateY3D;  // Rotation around Y-axis
using G4RotateZ3D = HepGeom::RotateZ3D;  // Rotation around Z-axis
```

**Purpose:** Optimized rotations around principal axes

**Constructors:**
```cpp
G4RotateX3D(G4double angle);  // Rotate around X-axis
G4RotateY3D(G4double angle);  // Rotate around Y-axis
G4RotateZ3D(G4double angle);  // Rotate around Z-axis
```

**Rotation Matrices:**
```cpp
// X-axis: [1   0      0  ]
//         [0  cos  -sin ]
//         [0  sin   cos ]

// Y-axis: [ cos  0  sin ]
//         [  0   1   0  ]
//         [-sin  0  cos ]

// Z-axis: [cos -sin  0 ]
//         [sin  cos  0 ]
//         [ 0    0   1 ]
```

**Example:**
```cpp
// Rotate 90 degrees around Z-axis
G4RotateZ3D rotZ(90*deg);

// Compound rotation: Euler angles
G4Transform3D eulerRot = G4RotateZ3D(phi) *
                         G4RotateY3D(theta) *
                         G4RotateZ3D(psi);
```

### Translation Transformations

#### General Translation
`source/global/HEPGeometry/include/G4Transform3D.hh:40`

```cpp
using G4Translate3D = HepGeom::Translate3D;
```

**Purpose:** Translation in 3D space

**Constructor:**
```cpp
G4Translate3D(const G4ThreeVector& v);
G4Translate3D(G4double x, G4double y, G4double z);
```

**Example:**
```cpp
// Translate by vector
G4ThreeVector displacement(10*cm, 5*cm, 0);
G4Translate3D translation(displacement);

// Translate by components
G4Translate3D translation2(10*cm, 5*cm, 0);
```

#### Axis-Specific Translations
`source/global/HEPGeometry/include/G4Transform3D.hh:41-43`

```cpp
using G4TranslateX3D = HepGeom::TranslateX3D;  // Translation along X
using G4TranslateY3D = HepGeom::TranslateY3D;  // Translation along Y
using G4TranslateZ3D = HepGeom::TranslateZ3D;  // Translation along Z
```

**Purpose:** Single-axis translations

**Constructors:**
```cpp
G4TranslateX3D(G4double dx);  // Move along X
G4TranslateY3D(G4double dy);  // Move along Y
G4TranslateZ3D(G4double dz);  // Move along Z
```

**Example:**
```cpp
// Move 10 cm along Z-axis
G4TranslateZ3D moveUp(10*cm);

// Equivalent to
G4Translate3D moveUp2(0, 0, 10*cm);
```

### Reflection Transformations

#### General Reflection
`source/global/HEPGeometry/include/G4Transform3D.hh:45`

```cpp
using G4Reflect3D = HepGeom::Reflect3D;
```

**Purpose:** Reflection through arbitrary plane

**Constructor:**
```cpp
G4Reflect3D(G4double a, G4double b, G4double c, G4double d);
```

**Parameters:** Plane equation ax + by + cz + d = 0

**Example:**
```cpp
// Reflect through plane x + y = 0
G4Reflect3D reflection(1, 1, 0, 0);
```

#### Axis-Specific Reflections
`source/global/HEPGeometry/include/G4Transform3D.hh:46-48`

```cpp
using G4ReflectX3D = HepGeom::ReflectX3D;  // Reflect through YZ plane
using G4ReflectY3D = HepGeom::ReflectY3D;  // Reflect through XZ plane
using G4ReflectZ3D = HepGeom::ReflectZ3D;  // Reflect through XY plane
```

**Purpose:** Reflections through principal planes

**Constructors:**
```cpp
G4ReflectX3D(G4double x = 0);  // Reflect through YZ plane at x
G4ReflectY3D(G4double y = 0);  // Reflect through XZ plane at y
G4ReflectZ3D(G4double z = 0);  // Reflect through XY plane at z
```

**Reflection Matrices:**
```cpp
// X-reflection: [-1  0  0]
//               [ 0  1  0]
//               [ 0  0  1]

// Y-reflection: [ 1  0  0]
//               [ 0 -1  0]
//               [ 0  0  1]

// Z-reflection: [ 1  0  0]
//               [ 0  1  0]
//               [ 0  0 -1]
```

**Example:**
```cpp
// Mirror through XY plane
G4ReflectZ3D mirror;

G4ThreeVector point(1*cm, 2*cm, 3*cm);
G4ThreeVector mirrored = mirror * point;
// Result: (1*cm, 2*cm, -3*cm)

// Reflect through plane at z = 10*cm
G4ReflectZ3D mirrorShifted(10*cm);
```

### Scaling Transformations

#### General Scaling
`source/global/HEPGeometry/include/G4Transform3D.hh:50`

```cpp
using G4Scale3D = HepGeom::Scale3D;
```

**Purpose:** Non-uniform scaling

**Constructor:**
```cpp
G4Scale3D(G4double sx, G4double sy, G4double sz);
```

**Example:**
```cpp
// Scale by 2x in X, 1x in Y, 0.5x in Z
G4Scale3D scale(2.0, 1.0, 0.5);
```

#### Axis-Specific Scaling
`source/global/HEPGeometry/include/G4Transform3D.hh:51-53`

```cpp
using G4ScaleX3D = HepGeom::ScaleX3D;  // Scale along X
using G4ScaleY3D = HepGeom::ScaleY3D;  // Scale along Y
using G4ScaleZ3D = HepGeom::ScaleZ3D;  // Scale along Z
```

**Purpose:** Single-axis scaling

**Constructors:**
```cpp
G4ScaleX3D(G4double sx);  // Scale X
G4ScaleY3D(G4double sy);  // Scale Y
G4ScaleZ3D(G4double sz);  // Scale Z
```

::: warning Geometry Caution
Scaling operations should be used carefully in Geant4 geometry as they may break navigation. Prefer explicit dimensions in solid constructors.
:::

## Core Methods

### Constructors

```cpp
// Identity transformation
G4Transform3D();

// From rotation and translation
G4Transform3D(const G4RotationMatrix& rotation,
              const G4ThreeVector& translation);

// Copy constructor
G4Transform3D(const G4Transform3D& other);
```

### Accessors

```cpp
// Get rotation component as 3x3 matrix
G4RotationMatrix getRotation() const;

// Get translation component
G4ThreeVector getTranslation() const;

// Access matrix elements
G4double xx() const;  // Row 0, Col 0
G4double xy() const;  // Row 0, Col 1
G4double xz() const;  // Row 0, Col 2
G4double yx() const;  // Row 1, Col 0
// ... and so on

G4double dx() const;  // Translation X
G4double dy() const;  // Translation Y
G4double dz() const;  // Translation Z
```

### Operations

```cpp
// Inverse transformation
G4Transform3D inverse() const;

// Identity check
G4bool isIdentity() const;

// Transformation composition
G4Transform3D operator * (const G4Transform3D& other) const;

// Transform point
G4Point3D operator * (const G4Point3D& point) const;

// Transform vector (rotation only, no translation)
G4Vector3D operator * (const G4Vector3D& vector) const;

// Transform normal (inverse transpose of rotation)
G4Normal3D operator * (const G4Normal3D& normal) const;
```

## Usage Examples

### Basic Transformations

```cpp
#include "G4Transform3D.hh"
#include "G4ThreeVector.hh"
#include "G4RotationMatrix.hh"

// Identity transformation
G4Transform3D identity;

// Pure rotation (30 degrees around Z)
G4RotateZ3D rotation(30*deg);

// Pure translation
G4ThreeVector displacement(10*cm, 5*cm, 0);
G4Translate3D translation(displacement);

// Combined transformation: rotate then translate
G4Transform3D combined = translation * rotation;

// Apply to point
G4ThreeVector point(5*cm, 0, 0);
G4ThreeVector transformed = combined * point;
```

### Detector Placement

```cpp
// Position and orient a detector module
void PlaceDetectorModule(G4LogicalVolume* module,
                        G4LogicalVolume* mother,
                        G4int copyNo,
                        G4double angle,
                        G4double radius) {
    // Create transformation
    G4Transform3D transform =
        G4TranslateX3D(radius) *      // Move radially outward
        G4RotateZ3D(angle);           // Rotate to angular position

    // Place physical volume
    new G4PVPlacement(
        transform,                     // Combined transformation
        module,                        // Logical volume
        "DetectorModule",              // Name
        mother,                        // Mother volume
        false,                         // No boolean
        copyNo                         // Copy number
    );
}

// Usage: Place 8 modules in a ring
for (G4int i = 0; i < 8; ++i) {
    G4double phi = i * 45*deg;
    PlaceDetectorModule(moduleLogical, worldLogical, i, phi, 50*cm);
}
```

### Coordinate System Transformations

```cpp
// Transform between local and global coordinates
class DetectorCoordinates {
public:
    DetectorCoordinates(const G4Transform3D& localToGlobal)
        : fLocalToGlobal(localToGlobal),
          fGlobalToLocal(localToGlobal.inverse()) {}

    G4ThreeVector LocalToGlobal(const G4ThreeVector& local) const {
        return fLocalToGlobal * local;
    }

    G4ThreeVector GlobalToLocal(const G4ThreeVector& global) const {
        return fGlobalToLocal * global;
    }

private:
    G4Transform3D fLocalToGlobal;
    G4Transform3D fGlobalToLocal;
};

// Usage
G4Transform3D detectorTransform =
    G4Translate3D(0, 0, 100*cm) * G4RotateY3D(30*deg);

DetectorCoordinates coords(detectorTransform);

G4ThreeVector localPoint(1*cm, 0, 0);
G4ThreeVector globalPoint = coords.LocalToGlobal(localPoint);
```

### Complex Geometry Assembly

```cpp
// Build a complex detector assembly
void BuildTrackerStation(G4LogicalVolume* mother,
                        const G4ThreeVector& position,
                        G4double rotationAngle) {
    // Base transformation for station
    G4Transform3D stationTransform =
        G4Translate3D(position) * G4RotateZ3D(rotationAngle);

    // Place sensor layers
    for (G4int layer = 0; layer < 4; ++layer) {
        G4double z = layer * 10*mm;

        // Layer transformation relative to station
        G4Transform3D layerTransform =
            stationTransform * G4TranslateZ3D(z);

        // Rotate alternate layers by 90 degrees
        if (layer % 2 == 1) {
            layerTransform = layerTransform * G4RotateZ3D(90*deg);
        }

        new G4PVPlacement(
            layerTransform,
            sensorLogical,
            "TrackerLayer",
            mother,
            false,
            layer
        );
    }
}
```

### Transformation Inversion

```cpp
// Find point in mother coordinates given daughter coordinates
G4ThreeVector FindGlobalPosition(
    const G4VPhysicalVolume* daughterPV,
    const G4ThreeVector& localPoint) {

    // Get daughter transformation
    G4Transform3D daughterTransform(
        daughterPV->GetRotation(),
        daughterPV->GetTranslation()
    );

    // Transform to global
    return daughterTransform * localPoint;
}

// Inverse: find local coordinates
G4ThreeVector FindLocalPosition(
    const G4VPhysicalVolume* daughterPV,
    const G4ThreeVector& globalPoint) {

    // Get daughter transformation
    G4Transform3D daughterTransform(
        daughterPV->GetRotation(),
        daughterPV->GetTranslation()
    );

    // Invert and transform
    G4Transform3D globalToLocal = daughterTransform.inverse();
    return globalToLocal * globalPoint;
}
```

### Reflection Geometry

```cpp
// Create reflected detector geometry
void PlaceReflectedDetector(G4LogicalVolume* detector,
                           G4LogicalVolume* world) {
    // Original position
    G4Transform3D original =
        G4Translate3D(50*cm, 0, 0) * G4RotateY3D(20*deg);

    new G4PVPlacement(original, detector, "Detector_A",
                     world, false, 0);

    // Reflected position (mirror through YZ plane)
    G4Transform3D reflected = G4ReflectX3D() * original;

    new G4PVPlacement(reflected, detector, "Detector_B",
                     world, false, 1);
}
```

### Euler Angle Rotations

```cpp
// Convert Euler angles to transformation
G4Transform3D EulerRotation(G4double phi, G4double theta, G4double psi) {
    // ZYZ convention
    return G4RotateZ3D(phi) *
           G4RotateY3D(theta) *
           G4RotateZ3D(psi);
}

// Usage
G4Transform3D rotation = EulerRotation(30*deg, 45*deg, 60*deg);
```

### Decomposition and Analysis

```cpp
// Analyze a transformation
void AnalyzeTransformation(const G4Transform3D& transform) {
    // Extract components
    G4RotationMatrix rotation = transform.getRotation();
    G4ThreeVector translation = transform.getTranslation();

    G4cout << "Translation: " << translation << G4endl;

    // Get matrix elements
    G4cout << "Rotation matrix:" << G4endl;
    G4cout << transform.xx() << " " << transform.xy() << " "
           << transform.xz() << G4endl;
    G4cout << transform.yx() << " " << transform.yy() << " "
           << transform.yz() << G4endl;
    G4cout << transform.zx() << " " << transform.zy() << " "
           << transform.zz() << G4endl;

    // Check for identity
    if (transform.isIdentity()) {
        G4cout << "This is an identity transformation" << G4endl;
    }
}
```

## Common Patterns

### Chaining Transformations

```cpp
// Build complex transformation by chaining
G4Transform3D BuildComplexTransform() {
    return G4Translate3D(0, 0, 100*cm) *  // Move up
           G4RotateY3D(30*deg) *          // Tilt
           G4Translate3D(50*cm, 0, 0) *   // Move radially
           G4RotateZ3D(45*deg);           // Rotate azimuthally
}

// Order matters! Transformations applied right-to-left
```

### Parameterized Placement

```cpp
// Generate transformations for parameterized volumes
class MyParameterisation : public G4VPVParameterisation {
public:
    void ComputeTransformation(G4int copyNo,
                              G4VPhysicalVolume* physVol) const override {
        // Compute transformation for this copy
        G4double angle = copyNo * 20*deg;
        G4double radius = 30*cm + copyNo * 5*cm;

        G4Transform3D transform =
            G4RotateZ3D(angle) * G4TranslateX3D(radius);

        // Set transformation
        physVol->SetRotation(new G4RotationMatrix(transform.getRotation()));
        physVol->SetTranslation(transform.getTranslation());
    }
};
```

## Thread Safety

`G4Transform3D` and related transformation types are:
- **Value types:** Copied, not shared between threads
- **Immutable operations:** Operations return new transformations
- **Thread-safe:** Safe for concurrent use without synchronization

Each thread can create and manipulate transformations independently.

## Performance Notes

1. **Specialized constructors:** Use axis-specific types (`G4RotateZ3D`, `G4TranslateX3D`) when possible - they're optimized
2. **Transformation caching:** Cache frequently-used transformations
3. **Inverse operations:** Computing inverse has computational cost - cache if used repeatedly
4. **Matrix multiplication:** Chaining many transformations creates temporary objects - prefer single combined transformation when possible

## Related Classes

- [G4Point3D](g4point3d.md) - 3D points transformed by `G4Transform3D`
- [G4Vector3D](g4vector3d.md) - 3D vectors (rotation only)
- [G4Normal3D](g4normal3d.md) - Surface normals (inverse transpose rotation)
- [G4RotationMatrix](g4rotationmatrix.md) - 3×3 rotation matrices
- [G4ThreeVector](g4threevector.md) - 3D vector class
- [G4VPhysicalVolume](g4vphysicalvolume.md) - Physical volume placement

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- [geomdefs](geomdefs.md) - Geometry definitions and constants
- CLHEP Transform3D documentation - Detailed CLHEP implementation

---

::: info Source Reference
Type definitions in:
- Header: `source/global/HEPGeometry/include/G4Transform3D.hh`
- Implementation: CLHEP library (`CLHEP/Geometry/Transform3D.h`)
:::
