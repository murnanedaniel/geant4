# G4GeometrySampler

## Overview

`G4GeometrySampler` is a high-level configurator class for classical importance sampling in Geant4. It provides a simple interface to set up geometry-based variance reduction using importance values, weight windows, or weight cut-offs. This is the traditional approach to variance reduction, similar to what is used in MCNP.

**Location:** `source/processes/biasing/importance/include/G4GeometrySampler.hh`

**Base Class:** `G4VSampler`

**Typical Use:** Shielding studies, deep penetration problems, detector optimization with importance maps

## Purpose

Importance sampling is a classical variance reduction technique that:

- **Splits Particles** when entering more important regions (higher importance)
- **Kills Particles (Russian Roulette)** when entering less important regions
- **Maintains Statistical Correctness** through automatic weight adjustment
- **Uses Parallel Geometry** optional, can use mass or parallel geometry

**Key Concept:**
```
Importance = Relative particle population desired in region

Higher importance → More particles → Better statistics
Lower importance → Fewer particles → Less CPU time

Typical importance progression:
World: 1 → Shield1: 2 → Shield2: 4 → Shield3: 8 → Detector: 16
```

## Class Definition

```cpp
class G4GeometrySampler : public G4VSampler
{
public:
    // Constructors
    explicit G4GeometrySampler(G4VPhysicalVolume* worldvolume,
                               const G4String& particlename);

    explicit G4GeometrySampler(const G4String& worldvolumeName,
                               const G4String& particlename);

    virtual ~G4GeometrySampler();

    // Setup methods
    virtual void PrepareImportanceSampling(
        G4VIStore* istore,
        const G4VImportanceAlgorithm* ialg = nullptr);

    virtual void PrepareWeightRoulett(G4double wsurvive = 0.5,
                                      G4double wlimit = 0.25,
                                      G4double isource = 1.0);

    virtual void PrepareWeightWindow(
        G4VWeightWindowStore* wwstore,
        G4VWeightWindowAlgorithm* wwAlg = nullptr,
        G4PlaceOfAction placeOfAction = onBoundary);

    // Configuration
    virtual void Configure();
    virtual void AddProcess();
    virtual void ClearSampling();
    virtual G4bool IsConfigured() const;

    // Settings
    void SetParallel(G4bool paraflag);
    void SetWorld(const G4VPhysicalVolume* world);
    void SetParticle(const G4String& particlename);

    const G4String& GetParticleName();

private:
    G4String fParticleName;
    const G4VPhysicalVolume* fWorld;
    G4ImportanceConfigurator* fImportanceConfigurator;
    G4WeightCutOffConfigurator* fWeightCutOffConfigurator;
    G4WeightWindowConfigurator* fWeightWindowConfigurator;
    G4VIStore* fIStore;
    G4VWeightWindowStore* fWWStore;
    G4bool fIsConfigured;
    G4bool paraflag;
};
```

**Key Lines:**
- Line 53-54: Constructors specify world volume and particle type
- Line 61: PrepareImportanceSampling - setup importance values
- Line 64: PrepareWeightRoulett - setup weight cutoff
- Line 68: PrepareWeightWindow - setup weight windows
- Line 72: Configure - apply configuration

## Basic Usage Pattern

### Three-Step Process

**1. Create Geometry Sampler**
```cpp
G4GeometrySampler* sampler =
    new G4GeometrySampler(worldPhysical, "neutron");
```

**2. Prepare Biasing Method**
```cpp
// Create importance store and assign values
G4IStore* importanceStore = G4IStore::GetInstance();
// ... set importance values ...

// Configure sampler
sampler->PrepareImportanceSampling(importanceStore, nullptr);
```

**3. Configure**
```cpp
sampler->Configure();
```

## Importance Sampling

### Complete Example

