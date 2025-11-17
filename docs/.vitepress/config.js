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
          { text: 'Global', link: '/modules/global/' },
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Event', link: '/modules/event/' },
          { text: 'Run', link: '/modules/run/' }
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
          { text: 'Global', link: '/modules/global/' },
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Event', link: '/modules/event/' },
          { text: 'Run', link: '/modules/run/' }
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
              { text: 'G4Allocator', link: '/modules/global/api/G4Allocator' },
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
              { text: 'G4UnitsTable', link: '/modules/global/api/G4UnitsTable' },
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
              { text: 'G4MTRunManager', link: '/modules/run/api/g4mtrunmanager' }
            ]
          },
          {
            text: 'Run Data',
            collapsed: true,
            items: [
              { text: 'G4Run', link: '/modules/run/api/g4run' }
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
