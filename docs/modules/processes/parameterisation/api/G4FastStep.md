# G4FastStep

## Overview

`G4FastStep` is the output interface for fast simulation models, defining the final state of particles after parameterization. It inherits from `G4VParticleChange` and serves as both the user interface for model implementations and the mechanism for communicating results back to the tracking system. Models use `G4FastStep` to specify primary track modifications, create secondary particles, and record energy deposition.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastStep.hh`
**Source:** `source/processes/parameterisation/src/G4FastStep.cc`
**Base Class:** `G4VParticleChange` (particle change interface)
:::

## Purpose

`G4FastStep` provides:
- **Primary track fate**: Kill, modify energy, change direction
- **Secondary creation**: Generate daughter particles from parameterization
- **Energy deposition**: Record total energy deposited in envelope
- **Coordinate system support**: Work in global or local coordinates
- **Flexible final state**: Modify position, time, momentum, polarization
- **Stepping interface**: Acts as `G4ParticleChange` for tracking
- **Hit invocation control**: Force or suppress sensitive detector calls

## Class Definition

**Lines 89-343** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
class G4FastStep : public G4VParticleChange
{
  public:
    G4FastStep() = default;
    ~G4FastStep() override = default;

    // Primary track fate
    void KillPrimaryTrack();

    // Primary track modifications - space and time
    void ProposePrimaryTrackFinalPosition(const G4ThreeVector& position,
                                           G4bool localCoordinates = true);
    void ProposePrimaryTrackFinalTime(G4double time);
    void ProposePrimaryTrackFinalProperTime(G4double properTime);

    // Primary track modifications - dynamics
    void ProposePrimaryTrackFinalMomentumDirection(const G4ThreeVector& direction,
                                                    G4bool localCoordinates = true);
    void ProposePrimaryTrackFinalKineticEnergy(G4double energy);
    void ProposePrimaryTrackFinalKineticEnergyAndDirection(
        G4double energy, const G4ThreeVector& direction,
        G4bool localCoordinates = true);
    void ProposePrimaryTrackFinalPolarization(const G4ThreeVector& polarization,
                                               G4bool localCoordinates = true);
    void ProposePrimaryTrackPathLength(G4double length);
    void ProposePrimaryTrackFinalEventBiasingWeight(G4double weight);

    // Secondary particle creation
    void SetNumberOfSecondaryTracks(G4int nSecondaries);
    G4int GetNumberOfSecondaryTracks();

    G4Track* CreateSecondaryTrack(const G4DynamicParticle& particle,
                                   G4ThreeVector polarization,
                                   G4ThreeVector position,
                                   G4double time,
                                   G4bool localCoordinates = true);

    G4Track* CreateSecondaryTrack(const G4DynamicParticle& particle,
                                   G4ThreeVector position,
                                   G4double time,
                                   G4bool localCoordinates = true);

    G4Track* GetSecondaryTrack(G4int index);

    // Energy deposition
    void ProposeTotalEnergyDeposited(G4double energy);
    G4double GetTotalEnergyDeposited() const;

    // Stepping control
    void ForceSteppingHitInvocation();

    // Stepping interface (G4VParticleChange implementation)
    G4Step* UpdateStepForAtRest(G4Step* step) override;
    G4Step* UpdateStepForPostStep(G4Step* step) override;
    void Initialize(const G4FastTrack& fastTrack);

    // Debug
    void DumpInfo() const override;
    G4bool CheckIt(const G4Track& track) override;
};
```

## Primary Track Modifications

### KillPrimaryTrack

**Lines 103** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void KillPrimaryTrack();
```

**Purpose**: Sets primary particle kinetic energy to zero and signals tracking to stop and kill the track.

**When to Use**:
- Shower is completely absorbed in envelope
- Particle captured or fully parameterized
- Most common operation in fast simulation

**Example**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Shower completely contained - kill primary
    fastStep.KillPrimaryTrack();

    // Record energy deposition
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    fastStep.ProposeTotalEnergyDeposited(energy);

    // Generate parameterized hits...
}
```

