# G4OpAbsorption

## Overview

`G4OpAbsorption` is a discrete process that simulates bulk absorption of optical photons in materials. This process accounts for wavelength-dependent absorption as photons propagate through transparent or semi-transparent media.

::: tip Class Information
**Header:** `source/processes/optical/include/G4OpAbsorption.hh`
**Source:** `source/processes/optical/src/G4OpAbsorption.cc`
**Inherits:** `G4VDiscreteProcess`
**Process Type:** `fOptical`
**Process Subtype:** `fOpAbsorption` (31)
:::

## Purpose

The absorption process simulates the attenuation of optical photons as they travel through materials. Key applications include:

- **Light Attenuation** - Modeling photon loss in long light guides or fibers
- **Material Transparency** - Simulating wavelength-dependent transmission
- **Detector Media** - Absorption in scintillators, water, or optical materials
- **Filter Simulation** - Color filters and absorbing media

## Physics Background

### Beer-Lambert Law

Bulk absorption follows the Beer-Lambert law, where the intensity of light decreases exponentially with distance:

```
I(x) = I₀ * exp(-x/λabs)
```

Where:
- I(x) is intensity at distance x
- I₀ is initial intensity
- λabs is the absorption length

The absorption length is wavelength-dependent and defined through the material properties table using the `ABSLENGTH` property.

### Absorption vs Scattering

**Absorption** (this process):
- Photon is killed
- Energy is lost from the optical system
- No direction change before absorption

**Scattering** (G4OpRayleigh, G4OpMieHG):
- Photon continues with new direction
- Energy is conserved
- Multiple scattering events possible

## Class Interface

### Constructor

```cpp
explicit G4OpAbsorption(const G4String& processName = "OpAbsorption",
                        G4ProcessType type          = fOptical);
```

**Parameters:**
- `processName` - Process name (default: "OpAbsorption")
- `type` - Process type (default: `fOptical`)

**Location:** Lines 55-56 in G4OpAbsorption.hh

### Destructor

```cpp
virtual ~G4OpAbsorption();
```

**Location:** Line 57

### Key Public Methods

#### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aParticleType) override;
```

**Returns:** `true` only for `G4OpticalPhoton`

**Implementation:** Lines 87-91

```cpp
inline G4bool G4OpAbsorption::IsApplicable(
  const G4ParticleDefinition& aParticleType)
{
  return (&aParticleType == G4OpticalPhoton::OpticalPhoton());
}
```

**Purpose:** Ensures process only acts on optical photons

#### GetMeanFreePath

```cpp
virtual G4double GetMeanFreePath(const G4Track& aTrack, G4double,
                                 G4ForceCondition*) override;
```

**Returns:** Absorption length for the current material and photon energy

**Purpose:** Returns the absorption length from material properties (lines 63-64)

**Details:**
- Retrieves `ABSLENGTH` from material properties table
- Interpolates for current photon energy
- Returns DBL_MAX if property not defined

**Example:**
If material has `ABSLENGTH` = 50 cm at photon energy, the mean free path is 50 cm.

#### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(const G4Track& aTrack,
                                        const G4Step& aStep) override;
```

**Returns:** Particle change that kills the photon

**Purpose:** Main method implementing bulk absorption (lines 68-70)

**Behavior:**
- Kills the optical photon track
- Deposits zero energy (absorbed into material bulk)
- No secondary particles created

#### PreparePhysicsTable

```cpp
virtual void PreparePhysicsTable(const G4ParticleDefinition&) override;
```

**Purpose:** Prepare physics tables before run starts (line 72)

#### Initialise

```cpp
virtual void Initialise();
```

**Purpose:** Initialize process state (line 74)

#### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int);
```

**Purpose:** Control diagnostic output verbosity (line 76)

**Usage:**
```cpp
G4OpAbsorption* absorption = new G4OpAbsorption();
absorption->SetVerboseLevel(1);  // Enable verbose output
```

## Member Variables

### Property Index

```cpp
size_t idx_absorption = 0;
```

**Purpose:** Cached index for fast access to ABSLENGTH property (line 82)

**Details:** Optimization to avoid repeated property name lookups

## Material Properties

### Required Properties

The absorption process requires the following material property:

#### ABSLENGTH

**Property Name:** `"ABSLENGTH"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Length (typically cm or m)

**Definition:** Mean free path for photon absorption

**Example:**
```cpp
std::vector<G4double> photonEnergy = {
    2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV
};
std::vector<G4double> absLength = {
    100*cm, 80*cm, 60*cm, 40*cm, 30*cm  // Shorter at higher energy
};

materialMPT->AddProperty("ABSLENGTH", photonEnergy, absLength);
```

**Physical Interpretation:**
- Large values (>1 m): Nearly transparent material
- Medium values (cm scale): Semi-transparent material
- Small values (<mm): Strongly absorbing material

## Usage Examples

### Example 1: Transparent Material (Glass)

