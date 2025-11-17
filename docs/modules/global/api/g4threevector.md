# G4ThreeVector

## Overview

`G4ThreeVector` is THE most fundamental and widely used class in Geant4, representing a 3-dimensional vector with double precision components. It is used throughout Geant4 for positions, momenta, directions, electromagnetic fields, and virtually any spatial or vector quantity.

**Critical Note:** `G4ThreeVector` is a typedef to `CLHEP::Hep3Vector`, inheriting all functionality from the CLHEP (Class Library for High Energy Physics) vector library.

## Source Location

**Header Files:**
- Geant4 wrapper: `source/global/management/include/G4ThreeVector.hh` (lines 30-38)
- CLHEP implementation: `source/externals/clhep/include/CLHEP/Vector/ThreeVector.h` (lines 36-396)

**Type Definition:**
```cpp
using G4ThreeVector = CLHEP::Hep3Vector;
```

## Purpose

G4ThreeVector provides a complete mathematical framework for 3D vector operations in particle physics simulations, including:
- Cartesian (x, y, z), spherical (r, theta, phi), and cylindrical (rho, phi, z) coordinate systems
- Vector arithmetic and geometric operations
- Rotations and transformations
- Physics-specific operations (pseudorapidity, rapidity, etc.)

## Common Use Cases

1. **Particle Positions**: Track positions in detector geometries
2. **Particle Momenta**: Momentum vectors in physics processes
3. **Direction Vectors**: Unit vectors for particle propagation
4. **Electromagnetic Fields**: Electric and magnetic field vectors
5. **Vertex Positions**: Interaction and decay vertex locations
6. **Normal Vectors**: Surface normals in geometry
7. **Axis Definitions**: Rotation axes and reference frames

## Constructors

### Default and Basic Constructors
```cpp
Hep3Vector()
```
Default constructor, initializes to (0, 0, 0).

```cpp
explicit Hep3Vector(double x)
```
Single argument constructor, creates vector (x, 0, 0).

```cpp
Hep3Vector(double x, double y)
```
Two argument constructor, creates vector (x, y, 0).

```cpp
Hep3Vector(double x, double y, double z)
```
Standard constructor for Cartesian coordinates.

**Usage Example:**
```cpp
G4ThreeVector origin;                          // (0, 0, 0)
G4ThreeVector position(10*cm, 20*cm, 30*cm);  // particle position
G4ThreeVector momentum(0.5*GeV, 0.3*GeV, 1.0*GeV);  // momentum vector
G4ThreeVector direction(0, 0, 1);              // unit z direction
```

### Copy and Move Constructors
```cpp
Hep3Vector(const Hep3Vector &)
Hep3Vector(Hep3Vector &&)
```
Copy and move constructors (move is default implementation).

## Public Member Constants

```cpp
enum { X=0, Y=1, Z=2, NUM_COORDINATES=3, SIZE=NUM_COORDINATES };
```
Safe indexing constants for use with matrices and arrays.

## Component Access

### Cartesian Coordinates

#### Getters
```cpp
double x() const
double y() const
double z() const
```
Return individual Cartesian components.

```cpp
double getX() const
double getY() const
double getZ() const
```
Alternative getters (synonyms for x(), y(), z()).

#### Setters
```cpp
void setX(double x)
void setY(double y)
void setZ(double z)
void set(double x, double y, double z)
```
Set Cartesian components individually or all at once.

**Usage Example:**
```cpp
G4ThreeVector v(1, 2, 3);
double x = v.x();           // x = 1
v.setY(5);                  // v is now (1, 5, 3)
v.set(10, 20, 30);          // v is now (10, 20, 30)
```

### Index-Based Access

```cpp
double operator () (int i) const
double operator [] (int i) const
double& operator () (int i)
double& operator [] (int i)
```
Access components by 0-based index (0=x, 1=y, 2=z).

**Usage Example:**
```cpp
G4ThreeVector v(1, 2, 3);
double y = v[1];            // y = 2
v[2] = 10;                  // v is now (1, 2, 10)
```

## Spherical Coordinates

### Accessors
```cpp
double phi() const
```
Returns azimuthal angle φ in radians (angle in x-y plane from x-axis).

```cpp
double theta() const
```
Returns polar angle θ in radians (angle from z-axis).

```cpp
double getPhi() const
double getTheta() const
```
Alternative accessors (synonyms).

