# G4PVPlacement

**Base Class**: [G4VPhysicalVolume](g4vphysicalvolume.md)
**Derived Classes**: None (concrete implementation)
**Location**: `source/geometry/volumes/include/G4PVPlacement.hh`
**Source**: `source/geometry/volumes/src/G4PVPlacement.cc`

## Overview

G4PVPlacement represents a single positioned volume in the Geant4 geometry hierarchy. It is the most commonly used physical volume class, placing a [G4LogicalVolume](g4logicalvolume.md) at a specific position and orientation within a mother volume. Unlike replicas or parameterized volumes, each G4PVPlacement represents exactly one positioned volume instance.

G4PVPlacement is the fundamental building block for constructing detector geometries - every uniquely positioned volume in your detector uses this class.

## Key Features

- **Single Volume Placement**: Represents one positioned volume (not multiple copies)
- **Flexible Constructors**: Four constructor variants for different use cases
- **Two Transformation Paradigms**: Frame transformation (standard) or object transformation (G4Transform3D)
- **Automatic Hierarchy Setup**: Automatically registers with mother logical volume
- **Overlap Detection**: Built-in CheckOverlaps() for geometry validation
- **Memory Management**: Automatic cleanup of internally-allocated rotation matrices
- **Self-Placement Prevention**: Prevents volumes from being placed inside themselves
- **Optional Surface Checking**: Can automatically check for overlaps during construction

## Class Definition

```cpp
class G4PVPlacement : public G4VPhysicalVolume
{
  public:
    // Constructor 1: Frame transformation with mother logical volume
    G4PVPlacement(G4RotationMatrix* pRot,
                  const G4ThreeVector& tlate,
                  G4LogicalVolume* pCurrentLogical,
                  const G4String& pName,
                  G4LogicalVolume* pMotherLogical,
                  G4bool pMany,
                  G4int pCopyNo,
                  G4bool pSurfChk = false);

    // Constructor 2: Object transformation (G4Transform3D) with mother logical volume
    G4PVPlacement(const G4Transform3D& Transform3D,
                  G4LogicalVolume* pCurrentLogical,
                  const G4String& pName,
                  G4LogicalVolume* pMotherLogical,
                  G4bool pMany,
                  G4int pCopyNo,
                  G4bool pSurfChk = false);

    // Constructor 3: Frame transformation with mother physical volume
    G4PVPlacement(G4RotationMatrix* pRot,
                  const G4ThreeVector& tlate,
                  const G4String& pName,
                  G4LogicalVolume* pLogical,
                  G4VPhysicalVolume* pMother,
                  G4bool pMany,
                  G4int pCopyNo,
                  G4bool pSurfChk = false);

    // Constructor 4: Object transformation (G4Transform3D) with mother physical volume
    G4PVPlacement(const G4Transform3D& Transform3D,
                  const G4String& pName,
                  G4LogicalVolume* pLogical,
                  G4VPhysicalVolume* pMother,
                  G4bool pMany,
                  G4int pCopyNo,
                  G4bool pSurfChk = false);

    // Destructor
    ~G4PVPlacement() override;

    // Copy number management
    G4int GetCopyNo() const override;
    void SetCopyNo(G4int CopyNo) override;

    // Overlap detection
    G4bool CheckOverlaps(G4int res = 1000,
                         G4double tol = 0.,
                         G4bool verbose = true,
                         G4int maxErr = 1) override;

    // Implementation of pure virtual methods from base class
    G4bool IsMany() const override;
    G4bool IsReplicated() const override;
    G4bool IsParameterised() const override;
    G4VPVParameterisation* GetParameterisation() const override;
    void GetReplicationData(EAxis& axis, G4int& nReplicas,
                            G4double& width, G4double& offset,
                            G4bool& consuming) const override;
    G4bool IsRegularStructure() const override;
    G4int GetRegularStructureId() const override;
    EVolume VolumeType() const override;

  private:
    G4bool fmany = false;              // Overlapping structure flag (not used)
    G4bool fallocatedRotM = false;     // Flag for rotation matrix ownership
    G4int fcopyNo = 0;                 // Copy number for identification
};
```

