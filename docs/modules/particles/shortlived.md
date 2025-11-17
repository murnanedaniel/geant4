# Short-Lived Particles

## Overview

Short-lived particles are fundamental and composite particles with extremely brief lifetimes (typically < 10⁻²³ seconds) that decay via the strong force before they can leave measurable tracks. Geant4 implements quarks, gluons, diquarks, and excited hadronic resonances. These particles represent intermediate states in particle production and decay processes and are generally not tracked as independent particles in simulations.

While quarks and gluons are the fundamental constituents of matter, they never appear as free particles due to color confinement. Excited hadron states (resonances) quickly decay to lighter hadrons through strong interactions.

## Particle Categories

### Quarks (Fundamental Fermions)

The six flavors of quarks that compose all hadrons:

| Quark | Symbol | PDG Code | Charge | Mass (approx) | Generation | Class |
|-------|---------|----------|---------|---------------|------------|--------|
| Down | d | 1 | -1/3 | ~5 MeV | 1st | `G4DQuark` |
| Up | u | 2 | +2/3 | ~2 MeV | 1st | `G4UQuark` |
| Strange | s | 3 | -1/3 | ~95 MeV | 2nd | `G4SQuark` |
| Charm | c | 4 | +2/3 | ~1.3 GeV | 2nd | `G4CQuark` |
| Bottom | b | 5 | -1/3 | ~4.2 GeV | 3rd | `G4BQuark` |
| Top | t | 6 | +2/3 | ~173 GeV | 3rd | `G4TQuark` |

Anti-quarks have opposite quantum numbers and negative PDG codes.

### Diquarks

Correlated quark pairs within baryons:

| Diquark | Composition | Charge | Spin | PDG Code Pattern |
|---------|-------------|---------|------|------------------|
| dd | down-down | -2/3 | 0 or 1 | 1103, 1101 |
| ud | up-down | +1/3 | 0 or 1 | 2103, 2101 |
| uu | up-up | +4/3 | 0 or 1 | 2203, 2201 |
| sd | strange-down | -1/3 | 0 or 1 | 3103, 3101 |
| su | strange-up | +2/3 | 0 or 1 | 3203, 3201 |
| ss | strange-strange | 0 | 0 or 1 | 3303, 3301 |

Higher flavor diquarks (charm, bottom) also exist with similar patterns.

### Gluons

Gauge bosons of the strong force:

| Particle | Symbol | PDG Code | Charge | Color Charge | Spin |
|----------|---------|----------|---------|--------------|------|
| Gluon | g | 21 | 0 | color octet | 1 |

### Excited Baryon Resonances

Short-lived excited states of baryons that decay via strong force:

**Nucleon Resonances (N*)**:
- N(1440) "Roper resonance" - First excited state of nucleon
- N(1520), N(1535), N(1650), N(1675), N(1680), N(1700), N(1710), N(1720)
- N(1900), N(1990), N(2000), N(2040), N(2060), N(2100), N(2190), N(2220), N(2250)

**Delta Resonances (Δ)**:
- Δ(1232) - Most prominent baryon resonance
- Δ(1600), Δ(1620), Δ(1700), Δ(1750), Δ(1900), Δ(1905), Δ(1910), Δ(1920), Δ(1930), Δ(1950)
- Δ(2000), Δ(2150), Δ(2200), Δ(2300), Δ(2350), Δ(2390), Δ(2400), Δ(2420), Δ(2750), Δ(2950)

**Lambda Resonances (Λ*)**:
- Λ(1405), Λ(1520), Λ(1600), Λ(1670), Λ(1690), Λ(1800), Λ(1810), Λ(1820), Λ(1830), Λ(1890)
- Λ(2000), Λ(2020), Λ(2100), Λ(2110), Λ(2325), Λ(2350), Λ(2585)

**Sigma Resonances (Σ*)**:
- Σ(1385), Σ(1480), Σ(1560), Σ(1620), Σ(1660), Σ(1670), Σ(1750), Σ(1775), Σ(1840), Σ(1880)
- Σ(1915), Σ(1940), Σ(2000), Σ(2030), Σ(2070), Σ(2080), Σ(2100), Σ(2250), Σ(2455), Σ(2620)

