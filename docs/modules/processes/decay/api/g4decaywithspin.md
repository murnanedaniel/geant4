# G4DecayWithSpin

**File**: `source/processes/decay/include/G4DecayWithSpin.hh`

## Overview

G4DecayWithSpin is a specialized decay process that extends G4Decay to include spin and polarization effects. It properly handles particle polarization during decay, accounts for spin precession in magnetic fields for at-rest decays, and propagates polarization information to decay channels. This class is essential for precision experiments involving polarized particles, particularly muon decay in storage rings and muon g-2 measurements.

## Class Description

G4DecayWithSpin adds spin-dependent physics to the standard decay process:

- **Polarization Management**: Generates or retrieves parent particle polarization
- **Spin Precession**: Calculates spin rotation in magnetic fields during at-rest decay
- **Muon g-2 Effects**: Implements anomalous magnetic moment precession
- **Channel Polarization**: Propagates spin to decay channels for angular distributions
- **Random Polarization**: Generates isotropic polarization for unpolarized parents

The class is particularly important for:
- Muon decay experiments (g-2, EDM measurements)
- Polarized beam facilities
- Spin physics studies
- Precision measurements requiring angular correlations

**Inheritance**: G4Decay → G4VRestDiscreteProcess → G4VProcess

**Location**: `source/processes/decay/include/G4DecayWithSpin.hh:43`

**History**:
- 17 August 2004: P. Gumplinger, T. MacPhail (initial implementation)
- 11 April 2008: Kamil Sedlak (PSI), Toni Shiroka (PSI) (spin precession)

## Constructor & Destructor

### Constructor

```cpp
G4DecayWithSpin(const G4String& processName = "DecayWithSpin");
```

Creates a new spin-dependent decay process.

**Parameters**:
- `processName`: Name of the process (default: "DecayWithSpin")

**Implementation**: Lines 52-57 in `source/processes/decay/src/G4DecayWithSpin.cc`

```cpp
G4DecayWithSpin::G4DecayWithSpin(const G4String& processName)
    : G4Decay(processName)
{
    // Set Process Sub Type
    SetProcessSubType(static_cast<int>(DECAY_WithSpin));
}
```

**Process Sub-Type**: Sets to `DECAY_WithSpin` (202) to distinguish from standard decay.

**Location**: `source/processes/decay/include/G4DecayWithSpin.hh:47`

### Destructor

```cpp
virtual ~G4DecayWithSpin();
```

Virtual destructor.

**Implementation**: Lines 59 in `source/processes/decay/src/G4DecayWithSpin.cc`

**Location**: `source/processes/decay/include/G4DecayWithSpin.hh:50`

## DoIt Methods

### PostStepDoIt

```cpp
protected:
virtual G4VParticleChange* PostStepDoIt(
    const G4Track& aTrack,
    const G4Step& aStep
) override;
```

Handles decay in-flight with polarization tracking.

**Parameters**:
- `aTrack`: Current track
- `aStep`: Current step

**Returns**: Particle change with daughter particles and polarization

**Implementation**: Lines 61-107 in `source/processes/decay/src/G4DecayWithSpin.cc`

**Algorithm**:

1. **Track Status Check**: Return early if particle is stopping/stopped
2. **Get Parent Polarization**: Retrieve particle spin vector
3. **Random Polarization**: If unpolarized (0,0,0), generate isotropic random polarization
4. **Set Channel Polarization**: Propagate to all decay channels
5. **Call Base Decay**: Execute standard G4Decay::DecayIt()
6. **Propose Polarization**: Set parent polarization in particle change

**Polarization Generation** (lines 76-92):
```cpp
if (parent_polarization == G4ThreeVector(0,0,0)) {
    // Generate random polarization direction
    G4double cost = 1. - 2.*G4UniformRand();
    G4double sint = std::sqrt((1.-cost)*(1.+cost));

    G4double phi = twopi*G4UniformRand();
    G4double sinp = std::sin(phi);
    G4double cosp = std::cos(phi);

    G4double px = sint*cosp;
    G4double py = sint*sinp;
    G4double pz = cost;

    parent_polarization.setX(px);
    parent_polarization.setY(py);
    parent_polarization.setZ(pz);
}
```

