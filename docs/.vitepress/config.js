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
              { text: 'G4VParticleChange', link: '/modules/track/api/g4vparticlechange' }
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
