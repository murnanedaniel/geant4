# G4SingleParticleSource API Documentation

## Overview

`G4SingleParticleSource` is the fundamental building block of the General Particle Source (GPS) system. It represents a single particle source with independent position, angular, and energy distributions. While typically used internally by `G4GeneralParticleSource`, it can also be used directly for applications requiring a single source with distribution capabilities.

Each `G4SingleParticleSource` manages three distribution generators:
- **Position Distribution** (`G4SPSPosDistribution`) - Where particles are created
- **Angular Distribution** (`G4SPSAngDistribution`) - Direction of particle momentum
- **Energy Distribution** (`G4SPSEneDistribution`) - Particle energy/momentum

::: tip Header File
**Location:** `source/event/include/G4SingleParticleSource.hh`
**Source:** `source/event/src/G4SingleParticleSource.cc`
:::

## Key Features

- **Distribution Generators**: Position, angular, and energy distributions
- **Biased Random Sampling**: Support for importance sampling via `G4SPSRandomGenerator`
- **Thread-Safe**: Mutex-protected generation for shared instances
- **Flexible Configuration**: Direct C++ API and UI command support
- **Component of GPS**: Used by `G4GeneralParticleSource` to manage multiple sources

## Class Declaration

```cpp
class G4SingleParticleSource : public G4VPrimaryGenerator
{
  public:
    G4SingleParticleSource();
   ~G4SingleParticleSource() override;

    void GeneratePrimaryVertex(G4Event* evt) override;

    // Distribution accessors
    G4SPSPosDistribution* GetPosDist() const;
    G4SPSAngDistribution* GetAngDist() const;
    G4SPSEneDistribution* GetEneDist() const;
    G4SPSRandomGenerator* GetBiasRndm() const;

    // Configuration
    void SetVerbosity(G4int);

    // Particle properties
    void SetParticleDefinition(G4ParticleDefinition* aParticleDefinition);
    G4ParticleDefinition* GetParticleDefinition() const;
    void SetParticleCharge(G4double aCharge);
    void SetParticlePolarization(const G4ThreeVector& aVal);
    const G4ThreeVector& GetParticlePolarization() const;
    void SetParticleTime(G4double aTime);
    G4double GetParticleTime() const;
    void SetNumberOfParticles(G4int i);
    G4int GetNumberOfParticles() const;

    // Generated values (thread-local)
    G4ThreeVector GetParticlePosition() const;
    G4ThreeVector GetParticleMomentumDirection() const;
    G4double GetParticleEnergy() const;
};
```

## Constructor and Destructor

### Constructor
`source/event/include/G4SingleParticleSource.hh:74-76`

```cpp
G4SingleParticleSource();
```

**Purpose:** Initializes single particle source and creates distribution generators.

**Behavior:**
- Creates `G4SPSPosDistribution` for position generation
- Creates `G4SPSAngDistribution` for angular generation
- Creates `G4SPSEneDistribution` for energy generation
- Creates `G4SPSRandomGenerator` for biased sampling
- Sets default particle to geantino

**Example:**
```cpp
G4SingleParticleSource* source = new G4SingleParticleSource();
source->SetParticleDefinition(G4Electron::Definition());
```

::: tip Default Configuration
Default configuration creates point source at origin with isotropic emission and mono-energetic 1 MeV particles.
:::

### Destructor
`source/event/include/G4SingleParticleSource.hh:78`

```cpp
~G4SingleParticleSource() override;
```

**Purpose:** Cleans up distribution generators and resources.

## Primary Vertex Generation

### GeneratePrimaryVertex()
`source/event/include/G4SingleParticleSource.hh:81`

```cpp
void GeneratePrimaryVertex(G4Event* evt) override;
```

**Parameters:**
- `evt`: Event to receive generated primary vertex

**Purpose:** Generates primary particles according to configured distributions.

**Behavior:**
1. Samples position from position distribution
2. Samples direction from angular distribution
3. Samples energy from energy distribution
4. Creates `G4PrimaryVertex` at sampled position
5. Creates `NumberOfParticlesToBeGenerated` particles with sampled properties
6. Adds vertex to event

**Thread Safety:** Protected by mutex for thread-safe execution.

