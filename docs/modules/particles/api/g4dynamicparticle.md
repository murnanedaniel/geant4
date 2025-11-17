# G4DynamicParticle API Documentation

## Overview

`G4DynamicParticle` is the fundamental container class for dynamic particle properties in Geant4. It aggregates all information needed to describe the dynamics of a moving particle, including momentum, energy, polarization, and proper time. This class contains the purely dynamic aspects of a particle (properties that change during tracking), while referencing a `G4ParticleDefinition` for static properties (mass, charge, etc.). Each tracked particle in a Geant4 simulation has an associated `G4DynamicParticle` object that describes its current state.

::: tip Header File
**Location:** `source/particles/management/include/G4DynamicParticle.hh`
**Source:** `source/particles/management/src/G4DynamicParticle.cc`
**Inline:** `source/particles/management/include/G4DynamicParticle.icc`
:::

## Class Declaration

```cpp
class G4DynamicParticle
{
  public:
    // Constructors
    G4DynamicParticle();

    G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                      const G4ThreeVector& aMomentumDirection,
                      G4double aKineticEnergy);

    G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                      const G4ThreeVector& aParticleMomentum);

    G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                      const G4LorentzVector& aParticleMomentum);

    G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                      G4double aTotalEnergy,
                      const G4ThreeVector& aParticleMomentum);

    G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                      const G4ThreeVector& aMomentumDirection,
                      G4double aKineticEnergy,
                      const G4double dynamicalMass);

    G4DynamicParticle(const G4DynamicParticle& right);
    G4DynamicParticle(G4DynamicParticle&& from);

    ~G4DynamicParticle();

    // Assignment operators
    G4DynamicParticle& operator=(const G4DynamicParticle& right);
    G4DynamicParticle& operator=(G4DynamicParticle&& from);

    // Comparison operators
    G4bool operator==(const G4DynamicParticle& right) const;
    G4bool operator!=(const G4DynamicParticle& right) const;

    // Custom allocator
    void* operator new(size_t);
    void operator delete(void* aDynamicParticle);

    // ... (methods detailed below)
};
```

## Constructors

### Default Constructor
`source/particles/management/src/G4DynamicParticle.cc:54-56`

```cpp
G4DynamicParticle();
```

**Purpose:** Creates an uninitialized dynamic particle

**Initial State:**
- Momentum direction: (0, 0, 1)
- Polarization: (0, 0, 0)
- All other members initialized to default values

**Example:**

```cpp
// Create empty particle (rarely used directly)
G4DynamicParticle* particle = new G4DynamicParticle();
// Must call SetDefinition() before use
particle->SetDefinition(G4Electron::Definition());
particle->SetKineticEnergy(100.0*MeV);
particle->SetMomentumDirection(G4ThreeVector(0, 0, 1));
```

::: warning Incomplete State
The default constructor creates a particle without a definition. You must call `SetDefinition()` before using the particle.
:::

### Constructor with Direction and Kinetic Energy
`source/particles/management/src/G4DynamicParticle.cc:58-69`

```cpp
G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                  const G4ThreeVector& aMomentumDirection,
                  G4double aKineticEnergy);
```

**Parameters:**
- `aParticleDefinition`: Pointer to particle definition (e.g., `G4Electron::Definition()`)
- `aMomentumDirection`: Normalized momentum direction vector
- `aKineticEnergy`: Kinetic energy in Geant4 default energy units

**Behavior:**
- Sets dynamical mass to PDG mass
- Sets dynamical charge to PDG charge
- Sets dynamical spin to PDG spin
- Sets dynamical magnetic moment to PDG magnetic moment
- Polarization initialized to (0, 0, 0)

**Example:**

```cpp
// Create electron with 100 MeV kinetic energy moving in +z direction
G4ThreeVector direction(0, 0, 1);
G4DynamicParticle* electron = new G4DynamicParticle(
    G4Electron::Definition(),
    direction,
    100.0*MeV
);

// Create photon at 45-degree angle
G4ThreeVector photonDir(std::cos(45*deg), 0, std::sin(45*deg));
photonDir = photonDir.unit();
G4DynamicParticle* photon = new G4DynamicParticle(
    G4Gamma::Definition(),
    photonDir,
    511.0*keV
);
```

::: tip Most Common Constructor
This is the most frequently used constructor for creating particles with known kinetic energy and direction.
:::

### Constructor with Momentum Vector
`source/particles/management/src/G4DynamicParticle.cc:91-101`

```cpp
G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                  const G4ThreeVector& aParticleMomentum);
```

**Parameters:**
- `aParticleDefinition`: Pointer to particle definition
- `aParticleMomentum`: 3-momentum vector in Geant4 default units

**Behavior:**
- Calculates kinetic energy from momentum magnitude
- Extracts momentum direction from vector
- Uses particle's PDG mass for calculation

**Example:**

```cpp
// Create proton with momentum (100, 50, 200) MeV/c
G4ThreeVector momentum(100.0*MeV, 50.0*MeV, 200.0*MeV);
G4DynamicParticle* proton = new G4DynamicParticle(
    G4Proton::Definition(),
    momentum
);

// Kinetic energy is automatically calculated
G4double energy = proton->GetKineticEnergy();
G4cout << "Proton kinetic energy: " << energy/MeV << " MeV" << G4endl;
```

### Constructor with Lorentz 4-Momentum
`source/particles/management/src/G4DynamicParticle.cc:103-113`

```cpp
G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                  const G4LorentzVector& aParticleMomentum);
```

**Parameters:**
- `aParticleDefinition`: Pointer to particle definition
- `aParticleMomentum`: 4-momentum (E, px, py, pz) Lorentz vector

**Behavior:**
- Extracts 3-momentum direction from spatial components
- Calculates mass from E² - p² (may differ from PDG mass)
- Sets dynamical mass if significantly different from PDG mass
- Sets kinetic energy from total energy and mass

**Example:**

```cpp
// Create particle from 4-momentum
G4LorentzVector p4(
    100.0*MeV,  // px
    50.0*MeV,   // py
    200.0*MeV,  // pz
    300.0*MeV   // E
);

G4DynamicParticle* particle = new G4DynamicParticle(
    G4PionPlus::Definition(),
    p4
);

// Check if mass differs from PDG value
G4double dynamicalMass = particle->GetMass();
G4double pdgMass = G4PionPlus::Definition()->GetPDGMass();
if (std::abs(dynamicalMass - pdgMass) > 0.1*MeV) {
    G4cout << "Particle has off-shell mass!" << G4endl;
}
```

::: info Energy-Momentum Consistency
This constructor allows for off-shell particles where the invariant mass E² - p² differs from the PDG mass by more than the tolerance (1 keV).
:::

### Constructor with Total Energy and Momentum
`source/particles/management/src/G4DynamicParticle.cc:115-148`

```cpp
G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                  G4double totalEnergy,
                  const G4ThreeVector& aParticleMomentum);
```

**Parameters:**
- `aParticleDefinition`: Pointer to particle definition
- `totalEnergy`: Total energy (kinetic + rest mass) in energy units
- `aParticleMomentum`: 3-momentum vector

**Behavior:**
- Calculates invariant mass from E² - p²
- If mass² < 0, treats as massless particle
- If mass differs significantly from PDG mass, sets dynamical mass
- Handles zero momentum case gracefully

**Example:**

```cpp
// Create particle with specified total energy and momentum
G4ThreeVector momentum(500.0*MeV, 0, 0);
G4double totalEnergy = 550.0*MeV;

G4DynamicParticle* muon = new G4DynamicParticle(
    G4MuonMinus::Definition(),
    totalEnergy,
    momentum
);

// Verify energy-momentum relation
G4double mass = muon->GetMass();
G4double pMag = momentum.mag();
G4double calculatedE = std::sqrt(pMag*pMag + mass*mass);
G4cout << "Total energy: " << totalEnergy/MeV << " MeV" << G4endl;
G4cout << "Calculated E: " << calculatedE/MeV << " MeV" << G4endl;
```

### Constructor with Dynamical Mass
`source/particles/management/src/G4DynamicParticle.cc:71-89`

```cpp
G4DynamicParticle(const G4ParticleDefinition* aParticleDefinition,
                  const G4ThreeVector& aMomentumDirection,
                  G4double aKineticEnergy,
                  const G4double dynamicalMass);
```

**Parameters:**
- `aParticleDefinition`: Pointer to particle definition
- `aMomentumDirection`: Normalized momentum direction
- `aKineticEnergy`: Kinetic energy
- `dynamicalMass`: Custom dynamical mass (for off-shell particles)

