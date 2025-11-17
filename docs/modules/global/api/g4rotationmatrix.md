# G4RotationMatrix

## Overview

`G4RotationMatrix` is a 3×3 orthogonal matrix class representing rotations in 3D space. It is extensively used throughout Geant4 for rotating detector geometries, coordinate system transformations, and particle direction changes.

**Note:** `G4RotationMatrix` is a typedef to `CLHEP::HepRotation`, inheriting all functionality from the CLHEP rotation library.

## Source Location

**Header Files:**
- Geant4 wrapper: `source/global/management/include/G4RotationMatrix.hh` (lines 30-40)
- CLHEP implementation: `source/externals/clhep/include/CLHEP/Vector/Rotation.h` (lines 42-403)

**Type Definitions:**
```cpp
using G4RotationMatrix = CLHEP::HepRotation;
using G4Rep3x3 = CLHEP::HepRep3x3;
```

## Purpose

G4RotationMatrix provides a complete framework for 3D rotations, supporting:
- Multiple rotation representations (Euler angles, axis-angle, matrix elements)
- Composition of rotations
- Application to vectors and reference frames
- Extraction of rotation parameters
- Specialized axis rotations (X, Y, Z)

## Common Use Cases

1. **Detector Placement**: Rotating detector components in geometry
2. **Coordinate Transformations**: Converting between reference frames
3. **Particle Scattering**: Rotating momentum vectors after interactions
4. **Magnetic Field Effects**: Rotation due to Lorentz force
5. **Polarization Vectors**: Rotating spin and polarization states
6. **Crystal Lattices**: Describing crystal orientations
7. **Reference Frame Alignment**: Aligning local coordinates to global

## Constructors

### Default Constructor
```cpp
HepRotation()
```
Creates identity rotation (no rotation).

**Usage Example:**
```cpp
G4RotationMatrix identity;  // identity matrix
// Applying this rotation does nothing
```

### Copy and Move Constructors
```cpp
HepRotation(const HepRotation& m)
HepRotation(HepRotation&& m)
```
Copy and move constructors.

### From Specialized Rotations
```cpp
HepRotation(const HepRotationX& m)
HepRotation(const HepRotationY& m)
HepRotation(const HepRotationZ& m)
```
Construct from specialized single-axis rotation objects.

### From Axis and Angle
```cpp
HepRotation(const Hep3Vector& axis, double delta)
```
Construct rotation of angle `delta` (radians) around specified axis.

```cpp
HepRotation(const HepAxisAngle& ax)
```
Construct from axis-angle structure.

**Usage Example:**
```cpp
G4ThreeVector axis(0, 0, 1);  // z-axis
G4RotationMatrix rotZ(axis, M_PI/4);  // 45° around z

// Rotate around arbitrary axis
G4ThreeVector beamAxis(1, 0, 1);
G4RotationMatrix rot(beamAxis.unit(), M_PI/6);
```

### From Euler Angles
```cpp
HepRotation(double phi, double theta, double psi)
```
Construct from three Euler angles (radians) using Goldstein conventions.
- φ (phi): First rotation around z-axis
- θ (theta): Second rotation around new y-axis
- ψ (psi): Third rotation around new z-axis

```cpp
HepRotation(const HepEulerAngles& e)
```
Construct from Euler angles structure.

**Usage Example:**
```cpp
// Euler angles for detector orientation
double phi = 0.5;
double theta = 1.0;
double psi = -0.3;
G4RotationMatrix eulerRot(phi, theta, psi);
```

### From Column Vectors
```cpp
HepRotation(const Hep3Vector& colX,
            const Hep3Vector& colY,
            const Hep3Vector& colZ)
```
Construct from three orthogonal unit vectors defining the columns.

**IMPORTANT**: The constructor checks orthonormality and adjusts values to ensure the matrix is a valid rotation.

**Usage Example:**
```cpp
// Define new coordinate system
G4ThreeVector newX(1, 0, 0);
G4ThreeVector newY(0, cos(angle), sin(angle));
G4ThreeVector newZ = newX.cross(newY).unit();

G4RotationMatrix coordTransform(newX, newY, newZ);
```

### From 3×3 Matrix Representation
```cpp
HepRotation(const HepRep3x3& m)
```
Direct construction from 3×3 matrix representation.

**WARNING**: No checking is performed! The matrix MUST be orthogonal.

