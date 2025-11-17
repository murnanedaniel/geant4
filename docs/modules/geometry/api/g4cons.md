# G4Cons

**Base Class**: G4CSGSolid (extends [G4VSolid](g4vsolid.md))
**Location**: `source/geometry/solids/CSG/include/G4Cons.hh`
**Source**: `source/geometry/solids/CSG/src/G4Cons.cc`
**Inline**: `source/geometry/solids/CSG/include/G4Cons.icc`

## Overview

G4Cons represents a conical section or truncated cone with optional phi segmentation. It is a fundamental CSG (Constructive Solid Geometry) primitive in Geant4, used extensively for detector components with tapered geometry such as endcap detectors, collimators, funnels, and transition pieces between different-sized components.

The cone is defined by inner and outer radii at both ends (at -fDz and +fDz), half-length along Z, and optional phi segmentation. The radii can vary linearly along Z, creating a tapered or conical geometry. When inner and outer radii are equal at both ends, G4Cons reduces to a cylindrical tube (though [G4Tubs](g4tubs.md) is more efficient for this case).

G4Cons is centered at the origin of its local coordinate system along the Z-axis and provides efficient algorithms for tracking particles through conical surfaces.

## Key Features

- **Tapered Geometry**: Different radii at each end for conical shapes
- **Hollow or Solid**: Inner radii can be zero for solid cone/truncated cone
- **Phi Segmentation**: Supports partial phi coverage (cone sectors)
- **Linearly Varying Radius**: Smooth transition from one radius to another
- **Analytical Solutions**: Quadratic equations for conical surface intersections
- **Cached Trigonometry**: Pre-computed sin/cos values for efficiency
- **Complex Surface Normals**: Handles both radial and axial components for cone surfaces
- **Common Detector Shape**: Used for endcaps, collimators, and transition pieces

## Class Definition

```cpp
class G4Cons : public G4CSGSolid
{
  public:
    // Constructor
    G4Cons(const G4String& pName,
           G4double pRmin1, G4double pRmax1,
           G4double pRmin2, G4double pRmax2,
           G4double pDz,
           G4double pSPhi, G4double pDPhi);

    // Destructor
    ~G4Cons() override;

    // Dimension accessors (inline)
    G4double GetInnerRadiusMinusZ() const;  // fRmin1
    G4double GetOuterRadiusMinusZ() const;  // fRmax1
    G4double GetInnerRadiusPlusZ() const;   // fRmin2
    G4double GetOuterRadiusPlusZ() const;   // fRmax2
    G4double GetZHalfLength() const;
    G4double GetStartPhiAngle() const;
    G4double GetDeltaPhiAngle() const;
    G4double GetSinStartPhi() const;
    G4double GetCosStartPhi() const;
    G4double GetSinEndPhi() const;
    G4double GetCosEndPhi() const;

    // Dimension modifiers (inline)
    void SetInnerRadiusMinusZ(G4double Rmin1);
    void SetOuterRadiusMinusZ(G4double Rmax1);
    void SetInnerRadiusPlusZ(G4double Rmin2);
    void SetOuterRadiusPlusZ(G4double Rmax2);
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

  private:
    // Initialization helpers
    void Initialize();
    void InitializeTrigonometry();
    void CheckSPhiAngle(G4double sPhi);
    void CheckDPhiAngle(G4double dPhi);
    void CheckPhiAngles(G4double sPhi, G4double dPhi);

    // Approximate surface normal for off-surface points
    G4ThreeVector ApproxSurfaceNormal(const G4ThreeVector& p) const;

    // Member data
    G4double kRadTolerance, kAngTolerance;       // Tolerances
    G4double fRmin1, fRmin2, fRmax1, fRmax2;   // Radii at -dz and +dz
    G4double fDz;                                // Half-length in Z
    G4double fSPhi, fDPhi;                       // Phi segment angles

    // Cached trigonometric values
    G4double sinCPhi, cosCPhi;                   // Center phi
    G4double cosHDPhi, cosHDPhiOT, cosHDPhiIT;  // Half delta phi
    G4double sinSPhi, cosSPhi;                   // Start phi
    G4double sinEPhi, cosEPhi;                   // End phi

    G4bool fPhiFullCone;                         // Full phi coverage flag
    G4double halfCarTolerance, halfRadTolerance, halfAngTolerance;
};
```

## Constructor and Destructor

### Constructor

**Signature**:
```cpp
G4Cons(const G4String& pName,
       G4double pRmin1, G4double pRmax1,
       G4double pRmin2, G4double pRmax2,
       G4double pDz,
       G4double pSPhi, G4double pDPhi);
```
**Line**: `source/geometry/solids/CSG/src/G4Cons.cc:77-120`

Creates a conical section with specified dimensions.

**Parameters**:
- `pName` - Name for this solid (used in G4SolidStore)
- `pRmin1` - Inner radius at -fDz (must be ≥ 0)
- `pRmax1` - Outer radius at -fDz (must be > pRmin1)
- `pRmin2` - Inner radius at +fDz (must be ≥ 0)
- `pRmax2` - Outer radius at +fDz (must be > pRmin2)
- `pDz` - Half-length along Z axis (must be > 0)
- `pSPhi` - Starting phi angle (radians; 0 = +X axis, π/2 = +Y axis)
- `pDPhi` - Delta phi angle (radians; 2π for full cone)

