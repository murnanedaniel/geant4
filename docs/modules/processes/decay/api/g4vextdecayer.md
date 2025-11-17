# G4VExtDecayer

**File**: `source/processes/decay/include/G4VExtDecayer.hh`

## Overview

G4VExtDecayer is an abstract base class that provides the interface for integrating external decay libraries into Geant4. It allows specialized decay generators (such as EvtGen for heavy flavor physics or Pythia for general hadronization) to handle particle decays instead of using Geant4's built-in decay tables. This interface is essential for simulations requiring detailed treatment of complex decay physics, CP violation, time-dependent phenomena, or specific angular correlations.

## Class Description

G4VExtDecayer defines the minimal interface for external decayers:

- **Pure Virtual Interface**: Single method to implement: `ImportDecayProducts()`
- **G4DecayProducts Output**: Returns decay products in Geant4 format
- **Track Input**: Receives full track information from Geant4
- **Name Identification**: Stores decayer name for diagnostics
- **Minimal Overhead**: Lightweight interface for maximum flexibility

The class serves as a bridge between Geant4's decay process and external decay libraries, allowing:
- Complex multi-body decay modeling
- Matrix element calculations with full correlations
- Time-dependent phenomena (B⁰ oscillations, CP violation)
- Radiative corrections and form factors
- Custom decay implementations

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:45`

**History**: Introduced 23 February 2001 by H. Kurashige

## Constructor & Destructor

### Constructor

```cpp
G4VExtDecayer(const G4String& name = "");
```

Creates a new external decayer with the specified name.

**Parameters**:
- `name`: Decayer name for identification (default: empty string)

**Implementation**: Lines 78-81 in `source/processes/decay/include/G4VExtDecayer.hh` (inline)

```cpp
inline
G4VExtDecayer::G4VExtDecayer(const G4String& name)
    : decayerName(name)
{
}
```

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:54`

### Destructor

```cpp
virtual ~G4VExtDecayer() {}
```

Virtual destructor with empty implementation.

**Implementation**: Line 57 in `source/processes/decay/include/G4VExtDecayer.hh`

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:57`

## Core Interface

### ImportDecayProducts (Pure Virtual)

```cpp
virtual G4DecayProducts* ImportDecayProducts(
    const G4Track& aTrack
) = 0;
```

Pure virtual method that must be implemented by derived classes to generate decay products.

**Parameters**:
- `aTrack`: Track of the parent particle to be decayed

**Returns**: Pointer to G4DecayProducts containing daughter particles

**Responsibilities**:
- Read parent particle information from track
- Generate decay according to external library
- Convert results to G4DecayProducts format
- Handle Lorentz transformations if needed
- Manage memory (caller will delete the returned object)

**Usage in G4Decay**: Called at line 234 in `source/processes/decay/src/G4Decay.cc`:
```cpp
if (isExtDecayer) {
    // Decay according to external decayer
    products = pExtDecayer->ImportDecayProducts(aTrack);
}
```

**Important Notes**:
- **Memory Management**: The returned `G4DecayProducts*` will be deleted by G4Decay
- **Lorentz Transformation**: External decayer is responsible for proper frame transformation
- **No Boost Applied**: G4Decay does NOT boost products from external decayers (line 332)
- **Thread Safety**: Implementation must be thread-safe for multi-threaded Geant4

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:67-69`

### GetName

```cpp
const G4String& GetName() const;
```

Returns the name of the external decayer.

**Returns**: Reference to decayer name string

**Implementation**: Lines 84-87 in `source/processes/decay/include/G4VExtDecayer.hh` (inline)

```cpp
inline
const G4String& G4VExtDecayer::GetName() const
{
    return decayerName;
}
```

**Usage**: Useful for diagnostics, verbose output, and identifying which external decayer is active.

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:71`

## Deleted Operations

### Copy Constructor

```cpp
private:
G4VExtDecayer(const G4VExtDecayer&) {}
```

Copy constructor is private and empty—copying is not supported.

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:61`

### Assignment Operator

```cpp
private:
G4VExtDecayer& operator=(const G4VExtDecayer&) { return *this; }
```

Assignment operator is private—assignment is not supported.

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:64`

## Member Variables

### Protected Members

```cpp
protected:
G4String decayerName;
```

Name of the external decayer for identification.

**Location**: `source/processes/decay/include/G4VExtDecayer.hh:74`

## Implementation Guide

### Basic Implementation Template

```cpp
#include "G4VExtDecayer.hh"
#include "G4DecayProducts.hh"
#include "G4Track.hh"
#include "G4DynamicParticle.hh"
#include "G4ParticleDefinition.hh"
#include "G4ThreeVector.hh"

