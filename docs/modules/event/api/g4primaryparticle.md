# G4PrimaryParticle API Documentation

## Overview

`G4PrimaryParticle` represents a primary particle with its kinematic properties (momentum, energy, charge, etc.). Primary particles are associated with `G4PrimaryVertex` objects and serve as the initial input for event simulation. This class is designed for persistence and is independent of most Geant4 simulation classes.

::: tip Header File
**Location:** `source/particles/management/include/G4PrimaryParticle.hh`
**Source:** `source/particles/management/src/G4PrimaryParticle.cc`
**Module:** Particles (used by Event module)
:::

## Key Concepts

### Design Philosophy

`G4PrimaryParticle` is intentionally different from `G4Track` and `G4DynamicParticle`:

- **Persistence**: Designed to be stored with `G4Event` in databases
- **Independence**: Minimal dependencies on other Geant4 classes
- **Flexibility**: Can represent particles Geant4 cannot simulate

### Particle Type Specification

Particles can be specified two ways:

1. **PDG Code** (`G4int`): Particle Data Group code (e.g., 11 for electron)
2. **G4ParticleDefinition** pointer: Direct reference to particle type

::: info PDG Code Advantage
PDG codes enable persistence - can be saved and rebuilt without `G4ParticleDefinition` pointer.
:::

### Daughter Particles

Primary particles can have daughter particles:

- **Case A**: Mother is unknown to Geant4 → daughters examined for simulation
- **Case B**: Mother is known to Geant4 → daughters become "pre-fixed" decay channel

## Class Declaration

```cpp
class G4PrimaryParticle
{
  public:
    G4PrimaryParticle();
    G4PrimaryParticle(G4int Pcode);
    G4PrimaryParticle(G4int Pcode, G4double px, G4double py, G4double pz);
    G4PrimaryParticle(G4int Pcode, G4double px, G4double py, G4double pz, G4double E);
    G4PrimaryParticle(const G4ParticleDefinition* Gcode);
    G4PrimaryParticle(const G4ParticleDefinition* Gcode,
                      G4double px, G4double py, G4double pz);
    G4PrimaryParticle(const G4ParticleDefinition* Gcode,
                      G4double px, G4double py, G4double pz, G4double E);
    virtual ~G4PrimaryParticle();

    // ... (methods detailed below)
};
```

## Memory Management

### Custom Allocator
`source/particles/management/include/G4PrimaryParticle.hh:182-193`

```cpp
inline void* G4PrimaryParticle::operator new(std::size_t)
{
    if (aPrimaryParticleAllocator() == nullptr)
        aPrimaryParticleAllocator() = new G4Allocator<G4PrimaryParticle>;
    return (void*)aPrimaryParticleAllocator()->MallocSingle();
}

inline void G4PrimaryParticle::operator delete(void* aPrimaryParticle)
{
    aPrimaryParticleAllocator()->FreeSingle((G4PrimaryParticle*)aPrimaryParticle);
}
```

## Constructors and Destructor

### Default Constructor
`source/particles/management/include/G4PrimaryParticle.hh:70`

```cpp
G4PrimaryParticle();
```

Creates particle with no type defined (PDGcode = 0).

### PDG Code Constructors
`source/particles/management/include/G4PrimaryParticle.hh:71-73`

```cpp
G4PrimaryParticle(G4int Pcode);
G4PrimaryParticle(G4int Pcode, G4double px, G4double py, G4double pz);
G4PrimaryParticle(G4int Pcode, G4double px, G4double py, G4double pz, G4double E);
```

**Parameters:**
- `Pcode`: PDG particle code
- `px`, `py`, `pz`: Momentum components
- `E`: Total energy

**Example:**
```cpp
// Electron (PDG code 11) with 5 GeV momentum along z
G4PrimaryParticle* electron = new G4PrimaryParticle(
    11, 0, 0, 5*GeV);

// Photon (PDG code 22) with specific 4-momentum
G4PrimaryParticle* photon = new G4PrimaryParticle(
    22, px, py, pz, energy);
```

::: tip PDG Codes
Common PDG codes:
- Photon: 22
- Electron: 11
- Positron: -11
- Muon-: 13
- Proton: 2212
- Neutron: 2112
:::

