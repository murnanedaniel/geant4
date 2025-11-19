# Materials Module

**Location**: `source/materials/`

## Overview

The materials module is one of the fundamental components of Geant4, providing classes and infrastructure for defining materials, elements, and isotopes used in detector simulations. This module handles the composition and physical properties of matter that particles interact with during simulation.

## Module Statistics

- **Header Files**: 44 files in `include/`
- **Source Files**: 30 files in `src/`
- **Total Lines**: ~9,500 lines of header code
- **Core Classes**: 3 (G4Isotope, G4Element, G4Material)
- **Support Classes**: 40+

## Architecture

The materials module follows a hierarchical structure that mirrors the physical composition of matter:

```
G4Isotope (nuclear properties)
    ↓
G4Element (chemical elements, composed of isotopes)
    ↓
G4Material (materials, composed of elements)
```

### Design Principles

1. **Hierarchical Composition**: Isotopes → Elements → Materials
2. **Global Registries**: Static tables maintain all defined instances
3. **Lazy Evaluation**: Derived quantities computed on demand
4. **Database Integration**: NIST database provides standard definitions
5. **Extensibility**: Virtual methods allow specialized material types

## Core Classes

### Foundation: Isotope-Element-Material Hierarchy

#### [G4Isotope](./api/g4isotope.md)
Represents a specific nuclear isotope defined by Z (atomic number), N (nucleon number), A (atomic mass), and optional isomer level.

**Key Features**:
- Fundamental building block
- Optional mass (defaults to database)
- Isomer state support
- Global isotope table

**File**: `G4Isotope.hh`

#### [G4Element](./api/g4element.md)
Represents a chemical element, either as a simple element (single Z/A) or as a collection of isotopes with natural or custom abundances.

**Key Features**:
- Two construction modes (direct or from isotopes)
- Atomic shell data
- Derived physics quantities (Coulomb factor, radiation length factor)
- Ionisation parameters

**File**: `G4Element.hh`

####[G4Material](./api/g4material.md)
Represents a material used in volume definitions, composed of elements with specified density, state, temperature, and pressure.

**Key Features**:
- Three construction modes (single element, composite, derived)
- Physical state support (solid/liquid/gas)
- Temperature and pressure dependent
- Computed radiation and interaction lengths
- Optional properties table for optical simulation

**File**: `G4Material.hh`

## Support Classes

### Ionisation Parameters

#### [G4IonisParamElm](./api/g4ionisparamelm.md)
Stores ionisation-related physics parameters for elements (mean excitation energy, shell corrections, Fermi velocity).

**File**: `G4IonisParamElm.hh`

#### G4IonisParamMat
Stores ionisation-related physics parameters for materials (density effect, fluctuation model, Birks constant).

**File**: `G4IonisParamMat.hh`

### NIST Database

#### G4NistManager
Singleton manager providing access to NIST database of elements and materials. Primary interface for retrieving standard materials.

**File**: `G4NistManager.hh`

#### G4NistElementBuilder
Builds elements from NIST database with natural isotope compositions.

**File**: `G4NistElementBuilder.hh`

#### G4NistMaterialBuilder
Builds standard materials from NIST database (compounds, mixtures, biomedical materials, space materials).

**File**: `G4NistMaterialBuilder.hh`

#### G4NistMessenger
UI messenger for NIST database commands.

**File**: `G4NistMessenger.hh`

### Material Properties

#### G4MaterialPropertiesTable
Hash table storing energy-dependent and constant material properties, primarily for optical photon simulation.

**File**: `G4MaterialPropertiesTable.hh`

#### G4MaterialPropertyVector
Vector of property values as function of photon energy.

**File**: `G4MaterialPropertyVector.hh`

#### G4MaterialPropertiesIndex
Enum definitions for property indices.

**File**: `G4MaterialPropertiesIndex.hh`

### Optical Surfaces

#### G4SurfaceProperty
Abstract base class for surface properties.

**File**: `G4SurfaceProperty.hh`

#### G4OpticalSurface
Defines optical properties of surfaces between materials.

**File**: `G4OpticalSurface.hh`

#### G4OpticalMaterialProperties
Namespace with predefined optical material properties.

**File**: `G4OpticalMaterialProperties.hh`

### Physics Tables

#### G4SandiaTable
Provides photoabsorption coefficients (Sandia coefficients) for elements and materials.

**File**: `G4SandiaTable.hh`

#### G4AtomicShells
Atomic shell binding energies and electron counts.

**File**: `G4AtomicShells.hh`, `G4AtomicShells_XDB_EADL.hh`

### Stopping Power Data

#### G4IonStoppingData
Base class for ion stopping power data.

**File**: `G4IonStoppingData.hh`

