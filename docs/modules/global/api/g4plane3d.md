# G4Plane3D API Documentation

## Overview

`G4Plane3D` represents a plane in three-dimensional space. It is an alias to CLHEP's `HepGeom::Plane3D<G4double>` template instantiation. Planes are fundamental geometric entities used for defining boundaries, performing intersection tests, and geometric calculations in detector construction and particle tracking.

A plane is mathematically defined by the equation: **ax + by + cz + d = 0**, where (a, b, c) is the plane normal and d is the distance parameter.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/G4Plane3D.hh`
**Implementation:** CLHEP library (`CLHEP/Geometry/Plane3D.h`)
:::

## Type Definition

`source/global/HEPGeometry/include/G4Plane3D.hh:34`

```cpp
using G4Plane3D = HepGeom::Plane3D<G4double>;
```

**Purpose:** 3D plane with double precision parameters

**Plane Equation:**
```
ax + by + cz + d = 0
```

Where:
- `(a, b, c)` = plane normal vector (not necessarily unit length)
- `d` = signed distance parameter
- For unit normal, `|d|` = distance from origin to plane

## Constructors

```cpp
// Default constructor - undefined plane
G4Plane3D();

// From plane equation coefficients
G4Plane3D(G4double a, G4double b, G4double c, G4double d);

// From normal and point on plane
G4Plane3D(const G4Normal3D& normal, const G4Point3D& point);

// From normal and distance from origin
G4Plane3D(const G4Normal3D& normal, G4double distance);

// From three points (defines plane)
G4Plane3D(const G4Point3D& p1,
          const G4Point3D& p2,
          const G4Point3D& p3);

// Copy constructor
G4Plane3D(const G4Plane3D& other);
```

## Accessors

### Plane Equation Parameters

```cpp
// Get plane equation coefficients
G4double a() const;  // Normal x-component
G4double b() const;  // Normal y-component
G4double c() const;  // Normal z-component
G4double d() const;  // Distance parameter

// Get as array [a, b, c, d]
const G4double* coefficients() const;
```

### Derived Properties

```cpp
// Get plane normal (not normalized)
G4Normal3D normal() const;

// Normalize plane equation (make normal unit length)
G4Plane3D normalize() const;

// Get signed distance from origin (for normalized plane)
G4double distance() const;
```

## Operations

### Point Operations

```cpp
// Signed distance from point to plane
G4double distance(const G4Point3D& point) const;

// Check which side of plane point is on
// Returns: > 0 (above), < 0 (below), ≈ 0 (on plane)
G4double evaluate(const G4Point3D& point) const;

// Project point onto plane
G4Point3D project(const G4Point3D& point) const;
```

### Line Intersection

```cpp
// Intersect line with plane
// Returns intersection point (if exists)
G4Point3D intersect(const G4Point3D& linePoint,
                   const G4Vector3D& lineDirection) const;

// Check if line intersects plane
bool intersects(const G4Point3D& linePoint,
               const G4Vector3D& lineDirection) const;
```

### Plane Operations

```cpp
// Transform plane
G4Plane3D transform(const G4Transform3D& t) const;
G4Plane3D operator * (const G4Transform3D& t) const;

// Comparison
bool operator == (const G4Plane3D& other) const;
bool operator != (const G4Plane3D& other) const;
```

## Usage Examples

### Creating Planes

```cpp
#include "G4Plane3D.hh"

// Plane from equation coefficients (z = 0 plane)
G4Plane3D xyPlane(0, 0, 1, 0);  // z = 0

// Plane from normal and point
G4Normal3D upward(0, 0, 1);
G4Point3D origin(0, 0, 0);
G4Plane3D groundPlane(upward, origin);

// Plane from normal and distance
G4Plane3D elevated(G4Normal3D(0, 0, 1), 10*cm);  // z = 10cm

// Plane from three points
G4Point3D p1(0, 0, 0);
G4Point3D p2(1*m, 0, 0);
G4Point3D p3(0, 1*m, 0);
G4Plane3D trianglePlane(p1, p2, p3);  // XY plane

// Named common planes
G4Plane3D CreateXYPlane(G4double z = 0) {
    return G4Plane3D(0, 0, 1, -z);
}

G4Plane3D CreateYZPlane(G4double x = 0) {
    return G4Plane3D(1, 0, 0, -x);
}

G4Plane3D CreateXZPlane(G4double y = 0) {
    return G4Plane3D(0, 1, 0, -y);
}
```

### Point-Plane Relationships

```cpp
// Test which side of plane a point is on
enum PlaneSide {
    BELOW_PLANE,
    ON_PLANE,
    ABOVE_PLANE
};

