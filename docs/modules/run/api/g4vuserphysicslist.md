# G4VUserPhysicsList API Documentation

## Overview

`G4VUserPhysicsList` is the abstract base class for constructing particles and physics processes in Geant4. It defines two pure virtual methods that must be implemented: `ConstructParticle()` for particle construction and `ConstructProcess()` for physics process registration. This is one of three mandatory initialization classes required by G4RunManager and is central to defining the physics behavior of your simulation.

::: tip Header File
**Location:** `source/run/include/G4VUserPhysicsList.hh`
**Source:** `source/run/src/G4VUserPhysicsList.cc`
:::

## Class Declaration

```cpp
class G4VUserPhysicsList
{
  public:
    G4VUserPhysicsList();
    virtual ~G4VUserPhysicsList();

    // Pure virtual methods - must be implemented
    virtual void ConstructParticle() = 0;
    virtual void ConstructProcess() = 0;

    // Physics tables and cuts
    virtual void SetCuts();
    void SetDefaultCutValue(G4double newCutValue);
    G4double GetDefaultCutValue() const;

    void BuildPhysicsTable();
    void PreparePhysicsTable(G4ParticleDefinition*);
    void BuildPhysicsTable(G4ParticleDefinition*);

    // Physics table storage/retrieval
    G4bool StorePhysicsTable(const G4String& directory = ".");
    void SetPhysicsTableRetrieved(const G4String& directory = "");
    void ResetPhysicsTableRetrieved();

    // Cut value management
    void SetCutValue(G4double aCut, const G4String& pname);
    G4double GetCutValue(const G4String& pname) const;
    void SetCutValue(G4double aCut, const G4String& pname,
                     const G4String& rname);

    // Verbosity
    void SetVerboseLevel(G4int value);
    G4int GetVerboseLevel() const;

    // Multi-threading
    virtual void InitializeWorker();
    virtual void TerminateWorker();

  protected:
    // Process registration
    void AddTransportation();
    G4bool RegisterProcess(G4VProcess* process,
                          G4ParticleDefinition* particle);
    void InitializeProcessManager();
    G4ParticleTable::G4PTblDicIterator* GetParticleIterator() const;

  protected:
    G4ParticleTable* theParticleTable = nullptr;
    G4int verboseLevel = 1;
    G4double defaultCutValue = 1.0;
    G4ProductionCutsTable* fCutsTable = nullptr;
};
```

## Key Characteristics

- **Abstract Base Class**: ConstructParticle() and ConstructProcess() are pure virtual
- **Mandatory**: Required for all Geant4 applications
- **Physics Definition**: Defines all particles and their interactions
- **Cut Management**: Controls production thresholds for secondary particles
- **Thread-Safe**: Shared instance with per-thread data management

## Important Notes

::: warning Critical Requirements
- Must implement ConstructParticle() to define all particles used
- Must implement ConstructProcess() to register all physics processes
- Must call AddTransportation() in ConstructProcess()
- Production cuts apply to γ, e-, e+ (not to other particles)
:::

::: tip Physics Lists
For most applications, use pre-built physics lists from `$G4INSTALL/source/physics_lists/`:
- FTFP_BERT (default, general purpose)
- QGSP_BERT (high energy)
- Shielding (shielding applications)
- Penelope, Livermore (low energy EM)

Only create custom physics list if needed for specialized physics.
:::

## Pure Virtual Methods

### ConstructParticle()
`source/run/include/G4VUserPhysicsList.hh:113`

```cpp
virtual void ConstructParticle() = 0;
```

**Purpose:** Instantiate all particle types used in simulation

**When Called:** G4RunManager::Initialize(), before process construction

**Must Define:**
- All particles that will be created during simulation
- Primary particles
- Secondary particles from physics processes
- Resonances and short-lived particles if needed

