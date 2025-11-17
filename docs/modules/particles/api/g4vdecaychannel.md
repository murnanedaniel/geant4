# G4VDecayChannel API Documentation

## Overview

`G4VDecayChannel` is an abstract base class that describes the kinematics of particle decay. It defines the interface and common functionality for all decay channel types in Geant4. Each decay channel represents a specific decay mode with its branching ratio, parent particle, and daughter particles. Derived classes implement the `DecayIt()` method to generate decay products according to specific kinematic models (phase space, Dalitz, V-A, etc.).

The class manages particle names, branching ratios, and daughter particle information. It provides thread-safe access to particle definitions and handles mass calculations for both stable and unstable particles using Breit-Wigner distributions when appropriate.

::: tip Header File
**Location:** `source/particles/management/include/G4VDecayChannel.hh`
**Source:** `source/particles/management/src/G4VDecayChannel.cc`
:::

## Class Declaration

```cpp
class G4VDecayChannel
{
  public:
    // Constructors
    G4VDecayChannel(const G4String& aName, G4int Verbose = 1);
    G4VDecayChannel(const G4String& aName, const G4String& theParentName,
                    G4double theBR, G4int theNumberOfDaughters,
                    const G4String& theDaughterName1,
                    const G4String& theDaughterName2 = "",
                    const G4String& theDaughterName3 = "",
                    const G4String& theDaughterName4 = "",
                    const G4String& theDaughterName5 = "");

    virtual ~G4VDecayChannel();

    // Pure virtual: must be implemented by derived classes
    virtual G4DecayProducts* DecayIt(G4double parentMass = -1.0) = 0;

    // Kinematics name
    const G4String& GetKinematicsName() const;

    // Branching ratio
    G4double GetBR() const;
    void SetBR(G4double value);

    // Parent particle
    const G4String& GetParentName() const;
    G4ParticleDefinition* GetParent();
    void SetParent(const G4ParticleDefinition* particle_type);
    void SetParent(const G4String& particle_name);
    G4double GetParentMass() const;

    // Daughter particles
    G4int GetNumberOfDaughters() const;
    void SetNumberOfDaughters(G4int value);
    const G4String& GetDaughterName(G4int anIndex) const;
    G4ParticleDefinition* GetDaughter(G4int anIndex);
    void SetDaughter(G4int anIndex, const G4ParticleDefinition* particle_type);
    void SetDaughter(G4int anIndex, const G4String& particle_name);
    G4double GetDaughterMass(G4int anIndex) const;

    // Angular momentum
    G4int GetAngularMomentum();

    // Polarization
    void SetPolarization(const G4ThreeVector& polar);
    const G4ThreeVector& GetPolarization() const;

    // Mass range for dynamical mass calculation
    G4double GetRangeMass() const;
    void SetRangeMass(G4double val);
    virtual G4bool IsOKWithParentMass(G4double parentMass);

    // Verbosity control
    void SetVerboseLevel(G4int value);
    G4int GetVerboseLevel() const;

    void DumpInfo();

    // ... (additional methods below)
};
```

## Constructors and Destructor

### G4VDecayChannel() - Simple Constructor
`source/particles/management/src/G4VDecayChannel.cc:49-54`

```cpp
G4VDecayChannel(const G4String& aName, G4int Verbose = 1);
```

**Parameters:**

- `aName`: Kinematics name (e.g., "PhaseSpace", "Dalitz", "Muon")
- `Verbose`: Verbosity level (0=silent, 1=warnings, 2=verbose)

**Behavior:**

- Sets kinematics name
- Initializes particle table pointer
- No parent or daughters set (must be set later)
- Used by derived classes for custom initialization

**Example:**

```cpp
// Typically used in derived class constructors
class MyCustomDecayChannel : public G4VDecayChannel
{
public:
    MyCustomDecayChannel() : G4VDecayChannel("Custom", 1)
    {
        // Set parent and daughters
        SetParent("myParticle");
        SetNumberOfDaughters(2);
        SetDaughter(0, "e+");
        SetDaughter(1, "e-");
        SetBR(1.0);
    }
};
```

### G4VDecayChannel() - Full Constructor
`source/particles/management/src/G4VDecayChannel.cc:56-86`

```cpp
G4VDecayChannel(const G4String& aName, const G4String& theParentName,
                G4double theBR, G4int theNumberOfDaughters,
                const G4String& theDaughterName1,
                const G4String& theDaughterName2 = "",
                const G4String& theDaughterName3 = "",
                const G4String& theDaughterName4 = "",
                const G4String& theDaughterName5 = "");
```

**Parameters:**

- `aName`: Kinematics name
- `theParentName`: Parent particle name
- `theBR`: Branching ratio (0.0 to 1.0)
- `theNumberOfDaughters`: Number of daughter particles (1-5)
- `theDaughterName1-5`: Daughter particle names

**Behavior:**

