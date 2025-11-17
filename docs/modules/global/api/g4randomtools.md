# G4RandomTools API Documentation

## Overview

`G4RandomTools` provides a collection of inline utility functions for generating random geometric quantities commonly needed in particle physics simulations. These include random directions with constraints, random points on geometric surfaces, and random positions within shapes.

All functions are optimized inline implementations using rejection sampling and analytical methods.

::: tip Header File
**Location:** `source/global/HEPRandom/include/G4RandomTools.hh`
**Type:** Header-only inline functions
:::

## Available Functions

`source/global/HEPRandom/include/G4RandomTools.hh:44-178`

### G4LambertianRand

`source/global/HEPRandom/include/G4RandomTools.hh:58-80`

```cpp
inline G4ThreeVector G4LambertianRand(const G4ThreeVector& normal)
```

**Purpose:** Generate random unit vector with Lambertian (cosine) distribution relative to surface normal

**Parameters:**
- `normal`: Surface normal vector

**Returns:** Random direction following Lambert's cosine law

**Algorithm:** Rejection sampling with dot product weighting

**Physics Applications:**
- Diffuse surface reflection
- Thermal emission from surfaces
- Lambertian scattering

**Example:**
```cpp
// Diffuse reflection from surface
G4ThreeVector surfaceNormal(0, 0, 1);
G4ThreeVector reflectedDirection = G4LambertianRand(surfaceNormal);

// The probability is proportional to cos(theta)
// where theta is angle between direction and normal
```

**Performance:**
- Average iterations: ~π/2 ≈ 1.57
- Maximum trials: 1024 (fallback protection)

### G4PlaneVectorRand

`source/global/HEPRandom/include/G4RandomTools.hh:85-95`

```cpp
inline G4ThreeVector G4PlaneVectorRand(const G4ThreeVector& normal)
```

**Purpose:** Generate random unit vector in plane perpendicular to given normal

**Parameters:**
- `normal`: Normal to the plane

**Returns:** Random direction in plane (perpendicular to normal)

**Algorithm:** Orthogonal basis construction with random rotation

**Physics Applications:**
- Transverse momentum generation
- Polarization perpendicular to beam
- Surface tangent directions

**Example:**
```cpp
// Random direction in plane perpendicular to beam
G4ThreeVector beamDirection(0, 0, 1);
G4ThreeVector transverseDirection = G4PlaneVectorRand(beamDirection);

// transverseDirection · beamDirection = 0 (perpendicular)
// |transverseDirection| = 1 (unit vector)

// Use for transverse momentum kick
G4ThreeVector momentum = pLongitudinal * beamDirection +
                         pTransverse * transverseDirection;
```

**Performance:**
- Very fast: O(1), no iterations
- Analytical solution

### G4RandomRadiusInRing

`source/global/HEPRandom/include/G4RandomTools.hh:100-109`

```cpp
inline G4double G4RandomRadiusInRing(G4double rmin, G4double rmax)
```

**Purpose:** Generate random radius with uniform area distribution in annular ring

**Parameters:**
- `rmin`: Inner radius
- `rmax`: Outer radius

**Returns:** Random radius with correct area weighting

**Algorithm:** Inverse transform sampling with area correction

**Physics Applications:**
- Ring detector sampling
- Cylindrical shell sources
- Annular beam profiles

**Example:**
```cpp
// Random point in ring detector
G4double rmin = 10 * cm;
G4double rmax = 20 * cm;
G4double r = G4RandomRadiusInRing(rmin, rmax);
G4double phi = CLHEP::twopi * G4UniformRand();

G4double x = r * std::cos(phi);
G4double y = r * std::sin(phi);

// Point (x,y) is uniformly distributed in ring area
```

**Mathematical Note:**
The area element in polar coordinates is r·dr·dφ, so probability is proportional to r, not uniform in r:
```
P(r) ∝ r  →  r = √(r²_min + u(r²_max - r²_min))
```

### G4RandomPointInEllipse

