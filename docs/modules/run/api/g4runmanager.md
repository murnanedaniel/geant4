# G4RunManager

**File**: `source/run/include/G4RunManager.hh`

## Overview

G4RunManager is the core class for run control in Geant4 sequential simulations. It manages the entire lifecycle of a simulation, including initialization of geometry and physics, event loop management, and communication with user-defined action classes. The RunManager acts as a singleton and is responsible for coordinating all aspects of simulation execution, from setup through event processing to termination.

## Class Description

G4RunManager orchestrates sequential (non-parallel) Geant4 simulations. The key responsibilities include:

- **Simulation Setup**: Manages user-provided detector geometry, physics processes, and primary event generation
- **Initialization**: Sets up geometry and physics tables before event processing
- **Event Loop Control**: Executes events sequentially with full control over processing
- **User Actions**: Integrates customizable user-defined actions at multiple points in the simulation
- **State Management**: Tracks application state transitions from initialization through event processing
- **Geometry Management**: Handles geometry modifications and reoptimization between runs

For sequential mode operation, users MUST provide concrete implementations of three mandatory abstract classes:
- **G4VUserDetectorConstruction**: Defines detector geometry and materials
- **G4VUserPhysicsList**: Specifies particle types and physical processes
- **G4VUserPrimaryGeneratorAction**: Generates primary particles for each event

Additionally, users can customize simulation behavior by deriving from five optional action classes:
- **G4UserRunAction**: Perform actions before/after each run
- **G4UserEventAction**: Perform actions before/after each event
- **G4UserStackingAction**: Control track stacking and priority
- **G4UserTrackingAction**: Perform actions on tracks
- **G4UserSteppingAction**: Perform actions on each simulation step

Users can also use **G4VUserActionInitialization** to instantiate all six user action classes in one place (1 mandatory + 5 optional).

## Important Notes

- G4RunManager MUST be constructed in main() and acts as a singleton
- Users MUST NOT construct more than one RunManager instance
- The run manager state cannot be reset to zero once created
- G4RunManager controls all application state changes (see G4ApplicationState.hh)
- In multi-threaded mode, use G4MTRunManager or G4TaskingRunManager instead

## Static Methods

### GetRunManager

```cpp
static G4RunManager* GetRunManager();
```

Returns the singleton pointer of G4RunManager or its derived class.

**Returns**: Pointer to the G4RunManager singleton instance

**Location**: G4RunManager.hh:146

**Note**: In multi-threaded builds, this returns the per-thread singleton.

## Constructors & Destructor

### Constructor (Sequential Mode)

```cpp
G4RunManager();
```

Constructs a G4RunManager for sequential (single-threaded) simulation.

**Location**: G4RunManager.hh:151

**Usage Notes**:
- Should be called once at the beginning of main()
- Initializes internal kernel and event manager
- Must be deleted at the end of main()

### Constructor (Protected - Multi-threaded)

```cpp
protected:
G4RunManager(RMType rmType);
```

Protected constructor used internally for multi-threaded mode. Not for user code.

**Location**: G4RunManager.hh:590

### Destructor

```cpp
virtual ~G4RunManager();
```

Destroys the RunManager, cleaning up all managed objects.

**Location**: G4RunManager.hh:152

**Important**: Users must delete the RunManager instance at the end of main().

### Deleted Copy Operations

```cpp
G4RunManager(const G4RunManager&) = delete;
G4RunManager& operator=(const G4RunManager&) = delete;
```

Copy construction and assignment are explicitly disabled to enforce singleton behavior.

**Location**: G4RunManager.hh:155-156

## Initialization Methods

### Initialize

```cpp
virtual void Initialize();
```

Invokes all necessary initialization procedures for an event loop.

**Location**: G4RunManager.hh:180

**Precondition**: Must be invoked at 'PreInit' or 'Idle' state

**State Transition**: PreInit/Idle → Init → Idle

**Details**:
- Invokes two protected methods: InitializeGeometry() and InitializePhysics()
- Can be called multiple times after first initialization
- Required after geometry, physics process, or cut-off changes
- If user forgets to call after modifications, BeamOn() will invoke it automatically

**Usage Notes**:
```cpp
// Initial setup
runManager->Initialize();

// After geometry changes
geometry->ModifyVolume(...);
runManager->Initialize();  // Must be called again

// BeamOn will call Initialize if needed
runManager->BeamOn(1000);
```

### InitializeGeometry

```cpp
virtual void InitializeGeometry();
```

Initializes detector geometry by invoking user's G4VUserDetectorConstruction.

**Location**: G4RunManager.hh:209

**Precondition**: Called from Initialize() method

**Details**:
- Accesses user's concrete G4VUserDetectorConstruction class
- Constructs the world volume and geometry hierarchy
- Performs geometry optimization for navigation efficiency
- Must be called once before event loop

**See Also**: DefineWorldVolume()

### InitializePhysics

```cpp
virtual void InitializePhysics();
```

Initializes physics processes by invoking user's G4VUserPhysicsList.

**Location**: G4RunManager.hh:210

**Precondition**: Called from Initialize() method

**Details**:
- Accesses user's concrete G4VUserPhysicsList class
- Builds physics tables for all particles and processes
- Prepares physics models and cross-section tables
- Must be called once before event loop

**See Also**: PhysicsHasBeenModified()

