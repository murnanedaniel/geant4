# G4TwoVector

## Overview

`G4TwoVector` is a 2-dimensional vector class with double precision components, used for planar geometry calculations, transverse momentum analysis, and 2D spatial operations in Geant4.

**Note:** `G4TwoVector` is a typedef to `CLHEP::Hep2Vector`, inheriting all functionality from the CLHEP vector library.

## Source Location

**Header Files:**
- Geant4 wrapper: `source/global/management/include/G4TwoVector.hh` (lines 30-38)
- CLHEP implementation: `source/externals/clhep/include/CLHEP/Vector/TwoVector.h` (lines 44-204)

**Type Definition:**
```cpp
using G4TwoVector = CLHEP::Hep2Vector;
```

## Purpose

G4TwoVector provides mathematical operations for 2D vectors, including:
- Cartesian (x, y) and polar (r, φ) coordinate systems
- 2D vector arithmetic and geometric operations
- Projection operations from 3D to 2D
- Transverse momentum and position analysis

## Common Use Cases

1. **Transverse Momentum**: pT analysis in collider physics
2. **2D Projections**: Projecting 3D positions onto planes
3. **Planar Geometry**: Detectors with 2D readout (e.g., silicon strips)
4. **Impact Parameters**: Beam position and profile monitoring
5. **Cross-Sections**: 2D detector views and event displays
6. **Pixel Coordinates**: Position-sensitive detectors

## Constructors

### Default and Basic Constructors
```cpp
Hep2Vector(double x = 0.0, double y = 0.0)
```
Default constructor with optional x and y components. Default is (0, 0).

```cpp
Hep2Vector(const Hep2Vector& p)
Hep2Vector(Hep2Vector&& p)
```
Copy and move constructors.

```cpp
explicit Hep2Vector(const Hep3Vector& v)
```
"Demotion" constructor from 3D to 2D vector.
**WARNING**: Ignores the z component, so Hep2Vector(v) == v will NOT hold in general!

**Usage Example:**
```cpp
G4TwoVector origin;                      // (0, 0)
G4TwoVector position(10*mm, 20*mm);     // detector hit position
G4TwoVector transverse(px, py);         // transverse momentum

G4ThreeVector momentum3D(px, py, pz);
G4TwoVector momentumT(momentum3D);      // (px, py) - ignores pz!
```

## Public Member Constants

```cpp
enum { X=0, Y=1, NUM_COORDINATES=2, SIZE=NUM_COORDINATES };
```
Safe indexing constants for use with matrices and arrays.

## Component Access

### Cartesian Coordinates

#### Getters
```cpp
double x() const
double y() const
```
Return individual Cartesian components.

#### Setters
```cpp
void setX(double x)
void setY(double y)
void set(double x, double y)
```
Set Cartesian components individually or both at once.

**Usage Example:**
```cpp
G4TwoVector v(1, 2);
double x = v.x();           // x = 1
v.setY(5);                  // v is now (1, 5)
v.set(10, 20);              // v is now (10, 20)
```

### Index-Based Access

```cpp
double operator () (int i) const
double operator [] (int i) const
double& operator () (int i)
double& operator [] (int i)
```
Access components by 0-based index (0=x, 1=y).

**Usage Example:**
```cpp
G4TwoVector v(1, 2);
double y = v[1];            // y = 2
v[0] = 10;                  // v is now (10, 2)
```

## Polar Coordinates

### Accessors
```cpp
double phi() const
```
Returns azimuthal angle φ in radians (angle from x-axis).

```cpp
double mag() const
double mag2() const
```
Returns magnitude (r) and magnitude squared (r²).

```cpp
double r() const
```
Synonym for mag() - returns magnitude in polar coordinates.

### Setters
```cpp
void setPhi(double phi)
```
Set φ keeping magnitude constant.

```cpp
void setMag(double r)
void setR(double r)
```
Set magnitude keeping φ constant. setR() is synonym for setMag().

```cpp
void setPolar(double r, double phi)
```
Set polar coordinates directly (r, φ).

**Usage Example:**
```cpp
G4TwoVector v(3, 4);
double phi = v.phi();           // angle from x-axis
double r = v.mag();             // magnitude = 5

v.setPolar(10, M_PI/4);         // set to (10*cos(π/4), 10*sin(π/4))
```

## Vector Arithmetic Operators

### Assignment
```cpp
Hep2Vector& operator = (const Hep2Vector& p)
Hep2Vector& operator = (Hep2Vector&& p)
```
Copy and move assignment operators.

