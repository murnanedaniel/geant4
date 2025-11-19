# G4IntersectionSolid

**Base Class**: G4BooleanSolid (extends [G4VSolid](g4vsolid.md))
**Location**: `source/geometry/solids/Boolean/include/G4IntersectionSolid.hh`
**Source**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc`

## Overview

G4IntersectionSolid represents the intersection (AND operation) of two solids in Geant4. It creates a new solid containing only the space that is simultaneously inside both constituent solids A AND B. This Boolean operation is used to create complex shapes by defining the overlapping region of simpler primitives.

Intersection is particularly useful for defining regions where multiple constraints apply, such as creating shapes that must fit within multiple boundaries, or for defining active detector volumes that exist only where different geometric criteria are simultaneously satisfied.

## Key Features

- **Boolean AND Operation**: Creates solid containing only A ∩ B (overlap region)
- **Symmetric Operation**: A ∩ B = B ∩ A (commutative)
- **Efficient Bounds**: Bounding box is intersection of constituent boxes
- **Complex Distance Calculation**: Requires finding overlapping ranges
- **Max Iteration Protection**: Prevents infinite loops in edge cases
- **Volume Calculation**: Direct computation via Monte Carlo sampling

## Mathematical Definition

For a point **p** in space:
- **p** ∈ (A ∩ B) if and only if **p** ∈ A **AND** **p** ∈ B

Special cases:
- **Surface**: Point on boundary of intersection (on either A or B surface)
- **Empty Intersection**: If A and B don't overlap, intersection is empty
- **Edge Cases**: When A and B surfaces coincide, determines valid intersection surface

## Class Definition

```cpp
class G4IntersectionSolid : public G4BooleanSolid
{
  public:
    // Constructors
    G4IntersectionSolid(const G4String& pName,
                        G4VSolid* pSolidA,
                        G4VSolid* pSolidB);

    G4IntersectionSolid(const G4String& pName,
                        G4VSolid* pSolidA,
                        G4VSolid* pSolidB,
                        G4RotationMatrix* rotMatrix,
                        const G4ThreeVector& transVector);

    G4IntersectionSolid(const G4String& pName,
                        G4VSolid* pSolidA,
                        G4VSolid* pSolidB,
                        const G4Transform3D& transform);

    ~G4IntersectionSolid() override;

    // Core solid interface
    G4GeometryType GetEntityType() const override;
    G4VSolid* Clone() const override;

    void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
    G4bool CalculateExtent(const EAxis pAxis,
                          const G4VoxelLimits& pVoxelLimit,
                          const G4AffineTransform& pTransform,
                          G4double& pMin, G4double& pMax) const override;

    EInside Inside(const G4ThreeVector& p) const override;
    G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override;

    G4double DistanceToIn(const G4ThreeVector& p,
                         const G4ThreeVector& v) const override;
    G4double DistanceToIn(const G4ThreeVector& p) const override;

    G4double DistanceToOut(const G4ThreeVector& p,
                          const G4ThreeVector& v,
                          const G4bool calcNorm = false,
                          G4bool* validNorm = nullptr,
                          G4ThreeVector* n = nullptr) const override;
    G4double DistanceToOut(const G4ThreeVector& p) const override;

    void ComputeDimensions(G4VPVParameterisation* p,
                          const G4int n,
                          const G4VPhysicalVolume* pRep) override;

    void DescribeYourselfTo(G4VGraphicsScene& scene) const override;
    G4Polyhedron* CreatePolyhedron() const override;
};
```

## Constructors

### Basic Constructor

**Signature**:
```cpp
G4IntersectionSolid(const G4String& pName,
                    G4VSolid* pSolidA,
                    G4VSolid* pSolidB);
```
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:50-55`

Creates A ∩ B where both solids are in the same coordinate system.

**Parameters**:
- `pName` - Name for this boolean solid
- `pSolidA` - Pointer to first constituent solid
- `pSolidB` - Pointer to second constituent solid (no transformation)

