# G4ParticleGun API Documentation

## Overview

`G4ParticleGun` is a concrete implementation of `G4VPrimaryGenerator` that provides a simple and efficient way to generate primary particles for simulation. It shoots a specified number of particles of a given type in a defined direction with either a specified kinetic energy or momentum. All particles generated in a single call have identical properties.

This is the most commonly used primary generator for basic simulations and is ideal when you need consistent, well-defined particle beams without complex distributions.

::: tip Header File
**Location:** `source/event/include/G4ParticleGun.hh`
**Source:** `source/event/src/G4ParticleGun.cc`
:::

## Key Characteristics

- **Simple Interface**: Easy to configure with straightforward setters
- **Single Particle Type**: All particles in one vertex have same properties
- **No Built-in Randomization**: Position, direction, and energy must be randomized in user code
- **Efficient**: Minimal overhead for generating particles
- **UI Commands**: Configurable via macro commands through messenger

## Class Declaration

```cpp
class G4ParticleGun : public G4VPrimaryGenerator
{
  public:
    G4ParticleGun();
    explicit G4ParticleGun(G4int numberofparticles);
    explicit G4ParticleGun(G4ParticleDefinition* particleDef,
                  G4int numberofparticles = 1);
    ~G4ParticleGun() override;

    void GeneratePrimaryVertex(G4Event* evt) override;

    // Particle configuration setters
    void SetParticleDefinition(G4ParticleDefinition* aParticleDefinition);
    void SetParticleEnergy(G4double aKineticEnergy);
    void SetParticleMomentum(G4double aMomentum);
    void SetParticleMomentum(G4ParticleMomentum aMomentum);
    void SetParticleMomentumDirection(G4ParticleMomentum aMomDirection);
    void SetParticleCharge(G4double aCharge);
    void SetParticlePolarization(G4ThreeVector aVal);
    void SetNumberOfParticles(G4int i);
    void SetParticleWeight(G4double w);

    // Getters
    G4ParticleDefinition* GetParticleDefinition() const;
    G4ParticleMomentum GetParticleMomentumDirection() const;
    G4double GetParticleEnergy() const;
    G4double GetParticleMomentum() const;
    G4double GetParticleCharge() const;
    G4ThreeVector GetParticlePolarization() const;
    G4int GetNumberOfParticles() const;
    G4double GetParticleWeight() const;
};
```

## Constructors and Destructor

### Default Constructor
`source/event/include/G4ParticleGun.hh:68`

```cpp
G4ParticleGun();
```

**Purpose:** Creates particle gun with default initialization (0 particles)

**Example:**
```cpp
G4ParticleGun* gun = new G4ParticleGun();
gun->SetNumberOfParticles(1);
gun->SetParticleDefinition(G4Electron::Definition());
```

### Constructor with Particle Count
`source/event/include/G4ParticleGun.hh:69`

```cpp
explicit G4ParticleGun(G4int numberofparticles);
```

**Parameters:**
- `numberofparticles`: Number of particles to generate per vertex

**Example:**
```cpp
// Generate 5 identical particles per event
G4ParticleGun* gun = new G4ParticleGun(5);
gun->SetParticleDefinition(G4Gamma::Definition());
```

### Constructor with Particle Definition
`source/event/include/G4ParticleGun.hh:70-71`

```cpp
explicit G4ParticleGun(G4ParticleDefinition* particleDef,
              G4int numberofparticles = 1);
```

**Parameters:**
- `particleDef`: Particle type to generate
- `numberofparticles`: Number of particles (default = 1)

**Example:**
```cpp
// Most common usage: single electron gun
G4ParticleGun* gun = new G4ParticleGun(
    G4Electron::Definition(), 1);
```

::: tip Recommended Constructor
The third constructor is most commonly used as it initializes both particle type and count in one call.
:::

### Destructor
`source/event/include/G4ParticleGun.hh:76`

```cpp
~G4ParticleGun() override;
```

**Purpose:** Cleans up messenger and resources

## Primary Vertex Generation

### GeneratePrimaryVertex()
`source/event/include/G4ParticleGun.hh:83-85`

