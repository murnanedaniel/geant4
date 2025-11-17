# G4FastHit

## Overview

`G4FastHit` is a minimal data structure representing an energy deposit in fast simulation. It contains only the essential information: position and energy. This lightweight class is used to communicate energy deposits from fast simulation models to sensitive detectors via `G4FastSimHitMaker`.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastHit.hh`
**Type:** Data Structure (POD-like)
**Size:** Small (G4ThreeVector + G4double ≈ 32 bytes)
:::

## Purpose

`G4FastHit` provides:
- **Minimal hit representation**: Position + energy only
- **Efficient storage**: Lightweight for large numbers of shower spots
- **Simple interface**: Easy to create and manipulate
- **Framework integration**: Works with `G4FastSimHitMaker` and `G4VFastSimSensitiveDetector`
- **Flexible usage**: Can represent any type of energy deposit

## Class Definition

**Lines 47-70** in `source/processes/parameterisation/include/G4FastHit.hh`

```cpp
class G4FastHit
{
  public:
    G4FastHit() = default;
    G4FastHit(const G4ThreeVector& position, G4double energy);
    virtual ~G4FastHit() = default;

    // Set energy
    void SetEnergy(const G4double& energy);

    // Get energy
    G4double GetEnergy() const;

    // Set position
    void SetPosition(const G4ThreeVector& position);

    // Get position
    G4ThreeVector GetPosition() const;

  private:
    G4double fEnergy = 0;
    G4ThreeVector fPosition = G4ThreeVector();
};
```

## Constructors

### Default Constructor

**Lines 50** in `source/processes/parameterisation/include/G4FastHit.hh`

```cpp
G4FastHit() = default;
```

**Purpose**: Create hit with zero energy at origin.

**Usage**:
```cpp
G4FastHit hit;  // Energy = 0, Position = (0,0,0)

// Set values later
hit.SetEnergy(10*MeV);
hit.SetPosition(G4ThreeVector(1*cm, 2*cm, 3*cm));
```

### Parameterized Constructor

**Lines 51** in `source/processes/parameterisation/include/G4FastHit.hh`

```cpp
G4FastHit(const G4ThreeVector& position, G4double energy);
```

**Purpose**: Create hit with specified position and energy.

**Parameters**:
- `position`: 3D position vector (global or local coordinates depending on context)
- `energy`: Energy deposited at this position

**Usage** (most common):
```cpp
// Create hit directly
G4ThreeVector position(10*cm, 5*cm, 20*cm);
G4double energy = 100*MeV;
G4FastHit hit(position, energy);
```

## Methods

### Energy Access

**Lines 57, 59** in `source/processes/parameterisation/include/G4FastHit.hh`

```cpp
void SetEnergy(const G4double& energy);
G4double GetEnergy() const;
```

**Purpose**: Set or get the energy value.

**Example**:
```cpp
G4FastHit hit;
hit.SetEnergy(50*MeV);

G4double E = hit.GetEnergy();  // Returns 50*MeV
```

### Position Access

**Lines 61, 63** in `source/processes/parameterisation/include/G4FastHit.hh`

```cpp
void SetPosition(const G4ThreeVector& position);
G4ThreeVector GetPosition() const;
```

**Purpose**: Set or get the position vector.

**Example**:
```cpp
G4FastHit hit;
hit.SetPosition(G4ThreeVector(1*m, 0, 0));

G4ThreeVector pos = hit.GetPosition();  // Returns (1m, 0, 0)
```

## Usage Patterns

### Pattern 1: Create and Deposit Immediately

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4FastSimHitMaker hitMaker;

    // Create and deposit hits inline
    for (int i = 0; i < nSpots; ++i) {
        G4ThreeVector spotPosition = CalculatePosition(i);
        G4double spotEnergy = CalculateEnergy(i);

        // Create and deposit in one flow
        G4FastHit hit(spotPosition, spotEnergy);
        hitMaker.make(hit, fastTrack);
    }
}
```

### Pattern 2: Accumulate Then Deposit

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Generate all hits first
    std::vector<G4FastHit> hits;

    for (int i = 0; i < nSpots; ++i) {
        G4ThreeVector pos = CalculatePosition(i);
        G4double energy = CalculateEnergy(i);

        hits.emplace_back(pos, energy);  // Use constructor
    }

    // Deposit all hits
    G4FastSimHitMaker hitMaker;
    for (const auto& hit : hits) {
        hitMaker.make(hit, fastTrack);
    }
}
```

### Pattern 3: Modify Before Depositing

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4FastSimHitMaker hitMaker;

    for (int i = 0; i < nSpots; ++i) {
        // Create with initial values
        G4FastHit hit(initialPosition, initialEnergy);

        // Apply corrections
        hit.SetEnergy(hit.GetEnergy() * correctionFactor);
        hit.SetPosition(hit.GetPosition() + offset);

        // Deposit corrected hit
        hitMaker.make(hit, fastTrack);
    }
}
```

### Pattern 4: Store Hits in Container

