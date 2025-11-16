# G4MTRunManager

**File**: `source/run/include/G4MTRunManager.hh`

## Overview

G4MTRunManager is the multi-threaded variant of G4RunManager for parallel Geant4 simulations on multi-core CPUs. It inherits from G4RunManager and re-implements key methods to orchestrate worker threads, coordinate synchronization, manage random number generation across threads, and merge results from parallel event processing. This class is essential for achieving near-linear speedup in Geant4 simulations on multi-threaded systems.

## Class Description

G4MTRunManager manages multi-threaded simulations through:

- **Master-Worker Architecture**: Master thread controls simulation orchestration; worker threads process events independently
- **Thread Synchronization**: Uses barriers to synchronize between master and workers at critical points
- **Random Number Distribution**: Centrally manages RNG seeds distributed to workers for reproducibility
- **Score Merging**: Collects and merges scoring results from all worker threads
- **Run Merging**: Aggregates G4Run objects from workers into master run
- **UI Command Distribution**: Broadcasts UI commands to worker threads for command-line control

### Key Characteristics

- **Master Thread Only**: Created and invoked in master thread context
- **Worker Thread Management**: Spawns and manages pool of worker threads
- **Synchronization Barriers**: Uses G4MTBarrier for thread coordination
- **RNG Centralization**: Provides seeds to workers; controls reproducibility vs. performance
- **Event Modulo Mode**: Can distribute events in batches with shared seed per batch

## Important Notes

- DO NOT construct G4MTRunManager in worker threads; use in master only
- Users must provide worker initialization classes in multi-threaded mode
- Random number seeding strategy impacts both reproducibility and performance
- In multi-threaded simulations, user action objects are cloned per worker
- Worker results MUST be merged via MergeRun() and MergeScores()
- SetNumberOfThreads() must be called before Initialize()
- Proper thread synchronization is critical for correctness

## Types and Enumerations

### masterWorlds_t Type

```cpp
using masterWorlds_t = std::map<G4int, G4VPhysicalVolume*>;
```

**Location**: G4MTRunManager.hh:63

**Purpose**: Maps defined worlds in master thread for worker thread access.

### WorkerActionRequest Enumeration

```cpp
enum class WorkerActionRequest {
    UNDEFINED,        // Initial state
    NEXTITERATION,    // Execute another set of UI commands
    PROCESSUI,        // Process UI commands without /run/beamOn
    ENDWORKER         // Terminate worker thread
};
```

**Location**: G4MTRunManager.hh:159-165

**Details**:
- **UNDEFINED**: Default state before first iteration
- **NEXTITERATION**: Continue with another run/set of commands
- **PROCESSUI**: Process UI-only commands (no /run/beamOn)
- **ENDWORKER**: Signal worker to terminate thread

## Constructors & Destructor

### Constructor

```cpp
G4MTRunManager();
```

Constructs a multi-threaded run manager for parallel simulations.

**Location**: G4MTRunManager.hh:66

**Details**:
- Initializes to 2 worker threads by default (nworkers = 2)
- Sets up synchronization barriers
- Creates MTRunManagerKernel instead of regular RunManagerKernel
- NOT a singleton; but typically one per multi-threaded simulation

**Preconditions**:
- Called in main thread before SetUserInitialization()
- Should be unique instance in program (acts like singleton)

**Usage Notes**:
```cpp
int main() {
    // Create multi-threaded run manager
    G4MTRunManager* runManager = new G4MTRunManager();

    // Configure thread count early
    runManager->SetNumberOfThreads(4);  // Before Initialize()

    // Register user classes
    runManager->SetUserInitialization(new MyDetectorConstruction());
    runManager->SetUserInitialization(new MyPhysicsList());
    runManager->SetUserInitialization(new MyActionInitialization());

    // Initialize and run
    runManager->Initialize();
    runManager->BeamOn(10000);

    delete runManager;
    return 0;
}
```

### Destructor

```cpp
~G4MTRunManager() override;
```

Destroys multi-threaded run manager and terminates all worker threads.

**Location**: G4MTRunManager.hh:67

