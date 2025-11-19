# G4Sphere

**Base Class**: G4CSGSolid (extends [G4VSolid](g4vsolid.md))
**Location**: `source/geometry/solids/CSG/include/G4Sphere.hh`
**Source**: `source/geometry/solids/CSG/src/G4Sphere.cc`
**Inline**: `source/geometry/solids/CSG/include/G4Sphere.icc`

## Overview

G4Sphere represents a spherical shell or section of a spherical shell with optional phi and theta segmentation. It is a fundamental CSG (Constructive Solid Geometry) primitive in Geant4, used for detector components with spherical geometry such as spherical detectors, particle sources, calorimeter regions, and cosmic ray shields.

The sphere is defined by inner and outer radii (which can create a shell or solid sphere), phi segmentation (azimuthal angle around Z-axis), and theta segmentation (polar angle from +Z axis). The sphere is always centered at the origin of its local coordinate system.

G4Sphere provides efficient algorithms for tracking particles through spherical surfaces and supports complex segmentation patterns for detailed detector modeling.

## Key Features

- **Spherical Shell or Solid**: Inner radius can be zero for solid sphere
- **Phi Segmentation**: Supports partial azimuthal coverage (sphere sectors)
- **Theta Segmentation**: Supports partial polar angle coverage (spherical caps/bands)
- **Full Sphere Support**: Optimized for complete sphere with no segmentation
- **Analytical Solutions**: Quadratic equations for spherical intersections
- **Extensive Trigonometric Caching**: Pre-computed sin/cos/tan values for both angles
- **Complex Surface Normals**: Handles radial, phi, and theta cone surfaces
- **Versatile Geometry**: From full spheres to thin wedges and caps

## Class Definition

```cpp
class G4Sphere : public G4CSGSolid
{
  public:
    // Constructor
    G4Sphere(const G4String& pName,
             G4double pRmin, G4double pRmax,
             G4double pSPhi, G4double pDPhi,
             G4double pSTheta, G4double pDTheta);

    // Destructor
    ~G4Sphere() override;

    // Dimension accessors (inline)
    G4double GetInnerRadius() const;
    G4double GetOuterRadius() const;
    G4double GetStartPhiAngle() const;
    G4double GetDeltaPhiAngle() const;
    G4double GetStartThetaAngle() const;
    G4double GetDeltaThetaAngle() const;
    G4double GetSinStartPhi() const;
    G4double GetCosStartPhi() const;
    G4double GetSinEndPhi() const;
    G4double GetCosEndPhi() const;
    G4double GetSinStartTheta() const;
    G4double GetCosStartTheta() const;
    G4double GetSinEndTheta() const;
    G4double GetCosEndTheta() const;

    // Dimension modifiers (inline)
    void SetInnerRadius(G4double newRMin);
    void SetOuterRadius(G4double newRmax);
    void SetStartPhiAngle(G4double newSPhi, G4bool trig = true);
    void SetDeltaPhiAngle(G4double newDPhi);
    void SetStartThetaAngle(G4double newSTheta);
    void SetDeltaThetaAngle(G4double newDTheta);

    // Volume and surface area (cached)
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
    G4VisExtent GetExtent() const override;
    void DescribeYourselfTo(G4VGraphicsScene& scene) const override;
    G4Polyhedron* CreatePolyhedron() const override;

    // Parameterization support
    void ComputeDimensions(G4VPVParameterisation* p,
                           const G4int n,
                           const G4VPhysicalVolume* pRep) override;

  private:
    // Initialization helpers
    void Initialize();
    void CheckThetaAngles(G4double sTheta, G4double dTheta);
    void CheckSPhiAngle(G4double sPhi);
    void CheckDPhiAngle(G4double dPhi);
    void CheckPhiAngles(G4double sPhi, G4double dPhi);
    void InitializePhiTrigonometry();
    void InitializeThetaTrigonometry();

    // Approximate surface normal for off-surface points
    G4ThreeVector ApproxSurfaceNormal(const G4ThreeVector& p) const;

    // Member data
    G4double fRminTolerance, fRmaxTolerance;    // Radial tolerances
    G4double kAngTolerance, kRadTolerance;      // Standard tolerances
    G4double fEpsilon = 2.e-11;                 // Precision parameter

    G4double fRmin, fRmax;                      // Radii
    G4double fSPhi, fDPhi;                      // Phi angles
    G4double fSTheta, fDTheta;                  // Theta angles

    // Cached trigonometric values for Phi
    G4double sinCPhi, cosCPhi;                  // Center phi
    G4double cosHDPhi, cosHDPhiOT, cosHDPhiIT;  // Half delta phi
    G4double sinSPhi, cosSPhi;                  // Start phi
    G4double sinEPhi, cosEPhi;                  // End phi
    G4double hDPhi, cPhi, ePhi;                 // Phi values

    // Cached trigonometric values for Theta
    G4double sinSTheta, cosSTheta;              // Start theta
    G4double sinETheta, cosETheta;              // End theta
    G4double tanSTheta, tanSTheta2;             // Tan and tan²
    G4double tanETheta, tanETheta2;             // Tan and tan²
    G4double eTheta;                            // End theta value

    // Flags
    G4bool fFullPhiSphere = false;              // Full phi coverage
    G4bool fFullThetaSphere = false;            // Full theta coverage
    G4bool fFullSphere = true;                  // Complete sphere

    G4double halfCarTolerance, halfAngTolerance; // Cached half tolerances
};
```

