# G4VFastSimulationModel

## Overview

`G4VFastSimulationModel` is the abstract base class for all fast simulation (parameterization) models in Geant4. Users must inherit from this class and implement three pure virtual methods to define custom physics parameterizations that replace detailed particle tracking in specific detector regions.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4VFastSimulationModel.hh`
**Source:** `source/processes/parameterisation/src/G4VFastSimulationModel.cc`
**Base Class:** None (root of fast simulation hierarchy)
:::

## Purpose

This class provides:
- **Abstract interface** for user-defined parameterization models
- **Three-method workflow**: particle applicability → trigger conditions → parameterization execution
- **Automatic registration** with fast simulation managers
- **Support for both in-flight and at-rest** parameterizations
- **Model identification** via unique names
- **Flush mechanism** for cleaning up buffered data

## Class Definition

**Lines 59-137** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
class G4VFastSimulationModel
{
  public:
    // Constructor with model name only
    G4VFastSimulationModel(const G4String& aName);

    // Constructor with automatic envelope setup
    G4VFastSimulationModel(const G4String& aName,
                           G4Envelope* envelope,
                           G4bool IsUnique = FALSE);

    virtual ~G4VFastSimulationModel() = default;

    // Pure virtual methods - MUST implement
    virtual G4bool IsApplicable(const G4ParticleDefinition&) = 0;
    virtual G4bool ModelTrigger(const G4FastTrack&) = 0;
    virtual void DoIt(const G4FastTrack&, G4FastStep&) = 0;

    // Optional AtRest methods
    virtual G4bool AtRestModelTrigger(const G4FastTrack&);
    virtual void AtRestDoIt(const G4FastTrack&, G4FastStep&);

    // Optional cleanup
    virtual void Flush();

    // Utility methods
    const G4String GetName() const;
    G4bool operator==(const G4VFastSimulationModel&) const;

  private:
    G4String theModelName;
};
```

## Constructor Details

### Simple Constructor

**Lines 63** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
G4VFastSimulationModel(const G4String& aName);
```

**Purpose**: Creates a model with a given name. You must manually attach it to a `G4FastSimulationManager`.

**Parameters**:
- `aName`: Unique identifier for this model

**Example**:
```cpp
MyEMShowerModel::MyEMShowerModel(const G4String& name)
    : G4VFastSimulationModel(name)
{
    // Model initialization
}

// Later, manually register:
G4FastSimulationManager* manager = new G4FastSimulationManager(envelope);
manager->AddFastSimulationModel(myModel);
```

### Convenient Constructor

**Lines 65-76** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
G4VFastSimulationModel(const G4String& aName,
                       G4Envelope* envelope,
                       G4bool IsUnique = FALSE);
```

**Purpose**: "Quick start" constructor that automatically creates or attaches to a `G4FastSimulationManager` for the specified envelope.

**Parameters**:
- `aName`: Model identifier
- `envelope`: `G4Region` pointer defining the parameterization volume
- `IsUnique`: Set to `true` if envelope placed only once (optimization)

**Behavior**:
- Creates `G4FastSimulationManager` if one doesn't exist for this envelope
- Automatically registers this model with the manager
- Handles single vs. multiple placements via `IsUnique` flag

**Example**:
```cpp
// Automatic setup - recommended approach
MyEMShowerModel::MyEMShowerModel(G4Envelope* region)
    : G4VFastSimulationModel("EMShower", region, false)
{
    // Model is now automatically registered!
}

// In detector construction:
G4Region* caloRegion = new G4Region("Calorimeter");
caloLogical->SetRegion(caloRegion);
caloRegion->AddRootLogicalVolume(caloLogical);

MyEMShowerModel* model = new MyEMShowerModel(caloRegion);
// Done! Model is active.
```

::: tip IsUnique Flag
Set `IsUnique = true` when you know the envelope's logical volume is placed only once in the geometry. This avoids recalculating coordinate transformations on every step, providing a small performance improvement.
:::