### ParticleDefinition Constructors
`source/particles/management/include/G4PrimaryParticle.hh:74-77`

```cpp
G4PrimaryParticle(const G4ParticleDefinition* Gcode);
G4PrimaryParticle(const G4ParticleDefinition* Gcode,
                  G4double px, G4double py, G4double pz);
G4PrimaryParticle(const G4ParticleDefinition* Gcode,
                  G4double px, G4double py, G4double pz, G4double E);
```

**Parameters:**
- `Gcode`: Pointer to particle definition
- `px`, `py`, `pz`: Momentum components
- `E`: Total energy

**Example:**
```cpp
// Using G4ParticleDefinition
G4PrimaryParticle* electron = new G4PrimaryParticle(
    G4Electron::Definition(), px, py, pz);

// Kinetic energy set later
G4PrimaryParticle* proton = new G4PrimaryParticle(
    G4Proton::Definition());
proton->SetKineticEnergy(100*MeV);
proton->SetMomentumDirection(G4ThreeVector(0, 0, 1));
```

### Copy Constructor and Assignment
`source/particles/management/include/G4PrimaryParticle.hh:85-86`

```cpp
G4PrimaryParticle(const G4PrimaryParticle& right);
G4PrimaryParticle& operator=(const G4PrimaryParticle& right);
```

**Behavior:**
- **Deep copy** of `nextParticle` and `daughterParticle`
- User information **NOT copied** (set to `nullptr`)

::: warning Deep Copy Cost
Copy constructor creates deep copy of entire particle tree. Can be expensive for particles with many daughters.
:::

## Particle Type

### GetPDGcode() / SetPDGcode()
`source/particles/management/include/G4PrimaryParticle.hh:109-110, 205-208`

```cpp
inline G4int GetPDGcode() const;
void SetPDGcode(G4int Pcode);
```

**Example:**
```cpp
particle->SetPDGcode(11);  // Set to electron
G4int pdg = particle->GetPDGcode();
```

### GetG4code() / SetG4code()
`source/particles/management/include/G4PrimaryParticle.hh:111-112, 345-348`

```cpp
inline G4ParticleDefinition* GetG4code() const;
inline void SetG4code(const G4ParticleDefinition* Gcode);
```

**Example:**
```cpp
particle->SetG4code(G4Electron::Definition());
G4ParticleDefinition* particleDef = particle->GetG4code();
```

### GetParticleDefinition() / SetParticleDefinition()
`source/particles/management/include/G4PrimaryParticle.hh:113-114`

```cpp
inline const G4ParticleDefinition* GetParticleDefinition() const;
void SetParticleDefinition(const G4ParticleDefinition* pdef);
```

**Purpose:** Preferred methods for getting/setting particle type

## Mass and Charge

### GetMass() / SetMass()
`source/particles/management/include/G4PrimaryParticle.hh:115-116, 195-198, 380-383`

```cpp
inline G4double GetMass() const;
inline void SetMass(G4double mas);
```

**Behavior:**
- If mass not explicitly set (mass < 0), returns mass from `G4ParticleDefinition`
- Explicit mass overrides definition (for dynamic mass)

**Example:**
```cpp
// Default: use particle definition mass
G4double mass = particle->GetMass();

// Override for specific case (e.g., excited state)
particle->SetMass(1.5 * particle->GetMass());
```

### GetCharge() / SetCharge()
`source/particles/management/include/G4PrimaryParticle.hh:117-118, 200-203, 385-388`

```cpp
inline G4double GetCharge() const;
inline void SetCharge(G4double chg);
```

**Example:**
```cpp
particle->SetCharge(1.0 * eplus);  // Singly charged
G4double charge = particle->GetCharge();
```

## Kinematics

### Momentum and Energy

#### GetMomentumDirection() / SetMomentumDirection()
`source/particles/management/include/G4PrimaryParticle.hh:121-122, 231-239`

```cpp
inline const G4ThreeVector& GetMomentumDirection() const;
inline void SetMomentumDirection(const G4ThreeVector& p);
```

**Example:**
```cpp
G4ThreeVector direction(0, 0, 1);  // Along z-axis
particle->SetMomentumDirection(direction);
```

