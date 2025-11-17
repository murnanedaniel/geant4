# G4IonTable

**File**: `source/particles/management/include/G4IonTable.hh`

## Overview

G4IonTable is a specialized particle table for managing ions in Geant4. It stores and provides access to all ion particle definitions, including ground states, excited states, isomers, hypernuclei (with lambda particles), and muonic atoms. The table integrates with G4NuclideTable to provide accurate nuclear properties such as masses, lifetimes, and decay information.

## Class Description

G4IonTable extends Geant4's particle management system specifically for ions. It supports:

- **Regular ions**: Nuclei with atomic number Z and mass number A
- **Excited states**: Ions with excitation energy E
- **Isomer levels**: Long-lived excited states identified by level number
- **Hypernuclei**: Nuclei containing lambda particles (strange baryons)
- **Muonic atoms**: Atoms with an orbiting muon instead of an electron
- **Light ions**: Special handling for pre-defined ions (proton, deuteron, triton, He3, alpha)

The table is thread-safe and designed to work efficiently in both sequential and multi-threaded applications.

## Type Definitions

### G4IonList

```cpp
using G4IonList = std::multimap<G4int, const G4ParticleDefinition*>;
```

Internal storage using a multimap keyed by PDG encoding.

**Location**: G4IonTable.hh:55

### G4IonListIterator

```cpp
using G4IonListIterator = std::multimap<G4int, const G4ParticleDefinition*>::iterator;
```

Iterator for traversing the ion list.

**Location**: G4IonTable.hh:56

## Constants

### numberOfElements

```cpp
enum { numberOfElements = 118 };
```

Number of elements in the periodic table.

**Location**: G4IonTable.hh:249-252

### elementName

```cpp
static const G4String elementName[numberOfElements];
```

Array of element symbols (H, He, Li, ..., Og).

**Location**: G4IonTable.cc:1192-1205

## Constructor & Destructor

### Constructor

```cpp
G4IonTable();
```

Constructs the ion table and initializes the nuclide table.

**Location**: G4IonTable.hh:59

**Implementation**: G4IonTable.cc:110-130

**Note**: Typically accessed via GetIonTable() rather than direct construction.

### Destructor

```cpp
~G4IonTable();
```

Destroys the ion table and cleans up isotope tables.

**Location**: G4IonTable.hh:60

**Implementation**: G4IonTable.cc:132-153

**Note**: Does not delete ion particles themselves as they are managed by G4ParticleTable.

### Deleted Copy Operations

```cpp
G4IonTable(const G4IonTable&) = delete;
G4IonTable& operator=(const G4IonTable&) = delete;
```

Copy construction and assignment are explicitly disabled.

**Location**: G4IonTable.hh:63-64

## Static Access Methods

### GetIonTable

```cpp
static G4IonTable* GetIonTable();
```

Returns pointer to the singleton ion table instance.

**Returns**: Pointer to the global G4IonTable

**Location**: G4IonTable.hh:66

**Implementation**: G4IonTable.cc:155-158

**Usage**: This is the primary way to access the ion table.

## Ion Creation and Retrieval Methods

### GetIon (Z, A, lvl)

```cpp
G4ParticleDefinition* GetIon(G4int Z, G4int A, G4int lvl = 0);
```

Gets an ion by atomic number, mass number, and isomer level. Creates the ion if it doesn't exist.

**Parameters**:
- `Z`: Atomic number (number of protons)
- `A`: Atomic mass number (protons + neutrons)
- `lvl`: Isomer level (0 = ground state, 1-9 = excited states)

**Returns**: Pointer to the ion particle definition, or nullptr on error

**Location**: G4IonTable.hh:110

**Implementation**: G4IonTable.cc:445-448

**Example**:
```cpp
// Get carbon-12 ground state
G4ParticleDefinition* C12 = ionTable->GetIon(6, 12, 0);

// Get Am-242m (first isomer)
G4ParticleDefinition* Am242m = ionTable->GetIon(95, 242, 1);
```

### GetIon (Z, A, E)

```cpp
G4ParticleDefinition* GetIon(G4int Z, G4int A, G4double E, G4int J = 0);
```

Gets an ion by atomic number, mass number, and excitation energy.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass number
- `E`: Excitation energy
- `J`: Total angular momentum in units of 1/2 (currently not used)

**Returns**: Pointer to the ion particle definition

**Location**: G4IonTable.hh:112

**Implementation**: G4IonTable.cc:456-459

