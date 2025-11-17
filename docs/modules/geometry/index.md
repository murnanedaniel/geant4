# Geometry Module

**Location**: `source/geometry/`

## Overview

The geometry module is the largest and most complex component of Geant4, providing a comprehensive infrastructure for defining detector geometries, solid shapes, volume hierarchies, particle navigation, and magnetic field integration. This module handles all aspects of spatial representation and particle tracking through complex detector structures.

## Module Statistics

- **Subdirectories**: 10 (management, volumes, navigation, magneticfield, solids/CSG, solids/Boolean, solids/specific, divisions, biasing)
- **Total Classes**: ~308
- **Core Classes**: 15+ fundamental base classes
- **Lines of Code**: ~150,000+ lines
- **Primary Purpose**: Detector geometry modeling and particle navigation

## Architecture

The geometry module follows a sophisticated hierarchical architecture that separates shape definition, logical volumes, physical placements, and navigation:

```
G4VSolid (shape definition)
    ↓
G4LogicalVolume (volume + material + properties)
    ↓
G4VPhysicalVolume (positioned volume in space)
    ↓
G4Navigator (particle tracking through volumes)
```

### Design Principles

1. **Shape-Volume-Placement Separation**: Clear distinction between geometric shape, logical properties, and physical placement
2. **Hierarchical Volume Tree**: Nested volume structure (mother-daughter relationships)
3. **Multiple Placement Types**: Support for simple placement, replication, parameterization, and assembly
4. **Navigation Abstraction**: Pluggable navigation strategies (normal, voxelized, replicated, parameterized)
5. **Global Stores**: Singleton registries for all geometry objects
6. **Thread Safety**: Per-thread geometry workspace for multi-threaded simulation
7. **Field Integration**: Sophisticated particle propagation in electromagnetic fields

## Module Organization

### 1. [Management](#management-49-classes) (`management/`)
**Core geometry framework and base classes**
- Abstract base classes (G4VSolid, G4LogicalVolume, G4VPhysicalVolume)
- Global stores and registries
- Touchable handles and navigation history
- Voxelization infrastructure
- Region management
- Geometry tools and utilities

### 2. [Volumes](#volumes-12-classes) (`volumes/`)
**Concrete volume placement implementations**
- Simple placement (G4PVPlacement)
- Replication (G4PVReplica)
- Parameterization (G4PVParameterised)
- Assembly volumes
- Optical surfaces

### 3. [Solids/CSG](#solidscsg-21-classes) (`solids/CSG/`)
**Constructive Solid Geometry primitives**
- Basic shapes: Box, Tube, Sphere, Cone, Torus
- Simple polyhedra: Trapezoid, Parallelepiped
- CSG solid base class

### 4. [Solids/Boolean](#solidsboolean-8-classes) (`solids/Boolean/`)
**Boolean combinations of solids**
- Union, Intersection, Subtraction operations
- Multi-union for efficient complex shapes
- Displaced and scaled solids

### 5. [Solids/Specific](#solidsspecific-56-classes) (`solids/specific/`)
**Specialized and complex solids**
- Revolution solids: Polycone, Polyhedra
- Twisted solids: TwistedBox, TwistedTubs
- Tessellated solids: Arbitrary mesh-defined shapes
- Specialized shapes: Ellipsoid, Paraboloid, Tetrahedron
- Extruded solids

### 6. [Navigation](#navigation-31-classes) (`navigation/`)
**Particle tracking through geometry**
- Navigator and transportation manager
- Multiple navigation strategies
- Safety calculations
- Path finding in fields
- Voxel optimization
- Multi-navigator (parallel worlds)

### 7. [Magnetic Field](#magneticfield-103-classes) (`magneticfield/`)
**Field propagation and integration**
- Field definitions (magnetic, electric, gravity)
- Equations of motion
- Integration steppers (Runge-Kutta, QSS, Helix)
- Integration drivers
- Chord finder
- Field manager

### 8. [Divisions](#divisions-11-classes) (`divisions/`)
**Systematic volume subdivision**
- Division parameterization
- Shape-specific division implementations
- Replica slice management

### 9. [Biasing](#biasing-17-classes) (`biasing/`)
**Importance sampling for variance reduction**
- Geometry cells
- Importance stores
- Weight windows
- Splitting algorithms

## Core Classes

