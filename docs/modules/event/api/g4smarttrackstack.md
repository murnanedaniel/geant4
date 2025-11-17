# G4SmartTrackStack API Documentation

## Overview

`G4SmartTrackStack` is an optimized track stack implementation that organizes tracks by particle type for improved cache performance and memory locality. Unlike `G4TrackStack` which uses a single LIFO stack, `G4SmartTrackStack` maintains separate internal stacks for different particle types (primaries, neutrons, electrons, gammas, and positrons).

This smart organization can significantly improve performance for events with many secondaries by processing similar particles together, leading to better CPU cache utilization and reduced memory access overhead.

::: tip Header File
**Location:** `source/event/include/G4SmartTrackStack.hh`

**Compilation:** Enable with `G4_USESMARTSTACK` preprocessor definition
:::

## Class Declaration

`source/event/include/G4SmartTrackStack.hh:44-78`

```cpp
class G4SmartTrackStack
{
  public:
    G4SmartTrackStack();
   ~G4SmartTrackStack();

    G4SmartTrackStack& operator=(const G4SmartTrackStack&) = delete;
    G4bool operator==(const G4SmartTrackStack&) const = delete;
    G4bool operator!=(const G4SmartTrackStack&) const = delete;

    void PushToStack(const G4StackedTrack& aStackedTrack);
    G4StackedTrack PopFromStack();
    void clear();
    void clearAndDestroy();
    void TransferTo(G4TrackStack* aStack);
    G4double getEnergyOfStack(G4TrackStack* aTrackStack);
    void dumpStatistics();

    inline G4int GetNTrack() const;
    inline G4int GetMaxNTrack() const;

  private:
    G4int fTurn = 0;
    static constexpr G4int nTurn{5};
    std::array<G4double,nTurn> energies;
    std::array<G4TrackStack*,nTurn> stacks;
    // = 0 : all primaries and secondaries except followings
    // = 1 : secondary neutrons
    // = 2 : secondary electrons
    // = 3 : secondary gammas
    // = 4 : secondary positrons
    G4int maxNTracks{0};
    G4int nTracks{0};
};
```

## Internal Stack Organization

`source/event/include/G4SmartTrackStack.hh:68-75`

The smart stack maintains 5 internal `G4TrackStack` instances:

| Index | Particle Types | Purpose |
|-------|---------------|---------|
| **0** | All primaries + other secondaries | Default stack for primaries and unlisted particle types |
| **1** | Secondary neutrons | Neutron cascade processing |
| **2** | Secondary electrons (e-) | Electromagnetic shower (electrons) |
| **3** | Secondary gammas (γ) | Electromagnetic shower (photons) |
| **4** | Secondary positrons (e+) | Electromagnetic shower (positrons) |

::: info Round-Robin Processing
Tracks are popped in round-robin fashion from non-empty stacks, ensuring fair processing across particle types.
:::

## Constructors and Destructor

### Constructor
`source/event/include/G4SmartTrackStack.hh:48`

```cpp
G4SmartTrackStack();
```

**Behavior:**
- Creates 5 internal `G4TrackStack` instances
- Initializes energy counters to zero
- Sets turn counter to 0 (round-robin starting position)

**Usage:**
```cpp
// In G4StackManager (if G4_USESMARTSTACK defined)
#ifdef G4_USESMARTSTACK
    urgentStack = new G4SmartTrackStack();
#else
    urgentStack = new G4TrackStack();
#endif
```

### Destructor
`source/event/include/G4SmartTrackStack.hh:49`

```cpp
~G4SmartTrackStack();
```