PlaneSide ClassifyPoint(const G4Plane3D& plane,
                       const G4Point3D& point,
                       G4double tolerance = 1e-9) {
    G4double dist = plane.distance(point);

    if (std::abs(dist) < tolerance) {
        return ON_PLANE;
    } else if (dist > 0) {
        return ABOVE_PLANE;
    } else {
        return BELOW_PLANE;
    }
}

// Calculate exact distance
void AnalyzePointPlaneRelation(const G4Plane3D& plane,
                               const G4Point3D& point) {
    // Normalize plane for accurate distance
    G4Plane3D normPlane = plane.normalize();

    G4double dist = normPlane.distance(point);
    G4cout << "Distance to plane: " << dist/mm << " mm" << G4endl;

    if (dist > 0) {
        G4cout << "Point is above plane (normal side)" << G4endl;
    } else if (dist < 0) {
        G4cout << "Point is below plane" << G4endl;
    } else {
        G4cout << "Point is on plane" << G4endl;
    }
}

// Find closest point on plane
G4Point3D ClosestPointOnPlane(const G4Plane3D& plane,
                             const G4Point3D& point) {
    return plane.project(point);
}
```

### Line-Plane Intersection

```cpp
// Ray-plane intersection
struct IntersectionResult {
    bool intersects;
    G4Point3D point;
    G4double distance;  // Along ray
};

IntersectionResult RayPlaneIntersection(
    const G4Point3D& rayOrigin,
    const G4Vector3D& rayDirection,
    const G4Plane3D& plane)
{
    IntersectionResult result;

    // Get plane normal
    G4Normal3D normal = plane.normal();
    G4Vector3D n(normal.x(), normal.y(), normal.z());

    // Check if ray is parallel to plane
    G4double denom = rayDirection.dot(n);
    if (std::abs(denom) < 1e-10) {
        result.intersects = false;
        return result;
    }

    // Calculate intersection distance
    G4double t = -(plane.a() * rayOrigin.x() +
                   plane.b() * rayOrigin.y() +
                   plane.c() * rayOrigin.z() +
                   plane.d()) / denom;

    // Check if intersection is in front of ray
    if (t < 0) {
        result.intersects = false;
        return result;
    }

    result.intersects = true;
    result.distance = t;
    result.point = rayOrigin + t * rayDirection;

    return result;
}

// Example usage
G4Point3D rayStart(0, 0, -10*cm);
G4Vector3D rayDir(0, 0, 1);
G4Plane3D plane(0, 0, 1, 0);  // z = 0

IntersectionResult hit = RayPlaneIntersection(rayStart, rayDir, plane);
if (hit.intersects) {
    G4cout << "Intersection at: " << hit.point << G4endl;
    G4cout << "Distance: " << hit.distance/cm << " cm" << G4endl;
}
```

### Clipping and Splitting

```cpp
// Clip line segment to plane (find segment on one side)
struct LineSegment {
    G4Point3D start;
    G4Point3D end;
};

LineSegment ClipSegmentToPlane(const LineSegment& segment,
                               const G4Plane3D& plane,
                               bool keepPositiveSide = true)
{
    G4double dist1 = plane.distance(segment.start);
    G4double dist2 = plane.distance(segment.end);

    // Both points on same side
    if ((dist1 >= 0 && dist2 >= 0) ||
        (dist1 <= 0 && dist2 <= 0)) {
        if ((dist1 >= 0 && keepPositiveSide) ||
            (dist1 <= 0 && !keepPositiveSide)) {
            return segment;  // Keep original
        } else {
            return {G4Point3D(), G4Point3D()};  // Discard
        }
    }

    // Find intersection point
    G4Vector3D direction = segment.end - segment.start;
    G4Point3D intersection = plane.intersect(segment.start, direction);

    // Return clipped segment
    if (keepPositiveSide) {
        return (dist1 >= 0) ?
            LineSegment{segment.start, intersection} :
            LineSegment{intersection, segment.end};
    } else {
        return (dist1 < 0) ?
            LineSegment{segment.start, intersection} :
            LineSegment{intersection, segment.end};
    }
}

