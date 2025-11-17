# G4OpWLS

## Overview

`G4OpWLS` is a discrete process that simulates wavelength shifting (WLS) of optical photons in materials. The process absorbs a photon at one wavelength and re-emits it at a longer wavelength (lower energy), crucial for scintillation detectors and optical fiber systems.

::: tip Class Information
**Header:** `source/processes/optical/include/G4OpWLS.hh`
**Source:** `source/processes/optical/src/G4OpWLS.cc`
**Inherits:** `G4VDiscreteProcess`
**Process Type:** `fOptical`
**Process Subtype:** `fOpWLS` (34)
:::

## Purpose

Wavelength shifting is essential for:

- **Scintillation Detectors** - Shifting UV scintillation light to visible for PMT detection
- **WLS Fibers** - Light collection in sampling calorimeters and trackers
- **Spectrum Matching** - Matching scintillator emission to photodetector sensitivity
- **Light Guides** - Trapping and transporting light via wavelength conversion
- **Plastic Scintillators** - Shifting to match PMT quantum efficiency peak

## Physics Background

### Wavelength Shifting Mechanism

Wavelength shifting involves two steps:

1. **Absorption:** Photon absorbed by WLS molecules (fluorescent dye)
   - Wavelength-dependent absorption probability
   - Typically absorbs UV/blue light

2. **Re-emission:** New photon emitted at longer wavelength
   - Stokes shift: ΔE = E_absorbed - E_emitted > 0
   - Emission spectrum defined by WLS material
   - Isotropic emission direction (4π)

**Key Point:** Original photon is destroyed; new photon created with:
- Different (longer) wavelength
- Random direction (isotropic)
- Time delay (immediate or exponential)

### Stokes Shift

The energy difference between absorption and emission:

```
ΔE = E_abs - E_emit
```

**Typical Values:**
- UV → Blue: ~0.5-1 eV
- Blue → Green: ~0.3-0.5 eV
- Small shift materials: ~0.1-0.3 eV

### Time Profiles

Emission can occur with two time profiles:
- **Delta (instantaneous):** No time delay
- **Exponential:** Time delay with characteristic decay constant

## Class Interface

### Constructor

```cpp
explicit G4OpWLS(const G4String& processName = "OpWLS",
                 G4ProcessType type          = fOptical);
```

**Parameters:**
- `processName` - Process name (default: "OpWLS")
- `type` - Process type (default: `fOptical`)

**Location:** Lines 54-55 in G4OpWLS.hh

### Destructor

```cpp
virtual ~G4OpWLS();
```

**Location:** Line 56

### Key Public Methods

#### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aParticleType) override;
```

**Returns:** `true` only for `G4OpticalPhoton`

**Implementation:** Lines 104-107

```cpp
inline G4bool G4OpWLS::IsApplicable(const G4ParticleDefinition& aParticleType)
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

**Purpose:** Build WLS integral table at initialization (lines 62-64)

**Details:**
- Constructs cumulative distribution function (CDF) from emission spectrum
- Used for fast sampling of emission wavelength
- Executed once per material at start of run

#### GetMeanFreePath

```cpp
virtual G4double GetMeanFreePath(const G4Track& aTrack, G4double,
                                 G4ForceCondition*) override;
```

**Returns:** WLS absorption length for current material and photon energy

**Purpose:** Returns absorption length for WLS (lines 66-69)

**Details:**
- Retrieves `WLSABSLENGTH` from material properties
- Returns DBL_MAX if property not defined (no WLS)

#### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(const G4Track& aTrack,
                                        const G4Step& aStep) override;
