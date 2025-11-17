# G4ParticleDefinition API Documentation

## Overview

`G4ParticleDefinition` is the fundamental class that contains all static properties of a particle in Geant4. It defines intrinsic particle characteristics such as mass, charge, spin, quantum numbers, and lifetime. Each particle type is represented by a unique instance of a class derived from `G4ParticleDefinition`. The class manages process managers that collect all processes the particle can undertake, and handles thread-safety for multi-threaded applications.

::: tip Header File
**Location:** `source/particles/management/include/G4ParticleDefinition.hh`
**Source:** `source/particles/management/src/G4ParticleDefinition.cc`
**Inline:** `source/particles/management/include/G4ParticleDefinition.icc`
:::

## Class Declaration

```cpp
class G4ParticleDefinition
{
  public:
    // Constructor with full particle properties
    G4ParticleDefinition(const G4String& aName, G4double mass, G4double width,
                         G4double charge, G4int iSpin, G4int iParity,
                         G4int iConjugation, G4int iIsospin, G4int iIsospinZ,
                         G4int gParity, const G4String& pType, G4int lepton,
                         G4int baryon, G4int encoding, G4bool stable,
                         G4double lifetime, G4DecayTable* decaytable,
                         G4bool shortlived = false, const G4String& subType = "",
                         G4int anti_encoding = 0, G4double magneticMoment = 0.0);

    virtual ~G4ParticleDefinition();

    // Copy constructor and assignment operator are deleted
    G4ParticleDefinition(const G4ParticleDefinition&) = delete;
    G4ParticleDefinition& operator=(const G4ParticleDefinition&) = delete;

    // Comparison operators
    G4bool operator==(const G4ParticleDefinition& right) const;
    G4bool operator!=(const G4ParticleDefinition& right) const;

    // ... (methods detailed below)
};
```

## Constructor

### G4ParticleDefinition()
`source/particles/management/src/G4ParticleDefinition.cc:63-166`

```cpp
G4ParticleDefinition(const G4String& aName, G4double mass, G4double width,
                     G4double charge, G4int iSpin, G4int iParity,
                     G4int iConjugation, G4int iIsospin, G4int iIsospin3,
                     G4int gParity, const G4String& pType, G4int lepton,
                     G4int baryon, G4int encoding, G4bool stable,
                     G4double lifetime, G4DecayTable* decaytable,
                     G4bool shortlived = false, const G4String& subType = "",
                     G4int anti_encoding = 0, G4double magneticMoment = 0.0);
```

**Parameters:**

- `aName`: Particle name (e.g., "e-", "proton", "gamma")
- `mass`: Particle mass in energy units (e.g., MeV)
- `width`: Decay width (Breit-Wigner width) in energy units
- `charge`: Electric charge in units of elementary charge (e.g., -1.0 for electron)
- `iSpin`: Total spin in units of 1/2 (e.g., 1 for spin-1/2, 2 for spin-1)
- `iParity`: Parity quantum number (+1, -1, or 0 if undefined)
- `iConjugation`: Charge conjugation quantum number (+1, -1, or 0)
- `iIsospin`: Isospin in units of 1/2
- `iIsospin3`: Isospin 3rd component in units of 1/2
- `gParity`: G-parity quantum number (+1, -1, or 0)
- `pType`: Particle type (e.g., "lepton", "meson", "baryon", "nucleus")
- `lepton`: Lepton number (+1 for leptons, -1 for antileptons, 0 otherwise)
- `baryon`: Baryon number (+1 for baryons, -1 for antibaryons, 0 otherwise)
- `encoding`: PDG particle code
- `stable`: Stability flag (true for stable particles)
- `lifetime`: Mean lifetime in time units (e.g., ns)
- `decaytable`: Pointer to decay table (can be nullptr)
- `shortlived`: Flag for short-lived particles (not tracked)
- `subType`: Particle subtype (e.g., "pi", "kaon", "lambda")
- `anti_encoding`: PDG code for antiparticle (optional, defaults to -encoding)
- `magneticMoment`: Magnetic moment in appropriate units

**Behavior:**

- Validates PDG encoding against quark content
- Automatically registers particle in `G4ParticleTable`
- Sets atomic number and mass for ions
- Must be called in Pre_Init state (except for ions and short-lived particles)

**Example:**

```cpp
// Define a custom particle (hypothetical example)
G4ParticleDefinition* myParticle = new G4ParticleDefinition(
    "my_particle",          // name
    100.0*MeV,             // mass
    0.0*MeV,               // width
    -1.0*eplus,            // charge
    1,                     // spin 1/2
    1,                     // positive parity
    0,                     // no charge conjugation
    1,                     // isospin 1/2
    -1,                    // isospin3 -1/2
    0,                     // no G-parity
    "meson",               // type
    0,                     // not a lepton
    0,                     // not a baryon
    123456,                // PDG encoding
    false,                 // not stable
    1.5*ns,                // lifetime
    nullptr,               // decay table to be set later
    false,                 // not short-lived
    "custom"               // subtype
);
```

::: warning Construction Time
Particle definitions (except ions and short-lived particles) should be created during Pre_Init state. Creating them later will generate warnings.
:::

### Destructor
`source/particles/management/src/G4ParticleDefinition.cc:174-194`