## Event Loop Control Methods

### BeamOn

```cpp
virtual void BeamOn(G4int n_event,
                    const char* macroFile = nullptr,
                    G4int n_select = -1);
```

Starts an event loop processing `n_event` events.

**Parameters**:
- `n_event`: Number of events to process (>= 0)
- `macroFile`: Optional macro file to execute at end of each event
- `n_select`: Execute macro only for first n_select events (if > 0); if -1, execute after every event

**Location**: G4RunManager.hh:167

**Precondition**: Must be invoked at 'Idle' state

**State Transition**: Idle → GeomClosed → Idle (or aborted)

**Details**:
- Validates all initialization conditions before starting
- Executes entire event loop if conditions are satisfied
- Returns to 'Idle' state when loop completes or is aborted
- If macroFile is specified, it executes after each event (or every n_select events)

**Usage Notes**:
```cpp
// Simple event loop
runManager->BeamOn(1000);

// With macro execution after each event
runManager->BeamOn(1000, "macro.mac");

// Execute macro only for first 100 events
runManager->BeamOn(1000, "macro.mac", 100);
```

### DoEventLoop

```cpp
virtual void DoEventLoop(G4int n_event,
                         const char* macroFile = nullptr,
                         G4int n_select = -1);
```

Controls the event loop, invoked from BeamOn() method.

**Parameters**:
- `n_event`: Number of events to process
- `macroFile`: Optional macro file to execute
- `n_select`: Execute macro only for first n_select events

**Location**: G4RunManager.hh:229

**Details**:
- Called from BeamOn() after condition confirmation
- Invoked in sequence: RunInitialization() → DoEventLoop() → RunTermination()
- Calls InitializeEventLoop(), ProcessOneEvent(), and TerminateEventLoop()
- Handles macro file execution between events
- Implements the core event processing loop

**See Also**: BeamOn(), ProcessOneEvent(), RunInitialization(), RunTermination()

### ProcessOneEvent

```cpp
virtual void ProcessOneEvent(G4int i_event);
```

Processes a single event with the given event number.

**Parameters**:
- `i_event`: Event index (0-based)

**Location**: G4RunManager.hh:235

**Precondition**: Called from DoEventLoop()

**Details**:
- Called for each event in the loop
- Generates primary vertices via user's G4VUserPrimaryGeneratorAction
- Delegates physics processing to G4EventManager
- Updates scoring if scoring volumes are defined
- Invokes user event actions before and after processing

**See Also**: GenerateEvent(), AnalyzeEvent()

### ConfirmBeamOnCondition

```cpp
virtual G4bool ConfirmBeamOnCondition();
```

Validates all necessary initializations before event loop.

**Returns**:
- `true` if all conditions satisfied
- `false` if initialization incomplete

**Location**: G4RunManager.hh:227

**Precondition**: Called from BeamOn() method

**Details**:
- Checks if geometry has been initialized
- Checks if physics has been initialized
- Verifies user actions are properly registered
- Returns false to skip BeamOn() if conditions not met

## Event-Related Helper Methods

### GenerateEvent

```cpp
virtual G4Event* GenerateEvent(G4int i_event);
```

Generates primary particles for an event.

**Parameters**:
- `i_event`: Event index

**Returns**: Pointer to newly constructed G4Event object

**Location**: G4RunManager.hh:247

**Details**:
- Constructs a new G4Event object
- Invokes user's G4VUserPrimaryGeneratorAction to generate primary particles
- Can be overridden to use custom event source (e.g., ODBMS)

**See Also**: G4VUserPrimaryGeneratorAction

### AnalyzeEvent

```cpp
virtual void AnalyzeEvent(G4Event* anEvent);
```

Analyzes event after processing.

**Parameters**:
- `anEvent`: Pointer to processed G4Event

**Location**: G4RunManager.hh:248

**Details**:
- Invoked after each event processing completes
- Stores event to database if G4VPersistentManager is defined
- Can be overridden for custom event analysis or storage

## Run Management Methods

### RunInitialization

```cpp
virtual void RunInitialization();
```

Initializes a run before event loop processing.

**Location**: G4RunManager.hh:228

**Details**:
- Creates a G4Run object
- Resets event counter
- Invokes user's G4UserRunAction::BeginOfRunAction()
- Prepares scoring worlds

### RunTermination

```cpp
virtual void RunTermination();
```

Terminates a run after event loop processing.

**Location**: G4RunManager.hh:230

**Details**:
- Invokes user's G4UserRunAction::EndOfRunAction()
- Deletes or stores G4Run object
- Can be overridden for custom run analysis or ODBMS storage

### InitializeEventLoop

```cpp
virtual void InitializeEventLoop(G4int n_event,
                                 const char* macroFile = nullptr,
                                 G4int n_select = -1);
```

Granular initialization of event loop called from DoEventLoop().

**Parameters**:
- `n_event`: Number of events to process
- `macroFile`: Optional macro file
- `n_select`: Selective macro execution parameter

**Location**: G4RunManager.hh:233-234

**Details**:
- Sets up event loop parameters
- Initializes macro file execution if specified
- Prepares iteration counters

### TerminateOneEvent

```cpp
virtual void TerminateOneEvent();
```

Terminates processing of a single event.

**Location**: G4RunManager.hh:236