**Geometry Conventions**:
- Radii are specified at the two Z endpoints:
  - At z = -fDz: inner radius = pRmin1, outer radius = pRmax1
  - At z = +fDz: inner radius = pRmin2, outer radius = pRmax2
- Radius varies linearly with Z between the endpoints
- The cone tapers if pRmax1 ≠ pRmax2 or pRmin1 ≠ pRmin2

**Validation**:
```cpp
// Lines 94-113
if (pDz < 0) {
    G4Exception("G4Cons::G4Cons()", "GeomSolids0002",
                FatalException, "Negative Z half-length");
}
if (((pRmin1 >= pRmax1) || (pRmin2 >= pRmax2) ||
     (pRmin1 < 0)) && (pRmin2 < 0)) {
    G4Exception("G4Cons::G4Cons()", "GeomSolids0002",
                FatalException, "Invalid radii");
}

// Special handling for zero inner radius at one end
if ((pRmin1 == 0.0) && (pRmin2 > 0.0)) { fRmin1 = 1e3*kRadTolerance; }
if ((pRmin2 == 0.0) && (pRmin1 > 0.0)) { fRmin2 = 1e3*kRadTolerance; }
```

**Special Case**: If one inner radius is zero and the other is non-zero, the zero radius is set to a small value (1000×radial tolerance) to avoid numerical issues with cone apex.

**Actions**:
1. Calls `G4CSGSolid(pName)` constructor
2. Sets dimensions: `fRmin1`, `fRmax1`, `fRmin2`, `fRmax2`, `fDz`
3. Validates and normalizes phi angles via `CheckPhiAngles()`
4. Computes cached trigonometric values
5. Sets `fPhiFullCone` flag

**Example**:
```cpp
// Truncated cone: larger radius at -Z, smaller at +Z
G4Cons* cone = new G4Cons("EndcapCone",
                          0.0,      // Inner radius at -dz = 0 (solid)
                          50*cm,    // Outer radius at -dz = 50cm
                          0.0,      // Inner radius at +dz = 0 (solid)
                          30*cm,    // Outer radius at +dz = 30cm
                          40*cm,    // Half-length Z = 40cm
                          0,        // Start phi = 0
                          CLHEP::twopi);  // Full phi coverage

// Hollow tapered tube
G4Cons* tube = new G4Cons("TaperedTube",
                          10*cm,    // Inner radius at -dz = 10cm
                          15*cm,    // Outer radius at -dz = 15cm
                          5*cm,     // Inner radius at +dz = 5cm
                          8*cm,     // Outer radius at +dz = 8cm
                          25*cm,    // Half-length Z = 25cm
                          0, CLHEP::twopi);

// Cone sector (90° wedge)
G4Cons* sector = new G4Cons("ConeSector",
                            8*cm, 12*cm,  // Radii at -dz
                            6*cm, 10*cm,  // Radii at +dz
                            20*cm,        // Half-length Z
                            0,            // Start phi = 0
                            CLHEP::halfpi);  // 90° sector
```

### Destructor

**Signature**: `~G4Cons() override`
**Line**: `source/geometry/solids/CSG/src/G4Cons.cc:136`

**Implementation**: `= default` (compiler-generated)

Trivial destructor - no dynamically allocated memory to clean up.

## Dimension Accessors and Modifiers

### Accessors (Inline)

**Signatures** (Lines `G4Cons.icc:30-93`):
```cpp
inline G4double GetInnerRadiusMinusZ() const;  // Returns fRmin1
inline G4double GetOuterRadiusMinusZ() const;  // Returns fRmax1
inline G4double GetInnerRadiusPlusZ() const;   // Returns fRmin2
inline G4double GetOuterRadiusPlusZ() const;   // Returns fRmax2
inline G4double GetZHalfLength() const;        // Returns fDz
inline G4double GetStartPhiAngle() const;      // Returns fSPhi
inline G4double GetDeltaPhiAngle() const;      // Returns fDPhi
inline G4double GetSinStartPhi() const;        // Returns cached sinSPhi
inline G4double GetCosStartPhi() const;        // Returns cached cosSPhi
inline G4double GetSinEndPhi() const;          // Returns cached sinEPhi
inline G4double GetCosEndPhi() const;          // Returns cached cosEPhi
```

**Naming Convention**:
- "MinusZ" refers to the z = -fDz end
- "PlusZ" refers to the z = +fDz end

**Performance**: Zero overhead - direct member access, fully inlined

**Example**:
```cpp
G4Cons* cone = new G4Cons("Cone", 0, 50*cm, 0, 30*cm, 40*cm, 0, CLHEP::twopi);

G4double r1 = cone->GetOuterRadiusMinusZ();  // 50 cm (at z=-40cm)
G4double r2 = cone->GetOuterRadiusPlusZ();   // 30 cm (at z=+40cm)
G4double length = 2 * cone->GetZHalfLength(); // 80 cm

// Calculate taper angle
G4double tanTheta = (r1 - r2) / (2 * cone->GetZHalfLength());
G4double thetaDeg = std::atan(tanTheta) * 180.0 / CLHEP::pi;
G4cout << "Cone taper angle: " << thetaDeg << " degrees" << G4endl;
```

