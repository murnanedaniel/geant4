# G4Region

**Location**: `source/geometry/management/include/G4Region.hh`
**Source**: `source/geometry/management/src/G4Region.cc`
**Inline**: `source/geometry/management/include/G4Region.icc`

## Overview

G4Region defines a region or group of regions in the detector geometry that share common properties related to materials, production cuts, and physics processes. Regions are fundamental to Geant4's physics management system, enabling fine-grained control over secondary particle production, electromagnetic field configuration, fast simulation, and tracking behavior in different parts of the geometry.

Each region can have its own production cuts (range cuts for secondary particles), field manager, fast simulation manager, user limits, and regional stepping actions. This allows optimization of both physics accuracy and computational performance by tailoring physics settings to the requirements of each detector component.

## Key Features

- **Production Cut Association**: Each region has associated range cuts for γ, e⁻, e⁺, and protons
- **Material Management**: Automatically tracks all materials used in the region
- **Root Volume Hierarchy**: Regions defined by root logical volumes and their daughters
- **Fast Simulation Support**: Optional fast simulation managers for rapid shower simulation
- **Field Manager Integration**: Region-specific electromagnetic field configuration
- **User Limits**: Per-region constraints on step length, track length, time, energy
- **Regional Stepping Actions**: Custom user actions executed only in specific regions
- **Thread-Safe Design**: Uses G4GeomSplitter for multi-threaded applications
- **World Association**: Regions track which world (mass or parallel) they belong to

## Class Definition

```cpp
class G4Region
{
  public:
    // Constructor and destructor
    G4Region(const G4String& name);
    virtual ~G4Region();

    // Region identification
    inline const G4String& GetName() const;
    void SetName(const G4String& name);

    // Production cuts
    inline void SetProductionCuts(G4ProductionCuts* cut);
    inline G4ProductionCuts* GetProductionCuts() const;

    // Region modification status
    inline void RegionModified(G4bool flag);
    inline G4bool IsModified() const;

    // Root logical volume management
    void AddRootLogicalVolume(G4LogicalVolume* lv, G4bool search = true);
    void RemoveRootLogicalVolume(G4LogicalVolume* lv, G4bool scan = true);
    inline std::vector<G4LogicalVolume*>::iterator GetRootLogicalVolumeIterator();
    inline std::size_t GetNumberOfRootVolumes() const;

    // Material management
    void UpdateMaterialList();
    void ClearMaterialList();
    void ScanVolumeTree(G4LogicalVolume* lv, G4bool region);
    inline std::vector<G4Material*>::const_iterator GetMaterialIterator() const;
    inline std::size_t GetNumberOfMaterials() const;

    // Material-cuts couple management
    inline void ClearMap();
    inline void RegisterMaterialCouplePair(G4Material* mat,
                                          G4MaterialCutsCouple* couple);
    inline G4MaterialCutsCouple* FindCouple(G4Material* mat);

    // Fast simulation
    void SetFastSimulationManager(G4FastSimulationManager* fsm);
    G4FastSimulationManager* GetFastSimulationManager() const;
    void ClearFastSimulationManager();

    // Field manager
    inline void SetFieldManager(G4FieldManager* fm);
    inline G4FieldManager* GetFieldManager() const;

    // User information and limits
    inline void SetUserInformation(G4VUserRegionInformation* ui);
    inline G4VUserRegionInformation* GetUserInformation() const;
    inline void SetUserLimits(G4UserLimits* ul);
    inline G4UserLimits* GetUserLimits() const;

    // World association
    inline G4VPhysicalVolume* GetWorldPhysical() const;
    void SetWorld(G4VPhysicalVolume* wp);
    G4bool BelongsTo(G4VPhysicalVolume* thePhys) const;
    G4Region* GetParentRegion(G4bool& unique) const;

    // Regional stepping action
    void SetRegionalSteppingAction(G4UserSteppingAction* rusa);
    G4UserSteppingAction* GetRegionalSteppingAction() const;

    // Geometry classification
    inline void UsedInMassGeometry(G4bool val = true);
    inline void UsedInParallelGeometry(G4bool val = true);
    inline G4bool IsInMassGeometry() const;
    inline G4bool IsInParallelGeometry() const;

    // Thread safety
    inline G4int GetInstanceID() const;
    static const G4RegionManager& GetSubInstanceManager();
    static void Clean();

  private:
    G4String fName;
    std::vector<G4LogicalVolume*> fRootVolumes;
    std::vector<G4Material*> fMaterials;
    std::map<G4Material*, G4MaterialCutsCouple*> fMaterialCoupleMap;

    G4bool fRegionMod = true;
    G4ProductionCuts* fCut = nullptr;

    G4VUserRegionInformation* fUserInfo = nullptr;
    G4UserLimits* fUserLimits = nullptr;
    G4FieldManager* fFieldManager = nullptr;

    G4VPhysicalVolume* fWorldPhys = nullptr;

    G4bool fInMassGeometry = false;
    G4bool fInParallelGeometry = false;

    G4int instanceID;  // For thread safety
};
```