**Details**:
- Called at end of each event processing
- Invokes user's event termination actions
- Stacks previous event if history is being kept
- Cleans up unnecessary events based on storage settings

### TerminateEventLoop

```cpp
virtual void TerminateEventLoop();
```

Terminates the entire event loop.

**Location**: G4RunManager.hh:237

**Details**:
- Final cleanup after all events processed
- Closes files
- Finalizes any pending operations

## Geometry Management Methods

### DefineWorldVolume

```cpp
virtual void DefineWorldVolume(G4VPhysicalVolume* worldVol,
                               G4bool topologyIsChanged = true);
```

Sets the world (top-level) physical volume for the simulation geometry.

**Parameters**:
- `worldVol`: Pointer to the world physical volume
- `topologyIsChanged`: Flag indicating if geometry topology differs from previous run
  - `true` (default): Full geometry optimization performed
  - `false`: Preserves original optimization and navigation history

**Location**: G4RunManager.hh:188

**Details**:
- Must be called if geometry setup changed between runs
- Invoked automatically during InitializeGeometry()
- Setting topologyIsChanged = false improves performance when only volume positions/sizes changed
- Rebuilds navigation structure and spatial index if topology changed

**Usage Notes**:
```cpp
// Full geometry rebuild - topology changed
runManager->DefineWorldVolume(newWorld, true);

// Geometry modified but topology unchanged (faster)
runManager->DefineWorldVolume(newWorld, false);
```

### GeometryHasBeenModified

```cpp
void GeometryHasBeenModified(G4bool prop = true);
```

Signals that detector geometry has been modified after initialization.

**Parameters**:
- `prop`: Flag indicating if directly invoked (true) or via UI command (false)

**Location**: G4RunManager.hh:268

**Details**:
- Must be called/executed if user changes geometry after Initialize()
- At next BeamOn(), all geometry optimizations are recalculated
- More efficient than ReinitializeGeometry() when only geometry positions changed
- Can be invoked via UI command: `/run/geometry/geometry/GeometryModified`

**Usage Notes**:
```cpp
// Modify geometry position
worldLog->SetUserLimits(newLimits);

// Signal modification
runManager->GeometryHasBeenModified();

// Next BeamOn() will reoptimize geometry
runManager->BeamOn(1000);
```

### ReinitializeGeometry

```cpp
void ReinitializeGeometry(G4bool destroyFirst = false,
                          G4bool prop = true);
```

Re-invokes detector construction and reoptimizes geometry.

**Parameters**:
- `destroyFirst`: If true, clears all solids, logical and physical volumes
  - `false` (default): Preserves existing volumes
  - `true`: Deletes all geometry to start fresh
- `prop`: Flag for direct C++ invocation (true) vs UI command (false)

**Location**: G4RunManager.hh:279

**Details**:
- More comprehensive than GeometryHasBeenModified()
- If destroyFirst=true, clears G4SolidStore, G4LogicalVolumeStore, G4PhysicalVolumeStore
- Re-invokes user's G4VUserDetectorConstruction::Construct()
- Rebuilds all geometry optimizations
- Use when geometry structure (topology) has changed

**Usage Notes**:
```cpp
// Rebuild entire geometry from scratch
runManager->ReinitializeGeometry(true);

// Reinitialize but preserve existing volumes
runManager->ReinitializeGeometry(false);
```

### ReOptimize

```cpp
void ReOptimize(G4LogicalVolume* logVol);
```

Re-optimizes a specific logical volume and its hierarchy.

**Parameters**:
- `logVol`: Logical volume to re-optimize

**Location**: G4RunManager.hh:302

**Details**:
- Targeted optimization for specific volume only
- More efficient than full geometry reoptimization
- Use when only one volume region has changed
- Avoids full geometry tree optimization

**See Also**: ReOptimizeMotherOf()

### ReOptimizeMotherOf

```cpp
void ReOptimizeMotherOf(G4VPhysicalVolume* physVol);
```

Re-optimizes the mother volume of a physical volume.

**Parameters**:
- `physVol`: Physical volume whose mother should be re-optimized

**Location**: G4RunManager.hh:299

**Details**:
- Reoptimizes only the mother logical volume
- Useful when physical volume position/orientation changed
- Avoids full geometry tree reoptimization

**Usage Notes**:
```cpp
// Modify physical volume position
physVol->SetTranslation(newPosition);

// Re-optimize only the mother volume
runManager->ReOptimizeMotherOf(physVol);
```

### PhysicsHasBeenModified

```cpp
inline void PhysicsHasBeenModified();
```

Signals that physics processes have been modified.

**Location**: G4RunManager.hh:286

**Details**:
- Must be called if user changes physics processes (activate/deactivate)
- Invokes BuildPhysicsTable() on PhysicsList for all particles
- Refreshes all physics tables regardless of cut changes
- Can be invoked via UI command: `/run/physics/physics/PhysicsModified`

**Usage Notes**:
```cpp
// Change process activation
process->SetProcessActivationFlag(newParticle, false);

// Rebuild physics tables
runManager->PhysicsHasBeenModified();
```

### SetGeometryToBeOptimized

```cpp
inline void SetGeometryToBeOptimized(G4bool vl);
```

Controls whether geometry optimization is performed.

**Parameters**:
- `vl`: true to enable optimization (default), false to disable

