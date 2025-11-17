# G4VUserDetectorConstruction API Documentation

## Overview

`G4VUserDetectorConstruction` is the abstract base class for mandatory user initialization of detector geometry. It defines the pure virtual method `Construct()` which must return the world volume, and provides optional methods for constructing sensitive detectors and electromagnetic fields in multi-threaded applications. This class is one of three mandatory initialization classes required by G4RunManager.

::: tip Header File
**Location:** `source/run/include/G4VUserDetectorConstruction.hh`
**Source:** `source/run/src/G4VUserDetectorConstruction.cc`
:::

## Class Declaration

```cpp
class G4VUserDetectorConstruction
{
  public:
    G4VUserDetectorConstruction() = default;
    virtual ~G4VUserDetectorConstruction() = default;

    // Pure virtual - must be implemented
    virtual G4VPhysicalVolume* Construct() = 0;

    // Virtual - override for MT mode
    virtual void ConstructSDandField();

    // Advanced MT methods
    virtual void CloneSD();
    virtual void CloneF();

    // Parallel geometry
    void RegisterParallelWorld(G4VUserParallelWorld*);
    G4int ConstructParallelGeometries();
    void ConstructParallelSD();
    G4int GetNumberOfParallelWorld() const;
    G4VUserParallelWorld* GetParallelWorld(G4int i) const;

  protected:
    void SetSensitiveDetector(const G4String& logVolName,
                              G4VSensitiveDetector* aSD,
                              G4bool multi = false);
    void SetSensitiveDetector(G4LogicalVolume* logVol,
                              G4VSensitiveDetector* aSD);
};
```

## Key Characteristics

- **Abstract Base Class**: Construct() is pure virtual - must be subclassed
- **Mandatory**: Required for all Geant4 applications
- **World Volume**: Construct() must return the top-level physical volume
- **Thread-Safe**: Separate geometry construction for each thread in MT mode
- **SD/Field Separation**: ConstructSDandField() separates thread-local objects

## Important Notes

::: warning Critical Requirements
- Construct() **must** return a valid G4VPhysicalVolume pointer (world volume)
- World volume must contain all detector geometry
- Construct() is called by G4RunManager::Initialize()
- In MT mode, Construct() called once; ConstructSDandField() called per thread
:::

::: tip Multi-Threading
In multi-threaded applications:
- Geometry (volumes, materials) is shared across threads (constructed once)
- Sensitive detectors and fields are thread-local (constructed per thread)
- Use ConstructSDandField() to create thread-local SD and field objects
:::

## Virtual Methods

### Construct() - Pure Virtual
`source/run/include/G4VUserDetectorConstruction.hh:56`

```cpp
virtual G4VPhysicalVolume* Construct() = 0;
```

**Purpose:** Build complete detector geometry and return world volume

**Returns:** Pointer to world physical volume (top of geometry hierarchy)

**When Called:**
- G4RunManager::Initialize()
- Sequential mode: Once
- MT mode: Once on master thread (geometry shared)

**Must Implement:**
- Material definitions
- Solid definitions
- Logical volume creation
- Physical volume placement
- World volume as top-level container

**Example:**
```cpp
G4VPhysicalVolume* MyDetectorConstruction::Construct()
{
    // Get materials
    auto nist = G4NistManager::Instance();
    G4Material* air = nist->FindOrBuildMaterial("G4_AIR");
    G4Material* water = nist->FindOrBuildMaterial("G4_WATER");

    // World volume
    G4Box* solidWorld = new G4Box("World",
        1.0*m, 1.0*m, 1.0*m);

    G4LogicalVolume* logicWorld = new G4LogicalVolume(
        solidWorld, air, "World");

    G4VPhysicalVolume* physWorld = new G4PVPlacement(
        nullptr,                // no rotation
        G4ThreeVector(),       // at origin
        logicWorld,            // logical volume
        "World",               // name
        nullptr,               // no mother volume
        false,                 // no boolean operation
        0,                     // copy number
        true);                 // check overlaps

    // Detector volume (example: water phantom)
    G4Box* solidDetector = new G4Box("Detector",
        10*cm, 10*cm, 10*cm);

    G4LogicalVolume* logicDetector = new G4LogicalVolume(
        solidDetector, water, "Detector");

    new G4PVPlacement(
        nullptr,
        G4ThreeVector(0, 0, 0),
        logicDetector,
        "Detector",
        logicWorld,            // mother volume
        false,
        0,
        true);

    // Return world volume
    return physWorld;
}
```