```cpp
virtual ~G4ParticleDefinition();
```

**Behavior:**

- Deletes the decay table if present
- Only allows deletion in Pre_Init state
- Prints warning if attempting to delete after initialization

## Property Getters

### Particle Identification

#### GetParticleName()
`source/particles/management/include/G4ParticleDefinition.hh:96`

```cpp
const G4String& GetParticleName() const;
```

**Returns:** Particle name

**Example:**

```cpp
G4ParticleDefinition* electron = G4Electron::Definition();
G4String name = electron->GetParticleName();  // Returns "e-"
```

#### GetPDGEncoding()
`source/particles/management/include/G4ParticleDefinition.hh:123`

```cpp
G4int GetPDGEncoding() const;
```

**Returns:** PDG particle code

**Example:**

```cpp
G4int pdgCode = G4Electron::Definition()->GetPDGEncoding();  // Returns 11
```

#### GetAntiPDGEncoding()
`source/particles/management/include/G4ParticleDefinition.hh:124`

```cpp
G4int GetAntiPDGEncoding() const;
```

**Returns:** PDG code for antiparticle

**Example:**

```cpp
// For electron (PDG 11), antiparticle is positron (PDG -11)
G4int antiCode = G4Electron::Definition()->GetAntiPDGEncoding();  // Returns -11
```

#### SetAntiPDGEncoding()
`source/particles/management/include/G4ParticleDefinition.icc:136-139`

```cpp
inline void SetAntiPDGEncoding(G4int aEncoding);
```

**Parameters:**

- `aEncoding`: PDG code for antiparticle

**Purpose:** Override default antiparticle encoding

### Mass and Energy Properties

#### GetPDGMass()
`source/particles/management/include/G4ParticleDefinition.hh:98`

```cpp
G4double GetPDGMass() const;
```

**Returns:** Particle mass in Geant4 default energy units

**Example:**

```cpp
G4double electronMass = G4Electron::Definition()->GetPDGMass();
G4cout << "Electron mass: " << electronMass/MeV << " MeV" << G4endl;
```

#### GetPDGWidth()
`source/particles/management/include/G4ParticleDefinition.hh:99`

```cpp
G4double GetPDGWidth() const;
```

**Returns:** Decay width (Breit-Wigner width) in energy units

**Example:**

```cpp
G4double width = G4PionZero::Definition()->GetPDGWidth();
G4cout << "Pi0 width: " << width/eV << " eV" << G4endl;
```

#### GetPDGCharge()
`source/particles/management/include/G4ParticleDefinition.hh:100`

```cpp
G4double GetPDGCharge() const;
```

**Returns:** Electric charge in units of elementary charge

**Example:**

```cpp
G4double charge = G4Proton::Definition()->GetPDGCharge();
G4cout << "Proton charge: " << charge/eplus << " e" << G4endl;  // Prints: 1 e
```

### Spin Properties

#### GetPDGSpin()
`source/particles/management/include/G4ParticleDefinition.hh:102`

```cpp
G4double GetPDGSpin() const;
```

**Returns:** Total spin in units of ℏ (natural units)

**Example:**

```cpp
G4double spin = G4Electron::Definition()->GetPDGSpin();  // Returns 0.5
```

#### GetPDGiSpin()
`source/particles/management/include/G4ParticleDefinition.hh:103`

```cpp
G4int GetPDGiSpin() const;
```

**Returns:** Total spin in units of ℏ/2 (integer representation)

**Example:**

```cpp
G4int iSpin = G4Electron::Definition()->GetPDGiSpin();  // Returns 1 (spin 1/2)
G4int photonSpin = G4Gamma::Definition()->GetPDGiSpin(); // Returns 2 (spin 1)
```

### Quantum Numbers

#### GetPDGiParity()
`source/particles/management/include/G4ParticleDefinition.hh:104`

```cpp
G4int GetPDGiParity() const;
```

**Returns:** Parity quantum number (+1, -1, or 0 if undefined)

#### GetPDGiConjugation()
`source/particles/management/include/G4ParticleDefinition.hh:105`

```cpp
G4int GetPDGiConjugation() const;
```

**Returns:** Charge conjugation quantum number (+1, -1, or 0)

#### GetPDGIsospin() / GetPDGIsospin3()
`source/particles/management/include/G4ParticleDefinition.hh:106-107`

```cpp
G4double GetPDGIsospin() const;
G4double GetPDGIsospin3() const;
```

**Returns:** Isospin and its 3rd component in natural units

#### GetPDGiIsospin() / GetPDGiIsospin3()
`source/particles/management/include/G4ParticleDefinition.hh:108-109`

```cpp
G4int GetPDGiIsospin() const;
G4int GetPDGiIsospin3() const;
```

**Returns:** Isospin and its 3rd component in units of 1/2 (integer representation)

**Example:**

```cpp
// Proton has isospin 1/2, isospin3 +1/2
G4int isospin = G4Proton::Definition()->GetPDGiIsospin();    // Returns 1
G4int isospin3 = G4Proton::Definition()->GetPDGiIsospin3();  // Returns 1

// Neutron has isospin 1/2, isospin3 -1/2
G4int neutronI3 = G4Neutron::Definition()->GetPDGiIsospin3(); // Returns -1
```