**Channel Setup** (lines 94-100):
```cpp
G4DecayTable* decaytable = aParticleDef->GetDecayTable();
if (decaytable != nullptr) {
    for (G4int ip=0; ip<decaytable->entries(); ip++) {
        decaytable->GetDecayChannel(ip)->SetPolarization(parent_polarization);
    }
}
```

**Note**: For in-flight decay, no spin precession is calculated (particle is moving).

**Location**: `source/processes/decay/include/G4DecayWithSpin.hh:56-59`

### AtRestDoIt

```cpp
virtual G4VParticleChange* AtRestDoIt(
    const G4Track& aTrack,
    const G4Step& aStep
) override;
```

Handles decay at rest with spin precession in magnetic fields.

**Parameters**:
- `aTrack`: Current track
- `aStep`: Current step

**Returns**: Particle change with daughter particles and precessed polarization

**Implementation**: Lines 109-184 in `source/processes/decay/src/G4DecayWithSpin.cc`

**Algorithm**:

1. **Get Parent Polarization**: Retrieve or generate spin vector
2. **Field Lookup**: Query electromagnetic field at particle position
3. **Spin Precession**: Calculate spin rotation if magnetic field present
4. **Set Channel Polarization**: Propagate (precessed) spin to decay channels
5. **Call Base Decay**: Execute G4Decay::DecayIt()
6. **Propose Polarization**: Set final polarization in particle change

**Field Retrieval** (lines 138-168):
```cpp
G4FieldManager* fieldMgr = aStep.GetTrack()->GetVolume()->
                                 GetLogicalVolume()->GetFieldManager();
if (fieldMgr == nullptr) {
    G4TransportationManager* transportMgr =
                      G4TransportationManager::GetTransportationManager();
    G4PropagatorInField* fFieldPropagator =
                                     transportMgr->GetPropagatorInField();
    if (fFieldPropagator) fieldMgr =
                               fFieldPropagator->GetCurrentFieldManager();
}

const G4Field* field = nullptr;
if (fieldMgr != nullptr) field = fieldMgr->GetDetectorField();

if (field != nullptr) {
    G4double point[4];
    point[0] = (aStep.GetPostStepPoint()->GetPosition())[0];
    point[1] = (aStep.GetPostStepPoint()->GetPosition())[1];
    point[2] = (aStep.GetPostStepPoint()->GetPosition())[2];
    point[3] = aTrack.GetGlobalTime();

    G4double fieldValue[6] = {0., 0., 0., 0., 0., 0.};
    field->GetFieldValue(point, fieldValue);
    G4ThreeVector B(fieldValue[0], fieldValue[1], fieldValue[2]);

    // Call the spin precession only for non-zero mag. field
    if (B.mag2() > 0.) {
        parent_polarization = Spin_Precession(aStep, B, fRemainderLifeTime);
    }
}
```

**Note**: Uses `fRemainderLifeTime` from G4Decay base class as the precession time.

**Location**: `source/processes/decay/include/G4DecayWithSpin.hh:61-64`

## Spin Precession Calculation

### Spin_Precession (Private)

```cpp
private:
G4ThreeVector Spin_Precession(
    const G4Step& aStep,
    G4ThreeVector B,
    G4double deltatime
);
```

Calculates spin precession in a magnetic field using the g-2 formula.

**Parameters**:
- `aStep`: Current step (for particle properties)
- `B`: Magnetic field vector
- `deltatime`: Time interval for precession (remainder lifetime)

**Returns**: New spin vector after precession

**Implementation**: Lines 186-223 in `source/processes/decay/src/G4DecayWithSpin.cc`

**Physics Formula**:

The spin precession frequency is:
```
ω = -(q/m) × (g/2) × B
  = -(q × s_omega) × (1 + a) × |B|
```

Where:
- `q`: Particle charge
- `a = 1.165922e-3`: Muon anomalous magnetic moment (g-2)/2
- `s_omega = 8.5062e+7 rad/(s·kG)`: Spin precession constant
- `|B|`: Magnetic field magnitude

**Implementation**:

```cpp
G4double Bnorm = std::sqrt(sqr(B[0]) + sqr(B[1]) + sqr(B[2]));

G4double q = aStep.GetTrack()->GetDefinition()->GetPDGCharge();
G4double a = 1.165922e-3;  // anomalous magnetic moment
G4double s_omega = 8.5062e+7*rad/(s*kilogauss);

G4double omega = -(q*s_omega)*(1.+a) * Bnorm;
G4double rotationangle = deltatime * omega;

G4Transform3D SpinRotation = G4Rotate3D(rotationangle, B.unit());

G4Vector3D Spin = aStep.GetTrack()->GetPolarization();
G4Vector3D newSpin = SpinRotation * Spin;

return newSpin;
```

**Verbose Output** (lines 205-218):

If `GetVerboseLevel() > 2`:
```cpp
G4double normspin = std::sqrt(Spin*Spin);
G4double normnewspin = std::sqrt(newSpin*newSpin);

G4cout << "AT REST::: PARAMETERS " << G4endl;
G4cout << "Initial spin  : " << Spin  << G4endl;
G4cout << "Delta time    : " << deltatime  << G4endl;
G4cout << "Rotation angle: " << rotationangle/rad  << G4endl;
G4cout << "New spin      : " << newSpin  << G4endl;
G4cout << "Checked norms : " << normspin <<" " << normnewspin << G4endl;
```

**Physics Note**: The g-2 formula accounts for the anomalous magnetic moment, which causes the spin to precess faster than the classical rate. This is critical for muon g-2 experiments.

**Location**: `source/processes/decay/include/G4DecayWithSpin.hh:66-67`

## Process Description

### ProcessDescription

```cpp
virtual void ProcessDescription(std::ostream& outFile) const override;
```

Writes process description to output stream.

**Parameters**:
- `outFile`: Output stream

**Implementation**: Lines 225-230 in `source/processes/decay/src/G4DecayWithSpin.cc`

```cpp
outFile << GetProcessName()
        << ": Decay of particles considering parent polarization \n"
        << "kinematics of daughters are determined by DecayChannels \n";
```

**Location**: `source/processes/decay/include/G4DecayWithSpin.hh:52`

## Usage Examples

### Basic Usage for Muons

```cpp
#include "G4DecayWithSpin.hh"
#include "G4MuonPlus.hh"
#include "G4MuonMinus.hh"
#include "G4ProcessManager.hh"

// Create spin-dependent decay process
G4DecayWithSpin* decayWithSpin = new G4DecayWithSpin("DecayWithSpin");

// Apply to muons
G4ProcessManager* pManager;

// Mu+
pManager = G4MuonPlus::Definition()->GetProcessManager();
pManager->AddProcess(decayWithSpin);
pManager->SetProcessOrdering(decayWithSpin, idxPostStep);
pManager->SetProcessOrdering(decayWithSpin, idxAtRest);

// Mu-
pManager = G4MuonMinus::Definition()->GetProcessManager();
pManager->AddProcess(decayWithSpin);
pManager->SetProcessOrdering(decayWithSpin, idxPostStep);
pManager->SetProcessOrdering(decayWithSpin, idxAtRest);
```

### Setting Initial Polarization

```cpp
#include "G4PrimaryParticle.hh"
#include "G4ParticleGun.hh"

// Create particle gun
G4ParticleGun* particleGun = new G4ParticleGun();
particleGun->SetParticleDefinition(G4MuonPlus::Definition());

// Set initial polarization
G4ThreeVector polarization(0., 0., 1.);  // 100% polarized in +z direction
particleGun->SetParticlePolarization(polarization);

// Generate primary
particleGun->GeneratePrimaryVertex(event);
```

### Analyzing Polarization Effects

