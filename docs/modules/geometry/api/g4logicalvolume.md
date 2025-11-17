# G4LogicalVolume

**Base Class**: None (not designed for inheritance - non-virtual destructor)
**Location**: `source/geometry/management/include/G4LogicalVolume.hh`
**Source**: `source/geometry/management/src/G4LogicalVolume.cc`

## Overview

G4LogicalVolume represents a complete description of a volume's physical and tracking attributes without specifying its position in space. It is the fundamental building block that associates a geometric solid shape with material properties, daughter volumes, electromagnetic fields, sensitive detectors, and physics cuts. A logical volume can be placed multiple times (via [G4PVPlacement](g4pvplacement.md)) at different locations to create the detector geometry hierarchy.

Think of G4LogicalVolume as a "volume template" - it defines WHAT a volume is (shape, material, properties) but not WHERE it is placed.

## Key Features

- **Shape-Material Association**: Links [G4VSolid](g4vsolid.md) with G4Material
- **Hierarchy Management**: Contains daughter physical volumes
- **Field Configuration**: Manages electromagnetic field propagation
- **Detector Sensitivity**: Associates with sensitive detectors for hit collection
- **Region Assignment**: Groups volumes for production cuts optimization
- **Smart Voxelization**: Automatic spatial optimization for navigation
- **Mass Calculation**: Computes physical mass of volume tree
- **Thread-Safe Design**: Per-thread data via G4GeomSplitter pattern
- **Store Registration**: Automatic registration with G4LogicalVolumeStore

## Class Definition

```cpp
class G4LogicalVolume
{
  public:
    // Constructor
    G4LogicalVolume(G4VSolid* pSolid,
                    G4Material* pMaterial,
                    const G4String& name,
                    G4FieldManager* pFieldMgr = nullptr,
                    G4VSensitiveDetector* pSDetector = nullptr,
                    G4UserLimits* pULimits = nullptr,
                    G4bool optimise = true);

    // Destructor (non-virtual - not a base class)
    ~G4LogicalVolume();

    // Solid management
    G4VSolid* GetSolid() const;
    void SetSolid(G4VSolid* pSolid);

    // Material management
    G4Material* GetMaterial() const;
    void SetMaterial(G4Material* pMaterial);
    void UpdateMaterial(G4Material* pMaterial);

    // Daughter volume management
    void AddDaughter(G4VPhysicalVolume* p);
    std::size_t GetNoDaughters() const;
    G4VPhysicalVolume* GetDaughter(const std::size_t i) const;
    G4bool IsDaughter(const G4VPhysicalVolume* p) const;
    void RemoveDaughter(const G4VPhysicalVolume* p);
    void ClearDaughters();

    // Field manager
    G4FieldManager* GetFieldManager() const;
    void SetFieldManager(G4FieldManager* pFieldMgr, G4bool forceToAllDaughters);

    // Sensitive detector
    G4VSensitiveDetector* GetSensitiveDetector() const;
    void SetSensitiveDetector(G4VSensitiveDetector* pSDetector);

    // Region and cuts
    G4Region* GetRegion() const;
    void SetRegion(G4Region* reg);
    G4bool IsRootRegion() const;
    void SetRegionRootFlag(G4bool rreg);

    // Voxelization
    G4SmartVoxelHeader* GetVoxelHeader() const;
    void SetOptimisation(G4bool optim);
    G4bool IsToOptimise() const;

    // Mass calculation
    G4double GetMass(G4bool forced = false,
                     G4bool propagate = true,
                     G4Material* parMaterial = nullptr);

    // Thread safety
    G4int GetInstanceID() const;
    void InitialiseWorker(G4LogicalVolume* pMasterObject,
                          G4VSolid* pSolid,
                          G4VSensitiveDetector* pSDetector);

  private:
    // Thread-local data via G4GeomSplitter
    G4int instanceID;
    static G4LVManager subInstanceManager;
};
```

## Constructor

### Primary Constructor

**Signature**:
```cpp
G4LogicalVolume(G4VSolid* pSolid,
                G4Material* pMaterial,
                const G4String& name,
                G4FieldManager* pFieldMgr = nullptr,
                G4VSensitiveDetector* pSDetector = nullptr,
                G4UserLimits* pULimits = nullptr,
                G4bool optimise = true);
```

