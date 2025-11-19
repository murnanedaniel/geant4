# G4UnionSolid

**Base Class**: G4BooleanSolid (extends [G4VSolid](g4vsolid.md))
**Location**: `source/geometry/solids/Boolean/include/G4UnionSolid.hh`
**Source**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc`

## Overview

G4UnionSolid represents the union (OR operation) of two solids in Geant4. It creates a new solid that encompasses all space contained within either constituent solid A OR solid B. This is one of the three fundamental Boolean operations in constructive solid geometry (CSG), alongside subtraction and intersection.

The union operation is particularly useful for creating complex shapes by combining simpler primitives, such as merging cylinders and boxes to create detector housings, or combining multiple geometric elements into a single logical unit.

## Key Features

- **Boolean OR Operation**: Creates solid containing all points in A or B (A ∪ B)
- **Flexible Transformation**: Second solid can be positioned/rotated relative to first
- **Optimized Inside Test**: Early-exit logic for performance
- **Volume Calculation**: Handles overlapping and non-overlapping cases
- **Extended Bounding Box**: Cached bounds with tolerance for optimization
- **Navigation Support**: Proper handling of particles crossing boundaries

## Mathematical Definition

For a point **p** in space:
- **p** ∈ (A ∪ B) if and only if **p** ∈ A **OR** **p** ∈ B

Special cases:
- **Surface**: Point on boundary of union (may be on either solid's surface)
- **Edge Cases**: When A and B touch, surface points determined by normal vectors

## Class Definition

```cpp
class G4UnionSolid : public G4BooleanSolid
{
  public:
    // Constructors
    G4UnionSolid(const G4String& pName,
                 G4VSolid* pSolidA,
                 G4VSolid* pSolidB);

    G4UnionSolid(const G4String& pName,
                 G4VSolid* pSolidA,
                 G4VSolid* pSolidB,
                 G4RotationMatrix* rotMatrix,
                 const G4ThreeVector& transVector);

    G4UnionSolid(const G4String& pName,
                 G4VSolid* pSolidA,
                 G4VSolid* pSolidB,
                 const G4Transform3D& transform);

    ~G4UnionSolid() override;

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
    G4double GetCubicVolume() final;

  private:
    void Init();

    G4ThreeVector fPMin, fPMax;  // Extended bounding box
    G4double halfCarTolerance;    // Cached half-tolerance
};
```

## Constructors and Initialization

### Basic Constructor

**Signature**:
```cpp
G4UnionSolid(const G4String& pName,
             G4VSolid* pSolidA,
             G4VSolid* pSolidB);
```
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:54-60`

Creates a union where solid B is in the same coordinate system as solid A.

**Parameters**:
- `pName` - Name for this boolean solid
- `pSolidA` - Pointer to first constituent solid
- `pSolidB` - Pointer to second constituent solid (no transformation)

**Actions**:
1. Calls `G4BooleanSolid(pName, pSolidA, pSolidB)`
2. Calls `Init()` to compute extended bounding box

**Example**:
```cpp
// Create two overlapping boxes
G4Box* boxA = new G4Box("BoxA", 10*cm, 10*cm, 10*cm);
G4Box* boxB = new G4Box("BoxB", 10*cm, 10*cm, 10*cm);

// Union creates shape containing both boxes
G4UnionSolid* unionBox = new G4UnionSolid("UnionBox", boxA, boxB);
// Result: BoxA OR BoxB (with B at same position as A)
```

### Constructor with Rotation and Translation

**Signature**:
```cpp
G4UnionSolid(const G4String& pName,
             G4VSolid* pSolidA,
             G4VSolid* pSolidB,
             G4RotationMatrix* rotMatrix,
             const G4ThreeVector& transVector);
```
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:66-75`

Creates a union where solid B is transformed relative to solid A.

**Parameters**:
- `pName` - Name for this boolean solid
- `pSolidA` - Pointer to first constituent solid (reference frame)
- `pSolidB` - Pointer to second constituent solid (will be transformed)
- `rotMatrix` - Rotation to apply to solid B (can be nullptr)
- `transVector` - Translation to apply to solid B

**Transformation**: Points in B are transformed as: **p'** = R × **p** + **t**

**Example**:
```cpp
// Create main cylinder
G4Tubs* cylinder = new G4Tubs("Cylinder", 0, 5*cm, 10*cm, 0, 2*pi);

