# G4ProductionCutsTable API Documentation

## Overview

`G4ProductionCutsTable` is the central singleton class managing all production cuts in Geant4. It maintains the global registry of `G4MaterialCutsCouple` objects, performs range-to-energy conversion for all materials, manages physics table synchronization, and provides persistent storage/retrieval of cut data. This class is the backbone of the cuts system, coordinating between user-defined range cuts and the energy cuts actually used by physics processes.

::: tip Header Files
**Location:** `source/processes/cuts/include/G4ProductionCutsTable.hh`
**Source:** `source/processes/cuts/src/G4ProductionCutsTable.cc`
:::

## Class Declaration

```cpp
class G4ProductionCutsTable
{
  public:
    static G4ProductionCutsTable* GetProductionCutsTable();

    G4ProductionCutsTable(const G4ProductionCutsTable&) = delete;
    G4ProductionCutsTable& operator=(const G4ProductionCutsTable&) = delete;

    virtual ~G4ProductionCutsTable();

    // Couple table management
    void CreateCoupleTables();
    void UpdateCoupleTable(G4VPhysicalVolume* currentWorld);

    // Energy range configuration
    void SetEnergyRange(G4double lowedge, G4double highedge);
    G4double GetLowEdgeEnergy() const;
    G4double GetHighEdgeEnergy() const;
    G4double GetMaxEnergyCut();
    void SetMaxEnergyCut(G4double value);

    // Couple table access
    std::size_t GetTableSize() const;
    const G4MaterialCutsCouple* GetMaterialCutsCouple(G4int i) const;
    const G4MaterialCutsCouple* GetMaterialCutsCouple(
        const G4Material* aMat, const G4ProductionCuts* aCut) const;
    G4int GetCoupleIndex(const G4MaterialCutsCouple* aCouple) const;
    G4int GetCoupleIndex(const G4Material* aMat,
                         const G4ProductionCuts* aCut) const;

    // Cut vectors
    const std::vector<G4double>* GetRangeCutsVector(std::size_t pcIdx) const;
    const std::vector<G4double>* GetEnergyCutsVector(std::size_t pcIdx) const;
    G4double* GetRangeCutsDoubleVector(std::size_t pcIdx) const;
    G4double* GetEnergyCutsDoubleVector(std::size_t pcIdx) const;

    // Modification tracking
    G4bool IsModified() const;
    void PhysicsTableUpdated();

    // Default cuts
    G4ProductionCuts* GetDefaultProductionCuts() const;

    // Range-to-energy conversion
    G4double ConvertRangeToEnergy(const G4ParticleDefinition* particle,
                                  const G4Material* material,
                                  G4double range);
    void ResetConverters();

    // Persistence
    G4bool StoreCutsTable(const G4String& directory, G4bool ascii = false);
    G4bool RetrieveCutsTable(const G4String& directory, G4bool ascii = false);
    G4bool CheckForRetrieveCutsTable(const G4String& directory,
                                     G4bool ascii = false);

    // Direct energy cuts (advanced)
    void SetEnergyCutVector(const std::vector<G4double>& cutE, std::size_t idx);

    // Utilities
    void DumpCouples() const;
    void SetVerboseLevel(G4int value);
    G4int GetVerboseLevel() const;
    const G4MCCIndexConversionTable* GetMCCIndexConversionTable() const;

  protected:
    G4ProductionCutsTable();
    // ... protected persistence methods ...

  private:
    static G4ProductionCutsTable* fProductionCutsTable;
    std::vector<G4MaterialCutsCouple*> coupleTable;
    std::vector<std::vector<G4double>*> rangeCutTable;
    std::vector<std::vector<G4double>*> energyCutTable;
    G4VRangeToEnergyConverter* converters[NumberOfG4CutIndex];
    G4ProductionCuts* defaultProductionCuts;
    // ... additional members ...
};
```

## Singleton Access

