# G4OpBoundaryProcess

## Overview

`G4OpBoundaryProcess` is a discrete process that handles reflection, refraction, and transmission of optical photons at material boundaries. This is one of the most important and complex optical processes in Geant4, supporting multiple surface models and boundary interaction types.

::: tip Class Information
**Header:** `source/processes/optical/include/G4OpBoundaryProcess.hh`
**Source:** `source/processes/optical/src/G4OpBoundaryProcess.cc`
**Inherits:** `G4VDiscreteProcess`
**Process Type:** `fOptical`
**Process Subtype:** `fOpBoundary` (32)
:::

## Purpose

The boundary process simulates optical photon interactions at interfaces between materials, including:

- **Fresnel Reflection and Refraction** - Physics-based reflection/transmission using Snell's law
- **Total Internal Reflection (TIR)** - When incident angle exceeds critical angle
- **Surface Roughness** - Ground surfaces with multiple reflection types
- **Metallic Surfaces** - Complex refractive index for metal reflection
- **Dichroic Filters** - Wavelength-dependent transmission/reflection
- **Thin Coating Layers** - Interference effects in thin films
- **Detection** - Photon absorption with quantum efficiency

## Physics Models

### 1. Glisur Model (Original)

The original GEANT3.21 model using look-up tables.

**Applicability:** Legacy support, rarely used in new simulations.

### 2. Unified Model (Default)

Modern model supporting four reflection types based on surface finish:

**Reflection Types:**
1. **Specular Spike** - Perfect mirror reflection (probability Pss)
2. **Specular Lobe** - Reflection about average surface normal (probability Psl)
3. **Lambertian** - Diffuse cosine distribution (probability 1 - Pss - Psl - Pbs)
4. **Backscatter** - Direct backward reflection (probability Pbs)

**Implementation:** See `ChooseReflection()` method (lines 281-301 in G4OpBoundaryProcess.hh)

```cpp
inline void G4OpBoundaryProcess::ChooseReflection()
{
  G4double rand = G4UniformRand();
  if(rand < fProb_ss)
  {
    fStatus      = SpikeReflection;
    fFacetNormal = fGlobalNormal;
  }
  else if(rand < fProb_ss + fProb_sl)
  {
    fStatus = LobeReflection;
  }
  else if(rand < fProb_ss + fProb_sl + fProb_bs)
  {
    fStatus = BackScattering;
  }
  else
  {
    fStatus = LambertianReflection;
  }
}
```

### 3. LUT Model

Uses measured reflectance data from Look-Up Tables for realistic surface modeling.

**Method:** `DielectricLUT()` (line 164)

### 4. DAVIS LUT Model

Enhanced LUT model based on measurements from UC Davis/LBNL.

**Features:**
- More comprehensive measured data
- Better accuracy for detector surfaces
- Support for various reflector materials

**Method:** `DielectricLUTDAVIS()` (line 165)

## Boundary Status Enumeration

The process can return 37 different status values indicating the interaction outcome (lines 72-117):

### Core Status Values

```cpp
enum G4OpBoundaryProcessStatus
{
  Undefined,                      // Initial state
  Transmission,                   // Photon transmitted through boundary
  FresnelRefraction,             // Refracted according to Fresnel equations
  FresnelReflection,             // Reflected according to Fresnel equations
  TotalInternalReflection,       // TIR occurred
  LambertianReflection,          // Diffuse reflection
  LobeReflection,                // Specular lobe reflection
  SpikeReflection,               // Specular spike reflection
  BackScattering,                // Backscatter reflection
  Absorption,                    // Photon absorbed
  Detection,                     // Photon detected (absorbed with efficiency)
  NotAtBoundary,                 // Process called but not at boundary
  SameMaterial,                  // Same material on both sides
  StepTooSmall,                  // Step size too small
  NoRINDEX,                      // Missing refractive index
  // ... plus 22 material-specific statuses for LUT models
  Dichroic,                      // Dichroic filter interaction
  CoatedDielectricReflection,    // Reflection from coating
  CoatedDielectricRefraction,    // Refraction through coating
  CoatedDielectricFrustratedTransmission  // Frustrated TIR through coating
};
```

