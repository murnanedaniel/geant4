# G4Tubs

**Base Class**: G4CSGSolid (extends [G4VSolid](g4vsolid.md))
**Location**: `source/geometry/solids/CSG/include/G4Tubs.hh`
**Source**: `source/geometry/solids/CSG/src/G4Tubs.cc`
**Inline**: `source/geometry/solids/CSG/include/G4Tubs.icc`

## Overview

G4Tubs represents a tube or cylindrical section with curved sides parallel to the Z-axis. It is one of the fundamental CSG (Constructive Solid Geometry) primitives in Geant4, used extensively for cylindrical detector components such as barrel detectors, beam pipes, wire chambers, and cylindrical shielding.

The tube is defined by an inner radius (which can be zero for a solid cylinder), outer radius, half-length along Z, and optional phi segmentation. The tube is always centered at the origin of its local coordinate system along the Z-axis.

G4Tubs is optimized for cylindrical symmetry and provides efficient algorithms for particle tracking through curved surfaces.

## Key Features

- **Cylindrical Geometry**: Tube or cylinder with axis along Z
- **Hollow or Solid**: Inner radius can be zero for filled cylinder
- **Phi Segmentation**: Supports partial phi coverage (tube sectors)
- **Analytical Solutions**: Quadratic equations for cylindrical intersections
- **Cached Trigonometry**: Pre-computed sin/cos values for efficiency
- **Optimized for Symmetry**: Special handling for full phi coverage
- **Curved Surface Normals**: Accurate normal vectors on cylindrical surfaces
- **Common Detector Shape**: Widely used for barrel detectors and beam pipes

## Class Definition

```cpp
class G4Tubs : public G4CSGSolid
{
  public:
    // Constructor
    G4Tubs(const G4String& pName,
           G4double pRMin,
           G4double pRMax,
           G4double pDz,
           G4double pSPhi,
           G4double pDPhi);

    // Destructor
    ~G4Tubs() override;

    // Dimension accessors (inline)
    G4double GetInnerRadius() const;
    G4double GetOuterRadius() const;
    G4double GetZHalfLength() const;
    G4double GetStartPhiAngle() const;
    G4double GetDeltaPhiAngle() const;
    G4double GetSinStartPhi() const;
    G4double GetCosStartPhi() const;
    G4double GetSinEndPhi() const;
    G4double GetCosEndPhi() const;

    // Dimension modifiers (inline)
    void SetInnerRadius(G4double newRMin);
    void SetOuterRadius(G4double newRMax);
    void SetZHalfLength(G4double newDz);
    void SetStartPhiAngle(G4double newSPhi, G4bool trig=true);
    void SetDeltaPhiAngle(G4double newDPhi);

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
    G4VSolid* Clone() const override;
    std::ostream& StreamInfo(std::ostream& os) const override;

    // Visualization
    void DescribeYourselfTo(G4VGraphicsScene& scene) const override;
    G4Polyhedron* CreatePolyhedron() const override;

    // Parameterization support
    void ComputeDimensions(G4VPVParameterisation* p,
                           const G4int n,
                           const G4VPhysicalVolume* pRep) override;

  protected:
    // Initialization helpers
    void Initialize();
    void InitializeTrigonometry();
    void CheckSPhiAngle(G4double sPhi);
    void CheckDPhiAngle(G4double dPhi);
    void CheckPhiAngles(G4double sPhi, G4double dPhi);

    // Fast inverse radius calculation for surface normals
    G4double FastInverseRxy(const G4ThreeVector& pos,
                           G4double invRad,
                           G4double normalTolerance) const;

    // Approximate surface normal for off-surface points
    virtual G4ThreeVector ApproxSurfaceNormal(const G4ThreeVector& p) const;

    // Member data
    G4double kRadTolerance, kAngTolerance;  // Tolerances
    G4double fRMin, fRMax, fDz;             // Radial and Z dimensions
    G4double fSPhi, fDPhi;                  // Phi segment angles

    // Cached trigonometric values
    G4double sinCPhi, cosCPhi;              // Center phi
    G4double cosHDPhi, cosHDPhiOT, cosHDPhiIT;  // Half delta phi
    G4double sinSPhi, cosSPhi;              // Start phi
    G4double sinEPhi, cosEPhi;              // End phi

    G4bool fPhiFullTube;                    // Full phi coverage flag
    G4double fInvRmax, fInvRmin;            // Inverse radii (cached)
    G4double halfCarTolerance, halfRadTolerance, halfAngTolerance;
};
```

## Constructor and Destructor

### Constructor

**Signature**:
```cpp
G4Tubs(const G4String& pName,
       G4double pRMin,
       G4double pRMax,
       G4double pDz,
       G4double pSPhi,
       G4double pDPhi);
```
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:67-101`

Creates a tube or cylindrical section with specified dimensions.

**Parameters**:
- `pName` - Name for this solid (used in G4SolidStore)
- `pRMin` - Inner radius (must be ≥ 0; use 0 for solid cylinder)
- `pRMax` - Outer radius (must be > pRMin)
- `pDz` - Half-length along Z axis (must be > 0)
- `pSPhi` - Starting phi angle (radians; 0 = +X axis, π/2 = +Y axis)
- `pDPhi` - Delta phi angle (radians; 2π for full tube)

**Validation**:
```cpp
// Lines 83-96
if (pDz <= 0) {
    G4Exception("G4Tubs::G4Tubs()", "GeomSolids0002",
                FatalException, "Negative Z half-length");
}
if ((pRMin >= pRMax) || (pRMin < 0)) {
    G4Exception("G4Tubs::G4Tubs()", "GeomSolids0002",
                FatalException, "Invalid radii");
}
// CheckPhiAngles handles phi validation
```

**Phi Angle Handling**:
- If `pDPhi >= 2π - angularTolerance`, creates full tube (fPhiFullTube = true)
- Otherwise, normalizes angles so 0 ≤ fSPhi < 2π or -2π < fSPhi ≤ 0
- Pre-computes trigonometric values for efficiency

**Actions**:
1. Calls `G4CSGSolid(pName)` constructor
2. Sets dimensions: `fRMin`, `fRMax`, `fDz`
3. Validates and normalizes phi angles via `CheckPhiAngles()`
4. Computes cached values:
   - Inverse radii: `fInvRmax = 1/pRMax`, `fInvRmin = 1/pRMin`
   - Trigonometric values: sin/cos of start, center, and end phi
   - Half-tolerance values
5. Sets `fPhiFullTube` flag

**Example**:
```cpp
// Solid cylinder: radius 5cm, length 20cm
G4Tubs* cylinder = new G4Tubs("BeamPipe",
                              0.0,      // Inner radius = 0 (solid)
                              5*cm,     // Outer radius = 5cm
                              10*cm,    // Half-length Z = 10cm
                              0,        // Start phi = 0
                              CLHEP::twopi);  // Full phi coverage

