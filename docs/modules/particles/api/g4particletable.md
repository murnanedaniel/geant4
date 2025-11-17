# G4ParticleTable API Documentation

## Overview

`G4ParticleTable` is the central singleton registry that manages all particle definitions in Geant4. It maintains dictionaries that allow lookup of particles by name or PDG encoding, handles particle insertion and removal, and provides iteration capabilities. The class implements thread-safe access patterns for multi-threaded applications using thread-local storage for dictionaries while maintaining a shared master registry.

::: tip Header File
**Location:** `source/particles/management/include/G4ParticleTable.hh`
**Source:** `source/particles/management/src/G4ParticleTable.cc`
**Inline:** `source/particles/management/include/G4ParticleTable.icc`
:::

## Class Declaration

```cpp
class G4ParticleTable
{
  public:
    using G4PTblDictionary =
        G4ParticleTableIterator<G4String, G4ParticleDefinition*>::Map;
    using G4PTblDicIterator =
        G4ParticleTableIterator<G4String, G4ParticleDefinition*>;
    using G4PTblEncodingDictionary =
        G4ParticleTableIterator<G4int, G4ParticleDefinition*>::Map;
    using G4PTblEncodingDicIterator =
        G4ParticleTableIterator<G4int, G4ParticleDefinition*>;

    virtual ~G4ParticleTable();

    // Copy constructor and assignment operator not allowed
    G4ParticleTable(const G4ParticleTable&) = delete;
    G4ParticleTable& operator=(const G4ParticleTable&) = delete;

    // Singleton access
    static G4ParticleTable* GetParticleTable();

    // Particle lookup
    G4ParticleDefinition* FindParticle(G4int PDGEncoding);
    G4ParticleDefinition* FindParticle(const G4String& particle_name);
    G4ParticleDefinition* FindParticle(const G4ParticleDefinition* particle);

    // ... (methods detailed below)
};
```

## Singleton Pattern

### GetParticleTable()
`source/particles/management/src/G4ParticleTable.cc:82-94`

```cpp
static G4ParticleTable* GetParticleTable();
```

**Returns:** Pointer to the singleton `G4ParticleTable` instance

**Behavior:**
- Creates singleton instance on first call
- Initializes thread-local dictionaries if needed
- Thread-safe: can be called from any thread

**Example:**

```cpp
// Access the particle table (from any thread)
G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();

// Find a particle
G4ParticleDefinition* electron = particleTable->FindParticle("e-");
```

::: tip Singleton Access
Always use `GetParticleTable()` to access the particle table. Never create instances directly.
:::

## Particle Lookup Methods

### FindParticle (by PDG encoding)
`source/particles/management/src/G4ParticleTable.cc:498-541`

```cpp
G4ParticleDefinition* FindParticle(G4int aPDGEncoding);
```

**Parameters:**
- `aPDGEncoding`: PDG particle code (e.g., 11 for electron, 2212 for proton)

**Returns:**
- Pointer to particle definition if found
- `nullptr` if not found or encoding is 0

**Behavior:**
- Searches encoding dictionary for particle
- In worker threads, checks shadow dictionary if not found locally
- Thread-safe with mutex protection

**Example:**

```cpp
// Find electron by PDG code
G4ParticleDefinition* electron = particleTable->FindParticle(11);

// Find proton by PDG code
G4ParticleDefinition* proton = particleTable->FindParticle(2212);

// Find photon by PDG code
G4ParticleDefinition* gamma = particleTable->FindParticle(22);

if (electron != nullptr) {
    G4cout << "Found: " << electron->GetParticleName() << G4endl;
}
```

::: warning Invalid Encoding
Passing 0 as PDG encoding returns `nullptr` with a warning message.
:::

### FindParticle (by name)
`source/particles/management/src/G4ParticleTable.cc:447-472`

```cpp
G4ParticleDefinition* FindParticle(const G4String& particle_name);
```

**Parameters:**
- `particle_name`: Particle name (e.g., "e-", "proton", "gamma")

**Returns:**
- Pointer to particle definition if found
- `nullptr` if not found

**Behavior:**
- Searches name dictionary for particle
- In worker threads, checks shadow dictionary if not found locally
- Automatically updates thread-local dictionary when found in shadow
- Thread-safe with mutex protection

**Example:**

```cpp
// Find particles by name
G4ParticleDefinition* electron = particleTable->FindParticle("e-");
G4ParticleDefinition* proton = particleTable->FindParticle("proton");
G4ParticleDefinition* neutron = particleTable->FindParticle("neutron");
G4ParticleDefinition* gamma = particleTable->FindParticle("gamma");

// Check for exotic particles
G4ParticleDefinition* kaon = particleTable->FindParticle("kaon+");
if (kaon != nullptr) {
    G4cout << "Kaon mass: " << kaon->GetPDGMass()/GeV << " GeV" << G4endl;
}
```

### FindParticle (by pointer)
`source/particles/management/src/G4ParticleTable.cc:491-496`

