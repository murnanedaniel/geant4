# Hadrons (Baryons and Mesons)

## Overview

Hadrons are composite particles made of quarks bound by the strong nuclear force. Geant4 implements a comprehensive set of hadrons divided into two main categories: baryons (three quarks) and mesons (quark-antiquark pairs). These particles are essential for modeling nuclear interactions, particle production in collisions, and hadronic shower development.

Hadrons participate in strong, electromagnetic (if charged), and weak interactions. They are characterized by baryon number, isospin, strangeness, charm, and bottom quantum numbers reflecting their quark content.

## Baryons

### Nucleons (uud, udd)

The most common baryons, constituents of atomic nuclei:

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Lifetime | Class Name |
|----------|---------|----------|------------|---------|---------------|-----------|-------------|
| Proton | p | 2212 | 938.272 | +1 | uud | Stable | `G4Proton` |
| Neutron | n | 2112 | 939.565 | 0 | udd | 880.2 s | `G4Neutron` |
| Anti-Proton | p̄ | -2212 | 938.272 | -1 | ūūd̄ | Stable | `G4AntiProton` |
| Anti-Neutron | n̄ | -2112 | 939.565 | 0 | ūd̄d̄ | 880.2 s | `G4AntiNeutron` |

### Lambda Baryons (uds, udc, udb)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Lifetime | Class Name |
|----------|---------|----------|------------|---------|---------------|-----------|-------------|
| Lambda | Λ | 3122 | 1115.68 | 0 | uds | 0.263 ns | `G4Lambda` |
| Lambda-c+ | Λc⁺ | 4122 | 2286.46 | +1 | udc | 0.2 ps | `G4LambdacPlus` |
| Lambda-b | Λb | 5122 | 5619.60 | 0 | udb | 1.47 ps | `G4Lambdab` |
| Anti-Lambda | Λ̄ | -3122 | 1115.68 | 0 | ūd̄s̄ | 0.263 ns | `G4AntiLambda` |
| Anti-Lambda-c | Λ̄c⁻ | -4122 | 2286.46 | -1 | ūd̄c̄ | 0.2 ps | `G4AntiLambdacPlus` |
| Anti-Lambda-b | Λ̄b | -5122 | 5619.60 | 0 | ūd̄b̄ | 1.47 ps | `G4AntiLambdab` |

### Sigma Baryons (uus, uds, dds)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Class Name |
|----------|---------|----------|------------|---------|---------------|-------------|
| Sigma+ | Σ⁺ | 3222 | 1189.37 | +1 | uus | `G4SigmaPlus` |
| Sigma0 | Σ⁰ | 3212 | 1192.64 | 0 | uds | `G4SigmaZero` |
| Sigma- | Σ⁻ | 3112 | 1197.45 | -1 | dds | `G4SigmaMinus` |
| Sigma-c++ | Σc⁺⁺ | 4222 | 2453.98 | +2 | uuc | `G4SigmacPlusPlus` |
| Sigma-c+ | Σc⁺ | 4212 | 2452.9 | +1 | udc | `G4SigmacPlus` |
| Sigma-c0 | Σc⁰ | 4112 | 2453.74 | 0 | ddc | `G4SigmacZero` |
| Sigma-b+ | Σb⁺ | 5222 | 5810.5 | +1 | uub | `G4SigmabPlus` |
| Sigma-b0 | Σb⁰ | 5212 | 5813.4 | 0 | udb | `G4SigmabZero` |
| Sigma-b- | Σb⁻ | 5112 | 5815.2 | -1 | ddb | `G4SigmabMinus` |

