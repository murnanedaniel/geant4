# G4ProductionCuts API Documentation

## Overview

`G4ProductionCuts` is the container class that stores production cut values for a geometrical region. It maintains range cuts (in distance units) for the four supported particle types: gamma, electron, positron, and proton. These range cuts are later converted to energy cuts on a per-material basis by `G4ProductionCutsTable`.

::: tip Header Files
**Location:** `source/processes/cuts/include/G4ProductionCuts.hh`
**Source:** `source/processes/cuts/src/G4ProductionCuts.cc`
:::

## Class Declaration

```cpp
class G4ProductionCuts
{
  public:
    G4ProductionCuts();
    G4ProductionCuts(const G4ProductionCuts& right);
    virtual ~G4ProductionCuts();

    G4ProductionCuts& operator=(const G4ProductionCuts& right);
    G4bool operator==(const G4ProductionCuts& right) const;
    G4bool operator!=(const G4ProductionCuts& right) const;

    // Set cuts by index, particle definition, or name
    void SetProductionCut(G4double cut, G4int index);
    void SetProductionCut(G4double cut, G4ParticleDefinition* ptcl);
    void SetProductionCut(G4double cut, const G4String& pName);
    void SetProductionCut(G4double cut);  // All particles

    // Get cuts
    G4double GetProductionCut(G4int index) const;
    G4double GetProductionCut(const G4String& name) const;
    const std::vector<G4double>& GetProductionCuts() const;
    void SetProductionCuts(std::vector<G4double>&);

    // Modification tracking
    G4bool IsModified() const;
    void PhysicsTableUpdated();

    // Helper methods
    static G4int GetIndex(const G4String& name);
    static G4int GetIndex(const G4ParticleDefinition* ptcl);

  protected:
    std::vector<G4double> fRangeCuts;
    G4bool isModified = true;
};
```

## Cut Index Enumeration

`source/processes/cuts/include/G4ProductionCuts.hh:45-53`

```cpp
enum G4ProductionCutsIndex
{
  idxG4GammaCut = 0,      // Index for photon cuts
  idxG4ElectronCut,       // Index for electron cuts (= 1)
  idxG4PositronCut,       // Index for positron cuts (= 2)
  idxG4ProtonCut,         // Index for proton cuts (= 3)
  NumberOfG4CutIndex      // Total count (= 4)
};
```

This enumeration provides type-safe indexing into the cut value vector.

## Constructors and Destructor

### Default Constructor
`source/processes/cuts/src/G4ProductionCuts.cc:36-42`

```cpp
G4ProductionCuts::G4ProductionCuts()
{
  for (G4int i=0; i<NumberOfG4CutIndex; ++i)
  {
    fRangeCuts.push_back(0.0);
  }
}
```

Creates a `G4ProductionCuts` object with all cuts initialized to 0.0.

**Default Values:**
- All four cut values initialized to 0.0
- `isModified` flag set to `true`

::: warning Zero Cuts
Default constructor creates zero cuts. You must explicitly set cut values before use. Zero cuts will be converted to minimum energy (1 keV) during range-to-energy conversion.
:::

### Copy Constructor
`source/processes/cuts/include/G4ProductionCuts.hh:62-63`

```cpp
G4ProductionCuts(const G4ProductionCuts& right);
```

Creates a copy of an existing `G4ProductionCuts` object.

**Implementation:**
- Initializes vector with zero values
- Uses assignment operator to copy values

### Destructor
`source/processes/cuts/src/G4ProductionCuts.cc:53-56`

```cpp
G4ProductionCuts::~G4ProductionCuts()
{
  fRangeCuts.clear();
}
```

Cleans up the range cuts vector. Automatically called when object goes out of scope.

## Setting Production Cuts

### SetProductionCut (By Index)
`source/processes/cuts/include/G4ProductionCuts.hh:75-76`
`source/processes/cuts/src/G4ProductionCuts.cc:80-95`

```cpp
void SetProductionCut(G4double cut, G4int index);
```

**Parameters:**
- `cut`: Range cut value in distance units (typically mm or cm)
- `index`: Cut index from `G4ProductionCutsIndex` enum