### Modifiers (Inline)

**Signatures** (Lines `G4Cons.icc:174-224`):
```cpp
void SetInnerRadiusMinusZ(G4double Rmin1);
void SetOuterRadiusMinusZ(G4double Rmax1);
void SetInnerRadiusPlusZ(G4double Rmin2);
void SetOuterRadiusPlusZ(G4double Rmax2);
void SetZHalfLength(G4double newDz);
void SetStartPhiAngle(G4double newSPhi, G4bool trig=true);
void SetDeltaPhiAngle(G4double newDPhi);
```

**Side Effects**:
1. Updates dimension
2. Calls `Initialize()` which:
   - Invalidates cached volume and surface area
   - Sets polyhedron rebuild flag

**Warning**: Should only be called during geometry construction, NOT during simulation!

## Volume and Surface Area

### GetCubicVolume()

**Signature**: `inline G4double GetCubicVolume() override`
**Line**: `source/geometry/solids/CSG/include/G4Cons.icc:227-243`

Returns the volume in mm³ with lazy evaluation and caching.

**Formula**:
```
V = fDPhi × fDz × [(Rmean² - rmean²) + (ΔR² - Δr²)/12]
```
where:
- Rmean = (fRmax1 + fRmax2) / 2
- rmean = (fRmin1 + fRmin2) / 2
- ΔR = fRmax1 - fRmax2
- Δr = fRmin1 - fRmin2

**Derivation**: This formula accounts for the variation of radius along Z using a truncated cone volume formula.

**Implementation**:
```cpp
inline G4double G4Cons::GetCubicVolume() {
    if (fCubicVolume != 0.) {;}
    else {
        G4double Rmean = 0.5*(fRmax1 + fRmax2);
        G4double deltaR = fRmax1 - fRmax2;
        G4double rMean = 0.5*(fRmin1 + fRmin2);
        G4double deltar = fRmin1 - fRmin2;
        fCubicVolume = fDPhi*fDz*(Rmean*Rmean - rMean*rMean
                                + (deltaR*deltaR - deltar*deltar)/12);
    }
    return fCubicVolume;
}
```

**Example**:
```cpp
G4Cons* cone = new G4Cons("Cone", 0, 50*cm, 0, 30*cm, 40*cm, 0, CLHEP::twopi);
G4double volume = cone->GetCubicVolume();
// volume ≈ 461,814 cm³ for a truncated cone
```

### GetSurfaceArea()

**Signature**: `inline G4double GetSurfaceArea() override`
**Line**: `source/geometry/solids/CSG/include/G4Cons.icc:246-268`

Returns the surface area in mm² with lazy evaluation and caching.

**Formula**:
```
A = fDPhi × [mmin × √(dmin² + 4×fDz²) + mmax × √(dmax² + 4×fDz²)
           + 0.5×(fRmax1² - fRmin1² + fRmax2² - fRmin2²)]
    + (if not full cone) 4×fDz×(mmax - mmin)
```
where:
- mmin = (fRmin1 + fRmin2) / 2
- mmax = (fRmax1 + fRmax2) / 2
- dmin = fRmin2 - fRmin1
- dmax = fRmax2 - fRmax1

**Components**:
- Inner conical surface: accounts for slant height
- Outer conical surface: accounts for slant height
- Top and bottom rings: area difference
- Phi-cut faces (if not full cone): rectangular sections

**Example**:
```cpp
G4Cons* cone = new G4Cons("Cone", 10*cm, 15*cm, 5*cm, 10*cm, 20*cm,
                          0, CLHEP::halfpi);
G4double area = cone->GetSurfaceArea();
// Includes conical surfaces, rings, and two phi-cut faces
```

## Bounding Volume Methods

### BoundingLimits()

**Signature**:
```cpp
void BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Cons.cc:247-284`

Returns the axis-aligned bounding box in local coordinates.

**Algorithm**:
```cpp
void G4Cons::BoundingLimits(G4ThreeVector& pMin, G4ThreeVector& pMax) const {
    // Use maximum radius at either end
    G4double rmin = std::min(GetInnerRadiusMinusZ(), GetInnerRadiusPlusZ());
    G4double rmax = std::max(GetOuterRadiusMinusZ(), GetOuterRadiusPlusZ());
    G4double dz = GetZHalfLength();

    if (GetDeltaPhiAngle() < twopi) {
        // Phi segment: compute actual XY extent
        G4TwoVector vmin, vmax;
        G4GeomTools::DiskExtent(rmin, rmax,
                               GetSinStartPhi(), GetCosStartPhi(),
                               GetSinEndPhi(), GetCosEndPhi(),
                               vmin, vmax);
        pMin.set(vmin.x(), vmin.y(), -dz);
        pMax.set(vmax.x(), vmax.y(),  dz);
    } else {
        // Full cone: simple bounding box
        pMin.set(-rmax, -rmax, -dz);
        pMax.set( rmax,  rmax,  dz);
    }
}
```

**Optimization**: Uses maximum outer radius from either end for XY bounds

### CalculateExtent()

**Line**: `source/geometry/solids/CSG/src/G4Cons.cc:290-397`

Calculates extent along an axis under transformation and voxel limits.

