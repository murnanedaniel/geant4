import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Geant4',
  description: 'A toolkit for the simulation of the passage of particles through matter',
  base: '/geant4/',
  ignoreDeadLinks: true,

  themeConfig: {
    // Dark mode first - physics research aesthetic
    appearance: 'dark',

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: {
              title: 4,
              text: 2,
              heading: 3
            }
          }
        }
      }
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Architecture', link: '/architecture' },
      {
        text: 'Modules',
        items: [
          { text: 'Global', link: '/modules/global/' },
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Event', link: '/modules/event/' },
          { text: 'Run', link: '/modules/run/' },
          { text: 'Track', link: '/modules/track/' },
          { text: 'Tracking', link: '/modules/tracking/' },
          { text: 'Particles', link: '/modules/particles/' }
        ]
      },
      { text: 'Visualization', link: '/visualization' },
      {
        text: 'Documentation',
        items: [
          { text: 'Progress Tracking', link: '/documentation-progress' },
          { text: 'Coverage Analysis', link: '/documentation-coverage-analysis' }
        ]
      },
      { text: 'Reference', link: '/reference/' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Geant4?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Architecture', link: '/architecture' }
        ]
      },
      {
        text: 'Modules',
        items: [
          { text: 'Global', link: '/modules/global/' },
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Event', link: '/modules/event/' },
          { text: 'Run', link: '/modules/run/' },
          { text: 'Track', link: '/modules/track/' },
          { text: 'Tracking', link: '/modules/tracking/' },
          { text: 'Particles', link: '/modules/particles/' }
        ]
      },
      {
        text: 'Global Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/global/' },
          {
            text: 'Types & Constants',
            collapsed: true,
            items: [
              { text: 'G4Types', link: '/modules/global/api/g4types' },
              { text: 'G4SystemOfUnits', link: '/modules/global/api/g4systemofunits' },
              { text: 'G4PhysicalConstants', link: '/modules/global/api/g4physicalconstants' },
              { text: 'globals.hh', link: '/modules/global/api/globals' },
              { text: 'G4Version', link: '/modules/global/api/g4version' }
            ]
          },
          {
            text: 'Vectors & Geometry',
            collapsed: true,
            items: [
              { text: 'G4ThreeVector', link: '/modules/global/api/g4threevector' },
              { text: 'G4TwoVector', link: '/modules/global/api/g4twovector' },
              { text: 'G4RotationMatrix', link: '/modules/global/api/g4rotationmatrix' },
              { text: 'G4Transform3D', link: '/modules/global/api/g4transform3d' },
              { text: 'G4LorentzVector', link: '/modules/global/api/g4lorentzvector' },
              { text: 'Geometry Defs', link: '/modules/global/api/geomdefs' }
            ]
          },
          {
            text: 'Physics Data',
            collapsed: true,
            items: [
              { text: 'G4PhysicsVector', link: '/modules/global/api/g4physicsvector' },
              { text: 'G4PhysicsTable', link: '/modules/global/api/g4physicstable' },
              { text: 'G4PhysicsLogVector', link: '/modules/global/api/g4physicslogvector' },
              { text: 'G4PhysicsFreeVector', link: '/modules/global/api/g4physicsfreevector' }
            ]
          },
          {
            text: 'Random Numbers',
            collapsed: true,
            items: [
              { text: 'Randomize', link: '/modules/global/api/randomize' },
              { text: 'G4RandomDirection', link: '/modules/global/api/g4randomdirection' },
              { text: 'G4Poisson', link: '/modules/global/api/g4poisson' },
              { text: 'G4UniformRandPool', link: '/modules/global/api/g4uniformrandpool' }
            ]
          },
          {
            text: 'Threading',
            collapsed: true,
            items: [
              { text: 'G4Threading', link: '/modules/global/api/G4Threading' },
              { text: 'G4AutoLock', link: '/modules/global/api/G4AutoLock' },
              { text: 'G4ThreadPool', link: '/modules/global/api/G4ThreadPool' },
              { text: 'G4Task', link: '/modules/global/api/G4Task' }
            ]
          },
          {
            text: 'Memory Management',
            collapsed: true,
            items: [
              { text: 'G4Allocator', link: '/modules/global/api/g4allocator' },
              { text: 'G4Cache', link: '/modules/global/api/G4Cache' },
              { text: 'G4ReferenceCountedHandle', link: '/modules/global/api/G4ReferenceCountedHandle' }
            ]
          },
          {
            text: 'Utilities',
            collapsed: true,
            items: [
              { text: 'G4Exception', link: '/modules/global/api/g4exception' },
              { text: 'G4Timer', link: '/modules/global/api/g4timer' },
              { text: 'G4UnitsTable', link: '/modules/global/api/g4unitstable' },
              { text: 'G4Pow', link: '/modules/global/api/g4pow' },
              { text: 'G4StateManager', link: '/modules/global/api/g4statemanager' }
            ]
          }
        ]
      },
      {
        text: 'Materials Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/materials/' },
          {
            text: 'Core Classes',
            collapsed: true,
            items: [
              { text: 'G4Isotope', link: '/modules/materials/api/g4isotope' },
              { text: 'G4Element', link: '/modules/materials/api/g4element' },
              { text: 'G4Material', link: '/modules/materials/api/g4material' }
            ]
          },
          {
            text: 'NIST Database',
            collapsed: true,
            items: [
              { text: 'G4NistManager', link: '/modules/materials/api/g4nistmanager' },
              { text: 'G4NistElementBuilder', link: '/modules/materials/api/g4nistelementbuilder' },
              { text: 'G4NistMaterialBuilder', link: '/modules/materials/api/g4nistmaterialbuilder' }
            ]
          },
          {
            text: 'Material Properties',
            collapsed: true,
            items: [
              { text: 'G4MaterialPropertiesTable', link: '/modules/materials/api/g4materialpropertiestable' },
              { text: 'G4MaterialPropertyVector', link: '/modules/materials/api/g4materialpropertyvector' },
              { text: 'G4MaterialPropertiesIndex', link: '/modules/materials/api/g4materialpropertiesindex' }
            ]
          },
          {
            text: 'Tables and Data',
            collapsed: true,
            items: [
              { text: 'G4MaterialTable', link: '/modules/materials/api/g4materialtable' },
              { text: 'G4ElementTable', link: '/modules/materials/api/g4elementtable' },
              { text: 'G4IsotopeTable', link: '/modules/materials/api/g4isotopetable' },
              { text: 'G4ElementData', link: '/modules/materials/api/g4elementdata' },
              { text: 'G4AtomicShells', link: '/modules/materials/api/g4atomicshells' }
            ]
          },
          {
            text: 'Ionisation Parameters',
            collapsed: true,
            items: [
              { text: 'G4IonisParamElm', link: '/modules/materials/api/g4ionisparamelm' }
            ]
          }
        ]
      },
      {
        text: 'Event Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/event/' },
          {
            text: 'Event Container',
            collapsed: true,
            items: [
              { text: 'G4Event', link: '/modules/event/api/g4event' },
              { text: 'G4PrimaryVertex', link: '/modules/event/api/g4primaryvertex' },
              { text: 'G4PrimaryParticle', link: '/modules/event/api/g4primaryparticle' }
            ]
          },
          {
            text: 'Event Management',
            collapsed: true,
            items: [
              { text: 'G4EventManager', link: '/modules/event/api/g4eventmanager' }
            ]
          },
          {
            text: 'Primary Generation',
            collapsed: true,
            items: [
              { text: 'G4VPrimaryGenerator', link: '/modules/event/api/g4vprimarygenerator' },
              { text: 'G4ParticleGun', link: '/modules/event/api/g4particlegun' },
              { text: 'G4GeneralParticleSource', link: '/modules/event/api/g4generalparticlesource' },
              { text: 'G4SingleParticleSource', link: '/modules/event/api/g4singleparticlesource' },
              { text: 'G4HEPEvtInterface', link: '/modules/event/api/g4hepevtinterface' }
            ]
          },
          {
            text: 'Stacking',
            collapsed: true,
            items: [
              { text: 'G4StackManager', link: '/modules/event/api/g4stackmanager' },
              { text: 'G4TrackStack', link: '/modules/event/api/g4trackstack' },
              { text: 'G4SmartTrackStack', link: '/modules/event/api/g4smarttrackstack' },
              { text: 'G4StackedTrack', link: '/modules/event/api/g4stackedtrack' },
              { text: 'G4UserStackingAction', link: '/modules/event/api/g4userstackingaction' },
              { text: 'G4ClassificationOfNewTrack', link: '/modules/event/api/g4classificationofnewtrack' },
              { text: 'G4SubEvent', link: '/modules/event/api/g4subevent' },
              { text: 'G4SubEventTrackStack', link: '/modules/event/api/g4subeventtrackstack' }
            ]
          },
          {
            text: 'User Actions',
            collapsed: true,
            items: [
              { text: 'G4UserEventAction', link: '/modules/event/api/g4usereventaction' }
            ]
          }
        ]
      },
      {
        text: 'Run Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/run/' },
          {
            text: 'Run Managers',
            collapsed: true,
            items: [
              { text: 'G4RunManager', link: '/modules/run/api/g4runmanager' },
              { text: 'G4MTRunManager', link: '/modules/run/api/g4mtrunmanager' },
              { text: 'G4TaskRunManager', link: '/modules/run/api/g4taskrunmanager' },
              { text: 'G4WorkerRunManager', link: '/modules/run/api/g4workerrunmanager' },
              { text: 'G4WorkerTaskRunManager', link: '/modules/run/api/g4workertaskrunmanager' }
            ]
          },
          {
            text: 'Run Data',
            collapsed: true,
            items: [
              { text: 'G4Run', link: '/modules/run/api/g4run' }
            ]
          },
          {
            text: 'User Actions',
            collapsed: true,
            items: [
              { text: 'G4UserRunAction', link: '/modules/run/api/g4userrunaction' },
              { text: 'G4VUserActionInitialization', link: '/modules/run/api/g4vuseractioninitialization' },
              { text: 'G4VUserDetectorConstruction', link: '/modules/run/api/g4vuserdetectorconstruction' },
              { text: 'G4VUserPhysicsList', link: '/modules/run/api/g4vuserphysicslist' },
              { text: 'G4VUserPrimaryGeneratorAction', link: '/modules/run/api/g4vuserprimarygeneratoraction' }
            ]
          }
        ]
      },
      {
        text: 'Track Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/track/' },
          {
            text: 'Core Classes',
            collapsed: true,
            items: [
              { text: 'G4Track', link: '/modules/track/api/g4track' },
              { text: 'G4Step', link: '/modules/track/api/g4step' },
              { text: 'G4StepPoint', link: '/modules/track/api/g4steppoint' }
            ]
          },
          {
            text: 'Particle Changes',
            collapsed: true,
            items: [
              { text: 'G4VParticleChange', link: '/modules/track/api/g4vparticlechange' },
              { text: 'G4ParticleChange', link: '/modules/track/api/g4particlechange' },
              { text: 'G4ParticleChangeForDecay', link: '/modules/track/api/g4particlechangefordecay' },
              { text: 'G4ParticleChangeForGamma', link: '/modules/track/api/g4particlechangeforgamma' },
              { text: 'G4ParticleChangeForLoss', link: '/modules/track/api/g4particlechangeforloss' },
              { text: 'G4ParticleChangeForMSC', link: '/modules/track/api/g4particlechangeformsc' },
              { text: 'G4ParticleChangeForTransport', link: '/modules/track/api/g4particlechangefortransport' }
            ]
          }
        ]
      },
      {
        text: 'Tracking Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/tracking/' },
          {
            text: 'Tracking Management',
            collapsed: true,
            items: [
              { text: 'G4TrackingManager', link: '/modules/tracking/api/g4trackingmanager' },
              { text: 'G4SteppingManager', link: '/modules/tracking/api/g4steppingmanager' }
            ]
          },
          {
            text: 'Trajectories',
            collapsed: true,
            items: [
              { text: 'G4VTrajectory', link: '/modules/tracking/api/g4vtrajectory' },
              { text: 'G4Trajectory', link: '/modules/tracking/api/g4trajectory' },
              { text: 'G4TrajectoryContainer', link: '/modules/tracking/api/g4trajectorycontainer' }
            ]
          },
          {
            text: 'Stepping Verbosity',
            collapsed: true,
            items: [
              { text: 'G4VSteppingVerbose', link: '/modules/tracking/api/g4vsteppingverbose' }
            ]
          },
          {
            text: 'User Actions',
            collapsed: true,
            items: [
              { text: 'G4UserSteppingAction', link: '/modules/tracking/api/g4usersteppingaction' },
              { text: 'G4UserTrackingAction', link: '/modules/tracking/api/g4usertrackingaction' }
            ]
          }
        ]
      },
      {
        text: 'Particles Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/particles/' },
          {
            text: 'Core Management',
            collapsed: true,
            items: [
              { text: 'G4ParticleDefinition', link: '/modules/particles/api/g4particledefinition' },
              { text: 'G4ParticleTable', link: '/modules/particles/api/g4particletable' },
              { text: 'G4DynamicParticle', link: '/modules/particles/api/g4dynamicparticle' },
              { text: 'G4IonTable', link: '/modules/particles/api/g4iontable' }
            ]
          },
          {
            text: 'Decay Management',
            collapsed: true,
            items: [
              { text: 'G4DecayTable', link: '/modules/particles/api/g4decaytable' },
              { text: 'G4VDecayChannel', link: '/modules/particles/api/g4vdecaychannel' }
            ]
          },
          {
            text: 'Particle Categories',
            collapsed: true,
            items: [
              { text: 'Leptons', link: '/modules/particles/leptons' },
              { text: 'Bosons', link: '/modules/particles/bosons' },
              { text: 'Hadrons', link: '/modules/particles/hadrons' },
              { text: 'Ions', link: '/modules/particles/ions' },
              { text: 'Short-Lived', link: '/modules/particles/shortlived' }
            ]
          }
        ]
      },
      {
        text: 'Documentation Status',
        items: [
          { text: 'Progress Tracking', link: '/documentation-progress' },
          { text: 'Coverage Analysis', link: '/documentation-coverage-analysis' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Overview', link: '/reference/' },
          { text: 'Build System', link: '/reference/build-system' },
          { text: 'Source Modules', link: '/reference/source-modules' },
          { text: 'Contributing', link: '/reference/contributing' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Geant4/geant4' }
    ],

    footer: {
      message: 'Documentation © Daniel Murnane - Free to use | Geant4 software © Geant4 Collaboration',
      copyright: 'Released under the Geant4 Software License'
    }
  }
})
