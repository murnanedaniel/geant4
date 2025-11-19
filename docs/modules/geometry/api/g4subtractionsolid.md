# G4SubtractionSolid

**Base Class**: G4BooleanSolid (extends [G4VSolid](g4vsolid.md))
**Location**: `source/geometry/solids/Boolean/include/G4SubtractionSolid.hh`
**Source**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc`

## Overview

G4SubtractionSolid represents the subtraction (difference operation) of one solid from another in Geant4. It creates a new solid by removing all space contained within solid B from solid A (A - B). This is the most commonly used Boolean operation for creating cavities, holes, and complex shapes with internal features.

Subtraction is essential for detector modeling where you need to create hollow volumes, cut away portions of solids, or define complex boundary conditions. The operation is non-commutative: A - B ≠ B - A.

## Key Features

- **Boolean Difference Operation**: Creates solid A with B removed (A \ B or A - B)
- **Non-Commutative**: Order matters - A minus B ≠ B minus A
- **Hole Creation**: Primary method for creating cavities and hollow structures
- **Surface Inversion**: B's surfaces become inverted (inward-pointing normals)
- **Conservative Bounding Box**: Uses A's bounds (B may cut from anywhere)
- **Infinite Loop Protection**: Detects and warns about pathological geometries

## Mathematical Definition

For a point **p** in space:
- **p** ∈ (A - B) if and only if **p** ∈ A **AND** **p** ∉ B

Special cases:
- **Surface**: Point on boundary of result (may be on A's outer surface or B's inner surface)
- **Normal**: On B's surface, normal points **inward** (opposite to B's outward normal)
- **Edge Cases**: When A and B boundaries coincide, normals determine inside/outside

## Class Definition

```cpp
class G4SubtractionSolid : public G4BooleanSolid
{
  public:
    // Constructors
    G4SubtractionSolid(const G4String& pName,
                       G4VSolid* pSolidA,
                       G4VSolid* pSolidB);

    G4SubtractionSolid(const G4String& pName,
                       G4VSolid* pSolidA,
                       G4VSolid* pSolidB,
                       G4RotationMatrix* rotMatrix,
                       const G4ThreeVector& transVector);

    G4SubtractionSolid(const G4String& pName,
                       G4VSolid* pSolidA,
                       G4VSolid* pSolidB,
                       const G4Transform3D& transform);

    ~G4SubtractionSolid() override;

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
};
```

## Constructors

### Basic Constructor

**Signature**:
```cpp
G4SubtractionSolid(const G4String& pName,
                   G4VSolid* pSolidA,
                   G4VSolid* pSolidB);
```
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:54-59`

Creates A - B where B is in the same coordinate system as A.

**Parameters**:
- `pName` - Name for this boolean solid
- `pSolidA` - Pointer to solid to subtract from (positive space)
- `pSolidB` - Pointer to solid to subtract (negative space, no transformation)

**Example**:
```cpp
// Create box with cylindrical hole through it
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4Tubs* hole = new G4Tubs("Hole", 0, 3*cm, 12*cm, 0, 2*pi);

// Subtract hole from box (both centered at origin)
G4SubtractionSolid* boxWithHole = new G4SubtractionSolid("BoxWithHole",
                                                         box, hole);
// Result: Box with hole through Z-axis
```

### Constructor with Rotation and Translation

**Signature**:
```cpp
G4SubtractionSolid(const G4String& pName,
                   G4VSolid* pSolidA,
                   G4VSolid* pSolidB,
                   G4RotationMatrix* rotMatrix,
                   const G4ThreeVector& transVector);
```
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:65-72`

Creates A - B where B is transformed relative to A.

**Parameters**:
- `pName` - Name for this boolean solid
- `pSolidA` - Solid to subtract from (reference frame)
- `pSolidB` - Solid to subtract (will be transformed)
- `rotMatrix` - Rotation to apply to solid B (can be nullptr)
- `transVector` - Translation to apply to solid B

**Example**:
```cpp
// Create sphere with off-center spherical cavity
G4Sphere* outerSphere = new G4Sphere("Outer", 0, 10*cm, 0, 2*pi, 0, pi);
G4Sphere* cavity = new G4Sphere("Cavity", 0, 7*cm, 0, 2*pi, 0, pi);

