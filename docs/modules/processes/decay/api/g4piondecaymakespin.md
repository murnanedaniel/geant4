# G4PionDecayMakeSpin

**File**: `source/processes/decay/include/G4PionDecayMakeSpin.hh`

## Overview

G4PionDecayMakeSpin is a specialized decay process that correctly calculates muon polarization in pion and kaon decays. It extends G4Decay to implement the V-A (Vector minus Axial) structure of weak interactions, ensuring that muons produced in π→μν and K→μν decays have the correct helicity and spin orientation. This class is critical for experiments involving polarized muon beams and precision tests of weak interaction physics.

## Class Description

G4PionDecayMakeSpin handles weak decay physics for mesons decaying to muons:

- **Applicable Particles**: π±, K±, K⁰_L
- **Target Decays**: Two-body decays producing muons and neutrinos
- **Spin Calculation**: Implements V-A weak interaction formula
- **Helicity Handling**: Correctly sets muon helicity based on charge
- **Multi-Body Fallback**: Random polarization for non-two-body decays
- **Daughter Polarization**: Overrides DaughterPolarization method

The process ensures that:
- Muons from π⁺→μ⁺ν are nearly 100% right-handed
- Muons from π⁻→μ⁻ν̄ are nearly 100% left-handed
- Kaon decays follow the same helicity structure
- Polarization vectors are correctly normalized

**Inheritance**: G4Decay → G4VRestDiscreteProcess → G4VProcess

**Location**: `source/processes/decay/include/G4PionDecayMakeSpin.hh:39`

## Constructor & Destructor

### Constructor

```cpp
G4PionDecayMakeSpin(const G4String& processName = "Decay");
```

Creates a pion/kaon decay process with muon spin handling.

**Parameters**:
- `processName`: Name of the process (default: "Decay")

**Implementation**: Lines 38-44 in `source/processes/decay/src/G4PionDecayMakeSpin.cc`

```cpp
G4PionDecayMakeSpin::G4PionDecayMakeSpin(const G4String& processName)
    : G4Decay(processName)
{
    // Set Process Sub Type
    SetProcessSubType(static_cast<int>(DECAY_PionMakeSpin));
}
```

**Process Sub-Type**: Sets to `DECAY_PionMakeSpin` (203).

**Location**: `source/processes/decay/include/G4PionDecayMakeSpin.hh:44`

### Destructor

```cpp
virtual ~G4PionDecayMakeSpin();
```

Virtual destructor.

**Implementation**: Line 46 in `source/processes/decay/src/G4PionDecayMakeSpin.cc`

**Location**: `source/processes/decay/include/G4PionDecayMakeSpin.hh:47`

## Process Description

### ProcessDescription

```cpp
virtual void ProcessDescription(std::ostream& outFile) const override;
```

Writes process description to output stream.

**Parameters**:
- `outFile`: Output stream

**Implementation**: Lines 150-157 in `source/processes/decay/src/G4PionDecayMakeSpin.cc`

```cpp
outFile << GetProcessName()
        << ": Decay of mesons that can decay into a muon \n"
        << " i.e. pi+, pi-, K+, K- and K0_long \n"
        << " kinematics of daughters are determined by DecayChannels \n"
        << " polarization of daughter particles are taken into account. \n";
```

**Location**: `source/processes/decay/include/G4PionDecayMakeSpin.hh:49`

## Daughter Polarization

### DaughterPolarization (Protected)

```cpp
protected:
virtual void DaughterPolarization(
    const G4Track& aTrack,
    G4DecayProducts* products
) override;
```

Calculates and sets muon polarization based on V-A weak interaction.

**Parameters**:
- `aTrack`: Parent track (pion/kaon)
- `products`: Decay products to set polarization

**Implementation**: Lines 48-148 in `source/processes/decay/src/G4PionDecayMakeSpin.cc`

**Algorithm**:

1. **Particle Check**: Verify parent is π±, K±, or K⁰_L
2. **Daughter Identification**: Find muon and neutrino in products
3. **Two-Body Check**: Ensure exactly two-body decay (μ + ν)
4. **Spin Calculation**: Apply V-A formula for muon spin
5. **Charge Correction**: Flip spin for negatively charged parents
6. **Normalization**: Convert to unit vector
7. **Set Polarization**: Apply to muon