## Constructors

G4PVPlacement provides four constructors that differ in:
1. **Transformation style**: Frame (rotation + translation) vs Object (G4Transform3D)
2. **Mother specification**: Logical volume vs Physical volume

### Constructor 1: Frame Transformation with Mother Logical Volume

**Signature**:
```cpp
G4PVPlacement(G4RotationMatrix* pRot,
              const G4ThreeVector& tlate,
              G4LogicalVolume* pCurrentLogical,
              const G4String& pName,
              G4LogicalVolume* pMotherLogical,
              G4bool pMany,
              G4int pCopyNo,
              G4bool pSurfChk = false);
```
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:99-118`

**Parameters**:
- `pRot` - Pointer to rotation matrix for the reference frame (nullptr = no rotation)
- `tlate` - Translation vector in mother's coordinate system
- `pCurrentLogical` - Logical volume being placed
- `pName` - Name for this physical volume
- `pMotherLogical` - Mother's logical volume (nullptr for world volume)
- `pMany` - Overlapping structure flag (legacy, not used - set to false)
- `pCopyNo` - Copy number identifier (typically 0 for unique placements)
- `pSurfChk` - If true, automatically calls CheckOverlaps() after construction

**Actions**:
1. Calls G4VPhysicalVolume base constructor with rotation and translation
2. Validates that volume is not being placed inside itself (FatalException if so)
3. Sets mother logical volume
4. Calls `pMotherLogical->AddDaughter(this)` to register with hierarchy
5. Optionally runs overlap check if `pSurfChk=true`

**Frame Transformation Semantics**:
- Rotation describes how the daughter's reference frame is rotated
- Translation specifies where the daughter's origin is in mother's frame
- Point transformation: `p_mother = Rotation * p_daughter + Translation`

**Example**:
```cpp
// Create a box rotated 45° around Z and translated
G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateZ(45*deg);
G4ThreeVector pos(10*cm, 5*cm, 0);

G4PVPlacement* detectorPV = new G4PVPlacement(
    rot,                    // Rotation matrix
    pos,                    // Position in mother
    detectorLV,             // Logical volume to place
    "Detector",            // Physical volume name
    worldLV,                // Mother logical volume
    false,                  // pMany (not used)
    0,                      // Copy number
    true                    // Check overlaps
);
```

**Memory Management**: The rotation matrix pointer is NOT owned by G4PVPlacement in this constructor. The user must manage its lifetime (typically make it static or a class member).

### Constructor 2: Object Transformation with Mother Logical Volume

**Signature**:
```cpp
G4PVPlacement(const G4Transform3D& Transform3D,
              G4LogicalVolume* pCurrentLogical,
              const G4String& pName,
              G4LogicalVolume* pMotherLogical,
              G4bool pMany,
              G4int pCopyNo,
              G4bool pSurfChk = false);
```
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:123-144`

**Parameters**: Same as Constructor 1, except:
- `Transform3D` - Combined rotation and translation of the solid (NOT the frame)

**Object Transformation Semantics**:
- Describes how to move and rotate the solid object
- First rotate the solid to align with mother's coordinate system
- Then translate to final position
- More intuitive for users who think about "moving objects"

**Implementation Details**:
1. Extracts rotation: `Transform3D.getRotation().inverse()` (inverted for frame)
2. Extracts translation: `Transform3D.getTranslation()`
3. Creates new rotation matrix via `NewPtrRotMatrix()` helper
4. Sets `fallocatedRotM = true` to indicate ownership