::: tip Most Common Usage
In electromagnetic shower parameterization, you typically kill the primary track and create hits representing the shower energy deposition. This is the standard pattern.
:::

### Position and Time

**Lines 110, 117, 124** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void ProposePrimaryTrackFinalPosition(const G4ThreeVector& position,
                                       G4bool localCoordinates = true);

void ProposePrimaryTrackFinalTime(G4double time);

void ProposePrimaryTrackFinalProperTime(G4double properTime);
```

**Purpose**: Modify the primary particle's position and/or timing.

**Parameters**:
- `position`: New position vector
- `localCoordinates`: `true` = envelope coords (default), `false` = global coords
- `time`: New global time
- `properTime`: New proper time

**When to Use**:
- Moving particle to shower maximum
- Advancing time for parameterized propagation
- Rare - usually combined with energy/direction changes

**Example**:
```cpp
// Move primary to shower maximum position
G4ThreeVector showerMax = localPos + 5.0*X0 * localDir;
fastStep.ProposePrimaryTrackFinalPosition(showerMax, true);  // local coords

// Advance time for distance traveled
G4double travelTime = 5.0*X0 / (c_light * beta);
fastStep.ProposePrimaryTrackFinalTime(globalTime + travelTime);
```

### Energy and Momentum

**Lines 134-135, 143, 150-151** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void ProposePrimaryTrackFinalMomentumDirection(
    const G4ThreeVector& direction,
    G4bool localCoordinates = true);

void ProposePrimaryTrackFinalKineticEnergy(G4double energy);

void ProposePrimaryTrackFinalKineticEnergyAndDirection(
    G4double energy,
    const G4ThreeVector& direction,
    G4bool localCoordinates = true);
```

**Purpose**: Modify primary particle energy and/or direction.

**When to Use**:
- Parameterizing energy loss without killing particle
- Deflecting particle for simplified multiple scattering
- Leaving some energy for downstream detectors

**Example - Partial Absorption**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    const G4Track* track = fastTrack.GetPrimaryTrack();
    G4double initialEnergy = track->GetKineticEnergy();

    // Parameterize partial shower - absorb 80% of energy
    G4double absorbedEnergy = 0.8 * initialEnergy;
    G4double remainingEnergy = 0.2 * initialEnergy;

    // Reduce primary energy (don't kill)
    fastStep.ProposePrimaryTrackFinalKineticEnergy(remainingEnergy);

    // Record energy deposition
    fastStep.ProposeTotalEnergyDeposited(absorbedEnergy);

    // Generate hits for absorbed energy...
}
```

**Example - Energy and Direction**:
```cpp
// Modify both energy and direction atomically
G4double newEnergy = 0.5 * oldEnergy;
G4ThreeVector newDirection = // scattered direction
fastStep.ProposePrimaryTrackFinalKineticEnergyAndDirection(
    newEnergy, newDirection, true);  // local coordinates
```

### Polarization and Path Length

**Lines 160, 167** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void ProposePrimaryTrackFinalPolarization(
    const G4ThreeVector& polarization,
    G4bool localCoordinates = true);

void ProposePrimaryTrackPathLength(G4double length);
```

**Purpose**: Set polarization vector or true path length.

**When to Use**: Rare - only for specialized physics requiring polarization tracking or precise path length.

### Event Biasing Weight

**Lines 175** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void ProposePrimaryTrackFinalEventBiasingWeight(G4double weight);
```

**Purpose**: Modify track weight for variance reduction techniques.

**When to Use**: When fast simulation is combined with biasing mechanisms.

## Secondary Particle Creation

### SetNumberOfSecondaryTracks

**Lines 199** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void SetNumberOfSecondaryTracks(G4int nSecondaries);
```

**Purpose**: Declare total number of secondary particles you will create.

**Important**: Must be called BEFORE creating any secondaries.

