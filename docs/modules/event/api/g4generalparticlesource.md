# G4GeneralParticleSource API Documentation

## Overview

`G4GeneralParticleSource` (GPS) is an advanced primary particle generator designed to replace `G4ParticleGun` for complex simulation scenarios. It supports multiple independent particle sources, each with customizable position, angular, and energy distributions. GPS is ideal for realistic source modeling including point sources, beams, surface sources, and volume sources.

GPS provides extensive configuration options through UI commands, making it highly flexible without requiring code changes.

::: tip Header File
**Location:** `source/event/include/G4GeneralParticleSource.hh`
**Source:** `source/event/src/G4GeneralParticleSource.cc`
:::

## Key Features

- **Multiple Sources**: Define and manage multiple independent particle sources
- **Position Distributions**: Point, beam, plane, surface, volume sources
- **Angular Distributions**: Isotropic, cosine-law, beam, user-defined
- **Energy Distributions**: Mono-energetic, linear, power-law, exponential, Gaussian, arbitrary histograms
- **Source Intensity**: Weight different sources by relative intensity
- **Thread-Safe**: Designed for multi-threaded Geant4 applications
- **UI Configuration**: Extensive macro command interface

## Class Declaration

```cpp
class G4GeneralParticleSource : public G4VPrimaryGenerator
{
  public:
    G4GeneralParticleSource();
   ~G4GeneralParticleSource() override;

    void GeneratePrimaryVertex(G4Event*) override;

    // Source management
    G4int GetNumberofSource();
    void ListSource();
    void SetCurrentSourceto(G4int);
    void SetCurrentSourceIntensity(G4double);
    G4SingleParticleSource* GetCurrentSource() const;
    G4int GetCurrentSourceIndex() const;
    G4double GetCurrentSourceIntensity() const;
    void ClearAll();
    void AddaSource(G4double);
    void DeleteaSource(G4int);

    // Configuration
    void SetVerbosity(G4int i);
    void SetMultipleVertex(G4bool av);
    void SetFlatSampling(G4bool av);

    // Particle properties (delegated to current source)
    void SetParticleDefinition(G4ParticleDefinition* aPDef);
    G4ParticleDefinition* GetParticleDefinition() const;
    void SetParticleCharge(G4double aCharge);
    void SetParticlePolarization(G4ThreeVector aVal);
    G4ThreeVector GetParticlePolarization() const;
    void SetParticleTime(G4double aTime);
    G4double GetParticleTime() const;
    void SetNumberOfParticles(G4int i);
    G4int GetNumberOfParticles() const;
    G4ThreeVector GetParticlePosition() const;
    G4ThreeVector GetParticleMomentumDirection() const;
    G4double GetParticleEnergy() const;
};
```

## Constructor and Destructor

### Constructor
`source/event/include/G4GeneralParticleSource.hh:62-64`

```cpp
G4GeneralParticleSource();
```

**Purpose:** Initializes GPS and creates messenger for UI commands. Automatically creates one default source.

**Example:**
```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fGPS = new G4GeneralParticleSource();
    // Default source created automatically
}
```

::: tip Default Source
GPS always has at least one source. The default source is created automatically on construction.
:::

### Destructor
`source/event/include/G4GeneralParticleSource.hh:66`

```cpp
~G4GeneralParticleSource() override;
```

**Purpose:** Cleans up messenger and all particle sources.

## Primary Vertex Generation

### GeneratePrimaryVertex()
`source/event/include/G4GeneralParticleSource.hh:69`

```cpp
void GeneratePrimaryVertex(G4Event*) override;
```

**Parameters:**
- Event pointer to add primary vertices

**Purpose:** Generates primary particles according to configured source(s).

**Behavior:**
- Selects source based on intensity weights
- Generates particles from selected source
- Can create multiple vertices if `SetMultipleVertex(true)` enabled
- Thread-safe with internal locking

**Example:**
```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fGPS->GeneratePrimaryVertex(event);
}
```

## Source Management

### GetNumberofSource()
`source/event/include/G4GeneralParticleSource.hh:71`