**Example:**
```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fSource->GeneratePrimaryVertex(event);
}
```

## Distribution Access

### GetPosDist()
`source/event/include/G4SingleParticleSource.hh:84`

```cpp
inline G4SPSPosDistribution* GetPosDist() const;
```

**Returns:** Pointer to position distribution generator

**Purpose:** Access position distribution for configuration.

**Example:**
```cpp
G4SPSPosDistribution* posDist = source->GetPosDist();
posDist->SetPosDisType("Volume");
posDist->SetPosDisShape("Sphere");
posDist->SetRadius(10*cm);
```

::: tip Direct Configuration
Direct access to distribution generators allows fine-grained control beyond standard UI commands.
:::

### GetAngDist()
`source/event/include/G4SingleParticleSource.hh:87`

```cpp
inline G4SPSAngDistribution* GetAngDist() const;
```

**Returns:** Pointer to angular distribution generator

**Purpose:** Access angular distribution for configuration.

**Example:**
```cpp
G4SPSAngDistribution* angDist = source->GetAngDist();
angDist->SetAngDistType("iso");  // Isotropic
angDist->SetMinTheta(0*deg);
angDist->SetMaxTheta(90*deg);  // Upper hemisphere only
```

### GetEneDist()
`source/event/include/G4SingleParticleSource.hh:90`

```cpp
inline G4SPSEneDistribution* GetEneDist() const;
```

**Returns:** Pointer to energy distribution generator

**Purpose:** Access energy distribution for configuration.

**Example:**
```cpp
G4SPSEneDistribution* eneDist = source->GetEneDist();
eneDist->SetEnergyDisType("Gauss");
eneDist->SetMonoEnergy(1*MeV);  // Mean
eneDist->SetBeamSigmaInE(100*keV);  // Sigma
```

### GetBiasRndm()
`source/event/include/G4SingleParticleSource.hh:93`

```cpp
inline G4SPSRandomGenerator* GetBiasRndm() const;
```

**Returns:** Pointer to biased random number generator

**Purpose:** Access random number generator for importance sampling configuration.

**Example:**
```cpp
G4SPSRandomGenerator* biasRndm = source->GetBiasRndm();
// Configure biasing (advanced usage)
```

::: info Biasing
Biasing is an advanced technique for variance reduction. Most users won't need to access this directly.
:::

## Configuration Methods

### SetVerbosity()
`source/event/include/G4SingleParticleSource.hh:96`

```cpp
void SetVerbosity(G4int);
```

**Parameters:**
- Verbosity level: 0 (quiet), 1 (normal), 2 (verbose)

**Purpose:** Controls debug output during particle generation.

**Example:**
```cpp
source->SetVerbosity(2);  // Detailed output
```

## Particle Property Methods

### SetParticleDefinition()
`source/event/include/G4SingleParticleSource.hh:99`

```cpp
void SetParticleDefinition(G4ParticleDefinition* aParticleDefinition);
```

**Parameters:**
- `aParticleDefinition`: Particle type to generate

**Purpose:** Sets particle type for generation.

**Example:**
```cpp
source->SetParticleDefinition(G4Gamma::Definition());
source->SetParticleDefinition(G4Electron::Definition());
source->SetParticleDefinition(G4Proton::Definition());

// For ions
G4ParticleDefinition* ion =
    G4IonTable::GetIonTable()->GetIon(6, 12, 0);  // C-12
source->SetParticleDefinition(ion);
```

### GetParticleDefinition()
`source/event/include/G4SingleParticleSource.hh:100-101`

```cpp
inline G4ParticleDefinition* GetParticleDefinition() const;
```

**Returns:** Current particle type definition

**Example:**
```cpp
G4ParticleDefinition* particle = source->GetParticleDefinition();
G4cout << "Particle: " << particle->GetParticleName() << G4endl;
```

### SetParticleCharge()
`source/event/include/G4SingleParticleSource.hh:104`

```cpp
inline void SetParticleCharge(G4double aCharge);
```

**Parameters:**
- `aCharge`: Particle charge in units of elementary charge

**Purpose:** Sets charge state (useful for ions).

