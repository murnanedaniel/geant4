# G4Box

**Base Class**: G4CSGSolid (extends [G4VSolid](g4vsolid.md))
**Location**: `source/geometry/solids/CSG/include/G4Box.hh`
**Source**: `source/geometry/solids/CSG/src/G4Box.cc`
**Inline**: `source/geometry/solids/CSG/include/G4Box.icc`

## Overview

G4Box represents a rectangular parallelepiped (box/cuboid) with faces parallel to the coordinate axes. It is the simplest and most efficient CSG (Constructive Solid Geometry) solid in Geant4. The box is always centered at the origin of its local coordinate system and defined by three half-lengths along the X, Y, and Z axes.

G4Box serves as the canonical example of a well-optimized solid implementation and is extensively used for world volumes, detectors, shielding, and building blocks of complex geometries.

## Key Features

- **Simplest CSG Solid**: Axis-aligned rectangular box
- **Highly Optimized**: Fastest solid for all operations (Inside, DistanceToIn/Out, etc.)
- **Analytical Solutions**: Closed-form mathematics for all computations
- **Inline Performance**: Critical methods inlined for maximum speed
- **Faceted**: All faces are planar (returns `true` for `IsFaceted()`)
- **Cached Volume/Area**: Analytical formulas with lazy evaluation
- **Minimal Memory**: Only 4 doubles (3 half-lengths + tolerance cache)
- **Thread-Safe**: Immutable after construction

## Class Definition

```cpp
class G4Box : public G4CSGSolid
{
  public:
    // Constructor
    G4Box(const G4String& pName, G4double pX, G4double pY, G4double pZ);

    // Destructor
    ~G4Box() override;

    // Dimension accessors (inline)
    G4double GetXHalfLength() const;
    G4double GetYHalfLength() const;
    G4double GetZHalfLength() const;

    // Dimension modifiers
    void SetXHalfLength(G4double dx);
    void SetYHalfLength(G4double dy);
    void SetZHalfLength(G4double dz);

    // Volume and surface area (inline, cached)
    G4double GetCubicVolume() override;
    G4double GetSurfaceArea() override;

    // Core solid interface (from G4VSolid)
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

    G4GeometryType GetEntityType() const override;
    G4ThreeVector GetPointOnSurface() const override;
    G4bool IsFaceted() const override;
    G4VSolid* Clone() const override;
    std::ostream& StreamInfo(std::ostream& os) const override;

    // Visualization
    void DescribeYourselfTo(G4VGraphicsScene& scene) const override;
    G4VisExtent GetExtent() const override;
    G4Polyhedron* CreatePolyhedron() const override;

    // Parameterization support
    void ComputeDimensions(G4VPVParameterisation* p,
                           const G4int n,
                           const G4VPhysicalVolume* pRep) override;

  private:
    G4ThreeVector ApproxSurfaceNormal(const G4ThreeVector& p) const;

    G4double fDx = 0.0;  // Half-length along X
    G4double fDy = 0.0;  // Half-length along Y
    G4double fDz = 0.0;  // Half-length along Z
    G4double delta;      // Cached half surface tolerance (0.5*kCarTolerance)
};
```

## Constructor and Destructor

### Constructor

**Signature**:
```cpp
G4Box(const G4String& pName, G4double pX, G4double pY, G4double pZ);
```
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:52-68`

Creates a box centered at the origin with specified half-lengths.

**Parameters**:
- `pName` - Name for this solid (used in G4SolidStore)
- `pX` - Half-length along X axis (must be ≥ 2×kCarTolerance)
- `pY` - Half-length along Y axis (must be ≥ 2×kCarTolerance)
- `pZ` - Half-length along Z axis (must be ≥ 2×kCarTolerance)

**Validation**:
```cpp
// Lines 59-67
if (pX < 2*kCarTolerance ||
    pY < 2*kCarTolerance ||
    pZ < 2*kCarTolerance) {
    G4Exception("G4Box::G4Box()", "GeomSolids0002",
                FatalException, "Dimensions too small for Solid");
}
```

**Minimum dimension**: ~2 nm (2 × 10⁻⁹ mm) - ensures surface thickness

**Actions**:
1. Calls `G4CSGSolid(pName)` constructor (which calls G4VSolid)
2. Sets half-lengths: `fDx = pX`, `fDy = pY`, `fDz = pZ`
3. Caches half-tolerance: `delta = 0.5 * kCarTolerance`
4. Registers with G4SolidStore (automatic in G4VSolid constructor)

**Example**:
```cpp
// Box of 20cm × 40cm × 60cm (full dimensions)
G4Box* box = new G4Box("DetectorBox",
                       10*cm,   // Half-length X = 10cm
                       20*cm,   // Half-length Y = 20cm
                       30*cm);  // Half-length Z = 30cm