```cpp
double cosTheta() const
```
Returns cos(θ), faster than computing cosine of theta().

```cpp
double cos2Theta() const
```
Returns cos²(θ), even faster than cosTheta().

```cpp
double mag() const
double mag2() const
```
Returns magnitude (r) and magnitude squared (r²).

```cpp
double getR() const
double r() const
```
Synonyms for mag() - returns magnitude in spherical coordinates.

### Setters
```cpp
void setPhi(double phi)
```
Set φ keeping magnitude and θ constant.

```cpp
void setTheta(double theta)
```
Set θ keeping magnitude and φ constant.

```cpp
void setMag(double r)
```
Set magnitude keeping θ and φ constant.

```cpp
void setR(double s)
```
Synonym for setMag().

```cpp
void setRThetaPhi(double r, double theta, double phi)
```
Set all spherical coordinates at once.

```cpp
void setREtaPhi(double r, double eta, double phi)
```
Set using magnitude, pseudorapidity, and φ.

**Usage Example:**
```cpp
G4ThreeVector v(1, 1, 1);
double theta = v.theta();       // polar angle
double phi = v.phi();           // azimuthal angle
double r = v.mag();             // magnitude = sqrt(3)

v.setRThetaPhi(10, M_PI/4, M_PI/2);  // set spherical coordinates
```

## Cylindrical Coordinates

### Accessors
```cpp
double perp() const
double perp2() const
```
Returns transverse component (ρ) and ρ² in cylindrical coordinates.

```cpp
double rho() const
double getRho() const
```
Synonyms for perp() - transverse component.

### Setters
```cpp
void setPerp(double rho)
```
Set transverse component keeping φ and z constant.

```cpp
void setRho(double s)
```
Synonym for setPerp().

```cpp
void setRhoPhiZ(double rho, double phi, double z)
```
Set cylindrical coordinates directly.

```cpp
void setRhoPhiTheta(double rho, double phi, double theta)
```
Set using ρ, φ, and θ (θ determines z).

```cpp
void setRhoPhiEta(double rho, double phi, double eta)
```
Set using ρ, φ, and pseudorapidity.

```cpp
void setCylTheta(double theta)
```
Set θ while keeping transverse component and φ fixed.

### Relative to Another Vector
```cpp
double perp(const Hep3Vector& v) const
double perp2(const Hep3Vector& v) const
```
Transverse component with respect to given axis.

**Usage Example:**
```cpp
G4ThreeVector momentum(px, py, pz);
double pT = momentum.perp();            // transverse momentum
double pT2 = momentum.perp2();          // pT squared (faster)

G4ThreeVector beamAxis(0, 0, 1);
double pT_beam = momentum.perp(beamAxis);  // pT w.r.t. beam
```

## Pseudorapidity and Rapidity

```cpp
double pseudoRapidity() const
double eta() const
double getEta() const
```
Returns pseudorapidity η = -ln(tan(θ/2)). Critical for collider physics.

```cpp
void setEta(double p)
```
Set pseudorapidity keeping magnitude and φ fixed.

```cpp
void setCylEta(double p)
```
Set pseudorapidity keeping transverse component and φ fixed.

```cpp
double rapidity() const
```
Returns rapidity = arctanh(z/r).

```cpp
double rapidity(const Hep3Vector& v2) const
```
Rapidity with respect to specified direction.

```cpp
double coLinearRapidity() const
```
Inverse tanh of beta (for velocity vectors with c=1).

**Usage Example:**
```cpp
G4ThreeVector momentum(px, py, pz);
double eta = momentum.pseudoRapidity();  // pseudorapidity for detector cuts
double y = momentum.rapidity();          // true rapidity
```

## Vector Arithmetic Operators

### Assignment
```cpp
Hep3Vector& operator = (const Hep3Vector& v)
Hep3Vector& operator = (Hep3Vector&& v)
```
Copy and move assignment.

### Addition and Subtraction
```cpp
Hep3Vector& operator += (const Hep3Vector& v)
Hep3Vector& operator -= (const Hep3Vector& v)
Hep3Vector operator - () const
```
In-place addition, subtraction, and unary minus.

**Global Operators:**
```cpp
Hep3Vector operator + (const Hep3Vector& v1, const Hep3Vector& v2)
Hep3Vector operator - (const Hep3Vector& v1, const Hep3Vector& v2)
```