### Xi Baryons (uss, dss, dsc, dsb)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Class Name |
|----------|---------|----------|------------|---------|---------------|-------------|
| Xi0 | Ξ⁰ | 3322 | 1314.86 | 0 | uss | `G4XiZero` |
| Xi- | Ξ⁻ | 3312 | 1321.71 | -1 | dss | `G4XiMinus` |
| Xi-c+ | Ξc⁺ | 4232 | 2467.8 | +1 | usc | `G4XicPlus` |
| Xi-c0 | Ξc⁰ | 4132 | 2470.88 | 0 | dsc | `G4XicZero` |
| Xi-b0 | Ξb⁰ | 5232 | 5791.9 | 0 | usb | `G4XibZero` |
| Xi-b- | Ξb⁻ | 5132 | 5794.5 | -1 | dsb | `G4XibMinus` |

### Omega Baryons (sss, ssc, ssb)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Class Name |
|----------|---------|----------|------------|---------|---------------|-------------|
| Omega- | Ω⁻ | 3334 | 1672.45 | -1 | sss | `G4OmegaMinus` |
| Omega-c0 | Ωc⁰ | 4332 | 2695.2 | 0 | ssc | `G4OmegacZero` |
| Omega-b- | Ωb⁻ | 5332 | 6046.1 | -1 | ssb | `G4OmegabMinus` |

Note: Anti-baryons are also implemented for all particles listed above with corresponding anti-classes.

## Mesons

### Light Unflavored Mesons (uū, dd̄, ss̄)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Lifetime | Class Name |
|----------|---------|----------|------------|---------|---------------|-----------|-------------|
| Pion+ | π⁺ | 211 | 139.57 | +1 | ud̄ | 26.0 ns | `G4PionPlus` |
| Pion0 | π⁰ | 111 | 134.98 | 0 | (uū-dd̄)/√2 | 8.5×10⁻¹⁷ s | `G4PionZero` |
| Pion- | π⁻ | -211 | 139.57 | -1 | dū | 26.0 ns | `G4PionMinus` |
| Eta | η | 221 | 547.86 | 0 | (uū+dd̄-2ss̄)/√6 | - | `G4Eta` |
| Eta-prime | η' | 331 | 957.78 | 0 | (uū+dd̄+ss̄)/√3 | - | `G4EtaPrime` |

### Strange Mesons (us̄, ds̄)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Lifetime | Class Name |
|----------|---------|----------|------------|---------|---------------|-----------|-------------|
| Kaon+ | K⁺ | 321 | 493.68 | +1 | us̄ | 12.4 ns | `G4KaonPlus` |
| Kaon0 | K⁰ | 311 | 497.61 | 0 | ds̄ | - | `G4KaonZero` |
| Kaon0-Short | K⁰S | 310 | 497.61 | 0 | K⁰-K̄⁰ mixture | 0.089 ns | `G4KaonZeroShort` |
| Kaon0-Long | K⁰L | 130 | 497.61 | 0 | K⁰-K̄⁰ mixture | 51.2 ns | `G4KaonZeroLong` |
| Kaon- | K⁻ | -321 | 493.68 | -1 | ūs | 12.4 ns | `G4KaonMinus` |
| Anti-Kaon0 | K̄⁰ | -311 | 497.61 | 0 | d̄s | - | `G4AntiKaonZero` |

### Charm Mesons (cq̄)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Class Name |
|----------|---------|----------|------------|---------|---------------|-------------|
| D+ | D⁺ | 411 | 1869.65 | +1 | cd̄ | `G4DMesonPlus` |
| D0 | D⁰ | 421 | 1864.84 | 0 | cū | `G4DMesonZero` |
| D- | D⁻ | -411 | 1869.65 | -1 | c̄d | `G4DMesonMinus` |
| D0-bar | D̄⁰ | -421 | 1864.84 | 0 | c̄u | `G4AntiDMesonZero` |
| Ds+ | Ds⁺ | 431 | 1968.35 | +1 | cs̄ | `G4DsMesonPlus` |
| Ds- | Ds⁻ | -431 | 1968.35 | -1 | c̄s | `G4DsMesonMinus` |
| J/Psi | J/ψ | 443 | 3096.90 | 0 | cc̄ | `G4JPsi` |
| Eta-c | ηc | 441 | 2983.9 | 0 | cc̄ | `G4Etac` |

