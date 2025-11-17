# G4OpWLS2

## Overview

`G4OpWLS2` is a discrete process that simulates secondary wavelength shifting of optical photons. This allows a two-stage wavelength shifting process where photons can undergo multiple wavelength conversions, extending the capabilities of the primary WLS process.

::: tip Class Information
**Header:** `source/processes/optical/include/G4OpWLS2.hh`
**Source:** `source/processes/optical/src/G4OpWLS2.cc`
**Inherits:** `G4VDiscreteProcess`
**Process Type:** `fOptical`
**Process Subtype:** `fOpWLS2` (36)
:::

## Purpose

Secondary wavelength shifting enables:

- **Multi-Stage Shifting** - Sequential wavelength conversions (UV → Blue → Green)
- **Complex Detector Systems** - Multiple WLS components with different dyes
- **Extended Stokes Shifts** - Larger total wavelength shifts through multiple stages
- **Spectral Optimization** - Fine-tuning emission to detector response
- **Advanced Scintillator Designs** - Cascaded wavelength conversion systems

## Physics Background

### Why Secondary WLS?

In some detector systems, a single wavelength shift is insufficient:

**Example Scenario:**
1. Scintillator emits UV light (e.g., 350 nm)
2. Primary WLS shifts UV → Blue (450 nm)
3. Secondary WLS shifts Blue → Green (530 nm)
4. Green light better matches PMT quantum efficiency peak

### Comparison: WLS vs WLS2

| Feature | G4OpWLS | G4OpWLS2 |
|---------|---------|----------|
| Purpose | Primary shifting | Secondary shifting |
| Property prefix | WLS | WLS2 |
| Typical use | First stage | Second stage |
| Can coexist | Yes | Yes |
| Process order | Earlier | Later |

Both processes can act on the same photon sequentially if properties are defined appropriately.

## Class Interface

The G4OpWLS2 interface is **identical** to G4OpWLS, using different material property names.

### Constructor

```cpp
explicit G4OpWLS2(const G4String& processName = "OpWLS2",
                  G4ProcessType type          = fOptical);
```

**Parameters:**
- `processName` - Process name (default: "OpWLS2")
- `type` - Process type (default: `fOptical`)

**Location:** Lines 54-55 in G4OpWLS2.hh

### Destructor

```cpp
virtual ~G4OpWLS2();
```

**Location:** Line 56

### Key Public Methods

All methods are identical to G4OpWLS:

- `IsApplicable()` - Returns true for optical photons (lines 104-107)
- `BuildPhysicsTable()` - Builds integral table (lines 62-64)
- `GetMeanFreePath()` - Returns WLS2 absorption length (lines 66-69)
- `PostStepDoIt()` - Implements wavelength shifting (lines 71-73)
- `GetIntegralTable()` - Returns integral table pointer (lines 75-76, 109-112)
- `DumpPhysicsTable()` - Prints table for debugging (lines 78-79, 114-124)
- `UseTimeProfile()` - Selects time profile (lines 81-82)
- `PreparePhysicsTable()` - Prepares tables (line 84)
- `Initialise()` - Initializes process (line 85)
- `SetVerboseLevel()` - Controls verbosity (line 87)

## Protected Members

### Time Generator Profile

```cpp
G4VWLSTimeGeneratorProfile* WLSTimeGeneratorProfile;
```

**Purpose:** Controls emission time delay (line 90)

### Integral Table

```cpp
G4PhysicsTable* theIntegralTable;
```

**Purpose:** CDF for emission spectrum (line 91)

## Private Members

```cpp
std::size_t idx_wls2 = 0;
```

**Purpose:** Cached index for WLS2 properties (line 97)

## Material Properties

### Required Properties

The WLS2 process uses properties with "WLS2" prefix:

#### WLS2ABSLENGTH

