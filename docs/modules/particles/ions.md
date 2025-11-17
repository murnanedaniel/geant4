# Ions

## Overview

Ions are atomic nuclei consisting of protons and neutrons. Geant4 provides explicit implementations for light ions (deuteron, triton, He-3, alpha), hypernuclei (nuclei containing lambda hyperons), and a generic ion class for arbitrary heavy nuclei. These particles are essential for nuclear physics simulations, heavy ion collisions, and medical physics applications.

Ions are characterized by atomic number (Z), mass number (A), charge state, and excitation energy. They participate in nuclear reactions, electromagnetic interactions, and can undergo radioactive decay.

## Particle List

### Light Ions

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | A | Z | N | Lifetime | Class Name |
|----------|---------|----------|------------|---------|---|---|---|----------|-------------|
| Deuteron | d, ²H | 1000010020 | 1875.613 | +1 | 2 | 1 | 1 | Stable | `G4Deuteron` |
| Triton | t, ³H | 1000010030 | 2808.921 | +1 | 3 | 1 | 2 | 17.8 years | `G4Triton` |
| Helium-3 | ³He | 1000020030 | 2808.391 | +2 | 3 | 2 | 1 | Stable | `G4He3` |
| Alpha | α, ⁴He | 1000020040 | 3727.379 | +2 | 4 | 2 | 2 | Stable | `G4Alpha` |
| Anti-Deuteron | d̄ | -1000010020 | 1875.613 | -1 | 2 | 1 | 1 | Stable | `G4AntiDeuteron` |
| Anti-Triton | t̄ | -1000010030 | 2808.921 | -1 | 3 | 1 | 2 | 17.8 years | `G4AntiTriton` |
| Anti-Helium-3 | ³H̄e | -1000020030 | 2808.391 | -2 | 3 | 2 | 1 | Stable | `G4AntiHe3` |
| Anti-Alpha | ᾱ | -1000020040 | 3727.379 | -2 | 4 | 2 | 2 | Stable | `G4AntiAlpha` |

### Hypernuclei (Lambda Baryons in Nuclei)

| Particle | Composition | PDG Code | Charge | A | Z | N | Λ | Class Name |
|----------|------------|----------|---------|---|---|---|---|-------------|
| Hyper-Triton | nnΛ | 1010010030 | 0 | 3 | 1 | 1 | 1 | `G4HyperTriton` |
| Hyper-H4 | pnnΛ | 1010010040 | +1 | 4 | 1 | 2 | 1 | `G4HyperH4` |
| Hyper-Alpha | pnΛ | 1010020040 | +2 | 4 | 2 | 1 | 1 | `G4HyperAlpha` |
| Hyper-He5 | ppnnΛ | 1010020050 | +2 | 5 | 2 | 2 | 1 | `G4HyperHe5` |
| Double-Hyper-H4 | nnΛΛ | 1020010040 | 0 | 4 | 1 | 0 | 2 | `G4DoubleHyperH4` |
| Double-Hyper-nn | nnΛΛ | 1020000040 | 0 | 4 | 0 | 0 | 2 | `G4DoubleHyperDoubleNeutron` |

Anti-hypernuclei are also implemented with corresponding anti-classes.

### Special Ion Classes

| Particle | Description | PDG Code | Class Name |
|----------|-------------|----------|-------------|
| Generic Ion | Placeholder for any ion | 0 | `G4GenericIon` |
| Generic Muonic Atom | Atom with bound muon | 0 | `G4GenericMuonicAtom` |

## Usage Pattern

Light ions follow the singleton pattern, while arbitrary heavy ions are created dynamically:

```cpp
// Accessing light ion definitions
G4ParticleDefinition* deuteron = G4Deuteron::Deuteron();
G4ParticleDefinition* triton = G4Triton::Definition();
G4ParticleDefinition* he3 = G4He3::He3();
G4ParticleDefinition* alpha = G4Alpha::Alpha();

// Generic ion (for heavy ions)
G4ParticleDefinition* genericIon = G4GenericIon::GenericIon();

// From particle table
G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
G4ParticleDefinition* deuteron = particleTable->FindParticle("deuteron");
G4ParticleDefinition* alpha = particleTable->FindParticle("alpha");

// Creating arbitrary heavy ions
G4int Z = 6;   // Carbon
G4int A = 12;  // Carbon-12
G4double E = 0.0;  // Ground state
G4ParticleDefinition* carbon12 = particleTable->GetIon(Z, A, E);
```