**Xi Resonances (Ξ*)**:
- Ξ(1530), Ξ(1620), Ξ(1690), Ξ(1820), Ξ(1950), Ξ(2030), Ξ(2120), Ξ(2250), Ξ(2370), Ξ(2500)

### Excited Meson Resonances

Short-lived excited states of mesons:

**Rho Mesons (ρ)**:
- ρ(770) - Vector meson, pion resonance
- ρ(1450), ρ(1570), ρ(1700), ρ(1900), ρ(2150)

**Omega Mesons (ω)**:
- ω(782), ω(1420), ω(1650)

**Kaon Resonances (K*)**:
- K*(892), K*(1410), K*(1680), K*(1780), K*(2045)

**Phi Mesons (φ)**:
- φ(1020), φ(1680)

**Other Meson Resonances**:
- f₀, f₁, f₂, a₀, a₁, a₂, b₁, h₁ multiplets
- Various masses and quantum numbers

## Usage Pattern

Short-lived particles are typically not accessed directly by users. They are created and managed internally by hadronic models:

```cpp
// Short-lived particles are NOT typically used this way:
// G4ParticleDefinition* quark = G4UQuark::Definition();  // Not standard usage

// Instead, they appear in event generators and string models
// as intermediate states that immediately hadronize

// To check if a particle is short-lived:
G4ParticleDefinition* particle = /*...*/;
if (particle->IsShortLived()) {
    G4cout << particle->GetParticleName()
           << " is short-lived" << G4endl;
    G4double width = particle->GetPDGWidth();
    G4double lifetime = particle->GetPDGLifeTime();
}
```

## Quantum Numbers

### Quark Properties

| Property | u, c, t (up-type) | d, s, b (down-type) |
|----------|-------------------|---------------------|
| Charge | +2/3 e | -1/3 e |
| Spin | 1/2 | 1/2 |
| Baryon Number | 1/3 | 1/3 |
| Color | Red, Green, Blue | Red, Green, Blue |

### Flavor Quantum Numbers

| Quark | I | I₃ | S | C | B | T |
|-------|---|-----|---|---|---|---|
| u | 1/2 | +1/2 | 0 | 0 | 0 | 0 |
| d | 1/2 | -1/2 | 0 | 0 | 0 | 0 |
| s | 0 | 0 | -1 | 0 | 0 | 0 |
| c | 0 | 0 | 0 | +1 | 0 | 0 |
| b | 0 | 0 | 0 | 0 | -1 | 0 |
| t | 0 | 0 | 0 | 0 | 0 | +1 |

Where: I = Isospin, S = Strangeness, C = Charm, B = Bottomness, T = Topness

### Resonance Properties

Excited states are characterized by:
- **Mass**: Central value (pole mass)
- **Width**: Decay width Γ (related to lifetime τ = ℏ/Γ)
- **Spin-Parity**: Jᴾ quantum numbers
- **Isospin**: I and I₃
- **Decay Modes**: Branching ratios to various final states

## Code Examples

### Checking for Short-Lived Particles

```cpp
#include "G4ParticleDefinition.hh"
#include "G4VShortLivedParticle.hh"

void AnalyzeParticle(G4ParticleDefinition* particle)
{
    // Check if particle is short-lived
    if (particle->IsShortLived()) {
        G4cout << particle->GetParticleName()
               << " is short-lived" << G4endl;

        // Get lifetime and width
        G4double tau = particle->GetPDGLifeTime();
        G4double width = particle->GetPDGWidth();

        G4cout << "Lifetime: " << tau/s << " s" << G4endl;
        G4cout << "Width: " << width/MeV << " MeV" << G4endl;
        G4cout << "Width/Mass: " << width/particle->GetPDGMass() << G4endl;
    }

    // Check particle subtype
    G4String subtype = particle->GetParticleSubType();
    if (subtype == "quark") {
        G4cout << "This is a quark" << G4endl;
    }
    else if (subtype == "diquark") {
        G4cout << "This is a diquark" << G4endl;
    }
}
```

