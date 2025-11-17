# G4PhononPolarization

**File**: `source/processes/solidstate/phonon/include/G4PhononPolarization.hh`

## Overview

G4PhononPolarization is a namespace containing enumeration constants and conversion functions for phonon polarization types. It provides the standard interface for mapping between G4ParticleDefinition objects and integer polarization codes used throughout the phonon physics implementation.

## Namespace Description

G4PhononPolarization provides polarization utilities:

- **Enumeration Constants**: Integer codes for each polarization type
- **Particle→Code Conversion**: Maps G4ParticleDefinition to polarization code
- **Code→Particle Conversion**: Maps polarization code to G4ParticleDefinition
- **Unknown Type Handling**: Returns -1 for non-phonon particles
- **Type Safety**: Ensures consistent polarization representation

**Purpose**: Provides consistent polarization encoding across all phonon processes and utilities.

**Location**: `source/processes/solidstate/phonon/include/G4PhononPolarization.hh:38`

## Polarization Constants

### Enumeration

```cpp
namespace G4PhononPolarization {
    enum {
        Long = 0,          // Line 39: Longitudinal acoustic
        TransSlow = 1,     // Line 39: Slow transverse acoustic
        TransFast = 2,     // Line 39: Fast transverse acoustic
        UNKNOWN = -1       // Line 39: Not a phonon
    };
}
```

**Values**:
- **Long (0)**: Longitudinal acoustic phonon
  - Compression/rarefaction waves
  - Displacement parallel to propagation
  - Typically fastest mode

- **TransSlow (1)**: Slow transverse acoustic phonon
  - Shear wave (slower branch)
  - Displacement perpendicular to propagation
  - Lower velocity than TransFast

- **TransFast (2)**: Fast transverse acoustic phonon
  - Shear wave (faster branch)
  - Displacement perpendicular to propagation
  - Higher velocity than TransSlow

- **UNKNOWN (-1)**: Invalid/unknown polarization
  - Used for non-phonon particles
  - Error indicator

**Location**: Line 39

## Conversion Functions

### Get (ParticleDefinition → Code)

```cpp
G4int Get(const G4ParticleDefinition* aPD);
```

Converts particle definition to polarization code.

**Parameters**:
- `aPD`: Pointer to particle definition

**Returns**:
- `0` if aPD is G4PhononLong
- `1` if aPD is G4PhononTransSlow
- `2` if aPD is G4PhononTransFast
- `-1` if aPD is any other particle type

**Usage**:
```cpp
const G4ParticleDefinition* particle = track->GetParticleDefinition();
G4int pol = G4PhononPolarization::Get(particle);

if (pol == G4PhononPolarization::Long) {
    // Handle longitudinal phonon
} else if (pol == G4PhononPolarization::TransSlow) {
    // Handle slow transverse phonon
} else if (pol == G4PhononPolarization::TransFast) {
    // Handle fast transverse phonon
} else {
    // Not a phonon
}
```

**Implementation**: Compares particle definition pointer against known phonon types.

**Location**: Line 41

### Get (Code → ParticleDefinition)

```cpp
G4ParticleDefinition* Get(G4int pol);
```

Converts polarization code to particle definition.

**Parameters**:
- `pol`: Polarization code (0, 1, 2, or -1)

**Returns**:
- G4PhononLong::Definition() if pol == 0
- G4PhononTransSlow::Definition() if pol == 1
- G4PhononTransFast::Definition() if pol == 2
- nullptr if pol == -1 or invalid

**Usage**:
```cpp
G4int polarization = 1;  // TransSlow
G4ParticleDefinition* phononDef = G4PhononPolarization::Get(polarization);

if (phononDef) {
    G4DynamicParticle* phonon =
        new G4DynamicParticle(phononDef, momentum, energy);
}
```

**Implementation**: Switch statement returning appropriate particle definition singleton.

**Location**: Line 42

## Physical Background

### Acoustic Phonons

All three polarizations are **acoustic modes**:

**Dispersion at k→0**:
```
ω(k) = v|k| + O(k²)
```

**Characteristics**:
- Linear dispersion at long wavelengths
- Represent sound waves
- Group velocity v_g ≈ v_phase at low k
- Carry heat and momentum

### Longitudinal vs. Transverse

**Longitudinal (L)**:
- **Displacement**: ∥ propagation direction
- **Equation**: ∂²u/∂t² = c_L² ∇²u
- **Velocity**: c_L = √((K + 4μ/3)/ρ)
- **Typical**: ~5000-6000 m/s in Ge, Si

**Transverse (T)**:
- **Displacement**: ⊥ propagation direction
- **Equation**: ∂²u/∂t² = c_T² ∇²u
- **Velocity**: c_T = √(μ/ρ)
- **Typical**: ~3000-3500 m/s in Ge, Si

Where:
- K = bulk modulus
- μ = shear modulus
- ρ = density

### Fast vs. Slow Transverse

In cubic crystals, two transverse branches exist:

**Isotropic Case**:
- TS and TF degenerate (same velocity)
- Arbitrary choice which is "fast" vs. "slow"

**Anisotropic Case**:
- Different velocities for different polarizations
- Fast: Higher velocity branch
- Slow: Lower velocity branch
- Splitting depends on crystal orientation

**Typical Splitting**: 10-20% velocity difference

## Usage Patterns

### Getting Polarization from Track

```cpp
// In phonon process
const G4Track& track = ...;
G4int pol = G4PhononPolarization::Get(track.GetParticleDefinition());

switch(pol) {
    case G4PhononPolarization::Long:
        // L phonon physics
        break;
    case G4PhononPolarization::TransSlow:
        // TS phonon physics
        break;
    case G4PhononPolarization::TransFast:
        // TF phonon physics
        break;
    default:
        // Error: not a phonon
        G4Exception("Process", "InvalidParticle", ...);
}
```

