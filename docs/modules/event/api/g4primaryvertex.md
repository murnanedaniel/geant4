# G4PrimaryVertex API Documentation

## Overview

`G4PrimaryVertex` represents a primary vertex in space-time where primary particles originate. Each vertex has a position (x, y, z), time (t), and associated primary particles. Vertices are created by primary generators and added to `G4Event` objects to initiate event simulation.

::: tip Header File
**Location:** `source/particles/management/include/G4PrimaryVertex.hh`
**Source:** `source/particles/management/src/G4PrimaryVertex.cc`
**Module:** Particles (used by Event module)
:::

## Class Declaration

```cpp
class G4PrimaryVertex
{
  public:
    G4PrimaryVertex() = default;
    G4PrimaryVertex(G4double x0, G4double y0, G4double z0, G4double t0);
    G4PrimaryVertex(G4ThreeVector xyz0, G4double t0);
    virtual ~G4PrimaryVertex();

    G4PrimaryVertex(const G4PrimaryVertex& right);
    G4PrimaryVertex& operator=(const G4PrimaryVertex& right);

    G4bool operator==(const G4PrimaryVertex& right) const;
    G4bool operator!=(const G4PrimaryVertex& right) const;

    void* operator new(size_t);
    void operator delete(void* aPrimaryVertex);

    // ... (methods detailed below)
};
```

## Memory Management

### Custom Allocator
`source/particles/management/include/G4PrimaryVertex.hh:115-126`

Uses `G4Allocator` for efficient memory allocation:

```cpp
inline void* G4PrimaryVertex::operator new(std::size_t)
{
    if (aPrimaryVertexAllocator() == nullptr)
        aPrimaryVertexAllocator() = new G4Allocator<G4PrimaryVertex>;
    return (void*)aPrimaryVertexAllocator()->MallocSingle();
}

inline void G4PrimaryVertex::operator delete(void* aPrimaryVertex)
{
    aPrimaryVertexAllocator()->FreeSingle((G4PrimaryVertex*)aPrimaryVertex);
}
```

::: info Allocator Benefit
Custom allocator provides faster allocation/deallocation than standard heap management, critical for high-event-rate simulations.
:::

## Constructors and Destructor

### Default Constructor
`source/particles/management/include/G4PrimaryVertex.hh:54`

```cpp
G4PrimaryVertex() = default;
```

Creates vertex at origin (0, 0, 0) with t = 0.

### Parametrized Constructor (Coordinates)
`source/particles/management/include/G4PrimaryVertex.hh:55`

```cpp
G4PrimaryVertex(G4double x0, G4double y0, G4double z0, G4double t0);
```

**Parameters:**
- `x0`, `y0`, `z0`: Spatial coordinates (length units)
- `t0`: Time coordinate (time units)

**Example:**
```cpp
// Create vertex at (10 cm, 5 cm, 0) at time 0.5 ns
G4PrimaryVertex* vertex = new G4PrimaryVertex(
    10*cm, 5*cm, 0*cm, 0.5*ns);
```

### Parametrized Constructor (Vector)
`source/particles/management/include/G4PrimaryVertex.hh:56`

```cpp
G4PrimaryVertex(G4ThreeVector xyz0, G4double t0);
```

**Parameters:**
- `xyz0`: Position vector
- `t0`: Time coordinate

**Example:**
```cpp
G4ThreeVector position(10*cm, 5*cm, 0*cm);
G4PrimaryVertex* vertex = new G4PrimaryVertex(position, 0*ns);
```

### Destructor
`source/particles/management/include/G4PrimaryVertex.hh:59`

```cpp
virtual ~G4PrimaryVertex();
```

**Behavior:**
- Deletes all associated primary particles
- Deletes linked vertices (if any)
- Deletes user information

::: warning Ownership
Vertex owns its particles. They are automatically deleted.
:::

### Copy Constructor and Assignment
`source/particles/management/include/G4PrimaryVertex.hh:62-63`