**Details**:
- Terminates all active worker threads
- Deletes synchronization barriers
- Cleans up RNG-related data
- Master thread waits for worker threads to finish

## Thread Configuration Methods

### SetNumberOfThreads

```cpp
void SetNumberOfThreads(G4int n) override;
```

Sets the number of worker threads for parallel event processing.

**Parameters**:
- `n`: Number of worker threads (default: 2)

**Location**: G4MTRunManager.hh:69

**Precondition**: MUST be called before Initialize()

**Details**:
- Determines parallelism level
- Default is 2 threads
- Typical values: number of CPU cores available
- Can be overridden by environment variable
- Must call before Initialize() to take effect

**Performance Considerations**:
- Optimal often near number of physical CPU cores
- Hyperthreading may reduce benefit due to shared resources
- I/O contention can reduce scaling efficiency

**Usage Notes**:
```cpp
G4MTRunManager* runManager = new G4MTRunManager();

// Set to 4 threads
runManager->SetNumberOfThreads(4);

// Initialize - uses 4 threads
runManager->Initialize();

// Actual thread count may be limited by hardware
G4int actualThreads = runManager->GetNumberOfThreads();
```

### GetNumberOfThreads

```cpp
G4int GetNumberOfThreads() const override { return nworkers; }
```

Returns the configured number of worker threads.

**Returns**: Number of worker threads

**Location**: G4MTRunManager.hh:70

**Details**: Returns the value set by SetNumberOfThreads().

### SetPinAffinity

```cpp
void SetPinAffinity(G4int n = 1);
```

Sets CPU affinity pinning for worker threads.

**Parameters**:
- `n`: Affinity mode
  - 0: No affinity (default)
  - 1: Pin each worker to specific CPU core
  - 2+: Implementation-dependent

**Location**: G4MTRunManager.hh:71

**Details**:
- Pins worker threads to specific CPU cores for improved cache locality
- Can improve performance on NUMA systems
- Platform-dependent implementation

**Usage Notes**:
```cpp
// Pin workers to CPU cores
runManager->SetPinAffinity(1);

// Check if pinning is enabled
G4int pinMode = runManager->GetPinAffinity();
```

### GetPinAffinity

```cpp
inline G4int GetPinAffinity() const { return pinAffinity; }
```

Returns the CPU affinity setting.

**Returns**: Affinity mode (0=no affinity, 1=pinned, etc.)

**Location**: G4MTRunManager.hh:72

## Multi-threaded Initialization Methods

### Initialize

```cpp
void Initialize() override;
```

Initializes geometry and physics in master thread, then spawns worker threads.

**Location**: G4MTRunManager.hh:75

**Overrides**: G4RunManager::Initialize()

**Sequence**:
1. Initialize geometry in master thread
2. Initialize physics in master thread
3. Create and start worker threads
4. Wait for all workers to be ready

**Preconditions**:
- SetUserInitialization() calls completed
- SetNumberOfThreads() called (or use default)

**Details**:
- Master thread performs full initialization
- Worker threads inherit geometry and physics from master
- Each worker gets its own action instances (cloned)
- Synchronization happens at end via WaitForReadyWorkers()

### InitializeEventLoop

```cpp
void InitializeEventLoop(G4int n_event,
                         const char* macroFile = nullptr,
                         G4int n_select = -1) override;
```

Initializes event loop for multi-threaded processing.

**Parameters**:
- `n_event`: Total number of events to process
- `macroFile`: Optional macro file for event-specific execution
- `n_select`: Selective macro execution

**Location**: G4MTRunManager.hh:76-77

**Overrides**: G4RunManager::InitializeEventLoop()

**Details**:
- Distributes events among worker threads
- Sets up RNG seeds for workers
- Prepares event loop parameters
- Does NOT process events directly (workers do)

### InitializeThreadPool

```cpp
virtual void InitializeThreadPool() {}
```

Hook for derived classes to initialize thread pool implementation.

**Location**: G4MTRunManager.hh:78

**Default**: Empty; provided for advanced customization (e.g., TBB integration).

## Methods That Differ from Sequential Mode

### TerminateOneEvent

```cpp
void TerminateOneEvent() override;
```