### Foundation: The Geometry Hierarchy

#### [G4VSolid](./api/g4vsolid.md)
Abstract base class for all geometric solids. Defines the interface for distance calculations, inside/outside tests, and surface normals.

**Key Features**:
- Pure virtual distance methods (DistanceToIn, DistanceToOut)
- Inside() test for point location
- SurfaceNormal() for surface interactions
- Extent calculation for optimization
- Visualization support
- Global solid store

**File**: `source/geometry/management/include/G4VSolid.hh`

**Derived Classes**: All CSG solids, Boolean solids, and specific solids

#### [G4LogicalVolume](./api/g4logicalvolume.md)
Represents a volume with associated material, sensitivity, field, and daughter volumes. The logical volume is the link between shape and physical properties.

**Key Features**:
- Associates G4VSolid with G4Material
- Contains daughter volumes
- Field manager attachment
- Region and sensitivity assignment
- Stores and user limits
- Voxelization management
- Thread-safe design

**File**: `source/geometry/management/include/G4LogicalVolume.hh`

#### [G4VPhysicalVolume](./api/g4vphysicalvolume.md)
Abstract base class for positioned volumes. Represents a placement of a logical volume in space with specific rotation and translation.

**Key Features**:
- Links to mother and logical volume
- Copy number for identification
- Virtual methods for placement queries
- Support for replicas and parameterization

**File**: `source/geometry/management/include/G4VPhysicalVolume.hh`

#### [G4PVPlacement](./api/g4pvplacement.md)
Concrete implementation for simple volume placement. The most common way to position volumes in Geant4.

**Key Features**:
- Direct position and rotation specification
- Support for reflection matrices
- Optional overlap checking
- Multiple constructors for convenience

**File**: `source/geometry/volumes/include/G4PVPlacement.hh`

### CSG Primitives

#### [G4Box](./api/g4box.md)
Rectangular box (cuboid) solid. The simplest and most commonly used solid.

**Key Features**:
- Defined by half-widths (dx, dy, dz)
- Fast inside/outside tests
- Efficient navigation
- Aligned with coordinate axes

**File**: `source/geometry/solids/CSG/include/G4Box.hh`

#### [G4Tubs](./api/g4tubs.md)
Tube or cylindrical section solid. Used for cylindrical detectors, pipes, and barrel geometries.

**Key Features**:
- Inner and outer radius
- Half-length in Z
- Phi segment support
- Efficient for cylindrical symmetry

**File**: `source/geometry/solids/CSG/include/G4Tubs.hh`

#### [G4Cons](./api/g4cons.md)
Cone or conical section solid. Useful for tapered geometries and calorimeter sections.

**Key Features**:
- Inner and outer radii at both ends
- Half-length in Z
- Phi segment support
- Smooth radius variation

**File**: `source/geometry/solids/CSG/include/G4Cons.hh`

#### [G4Sphere](./api/g4sphere.md)
Spherical shell solid. Used for spherical detectors and shells.

**Key Features**:
- Inner and outer radius
- Theta and phi angle segments
- Full or partial spheres
- Polar angle control

**File**: `source/geometry/solids/CSG/include/G4Sphere.hh`

### Boolean Operations

#### [G4UnionSolid](./api/g4unionsolid.md)
Union (OR) of two solids. Creates a solid that is the combination of two shapes.

**File**: `source/geometry/solids/Boolean/include/G4UnionSolid.hh`

#### [G4SubtractionSolid](./api/g4subtractionsolid.md)
Subtraction of one solid from another. Creates holes or cutouts.

**File**: `source/geometry/solids/Boolean/include/G4SubtractionSolid.hh`

#### [G4IntersectionSolid](./api/g4intersectionsolid.md)
Intersection (AND) of two solids. Creates a solid that is only the overlapping region.

**File**: `source/geometry/solids/Boolean/include/G4IntersectionSolid.hh`

### Navigation

#### [G4Navigator](./api/g4navigator.md)
Primary class for particle navigation through geometry. Locates volumes, computes distances, and handles boundary crossings.

**Key Features**:
- Volume location (LocateGlobalPointAndSetup)
- Distance to next boundary (ComputeStep)
- Safety calculation (ComputeSafety)
- Boundary crossing detection
- Navigation history management
- Optimization caching

**File**: `source/geometry/navigation/include/G4Navigator.hh`