## Set Methods

### Set Identity
```cpp
// Default constructor creates identity, or:
G4RotationMatrix rm;
rm = G4RotationMatrix();  // reset to identity
```

### Set from Axis and Angle
```cpp
HepRotation& set(const Hep3Vector& axis, double delta)
```
Set rotation of angle `delta` around axis.

```cpp
HepRotation& set(const HepAxisAngle& ax)
```
Set from axis-angle structure.

### Set from Euler Angles
```cpp
HepRotation& set(double phi, double theta, double psi)
HepRotation& set(const HepEulerAngles& e)
```
Set from Euler angles.

### Set from Column/Row Vectors
```cpp
HepRotation& set(const Hep3Vector& colX,
                 const Hep3Vector& colY,
                 const Hep3Vector& colZ)
```
Set from column vectors (with orthonormality check).

```cpp
HepRotation& setRows(const Hep3Vector& rowX,
                     const Hep3Vector& rowY,
                     const Hep3Vector& rowZ)
```
Set from row vectors (with orthonormality check).

### Set from Specialized Rotations
```cpp
HepRotation& set(const HepRotationX& r)
HepRotation& set(const HepRotationY& r)
HepRotation& set(const HepRotationZ& r)
```
Set from specialized axis rotations.

### Set from 3×3 Representation
```cpp
HepRotation& set(const HepRep3x3& m)
```
**WARNING**: No validation - matrix must be orthogonal!

## Accessors

### Matrix Elements
```cpp
double xx() const  // Element (0,0)
double xy() const  // Element (0,1)
double xz() const  // Element (0,2)
double yx() const  // Element (1,0)
double yy() const  // Element (1,1)
double yz() const  // Element (1,2)
double zx() const  // Element (2,0)
double zy() const  // Element (2,1)
double zz() const  // Element (2,2)
```
Individual matrix elements (Geant4 naming convention).

**Usage Example:**
```cpp
G4RotationMatrix rm;
rm.rotateZ(M_PI/4);
double element = rm.xx();  // cos(π/4)
```

### Column Vectors
```cpp
Hep3Vector colX() const
Hep3Vector colY() const
Hep3Vector colZ() const
```
Returns orthonormal column vectors of the rotation matrix.

**Usage Example:**
```cpp
G4RotationMatrix rm;
G4ThreeVector xAxis = rm.colX();  // transformed x-axis
G4ThreeVector yAxis = rm.colY();  // transformed y-axis
G4ThreeVector zAxis = rm.colZ();  // transformed z-axis
```

### Row Vectors
```cpp
Hep3Vector rowX() const
Hep3Vector rowY() const
Hep3Vector rowZ() const
```
Returns orthonormal row vectors of the rotation matrix.

### Subscript Access
```cpp
double operator () (int i, int j) const
```
Fortran-style subscripting (0-based): returns element (i,j).

```cpp
const HepRotation_row operator [] (int i) const
```
C-style subscripting: `rm[i][j]` returns element (i,j).

**Usage Example:**
```cpp
G4RotationMatrix rm;
double element = rm(1, 2);     // Fortran-style rm(1,2)
double element2 = rm[1][2];    // C-style rm[1][2]
```

### 3×3 Representation
```cpp
HepRep3x3 rep3x3() const
```
Returns 3×3 matrix representation.

### 4×4 Representation
```cpp
HepRep4x4 rep4x4() const
```
Returns 4×4 representation (for use with 4-vectors, time components are 0,0,0,1).

## Euler Angles

### Get Euler Angles
```cpp
double phi() const
double theta() const
double psi() const
```
Returns Euler angles (in radians).

```cpp
double getPhi() const
double getTheta() const
double getPsi() const
```
Alternative getters (synonyms).

```cpp
HepEulerAngles eulerAngles() const
```
Returns all Euler angles as a structure.

**Usage Example:**
```cpp
G4RotationMatrix rm;
// ... set rotation ...
double phi = rm.phi();
double theta = rm.theta();
double psi = rm.psi();
```

### Set Individual Euler Angles
```cpp
void setPhi(double phi)
void setTheta(double theta)
void setPsi(double psi)
```
Change individual Euler angle while keeping others unchanged.

## Axis and Angle

### Get Axis and Angle
```cpp
double delta() const
Hep3Vector axis() const
```
Returns rotation angle and rotation axis.

