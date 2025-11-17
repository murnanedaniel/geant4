# G4Point3D API Documentation

## Overview

`G4Point3D` represents a point in three-dimensional space. It is an alias to CLHEP's `HepGeom::Point3D<G4double>` template instantiation. Points are fundamental geometric entities used throughout Geant4 for representing positions in space, vertices, and intersection points.

Unlike vectors, points represent specific locations rather than displacements. Points can be transformed by `G4Transform3D` operations and participate in geometric calculations.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/G4Point3D.hh`
**Implementation:** CLHEP library (`CLHEP/Geometry/Point3D.h`)
:::

## Type Definition

`source/global/HEPGeometry/include/G4Point3D.hh:34`

```cpp
using G4Point3D = HepGeom::Point3D<G4double>;
```

**Purpose:** 3D point with double precision coordinates

**Internal Representation:**
- Three `G4double` values (x, y, z)
- Approximately 24 bytes (3 × 8 bytes)

## Constructors

```cpp
// Default constructor - origin (0,0,0)
G4Point3D();

// Component constructor
G4Point3D(G4double x, G4double y, G4double z);

// Copy constructor
G4Point3D(const G4Point3D& other);

// From CLHEP ThreeVector
G4Point3D(const CLHEP::Hep3Vector& vec);
```

## Accessors

### Component Access

```cpp
// Get coordinates
G4double x() const;
G4double y() const;
G4double z() const;

// Set coordinates
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
G4Point3D point(1, 2, 3);
G4double xCoord = point[0];  // 1
G4double yCoord = point[1];  // 2
```

## Operations

### Point Arithmetic

```cpp
// Point - Point = Vector (displacement)
G4Vector3D operator - (const G4Point3D& other) const;

// Point + Vector = Point (translation)
G4Point3D operator + (const G4Vector3D& v) const;
G4Point3D& operator += (const G4Vector3D& v);

// Point - Vector = Point (inverse translation)
G4Point3D operator - (const G4Vector3D& v) const;
G4Point3D& operator -= (const G4Vector3D& v);
```

::: warning Point Arithmetic Rules
- **Cannot add two points** (Point + Point is undefined)
- **Can subtract points** to get displacement vector
- **Can add vector to point** to get new point
:::

### Comparison

```cpp
// Equality comparison
bool operator == (const G4Point3D& other) const;
bool operator != (const G4Point3D& other) const;
```

### Distance Calculations

```cpp
// Distance from origin
G4double mag() const;
G4double mag2() const;  // Squared magnitude (faster)

// Distance between two points
G4double distance(const G4Point3D& other) const;
G4double distance2(const G4Point3D& other) const;  // Squared distance
```

## Transformations

### Apply Transformation

```cpp
// Transform point
G4Point3D operator * (const G4Transform3D& transform) const;

// Example
G4Point3D point(1*cm, 0, 0);
G4Transform3D transform = G4Translate3D(5*cm, 0, 0) * G4RotateZ3D(90*deg);
G4Point3D transformed = transform * point;
```

## Usage Examples

### Basic Point Operations

```cpp
#include "G4Point3D.hh"
#include "G4Vector3D.hh"

// Create points
G4Point3D origin;                      // (0, 0, 0)
G4Point3D detector(10*cm, 5*cm, 0);   // Detector position
G4Point3D target(0, 0, -50*cm);       // Target position

// Calculate displacement vector
G4Vector3D displacement = detector - target;
G4cout << "Displacement: " << displacement << G4endl;

// Distance between points
G4double dist = detector.distance(target);
G4cout << "Distance: " << dist/cm << " cm" << G4endl;

// Move point by vector
G4Vector3D shift(1*cm, 0, 0);
G4Point3D newPosition = detector + shift;
```

### Geometric Calculations

```cpp
// Find midpoint between two points
G4Point3D Midpoint(const G4Point3D& p1, const G4Point3D& p2) {
    G4Vector3D displacement = p2 - p1;
    return p1 + 0.5 * displacement;
}

// Check if point is within sphere
bool IsInSphere(const G4Point3D& point,
                const G4Point3D& center,
                G4double radius) {
    G4double dist2 = point.distance2(center);
    return dist2 <= radius * radius;
}

// Find closest point on line to given point
G4Point3D ClosestPointOnLine(const G4Point3D& point,
                             const G4Point3D& lineStart,
                             const G4Vector3D& lineDirection) {
    G4Vector3D toPoint = point - lineStart;
    G4double projection = toPoint.dot(lineDirection.unit());
    return lineStart + projection * lineDirection.unit();
}
```

### Intersection Calculations

```cpp
// Find intersection of line with plane
G4Point3D LinePlaneIntersection(const G4Point3D& lineStart,
                                const G4Vector3D& lineDir,
                                const G4Point3D& planePoint,
                                const G4Vector3D& planeNormal) {
    G4Vector3D toPlane = planePoint - lineStart;
    G4double t = toPlane.dot(planeNormal) / lineDir.dot(planeNormal);
    return lineStart + t * lineDir;
}

