# G4VFastSimSensitiveDetector

## Overview

`G4VFastSimSensitiveDetector` is an abstract base class that extends the standard sensitive detector interface to handle hits created by fast simulation. Detectors must inherit from both `G4VSensitiveDetector` (for standard hits from `G4Step`) and `G4VFastSimSensitiveDetector` (for fast sim hits from `G4FastHit`) to support both detailed tracking and fast simulation modes.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4VFastSimSensitiveDetector.hh`
**Type:** Abstract Interface Class
**Pattern:** Dual inheritance for hybrid simulation
:::

## Purpose

This class provides:
- **Fast simulation hit interface**: Process `G4FastHit` from parameterized models
- **Dual mode support**: Handle both `G4Step` and `G4FastHit`
- **Automatic readout geometry handling**: Respects detector readout structure
- **Public hit method**: Can be called directly or via `G4FastSimHitMaker`
- **Unified hit processing**: Single hit collection for both modes

## Class Definition

**Lines 54-118** in `source/processes/parameterisation/include/G4VFastSimSensitiveDetector.hh`

```cpp
class G4VFastSimSensitiveDetector
{
  public:
    virtual ~G4VFastSimSensitiveDetector() = default;

    // Public hit creation method
    G4bool Hit(const G4FastHit* hit,
               const G4FastTrack* track,
               G4TouchableHandle* touchable);

  private:
    // Pure virtual - must implement
    virtual G4bool ProcessHits(const G4FastHit* hit,
                                const G4FastTrack* track,
                                G4TouchableHistory* ROHistory) = 0;
};
```

## Dual Inheritance Requirement

To support both detailed and fast simulation, your sensitive detector must inherit from **both** base classes:

```cpp
class MySensitiveDetector : public G4VSensitiveDetector,          // Standard hits
                             public G4VFastSimSensitiveDetector   // Fast sim hits
{
public:
    MySensitiveDetector(const G4String& name);

    // For detailed simulation (from G4VSensitiveDetector)
    G4bool ProcessHits(G4Step* step,
                       G4TouchableHistory* history) override;

    // For fast simulation (from G4VFastSimSensitiveDetector)
    G4bool ProcessHits(const G4FastHit* hit,
                       const G4FastTrack* track,
                       G4TouchableHistory* ROHistory) override;

    void Initialize(G4HCofThisEvent* hce) override;
    void EndOfEvent(G4HCofThisEvent* hce) override;

private:
    MyHitsCollection* fHitsCollection;
    G4int fHCID;
};
```

## Public Method: Hit

**Lines 69-103** in `source/processes/parameterisation/include/G4VFastSimSensitiveDetector.hh`

```cpp
G4bool Hit(const G4FastHit* hit,
           const G4FastTrack* track,
           G4TouchableHandle* touchable);
```

**Purpose**: Public interface for hit creation, handles readout geometry and calls `ProcessHits`.

**Parameters**:
- `hit`: Fast simulation hit (energy + position)
- `track`: Fast track with particle and envelope information
- `touchable`: Geometry touchable handle

**Return**: `true` if hit successfully processed, `false` otherwise

**Usage**: Called automatically by `G4FastSimHitMaker`, or can be called directly:

```cpp
// Via G4FastSimHitMaker (typical)
G4FastSimHitMaker hitMaker;
G4FastHit hit(position, energy);
hitMaker.make(hit, fastTrack);  // Calls Hit() internally

// Direct call (rare)
G4VFastSimSensitiveDetector* sd = // get your SD
G4TouchableHandle touchable = // get touchable
sd->Hit(&hit, &fastTrack, &touchable);
```

**Internal Behavior**:
1. Checks if SD is active (via `G4VSensitiveDetector::isActive()`)
2. Handles readout geometry if defined
3. Creates fake `G4Step` for readout geometry navigation
4. Calls your `ProcessHits(const G4FastHit*, ...)` implementation
5. Returns result

::: warning Must Also Inherit G4VSensitiveDetector
The `Hit()` method casts `this` to `G4VSensitiveDetector*`. If your class doesn't inherit from both base classes, you'll get a fatal exception at runtime.
:::

## Pure Virtual Method: ProcessHits

**Lines 116-117** in `source/processes/parameterisation/include/G4VFastSimSensitiveDetector.hh`

```cpp
virtual G4bool ProcessHits(const G4FastHit* hit,
                            const G4FastTrack* track,
                            G4TouchableHistory* ROHistory) = 0;
```

**Purpose**: Process a fast simulation hit - **you must implement this**.

**Parameters**:
- `hit`: Fast hit containing position and energy
- `track`: Fast track with particle information
- `ROHistory`: Readout geometry touchable (if readout geometry defined, otherwise mass geometry)

**Return**: `true` if hit created successfully, `false` otherwise

**Implementation Requirements**:
1. Extract energy and position from `hit`
2. Create your hit object
3. Add to hit collection
4. Return `true`

## Complete Implementation Example

### Basic Calorimeter Sensitive Detector

```cpp
// ===================================================================
// MyCalorimeterSD.hh
// ===================================================================
#ifndef MyCalorimeterSD_h
#define MyCalorimeterSD_h