### GetProductionCutsTable()
`source/processes/cuts/include/G4ProductionCutsTable.hh:60-62`
`source/processes/cuts/src/G4ProductionCutsTable.cc:58-66`

```cpp
static G4ProductionCutsTable* GetProductionCutsTable();
```

**Returns:** Pointer to the singleton instance

**Usage:**
```cpp
G4ProductionCutsTable* cutsTable =
    G4ProductionCutsTable::GetProductionCutsTable();
```

::: tip Thread Safety
The singleton is created on first access using a static local variable (Meyer's singleton). This is thread-safe in C++11 and later.
:::

## Couple Table Management

### CreateCoupleTables()
`source/processes/cuts/include/G4ProductionCutsTable.hh:69-70`
`source/processes/cuts/src/G4ProductionCutsTable.cc:136-251`

```cpp
void CreateCoupleTables();
```

**Purpose:** Creates and initializes the table of `G4MaterialCutsCouple` objects based on the current geometry and region definitions.

**Process:**
1. Resets "used" flags on all existing couples
2. Scans all regions in the geometry
3. For each region:
   - Gets region's production cuts
   - Iterates over materials in region
   - Creates couples for (Material, Cuts) pairs
   - Avoids duplicates by checking existing couples
4. Assigns couples to logical volumes
5. Marks used couples

**Called by:**
- `G4RunManager` during initialization
- Automatically before first run

**Example:**
```cpp
// Usually called automatically, but can be invoked manually
cutsTable->CreateCoupleTables();
```

::: warning Automatic Invocation
Users rarely need to call this directly. `G4RunManager` handles couple table creation during run initialization.
:::

### UpdateCoupleTable()
`source/processes/cuts/include/G4ProductionCutsTable.hh:72-73`

```cpp
void UpdateCoupleTable(G4VPhysicalVolume* currentWorld);
```

**Parameters:**
- `currentWorld`: Pointer to current world physical volume

**Purpose:** Updates the couple table for a specific world volume (important for parallel geometries).

**Usage:**
```cpp
G4VPhysicalVolume* world = /*...*/;
cutsTable->UpdateCoupleTable(world);
```

## Energy Range Configuration

### SetEnergyRange()
`source/processes/cuts/include/G4ProductionCutsTable.hh:75-76`

```cpp
void SetEnergyRange(G4double lowedge, G4double highedge);
```

**Parameters:**
- `lowedge`: Minimum energy for range-to-energy conversion (default: 1 keV)
- `highedge`: Maximum energy for range-to-energy conversion (default: 10 GeV)

**Purpose:** Sets the energy range used by range-to-energy converters for building conversion tables.

**Example:**
```cpp
// Extend energy range for high-energy applications
cutsTable->SetEnergyRange(100*eV, 100*GeV);

// Restrict range for low-energy studies
cutsTable->SetEnergyRange(100*eV, 1*GeV);
```

::: tip When to Modify
Set energy range before `G4RunManager::Initialize()`. Changing it later requires physics table rebuilding.
:::

### GetLowEdgeEnergy() / GetHighEdgeEnergy()
`source/processes/cuts/include/G4ProductionCutsTable.hh:78-80`

```cpp
G4double GetLowEdgeEnergy() const;
G4double GetHighEdgeEnergy() const;
```

**Returns:** Current energy range limits for converters

**Example:**
```cpp
G4double eMin = cutsTable->GetLowEdgeEnergy();
G4double eMax = cutsTable->GetHighEdgeEnergy();
G4cout << "Converter energy range: " << eMin/keV << " keV to "
       << eMax/GeV << " GeV" << G4endl;
```

### SetMaxEnergyCut() / GetMaxEnergyCut()
`source/processes/cuts/include/G4ProductionCutsTable.hh:82-84`

```cpp
void SetMaxEnergyCut(G4double value);
G4double GetMaxEnergyCut();
```

**Purpose:** Set/get the maximum allowed energy cut for all particle types.

**Parameters:**
- `value`: Maximum energy cut (typically in MeV or GeV)

**Usage:**
```cpp
// Limit maximum energy cut to 100 MeV
cutsTable->SetMaxEnergyCut(100*MeV);

G4double maxCut = cutsTable->GetMaxEnergyCut();
```

## Couple Table Access

### GetTableSize()
`source/processes/cuts/include/G4ProductionCutsTable.hh:96-97`
`source/processes/cuts/include/G4ProductionCutsTable.hh:249-252`

```cpp
inline std::size_t GetTableSize() const;
```

**Returns:** Number of couples in the table

**Example:**
```cpp
std::size_t nCouples = cutsTable->GetTableSize();
G4cout << "Total couples: " << nCouples << G4endl;

for (std::size_t i = 0; i < nCouples; ++i) {
    const G4MaterialCutsCouple* couple = cutsTable->GetMaterialCutsCouple(i);
    // Process couple
}
```

### GetMaterialCutsCouple (By Index)
`source/processes/cuts/include/G4ProductionCutsTable.hh:99-100`
`source/processes/cuts/include/G4ProductionCutsTable.hh:254-259`

```cpp
inline const G4MaterialCutsCouple* GetMaterialCutsCouple(G4int i) const;
```

**Parameters:**
- `i`: Couple index (0 to GetTableSize()-1)

**Returns:** Pointer to couple at index `i`

**Example:**
```cpp
G4int index = 5;
const G4MaterialCutsCouple* couple = cutsTable->GetMaterialCutsCouple(index);
G4cout << "Couple " << index << ": "
       << couple->GetMaterial()->GetName() << G4endl;
```

### GetMaterialCutsCouple (By Material and Cuts)
`source/processes/cuts/include/G4ProductionCutsTable.hh:102-104`
`source/processes/cuts/include/G4ProductionCutsTable.hh:324-334`

```cpp
inline const G4MaterialCutsCouple* GetMaterialCutsCouple(
    const G4Material* aMat,
    const G4ProductionCuts* aCut) const;
```

**Parameters:**
- `aMat`: Pointer to material
- `aCut`: Pointer to production cuts

**Returns:**
- Pointer to couple matching (Material, Cuts) pair
- `nullptr` if no matching couple found

**Example:**
```cpp
const G4Material* silicon =
    G4NistManager::Instance()->FindOrBuildMaterial("G4_Si");
G4ProductionCuts* trackerCuts = trackerRegion->GetProductionCuts();

const G4MaterialCutsCouple* couple =
    cutsTable->GetMaterialCutsCouple(silicon, trackerCuts);

if (couple) {
    G4int index = couple->GetIndex();
    G4cout << "Silicon/Tracker couple index: " << index << G4endl;
}
```

### GetCoupleIndex()
`source/processes/cuts/include/G4ProductionCutsTable.hh:106-109`
`source/processes/cuts/include/G4ProductionCutsTable.hh:336-347`

```cpp
inline G4int GetCoupleIndex(const G4MaterialCutsCouple* aCouple) const;

inline G4int GetCoupleIndex(const G4Material* aMat,
                            const G4ProductionCuts* aCut) const;
```

**Returns:**
- Index of the specified couple
- -1 if couple not found

**Example:**
```cpp
// Get index from couple pointer
G4int idx1 = cutsTable->GetCoupleIndex(couple);

// Get index from material and cuts
G4int idx2 = cutsTable->GetCoupleIndex(silicon, trackerCuts);
```

## Cut Vectors

### GetRangeCutsVector() / GetEnergyCutsVector()
`source/processes/cuts/include/G4ProductionCutsTable.hh:93-94`
`source/processes/cuts/include/G4ProductionCutsTable.hh:234-246`

```cpp
inline const std::vector<G4double>* GetRangeCutsVector(std::size_t pcIdx) const;
inline const std::vector<G4double>* GetEnergyCutsVector(std::size_t pcIdx) const;
```

**Parameters:**
- `pcIdx`: Particle cut index (0=gamma, 1=e-, 2=e+, 3=proton)

**Returns:** Pointer to vector containing cuts for all couples for the specified particle type

**Vector Size:** Equal to `GetTableSize()` (one entry per couple)

**Example:**
```cpp
// Get electron energy cuts for all couples
const std::vector<G4double>* electronEnergyCuts =
    cutsTable->GetEnergyCutsVector(idxG4ElectronCut);

for (std::size_t i = 0; i < electronEnergyCuts->size(); ++i) {
    G4cout << "Couple " << i << " electron energy cut: "
           << (*electronEnergyCuts)[i]/keV << " keV" << G4endl;
}

// Get gamma range cuts
const std::vector<G4double>* gammaRangeCuts =
    cutsTable->GetRangeCutsVector(idxG4GammaCut);
```

### GetRangeCutsDoubleVector() / GetEnergyCutsDoubleVector()
`source/processes/cuts/include/G4ProductionCutsTable.hh:146-148`
`source/processes/cuts/include/G4ProductionCutsTable.hh:284-296`

```cpp
inline G4double* GetRangeCutsDoubleVector(std::size_t pcIdx) const;
inline G4double* GetEnergyCutsDoubleVector(std::size_t pcIdx) const;
```

**Returns:** Raw C-style array of cuts (for backward compatibility)

::: warning Deprecated Interface
These methods are provided for backward compatibility with older code. Prefer `GetRangeCutsVector()` / `GetEnergyCutsVector()` in new code.
:::

## Modification Tracking

### IsModified()
`source/processes/cuts/include/G4ProductionCutsTable.hh:112-113`
`source/processes/cuts/include/G4ProductionCutsTable.hh:261-273`

```cpp
inline G4bool IsModified() const;
```

**Returns:**
- `true` if any couple needs recalculation (cuts or materials changed)
- `false` if all couples are synchronized with physics tables

**Implementation:**
```cpp
inline G4bool G4ProductionCutsTable::IsModified() const
{
  if (firstUse) return true;

  for (auto itr=coupleTable.cbegin(); itr!=coupleTable.cend(); ++itr)
  {
    if ((*itr)->IsRecalcNeeded())
      return true;
  }
  return false;
}
```

**Usage:**
```cpp
if (cutsTable->IsModified()) {
    G4cout << "Cuts have changed - physics tables will be rebuilt" << G4endl;
}
```

### PhysicsTableUpdated()
`source/processes/cuts/include/G4ProductionCutsTable.hh:115-118`
`source/processes/cuts/include/G4ProductionCutsTable.hh:275-282`

```cpp
inline void PhysicsTableUpdated();
```

**Purpose:** Notifies all couples that physics tables have been updated, resetting modification flags.

::: danger Internal Use Only
This method should only be called by `G4RunManager` after physics table building is complete. Never call this directly in user code.
:::

## Default Production Cuts

### GetDefaultProductionCuts()
`source/processes/cuts/include/G4ProductionCutsTable.hh:119-120`
`source/processes/cuts/include/G4ProductionCutsTable.hh:298-302`

```cpp
inline G4ProductionCuts* GetDefaultProductionCuts() const;
```

**Returns:** Pointer to the default production cuts object

**Purpose:** The default cuts are used for regions that don't have explicitly assigned production cuts.

**Example:**
```cpp
G4ProductionCuts* defaultCuts = cutsTable->GetDefaultProductionCuts();

// Modify default cuts (affects all regions without explicit cuts)
defaultCuts->SetProductionCut(1.0*mm, "gamma");
defaultCuts->SetProductionCut(0.5*mm, "e-");
defaultCuts->SetProductionCut(0.5*mm, "e+");
defaultCuts->SetProductionCut(1.0*mm, "proton");
```

::: tip Default Cuts Scope
Changing default cuts affects all regions that don't have region-specific cuts assigned. This is typically set in `G4VUserPhysicsList::SetCuts()`.
:::

## Range-to-Energy Conversion

### ConvertRangeToEnergy()
`source/processes/cuts/include/G4ProductionCutsTable.hh:122-125`

```cpp
G4double ConvertRangeToEnergy(const G4ParticleDefinition* particle,
                              const G4Material* material,
                              G4double range);
```

**Parameters:**
- `particle`: Particle definition (e.g., `G4Electron::Definition()`)
- `material`: Material in which range is specified
- `range`: Range value in distance units

**Returns:**
- Corresponding energy cut in energy units
- -1 if particle or material not found/supported

**Example:**
```cpp
const G4ParticleDefinition* electron = G4Electron::Definition();
const G4Material* silicon =
    G4NistManager::Instance()->FindOrBuildMaterial("G4_Si");

G4double rangeCut = 100*um;
G4double energyCut = cutsTable->ConvertRangeToEnergy(
    electron, silicon, rangeCut);

G4cout << "100 um in silicon = " << energyCut/keV
       << " keV for electrons" << G4endl;
```

::: tip Supported Particles
Only gamma, e-, e+, and proton are supported. Other particles return -1.
:::

### ResetConverters()
`source/processes/cuts/include/G4ProductionCutsTable.hh:128-129`

```cpp
void ResetConverters();
```

**Purpose:** Resets all range-to-energy converters, forcing recalculation of conversion tables.

**When to use:**
- After modifying energy range
- After significant changes to materials
- When debugging conversion issues

**Example:**
```cpp
// Modify energy range
cutsTable->SetEnergyRange(100*eV, 100*GeV);

// Reset converters to use new range
cutsTable->ResetConverters();
```

## Persistence

### StoreCutsTable()
`source/processes/cuts/include/G4ProductionCutsTable.hh:131-133`

```cpp
G4bool StoreCutsTable(const G4String& directory, G4bool ascii = false);
```

**Parameters:**
- `directory`: Directory path where cut data will be stored
- `ascii`: If `true`, use ASCII format; if `false`, use binary format

**Returns:** `true` if successful, `false` otherwise

**Stored Files:**
- Material information
- Material-cuts couple mapping
- Cut values (range and energy)

**Example:**
```cpp
// Store cuts in binary format
if (cutsTable->StoreCutsTable("./cutdata", false)) {
    G4cout << "Cuts table stored successfully" << G4endl;
} else {
    G4cout << "Failed to store cuts table" << G4endl;
}

// Store in ASCII format (human-readable, larger files)
cutsTable->StoreCutsTable("./cutdata_ascii", true);
```

**Benefits:**
- Faster initialization in subsequent runs
- Reproducible physics tables
- Useful for large geometries

### RetrieveCutsTable()
`source/processes/cuts/include/G4ProductionCutsTable.hh:135-137`

```cpp
G4bool RetrieveCutsTable(const G4String& directory, G4bool ascii = false);
```

**Parameters:**
- `directory`: Directory containing stored cut data
- `ascii`: Must match format used in `StoreCutsTable()`

**Returns:** `true` if successful, `false` otherwise

**Example:**
```cpp
// Try to retrieve stored cuts
if (cutsTable->RetrieveCutsTable("./cutdata", false)) {
    G4cout << "Cuts table retrieved successfully" << G4endl;
    // Physics tables rebuilt from stored data
} else {
    G4cout << "Could not retrieve cuts table - will recalculate" << G4endl;
}
```

### CheckForRetrieveCutsTable()
`source/processes/cuts/include/G4ProductionCutsTable.hh:141-143`

```cpp
G4bool CheckForRetrieveCutsTable(const G4String& directory,
                                 G4bool ascii = false);
```

**Purpose:** Checks if stored cuts are consistent with current geometry/materials without actually loading them.

**Returns:** `true` if stored data is compatible, `false` otherwise

**Example:**
```cpp
// Check before retrieving
if (cutsTable->CheckForRetrieveCutsTable("./cutdata", false)) {
    G4cout << "Stored cuts are compatible" << G4endl;
    cutsTable->RetrieveCutsTable("./cutdata", false);
} else {
    G4cout << "Stored cuts are incompatible - will recalculate" << G4endl;
}
```

## Advanced Features

### SetEnergyCutVector()
`source/processes/cuts/include/G4ProductionCutsTable.hh:150-152`
`source/processes/cuts/src/G4ProductionCutsTable.cc:122-133`

```cpp
void SetEnergyCutVector(const std::vector<G4double>& cutE, std::size_t idx);
```

**Parameters:**
- `cutE`: Vector of energy cut values (one per couple)
- `idx`: Particle index (0-3)

**Purpose:** Directly set energy cuts, bypassing range-to-energy conversion.

::: danger Advanced Users Only
This method is discouraged for normal use. It bypasses the range-based cut system and can lead to inconsistent tracking resolution across materials. Use only if you have specific requirements that range cuts cannot meet.
:::

**Example:**
```cpp
std::vector<G4double> customEnergyCuts;
// Populate with custom energy values for each couple
// customEnergyCuts.size() must equal cutsTable->GetTableSize()

for (std::size_t i = 0; i < cutsTable->GetTableSize(); ++i) {
    customEnergyCuts.push_back(calculateCustomCut(i));
}

cutsTable->SetEnergyCutVector(customEnergyCuts, idxG4ElectronCut);
```

## Utilities

### DumpCouples()
`source/processes/cuts/include/G4ProductionCutsTable.hh:87-88`

```cpp
void DumpCouples() const;
```

**Purpose:** Prints detailed information about all couples to standard output.

**Output Includes:**
- Couple index
- Material name
- Range cuts for all particles
- Energy cuts for all particles

**Example:**
```cpp
cutsTable->DumpCouples();
```

**Sample Output:**
```
========= Couple Information =======
Index : Material : Gamma Cut : Electron Cut : Positron Cut : Proton Cut
0     : Air      : 1 mm      : 1 mm         : 1 mm         : 1 mm
1     : Silicon  : 0.1 mm    : 0.05 mm      : 0.05 mm      : 0.1 mm
2     : Lead     : 10 mm     : 10 mm        : 10 mm        : 10 mm
...
```

### SetVerboseLevel() / GetVerboseLevel()
`source/processes/cuts/include/G4ProductionCutsTable.hh:154-156`
`source/processes/cuts/include/G4ProductionCutsTable.hh:357-361`

```cpp
void SetVerboseLevel(G4int value);
inline G4int GetVerboseLevel() const;
```

**Parameters:**
- `value`: Verbosity level
  - 0: Silent
  - 1: Warning messages
  - 2: Detailed information

**Example:**
```cpp
// Enable detailed output
cutsTable->SetVerboseLevel(2);

// Perform operations (will see detailed logging)
cutsTable->CreateCoupleTables();

// Restore quiet mode
cutsTable->SetVerboseLevel(0);
```

### GetMCCIndexConversionTable()
`source/processes/cuts/include/G4ProductionCutsTable.hh:90-91`
`source/processes/cuts/include/G4ProductionCutsTable.hh:363-368`

```cpp
inline const G4MCCIndexConversionTable* GetMCCIndexConversionTable() const;
```

**Returns:** Pointer to MCC index conversion table

**Purpose:** Used internally for mapping stored couple indices to runtime indices when retrieving cuts from files.

**Usage:** Typically only needed for advanced persistence operations.

## Usage Examples

### Basic Initialization

```cpp
// Get singleton instance
G4ProductionCutsTable* cutsTable =
    G4ProductionCutsTable::GetProductionCutsTable();

// Set energy range (optional, before initialization)
cutsTable->SetEnergyRange(1*keV, 100*GeV);

// RunManager will call CreateCoupleTables() automatically
G4RunManager* runManager = G4RunManager::GetRunManager();
runManager->Initialize();
```

### Inspecting Couples

```cpp
G4ProductionCutsTable* cutsTable =
    G4ProductionCutsTable::GetProductionCutsTable();

G4cout << "Total couples: " << cutsTable->GetTableSize() << G4endl;

for (std::size_t i = 0; i < cutsTable->GetTableSize(); ++i) {
    const G4MaterialCutsCouple* couple =
        cutsTable->GetMaterialCutsCouple(i);

    const G4Material* material = couple->GetMaterial();
    G4ProductionCuts* cuts = couple->GetProductionCuts();

    G4cout << "Couple " << i << ": " << material->GetName() << G4endl;
    G4cout << "  e- range cut: "
           << cuts->GetProductionCut("e-")/mm << " mm" << G4endl;
}
```

### Energy Cut Lookup

```cpp
// Get energy cuts for specific couple
G4int coupleIndex = 5;

const std::vector<G4double>* electronEnergyCuts =
    cutsTable->GetEnergyCutsVector(idxG4ElectronCut);

G4double eCut = (*electronEnergyCuts)[coupleIndex];
G4cout << "Electron energy cut for couple " << coupleIndex
       << ": " << eCut/keV << " keV" << G4endl;
```

### Range-to-Energy Conversion

```cpp
// Convert 1 mm range to energy for different materials
G4double rangeCut = 1.0*mm;
const G4ParticleDefinition* electron = G4Electron::Definition();

const G4Material* water =
    G4NistManager::Instance()->FindOrBuildMaterial("G4_WATER");
const G4Material* lead =
    G4NistManager::Instance()->FindOrBuildMaterial("G4_Pb");

G4double eWater = cutsTable->ConvertRangeToEnergy(electron, water, rangeCut);
G4double eLead = cutsTable->ConvertRangeToEnergy(electron, lead, rangeCut);

G4cout << "1 mm range in water = " << eWater/keV << " keV" << G4endl;
G4cout << "1 mm range in lead  = " << eLead/keV << " keV" << G4endl;
```

### Persistent Cuts Storage

```cpp
// First run: store cuts
void FirstRun() {
    G4ProductionCutsTable* cutsTable =
        G4ProductionCutsTable::GetProductionCutsTable();

    // Run initialization (creates couples, converts cuts)
    runManager->Initialize();

    // Store for future use
    cutsTable->StoreCutsTable("./cutdata", false);
}

// Subsequent runs: retrieve cuts
void SubsequentRun() {
    G4ProductionCutsTable* cutsTable =
        G4ProductionCutsTable::GetProductionCutsTable();

    // Check and retrieve
    if (cutsTable->CheckForRetrieveCutsTable("./cutdata", false)) {
        cutsTable->RetrieveCutsTable("./cutdata", false);
        G4cout << "Using stored cuts" << G4endl;
    }

    runManager->Initialize();
}
```

## Performance Considerations

### Couple Count Impact

The number of couples affects:
- **Memory**: Each couple requires physics table storage
- **Initialization time**: All couples need range-to-energy conversion
- **Runtime**: More couples = more table lookups

**Optimization:**
```cpp
// BAD: Many unique cuts objects
for (auto region : regions) {
    region->SetProductionCuts(new G4ProductionCuts(1*mm));  // Creates duplicate!
}

// GOOD: Reuse cuts objects
G4ProductionCuts* standardCuts = new G4ProductionCuts();
standardCuts->SetProductionCut(1*mm);

for (auto region : regions) {
    region->SetProductionCuts(standardCuts);  // Shares same cuts
}
```

### Persistent Storage Benefits

- **First run**: ~5-10 seconds for couple table creation (typical)
- **Subsequent runs**: ~0.5-1 second for retrieval (10× faster)

**When beneficial:**
- Large geometries (> 1000 couples)
- Frequent restarts during development
- Production runs with identical geometry

## Thread Safety

The `G4ProductionCutsTable` is designed for multi-threading:

- **Singleton Creation**: Thread-safe (Meyer's singleton)
- **Initialization**: Must complete in master thread before workers start
- **Runtime**: Read-only access from worker threads
- **Modification**: Not thread-safe; must be done in master thread only

::: warning MT Restrictions
Never modify the cuts table during event processing in multi-threaded mode. All configuration must be finalized in the master thread before `G4RunManager::BeamOn()`.
:::

## Common Patterns

### Pattern: Energy Range Extension

```cpp
// For very high energy applications
void ExtendEnergyRange() {
    G4ProductionCutsTable* cutsTable =
        G4ProductionCutsTable::GetProductionCutsTable();

    // Extend upper limit to 1 TeV
    cutsTable->SetEnergyRange(1*keV, 1*TeV);
    cutsTable->ResetConverters();
}
```

### Pattern: Diagnostic Output

```cpp
// Detailed cuts diagnostics
void DiagnoseCuts() {
    G4ProductionCutsTable* cutsTable =
        G4ProductionCutsTable::GetProductionCutsTable();

    cutsTable->SetVerboseLevel(2);
    cutsTable->DumpCouples();

    G4cout << "\nEnergy range: "
           << cutsTable->GetLowEdgeEnergy()/eV << " eV to "
           << cutsTable->GetHighEdgeEnergy()/GeV << " GeV" << G4endl;

    G4cout << "Total couples: " << cutsTable->GetTableSize() << G4endl;
}
```

## Troubleshooting

### Issue: Slow Initialization

**Symptom:** Long delay during `Initialize()`

**Solutions:**
```cpp
// 1. Use persistent storage
cutsTable->StoreCutsTable("./cutdata", false);  // After first run
cutsTable->RetrieveCutsTable("./cutdata", false);  // Subsequent runs

// 2. Reduce couple count
// Reuse production cuts objects across regions

// 3. Simplify geometry
// Fewer unique materials or regions
```

### Issue: Unexpected Energy Cuts

**Symptom:** Energy cuts different than expected

**Diagnosis:**
```cpp
cutsTable->SetVerboseLevel(2);
cutsTable->DumpCouples();

// Check range-to-energy conversion
G4double energy = cutsTable->ConvertRangeToEnergy(particle, material, range);
G4cout << "Converted energy: " << energy/keV << " keV" << G4endl;
```

### Issue: Missing Couples

**Symptom:** `GetCoupleIndex()` returns -1

**Solutions:**
```cpp
// Ensure CreateCoupleTables() has been called
if (cutsTable->GetTableSize() == 0) {
    G4cout << "Couple table empty - call CreateCoupleTables()" << G4endl;
}

// Check region configuration
G4Region* region = G4RegionStore::GetInstance()->GetRegion("MyRegion");
if (!region) {
    G4cout << "Region not found!" << G4endl;
}
```

## Related Classes

- [**G4ProductionCuts**](g4productioncuts.md) - Cut value container
- [**G4MaterialCutsCouple**](g4materialcutscouple.md) - Material-cuts pairing
- [**G4VRangeToEnergyConverter**](g4vrangetoenergyconverter.md) - Conversion base class
- [**G4MCCIndexConversionTable**](g4mccindexconversiontable.md) - Index mapping for persistence

## References

- Header: `source/processes/cuts/include/G4ProductionCutsTable.hh`
- Source: `source/processes/cuts/src/G4ProductionCutsTable.cc`
- [Cuts Module Overview](../index.md)

---

::: info API Version
**Geant4 Version:** 11.4.0.beta
**Last Updated:** 2025-11-17
**Status:** Complete API documentation
:::