### Addition and Subtraction
```cpp
Hep2Vector& operator += (const Hep2Vector& p)
Hep2Vector& operator -= (const Hep2Vector& p)
Hep2Vector operator - () const
```
In-place addition, subtraction, and unary minus.

**Global Functions:**
```cpp
Hep2Vector operator + (const Hep2Vector& a, const Hep2Vector& b)
Hep2Vector operator - (const Hep2Vector& a, const Hep2Vector& b)
```

**Usage Example:**
```cpp
G4TwoVector p1(1, 2);
G4TwoVector p2(3, 4);
G4TwoVector sum = p1 + p2;      // (4, 6)
G4TwoVector diff = p1 - p2;     // (-2, -2)
p1 += p2;                       // p1 is now (4, 6)
G4TwoVector neg = -p1;          // negate components
```

### Scaling
```cpp
Hep2Vector& operator *= (double a)
```
In-place multiplication by scalar.

**Global Functions:**
```cpp
Hep2Vector operator * (const Hep2Vector& p, double a)
Hep2Vector operator * (double a, const Hep2Vector& p)
Hep2Vector operator / (const Hep2Vector& p, double a)
```

**Usage Example:**
```cpp
G4TwoVector v(1, 2);
G4TwoVector scaled = v * 2.5;   // (2.5, 5.0)
G4TwoVector divided = v / 2.0;  // (0.5, 1.0)
v *= 10;                        // v is now (10, 20)
```

## Comparison Operators

### Exact Comparisons
```cpp
bool operator == (const Hep2Vector& v) const
bool operator != (const Hep2Vector& v) const
```
Exact equality and inequality.

### Dictionary Ordering
```cpp
bool operator < (const Hep2Vector& v) const
bool operator > (const Hep2Vector& v) const
bool operator <= (const Hep2Vector& v) const
bool operator >= (const Hep2Vector& v) const
```
Dictionary ordering by y first, then x component.

```cpp
int compare(const Hep2Vector& v) const
```
Returns -1, 0, or 1 for dictionary comparison.

**Usage Example:**
```cpp
G4TwoVector v1(1, 2);
G4TwoVector v2(1, 2);
if (v1 == v2) { /* exact match */ }
if (v1 < v2) { /* dictionary order: by y, then x */ }
```

## Approximate Comparisons

### Tolerance-Based Comparisons
```cpp
bool isNear(const Hep2Vector& p, double epsilon = tolerance) const
```
Checks if vectors are approximately equal within tolerance.

```cpp
double howNear(const Hep2Vector& p) const
```
Returns measure of how close vectors are (0 = identical).

```cpp
static double getTolerance()
static double setTolerance(double tol)
```
Get/set default tolerance for approximate comparisons.

**Usage Example:**
```cpp
G4TwoVector v1(1.0, 2.0);
G4TwoVector v2(1.0 + 1e-15, 2.0);
if (v1.isNear(v2)) { /* approximately equal */ }
```

## Dot Product

```cpp
double dot(const Hep2Vector& p) const
```
Returns scalar (dot) product: v1·v2 = |v1||v2|cos(angle).

**Global Operator:**
```cpp
double operator * (const Hep2Vector& a, const Hep2Vector& b)
```
Alternative syntax for dot product.

**Usage Example:**
```cpp
G4TwoVector v1(1, 0);
G4TwoVector v2(0, 1);
double dp = v1.dot(v2);         // 0 (orthogonal)
double dp2 = v1 * v2;           // same as dot product
```

## Angles and Rotations

### Angle Between Vectors
```cpp
double angle(const Hep2Vector& v) const
```
Returns angle (in radians) between two 2D vectors.

**Usage Example:**
```cpp
G4TwoVector v1(1, 0);
G4TwoVector v2(0, 1);
double angle = v1.angle(v2);    // π/2 radians (90 degrees)
```

### Rotation
```cpp
void rotate(double angle)
```
Rotates the vector by angle (in radians) in the x-y plane.
Positive angle rotates counter-clockwise.

**Usage Example:**
```cpp
G4TwoVector v(1, 0);
v.rotate(M_PI/2);               // v is now (0, 1)

// Rotate detector hit position
G4TwoVector hitPos(x, y);
hitPos.rotate(detectorRotation);
```

## Unit Vector

```cpp
Hep2Vector unit() const
```
Returns unit vector parallel to this vector (normalized to length 1).

**Usage Example:**
```cpp
G4TwoVector v(3, 4);
G4TwoVector dir = v.unit();     // (0.6, 0.8) - unit vector
double mag = dir.mag();         // 1.0
```

## Orthogonal Vector

```cpp
Hep2Vector orthogonal() const
```
Returns a vector orthogonal (perpendicular) to this one.

