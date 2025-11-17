# G4PhononScattering

**File**: `source/processes/solidstate/phonon/include/G4PhononScattering.hh`

## Overview

G4PhononScattering simulates elastic and quasi-elastic scattering of phonons from lattice imperfections, isotopic disorder, and other phonons. This process is the primary mechanism for phonon momentum randomization and determines phonon diffusion length in crystals.

## Class Description

G4PhononScattering handles multiple scattering mechanisms:

- **Isotope Scattering**: From random isotope mass distribution
- **Defect Scattering**: From point defects and impurities
- **Boundary Scattering**: Fromgrain boundaries and surfaces
- **Phonon-Phonon Scattering**: From thermal phonon population
- **Momentum Randomization**: New k-vector sampled isotropically
- **Energy Conservation**: Approximately conserved (elastic limit)

**Process Behavior**: Current phonon is killed and a new phonon is created with randomized direction but similar energy.

**Inheritance**: G4VPhononProcess → G4VDiscreteProcess → G4VProcess

**Location**: `source/processes/solidstate/phonon/include/G4PhononScattering.hh:35`

## Constructor & Destructor

### Constructor

```cpp
G4PhononScattering(const G4String& processName = "phononScattering");
```

**Parameters**:
- `processName`: Process name (default: "phononScattering")

**Location**: Line 37

### Destructor

```cpp
virtual ~G4PhononScattering();
```

**Location**: Line 38

## Core Methods

### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(
    const G4Track& track,
    const G4Step& step
);
```

Executes phonon scattering.

**Process**:
1. Kill parent phonon
2. Sample new direction (isotropic or forward-peaked)
3. Preserve energy (approximately)
4. Choose new polarization from DOS
5. Create scattered phonon track

**Implementation Note**: Current implementation destroys and recreates phonon rather than just changing direction, allowing polarization changes.

**Location**: Line 40

### GetMeanFreePath

```cpp
protected:
virtual G4double GetMeanFreePath(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
);
```

Calculates scattering mean free path.

**Formula**:
```
λ = v_g / Γ_total
Γ_total = Γ_isotope + Γ_defect + Γ_boundary + Γ_phonon-phonon
```

**Isotope Scattering Rate** (Rayleigh):
```
Γ_isotope = A × ω⁴
```

**Defect Scattering Rate**:
```
Γ_defect = B × ω⁴ × n_defect
```

**Boundary Scattering**:
```
Γ_boundary = v_g / L_sample
```

**Phonon-Phonon** (Umklapp):
```
Γ_pp ∝ T × ω² × exp(-θ_D/3T)
```

**Location**: Lines 43-44

## Physical Principles

### Scattering Mechanisms

**Isotope Scattering**:
- Natural isotope distribution creates mass disorder
- Scattering rate ∝ ω⁴ (Rayleigh scattering)
- Dominant at low temperatures (T < 10K)
- Important for high-purity crystals

**Point Defect Scattering**:
- Vacancies, interstitials, impurities
- Also ∝ ω⁴ (Rayleigh regime)
- Concentration-dependent

**Boundary Scattering**:
- Grain boundaries in polycrystals
- Sample surfaces
- Rate ∝ v/L where L is grain size
- Important at low T when other rates small

**Phonon-Phonon (Anharmonic)**:
- Thermal phonon bath creates scattering
- Normal processes: momentum conserved
- Umklapp processes: momentum not conserved
- Temperature-dependent: increases with T

### Matthiessen's Rule

Total scattering rate is sum of independent rates:
```
Γ_total = Γ_isotope + Γ_defect + Γ_boundary + Γ_pp
```

Valid when scattering mechanisms are uncorrelated.

### Angular Distribution

**Isotropic Scattering**:
- Equal probability all directions
- Valid for strong perturbations
- Used in current implementation

**Forward-Peaked**:
- Small-angle scattering dominant
- More realistic for weak perturbations
- Not currently implemented

## Temperature Dependence

Scattering rate varies strongly with temperature:

**Low T (< 10K)**:
- Isotope and defect scattering dominant
- λ_scatter ~ constant or increases with T
- Mean free path: mm to cm

**Intermediate T (10-100K)**:
- Mixed regime
- All mechanisms contribute
- λ_scatter ~ 10 μm to mm

**High T (> 100K)**:
- Phonon-phonon scattering dominant
- λ_scatter ∝ 1/T
- Mean free path: 1-10 μm

## Practical Considerations

### Current Implementation Behavior

**Track Destruction**: Parent phonon is killed and replaced with new track
- Allows polarization changes (L → T or T → T')
- Mimics detailed balance with thermal bath
- Slightly non-physical (should preserve identity in elastic limit)

**Energy Conservation**: Approximately maintained
- Small energy changes allowed
- Represents exchange with thermal bath
- More realistic for T > 0

**Position**: Scattering occurs at interaction point
- No displacement (elastic in space)
- Only momentum changes

### Transportation Note

The README mentions "Currently handles 'transportation' as well" (Line 30-31 in phonon/README). This refers to early implementation where scattering also handled phonon propagation. Modern versions use standard G4Transportation.

## Usage Example

```cpp
#include "G4PhononScattering.hh"

// In physics list
G4PhononScattering* scattering = new G4PhononScattering();

// Add to all phonon types
for (auto phonon : {phononL, phononTS, phononTF}) {
    G4ProcessManager* pmanager = phonon->GetProcessManager();
    pmanager->AddDiscreteProcess(scattering);
}

// Scattering will compete with downconversion and reflection
```

## Detector Applications

**Cryogenic Detectors**:
- Determines phonon collection efficiency
- Limits position resolution (diffusion)
- Affects timing (trapping)

**Thermal Conductivity**:
- Scattering limits κ = (1/3) C v λ
- Important for detector thermal design

**Signal Formation**:
- Scattering delays phonon collection
- Broadens detector pulses
- Creates phonon trapping in defect regions

## Material Dependence

**High-Purity Crystals** (Ge, Si):
- Long mean free path (λ ~ mm at 4K)
- Isotope scattering dominant
- Used for radiation detectors

**Doped Materials**:
- Shorter λ due to impurities
- Defect scattering important
- Trade-off: doping improves sensors but reduces λ

**Polycrystalline**:
- Very short λ (grain boundary scattering)
- Ineffective for phonon detectors
- Limits thermal conductivity

## Performance Notes

**Mean Free Path**: Highly variable
- High-purity Ge at 4K: λ ~ 1 mm
- Room temperature: λ ~ 1 μm
- Doped materials: λ ~ 10-100 μm

**Computational Cost**: Light
- Isotropic sampling: ~50 ns
- Track creation: ~200 ns
- Total: ~250 ns per scattering event

**Process Competition**:
- At low energy: scattering dominates
- At high energy: downconversion faster
- At boundaries: reflection most likely

## See Also

- [G4VPhononProcess](g4vphononprocess.md) - Base class
- [G4PhononDownconversion](g4phonondownconversion.md) - Competing process
- [G4PhononReflection](g4phononreflection.md) - Boundary process
- [G4LatticeManager](g4latticemanager.md) - Material properties
