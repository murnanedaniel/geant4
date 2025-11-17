# G4Normal3D API Documentation

## Overview

`G4Normal3D` represents a surface normal vector in three-dimensional space. It is an alias to CLHEP's `HepGeom::Normal3D<G4double>` template instantiation. Surface normals are specialized unit vectors perpendicular to surfaces, essential for geometric calculations, boundary crossing, and optical physics.

While similar to `G4Vector3D`, normals have special transformation behavior under rotations and are semantically distinct - they always represent directions perpendicular to surfaces.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/G4Normal3D.hh`
**Implementation:** CLHEP library (`CLHEP/Geometry/Normal3D.h`)
:::

## Type Definition

`source/global/HEPGeometry/include/G4Normal3D.hh:34`

```cpp
using G4Normal3D = HepGeom::Normal3D<G4double>;
```

**Purpose:** Surface normal vector with double precision components

**Key Properties:**
- Represents direction perpendicular to a surface
- Typically (but not always) normalized to unit length
- Transforms differently than vectors under certain operations

**Internal Representation:**
- Three `G4double` values (x, y, z)
- Approximately 24 bytes (3 × 8 bytes)

## Constructors

```cpp
// Default constructor - zero normal (0,0,0)
G4Normal3D();

// Component constructor
G4Normal3D(G4double x, G4double y, G4double z);

// Copy constructor
G4Normal3D(const G4Normal3D& other);

// From vector (converts to normal)
G4Normal3D(const G4Vector3D& vec);

// From CLHEP ThreeVector
G4Normal3D(const CLHEP::Hep3Vector& vec);
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
```

### Magnitude Operations

```cpp
// Normal magnitude (length)
G4double mag() const;
G4double mag2() const;  // Squared magnitude

// Unit normal (normalized)
G4Normal3D unit() const;
```

## Operations

### Arithmetic Operations

```cpp
// Normal addition (rarely used)
G4Normal3D operator + (const G4Normal3D& other) const;

// Normal subtraction
G4Normal3D operator - (const G4Normal3D& other) const;

// Unary negation (reverse direction)
G4Normal3D operator - () const;

// Scalar multiplication
G4Normal3D operator * (G4double scalar) const;
G4Normal3D& operator *= (G4double scalar);

// Scalar division
G4Normal3D operator / (G4double scalar) const;
G4Normal3D& operator /= (G4double scalar);
```

### Vector Products

```cpp
// Dot product with vector
G4double dot(const G4Vector3D& vec) const;

// Dot product with another normal
G4double dot(const G4Normal3D& other) const;

// Cross product
G4Normal3D cross(const G4Vector3D& vec) const;
```

### Comparison

```cpp
// Equality comparison
bool operator == (const G4Normal3D& other) const;
bool operator != (const G4Normal3D& other) const;
```

## Transformations

### Special Transformation Behavior

::: warning Normal Transformation
Normals transform by the **inverse transpose** of the rotation matrix, not the rotation itself. This ensures they remain perpendicular to surfaces after transformation.
:::

```cpp
// Transform normal (uses inverse transpose)
G4Normal3D operator * (const G4Transform3D& transform) const;
```

**Example:**
```cpp
// Surface with normal
G4Normal3D surfaceNormal(0, 0, 1);  // Pointing in +Z

// Apply non-uniform scaling transformation
G4Transform3D transform = G4Scale3D(2.0, 2.0, 0.5) * G4RotateY3D(45*deg);

// Transform normal (inverse transpose applied)
G4Normal3D transformedNormal = transform * surfaceNormal;

// Verify perpendicularity is preserved
// (Normal to transformed surface remains perpendicular)
```

## Usage Examples

### Surface Normal Calculations

```cpp
#include "G4Normal3D.hh"

// Compute normal to plane from three points
G4Normal3D ComputePlaneNormal(const G4Point3D& p1,
                             const G4Point3D& p2,
                             const G4Point3D& p3) {
    G4Vector3D v1 = p2 - p1;
    G4Vector3D v2 = p3 - p1;
    G4Vector3D cross = v1.cross(v2);
    return G4Normal3D(cross.unit());
}