### Creating Phonon with Specific Polarization

```cpp
// Choose polarization based on physics
G4int chosenPolarization = G4PhononPolarization::TransFast;

// Get particle definition
G4ParticleDefinition* phononDef =
    G4PhononPolarization::Get(chosenPolarization);

// Get properties from lattice
G4ThreeVector velocity = lattice->MapKtoVDir(chosenPolarization, k);
G4double energy = lattice->MapKtoE(chosenPolarization, k);

// Create dynamic particle
G4DynamicParticle* phonon =
    new G4DynamicParticle(phononDef, velocity, energy);
```

### Sampling Polarization from Density of States

```cpp
// Get density of states for each polarization
G4double L_dos = lattice->GetLDOS(k);
G4double ST_dos = lattice->GetSTDOS(k);
G4double FT_dos = lattice->GetFTDOS(k);

// Choose polarization randomly weighted by DOS
G4double total_dos = L_dos + ST_dos + FT_dos;
G4double rand = G4UniformRand() * total_dos;

G4int polarization;
if (rand < L_dos) {
    polarization = G4PhononPolarization::Long;
} else if (rand < L_dos + ST_dos) {
    polarization = G4PhononPolarization::TransSlow;
} else {
    polarization = G4PhononPolarization::TransFast;
}

// Create phonon with chosen polarization
G4ParticleDefinition* phononDef = G4PhononPolarization::Get(polarization);
```

## Error Handling

### Checking for Valid Phonon

```cpp
G4int pol = G4PhononPolarization::Get(particle);

if (pol == G4PhononPolarization::UNKNOWN) {
    G4cerr << "Error: Not a phonon particle!" << G4endl;
    G4cerr << "Particle: " << particle->GetParticleName() << G4endl;
    return;
}

// Safe to proceed with phonon physics
```

### Validating Code

```cpp
G4int polarization = ...; // From some calculation

if (polarization < 0 || polarization > 2) {
    G4cerr << "Error: Invalid polarization code " << polarization << G4endl;
    polarization = G4PhononPolarization::Long; // Default
}

G4ParticleDefinition* phononDef = G4PhononPolarization::Get(polarization);
```

## Integration with Lattice Classes

### Dispersion Relation Access

```cpp
// All lattice methods use polarization codes
G4int pol = G4PhononPolarization::Long;

// Get velocity
G4double velocity = lattice->MapKtoV(pol, k);

// Get density of states
G4double dos = lattice->GetLDOS(k);  // L mode
dos = lattice->GetSTDOS(k);          // ST mode
dos = lattice->GetFTDOS(k);          // FT mode

// Get group velocity direction
G4ThreeVector vDir = lattice->MapKtoVDir(pol, k);
```

### Process Implementation

All phonon processes use these conventions:

**G4VPhononProcess**:
```cpp
protected:
virtual G4int GetPolarization(const G4Track& track) const {
    return G4PhononPolarization::Get(track.GetParticleDefinition());
}

virtual G4Track* CreateSecondary(G4int polarization, ...) {
    G4ParticleDefinition* phononDef = G4PhononPolarization::Get(polarization);
    // Create track with this particle type
}
```

## Particle Definitions

The polarization codes map to these particle types:

**G4PhononLong**:
- Particle name: "phononL"
- PDG code: Not standard PDG (custom)
- Mass: 0
- Charge: 0
- Lifetime: Stable (processes handle decay)

**G4PhononTransSlow**:
- Particle name: "phononTS"
- PDG code: Custom
- Mass: 0
- Charge: 0

**G4PhononTransFast**:
- Particle name: "phononTF"
- PDG code: Custom
- Mass: 0
- Charge: 0

## Design Rationale

### Why Integer Codes?

**Performance**: Integer comparison faster than string or pointer comparison

**Array Indexing**: Can directly index into arrays:
```cpp
G4double velocity[3];  // One for each polarization
velocity[pol] = lattice->MapKtoV(pol, k);
```

**Switch Statements**: Enable efficient branch prediction

**Legacy Code**: Many physics libraries use integer codes

### Why Namespace Instead of Class?

**No State**: No data members needed
**Global Constants**: Polarization codes are universal
**Function Grouping**: Namespace provides logical grouping
**No Instantiation**: Never need to create objects

## Consistency Checks

### Validation Function Example

```cpp
bool IsValidPolarization(G4int pol) {
    return (pol >= G4PhononPolarization::Long &&
            pol <= G4PhononPolarization::TransFast);
}

bool IsPhonon(const G4ParticleDefinition* particle) {
    return (G4PhononPolarization::Get(particle) !=
            G4PhononPolarization::UNKNOWN);
}
```

### Debug Output

```cpp
const char* PolarizationName(G4int pol) {
    switch(pol) {
        case G4PhononPolarization::Long:
            return "Longitudinal";
        case G4PhononPolarization::TransSlow:
            return "Transverse Slow";
        case G4PhononPolarization::TransFast:
            return "Transverse Fast";
        default:
            return "Unknown";
    }
}

// Usage
G4cout << "Phonon polarization: " << PolarizationName(pol) << G4endl;
```

## See Also

- [G4VPhononProcess](g4vphononprocess.md) - Uses polarization utilities
- [G4PhononDownconversion](g4phonondownconversion.md) - Chooses daughter polarizations
- [G4LatticeManager](g4latticemanager.md) - Accepts polarization codes
- G4PhononLong - Longitudinal phonon particle
- G4PhononTransSlow - Slow transverse phonon particle
- G4PhononTransFast - Fast transverse phonon particle