// Box extends from:
//   X: -10cm to +10cm
//   Y: -20cm to +20cm
//   Z: -30cm to +30cm
```

### Destructor

**Signature**: `~G4Box() override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:84`

**Implementation**: `= default` (compiler-generated)

Destructor is trivial because:
- No dynamically allocated memory in G4Box
- Base class G4CSGSolid handles cleanup
- Automatic deregistration from G4SolidStore

## Dimension Accessors and Modifiers

### GetXHalfLength() / GetYHalfLength() / GetZHalfLength()

**Signature**:
```cpp
inline G4double GetXHalfLength() const;
inline G4double GetYHalfLength() const;
inline G4double GetZHalfLength() const;
```
**Line**: `source/geometry/solids/CSG/include/G4Box.icc:29-45`

Returns the half-length along each axis.

**Implementation**: Simple member access (inlined for zero overhead)
```cpp
inline G4double G4Box::GetXHalfLength() const { return fDx; }
inline G4double G4Box::GetYHalfLength() const { return fDy; }
inline G4double G4Box::GetZHalfLength() const { return fDz; }
```

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 20*cm, 30*cm);
G4cout << "Full X dimension: " << 2*box->GetXHalfLength()/cm << " cm" << G4endl;
// Output: Full X dimension: 20 cm
```

### SetXHalfLength() / SetYHalfLength() / SetZHalfLength()

**Signature**:
```cpp
void SetXHalfLength(G4double dx);
void SetYHalfLength(G4double dy);
void SetZHalfLength(G4double dz);
```
**Lines**: `source/geometry/solids/CSG/src/G4Box.cc:120-184`

Modifies box dimensions with validation.

**Parameters**: New half-length (must be ≥ 2×kCarTolerance)

**Side Effects**:
1. Updates dimension (`fDx`, `fDy`, or `fDz`)
2. Invalidates cached volume: `fCubicVolume = 0`
3. Invalidates cached surface area: `fSurfaceArea = 0`
4. Sets polyhedron rebuild flag: `fRebuildPolyhedron = true`

**Validation**: FatalException if dimension too small

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
box->SetXHalfLength(20*cm);  // Change X dimension
// Now box is 40cm × 20cm × 20cm
```

**Warning**: Should only be called during geometry construction, NOT during simulation!

## Volume and Surface Area

### GetCubicVolume()

**Signature**: `inline G4double GetCubicVolume() override`
**Line**: `source/geometry/solids/CSG/include/G4Box.icc:47-53`

Returns the volume in mm³ with lazy evaluation and caching.

**Formula**: V = 8 × fDx × fDy × fDz

**Implementation**:
```cpp
inline G4double G4Box::GetCubicVolume() {
    if (fCubicVolume != 0.) {;}  // Already cached
    else { fCubicVolume = 8*fDx*fDy*fDz; }
    return fCubicVolume;
}
```

**Performance**:
- First call: ~3 multiplications
- Subsequent calls: ~1 comparison (cached)

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 20*cm, 30*cm);
G4double volume = box->GetCubicVolume();
// volume = 8 × 10 × 20 × 30 = 48000 cm³ = 0.048 m³
```

### GetSurfaceArea()

**Signature**: `inline G4double GetSurfaceArea() override`
**Line**: `source/geometry/solids/CSG/include/G4Box.icc:55-61`

Returns the surface area in mm² with lazy evaluation and caching.

**Formula**: A = 8 × (fDx×fDy + fDx×fDz + fDy×fDz)

**Implementation**:
```cpp
inline G4double G4Box::GetSurfaceArea() {
    if (fSurfaceArea != 0.) {;}  // Already cached
    else { fSurfaceArea = 8*(fDx*fDy + fDx*fDz + fDy*fDz); }
    return fSurfaceArea;
}
```