```cpp
inline G4int GetNumberofSource();
```

**Returns:** Total number of defined particle sources

**Example:**
```cpp
G4int nSources = gps->GetNumberofSource();
G4cout << "Number of sources: " << nSources << G4endl;
```

### ListSource()
`source/event/include/G4GeneralParticleSource.hh:74`

```cpp
void ListSource();
```

**Purpose:** Prints list of all defined sources with their properties to console.

**Example:**
```cpp
gps->ListSource();
// Output:
// Source 0: Intensity = 1.0, Particle = e-
// Source 1: Intensity = 0.5, Particle = gamma
```

### SetCurrentSourceto()
`source/event/include/G4GeneralParticleSource.hh:77`

```cpp
void SetCurrentSourceto(G4int);
```

**Parameters:**
- Source index (0-based)

**Purpose:** Switches current source for configuration. Subsequent configuration commands apply to this source.

**Example:**
```cpp
// Configure first source (electron)
gps->SetCurrentSourceto(0);
gps->SetParticleDefinition(G4Electron::Definition());

// Add and configure second source (photon)
gps->AddaSource(0.5);
gps->SetCurrentSourceto(1);
gps->SetParticleDefinition(G4Gamma::Definition());
```

::: tip Current Source
Most configuration methods operate on the "current source". Always set the current source before configuring.
:::

### SetCurrentSourceIntensity()
`source/event/include/G4GeneralParticleSource.hh:81`

```cpp
void SetCurrentSourceIntensity(G4double);
```

**Parameters:**
- Relative intensity weight

**Purpose:** Sets intensity of current source for weighted sampling.

**Example:**
```cpp
// Source 0: 70% of events
gps->SetCurrentSourceto(0);
gps->SetCurrentSourceIntensity(0.7);

// Source 1: 30% of events
gps->SetCurrentSourceto(1);
gps->SetCurrentSourceIntensity(0.3);
```

### GetCurrentSource()
`source/event/include/G4GeneralParticleSource.hh:84-85`

```cpp
inline G4SingleParticleSource* GetCurrentSource() const;
```

**Returns:** Pointer to current `G4SingleParticleSource`

**Purpose:** Direct access to current source for advanced configuration.

**Example:**
```cpp
G4SingleParticleSource* source = gps->GetCurrentSource();
G4SPSPosDistribution* posGen = source->GetPosDist();
posGen->SetPosDisType("Volume");
```

### GetCurrentSourceIndex()
`source/event/include/G4GeneralParticleSource.hh:87-88`

```cpp
inline G4int GetCurrentSourceIndex() const;
```

**Returns:** Index of current source (0-based)

### GetCurrentSourceIntensity()
`source/event/include/G4GeneralParticleSource.hh:90-91`

```cpp
inline G4double GetCurrentSourceIntensity() const;
```

**Returns:** Intensity weight of current source

### ClearAll()
`source/event/include/G4GeneralParticleSource.hh:94`

```cpp
void ClearAll();
```

**Purpose:** Removes all defined sources. Creates new default source.

**Example:**
```cpp
// Reset GPS to clean state
gps->ClearAll();
```

### AddaSource()
`source/event/include/G4GeneralParticleSource.hh:96`

```cpp
void AddaSource(G4double);
```

**Parameters:**
- Relative intensity of new source

**Purpose:** Adds new particle source with specified intensity. New source becomes current source.

**Example:**
```cpp
// Add second source with intensity 0.5
gps->AddaSource(0.5);
// Now configure this new source
gps->SetParticleDefinition(G4Gamma::Definition());
```

### DeleteaSource()
`source/event/include/G4GeneralParticleSource.hh:98`

```cpp
void DeleteaSource(G4int);
```

**Parameters:**
- Index of source to delete

**Purpose:** Removes specified source from GPS.

**Example:**
```cpp
gps->DeleteaSource(1);  // Remove second source
```

::: warning Cannot Delete Last Source
GPS must have at least one source. Deleting the last source will cause an error.
:::

## Configuration Methods

### SetVerbosity()
`source/event/include/G4GeneralParticleSource.hh:101`