**Particle Identification** (lines 54-85):
```cpp
// Get particle definitions
G4ParticleDefinition* aMuonPlus =
    G4ParticleTable::GetParticleTable()->FindParticle("mu+");
G4ParticleDefinition* aMuonMinus =
    G4ParticleTable::GetParticleTable()->FindParticle("mu-");
G4ParticleDefinition* aPionPlus =
    G4ParticleTable::GetParticleTable()->FindParticle("pi+");
// ... K+, K-, K0L, neutrinos

// Check if parent is applicable
if (aParticleDef == aPionPlus   ||
    aParticleDef == aPionMinus  ||
    aParticleDef == aKaonPlus   ||
    aParticleDef == aKaonMinus  ||
    aParticleDef == aKaon0Long) {
} else {
    return;  // Not applicable
}
```

**Find Muon and Neutrino** (lines 87-112):
```cpp
G4DynamicParticle* aMuon = nullptr;
G4double emu(0), eneutrino(0);
G4ThreeVector p_muon, p_neutrino;

for (G4int index=0; index < numberOfSecondaries; index++) {
    G4DynamicParticle* aSecondary = (*products)[index];
    const G4ParticleDefinition* aSecondaryDef = aSecondary->GetDefinition();

    if (aSecondaryDef == aMuonPlus || aSecondaryDef == aMuonMinus) {
        // Muon+ or Muon-
        aMuon = aSecondary;
        emu = aSecondary->GetTotalEnergy();
        p_muon = aSecondary->GetMomentum();
    } else if (aSecondaryDef == aNeutrinoMu ||
               aSecondaryDef == aAntiNeutrinoMu) {
        // Muon-Neutrino / Muon-Anti-Neutrino
        eneutrino = aSecondary->GetTotalEnergy();
        p_neutrino = aSecondary->GetMomentum();
    }
}
```

**Spin Calculation for Two-Body Decay** (lines 114-141):

The muon spin in the parent rest frame is given by V-A theory:

```cpp
const G4DynamicParticle* theParentParticle = products->GetParentParticle();
G4double amass = theParentParticle->GetMass();  // Parent mass
G4double emmu = aMuonPlus->GetPDGMass();        // Muon mass

if (numberOfSecondaries == 2) {
    // V-A formula for muon spin
    G4double scale = -(eneutrino - (p_muon * p_neutrino)/(emu + emmu));

    p_muon = scale * p_muon;
    p_neutrino = emmu * p_neutrino;
    spin = p_muon + p_neutrino;

    scale = 2./(amass*amass - emmu*emmu);
    spin = scale * spin;

    if (aParticle->GetCharge() < 0.0) spin = -spin;

} else {
    // Multi-body decay: random polarization
    spin = G4RandomDirection();
}

// Normalize
spin = spin.unit();

// Set muon polarization
aMuon->SetPolarization(spin.x(), spin.y(), spin.z());
```

**Physics Formula**:

For π⁺ → μ⁺ + ν_μ in the pion rest frame:

```
S_μ = (2/(M_π² - m_μ²)) × [-(E_ν - (p_μ·p_ν)/(E_μ + m_μ)) × p_μ + m_μ × p_ν]
```

Where:
- M_π: Pion mass
- m_μ: Muon mass
- E_μ, E_ν: Muon and neutrino energies
- p_μ, p_ν: Muon and neutrino momenta

The sign flips for π⁻ to maintain helicity structure.

**Location**: `source/processes/decay/include/G4PionDecayMakeSpin.hh:62-63`

## Applicable Particles

The process handles these mesons:

| Particle | Charge | Main Decay Mode | BR |
|----------|--------|----------------|-----|
| **π⁺** | +1 | μ⁺ + ν_μ | 99.99% |
| **π⁻** | -1 | μ⁻ + ν̄_μ | 99.99% |
| **K⁺** | +1 | μ⁺ + ν_μ | 63.6% |
| **K⁻** | -1 | μ⁻ + ν̄_μ | 63.6% |
| **K⁰_L** | 0 | π + μ + ν | ~27% |