**Behavior:**
- Uses custom mass if it differs from PDG mass by more than 1 keV
- If custom mass < 1 keV, sets dynamical mass to 0
- Otherwise uses PDG mass

**Purpose:** Create off-shell particles or particles with effective mass

**Example:**

```cpp
// Create off-shell particle (e.g., virtual photon)
G4ThreeVector direction(0, 0, 1);
G4double kineticEnergy = 100.0*MeV;
G4double effectiveMass = 50.0*MeV;  // Virtual particle

G4DynamicParticle* virtualPhoton = new G4DynamicParticle(
    G4Gamma::Definition(),
    direction,
    kineticEnergy,
    effectiveMass
);

G4cout << "Virtual photon mass: " << virtualPhoton->GetMass()/MeV
       << " MeV" << G4endl;
```

### Copy Constructor
`source/particles/management/src/G4DynamicParticle.cc:150-171`

```cpp
G4DynamicParticle(const G4DynamicParticle& right);
```

**Purpose:** Creates a deep copy of a dynamic particle

**Behavior:**
- Copies all kinematic properties
- Deep copies electron occupancy if present
- Does NOT copy pre-assigned decay products
- Preserves primary particle link
- Copies cached values (beta, log kinetic energy)

**Example:**

```cpp
// Create original particle
G4DynamicParticle* original = new G4DynamicParticle(
    G4Electron::Definition(),
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);
original->SetPolarization(G4ThreeVector(1, 0, 0));

// Copy constructor
G4DynamicParticle* copy = new G4DynamicParticle(*original);

// Copy has same properties
G4cout << "Original energy: " << original->GetKineticEnergy()/MeV << " MeV" << G4endl;
G4cout << "Copy energy: " << copy->GetKineticEnergy()/MeV << " MeV" << G4endl;
```

::: warning Pre-Assigned Decay Products Not Copied
The copy constructor intentionally does not copy pre-assigned decay products to avoid ownership issues.
:::

### Move Constructor
`source/particles/management/src/G4DynamicParticle.cc:173-197`

```cpp
G4DynamicParticle(G4DynamicParticle&& from);
```

**Purpose:** Move constructor for efficient resource transfer (C++11)

**Behavior:**
- Transfers ownership of electron occupancy
- Does NOT move pre-assigned decay products
- Transfers primary particle link
- Nullifies source object pointers

**Example:**

```cpp
// Create particle in temporary
G4DynamicParticle CreateParticle() {
    G4DynamicParticle temp(
        G4Electron::Definition(),
        G4ThreeVector(0, 0, 1),
        100.0*MeV
    );
    return temp;  // Move constructor called
}

// Efficient return without copying
G4DynamicParticle particle = CreateParticle();
```

### Destructor
`source/particles/management/src/G4DynamicParticle.cc:199-206`

```cpp
~G4DynamicParticle();
```

**Behavior:**
- Deletes pre-assigned decay products if present
- Deletes electron occupancy if present
- Nullifies pointers

**Example:**

```cpp
// Automatic cleanup
{
    G4DynamicParticle* particle = new G4DynamicParticle(/*...*/);
    // ... use particle ...
    delete particle;  // Destructor called, resources freed
}
```

## Memory Management

### Custom Allocator
`source/particles/management/include/G4DynamicParticle.icc:37-48`

`G4DynamicParticle` uses a custom allocator (`G4Allocator`) for efficient memory management. This is particularly important since many dynamic particles are created and destroyed during simulation.

#### operator new
`source/particles/management/include/G4DynamicParticle.icc:37-43`

```cpp
inline void* operator new(size_t);
```

**Purpose:** Allocate memory from pre-allocated memory pool

**Behavior:**
- Thread-local allocator created on first use
- Uses `G4Allocator` for efficient allocation
- Faster than standard `new` for many allocations

#### operator delete
`source/particles/management/include/G4DynamicParticle.icc:45-48`

```cpp
inline void operator delete(void* aDynamicParticle);
```

**Purpose:** Return memory to the allocator pool

**Behavior:**
- Memory returned to pool, not to system
- Can be reused for subsequent allocations
- Reduces memory fragmentation

**Example:**

```cpp
// These allocations use the custom allocator
for (G4int i = 0; i < 10000; ++i) {
    G4DynamicParticle* particle = new G4DynamicParticle(
        G4Electron::Definition(),
        G4ThreeVector(0, 0, 1),
        100.0*MeV
    );
    // ... use particle ...
    delete particle;  // Memory returned to pool
}
// Fast allocation/deallocation with minimal fragmentation
```

::: tip Performance Benefit
The custom allocator provides significant performance improvement when many particles are created and destroyed, as in electromagnetic showers or hadronic cascades.
:::

## Kinematic Methods

### GetMomentumDirection()
`source/particles/management/include/G4DynamicParticle.icc:146-149`

```cpp
inline const G4ThreeVector& GetMomentumDirection() const;
```

**Returns:** Normalized momentum direction vector (unit vector)

**Example:**

```cpp
G4ThreeVector direction = particle->GetMomentumDirection();
G4cout << "Direction: (" << direction.x() << ", "
       << direction.y() << ", " << direction.z() << ")" << G4endl;
G4cout << "Magnitude: " << direction.mag() << G4endl;  // Always 1.0
```

### SetMomentumDirection()
`source/particles/management/include/G4DynamicParticle.icc:215-225`

```cpp
inline void SetMomentumDirection(const G4ThreeVector& aDirection);
inline void SetMomentumDirection(G4double px, G4double py, G4double pz);
```

**Parameters:**
- `aDirection`: New momentum direction (should be normalized)
- `px, py, pz`: Components of new direction

**Purpose:** Change particle direction without changing kinetic energy

**Example:**

```cpp
// Set direction by vector
G4ThreeVector newDir(1, 1, 0);
newDir = newDir.unit();  // Normalize
particle->SetMomentumDirection(newDir);

// Set direction by components
particle->SetMomentumDirection(0.707, 0.707, 0);

// Scatter particle by angle
G4double theta = 30.0*deg;
G4double phi = 45.0*deg;
G4ThreeVector scatteredDir(
    std::sin(theta)*std::cos(phi),
    std::sin(theta)*std::sin(phi),
    std::cos(theta)
);
particle->SetMomentumDirection(scatteredDir);
```

### GetMomentum()
`source/particles/management/include/G4DynamicParticle.icc:151-158`

```cpp
inline G4ThreeVector GetMomentum() const;
```

**Returns:** 3-momentum vector p = |p| * direction

**Calculation:** |p| = √(Ek² + 2*Ek*m)

**Example:**

```cpp
G4ThreeVector p = particle->GetMomentum();
G4double px = p.x();
G4double py = p.y();
G4double pz = p.z();
G4double pMag = p.mag();

G4cout << "Momentum: (" << px/MeV << ", " << py/MeV << ", "
       << pz/MeV << ") MeV/c" << G4endl;
G4cout << "Magnitude: " << pMag/MeV << " MeV/c" << G4endl;
```

### SetMomentum()
`source/particles/management/src/G4DynamicParticle.cc:332-344`

```cpp
void SetMomentum(const G4ThreeVector& momentum);
```

**Parameters:**
- `momentum`: New 3-momentum vector

**Behavior:**
- Calculates kinetic energy from momentum magnitude and mass
- Extracts and sets momentum direction
- Handles zero momentum case (sets direction to (1,0,0) and Ek=0)

**Example:**

```cpp
// Set momentum directly
G4ThreeVector newMomentum(100.0*MeV, 50.0*MeV, 200.0*MeV);
particle->SetMomentum(newMomentum);

// Momentum is automatically normalized to direction
G4ThreeVector dir = particle->GetMomentumDirection();
G4double pMag = particle->GetTotalMomentum();
G4cout << "Direction: " << dir << G4endl;
G4cout << "Magnitude: " << pMag/MeV << " MeV/c" << G4endl;
```

### Get4Momentum()
`source/particles/management/include/G4DynamicParticle.icc:160-168`

```cpp
inline G4LorentzVector Get4Momentum() const;
```

**Returns:** 4-momentum (px, py, pz, E) as Lorentz vector

**Components:**
- Spatial: p_i = |p| * direction_i
- Energy: E = Ek + m

**Example:**

```cpp
G4LorentzVector p4 = particle->Get4Momentum();

G4double px = p4.x();
G4double py = p4.y();
G4double pz = p4.z();
G4double energy = p4.t();

G4cout << "4-momentum: (" << px/GeV << ", " << py/GeV << ", "
       << pz/GeV << ", " << energy/GeV << ") GeV" << G4endl;

// Verify invariant mass
G4double m2 = p4.m2();
G4cout << "Invariant mass: " << std::sqrt(m2)/GeV << " GeV" << G4endl;
```