#### GetPDGiGParity()
`source/particles/management/include/G4ParticleDefinition.hh:110`

```cpp
G4int GetPDGiGParity() const;
```

**Returns:** G-parity quantum number (+1, -1, or 0)

### Magnetic Moment

#### GetPDGMagneticMoment()
`source/particles/management/include/G4ParticleDefinition.hh:112`

```cpp
G4double GetPDGMagneticMoment() const;
```

**Returns:** Magnetic moment in Geant4 default units

#### SetPDGMagneticMoment()
`source/particles/management/include/G4ParticleDefinition.icc:166-169`

```cpp
inline void SetPDGMagneticMoment(G4double magneticMoment);
```

**Parameters:**

- `magneticMoment`: Magnetic moment value

**Purpose:** Set or update magnetic moment after construction

#### CalculateAnomaly()
`source/particles/management/src/G4ParticleDefinition.cc:374-386`

```cpp
G4double CalculateAnomaly() const;
```

**Returns:** Anomalous magnetic moment for spin-1/2 particles

**Behavior:**

- Only valid for spin-1/2 particles
- Returns 0.0 for other spins
- Calculates: |μ/μ_B - 2q/e| / 2

::: warning Deprecated
This method will be removed in future releases. Use direct magnetic moment access instead.
:::

**Example:**

```cpp
G4double anomaly = G4Electron::Definition()->CalculateAnomaly();
G4cout << "Electron g-2: " << anomaly << G4endl;
```

### Particle Classification

#### GetParticleType()
`source/particles/management/include/G4ParticleDefinition.hh:118`

```cpp
const G4String& GetParticleType() const;
```

**Returns:** General particle type (e.g., "lepton", "meson", "baryon", "nucleus")

#### GetParticleSubType()
`source/particles/management/include/G4ParticleDefinition.hh:119`

```cpp
const G4String& GetParticleSubType() const;
```

**Returns:** Specific particle subtype (e.g., "e", "mu", "pi", "kaon")

#### SetParticleSubType()
`source/particles/management/include/G4ParticleDefinition.icc:131-134`

```cpp
inline void SetParticleSubType(const G4String& subtype);
```

**Parameters:**

- `subtype`: Particle subtype string

**Purpose:** Set or modify particle subtype (protected method)

**Example:**

```cpp
G4ParticleDefinition* particle = G4Electron::Definition();
G4String type = particle->GetParticleType();      // Returns "lepton"
G4String subtype = particle->GetParticleSubType(); // Returns "e"
```

#### GetLeptonNumber()
`source/particles/management/include/G4ParticleDefinition.hh:120`

```cpp
G4int GetLeptonNumber() const;
```

**Returns:** Lepton number (+1 for leptons, -1 for antileptons, 0 otherwise)

**Example:**

```cpp
G4int leptonNumber = G4Electron::Definition()->GetLeptonNumber();  // Returns 1
G4int positronLepton = G4Positron::Definition()->GetLeptonNumber(); // Returns -1
```

#### GetBaryonNumber()
`source/particles/management/include/G4ParticleDefinition.hh:121`

```cpp
G4int GetBaryonNumber() const;
```

**Returns:** Baryon number (+1 for baryons, -1 for antibaryons, 0 otherwise)

**Example:**

```cpp
G4int baryonNumber = G4Proton::Definition()->GetBaryonNumber();  // Returns 1
G4int photonBaryon = G4Gamma::Definition()->GetBaryonNumber();   // Returns 0
```

### Quark Content

#### GetQuarkContent()
`source/particles/management/include/G4ParticleDefinition.icc:94-110`

```cpp
inline G4int GetQuarkContent(G4int flavor) const;
```

**Parameters:**

- `flavor`: Quark flavor (1=d, 2=u, 3=s, 4=c, 5=b, 6=t)

**Returns:** Number of quarks of specified flavor

**Example:**

```cpp
G4ParticleDefinition* proton = G4Proton::Definition();
G4int upQuarks = proton->GetQuarkContent(2);    // Returns 2 (uud)
G4int downQuarks = proton->GetQuarkContent(1);  // Returns 1 (uud)
```

#### GetAntiQuarkContent()
`source/particles/management/include/G4ParticleDefinition.icc:112-129`

```cpp
inline G4int GetAntiQuarkContent(G4int flavor) const;
```

**Parameters:**

- `flavor`: Quark flavor (1=d, 2=u, 3=s, 4=c, 5=b, 6=t)

**Returns:** Number of antiquarks of specified flavor

**Example:**

```cpp
G4ParticleDefinition* piPlus = G4PionPlus::Definition();
G4int upQuarks = piPlus->GetQuarkContent(2);       // Returns 1 (u)
G4int antiDown = piPlus->GetAntiQuarkContent(1);   // Returns 1 (anti-d)
```

## Stability and Lifetime

### GetPDGStable()
`source/particles/management/include/G4ParticleDefinition.icc:37-44`

```cpp
inline G4bool GetPDGStable() const;
```

**Returns:** `true` if particle is stable, `false` otherwise

**Behavior:**

- For ions, checks if lifetime is negative
- For other particles, returns stability flag

**Example:**