### Bottom Mesons (bq̄)

| Particle | Symbol | PDG Code | Mass (MeV) | Charge | Quark Content | Class Name |
|----------|---------|----------|------------|---------|---------------|-------------|
| B+ | B⁺ | 521 | 5279.34 | +1 | ub̄ | `G4BMesonPlus` |
| B0 | B⁰ | 511 | 5279.65 | 0 | db̄ | `G4BMesonZero` |
| B- | B⁻ | -521 | 5279.34 | -1 | ūb | `G4BMesonMinus` |
| B0-bar | B̄⁰ | -511 | 5279.65 | 0 | d̄b | `G4AntiBMesonZero` |
| Bs0 | Bs⁰ | 531 | 5366.88 | 0 | sb̄ | `G4BsMesonZero` |
| Bs0-bar | B̄s⁰ | -531 | 5366.88 | 0 | s̄b | `G4AntiBsMesonZero` |
| Bc+ | Bc⁺ | 541 | 6274.47 | +1 | cb̄ | `G4BcMesonPlus` |
| Bc- | Bc⁻ | -541 | 6274.47 | -1 | c̄b | `G4BcMesonMinus` |
| Upsilon | Υ | 553 | 9460.30 | 0 | bb̄ | `G4Upsilon` |

## Usage Pattern

All hadron classes follow the singleton pattern:

```cpp
// Accessing baryon definitions
G4ParticleDefinition* proton = G4Proton::Definition();
G4ParticleDefinition* neutron = G4Neutron::Neutron();
G4ParticleDefinition* lambda = G4Lambda::Lambda();

// Accessing meson definitions
G4ParticleDefinition* pion = G4PionPlus::PionPlus();
G4ParticleDefinition* kaon = G4KaonPlus::KaonPlusDefinition();
G4ParticleDefinition* jpsi = G4JPsi::Definition();

// From particle table
G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
G4ParticleDefinition* proton = particleTable->FindParticle("proton");
G4ParticleDefinition* pi0 = particleTable->FindParticle("pi0");
```

## Quantum Numbers

### Baryon Quantum Numbers

| Property | Nucleons | Λ | Σ | Ξ | Ω |
|----------|----------|---|---|---|---|
| Baryon Number | +1 | +1 | +1 | +1 | +1 |
| Isospin (I) | 1/2 | 0 | 1 | 1/2 | 0 |
| Strangeness (S) | 0 | -1 | -1 | -2 | -3 |
| Charm (C) | 0 | 0 or +1 | 0 or +1 | 0 or +1 | 0 or +1 |
| Bottom (B) | 0 | 0 or -1 | 0 or -1 | 0 or -1 | 0 or -1 |
| Spin (J) | 1/2 | 1/2 | 1/2 | 1/2 | 3/2 |
| Parity (P) | + | + | + | + | + |

### Meson Quantum Numbers

| Property | π | K | D | B | J/ψ | Υ |
|----------|---|---|---|---|-----|---|
| Baryon Number | 0 | 0 | 0 | 0 | 0 | 0 |
| Isospin (I) | 1 | 1/2 | 1/2 | 1/2 | 0 | 0 |
| Strangeness (S) | 0 | ±1 | 0 | 0 | 0 | 0 |
| Charm (C) | 0 | 0 | ±1 | 0 | 0 | 0 |
| Bottom (B) | 0 | 0 | 0 | ±1 | 0 | 0 |
| Spin (J) | 0 | 0 | 0 | 0 | 1 | 1 |
| Parity (P) | - | - | - | - | - | - |

## Code Examples

### Creating Hadronic Beams