**Property Name:** `"WLS2ABSLENGTH"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Length (cm, m)

**Definition:** Absorption length for secondary WLS

**Example:**
```cpp
// Secondary WLS absorbs blue, transparent to green/red
std::vector<G4double> photonEnergy = {
    2.0*eV,   // Red (not absorbed)
    2.2*eV,   // Orange (not absorbed)
    2.5*eV,   // Green (start absorption)
    2.8*eV,   // Blue (strong absorption)
    3.0*eV    // UV (very strong)
};

std::vector<G4double> wls2Absorption = {
    10*m,     // Transparent to emission
    5*m,
    1*cm,     // Start absorbing
    0.5*mm,   // Strong absorption
    0.1*mm
};

materialMPT->AddProperty("WLS2ABSLENGTH", photonEnergy, wls2Absorption);
```

#### WLS2COMPONENT

**Property Name:** `"WLS2COMPONENT"`

**Type:** Wavelength-dependent (energy vector)

**Units:** Dimensionless (relative intensity)

**Definition:** Secondary emission spectrum

**Example:**
```cpp
// Emission at even longer wavelength than WLS2 absorption
std::vector<G4double> emissionEnergy = {
    1.8*eV,   // Deep red
    2.0*eV,   // Red
    2.2*eV,   // Orange/yellow
    2.4*eV,   // Yellow
    2.6*eV    // Yellow-green
};

std::vector<G4double> wls2Emission = {
    0.0,      // No deep red
    0.3,      // Some red
    0.8,      // Strong orange
    1.0,      // Peak at yellow
    0.4       // Some green
};

materialMPT->AddProperty("WLS2COMPONENT", emissionEnergy, wls2Emission);
```

#### WLS2TIMECONSTANT

**Property Name:** `"WLS2TIMECONSTANT"`

**Type:** Constant property

**Units:** Time (ns)

**Definition:** Decay time for secondary WLS

**Example:**
```cpp
materialMPT->AddConstProperty("WLS2TIMECONSTANT", 5.0*ns);
```

## Usage Examples

### Example 1: Two-Stage WLS Fiber

```cpp
// Fiber with both primary and secondary WLS
G4MaterialPropertiesTable* dualWLSMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    1.8*eV, 2.0*eV, 2.2*eV, 2.5*eV, 2.8*eV, 3.1*eV, 3.5*eV, 4.0*eV
};

std::vector<G4double> rindex(energy.size(), 1.60);
dualWLSMPT->AddProperty("RINDEX", energy, rindex);

// PRIMARY WLS: UV → Blue
std::vector<G4double> wlsAbs = {
    10*m, 10*m, 5*m, 1*m, 1*cm, 0.5*mm, 0.1*mm, 0.05*mm  // Absorbs UV
};
dualWLSMPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

std::vector<G4double> wlsEmit = {
    0.0, 0.0, 0.0, 0.2, 1.0, 0.8, 0.1, 0.0  // Emits blue
};
dualWLSMPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);
dualWLSMPT->AddConstProperty("WLSTIMECONSTANT", 2.7*ns);

// SECONDARY WLS: Blue → Green
std::vector<G4double> wls2Abs = {
    10*m, 10*m, 5*m, 5*mm, 0.5*mm, 10*m, 10*m, 10*m  // Absorbs blue, not UV
};
dualWLSMPT->AddProperty("WLS2ABSLENGTH", energy, wls2Abs);

std::vector<G4double> wls2Emit = {
    0.0, 0.3, 1.0, 0.7, 0.1, 0.0, 0.0, 0.0  // Emits green
};
dualWLSMPT->AddProperty("WLS2COMPONENT", energy, wls2Emit);
dualWLSMPT->AddConstProperty("WLS2TIMECONSTANT", 5.0*ns);

// Bulk absorption
std::vector<G4double> bulkAbs(energy.size(), 5*m);
dualWLSMPT->AddProperty("ABSLENGTH", energy, bulkAbs);

