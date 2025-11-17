# G4MaterialPropertiesIndex

**File**: `source/materials/include/G4MaterialPropertiesIndex.hh`

## Overview

G4MaterialPropertiesIndex defines enumeration constants for material property indices used throughout Geant4's optical and material property system. This header provides two key enumerations: `G4MaterialPropertyIndex` for energy-dependent properties (vectors) and `G4MaterialConstPropertyIndex` for constant (energy-independent) properties. These enumerations ensure type-safe and consistent access to material properties across optical simulations.

## Purpose

The enumeration indices serve as keys for storing and retrieving:
- Optical properties (refractive index, absorption, reflectivity)
- Scintillation properties (yields, time constants, emission spectra)
- Wavelength-shifting properties
- Surface properties for optical boundary processes
- Ultra-cold neutron properties (Fermi potential, spin flip, etc.)

These indices are used internally by G4MaterialPropertiesTable to organize and access material properties efficiently.

## Enumerations

### G4MaterialPropertyIndex

Energy-dependent material properties that vary with photon energy or momentum. These properties are stored as G4MaterialPropertyVector objects.

**Location**: G4MaterialPropertiesIndex.hh:39-69

```cpp
enum G4MaterialPropertyIndex {
  kNullPropertyIndex = -1,
  kRINDEX,
  kREFLECTIVITY,
  kREALRINDEX,
  kIMAGINARYRINDEX,
  kEFFICIENCY,
  kTRANSMITTANCE,
  kSPECULARLOBECONSTANT,
  kSPECULARSPIKECONSTANT,
  kBACKSCATTERCONSTANT,
  kGROUPVEL,
  kMIEHG,
  kRAYLEIGH,
  kWLSCOMPONENT,
  kWLSABSLENGTH,
  kWLSCOMPONENT2,
  kWLSABSLENGTH2,
  kABSLENGTH,
  kPROTONSCINTILLATIONYIELD,
  kDEUTERONSCINTILLATIONYIELD,
  kTRITONSCINTILLATIONYIELD,
  kALPHASCINTILLATIONYIELD,
  kIONSCINTILLATIONYIELD,
  kELECTRONSCINTILLATIONYIELD,
  kSCINTILLATIONCOMPONENT1,
  kSCINTILLATIONCOMPONENT2,
  kSCINTILLATIONCOMPONENT3,
  kCOATEDRINDEX,
  kNumberOfPropertyIndex
};
```

#### Optical Properties

##### kRINDEX
Refractive index as a function of photon energy. This is the most fundamental optical property, required for photon refraction and reflection at material boundaries.

**String key**: "RINDEX"

**Usage**: Essential for optical photon transport, Cherenkov radiation

**Note**: When RINDEX is set, GROUPVEL is automatically calculated

**Location**: G4MaterialPropertiesIndex.hh:41

##### kREFLECTIVITY
Surface reflectivity (probability of reflection) as a function of photon energy.

**String key**: "REFLECTIVITY"

**Range**: 0.0 (no reflection) to 1.0 (perfect reflection)

**Location**: G4MaterialPropertiesIndex.hh:42

##### kREALRINDEX
Real part of complex refractive index for materials with absorption.

**String key**: "REALRINDEX"

**Usage**: Used together with IMAGINARYRINDEX for absorbing materials

**Location**: G4MaterialPropertiesIndex.hh:43

##### kIMAGINARYRINDEX
Imaginary part of complex refractive index, related to absorption coefficient.

**String key**: "IMAGINARYRINDEX"

**Usage**: Determines photon absorption in metals and other strongly absorbing materials

**Location**: G4MaterialPropertiesIndex.hh:44

##### kEFFICIENCY
Detection efficiency for photon detectors as a function of energy.

**String key**: "EFFICIENCY"

**Range**: 0.0 (no detection) to 1.0 (100% efficiency)

**Location**: G4MaterialPropertiesIndex.hh:45

##### kTRANSMITTANCE
Transmittance of a dielectric surface as a function of photon energy.

**String key**: "TRANSMITTANCE"

**Location**: G4MaterialPropertiesIndex.hh:46