## Quantum Numbers

### Nuclear Quantum Numbers

| Property | Deuteron | Triton | He-3 | Alpha | Hypernuclei |
|----------|----------|---------|------|-------|-------------|
| Baryon Number (A) | 2 | 3 | 3 | 4 | 3-5 |
| Proton Number (Z) | 1 | 1 | 2 | 2 | 0-2 |
| Neutron Number (N) | 1 | 2 | 1 | 2 | 0-2 |
| Lambda Number (Λ) | 0 | 0 | 0 | 0 | 1-2 |
| Spin (J) | 1 | 1/2 | 1/2 | 0 | varies |
| Parity (P) | + | + | + | + | + |

### PDG Encoding for Ions

Geant4 uses the PDG encoding scheme for ions:
```
±10LZZZAAAI
```
Where:
- **L**: Total number of strange quarks (Lambdas in nucleus)
- **ZZZ**: Atomic number (proton number), padded to 3 digits
- **AAA**: Mass number (total baryons), padded to 3 digits
- **I**: Isomer level (0 for ground state)

Examples:
- Deuteron (²H): 1000010020
- Alpha (⁴He): 1000020040
- Carbon-12: 1000060120
- Hyper-Triton (nnΛ): 1010010030

## Code Examples

### Creating Light Ion Beams

```cpp
#include "G4ParticleGun.hh"
#include "G4Deuteron.hh"
#include "G4Alpha.hh"

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    auto particleGun = new G4ParticleGun(1);

    // Deuteron beam
    particleGun->SetParticleDefinition(G4Deuteron::Deuteron());
    particleGun->SetParticleEnergy(100.*MeV);  // 100 MeV/nucleon = 200 MeV total
    particleGun->SetParticleMomentumDirection(G4ThreeVector(0., 0., 1.));
    particleGun->SetParticlePosition(G4ThreeVector(0., 0., -10.*cm));
    particleGun->GeneratePrimaryVertex(event);
}
```

### Creating Heavy Ion Beams

```cpp
#include "G4IonTable.hh"
#include "G4ParticleGun.hh"

void CreateHeavyIonBeam()
{
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();

    // Carbon-12 ion (fully stripped, Q=+6)
    G4int Z = 6;
    G4int A = 12;
    G4double excitationEnergy = 0.*MeV;  // Ground state
    G4ParticleDefinition* carbon12 = particleTable->GetIon(Z, A, excitationEnergy);

    auto particleGun = new G4ParticleGun(1);
    particleGun->SetParticleDefinition(carbon12);
    particleGun->SetParticleCharge(6.*eplus);  // Fully ionized
    particleGun->SetParticleEnergy(400.*MeV/A);  // 400 MeV per nucleon

    // Lead-208 ion
    G4ParticleDefinition* lead208 = particleTable->GetIon(82, 208, 0.*MeV);
    particleGun->SetParticleDefinition(lead208);
    particleGun->SetParticleCharge(82.*eplus);
    particleGun->SetParticleEnergy(158.*GeV/A);  // RHIC energy
}
```

### Creating Excited Nuclear States

```cpp
#include "G4IonTable.hh"

void CreateExcitedNucleus()
{
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();

    // Excited state of Carbon-12 (Hoyle state at 7.654 MeV)
    G4int Z = 6;
    G4int A = 12;
    G4double excitation = 7.654*MeV;
    G4ParticleDefinition* carbon12_excited =
        particleTable->GetIon(Z, A, excitation);

    G4cout << "Created excited C-12 with E* = "
           << excitation/MeV << " MeV" << G4endl;
}
```

### Ion Identification in Tracking

