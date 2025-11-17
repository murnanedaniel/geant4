# G4DecayTable API Documentation

## Overview

`G4DecayTable` is a container class that manages a collection of decay channels for a particle. It stores pointers to `G4VDecayChannel` objects and organizes them by branching ratio in descending order. The class provides methods for adding decay channels, randomly selecting a channel based on branching ratios, and querying channel information. Each particle definition can have one decay table that describes all possible decay modes.

::: tip Header File
**Location:** `source/particles/management/include/G4DecayTable.hh`
**Source:** `source/particles/management/src/G4DecayTable.cc`
:::

## Class Declaration

```cpp
class G4DecayTable
{
  public:
    using G4VDecayChannelVector = std::vector<G4VDecayChannel*>;

    G4DecayTable();
    ~G4DecayTable();

    // Copy constructor and assignment operator are deleted
    G4DecayTable(const G4DecayTable&) = delete;
    G4DecayTable& operator=(const G4DecayTable&) = delete;

    // Equality operators
    G4bool operator==(const G4DecayTable& right) const;
    G4bool operator!=(const G4DecayTable& right) const;

    // Insert a decay channel at proper position
    void Insert(G4VDecayChannel* aChannel);

    // Returns number of decay channels
    G4int entries() const;

    // Select a decay channel randomly
    G4VDecayChannel* SelectADecayChannel(G4double parentMass = -1.);

    // Get decay channel by index
    G4VDecayChannel* GetDecayChannel(G4int index) const;
    G4VDecayChannel* operator[](G4int index);

    void DumpInfo() const;
};
```

## Constructor and Destructor

### G4DecayTable()
`source/particles/management/src/G4DecayTable.cc:36-39`

```cpp
G4DecayTable();
```

**Behavior:**

- Creates empty decay table
- Initializes internal vector to store decay channels
- No parameters required

**Example:**

```cpp
// Create decay table for a particle
G4DecayTable* decayTable = new G4DecayTable();
```

### Destructor
`source/particles/management/src/G4DecayTable.cc:41-51`

```cpp
~G4DecayTable();
```

**Behavior:**

- Deletes all decay channels stored in the table
- Clears the internal vector
- Automatically manages memory for all inserted channels

::: warning Memory Management
The decay table takes ownership of all inserted decay channels. When the decay table is destroyed, it will delete all channels. Do not manually delete channels after inserting them into the table.
:::

**Example:**

```cpp
// Decay table and all its channels are automatically cleaned up
delete decayTable;  // Also deletes all channels
```

## Channel Management

### Insert()
`source/particles/management/src/G4DecayTable.cc:53-75`

```cpp
void Insert(G4VDecayChannel* aChannel);
```

**Parameters:**

- `aChannel`: Pointer to decay channel to insert

**Behavior:**

- Inserts decay channel in descending order of branching ratio
- Automatically positions channel based on its BR value
- Validates that channel's parent matches table's parent
- Takes ownership of the channel pointer
- If parent doesn't match, prints warning and rejects channel

**Example:**

```cpp
G4DecayTable* decayTable = new G4DecayTable();

// Add first decay mode: pi0 -> gamma + gamma (BR = 0.9884)
G4VDecayChannel* channel1 = new G4PhaseSpaceDecayChannel(
    "pi0",              // parent
    0.9884,             // branching ratio
    2,                  // number of daughters
    "gamma", "gamma"    // daughters
);
decayTable->Insert(channel1);

// Add second decay mode: pi0 -> e+ + e- + gamma (BR = 0.0116)
G4VDecayChannel* channel2 = new G4DalitzDecayChannel(
    "pi0",              // parent
    0.0116,             // branching ratio
    "e+", "e-", "gamma" // daughters
);
decayTable->Insert(channel2);
```

::: warning Parent Validation
All channels in a decay table must have the same parent particle. If a channel with a different parent is inserted, it will be rejected with a warning message.
:::

### entries()
`source/particles/management/include/G4DecayTable.hh:95-98`

```cpp
inline G4int entries() const;
```

**Returns:** Number of decay channels in the table

