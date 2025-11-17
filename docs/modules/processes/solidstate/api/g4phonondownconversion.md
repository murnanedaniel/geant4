# G4PhononDownconversion

**File**: `source/processes/solidstate/phonon/include/G4PhononDownconversion.hh`

## Overview

G4PhononDownconversion simulates anharmonic decay of phonons into lower-energy phonons through three-phonon interactions. This process is crucial for phonon thermalization in cryogenic detectors and determines how energy depositions cascade down to detectable phonon frequencies.

## Class Description

G4PhononDownconversion implements anharmonic phonon decay:

- **L → L' + T'**: Longitudinal phonon splits into L + T
- **L → T' + T''**: Longitudinal phonon splits into two transverse
- **T → T' + T''**: Transverse phonon splits into two transverse
- **Energy-Momentum Conservation**: Enforces kinematic constraints
- **Phase Space Sampling**: Determines daughter phonon properties
- **Decay Probabilities**: Uses anharmonic coupling constants

**Physical Basis**: Crystal potential anharmonicity creates cubic terms allowing 3-phonon interactions: φ → φ' + φ''.

**Inheritance**: G4VPhononProcess → G4VDiscreteProcess → G4VProcess

**Location**: `source/processes/solidstate/phonon/include/G4PhononDownconversion.hh:35`

## Constructor & Destructor

### Constructor

```cpp
G4PhononDownconversion(const G4String& processName = "phononDownconversion");
```

**Parameters**:
- `processName`: Process name (default: "phononDownconversion")

**Location**: Line 37

### Destructor

```cpp
virtual ~G4PhononDownconversion();
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

Executes phonon downconversion.

**Process**:
1. Get parent phonon properties (polarization, wavevector, energy)
2. Choose decay channel (L→LT, L→TT, T→TT)
3. Sample daughter phonon kinematics
4. Create two daughter phonon tracks
5. Kill parent phonon

**Location**: Line 40

### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aPD);
```

Checks if process applies to particle.

**Returns**: `true` for all phonon types

**Note**: Process rate may be zero for some polarizations/energies, but process is always registered.

**Location**: Line 42

### GetMeanFreePath

```cpp
protected:
virtual G4double GetMeanFreePath(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
);
```

Calculates mean free path for downconversion.

**Formula**: λ = v_group × τ_decay

where:
- v_group: Group velocity from lattice
- τ_decay: Decay time from anharmonic coupling

**Decay Rate**: Γ = A × ω² × T for thermal phonons

**Location**: Line 45

## Decay Probability Methods

### GetLTDecayProb

```cpp
private:
G4double GetLTDecayProb(G4double energy, G4double temperature) const;
```

Returns probability for L → L' + T' decay.

**Parameters**:
- `energy`: Parent phonon energy
- `temperature`: Lattice temperature

**Returns**: Relative decay probability

**Physics**: Determined by anharmonic coupling constant β.

**Location**: Line 49

### GetTTDecayProb

```cpp
private:
G4double GetTTDecayProb(G4double energy, G4double temperature) const;
```

Returns probability for T → T' + T'' decay.

**Parameters**:
- `energy`: Parent phonon energy
- `temperature`: Lattice temperature

**Returns**: Relative decay probability

**Physics**: Determined by coupling constants γ, λ, μ.

**Location**: Line 50

## Deviation Sampling Methods

### MakeLDeviation

```cpp
private:
G4double MakeLDeviation(G4double energy, G4double temperature) const;
```

Samples energy deviation for L daughter in L→LT decay.

**Parameters**:
- `energy`: Parent phonon energy
- `temperature`: Lattice temperature

**Returns**: Energy fraction for L daughter

**Location**: Line 51

### MakeTTDeviation

```cpp
private:
G4double MakeTTDeviation(G4double energy, G4double temperature) const;
```

Samples energy deviation for T→TT decay.

**Location**: Line 52

### MakeTDeviation

```cpp
private:
G4double MakeTDeviation(G4double energy, G4double temperature) const;
```