**Note**: Factor of 8 accounts for 2 faces per axis pair × 4 to convert half-lengths to full

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 20*cm, 30*cm);
G4double area = box->GetSurfaceArea();
// area = 8 × (200 + 300 + 600) = 8800 cm²
```

## Bounding Volume Methods

### BoundingLimits()

**Signature**:
```cpp
void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:202-219`

Returns the axis-aligned bounding box in local coordinates.

**Output Parameters**:
- `pMin` - Minimum corner: (-fDx, -fDy, -fDz)
- `pMax` - Maximum corner: (+fDx, +fDy, +fDz)

**Implementation**:
```cpp
void G4Box::BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const {
    pMin.set(-fDx, -fDy, -fDz);
    pMax.set( fDx,  fDy,  fDz);

    // Validation: ensure min < max
    if (pMin.x() >= pMax.x() || pMin.y() >= pMax.y() || pMin.z() >= pMax.z()) {
        G4Exception(..., JustWarning, "Bad bounding box");
    }
}
```

**Use Case**: Voxelization and spatial optimization

**Example**:
```cpp
G4ThreeVector pMin, pMax;
box->BoundingLimits(pMin, pMax);
G4cout << "Box bounds: " << pMin << " to " << pMax << G4endl;
```

### CalculateExtent()

**Signature**:
```cpp
G4bool CalculateExtent(const EAxis pAxis,
                       const G4VoxelLimits& pVoxelLimit,
                       const G4AffineTransform& pTransform,
                       G4double& pMin, G4double& pMax) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:225-238`

Calculates extent along an axis under transformation and voxel limits.

**Parameters**:
- `pAxis` - Axis to calculate extent along (kXAxis, kYAxis, kZAxis)
- `pVoxelLimit` - Voxel boundaries to clip against
- `pTransform` - Transformation to apply to box
- `pMin` [out] - Minimum extent along axis
- `pMax` [out] - Maximum extent along axis

**Returns**: `true` if box intersects voxel limits, `false` otherwise

**Algorithm**:
```cpp
G4bool G4Box::CalculateExtent(...) const {
    G4ThreeVector bmin, bmax;
    BoundingLimits(bmin, bmax);  // Get local bounds

    // Delegate to G4BoundingEnvelope for transformation and clipping
    G4BoundingEnvelope bbox(bmin, bmax);
    return bbox.CalculateExtent(pAxis, pVoxelLimit, pTransform, pMin, pMax);
}
```

**Use Case**: Voxelization for navigation optimization

## Point Classification

### Inside()

**Signature**: `EInside Inside(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:244-252`

Determines whether a point is inside, outside, or on the surface.

**Parameters**: `p` - Point in local coordinates

**Returns**:
- `kInside` - Point is inside (distance to all faces > delta)
- `kSurface` - Point is on surface (within tolerance band)
- `kOutside` - Point is outside (beyond any face)

**Algorithm**:
```cpp
EInside G4Box::Inside(const G4ThreeVector& p) const {
    // Maximum signed distance to any face
    G4double dist = std::max(std::max(
                    std::abs(p.x()) - fDx,
                    std::abs(p.y()) - fDy),
                    std::abs(p.z()) - fDz);

    // delta = 0.5 * kCarTolerance
    if (dist > delta)  return kOutside;   // Far from surface
    if (dist > -delta) return kSurface;   // Within tolerance band
    return kInside;                        // Well inside
}
```

**Optimization Techniques**:
1. **Single comparison**: Compute max distance once
2. **Symmetry**: Use `abs()` to handle all faces uniformly
3. **No branching**: Simple threshold comparison

**Tolerance Band**: ±delta around each face

**Performance**: ~10 CPU instructions (extremely fast!)

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);

G4ThreeVector p1(5*cm, 0, 0);        // Inside
G4ThreeVector p2(10*cm, 0, 0);       // On surface (+X face)
G4ThreeVector p3(15*cm, 0, 0);       // Outside

G4cout << box->Inside(p1) << G4endl;  // Output: 0 (kInside)
G4cout << box->Inside(p2) << G4endl;  // Output: 1 (kSurface)
G4cout << box->Inside(p3) << G4endl;  // Output: 2 (kOutside)
```

## Surface Normal

### SurfaceNormal()

**Signature**: `G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:258-291`

Returns the outward unit normal vector at or near a surface point.

**Parameters**: `p` - Point near surface (in local coordinates)

**Returns**: Unit normal vector pointing outward from box

**Algorithm**:
```cpp
G4ThreeVector G4Box::SurfaceNormal(const G4ThreeVector& p) const {
    G4ThreeVector norm(0., 0., 0.);

    // Check each face - point can be on multiple faces (edge/corner)
    if (std::abs(std::abs(p.x()) - fDx) <= delta)
        norm.setX(std::copysign(1., p.x()));  // ±1 based on sign of p.x()

    if (std::abs(std::abs(p.y()) - fDy) <= delta)
        norm.setY(std::copysign(1., p.y()));

    if (std::abs(std::abs(p.z()) - fDz) <= delta)
        norm.setZ(std::copysign(1., p.z()));

    G4double nside = norm.mag2();  // Number of faces (magnitude squared)

    if (nside == 1)
        return norm;               // On face: return unit vector
    else if (nside > 1)
        return norm.unit();        // On edge/corner: return normalized sum
    else
        return ApproxSurfaceNormal(p);  // Not on surface: approximate
}
```

**Use of `std::copysign()`**: Fast way to set ±1 based on coordinate sign
- `copysign(1., p.x())` returns +1 if p.x() ≥ 0, -1 otherwise

**Edge and Corner Handling**:
- **Face**: One component = ±1, others = 0 (e.g., (1,0,0))
- **Edge**: Two components = ±1, normalized (e.g., (1,1,0)/√2)
- **Corner**: Three components = ±1, normalized (e.g., (1,1,1)/√3)

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);

// Point on +X face
G4ThreeVector p1(10*cm, 5*cm, 5*cm);
G4cout << box->SurfaceNormal(p1) << G4endl;  // Output: (1, 0, 0)

// Point on edge (+X, +Y)
G4ThreeVector p2(10*cm, 10*cm, 0);
G4cout << box->SurfaceNormal(p2) << G4endl;  // Output: (0.707, 0.707, 0)

// Point on corner (+X, +Y, +Z)
G4ThreeVector p3(10*cm, 10*cm, 10*cm);
G4cout << box->SurfaceNormal(p3) << G4endl;  // Output: (0.577, 0.577, 0.577)
```

### ApproxSurfaceNormal()

**Signature**: `G4ThreeVector ApproxSurfaceNormal(const G4ThreeVector& p) const`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:298-310`

Fallback for points not on surface - returns normal of nearest face.

**Algorithm**:
```cpp
G4ThreeVector G4Box::ApproxSurfaceNormal(const G4ThreeVector& p) const {
    G4double distx = std::abs(p.x()) - fDx;
    G4double disty = std::abs(p.y()) - fDy;
    G4double distz = std::abs(p.z()) - fDz;

    // Return normal of face with maximum distance
    if (distx >= disty && distx >= distz)
        return {std::copysign(1., p.x()), 0., 0.};
    if (disty >= distx && disty >= distz)
        return {0., std::copysign(1., p.y()), 0.};
    else
        return {0., 0., std::copysign(1., p.z())};
}
```

**Use Case**: Called when point is not within tolerance of surface (usually an error condition)

## Distance Calculations

### DistanceToIn(p, v) - Ray Intersection