### Material-Specific Statuses (LUT Models)

For polished, etched, and ground surfaces with various materials:
- Lumirror (air/glue interfaces)
- Teflon
- TiO (Titanium Oxide)
- Tyvek
- VM2000
- General air reflections

**Examples:** `PolishedLumirrorAirReflection` (line 89), `EtchedTyvekAirReflection` (line 102)

## Class Interface

### Constructor

```cpp
explicit G4OpBoundaryProcess(const G4String& processName = "OpBoundary",
                             G4ProcessType type          = fOptical);
```

**Parameters:**
- `processName` - Process name (default: "OpBoundary")
- `type` - Process type (default: `fOptical`)

**Location:** Lines 122-123

### Key Public Methods

#### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aParticleType) override;
```

**Returns:** `true` only for `G4OpticalPhoton` (lines 270-274)

**Purpose:** Ensures process only acts on optical photons

#### GetMeanFreePath

```cpp
virtual G4double GetMeanFreePath(const G4Track&, G4double,
                                 G4ForceCondition* condition) override;
```

**Returns:** Infinity (process is forced at every step)

**Purpose:** Returns infinity but sets 'Forced' condition to invoke DoIt at every step. Action only taken at boundaries (lines 130-134)

#### PostStepDoIt

```cpp
G4VParticleChange* PostStepDoIt(const G4Track& aTrack,
                                const G4Step& aStep) override;
```

**Returns:** Particle change with new momentum, polarization, and energy deposition

**Purpose:** Main method implementing boundary interactions (lines 136-138)

#### GetStatus

```cpp
virtual G4OpBoundaryProcessStatus GetStatus() const;
```

**Returns:** Current boundary interaction status

**Purpose:** Allows users to query what happened to the photon (lines 140-141, 276-279)

**Usage Example:**
```cpp
// In user stepping action
if (step->GetPostStepPoint()->GetProcessDefinedStep()->GetProcessName() == "OpBoundary")
{
  G4OpBoundaryProcessStatus status = boundaryProcess->GetStatus();
  if (status == Detection) {
    // Photon was detected - record in hits collection
  }
}
```

#### SetInvokeSD

```cpp
virtual void SetInvokeSD(G4bool);
```

**Purpose:** Enable/disable automatic invocation of sensitive detector for detected photons (lines 143-144)

**Default:** Disabled

**Usage:**
```cpp
boundaryProcess->SetInvokeSD(true);  // Auto-call SD for Detection status
```

### Configuration Methods

#### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int);
```

**Purpose:** Control diagnostic output verbosity (line 150)

#### PreparePhysicsTable

```cpp
virtual void PreparePhysicsTable(const G4ParticleDefinition&) override;
```

**Purpose:** Prepare physics tables before run (line 146)

#### Initialise

```cpp
virtual void Initialise();
```

**Purpose:** Initialize process state (line 148)

## Private Implementation

### Surface Type Handlers

The process delegates to specialized methods based on surface type:

#### DielectricMetal

```cpp
void DielectricMetal();
```

**Purpose:** Handle dielectric-metal boundaries (line 161)

**Features:**
- Uses complex refractive index
- Computes reflectivity with real and imaginary components
- See `GetReflectivity()` method (lines 177-179)

#### DielectricDielectric

```cpp
void DielectricDielectric();
```

**Purpose:** Handle dielectric-dielectric boundaries (line 162)

**Features:**
- Fresnel equations for reflection/transmission
- Total internal reflection
- Surface roughness effects

#### DielectricDichroic

```cpp
void DielectricDichroic();
```

**Purpose:** Handle dichroic filter boundaries (line 167)

**Features:**
- Wavelength-dependent transmission
- Uses 2D physics vector for dichroic properties

#### CoatedDielectricDielectric

```cpp
void CoatedDielectricDielectric();
```

**Purpose:** Handle thin coating layers (line 168)

**Features:**
- Interference effects in thin films
- Frustrated total internal reflection
- See `GetReflectivityThroughThinLayer()` (lines 182-184)

### Reflection Handlers

#### DoAbsorption

```cpp
void DoAbsorption();
```