**Example:**

```cpp
G4int nChannels = decayTable->entries();
G4cout << "This particle has " << nChannels << " decay modes" << G4endl;

// Iterate through all channels
for (G4int i = 0; i < decayTable->entries(); ++i) {
    G4VDecayChannel* channel = decayTable->GetDecayChannel(i);
    G4cout << "Channel " << i << " BR: " << channel->GetBR() << G4endl;
}
```

### GetDecayChannel()
`source/particles/management/include/G4DecayTable.hh:105-112`

```cpp
inline G4VDecayChannel* GetDecayChannel(G4int index) const;
```

**Parameters:**

- `index`: Index of channel (0 to entries()-1)

**Returns:** Pointer to decay channel, or `nullptr` if index out of range

**Behavior:**

- Channels are ordered by descending branching ratio
- Index 0 returns channel with highest BR
- Safe access with bounds checking
- Returns `nullptr` for invalid indices

**Example:**

```cpp
// Access specific decay channel
G4VDecayChannel* dominantMode = decayTable->GetDecayChannel(0);
if (dominantMode) {
    G4double br = dominantMode->GetBR();
    G4int nDaughters = dominantMode->GetNumberOfDaughters();

    G4cout << "Dominant decay mode:" << G4endl;
    G4cout << "  BR: " << br << G4endl;
    G4cout << "  Daughters: ";
    for (G4int i = 0; i < nDaughters; ++i) {
        G4cout << dominantMode->GetDaughterName(i) << " ";
    }
    G4cout << G4endl;
}
```

### operator[]
`source/particles/management/include/G4DecayTable.hh:100-103`

```cpp
inline G4VDecayChannel* operator[](G4int index);
```

**Parameters:**

- `index`: Index of channel (0 to entries()-1)

**Returns:** Pointer to decay channel

**Behavior:**

- Direct array-style access to channels
- No bounds checking (faster but less safe than `GetDecayChannel()`)
- Assumes valid index

::: warning Bounds Checking
This operator does not perform bounds checking. Use `GetDecayChannel()` if you need safe access, or ensure index is valid: `0 <= index < entries()`.
:::

**Example:**

```cpp
// Array-style access
for (G4int i = 0; i < decayTable->entries(); ++i) {
    G4VDecayChannel* channel = (*decayTable)[i];  // or decayTable->operator[](i)
    channel->DumpInfo();
}
```

## Decay Selection

### SelectADecayChannel()
`source/particles/management/src/G4DecayTable.cc:77-109`

```cpp
G4VDecayChannel* SelectADecayChannel(G4double parentMass = -1.);
```

**Parameters:**

- `parentMass`: Mass of parent particle (default: -1, uses PDG mass)

**Returns:** Pointer to randomly selected decay channel, or `nullptr` if no valid channel

**Behavior:**

- Randomly selects decay channel weighted by branching ratios
- Checks if decay is kinematically allowed for given parent mass
- Only considers channels where sum of daughter masses < parent mass
- Normalizes branching ratios among kinematically allowed channels
- Uses `G4UniformRand()` for random selection
- Returns `nullptr` if no channels are kinematically allowed
- Maximum 10000 attempts to select valid channel

**Algorithm:**

1. Calculate sum of branching ratios for kinematically allowed channels
2. Generate random number: `r = G4UniformRand() * sumBR`
3. Iterate through channels, accumulating BR values
4. Select channel where accumulated BR exceeds random number

**Example:**

```cpp
// Select decay channel using PDG mass
G4VDecayChannel* selectedChannel = decayTable->SelectADecayChannel();
if (selectedChannel) {
    // Perform decay
    G4DecayProducts* products = selectedChannel->DecayIt();
    // ... process decay products
}

// Select decay channel for specific parent mass
G4double dynamicalMass = 140.0*MeV;  // Mass for this particular decay
G4VDecayChannel* channel = decayTable->SelectADecayChannel(dynamicalMass);
if (channel) {
    G4DecayProducts* products = channel->DecayIt(dynamicalMass);
    // ... process decay products
} else {
    G4cout << "No kinematically allowed decay at this mass" << G4endl;
}
```