#### GetKineticEnergy() / SetKineticEnergy()
`source/particles/management/include/G4PrimaryParticle.hh:119-120, 270-278`

```cpp
inline G4double GetKineticEnergy() const;
inline void SetKineticEnergy(G4double eKin);
```

**Example:**
```cpp
particle->SetKineticEnergy(10*GeV);
G4double eKin = particle->GetKineticEnergy();
```

#### GetTotalEnergy() / SetTotalEnergy()
`source/particles/management/include/G4PrimaryParticle.hh:125-126, 256-268`

```cpp
inline G4double GetTotalEnergy() const;
inline void SetTotalEnergy(G4double eTot);
```

**Implementation:**
```cpp
inline G4double G4PrimaryParticle::GetTotalEnergy() const
{
    if (mass < 0.) return kinE;  // Massless
    return kinE + mass;
}

inline void G4PrimaryParticle::SetTotalEnergy(G4double eTot)
{
    if (mass < 0.)
        kinE = eTot;
    else
        kinE = eTot - mass;
}
```

#### GetTotalMomentum()
`source/particles/management/include/G4PrimaryParticle.hh:123, 220-224`

```cpp
inline G4double GetTotalMomentum() const;
```

**Implementation:**
```cpp
inline G4double G4PrimaryParticle::GetTotalMomentum() const
{
    if (mass < 0.) return kinE;  // Massless: E = p
    return std::sqrt(kinE * (kinE + 2. * mass));
}
```

### Momentum Components

#### GetMomentum()
`source/particles/management/include/G4PrimaryParticle.hh:127, 226-229`

```cpp
inline G4ThreeVector GetMomentum() const;
```

**Returns:** 3-momentum vector

**Implementation:**
```cpp
inline G4ThreeVector G4PrimaryParticle::GetMomentum() const
{
    return GetTotalMomentum() * direction;
}
```

#### SetMomentum()
`source/particles/management/include/G4PrimaryParticle.hh:128`

```cpp
void SetMomentum(G4double px, G4double py, G4double pz);
```

**Purpose:** Set momentum components (calculates energy internally)

#### GetPx() / GetPy() / GetPz()
`source/particles/management/include/G4PrimaryParticle.hh:129-131, 241-254`

```cpp
inline G4double GetPx() const;
inline G4double GetPy() const;
inline G4double GetPz() const;
```

**Example:**
```cpp
G4double px = particle->GetPx();
G4double py = particle->GetPy();
G4double pz = particle->GetPz();
G4cout << "Momentum: (" << px/GeV << ", " << py/GeV << ", "
       << pz/GeV << ") GeV" << G4endl;
```

### 4-Momentum

#### Set4Momentum()
`source/particles/management/include/G4PrimaryParticle.hh:124`

```cpp
void Set4Momentum(G4double px, G4double py, G4double pz, G4double E);
```

**Purpose:** Set complete 4-momentum in one call

**Example:**
```cpp
particle->Set4Momentum(px, py, pz, energy);
```

## Polarization

### GetPolarization() / SetPolarization()
`source/particles/management/include/G4PrimaryParticle.hh:139-141, 295-402`

```cpp
inline G4ThreeVector GetPolarization() const;
inline void SetPolarization(const G4ThreeVector& pol);
inline void SetPolarization(G4double px, G4double py, G4double pz);
```

**Purpose:** Set/get spin polarization vector

**Example:**
```cpp
// Set polarization along y-axis
particle->SetPolarization(0, 1, 0);

// Or using vector
G4ThreeVector pol(0, 1, 0);
particle->SetPolarization(pol);

// Get polarization
G4ThreeVector polarization = particle->GetPolarization();
```

### GetPolX() / GetPolY() / GetPolZ()
`source/particles/management/include/G4PrimaryParticle.hh:142-144, 300-313`

```cpp
inline G4double GetPolX() const;
inline G4double GetPolY() const;
inline G4double GetPolZ() const;
```

**Returns:** Individual polarization components

## Particle Linking and Daughters

### Next Particle (Siblings)

#### SetNext() / GetNext() / ClearNext()
`source/particles/management/include/G4PrimaryParticle.hh:133-134, 280-363`

