# G4OpRayleigh

## Overview

`G4OpRayleigh` is a discrete process that simulates Rayleigh scattering of optical photons in materials. Rayleigh scattering is elastic scattering by particles much smaller than the wavelength of light, exhibiting the characteristic λ^-4^ wavelength dependence.

::: tip Class Information
**Header:** `source/processes/optical/include/G4OpRayleigh.hh`
**Source:** `source/processes/optical/src/G4OpRayleigh.cc`
**Inherits:** `G4VDiscreteProcess`
**Process Type:** `fOptical`
**Process Subtype:** `fOpRayleigh` (33)
:::

## Purpose

The Rayleigh scattering process simulates elastic scattering of optical photons, crucial for:

- **Water Cherenkov Detectors** - Dominant scattering mechanism in pure water
- **Large Volume Detectors** - Photon angular distribution after long propagation
- **Atmospheric Optics** - Blue sky color (why sky is blue)
- **Transparent Media** - Light diffusion in scintillators, optics
- **Wavelength Studies** - Strong wavelength dependence affects spectral response

## Physics Background

### Rayleigh Scattering Theory

Rayleigh scattering occurs when light interacts with particles or density fluctuations much smaller than the wavelength:

**Scattering Cross Section:**
```
σ ∝ 1/λ⁴
```

**Key Characteristics:**
- **Elastic:** Photon energy unchanged (no energy loss)
- **Isotropic:** Near-uniform angular distribution (slight forward preference)
- **Wavelength Dependent:** Strong scattering at short wavelengths (blue)
- **Polarization Dependent:** Scattering depends on polarization

**Physical Origin:**
- Molecular fluctuations in liquids/gases
- Density variations in transparent solids
- Random orientation of molecules

### Scattering Length Formula

The Rayleigh scattering length can be calculated from material properties:

```
λR = (1 / β) * (λ/λ₀)⁴ * (T/T₀)
```

Where:
- β is isothermal compressibility
- λ is photon wavelength
- λ₀ is reference wavelength
- T is temperature
- T₀ is reference temperature

### Angular Distribution

The scattering angular distribution follows:

```
dσ/dΩ ∝ (1 + cos²θ)
```

Where θ is scattering angle. This gives:
- Slight forward preference
- Slight backward preference
- Minimum at 90°

## Class Interface

### Constructor

```cpp
explicit G4OpRayleigh(const G4String& processName = "OpRayleigh",
                      G4ProcessType type          = fOptical);
```

**Parameters:**
- `processName` - Process name (default: "OpRayleigh")
- `type` - Process type (default: `fOptical`)

**Location:** Lines 56-57 in G4OpRayleigh.hh

### Destructor

```cpp
virtual ~G4OpRayleigh();
```

**Location:** Line 58

### Key Public Methods

#### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aParticleType) override;
```

**Returns:** `true` only for `G4OpticalPhoton`

**Implementation:** Lines 106-110

```cpp
inline G4bool G4OpRayleigh::IsApplicable(
  const G4ParticleDefinition& aParticleType)
{
  return (&aParticleType == G4OpticalPhoton::OpticalPhoton());
}
```

**Purpose:** Ensures process only acts on optical photons

#### BuildPhysicsTable

```cpp
virtual void BuildPhysicsTable(
  const G4ParticleDefinition& aParticleType) override;
```

**Purpose:** Build physics table at initialization (lines 64-66)

**Details:**
- Calls `CalculateRayleighMeanFreePaths()` for each material
- Constructs wavelength-dependent scattering length tables
- Executed once at start of run

#### GetMeanFreePath

```cpp
virtual G4double GetMeanFreePath(const G4Track& aTrack, G4double,
                                 G4ForceCondition*) override;
```

**Returns:** Rayleigh scattering length for current material and photon energy

**Purpose:** Provides mean free path for scattering interaction (lines 68-69)

**Details:**
- Retrieves value from physics table
- If `RAYLEIGH` property defined, uses that directly
- Otherwise uses calculated values from material properties
- Returns DBL_MAX if not applicable

#### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(const G4Track& aTrack,
                                        const G4Step& aStep) override;
```

**Returns:** Particle change with new momentum direction (and polarization)

**Purpose:** Implements Rayleigh scattering - changes direction, preserves energy (lines 72-74)

**Behavior:**
- Samples new direction from (1 + cos²θ) distribution
- Rotates photon polarization consistently
- Preserves photon energy (elastic scattering)
- Track continues with new direction

#### GetPhysicsTable

```cpp
virtual G4PhysicsTable* GetPhysicsTable() const;
```

**Returns:** Pointer to the physics table (lines 76-77, 120-123)

**Implementation:**
```cpp
inline G4PhysicsTable* G4OpRayleigh::GetPhysicsTable() const
{
  return thePhysicsTable;
}
```