## Constructor and Destructor

### Constructor

**Signature**: `G4Region(const G4String& name)`
**Line**: `source/geometry/management/src/G4Region.cc:65-86`

Creates a new region and registers it with G4RegionStore.

**Parameters**:
- `name` - Unique name for this region

**Actions**:
1. Creates sub-instance for thread safety
2. Initializes fast simulation and regional stepping action to nullptr
3. Checks for name uniqueness in G4RegionStore
4. Registers region with G4RegionStore

**Example**:
```cpp
// Create region for detector
G4Region* detectorRegion = new G4Region("DetectorRegion");

// Create region for shielding with different cuts
G4Region* shieldingRegion = new G4Region("ShieldingRegion");

// Regions automatically registered in G4RegionStore
```

**Warning**: Attempting to create region with existing name issues warning but proceeds.

### Destructor

**Signature**: `~G4Region()`
**Line**: `source/geometry/management/src/G4Region.cc:110-114`

Cleans up region and deregisters from store.

**Actions**:
1. Deregisters from G4RegionStore
2. Deletes user information (if set)
3. Note: Production cuts deleted by G4ProductionCutsTable

## Region Identification

### SetName() / GetName()

**SetName Line**: `source/geometry/management/src/G4Region.cc:120-124`

Changes region name and invalidates G4RegionStore map.

**Example**:
```cpp
G4Region* region = new G4Region("TempName");
region->SetName("FinalName");  // Rename region
```

**Note**: Invalidates region store map (triggers rebuild on next access)

## Production Cuts

Production cuts define the minimum range (not energy!) for secondary particle production. Below these thresholds, energy is deposited locally rather than creating secondary particles.

### SetProductionCuts() / GetProductionCuts()

**Inline**: `source/geometry/management/include/G4Region.icc`

Associates production cuts with this region.

**Example**:
```cpp
G4Region* region = new G4Region("CalorimeterRegion");

// Create production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(1.0*mm);  // Set all cuts to 1 mm range

// Assign to region
region->SetProductionCuts(cuts);

// Get cuts later
G4ProductionCuts* retrievedCuts = region->GetProductionCuts();
```

**Important**: Production cuts are **range cuts** (in distance), not energy cuts. They are converted to energy thresholds for each material in the region.

## Root Logical Volume Management

Regions are defined by designating certain logical volumes as "root volumes." All daughters of root volumes automatically belong to the region (unless they are root volumes of other regions).

### AddRootLogicalVolume()

**Signature**: `void AddRootLogicalVolume(G4LogicalVolume* lv, G4bool search = true)`
**Line**: `source/geometry/management/src/G4Region.cc:292-333`

Adds a logical volume as root of this region.

**Parameters**:
- `lv` - Logical volume to add as root
- `search` - If true, checks if volume already in list (default: true)

**Algorithm**:
```cpp
void G4Region::AddRootLogicalVolume(G4LogicalVolume* lv, G4bool search) {
    // Check if already root of another region
    if (lv->IsRootRegion() && lv->GetRegion() != this) {
        G4Exception(..., FatalException,
                   "Logical volume cannot belong to more than one region!");
        return;
    }

    // Add to list (with optional duplicate check)
    if (search) {
        if (std::find(fRootVolumes.begin(), fRootVolumes.end(), lv) == fRootVolumes.end()) {
            fRootVolumes.push_back(lv);
            lv->SetRegionRootFlag(true);
        }
    } else {
        // Fast path: user guarantees no duplicate
        fRootVolumes.push_back(lv);
        lv->SetRegionRootFlag(true);
    }

    // Recursively scan volume tree and assign region
    ScanVolumeTree(lv, true);

    fRegionMod = true;  // Mark region as modified
}
```