### Set4Momentum()
`source/particles/management/src/G4DynamicParticle.cc:346-367`

```cpp
void Set4Momentum(const G4LorentzVector& momentum);
```

**Parameters:**
- `momentum`: New 4-momentum Lorentz vector (px, py, pz, E)

**Behavior:**
- Extracts momentum direction from spatial components
- Calculates invariant mass from E² - p²
- Sets dynamical mass if differs from PDG mass
- Calculates kinetic energy from total energy and mass
- Handles zero momentum case

**Example:**

```cpp
// Create 4-momentum
G4LorentzVector p4(
    500.0*MeV,   // px
    300.0*MeV,   // py
    200.0*MeV,   // pz
    1000.0*MeV   // E
);

particle->Set4Momentum(p4);

// Check results
G4double mass = particle->GetMass();
G4double kinE = particle->GetKineticEnergy();
G4cout << "Mass: " << mass/MeV << " MeV" << G4endl;
G4cout << "Kinetic energy: " << kinE/MeV << " MeV" << G4endl;
```

### GetTotalMomentum()
`source/particles/management/include/G4DynamicParticle.icc:170-175`

```cpp
inline G4double GetTotalMomentum() const;
```

**Returns:** Magnitude of momentum |p| in energy units

**Formula:** |p| = √(Ek * (Ek + 2m))

**Example:**

```cpp
G4double pMag = particle->GetTotalMomentum();
G4cout << "Total momentum: " << pMag/GeV << " GeV/c" << G4endl;

// Verify with momentum vector
G4ThreeVector p = particle->GetMomentum();
G4double pVecMag = p.mag();
G4cout << "From vector: " << pVecMag/GeV << " GeV/c" << G4endl;
// Should be identical
```

### GetTotalEnergy()
`source/particles/management/include/G4DynamicParticle.icc:197-200`

```cpp
inline G4double GetTotalEnergy() const;
```

**Returns:** Total energy E = Ek + m

**Example:**

```cpp
G4double totalE = particle->GetTotalEnergy();
G4double kinE = particle->GetKineticEnergy();
G4double mass = particle->GetMass();

G4cout << "Total energy: " << totalE/MeV << " MeV" << G4endl;
G4cout << "Kinetic energy: " << kinE/MeV << " MeV" << G4endl;
G4cout << "Rest mass: " << mass/MeV << " MeV" << G4endl;
G4cout << "Sum (Ek+m): " << (kinE+mass)/MeV << " MeV" << G4endl;
```

### GetKineticEnergy()
`source/particles/management/include/G4DynamicParticle.icc:202-205`

```cpp
inline G4double GetKineticEnergy() const;
```

**Returns:** Kinetic energy in Geant4 default energy units

**Example:**

```cpp
G4double energy = particle->GetKineticEnergy();
G4cout << "Kinetic energy: " << energy/MeV << " MeV" << G4endl;
G4cout << "Kinetic energy: " << energy/GeV << " GeV" << G4endl;
G4cout << "Kinetic energy: " << energy/keV << " keV" << G4endl;
```

### SetKineticEnergy()
`source/particles/management/include/G4DynamicParticle.icc:239-246`

```cpp
inline void SetKineticEnergy(G4double aEnergy);
```

**Parameters:**
- `aEnergy`: New kinetic energy value

**Behavior:**
- Updates kinetic energy
- Invalidates cached log(kinetic energy) and beta
- Direction and mass unchanged

**Example:**

```cpp
// Change particle energy
particle->SetKineticEnergy(200.0*MeV);

// Direction unchanged
G4ThreeVector dir = particle->GetMomentumDirection();  // Same as before

// But momentum magnitude changes
G4double newP = particle->GetTotalMomentum();
G4cout << "New momentum: " << newP/MeV << " MeV/c" << G4endl;
```

### GetLogKineticEnergy()
`source/particles/management/include/G4DynamicParticle.icc:207-213`

```cpp
inline G4double GetLogKineticEnergy() const;
```

**Returns:** Natural logarithm of kinetic energy, or LOG_EKIN_MIN if Ek ≤ 0

**Behavior:**
- Computed on demand (lazy evaluation)
- Cached until kinetic energy changes
- Returns predefined minimum if energy is zero

**Purpose:** Optimize energy table lookups in physics processes

**Example:**

```cpp
G4double logE = particle->GetLogKineticEnergy();
G4double kinE = particle->GetKineticEnergy();

if (kinE > 0) {
    G4cout << "log(Ek) = " << logE << G4endl;
    G4cout << "Ek = exp(log(Ek)) = " << std::exp(logE)/MeV << " MeV" << G4endl;
}
```

::: info Performance Optimization
The logarithmic energy is cached because many physics processes use logarithmic interpolation in energy tables. Computing it on demand avoids unnecessary calculations when not needed.
:::

### GetBeta()
`source/particles/management/include/G4DynamicParticle.icc:316-322`

```cpp
inline G4double GetBeta() const;
```

**Returns:** Particle velocity β = v/c

**Calculation:**
- Ultra-relativistic (Ek > 1000m): β ≈ 1
- Other cases: β = √(T(T+2)) / (T+1), where T = Ek/m

**Behavior:**
- Computed on demand (lazy evaluation)
- Cached until kinetic energy or mass changes

**Example:**

```cpp
G4double beta = particle->GetBeta();
G4cout << "Beta (v/c): " << beta << G4endl;
G4cout << "Velocity: " << beta * CLHEP::c_light << " mm/ns" << G4endl;

// Calculate gamma factor
G4double gamma = 1.0 / std::sqrt(1.0 - beta*beta);
G4cout << "Gamma: " << gamma << G4endl;

// Alternative gamma calculation
G4double mass = particle->GetMass();
G4double totalE = particle->GetTotalEnergy();
G4double gamma2 = totalE / mass;
G4cout << "Gamma (from E/m): " << gamma2 << G4endl;
```

#### ComputeBeta()
`source/particles/management/include/G4DynamicParticle.icc:304-314`

```cpp
inline void ComputeBeta() const;
```

**Purpose:** Internal method to compute and cache beta

**Behavior:**
- Called automatically by `GetBeta()` when cache is invalid
- Sets β = 1 for massless or ultra-relativistic particles
- Uses relativistic formula for other cases

## Particle Properties

### GetParticleDefinition()
`source/particles/management/include/G4DynamicParticle.icc:182-185`

```cpp
inline const G4ParticleDefinition* GetParticleDefinition() const;
```

**Returns:** Pointer to associated particle definition

**Example:**

```cpp
const G4ParticleDefinition* def = particle->GetParticleDefinition();

G4String name = def->GetParticleName();
G4double pdgMass = def->GetPDGMass();
G4int pdgCode = def->GetPDGEncoding();

G4cout << "Particle: " << name << G4endl;
G4cout << "PDG code: " << pdgCode << G4endl;
G4cout << "PDG mass: " << pdgMass/MeV << " MeV" << G4endl;
```

### GetDefinition()
`source/particles/management/include/G4DynamicParticle.icc:177-180`

```cpp
inline G4ParticleDefinition* GetDefinition() const;
```

**Returns:** Non-const pointer to particle definition

**Purpose:** Backward compatibility (may be removed in future)

::: warning Deprecated
Use `GetParticleDefinition()` instead for const-correct code.
:::

### SetDefinition()
`source/particles/management/src/G4DynamicParticle.cc:279-309`

```cpp
void SetDefinition(const G4ParticleDefinition* aParticleDefinition);
```

**Parameters:**
- `aParticleDefinition`: New particle definition

**Behavior:**
- Deletes pre-assigned decay products with warning if present
- Updates particle definition
- Resets mass to new PDG mass
- Resets charge, spin, and magnetic moment to PDG values
- Deletes electron occupancy

**Purpose:** Change particle type (use with caution)

**Example:**

```cpp
// Start as electron
G4DynamicParticle* particle = new G4DynamicParticle(
    G4Electron::Definition(),
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);

// Change to positron (rare, but possible)
particle->SetDefinition(G4Positron::Definition());

// Properties updated
G4double newCharge = particle->GetCharge();
G4cout << "New charge: " << newCharge/eplus << " e" << G4endl;  // +1
```

::: warning Changing Particle Type
Changing the definition of an existing dynamic particle is uncommon and should be done carefully. It's usually better to create a new particle.
:::

### GetMass()
`source/particles/management/include/G4DynamicParticle.icc:108-111`

```cpp
inline G4double GetMass() const;
```

**Returns:** Current dynamical mass