// Hollow tube with phi segment (90° sector)
G4Tubs* sector = new G4Tubs("TubeSector",
                            8*cm,     // Inner radius = 8cm
                            10*cm,    // Outer radius = 10cm
                            15*cm,    // Half-length Z = 15cm
                            0,        // Start phi = 0 (+X axis)
                            CLHEP::halfpi);  // Delta phi = π/2 (90°)
```

### Destructor

**Signature**: `~G4Tubs() override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:117`

**Implementation**: `= default` (compiler-generated)

Trivial destructor - no dynamically allocated memory to clean up.

## Dimension Accessors and Modifiers

### Accessors (Inline)

**Signatures** (Lines `G4Tubs.icc:30-81`):
```cpp
inline G4double GetInnerRadius() const;     // Returns fRMin
inline G4double GetOuterRadius() const;     // Returns fRMax
inline G4double GetZHalfLength() const;     // Returns fDz
inline G4double GetStartPhiAngle() const;   // Returns fSPhi
inline G4double GetDeltaPhiAngle() const;   // Returns fDPhi
inline G4double GetSinStartPhi() const;     // Returns cached sinSPhi
inline G4double GetCosStartPhi() const;     // Returns cached cosSPhi
inline G4double GetSinEndPhi() const;       // Returns cached sinEPhi
inline G4double GetCosEndPhi() const;       // Returns cached cosEPhi
```

**Performance**: Zero overhead - direct member access, fully inlined

**Example**:
```cpp
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 20*cm, 0, CLHEP::twopi);
G4cout << "Inner radius: " << tube->GetInnerRadius()/cm << " cm" << G4endl;
G4cout << "Outer radius: " << tube->GetOuterRadius()/cm << " cm" << G4endl;
G4cout << "Full Z length: " << 2*tube->GetZHalfLength()/cm << " cm" << G4endl;
```

### Modifiers (Inline)

**Signatures** (Lines `G4Tubs.icc:164-232`):
```cpp
void SetInnerRadius(G4double newRMin);
void SetOuterRadius(G4double newRMax);
void SetZHalfLength(G4double newDz);
void SetStartPhiAngle(G4double newSPhi, G4bool trig=true);
void SetDeltaPhiAngle(G4double newDPhi);
```

**Side Effects**:
1. Updates dimension
2. Calls `Initialize()` which:
   - Invalidates cached volume and surface area
   - Recomputes inverse radii
   - Sets polyhedron rebuild flag

**Validation**: Each setter validates its parameter and throws FatalException if invalid

**Warning**: Should only be called during geometry construction, NOT during simulation!

## Volume and Surface Area

### GetCubicVolume()

**Signature**: `inline G4double GetCubicVolume() override`
**Line**: `source/geometry/solids/CSG/include/G4Tubs.icc:235-240`

Returns the volume in mm³ with lazy evaluation and caching.

**Formula**: V = fDPhi × fDz × (fRMax² - fRMin²)

This represents:
- Angular coverage (fDPhi) × height (2×fDz) × cross-sectional area (π×fRMax² - π×fRMin²) / π
- The π factors cancel out when using fDPhi instead of solid angle

**Implementation**:
```cpp
inline G4double G4Tubs::GetCubicVolume() {
    if (fCubicVolume != 0.) {;}
    else { fCubicVolume = fDPhi*fDz*(fRMax*fRMax - fRMin*fRMin); }
    return fCubicVolume;
}
```

**Example**:
```cpp
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 15*cm, 0, CLHEP::twopi);
G4double volume = tube->GetCubicVolume();
// volume = 2π × 15 × (100 - 25) = 2250π cm³ ≈ 7069 cm³
```

### GetSurfaceArea()

**Signature**: `inline G4double GetSurfaceArea() override`
**Line**: `source/geometry/solids/CSG/include/G4Tubs.icc:243-255`

Returns the surface area in mm² with lazy evaluation and caching.

**Formula**:
- Base formula: A = fDPhi × (fRMin + fRMax) × (2×fDz + fRMax - fRMin)
- For phi segments: Add 4 × fDz × (fRMax - fRMin) for the two phi-cut faces

**Components**:
- Inner cylindrical surface: fDPhi × fRMin × 2×fDz
- Outer cylindrical surface: fDPhi × fRMax × 2×fDz
- Top and bottom rings: fDPhi × (fRMax² - fRMin²)
- Phi-cut faces (if not full tube): 2 × fDz × (fRMax - fRMin) each

**Example**:
```cpp
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 15*cm, 0, CLHEP::halfpi);
G4double area = tube->GetSurfaceArea();
// Includes curved surfaces, top/bottom rings, and two phi-cut faces
```

## Bounding Volume Methods

### BoundingLimits()

**Signature**:
```cpp
void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:174-211`

Returns the axis-aligned bounding box in local coordinates.

**Algorithm**:
```cpp
void G4Tubs::BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const {
    if (GetDeltaPhiAngle() < twopi) {
        // Phi segment: Use G4GeomTools to find XY extent
        G4TwoVector vmin, vmax;
        G4GeomTools::DiskExtent(fRMin, fRMax,
                               GetSinStartPhi(), GetCosStartPhi(),
                               GetSinEndPhi(), GetCosEndPhi(),
                               vmin, vmax);
        pMin.set(vmin.x(), vmin.y(), -fDz);
        pMax.set(vmax.x(), vmax.y(),  fDz);
    } else {
        // Full tube: Simple bounding box
        pMin.set(-fRMax, -fRMax, -fDz);
        pMax.set( fRMax,  fRMax,  fDz);
    }
}
```

**Optimization**: For full tubes, bounding box is simply ±fRMax in X and Y

**Use Case**: Voxelization and spatial optimization in navigation

### CalculateExtent()

**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:217-321`

Calculates extent along an axis under transformation and voxel limits.

**Algorithm**:
- For full solid cylinders (fRMin=0, fDPhi=2π): Creates two polygons for top and bottom
- For general cases: Creates sequence of quadrilaterals around phi
- Uses G4BoundingEnvelope for transformation and clipping
- Adaptively subdivides phi range for accurate transformed bounds

## Point Classification

### Inside()

**Signature**: `EInside Inside(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:327-486`

Determines whether a point is inside, outside, or on the surface.

**Returns**:
- `kInside` - Point is strictly inside
- `kSurface` - Point is on surface (within tolerance)
- `kOutside` - Point is outside

