# G4VPhysicalVolume

**Base Class**: None (abstract base class)
**Derived Classes**: [G4PVPlacement](g4pvplacement.md), G4PVReplica, G4PVParameterised, G4PVDivision
**Location**: `source/geometry/management/include/G4VPhysicalVolume.hh`
**Source**: `source/geometry/management/src/G4VPhysicalVolume.cc`

## Overview

G4VPhysicalVolume is the abstract base class representing positioned volumes in the Geant4 geometry hierarchy. It associates a [G4LogicalVolume](g4logicalvolume.md) with a specific position and orientation in 3D space, relative to a mother volume's coordinate system. A single physical volume can represent either a single placement or many positioned volumes (replicas/parameterization).

Think of G4VPhysicalVolume as the "WHERE" component of geometry - it specifies where a logical volume (the "WHAT") is placed in the detector.

## Key Features

- **Position and Orientation**: Defines transformation (rotation + translation) relative to mother
- **Volume Multiplicity**: Can represent single or multiple placements
- **Hierarchy Management**: Links daughter to mother logical volume
- **Thread-Safe Transformations**: Per-thread rotation/translation via G4GeomSplitter
- **Copy Number System**: Identifies instances within replicas/parameterization
- **Type System**: Distinguishes placement, replica, and parameterized volumes
- **Overlap Detection**: Virtual method for geometry validation

## Class Hierarchy

```
G4VPhysicalVolume (abstract)
├── G4PVPlacement      (single positioned volume)
├── G4PVReplica        (linear replications)
├── G4PVParameterised  (custom parameterization)
└── G4PVDivision       (systematic divisions)
```

## Class Definition

```cpp
class G4VPhysicalVolume
{
  public:
    // Constructor
    G4VPhysicalVolume(G4RotationMatrix* pRot,
                      const G4ThreeVector& tlate,
                      const G4String& pName,
                      G4LogicalVolume* pLogical,
                      G4VPhysicalVolume* pMother);

    // Virtual destructor
    virtual ~G4VPhysicalVolume();

    // Pure virtual methods (must be implemented by derived classes)
    virtual G4bool IsMany() const = 0;
    virtual G4bool IsReplicated() const = 0;
    virtual G4bool IsParameterised() const = 0;
    virtual G4VPVParameterisation* GetParameterisation() const = 0;
    virtual void GetReplicationData(EAxis& axis,
                                    G4int& nReplicas,
                                    G4double& width,
                                    G4double& offset,
                                    G4bool& consuming) const = 0;
    virtual G4int GetCopyNo() const = 0;
    virtual void SetCopyNo(G4int CopyNo) = 0;
    virtual EVolume VolumeType() const = 0;
    virtual G4bool IsRegularStructure() const = 0;
    virtual G4int GetRegularStructureId() const = 0;

    // Virtual methods with default implementations
    virtual G4int GetMultiplicity() const;
    virtual G4bool CheckOverlaps(G4int res=1000, G4double tol=0.,
                                 G4bool verbose=true, G4int errMax=1);

    // Transformation access
    const G4RotationMatrix* GetFrameRotation() const;
    G4ThreeVector GetFrameTranslation() const;
    G4RotationMatrix GetObjectRotationValue() const;
    G4ThreeVector GetObjectTranslation() const;

    // Logical volume access
    G4LogicalVolume* GetLogicalVolume() const;
    void SetLogicalVolume(G4LogicalVolume* pLogical);
    G4LogicalVolume* GetMotherLogical() const;
    void SetMotherLogical(G4LogicalVolume* pMother);

    // Name management
    const G4String& GetName() const;
    void SetName(const G4String& pName);

    // Thread safety
    G4int GetInstanceID() const;
    void InitialiseWorker(G4VPhysicalVolume* pMasterObject,
                          G4RotationMatrix* pRot,
                          const G4ThreeVector& tlate);

  protected:
    G4int instanceID;  // Per-thread instance ID
    static G4PVManager subInstanceManager;  // Thread-local data manager

  private:
    G4LogicalVolume* flogical;   // Associated logical volume
    G4String fname;              // Volume name
    G4LogicalVolume* flmother;   // Mother logical volume
};
```