**Note:** Dynamical mass may differ from PDG mass for:
- Off-shell particles (virtual particles)
- Ions with electron capture/loss

**Example:**

```cpp
G4double dynamicalMass = particle->GetMass();
G4double pdgMass = particle->GetDefinition()->GetPDGMass();

G4cout << "Dynamical mass: " << dynamicalMass/MeV << " MeV" << G4endl;
G4cout << "PDG mass: " << pdgMass/MeV << " MeV" << G4endl;

if (std::abs(dynamicalMass - pdgMass) > 0.01*MeV) {
    G4cout << "Particle is off-shell!" << G4endl;
}
```

### SetMass()
`source/particles/management/include/G4DynamicParticle.icc:113-119`

```cpp
inline void SetMass(G4double mass);
```

**Parameters:**
- `mass`: New dynamical mass (forced to be ≥ 0)

**Behavior:**
- Updates dynamical mass
- Invalidates cached beta value
- Does not change kinetic energy

**Example:**

```cpp
// Create ion and adjust mass for electron capture
G4DynamicParticle* ion = new G4DynamicParticle(
    G4IonTable::GetIonTable()->GetIon(6, 12),  // C-12
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);

// Add electron to K-shell
ion->AddElectron(0, 1);  // Automatically adjusts mass and charge

// Check updated mass
G4double newMass = ion->GetMass();
G4cout << "Ion mass with electron: " << newMass/MeV << " MeV" << G4endl;
```

### GetCharge()
`source/particles/management/include/G4DynamicParticle.icc:93-96`

```cpp
inline G4double GetCharge() const;
```

**Returns:** Current dynamical charge in units of e

**Note:** Dynamical charge may differ from PDG charge for ions with electron capture/loss

**Example:**

```cpp
G4double charge = particle->GetCharge();
G4cout << "Charge: " << charge/eplus << " e" << G4endl;

// For ions
if (G4IonTable::IsIon(particle->GetDefinition())) {
    G4int Z = particle->GetDefinition()->GetAtomicNumber();
    G4int nElectrons = particle->GetTotalOccupancy();
    G4cout << "Atomic number: " << Z << G4endl;
    G4cout << "Number of electrons: " << nElectrons << G4endl;
    G4cout << "Effective charge: " << charge/eplus << " e" << G4endl;
}
```

### SetCharge()
`source/particles/management/include/G4DynamicParticle.icc:98-106`

```cpp
inline void SetCharge(G4double charge);
inline void SetCharge(G4int chargeInUnitOfEplus);
```

**Parameters:**
- `charge`: New charge value (absolute units)
- `chargeInUnitOfEplus`: New charge in units of elementary charge

**Purpose:** Set custom charge (e.g., for ions with electron capture/loss)

**Example:**

```cpp
// Set charge explicitly
particle->SetCharge(2.0*eplus);  // Double positive charge

// Or use integer units
particle->SetCharge(2);  // Same as above

// Fractional charges (hypothetical)
particle->SetCharge(1.5*eplus);  // Charge = +1.5 e
```

### GetSpin()
`source/particles/management/include/G4DynamicParticle.icc:121-124`

```cpp
inline G4double GetSpin() const;
```

**Returns:** Dynamical spin in units of ℏ

**Example:**

```cpp
G4double spin = particle->GetSpin();
G4cout << "Spin: " << spin << " ℏ" << G4endl;

// Check if spin-1/2
if (std::abs(spin - 0.5) < 0.01) {
    G4cout << "Spin-1/2 particle (fermion)" << G4endl;
}
```

### SetSpin()
`source/particles/management/include/G4DynamicParticle.icc:126-134`

```cpp
inline void SetSpin(G4double spin);
inline void SetSpin(G4int spinInUnitOfHalfInteger);
```

**Parameters:**
- `spin`: Spin value in units of ℏ
- `spinInUnitOfHalfInteger`: Spin in units of ℏ/2

**Example:**

```cpp
// Set spin directly
particle->SetSpin(0.5);  // Spin-1/2

// Or use half-integer units
particle->SetSpin(1);    // Sets spin to 1 * 0.5 = 0.5 ℏ
particle->SetSpin(2);    // Sets spin to 2 * 0.5 = 1.0 ℏ
```

### GetMagneticMoment()
`source/particles/management/include/G4DynamicParticle.icc:136-139`

```cpp
inline G4double GetMagneticMoment() const;
```

**Returns:** Dynamical magnetic moment in Geant4 default units

**Example:**

```cpp
G4double mu = particle->GetMagneticMoment();
G4cout << "Magnetic moment: " << mu/(MeV/tesla) << " MeV/T" << G4endl;
```

### SetMagneticMoment()
`source/particles/management/include/G4DynamicParticle.icc:141-144`

```cpp
inline void SetMagneticMoment(G4double magneticMoment);
```

**Parameters:**
- `magneticMoment`: New magnetic moment value

**Example:**

```cpp
// Set custom magnetic moment
G4double muB = 0.5*eplus*hbar_Planck/(proton_mass_c2);  // Bohr magneton
particle->SetMagneticMoment(2.0*muB);
```

## Polarization and Time

### GetPolarization()
`source/particles/management/include/G4DynamicParticle.icc:187-190`

```cpp
inline const G4ThreeVector& GetPolarization() const;
```

**Returns:** Polarization vector

**Note:** Meaning depends on particle type:
- Spin-1/2: Polarization direction
- Photons: Linear or circular polarization state
- Magnitude not necessarily normalized

**Example:**

```cpp
G4ThreeVector pol = particle->GetPolarization();
G4cout << "Polarization: (" << pol.x() << ", "
       << pol.y() << ", " << pol.z() << ")" << G4endl;

G4double polMag = pol.mag();
if (polMag > 0) {
    G4ThreeVector polDir = pol.unit();
    G4cout << "Polarization magnitude: " << polMag << G4endl;
    G4cout << "Polarization direction: " << polDir << G4endl;
}
```

### SetPolarization()
`source/particles/management/include/G4DynamicParticle.icc:227-237`

```cpp
inline void SetPolarization(const G4ThreeVector& polarization);
inline void SetPolarization(G4double polX, G4double polY, G4double polZ);
```

**Parameters:**
- `polarization`: Polarization vector
- `polX, polY, polZ`: Components of polarization vector

**Example:**

```cpp
// Set photon linear polarization along x-axis
particle->SetPolarization(G4ThreeVector(1, 0, 0));

// Set by components
particle->SetPolarization(0.707, 0.707, 0);  // 45-degree polarization

// Circular polarization (for photons)
particle->SetPolarization(G4ThreeVector(1, 0, 0));  // Linear x
// Circular requires special handling in physics processes
```

### GetProperTime()
`source/particles/management/include/G4DynamicParticle.icc:192-195`

```cpp
inline G4double GetProperTime() const;
```

**Returns:** Proper time in Geant4 default time units

**Purpose:** Track cumulative proper time for unstable particles

**Example:**

```cpp
G4double properTime = particle->GetProperTime();
G4cout << "Proper time: " << properTime/ns << " ns" << G4endl;

// Check against lifetime
G4double lifetime = particle->GetDefinition()->GetPDGLifeTime();
G4double remainingProb = std::exp(-properTime / lifetime);
G4cout << "Survival probability: " << remainingProb << G4endl;
```

### SetProperTime()
`source/particles/management/include/G4DynamicParticle.icc:248-251`

```cpp
inline void SetProperTime(G4double time);
```

**Parameters:**
- `time`: New proper time value

**Purpose:** Update proper time during tracking

**Example:**

```cpp
// Initialize proper time
particle->SetProperTime(0.0);

// Update after step
G4double dt = stepLength / (beta * c_light);  // Lab time
G4double beta = particle->GetBeta();
G4double gamma = 1.0 / std::sqrt(1.0 - beta*beta);
G4double dtau = dt / gamma;  // Proper time increment

G4double currentProperTime = particle->GetProperTime();
particle->SetProperTime(currentProperTime + dtau);
```

## Electron Occupancy (for Ions)

### GetElectronOccupancy()
`source/particles/management/include/G4DynamicParticle.icc:54-57`

```cpp
inline const G4ElectronOccupancy* GetElectronOccupancy() const;
```

**Returns:** Pointer to electron occupancy object, or `nullptr` if not an ion

**Purpose:** Access electron shell configuration for ions

**Example:**