```cpp
// Optical-grade glass with long absorption length
G4MaterialPropertiesTable* glassMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    1.5*eV,    // IR
    2.0*eV,
    2.5*eV,
    3.0*eV,    // Visible
    3.5*eV,
    4.0*eV,
    4.5*eV     // UV
};

std::vector<G4double> absorption = {
    10*m,      // Very transparent in IR
    15*m,
    20*m,      // Most transparent in visible
    15*m,
    10*m,
    5*m,
    1*m        // Absorbs UV
};

glassMPT->AddProperty("ABSLENGTH", energy, absorption);
glass->SetMaterialPropertiesTable(glassMPT);
```

### Example 2: Water (Wavelength-Dependent Absorption)

```cpp
// Water absorption based on measured data
G4MaterialPropertiesTable* waterMPT = new G4MaterialPropertiesTable();

// Water is most transparent in blue, absorbs red and UV
std::vector<G4double> energy = {
    1.5*eV,    // IR - strongly absorbed
    2.0*eV,    // Red - absorbed
    2.5*eV,    // Green - less absorption
    3.0*eV,    // Blue - most transparent
    3.5*eV,    // UV - absorbed
    4.0*eV
};

std::vector<G4double> waterAbs = {
    10*cm,     // Strong IR absorption
    50*cm,     // Red absorption
    10*m,      // Transparent to green
    100*m,     // Very transparent to blue
    10*m,      // UV absorption
    1*m
};

waterMPT->AddProperty("ABSLENGTH", energy, waterAbs);
water->SetMaterialPropertiesTable(waterMPT);
```

### Example 3: Scintillator Material

```cpp
// Plastic scintillator - transparent to own emission
G4MaterialPropertiesTable* scintMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    2.0*eV,    // Red
    2.5*eV,    // Green - scintillation emission region
    3.0*eV,    // Blue
    3.5*eV,    // UV
    4.0*eV
};

std::vector<G4double> scintAbs = {
    1*m,       // Transparent to red
    5*m,       // Very transparent to own light (green-blue)
    4*m,
    2*m,       // Some UV absorption
    50*cm      // Stronger UV absorption
};

scintMPT->AddProperty("ABSLENGTH", energy, scintAbs);
scintillator->SetMaterialPropertiesTable(scintMPT);
```

### Example 4: Color Filter (Red Filter)

```cpp
// Red filter - absorbs blue/green, transmits red
G4MaterialPropertiesTable* redFilterMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    1.8*eV,    // Deep red
    2.0*eV,    // Red
    2.3*eV,    // Orange
    2.5*eV,    // Yellow/Green - start absorption
    3.0*eV,    // Blue - strong absorption
    3.5*eV     // UV
};

std::vector<G4double> filterAbs = {
    10*cm,     // Transmits red (10 cm for 3mm filter = ~97% transmission)
    10*cm,
    5*cm,
    0.5*cm,    // Strong absorption of green
    0.1*cm,    // Very strong absorption of blue
    0.05*cm    // Nearly opaque to UV
};

redFilterMPT->AddProperty("ABSLENGTH", energy, filterAbs);
redFilter->SetMaterialPropertiesTable(redFilterMPT);
```

### Example 5: Optical Fiber Core

```cpp
// High-quality optical fiber with very low loss
G4MaterialPropertiesTable* fiberMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 3.0*eV, 4.0*eV};

// Typical fiber attenuation: ~1 dB/km at 1550 nm
// 1 dB/km ≈ 4.3 km absorption length
std::vector<G4double> fiberAbs = {
    5*km,      // Excellent transmission
    5*km,
    2*km       // Slightly higher loss at shorter wavelengths
};

fiberMPT->AddProperty("ABSLENGTH", energy, fiberAbs);
fiberCore->SetMaterialPropertiesTable(fiberMPT);
```

### Example 6: Checking Absorption Events

```cpp
// In UserSteppingAction
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
  // Check if optical photon was absorbed
  if (step->GetTrack()->GetDefinition() == G4OpticalPhoton::Definition())
  {
    const G4VProcess* process =
        step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process && process->GetProcessName() == "OpAbsorption")
    {
      // Photon was absorbed
      G4ThreeVector position = step->GetPostStepPoint()->GetPosition();
      G4double energy = step->GetTrack()->GetKineticEnergy();

      // Record absorption event
      analysisManager->FillH1(1, energy/eV);  // Absorption spectrum
      analysisManager->FillH3(2,
                              position.x()/cm,
                              position.y()/cm,
                              position.z()/cm);  // Absorption position
    }
  }
}
```

## Process Registration

### In Physics List

```cpp
void MyOpticalPhysics::ConstructProcess()
{
  // Get optical photon process manager
  G4ProcessManager* pManager =
      G4OpticalPhoton::OpticalPhoton()->GetProcessManager();

  // Register absorption process
  G4OpAbsorption* absorption = new G4OpAbsorption();
  pManager->AddDiscreteProcess(absorption);

  // Also register other optical processes
  pManager->AddDiscreteProcess(new G4OpRayleigh());
  pManager->AddDiscreteProcess(new G4OpBoundaryProcess());
  // ... etc
}
```