**Example**:
```cpp
// Place a box at (10, 5, 0) cm rotated 45° around Z
// Using object transformation (more intuitive)
G4RotationMatrix rot;
rot.rotateZ(45*deg);
G4ThreeVector pos(10*cm, 5*cm, 0);
G4Transform3D transform(rot, pos);

G4PVPlacement* detectorPV = new G4PVPlacement(
    transform,              // Combined transformation
    detectorLV,             // Logical volume to place
    "Detector",            // Physical volume name
    worldLV,                // Mother logical volume
    false,                  // pMany (not used)
    0,                      // Copy number
    true                    // Check overlaps
);
```

**Memory Management**: G4PVPlacement OWNS the rotation matrix created internally. It will delete it in the destructor.

### Constructor 3: Frame Transformation with Mother Physical Volume

**Signature**:
```cpp
G4PVPlacement(G4RotationMatrix* pRot,
              const G4ThreeVector& tlate,
              const G4String& pName,
              G4LogicalVolume* pLogical,
              G4VPhysicalVolume* pMother,
              G4bool pMany,
              G4int pCopyNo,
              G4bool pSurfChk = false);
```
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:40-63`

**Parameters**: Same as Constructor 1, except:
- `pMother` - Mother's physical volume (instead of logical volume)

**Use Case**: When building geometry bottom-up and you have the mother's physical volume reference.

**Implementation**: Extracts mother logical volume via `pMother->GetLogicalVolume()`

**Example**:
```cpp
// Place using mother physical volume reference
G4PVPlacement* daughterPV = new G4PVPlacement(
    nullptr,                // No rotation
    G4ThreeVector(0, 0, 5*cm),
    "Daughter",
    daughterLV,
    motherPV,               // Mother PHYSICAL volume
    false, 0, false
);
```

### Constructor 4: Object Transformation with Mother Physical Volume

**Signature**:
```cpp
G4PVPlacement(const G4Transform3D& Transform3D,
              const G4String& pName,
              G4LogicalVolume* pLogical,
              G4VPhysicalVolume* pMother,
              G4bool pMany,
              G4int pCopyNo,
              G4bool pSurfChk = false);
```
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:68-92`

**Parameters**: Combines Constructor 2 and 3 features

**Example**:
```cpp
G4Transform3D transform(G4RotateZ3D(45*deg), G4ThreeVector(10*cm, 0, 0));
G4PVPlacement* detectorPV = new G4PVPlacement(
    transform,
    "Detector",
    detectorLV,
    motherPV,               // Mother PHYSICAL volume
    false, 0, true
);
```

## Frame vs Object Transformations

Understanding the difference between frame and object transformations is crucial for correct geometry construction.

### Frame Transformation (Constructors 1 & 3)

**Concept**: Describes how the daughter's reference frame is positioned relative to mother.

**Mathematics**:
```
p_mother = R_frame * p_daughter + t_frame
```

**Mental Model**:
- "The daughter's coordinate system is rotated by R and its origin is at position t"
- Standard in navigation and tracking code

**Example**:
```cpp
// Rotate frame 90° around Z, place origin at (10, 0, 0)
G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateZ(90*deg);
G4ThreeVector pos(10*cm, 0, 0);

// A point at daughter's (1,0,0) will be at mother's (10,0,1) due to rotation
G4PVPlacement* pv = new G4PVPlacement(rot, pos, daughterLV, "D", motherLV, false, 0);
```

### Object Transformation (Constructors 2 & 4)

**Concept**: Describes how to move and rotate the solid object.

**Mathematics**:
```
p_mother = R_object * p_local + t_object
where R_frame = R_object.inverse()
```

**Mental Model**:
- "Rotate the object, then move it to position t"
- More intuitive for geometry construction

**Example**:
```cpp
// Rotate object 90° around Z, move to (10, 0, 0)
G4RotationMatrix rot;
rot.rotateZ(90*deg);
G4Transform3D transform(rot, G4ThreeVector(10*cm, 0, 0));

// Same final position as frame transformation, but think about it differently
G4PVPlacement* pv = new G4PVPlacement(transform, daughterLV, "D", motherLV, false, 0);
```

### Reflection Matrices

Both transformation types support reflection matrices (det(R) = -1):