**Parameters**:
- `pSolid` (required) - Pointer to solid shape defining volume geometry
- `pMaterial` (required) - Pointer to material filling the volume
- `name` (required) - Unique name identifier for this logical volume
- `pFieldMgr` (optional) - Field manager for electromagnetic fields
- `pSDetector` (optional) - Sensitive detector for hit collection
- `pULimits` (optional) - User-defined step limits
- `optimise` (optional) - Enable voxelization optimization (default: true)

**Actions**:
1. Creates per-thread instance ID via `subInstanceManager.CreateSubInstance()`
2. Sets solid and material in thread-local data
3. Initializes mass cache to 0.0 (computed on demand)
4. Registers volume with G4LogicalVolumeStore
5. Sets field manager, sensitive detector, user limits
6. Initializes shadow pointers for master thread

**Example**:
```cpp
G4Box* box = new G4Box("BoxSolid", 10*cm, 10*cm, 10*cm);
G4Material* water = G4NistManager::Instance()->FindOrBuildMaterial("G4_WATER");

G4LogicalVolume* boxLV = new G4LogicalVolume(
    box,                    // Solid shape
    water,                  // Material
    "BoxLV"                // Name
);
```

## Solid Management

### GetSolid()
**Signature**: `G4VSolid* GetSolid() const`

Returns the thread-local solid pointer. Accesses per-thread data via `G4MT_solid` macro.

**Thread-Safe**: Yes

**Example**:
```cpp
G4VSolid* solid = logicalVolume->GetSolid();
G4double volume = solid->GetCubicVolume();
```

### SetSolid()
**Signature**: `void SetSolid(G4VSolid* pSolid)`

Sets a new solid for this volume. Updates both thread-local data and master shadow pointer.

**Side Effects**:
- Invalidates mass cache
- Updates master thread pointer if called from master

**Warning**: Should only be called during geometry construction, not during tracking!

## Material Management

### GetMaterial()
**Signature**: `G4Material* GetMaterial() const`

Returns the thread-local material pointer.

**Thread-Safe**: Yes

### SetMaterial()
**Signature**: `void SetMaterial(G4Material* pMaterial)`

Sets a new material for this volume. Invalidates mass cache.

**Example**:
```cpp
G4Material* lead = G4NistManager::Instance()->FindOrBuildMaterial("G4_Pb");
logicalVolume->SetMaterial(lead);
```

### UpdateMaterial()
**Signature**: `void UpdateMaterial(G4Material* pMaterial)`

Sets material AND updates MaterialCutsCouple from region. Used during material parameterization navigation.

**Use Case**: When material varies by copy number in parameterized volumes.

## Daughter Volume Management

### AddDaughter()
**Signature**: `void AddDaughter(G4VPhysicalVolume* p)`
**Line**: `source/geometry/management/src/G4LogicalVolume.cc:316-387`

Adds a physical volume as a daughter. Performs extensive validation.

**Validation Rules**:
1. **Replicas/Parameterized volumes must be the only daughter**
   ```cpp
   if (p->IsReplicated()) {
       if (GetNoDaughters() > 0) {
           G4Exception(..., "Replica must be the only daughter");
       }
   }
   ```

2. **Cannot mix placement and external volumes**
   ```cpp
   if (first daughter is kExternal && new is kNormal) → Error
   if (first daughter is kNormal && new is kExternal) → Error
   ```

3. **Prevents self-placement** (checked in G4PVPlacement constructor)

**Side Effects**:
- Adds to `fDaughters` vector
- Invalidates mass cache (`fMass = 0.0`)
- Propagates field manager to daughter if daughter has no field manager
- Triggers region propagation if volume belongs to region

**Example**:
```cpp
// Creating daughter is automatic via G4PVPlacement
G4VPhysicalVolume* daughterPV = new G4PVPlacement(
    nullptr,                   // No rotation
    G4ThreeVector(0, 0, 0),   // Position
    daughterLV,                // Daughter logical volume
    "DaughterPV",             // Name
    motherLV,                  // Mother logical volume (AddDaughter called here!)
    false, 0
);
```

### GetNoDaughters()
**Signature**: `std::size_t GetNoDaughters() const`

Returns the number of daughter volumes.

**Performance**: O(1)

### GetDaughter()
**Signature**: `G4VPhysicalVolume* GetDaughter(const std::size_t i) const`

Returns the i-th daughter (0-indexed).

**Performance**: O(1) vector access