## Constructors and Destructor

### Constructor

**Signature**:
```cpp
G4VPhysicalVolume(G4RotationMatrix* pRot,
                  const G4ThreeVector& tlate,
                  const G4String& pName,
                  G4LogicalVolume* pLogical,
                  G4VPhysicalVolume* pMother);
```

**Parameters**:
- `pRot` - Rotation matrix for the frame (nullptr = no rotation)
- `tlate` - Translation vector in mother's coordinate system
- `pName` - Name for this physical volume
- `pLogical` - Logical volume being placed
- `pMother` - Mother physical volume (nullptr for world volume)

**Actions**:
1. Creates per-thread instance ID
2. Sets rotation and translation in thread-local data
3. Stores logical volume and mother pointers
4. Registers with G4PhysicalVolumeStore

**Note**: Usually called from derived class constructors, not directly.

### Destructor

**Signature**: `virtual ~G4VPhysicalVolume()`

Cleans up:
- Deletes shadow data for persistency
- Deregisters from G4PhysicalVolumeStore

**Virtual**: Allows proper cleanup of derived classes

## Pure Virtual Methods

These methods **must** be implemented by all derived classes to define volume-specific behavior.

### VolumeType()

**Signature**: `virtual EVolume VolumeType() const = 0`

Returns the volume type enum:
- `kNormal` - Simple placement ([G4PVPlacement](g4pvplacement.md))
- `kReplica` - Replicated volume (G4PVReplica)
- `kParameterised` - Parameterized volume (G4PVParameterised)
- `kExternal` - External navigation (advanced)

**Purpose**: Runtime type identification without RTTI

### IsMany()

**Signature**: `virtual G4bool IsMany() const = 0`

Returns true if volume represents "MANY" volumes (overlapping structures - not fully implemented).

**Current Status**: Historical feature, typically returns `false`

### IsReplicated()

**Signature**: `virtual G4bool IsReplicated() const = 0`

Returns true if this physical volume represents multiple replicated instances.

**Returns**:
- G4PVPlacement: `false`
- G4PVReplica: `true`
- G4PVParameterised: `true`

**Purpose**: Distinguishes single vs multiple placements

### IsParameterised()

**Signature**: `virtual G4bool IsParameterised() const = 0`

Returns true if volume uses parameterization for custom positioning.

**Returns**:
- G4PVPlacement: `false`
- G4PVReplica: `false`
- G4PVParameterised: `true`

### GetParameterisation()

**Signature**: `virtual G4VPVParameterisation* GetParameterisation() const = 0`

Returns the parameterisation object that computes transformations and dimensions.

**Returns**:
- G4PVPlacement: `nullptr`
- G4PVReplica: `nullptr`
- G4PVParameterised: pointer to G4VPVParameterisation instance

### GetReplicationData()

**Signature**:
```cpp
virtual void GetReplicationData(EAxis& axis,
                                G4int& nReplicas,
                                G4double& width,
                                G4double& offset,
                                G4bool& consuming) const = 0;
```

Returns replication information for replicas/parameterized volumes.

**Output Parameters**:
- `axis` - Replication axis (kXAxis, kYAxis, kZAxis, kRho, kPhi, kRadial3D)
- `nReplicas` - Number of replica copies
- `width` - Width of each replica slice
- `offset` - Offset along axis
- `consuming` - True for replicas (consuming mother space), false for parameterized

**G4PVPlacement Implementation**: No-op (not replicated)

### GetCopyNo() / SetCopyNo()

**Signature**:
```cpp
virtual G4int GetCopyNo() const = 0;
virtual void SetCopyNo(G4int CopyNo) = 0;
```

Gets/sets the copy number identifying this volume instance.

