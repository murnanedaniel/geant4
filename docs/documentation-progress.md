# Documentation Progress

Comprehensive tracking of Geant4 module documentation status.

## Overview

This page tracks the progress of documenting all Geant4 modules, their classes, and APIs. The documentation effort focuses on creating comprehensive, example-rich guides for each module.

::: tip Navigation
Use the [Module Statistics](#module-statistics) table below to see overall progress, or jump to specific module details for class-level tracking.
:::

## Module Statistics

| Module | Classes | Documented | Progress | Status | Priority |
|--------|---------|------------|----------|--------|----------|
| [**materials**](#materials-module) | 44 | 4 | 9% | 🟢 Active | High |
| [**event**](#event-module) | 36 | 4 | 11% | ✅ Current | High |
| [**run**](#run-module) | 15+ | 3 | 20% | ✅ Current | High |
| [**track**](#track-module) | 23 | 0 | 0% | 🔄 Next | High |
| [**tracking**](#tracking-module) | 40+ | 0 | 0% | ⏳ Planned | High |
| **global** | 60+ | 0 | 0% | ⏳ Planned | High |
| [**geometry**](#geometry-module) | 308 | 13 | 4% | 🟢 Active | High |
| **particles** | 200+ | 0 | 0% | ⏳ Planned | High |
| **processes** | 250+ | 0 | 0% | ⏳ Planned | Medium |
| **digits_hits** | 30+ | 0 | 0% | ⏳ Planned | Medium |
| **analysis** | 20+ | 0 | 0% | ⏳ Planned | Low |
| **persistency** | 25+ | 0 | 0% | ⏳ Planned | Low |
| **visualization** | 80+ | 0 | 0% | ⏳ Planned | Low |

**Legend:**
- ✅ **Current**: Recently completed, up-to-date documentation
- 🟢 **Active**: Work in progress
- 🔄 **Next**: Scheduled for next documentation sprint
- ⏳ **Planned**: On the roadmap
- ❌ **Not Started**: Not yet scheduled

## Detailed Progress

### Materials Module

**Location:** `source/materials/`
**Documentation:** [Module Overview](/modules/materials/) | [Visualization Diagram](/visualization#materials-module-class-hierarchy)
**Progress:** 4/44 classes (9%)

#### Documented Classes

| Class | API Docs | Lines | Status |
|-------|----------|-------|--------|
| **G4Isotope** | [📖 API](/modules/materials/api/g4isotope) | 1,250 | ✅ Complete |
| **G4Element** | [📖 API](/modules/materials/api/g4element) | 1,800 | ✅ Complete |
| **G4Material** | [📖 API](/modules/materials/api/g4material) | 2,100 | ✅ Complete |
| **G4IonisParamElm** | [📖 API](/modules/materials/api/g4ionisparamelm) | 800 | ✅ Complete |

#### Pending Classes

<details>
<summary>Click to expand (40 classes)</summary>

**Core Material Classes:**
- G4MaterialPropertiesTable
- G4MaterialPropertyVector
- G4MaterialTable
- G4NistManager
- G4NistElementBuilder
- G4NistMaterialBuilder

**Extended Properties:**
- G4ExtendedMaterial
- G4MaterialPropertiesIndex
- G4OpticalSurface
- G4SurfaceProperty

**Database Classes:**
- G4AtomicShells
- G4ElementData
- G4ElementTable
- G4IsotopeTable

**And 26 more...**

</details>

---

### Event Module

**Location:** `source/event/`
**Documentation:** [Module Overview](/modules/event/) | [Visualization Diagram](/visualization#event-module-class-hierarchy)
**Progress:** 4/36 classes (11%)

#### Documented Classes

| Class | API Docs | Lines | Status |
|-------|----------|-------|--------|
| **G4Event** | [📖 API](/modules/event/api/g4event) | 1,600 | ✅ Complete |
| **G4PrimaryVertex** | [📖 API](/modules/event/api/g4primaryvertex) | 1,100 | ✅ Complete |
| **G4PrimaryParticle** | [📖 API](/modules/event/api/g4primaryparticle) | 1,200 | ✅ Complete |
| **G4EventManager** | [📖 API](/modules/event/api/g4eventmanager) | 900 | ✅ Complete |

#### Pending Classes

<details>
<summary>Click to expand (32 classes)</summary>

**Primary Generation:**
- G4VPrimaryGenerator
- G4ParticleGun
- G4GeneralParticleSource
- G4SingleParticleSource
- G4HEPEvtInterface
- G4HEPEvtParticle

**Stacking:**
- G4StackManager
- G4TrackStack
- G4SmartTrackStack
- G4StackedTrack
- G4UserStackingAction
- G4ClassificationOfNewTrack

**Sub-Event Support:**
- G4SubEvent
- G4SubEventTrackStack

**And 18 more...**

</details>

---

### Run Module

**Location:** `source/run/`
**Documentation:** [Module Overview](/modules/run/) | [Visualization Diagram](/visualization#run-module-class-hierarchy)
**Progress:** 3/15+ classes (20%)

#### Documented Classes

| Class | API Docs | Lines | Status |
|-------|----------|-------|--------|
| **G4RunManager** | [📖 API](/modules/run/api/g4runmanager) | 1,772 | ✅ Complete |
| **G4MTRunManager** | [📖 API](/modules/run/api/g4mtrunmanager) | 1,284 | ✅ Complete |
| **G4Run** | [📖 API](/modules/run/api/g4run) | 776 | ✅ Complete |

#### Pending Classes

<details>
<summary>Click to expand (12+ classes)</summary>

**Run Managers:**
- G4TaskRunManager
- G4WorkerRunManager
- G4WorkerTaskRunManager

**User Actions:**
- G4UserRunAction
- G4VUserActionInitialization
- G4VUserDetectorConstruction
- G4VUserPhysicsList
- G4VUserPrimaryGeneratorAction

**Run Data:**
- G4RunManagerKernel
- G4VUserPhysicsListMessenger

**And more...**

</details>

---

### Track Module

**Location:** `source/track/`
**Documentation:** 🔄 **Next up for documentation**
**Progress:** 0/23 classes (0%)

#### Key Classes to Document

**Core Track Classes:**
- G4Track - Main track container
- G4Step - Step representation
- G4StepPoint - Pre/post step point information

**Enumerations:**
- G4TrackStatus
- G4StepStatus
- G4SteppingControl

**Particle Changes:**
- G4VParticleChange
- G4ParticleChange
- G4ParticleChangeForDecay
- G4ParticleChangeForGamma
- G4ParticleChangeForLoss
- G4ParticleChangeForTransport

**User Extensions:**
- G4VUserTrackInformation
- G4VAuxiliaryTrackInformation

**And 14 more...**

---

### Tracking Module

**Location:** `source/tracking/`
**Progress:** 0/40+ classes (0%)

Planned for future documentation sprint.

---

## Documentation Standards

Each documented module includes:

### Module Overview
- ✅ Architecture diagrams (Mermaid)
- ✅ Purpose and scope
- ✅ Key class descriptions
- ✅ Usage patterns and examples
- ✅ Thread safety considerations
- ✅ Integration with other modules
- ✅ Performance considerations

### Class API Documentation
- ✅ Comprehensive method documentation
- ✅ Source code line references
- ✅ Parameter descriptions
- ✅ Return value documentation
- ✅ Usage examples
- ✅ Code snippets
- ✅ Thread safety notes
- ✅ Performance tips
- ✅ Common patterns

### Infrastructure
- ✅ Navigation integration
- ✅ Sidebar organization
- ✅ Cross-linking between modules
- ✅ Interactive diagrams
- ✅ Search optimization

## Documentation Metrics

### Current Statistics

| Metric | Count |
|--------|-------|
| **Modules Documented** | 3 / 23+ |
| **Classes Documented** | 11 / 400+ |
| **Total Documentation Lines** | ~20,000 |
| **API Reference Pages** | 11 |
| **Module Overview Pages** | 3 |
| **Interactive Diagrams** | 8 |
| **Generated HTML Pages** | 25 |

### Recent Additions

- **2025-11-16**: Event Module - 4 classes, 8,500 lines
- **2025-11-16**: Run Module - 3 classes, 7,300 lines
- **2025-11-16**: Materials Module - 4 classes, 5,950 lines

## Priority Roadmap

### High Priority (Foundation Modules)

These modules are fundamental to Geant4 and should be documented first:

1. ✅ **Materials** - Material definitions (4/44 done)
2. ✅ **Event** - Event generation (4/36 done)
3. ✅ **Run** - Simulation control (3/15 done)
4. 🔄 **Track** - Track container (next)
5. ⏳ **Tracking** - Track processing
6. ⏳ **Particles** - Particle definitions
7. ⏳ **Global** - Utilities and types

### Medium Priority (Core Physics)

Essential for physics simulation:

8. ⏳ **Processes** - Physics processes
9. ⏳ **Geometry** - Detector modeling
10. ⏳ **Digits & Hits** - Detector response

### Lower Priority (Advanced Features)

Important but can come later:

11. ⏳ **Analysis** - Data analysis tools
12. ⏳ **Persistency** - Data storage
13. ⏳ **Visualization** - Graphics and UI
14. ⏳ **Interfaces** - User interfaces

## Contributing

### How to Add Documentation

1. **Choose a module** from the priority roadmap
2. **Review source code** in `source/<module>/include/`
3. **Create module overview** at `docs/modules/<module>/index.md`
4. **Document key classes** in `docs/modules/<module>/api/`
5. **Update navigation** in `docs/.vitepress/config.js`
6. **Add diagrams** to `docs/visualization.md`
7. **Update this page** with progress
8. **Build and test** with `npm run docs:build`
9. **Commit and push** changes

### Documentation Templates

Templates and style guides available:
- [Materials Module](modules/materials/) - Example overview structure
- [G4Material API](modules/materials/api/g4material) - Example API doc structure
- [Auto API Docs Plan](auto-api-docs-plan.md) - Future automation plans

## Related Resources

- [Architecture Overview](architecture.md) - System architecture
- [Visualization](visualization.md) - Interactive module diagrams
- [Source Modules Reference](reference/source-modules.md) - Module descriptions
- [Build System](reference/build-system.md) - Building documentation

---

::: info Last Updated
**Date:** 2025-11-16
**Next Update:** After Track module documentation
:::

---

### Geometry Module

**Location:** `source/geometry/`
**Documentation:** [Module Overview](/modules/geometry/) | Visualization Diagrams (in progress)
**Progress:** 13/308 classes (4%)

#### Documented Classes

| Class | API Docs | Lines | Status |
|-------|----------|-------|--------|
| **G4VSolid** | [📖 API](/modules/geometry/api/g4vsolid) | 1,012 | ✅ Complete |
| **G4LogicalVolume** | [📖 API](/modules/geometry/api/g4logicalvolume) | 804 | ✅ Complete |
| **G4VPhysicalVolume** | [📖 API](/modules/geometry/api/g4vphysicalvolume) | 660 | ✅ Complete |
| **G4PVPlacement** | [📖 API](/modules/geometry/api/g4pvplacement) | 963 | ✅ Complete |
| **G4Box** | [📖 API](/modules/geometry/api/g4box) | 1,267 | ✅ Complete |
| **G4Tubs** | [📖 API](/modules/geometry/api/g4tubs) | 1,478 | ✅ Complete |
| **G4Cons** | [📖 API](/modules/geometry/api/g4cons) | 1,088 | ✅ Complete |
| **G4Sphere** | [📖 API](/modules/geometry/api/g4sphere) | 1,136 | ✅ Complete |
| **G4UnionSolid** | [📖 API](/modules/geometry/api/g4unionsolid) | 938 | ✅ Complete |
| **G4SubtractionSolid** | [📖 API](/modules/geometry/api/g4subtractionsolid) | 993 | ✅ Complete |
| **G4IntersectionSolid** | [📖 API](/modules/geometry/api/g4intersectionsolid) | 936 | ✅ Complete |
| **G4Navigator** | [📖 API](/modules/geometry/api/g4navigator) | 1,016 | ✅ Complete |
| **G4Region** | [📖 API](/modules/geometry/api/g4region) | 826 | ✅ Complete |

#### Pending Classes

<details>
<summary>Click to expand (300 classes)</summary>

**Core Management (41 remaining):**
- G4Region
- G4GeometryManager
- G4VPVParameterisation
- G4AffineTransform
- G4ScaleTransform
- G4TouchableHistory, G4TouchableHandle, G4VTouchable
- G4SmartVoxelHeader, G4SmartVoxelNode
- G4NavigationHistory, G4NavigationLevel
- G4GeomTools, G4VoxelLimits, G4BoundingEnvelope
- And 28 more...

**Navigation (31 classes):**
- G4Navigator
- G4TransportationManager
- G4MultiNavigator
- G4PropagatorInField
- G4SafetyHelper
- G4PathFinder
- And 25 more...

**CSG Solids (13 remaining):**
- G4Orb, G4Torus, G4Trap, G4Trd, G4Para
- G4CutTubs
- And 7 more...

**Boolean Solids (8 classes):**
- G4UnionSolid
- G4SubtractionSolid
- G4IntersectionSolid
- G4MultiUnion
- G4DisplacedSolid, G4ScaledSolid
- And 2 more...

**Specific Solids (56 classes):**
- G4Polycone, G4Polyhedra
- G4TessellatedSolid
- G4Tet, G4Ellipsoid, G4Paraboloid, G4Hype
- G4ExtrudedSolid, G4GenericTrap
- Twisted solids (8 classes)
- And 40 more...

**Magnetic Field (103 classes):**
- G4MagneticField, G4ElectricField
- G4UniformMagField
- G4FieldManager
- G4ChordFinder
- Integration steppers (40+ classes)
- And 60 more...

**Volumes (4 remaining):**
- G4PVReplica
- G4PVParameterised
- G4AssemblyVolume
- And 1 more...

**Divisions (11 classes):**
- G4VDivisionParameterisation
- G4PVDivision
- Shape-specific divisions (9 classes)

**Biasing (17 classes):**
- G4GeometryCell
- G4IStore
- G4WeightWindowStore
- And 14 more...

</details>

---