```cpp
#include "G4ParticleGun.hh"
#include "G4Proton.hh"
#include "G4PionMinus.hh"

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    auto particleGun = new G4ParticleGun(1);

    // Proton beam
    particleGun->SetParticleDefinition(G4Proton::Proton());
    particleGun->SetParticleEnergy(10.*GeV);
    particleGun->SetParticleMomentumDirection(G4ThreeVector(0., 0., 1.));
    particleGun->SetParticlePosition(G4ThreeVector(0., 0., -100.*cm));
    particleGun->GeneratePrimaryVertex(event);
}
```

### Identifying Hadrons in Tracking

```cpp
#include "G4Track.hh"
#include "G4Proton.hh"
#include "G4Neutron.hh"
#include "G4PionPlus.hh"
#include "G4PionMinus.hh"
#include "G4PionZero.hh"

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();
    G4ParticleDefinition* particle = track->GetDefinition();

    // Check for specific hadrons
    if (particle == G4Proton::Definition()) {
        G4cout << "Proton detected" << G4endl;
    }
    else if (particle == G4Neutron::Definition()) {
        G4cout << "Neutron detected" << G4endl;
    }
    else if (particle == G4PionPlus::Definition() ||
             particle == G4PionMinus::Definition() ||
             particle == G4PionZero::Definition()) {
        G4cout << "Pion detected" << G4endl;
    }

    // Check baryon number
    G4int baryonNumber = particle->GetBaryonNumber();
    if (baryonNumber > 0) {
        G4cout << "Baryon with B = " << baryonNumber << G4endl;
    }
}
```

### Hadronic Properties Analysis

```cpp
#include "G4ParticleDefinition.hh"
#include "G4Lambda.hh"

void AnalyzeHadron()
{
    G4ParticleDefinition* lambda = G4Lambda::Definition();

    // Get hadron properties
    G4String name = lambda->GetParticleName();          // "lambda"
    G4double mass = lambda->GetPDGMass();                // 1115.68 MeV
    G4int baryonNumber = lambda->GetBaryonNumber();      // +1
    G4int pdg = lambda->GetPDGEncoding();                // 3122
    G4double lifetime = lambda->GetPDGLifeTime();        // 0.263 ns

    // Get quark content (from PDG code)
    G4int quarkContent = abs(pdg);
    G4int nStrange = (quarkContent / 1000) % 10;         // Number of strange quarks

    G4cout << "Particle: " << name << G4endl;
    G4cout << "Mass: " << mass/GeV << " GeV" << G4endl;
    G4cout << "Baryon number: " << baryonNumber << G4endl;
    G4cout << "Strangeness: -" << nStrange << G4endl;
    G4cout << "Lifetime: " << lifetime/ns << " ns" << G4endl;
}
```

### Neutron Capture Detection

```cpp
#include "G4Step.hh"
#include "G4Neutron.hh"
#include "G4Track.hh"

void DetectNeutronCapture(const G4Step* step)
{
    G4Track* track = step->GetTrack();

    if (track->GetDefinition() == G4Neutron::Definition()) {
        // Check if neutron was captured
        if (step->GetPostStepPoint()->GetProcessDefinedStep()->
            GetProcessName() == "nCapture") {

            G4double energy = track->GetKineticEnergy();
            G4ThreeVector position = step->GetPostStepPoint()->GetPosition();

            G4cout << "Neutron captured at " << position
                   << " with E = " << energy/eV << " eV" << G4endl;
        }
    }
}
```

### Strange Particle Production

```cpp
#include "G4VProcess.hh"
#include "G4Lambda.hh"
#include "G4KaonZeroShort.hh"

void AnalyzeStrangeProduction(const G4Step* step)
{
    // Get secondaries produced in this step
    const std::vector<const G4Track*>* secondaries =
        step->GetSecondaryInCurrentStep();

    for (auto secondary : *secondaries) {
        G4ParticleDefinition* particle = secondary->GetDefinition();

        if (particle == G4Lambda::Definition()) {
            G4cout << "Lambda produced" << G4endl;
        }
        else if (particle == G4KaonZeroShort::Definition()) {
            G4cout << "K-short produced" << G4endl;
        }
    }
}
```