#### [G4TransportationManager](./api/g4transportationmanager.md)
Singleton manager for navigators. Manages multiple parallel geometries and worlds.

**Key Features**:
- Creates and manages G4Navigator instances
- Handles parallel worlds
- Provides access to world volumes
- Field propagator management

**File**: `source/geometry/navigation/include/G4TransportationManager.hh`

### Advanced Placement

#### [G4PVReplica](./api/g4pvreplica.md)
Replicated volume for systematic linear divisions. Efficient for repetitive structures like calorimeter cells.

**Key Features**:
- Linear divisions along X, Y, Z, Rho, Phi axes
- Specialized navigation algorithm
- Memory efficient (single logical volume)
- Fast daughter identification

**File**: `source/geometry/volumes/include/G4PVReplica.hh`

#### [G4PVParameterised](./api/g4pvparameterised.md)
Parameterized volume for custom positioning. Allows arbitrary positioning via user-defined parameterization.

**Key Features**:
- Custom positioning via G4VPVParameterisation
- Support for varying shapes
- Flexible parameterization schemes
- Optimizable navigation

**File**: `source/geometry/volumes/include/G4PVParameterised.hh`

#### [G4VPVParameterisation](./api/g4vpvparameterisation.md)
Abstract base class for volume parameterization. Users derive from this to define custom positioning.

**File**: `source/geometry/management/include/G4VPVParameterisation.hh`

### Region Management

#### [G4Region](./api/g4region.md)
Represents a region of volumes with common production cuts. Used for optimizing physics processes in different detector areas.

**Key Features**:
- Groups logical volumes
- Assigns production cuts
- Fast simulation attachment
- User limits association

**File**: `source/geometry/management/include/G4Region.hh`

### Magnetic Field

#### [G4MagneticField](./api/g4magneticfield.md)
Base class for magnetic field definitions. Defines the field vector at any point in space.

**File**: `source/geometry/magneticfield/include/G4MagneticField.hh`

#### [G4FieldManager](./api/g4fieldmanager.md)
Manages field propagation for a logical volume or region. Configures integration parameters and accuracy.

**Key Features**:
- Field association
- Chord finder configuration
- Integration accuracy control
- Delta intersection/one step limits

**File**: `source/geometry/magneticfield/include/G4FieldManager.hh`

#### [G4PropagatorInField](./api/g4propagatorinfield.md)
Propagates particles through electromagnetic fields. Handles curved trajectories and boundary finding.

**File**: `source/geometry/navigation/include/G4PropagatorInField.hh`

### Voxelization

#### [G4SmartVoxelHeader](./api/g4smartvoxelheader.md)
Smart voxelization structure for optimizing navigation. Automatically creates spatial subdivision for complex volumes.

**Key Features**:
- Automatic voxel creation
- Recursive subdivision
- Optimizes daughter volume lookup
- Memory efficient structure

**File**: `source/geometry/management/include/G4SmartVoxelHeader.hh`

## Key Architectural Patterns

### 1. Shape-Volume-Placement Pattern

```
┌─────────────┐
│   G4VSolid  │ ← Shape definition (geometry)
└──────┬──────┘
       │ is a
       ▼
┌──────────────────┐
│ G4LogicalVolume  │ ← Volume (shape + material + properties)
└────────┬─────────┘
         │ placed as
         ▼
┌───────────────────────┐
│ G4VPhysicalVolume     │ ← Positioned instance (transformation)
└───────────────────────┘
```

### 2. Navigation Strategy Pattern

Different navigation algorithms are used based on volume type:
- **Normal Navigation**: For simple volumes with few daughters
- **Voxel Navigation**: For volumes with many daughters (automatic optimization)
- **Replica Navigation**: For replicated volumes (specialized algorithm)
- **Parameterized Navigation**: For parameterized volumes (custom positioning)

### 3. Store Pattern

All geometry objects are registered in global singleton stores:
- `G4SolidStore` - All solids
- `G4LogicalVolumeStore` - All logical volumes
- `G4PhysicalVolumeStore` - All physical volumes
- `G4RegionStore` - All regions

### 4. Touchable Pattern

Navigation history is tracked through "touchables" (G4VTouchable, G4TouchableHistory):
- Stores path from world to current volume
- Provides transformation hierarchy
- Enables reverse transformation lookups
- Used in sensitive detectors