## Pure Virtual Methods (Must Implement)

### IsApplicable

**Lines 80-84** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& particle) = 0;
```

**Purpose**: Determines if this model can parameterize the given particle type.

**When Called**: Once when a new particle type enters the envelope. Result is cached for efficiency.

**Return Value**:
- `true`: This model can handle this particle type
- `false`: This model ignores this particle type

**Parameters**:
- `particle`: Particle definition providing intrinsic properties (mass, charge, name, etc.)

**Implementation Strategy**:
```cpp
G4bool MyEMShowerModel::IsApplicable(const G4ParticleDefinition& particle)
{
    // Approach 1: Compare pointers (fastest)
    return (&particle == G4Electron::Definition() ||
            &particle == G4Positron::Definition() ||
            &particle == G4Gamma::Definition());

    // Approach 2: Check particle type
    // return (particle.GetParticleType() == "e" ||
    //         particle.GetParticleType() == "gamma");

    // Approach 3: Check charge and mass
    // G4double charge = particle.GetPDGCharge();
    // G4double mass = particle.GetPDGMass();
    // return (std::abs(charge) == eplus && mass < 1*GeV);
}
```

**Performance Impact**: This method is called infrequently (once per particle type), so complex logic is acceptable.

### ModelTrigger

**Lines 86-94** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
virtual G4bool ModelTrigger(const G4FastTrack& fastTrack) = 0;
```

**Purpose**: Determines if current dynamic conditions warrant parameterization.

**When Called**: Every step for applicable particles inside the envelope.

**Return Value**:
- `true`: Execute parameterization (call `DoIt`)
- `false`: Continue with detailed tracking

**Parameters**:
- `fastTrack`: Provides access to:
  - Current `G4Track` (energy, momentum, position, time)
  - Envelope geometry (solid, logical volume, transforms)
  - Local coordinates (position and momentum in envelope frame)
  - Boundary information

**Implementation Strategy**:

```cpp
G4bool MyEMShowerModel::ModelTrigger(const G4FastTrack& fastTrack)
{
    // ========================================
    // Always check boundary first (CRITICAL!)
    // ========================================
    // Don't trigger if particle is exiting
    if (fastTrack.OnTheBoundaryButExiting()) {
        return false;
    }

    // ========================================
    // Energy threshold (most common trigger)
    // ========================================
    const G4Track* track = fastTrack.GetPrimaryTrack();
    G4double energy = track->GetKineticEnergy();

    if (energy < 1.0*CLHEP::GeV) {
        return false;  // Too low energy for parameterization
    }

    // ========================================
    // Optional: Check available material
    // ========================================
    // Only trigger if we have enough material for a shower
    G4VSolid* solid = fastTrack.GetEnvelopeSolid();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    G4double distanceToOut = solid->DistanceToOut(localPos, localDir);

    // Require at least 5 radiation lengths
    G4double radiationLength = 1.4*CLHEP::cm;  // Material dependent
    if (distanceToOut < 5.0 * radiationLength) {
        return false;  // Not enough material for shower
    }

    // ========================================
    // Optional: Position-based trigger
    // ========================================
    // Example: Only parameterize in certain regions
    // if (localPos.z() < 10*cm) return false;

    // All conditions satisfied - trigger!
    return true;
}
```

**Performance Critical**: This method is called frequently (every step). Keep it efficient:
- Check cheapest conditions first (boundary check)
- Cache expensive calculations
- Avoid unnecessary geometry queries

::: warning Boundary Check
ALWAYS check `fastTrack.OnTheBoundaryButExiting()` first and return `false` if true. Otherwise you may trigger parameterization when the particle is leaving the envelope, causing incorrect physics.
:::

### DoIt

**Lines 96-101** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
virtual void DoIt(const G4FastTrack& fastTrack,
                  G4FastStep& fastStep) = 0;