**Algorithm**:
```cpp
EInside G4Tubs::Inside(const G4ThreeVector& p) const {
    // 1. Check Z bounds
    if (std::fabs(p.z()) <= fDz - halfCarTolerance) {
        // Well inside Z bounds
        G4double r2 = p.x()*p.x() + p.y()*p.y();

        // 2. Check radial bounds (strict)
        tolRMin = fRMin + halfRadTolerance;
        tolRMax = fRMax - halfRadTolerance;

        if ((r2 >= tolRMin*tolRMin) && (r2 <= tolRMax*tolRMax)) {
            // 3. Check phi bounds
            if (fPhiFullTube) {
                return kInside;
            } else {
                // Check if point on Z-axis (phi undefined)
                if (tolRMin==0 && std::fabs(p.x())<=halfCarTolerance
                              && std::fabs(p.y())<=halfCarTolerance) {
                    return kSurface;
                }

                // Calculate phi and check bounds with tolerance
                G4double pPhi = std::atan2(p.y(), p.x());
                // Normalize to [0, 2π)
                if (pPhi < -halfAngTolerance) { pPhi += twopi; }

                // Check inner tolerant phi bounds
                if ((pPhi >= fSPhi + halfAngTolerance) &&
                    (pPhi <= fSPhi + fDPhi - halfAngTolerance)) {
                    return kInside;
                }
                // Check surface tolerance
                else if ((pPhi >= fSPhi - halfAngTolerance) &&
                         (pPhi <= fSPhi + fDPhi + halfAngTolerance)) {
                    return kSurface;
                }
            }
        }
        // Check generous radial bounds for kSurface
        // ... similar logic with outer tolerance ...
    }
    // Check generous Z bounds for kSurface
    // ... similar logic ...

    return kOutside;
}
```

**Special Cases**:
- **On Z-axis** (r=0): Phi is undefined, treated as kSurface if fRMin=0
- **Full tube**: Phi check skipped (optimization)
- **Phi wrapping**: Handles phi angles across 0/2π boundary

**Performance**: More complex than G4Box due to:
- Cylindrical coordinate transformation (atan2)
- Phi angle normalization
- Multiple tolerance bands

**Example**:
```cpp
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 15*cm, 0, CLHEP::twopi);

G4ThreeVector p1(7*cm, 0, 0);          // Inside (r=7)
G4ThreeVector p2(10*cm, 0, 0);         // On outer surface
G4ThreeVector p3(0, 0, 0);             // Inside (r=0 < rMin, but actually outside)
G4ThreeVector p4(3*cm, 0, 0);          // Outside (r=3 < rMin)
```

## Surface Normal

### SurfaceNormal()

**Signature**: `G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:494-578`

Returns the outward unit normal vector at or near a surface point.

**Algorithm**:
```cpp
G4ThreeVector G4Tubs::SurfaceNormal(const G4ThreeVector& p) const {
    G4int noSurfaces = 0;
    G4ThreeVector sumnorm(0, 0, 0);

    G4double rho = std::sqrt(p.x()*p.x() + p.y()*p.y());

    // Calculate distances to each surface
    G4double distRMin = std::fabs(rho - fRMin);
    G4double distRMax = std::fabs(rho - fRMax);
    G4double distZ = std::fabs(std::fabs(p.z()) - fDz);
    G4double distSPhi = kInfinity, distEPhi = kInfinity;

    if (!fPhiFullTube && rho > halfCarTolerance) {
        G4double pPhi = std::atan2(p.y(), p.x());
        // Normalize phi...
        distSPhi = std::fabs(pPhi - fSPhi);
        distEPhi = std::fabs(pPhi - fSPhi - fDPhi);
    }

    // Radial normal
    G4ThreeVector nR(0, 0, 0);
    if (rho > halfCarTolerance) {
        nR = G4ThreeVector(p.x()/rho, p.y()/rho, 0);
    }

    // Check each surface and accumulate normals
    if (distRMax <= halfCarTolerance) {
        ++noSurfaces;
        sumnorm += nR;  // Outer radius: outward
    }
    if ((fRMin != 0.0) && (distRMin <= halfCarTolerance)) {
        ++noSurfaces;
        sumnorm -= nR;  // Inner radius: inward (negative)
    }
    if (fDPhi < twopi) {
        if (distSPhi <= halfAngTolerance) {
            ++noSurfaces;
            sumnorm += G4ThreeVector(sinSPhi, -cosSPhi, 0);
        }
        if (distEPhi <= halfAngTolerance) {
            ++noSurfaces;
            sumnorm += G4ThreeVector(-sinEPhi, cosEPhi, 0);
        }
    }
    if (distZ <= halfCarTolerance) {
        ++noSurfaces;
        if (p.z() >= 0.) { sumnorm += G4ThreeVector(0, 0, 1); }
        else             { sumnorm -= G4ThreeVector(0, 0,-1); }
    }

    // Return normalized normal
    if (noSurfaces == 0) {
        return ApproxSurfaceNormal(p);  // Point not on surface
    } else if (noSurfaces == 1) {
        return sumnorm;  // Already unit vector
    } else {
        return sumnorm.unit();  // On edge/corner: normalize sum
    }
}
```

**Surface Normal Directions**:
- **Outer cylindrical surface**: Radial outward (p.x/rho, p.y/rho, 0)
- **Inner cylindrical surface**: Radial inward -(p.x/rho, p.y/rho, 0)
- **Z planes**: ±(0, 0, 1)
- **Phi planes**: Perpendicular to plane, outward from sector

**Edge/Corner Handling**: Sums normals from all adjacent surfaces and normalizes

**Example**:
```cpp
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 15*cm, 0, CLHEP::halfpi);

// Point on outer surface at +X
G4ThreeVector p1(10*cm, 0, 0);
G4ThreeVector n1 = tube->SurfaceNormal(p1);  // n1 = (1, 0, 0)

// Point on edge (outer surface and +Z cap)
G4ThreeVector p2(10*cm, 0, 15*cm);
G4ThreeVector n2 = tube->SurfaceNormal(p2);  // n2 ≈ (0.707, 0, 0.707)
```

### ApproxSurfaceNormal()