## Usage Patterns

### Basic Geometry Construction

```cpp
// 1. Create a solid
G4Box* worldBox = new G4Box("World", 1*m, 1*m, 1*m);

// 2. Create a logical volume (shape + material)
G4LogicalVolume* worldLog = new G4LogicalVolume(worldBox,
                                                 air,
                                                 "World");

// 3. Create a physical volume (placement)
G4VPhysicalVolume* worldPhys = new G4PVPlacement(0,              // no rotation
                                                  G4ThreeVector(), // at origin
                                                  worldLog,        // logical volume
                                                  "World",         // name
                                                  0,               // mother volume
                                                  false,           // no boolean ops
                                                  0,               // copy number
                                                  true);           // check overlaps

// 4. Add daughter volumes
G4Box* detectorBox = new G4Box("Detector", 10*cm, 10*cm, 10*cm);
G4LogicalVolume* detectorLog = new G4LogicalVolume(detectorBox,
                                                    silicon,
                                                    "Detector");
G4VPhysicalVolume* detectorPhys = new G4PVPlacement(0,
                                                     G4ThreeVector(0, 0, 50*cm),
                                                     detectorLog,
                                                     "Detector",
                                                     worldLog,      // mother
                                                     false,
                                                     0,
                                                     true);
```

### Boolean Solids

```cpp
// Create two shapes
G4Box* box = new G4Box("Box", 20*cm, 20*cm, 20*cm);
G4Tubs* cylinder = new G4Tubs("Cylinder", 0, 15*cm, 25*cm, 0, 2*pi);

// Subtract cylinder from box (hole)
G4SubtractionSolid* boxWithHole =
    new G4SubtractionSolid("BoxWithHole", box, cylinder);

// Use in logical volume
G4LogicalVolume* log = new G4LogicalVolume(boxWithHole, aluminum, "BoxLog");
```

### Replicated Volumes

```cpp
// Create calorimeter cell
G4Box* cellBox = new G4Box("Cell", 5*cm, 5*cm, 50*cm);
G4LogicalVolume* cellLog = new G4LogicalVolume(cellBox, lead, "Cell");

// Replicate along X axis (10 cells)
G4VPhysicalVolume* cellReplica =
    new G4PVReplica("CellReplica",    // name
                    cellLog,           // logical volume
                    motherLog,         // mother volume
                    kXAxis,            // axis
                    10,                // number of replicas
                    10*cm);            // width of each replica
```

### Parameterized Volumes

```cpp
// Define custom parameterization
class MyParameterisation : public G4VPVParameterisation {
public:
    void ComputeTransformation(const G4int copyNo,
                               G4VPhysicalVolume* physVol) const override {
        // Custom positioning logic
        G4double x = copyNo * 10*cm;
        physVol->SetTranslation(G4ThreeVector(x, 0, 0));
    }

    void ComputeDimensions(G4Box& box, const G4int copyNo,
                          const G4VPhysicalVolume*) const override {
        // Custom sizing logic
        G4double size = 5*cm + copyNo*mm;
        box.SetXHalfLength(size);
        box.SetYHalfLength(size);
        box.SetZHalfLength(size);
    }
};

// Use parameterization
MyParameterisation* param = new MyParameterisation();
new G4PVParameterised("ParameterisedVolume",
                      detectorLog,
                      motherLog,
                      kUndefined,    // axis
                      100,            // number of copies
                      param);         // parameterization
```

### Magnetic Field Setup

```cpp
// Create uniform magnetic field (1 Tesla in Z direction)
G4UniformMagField* magField =
    new G4UniformMagField(G4ThreeVector(0., 0., 1.*tesla));

// Create field manager
G4FieldManager* fieldMgr =
    new G4FieldManager(magField);

// Set integration parameters
fieldMgr->SetDetectorField(magField);
fieldMgr->CreateChordFinder(magField);

// Assign to logical volume
detectorLog->SetFieldManager(fieldMgr, true);  // propagate to daughters
```

### Region Setup for Production Cuts

```cpp
// Create region
G4Region* detectorRegion = new G4Region("DetectorRegion");

// Assign logical volumes to region
detectorRegion->AddRootLogicalVolume(detectorLog);

// Set production cuts
G4ProductionCuts* cuts = new G4ProductionCuts();
cuts->SetProductionCut(1*mm, "gamma");
cuts->SetProductionCut(1*mm, "e-");
cuts->SetProductionCut(1*mm, "e+");
detectorRegion->SetProductionCuts(cuts);
```