**Example**:
```cpp
// Get Cs-137 excited at 661.657 keV
G4ParticleDefinition* Cs137ex = ionTable->GetIon(55, 137, 661.657*keV);
```

### GetIon (Z, A, E, flb)

```cpp
G4ParticleDefinition* GetIon(G4int Z, G4int A, G4double E,
                             G4Ions::G4FloatLevelBase flb, G4int J = 0);
```

Gets an ion with floating level base specification.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass number
- `E`: Excitation energy
- `flb`: Floating level base (enum: no_Float, plus_X, plus_Y, plus_Z, etc.)
- `J`: Total angular momentum (not used)

**Returns**: Pointer to the ion particle definition

**Location**: G4IonTable.hh:113-114

**Implementation**: G4IonTable.cc:466-513

**Note**: Floating level base indicates ambiguity in level assignment from nuclear data tables.

### GetIon (Z, A, E, flbChar)

```cpp
G4ParticleDefinition* GetIon(G4int Z, G4int A, G4double E, char flbChar, G4int J = 0);
```

Gets an ion with floating level base specified as a character.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass number
- `E`: Excitation energy
- `flbChar`: Floating level base character (null, 'X', 'Y', 'Z', 'U', 'V', 'W', 'R', 'S', 'T', 'A', 'B', 'C', 'D', 'E')
- `J`: Total angular momentum (not used)

**Returns**: Pointer to the ion particle definition

**Location**: G4IonTable.hh:115

**Implementation**: G4IonTable.cc:461-464

### GetIon (Z, A, nL, lvl) - Hypernuclei

```cpp
G4ParticleDefinition* GetIon(G4int Z, G4int A, G4int nL, G4int lvl);
```

Gets a hypernucleus ion containing lambda particles.

**Parameters**:
- `Z`: Atomic number (protons)
- `A`: Atomic mass (protons + neutrons + lambdas)
- `nL`: Number of lambda particles
- `lvl`: Isomer level

**Returns**: Pointer to the hypernucleus particle definition

**Location**: G4IonTable.hh:111

**Implementation**: G4IonTable.cc:450-454

**Example**:
```cpp
// Get Lambda-hypernucleus (Λ-He4)
G4ParticleDefinition* LambdaHe4 = ionTable->GetIon(2, 5, 1, 0);
```

### GetIon (Z, A, nL, E, flb) - Excited Hypernuclei

```cpp
G4ParticleDefinition* GetIon(G4int Z, G4int A, G4int nL, G4double E,
                             G4Ions::G4FloatLevelBase flb, G4int J = 0);
```

Gets an excited hypernucleus with excitation energy.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass (includes lambdas)
- `nL`: Number of lambda particles
- `E`: Excitation energy
- `flb`: Floating level base
- `J`: Angular momentum (not used)

**Returns**: Pointer to the hypernucleus particle definition

**Location**: G4IonTable.hh:117-118

**Implementation**: G4IonTable.cc:526-572

### GetIon (PDG encoding)

```cpp
G4ParticleDefinition* GetIon(G4int encoding);
```

Retrieves an ion using its PDG encoding.

**Parameters**:
- `encoding`: PDG particle code (10-digit: ±100ZZZAAAI or ±10LZZZAAAI for hypernuclei)

**Returns**: Pointer to the ion, or nullptr if encoding is invalid

**Location**: G4IonTable.hh:132

**Implementation**: G4IonTable.cc:574-589

**Note**: Only ground state ions can be reliably retrieved by encoding.

**Example**:
```cpp
// Get proton (PDG code 2212)
G4ParticleDefinition* proton = ionTable->GetIon(2212);

// Get carbon-12 (PDG code 1000060120)
G4ParticleDefinition* C12 = ionTable->GetIon(1000060120);
```

## FindIon Methods

FindIon methods search for existing ions without creating them. They return nullptr if the ion doesn't exist.

### FindIon (Z, A, lvl)

```cpp
G4ParticleDefinition* FindIon(G4int Z, G4int A, G4int lvl = 0);
```

Searches for an ion by isomer level.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass number
- `lvl`: Isomer level

**Returns**: Pointer to existing ion, or nullptr if not found

**Location**: G4IonTable.hh:136

**Implementation**: G4IonTable.cc:714-717

### FindIon (Z, A, E, flb)

```cpp
G4ParticleDefinition* FindIon(G4int Z, G4int A, G4double E,
                              G4Ions::G4FloatLevelBase flb, G4int J = 0);
```