```cpp
inline void SetVerbosity(G4int i);
```

**Parameters:**
- `i`: Verbosity level (0 = quiet, 1 = normal, 2 = verbose)

**Purpose:** Controls debug output during particle generation.

**Example:**
```cpp
gps->SetVerbosity(2);  // Detailed output
```

### SetMultipleVertex()
`source/event/include/G4GeneralParticleSource.hh:104`

```cpp
inline void SetMultipleVertex(G4bool av);
```

**Parameters:**
- `av`: `true` to enable multiple vertices per event

**Purpose:** When enabled, generates one vertex from each source per event instead of selecting one source.

**Example:**
```cpp
// Generate particles from all sources in each event
gps->SetMultipleVertex(true);
```

::: info Multiple Vertices
Useful for simulating coincident sources (e.g., paired gammas from annihilation) or complex experimental setups.
:::

### SetFlatSampling()
`source/event/include/G4GeneralParticleSource.hh:107-108`

```cpp
inline void SetFlatSampling(G4bool av);
```

**Parameters:**
- `av`: `true` for uniform sampling across sources

**Purpose:** Enables flat sampling mode where all sources are sampled uniformly regardless of intensity (intensities used as event weights instead).

**Example:**
```cpp
gps->SetFlatSampling(true);
```

## Particle Property Methods

These methods configure the current source's particle properties:

### SetParticleDefinition()
`source/event/include/G4GeneralParticleSource.hh:111-112`

```cpp
inline void SetParticleDefinition(G4ParticleDefinition* aPDef);
```

**Parameters:**
- `aPDef`: Particle type definition

**Example:**
```cpp
gps->SetParticleDefinition(G4Electron::Definition());
```

### GetParticleDefinition()
`source/event/include/G4GeneralParticleSource.hh:113-114`

```cpp
inline G4ParticleDefinition* GetParticleDefinition() const;
```

**Returns:** Current source's particle definition

### SetParticleCharge()
`source/event/include/G4GeneralParticleSource.hh:117-118`

```cpp
inline void SetParticleCharge(G4double aCharge);
```

**Parameters:**
- `aCharge`: Particle charge state

### SetParticlePolarization()
`source/event/include/G4GeneralParticleSource.hh:121-122`

```cpp
inline void SetParticlePolarization(G4ThreeVector aVal);
```

**Parameters:**
- `aVal`: Polarization vector

### GetParticlePolarization()
`source/event/include/G4GeneralParticleSource.hh:123-124`

```cpp
inline G4ThreeVector GetParticlePolarization() const;
```

**Returns:** Current source's polarization

### SetParticleTime()
`source/event/include/G4GeneralParticleSource.hh:127-128`

```cpp
inline void SetParticleTime(G4double aTime);
```

**Parameters:**
- `aTime`: Particle generation time

### GetParticleTime()
`source/event/include/G4GeneralParticleSource.hh:129-130`

```cpp
inline G4double GetParticleTime() const;
```

**Returns:** Current source's particle time

### SetNumberOfParticles()
`source/event/include/G4GeneralParticleSource.hh:133-134`

```cpp
inline void SetNumberOfParticles(G4int i);
```

**Parameters:**
- `i`: Number of particles per vertex

### GetNumberOfParticles()
`source/event/include/G4GeneralParticleSource.hh:135-136`

```cpp
inline G4int GetNumberOfParticles() const;
```

**Returns:** Number of particles current source generates

### GetParticlePosition()
`source/event/include/G4GeneralParticleSource.hh:139-140`

```cpp
inline G4ThreeVector GetParticlePosition() const;
```

**Returns:** Last generated particle position

### GetParticleMomentumDirection()
`source/event/include/G4GeneralParticleSource.hh:141-142`

```cpp
inline G4ThreeVector GetParticleMomentumDirection() const;
```

**Returns:** Last generated particle direction

### GetParticleEnergy()
`source/event/include/G4GeneralParticleSource.hh:143-144`

```cpp
inline G4double GetParticleEnergy() const;
```

**Returns:** Last generated particle energy

## Usage Examples

