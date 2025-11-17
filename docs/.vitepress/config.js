import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Geant4',
  description: 'A toolkit for the simulation of the passage of particles through matter',
  base: '/geant4/',
  ignoreDeadLinks: true,

  themeConfig: {
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
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Event', link: '/modules/event/' },
          { text: 'Run', link: '/modules/run/' },
          { text: 'Track', link: '/modules/track/' }
        ]
      },
      { text: 'Visualization', link: '/visualization' },
      { text: 'Progress', link: '/documentation-progress' },
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
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Event', link: '/modules/event/' },
          { text: 'Run', link: '/modules/run/' },
          { text: 'Track', link: '/modules/track/' }
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
      message: 'Released under the Geant4 Software License',
      copyright: 'Copyright © Geant4 Collaboration'
    }
  }
})