**Example:**
```cpp
// Fully ionized carbon (C6+)
source->SetParticleCharge(6.0);
```

### SetParticlePolarization()
`source/event/include/G4SingleParticleSource.hh:107-108`

```cpp
inline void SetParticlePolarization(const G4ThreeVector& aVal);
```

**Parameters:**
- `aVal`: Polarization vector

**Purpose:** Sets particle polarization.

**Example:**
```cpp
// Linearly polarized photon
source->SetParticlePolarization(G4ThreeVector(1, 0, 0));
```

### GetParticlePolarization()
`source/event/include/G4SingleParticleSource.hh:109-110`

```cpp
inline const G4ThreeVector& GetParticlePolarization() const;
```

**Returns:** Current polarization vector

### SetParticleTime()
`source/event/include/G4SingleParticleSource.hh:113`

```cpp
inline void SetParticleTime(G4double aTime);
```

**Parameters:**
- `aTime`: Particle generation time

**Example:**
```cpp
source->SetParticleTime(10*ns);  // Delayed source
```

### GetParticleTime()
`source/event/include/G4SingleParticleSource.hh:114`

```cpp
inline G4double GetParticleTime() const;
```

**Returns:** Current particle time setting

### SetNumberOfParticles()
`source/event/include/G4SingleParticleSource.hh:117-118`

```cpp
inline void SetNumberOfParticles(G4int i);
```

**Parameters:**
- `i`: Number of particles to generate per vertex

**Example:**
```cpp
source->SetNumberOfParticles(10);  // 10 particles per event
```

### GetNumberOfParticles()
`source/event/include/G4SingleParticleSource.hh:119-120`

```cpp
inline G4int GetNumberOfParticles() const;
```

**Returns:** Number of particles per vertex

## Generated Value Access (Thread-Local)

These methods return the most recently generated values. Values are thread-local via `G4Cache`.

### GetParticlePosition()
`source/event/include/G4SingleParticleSource.hh:123-124`

```cpp
inline G4ThreeVector GetParticlePosition() const;
```

**Returns:** Position of last generated particle

**Example:**
```cpp
// After GeneratePrimaryVertex()
G4ThreeVector pos = source->GetParticlePosition();
G4cout << "Generated at: " << pos << G4endl;
```

::: info Thread-Local Values
Generated values are stored per-thread. Only valid after calling `GeneratePrimaryVertex()` in same thread.
:::

### GetParticleMomentumDirection()
`source/event/include/G4SingleParticleSource.hh:125-126`

```cpp
inline G4ThreeVector GetParticleMomentumDirection() const;
```

**Returns:** Direction of last generated particle

### GetParticleEnergy()
`source/event/include/G4SingleParticleSource.hh:127-128`

```cpp
inline G4double GetParticleEnergy() const;
```

**Returns:** Energy of last generated particle

## Usage Examples

### Basic Configuration

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fSource = new G4SingleParticleSource();

    // Set particle type
    fSource->SetParticleDefinition(G4Gamma::Definition());
    fSource->SetNumberOfParticles(1);

    // Configure position: point source
    G4SPSPosDistribution* pos = fSource->GetPosDist();
    pos->SetPosDisType("Point");
    pos->SetCentreCoords(G4ThreeVector(0, 0, 0));

    // Configure angular: isotropic
    G4SPSAngDistribution* ang = fSource->GetAngDist();
    ang->SetAngDistType("iso");

    // Configure energy: mono-energetic
    G4SPSEneDistribution* ene = fSource->GetEneDist();
    ene->SetEnergyDisType("Mono");
    ene->SetMonoEnergy(662*keV);
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fSource->GeneratePrimaryVertex(event);
}
```

### Volume Source with Energy Spectrum

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fSource = new G4SingleParticleSource();
    fSource->SetParticleDefinition(G4Electron::Definition());

    // Spherical volume source
    G4SPSPosDistribution* pos = fSource->GetPosDist();
    pos->SetPosDisType("Volume");
    pos->SetPosDisShape("Sphere");
    pos->SetRadius(5*cm);
    pos->SetCentreCoords(G4ThreeVector(0, 0, 0));

    // Isotropic emission
    G4SPSAngDistribution* ang = fSource->GetAngDist();
    ang->SetAngDistType("iso");

    // Gaussian energy distribution
    G4SPSEneDistribution* ene = fSource->GetEneDist();
    ene->SetEnergyDisType("Gauss");
    ene->SetMonoEnergy(1*MeV);      // Mean
    ene->SetBeamSigmaInE(100*keV);  // Standard deviation
}
```