**Common Patterns:**
```cpp
// Pattern 1: Simple detector
G4VPhysicalVolume* Construct() {
    DefineM aterials();
    return DefineVolumes();
}

// Pattern 2: Modular construction
G4VPhysicalVolume* Construct() {
    DefineMaterials();
    ConstructWorld();
    ConstructTarget();
    ConstructDetector();
    ConstructShielding();
    return fWorldPhysical;
}

// Pattern 3: With messenger for interactive geometry
G4VPhysicalVolume* Construct() {
    fMessenger = new MyDetectorMessenger(this);
    DefineMaterials();
    return ConstructDetector();
}
```

### ConstructSDandField()
`source/run/include/G4VUserDetectorConstruction.hh:60`

```cpp
virtual void ConstructSDandField();
```

**Purpose:** Construct thread-local sensitive detectors and electromagnetic fields

**When Called:**
- Sequential mode: Called once after Construct()
- MT mode: Called once per worker thread

**Thread Context:**
- Creates thread-local (non-shared) objects
- Sensitive detectors are thread-local
- Electromagnetic fields are thread-local
- Called in each worker thread context

**Example:**
```cpp
void MyDetectorConstruction::ConstructSDandField()
{
    // Create sensitive detector
    auto caloSD = new MyCalorimeterSD("CalorimeterSD", "CalorimeterHitsCollection");

    // Register with SD manager
    G4SDManager::GetSDMpointer()->AddNewDetector(caloSD);

    // Attach to logical volume
    SetSensitiveDetector("CalorimeterLV", caloSD);

    // Create electromagnetic field
    auto magneticField = new G4UniformMagField(
        G4ThreeVector(0., 0., 1.0*tesla));

    auto fieldManager = new G4FieldManager();
    fieldManager->SetDetectorField(magneticField);
    fieldManager->CreateChordFinder(magneticField);

    // Attach to logical volume
    G4LogicalVolume* logicDetector =
        G4LogicalVolumeStore::GetInstance()->GetVolume("DetectorLV");
    if (logicDetector) {
        logicDetector->SetFieldManager(fieldManager, true);
    }
}
```

**Best Practices:**
```cpp
void MyDetectorConstruction::ConstructSDandField()
{
    // 1. Check if already constructed (avoid double construction)
    if (fCalorimeterSD.Get()) return;

    // 2. Create thread-local SD
    auto caloSD = new MyCalorimeterSD(
        "CalorimeterSD", "CalorimeterHitsCollection");

    // 3. Store in thread-local storage
    fCalorimeterSD.Put(caloSD);

    // 4. Register with SDManager
    G4SDManager::GetSDMpointer()->AddNewDetector(caloSD);

    // 5. Attach to logical volume
    SetSensitiveDetector("CalorimeterLV", caloSD);

    // 6. Create field if needed
    if (fMagneticFieldValue > 0) {
        ConstructField();
    }
}
```

### CloneSD()
`source/run/include/G4VUserDetectorConstruction.hh:62`

```cpp
virtual void CloneSD();
```

**Purpose:** Advanced method for cloning sensitive detectors in MT mode

**When Called:** Automatically by framework if ConstructSDandField() not overridden

**Default Behavior:** Clones SDs from master thread

::: tip Usage
Typically you **don't** override this. Use ConstructSDandField() instead.
Only override if you need custom SD cloning logic.
:::

### CloneF()
`source/run/include/G4VUserDetectorConstruction.hh:63`

```cpp
virtual void CloneF();
```

**Purpose:** Advanced method for cloning fields in MT mode

**When Called:** Automatically by framework if ConstructSDandField() not overridden

**Default Behavior:** Clones fields from master thread

::: tip Usage
Typically you **don't** override this. Use ConstructSDandField() instead.
Only override if you need custom field cloning logic.
:::

## Protected Helper Methods

### SetSensitiveDetector() - By Name
`source/run/include/G4VUserDetectorConstruction.hh:74-75`

```cpp
void SetSensitiveDetector(const G4String& logVolName,
                          G4VSensitiveDetector* aSD,
                          G4bool multi = false);
```

**Purpose:** Attach sensitive detector to logical volume(s) by name

**Parameters:**
- `logVolName`: Name of logical volume
- `aSD`: Pointer to sensitive detector
- `multi`: If true, attach to all volumes with matching name