```cpp
#include "G4SteppingManager.hh"
#include "G4Step.hh"

// In stepping action
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    const G4Track* track = step->GetTrack();

    // Check if decay occurred
    const G4VProcess* process = step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process && process->GetProcessName() == "DecayWithSpin") {
        // Get parent polarization before decay
        G4ThreeVector polarization = track->GetPolarization();

        G4cout << "Decay with polarization: "
               << "Px=" << polarization.x() << ", "
               << "Py=" << polarization.y() << ", "
               << "Pz=" << polarization.z() << G4endl;

        // Analyze daughter particles
        const std::vector<const G4Track*>* secondaries =
            step->GetSecondaryInCurrentStep();

        if (secondaries) {
            for (auto secondary : *secondaries) {
                G4ThreeVector daughterPol = secondary->GetPolarization();
                G4cout << "  Daughter " << secondary->GetDefinition()->GetParticleName()
                       << " polarization: "
                       << "Px=" << daughterPol.x() << ", "
                       << "Py=" << daughterPol.y() << ", "
                       << "Pz=" << daughterPol.z() << G4endl;
            }
        }
    }
}
```

### Muon g-2 Experiment Simulation

```cpp
#include "G4DecayWithSpin.hh"
#include "G4UniformMagField.hh"
#include "G4FieldManager.hh"
#include "G4TransportationManager.hh"

// Set up magnetic field (e.g., 1.45 Tesla for g-2 experiment)
G4ThreeVector fieldValue(0., 1.45*tesla, 0.);
G4UniformMagField* magField = new G4UniformMagField(fieldValue);

// Set field manager
G4FieldManager* fieldMgr =
    G4TransportationManager::GetTransportationManager()
        ->GetFieldManager();
fieldMgr->SetDetectorField(magField);
fieldMgr->CreateChordFinder(magField);

// Use DecayWithSpin for muons
G4DecayWithSpin* muonDecay = new G4DecayWithSpin("DecayWithSpin");

// The decay will now include spin precession in the 1.45T field
// Precession frequency: ω_a = (g-2)/2 × (eB/m) ≈ 230 kHz
```

## Physics Details

### Anomalous Magnetic Moment

The muon anomalous magnetic moment is:
```
a_μ = (g-2)/2 = 1.165922e-3
```

This value is hardcoded in line 192 of the source file. For precision studies, this should be updated to match current experimental values:
```
a_μ (2021) = 116592061(41) × 10^-11
```

### Spin Precession Frequency

For a muon in a magnetic field B:
```
ω_s = -(e/m) × (g/2) × B  (cyclotron frequency × g/2)
ω_a = -(e/m) × [(g-2)/2] × B  (anomalous precession)
```

The implementation uses:
```
ω = -(q × s_omega) × (1 + a) × |B|
where s_omega = 8.5062e+7 rad/(s·kG)
```

### Isotropic Polarization

When no initial polarization is set, the process generates a random unit vector uniformly distributed on the sphere using:
1. Uniform cos(θ) distribution: `cos(θ) = 1 - 2r` where r ∈ [0,1]
2. Uniform φ distribution: `φ = 2πr`

This ensures unpolarized ensembles.

## Related Classes

- **[G4Decay](./g4decay.md)**: Base class
- **[G4PionDecayMakeSpin](./g4piondecaymakespin.md)**: Related polarization class
- **G4MuonDecayChannelWithSpin**: Decay channel with spin correlations
- **G4DecayTable**: Particle decay table
- **G4FieldManager**: Field management
- **G4Field**: Electromagnetic field interface

## Applications

G4DecayWithSpin is essential for:

1. **Muon g-2 Experiments**:
   - Fermilab E989
   - J-PARC E34
   - Requires accurate spin precession in storage ring

2. **Muon EDM Searches**:
   - Electric dipole moment experiments
   - Sensitive to spin precession in E and B fields

3. **Polarized Muon Facilities**:
   - TRIUMF, PSI, J-PARC
   - Muon spin spectroscopy (μSR)
   - Muon catalyzed fusion

4. **Weak Interaction Studies**:
   - Michel parameter measurements
   - V-A structure tests
   - Angular correlations in decay

5. **Beam Polarimetry**:
   - Polarized beam diagnostics
   - Spin transport in accelerators

## Notes

- The anomalous magnetic moment value is for the muon; if used with other particles, verify the g-factor
- Spin precession is only calculated for at-rest decay (particles in flight precess during tracking, not during decay)
- The process automatically generates random polarization if none is set
- Field lookup goes through volume → field manager hierarchy
- Works with any G4Field implementation (uniform, non-uniform, time-dependent)
- Thread-safe: each thread has its own process instance
- The precession calculation assumes the field is constant during the decay time