```cpp
double getDelta() const
Hep3Vector getAxis() const
```
Alternative getters (synonyms).

```cpp
HepAxisAngle axisAngle() const
```
Returns axis-angle structure.

```cpp
void getAngleAxis(double& delta, Hep3Vector& axis) const
```
Returns both angle and axis by reference (Geant4 style).

**Usage Example:**
```cpp
G4RotationMatrix rm;
// ... set rotation ...

double angle = rm.delta();
G4ThreeVector rotAxis = rm.axis();

G4cout << "Rotation: " << angle*180/M_PI << "° around "
       << rotAxis << G4endl;
```

### Set Axis and Angle
```cpp
void setAxis(const Hep3Vector& axis)
void setDelta(double delta)
```
Change rotation axis or angle independently.

## Angles of Rotated Axes

```cpp
double phiX() const
double phiY() const
double phiZ() const
```
Returns φ angles (radians) of rotated axes against original axes.

```cpp
double thetaX() const
double thetaY() const
double thetaZ() const
```
Returns θ angles (radians) of rotated axes against original axes.

**Usage Example:**
```cpp
G4RotationMatrix rm;
rm.rotateZ(M_PI/4);

double newXtheta = rm.thetaX();  // angle of new x-axis from original z
double newXphi = rm.phiX();      // azimuthal angle of new x-axis
```

## 4-Vector Accessors

These methods treat the rotation as a 4×4 matrix (for Lorentz transformations):

```cpp
HepLorentzVector col1() const
HepLorentzVector col2() const
HepLorentzVector col3() const
HepLorentzVector col4() const
```
Returns columns as 4-vectors (time components are 0 for col1-3, (0,0,0,1) for col4).

```cpp
HepLorentzVector row1() const
HepLorentzVector row2() const
HepLorentzVector row3() const
HepLorentzVector row4() const
```
Returns rows as 4-vectors.

```cpp
double xt() const  // = 0
double yt() const  // = 0
double zt() const  // = 0
double tx() const  // = 0
double ty() const  // = 0
double tz() const  // = 0
double tt() const  // = 1
```
Space-time cross elements (all zero for pure rotations except tt=1).

## Comparisons

### Equality
```cpp
bool operator == (const HepRotation& r) const
bool operator != (const HepRotation& r) const
```
Exact equality comparisons.

### Dictionary Ordering
```cpp
bool operator < (const HepRotation& r) const
bool operator > (const HepRotation& r) const
bool operator <= (const HepRotation& r) const
bool operator >= (const HepRotation& r) const
```
Dictionary ordering by matrix elements (zz, zy, zx, yz, ..., xx).

```cpp
int compare(const HepRotation& r) const
```
Returns -1, 0, or 1 for comparison.

### Identity Test
```cpp
bool isIdentity() const
```
Returns true if the matrix is the identity rotation.

**Usage Example:**
```cpp
G4RotationMatrix rm;
if (rm.isIdentity()) {
    // No rotation needed
}
```

### Distance Metrics
```cpp
double distance2(const HepRotation& r) const
```
Returns 3 - Tr(this/r), a measure of rotation difference.

```cpp
double howNear(const HepRotation& r) const
bool isNear(const HepRotation& r, double epsilon = tolerance) const
```
Approximate equality within tolerance.

### Distance to Boosts and Lorentz Transformations
```cpp
double distance2(const HepBoost& lt) const
double distance2(const HepLorentzRotation& lt) const
double howNear(const HepBoost& lt) const
double howNear(const HepLorentzRotation& lt) const
bool isNear(const HepBoost& lt, double epsilon = tolerance) const
bool isNear(const HepLorentzRotation& lt, double epsilon = tolerance) const
```

## Application to Vectors

### Rotate Vectors
```cpp
Hep3Vector operator () (const Hep3Vector& p) const
Hep3Vector operator * (const Hep3Vector& p) const
```
Apply rotation to a 3-vector. Both operators do the same thing.

**Usage Example:**
```cpp
G4RotationMatrix rm;
rm.rotateY(M_PI/2);

G4ThreeVector v(1, 0, 0);
G4ThreeVector rotated = rm * v;     // rotated is (0, 0, -1)
G4ThreeVector rotated2 = rm(v);     // same result
```