Searches for an ion by excitation energy and floating level base.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `E`: Excitation energy
- `flb`: Floating level base
- `J`: Angular momentum (not used)

**Returns**: Pointer to existing ion, or nullptr if not found

**Location**: G4IonTable.hh:139-140

**Implementation**: G4IonTable.cc:601-656

**Note**: Uses tolerance from G4NuclideTable for energy matching.

### FindIon (Z, A, nL, E, flb) - Hypernuclei

```cpp
G4ParticleDefinition* FindIon(G4int Z, G4int A, G4int nL, G4double E,
                              G4Ions::G4FloatLevelBase flb, G4int J = 0);
```

Searches for an existing hypernucleus.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass (includes lambdas)
- `nL`: Number of lambdas
- `E`: Excitation energy
- `flb`: Floating level base
- `J`: Angular momentum (not used)

**Returns**: Pointer to existing hypernucleus, or nullptr if not found

**Location**: G4IonTable.hh:143-145

**Implementation**: G4IonTable.cc:670-712

## Ion Classification Methods

### IsIon

```cpp
static G4bool IsIon(const G4ParticleDefinition* particle);
```

Checks if a particle is an ion (including proton).

**Parameters**:
- `particle`: Particle to check

**Returns**: True if particle is an ion

**Location**: G4IonTable.hh:158

**Implementation**: G4IonTable.cc:887-905

**Note**: Returns true for protons, false for neutrons.

### IsAntiIon

```cpp
static G4bool IsAntiIon(const G4ParticleDefinition* particle);
```

Checks if a particle is an anti-ion.

**Parameters**:
- `particle`: Particle to check

**Returns**: True if particle is an anti-ion

**Location**: G4IonTable.hh:161

**Implementation**: G4IonTable.cc:907-925

## Ion Naming Methods

### GetIonName (Z, A, lvl)

```cpp
G4String GetIonName(G4int Z, G4int A, G4int lvl = 0) const;
```

Generates the name for an ion.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `lvl`: Isomer level

**Returns**: Ion name (e.g., "C12", "Am242[1]")

**Location**: G4IonTable.hh:164

**Implementation**: G4IonTable.cc:854-874

**Format**: ElementSymbol + A + [lvl] (if lvl > 0)

**Examples**:
- Z=6, A=12, lvl=0 → "C12"
- Z=95, A=242, lvl=1 → "Am242[1]"

### GetIonName (Z, A, E, flb)

```cpp
G4String GetIonName(G4int Z, G4int A, G4double E,
                    G4Ions::G4FloatLevelBase flb = G4Ions::G4FloatLevelBase::no_Float) const;
```

Generates name for ion with excitation energy.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `E`: Excitation energy
- `flb`: Floating level base

**Returns**: Ion name with excitation (e.g., "Cs137[661.657]")

**Location**: G4IonTable.hh:165-166

**Implementation**: G4IonTable.cc:820-840

**Format**: ElementSymbol + A + [E] (energy in keV) + flb character

### GetIonName (Z, A, nL, E, flb) - Hypernuclei

```cpp
G4String GetIonName(G4int Z, G4int A, G4int nL, G4double E,
                    G4Ions::G4FloatLevelBase flb = G4Ions::G4FloatLevelBase::no_Float) const;
```

Generates name for hypernucleus.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass (includes lambdas)
- `nL`: Number of lambdas
- `E`: Excitation energy
- `flb`: Floating level base

**Returns**: Hypernucleus name (e.g., "LLHe5" for double-lambda He-5)

**Location**: G4IonTable.hh:167-168

**Implementation**: G4IonTable.cc:842-852

**Format**: "L" repeated nL times + GetIonName(Z, A, E, flb)

## PDG Encoding Methods

### GetNucleusEncoding (Z, A, E, lvl)

```cpp
static G4int GetNucleusEncoding(G4int Z, G4int A, G4double E = 0.0, G4int lvl = 0);
```

Calculates PDG encoding for a nucleus.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `E`: Excitation energy (used if lvl not specified)
- `lvl`: Isomer level (0-9)

**Returns**: PDG encoding (±100ZZZAAAI)

**Location**: G4IonTable.hh:177

**Implementation**: G4IonTable.cc:725-745

**Format**:
- Ground state: 1000000000 + Z×10000 + A×10
- Isomer: 1000000000 + Z×10000 + A×10 + lvl
- Excited (lvl unknown): 1000000000 + Z×10000 + A×10 + 9