::: tip Kinematic Selection
When a parent particle has a dynamical mass (e.g., from Breit-Wigner distribution), use `SelectADecayChannel(mass)` to ensure only kinematically allowed decays are selected. This is particularly important for resonances and particles with significant width.
:::

**Selection Logic Example:**

```cpp
// Example with pi0 decay table
// Channel 0: pi0 -> gamma gamma    (BR = 0.9884)
// Channel 1: pi0 -> e+ e- gamma    (BR = 0.0116)
//
// Random selection:
// - If random number < 0.9884: select channel 0
// - If random number >= 0.9884: select channel 1
//
// With parent mass check:
G4double lowMass = 1.0*MeV;  // Below e+e- threshold
G4VDecayChannel* channel = decayTable->SelectADecayChannel(lowMass);
// Will return gamma gamma channel only (e+e- not kinematically allowed)
```

## Utility Methods

### DumpInfo()
`source/particles/management/src/G4DecayTable.cc:111-121`

```cpp
void DumpInfo() const;
```

**Purpose:** Print complete decay table information to `G4cout`

**Output Includes:**

- Parent particle name
- All decay channels with indices
- For each channel: BR and daughters

**Example:**

```cpp
decayTable->DumpInfo();
```

**Sample Output:**

```
G4DecayTable:  pi0
0:  BR:  0.9884  [PhaseSpace]   :   gamma gamma
1:  BR:  0.0116  [Dalitz]       :   e+ e- gamma
```

## Comparison Operators

### operator==()
`source/particles/management/include/G4DecayTable.hh:85-88`

```cpp
inline G4bool operator==(const G4DecayTable& right) const;
```

**Returns:** `true` if both tables are the same object (pointer comparison)

**Purpose:** Check if two decay table references point to same object

### operator!=()
`source/particles/management/include/G4DecayTable.hh:90-93`

```cpp
inline G4bool operator!=(const G4DecayTable& right) const;
```

**Returns:** `true` if tables are different objects

**Example:**

```cpp
if (decayTable1 == decayTable2) {
    G4cout << "Same decay table" << G4endl;
}
```

## Usage Examples

### Creating Complete Decay Table

```cpp
// Example: Define muon decay table
void CreateMuonDecayTable()
{
    // Get muon particle definition
    G4ParticleDefinition* muon = G4MuonMinus::Definition();

    // Create decay table
    G4DecayTable* decayTable = new G4DecayTable();

    // Muon has one decay mode: mu- -> e- nu_e_bar nu_mu
    G4VDecayChannel* channel = new G4MuonDecayChannel(
        "mu-",                 // parent
        1.0                    // branching ratio (100%)
    );
    decayTable->Insert(channel);

    // Attach to particle
    muon->SetDecayTable(decayTable);
}
```

### Multiple Decay Modes

```cpp
// Example: K+ decay modes (simplified)
void CreateKaonPlusDecayTable()
{
    G4DecayTable* decayTable = new G4DecayTable();

    // K+ -> mu+ nu_mu (BR = 63.55%)
    G4VDecayChannel* mode1 = new G4PhaseSpaceDecayChannel(
        "kaon+", 0.6355, 2, "mu+", "nu_mu"
    );
    decayTable->Insert(mode1);

    // K+ -> pi+ pi0 (BR = 20.66%)
    G4VDecayChannel* mode2 = new G4PhaseSpaceDecayChannel(
        "kaon+", 0.2066, 2, "pi+", "pi0"
    );
    decayTable->Insert(mode2);

    // K+ -> pi+ pi+ pi- (BR = 5.59%)
    G4VDecayChannel* mode3 = new G4PhaseSpaceDecayChannel(
        "kaon+", 0.0559, 3, "pi+", "pi+", "pi-"
    );
    decayTable->Insert(mode3);

    // K+ -> pi+ pi0 pi0 (BR = 1.76%)
    G4VDecayChannel* mode4 = new G4PhaseSpaceDecayChannel(
        "kaon+", 0.0176, 3, "pi+", "pi0", "pi0"
    );
    decayTable->Insert(mode4);

    // K+ -> e+ nu_e (BR = 1.58%)
    G4VDecayChannel* mode5 = new G4PhaseSpaceDecayChannel(
        "kaon+", 0.0158, 2, "e+", "nu_e"
    );
    decayTable->Insert(mode5);

    // Set on particle
    G4KaonPlus::Definition()->SetDecayTable(decayTable);

    // Display information
    G4cout << "Kaon+ decay modes:" << G4endl;
    decayTable->DumpInfo();
}
```