##### kGROUPVEL
Group velocity of photons in the material.

**String key**: "GROUPVEL"

**Note**: Automatically calculated from RINDEX; should not be set manually

**Location**: G4MaterialPropertiesIndex.hh:50

#### Surface Scattering Properties

##### kSPECULARLOBECONSTANT
Reflection probability about the normal of a micro-facet.

**String key**: "SPECULARLOBECONSTANT"

**Usage**: Part of the UNIFIED optical surface model

**Location**: G4MaterialPropertiesIndex.hh:47

##### kSPECULARSPIKECONSTANT
Reflection probability about the average surface normal.

**String key**: "SPECULARSPIKECONSTANT"

**Usage**: Part of the UNIFIED optical surface model

**Location**: G4MaterialPropertiesIndex.hh:48

##### kBACKSCATTERCONSTANT
Back-scattering probability for deep surface grooves.

**String key**: "BACKSCATTERCONSTANT"

**Usage**: Models multiple reflections within surface structures

**Location**: G4MaterialPropertiesIndex.hh:49

#### Scattering Properties

##### kMIEHG
Mie scattering length as a function of photon energy.

**String key**: "MIEHG"

**Usage**: Forward-peaked scattering based on Henyey-Greenstein phase function

**Location**: G4MaterialPropertiesIndex.hh:51

##### kRAYLEIGH
Rayleigh scattering attenuation length.

**String key**: "RAYLEIGH"

**Usage**: Isotropic scattering dominant for small particles/fluctuations

**Location**: G4MaterialPropertiesIndex.hh:52

#### Absorption Properties

##### kABSLENGTH
Absorption length (attenuation length) for photons.

**String key**: "ABSLENGTH"

**Usage**: Exponential absorption: I = I0 * exp(-x/ABSLENGTH)

**Location**: G4MaterialPropertiesIndex.hh:57

#### Wavelength-Shifting Properties

##### kWLSCOMPONENT
Wavelength-shifting emission spectrum (relative intensity vs photon energy).

**String key**: "WLSCOMPONENT"

**Usage**: Defines re-emission spectrum after WLS absorption

**Location**: G4MaterialPropertiesIndex.hh:53

##### kWLSABSLENGTH
Wavelength-shifting absorption length.

**String key**: "WLSABSLENGTH"

**Usage**: Absorption length for WLS process (primary wavelength shifter)

**Location**: G4MaterialPropertiesIndex.hh:54

##### kWLSCOMPONENT2
Secondary wavelength-shifting emission spectrum.

**String key**: "WLSCOMPONENT2"

**Usage**: For materials with two WLS components

**Location**: G4MaterialPropertiesIndex.hh:55

##### kWLSABSLENGTH2
Secondary wavelength-shifting absorption length.

**String key**: "WLSABSLENGTH2"

**Location**: G4MaterialPropertiesIndex.hh:56

#### Scintillation Properties (Energy-Dependent)

##### kPROTONSCINTILLATIONYIELD
Scintillation light yield by protons as a function of energy.

**String key**: "PROTONSCINTILLATIONYIELD"

**Location**: G4MaterialPropertiesIndex.hh:58

##### kDEUTERONSCINTILLATIONYIELD
Scintillation light yield by deuterons as a function of energy.

**String key**: "DEUTERONSCINTILLATIONYIELD"

**Location**: G4MaterialPropertiesIndex.hh:59

##### kTRITONSCINTILLATIONYIELD
Scintillation light yield by tritons as a function of energy.

**String key**: "TRITONSCINTILLATIONYIELD"

**Location**: G4MaterialPropertiesIndex.hh:60

##### kALPHASCINTILLATIONYIELD
Scintillation light yield by alpha particles as a function of energy.

**String key**: "ALPHASCINTILLATIONYIELD"

**Location**: G4MaterialPropertiesIndex.hh:61

##### kIONSCINTILLATIONYIELD
Scintillation light yield by ions as a function of energy.

**String key**: "IONSCINTILLATIONYIELD"

**Location**: G4MaterialPropertiesIndex.hh:62