#include "G4VSensitiveDetector.hh"
#include "G4VFastSimSensitiveDetector.hh"
#include "MyCaloHit.hh"

class G4Step;
class G4HCofThisEvent;
class G4TouchableHistory;
class G4FastHit;
class G4FastTrack;

class MyCalorimeterSD : public G4VSensitiveDetector,
                         public G4VFastSimSensitiveDetector
{
public:
    MyCalorimeterSD(const G4String& name);
    ~MyCalorimeterSD() override = default;

    // G4VSensitiveDetector interface
    void Initialize(G4HCofThisEvent* hce) override;
    void EndOfEvent(G4HCofThisEvent* hce) override;

    // For detailed simulation
    G4bool ProcessHits(G4Step* step,
                       G4TouchableHistory* history) override;

    // For fast simulation
    G4bool ProcessHits(const G4FastHit* hit,
                       const G4FastTrack* track,
                       G4TouchableHistory* history) override;

private:
    MyCaloHitsCollection* fHitsCollection;
    G4int fHCID;
};

#endif

// ===================================================================
// MyCalorimeterSD.cc
// ===================================================================
#include "MyCalorimeterSD.hh"
#include "G4HCofThisEvent.hh"
#include "G4Step.hh"
#include "G4StepPoint.hh"
#include "G4TouchableHistory.hh"
#include "G4FastHit.hh"
#include "G4FastTrack.hh"
#include "G4Track.hh"
#include "G4SDManager.hh"

MyCalorimeterSD::MyCalorimeterSD(const G4String& name)
    : G4VSensitiveDetector(name),
      fHitsCollection(nullptr),
      fHCID(-1)
{
    collectionName.insert("CaloHitsCollection");
}

void MyCalorimeterSD::Initialize(G4HCofThisEvent* hce)
{
    // Create hits collection
    fHitsCollection = new MyCaloHitsCollection(
        SensitiveDetectorName, collectionName[0]);

    // Add to event
    if (fHCID < 0) {
        fHCID = G4SDManager::GetSDMpointer()->GetCollectionID(fHitsCollection);
    }
    hce->AddHitsCollection(fHCID, fHitsCollection);
}

void MyCalorimeterSD::EndOfEvent(G4HCofThisEvent*)
{
    // Optional: print summary
    if (verboseLevel > 0) {
        G4int nHits = fHitsCollection->entries();
        G4cout << "\n-------->Hits Collection: " << nHits << " hits" << G4endl;
    }
}

// For detailed simulation
G4bool MyCalorimeterSD::ProcessHits(G4Step* step,
                                     G4TouchableHistory* history)
{
    // Get step information
    G4double edep = step->GetTotalEnergyDeposit();

    if (edep == 0.) return false;

    // Get position
    G4StepPoint* preStep = step->GetPreStepPoint();
    G4ThreeVector position = preStep->GetPosition();

    // Get copy number (cell ID)
    G4int copyNo = preStep->GetTouchable()->GetCopyNumber();

    // Create hit
    MyCaloHit* hit = new MyCaloHit();
    hit->SetEnergy(edep);
    hit->SetPosition(position);
    hit->SetCellID(copyNo);
    hit->SetTime(preStep->GetGlobalTime());

    // Add to collection
    fHitsCollection->insert(hit);

    return true;
}

// For fast simulation
G4bool MyCalorimeterSD::ProcessHits(const G4FastHit* hit,
                                     const G4FastTrack* track,
                                     G4TouchableHistory* history)
{
    // Get hit information
    G4double energy = hit->GetEnergy();
    G4ThreeVector position = hit->GetPosition();

    if (energy == 0.) return false;

    // Get cell ID from touchable
    G4int copyNo = history->GetVolume()->GetCopyNo();

    // Get time from primary track
    const G4Track* primaryTrack = track->GetPrimaryTrack();
    G4double time = primaryTrack->GetGlobalTime();

    // Create hit (same format as detailed simulation)
    MyCaloHit* caloHit = new MyCaloHit();
    caloHit->SetEnergy(energy);
    caloHit->SetPosition(position);
    caloHit->SetCellID(copyNo);
    caloHit->SetTime(time);

    // Mark as fast sim hit (optional)
    caloHit->SetFastSimFlag(true);

    // Add to same collection as detailed hits
    fHitsCollection->insert(caloHit);

    return true;
}
```

### Advanced: Sampling Calorimeter with Layers

```cpp
// For detailed simulation
G4bool MySamplingCaloSD::ProcessHits(G4Step* step,
                                      G4TouchableHistory* history)
{
    G4double edep = step->GetTotalEnergyDeposit();
    if (edep == 0.) return false;

    // Get layer and cell IDs
    G4int layerID = history->GetReplicaNumber(1);  // Depth 1
    G4int cellID = history->GetReplicaNumber(0);   // Depth 0

    G4ThreeVector position = step->GetPreStepPoint()->GetPosition();

    // Find or create hit for this cell
    MyCaloHit* hit = FindOrCreateHit(layerID, cellID);
    hit->AddEnergy(edep);

    // Update position (energy-weighted)
    G4ThreeVector weightedPos = hit->GetPosition() * hit->GetEnergy();
    weightedPos += position * edep;
    hit->SetPosition(weightedPos / (hit->GetEnergy() + edep));

    return true;
}