```cpp
const G4ElectronOccupancy* occupancy = ion->GetElectronOccupancy();
if (occupancy != nullptr) {
    G4int totalElectrons = occupancy->GetTotalOccupancy();
    G4cout << "Total electrons: " << totalElectrons << G4endl;

    // Check individual shells
    for (G4int orbit = 0; orbit < occupancy->GetSizeOfOrbit(); ++orbit) {
        G4int nElectrons = occupancy->GetOccupancy(orbit);
        if (nElectrons > 0) {
            G4cout << "Orbit " << orbit << ": "
                   << nElectrons << " electrons" << G4endl;
        }
    }
}
```

### GetTotalOccupancy()
`source/particles/management/include/G4DynamicParticle.icc:59-62`

```cpp
inline G4int GetTotalOccupancy() const;
```

**Returns:** Total number of electrons, or 0 if not an ion

**Example:**

```cpp
G4int nElectrons = ion->GetTotalOccupancy();
G4int Z = ion->GetDefinition()->GetAtomicNumber();
G4cout << "Atomic number: " << Z << G4endl;
G4cout << "Number of electrons: " << nElectrons << G4endl;
G4cout << "Charge state: +" << (Z - nElectrons) << G4endl;
```

### GetOccupancy()
`source/particles/management/include/G4DynamicParticle.icc:64-67`

```cpp
inline G4int GetOccupancy(G4int orbit) const;
```

**Parameters:**
- `orbit`: Orbital index (0=K-shell, 1=L-shell, etc.)

**Returns:** Number of electrons in specified orbital, or 0 if not an ion

**Example:**

```cpp
// Check K-shell (orbit 0)
G4int kShell = ion->GetOccupancy(0);
G4cout << "K-shell electrons: " << kShell << G4endl;

// Check all shells
for (G4int orbit = 0; orbit < 10; ++orbit) {
    G4int nElec = ion->GetOccupancy(orbit);
    if (nElec > 0) {
        G4cout << "Shell " << orbit << ": " << nElec << " electrons" << G4endl;
    }
}
```

### AddElectron()
`source/particles/management/include/G4DynamicParticle.icc:69-79`

```cpp
inline void AddElectron(G4int orbit, G4int number = 1);
```

**Parameters:**
- `orbit`: Orbital index to add electrons to
- `number`: Number of electrons to add (default: 1)

**Behavior:**
- Creates electron occupancy if not present (ions only)
- Adds electrons to specified orbital
- Automatically adjusts charge (decreases by e × number)
- Automatically adjusts mass (increases by electron_mass × number)

**Example:**

```cpp
// Create fully ionized carbon ion
G4DynamicParticle* ion = new G4DynamicParticle(
    G4IonTable::GetIonTable()->GetIon(6, 12, 0),  // C-12, fully ionized
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);

G4cout << "Initial charge: " << ion->GetCharge()/eplus << " e" << G4endl;

// Add electron to K-shell (electron capture)
ion->AddElectron(0, 1);

G4cout << "After capture charge: " << ion->GetCharge()/eplus << " e" << G4endl;
G4cout << "K-shell electrons: " << ion->GetOccupancy(0) << G4endl;

// Add more electrons
ion->AddElectron(0, 1);  // Fill K-shell (2 electrons)
ion->AddElectron(1, 2);  // Start L-shell

G4cout << "Final charge: " << ion->GetCharge()/eplus << " e" << G4endl;
G4cout << "Total electrons: " << ion->GetTotalOccupancy() << G4endl;
```

### RemoveElectron()
`source/particles/management/include/G4DynamicParticle.icc:81-91`

```cpp
inline void RemoveElectron(G4int orbit, G4int number = 1);
```

**Parameters:**
- `orbit`: Orbital index to remove electrons from
- `number`: Number of electrons to remove (default: 1)

**Behavior:**
- Creates electron occupancy if not present (ions only)
- Removes electrons from specified orbital
- Automatically adjusts charge (increases by e × number)
- Automatically adjusts mass (decreases by electron_mass × number)

**Example:**

```cpp
// Create neutral carbon atom
G4DynamicParticle* atom = new G4DynamicParticle(
    G4IonTable::GetIonTable()->GetIon(6, 12, 0),
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);

// Start with neutral atom - add all 6 electrons
atom->AddElectron(0, 2);  // K-shell: 2 electrons
atom->AddElectron(1, 4);  // L-shell: 4 electrons

G4cout << "Neutral atom charge: " << atom->GetCharge()/eplus << " e" << G4endl;

// Ionization - remove electron
atom->RemoveElectron(1, 1);  // Remove one from L-shell

G4cout << "After ionization charge: " << atom->GetCharge()/eplus << " e" << G4endl;
G4cout << "L-shell electrons: " << atom->GetOccupancy(1) << G4endl;
```

### AllocateElectronOccupancy()
`source/particles/management/src/G4DynamicParticle.cc:321-330`

```cpp
void AllocateElectronOccupancy();
```

**Purpose:** Internal method to allocate electron occupancy (called automatically)

**Behavior:**
- Only creates occupancy if particle is an ion
- Called automatically by `AddElectron()` / `RemoveElectron()` if needed

## Pre-Assigned Decay

### GetPreAssignedDecayProducts()
`source/particles/management/include/G4DynamicParticle.icc:253-256`

```cpp
inline const G4DecayProducts* GetPreAssignedDecayProducts() const;
```

**Returns:** Pointer to pre-assigned decay products, or `nullptr` if none

**Purpose:** Access decay products that have been forced for this particle

**Example:**

```cpp
const G4DecayProducts* decayProducts = particle->GetPreAssignedDecayProducts();
if (decayProducts != nullptr) {
    G4int nSecondaries = decayProducts->entries();
    G4cout << "Pre-assigned decay to " << nSecondaries
           << " products" << G4endl;

    for (G4int i = 0; i < nSecondaries; ++i) {
        G4DynamicParticle* product = (*decayProducts)[i];
        G4String name = product->GetDefinition()->GetParticleName();
        G4double kinE = product->GetKineticEnergy();
        G4cout << "  Product " << i << ": " << name
               << " with " << kinE/MeV << " MeV" << G4endl;
    }
}
```

### SetPreAssignedDecayProducts()
`source/particles/management/include/G4DynamicParticle.icc:258-261`

```cpp
inline void SetPreAssignedDecayProducts(G4DecayProducts* decayProducts);
```

**Parameters:**
- `decayProducts`: Pointer to decay products to force

**Purpose:** Force specific decay channel/products

**Behavior:**
- Takes ownership of decay products
- Deleted in destructor or when definition changes

::: warning Ownership
The particle takes ownership of the decay products and will delete them.
:::

**Example:**

```cpp
// Create parent particle
G4DynamicParticle* muon = new G4DynamicParticle(
    G4MuonMinus::Definition(),
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);

// Create specific decay products
G4DecayProducts* products = new G4DecayProducts(*muon);

// Add decay daughters
G4DynamicParticle* electron = new G4DynamicParticle(
    G4Electron::Definition(),
    G4ThreeVector(0.6, 0.8, 0),
    50.0*MeV
);
products->PushProducts(electron);

G4DynamicParticle* nuE = new G4DynamicParticle(
    G4NeutrinoE::NeutrinoE(),
    G4ThreeVector(-0.6, -0.8, 0),
    30.0*MeV
);
products->PushProducts(nuE);

G4DynamicParticle* nuMuBar = new G4DynamicParticle(
    G4AntiNeutrinoMu::AntiNeutrinoMu(),
    G4ThreeVector(0, 0, -1),
    20.0*MeV
);
products->PushProducts(nuMuBar);

// Assign to particle
muon->SetPreAssignedDecayProducts(products);

// Later, when decay is processed, these specific products will be used
```

### GetPreAssignedDecayProperTime()
`source/particles/management/include/G4DynamicParticle.icc:263-266`

```cpp
inline G4double GetPreAssignedDecayProperTime() const;
```

**Returns:** Pre-assigned proper time at which particle will decay, or -1.0 if none

**Purpose:** Check when particle is scheduled to decay

**Example:**

```cpp
G4double decayTime = particle->GetPreAssignedDecayProperTime();
if (decayTime >= 0) {
    G4double currentTime = particle->GetProperTime();
    G4double timeUntilDecay = decayTime - currentTime;
    G4cout << "Particle will decay in " << timeUntilDecay/ns << " ns (proper time)" << G4endl;
}
```

### SetPreAssignedDecayProperTime()
`source/particles/management/include/G4DynamicParticle.icc:268-271`

```cpp
inline void SetPreAssignedDecayProperTime(G4double time);
```

**Parameters:**
- `time`: Proper time at which decay should occur

**Purpose:** Force decay at specific proper time

**Example:**

