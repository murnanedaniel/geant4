# G4FastSimHitMaker

## Overview

`G4FastSimHitMaker` is a helper class that simplifies hit creation in fast simulation models. It automatically locates the appropriate sensitive detector for a given position, creates a temporary `G4Step`-like structure, and invokes the sensitive detector's hit processing method. This class bridges the gap between parameterized energy deposits and the standard Geant4 hit framework.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastSimHitMaker.hh`
**Source:** `source/processes/parameterisation/src/G4FastSimHitMaker.cc`
**Type:** Helper/Utility Class
:::

## Purpose

`G4FastSimHitMaker` provides:
- **Automatic SD lookup**: Finds sensitive detector at given position
- **Coordinate transformation**: Handles global/local coordinate systems
- **Touchable creation**: Builds geometry touchable for hit
- **Hit deposition**: Calls SD's `ProcessHits` method
- **Parallel world support**: Works with ghost geometries
- **Simplified interface**: Reduces boilerplate in fast sim models

## Class Definition

**Lines 50-82** in `source/processes/parameterisation/include/G4FastSimHitMaker.hh`

```cpp
class G4FastSimHitMaker
{
  public:
    G4FastSimHitMaker();
    ~G4FastSimHitMaker();

    // Deposit energy at given position
    void make(const G4FastHit& hit, const G4FastTrack& track);

    // Specify parallel world for SD lookup (optional)
    void SetNameOfWorldWithSD(const G4String& worldName);

    // Associate with process (optional)
    void SetProcess(G4VProcess* process);

  private:
    G4TouchableHandle fTouchableHandle;
    G4Navigator* fpNavigator;
    G4bool fNaviSetup;
    G4String fWorldWithSdName;
    G4Step* fpSpotS;
    G4StepPoint* fpSpotP;
    G4VProcess* fpProcess;
};
```

## Constructor and Destructor

**Lines 53-54**

```cpp
G4FastSimHitMaker();
~G4FastSimHitMaker();
```

**Constructor**: Initializes internal state, allocates temporary step/point objects.

**Destructor**: Cleans up allocated objects.

**Usage**:
```cpp
// Create once per DoIt call (or as member variable)
G4FastSimHitMaker hitMaker;

// Use it multiple times
for (const auto& spot : showerSpots) {
    G4FastHit hit(spot.position, spot.energy);
    hitMaker.make(hit, fastTrack);
}
```

::: tip Creation Strategy
You can either:
1. **Create per-use**: `G4FastSimHitMaker hitMaker;` in `DoIt` method
2. **Member variable**: Store as class member for reuse

Both work fine. Member variable avoids repeated allocation but requires careful initialization.
:::

## Main Method

### make

**Lines 56-60** in `source/processes/parameterisation/include/G4FastSimHitMaker.hh`

```cpp
void make(const G4FastHit& hit, const G4FastTrack& track);
```

**Purpose**: Deposit energy at a specified position by invoking the sensitive detector.

**Parameters**:
- `hit`: `G4FastHit` containing position and energy
- `track`: `G4FastTrack` providing track and envelope information

**Process**:
1. Locate the volume at hit position (using navigator)
2. Find sensitive detector attached to that volume
3. Build touchable with geometry hierarchy
4. Create temporary `G4Step` and `G4StepPoint`
5. Call SD's `ProcessHits` method (via `G4VFastSimSensitiveDetector` interface)
6. Energy deposit is handled by your SD implementation

**Example**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Create hit maker
    G4FastSimHitMaker hitMaker;

    // Generate shower profile
    std::vector<ShowerSpot> spots = GenerateShower(...);

    // Deposit each spot
    for (const auto& spot : spots) {
        // Create hit (position in local coordinates)
        G4FastHit hit(spot.position, spot.energy);

        // Deposit it
        hitMaker.make(hit, fastTrack);
    }
}
```

## Configuration Methods

### SetNameOfWorldWithSD

**Lines 61-65** in `source/processes/parameterisation/include/G4FastSimHitMaker.hh`

```cpp
void SetNameOfWorldWithSD(const G4String& worldName);
```

**Purpose**: Specify parallel world name if sensitive detectors are in a ghost geometry.

**When to Use**: If your sensitive detectors are defined in a parallel world (not the mass geometry).

**Example**:
```cpp
G4FastSimHitMaker hitMaker;

// Sensitive detectors are in parallel world
hitMaker.SetNameOfWorldWithSD("ReadoutWorld");

// Now hit creation will search in parallel world
G4FastHit hit(position, energy);
hitMaker.make(hit, fastTrack);
```

**Default Behavior**: If not called, searches in mass geometry (default world).

### SetProcess

**Lines 66** in `source/processes/parameterisation/include/G4FastSimHitMaker.hh`

```cpp
void SetProcess(G4VProcess* process);
```

**Purpose**: Associate a process with the created hits (optional, for bookkeeping).

**When to Use**: If you want hits to record which process created them.

**Example**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4FastSimHitMaker hitMaker;

    // Associate with a process (optional)
    G4VProcess* myProcess = // get process pointer
    hitMaker.SetProcess(myProcess);

    // Hits will now reference this process
    // ...
}
```