**Usage:** Access scattering length data for analysis

#### DumpPhysicsTable

```cpp
virtual void DumpPhysicsTable() const;
```

**Purpose:** Print physics table contents for debugging (lines 79-80, 112-118)

**Implementation:**
```cpp
inline void G4OpRayleigh::DumpPhysicsTable() const
{
  for(size_t i = 0; i < thePhysicsTable->entries(); ++i)
  {
    ((G4PhysicsFreeVector*) (*thePhysicsTable)[i])->DumpValues();
  }
}
```

#### PreparePhysicsTable

```cpp
virtual void PreparePhysicsTable(const G4ParticleDefinition&) override;
```

**Purpose:** Prepare physics tables before run (line 82)

#### Initialise

```cpp
virtual void Initialise();
```

**Purpose:** Initialize process state (line 83)

#### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int);
```

**Purpose:** Control diagnostic output verbosity (line 85)

## Protected Members

### Physics Table

```cpp
G4PhysicsTable* thePhysicsTable;
```

**Purpose:** Stores Rayleigh scattering length vs photon energy for all materials (line 88)

**Structure:**
- One `G4PhysicsFreeVector` per material
- Energy (photon energy) vs scattering length
- Built at initialization, used during tracking

## Private Methods

### CalculateRayleighMeanFreePaths

```cpp
G4PhysicsFreeVector* CalculateRayleighMeanFreePaths(
  const G4Material* material) const;
```

**Returns:** Physics vector of scattering length vs energy for given material

**Purpose:** Calculate Rayleigh scattering lengths from material properties (lines 96-97)

**Calculation Methods:**
1. **If RAYLEIGH property defined:** Use directly
2. **If compressibility available:** Calculate from formula
3. **Otherwise:** Return nullptr (no Rayleigh scattering)

### Member Variables

```cpp
size_t idx_rslength = 0;
```

**Purpose:** Cached index for RAYLEIGH property (line 99)

## Material Properties

### Optional Properties

#### RAYLEIGH

**Property Name:** `"RAYLEIGH"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Length (cm, m)

**Definition:** Rayleigh scattering length vs photon energy

**Example:**
```cpp
std::vector<G4double> photonEnergy = {
    2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV
};

// Scattering length follows 1/λ⁴ ∝ E⁴
std::vector<G4double> rayleighLength = {
    100*cm,  // Red (low energy) - long scattering length
    40*cm,
    20*cm,   // Green
    10*cm,
    5*cm     // Blue (high energy) - short scattering length
};

materialMPT->AddProperty("RAYLEIGH", photonEnergy, rayleighLength);
```

**Alternative:** If not defined, process can calculate from:
- Material density
- Isothermal compressibility
- Temperature

## Usage Examples

### Example 1: Water Cherenkov Detector

```cpp
// Pure water with Rayleigh scattering
G4MaterialPropertiesTable* waterMPT = new G4MaterialPropertiesTable();

// Refractive index (required)
std::vector<G4double> energy = {
    1.5*eV, 2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV
};
std::vector<G4double> rindex = {
    1.33, 1.33, 1.34, 1.34, 1.35, 1.35
};
waterMPT->AddProperty("RINDEX", energy, rindex);

// Rayleigh scattering length (measured data for pure water)
std::vector<G4double> rayleigh = {
    167*cm,   // 1.5 eV (near-IR)
    100*cm,   // 2.0 eV (red)
    50*cm,    // 2.5 eV (green)
    30*cm,    // 3.0 eV (blue)
    20*cm,    // 3.5 eV (UV)
    15*cm     // 4.0 eV
};
waterMPT->AddProperty("RAYLEIGH", energy, rayleigh);

// Absorption (also important)
std::vector<G4double> absorption = {
    50*cm, 100*cm, 200*cm, 300*cm, 100*cm, 50*cm
};
waterMPT->AddProperty("ABSLENGTH", energy, absorption);

water->SetMaterialPropertiesTable(waterMPT);
```

### Example 2: Liquid Scintillator

```cpp
// Liquid scintillator with moderate Rayleigh scattering
G4MaterialPropertiesTable* lsMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

// Refractive index
std::vector<G4double> rindex = {1.47, 1.48, 1.48, 1.49, 1.49};
lsMPT->AddProperty("RINDEX", energy, rindex);

// Rayleigh scattering (weaker than water)
std::vector<G4double> rayleigh = {
    10*m,     // Red - very long
    4*m,
    2*m,      // Blue
    1*m,
    60*cm     // UV
};
lsMPT->AddProperty("RAYLEIGH", energy, rayleigh);

// Scintillation properties
std::vector<G4double> scintSpectrum = {0.0, 0.2, 1.0, 0.5, 0.1};
lsMPT->AddProperty("SCINTILLATIONCOMPONENT1", energy, scintSpectrum);
lsMPT->AddConstProperty("SCINTILLATIONYIELD", 10000./MeV);
lsMPT->AddConstProperty("RESOLUTIONSCALE", 1.0);

liquidScintillator->SetMaterialPropertiesTable(lsMPT);
```