**Location**: G4RunManager.hh:304

**Usage Notes**:
```cpp
// Disable geometry optimization (useful for debugging)
runManager->SetGeometryToBeOptimized(false);

// Enable geometry optimization (default)
runManager->SetGeometryToBeOptimized(true);
```

### GetGeometryToBeOptimized

```cpp
inline G4bool GetGeometryToBeOptimized();
```

Queries whether geometry optimization is enabled.

**Returns**: true if geometry optimization is enabled

**Location**: G4RunManager.hh:312

## State Control Methods

### AbortRun

```cpp
virtual void AbortRun(G4bool softAbort = false);
```

Safely aborts the current event loop.

**Parameters**:
- `softAbort`: Abort behavior
  - `false` (default): Aborts immediately, current event is aborted
  - `true`: Aborts after current event completes

**Location**: G4RunManager.hh:197

**Precondition**: Available in 'GeomClosed' and 'EventProc' states

**State Transition**: EventProc/GeomClosed → Idle

**Details**:
- Provides safe interruption of event loop
- With softAbort=false: Stops immediately
- With softAbort=true: Finishes current event then stops
- Application state changed to 'Idle' after abort
- Another event loop can be started after abort

**Usage Notes**:
```cpp
// Hard abort - stop immediately
runManager->AbortRun(false);

// Soft abort - finish current event
runManager->AbortRun(true);
```

### AbortEvent

```cpp
virtual void AbortEvent();
```

Aborts the currently processing event.

**Location**: G4RunManager.hh:202

**Precondition**: Available only in 'EventProc' state

**Details**:
- Aborts only the current event
- Remaining events in loop will still be processed
- Current event will not contribute to run results
- Event actions and stepping are terminated immediately

**Usage Notes**:
```cpp
// In user action code, abort current event
if (condition) {
    runManager->AbortEvent();
}
```

## User Initialization Methods

### SetUserInitialization (G4VUserDetectorConstruction)

```cpp
virtual void SetUserInitialization(G4VUserDetectorConstruction* userInit);
```

Registers user's detector construction class.

**Parameters**:
- `userInit`: Pointer to concrete G4VUserDetectorConstruction subclass

**Location**: G4RunManager.hh:342

**Precondition**: Must be called before Initialize()

**Details**:
- Mandatory for sequential mode
- User's Construct() method will be called during InitializeGeometry()
- Defines detector geometry and materials
- Only one instance can be registered

### SetUserInitialization (G4VUserPhysicsList)

```cpp
virtual void SetUserInitialization(G4VUserPhysicsList* userInit);
```

Registers user's physics list class.

**Parameters**:
- `userInit`: Pointer to concrete G4VUserPhysicsList subclass

**Location**: G4RunManager.hh:343

**Precondition**: Must be called before Initialize()

**Details**:
- Mandatory for sequential mode
- User's ConstructParticle() and ConstructProcess() methods called during InitializePhysics()
- Specifies all particles and physics processes for simulation
- Only one instance can be registered

### SetUserInitialization (G4VUserActionInitialization)

```cpp
virtual void SetUserInitialization(G4VUserActionInitialization* userInit);
```

Registers user action initialization class.

**Parameters**:
- `userInit`: Pointer to concrete G4VUserActionInitialization subclass

**Location**: G4RunManager.hh:344

**Details**:
- Convenient way to register all user actions in one place
- User instantiates 1 mandatory and up to 5 optional action classes
- Recommended approach for action registration
- Can register primary generator action (mandatory) and other actions (optional)

### SetUserInitialization (G4UserWorkerInitialization)

```cpp
virtual void SetUserInitialization(G4UserWorkerInitialization* userInit);
```

Registers worker thread initialization (multi-threaded mode only).

**Parameters**:
- `userInit`: Pointer to G4UserWorkerInitialization

**Location**: G4RunManager.hh:345

**Note**: For multi-threaded mode; no effect in sequential mode.

### SetUserInitialization (G4UserWorkerThreadInitialization)

```cpp
virtual void SetUserInitialization(G4UserWorkerThreadInitialization* userInit);
```

Registers worker thread initialization with advanced features (multi-threaded mode only).

**Parameters**:
- `userInit`: Pointer to G4UserWorkerThreadInitialization

**Location**: G4RunManager.hh:346

**Note**: For multi-threaded mode; no effect in sequential mode.

## User Action Methods

All following methods register user-defined action classes. These actions are invoked at various points during event processing to allow user customization.

### SetUserAction (G4UserRunAction)

```cpp
virtual void SetUserAction(G4UserRunAction* userAction);
```

Registers action class for run-level callbacks.

**Parameters**:
- `userAction`: Pointer to G4UserRunAction subclass

**Location**: G4RunManager.hh:347

**Details**:
- BeginOfRunAction() called at start of run
- EndOfRunAction() called at end of run
- Access to run statistics and results
- Multiple instances allowed

### SetUserAction (G4VUserPrimaryGeneratorAction)

```cpp
virtual void SetUserAction(G4VUserPrimaryGeneratorAction* userAction);
```

Registers primary particle generator action.

**Parameters**:
- `userAction`: Pointer to G4VUserPrimaryGeneratorAction subclass

**Location**: G4RunManager.hh:348