```cpp
#include "G4GeometrySampler.hh"
#include "G4IStore.hh"

void DetectorConstruction::ConstructSDandField()
{
    // ===== 1. Create Importance Store =====
    G4IStore* importanceStore = G4IStore::GetInstance();

    // ===== 2. Assign Importance Values =====
    // Higher importance = more particles desired
    // Typically increase by factors of 2-4 toward detector

    // World (source region)
    importanceStore->AddImportanceGeometryCell(1.0, *fWorldPhysical);

    // Shielding layers (increasing importance)
    importanceStore->AddImportanceGeometryCell(2.0, *fShield1Physical);
    importanceStore->AddImportanceGeometryCell(4.0, *fShield2Physical);
    importanceStore->AddImportanceGeometryCell(8.0, *fShield3Physical);

    // Detector (highest importance)
    importanceStore->AddImportanceGeometryCell(16.0, *fDetectorPhysical);

    // ===== 3. Create Geometry Sampler =====
    G4GeometrySampler* geoSampler =
        new G4GeometrySampler(fWorldPhysical, "neutron");

    // ===== 4. Configure Importance Sampling =====
    geoSampler->PrepareImportanceSampling(
        importanceStore,
        nullptr  // Use default importance algorithm
    );

    // ===== 5. Apply Configuration =====
    geoSampler->Configure();

    G4cout << "========================================" << G4endl;
    G4cout << "Importance sampling configured" << G4endl;
    G4cout << "  Particle: neutron" << G4endl;
    G4cout << "  Importance range: 1.0 - 16.0" << G4endl;
    G4cout << "========================================" << G4endl;
}
```

### Importance Value Guidelines

**Choosing Importance Values:**

```cpp
// Rule of thumb: Increase by factor of 2-4 per region
// Toward detector or scoring region

// Example 1: Simple shielding
World:        1
Shield:       4
Detector:    16

// Example 2: Multi-layer shielding
World:        1
Shield1:      2
Shield2:      4
Shield3:      8
Shield4:     16
Detector:    32

// Example 3: Aggressive splitting
World:        1
Near detector: 64
Detector:   256
```

**Avoid:**
- Too large jumps (factor > 10) at single boundary
- Too many importance regions (> 20)
- Importance decreasing toward detector

### How Splitting/Russian Roulette Works

**Entering Higher Importance Region:**
```
Current importance: I_old = 2
New importance:     I_new = 8
Importance ratio:   R = I_new / I_old = 4

Action: Split particle into 4 copies
Weight of each:    w_new = w_old / 4

Example:
  w_old = 1.0
  → 4 particles with w_new = 0.25 each
  Total weight conserved: 4 × 0.25 = 1.0 ✓
```

**Entering Lower Importance Region:**
```
Current importance: I_old = 8
New importance:     I_new = 2
Importance ratio:   R = I_new / I_old = 0.25

Action: Russian roulette
  - Kill with probability (1 - R) = 0.75
  - Survive with probability R = 0.25
  - If survives: w_new = w_old / R = w_old / 0.25 = 4 × w_old

Example:
  w_old = 0.25
  → 25% chance: survive with w_new = 1.0
  → 75% chance: killed
  Average weight: 0.25 × 1.0 = 0.25 ✓
```

## Weight Cut-Off (Weight Roulette)

### Purpose

Prevents particle weights from becoming too small during simulation.

### Setup

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Create sampler
    G4GeometrySampler* geoSampler =
        new G4GeometrySampler(fWorldPhysical, "neutron");

    // Configure weight roulette
    G4double wsurvive = 0.5;   // Survival weight
    G4double wlimit = 0.25;    // Lower weight limit
    G4double isource = 1.0;    // Source weight

    geoSampler->PrepareWeightRoulett(wsurvive, wlimit, isource);

    // Configure
    geoSampler->Configure();
}
```

### Parameters

**wsurvive (survival weight):**
- Target weight after roulette
- Typical value: 0.5

**wlimit (lower limit):**
- Threshold for playing roulette
- Typical: wlimit = wsurvive / 2
- When w < wlimit, play roulette:
  - Survive with probability w / wsurvive
  - If survive: w → wsurvive

**isource (source weight):**
- Initial weight of source particles
- Usually 1.0

### Example

```cpp
// Particle with weight w = 0.1 reaches detector

if (w < wlimit) {  // 0.1 < 0.25 → true
    G4double survivalProb = w / wsurvive;  // 0.1 / 0.5 = 0.2

    if (G4UniformRand() < 0.2) {
        // Survive with 20% probability
        w = wsurvive;  // w = 0.5
    } else {
        // Killed with 80% probability
        Kill track;
    }
}

// Expected weight: 0.2 × 0.5 = 0.1 ✓ (conserved)
```

## Weight Windows

### Purpose

Maintain particle weights within specified bounds across geometry.

### Concept

```
For each geometry cell, define:
  - w_lower: Lower window bound
  - w_upper: Upper window bound

