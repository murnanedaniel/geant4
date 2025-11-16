# G4IonisParamElm

**File**: `source/materials/include/G4IonisParamElm.hh`

## Overview

G4IonisParamElm stores physical quantities related to the ionisation process for an element defined by its atomic number Z. This class provides pre-computed parameters used in energy loss calculations.

## Class Description

This class contains computed parameters that depend only on the atomic number Z. These parameters are used by physics processes to calculate ionisation energy loss, including:
- Mean excitation energy
- Shell correction coefficients
- Parameters for low energy ion loss calculations
- Fermi velocity and related factors

The data was moved from G4Element to this separate class in version 09.07.98 to better organize ionisation-specific parameters.

## Constructors & Destructor

### Constructor

```cpp
G4IonisParamElm(G4double Z);
```

Creates ionisation parameters for an element with atomic number Z.

**Parameters**:
- `Z`: Atomic number

**Location**: G4IonisParamElm.hh:43

**Usage**: Automatically called by G4Element during construction.

### Destructor

```cpp
~G4IonisParamElm();
```

Destroys the ionisation parameters object.

**Location**: G4IonisParamElm.hh:44

### Deleted Copy Operations

```cpp
G4IonisParamElm& operator=(const G4IonisParamElm&) = delete;
G4IonisParamElm(G4IonisParamElm&) = delete;
```

Copy construction and assignment are explicitly disabled.

**Location**: G4IonisParamElm.hh:45-46

## Accessor Methods

### GetZ

```cpp
G4double GetZ() const;
```

Returns the atomic number.

**Returns**: Effective Z

**Location**: G4IonisParamElm.hh:51

### GetZ3

```cpp
G4double GetZ3() const;
```

Returns Z^(1/3) (cube root of atomic number).

**Returns**: pow(Z, 1/3)

**Location**: G4IonisParamElm.hh:54

**Usage**: Pre-computed for efficiency in physics calculations.

### GetZZ3

```cpp
G4double GetZZ3() const;
```

Returns [Z(Z+1)]^(1/3).

**Returns**: pow(Z*(Z+1), 1/3)

**Location**: G4IonisParamElm.hh:57

### GetlogZ3

```cpp
G4double GetlogZ3() const;
```

Returns log(Z)/3.

**Returns**: log(Z)/3

**Location**: G4IonisParamElm.hh:60

### GetTau0

```cpp
G4double GetTau0() const;
```

Returns tau0 = 0.1 * Z^(1/3) * MeV / proton_mass_c2.

**Returns**: Tau0 parameter

**Location**: G4IonisParamElm.hh:63

**Usage**: Used in ionisation energy loss calculations.

### GetTaul

```cpp
G4double GetTaul() const;
```

Returns taul = 2 * MeV / proton mass.

**Returns**: Taul parameter

**Location**: G4IonisParamElm.hh:66

**Usage**: Lower limit for Bethe-Bloch formula calculations.

### GetAlow, GetBlow, GetClow

```cpp
G4double GetAlow() const;
G4double GetBlow() const;
G4double GetClow() const;
```

Returns parameters for low energy ion loss calculations.

**Returns**: Alow, Blow, or Clow parameters

**Location**: G4IonisParamElm.hh:69-71

**Usage**: Used for energy loss calculations below the Bethe-Bloch range.

### GetMeanExcitationEnergy

```cpp
G4double GetMeanExcitationEnergy() const;
```

Returns the mean excitation energy from ICRU Report 37.

**Returns**: Mean excitation energy

**Location**: G4IonisParamElm.hh:74

**Reference**: ICRU Report 37 provides experimental/recommended values for different elements.

### GetFermiVelocity

```cpp
G4double GetFermiVelocity() const;
```

Returns the Fermi velocity for the element.

**Returns**: Fermi velocity

**Location**: G4IonisParamElm.hh:76

### GetLFactor

```cpp
G4double GetLFactor() const;
```

Returns the L factor for ion corrections.

**Returns**: L factor

**Location**: G4IonisParamElm.hh:77

### GetShellCorrectionVector

```cpp
G4double* GetShellCorrectionVector() const;
```

Returns a pointer to the shell correction coefficients array.

**Returns**: Pointer to shell correction vector

**Location**: G4IonisParamElm.hh:80

**Usage**: Shell corrections account for the discrete energy levels in atomic shells.

## Operators

### Deleted Comparison Operators

```cpp
G4bool operator==(const G4IonisParamElm&) const = delete;
G4bool operator!=(const G4IonisParamElm&) const = delete;
```

Comparison operators are explicitly disabled.

**Location**: G4IonisParamElm.hh:82-83

## Data Members

### Private Members

```cpp
G4double fZ;                          // Effective Z
G4double fZ3;                         // pow(Z, 1/3)
G4double fZZ3;                        // pow(Z*(Z+1), 1/3)
G4double flogZ3;                      // log(Z)/3

G4double fTau0;                       // 0.1*pow(Z,1/3)*MeV/proton_mass_c2
G4double fTaul;                       // 2*MeV/proton mass
G4double fBetheBlochLow;              // Bethe-Bloch at fTaul*particle mass
G4double fAlow, fBlow, fClow;         // Parameters for low energy ion.loss
G4double fMeanExcitationEnergy;       // Mean excitation energy
G4double* fShellCorrectionVector;     // Shell correction coefficients

G4double fVFermi;                     // Fermi velocity
G4double fLFactor;                    // L factor
```

**Location**: G4IonisParamElm.hh:89-106

## Usage Example

```cpp
// Typically accessed via G4Element
G4Element* carbon = new G4Element("Carbon", "C", 6., 12.01*g/mole);
G4IonisParamElm* ionParam = carbon->GetIonisation();

// Get mean excitation energy
G4double I = ionParam->GetMeanExcitationEnergy();

// Get shell correction vector
G4double* shellCorr = ionParam->GetShellCorrectionVector();

// Get pre-computed powers of Z
G4double Z3 = ionParam->GetZ3();
```

## Version History

Key changes from header comments (G4IonisParamElm.hh:31-32):

- **09.03.01**: Copy constructor and assignment operator made public (then later deleted)
- **09.07.98**: Data moved from G4Element to separate class

## Physics Background

### Mean Excitation Energy

The mean excitation energy (I-value) is a fundamental parameter in the Bethe-Bloch formula for energy loss by ionization. Values are taken from ICRU Report 37, which compiled experimental and theoretical data.

### Shell Corrections

Shell corrections account for deviations from the Bethe-Bloch formula at lower energies where the assumption of free electron behavior breaks down. The corrections depend on the discrete shell structure of atoms.

### Tau Parameters

- **Tau0**: Characteristic energy scale for the element
- **Taul**: Lower energy limit for Bethe-Bloch formula validity

### Low Energy Parameters

Alow, Blow, and Clow parameterize energy loss in the region below where Bethe-Bloch is valid, using an empirical fit.

## See Also

- [G4Element](./g4element.md) - Elements own ionisation parameter objects
- [G4IonisParamMat](./g4ionisparammat.md) - Ionisation parameters for materials
- [Bethe-Bloch Formula](https://en.wikipedia.org/wiki/Bethe_formula) - Theoretical background
- ICRU Report 37 (1984) - Source of mean excitation energy values