**Signature**:
```cpp
G4double DistanceToIn(const G4ThreeVector& p,
                      const G4ThreeVector& v) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:318-346`

Calculates distance along ray from outside point to first intersection.

**Parameters**:
- `p` - Starting point (assumed outside or on surface)
- `v` - Direction vector (must be unit vector)

**Returns**:
- Distance ≥ 0 to intersection
- `kInfinity` if no intersection
- 0 if already on surface and entering

**Algorithm** (Slab Method):
```cpp
G4double G4Box::DistanceToIn(const G4ThreeVector& p,
                             const G4ThreeVector& v) const {
    // Early exit: if on surface and moving away
    if ((std::abs(p.x()) - fDx) >= -delta && p.x()*v.x() >= 0) return kInfinity;
    if ((std::abs(p.y()) - fDy) >= -delta && p.y()*v.y() >= 0) return kInfinity;
    if ((std::abs(p.z()) - fDz) >= -delta && p.z()*v.z() >= 0) return kInfinity;

    // Find intersection intervals with each pair of parallel faces
    // X faces: x = ±fDx
    G4double invx = (v.x() == 0) ? DBL_MAX : -1./v.x();
    G4double dx = std::copysign(fDx, invx);  // Pick correct face based on direction
    G4double txmin = (p.x() - dx) * invx;
    G4double txmax = (p.x() + dx) * invx;

    // Y faces: y = ±fDy
    G4double invy = (v.y() == 0) ? DBL_MAX : -1./v.y();
    G4double dy = std::copysign(fDy, invy);
    G4double tymin = std::max(txmin, (p.y() - dy) * invy);
    G4double tymax = std::min(txmax, (p.y() + dy) * invy);

    // Z faces: z = ±fDz
    G4double invz = (v.z() == 0) ? DBL_MAX : -1./v.z();
    G4double dz = std::copysign(fDz, invz);
    G4double tmin = std::max(tymin, (p.z() - dz) * invz);
    G4double tmax = std::min(tymax, (p.z() + dz) * invz);

    // Check for valid intersection
    if (tmax <= tmin + delta) return kInfinity;  // No overlap or just touching
    return (tmin < delta) ? 0. : tmin;           // Return entry distance
}
```

**Optimization Techniques**:
1. **Early exit**: Check if on surface and moving away
2. **Slab method**: Efficient ray-box intersection algorithm
3. **copysign()**: Avoid branching to select correct face
4. **Inverse direction**: Compute once, reuse for both faces

**Mathematical Insight**:
- Ray equation: `p + t*v`
- Face equation: `x = ±fDx`
- Solve: `p.x() + t*v.x() = ±fDx` → `t = (±fDx - p.x()) / v.x()`
- Use `copysign()` to automatically pick correct sign

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);

// Ray from outside pointing toward box
G4ThreeVector p(-20*cm, 0, 0);
G4ThreeVector v(1, 0, 0);  // Unit vector toward +X
G4double dist = box->DistanceToIn(p, v);
// dist = 10 cm (hits -X face at x=-10)

// Ray from outside missing box
G4ThreeVector p2(-20*cm, 15*cm, 0);  // Too high
G4ThreeVector v2(1, 0, 0);
G4double dist2 = box->DistanceToIn(p2, v2);
// dist2 = kInfinity (no hit)
```

### DistanceToIn(p) - Safety Distance

**Signature**: `G4double DistanceToIn(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:355-362`

Calculates approximate (or exact) distance from outside point to nearest surface.

**Parameters**: `p` - Starting point (assumed outside)

**Returns**: Distance to nearest surface (can be underestimate, never overestimate)

**Algorithm**:
```cpp
G4double G4Box::DistanceToIn(const G4ThreeVector& p) const {
    // Perpendicular distance to each face
    G4double dx = std::abs(p.x()) - fDx;
    G4double dy = std::abs(p.y()) - fDy;
    G4double dz = std::abs(p.z()) - fDz;

    // Maximum distance (nearest face)
    G4double dist = std::max(std::max(dx, dy), dz);
    return (dist > 0) ? dist : 0.;
}
```

**Note**: For G4Box, this is EXACT (not an underestimate), returning perpendicular distance to nearest face.

**Use Case**: "Safety" calculations in navigation - determines how far particle can travel without boundary checks

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);

G4ThreeVector p(15*cm, 8*cm, 5*cm);
G4double safety = box->DistanceToIn(p);
// safety = 5 cm (distance to +X face at x=10)

G4ThreeVector p2(15*cm, 15*cm, 0);
G4double safety2 = box->DistanceToIn(p2);
// safety2 = 5 cm (both X and Y are 5cm away, max is 5)
```

### DistanceToOut(p, v, ...) - Exit Distance

**Signature**:
```cpp
G4double DistanceToOut(const G4ThreeVector& p,
                       const G4ThreeVector& v,
                       const G4bool calcNorm = false,
                       G4bool* validNorm = nullptr,
                       G4ThreeVector* n = nullptr) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:370-421`

Calculates distance from inside point to exit surface, optionally computing exit normal.

**Parameters**:
- `p` - Starting point (assumed inside or on surface)
- `v` - Direction vector (must be unit vector)
- `calcNorm` - If true, calculate exit normal
- `validNorm` [out] - Set to true (box is always convex)
- `n` [out] - Exit surface normal (if calcNorm=true)

**Returns**: Distance to exit ≥ 0

**Algorithm (calcNorm=false)**:
```cpp
if (!calcNorm) {
    // Fast path: no normal calculation
    // Check if on surface and exiting
    if ((std::abs(px) - fDx) >= -delta && px*vx > 0) return 0.;
    if ((std::abs(py) - fDy) >= -delta && py*vy > 0) return 0.;
    if ((std::abs(pz) - fDz) >= -delta && pz*vz > 0) return 0.;

    // Find exit distances
    G4double tx = (vx == 0) ? DBL_MAX : (std::copysign(fDx, vx) - px) / vx;
    G4double ty = (vy == 0) ? DBL_MAX : (std::copysign(fDy, vy) - py) / vy;
    G4double tz = (vz == 0) ? DBL_MAX : (std::copysign(fDz, vz) - pz) / vz;

    return std::min(std::min(tx, ty), tz);  // Minimum = exit point
}
```

**Algorithm (calcNorm=true)**:
```cpp
*validNorm = true;  // Box always convex

// Check if on surface and exiting (compute normal immediately)
if ((std::abs(px) - fDx) >= -delta && px*vx > 0) {
    n->set(std::copysign(1., px), 0., 0.);
    return 0.;
}
// ... similar for Y and Z ...

// Find exit point
G4double tx = (vx == 0) ? DBL_MAX : (std::copysign(fDx, vx) - px) / vx;
G4double ty = (vy == 0) ? DBL_MAX : (std::copysign(fDy, vy) - py) / vy;
G4double tz = (vz == 0) ? DBL_MAX : (std::copysign(fDz, vz) - pz) / vz;
G4double tmax = std::min(std::min(tx, ty), tz);

// Determine which face was hit and set normal
G4double nx = std::copysign((G4double)(tmax == tx), vx);
G4double ny = std::copysign((G4double)(tmax == ty && nx == 0), vy);
G4double nz = std::copysign((G4double)(tmax == tz && nx == 0 && ny == 0), vz);
n->set(nx, ny, nz);

return tmax;
```

**Clever Normal Calculation**:
```cpp
// If tmax == tx, then nx = ±1 (sign matches vx direction)
// Otherwise nx = 0
// Cast boolean to double: true→1.0, false→0.0
G4double nx = std::copysign((G4double)(tmax == tx), vx);
```

**Performance**: Setting `calcNorm=false` saves ~5-10 CPU instructions

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);

