# G4UserLimits

## Overview

G4UserLimits provides a simple yet powerful mechanism for setting step-by-step constraints on particle tracking in Geant4 simulations. It allows users to control maximum step size, track length, time, minimum kinetic energy, and minimum range for particles within specific logical volumes. These limits are enforced by specialized physics processes (UserStepLimit and UserSpecialCuts) that must be registered for the particles of interest.

**Source Location**: `/source/global/management/include/G4UserLimits.hh`

**Author**: Paul Kent (1996), H. Kurashige (1997), M. Maire (1998)

## Class Definition

```cpp
class G4UserLimits
{
public:
    // Constructors
    G4UserLimits(G4double ustepMax = DBL_MAX,
                 G4double utrakMax = DBL_MAX,
                 G4double utimeMax = DBL_MAX,
                 G4double uekinMin = 0.,
                 G4double urangMin = 0.);

    G4UserLimits(const G4String& type,
                 G4double ustepMax = DBL_MAX,
                 G4double utrakMax = DBL_MAX,
                 G4double utimeMax = DBL_MAX,
                 G4double uekinMin = 0.,
                 G4double urangMin = 0.);

    virtual ~G4UserLimits();

    // Getters (virtual - can be overridden)
    virtual G4double GetMaxAllowedStep(const G4Track&);
    virtual G4double GetUserMaxTrackLength(const G4Track&);
    virtual G4double GetUserMaxTime(const G4Track&);
    virtual G4double GetUserMinEkine(const G4Track&);
    virtual G4double GetUserMinRange(const G4Track&);

    // Setters (virtual - can be overridden)
    virtual void SetMaxAllowedStep(G4double ustepMax);
    virtual void SetUserMaxTrackLength(G4double utrakMax);
    virtual void SetUserMaxTime(G4double utimeMax);
    virtual void SetUserMinEkine(G4double uekinMin);
    virtual void SetUserMinRange(G4double urangMin);

    // Type management
    const G4String& GetType() const;
    void SetType(const G4String& type);

protected:
    G4double fMaxStep;   // Max allowed step size
    G4double fMaxTrack;  // Max total track length
    G4double fMaxTime;   // Max time
    G4double fMinEkine;  // Min kinetic energy (charged particles only)
    G4double fMinRange;  // Min remaining range (charged particles only)
    G4String fType;      // Type identifier
};
```

## Constructors

### Standard Constructor

```cpp
G4UserLimits(G4double ustepMax = DBL_MAX,
             G4double utrakMax = DBL_MAX,
             G4double utimeMax = DBL_MAX,
             G4double uekinMin = 0.,
             G4double urangMin = 0.)
```

**Parameters**:
- `ustepMax` - Maximum allowed step size (default: unlimited)
- `utrakMax` - Maximum total track length (default: unlimited)
- `utimeMax` - Maximum time (default: unlimited)
- `uekinMin` - Minimum kinetic energy for charged particles (default: 0)
- `urangMin` - Minimum range for charged particles (default: 0)

### Typed Constructor

```cpp
G4UserLimits(const G4String& type,
             G4double ustepMax = DBL_MAX,
             G4double utrakMax = DBL_MAX,
             G4double utimeMax = DBL_MAX,
             G4double uekinMin = 0.,
             G4double urangMin = 0.)
```

**Parameters**:
- `type` - Type identifier for derived classes
- Other parameters same as standard constructor

## Public Methods

### Getters

All getter methods are virtual and take a `const G4Track&` parameter, allowing for track-dependent limits in derived classes.

```cpp
virtual G4double GetMaxAllowedStep(const G4Track& track);
```
Returns the maximum allowed step size in the current volume.

```cpp
virtual G4double GetUserMaxTrackLength(const G4Track& track);
```
Returns the maximum allowed total track length.

```cpp
virtual G4double GetUserMaxTime(const G4Track& track);
```
Returns the maximum allowed time for the track.

```cpp
virtual G4double GetUserMinEkine(const G4Track& track);
```
Returns the minimum kinetic energy (applies to charged particles only).

```cpp
virtual G4double GetUserMinRange(const G4Track& track);
```
Returns the minimum remaining range (applies to charged particles only).

### Setters

```cpp
virtual void SetMaxAllowedStep(G4double ustepMax);
virtual void SetUserMaxTrackLength(G4double utrakMax);
virtual void SetUserMaxTime(G4double utimeMax);
virtual void SetUserMinEkine(G4double uekinMin);
virtual void SetUserMinRange(G4double urangMin);
```

