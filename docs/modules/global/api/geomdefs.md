# geomdefs.hh - Geometry Definitions API Documentation

## Overview

`geomdefs.hh` defines fundamental constants, enumerations, and type definitions used throughout the Geant4 geometry system. This header provides the basic vocabulary for describing geometric axes, spatial relationships, volume types, and navigation parameters that are essential for detector geometry construction and particle tracking.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/geomdefs.hh`
:::

## Constants

### kInfinity
`source/global/HEPGeometry/include/geomdefs.hh:41`

```cpp
static const G4double kInfinity = 9.0E99;
```

**Purpose:** Represents an infinite distance value

**Usage:**
- Returned when ray-solid intersection calculations find no intersection
- Used as default/maximum distance in geometry calculations
- Indicates unbounded regions or undefined distances

**Example:**
```cpp
G4double distance = solid->DistanceToIn(point, direction);
if (distance == kInfinity) {
    G4cout << "No intersection found" << G4endl;
}
```

### kMinExitingNormalCosine
`source/global/HEPGeometry/include/geomdefs.hh:45`

```cpp
static const double kMinExitingNormalCosine = 1E-3;
```

**Purpose:** Minimum cosine threshold for surface normal optimization

**Usage:**
- Used in optimizations when checking if a track is exiting a surface
- Determines if the angle between surface normal and track direction is sufficiently large
- Applied in navigation and boundary crossing calculations

**Details:**
- Value of 1E-3 corresponds to approximately 89.94 degrees
- Particles moving nearly parallel to surface (angle > ~90°) trigger special handling
- Improves numerical stability at grazing angles

### kHistoryMax
`source/global/HEPGeometry/include/geomdefs.hh:92`

```cpp
static const G4int kHistoryMax = 15;
```

**Purpose:** Default maximum depth of navigation history stack

**Usage:**
- Initial size of the navigation history (volume hierarchy depth)
- Typical geometries have nesting depths well below this limit
- Stack automatically grows if exceeded using `kHistoryStride`

**Example Hierarchy:**
```
World (0)
  └─ Detector (1)
      └─ Layer (2)
          └─ Module (3)
              └─ Sensor (4)
                  └─ Pixel (5)  // Depth = 5
```

### kHistoryStride
`source/global/HEPGeometry/include/geomdefs.hh:96`

```cpp
static const G4int kHistoryStride = 16;
```

**Purpose:** Increment size when navigation history needs to grow

**Usage:**
- When navigation depth exceeds current history size, add `kHistoryStride` slots
- Reduces frequency of memory reallocation in deep geometries
- Ensures efficient growth for complex detector hierarchies

### kNavigatorVoxelStackMax
`source/global/HEPGeometry/include/geomdefs.hh:100`

```cpp
static const G4int kNavigatorVoxelStackMax = 3;
```

**Purpose:** Maximum depth of voxel navigation stack

**Usage:**
- Limits voxelization hierarchy depth during navigation
- Stack does not resize (fixed maximum)
- Voxels optimize navigation in volumes with many daughter volumes

::: warning Fixed Size
Unlike navigation history, voxel stack does not grow dynamically. Deep voxel hierarchies may hit this limit.
:::

## Enumerations

### EAxis
`source/global/HEPGeometry/include/geomdefs.hh:53-62`

```cpp
enum EAxis
{
  kXAxis,      // Cartesian X-axis
  kYAxis,      // Cartesian Y-axis
  kZAxis,      // Cartesian Z-axis
  kRho,        // Radial axis in cylindrical coordinates
  kRadial3D,   // Radial axis in spherical coordinates
  kPhi,        // Azimuthal angle (phi) in cylindrical/spherical
  kUndefined   // Undefined or unspecified axis
};
```

**Purpose:** Specifies coordinate axes for geometric operations

**Values:**

| Value | Description | Coordinate System |
|-------|-------------|------------------|
| `kXAxis` | X-axis | Cartesian (x, y, z) |
| `kYAxis` | Y-axis | Cartesian (x, y, z) |
| `kZAxis` | Z-axis | Cartesian (x, y, z) |
| `kRho` | Radial distance from Z-axis | Cylindrical (ρ, φ, z) |
| `kRadial3D` | Radial distance from origin | Spherical (r, θ, φ) |
| `kPhi` | Azimuthal angle | Cylindrical/Spherical |
| `kUndefined` | Not defined or not applicable | N/A |

**Common Uses:**
- Replica volume replication axis specification
- Parameterized volume parameter selection
- Geometry calculation axis selection
- Symmetry axis definition

**Example:**
```cpp
// Create replicas along Z-axis
G4VPhysicalVolume* replica = new G4PVReplica(
    "LayerReplica",        // Name
    layerLogical,          // Logical volume
    detectorLogical,       // Mother volume
    kZAxis,                // Replication axis
    10,                    // Number of replicas
    5.0*cm                 // Width
);