**Example:**
```cpp
void MyPhysicsList::ConstructParticle()
{
    // Construct bosons
    G4Gamma::GammaDefinition();
    G4OpticalPhoton::OpticalPhotonDefinition();

    // Construct leptons
    G4Electron::ElectronDefinition();
    G4Positron::PositronDefinition();
    G4MuonPlus::MuonPlusDefinition();
    G4MuonMinus::MuonMinusDefinition();
    G4NeutrinoE::NeutrinoEDefinition();
    G4AntiNeutrinoE::AntiNeutrinoEDefinition();

    // Construct baryons
    G4Proton::ProtonDefinition();
    G4AntiProton::AntiProtonDefinition();
    G4Neutron::NeutronDefinition();
    G4AntiNeutron::AntiNeutronDefinition();

    // Construct mesons
    G4PionPlus::PionPlusDefinition();
    G4PionMinus::PionMinusDefinition();
    G4PionZero::PionZeroDefinition();
    G4KaonPlus::KaonPlusDefinition();
    G4KaonMinus::KaonMinusDefinition();

    // Construct ions
    G4Deuteron::DeuteronDefinition();
    G4Triton::TritonDefinition();
    G4Alpha::AlphaDefinition();
    G4GenericIon::GenericIonDefinition();
}
```

**Common Patterns:**
```cpp
// Pattern 1: EM physics particles only
void MyPhysicsList::ConstructParticle() {
    G4Gamma::GammaDefinition();
    G4Electron::ElectronDefinition();
    G4Positron::PositronDefinition();
}

// Pattern 2: Use helper methods
void MyPhysicsList::ConstructParticle() {
    G4BosonConstructor bosons;
    bosons.ConstructParticle();

    G4LeptonConstructor leptons;
    leptons.ConstructParticle();

    G4BaryonConstructor baryons;
    baryons.ConstructParticle();

    G4MesonConstructor mesons;
    mesons.ConstructParticle();

    G4IonConstructor ions;
    ions.ConstructParticle();
}

// Pattern 3: Use ALL particles
void MyPhysicsList::ConstructParticle() {
    G4ParticleTable::GetParticleTable()->GetIterator()->reset();
    while( (*G4ParticleTable::GetParticleTable()->GetIterator())() ){
        G4ParticleDefinition* particle =
            G4ParticleTable::GetParticleTable()->GetIterator()->value();
        // All particles constructed
    }
}
```

### ConstructProcess()
`source/run/include/G4VUserPhysicsList.hh:122`

```cpp
virtual void ConstructProcess() = 0;
```

**Purpose:** Instantiate and register all physics processes to particles

**When Called:** After ConstructParticle() during G4RunManager::Initialize()

**Must Include:**
- AddTransportation() call (mandatory for particle transport)
- Electromagnetic processes
- Hadronic processes
- Decay processes
- Optical processes (if needed)

**Example:**
```cpp
void MyPhysicsList::ConstructProcess()
{
    // MANDATORY: Add transportation
    AddTransportation();

    // Electromagnetic processes
    ConstructEM();

    // Hadronic processes
    ConstructHadronic();

    // Decay processes
    ConstructDecay();

    // Optional processes
    ConstructOptical();
}

void MyPhysicsList::ConstructEM()
{
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while ((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4String particleName = particle->GetParticleName();

        if (particleName == "gamma") {
            // Photon processes
            particle->GetProcessManager()->AddDiscreteProcess(
                new G4PhotoElectricEffect);
            particle->GetProcessManager()->AddDiscreteProcess(
                new G4ComptonScattering);
            particle->GetProcessManager()->AddDiscreteProcess(
                new G4GammaConversion);

        } else if (particleName == "e-") {
            // Electron processes
            particle->GetProcessManager()->AddProcess(
                new G4eMultipleScattering, -1, 1, 1);
            particle->GetProcessManager()->AddProcess(
                new G4eIonisation, -1, 2, 2);
            particle->GetProcessManager()->AddProcess(
                new G4eBremsstrahlung, -1, 3, 3);

        } else if (particleName == "e+") {
            // Positron processes
            particle->GetProcessManager()->AddProcess(
                new G4eMultipleScattering, -1, 1, 1);
            particle->GetProcessManager()->AddProcess(
                new G4eIonisation, -1, 2, 2);
            particle->GetProcessManager()->AddProcess(
                new G4eBremsstrahlung, -1, 3, 3);
            particle->GetProcessManager()->AddProcess(
                new G4eplusAnnihilation, 0, -1, 4);
        }
    }
}
```