**Usage Example:**
```cpp
G4ThreeVector p1(1, 2, 3);
G4ThreeVector p2(4, 5, 6);
G4ThreeVector sum = p1 + p2;        // (5, 7, 9)
G4ThreeVector diff = p1 - p2;       // (-3, -3, -3)
p1 += p2;                           // p1 is now (5, 7, 9)
G4ThreeVector neg = -p1;            // negate all components
```

### Scaling
```cpp
Hep3Vector& operator *= (double a)
Hep3Vector& operator /= (double a)
```
In-place multiplication and division by scalar.

**Global Operators:**
```cpp
Hep3Vector operator * (const Hep3Vector& v, double a)
Hep3Vector operator * (double a, const Hep3Vector& v)
Hep3Vector operator / (const Hep3Vector& v, double a)
```

**Usage Example:**
```cpp
G4ThreeVector v(1, 2, 3);
G4ThreeVector scaled = v * 2.5;     // (2.5, 5.0, 7.5)
G4ThreeVector divided = v / 2.0;    // (0.5, 1.0, 1.5)
v *= 10;                            // v is now (10, 20, 30)
```

## Comparison Operators

```cpp
bool operator == (const Hep3Vector& v) const
bool operator != (const Hep3Vector& v) const
```
Exact equality and inequality comparisons.

```cpp
bool operator < (const Hep3Vector& v) const
bool operator > (const Hep3Vector& v) const
bool operator <= (const Hep3Vector& v) const
bool operator >= (const Hep3Vector& v) const
```
Dictionary ordering: first by z, then y, then x component.

```cpp
int compare(const Hep3Vector& v) const
```
Returns -1, 0, or 1 for dictionary comparison.

**Usage Example:**
```cpp
G4ThreeVector v1(1, 2, 3);
G4ThreeVector v2(1, 2, 3);
if (v1 == v2) { /* exact match */ }
if (v1 < v2) { /* dictionary order */ }
```

## Approximate Comparisons

```cpp
bool isNear(const Hep3Vector& v, double epsilon = tolerance) const
```
Checks if vectors are equal within RELATIVE tolerance (default 2.2E-14).
Condition: |v1 - v2|² ≤ epsilon² × |v1·v2|

```cpp
double howNear(const Hep3Vector& v) const
```
Returns sqrt(|v1-v2|²/v1·v2) with maximum of 1.

```cpp
double diff2(const Hep3Vector& v) const
```
Returns |v1 - v2|² (squared difference).

```cpp
double deltaR(const Hep3Vector& v) const
```
Returns sqrt(Δη² + Δφ²) - critical for jet physics and detector analysis.

```cpp
static double setTolerance(double tol)
static double getTolerance()
```
Get/set the default tolerance for isNear().

**Usage Example:**
```cpp
G4ThreeVector v1(1.0, 2.0, 3.0);
G4ThreeVector v2(1.0 + 1e-15, 2.0, 3.0);
if (v1.isNear(v2)) { /* nearly equal */ }

double dr = jet1.deltaR(jet2);  // separation in η-φ space
```

## Vector Products

### Dot Product
```cpp
double dot(const Hep3Vector& v) const
```
Returns scalar (dot) product: v1·v2 = |v1||v2|cos(angle).

**Global Operator:**
```cpp
double operator * (const Hep3Vector& v1, const Hep3Vector& v2)
```

**Usage Example:**
```cpp
G4ThreeVector v1(1, 0, 0);
G4ThreeVector v2(0, 1, 0);
double dp = v1.dot(v2);         // 0 (orthogonal)
double dp2 = v1 * v2;           // same as dot product
```

### Cross Product
```cpp
Hep3Vector cross(const Hep3Vector& v) const
```
Returns vector (cross) product: v1 × v2, perpendicular to both vectors.

**Usage Example:**
```cpp
G4ThreeVector x(1, 0, 0);
G4ThreeVector y(0, 1, 0);
G4ThreeVector z = x.cross(y);   // (0, 0, 1)

// Normal to a plane defined by two vectors
G4ThreeVector normal = edge1.cross(edge2).unit();
```

## Angles Between Vectors

```cpp
double angle(const Hep3Vector& v) const
double theta(const Hep3Vector& v2) const
```
Returns angle (in radians) between two vectors. theta() is synonym for angle().

```cpp
double angle() const
```
Returns angle against z-axis (synonym for theta()).

```cpp
double cosTheta(const Hep3Vector& v2) const
double cos2Theta(const Hep3Vector& v2) const
```
Cosine and cosine squared of angle between two vectors.