// Split polygon by plane
std::vector<G4Point3D> SplitPolygon(
    const std::vector<G4Point3D>& polygon,
    const G4Plane3D& plane,
    bool keepPositiveSide)
{
    std::vector<G4Point3D> result;

    for (size_t i = 0; i < polygon.size(); ++i) {
        G4Point3D current = polygon[i];
        G4Point3D next = polygon[(i + 1) % polygon.size()];

        G4double currentDist = plane.distance(current);
        G4double nextDist = plane.distance(next);

        bool currentInside = keepPositiveSide ?
            (currentDist >= 0) : (currentDist <= 0);
        bool nextInside = keepPositiveSide ?
            (nextDist >= 0) : (nextDist <= 0);

        if (currentInside) {
            result.push_back(current);
        }

        // Edge crosses plane - add intersection
        if (currentInside != nextInside) {
            G4Vector3D edge = next - current;
            G4Point3D intersection = plane.intersect(current, edge);
            result.push_back(intersection);
        }
    }

    return result;
}
```

### Geometric Queries

```cpp
// Check if point is between two parallel planes
bool IsBetweenPlanes(const G4Point3D& point,
                    const G4Plane3D& plane1,
                    const G4Plane3D& plane2) {
    G4double dist1 = plane1.distance(point);
    G4double dist2 = plane2.distance(point);

    // Point is between if distances have opposite signs
    return (dist1 * dist2 <= 0);
}

// Find distance between parallel planes
G4double ParallelPlaneDistance(const G4Plane3D& plane1,
                               const G4Plane3D& plane2) {
    // Normalize both planes
    G4Plane3D p1 = plane1.normalize();
    G4Plane3D p2 = plane2.normalize();

    // Check if actually parallel
    G4Normal3D n1 = p1.normal();
    G4Normal3D n2 = p2.normal();

    if (std::abs(n1.dot(n2) - 1.0) > 1e-6 &&
        std::abs(n1.dot(n2) + 1.0) > 1e-6) {
        G4cerr << "Warning: Planes are not parallel!" << G4endl;
        return -1;
    }

    // Distance is difference in d parameters
    return std::abs(p1.d() - p2.d());
}

// Compute line of intersection between two non-parallel planes
struct PlaneIntersectionLine {
    bool exists;
    G4Point3D point;      // Point on line
    G4Vector3D direction; // Line direction
};

PlaneIntersectionLine IntersectPlanes(const G4Plane3D& plane1,
                                     const G4Plane3D& plane2) {
    PlaneIntersectionLine result;

    G4Normal3D n1 = plane1.normal();
    G4Normal3D n2 = plane2.normal();

    // Direction of intersection line is perpendicular to both normals
    G4Vector3D v1(n1.x(), n1.y(), n1.z());
    G4Vector3D v2(n2.x(), n2.y(), n2.z());
    G4Vector3D lineDir = v1.cross(v2);

    // Check if planes are parallel
    if (lineDir.mag2() < 1e-10) {
        result.exists = false;
        return result;
    }

    result.exists = true;
    result.direction = lineDir.unit();

    // Find a point on the line
    // Use the point where line intersects the plane perpendicular to lineDir
    // (for numerical stability, choose coordinate with largest component)

    G4double maxComp = std::max({std::abs(lineDir.x()),
                                 std::abs(lineDir.y()),
                                 std::abs(lineDir.z())});

    if (std::abs(lineDir.z()) == maxComp) {
        // Solve for x, y when z = 0
        G4double det = n1.x() * n2.y() - n1.y() * n2.x();
        G4double x = (n1.y() * plane2.d() - n2.y() * plane1.d()) / det;
        G4double y = (n2.x() * plane1.d() - n1.x() * plane2.d()) / det;
        result.point = G4Point3D(x, y, 0);
    } else if (std::abs(lineDir.y()) == maxComp) {
        // Solve for x, z when y = 0
        G4double det = n1.x() * n2.z() - n1.z() * n2.x();
        G4double x = (n1.z() * plane2.d() - n2.z() * plane1.d()) / det;
        G4double z = (n2.x() * plane1.d() - n1.x() * plane2.d()) / det;
        result.point = G4Point3D(x, 0, z);
    } else {
        // Solve for y, z when x = 0
        G4double det = n1.y() * n2.z() - n1.z() * n2.y();
        G4double y = (n1.z() * plane2.d() - n2.z() * plane1.d()) / det;
        G4double z = (n2.y() * plane1.d() - n1.y() * plane2.d()) / det;
        result.point = G4Point3D(0, y, z);
    }

    return result;
}
```

### Transformation of Planes

```cpp
// Transform plane with general transformation
G4Plane3D TransformPlane(const G4Plane3D& plane,
                        const G4Transform3D& transform) {
    // Method 1: Transform three points on the plane
    G4Normal3D n = plane.normal();
    G4Point3D p1 = plane.project(G4Point3D(0, 0, 0));
    G4Point3D p2 = p1 + G4Vector3D(1, 0, 0);
    G4Point3D p3 = p1 + G4Vector3D(0, 1, 0);

    // Transform the points
    G4Point3D t1 = transform * p1;
    G4Point3D t2 = transform * p2;
    G4Point3D t3 = transform * p3;

    // Create new plane from transformed points
    return G4Plane3D(t1, t2, t3);
}