**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:585-693`

Fallback for points not on surface - returns normal of nearest surface.

**Algorithm**: Compares distances to all surfaces and returns normal of closest one

## Distance Calculations

### DistanceToIn(p, v) - Ray Intersection

**Signature**:
```cpp
G4double DistanceToIn(const G4ThreeVector& p,
                      const G4ThreeVector& v) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:717-1065`

Calculates distance along ray from outside point to first intersection.

**Parameters**:
- `p` - Starting point (assumed outside or on surface)
- `v` - Direction vector (must be unit vector)

**Returns**:
- Distance ≥ 0 to intersection
- `kInfinity` if no intersection

**Algorithm** (Multi-stage):

1. **Z-plane intersection** (Lines 746-787):
   ```cpp
   if (std::fabs(p.z()) >= tolIDz) {
       if (p.z()*v.z() < 0) {  // Moving toward center
           sd = (std::fabs(p.z()) - fDz) / std::fabs(v.z());
           xi = p.x() + sd*v.x();
           yi = p.y() + sd*v.y();
           rho2 = xi*xi + yi*yi;

           // Check if hit point within radial and phi bounds
           if ((tolIRMin2 <= rho2) && (rho2 <= tolIRMax2)) {
               if (!fPhiFullTube && rho2 != 0) {
                   // Check phi using cosPsi method
                   cosPsi = (xi*cosCPhi + yi*sinCPhi) / std::sqrt(rho2);
                   if (cosPsi >= cosHDPhiIT) { return sd; }
               } else {
                   return sd;
               }
           }
       }
   }
   ```

2. **Outer cylinder intersection** (Lines 800-847):
   ```cpp
   // Solve: (p + t*v) · (p + t*v) = fRMax²
   // Expands to: t²(vx²+vy²) + 2t(px*vx+py*vy) + (px²+py²-R²) = 0

   t1 = 1.0 - v.z()*v.z();  // vx² + vy² (v is normalized)
   t2 = p.x()*v.x() + p.y()*v.y();
   t3 = p.x()*p.x() + p.y()*p.y();

   if ((t3 >= tolORMax2) && (t2 < 0)) {
       c = (t3 - fRMax*fRMax) / t1;
       b = t2 / t1;
       d = b*b - c;

       if (d >= 0) {
           sd = c / (-b + std::sqrt(d));  // Stable quadratic formula
           if (sd >= 0) {
               zi = p.z() + sd*v.z();
               if (std::fabs(zi) <= tolODz) {
                   // Check phi if needed
                   if (fPhiFullTube) { return sd; }
                   // ... phi check ...
               }
           }
       }
   }
   ```

3. **Inner cylinder intersection** (Lines 925-970):
   ```cpp
   if (fRMin != 0.0) {
       c = (t3 - fRMin*fRMin) / t1;
       d = b*b - c;

       if (d >= 0) {
           // Want second root (far intersection from outside)
           sd = (b > 0.) ? c/(-b - std::sqrt(d)) : (-b + std::sqrt(d));

           if (sd >= -halfCarTolerance) {
               zi = p.z() + sd*v.z();
               if (std::fabs(zi) <= tolODz) {
                   // Check phi and save as potential snxt
                   // ...
               }
           }
       }
   }
   ```

4. **Phi plane intersections** (Lines 982-1062):
   ```cpp
   if (!fPhiFullTube) {
       // Starting phi plane
       Comp = v.x()*sinSPhi - v.y()*cosSPhi;
       if (Comp < 0) {  // Moving outward from plane
           Dist = p.y()*cosSPhi - p.x()*sinSPhi;
           if (Dist < halfCarTolerance) {
               sd = Dist / Comp;
               // Check if intersection point within radial and z bounds
               // ... detailed validation ...
           }
       }
       // Similar for ending phi plane
   }
   ```

**Optimization Techniques**:
- **Stable quadratic solver**: Uses `c/(-b±√d)` form to avoid cancellation
- **Long distance splitting**: For sd > 100*fRMax, splits into segments to avoid rounding errors
- **CosPsi test**: Fast phi check using dot product instead of atan2
- **Early exits**: Returns immediately when first valid intersection found

**Performance**: More expensive than G4Box due to:
- Quadratic equation solving (sqrt operations)
- Multiple intersection candidates to check
- Phi angle calculations

### DistanceToIn(p) - Safety Distance

**Signature**: `G4double DistanceToIn(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:1093-1130`

Calculates safety distance from outside point to nearest surface.

**Algorithm**:
```cpp
G4double G4Tubs::DistanceToIn(const G4ThreeVector& p) const {
    G4double rho = std::sqrt(p.x()*p.x() + p.y()*p.y());

    // Distance to radii
    G4double safe1 = fRMin - rho;  // Negative if outside inner radius
    G4double safe2 = rho - fRMax;  // Positive if outside outer radius
    G4double safe3 = std::fabs(p.z()) - fDz;  // Distance to Z caps

    // Maximum is closest surface
    G4double safe = std::max(safe1, safe2);
    if (safe3 > safe) { safe = safe3; }

    // Check phi distance if sector
    if (!fPhiFullTube && rho != 0) {
        G4double cosPsi = (p.x()*cosCPhi + p.y()*sinCPhi) / rho;
        if (cosPsi < cosHDPhi) {
            // Outside phi range
            G4double safePhi;
            if ((p.y()*cosCPhi - p.x()*sinCPhi) <= 0) {
                safePhi = std::fabs(p.x()*sinSPhi - p.y()*cosSPhi);
            } else {
                safePhi = std::fabs(p.x()*sinEPhi - p.y()*cosEPhi);
            }
            if (safePhi > safe) { safe = safePhi; }
        }
    }

    if (safe < 0) { safe = 0; }
    return safe;
}
```

**Use Case**: Navigation optimization - determines maximum safe step without boundary checks

### DistanceToOut(p, v, ...) - Exit Distance

**Signature**:
```cpp
G4double DistanceToOut(const G4ThreeVector& p,
                       const G4ThreeVector& v,
                       const G4bool calcNorm = false,
                       G4bool* validNorm = nullptr,
                       G4ThreeVector* n = nullptr) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:1137-1553`

Calculates distance from inside point to exit surface, optionally computing exit normal.

**Algorithm Summary**:

1. **Z-plane intersection** (Lines 1153-1194):
   ```cpp
   if (v.z() > 0) {
       pdist = fDz - p.z();
       if (pdist > halfCarTolerance) {
           snxt = pdist / v.z();
           side = kPZ;
       } else {
           // Already on surface, exiting immediately
           if (calcNorm) {
               *n = G4ThreeVector(0, 0, 1);
               *validNorm = true;
           }
           return 0;
       }
   }
   // Similar for v.z() < 0
   ```

2. **Radial intersections** (Lines 1196-1326):
   ```cpp
   t1 = 1.0 - v.z()*v.z();
   t2 = p.x()*v.x() + p.y()*v.y();
   t3 = p.x()*p.x() + p.y()*p.y();

   // Estimate radius at exit Z-plane
   roi2 = (snxt > 10*(fDz+fRMax)) ? 2*fRMax*fRMax
                                  : snxt*snxt*t1 + 2*snxt*t2 + t3;

   if ((t2 >= 0) && (roi2 > fRMax*(fRMax + kRadTolerance))) {
       // Exiting via outer radius
       deltaR = t3 - fRMax*fRMax;
       if (deltaR < -kRadTolerance*fRMax) {
           b = t2/t1;
           c = deltaR/t1;
           d2 = b*b - c;
           if (d2 >= 0) {
               srd = c / (-b - std::sqrt(d2));
               sider = kRMax;
           }
       } else {
           // On surface, leaving immediately
           if (calcNorm) {
               *n = FastInverseRxy(p, fInvRmax, kNormTolerance) *
                    G4ThreeVector(p.x(), p.y(), 0);
               *validNorm = true;
           }
           return 0;
       }
   } else if (t2 < 0) {
       // Possibly exiting via inner radius
       roMin2 = t3 - t2*t2/t1;
       if (fRMin != 0 && roMin2 < fRMin*(fRMin - kRadTolerance)) {
           // ... solve for inner radius intersection ...
           sider = kRMin;
           *validNorm = false;  // Inner surface is concave
       }
   }
   ```

3. **Phi plane intersections** (Lines 1328-1468):
   ```cpp
   if (!fPhiFullTube) {
       pDistS = p.x()*sinSPhi - p.y()*cosSPhi;
       pDistE = -p.x()*sinEPhi + p.y()*cosEPhi;
       compS = -sinSPhi*v.x() + cosSPhi*v.y();
       compE = sinEPhi*v.x() - cosEPhi*v.y();

       // Check if inside both phi planes
       if (/* conditions */) {
           if (compS < 0) {
               sphi = pDistS / compS;
               // Validate intersection point
               // ...
               sidephi = kSPhi;
           }
           if (compE < 0 && sphi2 < sphi) {
               // ...
               sidephi = kEPhi;
           }
       }
   }
   ```

4. **Select minimum distance and compute normal** (Lines 1469-1549):
   ```cpp
   if (sphi < snxt) { snxt = sphi; side = sidephi; }
   if (srd < snxt) { snxt = srd; side = sider; }

   if (calcNorm) {
       switch(side) {
           case kRMax:
               xi = p.x() + snxt*v.x();
               yi = p.y() + snxt*v.y();
               *n = G4ThreeVector(xi/fRMax, yi/fRMax, 0);
               *validNorm = true;
               break;
           case kRMin:
               *validNorm = false;  // Concave surface
               break;
           case kSPhi:
               if (fDPhi <= pi) {
                   *n = G4ThreeVector(sinSPhi, -cosSPhi, 0);
                   *validNorm = true;
               } else {
                   *validNorm = false;  // Concave phi sector
               }
               break;
           // ... other cases ...
       }
   }
   ```

**FastInverseRxy()**: Optimized inverse radius calculation for surface normals
- If point is close to expected radius, uses cached inverse
- Otherwise, computes 1/sqrt(x²+y²) directly
- Avoids unnecessary sqrt when possible

**validNorm Flag**:
- `true` for convex surfaces (outer radius, Z planes, phi planes if sector < π)
- `false` for concave surfaces (inner radius, phi planes if sector > π)

### DistanceToOut(p) - Safety Distance from Inside

**Signature**: `G4double DistanceToOut(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:1559-1613`

Calculates exact perpendicular distance from inside point to nearest surface.

**Algorithm**:
```cpp
G4double G4Tubs::DistanceToOut(const G4ThreeVector& p) const {
    G4double rho = std::sqrt(p.x()*p.x() + p.y()*p.y());

    // Radial distances
    G4double safeR1 = rho - fRMin;      // To inner radius
    G4double safeR2 = fRMax - rho;      // To outer radius
    G4double safe = (fRMin != 0) ? std::min(safeR1, safeR2) : safeR2;

    // Z distance
    G4double safeZ = fDz - std::fabs(p.z());
    if (safeZ < safe) { safe = safeZ; }

    // Phi distance (if sector)
    if (!fPhiFullTube) {
        G4double safePhi;
        if (p.y()*cosCPhi - p.x()*sinCPhi <= 0) {
            safePhi = -(p.x()*sinSPhi - p.y()*cosSPhi);
        } else {
            safePhi = (p.x()*sinEPhi - p.y()*cosEPhi);
        }
        if (safePhi < safe) { safe = safePhi; }
    }

    if (safe < 0) { safe = 0; }
    return safe;
}
```

**Example**:
```cpp
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 15*cm, 0, CLHEP::twopi);

// Point near inner surface
G4ThreeVector p(5.5*cm, 0, 0);
G4double safety = tube->DistanceToOut(p);  // safety ≈ 0.5 cm

// Point near outer surface
G4ThreeVector p2(9.5*cm, 0, 0);
G4double safety2 = tube->DistanceToOut(p2);  // safety2 ≈ 0.5 cm
```

## Other Methods

### GetEntityType()

**Signature**: `G4GeometryType GetEntityType() const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:1619-1622`

**Returns**: `"G4Tubs"`

### Clone()

**Signature**: `G4VSolid* Clone() const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:1628-1631`

Creates a deep copy on the heap using copy constructor.

### StreamInfo()

**Signature**: `std::ostream& StreamInfo(std::ostream& os) const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:1637-1654`

Outputs tube parameters to stream.

**Example Output**:
```
-----------------------------------------------------------
    *** Dump for solid - BeamPipe ***
    ===================================================
 Solid type: G4Tubs
 Parameters:
    inner radius : 50 mm
    outer radius : 100 mm
    half length Z: 150 mm
    starting phi : 0 degrees
    delta phi    : 360 degrees
-----------------------------------------------------------
```

### GetPointOnSurface()

**Signature**: `G4ThreeVector GetPointOnSurface() const override`
**Line**: `source/geometry/solids/CSG/src/G4Tubs.cc:1660-1735`

Generates random point uniformly distributed on surface.

**Algorithm**:
```cpp
G4ThreeVector G4Tubs::GetPointOnSurface() const {
    // Calculate surface areas
    G4double sbase = 0.5*fDPhi*(fRMax*fRMax - fRMin*fRMin);  // Each Z cap
    G4double scut = (fDPhi == twopi) ? 0 : hz*(fRMax - fRMin);  // Each phi cut
    G4double slat_outer = hz * fDPhi * fRMax;  // Outer cylinder
    G4double slat_inner = hz * fDPhi * fRMin;  // Inner cylinder

    // Create cumulative area array
    G4double ssurf[6] = {scut, scut, sbase, sbase, slat_outer, slat_inner};
    ssurf[1] += ssurf[0];  // Cumulative
    ssurf[2] += ssurf[1];
    // ...

    // Select surface weighted by area
    G4double select = ssurf[5] * G4QuickRand();
    G4int k = /* binary search equivalent */;

    switch(k) {
        case 0: // Start phi cut
            r = fRMin + (fRMax - fRMin)*G4QuickRand();
            return {r*cosSPhi, r*sinSPhi, hz*G4QuickRand() - fDz};
        case 2: // Base at -dz
            r = std::sqrt(fRMin*fRMin + (fRMax*fRMax - fRMin*fRMin)*G4QuickRand());
            phi = fSPhi + fDPhi*G4QuickRand();
            return {r*std::cos(phi), r*std::sin(phi), -fDz};
        case 4: // Outer lateral surface
            phi = fSPhi + fDPhi*G4QuickRand();
            z = hz*G4QuickRand() - fDz;
            return {fRMax*std::cos(phi), fRMax*std::sin(phi), z};
        // ... other cases ...
    }
}
```

**Note**: For ring surfaces (Z caps), uses sqrt(random) for radial distribution to get uniform area density

## Performance Characteristics

### Computational Complexity

| Operation | Complexity | Typical CPU Instructions | Notes |
|-----------|------------|-------------------------|--------|
| **Inside()** | O(1) | ~30-50 | sqrt, atan2, comparisons |
| **SurfaceNormal()** | O(1) | ~40-60 | sqrt, coordinate transform |
| **DistanceToIn(p,v)** | O(1) | ~100-200 | Quadratic solver, sqrt operations |
| **DistanceToIn(p)** | O(1) | ~20-30 | sqrt, distance calculations |
| **DistanceToOut(p,v)** | O(1) | ~80-150 | Similar to DistanceToIn(p,v) |
| **DistanceToOut(p)** | O(1) | ~20-30 | Distance calculations |
| **GetCubicVolume()** | O(1) | ~3 | Cached after first call |
| **GetSurfaceArea()** | O(1) | ~5 | Cached after first call |

### Memory Footprint

```cpp
sizeof(G4Tubs) ≈ base + 20*sizeof(G4double) + sizeof(G4bool)
              ≈ ~120 + 160 + 1 ≈ 281 bytes
```

**Member Data**:
- Dimensions: 5 doubles (fRMin, fRMax, fDz, fSPhi, fDPhi)
- Cached trig: 9 doubles (sinCPhi, cosCPhi, etc.)
- Cached values: 6 doubles (tolerances, inverse radii)
- Flags: 1 bool (fPhiFullTube)

### Performance Comparison to G4Box

Relative performance (G4Box = 1.0):

| Operation | G4Box | G4Tubs | Slowdown |
|-----------|-------|--------|----------|
| Inside() | 1.0× | 2.5× | Cylindrical coords |
| DistanceToIn(p,v) | 1.0× | 3.0× | Quadratic solver |
| DistanceToOut(p,v) | 1.0× | 3.5× | Complex geometry |

**Why slower than G4Box**:
- Requires sqrt operations for radius calculations
- Quadratic equation solving for cylinder intersections
- Trigonometry (atan2) for phi angle determination
- More complex branching logic

**Optimization Features**:
- Cached trigonometric values avoid repeated sin/cos
- fPhiFullTube flag skips phi checks for full cylinders
- FastInverseRxy() optimizes normal calculations
- Inverse radii cached for efficiency

## Usage Examples

### Example 1: Beam Pipe

```cpp
// Thin-walled aluminum beam pipe
G4double innerRadius = 2.9*cm;
G4double outerRadius = 3.0*cm;
G4double halfLength = 50*cm;

G4Tubs* beamPipe = new G4Tubs("BeamPipe",
                              innerRadius,
                              outerRadius,
                              halfLength,
                              0,           // Start phi
                              CLHEP::twopi);  // Full cylinder

G4Material* aluminum = nist->FindOrBuildMaterial("G4_Al");
G4LogicalVolume* beamPipeLV = new G4LogicalVolume(
    beamPipe, aluminum, "BeamPipe"
);
```

### Example 2: Barrel Detector (Phi Sector)

```cpp
// Silicon barrel detector - one sector
G4double rMin = 10*cm;
G4double rMax = 10.5*cm;  // 5mm thick
G4double halfZ = 30*cm;
G4int nSectors = 12;
G4double dPhi = CLHEP::twopi / nSectors;

G4Tubs* sectorTube = new G4Tubs("BarrelSector",
                                rMin, rMax, halfZ,
                                0,     // Will rotate each placement
                                dPhi); // 30° sector

G4Material* silicon = nist->FindOrBuildMaterial("G4_Si");
G4LogicalVolume* sectorLV = new G4LogicalVolume(
    sectorTube, silicon, "BarrelSector"
);

// Place multiple sectors with rotation
for (G4int i = 0; i < nSectors; i++) {
    G4double phi = i * dPhi;
    G4RotationMatrix* rot = new G4RotationMatrix();
    rot->rotateZ(phi);

    new G4PVPlacement(rot, G4ThreeVector(), sectorLV,
                     "BarrelSector", motherLV, false, i, true);
}
```

### Example 3: Wire Chamber Layer

```cpp
// Solid wire (fRMin = 0)
G4double wireRadius = 25*um;  // 25 micron diameter
G4double wireLength = 50*cm;

G4Tubs* wire = new G4Tubs("Wire",
                          0,            // Solid wire
                          wireRadius,
                          wireLength/2,
                          0, CLHEP::twopi);

G4Material* tungsten = nist->FindOrBuildMaterial("G4_W");
G4LogicalVolume* wireLV = new G4LogicalVolume(wire, tungsten, "Wire");

// Calculate mass
G4double volume = wire->GetCubicVolume();
G4double density = tungsten->GetDensity();
G4double mass = volume * density;
G4cout << "Wire mass: " << mass/mg << " mg" << G4endl;
```

### Example 4: Cylindrical Calorimeter with Segmentation

```cpp
// Lead-glass calorimeter tube
G4Tubs* caloCell = new G4Tubs("CaloCell",
                              0,          // Solid
                              3*cm,       // Radius
                              15*cm,      // Half length
                              0, CLHEP::twopi);

G4Material* leadGlass = nist->FindOrBuildMaterial("G4_GLASS_LEAD");
G4LogicalVolume* caloCellLV = new G4LogicalVolume(
    caloCell, leadGlass, "CaloCell"
);

// Arrange in cylindrical array
G4int nPhi = 32;   // Azimuthal divisions
G4int nZ = 10;     // Z divisions
G4double radius = 50*cm;
G4double phiStep = CLHEP::twopi / nPhi;
G4double zStep = 30*cm;

for (G4int iPhi = 0; iPhi < nPhi; iPhi++) {
    G4double phi = iPhi * phiStep;
    for (G4int iZ = 0; iZ < nZ; iZ++) {
        G4double z = (iZ - nZ/2.0 + 0.5) * zStep;
        G4double x = radius * std::cos(phi);
        G4double y = radius * std::sin(phi);

        G4RotationMatrix* rot = new G4RotationMatrix();
        rot->rotateX(CLHEP::halfpi);  // Orient along radius
        rot->rotateZ(phi);

        G4int copyNo = iPhi * nZ + iZ;
        new G4PVPlacement(rot, G4ThreeVector(x, y, z),
                         caloCellLV, "CaloCell",
                         motherLV, false, copyNo, true);
    }
}
```

### Example 5: Testing Point Classification

```cpp
G4Tubs* tube = new G4Tubs("TestTube", 5*cm, 10*cm, 15*cm,
                          0, CLHEP::twopi);

struct TestPoint {
    G4ThreeVector pos;
    const char* desc;
};

TestPoint points[] = {
    {{0, 0, 0},          "Center (r < rMin)"},
    {{7*cm, 0, 0},       "Interior"},
    {{10*cm, 0, 0},      "On outer surface"},
    {{5*cm, 0, 0},       "On inner surface"},
    {{0, 0, 15*cm},      "On +Z cap"},
    {{3*cm, 0, 0},       "Outside (r < rMin)"},
    {{12*cm, 0, 0},      "Outside (r > rMax)"},
    {{7*cm, 0, 20*cm},   "Outside (|z| > dz)"}
};

const char* status[] = {"kInside", "kSurface", "kOutside"};

for (auto& pt : points) {
    EInside result = tube->Inside(pt.pos);
    G4cout << pt.desc << ": " << status[result] << G4endl;

    if (result != kOutside) {
        G4double safety = tube->DistanceToOut(pt.pos);
        G4cout << "  Safety: " << safety/cm << " cm" << G4endl;
    }
}
```

### Example 6: Phi Segment Tracking

```cpp
// 90-degree tube sector
G4Tubs* sector = new G4Tubs("Sector", 8*cm, 10*cm, 15*cm,
                            0,                    // Start at +X
                            CLHEP::halfpi);      // 90° sector

// Test points at various phi angles
for (G4double phi = -45*deg; phi <= 135*deg; phi += 15*deg) {
    G4double x = 9*cm * std::cos(phi);
    G4double y = 9*cm * std::sin(phi);
    G4ThreeVector p(x, y, 0);

    EInside result = sector->Inside(p);
    G4cout << "Phi = " << phi/deg << "°: " << status[result] << G4endl;
}
// Expected: kOutside for phi < 0 or phi > 90°
```

### Example 7: Ray Tracing Through Cylinder

```cpp
G4Tubs* tube = new G4Tubs("Tube", 0, 10*cm, 20*cm, 0, CLHEP::twopi);

// Shoot rays from outside
G4ThreeVector origin(-20*cm, 0, 0);

for (G4double angle = -60; angle <= 60; angle += 10) {
    G4double radAngle = angle * CLHEP::deg;
    G4ThreeVector dir(std::cos(radAngle), std::sin(radAngle), 0);

    G4double distIn = tube->DistanceToIn(origin, dir);

    if (distIn < kInfinity) {
        G4ThreeVector hitIn = origin + distIn * dir;
        G4ThreeVector normalIn = tube->SurfaceNormal(hitIn);

        // Continue ray through tube
        G4ThreeVector posInside = hitIn + 0.01*mm * dir;  // Small step
        G4double distOut = tube->DistanceToOut(posInside, dir);
        G4ThreeVector hitOut = posInside + distOut * dir;
        G4ThreeVector normalOut = tube->SurfaceNormal(hitOut);

        G4cout << "Angle " << angle << "°:" << G4endl;
        G4cout << "  Entry: " << hitIn << ", normal: " << normalIn << G4endl;
        G4cout << "  Exit:  " << hitOut << ", normal: " << normalOut << G4endl;
        G4cout << "  Path length: " << distOut/cm << " cm" << G4endl;
    }
}
```

## Common Pitfalls

### Pitfall 1: Confusing Radius and Diameter

```cpp
// WRONG - using diameter instead of radius
G4double diameter = 10*cm;
G4Tubs* tube = new G4Tubs("Tube", 0, diameter, 5*cm, 0, CLHEP::twopi);
// This creates a tube with 10cm radius (20cm diameter)!

// CORRECT - use radius
G4double diameter = 10*cm;
G4double radius = diameter / 2;
G4Tubs* tube = new G4Tubs("Tube", 0, radius, 5*cm, 0, CLHEP::twopi);
```

### Pitfall 2: Invalid Radii

```cpp
// WRONG - inner radius ≥ outer radius
G4Tubs* tube = new G4Tubs("Tube", 10*cm, 5*cm, 10*cm, 0, CLHEP::twopi);
// FatalException: "Invalid radii"

// WRONG - negative inner radius
G4Tubs* tube = new G4Tubs("Tube", -2*cm, 10*cm, 10*cm, 0, CLHEP::twopi);
// FatalException: "Invalid radii"

// CORRECT
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 10*cm, 0, CLHEP::twopi);
```

### Pitfall 3: Phi Angle Units

```cpp
// WRONG - using degrees instead of radians
G4Tubs* sector = new G4Tubs("Sector", 5*cm, 10*cm, 15*cm,
                            0,    // Start phi
                            90);  // WRONG! This is 90 radians, not degrees