```cpp
void GeneratePrimaryVertex(G4Event* evt) override;
```

**Parameters:**
- `evt`: Event to which primary vertex will be added

**Purpose:** Creates primary vertex at specified position and time, populates it with the configured number of particles, and adds to event.

**Behavior:**
- Creates one `G4PrimaryVertex` at (`particle_position`, `particle_time`)
- Creates `NumberOfParticlesToBeGenerated` identical particles
- All particles have same energy, direction, charge, polarization
- Vertex added to event via `evt->AddPrimaryVertex()`

**Example:**
```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // All configuration done in constructor/earlier
    fParticleGun->GeneratePrimaryVertex(event);
}
```

::: warning Multiple Particles
If you need particles with *different* properties, call `GeneratePrimaryVertex()` multiple times with different gun settings, or use `G4GeneralParticleSource`.
:::

## Particle Configuration

### SetParticleDefinition()
`source/event/include/G4ParticleGun.hh:92`

```cpp
void SetParticleDefinition(G4ParticleDefinition* aParticleDefinition);
```

**Parameters:**
- `aParticleDefinition`: Pointer to particle type definition

**Purpose:** Sets the particle type to be generated. This should be called before other setters.

**Example:**
```cpp
// Common particles
gun->SetParticleDefinition(G4Electron::Definition());
gun->SetParticleDefinition(G4Positron::Definition());
gun->SetParticleDefinition(G4Gamma::Definition());
gun->SetParticleDefinition(G4Proton::Definition());
gun->SetParticleDefinition(G4Neutron::Definition());
gun->SetParticleDefinition(G4MuonMinus::Definition());

// Ions (see Ion example section below)
G4ParticleDefinition* ion = G4IonTable::GetIonTable()->GetIon(6, 12, 0);
gun->SetParticleDefinition(ion);  // Carbon-12
```

::: tip Particle Table
All standard particles are available via their static `Definition()` methods. Ions are accessed through `G4IonTable`.
:::

### SetParticleEnergy()
`source/event/include/G4ParticleGun.hh:93`

```cpp
void SetParticleEnergy(G4double aKineticEnergy);
```

**Parameters:**
- `aKineticEnergy`: Kinetic energy of particles (in Geant4 internal energy units)

**Purpose:** Sets particle kinetic energy. Internally updates momentum.

**Example:**
```cpp
gun->SetParticleEnergy(1*MeV);
gun->SetParticleEnergy(10*GeV);
gun->SetParticleEnergy(100*keV);
```

::: info Energy vs Momentum
You can set either energy or momentum - they are kept consistent. Setting one automatically updates the other using particle mass.
:::

### SetParticleMomentum()
`source/event/include/G4ParticleGun.hh:94-95`

```cpp
void SetParticleMomentum(G4double aMomentum);
void SetParticleMomentum(G4ParticleMomentum aMomentum);
```

**Parameters:**
- `aMomentum`: Momentum magnitude or 3-vector

**Purpose:** Sets particle momentum. The vector version also sets direction.

**Example:**
```cpp
// Set magnitude only (direction set separately)
gun->SetParticleMomentum(5*GeV);

// Set full momentum vector (magnitude and direction)
gun->SetParticleMomentum(G4ThreeVector(1*GeV, 0, 3*GeV));
```

### SetParticleMomentumDirection()
`source/event/include/G4ParticleGun.hh:96-97`

```cpp
inline void SetParticleMomentumDirection(G4ParticleMomentum aMomDirection);
```

**Parameters:**
- `aMomDirection`: Direction vector (automatically normalized to unit vector)

**Purpose:** Sets the direction of particle momentum. Vector is normalized internally.

**Example:**
```cpp
// Along positive z-axis
gun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));

// At 45 degrees in x-z plane
gun->SetParticleMomentumDirection(G4ThreeVector(1, 0, 1));  // Auto-normalized

// Completely random direction
G4double cosTheta = 2*G4UniformRand() - 1;
G4double sinTheta = std::sqrt(1 - cosTheta*cosTheta);
G4double phi = 2*M_PI*G4UniformRand();
G4ThreeVector direction(sinTheta*std::cos(phi),
                        sinTheta*std::sin(phi),
                        cosTheta);
gun->SetParticleMomentumDirection(direction);
```