```cpp
// Force decay at specific proper time
G4double lifetime = particle->GetDefinition()->GetPDGLifeTime();
G4double decayTime = 2.0 * lifetime;  // Decay after 2 lifetimes
particle->SetPreAssignedDecayProperTime(decayTime);

// During tracking, particle will decay when proper time reaches this value
```

## Primary Particle Link

### GetPrimaryParticle()
`source/particles/management/include/G4DynamicParticle.icc:288-291`

```cpp
inline G4PrimaryParticle* GetPrimaryParticle() const;
```

**Returns:** Pointer to corresponding primary particle, or `nullptr`

**Purpose:** Link back to primary generator information

**Note:** Only set for primary particles or pre-assigned decay products

**Example:**

```cpp
G4PrimaryParticle* primary = particle->GetPrimaryParticle();
if (primary != nullptr) {
    G4cout << "This is a primary particle" << G4endl;

    // Access primary information
    G4int trackID = primary->GetTrackID();
    G4ThreeVector vertex = primary->GetVertex();
    G4cout << "Track ID: " << trackID << G4endl;
    G4cout << "Vertex: " << vertex/cm << " cm" << G4endl;
}
else {
    G4cout << "This is a secondary particle" << G4endl;
}
```

### SetPrimaryParticle()
`source/particles/management/include/G4DynamicParticle.icc:283-286`

```cpp
inline void SetPrimaryParticle(G4PrimaryParticle* primary);
```

**Parameters:**
- `primary`: Pointer to primary particle

**Purpose:** Establish link to primary generator

::: warning Internal Use
This method is typically called internally by Geant4. User code rarely needs to call it directly.
:::

### GetPDGcode()
`source/particles/management/include/G4DynamicParticle.icc:293-297`

```cpp
inline G4int GetPDGcode() const;
```

**Returns:** PDG particle code

**Behavior:**
- Returns PDG code from particle definition if defined
- Returns stored PDG code if definition has code 0 (e.g., geantino)
- Returns 0 if neither is available

**Example:**

```cpp
G4int pdgCode = particle->GetPDGcode();
G4cout << "PDG code: " << pdgCode << G4endl;

// Standard particles have PDG codes
if (pdgCode == 11) {
    G4cout << "This is an electron" << G4endl;
}
else if (pdgCode == 22) {
    G4cout << "This is a photon" << G4endl;
}
else if (pdgCode == 2212) {
    G4cout << "This is a proton" << G4endl;
}
```

### SetPDGcode()
`source/particles/management/include/G4DynamicParticle.icc:299-302`

```cpp
inline void SetPDGcode(G4int code);
```

**Parameters:**
- `code`: PDG particle code

**Purpose:** Set PDG code for particles without standard definition

**Example:**

```cpp
// For particles like geantino that have PDG code 0 in definition
if (particle->GetDefinition()->GetPDGEncoding() == 0) {
    particle->SetPDGcode(999999);  // Custom code
}
```

## Utility Methods

### DumpInfo()
`source/particles/management/src/G4DynamicParticle.cc:370-402`

```cpp
void DumpInfo(G4int mode = 0) const;
```

**Parameters:**
- `mode`: Output detail level
  - 0: Default (minimum) - particle type, mass, charge, momentum, energy
  - 1: Include electron occupancy information

**Purpose:** Print comprehensive particle information to `G4cout`

**Output Includes:**
- Particle type and name
- Mass and charge
- Momentum direction and magnitude
- Total momentum vector components
- Total energy and kinetic energy
- Magnetic moment
- Proper time
- Electron occupancy (if mode > 0 and present)

**Example:**

```cpp
// Basic information
particle->DumpInfo();

// With electron occupancy (for ions)
ion->DumpInfo(1);
```

**Sample Output:**

```
 Particle type - e-
   mass:        0.000511 [GeV]
   charge:      -1 [e]
   Direction x: 0, y: 0, z: 1
   Total Momentum = 0.1 [GeV]
   Momentum: 0 [GeV], y: 0 [GeV], z: 0.1 [GeV]
   Total Energy   = 0.100511 [GeV]
   Kinetic Energy = 0.1 [GeV]
 MagneticMoment  [MeV/T]: 0.00579
   ProperTime     = 0 [ns]
```

### SetVerboseLevel()
`source/particles/management/include/G4DynamicParticle.icc:273-276`

```cpp
inline void SetVerboseLevel(G4int value);
```

**Parameters:**
- `value`: Verbosity level
  - 0: Silent
  - 1: Warning messages (default)
  - 2: More detailed output

**Purpose:** Control output verbosity for this particle

**Example:**

```cpp
// Suppress warnings
particle->SetVerboseLevel(0);

// Enable detailed output
particle->SetVerboseLevel(2);

// Change definition (would normally print warning)
particle->SetDefinition(G4Positron::Definition());
```

### GetVerboseLevel()
`source/particles/management/include/G4DynamicParticle.icc:278-281`

```cpp
inline G4int GetVerboseLevel() const;
```

**Returns:** Current verbosity level

**Example:**

```cpp
G4int verbosity = particle->GetVerboseLevel();
if (verbosity > 0) {
    G4cout << "Verbose output enabled" << G4endl;
}
```

## Comparison Operators

### operator==()
`source/particles/management/src/G4DynamicParticle.cc:311-314`

```cpp
G4bool operator==(const G4DynamicParticle& right) const;
```

**Returns:** `true` if particles are the same object (pointer comparison)

**Purpose:** Identity comparison (not value comparison)

**Example:**

```cpp
G4DynamicParticle* p1 = new G4DynamicParticle(/*...*/);
G4DynamicParticle* p2 = new G4DynamicParticle(/*...*/);
G4DynamicParticle* p3 = p1;

if (*p1 == *p2) {
    G4cout << "Same object" << G4endl;  // Won't print
}

if (*p1 == *p3) {
    G4cout << "Same object" << G4endl;  // Will print
}
```

### operator!=()
`source/particles/management/src/G4DynamicParticle.cc:316-319`

```cpp
G4bool operator!=(const G4DynamicParticle& right) const;
```

**Returns:** `true` if particles are different objects

**Example:**

```cpp
if (*particle1 != *particle2) {
    G4cout << "Different particles" << G4endl;
}
```

## Usage Examples

### Creating Dynamic Particles

```cpp
// Example 1: Electron with kinetic energy and direction
G4ThreeVector direction(0, 0, 1);  // +z direction
G4double kineticEnergy = 100.0*MeV;

G4DynamicParticle* electron = new G4DynamicParticle(
    G4Electron::Definition(),
    direction,
    kineticEnergy
);

// Example 2: Photon with 3-momentum
G4ThreeVector photonMomentum(50.0*MeV, 50.0*MeV, 100.0*MeV);
G4DynamicParticle* photon = new G4DynamicParticle(
    G4Gamma::Definition(),
    photonMomentum
);

// Example 3: Proton with 4-momentum
G4LorentzVector protonP4(
    100.0*MeV,   // px
    200.0*MeV,   // py
    500.0*MeV,   // pz
    1100.0*MeV   // E
);
G4DynamicParticle* proton = new G4DynamicParticle(
    G4Proton::Definition(),
    protonP4
);

// Example 4: Off-shell particle
G4double effectiveMass = 200.0*MeV;  // Different from PDG mass
G4DynamicParticle* virtualParticle = new G4DynamicParticle(
    G4PionPlus::Definition(),
    G4ThreeVector(0, 0, 1),
    50.0*MeV,
    effectiveMass
);
```

### Setting and Getting Kinematic Properties

```cpp
G4DynamicParticle* particle = new G4DynamicParticle(
    G4MuonMinus::Definition(),
    G4ThreeVector(0, 0, 1),
    1.0*GeV
);

// Get kinematic properties
G4double kinE = particle->GetKineticEnergy();
G4double totalE = particle->GetTotalEnergy();
G4double momentum = particle->GetTotalMomentum();
G4ThreeVector pVec = particle->GetMomentum();
G4LorentzVector p4 = particle->Get4Momentum();

G4cout << "Kinetic energy: " << kinE/GeV << " GeV" << G4endl;
G4cout << "Total energy: " << totalE/GeV << " GeV" << G4endl;
G4cout << "Momentum: " << momentum/GeV << " GeV/c" << G4endl;
G4cout << "Momentum vector: " << pVec/GeV << " GeV/c" << G4endl;
G4cout << "4-momentum: " << p4 << G4endl;

// Modify kinematics
particle->SetKineticEnergy(2.0*GeV);  // Change energy, keep direction

G4ThreeVector newDir(1.0/std::sqrt(2.0), 1.0/std::sqrt(2.0), 0);
particle->SetMomentumDirection(newDir);  // Change direction, keep energy

G4ThreeVector newMomentum(500.0*MeV, 500.0*MeV, 1000.0*MeV);
particle->SetMomentum(newMomentum);  // Set momentum completely

// Get relativistic properties
G4double beta = particle->GetBeta();
G4double gamma = 1.0 / std::sqrt(1.0 - beta*beta);
G4cout << "Beta: " << beta << G4endl;
G4cout << "Gamma: " << gamma << G4endl;
```

