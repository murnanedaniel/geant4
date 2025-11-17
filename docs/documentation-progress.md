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
| **geometry** | 150+ | 0 | 0% | ⏳ Planned | Medium |
| [**particles**](#particles-module) | 252 | 13 | 5% | ✅ Current | High |
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

### Particles Module

**Location:** `source/particles/`
**Documentation:** [Module Overview](/modules/particles/) | [Visualization Diagram](/visualization#particles-module-class-hierarchy)
**Progress:** 13/252 classes (5%)

#### Documented Classes

| Class | API Docs | Lines | Status |
|-------|----------|-------|--------|
| **G4ParticleDefinition** | [📖 API](/modules/particles/api/g4particledefinition) | 2,400 | ✅ Complete |
| **G4ParticleTable** | [📖 API](/modules/particles/api/g4particletable) | 1,900 | ✅ Complete |
| **G4DynamicParticle** | [📖 API](/modules/particles/api/g4dynamicparticle) | 2,500 | ✅ Complete |
| **G4IonTable** | [📖 API](/modules/particles/api/g4iontable) | 1,350 | ✅ Complete |
| **G4DecayTable** | [📖 API](/modules/particles/api/g4decaytable) | 900 | ✅ Complete |
| **G4VDecayChannel** | [📖 API](/modules/particles/api/g4vdecaychannel) | 1,400 | ✅ Complete |
| **Leptons** | [📖 Categories](/modules/particles/leptons) | 1,200 | ✅ Complete |
| **Bosons** | [📖 Categories](/modules/particles/bosons) | 1,300 | ✅ Complete |
| **Hadrons** | [📖 Categories](/modules/particles/hadrons) | 1,800 | ✅ Complete |
| **Ions** | [📖 Categories](/modules/particles/ions) | 1,500 | ✅ Complete |
| **Short-Lived** | [📖 Categories](/modules/particles/shortlived) | 1,400 | ✅ Complete |

#### Pending Classes

<details>
<summary>Click to expand (239 classes)</summary>

**Management Classes:**
- G4NuclideTable
- G4IsotopeProperty
- G4PDGCodeChecker
- G4ParticlePropertyTable
- G4ParticlePropertyData
- G4ElectronOccupancy
- G4DecayProducts
- G4PrimaryParticle
- G4PrimaryVertex
- And 10+ more management classes

**Decay Channel Types:**
- G4PhaseSpaceDecayChannel
- G4DalitzDecayChannel
- G4MuonDecayChannel
- G4MuonDecayChannelWithSpin
- G4MuonRadiativeDecayChannelWithSpin
- G4TauLeptonicDecayChannel
- G4KL3DecayChannel
- G4NeutronBetaDecayChannel
- G4PionRadiativeDecayChannel
- And 5+ more specialized channels

**Individual Particle Classes:**
Note: Individual particle classes (200+ particles) are documented in category pages:
- 12 Leptons (documented in Leptons category)
- 10 Bosons (documented in Bosons category)
- 47 Baryons (documented in Hadrons category)
- 29 Mesons (documented in Hadrons category)
- 23 Ions (documented in Ions category)
- 14+ Short-lived (documented in Short-lived category)
- 11 Adjoint particles

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
| **Modules Documented** | 4 / 23+ |
| **Classes Documented** | 24 / 400+ |
| **Total Documentation Lines** | ~35,000 |
| **API Reference Pages** | 17 |
| **Module Overview Pages** | 4 |
| **Category Pages** | 5 |
| **Interactive Diagrams** | 8 |
| **Generated HTML Pages** | 25 |

### Recent Additions

- **2025-11-17**: Particles Module - 6 API classes + 5 category pages, ~15,000 lines
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
**Date:** 2025-11-17
**Next Update:** After Track module documentation
:::