**Particle Definitions** (lines 59-76):
- `mu+`, `mu-`: Final state muons
- `pi+`, `pi-`: Charged pions
- `kaon+`, `kaon-`: Charged kaons
- `kaon0L`: Long-lived neutral kaon
- `nu_mu`, `anti_nu_mu`: Muon neutrinos

## Usage Examples

### Example 1: Basic Setup

```cpp
#include "G4PionDecayMakeSpin.hh"
#include "G4PionPlus.hh"
#include "G4PionMinus.hh"
#include "G4KaonPlus.hh"
#include "G4KaonMinus.hh"
#include "G4KaonZeroLong.hh"
#include "G4ProcessManager.hh"

// Create decay process
G4PionDecayMakeSpin* pionDecay = new G4PionDecayMakeSpin("Decay");

// Apply to all relevant mesons
std::vector<G4ParticleDefinition*> particles = {
    G4PionPlus::Definition(),
    G4PionMinus::Definition(),
    G4KaonPlus::Definition(),
    G4KaonMinus::Definition(),
    G4KaonZeroLong::Definition()
};

for (auto particle : particles) {
    G4ProcessManager* pManager = particle->GetProcessManager();
    pManager->AddProcess(pionDecay);
    pManager->SetProcessOrdering(pionDecay, idxPostStep);
    pManager->SetProcessOrdering(pionDecay, idxAtRest);
}
```

### Example 2: Polarized Muon Beam Production

```cpp
#include "G4ParticleGun.hh"
#include "G4PionPlus.hh"

// Create pion beam
G4ParticleGun* gun = new G4ParticleGun();
gun->SetParticleDefinition(G4PionPlus::Definition());
gun->SetParticleMomentum(1.0*GeV);
gun->SetParticlePosition(G4ThreeVector(0, 0, -100*cm));
gun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));

// Pions will decay to polarized muons
// Muons will be right-handed (positive helicity)
```

### Example 3: Analyzing Muon Polarization

```cpp
#include "G4Step.hh"
#include "G4Track.hh"

void MySteppingAction::UserSteppingAction(const G4Step* step) {
    const G4Track* track = step->GetTrack();

    // Look for muon production from pion decay
    if (track->GetParentID() > 0) {  // Secondary particle
        G4String parentName = GetParentParticleName(track);
        G4String particleName = track->GetDefinition()->GetParticleName();

        if ((parentName == "pi+" || parentName == "pi-") &&
            (particleName == "mu+" || particleName == "mu-")) {

            // Get muon polarization
            G4ThreeVector pol = track->GetPolarization();

            // Get muon momentum
            G4ThreeVector mom = track->GetMomentum();
            G4ThreeVector momDir = mom.unit();

            // Calculate helicity (pol · momentum direction)
            G4double helicity = pol.dot(momDir);

            G4cout << "Muon from " << parentName << " decay:" << G4endl;
            G4cout << "  Polarization: " << pol << G4endl;
            G4cout << "  Helicity: " << helicity << G4endl;

            // For π⁺→μ⁺: expect helicity ≈ +1 (right-handed)
            // For π⁻→μ⁻: expect helicity ≈ -1 (left-handed)
        }
    }
}
```

### Example 4: Muon Spin Rotation (μSR) Simulation

```cpp
#include "G4PionDecayMakeSpin.hh"
#include "G4UniformMagField.hh"

// Set up for muon spin rotation experiment

// Create pion decay with spin
G4PionDecayMakeSpin* pionDecay = new G4PionDecayMakeSpin();

// Add to pions
// ... (as in Example 1)

// Optional: Add magnetic field for muon precession
G4ThreeVector fieldValue(0., 0., 100*gauss);
G4UniformMagField* magField = new G4UniformMagField(fieldValue);

// The muons produced will have correct initial polarization
// Then they can precess in the magnetic field during tracking
```

### Example 5: Validating Helicity