**Details**: Does nothing in multi-threaded mode; workers handle event termination.

**Location**: G4MTRunManager.hh:81

### ProcessOneEvent

```cpp
void ProcessOneEvent(G4int i_event) override;
```

**Details**: Does nothing in multi-threaded mode; workers process events.

**Location**: G4MTRunManager.hh:82

### ConstructScoringWorlds

```cpp
void ConstructScoringWorlds() override;
```

**Details**: Does nothing in multi-threaded mode; workers handle scoring.

**Location**: G4MTRunManager.hh:83

### RunTermination

```cpp
void RunTermination() override;
```

**Details**: Does nothing in multi-threaded mode; handled differently.

**Location**: G4MTRunManager.hh:84

## Event Setup Methods (Worker Communication)

### SetUpAnEvent

```cpp
virtual G4bool SetUpAnEvent(G4Event*, G4long& s1, G4long& s2,
                           G4long& s3, G4bool reseedRequired = true);
```

Sets up individual event with RNG seeds; called by worker for each event.

**Parameters**:
- `G4Event*`: Event object created by worker (must be pre-allocated)
- `s1, s2, s3`: RNG seed values (output parameters)
- `reseedRequired`: If true, reseed for each event (default); if false, use worker's own RNG

**Returns**:
- `true` if event was set up successfully (more events to process)
- `false` if no more events (worker should delete event and stop)

**Location**: G4MTRunManager.hh:93-94

**Thread Context**: Called in worker thread

**Seed Management**:
- If reseedRequired=true: Master provides seeds for reproducibility
- If reseedRequired=false: Worker uses its own RNG sequence
- First event MUST use reseedRequired=true

**Usage Notes**:
```cpp
// In worker thread event loop
G4Event* evt = new G4Event();
G4long seed1, seed2, seed3;

// Set up event with seeds from master
if (!runManager->SetUpAnEvent(evt, seed1, seed2, seed3)) {
    delete evt;  // No more events
    break;
}

// Process event with provided seeds
ProcessEvent(evt);

// ... repeat ...
```

### SetUpNEvents

```cpp
virtual G4int SetUpNEvents(G4Event*, G4SeedsQueue* seedsQueue,
                          G4bool reseedRequired = true);
```

Sets up batch of events with single RNG seed per batch (event modulo mode).

**Parameters**:
- `G4Event*`: Event object for first event in batch
- `seedsQueue*`: Queue of seed pairs for all events in batch
- `reseedRequired`: Whether reseeding is required

**Returns**: Number of events in this batch (1 to eventModulo)

**Location**: G4MTRunManager.hh:103

**Thread Context**: Called in worker thread

**Details**:
- More efficient than SetUpAnEvent() for small events
- All events in batch share same RNG seed
- Batch size determined by eventModulo
- Returns 0 if no more events to process

**Event Modulo Modes**:
- eventModulo=1: Single seed per event (default, fully reproducible)
- eventModulo=N: Single seed per N events (faster, less reproducible)

**Usage Notes**:
```cpp
// Set event modulo for batch processing
runManager->SetEventModulo(100);  // Batch 100 events per seed

G4int eventsInBatch = runManager->SetUpNEvents(evt, seedsQueue);
for (int i = 0; i < eventsInBatch; i++) {
    // Process event i in batch with shared seed
    ProcessEvent(evt);
    evt = new G4Event();  // Create next event in batch
}
```

## UI Command Management

### GetCommandStack

```cpp
std::vector<G4String> GetCommandStack();
```

Retrieves UI commands that worker threads will execute.

**Returns**: Vector of UI command strings collected from UI manager

**Location**: G4MTRunManager.hh:108

**Details**:
- Called before spawning workers
- Collects commands from UI manager
- Commands are broadcast to worker threads
- Allows interactive control in multi-threaded mode

**Usage Context**: Internal; called by Initialize().

### PrepareCommandsStack

```cpp
virtual void PrepareCommandsStack();
```

Prepares the commands stack for worker thread execution.

**Location**: G4MTRunManager.hh:197

**Precondition**: Called before worker threads start

**Details**: Protected method for internal use and potential overrides.