### Type Management

```cpp
const G4String& GetType() const;
void SetType(const G4String& type);
```

Used to identify the actual class type for derived classes.

## Usage Examples

### Basic Step Limitation

```cpp
#include "G4UserLimits.hh"
#include "G4LogicalVolume.hh"

// Limit step size to 1 mm in a sensitive detector
G4LogicalVolume* detectorLV = ...;
G4UserLimits* stepLimit = new G4UserLimits(1.0*mm);
detectorLV->SetUserLimits(stepLimit);

// Note: You must also register UserStepLimit process for this to work
```

### Multiple Constraints

```cpp
// Create comprehensive limits for a target volume
G4UserLimits* targetLimits = new G4UserLimits(
    0.5*mm,      // Max step size: 0.5 mm
    10.0*cm,     // Max track length: 10 cm
    1.0*ns,      // Max time: 1 nanosecond
    100.0*keV,   // Min kinetic energy: 100 keV
    0.1*mm       // Min range: 0.1 mm
);

G4LogicalVolume* targetLV = ...;
targetLV->SetUserLimits(targetLimits);
```

### Registering Required Processes

```cpp
#include "G4UserSpecialCuts.hh"
#include "G4StepLimiter.hh"

void MyPhysicsList::ConstructProcess() {
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while ((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4ProcessManager* pmanager = particle->GetProcessManager();

        // Add step limiter (for max step size)
        pmanager->AddDiscreteProcess(new G4StepLimiter());

        // Add special cuts (for time, track length, energy, range)
        pmanager->AddDiscreteProcess(new G4UserSpecialCuts());
    }
}
```

### Detector with Fine Granularity

```cpp
void MyDetectorConstruction::ConstructSDandField() {
    // Fine-grained tracking in calorimeter
    G4UserLimits* caloLimits = new G4UserLimits(2.0*mm);
    calorimeterLV->SetUserLimits(caloLimits);

    // Very fine tracking in silicon detector
    G4UserLimits* siliconLimits = new G4UserLimits(10.0*um);
    siliconLV->SetUserLimits(siliconLimits);

    // Coarse tracking in shield (save CPU time)
    G4UserLimits* shieldLimits = new G4UserLimits(10.0*cm);
    shieldLV->SetUserLimits(shieldLimits);
}
```

### Time-Limited Tracking

```cpp
// Kill tracks older than 100 ns (e.g., for fast timing detectors)
G4UserLimits* timingLimits = new G4UserLimits(
    DBL_MAX,     // No step size limit
    DBL_MAX,     // No track length limit
    100.0*ns,    // Max time: 100 ns
    0.,          // No energy cut
    0.           // No range cut
);

timingDetectorLV->SetUserLimits(timingLimits);
```

### Energy Threshold Cuts

```cpp
// Stop tracking charged particles below 1 MeV
G4UserLimits* energyLimits = new G4UserLimits(
    DBL_MAX,     // No step size limit
    DBL_MAX,     // No track length limit
    DBL_MAX,     // No time limit
    1.0*MeV,     // Min kinetic energy: 1 MeV
    0.           // No range cut
);

absorberLV->SetUserLimits(energyLimits);
```

### Range-Based Cuts

```cpp
// Stop charged particles with range < 1 mm
G4UserLimits* rangeLimits = new G4UserLimits(
    DBL_MAX,     // No step size limit
    DBL_MAX,     // No track length limit
    DBL_MAX,     // No time limit
    0.,          // No energy cut
    1.0*mm       // Min range: 1 mm
);

targetLV->SetUserLimits(rangeLimits);
```

### Updating Limits Dynamically

```cpp
class MyDetectorConstruction : public G4VUserDetectorConstruction {
private:
    G4UserLimits* fStepLimit;

public:
    void UpdateStepLimit(G4double newLimit) {
        if (fStepLimit) {
            fStepLimit->SetMaxAllowedStep(newLimit);

            // Inform geometry that it changed
            G4RunManager::GetRunManager()->GeometryHasBeenModified();
        }
    }
};
```

### Custom User Limits Class