### Resonance Production and Decay

```cpp
#include "G4Step.hh"
#include "G4Track.hh"

void DetectResonances(const G4Step* step)
{
    // Resonances are created and destroyed within a single step
    // We can detect them in secondaries

    const std::vector<const G4Track*>* secondaries =
        step->GetSecondaryInCurrentStep();

    for (auto secondary : *secondaries) {
        G4ParticleDefinition* particle = secondary->GetDefinition();

        if (particle->IsShortLived()) {
            G4String name = particle->GetParticleName();

            // Check for specific resonances
            if (name.contains("Delta") || name.contains("delta")) {
                G4cout << "Delta resonance produced: " << name << G4endl;
            }
            else if (name.contains("rho")) {
                G4cout << "Rho meson produced: " << name << G4endl;
            }

            // Get decay products (if available)
            G4DecayTable* decayTable = particle->GetDecayTable();
            if (decayTable) {
                G4int nChannels = decayTable->entries();
                G4cout << "Decay channels: " << nChannels << G4endl;
            }
        }
    }
}
```

### String Fragmentation and Hadronization

```cpp
// Short-lived particles appear in string fragmentation models
// This is handled internally by Geant4 hadronic models

void ExampleStringModel()
{
    // In high-energy collisions, quarks and diquarks are created
    // in color-connected "strings" that fragment into hadrons

    // String breaks into quark-antiquark pairs:
    // String: q1 --- q2  →  q1 q̄ + q q̄2  →  Meson1 + Meson2

    // Or string with diquarks for baryon production:
    // String: qq1 --- q2  →  qq1 q̄ + q q̄2  →  Baryon + Meson

    // This process is handled by models like QGSP, FTFP
    // Users don't directly manipulate quarks
}
```

### Resonance Width and Lifetime

```cpp
#include "G4PhysicalConstants.hh"

void ResonanceProperties()
{
    // Delta(1232) resonance
    // Width: Γ ≈ 120 MeV
    // Lifetime: τ = ℏ/Γ

    G4double width = 120.*MeV;
    G4double lifetime = hbar_Planck / width;

    G4cout << "Delta(1232) properties:" << G4endl;
    G4cout << "Width: " << width/MeV << " MeV" << G4endl;
    G4cout << "Lifetime: " << lifetime/s << " s" << G4endl;
    G4cout << "          " << lifetime*c_light/fm << " fm/c" << G4endl;

    // Very short lifetime means it decays before traveling
    // Even at relativistic speeds, travel distance << 1 fm
    // This is why resonances are not tracked
}
```

### Checking Hadronic Model Output

```cpp
#include "G4HadronicProcess.hh"
#include "G4VParticleChange.hh"

void AnalyzeHadronicOutput(G4VParticleChange* particleChange)
{
    // After a hadronic interaction, check for resonances
    G4int nSecondaries = particleChange->GetNumberOfSecondaries();

    for (G4int i = 0; i < nSecondaries; i++) {
        G4Track* secondary = particleChange->GetSecondary(i);
        G4ParticleDefinition* particle = secondary->GetDefinition();

        if (particle->IsShortLived()) {
            // Resonance produced
            G4cout << "Resonance: " << particle->GetParticleName() << G4endl;
            G4cout << "Mass: " << particle->GetPDGMass()/GeV << " GeV" << G4endl;

            // Resonances will immediately decay
            // Their decay products become the actual secondaries
        }
    }
}
```

### Quark Content Analysis (Conceptual)

```cpp
// While quarks are not tracked, we can understand hadron composition

void AnalyzeQuarkContent(G4ParticleDefinition* hadron)
{
    G4int pdg = abs(hadron->GetPDGEncoding());
    G4String name = hadron->GetParticleName();

    // Mesons: pdg = nJnq1q2
    // Baryons: pdg = nJnq1q2q3
    // where nJ = 2J+1, qi are quark flavors

    if (hadron->GetParticleType() == "meson") {
        G4int q2 = pdg % 10;
        G4int q1 = (pdg / 10) % 10;
        G4cout << "Meson " << name << " contains quarks: "
               << q1 << " and " << q2 << G4endl;
    }
    else if (hadron->GetParticleType() == "baryon") {
        G4int q3 = pdg % 10;
        G4int q2 = (pdg / 10) % 10;
        G4int q1 = (pdg / 100) % 10;
        G4cout << "Baryon " << name << " contains quarks: "
               << q1 << ", " << q2 << ", " << q3 << G4endl;
    }
}
```