### SetParticleCharge()
`source/event/include/G4ParticleGun.hh:98-99`

```cpp
inline void SetParticleCharge(G4double aCharge);
```

**Parameters:**
- `aCharge`: Particle charge in units of elementary charge

**Purpose:** Sets particle charge. Useful for ions with non-default charge states.

**Example:**
```cpp
// Fully ionized carbon (C6+)
gun->SetParticleCharge(6.0);

// Partially ionized oxygen (O6+)
gun->SetParticleCharge(6.0);
```

::: tip Automatic Charge
For standard particles, charge is automatically set from particle definition. Only needed for special charge states.
:::

### SetParticlePolarization()
`source/event/include/G4ParticleGun.hh:100-101`

```cpp
inline void SetParticlePolarization(G4ThreeVector aVal);
```

**Parameters:**
- `aVal`: Polarization vector

**Purpose:** Sets particle polarization for particles that support it (photons, electrons with polarized processes).

**Example:**
```cpp
// Linearly polarized photon along x-axis
gun->SetParticleDefinition(G4Gamma::Definition());
gun->SetParticlePolarization(G4ThreeVector(1, 0, 0));
```

### SetNumberOfParticles()
`source/event/include/G4ParticleGun.hh:102-103`

```cpp
inline void SetNumberOfParticles(G4int i);
```

**Parameters:**
- `i`: Number of identical particles to generate per vertex

**Example:**
```cpp
// Generate 10 identical particles per event
gun->SetNumberOfParticles(10);
```

### SetParticleWeight()
`source/event/include/G4ParticleGun.hh:104-105`

```cpp
inline void SetParticleWeight(G4double w);
```

**Parameters:**
- `w`: Statistical weight for variance reduction

**Purpose:** Sets particle weight for biased simulations and variance reduction techniques.

**Example:**
```cpp
gun->SetParticleWeight(0.5);  // Half weight for biasing
```

::: info Variance Reduction
Weight is typically 1.0 for normal simulations. Used in advanced techniques like importance sampling.
:::

## Getter Methods

All getter methods return current gun configuration:

### GetParticleDefinition()
`source/event/include/G4ParticleGun.hh:107-108`
```cpp
inline G4ParticleDefinition* GetParticleDefinition() const;
```

### GetParticleMomentumDirection()
`source/event/include/G4ParticleGun.hh:109-110`
```cpp
inline G4ParticleMomentum GetParticleMomentumDirection() const;
```

### GetParticleEnergy()
`source/event/include/G4ParticleGun.hh:111-112`
```cpp
inline G4double GetParticleEnergy() const;
```

### GetParticleMomentum()
`source/event/include/G4ParticleGun.hh:113-114`
```cpp
inline G4double GetParticleMomentum() const;
```

### GetParticleCharge()
`source/event/include/G4ParticleGun.hh:115-116`
```cpp
inline G4double GetParticleCharge() const;
```

### GetParticlePolarization()
`source/event/include/G4ParticleGun.hh:117-118`
```cpp
inline G4ThreeVector GetParticlePolarization() const;
```

### GetNumberOfParticles()
`source/event/include/G4ParticleGun.hh:119-120`
```cpp
inline G4int GetNumberOfParticles() const;
```

### GetParticleWeight()
`source/event/include/G4ParticleGun.hh:121-122`
```cpp
inline G4double GetParticleWeight() const;
```

## Usage Examples

### Basic Electron Beam

```cpp
class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction()
    {
        fParticleGun = new G4ParticleGun(1);

        // Configure electron beam
        fParticleGun->SetParticleDefinition(G4Electron::Definition());
        fParticleGun->SetParticleEnergy(10*GeV);
        fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));
        fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, -10*cm));
    }

    ~MyPrimaryGeneratorAction() override
    {
        delete fParticleGun;
    }

    void GeneratePrimaries(G4Event* event) override
    {
        fParticleGun->GeneratePrimaryVertex(event);
    }

  private:
    G4ParticleGun* fParticleGun;
};
```