### RequestWorkersProcessCommandsStack

```cpp
virtual void RequestWorkersProcessCommandsStack();
```

Forces all workers to process pending UI commands.

**Location**: G4MTRunManager.hh:169

**Details**:
- Blocks until all workers have processed commands
- Allows interactive command execution during simulation
- Requires all workers to reach synchronization point

**Usage Notes**:
```cpp
// Broadcast commands to workers
runManager->RequestWorkersProcessCommandsStack();
// Blocks until all workers acknowledge
```

### ThisWorkerProcessCommandsStackDone

```cpp
virtual void ThisWorkerProcessCommandsStackDone();
```

Called by worker to signal UI command processing complete.

**Location**: G4MTRunManager.hh:173

**Thread Context**: Called in worker thread only

**Details**: Synchronization point; worker thread blocks until all workers report done.

## Worker Thread Synchronization Methods

### ThisWorkerReady

```cpp
virtual void ThisWorkerReady();
```

Called by worker thread when ready to start event processing.

**Location**: G4MTRunManager.hh:121

**Thread Context**: Worker thread context

**Details**:
- Barrier synchronization point
- Worker blocks until all workers are ready
- Master waits via WaitForReadyWorkers()
- Ensures synchronized start of event loop

**Usage Notes**:
```cpp
// In worker thread main function
runManager->ThisWorkerReady();  // Wait for all workers
// All workers start event processing simultaneously
```

### ThisWorkerEndEventLoop

```cpp
virtual void ThisWorkerEndEventLoop();
```

Called by worker when event loop processing completes.

**Location**: G4MTRunManager.hh:125

**Thread Context**: Worker thread context

**Details**:
- Barrier synchronization point
- Worker reports completion and blocks
- Master resumes via WaitForEndEventLoopWorkers()

### WaitForReadyWorkers

```cpp
virtual void WaitForReadyWorkers();
```

Master blocks waiting for all workers to report ready.

**Location**: G4MTRunManager.hh:208

**Thread Context**: Master thread only

**Details**:
- Blocks until all workers call ThisWorkerReady()
- Ensures synchronized initialization
- Called from Initialize()

**Access**: Protected; called internally by framework.

### WaitForEndEventLoopWorkers

```cpp
virtual void WaitForEndEventLoopWorkers();
```

Master blocks waiting for all workers to complete event loop.

**Location**: G4MTRunManager.hh:214

**Thread Context**: Master thread only

**Details**:
- Blocks until all workers call ThisWorkerEndEventLoop()
- Returns after all workers finish
- Allows master to merge results and continue

**Access**: Protected; called internally by framework.

## Worker Action Synchronization

### ThisWorkerWaitForNextAction

```cpp
virtual WorkerActionRequest ThisWorkerWaitForNextAction();
```

Worker blocks waiting for next action request from master.

**Returns**: Action request (NEXTITERATION, PROCESSUI, or ENDWORKER)

**Location**: G4MTRunManager.hh:179

**Thread Context**: Worker thread only

**Details**:
- Barrier synchronization for multi-run scenarios
- Handles multiple BeamOn() calls and UI commands
- Returns action enum indicating what to do next

**Usage Notes**:
```cpp
// In worker thread main loop
while (true) {
    WorkerActionRequest action = runManager->ThisWorkerWaitForNextAction();

    switch (action) {
        case WorkerActionRequest::NEXTITERATION:
            // Execute another run
            ExecuteBeamOn();
            break;
        case WorkerActionRequest::PROCESSUI:
            // Process UI commands only
            ProcessUICommands();
            break;
        case WorkerActionRequest::ENDWORKER:
            // Exit worker thread
            return;
    }
}
```

### NewActionRequest

```cpp
virtual void NewActionRequest(WorkerActionRequest newRequest);
```

Master sets new action request for workers.

**Parameters**:
- `newRequest`: Action to be performed (NEXTITERATION, PROCESSUI, ENDWORKER)

**Location**: G4MTRunManager.hh:219

**Thread Context**: Master thread only

**Access**: Protected; called internally.

## Random Number Management

### Event-Based Seeding