// CORRECT - use CLHEP units or radians
G4Tubs* sector = new G4Tubs("Sector", 5*cm, 10*cm, 15*cm,
                            0,
                            90*deg);  // Using CLHEP::deg

// OR
G4Tubs* sector = new G4Tubs("Sector", 5*cm, 10*cm, 15*cm,
                            0,
                            CLHEP::halfpi);  // π/2 radians = 90°
```

### Pitfall 4: Phi Angle Range

```cpp
// Be careful with phi wrapping across 0/2π
G4Tubs* sector1 = new G4Tubs("Sector", 5*cm, 10*cm, 15*cm,
                             350*deg,  // Starts near 2π
                             30*deg);  // Wraps around to 20°

// This is valid and creates a sector from 350° to 20° (30° total)
// But be careful when querying:
G4double sPhi = sector1->GetStartPhiAngle();  // May be normalized
G4double dPhi = sector1->GetDeltaPhiAngle();  // Always positive
```

### Pitfall 5: Zero Inner Radius Point

```cpp
// Point at origin with hollow tube
G4Tubs* hollow = new G4Tubs("Hollow", 5*cm, 10*cm, 15*cm,
                            0, CLHEP::halfpi);
G4ThreeVector origin(0, 0, 0);
EInside result = hollow->Inside(origin);
// result = kOutside (origin is inside the hole!)