**Optimization**: Setting `search=false` skips duplicate check for faster construction in complex geometries.

**Example**:
```cpp
G4Region* region = new G4Region("MyRegion");

// Add logical volume as root
G4LogicalVolume* detectorLV = new G4LogicalVolume(detectorSolid, material, "Detector");
region->AddRootLogicalVolume(detectorLV);

// All daughters of detectorLV now belong to region
```

### RemoveRootLogicalVolume()

**Signature**: `void RemoveRootLogicalVolume(G4LogicalVolume* lv, G4bool scan = true)`
**Line**: `source/geometry/management/src/G4Region.cc:341-363`

Removes logical volume from region's root volume list.

**Parameters**:
- `lv` - Logical volume to remove
- `scan` - If true, updates material list (default: true)

**Example**:
```cpp
region->RemoveRootLogicalVolume(oldRootLV);
// oldRootLV and its daughters no longer in region
```

## Material Management

Regions automatically track which materials are used within them. This is essential for production cut table construction.

### ScanVolumeTree()

**Signature**: `void ScanVolumeTree(G4LogicalVolume* lv, G4bool region)`
**Line**: `source/geometry/management/src/G4Region.cc:171-284`

Recursively scans volume tree to collect materials and assign region.

**Parameters**:
- `lv` - Logical volume to scan
- `region` - If true, assign this region; if false, clear region assignment

**Algorithm**:
```cpp
void G4Region::ScanVolumeTree(G4LogicalVolume* lv, G4bool region) {
    G4Material* volMat = lv->GetMaterial();

    if (region) {
        // Add material to region's list
        if (volMat != nullptr) {
            AddMaterial(volMat);
            // Also add base material if it exists
            auto baseMat = const_cast<G4Material*>(volMat->GetBaseMaterial());
            if (baseMat != nullptr) { AddMaterial(baseMat); }
        }

        // Assign region to this volume
        lv->SetRegion(this);
    } else {
        // Clear region assignment
        lv->SetRegion(nullptr);
    }

    // Handle daughters
    if (lv->GetNoDaughters() == 0) { return; }

    // Special handling for parameterised volumes
    G4VPhysicalVolume* daughterPVol = lv->GetDaughter(0);
    if (daughterPVol->IsParameterised()) {
        // Scan all parameterised materials
        G4VPVParameterisation* pParam = daughterPVol->GetParameterisation();
        // ... iterate through all replicas, add their materials ...
    } else {
        // Recursively scan normal daughters
        for (std::size_t i = 0; i < lv->GetNoDaughters(); ++i) {
            G4LogicalVolume* daughterLV = lv->GetDaughter(i)->GetLogicalVolume();
            if (!daughterLV->IsRootRegion()) {
                ScanVolumeTree(daughterLV, region);
            }
        }
    }
}
```

**Recursion**: Stops at volumes that are roots of other regions.

### UpdateMaterialList() / ClearMaterialList()

**UpdateMaterialList Line**: `source/geometry/management/src/G4Region.cc:390-403`

**Example**:
```cpp
// After modifying geometry
region->UpdateMaterialList();

// Or clear materials
region->ClearMaterialList();
```

## Material-Cuts Couple Management

The region maintains a map between materials and material-cuts couples (material + production cuts combination).

### RegisterMaterialCouplePair() / FindCouple()

**Inline**: `source/geometry/management/include/G4Region.icc`

**Example**:
```cpp
// During initialization, G4ProductionCutsTable registers couples
region->RegisterMaterialCouplePair(material, couple);

// Later, retrieve couple for material
G4MaterialCutsCouple* couple = region->FindCouple(material);
```

## Fast Simulation

Fast simulation allows bypassing detailed tracking in certain regions for performance.

### SetFastSimulationManager() / GetFastSimulationManager()

**SetFastSimulationManager Line**: `source/geometry/management/src/G4Region.cc:130-133`
**GetFastSimulationManager Line**: `source/geometry/management/src/G4Region.cc:139-142`

**Example**:
```cpp
// Create fast simulation manager
G4FastSimulationManager* fastSimManager = new G4FastSimulationManager(...);

// Assign to region
G4Region* calorimeterRegion = new G4Region("Calorimeter");
calorimeterRegion->SetFastSimulationManager(fastSimManager);

// Root logical volume becomes envelope for fast simulation
```

**Use Case**: Electromagnetic shower parameterization in calorimeters.

### ClearFastSimulationManager()