- Fully initializes decay channel
- Automatically clamps BR to [0.0, 1.0] range
- Stores particle names (pointers filled lazily on first access)
- Supports up to 5 daughters (can extend via `SetDaughter()`)

**Example:**

```cpp
// Two-body decay: pi0 -> gamma gamma
G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
    "PhaseSpace",           // kinematics
    "pi0",                  // parent
    0.9884,                 // BR
    2,                      // number of daughters
    "gamma", "gamma"        // daughters
);

// Three-body decay: mu- -> e- nu_e_bar nu_mu
G4VDecayChannel* muonDecay = new G4MuonDecayChannel(
    "Muon",                 // kinematics
    "mu-",                  // parent
    1.0,                    // BR
    3,                      // daughters
    "e-", "anti_nu_e", "nu_mu"
);

// Four-body decay example
G4VDecayChannel* fourBody = new G4PhaseSpaceDecayChannel(
    "PhaseSpace",
    "parent",
    0.5,
    4,
    "e+", "e-", "gamma", "gamma"
);
```

### Copy Constructor
`source/particles/management/src/G4VDecayChannel.cc:88-117`

```cpp
G4VDecayChannel(const G4VDecayChannel& right);
```

**Behavior:**

- Copies all decay channel properties
- Creates new strings for particle names
- Resets particle definition pointers (filled on demand)
- Thread-safe mutex initialization

**Example:**

```cpp
// Copy decay channel
G4VDecayChannel* originalChannel = /* ... */;
G4VDecayChannel* copiedChannel = new G4PhaseSpaceDecayChannel(*originalChannel);
```

### Destructor
`source/particles/management/src/G4VDecayChannel.cc:154-165`

```cpp
virtual ~G4VDecayChannel();
```

**Behavior:**

- Cleans up particle name strings
- Deletes mass and width arrays
- Destroys thread-safety mutexes
- Called automatically when channel is deleted

## Kinematics Name

### GetKinematicsName()
`source/particles/management/include/G4VDecayChannel.hh:270-273`

```cpp
inline const G4String& GetKinematicsName() const;
```

**Returns:** Kinematics model name (e.g., "PhaseSpace", "Dalitz", "Muon")

**Purpose:** Identify the decay model used by this channel

**Example:**

```cpp
G4VDecayChannel* channel = decayTable->GetDecayChannel(0);
G4String kinematics = channel->GetKinematicsName();
G4cout << "Decay kinematics: " << kinematics << G4endl;
```

## Branching Ratio

### GetBR()
`source/particles/management/include/G4VDecayChannel.hh:275-278`

```cpp
inline G4double GetBR() const;
```

**Returns:** Branching ratio (0.0 to 1.0)

**Example:**

```cpp
G4double br = channel->GetBR();
G4cout << "Branching ratio: " << br*100 << "%" << G4endl;
```

### SetBR()
`source/particles/management/src/G4VDecayChannel.cc:538-545`

```cpp
void SetBR(G4double value);
```

**Parameters:**

- `value`: Branching ratio

**Behavior:**

- Automatically clamps to [0.0, 1.0] range
- Values < 0 set to 0.0
- Values > 1 set to 1.0

**Example:**

```cpp
channel->SetBR(0.6355);  // 63.55%

// Clamping behavior
channel->SetBR(-0.1);    // Sets to 0.0
channel->SetBR(1.5);     // Sets to 1.0
```

## Parent Particle Management

### GetParentName()
`source/particles/management/include/G4VDecayChannel.hh:248-251`

```cpp
inline const G4String& GetParentName() const;
```

**Returns:** Parent particle name

**Example:**

```cpp
G4String parentName = channel->GetParentName();
G4cout << "Parent: " << parentName << G4endl;
```

### GetParent()
`source/particles/management/include/G4VDecayChannel.hh:240-246`

```cpp
inline G4ParticleDefinition* GetParent();
```

**Returns:** Pointer to parent particle definition

**Behavior:**

- Lazily fills pointer on first call (thread-safe)
- Searches particle table by name
- Caches result for future calls

**Example:**

```cpp
G4ParticleDefinition* parent = channel->GetParent();
if (parent) {
    G4double mass = parent->GetPDGMass();
    G4cout << "Parent mass: " << mass/MeV << " MeV" << G4endl;
}
```

### GetParentMass()
`source/particles/management/include/G4VDecayChannel.hh:253-256`

```cpp
inline G4double GetParentMass() const;
```

**Returns:** Parent particle PDG mass

**Example:**

```cpp
G4double parentMass = channel->GetParentMass();
```

### SetParent() - By Pointer
`source/particles/management/src/G4VDecayChannel.cc:423-426`

```cpp
void SetParent(const G4ParticleDefinition* particle_type);
```

**Parameters:**

- `particle_type`: Pointer to particle definition

**Example:**

```cpp
channel->SetParent(G4MuonMinus::Definition());
```