// Normal to triangle
G4Normal3D triangleNormal = ComputePlaneNormal(
    G4Point3D(0, 0, 0),
    G4Point3D(1*cm, 0, 0),
    G4Point3D(0, 1*cm, 0)
);  // Result: (0, 0, 1)

// Flip normal direction
G4Normal3D inwardNormal = -triangleNormal;  // (0, 0, -1)
```

### Boundary Crossing Detection

```cpp
// Check if particle is entering or exiting volume
enum CrossingDirection {
    ENTERING,
    EXITING,
    PARALLEL
};

CrossingDirection DetermineCrossing(const G4Vector3D& particleDirection,
                                   const G4Normal3D& surfaceNormal,
                                   G4double tolerance = 1e-6) {
    G4double cosAngle = particleDirection.dot(surfaceNormal);

    if (cosAngle > tolerance) {
        return EXITING;   // Moving away from surface
    } else if (cosAngle < -tolerance) {
        return ENTERING;  // Moving into surface
    } else {
        return PARALLEL;  // Moving parallel to surface
    }
}

// Usage in tracking
void ProcessBoundary(const G4Track* track,
                    const G4Normal3D& surfaceNormal) {
    G4Vector3D direction(track->GetMomentumDirection());

    CrossingDirection crossing = DetermineCrossing(direction, surfaceNormal);

    switch(crossing) {
        case ENTERING:
            G4cout << "Particle entering volume" << G4endl;
            // Apply entrance physics processes
            break;
        case EXITING:
            G4cout << "Particle exiting volume" << G4endl;
            // Apply exit physics processes
            break;
        case PARALLEL:
            G4cout << "Grazing angle" << G4endl;
            // Handle special case
            break;
    }
}
```

### Reflection and Refraction

```cpp
// Specular reflection (mirror reflection)
G4Vector3D SpecularReflection(const G4Vector3D& incident,
                             const G4Normal3D& normal) {
    // Reflected direction: R = I - 2(I·N)N
    G4Normal3D n = normal.unit();
    G4double cosI = incident.dot(n);
    return incident - 2.0 * cosI * G4Vector3D(n.x(), n.y(), n.z());
}

// Refraction (Snell's law)
G4Vector3D Refract(const G4Vector3D& incident,
                  const G4Normal3D& normal,
                  G4double n1,  // Refractive index of first medium
                  G4double n2)  // Refractive index of second medium
{
    G4Normal3D n = normal.unit();
    G4Vector3D i = incident.unit();

    G4double eta = n1 / n2;
    G4double cosI = -i.dot(n);
    G4double sin2T = eta * eta * (1.0 - cosI * cosI);

    // Check for total internal reflection
    if (sin2T > 1.0) {
        return SpecularReflection(incident, normal);
    }

    G4double cosT = std::sqrt(1.0 - sin2T);
    G4Vector3D nVec(n.x(), n.y(), n.z());

    return eta * i + (eta * cosI - cosT) * nVec;
}

// Example: Light entering water
G4Vector3D lightDir(0, -1, -1);  // Coming from above at 45 degrees
G4Normal3D surfaceNormal(0, 0, 1);  // Upward normal
G4Vector3D refracted = Refract(lightDir.unit(), surfaceNormal,
                               1.0, 1.33);  // Air to water
```

### Solid Geometry Normals

```cpp
// Get surface normal for solid at specific point
G4Normal3D GetSolidNormal(G4VSolid* solid,
                         const G4Point3D& surfacePoint) {
    G4ThreeVector point(surfacePoint.x(), surfacePoint.y(), surfacePoint.z());
    G4ThreeVector normal = solid->SurfaceNormal(point);
    return G4Normal3D(normal.x(), normal.y(), normal.z());
}

// Verify point is on surface and get normal
struct SurfaceInfo {
    bool onSurface;
    G4Normal3D normal;
};