### Randomized Energy and Direction

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Randomize energy between 1-10 GeV
    G4double energy = (1 + 9*G4UniformRand())*GeV;
    fParticleGun->SetParticleEnergy(energy);

    // Randomize direction within 5-degree cone along z-axis
    G4double maxTheta = 5*deg;
    G4double theta = maxTheta * std::sqrt(G4UniformRand());
    G4double phi = 2*M_PI * G4UniformRand();

    G4double sinTheta = std::sin(theta);
    G4ThreeVector direction(
        sinTheta * std::cos(phi),
        sinTheta * std::sin(phi),
        std::cos(theta)
    );
    fParticleGun->SetParticleMomentumDirection(direction);

    // Generate vertex
    fParticleGun->GeneratePrimaryVertex(event);
}
```

### Photon Gun (Gamma Source)

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);

    // Monoenergetic gamma source (e.g., Co-60)
    fParticleGun->SetParticleDefinition(G4Gamma::Definition());
    fParticleGun->SetParticleEnergy(1.173*MeV);
    fParticleGun->SetParticleMomentumDirection(G4ThreeVector(1, 0, 0));
    fParticleGun->SetParticlePosition(G4ThreeVector(-50*cm, 0, 0));
}
```

### Polarized Photon Beam

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);

    // Linearly polarized X-rays
    fParticleGun->SetParticleDefinition(G4Gamma::Definition());
    fParticleGun->SetParticleEnergy(100*keV);
    fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));
    fParticleGun->SetParticlePolarization(G4ThreeVector(1, 0, 0));  // Polarized along x
    fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, -10*cm));
}
```

### Ion Beam (Carbon-12)

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);

    // Get Carbon-12 ion from ion table
    G4int Z = 6;   // Atomic number
    G4int A = 12;  // Mass number
    G4double excitationEnergy = 0.0;
    G4ParticleDefinition* ion =
        G4IonTable::GetIonTable()->GetIon(Z, A, excitationEnergy);

    fParticleGun->SetParticleDefinition(ion);
    fParticleGun->SetParticleCharge(6.0);  // Fully ionized
    fParticleGun->SetParticleEnergy(400*MeV);  // Per nucleon: 400/12 = 33.3 MeV/u
    fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));
    fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, -1*m));
}
```

### Proton Therapy Beam

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);

    // Clinical proton beam
    fParticleGun->SetParticleDefinition(G4Proton::Definition());
    fParticleGun->SetParticleEnergy(150*MeV);  // Typical therapy energy
    fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));
    fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, -30*cm));
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Add beam divergence (2 mrad)
    G4double sigma = 2*mrad;
    G4double theta = G4RandGauss::shoot(0, sigma);
    G4double phi = 2*M_PI * G4UniformRand();

    G4ThreeVector direction(
        std::sin(theta) * std::cos(phi),
        std::sin(theta) * std::sin(phi),
        std::cos(theta)
    );
    fParticleGun->SetParticleMomentumDirection(direction);

    // Add beam spot size (5 mm Gaussian)
    G4double spotSize = 5*mm;
    G4double x = G4RandGauss::shoot(0, spotSize);
    G4double y = G4RandGauss::shoot(0, spotSize);
    fParticleGun->SetParticlePosition(G4ThreeVector(x, y, -30*cm));

    fParticleGun->GeneratePrimaryVertex(event);
}
```

### Neutron Source

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);

    // Neutron source
    fParticleGun->SetParticleDefinition(G4Neutron::Definition());
    fParticleGun->SetParticleEnergy(14*MeV);  // D-T neutron
    fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, 0));
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Isotropic emission
    G4double cosTheta = 2*G4UniformRand() - 1;
    G4double sinTheta = std::sqrt(1 - cosTheta*cosTheta);
    G4double phi = 2*M_PI*G4UniformRand();

    G4ThreeVector direction(
        sinTheta*std::cos(phi),
        sinTheta*std::sin(phi),
        cosTheta
    );
    fParticleGun->SetParticleMomentumDirection(direction);

    fParticleGun->GeneratePrimaryVertex(event);
}
```