### Simple Point Source

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fGPS = new G4GeneralParticleSource();

    // Configure via UI commands (in macro)
    // /gps/particle gamma
    // /gps/energy 662 keV
    // /gps/position 0 0 0 cm
    // /gps/direction 0 0 1
}
```

**Macro (init.mac):**
```bash
# Cs-137 point source
/gps/particle gamma
/gps/energy 662 keV
/gps/pos/type Point
/gps/position 0 0 0 cm
/gps/ang/type iso
```

### Isotropic Point Source

```bash
# Point source with isotropic emission
/gps/particle neutron
/gps/energy 14 MeV
/gps/pos/type Point
/gps/position 0 0 0 cm
/gps/ang/type iso
```

### Beam Source

```bash
# Pencil beam along z-axis
/gps/particle e-
/gps/energy 10 GeV

# Beam position distribution
/gps/pos/type Beam
/gps/pos/shape Circle
/gps/pos/radius 5 mm
/gps/pos/sigma_r 2 mm     # Gaussian beam profile
/gps/pos/centre 0 0 -50 cm

# Beam angular distribution
/gps/ang/type beam2d
/gps/ang/sigma_r 2 deg    # Beam divergence
/gps/ang/sigma_x 1 deg    # X-direction spread
/gps/ang/sigma_y 1 deg    # Y-direction spread
```

### Surface Source

```bash
# Particles from spherical surface
/gps/particle gamma
/gps/energy 1 MeV
/gps/pos/type Surface
/gps/pos/shape Sphere
/gps/pos/radius 10 cm
/gps/pos/centre 0 0 0 cm
/gps/ang/type cos         # Cosine-law distribution (inward)
```

### Volume Source

```bash
# Uniform volume source
/gps/particle e+
/gps/energy 511 keV
/gps/pos/type Volume
/gps/pos/shape Cylinder
/gps/pos/radius 5 cm
/gps/pos/halfz 10 cm
/gps/pos/centre 0 0 0 cm
/gps/ang/type iso
```

### Plane Source

```bash
# Planar source (e.g., detector calibration)
/gps/particle gamma
/gps/energy 60 keV
/gps/pos/type Plane
/gps/pos/shape Rectangle
/gps/pos/halfx 10 cm
/gps/pos/halfy 10 cm
/gps/pos/centre 0 0 10 cm
/gps/ang/type iso
```

### Energy Spectrum (Linear)

```bash
# Linear energy distribution
/gps/particle e-
/gps/ene/type Lin
/gps/ene/min 0.1 MeV
/gps/ene/max 10 MeV
/gps/ene/gradient 1      # Slope
/gps/ene/intercept 1     # Offset
```

### Energy Spectrum (Power Law)

```bash
# Power-law spectrum (e.g., cosmic rays)
/gps/particle proton
/gps/ene/type Pow
/gps/ene/min 1 GeV
/gps/ene/max 100 GeV
/gps/ene/alpha -2.7      # Spectral index
```

### Energy Spectrum (Gaussian)

```bash
# Gaussian energy distribution
/gps/particle gamma
/gps/ene/type Gauss
/gps/ene/mono 1.275 MeV  # Mean energy
/gps/ene/sigma 10 keV    # Energy spread
```

### Energy Spectrum (User-Defined Histogram)

```bash
# Arbitrary histogram
/gps/particle neutron
/gps/ene/type Arb
/gps/ene/diffspec true   # Differential spectrum
/gps/hist/type arb

# Define energy bins and weights
/gps/hist/point 0.1 0.5   # 0.1 MeV: weight 0.5
/gps/hist/point 1.0 1.0   # 1.0 MeV: weight 1.0
/gps/hist/point 5.0 0.8   # 5.0 MeV: weight 0.8
/gps/hist/point 10.0 0.2  # 10.0 MeV: weight 0.2
/gps/hist/inter Lin       # Linear interpolation
```

### Multiple Sources

```bash
# Source 1: Background gamma
/gps/source/add 0.3        # 30% intensity
/gps/particle gamma
/gps/energy 1 MeV
/gps/pos/type Volume
/gps/pos/shape Sphere
/gps/pos/radius 50 cm
/gps/ang/type iso