**Details**:
- Mandatory for event processing
- GeneratePrimaries() called for each event
- Generate primary vertices and particles
- Only one instance allowed

### SetUserAction (G4UserEventAction)

```cpp
virtual void SetUserAction(G4UserEventAction* userAction);
```

Registers action class for event-level callbacks.

**Parameters**:
- `userAction`: Pointer to G4UserEventAction subclass

**Location**: G4RunManager.hh:349

**Details**:
- BeginOfEventAction() called before event processing
- EndOfEventAction() called after event processing
- Access to event data and results
- Multiple instances allowed

### SetUserAction (G4UserStackingAction)

```cpp
virtual void SetUserAction(G4UserStackingAction* userAction);
```

Registers action class for track stacking control.

**Parameters**:
- `userAction`: Pointer to G4UserStackingAction subclass

**Location**: G4RunManager.hh:350

**Details**:
- ClassifyNewTrack() called for each newly created track
- Control track priority and stacking classification
- Only one instance allowed

### SetUserAction (G4UserTrackingAction)

```cpp
virtual void SetUserAction(G4UserTrackingAction* userAction);
```

Registers action class for track-level callbacks.

**Parameters**:
- `userAction`: Pointer to G4UserTrackingAction subclass

**Location**: G4RunManager.hh:351

**Details**:
- PreUserTrackingAction() called before track processing
- PostUserTrackingAction() called after track processing
- Access to track information and results
- Multiple instances allowed

### SetUserAction (G4UserSteppingAction)

```cpp
virtual void SetUserAction(G4UserSteppingAction* userAction);
```

Registers action class for step-level callbacks.

**Parameters**:
- `userAction`: Pointer to G4UserSteppingAction subclass

**Location**: G4RunManager.hh:352

**Details**:
- UserSteppingAction() called after each simulation step
- Finest granularity for customization
- Access to step information and physics processes
- Multiple instances allowed

## User Action Accessor Methods

### GetUserDetectorConstruction

```cpp
inline const G4VUserDetectorConstruction* GetUserDetectorConstruction() const;
```

Returns registered detector construction class.

**Returns**: Pointer to registered G4VUserDetectorConstruction

**Location**: G4RunManager.hh:355-358

### GetUserPhysicsList

```cpp
inline const G4VUserPhysicsList* GetUserPhysicsList() const;
```

Returns registered physics list.

**Returns**: Pointer to registered G4VUserPhysicsList

**Location**: G4RunManager.hh:359

### GetUserActionInitialization

```cpp
inline const G4VUserActionInitialization* GetUserActionInitialization() const;
```

Returns registered action initialization class.

**Returns**: Pointer to registered G4VUserActionInitialization

**Location**: G4RunManager.hh:360-363

### GetNonConstUserActionInitialization

```cpp
inline G4VUserActionInitialization* GetNonConstUserActionInitialization() const;
```

Returns non-const pointer to registered action initialization.

**Returns**: Non-const pointer to G4VUserActionInitialization

**Location**: G4RunManager.hh:364-367

### GetUserRunAction

```cpp
inline const G4UserRunAction* GetUserRunAction() const;
```

Returns registered run action.

**Returns**: Pointer to registered G4UserRunAction

**Location**: G4RunManager.hh:376

### GetUserPrimaryGeneratorAction

```cpp
inline const G4VUserPrimaryGeneratorAction* GetUserPrimaryGeneratorAction() const;
```

Returns registered primary generator action.

**Returns**: Pointer to registered G4VUserPrimaryGeneratorAction

**Location**: G4RunManager.hh:377-380

### GetUserEventAction

```cpp
inline const G4UserEventAction* GetUserEventAction() const;
```

Returns registered event action.

**Returns**: Pointer to registered G4UserEventAction

**Location**: G4RunManager.hh:381

### GetUserStackingAction

```cpp
inline const G4UserStackingAction* GetUserStackingAction() const;
```

Returns registered stacking action.

**Returns**: Pointer to registered G4UserStackingAction

**Location**: G4RunManager.hh:382

### GetUserTrackingAction

```cpp
inline const G4UserTrackingAction* GetUserTrackingAction() const;
```

Returns registered tracking action.

**Returns**: Pointer to registered G4UserTrackingAction

**Location**: G4RunManager.hh:383

### GetUserSteppingAction

```cpp
inline const G4UserSteppingAction* GetUserSteppingAction() const;
```

Returns registered stepping action.

**Returns**: Pointer to registered G4UserSteppingAction

**Location**: G4RunManager.hh:384

## Run and Event Accessors

### GetCurrentRun

```cpp
inline const G4Run* GetCurrentRun() const;
```

Returns the current run object.

**Returns**: Pointer to current G4Run, or nullptr

**Availability**: 'GeomClosed' and 'EventProc' states

**Location**: G4RunManager.hh:486

### GetNonConstCurrentRun

```cpp
inline G4Run* GetNonConstCurrentRun() const;
```

Returns non-const pointer to current run object.

**Returns**: Non-const pointer to current G4Run

**Location**: G4RunManager.hh:487

### GetCurrentEvent

```cpp
inline const G4Event* GetCurrentEvent() const;
```

Returns the current event being processed.

**Returns**: Pointer to current G4Event, or nullptr

**Availability**: 'EventProc' state only

**Location**: G4RunManager.hh:491

### GetPreviousEvent