**Algorithm**:
- For full solid cones (fRmin1=0, fRmin2=0, fDPhi=2π): Creates two polygons for top and bottom
- For general cases: Creates sequence of quadrilaterals around phi and along Z
- Uses G4BoundingEnvelope for transformation and clipping
- Adaptively subdivides phi range for accurate transformed bounds

## Point Classification

### Inside()

**Signature**: `EInside Inside(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Cons.cc:181-229`

Determines whether a point is inside, outside, or on the surface.

**Returns**:
- `kInside` - Point is strictly inside
- `kSurface` - Point is on surface (within tolerance)
- `kOutside` - Point is outside

**Algorithm**:
```cpp
EInside G4Cons::Inside(const G4ThreeVector& p) const {
    EInside in;

    // 1. Check Z bounds
    if (std::fabs(p.z()) > fDz + halfCarTolerance) {
        return kOutside;
    } else if (std::fabs(p.z()) >= fDz - halfCarTolerance) {
        in = kSurface;
    } else {
        in = kInside;
    }

    // 2. Calculate radius at this Z position (linear interpolation)
    G4double r2 = p.x()*p.x() + p.y()*p.y();
    G4double rl = 0.5*(fRmin2*(p.z() + fDz) + fRmin1*(fDz - p.z())) / fDz;
    G4double rh = 0.5*(fRmax2*(p.z() + fDz) + fRmax1*(fDz - p.z())) / fDz;

    // 3. Check radial bounds (strict)
    G4double tolRMin = rl - halfRadTolerance;
    if (tolRMin < 0) { tolRMin = 0; }
    G4double tolRMax = rh + halfRadTolerance;

    if ((r2 < tolRMin*tolRMin) || (r2 > tolRMax*tolRMax)) {
        return kOutside;
    }

    // 4. Refine with inner tolerance
    tolRMin = (rl != 0.0) ? rl + halfRadTolerance : 0.0;
    tolRMax = rh - halfRadTolerance;

    if (in == kInside) {
        if ((r2 < tolRMin*tolRMin) || (r2 >= tolRMax*tolRMax)) {
            in = kSurface;
        }
    }

    // 5. Check phi bounds (if sector)
    if (!fPhiFullCone && ((p.x() != 0.0) || (p.y() != 0.0))) {
        G4double pPhi = std::atan2(p.y(), p.x());
        // Normalize phi...
        if ((pPhi < fSPhi - halfAngTolerance) ||
            (pPhi > fSPhi + fDPhi + halfAngTolerance)) {
            return kOutside;
        }

        if (in == kInside) {
            if ((pPhi < fSPhi + halfAngTolerance) ||
                (pPhi > fSPhi + fDPhi - halfAngTolerance)) {
                in = kSurface;
            }
        }
    } else if (!fPhiFullCone) {
        in = kSurface;  // On Z-axis with phi sector
    }

    return in;
}
```

**Key Feature**: Linearly interpolates radius at the point's Z position:
```
r(z) = 0.5 × [r2×(z + dz) + r1×(dz - z)] / dz
```

This accounts for the varying radius along the cone.

**Example**:
```cpp
G4Cons* cone = new G4Cons("Cone", 0, 50*cm, 0, 30*cm, 40*cm, 0, CLHEP::twopi);

G4ThreeVector p1(20*cm, 0, 0);        // At z=0, r=20: inside
G4ThreeVector p2(40*cm, 0, 0);        // At z=0, r=40: on surface
G4ThreeVector p3(25*cm, 0, 20*cm);    // At z=20: check interpolated radius
// At z=20cm, outer radius = 0.5*(30*(20+40) + 50*(40-20))/40 = 37.5cm
// So p3 (r=25) is inside

EInside result = cone->Inside(p3);  // result = kInside
```

## Surface Normal

### SurfaceNormal()

**Signature**: `G4ThreeVector SurfaceNormal(const G4ThreeVector& p) const override`
**Line**: `source/geometry/solids/CSG/src/G4Cons.cc:405-502`

Returns the outward unit normal vector at or near a surface point.

**Algorithm**:
```cpp
G4ThreeVector G4Cons::SurfaceNormal(const G4ThreeVector& p) const {
    G4int noSurfaces = 0;
    G4ThreeVector sumnorm(0, 0, 0);

    G4double rho = std::sqrt(p.x()*p.x() + p.y()*p.y());

    // Calculate cone parameters for radial normals
    G4double tanRMin = (fRmin2 - fRmin1) * 0.5 / fDz;
    G4double secRMin = std::sqrt(1 + tanRMin*tanRMin);
    G4double pRMin = rho - p.z()*tanRMin;
    G4double widRMin = fRmin2 - fDz*tanRMin;
    G4double distRMin = std::fabs(pRMin - widRMin) / secRMin;

    G4double tanRMax = (fRmax2 - fRmax1) * 0.5 / fDz;
    G4double secRMax = std::sqrt(1 + tanRMax*tanRMax);
    G4double pRMax = rho - p.z()*tanRMax;
    G4double widRMax = fRmax2 - fDz*tanRMax;
    G4double distRMax = std::fabs(pRMax - widRMax) / secRMax;

    G4double distZ = std::fabs(std::fabs(p.z()) - fDz);

    // Radial normals for conical surfaces
    G4ThreeVector nR, nr;
    if (rho > halfCarTolerance) {
        nR = G4ThreeVector(p.x()/rho/secRMax, p.y()/rho/secRMax,
                          -tanRMax/secRMax);
        if ((fRmin1 != 0.0) || (fRmin2 != 0.0)) {
            nr = G4ThreeVector(-p.x()/rho/secRMin, -p.y()/rho/secRMin,
                               tanRMin/secRMin);
        }
    }

    // Accumulate normals from all surfaces within tolerance
    if (distRMax <= halfCarTolerance) {
        ++noSurfaces;
        sumnorm += nR;
    }
    if (((fRmin1 != 0.0) || (fRmin2 != 0.0)) &&
        (distRMin <= halfCarTolerance)) {
        ++noSurfaces;
        sumnorm += nr;
    }
    // ... similar for phi planes and Z planes ...

    if (noSurfaces == 0) {
        return ApproxSurfaceNormal(p);
    } else if (noSurfaces == 1) {
        return sumnorm;
    } else {
        return sumnorm.unit();
    }
}
```