**Location**: Controlled by static variable seedOncePerCommunication

**Seeding Strategies**:
- **seedOncePerCommunication = 0**: Seeds set for every event (reproducible, slower)
- **seedOncePerCommunication = 1**: Seeds set once per run per worker (less reproducible, faster)
- **seedOncePerCommunication = 2**: Seeds set once per event batch (reserved for future use)

### GetMasterRandomEngine

```cpp
inline const CLHEP::HepRandomEngine* getMasterRandomEngine() const
{ return masterRNGEngine; }
```

Returns master thread's RNG engine.

**Returns**: Pointer to CLHEP::HepRandomEngine in master thread

**Location**: G4MTRunManager.hh:131

**Details**: Master RNG used to generate seeds distributed to workers.

### InitializeSeeds

```cpp
virtual G4bool InitializeSeeds(G4int /*nevts*/) { return false; }
```

Hook for derived classes to initialize seed generation.

**Parameters**:
- `nevts`: Number of events to be processed

**Returns**: true if initialization done; false to use default

**Location**: G4MTRunManager.hh:195

**Details**: For custom seed generation strategy.

### RefillSeeds

```cpp
virtual void RefillSeeds();
```

Refills seed queue when depleted.

**Location**: G4MTRunManager.hh:221

**Details**: Protected method for internal RNG seed management.

**Access**: Protected; called internally.

### SetSeedOncePerCommunication

```cpp
static void SetSeedOncePerCommunication(G4int val);
```

Sets global RNG seeding strategy.

**Parameters**:
- `val`:
  - 0: Seed per event (default, reproducible)
  - 1: Seed per run per worker (faster)
  - 2: Seed per batch (reserved)

**Location**: G4MTRunManager.hh:188

**Details**: Affects all future multi-threaded runs.

### SeedOncePerCommunication

```cpp
static G4int SeedOncePerCommunication();
```

Returns current seeding strategy.

**Returns**: Current seedOncePerCommunication value

**Location**: G4MTRunManager.hh:187

## Result Merging Methods

### MergeRun

```cpp
virtual void MergeRun(const G4Run* localRun);
```

Merges worker thread's run results into master run.

**Parameters**:
- `localRun`: G4Run object from completed worker thread

**Location**: G4MTRunManager.hh:156

**Thread Context**: Master thread

**Details**:
- Called after worker completes event loop
- Worker's run must have properly implemented Merge() method
- Master's G4Run::Merge() is invoked

**Important**: If G4Run custom Merge() not implemented, worker results are lost.

**Usage Notes**:
```cpp
// G4MTRunManager automatically calls this
// But user's MyRun must override Merge():

class MyRun : public G4Run {
  public:
    virtual void Merge(const G4Run* localRun) {
        const MyRun* local = static_cast<const MyRun*>(localRun);
        // Merge data from local run into this (master) run
        totalScore += local->totalScore;
        numberOfEvent += local->numberOfEvent;
    }
};
```

### MergeScores

```cpp
virtual void MergeScores(const G4ScoringManager* localScoringManager);
```

Merges worker thread's scoring results into master.

**Parameters**:
- `localScoringManager`: Worker's G4ScoringManager with accumulated scores

**Location**: G4MTRunManager.hh:155

**Thread Context**: Master thread

**Details**:
- Collects scoring mesh results from worker
- Combines scores from all workers
- Master scoring world accumulates all results

**Usage Notes**:
```cpp
// Typically handled automatically by framework
// Custom implementation needed if specialized scoring merge required
```

## Singleton and Static Methods

### GetMasterRunManager

```cpp
static G4MTRunManager* GetMasterRunManager();
```

Returns singleton pointer to master G4MTRunManager.

**Returns**: Master G4MTRunManager instance (nullptr if not created)

**Location**: G4MTRunManager.hh:135

**Details**: Access point for workers to communicate with master.

### GetMasterRunManagerKernel

```cpp
static G4RunManagerKernel* GetMasterRunManagerKernel();
```

Returns kernel from master thread.

**Returns**: G4RunManagerKernel shared by all threads

**Location**: G4MTRunManager.hh:139