// For solid cylinder, origin is inside
G4Tubs* solid = new G4Tubs("Solid", 0, 10*cm, 15*cm, 0, CLHEP::twopi);
result = solid->Inside(origin);  // result = kInside
```

### Pitfall 6: Phi Sector Placement

```cpp
// WRONG - forgetting to rotate phi sectors
G4Tubs* sector = new G4Tubs("Sector", 5*cm, 10*cm, 15*cm,
                            0, 30*deg);
// If you place multiple copies without rotation, they all overlap!

// CORRECT - rotate each copy
for (G4int i = 0; i < 12; i++) {
    G4RotationMatrix* rot = new G4RotationMatrix();
    rot->rotateZ(i * 30*deg);  // Rotate around Z
    new G4PVPlacement(rot, G4ThreeVector(), sectorLV,
                     "Sector", motherLV, false, i);
}
```

### Pitfall 7: Tolerance Issues on Surface

```cpp
// Points exactly on surface may give inconsistent results
G4Tubs* tube = new G4Tubs("Tube", 0, 10*cm, 15*cm, 0, CLHEP::twopi);
G4ThreeVector onSurface(10*cm, 0, 0);  // Exactly on surface

// This might return kSurface or kInside depending on rounding
EInside result = tube->Inside(onSurface);