### SetParent() - By Name
`source/particles/management/include/G4VDecayChannel.hh:258-263`

```cpp
inline void SetParent(const G4String& particle_name);
```

**Parameters:**

- `particle_name`: Particle name

**Example:**

```cpp
channel->SetParent("pi0");
channel->SetParent("mu-");
```

## Daughter Particle Management

### GetNumberOfDaughters()
`source/particles/management/include/G4VDecayChannel.hh:265-268`

```cpp
inline G4int GetNumberOfDaughters() const;
```

**Returns:** Number of daughter particles

**Example:**

```cpp
G4int nDaughters = channel->GetNumberOfDaughters();
G4cout << "Number of daughters: " << nDaughters << G4endl;
```

### SetNumberOfDaughters()
`source/particles/management/src/G4VDecayChannel.cc:196-208`

```cpp
void SetNumberOfDaughters(G4int size);
```

**Parameters:**

- `size`: Number of daughters (must be > 0)

**Behavior:**

- Clears existing daughters
- Allocates new array for daughter names
- Must be called before `SetDaughter()`

**Example:**

```cpp
channel->SetNumberOfDaughters(3);
channel->SetDaughter(0, "e+");
channel->SetDaughter(1, "e-");
channel->SetDaughter(2, "gamma");
```

### GetDaughterName()
`source/particles/management/include/G4VDecayChannel.hh:214-225`

```cpp
inline const G4String& GetDaughterName(G4int anIndex) const;
```

**Parameters:**

- `anIndex`: Daughter index (0 to nDaughters-1)

**Returns:** Daughter particle name, or empty string if index invalid

**Example:**

```cpp
for (G4int i = 0; i < channel->GetNumberOfDaughters(); ++i) {
    G4String daughter = channel->GetDaughterName(i);
    G4cout << "Daughter " << i << ": " << daughter << G4endl;
}
```

### GetDaughter()
`source/particles/management/include/G4VDecayChannel.hh:199-212`

```cpp
inline G4ParticleDefinition* GetDaughter(G4int anIndex);
```

**Parameters:**

- `anIndex`: Daughter index (0 to nDaughters-1)

**Returns:** Pointer to daughter particle definition, or `nullptr` if invalid

**Behavior:**

- Lazily fills particle pointers on first call (thread-safe)
- Returns `nullptr` for out-of-range indices

**Example:**

```cpp
for (G4int i = 0; i < channel->GetNumberOfDaughters(); ++i) {
    G4ParticleDefinition* daughter = channel->GetDaughter(i);
    if (daughter) {
        G4cout << "Daughter " << i << ": "
               << daughter->GetParticleName()
               << " (mass = " << daughter->GetPDGMass()/MeV << " MeV)"
               << G4endl;
    }
}
```

### GetDaughterMass()
`source/particles/management/include/G4VDecayChannel.hh:227-238`

```cpp
inline G4double GetDaughterMass(G4int anIndex) const;
```

**Parameters:**

- `anIndex`: Daughter index

**Returns:** Daughter particle PDG mass, or 0.0 if invalid index

**Example:**

```cpp
G4double mass0 = channel->GetDaughterMass(0);
G4double mass1 = channel->GetDaughterMass(1);
G4double sumMass = mass0 + mass1;
```

### SetDaughter() - By Pointer
`source/particles/management/src/G4VDecayChannel.cc:266-269`

```cpp
void SetDaughter(G4int anIndex, const G4ParticleDefinition* parent_type);
```

**Parameters:**

- `anIndex`: Daughter index
- `parent_type`: Pointer to particle definition

### SetDaughter() - By Name
`source/particles/management/src/G4VDecayChannel.cc:210-264`

```cpp
void SetDaughter(G4int anIndex, const G4String& particle_name);
```

**Parameters:**

- `anIndex`: Daughter index (0 to nDaughters-1)
- `particle_name`: Particle name

**Behavior:**

- Index must be valid (0 to nDaughters-1)
- Must call `SetNumberOfDaughters()` first
- Can only be called during construction (before multi-threading)

::: warning Construction Only
`SetDaughter()` should only be called during construction before threads are spawned. Calling it later will cause a fatal exception.
:::

**Example:**

```cpp
// Set up decay channel
channel->SetNumberOfDaughters(2);
channel->SetDaughter(0, "e+");
channel->SetDaughter(1, "e-");

// Or by pointer
channel->SetDaughter(0, G4Positron::Definition());
channel->SetDaughter(1, G4Electron::Definition());
```

## Decay Execution

### DecayIt()
`source/particles/management/include/G4VDecayChannel.hh:69`

```cpp
virtual G4DecayProducts* DecayIt(G4double parentMass = -1.0) = 0;
```

**Parameters:**

- `parentMass`: Parent particle mass (default: -1, uses PDG mass)

**Returns:** Pointer to `G4DecayProducts` containing decay products

**Purpose:** Pure virtual method that performs the decay