## Constructor and Destructor

### Constructor

**Signature**:
```cpp
G4Sphere(const G4String& pName,
         G4double pRmin, G4double pRmax,
         G4double pSPhi, G4double pDPhi,
         G4double pSTheta, G4double pDTheta);
```
**Line**: `source/geometry/solids/CSG/src/G4Sphere.cc:72-102`

Creates a spherical shell or section with specified dimensions.

**Parameters**:
- `pName` - Name for this solid (used in G4SolidStore)
- `pRmin` - Inner radius (must be ≥ 0; use 0 for solid sphere)
- `pRmax` - Outer radius (must be > pRmin and > 1.1×radialTolerance)
- `pSPhi` - Starting phi angle (radians; 0 = +X axis, π/2 = +Y axis)
- `pDPhi` - Delta phi angle (radians; 2π for full azimuthal coverage)
- `pSTheta` - Starting theta angle (radians; 0 = +Z axis, must be in [0,π])
- `pDTheta` - Delta theta angle (radians; π for full polar coverage)

**Angle Conventions**:
- **Phi (azimuthal)**: Measured from +X axis around +Z axis
  - 0 = +X direction
  - π/2 = +Y direction
  - π = -X direction
  - 3π/2 = -Y direction
- **Theta (polar)**: Measured from +Z axis
  - 0 = +Z direction (north pole)
  - π/2 = XY plane (equator)
  - π = -Z direction (south pole)

**Validation**:
```cpp
// Lines 86-93
if ((pRmin >= pRmax) || (pRmax < 1.1*kRadTolerance) || (pRmin < 0)) {
    G4Exception("G4Sphere::G4Sphere()", "GeomSolids0002",
                FatalException, "Invalid radii");
}

// Lines 100-101
CheckPhiAngles(pSPhi, pDPhi);       // Validates and normalizes phi
CheckThetaAngles(pSTheta, pDTheta); // Validates theta in [0,π]
```

**Theta Validation** (Lines `G4Sphere.icc:155-190`):
- `pSTheta` must be in range [0, π]
- `pDTheta` must be positive
- If `pSTheta + pDTheta ≥ π`, adjusts `fDTheta = π - pSTheta`
- Sets `fFullThetaSphere = true` if delta theta ≥ π

**Actions**:
1. Calls `G4CSGSolid(pName)` constructor
2. Sets radii: `fRmin`, `fRmax`
3. Computes radial tolerances: `fRminTolerance`, `fRmaxTolerance`
4. Validates and normalizes phi angles via `CheckPhiAngles()`
5. Validates and normalizes theta angles via `CheckThetaAngles()`
6. Computes cached trigonometric values for both phi and theta
7. Sets flags: `fFullPhiSphere`, `fFullThetaSphere`, `fFullSphere`

**Example**:
```cpp
// Full solid sphere
G4Sphere* sphere = new G4Sphere("FullSphere",
                                0,             // Inner radius = 0 (solid)
                                10*cm,         // Outer radius = 10cm
                                0,             // Start phi = 0
                                CLHEP::twopi,  // Full phi coverage
                                0,             // Start theta = 0 (+Z)
                                CLHEP::pi);    // Full theta coverage

// Hollow spherical shell
G4Sphere* shell = new G4Sphere("Shell",
                               8*cm,          // Inner radius = 8cm
                               10*cm,         // Outer radius = 10cm
                               0, CLHEP::twopi,
                               0, CLHEP::pi);

// Hemisphere (northern half)
G4Sphere* hemisphere = new G4Sphere("Hemisphere",
                                    0, 15*cm,
                                    0, CLHEP::twopi,
                                    0,                  // Start at +Z
                                    CLHEP::halfpi);     // 90° coverage

// Spherical wedge (90° phi sector)
G4Sphere* wedge = new G4Sphere("Wedge",
                               0, 12*cm,
                               0,                  // Start phi = 0
                               CLHEP::halfpi,      // 90° phi coverage
                               0, CLHEP::pi);

// Spherical band (equatorial region)
G4Sphere* band = new G4Sphere("Band",
                              10*cm, 12*cm,
                              0, CLHEP::twopi,
                              CLHEP::pi/3,        // Start at 60° from +Z
                              CLHEP::pi/3);       // 60° coverage
```

### Destructor

**Signature**: `~G4Sphere() override`
**Line**: `source/geometry/solids/CSG/src/G4Sphere.cc:118`

**Implementation**: `= default` (compiler-generated)

Trivial destructor - no dynamically allocated memory to clean up.

## Dimension Accessors and Modifiers

### Accessors (Inline)