**Typical Use**: Rare - usually not needed for standard hit processing.

## Complete Usage Examples

### Example 1: Simple EM Shower

```cpp
void MyEMShowerModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    // Get input
    const G4Track* track = fastTrack.GetPrimaryTrack();
    G4double energy = track->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    // Kill primary
    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(energy);

    // Create hit maker
    G4FastSimHitMaker hitMaker;

    // Generate longitudinal shower profile
    G4int nSpots = 20;
    G4double X0 = 1.4*CLHEP::cm;  // radiation length

    for (int i = 0; i < nSpots; ++i) {
        // Depth in radiation lengths
        G4double t = i * 0.5;

        // Shower shape (simplified Gamma distribution)
        G4double shape = std::pow(t, 2.0) * std::exp(-t);

        // Energy for this spot
        G4double spotEnergy = energy * shape * 0.5;

        // Position (in local coordinates)
        G4ThreeVector spotPosition = localPos + (t * X0) * localDir;

        // Create and deposit hit
        G4FastHit hit(spotPosition, spotEnergy);
        hitMaker.make(hit, fastTrack);
    }
}
```

### Example 2: Shower with Transverse Spread

```cpp
void MyShowerModel::DoIt(const G4FastTrack& fastTrack,
                          G4FastStep& fastStep)
{
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(energy);

    G4FastSimHitMaker hitMaker;

    // Shower parameters
    G4double X0 = 1.4*CLHEP::cm;
    G4double moliereRadius = 2.0*CLHEP::cm;
    G4int nSpots = 30;

    // Create perpendicular directions for transverse spread
    G4ThreeVector perp1 = localDir.orthogonal().unit();
    G4ThreeVector perp2 = localDir.cross(perp1).unit();

    for (int i = 0; i < nSpots; ++i) {
        // Longitudinal position
        G4double depth = i * 0.5 * X0;

        // Shower shape
        G4double shape = /* shower profile */;
        G4double spotEnergy = energy * shape;

        // Transverse position (radial sampling)
        G4double r = moliereRadius * std::sqrt(G4UniformRand());
        G4double phi = CLHEP::twopi * G4UniformRand();

        // 3D position
        G4ThreeVector spotPosition = localPos + depth * localDir +
                                      r * (std::cos(phi)*perp1 +
                                           std::sin(phi)*perp2);

        // Deposit hit
        G4FastHit hit(spotPosition, spotEnergy);
        hitMaker.make(hit, fastTrack);
    }
}
```

### Example 3: Hits in Sampling Calorimeter

```cpp
void MySamplingCaloModel::DoIt(const G4FastTrack& fastTrack,
                                G4FastStep& fastStep)
{
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(energy);

    G4FastSimHitMaker hitMaker;

    // Sampling calorimeter structure
    G4double absorberThickness = 2.0*CLHEP::cm;
    G4double activeThickness = 0.5*CLHEP::cm;
    G4double layerThickness = absorberThickness + activeThickness;
    G4int nLayers = 20;

    // Only visible energy in active layers
    G4double visibleFraction = 0.75;  // 75% sampling fraction

    for (int layer = 0; layer < nLayers; ++layer) {
        // Position in center of active layer
        G4double depth = layer * layerThickness + absorberThickness + 0.5*activeThickness;

        // Shower profile
        G4double shape = /* longitudinal profile at this depth */;
        G4double layerEnergy = energy * visibleFraction * shape;

        // Position in active layer
        G4ThreeVector hitPosition = localPos + depth * localDir;

        // Deposit only in active material
        G4FastHit hit(hitPosition, layerEnergy);
        hitMaker.make(hit, fastTrack);
    }
}
```

### Example 4: Parallel World SD

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Setup hit maker for parallel world
    G4FastSimHitMaker hitMaker;
    hitMaker.SetNameOfWorldWithSD("ReadoutWorld");

    // Generate hits as usual
    // They will be deposited in parallel world sensitive detectors
    for (const auto& spot : GenerateShower(...)) {
        G4FastHit hit(spot.position, spot.energy);
        hitMaker.make(hit, fastTrack);
    }
}
```

## Coordinate System Handling

**Important**: `G4FastHit` positions are in **global coordinates** by default when passed to `hitMaker.make()`.

However, if you create hits in local coordinates (envelope frame), they are automatically transformed to global coordinates internally before SD processing.

**Example**:
```cpp
// Positions in local coordinates (envelope frame)
G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
G4ThreeVector spotLocalPos = localPos + 10*cm * localDir;

// Create hit with local position
G4FastHit hit(spotLocalPos, energy);

// HitMaker handles coordinate transformation internally
hitMaker.make(hit, fastTrack);