**Behavior:**
- Sets the specified cut value
- Marks cuts as modified (`isModified = true`)
- Invalid indices (< 0 or >= 4) trigger warning

**Example:**
```cpp
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(1.0*mm, idxG4ElectronCut);
cuts->SetProductionCut(1.0*mm, idxG4GammaCut);
```

::: warning Index Validation
Only indices 0-3 are valid (gamma, e-, e+, proton). Attempting to set cuts for other indices generates a `JustWarning` exception but doesn't crash.
:::

### SetProductionCut (By Particle Definition)
`source/processes/cuts/include/G4ProductionCuts.hh:76`

```cpp
void SetProductionCut(G4double cut, G4ParticleDefinition* ptcl);
```

**Parameters:**
- `cut`: Range cut value
- `ptcl`: Pointer to particle definition (e.g., `G4Gamma::Gamma()`)

**Behavior:**
- Determines appropriate index from particle type
- Calls `SetProductionCut(cut, index)`
- No effect if particle is not gamma, e-, e+, or proton

**Example:**
```cpp
cuts->SetProductionCut(0.5*mm, G4Electron::Definition());
cuts->SetProductionCut(0.5*mm, G4Positron::Definition());
cuts->SetProductionCut(2.0*mm, G4Gamma::Definition());
```

### SetProductionCut (By Particle Name)
`source/processes/cuts/include/G4ProductionCuts.hh:77`

```cpp
void SetProductionCut(G4double cut, const G4String& pName);
```

**Parameters:**
- `cut`: Range cut value
- `pName`: Particle name ("gamma", "e-", "e+", or "proton")

**Behavior:**
- Looks up index from particle name
- Calls `SetProductionCut(cut, index)`
- Case-sensitive particle names

**Example:**
```cpp
cuts->SetProductionCut(1.0*mm, "gamma");
cuts->SetProductionCut(0.1*mm, "e-");
cuts->SetProductionCut(0.1*mm, "e+");
cuts->SetProductionCut(1.0*mm, "proton");
```

::: tip Recommended Method
Using particle names is the most readable approach and is used in most user code and examples.
:::

### SetProductionCut (All Particles)
`source/processes/cuts/include/G4ProductionCuts.hh:82-83`
`source/processes/cuts/src/G4ProductionCuts.cc:97-103`

```cpp
void SetProductionCut(G4double cut);
```

**Parameters:**
- `cut`: Range cut value to apply to all four particle types

**Behavior:**
- Sets same cut value for gamma, e-, e+, and proton
- Convenient when uniform cuts are acceptable

**Example:**
```cpp
// Set 1 mm cut for all particles
cuts->SetProductionCut(1.0*mm);

// Equivalent to:
// cuts->SetProductionCut(1.0*mm, "gamma");
// cuts->SetProductionCut(1.0*mm, "e-");
// cuts->SetProductionCut(1.0*mm, "e+");
// cuts->SetProductionCut(1.0*mm, "proton");
```

### SetProductionCuts (Vector)
`source/processes/cuts/include/G4ProductionCuts.hh:91-92`

```cpp
void SetProductionCuts(std::vector<G4double>& cuts);
```

**Parameters:**
- `cuts`: Vector of cut values (must have 4 elements)

**Behavior:**
- Sets all cuts from vector in one call
- Vector index corresponds to `G4ProductionCutsIndex`

**Example:**
```cpp
std::vector<G4double> cutValues;
cutValues.push_back(1.0*mm);   // gamma
cutValues.push_back(0.5*mm);   // e-
cutValues.push_back(0.5*mm);   // e+
cutValues.push_back(2.0*mm);   // proton

cuts->SetProductionCuts(cutValues);
```

## Getting Production Cuts

### GetProductionCut (By Index)
`source/processes/cuts/include/G4ProductionCuts.hh:85-86`

```cpp
G4double GetProductionCut(G4int index) const;
```

**Parameters:**
- `index`: Cut index (0-3)

**Returns:**
- Range cut value for specified particle type
- Returns value in internal Geant4 units (mm)

