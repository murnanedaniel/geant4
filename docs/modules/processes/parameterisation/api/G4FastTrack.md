# G4FastTrack

## Overview

`G4FastTrack` is a data structure class that provides fast simulation models with access to the current track information and envelope-specific features. It wraps the `G4Track` and adds convenience methods for accessing particle properties in the envelope's local coordinate system, envelope geometry information, and coordinate transformations.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastTrack.hh`
**Source:** `source/processes/parameterisation/src/G4FastTrack.cc`
**Type:** Data container and convenience interface
:::

## Purpose

`G4FastTrack` provides:
- **Track information access**: Get current `G4Track` and its properties
- **Local coordinates**: Particle position/momentum in envelope coordinate system
- **Envelope geometry**: Access to envelope's region, logical volume, solid
- **Coordinate transformations**: Affine transforms between global and local systems
- **Boundary queries**: Check if particle is exiting the envelope
- **Simplified interface**: Reduces boilerplate in model implementations

## Class Definition

**Lines 73-167** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
class G4FastTrack
{
  public:
    // Constructor
    G4FastTrack(G4Envelope* anEnvelope, G4bool IsUnique);
    ~G4FastTrack() = default;

    // Setup by fast simulation manager
    void SetCurrentTrack(const G4Track& track,
                          const G4Navigator* navigator = nullptr);

    // Boundary check
    G4bool OnTheBoundaryButExiting() const;

    // Track access
    const G4Track* GetPrimaryTrack() const;

    // Envelope geometry
    G4Envelope* GetEnvelope() const;
    G4LogicalVolume* GetEnvelopeLogicalVolume() const;
    G4VPhysicalVolume* GetEnvelopePhysicalVolume() const;
    G4VSolid* GetEnvelopeSolid() const;

    // Track in local coordinates
    G4ThreeVector GetPrimaryTrackLocalPosition() const;
    G4ThreeVector GetPrimaryTrackLocalMomentum() const;
    G4ThreeVector GetPrimaryTrackLocalDirection() const;
    G4ThreeVector GetPrimaryTrackLocalPolarization() const;

    // Coordinate transformations
    const G4AffineTransform* GetAffineTransformation() const;
    const G4AffineTransform* GetInverseAffineTransformation() const;

  private:
    const G4Track* fTrack;
    G4Envelope* fEnvelope;
    G4bool fIsUnique;
    G4LogicalVolume* fEnvelopeLogicalVolume;
    G4VPhysicalVolume* fEnvelopePhysicalVolume;
    G4VSolid* fEnvelopeSolid;
    G4ThreeVector fLocalTrackPosition, fLocalTrackMomentum,
                  fLocalTrackDirection, fLocalTrackPolarization;
    G4AffineTransform fAffineTransformation, fInverseAffineTransformation;
    G4bool fAffineTransformationDefined;

    void FRecordsAffineTransformation(const G4Navigator*);
};
```

## Type Definitions

**Lines 54** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
using G4Envelope = G4Region;
```

An envelope is simply a `G4Region` - a collection of logical volumes where fast simulation is active.

## Constructor

**Lines 84** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4FastTrack(G4Envelope* anEnvelope, G4bool IsUnique);
```

**Parameters**:
- `anEnvelope`: The `G4Region` defining the parameterization volume
- `IsUnique`: Set `true` if envelope placed only once (avoids recalculating transforms)

::: warning Internal Use
This constructor is typically called by `G4FastSimulationManager`, not by user code. Users access `G4FastTrack` as a const reference parameter in model methods.
:::

## Setup Method

**Lines 91** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
void SetCurrentTrack(const G4Track& track,
                     const G4Navigator* navigator = nullptr);
```

**Purpose**: Called by `G4FastSimulationManager` to set the current track and compute local coordinates.

**Internal Use**: Not called by user models.

## Boundary Checking

### OnTheBoundaryButExiting