### Example 3: Acrylic Light Guide

```cpp
// Acrylic (PMMA) with wavelength-dependent scattering
G4MaterialPropertiesTable* acrylicMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

std::vector<G4double> rindex = {1.49, 1.49, 1.49, 1.50, 1.50};
acrylicMPT->AddProperty("RINDEX", energy, rindex);

// Rayleigh scattering in acrylic
std::vector<G4double> rayleigh = {
    5*m,      // Low scattering in red
    2*m,
    1*m,
    50*cm,
    30*cm     // Higher scattering in UV
};
acrylicMPT->AddProperty("RAYLEIGH", energy, rayleigh);

// Very long absorption length (transparent)
std::vector<G4double> absorption = {10*m, 15*m, 20*m, 15*m, 10*m};
acrylicMPT->AddProperty("ABSLENGTH", energy, absorption);

acrylic->SetMaterialPropertiesTable(acrylicMPT);
```

### Example 4: Atmosphere (Air)

```cpp
// Air with Rayleigh scattering (why sky is blue)
G4MaterialPropertiesTable* airMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    1.77*eV,  // 700 nm (red)
    2.07*eV,  // 600 nm (orange)
    2.48*eV,  // 500 nm (green)
    3.10*eV,  // 400 nm (blue)
    3.54*eV   // 350 nm (UV)
};

std::vector<G4double> rindex = {
    1.000293, 1.000293, 1.000293, 1.000293, 1.000293
};
airMPT->AddProperty("RINDEX", energy, rindex);

// Rayleigh scattering: much stronger for blue than red
// Approximately λ⁻⁴ dependence
std::vector<G4double> rayleigh = {
    90*km,    // Red - very little scattering
    50*km,
    25*km,    // Green
    10*km,    // Blue - strong scattering
    6*km      // UV - very strong scattering
};
airMPT->AddProperty("RAYLEIGH", energy, rayleigh);

air->SetMaterialPropertiesTable(airMPT);
```

### Example 5: Analyzing Scattering Events

```cpp
// In UserSteppingAction
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
  // Check for Rayleigh scattering
  if (step->GetTrack()->GetDefinition() == G4OpticalPhoton::Definition())
  {
    const G4VProcess* process =
        step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process && process->GetProcessName() == "OpRayleigh")
    {
      // Rayleigh scattering occurred
      G4ThreeVector oldDirection = step->GetPreStepPoint()->GetMomentumDirection();
      G4ThreeVector newDirection = step->GetPostStepPoint()->GetMomentumDirection();

      // Calculate scattering angle
      G4double cosTheta = oldDirection.dot(newDirection);
      G4double scatteringAngle = std::acos(cosTheta);

      // Record scattering
      analysisManager->FillH1(1, scatteringAngle/degree);  // Angular distribution

      G4double energy = step->GetTrack()->GetKineticEnergy();
      analysisManager->FillH1(2, energy/eV);  // Wavelength dependence

      // Count scattering events
      fNumRayleighScatters++;
    }
  }
}
```

### Example 6: Comparing Rayleigh vs Absorption

```cpp
// Material where both processes compete
G4MaterialPropertiesTable* mpt = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

std::vector<G4double> rindex = {1.50, 1.50, 1.50, 1.50, 1.50};
mpt->AddProperty("RINDEX", energy, rindex);

// Rayleigh scattering length
std::vector<G4double> rayleigh = {
    100*cm, 50*cm, 30*cm, 20*cm, 15*cm
};
mpt->AddProperty("RAYLEIGH", energy, rayleigh);

// Absorption length (competition)
std::vector<G4double> absorption = {
    200*cm, 200*cm, 150*cm, 100*cm, 50*cm  // Absorption more important at high E
};
mpt->AddProperty("ABSLENGTH", energy, absorption);

// Effective attenuation: 1/λ_eff = 1/λ_rayleigh + 1/λ_abs
// At 2.0 eV: λ_eff = 67 cm (dominated by scattering)
// At 4.0 eV: λ_eff = 12 cm (dominated by absorption)

material->SetMaterialPropertiesTable(mpt);
```

## Process Registration

### In Physics List

