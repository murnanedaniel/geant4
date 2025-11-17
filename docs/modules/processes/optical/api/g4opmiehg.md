# G4OpMieHG

## Overview

`G4OpMieHG` is a discrete process that simulates Mie scattering of optical photons using the Henyey-Greenstein phase function. Mie scattering occurs when light interacts with particles comparable to or larger than the wavelength, exhibiting strong forward scattering.

::: tip Class Information
**Header:** `source/processes/optical/include/G4OpMieHG.hh`
**Source:** `source/processes/optical/src/G4OpMieHG.cc`
**Inherits:** `G4VDiscreteProcess`
**Process Type:** `fOptical`
**Process Subtype:** `fOpMieHG` (35)
:::

## Purpose

The Mie scattering process simulates scattering from particles or inhomogeneities comparable to the wavelength, crucial for:

- **Scintillator Bulk Scattering** - Light scattering in doped scintillators
- **Cloudy Media** - Scattering from suspended particles
- **Aerogel Cherenkov Detectors** - Forward-peaked scattering in aerogel
- **Water with Particulates** - Non-Rayleigh scattering component
- **Wavelength Shifting Materials** - Scattering in doped plastics

## Physics Background

### Mie Scattering Theory

Mie scattering (named after Gustav Mie) applies when scattering particles have size comparable to wavelength:

**Particle Size Parameter:**
```
x = 2πr/λ
```

Where:
- r = particle radius
- λ = wavelength

**Scattering Regimes:**
- x << 1: Rayleigh scattering (λ^-4^ dependence)
- x ≈ 1: Mie scattering (complex, wavelength-dependent)
- x >> 1: Geometric optics

**Key Characteristics:**
- **Strong Forward Scattering:** Pronounced forward lobe
- **Weak Wavelength Dependence:** Not λ^-4^ like Rayleigh
- **Particle Size Dependent:** Scattering pattern depends on particle size
- **Elastic:** Energy conserved (like Rayleigh)

### Henyey-Greenstein Phase Function

The implementation uses the Henyey-Greenstein (HG) approximation for computational efficiency:

**Phase Function:**
```
P(cos θ) = (1 - g²) / (1 + g² - 2g·cos θ)^(3/2)
```

Where:
- θ = scattering angle
- g = asymmetry parameter (-1 to +1)
  - g = 0: Isotropic scattering
  - g > 0: Forward scattering
  - g < 0: Backward scattering

**G4OpMieHG Extension:**
Separate forward and backward components:
```
P(cos θ) = f_forward × P_forward(cos θ) + (1 - f_forward) × P_backward(cos θ)
```

This allows modeling materials with both forward and backward scattering lobes.

## Class Interface

### Constructor

```cpp
explicit G4OpMieHG(const G4String& processName = "OpMieHG",
                   G4ProcessType type          = fOptical);
```

**Parameters:**
- `processName` - Process name (default: "OpMieHG")
- `type` - Process type (default: `fOptical`)

**Location:** Lines 49-50 in G4OpMieHG.hh

### Destructor

```cpp
virtual ~G4OpMieHG();
```

**Location:** Line 51

### Key Public Methods

#### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aParticleType) override;
```

**Returns:** `true` only for `G4OpticalPhoton`

**Implementation:** Lines 77-80

```cpp
inline G4bool G4OpMieHG::IsApplicable(const G4ParticleDefinition& aParticleType)
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

**Returns:** Mie scattering length for current material and photon energy

**Purpose:** Return mean free path for Mie scattering (lines 57-59)

**Details:**
- Retrieves `MIEHG` scattering length from material properties
- Returns DBL_MAX if property not defined (no Mie scattering)

#### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(const G4Track& aTrack,
                                        const G4Step& aStep) override;
```

**Returns:** Particle change with new momentum direction

**Purpose:** Implements Mie scattering using HG phase function (lines 61-63)

**Behavior:**
- Samples scattering angle from HG distribution
- Chooses forward or backward lobe based on ratio
- Updates photon direction
- Preserves photon energy (elastic scattering)

#### PreparePhysicsTable

```cpp
virtual void PreparePhysicsTable(const G4ParticleDefinition&) override;
```

**Purpose:** Prepare physics tables before run (line 65)

#### Initialise

```cpp
virtual void Initialise();
```

**Purpose:** Initialize process state (line 66)

#### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int);
```

**Purpose:** Control diagnostic output verbosity (line 68)

## Private Members

### Property Index

```cpp
size_t idx_mie = 0;
```

**Purpose:** Cached index for MIEHG properties (line 74)

## Material Properties

### Required Properties

The Mie scattering process uses three material properties:

#### MIEHG