**Behavior:**
- Deletes all 5 internal `G4TrackStack` instances
- Does NOT delete tracks themselves (caller's responsibility)

## Stack Operations

### PushToStack()
`source/event/include/G4SmartTrackStack.hh:55`

```cpp
void PushToStack(const G4StackedTrack& aStackedTrack);
```

**Parameters:**
- `aStackedTrack`: Track to push

**Behavior:**
- Examines particle type of track
- Routes to appropriate internal stack:
  - Primary particles → stack[0]
  - Secondary neutrons → stack[1]
  - Secondary e- → stack[2]
  - Secondary γ → stack[3]
  - Secondary e+ → stack[4]
  - Other secondaries → stack[0]
- Increments total track counter
- Updates maximum track count
- Updates energy sum for target stack

**Usage:**
```cpp
G4SmartTrackStack smartStack;

// Push various tracks
G4Track* primary = CreatePrimaryProton();
smartStack.PushToStack(G4StackedTrack(primary));  // → stack[0]

G4Track* neutron = CreateSecondaryNeutron();
smartStack.PushToStack(G4StackedTrack(neutron));  // → stack[1]

G4Track* electron = CreateSecondaryElectron();
smartStack.PushToStack(G4StackedTrack(electron)); // → stack[2]

G4Track* gamma = CreateSecondaryGamma();
smartStack.PushToStack(G4StackedTrack(gamma));    // → stack[3]

G4Track* positron = CreateSecondaryPositron();
smartStack.PushToStack(G4StackedTrack(positron)); // → stack[4]
```

**Particle Classification Logic:**
```cpp
// Conceptual implementation
void G4SmartTrackStack::PushToStack(const G4StackedTrack& st)
{
    G4Track* track = st.GetTrack();
    G4int stackIndex = 0;  // Default: primaries and others

    if (track->GetParentID() != 0) {  // Secondary particle
        G4ParticleDefinition* particle = track->GetDefinition();

        if (particle == G4Neutron::Definition())
            stackIndex = 1;  // Neutrons
        else if (particle == G4Electron::Definition())
            stackIndex = 2;  // Electrons
        else if (particle == G4Gamma::Definition())
            stackIndex = 3;  // Gammas
        else if (particle == G4Positron::Definition())
            stackIndex = 4;  // Positrons
        // else: remains 0 (other secondaries)
    }

    stacks[stackIndex]->PushToStack(st);
    energies[stackIndex] += track->GetKineticEnergy();
    nTracks++;
    if (nTracks > maxNTracks) maxNTracks = nTracks;
}
```

### PopFromStack()
`source/event/include/G4SmartTrackStack.hh:56`

```cpp
G4StackedTrack PopFromStack();
```

**Returns:** Next track using round-robin selection

**Behavior:**
- Uses round-robin algorithm across 5 stacks
- Starts from current `fTurn` position
- Checks each stack in sequence for non-empty stack
- Pops from first non-empty stack found
- Advances `fTurn` to next position
- Decrements total track counter
- Updates energy sum for source stack

**Usage:**
```cpp
G4SmartTrackStack smartStack;
// ... push many tracks ...

// Round-robin popping ensures fair distribution
while (smartStack.GetNTrack() > 0) {
    G4StackedTrack stackedTrack = smartStack.PopFromStack();
    G4Track* track = stackedTrack.GetTrack();

    ProcessTrack(track);
    delete track;
}
```

**Round-Robin Algorithm:**
```cpp
// Conceptual implementation
G4StackedTrack G4SmartTrackStack::PopFromStack()
{
    // Try each stack starting from fTurn
    for (G4int i = 0; i < nTurn; ++i) {
        G4int stackIndex = (fTurn + i) % nTurn;

        if (stacks[stackIndex]->GetNTrack() > 0) {
            G4StackedTrack st = stacks[stackIndex]->PopFromStack();

            // Update counters
            G4Track* track = st.GetTrack();
            energies[stackIndex] -= track->GetKineticEnergy();
            nTracks--;

            // Advance turn for next pop
            fTurn = (stackIndex + 1) % nTurn;

            return st;
        }
    }

    // All stacks empty (should not happen if GetNTrack() checked)
    return G4StackedTrack();
}
```

::: tip Performance Benefit
Round-robin ensures similar particles are processed in batches, improving CPU cache hit rates and memory access patterns.
:::

## Stack Management

### clear()
`source/event/include/G4SmartTrackStack.hh:57`

```cpp
void clear();
```

**Purpose:** Clear all stacks without deleting tracks

**Behavior:**
- Calls `clear()` on all 5 internal stacks
- Resets track counters to zero
- Resets energy sums to zero
- Does NOT delete tracks (memory leak if tracks not saved elsewhere)

**Usage:**
```cpp
// Save tracks elsewhere before clearing
std::vector<G4Track*> savedTracks;
while (smartStack.GetNTrack() > 0) {
    savedTracks.push_back(smartStack.PopFromStack().GetTrack());
}

smartStack.clear();  // Now safe to clear
```

### clearAndDestroy()
`source/event/include/G4SmartTrackStack.hh:58`

```cpp
void clearAndDestroy();
```

**Purpose:** Delete all tracks and clear stacks

**Behavior:**
- Calls `clearAndDestroy()` on all 5 internal stacks
- Deletes all `G4Track` and `G4VTrajectory` objects
- Resets all counters
- Frees all memory

**Usage:**
```cpp
// At event end - destroy all remaining tracks
smartStack.clearAndDestroy();

G4cout << "All tracks destroyed, stack cleared" << G4endl;
```

::: warning Destructive Operation
Use only when you're certain tracks should be deleted. Cannot be undone.
:::

### TransferTo()
`source/event/include/G4SmartTrackStack.hh:59`

```cpp
void TransferTo(G4TrackStack* aStack);
```

**Parameters:**
- `aStack`: Destination track stack

**Behavior:**
- Transfers all tracks from all 5 internal stacks to destination
- Clears this smart stack after transfer
- Destination stack receives tracks in internal stack order
- Resets all counters and energies

**Usage:**
```cpp
G4SmartTrackStack smartStack;
G4TrackStack regularStack;

// ... fill smart stack ...

// Transfer all to regular stack
smartStack.TransferTo(&regularStack);

G4cout << "Transferred to regular stack: "
       << regularStack.GetNTrack() << " tracks" << G4endl;
G4cout << "Smart stack now has: "
       << smartStack.GetNTrack() << " tracks" << G4endl;  // 0
```

**Transfer Order:**
```
Smart Stack → Regular Stack
  stack[0] (primaries/others) → transferred first
  stack[1] (neutrons)         → transferred second
  stack[2] (electrons)        → transferred third
  stack[3] (gammas)           → transferred fourth
  stack[4] (positrons)        → transferred last
```

## Query and Analysis Methods

### GetNTrack()
`source/event/include/G4SmartTrackStack.hh:63`

```cpp
inline G4int GetNTrack() const { return nTracks; }
```

**Returns:** Total number of tracks across all 5 internal stacks

**Usage:**
```cpp
G4int total = smartStack.GetNTrack();
G4cout << "Smart stack contains " << total << " tracks" << G4endl;

if (total == 0) {
    G4cout << "Stack is empty" << G4endl;
}
```

### GetMaxNTrack()
`source/event/include/G4SmartTrackStack.hh:64`

```cpp
inline G4int GetMaxNTrack() const { return maxNTracks; }
```

**Returns:** Maximum number of tracks stack has held simultaneously

**Purpose:** Performance monitoring and capacity planning

**Usage:**
```cpp
G4cout << "Stack high water mark: "
       << smartStack.GetMaxNTrack() << " tracks" << G4endl;
```

### getEnergyOfStack()
`source/event/include/G4SmartTrackStack.hh:60`

```cpp
G4double getEnergyOfStack(G4TrackStack* aTrackStack);
```

**Parameters:**
- `aTrackStack`: Internal stack to query (typically not called by users)

**Returns:** Total kinetic energy in specified stack

**Purpose:** Internal method for energy bookkeeping

### dumpStatistics()
`source/event/include/G4SmartTrackStack.hh:61`

```cpp
void dumpStatistics();
```

**Purpose:** Print detailed statistics about stack contents

**Output:** Information about each internal stack:
- Number of tracks
- Total energy
- Particle types

**Usage:**
```cpp
// During debugging or performance analysis
smartStack.dumpStatistics();

// Example output:
// SmartTrackStack Statistics:
//   Stack 0 (primaries/others): 5 tracks, 10.5 GeV
//   Stack 1 (neutrons):         120 tracks, 0.8 GeV
//   Stack 2 (electrons):        850 tracks, 5.2 GeV
//   Stack 3 (gammas):           1200 tracks, 3.8 GeV
//   Stack 4 (positrons):        45 tracks, 0.9 GeV
//   Total: 2220 tracks, 21.2 GeV
```

## Complete Examples

### Example 1: Basic Smart Stack Usage

```cpp
void DemonstrateSmartStack()
{
    G4SmartTrackStack smartStack;

    // Create diverse particle tracks
    std::vector<G4Track*> tracks = {
        CreatePrimaryProton(10*GeV),      // → stack[0]
        CreateSecondaryNeutron(100*MeV),  // → stack[1]
        CreateSecondaryGamma(5*MeV),      // → stack[3]
        CreateSecondaryElectron(2*MeV),   // → stack[2]
        CreateSecondaryPositron(3*MeV),   // → stack[4]
        CreateSecondaryPion(200*MeV)      // → stack[0]
    };

    // Push all tracks
    for (auto track : tracks) {
        smartStack.PushToStack(G4StackedTrack(track));
    }

    G4cout << "Total tracks: " << smartStack.GetNTrack() << G4endl;
    smartStack.dumpStatistics();

    // Process in round-robin order
    G4int processOrder = 0;
    while (smartStack.GetNTrack() > 0) {
        G4StackedTrack st = smartStack.PopFromStack();
        G4Track* track = st.GetTrack();

        G4cout << ++processOrder << ". Processing "
               << track->GetDefinition()->GetParticleName()
               << " (" << track->GetKineticEnergy()/MeV << " MeV)"
               << G4endl;

        delete track;
    }
}
```

### Example 2: Performance Comparison

```cpp
class StackPerformanceTest
{
public:
    void CompareStacks(G4int nEvents)
    {
        G4cout << "=== Stack Performance Comparison ===" << G4endl;

        // Test regular stack
        G4double regularTime = TestRegularStack(nEvents);

        // Test smart stack
        G4double smartTime = TestSmartStack(nEvents);

        G4cout << "Regular Stack: " << regularTime << " seconds"
               << G4endl;
        G4cout << "Smart Stack:   " << smartTime << " seconds"
               << G4endl;
        G4cout << "Speedup:       "
               << (regularTime / smartTime) << "x" << G4endl;
    }

private:
    G4double TestRegularStack(G4int nEvents)
    {
        auto start = std::chrono::high_resolution_clock::now();

        for (G4int i = 0; i < nEvents; ++i) {
            G4TrackStack stack;
            FillWithTypicalEvent(stack);
            ProcessAllTracks(stack);
        }

        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<G4double> elapsed = end - start;
        return elapsed.count();
    }

    G4double TestSmartStack(G4int nEvents)
    {
        auto start = std::chrono::high_resolution_clock::now();

        for (G4int i = 0; i < nEvents; ++i) {
            G4SmartTrackStack stack;
            FillWithTypicalEvent(stack);
            ProcessAllTracks(stack);
        }

        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<G4double> elapsed = end - start;
        return elapsed.count();
    }
};
```

### Example 3: Stack Analysis Tool

```cpp
class SmartStackAnalyzer
{
public:
    void AnalyzeEvent(G4SmartTrackStack& stack)
    {
        // Capture initial state
        G4int totalTracks = stack.GetNTrack();

        G4cout << "=== Smart Stack Analysis ===" << G4endl;
        G4cout << "Total tracks: " << totalTracks << G4endl;

        // Dump detailed statistics
        stack.dumpStatistics();

        // Analyze particle type distribution
        std::map<G4String, G4int> particleCounts;
        std::map<G4String, G4double> particleEnergies;

        // Extract and analyze all tracks
        std::vector<G4StackedTrack> tempStorage;
        while (stack.GetNTrack() > 0) {
            G4StackedTrack st = stack.PopFromStack();
            G4Track* track = st.GetTrack();

            G4String particleName =
                track->GetDefinition()->GetParticleName();
            G4double energy = track->GetKineticEnergy();

            particleCounts[particleName]++;
            particleEnergies[particleName] += energy;

            tempStorage.push_back(st);
        }

        // Print analysis
        G4cout << "\nParticle Type Distribution:" << G4endl;
        for (const auto& pair : particleCounts) {
            G4cout << "  " << pair.first << ": "
                   << pair.second << " tracks, "
                   << particleEnergies[pair.first]/MeV << " MeV"
                   << G4endl;
        }

        // Restore tracks to stack
        for (const auto& st : tempStorage) {
            stack.PushToStack(st);
        }
    }
};
```

### Example 4: Custom Round-Robin Processing

```cpp
class CustomRoundRobinProcessor
{
public:
    void ProcessByParticleType(G4SmartTrackStack& stack)
    {
        G4cout << "Processing tracks in round-robin fashion..."
               << G4endl;

        G4int batchNumber = 0;
        G4String lastParticleType = "";

        while (stack.GetNTrack() > 0) {
            G4StackedTrack st = stack.PopFromStack();
            G4Track* track = st.GetTrack();
            G4String particleType =
                track->GetDefinition()->GetParticleName();

            // Detect particle type changes (batch boundaries)
            if (particleType != lastParticleType) {
                if (!lastParticleType.empty()) {
                    G4cout << "  Batch " << batchNumber
                           << " (" << lastParticleType
                           << ") complete" << G4endl;
                }
                batchNumber++;
                lastParticleType = particleType;
                G4cout << "Starting batch " << batchNumber
                       << " (" << particleType << ")" << G4endl;
            }

            // Process track
            ProcessTrack(track);
            delete track;
        }

        G4cout << "Total batches: " << batchNumber << G4endl;
    }

private:
    void ProcessTrack(G4Track* track)
    {
        // Actual tracking...
    }
};
```

## Performance Characteristics

### Benefits
1. **Cache Locality**: Processing similar particles together improves CPU cache hits
2. **Memory Access Patterns**: Sequential access to similar particle data
3. **Reduced TLB Misses**: Better virtual memory performance
4. **Branch Prediction**: More predictable code paths for same particle type

### Overhead
1. **Classification Cost**: Particle type check on every push
2. **Round-Robin Logic**: Additional logic for pop operations
3. **Multiple Stacks**: ~5x memory overhead for stack structures
4. **Energy Bookkeeping**: Additional floating-point arithmetic

### When to Use
- Events with many electromagnetic secondaries (e-, e+, γ)
- Hadronic cascades with many neutrons
- Complex events with diverse particle types
- Performance-critical applications

### When Not to Use
- Simple events with few secondaries
- Single particle type dominates
- Memory-constrained environments
- Build system doesn't support G4_USESMARTSTACK

## Compilation

### Enable Smart Stack

```cmake
# In CMakeLists.txt or build configuration
add_definitions(-DG4_USESMARTSTACK)
```

Or:

```bash
# At build time
cmake -DG4_USESMARTSTACK=ON ..
```

### Runtime Selection

```cpp
// In G4StackManager constructor
#ifdef G4_USESMARTSTACK
    urgentStack = new G4SmartTrackStack();
    G4cout << "Using G4SmartTrackStack for urgent stack" << G4endl;
#else
    urgentStack = new G4TrackStack();
    G4cout << "Using G4TrackStack for urgent stack" << G4endl;
#endif
```

## Thread Safety

### Thread-Local Stacks
- Each worker thread has independent `G4SmartTrackStack` instance
- No sharing between threads
- No synchronization needed

### Internal Stacks
- All 5 internal stacks are thread-local
- Round-robin state (`fTurn`) is thread-local
- No concurrent access issues

## See Also

- [G4TrackStack](g4trackstack.md) - Standard LIFO track stack
- [G4StackedTrack](g4stackedtrack.md) - Track wrapper class
- [G4StackManager](g4stackmanager.md) - Stack management system
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4SmartTrackStack.hh`
- Source: `source/event/src/G4SmartTrackStack.cc`
:::