### Beam Source

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fSource = new G4SingleParticleSource();
    fSource->SetParticleDefinition(G4Proton::Definition());

    // Circular beam with Gaussian profile
    G4SPSPosDistribution* pos = fSource->GetPosDist();
    pos->SetPosDisType("Beam");
    pos->SetPosDisShape("Circle");
    pos->SetRadius(5*mm);
    pos->SetBeamSigmaInR(2*mm);  // Gaussian beam profile
    pos->SetCentreCoords(G4ThreeVector(0, 0, -50*cm));

    // Beam with angular divergence
    G4SPSAngDistribution* ang = fSource->GetAngDist();
    ang->SetAngDistType("beam2d");
    ang->SetBeamSigmaInAngR(2*mrad);  // Radial divergence
    ang->SetBeamSigmaInAngX(1*mrad);  // X divergence
    ang->SetBeamSigmaInAngY(1*mrad);  // Y divergence
    ang->DefineAngRefAxes("angref1", G4ThreeVector(0, 0, 1));

    // Mono-energetic
    G4SPSEneDistribution* ene = fSource->GetEneDist();
    ene->SetEnergyDisType("Mono");
    ene->SetMonoEnergy(200*MeV);
}
```

### Surface Source with Cosine-Law Emission

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fSource = new G4SingleParticleSource();
    fSource->SetParticleDefinition(G4Neutron::Definition());

    // Cylindrical surface
    G4SPSPosDistribution* pos = fSource->GetPosDist();
    pos->SetPosDisType("Surface");
    pos->SetPosDisShape("Cylinder");
    pos->SetRadius(10*cm);
    pos->SetHalfZ(20*cm);
    pos->SetCentreCoords(G4ThreeVector(0, 0, 0));

    // Cosine-law angular distribution (inward)
    G4SPSAngDistribution* ang = fSource->GetAngDist();
    ang->SetAngDistType("cos");
    ang->SetMinTheta(0*deg);
    ang->SetMaxTheta(90*deg);

    // Energy spectrum
    G4SPSEneDistribution* ene = fSource->GetEneDist();
    ene->SetEnergyDisType("Pow");
    ene->SetEmin(0.1*MeV);
    ene->SetEmax(10*MeV);
    ene->SetAlpha(-1.0);  // E^-1 spectrum
}
```

### Multiple Particles per Vertex

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fSource = new G4SingleParticleSource();

    // Generate 5 correlated photons per event
    fSource->SetParticleDefinition(G4Gamma::Definition());
    fSource->SetNumberOfParticles(5);

    // Point source
    G4SPSPosDistribution* pos = fSource->GetPosDist();
    pos->SetPosDisType("Point");
    pos->SetCentreCoords(G4ThreeVector(0, 0, 0));

    // Isotropic
    G4SPSAngDistribution* ang = fSource->GetAngDist();
    ang->SetAngDistType("iso");

    // Fixed energy
    G4SPSEneDistribution* ene = fSource->GetEneDist();
    ene->SetEnergyDisType("Mono");
    ene->SetMonoEnergy(511*keV);
}
```

### Checking Generated Values

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fSource->GeneratePrimaryVertex(event);

    // Access generated values (for diagnostics/analysis)
    G4ThreeVector pos = fSource->GetParticlePosition();
    G4ThreeVector dir = fSource->GetParticleMomentumDirection();
    G4double energy = fSource->GetParticleEnergy();

    G4cout << "Generated particle:" << G4endl;
    G4cout << "  Position: " << pos/cm << " cm" << G4endl;
    G4cout << "  Direction: " << dir << G4endl;
    G4cout << "  Energy: " << energy/MeV << " MeV" << G4endl;
}
```

## Thread Safety

`source/event/include/G4SingleParticleSource.hh:36-46`

### Thread-Safe Design