```

**Purpose**: Execute the parameterization and define the final state.

**When Called**: After `ModelTrigger` returns `true`.

**Parameters**:
- `fastTrack`: Input information (read-only)
  - Current track state
  - Envelope geometry and coordinates
  - Particle properties
- `fastStep`: Output final state (modify this)
  - Primary track fate (kill, modify energy/direction)
  - Secondary particles to create
  - Energy deposition
  - Hit creation

**Return Value**: None (results communicated via `fastStep`)

**Implementation Example**:

```cpp
void MyEMShowerModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    // ========================================
    // 1. Get input information
    // ========================================
    const G4Track* primaryTrack = fastTrack.GetPrimaryTrack();
    G4double primaryEnergy = primaryTrack->GetKineticEnergy();
    G4ThreeVector localPosition = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDirection = fastTrack.GetPrimaryTrackLocalDirection();

    // ========================================
    // 2. Kill primary particle
    // ========================================
    // This stops tracking and signals shower absorption
    fastStep.KillPrimaryTrack();

    // ========================================
    // 3. Set total energy deposited
    // ========================================
    // For energy conservation and trajectory recording
    fastStep.ProposeTotalEnergyDeposited(primaryEnergy);

    // ========================================
    // 4. Generate parameterized shower
    // ========================================
    std::vector<ShowerHit> showerHits =
        GenerateShowerProfile(primaryEnergy, localPosition, localDirection);

    // ========================================
    // 5. Create hits in sensitive detector
    // ========================================
    G4FastSimHitMaker hitMaker;

    for (const auto& hit : showerHits) {
        G4FastHit fastHit(hit.position, hit.energy);
        hitMaker.make(fastHit, fastTrack);
    }

    // ========================================
    // 6. Optional: Create secondary particles
    // ========================================
    // Example: Create a few representative particles for downstream detectors
    if (CreateSecondaries) {
        fastStep.SetNumberOfSecondaryTracks(nSecondaries);

        for (int i = 0; i < nSecondaries; ++i) {
            G4DynamicParticle* particle = CreateSecondaryParticle(i);
            G4ThreeVector position = GetSecondaryPosition(i);
            G4double time = primaryTrack->GetGlobalTime();

            fastStep.CreateSecondaryTrack(*particle, position, time,
                                           true);  // local coordinates
            delete particle;
        }
    }
}
```

**Key Operations**:

1. **Kill or Modify Primary**:
   ```cpp
   fastStep.KillPrimaryTrack();  // Stop tracking
   // OR
   fastStep.ProposePrimaryTrackFinalKineticEnergy(newEnergy);
   fastStep.ProposePrimaryTrackFinalMomentumDirection(newDirection);
   ```

2. **Set Energy Deposition**:
   ```cpp
   fastStep.ProposeTotalEnergyDeposited(energy);
   ```

3. **Create Hits** (recommended approach):
   ```cpp
   G4FastSimHitMaker hitMaker;
   G4FastHit hit(position, energy);
   hitMaker.make(hit, fastTrack);
   ```

4. **Create Secondary Particles** (if needed):
   ```cpp
   fastStep.SetNumberOfSecondaryTracks(n);
   G4DynamicParticle particle(definition, momentum, energy);
   fastStep.CreateSecondaryTrack(particle, position, time);
   ```

## Optional Virtual Methods

### AtRestModelTrigger

**Lines 116** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
virtual G4bool AtRestModelTrigger(const G4FastTrack& fastTrack)
{
    return false;  // Default: no at-rest parameterization
}
```

**Purpose**: Determines if parameterization should occur when particle stops.

**Default**: Returns `false` (no at-rest parameterization)

**Override for**:
- Nuclear capture of stopped particles
- Muon capture parameterization
- Custom at-rest physics