**Usage Example:**
```cpp
G4TwoVector v(1, 2);
G4TwoVector perp = v.orthogonal();
double dp = v.dot(perp);        // ~0 (orthogonal)
```

## Parallelism and Orthogonality Tests

### Parallel Check
```cpp
bool isParallel(const Hep2Vector& p, double epsilon = tolerance) const
```
Tests if vectors are parallel within tolerance.

```cpp
double howParallel(const Hep2Vector& p) const
```
Returns measure of parallelism (0 = perfectly parallel).

### Orthogonal Check
```cpp
bool isOrthogonal(const Hep2Vector& p, double epsilon = tolerance) const
```
Tests if vectors are orthogonal within tolerance.

```cpp
double howOrthogonal(const Hep2Vector& p) const
```
Returns measure of orthogonality (0 = perfectly orthogonal).

**Usage Example:**
```cpp
G4TwoVector v1(1, 0);
G4TwoVector v2(2, 0);
if (v1.isParallel(v2)) { /* parallel */ }

G4TwoVector v3(0, 1);
if (v1.isOrthogonal(v3)) { /* orthogonal */ }
```

## Type Conversions

### Cast to 3D Vector
```cpp
operator Hep3Vector () const
```
Converts 2D vector to 3D vector with z=0.

**Usage Example:**
```cpp
G4TwoVector v2D(1, 2);
G4ThreeVector v3D = v2D;        // (1, 2, 0)

// Use in 3D operations
G4ThreeVector position3D = G4ThreeVector(hitPosition2D);
```

## I/O Operations

```cpp
std::ostream& operator << (std::ostream& os, const Hep2Vector& v)
std::istream& operator >> (std::istream& is, Hep2Vector& v)
```
Stream insertion and extraction operators.

**Usage Example:**
```cpp
G4TwoVector v(1, 2);
G4cout << "Position: " << v << G4endl;

std::ifstream input("positions.dat");
G4TwoVector position;
input >> position;
```

## Predefined Unit Vectors

```cpp
static const Hep2Vector X_HAT2(1.0, 0.0);  // Unit vector in x direction
static const Hep2Vector Y_HAT2(0.0, 1.0);  // Unit vector in y direction
```

**Usage Example:**
```cpp
G4TwoVector xDir = X_HAT2;
G4TwoVector diagonal = (X_HAT2 + Y_HAT2).unit();  // 45° direction
```

## Performance Notes

1. **Magnitude Calculations**: Use `mag2()` instead of `mag()` when possible (avoids sqrt).
2. **Comparisons**: For numerical results, use `isNear()` with appropriate tolerance.
3. **Repeated Operations**: Cache frequently used values like unit vectors.

**Performance Example:**
```cpp
// SLOWER
double r = v.mag();
if (r > threshold) { ... }

// FASTER (avoids sqrt)
double r2 = v.mag2();
if (r2 > threshold*threshold) { ... }
```

## Thread Safety

G4TwoVector is **thread-safe** for const operations. Multiple threads can safely:
- Read component values
- Perform arithmetic creating new vectors
- Call const member functions

**Not thread-safe**: Modifying shared vectors from multiple threads without synchronization.

**Thread-Safe Usage:**
```cpp
// Thread-safe: each thread has own vector
void AnalyzeHit(const G4Hit* hit) {
    G4TwoVector localPos = hit->GetPosition2D();
    // Safe to use localPos in this thread
}

// NOT thread-safe without protection
G4TwoVector sharedVector;  // global
// Multiple threads: sharedVector += value;  // UNSAFE
```

## Related Classes

- **[G4ThreeVector](g4threevector.md)**: 3D vector operations - parent class for 3D extensions
- **[G4RotationMatrix](g4rotationmatrix.md)**: 3D rotations (not applicable to 2D)
- **G4Transform3D**: 3D transformations

## Physics Application Examples

### 1. Transverse Momentum Analysis
```cpp
// Extract transverse momentum from 3D momentum
G4ThreeVector momentum3D(px, py, pz);
G4TwoVector pT(momentum3D);  // (px, py)

double transverseMomentum = pT.mag();
double azimuthalAngle = pT.phi();

// Apply cuts
if (transverseMomentum > 1.0*GeV) {
    // High pT particle
}
```

### 2. Detector Hit Positions
```cpp
// 2D detector plane (e.g., silicon strip detector)
G4TwoVector stripPosition(x, y);
G4TwoVector beamCenter(0, 0);

// Distance from beam in transverse plane
double impactParameter = (stripPosition - beamCenter).mag();

// Azimuthal position
double phi = stripPosition.phi();
int sector = int(phi / (2*M_PI/12));  // 12-fold segmentation
```