### Analyzing Decay Table

```cpp
void AnalyzeDecayTable(G4ParticleDefinition* particle)
{
    G4DecayTable* decayTable = particle->GetDecayTable();

    if (!decayTable) {
        G4cout << particle->GetParticleName() << " has no decay table" << G4endl;
        return;
    }

    G4cout << "Particle: " << particle->GetParticleName() << G4endl;
    G4cout << "Number of decay modes: " << decayTable->entries() << G4endl;
    G4cout << G4endl;

    // Analyze each channel
    G4double totalBR = 0.0;
    for (G4int i = 0; i < decayTable->entries(); ++i) {
        G4VDecayChannel* channel = decayTable->GetDecayChannel(i);
        G4double br = channel->GetBR();
        totalBR += br;

        G4cout << "Mode " << i << ":" << G4endl;
        G4cout << "  Kinematics: " << channel->GetKinematicsName() << G4endl;
        G4cout << "  BR: " << br*100 << "%" << G4endl;
        G4cout << "  Daughters: ";

        for (G4int j = 0; j < channel->GetNumberOfDaughters(); ++j) {
            G4cout << channel->GetDaughterName(j);
            if (j < channel->GetNumberOfDaughters()-1) G4cout << " + ";
        }
        G4cout << G4endl << G4endl;
    }

    G4cout << "Total BR: " << totalBR*100 << "%" << G4endl;

    // Warn if BR doesn't sum to 1
    if (std::abs(totalBR - 1.0) > 0.001) {
        G4cout << "WARNING: Branching ratios don't sum to 100%" << G4endl;
    }
}

// Usage
AnalyzeDecayTable(G4PionZero::Definition());
AnalyzeDecayTable(G4MuonMinus::Definition());
AnalyzeDecayTable(G4KaonPlus::Definition());
```

### Simulating Particle Decay

```cpp
// Simulate particle decay using decay table
void SimulateDecay(G4ParticleDefinition* parentDef, G4double parentMass)
{
    G4DecayTable* decayTable = parentDef->GetDecayTable();
    if (!decayTable) {
        G4cout << "Particle is stable or has no decay table" << G4endl;
        return;
    }

    // Select decay channel
    G4VDecayChannel* channel = decayTable->SelectADecayChannel(parentMass);

    if (!channel) {
        G4cout << "No kinematically allowed decay at mass "
               << parentMass/MeV << " MeV" << G4endl;
        return;
    }

    // Perform decay
    G4cout << "Selected decay: " << channel->GetKinematicsName() << G4endl;
    G4cout << "BR: " << channel->GetBR()*100 << "%" << G4endl;
    G4cout << "Daughters: ";
    for (G4int i = 0; i < channel->GetNumberOfDaughters(); ++i) {
        G4cout << channel->GetDaughterName(i) << " ";
    }
    G4cout << G4endl;

    // Generate decay products with kinematics
    G4DecayProducts* products = channel->DecayIt(parentMass);

    if (products) {
        G4cout << "Decay products:" << G4endl;
        for (G4int i = 0; i < products->entries(); ++i) {
            G4DynamicParticle* daughter = (*products)[i];
            G4cout << "  " << daughter->GetDefinition()->GetParticleName()
                   << " (E = " << daughter->GetTotalEnergy()/MeV << " MeV)"
                   << G4endl;
        }
        delete products;
    }
}

// Example usage
SimulateDecay(G4PionZero::Definition(), G4PionZero::Definition()->GetPDGMass());
```