**Signatures** (Lines `G4Sphere.icc:30-110`):
```cpp
inline G4double GetInnerRadius() const;        // Returns fRmin
inline G4double GetOuterRadius() const;        // Returns fRmax
inline G4double GetStartPhiAngle() const;      // Returns fSPhi
inline G4double GetDeltaPhiAngle() const;      // Returns fDPhi
inline G4double GetStartThetaAngle() const;    // Returns fSTheta
inline G4double GetDeltaThetaAngle() const;    // Returns fDTheta
inline G4double GetSinStartPhi() const;        // Returns cached sinSPhi
inline G4double GetCosStartPhi() const;        // Returns cached cosSPhi
inline G4double GetSinEndPhi() const;          // Returns cached sinEPhi
inline G4double GetCosEndPhi() const;          // Returns cached cosEPhi
inline G4double GetSinStartTheta() const;      // Returns cached sinSTheta
inline G4double GetCosStartTheta() const;      // Returns cached cosSTheta
inline G4double GetSinEndTheta() const;        // Returns cached sinETheta
inline G4double GetCosEndTheta() const;        // Returns cached cosETheta
```

**Performance**: Zero overhead - direct member access, fully inlined

**Example**:
```cpp
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm, 0, CLHEP::twopi,
                                0, CLHEP::halfpi);

G4double radius = sphere->GetOuterRadius();       // 10 cm
G4double thetaRange = sphere->GetDeltaThetaAngle(); // π/2 rad = 90°

// Calculate solid angle coverage
G4double dPhi = sphere->GetDeltaPhiAngle();
G4double sTheta = sphere->GetStartThetaAngle();
G4double dTheta = sphere->GetDeltaThetaAngle();
G4double solidAngle = dPhi * (std::cos(sTheta) - std::cos(sTheta + dTheta));
G4cout << "Solid angle: " << solidAngle << " steradians" << G4endl;
```

### Modifiers (Inline)

**Signatures** (Lines `G4Sphere.icc:249-295`):
```cpp
void SetInnerRadius(G4double newRmin);
void SetOuterRadius(G4double newRmax);
void SetStartPhiAngle(G4double newSPhi, G4bool trig = true);
void SetDeltaPhiAngle(G4double newDPhi);
void SetStartThetaAngle(G4double newSTheta);
void SetDeltaThetaAngle(G4double newDTheta);
```

**Side Effects**:
1. Updates dimension
2. Recomputes tolerances (for radius setters)
3. Recomputes cached trigonometric values (for angle setters)
4. Calls `Initialize()` which invalidates cached volume/area

**Warning**: Should only be called during geometry construction, NOT during simulation!

## Volume and Surface Area

### GetCubicVolume()

**Signature**: `G4double GetCubicVolume() override`

Returns the volume in mm³ with lazy evaluation and caching.

**Formula** (for full sphere):
```
V = (4/3)π × fDPhi/2π × [cos(sTheta) - cos(sTheta + dTheta)] × (Rmax³ - Rmin³)
```

The formula accounts for:
- Phi fraction: fDPhi / 2π
- Theta solid angle: integrated over theta range
- Shell volume: difference of outer and inner sphere volumes

**Implementation**: Computed on first call, then cached

**Example**:
```cpp
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm, 0, CLHEP::twopi,
                                0, CLHEP::pi);
G4double volume = sphere->GetCubicVolume();
// volume = (4/3)π × 10³ ≈ 4188.8 cm³
```

### GetSurfaceArea()

**Signature**: `G4double GetSurfaceArea() override`

Returns the surface area in mm² with lazy evaluation and caching.

**Components**:
- **Inner spherical surface**: 2π × fRmin² × fDPhi/2π × [cos(sTheta) - cos(sTheta+dTheta)]
- **Outer spherical surface**: 2π × fRmax² × fDPhi/2π × [cos(sTheta) - cos(sTheta+dTheta)]
- **Theta cone surfaces** (if not full theta): Conical surfaces at theta boundaries
- **Phi plane surfaces** (if not full phi): Planar surfaces at phi boundaries

**Implementation**: Computed on first call, then cached

## Bounding Volume Methods

### BoundingLimits()

**Signature**:
```cpp
void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Sphere.cc:180-231`

Returns the axis-aligned bounding box in local coordinates.

**Algorithm**:
```cpp
void G4Sphere::BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const {
    G4double rmin = GetInnerRadius();
    G4double rmax = GetOuterRadius();

    // Full sphere case
    if (GetDeltaThetaAngle() >= pi && GetDeltaPhiAngle() >= twopi) {
        pMin.set(-rmax, -rmax, -rmax);
        pMax.set( rmax,  rmax,  rmax);
    } else {
        // Calculate rho (XY plane radius) bounds from theta limits
        G4double stheta = GetStartThetaAngle();
        G4double etheta = stheta + GetDeltaThetaAngle();
        G4double rhomin = rmin * std::min(sinSTheta, sinETheta);
        G4double rhomax = rmax;
        if (stheta > halfpi) rhomax = rmax * sinSTheta;
        if (etheta < halfpi) rhomax = rmax * sinETheta;

        // Get XY extent using phi segmentation
        G4TwoVector xymin, xymax;
        G4GeomTools::DiskExtent(rhomin, rhomax,
                               GetSinStartPhi(), GetCosStartPhi(),
                               GetSinEndPhi(), GetCosEndPhi(),
                               xymin, xymax);

        // Z bounds from theta
        G4double zmin = std::min(rmin*cosETheta, rmax*cosETheta);
        G4double zmax = std::max(rmin*cosSTheta, rmax*cosSTheta);

        pMin.set(xymin.x(), xymin.y(), zmin);
        pMax.set(xymax.x(), xymax.y(), zmax);
    }
}
```