// Position cavity offset from center
G4ThreeVector offset(3*cm, 0, 0);
G4SubtractionSolid* hollowSphere = new G4SubtractionSolid("HollowSphere",
                                                          outerSphere, cavity,
                                                          nullptr, offset);
// Result: Thick-walled sphere with off-center cavity
```

### Constructor with G4Transform3D

**Signature**:
```cpp
G4SubtractionSolid(const G4String& pName,
                   G4VSolid* pSolidA,
                   G4VSolid* pSolidB,
                   const G4Transform3D& transform);
```
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:78-84`

Creates A - B using complete 3D transformation for B.

**Example**:
```cpp
// Create box with angled cylindrical bore
G4Box* block = new G4Box("Block", 10*cm, 10*cm, 10*cm);
G4Tubs* bore = new G4Tubs("Bore", 0, 2*cm, 15*cm, 0, 2*pi);

// Rotate bore 45 degrees around Y axis
G4RotationMatrix rot;
rot.rotateY(45*deg);
G4Transform3D transform(rot, G4ThreeVector(0, 0, 0));

G4SubtractionSolid* boredBlock = new G4SubtractionSolid("BoredBlock",
                                                        block, bore, transform);
// Result: Block with diagonal bore
```

## Bounding Volume Methods

### BoundingLimits()

**Signature**:
```cpp
void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:130-152`

Returns bounding box of the subtraction result.

**Algorithm**:
```cpp
void G4SubtractionSolid::BoundingLimits(G4ThreeVector& pMin,
                                        G4ThreeVector& pMax) const {
    // Subtraction result cannot be larger than solid A
    // so just return A's bounding box
    fPtrSolidA->BoundingLimits(pMin, pMax);

    // Validation check
    if (pMin.x() >= pMax.x() || pMin.y() >= pMax.y() || pMin.z() >= pMax.z()) {
        G4Exception("G4SubtractionSolid::BoundingLimits()", "GeomMgt0001",
                    JustWarning, "Bad bounding box");
    }
}
```

**Conservative Approach**: Returns A's bounding box since we cannot easily determine how much B removes.

**Note**: This may overestimate the actual bounds if B removes significant portions of A.

### CalculateExtent()

**Signature**:
```cpp
G4bool CalculateExtent(const EAxis pAxis,
                      const G4VoxelLimits& pVoxelLimit,
                      const G4AffineTransform& pTransform,
                      G4double& pMin, G4double& pMax) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:158-170`

Calculates extent along axis for voxelization.

**Algorithm**:
```cpp
G4bool G4SubtractionSolid::CalculateExtent(...) const {
    // Since we cannot be sure how much B subtracts from A,
    // we must use A's extent as conservative estimate
    return fPtrSolidA->CalculateExtent(pAxis, pVoxelLimit,
                                       pTransform, pMin, pMax);
}
```

**Returns**: Result from solid A's extent calculation

## Point Classification

### Inside()

**Signature**: `EInside Inside(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:176-193`

Determines whether point is inside, on surface, or outside (A - B).

**Returns**:
- `kInside` - Point is inside A and outside B
- `kSurface` - Point is on surface of result
- `kOutside` - Point is outside A or inside B

**Algorithm**:
```cpp
EInside G4SubtractionSolid::Inside(const G4ThreeVector& p) const {
    EInside positionA = fPtrSolidA->Inside(p);
    if (positionA == kOutside) { return kOutside; }  // Outside A => outside result

    EInside positionB = fPtrSolidB->Inside(p);
    if (positionB == kOutside) { return positionA; }  // Outside B => use A's status

    if (positionB == kInside) { return kOutside; }  // Inside B => removed by subtraction
    if (positionA == kInside) { return kSurface; }  // Inside A, on surface B

    // Point on surface of both solids
    static const G4double rtol = 1000 * kCarTolerance;
    G4ThreeVector normDiff = fPtrSolidA->SurfaceNormal(p) -
                             fPtrSolidB->SurfaceNormal(p);

    // If normals oppose (surface A == surface B), point is outside (removed)
    // Otherwise, point is on external surface
    return (normDiff.mag2() > rtol) ? kSurface : kOutside;
}
```

**Logic Table**:

| Position in A | Position in B | Result |
|--------------|---------------|---------|
| kOutside | any | kOutside (outside A) |
| kInside | kOutside | kInside (inside A, not removed) |
| kInside | kSurface | kSurface (on cavity wall) |
| kInside | kInside | kOutside (removed by B) |
| kSurface | kOutside | kSurface (on outer surface) |
| kSurface | kSurface | kSurface or kOutside (check normals) |