```cpp
G4bool isStable = G4Proton::Definition()->GetPDGStable();  // Returns true
G4bool neutronStable = G4Neutron::Definition()->GetPDGStable(); // Returns false
```

### SetPDGStable()
`source/particles/management/include/G4ParticleDefinition.hh:136`

```cpp
void SetPDGStable(const G4bool aFlag);
```

**Parameters:**

- `aFlag`: Stability flag

**Purpose:** Set or modify particle stability

### GetPDGLifeTime()
`source/particles/management/include/G4ParticleDefinition.icc:46-49`

```cpp
inline G4double GetPDGLifeTime() const;
```

**Returns:** Mean lifetime in Geant4 default time units

**Example:**

```cpp
G4double lifetime = G4Neutron::Definition()->GetPDGLifeTime();
G4cout << "Neutron lifetime: " << lifetime/s << " seconds" << G4endl;
```

### SetPDGLifeTime()
`source/particles/management/include/G4ParticleDefinition.hh:139`

```cpp
void SetPDGLifeTime(G4double aLifeTime);
```

**Parameters:**

- `aLifeTime`: Mean lifetime in time units

**Purpose:** Set or modify particle lifetime

### GetIonLifeTime()
`source/particles/management/include/G4ParticleDefinition.icc:51-57`

```cpp
inline G4double GetIonLifeTime() const;
```

**Returns:** Ion lifetime (same as `GetPDGLifeTime()` in current implementation)

**Purpose:** Query lifetime for generic ions

::: info Legacy Method
This method is kept for backward compatibility. It now returns the same value as `GetPDGLifeTime()`.
:::

### IsShortLived()
`source/particles/management/include/G4ParticleDefinition.hh:133`

```cpp
G4bool IsShortLived() const;
```

**Returns:** `true` if particle is short-lived (not tracked)

**Purpose:** Short-lived particles are not tracked by `G4TrackingManager`

**Example:**

```cpp
// Short-lived resonances are typically not tracked
G4bool shortLived = someResonance->IsShortLived();
```

## Decay Management

### GetDecayTable()
`source/particles/management/include/G4ParticleDefinition.icc:64-67`

```cpp
inline G4DecayTable* GetDecayTable() const;
```

**Returns:** Pointer to decay table, or `nullptr` if none defined

**Example:**

```cpp
G4DecayTable* decayTable = G4MuonMinus::Definition()->GetDecayTable();
if (decayTable) {
    G4int nModes = decayTable->entries();
    G4cout << "Muon has " << nModes << " decay modes" << G4endl;
}
```

### SetDecayTable()
`source/particles/management/include/G4ParticleDefinition.icc:69-72`

```cpp
inline void SetDecayTable(G4DecayTable* aDecayTable);
```

**Parameters:**

- `aDecayTable`: Pointer to decay table

**Purpose:** Set or replace decay table

::: warning Ownership
The particle definition takes ownership of the decay table and will delete it in the destructor.
:::

**Example:**

```cpp
// Create custom decay table
G4DecayTable* myDecayTable = new G4DecayTable();

// Add decay channels
G4VDecayChannel* mode1 = new G4PhaseSpaceDecayChannel(...);
myDecayTable->Insert(mode1);

G4VDecayChannel* mode2 = new G4PhaseSpaceDecayChannel(...);
myDecayTable->Insert(mode2);

// Set decay table
myParticle->SetDecayTable(myDecayTable);
```

## Process Management

### GetProcessManager()
`source/particles/management/src/G4ParticleDefinition.cc:218-222`

```cpp
G4ProcessManager* GetProcessManager() const;
```

**Returns:** Pointer to process manager, or `nullptr` if not initialized

**Purpose:** Access the process manager that handles all physics processes for this particle

**Example:**

```cpp
G4ProcessManager* pManager = G4Electron::Definition()->GetProcessManager();
if (pManager) {
    G4ProcessVector* processList = pManager->GetProcessList();
    G4cout << "Electron has " << processList->size() << " processes" << G4endl;
}
```

### SetProcessManager()
`source/particles/management/src/G4ParticleDefinition.cc:406-419`

```cpp
void SetProcessManager(G4ProcessManager* aProcessManager);
```

**Parameters:**

- `aProcessManager`: Pointer to process manager

**Purpose:** Set or replace process manager

**Behavior:**

- Automatically initializes thread-local storage if needed
- Thread-safe when properly initialized

::: warning Thread Safety
Ensure proper initialization of TLS pointer vector before calling in worker threads. The method will issue a warning if TLS is not initialized.
:::

**Example:**

```cpp
// In physics list construction
G4ProcessManager* pManager = new G4ProcessManager(G4Electron::Definition());

// Add processes
pManager->AddProcess(new G4eMultipleScattering, -1, 1, 1);
pManager->AddProcess(new G4eIonisation, -1, 2, 2);
pManager->AddProcess(new G4eBremsstrahlung, -1, 3, 3);

// Set process manager
G4Electron::Definition()->SetProcessManager(pManager);
```

### GetMasterProcessManager()
`source/particles/management/include/G4ParticleDefinition.icc:84-87`

```cpp
inline G4ProcessManager* GetMasterProcessManager() const;
```

**Returns:** Pointer to master thread's process manager

**Purpose:** Access master process manager from worker threads in MT mode

**Example:**

