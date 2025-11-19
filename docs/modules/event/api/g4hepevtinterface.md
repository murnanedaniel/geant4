# G4HEPEvtInterface API Documentation

## Overview

`G4HEPEvtInterface` is a concrete implementation of `G4VPrimaryGenerator` that reads primary particles from ASCII files in the HEPEvt format. This format is a standard output format supported by many Monte Carlo event generators (PYTHIA, HERWIG, etc.) and provides a convenient way to use externally generated events as input to Geant4 simulations.

The class reads particle-by-particle from file and constructs corresponding `G4PrimaryVertex` and `G4PrimaryParticle` objects for simulation.

::: tip Header File
**Location:** `source/event/include/G4HEPEvtInterface.hh`
**Source:** `source/event/src/G4HEPEvtInterface.cc`
:::

## Key Features

- **Standard Format**: Reads HEPEvt common block format (FORTRAN standard)
- **External Generators**: Interface to PYTHIA, HERWIG, and similar generators
- **Simple Interface**: Straightforward file-based input
- **Automatic Parsing**: Handles particle hierarchy and relationships
- **Sequential Reading**: Reads one event per call to `GeneratePrimaryVertex()`

## HEPEvt Format

The HEPEvt format is based on the FORTRAN `/HEPEVT/` common block structure:

### Format Specification
`source/event/include/G4HEPEvtInterface.hh:34-57`

```fortran
SUBROUTINE HEP2G4
*
* Output /HEPEVT/ event structure to G4HEPEvtInterface
*
      PARAMETER (NMXHEP=2000)
      COMMON/HEPEVT/NEVHEP,NHEP,ISTHEP(NMXHEP),IDHEP(NMXHEP),
     >JMOHEP(2,NMXHEP),JDAHEP(2,NMXHEP),PHEP(5,NMXHEP),VHEP(4,NMXHEP)
      DOUBLE PRECISION PHEP,VHEP
*
      WRITE(6,*) NHEP
      DO IHEP=1,NHEP
       WRITE(6,10)
     >  ISTHEP(IHEP),IDHEP(IHEP),JDAHEP(1,IHEP),JDAHEP(2,IHEP),
     >  PHEP(1,IHEP),PHEP(2,IHEP),PHEP(3,IHEP),PHEP(5,IHEP)
10    FORMAT(I4,I10,I5,I5,4(1X,D15.8))
      ENDDO
*
      RETURN
      END
```

### File Format Structure

Each event in the file consists of:

1. **Header Line**: Number of particles in event
   ```
   NHEP
   ```

2. **Particle Lines**: One line per particle
   ```
   ISTHEP IDHEP JDAHEP(1) JDAHEP(2) PHEP(1) PHEP(2) PHEP(3) PHEP(5)
   ```

**Field Definitions:**
- `ISTHEP`: Status code (1=final state, 2=intermediate, etc.)
- `IDHEP`: Particle ID (PDG code)
- `JDAHEP(1)`: First daughter index
- `JDAHEP(2)`: Last daughter index
- `PHEP(1)`: Momentum px (GeV/c)
- `PHEP(2)`: Momentum py (GeV/c)
- `PHEP(3)`: Momentum pz (GeV/c)
- `PHEP(5)`: Mass (GeV/c²)

### Example File

```
3
   1      11    0    0  1.50000000E+00  0.00000000E+00  3.00000000E+00  5.10999000E-04
   1     -11    0    0 -1.50000000E+00  0.00000000E+00  3.00000000E+00  5.10999000E-04
   1      22    0    0  0.00000000E+00  1.00000000E+00  0.00000000E+00  0.00000000E+00
```

This represents:
- Event with 3 final-state particles
- e- with momentum (1.5, 0, 3) GeV/c
- e+ with momentum (-1.5, 0, 3) GeV/c
- gamma with momentum (0, 1, 0) GeV/c

## Class Declaration

```cpp
class G4HEPEvtInterface : public G4VPrimaryGenerator
{
  public:
    explicit G4HEPEvtInterface(const char* evfile, G4int vl=0);
   ~G4HEPEvtInterface() override = default;

    void GeneratePrimaryVertex(G4Event* evt) override;

  private:
    G4int vLevel = 0;
    G4String fileName;
    std::ifstream inputFile;
    std::vector<G4HEPEvtParticle*> HPlist;
};
```

## Constructor and Destructor