**Edge Case**: When on both surfaces, normals are compared:
- Similar normals → coincident surfaces → `kOutside` (removed)
- Different normals → legitimate surface → `kSurface`

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4Sphere* cavity = new G4Sphere("Cavity", 0, 5*cm, 0, 2*pi, 0, pi);
G4SubtractionSolid* hollowBox = new G4SubtractionSolid("Hollow",
                                                       box, cavity,
                                                       nullptr, G4ThreeVector());

G4ThreeVector p1(8*cm, 0, 0);     // Inside box, outside cavity
// Inside(p1) returns kInside

G4ThreeVector p2(3*cm, 0, 0);     // Inside box, inside cavity
// Inside(p2) returns kOutside (removed!)

G4ThreeVector p3(5*cm, 0, 0);     // Inside box, on cavity surface
// Inside(p3) returns kSurface (cavity wall)

G4ThreeVector p4(10*cm, 0, 0);    // On box surface, outside cavity
// Inside(p4) returns kSurface (outer surface)
```

## Surface Normal

### SurfaceNormal()

**Signature**: `G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:199-256`

Returns outward unit normal vector at surface point.

**Algorithm**:
```cpp
G4ThreeVector G4SubtractionSolid::SurfaceNormal(const G4ThreeVector& p) const {
    G4ThreeVector normal;

    EInside insideA = fPtrSolidA->Inside(p);
    EInside insideB = fPtrSolidB->Inside(p);

    // Point is outside A (error condition)
    if (insideA == kOutside) {
        return fPtrSolidA->SurfaceNormal(p);  // Return A's normal anyway
    }

    // Point on surface of A, outside or on surface of B
    if (insideA == kSurface && insideB != kInside) {
        return fPtrSolidA->SurfaceNormal(p);  // Outer surface
    }

    // Point inside A, on or inside B (cavity surface)
    if (insideA == kInside && insideB != kOutside) {
        // **KEY**: Negate B's normal (cavity wall points inward to B)
        return -fPtrSolidB->SurfaceNormal(p);
    }

    // Ambiguous case: compare distances
    if (fPtrSolidA->DistanceToOut(p) <= fPtrSolidB->DistanceToIn(p)) {
        return fPtrSolidA->SurfaceNormal(p);
    } else {
        return -fPtrSolidB->SurfaceNormal(p);  // Negated!
    }
}
```

**Critical Detail**: B's surface normal is **negated** because:
- B's normal points outward from B
- In subtraction, B creates a cavity in A
- Cavity wall normal must point outward from A-B (inward to B)
- Therefore: normal = -B.SurfaceNormal(p)

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4Sphere* cavity = new G4Sphere("Cavity", 0, 5*cm, 0, 2*pi, 0, pi);
G4SubtractionSolid* hollow = new G4SubtractionSolid("Hollow", box, cavity,
                                                    nullptr, G4ThreeVector());

// Point on outer box surface
G4ThreeVector p1(10*cm, 0, 0);
G4ThreeVector n1 = hollow->SurfaceNormal(p1);
// n1 = (1, 0, 0) - outward from box

// Point on cavity surface (sphere inside box)
G4ThreeVector p2(5*cm, 0, 0);
G4ThreeVector n2 = hollow->SurfaceNormal(p2);
// n2 = (-1, 0, 0) - inward to cavity (NEGATED from sphere's normal)
// Note: Sphere's normal at (5,0,0) would be (1,0,0), but we negate it
```

## Distance Calculations

### DistanceToIn(p, v) - Ray Intersection

**Signature**:
```cpp
G4double DistanceToIn(const G4ThreeVector& p,
                     const G4ThreeVector& v) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:262-394`

Calculates distance along direction to enter (A - B).

**Complexity**: Must handle particle exiting B (entering cavity) then re-entering A.