**Example**:
```cpp
// Create intersection of cylinder and box
G4Tubs* cylinder = new G4Tubs("Cylinder", 0, 10*cm, 15*cm, 0, 2*pi);
G4Box* box = new G4Box("Box", 8*cm, 8*cm, 20*cm);

// Intersection creates shape that is inside BOTH solids
G4IntersectionSolid* intersection = new G4IntersectionSolid("Intersection",
                                                            cylinder, box);
// Result: Cylinder clipped by box boundaries
```

### Constructor with Rotation and Translation

**Signature**:
```cpp
G4IntersectionSolid(const G4String& pName,
                    G4VSolid* pSolidA,
                    G4VSolid* pSolidB,
                    G4RotationMatrix* rotMatrix,
                    const G4ThreeVector& transVector);
```
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:60-67`

Creates A ∩ B where solid B is transformed relative to solid A.

**Example**:
```cpp
// Create two overlapping spheres
G4Sphere* sphere1 = new G4Sphere("Sphere1", 0, 10*cm, 0, 2*pi, 0, pi);
G4Sphere* sphere2 = new G4Sphere("Sphere2", 0, 10*cm, 0, 2*pi, 0, pi);

// Offset second sphere to create lens shape
G4ThreeVector offset(8*cm, 0, 0);
G4IntersectionSolid* lens = new G4IntersectionSolid("Lens",
                                                    sphere1, sphere2,
                                                    nullptr, offset);
// Result: Lens-shaped overlap region
```

### Constructor with G4Transform3D

**Signature**:
```cpp
G4IntersectionSolid(const G4String& pName,
                    G4VSolid* pSolidA,
                    G4VSolid* pSolidB,
                    const G4Transform3D& transform);
```
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:73-79`

Creates A ∩ B using complete 3D transformation for B.

**Example**:
```cpp
// Create rotated intersection
G4Box* box1 = new G4Box("Box1", 10*cm, 10*cm, 10*cm);
G4Box* box2 = new G4Box("Box2", 10*cm, 10*cm, 10*cm);

// Rotate second box 45 degrees
G4RotationMatrix rot;
rot.rotateZ(45*deg);
G4Transform3D transform(rot, G4ThreeVector());

G4IntersectionSolid* rotatedIntersect = new G4IntersectionSolid("RotatedIntersect",
                                                                box1, box2, transform);
// Result: Octagonal prism (box corners clipped by rotated box)
```

## Bounding Volume Methods

### BoundingLimits()

**Signature**:
```cpp
void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:125-154`

Returns bounding box of the intersection.

**Algorithm**:
```cpp
void G4IntersectionSolid::BoundingLimits(G4ThreeVector& pMin,
                                         G4ThreeVector& pMax) const {
    G4ThreeVector minA, maxA, minB, maxB;
    fPtrSolidA->BoundingLimits(minA, maxA);
    fPtrSolidB->BoundingLimits(minB, maxB);

    // Intersection bounds = overlap of bounding boxes
    pMin.set(std::max(minA.x(), minB.x()),
             std::max(minA.y(), minB.y()),
             std::max(minA.z(), minB.z()));

    pMax.set(std::min(maxA.x(), maxB.x()),
             std::min(maxA.y(), maxB.y()),
             std::min(maxA.z(), maxB.z()));

    // Note: If pMin >= pMax, intersection is empty
}
```

**Precision**: This is exact for axis-aligned bounding boxes.

### CalculateExtent()

**Signature**:
```cpp
G4bool CalculateExtent(const EAxis pAxis,
                      const G4VoxelLimits& pVoxelLimit,
                      const G4AffineTransform& pTransform,
                      G4double& pMin, G4double& pMax) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:160-187`

Calculates extent along an axis for voxelization.

**Algorithm**:
```cpp
G4bool G4IntersectionSolid::CalculateExtent(...) const {
    G4double minA, maxA, minB, maxB;

    G4bool retA = fPtrSolidA->CalculateExtent(pAxis, pVoxelLimit,
                                              pTransform, minA, maxA);
    G4bool retB = fPtrSolidB->CalculateExtent(pAxis, pVoxelLimit,
                                              pTransform, minB, maxB);

    if (retA && retB) {
        // Both intersect voxel limits - return overlap
        pMin = std::max(minA, minB);
        pMax = std::min(maxA, maxB);
        return (pMax > pMin);  // True only if overlap exists
    }

    return false;  // No intersection if either doesn't intersect voxel
}
```