```cpp
// In worker thread
G4ProcessManager* masterPM =
    G4Electron::Definition()->GetMasterProcessManager();
```

### SetMasterProcessManager()
`source/particles/management/include/G4ParticleDefinition.icc:89-92`

```cpp
inline void SetMasterProcessManager(G4ProcessManager* aNewPM);
```

**Parameters:**

- `aNewPM`: Pointer to master process manager

**Purpose:** Set master process manager shadow pointer (internal use)

::: warning Internal Use
This method is for internal framework use. User code should not call this directly.
:::

## Tracking Management

### GetTrackingManager()
`source/particles/management/src/G4ParticleDefinition.cc:224-228`

```cpp
G4VTrackingManager* GetTrackingManager() const;
```

**Returns:** Pointer to custom tracking manager, or `nullptr` for default

**Purpose:** Get particle-specific tracking manager

::: info Custom Tracking
Most particles use the default tracking manager. Custom tracking managers enable specialized tracking algorithms for specific particles.
:::

### SetTrackingManager()
`source/particles/management/src/G4ParticleDefinition.cc:421-434`

```cpp
void SetTrackingManager(G4VTrackingManager* aTrackingManager);
```

**Parameters:**

- `aTrackingManager`: Pointer to tracking manager (nullptr for default)

**Purpose:** Set custom tracking manager for particle

**Example:**

```cpp
// Set custom tracking manager for fast simulation
G4VTrackingManager* fastTracker = new MyFastTrackingManager();
myParticle->SetTrackingManager(fastTracker);
```

## Ion-Specific Methods

### GetAtomicNumber()
`source/particles/management/include/G4ParticleDefinition.icc:151-154`

```cpp
inline G4int GetAtomicNumber() const;
```

**Returns:** Atomic number (Z) for ions, 0 otherwise

**Example:**

```cpp
G4ParticleDefinition* carbon12 = G4IonTable::GetIonTable()->GetIon(6, 12);
G4int Z = carbon12->GetAtomicNumber();  // Returns 6
```

### GetAtomicMass()
`source/particles/management/include/G4ParticleDefinition.icc:161-164`

```cpp
inline G4int GetAtomicMass() const;
```

**Returns:** Atomic mass number (A) for ions, 0 otherwise

**Example:**

```cpp
G4ParticleDefinition* carbon12 = G4IonTable::GetIonTable()->GetIon(6, 12);
G4int A = carbon12->GetAtomicMass();  // Returns 12
```

### SetAtomicNumber() / SetAtomicMass()
`source/particles/management/include/G4ParticleDefinition.icc:146-149, 156-159`

```cpp
inline void SetAtomicNumber(G4int i);
inline void SetAtomicMass(G4int i);
```

**Parameters:**

- `i`: Atomic number (Z) or mass number (A)

**Purpose:** Set atomic properties (protected methods, typically set during construction)

### IsGeneralIon()
`source/particles/management/include/G4ParticleDefinition.icc:171-174`

```cpp
inline G4bool IsGeneralIon() const;
```

**Returns:** `true` if particle is a generic ion

**Purpose:** Check if particle uses the generic ion process manager

**Example:**

```cpp
if (particle->IsGeneralIon()) {
    G4int Z = particle->GetAtomicNumber();
    G4int A = particle->GetAtomicMass();
    G4cout << "Ion with Z=" << Z << ", A=" << A << G4endl;
}
```

### IsMuonicAtom()
`source/particles/management/include/G4ParticleDefinition.icc:176-179`

```cpp
inline G4bool IsMuonicAtom() const;
```

**Returns:** `true` if particle is a muonic atom

**Purpose:** Identify muonic atoms (atoms with muon replacing electron)

### IsHypernucleus()
`source/particles/management/include/G4ParticleDefinition.icc:186-189`

```cpp
inline G4bool IsHypernucleus() const;
```

**Returns:** `true` if nucleus contains lambda hyperons

**Example:**

```cpp
if (particle->IsHypernucleus()) {
    G4int nLambdas = particle->GetNumberOfLambdasInHypernucleus();
    G4cout << "Hypernucleus with " << nLambdas << " Lambdas" << G4endl;
}
```

### GetNumberOfLambdasInHypernucleus()
`source/particles/management/include/G4ParticleDefinition.icc:191-199`

```cpp
inline G4int GetNumberOfLambdasInHypernucleus() const;
```

**Returns:** Number of lambda hyperons in hypernucleus, 0 otherwise

**Behavior:**

- Extracts lambda count from PDG encoding: 10LZZZAAAI
- L is the number of lambdas (2 digits)

### IsAntiHypernucleus() / GetNumberOfAntiLambdasInAntiHypernucleus()
`source/particles/management/include/G4ParticleDefinition.icc:201-214`

```cpp
inline G4bool IsAntiHypernucleus() const;
inline G4int GetNumberOfAntiLambdasInAntiHypernucleus() const;
```

**Returns:** Anti-hypernucleus status and anti-lambda count

**Purpose:** Check for and count anti-lambdas in anti-hypernuclei

## Thread Safety and Instance Management

### GetInstanceID()
`source/particles/management/include/G4ParticleDefinition.icc:32-35`

```cpp
inline G4int GetInstanceID() const;
```

**Returns:** Thread-local instance ID