**Lines 97, 228-234** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4bool OnTheBoundaryButExiting() const;
```

**Purpose**: Tests if particle is on the envelope boundary AND moving outward.

**Return Value**:
- `true`: Particle is exiting the envelope
- `false`: Particle is inside or entering

**Implementation**:
```cpp
inline G4bool G4FastTrack::OnTheBoundaryButExiting() const
{
    // Tests if particle are on the boundary and leaving
    return GetEnvelopeSolid()->DistanceToOut(
               GetPrimaryTrackLocalPosition(),
               GetPrimaryTrackLocalDirection()) == 0.;
}
```

**Usage in ModelTrigger**:
```cpp
G4bool MyModel::ModelTrigger(const G4FastTrack& fastTrack)
{
    // CRITICAL: Always check this first!
    if (fastTrack.OnTheBoundaryButExiting()) {
        return false;  // Don't trigger when exiting
    }

    // Other trigger conditions...
    return true;
}
```

::: danger Critical Check
ALWAYS check `OnTheBoundaryButExiting()` in your `ModelTrigger` implementation and return `false` if it returns `true`. Failing to do this will trigger parameterization when particles are leaving the envelope, causing incorrect physics and potential crashes.
:::

## Track Access

### GetPrimaryTrack

**Lines 105, 193-196** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
const G4Track* GetPrimaryTrack() const;
```

**Purpose**: Returns pointer to the current `G4Track`.

**Usage**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    const G4Track* track = fastTrack.GetPrimaryTrack();

    // Access track properties
    G4double energy = track->GetKineticEnergy();
    G4double time = track->GetGlobalTime();
    G4int trackID = track->GetTrackID();
    const G4ParticleDefinition* particle = track->GetParticleDefinition();
    G4ThreeVector globalMomentum = track->GetMomentum();
    G4ThreeVector globalPosition = track->GetPosition();

    // etc...
}
```

**Available G4Track Methods**:
- `GetKineticEnergy()`, `GetTotalEnergy()`, `GetMomentum()`
- `GetPosition()`, `GetGlobalTime()`, `GetLocalTime()`
- `GetTrackID()`, `GetParentID()`
- `GetParticleDefinition()`, `GetDynamicParticle()`
- `GetVolume()`, `GetTouchable()`
- Many more...

## Envelope Geometry

### GetEnvelope

**Lines 108, 173-176** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4Envelope* GetEnvelope() const;
```

**Purpose**: Returns the `G4Region` (envelope) pointer.

**Usage**:
```cpp
G4Envelope* region = fastTrack.GetEnvelope();
G4String regionName = region->GetName();
```

### GetEnvelopeLogicalVolume

**Lines 111, 178-181** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4LogicalVolume* GetEnvelopeLogicalVolume() const;
```

**Purpose**: Returns the envelope's logical volume.

**Usage**:
```cpp
G4LogicalVolume* logVol = fastTrack.GetEnvelopeLogicalVolume();
G4Material* material = logVol->GetMaterial();
G4String volName = logVol->GetName();

// Material properties for shower parameterization
G4double radiationLength = material->GetRadlen();
G4double density = material->GetDensity();
```

### GetEnvelopePhysicalVolume

**Lines 114, 183-186** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4VPhysicalVolume* GetEnvelopePhysicalVolume() const;
```

**Purpose**: Returns the envelope's physical volume.

**Usage**:
```cpp
G4VPhysicalVolume* physVol = fastTrack.GetEnvelopePhysicalVolume();
G4String pvName = physVol->GetName();
G4int copyNumber = physVol->GetCopyNo();
```

### GetEnvelopeSolid

**Lines 117, 188-191** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4VSolid* GetEnvelopeSolid() const;
```

**Purpose**: Returns the solid shape defining the envelope boundaries.

**Usage for Geometry Queries**:
```cpp
G4VSolid* solid = fastTrack.GetEnvelopeSolid();
G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

// Distance to boundary along direction
G4double distOut = solid->DistanceToOut(localPos, localDir);

// Distance to boundary in any direction
G4double safetyDist = solid->DistanceToOut(localPos);

// Check if inside
EInside inside = solid->Inside(localPos);  // kInside, kSurface, kOutside

