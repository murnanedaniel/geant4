# Randomize.hh API Documentation

## Overview

`Randomize.hh` is the main header file for random number generation in Geant4. It provides a wrapper around CLHEP random number classes and defines convenient macros/aliases for all major probability distributions. This header gives access to the complete CLHEP random number generation framework including engines and distributions.

::: tip Header File
**Location:** `source/global/HEPRandom/include/Randomize.hh`
**Type:** Wrapper header (includes CLHEP classes)
:::

## Header Contents

`source/global/HEPRandom/include/Randomize.hh:28-54`

```cpp
#ifndef randomize_h
#define randomize_h 1

#include <CLHEP/Random/Randomize.h>

// Distributions used ...
//
#include <CLHEP/Random/RandBit.h>
#include <CLHEP/Random/RandExponential.h>
#include <CLHEP/Random/RandFlat.h>
#include <CLHEP/Random/RandGamma.h>
#include <CLHEP/Random/RandGaussQ.h>
#include <CLHEP/Random/RandGeneral.h>
#include <CLHEP/Random/RandPoissonQ.h>

#define G4RandStat CLHEP::HepStat
#define G4RandFlat CLHEP::RandFlat
#define G4RandBit CLHEP::RandBit
#define G4RandGamma CLHEP::RandGamma
#define G4RandGauss CLHEP::RandGaussQ
#define G4RandExponential CLHEP::RandExponential
#define G4RandGeneral CLHEP::RandGeneral
#define G4Random CLHEP::HepRandom

#define G4UniformRand() CLHEP::HepRandom::getTheEngine()->flat()

#endif  // randomize_h
```

## Available Distributions

### G4UniformRand()

**Purpose:** Generate uniform random number in [0,1]

**Type:** Macro function

**Returns:** G4double in range [0.0, 1.0)

**Example:**
```cpp
G4double r = G4UniformRand();
if (r < 0.5) {
    // Happens 50% of the time
}
```

### G4RandFlat - Uniform Distribution

**Class:** `CLHEP::RandFlat`

**Purpose:** Generate uniformly distributed random numbers in arbitrary ranges

**Common Methods:**
```cpp
// Random in [0,1)
G4double x = G4RandFlat::shoot();

// Random in [a,b)
G4double x = G4RandFlat::shoot(min, max);

// Integer random in [a,b)
G4int n = G4RandFlat::shootInt(nmin, nmax);
```

**Physics Applications:**
- Random particle positions in detector volumes
- Uniform angular distributions
- Monte Carlo acceptance/rejection

**Example:**
```cpp
// Random position in detector
G4double x = G4RandFlat::shoot(-detectorWidth/2, detectorWidth/2);
G4double y = G4RandFlat::shoot(-detectorHeight/2, detectorHeight/2);

// Random particle type selection
G4int particleType = G4RandFlat::shootInt(0, 3);  // 0, 1, or 2
```

### G4RandGauss - Gaussian Distribution

**Class:** `CLHEP::RandGaussQ` (Quick Gaussian)

**Purpose:** Generate normally distributed random numbers

**Common Methods:**
```cpp
// Standard normal (mean=0, sigma=1)
G4double x = G4RandGauss::shoot();

// General normal
G4double x = G4RandGauss::shoot(mean, stdDev);
```

**Physics Applications:**
- Detector resolution smearing
- Beam profile modeling
- Thermal motion effects
- Multiple scattering angles

**Example:**
```cpp
// Energy resolution smearing
G4double measuredEnergy = trueEnergy + G4RandGauss::shoot(0.0, resolution);

// Beam divergence
G4double theta = G4RandGauss::shoot(0.0, beamDivergence);
G4double phi = G4RandGauss::shoot(0.0, beamDivergence);

// Detector timing jitter
G4double time = trueTime + G4RandGauss::shoot(0.0, timeResolution);
```

### G4RandExponential - Exponential Distribution