// Reflect geometry across plane
G4Transform3D ReflectAcrossPlane(const G4Plane3D& plane) {
    // Create reflection transformation
    G4Plane3D normPlane = plane.normalize();
    return G4Reflect3D(normPlane.a(), normPlane.b(),
                      normPlane.c(), normPlane.d());
}

// Example: mirror detector across XY plane
void PlaceMirroredDetector(G4LogicalVolume* detector,
                          G4LogicalVolume* world) {
    G4Plane3D mirrorPlane(0, 0, 1, 0);  // XY plane

    // Original placement
    G4Transform3D original = G4Translate3D(0, 0, 50*cm);
    new G4PVPlacement(original, detector, "Detector_A",
                     world, false, 0);

    // Mirrored placement
    G4Transform3D reflection = ReflectAcrossPlane(mirrorPlane);
    G4Transform3D mirrored = reflection * original;
    new G4PVPlacement(mirrored, detector, "Detector_B",
                     world, false, 1);
}
```

### Detector Applications

```cpp
// Define detector plane for tracking
class DetectorPlane {
public:
    DetectorPlane(const G4Normal3D& normal,
                 const G4Point3D& center,
                 G4double width,
                 G4double height)
        : fPlane(normal, center),
          fCenter(center),
          fWidth(width),
          fHeight(height)
    {
        // Build local coordinate system
        G4Vector3D n(normal.x(), normal.y(), normal.z());
        fLocalX = n.perpendicular().unit();
        fLocalY = n.cross(fLocalX);
    }

    // Check if particle crosses detector
    bool CheckCrossing(const G4Point3D& start,
                      const G4Point3D& end,
                      G4Point3D& hitPosition) {
        // Find intersection with plane
        G4Vector3D direction = end - start;
        IntersectionResult hit = RayPlaneIntersection(start, direction, fPlane);

        if (!hit.intersects) return false;

        // Check if hit is within detector bounds
        G4Vector3D toHit = hit.point - fCenter;
        G4double localX = toHit.dot(fLocalX);
        G4double localY = toHit.dot(fLocalY);

        if (std::abs(localX) > fWidth/2 ||
            std::abs(localY) > fHeight/2) {
            return false;
        }

        hitPosition = hit.point;
        return true;
    }

private:
    G4Plane3D fPlane;
    G4Point3D fCenter;
    G4double fWidth;
    G4double fHeight;
    G4Vector3D fLocalX;
    G4Vector3D fLocalY;
};
```

## Common Patterns

### Plane Definition

```cpp
// From normal and point (most intuitive)
G4Normal3D normal(0, 0, 1);
G4Point3D pointOnPlane(0, 0, 10*cm);
G4Plane3D plane(normal, pointOnPlane);

// Always normalize for distance calculations
G4Plane3D normPlane = plane.normalize();
```

### Signed Distance

```cpp
// Positive = above plane (normal direction)
// Negative = below plane
// Zero = on plane
G4double signedDist = plane.distance(point);
```

### Intersection Testing

```cpp
// Check intersection before computing point
if (plane.intersects(linePoint, lineDir)) {
    G4Point3D intersection = plane.intersect(linePoint, lineDir);
    // Use intersection
}
```

## Thread Safety

`G4Plane3D` is:
- **Value type:** Copied, not shared
- **No mutable state:** Safe for concurrent use
- **Thread-safe:** Each thread has independent instances

Planes can be created and manipulated safely in multi-threaded applications without synchronization.

## Performance Notes

1. **Normalize once:** Store normalized planes for distance calculations
   ```cpp
   G4Plane3D plane = inputPlane.normalize();  // Once
   // Use plane for multiple distance calculations
   ```

2. **Pass by const reference:** Avoid copies
   ```cpp
   void Process(const G4Plane3D& plane);  // Good
   ```

3. **Cache plane parameters:** Access a(), b(), c(), d() once if needed multiple times

## Related Classes

- [G4Normal3D](g4normal3d.md) - Plane normal vectors
- [G4Point3D](g4point3d.md) - Points on planes
- [G4Vector3D](g4vector3d.md) - Directions for intersection tests
- [G4Transform3D](g4transform3d.md) - Plane transformations
- [G4VSolid](g4vsolid.md) - Solid geometry bounded by surfaces

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- [geomdefs](geomdefs.md) - Geometry definitions and constants
- CLHEP Plane3D documentation - Detailed CLHEP implementation

---

::: info Source Reference
Type definition in:
- Header: `source/global/HEPGeometry/include/G4Plane3D.hh`
- Implementation: CLHEP library (`CLHEP/Geometry/Plane3D.h`)
:::