**Example**:
```cpp
// Step 1: Declare count
fastStep.SetNumberOfSecondaryTracks(3);

// Step 2: Create each secondary (see below)
```

### CreateSecondaryTrack

**Lines 217-218, 224-225** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
G4Track* CreateSecondaryTrack(const G4DynamicParticle& particle,
                               G4ThreeVector polarization,
                               G4ThreeVector position,
                               G4double time,
                               G4bool localCoordinates = true);

G4Track* CreateSecondaryTrack(const G4DynamicParticle& particle,
                               G4ThreeVector position,
                               G4double time,
                               G4bool localCoordinates = true);
```

**Purpose**: Create a secondary particle.

**Parameters**:
- `particle`: `G4DynamicParticle` defining type, energy, momentum
- `polarization`: Polarization vector (first overload only)
- `position`: Birth position
- `time`: Birth time (usually primary's time)
- `localCoordinates`: `true` = envelope coords, `false` = global

**Return**: Pointer to created `G4Track` (managed by framework)

**Complete Example**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Kill primary
    fastStep.KillPrimaryTrack();

    G4double primaryEnergy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4double time = fastTrack.GetPrimaryTrack()->GetGlobalTime();

    // Create 3 secondary photons exiting the envelope
    G4int nPhotons = 3;
    fastStep.SetNumberOfSecondaryTracks(nPhotons);

    for (int i = 0; i < nPhotons; ++i) {
        // Each photon carries 1/3 of energy
        G4double photonEnergy = primaryEnergy / 3.0;

        // Random direction
        G4double cosTheta = 2.0*G4UniformRand() - 1.0;
        G4double sinTheta = std::sqrt(1.0 - cosTheta*cosTheta);
        G4double phi = CLHEP::twopi * G4UniformRand();

        G4ThreeVector direction(sinTheta*std::cos(phi),
                                 sinTheta*std::sin(phi),
                                 cosTheta);

        // Create dynamic particle
        G4DynamicParticle photon(G4Gamma::Definition(),
                                  direction, photonEnergy);

        // Create track (returns pointer - don't delete!)
        fastStep.CreateSecondaryTrack(photon, localPos, time,
                                       true);  // local coordinates
    }

    fastStep.ProposeTotalEnergyDeposited(0);  // All energy in secondaries
}
```

**Creating Different Particle Types**:
```cpp
// Electron
G4DynamicParticle electron(G4Electron::Definition(), momentum, energy);
fastStep.CreateSecondaryTrack(electron, position, time);

// Photon
G4DynamicParticle photon(G4Gamma::Definition(), direction, energy);
fastStep.CreateSecondaryTrack(photon, position, time);

// Neutron
G4DynamicParticle neutron(G4Neutron::Definition(), momentum, energy);
fastStep.CreateSecondaryTrack(neutron, position, time);

// Any particle
const G4ParticleDefinition* particleType = // lookup
G4DynamicParticle particle(particleType, momentum, energy);
fastStep.CreateSecondaryTrack(particle, position, time);
```

### GetNumberOfSecondaryTracks

**Lines 205** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
G4int GetNumberOfSecondaryTracks();
```

**Purpose**: Returns number of secondaries actually created (incremented by each `CreateSecondaryTrack` call).

**Example**:
```cpp
fastStep.SetNumberOfSecondaryTracks(5);

for (int i = 0; i < 5; ++i) {
    // Create secondary...
    fastStep.CreateSecondaryTrack(particle, pos, time);
}

// Verify count
G4int nCreated = fastStep.GetNumberOfSecondaryTracks();
assert(nCreated == 5);
```

### GetSecondaryTrack

**Lines 228** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
G4Track* GetSecondaryTrack(G4int index);
```

**Purpose**: Access the i-th created secondary track.

**Parameters**:
- `index`: Zero-based index (0 to n-1)

**Return**: Pointer to secondary track