**Class:** `CLHEP::RandExponential`

**Purpose:** Generate exponentially distributed random numbers

**Common Methods:**
```cpp
// With mean value
G4double x = G4RandExponential::shoot(mean);
```

**Physics Applications:**
- Radioactive decay times
- Particle lifetimes
- Interaction mean free paths
- Cosmic ray arrival times

**Example:**
```cpp
// Radioactive decay time
G4double halfLife = 5.27 * year;  // U-238
G4double meanLife = halfLife / std::log(2.0);
G4double decayTime = G4RandExponential::shoot(meanLife);

// Distance to next interaction
G4double interactionLength = 10 * cm;
G4double distance = G4RandExponential::shoot(interactionLength);
```

### G4RandPoisson - Poisson Distribution

**Class:** `CLHEP::RandPoissonQ` (Quick Poisson)

**Purpose:** Generate Poisson-distributed integer random numbers

**Common Methods:**
```cpp
G4long n = G4RandPoisson::shoot(mean);
```

**Physics Applications:**
- Number of photoelectrons in PMT
- Number of secondary particles
- Counting statistics
- Nuclear reaction multiplicities

**Example:**
```cpp
// Photoelectron generation
G4double meanPhotoelectrons = photonEnergy / workFunction;
G4int nPhotoelectrons = G4RandPoisson::shoot(meanPhotoelectrons);

// Neutron multiplicity in fission
G4double nu = 2.5;  // Average neutrons per fission
G4int nNeutrons = G4RandPoisson::shoot(nu);
```

### G4RandGamma - Gamma Distribution

**Class:** `CLHEP::RandGamma`

**Purpose:** Generate gamma-distributed random numbers

**Common Methods:**
```cpp
G4double x = G4RandGamma::shoot(k, lambda);
```

**Parameters:**
- `k`: Shape parameter
- `lambda`: Scale parameter

**Physics Applications:**
- Energy straggling
- Particle shower distributions
- Beta decay spectra

**Example:**
```cpp
// Energy loss straggling
G4double k = 2.0;
G4double lambda = 0.5;
G4double energyLoss = G4RandGamma::shoot(k, lambda);
```

### G4RandBit - Bit Generation

**Class:** `CLHEP::RandBit`

**Purpose:** Generate random bits (0 or 1)

**Common Methods:**
```cpp
G4int bit = G4RandBit::shoot();
G4int bitWithProb = G4RandBit::shootBit(probability);
```

**Physics Applications:**
- Binary decision making
- Random polarization states
- Spin orientations

**Example:**
```cpp
// Random spin orientation
G4int spinUp = G4RandBit::shoot();  // 0 or 1

// Biased coin flip
G4double detectionEfficiency = 0.8;
G4bool detected = G4RandBit::shootBit(detectionEfficiency);
```

### G4RandGeneral - General Distributions

**Class:** `CLHEP::RandGeneral`

**Purpose:** Generate random numbers from arbitrary probability distributions

**Usage:**
```cpp
// Define probability density function
G4double pdf[] = {0.1, 0.3, 0.5, 0.8, 1.0};
G4int nBins = 5;

G4RandGeneral dist(pdf, nBins);
G4double x = dist.shoot();
```

**Physics Applications:**
- Custom energy spectra
- Angular distributions from data
- Experimental cross-section sampling

**Example:**
```cpp
// Cosmic ray energy spectrum
const G4int nBins = 100;
G4double energySpectrum[nBins];

// Fill with E^-2.7 spectrum
for (G4int i = 0; i < nBins; i++) {
    G4double E = std::pow(10.0, i * 0.1);  // Log scale
    energySpectrum[i] = std::pow(E, -2.7);
}

G4RandGeneral cosmicSpectrum(energySpectrum, nBins);
G4double energy = cosmicSpectrum.shoot() * maxEnergy;
```

## Global Random Engine

### Concept

Geant4 uses a global random number engine (singleton pattern) that can be accessed from anywhere:

```cpp
CLHEP::HepRandomEngine* engine = CLHEP::HepRandom::getTheEngine();
```

### Setting the Engine

```cpp
#include "CLHEP/Random/MTwistEngine.h"

// Set Mersenne Twister engine
CLHEP::HepRandom::setTheEngine(new CLHEP::MTwistEngine);
```

### Available Engines

- **MTwistEngine:** Mersenne Twister (recommended, default in Geant4)
- **Ranlux64Engine:** High-quality but slower
- **RanecuEngine:** Fast, good quality
- **DRand48Engine:** Unix standard (not recommended)

### Setting the Seed

```cpp
// Set seed for reproducibility
CLHEP::HepRandom::setTheSeed(12345);

// Get current seed
G4long seed = CLHEP::HepRandom::getTheSeed();

// Save/restore engine state
CLHEP::HepRandom::saveEngineStatus("random_state.dat");
CLHEP::HepRandom::restoreEngineStatus("random_state.dat");
```

## Thread Safety

::: warning Multi-Threading Considerations
Random number generation requires special care in multi-threaded applications.
:::

### Thread-Local Engines

In multi-threaded mode, each thread has its own random engine:

```cpp
// In worker thread initialization
CLHEP::HepRandom::setTheEngine(new CLHEP::MTwistEngine);

// Set different seed per thread
G4int threadID = G4Threading::G4GetThreadId();
CLHEP::HepRandom::setTheSeed(baseSeed + threadID);
```

### G4 Master-Worker Pattern

Geant4 handles thread-local engines automatically:

```cpp
void MyActionInitialization::Build() const {
    // Master thread
    SetUserAction(new MyPrimaryGeneratorAction);
}

void MyActionInitialization::BuildForMaster() const {
    // Separate master setup if needed
}
```

### Best Practices

1. **Never share random engines between threads**
2. **Set different seeds per thread** to avoid correlation
3. **Use G4UniformRandPool** for efficient batch generation
4. **Save engine states** for reproducibility

## Performance Considerations

### Engine Selection

| Engine | Speed | Quality | Period | Recommended |
|--------|-------|---------|--------|-------------|
| MTwistEngine | Fast | Excellent | 2^19937 | Yes (default) |
| Ranlux64Engine | Slow | Excellent | ~10^171 | High precision |
| RanecuEngine | Very Fast | Good | 2^113 | High throughput |

### Distribution Performance

| Distribution | Speed | Notes |
|-------------|-------|-------|
| Uniform | Fastest | Direct engine call |
| Gaussian (Quick) | Fast | Ziggurat method |
| Exponential | Fast | Logarithm transform |
| Poisson (Quick) | Medium | Two algorithms |
| Gamma | Slower | Rejection sampling |
| General | Variable | Depends on PDF |

### Optimization Tips

```cpp
// GOOD: Direct G4UniformRand() for uniform
G4double r = G4UniformRand();

// GOOD: Use Quick versions
G4double x = G4RandGauss::shoot(mean, sigma);

// BETTER: Reuse distribution objects in loops
G4RandGauss gaussDist(mean, sigma);
for (G4int i = 0; i < n; i++) {
    G4double x = gaussDist.shoot();
}

// BEST: Use G4UniformRandPool for many uniforms
#include "G4UniformRandPool.hh"
G4double randoms[1000];
G4UniformRandPool::flatArray(1000, randoms);
```

## Common Use Cases