##### kELECTRONSCINTILLATIONYIELD
Scintillation light yield by electrons as a function of energy.

**String key**: "ELECTRONSCINTILLATIONYIELD"

**Location**: G4MaterialPropertiesIndex.hh:63

##### kSCINTILLATIONCOMPONENT1
Scintillation emission spectrum for first component.

**String key**: "SCINTILLATIONCOMPONENT1"

**Usage**: Normalized emission probability vs photon energy

**Location**: G4MaterialPropertiesIndex.hh:64

##### kSCINTILLATIONCOMPONENT2
Scintillation emission spectrum for second component.

**String key**: "SCINTILLATIONCOMPONENT2"

**Location**: G4MaterialPropertiesIndex.hh:65

##### kSCINTILLATIONCOMPONENT3
Scintillation emission spectrum for third component.

**String key**: "SCINTILLATIONCOMPONENT3"

**Location**: G4MaterialPropertiesIndex.hh:66

#### Coated Surface Properties

##### kCOATEDRINDEX
Real part of refractive index for thin coating layer.

**String key**: "COATEDRINDEX"

**Usage**: For coated optical surfaces with thin film interference

**Location**: G4MaterialPropertiesIndex.hh:67

### G4MaterialConstPropertyIndex

Constant (energy-independent) material properties stored as single G4double values.

**Location**: G4MaterialPropertiesIndex.hh:71-154

```cpp
enum G4MaterialConstPropertyIndex {
  kNullConstPropertyIndex = -1,
  kSURFACEROUGHNESS,
  kISOTHERMAL_COMPRESSIBILITY,
  kRS_SCALE_FACTOR,
  kWLSMEANNUMBERPHOTONS,
  kWLSTIMECONSTANT,
  kWLSMEANNUMBERPHOTONS2,
  kWLSTIMECONSTANT2,
  kMIEHG_FORWARD,
  kMIEHG_BACKWARD,
  kMIEHG_FORWARD_RATIO,
  kSCINTILLATIONYIELD,
  kRESOLUTIONSCALE,
  kFERMIPOT,
  kDIFFUSION,
  kSPINFLIP,
  kLOSS,
  kLOSSCS,
  kABSCS,
  kSCATCS,
  // ... microroughness and scintillation parameters
  kNumberOfConstPropertyIndex
};
```

#### Surface Properties

##### kSURFACEROUGHNESS
RMS surface roughness for optical surfaces.

**String key**: "SURFACEROUGHNESS"

**Units**: Typically specified in length units matching surface geometry

**Location**: G4MaterialPropertiesIndex.hh:74

##### kISOTHERMAL_COMPRESSIBILITY
Isothermal compressibility of the material.

**String key**: "ISOTHERMAL_COMPRESSIBILITY"

**Usage**: Used for Rayleigh scattering calculations

**Location**: G4MaterialPropertiesIndex.hh:75

##### kRS_SCALE_FACTOR
Rayleigh scattering scale factor.

**String key**: "RS_SCALE_FACTOR"

**Usage**: Scales Rayleigh scattering probability

**Location**: G4MaterialPropertiesIndex.hh:76

#### Wavelength-Shifting Constants

##### kWLSMEANNUMBERPHOTONS
Mean number of photons emitted per WLS absorption.

**String key**: "WLSMEANNUMBERPHOTONS"

**Usage**: Quantum efficiency of primary WLS process

**Location**: G4MaterialPropertiesIndex.hh:77

##### kWLSTIMECONSTANT
Time delay between WLS absorption and re-emission.

**String key**: "WLSTIMECONSTANT"

**Units**: Time units (typically ns)

**Location**: G4MaterialPropertiesIndex.hh:78

##### kWLSMEANNUMBERPHOTONS2
Mean number of photons for secondary WLS component.

**String key**: "WLSMEANNUMBERPHOTONS2"

**Location**: G4MaterialPropertiesIndex.hh:79

##### kWLSTIMECONSTANT2
Time constant for secondary WLS component.

**String key**: "WLSTIMECONSTANT2"

**Location**: G4MaterialPropertiesIndex.hh:80