```cpp
G4ParticleDefinition* FindParticle(const G4ParticleDefinition* particle);
```

**Parameters:**
- `particle`: Pointer to particle definition

**Returns:**
- Pointer to particle definition if found in table
- `nullptr` if not found

**Behavior:**
- Extracts particle name and calls `FindParticle(name)`
- Useful for checking if a particle is registered

**Example:**

```cpp
G4ParticleDefinition* particle = /* some particle */;

// Check if particle is in table
if (particleTable->FindParticle(particle) != nullptr) {
    G4cout << "Particle is registered" << G4endl;
}
```

### FindAntiParticle
`source/particles/management/include/G4ParticleTable.icc:46-61`

```cpp
inline G4ParticleDefinition* FindAntiParticle(G4int PDGEncoding);
inline G4ParticleDefinition* FindAntiParticle(const G4String& particle_name);
inline G4ParticleDefinition* FindAntiParticle(const G4ParticleDefinition* particle);
```

**Parameters:**
- `PDGEncoding`: PDG code of particle
- `particle_name`: Name of particle
- `particle`: Pointer to particle definition

**Returns:** Pointer to antiparticle definition, or `nullptr` if not found

**Behavior:**
- Finds particle, gets its anti-PDG encoding, then finds antiparticle
- Automatically handles particles that are their own antiparticle (e.g., photon)

**Example:**

```cpp
// Find antiparticles
G4ParticleDefinition* positron = particleTable->FindAntiParticle("e-");
G4ParticleDefinition* antiproton = particleTable->FindAntiParticle(2212);

// Find antiparticle of electron
G4ParticleDefinition* electron = particleTable->FindParticle(11);
G4ParticleDefinition* positron2 = particleTable->FindAntiParticle(electron);

// Photon is its own antiparticle
G4ParticleDefinition* gamma = particleTable->FindParticle("gamma");
G4ParticleDefinition* antiGamma = particleTable->FindAntiParticle(gamma);
// gamma == antiGamma
```

### GetParticle
`source/particles/management/src/G4ParticleTable.cc:415-435`

```cpp
G4ParticleDefinition* GetParticle(G4int index) const;
```

**Parameters:**
- `index`: Zero-based index (0 <= index < entries())

**Returns:**
- Pointer to particle at given index
- `nullptr` if index out of range

**Behavior:**
- Iterates through dictionary to find particle at index
- Linear time complexity: O(n)
- Order depends on internal dictionary organization

**Example:**

```cpp
// Iterate through all particles by index
G4int nParticles = particleTable->entries();
for (G4int i = 0; i < nParticles; ++i) {
    G4ParticleDefinition* particle = particleTable->GetParticle(i);
    if (particle != nullptr) {
        G4cout << i << ": " << particle->GetParticleName() << G4endl;
    }
}
```

::: warning Performance
Use `GetIterator()` for efficient iteration. `GetParticle(index)` has O(n) complexity per call.
:::

### GetParticleName
`source/particles/management/src/G4ParticleTable.cc:437-445`

```cpp
const G4String& GetParticleName(G4int index) const;
```

**Parameters:**
- `index`: Zero-based index (0 <= index < entries())

**Returns:**
- Particle name at given index
- Empty string if index out of range

**Example:**

```cpp
// Get particle names by index
for (G4int i = 0; i < particleTable->entries(); ++i) {
    G4cout << particleTable->GetParticleName(i) << G4endl;
}
```

### contains
`source/particles/management/include/G4ParticleTable.icc:63-66`
`source/particles/management/src/G4ParticleTable.cc:608-612`

```cpp
inline G4bool contains(const G4ParticleDefinition* particle) const;
G4bool contains(const G4String& particle_name) const;
```

**Parameters:**
- `particle`: Pointer to particle definition
- `particle_name`: Particle name

**Returns:** `true` if particle is in table, `false` otherwise

**Behavior:**
- Fast O(log n) lookup in dictionary
- Searches shadow dictionary (master thread data)

**Example:**

```cpp
// Check if particles exist
if (particleTable->contains("tau-")) {
    G4cout << "Tau lepton is registered" << G4endl;
}

// Check by particle pointer
G4ParticleDefinition* exotic = /* custom particle */;
if (particleTable->contains(exotic)) {
    G4cout << "Exotic particle is registered" << G4endl;
}
```

## Particle Management

### Insert
`source/particles/management/src/G4ParticleTable.cc:289-355`

```cpp
G4ParticleDefinition* Insert(G4ParticleDefinition* particle);
```

**Parameters:**
- `particle`: Pointer to particle definition to insert

**Returns:**
- Same particle pointer if successfully inserted
- Existing particle pointer if particle with same name already exists
- `nullptr` if insertion fails

**Behavior:**
- Validates particle has a name
- Checks if particle already exists (throws exception if duplicate)
- Inserts into both name and encoding dictionaries
- Inserts into ion table if particle is an ion
- Sets particle's verbose level to match table's verbose level
- Updates both master (shadow) and thread-local dictionaries

**Example:**