### Event Generation

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event) {
    // Random position in source volume
    G4double x = G4RandFlat::shoot(-sourceSize/2, sourceSize/2);
    G4double y = G4RandFlat::shoot(-sourceSize/2, sourceSize/2);
    G4double z = G4RandFlat::shoot(-sourceSize/2, sourceSize/2);

    // Random direction (isotropic)
    G4double theta = std::acos(2.0 * G4UniformRand() - 1.0);
    G4double phi = CLHEP::twopi * G4UniformRand();

    // Random energy from spectrum
    G4double energy = SampleEnergySpectrum();

    fParticleGun->SetParticlePosition(G4ThreeVector(x, y, z));
    fParticleGun->SetParticleMomentumDirection(
        G4ThreeVector(std::sin(theta)*std::cos(phi),
                     std::sin(theta)*std::sin(phi),
                     std::cos(theta)));
    fParticleGun->SetParticleEnergy(energy);
    fParticleGun->GeneratePrimaryVertex(event);
}
```

### Physics Process Sampling

```cpp
G4double MyPhysicsProcess::PostStepDoIt() {
    // Sample interaction type
    G4double r = G4UniformRand();
    if (r < photoelectricFraction) {
        DoPhotoelectric();
    } else if (r < photoelectricFraction + comptonFraction) {
        DoCompton();
    } else {
        DoPairProduction();
    }

    // Sample scattering angle from Klein-Nishina
    G4double cosTheta = SampleCosTheta();
    G4double phi = CLHEP::twopi * G4UniformRand();

    return scatteredDirection;
}
```

### Detector Response

```cpp
void MySensitiveDetector::ProcessHits(G4Step* step) {
    // Energy deposition with resolution
    G4double edep = step->GetTotalEnergyDeposit();
    G4double resolution = 0.03 * std::sqrt(edep / MeV);  // 3%/√E
    G4double measured = edep + G4RandGauss::shoot(0.0, resolution * edep);

    // Timing with jitter
    G4double time = step->GetPreStepPoint()->GetGlobalTime();
    G4double timeJitter = 0.5 * ns;
    G4double measuredTime = time + G4RandGauss::shoot(0.0, timeJitter);

    // Poisson statistics for photon counting
    G4double nPhotons = edep / (3.0 * eV);  // Scintillation yield
    G4int detectedPhotons = G4RandPoisson::shoot(nPhotons * quantumEfficiency);

    hit->SetEdep(measured);
    hit->SetTime(measuredTime);
    hit->SetPhotons(detectedPhotons);
}
```

## Reproducibility

### Setting Seeds for Reproducible Runs

```cpp
void MyRunManager::BeamOn(G4int nEvents) {
    // Set seed based on run number
    G4int runNumber = GetCurrentRun()->GetRunID();
    G4long seed = 123456 + runNumber;
    CLHEP::HepRandom::setTheSeed(seed);

    // Save state before run
    CLHEP::HepRandom::saveEngineStatus("run" +
        std::to_string(runNumber) + "_initial.rndm");

    // Run simulation
    ProcessEvents(nEvents);

    // Save state after run
    CLHEP::HepRandom::saveEngineStatus("run" +
        std::to_string(runNumber) + "_final.rndm");
}
```

### Restoring Simulation State

```cpp
// Restore from previous run
CLHEP::HepRandom::restoreEngineStatus("run5_final.rndm");

// Continue simulation with same random sequence
RunManager->BeamOn(1000);
```

## Related Classes

- [G4UniformRandPool](g4uniformrandpool.md) - Efficient pooled random generation
- [G4RandomDirection](g4randomdirection.md) - Random 3D direction vectors
- [G4RandomTools](g4randomtools.md) - Geometric random sampling utilities
- [G4Poisson](g4poisson.md) - Fast Poisson distribution (alternative to CLHEP)
- [G4QuickRand](g4quickrand.md) - Ultra-fast simple random generator

## References

- CLHEP Random Number Package Documentation
- Geant4 User's Guide: Random Number Generation
- Matsumoto & Nishimura, "Mersenne Twister" (1998)
- L'Ecuyer, "TestU01: A Library for Empirical Testing of RNGs" (2007)

---

::: info Source Reference
**Header:** `source/global/HEPRandom/include/Randomize.hh` (lines 28-54)
**Type:** Wrapper header for CLHEP random classes
**Dependencies:** CLHEP Random library
:::