**Key Insight**: Z bounds determined by theta; XY bounds by both theta (determines rho range) and phi (determines angular sector)

### CalculateExtent()

**Line**: `source/geometry/solids/CSG/src/G4Sphere.cc:237-250`

Calculates extent along an axis under transformation and voxel limits.

**Algorithm**: Uses G4BoundingEnvelope with computed bounding limits

## Point Classification

### Inside()

**Signature**: `EInside Inside(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Sphere.cc:258-364`

Determines whether a point is inside, outside, or on the surface.

**Returns**:
- `kInside` - Point is strictly inside
- `kSurface` - Point is on surface (within tolerance)
- `kOutside` - Point is outside

**Algorithm**:
```cpp
EInside G4Sphere::Inside(const G4ThreeVector& p) const {
    EInside in = kOutside;

    G4double rho2 = p.x()*p.x() + p.y()*p.y();
    G4double rad2 = rho2 + p.z()*p.z();  // r² = x² + y² + z²

    // 1. Check at origin
    if (rad2 == 0.0) {
        if (fRmin > 0.0) { return kOutside; }  // Inside hole
        if (!fFullPhiSphere || !fFullThetaSphere) { return kSurface; }
        return kInside;
    }

    // 2. Check radial bounds
    G4double Rmax_minus = fRmax - 0.5*fRmaxTolerance;
    G4double Rmin_plus = (fRmin > 0) ? fRmin + 0.5*fRminTolerance : 0;

    if ((rad2 <= Rmax_minus*Rmax_minus) &&
        (rad2 >= Rmin_plus*Rmin_plus)) {
        in = kInside;
    } else {
        // Check with generous tolerance
        G4double tolRMax = fRmax + 0.5*fRmaxTolerance;
        G4double tolRMin = std::max(fRmin - 0.5*fRminTolerance, 0.);
        if ((rad2 <= tolRMax*tolRMax) && (rad2 >= tolRMin*tolRMin)) {
            in = kSurface;
        } else {
            return kOutside;
        }
    }

    // 3. Check phi bounds (if segmented)
    if (!fFullPhiSphere && (rho2 != 0.0)) {
        G4double pPhi = std::atan2(p.y(), p.x());
        // Normalize phi...
        if ((pPhi < fSPhi - halfAngTolerance) ||
            (pPhi > ePhi + halfAngTolerance)) {
            return kOutside;
        }
        if (in == kInside) {
            if ((pPhi < fSPhi + halfAngTolerance) ||
                (pPhi > ePhi - halfAngTolerance)) {
                in = kSurface;
            }
        }
    }

    // 4. Check theta bounds (if segmented)
    if (((rho2 != 0.0) || (p.z() != 0.0)) && (!fFullThetaSphere)) {
        G4double rho = std::sqrt(rho2);
        G4double pTheta = std::atan2(rho, p.z());  // Polar angle from +Z

        if (in == kInside) {
            if (((fSTheta > 0.0) && (pTheta < fSTheta + halfAngTolerance)) ||
                ((eTheta < pi) && (pTheta > eTheta - halfAngTolerance))) {
                // Near theta boundary - check if on surface or outside
                // ... detailed boundary checks ...
                in = kSurface; // or kOutside
            }
        } else {
            if (((fSTheta > 0.0) && (pTheta < fSTheta - halfAngTolerance)) ||
                ((eTheta < pi) && (pTheta > eTheta + halfAngTolerance))) {
                in = kOutside;
            }
        }
    }

    return in;
}
```

**Special Cases**:
- **At origin** (r=0): Inside only if fRmin=0 and full sphere
- **On Z-axis** (x=0, y=0): Phi is undefined, special handling
- **Tolerance bands**: Separate checks for inside, surface, and outside

**Example**:
```cpp
G4Sphere* sphere = new G4Sphere("Sphere", 5*cm, 10*cm, 0, CLHEP::twopi,
                                0, CLHEP::pi);

G4ThreeVector p1(0, 0, 0);          // Origin: outside (r < rMin)
G4ThreeVector p2(7*cm, 0, 0);       // Inside (5 < r=7 < 10)
G4ThreeVector p3(10*cm, 0, 0);      // On outer surface (r = 10)
G4ThreeVector p4(3*cm, 0, 0);       // Outside (r=3 < rMin)

EInside result = sphere->Inside(p2);  // result = kInside
```

## Surface Normal

### SurfaceNormal()

**Signature**: `G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Sphere.cc:372-493`

Returns the outward unit normal vector at or near a surface point.