**Usage**:
```cpp
// After creating secondaries
for (int i = 0; i < fastStep.GetNumberOfSecondaryTracks(); ++i) {
    G4Track* secondary = fastStep.GetSecondaryTrack(i);

    // Access secondary properties
    G4double secEnergy = secondary->GetKineticEnergy();
    G4ThreeVector secMomentum = secondary->GetMomentum();
    const G4ParticleDefinition* secType = secondary->GetParticleDefinition();
}
```

## Energy Deposition

### ProposeTotalEnergyDeposited

**Lines 242** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void ProposeTotalEnergyDeposited(G4double energy);
```

**Purpose**: Set total energy deposited in the envelope during this parameterization.

**Usage**: Record non-ionizing energy loss, energy absorbed by detector, etc.

**Example**:
```cpp
// Case 1: All energy absorbed
fastStep.KillPrimaryTrack();
fastStep.ProposeTotalEnergyDeposited(primaryEnergy);

// Case 2: Partial absorption
fastStep.ProposePrimaryTrackFinalKineticEnergy(remainingEnergy);
fastStep.ProposeTotalEnergyDeposited(absorbedEnergy);

// Case 3: Energy to secondaries
fastStep.KillPrimaryTrack();
G4double secondaryEnergy = CreateSecondaries(fastStep);
G4double deposited = primaryEnergy - secondaryEnergy;
fastStep.ProposeTotalEnergyDeposited(deposited);
```

**Energy Conservation**:
```
E_primary = E_deposited + Σ(E_secondaries) + E_primary_final
```

### GetTotalEnergyDeposited

**Lines 250** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
G4double GetTotalEnergyDeposited() const;
```

**Purpose**: Query the energy deposition value.

**Example**:
```cpp
G4double deposited = fastStep.GetTotalEnergyDeposited();
G4cout << "Energy deposited: " << deposited/MeV << " MeV" << G4endl;
```

## Stepping Control

### ForceSteppingHitInvocation

**Lines 264** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void ForceSteppingHitInvocation();
```

**Purpose**: Request that `G4SteppingManager` invoke the sensitive detector's `ProcessHits` method even though fast simulation was used.

**Default Behavior**: SD's `ProcessHits` is NOT called during fast simulation.

**When to Use**:
- Your model creates a meaningful `G4Step` (modifies primary without killing)
- You want standard hit processing in addition to fast sim
- Hybrid simulation mode

**Example**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Don't kill primary - just modify it
    G4double energyLoss = CalculateIonizationLoss();
    G4double newEnergy = primaryEnergy - energyLoss;

    fastStep.ProposePrimaryTrackFinalKineticEnergy(newEnergy);
    fastStep.ProposeTotalEnergyDeposited(energyLoss);

    // Ask tracking to invoke SD's ProcessHits with this step
    fastStep.ForceSteppingHitInvocation();
}
```

::: warning Rare Usage
Most fast simulation models create hits directly using `G4FastSimHitMaker` and do NOT call this method. Use only when you specifically want the standard `G4Step`-based hit processing.
:::

## Coordinate System Control

All position and direction methods accept a `localCoordinates` boolean parameter:

**Lines 110, 134-135, 150-151, 160, 217-218, 224-225**

```cpp
void ProposePrimaryTrackFinalPosition(const G4ThreeVector& position,
                                       G4bool localCoordinates = true);

void ProposePrimaryTrackFinalMomentumDirection(const G4ThreeVector& direction,
                                                G4bool localCoordinates = true);

G4Track* CreateSecondaryTrack(const G4DynamicParticle& particle,
                               G4ThreeVector position,
                               G4double time,
                               G4bool localCoordinates = true);
```

**Default**: `localCoordinates = true` (envelope coordinate system)

**When to use `false`**:
- Working with global detector coordinates
- Position/direction already in global frame
- Interfacing with external code using global coords

**Example - Local (Default)**:
```cpp
// Position in envelope local coordinates (convenient for most models)
G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
G4ThreeVector newLocalPos = localPos + 10*cm * localDir;

fastStep.ProposePrimaryTrackFinalPosition(newLocalPos, true);  // or omit
```