### Working with Polarization

```cpp
// Polarized electron
G4DynamicParticle* electron = new G4DynamicParticle(
    G4Electron::Definition(),
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);

// Set longitudinal polarization (along momentum)
electron->SetPolarization(G4ThreeVector(0, 0, 1));

G4ThreeVector pol = electron->GetPolarization();
G4cout << "Polarization: " << pol << G4endl;

// Polarized photon (linear polarization)
G4DynamicParticle* photon = new G4DynamicParticle(
    G4Gamma::Definition(),
    G4ThreeVector(0, 0, 1),  // Propagating in +z
    511.0*keV
);

// Linear polarization in x-direction (perpendicular to momentum)
photon->SetPolarization(G4ThreeVector(1, 0, 0));

// Check if polarized
G4ThreeVector photonPol = photon->GetPolarization();
if (photonPol.mag() > 0) {
    G4cout << "Polarized photon" << G4endl;
    G4cout << "Polarization direction: " << photonPol.unit() << G4endl;
}
```

### Handling Ions with Electron Occupancy

```cpp
// Create fully ionized carbon-12 ion
G4IonTable* ionTable = G4IonTable::GetIonTable();
G4ParticleDefinition* carbon12 = ionTable->GetIon(6, 12, 0);

G4DynamicParticle* ion = new G4DynamicParticle(
    carbon12,
    G4ThreeVector(0, 0, 1),
    100.0*MeV
);

// Initial state
G4cout << "Fully ionized C-12:" << G4endl;
G4cout << "  Charge: " << ion->GetCharge()/eplus << " e" << G4endl;
G4cout << "  Mass: " << ion->GetMass()/MeV << " MeV" << G4endl;
G4cout << "  Total electrons: " << ion->GetTotalOccupancy() << G4endl;

// Electron capture in K-shell
ion->AddElectron(0, 1);

G4cout << "\nAfter K-shell capture:" << G4endl;
G4cout << "  Charge: " << ion->GetCharge()/eplus << " e" << G4endl;
G4cout << "  Mass: " << ion->GetMass()/MeV << " MeV" << G4endl;
G4cout << "  K-shell electrons: " << ion->GetOccupancy(0) << G4endl;
G4cout << "  Total electrons: " << ion->GetTotalOccupancy() << G4endl;

// Add more electrons to approach neutral atom
ion->AddElectron(0, 1);  // Complete K-shell (2 electrons)
ion->AddElectron(1, 4);  // Fill L-shell (4 electrons)

G4cout << "\nNearly neutral atom:" << G4endl;
G4cout << "  Charge: " << ion->GetCharge()/eplus << " e" << G4endl;
G4cout << "  Total electrons: " << ion->GetTotalOccupancy() << G4endl;

// Ionization - remove electron
ion->RemoveElectron(1, 1);

G4cout << "\nAfter ionization:" << G4endl;
G4cout << "  Charge: " << ion->GetCharge()/eplus << " e" << G4endl;
G4cout << "  L-shell electrons: " << ion->GetOccupancy(1) << G4endl;

// Dump detailed information including electron occupancy
ion->DumpInfo(1);
```

### Pre-Assigned Decay Products

```cpp
// Create unstable particle
G4DynamicParticle* pion = new G4DynamicParticle(
    G4PionZero::Definition(),
    G4ThreeVector(0, 0, 1),
    500.0*MeV
);

// Force specific decay: pi0 -> gamma + gamma
G4DecayProducts* decayProducts = new G4DecayProducts(*pion);

// Create first photon
G4DynamicParticle* gamma1 = new G4DynamicParticle(
    G4Gamma::Definition(),
    G4ThreeVector(0.707, 0, 0.707),
    250.0*MeV
);
decayProducts->PushProducts(gamma1);

// Create second photon
G4DynamicParticle* gamma2 = new G4DynamicParticle(
    G4Gamma::Definition(),
    G4ThreeVector(-0.707, 0, 0.707),
    250.0*MeV
);
decayProducts->PushProducts(gamma2);

// Assign decay products
pion->SetPreAssignedDecayProducts(decayProducts);

// Set decay time
G4double lifetime = pion->GetDefinition()->GetPDGLifeTime();
G4double decayTime = -lifetime * std::log(G4UniformRand());
pion->SetPreAssignedDecayProperTime(decayTime);

// Check if decay is pre-assigned
if (pion->GetPreAssignedDecayProducts() != nullptr) {
    G4cout << "Decay products pre-assigned" << G4endl;
    G4double assignedTime = pion->GetPreAssignedDecayProperTime();
    G4cout << "Will decay at proper time: " << assignedTime/ns << " ns" << G4endl;
}
```

### Particle Tracking Simulation

```cpp
// Simulate particle along a step
class ParticleTracker {
public:
    void TrackStep(G4DynamicParticle* particle, G4double stepLength) {
        // Get initial state
        G4ThreeVector position(0, 0, 0);  // Assume starting at origin
        G4ThreeVector momentum = particle->GetMomentum();
        G4ThreeVector direction = particle->GetMomentumDirection();

        // Update position
        position += direction * stepLength;

        // Update proper time
        G4double beta = particle->GetBeta();
        G4double gamma = 1.0 / std::sqrt(1.0 - beta*beta);
        G4double labTime = stepLength / (beta * CLHEP::c_light);
        G4double properTime = particle->GetProperTime();
        properTime += labTime / gamma;
        particle->SetProperTime(properTime);

        // Check for decay
        if (!particle->GetDefinition()->GetPDGStable()) {
            G4double lifetime = particle->GetDefinition()->GetPDGLifeTime();

            // Check pre-assigned decay time
            G4double preAssignedTime = particle->GetPreAssignedDecayProperTime();
            if (preAssignedTime >= 0 && properTime >= preAssignedTime) {
                G4cout << "Particle decays at proper time "
                       << properTime/ns << " ns" << G4endl;

                // Use pre-assigned decay products if available
                const G4DecayProducts* products =
                    particle->GetPreAssignedDecayProducts();
                if (products != nullptr) {
                    G4cout << "Using pre-assigned decay products" << G4endl;
                }
            }
        }

        // Print current state
        G4cout << "Step completed:" << G4endl;
        G4cout << "  Position: " << position/cm << " cm" << G4endl;
        G4cout << "  Momentum: " << momentum/MeV << " MeV/c" << G4endl;
        G4cout << "  Kinetic energy: " << particle->GetKineticEnergy()/MeV
               << " MeV" << G4endl;
        G4cout << "  Proper time: " << properTime/ns << " ns" << G4endl;
    }
};

// Usage
G4DynamicParticle* muon = new G4DynamicParticle(
    G4MuonMinus::Definition(),
    G4ThreeVector(0, 0, 1),
    1.0*GeV
);

ParticleTracker tracker;
tracker.TrackStep(muon, 10.0*cm);
```

### Energy-Loss Simulation

```cpp
// Simulate energy loss (e.g., ionization)
void ApplyEnergyLoss(G4DynamicParticle* particle, G4double energyLoss) {
    G4double currentKinE = particle->GetKineticEnergy();
    G4double newKinE = currentKinE - energyLoss;

    if (newKinE > 0) {
        // Particle still has energy
        particle->SetKineticEnergy(newKinE);

        G4cout << "Energy loss: " << energyLoss/keV << " keV" << G4endl;
        G4cout << "New kinetic energy: " << newKinE/keV << " keV" << G4endl;

        // Direction unchanged, but momentum magnitude changes
        G4double newMomentum = particle->GetTotalMomentum();
        G4cout << "New momentum: " << newMomentum/MeV << " MeV/c" << G4endl;
    }
    else {
        // Particle stopped
        particle->SetKineticEnergy(0);
        G4cout << "Particle stopped" << G4endl;
    }
}

// Usage
G4DynamicParticle* electron = new G4DynamicParticle(
    G4Electron::Definition(),
    G4ThreeVector(0, 0, 1),
    100.0*keV
);

// Simulate continuous energy loss
for (G4int step = 0; step < 10; ++step) {
    G4double loss = 5.0*keV;  // 5 keV per step
    ApplyEnergyLoss(electron, loss);

    if (electron->GetKineticEnergy() == 0) {
        G4cout << "Electron stopped at step " << step << G4endl;
        break;
    }
}
```