**Details**: Provides access to shared geometry and physics tables.

### GetMTMasterRunManagerKernel

```cpp
static G4MTRunManagerKernel* GetMTMasterRunManagerKernel();
```

Returns multi-threaded variant of master kernel.

**Returns**: G4MTRunManagerKernel

**Location**: G4MTRunManager.hh:140

**Details**: MT-specific kernel with thread coordination support.

### GetMasterThreadId

```cpp
static G4ThreadId GetMasterThreadId();
```

Returns thread ID of master thread.

**Returns**: G4ThreadId of master thread

**Location**: G4MTRunManager.hh:116

**Details**: Used by workers to identify master thread.

### GetMasterScoringManager

```cpp
static G4ScoringManager* GetMasterScoringManager();
```

Returns master thread's scoring manager.

**Returns**: G4ScoringManager used in master thread

**Location**: G4MTRunManager.hh:127

**Details**: Workers access master scoring world definitions.

### GetMasterWorlds

```cpp
static masterWorlds_t& GetMasterWorlds();
```

Returns map of worlds defined in master.

**Returns**: Reference to std::map<G4int, G4VPhysicalVolume*>

**Location**: G4MTRunManager.hh:128

**Details**: Workers inherit geometry from master worlds.

### addWorld

```cpp
static void addWorld(G4int counter, G4VPhysicalVolume* w);
```

Adds world to master's world map.

**Parameters**:
- `counter`: World index
- `w`: Physical volume pointer

**Location**: G4MTRunManager.hh:129

**Details**: Called during master initialization for each world.

## User Initialization Methods

All SetUserInitialization() methods override G4RunManager variants:

### SetUserInitialization (G4VUserPhysicsList)

```cpp
void SetUserInitialization(G4VUserPhysicsList* userPL) override;
```

Registers physics list (master only).

**Location**: G4MTRunManager.hh:142

### SetUserInitialization (G4VUserDetectorConstruction)

```cpp
void SetUserInitialization(G4VUserDetectorConstruction* userDC) override;
```

Registers detector construction (master only).

**Location**: G4MTRunManager.hh:143

### SetUserInitialization (G4UserWorkerInitialization)

```cpp
void SetUserInitialization(G4UserWorkerInitialization* userInit) override;
```

Registers worker initialization class for per-thread setup.

**Parameters**:
- `userInit`: Custom G4UserWorkerInitialization

**Location**: G4MTRunManager.hh:144

**Details**:
- Called once per worker thread during worker initialization
- Allows thread-specific setup (e.g., output file per thread)

### SetUserInitialization (G4UserWorkerThreadInitialization)

```cpp
void SetUserInitialization(G4UserWorkerThreadInitialization* userInit) override;
```

Registers advanced worker thread initialization.

**Location**: G4MTRunManager.hh:145

### SetUserInitialization (G4VUserActionInitialization)

```cpp
void SetUserInitialization(G4VUserActionInitialization* userInit) override;
```

Registers action initialization (used by all threads).

**Location**: G4MTRunManager.hh:146

**Details**: Actions are instantiated per-thread; each worker gets its own copies.

## User Action Methods

All SetUserAction() methods override G4RunManager variants:

```cpp
void SetUserAction(G4UserRunAction* userAction) override;
void SetUserAction(G4VUserPrimaryGeneratorAction* userAction) override;
void SetUserAction(G4UserEventAction* userAction) override;
void SetUserAction(G4UserStackingAction* userAction) override;
void SetUserAction(G4UserTrackingAction* userAction) override;
void SetUserAction(G4UserSteppingAction* userAction) override;
```

**Location**: G4MTRunManager.hh:147-152

**Details**:
- Actions registered here are cloned per worker thread
- Each worker gets independent action instances
- Master maintains its own action instances

## Event Processing Control

### AbortRun

```cpp
void AbortRun(G4bool softAbort = false) override;
```

Aborts the current run in multi-threaded context.

**Parameters**:
- `softAbort`:
  - false: Abort immediately
  - true: Finish current event batch then abort

**Location**: G4MTRunManager.hh:184

**Details**: Signals all workers to stop processing events.

### AbortEvent