**Purpose:** Handle photon absorption and detection (lines 303-322)

**Implementation:**
```cpp
inline void G4OpBoundaryProcess::DoAbsorption()
{
  fStatus = Absorption;

  if(G4BooleanRand(fEfficiency))
  {
    // EnergyDeposited =/= 0 means: photon has been detected
    fStatus = Detection;
    aParticleChange.ProposeLocalEnergyDeposit(fPhotonMomentum);
  }
  else
  {
    aParticleChange.ProposeLocalEnergyDeposit(0.0);
  }

  fNewMomentum     = fOldMomentum;
  fNewPolarization = fOldPolarization;

  aParticleChange.ProposeTrackStatus(fStopAndKill);
}
```

**Key Points:**
- Sets status to `Detection` if efficiency check passes (line 310)
- Deposits photon energy when detected (line 311)
- Always kills the photon (line 321)

#### DoReflection

```cpp
void DoReflection();
```

**Purpose:** Compute reflected photon direction and polarization (lines 324-352)

**Implementation:**
```cpp
inline void G4OpBoundaryProcess::DoReflection()
{
  if(fStatus == LambertianReflection)
  {
    fNewMomentum = G4LambertianRand(fGlobalNormal);
    fFacetNormal = (fNewMomentum - fOldMomentum).unit();
  }
  else if(fFinish == ground)
  {
    fStatus = LobeReflection;
    if(!fRealRIndexMPV || !fImagRIndexMPV)
    {
      fFacetNormal = GetFacetNormal(fOldMomentum, fGlobalNormal);
    }
    fNewMomentum =
      fOldMomentum - (2. * fOldMomentum * fFacetNormal * fFacetNormal);
  }
  else
  {
    fStatus      = SpikeReflection;
    fFacetNormal = fGlobalNormal;
    fNewMomentum =
      fOldMomentum - (2. * fOldMomentum * fFacetNormal * fFacetNormal);
  }
  fNewPolarization =
    -fOldPolarization + (2. * fOldPolarization * fFacetNormal * fFacetNormal);
}
```

### Utility Methods

#### GetFacetNormal

```cpp
G4ThreeVector GetFacetNormal(const G4ThreeVector& Momentum,
                             const G4ThreeVector& Normal) const;
```

**Purpose:** Compute microfacet normal for rough surfaces (lines 158-159)

**Returns:** Normal vector of individual facet accounting for surface roughness

#### GetIncidentAngle

```cpp
G4double GetIncidentAngle();
```

**Purpose:** Calculate incident angle of optical photon (lines 174-175)

**Returns:** Angle between photon direction and surface normal

#### GetReflectivity

```cpp
G4double GetReflectivity(G4double E1_perp, G4double E1_parl,
                         G4double incidentangle, G4double RealRindex,
                         G4double ImaginaryRindex);
```

**Purpose:** Calculate reflectivity for metallic surfaces (lines 177-179)

**Parameters:**
- `E1_perp`, `E1_parl` - Perpendicular and parallel electric field components
- `incidentangle` - Incident angle
- `RealRindex`, `ImaginaryRindex` - Complex refractive index components

**Returns:** Reflectivity (0 to 1)

#### GetReflectivityThroughThinLayer

```cpp
G4double GetReflectivityThroughThinLayer(G4double sinTL, G4double E1_perp,
                                         G4double E1_parl, G4double wavelength,
                                         G4double cost1, G4double cost2);
```

**Purpose:** Calculate reflectivity for thin coating layers (lines 182-184)

**Returns:** Reflectivity including interference effects

#### InvokeSD

```cpp
G4bool InvokeSD(const G4Step* step);
```

**Purpose:** Invoke sensitive detector for detected photons (line 192)

**Returns:** `true` if SD was successfully invoked

## Member Variables

### Photon State

```cpp
G4ThreeVector fOldMomentum;      // Incident momentum direction (line 194)
G4ThreeVector fOldPolarization;  // Incident polarization (line 195)
G4ThreeVector fNewMomentum;      // Final momentum direction (line 197)
G4ThreeVector fNewPolarization;  // Final polarization (line 198)
```

### Geometry

