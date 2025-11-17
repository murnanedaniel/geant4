# G4VSolid

**Base Class**: None (pure abstract base class)
**Derived Classes**: [G4CSGSolid](g4csgs olid.md), G4BooleanSolid, G4DisplacedSolid, G4ScaledSolid, and all specific solids
**Location**: `source/geometry/management/include/G4VSolid.hh`
**Source**: `source/geometry/management/src/G4VSolid.cc`

## Overview

G4VSolid is the abstract base class for all geometric solids in Geant4. It defines the fundamental interface that all shapes must implement for particle tracking, including distance calculations, inside/outside tests, surface normals, and extent computations. Every solid automatically registers itself with the global [G4SolidStore](#g4solidstore) singleton for lifetime management and lookup.

This is one of the most important classes in Geant4's geometry system - understanding its interface is essential for implementing custom solids or using the geometry module effectively.

## Key Features

- **Pure abstract interface** for all geometric shapes
- **Automatic registration** with G4SolidStore on construction
- **Distance calculation** methods for particle navigation
- **Point classification** (inside/outside/surface)
- **Surface normal** computation for boundary interactions
- **Extent calculation** for optimization (voxelization)
- **Visualization support** via polyhedron generation
- **Thread-safe** design (read-only after construction)
- **Volume and surface area** estimation via Monte Carlo

## Class Definition

```cpp
class G4VSolid
{
  public:
    // Constructor and destructor
    G4VSolid(const G4String& name);
    virtual ~G4VSolid();

    // Pure virtual methods (must be implemented by derived classes)
    virtual G4bool CalculateExtent(const EAxis pAxis,
                                   const G4VoxelLimits& pVoxelLimit,
                                   const G4AffineTransform& pTransform,
                                   G4double& pMin, G4double& pMax) const = 0;

    virtual EInside Inside(const G4ThreeVector& p) const = 0;

    virtual G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const = 0;

    virtual G4double DistanceToIn(const G4ThreeVector& p,
                                   const G4ThreeVector& v) const = 0;

    virtual G4double DistanceToIn(const G4ThreeVector& p) const = 0;

    virtual G4double DistanceToOut(const G4ThreeVector& p,
                                    const G4ThreeVector& v,
                                    const G4bool calcNorm=false,
                                    G4bool* validNorm = nullptr,
                                    G4ThreeVector* n = nullptr) const = 0;

    virtual G4double DistanceToOut(const G4ThreeVector& p) const = 0;

    virtual G4GeometryType GetEntityType() const = 0;

    virtual std::ostream& StreamInfo(std::ostream& os) const = 0;

    virtual void DescribeYourselfTo(G4VGraphicsScene& scene) const = 0;

    // Virtual methods with default implementations
    virtual void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const;
    virtual G4double GetCubicVolume();
    virtual G4double GetSurfaceArea();
    virtual G4ThreeVector GetPointOnSurface() const;
    virtual G4bool IsFaceted() const;
    virtual G4VSolid* Clone() const;

    // Name and property accessors
    G4String GetName() const;
    void SetName(const G4String& name);
    G4double GetTolerance() const;

    // Visualization
    virtual G4VisExtent GetExtent() const;
    virtual G4Polyhedron* CreatePolyhedron() const;
    virtual G4Polyhedron* GetPolyhedron() const;

  protected:
    G4double kCarTolerance;      // Cached geometrical tolerance

  private:
    G4String fshapeName;         // Solid name
};
```

## Member Data

### `kCarTolerance` (protected)
**Type**: `G4double`
**Line**: `source/geometry/management/include/G4VSolid.hh:306`

Cached surface tolerance for this solid, initialized from `G4GeometryTolerance::GetInstance()->GetSurfaceTolerance()` in the constructor. Used by derived classes for inside/outside tests and surface proximity checks.

**Typical value**: ~10⁻⁹ mm (1 nanometer)

**Usage**:
```cpp
// In derived class Inside() implementation
G4double delta = 0.5*kCarTolerance;  // Half-tolerance for surface band
if (dist > delta) return kOutside;
else if (dist > -delta) return kSurface;
else return kInside;
```

### `fshapeName` (private)
**Type**: `G4String`
**Line**: `source/geometry/management/include/G4VSolid.hh:319`

Name of the solid, used for identification and store lookup.

## Constructors and Destructor

### `G4VSolid(const G4String& name)`
**Line**: `source/geometry/management/src/G4VSolid.cc:57-65`

Creates a new solid with the specified name and automatically registers it with G4SolidStore.

**Parameters**:
- `name` - Unique identifier for this solid

**Actions**:
1. Caches surface tolerance from G4GeometryTolerance
2. Stores the name
3. Registers with G4SolidStore singleton

**Example**:
```cpp
// Typically called from derived class constructor
G4Box::G4Box(const G4String& pName, G4double pX, G4double pY, G4double pZ)
  : G4CSGSolid(pName),  // Calls G4VSolid constructor through chain
    fDx(pX), fDy(pY), fDz(pZ)
{
  // Validate dimensions
  if (pX < 2*kCarTolerance) {
    G4Exception("G4Box::G4Box()", "GeomSolids0002",
                FatalException, "Invalid X half-length");
  }
}
```

### `virtual ~G4VSolid()`
**Line**: `source/geometry/management/src/G4VSolid.cc:98-101`

Destructor automatically deregisters the solid from G4SolidStore.

## Pure Virtual Methods

These methods **must** be implemented by all derived classes.

### `CalculateExtent()`
**Signature**:
```cpp
virtual G4bool CalculateExtent(const EAxis pAxis,
                               const G4VoxelLimits& pVoxelLimit,
                               const G4AffineTransform& pTransform,
                               G4double& pMin, G4double& pMax) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:106-109`

Calculates the minimum and maximum extent of the solid along a specified axis, when under a given transform and within voxel limits. Used for voxelization optimization.

**Parameters**:
- `pAxis` - Axis to calculate extent along (kXAxis, kYAxis, kZAxis)
- `pVoxelLimit` - Bounding limits to consider
- `pTransform` - Transformation to apply to solid
- `pMin` [out] - Minimum extent along axis
- `pMax` [out] - Maximum extent along axis

**Returns**: `true` if solid intersects the voxel limits, `false` otherwise

**Implementation Pattern** (from G4Box):
```cpp
G4bool G4Box::CalculateExtent(const EAxis pAxis,
                              const G4VoxelLimits& pVoxelLimit,
                              const G4AffineTransform& pTransform,
                              G4double& pMin, G4double& pMax) const
{
  G4ThreeVector bmin, bmax;
  BoundingLimits(bmin,bmax);  // Get untransformed limits

  // Use G4BoundingEnvelope to handle transformation and clipping
  G4BoundingEnvelope bbox(bmin,bmax);
  return bbox.CalculateExtent(pAxis,pVoxelLimit,pTransform,pMin,pMax);
}
```

### `Inside()`
**Signature**:
```cpp
virtual EInside Inside(const G4ThreeVector& p) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:114`

Determines whether a point is inside, outside, or on the surface of the solid.

**Parameters**:
- `p` - Point to test (in local coordinates)

**Returns**:
- `kInside` - Point is inside (distance to surface > tolerance/2)
- `kSurface` - Point is on surface (distance ≤ tolerance/2)
- `kOutside` - Point is outside (distance to surface > tolerance/2)

**Implementation Pattern** (from G4Box):
```cpp
EInside G4Box::Inside(const G4ThreeVector& p) const
{
  G4double delta = 0.5*kCarTolerance;  // Surface band half-width

  // Maximum signed distance to any face
  G4double dist = std::max(std::max(
                  std::abs(p.x())-fDx,
                  std::abs(p.y())-fDy),
                  std::abs(p.z())-fDz);

  if (dist > delta) return kOutside;
  if (dist > -delta) return kSurface;
  return kInside;
}
```

**Performance**: This method is called frequently during tracking - should be highly optimized!

### `SurfaceNormal()`
**Signature**:
```cpp
virtual G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:119`

Returns the outward-pointing unit normal vector at the surface closest to the given point.

**Parameters**:
- `p` - Point near or on surface (in local coordinates)

**Returns**: Unit normal vector pointing outward from solid

**Implementation Pattern** (from G4Box):
```cpp
G4ThreeVector G4Box::SurfaceNormal(const G4ThreeVector& p) const
{
  G4double delta = 0.5*kCarTolerance;
  G4ThreeVector norm(0,0,0);

  // Find which face(s) the point is closest to
  if (std::abs(std::abs(p.x()) - fDx) <= delta) norm.setX(p.x() < 0 ? -1 : 1);
  if (std::abs(std::abs(p.y()) - fDy) <= delta) norm.setY(p.y() < 0 ? -1 : 1);
  if (std::abs(std::abs(p.z()) - fDz) <= delta) norm.setZ(p.z() < 0 ? -1 : 1);

  // Normalize if on edge/corner
  G4double mag2 = norm.mag2();
  return (mag2 > 0) ? norm/std::sqrt(mag2) : G4ThreeVector(1,0,0);
}
```

**Note**: For points on edges or corners, implementations typically return the normalized sum of the face normals.

### `DistanceToIn(const G4ThreeVector& p, const G4ThreeVector& v)`
**Signature**:
```cpp
virtual G4double DistanceToIn(const G4ThreeVector& p,
                               const G4ThreeVector& v) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:123-129`

Calculates the distance along a ray from an outside point to the first intersection with the solid surface.

**Parameters**:
- `p` - Starting point (assumed outside or on surface)
- `v` - Direction vector (must be unit vector)

**Returns**:
- Distance to first intersection (≥ 0)
- `kInfinity` if no intersection
- `0` if point is already on surface and entering

**Implementation Pattern** (from G4Box):
```cpp
G4double G4Box::DistanceToIn(const G4ThreeVector& p,
                              const G4ThreeVector& v) const
{
  // Early exit: if already past a face and moving away
  if ((std::abs(p.x()) - fDx) >= -delta && p.x()*v.x() >= 0)
    return kInfinity;

  // Compute intersection with each pair of parallel faces
  G4double invx = (v.x() == 0) ? DBL_MAX : -1./v.x();
  G4double dx = std::copysign(fDx, invx);
  G4double txmin = (p.x() - dx)*invx;
  G4double txmax = (p.x() + dx)*invx;

  // Similar for y, z...

  // Return largest minimum (entry point)
  G4double tmin = std::max(std::max(txmin, tymin), tzmin);
  return (tmin < kInfinity) ? tmin : kInfinity;
}
```

**Performance Note**: This is one of the most performance-critical methods in Geant4!

### `DistanceToIn(const G4ThreeVector& p)`
**Signature**:
```cpp
virtual G4double DistanceToIn(const G4ThreeVector& p) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:131-133`

Calculates an approximate (underestimate allowed) distance from an outside point to the nearest surface.

**Parameters**:
- `p` - Starting point (assumed outside)

**Returns**: Approximate distance to surface (can be underestimate, never overestimate)

**Purpose**: Used for "safety" calculations to optimize navigation by avoiding unnecessary boundary checks.

**Implementation Pattern** (from G4Box):
```cpp
G4double G4Box::DistanceToIn(const G4ThreeVector& p) const
{
  // Distance to nearest face
  G4double dx = std::abs(p.x()) - fDx;
  G4double dy = std::abs(p.y()) - fDy;
  G4double dz = std::abs(p.z()) - fDz;

  // Maximum distance (closest face)
  G4double dist = std::max(std::max(dx, dy), dz);
  return (dist > 0) ? dist : 0;
}
```

### `DistanceToOut(const G4ThreeVector& p, const G4ThreeVector& v, ...)`
**Signature**:
```cpp
virtual G4double DistanceToOut(const G4ThreeVector& p,
                                const G4ThreeVector& v,
                                const G4bool calcNorm=false,
                                G4bool* validNorm = nullptr,
                                G4ThreeVector* n = nullptr) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:135-154`

Calculates the distance along a ray from an inside point to the exit surface, optionally computing the exit normal.

**Parameters**:
- `p` - Starting point (assumed inside or on surface)
- `v` - Direction vector (must be unit vector)
- `calcNorm` - If true, calculate and return normal and validity
- `validNorm` [out] - Set to true if solid lies entirely behind exit surface
- `n` [out] - Exit surface outward normal (if calcNorm=true)

**Returns**: Distance to exit point (≥ 0)

**Implementation Pattern** (from G4Box):
```cpp
G4double G4Box::DistanceToOut(const G4ThreeVector& p,
                               const G4ThreeVector& v,
                               const G4bool calcNorm,
                               G4bool* validNorm,
                               G4ThreeVector* n) const
{
  // Find exit distances for all three axis pairs
  // ... compute tmax as minimum of positive exit distances ...

  if (calcNorm) {
    *validNorm = true;  // Box always convex

    // Determine which face was hit
    if (tmax == tx) n->set(v.x() > 0 ? 1 : -1, 0, 0);
    else if (tmax == ty) n->set(0, v.y() > 0 ? 1 : -1, 0);
    else n->set(0, 0, v.z() > 0 ? 1 : -1);
  }

  return tmax;
}
```

**Performance**: Setting `calcNorm=false` when normal is not needed can significantly improve performance.

### `DistanceToOut(const G4ThreeVector& p)`
**Signature**:
```cpp
virtual G4double DistanceToOut(const G4ThreeVector& p) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:156-158`

Calculates the approximate (underestimate allowed) distance from an inside point to the nearest surface.

**Parameters**:
- `p` - Starting point (assumed inside)

**Returns**: Approximate distance to surface (can be underestimate)

**Implementation Pattern** (from G4Box):
```cpp
G4double G4Box::DistanceToOut(const G4ThreeVector& p) const
{
  // Distance to nearest face
  G4double dx = fDx - std::abs(p.x());
  G4double dy = fDy - std::abs(p.y());
  G4double dz = fDz - std::abs(p.z());

  // Minimum distance (nearest exit)
  return std::min(std::min(dx, dy), dz);
}
```

### `GetEntityType()`
**Signature**:
```cpp
virtual G4GeometryType GetEntityType() const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:181`

Returns a string identifier for the solid type (e.g., "G4Box", "G4Tubs").

**Returns**: String identifying the concrete solid class

**Purpose**: Used for persistency, STEP interface, and runtime type identification

**Implementation Pattern**:
```cpp
G4GeometryType G4Box::GetEntityType() const
{
  return G4String("G4Box");
}
```

### `StreamInfo()`
**Signature**:
```cpp
virtual std::ostream& StreamInfo(std::ostream& os) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:201`

Dumps the solid's contents (name, dimensions, etc.) to an output stream.

**Parameters**:
- `os` - Output stream to write to

**Returns**: Reference to the output stream (for chaining)

**Implementation Pattern** (from G4Box):
```cpp
std::ostream& G4Box::StreamInfo(std::ostream& os) const
{
  os << "-----------------------------------------------------------\n"
     << "    *** Dump for solid - " << GetName() << " ***\n"
     << "===========================================================\n"
     << " Solid type: G4Box\n"
     << " Parameters: \n"
     << "    half length X: " << fDx/mm << " mm \n"
     << "    half length Y: " << fDy/mm << " mm \n"
     << "    half length Z: " << fDz/mm << " mm \n"
     << "-----------------------------------------------------------\n";
  return os;
}
```

**Usage**:
```cpp
solid->DumpInfo();  // Calls StreamInfo(std::cout)
// Or
std::ofstream file("solid_info.txt");
solid->StreamInfo(file);
```

### `DescribeYourselfTo()`
**Signature**:
```cpp
virtual void DescribeYourselfTo(G4VGraphicsScene& scene) const = 0;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:208`

Double-dispatch method for adding the solid to a graphics scene for visualization.

**Parameters**:
- `scene` - Graphics scene to add solid to

**Implementation Pattern** (from G4Box):
```cpp
void G4Box::DescribeYourselfTo(G4VGraphicsScene& scene) const
{
  scene.AddSolid(*this);
}
```

## Virtual Methods with Default Implementations

These methods have default implementations but can be overridden for better performance or accuracy.

### `BoundingLimits()`
**Signature**:
```cpp
virtual void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:103`
**Implementation**: `source/geometry/management/src/G4VSolid.cc:680-691`

Returns the axis-aligned bounding box of the solid.

**Parameters**:
- `pMin` [out] - Minimum corner of bounding box
- `pMax` [out] - Maximum corner of bounding box

**Default Implementation**: Returns infinite box and issues JustWarning

**Should be overridden** by all solids to provide actual bounds for optimization.

**Example Override** (from G4Box):
```cpp
void G4Box::BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const
{
  pMin.set(-fDx, -fDy, -fDz);
  pMax.set( fDx,  fDy,  fDz);
}
```

### `GetCubicVolume()`
**Signature**:
```cpp
virtual G4double GetCubicVolume();
```
**Line**: `source/geometry/management/include/G4VSolid.hh:167`
**Implementation**: `source/geometry/management/src/G4VSolid.cc:203-208`

Returns the volume of the solid in internal units (mm³).

**Default Implementation**: Monte Carlo estimation using 1,000,000 random points with 0.1% tolerance. **Not cached!**

**Should be overridden** for solids where analytical volume is available, and result should be cached.

**Example Override** (from G4Box):
```cpp
G4double G4Box::GetCubicVolume()
{
  if (fCubicVolume == 0.) {  // Cache the result
    fCubicVolume = 8.0 * fDx * fDy * fDz;
  }
  return fCubicVolume;
}
```

**Performance**: Default Monte Carlo method is **very expensive** - always override for production code!

### `GetSurfaceArea()`
**Signature**:
```cpp
virtual G4double GetSurfaceArea();
```
**Line**: `source/geometry/management/include/G4VSolid.hh:174`
**Implementation**: `source/geometry/management/src/G4VSolid.cc:264-397`

Returns the surface area of the solid in internal units (mm²).

**Default Implementation**: Monte Carlo estimation using shell sampling with 64 predefined directions. **Not cached!**

**Should be overridden** for analytical surface area calculation and caching.

**Example Override** (from G4Box):
```cpp
G4double G4Box::GetSurfaceArea()
{
  if (fSurfaceArea == 0.) {  // Cache the result
    fSurfaceArea = 8.0 * (fDx*fDy + fDy*fDz + fDz*fDx);
  }
  return fSurfaceArea;
}
```

### `GetPointOnSurface()`
**Signature**:
```cpp
virtual G4ThreeVector GetPointOnSurface() const;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:185`
**Implementation**: `source/geometry/management/src/G4VSolid.cc:152-161`

Returns a random point on the surface of the solid. Used for particle source generation.

**Default Implementation**: Returns origin with warning - **must be overridden** for actual use.

**Should be overridden** to provide proper surface point sampling.

**Example Override** (from G4Box):
```cpp
G4ThreeVector G4Box::GetPointOnSurface() const
{
  // Randomly select face based on area
  G4double areaXY = 4*fDx*fDy;
  G4double areaYZ = 4*fDy*fDz;
  G4double areaZX = 4*fDz*fDx;
  G4double totalArea = areaXY + areaYZ + areaZX;

  G4double rand = G4UniformRand() * totalArea;

  if (rand < areaXY) {  // +/-Z faces
    return G4ThreeVector(
      (2*G4UniformRand()-1)*fDx,
      (2*G4UniformRand()-1)*fDy,
      (G4UniformRand() < 0.5 ? -1 : 1)*fDz
    );
  }
  // ... similar for other faces
}
```

### `Clone()`
**Signature**:
```cpp
virtual G4VSolid* Clone() const;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:196`
**Implementation**: `source/geometry/management/src/G4VSolid.cc:406-414`

Creates a dynamically allocated copy of the solid.

**Default Implementation**: Returns nullptr with warning

**Returns**: Pointer to cloned solid (caller owns memory), or nullptr if not implemented

**Example Override** (from G4Box):
```cpp
G4VSolid* G4Box::Clone() const
{
  return new G4Box(*this);
}
```

### `IsFaceted()`
**Signature**:
```cpp
virtual G4bool IsFaceted() const;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:193`
**Implementation**: `source/geometry/management/src/G4VSolid.cc:175-176`

Returns whether the solid has only planar (flat) faces.

**Default Implementation**: Returns `false` (curved surfaces)

**Returns**: `true` if all faces are planar, `false` if any curved surfaces

**Example**: G4Box, G4Trap, G4Tet return `true`; G4Sphere, G4Tubs return `false`

## Non-Virtual Methods

### `GetName()`
**Signature**:
```cpp
G4String GetName() const;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:95`
**Inline Implementation**: `source/geometry/management/include/G4VSolid.icc`

Returns the name of the solid.

**Returns**: Solid name as G4String

### `SetName()`
**Signature**:
```cpp
void SetName(const G4String& name);
```
**Line**: `source/geometry/management/include/G4VSolid.hh:97`
**Implementation**: `source/geometry/management/src/G4VSolid.cc:127-131`

Sets a new name for the solid and invalidates the G4SolidStore lookup map.

**Parameters**:
- `name` - New name for solid

**Side Effects**: Invalidates G4SolidStore's name-to-pointer map (rebuilt on next lookup)

### `GetTolerance()`
**Signature**:
```cpp
G4double GetTolerance() const;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:100`
**Inline Implementation**: Returns `kCarTolerance`

Returns the cached surface tolerance for this solid.

**Returns**: Surface tolerance in mm (typically ~10⁻⁹ mm)

### `DumpInfo()`
**Signature**:
```cpp
void DumpInfo() const;
```
**Line**: `source/geometry/management/include/G4VSolid.hh:203`
**Inline Implementation**: Calls `StreamInfo(G4cout)`

Dumps solid information to standard output.

**Usage**:
```cpp
G4Box* box = new G4Box("MyBox", 10*cm, 20*cm, 30*cm);
box->DumpInfo();
// Outputs:
// -----------------------------------------------------------
//     *** Dump for solid - MyBox ***
// ===========================================================
//  Solid type: G4Box
//  Parameters:
//     half length X: 100 mm
//     half length Y: 200 mm
//     half length Z: 300 mm
// -----------------------------------------------------------
```

## G4SolidStore

All G4VSolid instances are automatically registered with the global `G4SolidStore` singleton. This provides:

1. **Lifetime Management**: Store keeps pointers to all solids
2. **Lookup by Name**: Find solid by name string
3. **Iteration**: Access to all defined solids
4. **Cleanup**: Automatic deregistration on destruction

**Common Operations**:
```cpp
// Get store instance
G4SolidStore* store = G4SolidStore::GetInstance();

// Find solid by name
G4VSolid* solid = store->GetSolid("MyBoxName");

// Get all solids
const std::vector<G4VSolid*>& solids = *store;

// Iterate all solids
for (auto solid : *store) {
  G4cout << solid->GetName() << G4endl;
}

// Clean all solids (done automatically at end of run)
store->Clean();
```

## Usage Examples

### Example 1: Implementing a Custom Solid

```cpp
#include "G4VSolid.hh"

class MyCustomSolid : public G4VSolid
{
  public:
    MyCustomSolid(const G4String& name, G4double radius);
    virtual ~MyCustomSolid();

    // Must implement all pure virtual methods
    EInside Inside(const G4ThreeVector& p) const override;
    G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override;
    G4double DistanceToIn(const G4ThreeVector& p,
                          const G4ThreeVector& v) const override;
    G4double DistanceToIn(const G4ThreeVector& p) const override;
    G4double DistanceToOut(const G4ThreeVector& p,
                           const G4ThreeVector& v,
                           const G4bool calcNorm=false,
                           G4bool* validNorm = nullptr,
                           G4ThreeVector* n = nullptr) const override;
    G4double DistanceToOut(const G4ThreeVector& p) const override;
    G4bool CalculateExtent(const EAxis pAxis,
                          const G4VoxelLimits& pVoxelLimit,
                          const G4AffineTransform& pTransform,
                          G4double& pMin, G4double& pMax) const override;
    G4GeometryType GetEntityType() const override;
    std::ostream& StreamInfo(std::ostream& os) const override;
    void DescribeYourselfTo(G4VGraphicsScene& scene) const override;

    // Should override for performance
    void BoundingLimits(G4ThreeVector& pMin,
                       G4ThreeVector& pMax) const override;
    G4double GetCubicVolume() override;
    G4double GetSurfaceArea() override;
    G4VSolid* Clone() const override;

  private:
    G4double fRadius;
    mutable G4double fCubicVolume = 0.;  // Cache (mutable for lazy evaluation)
    mutable G4double fSurfaceArea = 0.;  // Cache
};
```

### Example 2: Using Distance Methods for Navigation

```cpp
// Check if point is inside solid
G4ThreeVector point(50*mm, 30*mm, 20*mm);
EInside location = solid->Inside(point);

if (location == kOutside) {
  G4cout << "Point is outside" << G4endl;

  // Get approximate distance to surface
  G4double safety = solid->DistanceToIn(point);
  G4cout << "Safety distance: " << safety/mm << " mm" << G4endl;

  // Find intersection along a direction
  G4ThreeVector direction(1, 0, 0);  // Unit vector
  G4double distance = solid->DistanceToIn(point, direction);

  if (distance < kInfinity) {
    G4ThreeVector intersection = point + distance * direction;
    G4cout << "Intersection at: " << intersection << G4endl;

    // Get surface normal at intersection
    G4ThreeVector normal = solid->SurfaceNormal(intersection);
    G4cout << "Surface normal: " << normal << G4endl;
  }
}
else if (location == kInside) {
  // Find exit point
  G4ThreeVector direction(0, 1, 0);
  G4bool validNorm;
  G4ThreeVector exitNormal;

  G4double distOut = solid->DistanceToOut(point, direction,
                                          true, &validNorm, &exitNormal);

  if (validNorm) {
    G4ThreeVector exitPoint = point + distOut * direction;
    G4cout << "Exit point: " << exitPoint << G4endl;
    G4cout << "Exit normal: " << exitNormal << G4endl;
  }
}
```

### Example 3: Volume and Surface Area Calculations

```cpp
// Create solid
G4Box* box = new G4Box("Detector", 100*mm, 200*mm, 300*mm);

// Get volume (cached analytical calculation)
G4double volume = box->GetCubicVolume();
G4cout << "Volume: " << volume/cm3 << " cm^3" << G4endl;

// Get surface area (cached analytical calculation)
G4double area = box->GetSurfaceArea();
G4cout << "Surface area: " << area/cm2 << " cm^2" << G4endl;

// Generate random points on surface
for (G4int i = 0; i < 10; ++i) {
  G4ThreeVector point = box->GetPointOnSurface();
  G4cout << "Surface point " << i << ": " << point << G4endl;
}
```

### Example 4: Using Extent for Voxelization

```cpp
// Define voxel limits
G4VoxelLimits voxelLimit;
voxelLimit.AddLimit(kXAxis, -100*mm, 100*mm);
voxelLimit.AddLimit(kYAxis, -50*mm, 50*mm);

// Test if solid intersects voxel
G4AffineTransform transform;  // Identity transform
G4double xMin, xMax;

G4bool intersects = solid->CalculateExtent(kXAxis, voxelLimit,
                                           transform, xMin, xMax);

if (intersects) {
  G4cout << "Solid intersects voxel" << G4endl;
  G4cout << "X extent: [" << xMin/mm << ", " << xMax/mm << "] mm" << G4endl;
}
```

## Performance Considerations

### Critical Performance Methods

The following methods are called extremely frequently during tracking and **must** be highly optimized:

1. **Inside()** - Called for every step to check volume containment
2. **DistanceToIn(p,v)** - Called during boundary crossing for candidate volumes
3. **DistanceToOut(p,v)** - Called for current volume at every step
4. **DistanceToIn(p)** / **DistanceToOut(p)** - Called for safety calculations

### Optimization Guidelines

**DO**:
- Use inline functions for simple calculations
- Cache frequently computed values (tolerance bands, derived dimensions)
- Use early exit conditions to avoid expensive calculations
- Minimize branching in hot paths
- Use fast approximations for safety calculations (underestimate allowed)
- Cache volume and surface area after first calculation

**DON'T**:
- Allocate memory in distance methods
- Use expensive math functions (prefer fast approximations)
- Call virtual methods in tight loops
- Use default Monte Carlo volume/area calculations in production

### Typical Performance Hierarchy (fastest to slowest)

1. **G4Box** - Axis-aligned, simple comparisons
2. **G4Tubs** - Cylindrical symmetry
3. **G4Cons** - Conical symmetry
4. **G4Sphere** - Spherical symmetry
5. **G4Polycone/G4Polyhedra** - Complex but optimized
6. **Boolean Solids** - Requires evaluating multiple solids
7. **G4TessellatedSolid** - Many facets, slower

**Rule of Thumb**: Prefer simple CSG primitives over Boolean operations when possible.

## Thread Safety

G4VSolid and derived classes are designed to be **thread-safe in multi-threaded mode**:

### Thread-Safe (Read-Only After Construction)
- All solid geometry parameters (dimensions)
- Name and tolerance
- All distance calculation methods

### Not Thread-Safe (Lazy Evaluation)
- Cached volume and surface area (`mutable` members)
- Polyhedron cache for visualization

**Solution**: Use `mutable` for lazy-evaluated caches with thread-local or atomic access, or pre-calculate on master thread.

## Common Pitfalls

### 1. Tolerance Handling
**Problem**: Not using tolerance correctly for surface classification

**Bad**:
```cpp
if (distance == 0) return kSurface;  // WRONG! Floating point comparison
```

**Good**:
```cpp
G4double delta = 0.5*kCarTolerance;
if (std::abs(distance) <= delta) return kSurface;
```

### 2. Normal Calculation Performance
**Problem**: Always calculating normal even when not needed

**Bad**:
```cpp
G4double DistanceToOut(...) const {
  // Always compute normal
  ComputeNormal(...);  // Expensive!
  return distance;
}
```

**Good**:
```cpp
G4double DistanceToOut(..., G4bool calcNorm, ...) const {
  // Compute only if requested
  if (calcNorm) {
    ComputeNormal(...);
  }
  return distance;
}
```

### 3. Missing Extent Implementation
**Problem**: Not overriding BoundingLimits() leads to inefficient voxelization

**Bad**: Using default implementation (infinite box + warning)

**Good**: Provide tight bounding box for optimization

### 4. Expensive Volume Calculation
**Problem**: Not caching analytical volume, relying on Monte Carlo

**Bad**: Calling default GetCubicVolume() repeatedly (very slow!)

**Good**: Override with analytical formula and cache result

## See Also

- [G4Box](g4box.md) - Simplest solid implementation example
- [G4LogicalVolume](g4logicalvolume.md) - Associates solid with material
- [G4PVPlacement](g4pvplacement.md) - Places solid in geometry
- [Geometry Module Overview](../index.md) - Complete module documentation
- [G4Navigator](g4navigator.md) - Uses G4VSolid for particle tracking

## References

### Source Files
- Header: `source/geometry/management/include/G4VSolid.hh`
- Implementation: `source/geometry/management/src/G4VSolid.cc`
- Inline: `source/geometry/management/include/G4VSolid.icc`

### Related Classes
- `G4SolidStore` - Global registry of all solids
- `G4CSGSolid` - Base class for CSG primitives
- `G4BooleanSolid` - Base class for Boolean operations
- `G4AffineTransform` - Transformation for extent calculations
- `G4VoxelLimits` - Voxel bounds for extent calculations

### External Documentation
- [Geant4 User Guide: Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html)
- [Geant4 Class Documentation](http://geant4.kek.jp/Reference/)