```cpp
inline const G4Event* GetPreviousEvent(G4int i) const;
```

Returns a previous event from history.

**Parameters**:
- `i`: Event index in history (1 = previous event, 2 = two events ago, etc.)

**Returns**: Pointer to previous G4Event, or nullptr if not available

**Availability**: 'EventProc' state

**Location**: G4RunManager.hh:498-508

**Details**:
- Returns nullptr if event loop hasn't reached requested event yet
- SetNumberOfEventsToBeStored() must be called before event loop

**Usage Notes**:
```cpp
// Keep last 100 events for pileup digitization
runManager->SetNumberOfEventsToBeStored(100);
runManager->BeamOn(1000);

// In user action, access previous event
const G4Event* prevEvent = runManager->GetPreviousEvent(1);
```

### SetNumberOfEventsToBeStored

```cpp
inline void SetNumberOfEventsToBeStored(G4int val);
```

Sets the number of previous events to keep in memory.

**Parameters**:
- `val`: Number of previous events to retain

**Location**: G4RunManager.hh:482

**Precondition**: Must be called before event loop starts

**Details**:
- val+1 previous events are deleted to free memory
- Useful for pileup digitization (using recent events)
- Default is 0 (no previous events kept)

**Usage Notes**:
```cpp
// Keep last 5 events
runManager->SetNumberOfEventsToBeStored(5);
```

## Run Statistics and Control

### GetCurrentEventProcessed

Returns number of events processed in current run (via public member).

### SetRunIDCounter

```cpp
inline void SetRunIDCounter(G4int i);
```

Sets the run number counter.

**Parameters**:
- `i`: New run ID counter value

**Location**: G4RunManager.hh:512

**Details**:
- Counter is initialized to 0
- Incremented by 1 for each BeamOn()
- Useful for tracking multi-run simulations

### GetNumberOfSelectEvents

```cpp
inline G4int GetNumberOfSelectEvents() const;
```

Returns number of events for selective macro execution.

**Returns**: n_select parameter from most recent BeamOn() call

**Location**: G4RunManager.hh:517

### GetSelectMacro

```cpp
inline const G4String& GetSelectMacro() const;
```

Returns the macro file name for selective execution.

**Returns**: Macro file name from most recent BeamOn() call

**Location**: G4RunManager.hh:518

### SetNumberOfEventsToBeProcessed

```cpp
inline void SetNumberOfEventsToBeProcessed(G4int val);
```

Sets total number of events for run.

**Parameters**:
- `val`: Number of events to process

**Location**: G4RunManager.hh:515

### GetNumberOfEventsToBeProcessed

```cpp
inline G4int GetNumberOfEventsToBeProcessed() const;
```

Gets total number of events configured for run.

**Returns**: Number of events

**Location**: G4RunManager.hh:516

## Verbosity and Progress

### SetVerboseLevel

```cpp
inline void SetVerboseLevel(G4int vl);
```

Sets the verbosity level for run manager output.

**Parameters**:
- `vl`: Verbosity level (0=quiet, 1=normal, 2=verbose)

**Location**: G4RunManager.hh:469-473

**Usage Notes**:
```cpp
// Quiet mode
runManager->SetVerboseLevel(0);

// Normal output
runManager->SetVerboseLevel(1);

// Verbose output
runManager->SetVerboseLevel(2);
```

### GetVerboseLevel

```cpp
inline G4int GetVerboseLevel() const;
```

Returns current verbosity level.

**Returns**: Current verbosity level

**Location**: G4RunManager.hh:474

### SetPrintProgress

```cpp
inline void SetPrintProgress(G4int i);
```

Sets event progress printing frequency.

**Parameters**:
- `i`: Print progress every i events (0 = no progress output)

**Location**: G4RunManager.hh:476

**Usage Notes**:
```cpp
// Print progress every 100 events
runManager->SetPrintProgress(100);
```

### GetPrintProgress

```cpp
inline G4int GetPrintProgress();
```

Returns event progress printing frequency.

**Returns**: Progress printing interval

**Location**: G4RunManager.hh:475

## Random Number Management

### SetRandomNumberStore

```cpp
inline void SetRandomNumberStore(G4bool flag);
```

Enables/disables random number status storage.

**Parameters**:
- `flag`: true to enable storage, false to disable

**Location**: G4RunManager.hh:432

### GetRandomNumberStore

```cpp
inline G4bool GetRandomNumberStore() const;
```

Queries random number status storage flag.

**Returns**: true if enabled

**Location**: G4RunManager.hh:433

### SetRandomNumberStoreDir

```cpp
inline void SetRandomNumberStoreDir(const G4String& dir);
```

Sets directory for random number status files.

**Parameters**:
- `dir`: Directory path (trailing '/' is optional)

**Location**: G4RunManager.hh:434-452

**Details**:
- Creates directory if it doesn't exist
- Default directory is "./"
- Status files saved here for reproducibility

### GetRandomNumberStoreDir

```cpp
inline const G4String& GetRandomNumberStoreDir() const;
```

Returns random number status directory.

**Returns**: Directory path

**Location**: G4RunManager.hh:453

### rndmSaveThisRun

```cpp
virtual void rndmSaveThisRun();
```

Saves random number status for current run.

**Location**: G4RunManager.hh:323

### rndmSaveThisEvent