**Algorithm** (Simplified):
```cpp
G4double G4SubtractionSolid::DistanceToIn(const G4ThreeVector& p,
                                          const G4ThreeVector& v) const {
    G4double dist = 0.0;

    // CASE 1: Starting inside B (in the removed region)
    if (fPtrSolidB->Inside(p) != kOutside) {
        // Must first exit B (exit the cavity)
        dist = fPtrSolidB->DistanceToOut(p, v);

        // After exiting B, check if we're inside A
        if (fPtrSolidA->Inside(p + dist*v) != kInside) {
            // Not inside A yet, continue searching
            G4int count = 0;
            do {
                disTmp = fPtrSolidA->DistanceToIn(p + dist*v, v);
                if (disTmp == kInfinity) { return kInfinity; }
                dist += disTmp;

                // Check if we're back inside B (multiple crossings)
                if (Inside(p + dist*v) == kOutside) {
                    disTmp = fPtrSolidB->DistanceToOut(p + dist*v, v);
                    dist += disTmp;
                    ++count;
                    if (count > 1000) {  // Infinite loop protection
                        G4Exception(..., "GeomSolids1001", JustWarning,
                                   "Looping detected");
                        return dist;
                    }
                }
            } while (Inside(p + dist*v) == kOutside);
        }
    }
    // CASE 2: Starting outside A
    else {
        dist = fPtrSolidA->DistanceToIn(p, v);
        if (dist == kInfinity) { return kInfinity; }

        // After entering A, check if we're inside B (need to continue)
        G4int count = 0;
        while (Inside(p + dist*v) == kOutside) {
            disTmp = fPtrSolidB->DistanceToOut(p + dist*v, v);
            dist += disTmp;

            if (Inside(p + dist*v) == kOutside) {
                disTmp = fPtrSolidA->DistanceToIn(p + dist*v, v);
                if (disTmp == kInfinity) { return kInfinity; }
                dist += disTmp;
                ++count;
                if (count > 1000) {  // Loop protection
                    G4Exception(...);
                    return dist;
                }
            }
        }
    }

    return dist;
}
```

**Infinite Loop Protection**: Detects pathological geometries where particle oscillates between A and B boundaries.

**Performance**: Can be slow for complex nested subtractions with multiple crossings.

### DistanceToIn(p) - Safety Distance

**Signature**: `G4double DistanceToIn(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:402-432`

Approximate distance from external point to surface.

**Algorithm**:
```cpp
G4double G4SubtractionSolid::DistanceToIn(const G4ThreeVector& p) const {
    G4double dist;

    // Point inside A and inside B (in the cavity)
    if (fPtrSolidA->Inside(p) != kOutside &&
        fPtrSolidB->Inside(p) != kOutside) {
        // Distance to exit B (exit cavity, enter solid region)
        dist = fPtrSolidB->DistanceToOut(p);
    } else {
        // Distance to enter A from outside
        dist = fPtrSolidA->DistanceToIn(p);
    }

    return dist;
}
```

**Cases**:
- Inside cavity (in B): Distance to exit B (to solid material)
- Outside A: Distance to enter A

### DistanceToOut(p, v) - Exit Distance