```cpp
// Create reflection across XY plane
G4RotationMatrix* reflect = new G4RotationMatrix();
reflect->set(0, 0,  1,  // X stays
             0, 1,  0,  // Y stays
             2, 0,  0, -1);  // Z flips

// Use in placement
G4PVPlacement* mirrorPV = new G4PVPlacement(
    reflect,
    G4ThreeVector(0, 0, -10*cm),
    mirrorLV, "Mirror", worldLV, false, 0
);
```

**Important**: Reflections invert the handedness of the coordinate system, which affects surface normals and particle tracking.

## Overlap Detection

### CheckOverlaps()

**Signature**:
```cpp
G4bool CheckOverlaps(G4int res = 1000,
                     G4double tol = 0.,
                     G4bool verbose = true,
                     G4int maxErr = 1) override;
```
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:245-548`

Verifies that the placed volume does not overlap with mother or sister volumes.

**Parameters**:
- `res` - Number of random surface points to test (default: 1000)
- `tol` - Tolerance for ignoring small overlaps in mm (default: 0 = maximum precision)
- `verbose` - Print progress and results (default: true)
- `maxErr` - Maximum number of overlap errors to report before stopping (default: 1)

**Returns**: `true` if any overlaps detected, `false` if geometry is valid

**Algorithm**:

**Phase 1: Validation**
```cpp
// Line 266-280: Verify that GetPointOnSurface() works correctly
G4ThreeVector testPt = solid->GetPointOnSurface();
if (solid->Inside(testPt) != kSurface) {
    // Issue warning and abort check
}
```

**Phase 2: Generate Test Points**
```cpp
// Lines 286-305: Generate random points on daughter's surface
// Transform to mother's coordinate system and find bounding box
std::vector<G4ThreeVector> points(res);
for (G4int i = 0; i < res; ++i) {
    points[i] = Tm.TransformPoint(solid->GetPointOnSurface());
    // Track min/max for bounding sphere
}
G4ThreeVector scenter = center of points;
G4double sradius = radius of bounding sphere;
```

**Phase 3: Check Mother Overlap**
```cpp
// Lines 307-350: Test if points protrude outside mother
for (auto& p : points) {
    if (motherSolid->Inside(p) == kOutside) {
        G4double distin = motherSolid->DistanceToIn(p);
        if (distin >= tol) {  // Significant overlap
            ++overlapCount;
            // Track maximum protrusion
        }
    }
}
// Report if overlaps found
```

**Phase 4: Check Sister Volume Overlaps**
```cpp
// Lines 352-544: For each sister volume
for (auto daughter : motherLV->GetDaughters()) {
    if (daughter == this) continue;

    // Get sister's bounding box
    daughterSolid->BoundingLimits(pmin_local, pmax_local);

    if (!daughter->IsRotated()) {
        // Optimized check for translated-only volumes (lines 373-403)
        // Use AABB (axis-aligned bounding box) rejection
        // Test points inside daughter's bounding box
    } else {
        // Full check with rotation (lines 405-473)
        // Use bounding sphere rejection
        // Transform bounding box corners
        // Test points in transformed coordinates
    }

    // Check for full encapsulation (lines 501-543)
    // Generate point inside sister, verify not inside this volume
}
```

**Optimization Techniques**:
1. **Bounding sphere culling**: Skip distant sisters using sphere-sphere test
2. **AABB culling**: Fast rejection for axis-aligned sisters
3. **Bounding box caching**: Reuse bounding limits for identical solids
4. **Early termination**: Stop after `maxErr` overlaps

**Example Usage**:
```cpp
// Basic check with defaults
if (detectorPV->CheckOverlaps()) {
    G4cerr << "ERROR: Detector has overlaps!" << G4endl;
}

// Thorough check with many points
if (detectorPV->CheckOverlaps(10000, 0., true, 10)) {
    G4cerr << "Found overlaps (up to 10 reported)" << G4endl;
}