**Conical Surface Normal Components**:
For a cone with taper angle θ (tan θ = (r2-r1)/(2×dz)):
- Radial component: (px/rho, py/rho) / sec θ
- Axial component: -tan θ / sec θ (outer) or +tan θ / sec θ (inner)

The normal accounts for both the outward radial direction and the tilt due to the cone's taper.

**Example**:
```cpp
G4Cons* cone = new G4Cons("Cone", 0, 50*cm, 0, 30*cm, 40*cm, 0, CLHEP::twopi);

// Point on outer surface at z=0
G4ThreeVector p(40*cm, 0, 0);
G4ThreeVector n = cone->SurfaceNormal(p);
// n has both radial (X) and axial (Z) components due to cone taper
```

## Distance Calculations

### DistanceToIn(p, v) - Ray Intersection

**Signature**:
```cpp
G4double DistanceToIn(const G4ThreeVector& p,
                      const G4ThreeVector& v) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Cons.cc:647-1065` (approximate)

Calculates distance along ray from outside point to first intersection.

**Algorithm Overview**:

1. **Z-plane intersection** (similar to G4Tubs):
   - Check if ray hits ±Z faces
   - Validate that hit point is within radial and phi bounds at that Z

2. **Outer cone intersection**:
   - Solve: (p + t×v) · (p + t×v) = (tanRMax × z + rMaxAv)²
   - This is a quadratic equation in t
   - Check that intersection point is within Z and phi bounds

3. **Inner cone intersection** (if hollow):
   - Similar to outer cone
   - Want second root (far intersection from outside)
   - Check validity

4. **Phi plane intersections** (if sector):
   - Intersect ray with two half-planes
   - Check that intersection is within radial and Z bounds

**Quadratic Formulation** for conical surface:
```
Ray: P(t) = p + t×v
Cone surface: x² + y² = (a×z + b)²
where a = tanRMax or tanRMin, b = rMaxAv or rMinAv

Expanding:
(vx² + vy² - a²×vz²)×t² + 2t×(px×vx + py×vy - a×vz×(a×pz + b))
                         + px² + py² - (a×pz + b)² = 0
```

**Special Cases**:
- **Shadow cone**: When inner radius increases with Z, creating negative "shadow" cone regions
- **Apex handling**: Small non-zero radius to avoid singularity at cone tip
- **Long distance splitting**: Splits very long rays to avoid precision loss

**Performance**: More complex than G4Tubs due to varying radius

### DistanceToIn(p) - Safety Distance

**Signature**: `G4double DistanceToIn(const G4ThreeVector& p) const override`

Calculates safety distance from outside point to nearest surface.

**Algorithm**: Similar to G4Tubs but uses interpolated radius at point's Z position

### DistanceToOut(p, v, ...) - Exit Distance

**Signature**:
```cpp
G4double DistanceToOut(const G4ThreeVector& p,
                       const G4ThreeVector& v,
                       const G4bool calcNorm = false,
                       G4bool* validNorm = nullptr,
                       G4ThreeVector* n = nullptr) const override;
```
**Line**: `source/geometry/solids/CSG/src/G4Cons.cc` (DistanceToOut implementation)

Calculates distance from inside point to exit surface.

**Algorithm**: Similar structure to DistanceToIn but:
- Checks if already on surface and exiting
- Computes normals with both radial and axial components
- Inner surface normals marked as invalid (concave)

### DistanceToOut(p) - Safety Distance from Inside

**Signature**: `G4double DistanceToOut(const G4ThreeVector& p) const override`

Calculates exact perpendicular distance from inside point to nearest surface.

**Algorithm**: Computes distance to:
- Z planes
- Interpolated inner and outer cone surfaces at point's Z
- Phi planes (if sector)

Returns minimum distance.

## Performance Characteristics

### Computational Complexity