```cpp
// Create custom particle
G4ParticleDefinition* myParticle = new G4ParticleDefinition(
    "my_exotic",      // name
    1000.0*MeV,       // mass
    0.0*MeV,          // width
    0.0,              // charge
    0,                // spin
    1,                // parity
    0, 0, 0, 0,       // quantum numbers
    "exotic",         // type
    0, 0,             // lepton, baryon numbers
    9900001,          // PDG encoding
    false,            // not stable
    1.0*ns,           // lifetime
    nullptr           // decay table
);

// Insert into particle table
G4ParticleDefinition* result = particleTable->Insert(myParticle);
if (result == myParticle) {
    G4cout << "Particle successfully inserted" << G4endl;
}
```

::: warning Duplicate Names
Attempting to insert a particle with an existing name throws a fatal exception.
:::

::: tip Automatic Registration
Most particle definitions register themselves automatically in their constructor. Manual insertion is rarely needed.
:::

### Remove
`source/particles/management/src/G4ParticleTable.cc:357-413`

```cpp
G4ParticleDefinition* Remove(G4ParticleDefinition* particle);
```

**Parameters:**
- `particle`: Pointer to particle definition to remove

**Returns:**
- Same particle pointer if successfully removed
- `nullptr` if particle not found or removal not allowed

**Behavior:**
- Only works in Pre_Init state
- Not allowed from worker threads
- Removes from name and encoding dictionaries
- Removes from ion table if particle is an ion
- Does NOT delete the particle object (caller responsible)

**Example:**

```cpp
// Remove particle (only in Pre_Init state)
G4ParticleDefinition* exotic = particleTable->FindParticle("my_exotic");
if (exotic != nullptr) {
    G4ParticleDefinition* removed = particleTable->Remove(exotic);
    if (removed != nullptr) {
        delete removed;  // Clean up
    }
}
```

::: warning State Restrictions
Removal only works in Pre_Init state. Attempts in other states generate warnings and have no effect.
:::

::: danger Worker Thread Restriction
Cannot remove particles from worker threads. Requests are ignored with a warning.
:::

### RemoveAllParticles
`source/particles/management/src/G4ParticleTable.cc:264-287`

```cpp
void RemoveAllParticles();
```

**Behavior:**
- Removes all particles from table (does NOT delete them)
- Clears ion table
- Clears both name and encoding dictionaries
- Only effective when `readyToUse` is false

**Example:**

```cpp
// Remove all particles (only when readyToUse is false)
particleTable->SetReadiness(false);
particleTable->RemoveAllParticles();
```

::: warning Readiness Check
If `readyToUse` is true, this method has no effect and issues a warning.
:::

### DeleteAllParticles
`source/particles/management/src/G4ParticleTable.cc:237-262`

```cpp
void DeleteAllParticles();
```

**Behavior:**
- Sets `readyToUse` to false
- Iterates through all particles and deletes them
- Calls `RemoveAllParticles()` to clear dictionaries

**Example:**

```cpp
// Clean up all particles (typically done at program end)
particleTable->DeleteAllParticles();
```

::: danger Memory Management
This deletes all particle definitions. Only call during cleanup phase.
:::

## Table Information

### entries() / size()
`source/particles/management/src/G4ParticleTable.cc:614-622`

```cpp
G4int entries() const;
G4int size() const;
```

**Returns:** Number of particles in the table

**Behavior:**
- Both methods return same value
- Counts particles in thread-local dictionary

**Example:**

```cpp
G4int nParticles = particleTable->entries();
G4cout << "Particle table contains " << nParticles << " particles" << G4endl;

// Alternative
G4int tableSize = particleTable->size();
```

### GetIterator()
`source/particles/management/src/G4ParticleTable.cc:598-601`

```cpp
G4PTblDicIterator* GetIterator() const;
```

**Returns:** Pointer to dictionary iterator for thread-local particle dictionary

**Purpose:** Efficient iteration over all particles in table

**Example:**

```cpp
// Get iterator
G4ParticleTable::G4PTblDicIterator* iterator =
    particleTable->GetIterator();

// Iterate through all particles
iterator->reset();
while ((*iterator)()) {
    G4ParticleDefinition* particle = iterator->value();
    G4String name = particle->GetParticleName();
    G4int pdg = particle->GetPDGEncoding();
    G4double mass = particle->GetPDGMass();

    G4cout << "Particle: " << name
           << " (PDG: " << pdg << ")"
           << " Mass: " << mass/GeV << " GeV"
           << G4endl;
}
```

::: tip Best Practice
Use `GetIterator()` for efficient iteration. Much faster than repeated `GetParticle(index)` calls.
:::

### DumpTable
`source/particles/management/src/G4ParticleTable.cc:543-570`

```cpp
void DumpTable(const G4String& particle_name = "ALL");
```

**Parameters:**
- `particle_name`: Name of particle to dump, or "ALL" (default) for all particles

**Behavior:**
- If "ALL" or "all": dumps information for all particles
- Otherwise: dumps information for specified particle only
- Calls `DumpTable()` on each particle definition