### Constructor
`source/event/include/G4HEPEvtInterface.hh:82`

```cpp
explicit G4HEPEvtInterface(const char* evfile, G4int vl=0);
```

**Parameters:**
- `evfile`: Path to HEPEvt format input file (including directory)
- `vl`: Verbosity level (default = 0)
  - 0: Quiet
  - 1: Basic info
  - 2: Detailed debug output

**Purpose:** Opens HEPEvt file for reading and initializes interface.

**Example:**
```cpp
// Absolute path
G4HEPEvtInterface* hepmcGen =
    new G4HEPEvtInterface("/path/to/events.dat");

// Relative path
G4HEPEvtInterface* hepmcGen =
    new G4HEPEvtInterface("input/pythia_events.hepevt", 1);
```

::: warning File Path
File path must be valid at construction time. Constructor will fail if file cannot be opened.
:::

### Destructor
`source/event/include/G4HEPEvtInterface.hh:85`

```cpp
~G4HEPEvtInterface() override = default;
```

**Purpose:** Closes input file and cleans up resources. File automatically closed by `std::ifstream` destructor.

## Primary Vertex Generation

### GeneratePrimaryVertex()
`source/event/include/G4HEPEvtInterface.hh:88`

```cpp
void GeneratePrimaryVertex(G4Event* evt) override;
```

**Parameters:**
- `evt`: Event to receive primary particles

**Purpose:** Reads one event from file and creates corresponding primary vertex and particles.

**Behavior:**
1. Reads number of particles (NHEP) from file
2. Reads particle data line-by-line
3. Creates `G4PrimaryVertex` at origin with t=0
4. Creates `G4PrimaryParticle` for each particle
5. Sets momentum from file data
6. Adds vertex to event

**Example:**
```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    fHEPEvtInterface->GeneratePrimaryVertex(event);
}
```

::: tip Position and Time
Position and time of the primary vertex must be set using base class methods `SetParticlePosition()` and `SetParticleTime()`. If not set, defaults to (0,0,0) and t=0.
:::

## Usage Examples

### Basic Setup

```cpp
class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction()
    {
        fHEPEvtInterface = new G4HEPEvtInterface("events.hepevt");

        // Set vertex position and time (from base class)
        fHEPEvtInterface->SetParticlePosition(G4ThreeVector(0, 0, 0));
        fHEPEvtInterface->SetParticleTime(0.0);
    }

    ~MyPrimaryGeneratorAction() override
    {
        delete fHEPEvtInterface;
    }

    void GeneratePrimaries(G4Event* event) override
    {
        fHEPEvtInterface->GeneratePrimaryVertex(event);
    }

  private:
    G4HEPEvtInterface* fHEPEvtInterface;
};
```

### With Verbosity

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    // Enable detailed output for debugging
    fHEPEvtInterface = new G4HEPEvtInterface("pythia.dat", 2);

    fHEPEvtInterface->SetParticlePosition(G4ThreeVector(0, 0, 0));
}
```

### Custom Vertex Position

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    fHEPEvtInterface = new G4HEPEvtInterface("herwig.hepevt");

    // Set interaction point (e.g., collision point in accelerator)
    fHEPEvtInterface->SetParticlePosition(
        G4ThreeVector(0*mm, 0*mm, -50*cm));
    fHEPEvtInterface->SetParticleTime(0.0);
}
```

### Event-by-Event Position Randomization

```cpp
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Randomize vertex position (e.g., beam spot)
    G4double x = G4RandGauss::shoot(0, 1*mm);
    G4double y = G4RandGauss::shoot(0, 1*mm);
    G4double z = -50*cm;

    fHEPEvtInterface->SetParticlePosition(G4ThreeVector(x, y, z));

    // Generate event
    fHEPEvtInterface->GeneratePrimaryVertex(event);
}
```

### Multiple Files (Run-by-Run)