**Example:**
```cpp
G4double electronCut = cuts->GetProductionCut(idxG4ElectronCut);
G4cout << "Electron cut: " << electronCut/mm << " mm" << G4endl;
```

### GetProductionCut (By Name)
`source/processes/cuts/include/G4ProductionCuts.hh:88-89`

```cpp
G4double GetProductionCut(const G4String& name) const;
```

**Parameters:**
- `name`: Particle name ("gamma", "e-", "e+", "proton")

**Returns:**
- Range cut value for specified particle

**Example:**
```cpp
G4double gammaCut = cuts->GetProductionCut("gamma");
G4double electronCut = cuts->GetProductionCut("e-");
```

### GetProductionCuts (All Values)
`source/processes/cuts/include/G4ProductionCuts.hh:94-95`

```cpp
const std::vector<G4double>& GetProductionCuts() const;
```

**Returns:**
- Const reference to internal vector of all four cut values

**Example:**
```cpp
const std::vector<G4double>& allCuts = cuts->GetProductionCuts();
for (std::size_t i = 0; i < allCuts.size(); ++i) {
    G4cout << "Cut[" << i << "] = " << allCuts[i]/mm << " mm" << G4endl;
}
```

## Modification Tracking

### IsModified()
`source/processes/cuts/include/G4ProductionCuts.hh:97-98`

```cpp
G4bool IsModified() const;
```

**Returns:**
- `true` if cuts have been modified since last physics table update
- `false` if cuts are synchronized with physics tables

**Purpose:**
- Used by `G4ProductionCutsTable` to determine if range-to-energy conversion is needed
- Prevents unnecessary recomputation of energy cuts

**Example:**
```cpp
if (cuts->IsModified()) {
    G4cout << "Cuts have changed, tables will be rebuilt" << G4endl;
}
```

### PhysicsTableUpdated()
`source/processes/cuts/include/G4ProductionCuts.hh:101-102`

```cpp
void PhysicsTableUpdated();
```

**Behavior:**
- Resets `isModified` flag to `false`
- Called by `G4ProductionCutsTable` after completing energy cut conversion

::: warning Internal Use Only
This method should only be called by `G4ProductionCutsTable` or `G4RunManager`. Users should never call this directly as it bypasses the physics table update mechanism.
:::

## Static Helper Methods

### GetIndex (By Name)
`source/processes/cuts/include/G4ProductionCuts.hh:104`

```cpp
static G4int GetIndex(const G4String& name);
```

**Parameters:**
- `name`: Particle name ("gamma", "e-", "e+", "proton")

**Returns:**
- Corresponding index from `G4ProductionCutsIndex`
- -1 if particle name not recognized

**Example:**
```cpp
G4int electronIndex = G4ProductionCuts::GetIndex("e-");
// electronIndex == 1 (idxG4ElectronCut)
```

### GetIndex (By Particle)
`source/processes/cuts/include/G4ProductionCuts.hh:105`

```cpp
static G4int GetIndex(const G4ParticleDefinition* ptcl);
```

**Parameters:**
- `ptcl`: Pointer to particle definition

**Returns:**
- Corresponding index for particle type
- -1 if particle doesn't have production cuts

**Example:**
```cpp
const G4ParticleDefinition* electron = G4Electron::Definition();
G4int idx = G4ProductionCuts::GetIndex(electron);
// idx == 1 (idxG4ElectronCut)
```

## Operators

### Assignment Operator
`source/processes/cuts/src/G4ProductionCuts.cc:58-68`

```cpp
G4ProductionCuts& operator=(const G4ProductionCuts& right);
```

**Behavior:**
- Copies all cut values from `right`
- Copies modification state
- Returns reference to allow chaining

**Example:**
```cpp
G4ProductionCuts cuts1;
cuts1.SetProductionCut(1.0*mm);

G4ProductionCuts cuts2;
cuts2 = cuts1;  // Copy all values
```

### Equality Operators
`source/processes/cuts/src/G4ProductionCuts.cc:70-78`

```cpp
G4bool operator==(const G4ProductionCuts& right) const;
G4bool operator!=(const G4ProductionCuts& right) const;
```