**Algorithm**:
```cpp
G4ThreeVector G4Sphere::SurfaceNormal(const G4ThreeVector& p) const {
    G4int noSurfaces = 0;
    G4ThreeVector sumnorm(0, 0, 0);

    G4double rho2 = p.x()*p.x() + p.y()*p.y();
    G4double radius = std::sqrt(rho2 + p.z()*p.z());
    G4double rho = std::sqrt(rho2);

    // Calculate distances to each type of surface
    G4double distRMax = std::fabs(radius - fRmax);
    G4double distRMin = (fRmin != 0.0) ? std::fabs(radius - fRmin) : kInfinity;

    // Radial normal (outward from origin)
    G4ThreeVector nR;
    if (radius != 0.0) {
        nR = G4ThreeVector(p.x()/radius, p.y()/radius, p.z()/radius);
    }

    // Accumulate normals from all surfaces within tolerance
    if (distRMax <= halfCarTolerance) {
        ++noSurfaces;
        sumnorm += nR;  // Outer surface: radial outward
    }
    if ((fRmin != 0.0) && (distRMin <= halfCarTolerance)) {
        ++noSurfaces;
        sumnorm -= nR;  // Inner surface: radial inward
    }

    // Phi plane normals (if segmented)
    if (!fFullPhiSphere) {
        G4double pPhi = std::atan2(p.y(), p.x());
        // ... calculate phi distances ...

        G4ThreeVector nPs(sinSPhi, -cosSPhi, 0);  // Start phi normal
        G4ThreeVector nPe(-sinEPhi, cosEPhi, 0);  // End phi normal

        if (distSPhi <= halfAngTolerance) {
            ++noSurfaces;
            sumnorm += nPs;
        }
        if (distEPhi <= halfAngTolerance) {
            ++noSurfaces;
            sumnorm += nPe;
        }
    }

    // Theta cone normals (if segmented)
    if (!fFullThetaSphere) {
        G4double pTheta = std::atan2(rho, p.z());
        // ... calculate theta distances ...

        // Normal to start theta cone
        G4ThreeVector nTs(-cosSTheta*p.x()/rho,
                          -cosSTheta*p.y()/rho,
                           sinSTheta);

        // Normal to end theta cone
        G4ThreeVector nTe( cosETheta*p.x()/rho,
                           cosETheta*p.y()/rho,
                          -sinETheta);

        if ((distSTheta <= halfAngTolerance) && (fSTheta > 0.)) {
            ++noSurfaces;
            sumnorm += nTs;
        }
        if ((distETheta <= halfAngTolerance) && (eTheta < pi)) {
            ++noSurfaces;
            sumnorm += nTe;
        }
    }

    // Return normalized normal
    if (noSurfaces == 0) {
        return ApproxSurfaceNormal(p);  // Point not on surface
    } else if (noSurfaces == 1) {
        return sumnorm;  // Already unit vector
    } else {
        return sumnorm.unit();  // On edge: normalize sum
    }
}
```

**Surface Normal Components**:
- **Radial surfaces**: Normal points from/toward origin: ±(px, py, pz)/r
- **Phi planes**: Normal perpendicular to plane: (sin φ, -cos φ, 0) or (-sin φ, cos φ, 0)
- **Theta cones**: Normal perpendicular to cone surface, has both radial and Z components

**Example**:
```cpp
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm, 0, CLHEP::twopi,
                                0, CLHEP::pi);

// Point on outer surface at +X
G4ThreeVector p1(10*cm, 0, 0);
G4ThreeVector n1 = sphere->SurfaceNormal(p1);  // n1 = (1, 0, 0)

// Point on outer surface at +Z
G4ThreeVector p2(0, 0, 10*cm);
G4ThreeVector n2 = sphere->SurfaceNormal(p2);  // n2 = (0, 0, 1)
```

## Distance Calculations

### DistanceToIn(p, v) - Ray Intersection

**Signature**:
```cpp
G4double DistanceToIn(const G4ThreeVector& p,
                      const G4ThreeVector& v) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Sphere.cc:674-800+`

Calculates distance along ray from outside point to first intersection.

**Algorithm Overview**:

1. **Outer sphere intersection**:
   ```
   Ray: P(t) = p + t×v
   Sphere: x² + y² + z² = R²

   Substituting:
   (p + t×v)·(p + t×v) = R²
   rad² + 2t×(p·v) + t² = R²

   Quadratic: t² + 2(p·v)t + (rad² - R²) = 0
   Solution: t = -(p·v) ± √[(p·v)² - (rad² - R²)]
   ```

2. **Inner sphere intersection** (if hollow):
   - Want second root (far intersection from outside)
   - Check validity

3. **Phi plane intersections** (if segmented):
   - Intersect with two half-planes at phi boundaries
   - Check that intersection is within radial and theta bounds

4. **Theta cone intersections** (if segmented):
   - Intersect with two cones at theta boundaries
   - Cone equation: x² + y² = (z × tan θ)²
   - Check validity within radial and phi bounds

**Optimization Techniques**:
- **Long distance splitting**: For sd > 100×fRmax, splits ray to avoid precision loss
- **CosPsi test**: Fast phi check using dot product
- **Cached trigonometry**: Extensive pre-computed values

**Performance**: Most complex of the basic CSG solids due to:
- Spherical coordinate transformations (atan2)
- Both phi and theta boundary checks
- Cone intersection calculations for theta

### DistanceToIn(p) - Safety Distance

**Signature**: `G4double DistanceToIn(const G4ThreeVector& p) const override`

Calculates safety distance from outside point to nearest surface.

**Algorithm**: Computes minimum of:
- Distance to outer sphere surface
- Distance to inner sphere surface
- Distance to phi planes (if segmented)
- Distance to theta cones (if segmented)

### DistanceToOut(p, v, ...) - Exit Distance

**Signature**:
```cpp
G4double DistanceToOut(const G4ThreeVector& p,
                       const G4ThreeVector& v,
                       const G4bool calcNorm = false,
                       G4bool* validNorm = nullptr,
                       G4ThreeVector* n = nullptr) const override;
```