**Copy Number Usage**:
- **Single placement**: Arbitrary identifier (often 0)
- **Replicas**: Sequential index (0, 1, 2, ..., n-1)
- **Parameterized**: Index for computing transformation
- **Sensitive detectors**: Identifies which volume recorded a hit

### IsRegularStructure() / GetRegularStructureId()

**Signature**:
```cpp
virtual G4bool IsRegularStructure() const = 0;
virtual G4int GetRegularStructureId() const = 0;
```

Indicates if volume has regular voxel structure for optimized navigation.

**Returns**: Usually `false` for normal volumes, `true` for specialized regular structures

## Virtual Methods with Default Implementations

### GetMultiplicity()

**Signature**: `virtual G4int GetMultiplicity() const`

Returns the number of physical instances represented by this volume.

**Default Implementation**: Returns 1

**Override For**:
- G4PVReplica: Returns `nReplicas`
- G4PVParameterised: Returns `nCopies`

### CheckOverlaps()

**Signature**:
```cpp
virtual G4bool CheckOverlaps(G4int res=1000,
                             G4double tol=0.,
                             G4bool verbose=true,
                             G4int errMax=1);
```

Verifies if this volume overlaps with mother or sister volumes.

**Default Implementation**: Returns `false` (no checking)

**Overridden By**: G4PVPlacement and G4PVParameterised