```cpp
// In analysis code
#include "TH1F.h"

// Create histogram for helicity distribution
TH1F* h_helicity = new TH1F("h_helicity",
    "Muon Helicity from Pion Decay;Helicity;Entries",
    100, -1.5, 1.5);

// Fill in stepping action (as in Example 3)
h_helicity->Fill(helicity);

// Expected results:
// - π⁺→μ⁺: peak at +1 (width due to muon mass)
// - π⁻→μ⁻: peak at -1
// - Width ≈ (m_μ/m_π)² ≈ 0.6% for pions
```

## Physics Background

### V-A Theory of Weak Interactions

The weak interaction Hamiltonian has the form:
```
H_weak ∝ (V - A)
```

Where V = vector current, A = axial vector current.

This leads to:
- **Maximal parity violation**
- **Helicity selection**: Neutrinos are left-handed, antineutrinos right-handed
- **Muon polarization**: Opposite helicity to neutrino in rest frame

### Helicity in Pion Decay

For π⁺ → μ⁺ + ν_μ:

1. **Conservation**: Pion has J=0 (zero spin)
2. **Angular Momentum**: Muon and neutrino spins must be opposite
3. **Neutrino**: Always left-handed (helicity = -1)
4. **Muon**: Preferentially right-handed

The muon helicity is:
```
h = -(1 - (m_μ/m_π)²) ≈ -0.9988
```

The small deviation from -1 is due to the muon mass.

### Polarization Vector

In the pion rest frame, the muon polarization points approximately opposite to its momentum (for π⁺):
```
S_μ ≈ -p̂_μ
```

After Lorentz transformation to the lab frame, the polarization must be boosted along with the particle.

### Kaon Decays

Kaon decays follow the same V-A structure:
- K⁺ → μ⁺ + ν_μ: Same as pion (larger mass difference)
- K⁰_L → π + μ + ν: Three-body decay (random polarization in this implementation)

## Limitations and Considerations

### Two-Body Decays Only

The V-A formula is implemented only for two-body decays (μ + ν):
- **Two-body**: Correct V-A spin calculation
- **Multi-body**: Random isotropic polarization

**Code** (line 138-140):
```cpp
} else {
    spin = G4RandomDirection();
}
```

### Multi-Body Kaon Decays

K⁰_L has significant three-body branching ratios:
- K⁰_L → π± + μ∓ + ν (~27%)

For these, the current implementation uses random polarization. A full implementation would require the Dalitz plot distribution.

### Radiative Corrections

The implementation does not include:
- QED radiative corrections (π → μ + ν + γ)
- Structure-dependent terms
- Higher-order weak corrections

These effects are typically <1% level.

### Frame Dependence

The spin calculation is done in the decay (parent rest) frame, then the products are boosted to the lab frame by G4Decay base class.

## Related Classes

- **[G4Decay](./g4decay.md)**: Base class
- **[G4DecayWithSpin](./g4decaywithspin.md)**: Related spin-handling class
- **G4DecayProducts**: Decay product container
- **G4DynamicParticle**: Particle with polarization
- **G4ParticleTable**: Particle definition lookup

## Applications

G4PionDecayMakeSpin is essential for:

1. **Muon Facilities**:
   - Surface muon beams (4 MeV from pion decay at rest)
   - Decay muon beams (higher energy from in-flight decay)
   - Polarized muon sources (TRIUMF, PSI, J-PARC)

2. **Muon Spin Research (μSR)**:
   - Material science studies
   - Condensed matter physics
   - Chemistry and biology applications

3. **Particle Physics**:
   - Weak interaction tests
   - Michel parameter measurements
   - Lepton universality studies

4. **Neutrino Experiments**:
   - Pion beam decay pipes
   - Muon polarization in neutrino beams
   - Near detector studies

5. **Muon Collider Studies**:
   - Polarized muon beam production
   - Decay backgrounds
   - Beam polarimetry

## Notes

- Only applicable to π±, K±, K⁰_L
- Two-body μ+ν decays get V-A spin calculation
- Multi-body decays get random polarization
- Automatically handles charge to set correct helicity
- Muon spin is normalized to unit vector
- Compatible with both at-rest and in-flight decay
- Thread-safe: each thread has its own process instance
- No radiative corrections included
- Assumes parent is at rest in its own frame when applying V-A formula