// Create cylindrical replicas
G4VPhysicalVolume* phiReplica = new G4PVReplica(
    "PhiSegment",
    segmentLogical,
    cylinderLogical,
    kPhi,                  // Replicate in phi
    16,                    // 16 segments
    2*pi/16                // Angular width
);
```

### EInside
`source/global/HEPGeometry/include/geomdefs.hh:66-71`

```cpp
enum EInside
{
  kOutside,    // Point is outside solid
  kSurface,    // Point is on surface (within tolerance)
  kInside      // Point is inside solid
};
```

**Purpose:** Return codes for point-solid containment queries

**Values:**

| Value | Description | Meaning |
|-------|-------------|---------|
| `kOutside` | Outside | Point is definitively outside the solid volume |
| `kSurface` | On Surface | Point is within numerical tolerance of the surface |
| `kInside` | Inside | Point is definitively inside the solid volume |

**Usage:**
- Returned by `G4VSolid::Inside(const G4ThreeVector& p)`
- Critical for navigation, tracking, and geometry validation
- Surface tolerance typically ~1E-9 mm

**Example:**
```cpp
G4ThreeVector point(10*cm, 5*cm, 0);
EInside location = solid->Inside(point);

switch(location) {
    case kInside:
        G4cout << "Point is inside the solid" << G4endl;
        // Continue tracking
        break;
    case kSurface:
        G4cout << "Point is on the boundary" << G4endl;
        // Handle boundary crossing
        break;
    case kOutside:
        G4cout << "Point is outside the solid" << G4endl;
        // Error or special case
        break;
}
```

**Boundary Detection:**
```cpp
// Check if particle is crossing a boundary
EInside preStepLocation = solid->Inside(preStepPoint);
EInside postStepLocation = solid->Inside(postStepPoint);

if (preStepLocation == kInside && postStepLocation == kOutside) {
    G4cout << "Particle exiting volume" << G4endl;
}
```

::: tip Numerical Tolerance
The `kSurface` state accounts for floating-point precision. Points within ~1E-9 mm of the mathematical surface are considered "on surface".
:::

### EVolume
`source/global/HEPGeometry/include/geomdefs.hh:82-88`

```cpp
enum EVolume
{
  kNormal,         // Normal placement (G4PVPlacement)
  kReplica,        // Replicated volume (G4PVReplica)
  kParameterised,  // Parameterized volume (G4PVParameterised)
  kExternal        // External/special volume type
};
```

**Purpose:** Identifies the type of physical volume placement

**Values:**

| Value | Description | Class | Navigation |
|-------|-------------|-------|------------|
| `kNormal` | Standard placement | `G4PVPlacement` | Direct transformation |
| `kReplica` | Replicated placement | `G4PVReplica` | Formula-based positioning |
| `kParameterised` | Parameterized placement | `G4PVParameterised` | User-computed positioning |
| `kExternal` | External/special | Various | Custom handling |

**Details:**

**kNormal** - Conventional positioning
- Each volume placed with explicit transformation
- Full flexibility in position and rotation
- Suitable for small numbers of volumes
- Example: Main detector components

**kReplica** - Optimized replication
- Multiple copies along single axis with regular spacing
- Distances and locations computed with simple formulas
- Very efficient for regular arrays
- Mother volume must also be checked during navigation
- Example: Calorimeter layers, detector strips

**kParameterised** - General parameterization
- Arbitrary number of copies with computed transformations
- User provides parameterization class
- Distances computed after parameterization application
- Example: Non-uniform detector arrays, variable-sized components

**kExternal** - Special cases
- Reserved for external/plugin volume types
- Custom navigation handling

**Example:**
```cpp
// Normal placement
G4VPhysicalVolume* normalVol = new G4PVPlacement(
    rotation,              // Rotation
    position,              // Position
    logicalVol,            // Logical volume
    "Detector",            // Name
    motherLogical,         // Mother
    false,                 // No boolean
    0                      // Copy number
);
// Type: kNormal

// Replica placement
G4VPhysicalVolume* replicaVol = new G4PVReplica(
    "Layer",               // Name
    layerLogical,          // Logical volume
    motherLogical,         // Mother
    kZAxis,                // Axis
    50,                    // Number of copies
    10*mm                  // Width
);
// Type: kReplica - optimized navigation

// Parameterized placement
class MyParam : public G4VPVParameterisation {
    void ComputeTransformation(G4int copyNo,
                              G4VPhysicalVolume* vol) const override {
        // Custom positioning logic
        G4double z = ComputeZPosition(copyNo);
        vol->SetTranslation(G4ThreeVector(0, 0, z));
    }
    // ... more methods
};

G4VPhysicalVolume* paramVol = new G4PVParameterised(
    "ParamCell",           // Name
    cellLogical,           // Logical volume
    motherLogical,         // Mother
    kZAxis,                // Axis
    100,                   // Number of copies
    new MyParam()          // Parameterization
);
// Type: kParameterised
```

**Navigation Impact:**
```cpp
// Navigator handles different types differently
EVolume volumeType = physVol->VolumeType();

switch(volumeType) {
    case kReplica:
        // Use formula-based navigation
        // Check mother volume boundaries
        ComputeReplicaTransformation(copyNo);
        break;
    case kParameterised:
        // Apply parameterization then navigate
        parameterisation->ComputeTransformation(copyNo, physVol);
        break;
    case kNormal:
        // Direct transformation lookup
        break;
}
```

## Common Use Cases

### Geometry Construction

```cpp
#include "geomdefs.hh"