**Example**:
```cpp
for (std::size_t i = 0; i < motherLV->GetNoDaughters(); ++i) {
    G4VPhysicalVolume* daughter = motherLV->GetDaughter(i);
    G4cout << "Daughter " << i << ": " << daughter->GetName() << G4endl;
}
```

### IsDaughter()
**Signature**: `G4bool IsDaughter(const G4VPhysicalVolume* p) const`

Checks if physical volume is a direct daughter.

**Performance**: O(n) linear search via pointer comparison

### IsAncestor()
**Signature**: `G4bool IsAncestor(const G4VPhysicalVolume* p) const`

Recursively checks if physical volume is anywhere in the descendant tree.

**Performance**: O(n×d) where n = total descendants, d = depth

### RemoveDaughter()
**Signature**: `void RemoveDaughter(const G4VPhysicalVolume* p)`

Removes a daughter from the vector. Does NOT delete the physical volume.

**Side Effects**: Invalidates mass cache

### ClearDaughters()
**Signature**: `void ClearDaughters()`

Removes all daughters. Does NOT delete the physical volumes.

## Field Manager

### GetFieldManager()
**Signature**: `G4FieldManager* GetFieldManager() const`

Returns the thread-local field manager.

**Thread-Safe**: Yes

### SetFieldManager()
**Signature**: `void SetFieldManager(G4FieldManager* pFieldMgr, G4bool forceToAllDaughters)`
**Line**: `source/geometry/management/src/G4LogicalVolume.cc:473-501`

Sets field manager with optional propagation to daughters.

**Parameters**:
- `pFieldMgr` - New field manager (nullptr to unset)
- `forceToAllDaughters` - Propagation behavior:
  - `false`: Only propagate to daughters with nullptr field manager
  - `true`: Overwrite ALL daughter field managers recursively

**Algorithm** (when forceToAllDaughters = false):
```cpp
for each daughter:
    if (daughter->GetFieldManager() == nullptr) {
        daughter->SetFieldManager(pFieldMgr, false);  // Recursive
    }
```

**Example**:
```cpp
// Create field
G4UniformMagField* magField = new G4UniformMagField(G4ThreeVector(0, 0, 1*tesla));
G4FieldManager* fieldMgr = new G4FieldManager(magField);
fieldMgr->CreateChordFinder(magField);

// Set on volume and propagate to daughters without field managers
detectorLV->SetFieldManager(fieldMgr, false);
```

### AssignFieldManager()
**Signature**: `void AssignFieldManager(G4FieldManager* fldMgr)`

Sets field manager only at this level - NO propagation to daughters.

**Use Case**: When you want precise control over field hierarchy.

## Sensitive Detector

### GetSensitiveDetector()
**Signature**: `G4VSensitiveDetector* GetSensitiveDetector() const`

Returns the thread-local sensitive detector.

**Thread-Safe**: Yes

### SetSensitiveDetector()
**Signature**: `void SetSensitiveDetector(G4VSensitiveDetector* pSDetector)`

Associates a sensitive detector with this volume for hit collection.

**Important**: Unlike field managers, sensitive detectors are NOT automatically propagated to daughters.

**Example**:
```cpp
// Create and register sensitive detector
MyTrackerSD* trackerSD = new MyTrackerSD("TrackerSD");
G4SDManager::GetSDMpointer()->AddNewDetector(trackerSD);

// Assign to logical volume
trackerLV->SetSensitiveDetector(trackerSD);
```

## Region and Production Cuts

### GetRegion()
**Signature**: `G4Region* GetRegion() const`

Returns the region this volume belongs to.

**Returns**: Region pointer, or nullptr if not assigned

### SetRegion()
**Signature**: `void SetRegion(G4Region* reg)`

Assigns this volume to a cuts region.

**Side Effects**: Triggers region propagation if daughters exist

### IsRootRegion()
**Signature**: `G4bool IsRootRegion() const`

Checks if this volume is the root of a region.

**Returns**: Value of `fRootRegion` flag

### SetRegionRootFlag()
**Signature**: `void SetRegionRootFlag(G4bool rreg)`

Marks this volume as a region root.