#### G4ICRU90StoppingData
Stopping power data from ICRU Report 90.

**File**: `G4ICRU90StoppingData.hh`

#### G4VIonDEDXTable
Virtual interface for ion dE/dx tables.

**File**: `G4VIonDEDXTable.hh`

#### G4ExtDEDXTable
Extended dE/dx table implementation.

**File**: `G4ExtDEDXTable.hh`

### Density Effect

#### G4DensityEffectCalculator
Calculates density effect correction for ionisation.

**File**: `G4DensityEffectCalculator.hh`

#### G4DensityEffectData
Static database of density effect parameters.

**File**: `G4DensityEffectData.hh`

### Extended Materials

#### G4ExtendedMaterial
Extended material class supporting additional properties via extensions.

**File**: `G4ExtendedMaterial.hh`

#### G4VMaterialExtension
Abstract base class for material extensions.

**File**: `G4VMaterialExtension.hh`

### Crystal/Lattice Properties

#### G4CrystalExtension
Extension for crystalline materials.

**File**: `G4CrystalExtension.hh`

#### G4CrystalUnitCell
Represents crystallographic unit cell.

**File**: `G4CrystalUnitCell.hh`

#### G4CrystalAtomBase
Base class for atoms in crystal structures.

**File**: `G4CrystalAtomBase.hh`

#### G4LatticeLogical
Logical lattice properties.

**File**: `G4LatticeLogical.hh`

#### G4LatticePhysical
Physical lattice instance.

**File**: `G4LatticePhysical.hh`

#### G4AtomicBond
Represents atomic bonds in crystals.

**File**: `G4AtomicBond.hh`

#### G4AtomicFormFactor
Atomic form factors for X-ray scattering.

**File**: `G4AtomicFormFactor.hh`

### Ultra-Cold Neutron (UCN) Properties

#### G4UCNMaterialPropertiesTable
Properties table specific to ultra-cold neutrons.

**File**: `G4UCNMaterialPropertiesTable.hh`

#### G4UCNMicroRoughnessHelper
Helper for UCN micro-roughness calculations.

**File**: `G4UCNMicroRoughnessHelper.hh`

### Microelectronics Materials

#### G4MicroElecMaterialStructure
Material structure for microelectronics simulations.

**File**: `G4MicroElecMaterialStructure.hh`

#### G4MicroElecSiStructure
Silicon structure for microelectronics.

**File**: `G4MicroElecSiStructure.hh`

### Element Data Registry

#### G4ElementData
Base class for element-specific data.

**File**: `G4ElementData.hh`

#### G4ElementDataRegistry
Registry for managing element data sets.

**File**: `G4ElementDataRegistry.hh`

### Static Data

#### G4StaticSandiaData
Static Sandia table data.

**File**: `G4StaticSandiaData.hh`

## Type Definitions

The module provides several vector and table type definitions:

```cpp
using G4IsotopeTable = std::vector<G4Isotope*>;
using G4IsotopeVector = std::vector<G4Isotope*>;
using G4ElementTable = std::vector<G4Element*>;
using G4ElementVector = std::vector<const G4Element*>;
using G4MaterialTable = std::vector<G4Material*>;
```

**Files**: `G4IsotopeVector.hh`, `G4ElementTable.hh`, `G4ElementVector.hh`, `G4MaterialTable.hh`

## Usage Patterns

### Basic Material Definition

```cpp
// Create elements
G4Element* H = new G4Element("Hydrogen", "H", 1., 1.01*g/mole);
G4Element* O = new G4Element("Oxygen", "O", 8., 16.00*g/mole);

// Create material from elements
G4Material* water = new G4Material("Water", 1.0*g/cm3, 2);
water->AddElement(H, 2);
water->AddElement(O, 1);
```

### Using NIST Database

```cpp
// Get NIST manager instance
G4NistManager* nist = G4NistManager::Instance();

// Find or build standard materials
G4Material* air = nist->FindOrBuildMaterial("G4_AIR");
G4Material* lead = nist->FindOrBuildMaterial("G4_Pb");

// Build element from NIST
G4Element* Si = nist->FindOrBuildElement("Si");
```

### Materials with Isotopes

```cpp
// Create isotopes
G4Isotope* U235 = new G4Isotope("U235", 92, 235);
G4Isotope* U238 = new G4Isotope("U238", 92, 238);

// Create element from isotopes
G4Element* enrichedU = new G4Element("EnrichedUranium", "U", 2);
enrichedU->AddIsotope(U235, 0.05);  // 5% abundance
enrichedU->AddIsotope(U238, 0.95);  // 95% abundance

// Use in material
G4Material* UO2 = new G4Material("EnrichedUraniumDioxide", 10.97*g/cm3, 2);
UO2->AddElement(enrichedU, 1);
UO2->AddElement(O, 2);
```