When particle enters cell:
  - If w < w_lower: Play Russian roulette
  - If w > w_upper: Split particle
  - Otherwise: No action
```

### Setup

```cpp
#include "G4GeometrySampler.hh"
#include "G4VWeightWindowStore.hh"

void DetectorConstruction::ConstructSDandField()
{
    // Create weight window store
    // (Implementation depends on specific store type)
    G4VWeightWindowStore* wwStore = /* create store */;

    // Define weight windows for each cell
    // Format depends on store implementation
    // Typical: (cell, lower_bound, upper_bound)

    // Create sampler
    G4GeometrySampler* geoSampler =
        new G4GeometrySampler(fWorldPhysical, "neutron");

    // Configure weight windows
    geoSampler->PrepareWeightWindow(
        wwStore,
        nullptr,      // Use default algorithm
        onBoundary    // When to apply (onBoundary or onCollision)
    );

    // Configure
    geoSampler->Configure();
}
```

### Window Parameters

**Typical Window Setup:**
```cpp
// For a given cell
w_survive = 1.0      // Target weight
k = 5                // Window width parameter

w_lower = w_survive / k = 0.2
w_upper = k × w_survive = 5.0

// Weight window: [0.2, 5.0]
```

**Actions:**
```cpp
if (w < w_lower) {
    // Russian roulette
    p_survive = w / w_survive;
    if (survive) w = w_survive;
}

if (w > w_upper) {
    // Split
    n = floor(w / w_survive);
    Create n particles each with w_new = w / n;
}
```

### Place of Action

**onBoundary:**
- Apply weight windows when crossing geometry boundaries
- Most common choice
- Better for geometry-driven importance changes

**onCollision:**
- Apply weight windows at interaction points
- Useful for energy-dependent importance
- Can combine with boundary application

## Parallel Geometry

### Purpose

Use parallel geometry for importance without affecting physics geometry.

### Setup

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Create sampler with parallel geometry
    G4GeometrySampler* geoSampler =
        new G4GeometrySampler(fWorldPhysical, "neutron");

    // Enable parallel geometry
    geoSampler->SetParallel(true);

    // Prepare importance sampling
    G4IStore* importanceStore = G4IStore::GetInstance();
    // ... assign importance to parallel geometry cells ...

    geoSampler->PrepareImportanceSampling(importanceStore, nullptr);
    geoSampler->Configure();
}
```

### Advantages

- Importance geometry independent of physics geometry
- Simpler importance definitions
- Can use different granularity
- Easier to modify importance without changing detector

### Disadvantages

- More complex setup
- Slightly higher CPU overhead
- Requires maintaining two geometries

## Complete Shielding Example

### Deep Penetration Through Concrete Shielding