// Particle at center, moving toward +X
G4ThreeVector p(0, 0, 0);
G4ThreeVector v(1, 0, 0);
G4bool validNorm;
G4ThreeVector normal;

G4double dist = box->DistanceToOut(p, v, true, &validNorm, &normal);
// dist = 10 cm
// normal = (1, 0, 0)
// validNorm = true

// Without normal calculation (faster)
G4double dist2 = box->DistanceToOut(p, v);
// dist2 = 10 cm (same distance, no normal computed)
```

### DistanceToOut(p) - Safety Distance from Inside

**Signature**: `G4double DistanceToOut(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:428-451`

Calculates exact perpendicular distance from inside point to nearest surface.

**Parameters**: `p` - Starting point (assumed inside)

**Returns**: Distance to nearest surface

**Algorithm**:
```cpp
G4double G4Box::DistanceToOut(const G4ThreeVector& p) const {
#ifdef G4CSGDEBUG
    // Debug check: verify point is actually inside
    if (Inside(p) == kOutside) {
        G4Exception(..., JustWarning, "Point is outside");
    }
#endif

    // Distance to each face
    G4double dx = fDx - std::abs(p.x());
    G4double dy = fDy - std::abs(p.y());
    G4double dz = fDz - std::abs(p.z());

    // Minimum distance (nearest exit)
    G4double dist = std::min(std::min(dx, dy), dz);
    return (dist > 0) ? dist : 0.;
}
```

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);

G4ThreeVector p(8*cm, 3*cm, -5*cm);
G4double safety = box->DistanceToOut(p);
// Distances: X=2cm, Y=7cm, Z=5cm
// safety = 2 cm (nearest face is +X)
```

## Other Methods

### GetEntityType()

**Signature**: `G4GeometryType GetEntityType() const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:457-460`

**Returns**: `"G4Box"`

### IsFaceted()

**Signature**: `G4bool IsFaceted() const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:466-469`

**Returns**: `true` (all faces are planar)

### Clone()

**Signature**: `G4VSolid* Clone() const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:528-531`

Creates a deep copy on the heap.

**Implementation**:
```cpp
G4VSolid* G4Box::Clone() const {
    return new G4Box(*this);  // Uses copy constructor
}
```

### StreamInfo()

**Signature**: `std::ostream& StreamInfo(std::ostream& os) const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:475-489`

Outputs box parameters to stream.

**Example Output**:
```
-----------------------------------------------------------
    *** Dump for solid - DetectorBox ***
    ===================================================
Solid type: G4Box
Parameters:
   half length X: 100 mm
   half length Y: 200 mm
   half length Z: 300 mm
-----------------------------------------------------------
```

### GetPointOnSurface()

**Signature**: `G4ThreeVector GetPointOnSurface() const override`
**Line**: `source/geometry/solids/CSG/src/G4Box.cc:495-522`

Generates random point uniformly distributed on surface.

**Algorithm**:
```cpp
G4ThreeVector G4Box::GetPointOnSurface() const {
    // Calculate face areas
    G4double sxy = fDx * fDy;  // ±Z faces
    G4double sxz = fDx * fDz;  // ±Y faces
    G4double syz = fDy * fDz;  // ±X faces

    // Random selection weighted by area
    G4double select = (sxy + sxz + syz) * G4QuickRand();
    G4double u = 2. * G4QuickRand() - 1.;  // [-1, 1]
    G4double v = 2. * G4QuickRand() - 1.;  // [-1, 1]

    if (select < sxy) {
        // ±Z faces
        x = u * fDx;
        y = v * fDy;
        z = (select < 0.5*sxy) ? -fDz : fDz;
    } else if (select < sxy + sxz) {
        // ±Y faces
        x = u * fDx;
        y = (select < sxy + 0.5*sxz) ? -fDy : fDy;
        z = v * fDz;
    } else {
        // ±X faces
        x = (select < sxy + sxz + 0.5*syz) ? -fDx : fDx;
        y = u * fDy;
        z = v * fDz;
    }
    return {x, y, z};
}
```

**Use Cases**:
- Surface source generation
- Monte Carlo sampling
- Validation tests

**Example**:
```cpp
G4Box* box = new G4Box("Box", 10*cm, 20*cm, 30*cm);
for (int i = 0; i < 100; ++i) {
    G4ThreeVector p = box->GetPointOnSurface();
    // p is uniformly distributed on box surface
    // Verify: box->Inside(p) should return kSurface
}
```

## Performance Characteristics

### Computational Complexity

| Operation | Complexity | Typical CPU Instructions | Notes |
|-----------|------------|-------------------------|--------|
| **Inside()** | O(1) | ~10 | 3 abs, 2 max, 2 comparisons |
| **SurfaceNormal()** | O(1) | ~20 | Multiple copysign operations |
| **DistanceToIn(p,v)** | O(1) | ~30-40 | Slab method, early exits |
| **DistanceToIn(p)** | O(1) | ~8 | 3 abs, 2 max |
| **DistanceToOut(p,v)** | O(1) | ~25-35 | With normal: +10 instructions |
| **DistanceToOut(p)** | O(1) | ~8 | 3 abs, 2 min |
| **GetCubicVolume()** | O(1) | ~3 | Cached after first call |
| **GetSurfaceArea()** | O(1) | ~5 | Cached after first call |

### Memory Footprint

```cpp
sizeof(G4Box) = sizeof(G4CSGSolid) + 4*sizeof(G4double)
              ≈ base_overhead + 32 bytes
              ≈ ~150 bytes total
```

**Member Data**:
- `fDx`, `fDy`, `fDz`: 24 bytes (3 × 8 bytes)
- `delta`: 8 bytes
- Base class overhead: ~120 bytes

### Optimization Techniques Used

1. **Inline Functions**: Accessors and volume/area calculations
2. **Cached Values**: Volume and surface area computed once
3. **std::copysign()**: Branchless sign selection
4. **Symmetry Exploitation**: Use abs() to handle ± faces uniformly
5. **Early Exit**: Check surface conditions before expensive calculations
6. **Slab Method**: Optimal ray-box intersection algorithm
7. **Minimal Branching**: Use mathematical tricks instead of if-else
8. **Constant Tolerance**: Pre-compute delta = 0.5*kCarTolerance

### Performance Comparison

Relative performance (G4Box = 1.0):

| Solid | Inside() | DistanceToIn(p,v) | Typical Speedup |
|-------|----------|-------------------|-----------------|
| **G4Box** | **1.0** | **1.0** | **Baseline** |
| G4Tubs | 1.5× | 2.0× | Cylindrical |
| G4Sphere | 1.3× | 1.8× | Spherical |
| G4Cons | 2.0× | 3.0× | Conical |
| G4Polycone | 5.0× | 8.0× | Complex |
| Boolean | 2-10× | 3-15× | Multiple solids |

**Recommendation**: Use G4Box whenever possible for maximum performance!

## Usage Examples

### Example 1: World Volume

```cpp
// Create large air-filled world box
G4Box* worldBox = new G4Box("World",
                            10*m,   // Half-length X
                            10*m,   // Half-length Y
                            10*m);  // Half-length Z

G4Material* air = nist->FindOrBuildMaterial("G4_AIR");
G4LogicalVolume* worldLV = new G4LogicalVolume(worldBox, air, "World");

G4PVPlacement* worldPV = new G4PVPlacement(
    nullptr, G4ThreeVector(), worldLV, "World", nullptr, false, 0
);
```

### Example 2: Simple Detector

```cpp
// Silicon detector box: 10cm × 20cm × 1cm
G4Box* detectorBox = new G4Box("Detector",
                               5*cm,      // Half-length X = 5cm
                               10*cm,     // Half-length Y = 10cm
                               0.5*cm);   // Half-length Z = 0.5cm (thin)

G4Material* silicon = nist->FindOrBuildMaterial("G4_Si");
G4LogicalVolume* detectorLV = new G4LogicalVolume(
    detectorBox, silicon, "Detector"
);

// Calculate mass
G4double volume = detectorBox->GetCubicVolume();  // cm³
G4double density = silicon->GetDensity();          // g/cm³
G4double mass = volume * density / gram;
G4cout << "Detector mass: " << mass << " g" << G4endl;
```

### Example 3: Calorimeter Cell

```cpp
// Single calorimeter cell (BGO crystal in aluminum housing)

// Crystal
G4Box* crystalBox = new G4Box("Crystal", 2*cm, 2*cm, 10*cm);
G4Material* BGO = nist->FindOrBuildMaterial("G4_BGO");
G4LogicalVolume* crystalLV = new G4LogicalVolume(crystalBox, BGO, "Crystal");

// Housing (slightly larger)
G4Box* housingBox = new G4Box("Housing", 2.1*cm, 2.1*cm, 10.1*cm);
G4Material* aluminum = nist->FindOrBuildMaterial("G4_Al");
G4LogicalVolume* housingLV = new G4LogicalVolume(housingBox, aluminum, "Housing");

// Place crystal inside housing
new G4PVPlacement(nullptr, G4ThreeVector(), crystalLV, "Crystal",
                  housingLV, false, 0, true);  // Check overlap
```

### Example 4: Testing Point Classification

```cpp
G4Box* box = new G4Box("TestBox", 10*cm, 10*cm, 10*cm);

// Test points
struct TestPoint {
    G4ThreeVector pos;
    const char* desc;
};

TestPoint points[] = {
    {{0, 0, 0},           "Center"},
    {{5*cm, 0, 0},        "Interior"},
    {{10*cm, 0, 0},       "On +X face"},
    {{-10*cm, 5*cm, 0},   "On -X face"},
    {{10*cm, 10*cm, 0},   "On edge"},
    {{10*cm, 10*cm, 10*cm}, "On corner"},
    {{15*cm, 0, 0},       "Outside"}
};

const char* status[] = {"kInside", "kSurface", "kOutside"};

for (auto& pt : points) {
    EInside result = box->Inside(pt.pos);
    G4cout << pt.desc << ": " << status[result] << G4endl;
    if (result == kSurface) {
        G4ThreeVector normal = box->SurfaceNormal(pt.pos);
        G4cout << "  Normal: " << normal << G4endl;
    }
}
```

### Example 5: Ray Tracing

```cpp
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);

// Cast rays from outside
G4ThreeVector origin(-20*cm, 0, 0);

for (G4double angle = -45; angle <= 45; angle += 10) {
    G4ThreeVector dir(std::cos(angle*deg),
                      std::sin(angle*deg),
                      0);
    dir = dir.unit();

    G4double dist = box->DistanceToIn(origin, dir);

    if (dist < kInfinity) {
        G4ThreeVector hit = origin + dist * dir;
        G4ThreeVector normal = box->SurfaceNormal(hit);
        G4cout << "Angle " << angle << "°: hit at " << hit
               << ", normal " << normal << G4endl;
    } else {
        G4cout << "Angle " << angle << "°: miss" << G4endl;
    }
}
```

### Example 6: Modifying Dimensions

```cpp
// Create initial box
G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
G4LogicalVolume* boxLV = new G4LogicalVolume(box, material, "Box");

G4cout << "Initial volume: " << box->GetCubicVolume()/cm3 << " cm³" << G4endl;

// Modify dimensions (during geometry construction only!)
box->SetXHalfLength(20*cm);  // Double X dimension
box->SetYHalfLength(20*cm);  // Double Y dimension

G4cout << "New volume: " << box->GetCubicVolume()/cm3 << " cm³" << G4endl;
// Volume increased by 4x (doubled two dimensions)
```

### Example 7: Surface Point Generation

```cpp
G4Box* box = new G4Box("Box", 10*cm, 20*cm, 30*cm);

// Generate many surface points and verify distribution
G4int faceCount[6] = {0, 0, 0, 0, 0, 0};  // -X, +X, -Y, +Y, -Z, +Z

for (G4int i = 0; i < 10000; ++i) {
    G4ThreeVector p = box->GetPointOnSurface();

    // Classify which face
    if (std::abs(p.x() + 10*cm) < 1e-6) faceCount[0]++;  // -X
    else if (std::abs(p.x() - 10*cm) < 1e-6) faceCount[1]++;  // +X
    else if (std::abs(p.y() + 20*cm) < 1e-6) faceCount[2]++;  // -Y
    else if (std::abs(p.y() - 20*cm) < 1e-6) faceCount[3]++;  // +Y
    else if (std::abs(p.z() + 30*cm) < 1e-6) faceCount[4]++;  // -Z
    else if (std::abs(p.z() - 30*cm) < 1e-6) faceCount[5]++;  // +Z
}

// Print distribution (should be proportional to face areas)
G4double totalArea = box->GetSurfaceArea();
G4double areaXY = 4 * 10*cm * 20*cm;
G4double areaXZ = 4 * 10*cm * 30*cm;
G4double areaYZ = 4 * 20*cm * 30*cm;

G4cout << "±X faces: " << (faceCount[0] + faceCount[1])/100. << "% "
       << "(expected " << 100*areaYZ/totalArea << "%)" << G4endl;
G4cout << "±Y faces: " << (faceCount[2] + faceCount[3])/100. << "% "
       << "(expected " << 100*areaXZ/totalArea << "%)" << G4endl;
G4cout << "±Z faces: " << (faceCount[4] + faceCount[5])/100. << "% "
       << "(expected " << 100*areaXY/totalArea << "%)" << G4endl;
```

## Common Pitfalls

### Pitfall 1: Full vs Half Lengths

```cpp
// WRONG - confusing full and half lengths
G4Box* box = new G4Box("Box", 10*cm, 20*cm, 30*cm);
G4cout << "Width: " << box->GetXHalfLength() << G4endl;
// Output: 100 mm (this is HALF the width!)

// CORRECT - remember to double
G4cout << "Width: " << 2*box->GetXHalfLength()/cm << " cm" << G4endl;
// Output: 20 cm (full width)
```

### Pitfall 2: Modifying During Simulation

```cpp
// WRONG - modifying dimensions during tracking
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    G4Box* box = dynamic_cast<G4Box*>(
        step->GetPreStepPoint()->GetTouchable()->GetSolid()
    );
    box->SetXHalfLength(15*cm);  // CRASH! Not thread-safe!
}

// CORRECT - only modify during construction
void MyDetectorConstruction::Construct() {
    G4Box* box = new G4Box("Box", 10*cm, 10*cm, 10*cm);
    // Modify here is OK
    box->SetYHalfLength(20*cm);
}
```

### Pitfall 3: Tolerance Ignorance

```cpp
// WRONG - exact floating-point comparison
G4ThreeVector p = box->GetPointOnSurface();
if (p.x() == box->GetXHalfLength()) {  // May fail due to rounding!
    // ...
}

// CORRECT - use tolerance
G4double delta = box->GetTolerance();
if (std::abs(p.x() - box->GetXHalfLength()) < delta) {
    // Point is on +X face
}
```

### Pitfall 4: Negative or Zero Dimensions

```cpp
// WRONG - zero or negative dimension
G4Box* box = new G4Box("Box", 0, 10*cm, 10*cm);
// FatalException: "Dimensions too small"

// WRONG - dimension too small
G4Box* box = new G4Box("Box", 1e-12*mm, 10*cm, 10*cm);
// FatalException: must be ≥ 2*kCarTolerance (~2e-9 mm)

// CORRECT - reasonable dimensions
G4Box* box = new G4Box("Box", 1*nm, 10*cm, 10*cm);  // 1 nm is OK
```

### Pitfall 5: Assuming Unit Vectors

```cpp
// WRONG - non-unit direction vector
G4ThreeVector dir(1, 1, 1);  // Magnitude = √3
G4double dist = box->DistanceToIn(point, dir);
// Wrong! Direction must be normalized

// CORRECT - normalize direction
G4ThreeVector dir(1, 1, 1);
dir = dir.unit();  // Now magnitude = 1
G4double dist = box->DistanceToIn(point, dir);
```

## Best Practices

### 1. Use G4Box for World Volumes

```cpp
// World volumes are almost always boxes
G4Box* worldBox = new G4Box("World", 10*m, 10*m, 10*m);
// Fastest solid for navigation
```

### 2. Pre-calculate Dimensions

```cpp
// Good: calculate once
G4double halfX = detectorWidth / 2.;
G4double halfY = detectorHeight / 2.;
G4double halfZ = detectorDepth / 2.;
G4Box* box = new G4Box("Detector", halfX, halfY, halfZ);

// Avoid: division in constructor (less clear)
G4Box* box = new G4Box("Detector",
                       detectorWidth/2., detectorHeight/2., detectorDepth/2.);
```

### 3. Check Volume and Area

```cpp
// Validate geometry after construction
G4Box* box = new G4Box("Box", 10*cm, 20*cm, 30*cm);

G4double expectedVolume = 8 * 10*cm * 20*cm * 30*cm;
G4double actualVolume = box->GetCubicVolume();

if (std::abs(actualVolume - expectedVolume) > 1e-6) {
    G4cerr << "Volume mismatch!" << G4endl;
}
```

### 4. Use const References for Accessors

```cpp
// Good: pass by const reference
void AnalyzeBox(const G4Box& box) {
    G4double x = box.GetXHalfLength();
    G4double volume = box.GetCubicVolume();
    // Cannot modify box
}

// Less efficient: pass by value
void AnalyzeBox(G4Box box) {  // Copies entire object
    // ...
}
```

### 5. Leverage Symmetry

```cpp
// Use box symmetry for simplification
// Instead of 6 separate checks, use abs():
G4double distToSurface = std::max({
    std::abs(p.x()) - fDx,
    std::abs(p.y()) - fDy,
    std::abs(p.z()) - fDz
});
```

## See Also

- [G4VSolid](g4vsolid.md) - Base class for all solids
- [G4LogicalVolume](g4logicalvolume.md) - Associates solid with material
- [G4PVPlacement](g4pvplacement.md) - Places solid in geometry
- [G4Tubs](g4tubs.md) - Cylindrical solid
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/solids/CSG/include/G4Box.hh`
- Implementation: `source/geometry/solids/CSG/src/G4Box.cc`
- Inline: `source/geometry/solids/CSG/include/G4Box.icc`

### Related Classes
- `G4SolidStore` - Global registry of all solids
- `G4CSGSolid` - Base class for CSG primitives
- `G4BoundingEnvelope` - Extent calculation helper
- `G4PolyhedronBox` - Visualization polyhedron

### Key Algorithms
- **Slab Method**: Ray-box intersection (DistanceToIn with direction)
- **Manhattan Distance**: Perpendicular distance to nearest face
- **Area-weighted Sampling**: Uniform surface point generation

### External Documentation
- [Geant4 User Guide: Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html)
- [Geant4 Class Documentation](http://geant4.kek.jp/Reference/)
- [Ray-Box Intersection Algorithms](https://tavianator.com/2011/ray_box.html)