**Example:**

```cpp
// Dump all particles
particleTable->DumpTable();

// Dump specific particle
particleTable->DumpTable("e-");

// Dump all particles explicitly
particleTable->DumpTable("ALL");
```

**Sample Output:**

```
--- G4ParticleDefinition ---
 Particle Name : e-
 PDG particle code : 11 [PDG anti-particle code: -11]
 Mass [GeV/c2] : 0.000511     Width : 0
 Lifetime [nsec] : 0
 Charge [e]: -1
 ...
```

## Special Particle Access

### GetIonTable
`source/particles/management/src/G4ParticleTable.cc:588-591`

```cpp
G4IonTable* GetIonTable() const;
```

**Returns:** Pointer to the ion table

**Purpose:** Access specialized table for ion management

**Example:**

```cpp
// Access ion table
G4IonTable* ionTable = particleTable->GetIonTable();

// Get specific ion (Carbon-12)
G4ParticleDefinition* carbon12 = ionTable->GetIon(6, 12);

// Get excited state (Carbon-12 first excited state)
G4ParticleDefinition* carbon12_ex = ionTable->GetIon(6, 12, 4.4*MeV);
```

::: tip Ion Management
For ion-specific operations (isotopes, excited states), use the dedicated `G4IonTable` API.
:::

### GetGenericIon / SetGenericIon
`source/particles/management/include/G4ParticleTable.icc:78-86`

```cpp
inline G4ParticleDefinition* GetGenericIon() const;
inline void SetGenericIon(G4ParticleDefinition* gi);
```

**Purpose:** Access/set the generic ion particle definition

**Behavior:**
- Generic ion serves as template for all ion species
- Used by physics processes that apply to all ions

**Example:**

```cpp
// Get generic ion
G4ParticleDefinition* genericIon = particleTable->GetGenericIon();
if (genericIon != nullptr) {
    G4ProcessManager* pManager = genericIon->GetProcessManager();
    // All ions share this process manager
}

// Set generic ion (typically done during initialization)
particleTable->SetGenericIon(G4GenericIon::GenericIon());
```

::: info Generic Ion
The generic ion represents all possible ion species. Physics processes attached to it apply to all ions.
:::

### GetGenericMuonicAtom / SetGenericMuonicAtom
`source/particles/management/include/G4ParticleTable.icc:88-96`

```cpp
inline G4ParticleDefinition* GetGenericMuonicAtom() const;
inline void SetGenericMuonicAtom(G4ParticleDefinition* gma);
```

**Purpose:** Access/set the generic muonic atom particle definition

**Behavior:**
- Generic muonic atom serves as template for all muonic atom species
- Used by physics processes that apply to all muonic atoms

**Example:**

```cpp
// Get generic muonic atom
G4ParticleDefinition* genericMuonicAtom =
    particleTable->GetGenericMuonicAtom();

// Set generic muonic atom (typically done during initialization)
particleTable->SetGenericMuonicAtom(
    G4MuonicAtom::MuonicAtom());
```

::: info Muonic Atoms
Muonic atoms are exotic atoms where a muon replaces one of the electrons. The generic muonic atom provides a template for all such species.
:::

## Selection and Messaging

### SelectParticle
`source/particles/management/src/G4ParticleTable.cc:474-489`

```cpp
void SelectParticle(const G4String& name);
```

**Parameters:**
- `name`: Name of particle to select

**Behavior:**
- Sets selected particle for UI messenger operations
- Thread-safe with mutex protection
- Only updates if name is different from current selection

**Example:**

```cpp
// Select electron for UI commands
particleTable->SelectParticle("e-");

// Now UI commands apply to electron
// e.g., /particle/select e-
```

### GetSelectedParticle
`source/particles/management/include/G4ParticleTable.icc:98-101`

```cpp
inline const G4ParticleDefinition* GetSelectedParticle() const;
```

**Returns:** Pointer to currently selected particle

**Example:**

```cpp
// Get currently selected particle
const G4ParticleDefinition* selected =
    particleTable->GetSelectedParticle();

if (selected != nullptr) {
    G4cout << "Selected: " << selected->GetParticleName() << G4endl;
}
```

### CreateMessenger
`source/particles/management/src/G4ParticleTable.cc:228-235`

```cpp
G4UImessenger* CreateMessenger();
```

**Returns:** Pointer to particle table UI messenger

**Behavior:**
- Creates messenger if not already created
- Messenger provides UI commands for particle table operations

**Example:**

```cpp
// Create messenger (typically done automatically)
G4UImessenger* messenger = particleTable->CreateMessenger();

// UI commands now available:
// /particle/list
// /particle/find <name>
// /particle/select <name>
// etc.
```

::: info UI Commands
The messenger enables interactive particle table operations through Geant4's UI system.
:::

## Configuration

### SetVerboseLevel / GetVerboseLevel
`source/particles/management/include/G4ParticleTable.icc:31-39`