```cpp
G4ThreeVector fGlobalNormal;     // Surface normal (line 200)
G4ThreeVector fFacetNormal;      // Microfacet normal (line 201)
```

### Materials and Surfaces

```cpp
const G4Material* fMaterial1;    // Pre-step material (line 203)
const G4Material* fMaterial2;    // Post-step material (line 204)
G4OpticalSurface* fOpticalSurface;  // Surface properties (line 206)
```

### Material Properties

```cpp
G4MaterialPropertyVector* fRealRIndexMPV;   // Real part of refractive index (line 208)
G4MaterialPropertyVector* fImagRIndexMPV;   // Imaginary part of refractive index (line 209)
G4Physics2DVector* fDichroicVector;         // Dichroic filter properties (line 210)
```

### Physics Parameters

```cpp
G4double fPhotonMomentum;       // Photon momentum (line 212)
G4double fRindex1;              // Refractive index material 1 (line 213)
G4double fRindex2;              // Refractive index material 2 (line 214)
G4double fSint1;                // sin(incident angle) (line 216)
G4double fReflectivity;         // Surface reflectivity (line 218)
G4double fEfficiency;           // Detection efficiency (line 219)
G4double fTransmittance;        // Surface transmittance (line 220)
G4double fSurfaceRoughness;     // Surface roughness parameter (line 221)
```

### Reflection Probabilities

```cpp
G4double fProb_sl;  // Specular lobe probability (line 223)
G4double fProb_ss;  // Specular spike probability (line 223)
G4double fProb_bs;  // Backscatter probability (line 223)
```

### Process State

```cpp
G4OpBoundaryProcessStatus fStatus;  // Current interaction status (line 229)
G4OpticalSurfaceModel fModel;       // Surface model being used (line 230)
G4OpticalSurfaceFinish fFinish;     // Surface finish type (line 231)
```

### Coated Surface Parameters

```cpp
G4double fCoatedRindex;     // Coating refractive index (line 227)
G4double fCoatedThickness;  // Coating thickness (line 227)
G4bool fCoatedFrustratedTransmission;  // Allow frustrated transmission (line 255)
```

### Diagnostics

```cpp
G4int fNumSmallStepWarnings;  // Count of small step warnings (line 235)
G4int fNumBdryTypeWarnings;   // Count of boundary type warnings (line 236)
```

## Usage Examples

### Example 1: Creating a Reflective Surface

```cpp
// Create optical surface for ESR reflector
G4OpticalSurface* esrSurface = new G4OpticalSurface("ESRSurface");
esrSurface->SetType(dielectric_metal);
esrSurface->SetModel(unified);
esrSurface->SetFinish(polishedlumirrorair);

// Define wavelength-dependent reflectivity
G4MaterialPropertiesTable* esrMPT = new G4MaterialPropertiesTable();

std::vector<G4double> photonEnergy = {2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV};
std::vector<G4double> reflectivity = {0.98, 0.985, 0.985, 0.98, 0.97};

esrMPT->AddProperty("REFLECTIVITY", photonEnergy, reflectivity);
esrSurface->SetMaterialPropertiesTable(esrMPT);

// Apply to volume using skin surface
new G4LogicalSkinSurface("ESRSkinSurface",
                         scintillatorLogical,
                         esrSurface);
```

### Example 2: PMT Photocathode with QE

```cpp
// Create photocathode surface
G4OpticalSurface* photocathodeSurface =
    new G4OpticalSurface("PhotocathodeSurface");
photocathodeSurface->SetType(dielectric_metal);
photocathodeSurface->SetModel(unified);
photocathodeSurface->SetFinish(polished);

// Define quantum efficiency curve
G4MaterialPropertiesTable* photocathodeMPT = new G4MaterialPropertiesTable();

std::vector<G4double> photonEnergy = {
    1.5*eV, 2.0*eV, 2.5*eV, 3.0*eV, 3.5*eV, 4.0*eV, 4.5*eV
};
std::vector<G4double> qe = {
    0.02, 0.08, 0.18, 0.25, 0.28, 0.24, 0.15  // Typical bialkali QE
};

photocathodeMPT->AddProperty("EFFICIENCY", photonEnergy, qe);
photocathodeSurface->SetMaterialPropertiesTable(photocathodeMPT);

// Apply to photocathode
new G4LogicalSkinSurface("PhotocathodeSkin",
                         photocathodeLogical,
                         photocathodeSurface);
```