**Examples**:
- Proton: 2212 (special case)
- C-12: 1000060120
- Am-242m (lvl=1): 1000951242 + 1 = 1000952421

### GetNucleusEncoding (Z, A, nL, E, lvl) - Hypernuclei

```cpp
static G4int GetNucleusEncoding(G4int Z, G4int A, G4int nL,
                                G4double E = 0.0, G4int lvl = 0);
```

Calculates PDG encoding for a hypernucleus.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass (includes lambdas)
- `nL`: Number of lambdas
- `E`: Excitation energy
- `lvl`: Isomer level

**Returns**: PDG encoding (±10LZZZAAAI)

**Location**: G4IonTable.hh:186

**Implementation**: G4IonTable.cc:747-763

**Format**: Standard encoding + nL×10000000

**Example**:
- Lambda (special case): 3122
- Lambda-He4: 1010020050

### GetNucleusByEncoding (Z, A, E, lvl)

```cpp
static G4bool GetNucleusByEncoding(G4int encoding, G4int& Z, G4int& A,
                                   G4double& E, G4int& lvl);
```

Decodes a PDG encoding to extract nuclear properties.

**Parameters**:
- `encoding`: PDG encoding
- `Z`: Output atomic number
- `A`: Output atomic mass
- `E`: Output excitation energy (always 0.0)
- `lvl`: Output isomer level

**Returns**: True if decoding successful, false for anti-particles

**Location**: G4IonTable.hh:188

**Implementation**: G4IonTable.cc:765-784

**Note**: Energy is not encoded in PDG format, so E is always 0.0

### GetNucleusByEncoding (Z, A, L, E, lvl) - Hypernuclei

```cpp
static G4bool GetNucleusByEncoding(G4int encoding, G4int& Z, G4int& A,
                                   G4int& L, G4double& E, G4int& lvl);
```

Decodes PDG encoding for hypernuclei.

**Parameters**:
- `encoding`: PDG encoding
- `Z`: Output atomic number
- `A`: Output atomic mass
- `L`: Output number of lambdas
- `E`: Output excitation energy (always 0.0)
- `lvl`: Output isomer level

**Returns**: True if decoding successful

**Location**: G4IonTable.hh:189-190

**Implementation**: G4IonTable.cc:786-818

## Mass and Lifetime Methods

### GetNucleusMass

```cpp
G4double GetNucleusMass(G4int Z, G4int A, G4int nL = 0, G4int lvl = 0) const;
```

Returns the nuclear mass (fully ionized atom).

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `nL`: Number of lambdas (0 for regular nuclei)
- `lvl`: Isomer level

**Returns**: Mass in Geant4 internal units

**Location**: G4IonTable.hh:199

**Implementation**: G4IonTable.cc:1000-1056

**Note**: Returns nuclear mass without electrons. For hypernuclei, uses G4HyperNucleiProperties.

### GetIonMass

```cpp
G4double GetIonMass(G4int Z, G4int A, G4int nL = 0, G4int lvl = 0) const;
```

Returns the ion mass (synonym for GetNucleusMass).

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `nL`: Number of lambdas
- `lvl`: Isomer level

**Returns**: Mass in Geant4 internal units

**Location**: G4IonTable.hh:198

**Implementation**: G4IonTable.cc:1063-1066

### GetIsomerMass

```cpp
G4double GetIsomerMass(G4int Z, G4int A, G4int lvl = 0) const;
```

Returns the mass of an isomer state.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `lvl`: Isomer level

**Returns**: Mass in Geant4 internal units

**Location**: G4IonTable.hh:200

**Implementation**: G4IonTable.cc:1058-1061

### GetLifeTime (particle)

```cpp
G4double GetLifeTime(const G4ParticleDefinition* particle) const;
```

Returns the lifetime of an ion particle.

**Parameters**:
- `particle`: Pointer to the ion particle

**Returns**:
- Lifetime in Geant4 units (0 or negative for stable)
- -1 for stable ions
- -1001 for ions not in G4NuclideTable

**Location**: G4IonTable.hh:204

**Implementation**: G4IonTable.cc:1527-1535

### GetLifeTime (Z, A, E, flb)

```cpp
G4double GetLifeTime(G4int Z, G4int A, G4double E,
                     G4Ions::G4FloatLevelBase flb = G4Ions::G4FloatLevelBase::no_Float) const;
```