**Example**:
```cpp
G4bool MyNuclearCaptureModel::AtRestModelTrigger(const G4FastTrack& fastTrack)
{
    const G4Track* track = fastTrack.GetPrimaryTrack();

    // Trigger for stopped negative particles
    return (track->GetKineticEnergy() < 1*CLHEP::eV &&
            track->GetDynamicParticle()->GetCharge() < 0);
}
```

### AtRestDoIt

**Lines 123** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
virtual void AtRestDoIt(const G4FastTrack& fastTrack,
                         G4FastStep& fastStep)
{
    // Default: does nothing
}
```

**Purpose**: Execute at-rest parameterization.

**Default**: Does nothing

**Override with**: Similar implementation to `DoIt`, but for at-rest scenarios

**Example**:
```cpp
void MyNuclearCaptureModel::AtRestDoIt(const G4FastTrack& fastTrack,
                                        G4FastStep& fastStep)
{
    // Kill the stopped particle
    fastStep.KillPrimaryTrack();

    // Generate capture gammas
    G4int nGammas = SampleCaptureGammas();
    fastStep.SetNumberOfSecondaryTracks(nGammas);

    for (int i = 0; i < nGammas; ++i) {
        G4double energy = SampleGammaEnergy();
        G4ThreeVector direction = SampleIsotropicDirection();

        G4DynamicParticle gamma(G4Gamma::Definition(),
                                 direction, energy);

        fastStep.CreateSecondaryTrack(gamma,
            fastTrack.GetPrimaryTrackLocalPosition(),
            fastTrack.GetPrimaryTrack()->GetGlobalTime());
    }
}
```

### Flush

**Lines 125-126** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
virtual void Flush() {}
```

**Purpose**: Clean up buffered data at end of event.

**When Called**:
- End of event
- When requested via `G4GlobalFastSimulationManager::Flush()`

**Default**: Does nothing

**Override when**:
- Model buffers hits or data structures
- Using cached shower templates
- Accumulating statistics

**Example**:
```cpp
void MyModel::Flush()
{
    // Clear any cached shower profiles
    fShowerCache.clear();

    // Reset event counters
    fHitsThisEvent = 0;

    // Clean up buffered data
    fBufferedHits.clear();
}
```

## Utility Methods

### GetName

**Lines 129, 139-142** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
const G4String GetName() const;
```

**Purpose**: Returns the model name.

**Example**:
```cpp
G4String modelName = myModel->GetName();
G4cout << "Model: " << modelName << G4endl;
```

### Equality Operator

**Lines 130, 144-147** in `source/processes/parameterisation/include/G4VFastSimulationModel.hh`

```cpp
G4bool operator==(const G4VFastSimulationModel& other) const;
```

**Purpose**: Compares models by pointer (identity, not value).

**Implementation**: Returns `this == &other`

## Complete Example: Electromagnetic Shower Model

```cpp
// ================================================================
// MyEMShowerModel.hh
// ================================================================
#ifndef MyEMShowerModel_h
#define MyEMShowerModel_h

#include "G4VFastSimulationModel.hh"
#include "G4FastSimHitMaker.hh"
#include <vector>

class MyEMShowerModel : public G4VFastSimulationModel
{
public:
    // Constructor - uses convenient form
    MyEMShowerModel(const G4String& name, G4Envelope* envelope);

    ~MyEMShowerModel() override = default;

    // Three required methods
    G4bool IsApplicable(const G4ParticleDefinition& particle) override;
    G4bool ModelTrigger(const G4FastTrack& fastTrack) override;
    void DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep) override;

    // Optional cleanup
    void Flush() override;

    // Configuration
    void SetEnergyThreshold(G4double threshold) { fEnergyThreshold = threshold; }
    void SetRadiationLength(G4double X0) { fRadiationLength = X0; }

private:
    struct ShowerSpot {
        G4ThreeVector position;
        G4double energy;
    };

    std::vector<ShowerSpot> GenerateShower(
        G4double energy,
        const G4ThreeVector& position,
        const G4ThreeVector& direction);

    G4double fEnergyThreshold;
    G4double fRadiationLength;
    G4double fCriticalEnergy;

    // Statistics
    G4long fTotalShowers;
    G4long fThisEventShowers;
};

