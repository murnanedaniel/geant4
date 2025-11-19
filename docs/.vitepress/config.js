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
          { text: 'Geometry', link: '/modules/geometry/' },
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Processes', link: '/modules/processes/' },
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
          { text: 'Geometry', link: '/modules/geometry/' },
          { text: 'Materials', link: '/modules/materials/' },
          { text: 'Processes', link: '/modules/processes/' },
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
              { text: 'G4Task', link: '/modules/global/api/G4Task' },
              { text: 'G4TaskGroup', link: '/modules/global/api/G4TaskGroup' },
              { text: 'G4TaskManager', link: '/modules/global/api/G4TaskManager' },
              { text: 'G4TBBTaskGroup', link: '/modules/global/api/G4TBBTaskGroup' },
              { text: 'G4VTask', link: '/modules/global/api/G4VTask' },
              { text: 'G4UserTaskQueue', link: '/modules/global/api/G4UserTaskQueue' },
              { text: 'G4VUserTaskQueue', link: '/modules/global/api/G4VUserTaskQueue' },
              { text: 'G4ThreadData', link: '/modules/global/api/G4ThreadData' },
              { text: 'G4ThreadLocalSingleton', link: '/modules/global/api/G4ThreadLocalSingleton' },
              { text: 'G4MTBarrier', link: '/modules/global/api/G4MTBarrier' },
              { text: 'G4TWorkspacePool', link: '/modules/global/api/G4TWorkspacePool' }
            ]
          },
          {
            text: 'Memory Management',
            collapsed: true,
            items: [
              { text: 'G4Allocator', link: '/modules/global/api/g4allocator' },
              { text: 'G4AllocatorList', link: '/modules/global/api/G4AllocatorList' },
              { text: 'G4AllocatorPool', link: '/modules/global/api/G4AllocatorPool' },
              { text: 'G4Cache', link: '/modules/global/api/G4Cache' },
              { text: 'G4ReferenceCountedHandle', link: '/modules/global/api/G4ReferenceCountedHandle' },
              { text: 'G4AutoDelete', link: '/modules/global/api/G4AutoDelete' }
            ]
          },
          {
            text: 'Utilities',
            collapsed: true,
            items: [
              { text: 'G4Exception', link: '/modules/global/api/g4exception' },
              { text: 'G4Timer', link: '/modules/global/api/g4timer' },
              { text: 'G4SliceTimer', link: '/modules/global/api/g4slicetimer' },
              { text: 'G4UnitsTable', link: '/modules/global/api/g4unitstable' },
              { text: 'G4Pow', link: '/modules/global/api/g4pow' },
              { text: 'G4StateManager', link: '/modules/global/api/g4statemanager' },
              { text: 'G4String', link: '/modules/global/api/G4String' },
              { text: 'G4Tokenizer', link: '/modules/global/api/G4Tokenizer' },
              { text: 'G4Evaluator', link: '/modules/global/api/G4Evaluator' },
              { text: 'G4UserLimits', link: '/modules/global/api/G4UserLimits' },
              { text: 'G4GeometryTolerance', link: '/modules/global/api/G4GeometryTolerance' }
            ]
          },
          {
            text: 'IO & Logging',
            collapsed: true,
            items: [
              { text: 'G4ios', link: '/modules/global/api/g4ios' },
              { text: 'G4coutDestination', link: '/modules/global/api/G4coutDestination' },
              { text: 'G4coutFormatters', link: '/modules/global/api/G4coutFormatters' },
              { text: 'G4BuffercoutDestination', link: '/modules/global/api/G4BuffercoutDestination' },
              { text: 'G4FilecoutDestination', link: '/modules/global/api/G4FilecoutDestination' },
              { text: 'G4LockcoutDestination', link: '/modules/global/api/G4LockcoutDestination' },
              { text: 'G4MTcoutDestination', link: '/modules/global/api/G4MTcoutDestination' },
              { text: 'G4MasterForwardcoutDestination', link: '/modules/global/api/G4MasterForwardcoutDestination' },
              { text: 'G4MulticoutDestination', link: '/modules/global/api/G4MulticoutDestination' }
            ]
          },
          {
            text: 'Mathematical Functions',
            collapsed: true,
            items: [
              { text: 'G4Exp', link: '/modules/global/api/g4exp' },
              { text: 'G4Log', link: '/modules/global/api/g4log' },
              { text: 'G4IEEE754', link: '/modules/global/api/g4ieee754' },
              { text: 'G4AnalyticalPolSolver', link: '/modules/global/api/g4analyticalpolsolver' },
              { text: 'G4PolynomialSolver', link: '/modules/global/api/g4polynomialsolver' },
              { text: 'G4JTPolynomialSolver', link: '/modules/global/api/g4jtpolynomialsolver' },
              { text: 'G4ChebyshevApproximation', link: '/modules/global/api/g4chebyshevapproximation' },
              { text: 'G4SimplexDownhill', link: '/modules/global/api/g4simplexdownhill' }
            ]
          },
          {
            text: 'Integration & Quadrature',
            collapsed: true,
            items: [
              { text: 'G4Integrator', link: '/modules/global/api/g4integrator' },
              { text: 'G4SimpleIntegration', link: '/modules/global/api/g4simpleintegration' },
              { text: 'G4VsIntegration', link: '/modules/global/api/g4vsintegration' },
              { text: 'G4VGaussianQuadrature', link: '/modules/global/api/g4vgaussianquadrature' },
              { text: 'G4GaussLegendreQ', link: '/modules/global/api/g4gausslegendreq' },
              { text: 'G4GaussHermiteQ', link: '/modules/global/api/g4gausshermiteq' },
              { text: 'G4GaussJacobiQ', link: '/modules/global/api/g4gaussjacobiq' },
              { text: 'G4GaussLaguerreQ', link: '/modules/global/api/g4gausslaguerreq' },
              { text: 'G4GaussChebyshevQ', link: '/modules/global/api/g4gausschebyshevq' }
            ]
          },
          {
            text: 'Data Structures',
            collapsed: true,
            items: [
              { text: 'G4DataVector', link: '/modules/global/api/g4datavector' },
              { text: 'G4OrderedTable', link: '/modules/global/api/g4orderedtable' },
              { text: 'G4DataInterpolation', link: '/modules/global/api/g4datainterpolation' }
            ]
          },
          {
            text: 'Additional Geometry',
            collapsed: true,
            items: [
              { text: 'G4LorentzRotation', link: '/modules/global/api/g4lorentzrotation' },
              { text: 'G4Normal3D', link: '/modules/global/api/g4normal3d' },
              { text: 'G4Point3D', link: '/modules/global/api/g4point3d' },
              { text: 'G4Plane3D', link: '/modules/global/api/g4plane3d' },
              { text: 'G4Vector3D', link: '/modules/global/api/g4vector3d' }
            ]
          },
          {
            text: 'Random Number Tools',
            collapsed: true,
            items: [
              { text: 'G4RandomTools', link: '/modules/global/api/g4randomtools' },
              { text: 'G4QuickRand', link: '/modules/global/api/g4quickrand' }
            ]
          },
          {
            text: 'Statistics',
            collapsed: true,
            items: [
              { text: 'G4StatAnalysis', link: '/modules/global/api/g4statanalysis' },
              { text: 'G4StatDouble', link: '/modules/global/api/g4statdouble' },
              { text: 'G4ConvergenceTester', link: '/modules/global/api/g4convergencetester' }
            ]
          },
          {
            text: 'Advanced Physics Data',
            collapsed: true,
            items: [
              { text: 'G4Physics2DVector', link: '/modules/global/api/g4physics2dvector' },
              { text: 'G4PhysicsLinearVector', link: '/modules/global/api/g4physicslinearvector' },
              { text: 'G4PhysicsOrderedFreeVector', link: '/modules/global/api/g4physicsorderedfreevector' },
              { text: 'G4PhysicsVectorType', link: '/modules/global/api/g4physicsvectortype' },
              { text: 'G4PhysicsModelCatalog', link: '/modules/global/api/g4physicsmodelcatalog' }
            ]
          },
          {
            text: 'State Management',
            collapsed: true,
            items: [
              { text: 'State Management Overview', link: '/modules/global/api/state-management' },
              { text: 'G4ApplicationState', link: '/modules/global/api/g4applicationstate' },
              { text: 'G4ExceptionSeverity', link: '/modules/global/api/g4exceptionseverity' },
              { text: 'G4VStateDependent', link: '/modules/global/api/g4vstatedependent' }
            ]
          }
        ]
      },
      {
        text: 'Geometry Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/geometry/' },
          {
            text: 'Solids',
            collapsed: true,
            items: [
              { text: 'G4VSolid', link: '/modules/geometry/api/g4vsolid' },
              { text: 'G4Box', link: '/modules/geometry/api/g4box' },
              { text: 'G4Sphere', link: '/modules/geometry/api/g4sphere' },
              { text: 'G4Tubs', link: '/modules/geometry/api/g4tubs' },
              { text: 'G4Cons', link: '/modules/geometry/api/g4cons' },
              { text: 'G4UnionSolid', link: '/modules/geometry/api/g4unionsolid' },
              { text: 'G4SubtractionSolid', link: '/modules/geometry/api/g4subtractionsolid' },
              { text: 'G4IntersectionSolid', link: '/modules/geometry/api/g4intersectionsolid' }
            ]
          },
          {
            text: 'Volumes',
            collapsed: true,
            items: [
              { text: 'G4LogicalVolume', link: '/modules/geometry/api/g4logicalvolume' },
              { text: 'G4VPhysicalVolume', link: '/modules/geometry/api/g4vphysicalvolume' },
              { text: 'G4PVPlacement', link: '/modules/geometry/api/g4pvplacement' }
            ]
          },
          {
            text: 'Navigation',
            collapsed: true,
            items: [
              { text: 'G4Navigator', link: '/modules/geometry/api/g4navigator' },
              { text: 'G4Region', link: '/modules/geometry/api/g4region' }
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
        text: 'Processes Module',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/modules/processes/' },
          {
            text: 'Management',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/management/' },
              { text: 'G4VProcess', link: '/modules/processes/management/api/g4vprocess' },
              { text: 'G4ProcessManager', link: '/modules/processes/management/api/g4processmanager' },
              { text: 'G4ProcessTable', link: '/modules/processes/management/api/g4processtable' },
              { text: 'Process Type Base Classes', link: '/modules/processes/management/api/process-type-base-classes' }
            ]
          },
          {
            text: 'Electromagnetic',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/electromagnetic/' }
            ]
          },
          {
            text: 'Hadronic',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/hadronic/' }
            ]
          },
          {
            text: 'Transportation',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/transportation/' },
              { text: 'G4Transportation', link: '/modules/processes/transportation/api/g4transportation' },
              { text: 'G4CoupledTransportation', link: '/modules/processes/transportation/api/g4coupledtransportation' },
              { text: 'G4StepLimiter', link: '/modules/processes/transportation/api/g4steplimiter' },
              { text: 'G4UserSpecialCuts', link: '/modules/processes/transportation/api/g4userspecialcuts' },
              { text: 'G4NeutronKiller', link: '/modules/processes/transportation/api/g4neutronkiller' }
            ]
          },
          {
            text: 'Decay',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/decay/' },
              { text: 'G4Decay', link: '/modules/processes/decay/api/g4decay' },
              { text: 'G4DecayProcessType', link: '/modules/processes/decay/api/g4decayprocesstype' },
              { text: 'G4DecayWithSpin', link: '/modules/processes/decay/api/g4decaywithspin' },
              { text: 'G4UnknownDecay', link: '/modules/processes/decay/api/g4unknowndecay' },
              { text: 'G4PionDecayMakeSpin', link: '/modules/processes/decay/api/g4piondecaymakespin' },
              { text: 'G4VExtDecayer', link: '/modules/processes/decay/api/g4vextdecayer' }
            ]
          },
          {
            text: 'Optical',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/optical/' },
              { text: 'G4OpAbsorption', link: '/modules/processes/optical/api/g4opabsorption' },
              { text: 'G4OpBoundaryProcess', link: '/modules/processes/optical/api/g4opboundaryprocess' },
              { text: 'G4OpRayleigh', link: '/modules/processes/optical/api/g4oprayleigh' },
              { text: 'G4OpMieHG', link: '/modules/processes/optical/api/g4opmiehg' },
              { text: 'G4OpWLS', link: '/modules/processes/optical/api/g4opwls' },
              { text: 'G4OpWLS2', link: '/modules/processes/optical/api/g4opwls2' },
              { text: 'G4WLSTimeGeneratorProfile', link: '/modules/processes/optical/api/g4wlstimegeneratorprofile' }
            ]
          },
          {
            text: 'Parameterisation',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/parameterisation/' },
              { text: 'G4VFastSimulationModel', link: '/modules/processes/parameterisation/api/G4VFastSimulationModel' },
              { text: 'G4FastSimulationManager', link: '/modules/processes/parameterisation/api/G4FastSimulationManager' },
              { text: 'G4FastSimulationManagerProcess', link: '/modules/processes/parameterisation/api/G4FastSimulationManagerProcess' },
              { text: 'G4GlobalFastSimulationManager', link: '/modules/processes/parameterisation/api/G4GlobalFastSimulationManager' },
              { text: 'G4FastTrack', link: '/modules/processes/parameterisation/api/G4FastTrack' },
              { text: 'G4FastStep', link: '/modules/processes/parameterisation/api/G4FastStep' },
              { text: 'G4FastHit', link: '/modules/processes/parameterisation/api/G4FastHit' },
              { text: 'G4FastSimHitMaker', link: '/modules/processes/parameterisation/api/G4FastSimHitMaker' },
              { text: 'G4FastSimulationHelper', link: '/modules/processes/parameterisation/api/G4FastSimulationHelper' },
              { text: 'G4FastSimulationVector', link: '/modules/processes/parameterisation/api/G4FastSimulationVector' },
              { text: 'G4VFastSimSensitiveDetector', link: '/modules/processes/parameterisation/api/G4VFastSimSensitiveDetector' }
            ]
          },
          {
            text: 'Cuts',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/cuts/' },
              { text: 'G4ProductionCuts', link: '/modules/processes/cuts/api/g4productioncuts' },
              { text: 'G4ProductionCutsTable', link: '/modules/processes/cuts/api/g4productioncutstable' },
              { text: 'G4MaterialCutsCouple', link: '/modules/processes/cuts/api/g4materialcutscouple' },
              { text: 'G4VRangeToEnergyConverter', link: '/modules/processes/cuts/api/g4vrangetoenergyconverter' },
              { text: 'G4RToEConvForElectron', link: '/modules/processes/cuts/api/g4rtoeconvforelectron' },
              { text: 'Helper Classes', link: '/modules/processes/cuts/api/helper-classes' }
            ]
          },
          {
            text: 'Biasing',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/biasing/' },
              { text: 'G4VBiasingOperator', link: '/modules/processes/biasing/api/g4vbiasingoperator' },
              { text: 'G4BOptrForceCollision', link: '/modules/processes/biasing/api/g4boptrforcecollision' },
              { text: 'G4BOptnChangeCrossSection', link: '/modules/processes/biasing/api/g4boptnchangecrosssection' },
              { text: 'G4GeometrySampler', link: '/modules/processes/biasing/api/g4geometrysampler' }
            ]
          },
          {
            text: 'Scoring',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/scoring/' },
              { text: 'G4ParallelWorldProcess', link: '/modules/processes/scoring/api/g4parallelworldprocess' },
              { text: 'G4ParallelWorldProcessStore', link: '/modules/processes/scoring/api/g4parallelworldprocessstore' },
              { text: 'G4ParallelWorldScoringProcess', link: '/modules/processes/scoring/api/g4parallelworldscoringprocess' },
              { text: 'G4ScoreSplittingProcess', link: '/modules/processes/scoring/api/g4scoresplittingprocess' }
            ]
          },
          {
            text: 'Solid State',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/modules/processes/solidstate/' },
              { text: 'G4Channeling', link: '/modules/processes/solidstate/api/g4channeling' },
              { text: 'G4ChannelingECHARM', link: '/modules/processes/solidstate/api/g4channelingecharm' },
              { text: 'G4ChannelingMaterialData', link: '/modules/processes/solidstate/api/g4channelingmaterialdata' },
              { text: 'G4ChannelingOptrChangeCrossSection', link: '/modules/processes/solidstate/api/g4channelingoptrchangecrosssection' },
              { text: 'G4ChannelingOptrMultiParticleChangeCrossSection', link: '/modules/processes/solidstate/api/g4channelingoptrmultiparticlechangecrosssection' },
              { text: 'G4ChannelingTrackData', link: '/modules/processes/solidstate/api/g4channelingtrackdata' },
              { text: 'G4LatticeManager', link: '/modules/processes/solidstate/api/g4latticemanager' },
              { text: 'G4LatticeReader', link: '/modules/processes/solidstate/api/g4latticereader' },
              { text: 'G4PhononDownconversion', link: '/modules/processes/solidstate/api/g4phonondownconversion' },
              { text: 'G4PhononPolarization', link: '/modules/processes/solidstate/api/g4phononpolarization' },
              { text: 'G4PhononReflection', link: '/modules/processes/solidstate/api/g4phononreflection' },
              { text: 'G4PhononScattering', link: '/modules/processes/solidstate/api/g4phononscattering' },
              { text: 'G4PhononTrac Map', link: '/modules/processes/solidstate/api/g4phonontracmap' },
              { text: 'G4VPhononProcess', link: '/modules/processes/solidstate/api/g4vphononprocess' }
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
          { text: 'Coverage Analysis', link: '/documentation-coverage-analysis' },
          { text: 'Documentation Guidelines', link: '/DOCUMENTATION_GUIDELINES' },
          { text: 'Auto API Docs Plan', link: '/auto-api-docs-plan' }
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
