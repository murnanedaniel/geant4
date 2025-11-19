# G4VPrimaryGenerator API Documentation

## Overview

`G4VPrimaryGenerator` is the abstract base class for all primary particle generators in Geant4. It provides the fundamental interface for generating primary vertices and particles that initiate event simulation. All concrete particle generators (such as `G4ParticleGun`, `G4GeneralParticleSource`, and `G4HEPEvtInterface`) derive from this class.

The class defines a single pure virtual method `GeneratePrimaryVertex()` that must be implemented by derived classes to create primary particles with specific characteristics.

::: tip Header File
**Location:** `source/event/include/G4VPrimaryGenerator.hh`
:::

## Class Declaration

```cpp
class G4VPrimaryGenerator
{
  public:
    G4VPrimaryGenerator() = default;
    virtual ~G4VPrimaryGenerator() = default;

    static G4bool CheckVertexInsideWorld(const G4ThreeVector& pos);
    virtual void GeneratePrimaryVertex(G4Event* evt) = 0;

    inline G4ThreeVector GetParticlePosition();
    inline G4double GetParticleTime();
    void SetParticlePosition(G4ThreeVector aPosition);
    inline void SetParticleTime(G4double aTime);
    inline void CheckInside(G4bool val=true);
    inline G4bool IfCheckInside();
};
```

## Pure Virtual Methods

### GeneratePrimaryVertex()
`source/event/include/G4VPrimaryGenerator.hh:56`

```cpp
virtual void GeneratePrimaryVertex(G4Event* evt) = 0;
```

**Parameters:**
- `evt`: Pointer to the `G4Event` object to which primary vertices will be added

**Purpose:** Pure virtual method that concrete derived classes must implement to generate primary vertices and particles for an event.

**Usage in Derived Classes:**
```cpp
// Example implementation in G4ParticleGun
void G4ParticleGun::GeneratePrimaryVertex(G4Event* evt)
{
    // Create vertex at specified position and time
    G4PrimaryVertex* vertex = new G4PrimaryVertex(
        particle_position, particle_time);

    // Create and configure primary particles
    for (G4int i = 0; i < NumberOfParticlesToBeGenerated; i++) {
        G4PrimaryParticle* particle = new G4PrimaryParticle(
            particle_definition);
        particle->SetKineticEnergy(particle_energy);
        particle->SetMomentumDirection(particle_momentum_direction);
        vertex->SetPrimary(particle);
    }

    // Add vertex to event
    evt->AddPrimaryVertex(vertex);
}
```

::: warning Implementation Required
All concrete generator classes must provide an implementation of this method. Failure to do so will result in a compilation error.
:::

## Static Methods

### CheckVertexInsideWorld()
`source/event/include/G4VPrimaryGenerator.hh:52`

```cpp
static G4bool CheckVertexInsideWorld(const G4ThreeVector& pos);
```

**Parameters:**
- `pos`: 3D position vector to check

**Returns:** `true` if position is inside the world volume, `false` otherwise

**Purpose:** Static utility method to verify that a given position is located within the current world volume before creating a primary vertex.

**Example:**
```cpp
G4ThreeVector position(0, 0, 0);
if (G4VPrimaryGenerator::CheckVertexInsideWorld(position)) {
    particleGun->SetParticlePosition(position);
} else {
    G4cerr << "Error: Position outside world volume!" << G4endl;
}
```

::: warning Position Requirements
Primary vertices must be generated inside the world volume. Vertices on the surface or outside the world can cause undefined behavior and simulation crashes.
:::

## Position and Time Management

### SetParticlePosition()
`source/event/include/G4VPrimaryGenerator.hh:63-68`

```cpp
void SetParticlePosition(G4ThreeVector aPosition);
```

**Parameters:**
- `aPosition`: 3D vector specifying the initial position of the primary vertex

**Purpose:** Sets the position where the primary vertex will be created. The position must be inside the world volume.

**Behavior:**
- If `ifCheckInside` is `true` (default), validates position using `CheckVertexInsideWorld()`
- Issues warning if position is outside world volume
- Position should not be on the surface to avoid particles pointing outward

**Example:**
```cpp
G4VPrimaryGenerator* generator = new G4ParticleGun();
generator->SetParticlePosition(G4ThreeVector(0*cm, 0*cm, -10*cm));
```

::: tip Default Value
Default initial position is (0, 0, 0). If not set explicitly, vertex will be created at world origin.
:::

### GetParticlePosition()
`source/event/include/G4VPrimaryGenerator.hh:60`

```cpp
inline G4ThreeVector GetParticlePosition();
```

**Returns:** Current particle position setting

**Example:**
```cpp
G4ThreeVector currentPos = generator->GetParticlePosition();
G4cout << "Current position: " << currentPos << G4endl;
```

### SetParticleTime()
`source/event/include/G4VPrimaryGenerator.hh:70-71`

```cpp
inline void SetParticleTime(G4double aTime);
```

**Parameters:**
- `aTime`: Initial time of the primary vertex (in Geant4 internal time units)

**Purpose:** Sets the time coordinate for the primary vertex creation.

**Example:**
```cpp
// Create delayed particle (e.g., for beam timing studies)
generator->SetParticleTime(10.0*ns);
```

::: tip Default Value
Default time is 0.0. Most simulations use t=0 for primary generation.
:::

### GetParticleTime()
`source/event/include/G4VPrimaryGenerator.hh:61`

```cpp
inline G4double GetParticleTime();
```

**Returns:** Current particle time setting

## Position Validation Control

