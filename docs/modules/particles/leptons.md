# Leptons

## Overview

Leptons are fundamental fermions that do not experience strong nuclear force interactions. Geant4 implements all three charged lepton families (electron, muon, tau) along with their associated neutrinos and antiparticles, totaling 12 lepton species. These particles are essential for electromagnetic shower simulations, weak interaction processes, and particle decay modeling.

Leptons participate in electromagnetic and weak interactions but not strong interactions. They are characterized by their lepton family number, which is conserved in Standard Model interactions. Each lepton has a corresponding neutrino and antiparticle.

## Particle List

### Charged Leptons and Antiparticles

| Particle Name | Symbol | PDG Code | Mass (MeV) | Charge | Lifetime | Class Name |
|--------------|---------|----------|------------|---------|-----------|-------------|
| Electron | e⁻ | 11 | 0.511 | -1 | Stable | `G4Electron` |
| Positron | e⁺ | -11 | 0.511 | +1 | Stable | `G4Positron` |
| Muon (minus) | μ⁻ | 13 | 105.66 | -1 | 2197 ns | `G4MuonMinus` |
| Muon (plus) | μ⁺ | -13 | 105.66 | +1 | 2197 ns | `G4MuonPlus` |
| Tau (minus) | τ⁻ | 15 | 1776.86 | -1 | 0.290 ps | `G4TauMinus` |
| Tau (plus) | τ⁺ | -15 | 1776.86 | +1 | 0.290 ps | `G4TauPlus` |

### Neutrinos and Antineutrinos

| Particle Name | Symbol | PDG Code | Mass (MeV) | Charge | Lifetime | Class Name |
|--------------|---------|----------|------------|---------|-----------|-------------|
| Electron Neutrino | νₑ | 12 | 0 | 0 | Stable | `G4NeutrinoE` |
| Electron Antineutrino | ν̄ₑ | -12 | 0 | 0 | Stable | `G4AntiNeutrinoE` |
| Muon Neutrino | νμ | 14 | 0 | 0 | Stable | `G4NeutrinoMu` |
| Muon Antineutrino | ν̄μ | -14 | 0 | 0 | Stable | `G4AntiNeutrinoMu` |
| Tau Neutrino | ντ | 16 | 0 | 0 | Stable | `G4NeutrinoTau` |
| Tau Antineutrino | ν̄τ | -16 | 0 | 0 | Stable | `G4AntiNeutrinoTau` |

## Usage Pattern

All lepton classes in Geant4 follow a singleton pattern. Access particles using their static methods:

```cpp
// Accessing lepton definitions
G4ParticleDefinition* electron = G4Electron::Definition();
G4ParticleDefinition* muon = G4MuonMinus::MuonMinus();
G4ParticleDefinition* tau = G4TauMinus::TauMinus();
G4ParticleDefinition* neutrino = G4NeutrinoE::NeutrinoE();

// Alternative access methods
G4Electron* e = G4Electron::Electron();
G4MuonPlus* muPlus = G4MuonPlus::MuonPlusDefinition();

// From particle table
G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
G4ParticleDefinition* electron = particleTable->FindParticle("e-");
G4ParticleDefinition* muon = particleTable->FindParticle("mu-");
G4ParticleDefinition* tau = particleTable->FindParticle("tau-");
```

## Quantum Numbers

### Spin and Parity

| Particle | Spin (ℏ/2) | 2×Spin | Parity | JPⁿ |
|----------|------------|--------|---------|-----|
| e±, μ±, τ± | 1/2 | 1 | +1 | 1/2⁺ |
| Neutrinos | 1/2 | 1 | +1 | 1/2⁺ |

### Lepton Numbers

Lepton family number is conserved in Standard Model processes:

| Particle | Lₑ | Lμ | Lτ | Total L |
|----------|-----|-----|-----|---------|
| e⁻, νₑ | +1 | 0 | 0 | +1 |
| e⁺, ν̄ₑ | -1 | 0 | 0 | -1 |
| μ⁻, νμ | 0 | +1 | 0 | +1 |
| μ⁺, ν̄μ | 0 | -1 | 0 | -1 |
| τ⁻, ντ | 0 | 0 | +1 | +1 |
| τ⁺, ν̄τ | 0 | 0 | -1 | -1 |

## Code Examples

### Creating Particle Guns

```cpp
#include "G4ParticleGun.hh"
#include "G4Electron.hh"
#include "G4MuonMinus.hh"

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Create an electron gun
    auto particleGun = new G4ParticleGun(1);
    particleGun->SetParticleDefinition(G4Electron::Definition());
    particleGun->SetParticleMomentumDirection(G4ThreeVector(0., 0., 1.));
    particleGun->SetParticleEnergy(10.*GeV);
    particleGun->SetParticlePosition(G4ThreeVector(0., 0., -5.*m));
    particleGun->GeneratePrimaryVertex(event);
}
```

### Particle Identification in Stepping Action

```cpp
#include "G4Track.hh"
#include "G4Electron.hh"
#include "G4MuonMinus.hh"
#include "G4TauMinus.hh"

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();
    G4ParticleDefinition* particle = track->GetDefinition();

    // Check particle type
    if (particle == G4Electron::Definition()) {
        G4cout << "Electron detected" << G4endl;
    }
    else if (particle == G4MuonMinus::Definition() ||
             particle == G4MuonPlus::Definition()) {
        G4cout << "Muon detected" << G4endl;
        G4double energy = track->GetKineticEnergy();
        G4cout << "Muon energy: " << energy/MeV << " MeV" << G4endl;
    }
}
```