## Protected Helper Methods

### AddTransportation()
`source/run/include/G4VUserPhysicsList.hh:247`

```cpp
void AddTransportation();
```

**Purpose:** Add particle transportation process to all particles

**When Called:** Must be called in ConstructProcess()

**Importance:** Mandatory - particles cannot move without transportation

**Example:**
```cpp
void MyPhysicsList::ConstructProcess()
{
    // FIRST: Add transportation (mandatory)
    AddTransportation();

    // THEN: Add other processes
    ConstructEM();
    ConstructHadronic();
}
```

::: danger Critical
Forgetting to call AddTransportation() will cause simulation failure. Particles will not propagate.
:::

### RegisterProcess()
`source/run/include/G4VUserPhysicsList.hh:252`

```cpp
G4bool RegisterProcess(G4VProcess* process,
                       G4ParticleDefinition* particle);
```

**Purpose:** Register process to particle according to ordering parameter

**Parameters:**
- `process`: Pointer to physics process
- `particle`: Pointer to particle definition

**Returns:** `true` if registration successful

**Example:**
```cpp
G4ParticleDefinition* gamma = G4Gamma::Definition();
RegisterProcess(new G4PhotoElectricEffect, gamma);
RegisterProcess(new G4ComptonScattering, gamma);
RegisterProcess(new G4GammaConversion, gamma);
```

### GetParticleIterator()
`source/run/include/G4VUserPhysicsList.hh:267`

```cpp
G4ParticleTable::G4PTblDicIterator* GetParticleIterator() const;
```

**Purpose:** Get iterator for looping over all defined particles

**Returns:** Pointer to particle table iterator

**Example:**
```cpp
void MyPhysicsList::ConstructProcess()
{
    AddTransportation();

    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while ((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4String particleName = particle->GetParticleName();

        // Add processes based on particle type
        if (particle->GetPDGCharge() != 0.0) {
            // Charged particles
            AddIonisation(particle);
        }
    }
}
```

## Cut Management Methods

### SetCuts()
`source/run/include/G4VUserPhysicsList.hh:125`

```cpp
virtual void SetCuts();
```

**Purpose:** Set production cuts for secondary particles

**When Called:** After ConstructProcess() during initialization

**Default Behavior:** Sets defaultCutValue for γ, e-, e+ in default region

**Override Example:**
```cpp
void MyPhysicsList::SetCuts()
{
    // Set default cut value
    SetDefaultCutValue(1.0*mm);

    // Apply to gamma, e-, e+ in default region
    SetCuts();

    // Override for specific particles
    SetCutValue(0.1*mm, "gamma");
    SetCutValue(0.1*mm, "e-");
    SetCutValue(0.1*mm, "e+");

    // Different cuts for different regions
    SetCutValue(0.01*mm, "e-", "DetectorRegion");
    SetCutValue(10*mm, "e-", "ShieldingRegion");
}
```

### SetDefaultCutValue()
`source/run/include/G4VUserPhysicsList.hh:130`

```cpp
void SetDefaultCutValue(G4double newCutValue);
```

**Purpose:** Set default production cut for γ, e-, e+

**Parameters:**
- `newCutValue`: Cut value (length unit)

**Example:**
```cpp
// In constructor or SetCuts()
SetDefaultCutValue(1.0*mm);   // 1 mm cut
SetDefaultCutValue(0.1*mm);   // 100 μm cut (more precise, slower)
SetDefaultCutValue(10*mm);    // 1 cm cut (faster, less precise)
```

