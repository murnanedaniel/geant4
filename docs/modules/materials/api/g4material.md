# G4Material

**File**: `source/materials/include/G4Material.hh`

## Overview

G4Material is the top-level class in Geant4's material system, used to define the material composition of volumes in simulations. A material is always composed of G4Elements and includes properties such as density, state, temperature, and pressure. Materials can be created from single elements, combinations of elements/materials, or retrieved from Geant4's internal material database.

## Class Description

G4Material defines the physical and chemical properties of matter used in detector geometries. It supports:

- **Simple materials**: Created from a single element
- **Composite materials**: Built from multiple elements or other materials
- **Derived materials**: Based on existing materials with modified density
- **Database materials**: Retrieved from NIST database via G4NistManager

## Enumerations

### G4State

```cpp
enum G4State {
  kStateUndefined = 0,
  kStateSolid,
  kStateLiquid,
  kStateGas
};
```

Defines the physical state of the material.

**Location**: G4Material.hh:106-112 [💻](https://github.com/Geant4/geant4/blob/master/source/materials/include/G4Material.hh#L106-L112)

**Note**: The vacuum state was removed in version 28-05-98; vacuum is now treated as a gas with very low density.

## Constants

### NTP_Temperature

```cpp
static const G4double NTP_Temperature = 293.15 * CLHEP::kelvin;
```

Normal Temperature and Pressure (NTP) temperature constant.

**Value**: 293.15 K (20°C) [📖](https://www.engineeringtoolbox.com/stp-standard-ntp-normal-air-d_772.html)

**Location**: G4Material.hh:114 [💻](https://github.com/Geant4/geant4/blob/master/source/materials/include/G4Material.hh#L114)

## Type Definitions

```cpp
using G4MaterialTable = std::vector<G4Material*>;
```

Table of material pointers maintained as a static class member.

**Location**: G4MaterialTable.hh:33

## Constructors & Destructor

### Constructor (Single Element)

```cpp
G4Material(const G4String& name,
           G4double z,
           G4double a,
           G4double density,
           G4State state = kStateUndefined,
           G4double temp = NTP_Temperature,
           G4double pressure = CLHEP::STP_Pressure);
```

Creates a material from a single element.

**Parameters**:
- `name`: Material name
- `z`: Atomic number
- `a`: Mass of mole
- `density`: Density in Geant4 units
- `state`: Material state (solid/liquid/gas)
- `temp`: Temperature (default: 293.15 K)
- `pressure`: Pressure (default: STP)

**Location**: G4Material.hh:120-126

### Constructor (Composite Material)

```cpp
G4Material(const G4String& name,
           G4double density,
           G4int nComponents,
           G4State state = kStateUndefined,
           G4double temp = NTP_Temperature,
           G4double pressure = CLHEP::STP_Pressure);
```

Creates a composite material from elements/materials to be added later.

**Parameters**:
- `name`: Material name
- `density`: Density
- `nComponents`: Number of components to be added
- `state`: Material state
- `temp`: Temperature
- `pressure`: Pressure

**Location**: G4Material.hh:129-135

**Usage**: Must call AddElement() or AddMaterial() to add components after construction.

### Constructor (From Base Material)

```cpp
G4Material(const G4String& name,
           G4double density,
           const G4Material* baseMaterial,
           G4State state = kStateUndefined,
           G4double temp = NTP_Temperature,
           G4double pressure = CLHEP::STP_Pressure);
```

Creates a material derived from a base material with different density.

**Parameters**:
- `name`: New material name
- `density`: New density
- `baseMaterial`: Pointer to base material
- `state`: Material state
- `temp`: Temperature
- `pressure`: Pressure

**Location**: G4Material.hh:138-143

**Usage**: Useful for creating materials with same composition but different density.

### Destructor

```cpp
virtual ~G4Material();
```

Destroys the material object.

**Location**: G4Material.hh:145

**Note**: Strongly recommended not to delete materials in user code. All materials are automatically deleted at end of Geant4 session.

### Deleted Copy Operations

```cpp
G4Material(const G4Material&) = delete;
const G4Material& operator=(const G4Material&) = delete;
```

Copy construction and assignment are explicitly disabled.

**Location**: G4Material.hh:155-156

## Building Composite Materials

### AddElement (by number of atoms)

```cpp
void AddElementByNumberOfAtoms(const G4Element* elm, G4int nAtoms);
void AddElement(G4Element* elm, G4int nAtoms);
```

Adds an element to the material, specifying number of atoms.

**Parameters**:
- `elm`: Pointer to the element
- `nAtoms`: Number of atoms of this element

**Location**: G4Material.hh:159-160

**Usage**: For chemical formulas (e.g., H2O has 2 H atoms, 1 O atom).

### AddElement (by mass fraction)

```cpp
void AddElementByMassFraction(const G4Element* elm, G4double fraction);
void AddElement(G4Element* elm, G4double frac);
```

Adds an element to the material, specifying mass fraction.

**Parameters**:
- `elm`: Pointer to the element
- `fraction`: Fractional mass (must sum to 1.0)

**Location**: G4Material.hh:163-164

**Usage**: For mixtures where composition is known by mass percentage.

### AddMaterial

```cpp
void AddMaterial(G4Material* material, G4double fraction);
```

Adds another material to this material, specifying mass fraction.

**Parameters**:
- `material`: Pointer to the material to add
- `fraction`: Fractional mass

**Location**: G4Material.hh:166

**Added**: Version 12-06-98

## Ionisation Customization Methods

### SetChemicalFormula

```cpp
void SetChemicalFormula(const G4String& chF);
```

Sets the chemical formula string for the material.

**Parameters**:
- `chF`: Chemical formula (e.g., "H2O", "CO2")

**Location**: G4Material.hh:151

**Added**: Version 31-10-01

### SetFreeElectronDensity

```cpp
void SetFreeElectronDensity(G4double val);
```

Sets the free electron density for conductors.

**Parameters**:
- `val`: Free electron density

**Location**: G4Material.hh:152

**Note**: Free electron density above zero indicates the material is a conductor.

### ComputeDensityEffectOnFly

```cpp
void ComputeDensityEffectOnFly(G4bool val);
```

Enables/disables on-the-fly computation of density effect correction.

**Parameters**:
- `val`: True to compute on-the-fly, false to use parameterization

**Location**: G4Material.hh:153

**Note**: On-the-fly computation may be more accurate but requires extra computation.

## Basic Property Accessors

### GetName

```cpp
const G4String& GetName() const;
```

Returns the material name.

**Location**: G4Material.hh:171

### GetChemicalFormula

```cpp
const G4String& GetChemicalFormula() const;
```

Returns the chemical formula if set.

**Location**: G4Material.hh:172

### GetFreeElectronDensity

```cpp
G4double GetFreeElectronDensity() const;
```

Returns the free electron density.

**Location**: G4Material.hh:173

### GetDensity

```cpp
G4double GetDensity() const;
```

Returns the material density.

**Location**: G4Material.hh:174

### GetState

```cpp
G4State GetState() const;
```

Returns the material state (solid/liquid/gas).

**Location**: G4Material.hh:175

### GetTemperature

```cpp
G4double GetTemperature() const;
```

Returns the temperature.

**Location**: G4Material.hh:176

### GetPressure

```cpp
G4double GetPressure() const;
```

Returns the pressure.

**Location**: G4Material.hh:177

## Element Composition Accessors

### GetNumberOfElements

```cpp
std::size_t GetNumberOfElements() const;
```

Returns the number of elements constituting this material.

**Location**: G4Material.hh:180

### GetElementVector

```cpp
const G4ElementVector* GetElementVector() const;
```

Returns a vector of pointers to constituent elements.

**Location**: G4Material.hh:183

### GetFractionVector

```cpp
const G4double* GetFractionVector() const;
```

Returns a vector of fractional masses for each element.

**Location**: G4Material.hh:186

### GetAtomsVector

```cpp
const G4int* GetAtomsVector() const;
```

Returns a vector of atom counts for each element.

**Location**: G4Material.hh:189

**Note**: Returns nullptr if material was built using mass fractions.

### GetElement

```cpp
const G4Element* GetElement(G4int iel) const;
```

Returns a pointer to a specific element by index.

**Parameters**:
- `iel`: Element index

**Location**: G4Material.hh:192

## Atomic Density Accessors

### GetVecNbOfAtomsPerVolume

```cpp
const G4double* GetVecNbOfAtomsPerVolume() const;
```

Returns a vector of number of atoms per volume for each element.

**Location**: G4Material.hh:195

### GetTotNbOfAtomsPerVolume

```cpp
G4double GetTotNbOfAtomsPerVolume() const;
```

Returns the total number of atoms per volume.

**Location**: G4Material.hh:197

### GetTotNbOfElectPerVolume

```cpp
G4double GetTotNbOfElectPerVolume() const;
```

Returns the total number of electrons per volume.

**Location**: G4Material.hh:199

### Obsolete Names

```cpp
const G4double* GetAtomicNumDensityVector() const;
G4double GetElectronDensity() const;
```

Obsolete names for backwards compatibility (from version 5-10-98).

**Location**: G4Material.hh:202-203

## Physics Property Accessors

### GetRadlen

```cpp
G4double GetRadlen() const;
```

Returns the radiation length.

**Location**: G4Material.hh:206

### GetNuclearInterLength

```cpp
G4double GetNuclearInterLength() const;
```

Returns the nuclear interaction length.

**Location**: G4Material.hh:209

### GetIonisation

```cpp
G4IonisParamMat* GetIonisation() const;
```

Returns a pointer to the ionisation parameters.

**Location**: G4Material.hh:212

### GetSandiaTable

```cpp
G4SandiaTable* GetSandiaTable() const;
```

Returns a pointer to the Sandia table for photoabsorption coefficients.

**Location**: G4Material.hh:215

### GetBaseMaterial

```cpp
const G4Material* GetBaseMaterial() const;
```

Returns the base material if this material was derived from one.

**Location**: G4Material.hh:218

### GetMatComponents

```cpp
const std::map<G4Material*, G4double>& GetMatComponents() const;
```

Returns the map of material components (for materials built via AddMaterial).

**Location**: G4Material.hh:221

**Added**: Version 13-04-12

### GetMassOfMolecule

```cpp
G4double GetMassOfMolecule() const;
```

Returns the mass of a molecule for chemical compounds.

**Location**: G4Material.hh:224

**Added**: Version 21-04-12

## Simple Material Methods

### GetZ

```cpp
G4double GetZ() const;
```

Returns the atomic number (meaningful only for single-element materials).

**Location**: G4Material.hh:227

### GetA

```cpp
G4double GetA() const;
```

Returns the mass of a mole (meaningful only for single-element materials).

**Location**: G4Material.hh:228

## Material Properties Table

### SetMaterialPropertiesTable

```cpp
void SetMaterialPropertiesTable(G4MaterialPropertiesTable* anMPT);
```

Attaches a material properties table (for optical properties).

**Parameters**:
- `anMPT`: Pointer to the properties table

**Location**: G4Material.hh:231

### GetMaterialPropertiesTable

```cpp
G4MaterialPropertiesTable* GetMaterialPropertiesTable() const;
```

Returns the attached material properties table.

**Location**: G4Material.hh:233-236

## Static Methods

### GetIndex

```cpp
std::size_t GetIndex() const;
```

Returns the index of this material in the global material table.

**Location**: G4Material.hh:239

### GetMaterialTable

```cpp
static G4MaterialTable* GetMaterialTable();
```

Returns the static table of all defined materials.

**Location**: G4Material.hh:242

### GetNumberOfMaterials

```cpp
static std::size_t GetNumberOfMaterials();
```

Returns the total number of materials currently defined.

**Location**: G4Material.hh:244

### GetMaterial (by name)

```cpp
static G4Material* GetMaterial(const G4String& name, G4bool warning = true);
```

Returns a pointer to a material given its name.

**Parameters**:
- `name`: Material name
- `warning`: Print warning if not found (default: true)

**Location**: G4Material.hh:247

### GetMaterial (by properties - simple)

```cpp
static G4Material* GetMaterial(G4double z, G4double a, G4double dens);
```

Returns a pointer to a simple material by its properties.

**Location**: G4Material.hh:250

### GetMaterial (by properties - composite)

```cpp
static G4Material* GetMaterial(std::size_t nComp, G4double dens);
```

Returns a pointer to a composite material by its properties.

**Location**: G4Material.hh:253

## Mutator Methods

### SetName

```cpp
void SetName(const G4String& name);
```

Sets or changes the material name.

**Location**: G4Material.hh:260

## Virtual Methods

### IsExtended

```cpp
virtual G4bool IsExtended() const;
```

Returns whether this is an extended material (G4ExtendedMaterial).

**Returns**: False for base G4Material, true for G4ExtendedMaterial

**Location**: G4Material.hh:262

## Operators

### Deleted Comparison Operators

```cpp
G4bool operator==(const G4Material&) const = delete;
G4bool operator!=(const G4Material&) const = delete;
```

Comparison operators are explicitly disabled.

**Location**: G4Material.hh:265-266

### Stream Output Operators

```cpp
friend std::ostream& operator<<(std::ostream&, const G4Material*);
friend std::ostream& operator<<(std::ostream&, const G4Material&);
friend std::ostream& operator<<(std::ostream&, const G4MaterialTable&);
```

Enables printing of materials and material tables to output streams.

**Location**: G4Material.hh:256-258

## Data Members

### Base Material Reference

```cpp
const G4Material* fBaseMaterial;                    // Pointer to base material
G4MaterialPropertiesTable* fMaterialPropertiesTable; // Optical properties
```

**Location**: G4Material.hh:287-288

### Composition Data

```cpp
G4ElementVector* theElementVector;       // Vector of constituent G4Elements
G4int* fAtomsVector;                     // Composition by atom count
G4double* fMassFractionVector;           // Composition by fractional mass
G4double* fVecNbOfAtomsPerVolume;        // Number of atoms per volume
```

**Location**: G4Material.hh:295-298

### Physics Tables

```cpp
G4IonisParamMat* fIonisation;            // Ionisation parameters
G4SandiaTable* fSandiaTable;             // Sandia table
```

**Location**: G4Material.hh:300-301

### Basic Properties

```cpp
G4double fDensity;                       // Material density
G4double fFreeElecDensity;               // Free electron density
G4double fTemp;                          // Temperature (defaults: STP)
G4double fPressure;                      // Pressure (defaults: STP)
```

**Location**: G4Material.hh:303-306

### Derived Quantities

```cpp
G4double fTotNbOfAtomsPerVolume;         // Total nb of atoms per volume
G4double fTotNbOfElectPerVolume;         // Total nb of electrons per volume
G4double fRadlen;                        // Radiation length
G4double fNuclInterLen;                  // Nuclear interaction length
G4double fMassOfMolecule;                // For materials built by atoms count
```

**Location**: G4Material.hh:308-312

### State and Index

```cpp
G4State fState;                          // Material state
std::size_t fIndexInTable;               // Index in the material table
G4int fNumberOfElements;                 // Number of G4Elements in material
```

**Location**: G4Material.hh:314-316

### Construction Members

```cpp
G4int fNbComponents;                     // Number of components
G4int fIdxComponent;                     // Index of a new component
G4bool fMassFraction;                    // Flag of method to add components
```

**Location**: G4Material.hh:319-321

### Temporary Construction Data

```cpp
std::vector<G4int>* fAtoms = nullptr;
std::vector<G4double>* fElmFrac = nullptr;
std::vector<const G4Element*>* fElm = nullptr;
```

**Location**: G4Material.hh:324-326

### Material Composition Map

```cpp
std::map<G4Material*, G4double> fMatComponents;
```

For materials built via AddMaterial().

**Location**: G4Material.hh:329

### Names

```cpp
G4String fName;                          // Material name
G4String fChemicalFormula;               // Material chemical formula
```

**Location**: G4Material.hh:331-332

## Private Methods

```cpp
void InitializePointers();
void ComputeDerivedQuantities();
void ComputeRadiationLength();
void ComputeNuclearInterLength();
void CopyPointersOfBaseMaterial();
void FillVectors();
G4bool IsLocked();
```

**Location**: G4Material.hh:269-285

## Usage Examples

### Simple Material from Single Element

```cpp
// Create water from elements
G4Element* H = new G4Element("Hydrogen", "H", 1., 1.01*g/mole);
G4Element* O = new G4Element("Oxygen", "O", 8., 16.00*g/mole);

G4Material* water = new G4Material("Water", 1.0*g/cm3, 2);
water->AddElement(H, 2);
water->AddElement(O, 1);
```

### Material from Single Element (Direct)

```cpp
// Create aluminum directly
G4Material* Al = new G4Material("Aluminum", 13., 26.98*g/mole, 2.7*g/cm3);
```

### Material with Temperature and Pressure

```cpp
// Create liquid argon
G4Material* LAr = new G4Material("LiquidArgon",
                                  18., 39.95*g/mole, 1.390*g/cm3,
                                  kStateLiquid, 87.*kelvin, 1.*atmosphere);
```

### Material by Mass Fraction

```cpp
// Create air (simplified)
G4Material* air = new G4Material("Air", 1.290*mg/cm3, 2, kStateGas);
air->AddElement(N, 0.7);
air->AddElement(O, 0.3);
```

### Derived Material

```cpp
// Create high-density water
G4Material* water = G4Material::GetMaterial("Water");
G4Material* heavyWater = new G4Material("HeavyWater", 1.1*g/cm3, water);
```

### Material with Chemical Formula

```cpp
G4Material* CO2 = new G4Material("CarbonDioxide", 1.977*mg/cm3, 2, kStateGas);
CO2->AddElement(C, 1);
CO2->AddElement(O, 2);
CO2->SetChemicalFormula("CO2");
```

## Version History

Key changes from header comments (G4Material.hh:57-87):

- **21-04-12**: Added fMassOfMolecule
- **13-04-12**: Added std::map<G4Material*,G4double> fMatComponents
- **15-11-05**: Added GetMaterial(materialName, G4bool warning=true)
- **06-08-02**: Removed constructors with ChemicalFormula
- **26-02-02**: Renewed fIndexInTable
- **31-10-01**: Added SetChemicalFormula() function
- **14-09-01**: Suppression of fIndexInTable data member
- **17-07-01**: Migration to STL
- **30-03-01**: Suppression of warning message in GetMaterial
- **12-03-01**: Added G4bool fImplicitElement
- **19-07-99**: Added chemicalFormula data member
- **18-11-98**: Modified SandiaTable interface
- **12-06-98**: Added AddMaterial() method for mixture of materials
- **09-07-98**: Removed Ionisation parameters from class
- **04-08-98**: Added GetMaterial(materialName) method
- **05-10-98**: Changed name NumDensity to NbOfAtomsPerVolume
- **28-05-98**: Removed kState=kVacuum (vacuum is now ordinary gas with low density)
- **24-02-98**: Renamed fFractionVector to fMassFractionVector
- **27-06-97**: Added GetElement(int) function
- **10-06-97**: Added fSandiaPhotoAbsCof data member
- **20-03-97**: Corrected initialization of pointers
- **29-01-97**: State=Vacuum automatically sets density=0
- **20-01-97**: Aesthetic rearrangement
- **12-12-96**: New data members added by L.Urban
- **10-07-96**: New data members added by L.Urban

## See Also

- [G4Element](./g4element.md) - Materials are composed of elements
- [G4Isotope](./g4isotope.md) - Elements are composed of isotopes
- [G4IonisParamMat](./g4ionisparammat.md) - Ionisation parameters for materials
- [G4SandiaTable](./g4sandiatable.md) - Photoabsorption coefficients
- [G4MaterialPropertiesTable](./g4materialpropertiestable.md) - Optical and other properties
- [G4NistManager](./g4nistmanager.md) - Access to NIST material database
- [G4MaterialTable](./g4materialtable.md) - Type definition for material tables