```cpp
virtual void rndmSaveThisEvent();
```

Saves random number status for current event.

**Location**: G4RunManager.hh:324

### RestoreRandomNumberStatus

```cpp
virtual void RestoreRandomNumberStatus(const G4String& fileN);
```

Restores random number generator state from file.

**Parameters**:
- `fileN`: Status file name

**Location**: G4RunManager.hh:325

### StoreRandomNumberStatusToG4Event

```cpp
inline void StoreRandomNumberStatusToG4Event(G4int vl);
```

Controls random number status storage in G4Event.

**Parameters**:
- `vl`: Storage mode
  - 0: None (default)
  - 1: Before primary particle generation
  - 2: After primary generation, before event processing
  - 3: Both

**Location**: G4RunManager.hh:421-425

### GetFlagRandomNumberStatusToG4Event

```cpp
inline G4int GetFlagRandomNumberStatusToG4Event() const;
```

Returns random number status storage flag for events.

**Returns**: Current storage mode (0-3)

**Location**: G4RunManager.hh:427-430

### SetRandomNumberStorePerEvent

```cpp
inline void SetRandomNumberStorePerEvent(G4bool flag);
```

Enables per-event random number status storage.

**Parameters**:
- `flag`: true to store RNG status for each event

**Location**: G4RunManager.hh:466

### GetRandomNumberStorePerEvent

```cpp
inline G4bool GetRandomNumberStorePerEvent() const;
```

Queries per-event random number storage flag.

**Returns**: true if enabled

**Location**: G4RunManager.hh:467

### GetRandomNumberStatusForThisRun

```cpp
inline const G4String& GetRandomNumberStatusForThisRun() const;
```

Returns random number status file for current run.

**Returns**: Status file name

**Location**: G4RunManager.hh:454-457

### GetRandomNumberStatusForThisEvent

```cpp
inline const G4String& GetRandomNumberStatusForThisEvent() const;
```

Returns random number status for current event.

**Returns**: Status file name

**Location**: G4RunManager.hh:458-465

## Geometry and Version Information

### GetVersionString

```cpp
inline const G4String& GetVersionString() const;
```

Returns Geant4 version string.

**Returns**: Version string (e.g., "11.0.0")

**Location**: G4RunManager.hh:409

### IfGeometryHasBeenDestroyed

```cpp
static G4bool IfGeometryHasBeenDestroyed();
```

Queries if geometry has been destroyed (static flag).

**Returns**: true if geometry was destroyed

**Location**: G4RunManager.hh:319

**Note**: Used mainly in multi-threaded mode for RNG restoration.

### DumpRegion (by name)

```cpp
void DumpRegion(const G4String& rname) const;
```

Prints information about a region.

**Parameters**:
- `rname`: Region name

**Location**: G4RunManager.hh:256

### DumpRegion (by pointer)

```cpp
void DumpRegion(G4Region* region = nullptr) const;
```

Prints information about a region or all regions.

**Parameters**:
- `region`: Pointer to region (nullptr = all regions)

**Location**: G4RunManager.hh:260

### GetNumberOfParallelWorld

```cpp
inline G4int GetNumberOfParallelWorld() const;
```

Returns number of parallel worlds defined.

**Returns**: Number of parallel worlds

**Location**: G4RunManager.hh:514

## Scoring and Advanced Features

### ConstructScoringWorlds

```cpp
virtual void ConstructScoringWorlds();
```

Constructs scoring mesh worlds.

**Location**: G4RunManager.hh:321

**Details**:
- Creates scoring volume meshes
- Called during initialization if scoring is configured

### SetDCtable

```cpp
inline void SetDCtable(G4DCtable* DCtbl);
```

Sets the digitizer collection table.

**Parameters**:
- `DCtbl`: Pointer to G4DCtable

**Location**: G4RunManager.hh:519

### GetRunManagerType

```cpp
inline RMType GetRunManagerType() const;
```

Returns the type of run manager.

**Returns**: RMType enum value (sequentialRM, masterRM, workerRM, etc.)

**Location**: G4RunManager.hh:530

## Stack Management

### SetNumberOfAdditionalWaitingStacks

```cpp
inline void SetNumberOfAdditionalWaitingStacks(G4int iAdd);
```

Defines additional track waiting stacks.

**Parameters**:
- `iAdd`: Number of additional waiting stacks

**Location**: G4RunManager.hh:390-393

**Precondition**: Must be invoked at 'PreInit', 'Init', or 'Idle' states

**Details**:
- Creates extra stacks for track classification
- User can then use corresponding ENUM values in G4ClassificationOfNewTrack

### SetDefaultClassification (by track status)

```cpp
inline void SetDefaultClassification(G4TrackStatus ts,
                                     G4ClassificationOfNewTrack val,
                                     G4ExceptionSeverity es =
                                         G4ExceptionSeverity::IgnoreTheIssue);
```

Sets default classification for new tracks of given status.

**Parameters**:
- `ts`: Track status type
- `val`: Default classification
- `es`: Exception severity if UserStackingAction changes classification

**Location**: G4RunManager.hh:399-402

### SetDefaultClassification (by particle)

```cpp
inline void SetDefaultClassification(const G4ParticleDefinition* pd,
                                     G4ClassificationOfNewTrack val,
                                     G4ExceptionSeverity es =
                                         G4ExceptionSeverity::IgnoreTheIssue);
```