**See**: [G4PVPlacement::CheckOverlaps()](g4pvplacement.md#overlap-checking) for detailed algorithm

## Transformation Methods

G4VPhysicalVolume stores transformations and provides two perspectives: **frame** and **object**.

### Frame vs Object Transformations

**Frame Transformation** (most common):
- Describes how the **reference frame** is rotated and translated
- Used internally by navigation
- Rotation + Translation define where the daughter's origin is in mother's frame

**Object Transformation**:
- Describes how the **solid** is rotated and translated
- Inverse of frame transformation
- Legacy interface, less commonly used

### GetFrameRotation()

**Signature**: `const G4RotationMatrix* GetFrameRotation() const`

Returns the rotation matrix for the reference frame.

**Returns**: Pointer to rotation matrix, or `nullptr` if no rotation

**Thread-Safe**: Accesses thread-local data

### GetFrameTranslation()

**Signature**: `G4ThreeVector GetFrameTranslation() const`

Returns the translation vector in mother's coordinate system.

**Returns**: Translation vector (note: returns **negative** of internal storage)

### GetObjectRotationValue()

**Signature**: `G4RotationMatrix GetObjectRotationValue() const`

Returns the object rotation (inverse of frame rotation).

**Returns**: Rotation matrix by value

### GetObjectTranslation()

**Signature**: `G4ThreeVector GetObjectTranslation() const`

Returns the object translation (same as frame translation).

**Returns**: Translation vector

### SetTranslation() / SetRotation()

**Signature**:
```cpp
void SetTranslation(const G4ThreeVector& v);
void SetRotation(G4RotationMatrix* pRot);
```

**Warning**: Internal use only! Not intended for general geometry manipulation.

**Purpose**: Used by replication/parameterization mechanisms to update transformations

## Logical Volume Methods

### GetLogicalVolume()

**Signature**: `G4LogicalVolume* GetLogicalVolume() const`

Returns the associated logical volume defining shape and material.

**Example**:
```cpp
G4LogicalVolume* lv = physVol->GetLogicalVolume();
G4VSolid* solid = lv->GetSolid();
G4Material* material = lv->GetMaterial();
```

### SetLogicalVolume()

**Signature**: `void SetLogicalVolume(G4LogicalVolume* pLogical)`

Sets a new logical volume.

**Warning**: Should not be called when geometry is closed

### GetMotherLogical()

**Signature**: `G4LogicalVolume* GetMotherLogical() const`

Returns the mother's logical volume.

**Returns**: Pointer to mother logical volume, or `nullptr` for world volume

### SetMotherLogical()

**Signature**: `void SetMotherLogical(G4LogicalVolume* pMother)`

Sets a new mother logical volume.

**Warning**: Should not be called when geometry is closed

## Name Management

### GetName()

**Signature**: `const G4String& GetName() const`

Returns the physical volume name.

### SetName()

**Signature**: `void SetName(const G4String& pName)`

Sets a new name and invalidates the physical volume store map cache.

## Thread Safety

### Multi-Threading Architecture

G4VPhysicalVolume uses **G4GeomSplitter** pattern for thread-safe transformation data:

**Thread-Local Data (G4PVData)**:
```cpp
struct G4PVData {
    G4RotationMatrix* frot;     // Rotation matrix
    G4double tx, ty, tz;        // Translation components
};
```

**Shared Read-Only Data**:
- `flogical` - Logical volume pointer
- `fname` - Volume name
- `flmother` - Mother logical volume

**Access Pattern**:
- Each thread has independent copy of G4PVData array
- `instanceID` indexes into per-thread array
- Transformations can vary per thread (for special uses)

### InitialiseWorker()

**Signature**:
```cpp
void InitialiseWorker(G4VPhysicalVolume* pMasterObject,
                      G4RotationMatrix* pRot,
                      const G4ThreeVector& tlate);
```

Initializes worker thread data by copying from master.

**Parameters**:
- `pMasterObject` - Master thread's physical volume
- `pRot` - Rotation for this worker
- `tlate` - Translation for this worker

**Actions**:
1. Copies G4PVData array from master
2. Sets worker-specific rotation and translation

## Volume Type Detection

### DeduceVolumeType()

**Signature**: `EVolume DeduceVolumeType() const`

Determines volume type from replication state.

**Algorithm**:
```cpp
if (!IsReplicated()) return kNormal;

G4bool consuming;
GetReplicationData(..., consuming);
return consuming ? kReplica : kParameterised;
```

## Usage Examples

### Example 1: Accessing Transformation

```cpp
// Get physical volume from step
G4VPhysicalVolume* physVol = step->GetPreStepPoint()->GetPhysicalVolume();

// Get frame transformation
const G4RotationMatrix* rot = physVol->GetFrameRotation();
G4ThreeVector trans = physVol->GetFrameTranslation();

G4cout << "Position: " << trans << G4endl;
if (rot) {
    G4cout << "Rotation: " << *rot << G4endl;
}
```

### Example 2: Identifying Volume Type

```cpp
void AnalyzeVolume(G4VPhysicalVolume* pv)
{
    if (pv->IsReplicated()) {
        if (pv->IsParameterised()) {
            // Parameterized volume
            G4VPVParameterisation* param = pv->GetParameterisation();
            G4cout << "Parameterized with " << pv->GetMultiplicity()
                   << " copies" << G4endl;
        } else {
            // Regular replica
            EAxis axis;
            G4int nReplicas;
            G4double width, offset;
            G4bool consuming;
            pv->GetReplicationData(axis, nReplicas, width, offset, consuming);
            G4cout << "Replica: " << nReplicas << " along axis " << axis << G4endl;
        }
    } else {
        // Normal placement
        G4cout << "Simple placement" << G4endl;
    }
}
```

### Example 3: Traversing Hierarchy

```cpp
// Start from a physical volume
G4VPhysicalVolume* current = startVolume;

// Navigate up to world
while (current->GetMotherLogical() != nullptr) {
    G4LogicalVolume* motherLV = current->GetMotherLogical();
    G4cout << "Mother: " << motherLV->GetName() << G4endl;

    // Find this volume in mother's daughter list
    for (std::size_t i = 0; i < motherLV->GetNoDaughters(); ++i) {
        if (motherLV->GetDaughter(i) == current) {
            current = motherLV->GetDaughter(i);
            break;
        }
    }
}

G4cout << "Reached world volume" << G4endl;
```

### Example 4: Copy Number Usage in Sensitive Detector

```cpp
class MySD : public G4VSensitiveDetector {
public:
    G4bool ProcessHits(G4Step* step, G4TouchableHistory*) override {
        G4VPhysicalVolume* preVol = step->GetPreStepPoint()->GetPhysicalVolume();

        // Use copy number to identify detector element
        G4int copyNo = preVol->GetCopyNo();
        G4String name = preVol->GetName();

        // Create hit with identification
        MyHit* hit = new MyHit();
        hit->SetDetectorID(copyNo);
        hit->SetDetectorName(name);

        // Store hit...
        return true;
    }
};
```

### Example 5: Checking for World Volume

```cpp
bool IsWorldVolume(G4VPhysicalVolume* pv)
{
    return (pv->GetMotherLogical() == nullptr);
}

// Usage
if (IsWorldVolume(physVol)) {
    G4cout << "This is the world volume" << G4endl;
}
```

## Replica vs Parameterized vs Placement

| Feature | G4PVPlacement | G4PVReplica | G4PVParameterised |
|---------|---------------|-------------|-------------------|
| **VolumeType()** | kNormal | kReplica | kParameterised |
| **IsReplicated()** | false | true | true |
| **IsParameterised()** | false | false | true |
| **Multiplicity** | 1 | n | n |
| **GetParameterisation()** | nullptr | nullptr | Parameterisation object |
| **GetReplicationData()** | No-op | Provides axis, width, etc. | Provides count |
| **consuming flag** | N/A | true | false |
| **Navigation** | Normal | Specialized replica nav | Parameterized nav |
| **Memory** | One per placement | One for all replicas | One for all copies |
| **Flexibility** | Full control | Linear divisions only | Arbitrary positioning |

## Performance Considerations

### Memory Efficiency

**Single Placement (G4PVPlacement)**:
- Memory per volume: ~80 bytes + transformation data

**Replicas (G4PVReplica)**:
- Memory: Single instance for all replicas (~80 bytes total)
- Navigation: Optimized specialized algorithm
- Best for: Regular linear divisions

**Parameterized (G4PVParameterised)**:
- Memory: Single instance + parameterization object
- Navigation: Computes transformations on-the-fly
- Best for: Non-linear patterns, varying sizes

### Thread Safety

**Read-Only After Construction**:
- Logical volume pointers
- Name
- Mother logical volume

**Per-Thread Data**:
- Rotation matrix
- Translation vector

**Important**: Do NOT modify transformations during simulation!

## Common Pitfalls

### Pitfall 1: Modifying Transformations

```cpp
// WRONG - not thread-safe!
void MyAction::UserSteppingAction(const G4Step* step) {
    G4VPhysicalVolume* pv = step->GetPreStepPoint()->GetPhysicalVolume();
    G4ThreeVector newPos(1*m, 0, 0);
    pv->SetTranslation(newPos);  // CRASH in multi-threaded mode!
}
```

### Pitfall 2: Frame vs Object Confusion

```cpp
// These are NOT the same!
G4ThreeVector frameTrans = pv->GetFrameTranslation();   // Returns -translation
G4ThreeVector objTrans = pv->GetObjectTranslation();    // Returns +translation

// Usually you want frame transformation for navigation
```

### Pitfall 3: Assuming Copy Number Continuity

```cpp
// WRONG - copy numbers may have gaps
for (G4int i = 0; i < nDaughters; ++i) {
    G4VPhysicalVolume* daughter = motherLV->GetDaughter(i);
    G4int copyNo = daughter->GetCopyNo();
    // copyNo is NOT necessarily equal to i!
}
```

## See Also

- [G4PVPlacement](g4pvplacement.md) - Concrete single placement implementation
- [G4LogicalVolume](g4logicalvolume.md) - Logical volume definition
- [G4Navigator](g4navigator.md) - Uses physical volumes for tracking
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/management/include/G4VPhysicalVolume.hh`
- Implementation: `source/geometry/management/src/G4VPhysicalVolume.cc`

### Related Classes
- `G4PhysicalVolumeStore` - Global registry of physical volumes
- `G4PVManager` (G4GeomSplitter<G4PVData>) - Per-thread data manager
- `G4VPVParameterisation` - Parameterization base class
- `G4TouchableHistory` - Navigation history through volume hierarchy