// For fast simulation
G4bool MySamplingCaloSD::ProcessHits(const G4FastHit* hit,
                                      const G4FastTrack* track,
                                      G4TouchableHistory* history)
{
    G4double energy = hit->GetEnergy();
    if (energy == 0.) return false;

    // Get layer and cell from touchable
    G4int layerID = history->GetReplicaNumber(1);
    G4int cellID = history->GetReplicaNumber(0);

    G4ThreeVector position = hit->GetPosition();

    // Same logic as detailed simulation
    MyCaloHit* caloHit = FindOrCreateHit(layerID, cellID);
    caloHit->AddEnergy(energy);

    G4ThreeVector weightedPos = caloHit->GetPosition() * caloHit->GetEnergy();
    weightedPos += position * energy;
    caloHit->SetPosition(weightedPos / (caloHit->GetEnergy() + energy));

    return true;
}
```

## Integration with Fast Simulation Model

```cpp
void MyEMShowerModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(energy);

    // Create hit maker
    G4FastSimHitMaker hitMaker;

    // Generate shower spots
    G4int nSpots = 20;
    G4double X0 = 1.4*cm;

    for (int i = 0; i < nSpots; ++i) {
        G4double depth = i * 0.5 * X0;
        G4double spotEnergy = /* shower shape */ energy / nSpots;
        G4ThreeVector spotPos = localPos + depth * localDir;

        // Create hit
        G4FastHit hit(spotPos, spotEnergy);

        // This will call your SD's ProcessHits(const G4FastHit*, ...)
        hitMaker.make(hit, fastTrack);
    }
}
```

## Readout Geometry Support

If you define a readout geometry for your sensitive detector, the framework handles it automatically:

**Lines 81-94** in header (implementation of `Hit()` method)

```cpp
// In your detector construction
MySensitiveDetector* sd = new MySensitiveDetector("CaloSD");

// Attach readout geometry
MyReadoutGeometry* readoutGeom = new MyReadoutGeometry("CaloRO");
sd->SetROgeometry(readoutGeom);

// The Hit() method will:
// 1. Create fake G4Step with position from G4FastHit
// 2. Navigate through readout geometry
// 3. Pass readout touchable to your ProcessHits
```

## Common Patterns

### Pattern 1: Unified Hit Format

Use the same hit class and processing logic for both modes:

```cpp
G4bool MySD::ProcessHits(G4Step* step, G4TouchableHistory* history)
{
    G4double energy = step->GetTotalEnergyDeposit();
    G4ThreeVector position = step->GetPreStepPoint()->GetPosition();

    return CreateAndStoreHit(energy, position, history);
}

G4bool MySD::ProcessHits(const G4FastHit* hit,
                          const G4FastTrack* track,
                          G4TouchableHistory* history)
{
    G4double energy = hit->GetEnergy();
    G4ThreeVector position = hit->GetPosition();

    return CreateAndStoreHit(energy, position, history);
}

// Common implementation
G4bool MySD::CreateAndStoreHit(G4double energy,
                                const G4ThreeVector& position,
                                G4TouchableHistory* history)
{
    if (energy == 0.) return false;

    MyCaloHit* hit = new MyCaloHit();
    hit->SetEnergy(energy);
    hit->SetPosition(position);
    hit->SetCellID(history->GetVolume()->GetCopyNo());

    fHitsCollection->insert(hit);
    return true;
}
```

### Pattern 2: Flagged Hits for Analysis

Mark hits created by fast simulation:

```cpp
// Your hit class
class MyCaloHit : public G4VHit
{
public:
    void SetFastSimFlag(G4bool flag) { fIsFastSim = flag; }
    G4bool IsFastSim() const { return fIsFastSim; }

private:
    G4bool fIsFastSim = false;
};

// In SD
G4bool MySD::ProcessHits(G4Step* step, G4TouchableHistory* history)
{
    // ... create hit ...
    hit->SetFastSimFlag(false);  // Detailed simulation
    // ...
}