**Behavior:**

- Must be implemented by derived classes
- Generates decay products with proper kinematics
- Caller must delete returned `G4DecayProducts`
- If `parentMass < 0`, uses PDG mass of parent

::: warning Memory Management
The caller is responsible for deleting the returned `G4DecayProducts` object to avoid memory leaks.
:::

**Example:**

```cpp
// Perform decay with PDG mass
G4DecayProducts* products = channel->DecayIt();
if (products) {
    // Process decay products
    for (G4int i = 0; i < products->entries(); ++i) {
        G4DynamicParticle* daughter = (*products)[i];
        // ... use daughter
    }
    delete products;  // Clean up
}

// Perform decay with specific mass (e.g., from Breit-Wigner)
G4double dynamicalMass = 770.0*MeV;
G4DecayProducts* products = channel->DecayIt(dynamicalMass);
// ... process and delete
```

## Angular Momentum

### GetAngularMomentum()
`source/particles/management/src/G4VDecayChannel.cc:428-482`

```cpp
G4int GetAngularMomentum();
```

**Returns:** Orbital angular momentum quantum number L

**Behavior:**

- Calculates angular momentum from conservation laws
- Uses spin and parity of parent and daughters
- Only works for two-body decays
- Returns 0 for three-body or more
- Checks all possible L values consistent with spin coupling
- Returns first L that conserves parity

**Physics:**

For two-body decay: Parent → Daughter1 + Daughter2

1. Spin coupling: |J1 - J2| ≤ J ≤ J1 + J2
2. Parity: P_parent = (-1)^L × P_daughter1 × P_daughter2

**Example:**

```cpp
G4int L = channel->GetAngularMomentum();
G4cout << "Orbital angular momentum L = " << L << G4endl;

// Example: pi0 -> gamma gamma
// pi0: J=0, P=(-1)
// gamma: J=1, P=(-1)
// Spin coupling: J must be 0, 1, or 2
// For J=0, L can be 0 or 1
// Parity: (-1) = (-1)^L × (-1) × (-1)
// (-1) = (-1)^L  => L must be odd => L=1
```

::: tip Applicability
Angular momentum calculation is only implemented for two-body decays. Three-body and higher decays return 0 with a warning.
:::

## Polarization

### SetPolarization()
`source/particles/management/include/G4VDecayChannel.hh:300-303`

```cpp
inline void SetPolarization(const G4ThreeVector& polar);
```

**Parameters:**

- `polar`: Polarization vector

**Purpose:** Set parent particle polarization for polarized decays

**Example:**

```cpp
// Set polarization along z-axis
G4ThreeVector polarization(0, 0, 1);
channel->SetPolarization(polarization);

// Polarization affects decay angular distributions in some channels
// (e.g., G4MuonDecayChannelWithSpin)
```

### GetPolarization()
`source/particles/management/include/G4VDecayChannel.hh:305-308`

```cpp
inline const G4ThreeVector& GetPolarization() const;
```

**Returns:** Parent particle polarization vector

**Example:**

```cpp
G4ThreeVector pol = channel->GetPolarization();
G4cout << "Polarization: (" << pol.x() << ", "
       << pol.y() << ", " << pol.z() << ")" << G4endl;
```

## Mass Range and Kinematics

### GetRangeMass()
`source/particles/management/include/G4VDecayChannel.hh:290-293`

```cpp
inline G4double GetRangeMass() const;
```

**Returns:** Mass range parameter (default: 2.5)

**Purpose:** Controls allowed mass deviation in units of particle width

### SetRangeMass()
`source/particles/management/include/G4VDecayChannel.hh:295-298`

```cpp
inline void SetRangeMass(G4double val);
```

**Parameters:**

- `val`: Range in units of width (must be ≥ 0)

**Purpose:** Set mass range for dynamical mass generation

**Example:**

```cpp
// Allow masses within ±2.5 widths of PDG mass
channel->SetRangeMass(2.5);

// Stricter range: ±1 width
channel->SetRangeMass(1.0);
```

### IsOKWithParentMass()
`source/particles/management/src/G4VDecayChannel.cc:524-536`

```cpp
virtual G4bool IsOKWithParentMass(G4double parentMass);
```

**Parameters:**

- `parentMass`: Parent particle mass

**Returns:** `true` if decay is kinematically allowed

**Behavior:**

- Checks if parent mass ≥ sum of daughter masses
- Accounts for particle widths (allows lower masses by rangeMass × width)
- Always returns `true` for one-body decays
- Virtual: can be overridden in derived classes

**Example:**

```cpp
G4double testMass = 500.0*MeV;
if (channel->IsOKWithParentMass(testMass)) {
    G4cout << "Decay is kinematically allowed" << G4endl;
    G4DecayProducts* products = channel->DecayIt(testMass);
    // ... process
    delete products;
} else {
    G4cout << "Mass too low for this decay" << G4endl;
}
```