class MyExternalDecayer : public G4VExtDecayer {
public:
    MyExternalDecayer() : G4VExtDecayer("MyDecayer") {
        // Initialize external library
        InitializeExternalLib();
    }

    virtual ~MyExternalDecayer() {
        // Clean up external library
        FinalizeExternalLib();
    }

    virtual G4DecayProducts* ImportDecayProducts(const G4Track& track) {
        // 1. Get parent particle information
        const G4DynamicParticle* parent = track.GetDynamicParticle();
        const G4ParticleDefinition* parentDef = parent->GetDefinition();

        G4int pdgCode = parentDef->GetPDGEncoding();
        G4double mass = parent->GetMass();
        G4ThreeVector momentum = parent->GetMomentum();
        G4double energy = parent->GetTotalEnergy();

        // 2. Call external library
        // ... external library decay generation ...

        // 3. Create G4DecayProducts
        G4DecayProducts* products = new G4DecayProducts(*parent);

        // 4. Add daughters
        for (int i = 0; i < nDaughters; ++i) {
            G4ParticleDefinition* daughterDef = GetDaughterDef(i);
            G4ThreeVector daughterMom = GetDaughterMomentum(i);

            G4DynamicParticle* daughter = new G4DynamicParticle(
                daughterDef,
                daughterMom
            );

            products->PushProducts(daughter);
        }

        return products;
    }

private:
    void InitializeExternalLib() {
        // Initialize external decay library
    }

    void FinalizeExternalLib() {
        // Clean up external library
    }
};
```

### EvtGen Wrapper Example

```cpp
#include "G4VExtDecayer.hh"
#include "EvtGen/EvtGen.hh"
#include "EvtGenBase/EvtParticle.hh"
#include "EvtGenBase/EvtPDL.hh"

class EvtGenDecayer : public G4VExtDecayer {
public:
    EvtGenDecayer(const G4String& decayFile,
                  const G4String& pdtFile)
        : G4VExtDecayer("EvtGen")
    {
        // Initialize EvtGen
        evtGen = new EvtGen(decayFile.c_str(), pdtFile.c_str());
    }

    virtual ~EvtGenDecayer() {
        delete evtGen;
    }

    virtual G4DecayProducts* ImportDecayProducts(const G4Track& track) {
        const G4DynamicParticle* parent = track.GetDynamicParticle();
        const G4ParticleDefinition* parentDef = parent->GetDefinition();

        // Convert Geant4 → EvtGen
        G4int pdg = parentDef->GetPDGEncoding();
        EvtId evtId = EvtPDL::evtIdFromStdHep(pdg);

        G4LorentzVector p4(
            parent->GetMomentum(),
            parent->GetTotalEnergy()
        );

        EvtVector4R p4Evt(
            p4.e(),
            p4.px(),
            p4.py(),
            p4.pz()
        );

        // Generate decay
        EvtParticle* evtParent = EvtParticleFactory::particleFactory(
            evtId, p4Evt
        );
        evtGen->generateDecay(evtParent);

        // Convert EvtGen → Geant4
        G4DecayProducts* products = new G4DecayProducts(*parent);

        for (int i = 0; i < evtParent->getNDaug(); ++i) {
            EvtParticle* evtDaughter = evtParent->getDaug(i);
            EvtVector4R p4Daug = evtDaughter->getP4Lab();

            G4int daughterPDG = EvtPDL::getStdHep(evtDaughter->getId());
            G4ParticleDefinition* daughterDef =
                G4ParticleTable::GetParticleTable()
                    ->FindParticle(daughterPDG);

            G4DynamicParticle* daughter = new G4DynamicParticle(
                daughterDef,
                G4ThreeVector(p4Daug.get(1), p4Daug.get(2), p4Daug.get(3))
            );

            products->PushProducts(daughter);
        }

        evtParent->deleteTree();
        return products;
    }

private:
    EvtGen* evtGen;
};
```

### Pythia8 Wrapper Example

```cpp
#include "G4VExtDecayer.hh"
#include "Pythia8/Pythia.h"