### Rotate Lorentz Vectors
```cpp
HepLorentzVector operator () (const HepLorentzVector& w) const
HepLorentzVector operator * (const HepLorentzVector& w) const
```
Rotate the space part of a Lorentz vector (time component unchanged).

**Usage Example:**
```cpp
G4RotationMatrix rm;
rm.rotateZ(angle);

G4LorentzVector fourMomentum(px, py, pz, E);
G4LorentzVector rotated = rm * fourMomentum;  // rotates (px,py,pz), E unchanged
```

## Rotation Composition

### Multiplication
```cpp
HepRotation operator * (const HepRotation& r) const
```
Compose two rotations: (this) × r represents applying r first, then this.

```cpp
HepRotation operator * (const HepRotationX& rx) const
HepRotation operator * (const HepRotationY& ry) const
HepRotation operator * (const HepRotationZ& rz) const
```
Optimized composition with specialized rotations.

**Usage Example:**
```cpp
G4RotationMatrix rot1;
rot1.rotateZ(M_PI/4);

G4RotationMatrix rot2;
rot2.rotateY(M_PI/3);

G4RotationMatrix combined = rot1 * rot2;  // Apply rot2, then rot1
```

### In-Place Composition
```cpp
HepRotation& operator *= (const HepRotation& r)
HepRotation& transform(const HepRotation& r)
```
**Important distinction**:
- `A *= B` means A = A × B (apply B, then A)
- `A.transform(B)` means A = B × A (apply A, then B)

```cpp
HepRotation& operator *= (const HepRotationX& r)
HepRotation& operator *= (const HepRotationY& r)
HepRotation& operator *= (const HepRotationZ& r)
HepRotation& transform(const HepRotationX& r)
HepRotation& transform(const HepRotationY& r)
HepRotation& transform(const HepRotationZ& r)
```
Optimized versions for specialized rotations.

**Usage Example:**
```cpp
G4RotationMatrix rm;
rm *= anotherRotation;        // Append rotation
rm.transform(anotherRotation); // Prepend rotation
```

## Axis Rotations

### Rotate Around X-Axis
```cpp
HepRotation& rotateX(double delta)
```
Rotates around x-axis by angle delta (radians).
Equivalent to: R = RotationX(delta) × R

### Rotate Around Y-Axis
```cpp
HepRotation& rotateY(double delta)
```
Rotates around y-axis by angle delta (radians).
Equivalent to: R = RotationY(delta) × R

### Rotate Around Z-Axis
```cpp
HepRotation& rotateZ(double delta)
```
Rotates around z-axis by angle delta (radians).
Equivalent to: R = RotationZ(delta) × R

**Usage Example:**
```cpp
G4RotationMatrix rm;

// Sequential rotations (order matters!)
rm.rotateZ(M_PI/4);   // First rotate around z
rm.rotateY(M_PI/6);   // Then around y (in rotated frame)
rm.rotateX(M_PI/3);   // Finally around x (in twice-rotated frame)
```

### Rotate Around Arbitrary Axis
```cpp
HepRotation& rotate(double delta, const Hep3Vector& axis)
HepRotation& rotate(double delta, const Hep3Vector* axis)
```
Rotates around specified vector by angle delta.
Equivalent to: R = Rotation(delta, axis) × R

**Usage Example:**
```cpp
G4RotationMatrix rm;
G4ThreeVector customAxis(1, 1, 1);
rm.rotate(M_PI/4, customAxis.unit());
```

### Rotate Local Axes
```cpp
HepRotation& rotateAxes(const Hep3Vector& newX,
                        const Hep3Vector& newY,
                        const Hep3Vector& newZ)
```
Rotation of local axes defined by 3 orthonormal vectors (Geant4).
Equivalent to: R = Rotation(newX, newY, newZ) × R

**Usage Example:**
```cpp
G4RotationMatrix rm;
G4ThreeVector localX, localY, localZ;  // define new coordinate system
rm.rotateAxes(localX, localY, localZ);
```

## Inverse

```cpp
HepRotation inverse() const
```
Returns the inverse rotation (transpose for orthogonal matrices).

```cpp
HepRotation& invert()
```
Inverts the rotation matrix in place.

**Usage Example:**
```cpp
G4RotationMatrix rm;
rm.rotateZ(M_PI/4);

G4RotationMatrix inverse = rm.inverse();
G4RotationMatrix identity = rm * inverse;  // Should be identity

rm.invert();  // rm is now the inverse
```