Returns the lifetime for an ion specified by properties.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `E`: Excitation energy
- `flb`: Floating level base

**Returns**:
- Lifetime in Geant4 units
- -1 for stable ions
- -1001 if not found in nuclide table

**Location**: G4IonTable.hh:205-206

**Implementation**: G4IonTable.cc:1542-1548

**Example**:
```cpp
// Get lifetime of Cs-137 excited state (661.657 keV)
G4double lifetime = ionTable->GetLifeTime(55, 137, 661.657*keV);
```

### GetLifeTime (Z, A, E, flbChar)

```cpp
G4double GetLifeTime(G4int Z, G4int A, G4double E, char flbChar) const;
```

Returns lifetime with floating level base as character.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass
- `E`: Excitation energy
- `flbChar`: Floating level base character

**Returns**: Lifetime in Geant4 units

**Location**: G4IonTable.hh:207

**Implementation**: G4IonTable.cc:1537-1540

## Muonic Atom Methods

### GetMuonicAtom (from ion)

```cpp
G4ParticleDefinition* GetMuonicAtom(G4Ions const* base);
```

Creates or retrieves a muonic atom from a base ion.

**Parameters**:
- `base`: Pointer to the base ion (must be ground state)

**Returns**: Pointer to the muonic atom particle definition

**Location**: G4IonTable.hh:209

**Implementation**: G4IonTable.cc:1550-1630

**Note**: Muonic atoms have a muon orbiting the nucleus instead of electrons.

**Example**:
```cpp
G4Ions* C12 = static_cast<G4Ions*>(ionTable->GetIon(6, 12));
G4ParticleDefinition* MuC12 = ionTable->GetMuonicAtom(C12);
```

### GetMuonicAtom (Z, A)

```cpp
G4ParticleDefinition* GetMuonicAtom(G4int Z, G4int A);
```

Creates or retrieves a muonic atom by atomic properties.

**Parameters**:
- `Z`: Atomic number
- `A`: Atomic mass

**Returns**: Pointer to the muonic atom particle definition

**Location**: G4IonTable.hh:210

**Implementation**: G4IonTable.cc:1632-1638

**Format**: Name is "Mu" + ion name (e.g., "MuC12")

## Table Management Methods

### Entries

```cpp
G4int Entries() const;
```

Returns the number of ions in the table.

**Returns**: Number of ion entries

**Location**: G4IonTable.hh:213

**Implementation**: G4IonTable.cc:1400-1403

### size

```cpp
G4int size() const;
```

Returns the size of the ion table (synonym for Entries).

**Returns**: Number of ion entries

**Location**: G4IonTable.hh:229

**Implementation**: G4IonTable.cc:1405-1408

### GetParticle

```cpp
G4ParticleDefinition* GetParticle(G4int index) const;
```

Returns the ion at a specific index in the table.

**Parameters**:
- `index`: Index in the ion list (0 to Entries()-1)

**Returns**: Pointer to the ion, or nullptr if index invalid

**Location**: G4IonTable.hh:216

**Implementation**: G4IonTable.cc:1356-1378

**Usage**: For iterating through all ions in the table.

**Example**:
```cpp
for (G4int i = 0; i < ionTable->Entries(); i++) {
    G4ParticleDefinition* ion = ionTable->GetParticle(i);
    G4cout << ion->GetParticleName() << G4endl;
}
```

### Contains

```cpp
G4bool Contains(const G4ParticleDefinition* particle) const;
```

Checks if a particle is in the ion table.

**Parameters**:
- `particle`: Particle to check

**Returns**: True if particle is in the table

**Location**: G4IonTable.hh:219

**Implementation**: G4IonTable.cc:1380-1398

### Insert

```cpp
void Insert(const G4ParticleDefinition* particle);
```

Inserts an ion into the table.

**Parameters**:
- `particle`: Ion particle to insert

**Location**: G4IonTable.hh:222

**Implementation**: G4IonTable.cc:1085-1097

**Note**: Only inserts if the particle is an ion and not already in the table.

### Remove

```cpp
void Remove(const G4ParticleDefinition* particle);
```

Removes an ion from the table.

**Parameters**:
- `particle`: Ion particle to remove

**Location**: G4IonTable.hh:223

**Implementation**: G4IonTable.cc:1122-1173

**Note**: Can only be called from master thread and before initialization.

### clear

```cpp
void clear();
```

Clears all ions from the table.

**Location**: G4IonTable.hh:226

**Implementation**: G4IonTable.cc:1068-1083