### Example 3: Ground Surface with Mixed Reflection

```cpp
// Create ground surface with controlled reflection types
G4OpticalSurface* groundSurface = new G4OpticalSurface("GroundSurface");
groundSurface->SetType(dielectric_dielectric);
groundSurface->SetModel(unified);
groundSurface->SetFinish(ground);
groundSurface->SetSigmaAlpha(0.1);  // Surface roughness

G4MaterialPropertiesTable* groundMPT = new G4MaterialPropertiesTable();

std::vector<G4double> energy = {2.0*eV, 4.0*eV};

// Define reflection type probabilities
std::vector<G4double> specularlobe = {0.3, 0.3};      // 30% lobe
std::vector<G4double> specularspike = {0.2, 0.2};     // 20% spike
std::vector<G4double> backscatter = {0.1, 0.1};       // 10% backscatter
// Remaining 40% will be Lambertian

groundMPT->AddProperty("SPECULARLOBECONSTANT", energy, specularlobe);
groundMPT->AddProperty("SPECULARSPIKECONSTANT", energy, specularspike);
groundMPT->AddProperty("BACKSCATTERCONSTANT", energy, backscatter);

groundSurface->SetMaterialPropertiesTable(groundMPT);

new G4LogicalBorderSurface("GroundBorderSurface",
                           physVol1, physVol2,
                           groundSurface);
```

### Example 4: Dichroic Filter

```cpp
// Create dichroic filter surface
G4OpticalSurface* dichroicSurface =
    new G4OpticalSurface("DichroicSurface");
dichroicSurface->SetType(dielectric_dichroic);
dichroicSurface->SetModel(glisur);  // Use glisur model for dichroic
dichroicSurface->SetFinish(polished);

G4MaterialPropertiesTable* dichroicMPT = new G4MaterialPropertiesTable();

// Define 2D transmission table (energy vs angle)
// This example shows transmission vs photon energy only
std::vector<G4double> photonEnergy = {1.5*eV, 2.0*eV, 2.48*eV, 3.0*eV, 4.0*eV};
std::vector<G4double> transmittance = {0.9, 0.9, 0.5, 0.05, 0.01};  // Cuts blue

dichroicMPT->AddProperty("TRANSMITTANCE", photonEnergy, transmittance);
dichroicSurface->SetMaterialPropertiesTable(dichroicMPT);

new G4LogicalBorderSurface("DichroicFilter",
                           physVol1, physVol2,
                           dichroicSurface);
```

### Example 5: Checking Boundary Status

```cpp
// In UserSteppingAction
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
  // Get the boundary process
  const G4VProcess* process =
      step->GetPostStepPoint()->GetProcessDefinedStep();

  if (process && process->GetProcessName() == "OpBoundary")
  {
    G4OpBoundaryProcess* boundaryProc =
        (G4OpBoundaryProcess*)process;
    G4OpBoundaryProcessStatus status = boundaryProc->GetStatus();

    switch(status)
    {
      case Detection:
        // Photon was detected - record hit
        RecordPhotonDetection(step);
        break;

      case Absorption:
        // Photon was absorbed without detection
        RecordPhotonAbsorption(step);
        break;

      case FresnelReflection:
        // Photon reflected by Fresnel
        fPhotonReflectionCount++;
        break;

      case TotalInternalReflection:
        // TIR occurred - good for light guides
        fTIRCount++;
        break;

      case FresnelRefraction:
        // Photon refracted into new material
        fPhotonTransmissionCount++;
        break;

      default:
        break;
    }
  }
}
```

### Example 6: Thin Coating Layer