### Statistical Analysis of Decay Modes

```cpp
// Run Monte Carlo to verify branching ratio selection
void TestDecaySelection(G4DecayTable* decayTable, G4int nTrials = 100000)
{
    std::vector<G4int> counts(decayTable->entries(), 0);

    // Run trials
    for (G4int i = 0; i < nTrials; ++i) {
        G4VDecayChannel* channel = decayTable->SelectADecayChannel();

        // Find which channel was selected
        for (G4int j = 0; j < decayTable->entries(); ++j) {
            if (channel == decayTable->GetDecayChannel(j)) {
                counts[j]++;
                break;
            }
        }
    }

    // Print results
    G4cout << "Decay selection statistics (" << nTrials << " trials):" << G4endl;
    for (G4int i = 0; i < decayTable->entries(); ++i) {
        G4VDecayChannel* channel = decayTable->GetDecayChannel(i);
        G4double expectedBR = channel->GetBR();
        G4double observedBR = G4double(counts[i]) / nTrials;
        G4double difference = std::abs(expectedBR - observedBR);

        G4cout << "Mode " << i << ":" << G4endl;
        G4cout << "  Expected: " << expectedBR*100 << "%" << G4endl;
        G4cout << "  Observed: " << observedBR*100 << "%" << G4endl;
        G4cout << "  Difference: " << difference*100 << "%" << G4endl;
    }
}

// Usage
G4DecayTable* kaonTable = G4KaonPlus::Definition()->GetDecayTable();
TestDecaySelection(kaonTable);
```

## Thread Safety

### Thread-Safe Operations

::: tip Safe Operations
- **Read Access**: All getter methods are thread-safe
- **Decay Selection**: `SelectADecayChannel()` can be called from multiple threads
- **Channel Access**: `GetDecayChannel()` and `operator[]` are thread-safe
:::

### Setup Requirements

```cpp
// Master thread: create and populate decay table
void MyPhysicsList::ConstructProcess()
{
    // Create decay table (master thread only)
    G4DecayTable* decayTable = new G4DecayTable();

    // Add channels
    decayTable->Insert(channel1);
    decayTable->Insert(channel2);

    // Attach to particle definition
    particle->SetDecayTable(decayTable);
}

// Worker threads: decay tables are shared read-only
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Safe to access decay table from worker thread
    G4ParticleDefinition* particle = step->GetTrack()->GetDefinition();
    G4DecayTable* decayTable = particle->GetDecayTable();

    if (decayTable) {
        // Thread-safe: read-only access
        G4VDecayChannel* channel = decayTable->SelectADecayChannel();
        // ... perform decay
    }
}
```

::: warning Unsafe Operations
- **Modification**: Do not call `Insert()` after initialization
- **Deletion**: Do not delete decay tables from worker threads
- **Creation**: Create decay tables only during initialization in master thread
:::

### Best Practices

1. **Initialize in Master Thread**: Create and populate all decay tables during initialization
2. **Read-Only Access**: Only read from decay tables during event processing
3. **Random Number Generation**: Each thread has independent random number stream
4. **Decay Products**: Delete `G4DecayProducts` after use to avoid memory leaks

## Performance Notes

### Memory Efficiency

- **Shared Tables**: One decay table per particle type (not per track)
- **Channel Storage**: Minimal overhead, stores only pointers
- **Ordering**: Channels stored in descending BR order for efficient selection

### Selection Algorithm

```cpp
// Efficient O(n) selection where n = number of channels
// Typical particles have 1-5 channels, so very fast
G4VDecayChannel* SelectADecayChannel(G4double parentMass)
{
    G4double sumBR = 0.0;
    // First pass: calculate sum of allowed BRs
    for (channel in channels) {
        if (IsOKWithParentMass(parentMass))
            sumBR += channel->GetBR();
    }

    // Second pass: select channel
    G4double random = G4UniformRand() * sumBR;
    G4double sum = 0.0;
    for (channel in channels) {
        sum += channel->GetBR();
        if (random < sum) return channel;
    }
}
```