```cpp
void AbortEvent() override;
```

Aborts current event in all workers.

**Location**: G4MTRunManager.hh:185

**Details**: May not abort specific event; affects all workers.

## Event Modulo Control

### SetEventModulo

```cpp
inline void SetEventModulo(G4int i = 1) { eventModuloDef = i; }
```

Sets event batch size for seed reuse.

**Parameters**:
- `i`: Events per seed (default 1=seed per event)

**Location**: G4MTRunManager.hh:181

**Details**:
- i=1: Seed per event (reproducible, slower)
- i=N: Seed per N events (faster, less reproducible)

### GetEventModulo

```cpp
inline G4int GetEventModulo() const { return eventModuloDef; }
```

Returns current event modulo setting.

**Returns**: Events per seed

**Location**: G4MTRunManager.hh:182

## Random Number Storage Methods

### StoreRNGStatus

```cpp
void StoreRNGStatus(const G4String& filenamePrefix) override;
```

Saves RNG status from master thread.

**Parameters**:
- `filenamePrefix`: File name prefix for status files

**Location**: G4MTRunManager.hh:198

### rndmSaveThisRun

```cpp
void rndmSaveThisRun() override;
```

Saves RNG status at run start.

**Location**: G4MTRunManager.hh:199

### rndmSaveThisEvent

```cpp
void rndmSaveThisEvent() override;
```

Saves RNG status at event start.

**Location**: G4MTRunManager.hh:200

## Worker Thread Management

### CreateAndStartWorkers

```cpp
virtual void CreateAndStartWorkers();
```

Creates worker thread objects and spawns threads.

**Location**: G4MTRunManager.hh:203

**Thread Context**: Master thread only

**Details**: Protected method; called internally by Initialize().

### TerminateWorkers

```cpp
virtual void TerminateWorkers();
```

Signals workers to terminate and waits for completion.

**Location**: G4MTRunManager.hh:217

**Thread Context**: Master thread only

**Details**: Protected method; cleans up worker threads.

## Protected Member Variables

```cpp
protected:
    G4int nworkers = 2;                    // Number of worker threads
    G4int forcedNwokers = -1;              // Override nworkers if >= 0
    G4int numberOfEventToBeProcessed = 0;  // Total events for run

    // Static master data shared across threads
    static G4ScoringManager* masterScM;    // Master scoring manager
    static G4MTRunManager* fMasterRM;      // Master run manager singleton

    // Worker action request
    WorkerActionRequest nextActionRequest = WorkerActionRequest::UNDEFINED;

    // Event batching
    G4int eventModuloDef = 0;              // User-configured modulo
    G4int eventModulo = 1;                 // Actual modulo for current run

    // Seed management
    G4int nSeedsUsed = 0;                  // Seeds consumed
    G4int nSeedsFilled = 0;                // Seeds generated
    G4int nSeedsMax = 10000;               // Max seeds buffered
    G4int nSeedsPerEvent = 2;              // Seeds needed per event
    G4double* randDbl = nullptr;           // Double seed buffer

    // RNG configuration
    static G4ThreadId masterThreadId;      // Master thread ID
    static G4int seedOncePerCommunication; // Seeding strategy

    // Synchronization barriers
    G4MTBarrier beginOfEventLoopBarrier;   // Start of loop sync
    G4MTBarrier endOfEventLoopBarrier;     // End of loop sync
    G4MTBarrier nextActionRequestBarrier;  // Action request sync
    G4MTBarrier processUIBarrier;          // UI command sync

    // Thread management
    using G4ThreadsList = std::list<G4Thread*>;
    G4int pinAffinity = 0;                 // CPU affinity mode
    G4ThreadsList threads;                 // Worker thread list
    std::vector<G4String> uiCmdsForWorkers; // Broadcast UI commands

    // RNG
    CLHEP::HepRandomEngine* masterRNGEngine = nullptr;  // Master RNG
    G4MTRunManagerKernel* MTkernel = nullptr;  // MT kernel
```

**Location**: G4MTRunManager.hh:223-289

**Details**: Protected members for internal implementation and potential overrides.