```cpp
class MyModel : public G4VFastSimulationModel
{
private:
    // Container for debugging or analysis
    std::vector<G4FastHit> fHitsThisEvent;

public:
    void DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep) override
    {
        G4FastSimHitMaker hitMaker;

        for (int i = 0; i < nSpots; ++i) {
            G4FastHit hit(position, energy);

            // Store for later analysis
            fHitsThisEvent.push_back(hit);

            // Also deposit to detector
            hitMaker.make(hit, fastTrack);
        }
    }

    void Flush() override
    {
        // Analyze or output hits
        G4cout << "Event had " << fHitsThisEvent.size() << " hits" << G4endl;

        // Clear for next event
        fHitsThisEvent.clear();
    }
};
```

## Complete Examples

### Example 1: EM Shower Spots

```cpp
void MyEMShowerModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    G4double totalEnergy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(totalEnergy);

    // Shower parameterization
    G4double X0 = 1.4*cm;
    G4int nSpots = 20;
    G4FastSimHitMaker hitMaker;

    for (int i = 0; i < nSpots; ++i) {
        // Calculate spot parameters
        G4double depth = i * 0.5 * X0;
        G4double shape = /* shower shape function */;
        G4double energy = totalEnergy * shape;
        G4ThreeVector position = localPos + depth * localDir;

        // Create and deposit hit
        G4FastHit hit(position, energy);
        hitMaker.make(hit, fastTrack);
    }
}
```

### Example 2: Hadronic Shower with Visible Energy

```cpp
void MyHadronicModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    G4double hadronEnergy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();

    fastStep.KillPrimaryTrack();

    // Hadronic shower: 70% visible, 30% invisible (neutrons, etc.)
    G4double visibleEnergy = 0.7 * hadronEnergy;

    G4FastSimHitMaker hitMaker;
    G4int nSpots = 50;

    // Apply sampling fluctuations
    G4double samplingResolution = 0.50 / std::sqrt(hadronEnergy/GeV);
    G4double fluctuation = G4RandGauss::shoot(1.0, samplingResolution);
    visibleEnergy *= fluctuation;

    for (int i = 0; i < nSpots; ++i) {
        G4ThreeVector spotPos = GenerateHadronicSpotPosition(i, localPos);
        G4double spotEnergy = visibleEnergy / nSpots;  // Simplified

        G4FastHit hit(spotPos, spotEnergy);
        hitMaker.make(hit, fastTrack);
    }

    fastStep.ProposeTotalEnergyDeposited(visibleEnergy);
}
```

### Example 3: Sampling Calorimeter

```cpp
void MySamplingModel::DoIt(const G4FastTrack& fastTrack,
                            G4FastStep& fastStep)
{
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    fastStep.KillPrimaryTrack();

    // Sampling structure
    G4int nLayers = 40;
    G4double layerThickness = 3.0*cm;
    G4double samplingFraction = 0.15;  // 15% visible

    G4FastSimHitMaker hitMaker;

    for (int layer = 0; layer < nLayers; ++layer) {
        G4double depth = (layer + 0.5) * layerThickness;

        // Longitudinal profile
        G4double relativeEnergy = LongitudinalProfile(depth);

        // Energy in this layer (only visible fraction)
        G4double layerEnergy = energy * samplingFraction * relativeEnergy;

        // Position in center of active layer
        G4ThreeVector layerPos = localPos + depth * localDir;

        // Create hit (only for active layers)
        G4FastHit hit(layerPos, layerEnergy);
        hitMaker.make(hit, fastTrack);
    }

    G4double totalVisible = energy * samplingFraction;
    fastStep.ProposeTotalEnergyDeposited(totalVisible);
}
```

### Example 4: Radial Shower Profile

```cpp
void MyShowerModel::CreateRadialHits(const G4FastTrack& fastTrack)
{
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    // Create perpendicular basis
    G4ThreeVector perp1 = localDir.orthogonal().unit();
    G4ThreeVector perp2 = localDir.cross(perp1).unit();

    G4FastSimHitMaker hitMaker;

    // Moliere radius
    G4double RM = 2.0*cm;

    // Create hits with radial distribution
    G4int nSpots = 30;

    for (int i = 0; i < nSpots; ++i) {
        // Longitudinal position
        G4double z = i * 1.0*cm;

        // Radial position (exponential distribution)
        G4double r = -RM * std::log(G4UniformRand());

        // Angular position
        G4double phi = CLHEP::twopi * G4UniformRand();

        // 3D position
        G4ThreeVector pos3D = localPos +
                              z * localDir +
                              r * (std::cos(phi)*perp1 + std::sin(phi)*perp2);

        // Energy (radial + longitudinal dependence)
        G4double spotEnergy = energy *
                              LongitudinalShape(z) *
                              RadialShape(r/RM) /
                              nSpots;

        // Create hit
        G4FastHit hit(pos3D, spotEnergy);
        hitMaker.make(hit, fastTrack);
    }
}
```

## Coordinate System

**Important**: The position stored in `G4FastHit` can be in either coordinate system:

- **Local coordinates** (envelope frame): When working in `DoIt` method
- **Global coordinates** (world frame): After transformation

The `G4FastSimHitMaker` handles coordinate transformations automatically based on context.