**Example:**
```cpp
void MyDetectorConstruction::ConstructSDandField()
{
    auto trackerSD = new MyTrackerSD("TrackerSD", "TrackerHitsCollection");
    G4SDManager::GetSDMpointer()->AddNewDetector(trackerSD);

    // Attach to single volume
    SetSensitiveDetector("TrackerLV", trackerSD);

    // Attach to all volumes with name (multi = true)
    SetSensitiveDetector("SiliconLayerLV", trackerSD, true);
}
```

### SetSensitiveDetector() - By Pointer
`source/run/include/G4VUserDetectorConstruction.hh:76`

```cpp
void SetSensitiveDetector(G4LogicalVolume* logVol,
                          G4VSensitiveDetector* aSD);
```

**Purpose:** Attach sensitive detector directly to logical volume pointer

**Parameters:**
- `logVol`: Pointer to logical volume
- `aSD`: Pointer to sensitive detector

**Example:**
```cpp
void MyDetectorConstruction::ConstructSDandField()
{
    auto caloSD = new MyCalorimeterSD("CaloSD", "CaloHitsCollection");
    G4SDManager::GetSDMpointer()->AddNewDetector(caloSD);

    // Get logical volume pointer
    G4LogicalVolume* caloLV =
        G4LogicalVolumeStore::GetInstance()->GetVolume("CalorimeterLV");

    // Attach SD directly
    if (caloLV) {
        SetSensitiveDetector(caloLV, caloSD);
    }
}
```

## Parallel Geometry Methods

### RegisterParallelWorld()
`source/run/include/G4VUserDetectorConstruction.hh:65`

```cpp
void RegisterParallelWorld(G4VUserParallelWorld* aPW);
```

**Purpose:** Register parallel world geometry

**Parameters:**
- `aPW`: Pointer to parallel world construction

**Example:**
```cpp
MyDetectorConstruction::MyDetectorConstruction()
{
    // Register parallel world for scoring
    RegisterParallelWorld(new MyScoringWorld("ParallelWorld"));
}
```

### GetNumberOfParallelWorld()
`source/run/include/G4VUserDetectorConstruction.hh:70`

```cpp
G4int GetNumberOfParallelWorld() const;
```

**Returns:** Number of registered parallel worlds

### GetParallelWorld()
`source/run/include/G4VUserDetectorConstruction.hh:71`

```cpp
G4VUserParallelWorld* GetParallelWorld(G4int i) const;
```

**Parameters:**
- `i`: Index of parallel world (0-based)

**Returns:** Pointer to i-th parallel world

## Complete Usage Examples

### Basic Detector Construction

```cpp
// MyDetectorConstruction.hh
#ifndef MyDetectorConstruction_h
#define MyDetectorConstruction_h 1

#include "G4VUserDetectorConstruction.hh"
#include "globals.hh"

class G4VPhysicalVolume;
class G4LogicalVolume;

class MyDetectorConstruction : public G4VUserDetectorConstruction
{
public:
    MyDetectorConstruction() = default;
    virtual ~MyDetectorConstruction() = default;

    virtual G4VPhysicalVolume* Construct() override;
    virtual void ConstructSDandField() override;

private:
    void DefineMaterials();
    G4VPhysicalVolume* DefineVolumes();

    G4LogicalVolume* fScoringVolume = nullptr;
};

#endif

// MyDetectorConstruction.cc
#include "MyDetectorConstruction.hh"

#include "G4RunManager.hh"
#include "G4NistManager.hh"
#include "G4Box.hh"
#include "G4LogicalVolume.hh"
#include "G4PVPlacement.hh"
#include "G4SystemOfUnits.hh"

G4VPhysicalVolume* MyDetectorConstruction::Construct()
{
    DefineMaterials();
    return DefineVolumes();
}

void MyDetectorConstruction::DefineMaterials()
{
    // Materials are automatically managed by G4NistManager
    auto nist = G4NistManager::Instance();
    nist->FindOrBuildMaterial("G4_AIR");
    nist->FindOrBuildMaterial("G4_WATER");
}

G4VPhysicalVolume* MyDetectorConstruction::DefineVolumes()
{
    auto nist = G4NistManager::Instance();
    G4Material* air = nist->FindOrBuildMaterial("G4_AIR");
    G4Material* water = nist->FindOrBuildMaterial("G4_WATER");

    // World
    G4Box* solidWorld = new G4Box("World", 1*m, 1*m, 1*m);
    G4LogicalVolume* logicWorld =
        new G4LogicalVolume(solidWorld, air, "World");
    G4VPhysicalVolume* physWorld =
        new G4PVPlacement(nullptr, G4ThreeVector(), logicWorld,
                          "World", nullptr, false, 0, true);

    // Detector
    G4Box* solidDetector = new G4Box("Detector", 10*cm, 10*cm, 10*cm);
    G4LogicalVolume* logicDetector =
        new G4LogicalVolume(solidDetector, water, "Detector");
    new G4PVPlacement(nullptr, G4ThreeVector(), logicDetector,
                      "Detector", logicWorld, false, 0, true);

    fScoringVolume = logicDetector;

    return physWorld;
}

void MyDetectorConstruction::ConstructSDandField()
{
    // Will be implemented if needed
}
```