// Surface normal
G4ThreeVector normal = solid->SurfaceNormal(localPos);
```

**Example - Checking Available Material**:
```cpp
G4bool MyModel::ModelTrigger(const G4FastTrack& fastTrack)
{
    if (fastTrack.OnTheBoundaryButExiting()) return false;

    // Check if we have enough material for a shower
    G4VSolid* solid = fastTrack.GetEnvelopeSolid();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    G4double distToExit = solid->DistanceToOut(localPos, localDir);

    // Require at least 10 cm of material
    return (distToExit > 10.0*CLHEP::cm);
}
```

## Local Coordinate Access

These methods provide particle properties in the **envelope's local coordinate system**, which simplifies many calculations when the envelope has complex placement or rotation.

### GetPrimaryTrackLocalPosition

**Lines 125, 198-201** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4ThreeVector GetPrimaryTrackLocalPosition() const;
```

**Purpose**: Returns particle position in envelope coordinates.

**Usage**:
```cpp
G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();

// Use with solid for boundary checks
G4VSolid* solid = fastTrack.GetEnvelopeSolid();
G4double distOut = solid->DistanceToOut(localPos, localDir);

// Use for shower spot placement
G4ThreeVector showerStart = localPos;
```

### GetPrimaryTrackLocalMomentum

**Lines 128, 203-206** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4ThreeVector GetPrimaryTrackLocalMomentum() const;
```

**Purpose**: Returns particle momentum vector in envelope coordinates.

**Usage**:
```cpp
G4ThreeVector localMomentum = fastTrack.GetPrimaryTrackLocalMomentum();
G4double momentumMag = localMomentum.mag();
```

### GetPrimaryTrackLocalDirection

**Lines 131, 208-211** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4ThreeVector GetPrimaryTrackLocalDirection() const;
```

**Purpose**: Returns particle direction (unit vector) in envelope coordinates.

**Usage**:
```cpp
G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

// Generate shower along this direction
for (int i = 0; i < nSpots; ++i) {
    G4double depth = i * 2.0*cm;
    G4ThreeVector spotPos = localPos + depth * localDir;

    // spotPos is in local coordinates
    G4FastHit hit(spotPos, energy);
    hitMaker.make(hit, fastTrack);
}
```

### GetPrimaryTrackLocalPolarization

**Lines 134, 213-216** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
G4ThreeVector GetPrimaryTrackLocalPolarization() const;
```

**Purpose**: Returns particle polarization vector in envelope coordinates.

**Usage**: Rarely needed except for polarization-dependent physics.

## Coordinate Transformations

### GetAffineTransformation

**Lines 140, 218-221** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
const G4AffineTransform* GetAffineTransformation() const;
```

**Purpose**: Returns the **Global → Local** coordinate transformation.

**Usage**:
```cpp
const G4AffineTransform* globalToLocal =
    fastTrack.GetAffineTransformation();

// Transform a global point to local
G4ThreeVector globalPoint = // some global position
G4ThreeVector localPoint = globalToLocal->TransformPoint(globalPoint);

// Transform a global direction to local
G4ThreeVector globalDir = // some global direction
G4ThreeVector localDir = globalToLocal->TransformAxis(globalDir);
```

### GetInverseAffineTransformation

**Lines 143, 223-226** in `source/processes/parameterisation/include/G4FastTrack.hh`

```cpp
const G4AffineTransform* GetInverseAffineTransformation() const;
```

**Purpose**: Returns the **Local → Global** coordinate transformation.

**Usage**:
```cpp
const G4AffineTransform* localToGlobal =
    fastTrack.GetInverseAffineTransformation();

// Transform a local point to global
G4ThreeVector localPoint = // in envelope coordinates
G4ThreeVector globalPoint = localToGlobal->TransformPoint(localPoint);

// Transform a local direction to global
G4ThreeVector localDir = // in envelope coordinates
G4ThreeVector globalDir = localToGlobal->TransformAxis(localDir);
```

**Example - Manual Coordinate Conversion**:
```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Get position in local coordinates (convenient)
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();

    // Generate shower spot in local coordinates
    G4ThreeVector spotLocalPos = localPos + 10*cm * localDir;

    // Convert to global if needed (rare - usually work in local)
    const G4AffineTransform* toGlobal =
        fastTrack.GetInverseAffineTransformation();
    G4ThreeVector spotGlobalPos = toGlobal->TransformPoint(spotLocalPos);

    // Note: G4FastHit and G4FastStep handle coordinate flags automatically
}
```