**Purpose:** Get unique instance ID for thread-local storage

### GetParticleDefinitionID()
`source/particles/management/include/G4ParticleDefinition.icc:181-184`

```cpp
inline G4int GetParticleDefinitionID() const;
```

**Returns:** Particle definition instance ID (same as `GetInstanceID()`)

### SetParticleDefinitionID()
`source/particles/management/src/G4ParticleDefinition.cc:388-404`

```cpp
void SetParticleDefinitionID(G4int id = -1);
```

**Parameters:**

- `id`: Instance ID (-1 for automatic allocation)

**Purpose:** Initialize thread-local instance (internal use)

**Behavior:**

- If `id < 0`, creates new sub-instance automatically
- If `id >= 0`, only valid for ions and muonic atoms

### GetSubInstanceManager()
`source/particles/management/src/G4ParticleDefinition.cc:206-210`

```cpp
static const G4PDefManager& GetSubInstanceManager();
```

**Returns:** Reference to sub-instance manager

**Purpose:** Access thread-local storage manager (advanced use)

### Clean()
`source/particles/management/src/G4ParticleDefinition.cc:212-216`

```cpp
static void Clean();
```

**Purpose:** Clear memory allocated by sub-instance manager

**Usage:** Called during cleanup phase

## Utility Methods

### DumpTable()
`source/particles/management/src/G4ParticleDefinition.cc:285-358`

```cpp
void DumpTable() const;
```

**Purpose:** Print complete particle information to `G4cout`

**Output Includes:**

- Particle name and PDG codes
- Mass, width, and lifetime
- Charge, spin, and quantum numbers
- Quark content
- Lepton and baryon numbers
- Particle type and subtype
- Atomic properties (for ions)
- Stability and decay information

**Example:**

```cpp
G4Electron::Definition()->DumpTable();
```

**Sample Output:**

```
--- G4ParticleDefinition ---
 Particle Name : e-
 PDG particle code : 11 [PDG anti-particle code: -11]
 Mass [GeV/c2] : 0.000511     Width : 0
 Lifetime [nsec] : 0
 Charge [e]: -1
 Spin : 1/2
 Parity : 0
 Charge conjugation : 0
 Isospin : (I,Iz): (0/2 , 0/2 )
 GParity : 0
 Quark contents     (d,u,s,c,b,t) : 0, 0, 0, 0, 0, 0
 AntiQuark contents               : 0, 0, 0, 0, 0, 0
 Lepton number : 1 Baryon number : 0
 Particle type : lepton [e]
 Stable : stable
```

### SetVerboseLevel()
`source/particles/management/include/G4ParticleDefinition.icc:74-77`

```cpp
inline void SetVerboseLevel(G4int value);
```

**Parameters:**

- `value`: Verbosity level (0=silent, 1=warning, 2=more verbose)

**Purpose:** Control output verbosity

### GetVerboseLevel()
`source/particles/management/include/G4ParticleDefinition.icc:79-82`

```cpp
inline G4int GetVerboseLevel() const;
```

**Returns:** Current verbosity level

### GetParticleTable()
`source/particles/management/include/G4ParticleDefinition.icc:59-62`

```cpp
inline G4ParticleTable* GetParticleTable() const;
```

**Returns:** Pointer to the particle table

**Purpose:** Access global particle table

### SetApplyCutsFlag()
`source/particles/management/src/G4ParticleDefinition.cc:360-372`

```cpp
void SetApplyCutsFlag(G4bool flg);
```

**Parameters:**

- `flg`: Flag to apply production cuts

**Purpose:** Control production threshold application

**Behavior:**

- Only effective for gamma, e-, e+, and proton
- Other particles ignore this setting

### GetApplyCutsFlag()
`source/particles/management/include/G4ParticleDefinition.icc:141-144`

```cpp
inline G4bool GetApplyCutsFlag() const;
```

**Returns:** `true` if production cuts are applied

## Comparison Operators

### operator==()
`source/particles/management/src/G4ParticleDefinition.cc:196-199`

```cpp
G4bool operator==(const G4ParticleDefinition& right) const;
```

**Returns:** `true` if particles have the same name

**Purpose:** Compare particle definitions by name

### operator!=()
`source/particles/management/src/G4ParticleDefinition.cc:201-204`

```cpp
G4bool operator!=(const G4ParticleDefinition& right) const;
```

**Returns:** `true` if particles have different names

**Example:**

```cpp
if (particle == G4Electron::Definition()) {
    G4cout << "This is an electron" << G4endl;
}
```

## Usage Examples

### Accessing Particle Properties

```cpp
// Get electron definition
G4ParticleDefinition* electron = G4Electron::Definition();

// Access basic properties
G4String name = electron->GetParticleName();      // "e-"
G4double mass = electron->GetPDGMass();           // 0.511 MeV
G4double charge = electron->GetPDGCharge();       // -1 e
G4int pdgCode = electron->GetPDGEncoding();       // 11

// Check particle classification
G4String type = electron->GetParticleType();      // "lepton"
G4int leptonNumber = electron->GetLeptonNumber(); // 1
G4bool stable = electron->GetPDGStable();         // true

// Print complete information
electron->DumpTable();
```

### Working with Decay Tables