::: tip Cut Value Impact
- **Smaller cuts**: More secondaries, slower, more accurate
- **Larger cuts**: Fewer secondaries, faster, less accurate
- **Typical range**: 0.01 mm to 10 mm
- **Energy correlation**: Cut in length → threshold energy varies by material
:::

### GetDefaultCutValue()
`source/run/include/G4VUserPhysicsList.hh:131`

```cpp
G4double GetDefaultCutValue() const;
```

**Returns:** Current default cut value

### SetCutValue() - By Particle
`source/run/include/G4VUserPhysicsList.hh:193`

```cpp
void SetCutValue(G4double aCut, const G4String& pname);
```

**Purpose:** Set cut for specific particle in default region

**Parameters:**
- `aCut`: Cut value (length)
- `pname`: Particle name ("gamma", "e-", "e+", "proton")

**Example:**
```cpp
SetCutValue(0.1*mm, "gamma");
SetCutValue(0.5*mm, "e-");
SetCutValue(0.5*mm, "e+");
SetCutValue(1.0*mm, "proton");
```

### SetCutValue() - By Particle and Region
`source/run/include/G4VUserPhysicsList.hh:199`

```cpp
void SetCutValue(G4double aCut, const G4String& pname,
                 const G4String& rname);
```

**Purpose:** Set cut for specific particle in specific region

**Parameters:**
- `aCut`: Cut value (length)
- `pname`: Particle name
- `rname`: Region name

**Example:**
```cpp
// Tight cuts in detector region
SetCutValue(0.01*mm, "gamma", "DetectorRegion");
SetCutValue(0.01*mm, "e-", "DetectorRegion");

// Loose cuts in shielding
SetCutValue(10*mm, "gamma", "ShieldingRegion");
SetCutValue(10*mm, "e-", "ShieldingRegion");
```

## Physics Table Methods

### BuildPhysicsTable()
`source/run/include/G4VUserPhysicsList.hh:136`

```cpp
void BuildPhysicsTable();
```

**Purpose:** Build physics tables for all particles and processes

**When Called:** Automatically by G4RunManager::Initialize()

**Use Case:** Rarely called directly by users

### StorePhysicsTable()
`source/run/include/G4VUserPhysicsList.hh:147`

```cpp
G4bool StorePhysicsTable(const G4String& directory = ".");
```

**Purpose:** Store physics tables to files for later retrieval

**Parameters:**
- `directory`: Directory path for table files

**Returns:** `true` if successful

**Example:**
```cpp
// In your physics list
void MyPhysicsList::SetCuts()
{
    SetDefaultCutValue(1.0*mm);
    SetCutsWithDefault();

    // Store tables for future runs
    if (StorePhysicsTable("./physics_tables")) {
        G4cout << "Physics tables stored successfully" << G4endl;
    }
}
```

### SetPhysicsTableRetrieved()
`source/run/include/G4VUserPhysicsList.hh:160`

```cpp
void SetPhysicsTableRetrieved(const G4String& directory = "");
```

**Purpose:** Enable retrieval of physics tables from files

**Parameters:**
- `directory`: Directory containing table files

**Example:**
```cpp
// In main() before Initialize()
auto physicsList = new MyPhysicsList;
physicsList->SetPhysicsTableRetrieved("./physics_tables");
runManager->SetUserInitialization(physicsList);
```

::: tip Performance Optimization
Storing and retrieving physics tables can significantly reduce initialization time for complex physics lists, especially for hadron physics at high energies.
:::

## Verbosity Control

### SetVerboseLevel()
`source/run/include/G4VUserPhysicsList.hh:182`

```cpp
void SetVerboseLevel(G4int value);
```

**Purpose:** Control amount of output during physics list initialization

**Parameters:**
- `value`: Verbosity level (0=silent, 1=warning, 2=info, 3+=debug)

**Example:**
```cpp
MyPhysicsList::MyPhysicsList()
{
    SetVerboseLevel(1);  // Show warnings only
}
```