```cpp
inline void SetVerboseLevel(G4int value);
inline G4int GetVerboseLevel() const;
```

**Parameters:**
- `value`: Verbosity level (0=silent, 1=warnings, 2=more verbose)

**Returns:** Current verbosity level

**Behavior:**
- Controls output messages from particle table operations
- Level 0: Silent
- Level 1: Warning messages (default)
- Level 2: More detailed output

**Example:**

```cpp
// Set verbose output
particleTable->SetVerboseLevel(2);

// Get current level
G4int verbosity = particleTable->GetVerboseLevel();

// Disable all messages
particleTable->SetVerboseLevel(0);
```

### SetReadiness / GetReadiness
`source/particles/management/include/G4ParticleTable.icc:68-76`

```cpp
inline void SetReadiness(G4bool val = true);
inline G4bool GetReadiness() const;
```

**Parameters:**
- `val`: Readiness flag (`true` = ready to use)

**Returns:** Current readiness state

**Behavior:**
- Controls whether particle table is ready for physics operations
- Should be set to `true` after physics list initialization
- Set to `false` before modifications

**Example:**

```cpp
// Check if table is ready
if (particleTable->GetReadiness()) {
    G4cout << "Particle table is ready" << G4endl;
}

// Set readiness (typically done by framework)
particleTable->SetReadiness(true);
```

::: warning Readiness State
Many operations check readiness and throw exceptions if accessed before initialization. The framework manages this automatically.
:::

## Thread Safety

### WorkerG4ParticleTable
`source/particles/management/src/G4ParticleTable.cc:130-169`

```cpp
void WorkerG4ParticleTable();
```

**Purpose:** Initialize thread-local particle table data for worker thread

**Behavior:**
- Creates thread-local dictionaries
- Copies particle definitions from master (shadow) dictionaries
- Sets up thread-local iterator
- Mutex-protected for thread safety
- Calls `WorkerG4IonTable()` to initialize ion table

**Example:**

```cpp
// Called automatically by GetParticleTable() in worker threads
// Manual call not typically needed

// Framework handles this:
// In worker thread initialization:
if (fDictionary == nullptr) {
    fgParticleTable->WorkerG4ParticleTable();
}
```

::: info Automatic Initialization
`GetParticleTable()` automatically calls this method in worker threads. Manual invocation is rarely needed.
:::

### DestroyWorkerG4ParticleTable
`source/particles/management/src/G4ParticleTable.cc:206-226`

```cpp
void DestroyWorkerG4ParticleTable();
```

**Purpose:** Clean up thread-local particle table data for worker thread

**Behavior:**
- Destroys worker ion table
- Deletes thread-local encoding dictionary
- Deletes thread-local iterator
- Clears and deletes thread-local particle dictionary

**Example:**

```cpp
// Called during worker thread cleanup
// Typically invoked by framework, not user code

void MyRunAction::EndOfRunAction(const G4Run* run) {
    // Framework calls this automatically during cleanup
}
```

### Thread-Local Dictionaries

#### fDictionary (Thread-Local)
`source/particles/management/src/G4ParticleTable.cc:51-52`

```cpp
static G4ThreadLocal G4PTblDictionary* fDictionary;
static G4ThreadLocal G4PTblDicIterator* fIterator;
```

**Purpose:** Thread-local particle name dictionary and iterator

**Behavior:**
- Each thread maintains its own copy
- Populated from shadow dictionary on worker thread initialization
- Enables lock-free read access within thread

#### fEncodingDictionary (Thread-Local)
`source/particles/management/src/G4ParticleTable.cc:53-54`

```cpp
static G4ThreadLocal G4PTblEncodingDictionary* fEncodingDictionary;
```

**Purpose:** Thread-local PDG encoding dictionary

**Behavior:**
- Maps PDG codes to particle definitions
- Thread-local for efficient lookup
- Synchronized with name dictionary

#### Shadow Dictionaries (Master)
`source/particles/management/src/G4ParticleTable.cc:59-61`

```cpp
static G4PTblDictionary* fDictionaryShadow;
static G4PTblDicIterator* fIteratorShadow;
static G4PTblEncodingDictionary* fEncodingDictionaryShadow;
```

**Purpose:** Master thread dictionaries shared across threads

**Behavior:**
- Contains authoritative particle list
- Used to populate worker thread dictionaries
- Protected by mutex during worker initialization

**Thread Safety Pattern:**

```cpp
// In worker thread FindParticle():
G4ParticleDefinition* FindParticle(const G4String& name) {
    // First check thread-local dictionary (no lock needed)
    auto it = fDictionary->find(name);
    if (it != fDictionary->end()) {
        return (*it).second;
    }

    // If not found, check shadow dictionary (with lock)
    if (G4Threading::IsWorkerThread()) {
        G4MUTEXLOCK(&particleTableMutex());
        auto its = fDictionaryShadow->find(name);
        if (its != fDictionaryShadow->end()) {
            // Cache in thread-local dictionary
            fDictionary->insert(*its);
            ptcl = (*its).second;
        }
        G4MUTEXUNLOCK(&particleTableMutex());
    }
    return ptcl;
}
```