```cpp
// Access existing decay table
G4ParticleDefinition* muon = G4MuonMinus::Definition();
G4DecayTable* decayTable = muon->GetDecayTable();

if (decayTable) {
    G4int nChannels = decayTable->entries();
    G4cout << "Muon has " << nChannels << " decay channels" << G4endl;

    for (G4int i = 0; i < nChannels; ++i) {
        G4VDecayChannel* channel = decayTable->GetDecayChannel(i);
        G4double br = channel->GetBR();
        G4cout << "Channel " << i << " BR: " << br << G4endl;
    }
}

// Create custom decay table for new particle
G4DecayTable* myDecayTable = new G4DecayTable();

// Add decay channel: A -> B + C
G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
    "myParticle",      // parent name
    0.6,               // branching ratio
    2,                 // number of daughters
    "e-", "nu_e"       // daughter names
);
myDecayTable->Insert(channel);

// Set decay table
myParticle->SetDecayTable(myDecayTable);
```

### Working with Process Managers

```cpp
// Access process manager
G4ProcessManager* pManager = G4Gamma::Definition()->GetProcessManager();

if (pManager) {
    // Get process list
    G4ProcessVector* processes = pManager->GetProcessList();

    G4cout << "Photon processes:" << G4endl;
    for (G4int i = 0; i < processes->size(); ++i) {
        G4VProcess* process = (*processes)[i];
        G4cout << "  " << process->GetProcessName() << G4endl;
    }
}

// In physics list: set up electron processes
void MyPhysicsList::ConstructEM()
{
    G4ParticleDefinition* electron = G4Electron::Definition();
    G4ProcessManager* pManager = electron->GetProcessManager();

    // Multiple scattering
    pManager->AddProcess(new G4eMultipleScattering, -1, 1, 1);

    // Ionization
    pManager->AddProcess(new G4eIonisation, -1, 2, 2);

    // Bremsstrahlung
    pManager->AddProcess(new G4eBremsstrahlung, -1, 3, 3);

    // Coulomb scattering
    pManager->AddProcess(new G4eCoulombScattering, -1, -1, 4);
}
```

### Working with Ions

```cpp
// Get ion definition
G4IonTable* ionTable = G4IonTable::GetIonTable();
G4ParticleDefinition* carbon12 = ionTable->GetIon(6, 12);  // Z=6, A=12

if (carbon12) {
    // Check if it's an ion
    if (carbon12->IsGeneralIon()) {
        G4int Z = carbon12->GetAtomicNumber();      // 6
        G4int A = carbon12->GetAtomicMass();        // 12
        G4double mass = carbon12->GetPDGMass();
        G4double charge = carbon12->GetPDGCharge(); // 6 e

        G4cout << "Ion: Z=" << Z << ", A=" << A << G4endl;
        G4cout << "Mass: " << mass/MeV << " MeV" << G4endl;
        G4cout << "Charge: " << charge/eplus << " e" << G4endl;

        // Check stability
        G4double lifetime = carbon12->GetIonLifeTime();
        if (lifetime < 0) {
            G4cout << "Stable ion" << G4endl;
        } else {
            G4cout << "Unstable, lifetime: " << lifetime/ns << " ns" << G4endl;
        }
    }
}

// Work with hypernuclei
G4ParticleDefinition* hyperNucleus = /* ... get hypernucleus ... */;
if (hyperNucleus->IsHypernucleus()) {
    G4int nLambdas = hyperNucleus->GetNumberOfLambdasInHypernucleus();
    G4cout << "Hypernucleus contains " << nLambdas << " Lambdas" << G4endl;
}
```

### Iterating Through All Particles

```cpp
// Get particle table
G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();

// Iterate through all particles
G4ParticleTable::G4PTblDicIterator* iterator =
    particleTable->GetIterator();

iterator->reset();
while ((*iterator)()) {
    G4ParticleDefinition* particle = iterator->value();

    G4String name = particle->GetParticleName();
    G4double mass = particle->GetPDGMass();
    G4int pdgCode = particle->GetPDGEncoding();

    G4cout << "Particle: " << name
           << " (PDG: " << pdgCode << ")"
           << " Mass: " << mass/GeV << " GeV"
           << G4endl;
}
```

### Custom Particle Definition

```cpp
// Define a custom exotic particle
class MyExoticParticle : public G4ParticleDefinition
{
public:
    static MyExoticParticle* Definition()
    {
        static MyExoticParticle theInstance;
        return &theInstance;
    }

private:
    MyExoticParticle() : G4ParticleDefinition(
        "exotic_X",           // name
        1000.0*MeV,          // mass
        10.0*MeV,            // width
        0.0,                 // charge
        0,                   // spin 0
        1,                   // positive parity
        0,                   // no charge conjugation
        0,                   // isospin 0
        0,                   // isospin3 0
        0,                   // no G-parity
        "exotic",            // particle type
        0,                   // lepton number
        0,                   // baryon number
        9900001,             // PDG encoding (custom)
        false,               // not stable
        0.1*ns,              // lifetime
        nullptr,             // decay table (set later)
        false,               // not short-lived
        "X"                  // subtype
    )
    {
        // Set decay table after construction
        G4DecayTable* decayTable = new G4DecayTable();

        // Add decay mode: X -> e+ e-
        G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
            "exotic_X", 1.0, 2, "e+", "e-"
        );
        decayTable->Insert(channel);

        SetDecayTable(decayTable);
    }
};

// Usage
G4ParticleDefinition* exotic = MyExoticParticle::Definition();
exotic->DumpTable();
```