**Example - Global**:
```cpp
// Position in world coordinates (rare)
G4ThreeVector globalPos = fastTrack.GetPrimaryTrack()->GetPosition();
G4ThreeVector newGlobalPos = globalPos + 10*cm * globalDir;

fastStep.ProposePrimaryTrackFinalPosition(newGlobalPos, false);  // global
```

::: tip Prefer Local Coordinates
Most fast simulation models work entirely in local coordinates. The framework handles coordinate transformations automatically, simplifying your code and reducing errors.
:::

## Common Patterns

### Pattern 1: Complete Shower Absorption

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Kill primary particle
    fastStep.KillPrimaryTrack();

    // Record all energy deposited
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    fastStep.ProposeTotalEnergyDeposited(energy);

    // Create parameterized hits
    G4FastSimHitMaker hitMaker;
    auto hits = GenerateShower(energy);
    for (const auto& hit : hits) {
        hitMaker.make(hit, fastTrack);
    }
}
```

### Pattern 2: Partial Shower with Exit Particle

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4double initialEnergy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();

    // Parameterize shower, some energy escapes
    G4double containedFraction = 0.7;
    G4double depositedEnergy = containedFraction * initialEnergy;
    G4double exitEnergy = (1.0 - containedFraction) * initialEnergy;

    // Reduce primary energy (don't kill)
    fastStep.ProposePrimaryTrackFinalKineticEnergy(exitEnergy);

    // Move to exit point
    G4ThreeVector exitPos = CalculateExitPosition();
    fastStep.ProposePrimaryTrackFinalPosition(exitPos, true);

    // Record deposition
    fastStep.ProposeTotalEnergyDeposited(depositedEnergy);

    // Create hits for deposited energy
    // ...
}
```

### Pattern 3: Complete Parameterization with Secondaries

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4double primaryEnergy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();

    // Kill primary
    fastStep.KillPrimaryTrack();

    // Create representative secondaries for downstream detectors
    G4int nSecondaries = 5;
    fastStep.SetNumberOfSecondaryTracks(nSecondaries);

    G4double secondaryEnergy = 0;
    for (int i = 0; i < nSecondaries; ++i) {
        G4double energy = primaryEnergy / nSecondaries;
        secondaryEnergy += energy;

        // Create secondary...
        fastStep.CreateSecondaryTrack(particle, position, time);
    }

    // Energy balance
    G4double deposited = primaryEnergy - secondaryEnergy;
    fastStep.ProposeTotalEnergyDeposited(deposited);

    // Create hits
    // ...
}
```

### Pattern 4: Hadronic Shower with Neutrons

```cpp
void MyHadronicModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4double hadronEnergy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();

    fastStep.KillPrimaryTrack();

    // Hadronic shower: 30% goes to neutrons, 70% visible energy
    G4double visibleEnergy = 0.7 * hadronEnergy;
    G4double neutronEnergy = 0.3 * hadronEnergy;

    // Create neutrons escaping the calorimeter
    G4int nNeutrons = static_cast<G4int>(neutronEnergy / (10*MeV));
    fastStep.SetNumberOfSecondaryTracks(nNeutrons);

    for (int i = 0; i < nNeutrons; ++i) {
        G4double E_n = 10*MeV;  // Simplified
        G4ThreeVector direction = SampleIsotropicDirection();

        G4DynamicParticle neutron(G4Neutron::Definition(),
                                   direction, E_n);

        fastStep.CreateSecondaryTrack(neutron,
            fastTrack.GetPrimaryTrackLocalPosition(),
            fastTrack.GetPrimaryTrack()->GetGlobalTime());
    }

    // Deposit visible energy as hits
    fastStep.ProposeTotalEnergyDeposited(visibleEnergy);

    // Create hadronic shower hits...
}
```

## Energy Conservation Check

Always verify energy conservation in your implementation:

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4double E_in = fastTrack.GetPrimaryTrack()->GetKineticEnergy();

    // Your parameterization...
    // ...

    // Verify energy balance
    G4double E_deposited = fastStep.GetTotalEnergyDeposited();
    G4double E_secondaries = 0;
    for (int i = 0; i < fastStep.GetNumberOfSecondaryTracks(); ++i) {
        E_secondaries += fastStep.GetSecondaryTrack(i)->GetKineticEnergy();
    }
    G4double E_primary_final = 0;
    // (if primary not killed, add its final energy)

    G4double E_out = E_deposited + E_secondaries + E_primary_final;
    G4double balance = std::abs(E_in - E_out) / E_in;

    if (balance > 0.01) {  // 1% tolerance
        G4cerr << "WARNING: Energy not conserved!" << G4endl;
        G4cerr << "  Input: " << E_in/GeV << " GeV" << G4endl;
        G4cerr << "  Output: " << E_out/GeV << " GeV" << G4endl;
        G4cerr << "  Imbalance: " << balance*100 << "%" << G4endl;
    }
}
```

