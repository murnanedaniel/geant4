# G4Vector3D API Documentation

## Overview

`G4Vector3D` represents a three-dimensional vector in Euclidean space. It is an alias to CLHEP's `HepGeom::Vector3D<G4double>` template instantiation. Vectors are fundamental for representing displacements, directions, momenta, and forces in Geant4 simulations.

Unlike points, vectors represent magnitudes and directions rather than specific locations. They support vector algebra operations including addition, scaling, dot products, and cross products.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/G4Vector3D.hh`
**Implementation:** CLHEP library (`CLHEP/Geometry/Vector3D.h`)
:::

## Type Definition

`source/global/HEPGeometry/include/G4Vector3D.hh:34`

```cpp
using G4Vector3D = HepGeom::Vector3D<G4double>;
```

**Purpose:** 3D vector with double precision components

**Internal Representation:**
- Three `G4double` values (x, y, z)
- Approximately 24 bytes (3 × 8 bytes)

## Constructors

```cpp
// Default constructor - zero vector (0,0,0)
G4Vector3D();

// Component constructor
G4Vector3D(G4double x, G4double y, G4double z);

// Copy constructor
G4Vector3D(const G4Vector3D& other);

// From CLHEP ThreeVector
G4Vector3D(const CLHEP::Hep3Vector& vec);

// From two points (displacement vector)
G4Vector3D(const G4Point3D& from, const G4Point3D& to);
```

## Accessors

### Component Access

```cpp
// Get components
G4double x() const;
G4double y() const;
G4double z() const;

// Set components
void setX(G4double x);
void setY(G4double y);
void setZ(G4double z);

// Set all at once
void set(G4double x, G4double y, G4double z);
```

### Array-Style Access

```cpp
// Access by index (0=x, 1=y, 2=z)
G4double operator[](int i) const;
G4double& operator[](int i);

// Example
G4Vector3D vec(1, 2, 3);
G4double xComp = vec[0];  // 1
G4double yComp = vec[1];  // 2
```

### Magnitude and Direction

```cpp
// Vector magnitude (length)
G4double mag() const;
G4double mag2() const;  // Squared magnitude (faster)

// Unit vector (normalized direction)
G4Vector3D unit() const;

// Perpendicular vector
G4Vector3D perpendicular() const;

// Angle with another vector
G4double angle(const G4Vector3D& other) const;
```

## Vector Operations

### Arithmetic Operations

```cpp
// Vector addition
G4Vector3D operator + (const G4Vector3D& other) const;
G4Vector3D& operator += (const G4Vector3D& other);

// Vector subtraction
G4Vector3D operator - (const G4Vector3D& other) const;
G4Vector3D& operator -= (const G4Vector3D& other);

// Unary negation
G4Vector3D operator - () const;

// Scalar multiplication
G4Vector3D operator * (G4double scalar) const;
G4Vector3D& operator *= (G4double scalar);

// Scalar division
G4Vector3D operator / (G4double scalar) const;
G4Vector3D& operator /= (G4double scalar);
```

### Vector Products

```cpp
// Dot product (scalar product)
G4double dot(const G4Vector3D& other) const;
G4double operator * (const G4Vector3D& other) const;  // Same as dot

// Cross product (vector product)
G4Vector3D cross(const G4Vector3D& other) const;
```

### Comparison

```cpp
// Equality comparison
bool operator == (const G4Vector3D& other) const;
bool operator != (const G4Vector3D& other) const;
```

## Transformations

### Rotation

```cpp
// Transform by rotation matrix or full transformation
G4Vector3D operator * (const G4Transform3D& transform) const;

// Note: Transformations apply rotation only (no translation for vectors)
```

## Usage Examples

### Basic Vector Operations

```cpp
#include "G4Vector3D.hh"

// Create vectors
G4Vector3D zero;                      // (0, 0, 0)
G4Vector3D momentum(10*GeV, 0, 0);   // Momentum in X direction
G4Vector3D direction(1, 1, 0);        // Diagonal direction

// Vector addition
G4Vector3D sum = momentum + direction;

// Scalar multiplication
G4Vector3D doubled = 2.0 * momentum;