#endif

// ================================================================
// MyEMShowerModel.cc
// ================================================================
#include "MyEMShowerModel.hh"
#include "G4Electron.hh"
#include "G4Positron.hh"
#include "G4Gamma.hh"
#include "G4FastHit.hh"
#include "Randomize.hh"

MyEMShowerModel::MyEMShowerModel(const G4String& name,
                                  G4Envelope* envelope)
    : G4VFastSimulationModel(name, envelope),
      fEnergyThreshold(1.0*CLHEP::GeV),
      fRadiationLength(1.4*CLHEP::cm),    // e.g., PbWO4
      fCriticalEnergy(10.0*CLHEP::MeV),   // Material dependent
      fTotalShowers(0),
      fThisEventShowers(0)
{
    G4cout << "EMShowerModel '" << name << "' created for envelope: "
           << envelope->GetName() << G4endl;
}

G4bool MyEMShowerModel::IsApplicable(const G4ParticleDefinition& particle)
{
    // Handle electromagnetic particles
    return (&particle == G4Electron::Definition() ||
            &particle == G4Positron::Definition() ||
            &particle == G4Gamma::Definition());
}

G4bool MyEMShowerModel::ModelTrigger(const G4FastTrack& fastTrack)
{
    // Don't trigger if exiting
    if (fastTrack.OnTheBoundaryButExiting()) {
        return false;
    }

    // Check energy threshold
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    if (energy < fEnergyThreshold) {
        return false;
    }

    // Check sufficient material
    G4VSolid* solid = fastTrack.GetEnvelopeSolid();
    G4double distOut = solid->DistanceToOut(
        fastTrack.GetPrimaryTrackLocalPosition(),
        fastTrack.GetPrimaryTrackLocalDirection());

    // Require at least 5 X0
    if (distOut < 5.0 * fRadiationLength) {
        return false;
    }

    return true;
}

void MyEMShowerModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    fTotalShowers++;
    fThisEventShowers++;

    // Get input
    const G4Track* track = fastTrack.GetPrimaryTrack();
    G4double energy = track->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    // Kill primary
    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(energy);

    // Generate shower
    auto spots = GenerateShower(energy, localPos, localDir);

    // Deposit hits
    G4FastSimHitMaker hitMaker;
    for (const auto& spot : spots) {
        G4FastHit hit(spot.position, spot.energy);
        hitMaker.make(hit, fastTrack);
    }
}

std::vector<MyEMShowerModel::ShowerSpot>
MyEMShowerModel::GenerateShower(G4double energy,
                                 const G4ThreeVector& position,
                                 const G4ThreeVector& direction)
{
    std::vector<ShowerSpot> spots;

    // Shower parameterization
    G4double y = energy / fCriticalEnergy;
    G4double tmax = std::log(y) + 0.5;  // shower maximum

    G4int nSpots = static_cast<G4int>(20 + 2*std::sqrt(energy/CLHEP::GeV));

    for (int i = 0; i < nSpots; ++i) {
        G4double t = i * (3.0*tmax) / nSpots;  // depth in X0

        // Longitudinal profile (simplified gamma distribution)
        G4double shape = std::pow(t, tmax-1) * std::exp(-t);
        G4double spotEnergy = energy * shape * (3.0*tmax/nSpots);

        // Position along shower axis
        G4double depth = t * fRadiationLength;
        G4ThreeVector spotPos = position + depth * direction;

        // Add transverse spread (Moliere radius)
        G4double moliereRadius = 21*CLHEP::MeV / fCriticalEnergy * fRadiationLength;
        G4double r = moliereRadius * std::sqrt(G4UniformRand());
        G4double phi = CLHEP::twopi * G4UniformRand();

        G4ThreeVector perp1 = direction.orthogonal().unit();
        G4ThreeVector perp2 = direction.cross(perp1).unit();

        spotPos += r * (std::cos(phi)*perp1 + std::sin(phi)*perp2);

        spots.push_back({spotPos, spotEnergy});
    }

    return spots;
}