### 3. Beam Profile Monitoring
```cpp
// Accumulate hits to determine beam profile
std::vector<G4TwoVector> beamHits;

// Calculate centroid
G4TwoVector centroid;
for (const auto& hit : beamHits) {
    centroid += hit;
}
centroid = centroid * (1.0 / beamHits.size());

// RMS width
double rms2 = 0;
for (const auto& hit : beamHits) {
    rms2 += (hit - centroid).mag2();
}
double rmsWidth = sqrt(rms2 / beamHits.size());
```

### 4. Event Display Projections
```cpp
// Project 3D track onto detector face
G4ThreeVector trackPoint(x, y, z);
G4TwoVector projection(trackPoint);  // (x, y)

// Rotate to detector coordinate system
projection.rotate(detectorAngle);

// Check if in detector acceptance
double radius = projection.mag();
if (radius < detectorRadius) {
    // Hit is within detector
}
```

### 5. Impact Parameter Calculations
```cpp
// Distance of closest approach in transverse plane
G4TwoVector vertexPosition(vx, vy);
G4TwoVector primaryVertex(0, 0);

G4TwoVector impactVector = vertexPosition - primaryVertex;
double d0 = impactVector.mag();  // impact parameter

// Signed impact parameter
G4TwoVector momentumT(px, py);
double signedD0 = impactVector.x() * momentumT.y() -
                  impactVector.y() * momentumT.x();
signedD0 /= momentumT.mag();
```

### 6. Pixel Detector Readout
```cpp
// Convert physical position to pixel coordinates
G4TwoVector hitPosition(x, y);
G4TwoVector pixelSize(0.1*mm, 0.1*mm);

// Pixel indices
int pixelX = int(hitPosition.x() / pixelSize.x());
int pixelY = int(hitPosition.y() / pixelSize.y());

// Sub-pixel position for charge sharing
G4TwoVector subPixel(
    fmod(hitPosition.x(), pixelSize.x()),
    fmod(hitPosition.y(), pixelSize.y())
);
```

### 7. Azimuthal Correlation Studies
```cpp
// Correlations between particles in φ
G4TwoVector p1T(px1, py1);
G4TwoVector p2T(px2, py2);

double deltaPhi = p1T.phi() - p2T.phi();

// Bring into range [-π, π]
while (deltaPhi > M_PI) deltaPhi -= 2*M_PI;
while (deltaPhi < -M_PI) deltaPhi += 2*M_PI;

// Back-to-back topology
if (fabs(deltaPhi) > 2.8) {  // close to π
    // Particles are back-to-back
}
```

## Common Patterns

### Direction from Two Points (2D)
```cpp
G4TwoVector start, end;
G4TwoVector direction = (end - start).unit();
double distance = (end - start).mag();
```

### Perpendicular Vector (2D)
```cpp
G4TwoVector v(x, y);
G4TwoVector perp = v.orthogonal();
// or manually: G4TwoVector perp(-y, x);
```

### Angle Difference
```cpp
G4TwoVector v1, v2;
double deltaPhi = v1.phi() - v2.phi();
// Normalize to [-π, π]
while (deltaPhi > M_PI) deltaPhi -= 2*M_PI;
while (deltaPhi < -M_PI) deltaPhi += 2*M_PI;
```

### Circle Fitting
```cpp
// Find center of circle passing through points
std::vector<G4TwoVector> points;
G4TwoVector center;  // to be determined
double radius;       // to be determined

// Fit using least squares...
// (Implementation depends on fitting algorithm)
```

## Compilation Requirements

**Include Header:**
```cpp
#include "G4TwoVector.hh"
```

**No explicit linking** required - header-only implementation with inline functions.

## Limitations

1. **No Z-Component**: Cannot represent 3D information
2. **No Cross Product**: Cross product is not defined in 2D (use orthogonal() instead)
3. **Limited Rotations**: Only rotations in the x-y plane (around z-axis conceptually)

## Tips and Best Practices

1. **Use G4TwoVector for genuinely 2D problems** - don't force 3D problems into 2D
2. **Be careful with 3D→2D conversion** - the z-component is lost
3. **Prefer mag2() over mag()** when comparing distances
4. **Use polar coordinates** for azimuthal distributions
5. **Cache unit vectors** if used repeatedly in loops

## See Also

- CLHEP Vector Package Documentation
- Geant4 User's Guide: Detector Response
- [G4ThreeVector documentation](g4threevector.md) for 3D operations

---

**Note**: G4TwoVector is most useful for transverse plane calculations, detector readout coordinates, and 2D geometry operations. For full 3D spatial operations, use G4ThreeVector.