| Operation | Complexity | Typical CPU Instructions | Notes |
|-----------|------------|-------------------------|--------|
| **Inside()** | O(1) | ~40-60 | sqrt, atan2, linear interpolation |
| **SurfaceNormal()** | O(1) | ~60-80 | sqrt, trigonometry for cone |
| **DistanceToIn(p,v)** | O(1) | ~150-300 | Quadratic solver, cone equations |
| **DistanceToIn(p)** | O(1) | ~30-40 | Interpolated distance calculations |
| **DistanceToOut(p,v)** | O(1) | ~120-200 | Similar to DistanceToIn |
| **DistanceToOut(p)** | O(1) | ~30-40 | Distance calculations |
| **GetCubicVolume()** | O(1) | ~10 | Cached after first call |
| **GetSurfaceArea()** | O(1) | ~15 | Cached, includes sqrt |

### Memory Footprint

```cpp
sizeof(G4Cons) ≈ base + 19*sizeof(G4double) + sizeof(G4bool)
               ≈ ~120 + 152 + 1 ≈ 273 bytes
```

**Member Data**:
- Dimensions: 7 doubles (fRmin1, fRmax1, fRmin2, fRmax2, fDz, fSPhi, fDPhi)
- Cached trig: 9 doubles (sinCPhi, cosCPhi, etc.)
- Cached values: 3 doubles (tolerances)
- Flags: 1 bool (fPhiFullCone)

### Performance Comparison

Relative performance (G4Box = 1.0):

| Operation | G4Box | G4Tubs | G4Cons | Notes |
|-----------|-------|--------|--------|-------|
| Inside() | 1.0× | 2.5× | 3.5× | Radius interpolation overhead |
| DistanceToIn(p,v) | 1.0× | 3.0× | 4.5× | Complex cone equations |
| DistanceToOut(p,v) | 1.0× | 3.5× | 5.0× | Most complex geometry |

**Why slower than G4Tubs**:
- Radius varies with Z (requires interpolation)
- More complex quadratic equations for conical surfaces
- Additional calculations for taper angle and secant
- Normal vectors have both radial and axial components

**When to use G4Cons vs G4Tubs**:
- Use G4Cons: When radii differ at the ends (tapered geometry)
- Use G4Tubs: When radii are the same at both ends (cylindrical)

## Usage Examples

### Example 1: Endcap Detector

```cpp
// Electromagnetic calorimeter endcap (truncated cone)
G4double innerRadius1 = 10*cm;
G4double outerRadius1 = 100*cm;
G4double innerRadius2 = 15*cm;
G4double outerRadius2 = 110*cm;
G4double halfLength = 50*cm;

G4Cons* endcap = new G4Cons("EMCalEndcap",
                            innerRadius1, outerRadius1,  // At -Z
                            innerRadius2, outerRadius2,  // At +Z
                            halfLength,
                            0, CLHEP::twopi);

G4Material* pbwo4 = nist->FindOrBuildMaterial("G4_PbWO4");
G4LogicalVolume* endcapLV = new G4LogicalVolume(endcap, pbwo4, "EMCalEndcap");
```

### Example 2: Beam Collimator

```cpp
// Tapered collimator: smaller opening at entrance, larger at exit
G4Cons* collimator = new G4Cons("BeamCollimator",
                                2*mm,      // Inner radius at entrance
                                20*mm,     // Outer radius at entrance
                                5*mm,      // Inner radius at exit
                                20*mm,     // Outer radius at exit (constant outer)
                                100*mm,    // Half-length
                                0, CLHEP::twopi);

G4Material* tungsten = nist->FindOrBuildMaterial("G4_W");
G4LogicalVolume* collimatorLV = new G4LogicalVolume(
    collimator, tungsten, "BeamCollimator"
);
```

### Example 3: Transition Piece

```cpp
// Transition from small tube to large tube
G4Cons* transition = new G4Cons("Transition",
                                3*cm, 5*cm,    // Small end radii
                                8*cm, 10*cm,   // Large end radii
                                15*cm,         // Half-length
                                0, CLHEP::twopi);

G4Material* stainless = nist->FindOrBuildMaterial("G4_STAINLESS-STEEL");
G4LogicalVolume* transitionLV = new G4LogicalVolume(
    transition, stainless, "Transition"
);
```

### Example 4: Funnel-shaped Component

```cpp
// Funnel: solid cone (inner radius = 0)
G4Cons* funnel = new G4Cons("Funnel",
                            0,          // Solid at small end
                            2*cm,       // Small end radius
                            0,          // Solid at large end
                            10*cm,      // Large end radius
                            20*cm,      // Half-length
                            0, CLHEP::twopi);
```

### Example 5: Segmented Cone (Phi Sectors)

```cpp
// Cone divided into 8 phi sectors
G4int nSectors = 8;
G4double dPhi = CLHEP::twopi / nSectors;

G4Cons* sector = new G4Cons("ConeSector",
                            5*cm, 10*cm,   // Radii at -Z
                            3*cm, 8*cm,    // Radii at +Z
                            15*cm,         // Half-length
                            0,             // Start phi (will rotate)
                            dPhi);         // 45° sector

G4LogicalVolume* sectorLV = new G4LogicalVolume(sector, material, "ConeSector");

// Place multiple sectors with rotation
for (G4int i = 0; i < nSectors; i++) {
    G4double phi = i * dPhi;
    G4RotationMatrix* rot = new G4RotationMatrix();
    rot->rotateZ(phi);

    new G4PVPlacement(rot, G4ThreeVector(), sectorLV,
                     "ConeSector", motherLV, false, i, true);
}
```

### Example 6: Calculating Taper Angle