**Property Name:** `"MIEHG"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Length (cm, m)

**Definition:** Mean free path for Mie scattering

**Example:**
```cpp
std::vector<G4double> photonEnergy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};
std::vector<G4double> mieScatter = {
    50*cm, 50*cm, 45*cm, 40*cm, 35*cm  // Weak wavelength dependence
};

materialMPT->AddProperty("MIEHG", photonEnergy, mieScatter);
```

#### MIEHG_FORWARD

**Property Name:** `"MIEHG_FORWARD"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Dimensionless

**Range:** -1 to +1 (typically 0.8 to 0.99 for forward scattering)

**Definition:** Asymmetry parameter g for forward scattering lobe

**Example:**
```cpp
std::vector<G4double> forwardG = {
    0.90, 0.90, 0.90, 0.90, 0.90  // Strong forward scattering
};

materialMPT->AddProperty("MIEHG_FORWARD", photonEnergy, forwardG);
```

**Physical Meaning:**
- g = 0.0: Isotropic
- g = 0.5: Moderate forward preference
- g = 0.9: Strong forward scattering
- g = 0.99: Very strong forward peak

#### MIEHG_BACKWARD

**Property Name:** `"MIEHG_BACKWARD"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Dimensionless

**Range:** -1 to +1 (typically -0.9 to -0.5 for backward scattering)

**Definition:** Asymmetry parameter g for backward scattering lobe

**Example:**
```cpp
std::vector<G4double> backwardG = {
    -0.70, -0.70, -0.70, -0.70, -0.70  // Backward scattering
};

materialMPT->AddProperty("MIEHG_BACKWARD", photonEnergy, backwardG);
```

#### MIEHG_FORWARD_RATIO

**Property Name:** `"MIEHG_FORWARD_RATIO"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Dimensionless

**Range:** 0 to 1

**Definition:** Fraction of scattering that is forward (rest is backward)

**Example:**
```cpp
std::vector<G4double> forwardRatio = {
    0.80, 0.80, 0.80, 0.80, 0.80  // 80% forward, 20% backward
};

materialMPT->AddProperty("MIEHG_FORWARD_RATIO", photonEnergy, forwardRatio);
```

## Usage Examples

### Example 1: Aerogel Cherenkov Detector

```cpp
// Aerogel with strong forward Mie scattering
G4MaterialPropertiesTable* aerogelMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV
};

// Refractive index (n ~ 1.03 typical for aerogel)
std::vector<G4double> rindex = {1.03, 1.03, 1.03, 1.03, 1.03};
aerogelMPT->AddProperty("RINDEX", energy, rindex);

// Mie scattering length (dominant process in aerogel)
std::vector<G4double> mieLength = {
    3*cm, 3*cm, 2.8*cm, 2.5*cm, 2.2*cm  // Slight wavelength dependence
};
aerogelMPT->AddProperty("MIEHG", energy, mieLength);

// Strong forward scattering (g ~ 0.95)
std::vector<G4double> mieForward = {0.95, 0.95, 0.95, 0.95, 0.95};
aerogelMPT->AddProperty("MIEHG_FORWARD", energy, mieForward);

// Weak backward component
std::vector<G4double> mieBackward = {-0.50, -0.50, -0.50, -0.50, -0.50};
aerogelMPT->AddProperty("MIEHG_BACKWARD", energy, mieBackward);

// 90% forward, 10% backward
std::vector<G4double> mieRatio = {0.90, 0.90, 0.90, 0.90, 0.90};
aerogelMPT->AddProperty("MIEHG_FORWARD_RATIO", energy, mieRatio);

aerogel->SetMaterialPropertiesTable(aerogelMPT);
```

### Example 2: Scintillator with TiO₂ Coating

```cpp
// Scintillator coating with TiO₂ particles for diffuse reflection
G4MaterialPropertiesTable* coatingMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

std::vector<G4double> rindex = {2.5, 2.5, 2.6, 2.7, 2.7};  // TiO₂
coatingMPT->AddProperty("RINDEX", energy, rindex);

// Short scattering length due to high particle density
std::vector<G4double> mieLength = {
    0.1*mm, 0.1*mm, 0.1*mm, 0.1*mm, 0.1*mm
};
coatingMPT->AddProperty("MIEHG", energy, mieLength);

// More isotropic scattering (g ~ 0.3)
std::vector<G4double> mieForward = {0.30, 0.30, 0.30, 0.30, 0.30};
coatingMPT->AddProperty("MIEHG_FORWARD", energy, mieForward);

std::vector<G4double> mieBackward = {-0.30, -0.30, -0.30, -0.30, -0.30};
coatingMPT->AddProperty("MIEHG_BACKWARD", energy, mieBackward);

// Equal forward and backward
std::vector<G4double> mieRatio = {0.50, 0.50, 0.50, 0.50, 0.50};
coatingMPT->AddProperty("MIEHG_FORWARD_RATIO", energy, mieRatio);

tio2Coating->SetMaterialPropertiesTable(coatingMPT);
```