### With Sensitive Detector

```cpp
#include "G4SDManager.hh"
#include "MySensitiveDetector.hh"

void MyDetectorConstruction::ConstructSDandField()
{
    // Create sensitive detector
    auto detectorSD = new MySensitiveDetector(
        "DetectorSD", "DetectorHitsCollection");

    // Register with SD manager
    G4SDManager* sdManager = G4SDManager::GetSDMpointer();
    sdManager->AddNewDetector(detectorSD);

    // Attach to logical volume
    SetSensitiveDetector("Detector", detectorSD);
}
```

### With Electromagnetic Field

```cpp
#include "G4UniformMagField.hh"
#include "G4FieldManager.hh"
#include "G4TransportationManager.hh"
#include "G4MagIntegratorStepper.hh"
#include "G4Mag_UsualEqRhs.hh"
#include "G4ClassicalRK4.hh"
#include "G4ChordFinder.hh"

class MyDetectorConstruction : public G4VUserDetectorConstruction
{
private:
    G4MagneticField* fMagneticField = nullptr;
    G4FieldManager* fFieldManager = nullptr;
};

void MyDetectorConstruction::ConstructSDandField()
{
    // Create uniform magnetic field (1 Tesla in Z direction)
    fMagneticField = new G4UniformMagField(
        G4ThreeVector(0., 0., 1.0*tesla));

    fFieldManager = new G4FieldManager();
    fFieldManager->SetDetectorField(fMagneticField);
    fFieldManager->CreateChordFinder(fMagneticField);

    // Apply to world volume
    G4bool forceToAllDaughters = true;
    fScoringVolume->SetFieldManager(fFieldManager, forceToAllDaughters);
}
```

### Multi-threaded Application

```cpp
#include "G4AutoDelete.hh"
#include "G4Threading.hh"

class MyDetectorConstruction : public G4VUserDetectorConstruction
{
public:
    virtual G4VPhysicalVolume* Construct() override;
    virtual void ConstructSDandField() override;

private:
    // Thread-local storage for SD
    static G4ThreadLocal MySensitiveDetector* fDetectorSD;
};

// Initialize static thread-local pointer
G4ThreadLocal MySensitiveDetector*
    MyDetectorConstruction::fDetectorSD = nullptr;

G4VPhysicalVolume* MyDetectorConstruction::Construct()
{
    // Build geometry (shared across threads)
    DefineMaterials();
    return DefineVolumes();
}

void MyDetectorConstruction::ConstructSDandField()
{
    // Create thread-local sensitive detector
    if (!fDetectorSD) {
        fDetectorSD = new MySensitiveDetector(
            "DetectorSD", "DetectorHitsCollection");

        // Register for automatic deletion
        G4AutoDelete::Register(fDetectorSD);

        // Register with SD manager
        G4SDManager::GetSDMpointer()->AddNewDetector(fDetectorSD);
    }

    // Attach SD to logical volume
    SetSensitiveDetector("Detector", fDetectorSD);
}
```

### Parameterized Geometry

```cpp
class MyDetectorConstruction : public G4VUserDetectorConstruction
{
public:
    MyDetectorConstruction();
    virtual ~MyDetectorConstruction() = default;

    virtual G4VPhysicalVolume* Construct() override;
    virtual void ConstructSDandField() override;

    // Setters for geometry parameters
    void SetDetectorThickness(G4double thickness) {
        fDetectorThickness = thickness;
        // Trigger geometry rebuild if already constructed
        if (fWorldPhysical) {
            G4RunManager::GetRunManager()->ReinitializeGeometry();
        }
    }

    void SetDetectorMaterial(const G4String& materialName) {
        fDetectorMaterialName = materialName;
    }

private:
    G4VPhysicalVolume* fWorldPhysical = nullptr;
    G4LogicalVolume* fDetectorLogical = nullptr;

    G4double fDetectorThickness = 10*cm;
    G4String fDetectorMaterialName = "G4_WATER";
};

G4VPhysicalVolume* MyDetectorConstruction::Construct()
{
    // Use parameters to construct geometry
    auto nist = G4NistManager::Instance();
    G4Material* detectorMaterial =
        nist->FindOrBuildMaterial(fDetectorMaterialName);

    // ... construct with fDetectorThickness and detectorMaterial

    return fWorldPhysical;
}
```