class Pythia8Decayer : public G4VExtDecayer {
public:
    Pythia8Decayer() : G4VExtDecayer("Pythia8") {
        pythia = new Pythia8::Pythia();
        pythia->readString("ProcessLevel:all = off");  // Decay only
        pythia->init();
    }

    virtual ~Pythia8Decayer() {
        delete pythia;
    }

    virtual G4DecayProducts* ImportDecayProducts(const G4Track& track) {
        const G4DynamicParticle* parent = track.GetDynamicParticle();

        // Convert Geant4 → Pythia8
        G4int pdg = parent->GetDefinition()->GetPDGEncoding();
        G4ThreeVector mom = parent->GetMomentum();
        G4double mass = parent->GetMass();
        G4double energy = parent->GetTotalEnergy();

        pythia->event.reset();
        pythia->event.append(pdg, 1, 0, 0,
            mom.x()/GeV, mom.y()/GeV, mom.z()/GeV,
            energy/GeV, mass/GeV
        );

        // Decay
        pythia->moreDecays();

        // Convert Pythia8 → Geant4
        G4DecayProducts* products = new G4DecayProducts(*parent);

        for (int i = 1; i < pythia->event.size(); ++i) {
            if (pythia->event[i].isFinal()) {
                G4int daughterPDG = pythia->event[i].id();
                G4ParticleDefinition* daughterDef =
                    G4ParticleTable::GetParticleTable()
                        ->FindParticle(daughterPDG);

                if (daughterDef) {
                    G4ThreeVector daughterMom(
                        pythia->event[i].px()*GeV,
                        pythia->event[i].py()*GeV,
                        pythia->event[i].pz()*GeV
                    );

                    G4DynamicParticle* daughter = new G4DynamicParticle(
                        daughterDef,
                        daughterMom
                    );

                    products->PushProducts(daughter);
                }
            }
        }

        return products;
    }

private:
    Pythia8::Pythia* pythia;
};
```

## Usage Examples

### Example 1: Setting External Decayer

```cpp
#include "G4Decay.hh"
#include "MyExternalDecayer.hh"
#include "G4ProcessManager.hh"

// Create external decayer
MyExternalDecayer* extDecayer = new MyExternalDecayer();

// Create decay process
G4Decay* decay = new G4Decay("Decay");
decay->SetExtDecayer(extDecayer);

// Add to particle
G4ProcessManager* pManager = particle->GetProcessManager();
pManager->AddProcess(decay);
pManager->SetProcessOrdering(decay, idxPostStep);
pManager->SetProcessOrdering(decay, idxAtRest);
```

### Example 2: Particle-Specific External Decayers

```cpp
// Use EvtGen for B mesons, standard decay for others

EvtGenDecayer* evtGen = new EvtGenDecayer("DECAY.DEC", "evt.pdl");

// B mesons
std::vector<G4ParticleDefinition*> bMesons = {
    G4ParticleTable::GetParticleTable()->FindParticle(511),   // B0
    G4ParticleTable::GetParticleTable()->FindParticle(-511),  // B0bar
    G4ParticleTable::GetParticleTable()->FindParticle(521),   // B+
    G4ParticleTable::GetParticleTable()->FindParticle(-521)   // B-
};

for (auto particle : bMesons) {
    G4Decay* decay = new G4Decay("Decay");
    decay->SetExtDecayer(evtGen);

    G4ProcessManager* pManager = particle->GetProcessManager();
    pManager->AddProcess(decay);
    pManager->SetProcessOrdering(decay, idxPostStep);
    pManager->SetProcessOrdering(decay, idxAtRest);
}

// Other particles use standard G4Decay without external decayer
```

### Example 3: Conditional External Decay

```cpp
class ConditionalDecayer : public G4VExtDecayer {
public:
    ConditionalDecayer() : G4VExtDecayer("Conditional") {}

    virtual G4DecayProducts* ImportDecayProducts(const G4Track& track) {
        const G4DynamicParticle* parent = track.GetDynamicParticle();

        // Use external decayer only for high-energy particles
        if (parent->GetKineticEnergy() > 10*GeV) {
            return ExternalLibraryDecay(track);
        } else {
            // Return nullptr to let G4Decay use decay table
            return nullptr;
        }
    }

private:
    G4DecayProducts* ExternalLibraryDecay(const G4Track& track) {
        // Complex decay for high energy
        // ...
    }
};
```

### Example 4: Diagnostic Wrapper

```cpp
class DiagnosticDecayer : public G4VExtDecayer {
public:
    DiagnosticDecayer(G4VExtDecayer* realDecayer)
        : G4VExtDecayer("Diagnostic"),
          fRealDecayer(realDecayer),
          fCallCount(0)
    {}