## Matrix Properties and Correction

### Norm
```cpp
double norm2() const
```
Returns distance² from identity: 3 - Tr(this).

### Rectify
```cpp
void rectify()
```
Corrects accumulated roundoff errors in the rotation matrix.
Averages the matrix with transpose of its actual inverse, then reconstructs
a proper rotation from axis and angle.

**Usage Example:**
```cpp
G4RotationMatrix rm;
// ... many operations that might accumulate errors ...
rm.rectify();  // Restore perfect orthonormality
```

### Decomposition
```cpp
void decompose(HepAxisAngle& rotation, Hep3Vector& boost) const
void decompose(Hep3Vector& boost, HepAxisAngle& rotation) const
```
Trivial for pure rotations (boost vector is always zero).

## Tolerance

```cpp
static double getTolerance()
static double setTolerance(double tol)
```
Get/set tolerance for isNear() comparisons.

## I/O Operations

```cpp
std::ostream& print(std::ostream& os) const
```
Prints aligned, six-digit-accurate rotation matrix.

```cpp
std::ostream& operator << (std::ostream& os, const HepRotation& r)
```
Stream output operator.

**Usage Example:**
```cpp
G4RotationMatrix rm;
rm.rotateY(M_PI/4);
G4cout << "Rotation matrix:\n" << rm << G4endl;
```

## Static Constants

```cpp
static const HepRotation IDENTITY;
```
Predefined identity rotation.

**Usage Example:**
```cpp
G4RotationMatrix rm = G4RotationMatrix::IDENTITY;
```

## Performance Notes

1. **Specialized Rotations**: Use rotateX(), rotateY(), rotateZ() instead of generic rotate() for axis-aligned rotations - they're optimized.
2. **Rotation Composition**: Minimize number of rotation compositions as matrix multiplication is expensive.
3. **Cache Rotations**: If the same rotation is applied repeatedly, cache the rotation matrix.
4. **Rectification**: Only call rectify() when necessary (e.g., after many compositions).

## Thread Safety

G4RotationMatrix is **thread-safe** for const operations:
- Applying rotations to vectors
- Reading matrix elements
- Calling const member functions

**Not thread-safe**: Modifying shared rotation matrices from multiple threads.

**Thread-Safe Usage:**
```cpp
// Thread-safe: each thread has own matrix
void RotateParticle(G4Track* track) {
    G4RotationMatrix localRot;
    localRot.rotateZ(angle);
    G4ThreeVector newDir = localRot * track->GetMomentumDirection();
}

// NOT thread-safe without synchronization
G4RotationMatrix sharedRot;  // global
// Multiple threads: sharedRot.rotateZ(angle);  // UNSAFE
```

## Related Classes

- **[G4ThreeVector](g4threevector.md)**: 3D vectors that are rotated by this class
- **[G4Transform3D](g4transform3d.md)**: Combined rotation and translation
- **G4LorentzRotation**: 4D rotations including boosts
- **HepRotationX, HepRotationY, HepRotationZ**: Specialized single-axis rotations

## Physics Application Examples

### 1. Detector Placement
```cpp
// Rotate detector module
G4RotationMatrix* detRot = new G4RotationMatrix();
detRot->rotateY(90*deg);  // Face detector along x
detRot->rotateZ(phi);      // Position around beam

// Use in physical volume placement
new G4PVPlacement(detRot, position, logicalVolume, ...);
```

### 2. Particle Scattering
```cpp
// Rotate momentum after scattering
G4ThreeVector momentum = track->GetMomentum();
double scatterAngle = ...;  // from physics process
double azimuthal = G4UniformRand() * 2*M_PI;

G4RotationMatrix scatter;
scatter.rotateY(scatterAngle);
scatter.rotateZ(azimuthal);

G4ThreeVector newMomentum = scatter * momentum;
```

### 3. Coordinate System Transformations
```cpp
// Transform from local to global coordinates
G4RotationMatrix localToGlobal;
// ... set based on detector orientation ...

G4ThreeVector localPosition(x_local, y_local, z_local);
G4ThreeVector globalPosition = localToGlobal * localPosition + offset;

// Inverse transformation
G4ThreeVector backToLocal = localToGlobal.inverse() * (globalPosition - offset);
```