## Usage Examples

### Basic Particle Lookup

```cpp
// Access particle table
G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();

// Find particles by name
G4ParticleDefinition* electron = particleTable->FindParticle("e-");
G4ParticleDefinition* proton = particleTable->FindParticle("proton");
G4ParticleDefinition* neutron = particleTable->FindParticle("neutron");

// Find particles by PDG code
G4ParticleDefinition* muon = particleTable->FindParticle(13);     // mu-
G4ParticleDefinition* pion = particleTable->FindParticle(211);    // pi+
G4ParticleDefinition* gamma = particleTable->FindParticle(22);    // photon

// Find antiparticles
G4ParticleDefinition* positron = particleTable->FindAntiParticle("e-");
G4ParticleDefinition* antiproton = particleTable->FindAntiParticle(2212);

// Check if particle exists
if (particleTable->contains("tau-")) {
    G4cout << "Tau lepton is available" << G4endl;
}
```

### Iterating Through All Particles

```cpp
// Method 1: Using iterator (RECOMMENDED)
G4ParticleTable::G4PTblDicIterator* iterator =
    particleTable->GetIterator();

iterator->reset();
while ((*iterator)()) {
    G4ParticleDefinition* particle = iterator->value();

    G4String name = particle->GetParticleName();
    G4double mass = particle->GetPDGMass();
    G4int pdg = particle->GetPDGEncoding();
    G4String type = particle->GetParticleType();

    G4cout << std::setw(20) << name
           << " PDG: " << std::setw(10) << pdg
           << " Mass: " << mass/GeV << " GeV"
           << " Type: " << type
           << G4endl;
}

// Method 2: Using index (less efficient)
G4int nParticles = particleTable->entries();
for (G4int i = 0; i < nParticles; ++i) {
    G4ParticleDefinition* particle = particleTable->GetParticle(i);
    if (particle != nullptr) {
        G4cout << i << ": " << particle->GetParticleName() << G4endl;
    }
}
```

### Working with Ions

```cpp
// Access ion table
G4IonTable* ionTable = particleTable->GetIonTable();

// Get specific ions
G4ParticleDefinition* carbon12 = ionTable->GetIon(6, 12, 0.0);  // C-12
G4ParticleDefinition* oxygen16 = ionTable->GetIon(8, 16, 0.0);  // O-16
G4ParticleDefinition* uranium238 = ionTable->GetIon(92, 238);   // U-238

// Get excited state
G4ParticleDefinition* carbon12_ex1 =
    ionTable->GetIon(6, 12, 4.4389*MeV);  // First excited state

// Check ion properties
if (carbon12 != nullptr) {
    G4int Z = carbon12->GetAtomicNumber();      // 6
    G4int A = carbon12->GetAtomicMass();        // 12
    G4double mass = carbon12->GetPDGMass();

    G4cout << "Ion: Z=" << Z << ", A=" << A
           << ", Mass=" << mass/MeV << " MeV" << G4endl;
}

// Get generic ion for process setup
G4ParticleDefinition* genericIon = particleTable->GetGenericIon();
if (genericIon != nullptr) {
    G4ProcessManager* pManager = genericIon->GetProcessManager();
    // Set up processes that apply to all ions
    pManager->AddProcess(new G4MultipleScattering, -1, 1, 1);
    pManager->AddProcess(new G4ionIonisation, -1, 2, 2);
}
```

### Particle Filtering and Analysis

```cpp
// Count particles by type
G4int nLeptons = 0;
G4int nBaryons = 0;
G4int nMesons = 0;
G4int nBosons = 0;

G4ParticleTable::G4PTblDicIterator* iterator =
    particleTable->GetIterator();

iterator->reset();
while ((*iterator)()) {
    G4ParticleDefinition* particle = iterator->value();
    G4String type = particle->GetParticleType();

    if (type == "lepton") nLeptons++;
    else if (type == "baryon") nBaryons++;
    else if (type == "meson") nMesons++;
    else if (type == "boson") nBosons++;
}

G4cout << "Particle counts:" << G4endl
       << "  Leptons: " << nLeptons << G4endl
       << "  Baryons: " << nBaryons << G4endl
       << "  Mesons: " << nMesons << G4endl
       << "  Bosons: " << nBosons << G4endl;

// Find all charged particles
std::vector<G4ParticleDefinition*> chargedParticles;

iterator->reset();
while ((*iterator)()) {
    G4ParticleDefinition* particle = iterator->value();
    if (particle->GetPDGCharge() != 0.0) {
        chargedParticles.push_back(particle);
    }
}

G4cout << "Found " << chargedParticles.size()
       << " charged particles" << G4endl;

// Find particles with specific properties
iterator->reset();
while ((*iterator)()) {
    G4ParticleDefinition* particle = iterator->value();

    // Find unstable leptons
    if (particle->GetParticleType() == "lepton" &&
        !particle->GetPDGStable()) {
        G4cout << "Unstable lepton: "
               << particle->GetParticleName()
               << " Lifetime: "
               << particle->GetPDGLifeTime()/ns << " ns"
               << G4endl;
    }
}
```