dualWLSFiber->SetMaterialPropertiesTable(dualWLSMPT);
```

### Example 2: Scintillator with Two WLS Coatings

```cpp
// Inner coating: UV → Blue (primary WLS)
G4MaterialPropertiesTable* innerCoatingMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

std::vector<G4double> rindex = {1.60, 1.60, 1.60, 1.60, 1.60};
innerCoatingMPT->AddProperty("RINDEX", energy, rindex);

// Primary WLS
std::vector<G4double> wlsAbs = {10*m, 10*m, 5*m, 0.1*mm, 0.05*mm};
innerCoatingMPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

std::vector<G4double> wlsEmit = {0.0, 0.2, 1.0, 0.3, 0.0};
innerCoatingMPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);
innerCoatingMPT->AddConstProperty("WLSTIMECONSTANT", 2.0*ns);

innerCoating->SetMaterialPropertiesTable(innerCoatingMPT);

// Outer coating: Blue → Green (secondary WLS)
G4MaterialPropertiesTable* outerCoatingMPT = new G4MaterialPropertiesTable();

outerCoatingMPT->AddProperty("RINDEX", energy, rindex);

// Secondary WLS only
std::vector<G4double> wls2Abs = {10*m, 5*m, 0.5*mm, 10*m, 10*m};
outerCoatingMPT->AddProperty("WLS2ABSLENGTH", energy, wls2Abs);

std::vector<G4double> wls2Emit = {0.2, 1.0, 0.4, 0.0, 0.0};
outerCoatingMPT->AddProperty("WLS2COMPONENT", energy, wls2Emit);
outerCoatingMPT->AddConstProperty("WLS2TIMECONSTANT", 4.0*ns);

outerCoating->SetMaterialPropertiesTable(outerCoatingMPT);
```

### Example 3: Tracking Multi-Stage WLS

```cpp
// In UserSteppingAction
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
  const G4VProcess* process =
      step->GetPostStepPoint()->GetProcessDefinedStep();

  if (!process) return;

  G4String processName = process->GetProcessName();

  if (processName == "OpWLS")
  {
    // Primary WLS occurred
    G4double oldEnergy = step->GetPreStepPoint()->GetKineticEnergy();
    G4double newEnergy = step->GetPostStepPoint()->GetKineticEnergy();

    fWLSCount++;
    analysisManager->FillH1(1, h_Planck*c_light/oldEnergy);  // Input spectrum
    analysisManager->FillH1(2, h_Planck*c_light/newEnergy);  // WLS output
  }
  else if (processName == "OpWLS2")
  {
    // Secondary WLS occurred
    G4double oldEnergy = step->GetPreStepPoint()->GetKineticEnergy();
    G4double newEnergy = step->GetPostStepPoint()->GetKineticEnergy();

    fWLS2Count++;
    analysisManager->FillH1(3, h_Planck*c_light/oldEnergy);  // WLS2 input
    analysisManager->FillH1(4, h_Planck*c_light/newEnergy);  // WLS2 output

    // Total wavelength shift from original
    if (step->GetTrack()->GetCreatorProcess())
    {
      G4cout << "Secondary WLS: Total shift = "
             << (newEnergy - fOriginalPhotonEnergy) / eV
             << " eV" << G4endl;
    }
  }
}
```

### Example 4: Optimized PMT Matching

```cpp
// Three-stage system optimized for PMT QE peak at 400 nm

// Stage 1: Scintillator (emits UV at 350 nm)
G4MaterialPropertiesTable* scintMPT = new G4MaterialPropertiesTable();
// ... scintillation properties ...

// Stage 2: Primary WLS (350 nm → 380 nm)
G4MaterialPropertiesTable* wls1MPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {
    3.0*eV,   // 413 nm
    3.26*eV,  // 380 nm (emission)
    3.54*eV,  // 350 nm (absorption)
    3.87*eV   // 320 nm
};

std::vector<G4double> rindex = {1.58, 1.58, 1.58, 1.58};
wls1MPT->AddProperty("RINDEX", energy, rindex);