// Example usage
G4Point3D rayOrigin(0, 0, -10*cm);
G4Vector3D rayDirection(0, 0, 1);
G4Point3D planePoint(0, 0, 0);
G4Normal3D planeNormal(0, 0, 1);

G4Point3D intersection = LinePlaneIntersection(
    rayOrigin, rayDirection, planePoint, planeNormal);
```

### Coordinate Transformations

```cpp
// Transform point from local to global coordinates
G4Point3D LocalToGlobal(const G4Point3D& localPoint,
                       const G4Transform3D& transform) {
    return transform * localPoint;
}

// Transform point from global to local coordinates
G4Point3D GlobalToLocal(const G4Point3D& globalPoint,
                       const G4Transform3D& transform) {
    G4Transform3D inverse = transform.inverse();
    return inverse * globalPoint;
}

// Example: detector coordinate transformation
G4Transform3D detectorTransform =
    G4Translate3D(0, 0, 100*cm) * G4RotateY3D(30*deg);

G4Point3D localHit(1*cm, 2*cm, 0);
G4Point3D globalHit = LocalToGlobal(localHit, detectorTransform);

G4cout << "Local: " << localHit << G4endl;
G4cout << "Global: " << globalHit << G4endl;
```

### Vertex and Hit Processing

```cpp
// Process primary vertex position
void ProcessVertex(const G4PrimaryVertex* vertex) {
    // Get vertex position as point
    G4Point3D vertexPos(vertex->GetX0(),
                       vertex->GetY0(),
                       vertex->GetZ0());

    // Check if vertex is in target volume
    G4Point3D targetCenter(0, 0, 0);
    G4double targetRadius = 5*cm;

    if (IsInSphere(vertexPos, targetCenter, targetRadius)) {
        G4cout << "Vertex in target" << G4endl;
    }

    // Distance from beam axis
    G4Point3D beamOrigin(0, 0, vertexPos.z());
    G4double radialDistance = vertexPos.distance(beamOrigin);
    G4cout << "Radial distance: " << radialDistance/mm << " mm" << G4endl;
}

// Analyze hit positions
void AnalyzeHits(const std::vector<G4ThreeVector>& hitPositions) {
    if (hitPositions.empty()) return;

    // Convert to G4Point3D
    std::vector<G4Point3D> points;
    for (const auto& pos : hitPositions) {
        points.emplace_back(pos.x(), pos.y(), pos.z());
    }

    // Find centroid
    G4Point3D centroid(0, 0, 0);
    for (const auto& point : points) {
        centroid += G4Vector3D(point.x(), point.y(), point.z());
    }
    centroid.set(centroid.x() / points.size(),
                centroid.y() / points.size(),
                centroid.z() / points.size());

    G4cout << "Hit centroid: " << centroid << G4endl;

    // Calculate spread
    G4double totalDist2 = 0;
    for (const auto& point : points) {
        totalDist2 += point.distance2(centroid);
    }
    G4double rms = std::sqrt(totalDist2 / points.size());
    G4cout << "RMS spread: " << rms/mm << " mm" << G4endl;
}
```

### Geometric Queries

```cpp
// Check if point is inside triangle (2D in XY plane)
bool IsInTriangle2D(const G4Point3D& point,
                    const G4Point3D& v1,
                    const G4Point3D& v2,
                    const G4Point3D& v3) {
    // Use barycentric coordinates
    G4Vector3D v0 = v3 - v1;
    G4Vector3D v1Vec = v2 - v1;
    G4Vector3D v2Vec = point - v1;

    G4double dot00 = v0.dot(v0);
    G4double dot01 = v0.dot(v1Vec);
    G4double dot02 = v0.dot(v2Vec);
    G4double dot11 = v1Vec.dot(v1Vec);
    G4double dot12 = v1Vec.dot(v2Vec);

    G4double invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    G4double u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    G4double v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
}

// Find bounding box of point set
struct BoundingBox {
    G4Point3D min;
    G4Point3D max;
};