```cpp
G4PrimaryVertex(const G4PrimaryVertex& right);
G4PrimaryVertex& operator=(const G4PrimaryVertex& right);
```

**Behavior:**
- Deep copy of all particles
- Deep copy of linked vertices
- User information NOT copied (set to `nullptr`)

## Position and Time

### GetPosition()
`source/particles/management/include/G4PrimaryVertex.hh:128-131`

```cpp
inline G4ThreeVector GetPosition() const;
```

**Returns:** Position as `G4ThreeVector`

**Example:**
```cpp
G4ThreeVector pos = vertex->GetPosition();
G4cout << "Vertex at (" << pos.x()/cm << ", "
       << pos.y()/cm << ", " << pos.z()/cm << ") cm" << G4endl;
```

### SetPosition()
`source/particles/management/include/G4PrimaryVertex.hh:133-138`

```cpp
inline void SetPosition(G4double x0, G4double y0, G4double z0);
```

**Parameters:**
- `x0`, `y0`, `z0`: New position coordinates

**Example:**
```cpp
vertex->SetPosition(15*cm, 10*cm, 5*cm);
```

### GetX0() / GetY0() / GetZ0()
`source/particles/management/include/G4PrimaryVertex.hh:140-153`

```cpp
inline G4double GetX0() const;
inline G4double GetY0() const;
inline G4double GetZ0() const;
```

**Returns:** Individual coordinate components

**Example:**
```cpp
G4double x = vertex->GetX0();
G4double y = vertex->GetY0();
G4double z = vertex->GetZ0();
```

### GetT0() / SetT0()
`source/particles/management/include/G4PrimaryVertex.hh:155-163`

```cpp
inline G4double GetT0() const;
inline void SetT0(G4double t0);
```

**Purpose:** Get/set time coordinate of vertex

**Example:**
```cpp
// Set vertex time to 1 nanosecond
vertex->SetT0(1*ns);

// Get vertex time
G4double time = vertex->GetT0();
```

::: tip Time Units
Remember to use Geant4 unit system (e.g., `ns`, `microsecond`).
:::

## Particle Management

### SetPrimary()
`source/particles/management/include/G4PrimaryVertex.hh:170-180`

```cpp
inline void SetPrimary(G4PrimaryParticle* pp);
```

**Parameters:**
- `pp`: Pointer to primary particle to add

**Behavior:**
- Adds particle to linked list
- Updates particle count
- Maintains tail pointer for efficient appending

**Implementation:**
```cpp
inline void G4PrimaryVertex::SetPrimary(G4PrimaryParticle* pp)
{
    if (theParticle == nullptr) {
        theParticle = pp;
    }
    else {
        theTail->SetNext(pp);
    }
    theTail = pp;
    ++numberOfParticle;
}
```

**Example:**
```cpp
G4PrimaryVertex* vertex = new G4PrimaryVertex(0, 0, 0, 0);

// Add first particle
G4PrimaryParticle* electron = new G4PrimaryParticle(
    G4Electron::Definition());
vertex->SetPrimary(electron);

// Add second particle
G4PrimaryParticle* positron = new G4PrimaryParticle(
    G4Positron::Definition());
vertex->SetPrimary(positron);
```

### GetPrimary()
`source/particles/management/include/G4PrimaryVertex.hh:84`

```cpp
G4PrimaryParticle* GetPrimary(G4int i = 0) const;
```

**Parameters:**
- `i`: Particle index (0-based). Default = 0

**Returns:**
- Pointer to i-th primary particle
- `nullptr` if index out of range

**Example:**
```cpp
// Get first particle
G4PrimaryParticle* firstParticle = vertex->GetPrimary(0);

// Iterate all particles
for (G4int i = 0; i < vertex->GetNumberOfParticle(); ++i) {
    G4PrimaryParticle* particle = vertex->GetPrimary(i);
    ProcessParticle(particle);
}

// Alternative: iterate via linked list
G4PrimaryParticle* particle = vertex->GetPrimary();
while (particle) {
    ProcessParticle(particle);
    particle = particle->GetNext();
}
```