Calculates distance from inside point to exit surface.

**Algorithm**: Similar to DistanceToIn but:
- Checks if already on surface and exiting
- Computes normals with proper directionality
- Inner surface normals marked as invalid (concave)
- Theta cone surface normals validity depends on geometry

### DistanceToOut(p) - Safety Distance from Inside

**Signature**: `G4double DistanceToOut(const G4ThreeVector& p) const override`

Calculates exact perpendicular distance from inside point to nearest surface.

**Algorithm**: Computes minimum of:
- Distance to outer sphere: fRmax - radius
- Distance to inner sphere: radius - fRmin
- Distance to phi planes
- Distance to theta cones

## Performance Characteristics

### Computational Complexity

| Operation | Complexity | Typical CPU Instructions | Notes |
|-----------|------------|-------------------------|--------|
| **Inside()** | O(1) | ~50-80 | sqrt, atan2 (twice) |
| **SurfaceNormal()** | O(1) | ~80-120 | sqrt, atan2, extensive trig |
| **DistanceToIn(p,v)** | O(1) | ~200-400 | Most complex CSG primitive |
| **DistanceToIn(p)** | O(1) | ~40-60 | Multiple distance calculations |
| **DistanceToOut(p,v)** | O(1) | ~180-350 | Similar to DistanceToIn |
| **DistanceToOut(p)** | O(1) | ~40-60 | Distance calculations |
| **GetCubicVolume()** | O(1) | ~15 | Cached, includes trig |
| **GetSurfaceArea()** | O(1) | ~20 | Cached, complex formula |

### Memory Footprint

```cpp
sizeof(G4Sphere) ≈ base + 32*sizeof(G4double) + 3*sizeof(G4bool)
                 ≈ ~120 + 256 + 3 ≈ 379 bytes
```

**Member Data**:
- Dimensions: 6 doubles (fRmin, fRmax, fSPhi, fDPhi, fSTheta, fDTheta)
- Tolerances: 5 doubles (fRminTolerance, fRmaxTolerance, etc.)
- Phi trig cache: 10 doubles (sinCPhi, cosCPhi, etc.)
- Theta trig cache: 11 doubles (sinSTheta, cosSTheta, tanSTheta, etc.)
- Flags: 3 bools (fFullPhiSphere, fFullThetaSphere, fFullSphere)

### Performance Comparison

Relative performance (G4Box = 1.0):

| Operation | G4Box | G4Tubs | G4Cons | G4Sphere | Notes |
|-----------|-------|--------|--------|----------|-------|
| Inside() | 1.0× | 2.5× | 3.5× | 4.5× | Two atan2 calls |
| DistanceToIn(p,v) | 1.0× | 3.0× | 4.5× | 6.0× | Most complex geometry |
| DistanceToOut(p,v) | 1.0× | 3.5× | 5.0× | 6.5× | Complex surface checks |

**Why slowest of basic CSG**:
- Two angle coordinates (phi and theta) to check
- Spherical coordinate transformations expensive
- Cone intersection calculations for theta
- Most extensive trigonometric caching needed

## Usage Examples

### Example 1: Full Solid Sphere

```cpp
// Simple solid sphere for particle source
G4double radius = 5*cm;

G4Sphere* sphere = new G4Sphere("Source",
                                0,             // Solid (no hole)
                                radius,
                                0, CLHEP::twopi,
                                0, CLHEP::pi);

G4Material* water = nist->FindOrBuildMaterial("G4_WATER");
G4LogicalVolume* sphereLV = new G4LogicalVolume(sphere, water, "Source");
```

### Example 2: Hollow Spherical Shell

```cpp
// Spherical detector shell
G4Sphere* shell = new G4Sphere("DetectorShell",
                               95*cm,         // Inner radius
                               100*cm,        // Outer radius (5cm thick)
                               0, CLHEP::twopi,
                               0, CLHEP::pi);

G4Material* aluminum = nist->FindOrBuildMaterial("G4_Al");
G4LogicalVolume* shellLV = new G4LogicalVolume(shell, aluminum, "DetectorShell");
```

### Example 3: Hemisphere

```cpp
// Northern hemisphere calorimeter
G4Sphere* hemisphere = new G4Sphere("HemiCal",
                                    10*cm,    // Inner radius
                                    50*cm,    // Outer radius
                                    0, CLHEP::twopi,
                                    0,                 // Start at +Z axis
                                    CLHEP::halfpi);    // 90° coverage to equator

G4Material* pbwo4 = nist->FindOrBuildMaterial("G4_PbWO4");
G4LogicalVolume* hemiLV = new G4LogicalVolume(hemisphere, pbwo4, "HemiCal");
```

### Example 4: Spherical Wedge

```cpp
// 45° phi wedge of sphere
G4Sphere* wedge = new G4Sphere("Wedge",
                               0, 20*cm,
                               0*deg,            // Start phi
                               45*deg,           // Delta phi = 45°
                               0, CLHEP::pi);

// Place multiple wedges to form segmented detector
for (G4int i = 0; i < 8; i++) {
    G4RotationMatrix* rot = new G4RotationMatrix();
    rot->rotateZ(i * 45*deg);
    new G4PVPlacement(rot, G4ThreeVector(), wedgeLV,
                     "Wedge", motherLV, false, i);
}
```