Sets default classification for new tracks of given particle type.

**Parameters**:
- `pd`: Particle type
- `val`: Default classification
- `es`: Exception severity if UserStackingAction changes classification

**Location**: G4RunManager.hh:403-406

## Primary Vertex and Transformation

### SetPrimaryTransformer

```cpp
inline void SetPrimaryTransformer(G4PrimaryTransformer* pt);
```

Sets custom primary vertex transformation.

**Parameters**:
- `pt`: Pointer to G4PrimaryTransformer

**Location**: G4RunManager.hh:411-414

**Details**:
- Allows custom transformation of primary vertices
- Advanced feature for special simulations

## Usage Example

### Complete Setup Example

```cpp
#include "G4RunManager.hh"
#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"
#include "MyActionInitialization.hh"

int main() {
    // Create run manager
    G4RunManager* runManager = G4RunManager::GetRunManager();

    // Register mandatory user initialization
    runManager->SetUserInitialization(new MyDetectorConstruction());
    runManager->SetUserInitialization(new MyPhysicsList());

    // Register user actions (all optional)
    runManager->SetUserInitialization(new MyActionInitialization());

    // Initialize geometry and physics
    runManager->Initialize();

    // Configure run parameters
    runManager->SetVerboseLevel(1);
    runManager->SetPrintProgress(100);

    // Run simulation
    G4int nofEvents = 1000;
    runManager->BeamOn(nofEvents);

    // Clean up
    delete runManager;

    return 0;
}
```

### Geometry Modification Example

```cpp
void ModifyGeometry() {
    G4RunManager* runManager = G4RunManager::GetRunManager();

    // Get current geometry and modify it
    G4LogicalVolume* detector = ...;  // retrieve existing volume
    detector->SetVisAttributes(...);  // modify properties

    // Signal geometry change
    if (topologyChanged) {
        runManager->ReinitializeGeometry(true);
    } else {
        runManager->GeometryHasBeenModified(true);
    }

    // Continue with simulation
    runManager->BeamOn(1000);
}
```

### Physics Modification Example

```cpp
void ModifyPhysics() {
    G4RunManager* runManager = G4RunManager::GetRunManager();

    // Access physics list and modify processes
    G4VUserPhysicsList* physicsList =
        runManager->GetNonConstPhysicsList();

    // Activate/deactivate processes
    // ... modify processes ...

    // Signal physics change
    runManager->PhysicsHasBeenModified();

    // Continue with simulation
    runManager->BeamOn(1000);
}
```

### Previous Event Access Example

```cpp
void ProcessEvent() {
    G4RunManager* runManager = G4RunManager::GetRunManager();

    // Keep last 100 events for pileup
    runManager->SetNumberOfEventsToBeStored(100);

    // In user action
    const G4Event* prevEvent = runManager->GetPreviousEvent(1);
    if (prevEvent) {
        // Use previous event data for digitization
    }
}
```

## Important Implementation Notes

### Singleton Behavior

G4RunManager acts as a strict singleton:
- Only one instance can exist in a program
- GetRunManager() returns the singleton instance
- Copy constructor and assignment operator are deleted
- Constructor initializes internal kernel and event manager

### State Management

The application state changes through distinct phases:
- **PreInit**: Before initialization
- **Init**: During initialization
- **Idle**: Ready for event loop (between runs)
- **GeomClosed**: Event loop in progress, geometry locked
- **EventProc**: Processing individual events
- **Quit**: Shutdown

### Thread Safety

- Sequential G4RunManager: Not thread-safe
- For multi-threaded use G4MTRunManager or G4TaskingRunManager instead
- Per-thread singletons exist in multi-threaded mode

### Memory Management

- RunManager owns references to user initialization classes
- User actions are typically managed by action initialization
- Events are stored/deleted based on SetNumberOfEventsToBeStored()
- RunManager destructor cleans up all managed objects

## Comparison with Multi-threaded Alternatives

| Class | Mode | Use Case |
|-------|------|----------|
| G4RunManager | Sequential | Single-threaded simulations |
| G4MTRunManager | Multi-threaded | Parallel on multi-core CPUs |
| G4TaskingRunManager | Multi-threaded/TBB | Using Intel TBB backend |
| G4WorkerRunManager | Worker thread | Internal use only |

## See Also

- [G4VUserDetectorConstruction](./g4vuserdetectorconstruction.md) - Detector geometry definition
- [G4VUserPhysicsList](./g4vuserphysicslist.md) - Physics process definition
- [G4VUserActionInitialization](./g4vuseractioninitialization.md) - User action initialization
- [G4UserRunAction](./g4userrunaction.md) - Per-run customization
- [G4UserEventAction](./g4usereventaction.md) - Per-event customization
- [G4UserStackingAction](./g4userstackingaction.md) - Track stacking control
- [G4UserTrackingAction](./g4usertrackingaction.md) - Per-track customization
- [G4UserSteppingAction](./g4usersteppingaction.md) - Per-step customization
- [G4Run](./g4run.md) - Run information container
- [G4Event](./g4event.md) - Event information container
- [G4RunManagerKernel](./g4runmanagerkernel.md) - Internal run management
- [G4EventManager](./g4eventmanager.md) - Event processing management