# Source 2: Signal electrons
/gps/source/add 0.7        # 70% intensity
/gps/particle e-
/gps/energy 5 GeV
/gps/pos/type Point
/gps/position 0 0 -10 cm
/gps/ang/type beam2d
/gps/ang/sigma_r 1 deg
```

### Confined Source (Within Volume)

```bash
# Source confined to specific logical volume
/gps/pos/type Volume
/gps/pos/shape Para       # Parallelepiped
/gps/pos/halfx 5 cm
/gps/pos/halfy 5 cm
/gps/pos/halfz 5 cm
/gps/pos/confine PhysicalVolumeName  # Restrict to this volume
/gps/ang/type iso
```

### Angular Distribution (Cosine Law)

```bash
# Cosine-law angular distribution (e.g., diffuse source)
/gps/particle neutron
/gps/energy 2 MeV
/gps/pos/type Surface
/gps/pos/shape Circle
/gps/pos/radius 10 cm
/gps/ang/type cos
/gps/ang/mintheta 0 deg
/gps/ang/maxtheta 90 deg
```

### User-Defined Angular Distribution

```bash
# Custom angular distribution
/gps/ang/type user
/gps/hist/type theta

# Define theta distribution
/gps/hist/point 0.0 1.0   # Forward peaked
/gps/hist/point 30.0 0.8
/gps/hist/point 60.0 0.5
/gps/hist/point 90.0 0.2
```

### C++ Configuration Example

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fGPS = new G4GeneralParticleSource();

    // Get current source
    G4SingleParticleSource* source = fGPS->GetCurrentSource();

    // Configure particle
    source->SetParticleDefinition(G4Gamma::Definition());
    source->SetNumberOfParticles(1);

    // Configure position distribution
    G4SPSPosDistribution* pos = source->GetPosDist();
    pos->SetPosDisType("Volume");
    pos->SetPosDisShape("Sphere");
    pos->SetRadius(10*cm);
    pos->SetCentreCoords(G4ThreeVector(0, 0, 0));

    // Configure angular distribution
    G4SPSAngDistribution* ang = source->GetAngDist();
    ang->SetAngDistType("iso");

    // Configure energy distribution
    G4SPSEneDistribution* ene = source->GetEneDist();
    ene->SetEnergyDisType("Gauss");
    ene->SetMonoEnergy(1*MeV);
    ene->SetBeamSigmaInE(10*keV);
}
```

## UI Command Reference

### Particle Configuration
```bash
/gps/particle [particle_name]
/gps/ion Z A Q             # For ions: Z=atomic number, A=mass, Q=charge
/gps/time [time]
/gps/number [N]            # Particles per vertex
/gps/polarization [x] [y] [z]
```

### Position Distribution
```bash
/gps/pos/type [Point|Beam|Plane|Surface|Volume]
/gps/pos/shape [Circle|Annulus|Ellipse|Square|Rectangle|Sphere|Ellipsoid|Cylinder|Para]
/gps/pos/centre [x] [y] [z] [unit]
/gps/position [x] [y] [z] [unit]  # Alias for centre
/gps/pos/radius [r] [unit]
/gps/pos/halfx [dx] [unit]        # Half-width in x
/gps/pos/halfy [dy] [unit]
/gps/pos/halfz [dz] [unit]
/gps/pos/confine [physical_volume_name]
```

### Angular Distribution
```bash
/gps/ang/type [iso|cos|beam1d|beam2d|user]
/gps/ang/mintheta [angle] [unit]
/gps/ang/maxtheta [angle] [unit]
/gps/ang/minphi [angle] [unit]
/gps/ang/maxphi [angle] [unit]
/gps/ang/sigma_r [angle] [unit]   # Beam divergence
/gps/ang/rot1 [vector]            # Rotation axis 1
/gps/ang/rot2 [vector]            # Rotation axis 2
/gps/direction [x] [y] [z]        # Direction for beam types
```