// Quick check with tolerance
if (detectorPV->CheckOverlaps(500, 0.01*mm, false)) {
    // Silently detected overlaps > 0.01mm
}
```

**Performance**:
- **Time complexity**: O(res × n_sisters)
- **Typical cost**: ~0.1-1 second per volume with 1000 points
- **Recommendation**: Run during geometry construction, not in production

**Limitations**:
1. **Probabilistic**: May miss overlaps if random points don't sample them
2. **Surface-only**: Only tests daughter's surface points (not interior)
3. **Not exhaustive**: Increase `res` for higher confidence
4. **False negatives possible**: Complex geometries may need manual verification

## Implementation of Base Class Methods

G4PVPlacement implements all pure virtual methods from G4VPhysicalVolume:

### VolumeType()
**Returns**: `kNormal`
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:237-240`

Identifies this as a normal placement volume (not replica or parameterized).

### IsMany()
**Returns**: Value of `fmany` flag
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:166-169`

Historical feature for overlapping volumes. Always set to `false` in modern usage.

### IsReplicated()
**Returns**: `false`
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:182-185`

G4PVPlacement is not a replicated volume.

### IsParameterised()
**Returns**: `false`
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:190-193`

G4PVPlacement is not a parameterized volume.

### GetParameterisation()
**Returns**: `nullptr`
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:198-201`

No parameterization object.

### GetReplicationData()
**Implementation**: No-op
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:206-210`

Not applicable for simple placements.

### IsRegularStructure() / GetRegularStructureId()
**Returns**: `false` / `0`
**Lines**: `source/geometry/volumes/src/G4PVPlacement.cc:217-230`

Not a regular structure for optimization.

## Memory Management

### Rotation Matrix Ownership

G4PVPlacement uses the `fallocatedRotM` flag to track rotation matrix ownership:

**User-Provided Rotation** (Constructors 1 & 3):
```cpp
G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateY(30*deg);
G4PVPlacement* pv = new G4PVPlacement(rot, pos, lv, "PV", mother, false, 0);
// fallocatedRotM = false
// User must manage 'rot' lifetime (don't delete while PV exists!)
```

**Internally-Allocated Rotation** (Constructors 2 & 4):
```cpp
G4Transform3D transform(...);
G4PVPlacement* pv = new G4PVPlacement(transform, lv, "PV", mother, false, 0);
// fallocatedRotM = true if rotation is non-identity
// PV owns rotation matrix, will delete in destructor
```

**Destructor**:
```cpp
// Line 158-161
G4PVPlacement::~G4PVPlacement() {
    if (fallocatedRotM) {
        delete this->GetRotation();
    }
}
```

### NewPtrRotMatrix() Helper

**Signature**:
```cpp
static G4RotationMatrix* NewPtrRotMatrix(const G4RotationMatrix& RotMat);
```
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:560-573`

Creates a rotation matrix on the heap, but returns `nullptr` if rotation is identity.

**Algorithm**:
```cpp
if (RotMat.isIdentity()) {
    return nullptr;  // Save memory
} else {
    return new G4RotationMatrix(RotMat);  // Copy to heap
}
```

**Purpose**: Optimize memory by avoiding allocation for identity rotations.

## Copy Number Management

### GetCopyNo()
**Returns**: `fcopyNo`
**Line**: Header inline, line 158

### SetCopyNo()
**Line**: `source/geometry/volumes/src/G4PVPlacement.cc:174-177`

Sets the copy number identifier.

**Use Cases**:
- **Unique volumes**: Typically 0
- **Multiple identical volumes**: 0, 1, 2, ... for identification
- **Sensitive detectors**: Used to identify which detector element was hit
- **Scoring**: Associate hits with specific geometric elements

**Example**:
```cpp
// Place multiple identical detectors
for (G4int i = 0; i < 10; ++i) {
    G4ThreeVector pos(i*10*cm, 0, 0);
    new G4PVPlacement(nullptr, pos, detectorLV,
                      "Detector", worldLV, false, i);  // Copy number = i
}
```