Samples energy deviation for T daughter in general decay.

**Location**: Line 53

## Secondary Creation Methods

### MakeTTSecondaries

```cpp
private:
void MakeTTSecondaries(const G4Track& track);
```

Creates two transverse phonon secondaries.

**Parameters**:
- `track`: Parent track

**Process**:
1. Sample energy split
2. Sample angular distribution (isotropic)
3. Calculate wavevectors from energy
4. Create two T phonon tracks
5. Add to particle change

**Location**: Line 55

### MakeLTSecondaries

```cpp
private:
void MakeLTSecondaries(const G4Track& track);
```

Creates L + T phonon secondaries.

**Parameters**:
- `track`: Parent track

**Process**:
1. Sample L/T energy split
2. Ensure momentum conservation
3. Create one L and one T phonon
4. Add to particle change

**Location**: Line 56

## Private Data Members

### Anharmonic Coupling Constants

```cpp
private:
G4double fBeta;    // Line 59: L→LT coupling
G4double fGamma;   // Line 59: T→TT coupling
G4double fLambda;  // Line 59: Additional T→TT term
G4double fMu;      // Line 59: Additional T→TT term
```

Material-specific anharmonic coupling parameters.

**Typical Values** (Ge at 4K):
- β ~ 10¹⁹ s⁻¹eV⁻²
- γ, λ, μ ~ 10¹⁸ s⁻¹eV⁻²

**Location**: Line 59

## Physical Principles

### Anharmonic Potential

Crystal potential expansion:
```
V = V_harmonic + V_cubic + V_quartic + ...
```

Cubic terms enable 3-phonon processes:
```
H_cubic = β ∑_{k,k'} a_k a_k' a_{k+k'}
```

### Decay Channels

**L → L' + T'**:
- Common for high-energy L phonons
- Produces one L and one T daughter
- Energy split favors L daughter

**L → T' + T''**:
- Secondary channel for L phonons
- Produces two T daughters
- More phase space available

**T → T' + T''**:
- Primary T phonon decay
- Produces two T daughters
- Dominant at intermediate energies

### Conservation Laws

**Energy**: ω = ω' + ω''

**Momentum** (crystal): k = k' + k'' + G (reciprocal lattice vector)

**Polarization**: Selection rules from symmetry

## Usage Example

```cpp
#include "G4PhononDownconversion.hh"

// In physics list
G4PhononDownconversion* downconversion =
    new G4PhononDownconversion();

// Add to all phonon types
G4ParticleDefinition* phononL = G4PhononLong::Definition();
G4ParticleDefinition* phononTS = G4PhononTransSlow::Definition();
G4ParticleDefinition* phononTF = G4PhononTransFast::Definition();

for (auto phonon : {phononL, phononTS, phononTF}) {
    G4ProcessManager* pmanager = phonon->GetProcessManager();
    pmanager->AddDiscreteProcess(downconversion);
}
```

## Applications

**Cryogenic Detectors**:
- Determines phonon energy spectrum
- Affects timing resolution
- Influences collection efficiency

**Thermal Conductivity**:
- Dominant phonon scattering at T > 10K
- Limits heat transport

**Phonon Bottleneck**:
- Suppresses downconversion at low T
- Allows high-energy phonon accumulation

## Performance Notes

**Mean Free Path**: Typically 10-1000 μm depending on:
- Phonon energy (shorter λ for higher E)
- Temperature (longer λ at lower T)
- Material purity (defects reduce λ)

**Computational Cost**: Moderate
- Sampling decay channel: ~100 ns
- Creating secondaries: ~200 ns per phonon
- Total: ~500 ns per downconversion event

## See Also

- [G4VPhononProcess](g4vphononprocess.md) - Base class
- [G4PhononScattering](g4phononscattering.md) - Competing process
- [G4LatticeManager](g4latticemanager.md) - Material properties
- [G4PhononPolarization](g4phononpolarization.md) - Polarization codes