```

**Returns:** Particle change with new photon wavelength and direction

**Purpose:** Implements wavelength shifting (lines 71-73)

**Behavior:**
- Kills original photon
- Creates new photon with:
  - Wavelength sampled from `WLSCOMPONENT`
  - Isotropic direction (4π)
  - Time delay from time generator profile
  - Same position as absorption

#### GetIntegralTable

```cpp
virtual G4PhysicsTable* GetIntegralTable() const;
```

**Returns:** Pointer to WLS integral table (lines 75-76, 109-112)

**Implementation:**
```cpp
inline G4PhysicsTable* G4OpWLS::GetIntegralTable() const
{
  return theIntegralTable;
}
```

#### DumpPhysicsTable

```cpp
virtual void DumpPhysicsTable() const;
```

**Purpose:** Print integral table for debugging (lines 78-79, 114-124)

**Implementation:**
```cpp
inline void G4OpWLS::DumpPhysicsTable() const
{
  std::size_t PhysicsTableSize = theIntegralTable->entries();
  G4PhysicsFreeVector* v;

  for(std::size_t i = 0; i < PhysicsTableSize; ++i)
  {
    v = (G4PhysicsFreeVector*) (*theIntegralTable)[i];
    v->DumpValues();
  }
}
```

#### UseTimeProfile

```cpp
virtual void UseTimeProfile(const G4String name);
```

**Purpose:** Select time profile generator (lines 81-82)

**Parameters:**
- `name` - "delta" for instantaneous or "exponential" for delayed emission

**Usage:**
```cpp
G4OpWLS* wls = new G4OpWLS();
wls->UseTimeProfile("exponential");  // Use exponential decay
```

#### PreparePhysicsTable

```cpp
virtual void PreparePhysicsTable(const G4ParticleDefinition&) override;
```

**Purpose:** Prepare physics tables before run (line 84)

#### Initialise

```cpp
virtual void Initialise();
```

**Purpose:** Initialize process state (line 85)

#### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int);
```

**Purpose:** Control diagnostic output verbosity (line 87)

## Protected Members

### Time Generator Profile

```cpp
G4VWLSTimeGeneratorProfile* WLSTimeGeneratorProfile;
```

**Purpose:** Controls emission time delay (line 90)

**Types:**
- `G4WLSTimeGeneratorProfileDelta` - Instantaneous emission
- `G4WLSTimeGeneratorProfileExponential` - Exponential decay

### Integral Table

```cpp
G4PhysicsTable* theIntegralTable;
```

**Purpose:** Cumulative distribution function for emission spectrum (line 91)

**Usage:** Fast sampling of emission wavelength

## Private Members

```cpp
std::size_t idx_wls = 0;
```

**Purpose:** Cached index for WLS properties (line 97)

## Material Properties

### Required Properties

#### WLSABSLENGTH

**Property Name:** `"WLSABSLENGTH"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Length (cm, m, mm)

**Definition:** Absorption length for WLS process

**Example:**
```cpp
std::vector<G4double> photonEnergy = {
    2.0*eV,   // Red - not absorbed
    2.5*eV,   // Green - not absorbed
    3.0*eV,   // Blue - start absorption
    3.5*eV,   // UV - strong absorption
    4.0*eV    // Deep UV - very strong absorption
};

std::vector<G4double> wlsAbsorption = {
    10*m,     // Transparent to red
    5*m,      // Transparent to green
    1*cm,     // Absorbs blue strongly
    0.5*mm,   // Absorbs UV very strongly
    0.1*mm    // Nearly opaque to deep UV
};

materialMPT->AddProperty("WLSABSLENGTH", photonEnergy, wlsAbsorption);
```

#### WLSCOMPONENT

**Property Name:** `"WLSCOMPONENT"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Dimensionless (relative intensity)

**Definition:** Emission spectrum (normalized automatically)

**Example:**
```cpp
// Emission spectrum peaks at lower energy (longer wavelength) than absorption
std::vector<G4double> emissionEnergy = {
    1.8*eV,   // Deep red
    2.0*eV,   // Red
    2.2*eV,   // Orange
    2.4*eV,   // Yellow-green
    2.6*eV,   // Green
    2.8*eV    // Blue-green
};

std::vector<G4double> wlsEmission = {
    0.0,      // No deep red emission
    0.2,      // Some red
    0.8,      // Strong orange
    1.0,      // Peak at yellow-green
    0.5,      // Moderate green
    0.1       // Little blue-green
};

materialMPT->AddProperty("WLSCOMPONENT", emissionEnergy, wlsEmission);
```

**Note:** Emission energy should be **lower** than absorption energy (Stokes shift)

#### WLSTIMECONSTANT

**Property Name:** `"WLSTIMECONSTANT"`

**Type:** Constant property

**Units:** Time (ns, ps)

**Definition:** Decay time constant for exponential emission

**Example:**
```cpp
materialMPT->AddConstProperty("WLSTIMECONSTANT", 2.7*ns);  // Typical WLS decay
```