**Key Points:**
- `G4SingleParticleSource` instances can be shared among threads
- `GeneratePrimaryVertex()` is protected via mutex
- Underlying generators (`G4SPS*Distribution`) are not assumed thread-safe
- Internal status changes by master thread only (via UI commands)
- Set methods should only be called by one thread
- Set methods should be called before run starts, not during event loop

::: warning Thread Safety Rules
1. **Only master thread** should use set-methods for configuration
2. **Configure before run starts** - not during event loop
3. **Worker threads** only call `GeneratePrimaryVertex()`
4. **Shared instances** protected by internal mutex
:::

**Data Members:**
`source/event/include/G4SingleParticleSource.hh:159`

```cpp
private:
    G4Mutex mutex;  // Protects GeneratePrimaryVertex
```

**Thread-Local Cache:**
`source/event/include/G4SingleParticleSource.hh:141-149`

```cpp
struct part_prop_t
{
    G4ParticleMomentum momentum_direction;
    G4double energy;
    G4ThreeVector position;
};

G4Cache<part_prop_t> ParticleProperties;  // Thread-local
```

## Protected Data Members

`source/event/include/G4SingleParticleSource.hh:133-157`

```cpp
private:
    G4SPSPosDistribution* posGenerator = nullptr;
    G4SPSAngDistribution* angGenerator = nullptr;
    G4SPSEneDistribution* eneGenerator = nullptr;
    G4SPSRandomGenerator* biasRndm = nullptr;

    G4Cache<part_prop_t> ParticleProperties;  // Thread-local
    G4int NumberOfParticlesToBeGenerated;
    G4ParticleDefinition* definition = nullptr;
    G4double charge;
    G4double time;
    G4ThreeVector polarization;
    G4int verbosityLevel;

    G4Mutex mutex;  // Thread safety
```

## Distribution Generators

`G4SingleParticleSource` owns and manages three distribution generators:

### G4SPSPosDistribution
Controls spatial distribution of particle generation:
- **Types**: Point, Beam, Plane, Surface, Volume
- **Shapes**: Circle, Sphere, Cylinder, Box, etc.
- **Confinement**: Can confine to specific volumes

### G4SPSAngDistribution
Controls angular distribution of particle momentum:
- **Types**: Isotropic, Cosine-law, Beam, User-defined
- **Angular Ranges**: Min/max theta and phi
- **Beam Divergence**: Gaussian spreading

### G4SPSEneDistribution
Controls energy/momentum distribution:
- **Types**: Mono, Linear, Power-law, Exponential, Gaussian, Bremsstrahlung, etc.
- **Histograms**: Arbitrary user-defined spectra
- **Differential/Integral**: Support for both spectrum types

## Performance Considerations

1. **Distribution Complexity**: Volume/surface sampling slower than point sources
2. **Mutex Overhead**: Thread synchronization adds minimal overhead
3. **Number of Particles**: Generating N particles per vertex is efficient
4. **Biasing**: Can significantly improve efficiency for specific geometries

## Comparison with G4ParticleGun

| Feature | G4ParticleGun | G4SingleParticleSource |
|---------|---------------|------------------------|
| **Complexity** | Simple | Moderate |
| **Distributions** | None (fixed) | Full support |
| **Configuration** | Basic setters | Distribution objects |
| **Thread Safety** | Thread-local | Mutex-protected (shared) |
| **Performance** | Fastest | Slightly slower |
| **Flexibility** | Limited | Extensive |

## See Also

- [G4GeneralParticleSource](g4generalparticlesource.md) - GPS manager (uses this class)
- [G4ParticleGun](g4particlegun.md) - Simple alternative
- [G4VPrimaryGenerator](g4vprimarygenerator.md) - Base class
- [G4VUserPrimaryGeneratorAction](../../run/api/g4vuserprimarygeneratoraction.md) - User action interface
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4SingleParticleSource.hh`
- Source: `source/event/src/G4SingleParticleSource.cc`
- Position: `source/event/include/G4SPSPosDistribution.hh`
- Angular: `source/event/include/G4SPSAngDistribution.hh`
- Energy: `source/event/include/G4SPSEneDistribution.hh`
:::