// Sensitive detector receives position in appropriate coordinate system
```

## Sensitive Detector Requirements

For hit creation to work, your sensitive detector must:

1. **Inherit from both base classes**:
   ```cpp
   class MySensitiveDetector : public G4VSensitiveDetector,
                                public G4VFastSimSensitiveDetector
   ```

2. **Implement both ProcessHits methods**:
   ```cpp
   // For detailed simulation (G4Step)
   G4bool ProcessHits(G4Step* step, G4TouchableHistory* history) override;

   // For fast simulation (G4FastHit)
   G4bool ProcessHits(const G4FastHit* hit,
                      const G4FastTrack* track,
                      G4TouchableHistory* history) override;
   ```

See [G4VFastSimSensitiveDetector](G4VFastSimSensitiveDetector.md) for details.

## Performance Considerations

### Efficiency

- Navigator lookup is cached between calls
- Touchable creation is optimized
- Minimal overhead per hit

**Typical Cost**: ~10-50 ns per hit (depending on geometry complexity)

### Best Practices

1. **Reuse HitMaker**: Create once, use multiple times
   ```cpp
   G4FastSimHitMaker hitMaker;  // Create once
   for (...) {
       hitMaker.make(hit, fastTrack);  // Reuse
   }
   ```

2. **Batch Hits**: Generate all hits then deposit (already optimal pattern)

3. **Member Variable** (optional optimization):
   ```cpp
   class MyModel : public G4VFastSimulationModel {
   private:
       G4FastSimHitMaker fHitMaker;  // Member variable
   };

   // In DoIt:
   fHitMaker.make(hit, fastTrack);  // No allocation per call
   ```

## Error Handling

**No Sensitive Detector Found**:
- If no SD exists at hit position, `make()` silently does nothing
- No error or warning is issued
- This is expected behavior (e.g., hits outside active volumes)

**Debugging**:
```cpp
// Add verbose output in your SD
G4bool MySensitiveDetector::ProcessHits(const G4FastHit* hit, ...)
{
    G4cout << "FastHit received: E = " << hit->GetEnergy()/MeV
           << " MeV at " << hit->GetPosition() << G4endl;

    // Your hit processing...
    return true;
}
```

## Common Issues

**Issue**: Hits not created

**Solutions**:
1. Verify SD attached to volume:
   ```cpp
   G4LogicalVolume* logVol = // your volume
   G4VSensitiveDetector* sd = logVol->GetSensitiveDetector();
   if (sd == nullptr) {
       G4cerr << "No SD attached!" << G4endl;
   }
   ```

2. Check SD inherits from `G4VFastSimSensitiveDetector`

3. Verify hit positions are inside sensitive volumes

4. Add debug output in SD's `ProcessHits(const G4FastHit*, ...)`

**Issue**: Hits in wrong detector

**Solution**: Check coordinate transformation - ensure positions are correct relative to detector geometry

**Issue**: Parallel world hits not working

**Solution**: Call `SetNameOfWorldWithSD("ParallelWorldName")`

## Integration Example

### Complete Model with Hit Creation

```cpp
// Header
class MyEMShowerModel : public G4VFastSimulationModel
{
public:
    MyEMShowerModel(const G4String& name, G4Envelope* envelope);

    G4bool IsApplicable(const G4ParticleDefinition& particle) override;
    G4bool ModelTrigger(const G4FastTrack& fastTrack) override;
    void DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep) override;

private:
    struct ShowerSpot {
        G4ThreeVector position;
        G4double energy;
    };

    std::vector<ShowerSpot> GenerateShower(G4double energy,
                                            const G4ThreeVector& position,
                                            const G4ThreeVector& direction);

    G4double fRadiationLength;
    G4double fMoliereRadius;
};

// Source
void MyEMShowerModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    // Get primary info
    const G4Track* track = fastTrack.GetPrimaryTrack();
    G4double energy = track->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    // Kill primary
    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(energy);

    // Generate shower
    auto spots = GenerateShower(energy, localPos, localDir);

    // Create hit maker
    G4FastSimHitMaker hitMaker;

    // Deposit all hits
    for (const auto& spot : spots) {
        G4FastHit hit(spot.position, spot.energy);
        hitMaker.make(hit, fastTrack);
    }
}
```

## Best Practices Summary

1. Create `G4FastSimHitMaker` once per `DoIt` call
2. Reuse for all hits in that shower
3. Work in local coordinates, let framework handle transforms
4. Ensure SD inherits from `G4VFastSimSensitiveDetector`
5. Use `SetNameOfWorldWithSD` only if needed (parallel geometry)
6. Add debug output in SD during development
7. Verify energy conservation (sum of hit energies ≈ input energy)

## Related Classes

- [G4FastHit](G4FastHit.md) - Hit structure used by this class
- [G4VFastSimSensitiveDetector](G4VFastSimSensitiveDetector.md) - SD interface required
- [G4FastTrack](G4FastTrack.md) - Provides context for hit creation
- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Models that use this class

## References

- Main overview: [Parameterisation Module](../index.md)
- Example: `examples/extended/parameterisations/Par03/`
- Documentation: Lines 38-48 in header (description)