### CheckInside()
`source/event/include/G4VPrimaryGenerator.hh:73-74`

```cpp
inline void CheckInside(G4bool val=true);
```

**Parameters:**
- `val`: `true` to enable position checking (default), `false` to disable

**Purpose:** Enable or disable automatic checking that particle position is inside the world volume.

**Usage:**
```cpp
// Disable checking for performance (use with caution!)
generator->CheckInside(false);
generator->SetParticlePosition(position);  // No validation performed
```

::: warning Safety
Disabling position checking can lead to crashes if particles are generated outside the world volume. Only disable if you are certain positions are valid.
:::

### IfCheckInside()
`source/event/include/G4VPrimaryGenerator.hh:75-76`

```cpp
inline G4bool IfCheckInside();
```

**Returns:** Current state of position checking (`true` if enabled)

**Example:**
```cpp
if (generator->IfCheckInside()) {
    G4cout << "Position validation is enabled" << G4endl;
}
```

## Protected Data Members

`source/event/include/G4VPrimaryGenerator.hh:80-82`

```cpp
protected:
    G4ThreeVector particle_position;  // Initialized at (0, 0, 0)
    G4double particle_time = 0.0;
    G4bool ifCheckInside = true;
```

**Access:** Protected - available to derived classes

**Members:**
- `particle_position`: Storage for primary vertex position
- `particle_time`: Storage for primary vertex time
- `ifCheckInside`: Flag controlling position validation

## Usage Pattern

The typical usage pattern for `G4VPrimaryGenerator` is to:

1. **Create a derived class instance** (e.g., `G4ParticleGun`)
2. **Configure position and time** using base class methods
3. **Configure particle properties** using derived class methods
4. **Call from user action** in `G4VUserPrimaryGeneratorAction::GeneratePrimaries()`

```cpp
// In your PrimaryGeneratorAction constructor
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);  // Derived from G4VPrimaryGenerator

    // Configure using base class methods
    fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, -10*cm));
    fParticleGun->SetParticleTime(0.0);

    // Configure using derived class methods
    fParticleGun->SetParticleDefinition(G4Electron::Definition());
    fParticleGun->SetParticleEnergy(10*GeV);
    fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));
}

// In GeneratePrimaries()
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // This calls the virtual method implemented by G4ParticleGun
    fParticleGun->GeneratePrimaryVertex(event);
}
```

## Implementing Custom Generators

To create a custom primary generator:

```cpp
class MyCustomGenerator : public G4VPrimaryGenerator
{
  public:
    MyCustomGenerator();
    ~MyCustomGenerator() override = default;

    // Must implement pure virtual method
    void GeneratePrimaryVertex(G4Event* evt) override;

  private:
    G4ParticleDefinition* fParticle;
    G4double fEnergy;
    // Add custom parameters...
};

// Implementation
void MyCustomGenerator::GeneratePrimaryVertex(G4Event* evt)
{
    // Use protected members from base class
    G4PrimaryVertex* vertex = new G4PrimaryVertex(
        particle_position,  // From base class
        particle_time);     // From base class

    // Create custom particle distribution
    G4ThreeVector direction = GenerateRandomDirection();
    G4double energy = SampleEnergySpectrum();

    G4PrimaryParticle* particle = new G4PrimaryParticle(fParticle);
    particle->SetKineticEnergy(energy);
    particle->SetMomentumDirection(direction);

    vertex->SetPrimary(particle);
    evt->AddPrimaryVertex(vertex);
}
```

::: tip Custom Generators
Custom generators are useful for implementing specific experimental beam conditions, cosmic ray generators, or reading external generator files.
:::

## Thread Safety

### Multi-Threading Considerations

In multi-threaded Geant4 applications:
- Each worker thread has its own instance of the primary generator
- Base class methods are thread-safe (access thread-local data)
- Static `CheckVertexInsideWorld()` accesses thread-local geometry
- No synchronization needed for typical usage

**Thread-Safe Usage:**
```cpp
// In G4VUserPrimaryGeneratorAction constructor (thread-local)
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fGenerator = new G4ParticleGun(1);  // Thread-local instance
    fGenerator->SetParticlePosition(G4ThreeVector(0, 0, 0));
}
```

::: info Thread-Local Instances
Primary generators are instantiated per-thread via `G4VUserPrimaryGeneratorAction`, ensuring thread safety without explicit locking.
:::

## Concrete Implementations

Geant4 provides several concrete implementations of `G4VPrimaryGenerator`:

| Class | Purpose | Use Case |
|-------|---------|----------|
| [G4ParticleGun](g4particlegun.md) | Single particle gun | Simple simulations, fixed particle types |
| [G4GeneralParticleSource](g4generalparticlesource.md) | General particle source (GPS) | Complex source geometries and distributions |
| [G4SingleParticleSource](g4singleparticlesource.md) | GPS component | Used internally by GPS |
| [G4HEPEvtInterface](g4hepevtinterface.md) | HEPEvt format reader | Reading external generator files |

## See Also

- [G4ParticleGun](g4particlegun.md) - Simple particle gun implementation
- [G4GeneralParticleSource](g4generalparticlesource.md) - Advanced particle source
- [G4VUserPrimaryGeneratorAction](../../../run/api/g4vuserprimarygeneratoraction.md) - User action interface
- [G4Event](g4event.md) - Event container class
- [G4PrimaryVertex](g4primaryvertex.md) - Primary vertex class
- [G4PrimaryParticle](g4primaryparticle.md) - Primary particle class
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4VPrimaryGenerator.hh`
:::