## Usage Examples

### Example 1: Simple World Volume

```cpp
// World volume (no mother, no rotation, centered at origin)
G4Box* worldBox = new G4Box("World", 10*m, 10*m, 10*m);
G4LogicalVolume* worldLV = new G4LogicalVolume(worldBox, air, "World");

G4PVPlacement* worldPV = new G4PVPlacement(
    nullptr,                // No rotation
    G4ThreeVector(),       // At origin
    worldLV,                // Logical volume
    "World",               // Name
    nullptr,                // No mother (this IS the world)
    false,                  // pMany
    0,                      // Copy number
    false                   // Don't check overlaps (world has no mother)
);
```

### Example 2: Detector in World

```cpp
// Create detector logical volume
G4Box* detBox = new G4Box("Detector", 50*cm, 50*cm, 100*cm);
G4Material* silicon = nist->FindOrBuildMaterial("G4_Si");
G4LogicalVolume* detectorLV = new G4LogicalVolume(detBox, silicon, "Detector");

// Place at position (2m, 0, 0) without rotation
G4PVPlacement* detectorPV = new G4PVPlacement(
    nullptr,                           // No rotation
    G4ThreeVector(2*m, 0, 0),        // Position
    detectorLV,                        // Daughter logical volume
    "Detector",                       // Name
    worldLV,                           // Mother logical volume
    false,                             // pMany
    0,                                 // Copy number
    true                               // Check for overlaps
);
```

### Example 3: Rotated Placement

```cpp
// Create rotation matrix (persistent - make it a member variable!)
G4RotationMatrix* rotation = new G4RotationMatrix();
rotation->rotateY(45*deg);           // Rotate 45° around Y axis
rotation->rotateX(30*deg);           // Then 30° around (new) X axis

G4PVPlacement* rotatedPV = new G4PVPlacement(
    rotation,                          // Frame rotation
    G4ThreeVector(1*m, 0.5*m, 0),   // Position
    componentLV,
    "RotatedComponent",
    worldLV,
    false, 0, true
);
```

### Example 4: Using G4Transform3D (Object Transformation)

```cpp
// More intuitive: think about moving and rotating the object
G4RotationMatrix rot;
rot.rotateY(45*deg);
rot.rotateX(30*deg);
G4ThreeVector pos(1*m, 0.5*m, 0);

G4Transform3D transform(rot, pos);

G4PVPlacement* objectPV = new G4PVPlacement(
    transform,              // Combined transformation
    componentLV,
    "Component",
    worldLV,
    false, 0, true
);
// Rotation matrix is automatically managed by G4PVPlacement
```

### Example 5: Multiple Placements with Copy Numbers

```cpp
// Place 10 identical crystal detectors in a row
for (G4int i = 0; i < 10; ++i) {
    G4ThreeVector pos(0, i*5*cm, 0);  // Spaced 5cm apart in Y

    new G4PVPlacement(
        nullptr,            // No rotation
        pos,
        crystalLV,         // Same logical volume for all
        "Crystal",         // Same name for all
        calorimeterLV,     // Mother volume
        false,
        i,                 // Copy number identifies which crystal
        i == 0             // Only check first for overlaps (saves time)
    );
}
```

### Example 6: Reflected Placement

```cpp
// Create a component and its mirror image
G4RotationMatrix* reflection = new G4RotationMatrix();
reflection->set(1,  0,  0,    // Keep X
                0,  1,  0,    // Keep Y
                0,  0, -1);   // Flip Z (reflection across XY plane)

// Original component at +Z
G4PVPlacement* componentPV = new G4PVPlacement(
    nullptr, G4ThreeVector(0, 0, 10*cm),
    componentLV, "Component", worldLV, false, 0
);

// Reflected component at -Z
G4PVPlacement* mirrorPV = new G4PVPlacement(
    reflection, G4ThreeVector(0, 0, -10*cm),
    componentLV, "ComponentMirror", worldLV, false, 1
);
```

### Example 7: Complex Hierarchy