### GetVerboseLevel()
`source/run/include/G4VUserPhysicsList.hh:183`

```cpp
G4int GetVerboseLevel() const;
```

**Returns:** Current verbosity level

## Multi-threading Methods

### InitializeWorker()
`source/run/include/G4VUserPhysicsList.hh:238`

```cpp
virtual void InitializeWorker();
```

**Purpose:** Initialize physics list for worker thread

**When Called:** Automatically by G4WorkerRunManager

**Override:** Only if custom worker initialization needed

**Example:**
```cpp
void MyPhysicsList::InitializeWorker()
{
    // Call base class
    G4VUserPhysicsList::InitializeWorker();

    // Custom worker initialization
    InitializeThreadLocalData();
}
```

### TerminateWorker()
`source/run/include/G4VUserPhysicsList.hh:242`

```cpp
virtual void TerminateWorker();
```

**Purpose:** Clean up physics list in worker thread

**When Called:** When worker thread terminates

**Override:** Only if custom cleanup needed

## Complete Usage Examples

### Minimal EM Physics List

```cpp
// MinimalPhysicsList.hh
#ifndef MinimalPhysicsList_h
#define MinimalPhysicsList_h 1

#include "G4VUserPhysicsList.hh"

class MinimalPhysicsList : public G4VUserPhysicsList
{
public:
    MinimalPhysicsList();
    virtual ~MinimalPhysicsList() = default;

protected:
    virtual void ConstructParticle() override;
    virtual void ConstructProcess() override;
    virtual void SetCuts() override;

private:
    void ConstructEM();
};

#endif

// MinimalPhysicsList.cc
#include "MinimalPhysicsList.hh"

#include "G4SystemOfUnits.hh"

// Particles
#include "G4Gamma.hh"
#include "G4Electron.hh"
#include "G4Positron.hh"

// EM Processes
#include "G4PhotoElectricEffect.hh"
#include "G4ComptonScattering.hh"
#include "G4GammaConversion.hh"
#include "G4eMultipleScattering.hh"
#include "G4eIonisation.hh"
#include "G4eBremsstrahlung.hh"
#include "G4eplusAnnihilation.hh"

MinimalPhysicsList::MinimalPhysicsList()
    : G4VUserPhysicsList()
{
    SetVerboseLevel(1);
    SetDefaultCutValue(1.0*mm);
}

void MinimalPhysicsList::ConstructParticle()
{
    G4Gamma::GammaDefinition();
    G4Electron::ElectronDefinition();
    G4Positron::PositronDefinition();
}

void MinimalPhysicsList::ConstructProcess()
{
    AddTransportation();
    ConstructEM();
}

void MinimalPhysicsList::ConstructEM()
{
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while ((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4ProcessManager* pmanager = particle->GetProcessManager();
        G4String particleName = particle->GetParticleName();

        if (particleName == "gamma") {
            pmanager->AddDiscreteProcess(new G4PhotoElectricEffect);
            pmanager->AddDiscreteProcess(new G4ComptonScattering);
            pmanager->AddDiscreteProcess(new G4GammaConversion);

        } else if (particleName == "e-") {
            pmanager->AddProcess(new G4eMultipleScattering, -1, 1, 1);
            pmanager->AddProcess(new G4eIonisation, -1, 2, 2);
            pmanager->AddProcess(new G4eBremsstrahlung, -1, 3, 3);

        } else if (particleName == "e+") {
            pmanager->AddProcess(new G4eMultipleScattering, -1, 1, 1);
            pmanager->AddProcess(new G4eIonisation, -1, 2, 2);
            pmanager->AddProcess(new G4eBremsstrahlung, -1, 3, 3);
            pmanager->AddProcess(new G4eplusAnnihilation, 0, -1, 4);
        }
    }
}

void MinimalPhysicsList::SetCuts()
{
    SetDefaultCutValue(1.0*mm);
    SetCutsWithDefault();
}
```