**Typical Usage**:
```cpp
// Work in local coordinates (simpler)
G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
G4ThreeVector spotLocalPos = localPos + 10*cm * localDir;

// Create hit in local coordinates
G4FastHit hit(spotLocalPos, energy);

// HitMaker transforms to appropriate coordinates for SD
hitMaker.make(hit, fastTrack);
```

## Energy Units

Always use Geant4 internal units when setting energy:

```cpp
// Correct - use unit constants
G4FastHit hit1(pos, 100*MeV);
G4FastHit hit2(pos, 1.5*GeV);
G4FastHit hit3(pos, 50*keV);

// Incorrect - missing units
G4FastHit badHit(pos, 100);  // What units? Probably wrong!
```

## Memory and Performance

### Size

Each `G4FastHit` is small:
- `G4double` (energy): 8 bytes
- `G4ThreeVector` (position): 3 × 8 = 24 bytes
- **Total**: ~32 bytes

### Performance

Creating and copying `G4FastHit` is very cheap:
- POD-like structure
- Trivial copying
- No dynamic allocation
- Cache-friendly size

**Typical Performance**:
- Creation: < 5 ns
- Copy: < 10 ns
- Deposit via `G4FastSimHitMaker`: ~10-50 ns (dominated by SD lookup)

### Best Practices

1. **Pass by const reference** when possible:
   ```cpp
   void ProcessHit(const G4FastHit& hit);  // Good
   void ProcessHit(G4FastHit hit);         // Okay (cheap to copy)
   ```

2. **Use emplace_back** for vectors:
   ```cpp
   std::vector<G4FastHit> hits;
   hits.emplace_back(position, energy);  // Construct in-place
   ```

3. **Reserve vector capacity** if size known:
   ```cpp
   std::vector<G4FastHit> hits;
   hits.reserve(nSpots);  // Avoid reallocations
   for (int i = 0; i < nSpots; ++i) {
       hits.emplace_back(pos, energy);
   }
   ```

## Validation and Debugging

### Energy Conservation Check

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    G4double inputEnergy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();

    std::vector<G4FastHit> hits = GenerateShower(inputEnergy);

    // Verify energy conservation
    G4double totalHitEnergy = 0;
    for (const auto& hit : hits) {
        totalHitEnergy += hit.GetEnergy();
    }

    G4double balance = std::abs(inputEnergy - totalHitEnergy) / inputEnergy;
    if (balance > 0.01) {  // 1% tolerance
        G4cerr << "WARNING: Energy not conserved!" << G4endl;
        G4cerr << "  Input: " << inputEnergy/GeV << " GeV" << G4endl;
        G4cerr << "  Output: " << totalHitEnergy/GeV << " GeV" << G4endl;
    }

    // Deposit hits
    G4FastSimHitMaker hitMaker;
    for (const auto& hit : hits) {
        hitMaker.make(hit, fastTrack);
    }
}
```

### Hit Distribution Visualization

```cpp
void MyModel::AnalyzeHits(const std::vector<G4FastHit>& hits)
{
    G4cout << "\nHit distribution:" << G4endl;
    G4cout << "  Total hits: " << hits.size() << G4endl;

    G4double totalEnergy = 0;
    G4ThreeVector centerOfEnergy(0, 0, 0);

    for (const auto& hit : hits) {
        G4double E = hit.GetEnergy();
        G4ThreeVector pos = hit.GetPosition();

        totalEnergy += E;
        centerOfEnergy += E * pos;
    }

    centerOfEnergy /= totalEnergy;

    G4cout << "  Total energy: " << totalEnergy/GeV << " GeV" << G4endl;
    G4cout << "  Energy center: " << centerOfEnergy << G4endl;
}
```

## Limitations

1. **No timing information**: Only position and energy (add time to your derived class if needed)
2. **No particle type**: Doesn't store what created the hit
3. **No touchable**: Geometry hierarchy must be reconstructed by `G4FastSimHitMaker`
4. **No track ID**: Doesn't link back to creating track

These are intentional design choices for simplicity and performance. If you need additional information, you can:
- Pass it separately
- Derive your own class from `G4FastHit`
- Store in your sensitive detector's hit class

## Extending G4FastHit

You can derive from `G4FastHit` to add custom data:

```cpp
class MyExtendedFastHit : public G4FastHit
{
public:
    MyExtendedFastHit(const G4ThreeVector& pos, G4double energy, G4double time)
        : G4FastHit(pos, energy), fTime(time) {}

    void SetTime(G4double time) { fTime = time; }
    G4double GetTime() const { return fTime; }

private:
    G4double fTime;
};
```

## Related Classes

- [G4FastSimHitMaker](G4FastSimHitMaker.md) - Uses `G4FastHit` to deposit energy
- [G4VFastSimSensitiveDetector](G4VFastSimSensitiveDetector.md) - Receives `G4FastHit` in `ProcessHits`
- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Creates `G4FastHit` objects
- [G4FastTrack](G4FastTrack.md) - Provides context for hit creation

## References

- Main overview: [Parameterisation Module](../index.md)
- Example: `examples/extended/parameterisations/Par03/`
- Documentation: Lines 32-45 in header (description)