**Example - Creating a Region**:
```cpp
// Create region
G4Region* caloRegion = new G4Region("CalorimeterRegion");

// Set production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(1*mm, "gamma");
cuts->SetProductionCut(1*mm, "e-");
cuts->SetProductionCut(1*mm, "e+");
caloRegion->SetProductionCuts(cuts);

// Assign to logical volume as root
caloLV->SetRegionRootFlag(true);
caloLV->SetRegion(caloRegion);
caloRegion->AddRootLogicalVolume(caloLV);

// Propagate to descendants
caloLV->PropagateRegion();
```

### GetMaterialCutsCouple()
**Signature**: `const G4MaterialCutsCouple* GetMaterialCutsCouple() const`

Returns the material-cuts couple for physics processes.

**Purpose**: Associates material with production cuts for particle generation thresholds

## Voxelization and Optimization

### GetVoxelHeader()
**Signature**: `G4SmartVoxelHeader* GetVoxelHeader() const`

Returns the voxelization structure for navigation optimization.

**Returns**: Pointer to voxel header, or nullptr if not voxelized

### SetVoxelHeader()
**Signature**: `void SetVoxelHeader(G4SmartVoxelHeader* pVoxel)`

Sets the voxelization structure (usually called by geometry optimizer).

### IsToOptimise()
**Signature**: `G4bool IsToOptimise() const`

Checks if voxelization optimization is enabled.

**Returns**: Value of `fOptimise` flag

**Note**: Parameterized volumes ALWAYS use optimization regardless of flag

### SetOptimisation()
**Signature**: `void SetOptimisation(G4bool optim)`

Enables/disables voxelization optimization.

**Example**:
```cpp
// Disable optimization for simple volumes
simpleLV->SetOptimisation(false);

// Enable with custom quality
complexLV->SetOptimisation(true);
complexLV->SetSmartless(3.0);  // Finer voxels
```

### GetSmartless() / SetSmartless()
**Signature**:
```cpp
G4double GetSmartless() const;
void SetSmartless(G4double s);
```

Controls voxelization quality parameter.

**Default**: 2.0
**Higher values**: Finer voxel grid, more memory, potentially faster navigation
**Lower values**: Coarser grid, less memory, potentially slower navigation

## Mass Calculation

### GetMass()
**Signature**:
```cpp
G4double GetMass(G4bool forced = false,
                 G4bool propagate = true,
                 G4Material* parMaterial = nullptr);
```
**Line**: `source/geometry/management/src/G4LogicalVolume.cc:571-659`

Computes the physical mass of this volume and optionally its daughters.

**Parameters**:
- `forced` - If true, recompute even if cached value exists
- `propagate` - If true, include daughter masses (recursive)
- `parMaterial` - Override material for parameterization

**Algorithm**:
1. Return cached value unless `forced=true`
2. Compute mother volume mass: `cubic_volume × density`
3. For each daughter:
   - Account for multiplicity (replicas/parameterization)
   - Subtract daughter volume at mother's density
   - If `propagate=true`, add daughter's actual mass (recursive)
4. Cache and return result

**Performance**: O(n) where n = total volumes in tree. Can be slow for complex geometries!

**Example**:
```cpp
// First call - computes mass
G4double mass1 = detectorLV->GetMass();  // May take time

// Subsequent calls - uses cache
G4double mass2 = detectorLV->GetMass();  // Fast!

// Force recomputation after geometry change
G4double mass3 = detectorLV->GetMass(true);  // Recomputes

// Get mass without daughters
G4double massOnly = detectorLV->GetMass(false, false);
```

### ResetMass()
**Signature**: `void ResetMass()`

Invalidates the mass cache, forcing recomputation on next GetMass() call.

**Called automatically by**: AddDaughter(), RemoveDaughter(), SetMaterial(), SetSolid()

## Thread Safety

### Multi-Threading Architecture

G4LogicalVolume uses the **G4GeomSplitter** pattern for thread safety:

**Shared Data** (read-only after construction):
- `fDaughters` - daughter volume vector
- `fName` - volume name
- `fUserLimits` - user limits
- `fVoxel` - voxelization structure
- `fRegion` - region assignment

**Per-Thread Data** (via G4LVData):
- `fSolid` - solid pointer
- `fMaterial` - material pointer
- `fFieldManager` - field manager
- `fSensitiveDetector` - sensitive detector
- `fMass` - mass cache
- `fCutsCouple` - material-cuts couple