**Returns**: `true` only if both solids intersect voxel limits AND have overlapping extents

## Point Classification

### Inside()

**Signature**: `EInside Inside(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:193-203`

Determines whether point is inside, on surface, or outside (A ∩ B).

**Returns**:
- `kInside` - Point is inside both A and B
- `kSurface` - Point is on surface of intersection
- `kOutside` - Point is outside A or B (or both)

**Algorithm**:
```cpp
EInside G4IntersectionSolid::Inside(const G4ThreeVector& p) const {
    EInside positionA = fPtrSolidA->Inside(p);
    if (positionA == kOutside) { return kOutside; }  // Outside A => outside intersection

    EInside positionB = fPtrSolidB->Inside(p);
    if (positionA == kInside) { return positionB; }  // Inside A, use B's result

    if (positionB == kOutside) { return kOutside; }  // On surface A, outside B
    return kSurface;                                  // On surface A, inside or on B
}
```

**Logic Table**:

| Position in A | Position in B | Result |
|--------------|---------------|---------|
| kOutside | any | kOutside |
| kInside | kInside | kInside |
| kInside | kSurface | kSurface |
| kInside | kOutside | kOutside |
| kSurface | kInside | kSurface |
| kSurface | kSurface | kSurface |
| kSurface | kOutside | kOutside |

**Optimization**: Early exit if outside A (no need to check B)

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4Sphere* sphere = new G4Sphere("Sphere", 0, 8*cm, 0, 2*pi, 0, pi);
G4IntersectionSolid* intersect = new G4IntersectionSolid("Intersect",
                                                         box, sphere,
                                                         nullptr, G4ThreeVector());

G4ThreeVector p1(5*cm, 0, 0);     // Inside both box and sphere
// Inside(p1) returns kInside

G4ThreeVector p2(9*cm, 0, 0);     // Inside box, outside sphere
// Inside(p2) returns kOutside

G4ThreeVector p3(8*cm, 0, 0);     // Inside box, on sphere surface
// Inside(p3) returns kSurface
```

## Surface Normal

### SurfaceNormal()

**Signature**: `G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:208-264`

Returns outward unit normal vector at surface point of intersection.

**Algorithm**:
```cpp
G4ThreeVector G4IntersectionSolid::SurfaceNormal(const G4ThreeVector& p) const {
    EInside insideA = fPtrSolidA->Inside(p);
    EInside insideB = fPtrSolidB->Inside(p);

    // Priority: return normal from whichever solid has point on surface
    if (insideA == kSurface) {
        return fPtrSolidA->SurfaceNormal(p);
    }
    if (insideB == kSurface) {
        return fPtrSolidB->SurfaceNormal(p);
    }

    // Neither solid reports point on surface (error condition)
    // Use distance to determine closest surface
    if (fPtrSolidA->DistanceToOut(p) <= fPtrSolidB->DistanceToOut(p)) {
        return fPtrSolidA->SurfaceNormal(p);
    } else {
        return fPtrSolidB->SurfaceNormal(p);
    }
}
```

**Priority**: Returns normal from first surface encountered (A has precedence if on both)

**Example**:
```cpp
// Cylinder clipped by box
G4Tubs* cylinder = new G4Tubs("Cylinder", 0, 10*cm, 15*cm, 0, 2*pi);
G4Box* box = new G4Box("Box", 8*cm, 8*cm, 10*cm);
G4IntersectionSolid* clipped = new G4IntersectionSolid("Clipped",
                                                       cylinder, box,
                                                       nullptr, G4ThreeVector());

// Point on cylinder surface (within box)
G4ThreeVector p1(10*cm, 0, 5*cm);
G4ThreeVector n1 = clipped->SurfaceNormal(p1);
// n1 = (1, 0, 0) - radial outward from cylinder