std::vector<G4double> wlsAbs = {10*m, 5*m, 0.1*mm, 0.05*mm};
wls1MPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

std::vector<G4double> wlsEmit = {0.2, 1.0, 0.3, 0.0};
wls1MPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);
wls1MPT->AddConstProperty("WLSTIMECONSTANT", 1.5*ns);

wls1Material->SetMaterialPropertiesTable(wls1MPT);

// Stage 3: Secondary WLS (380 nm → 400 nm, matches PMT peak)
G4MaterialPropertiesTable* wls2MPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy2 = {
    2.88*eV,  // 430 nm
    3.10*eV,  // 400 nm (emission - PMT peak!)
    3.26*eV,  // 380 nm (absorption)
    3.44*eV   // 360 nm
};

wls2MPT->AddProperty("RINDEX", energy2, rindex);

std::vector<G4double> wls2Abs = {10*m, 5*m, 0.2*mm, 10*m};
wls2MPT->AddProperty("WLS2ABSLENGTH", energy2, wls2Abs);

std::vector<G4double> wls2Emit = {0.3, 1.0, 0.2, 0.0};
wls2MPT->AddProperty("WLS2COMPONENT", energy2, wls2Emit);
wls2MPT->AddConstProperty("WLS2TIMECONSTANT", 3.0*ns);

wls2Material->SetMaterialPropertiesTable(wls2MPT);
```

### Example 5: Cascaded Fiber System

```cpp
// Multi-fiber readout with wavelength conversion at each stage

// Fiber 1: Attached to scintillator, converts UV → Blue
G4MaterialPropertiesTable* fiber1MPT = new G4MaterialPropertiesTable();
std::vector<G4double> energy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};

std::vector<G4double> rindex1 = {1.60, 1.60, 1.60, 1.60, 1.60};
fiber1MPT->AddProperty("RINDEX", energy, rindex1);

std::vector<G4double> wlsAbs = {10*m, 5*m, 1*cm, 0.5*mm, 0.1*mm};
fiber1MPT->AddProperty("WLSABSLENGTH", energy, wlsAbs);

std::vector<G4double> wlsEmit = {0.0, 0.1, 1.0, 0.5, 0.0};
fiber1MPT->AddProperty("WLSCOMPONENT", energy, wlsEmit);
fiber1MPT->AddConstProperty("WLSTIMECONSTANT", 2.7*ns);

fiber1->SetMaterialPropertiesTable(fiber1MPT);

// Fiber 2: Couples to Fiber 1, converts Blue → Green
G4MaterialPropertiesTable* fiber2MPT = new G4MaterialPropertiesTable();

std::vector<G4double> rindex2 = {1.49, 1.49, 1.49, 1.49, 1.49};  // Lower n for coupling
fiber2MPT->AddProperty("RINDEX", energy, rindex2);

// Uses WLS2 properties
std::vector<G4double> wls2Abs = {10*m, 1*cm, 0.5*mm, 10*m, 10*m};
fiber2MPT->AddProperty("WLS2ABSLENGTH", energy, wls2Abs);

std::vector<G4double> wls2Emit = {0.2, 1.0, 0.3, 0.0, 0.0};
fiber2MPT->AddProperty("WLS2COMPONENT", energy, wls2Emit);
fiber2MPT->AddConstProperty("WLS2TIMECONSTANT", 5.0*ns);