`source/global/HEPRandom/include/G4RandomTools.hh:115-127`

```cpp
inline G4TwoVector G4RandomPointInEllipse(G4double a, G4double b)
```

**Purpose:** Generate random point uniformly distributed inside ellipse

**Parameters:**
- `a`: Semi-major axis (x-direction)
- `b`: Semi-minor axis (y-direction)

**Returns:** Random 2D point inside ellipse (x/a)² + (y/b)² ≤ 1

**Algorithm:** Rejection sampling in bounding box

**Physics Applications:**
- Elliptical beam profiles
- Detector acceptance regions
- Source distributions

**Example:**
```cpp
// Elliptical beam spot
G4double beamWidthX = 2.0 * mm;
G4double beamWidthY = 1.0 * mm;

G4TwoVector beamPos = G4RandomPointInEllipse(beamWidthX, beamWidthY);

G4ThreeVector position(beamPos.x(), beamPos.y(), 0);
fParticleGun->SetParticlePosition(position);
```

**Performance:**
- Average iterations: 4/π ≈ 1.27
- Maximum trials: 1000
- Falls back to (0,0) if unsuccessful

### G4RandomPointOnEllipse

`source/global/HEPRandom/include/G4RandomTools.hh:133-150`

```cpp
inline G4TwoVector G4RandomPointOnEllipse(G4double a, G4double b)
```

**Purpose:** Generate random point uniformly distributed on ellipse perimeter

**Parameters:**
- `a`: Semi-major axis
- `b`: Semi-minor axis

**Returns:** Random 2D point on ellipse (x/a)² + (y/b)² = 1

**Algorithm:** Rejection sampling with arc-length correction

**Physics Applications:**
- Particles starting from elliptical boundary
- Wire chamber geometries
- Orbital sampling

**Example:**
```cpp
// Sample points on elliptical orbit
G4double semiMajor = 5.0 * cm;
G4double semiMinor = 3.0 * cm;

G4TwoVector pos = G4RandomPointOnEllipse(semiMajor, semiMinor);

// Point is on ellipse perimeter with uniform arc-length distribution
G4cout << "Position: (" << pos.x() << ", " << pos.y() << ")" << G4endl;
```

**Mathematical Note:**
Simple angular sampling φ = 2π·u would cluster points at the ends of the major axis. The algorithm corrects for varying arc-length element.

**Performance:**
- Average iterations: depends on eccentricity
- Maximum trials: 1000
- More iterations for higher eccentricity

### G4RandomPointOnEllipsoid

`source/global/HEPRandom/include/G4RandomTools.hh:156-176`

```cpp
inline G4ThreeVector G4RandomPointOnEllipsoid(G4double a, G4double b, G4double c)
```

**Purpose:** Generate random point uniformly distributed on ellipsoid surface

**Parameters:**
- `a`: Semi-axis in x-direction
- `b`: Semi-axis in y-direction
- `c`: Semi-axis in z-direction

**Returns:** Random 3D point on ellipsoid (x/a)² + (y/b)² + (z/c)² = 1

**Algorithm:** Rejection sampling with surface area correction

**Physics Applications:**
- Particles from ellipsoidal source surfaces
- Nuclear shapes (deformed nuclei)
- Detector surface sampling

**Example:**
```cpp
// Deformed nucleus surface
G4double Rx = 5.0 * fermi;
G4double Ry = 5.0 * fermi;
G4double Rz = 6.0 * fermi;  // Prolate (elongated)

G4ThreeVector surfacePoint = G4RandomPointOnEllipsoid(Rx, Ry, Rz);

// Use for surface emission
G4ThreeVector direction = surfacePoint.unit();  // Radial emission
```

**Mathematical Note:**
Uniform sampling on sphere followed by scaling would give incorrect distribution. The algorithm uses rejection with surface element correction factor.

**Performance:**
- Average iterations: depends on axis ratios
- Maximum trials: 1000
- More iterations for highly deformed ellipsoids