```cpp
G4Cons* cone = new G4Cons("Cone", 0, 50*cm, 0, 30*cm, 40*cm, 0, CLHEP::twopi);

// Calculate half-angle of cone taper
G4double r1 = cone->GetOuterRadiusMinusZ();
G4double r2 = cone->GetOuterRadiusPlusZ();
G4double halfLength = cone->GetZHalfLength();

G4double tanTheta = (r1 - r2) / (2.0 * halfLength);
G4double halfAngle = std::atan(tanTheta) * 180.0 / CLHEP::pi;

G4cout << "Cone half-angle: " << halfAngle << " degrees" << G4endl;
// Output: Cone half-angle: 14.04 degrees

// Verify using geometry
G4double slantHeight = std::sqrt((r1-r2)*(r1-r2) + 4*halfLength*halfLength);
G4cout << "Slant height: " << slantHeight/cm << " cm" << G4endl;
```

### Example 7: Testing Interpolated Radius

```cpp
G4Cons* cone = new G4Cons("Cone", 10*cm, 20*cm, 5*cm, 15*cm, 30*cm,
                          0, CLHEP::twopi);

// Function to calculate expected radius at any Z
auto expectedRadius = [&](G4double z, G4double r1, G4double r2) {
    G4double dz = cone->GetZHalfLength();
    return 0.5 * (r2*(z + dz) + r1*(dz - z)) / dz;
};

// Test at various Z positions
for (G4double z = -30*cm; z <= 30*cm; z += 10*cm) {
    G4double rOuter = expectedRadius(z, 20*cm, 15*cm);
    G4double rInner = expectedRadius(z, 10*cm, 5*cm);

    G4ThreeVector pOuter(rOuter, 0, z);
    G4ThreeVector pInner(rInner, 0, z);

    EInside resultOuter = cone->Inside(pOuter);
    EInside resultInner = cone->Inside(pInner);

    G4cout << "At z=" << z/cm << " cm: "
           << "rOuter=" << rOuter/cm << " cm ("
           << (resultOuter == kSurface ? "surface" : "not surface") << "), "
           << "rInner=" << rInner/cm << " cm ("
           << (resultInner == kSurface ? "surface" : "not surface") << ")"
           << G4endl;
}
```

## Common Pitfalls

### Pitfall 1: Confusing Radius Endpoints

```cpp
// WRONG - thinking parameters are ordered differently
G4Cons* cone = new G4Cons("Cone",
                          30*cm,    // Trying to set inner at +Z
                          50*cm,    // Trying to set outer at +Z
                          10*cm,    // Actually sets inner at -Z!
                          20*cm,    // Actually sets outer at -Z!
                          40*cm, 0, CLHEP::twopi);
// This creates opposite taper from intended!

// CORRECT - remember parameter order: rMin1, rMax1, rMin2, rMax2
G4Cons* cone = new G4Cons("Cone",
                          10*cm,    // Inner radius at -Z
                          20*cm,    // Outer radius at -Z
                          30*cm,    // Inner radius at +Z
                          50*cm,    // Outer radius at +Z
                          40*cm, 0, CLHEP::twopi);
```

### Pitfall 2: Invalid Radius Constraints

```cpp
// WRONG - inner radius >= outer radius at one end
G4Cons* cone = new G4Cons("Cone", 15*cm, 10*cm, 5*cm, 8*cm, 20*cm,
                          0, CLHEP::twopi);
// FatalException: pRmin1 >= pRmax1

// CORRECT - ensure inner < outer at both ends
G4Cons* cone = new G4Cons("Cone", 5*cm, 10*cm, 3*cm, 8*cm, 20*cm,
                          0, CLHEP::twopi);
```

### Pitfall 3: Using G4Cons When G4Tubs Would Suffice

```cpp
// INEFFICIENT - using G4Cons with same radii at both ends
G4Cons* tube = new G4Cons("Tube", 5*cm, 10*cm, 5*cm, 10*cm, 30*cm,
                          0, CLHEP::twopi);
// This is just a cylinder - G4Tubs is faster!

// BETTER - use G4Tubs for cylindrical geometry
G4Tubs* tube = new G4Tubs("Tube", 5*cm, 10*cm, 30*cm, 0, CLHEP::twopi);
```

### Pitfall 4: Forgetting Cone Orientation

```cpp
// Be clear about which end is which
G4Cons* cone = new G4Cons("Cone", 0, 50*cm, 0, 30*cm, 40*cm, 0, CLHEP::twopi);
// This cone is wider at Z = -40cm and narrower at Z = +40cm

// If you want it the other way, swap radius pairs:
G4Cons* cone2 = new G4Cons("Cone2", 0, 30*cm, 0, 50*cm, 40*cm, 0, CLHEP::twopi);
// This cone is narrower at Z = -40cm and wider at Z = +40cm
```

### Pitfall 5: Zero Inner Radius Inconsistency

```cpp
// PROBLEMATIC - inner radius zero at one end but not the other
G4Cons* cone = new G4Cons("Cone", 0, 20*cm, 10*cm, 15*cm, 30*cm,
                          0, CLHEP::twopi);
// Creates a cone with apex issues
// Constructor sets fRmin1 = 1e3*kRadTolerance to avoid singularity

// BETTER - be explicit about small radius
G4double smallRadius = 1*mm;
G4Cons* cone = new G4Cons("Cone", smallRadius, 20*cm, 10*cm, 15*cm, 30*cm,
                          0, CLHEP::twopi);
```