**Usage:**
- Only used with "exponential" time profile
- Ignored with "delta" time profile
- Typical values: 1-10 ns for common WLS materials

## Usage Examples

### Example 1: Basic WLS Fiber

```cpp
// Polystyrene core with WLS dye
G4MaterialPropertiesTable* wlsFiberMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    1.8*eV, 2.0*eV, 2.2*eV, 2.4*eV, 2.6*eV, 2.8*eV, 3.0*eV, 3.2*eV, 3.4*eV
};

// Refractive index
std::vector<G4double> rindex = {
    1.59, 1.59, 1.59, 1.59, 1.59, 1.59, 1.59, 1.59, 1.59
};
wlsFiberMPT->AddProperty("RINDEX", energy, rindex);

// WLS absorption: strong at blue/UV, transparent to green/red
std::vector<G4double> wlsAbs = {
    10*m,    // Transparent to emission (avoid reabsorption)
    10*m,
    5*m,
    1*m,
    10*cm,   // Start absorbing
    1*cm,    // Strong absorption of blue
    0.5*mm,  // Very strong absorption of UV
    0.1*mm,
    0.1*mm
};
wlsFiberMPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

// WLS emission: peaks at green (shifted from blue absorption)
std::vector<G4double> wlsEmit = {
    0.0, 0.1, 0.5, 1.0, 0.8, 0.3, 0.0, 0.0, 0.0
};
wlsFiberMPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);

// Decay time
wlsFiberMPT->AddConstProperty("WLSTIMECONSTANT", 2.7*ns);

wlsFiberCore->SetMaterialPropertiesTable(wlsFiberMPT);
```

### Example 2: Scintillator with WLS Coating

```cpp
// Scintillator emits UV, WLS coating shifts to blue
G4MaterialPropertiesTable* wlsCoatingMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    2.0*eV,   // Red
    2.5*eV,   // Green-blue
    3.0*eV,   // Blue (emission)
    3.5*eV,   // UV (absorption)
    4.0*eV    // Deep UV
};

std::vector<G4double> rindex = {1.60, 1.60, 1.60, 1.60, 1.60};
wlsCoatingMPT->AddProperty("RINDEX", energy, rindex);

// Absorbs UV scintillation light
std::vector<G4double> wlsAbs = {
    10*m,     // Transparent to red/green/blue
    10*m,
    5*m,
    0.1*mm,   // Strong UV absorption
    0.05*mm
};
wlsCoatingMPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

// Emits blue light (Stokes shift from UV)
std::vector<G4double> wlsEmit = {
    0.0,      // No red
    0.3,      // Some green-blue
    1.0,      // Peak at blue
    0.1,      // Little UV
    0.0
};
wlsCoatingMPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);

// Fast decay
wlsCoatingMPT->AddConstProperty("WLSTIMECONSTANT", 1.5*ns);

wlsCoating->SetMaterialPropertiesTable(wlsCoatingMPT);
```

### Example 3: Multi-Clad WLS Fiber System

```cpp
// Complete WLS fiber with core, inner clad, outer clad

// CORE with WLS
G4MaterialPropertiesTable* coreMPT = new G4MaterialPropertiesTable();
std::vector<G4double> energy = {1.8*eV, 2.0*eV, 2.2*eV, 2.5*eV, 2.8*eV, 3.1*eV, 3.5*eV};

std::vector<G4double> coreRindex = {1.60, 1.60, 1.60, 1.60, 1.60, 1.60, 1.60};
coreMPT->AddProperty("RINDEX", energy, coreRindex);

std::vector<G4double> wlsAbs = {10*m, 10*m, 5*m, 1*cm, 0.5*mm, 0.1*mm, 0.05*mm};
coreMPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

std::vector<G4double> wlsEmit = {0.0, 0.2, 1.0, 0.8, 0.2, 0.0, 0.0};
coreMPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);

coreMPT->AddConstProperty("WLSTIMECONSTANT", 2.7*ns);

// Bulk absorption (very long for core)
std::vector<G4double> coreAbs = {5*m, 5*m, 5*m, 4*m, 3*m, 2*m, 1*m};
coreMPT->AddProperty("ABSLENGTH", energy, coreAbs);

wlsFiberCore->SetMaterialPropertiesTable(coreMPT);

// INNER CLADDING (lower refractive index for TIR)
G4MaterialPropertiesTable* innerCladMPT = new G4MaterialPropertiesTable();
std::vector<G4double> innerCladRindex = {1.49, 1.49, 1.49, 1.49, 1.49, 1.49, 1.49};
innerCladMPT->AddProperty("RINDEX", energy, innerCladRindex);

innerCladding->SetMaterialPropertiesTable(innerCladMPT);

// OUTER CLADDING (even lower refractive index)
G4MaterialPropertiesTable* outerCladMPT = new G4MaterialPropertiesTable();
std::vector<G4double> outerCladRindex = {1.42, 1.42, 1.42, 1.42, 1.42, 1.42, 1.42};
outerCladMPT->AddProperty("RINDEX", energy, outerCladRindex);

outerCladding->SetMaterialPropertiesTable(outerCladMPT);
```