**Signature**:
```cpp
G4double DistanceToOut(const G4ThreeVector& p,
                      const G4ThreeVector& v,
                      const G4bool calcNorm = false,
                      G4bool* validNorm = nullptr,
                      G4ThreeVector* n = nullptr) const override;
```
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:438-486`

Distance to exit (A - B) along direction.

**Algorithm**:
```cpp
G4double G4SubtractionSolid::DistanceToOut(...) const {
    G4double distA = fPtrSolidA->DistanceToOut(p, v, calcNorm, validNorm, n);
    G4double distB = fPtrSolidB->DistanceToIn(p, v);

    if (distB < distA) {
        // Hit cavity before exiting A
        if (calcNorm) {
            // Normal points inward to cavity (negated B normal)
            *n = -(fPtrSolidB->SurfaceNormal(p + distB*v));
            *validNorm = false;  // Subtraction normals may be unreliable
        }
        return distB;
    } else {
        // Exit A before hitting cavity
        return distA;
    }
}
```

**Logic**: Exit occurs at closer of:
1. Distance to exit A (outer boundary)
2. Distance to enter B (hit cavity)

**Normal**: If hitting cavity, normal is **negated** B's surface normal.

### DistanceToOut(p) - Safety Distance from Inside

**Signature**: `G4double DistanceToOut(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:492-516`

Distance from internal point to boundary.

**Algorithm**:
```cpp
G4double G4SubtractionSolid::DistanceToOut(const G4ThreeVector& p) const {
    return std::min(fPtrSolidA->DistanceToOut(p),
                   fPtrSolidB->DistanceToIn(p));
}
```

**Logic**: Closer of:
- Distance to exit A (outer wall)
- Distance to enter B (cavity wall)

## Volume Calculation

### GetCubicVolume()

**Signature**: `G4double GetCubicVolume() final`
**Line**: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc:590-626`

Calculates volume with caching and optimization.

**Algorithm**:
```cpp
G4double G4SubtractionSolid::GetCubicVolume() {
    if (fCubicVolume >= 0.) {
        return fCubicVolume;  // Cached
    }

    // Check if bounding boxes overlap
    G4ThreeVector bminA, bmaxA, bminB, bmaxB;
    fPtrSolidA->BoundingLimits(bminA, bmaxA);
    fPtrSolidB->BoundingLimits(bminB, bmaxB);

    G4bool noIntersection =
        bminA.x() >= bmaxB.x() || ... || bminB.z() >= bmaxA.z();

    if (noIntersection) {
        // B doesn't actually subtract anything
        fCubicVolume = fPtrSolidA->GetCubicVolume();
    } else {
        if (GetNumOfConstituents() > 10) {
            // Complex: use Monte Carlo
            fCubicVolume = G4BooleanSolid::GetCubicVolume();
        } else {
            // V(A - B) = V(A) - V(A ∩ B)
            G4IntersectionSolid intersectVol("Temp", fPtrSolidA, fPtrSolidB);
            intersectVol.SetCubVolStatistics(GetCubVolStatistics());
            intersectVol.SetCubVolEpsilon(GetCubVolEpsilon());

            G4double cubVolumeA = fPtrSolidA->GetCubicVolume();
            fCubicVolume = cubVolumeA - intersectVol.GetCubicVolume();

            // Sanity check: if result too small, use Monte Carlo
            if (fCubicVolume < 0.01 * cubVolumeA) {
                fCubicVolume = G4BooleanSolid::GetCubicVolume();
            }
        }
    }

    return fCubicVolume;
}
```

**Formula**: V(A - B) = V(A) - V(A ∩ B)

**Optimizations**:
1. If B doesn't intersect A: V = V(A)
2. If deeply nested: Monte Carlo sampling
3. If result suspiciously small: Monte Carlo fallback

## Performance Characteristics

### Computational Complexity

| Operation | Typical Complexity | Notes |
|-----------|-------------------|--------|
| **Inside()** | 2×solid_inside | Check both A and B |
| **DistanceToIn(p,v)** | O(n)×solid_dist | May iterate through crossings |
| **DistanceToOut(p,v)** | 2×solid_dist | Check A exit and B entry |
| **SurfaceNormal()** | 2×solid_inside + solid_normal | Determine which surface |
| **GetCubicVolume()** | First: O(intersection_vol) | Requires computing A ∩ B |

### Performance Considerations

**Strengths**:
- Conservative bounding box (uses A's bounds)
- Efficient for simple cavity cases
- Volume caching

**Weaknesses**:
- DistanceToIn can require iteration (slow for complex cases)
- Infinite loop protection overhead
- Surface normal calculation needs position checks

## Usage Examples

### Example 1: Box with Cylindrical Hole

```cpp
// Create solid block
G4Box* block = new G4Box("Block", 15*cm, 15*cm, 5*cm);

// Create cylindrical hole
G4Tubs* hole = new G4Tubs("Hole",
                          0,        // Inner radius
                          2*cm,     // Outer radius
                          6*cm,     // Half-length (longer than block)
                          0, 2*pi); // Full cylinder

// Subtract hole from block
G4SubtractionSolid* plate = new G4SubtractionSolid("Plate", block, hole,
                                                   nullptr, G4ThreeVector());

G4Material* steel = nist->FindOrBuildMaterial("G4_STAINLESS-STEEL");
G4LogicalVolume* plateLV = new G4LogicalVolume(plate, steel, "Plate");

// Result: 15×15×10 cm plate with 4 cm diameter hole through center
```

### Example 2: Hollow Sphere

```cpp
// Outer sphere
G4Sphere* outer = new G4Sphere("Outer",
                               0,        // Inner radius
                               10*cm,    // Outer radius
                               0, 2*pi,  // Full phi
                               0, pi);   // Full theta

// Inner cavity
G4Sphere* cavity = new G4Sphere("Cavity",
                                0,        // Inner radius
                                8*cm,     // Outer radius (2 cm thick shell)
                                0, 2*pi,
                                0, pi);

// Create hollow sphere
G4SubtractionSolid* shell = new G4SubtractionSolid("Shell", outer, cavity,
                                                   nullptr, G4ThreeVector());

G4Material* plastic = nist->FindOrBuildMaterial("G4_PLASTIC_SC_VINYLTOLUENE");
G4LogicalVolume* shellLV = new G4LogicalVolume(shell, plastic, "Shell");

// Calculate volume
G4double volume = shell->GetCubicVolume();
G4double expectedVol = (4.0/3.0) * pi * (std::pow(10*cm,3) - std::pow(8*cm,3));
G4cout << "Shell volume: " << volume/cm3 << " cm3" << G4endl;
G4cout << "Expected: " << expectedVol/cm3 << " cm3" << G4endl;
```

### Example 3: Pipe with Flange

```cpp
// Main pipe body
G4Tubs* pipe = new G4Tubs("Pipe",
                          8*cm,      // Inner radius
                          10*cm,     // Outer radius (2 cm wall)
                          50*cm,     // Half-length
                          0, 2*pi);

// Flange (larger cylinder)
G4Tubs* flange = new G4Tubs("Flange",
                            0,         // Solid (no hole yet)
                            15*cm,     // Flange radius
                            3*cm,      // Flange thickness
                            0, 2*pi);

// Flange hole (same as pipe inner radius)
G4Tubs* flangeHole = new G4Tubs("FlangeHole",
                                0,
                                8*cm,
                                4*cm,  // Longer than flange
                                0, 2*pi);

// Create hollow flange
G4SubtractionSolid* hollowFlange = new G4SubtractionSolid("HollowFlange",
                                                          flange, flangeHole,
                                                          nullptr, G4ThreeVector());

// Position flange at end of pipe
// Note: Would then use G4UnionSolid to combine pipe with flanges at both ends
```

### Example 4: Multiple Holes

```cpp
// Base plate
G4Box* plate = new G4Box("Plate", 20*cm, 20*cm, 2*cm);

// First hole
G4Tubs* hole1 = new G4Tubs("Hole1", 0, 1*cm, 3*cm, 0, 2*pi);
G4SubtractionSolid* plateWith1Hole = new G4SubtractionSolid("Plate1",
                                                            plate, hole1,
                                                            nullptr,
                                                            G4ThreeVector(5*cm, 5*cm, 0));

// Second hole
G4Tubs* hole2 = new G4Tubs("Hole2", 0, 1*cm, 3*cm, 0, 2*pi);
G4SubtractionSolid* plateWith2Holes = new G4SubtractionSolid("Plate2",
                                                             plateWith1Hole, hole2,
                                                             nullptr,
                                                             G4ThreeVector(-5*cm, 5*cm, 0));

// Third hole
G4Tubs* hole3 = new G4Tubs("Hole3", 0, 1*cm, 3*cm, 0, 2*pi);
G4SubtractionSolid* finalPlate = new G4SubtractionSolid("FinalPlate",
                                                        plateWith2Holes, hole3,
                                                        nullptr,
                                                        G4ThreeVector(0, -5*cm, 0));

// Result: Plate with three holes at different positions
```

### Example 5: Off-Center Cavity

```cpp
// Rectangular block
G4Box* block = new G4Box("Block", 10*cm, 10*cm, 10*cm);

// Spherical cavity (off-center)
G4Sphere* cavity = new G4Sphere("Cavity", 0, 6*cm, 0, 2*pi, 0, pi);

// Position cavity near edge
G4ThreeVector cavityPos(4*cm, 0, 0);
G4SubtractionSolid* partialHollow = new G4SubtractionSolid("PartialHollow",
                                                           block, cavity,
                                                           nullptr, cavityPos);

// Test points
G4ThreeVector p1(0, 0, 0);        // Center of block, inside cavity
G4cout << "Center: " << (partialHollow->Inside(p1) == kOutside ? "removed" : "solid")
       << G4endl;  // "removed"

G4ThreeVector p2(-5*cm, 0, 0);    // Far side, outside cavity
G4cout << "Far side: " << (partialHollow->Inside(p2) == kInside ? "solid" : "removed")
       << G4endl;  // "solid"

G4ThreeVector p3(10*cm, 0, 0);    // Cavity surface at block edge
if (partialHollow->Inside(p3) == kSurface) {
    G4ThreeVector normal = partialHollow->SurfaceNormal(p3);
    G4cout << "Surface normal: " << normal << G4endl;
    // Should point inward to cavity (away from sphere center)
}
```

### Example 6: Overlapping Subtractions

```cpp
// Base cylinder
G4Tubs* cylinder = new G4Tubs("Cylinder", 0, 10*cm, 10*cm, 0, 2*pi);

// First cut (box)
G4Box* cut1 = new G4Box("Cut1", 12*cm, 3*cm, 12*cm);
G4SubtractionSolid* step1 = new G4SubtractionSolid("Step1", cylinder, cut1,
                                                   nullptr, G4ThreeVector(0, 5*cm, 0));

// Second cut (box at different angle)
G4Box* cut2 = new G4Box("Cut2", 3*cm, 12*cm, 12*cm);
G4SubtractionSolid* step2 = new G4SubtractionSolid("Step2", step1, cut2,
                                                   nullptr, G4ThreeVector(5*cm, 0, 0));

// Result: Cylinder with two flat cuts creating intersection edge
```

## Common Pitfalls

### Pitfall 1: Forgetting to Extend Subtracted Solid

```cpp
// WRONG - hole doesn't go all the way through
G4Box* plate = new G4Box("Plate", 10*cm, 10*cm, 1*cm);  // 2 cm thick
G4Tubs* hole = new G4Tubs("Hole", 0, 0.5*cm, 0.5*cm, 0, 2*pi);  // Only 1 cm long
G4SubtractionSolid* bad = new G4SubtractionSolid("Bad", plate, hole,
                                                 nullptr, G4ThreeVector());
// Result: Hole only goes halfway through!

// CORRECT - hole extends beyond plate
G4Tubs* hole = new G4Tubs("Hole", 0, 0.5*cm, 1.5*cm, 0, 2*pi);  // 3 cm long
G4SubtractionSolid* good = new G4SubtractionSolid("Good", plate, hole,
                                                  nullptr, G4ThreeVector());
// Result: Hole goes all the way through (with safety margin)
```

### Pitfall 2: Inverted Normal Confusion

```cpp
// Understanding normal direction on cavity surfaces
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4Sphere* cavity = new G4Sphere("Cavity", 0, 5*cm, 0, 2*pi, 0, pi);
G4SubtractionSolid* hollow = new G4SubtractionSolid("Hollow", box, cavity,
                                                    nullptr, G4ThreeVector());

G4ThreeVector cavitySurfacePoint(5*cm, 0, 0);
G4ThreeVector normal = hollow->SurfaceNormal(cavitySurfacePoint);

// Sphere's normal at (5,0,0) would be (1,0,0) - pointing outward from sphere
// BUT: Subtraction negates it => normal = (-1,0,0) - pointing inward to cavity
// This is CORRECT: normal points outward from the solid material

// Common mistake: expecting normal to match sphere's normal
// Remember: cavity walls have inverted normals!
```

### Pitfall 3: B Completely Outside A

```cpp
// INEFFECTIVE - B doesn't intersect A
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4Sphere* sphere = new G4Sphere("Sphere", 0, 5*cm, 0, 2*pi, 0, pi);
G4ThreeVector farAway(100*cm, 0, 0);
G4SubtractionSolid* unchanged = new G4SubtractionSolid("Unchanged",
                                                       box, sphere,
                                                       nullptr, farAway);
// Result: Identical to original box (B doesn't subtract anything)
// Wastes computation time in volume calculation
```

### Pitfall 4: Very Small Remaining Volume

```cpp
// UNSTABLE - subtraction removes almost all of A
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm, 0, 2*pi, 0, pi);
G4Sphere* almostSame = new G4Sphere("AlmostSame", 0, 9.99*cm, 0, 2*pi, 0, pi);
G4SubtractionSolid* thinShell = new G4SubtractionSolid("ThinShell",
                                                       sphere, almostSame,
                                                       nullptr, G4ThreeVector());
// Result: Extremely thin shell (0.01 cm thick)
// May have numerical precision issues in navigation
// Volume calculation may be unreliable

// BETTER - use reasonable minimum thickness (> 10×tolerance)
G4double minThickness = 20 * kCarTolerance;  // ~0.02 mm minimum
```

### Pitfall 5: Infinite Loop Scenarios

```cpp
// PATHOLOGICAL - can cause infinite loops in DistanceToIn
// Example: Concentric spheres with very close radii
G4Sphere* outer = new G4Sphere("Outer", 0, 10.000*cm, 0, 2*pi, 0, pi);
G4Sphere* inner = new G4Sphere("Inner", 0,  9.999*cm, 0, 2*pi, 0, pi);
G4SubtractionSolid* problematic = new G4SubtractionSolid("Problematic",
                                                         outer, inner,
                                                         nullptr, G4ThreeVector());
// Particle may oscillate at boundary between A and B surfaces
// DistanceToIn has protection but will warn after 1000 iterations

// AVOID - keep reasonable separation between surfaces
```

## Best Practices

### 1. Extend Subtracted Solids Beyond Base

```cpp
// Always make subtracted solid larger than region to be removed
G4Box* base = new G4Box("Base", 10*cm, 10*cm, 5*cm);
G4Tubs* hole = new G4Tubs("Hole", 0, 2*cm,
                          6*cm,  // 1 cm longer than base (safety margin)
                          0, 2*pi);
G4SubtractionSolid* good = new G4SubtractionSolid("Good", base, hole,
                                                  nullptr, G4ThreeVector());
```

### 2. Check Volume After Subtraction

```cpp
G4SubtractionSolid* result = new G4SubtractionSolid(...);

G4double volumeA = solidA->GetCubicVolume();
G4double volumeResult = result->GetCubicVolume();

if (volumeResult > volumeA) {
    G4cerr << "ERROR: Result volume > original!" << G4endl;
}
if (volumeResult < 0.01 * volumeA) {
    G4cerr << "WARNING: Very thin remaining volume (< 1%)" << G4endl;
}
```

### 3. Use Simple Constituent Solids

```cpp
// GOOD - simple primitives
G4Box* box = new G4Box(...);
G4Tubs* tube = new G4Tubs(...);
G4SubtractionSolid* good = new G4SubtractionSolid("Good", box, tube, ...);

// AVOID - nested Booleans as constituents
G4SubtractionSolid* complexA = new G4SubtractionSolid(...);
G4SubtractionSolid* complexB = new G4SubtractionSolid(...);
G4SubtractionSolid* avoid = new G4SubtractionSolid("Avoid", complexA, complexB, ...);
// Performance degrades significantly with nesting depth
```

### 4. Consider Alternative Approaches

```cpp
// Instead of multiple subtractions for array of holes:

// Option 1: Use G4MultiUnion of individual hole shapes
// Option 2: Define custom G4VSolid with analytical hole pattern
// Option 3: Use G4TessellatedSolid for complex CAD-imported shapes
// Option 4: Consider if separate logical volumes would work better
```

### 5. Test Edge Cases

```cpp
G4SubtractionSolid* solid = new G4SubtractionSolid(...);

// Test various point classifications
std::vector<G4ThreeVector> testPoints = {
    {0, 0, 0},           // Center
    /* outer surface */ ,
    /* cavity surface */,
    /* far outside */   ,
};

for (const auto& p : testPoints) {
    EInside status = solid->Inside(p);
    if (status == kSurface) {
        G4ThreeVector normal = solid->SurfaceNormal(p);
        G4cout << "Point: " << p << " Normal: " << normal << G4endl;
    }
}
```

## See Also

- [G4UnionSolid](g4unionsolid.md) - Union (A ∪ B)
- [G4IntersectionSolid](g4intersectionsolid.md) - Intersection (A ∩ B)
- [G4VSolid](g4vsolid.md) - Base class for all solids
- [G4DisplacedSolid](g4displac edsolid.md) - Solid with transformation
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/solids/Boolean/include/G4SubtractionSolid.hh`
- Implementation: `source/geometry/solids/Boolean/src/G4SubtractionSolid.cc`
- Base class: `source/geometry/solids/Boolean/include/G4BooleanSolid.hh`

### Key Algorithms
- **Set Difference**: Point ∈ (A - B) ⟺ Point ∈ A ∧ Point ∉ B
- **Volume Formula**: V(A - B) = V(A) - V(A ∩ B)
- **Normal Inversion**: Cavity normals = -B.SurfaceNormal()
- **Infinite Loop Protection**: Limit iterations in DistanceToIn

### External Documentation
- [Geant4 User Guide: Boolean Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html#boolean-solids)
- [CSG Operations](https://en.wikipedia.org/wiki/Constructive_solid_geometry)
