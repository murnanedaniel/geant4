# G4VUserPrimaryGeneratorAction API Documentation

## Overview

`G4VUserPrimaryGeneratorAction` is an abstract base class that defines the mandatory user action for primary particle generation in Geant4. Every Geant4 application must provide a concrete implementation of this class to define how primary particles are generated for each event.

This class acts as the bridge between the user's simulation application and the Geant4 event generation framework. It is instantiated per-thread in multi-threaded applications and called by `G4RunManager` at the beginning of each event.

::: tip Header File
**Location:** `source/run/include/G4VUserPrimaryGeneratorAction.hh`
**Source:** `source/run/src/G4VUserPrimaryGeneratorAction.cc`
:::

## Key Concepts

- **Mandatory User Action**: Must be implemented for any Geant4 simulation
- **Per-Event Invocation**: `GeneratePrimaries()` called once per event by `G4RunManager`
- **Generator Management**: Typically owns and manages `G4VPrimaryGenerator` instances
- **Thread-Local**: One instance per worker thread in MT mode
- **Lightweight**: Should only coordinate generators, not implement generation logic

## Class Declaration

`source/run/include/G4VUserPrimaryGeneratorAction.hh:47-54`

```cpp
class G4VUserPrimaryGeneratorAction
{
  public:
    G4VUserPrimaryGeneratorAction();
    virtual ~G4VUserPrimaryGeneratorAction() = default;

    virtual void GeneratePrimaries(G4Event* anEvent) = 0;
};
```

## Constructor and Destructor

### Constructor
`source/run/include/G4VUserPrimaryGeneratorAction.hh:50`

```cpp
G4VUserPrimaryGeneratorAction();
```

**Purpose:** Base class constructor, typically called by derived class constructor.

**Usage:**
```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
    : G4VUserPrimaryGeneratorAction()
{
    // Initialize particle generators here
    fParticleGun = new G4ParticleGun(1);
}
```

### Destructor
`source/run/include/G4VUserPrimaryGeneratorAction.hh:51`

```cpp
virtual ~G4VUserPrimaryGeneratorAction() = default;
```

**Purpose:** Virtual destructor allows proper cleanup of derived classes.

**Usage:**
```cpp
MyPrimaryGeneratorAction::~MyPrimaryGeneratorAction()
{
    delete fParticleGun;
}
```

## Pure Virtual Methods

### GeneratePrimaries()
`source/run/include/G4VUserPrimaryGeneratorAction.hh:53`

```cpp
virtual void GeneratePrimaries(G4Event* anEvent) = 0;
```

**Parameters:**
- `anEvent`: Pointer to current event object

**Purpose:** Pure virtual method that must be implemented to generate primary particles for each event.

**Called By:** `G4RunManager` (or `G4MTRunManager` in multi-threaded mode) at the start of each event.

**Responsibilities:**
1. Configure particle generator(s) for current event
2. Call `GeneratePrimaryVertex()` on generator(s)
3. Optionally randomize particle properties
4. Handle multiple particle sources if needed

**Example:**
```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Simple case: fixed configuration
    fParticleGun->GeneratePrimaryVertex(event);
}
```

::: warning Required Implementation
This method MUST be implemented in your derived class. Compilation will fail if not provided.
:::

## Class Design Pattern

The typical implementation pattern follows this structure:

```cpp
class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction();
    ~MyPrimaryGeneratorAction() override;

    void GeneratePrimaries(G4Event* event) override;

  private:
    G4VPrimaryGenerator* fGenerator;  // Owned generator instance
    // Additional data members for configuration
};
```

**Key Design Principles:**
- **Constructor**: Create and configure generator(s)
- **Destructor**: Clean up owned generators
- **GeneratePrimaries()**: Invoke generator(s), apply event-specific randomization
- **Don't Generate**: This class coordinates, doesn't implement generation

::: tip Separation of Concerns
`G4VUserPrimaryGeneratorAction` manages generators; `G4VPrimaryGenerator` implementations generate particles. Keep these responsibilities separate.
:::

## Implementation Examples

### Basic Particle Gun

```cpp
// Header: MyPrimaryGeneratorAction.hh
#ifndef MyPrimaryGeneratorAction_h
#define MyPrimaryGeneratorAction_h 1

#include "G4VUserPrimaryGeneratorAction.hh"
#include "G4ParticleGun.hh"
#include "globals.hh"

class G4Event;

class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction();
    ~MyPrimaryGeneratorAction() override;

    void GeneratePrimaries(G4Event* event) override;

    // Optional: provide access to gun for external configuration
    const G4ParticleGun* GetParticleGun() const { return fParticleGun; }

  private:
    G4ParticleGun* fParticleGun;
};

#endif
```