```cpp
// Create coated surface (e.g., anti-reflection coating)
G4OpticalSurface* coatedSurface = new G4OpticalSurface("CoatedSurface");
coatedSurface->SetType(dielectric_dielectric);
coatedSurface->SetModel(unified);
coatedSurface->SetFinish(polished);

G4MaterialPropertiesTable* coatingMPT = new G4MaterialPropertiesTable();

// Define coating properties
std::vector<G4double> energy = {2.0*eV, 3.0*eV, 4.0*eV};
std::vector<G4double> coatingRindex = {1.38, 1.38, 1.39};  // MgF2 coating

coatingMPT->AddProperty("RINDEX", energy, coatingRindex);
coatingMPT->AddConstProperty("COATING", 1.0);  // Enable coating
coatingMPT->AddConstProperty("COATINGTHICKNESS", 100.0*nm);  // Quarter-wave

coatedSurface->SetMaterialPropertiesTable(coatingMPT);

new G4LogicalBorderSurface("ARCoating",
                           airPhysVol, glassPhysVol,
                           coatedSurface);
```

## Physics Details

### Fresnel Equations

For dielectric-dielectric boundaries, reflectivity is calculated using Fresnel equations:

**S-polarization (perpendicular):**
```
Rs = |( n1*cos(θi) - n2*cos(θt) ) / ( n1*cos(θi) + n2*cos(θt) )|²
```

**P-polarization (parallel):**
```
Rp = |( n1*cos(θt) - n2*cos(θi) ) / ( n1*cos(θt) + n2*cos(θi) )|²
```

Where:
- n1, n2 are refractive indices
- θi is incident angle
- θt is transmitted angle (from Snell's law: n1*sin(θi) = n2*sin(θt))

### Total Internal Reflection

TIR occurs when:
```
sin(θi) > n2/n1  (for n1 > n2)
```

The critical angle is:
```
θc = arcsin(n2/n1)
```

### Surface Roughness

For ground surfaces, the microfacet normal is randomly generated based on the surface roughness parameter σα (sigma alpha):

- σα = 0: Perfect polished surface
- σα > 0: Gaussian distribution of facet normals

The facet normal is sampled from a distribution around the average surface normal.

## Performance Considerations

### Optimization Tips

1. **Use appropriate surface models:**
   - Simple polished surfaces: Use unified model with polished finish
   - Complex measured surfaces: Use LUT models only when necessary

2. **Minimize boundary status checks:**
   - Only check status when needed for analysis
   - Cache process pointer rather than searching each step

3. **Efficient property tables:**
   - Use minimal energy points that capture behavior
   - Ensure energy ranges cover expected photon spectrum

### Common Pitfalls

1. **Missing RINDEX:**
   - Both materials must have RINDEX defined
   - Status NoRINDEX indicates missing refractive index

2. **Border vs Skin surfaces:**
   - LogicalBorderSurface: Between two specific volumes
   - LogicalSkinSurface: Wraps entire volume
   - Don't apply both to same boundary

3. **Detection without sensitive detector:**
   - Detection status indicates photon killed with efficiency
   - Still need SD to record the hit in output

4. **Complex refractive index format:**
   - Real and imaginary parts in separate property vectors
   - Use REALRINDEX and IMAGINARYRINDEX

## Validation

The boundary process has been validated against:

- Analytical Fresnel equations for simple interfaces
- Measured reflectance data (for LUT models)
- Test beam data from optical detector systems

## References

### Header File
`source/processes/optical/include/G4OpBoundaryProcess.hh` - Lines 1-355

### Key Methods in Source
- Boundary type handling in `PostStepDoIt`
- Fresnel calculations in `DielectricDielectric`
- Metal reflection in `DielectricMetal`
- Coating calculations in `CoatedDielectricDielectric`

### Related Classes
- [G4OpticalSurface](../../geometry/api/g4opticalsurface.md) - Surface definition
- [G4MaterialPropertiesTable](../../materials/api/g4materialpropertiestable.md) - Properties storage
- [G4LogicalBorderSurface](../../geometry/api/g4logicalbordersurface.md) - Border surface
- [G4LogicalSkinSurface](../../geometry/api/g4logicalskinsurface.md) - Skin surface

### Publications
- P. Gumplinger, "Optical Photon Processes in GEANT4"
- LUT Davis model: Janecek & Moses, IEEE TNS 2008

[Back to Optical Processes Overview](../index.md)