**Access Macros**:
```cpp
#define G4MT_solid     ((subInstanceManager.offset[instanceID]).fSolid)
#define G4MT_material  ((subInstanceManager.offset[instanceID]).fMaterial)
#define G4MT_fmanager  ((subInstanceManager.offset[instanceID]).fFieldManager)
#define G4MT_sdetector ((subInstanceManager.offset[instanceID]).fSensitiveDetector)
#define G4MT_mass      ((subInstanceManager.offset[instanceID]).fMass)
```

### Worker Thread Methods

**InitialiseWorker()**
```cpp
void InitialiseWorker(G4LogicalVolume* pMasterObject,
                      G4VSolid* pSolid,
                      G4VSensitiveDetector* pSDetector);
```

Called by worker threads to copy master's data and set thread-local pointers.

**Actions**:
1. Copies G4LVData array from master: `subInstanceManager.SlaveCopySubInstanceArray()`
2. Sets thread-local solid
3. Sets thread-local sensitive detector
4. Assigns field manager from master

## User Limits

### GetUserLimits()
**Signature**: `G4UserLimits* GetUserLimits() const`

Returns user limits with fallback to region limits.

**Fallback Chain**:
1. If `fUserLimits != nullptr`, return it
2. Else if `fRegion != nullptr`, return `fRegion->GetUserLimits()`
3. Else return nullptr

**Example**:
```cpp
G4UserLimits* limits = new G4UserLimits();
limits->SetMaxAllowedStep(1*mm);
logicalVolume->SetUserLimits(limits);
```

## Visualization

### SetVisAttributes()
**Signature**:
```cpp
void SetVisAttributes(const G4VisAttributes* pVA);
void SetVisAttributes(const G4VisAttributes& VA);
```

Sets visualization attributes for rendering.

**Thread Safety**: Only master thread can set visualization attributes. Worker threads silently ignore calls.

**Example**:
```cpp
G4VisAttributes* visAttr = new G4VisAttributes(G4Colour(1.0, 0.0, 0.0));  // Red
visAttr->SetVisibility(true);
visAttr->SetForceSolid(true);
detectorLV->SetVisAttributes(visAttr);
```

## Usage Examples

### Example 1: Basic Volume Creation

```cpp
// Create solid
G4Box* box = new G4Box("DetectorBox", 50*cm, 50*cm, 100*cm);

// Get material
G4Material* silicon = G4NistManager::Instance()->FindOrBuildMaterial("G4_Si");

// Create logical volume
G4LogicalVolume* detectorLV = new G4LogicalVolume(
    box,                       // Solid
    silicon,                   // Material
    "DetectorLV"              // Name
);
```

### Example 2: Building Volume Hierarchy

```cpp
// Create world
G4Box* worldBox = new G4Box("World", 10*m, 10*m, 10*m);
G4LogicalVolume* worldLV = new G4LogicalVolume(worldBox, air, "World");

// Create detector
G4Box* detBox = new G4Box("Detector", 1*m, 1*m, 1*m);
G4LogicalVolume* detLV = new G4LogicalVolume(detBox, silicon, "Detector");

// Place detector in world (automatically calls worldLV->AddDaughter())
G4VPhysicalVolume* detPV = new G4PVPlacement(
    nullptr, G4ThreeVector(0, 0, 0),
    detLV, "Detector", worldLV, false, 0
);

// Query hierarchy
G4cout << "World has " << worldLV->GetNoDaughters() << " daughters" << G4endl;
```

### Example 3: Field Manager Setup

```cpp
// Create uniform magnetic field (1 Tesla in Z)
G4UniformMagField* magField = new G4UniformMagField(G4ThreeVector(0, 0, 1*tesla));

// Create field manager
G4FieldManager* fieldMgr = new G4FieldManager(magField);
fieldMgr->SetDetectorField(magField);
fieldMgr->CreateChordFinder(magField);

// Assign to volume
magnetLV->SetFieldManager(fieldMgr, true);  // Propagate to all daughters
```

### Example 4: Sensitive Detector

```cpp
// Define sensitive detector class
class MyTrackerSD : public G4VSensitiveDetector {
public:
    MyTrackerSD(const G4String& name) : G4VSensitiveDetector(name) {}
    G4bool ProcessHits(G4Step* step, G4TouchableHistory* history) override {
        // Process hit
        return true;
    }
};

// Create and register
MyTrackerSD* trackerSD = new MyTrackerSD("TrackerSD");
G4SDManager::GetSDMpointer()->AddNewDetector(trackerSD);

// Assign to logical volume
trackerLV->SetSensitiveDetector(trackerSD);
```