```cpp
// Source: MyPrimaryGeneratorAction.cc
#include "MyPrimaryGeneratorAction.hh"
#include "G4ParticleGun.hh"
#include "G4ParticleTable.hh"
#include "G4ParticleDefinition.hh"
#include "G4SystemOfUnits.hh"

MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
  : G4VUserPrimaryGeneratorAction(),
    fParticleGun(nullptr)
{
    G4int nParticles = 1;
    fParticleGun = new G4ParticleGun(nParticles);

    // Default particle properties
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
    G4ParticleDefinition* particle = particleTable->FindParticle("e-");

    fParticleGun->SetParticleDefinition(particle);
    fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0, 0, 1));
    fParticleGun->SetParticleEnergy(1*GeV);
    fParticleGun->SetParticlePosition(G4ThreeVector(0, 0, -10*cm));
}

MyPrimaryGeneratorAction::~MyPrimaryGeneratorAction()
{
    delete fParticleGun;
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fParticleGun->GeneratePrimaryVertex(event);
}
```

### With Event-Level Randomization

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Randomize energy for each event
    G4double energy = (1 + 9*G4UniformRand())*GeV;  // 1-10 GeV
    fParticleGun->SetParticleEnergy(energy);

    // Randomize position (beam spot)
    G4double x = G4RandGauss::shoot(0, 1*mm);
    G4double y = G4RandGauss::shoot(0, 1*mm);
    fParticleGun->SetParticlePosition(G4ThreeVector(x, y, -10*cm));

    // Randomize direction (angular divergence)
    G4double theta = G4RandGauss::shoot(0, 1*deg);
    G4double phi = 2*M_PI*G4UniformRand();
    G4ThreeVector direction(
        std::sin(theta)*std::cos(phi),
        std::sin(theta)*std::sin(phi),
        std::cos(theta)
    );
    fParticleGun->SetParticleMomentumDirection(direction);

    // Generate
    fParticleGun->GeneratePrimaryVertex(event);
}
```

### Using General Particle Source

```cpp
// Header
#include "G4VUserPrimaryGeneratorAction.hh"
#include "G4GeneralParticleSource.hh"

class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction();
    ~MyPrimaryGeneratorAction() override;
    void GeneratePrimaries(G4Event* event) override;

  private:
    G4GeneralParticleSource* fGPS;
};

// Implementation
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
  : G4VUserPrimaryGeneratorAction(),
    fGPS(nullptr)
{
    fGPS = new G4GeneralParticleSource();
    // GPS configured via macro commands
}

MyPrimaryGeneratorAction::~MyPrimaryGeneratorAction()
{
    delete fGPS;
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fGPS->GeneratePrimaryVertex(event);
}
```

### Multiple Particle Types

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Alternate between particle types based on event ID
    G4int eventID = event->GetEventID();

    if (eventID % 3 == 0) {
        fParticleGun->SetParticleDefinition(
            G4Electron::Definition());
        fParticleGun->SetParticleEnergy(5*GeV);
    }
    else if (eventID % 3 == 1) {
        fParticleGun->SetParticleDefinition(
            G4Gamma::Definition());
        fParticleGun->SetParticleEnergy(2*GeV);
    }
    else {
        fParticleGun->SetParticleDefinition(
            G4Proton::Definition());
        fParticleGun->SetParticleEnergy(100*MeV);
    }

    fParticleGun->GeneratePrimaryVertex(event);
}
```

### Multiple Sources (Multiple Vertices)

```cpp
class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction();
    ~MyPrimaryGeneratorAction() override;
    void GeneratePrimaries(G4Event* event) override;

  private:
    G4ParticleGun* fElectronGun;
    G4ParticleGun* fGammaGun;
};

MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
  : G4VUserPrimaryGeneratorAction()
{
    // Electron gun
    fElectronGun = new G4ParticleGun(1);
    fElectronGun->SetParticleDefinition(G4Electron::Definition());
    fElectronGun->SetParticleEnergy(10*GeV);
    fElectronGun->SetParticlePosition(G4ThreeVector(-5*cm, 0, 0));

    // Gamma gun
    fGammaGun = new G4ParticleGun(1);
    fGammaGun->SetParticleDefinition(G4Gamma::Definition());
    fGammaGun->SetParticleEnergy(1*MeV);
    fGammaGun->SetParticlePosition(G4ThreeVector(5*cm, 0, 0));
}

MyPrimaryGeneratorAction::~MyPrimaryGeneratorAction()
{
    delete fElectronGun;
    delete fGammaGun;
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Generate from both sources -> two vertices in same event
    fElectronGun->GeneratePrimaryVertex(event);
    fGammaGun->GeneratePrimaryVertex(event);
}
```