```cpp
class MyPrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    MyPrimaryGeneratorAction(const G4String& filename)
    {
        fHEPEvtInterface = new G4HEPEvtInterface(filename.c_str());
        fHEPEvtInterface->SetParticlePosition(G4ThreeVector(0, 0, 0));
    }

    ~MyPrimaryGeneratorAction() override
    {
        delete fHEPEvtInterface;
    }

    void GeneratePrimaries(G4Event* event) override
    {
        fHEPEvtInterface->GeneratePrimaryVertex(event);
    }

  private:
    G4HEPEvtInterface* fHEPEvtInterface;
};

// In main application
int main(int argc, char** argv)
{
    // Process multiple input files
    std::vector<G4String> files = {
        "run001.hepevt",
        "run002.hepevt",
        "run003.hepevt"
    };

    for (const auto& file : files) {
        MyPrimaryGeneratorAction* generator =
            new MyPrimaryGeneratorAction(file);
        // Use generator for run...
        delete generator;
    }
}
```

## Creating HEPEvt Files

### From PYTHIA (FORTRAN)

```fortran
PROGRAM PYTHIA_TO_HEPEVT
    IMPLICIT NONE
    INTEGER NHEP, I
    PARAMETER (NMXHEP=4000)
    COMMON/HEPEVT/NEVHEP,NHEP,ISTHEP(NMXHEP),IDHEP(NMXHEP),
   >  JMOHEP(2,NMXHEP),JDAHEP(2,NMXHEP),PHEP(5,NMXHEP),VHEP(4,NMXHEP)
    DOUBLE PRECISION PHEP,VHEP

    ! Call PYTHIA to generate event
    CALL PYINIT(...)

    ! Event loop
    DO IEV = 1, NEVENTS
        CALL PYEVNT()      ! Generate event
        CALL PYHEPC(1)     ! Convert to HEPEVT

        ! Write to file (unit 20)
        WRITE(20,*) NHEP
        DO I=1,NHEP
            WRITE(20,100) ISTHEP(I),IDHEP(I),JDAHEP(1,I),JDAHEP(2,I),
   >                      PHEP(1,I),PHEP(2,I),PHEP(3,I),PHEP(5,I)
100         FORMAT(I4,I10,I5,I5,4(1X,D15.8))
        ENDDO
    ENDDO
END
```

### From PYTHIA 8 (C++)

```cpp
#include "Pythia8/Pythia.h"
#include <fstream>

int main() {
    Pythia8::Pythia pythia;
    pythia.readString("Beams:eCM = 91.2");  // Z pole
    pythia.readString("WeakSingleBoson:ffbar2gmZ = on");
    pythia.init();

    std::ofstream outfile("pythia8_events.hepevt");

    for (int iEvent = 0; iEvent < 1000; ++iEvent) {
        if (!pythia.next()) continue;

        // Count final state particles
        int nFinal = 0;
        for (int i = 0; i < pythia.event.size(); ++i) {
            if (pythia.event[i].isFinal()) nFinal++;
        }

        outfile << nFinal << std::endl;

        // Write final state particles
        for (int i = 0; i < pythia.event.size(); ++i) {
            if (!pythia.event[i].isFinal()) continue;

            outfile << std::setw(4) << 1                    // Status
                    << std::setw(10) << pythia.event[i].id() // PDG ID
                    << std::setw(5) << 0                     // First daughter
                    << std::setw(5) << 0                     // Last daughter
                    << std::scientific << std::setprecision(8)
                    << " " << pythia.event[i].px()           // px (GeV)
                    << " " << pythia.event[i].py()           // py (GeV)
                    << " " << pythia.event[i].pz()           // pz (GeV)
                    << " " << pythia.event[i].m()            // mass (GeV)
                    << std::endl;
        }
    }

    outfile.close();
    return 0;
}
```

### From Python (PyHEPMC)

```python
import numpy as np

def write_hepevt_event(file, particles):
    """
    Write single event to HEPEvt file.
    particles: list of dicts with keys 'pdg', 'px', 'py', 'pz', 'mass'
    """
    file.write(f"{len(particles)}\n")

    for p in particles:
        file.write(f"{1:4d}{p['pdg']:10d}{0:5d}{0:5d} "
                   f"{p['px']:15.8E} {p['py']:15.8E} "
                   f"{p['pz']:15.8E} {p['mass']:15.8E}\n")

# Example: Write simple e+e- -> gamma gamma events
with open('simple_events.hepevt', 'w') as f:
    for i in range(100):
        # Generate random gamma-gamma events
        theta = np.random.uniform(0, np.pi)
        phi = np.random.uniform(0, 2*np.pi)
        E = 10.0  # GeV

        particles = [
            {
                'pdg': 22,  # gamma
                'px': E * np.sin(theta) * np.cos(phi),
                'py': E * np.sin(theta) * np.sin(phi),
                'pz': E * np.cos(theta),
                'mass': 0.0
            },
            {
                'pdg': 22,  # gamma
                'px': -E * np.sin(theta) * np.cos(phi),
                'py': -E * np.sin(theta) * np.sin(phi),
                'pz': -E * np.cos(theta),
                'mass': 0.0
            }
        ]

        write_hepevt_event(f, particles)
```