## Key Concepts

### Volume Hierarchy

Geant4 geometry is organized as a tree:
- **World Volume**: Top-level volume (no mother), must contain all other volumes
- **Mother-Daughter**: Volumes are placed inside "mother" volumes
- **Containment**: Daughters must be fully contained within mothers (no overlaps)
- **Coordinate Systems**: Each volume has its own local coordinate system

### Solid Types

1. **CSG Primitives**: Basic shapes (Box, Tube, Sphere, Cone, etc.)
2. **Boolean Solids**: Combinations of solids (Union, Subtraction, Intersection)
3. **Specific Solids**: Complex shapes (Polycone, Polyhedra, Tessellated, Twisted)
4. **Reflected Solids**: Mirror reflections of existing solids

### Placement Types

1. **Simple Placement** (G4PVPlacement): Direct positioning with rotation and translation
2. **Replication** (G4PVReplica): Linear divisions along an axis
3. **Parameterization** (G4PVParameterised): Custom positioning and sizing
4. **Assembly** (G4AssemblyVolume): Group of volumes placed together
5. **Division** (G4PVDivision): Systematic subdivision based on shape

### Navigation Optimization

1. **Voxelization**: Automatic spatial subdivision for volumes with many daughters
2. **Safety**: Cached distance to nearest boundary (avoids redundant calculations)
3. **History**: Efficient tracking of volume path (avoids repeated location)
4. **Smart Voxels**: Adaptive voxel structure based on daughter distribution

### Thread Safety

In multi-threaded mode:
- **Shared**: Solids and logical volumes (read-only)
- **Per-Thread**: Physical volumes, navigators, field managers (via workspace)
- **Geom Splitter**: Template for creating per-thread data
- **Master-Worker**: Geometry defined on master thread, cloned to workers

## Performance Considerations

### Optimization Tips

1. **Use Simple Shapes**: Box and Tube are faster than Boolean solids
2. **Avoid Deep Nesting**: Limit volume hierarchy depth
3. **Enable Voxelization**: Automatic for volumes with many daughters
4. **Smart Replicas**: Use G4PVReplica instead of many G4PVPlacement when possible
5. **Optimize Parameterization**: Fast ComputeTransformation() is critical
6. **Check Overlaps**: Use overlap checking during development, disable in production
7. **Safety Calculations**: Important for performance in complex geometries
8. **Field Accuracy**: Balance accuracy vs. performance in field integration

### Common Pitfalls

1. **Overlapping Volumes**: Causes navigation errors and crashes
2. **Volumes Outside Mother**: Daughters must be fully contained
3. **Too Many Booleans**: Deep Boolean trees are slow
4. **Unnecessary Parameterization**: Use replicas when positioning is linear
5. **Field Integration Step**: Too small → slow, too large → inaccurate
6. **No Safety Optimization**: Repeated safety calculations are expensive

## Build Configuration

**CMakeLists.txt**:
- `source/geometry/management/CMakeLists.txt`
- `source/geometry/volumes/CMakeLists.txt`
- `source/geometry/navigation/CMakeLists.txt`
- `source/geometry/magneticfield/CMakeLists.txt`
- `source/geometry/solids/CSG/CMakeLists.txt`
- `source/geometry/solids/Boolean/CMakeLists.txt`
- `source/geometry/solids/specific/CMakeLists.txt`
- `source/geometry/divisions/CMakeLists.txt`
- `source/geometry/biasing/CMakeLists.txt`

The geometry module is a required core dependency for all Geant4 applications.

## Historical Development

The geometry system has evolved significantly since Geant4's inception:

- **1995-1996**: Initial design and implementation of CSG solids and volume hierarchy
- **1997**: Boolean solids implementation
- **1998-1999**: Smart voxelization system, navigation optimization
- **2000-2002**: Specific solids (polycone, polyhedra, extruded)
- **2003-2004**: Reflected solids, assembly volumes
- **2005**: Tessellated solid (arbitrary mesh support)
- **2006-2008**: Multi-threaded geometry support, geometry workspace
- **2009-2010**: USolids integration (VecGeom backend option)
- **2011-2013**: Improved navigation, safety optimizations
- **2014-2015**: QSS integration for field propagation
- **2016-2018**: Performance improvements, parallel geometry enhancements
- **2019-2024**: Continued optimization, new field steppers, enhanced visualization