// Better: use a small offset
G4ThreeVector justInside(10*cm - 0.1*mm, 0, 0);
result = tube->Inside(justInside);  // Reliably kInside
```

## Best Practices

### 1. Use Full Tube When Possible

```cpp
// Preferred: full tube (more efficient)
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 15*cm, 0, CLHEP::twopi);
// fPhiFullTube = true, skips phi checks

// Avoid if not needed: phi sector
G4Tubs* sector = new G4Tubs("Sector", 5*cm, 10*cm, 15*cm, 0, 1.9999*CLHEP::twopi);
// fPhiFullTube = false, requires phi calculations
```

### 2. Choose Appropriate Dimensions

```cpp
// Good: reasonable dimensions
G4Tubs* beamPipe = new G4Tubs("BeamPipe", 2.9*cm, 3*cm, 50*cm,
                              0, CLHEP::twopi);

// Be careful: very thin walls relative to radius
G4Tubs* thinWall = new G4Tubs("ThinWall", 10*cm, 10.001*cm, 50*cm,
                              0, CLHEP::twopi);
// Wall thickness 10 μm - may have numerical issues
```

### 3. Use Descriptive Names and Comments

```cpp
// Good: clear intent
G4Tubs* innerDetectorBarrel = new G4Tubs(
    "InnerDetectorBarrel",
    20*cm,    // Inner radius - clearance for beam pipe
    25*cm,    // Outer radius - 5cm thick silicon
    100*cm,   // Half-length - covers tracker region
    0, CLHEP::twopi
);
```

### 4. Validate Geometry

```cpp
// Check for overlaps during placement
G4VPhysicalVolume* tubePV = new G4PVPlacement(
    nullptr, G4ThreeVector(), tubeLV, "Tube",
    motherLV, false, 0,
    true  // Check overlaps (important!)
);