## Dynamical Mass Generation

### DynamicalMass() (Protected)
`source/particles/management/src/G4VDecayChannel.cc:504-522`

```cpp
G4double DynamicalMass(G4double massPDG, G4double width,
                       G4double maxDev = 1.0) const;
```

**Parameters:**

- `massPDG`: PDG mass
- `width`: Particle width
- `maxDev`: Maximum deviation in units of width

**Returns:** Randomly sampled mass from Breit-Wigner distribution

**Purpose:** Generate particle masses for unstable particles

**Physics:**

Samples from relativistic Breit-Wigner distribution:
```
dN/dm ∝ m² × Γ² / [(m² - M²)² + M²Γ²]
```

**Example:**

```cpp
// Used internally in DecayIt() implementations
G4double dynamicalMass = DynamicalMass(
    massPDG,     // PDG mass
    width,       // particle width
    2.5          // allow ±2.5 widths
);
```

## Verbosity Control

### SetVerboseLevel()
`source/particles/management/include/G4VDecayChannel.hh:280-283`

```cpp
inline void SetVerboseLevel(G4int value);
```

**Parameters:**

- `value`: Verbosity level
  - 0: Silent
  - 1: Warnings only
  - 2: Verbose output

**Example:**

```cpp
channel->SetVerboseLevel(2);  // Enable detailed output
```

### GetVerboseLevel()
`source/particles/management/include/G4VDecayChannel.hh:285-288`

```cpp
inline G4int GetVerboseLevel() const;
```

**Returns:** Current verbosity level

### DumpInfo()
`source/particles/management/src/G4VDecayChannel.cc:484-497`

```cpp
void DumpInfo();
```

**Purpose:** Print decay channel information to `G4cout`

**Output:**

- Branching ratio
- Kinematics name
- Daughter particle names

**Example:**

```cpp
channel->DumpInfo();
```

**Sample Output:**

```
 BR:  0.9884  [PhaseSpace]   :   gamma gamma
```

## Derived Decay Channel Classes

Geant4 provides numerous specialized decay channel implementations:

### G4PhaseSpaceDecayChannel

Generic N-body phase space decay using Raubold-Lynch algorithm.

**Use Cases:**
- Any decay where specific matrix element is unknown
- Simple multi-body decays
- Default choice for most decays

**Example:**

```cpp
// Two-body phase space: K+ -> mu+ nu_mu
G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
    "kaon+", 0.6355, 2, "mu+", "nu_mu"
);

// Three-body phase space: K+ -> pi+ pi+ pi-
G4VDecayChannel* threebody = new G4PhaseSpaceDecayChannel(
    "kaon+", 0.0559, 3, "pi+", "pi+", "pi-"
);
```

### G4DalitzDecayChannel

Dalitz decay: Meson → lepton+ + lepton- + photon

**Physics:**
- Internal conversion of virtual photon to lepton pair
- Accounts for proper QED matrix element
- Common for neutral meson decays

**Example:**

```cpp
// pi0 -> e+ e- gamma (Dalitz decay)
G4VDecayChannel* dalitz = new G4DalitzDecayChannel(
    "pi0", 0.0116, "e+", "e-", "gamma"
);

// eta -> e+ e- gamma
G4VDecayChannel* etaDalitz = new G4DalitzDecayChannel(
    "eta", 0.0069, "e+", "e-", "gamma"
);
```

### G4MuonDecayChannel

Muon decay with V-A weak interaction.

**Physics:**
- Michel spectrum for electron energy
- Proper treatment of V-A interaction
- No polarization effects

**Example:**

```cpp
// mu- -> e- nu_e_bar nu_mu
G4VDecayChannel* muonDecay = new G4MuonDecayChannel(
    "mu-", 1.0  // BR = 100%
);
```

### G4MuonDecayChannelWithSpin

Polarized muon decay including spin effects.

**Physics:**
- Includes muon polarization in angular distribution
- Proper handling of electron helicity
- Important for muon spin experiments

**Example:**

```cpp
G4VDecayChannel* polarizedMuon = new G4MuonDecayChannelWithSpin(
    "mu-", 1.0
);

// Set muon polarization
G4ThreeVector polarization(0, 0, 1);  // 100% polarized along z
polarizedMuon->SetPolarization(polarization);
```

### G4MuonRadiativeDecayChannelWithSpin

Radiative muon decay: μ → e + ν_e + ν_μ + γ

**Physics:**
- Includes radiative corrections
- Accounts for photon emission
- Polarization effects included

### G4TauLeptonicDecayChannel

Tau leptonic decays with proper V-A treatment.

**Example:**

```cpp
// tau- -> e- nu_e_bar nu_tau
G4VDecayChannel* tauElectronic = new G4TauLeptonicDecayChannel(
    "tau-", 0.1782, "e-"
);

// tau- -> mu- nu_mu_bar nu_tau
G4VDecayChannel* tauMuonic = new G4TauLeptonicDecayChannel(
    "tau-", 0.1739, "mu-"
);
```