BoundingBox FindBoundingBox(const std::vector<G4Point3D>& points) {
    if (points.empty()) {
        return {G4Point3D(), G4Point3D()};
    }

    BoundingBox bbox;
    bbox.min = points[0];
    bbox.max = points[0];

    for (const auto& point : points) {
        bbox.min.setX(std::min(bbox.min.x(), point.x()));
        bbox.min.setY(std::min(bbox.min.y(), point.y()));
        bbox.min.setZ(std::min(bbox.min.z(), point.z()));

        bbox.max.setX(std::max(bbox.max.x(), point.x()));
        bbox.max.setY(std::max(bbox.max.y(), point.y()));
        bbox.max.setZ(std::max(bbox.max.z(), point.z()));
    }

    return bbox;
}
```

### Interpolation

```cpp
// Linear interpolation between points
G4Point3D Lerp(const G4Point3D& start,
               const G4Point3D& end,
               G4double t) {
    // t = 0 returns start, t = 1 returns end
    G4Vector3D displacement = end - start;
    return start + t * displacement;
}

// Bezier curve evaluation (cubic)
G4Point3D CubicBezier(const G4Point3D& p0,
                      const G4Point3D& p1,
                      const G4Point3D& p2,
                      const G4Point3D& p3,
                      G4double t) {
    G4double u = 1 - t;
    G4double tt = t * t;
    G4double uu = u * u;
    G4double uuu = uu * u;
    G4double ttt = tt * t;

    G4Point3D point = uuu * G4Vector3D(p0.x(), p0.y(), p0.z());
    point += 3 * uu * t * G4Vector3D(p1.x(), p1.y(), p1.z());
    point += 3 * u * tt * G4Vector3D(p2.x(), p2.y(), p2.z());
    point += ttt * G4Vector3D(p3.x(), p3.y(), p3.z());

    return point;
}
```

## Common Patterns

### Point Collections

```cpp
// Store multiple points
std::vector<G4Point3D> detectorHits;

// Add hit position
detectorHits.push_back(G4Point3D(x, y, z));

// Process all hits
for (const auto& hit : detectorHits) {
    G4double energy = CalculateEnergyAtPoint(hit);
    ProcessHit(hit, energy);
}
```

### Point-Vector Distinction

```cpp
// Points represent LOCATIONS
G4Point3D vertexLocation(0, 0, 0);
G4Point3D hitLocation(10*cm, 5*cm, 0);

// Vectors represent DISPLACEMENTS or DIRECTIONS
G4Vector3D displacement = hitLocation - vertexLocation;
G4Vector3D direction = displacement.unit();

// Move point along direction
G4Point3D newLocation = hitLocation + 5*cm * direction;
```

### Coordinate System Conversion

```cpp
// Cartesian to cylindrical
struct CylindricalCoords {
    G4double rho;
    G4double phi;
    G4double z;
};

CylindricalCoords ToCylindrical(const G4Point3D& cartesian) {
    CylindricalCoords cyl;
    cyl.rho = std::sqrt(cartesian.x()*cartesian.x() +
                       cartesian.y()*cartesian.y());
    cyl.phi = std::atan2(cartesian.y(), cartesian.x());
    cyl.z = cartesian.z();
    return cyl;
}

G4Point3D FromCylindrical(const CylindricalCoords& cyl) {
    return G4Point3D(cyl.rho * std::cos(cyl.phi),
                    cyl.rho * std::sin(cyl.phi),
                    cyl.z);
}
```

## Thread Safety

`G4Point3D` is:
- **Value type:** Copied, not shared
- **No mutable state:** Safe for concurrent use
- **Thread-safe:** Each thread has independent instances

Points can be created and manipulated safely in multi-threaded applications without synchronization.

## Performance Notes

1. **Prefer distance2() for comparisons:** Avoid expensive square root
   ```cpp
   // Slow
   if (point1.distance(point2) < threshold) { /* ... */ }

   // Fast
   if (point1.distance2(point2) < threshold*threshold) { /* ... */ }
   ```

2. **Pass by const reference:** Avoid unnecessary copies
   ```cpp
   void ProcessPoint(const G4Point3D& point);  // Good
   void ProcessPoint(G4Point3D point);         // Copies 24 bytes
   ```

3. **Use mag2() when possible:** Faster than mag()
   ```cpp
   G4double dist2 = point.mag2();  // No sqrt
   ```

## Related Classes

- [G4Vector3D](g4vector3d.md) - 3D displacement vectors
- [G4Normal3D](g4normal3d.md) - Surface normal vectors
- [G4Transform3D](g4transform3d.md) - 3D transformations applied to points
- [G4ThreeVector](g4threevector.md) - Alternative 3D vector class
- [G4Plane3D](g4plane3d.md) - 3D planes containing points

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- [geomdefs](geomdefs.md) - Geometry definitions and constants
- CLHEP Point3D documentation - Detailed CLHEP implementation

---

::: info Source Reference
Type definition in:
- Header: `source/global/HEPGeometry/include/G4Point3D.hh`
- Implementation: CLHEP library (`CLHEP/Geometry/Point3D.h`)
:::