### GetNumberOfParticle()
`source/particles/management/include/G4PrimaryVertex.hh:165-168`

```cpp
inline G4int GetNumberOfParticle() const;
```

**Returns:** Number of primary particles in this vertex

**Example:**
```cpp
G4int nParticles = vertex->GetNumberOfParticle();
G4cout << "Vertex has " << nParticles << " particles" << G4endl;
```

## Vertex Linking

Vertices can be linked together in a list structure:

### SetNext()
`source/particles/management/include/G4PrimaryVertex.hh:182-191`

```cpp
inline void SetNext(G4PrimaryVertex* nv);
```

**Parameters:**
- `nv`: Next vertex to link

**Behavior:**
- Links vertices in a chain
- Maintains tail pointer for efficient appending

**Example:**
```cpp
G4PrimaryVertex* vertex1 = new G4PrimaryVertex(0, 0, 0, 0*ns);
G4PrimaryVertex* vertex2 = new G4PrimaryVertex(5*cm, 0, 0, 1*ns);
G4PrimaryVertex* vertex3 = new G4PrimaryVertex(0, 5*cm, 0, 2*ns);

vertex1->SetNext(vertex2);
vertex1->SetNext(vertex3);  // Automatically appended to chain
```

### GetNext()
`source/particles/management/include/G4PrimaryVertex.hh:199-202`

```cpp
inline G4PrimaryVertex* GetNext() const;
```

**Returns:** Pointer to next vertex in chain, or `nullptr` if last

**Example:**
```cpp
// Iterate through vertex chain
G4PrimaryVertex* vertex = firstVertex;
while (vertex) {
    ProcessVertex(vertex);
    vertex = vertex->GetNext();
}
```

### ClearNext()
`source/particles/management/include/G4PrimaryVertex.hh:193-197`

```cpp
inline void ClearNext();
```

**Purpose:** Remove links to subsequent vertices (without deleting them)

**Example:**
```cpp
vertex->ClearNext();  // Unlink from chain
```

::: warning Memory Management
`ClearNext()` doesn't delete vertices, just removes links. Manage memory carefully.
:::

## Vertex Weight

### GetWeight() / SetWeight()
`source/particles/management/include/G4PrimaryVertex.hh:204-212`

```cpp
inline G4double GetWeight() const;
inline void SetWeight(G4double w);
```

**Purpose:** Statistical weight for variance reduction techniques

**Default:** 1.0

**Example:**
```cpp
// Set weight for importance sampling
vertex->SetWeight(2.5);

// Retrieve weight for analysis
G4double weight = vertex->GetWeight();
```

::: tip Usage
Weights are used in variance reduction schemes and biased sampling techniques.
:::

## User Information

### SetUserInformation() / GetUserInformation()
`source/particles/management/include/G4PrimaryVertex.hh:214-222`

```cpp
inline void SetUserInformation(G4VUserPrimaryVertexInformation* info);
inline G4VUserPrimaryVertexInformation* GetUserInformation() const;
```

**Purpose:** Attach custom user-defined data to vertex

**Example:**
```cpp
// Define custom vertex information
class MyVertexInfo : public G4VUserPrimaryVertexInformation {
public:
    void Print() const override {
        G4cout << "Vertex type: " << vertexType << G4endl;
    }

    G4int vertexType;
    G4String generatorName;
};

// Attach to vertex
MyVertexInfo* info = new MyVertexInfo();
info->vertexType = 1;
info->generatorName = "BeamPipe";
vertex->SetUserInformation(info);

// Retrieve later
MyVertexInfo* retrievedInfo =
    dynamic_cast<MyVertexInfo*>(vertex->GetUserInformation());
```

::: tip Ownership
Vertex takes ownership of user information. Will be deleted with vertex.
:::

## Utility Methods

### Print()
`source/particles/management/include/G4PrimaryVertex.hh:93`