```cpp
double polarAngle(const Hep3Vector& v2) const
double polarAngle(const Hep3Vector& v2, const Hep3Vector& ref) const
```
Polar angle difference with respect to reference direction.

```cpp
double azimAngle(const Hep3Vector& v2) const
double azimAngle(const Hep3Vector& v2, const Hep3Vector& ref) const
```
Azimuthal angle between vectors.

```cpp
double deltaPhi(const Hep3Vector& v2) const
```
Returns φ difference brought into range (-π, π].

```cpp
double eta(const Hep3Vector& v2) const
```
-ln(tan(angle/2)) between vector and reference direction.

**Usage Example:**
```cpp
G4ThreeVector momentum(px, py, pz);
G4ThreeVector beamDir(0, 0, 1);
double scatterAngle = momentum.angle(beamDir);  // scattering angle
double cosAngle = momentum.cosTheta(beamDir);   // faster

// Collider physics
G4ThreeVector jet1, jet2;
double dphi = jet1.deltaPhi(jet2);  // azimuthal separation
```

## Unit Vectors and Orthogonal Vectors

```cpp
Hep3Vector unit() const
```
Returns unit vector parallel to this vector (normalized to length 1).

```cpp
Hep3Vector orthogonal() const
```
Returns a vector orthogonal to this one.

**Usage Example:**
```cpp
G4ThreeVector v(3, 4, 0);
G4ThreeVector dir = v.unit();       // (0.6, 0.8, 0) - unit vector
double mag = dir.mag();             // 1.0

G4ThreeVector perp = v.orthogonal(); // orthogonal to v
double dp = v.dot(perp);            // ~0 (orthogonal)
```

## Projections

```cpp
Hep3Vector project() const
Hep3Vector project(const Hep3Vector& v2) const
```
Projection of vector along z-axis or along specified direction.

```cpp
Hep3Vector perpPart() const
Hep3Vector perpPart(const Hep3Vector& v2) const
```
Component perpendicular to z-axis or specified direction.

**Usage Example:**
```cpp
G4ThreeVector momentum(px, py, pz);
G4ThreeVector beamAxis(0, 0, 1);

// Longitudinal and transverse components
G4ThreeVector pLong = momentum.project(beamAxis);
G4ThreeVector pTrans = momentum.perpPart(beamAxis);
```

## Parallelism and Orthogonality Tests

```cpp
bool isParallel(const Hep3Vector& v, double epsilon = tolerance) const
double howParallel(const Hep3Vector& v) const
```
Tests if vectors are parallel within tolerance.
howParallel returns |v1×v2|/|v1·v2| (maximum 1).

```cpp
bool isOrthogonal(const Hep3Vector& v, double epsilon = tolerance) const
double howOrthogonal(const Hep3Vector& v) const
```
Tests if vectors are orthogonal within tolerance.
howOrthogonal returns |v1·v2|/|v1×v2| (maximum 1).

**Usage Example:**
```cpp
G4ThreeVector v1(1, 0, 0);
G4ThreeVector v2(2, 0, 0);
if (v1.isParallel(v2)) { /* parallel */ }

G4ThreeVector v3(0, 1, 0);
if (v1.isOrthogonal(v3)) { /* orthogonal */ }
```

## Rotations

### Basic Axis Rotations
```cpp
Hep3Vector& rotateX(double angle)
Hep3Vector& rotateY(double angle)
Hep3Vector& rotateZ(double angle)
```
Rotates vector around x, y, or z axis by angle (in radians).
Returns reference to this vector (modified in place).

**Global Functions:**
```cpp
Hep3Vector rotationXOf(const Hep3Vector& vec, double delta)
Hep3Vector rotationYOf(const Hep3Vector& vec, double delta)
Hep3Vector rotationZOf(const Hep3Vector& vec, double delta)
```
Returns new rotated vector without modifying original.

**Usage Example:**
```cpp
G4ThreeVector v(1, 0, 0);
v.rotateZ(M_PI/2);              // v is now (0, 1, 0)

G4ThreeVector rotated = rotationZOf(v, M_PI/2);  // creates new vector
```

### Arbitrary Axis Rotation
```cpp
Hep3Vector& rotate(double angle, const Hep3Vector& axis)
Hep3Vector& rotate(const Hep3Vector& axis, double angle)
```
Rotates around arbitrary axis by specified angle.