## Thread Safety

### Multi-Threading Architecture

`G4ParticleDefinition` implements thread-safety through a sub-instance manager pattern:

- **Master Thread**: Holds particle properties and master process manager
- **Worker Threads**: Each has thread-local process/tracking managers
- **Shared Data**: Particle properties (mass, charge, etc.) are shared read-only
- **Thread-Local Data**: Process and tracking managers are thread-local

### Thread-Local Storage

```cpp
// Sub-instance manager handles TLS
G4PDefManager G4ParticleDefinition::subInstanceManager;

// Access pattern (internal)
#define G4MT_pmanager \
    ((subInstanceManager.offset()[g4particleDefinitionInstanceID]).theProcessManager)
```

### Initialization Pattern

```cpp
// In master thread (physics list construction)
void MyPhysicsList::ConstructProcess()
{
    // Set up master process manager
    G4ProcessManager* pManager =
        new G4ProcessManager(G4Electron::Definition());

    // Add processes
    pManager->AddProcess(...);

    // Set on particle definition
    G4Electron::Definition()->SetProcessManager(pManager);

    // Store master pointer
    G4Electron::Definition()->SetMasterProcessManager(pManager);
}

// In worker thread
void MyPhysicsList::ConstructProcess()
{
    // Get master process manager
    G4ProcessManager* masterPM =
        G4Electron::Definition()->GetMasterProcessManager();

    // Clone for this thread
    G4ProcessManager* workerPM = new G4ProcessManager(*masterPM);

    // Set thread-local
    G4Electron::Definition()->SetProcessManager(workerPM);
}
```

### Thread Safety Guarantees

::: tip Safe Operations
- **Read-Only Access**: All getter methods are thread-safe
- **Property Access**: Mass, charge, quantum numbers can be accessed from any thread
- **Process Manager**: Each thread has independent instance
:::

::: warning Unsafe Operations
- **Modification**: Do not modify particle properties after initialization
- **Decay Table**: Set decay tables only during initialization
- **Process Manager**: Do not share process managers between threads
:::

### Best Practices

```cpp
// GOOD: Read properties from any thread
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4ParticleDefinition* particle =
        step->GetTrack()->GetDefinition();

    G4double mass = particle->GetPDGMass();      // Thread-safe
    G4int pdgCode = particle->GetPDGEncoding();  // Thread-safe
}

// BAD: Modify properties after initialization
void SomeMethod()  // WRONG - Do not do this!
{
    G4Electron::Definition()->SetPDGLifeTime(newValue);  // Not thread-safe!
}

// GOOD: Set properties during initialization only
void MyPhysicsList::ConstructParticle()
{
    // All particle properties set here, before threading starts
    G4Electron::Electron();
    G4Gamma::Gamma();
    // ...
}
```

## Performance Notes

### Memory Efficiency

- **Singleton Pattern**: One definition per particle type (not per track)
- **Shared Properties**: All tracks of same type share the definition
- **Sub-Instance Manager**: Efficient thread-local storage allocation

### Access Patterns

```cpp
// EFFICIENT: Cache particle definition
void MyClass::ProcessElectrons(const G4Track* track)
{
    // Cache definition (computed once)
    static G4ParticleDefinition* electronDef = G4Electron::Definition();

    if (track->GetDefinition() == electronDef) {
        // Fast pointer comparison
        ProcessElectron(track);
    }
}

// LESS EFFICIENT: Repeated lookups
void MyClass::ProcessElectrons(const G4Track* track)
{
    // Repeated particle table lookup (slower)
    if (track->GetDefinition()->GetParticleName() == "e-") {
        ProcessElectron(track);
    }
}
```

### Optimization Tips

1. **Cache Definitions**: Store pointers to frequently used particle definitions
2. **Use Pointer Comparison**: Compare definition pointers, not names
3. **Minimize Lookups**: Access particle table only during initialization
4. **Avoid String Operations**: Use PDG codes or pointers instead of names

## See Also

### Related Classes

- [G4ProcessManager](../processes/g4processmanager.md) - Physics process management
- [G4DecayTable](g4decaytable.md) - Particle decay channels
- [G4ParticleTable](g4particletable.md) - Global particle registry
- [G4IonTable](g4iontable.md) - Ion management
- [G4VTrackingManager](../tracking/g4vtrackingmanager.md) - Custom tracking

### Module Documentation

- [Particles Module Overview](../index.md) - Complete particles module documentation
- [Particle Types](../particle-types.md) - Standard Geant4 particles
- [Process Management](../../processes/index.md) - Physics processes

### External References

- [Particle Data Group (PDG)](https://pdg.lbl.gov/) - PDG particle codes and properties
- [Geant4 User Guide](https://geant4.web.cern.ch/docs/) - Official documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/particles/management/include/G4ParticleDefinition.hh`
- Source: `source/particles/management/src/G4ParticleDefinition.cc`
- Inline: `source/particles/management/include/G4ParticleDefinition.icc`
:::