```cpp
// Build detector module with internal structure
// Module contains housing with crystal inside

G4Box* housingBox = new G4Box("Housing", 6*cm, 6*cm, 12*cm);
G4LogicalVolume* housingLV = new G4LogicalVolume(housingBox, aluminum, "Housing");

G4Box* crystalBox = new G4Box("Crystal", 5*cm, 5*cm, 10*cm);
G4LogicalVolume* crystalLV = new G4LogicalVolume(crystalBox, BGO, "Crystal");

// Place crystal inside housing (centered)
G4PVPlacement* crystalPV = new G4PVPlacement(
    nullptr, G4ThreeVector(),  // Centered in housing
    crystalLV, "Crystal", housingLV, false, 0, true
);

// Place complete module in world
G4PVPlacement* modulePV = new G4PVPlacement(
    nullptr, G4ThreeVector(50*cm, 0, 0),
    housingLV, "Module", worldLV, false, 0, true
);
```

### Example 8: Overlap Checking Best Practices

```cpp
// During development: thorough checking
#ifdef GEOMETRY_DEBUG
    const G4int nPoints = 10000;     // Many points
    const G4double tolerance = 0;     // Maximum precision
    const G4int maxErrors = 100;      // See all problems
#else
    const G4int nPoints = 1000;       // Standard
    const G4double tolerance = 0;
    const G4int maxErrors = 1;        // Stop at first
#endif

G4PVPlacement* detectorPV = new G4PVPlacement(
    nullptr, position, detectorLV, "Detector", worldLV, false, 0
);

if (detectorPV->CheckOverlaps(nPoints, tolerance, true, maxErrors)) {
    G4Exception("DetectorConstruction::Construct()",
                "GeometryError", FatalException,
                "Overlaps detected in geometry!");
}
```

## Common Pitfalls

### Pitfall 1: Dangling Rotation Matrix Pointer

```cpp
// WRONG - rotation matrix goes out of scope
void BuildGeometry() {
    G4RotationMatrix rot;  // Local variable!
    rot.rotateY(45*deg);
    new G4PVPlacement(&rot, pos, lv, "PV", mother, false, 0);
    // CRASH! 'rot' destroyed at end of function
}

// CORRECT - make rotation persistent
class DetectorConstruction {
    G4RotationMatrix* fRotation;  // Member variable

    void BuildGeometry() {
        fRotation = new G4RotationMatrix();
        fRotation->rotateY(45*deg);
        new G4PVPlacement(fRotation, pos, lv, "PV", mother, false, 0);
        // OK - fRotation persists with object
    }
};

// ALTERNATIVE - use G4Transform3D (automatic management)
void BuildGeometry() {
    G4RotationMatrix rot;
    rot.rotateY(45*deg);
    G4Transform3D transform(rot, pos);
    new G4PVPlacement(transform, lv, "PV", mother, false, 0);
    // OK - G4PVPlacement makes internal copy
}
```

### Pitfall 2: Self-Placement

```cpp
// WRONG - placing volume inside itself
G4LogicalVolume* boxLV = new G4LogicalVolume(box, material, "Box");
new G4PVPlacement(nullptr, G4ThreeVector(), boxLV, "Box", boxLV, false, 0);
// FatalException: "Cannot place a volume inside itself!"
```

### Pitfall 3: Forgetting to Check Overlaps

```cpp
// WRONG - never validate geometry
new G4PVPlacement(nullptr, pos, detectorLV, "Det", worldLV, false, 0);
// May have overlaps that cause tracking errors!

// CORRECT - check during construction
new G4PVPlacement(nullptr, pos, detectorLV, "Det", worldLV, false, 0, true);
// OR explicitly:
G4PVPlacement* pv = new G4PVPlacement(...);
if (pv->CheckOverlaps()) {
    G4cerr << "Overlap detected!" << G4endl;
}
```

### Pitfall 4: Frame vs Object Confusion