### Multiple Particles per Event

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    // Generate 5 identical muons per event (e.g., cosmic ray shower)
    fParticleGun = new G4ParticleGun(5);

    fParticleGun->SetParticleDefinition(G4MuonMinus::Definition());
    fParticleGun->SetParticleEnergy(4*GeV);
    fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0, 0, -1));
    fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, 10*m));
}
```

### Event-by-Event Particle Type Change

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Alternate between electrons and positrons
    if (event->GetEventID() % 2 == 0) {
        fParticleGun->SetParticleDefinition(G4Electron::Definition());
    } else {
        fParticleGun->SetParticleDefinition(G4Positron::Definition());
    }

    fParticleGun->SetParticleEnergy(10*GeV);
    fParticleGun->GeneratePrimaryVertex(event);
}
```

## UI Commands

`G4ParticleGun` can be configured via macro commands through `G4ParticleGunMessenger`:

```bash
# Set particle type
/gun/particle e-
/gun/particle gamma
/gun/particle proton

# Set energy and momentum
/gun/energy 10 GeV
/gun/momentum 5 GeV

# Set direction
/gun/direction 0 0 1
/gun/direction 1 1 0

# Set position (from base class)
/gun/position 0 0 -10 cm

# Set number of particles
/gun/number 1

# Ion-specific commands
/gun/ion 6 12 0    # Z A Q (Carbon-12, fully ionized)
/gun/ionCharge 6   # Charge state
```

**Example Macro:**
```bash
# run.mac
/gun/particle e-
/gun/energy 1 GeV
/gun/position 0 0 -50 cm
/gun/direction 0 0 1
/run/beamOn 1000
```

## Thread Safety

### Multi-Threading Behavior

In multi-threaded Geant4:
- Each worker thread has its own `G4ParticleGun` instance
- Created via thread-local `G4VUserPrimaryGeneratorAction`
- No synchronization needed - completely thread-safe
- UI commands execute on master, settings propagated to workers

**Thread-Safe Usage:**
```cpp
// Automatically thread-local via G4VUserPrimaryGeneratorAction
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);  // Per-thread instance
}
```

::: tip No Shared State
Each thread's particle gun is completely independent, ensuring thread safety without locking.
:::

## Performance Considerations

1. **Efficient for Simple Cases**: Minimal overhead for generating fixed-property particles
2. **Avoid Excessive Reconfiguration**: Set static properties in constructor, randomize only what changes
3. **Single vs Multiple Particles**: Using `SetNumberOfParticles(N)` is more efficient than calling `GeneratePrimaryVertex()` N times
4. **Messenger Overhead**: Direct C++ setters are faster than UI commands (use UI for initialization only)

## Limitations

::: warning Design Limitations
1. **No Built-in Randomization**: Must implement in user code
2. **Identical Particles**: All particles in one vertex have same properties
3. **No Complex Distributions**: No spatial, angular, or energy distributions (use GPS for that)
4. **Single Vertex**: Creates only one vertex per call
:::

**When to Use Something Else:**
- Complex source geometries → Use `G4GeneralParticleSource`
- External generator files → Use `G4HEPEvtInterface`
- Multiple particle types → Call gun multiple times or use GPS
- Correlated particles → Create multiple vertices manually

## See Also

- [G4VPrimaryGenerator](g4vprimarygenerator.md) - Base class interface
- [G4GeneralParticleSource](g4generalparticlesource.md) - Advanced particle source with distributions
- [G4VUserPrimaryGeneratorAction](../../run/api/g4vuserprimarygeneratoraction.md) - User action interface
- [G4Event](g4event.md) - Event container
- [G4PrimaryVertex](g4primaryvertex.md) - Primary vertex class
- [G4PrimaryParticle](g4primaryparticle.md) - Primary particle class
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4ParticleGun.hh`
- Source: `source/event/src/G4ParticleGun.cc`
- Messenger: `source/event/include/G4ParticleGunMessenger.hh`
:::