### Example 4: Tracking WLS Events

```cpp
// In UserSteppingAction
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
  // Check for WLS process
  const G4VProcess* process =
      step->GetPostStepPoint()->GetProcessDefinedStep();

  if (process && process->GetProcessName() == "OpWLS")
  {
    // WLS occurred
    G4double oldEnergy = step->GetPreStepPoint()->GetKineticEnergy();
    G4double newEnergy = step->GetPostStepPoint()->GetKineticEnergy();

    // Calculate wavelength shift
    G4double oldWavelength = h_Planck*c_light/oldEnergy;
    G4double newWavelength = h_Planck*c_light/newEnergy;
    G4double stokesShift = newWavelength - oldWavelength;

    // Record wavelength shift
    analysisManager->FillH1(1, oldWavelength/nm);     // Absorbed wavelength
    analysisManager->FillH1(2, newWavelength/nm);     // Emitted wavelength
    analysisManager->FillH1(3, stokesShift/nm);       // Stokes shift

    // Record position
    G4ThreeVector position = step->GetPostStepPoint()->GetPosition();
    analysisManager->FillH3(4, position.x(), position.y(), position.z());

    // Count WLS events
    fNumWLSEvents++;
  }
}
```

### Example 5: Configuring Time Profile

```cpp
// In physics list construction
void MyOpticalPhysics::ConstructProcess()
{
  G4ProcessManager* pManager =
      G4OpticalPhoton::OpticalPhoton()->GetProcessManager();

  // Create WLS process with exponential decay
  G4OpWLS* wls = new G4OpWLS();
  wls->UseTimeProfile("exponential");  // Use exponential time profile
  wls->SetVerboseLevel(1);

  pManager->AddDiscreteProcess(wls);

  // Also can use delta (instantaneous):
  // wls->UseTimeProfile("delta");
}
```

### Example 6: Y-11 WLS Fiber (Commercial Example)

```cpp
// Kuraray Y-11 WLS fiber properties
G4MaterialPropertiesTable* y11MPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    1.77*eV,  // 700 nm
    1.91*eV,  // 650 nm
    2.07*eV,  // 600 nm
    2.25*eV,  // 550 nm
    2.48*eV,  // 500 nm (emission peak)
    2.76*eV,  // 450 nm
    3.10*eV,  // 400 nm (absorption peak)
    3.54*eV,  // 350 nm
    4.13*eV   // 300 nm
};

std::vector<G4double> rindex = {
    1.59, 1.59, 1.59, 1.59, 1.59, 1.59, 1.59, 1.59, 1.59
};
y11MPT->AddProperty("RINDEX", energy, rindex);

// WLS absorption (strong at UV/blue)
std::vector<G4double> wlsAbs = {
    10*m,     // No absorption of own emission
    10*m,
    5*m,
    1*m,
    10*cm,
    2*cm,
    0.5*mm,   // Strong absorption ~400 nm
    0.2*mm,
    0.1*mm
};
y11MPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

// WLS emission (peaks at green ~500-530 nm)
std::vector<G4double> wlsEmit = {
    0.05, 0.15, 0.60, 1.00, 0.80, 0.20, 0.01, 0.0, 0.0
};
y11MPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);

// Decay time ~7 ns for Y-11
y11MPT->AddConstProperty("WLSTIMECONSTANT", 7.0*ns);

// Bulk attenuation
std::vector<G4double> bulkAbs = {
    3.5*m, 3.5*m, 3.5*m, 3.5*m, 3.5*m, 3*m, 2*m, 1*m, 0.5*m
};
y11MPT->AddProperty("ABSLENGTH", energy, bulkAbs);

y11Fiber->SetMaterialPropertiesTable(y11MPT);
```