**Line**: `source/geometry/management/src/G4Region.cc:451-478`

Clears fast simulation manager, optionally inheriting from parent region.

## Field Manager

Regions can have their own electromagnetic field configuration.

### SetFieldManager() / GetFieldManager()

**Inline**: `source/geometry/management/include/G4Region.icc`

**Example**:
```cpp
// Create field manager with uniform field
G4UniformMagField* magField = new G4UniformMagField(G4ThreeVector(0, 0, 1*tesla));
G4FieldManager* fieldManager = new G4FieldManager(magField);

// Assign to region
G4Region* magnetRegion = new G4Region("MagnetRegion");
magnetRegion->SetFieldManager(fieldManager);
```

**Priority**: Region field manager takes precedence over volume-level field managers.

## User Limits

User limits constrain tracking behavior in the region.

### SetUserLimits() / GetUserLimits()

**Inline**: `source/geometry/management/include/G4Region.icc`

**Example**:
```cpp
// Create user limits
G4UserLimits* limits = new G4UserLimits();
limits->SetMaxAllowedStep(1*mm);     // Maximum step length
limits->SetUserMaxTrackLength(10*m); // Maximum track length
limits->SetUserMaxTime(1*ns);        // Maximum time
limits->SetUserMinEkine(1*keV);      // Minimum kinetic energy

// Assign to region
region->SetUserLimits(limits);
```

**Propagation**: Limits propagate to all logical volumes in region.

## World Association

Regions track which world (geometry) they belong to.

### SetWorld() / GetWorldPhysical()

**SetWorld Line**: `source/geometry/management/src/G4Region.cc:411-423`

**Example**:
```cpp
// Typically set by G4RunManagerKernel during geometry closure
region->SetWorld(worldPhysicalVolume);

// Check which world region belongs to
G4VPhysicalVolume* world = region->GetWorldPhysical();
```

### BelongsTo()

**Signature**: `G4bool BelongsTo(G4VPhysicalVolume* thePhys) const`
**Line**: `source/geometry/management/src/G4Region.cc:431-443`

Recursively checks if region belongs to given physical volume hierarchy.

**Example**:
```cpp
if (region->BelongsTo(worldPV)) {
    G4cout << "Region is part of this world" << G4endl;
}
```

### GetParentRegion()

**Signature**: `G4Region* GetParentRegion(G4bool& unique) const`
**Line**: `source/geometry/management/src/G4Region.cc:486-517`