### Reading from External File

```cpp
class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction(const G4String& filename);
    ~MyPrimaryGeneratorAction() override;
    void GeneratePrimaries(G4Event* event) override;

  private:
    G4HEPEvtInterface* fHEPEvtGen;
};

MyPrimaryGeneratorAction::MyPrimaryGeneratorAction(
    const G4String& filename)
  : G4VUserPrimaryGeneratorAction()
{
    fHEPEvtGen = new G4HEPEvtInterface(filename.c_str());
    fHEPEvtGen->SetParticlePosition(G4ThreeVector(0, 0, 0));
}

MyPrimaryGeneratorAction::~MyPrimaryGeneratorAction()
{
    delete fHEPEvtGen;
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fHEPEvtGen->GeneratePrimaryVertex(event);
}
```

### Conditional Generation

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // 80% electrons, 20% positrons
    if (G4UniformRand() < 0.8) {
        fParticleGun->SetParticleDefinition(G4Electron::Definition());
    } else {
        fParticleGun->SetParticleDefinition(G4Positron::Definition());
    }

    // Energy from power-law spectrum
    G4double Emin = 0.1*GeV;
    G4double Emax = 100*GeV;
    G4double alpha = -2.7;  // Spectral index
    G4double r = G4UniformRand();
    G4double energy = Emin * std::pow(Emax/Emin, r);
    fParticleGun->SetParticleEnergy(energy);

    fParticleGun->GeneratePrimaryVertex(event);
}
```

## Registration with Run Manager

The primary generator action must be registered with `G4RunManager`:

### Sequential Mode

```cpp
int main(int argc, char** argv)
{
    // Construct run manager
    G4RunManager* runManager = new G4RunManager;

    // Mandatory initialization
    runManager->SetUserInitialization(new MyDetectorConstruction());
    runManager->SetUserInitialization(new MyPhysicsList());

    // Set mandatory user action
    runManager->SetUserAction(new MyPrimaryGeneratorAction());

    // Optional user actions
    runManager->SetUserAction(new MyRunAction());
    runManager->SetUserAction(new MyEventAction());

    // Initialize
    runManager->Initialize();

    // Run
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

### Multi-Threaded Mode

```cpp
#include "G4MTRunManager.hh"
#include "G4Threading.hh"

// Action initialization class (recommended for MT)
class MyActionInitialization : public G4VUserActionInitialization
{
  public:
    MyActionInitialization() = default;
    ~MyActionInitialization() override = default;

    void BuildForMaster() const override {
        // Master thread actions (usually run action only)
    }

    void Build() const override {
        // Worker thread actions (including primary generator)
        SetUserAction(new MyPrimaryGeneratorAction());
        SetUserAction(new MyRunAction());
        SetUserAction(new MyEventAction());
    }
};

int main(int argc, char** argv)
{
    // Construct MT run manager
    G4MTRunManager* runManager = new G4MTRunManager;
    runManager->SetNumberOfThreads(4);  // Set number of threads

    // Mandatory initialization
    runManager->SetUserInitialization(new MyDetectorConstruction());
    runManager->SetUserInitialization(new MyPhysicsList());
    runManager->SetUserInitialization(new MyActionInitialization());

    // Initialize and run
    runManager->Initialize();
    runManager->BeamOn(10000);

    delete runManager;
    return 0;
}
```

::: tip Multi-Threading
In MT mode, use `G4VUserActionInitialization` to create thread-local action instances. Each worker thread gets its own `MyPrimaryGeneratorAction` instance.
:::

## Thread Safety

### Multi-Threading Behavior

- **Thread-Local Instances**: Each worker thread has its own instance
- **Independent State**: No shared state between threads (naturally thread-safe)
- **No Locking Needed**: Thread-local instances don't require synchronization
- **Generator Thread Safety**: Ensure owned generators are thread-safe

**Thread-Safe Pattern:**
```cpp
// Each thread creates its own instance via ActionInitialization
void MyActionInitialization::Build() const
{
    // This runs once per worker thread
    SetUserAction(new MyPrimaryGeneratorAction());
}
```

### Shared Resources

If generators access shared resources (e.g., shared input file), proper synchronization is required:

```cpp
#include "G4AutoLock.hh"

namespace {
    G4Mutex generatorMutex = G4MUTEX_INITIALIZER;
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Lock shared resource access
    G4AutoLock lock(&generatorMutex);

    // Access shared resource (e.g., file)
    fSharedFileGenerator->GeneratePrimaryVertex(event);
}
```

::: warning Shared Files
Avoid sharing file handles between threads. Use separate files per thread or implement proper locking.
:::

## Best Practices

### 1. Initialize in Constructor

```cpp
// GOOD: Initialize generators in constructor
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fParticleGun = new G4ParticleGun(1);
    fParticleGun->SetParticleDefinition(G4Electron::Definition());
    fParticleGun->SetParticleEnergy(10*GeV);
}

// BAD: Don't initialize in GeneratePrimaries
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Don't do this every event!
    G4ParticleGun* gun = new G4ParticleGun(1);  // MEMORY LEAK!
}
```

### 2. Minimize Per-Event Work

```cpp
// GOOD: Only change what's needed per event
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Only randomize what changes
    G4double energy = SampleEnergy();
    fParticleGun->SetParticleEnergy(energy);
    fParticleGun->GeneratePrimaryVertex(event);
}

// BAD: Unnecessary reconfiguration
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Don't reconfigure everything every time
    fParticleGun->SetParticleDefinition(G4Electron::Definition());  // Unchanged
    fParticleGun->SetParticleEnergy(1*GeV);  // Could be constant
    // ...
}
```

### 3. Proper Resource Management

```cpp
// GOOD: Clean ownership
class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    ~MyPrimaryGeneratorAction() override {
        delete fParticleGun;  // Clean up owned resources
    }

  private:
    G4ParticleGun* fParticleGun;  // Owned
};
```

### 4. Use Appropriate Generator

```cpp
// Simple, fixed properties -> G4ParticleGun
fParticleGun = new G4ParticleGun(1);

// Complex distributions -> G4GeneralParticleSource
fGPS = new G4GeneralParticleSource();

// External events -> G4HEPEvtInterface
fHEPEvt = new G4HEPEvtInterface("events.dat");
```

## Common Patterns

### Pattern 1: Fixed Beam

```cpp
// Setup once in constructor, generate without changes
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction() {
    fGun = new G4ParticleGun(1);
    fGun->SetParticleDefinition(G4Proton::Definition());
    fGun->SetParticleEnergy(2*GeV);
    fGun->SetParticleMomentumDirection(G4ThreeVector(0,0,1));
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event) {
    fGun->GeneratePrimaryVertex(event);
}
```

### Pattern 2: Randomized Beam

```cpp
// Setup base configuration, randomize per event
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event) {
    fGun->SetParticleEnergy(SampleEnergy());
    fGun->SetParticlePosition(SamplePosition());
    fGun->SetParticleMomentumDirection(SampleDirection());
    fGun->GeneratePrimaryVertex(event);
}
```

### Pattern 3: Event-Dependent

```cpp
// Change configuration based on event properties
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event) {
    G4int eventID = event->GetEventID();

    if (eventID < 1000) {
        // First 1000 events: low energy
        fGun->SetParticleEnergy(1*MeV);
    } else {
        // Remaining events: high energy
        fGun->SetParticleEnergy(1*GeV);
    }

    fGun->GeneratePrimaryVertex(event);
}
```

## Troubleshooting

### Common Errors

**Error: "G4VUserPrimaryGeneratorAction not set"**
```
Solution: Register action with run manager before Initialize()
```

**Error: "Abstract class cannot be instantiated"**
```
Solution: Must implement GeneratePrimaries() in derived class
```

**Error: "Segmentation fault in GeneratePrimaries"**
```
Solution: Check that generator pointer is initialized in constructor
```

**Error: "Primary vertex outside world"**
```
Solution: Verify particle position is inside world volume
```

## See Also

- [G4VPrimaryGenerator](../../event/api/g4vprimarygenerator.md) - Generator base class
- [G4ParticleGun](../../event/api/g4particlegun.md) - Simple particle gun
- [G4GeneralParticleSource](../../event/api/g4generalparticlesource.md) - GPS
- [G4HEPEvtInterface](../../event/api/g4hepevtinterface.md) - External file reader
- [G4Event](../../event/api/g4event.md) - Event class
- [Run Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/run/include/G4VUserPrimaryGeneratorAction.hh`
- Source: `source/run/src/G4VUserPrimaryGeneratorAction.cc`
:::