```cpp
void Print() const;
```

**Purpose:** Print vertex information to `G4cout`

**Example:**
```cpp
vertex->Print();
// Output includes:
// - Position and time
// - Number of particles
// - Particle details
```

## Comparison Operators

### operator==() / operator!=()
`source/particles/management/include/G4PrimaryVertex.hh:66-67`

```cpp
G4bool operator==(const G4PrimaryVertex& right) const;
G4bool operator!=(const G4PrimaryVertex& right) const;
```

**Purpose:** Compare vertices for equality

**Behavior:**
- Compares position (X0, Y0, Z0)
- Compares time (T0)
- Compares weight
- Compares number of particles
- Deep comparison of particle properties

## Data Members

### Private Members
`source/particles/management/include/G4PrimaryVertex.hh:95-107`

```cpp
private:
    G4double X0 = 0.0;
    G4double Y0 = 0.0;
    G4double Z0 = 0.0;
    G4double T0 = 0.0;
    G4PrimaryParticle* theParticle = nullptr;
    G4PrimaryParticle* theTail = nullptr;
    G4PrimaryVertex* nextVertex = nullptr;
    G4PrimaryVertex* tailVertex = nullptr;
    G4double Weight0 = 1.0;
    G4VUserPrimaryVertexInformation* userInfo = nullptr;
    G4int numberOfParticle = 0;
```

## Complete Example

### Basic Usage

```cpp
// Create vertex at detector entrance
G4ThreeVector position(-50*cm, 0, 0);
G4double time = 0*ns;
G4PrimaryVertex* vertex = new G4PrimaryVertex(position, time);

// Add primary electron
G4PrimaryParticle* electron = new G4PrimaryParticle(
    G4Electron::Definition());
electron->SetKineticEnergy(5*GeV);
electron->SetMomentumDirection(G4ThreeVector(1, 0, 0));
vertex->SetPrimary(electron);

// Add to event
anEvent->AddPrimaryVertex(vertex);
```

### Multiple Particles per Vertex

```cpp
// Decay at rest: create multiple particles from same vertex
G4PrimaryVertex* decayVertex = new G4PrimaryVertex(0, 0, 0, 0*ns);

// Electron
G4PrimaryParticle* electron = new G4PrimaryParticle(
    G4Electron::Definition(), px1, py1, pz1);
decayVertex->SetPrimary(electron);

// Positron
G4PrimaryParticle* positron = new G4PrimaryParticle(
    G4Positron::Definition(), px2, py2, pz2);
decayVertex->SetPrimary(positron);

// Gamma
G4PrimaryParticle* gamma = new G4PrimaryParticle(
    G4Gamma::Definition(), px3, py3, pz3);
decayVertex->SetPrimary(gamma);

anEvent->AddPrimaryVertex(decayVertex);
```

### Multiple Vertices (Pile-up Simulation)

```cpp
void GeneratePileupEvent(G4Event* anEvent)
{
    const G4int nVertices = 5;  // Simulate pile-up

    for (G4int i = 0; i < nVertices; ++i) {
        // Randomize vertex position and time
        G4double x = GenerateBeamX();
        G4double y = GenerateBeamY();
        G4double z = 0;
        G4double t = G4UniformRand() * 25*ns;  // 25 ns bunch crossing

        G4PrimaryVertex* vertex = new G4PrimaryVertex(x, y, z, t);

        // Add particles to this vertex
        G4PrimaryParticle* particle = GeneratePrimaryParticle();
        vertex->SetPrimary(particle);

        // Set weight for pile-up analysis
        vertex->SetWeight(1.0 / nVertices);

        anEvent->AddPrimaryVertex(vertex);
    }
}
```

### Vertex Iteration