## Usage Examples

### Complete Beam Generation

```cpp
#include "G4RandomTools.hh"
#include "G4RandomDirection.hh"

void GenerateBeam() {
    // Elliptical beam spot at z=0
    G4TwoVector spot = G4RandomPointInEllipse(1.0*mm, 0.5*mm);

    // Position
    G4ThreeVector position(spot.x(), spot.y(), 0);

    // Direction with small divergence
    G4ThreeVector nominalDir(0, 0, 1);
    G4ThreeVector divDir = G4PlaneVectorRand(nominalDir);

    G4double divergence = 0.01;  // rad
    G4ThreeVector direction = nominalDir + divergence * divDir;
    direction = direction.unit();

    fParticleGun->SetParticlePosition(position);
    fParticleGun->SetParticleMomentumDirection(direction);
}
```

### Ring Detector Acceptance

```cpp
bool IsInRingDetector(const G4ThreeVector& position) {
    G4double r = std::sqrt(position.x()*position.x() +
                           position.y()*position.y());
    return (r >= rInner && r <= rOuter);
}

void GenerateInRing() {
    G4double r = G4RandomRadiusInRing(rInner, rOuter);
    G4double phi = CLHEP::twopi * G4UniformRand();
    G4double z = G4RandFlat::shoot(-halfLength, halfLength);

    G4ThreeVector position(r*std::cos(phi), r*std::sin(phi), z);
    // Guaranteed to be in ring volume
}
```

### Surface Scattering

```cpp
class DiffuseSurface {
public:
    G4ThreeVector ScatterParticle(const G4ThreeVector& surfaceNormal) {
        // Lambertian (diffuse) reflection
        G4ThreeVector scattered = G4LambertianRand(surfaceNormal);
        return scattered;
    }

    G4ThreeVector SpecularReflection(const G4ThreeVector& incident,
                                     const G4ThreeVector& normal) {
        // Mirror reflection
        return incident - 2.0 * (incident * normal) * normal;
    }

    G4ThreeVector MixedScattering(const G4ThreeVector& incident,
                                  const G4ThreeVector& normal,
                                  G4double specularFraction) {
        if (G4UniformRand() < specularFraction) {
            return SpecularReflection(incident, normal);
        } else {
            return G4LambertianRand(normal);
        }
    }
};
```

### Ellipsoidal Source

```cpp
void GenerateFromEllipsoidalSource() {
    // Surface emission from ellipsoidal source
    G4double a = 2*cm, b = 2*cm, c = 3*cm;  // Prolate

    G4ThreeVector surfacePos = G4RandomPointOnEllipsoid(a, b, c);

    // Outward radial emission
    G4ThreeVector direction = surfacePos.unit();

    // Or isotropic from surface
    // direction = G4RandomDirection();

    // Or Lambertian from surface
    // G4ThreeVector normal = surfacePos.unit();
    // direction = G4LambertianRand(normal);

    fParticleGun->SetParticlePosition(surfacePos + sourceCenter);
    fParticleGun->SetParticleMomentumDirection(direction);
}
```

### Cylindrical Detector Response

```cpp
class RingDetector {
public:
    G4ThreeVector GenerateRandomPosition() {
        // Random position in ring detector volume
        G4double r = G4RandomRadiusInRing(fRmin, fRmax);
        G4double phi = CLHEP::twopi * G4UniformRand();
        G4double z = G4RandFlat::shoot(-fHalfLength, fHalfLength);

        return G4ThreeVector(r*std::cos(phi), r*std::sin(phi), z);
    }

    G4double GetAcceptance(G4double sourceR) {
        // Geometric acceptance for point source at radius sourceR
        if (sourceR < fRmin) {
            return (fRmax*fRmax - fRmin*fRmin) / (4 * sourceR*sourceR + fHalfLength*fHalfLength);
        }
        // ... more complex for sourceR > fRmin
    }

private:
    G4double fRmin, fRmax, fHalfLength;
};
```