// Point on box surface (within cylinder)
G4ThreeVector p2(0, 0, 10*cm);
G4ThreeVector n2 = clipped->SurfaceNormal(p2);
// n2 = (0, 0, 1) - normal from box top face
```

## Distance Calculations

### DistanceToIn(p, v) - Ray Intersection

**Signature**:
```cpp
G4double DistanceToIn(const G4ThreeVector& p,
                     const G4ThreeVector& v) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:270-370`

Calculates distance along direction to enter the intersection.

**Complexity**: Must find overlapping ranges where ray is inside both solids simultaneously.

**Algorithm** (Complex - find overlap of valid ranges):
```cpp
G4double G4IntersectionSolid::DistanceToIn(const G4ThreeVector& p,
                                           const G4ThreeVector& v) const {
    EInside wA = fPtrSolidA->Inside(p);
    EInside wB = fPtrSolidB->Inside(p);

    G4ThreeVector pA = p, pB = p;
    G4double dA = 0., dA1 = 0., dA2 = 0.;
    G4double dB = 0., dB1 = 0., dB2 = 0.;
    G4bool doA = true, doB = true;

    for (std::size_t trial = 0; trial < max_trials; ++trial) {
        if (doA) {
            // Find next valid range for A: [dA1, dA2]
            if (wA != kInside) {
                dA1 = fPtrSolidA->DistanceToIn(pA, v);
                if (dA1 == kInfinity) { return kInfinity; }
                pA += dA1 * v;
            }
            dA2 = dA1 + fPtrSolidA->DistanceToOut(pA, v);
        }
        dA1 += dA;
        dA2 += dA;

        if (doB) {
            // Find next valid range for B: [dB1, dB2]
            if (wB != kInside) {
                dB1 = fPtrSolidB->DistanceToIn(pB, v);
                if (dB1 == kInfinity) { return kInfinity; }
                pB += dB1 * v;
            }
            dB2 = dB1 + fPtrSolidB->DistanceToOut(pB, v);
        }
        dB1 += dB;
        dB2 += dB;

        // Check if ranges overlap
        if (dA1 < dB1) {
            if (dB1 < dA2) { return dB1; }  // B starts during A
            // Need to advance past end of A
            dA = dA2;
            pA = p + dA * v;
            wA = kSurface;
            doA = true;
            doB = false;
        } else {
            if (dA1 < dB2) { return dA1; }  // A starts during B
            // Need to advance past end of B
            dB = dB2;
            pB = p + dB * v;
            wB = kSurface;
            doB = true;
            doA = false;
        }
    }

    return 0.0;  // Should not reach here
}
```

**Concept**:
1. Find ranges where ray is inside A: [a1, a2], [a3, a4], ...
2. Find ranges where ray is inside B: [b1, b2], [b3, b4], ...
3. Return first point where ranges overlap

**Max Iterations**: Protected against infinite loops (10,000 trials)

**Performance**: Can be slow for complex geometries with many crossings

### DistanceToIn(p) - Safety Distance

**Signature**: `G4double DistanceToIn(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:377-414`

Approximate distance from external point to intersection surface.

**Algorithm**:
```cpp
G4double G4IntersectionSolid::DistanceToIn(const G4ThreeVector& p) const {
    EInside sideA = fPtrSolidA->Inside(p);
    EInside sideB = fPtrSolidB->Inside(p);

    if (sideA != kInside && sideB != kOutside) {
        // Outside A (or on surface), inside or on B
        return fPtrSolidA->DistanceToIn(p);
    }

    if (sideB != kInside && sideA != kOutside) {
        // Outside B (or on surface), inside or on A
        return fPtrSolidB->DistanceToIn(p);
    }

    // Outside both or inside both
    return std::min(fPtrSolidA->DistanceToIn(p),
                   fPtrSolidB->DistanceToIn(p));
}
```

**Returns**: Conservative estimate (may underestimate for complex cases)

### DistanceToOut(p, v) - Exit Distance

**Signature**:
```cpp
G4double DistanceToOut(const G4ThreeVector& p,
                      const G4ThreeVector& v,
                      const G4bool calcNorm = false,
                      G4bool* validNorm = nullptr,
                      G4ThreeVector* n = nullptr) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:420-473`

Distance to exit the intersection along direction.

**Algorithm**:
```cpp
G4double G4IntersectionSolid::DistanceToOut(...) const {
    G4bool validNormA, validNormB;
    G4ThreeVector nA, nB;

    // Calculate distances to exit both solids
    G4double distA = fPtrSolidA->DistanceToOut(p, v, calcNorm, &validNormA, &nA);
    G4double distB = fPtrSolidB->DistanceToOut(p, v, calcNorm, &validNormB, &nB);

    // Exit intersection when exiting EITHER solid
    G4double dist = std::min(distA, distB);

    if (calcNorm) {
        if (distA < distB) {
            *validNorm = validNormA;
            *n = nA;
        } else {
            *validNorm = validNormB;
            *n = nB;
        }
    }

    return dist;
}
```

**Logic**: Intersection exits when particle leaves EITHER constituent solid (whichever is closer)

**Normal**: Returns normal from whichever solid is exited first

### DistanceToOut(p) - Safety Distance from Inside

**Signature**: `G4double DistanceToOut(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc:479-499`

Distance from internal point to intersection boundary.

**Algorithm**:
```cpp
G4double G4IntersectionSolid::DistanceToOut(const G4ThreeVector& p) const {
    // Exit occurs at closest boundary of either solid
    return std::min(fPtrSolidA->DistanceToOut(p),
                   fPtrSolidB->DistanceToOut(p));
}
```

**Returns**: Minimum distance to exit either constituent solid

## Volume Calculation

Intersection volumes are calculated using Monte Carlo sampling from G4BooleanSolid base class.

**Algorithm**: Sample random points in bounding box, count how many are inside intersection.

**Formula**: V(A ∩ B) ≈ V_bbox × (N_inside / N_total)

## Performance Characteristics

### Computational Complexity

| Operation | Typical Complexity | Notes |
|-----------|-------------------|--------|
| **Inside()** | 2×solid_inside | Check both solids, early exit possible |
| **DistanceToIn(p,v)** | O(n)×solid_dist | Find overlapping ranges (expensive) |
| **DistanceToOut(p,v)** | 2×solid_dist | Check both exits, return minimum |
| **SurfaceNormal()** | 2×solid_inside + solid_normal | Determine which surface |
| **BoundingLimits()** | 2×solid_bounds | Compute intersection of bounds |

### Performance Considerations

**Strengths**:
- Tight bounding box (intersection of constituent bounds)
- Simple exit distance calculation
- Symmetric operation (commutative)

**Weaknesses**:
- DistanceToIn can be very slow (range overlap algorithm)
- Volume calculation requires Monte Carlo
- May require many iterations for complex shapes

## Usage Examples

### Example 1: Cylinder Clipped by Box

```cpp
// Full cylinder
G4Tubs* cylinder = new G4Tubs("Cylinder",
                              0,        // Inner radius
                              10*cm,    // Outer radius
                              20*cm,    // Half-length
                              0, 2*pi); // Full phi

// Clipping box (smaller in Z)
G4Box* clipBox = new G4Box("ClipBox", 12*cm, 12*cm, 10*cm);

// Intersection creates clipped cylinder
G4IntersectionSolid* clipped = new G4IntersectionSolid("ClippedCylinder",
                                                       cylinder, clipBox,
                                                       nullptr, G4ThreeVector());

G4Material* aluminum = nist->FindOrBuildMaterial("G4_Al");
G4LogicalVolume* clippedLV = new G4LogicalVolume(clipped, aluminum, "Clipped");

// Result: Cylinder with flat top and bottom at z = ±10cm
```

### Example 2: Lens Shape (Intersecting Spheres)

```cpp
// Two overlapping spheres create lens
G4Sphere* sphere1 = new G4Sphere("Sphere1",
                                 0, 15*cm,  // Full sphere
                                 0, 2*pi,
                                 0, pi);

G4Sphere* sphere2 = new G4Sphere("Sphere2",
                                 0, 15*cm,
                                 0, 2*pi,
                                 0, pi);

// Offset spheres to create lens-shaped intersection
G4double separation = 20*cm;
G4ThreeVector offset(separation, 0, 0);

G4IntersectionSolid* lens = new G4IntersectionSolid("Lens",
                                                    sphere1, sphere2,
                                                    nullptr, offset);

G4Material* glass = nist->FindOrBuildMaterial("G4_GLASS_PLATE");
G4LogicalVolume* lensLV = new G4LogicalVolume(lens, glass, "Lens");

// Lens thickness at center
G4double centerThickness = 2 * std::sqrt(15*cm*15*cm - (separation/2)*(separation/2));
G4cout << "Lens center thickness: " << centerThickness/cm << " cm" << G4endl;
```

### Example 3: Rotated Box Intersection (Octagon)

```cpp
// Two identical boxes, one rotated
G4Box* box1 = new G4Box("Box1", 10*cm, 10*cm, 5*cm);
G4Box* box2 = new G4Box("Box2", 10*cm, 10*cm, 5*cm);

// Rotate second box 45 degrees around Z
G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateZ(45*deg);

G4IntersectionSolid* octagon = new G4IntersectionSolid("Octagon",
                                                       box1, box2,
                                                       rot, G4ThreeVector());

// Result: Octagonal prism (box with corners clipped)
// Each corner of box1 is clipped by edges of rotated box2

// Verify shape
G4ThreeVector corner(10*cm, 10*cm, 0);  // Original box corner
EInside status = octagon->Inside(corner);
G4cout << "Corner is: " << (status == kOutside ? "clipped" : "not clipped") << G4endl;
```

### Example 4: Defining Active Detector Volume

```cpp
// Detector crystal (large volume)
G4Box* crystal = new G4Box("Crystal", 20*cm, 20*cm, 30*cm);

// Active region (only central part)
G4Tubs* activeRegion = new G4Tubs("ActiveRegion",
                                  0, 15*cm,  // Cylinder radius
                                  25*cm,     // Cylinder half-length
                                  0, 2*pi);

// Intersection defines active volume
G4IntersectionSolid* activeVolume = new G4IntersectionSolid("ActiveVolume",
                                                            crystal, activeRegion,
                                                            nullptr, G4ThreeVector());

// Use crystal material but only count hits in active volume
G4Material* scintillator = nist->FindOrBuildMaterial("G4_PLASTIC_SC_VINYLTOLUENE");

// Full crystal
G4LogicalVolume* crystalLV = new G4LogicalVolume(crystal, scintillator, "Crystal");

// Active volume (for sensitive detector attachment)
G4LogicalVolume* activeLV = new G4LogicalVolume(activeVolume, scintillator, "Active");
// Attach sensitive detector only to activeLV
```

### Example 5: Complex Collimator Shape

```cpp
// Outer cone
G4Cons* outerCone = new G4Cons("OuterCone",
                               2*cm, 3*cm,   // Inner/outer radius at -Z
                               5*cm, 6*cm,   // Inner/outer radius at +Z
                               10*cm,        // Half-length
                               0, 2*pi);

// Inner limiting volume (cylinder)
G4Tubs* innerLimit = new G4Tubs("InnerLimit",
                                0, 5.5*cm,   // Slightly smaller than cone
                                11*cm,        // Longer than cone
                                0, 2*pi);

// Intersection creates proper collimator shape
G4IntersectionSolid* collimator = new G4IntersectionSolid("Collimator",
                                                          outerCone, innerLimit,
                                                          nullptr, G4ThreeVector());

G4Material* tungsten = nist->FindOrBuildMaterial("G4_W");
G4LogicalVolume* collimatorLV = new G4LogicalVolume(collimator, tungsten, "Collimator");
```

### Example 6: Testing Empty Intersection

```cpp
// Two non-overlapping boxes
G4Box* box1 = new G4Box("Box1", 5*cm, 5*cm, 5*cm);
G4Box* box2 = new G4Box("Box2", 5*cm, 5*cm, 5*cm);

// Separate boxes completely
G4ThreeVector farApart(20*cm, 0, 0);

G4IntersectionSolid* empty = new G4IntersectionSolid("Empty",
                                                     box1, box2,
                                                     nullptr, farApart);

// Check if intersection is empty
G4ThreeVector testPoint(0, 0, 0);
EInside status = empty->Inside(testPoint);
G4cout << "Intersection at origin: " << (status == kOutside ? "empty" : "exists")
       << G4endl;  // "empty"

// Bounding box check
G4ThreeVector pMin, pMax;
empty->BoundingLimits(pMin, pMax);
if (pMin.x() >= pMax.x() || pMin.y() >= pMax.y() || pMin.z() >= pMax.z()) {
    G4cout << "Intersection has empty bounding box" << G4endl;
}
```

## Common Pitfalls

### Pitfall 1: Empty Intersection

```cpp
// WRONG - solids don't overlap
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm, 0, 2*pi, 0, pi);
G4Box* box = new G4Box("Box", 5*cm, 5*cm, 5*cm);
G4ThreeVector offset(50*cm, 0, 0);  // Far apart!

G4IntersectionSolid* empty = new G4IntersectionSolid("Empty",
                                                     sphere, box,
                                                     nullptr, offset);
// Result: Empty solid (no physical volume)
// Will cause problems in navigation

// CORRECT - verify intersection exists
G4ThreeVector bminA, bmaxA, bminB, bmaxB;
sphere->BoundingLimits(bminA, bmaxA);
// (Apply transformation to B's bounds)
box->BoundingLimits(bminB, bmaxB);
// Transform bminB and bmaxB by offset...

// Check for overlap before creating intersection
```

### Pitfall 2: Assuming Commutative Properties for All Operations

```cpp
// Intersection IS commutative: A ∩ B = B ∩ A
G4IntersectionSolid* int1 = new G4IntersectionSolid("Int1", solidA, solidB, ...);
G4IntersectionSolid* int2 = new G4IntersectionSolid("Int2", solidB, solidA, ...);
// int1 and int2 are equivalent (same shape)

// BUT: Surface normals may differ depending on which surface is encountered first
// For navigation, order might affect which normal is returned in edge cases
```

### Pitfall 3: Performance Issues with Complex Intersections

```cpp
// SLOW - nested Boolean intersections
G4IntersectionSolid* int1 = new G4IntersectionSolid("Int1", solidA, solidB, ...);
G4IntersectionSolid* int2 = new G4IntersectionSolid("Int2", int1, solidC, ...);
G4IntersectionSolid* int3 = new G4IntersectionSolid("Int3", int2, solidD, ...);
// DistanceToIn becomes extremely slow (must find overlapping ranges for all)

// BETTER - use simpler primitive if possible
// Or combine constraints analytically before creating solid
```

### Pitfall 4: Not Checking for Grazing Intersections

```cpp
// PROBLEMATIC - solids barely touch
G4Sphere* sphere1 = new G4Sphere("S1", 0, 10*cm, 0, 2*pi, 0, pi);
G4Sphere* sphere2 = new G4Sphere("S2", 0, 10*cm, 0, 2*pi, 0, pi);

G4ThreeVector justTouching(20*cm, 0, 0);  // Spheres just kiss at one point

G4IntersectionSolid* point = new G4IntersectionSolid("Point",
                                                     sphere1, sphere2,
                                                     nullptr, justTouching);
// Result: Intersection is single point (problematic for navigation)
// Can cause numerical precision issues
```

### Pitfall 5: Incorrect Transformation Application

```cpp
// WRONG - transforming solid A instead of B
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4Tubs* tube = new G4Tubs("Tube", 0, 5*cm, 15*cm, 0, 2*pi);

G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateZ(45*deg);
G4ThreeVector trans(5*cm, 0, 0);

// This rotates/translates solid B (tube) relative to A (box)
G4IntersectionSolid* correct = new G4IntersectionSolid("Correct",
                                                       box, tube,
                                                       rot, trans);

// Cannot directly transform solid A - transformation always applies to B
```

## Best Practices

### 1. Verify Intersection Exists

```cpp
// Check bounding boxes overlap before creating intersection
G4ThreeVector bminA, bmaxA, bminB, bmaxB;
solidA->BoundingLimits(bminA, bmaxA);
solidB->BoundingLimits(bminB, bmaxB);
// (Transform B's bounds if using transformation)

G4bool overlaps = !(bminA.x() >= bmaxB.x() || bmaxA.x() <= bminB.x() ||
                   bminA.y() >= bmaxB.y() || bmaxA.y() <= bminB.y() ||
                   bminA.z() >= bmaxB.z() || bmaxA.z() <= bminB.z());

if (!overlaps) {
    G4cerr << "WARNING: Solids don't overlap, intersection will be empty!" << G4endl;
}
```

### 2. Use Simple Constituent Solids

```cpp
// GOOD - simple primitives
G4Box* box = new G4Box(...);
G4Tubs* tube = new G4Tubs(...);
G4IntersectionSolid* good = new G4IntersectionSolid("Good", box, tube, ...);

// AVOID - complex nested Booleans
G4IntersectionSolid* complex1 = new G4IntersectionSolid(...);
G4IntersectionSolid* complex2 = new G4IntersectionSolid(...);
G4IntersectionSolid* slow = new G4IntersectionSolid("Slow", complex1, complex2, ...);
```

### 3. Consider Alternative Approaches

```cpp
// Instead of intersection, sometimes direct primitive is better

// Option 1: Use intersection for precise control
G4Sphere* sphere = new G4Sphere(...);
G4Box* box = new G4Box(...);
G4IntersectionSolid* clipped = new G4IntersectionSolid("Clipped", sphere, box, ...);

// Option 2: Use specialized solid if available
// For example, G4Sphere with theta/phi limits instead of sphere+box intersection
G4Sphere* sectorSphere = new G4Sphere("Sector",
                                      0, radius,
                                      phiMin, phiMax,     // Phi limits
                                      thetaMin, thetaMax); // Theta limits
// Often faster than Boolean intersection
```

### 4. Test Edge Cases

```cpp
G4IntersectionSolid* intersect = new G4IntersectionSolid(...);

// Test various points
std::vector<G4ThreeVector> testPoints = {
    {0, 0, 0},              // Center
    /* points on A surface */,
    /* points on B surface */,
    /* points in overlap */,
    /* points outside */
};

for (const auto& p : testPoints) {
    EInside status = intersect->Inside(p);
    if (status == kSurface) {
        G4ThreeVector normal = intersect->SurfaceNormal(p);
        // Verify normal makes sense
    }
}
```

### 5. Monitor Performance

```cpp
// For performance-critical intersections, consider caching
// or pre-computing properties

G4IntersectionSolid* intersect = new G4IntersectionSolid(...);

// If volume used frequently, compute once
G4double volume = intersect->GetCubicVolume();

// If many Inside() calls, consider voxelization of parent logical volume
```

## See Also

- [G4UnionSolid](g4unionsolid.md) - Union (A ∪ B)
- [G4SubtractionSolid](g4subtractionsolid.md) - Subtraction (A - B)
- [G4VSolid](g4vsolid.md) - Base class for all solids
- [G4DisplacedSolid](g4displacedsolid.md) - Solid with transformation
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/solids/Boolean/include/G4IntersectionSolid.hh`
- Implementation: `source/geometry/solids/Boolean/src/G4IntersectionSolid.cc`
- Base class: `source/geometry/solids/Boolean/include/G4BooleanSolid.hh`

### Key Algorithms
- **Set Intersection**: Point ∈ (A ∩ B) ⟺ Point ∈ A ∧ Point ∈ B
- **Bounding Box**: min_i = max(min_A_i, min_B_i), max_i = min(max_A_i, max_B_i)
- **Distance to Entry**: Find overlapping ranges where inside both solids
- **Volume Calculation**: Monte Carlo sampling within bounding box

### External Documentation
- [Geant4 User Guide: Boolean Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html#boolean-solids)
- [Set Theory - Intersection](https://en.wikipedia.org/wiki/Intersection_(set_theory))
- [Constructive Solid Geometry](https://en.wikipedia.org/wiki/Constructive_solid_geometry)