```cpp
// Derive from G4UserLimits for track-dependent limits
class MyCustomLimits : public G4UserLimits {
public:
    MyCustomLimits() : G4UserLimits("MyCustomLimits") {}

    // Override to make step limit depend on particle energy
    virtual G4double GetMaxAllowedStep(const G4Track& track) override {
        G4double energy = track.GetKineticEnergy();

        if (energy > 10.0*MeV) {
            return 1.0*cm;   // Coarse steps for high energy
        } else if (energy > 1.0*MeV) {
            return 1.0*mm;   // Medium steps for medium energy
        } else {
            return 0.1*mm;   // Fine steps for low energy
        }
    }
};

// Usage
detectorLV->SetUserLimits(new MyCustomLimits());
```

### Particle-Specific Limits

```cpp
class ParticleSpecificLimits : public G4UserLimits {
public:
    ParticleSpecificLimits() : G4UserLimits("ParticleSpecific") {}

    virtual G4double GetMaxAllowedStep(const G4Track& track) override {
        G4ParticleDefinition* particle = track.GetDefinition();

        if (particle == G4Gamma::Definition()) {
            return 10.0*cm;  // Large steps for gammas
        } else if (particle->GetPDGCharge() != 0) {
            return 0.5*mm;   // Small steps for charged particles
        } else {
            return 5.0*cm;   // Medium steps for neutral particles
        }
    }
};
```

### Volume-Specific Configuration

```cpp
void SetupGeometry() {
    // Different limits for different detector regions

    // Tracker: fine steps, no energy cuts
    G4UserLimits* trackerLimits = new G4UserLimits(0.1*mm);
    for (auto* lv : trackerLogicalVolumes) {
        lv->SetUserLimits(trackerLimits);
    }

    // Calorimeter: medium steps, energy threshold
    G4UserLimits* caloLimits = new G4UserLimits(
        2.0*mm, DBL_MAX, DBL_MAX, 100.0*keV, 0.
    );
    for (auto* lv : calorimeterLogicalVolumes) {
        lv->SetUserLimits(caloLimits);
    }

    // Muon detector: time cuts for cosmic ray rejection
    G4UserLimits* muonLimits = new G4UserLimits(
        5.0*mm, DBL_MAX, 50.0*ns, 0., 0.
    );
    for (auto* lv : muonLogicalVolumes) {
        lv->SetUserLimits(muonLimits);
    }
}
```

## Best Practices

### 1. Always Register Required Processes

```cpp
// REQUIRED: G4UserLimits does nothing without proper processes
void MyPhysicsList::ConstructProcess() {
    // Add to ALL particles that need limits
    AddStepLimiter();      // For max step
    AddSpecialCuts();      // For time, length, energy, range
}
```

### 2. Use Appropriate Step Sizes

```cpp
// GOOD: Balance accuracy and performance
G4UserLimits* limits = new G4UserLimits(
    0.1*detectorThickness  // Step << detector size
);

// AVOID: Steps too small (slow) or too large (inaccurate)
G4UserLimits* tooFine = new G4UserLimits(0.001*nm);  // Overkill
G4UserLimits* tooCoarse = new G4UserLimits(10*m);    // Inaccurate
```

### 3. Memory Management

```cpp
// GOOD: Logical volume takes ownership
G4UserLimits* limits = new G4UserLimits(1*mm);
logicalVolume->SetUserLimits(limits);
// Don't delete limits - geometry manages it

// Can share limits among multiple volumes
G4UserLimits* sharedLimits = new G4UserLimits(5*mm);
volume1->SetUserLimits(sharedLimits);
volume2->SetUserLimits(sharedLimits);
volume3->SetUserLimits(sharedLimits);
```

### 4. Use Virtual Functions for Complex Logic

```cpp
// Override getters for sophisticated behavior
class AdaptiveLimits : public G4UserLimits {
    virtual G4double GetMaxAllowedStep(const G4Track& track) override {
        // Adapt to local conditions
        G4VPhysicalVolume* volume = track.GetVolume();
        G4Material* material = track.GetMaterial();
        G4double energy = track.GetKineticEnergy();

        // Complex logic here
        return CalculateOptimalStep(volume, material, energy);
    }
};
```

### 5. Consider Performance Impact

```cpp
// Fine steps = more CPU time
G4UserLimits* fineSteps = new G4UserLimits(0.01*mm);
sensitiveDetectorLV->SetUserLimits(fineSteps);  // OK for small volumes

// Use larger steps in bulk materials
G4UserLimits* coarseSteps = new G4UserLimits(10*cm);
shieldingLV->SetUserLimits(coarseSteps);  // Saves CPU time
```

## Common Pitfalls

### 1. Forgetting to Register Processes