    virtual G4DecayProducts* ImportDecayProducts(const G4Track& track) {
        fCallCount++;

        auto start = std::chrono::high_resolution_clock::now();

        G4DecayProducts* products = fRealDecayer->ImportDecayProducts(track);

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
            end - start
        ).count();

        G4cout << "External decay #" << fCallCount
               << " took " << duration << " μs" << G4endl;

        return products;
    }

private:
    G4VExtDecayer* fRealDecayer;
    G4int fCallCount;
};
```

## Important Considerations

### Memory Management

**Ownership**:
- The returned `G4DecayProducts*` is owned by G4Decay
- G4Decay will delete the products after creating secondary tracks
- Do NOT delete products in the external decayer

**Daughter Particles**:
- Create daughters with `new G4DynamicParticle(...)`
- Add to products with `products->PushProducts(daughter)`
- G4DecayProducts takes ownership of daughters

### Lorentz Transformations

**Critical**: External decayers must handle frame transformations themselves.

From `source/processes/decay/src/G4Decay.cc` lines 329-333:
```cpp
if (aTrack.GetTrackStatus() == fStopButAlive) {
    // AtRest case
    if (isPreAssigned) products->Boost(ParentEnergy, ParentDirection);
} else {
    // PostStep case
    if (!isExtDecayer) products->Boost(ParentEnergy, ParentDirection);
}
```

**No boost for external decayers in flight!**

### Thread Safety

For multi-threaded Geant4:
- External decayer instances are shared across threads
- Implementation must be thread-safe
- Use thread-local storage or locks as needed
- EvtGen and Pythia have thread-safety considerations

### PDG Encoding

Ensure consistent particle identification:
- Geant4: `GetPDGEncoding()`
- EvtGen: EvtId system
- Pythia8: PDG codes directly
- Handle exotic/non-standard particles carefully

### Error Handling

What if decay fails?
- Return nullptr: G4Decay will try decay table
- Return empty products: Particle is killed
- Throw exception: Simulation aborts
- Log warning and use fallback

## Applications

External decayers are essential for:

1. **Heavy Flavor Physics**:
   - B-meson CP violation (EvtGen)
   - Charm physics
   - Time-dependent phenomena
   - Angular analyses

2. **Hadronization**:
   - String fragmentation (Pythia)
   - Cluster hadronization (HERWIG)
   - Resonance decays

3. **Precision QED**:
   - Radiative corrections (PHOTOS)
   - Tau decays (TAUOLA)
   - Form factor effects

4. **Beyond Standard Model**:
   - Custom decay implementations
   - Exotic particle decays
   - Specialized matrix elements

5. **Validation and Testing**:
   - Cross-checking decay models
   - Systematic uncertainty studies
   - Algorithm comparisons

## Common External Libraries

### EvtGen
- **Purpose**: Heavy flavor decays (B, D, charm baryons)
- **Features**: Full angular correlations, CP violation, time-dependence
- **Website**: https://evtgen.hepforge.org/

### Pythia8
- **Purpose**: General-purpose hadronization and decay
- **Features**: String fragmentation, resonances, QCD radiation
- **Website**: https://pythia.org/

### PHOTOS
- **Purpose**: QED radiative corrections in decays
- **Features**: Photon radiation, O(α) corrections
- **Website**: https://photospp.web.cern.ch/

### TAUOLA
- **Purpose**: Tau lepton decay
- **Features**: Polarization, spin correlations, radiative corrections
- **Website**: https://tauolapp.web.cern.ch/

## Related Classes

- **[G4Decay](./g4decay.md)**: Decay process using this interface
- **G4DecayProducts**: Container for decay products
- **G4DynamicParticle**: Daughter particle representation
- **G4Track**: Parent particle information
- **G4ParticleDefinition**: Particle properties

## Notes

- Pure virtual class—cannot be instantiated directly
- Derived classes must implement `ImportDecayProducts()`
- Copy and assignment are disabled
- External decayer handles its own Lorentz boosts
- Shared across threads—must be thread-safe
- Memory management: G4Decay deletes returned products
- Name is optional but recommended for diagnostics
- Can return nullptr to fall back to decay table
- No built-in error recovery—implementation must handle failures