## Usage Pattern: Complete Multi-threaded Simulation

```cpp
#include "G4MTRunManager.hh"
#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"
#include "MyActionInitialization.hh"

int main(int argc, char** argv) {
    // Create multi-threaded run manager
    G4MTRunManager* runManager = new G4MTRunManager();

    // Configure threading BEFORE initialization
    G4int nThreads = 4;
    if (argc > 1) nThreads = std::atoi(argv[1]);
    runManager->SetNumberOfThreads(nThreads);

    // Optional: Pin threads to CPU cores
    // runManager->SetPinAffinity(1);

    // Register mandatory user initialization
    runManager->SetUserInitialization(new MyDetectorConstruction());
    runManager->SetUserInitialization(new MyPhysicsList());

    // Register worker initialization
    runManager->SetUserInitialization(new MyWorkerInitialization());

    // Register all user actions
    runManager->SetUserInitialization(new MyActionInitialization());

    // Initialize (creates worker threads)
    runManager->Initialize();

    // Configure seeding strategy
    // 0 = seed per event (reproducible)
    // 1 = seed per run (faster)
    G4MTRunManager::SetSeedOncePerCommunication(0);

    // Run simulation
    G4int nofEvents = 10000;
    runManager->BeamOn(nofEvents);

    // Clean up
    delete runManager;

    return 0;
}
```

## Thread Safety Notes

### Master Thread Only
- G4MTRunManager construction
- SetNumberOfThreads()
- Initialize()
- BeamOn()
- GetMasterRunManager()
- All "Master" static accessors

### Worker Thread Context
- SetUpAnEvent() / SetUpNEvents()
- ThisWorkerReady()
- ThisWorkerEndEventLoop()
- ThisWorkerWaitForNextAction()
- ThisWorkerProcessCommandsStackDone()
- Event processing
- Action callbacks

### Both Threads
- GetNumberOfThreads()
- GetNumberActiveThreads()
- Static accessor methods (from static/shared context)

## Master vs. Worker Differences

| Aspect | Master | Worker |
|--------|--------|--------|
| Geometry | Full initialization | Inherited from master |
| Physics | Full initialization | Inherited from master |
| Actions | One set | Independent clones |
| Events | Does NOT process | Processes events |
| Scoring | Master scoring only | Contributes to master |
| RNG Seeds | Generates seeds | Receives seeds |
| Synchronization | Waits on barriers | Signals barriers |
| Run Object | Merges worker runs | Accumulates results |

## Performance Considerations

### Thread Count Selection
- Optimal often equal to CPU core count
- Avoid oversubscription (more threads than cores)
- May be less than cores on NUMA systems

### Random Number Seeding
- seedOncePerCommunication=0: Full reproducibility, slower
- seedOncePerCommunication=1: Faster, non-reproducible with thread count change

### Event Batching
- SetEventModulo(N): Process N events per seed
- Trades reproducibility for performance
- Useful for fast simulations with small events

### I/O Bottlenecks
- One file per worker thread recommended
- Avoid all threads writing to single file
- Consider buffering and batch output

## Related Classes

- **G4RunManager** - Sequential run manager (base class)
- **G4MTRunManagerKernel** - Multi-threaded kernel
- **G4WorkerRunManager** - Worker thread run manager
- **G4UserWorkerInitialization** - Worker setup
- **G4UserWorkerThreadInitialization** - Advanced worker setup
- **G4Run** - Run container (must implement Merge())
- **G4MTBarrier** - Thread synchronization
- **G4RNGHelper** - RNG seed distribution

## See Also

- [G4RunManager](./g4runmanager.md) - Sequential variant
- [G4Run](./g4run.md) - Run data container (requires proper Merge())
- [G4UserWorkerInitialization](./g4userworkerinitialization.md) - Worker setup
- [G4UserWorkerThreadInitialization](./g4userworkerthreadinitialization.md) - Advanced worker initialization
- [G4VUserActionInitialization](./g4vuseractioninitialization.md) - Action setup
- [G4EventManager](./g4eventmanager.md) - Event processing
- [G4WorkerRunManager](./g4workerrunmanager.md) - Worker thread manager