::: tip Usually Not Needed
Most fast simulation code works entirely in local coordinates. The `G4FastStep` methods accept a `localCoordinates` boolean flag (default `true`), so you rarely need explicit transformations. The framework handles conversions automatically.
:::

## Usage Examples

### Example 1: Energy-Based Trigger with Boundary Check

```cpp
G4bool MyModel::ModelTrigger(const G4FastTrack& fastTrack)
{
    // STEP 1: Check boundary (cheapest test, most important)
    if (fastTrack.OnTheBoundaryButExiting()) {
        return false;
    }

    // STEP 2: Check energy
    const G4Track* track = fastTrack.GetPrimaryTrack();
    G4double energy = track->GetKineticEnergy();

    if (energy < 1.0*CLHEP::GeV) {
        return false;
    }

    // STEP 3: Check available material
    G4VSolid* solid = fastTrack.GetEnvelopeSolid();
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    G4double distOut = solid->DistanceToOut(localPos, localDir);

    // Need at least 5 radiation lengths
    G4double X0 = 1.4*CLHEP::cm;  // PbWO4
    return (distOut > 5.0*X0);
}
```

### Example 2: Shower Generation in Local Coordinates

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Get input in local coordinates
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
    G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

    const G4Track* track = fastTrack.GetPrimaryTrack();
    G4double energy = track->GetKineticEnergy();
    G4double time = track->GetGlobalTime();

    // Kill primary
    fastStep.KillPrimaryTrack();
    fastStep.ProposeTotalEnergyDeposited(energy);

    // Generate longitudinal shower profile
    G4FastSimHitMaker hitMaker;
    G4double X0 = 1.4*CLHEP::cm;
    G4int nSpots = 20;

    for (int i = 0; i < nSpots; ++i) {
        G4double depth = i * 0.5 * X0;
        G4double spotEnergy = energy * ShowerShape(i);

        // Position in local coordinates
        G4ThreeVector spotPos = localPos + depth * localDir;

        // Create hit (local coordinates by default)
        G4FastHit hit(spotPos, spotEnergy);
        hitMaker.make(hit, fastTrack);
    }
}
```

### Example 3: Material-Dependent Parameterization

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    // Get material properties from envelope
    G4LogicalVolume* logVol = fastTrack.GetEnvelopeLogicalVolume();
    G4Material* material = logVol->GetMaterial();

    G4double radiationLength = material->GetRadlen();
    G4double density = material->GetDensity();
    G4double Z = material->GetZ();

    // Use material properties for parameterization
    G4double criticalEnergy = 610*CLHEP::MeV / (Z + 1.24);
    G4double moliereRadius = 21.2*CLHEP::MeV / criticalEnergy * radiationLength;

    // Generate shower with material-specific parameters
    // ...
}
```

### Example 4: Position-Dependent Triggering

```cpp
G4bool MyModel::ModelTrigger(const G4FastTrack& fastTrack)
{
    if (fastTrack.OnTheBoundaryButExiting()) return false;

    // Only trigger in back half of detector
    G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();

    // Assuming detector extends from z=0 to z=100cm
    if (localPos.z() < 50.0*CLHEP::cm) {
        return false;  // Front half: use detailed tracking
    }

    // Check energy
    G4double energy = fastTrack.GetPrimaryTrack()->GetKineticEnergy();
    return (energy > 2.0*CLHEP::GeV);
}
```

### Example 5: Track Information Access