**Note**: Only effective before G4ParticleTable is ready.

### DumpTable

```cpp
void DumpTable(const G4String& particle_name = "ALL") const;
```

Dumps ion information to output.

**Parameters**:
- `particle_name`: Name of specific ion, or "ALL" for all ions

**Location**: G4IonTable.hh:232

**Implementation**: G4IonTable.cc:1175-1187

**Usage**: For debugging and verification.

## Nuclide Table Integration

### PrepareNuclideTable

```cpp
void PrepareNuclideTable();
```

Prepares the G4NuclideTable for use.

**Location**: Not in public interface

**Implementation**: G4IonTable.cc:1334-1337

**Note**: Called automatically during construction.

### PreloadNuclide

```cpp
void PreloadNuclide();
```

Preloads all nuclides from the nuclide table.

**Location**: G4IonTable.hh:96

**Implementation**: G4IonTable.cc:1339-1354

**Usage**: Creates all ions with lifetime > threshold before event loop for efficiency.

**Note**: Only effective in multi-threaded mode; called once per application.

### CreateAllIon

```cpp
void CreateAllIon();
```

Creates all ground state ions.

**Location**: G4IonTable.hh:87

**Implementation**: G4IonTable.cc:1324-1327

**Note**: Now calls PreloadNuclide internally.

### CreateAllIsomer

```cpp
void CreateAllIsomer();
```

Creates all long-lived isomer states.

**Location**: G4IonTable.hh:91

**Implementation**: G4IonTable.cc:1329-1332

**Note**: Now calls PreloadNuclide internally.

### RegisterIsotopeTable

```cpp
void RegisterIsotopeTable(G4VIsotopeTable* table);
```

Registers an isotope table for nuclear data.

**Parameters**:
- `table`: Pointer to isotope table

**Location**: G4IonTable.hh:79

**Implementation**: G4IonTable.cc:1270-1279

**Note**: G4NuclideTable is registered automatically.

### GetIsotopeTable

```cpp
G4VIsotopeTable* GetIsotopeTable(std::size_t idx = 0) const;
```

Returns a registered isotope table by index.

**Parameters**:
- `idx`: Index of isotope table (default: 0)

**Returns**: Pointer to isotope table, or nullptr if index invalid

**Location**: G4IonTable.hh:83

**Implementation**: G4IonTable.cc:1281-1288

## Thread Safety Methods

### WorkerG4IonTable

```cpp
void WorkerG4IonTable();
```

Copies ion table content from master to worker thread.

**Location**: G4IonTable.hh:70

**Implementation**: G4IonTable.cc:161-182

**Note**: Called automatically by Geant4 framework in multi-threaded mode.

### DestroyWorkerG4IonTable

```cpp
void DestroyWorkerG4IonTable();
```

Destroys the worker thread's ion table copy.

**Location**: G4IonTable.hh:73

**Implementation**: G4IonTable.cc:190-211

**Note**: Called automatically during worker thread cleanup.

### InitializeLightIons

```cpp
void InitializeLightIons();
```

Initializes light ion pointers (proton, deuteron, triton, He3, alpha).

**Location**: G4IonTable.hh:236

**Implementation**: G4IonTable.cc:184-188

**Note**: Required for multi-threaded applications.

## Static Thread-Local Data

### fIonList

```cpp
static G4ThreadLocal G4IonList* fIonList;
```

Thread-local ion list for worker threads.

**Location**: G4IonTable.hh:244

**Implementation**: G4IonTable.cc:63

### fIonListShadow

```cpp
static G4IonList* fIonListShadow;
```

Master thread's ion list for copying to workers.

**Location**: G4IonTable.hh:246

**Implementation**: G4IonTable.cc:65

### ionTableMutex

```cpp
#ifdef G4MULTITHREADED
static G4Mutex ionTableMutex;
#endif
```

Mutex for thread-safe access to ion table.

**Location**: G4IonTable.hh:255-257

**Implementation**: G4IonTable.cc:104-106

**Usage**: Protects ion creation in worker threads.

## Configuration Methods

### GetNumberOfElements

```cpp
G4int GetNumberOfElements() const;
```

Returns the number of chemical elements (118).

**Returns**: Number of elements in periodic table

**Location**: G4IonTable.hh:306-309

**Implementation**: Inline

### GetVerboseLevel

```cpp
G4int GetVerboseLevel() const;
```

Returns the verbose level from G4ParticleTable.