## Process Registration

### In Physics List

```cpp
void MyOpticalPhysics::ConstructProcess()
{
  G4ProcessManager* pManager =
      G4OpticalPhoton::OpticalPhoton()->GetProcessManager();

  // Register WLS process
  G4OpWLS* wls = new G4OpWLS();
  wls->UseTimeProfile("exponential");  // Configure time profile
  pManager->AddDiscreteProcess(wls);

  // Register other processes
  pManager->AddDiscreteProcess(new G4OpAbsorption());
  pManager->AddDiscreteProcess(new G4OpRayleigh());
  pManager->AddDiscreteProcess(new G4OpBoundaryProcess());
}
```

## Physics Details

### Emission Wavelength Sampling

The emission wavelength is sampled from the CDF built from `WLSCOMPONENT`:

1. Build integral table at initialization
2. Sample random number ξ ∈ [0,1]
3. Find energy E where CDF(E) = ξ
4. Create photon with energy E

### Emission Direction

New photon direction is **isotropic** (4π):
- No memory of incident photon direction
- Uniformly distributed in solid angle
- Enables light trapping in fibers via TIR

### Time Delay

**Delta Profile:**
```
t = 0  (instantaneous)
```

**Exponential Profile:**
```
t = -τ × ln(ξ)
```
Where τ is `WLSTIMECONSTANT` and ξ is random number.

### Energy Conservation

**Not conserved** (absorption + re-emission):
- Energy deposited = E_absorbed - E_emitted (Stokes shift)
- Energy loss to molecular vibrations
- Typically ΔE ~ 0.1-1 eV

## Performance Considerations

### Optimization Tips

1. **Avoid reabsorption:**
   - Make WLSABSLENGTH very long at emission wavelengths
   - Ensure good Stokes shift (emission << absorption)

2. **Integral table:**
   - Built once at initialization
   - Fast sampling during tracking

3. **Time profile:**
   - Delta is faster (no time sampling)
   - Exponential needed for timing studies

### Common Issues

1. **Insufficient Stokes shift:**
   - Emission overlaps absorption
   - Photons reabsorbed immediately
   - Solution: Check energy ranges don't overlap

2. **Missing properties:**
   - Need all three: WLSABSLENGTH, WLSCOMPONENT, WLSTIMECONSTANT
   - Missing any → no WLS

3. **Wrong energy order:**
   - Emission should be at LOWER energy than absorption
   - Check: E_emit < E_absorb

4. **Normalization:**
   - WLSCOMPONENT normalized automatically
   - Absolute values don't matter, only relative

## Typical WLS Materials

| Material | Absorption Peak | Emission Peak | Decay Time | Application |
|----------|----------------|---------------|------------|-------------|
| Y-11 (Kuraray) | 430 nm | 476 nm | 7 ns | Scintillator readout |
| BCF-92 | 410 nm | 492 nm | 2.7 ns | Fast timing |
| Green WLS | 430 nm | 530 nm | 8 ns | Long Stokes shift |
| POPOP | 360 nm | 410 nm | 1.4 ns | UV → Blue shift |

## Related Processes

- **[G4OpWLS2](./g4opwls2.md)** - Secondary wavelength shifting
- **[G4OpAbsorption](./g4opabsorption.md)** - Competing bulk absorption
- **[G4VWLSTimeGeneratorProfile](./g4wlstimegeneratorprofile.md)** - Time profile classes

## References

### Source Files
- **Header:** `source/processes/optical/include/G4OpWLS.hh` - Lines 1-127
- **Implementation:** `source/processes/optical/src/G4OpWLS.cc`

### Original Implementation
- **Created:** 2003-05-13
- **Author:** John Paul Archambault (adapted from G4Scintillation and G4OpAbsorption)
- **Updated:** 2005-07-28 (add G4ProcessType to constructor)
- **Updated:** 2006-05-07 (add G4VWLSTimeGeneratorProfile)

[Back to Optical Processes Overview](../index.md)