### Process Ordering

Order matters when multiple processes compete:

```cpp
// Recommended order:
// 1. Absorption
// 2. Rayleigh scattering
// 3. Mie scattering
// 4. WLS processes
// 5. Boundary process (last - only acts at boundaries)
```

## Physics Details

### Mean Free Path Calculation

The process samples the absorption interaction point using:

```cpp
G4double MeanFreePath = GetMeanFreePath(track, ...);
G4double pathLength = -MeanFreePath * log(G4UniformRand());
```

This gives exponential attenuation consistent with Beer-Lambert law.

### Energy Deposition

When a photon is absorbed:
- Track status set to `fStopAndKill`
- **No energy deposited** (absorbed into material bulk, not localized)
- No secondaries created

This differs from boundary process detection (which deposits energy).

### Interaction with Other Processes

**Competition with scattering:**
- If absorption length >> scattering length: Photon scatters many times before absorption
- If absorption length << scattering length: Direct absorption dominates

**Combined attenuation:**
The effective attenuation length combining absorption and scattering is:
```
1/λeff = 1/λabs + 1/λscat
```

## Performance Considerations

### Optimization Tips

1. **Set realistic absorption lengths:**
   - Don't make absorption length unnecessarily small
   - Very short absorption lengths kill photons quickly (less computation)
   - Very long absorption lengths mean photons propagate far (more computation)

2. **Energy range:**
   - Only define ABSLENGTH over relevant energy range
   - Process returns DBL_MAX for undefined energies (no absorption)

3. **Table size:**
   - Use minimum number of energy points that captures behavior
   - Geant4 interpolates between points

### Common Issues

1. **Missing ABSLENGTH:**
   - If not defined, process returns DBL_MAX (photons never absorbed)
   - This is often desired for perfectly transparent materials

2. **Unrealistic values:**
   - Very small absorption length (<μm): Nearly opaque
   - Very large absorption length (>km): May never absorb in detector

3. **Units:**
   - ABSLENGTH must have length units (cm, m, mm, etc.)
   - Common error: forgetting units multiplier

4. **Energy deposition confusion:**
   - Bulk absorption does NOT deposit energy
   - For detection, use boundary process with EFFICIENCY

## Related Processes

### Complementary Processes

- **[G4OpRayleigh](./g4oprayleigh.md)** - Scattering without absorption
- **[G4OpMieHG](./g4opmiehg.md)** - Mie scattering (forward-peaked)
- **[G4OpBoundaryProcess](./g4opboundaryprocess.md)** - Surface absorption with detection
- **[G4OpWLS](./g4opwls.md)** - Absorption followed by re-emission

### Process Differences

| Process | Photon Fate | Energy Deposition | Use Case |
|---------|-------------|-------------------|----------|
| G4OpAbsorption | Killed | None | Bulk attenuation |
| G4OpBoundaryProcess (Detection) | Killed | Photon energy | PMT/detector |
| G4OpWLS | Absorbed, re-emitted | None | Wavelength shifter |
| G4OpRayleigh | Continues (deflected) | None | Scattering |

## Validation

The absorption process has been validated against:

- Beer-Lambert law for simple absorbing media
- Measured transmission spectra of optical materials
- Water Cherenkov detector data

## Typical Absorption Length Values

### Common Materials

| Material | Wavelength Range | Absorption Length | Notes |
|----------|------------------|-------------------|-------|
| Fused Silica | 200-800 nm | 1-100 m | Very transparent |
| BK7 Glass | 380-2100 nm | 10-100 m | Optical glass |
| Water (pure) | 400-500 nm | 10-100 m | Blue light |
| Water (pure) | 600-700 nm | 1-10 m | Red light |
| Acrylic (PMMA) | 400-700 nm | 1-10 m | Visible range |
| Polystyrene Scint | 400-500 nm | 1-5 m | Self-transparent |
| Liquid Scintillator | 400-500 nm | 5-20 m | Own emission |

## References

### Source Files
- **Header:** `source/processes/optical/include/G4OpAbsorption.hh` - Lines 1-94
- **Implementation:** `source/processes/optical/src/G4OpAbsorption.cc`

### Related Classes
- [G4MaterialPropertiesTable](../../materials/api/g4materialpropertiestable.md)
- [G4OpticalPhoton](../../particles/api/g4opticalphoton.md)
- [G4VDiscreteProcess](../api/g4vdiscreteprocess.md)

### Original Implementation
- **Created:** 1996-05-21
- **Author:** Juliet Armstrong
- **Updated:** 1997-04-09 by Peter Gumplinger (new physics/tracking scheme)
- **Updated:** 1998-08-25 by Stefano Magni (material properties tables)

[Back to Optical Processes Overview](../index.md)