fiber2->SetMaterialPropertiesTable(fiber2MPT);
```

## Process Registration

### In Physics List

```cpp
void MyOpticalPhysics::ConstructProcess()
{
  G4ProcessManager* pManager =
      G4OpticalPhoton::OpticalPhoton()->GetProcessManager();

  // Register both WLS processes
  G4OpWLS* wls = new G4OpWLS();
  wls->UseTimeProfile("exponential");
  pManager->AddDiscreteProcess(wls);

  G4OpWLS2* wls2 = new G4OpWLS2();
  wls2->UseTimeProfile("exponential");
  pManager->AddDiscreteProcess(wls2);

  // Order matters: WLS before WLS2
  // Both before boundary process

  pManager->AddDiscreteProcess(new G4OpAbsorption());
  pManager->AddDiscreteProcess(new G4OpRayleigh());
  pManager->AddDiscreteProcess(new G4OpBoundaryProcess());
}
```

### Process Ordering

Recommended order:
1. Absorption
2. Rayleigh
3. Mie
4. **WLS** (primary wavelength shifting)
5. **WLS2** (secondary wavelength shifting)
6. Boundary (last)

## Physics Details

### Sequential Wavelength Conversion

A single photon can undergo:
1. Scintillation: Particle → UV photon
2. Primary WLS: UV → Blue photon (new photon)
3. Secondary WLS: Blue → Green photon (another new photon)
4. Detection: Green photon detected

Each stage:
- Destroys the previous photon
- Creates a new photon
- Adds time delay
- Randomizes direction

### Total Time Delay

If both processes act:
```
Total delay = WLS decay time + WLS2 decay time
```

Example:
- WLS: τ₁ = 2.7 ns
- WLS2: τ₂ = 5.0 ns
- Average total delay ≈ 7.7 ns

### Energy Considerations

Total energy loss through cascade:
```
ΔE_total = E_scint - E_detected
         = (E_scint - E_WLS) + (E_WLS - E_WLS2)
         = Stokes₁ + Stokes₂
```

## Performance Considerations

### When to Use WLS2

**Use WLS2 when:**
- Need large total wavelength shift
- Multiple WLS materials in detector
- Optimizing specific wavelength output
- Studying multi-stage conversions

**Don't use WLS2 when:**
- Single-stage shifting sufficient
- Adds unnecessary complexity
- Timing resolution critical (adds delay)

### Optimization Tips

1. **Avoid mutual absorption:**
   - WLS emission shouldn't be absorbed by WLS2
   - WLS2 emission shouldn't be absorbed by WLS
   - Check energy ranges carefully

2. **Process ordering:**
   - WLS must come before WLS2
   - Otherwise WLS2 might act before WLS

3. **Property definition:**
   - Only define WLS2 properties where needed
   - Missing properties → process inactive

## Common Issues

1. **Process order:**
   - WLS2 before WLS → incorrect conversion sequence
   - Solution: Register WLS before WLS2

2. **Cross-absorption:**
   - WLS2 absorbs WLS emission before it propagates
   - Solution: Ensure spectral separation

3. **Missing properties:**
   - Define all three WLS2 properties
   - Or process won't activate

4. **Energy ranges:**
   - Ensure proper cascade: E_scint > E_WLS > E_WLS2
   - Check Stokes shift at each stage

## Typical Applications

### Experimental Setups

| Detector Type | Purpose | Conversion |
|---------------|---------|------------|
| Tile Calorimeter | Light collection | UV → Blue → Green |
| Fiber Tracker | Spectrum matching | Blue → Green → Yellow |
| Multilayer Scintillator | Wavelength coding | Different shifts per layer |
| PMT Optimization | Match QE peak | Multi-stage to 400 nm |

## Validation

The WLS2 process has been validated through:
- Multi-stage fiber system measurements
- Comparison with WLS process
- Detector prototype testing

## Related Processes

- **[G4OpWLS](./g4opwls.md)** - Primary wavelength shifting
- **[G4OpAbsorption](./g4opabsorption.md)** - Competing absorption
- **[G4VWLSTimeGeneratorProfile](./g4wlstimegeneratorprofile.md)** - Time profiles

## References

### Source Files
- **Header:** `source/processes/optical/include/G4OpWLS2.hh` - Lines 1-127
- **Implementation:** `source/processes/optical/src/G4OpWLS2.cc`

### Original Implementation
- Based on G4OpWLS
- Same author and adaptation lineage
- Extended for secondary conversion

[Back to Optical Processes Overview](../index.md)