```cpp
void MyModel::DoIt(const G4FastTrack& fastTrack, G4FastStep& fastStep)
{
    const G4Track* track = fastTrack.GetPrimaryTrack();

    // Particle identification
    const G4ParticleDefinition* particle = track->GetParticleDefinition();
    G4String particleName = particle->GetParticleName();
    G4int pdgCode = particle->GetPDGEncoding();
    G4double charge = particle->GetPDGCharge();

    // Kinematic information
    G4double kineticEnergy = track->GetKineticEnergy();
    G4double totalEnergy = track->GetTotalEnergy();
    G4double velocity = track->GetVelocity();
    G4double beta = velocity / CLHEP::c_light;
    G4double gamma = track->GetDynamicParticle()->GetTotalEnergy() /
                     track->GetDynamicParticle()->GetMass();

    // Timing
    G4double globalTime = track->GetGlobalTime();
    G4double localTime = track->GetLocalTime();
    G4double properTime = track->GetProperTime();

    // Tracking information
    G4int trackID = track->GetTrackID();
    G4int parentID = track->GetParentID();
    G4double trackLength = track->GetTrackLength();

    // Use this information for parameterization...
}
```

## Best Practices

1. **Always Check Boundary First**:
   ```cpp
   if (fastTrack.OnTheBoundaryButExiting()) return false;
   ```

2. **Work in Local Coordinates**:
   - Simplifies geometry queries
   - Easier to work with envelope solid
   - Framework handles conversions automatically

3. **Cache Expensive Calculations**:
   ```cpp
   G4VSolid* solid = fastTrack.GetEnvelopeSolid();  // Cache this
   G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
   G4ThreeVector localDir = fastTrack.GetPrimaryTrackLocalDirection();

   // Use cached values multiple times
   G4double dist1 = solid->DistanceToOut(localPos, localDir);
   G4double dist2 = solid->DistanceToOut(localPos);
   ```

4. **Don't Modify**: `G4FastTrack` is const - read-only interface

5. **Prefer Convenience Methods**: Use `GetPrimaryTrackLocalPosition()` instead of manual transformations

## Common Mistakes

### Mistake 1: Not Checking Boundary
```cpp
// WRONG - can trigger when exiting!
G4bool ModelTrigger(const G4FastTrack& fastTrack) {
    return (fastTrack.GetPrimaryTrack()->GetKineticEnergy() > 1*GeV);
}

// CORRECT
G4bool ModelTrigger(const G4FastTrack& fastTrack) {
    if (fastTrack.OnTheBoundaryButExiting()) return false;
    return (fastTrack.GetPrimaryTrack()->GetKineticEnergy() > 1*GeV);
}
```

### Mistake 2: Mixing Global and Local Coordinates
```cpp
// WRONG - mixing coordinate systems
G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
G4ThreeVector globalMom = fastTrack.GetPrimaryTrack()->GetMomentum();
G4double angle = localPos.angle(globalMom);  // Meaningless!

// CORRECT - use consistent coordinates
G4ThreeVector localPos = fastTrack.GetPrimaryTrackLocalPosition();
G4ThreeVector localMom = fastTrack.GetPrimaryTrackLocalMomentum();
G4double angle = localPos.angle(localMom);  // OK
```

### Mistake 3: Expensive Calculations in Trigger
```cpp
// INEFFICIENT - complex calculation in frequently-called trigger
G4bool ModelTrigger(const G4FastTrack& fastTrack) {
    // This runs EVERY STEP for applicable particles!
    G4LogicalVolume* lv = fastTrack.GetEnvelopeLogicalVolume();
    G4Material* mat = lv->GetMaterial();
    G4double X0 = mat->GetRadlen();
    // ... complex calculation ...
}

// BETTER - cache in constructor or member variables
MyModel::MyModel() : fRadiationLength(1.4*cm) {}

G4bool MyModel::ModelTrigger(const G4FastTrack& fastTrack) {
    // Use cached value
    G4double dist = solid->DistanceToOut(pos, dir);
    return (dist > 5.0*fRadiationLength);
}
```

## Related Classes

- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Uses `G4FastTrack` for input
- [G4FastStep](G4FastStep.md) - Companion output class
- [G4FastSimulationManager](G4FastSimulationManager.md) - Creates and manages `G4FastTrack`
- [G4FastSimHitMaker](G4FastSimHitMaker.md) - Uses `G4FastTrack` for coordinate transforms

## References

- Main overview: [Parameterisation Module](../index.md)
- `G4Track` documentation for full track interface
- `G4VSolid` documentation for geometry queries
- `G4AffineTransform` for coordinate transformation details