```cpp
inline void SetNext(G4PrimaryParticle* np);
inline G4PrimaryParticle* GetNext() const;
inline void ClearNext();
```

**Purpose:** Link particles at same vertex (siblings)

**Example:**
```cpp
G4PrimaryParticle* particle1 = new G4PrimaryParticle(11);  // e-
G4PrimaryParticle* particle2 = new G4PrimaryParticle(-11); // e+

particle1->SetNext(particle2);  // Link as siblings

// Iterate
G4PrimaryParticle* p = particle1;
while (p) {
    ProcessParticle(p);
    p = p->GetNext();
}
```

### Daughter Particles

#### SetDaughter() / GetDaughter()
`source/particles/management/include/G4PrimaryParticle.hh:135-136, 285-288, 365-373`

```cpp
inline void SetDaughter(G4PrimaryParticle* np);
inline G4PrimaryParticle* GetDaughter() const;
```

**Purpose:** Set/get daughter particles (decay products)

**Example:**
```cpp
// Create parent particle
G4PrimaryParticle* pi0 = new G4PrimaryParticle(111);  // π0

// Create decay products
G4PrimaryParticle* gamma1 = new G4PrimaryParticle(22, px1, py1, pz1);
G4PrimaryParticle* gamma2 = new G4PrimaryParticle(22, px2, py2, pz2);

// Set as daughters
pi0->SetDaughter(gamma1);
pi0->SetDaughter(gamma2);  // Automatically linked as siblings

// Access daughters
G4PrimaryParticle* daughter = pi0->GetDaughter();
while (daughter) {
    ProcessDaughter(daughter);
    daughter = daughter->GetNext();
}
```

::: tip Use Cases
**Daughters are used for:**
1. Pre-defined decay channels
2. Particles unknown to Geant4 that decay to known particles
3. Nuclear fragments from generator
:::

## Track ID and Weight

### GetTrackID() / SetTrackID()
`source/particles/management/include/G4PrimaryParticle.hh:137-138, 290-293, 375-378`

```cpp
inline G4int GetTrackID() const;
inline void SetTrackID(G4int id);
```

**Purpose:** Track ID assigned when converted to `G4Track`

**Default:** -1 (not yet converted)

**Example:**
```cpp
G4int trackID = particle->GetTrackID();
if (trackID < 0) {
    G4cout << "Particle not yet converted to track" << G4endl;
}
```

::: info Auto-Assignment
Track ID automatically set by `G4EventManager` during primary-to-track transformation.
:::

### GetWeight() / SetWeight()
`source/particles/management/include/G4PrimaryParticle.hh:145-146, 315-323`

```cpp
inline G4double GetWeight() const;
inline void SetWeight(G4double w);
```

**Purpose:** Statistical weight for variance reduction

**Default:** 1.0

**Example:**
```cpp
particle->SetWeight(2.5);
G4double weight = particle->GetWeight();
```

## Proper Time

### GetProperTime() / SetProperTime()
`source/particles/management/include/G4PrimaryParticle.hh:147-148, 325-333`

```cpp
inline G4double GetProperTime() const;
inline void SetProperTime(G4double t);
```

**Purpose:** Proper time for the particle

**Default:** -1.0 (not set)

**Example:**
```cpp
particle->SetProperTime(5*ns);
G4double tau = particle->GetProperTime();
```

## User Information

### SetUserInformation() / GetUserInformation()
`source/particles/management/include/G4PrimaryParticle.hh:149-150, 335-343`

```cpp
inline void SetUserInformation(G4VUserPrimaryParticleInformation* anInfo);
inline G4VUserPrimaryParticleInformation* GetUserInformation() const;
```

**Purpose:** Attach custom data to particle

**Example:**
```cpp
class MyParticleInfo : public G4VUserPrimaryParticleInformation {
public:
    void Print() const override { /* ... */ }

    G4int generatorID;
    G4String origin;
};

MyParticleInfo* info = new MyParticleInfo();
info->generatorID = 42;
info->origin = "BeamPipe";
particle->SetUserInformation(info);
```

## Utility Methods

### Print()
`source/particles/management/include/G4PrimaryParticle.hh:98`

```cpp
void Print() const;
```

**Purpose:** Print particle information to `G4cout`