### Pitfall 6: Extreme Taper Angles

```cpp
// Be careful with very steep cones
G4Cons* steepCone = new G4Cons("SteepCone",
                               0, 100*cm,  // Large radius at -Z
                               0, 1*cm,    // Small radius at +Z
                               10*cm,      // Short length
                               0, CLHEP::twopi);
// Taper angle ≈ 84° - nearly parallel to Z-axis
// May have numerical issues in distance calculations
```

## Best Practices

### 1. Use G4Tubs for Cylindrical Geometry

```cpp
// If radii don't change with Z, use G4Tubs
if (rMin1 == rMin2 && rMax1 == rMax2) {
    // Use G4Tubs - it's more efficient
    G4Tubs* tube = new G4Tubs("Tube", rMin1, rMax1, halfZ, sPhi, dPhi);
} else {
    // Use G4Cons for tapered geometry
    G4Cons* cone = new G4Cons("Cone", rMin1, rMax1, rMin2, rMax2,
                              halfZ, sPhi, dPhi);
}
```

### 2. Document Radius Conventions

```cpp
// Good: clear documentation
G4Cons* endcap = new G4Cons(
    "Endcap",
    20*cm,   // Inner radius at front face (z = -30cm)
    50*cm,   // Outer radius at front face (z = -30cm)
    25*cm,   // Inner radius at back face (z = +30cm)
    55*cm,   // Outer radius at back face (z = +30cm)
    30*cm,   // Half-length: extends from -30cm to +30cm
    0, CLHEP::twopi
);
```

### 3. Validate Taper Angle

```cpp
// Check that taper angle is reasonable
G4double r1 = 50*cm;
G4double r2 = 30*cm;
G4double dz = 40*cm;

G4double tanTheta = std::fabs(r1 - r2) / (2.0 * dz);
G4double halfAngle = std::atan(tanTheta) * 180.0 / CLHEP::pi;

if (halfAngle > 45.0) {
    G4cout << "WARNING: Steep cone angle " << halfAngle << "°" << G4endl;
}

G4Cons* cone = new G4Cons("Cone", 0, r1, 0, r2, dz, 0, CLHEP::twopi);
```

### 4. Use Helper Functions for Interpolation

```cpp
// Create helper to calculate radius at any Z
class ConeHelper {
public:
    static G4double RadiusAt(const G4Cons* cone, G4double z,
                            bool outer = true) {
        G4double dz = cone->GetZHalfLength();
        G4double r1 = outer ? cone->GetOuterRadiusMinusZ()
                            : cone->GetInnerRadiusMinusZ();
        G4double r2 = outer ? cone->GetOuterRadiusPlusZ()
                            : cone->GetInnerRadiusPlusZ();
        return 0.5 * (r2*(z + dz) + r1*(dz - z)) / dz;
    }
};

// Usage
G4double rAtZ = ConeHelper::RadiusAt(cone, 15*cm, true);
```

### 5. Consider Placement Direction

```cpp
// If cone should point upward, consider rotation
G4Cons* cone = new G4Cons("Cone", 0, 50*cm, 0, 30*cm, 40*cm, 0, CLHEP::twopi);
// By default, cone is wider at -Z

// To make it point upward (+Z), rotate 180° around X or Y
G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateY(180*deg);
new G4PVPlacement(rot, G4ThreeVector(0, 0, 50*cm), coneLV,
                 "Cone", motherLV, false, 0);
```

## See Also

- [G4VSolid](g4vsolid.md) - Base class for all solids
- [G4CSGSolid](g4cssolid.md) - Base class for CSG primitives
- [G4Box](g4box.md) - Rectangular box (simplest solid)
- [G4Tubs](g4tubs.md) - Cylindrical solid (use when no taper)
- [G4Sphere](g4sphere.md) - Spherical shell
- [G4Polycone](g4polycone.md) - Complex shape with piecewise-linear radius vs Z
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/solids/CSG/include/G4Cons.hh`
- Implementation: `source/geometry/solids/CSG/src/G4Cons.cc`
- Inline: `source/geometry/solids/CSG/include/G4Cons.icc`

### Related Classes
- `G4SolidStore` - Global registry of all solids
- `G4CSGSolid` - Base class for CSG primitives
- `G4BoundingEnvelope` - Extent calculation helper
- `G4PolyhedronCons` - Visualization polyhedron

### Key Algorithms
- **Linear Radius Interpolation**: r(z) = (r2×(z+dz) + r1×(dz-z)) / (2×dz)
- **Conical Surface Intersection**: Solving (p + t×v)² = (a×z + b)²
- **Conical Normal Calculation**: Accounts for taper angle θ
- **Quadratic Equation Solver**: Stable formulation for cone-ray intersection

### External Documentation
- [Geant4 User Guide: Solids](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomSolids.html)
- [Geant4 Class Documentation](http://geant4.kek.jp/Reference/)
- [Cone-Ray Intersection Mathematics](https://www.geometrictools.com/Documentation/IntersectionLineCone.pdf)