#### Mie Scattering Constants

##### kMIEHG_FORWARD
Forward scattering angle for Mie scattering (Henyey-Greenstein model).

**String key**: "MIEHG_FORWARD"

**Range**: -1.0 (backward) to 1.0 (forward)

**Location**: G4MaterialPropertiesIndex.hh:81

##### kMIEHG_BACKWARD
Backward scattering angle for Mie scattering (Henyey-Greenstein model).

**String key**: "MIEHG_BACKWARD"

**Location**: G4MaterialPropertiesIndex.hh:82

##### kMIEHG_FORWARD_RATIO
Ratio of forward to total Mie scattering.

**String key**: "MIEHG_FORWARD_RATIO"

**Range**: 0.0 to 1.0

**Location**: G4MaterialPropertiesIndex.hh:83

#### Scintillation Constants

##### kSCINTILLATIONYIELD
Total scintillation light yield (photons per energy deposited).

**String key**: "SCINTILLATIONYIELD"

**Units**: Typically photons/MeV or photons/keV

**Location**: G4MaterialPropertiesIndex.hh:84

##### kRESOLUTIONSCALE
Resolution scale factor for scintillation statistics.

**String key**: "RESOLUTIONSCALE"

**Usage**: Broadens energy resolution beyond Poisson statistics

**Location**: G4MaterialPropertiesIndex.hh:85

##### kSCINTILLATIONTIMECONSTANT1
Decay time constant for first scintillation component.

**String key**: "SCINTILLATIONTIMECONSTANT1"

**Units**: Time units (typically ns)

**Location**: G4MaterialPropertiesIndex.hh:104

##### kSCINTILLATIONTIMECONSTANT2
Decay time constant for second scintillation component.

**String key**: "SCINTILLATIONTIMECONSTANT2"

**Location**: G4MaterialPropertiesIndex.hh:105

##### kSCINTILLATIONTIMECONSTANT3
Decay time constant for third scintillation component.

**String key**: "SCINTILLATIONTIMECONSTANT3"

**Location**: G4MaterialPropertiesIndex.hh:106

##### kSCINTILLATIONRISETIME1
Rise time for first scintillation component.

**String key**: "SCINTILLATIONRISETIME1"

**Location**: G4MaterialPropertiesIndex.hh:107

##### kSCINTILLATIONRISETIME2
Rise time for second scintillation component.

**String key**: "SCINTILLATIONRISETIME2"

**Location**: G4MaterialPropertiesIndex.hh:108

##### kSCINTILLATIONRISETIME3
Rise time for third scintillation component.

**String key**: "SCINTILLATIONRISETIME3"

**Location**: G4MaterialPropertiesIndex.hh:109

##### kSCINTILLATIONYIELD1
Relative yield for first scintillation component.

**String key**: "SCINTILLATIONYIELD1"

**Note**: The three yields should sum to 1.0

**Location**: G4MaterialPropertiesIndex.hh:110

##### kSCINTILLATIONYIELD2
Relative yield for second scintillation component.

**String key**: "SCINTILLATIONYIELD2"

**Location**: G4MaterialPropertiesIndex.hh:111

##### kSCINTILLATIONYIELD3
Relative yield for third scintillation component.

**String key**: "SCINTILLATIONYIELD3"

**Location**: G4MaterialPropertiesIndex.hh:112

##### Particle-Specific Scintillation Properties

For each particle type (proton, deuteron, triton, alpha, ion, electron), there are three yield constants (YIELD1, YIELD2, YIELD3) and three time constants (TIMECONSTANT1, TIMECONSTANT2, TIMECONSTANT3).

**String keys**: Follow pattern "[PARTICLE]SCINTILLATIONYIELD[1-3]" and "[PARTICLE]SCINTILLATIONTIMECONSTANT[1-3]"

**Location**: G4MaterialPropertiesIndex.hh:113-151

#### Ultra-Cold Neutron Properties

##### kFERMIPOT
Fermi potential for ultra-cold neutron interactions.

**String key**: "FERMIPOT"

**Units**: neV (nano-electron-volts)