```cpp
// DetectorConstruction.cc
#include "G4GeometrySampler.hh"
#include "G4IStore.hh"
#include "G4NistManager.hh"
#include "G4Box.hh"
#include "G4LogicalVolume.hh"
#include "G4PVPlacement.hh"

class ShieldingDetectorConstruction : public G4VUserDetectorConstruction
{
public:
    virtual G4VPhysicalVolume* Construct() override
    {
        G4NistManager* nist = G4NistManager::Instance();

        // World
        G4Material* air = nist->FindOrBuildMaterial("G4_AIR");
        G4Box* worldBox = new G4Box("World", 5*m, 5*m, 5*m);
        G4LogicalVolume* worldLogical =
            new G4LogicalVolume(worldBox, air, "World");
        fWorldPhysical =
            new G4PVPlacement(0, G4ThreeVector(), worldLogical,
                             "World", 0, false, 0);

        // Source region
        G4Box* sourceBox = new G4Box("Source", 50*cm, 50*cm, 50*cm);
        G4LogicalVolume* sourceLogical =
            new G4LogicalVolume(sourceBox, air, "Source");
        fSourcePhysical =
            new G4PVPlacement(0, G4ThreeVector(0,0,-3*m), sourceLogical,
                             "Source", worldLogical, false, 0);

        // Concrete shielding layers (4 layers, each 1 m thick)
        G4Material* concrete = nist->FindOrBuildMaterial("G4_CONCRETE");

        for (G4int i = 0; i < 4; i++) {
            G4String name = "Shield" + std::to_string(i+1);
            G4Box* shieldBox = new G4Box(name, 2*m, 2*m, 50*cm);
            G4LogicalVolume* shieldLogical =
                new G4LogicalVolume(shieldBox, concrete, name);

            G4double z_pos = -1.5*m + i * 1.0*m;
            G4VPhysicalVolume* shieldPhysical =
                new G4PVPlacement(0, G4ThreeVector(0, 0, z_pos),
                                 shieldLogical, name, worldLogical,
                                 false, i);

            fShieldPhysicals.push_back(shieldPhysical);
        }

        // Detector region
        G4Box* detectorBox = new G4Box("Detector", 1*m, 1*m, 10*cm);
        G4LogicalVolume* detectorLogical =
            new G4LogicalVolume(detectorBox, air, "Detector");
        fDetectorPhysical =
            new G4PVPlacement(0, G4ThreeVector(0, 0, 2.5*m),
                             detectorLogical, "Detector",
                             worldLogical, false, 0);

        return fWorldPhysical;
    }

    virtual void ConstructSDandField() override
    {
        // ===== Setup Importance Sampling =====

        G4IStore* importanceStore = G4IStore::GetInstance();

        // Assign importance values
        // Exponentially increasing toward detector
        importanceStore->AddImportanceGeometryCell(1.0, *fWorldPhysical);
        importanceStore->AddImportanceGeometryCell(1.0, *fSourcePhysical);

        // Shielding layers: importance doubles each layer
        G4double importance = 2.0;
        for (auto physical : fShieldPhysicals) {
            importanceStore->AddImportanceGeometryCell(importance, *physical);
            importance *= 2.0;  // 2, 4, 8, 16
        }

        // Detector: highest importance
        importanceStore->AddImportanceGeometryCell(32.0, *fDetectorPhysical);

        // Create geometry sampler
        G4GeometrySampler* geoSampler =
            new G4GeometrySampler(fWorldPhysical, "neutron");

        // Configure importance sampling
        geoSampler->PrepareImportanceSampling(importanceStore, nullptr);

        // Optional: Add weight roulette to prevent small weights
        geoSampler->PrepareWeightRoulett(
            0.5,   // survival weight
            0.25,  // lower limit
            1.0    // source weight
        );

        // Apply configuration
        geoSampler->Configure();

        // Print configuration
        G4cout << "\n========================================" << G4endl;
        G4cout << "Importance Sampling Configuration:" << G4endl;
        G4cout << "  Particle: neutron" << G4endl;
        G4cout << "  Geometry: 4 m concrete shielding" << G4endl;
        G4cout << "  Importance progression:" << G4endl;
        G4cout << "    Source:    1" << G4endl;
        G4cout << "    Shield 1:  2" << G4endl;
        G4cout << "    Shield 2:  4" << G4endl;
        G4cout << "    Shield 3:  8" << G4endl;
        G4cout << "    Shield 4: 16" << G4endl;
        G4cout << "    Detector: 32" << G4endl;
        G4cout << "  Expected speedup: ~10-100x" << G4endl;
        G4cout << "========================================\n" << G4endl;

        // Attach sensitive detector
        // ...
    }

private:
    G4VPhysicalVolume* fWorldPhysical;
    G4VPhysicalVolume* fSourcePhysical;
    std::vector<G4VPhysicalVolume*> fShieldPhysicals;
    G4VPhysicalVolume* fDetectorPhysical;
};
```

### Expected Performance

**For the above configuration:**

```
Without biasing:
  - Need ~10⁶ particles for good statistics in detector
  - Most particles absorbed in shielding
  - Low efficiency

With importance sampling:
  - Need ~10⁴-10⁵ particles for same statistics
  - Particles split approaching detector
  - 10-100x speedup typical
  - Efficiency gain depends on shielding thickness
```

## Multiple Particle Types