```cpp
// These are NOT the same!

// Frame transformation: rotate frame 90° around Z
G4RotationMatrix* rot1 = new G4RotationMatrix();
rot1->rotateZ(90*deg);
G4PVPlacement* pv1 = new G4PVPlacement(
    rot1, G4ThreeVector(), lv, "PV1", mother, false, 0
);

// Object transformation: rotate object 90° around Z
G4RotationMatrix rot2;
rot2.rotateZ(90*deg);
G4Transform3D transform(rot2, G4ThreeVector());
G4PVPlacement* pv2 = new G4PVPlacement(
    transform, lv, "PV2", mother, false, 0
);

// pv1 and pv2 have OPPOSITE rotations!
// Frame rotation = object rotation INVERTED
```

### Pitfall 5: Modifying Rotation After Placement

```cpp
// WRONG - modifying rotation matrix after use
G4RotationMatrix* rot = new G4RotationMatrix();
rot->rotateY(45*deg);
G4PVPlacement* pv = new G4PVPlacement(rot, pos, lv, "PV", mother, false, 0);

// Later...
rot->rotateX(30*deg);  // WRONG! Changes already-placed volume
                        // Breaks geometry cache, causes undefined behavior
```

## Performance Considerations

### Construction Time

**Typical Costs**:
- Basic placement: ~1-10 µs
- With overlap check (1000 points): ~100 ms - 1 s
- Complex geometry with many sisters: ~1-10 s per volume

**Optimization**:
```cpp
// Skip overlap checks in production
#ifdef GEOMETRY_DEBUG
    G4bool checkOverlaps = true;
#else
    G4bool checkOverlaps = false;
#endif

new G4PVPlacement(nullptr, pos, lv, "PV", mother, false, 0, checkOverlaps);
```

### Memory Footprint

**Per G4PVPlacement**:
- Base object: ~80 bytes
- Rotation matrix (if allocated): 72 bytes
- Total: ~150 bytes per placed volume

**For large detectors**:
```cpp
// 100,000 placed volumes = ~15 MB
// Consider using G4PVReplica or G4PVParameterised for repeated structures
```

### Overlap Checking Complexity

**Algorithm Complexity**: O(res × n_sisters)
- `res` = number of test points
- `n_sisters` = number of sibling volumes

**Example**:
```cpp
// Mother with 100 daughters, 1000 points each
// Total checks = 100 × 1000 = 100,000 point-in-solid tests
// Time: ~1-10 seconds depending on solid complexity

// Reduce for faster checks
detectorPV->CheckOverlaps(100);  // 10x faster, less thorough
```

## Thread Safety

G4PVPlacement inherits thread-safe design from G4VPhysicalVolume:

**Read-Only After Construction** (thread-safe):
- Rotation matrix
- Translation vector
- Logical volume pointers
- Copy number
- All geometry queries

**Not Thread-Safe**:
- Modifying transformation during simulation
- Changing logical volumes during simulation

**Best Practice**: Construct entire geometry on master thread before starting workers.

## See Also

- [G4VPhysicalVolume](g4vphysicalvolume.md) - Base class for all physical volumes
- [G4LogicalVolume](g4logicalvolume.md) - Logical volume definition
- [G4VSolid](g4vsolid.md) - Solid shapes
- [G4PVReplica](g4pvreplica.md) - For repeated structures
- [G4PVParameterised](g4pvparameterised.md) - For custom parameterizations
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/volumes/include/G4PVPlacement.hh`
- Implementation: `source/geometry/volumes/src/G4PVPlacement.cc`

### Related Classes
- `G4PhysicalVolumeStore` - Global registry of all physical volumes
- `G4Transform3D` - Combined rotation and translation
- `G4RotationMatrix` - 3D rotation matrix
- `G4ThreeVector` - 3D vector for positions
- `G4AffineTransform` - Transformation for navigation

### External Documentation
- [Geant4 User Guide: Geometry](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geometry.html)
- [Geant4 Class Documentation](http://geant4.kek.jp/Reference/)