### G4KL3DecayChannel

Kaon semi-leptonic three-body decay (K_l3).

**Physics:**
- K → π + l + ν
- Proper form factor treatment
- Separate for K_e3 and K_μ3

**Example:**

```cpp
// K+ -> pi0 e+ nu_e (K_e3)
G4VDecayChannel* ke3 = new G4KL3DecayChannel(
    "kaon+", 0.0507, "pi0", "e+", "nu_e"
);

// K+ -> pi0 mu+ nu_mu (K_mu3)
G4VDecayChannel* kmu3 = new G4KL3DecayChannel(
    "kaon+", 0.0335, "pi0", "mu+", "nu_mu"
);
```

### G4NeutronBetaDecayChannel

Free neutron beta decay.

**Physics:**
- n → p + e- + ν_e_bar
- Proper Fermi theory treatment
- Lifetime = 880.2 s

**Example:**

```cpp
G4VDecayChannel* neutronDecay = new G4NeutronBetaDecayChannel(
    "neutron", 1.0  // BR = 100% for free neutron
);
```

### G4PionRadiativeDecayChannel

Radiative pion decay: π → l + ν + γ

**Example:**

```cpp
// pi+ -> mu+ nu_mu gamma
G4VDecayChannel* pionRadiative = new G4PionRadiativeDecayChannel(
    "pi+", 0.000002, "mu+", "nu_mu"
);
```

## Usage Examples

### Creating Custom Decay Channel

```cpp
// Custom decay channel class
class MyTwoBodyDecay : public G4VDecayChannel
{
public:
    MyTwoBodyDecay(const G4String& parentName, G4double BR,
                   const G4String& daughter1, const G4String& daughter2)
        : G4VDecayChannel("MyTwoBody", parentName, BR, 2,
                         daughter1, daughter2)
    {
    }

    virtual G4DecayProducts* DecayIt(G4double parentMass = -1.0)
    {
        // Get parent mass
        if (parentMass < 0.0) parentMass = GetParentMass();

        // Create decay products
        G4DecayProducts* products = new G4DecayProducts(
            *GetParent()
        );

        // Get daughter masses
        G4double m1 = GetDaughterMass(0);
        G4double m2 = GetDaughterMass(1);

        // Check kinematics
        if (parentMass < m1 + m2) {
            delete products;
            return nullptr;
        }

        // Two-body decay kinematics in parent rest frame
        G4double E1 = (parentMass*parentMass + m1*m1 - m2*m2) /
                     (2.0 * parentMass);
        G4double E2 = parentMass - E1;
        G4double p = std::sqrt(E1*E1 - m1*m1);

        // Random direction (isotropic)
        G4double costheta = 2.0*G4UniformRand() - 1.0;
        G4double sintheta = std::sqrt(1.0 - costheta*costheta);
        G4double phi = twopi * G4UniformRand();

        G4ThreeVector direction(
            sintheta * std::cos(phi),
            sintheta * std::sin(phi),
            costheta
        );

        // Create daughter particles
        G4DynamicParticle* daughter1 = new G4DynamicParticle(
            GetDaughter(0),
            direction * p
        );

        G4DynamicParticle* daughter2 = new G4DynamicParticle(
            GetDaughter(1),
            -direction * p
        );

        products->PushProducts(daughter1);
        products->PushProducts(daughter2);

        return products;
    }
};

// Usage
G4VDecayChannel* channel = new MyTwoBodyDecay(
    "myParticle", 1.0, "e+", "e-"
);
```

### Phase Space Decay

```cpp
// Three-body phase space decay
void ThreeBodyDecayExample()
{
    // Create decay channel: tau- -> pi- pi+ pi-
    G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
        "tau-",     // parent
        0.0926,     // branching ratio
        3,          // three daughters
        "pi-", "pi+", "pi-"
    );

    // Perform decay
    G4DecayProducts* products = channel->DecayIt();

    if (products) {
        G4cout << "Tau decay products:" << G4endl;

        // Get parent momentum
        G4LorentzVector parentMomentum = products->Get4Momentum();

        // Iterate through daughters
        for (G4int i = 0; i < products->entries(); ++i) {
            G4DynamicParticle* daughter = (*products)[i];

            G4cout << "  Daughter " << i << ": "
                   << daughter->GetDefinition()->GetParticleName()
                   << G4endl;
            G4cout << "    Energy: "
                   << daughter->GetTotalEnergy()/MeV << " MeV"
                   << G4endl;
            G4cout << "    Momentum: "
                   << daughter->GetTotalMomentum()/MeV << " MeV/c"
                   << G4endl;
        }

        // Check 4-momentum conservation
        G4LorentzVector sumP(0, 0, 0, 0);
        for (G4int i = 0; i < products->entries(); ++i) {
            sumP += (*products)[i]->Get4Momentum();
        }

        G4double deltaE = (sumP - parentMomentum).e();
        G4cout << "Energy conservation: dE = "
               << deltaE/keV << " keV" << G4endl;

        delete products;
    }
}
```