```cpp
Hep3Vector& rotate(const HepAxisAngle& ax)
```
Rotates using axis-angle structure.

**Global Function:**
```cpp
Hep3Vector rotationOf(const Hep3Vector& vec, const Hep3Vector& axis, double delta)
Hep3Vector rotationOf(const Hep3Vector& vec, const HepAxisAngle& ax)
```

**Usage Example:**
```cpp
G4ThreeVector v(1, 1, 0);
G4ThreeVector axis(0, 0, 1);
v.rotate(M_PI/4, axis);         // rotate 45° around z

// Rotate particle momentum around magnetic field direction
G4ThreeVector momentum, Bfield;
momentum.rotate(cyclotronAngle, Bfield.unit());
```

### Euler Angle Rotations
```cpp
Hep3Vector& rotate(double phi, double theta, double psi)
Hep3Vector& rotate(const HepEulerAngles& e)
```
Rotates using Euler angles (Goldstein conventions).

**Global Function:**
```cpp
Hep3Vector rotationOf(const Hep3Vector& vec, double phi, double theta, double psi)
Hep3Vector rotationOf(const Hep3Vector& vec, const HepEulerAngles& e)
```

### Reference Frame Rotation
```cpp
Hep3Vector& rotateUz(const Hep3Vector& newUz)
```
Rotates reference frame from Uz to newUz (must be unit vector).
Critical for coordinate transformations in Geant4.

### Matrix Transformations
```cpp
Hep3Vector& operator *= (const HepRotation& rot)
Hep3Vector& transform(const HepRotation& rot)
```
Apply rotation matrix to vector.

**Usage Example:**
```cpp
G4ThreeVector direction(0, 0, 1);
G4ThreeVector newAxis(1, 1, 1);
direction.rotateUz(newAxis.unit());  // transform coordinate system

G4RotationMatrix rm;
rm.rotateY(M_PI/2);
G4ThreeVector v(1, 0, 0);
v *= rm;                        // apply rotation matrix
```

## Relativistic Properties

```cpp
double beta() const
```
Returns relativistic β (magnitude) treating vector as velocity with c=1.
Will throw error if magnitude ≥ 1.

```cpp
double gamma() const
```
Returns relativistic γ = 1/sqrt(1-β²).

**Usage Example:**
```cpp
G4ThreeVector velocity = momentum / energy;  // natural units
double beta = velocity.beta();
double gamma = velocity.gamma();
double lorentzFactor = 1.0 / sqrt(1.0 - beta*beta);
```

## I/O Operations

```cpp
std::ostream& operator << (std::ostream& os, const Hep3Vector& v)
std::istream& operator >> (std::istream& is, Hep3Vector& v)
```
Stream insertion and extraction operators.

**Usage Example:**
```cpp
G4ThreeVector v(1, 2, 3);
G4cout << "Position: " << v << G4endl;

std::ifstream input("positions.dat");
G4ThreeVector position;
input >> position;
```

## Predefined Unit Vectors

```cpp
extern const Hep3Vector HepXHat;  // (1, 0, 0)
extern const Hep3Vector HepYHat;  // (0, 1, 0)
extern const Hep3Vector HepZHat;  // (0, 0, 1)
```

**Usage Example:**
```cpp
G4ThreeVector xDir = HepXHat;
G4ThreeVector customDir = 0.6*HepXHat + 0.8*HepZHat;
```

## Performance Notes

1. **Magnitude Calculations**: Use `mag2()` instead of `mag()` when possible (avoids sqrt).
2. **Angle Calculations**: Use `cosTheta()` instead of `theta()`, and `cos2Theta()` for squared values.
3. **Transverse Components**: `perp2()` is faster than `perp()`.
4. **Comparisons**: For exact comparisons on numerical results, use `isNear()` with appropriate tolerance.
5. **Unit Vectors**: Cache normalized directions if used repeatedly.

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

G4ThreeVector is **thread-safe** for const operations. Multiple threads can safely:
- Read component values
- Perform arithmetic operations creating new vectors
- Call const member functions

**Not thread-safe**: Modifying shared vectors from multiple threads without synchronization.

**Thread-Safe Usage:**
```cpp
// Thread-safe: each thread has its own vector
void ProcessEvent(const G4Event* event) {
    G4ThreeVector localPosition = event->GetPrimaryVertex()->GetPosition();
    // Safe to use localPosition in this thread
}

// NOT thread-safe without protection
G4ThreeVector sharedVector;  // global
// Multiple threads calling: sharedVector += someValue;  // UNSAFE
```