## File Handling

### Sequential Reading

The interface reads events sequentially from the file:
- First call to `GeneratePrimaryVertex()` reads first event
- Second call reads second event
- Continues until end of file reached

::: warning End of File
When end of file is reached, behavior depends on implementation. Check if simulation automatically stops or if error handling is needed.
:::

### File Validation

```cpp
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    const char* filename = "events.hepevt";

    // Check if file exists before creating interface
    std::ifstream test(filename);
    if (!test.good()) {
        G4cerr << "ERROR: Cannot open HEPEvt file: " << filename << G4endl;
        G4Exception("MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()",
                    "File001", FatalException,
                    "HEPEvt input file not found");
    }
    test.close();

    fHEPEvtInterface = new G4HEPEvtInterface(filename);
}
```

## PDG Particle Codes

HEPEvt format uses PDG particle codes (Monte Carlo numbering scheme):

| Particle | PDG Code |
|----------|----------|
| gamma    | 22       |
| e-       | 11       |
| e+       | -11      |
| mu-      | 13       |
| mu+      | -13      |
| nu_e     | 12       |
| pi+      | 211      |
| pi-      | -211     |
| pi0      | 111      |
| proton   | 2212     |
| neutron  | 2112     |
| K+       | 321      |
| K-       | -321     |

::: tip PDG Reference
Full PDG code list: https://pdg.lbl.gov/2023/mcdata/mc_particle_id_contents.html
:::

## Thread Safety

### Thread Considerations

File I/O is inherently sequential:
- `std::ifstream` is not thread-safe
- Each thread needs its own file or file position
- Shared `G4HEPEvtInterface` instances will cause conflicts

**Recommended Approach:**
```cpp
// Option 1: Separate file per thread (recommended)
MyPrimaryGeneratorAction::MyPrimaryGeneratorAction()
{
    // Get thread ID
    G4int threadID = G4Threading::G4GetThreadId();

    // Open thread-specific file
    G4String filename = "events_thread" +
                        std::to_string(threadID) + ".hepevt";
    fHEPEvtInterface = new G4HEPEvtInterface(filename.c_str());
}
```

```cpp
// Option 2: Use mutex for shared file (not recommended - slow)
#include "G4AutoLock.hh"

namespace {
    G4Mutex hepevtMutex = G4MUTEX_INITIALIZER;
}

void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    G4AutoLock lock(&hepevtMutex);
    fHEPEvtInterface->GeneratePrimaryVertex(event);
}
```

::: warning Multi-Threading
For multi-threaded applications, use separate input files per worker thread. Shared files require locking and significantly degrade performance.
:::

## Limitations

1. **ASCII Format**: Binary formats would be more efficient for large files
2. **Sequential Access**: Cannot randomly access events
3. **No Rewind**: File not rewound automatically at end
4. **Limited Metadata**: No run/event numbers, weights, or other metadata
5. **Position Fixed**: Vertex position set once, not read from file

## Alternatives

For more advanced event file formats, consider:

- **HepMC**: Modern C++ event record (use HepMC interface classes)
- **HDF5**: Binary format with random access
- **ROOT**: ROOT file format with TTree
- **LCIO**: Linear Collider I/O format
- **EDM4hep**: Event Data Model for HEP experiments

## See Also

- [G4VPrimaryGenerator](g4vprimarygenerator.md) - Base class
- [G4ParticleGun](g4particlegun.md) - Simple particle gun
- [G4GeneralParticleSource](g4generalparticlesource.md) - GPS alternative
- [G4VUserPrimaryGeneratorAction](../../../run/api/g4vuserprimarygeneratoraction.md) - User action interface
- [G4PrimaryParticle](g4primaryparticle.md) - Particle class
- [G4PrimaryVertex](g4primaryvertex.md) - Vertex class
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4HEPEvtInterface.hh`
- Source: `source/event/src/G4HEPEvtInterface.cc`
- Particle: `source/event/include/G4HEPEvtParticle.hh`
:::