### Two-Body Decay Kinematics

```cpp
// Calculate two-body decay kinematics
void TwoBodyKinematics()
{
    // Example: pi0 -> gamma gamma
    G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
        "pi0", 0.9884, 2, "gamma", "gamma"
    );

    // Get masses
    G4double M = channel->GetParentMass();
    G4double m1 = channel->GetDaughterMass(0);
    G4double m2 = channel->GetDaughterMass(1);

    // For massless daughters (photons): E1 = E2 = M/2
    G4cout << "Pi0 decay:" << G4endl;
    G4cout << "  Parent mass: " << M/MeV << " MeV" << G4endl;
    G4cout << "  Each photon energy: " << M/2.0/MeV << " MeV" << G4endl;
    G4cout << "  Each photon momentum: " << M/2.0/MeV << " MeV/c" << G4endl;

    // Perform actual decay
    G4DecayProducts* products = channel->DecayIt();
    if (products) {
        G4DynamicParticle* gamma1 = (*products)[0];
        G4DynamicParticle* gamma2 = (*products)[1];

        G4cout << "  Actual decay:" << G4endl;
        G4cout << "    Gamma 1 energy: "
               << gamma1->GetTotalEnergy()/MeV << " MeV" << G4endl;
        G4cout << "    Gamma 2 energy: "
               << gamma2->GetTotalEnergy()/MeV << " MeV" << G4endl;

        // Check momentum conservation
        G4ThreeVector p1 = gamma1->GetMomentum();
        G4ThreeVector p2 = gamma2->GetMomentum();
        G4ThreeVector pSum = p1 + p2;

        G4cout << "    Momentum sum: " << pSum.mag()/keV << " keV/c"
               << " (should be ~0)" << G4endl;

        delete products;
    }
}
```

### Analyzing Decay Angular Distributions

```cpp
// Study decay angular distribution
void AngularDistribution()
{
    G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
        "pi0", 1.0, 2, "gamma", "gamma"
    );

    // Histograms for angular distribution
    const G4int nBins = 20;
    std::vector<G4int> cosTheta(nBins, 0);

    // Generate many decays
    const G4int nEvents = 10000;
    for (G4int i = 0; i < nEvents; ++i) {
        G4DecayProducts* products = channel->DecayIt();

        if (products) {
            // Get first daughter momentum
            G4ThreeVector p = (*products)[0]->GetMomentum();

            // Calculate cos(theta) in parent rest frame
            G4double ct = p.cosTheta();

            // Fill histogram
            G4int bin = G4int((ct + 1.0) / 2.0 * nBins);
            if (bin >= 0 && bin < nBins) {
                cosTheta[bin]++;
            }

            delete products;
        }
    }

    // Print distribution (should be uniform for phase space)
    G4cout << "Angular distribution (phase space decay):" << G4endl;
    for (G4int i = 0; i < nBins; ++i) {
        G4double ctMin = -1.0 + 2.0 * i / nBins;
        G4double ctMax = -1.0 + 2.0 * (i+1) / nBins;
        G4cout << "  " << ctMin << " < cos(theta) < " << ctMax
               << ": " << cosTheta[i] << " events" << G4endl;
    }
}
```

### Dynamical Mass Effects

```cpp
// Demonstrate dynamical mass effects for unstable particles
void DynamicalMassExample()
{
    // Example with rho meson (large width)
    // rho0: mass = 775.26 MeV, width = 147.8 MeV

    G4ParticleDefinition* rho0 = /* get rho0 definition */;
    G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
        "rho0", 1.0, 2, "pi+", "pi-"
    );

    // Sample many decays with Breit-Wigner distributed masses
    std::vector<G4double> masses;

    for (G4int i = 0; i < 10000; ++i) {
        // Generate dynamical mass (simplified - normally done in DecayIt)
        G4double mass = channel->GetParentMass();  // PDG mass
        G4double width = rho0->GetPDGWidth();

        // Sample from Breit-Wigner (simplified)
        G4double deviation = G4RandGauss::shoot(0, width);
        G4double dynamicalMass = mass + deviation;

        // Check if decay is allowed
        if (channel->IsOKWithParentMass(dynamicalMass)) {
            masses.push_back(dynamicalMass);
        }
    }

    // Analyze mass distribution
    G4double meanMass = 0.0;
    for (G4double m : masses) {
        meanMass += m;
    }
    meanMass /= masses.size();

    G4cout << "Rho0 mass distribution:" << G4endl;
    G4cout << "  PDG mass: " << channel->GetParentMass()/MeV << " MeV" << G4endl;
    G4cout << "  Mean sampled mass: " << meanMass/MeV << " MeV" << G4endl;
    G4cout << "  Width: " << rho0->GetPDGWidth()/MeV << " MeV" << G4endl;
}
```