## Performance Notes

### Algorithm Complexity

| Function | Complexity | Average Iterations |
|----------|------------|-------------------|
| G4LambertianRand | O(n) | ~1.57 |
| G4PlaneVectorRand | O(1) | 1 (exact) |
| G4RandomRadiusInRing | O(1) | 1 (exact) |
| G4RandomPointInEllipse | O(n) | ~1.27 |
| G4RandomPointOnEllipse | O(n) | ~1-3 (varies) |
| G4RandomPointOnEllipsoid | O(n) | ~2-5 (varies) |

### Optimization Tips

```cpp
// GOOD: Use once per particle
G4ThreeVector pos = G4RandomPointInEllipse(a, b);

// BETTER: Cache parameters outside loop
const G4double a = 2*cm;
const G4double b = 1*cm;
for (int i = 0; i < nParticles; i++) {
    G4TwoVector pos = G4RandomPointInEllipse(a, b);
}

// BEST: Consider analytical methods for simple cases
// For circle (a = b), use direct polar sampling:
G4double r = a * std::sqrt(G4UniformRand());
G4double phi = CLHEP::twopi * G4UniformRand();
```

## Thread Safety

::: tip Thread-Safe
All functions in G4RandomTools are thread-safe because they:
1. Are stateless inline functions
2. Only call thread-safe random number generators
3. Use only local variables
:::

**Multi-threading Usage:**
```cpp
// Safe to call from any thread
void WorkerThread() {
    G4ThreeVector dir = G4LambertianRand(normal);  // OK
    G4TwoVector pos = G4RandomPointInEllipse(a, b);  // OK
}
```

## Mathematical Background

### Lambertian Distribution

Lambert's cosine law states that intensity I from a diffuse surface follows:
```
I(θ) = I₀ cos(θ)
```
where θ is angle from surface normal. The sampling probability is:
```
P(θ) ∝ cos(θ)
```

### Area-Weighted Radius Sampling

For uniform distribution in area, the probability element is:
```
dP = (2πr dr) / (π(r²_max - r²_min)) = 2r dr / (r²_max - r²_min)
```
Integrating gives the inverse CDF:
```
r = √(r²_min + u(r²_max - r²_min))
```

### Ellipse Arc-Length

The perimeter of an ellipse cannot be expressed in elementary functions (complete elliptic integral). The rejection method ensures uniform arc-length distribution without computing the perimeter.

## Common Pitfalls

::: warning Incorrect Circle Sampling
```cpp
// WRONG: Non-uniform area distribution
G4double r = rmax * G4UniformRand();  // Clusters at center!

// CORRECT: Area-weighted
G4double r = rmax * std::sqrt(G4UniformRand());
```
:::

::: warning Ellipse vs Circle
```cpp
// WRONG: Scaling circle gives wrong area distribution
G4double r = std::sqrt(G4UniformRand());
G4TwoVector pos(a * r * cos(phi), b * r * sin(phi));  // WRONG!

// CORRECT: Use G4RandomPointInEllipse
G4TwoVector pos = G4RandomPointInEllipse(a, b);  // RIGHT
```
:::

## Related Classes

- [G4RandomDirection](g4randomdirection.md) - Random 3D isotropic directions
- [Randomize](randomize.md) - Main random number header
- [G4UniformRandPool](g4uniformrandpool.md) - Pooled random generation
- **G4ThreeVector** - 3D vector class
- **G4TwoVector** - 2D vector class

## References

- Lambert, "Photometria" (1760) - Lambertian reflectance
- Knuth, "The Art of Computer Programming Vol. 2" - Random geometric sampling
- Devroye, "Non-Uniform Random Variate Generation" (1986)

---

::: info Source Reference
**Header:** `source/global/HEPRandom/include/G4RandomTools.hh` (lines 44-178)
**Type:** Header-only inline utilities
**Author:** P. Gumplinger (2008), E. Tcherniaev (2017)
:::