**Output includes:**
- Particle type (PDG code and name if available)
- Momentum components
- Energy
- Daughter particles (recursively)

## Complete Examples

### Basic Particle Creation

```cpp
// Method 1: PDG code with momentum
G4PrimaryParticle* electron = new G4PrimaryParticle(
    11,                    // PDG code for electron
    0*GeV, 0*GeV, 5*GeV); // px, py, pz

// Method 2: ParticleDefinition with kinetic energy
G4PrimaryParticle* proton = new G4PrimaryParticle(
    G4Proton::Definition());
proton->SetKineticEnergy(1*GeV);
proton->SetMomentumDirection(G4ThreeVector(1, 0, 0));

// Add to vertex
vertex->SetPrimary(electron);
vertex->SetPrimary(proton);
```

### Pre-Defined Decay Chain

```cpp
// π+ → μ+ + νμ decay
G4PrimaryParticle* pionPlus = new G4PrimaryParticle(
    211, px_pi, py_pi, pz_pi);

// Create decay products
G4PrimaryParticle* muonPlus = new G4PrimaryParticle(
    -13, px_mu, py_mu, pz_mu);
G4PrimaryParticle* nuMu = new G4PrimaryParticle(
    14, px_nu, py_nu, pz_nu);

// Set as daughters
pionPlus->SetDaughter(muonPlus);
pionPlus->SetDaughter(nuMu);

// Add parent to vertex
vertex->SetPrimary(pionPlus);
```

### Particle with Full Kinematics

```cpp
G4PrimaryParticle* particle = new G4PrimaryParticle(
    G4Electron::Definition());

// Set 4-momentum
particle->Set4Momentum(px, py, pz, energy);

// Set polarization (transverse)
particle->SetPolarization(0, 1, 0);

// Set weight for biasing
particle->SetWeight(1.5);

// Set proper time
particle->SetProperTime(0*ns);

// Add custom information
MyParticleInfo* info = new MyParticleInfo();
info->generationMethod = "ImportancesSampling";
particle->SetUserInformation(info);

vertex->SetPrimary(particle);
```

### Complex Event with Multiple Particles

```cpp
void GenerateComplexEvent(G4PrimaryVertex* vertex)
{
    // Primary electron beam
    G4PrimaryParticle* beam = new G4PrimaryParticle(
        G4Electron::Definition());
    beam->SetKineticEnergy(10*GeV);
    beam->SetMomentumDirection(G4ThreeVector(0, 0, 1));
    vertex->SetPrimary(beam);

    // Bremsstrahlung photon
    G4PrimaryParticle* bremPhoton = new G4PrimaryParticle(22);
    bremPhoton->SetKineticEnergy(5*GeV);
    bremPhoton->SetMomentumDirection(G4ThreeVector(0.1, 0, 0.995));
    vertex->SetPrimary(bremPhoton);

    // Photon pair-produces
    G4PrimaryParticle* electron = new G4PrimaryParticle(11);
    electron->SetKineticEnergy(2.5*GeV);
    electron->SetMomentumDirection(G4ThreeVector(0.05, 0, 0.999));

    G4PrimaryParticle* positron = new G4PrimaryParticle(-11);
    positron->SetKineticEnergy(2.4*GeV);
    positron->SetMomentumDirection(G4ThreeVector(-0.05, 0, 0.999));

    // Set as daughters of brem photon
    bremPhoton->SetDaughter(electron);
    bremPhoton->SetDaughter(positron);
}
```

## Thread Safety

- Particles created per-event (thread-local in MT mode)
- No synchronization needed within event
- Safe to use from user actions

## Performance Notes

1. **Custom Allocator**: Fast allocation/deallocation
2. **Deep Copy**: Copy constructor performs deep copy of entire tree
3. **Linked Lists**: Siblings and daughters stored as linked lists
4. **Mass/Charge Cache**: Explicit mass/charge overrides stored when set

## See Also

- [G4Event](g4event.md) - Event container
- [G4PrimaryVertex](g4primaryvertex.md) - Primary vertex class
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/particles/management/include/G4PrimaryParticle.hh`
- Source: `source/particles/management/src/G4PrimaryParticle.cc`
:::