**Returns**: Verbose level (0 = silent, higher = more output)

**Location**: Not in public interface

**Implementation**: G4IonTable.cc:1208-1211

## Usage Examples

### Getting Basic Ions

```cpp
// Access the ion table
G4IonTable* ionTable = G4IonTable::GetIonTable();

// Get common ions
G4ParticleDefinition* proton = ionTable->GetIon(1, 1);      // Proton (H-1)
G4ParticleDefinition* C12 = ionTable->GetIon(6, 12);        // Carbon-12
G4ParticleDefinition* U238 = ionTable->GetIon(92, 238);     // Uranium-238
G4ParticleDefinition* Pb208 = ionTable->GetIon(82, 208);    // Lead-208
```

### Getting Excited States and Isomers

```cpp
// Get excited state by energy
G4ParticleDefinition* Cs137ex = ionTable->GetIon(55, 137, 661.657*keV);

// Get isomer by level number
G4ParticleDefinition* Am242m = ionTable->GetIon(95, 242, 1);  // Am-242m (first isomer)
G4ParticleDefinition* Ta180m = ionTable->GetIon(73, 180, 1);  // Ta-180m (very long-lived)

// With floating level base
G4ParticleDefinition* ion = ionTable->GetIon(50, 120, 1200*keV,
                                              G4Ions::G4FloatLevelBase::plus_X);
```

### Working with Hypernuclei

```cpp
// Lambda-hypernuclei (contain strange lambda particles)
G4ParticleDefinition* LambdaHe4 = ionTable->GetIon(2, 5, 1, 0);   // Λ-He4 (1 lambda)
G4ParticleDefinition* LLHe5 = ionTable->GetIon(2, 6, 2, 0);       // ΛΛ-He5 (2 lambdas)

// Excited hypernucleus
G4ParticleDefinition* LambdaHe4ex = ionTable->GetIon(2, 5, 1, 1.5*MeV);
```

### Working with Muonic Atoms

```cpp
// Create muonic atoms (atom with orbiting muon)
G4ParticleDefinition* MuH = ionTable->GetMuonicAtom(1, 1);      // Muonic hydrogen
G4ParticleDefinition* MuC12 = ionTable->GetMuonicAtom(6, 12);   // Muonic carbon-12
G4ParticleDefinition* MuPb208 = ionTable->GetMuonicAtom(82, 208); // Muonic lead-208

// From existing ion
G4Ions* Fe56 = static_cast<G4Ions*>(ionTable->GetIon(26, 56));
G4ParticleDefinition* MuFe56 = ionTable->GetMuonicAtom(Fe56);
```

### Querying Ion Properties

```cpp
// Get mass and lifetime
G4double mass = ionTable->GetIonMass(55, 137);                // Cs-137 mass
G4double lifetime = ionTable->GetLifeTime(55, 137, 661.657*keV); // Excited state lifetime

// Check if particle is ion
G4bool isIon = G4IonTable::IsIon(particle);
G4bool isAntiIon = G4IonTable::IsAntiIon(particle);

// Get ion name
G4String name = ionTable->GetIonName(6, 12, 0);              // "C12"
G4String exName = ionTable->GetIonName(55, 137, 661.657*keV); // "Cs137[661.657]"
```

### Working with PDG Encodings

```cpp
// Get ion by PDG code
G4ParticleDefinition* proton = ionTable->GetIon(2212);          // Proton
G4ParticleDefinition* C12 = ionTable->GetIon(1000060120);       // C-12

// Calculate PDG encoding
G4int encoding = G4IonTable::GetNucleusEncoding(6, 12);         // 1000060120
G4int isoEncoding = G4IonTable::GetNucleusEncoding(95, 242, 0, 1); // Am-242m

// Decode PDG encoding
G4int Z, A, lvl;
G4double E;
if (G4IonTable::GetNucleusByEncoding(1000060120, Z, A, E, lvl)) {
    // Z=6, A=12, E=0, lvl=0
}
```

### Iterating Through Ion Table

```cpp
// Print all ions in the table
G4int nIons = ionTable->Entries();
G4cout << "Number of ions: " << nIons << G4endl;

for (G4int i = 0; i < nIons; i++) {
    G4ParticleDefinition* ion = ionTable->GetParticle(i);
    G4cout << "Ion " << i << ": " << ion->GetParticleName()
           << " (Z=" << ion->GetAtomicNumber()
           << ", A=" << ion->GetAtomicMass()
           << ", mass=" << ion->GetPDGMass()/GeV << " GeV)"
           << G4endl;
}
```