G4bool MySD::ProcessHits(const G4FastHit* fastHit,
                          const G4FastTrack* track,
                          G4TouchableHistory* history)
{
    // ... create hit ...
    hit->SetFastSimFlag(true);  // Fast simulation
    // ...
}
```

### Pattern 3: Hit Merging

Merge energy deposits in the same cell:

```cpp
G4bool MySD::ProcessHits(const G4FastHit* hit,
                          const G4FastTrack* track,
                          G4TouchableHistory* history)
{
    G4double energy = hit->GetEnergy();
    G4int cellID = history->GetVolume()->GetCopyNo();

    // Search for existing hit in this cell
    for (size_t i = 0; i < fHitsCollection->entries(); ++i) {
        MyCaloHit* existingHit = (*fHitsCollection)[i];

        if (existingHit->GetCellID() == cellID) {
            // Merge with existing hit
            existingHit->AddEnergy(energy);
            return true;
        }
    }

    // No existing hit - create new one
    MyCaloHit* newHit = new MyCaloHit();
    newHit->SetEnergy(energy);
    newHit->SetCellID(cellID);
    fHitsCollection->insert(newHit);

    return true;
}
```

## Debugging

### Verify Dual Inheritance

```cpp
// In your detector construction or initialization
MySensitiveDetector* sd = new MySensitiveDetector("CaloSD");

// Check inheritance
G4VSensitiveDetector* baseSD = dynamic_cast<G4VSensitiveDetector*>(sd);
G4VFastSimSensitiveDetector* fastSD =
    dynamic_cast<G4VFastSimSensitiveDetector*>(sd);

if (baseSD && fastSD) {
    G4cout << "SD correctly inherits from both base classes" << G4endl;
} else {
    G4cerr << "ERROR: SD missing required inheritance!" << G4endl;
}
```

### Add Verbose Output

```cpp
G4bool MySD::ProcessHits(const G4FastHit* hit,
                          const G4FastTrack* track,
                          G4TouchableHistory* history)
{
    if (verboseLevel > 0) {
        G4cout << "Fast sim hit: E = " << hit->GetEnergy()/MeV
               << " MeV at " << hit->GetPosition() << G4endl;
    }

    // ... process hit ...
}
```

### Count Hit Types

```cpp
class MySD : public G4VSensitiveDetector,
              public G4VFastSimSensitiveDetector
{
private:
    G4int fDetailedHits = 0;
    G4int fFastSimHits = 0;

public:
    G4bool ProcessHits(G4Step* step, G4TouchableHistory* history) override
    {
        fDetailedHits++;
        // ... process ...
    }

    G4bool ProcessHits(const G4FastHit* hit, const G4FastTrack* track,
                       G4TouchableHistory* history) override
    {
        fFastSimHits++;
        // ... process ...
    }

    void EndOfEvent(G4HCofThisEvent* hce) override
    {
        G4cout << "Event summary:" << G4endl;
        G4cout << "  Detailed hits: " << fDetailedHits << G4endl;
        G4cout << "  Fast sim hits: " << fFastSimHits << G4endl;

        fDetailedHits = 0;
        fFastSimHits = 0;
    }
};
```

## Common Issues

**Issue**: Runtime error "Sensitive detector needs to inherit from G4VSensitiveDetector"

**Solution**: Ensure your SD class inherits from BOTH base classes:
```cpp
class MySD : public G4VSensitiveDetector,         // Must have this
              public G4VFastSimSensitiveDetector  // AND this
```

**Issue**: Fast sim hits not being created

**Solutions**:
1. Verify SD is attached to logical volume
2. Check positions are inside sensitive volumes
3. Add debug output in `ProcessHits(const G4FastHit*, ...)`
4. Verify `G4FastSimHitMaker` is being used correctly

**Issue**: Hits in wrong cells

**Solution**: Check touchable history depth and replica numbers match your geometry structure

## Best Practices

1. **Use same hit format**: Keep hit class identical for both modes
2. **Implement common logic**: Extract shared code into helper methods
3. **Mark fast sim hits** (optional): Add flag for analysis
4. **Validate energy**: Check for zero energy before creating hits
5. **Test both modes**: Verify results match between detailed and fast simulation
6. **Handle readout geometry**: Let framework manage readout transforms

## Related Classes

- [G4FastHit](G4FastHit.md) - Hit structure received by this interface
- [G4FastTrack](G4FastTrack.md) - Track information provided to `ProcessHits`
- [G4FastSimHitMaker](G4FastSimHitMaker.md) - Creates hits using this interface
- `G4VSensitiveDetector` - Base class for standard hits
- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Models that create fast hits

## References

- Main overview: [Parameterisation Module](../index.md)
- Example: `examples/extended/parameterisations/Par03/`
- Documentation: Lines 36-51 in header (description)