### Example 5: Spherical Band (Theta Segment)

```cpp
// Equatorial band: theta from 60° to 120°
G4Sphere* band = new G4Sphere("EquatorialBand",
                              30*cm, 35*cm,      // Radii
                              0, CLHEP::twopi,   // Full phi
                              60*deg,            // Start theta
                              60*deg);           // Delta theta = 60°

G4cout << "Band covers theta from 60° to 120°" << G4endl;
G4cout << "This is ±30° around the equator" << G4endl;
```

### Example 6: Spherical Cap

```cpp
// Polar cap: top 30° of sphere
G4Sphere* cap = new G4Sphere("PolarCap",
                             0, 15*cm,
                             0, CLHEP::twopi,
                             0,                  // Start at north pole
                             30*deg);            // 30° coverage

// Calculate cap height
G4double theta = 30*deg;
G4double height = cap->GetOuterRadius() * (1 - std::cos(theta));
G4cout << "Cap height: " << height/cm << " cm" << G4endl;
```

### Example 7: Complex Segmented Sphere

```cpp
// Sphere divided into phi and theta segments
G4int nPhi = 12;      // 12 phi divisions
G4int nTheta = 6;     // 6 theta divisions
G4double dPhi = CLHEP::twopi / nPhi;
G4double dTheta = CLHEP::pi / nTheta;

G4Sphere* segment = new G4Sphere("Segment",
                                 18*cm, 20*cm,
                                 0, dPhi,        // One phi segment
                                 0, dTheta);     // One theta segment

G4LogicalVolume* segmentLV = new G4LogicalVolume(
    segment, material, "Segment"
);

// Place all segments
for (G4int iPhi = 0; iPhi < nPhi; iPhi++) {
    for (G4int iTheta = 0; iTheta < nTheta; iTheta++) {
        G4RotationMatrix* rot = new G4RotationMatrix();
        rot->rotateZ(iPhi * dPhi);
        rot->rotateY(iTheta * dTheta);

        G4int copyNo = iPhi * nTheta + iTheta;
        new G4PVPlacement(rot, G4ThreeVector(), segmentLV,
                         "Segment", motherLV, false, copyNo);
    }
}
```

### Example 8: Calculating Solid Angle

```cpp
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm,
                                0*deg, 90*deg,      // Phi: 0-90°
                                30*deg, 60*deg);    // Theta: 30-90°

// Solid angle = ∫∫ sin(θ) dθ dφ
G4double dPhi = sphere->GetDeltaPhiAngle();
G4double sTheta = sphere->GetStartThetaAngle();
G4double eTheta = sTheta + sphere->GetDeltaThetaAngle();

G4double solidAngle = dPhi * (std::cos(sTheta) - std::cos(eTheta));
G4cout << "Solid angle: " << solidAngle << " steradians" << G4endl;
G4cout << "Fraction of 4π: " << solidAngle/(4*CLHEP::pi) << G4endl;
```

## Common Pitfalls

### Pitfall 1: Theta Range Confusion

```cpp
// WRONG - thinking theta=0 is at equator
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm,
                                0, CLHEP::twopi,
                                0,                  // This is +Z (north pole)!
                                CLHEP::halfpi);     // Goes down to equator

// Remember: theta = 0 is +Z axis, theta = π is -Z axis
// For southern hemisphere:
G4Sphere* southHemi = new G4Sphere("South", 0, 10*cm,
                                   0, CLHEP::twopi,
                                   CLHEP::halfpi,   // Start at equator
                                   CLHEP::halfpi);  // Go to -Z axis
```

### Pitfall 2: Invalid Theta Range

```cpp
// WRONG - theta outside [0, π]
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm,
                                0, CLHEP::twopi,
                                -30*deg,           // Negative theta!
                                90*deg);
// FatalException: sTheta outside 0-PI range

// CORRECT - theta must be in [0, π]
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm,
                                0, CLHEP::twopi,
                                0*deg,
                                90*deg);
```

### Pitfall 3: Using G4Sphere When G4Orb Would Suffice

```cpp
// INEFFICIENT - full solid sphere with G4Sphere
G4Sphere* sphere = new G4Sphere("Sphere", 0, 10*cm,
                                0, CLHEP::twopi,
                                0, CLHEP::pi);

// MORE EFFICIENT - use G4Orb for full solid sphere
G4Orb* orb = new G4Orb("Orb", 10*cm);
// G4Orb is optimized for full spheres (no angle checks)
```

### Pitfall 4: Forgetting Phi Wrapping

```cpp
// Be careful with phi angles across 0/2π boundary
G4Sphere* sector = new G4Sphere("Sector", 0, 10*cm,
                                350*deg,    // Start near 2π
                                30*deg,     // Wraps to 20°
                                0, CLHEP::pi);
// This creates a valid 30° sector from 350° to 20°
```

### Pitfall 5: Radial Tolerance Issues

```cpp
// WRONG - outer radius too small
G4Sphere* sphere = new G4Sphere("Sphere", 0, 1e-5*mm,  // 10 nm!
                                0, CLHEP::twopi,
                                0, CLHEP::pi);
// May fail: pRmax < 1.1*kRadTolerance

// CORRECT - ensure reasonable size relative to tolerance
G4double kRadTol = G4GeometryTolerance::GetInstance()->GetRadialTolerance();
G4double minRadius = 2 * kRadTol;  // Safe minimum
```