### Optimization Tips

1. **Cache Decay Tables**: Store frequently used decay tables
2. **Minimize Channels**: Remove negligible BR modes if not needed
3. **Normalize BRs**: Ensure branching ratios sum to 1.0
4. **Avoid Repeated Lookups**: Cache particle definitions with decay tables

## Common Patterns

### Conditional Decay Modes

```cpp
// Add decay modes only if kinematically allowed
void AddDecayModes(G4ParticleDefinition* parent)
{
    G4DecayTable* decayTable = new G4DecayTable();
    G4double parentMass = parent->GetPDGMass();

    // Check if two-pion decay is allowed
    G4double pionMass = G4PionPlus::Definition()->GetPDGMass();
    if (parentMass > 2*pionMass) {
        G4VDecayChannel* piPiMode = new G4PhaseSpaceDecayChannel(
            parent->GetParticleName(), 0.5, 2, "pi+", "pi-"
        );
        decayTable->Insert(piPiMode);
    }

    // Check if three-pion decay is allowed
    if (parentMass > 3*pionMass) {
        G4VDecayChannel* threePiMode = new G4PhaseSpaceDecayChannel(
            parent->GetParticleName(), 0.3, 3, "pi+", "pi-", "pi0"
        );
        decayTable->Insert(threePiMode);
    }

    parent->SetDecayTable(decayTable);
}
```

### Custom Particle Decay Setup

```cpp
// Define custom particle with decay modes
class MyHeavyParticle
{
public:
    static void Construct()
    {
        // Create particle definition
        G4ParticleDefinition* particle = new G4ParticleDefinition(
            "heavy_X", 10.0*GeV, 1.0*GeV, 0.0,
            0, 1, 0, 0, 0, 0,
            "exotic", 0, 0, 9999999, false, 1.0e-12*s,
            nullptr  // decay table set below
        );

        // Create decay table
        G4DecayTable* decayTable = new G4DecayTable();

        // Mode 1: X -> e+ e- (BR = 0.5)
        decayTable->Insert(new G4PhaseSpaceDecayChannel(
            "heavy_X", 0.5, 2, "e+", "e-"
        ));

        // Mode 2: X -> mu+ mu- (BR = 0.3)
        decayTable->Insert(new G4PhaseSpaceDecayChannel(
            "heavy_X", 0.3, 2, "mu+", "mu-"
        ));

        // Mode 3: X -> gamma gamma (BR = 0.2)
        decayTable->Insert(new G4PhaseSpaceDecayChannel(
            "heavy_X", 0.2, 2, "gamma", "gamma"
        ));

        particle->SetDecayTable(decayTable);
    }
};
```

## See Also

### Related Classes

- [G4VDecayChannel](g4vdecaychannel.md) - Abstract base class for decay channels
- [G4ParticleDefinition](g4particledefinition.md) - Particle properties and decay table holder
- [G4PhaseSpaceDecayChannel](g4phasespacedecaychannel.md) - Generic phase space decay
- [G4DecayProducts](../decay/g4decayproducts.md) - Container for decay products

### Decay Channel Types

- `G4PhaseSpaceDecayChannel` - Generic N-body phase space decay
- `G4DalitzDecayChannel` - Dalitz decay (e.g., pi0 -> e+ e- gamma)
- `G4MuonDecayChannel` - Muon decay with V-A interaction
- `G4MuonDecayChannelWithSpin` - Polarized muon decay
- `G4TauLeptonicDecayChannel` - Tau leptonic decays
- `G4KL3DecayChannel` - Kaon semi-leptonic decay
- `G4NeutronBetaDecayChannel` - Free neutron beta decay
- `G4PionRadiativeDecayChannel` - Pion radiative decay

### Module Documentation

- [Particles Module Overview](../index.md) - Complete particles module
- [Decay Processes](../../processes/decay.md) - Decay process implementation

---

::: info Source Reference
Complete implementation in:
- Header: `source/particles/management/include/G4DecayTable.hh`
- Source: `source/particles/management/src/G4DecayTable.cc`
:::