### Materials with State

```cpp
// Liquid argon
G4Material* LAr = new G4Material("LiquidArgon",
                                  18., 39.95*g/mole, 1.390*g/cm3,
                                  kStateLiquid, 87.*kelvin, 1.*atmosphere);

// Gaseous argon
G4Material* GAr = new G4Material("GaseousArgon",
                                  18., 39.95*g/mole, 1.66*mg/cm3,
                                  kStateGas, 293.*kelvin, 1.*atmosphere);
```

## Key Concepts

### Material Composition

Materials can be defined by:
1. **Atom Count**: Specifies number of atoms of each element (e.g., H2O)
2. **Mass Fraction**: Specifies fractional mass of each component (e.g., air)

### Derived Quantities

Many quantities are automatically computed:
- **Radiation Length**: Distance over which electron energy reduces by factor 1/e due to radiation
- **Nuclear Interaction Length**: Mean free path for nuclear interactions
- **dE/dx Parameters**: Energy loss rate for charged particles
- **Density Effect**: Correction to ionisation at high energies

### Database Integration

The NIST database (via G4NistManager) provides:
- 98 elements with natural isotopic composition
- 300+ predefined materials
- Validated physical properties
- Standard naming conventions (G4_MATERIAL_NAME)

## Build Configuration

**CMakeLists.txt**: `source/materials/CMakeLists.txt`

The materials module is a required dependency for virtually all Geant4 applications.

## Historical Development

The materials system has evolved significantly:
- **1996-1997**: Initial implementation with basic element and material classes
- **1998**: Migration to STL, addition of isotope support
- **2004**: Integration of NIST database (G4NistManager)
- **2006-2007**: Natural abundance support, enhanced NIST interface
- **2010s**: Extended materials, crystal properties, microelectronics support
- **2016**: Exact density effect calculation
- **2019**: ICRU90 stopping data integration

## References

### Official Documentation
- [Geant4 User's Guide for Application Developers: Materials](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/) [📖](https://geant4.web.cern.ch/docs/)
- [Geant4 Physics Reference Manual](https://geant4-userdoc.web.cern.ch/UsersGuides/PhysicsReferenceManual/html/) [📖](https://geant4.web.cern.ch/docs/)

### External Databases
- [NIST Atomic Weights and Isotopic Compositions](https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses) [🔗](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl) - Official NIST database for atomic weights and isotope abundances
- [ICRU Report 37](https://www.icru.org/report/stopping-powers-for-electrons-and-positrons-report-37/) - Stopping Powers for Electrons and Positrons
- [ICRU Report 90](https://www.icru.org/report/key-data-for-ionizing-radiation-dosimetry-measurement-standards-and-applications-report-90/) - Key Data for Ionizing-Radiation Dosimetry

### Scientific Background
- Bethe-Bloch Formula for ionization energy loss
- Sternheimer density effect parameterization
- Photo-absorption cross sections (Sandia tables)

## See Also

- [Geometry Module](../geometry/) - Uses materials in volume definitions
- [Processes Module](../processes/) - Uses material properties in physics calculations
- [Particles Module](../particles/) - Defines particles that interact with materials

## Module Files

**Directory Structure**:
```
source/materials/
├── CMakeLists.txt          # Build configuration
├── History                 # Detailed change history
├── sources.cmake           # Source file list
├── include/                # Header files (44 files)
│   ├── G4Isotope.hh
│   ├── G4Element.hh
│   ├── G4Material.hh
│   ├── G4NistManager.hh
│   └── ...
└── src/                    # Implementation files (30 files)
    ├── G4Isotope.cc
    ├── G4Element.cc
    ├── G4Material.cc
    ├── G4NistManager.cc
    └── ...
```

## Quick Reference

| Task | Class | Method |
|------|-------|--------|
| Create simple element | G4Element | `new G4Element(name, symbol, Z, A)` |
| Create element from isotopes | G4Element | `new G4Element(name, symbol, nIsotopes)` then `AddIsotope()` |
| Create simple material | G4Material | `new G4Material(name, Z, A, density)` |
| Create composite material | G4Material | `new G4Material(name, density, nComponents)` then `AddElement()` |
| Get NIST material | G4NistManager | `Instance()->FindOrBuildMaterial("G4_WATER")` |
| Get NIST element | G4NistManager | `Instance()->FindOrBuildElement(Z)` |
| Set chemical formula | G4Material | `SetChemicalFormula("H2O")` |
| Add optical properties | G4Material | `SetMaterialPropertiesTable(MPT)` |
| Get radiation length | G4Material | `GetRadlen()` |
| Get interaction length | G4Material | `GetNuclearInterLength()` |