**Behavior:**
- Compares object addresses (pointer equality)
- Does NOT compare cut values

::: warning Identity Not Value Comparison
These operators check if two pointers refer to the same object, not whether cut values are equal. For value comparison, manually compare individual cuts.
:::

**Example:**
```cpp
G4ProductionCuts* cuts1 = new G4ProductionCuts();
G4ProductionCuts* cuts2 = cuts1;
G4ProductionCuts* cuts3 = new G4ProductionCuts();

cuts1->SetProductionCut(1.0*mm);
cuts3->SetProductionCut(1.0*mm);

(*cuts1 == *cuts2)  // true (same object)
(*cuts1 == *cuts3)  // false (different objects, even if values identical!)
```

## Usage Examples

### Basic Setup

```cpp
// Create production cuts object
G4ProductionCuts* cuts = new G4ProductionCuts();

// Set individual cuts
cuts->SetProductionCut(1.0*mm, "gamma");
cuts->SetProductionCut(0.5*mm, "e-");
cuts->SetProductionCut(0.5*mm, "e+");
cuts->SetProductionCut(1.0*mm, "proton");

// Assign to region
G4Region* region = G4RegionStore::GetInstance()->GetRegion("MyRegion");
region->SetProductionCuts(cuts);
```

### Uniform Cuts

```cpp
// Simple uniform cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(1.0*mm);  // All particles

region->SetProductionCuts(cuts);
```

### Fine-Tuned Cuts

```cpp
// Different cuts for different particles
G4ProductionCuts* trackerCuts = new G4ProductionCuts();
trackerCuts->SetProductionCut(0.01*mm, "gamma");    // Very fine gamma
trackerCuts->SetProductionCut(0.005*mm, "e-");      // Ultra-fine electrons
trackerCuts->SetProductionCut(0.005*mm, "e+");      // Ultra-fine positrons
trackerCuts->SetProductionCut(0.1*mm, "proton");    // Coarser protons

trackerRegion->SetProductionCuts(trackerCuts);
```

### Querying Cuts

```cpp
// Get and display all cuts
const std::vector<G4double>& cutValues = cuts->GetProductionCuts();

G4cout << "Production Cuts:" << G4endl;
G4cout << "  Gamma:    " << cutValues[idxG4GammaCut]/mm << " mm" << G4endl;
G4cout << "  Electron: " << cutValues[idxG4ElectronCut]/mm << " mm" << G4endl;
G4cout << "  Positron: " << cutValues[idxG4PositronCut]/mm << " mm" << G4endl;
G4cout << "  Proton:   " << cutValues[idxG4ProtonCut]/mm << " mm" << G4endl;
```

### Copying Cuts

```cpp
// Create template cuts
G4ProductionCuts* templateCuts = new G4ProductionCuts();
templateCuts->SetProductionCut(1.0*mm);

// Reuse for multiple regions (same object)
region1->SetProductionCuts(templateCuts);
region2->SetProductionCuts(templateCuts);  // Shares same cuts object

// Or create independent copy
G4ProductionCuts* independentCuts = new G4ProductionCuts(*templateCuts);
region3->SetProductionCuts(independentCuts);
```

### Programmatic Cut Modification

```cpp
// Modify cuts based on conditions
void AdaptCuts(G4ProductionCuts* cuts, G4double beamEnergy) {
    if (beamEnergy < 10*MeV) {
        // Low energy: fine cuts
        cuts->SetProductionCut(0.1*mm);
    } else if (beamEnergy < 100*MeV) {
        // Medium energy: standard cuts
        cuts->SetProductionCut(1.0*mm);
    } else {
        // High energy: coarse cuts
        cuts->SetProductionCut(10*mm);
    }
}
```

## Integration with Regions

### Region Assignment