```cpp
// WRONG: Limits have no effect without processes
G4UserLimits* limits = new G4UserLimits(1*mm);
logicalVolume->SetUserLimits(limits);
// Nothing happens! Must add G4StepLimiter and G4UserSpecialCuts

// CORRECT: Add in physics list
pmanager->AddDiscreteProcess(new G4StepLimiter());
pmanager->AddDiscreteProcess(new G4UserSpecialCuts());
```

### 2. Wrong Units

```cpp
// WRONG: Forgetting units
G4UserLimits* limits = new G4UserLimits(1.0);  // 1 mm? 1 m? Unclear!

// CORRECT: Always specify units
G4UserLimits* limits = new G4UserLimits(1.0*mm);  // Clear
```

### 3. Conflicting with Production Cuts

```cpp
// Be aware: production cuts and user limits are different
// Production cuts: secondary particle creation threshold
// User limits: tracking termination conditions

// They can conflict - track may be killed before reaching production cut
```

### 4. Applying Cuts to Wrong Particles

```cpp
// Min energy/range only apply to CHARGED particles
// Gammas and neutrons ignore fMinEkine and fMinRange

// If you need to cut neutral particles, override GetUserMinEkine:
class NeutralParticleLimits : public G4UserLimits {
    virtual G4double GetUserMinEkine(const G4Track& track) override {
        if (track.GetDefinition() == G4Gamma::Definition()) {
            return 10*keV;  // Kill gammas below 10 keV
        }
        return G4UserLimits::GetUserMinEkine(track);
    }
};
```

### 5. Not Checking Return Values

```cpp
// Getters take const G4Track& but base implementation ignores it
// Override if you need track-dependent behavior
```

## Thread Safety

**Thread-Safe**: Yes, with proper usage

**Considerations**:
- G4UserLimits objects should be created during detector construction
- Each thread gets its own geometry (in MT mode)
- Limits are part of geometry, so each thread has separate copies
- Don't modify limits during event processing

**Safe Usage**:
```cpp
// In master thread (detector construction)
void ConstructDetector() {
    G4UserLimits* limits = new G4UserLimits(1*mm);
    logicalVolume->SetUserLimits(limits);
    // Each worker thread gets its own copy
}
```

**Unsafe Usage**:
```cpp
// WRONG: Don't modify during events
void UserSteppingAction(const G4Step* step) {
    G4UserLimits* limits =
        step->GetPreStepPoint()->GetPhysicalVolume()
            ->GetLogicalVolume()->GetUserLimits();
    limits->SetMaxAllowedStep(newValue);  // Race condition!
}
```

## Performance Considerations

### 1. Step Size Impact

```cpp
// Smaller steps = more accurate but slower
// Rule of thumb: step size ~ 0.1 * characteristic length

// For 1 mm detector
G4UserLimits* goodChoice = new G4UserLimits(0.1*mm);

// For 10 cm absorber
G4UserLimits* efficient = new G4UserLimits(1.0*cm);
```

### 2. Selective Application

```cpp
// Apply limits only where needed
// DON'T apply fine limits to entire geometry

// GOOD: Limits only in detector
detectorLV->SetUserLimits(new G4UserLimits(0.1*mm));

// AVOID: Fine limits everywhere (slow!)
worldLV->SetUserLimits(new G4UserLimits(0.1*mm));  // Affects all volumes!
```

### 3. Energy/Range Cuts Save Time

```cpp
// Kill low-energy particles early to save CPU
G4UserLimits* efficientCuts = new G4UserLimits(
    DBL_MAX, DBL_MAX, DBL_MAX,
    100*keV,  // Stop tracking below 100 keV
    0.1*mm    // Or if range < 0.1 mm
);
```

## Related Classes

- **G4LogicalVolume**: Holds G4UserLimits via `SetUserLimits()`
- **G4StepLimiter**: Process that enforces max step size
- **G4UserSpecialCuts**: Process that enforces time/length/energy/range limits
- **G4VUserDetectorConstruction**: Where limits are typically created
- **G4VPhysicsList**: Where limiter processes are registered

## See Also

- [G4StepLimiter Documentation](G4StepLimiter.md)
- [G4UserSpecialCuts Documentation](G4UserSpecialCuts.md)
- [Geant4 User Guide: User Limits](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/TrackingAndPhysics/physicsProcess.html#user-limits)
- [Production Cuts vs User Limits](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/TrackingAndPhysics/thresholdVScut.html)