### Checking Lepton Properties

```cpp
#include "G4ParticleDefinition.hh"
#include "G4Electron.hh"

void AnalyzeLepton()
{
    G4ParticleDefinition* electron = G4Electron::Definition();

    // Get particle properties
    G4String name = electron->GetParticleName();           // "e-"
    G4double mass = electron->GetPDGMass();                 // 0.511 MeV
    G4double charge = electron->GetPDGCharge();             // -1.0
    G4int pdg = electron->GetPDGEncoding();                 // 11
    G4int leptonNumber = electron->GetLeptonNumber();       // 1
    G4bool stable = electron->GetPDGStable();               // true

    G4cout << "Particle: " << name << G4endl;
    G4cout << "Mass: " << mass/MeV << " MeV" << G4endl;
    G4cout << "Charge: " << charge/eplus << " e" << G4endl;
    G4cout << "Lepton number: " << leptonNumber << G4endl;
}
```

### Using Leptons in Processes

```cpp
#include "G4ProcessManager.hh"
#include "G4MuonMinus.hh"
#include "G4MuIonisation.hh"
#include "G4MuBremsstrahlung.hh"
#include "G4MuPairProduction.hh"
#include "G4MuMultipleScattering.hh"

void RegisterMuonPhysics()
{
    G4ParticleDefinition* muonMinus = G4MuonMinus::Definition();
    G4ProcessManager* pManager = muonMinus->GetProcessManager();

    // Add electromagnetic processes for muons
    pManager->AddProcess(new G4MuMultipleScattering(), -1, 1, 1);
    pManager->AddProcess(new G4MuIonisation(),         -1, 2, 2);
    pManager->AddProcess(new G4MuBremsstrahlung(),     -1, 3, 3);
    pManager->AddProcess(new G4MuPairProduction(),     -1, 4, 4);
}
```

### Decay Channels

```cpp
#include "G4DecayTable.hh"
#include "G4MuonMinus.hh"

void InspectMuonDecay()
{
    G4ParticleDefinition* muon = G4MuonMinus::Definition();
    G4DecayTable* decayTable = muon->GetDecayTable();

    if (decayTable) {
        G4int nChannels = decayTable->entries();
        G4cout << "Muon has " << nChannels << " decay channels" << G4endl;

        // Muon decay: μ⁻ → e⁻ + ν̄ₑ + νμ
        for (G4int i = 0; i < nChannels; i++) {
            G4VDecayChannel* channel = decayTable->GetDecayChannel(i);
            G4cout << "Channel " << i << ": BR = "
                   << channel->GetBR() << G4endl;
        }
    }
}
```

## Physics Background

### Lepton Families

Leptons are organized into three generations, each containing a charged lepton and its neutrino:

1. **First Generation (Electron Family)**
   - Electron (e⁻): The lightest charged lepton, stable and ubiquitous in matter
   - Electron neutrino (νₑ): Produced in beta decay and electron capture

2. **Second Generation (Muon Family)**
   - Muon (μ⁻): Heavier copy of the electron, decays via weak interaction
   - Muon neutrino (νμ): Produced in pion/kaon decay and muon decay

3. **Third Generation (Tau Family)**
   - Tau (τ⁻): Heaviest charged lepton, very short-lived
   - Tau neutrino (ντ): Produced in tau decay

### Lepton Number Conservation

In Standard Model processes, lepton family numbers are conserved separately:
- Electron number (Lₑ) is conserved
- Muon number (Lμ) is conserved
- Tau number (Lτ) is conserved
- Total lepton number (L = Lₑ + Lμ + Lτ) is conserved

Example: Muon decay conserves lepton numbers:
```
μ⁻ → e⁻ + ν̄ₑ + νμ
Lₑ:  0  →  1  +  (-1) + 0  = 0  ✓
Lμ:  1  →  0  +   0   + 1  = 1  ✓
```

### Electromagnetic Interactions

Charged leptons interact electromagnetically with characteristic energy loss mechanisms:

- **Electrons/Positrons (E < 100 MeV)**: Dominated by ionization
- **Electrons/Positrons (E > 100 MeV)**: Bremsstrahlung becomes important
- **Muons (all energies)**: Ionization, bremsstrahlung, pair production
- **Taus**: Primarily decay before interacting electromagnetically

### Weak Interactions

All leptons participate in weak interactions:

- **Charged Current**: Converts charged leptons to neutrinos (e.g., beta decay)
- **Neutral Current**: Neutrino scattering without flavor change
- **Neutrino Oscillations**: Mixing between neutrino flavors (not implemented in Geant4 by default)

## See Also

- [Particle Module Overview](../particles.md)
- [Bosons](bosons.md) - Photons and gauge bosons
- [Electromagnetic Physics](../physics/electromagnetic.md)
- [Decay Processes](../physics/decay.md)
- [G4ParticleDefinition Reference](/api/particles/G4ParticleDefinition.md)

## Related Source Files

- Header files: `/source/particles/leptons/include/`
- Implementation: `/source/particles/leptons/src/`
- Constructor: `G4LeptonConstructor.hh`

## References

- PDG (Particle Data Group): [Leptons](https://pdg.lbl.gov/2024/listings/contents_listings.html)
- Geant4 Physics Reference Manual: Electromagnetic Processes
- Geant4 User's Guide: Particle Definitions