```cpp
void AnalyzeEvent(const G4Event* event)
{
    G4int nVertex = event->GetNumberOfPrimaryVertex();
    G4cout << "Event has " << nVertex << " primary vertices" << G4endl;

    for (G4int iv = 0; iv < nVertex; ++iv) {
        G4PrimaryVertex* vertex = event->GetPrimaryVertex(iv);

        // Vertex properties
        G4ThreeVector pos = vertex->GetPosition();
        G4double time = vertex->GetT0();
        G4double weight = vertex->GetWeight();

        G4cout << "Vertex " << iv << ":"
               << "\n  Position: " << pos/cm << " cm"
               << "\n  Time: " << time/ns << " ns"
               << "\n  Weight: " << weight
               << "\n  Particles: " << vertex->GetNumberOfParticle()
               << G4endl;

        // Iterate particles in this vertex
        G4PrimaryParticle* particle = vertex->GetPrimary();
        while (particle) {
            AnalyzeParticle(particle);
            particle = particle->GetNext();
        }
    }
}
```

### Custom Vertex Information

```cpp
class MyVertexInfo : public G4VUserPrimaryVertexInformation
{
public:
    void Print() const override {
        G4cout << "Generator: " << generatorName
               << ", Type: " << interactionType << G4endl;
    }

    G4String generatorName;
    G4int interactionType;
    G4ThreeVector initialMomentum;
};

// In primary generator action
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* anEvent)
{
    G4PrimaryVertex* vertex = new G4PrimaryVertex(0, 0, 0, 0);

    // Attach custom information
    MyVertexInfo* info = new MyVertexInfo();
    info->generatorName = "BeamPipe";
    info->interactionType = 2;  // e.g., quasi-elastic scattering
    info->initialMomentum = G4ThreeVector(0, 0, 5*GeV);
    vertex->SetUserInformation(info);

    // Add particles...
    G4PrimaryParticle* particle = CreatePrimaryParticle();
    vertex->SetPrimary(particle);

    anEvent->AddPrimaryVertex(vertex);
}

// Later retrieval and analysis
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    G4PrimaryVertex* vertex = event->GetPrimaryVertex(0);
    if (vertex) {
        MyVertexInfo* info =
            dynamic_cast<MyVertexInfo*>(vertex->GetUserInformation());
        if (info) {
            G4cout << "Processing " << info->generatorName
                   << " vertex" << G4endl;
        }
    }
}
```

## Thread Safety

### Thread-Local Vertices

- Vertices created per-event (thread-local in MT mode)
- No synchronization needed within event processing
- Safe to use from user actions

## Performance Notes

1. **Custom Allocator**: Fast allocation/deallocation
2. **Linked Lists**: Particles and vertices stored as linked lists
3. **Deep Copy**: Copy constructor performs deep copy (expensive)
4. **Memory**: Vertex owns particles - automatic cleanup

## Common Patterns

### Beam Simulation

```cpp
// Gaussian beam profile
G4double beamSigmaX = 1*mm;
G4double beamSigmaY = 1*mm;

G4double x = G4RandGauss::shoot(0, beamSigmaX);
G4double y = G4RandGauss::shoot(0, beamSigmaY);
G4double z = -100*cm;  // Upstream of detector
G4double t = 0;

G4PrimaryVertex* vertex = new G4PrimaryVertex(x, y, z, t);
```

### Cosmic Ray Simulation

```cpp
// Generate cosmic rays from top of detector
G4double worldSize = 10*m;
G4double x = (G4UniformRand() - 0.5) * worldSize;
G4double y = worldSize/2;  // Top surface
G4double z = (G4UniformRand() - 0.5) * worldSize;
G4double t = 0;

G4PrimaryVertex* vertex = new G4PrimaryVertex(x, y, z, t);

// Downward-going particles
G4ThreeVector direction(0, -1, 0);
// ... add particle with downward direction
```

## See Also

- [G4Event](g4event.md) - Event container
- [G4PrimaryParticle](g4primaryparticle.md) - Primary particle class
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/particles/management/include/G4PrimaryVertex.hh`
- Source: `source/particles/management/src/G4PrimaryVertex.cc`
:::