// Building a layered detector with replicas
void BuildLayeredDetector() {
    // Create layers along Z-axis
    G4VPhysicalVolume* layers = new G4PVReplica(
        "DetectorLayer",
        layerLogical,
        worldLogical,
        kZAxis,           // Use EAxis enum
        20,
        5*cm
    );

    // Create phi segments
    G4VPhysicalVolume* segments = new G4PVReplica(
        "PhiSegment",
        segmentLogical,
        layerLogical,
        kPhi,             // Use EAxis enum
        8,
        45*deg
    );
}
```

### Point Location Testing

```cpp
#include "geomdefs.hh"

bool IsPointInDetector(G4VSolid* solid, const G4ThreeVector& point) {
    EInside result = solid->Inside(point);

    // Accept both inside and surface points
    return (result == kInside || result == kSurface);
}

void ValidateGeometry(G4VSolid* solid) {
    // Test points on a grid
    for (G4double x = -10*cm; x <= 10*cm; x += 1*cm) {
        for (G4double y = -10*cm; y <= 10*cm; y += 1*cm) {
            G4ThreeVector point(x, y, 0);
            EInside location = solid->Inside(point);

            if (location == kInside) {
                // Point inside - valid for particle placement
            }
        }
    }
}
```

### Distance Calculations

```cpp
#include "geomdefs.hh"

void CheckIntersections(G4VSolid* solid,
                       const G4ThreeVector& point,
                       const G4ThreeVector& direction) {
    G4double distanceIn = solid->DistanceToIn(point, direction);

    if (distanceIn == kInfinity) {
        G4cout << "Ray does not intersect solid" << G4endl;
        return;
    }

    G4cout << "Intersection at distance: "
           << distanceIn/mm << " mm" << G4endl;

    // Compute intersection point
    G4ThreeVector intersection = point + distanceIn * direction;

    // Verify it's on surface
    EInside check = solid->Inside(intersection);
    assert(check == kSurface);
}
```

### Volume Type Handling

```cpp
#include "geomdefs.hh"

void AnalyzeVolumeHierarchy(G4VPhysicalVolume* physVol) {
    EVolume type = physVol->VolumeType();

    switch(type) {
        case kNormal:
            G4cout << "Normal placement volume" << G4endl;
            G4cout << "Translation: "
                   << physVol->GetTranslation() << G4endl;
            break;

        case kReplica:
            G4cout << "Replicated volume" << G4endl;
            G4cout << "Optimized for regular arrays" << G4endl;
            // Get replica parameters
            EAxis axis;
            G4int nReplicas;
            G4double width, offset;
            G4bool consuming;
            physVol->GetReplicationData(axis, nReplicas,
                                       width, offset, consuming);
            G4cout << "Replicas: " << nReplicas
                   << " along axis " << axis << G4endl;
            break;

        case kParameterised:
            G4cout << "Parameterized volume" << G4endl;
            G4cout << "Uses custom parameterization" << G4endl;
            break;

        case kExternal:
            G4cout << "External volume type" << G4endl;
            break;
    }
}
```

### Navigation History

```cpp
#include "geomdefs.hh"

void PrintNavigationDepth(G4Navigator* navigator) {
    G4int depth = navigator->GetHistory()->GetDepth();

    if (depth > kHistoryMax) {
        G4cout << "Deep geometry - history was resized" << G4endl;
        G4cout << "Depth: " << depth
               << " (default max: " << kHistoryMax << ")" << G4endl;
    }

    // Print hierarchy
    for (G4int i = 0; i <= depth; ++i) {
        G4VPhysicalVolume* vol = navigator->GetHistory()->GetVolume(i);
        G4cout << "Level " << i << ": " << vol->GetName() << G4endl;
    }
}
```

## Thread Safety

All definitions in `geomdefs.hh` are:
- **Constants:** Thread-safe (const global variables)
- **Enumerations:** Thread-safe (compile-time values)
- No mutable state or dynamic allocation

Safe for concurrent access from multiple threads without synchronization.

## Related Classes

- [G4VSolid](g4vsolid.md) - Base solid class using `EInside` and `kInfinity`
- [G4VPhysicalVolume](g4vphysicalvolume.md) - Physical volumes using `EVolume`
- [G4PVReplica](g4pvreplica.md) - Replica volumes using `EAxis` and `kReplica`
- [G4PVParameterised](g4pvparameterised.md) - Parameterized volumes using `kParameterised`
- [G4Navigator](g4navigator.md) - Navigator using history constants
- [G4NavigationHistory](g4navigationhistory.md) - History stack using `kHistoryMax` and `kHistoryStride`

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- [Geometry Module](../../geometry/index.md) - Geometry system documentation
- [G4Transform3D](g4transform3d.md) - 3D transformations
- [G4Point3D](g4point3d.md) - 3D points

---

::: info Source Reference
Complete definitions in:
- Header: `source/global/HEPGeometry/include/geomdefs.hh`
:::
