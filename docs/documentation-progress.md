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
| [**global**](#global-module) | 109 | 97 | 89% | ✅ Current | High |
| **geometry** | 150+ | 0 | 0% | ⏳ Planned | Medium |
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

### Global Module

**Location:** `source/global/`
**Documentation:** [Module Overview](/modules/global/)
**Progress:** 97/109 classes (89%)

#### Documented Classes

**HEPGeometry (8/8 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **geomdefs.hh** | [📖 API](/modules/global/api/geomdefs) | ✅ Complete |
| **G4Transform3D** | [📖 API](/modules/global/api/g4transform3d) | ✅ Complete |
| **G4Point3D** | [📖 API](/modules/global/api/g4point3d) | ✅ Complete |
| **G4Vector3D** | [📖 API](/modules/global/api/g4vector3d) | ✅ Complete |
| **G4Normal3D** | [📖 API](/modules/global/api/g4normal3d) | ✅ Complete |
| **G4Plane3D** | [📖 API](/modules/global/api/g4plane3d) | ✅ Complete |
| **G4LorentzVector** | [📖 API](/modules/global/api/g4lorentzvector) | ✅ Complete |
| **G4LorentzRotation** | [📖 API](/modules/global/api/g4lorentzrotation) | ✅ Complete |

**HEPNumerics (18/18 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4Integrator** | [📖 API](/modules/global/api/g4integrator) | ✅ Complete |
| **G4VGaussianQuadrature** | [📖 API](/modules/global/api/g4vgaussianquadrature) | ✅ Complete |
| **G4GaussLegendreQ** | [📖 API](/modules/global/api/g4gausslegendreq) | ✅ Complete |
| **G4GaussHermiteQ** | [📖 API](/modules/global/api/g4gausshermiteq) | ✅ Complete |
| **G4GaussLaguerreQ** | [📖 API](/modules/global/api/g4gausslaguerreq) | ✅ Complete |
| **G4GaussChebyshevQ** | [📖 API](/modules/global/api/g4gausschebyshevq) | ✅ Complete |
| **G4GaussJacobiQ** | [📖 API](/modules/global/api/g4gaussjacobiq) | ✅ Complete |
| **G4SimpleIntegration** | [📖 API](/modules/global/api/g4simpleintegration) | ✅ Complete |
| **G4VSIntegration** | [📖 API](/modules/global/api/g4vsintegration) | ✅ Complete |
| **G4PolynomialSolver** | [📖 API](/modules/global/api/g4polynomialsolver) | ✅ Complete |
| **G4AnalyticalPolSolver** | [📖 API](/modules/global/api/g4analyticalpolsolver) | ✅ Complete |
| **G4JTPolynomialSolver** | [📖 API](/modules/global/api/g4jtpolynomialsolver) | ✅ Complete |
| **G4DataInterpolation** | [📖 API](/modules/global/api/g4datainterpolation) | ✅ Complete |
| **G4ChebyshevApproximation** | [📖 API](/modules/global/api/g4chebyshevapproximation) | ✅ Complete |
| **G4SimplexDownhill** | [📖 API](/modules/global/api/g4simplexdownhill) | ✅ Complete |
| **G4StatDouble** | [📖 API](/modules/global/api/g4statdouble) | ✅ Complete |
| **G4StatAnalysis** | [📖 API](/modules/global/api/g4statanalysis) | ✅ Complete |
| **G4ConvergenceTester** | [📖 API](/modules/global/api/g4convergencetester) | ✅ Complete |

**HEPRandom (6/6 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **Randomize.hh** | [📖 API](/modules/global/api/randomize) | ✅ Complete |
| **G4RandomTools** | [📖 API](/modules/global/api/g4randomtools) | ✅ Complete |
| **G4RandomDirection** | [📖 API](/modules/global/api/g4randomdirection) | ✅ Complete |
| **G4Poisson** | [📖 API](/modules/global/api/g4poisson) | ✅ Complete |
| **G4QuickRand** | [📖 API](/modules/global/api/g4quickrand) | ✅ Complete |
| **G4UniformRandPool** | [📖 API](/modules/global/api/g4uniformrandpool) | ✅ Complete |

**Management - Types and Constants (5/5 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4Types.hh** | [📖 API](/modules/global/api/g4types) | ✅ Complete |
| **G4SystemOfUnits.hh** | [📖 API](/modules/global/api/g4systemofunits) | ✅ Complete |
| **G4PhysicalConstants.hh** | [📖 API](/modules/global/api/g4physicalconstants) | ✅ Complete |
| **globals.hh** | [📖 API](/modules/global/api/globals) | ✅ Complete |
| **G4Version.hh** | [📖 API](/modules/global/api/g4version) | ✅ Complete |

**Management - Vectors and Matrices (3/3 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4ThreeVector** | [📖 API](/modules/global/api/g4threevector) | ✅ Complete |
| **G4TwoVector** | [📖 API](/modules/global/api/g4twovector) | ✅ Complete |
| **G4RotationMatrix** | [📖 API](/modules/global/api/g4rotationmatrix) | ✅ Complete |

**Management - Physics Data (11/11 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4PhysicsVector** | [📖 API](/modules/global/api/g4physicsvector) | ✅ Complete |
| **G4PhysicsLinearVector** | [📖 API](/modules/global/api/g4physicslinearvector) | ✅ Complete |
| **G4PhysicsLogVector** | [📖 API](/modules/global/api/g4physicslogvector) | ✅ Complete |
| **G4PhysicsFreeVector** | [📖 API](/modules/global/api/g4physicsfreevector) | ✅ Complete |
| **G4PhysicsOrderedFreeVector** | [📖 API](/modules/global/api/g4physicsorderedfreevector) | ✅ Complete |
| **G4Physics2DVector** | [📖 API](/modules/global/api/g4physics2dvector) | ✅ Complete |
| **G4PhysicsTable** | [📖 API](/modules/global/api/g4physicstable) | ✅ Complete |
| **G4OrderedTable** | [📖 API](/modules/global/api/g4orderedtable) | ✅ Complete |
| **G4PhysicsVectorType** | [📖 API](/modules/global/api/g4physicsvectortype) | ✅ Complete |
| **G4PhysicsModelCatalog** | [📖 API](/modules/global/api/g4physicsmodelcatalog) | ✅ Complete |
| **G4DataVector** | [📖 API](/modules/global/api/g4datavector) | ✅ Complete |

**Management - Exception Handling (1 comprehensive doc) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4Exception** | [📖 API](/modules/global/api/g4exception) | ✅ Complete |

**Management - Math Utilities (4/4 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4Pow** | [📖 API](/modules/global/api/g4pow) | ✅ Complete |
| **G4Log** | [📖 API](/modules/global/api/g4log) | ✅ Complete |
| **G4Exp** | [📖 API](/modules/global/api/g4exp) | ✅ Complete |
| **G4IEEE754** | [📖 API](/modules/global/api/g4ieee754) | ✅ Complete |

**Management - Timing (2/2 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4Timer** | [📖 API](/modules/global/api/g4timer) | ✅ Complete |
| **G4SliceTimer** | [📖 API](/modules/global/api/g4slicetimer) | ✅ Complete |

**Management - State Management (4 docs) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **State Management Overview** | [📖 API](/modules/global/api/state-management) | ✅ Complete |
| **G4StateManager** | [📖 API](/modules/global/api/g4statemanager) | ✅ Complete |
| **G4VStateDependent** | [📖 API](/modules/global/api/g4vstatedependent) | ✅ Complete |
| **G4ApplicationState** | [📖 API](/modules/global/api/g4applicationstate) | ✅ Complete |

**Management - Threading (14/14 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4Threading** | [📖 API](/modules/global/api/G4Threading) | ✅ Complete |
| **G4ThreadPool** | [📖 API](/modules/global/api/G4ThreadPool) | ✅ Complete |
| **G4Task** | [📖 API](/modules/global/api/G4Task) | ✅ Complete |
| **G4VTask** | [📖 API](/modules/global/api/G4VTask) | ✅ Complete |
| **G4TaskManager** | [📖 API](/modules/global/api/G4TaskManager) | ✅ Complete |
| **G4TaskGroup** | [📖 API](/modules/global/api/G4TaskGroup) | ✅ Complete |
| **G4TBBTaskGroup** | [📖 API](/modules/global/api/G4TBBTaskGroup) | ✅ Complete |
| **G4UserTaskQueue** | [📖 API](/modules/global/api/G4UserTaskQueue) | ✅ Complete |
| **G4VUserTaskQueue** | [📖 API](/modules/global/api/G4VUserTaskQueue) | ✅ Complete |
| **G4AutoLock** | [📖 API](/modules/global/api/G4AutoLock) | ✅ Complete |
| **G4MTBarrier** | [📖 API](/modules/global/api/G4MTBarrier) | ✅ Complete |
| **G4ThreadLocalSingleton** | [📖 API](/modules/global/api/G4ThreadLocalSingleton) | ✅ Complete |
| **G4ThreadData** | [📖 API](/modules/global/api/G4ThreadData) | ✅ Complete |
| **G4TWorkspacePool** | [📖 API](/modules/global/api/G4TWorkspacePool) | ✅ Complete |

**Management - Memory (6/6 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4Allocator** | [📖 API](/modules/global/api/G4Allocator) | ✅ Complete |
| **G4AllocatorPool** | [📖 API](/modules/global/api/G4AllocatorPool) | ✅ Complete |
| **G4AllocatorList** | [📖 API](/modules/global/api/G4AllocatorList) | ✅ Complete |
| **G4ReferenceCountedHandle** | [📖 API](/modules/global/api/G4ReferenceCountedHandle) | ✅ Complete |
| **G4Cache** | [📖 API](/modules/global/api/G4Cache) | ✅ Complete |
| **G4AutoDelete** | [📖 API](/modules/global/api/G4AutoDelete) | ✅ Complete |

**Management - I/O and Output (10/10 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4coutDestination** | [📖 API](/modules/global/api/G4coutDestination) | ✅ Complete |
| **G4FilecoutDestination** | [📖 API](/modules/global/api/G4FilecoutDestination) | ✅ Complete |
| **G4MTcoutDestination** | [📖 API](/modules/global/api/G4MTcoutDestination) | ✅ Complete |
| **G4MasterForwardcoutDestination** | [📖 API](/modules/global/api/G4MasterForwardcoutDestination) | ✅ Complete |
| **G4BuffercoutDestination** | [📖 API](/modules/global/api/G4BuffercoutDestination) | ✅ Complete |
| **G4MulticoutDestination** | [📖 API](/modules/global/api/G4MulticoutDestination) | ✅ Complete |
| **G4LockcoutDestination** | [📖 API](/modules/global/api/G4LockcoutDestination) | ✅ Complete |
| **G4coutFormatters** | [📖 API](/modules/global/api/G4coutFormatters) | ✅ Complete |
| **G4ios** | [📖 API](/modules/global/api/G4ios) | ✅ Complete |
| **G4String** | [📖 API](/modules/global/api/G4String) | ✅ Complete |

**Management - Utilities (5/5 classes) - ✅ Complete**

| Class | API Docs | Status |
|-------|----------|--------|
| **G4UnitsTable** | [📖 API](/modules/global/api/G4UnitsTable) | ✅ Complete |
| **G4Tokenizer** | [📖 API](/modules/global/api/G4Tokenizer) | ✅ Complete |
| **G4UserLimits** | [📖 API](/modules/global/api/G4UserLimits) | ✅ Complete |
| **G4GeometryTolerance** | [📖 API](/modules/global/api/G4GeometryTolerance) | ✅ Complete |
| **G4Evaluator** | [📖 API](/modules/global/api/G4Evaluator) | ✅ Complete |

#### Pending Classes

<details>
<summary>Click to expand (12 remaining classes)</summary>

**Platform-Specific Headers:**
- windefs.hh - Windows platform definitions
- tls.hh - Thread-local storage support
- templates.hh - Template utilities

**Advanced Features (Lower Priority):**
- G4VNotifier - Observer pattern notifications
- G4Backtrace - Stack trace debugging
- G4FPEDetection - Floating-point exception detection
- G4EnvironmentUtils - Environment variable utilities
- G4Filesystem - Filesystem operations
- G4ErrorPropagatorData - Error propagation data
- G4FindDataDir - Data directory utilities
- G4FastVector - Fast dynamic vector
- G4CacheDetails - Cache implementation details

</details>

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
| **Modules Documented** | 4 / 23+ |
| **Classes Documented** | 108 / 500+ |
| **Total Documentation Lines** | ~80,000+ |
| **API Reference Pages** | 108 |
| **Module Overview Pages** | 4 |
| **Interactive Diagrams** | 14 |
| **Generated HTML Pages** | 120+ |

### Recent Additions

- **2025-11-17**: Global Module - 97 classes, 60,000+ lines (MAJOR)
- **2025-11-16**: Event Module - 4 classes, 8,500 lines
- **2025-11-16**: Run Module - 3 classes, 7,300 lines
- **2025-11-16**: Materials Module - 4 classes, 5,950 lines

## Priority Roadmap

### High Priority (Foundation Modules)

These modules are fundamental to Geant4 and should be documented first:

1. ✅ **Materials** - Material definitions (4/44 done)
2. ✅ **Event** - Event generation (4/36 done)
3. ✅ **Run** - Simulation control (3/15 done)
4. ✅ **Global** - Utilities and types (97/109 done - 89%)
5. 🔄 **Track** - Track container (next)
6. ⏳ **Tracking** - Track processing
7. ⏳ **Particles** - Particle definitions

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