```cpp
void MyOpticalPhysics::ConstructProcess()
{
  G4ProcessManager* pManager =
      G4OpticalPhoton::OpticalPhoton()->GetProcessManager();

  // Register Rayleigh scattering
  G4OpRayleigh* rayleigh = new G4OpRayleigh();
  rayleigh->SetVerboseLevel(1);  // Optional: enable verbose output
  pManager->AddDiscreteProcess(rayleigh);

  // Also register other processes
  pManager->AddDiscreteProcess(new G4OpAbsorption());
  pManager->AddDiscreteProcess(new G4OpBoundaryProcess());
}
```

## Physics Details

### Angular Distribution Sampling

The scattering angle is sampled from the distribution:

```cpp
dP/dΩ ∝ (1 + cos²θ)
```

**Implementation:**
1. Generate random number r ∈ [0,1]
2. Solve: cos θ = ... (from cumulative distribution)
3. Sample azimuthal angle φ uniformly

**Result:**
- Forward scattering: ~32% probability
- 90° scattering: ~24% probability (minimum)
- Backward scattering: ~32% probability

### Polarization Effects

The scattering preserves and rotates polarization:

1. Decompose polarization into components parallel and perpendicular to scattering plane
2. Apply polarization-dependent scattering
3. Rotate polarization vector consistently with new direction

### Energy Conservation

Rayleigh scattering is **elastic**:
- Photon energy unchanged
- Photon wavelength unchanged
- Only direction changes

### Wavelength Dependence

The λ^-4^ dependence means:
- Blue light (λ = 400 nm) scatters ~9× more than red light (λ = 700 nm)
- This is why sky appears blue and sunsets appear red

## Performance Considerations

### Optimization Tips

1. **Physics table:**
   - Built once at initialization
   - Fast lookup during tracking
   - No per-event overhead

2. **Material properties:**
   - Define RAYLEIGH only where needed
   - Use minimal energy points that capture λ^-4^ behavior
   - Typically 5-10 points sufficient

3. **Process ordering:**
   - Register after absorption (shorter processes first)
   - Before boundary process

### Common Issues

1. **Missing RAYLEIGH property:**
   - Process returns DBL_MAX (no scattering)
   - This is correct for materials without scattering

2. **Incorrect wavelength dependence:**
   - Should follow ~λ^-4^ (or ~E^4^ in energy)
   - Check with DumpPhysicsTable()

3. **Too short scattering length:**
   - Photons scatter many times
   - Can slow simulation significantly
   - Verify values are realistic

4. **Scattering vs absorption:**
   - Both compete for photon fate
   - Effective attenuation is sum of rates

## Typical Rayleigh Scattering Lengths

### Common Materials (at 400 nm)

| Material | Scattering Length | Notes |
|----------|-------------------|-------|
| Pure Water | ~30 cm | Dominant process in Cherenkov detectors |
| Air (sea level) | ~10 km | Why sky is blue |
| Fused Silica | ~100 m | Extremely transparent |
| Acrylic (PMMA) | ~30 cm | Light guides |
| Liquid Scintillator | 1-10 m | Varies with purity |
| Polystyrene | ~50 cm | Plastic scintillators |

**Note:** All values increase dramatically (×10-100) at longer wavelengths due to λ^-4^ dependence.

## Validation

The Rayleigh scattering process has been validated against:

- Theoretical (1 + cos²θ) angular distribution
- Wavelength dependence measurements in water
- Super-Kamiokande detector data
- Atmospheric scattering observations

## Physics Formula Summary

**Scattering Cross Section:**
```
σ_Rayleigh ∝ (1/λ⁴) × (1 + cos²θ)
```

**Scattering Length:**
```
λ_scatter = 1 / (n × σ_Rayleigh)
```

Where n is number density of scatterers.

**Mean Scattering Angle:**
Slightly forward-peaked but nearly isotropic:
- ⟨cos θ⟩ ≈ 0 (average is perpendicular)
- ⟨cos² θ⟩ ≈ 0.5

## References

### Source Files
- **Header:** `source/processes/optical/include/G4OpRayleigh.hh` - Lines 1-126
- **Implementation:** `source/processes/optical/src/G4OpRayleigh.cc`

### Related Classes
- [G4OpAbsorption](./g4opabsorption.md) - Competing absorption process
- [G4OpMieHG](./g4opmiehg.md) - Mie scattering (larger particles)
- [G4MaterialPropertiesTable](../../materials/api/g4materialpropertiestable.md)
- [G4OpticalPhoton](../../particles/api/g4opticalphoton.md)

### Original Implementation
- **Created:** 1996-05-31
- **Author:** Juliet Armstrong
- **Updated:** 1997-04-09 by Peter Gumplinger (new physics/tracking scheme)
- **Updated:** 2014-08-20 (allow for more material types)

### Physical References
- Lord Rayleigh, "On the scattering of light by small particles," Phil. Mag. (1871)
- Chandrasekhar, "Radiative Transfer" (1960)

[Back to Optical Processes Overview](../index.md)