### Example 3: Turbid Water (with Particles)

```cpp
// Water with suspended particles (not pure)
G4MaterialPropertiesTable* turbidWaterMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

std::vector<G4double> rindex = {1.33, 1.33, 1.34, 1.34, 1.35};
turbidWaterMPT->AddProperty("RINDEX", energy, rindex);

// Rayleigh scattering (molecular)
std::vector<G4double> rayleigh = {100*cm, 50*cm, 30*cm, 20*cm, 15*cm};
turbidWaterMPT->AddProperty("RAYLEIGH", energy, rayleigh);

// Mie scattering (particles) - shorter than Rayleigh
std::vector<G4double> mieLength = {
    50*cm, 45*cm, 40*cm, 35*cm, 30*cm  // Weaker wavelength dependence
};
turbidWaterMPT->AddProperty("MIEHG", energy, mieLength);

// Moderate forward scattering
std::vector<G4double> mieForward = {0.70, 0.70, 0.70, 0.70, 0.70};
turbidWaterMPT->AddProperty("MIEHG_FORWARD", energy, mieForward);

std::vector<G4double> mieBackward = {-0.40, -0.40, -0.40, -0.40, -0.40};
turbidWaterMPT->AddProperty("MIEHG_BACKWARD", energy, mieBackward);

std::vector<G4double> mieRatio = {0.75, 0.75, 0.75, 0.75, 0.75};
turbidWaterMPT->AddProperty("MIEHG_FORWARD_RATIO", energy, mieRatio);

// Absorption
std::vector<G4double> absorption = {100*cm, 200*cm, 300*cm, 100*cm, 50*cm};
turbidWaterMPT->AddProperty("ABSLENGTH", energy, absorption);

turbidWater->SetMaterialPropertiesTable(turbidWaterMPT);
```

### Example 4: WLS Fiber with Bulk Scattering

```cpp
// Wavelength-shifting fiber core with Mie scattering
G4MaterialPropertiesTable* wlsFiberMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

std::vector<G4double> rindex = {1.60, 1.60, 1.60, 1.60, 1.60};
wlsFiberMPT->AddProperty("RINDEX", energy, rindex);

// WLS properties
std::vector<G4double> wlsAbs = {10*m, 5*m, 0.1*mm, 0.1*mm, 0.1*mm};
wlsFiberMPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

std::vector<G4double> wlsEmit = {0.0, 0.3, 1.0, 0.5, 0.1};
wlsFiberMPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);
wlsFiberMPT->AddConstProperty("WLSTIMECONSTANT", 2.7*ns);

// Mie scattering from WLS dopant particles
std::vector<G4double> mieLength = {
    10*cm, 10*cm, 10*cm, 10*cm, 10*cm
};
wlsFiberMPT->AddProperty("MIEHG", energy, mieLength);

// Forward scattering helps light collection
std::vector<G4double> mieForward = {0.85, 0.85, 0.85, 0.85, 0.85};
wlsFiberMPT->AddProperty("MIEHG_FORWARD", energy, mieForward);

std::vector<G4double> mieBackward = {-0.50, -0.50, -0.50, -0.50, -0.50};
wlsFiberMPT->AddProperty("MIEHG_BACKWARD", energy, mieBackward);

std::vector<G4double> mieRatio = {0.85, 0.85, 0.85, 0.85, 0.85};
wlsFiberMPT->AddProperty("MIEHG_FORWARD_RATIO", energy, mieRatio);

wlsFiber->SetMaterialPropertiesTable(wlsFiberMPT);
```

### Example 5: Analyzing Mie Scattering

```cpp
// In UserSteppingAction
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
  if (step->GetTrack()->GetDefinition() == G4OpticalPhoton::Definition())
  {
    const G4VProcess* process =
        step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process && process->GetProcessName() == "OpMieHG")
    {
      // Mie scattering occurred
      G4ThreeVector oldDir = step->GetPreStepPoint()->GetMomentumDirection();
      G4ThreeVector newDir = step->GetPostStepPoint()->GetMomentumDirection();

      // Calculate scattering angle
      G4double cosTheta = oldDir.dot(newDir);
      G4double angle = std::acos(cosTheta) * 180./CLHEP::pi;

      // Categorize scattering
      if (angle < 30.) {
        fForwardScatterCount++;  // Forward scattering
      } else if (angle > 150.) {
        fBackwardScatterCount++;  // Backward scattering
      } else {
        fSideScatterCount++;  // Side scattering
      }

      // Record scattering angle
      analysisManager->FillH1(1, angle);  // Angular distribution

      // Track photon path length
      G4double stepLength = step->GetStepLength();
      fTotalPathLength += stepLength;
      fNumMieScatters++;
    }
  }
}
```