### 4. Polarization Vector Rotation
```cpp
// Rotate polarization vector with momentum
G4ThreeVector polarization = track->GetPolarization();
G4RotationMatrix rot;
rot.rotate(angle, axis);

G4ThreeVector newPolarization = rot * polarization;
track->SetPolarization(newPolarization);
```

### 5. Magnetic Field Rotation
```cpp
// Particle precession in magnetic field
G4ThreeVector Bfield(0, 0, 1*tesla);
double cyclotronFreq = charge * Bfield.mag() / momentum.mag();
double angle = cyclotronFreq * deltaTime;

G4RotationMatrix precession;
precession.rotate(angle, Bfield.unit());

G4ThreeVector spin = track->GetSpin();
spin = precession * spin;
```

### 6. Crystal Lattice Orientation
```cpp
// Define crystal axes
G4ThreeVector a1(1, 0, 0);
G4ThreeVector a2(0, 1, 0);
G4ThreeVector a3(0, 0, 1);

// Rotate to align with beam
G4RotationMatrix crystalRot;
crystalRot.rotateY(15*deg);  // channeling angle

G4ThreeVector a1_lab = crystalRot * a1;
```

### 7. Composite Rotations
```cpp
// Multiple rotation steps
G4RotationMatrix totalRot;

// Rotate to beam frame
totalRot.rotateY(-beamAngle);

// Apply physics rotation
totalRot.rotate(scatterAngle, scatterAxis);

// Rotate back
totalRot.rotateY(beamAngle);

G4ThreeVector finalDirection = totalRot * initialDirection;
```

### 8. Reference Frame Alignment
```cpp
// Align coordinate system to track direction
G4ThreeVector trackDir = track->GetMomentumDirection();
G4ThreeVector perpDir1 = trackDir.orthogonal().unit();
G4ThreeVector perpDir2 = trackDir.cross(perpDir1);

G4RotationMatrix alignToTrack(perpDir1, perpDir2, trackDir);

// Now use this to transform quantities to track frame
G4ThreeVector transverse = alignToTrack.inverse() * someVector;
```

## Common Patterns

### Euler Angle Construction
```cpp
// ZYZ Euler convention (Goldstein)
G4RotationMatrix rm;
rm.rotateZ(phi);
rm.rotateY(theta);
rm.rotateZ(psi);

// Or directly
G4RotationMatrix rm2(phi, theta, psi);
```

### Axis-Angle to Matrix
```cpp
G4ThreeVector axis = direction.unit();
double angle = ...;
G4RotationMatrix rm(axis, angle);
```

### Active vs Passive Rotations
```cpp
// Active: rotate vector
G4ThreeVector v_rotated = rotation * v;

// Passive: change coordinate system (use inverse)
G4ThreeVector v_newCoords = rotation.inverse() * v;
```

### Combining Rotations (Order Matters!)
```cpp
G4RotationMatrix R1, R2;
// R1 * R2 means: apply R2 first, then R1
// R2 * R1 means: apply R1 first, then R2
// Generally: R1 * R2 ≠ R2 * R1
```

### Extract Rotation Axis from Two Vectors
```cpp
G4ThreeVector v1, v2;  // initial and final directions
G4ThreeVector axis = v1.cross(v2).unit();
double angle = v1.angle(v2);
G4RotationMatrix rm(axis, angle);
```

## Common Pitfalls

1. **Rotation Order**: Rotations don't commute! rotateX().rotateY() ≠ rotateY().rotateX()
2. **Memory Management**: When using with G4PVPlacement, pass pointer (new G4RotationMatrix)
3. **Unit Vectors**: Axis must be unit vector for axis-angle construction
4. **Active vs Passive**: Remember which direction you're transforming
5. **Accumulating Errors**: Use rectify() after many operations

## Compilation Requirements

**Include Header:**
```cpp
#include "G4RotationMatrix.hh"
```

Automatically includes G4ThreeVector.hh since rotations operate on vectors.

## See Also

- CLHEP Rotation Documentation
- Goldstein, "Classical Mechanics" (Euler angle conventions)
- Geant4 User's Guide: Detector Description
- [G4ThreeVector documentation](g4threevector.md)

---

**Note**: G4RotationMatrix is essential for geometry definition and coordinate transformations throughout Geant4. Understanding rotation composition and conventions is critical for correct detector modeling and physics implementation.