### Energy Distribution
```bash
/gps/ene/type [Mono|Lin|Pow|Exp|Gauss|Brem|Bbody|Cdg|User|Arb|Epn]
/gps/energy [energy] [unit]       # Mono-energetic
/gps/ene/mono [energy] [unit]     # Alias for /gps/energy
/gps/ene/min [energy] [unit]
/gps/ene/max [energy] [unit]
/gps/ene/sigma [energy] [unit]    # For Gaussian
/gps/ene/alpha [value]            # For power-law
/gps/ene/gradient [value]         # For linear
/gps/ene/intercept [value]        # For linear
```

### Histogram (For User/Arb Distributions)
```bash
/gps/hist/type [theta|phi|energy|arb|...]
/gps/hist/point [value] [weight]
/gps/hist/inter [Lin|Log]         # Interpolation
/gps/hist/file [filename]         # Load from file
```

### Source Management
```bash
/gps/source/list                  # List all sources
/gps/source/show                  # Show current source
/gps/source/set [index]           # Set current source
/gps/source/add [intensity]       # Add new source
/gps/source/delete [index]        # Delete source
/gps/source/intensity [value]     # Set current source intensity
/gps/source/multiplevertex [true|false]
/gps/source/flatsampling [true|false]
```

### Verbosity
```bash
/gps/verbose [level]              # 0=quiet, 1=normal, 2=verbose
```

## Thread Safety

### Multi-Threading Design
`source/event/include/G4GeneralParticleSource.hh:162-181`

GPS is designed for thread safety with careful architecture:

- **Shared Resources**: `G4GeneralParticleSourceData` shared among threads (read-only during runs)
- **Thread-Local**: GPS instance per thread via `G4VUserPrimaryGeneratorAction`
- **Configuration**: Only master thread should modify via UI commands
- **Mutex Protection**: `GeneratePrimaryVertex()` protected via mutex in underlying distributions

::: warning Configuration Threading
**Critical Rules:**
1. Only ONE thread should change source parameters
2. Configuration changes only between runs (not during event loop)
3. UI commands execute on master thread (enforced since Geant4 10.1)
4. Avoid C++ API configuration in worker threads
:::

**Safe Usage Pattern:**
```cpp
// In master thread initialization
void ActionInitialization::BuildForMaster() const
{
    // Configure GPS in master (shared configuration)
    G4GeneralParticleSource* masterGPS = new G4GeneralParticleSource();
    // Configure here...
    delete masterGPS;  // Configuration persists in shared data
}

// Worker threads get configuration automatically
void ActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGeneratorAction());
}
```

## Performance Notes

1. **Initialization Overhead**: First call normalizes intensity weights - cached for subsequent events
2. **Distribution Sampling**: Complex distributions (volume, surface) are slower than simple (point, beam)
3. **Multiple Sources**: Minimal overhead for source selection
4. **Biasing**: Position/angular biasing can significantly improve efficiency for specific geometries

## Comparison with G4ParticleGun

| Feature | G4ParticleGun | G4GeneralParticleSource |
|---------|---------------|-------------------------|
| **Simplicity** | Very simple | More complex |
| **Position** | Fixed point | Multiple distributions |
| **Direction** | Fixed direction | Multiple distributions |
| **Energy** | Single value | Multiple distributions |
| **Multiple Sources** | No | Yes |
| **UI Configuration** | Basic | Extensive |
| **Performance** | Fastest | Slightly slower |
| **Use Case** | Simple tests | Realistic sources |

## See Also

- [G4SingleParticleSource](g4singleparticlesource.md) - Individual source component
- [G4ParticleGun](g4particlegun.md) - Simple particle gun
- [G4VPrimaryGenerator](g4vprimarygenerator.md) - Base class
- [G4VUserPrimaryGeneratorAction](../../../run/api/g4vuserprimarygeneratoraction.md) - User action interface
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4GeneralParticleSource.hh`
- Source: `source/event/src/G4GeneralParticleSource.cc`
- Messenger: `source/event/include/G4GeneralParticleSourceMessenger.hh`
- Data: `source/event/include/G4GeneralParticleSourceData.hh`
:::
