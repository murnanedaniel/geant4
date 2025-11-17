# G4PhononTrackMap

**File**: `source/processes/solidstate/phonon/include/G4PhononTrackMap.hh`

## Overview

G4PhononTrackMap is a thread-local singleton that associates phonon tracks with their wavevectors. Since G4Track doesn't natively store k-vector information, this map provides temporary storage until wavevector support is added to the core tracking system.

## Class Description

G4PhononTrackMap provides wavevector storage:

- **Thread-Local Singleton**: Separate map for each worker thread
- **Track Association**: Maps G4Track pointer to G4ThreeVector k-vector
- **Lifetime Management**: Creates/removes entries as tracks start/end
- **Fast Lookup**: Direct map access for k-vector retrieval
- **Temporary Solution**: To be replaced when k-vector added to G4Track

**Purpose**: Phonon physics requires both particle properties (energy, direction) AND wavevector k for dispersion relations. The k-vector is distinct from momentum due to crystal periodicity.

**Location**: `source/processes/solidstate/phonon/include/G4PhononTrackMap.hh:40`

## Type Definitions

### TrkIDKmap

```cpp
typedef std::map<const G4Track*, G4ThreeVector> TrkIDKmap;  // Line 42
```

Map type associating track pointers with k-vectors.

**Key**: const G4Track* (unique per track)
**Value**: G4ThreeVector (wavevector in crystal frame)

## Singleton Access

### GetPhononTrackMap

```cpp
static G4PhononTrackMap* GetPhononTrackMap();
```

Returns thread-local singleton instance.

**Returns**: Pointer to track map for current thread

**Thread Safety**: Each thread has its own map instance (Line 43).

**Location**: Line 46

### GetInstance (Synonym)

```cpp
static G4PhononTrackMap* GetInstance();
```

Synonym for GetPhononTrackMap().

**Returns**: Same as GetPhononTrackMap()

**Location**: Line 47

## Wavevector Management

### SetK (Track Pointer)

```cpp
void SetK(const G4Track* track, const G4ThreeVector& K);
```

Stores wavevector for track.

**Parameters**:
- `track`: Track pointer (key)
- `K`: Wavevector in crystal coordinates [1/length]

**Behavior**:
- If track not in map: Creates new entry
- If track already in map: Updates k-vector

**Usage**:
```cpp
G4PhononTrackMap* kmap = G4PhononTrackMap::GetPhononTrackMap();
G4ThreeVector k(0.1/nm, 0.05/nm, 0);
kmap->SetK(phononTrack, k);
```

**Location**: Line 50

### SetK (Track Reference)

```cpp
void SetK(const G4Track& track, const G4ThreeVector& K);
```

Overload accepting track reference.

**Parameters**:
- `track`: Track reference
- `K`: Wavevector

**Implementation**: Calls pointer version (Line 51).

**Location**: Line 51

### GetK (Track Pointer)

```cpp
const G4ThreeVector& GetK(const G4Track* track) const;
```

Retrieves wavevector for track.

**Parameters**:
- `track`: Track to query

**Returns**: Reference to stored k-vector

**Error Handling**: If track not found, returns reference to zero vector or throws exception (implementation-dependent).

**Usage**:
```cpp
const G4ThreeVector& k = kmap->GetK(track);
G4double k_magnitude = k.mag();
```

**Location**: Line 54

### GetK (Track Reference)

```cpp
const G4ThreeVector& GetK(const G4Track& track) const;
```

Overload accepting track reference.

**Parameters**:
- `track`: Track reference

**Returns**: Reference to k-vector

**Implementation**: Calls pointer version (Line 55).

**Location**: Line 55

## Query Methods

### Find (Track Pointer)

```cpp
G4bool Find(const G4Track* track) const;
```

Checks if track has registered k-vector.

**Parameters**:
- `track`: Track to check

**Returns**: `true` if track in map, `false` otherwise

**Usage**:
```cpp
if (kmap->Find(track)) {
    // Track has k-vector
    const G4ThreeVector& k = kmap->GetK(track);
} else {
    // Need to initialize k-vector
    G4ThreeVector k = CalculateInitialK(track);
    kmap->SetK(track, k);
}
```

**Location**: Line 58

### Find (Track Reference)

```cpp
G4bool Find(const G4Track& track) const;
```

Overload accepting track reference.

**Parameters**:
- `track`: Track reference

**Returns**: `true` if found

**Implementation**: Calls pointer version (Line 59).

**Location**: Line 59

## Cleanup Methods

### RemoveTrack

```cpp
void RemoveTrack(const G4Track* track);
```

Removes track from map.

**Parameters**:
- `track`: Track to remove

**Usage**: Called in G4VPhononProcess::EndTracking() to clean up when track ends.

**Importance**: Prevents memory leaks from accumulating track map entries.

**Example**:
```cpp
// In G4VPhononProcess::EndTracking()
if (currentTrack) {
    trackKmap->RemoveTrack(currentTrack);
}
```

**Location**: Line 62

### Clear

```cpp
void Clear();
```