// Magnitude
G4double length = direction.mag();    // sqrt(2)
G4cout << "Vector length: " << length << G4endl;

// Normalization (unit vector)
G4Vector3D unitDir = direction.unit();
G4cout << "Unit direction: " << unitDir << G4endl;
G4cout << "Magnitude: " << unitDir.mag() << G4endl;  // 1.0
```

### Direction and Angles

```cpp
// Calculate angle between vectors
G4Vector3D v1(1, 0, 0);
G4Vector3D v2(0, 1, 0);
G4double angle = v1.angle(v2);
G4cout << "Angle: " << angle/deg << " degrees" << G4endl;  // 90

// Find direction from one point to another
G4Point3D start(0, 0, 0);
G4Point3D end(10*cm, 5*cm, 0);
G4Vector3D direction = end - start;
G4Vector3D unitDirection = direction.unit();

// Check if vectors are parallel
bool AreParallel(const G4Vector3D& v1, const G4Vector3D& v2,
                 G4double tolerance = 1e-6) {
    G4double crossMag = v1.cross(v2).mag();
    return crossMag < tolerance;
}

// Check if vectors are perpendicular
bool ArePerpendicular(const G4Vector3D& v1, const G4Vector3D& v2,
                      G4double tolerance = 1e-6) {
    G4double dotProd = v1.dot(v2);
    return std::abs(dotProd) < tolerance;
}
```

### Dot and Cross Products

```cpp
// Dot product - measures alignment
G4Vector3D v1(1, 0, 0);
G4Vector3D v2(1, 1, 0);
G4double dot = v1.dot(v2);  // 1.0

// Projection of v2 onto v1
G4double projection = v2.dot(v1.unit());
G4Vector3D projectedVector = projection * v1.unit();

// Cross product - perpendicular vector
G4Vector3D xAxis(1, 0, 0);
G4Vector3D yAxis(0, 1, 0);
G4Vector3D zAxis = xAxis.cross(yAxis);  // (0, 0, 1)

// Cross product magnitude = area of parallelogram
G4double area = v1.cross(v2).mag();

// Triple scalar product - volume of parallelepiped
G4double volume = v1.dot(v2.cross(v3));
```

### Physics Applications

```cpp
// Particle momentum calculations
void AnalyzeParticle(const G4Track* track) {
    // Get momentum vector
    G4ThreeVector p3 = track->GetMomentum();
    G4Vector3D momentum(p3.x(), p3.y(), p3.z());

    // Transverse momentum (perpendicular to beam)
    G4Vector3D beamAxis(0, 0, 1);
    G4double pLong = momentum.dot(beamAxis);
    G4Vector3D pTransverse = momentum - pLong * beamAxis;
    G4double pT = pTransverse.mag();

    G4cout << "Longitudinal momentum: " << pLong/GeV << " GeV" << G4endl;
    G4cout << "Transverse momentum: " << pT/GeV << " GeV" << G4endl;

    // Momentum direction
    G4Vector3D direction = momentum.unit();
    G4double theta = direction.angle(beamAxis);
    G4cout << "Angle with beam: " << theta/deg << " degrees" << G4endl;
}

// Scattering angle calculation
G4double ScatteringAngle(const G4Vector3D& initialMomentum,
                        const G4Vector3D& finalMomentum) {
    // Angle between initial and final momentum
    G4Vector3D initDir = initialMomentum.unit();
    G4Vector3D finalDir = finalMomentum.unit();
    return initDir.angle(finalDir);
}

// Momentum transfer
G4Vector3D MomentumTransfer(const G4Vector3D& pInitial,
                           const G4Vector3D& pFinal) {
    return pFinal - pInitial;
}
```

### Coordinate System Operations

```cpp
// Construct orthonormal basis from one vector
struct OrthonormalBasis {
    G4Vector3D u;  // Original direction (normalized)
    G4Vector3D v;  // Perpendicular
    G4Vector3D w;  // Perpendicular to both
};

OrthonormalBasis MakeBasis(const G4Vector3D& direction) {
    OrthonormalBasis basis;

    // Normalize input
    basis.u = direction.unit();

    // Find perpendicular vector
    basis.v = basis.u.perpendicular().unit();

    // Complete the basis
    basis.w = basis.u.cross(basis.v);

    return basis;
}