### Setup Different Samplers

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Importance store shared between particles
    G4IStore* importanceStore = G4IStore::GetInstance();

    // Assign importance values (same for all particles)
    importanceStore->AddImportanceGeometryCell(1.0, *fWorldPhysical);
    importanceStore->AddImportanceGeometryCell(4.0, *fShieldPhysical);
    importanceStore->AddImportanceGeometryCell(16.0, *fDetectorPhysical);

    // Create sampler for neutrons
    G4GeometrySampler* neutronSampler =
        new G4GeometrySampler(fWorldPhysical, "neutron");
    neutronSampler->PrepareImportanceSampling(importanceStore, nullptr);
    neutronSampler->Configure();

    // Create sampler for photons
    G4GeometrySampler* photonSampler =
        new G4GeometrySampler(fWorldPhysical, "gamma");
    photonSampler->PrepareImportanceSampling(importanceStore, nullptr);
    photonSampler->Configure();

    G4cout << "Importance sampling configured for neutrons and photons"
           << G4endl;
}
```

## Best Practices

### 1. Gradual Importance Changes

```cpp
// GOOD: Gradual increase (factor of 2-4)
World:     1
Shield1:   2
Shield2:   4
Shield3:   8
Detector: 16

// POOR: Too aggressive (factor of 16)
World:       1
Shield:     16
Detector:  256
```

### 2. Monitor Weight Statistics

```cpp
// Track weight distribution in run action
void RunAction::EndOfRunAction(const G4Run* run)
{
    G4cout << "Weight statistics:" << G4endl;
    G4cout << "  Mean: " << fWeightSum / fNParticles << G4endl;
    G4cout << "  Min: " << fMinWeight << G4endl;
    G4cout << "  Max: " << fMaxWeight << G4endl;
    G4cout << "  Range: " << fMaxWeight / fMinWeight << G4endl;

    // Warning if weight range too large
    if (fMaxWeight / fMinWeight > 10000) {
        G4cout << "WARNING: Large weight range may indicate "
               << "poor importance function" << G4endl;
    }
}
```

### 3. Use Weight Roulette

```cpp
// Always add weight roulette to prevent tiny weights
geoSampler->PrepareImportanceSampling(importanceStore, nullptr);
geoSampler->PrepareWeightRoulett(0.5, 0.25, 1.0);  // Add this!
geoSampler->Configure();
```

### 4. Validate Results

```cpp
// Run analog simulation for comparison
// Compare:
//   1. Mean results (should agree)
//   2. Variance (should be reduced with biasing)
//   3. Figure of merit (should increase)

// FOM = 1 / (σ² × CPU_time)
```

### 5. Document Configuration

```cpp
virtual void ConstructSDandField() override
{
    // ... setup ...

    geoSampler->Configure();

    // Print detailed configuration
    G4cout << "\n==========================================" << G4endl;
    G4cout << "IMPORTANCE SAMPLING CONFIGURATION" << G4endl;
    G4cout << "==========================================" << G4endl;
    G4cout << "Particle: " << particleName << G4endl;
    G4cout << "Method: Geometry-based importance" << G4endl;
    G4cout << "\nImportance Map:" << G4endl;
    // ... print each region and importance ...
    G4cout << "==========================================\n" << G4endl;
}
```

## Troubleshooting

### Problem: No Effect from Biasing

**Possible Causes:**
1. Forgot to call `Configure()`
2. Importance values all the same (no splitting/killing)
3. Wrong particle name

**Solution:**
```cpp
// Verify configuration
G4cout << "Is configured: " << geoSampler->IsConfigured() << G4endl;

// Check importance values
G4cout << "Importance in detector: "
       << importanceStore->GetImportance(*fDetectorPhysical) << G4endl;
```

### Problem: Weight Explosion

**Cause:** Too aggressive importance changes

**Solution:**
```cpp
// Reduce importance ratios
// Use factors of 2-4 instead of 8-16

// Add weight roulette
geoSampler->PrepareWeightRoulett(0.5, 0.25, 1.0);
```

### Problem: Results Don't Match Analog

**Cause:** Scoring doesn't account for weights

**Solution:**
```cpp
// In sensitive detector
G4double weight = step->GetTrack()->GetWeight();
G4double edep = step->GetTotalEnergyDeposit();

fTotalScore += weight * edep;  // Include weight!
```

## See Also

- [G4ImportanceProcess](./g4importanceprocess.md) - Underlying importance process
- [G4ImportanceConfigurator](./g4importanceconfigurator.md) - Configuration class
- [G4VSampler](./g4vsampler.md) - Base sampler interface
- [Biasing Overview](../) - Complete variance reduction guide

---

**File:** `source/processes/biasing/importance/include/G4GeometrySampler.hh`
**Lines:** 48-97
**Author:** Michael Dressel, CERN