Removes all entries from map.

**Usage**:
- Called at end of event
- Called during initialization
- Manual cleanup if needed

**Effect**: Empties entire map for this thread.

**Location**: Line 64

## Private Members

### The Map

```cpp
private:
TrkIDKmap theMap;  // Line 67
```

Internal storage: std::map<const G4Track*, G4ThreeVector>

### Static Instance

```cpp
private:
static G4ThreadLocal G4PhononTrackMap* theTrackMap;  // Line 43
```

Thread-local singleton pointer.

## Private Constructor/Destructor

### Constructor

```cpp
private:
G4PhononTrackMap();
```

Private constructor (singleton pattern).

**Implementation**: Line 70
```cpp
G4PhononTrackMap() { Clear(); }  // Ensure map is empty
```

**Location**: Line 70

### Destructor

```cpp
private:
~G4PhononTrackMap();
```

Private destructor.

**Implementation**: Line 71
```cpp
~G4PhononTrackMap() {;}
```

**Location**: Line 71

## Physical Background

### Why Separate k-Vector?

In crystals, phonon momentum is:
```
p = ℏk
```

But k is only defined modulo reciprocal lattice vector G:
```
k ≡ k + G
```

This makes k fundamentally different from ordinary momentum:

**G4Track Momentum**:
- `p = m × v` (classical)
- Always points in propagation direction
- Continuous, well-defined

**Phonon Wavevector**:
- `k` defined in first Brillouin zone
- May not parallel to group velocity (anisotropy)
- Determines energy via ω(k) dispersion
- Needed for scattering kinematics

### k vs. p for Phonons

**Energy**: `E = ℏω(k)` NOT `E = p²/(2m)`

**Velocity**: `v = ∇_k ω(k)` NOT `v = p/m`

**Scattering**: Requires k for:
- Conservation: k₁ + k₂ = k₃ + G
- Dispersion lookup: ω = ω(k)
- Polarization selection

## Usage Patterns

### Creating Phonon

```cpp
// When creating phonon secondary
G4ThreeVector k = CalculateWavevector();  // From physics
G4ThreeVector v = lattice->MapKtoVDir(polarization, k);
G4double energy = lattice->MapKtoE(polarization, k);

// Create dynamic particle with velocity and energy
G4DynamicParticle* phonon =
    new G4DynamicParticle(phononDef, v, energy);

// Create track
G4Track* track = new G4Track(phonon, time, position);

// Register k-vector
G4PhononTrackMap::GetPhononTrackMap()->SetK(track, k);
```

### Accessing During Process

```cpp
// In G4VPhononProcess::PostStepDoIt()
G4PhononTrackMap* kmap = G4PhononTrackMap::GetPhononTrackMap();

// Get parent k-vector
const G4ThreeVector& k_parent = kmap->GetK(track);

// Use in physics calculation
G4double omega = CalculateFrequency(k_parent);
G4ThreeVector k_daughter = CalculateScatteredK(k_parent);

// Create daughter with new k
G4Track* daughter = CreateSecondary(polarization, k_daughter, E_daughter);
kmap->SetK(daughter, k_daughter);
```

### Cleanup at Track End

```cpp
// In G4VPhononProcess::EndTracking()
G4PhononTrackMap* kmap = G4PhononTrackMap::GetPhononTrackMap();
kmap->RemoveTrack(currentTrack);
```

## Future Development

From file comment (Line 36-38): "For temporary use until wavevector is added to G4Track as a data member, after Release 10.0."

**Planned Change**:
- Add k-vector as native G4Track member
- Remove G4PhononTrackMap class
- Update phonon processes to use G4Track::GetWavevector()

**Benefits**:
- Cleaner design (no separate map)
- Better performance (direct access)
- Type safety (can't forget to register k)

**Until Then**: G4PhononTrackMap provides necessary functionality.

## Thread Safety

**Design**:
- Each thread has own map instance (G4ThreadLocal)
- No sharing between threads
- No mutex needed
- No race conditions

**Worker Thread Usage**:
```cpp
// In worker thread
G4PhononTrackMap* myThreadMap =
    G4PhononTrackMap::GetPhononTrackMap();

// Only sees tracks from this thread
myThreadMap->SetK(track, k);
```

## Performance

**Lookup Cost**: O(log N) where N = active phonon tracks
- Typical N = 10-1000 per event
- Lookup time: ~20-50 ns
- Negligible compared to physics (~microseconds)

**Memory Usage**: ~50 bytes per track
- Track pointer: 8 bytes
- k-vector: 24 bytes (3 doubles)
- Map overhead: ~16 bytes
- Total: ~1-50 KB per event

**Best Practice**: Always call RemoveTrack() in EndTracking to prevent memory accumulation.

## See Also

- [G4VPhononProcess](g4vphononprocess.md) - Uses track map
- [G4PhononDownconversion](g4phonondownconversion.md) - Creates new k-vectors
- [G4LatticeManager](g4latticemanager.md) - Provides k→ω mapping
- G4Track - Will eventually contain k-vector natively