## Physics Background

### Quark Confinement

Quarks are never observed as free particles due to **color confinement**:

- Quarks carry color charge (red, green, blue)
- Only color-neutral (white) states exist as free particles
- As quarks separate, strong force increases (like stretching a rubber band)
- Energy becomes sufficient to create new quark-antiquark pairs
- Result: hadronization into mesons and baryons

### Asymptotic Freedom

At very short distances (high energies):
- Strong force becomes weak
- Quarks and gluons behave as quasi-free particles
- Described by perturbative QCD
- Observed in deep inelastic scattering

### Hadronic Resonances

Resonances are excited states of hadrons:

**Delta(1232)**: Δ⁺⁺, Δ⁺, Δ⁰, Δ⁻
- Isospin-3/2 quartet
- First excited state of nucleon
- Mass ≈ 1232 MeV, Width ≈ 120 MeV
- Decays: Δ → N + π (dominant)

**Rho(770)**: ρ⁺, ρ⁰, ρ⁻
- Vector meson (Jᴾ = 1⁻)
- Pion resonance
- Mass ≈ 775 MeV, Width ≈ 150 MeV
- Decays: ρ → π + π

### Breit-Wigner Distribution

Resonances have a mass distribution described by the Breit-Wigner formula:

```
σ(E) ∝ Γ² / [(E - M₀)² + (Γ/2)²]
```

Where:
- M₀ = pole mass (central value)
- Γ = total width
- E = center-of-mass energy

### Why Not Tracked?

Short-lived particles are not tracked in Geant4 because:

1. **Lifetime too short**: τ < 10⁻²³ s
2. **Decay length negligible**: Even at γ = 100, decay length < 1 fm
3. **No measurable tracks**: Decay before leaving nucleus
4. **Strong decay**: Decay width Γ >> electromagnetic/weak widths
5. **Internal model details**: Appear only in hadronization/fragmentation

Instead, these particles:
- Are created in hadronic model calculations
- Immediately decay to final-state hadrons
- Final states are what get tracked
- Preserve quantum numbers (charge, baryon number, etc.)

### Hadronization Models

Different models handle quark-to-hadron conversion:

**String Models** (FTFP, QGSP):
- Quarks connected by color flux tubes (strings)
- Strings break into quark-antiquark pairs
- Pairs combine to form hadrons
- Used for high-energy interactions

**Cluster Models**:
- Quarks form color-singlet clusters
- Clusters decay to hadrons
- Used in some event generators

**Resonance Production**:
- Excited states formed in collisions
- Resonances decay to stable hadrons
- Branching ratios from experimental data

## See Also

- [Particle Module Overview](../particles.md)
- [Hadrons](hadrons.md) - Stable baryons and mesons
- [Hadronic Physics](../physics/hadronic.md)
- [String Models](../physics/string_models.md)
- [QCD and Parton Distributions](../physics/qcd.md)

## Related Source Files

- Header files: `/source/particles/shortlived/include/`
- Implementation: `/source/particles/shortlived/src/`
- Base class: `G4VShortLivedParticle.hh`
- Constructors:
  - `G4ShortLivedConstructor.hh`
  - `G4ExcitedBaryonConstructor.hh`
  - `G4ExcitedMesonConstructor.hh`

## References

- PDG (Particle Data Group): [Quark Model](https://pdg.lbl.gov/2024/reviews/contents_sports.html)
- PDG: [Baryon Resonances](https://pdg.lbl.gov/2024/listings/contents_listings.html)
- PDG: [Meson Resonances](https://pdg.lbl.gov/2024/listings/contents_listings.html)
- Review of QCD and Asymptotic Freedom
- Geant4 Physics Reference Manual: Hadronic Models
- Introduction to the Standard Model and QCD