### Pitfall 6: Origin Issues with Hollow Sphere

```cpp
G4Sphere* hollow = new G4Sphere("Hollow", 5*cm, 10*cm,
                                0, CLHEP::twopi,
                                0, CLHEP::pi);

G4ThreeVector origin(0, 0, 0);
EInside result = hollow->Inside(origin);
// result = kOutside (origin is in the hollow region!)
```

### Pitfall 7: Theta Segment Placement

```cpp
// Creating a "ring" around equator
G4Sphere* ring = new G4Sphere("Ring", 10*cm, 12*cm,
                              0, CLHEP::twopi,
                              75*deg,         // Start theta
                              30*deg);        // Delta theta

// This creates a band from θ=75° to θ=105°
// Centered around θ=90° (equator), extending ±15°
```

## Best Practices

### 1. Choose the Right Solid Type

```cpp
// For full solid sphere: use G4Orb (simpler, faster)
if (rMin == 0 && fullPhi && fullTheta) {
    G4Orb* orb = new G4Orb("Sphere", radius);
}
// For spherical shells or segments: use G4Sphere
else {
    G4Sphere* sphere = new G4Sphere("Sphere", rMin, rMax,
                                    sPhi, dPhi, sTheta, dTheta);
}
```

### 2. Document Angle Conventions

```cpp
// Good: clear documentation of angles
G4Sphere* hemisphere = new G4Sphere(
    "NorthernHemi",
    10*cm, 20*cm,
    0, CLHEP::twopi,    // Full azimuthal coverage
    0,                  // θ=0: starts at +Z axis (north pole)
    CLHEP::halfpi       // Δθ=π/2: extends to equator (θ=π/2)
);
G4cout << "Covers northern hemisphere: Z ≥ 0" << G4endl;
```

### 3. Validate Geometric Parameters

```cpp
// Helper to validate sphere parameters
void ValidateSphereParams(G4double rMin, G4double rMax,
                         G4double sTheta, G4double dTheta) {
    if (rMin >= rMax) {
        G4cerr << "ERROR: rMin >= rMax" << G4endl;
    }
    if (sTheta < 0 || sTheta > CLHEP::pi) {
        G4cerr << "ERROR: sTheta not in [0, π]" << G4endl;
    }
    if (sTheta + dTheta > CLHEP::pi) {
        G4cerr << "WARNING: sTheta + dTheta > π, will be clamped" << G4endl;
    }
}
```

### 4. Use Helper Functions for Solid Angle

```cpp
// Calculate solid angle covered by sphere segment
G4double SolidAngle(const G4Sphere* sphere) {
    G4double dPhi = sphere->GetDeltaPhiAngle();
    G4double cosStart = sphere->GetCosStartTheta();
    G4double cosEnd = sphere->GetCosEndTheta();
    return dPhi * (cosStart - cosEnd);
}

// Fraction of full sphere
G4double fraction = SolidAngle(sphere) / (4*CLHEP::pi);
```

### 5. Consider Symmetry for Segmentation

```cpp
// Symmetric theta segmentation around equator
G4int nBands = 6;
G4double dTheta = CLHEP::pi / nBands;

for (G4int i = 0; i < nBands; i++) {
    G4double sTheta = i * dTheta;
    G4Sphere* band = new G4Sphere("Band", r1, r2,
                                  0, CLHEP::twopi,
                                  sTheta, dTheta);
    // ... place band ...
}
```

## See Also

- [G4VSolid](g4vsolid.md) - Base class for all solids
- [G4Box](g4box.md) - Rectangular box (simplest solid)
- [G4Tubs](g4tubs.md) - Cylindrical solid
- [G4Cons](g4cons.md) - Conical section
- [G4Orb](g4orb.md) - Full solid sphere (simpler than G4Sphere)
- [G4Ellipsoid](g4ellipsoid.md) - Ellipsoidal solid
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/solids/CSG/include/G4Sphere.hh`
- Implementation: `source/geometry/solids/CSG/src/G4Sphere.cc`
- Inline: `source/geometry/solids/CSG/include/G4Sphere.icc`

### Related Classes
- `G4SolidStore` - Global registry of all solids
- `G4CSGSolid` - Base class for CSG primitives
- `G4BoundingEnvelope` - Extent calculation helper
- `G4PolyhedronSphere` - Visualization polyhedron

### Key Algorithms
- **Spherical Coordinate System**: (r, θ, φ) where θ ∈ [0,π], φ ∈ [0,2π)
- **Ray-Sphere Intersection**: Solving (p + t×v)² = R²
- **Theta Cone Intersection**: Particles crossing conical surfaces at constant θ
- **Solid Angle Calculation**: Ω = ∫∫ sin θ dθ dφ

### External Documentation
- [Geant4 User Guide: Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html)
- [Geant4 Class Documentation](http://geant4.kek.jp/Reference/)
- [Spherical Coordinate System](https://en.wikipedia.org/wiki/Spherical_coordinate_system)
- [Ray-Sphere Intersection Mathematics](https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-sphere-intersection)