Finds parent region (region containing this region's volumes).

**Parameters**:
- `unique` [out] - Set to true if only one parent exists

**Returns**: Parent region, or nullptr if no parent

**Example**:
```cpp
G4bool hasUniqueParent;
G4Region* parent = region->GetParentRegion(hasUniqueParent);

if (parent != nullptr && hasUniqueParent) {
    G4cout << "Parent region: " << parent->GetName() << G4endl;
}
```

## Regional Stepping Action

Allows executing custom user actions only in specific regions.

### SetRegionalSteppingAction() / GetRegionalSteppingAction()

**SetRegionalSteppingAction Line**: `source/geometry/management/src/G4Region.cc:148-151`

**Example**:
```cpp
// Create custom stepping action
class MySteppingAction : public G4UserSteppingAction {
  public:
    void UserSteppingAction(const G4Step* step) override {
        // Custom logic for this region only
        G4cout << "Step in special region" << G4endl;
    }
};

// Assign to region
MySteppingAction* regionalAction = new MySteppingAction();
region->SetRegionalSteppingAction(regionalAction);
```

**Performance**: More efficient than checking region in global stepping action.

## Geometry Classification

Regions can be part of mass geometry (tracking), parallel geometry (scoring), or both.

### UsedInMassGeometry() / UsedInParallelGeometry()

**Inline**: `source/geometry/management/include/G4Region.icc`

**Example**:
```cpp
// Mark region as part of mass geometry
region->UsedInMassGeometry(true);

// Mark region as part of parallel geometry
region->UsedInParallelGeometry(true);

// Check classification
if (region->IsInMassGeometry()) {
    G4cout << "Used for tracking" << G4endl;
}
if (region->IsInParallelGeometry()) {
    G4cout << "Used for scoring" << G4endl;
}
```

## Thread Safety

G4Region uses G4GeomSplitter for thread-safe operation in multi-threaded mode.

### GetInstanceID() / GetSubInstanceManager()

**Example**:
```cpp
// Get thread-local instance ID
G4int id = region->GetInstanceID();

// Access sub-instance manager (for advanced use)
const G4RegionManager& manager = G4Region::GetSubInstanceManager();
```

### Clean()

**Line**: `source/geometry/management/src/G4Region.cc:369-372`

Cleans up thread-local storage.

**Example**:
```cpp
// Called during program cleanup
G4Region::Clean();
```

## Usage Examples

### Example 1: Basic Region with Production Cuts

```cpp
// Create region for silicon detector
G4Region* siliconRegion = new G4Region("SiliconRegion");

// Create and configure production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(0.1*mm, "gamma");
cuts->SetProductionCut(0.1*mm, "e-");
cuts->SetProductionCut(0.1*mm, "e+");
cuts->SetProductionCut(0.1*mm, "proton");
siliconRegion->SetProductionCuts(cuts);

// Assign to logical volume
G4LogicalVolume* siliconLV = new G4LogicalVolume(siliconSolid,
                                                 siliconMaterial,
                                                 "SiliconLV");
siliconRegion->AddRootLogicalVolume(siliconLV);
```

### Example 2: Multiple Regions with Different Cuts

```cpp
// Default region (world)
G4Region* defaultRegion = new G4Region("DefaultRegion");
G4ProductionCuts* defaultCuts = new G4ProductionCuts();
defaultCuts->SetProductionCut(1.0*mm);
defaultRegion->SetProductionCuts(defaultCuts);
defaultRegion->AddRootLogicalVolume(worldLV);

// Detector region (fine cuts)
G4Region* detectorRegion = new G4Region("DetectorRegion");
G4ProductionCuts* detectorCuts = new G4ProductionCuts();
detectorCuts->SetProductionCut(0.01*mm);  // 10 micron range
detectorRegion->SetProductionCuts(detectorCuts);
detectorRegion->AddRootLogicalVolume(detectorLV);

// Shielding region (coarse cuts)
G4Region* shieldingRegion = new G4Region("ShieldingRegion");
G4ProductionCuts* shieldingCuts = new G4ProductionCuts();
shieldingCuts->SetProductionCut(10*mm);  // 1 cm range
shieldingRegion->SetProductionCuts(shieldingCuts);
shieldingRegion->AddRootLogicalVolume(shieldingLV);
```

### Example 3: Region with Field Manager

```cpp
// Create region for tracking detector in magnetic field
G4Region* magnetRegion = new G4Region("MagnetRegion");

// Configure production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(0.5*mm);
magnetRegion->SetProductionCuts(cuts);

// Create and assign field manager
G4UniformMagField* magField = new G4UniformMagField(G4ThreeVector(0, 0, 3*tesla));
G4FieldManager* fieldMgr = new G4FieldManager(magField);
fieldMgr->CreateChordFinder(magField);
magnetRegion->SetFieldManager(fieldMgr);

// Assign to logical volume
magnetRegion->AddRootLogicalVolume(trackerLV);
```

### Example 4: Region with User Limits

```cpp
// Create region with strict step limits
G4Region* precisionRegion = new G4Region("PrecisionRegion");

// Set production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(0.05*mm);
precisionRegion->SetProductionCuts(cuts);

// Create and set user limits
G4UserLimits* limits = new G4UserLimits();
limits->SetMaxAllowedStep(0.1*mm);        // Small steps for precision
limits->SetUserMaxTime(10*ns);            // Time limit
limits->SetUserMinEkine(100*eV);          // Kill low-energy particles
precisionRegion->SetUserLimits(limits);

precisionRegion->AddRootLogicalVolume(preciseLV);
```

### Example 5: Region with Fast Simulation

```cpp
// Create region for electromagnetic calorimeter
G4Region* calorimeterRegion = new G4Region("CalorimeterRegion");

// Production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(0.5*mm);
calorimeterRegion->SetProductionCuts(cuts);

// Create fast simulation manager
G4FastSimulationManager* fastSimManager =
    new G4FastSimulationManager(calorimeterLV);

// Create and register shower parameterization model
MyEMShowerModel* showerModel = new MyEMShowerModel("ShowerModel");
fastSimManager->AddFastSimulationModel(showerModel);

// Assign fast simulation to region
calorimeterRegion->SetFastSimulationManager(fastSimManager);
calorimeterRegion->AddRootLogicalVolume(calorimeterLV);
```

### Example 6: Regional Stepping Action

```cpp
// Custom stepping action for specific region
class DetectorSteppingAction : public G4UserSteppingAction {
  public:
    void UserSteppingAction(const G4Step* step) override {
        // Count steps in detector
        ++fStepCount;

        // Special processing for detector region
        G4double edep = step->GetTotalEnergyDeposit();
        if (edep > 0) {
            fTotalEdep += edep;
        }
    }

  private:
    G4int fStepCount = 0;
    G4double fTotalEdep = 0;
};

// Create region with regional stepping action
G4Region* detectorRegion = new G4Region("DetectorRegion");
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(0.1*mm);
detectorRegion->SetProductionCuts(cuts);

DetectorSteppingAction* regionalAction = new DetectorSteppingAction();
detectorRegion->SetRegionalSteppingAction(regionalAction);

detectorRegion->AddRootLogicalVolume(detectorLV);
```

## Best Practices

### 1. Organize Regions by Physics Requirements

```cpp
// Good: Separate regions for different physics needs
G4Region* activeDetector = new G4Region("ActiveDetector");  // Fine cuts, detailed tracking
G4Region* passiveShielding = new G4Region("Shielding");     // Coarse cuts, fast tracking
G4Region* vacuum = new G4Region("Vacuum");                   // Minimal cuts, special limits
```

### 2. Set Production Cuts Appropriately

```cpp
// Consider detector resolution and computational cost
G4ProductionCuts* cuts = new G4ProductionCuts();

// For silicon detector (typical pixel size ~100 μm)
cuts->SetProductionCut(0.01*mm);  // 10 μm range (well below pixel size)

// For scintillator (typical light collection ~mm scale)
cuts->SetProductionCut(0.1*mm);   // 100 μm range

// For bulk shielding
cuts->SetProductionCut(10*mm);    // 1 cm range (fast simulation)
```

### 3. Update Material List After Geometry Changes

```cpp
// After modifying geometry
region->RemoveRootLogicalVolume(oldLV);
region->AddRootLogicalVolume(newLV);

// Update materials
region->UpdateMaterialList();
```

### 4. Use Regional Actions for Performance

```cpp
// Instead of checking region in global stepping action:
// BAD:
void UserSteppingAction(const G4Step* step) {
    if (step->GetPreStepPoint()->GetTouchable()->GetVolume()
            ->GetLogicalVolume()->GetRegion()->GetName() == "SpecialRegion") {
        // Do special processing
    }
}

// GOOD: Use regional stepping action
G4Region* specialRegion = new G4Region("SpecialRegion");
specialRegion->SetRegionalSteppingAction(new MySpecialAction());
```

### 5. Consider Material Scanning Performance

```cpp
// For very complex geometries with many volumes:

// SLOW: Search for duplicates every time
for (int i = 0; i < 10000; ++i) {
    region->AddRootLogicalVolume(volumes[i], true);  // search=true
}

// FAST: Skip duplicate check if you guarantee uniqueness
for (int i = 0; i < 10000; ++i) {
    region->AddRootLogicalVolume(volumes[i], false);  // search=false
}
```

## See Also

- [G4ProductionCuts](g4productioncuts.md) - Range cuts for secondary production
- [G4LogicalVolume](g4logicalvolume.md) - Logical volume with material and region
- [G4FieldManager](g4fieldmanager.md) - Electromagnetic field configuration
- [G4UserLimits](g4userlimits.md) - User-defined tracking constraints
- [G4FastSimulationManager](g4fastsimulationmanager.md) - Fast simulation control
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/management/include/G4Region.hh`
- Implementation: `source/geometry/management/src/G4Region.cc`
- Inline: `source/geometry/management/include/G4Region.icc`

### Related Classes
- `G4RegionStore` - Global registry of all regions
- `G4ProductionCutsTable` - Manages material-cuts couples
- `G4MaterialCutsCouple` - Pair of material and production cuts
- `G4GeomSplitter` - Thread-safe data management

### Key Concepts
- **Production Cuts**: Range cuts (in distance) converted to energy thresholds
- **Root Volumes**: Logical volumes that define region boundaries
- **Material Scanning**: Recursive collection of materials in region
- **Region Hierarchy**: Regions can be nested (daughters stop at other region roots)

### External Documentation
- [Geant4 User Guide: Production Cuts](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/TrackingAndPhysics/thresholdVScut.html)
- [Geant4 User Guide: Regions](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomRegion.html)