// Create sphere to cap the cylinder
G4Sphere* sphere = new G4Sphere("Sphere", 0, 5*cm, 0, 2*pi, 0, pi);

// Position sphere at top of cylinder
G4ThreeVector trans(0, 0, 10*cm);
G4UnionSolid* capsule = new G4UnionSolid("Capsule", cylinder, sphere,
                                         nullptr, trans);
// Result: Cylinder with spherical cap on top
```

### Constructor with G4Transform3D

**Signature**:
```cpp
G4UnionSolid(const G4String& pName,
             G4VSolid* pSolidA,
             G4VSolid* pSolidB,
             const G4Transform3D& transform);
```
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:81-88`

Creates a union using a complete 3D transformation for solid B.

**Parameters**:
- `pName` - Name for this boolean solid
- `pSolidA` - Pointer to first constituent solid
- `pSolidB` - Pointer to second constituent solid
- `transform` - Complete 3D transformation (rotation + translation)

**Use Case**: When you have a pre-computed transformation matrix

**Example**:
```cpp
G4Box* box = new G4Box("Box", 5*cm, 5*cm, 5*cm);
G4Tubs* tube = new G4Tubs("Tube", 0, 2*cm, 8*cm, 0, 2*pi);

// Create 45-degree rotation and translation
G4RotationMatrix rot;
rot.rotateZ(45*deg);
G4ThreeVector trans(10*cm, 0, 0);
G4Transform3D transform(rot, trans);

G4UnionSolid* combined = new G4UnionSolid("Combined", box, tube, transform);
```

### Init() - Internal Initialization