### Finding vs Getting Ions

```cpp
// FindIon returns nullptr if ion doesn't exist
G4ParticleDefinition* ion1 = ionTable->FindIon(92, 235);
if (ion1 == nullptr) {
    G4cout << "U-235 not yet created" << G4endl;
}

// GetIon creates the ion if it doesn't exist
G4ParticleDefinition* ion2 = ionTable->GetIon(92, 235);
// ion2 is guaranteed to be non-null (or exception thrown)

// Useful for checking without creating
if (ionTable->FindIon(50, 120, 1.0*MeV) == nullptr) {
    // This excited state hasn't been created yet
}
```

### Preloading Ions for Efficiency

```cpp
// In master thread before run initialization
void MyDetectorConstruction::ConstructSDandField() {
    // Preload all nuclides for faster access during simulation
    G4IonTable* ionTable = G4IonTable::GetIonTable();
    ionTable->PreloadNuclide();

    // Now all ions are available without runtime creation overhead
}
```

## Thread Safety Notes

G4IonTable is designed to be thread-safe in multi-threaded Geant4 applications:

1. **Master-Worker Pattern**: The master thread maintains the authoritative ion list in `fIonListShadow`. Worker threads copy this to their thread-local `fIonList`.

2. **Mutex Protection**: Ion creation in worker threads is protected by `ionTableMutex` to prevent race conditions when multiple workers request the same ion.

3. **Creation Strategy**:
   - Master thread: Ions are created directly in `fIonListShadow`
   - Worker threads: First check thread-local list, then master list with mutex, then create if needed

4. **Light Ion Initialization**: Pre-defined light ions (p, d, t, He3, alpha) must be initialized via `InitializeLightIons()` before worker threads start.

5. **Read-Only Operations**: Methods like `FindIon`, `GetIonName`, `GetLifeTime` are thread-safe for reading existing ions.

6. **Modification Restrictions**: `Insert`, `Remove`, and `clear` should only be called from the master thread during initialization.

**Best Practices**:
```cpp
// In main() before creating run manager
int main() {
    // Use multi-threaded run manager
    auto* runManager = new G4MTRunManager;
    runManager->SetNumberOfThreads(4);

    // Ion table is automatically thread-safe
    // Worker threads will copy ions from master as needed

    runManager->Initialize();
    runManager->BeamOn(1000);
}
```

## Performance Considerations

1. **Preloading**: Use `PreloadNuclide()` in the master thread to create all commonly-used ions before event processing begins, reducing runtime overhead.

2. **FindIon vs GetIon**: Use `FindIon` if you only need to check existence without creating; use `GetIon` when you need the ion regardless.

3. **Caching**: Store frequently-used ion pointers in your code rather than repeatedly calling `GetIon`.

4. **Light Ions**: Pre-defined light ions (p, d, t, He3, alpha) are handled specially for efficiency.

5. **Encoding Lookup**: Using PDG encoding (`GetIon(encoding)`) is fast for ground states but less reliable for excited states.

**Example of efficient ion usage**:
```cpp
class MyProcess {
    G4ParticleDefinition* fAlpha;
    G4ParticleDefinition* fC12;

    MyProcess() {
        // Cache ion pointers during initialization
        G4IonTable* ionTable = G4IonTable::GetIonTable();
        fAlpha = ionTable->GetIon(2, 4);
        fC12 = ionTable->GetIon(6, 12);
    }

    void ProcessEvent() {
        // Use cached pointers - very fast
        if (particle == fAlpha) { /* ... */ }
        if (particle == fC12) { /* ... */ }
    }
};
```

## See Also

- [G4ParticleTable](./g4particletable.md) - Main particle table that contains G4IonTable
- [G4Ions](./g4ions.md) - Base class for ion particles
- [G4MuonicAtom](./g4muonicatom.md) - Muonic atom particle class
- [G4NuclideTable](./g4nuclidetable.md) - Nuclear data table for masses, lifetimes, and decay modes
- [G4VIsotopeTable](./g4visotopetable.md) - Base class for isotope data providers
- [G4IsotopeProperty](./g4isotopeproperty.md) - Properties of specific isotopes
- [G4NucleiProperties](./g4nucleiproperties.md) - Nuclear mass calculations
- [G4HyperNucleiProperties](./g4hypernucleiproperties.md) - Mass calculations for hypernuclei