// Project vector onto plane
G4Vector3D ProjectOntoPlane(const G4Vector3D& vector,
                           const G4Vector3D& planeNormal) {
    G4Vector3D normal = planeNormal.unit();
    G4double component = vector.dot(normal);
    return vector - component * normal;
}

// Reflect vector across plane
G4Vector3D ReflectAcrossPlane(const G4Vector3D& vector,
                             const G4Vector3D& planeNormal) {
    G4Vector3D normal = planeNormal.unit();
    G4double component = vector.dot(normal);
    return vector - 2.0 * component * normal;
}
```

### Rotation Operations

```cpp
// Rotate vector around axis
G4Vector3D RotateAroundAxis(const G4Vector3D& vector,
                           const G4Vector3D& axis,
                           G4double angle) {
    G4Transform3D rotation(G4Rotate3D(angle, axis), G4ThreeVector());
    return rotation * vector;
}

// Example: rotate around Z-axis
G4Vector3D vec(1, 0, 0);
G4Vector3D rotated = RotateAroundAxis(vec, G4Vector3D(0, 0, 1), 90*deg);
// Result: approximately (0, 1, 0)

// Rodrigues' rotation formula (direct calculation)
G4Vector3D RodriguesRotation(const G4Vector3D& v,
                            const G4Vector3D& k,
                            G4double theta) {
    G4Vector3D kUnit = k.unit();
    G4double cosTheta = std::cos(theta);
    G4double sinTheta = std::sin(theta);

    return v * cosTheta +
           kUnit.cross(v) * sinTheta +
           kUnit * (kUnit.dot(v)) * (1 - cosTheta);
}
```

### Geometric Calculations

```cpp
// Distance from point to line
G4double DistanceToLine(const G4Point3D& point,
                       const G4Point3D& linePoint,
                       const G4Vector3D& lineDirection) {
    G4Vector3D toPoint = point - linePoint;
    G4Vector3D perpComponent = toPoint.cross(lineDirection.unit());
    return perpComponent.mag();
}

// Distance from point to plane
G4double DistanceToPlane(const G4Point3D& point,
                        const G4Point3D& planePoint,
                        const G4Vector3D& planeNormal) {
    G4Vector3D toPoint = point - planePoint;
    return std::abs(toPoint.dot(planeNormal.unit()));
}

// Check if vector points away from surface
bool IsOutgoing(const G4Vector3D& direction,
                const G4Vector3D& surfaceNormal) {
    return direction.dot(surfaceNormal) > 0;
}
```

### Interpolation and Smoothing

```cpp
// Linear interpolation between vectors (LERP)
G4Vector3D Lerp(const G4Vector3D& start,
                const G4Vector3D& end,
                G4double t) {
    return start + t * (end - start);
}

// Spherical linear interpolation (SLERP) - for directions
G4Vector3D Slerp(const G4Vector3D& start,
                 const G4Vector3D& end,
                 G4double t) {
    G4Vector3D v1 = start.unit();
    G4Vector3D v2 = end.unit();

    G4double dot = v1.dot(v2);
    G4double theta = std::acos(std::clamp(dot, -1.0, 1.0));

    if (std::abs(theta) < 1e-6) {
        return Lerp(v1, v2, t);  // Nearly parallel
    }

    G4double sinTheta = std::sin(theta);
    G4double a = std::sin((1-t) * theta) / sinTheta;
    G4double b = std::sin(t * theta) / sinTheta;

    return a * v1 + b * v2;
}
```

### Vector Field Sampling

```cpp
// Sample magnetic field at position
G4Vector3D GetFieldAtPoint(const G4Point3D& position) {
    G4double field[6] = {0};
    G4double point[4] = {position.x(), position.y(), position.z(), 0};

    G4FieldManager* fieldMgr =
        G4TransportationManager::GetTransportationManager()
            ->GetFieldManager();

    const G4Field* field = fieldMgr->GetDetectorField();
    if (field) {
        field->GetFieldValue(point, field);
        return G4Vector3D(field[0], field[1], field[2]);
    }

    return G4Vector3D();
}