### Heavy Flavor Tagging

```cpp
#include "G4ParticleDefinition.hh"
#include "G4DMesonPlus.hh"
#include "G4BMesonZero.hh"
#include "G4LambdacPlus.hh"

G4bool HasCharm(const G4ParticleDefinition* particle)
{
    return (particle == G4DMesonPlus::Definition() ||
            particle == G4DMesonZero::Definition() ||
            particle == G4LambdacPlus::Definition());
}

G4bool HasBottom(const G4ParticleDefinition* particle)
{
    return (particle == G4BMesonZero::Definition() ||
            particle == G4BMesonPlus::Definition() ||
            particle == G4Lambdab::Definition());
}

void TagHeavyFlavor(const G4Step* step)
{
    G4ParticleDefinition* particle = step->GetTrack()->GetDefinition();

    if (HasCharm(particle)) {
        G4cout << "Charm hadron detected: "
               << particle->GetParticleName() << G4endl;
    }
    else if (HasBottom(particle)) {
        G4cout << "Bottom hadron detected: "
               << particle->GetParticleName() << G4endl;
    }
}
```

## Physics Background

### Quark Model

Hadrons are composite particles made of quarks:

**Baryons** (Fermions, B=+1):
- Three quarks (qqq)
- Examples: proton (uud), neutron (udd), Lambda (uds)
- Anti-baryons have three antiquarks (q̄q̄q̄)

**Mesons** (Bosons, B=0):
- Quark-antiquark pair (qq̄)
- Examples: pion (ud̄), kaon (us̄), J/ψ (cc̄)
- Antiparticles swap quark and antiquark

### Flavor Quantum Numbers

Quarks carry flavor quantum numbers:
- **Strangeness (S)**: Number of strange quarks (s has S=-1)
- **Charm (C)**: Number of charm quarks (c has C=+1)
- **Bottom (B)**: Number of bottom quarks (b has B=-1)

These are conserved in strong and electromagnetic interactions but violated in weak interactions.

### Isospin Symmetry

Isospin (I) treats up and down quarks as two states of the same particle:
- Proton (uud): I=1/2, I₃=+1/2
- Neutron (udd): I=1/2, I₃=-1/2
- Pions (π⁺,π⁰,π⁻): I=1, I₃=+1,0,-1

Strong interactions conserve isospin.

### Hadronic Interactions

Hadrons undergo various interactions in Geant4:

**Strong Interactions**:
- Elastic scattering
- Inelastic collisions with particle production
- Quasi-elastic processes
- Charge exchange

**Electromagnetic** (charged hadrons):
- Ionization
- Multiple scattering
- Bremsstrahlung (for light hadrons)

**Weak Interactions**:
- Beta decay (neutron)
- Strange, charm, bottom decays
- Flavor-changing processes

## See Also

- [Particle Module Overview](../particles.md)
- [Ions](ions.md) - Light ions and nuclear fragments
- [Short-Lived Particles](shortlived.md) - Quarks and resonances
- [Hadronic Physics](../physics/hadronic.md)
- [Neutron Physics](../physics/neutron.md)

## Related Source Files

- Baryon headers: `/source/particles/hadrons/barions/include/`
- Baryon implementation: `/source/particles/hadrons/barions/src/`
- Meson headers: `/source/particles/hadrons/mesons/include/`
- Meson implementation: `/source/particles/hadrons/mesons/src/`
- Constructors: `G4BaryonConstructor.hh`, `G4MesonConstructor.hh`

## References

- PDG (Particle Data Group): [Baryons](https://pdg.lbl.gov/2024/listings/contents_listings.html) and [Mesons](https://pdg.lbl.gov/2024/listings/contents_listings.html)
- Geant4 Physics Reference Manual: Hadronic Processes
- Geant4 User's Guide: Hadronic Physics
- Review of Particle Physics: Quark Model