## Related Classes

- **[G4TwoVector](g4twovector.md)**: 2D vector operations
- **[G4RotationMatrix](g4rotationmatrix.md)**: 3×3 rotation matrices for transforming vectors
- **[G4LorentzVector](g4lorentzvector.md)**: 4-vector for relativistic calculations
- **[G4Transform3D](g4transform3d.md)**: Combined rotation and translation
- **G4Normal3D**: Normal vector with additional geometry-specific operations
- **G4Point3D**: Point representation (distinct from vectors)

## Physics Application Examples

### 1. Particle Tracking
```cpp
// Initial position and momentum
G4ThreeVector position(0*cm, 0*cm, 0*cm);
G4ThreeVector momentum(1.0*GeV, 0.5*GeV, 2.0*GeV);

// Direction of motion
G4ThreeVector direction = momentum.unit();

// Step forward
position += stepLength * direction;
```

### 2. Electromagnetic Field Effects
```cpp
G4ThreeVector momentum(px, py, pz);
G4ThreeVector Bfield(0, 0, 3*tesla);

// Lorentz force direction
G4ThreeVector force = momentum.cross(Bfield);

// Cyclotron motion
double omega = charge * Bfield.mag() / momentum.mag();
momentum.rotate(omega * deltaTime, Bfield.unit());
```

### 3. Scattering Calculations
```cpp
G4ThreeVector incomingDir(0, 0, 1);
double scatterAngle = ...; // from physics process
double azimuthalAngle = ...;

// Scattered direction
G4ThreeVector outgoingDir = incomingDir;
outgoingDir.rotateY(scatterAngle);
outgoingDir.rotateZ(azimuthalAngle);
```

### 4. Detector Geometry
```cpp
// Check if particle is within detector acceptance
G4ThreeVector momentum(px, py, pz);
double eta = momentum.pseudoRapidity();
double phi = momentum.phi();

if (fabs(eta) < 2.5) {  // central detector coverage
    // Particle is in acceptance
}

// Distance from beam axis
double rho = position.perp();
```

### 5. Energy-Momentum Conservation
```cpp
// Sum momenta of all particles
G4ThreeVector totalMomentum;
for (const auto* particle : particles) {
    totalMomentum += particle->GetMomentum();
}

// Check conservation
G4ThreeVector deltaP = totalMomentum - initialMomentum;
if (deltaP.mag2() < tolerance) {
    // Momentum conserved
}
```

### 6. Coordinate Transformations
```cpp
// Transform from lab frame to moving frame
G4ThreeVector labPosition(x, y, z);
G4ThreeVector boostVelocity = beamVelocity;
G4RotationMatrix rotation;
rotation.rotateY(angle);

G4ThreeVector movingFramePos = rotation * labPosition;
```

### 7. Jet Finding (Collider Physics)
```cpp
// Angular separation between particles
G4ThreeVector p1, p2;
double deltaR = p1.deltaR(p2);

if (deltaR < jetRadius) {
    // Particles belong to same jet
    G4ThreeVector jetMomentum = p1 + p2;
    double jetEta = jetMomentum.pseudoRapidity();
}
```

## Common Patterns

### Direction from Two Points
```cpp
G4ThreeVector start, end;
G4ThreeVector direction = (end - start).unit();
double distance = (end - start).mag();
```

### Reflection Off Surface
```cpp
G4ThreeVector incident, normal;
G4ThreeVector reflected = incident - 2.0 * incident.dot(normal) * normal;
```

### Perpendicular Vector Construction
```cpp
G4ThreeVector axis(ax, ay, az);
G4ThreeVector perp1 = axis.orthogonal();
G4ThreeVector perp2 = axis.cross(perp1).unit();
// Now have orthonormal basis: axis, perp1, perp2
```

## Compilation Requirements

**Include Header:**
```cpp
#include "G4ThreeVector.hh"
```

**No explicit linking** required - header-only template implementation with inline functions.

## See Also

- CLHEP Vector Package Documentation
- Geant4 User's Guide: Geometry and Tracking
- Geant4 Physics Reference Manual

---

**Note**: This class is fundamental to all of Geant4. Understanding G4ThreeVector operations is essential for implementing physics processes, detector geometries, and analysis code.