## Thread Safety

### Thread-Safe Operations

::: tip Safe Operations
- **Read Access**: All getter methods are thread-safe
- **Decay Execution**: `DecayIt()` can be called from multiple threads
- **Particle Definition Access**: Thread-safe lazy initialization with mutexes
:::

### Lazy Initialization

```cpp
// Thread-safe particle definition access
G4ParticleDefinition* G4VDecayChannel::GetParent()
{
    // Automatic thread-safe lazy initialization
    CheckAndFillParent();  // Uses mutex internally
    return G4MT_parent;
}

G4ParticleDefinition* G4VDecayChannel::GetDaughter(G4int index)
{
    // Thread-safe daughter access
    CheckAndFillDaughters();  // Uses mutex internally
    return G4MT_daughters[index];
}
```

### Multi-Threading Pattern

```cpp
// Master thread: create decay channels
void MyPhysicsList::ConstructProcess()
{
    G4DecayTable* decayTable = new G4DecayTable();

    // Create decay channels (master thread only)
    G4VDecayChannel* channel = new G4PhaseSpaceDecayChannel(
        "myParticle", 1.0, 2, "e+", "e-"
    );
    decayTable->Insert(channel);

    myParticle->SetDecayTable(decayTable);
}

// Worker threads: use decay channels
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();
    G4ParticleDefinition* particle = track->GetDefinition();

    // Thread-safe access to decay table
    G4DecayTable* decayTable = particle->GetDecayTable();

    if (decayTable) {
        // Thread-safe: each thread has independent random stream
        G4VDecayChannel* channel = decayTable->SelectADecayChannel();

        if (channel) {
            // Thread-safe: creates new G4DecayProducts
            G4DecayProducts* products = channel->DecayIt();

            // Process products...
            delete products;  // Clean up
        }
    }
}
```

::: warning Unsafe Operations
- **Modification**: Never modify decay channels after initialization
- **SetParent/SetDaughter**: Only during construction
- **SetBR**: Only during initialization
:::

## Performance Notes

### Lazy Initialization Overhead

```cpp
// First call per thread: fills particle definitions (slow)
G4ParticleDefinition* parent = channel->GetParent();

// Subsequent calls: cached pointer access (fast)
G4ParticleDefinition* parent2 = channel->GetParent();
```

### Optimization Tips

1. **Cache Channel Pointers**: Don't repeatedly look up decay channels
2. **Reuse DecayProducts**: Generate once per decay, not per access
3. **Minimize Daughter Access**: Cache daughter masses if used repeatedly
4. **Pre-fill Definitions**: Call `GetParent()` and `GetDaughter()` during initialization

```cpp
// EFFICIENT: Cache channel and daughters
G4VDecayChannel* channel = decayTable->GetDecayChannel(0);
G4int nDaughters = channel->GetNumberOfDaughters();

// Pre-cache daughters (done once)
for (G4int i = 0; i < nDaughters; ++i) {
    G4ParticleDefinition* daughter = channel->GetDaughter(i);
}

// Now DecayIt() is faster (no lazy initialization overhead)
G4DecayProducts* products = channel->DecayIt();

// LESS EFFICIENT: Repeated lookups
for (G4int event = 0; event < 1000000; ++event) {
    G4VDecayChannel* ch = decayTable->GetDecayChannel(0);  // Repeated lookup
    G4DecayProducts* p = ch->DecayIt();
    delete p;
}
```

## See Also

### Related Classes

- [G4DecayTable](g4decaytable.md) - Decay channel container and selection
- [G4ParticleDefinition](g4particledefinition.md) - Particle properties
- [G4DecayProducts](../decay/g4decayproducts.md) - Decay product container
- [G4DynamicParticle](g4dynamicparticle.md) - Particle with kinematics

### Derived Decay Channels

- `G4PhaseSpaceDecayChannel` - Generic N-body phase space
- `G4DalitzDecayChannel` - Dalitz decays (meson → l+ l- γ)
- `G4MuonDecayChannel` - Muon V-A decay
- `G4MuonDecayChannelWithSpin` - Polarized muon decay
- `G4MuonRadiativeDecayChannelWithSpin` - Radiative muon decay
- `G4TauLeptonicDecayChannel` - Tau leptonic decays
- `G4KL3DecayChannel` - Kaon semi-leptonic decays
- `G4NeutronBetaDecayChannel` - Neutron beta decay
- `G4PionRadiativeDecayChannel` - Pion radiative decay

### Module Documentation

- [Particles Module Overview](../index.md) - Complete particles module
- [Decay Processes](../../processes/decay.md) - Decay process management

---

::: info Source Reference
Complete implementation in:
- Header: `source/particles/management/include/G4VDecayChannel.hh`
- Source: `source/particles/management/src/G4VDecayChannel.cc`
:::