### Using Reference Physics List

```cpp
// Recommended: Use pre-built physics list
#include "FTFP_BERT.hh"

int main()
{
    auto runManager = new G4RunManager;

    // Use reference physics list (much easier!)
    runManager->SetUserInitialization(new FTFP_BERT);

    // ... rest of initialization
}
```

### Custom Physics with Modular Approach

```cpp
#include "G4VModularPhysicsList.hh"
#include "G4EmStandardPhysics.hh"
#include "G4DecayPhysics.hh"
#include "G4HadronElasticPhysics.hh"
#include "G4HadronPhysicsFTFP_BERT.hh"

class MyPhysicsList : public G4VModularPhysicsList
{
public:
    MyPhysicsList() {
        SetVerboseLevel(1);

        // EM physics
        RegisterPhysics(new G4EmStandardPhysics());

        // Decay
        RegisterPhysics(new G4DecayPhysics());

        // Hadronic physics
        RegisterPhysics(new G4HadronElasticPhysics());
        RegisterPhysics(new G4HadronPhysicsFTFP_BERT());

        SetDefaultCutValue(1.0*mm);
    }
};
```

## Registration Pattern

```cpp
// main.cc
#include "G4RunManager.hh"
#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"  // Or FTFP_BERT.hh
#include "MyActionInitialization.hh"

int main()
{
    auto runManager = new G4RunManager;

    // Set detector construction
    runManager->SetUserInitialization(new MyDetectorConstruction);

    // Set physics list (mandatory)
    runManager->SetUserInitialization(new MyPhysicsList);
    // Or use reference: runManager->SetUserInitialization(new FTFP_BERT);

    // Set action initialization
    runManager->SetUserInitialization(new MyActionInitialization);

    runManager->Initialize();
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

## Common Reference Physics Lists

| Physics List | Use Case | Energy Range |
|--------------|----------|--------------|
| FTFP_BERT | General purpose (recommended) | All |
| QGSP_BERT | High energy physics | >10 GeV |
| QGSP_BIC | High energy, improved low-E | >10 GeV |
| Shielding | Shielding studies | All |
| QGSP_BERT_HP | With high-precision neutrons | All |
| Penelope | Low energy EM | <1 GeV |
| Livermore | Low energy EM | <1 GeV |

## Thread Safety

### Shared Resources (Master Thread)
- Particle table
- Process table
- Cross-section tables
- Material tables

### Thread-Local Resources (Per Worker)
- Process managers
- Step limiters
- User limits

### Best Practices
```cpp
void MyPhysicsList::InitializeWorker()
{
    // Call base class implementation (important!)
    G4VUserPhysicsList::InitializeWorker();

    // Initialize thread-local resources if needed
}
```

## Performance Considerations

1. **Physics Table Storage**: Cache tables for faster startup
2. **Cut Values**: Larger cuts = faster simulation
3. **Process Selection**: Only include needed processes
4. **Range Cuts**: Optimize per region
5. **EM Options**: Use G4EmParameters for tuning

## Common Pitfalls

::: warning Common Errors
1. **Forgetting AddTransportation()**: Particles won't move
2. **Missing Particles**: Process creation fails if particle not constructed
3. **Wrong Process Ordering**: Affects accuracy (use RegisterProcess())
4. **Cuts Too Small**: Simulation becomes very slow
5. **Custom vs Reference**: Reference physics lists are thoroughly validated
:::

## See Also

- [G4VUserDetectorConstruction](g4vuserdetectorconstruction.md) - Geometry initialization
- [G4VUserActionInitialization](g4vuseractioninitialization.md) - Action setup
- [G4RunManager](g4runmanager.md) - Sequential run management
- [G4MTRunManager](g4mtrunmanager.md) - Multi-threaded run management
- [Run Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/run/include/G4VUserPhysicsList.hh`
- Source: `source/run/src/G4VUserPhysicsList.cc`
- Reference Physics Lists: `source/physics_lists/lists/include/`
:::