### Working with Secondary Particles

```cpp
// Simulate Compton scattering
class ComptonScattering {
public:
    std::pair<G4DynamicParticle*, G4DynamicParticle*>
    Scatter(G4DynamicParticle* photon, G4double scatterAngle) {
        // Initial photon energy
        G4double E0 = photon->GetKineticEnergy();
        G4double me = electron_mass_c2;

        // Scattered photon energy (Compton formula)
        G4double E1 = E0 / (1.0 + (E0/me)*(1.0 - std::cos(scatterAngle)));

        // Recoil electron energy
        G4double Ee = E0 - E1;

        // Create scattered photon
        G4ThreeVector photonDir(
            std::sin(scatterAngle),
            0,
            std::cos(scatterAngle)
        );
        G4DynamicParticle* scatteredPhoton = new G4DynamicParticle(
            G4Gamma::Definition(),
            photonDir,
            E1
        );

        // Create recoil electron
        // Calculate electron direction from momentum conservation
        G4ThreeVector electronDir = (photon->GetMomentum() -
                                     scatteredPhoton->GetMomentum()).unit();
        G4DynamicParticle* recoilElectron = new G4DynamicParticle(
            G4Electron::Definition(),
            electronDir,
            Ee
        );

        return std::make_pair(scatteredPhoton, recoilElectron);
    }
};

// Usage
G4DynamicParticle* incidentPhoton = new G4DynamicParticle(
    G4Gamma::Definition(),
    G4ThreeVector(0, 0, 1),
    511.0*keV
);

ComptonScattering compton;
G4double angle = 90.0*deg;
auto [photon, electron] = compton.Scatter(incidentPhoton, angle);

G4cout << "Scattered photon:" << G4endl;
photon->DumpInfo();

G4cout << "\nRecoil electron:" << G4endl;
electron->DumpInfo();

delete photon;
delete electron;
delete incidentPhoton;
```

## Performance Notes

### Custom Allocator Performance

`G4DynamicParticle` uses a custom allocator for significant performance benefits:

**Benefits:**
- **Fast Allocation**: Pre-allocated memory pool avoids system allocator overhead
- **Cache Efficiency**: Objects allocated close together in memory
- **Reduced Fragmentation**: Memory reused from pool rather than returned to system
- **Thread-Local**: Each thread has its own allocator, avoiding contention

**Performance Impact:**
- Typical speedup: 2-5× faster than standard `new`/`delete`
- Most significant for electromagnetic showers with many particles
- Reduces memory fragmentation in long-running simulations

**Example Benchmark:**

```cpp
// Benchmark custom allocator
#include <chrono>

void BenchmarkAllocation(G4int nParticles) {
    auto start = std::chrono::high_resolution_clock::now();

    std::vector<G4DynamicParticle*> particles;
    particles.reserve(nParticles);

    // Allocation
    for (G4int i = 0; i < nParticles; ++i) {
        particles.push_back(new G4DynamicParticle(
            G4Electron::Definition(),
            G4ThreeVector(0, 0, 1),
            100.0*MeV
        ));
    }

    // Deallocation
    for (auto* particle : particles) {
        delete particle;
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
        end - start
    );

    G4cout << "Allocated/deallocated " << nParticles << " particles in "
           << duration.count() << " µs" << G4endl;
    G4cout << "Average per particle: "
           << duration.count()/nParticles << " µs" << G4endl;
}

// Run benchmark
BenchmarkAllocation(10000);
```

### Lazy Evaluation and Caching

Several properties use lazy evaluation for efficiency:

#### Log Kinetic Energy
`source/particles/management/include/G4DynamicParticle.icc:207-213`

- Computed only when requested
- Cached until kinetic energy changes
- Used extensively by physics processes for table interpolation

```cpp
// Efficient: log computed once
G4double logE = particle->GetLogKineticEnergy();

// Multiple accesses use cached value
for (G4int i = 0; i < 1000; ++i) {
    G4double log = particle->GetLogKineticEnergy();  // No recomputation
}

// Cache invalidated when energy changes
particle->SetKineticEnergy(200.0*MeV);
G4double newLog = particle->GetLogKineticEnergy();  // Recomputed
```

#### Beta (Velocity)
`source/particles/management/include/G4DynamicParticle.icc:316-322`

- Computed on demand
- Cached until kinetic energy or mass changes
- Optimized calculation for ultra-relativistic particles

```cpp
// Efficient caching
G4double beta = particle->GetBeta();  // Computed
G4double beta2 = particle->GetBeta(); // Cached value returned

// Cache invalidated by energy or mass change
particle->SetKineticEnergy(500.0*MeV);
G4double beta3 = particle->GetBeta();  // Recomputed
```

### Memory Usage

**Per G4DynamicParticle:**
- Core: ~160 bytes (excluding electron occupancy)
- With electron occupancy: +40 bytes
- With pre-assigned decay products: varies

**Optimization Tips:**

1. **Reuse Particles**: Use particle pools when possible
2. **Avoid Copies**: Use move semantics or pointers
3. **Delete Promptly**: Free particles as soon as no longer needed
4. **Electron Occupancy**: Only allocated for ions when needed

```cpp
// GOOD: Efficient memory usage
{
    G4DynamicParticle* particle = new G4DynamicParticle(/*...*/);
    // Use particle
    delete particle;  // Freed immediately
}

// LESS EFFICIENT: Particle lives longer than needed
G4DynamicParticle* particle = new G4DynamicParticle(/*...*/);
// ... long computation ...
delete particle;  // Memory held unnecessarily

// EFFICIENT: Move instead of copy
G4DynamicParticle temp(/*...*/);
G4DynamicParticle permanent = std::move(temp);  // No copy
```

### Computation Cost

**Fast Operations** (inline, cached, or simple):
- `GetKineticEnergy()`: Direct member access
- `GetMass()`, `GetCharge()`: Direct member access
- `GetMomentumDirection()`: Reference return
- `GetBeta()`: Cached value (after first call)
- `GetLogKineticEnergy()`: Cached value (after first call)

**Moderate Operations** (mathematical computation):
- `GetTotalMomentum()`: Square root
- `GetMomentum()`: Square root + vector multiplication
- `Get4Momentum()`: Square root + vector construction

**Expensive Operations** (complex or allocating):
- `SetMomentum()`: Energy calculation from momentum
- `Set4Momentum()`: Mass calculation, multiple comparisons
- `AddElectron()` / `RemoveElectron()`: Conditional allocation

**Optimization Strategy:**

```cpp
// EFFICIENT: Cache frequently used values
G4double kinE = particle->GetKineticEnergy();
G4ThreeVector dir = particle->GetMomentumDirection();

for (G4int i = 0; i < 1000; ++i) {
    // Use cached values
    G4double someCalculation = kinE * dir.z();
}

// LESS EFFICIENT: Repeated computation
for (G4int i = 0; i < 1000; ++i) {
    // Recomputes each time (though these are fast)
    G4double kinE = particle->GetKineticEnergy();
    G4ThreeVector dir = particle->GetMomentumDirection();
}
```

## See Also

### Related Classes

- [G4ParticleDefinition](g4particledefinition.md) - Static particle properties and definitions
- [G4Track](../../tracking/g4track.md) - Complete track information including position and volume
- [G4PrimaryParticle](../../event/g4primaryparticle.md) - Primary particle from generator
- [G4DecayProducts](g4decayproducts.md) - Collection of decay daughters
- [G4ElectronOccupancy](g4electronoccupancy.md) - Electron shell configuration for ions
- [G4LorentzVector](../../geometry/g4lorentzvector.md) - 4-momentum and Lorentz transformations
- [G4IonTable](g4iontable.md) - Ion particle definitions

### Module Documentation

- [Particles Module Overview](../index.md) - Complete particles module documentation
- [Particle Types](../particle-types.md) - Standard Geant4 particles
- [Track and Step](../../tracking/index.md) - Tracking infrastructure

### External References

- [Geant4 User Guide - Particle Definition](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/TrackingAndPhysics/particle.html)
- [Particle Data Group (PDG)](https://pdg.lbl.gov/) - Standard particle properties
- [Relativistic Kinematics](https://en.wikipedia.org/wiki/Relativistic_mechanics) - Energy-momentum relations

---

::: info Source Reference
Complete implementation in:
- Header: `source/particles/management/include/G4DynamicParticle.hh`
- Source: `source/particles/management/src/G4DynamicParticle.cc`
- Inline: `source/particles/management/include/G4DynamicParticle.icc`
:::