```cpp
#include "G4Track.hh"
#include "G4Deuteron.hh"
#include "G4Alpha.hh"
#include "G4Ions.hh"

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();
    G4ParticleDefinition* particle = track->GetDefinition();

    // Check for specific light ions
    if (particle == G4Deuteron::Definition()) {
        G4cout << "Deuteron detected" << G4endl;
    }
    else if (particle == G4Alpha::Definition()) {
        G4cout << "Alpha particle detected" << G4endl;
    }

    // Check if particle is any ion
    if (particle->GetParticleType() == "nucleus") {
        auto ion = dynamic_cast<G4Ions*>(particle);
        if (ion) {
            G4int Z = ion->GetAtomicNumber();
            G4int A = ion->GetAtomicMass();
            G4double excitation = ion->GetExcitationEnergy();

            G4cout << "Ion: Z=" << Z << ", A=" << A
                   << ", E*=" << excitation/MeV << " MeV" << G4endl;
        }
    }
}
```

### Fragment Production Analysis

```cpp
#include "G4Step.hh"
#include "G4Ions.hh"

void AnalyzeFragmentation(const G4Step* step)
{
    // Analyze nuclear fragments from collision
    const std::vector<const G4Track*>* secondaries =
        step->GetSecondaryInCurrentStep();

    for (auto secondary : *secondaries) {
        G4ParticleDefinition* particle = secondary->GetDefinition();

        if (particle->GetParticleType() == "nucleus") {
            auto ion = dynamic_cast<G4Ions*>(particle);
            if (ion && ion->GetAtomicNumber() > 0) {
                G4int Z = ion->GetAtomicNumber();
                G4int A = ion->GetAtomicMass();
                G4double KE = secondary->GetKineticEnergy();

                G4cout << "Fragment: Z=" << Z << ", A=" << A
                       << ", KE=" << KE/MeV << " MeV" << G4endl;
            }
        }
    }
}
```

### Hypernucleus Detection

```cpp
#include "G4HyperTriton.hh"
#include "G4HyperAlpha.hh"

void DetectHypernucleus(const G4Track* track)
{
    G4ParticleDefinition* particle = track->GetDefinition();

    if (particle == G4HyperTriton::Definition()) {
        G4cout << "Hyper-Triton (nnΛ) detected" << G4endl;
    }
    else if (particle == G4HyperAlpha::Definition()) {
        G4cout << "Hyper-Alpha (pnΛ) detected" << G4endl;
    }

    // Check PDG code for hypernucleus
    G4int pdg = abs(particle->GetPDGEncoding());
    if (pdg > 1000000000) {
        G4int lambda = (pdg / 10000000) % 100;
        if (lambda > 0) {
            G4cout << "Hypernucleus with " << lambda
                   << " Lambda(s) detected" << G4endl;
        }
    }
}
```

### Ion Range and Stopping Power

```cpp
#include "G4EmCalculator.hh"
#include "G4Alpha.hh"

void CalculateIonRange()
{
    G4EmCalculator emCalculator;

    G4ParticleDefinition* alpha = G4Alpha::Alpha();
    G4Material* water = G4Material::GetMaterial("G4_WATER");

    G4double energy = 5.*MeV;  // 5 MeV alpha particle

    // Calculate range
    G4double range = emCalculator.GetRange(energy, alpha, water);

    // Calculate stopping power (dE/dx)
    G4double dedx = emCalculator.GetDEDX(energy, alpha, water);

    G4cout << "5 MeV alpha in water:" << G4endl;
    G4cout << "Range: " << range/mm << " mm" << G4endl;
    G4cout << "dE/dx: " << dedx/(MeV/mm) << " MeV/mm" << G4endl;
}
```

### Radioactive Decay

```cpp
#include "G4RadioactiveDecay.hh"
#include "G4IonTable.hh"

void SimulateRadioactiveDecay()
{
    // Create a radioactive isotope (e.g., Tritium)
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
    G4ParticleDefinition* tritium = particleTable->GetIon(1, 3, 0.);

    // Tritium (t) decays via beta decay: t → ³He + e⁻ + ν̄ₑ
    G4double lifetime = tritium->GetPDGLifeTime();
    G4cout << "Tritium lifetime: " << lifetime/year << " years" << G4endl;

    // The radioactive decay process will handle the decay automatically
}
```