## Deprecated Methods

The class includes deprecated `SetXXX` methods for backward compatibility. Always use the newer `ProposeXXX` versions:

**Lines 113-114, 120-121, 127-128, 139-140, 146-147, 155-157, 163-164, 171-172, 178-179, 246-247**

```cpp
// DEPRECATED - use ProposePrimaryTrackFinalPosition instead
[[deprecated]] void SetPrimaryTrackFinalPosition(...);

// DEPRECATED - use ProposePrimaryTrackFinalKineticEnergy instead
[[deprecated]] void SetPrimaryTrackFinalKineticEnergy(...);

// etc...
```

## Stepping Interface (Advanced)

These methods implement the `G4VParticleChange` interface and are called by tracking:

**Lines 277-278, 286** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
G4Step* UpdateStepForAtRest(G4Step* step) override;
G4Step* UpdateStepForPostStep(G4Step* step) override;
void Initialize(const G4FastTrack& fastTrack);
```

::: warning Internal Use
These methods are called by the fast simulation framework. Users should not call them directly. They translate your `G4FastStep` modifications into tracking system updates.
:::

## Debug Methods

**Lines 289-290** in `source/processes/parameterisation/include/G4FastStep.hh`

```cpp
void DumpInfo() const override;
G4bool CheckIt(const G4Track& track) override;
```

**Purpose**: Print debug information and perform consistency checks.

**Usage**:
```cpp
// In your model for debugging
fastStep.DumpInfo();  // Print all final state information

// Validation
if (!fastStep.CheckIt(*track)) {
    G4cerr << "FastStep consistency check failed!" << G4endl;
}
```

## Best Practices

1. **Always Kill or Modify**: Either kill the primary OR modify its final state, never leave it unchanged
   ```cpp
   // GOOD: Kill
   fastStep.KillPrimaryTrack();

   // GOOD: Modify
   fastStep.ProposePrimaryTrackFinalKineticEnergy(newEnergy);

   // BAD: Do nothing (wastes time)
   ```

2. **Declare Secondaries Before Creating**:
   ```cpp
   fastStep.SetNumberOfSecondaryTracks(n);  // MUST call first
   for (int i = 0; i < n; ++i) {
       fastStep.CreateSecondaryTrack(...);
   }
   ```

3. **Use Local Coordinates**: Simpler and less error-prone

4. **Verify Energy Conservation**: Especially during development

5. **Don't Mix Detailed and Fast**: Either fully parameterize OR continue tracking, not both

## Related Classes

- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Uses `G4FastStep` for output
- [G4FastTrack](G4FastTrack.md) - Companion input class
- [G4FastSimHitMaker](G4FastSimHitMaker.md) - Creates hits (alternative to secondaries)
- [G4FastSimulationManager](G4FastSimulationManager.md) - Manages `G4FastStep`
- `G4VParticleChange` - Base class interface

## References

- Main overview: [Parameterisation Module](../index.md)
- Example: `examples/extended/parameterisations/Par03/`
- History: Lines 50-58 in header (first implementation Oct 97)