SurfaceInfo CheckSurface(G4VSolid* solid,
                        const G4Point3D& point,
                        G4double tolerance = 1e-9) {
    SurfaceInfo info;

    G4ThreeVector p(point.x(), point.y(), point.z());
    EInside location = solid->Inside(p);

    info.onSurface = (location == kSurface);

    if (info.onSurface) {
        G4ThreeVector n = solid->SurfaceNormal(p);
        info.normal = G4Normal3D(n.x(), n.y(), n.z());
    }

    return info;
}
```

### Fresnel Equations (Optical Physics)

```cpp
// Calculate reflection coefficient (s-polarization)
G4double FresnelReflectionS(const G4Vector3D& incident,
                           const G4Normal3D& normal,
                           G4double n1,
                           G4double n2) {
    G4Normal3D n = normal.unit();
    G4double cosI = std::abs(incident.dot(n));

    G4double eta = n1 / n2;
    G4double sin2T = eta * eta * (1.0 - cosI * cosI);

    if (sin2T > 1.0) {
        return 1.0;  // Total internal reflection
    }

    G4double cosT = std::sqrt(1.0 - sin2T);

    G4double rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
    return rs * rs;
}

// Calculate reflection coefficient (p-polarization)
G4double FresnelReflectionP(const G4Vector3D& incident,
                           const G4Normal3D& normal,
                           G4double n1,
                           G4double n2) {
    G4Normal3D n = normal.unit();
    G4double cosI = std::abs(incident.dot(n));

    G4double eta = n1 / n2;
    G4double sin2T = eta * eta * (1.0 - cosI * cosI);

    if (sin2T > 1.0) {
        return 1.0;  // Total internal reflection
    }

    G4double cosT = std::sqrt(1.0 - sin2T);

    G4double rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
    return rp * rp;
}
```

### Normal Interpolation

```cpp
// Smooth normal interpolation (for curved surfaces)
G4Normal3D InterpolateNormals(const G4Normal3D& n1,
                             const G4Normal3D& n2,
                             G4double t) {
    // Spherical linear interpolation
    G4Normal3D norm1 = n1.unit();
    G4Normal3D norm2 = n2.unit();

    G4double dot = norm1.dot(norm2);
    G4double theta = std::acos(std::clamp(dot, -1.0, 1.0));

    if (std::abs(theta) < 1e-6) {
        // Nearly parallel - use linear interpolation
        G4double x = (1-t) * norm1.x() + t * norm2.x();
        G4double y = (1-t) * norm1.y() + t * norm2.y();
        G4double z = (1-t) * norm1.z() + t * norm2.z();
        return G4Normal3D(x, y, z).unit();
    }

    G4double sinTheta = std::sin(theta);
    G4double a = std::sin((1-t) * theta) / sinTheta;
    G4double b = std::sin(t * theta) / sinTheta;

    return G4Normal3D(a * norm1.x() + b * norm2.x(),
                     a * norm1.y() + b * norm2.y(),
                     a * norm1.z() + b * norm2.z());
}

// Average normals (for vertex normals in meshes)
G4Normal3D AverageNormals(const std::vector<G4Normal3D>& normals) {
    if (normals.empty()) {
        return G4Normal3D(0, 0, 1);  // Default
    }

    G4double sumX = 0, sumY = 0, sumZ = 0;
    for (const auto& normal : normals) {
        sumX += normal.x();
        sumY += normal.y();
        sumZ += normal.z();
    }

    return G4Normal3D(sumX, sumY, sumZ).unit();
}
```

### Coordinate Frame Construction

```cpp
// Build tangent space from normal (for texture mapping, etc.)
struct TangentSpace {
    G4Normal3D normal;
    G4Vector3D tangent;
    G4Vector3D bitangent;
};

TangentSpace BuildTangentSpace(const G4Normal3D& normal) {
    TangentSpace space;
    space.normal = normal.unit();

    // Choose tangent perpendicular to normal
    G4Vector3D up = (std::abs(space.normal.z()) < 0.999) ?
                    G4Vector3D(0, 0, 1) : G4Vector3D(1, 0, 0);

    G4Vector3D normalVec(space.normal.x(), space.normal.y(), space.normal.z());
    space.tangent = normalVec.cross(up).unit();
    space.bitangent = normalVec.cross(space.tangent);

    return space;
}
```

### Normal Consistency Checking

```cpp
// Ensure normal points outward from solid
G4Normal3D EnsureOutwardNormal(const G4Normal3D& normal,
                              const G4Point3D& surfacePoint,
                              const G4Point3D& interiorPoint) {
    G4Vector3D outward = surfacePoint - interiorPoint;
    G4Vector3D normalVec(normal.x(), normal.y(), normal.z());

    if (normalVec.dot(outward) < 0) {
        return -normal;  // Flip to point outward
    }
    return normal;
}