## Integration with Other Modules

### Materials Module
Logical volumes require G4Material instances to define the medium filling the volume.

**See**: [Materials Module](../materials/)

### Processes Module
Physics processes use geometry to compute interaction lengths and trigger interactions at boundaries.

### Tracking Module
The tracking system uses G4Navigator to transport particles through the geometry.

### Digits & Hits Module
Sensitive detectors use touchables to identify volumes and collect hits.

### Run Module
The run manager initializes geometry and provides access to the world volume.

## References

### Official Documentation
- [Geant4 User's Guide: Detector Definition and Response](http://cern.ch/geant4-userdoc)
- [Geant4 Application Developers Guide: Geometry](http://cern.ch/geant4/support/user_documentation)

### Technical Papers
- "Geant4 Geometry Modelling System" - CHEP 2000
- "Smart Voxels in Geant4" - CHEP 2001
- "Geometry Navigation in Geant4" - IEEE NSS 2004

### External References
- [GDML (Geometry Description Markup Language)](http://gdml.web.cern.ch/)
- [VecGeom - Vectorized Geometry Library](https://gitlab.cern.ch/VecGeom/VecGeom)
- [ROOT TGeo Geometry Package](https://root.cern.ch/doc/master/group__Geometry.html)

## See Also

- [Materials Module](../materials/) - Material definitions used in logical volumes
- [Tracking Module](../tracking/) - Uses navigation for particle transport
- [Event Module](../event/) - Primary particle generation in geometry
- [Processes Module](../processes/) - Physics interactions in volumes
- [Visualization Module](../visualization/) - Geometry visualization and debugging

## Module Files

**Directory Structure**:
```
source/geometry/
├── management/
│   ├── include/              # 49 headers (core classes)
│   └── src/                  # Implementation files
├── volumes/
│   ├── include/              # 12 headers (placement classes)
│   └── src/
├── navigation/
│   ├── include/              # 31 headers (navigation)
│   └── src/
├── magneticfield/
│   ├── include/              # 103 headers (fields)
│   └── src/
├── solids/
│   ├── CSG/
│   │   ├── include/          # 21 headers (primitives)
│   │   └── src/
│   ├── Boolean/
│   │   ├── include/          # 8 headers (Boolean ops)
│   │   └── src/
│   └── specific/
│       ├── include/          # 56 headers (complex shapes)
│       └── src/
├── divisions/
│   ├── include/              # 11 headers (divisions)
│   └── src/
└── biasing/
    ├── include/              # 17 headers (importance sampling)
    └── src/
```

## Quick Reference

| Task | Class | Method |
|------|-------|--------|
| Create box solid | G4Box | `new G4Box(name, dx, dy, dz)` |
| Create tube solid | G4Tubs | `new G4Tubs(name, rMin, rMax, dz, sPhi, dPhi)` |
| Create logical volume | G4LogicalVolume | `new G4LogicalVolume(solid, material, name)` |
| Place volume | G4PVPlacement | `new G4PVPlacement(rotation, position, logVol, name, motherLog, ...)` |
| Create Boolean union | G4UnionSolid | `new G4UnionSolid(name, solid1, solid2, transform)` |
| Create replica | G4PVReplica | `new G4PVReplica(name, logVol, motherLog, axis, nReplicas, width)` |
| Set magnetic field | G4FieldManager | `SetDetectorField(field); CreateChordFinder(field)` |
| Create region | G4Region | `new G4Region(name)` then `AddRootLogicalVolume(logVol)` |
| Set production cuts | G4Region | `SetProductionCuts(cuts)` |
| Get navigator | G4TransportationManager | `Instance()->GetNavigatorForTracking()` |
| Locate point | G4Navigator | `LocateGlobalPointAndSetup(point)` |
| Compute safety | G4Navigator | `ComputeSafety(point)` |

---

::: tip Next Steps
Explore the detailed API documentation for specific classes to learn about their methods and usage patterns. Start with the core hierarchy: [G4VSolid](./api/g4vsolid.md), [G4LogicalVolume](./api/g4logicalvolume.md), and [G4PVPlacement](./api/g4pvplacement.md).
:::