### With Parallel World

```cpp
// ScoringWorld.hh - Parallel world for scoring
class ScoringWorld : public G4VUserParallelWorld
{
public:
    ScoringWorld(G4String worldName);
    virtual ~ScoringWorld() = default;

    virtual void Construct() override;
    virtual void ConstructSD() override;
};

// MyDetectorConstruction.cc
MyDetectorConstruction::MyDetectorConstruction()
{
    // Register parallel world
    RegisterParallelWorld(new ScoringWorld("ScoringWorld"));
}
```

## Registration Pattern

```cpp
// main.cc
#include "G4RunManager.hh"
// OR for MT:
#include "G4MTRunManager.hh"

#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"
#include "MyActionInitialization.hh"

int main()
{
    // Sequential mode
    auto runManager = new G4RunManager;

    // OR Multi-threaded mode
    // auto runManager = new G4MTRunManager;
    // runManager->SetNumberOfThreads(4);

    // Set detector construction (mandatory)
    runManager->SetUserInitialization(new MyDetectorConstruction);

    // Set physics list (mandatory)
    runManager->SetUserInitialization(new MyPhysicsList);

    // Set action initialization (mandatory since G4 10.0)
    runManager->SetUserInitialization(new MyActionInitialization);

    runManager->Initialize();
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

## Thread Safety in Multi-threaded Mode

### Shared Objects (Constructed Once)
- G4Material
- G4Element
- G4Isotope
- G4VSolid (boxes, tubes, etc.)
- G4LogicalVolume
- G4VPhysicalVolume
- Geometry tree structure

### Thread-Local Objects (Constructed Per Thread)
- G4VSensitiveDetector
- G4MagneticField
- G4FieldManager
- G4Region (with production cuts)
- G4UserLimits

### Thread-Safe Construction Pattern

```cpp
G4VPhysicalVolume* MyDetectorConstruction::Construct()
{
    // This runs ONCE in master thread
    // All geometry is shared across worker threads

    // Safe: Construct materials
    DefineMaterials();

    // Safe: Construct geometry
    return DefineVolumes();
}

void MyDetectorConstruction::ConstructSDandField()
{
    // This runs ONCE PER WORKER THREAD
    // Create thread-local objects here

    // Safe: Thread-local SD
    auto sd = new MySensitiveDetector(...);

    // Safe: Thread-local field
    auto field = new G4UniformMagField(...);
}
```

## Performance Considerations

1. **Overlap Checking**: Enable during development, disable for production
   ```cpp
   new G4PVPlacement(..., checkOverlaps = true);  // Development
   new G4PVPlacement(..., checkOverlaps = false); // Production
   ```

2. **Material Caching**: Use G4NistManager for predefined materials
   ```cpp
   auto nist = G4NistManager::Instance();
   auto material = nist->FindOrBuildMaterial("G4_WATER"); // Cached
   ```

3. **Geometry Optimization**: Minimize volume tree depth

4. **Memory Management**: Geometry objects auto-deleted by G4RunManager

## Common Pitfalls

::: warning Common Errors
1. **Not Returning World Volume**: Construct() must return non-null pointer
2. **Creating SD in Construct()**: Use ConstructSDandField() instead
3. **Thread-Unsafe Fields**: Don't create fields in Construct() for MT
4. **Forgetting SD Registration**: Must call AddNewDetector() before SetSensitiveDetector()
5. **Overlap Checking**: Expensive - use sparingly in production
:::

## See Also

- [G4VUserPhysicsList](g4vuserphysicslist.md) - Physics process initialization
- [G4VUserActionInitialization](g4vuseractioninitialization.md) - User action setup
- [G4RunManager](g4runmanager.md) - Sequential run management
- [G4MTRunManager](g4mtrunmanager.md) - Multi-threaded run management
- [Run Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/run/include/G4VUserDetectorConstruction.hh`
- Source: `source/run/src/G4VUserDetectorConstruction.cc`
:::