// Check normal consistency for mesh
bool CheckNormalConsistency(const std::vector<G4Normal3D>& normals,
                           const std::vector<G4Point3D>& vertices,
                           const G4Point3D& centerPoint) {
    for (size_t i = 0; i < normals.size() && i < vertices.size(); ++i) {
        G4Vector3D outward = vertices[i] - centerPoint;
        G4Vector3D normalVec(normals[i].x(), normals[i].y(), normals[i].z());

        if (normalVec.dot(outward) < 0) {
            G4cout << "Warning: Normal " << i
                   << " points inward!" << G4endl;
            return false;
        }
    }
    return true;
}
```

## Common Patterns

### Always Normalize

```cpp
// Surface normals should typically be unit vectors
G4Normal3D surfaceNormal = ComputeNormal(...);
surfaceNormal = surfaceNormal.unit();  // Ensure unit length
```

### Direction Testing

```cpp
// Common pattern: check alignment with normal
G4double cosAngle = direction.dot(surfaceNormal);

if (cosAngle > 0) {
    // Direction points same way as normal (outgoing)
} else if (cosAngle < 0) {
    // Direction points opposite to normal (incoming)
} else {
    // Direction perpendicular to normal (grazing)
}
```

### Converting Between Types

```cpp
// Normal to Vector
G4Normal3D normal(0, 0, 1);
G4Vector3D vector(normal.x(), normal.y(), normal.z());

// Vector to Normal
G4Vector3D vec(1, 2, 3);
G4Normal3D norm(vec.x(), vec.y(), vec.z());
norm = norm.unit();  // Normalize
```

## Thread Safety

`G4Normal3D` is:
- **Value type:** Copied, not shared
- **No mutable state:** Safe for concurrent use
- **Thread-safe:** Each thread has independent instances

Normals can be created and manipulated safely in multi-threaded applications without synchronization.

## Performance Notes

1. **Cache unit normals:** Normalization is expensive
   ```cpp
   G4Normal3D unitNormal = normal.unit();  // Compute once
   // Reuse unitNormal
   ```

2. **Pass by const reference:** Avoid copies
   ```cpp
   void Process(const G4Normal3D& normal);  // Good
   void Process(G4Normal3D normal);         // Copies 24 bytes
   ```

3. **Use mag2() when appropriate:** Avoid square root
   ```cpp
   if (normal.mag2() < epsilon*epsilon) { /* ... */ }
   ```

## Semantic Differences from G4Vector3D

While `G4Normal3D` and `G4Vector3D` share similar interfaces:

| Aspect | G4Normal3D | G4Vector3D |
|--------|------------|------------|
| **Purpose** | Surface perpendiculars | General displacements/directions |
| **Transformation** | Inverse transpose rotation | Regular rotation |
| **Typical use** | Surface normals, orientations | Momentum, displacement, forces |
| **Normalization** | Usually unit length | Arbitrary magnitude |

::: tip When to Use
- Use `G4Normal3D` for **surface normals** and **orientation vectors**
- Use `G4Vector3D` for **displacements**, **momenta**, and **directions**
- The distinction matters most during transformations
:::

## Related Classes

- [G4Vector3D](g4vector3d.md) - General 3D vectors
- [G4Point3D](g4point3d.md) - 3D points defining surfaces
- [G4Plane3D](g4plane3d.md) - 3D planes with normals
- [G4Transform3D](g4transform3d.md) - Transformations (special normal handling)
- [G4VSolid](g4vsolid.md) - Solid geometry (provides surface normals)

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- [geomdefs](geomdefs.md) - Geometry definitions and constants
- CLHEP Normal3D documentation - Detailed CLHEP implementation

---

::: info Source Reference
Type definition in:
- Header: `source/global/HEPGeometry/include/G4Normal3D.hh`
- Implementation: CLHEP library (`CLHEP/Geometry/Normal3D.h`)
:::