### Custom Particle Registration

```cpp
// Define custom particle class
class MyExoticParticle : public G4ParticleDefinition
{
public:
    static MyExoticParticle* Definition() {
        static MyExoticParticle theInstance;
        return &theInstance;
    }

private:
    MyExoticParticle() : G4ParticleDefinition(
        "exotic_X",        // name
        1500.0*MeV,        // mass
        50.0*MeV,          // width
        0.0,               // charge
        0,                 // spin 0
        1,                 // positive parity
        0, 0, 0, 0,        // quantum numbers
        "exotic",          // type
        0, 0,              // lepton, baryon numbers
        9900001,           // PDG encoding
        false,             // unstable
        0.5*ns,            // lifetime
        nullptr            // decay table
    )
    {
        // Particle automatically registered in constructor
    }
};

// Usage in physics list
void MyPhysicsList::ConstructParticle()
{
    // Construct standard particles
    G4Electron::ElectronDefinition();
    G4Positron::PositronDefinition();
    G4Gamma::GammaDefinition();

    // Construct custom particle
    MyExoticParticle::Definition();

    // Verify registration
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
    if (particleTable->contains("exotic_X")) {
        G4cout << "Custom particle successfully registered" << G4endl;
    }
}
```

### Thread-Safe Particle Access

```cpp
// In user action (worker thread)
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Get particle table (thread-safe)
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();

    // Get track particle
    G4ParticleDefinition* particle =
        step->GetTrack()->GetDefinition();

    // Find related particles (thread-safe lookups)
    if (particle->GetParticleName() == "e-") {
        // Find positron in thread-local dictionary
        G4ParticleDefinition* positron =
            particleTable->FindAntiParticle(particle);

        // Find photon
        G4ParticleDefinition* gamma =
            particleTable->FindParticle(22);

        // All lookups are thread-safe
        // Worker threads have local dictionaries
    }
}

// Multi-threaded initialization
void MyPhysicsList::ConstructProcess()
{
    // Master thread sets up generic processes
    if (G4Threading::IsMasterThread()) {
        G4ParticleTable* particleTable =
            G4ParticleTable::GetParticleTable();

        G4ParticleTable::G4PTblDicIterator* iterator =
            particleTable->GetIterator();

        iterator->reset();
        while ((*iterator)()) {
            G4ParticleDefinition* particle = iterator->value();
            // Set up master process managers
        }
    }

    // Worker threads get copies via WorkerG4ParticleTable()
    // No manual synchronization needed
}
```

### Dumping Particle Information

```cpp
// Dump all particles
particleTable->DumpTable();

// Dump specific particle
particleTable->DumpTable("e-");

// Custom particle information output
void PrintParticleInfo(const G4String& name)
{
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
    G4ParticleDefinition* particle = particleTable->FindParticle(name);

    if (particle != nullptr) {
        G4cout << "\n=== Particle Information ===" << G4endl;
        G4cout << "Name: " << particle->GetParticleName() << G4endl;
        G4cout << "PDG Code: " << particle->GetPDGEncoding() << G4endl;
        G4cout << "Mass: " << particle->GetPDGMass()/GeV << " GeV" << G4endl;
        G4cout << "Charge: " << particle->GetPDGCharge()/eplus << " e" << G4endl;
        G4cout << "Spin: " << particle->GetPDGSpin() << G4endl;
        G4cout << "Type: " << particle->GetParticleType() << G4endl;
        G4cout << "Stable: " << (particle->GetPDGStable() ? "Yes" : "No") << G4endl;

        if (!particle->GetPDGStable()) {
            G4cout << "Lifetime: " << particle->GetPDGLifeTime()/ns << " ns" << G4endl;
        }

        G4cout << "Lepton Number: " << particle->GetLeptonNumber() << G4endl;
        G4cout << "Baryon Number: " << particle->GetBaryonNumber() << G4endl;
        G4cout << "===========================\n" << G4endl;
    }
    else {
        G4cout << "Particle '" << name << "' not found" << G4endl;
    }
}

// Usage
PrintParticleInfo("e-");
PrintParticleInfo("proton");
PrintParticleInfo("pi+");
```

## Thread Safety Notes

### Multi-Threading Architecture

`G4ParticleTable` implements a sophisticated thread-safety model:

**Master Thread:**
- Maintains authoritative particle list in shadow dictionaries
- All particle insertions happen here
- Shadow dictionaries are shared (read-only) across threads

**Worker Threads:**
- Each has thread-local dictionary copies
- Lazy population: particles copied from shadow on first access
- Lock-free read access within thread
- Mutex protection only when accessing shadow dictionaries

### Thread-Safe Operations

::: tip Safe Operations
These operations are thread-safe and can be called from any thread:

- `GetParticleTable()` - Returns singleton, initializes thread-local data
- `FindParticle()` - Searches thread-local dictionary, falls back to shadow
- `FindAntiParticle()` - Same as FindParticle
- `GetParticle()` - Iterates thread-local dictionary
- `contains()` - Checks shadow dictionary (read-only)
- `entries()`/`size()` - Returns thread-local count
- `GetIterator()` - Returns thread-local iterator
- `GetIonTable()` - Returns ion table (has own thread-safety)
:::

### Unsafe Operations

::: danger Unsafe from Worker Threads
These operations are NOT safe from worker threads:

- `Insert()` - Only master thread can insert particles
- `Remove()` - Explicitly blocked in worker threads
- `RemoveAllParticles()` - Master thread only
- `DeleteAllParticles()` - Master thread only
:::

### Initialization Pattern

```cpp
// In main() - Master thread
int main(int argc, char** argv)
{
    // Create run manager
    G4RunManager* runManager = new G4RunManager;

    // Set physics list (constructs particles in master)
    runManager->SetUserInitialization(new MyPhysicsList);

    // Particle table is now initialized with all particles
    G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
    particleTable->SetReadiness(true);

    // Initialize - spawns worker threads
    runManager->Initialize();

    // Worker threads automatically call WorkerG4ParticleTable()
    // to create thread-local copies

    return 0;
}
```

### Thread-Local Dictionary Population

The particle table uses lazy initialization for thread-local dictionaries:

1. **First Access in Worker:**
   - `GetParticleTable()` checks if `fDictionary` is null
   - If null, calls `WorkerG4ParticleTable()`
   - Copies all particles from shadow to thread-local dictionary

2. **Lazy Particle Copy:**
   - `FindParticle()` first checks thread-local dictionary
   - If not found, locks mutex and checks shadow dictionary
   - If found in shadow, copies to thread-local dictionary
   - Subsequent accesses are lock-free

**Example Flow:**

```cpp
// Worker thread first time
G4ParticleTable* table = G4ParticleTable::GetParticleTable();
// -> Calls WorkerG4ParticleTable()
// -> Copies all particles from shadow

// Find exotic particle added after initialization
G4ParticleDefinition* exotic = table->FindParticle("new_exotic");
// -> Not in thread-local dictionary
// -> Locks mutex, checks shadow
// -> Copies to thread-local if found
// -> Next lookup is lock-free
```

### Performance Characteristics

**Read Operations (after initialization):**
- O(log n) dictionary lookup
- Lock-free in worker threads
- Cache-friendly (thread-local data)

**Write Operations:**
- Only allowed in master thread
- Mutex-protected shadow dictionary access
- Rare after initialization

### Best Practices

```cpp
// GOOD: Read-only access from any thread
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4ParticleTable* table = G4ParticleTable::GetParticleTable();
    G4ParticleDefinition* particle = table->FindParticle("e-");
    // Thread-safe, lock-free after first access
}

// GOOD: Cache frequently accessed particles
class MyAction : public G4UserSteppingAction
{
    G4ParticleDefinition* fElectron;
    G4ParticleDefinition* fGamma;

public:
    MyAction() {
        G4ParticleTable* table = G4ParticleTable::GetParticleTable();
        fElectron = table->FindParticle("e-");
        fGamma = table->FindParticle("gamma");
    }

    void UserSteppingAction(const G4Step* step) override {
        // Use cached pointers - fastest
        if (step->GetTrack()->GetDefinition() == fElectron) {
            // Process electron
        }
    }
};

// BAD: Modify from worker thread
void SomeWorkerMethod()  // WRONG!
{
    G4ParticleTable* table = G4ParticleTable::GetParticleTable();
    G4ParticleDefinition* particle = new G4ParticleDefinition(...);
    table->Insert(particle);  // BLOCKED! Warning issued
}

// GOOD: All modifications in master thread
void MyPhysicsList::ConstructParticle()  // Master thread
{
    // All particle construction here
    G4Electron::ElectronDefinition();
    G4Positron::PositronDefinition();
    // etc.
}
```

## See Also

### Related Classes

- [G4ParticleDefinition](g4particledefinition.md) - Individual particle properties
- [G4IonTable](g4iontable.md) - Specialized ion management
- [G4ParticleMessenger](g4particlemessenger.md) - UI commands for particle table
- [G4DecayTable](g4decaytable.md) - Particle decay channels

### Module Documentation

- [Particles Module Overview](../index.md) - Complete particles module documentation
- [Particle Types](../particle-types.md) - Standard Geant4 particles
- [Process Management](../../processes/index.md) - Physics processes

### User Guides

- [Geant4 User Guide - Particle Definition](https://geant4.web.cern.ch/docs/) - Official documentation
- [Particle Data Group (PDG)](https://pdg.lbl.gov/) - PDG particle codes and properties

---

::: info Source Reference
Complete implementation in:
- Header: `source/particles/management/include/G4ParticleTable.hh`
- Source: `source/particles/management/src/G4ParticleTable.cc`
- Inline: `source/particles/management/include/G4ParticleTable.icc`
:::