### Example 5: Region and Cuts

```cpp
// Create region
G4Region* detectorRegion = new G4Region("DetectorRegion");

// Set production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(500*um, "gamma");
cuts->SetProductionCut(500*um, "e-");
cuts->SetProductionCut(500*um, "e+");
cuts->SetProductionCut(500*um, "proton");
detectorRegion->SetProductionCuts(cuts);

// Assign to root logical volume
detectorLV->SetRegionRootFlag(true);
detectorLV->SetRegion(detectorRegion);
detectorRegion->AddRootLogicalVolume(detectorLV);

// Propagate to all descendants
detectorLV->PropagateRegion();
```

### Example 6: Mass Calculation

```cpp
// Create detector assembly
G4LogicalVolume* housingLV = /* ... */;
G4LogicalVolume* crystal1LV = /* ... placed in housing ... */;
G4LogicalVolume* crystal2LV = /* ... placed in housing ... */;

// Compute total mass including all daughters
G4double totalMass = housingLV->GetMass(true, true);
G4cout << "Total detector mass: " << totalMass/kg << " kg" << G4endl;

// Compute only housing mass
G4double housingMass = housingLV->GetMass(false, false);
G4cout << "Housing mass only: " << housingMass/kg << " kg" << G4endl;
```

## Performance Considerations

### Optimization Guidelines

**DO**:
- Enable voxelization for volumes with many daughters (automatic when `optimise=true`)
- Use cached mass values (don't call `GetMass(true)` repeatedly)
- Set field managers and regions after building complete hierarchy
- Use `SetOptimisation(false)` for volumes with few (&lt;3) daughters

**DON'T**:
- Modify geometry during tracking (not thread-safe!)
- Call `GetMass(true)` in performance-critical code
- Use deep hierarchies unnecessarily
- Mix placement and external volume types

### Memory Usage

**Per Logical Volume**:
- Base overhead: ~200 bytes
- Daughter vector: 8 bytes × number of daughters
- Per-thread data (G4LVData): ~64 bytes × number of threads
- Voxel structure: Varies based on complexity and smartless parameter

**Example**:
```cpp
// 1000 logical volumes in 10-thread simulation
// Base: 1000 × 200 = 200 KB
// Daughters: depends on geometry
// Thread data: 1000 × 64 × 10 = 640 KB
// Total: ~1 MB minimum
```

### Common Pitfalls

**Pitfall 1: Mixing Volume Types**
```cpp
// WRONG - cannot mix replica with placements
new G4PVReplica(..., motherLV, ...);       // First daughter is replica
new G4PVPlacement(..., daughterLV, motherLV, ...);  // ERROR! Second daughter must be replica
```

**Pitfall 2: Forgetting to Propagate Region**
```cpp
// WRONG - region not propagated
motherLV->SetRegion(region);
// Daughters don't inherit region!

// CORRECT
motherLV->SetRegion(region);
motherLV->PropagateRegion();  // Now daughters get region
```

**Pitfall 3: Modifying Geometry During Tracking**
```cpp
// WRONG - not thread-safe!
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    G4LogicalVolume* lv = step->GetPreStepPoint()->GetLogicalVolume();
    lv->SetMaterial(newMaterial);  // CRASH in multi-threaded mode!
}
```

## See Also

- [G4VSolid](g4vsolid.md) - Base class for geometric solids
- [G4PVPlacement](g4pvplacement.md) - Places logical volumes in space
- [G4VPhysicalVolume](g4vphysicalvolume.md) - Base class for physical volumes
- [G4Region](g4region.md) - Production cuts regions
- [G4Navigator](g4navigator.md) - Uses logical volumes for navigation
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/management/include/G4LogicalVolume.hh`
- Implementation: `source/geometry/management/src/G4LogicalVolume.cc`
- Inline: `source/geometry/management/include/G4LogicalVolume.icc`

### Related Classes
- `G4LogicalVolumeStore` - Global registry of all logical volumes
- `G4LVManager` (G4GeomSplitter&lt;G4LVData&gt;) - Per-thread data manager
- `G4SmartVoxelHeader` - Voxelization structure
- `G4FieldManager` - Electromagnetic field management
- `G4VSensitiveDetector` - Hit collection interface