**Signature**: `void Init()`
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:144-152`

Computes extended bounding box for optimization.

**Algorithm**:
```cpp
void G4UnionSolid::Init() {
    G4ThreeVector pmin, pmax;
    BoundingLimits(pmin, pmax);

    // Extend by tolerance on all sides
    G4ThreeVector pdelta(kCarTolerance, kCarTolerance, kCarTolerance);
    fPMin = pmin - pdelta;
    fPMax = pmax + pdelta;

    halfCarTolerance = 0.5 * kCarTolerance;
}
```

**Purpose**: Cached extended bounds used for early rejection in `Inside()`

## Bounding Volume Methods

### BoundingLimits()

**Signature**:
```cpp
void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:158-186`

Returns axis-aligned bounding box that encloses the union.

**Algorithm**:
```cpp
void G4UnionSolid::BoundingLimits(G4ThreeVector& pMin,
                                  G4ThreeVector& pMax) const {
    G4ThreeVector minA, maxA, minB, maxB;
    fPtrSolidA->BoundingLimits(minA, maxA);
    fPtrSolidB->BoundingLimits(minB, maxB);

    // Union bounds = max extent in each dimension
    pMin.set(std::min(minA.x(), minB.x()),
             std::min(minA.y(), minB.y()),
             std::min(minA.z(), minB.z()));

    pMax.set(std::max(maxA.x(), maxB.x()),
             std::max(maxA.y(), maxB.y()),
             std::max(maxA.z(), maxB.z()));
}
```

**Mathematical Insight**: For union, bounding box is the smallest box containing both constituent boxes.

### CalculateExtent()

**Signature**:
```cpp
G4bool CalculateExtent(const EAxis pAxis,
                      const G4VoxelLimits& pVoxelLimit,
                      const G4AffineTransform& pTransform,
                      G4double& pMin, G4double& pMax) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:192-219`

Calculates extent along an axis for voxelization.

**Algorithm**:
```cpp
G4bool G4UnionSolid::CalculateExtent(...) const {
    G4double minA = kInfinity, maxA = -kInfinity;
    G4double minB = kInfinity, maxB = -kInfinity;

    G4bool touchesA = fPtrSolidA->CalculateExtent(pAxis, pVoxelLimit,
                                                  pTransform, minA, maxA);
    G4bool touchesB = fPtrSolidB->CalculateExtent(pAxis, pVoxelLimit,
                                                  pTransform, minB, maxB);

    if (touchesA || touchesB) {
        pMin = std::min(minA, minB);  // Union: take broader extent
        pMax = std::max(maxA, maxB);
        return true;
    }
    return false;  // Neither solid intersects voxel limits
}
```

**Returns**: `true` if union intersects voxel limits

## Point Classification

### Inside()

**Signature**: `EInside Inside(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:227-246`

Determines whether point is inside, on surface, or outside the union.

**Returns**:
- `kInside` - Point is strictly inside union
- `kSurface` - Point is on surface of union
- `kOutside` - Point is outside union

**Algorithm**:
```cpp
EInside G4UnionSolid::Inside(const G4ThreeVector& p) const {
    // Early rejection: check against extended bounding box
    if (std::max(p.z() - fPMax.z(), fPMin.z() - p.z()) > 0) {
        return kOutside;
    }

    // Check solid A
    EInside positionA = fPtrSolidA->Inside(p);
    if (positionA == kInside) { return kInside; }  // Inside A => inside union

    // Check solid B
    EInside positionB = fPtrSolidB->Inside(p);
    if (positionA == kOutside) { return positionB; }  // Outside A, use B result
    if (positionB == kInside) { return kInside; }     // Inside B => inside union
    if (positionB == kOutside) { return kSurface; }   // On surface A, outside B

    // Both on surface - check if normals oppose (touching surfaces)
    static const G4double rtol = 1000 * kCarTolerance;
    G4ThreeVector normSum = fPtrSolidA->SurfaceNormal(p) +
                            fPtrSolidB->SurfaceNormal(p);

    // If normals nearly cancel, solids touch here => inside union
    // Otherwise, point is on external surface
    return (normSum.mag2() < rtol) ? kInside : kSurface;
}
```

**Optimization**: Early Z-axis rejection using cached extended bounds (fastest comparison)

**Edge Case Handling**: When point is on surface of both solids (touching surfaces), normals are checked:
- Opposing normals → internal touching surface → `kInside`
- Non-opposing normals → external surface → `kSurface`

**Example**:
```cpp
G4UnionSolid* union = new G4UnionSolid(...);

G4ThreeVector p1(2*cm, 0, 0);   // Inside solid A
// Inside(p1) returns kInside

G4ThreeVector p2(12*cm, 0, 0);  // Inside solid B but outside A
// Inside(p2) returns kInside (union contains B)

G4ThreeVector p3(15*cm, 0, 0);  // Outside both
// Inside(p3) returns kOutside
```

## Surface Normal

### SurfaceNormal()

**Signature**: `G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:252-286`

Returns outward unit normal vector at surface point.

**Algorithm**:
```cpp
G4ThreeVector G4UnionSolid::SurfaceNormal(const G4ThreeVector& p) const {
    EInside positionA = fPtrSolidA->Inside(p);
    EInside positionB = fPtrSolidB->Inside(p);

    // Point on surface of A, outside B
    if (positionA == kSurface && positionB == kOutside) {
        return fPtrSolidA->SurfaceNormal(p);
    }

    // Point outside A, on surface of B
    if (positionA == kOutside && positionB == kSurface) {
        return fPtrSolidB->SurfaceNormal(p);
    }

    // Point on surface of both solids
    if (positionA == kSurface && positionB == kSurface) {
        if (Inside(p) == kSurface) {
            // Average normals for smooth transition
            G4ThreeVector normalA = fPtrSolidA->SurfaceNormal(p);
            G4ThreeVector normalB = fPtrSolidB->SurfaceNormal(p);
            return (normalA + normalB).unit();
        }
    }

    // Fallback (shouldn't reach here for valid surface points)
    return fPtrSolidA->SurfaceNormal(p);
}
```

**Cases**:
1. **On A surface only**: Return A's normal
2. **On B surface only**: Return B's normal
3. **On both surfaces**: Average and normalize normals
4. **Invalid call**: Returns A's normal with debug warning

**Example**:
```cpp
// Two touching spheres
G4Sphere* sphere1 = new G4Sphere("S1", 0, 5*cm, 0, 2*pi, 0, pi);
G4Sphere* sphere2 = new G4Sphere("S2", 0, 5*cm, 0, 2*pi, 0, pi);
G4UnionSolid* union = new G4UnionSolid("Union", sphere1, sphere2,
                                       nullptr, G4ThreeVector(8*cm, 0, 0));

// Point on sphere1 surface only
G4ThreeVector p1(-5*cm, 0, 0);
G4ThreeVector n1 = union->SurfaceNormal(p1);
// n1 = (-1, 0, 0) - normal from sphere1

// Point where spheres touch (if they overlap)
// Normal is averaged from both spheres
```

## Distance Calculations

### DistanceToIn(p, v) - Ray Intersection

**Signature**:
```cpp
G4double DistanceToIn(const G4ThreeVector& p,
                     const G4ThreeVector& v) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:292-314`

Calculates distance along direction to enter the union.

**Algorithm**:
```cpp
G4double G4UnionSolid::DistanceToIn(const G4ThreeVector& p,
                                    const G4ThreeVector& v) const {
    // Union: enter when hitting EITHER solid
    return std::min(fPtrSolidA->DistanceToIn(p, v),
                    fPtrSolidB->DistanceToIn(p, v));
}
```

**Mathematical Insight**: For union (A ∪ B), first entry is minimum of individual distances.

**Example**:
```cpp
G4UnionSolid* union = new G4UnionSolid(...);

G4ThreeVector p(-20*cm, 0, 0);  // Outside
G4ThreeVector v(1, 0, 0);       // Moving toward +X

G4double dist = union->DistanceToIn(p, v);
// dist = distance to first surface encountered (min of A and B distances)
```

### DistanceToIn(p) - Safety Distance

**Signature**: `G4double DistanceToIn(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:321-342`

Approximate distance from external point to union surface.

**Algorithm**:
```cpp
G4double G4UnionSolid::DistanceToIn(const G4ThreeVector& p) const {
    G4double distA = fPtrSolidA->DistanceToIn(p);
    G4double distB = fPtrSolidB->DistanceToIn(p);
    G4double safety = std::min(distA, distB);
    if (safety < 0.0) { safety = 0.0; }
    return safety;
}
```

**Returns**: Minimum distance to either solid (conservative safety estimate)

**Use Case**: Navigation safety - distance particle can travel without geometry checks

### DistanceToOut(p, v) - Exit Distance

**Signature**:
```cpp
G4double DistanceToOut(const G4ThreeVector& p,
                      const G4ThreeVector& v,
                      const G4bool calcNorm = false,
                      G4bool* validNorm = nullptr,
                      G4ThreeVector* n = nullptr) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:348-429`

Calculates distance to exit the union along a direction.

**Algorithm** (Complex due to union logic):
```cpp
G4double G4UnionSolid::DistanceToOut(...) const {
    G4double dist = 0.0;
    G4ThreeVector normTmp;

    EInside positionA = fPtrSolidA->Inside(p);

    if (positionA != kOutside) {
        // Starting inside A
        do {
            // Exit A
            disTmp = fPtrSolidA->DistanceToOut(p + dist*v, v, calcNorm,
                                               validNorm, &normTmp);
            dist += disTmp;

            // Check if re-entering through B
            if (fPtrSolidB->Inside(p + dist*v) != kOutside) {
                // Inside B, need to exit B too
                disTmp = fPtrSolidB->DistanceToOut(p + dist*v, v, calcNorm,
                                                   validNorm, &normTmp);
                dist += disTmp;
            }
        } while ((fPtrSolidA->Inside(p + dist*v) != kOutside) &&
                 (disTmp > halfCarTolerance));
    } else {
        // Starting inside B only (similar logic)
        // ...
    }

    if (calcNorm) {
        *validNorm = false;  // Union normals may not be valid
        *n = normTmp;
    }

    return dist;
}
```

**Complexity**: Must handle case where particle exits one solid but remains in union through the other solid.

**Loop**: Continues until particle is outside both solids

**Normal Validity**: Set to `false` because union surface may be complex

### DistanceToOut(p) - Safety Distance from Inside

**Signature**: `G4double DistanceToOut(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:435-480`

Distance from internal point to union boundary.

**Algorithm**:
```cpp
G4double G4UnionSolid::DistanceToOut(const G4ThreeVector& p) const {
    EInside positionA = fPtrSolidA->Inside(p);
    EInside positionB = fPtrSolidB->Inside(p);

    // Inside both solids: must exit both
    if ((positionA == kInside && positionB == kInside) ||
        (positionA == kInside && positionB == kSurface) ||
        (positionA == kSurface && positionB == kInside)) {
        return std::max(fPtrSolidA->DistanceToOut(p),
                       fPtrSolidB->DistanceToOut(p));
    }

    // Inside one solid only
    if (positionA == kOutside) {
        return fPtrSolidB->DistanceToOut(p);
    } else {
        return fPtrSolidA->DistanceToOut(p);
    }
}
```

**Logic**:
- **Inside both**: Maximum distance (must clear both boundaries)
- **Inside one**: Distance to that solid's boundary

## Volume Calculation

### GetCubicVolume()

**Signature**: `G4double GetCubicVolume() final`
**Line**: `source/geometry/solids/Boolean/src/G4UnionSolid.cc:554-589`

Calculates volume of union with caching.

**Algorithm**:
```cpp
G4double G4UnionSolid::GetCubicVolume() {
    if (fCubicVolume >= 0.) {
        return fCubicVolume;  // Return cached value
    }

    // Check if bounding boxes overlap
    G4ThreeVector bminA, bmaxA, bminB, bmaxB;
    fPtrSolidA->BoundingLimits(bminA, bmaxA);
    fPtrSolidB->BoundingLimits(bminB, bmaxB);

    G4bool noIntersection =
        bminA.x() >= bmaxB.x() || bminA.y() >= bmaxB.y() || bminA.z() >= bmaxB.z() ||
        bminB.x() >= bmaxA.x() || bminB.y() >= bmaxA.y() || bminB.z() >= bmaxA.z();

    if (noIntersection) {
        // No overlap: V(A ∪ B) = V(A) + V(B)
        fCubicVolume = fPtrSolidA->GetCubicVolume() + fPtrSolidB->GetCubicVolume();
    } else {
        if (GetNumOfConstituents() > 10) {
            // Complex nested Boolean: use Monte Carlo
            fCubicVolume = G4BooleanSolid::GetCubicVolume();
        } else {
            // V(A ∪ B) = V(A) + V(B) - V(A ∩ B)
            G4IntersectionSolid intersectVol("Temp-Intersection", fPtrSolidA, fPtrSolidB);
            intersectVol.SetCubVolStatistics(GetCubVolStatistics());
            intersectVol.SetCubVolEpsilon(GetCubVolEpsilon());

            fCubicVolume = fPtrSolidA->GetCubicVolume() +
                          fPtrSolidB->GetCubicVolume() -
                          intersectVol.GetCubicVolume();
        }
    }

    return fCubicVolume;
}
```

**Formula**: V(A ∪ B) = V(A) + V(B) - V(A ∩ B)

**Optimization**: Direct sum if bounding boxes don't overlap

**Performance**: For deeply nested Booleans (>10 levels), uses Monte Carlo sampling

## Performance Characteristics

### Computational Complexity

| Operation | Typical Complexity | Notes |
|-----------|-------------------|--------|
| **Inside()** | O(1) + 2×solid_inside | Early Z-rejection, then check both solids |
| **DistanceToIn(p,v)** | O(1) + 2×solid_dist | Minimum of two distance calculations |
| **DistanceToOut(p,v)** | O(n) + solid_dist | May loop through multiple exits |
| **SurfaceNormal()** | 2×solid_inside + solid_normal | Check positions, get normal(s) |
| **GetCubicVolume()** | First: O(intersection_vol) | Cached after first call |

### Performance Considerations

**Strengths**:
- Early rejection using cached extended bounding box
- Simple minimum/maximum logic for distance calculations
- Volume caching

**Weaknesses**:
- DistanceToOut requires iteration when solids overlap
- Surface normals may require averaging
- Volume calculation needs intersection for overlapping case

**Optimization Tips**:
1. Use simple constituent solids when possible
2. Minimize overlap between constituents
3. Consider orientation for Z-axis early rejection

## Usage Examples

### Example 1: Simple Union of Boxes

```cpp
// Create two boxes at different positions
G4Box* box1 = new G4Box("Box1", 5*cm, 5*cm, 10*cm);
G4Box* box2 = new G4Box("Box2", 5*cm, 5*cm, 10*cm);

// Union with box2 translated in X
G4ThreeVector trans(8*cm, 0, 0);
G4UnionSolid* combined = new G4UnionSolid("CombinedBoxes", box1, box2,
                                          nullptr, trans);

// Create logical volume
G4Material* iron = nist->FindOrBuildMaterial("G4_Fe");
G4LogicalVolume* combinedLV = new G4LogicalVolume(combined, iron, "Combined");
```

### Example 2: Capsule Shape

```cpp
// Create cylindrical body
G4Tubs* cylinder = new G4Tubs("Cylinder",
                              0,        // Inner radius
                              5*cm,     // Outer radius
                              15*cm,    // Half-length
                              0, 2*pi); // Full phi

// Create hemispherical cap
G4Sphere* topCap = new G4Sphere("TopCap",
                                0,        // Inner radius
                                5*cm,     // Outer radius
                                0, 2*pi,  // Full phi
                                0, pi/2); // Upper hemisphere

G4Sphere* bottomCap = new G4Sphere("BottomCap",
                                   0, 5*cm, 0, 2*pi,
                                   pi/2, pi/2);  // Lower hemisphere

// Combine cylinder + top cap
G4ThreeVector topTrans(0, 0, 15*cm);
G4UnionSolid* withTop = new G4UnionSolid("WithTop", cylinder, topCap,
                                         nullptr, topTrans);

// Add bottom cap
G4ThreeVector bottomTrans(0, 0, -15*cm);
G4UnionSolid* capsule = new G4UnionSolid("Capsule", withTop, bottomCap,
                                         nullptr, bottomTrans);

// Result: Smooth capsule shape
```

### Example 3: Complex Detector Housing

```cpp
// Main detector body
G4Box* mainBody = new G4Box("MainBody", 20*cm, 20*cm, 30*cm);

// Cylindrical extension for cables
G4Tubs* cablePort = new G4Tubs("CablePort", 0, 3*cm, 5*cm, 0, 2*pi);

// Position cable port on side of main body
G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateY(90*deg);
G4ThreeVector portTrans(20*cm, 0, 0);

G4UnionSolid* housingWithPort = new G4UnionSolid("HousingWithPort",
                                                 mainBody, cablePort,
                                                 rot, portTrans);

// Add viewing window (another cylinder)
G4Tubs* window = new G4Tubs("Window", 0, 5*cm, 1*cm, 0, 2*pi);
G4ThreeVector windowTrans(0, 0, 31*cm);

G4UnionSolid* completeHousing = new G4UnionSolid("CompleteHousing",
                                                 housingWithPort, window,
                                                 nullptr, windowTrans);

G4Material* aluminum = nist->FindOrBuildMaterial("G4_Al");
G4LogicalVolume* housingLV = new G4LogicalVolume(completeHousing, aluminum,
                                                 "Housing");
```

### Example 4: L-Shaped Volume

```cpp
// Create two boxes forming an L-shape
G4Box* vertical = new G4Box("Vertical", 5*cm, 5*cm, 20*cm);
G4Box* horizontal = new G4Box("Horizontal", 20*cm, 5*cm, 5*cm);

// Position horizontal part at bottom
G4ThreeVector trans(15*cm, 0, -15*cm);
G4UnionSolid* lShape = new G4UnionSolid("LShape", vertical, horizontal,
                                        nullptr, trans);

// Calculate volume
G4double volume = lShape->GetCubicVolume();
G4cout << "L-shape volume: " << volume/cm3 << " cm3" << G4endl;
// Should equal sum of volumes (no overlap)
```

### Example 5: Testing Point Classification

```cpp
G4Box* box1 = new G4Box("Box1", 10*cm, 10*cm, 10*cm);
G4Box* box2 = new G4Box("Box2", 10*cm, 10*cm, 10*cm);
G4UnionSolid* union = new G4UnionSolid("Union", box1, box2,
                                       nullptr, G4ThreeVector(15*cm, 0, 0));

// Test points
G4ThreeVector p1(5*cm, 0, 0);     // Inside box1
G4cout << "p1 inside: " << (union->Inside(p1) == kInside) << G4endl;  // true

G4ThreeVector p2(17*cm, 0, 0);    // Inside box2
G4cout << "p2 inside: " << (union->Inside(p2) == kInside) << G4endl;  // true

G4ThreeVector p3(10*cm, 0, 0);    // On surface of box1
G4cout << "p3 on surface: " << (union->Inside(p3) == kSurface) << G4endl;  // true

G4ThreeVector p4(30*cm, 0, 0);    // Outside both
G4cout << "p4 outside: " << (union->Inside(p4) == kOutside) << G4endl;  // true

// Get surface normal at touching point
G4ThreeVector p5(12.5*cm, 0, 0);  // In overlap region
if (union->Inside(p5) != kOutside) {
    G4ThreeVector normal = union->SurfaceNormal(p5);
    G4cout << "Normal at overlap: " << normal << G4endl;
}
```

## Common Pitfalls

### Pitfall 1: Assuming Constituents Are Copied

```cpp
// WRONG - constituents are used by pointer
G4Box* box = new G4Box("Box", 5*cm, 5*cm, 5*cm);
G4UnionSolid* union1 = new G4UnionSolid("U1", box, box, nullptr, trans1);
delete box;  // CRASH! Union still references box
union1->Inside(point);  // Invalid memory access

// CORRECT - keep constituents alive
G4Box* box1 = new G4Box("Box1", 5*cm, 5*cm, 5*cm);
G4Box* box2 = new G4Box("Box2", 5*cm, 5*cm, 5*cm);
G4UnionSolid* union2 = new G4UnionSolid("U2", box1, box2, nullptr, trans);
// All solids remain valid for lifetime of union
```

### Pitfall 2: Overlapping vs. Separated Volumes

```cpp
// Case 1: Non-overlapping (fast volume calculation)
G4Box* box1 = new G4Box("B1", 5*cm, 5*cm, 5*cm);
G4Box* box2 = new G4Box("B2", 5*cm, 5*cm, 5*cm);
G4UnionSolid* separated = new G4UnionSolid("Sep", box1, box2,
                                           nullptr, G4ThreeVector(20*cm, 0, 0));
G4double vol1 = separated->GetCubicVolume();
// vol1 = 1000 + 1000 = 2000 cm3 (simple sum)

// Case 2: Overlapping (requires intersection calculation)
G4UnionSolid* overlapping = new G4UnionSolid("Over", box1, box2,
                                             nullptr, G4ThreeVector(5*cm, 0, 0));
G4double vol2 = overlapping->GetCubicVolume();
// vol2 = 1000 + 1000 - (overlap volume) (more expensive)
```

### Pitfall 3: Using Same Solid Twice

```cpp
// WRONG - using same solid for both A and B
G4Box* box = new G4Box("Box", 5*cm, 5*cm, 5*cm);
G4UnionSolid* selfUnion = new G4UnionSolid("SelfUnion", box, box,
                                           nullptr, G4ThreeVector(5*cm, 0, 0));
// Transformation applies to solid itself, not a copy!
// Result: undefined behavior

// CORRECT - use separate solids
G4Box* boxA = new G4Box("BoxA", 5*cm, 5*cm, 5*cm);
G4Box* boxB = new G4Box("BoxB", 5*cm, 5*cm, 5*cm);
G4UnionSolid* union = new G4UnionSolid("Union", boxA, boxB,
                                       nullptr, G4ThreeVector(5*cm, 0, 0));
```

### Pitfall 4: Ignoring Performance for Deeply Nested Booleans

```cpp
// INEFFICIENT - deeply nested unions
G4VSolid* result = solid1;
for (int i = 0; i < 100; ++i) {
    result = new G4UnionSolid("U" + std::to_string(i), result, solids[i],
                              nullptr, positions[i]);
}
// Each operation adds overhead, volume calculation very slow

// BETTER - combine groups, then unify groups
// Or use G4MultiUnion for many components
```

## Best Practices

### 1. Choose Appropriate Constituents

```cpp
// Good: Simple constituent solids
G4UnionSolid* good = new G4UnionSolid("Good",
                                      simpleBox,    // Fast operations
                                      simpleTube,   // Fast operations
                                      nullptr, trans);

// Avoid: Complex nested Booleans as constituents
G4UnionSolid* complexA = new G4UnionSolid(...);
G4UnionSolid* complexB = new G4UnionSolid(...);
G4UnionSolid* avoid = new G4UnionSolid("Avoid", complexA, complexB, ...);
// Prefer flattening the hierarchy if possible
```

### 2. Use Minimal Overlap

```cpp
// Efficient: Components just touching or slightly overlapping
G4ThreeVector touchingTrans(10*cm, 0, 0);  // Boxes of 5cm radius just touch
G4UnionSolid* efficient = new G4UnionSolid("Efficient", box1, box2,
                                           nullptr, touchingTrans);

// Less efficient: Large overlap
G4ThreeVector overlapTrans(2*cm, 0, 0);  // Significant overlap
G4UnionSolid* lessEfficient = new G4UnionSolid("LessEfficient", box1, box2,
                                               nullptr, overlapTrans);
// Volume calculation requires computing intersection
```

### 3. Cache Volume When Used Repeatedly

```cpp
// Pre-calculate volume if used many times
G4UnionSolid* union = new G4UnionSolid(...);
G4double volume = union->GetCubicVolume();  // Computed once, cached

// Later uses are fast
for (int i = 0; i < 1000; ++i) {
    G4double v = union->GetCubicVolume();  // Returns cached value instantly
}
```

### 4. Consider Alternative Approaches

```cpp
// Instead of many unions, consider:

// Option 1: G4MultiUnion for many components
G4MultiUnion* multi = new G4MultiUnion("Multi");
for (auto& solid : solids) {
    multi->AddNode(*solid, transform);
}

// Option 2: Custom G4VSolid subclass for specific shapes
// Option 3: Tessellated solid (G4TessellatedSolid) for complex CAD imports
```

## See Also

- [G4SubtractionSolid](g4subtractionsolid.md) - Subtraction (A - B)
- [G4IntersectionSolid](g4intersectionsolid.md) - Intersection (A ∩ B)
- [G4VSolid](g4vsolid.md) - Base class for all solids
- [G4LogicalVolume](g4logicalvolume.md) - Associates solid with material
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/solids/Boolean/include/G4UnionSolid.hh`
- Implementation: `source/geometry/solids/Boolean/src/G4UnionSolid.cc`
- Base class: `source/geometry/solids/Boolean/include/G4BooleanSolid.hh`

### Key Algorithms
- **Set Union**: Point ∈ (A ∪ B) ⟺ Point ∈ A ∨ Point ∈ B
- **Volume Formula**: V(A ∪ B) = V(A) + V(B) - V(A ∩ B)
- **Distance to Entry**: min(dist_A, dist_B)
- **Distance to Exit**: Iterative exit from both solids

### External Documentation
- [Geant4 User Guide: Boolean Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html#boolean-solids)
- [Constructive Solid Geometry](https://en.wikipedia.org/wiki/Constructive_solid_geometry)