**Location**: G4MaterialPropertiesIndex.hh:86

##### kDIFFUSION
Neutron diffusion coefficient.

**String key**: "DIFFUSION"

**Location**: G4MaterialPropertiesIndex.hh:87

##### kSPINFLIP
Spin flip probability for polarized neutrons.

**String key**: "SPINFLIP"

**Location**: G4MaterialPropertiesIndex.hh:88

##### kLOSS
Neutron loss probability per interaction.

**String key**: "LOSS"

**Location**: G4MaterialPropertiesIndex.hh:89

##### kLOSSCS
Neutron loss cross-section.

**String key**: "LOSSCS"

**Location**: G4MaterialPropertiesIndex.hh:90

##### kABSCS
1/v energy-dependent absorption cross-section for neutrons.

**String key**: "ABSCS"

**Location**: G4MaterialPropertiesIndex.hh:91

##### kSCATCS
Incoherent elastic scattering cross-section for neutrons.

**String key**: "SCATCS"

**Location**: G4MaterialPropertiesIndex.hh:92

#### Microroughness Parameters

Constants for detailed surface microroughness modeling (prefixed with MR_):

**Location**: G4MaterialPropertiesIndex.hh:93-103

- kMR_NBTHETA: Number of theta bins
- kMR_NBE: Number of energy bins
- kMR_RRMS: RMS roughness
- kMR_CORRLEN: Correlation length
- kMR_THETAMIN: Minimum theta value
- kMR_THETAMAX: Maximum theta value
- kMR_EMIN: Minimum energy value
- kMR_EMAX: Maximum energy value
- kMR_ANGNOTHETA: Number of theta angles in look-up table
- kMR_ANGNOPHI: Number of phi angles in look-up table
- kMR_ANGCUT: Angular cut

#### Coated Surface Constants

##### kCOATEDTHICKNESS
Thickness of thin coating layer.

**String key**: "COATEDTHICKNESS"

**Units**: Length units

**Location**: G4MaterialPropertiesIndex.hh:131

##### kCOATEDFRUSTRATEDTRANSMISSION
Flag for frustrated transmission vs total reflection.

**String key**: "COATEDFRUSTRATEDTRANSMISSION"

**Values**: 0 (total reflection) or 1 (frustrated transmission) for angles above critical angle

**Location**: G4MaterialPropertiesIndex.hh:132

## Usage Patterns

### Using Indices Directly

```cpp
// Access property using index
G4MaterialPropertyVector* rindex =
    materialProperties->GetProperty(kRINDEX);

// Check if constant property exists
if (materialProperties->ConstPropertyExists(kSCINTILLATIONYIELD)) {
    G4double yield = materialProperties->GetConstProperty(kSCINTILLATIONYIELD);
}
```

### Using String Keys

```cpp
// String keys are more readable but slightly less efficient
G4MaterialPropertyVector* absLength =
    materialProperties->GetProperty("ABSLENGTH");

G4double wlsTime =
    materialProperties->GetConstProperty("WLSTIMECONSTANT");
```

### Relationship to String Keys

The implementation in G4MaterialPropertiesTable.cc maps each enumeration value to its corresponding string key. The enumerations provide:
- Type safety
- Faster lookup (direct array indexing)
- Compile-time checking

String keys provide:
- Human readability
- Easier debugging
- Compatibility with text-based configuration files

## Thread Safety

The enumeration indices themselves are thread-safe as they are compile-time constants. However, access to the actual property values stored in G4MaterialPropertiesTable may require synchronization in multi-threaded applications.

## Version History

**Created**: 29-06-2017 by Soon Yung Jun

## See Also

- [G4MaterialPropertiesTable](./g4materialpropertiestable.md) - Uses these indices to store and retrieve properties
- [G4MaterialPropertyVector](./g4materialpropertyvector.md) - Stores energy-dependent property values
- [G4Material](./g4material.md) - Attaches properties tables to materials
- [G4OpticalSurface](../geometry/api/g4opticalsurface.md) - Uses surface properties
- [G4Scintillation](../processes/api/g4scintillation.md) - Uses scintillation properties