```cpp
// Method 1: Create and assign
G4Region* myRegion = new G4Region("MyRegion");
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(0.5*mm);
myRegion->SetProductionCuts(cuts);

// Method 2: Get existing region
G4Region* detectorRegion =
    G4RegionStore::GetInstance()->GetRegion("DetectorRegion");
if (detectorRegion) {
    G4ProductionCuts* detCuts = new G4ProductionCuts();
    detCuts->SetProductionCut(0.1*mm, "e-");
    detCuts->SetProductionCut(0.1*mm, "e+");
    detCuts->SetProductionCut(1.0*mm, "gamma");
    detectorRegion->SetProductionCuts(detCuts);
}
```

### Multiple Regions with Same Cuts

```cpp
// Share cuts object across regions (efficient)
G4ProductionCuts* standardCuts = new G4ProductionCuts();
standardCuts->SetProductionCut(1.0*mm);

G4Region* region1 = new G4Region("Region1");
G4Region* region2 = new G4Region("Region2");

region1->SetProductionCuts(standardCuts);
region2->SetProductionCuts(standardCuts);  // Both use same object

// Modifying shared cuts affects both regions
standardCuts->SetProductionCut(2.0*mm);  // Changes for region1 AND region2
```

## Performance Considerations

### Cut Value Selection

- **Too Low (<< 0.1 mm)**: Massive performance penalty, many secondaries
- **Optimal (0.1-1 mm)**: Good balance for most applications
- **Coarse (>1 cm)**: Fast but may miss physics in sensitive regions

### Memory Efficiency

Each unique `G4ProductionCuts` object contributes to the number of `G4MaterialCutsCouple` objects:

```
Materials × Unique Cuts = Number of Couples
   10     ×      3       =        30 couples
```

**Recommendation**: Reuse `G4ProductionCuts` objects where possible to minimize couple count and memory usage.

## Common Pitfalls

### Pitfall 1: Zero Cuts
```cpp
// BAD: Default constructor gives zero cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
region->SetProductionCuts(cuts);  // All cuts are 0.0!

// GOOD: Always set values
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(1.0*mm);
region->SetProductionCuts(cuts);
```

### Pitfall 2: Modifying Shared Cuts
```cpp
// BAD: Shared cuts modified affects all regions
G4ProductionCuts* sharedCuts = new G4ProductionCuts();
sharedCuts->SetProductionCut(1.0*mm);

region1->SetProductionCuts(sharedCuts);
region2->SetProductionCuts(sharedCuts);

// Later...
sharedCuts->SetProductionCut(0.1*mm, "e-");  // Affects BOTH regions!

// GOOD: Create separate objects if different values needed
region1->SetProductionCuts(new G4ProductionCuts(1.0*mm));
region2->SetProductionCuts(new G4ProductionCuts(0.5*mm));
```

### Pitfall 3: Wrong Units
```cpp
// BAD: Forgetting units (interpreted as mm in Geant4 internal units)
cuts->SetProductionCut(1);  // Is this 1 mm? 1 cm? 1 m?

// GOOD: Always use units explicitly
cuts->SetProductionCut(1.0*mm);
cuts->SetProductionCut(0.1*cm);
cuts->SetProductionCut(100*um);
```

## Thread Safety

`G4ProductionCuts` is designed for multi-threaded use:

- **Creation**: Can be created in master thread
- **Modification**: Should be modified before worker threads start
- **Read-Only**: Treated as const during event processing
- **Shared**: Same object can be shared across threads (read-only access)

::: warning MT Mode
Do not modify production cuts during event processing in multi-threaded mode. All cuts must be finalized before `BeamOn()`.
:::

## Related Classes

- [**G4ProductionCutsTable**](g4productioncutstable.md) - Global registry managing all cuts
- [**G4MaterialCutsCouple**](g4materialcutscouple.md) - Pairs materials with cuts
- [**G4Region**](../../geometry/) - Geometric regions that use production cuts
- [**G4VRangeToEnergyConverter**](g4vrangetoenergyconverter.md) - Converts range to energy

## References

- Header: `source/processes/cuts/include/G4ProductionCuts.hh`
- Source: `source/processes/cuts/src/G4ProductionCuts.cc`
- [Cuts Module Overview](../index.md)

---

::: info API Version
**Geant4 Version:** 11.4.0.beta
**Last Updated:** 2025-11-17
**Status:** Complete API documentation
:::