void MyEMShowerModel::Flush()
{
    if (fThisEventShowers > 0) {
        G4cout << "Event finished: " << fThisEventShowers
               << " showers parameterized" << G4endl;
        fThisEventShowers = 0;
    }
}
```

## Usage in Detector Construction

```cpp
void MyDetectorConstruction::ConstructSDandField()
{
    // Define envelope region
    G4Region* caloRegion = new G4Region("CalorimeterRegion");
    fCalorimeterLV->SetRegion(caloRegion);
    caloRegion->AddRootLogicalVolume(fCalorimeterLV);

    // Create fast simulation model
    // Constructor automatically creates manager and registers model
    MyEMShowerModel* fastModel =
        new MyEMShowerModel("EMShowerModel", caloRegion);

    // Optional: Configure model
    fastModel->SetEnergyThreshold(2.0*GeV);
    fastModel->SetRadiationLength(1.4*cm);

    // Setup sensitive detector with fast sim support
    MySensitiveDetector* sd = new MySensitiveDetector("CaloSD");
    G4SDManager::GetSDMpointer()->AddNewDetector(sd);
    fCalorimeterLV->SetSensitiveDetector(sd);
}
```

## Best Practices

1. **Naming Convention**: Use descriptive names for debugging
   ```cpp
   new MyModel("ECAL_EM_Shower_Model", region);
   ```

2. **Boundary Checks**: Always check before triggering
   ```cpp
   if (fastTrack.OnTheBoundaryButExiting()) return false;
   ```

3. **Energy Conservation**: Verify in DoIt
   ```cpp
   G4double totalHitEnergy = 0;
   for (const auto& hit : hits) totalHitEnergy += hit.energy;
   assert(std::abs(totalHitEnergy - primaryEnergy) < 0.01*primaryEnergy);
   ```

4. **Statistics**: Track model usage
   ```cpp
   static G4long nCalls = 0;
   nCalls++;
   if (nCalls % 1000 == 0) G4cout << "Triggers: " << nCalls << G4endl;
   ```

5. **Validation**: Compare with detailed simulation
   - Energy resolution
   - Shower shapes
   - Hit multiplicities

## Common Patterns

### Energy-Dependent Triggering
```cpp
G4bool ModelTrigger(const G4FastTrack& fastTrack) {
    if (fastTrack.OnTheBoundaryButExiting()) return false;
    G4double E = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    return (E > 1*GeV && E < 100*GeV);  // parameterize specific range
}
```

### Position-Based Triggering
```cpp
G4bool ModelTrigger(const G4FastTrack& fastTrack) {
    if (fastTrack.OnTheBoundaryButExiting()) return false;
    G4ThreeVector pos = fastTrack.GetPrimaryTrackLocalPosition();
    return (pos.z() > 50*cm);  // only in back half of detector
}
```

### Particle-Type Specific
```cpp
G4bool IsApplicable(const G4ParticleDefinition& particle) {
    // Only electrons (not positrons or photons)
    return (&particle == G4Electron::Definition());
}
```

## Related Classes

- [G4FastSimulationManager](G4FastSimulationManager.md) - Manages models in a region
- [G4FastTrack](G4FastTrack.md) - Input data for parameterization
- [G4FastStep](G4FastStep.md) - Output final state
- [G4FastSimHitMaker](G4FastSimHitMaker.md) - Hit creation helper
- [G4GlobalFastSimulationManager](G4GlobalFastSimulationManager.md) - Global coordination

## References

- Main overview: [Parameterisation Module](../index.md)
- Example: `examples/extended/parameterisations/Par03/`
- History: Lines 36-38 in header (first implementation Oct 97)