### Working with Ion Table

```cpp
#include "G4IonTable.hh"

void IonTableOperations()
{
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
    G4IonTable* ionTable = particleTable->GetIonTable();

    // Get ion by Z, A
    G4ParticleDefinition* oxygen16 = ionTable->GetIon(8, 16);

    // Get ion by Z, A, excitation
    G4ParticleDefinition* oxygen16_excited = ionTable->GetIon(8, 16, 6.05*MeV);

    // Get ion by PDG code
    G4ParticleDefinition* alpha = ionTable->GetIon(1000020040);

    // Find all ions in table
    G4ParticleTable::G4PTblDicIterator* iterator =
        particleTable->GetIterator();
    iterator->reset();

    while ((*iterator)()) {
        G4ParticleDefinition* particle = iterator->value();
        if (particle->GetParticleType() == "nucleus") {
            G4cout << "Found ion: " << particle->GetParticleName() << G4endl;
        }
    }
}
```

## Physics Background

### Nuclear Structure

Light ions are bound states of nucleons:

**Deuteron (²H = p+n)**:
- Simplest nucleus beyond hydrogen
- Spin-1, weakly bound (2.22 MeV binding energy)
- Important for fusion reactions

**Triton (³H = p+n+n)**:
- Radioactive (β⁻ decay, t₁/₂ = 12.3 years)
- Produced in nuclear reactors
- Fusion fuel (d-t reaction)

**Helium-3 (³He = p+p+n)**:
- Rare on Earth, abundant on Moon
- Used in neutron detection
- Fusion fuel

**Alpha (⁴He = p+p+n+n)**:
- Very stable (28.3 MeV binding energy)
- Common decay product
- Highly ionizing particle

### Hypernuclei

Hypernuclei contain strange baryons (Λ, Σ, Ξ):

- **Hyper-Triton (³ΛH = n+n+Λ)**: Lightest hypernucleus
- **Hyper-Hydrogen-4 (⁴ΛH = p+n+n+Λ)**: Lambda bound to tritium
- **Double-Hyper Nuclei**: Contain two Lambdas, very rare

Hypernuclei decay via weak interaction:
- Λ → p + π⁻ (mesonic decay)
- Λ + N → N + N (non-mesonic decay)

### Ion Interactions

Ions participate in several physics processes:

**Electromagnetic Interactions**:
- Ionization (dominant energy loss mechanism)
- Multiple scattering
- Bremsstrahlung (negligible for heavy ions)
- Nuclear stopping power

**Nuclear Interactions**:
- Elastic scattering
- Inelastic collisions with fragmentation
- Fusion reactions (light ions)
- Spallation (high energy)

**Stopping Power**:
- Bethe-Bloch formula for energy loss
- Enhanced at low energies (Bragg peak)
- Used in cancer therapy (proton/carbon beams)

### Heavy Ion Collisions

High-energy heavy ion collisions study:
- Quark-Gluon Plasma (QGP)
- Nuclear matter under extreme conditions
- Particle production mechanisms
- Collective flow phenomena

## See Also

- [Particle Module Overview](../particles.md)
- [Hadrons](hadrons.md) - Baryons and mesons
- [Radioactive Decay](../physics/decay.md)
- [Hadronic Physics](../physics/hadronic.md)
- [Stopping Power](../physics/stopping_power.md)

## Related Source Files

- Header files: `/source/particles/hadrons/ions/include/`
- Implementation: `/source/particles/hadrons/ions/src/`
- Constructor: `G4IonConstructor.hh`
- Ion table: `G4IonTable.hh`

## References

- PDG (Particle Data Group): [Atomic and Nuclear Properties](https://pdg.lbl.gov/2024/AtomicNuclearProperties/)
- NUBASE Evaluation of Nuclear Properties
- Geant4 Physics Reference Manual: Electromagnetic and Hadronic Processes for Ions
- Geant4 User's Guide: Heavy Ion Physics
- Stopping Power and Range Tables: [PSTAR, ASTAR](https://physics.nist.gov/PhysRefData/Star/Text/contents.html)