## Process Registration

### In Physics List

```cpp
void MyOpticalPhysics::ConstructProcess()
{
  G4ProcessManager* pManager =
      G4OpticalPhoton::OpticalPhoton()->GetProcessManager();

  // Register Mie scattering
  G4OpMieHG* mie = new G4OpMieHG();
  mie->SetVerboseLevel(1);  // Optional
  pManager->AddDiscreteProcess(mie);

  // Also register other processes
  pManager->AddDiscreteProcess(new G4OpAbsorption());
  pManager->AddDiscreteProcess(new G4OpRayleigh());
  pManager->AddDiscreteProcess(new G4OpBoundaryProcess());
}
```

### Process Ordering

Typical order:
1. Absorption
2. Rayleigh scattering
3. **Mie scattering** (this process)
4. WLS processes
5. Boundary process (last)

## Physics Details

### Henyey-Greenstein Sampling

The scattering angle is sampled from:

```cpp
cos θ = (1/(2g)) × [1 + g² - ((1 - g²)/(1 - g + 2g·ξ))²]
```

Where ξ is a random number [0,1].

**Special Cases:**
- g = 0: cos θ = 2ξ - 1 (isotropic)
- g → 1: Strong forward peak
- g → -1: Strong backward peak

### Forward vs Backward Lobe Selection

The process:
1. Randomly chooses forward or backward lobe based on `MIEHG_FORWARD_RATIO`
2. Samples angle from chosen HG distribution
3. Applies rotation to photon direction

### Energy Conservation

Like Rayleigh scattering, Mie scattering is **elastic**:
- Photon energy unchanged
- Only direction changes
- Polarization updated

### Comparison with Rayleigh Scattering

| Property | Rayleigh | Mie (HG) |
|----------|----------|----------|
| Particle size | << λ | ~ λ |
| Wavelength dependence | λ^-4^ | Weak |
| Angular distribution | (1 + cos²θ) | HG phase function |
| Forward preference | Slight | Strong (tunable) |
| Application | Molecular scattering | Particle scattering |

## Performance Considerations

### Optimization Tips

1. **Use when appropriate:**
   - Only activate for materials with particle scattering
   - Not needed for pure molecular materials

2. **Parameter selection:**
   - Typical g values: 0.7-0.95 for forward scattering
   - Higher g = more forward = fewer large-angle deflections

3. **Competition with Rayleigh:**
   - Both processes can coexist
   - Photon randomly chooses process based on mean free paths

### Common Issues

1. **Missing properties:**
   - All four MIEHG properties should be defined
   - Missing properties → no Mie scattering

2. **Unrealistic g values:**
   - g outside [-1, +1] is unphysical
   - g = 0 gives isotropic scattering

3. **Forward ratio:**
   - Must be in [0, 1]
   - Ratio = 1: All forward
   - Ratio = 0: All backward

## Typical Mie Parameters

### Common Materials

| Material | g (forward) | Scattering Length | Application |
|----------|-------------|-------------------|-------------|
| Aerogel | 0.90-0.95 | 1-5 cm | Cherenkov radiator |
| TiO₂ paint | 0.30-0.50 | 0.1-1 mm | Reflector coating |
| Turbid water | 0.70-0.85 | 10-100 cm | Non-ideal detector |
| WLS fiber | 0.80-0.90 | 5-20 cm | Light collection |

## Validation

The Mie scattering process has been validated against:

- Theoretical HG phase function
- Aerogel Cherenkov detector data (RICH, DIRC)
- Scattering measurements in turbid media

## References

### Source Files
- **Header:** `source/processes/optical/include/G4OpMieHG.hh` - Lines 1-83
- **Implementation:** `source/processes/optical/src/G4OpMieHG.cc`

### Related Classes
- [G4OpRayleigh](./g4oprayleigh.md) - Molecular scattering
- [G4OpAbsorption](./g4opabsorption.md) - Competing absorption
- [G4MaterialPropertiesTable](../../materials/api/g4materialpropertiestable.md)

### Original Implementation
- **Created:** 2010-07-03
- **Author:** Xin Qian
- **Based on:** Work by Vlasios Vasileiou

### Physical References
- Mie, G., "Beiträge zur Optik trüber Medien," Ann. Phys. (1908)
- Henyey, L.G. & Greenstein, J.L., ApJ 93, 70 (1941)
- van de Hulst, "Light Scattering by Small Particles" (1957)

[Back to Optical Processes Overview](../index.md)