// Verify dimensions make sense
G4double volume = tube->GetCubicVolume();
G4double expectedVolume = CLHEP::twopi * tube->GetZHalfLength() * 2 *
                         (tube->GetOuterRadius()*tube->GetOuterRadius() -
                          tube->GetInnerRadius()*tube->GetInnerRadius());
assert(std::fabs(volume - expectedVolume) < 1e-6);
```

### 5. Use Appropriate Modifiers

```cpp
// Set phi angles together to ensure consistency
tube->SetStartPhiAngle(0, false);      // Don't recompute trig yet
tube->SetDeltaPhiAngle(CLHEP::halfpi); // Recomputes trig now

// More efficient than:
tube->SetStartPhiAngle(0);      // Recomputes trig
tube->SetDeltaPhiAngle(CLHEP::halfpi); // Recomputes trig again
```

### 6. Optimize for Symmetry

```cpp
// If detector has cylindrical symmetry, use full tube
// and replicate with copies instead of phi sectors
G4Tubs* fullTube = new G4Tubs("Detector", 10*cm, 11*cm, 50*cm,
                              0, CLHEP::twopi);
G4LogicalVolume* tubeLV = new G4LogicalVolume(fullTube, material, "Detector");

// More efficient than 12 phi sectors
```

### 7. Consider G4Cons for Tapered Geometry

```cpp
// If your "tube" has different radii at each end, use G4Cons instead
// DON'T approximate with G4Tubs
// DO use G4Cons (see g4cons.md)
```

## See Also

- [G4VSolid](g4vsolid.md) - Base class for all solids
- [G4CSGSolid](g4cssolid.md) - Base class for CSG primitives
- [G4Box](g4box.md) - Rectangular box (simpler, faster)
- [G4Cons](g4cons.md) - Conical section (tapered tube)
- [G4Sphere](g4sphere.md) - Spherical shell
- [G4Polycone](g4polycone.md) - Complex shape with varying radius vs Z
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/solids/CSG/include/G4Tubs.hh`
- Implementation: `source/geometry/solids/CSG/src/G4Tubs.cc`
- Inline: `source/geometry/solids/CSG/include/G4Tubs.icc`

### Related Classes
- `G4SolidStore` - Global registry of all solids
- `G4CSGSolid` - Base class for CSG primitives
- `G4BoundingEnvelope` - Extent calculation helper
- `G4PolyhedronTubs` - Visualization polyhedron

### Key Algorithms
- **Quadratic Equation Solver**: Ray-cylinder intersection
- **CosPsi Test**: Fast phi range check using dot product
- **Stable Quadratic Formula**: `c/(-b±√d)` to avoid cancellation
- **Area-weighted Sampling**: Surface point generation

### External Documentation
- [Geant4 User Guide: Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html)
- [Geant4 Class Documentation](http://geant4.kek.jp/Reference/)
- [Ray-Cylinder Intersection](https://www.cl.cam.ac.uk/teaching/1999/AGraphHCI/SMAG/node2.html)