// Compute gradient of scalar field
G4Vector3D Gradient(std::function<G4double(const G4Point3D&)> scalarField,
                   const G4Point3D& point,
                   G4double h = 1e-6) {
    G4double fx = scalarField(G4Point3D(point.x()+h, point.y(), point.z()));
    G4double fx0 = scalarField(G4Point3D(point.x()-h, point.y(), point.z()));
    G4double fy = scalarField(G4Point3D(point.x(), point.y()+h, point.z()));
    G4double fy0 = scalarField(G4Point3D(point.x(), point.y()-h, point.z()));
    G4double fz = scalarField(G4Point3D(point.x(), point.y(), point.z()+h));
    G4double fz0 = scalarField(G4Point3D(point.x(), point.y(), point.z()-h));

    return G4Vector3D((fx - fx0)/(2*h),
                     (fy - fy0)/(2*h),
                     (fz - fz0)/(2*h));
}
```

## Common Patterns

### Unit Vector Operations

```cpp
// Always normalize directions before use
G4Vector3D direction = (endPoint - startPoint).unit();

// Safe normalization (check for zero vector)
G4Vector3D SafeUnit(const G4Vector3D& vec,
                   const G4Vector3D& defaultDir = G4Vector3D(0,0,1)) {
    G4double mag = vec.mag();
    if (mag < 1e-10) {
        return defaultDir;
    }
    return vec / mag;
}
```

### Performance Optimization

```cpp
// Use mag2() for comparisons (avoid square root)
if (velocity.mag2() < threshold*threshold) {
    // Slow particle
}

// Cache unit vectors if used multiple times
G4Vector3D direction = momentum.unit();  // Compute once
G4double proj1 = vec1.dot(direction);    // Reuse
G4double proj2 = vec2.dot(direction);    // Reuse
```

### Vector Decomposition

```cpp
// Decompose vector into parallel and perpendicular components
struct VectorComponents {
    G4Vector3D parallel;
    G4Vector3D perpendicular;
};

VectorComponents Decompose(const G4Vector3D& vector,
                          const G4Vector3D& axis) {
    VectorComponents comp;
    G4Vector3D axisUnit = axis.unit();
    comp.parallel = vector.dot(axisUnit) * axisUnit;
    comp.perpendicular = vector - comp.parallel;
    return comp;
}
```

## Thread Safety

`G4Vector3D` is:
- **Value type:** Copied, not shared
- **No mutable state:** Safe for concurrent use
- **Thread-safe:** Each thread has independent instances

Vectors can be created and manipulated safely in multi-threaded applications without synchronization.

## Performance Notes

1. **Prefer mag2() over mag():** Avoid expensive square root
   ```cpp
   if (vec.mag2() < r*r) { /* ... */ }  // Fast
   if (vec.mag() < r) { /* ... */ }     // Slow
   ```

2. **Cache unit vectors:** Normalization involves division and square root
   ```cpp
   G4Vector3D dir = vec.unit();  // Compute once
   // Use dir multiple times
   ```

3. **Pass by const reference:** Avoid copies
   ```cpp
   G4double Calculate(const G4Vector3D& vec);  // Good
   G4double Calculate(G4Vector3D vec);         // Copies 24 bytes
   ```

4. **Use compound operators:** More efficient than creating temporaries
   ```cpp
   vec += delta;        // Good
   vec = vec + delta;   // Creates temporary
   ```

## Related Classes

- [G4Point3D](g4point3d.md) - 3D points (locations in space)
- [G4Normal3D](g4normal3d.md) - Surface normals (specialized vectors)
- [G4Transform3D](g4transform3d.md) - Transformations applied to vectors
- [G4ThreeVector](g4threevector.md) - Alternative 3D vector class
- [G4LorentzVector](g4lorentzvector.md) - 4D energy-momentum vectors

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- [geomdefs](geomdefs.md) - Geometry definitions and constants
- CLHEP Vector3D documentation - Detailed CLHEP implementation

---

::: info Source Reference
Type definition in:
- Header: `source/global/HEPGeometry/include/G4Vector3D.hh`
- Implementation: CLHEP library (`CLHEP/Geometry/Vector3D.h`)
:::
