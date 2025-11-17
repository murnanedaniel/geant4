# G4VProcess

**File**: `source/processes/management/include/G4VProcess.hh`

## Overview

G4VProcess is the abstract base class for all physics processes in Geant4. It defines the fundamental interface that all physics processes must implement, including the DoIt/GPIL execution model that determines when and how processes interact with particles during tracking. Every physics process in Geant4 (electromagnetic, hadronic, optical, transportation, etc.) inherits from this class.

## Class Description

G4VProcess provides the virtual interface for physics process objects that describe particle behavior during simulation. The class implements a sophisticated execution model based on:

- **DoIt Methods**: Perform the actual physics interactions (PostStepDoIt, AlongStepDoIt, AtRestDoIt)
- **GPIL Methods**: Calculate physical interaction lengths to determine when processes should act
- **Process Management**: Integration with G4ProcessManager and particle definitions
- **Thread Safety**: Support for multi-threaded execution with master/worker process instances

The class supports three fundamental types of process actions:
- **AtRest**: For processes acting on stopped particles (e.g., decay, annihilation)
- **AlongStep**: For continuous processes during the step (e.g., energy loss, multiple scattering)
- **PostStep**: For discrete processes at the end of a step (e.g., scattering, decay in flight)

**Location**: `source/processes/management/include/G4VProcess.hh:60`

## Related Enumerations

### G4ProcessType

```cpp
enum G4ProcessType {
  fNotDefined,
  fTransportation,
  fElectromagnetic,
  fOptical,
  fHadronic,
  fPhotolepton_hadron,
  fDecay,
  fGeneral,
  fParameterisation,
  fUserDefined,
  fParallel,
  fPhonon,
  fUCN
};
```

Defines the category of the physics process.

**File**: `source/processes/management/include/G4ProcessType.hh`

### G4ForceCondition

```cpp
enum G4ForceCondition {
  Forced,
  NotForced,
  Conditionally,
  ExclusivelyForced,
  StronglyForced,
  InActivated
};
```

Indicates whether a process DoIt method is forced to be called.

**File**: `source/processes/management/include/G4ForceCondition.hh`

### G4GPILSelection

```cpp
enum G4GPILSelection {
  NotCandidateForSelection,
  CandidateForSelection
};
```

Used by AlongStepGPIL to indicate if the process is a candidate for determining the step length.

**File**: `source/processes/management/include/G4GPILSelection.hh`

## Constructors & Destructor

### Constructor

```cpp
G4VProcess(const G4String& aName = "NoName",
           G4ProcessType aType = fNotDefined);
```

Creates a new process with the specified name and type.

**Parameters**:
- `aName`: Process name (default: "NoName")
- `aType`: Process type from G4ProcessType enumeration (default: fNotDefined)

**Location**: `source/processes/management/include/G4VProcess.hh:65-66`

**Usage**: This constructor must be called by all derived classes to properly initialize the base process.

### Copy Constructor

```cpp
G4VProcess(const G4VProcess& right);
```

Copies the process name but does not copy physics tables.

**Parameters**:
- `right`: Reference to the process to copy

**Location**: `source/processes/management/include/G4VProcess.hh:69-71`

**Note**: Physics table pointers are set to nullptr in the copy. This is intentional as physics tables should be rebuilt for the copied process.

### Destructor

```cpp
virtual ~G4VProcess();
```

Virtual destructor for proper cleanup of derived classes.

**Location**: `source/processes/management/include/G4VProcess.hh:73-74`

### Deleted Operations

```cpp
G4VProcess& operator=(const G4VProcess&) = delete;
```

Assignment operator is explicitly deleted.

**Location**: `source/processes/management/include/G4VProcess.hh:76`

## Operators

### Equality Operators

```cpp
G4bool operator==(const G4VProcess& right) const;
G4bool operator!=(const G4VProcess& right) const;
```

Compare two processes for equality based on their properties.

**Parameters**:
- `right`: Reference to process to compare

**Returns**: True if processes are equal/not equal

**Location**: `source/processes/management/include/G4VProcess.hh:78-79`

## DoIt Methods (Pure Virtual)

The DoIt methods perform the actual physics interactions. These are pure virtual and **must** be implemented by all derived classes.

### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(
                         const G4Track& track,
                         const G4Step& stepData) = 0;
```

Performs discrete process interactions at the end of a step.

**Parameters**:
- `track`: Reference to current G4Track information (particle state)
- `stepData`: Reference to current G4Step information (step details)

**Returns**: Pointer to G4VParticleChange describing momentum change, secondaries, etc.

**Location**: `source/processes/management/include/G4VProcess.hh:86-89`

**Usage**: Called when this process determines the step length or is forced. Examples: Compton scattering, bremsstrahlung, hadronic interactions.

### AlongStepDoIt

```cpp
virtual G4VParticleChange* AlongStepDoIt(
                         const G4Track& track,
                         const G4Step& stepData) = 0;
```

Performs continuous process interactions during the step.

**Parameters**:
- `track`: Reference to current G4Track information
- `stepData`: Reference to current G4Step information

**Returns**: Pointer to G4VParticleChange describing continuous changes

**Location**: `source/processes/management/include/G4VProcess.hh:91-94`

**Usage**: Always called for every step (if enabled). Examples: ionization energy loss, multiple scattering.

**Important**: AlongStepDoIt is called for every step regardless of which process determined the step length.

### AtRestDoIt

```cpp
virtual G4VParticleChange* AtRestDoIt(
                         const G4Track& track,
                         const G4Step& stepData) = 0;
```

Performs process interactions for particles at rest.

**Parameters**:
- `track`: Reference to current G4Track information
- `stepData`: Reference to current G4Step information

**Returns**: Pointer to G4VParticleChange describing interaction results

**Location**: `source/processes/management/include/G4VProcess.hh:95-98`

**Usage**: Called when a particle stops and this process has the shortest interaction time. Examples: decay at rest, annihilation.

## GPIL Methods (Pure Virtual)

GPIL (GetPhysicalInteractionLength) methods calculate the distance or time until the process should act. These determine the step length.

### PostStepGetPhysicalInteractionLength

```cpp
virtual G4double PostStepGetPhysicalInteractionLength(
                         const G4Track& track,
                         G4double previousStepSize,
                         G4ForceCondition* condition) = 0;
```

Returns the step size (distance) allowed by this discrete process.

**Parameters**:
- `track`: Reference to current G4Track information
- `previousStepSize`: Actual length of previous step (negative value indicates NumberOfInteractionLengthLeft must be reset)
- `condition`: Output parameter indicating if DoIt is forced (Forced/NotForced)

**Returns**: Physical interaction length (distance) for this process

**Location**: `source/processes/management/include/G4VProcess.hh:124-127`

**Usage**: Called by stepping manager to determine when discrete processes should act. The process with the shortest returned length determines the step.

**Algorithm**:
1. If previousStepSize < 0, call ResetNumberOfInteractionLengthLeft()
2. Otherwise, call SubtractNumberOfInteractionLengthLeft(previousStepSize)
3. Calculate and return the physical step length based on remaining interaction length

### AlongStepGetPhysicalInteractionLength

```cpp
virtual G4double AlongStepGetPhysicalInteractionLength(
                         const G4Track& track,
                         G4double previousStepSize,
                         G4double currentMinimumStep,
                         G4double& proposedSafety,
                         G4GPILSelection* selection) = 0;
```

Returns the step size allowed by this continuous process.

**Parameters**:
- `track`: Reference to current G4Track information
- `previousStepSize`: Actual length of previous step
- `currentMinimumStep`: Current minimum step from other processes (for true→geometric path length conversion)
- `proposedSafety`: Output parameter for proposed safety distance
- `selection`: Output parameter indicating if process is candidate for selection

**Returns**: Physical interaction length for continuous process

**Location**: `source/processes/management/include/G4VProcess.hh:113-118`

**Usage**: Called for continuous processes to limit step size based on continuous physics constraints.

### AtRestGetPhysicalInteractionLength

```cpp
virtual G4double AtRestGetPhysicalInteractionLength(
                         const G4Track& track,
                         G4ForceCondition* condition) = 0;
```

Returns the time (not distance) until the at-rest process should act.

**Parameters**:
- `track`: Reference to current G4Track information
- `condition`: Output parameter indicating if DoIt is forced

**Returns**: Time until interaction (in Geant4 time units)

**Location**: `source/processes/management/include/G4VProcess.hh:120-122`

**Usage**: Called for particles at rest. The process with shortest time determines when the particle interacts.

## GPIL Wrapper Methods

These inline methods wrap the virtual GPIL methods and apply the PIL factor. They are called by G4SteppingManager.

### AlongStepGPIL

```cpp
inline G4double AlongStepGPIL(const G4Track& track,
                              G4double previousStepSize,
                              G4double currentMinimumStep,
                              G4double& proposedSafety,
                              G4GPILSelection* selection);
```

Wrapper that calls AlongStepGetPhysicalInteractionLength.

**Location**: `source/processes/management/include/G4VProcess.hh:169-173, 465-473`

**Note**: Does not apply thePILfactor for along-step processes.

### PostStepGPIL

```cpp
inline G4double PostStepGPIL(const G4Track& track,
                             G4double previousStepSize,
                             G4ForceCondition* condition);
```

Wrapper that multiplies the result by thePILfactor.

**Location**: `source/processes/management/include/G4VProcess.hh:178-180, 483-489`

**Returns**: `thePILfactor * PostStepGetPhysicalInteractionLength(...)`

### AtRestGPIL

```cpp
inline G4double AtRestGPIL(const G4Track& track,
                           G4ForceCondition* condition);
```

Wrapper that multiplies the result by thePILfactor.

**Location**: `source/processes/management/include/G4VProcess.hh:175-176, 476-480`

**Returns**: `thePILfactor * AtRestGetPhysicalInteractionLength(...)`

## Interaction Length Management

### GetCurrentInteractionLength

```cpp
inline G4double GetCurrentInteractionLength() const;
```

Returns the current interaction length in the current material.

**Returns**: Current interaction length

**Location**: `source/processes/management/include/G4VProcess.hh:154, 447-450`

### GetNumberOfInteractionLengthLeft

```cpp
inline G4double GetNumberOfInteractionLengthLeft() const;
```

Returns the number of interaction lengths remaining for the current track.

**Returns**: Number of interaction lengths left

**Location**: `source/processes/management/include/G4VProcess.hh:260, 435-438`

**Usage**: Used internally by GPIL methods to track how far the particle can travel before interaction.

### GetTotalNumberOfInteractionLengthTraversed

```cpp
inline G4double GetTotalNumberOfInteractionLengthTraversed() const;
```

Returns the number of interaction lengths traversed since last reset.

**Returns**: `theInitialNumberOfInteractionLength - theNumberOfInteractionLengthLeft`

**Location**: `source/processes/management/include/G4VProcess.hh:263-265, 441-444`

### ResetNumberOfInteractionLengthLeft

```cpp
virtual void ResetNumberOfInteractionLengthLeft();
```

Resets and determines a new value for NumberOfInteractionLengthLeft.

**Location**: `source/processes/management/include/G4VProcess.hh:257`

**Usage**: Typically samples a random number to determine when the next interaction occurs. Called at the beginning of tracking or when previousStepSize < 0.

### SetPILfactor

```cpp
inline void SetPILfactor(G4double value);
```

Sets the physics interaction length multiplication factor.

**Parameters**:
- `value`: PIL factor (must be > 0)

**Location**: `source/processes/management/include/G4VProcess.hh:159, 453-456`

**Usage**: Can be used to artificially increase or decrease interaction probability. Default is 1.0.

### GetPILfactor

```cpp
inline G4double GetPILfactor() const;
```

Returns the current PIL factor.

**Returns**: PIL multiplication factor

**Location**: `source/processes/management/include/G4VProcess.hh:160, 459-462`

## Process Properties

### GetProcessName

```cpp
inline const G4String& GetProcessName() const;
```

Returns the name of the process.

**Returns**: Reference to process name string

**Location**: `source/processes/management/include/G4VProcess.hh:225, 386-389`

### GetProcessType

```cpp
inline G4ProcessType GetProcessType() const;
```

Returns the process type.

**Returns**: Process type from G4ProcessType enumeration

**Location**: `source/processes/management/include/G4VProcess.hh:228, 392-395`

### SetProcessType

```cpp
inline void SetProcessType(G4ProcessType aType);
```

Sets the process type.

**Parameters**:
- `aType`: Process type from G4ProcessType enumeration

**Location**: `source/processes/management/include/G4VProcess.hh:231, 398-401`

### GetProcessSubType

```cpp
inline G4int GetProcessSubType() const;
```

Returns the process sub-type identifier.

**Returns**: Integer sub-type identifier

**Location**: `source/processes/management/include/G4VProcess.hh:234, 404-407`

**Usage**: Sub-types provide finer categorization within each process type (e.g., specific electromagnetic process types).

### SetProcessSubType

```cpp
inline void SetProcessSubType(G4int value);
```

Sets the process sub-type identifier.

**Parameters**:
- `value`: Integer sub-type identifier

**Location**: `source/processes/management/include/G4VProcess.hh:237, 410-413`

### GetProcessTypeName

```cpp
static const G4String& GetProcessTypeName(G4ProcessType aType);
```

Returns the name corresponding to a process type.

**Parameters**:
- `aType`: Process type

**Returns**: String name of the process type

**Location**: `source/processes/management/include/G4VProcess.hh:240`

**Usage**: Static utility method for converting process type enum to readable string.

## Process Applicability

### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition&);
```

Determines if this process applies to a given particle type.

**Parameters**:
- Particle definition to check

**Returns**: True if process applies to this particle type

**Location**: `source/processes/management/include/G4VProcess.hh:182-185`

**Default**: Returns true (applies to all particles)

**Usage**: Override to restrict process to specific particle types. Process will not be registered to particles for which this returns false.

## Physics Table Management

### BuildPhysicsTable

```cpp
virtual void BuildPhysicsTable(const G4ParticleDefinition&);
```

Builds physics tables (cross-sections, energy loss tables, etc.) for a particle.

**Parameters**:
- Particle definition for which to build tables

**Location**: `source/processes/management/include/G4VProcess.hh:187-193`

**Usage**: Called by G4ProcessManager when materials are defined or changed. Override to build process-specific physics tables.

### PreparePhysicsTable

```cpp
virtual void PreparePhysicsTable(const G4ParticleDefinition&);
```

Prepares for physics table building (called before BuildPhysicsTable).

**Parameters**:
- Particle definition

**Location**: `source/processes/management/include/G4VProcess.hh:194-199`

**Usage**: Use for initialization steps needed before table building.

### StorePhysicsTable

```cpp
virtual G4bool StorePhysicsTable(const G4ParticleDefinition*,
                                 const G4String& directory,
                                 G4bool ascii);
```

Stores physics tables to files.

**Parameters**:
- Particle definition pointer
- `directory`: Directory path for storing tables
- `ascii`: True for ASCII format, false for binary

**Returns**: False on I/O failure, true on success

**Location**: `source/processes/management/include/G4VProcess.hh:206-209`

**Default**: Returns true (no-op)

### RetrievePhysicsTable

```cpp
virtual G4bool RetrievePhysicsTable(const G4ParticleDefinition*,
                                    const G4String& directory,
                                    G4bool ascii);
```

Retrieves physics tables from files.

**Parameters**:
- Particle definition pointer
- `directory`: Directory path containing tables
- `ascii`: True for ASCII format, false for binary

**Returns**: True if tables successfully loaded, false otherwise

**Location**: `source/processes/management/include/G4VProcess.hh:211-217`

**Default**: Returns false (no functionality)

### GetPhysicsTableFileName

```cpp
const G4String& GetPhysicsTableFileName(
                    const G4ParticleDefinition*,
                    const G4String& directory,
                    const G4String& tableName,
                    G4bool ascii = false);
```

Utility method to generate standardized physics table file names.

**Parameters**:
- Particle definition pointer
- `directory`: Directory path
- `tableName`: Base name for table
- `ascii`: True for ASCII format

**Returns**: Reference to generated file name string

**Location**: `source/processes/management/include/G4VProcess.hh:219-223`

## Tracking Lifecycle

### StartTracking

```cpp
virtual void StartTracking(G4Track*);
```

Called when tracking begins for a new track.

**Parameters**:
- Pointer to the G4Track being started

**Location**: `source/processes/management/include/G4VProcess.hh:247`

**Usage**: Override to initialize process-specific tracking data. Called once per track at the beginning.

### EndTracking

```cpp
virtual void EndTracking();
```

Called when tracking ends for a track.

**Location**: `source/processes/management/include/G4VProcess.hh:248`

**Usage**: Override to clean up process-specific tracking data. Called once per track at the end.

## Process Management Integration

### SetProcessManager

```cpp
virtual void SetProcessManager(const G4ProcessManager* procMan);
```

Sets the process manager that owns this process.

**Parameters**:
- `procMan`: Pointer to the process manager

**Location**: `source/processes/management/include/G4VProcess.hh:251, 492-495`

**Usage**: Called automatically by G4ProcessManager when process is registered. Stores back-pointer to the process manager.

### GetProcessManager

```cpp
virtual const G4ProcessManager* GetProcessManager();
```

Returns the process manager that owns this process.

**Returns**: Pointer to the process manager

**Location**: `source/processes/management/include/G4VProcess.hh:254, 498-501`

### GetCreatorProcess

```cpp
virtual const G4VProcess* GetCreatorProcess() const;
```

Returns the process to be used as creator for secondary particles.

**Returns**: Pointer to creator process (typically returns this)

**Location**: `source/processes/management/include/G4VProcess.hh:243-245`

**Usage**: Allows processes to specify a different process as the creator for secondaries.

## Process Enable/Disable Status

### isAtRestDoItIsEnabled

```cpp
inline G4bool isAtRestDoItIsEnabled() const;
```

Checks if AtRestDoIt is enabled for this process.

**Returns**: True if AtRestDoIt is enabled

**Location**: `source/processes/management/include/G4VProcess.hh:267, 504-507`

### isAlongStepDoItIsEnabled

```cpp
inline G4bool isAlongStepDoItIsEnabled() const;
```

Checks if AlongStepDoIt is enabled for this process.

**Returns**: True if AlongStepDoIt is enabled

**Location**: `source/processes/management/include/G4VProcess.hh:268, 510-513`

### isPostStepDoItIsEnabled

```cpp
inline G4bool isPostStepDoItIsEnabled() const;
```

Checks if PostStepDoIt is enabled for this process.

**Returns**: True if PostStepDoIt is enabled

**Location**: `source/processes/management/include/G4VProcess.hh:269, 516-519`

**Usage**: These methods are used by G4ProcessManager to verify ordering parameters are properly set. Set the enable flags in derived class constructors.

## Output and Debugging

### SetVerboseLevel

```cpp
inline void SetVerboseLevel(G4int value);
```

Sets the verbosity level for process output.

**Parameters**:
- `value`: Verbosity level (0=silent, 1=warning, 2=detailed)

**Location**: `source/processes/management/include/G4VProcess.hh:280, 416-419`

### GetVerboseLevel

```cpp
inline G4int GetVerboseLevel() const;
```

Returns the current verbosity level.

**Returns**: Verbosity level

**Location**: `source/processes/management/include/G4VProcess.hh:281, 422-425`

### DumpInfo

```cpp
virtual void DumpInfo() const;
```

Dumps process information to output.

**Location**: `source/processes/management/include/G4VProcess.hh:274`

**Usage**: Override to provide custom debug information about the process state.

### ProcessDescription

```cpp
virtual void ProcessDescription(std::ostream& outfile) const;
```

Writes process description to HTML file for automatic documentation.

**Parameters**:
- `outfile`: Output stream for writing

**Location**: `source/processes/management/include/G4VProcess.hh:277`

## Multi-Threading Support

### SetMasterProcess

```cpp
virtual void SetMasterProcess(G4VProcess* masterP);
```

Sets the master thread process instance.

**Parameters**:
- `masterP`: Pointer to master process instance

**Location**: `source/processes/management/include/G4VProcess.hh:287`

**Usage**: Called automatically in worker threads to establish link to master process.

### GetMasterProcess

```cpp
inline const G4VProcess* GetMasterProcess() const;
```

Returns the master thread process instance.

**Returns**: Pointer to master process (nullptr in sequential mode or master thread)

**Location**: `source/processes/management/include/G4VProcess.hh:289-294, 522-525`

**Usage**: Use to distinguish master/worker:
```cpp
if (this != GetMasterProcess()) {
    // Worker thread
} else {
    // Master thread or sequential
}
```

### BuildWorkerPhysicsTable

```cpp
virtual void BuildWorkerPhysicsTable(const G4ParticleDefinition& part);
```

Builds or retrieves physics tables in worker threads.

**Parameters**:
- `part`: Particle definition

**Location**: `source/processes/management/include/G4VProcess.hh:296-302`

**Usage**: Override to share read-only physics tables from master process. Default implementation calls BuildPhysicsTable().

**Example**:
```cpp
void MyProcess::BuildWorkerPhysicsTable(const G4ParticleDefinition& part) {
    if (GetMasterProcess()) {
        // Worker: share tables from master
        const MyProcess* master = static_cast<const MyProcess*>(GetMasterProcess());
        myTable = master->myTable;
    } else {
        // Master: build tables
        BuildPhysicsTable(part);
    }
}
```

### PrepareWorkerPhysicsTable

```cpp
virtual void PrepareWorkerPhysicsTable(const G4ParticleDefinition&);
```

Prepares physics tables in worker threads.

**Parameters**:
- Particle definition

**Location**: `source/processes/management/include/G4VProcess.hh:304-310`

**Usage**: Override to perform worker-specific preparation. Default calls PreparePhysicsTable().

## Protected Methods

These methods are available to derived classes but not to users.

### SubtractNumberOfInteractionLengthLeft

```cpp
inline void SubtractNumberOfInteractionLengthLeft(G4double prevStepSize);
```

Subtracts interaction length corresponding to the step taken.

**Parameters**:
- `prevStepSize`: Previous step size

**Location**: `source/processes/management/include/G4VProcess.hh:314-316, 528-556`

**Usage**: Call in GPIL methods to update remaining interaction length after a step.

**Algorithm**:
```cpp
theNumberOfInteractionLengthLeft -= prevStepSize / currentInteractionLength;
if (theNumberOfInteractionLengthLeft < 0.)
    theNumberOfInteractionLengthLeft = CLHEP::perMillion;
```

### ClearNumberOfInteractionLengthLeft

```cpp
inline void ClearNumberOfInteractionLengthLeft();
```

Clears the interaction length left (sets to -1).

**Location**: `source/processes/management/include/G4VProcess.hh:318-319, 428-432`

**Usage**: Must be called at the end of PostStepDoIt() and AtRestDoIt() to indicate interaction has occurred.

## Protected Data Members

### aProcessManager

```cpp
const G4ProcessManager* aProcessManager = nullptr;
```

Pointer to the process manager that owns this process.

**Location**: `source/processes/management/include/G4VProcess.hh:323`

### pParticleChange

```cpp
G4VParticleChange* pParticleChange = nullptr;
```

Pointer to G4VParticleChange object returned by DoIt methods.

**Location**: `source/processes/management/include/G4VProcess.hh:325-329`

**Usage**: Derived classes must set this pointer to their specific particle change object after construction.

### aParticleChange

```cpp
G4ParticleChange aParticleChange;
```

Default particle change object for compatibility.

**Location**: `source/processes/management/include/G4VProcess.hh:331-333`

**Note**: Kept for backward compatibility. May be removed in future versions.

### theNumberOfInteractionLengthLeft

```cpp
G4double theNumberOfInteractionLengthLeft = -1.0;
```

Flight length remaining in units of interaction length.

**Location**: `source/processes/management/include/G4VProcess.hh:335-337`

### currentInteractionLength

```cpp
G4double currentInteractionLength = -1.0;
```

The interaction length in the current material.

**Location**: `source/processes/management/include/G4VProcess.hh:339-340`

### theInitialNumberOfInteractionLength

```cpp
G4double theInitialNumberOfInteractionLength = -1.0;
```

Initial value when ResetNumberOfInteractionLengthLeft() is invoked.

**Location**: `source/processes/management/include/G4VProcess.hh:342-343`

### theProcessName

```cpp
G4String theProcessName;
```

The name of the process.

**Location**: `source/processes/management/include/G4VProcess.hh:345-346`

### theProcessType

```cpp
G4ProcessType theProcessType = fNotDefined;
```

The type of the process.

**Location**: `source/processes/management/include/G4VProcess.hh:350-351`

### theProcessSubType

```cpp
G4int theProcessSubType = -1;
```

The sub-type of the process.

**Location**: `source/processes/management/include/G4VProcess.hh:353-354`

### thePILfactor

```cpp
G4double thePILfactor = 1.0;
```

Factor for physics interaction length.

**Location**: `source/processes/management/include/G4VProcess.hh:356-358`

### verboseLevel

```cpp
G4int verboseLevel = 0;
```

Control flag for output messages.

**Location**: `source/processes/management/include/G4VProcess.hh:360-361`

### enableAtRestDoIt, enableAlongStepDoIt, enablePostStepDoIt

```cpp
G4bool enableAtRestDoIt = true;
G4bool enableAlongStepDoIt = true;
G4bool enablePostStepDoIt = true;
```

Flags indicating which DoIt methods are enabled.

**Location**: `source/processes/management/include/G4VProcess.hh:363-365`

**Usage**: Set these flags in derived class constructor to indicate which DoIt methods are implemented.

## Understanding the DoIt/GPIL Execution Model

The G4VProcess execution model is fundamental to how Geant4 simulates particle interactions. Understanding this model is essential for implementing custom processes.

### The Three Process Categories

1. **AtRest Processes**: Act on particles that have stopped
   - Example: Decay at rest, positron annihilation at rest
   - Time-based: GPIL returns time until interaction
   - Only invoked when particle velocity reaches zero

2. **AlongStep Processes**: Act continuously during the step
   - Example: Ionization, multiple scattering, Cherenkov radiation
   - Always invoked for every step (if enabled)
   - Can limit step size but don't compete with discrete processes

3. **PostStep Processes**: Act discretely at the end of a step
   - Example: Compton scattering, bremsstrahlung, hadronic interactions
   - Compete to determine step length
   - Only the "winning" process (shortest length) acts, unless forced

### The Stepping Loop

For each step, G4SteppingManager:

1. **GPIL Phase** (Determine step length):
   ```
   For each PostStep process:
       Call PostStepGPIL() → get proposed step length
   For each AlongStep process:
       Call AlongStepGPIL() → get proposed step length
   For stopped particles, each AtRest process:
       Call AtRestGPIL() → get proposed time

   Determine minimum step length/time
   Also consider geometry and user limits
   ```

2. **DoIt Phase** (Execute interactions):
   ```
   For each AlongStep process:
       Call AlongStepDoIt() → apply continuous effects

   If discrete interaction occurred:
       Call PostStepDoIt() of winning process

   If particle at rest and time expired:
       Call AtRestDoIt() of winning process
   ```

### Interaction Length Algorithm

Processes use the concept of "interaction length" (λ) to determine when interactions occur:

1. At the start of tracking or after an interaction:
   ```cpp
   ResetNumberOfInteractionLengthLeft() {
       theNumberOfInteractionLengthLeft = -log(random());
       theInitialNumberOfInteractionLength = theNumberOfInteractionLengthLeft;
   }
   ```

2. At each step in GPIL:
   ```cpp
   PostStepGetPhysicalInteractionLength(...) {
       if (previousStepSize < 0) {
           ResetNumberOfInteractionLengthLeft();
       } else {
           SubtractNumberOfInteractionLengthLeft(previousStepSize);
       }
       currentInteractionLength = GetCrossSection(...); // Process specific
       return theNumberOfInteractionLengthLeft * currentInteractionLength;
   }
   ```

3. After interaction in DoIt:
   ```cpp
   PostStepDoIt(...) {
       // Perform interaction
       // ...
       ClearNumberOfInteractionLengthLeft(); // Reset for next interaction
       return particleChange;
   }
   ```

### Force Conditions

G4ForceCondition allows fine control over when DoIt is called:

- **NotForced**: DoIt called only if this process determines step length
- **Forced**: DoIt always called, even if another process determines step
- **Conditionally**: Forced if some condition is met
- **StronglyForced**: Higher priority than Forced
- **ExclusivelyForced**: Only this DoIt is called, others are skipped

## Thread Safety Considerations

In multi-threaded applications, special care must be taken with process implementation:

### Thread Categories

1. **Master Thread**: Initializes physics, builds shared tables
2. **Worker Threads**: Execute events using shared read-only data

### Thread-Safe Process Design

**Shared Data (Read-Only in Workers)**:
- Physics tables (cross-sections, energy loss, etc.)
- Material/element properties
- Process configuration

**Thread-Local Data**:
- Particle change objects
- Interaction length counters
- Tracking state variables

### Implementation Pattern

```cpp
class MyProcess : public G4VProcess {
public:
    MyProcess() : G4VProcess(...) {
        // Constructor runs in master and each worker
    }

    void BuildPhysicsTable(const G4ParticleDefinition& part) override {
        // Only runs in master or sequential
        if (IsMaster()) {
            // Build expensive tables
            crossSectionTable = new G4PhysicsTable();
            // ... populate table ...
        }
    }

    void BuildWorkerPhysicsTable(const G4ParticleDefinition& part) override {
        // Runs in worker threads
        if (GetMasterProcess()) {
            // Share master's table (read-only)
            auto* master = static_cast<const MyProcess*>(GetMasterProcess());
            crossSectionTable = master->crossSectionTable;
        } else {
            // Master or sequential: build table
            BuildPhysicsTable(part);
        }
    }

    G4VParticleChange* PostStepDoIt(const G4Track& track, const G4Step& step) override {
        // Uses only thread-local data (pParticleChange) and read-only shared data
        // Safe to run concurrently in multiple threads
        pParticleChange->Initialize(track);
        // ... perform interaction using shared cross-section table (read-only) ...
        return pParticleChange;
    }

private:
    G4PhysicsTable* crossSectionTable; // Shared read-only in workers
    // Each thread has its own pParticleChange (inherited, thread-local)
};
```

### Best Practices for Thread Safety

1. **Never write to shared data in DoIt or GPIL methods**
2. **Use GetMasterProcess() to identify worker threads**
3. **Share read-only physics tables from master**
4. **Keep tracking state in thread-local variables**
5. **Avoid static non-const variables**
6. **Use thread-local storage for caches if needed**

## Usage Examples

### Example 1: Simple Discrete Process

```cpp
// MyDecayProcess.hh
class MyDecayProcess : public G4VProcess {
public:
    MyDecayProcess() : G4VProcess("MyDecay", fDecay) {
        // Enable only PostStep (discrete process)
        enableAtRestDoIt = false;
        enableAlongStepDoIt = false;
        enablePostStepDoIt = true;

        pParticleChange = &fParticleChange;
    }

    // Required overrides
    G4bool IsApplicable(const G4ParticleDefinition& particle) override {
        return (particle.GetPDGLifeTime() > 0); // Only unstable particles
    }

    G4double PostStepGetPhysicalInteractionLength(
        const G4Track& track,
        G4double previousStepSize,
        G4ForceCondition* condition) override {

        // Handle interaction length
        if (previousStepSize < 0.0) {
            ResetNumberOfInteractionLengthLeft();
        } else if (currentInteractionLength > 0.0) {
            SubtractNumberOfInteractionLengthLeft(previousStepSize);
        }

        // Calculate interaction length: c*tau*gamma (proper length)
        currentInteractionLength =
            track.GetDynamicParticle()->GetDefinition()->GetPDGLifeTime() *
            CLHEP::c_light * track.GetVelocity() / CLHEP::c_light;

        *condition = NotForced;
        return theNumberOfInteractionLengthLeft * currentInteractionLength;
    }

    G4VParticleChange* PostStepDoIt(
        const G4Track& track,
        const G4Step& step) override {

        fParticleChange.Initialize(track);

        // Kill the parent
        fParticleChange.ProposeTrackStatus(fStopAndKill);

        // Create decay products
        // ... (generate secondaries based on decay channels)

        ClearNumberOfInteractionLengthLeft();
        return &fParticleChange;
    }

    // Stub implementations for unused methods
    G4double AlongStepGetPhysicalInteractionLength(
        const G4Track&, G4double, G4double, G4double&, G4GPILSelection*) override {
        return DBL_MAX;
    }

    G4double AtRestGetPhysicalInteractionLength(
        const G4Track&, G4ForceCondition*) override {
        return DBL_MAX;
    }

    G4VParticleChange* AlongStepDoIt(const G4Track&, const G4Step&) override {
        // Should never be called
        return pParticleChange;
    }

    G4VParticleChange* AtRestDoIt(const G4Track&, const G4Step&) override {
        // Should never be called
        return pParticleChange;
    }

private:
    G4ParticleChange fParticleChange;
};
```

### Example 2: Continuous Energy Loss Process

```cpp
// MyIonisationProcess.hh
class MyIonisationProcess : public G4VProcess {
public:
    MyIonisationProcess() : G4VProcess("MyIonisation", fElectromagnetic) {
        SetProcessSubType(2); // Ionisation

        // Enable only AlongStep (continuous process)
        enableAtRestDoIt = false;
        enableAlongStepDoIt = true;
        enablePostStepDoIt = false;

        pParticleChange = &fParticleChangeForLoss;
    }

    G4bool IsApplicable(const G4ParticleDefinition& particle) override {
        return (particle.GetPDGCharge() != 0.0); // Charged particles only
    }

    void BuildPhysicsTable(const G4ParticleDefinition& particle) override {
        // Build dE/dx tables for each material
        if (IsMaster()) {
            dEdxTable = new G4PhysicsTable();
            // ... populate table with dE/dx values ...
        }
    }

    void BuildWorkerPhysicsTable(const G4ParticleDefinition& particle) override {
        if (GetMasterProcess()) {
            // Worker: share master's table
            auto* master = static_cast<const MyIonisationProcess*>(GetMasterProcess());
            dEdxTable = master->dEdxTable;
        } else {
            BuildPhysicsTable(particle);
        }
    }

    G4double AlongStepGetPhysicalInteractionLength(
        const G4Track& track,
        G4double, // previousStepSize (not used for continuous)
        G4double, // currentMinimumStep (not used here)
        G4double& proposedSafety,
        G4GPILSelection* selection) override {

        // For continuous processes, typically return a large value
        // Real step limitation comes from dE/dx considerations
        *selection = CandidateForSelection;
        return DBL_MAX;
    }

    G4VParticleChange* AlongStepDoIt(
        const G4Track& track,
        const G4Step& step) override {

        fParticleChangeForLoss.InitializeForAlongStep(track);

        G4double stepLength = step.GetStepLength();
        G4double energy = track.GetKineticEnergy();

        // Get dE/dx from table
        G4double dEdx = GetDEDX(track);

        // Calculate energy loss
        G4double energyLoss = dEdx * stepLength;
        energyLoss = std::min(energyLoss, energy); // Can't lose more than we have

        // Apply energy loss
        fParticleChangeForLoss.ProposeEnergy(energy - energyLoss);
        fParticleChangeForLoss.ProposeLocalEnergyDeposit(energyLoss);

        return &fParticleChangeForLoss;
    }

    // Stub implementations
    G4double PostStepGetPhysicalInteractionLength(
        const G4Track&, G4double, G4ForceCondition*) override {
        return DBL_MAX;
    }

    G4double AtRestGetPhysicalInteractionLength(
        const G4Track&, G4ForceCondition*) override {
        return DBL_MAX;
    }

    G4VParticleChange* PostStepDoIt(const G4Track&, const G4Step&) override {
        return pParticleChange;
    }

    G4VParticleChange* AtRestDoIt(const G4Track&, const G4Step&) override {
        return pParticleChange;
    }

private:
    G4double GetDEDX(const G4Track& track) {
        // Lookup dE/dx from table based on particle energy and material
        // ... implementation ...
        return 1.0 * MeV/cm; // Placeholder
    }

    G4ParticleChangeForLoss fParticleChangeForLoss;
    G4PhysicsTable* dEdxTable = nullptr;
};
```

### Example 3: At-Rest Process

```cpp
// MyAnnihilationProcess.hh
class MyAnnihilationProcess : public G4VProcess {
public:
    MyAnnihilationProcess() : G4VProcess("MyAnnihilation", fElectromagnetic) {
        // Enable only AtRest
        enableAtRestDoIt = true;
        enableAlongStepDoIt = false;
        enablePostStepDoIt = false;

        pParticleChange = &fParticleChange;
    }

    G4bool IsApplicable(const G4ParticleDefinition& particle) override {
        return (&particle == G4Positron::Positron());
    }

    G4double AtRestGetPhysicalInteractionLength(
        const G4Track& track,
        G4ForceCondition* condition) override {

        // Reset if needed
        if (theNumberOfInteractionLengthLeft < 0.0) {
            ResetNumberOfInteractionLengthLeft();
        }

        // Mean lifetime for annihilation at rest
        currentInteractionLength = 1.0e-10 * ns; // Very short

        *condition = NotForced;
        return theNumberOfInteractionLengthLeft * currentInteractionLength;
    }

    G4VParticleChange* AtRestDoIt(
        const G4Track& track,
        const G4Step& step) override {

        fParticleChange.Initialize(track);

        // Kill the positron
        fParticleChange.ProposeTrackStatus(fStopAndKill);

        // Create two back-to-back 511 keV gammas
        G4double energy = track.GetDynamicParticle()->GetMass(); // 511 keV

        // Random direction
        G4double cosTheta = 2.0 * G4UniformRand() - 1.0;
        G4double sinTheta = std::sqrt(1.0 - cosTheta*cosTheta);
        G4double phi = CLHEP::twopi * G4UniformRand();

        G4ThreeVector direction1(sinTheta*std::cos(phi),
                                 sinTheta*std::sin(phi),
                                 cosTheta);
        G4ThreeVector direction2 = -direction1;

        // Create first gamma
        G4DynamicParticle* gamma1 = new G4DynamicParticle(
            G4Gamma::Gamma(), direction1, energy);
        fParticleChange.AddSecondary(gamma1);

        // Create second gamma
        G4DynamicParticle* gamma2 = new G4DynamicParticle(
            G4Gamma::Gamma(), direction2, energy);
        fParticleChange.AddSecondary(gamma2);

        ClearNumberOfInteractionLengthLeft();
        return &fParticleChange;
    }

    // Stub implementations
    G4double AlongStepGetPhysicalInteractionLength(
        const G4Track&, G4double, G4double, G4double&, G4GPILSelection*) override {
        return DBL_MAX;
    }

    G4double PostStepGetPhysicalInteractionLength(
        const G4Track&, G4double, G4ForceCondition*) override {
        return DBL_MAX;
    }

    G4VParticleChange* AlongStepDoIt(const G4Track&, const G4Step&) override {
        return pParticleChange;
    }

    G4VParticleChange* PostStepDoIt(const G4Track&, const G4Step&) override {
        return pParticleChange;
    }

private:
    G4ParticleChange fParticleChange;
};
```

### Example 4: Process Registration

```cpp
// In your physics list
void MyPhysicsList::ConstructProcess() {
    // Add transportation (required)
    AddTransportation();

    // Get particle iterator
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while ((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4ProcessManager* pManager = particle->GetProcessManager();

        G4String particleName = particle->GetParticleName();

        if (particleName == "e+") {
            // Add ionisation (AlongStep)
            pManager->AddProcess(new MyIonisationProcess(), -1, 2, 2);

            // Add annihilation (AtRest)
            pManager->AddProcess(new MyAnnihilationProcess(), 0, -1, 3);
        }
        else if (particle->GetPDGLifeTime() > 0) {
            // Add decay for unstable particles (PostStep)
            pManager->AddProcess(new MyDecayProcess(), -1, -1, 1);
        }
    }
}
```

The ordering parameters in AddProcess(process, ordAtRest, ordAlongStep, ordPostStep):
- -1: Not applicable
- 0+: Ordering index (lower = earlier in the list)

## Best Practices for Process Development

### 1. Enable Flags

Always set the enable flags correctly in the constructor:

```cpp
MyProcess::MyProcess() : G4VProcess("MyProcess", fElectromagnetic) {
    enableAtRestDoIt = false;    // Set true only if implementing AtRest
    enableAlongStepDoIt = true;  // Set true only if implementing AlongStep
    enablePostStepDoIt = false;  // Set true only if implementing PostStep
}
```

### 2. Particle Change Management

Set pParticleChange to point to your particle change object:

```cpp
MyProcess::MyProcess() : G4VProcess(...) {
    pParticleChange = &fMyParticleChange;
}
```

Always initialize particle change at the start of DoIt:

```cpp
G4VParticleChange* MyProcess::PostStepDoIt(...) {
    fParticleChange.Initialize(track);
    // ... do work ...
    return &fParticleChange;
}
```

### 3. Interaction Length Management

For discrete processes (PostStep/AtRest):
- Call ResetNumberOfInteractionLengthLeft() at start or when previousStepSize < 0
- Call SubtractNumberOfInteractionLengthLeft() in GPIL
- Call ClearNumberOfInteractionLengthLeft() at end of DoIt

```cpp
G4double MyProcess::PostStepGetPhysicalInteractionLength(...) {
    if (previousStepSize < 0.0) {
        ResetNumberOfInteractionLengthLeft();
    } else {
        SubtractNumberOfInteractionLengthLeft(previousStepSize);
    }
    // ... calculate currentInteractionLength ...
    return theNumberOfInteractionLengthLeft * currentInteractionLength;
}

G4VParticleChange* MyProcess::PostStepDoIt(...) {
    // ... do interaction ...
    ClearNumberOfInteractionLengthLeft(); // Important!
    return pParticleChange;
}
```

### 4. Physics Table Building

For multi-threaded applications:
- Build tables only in master thread (BuildPhysicsTable)
- Share tables in worker threads (BuildWorkerPhysicsTable)
- Never modify shared tables in DoIt methods

```cpp
void MyProcess::BuildPhysicsTable(const G4ParticleDefinition& part) {
    if (IsMaster()) {
        // Expensive table building
    }
}

void MyProcess::BuildWorkerPhysicsTable(const G4ParticleDefinition& part) {
    if (GetMasterProcess()) {
        auto* master = static_cast<const MyProcess*>(GetMasterProcess());
        myTable = master->myTable; // Share read-only
    } else {
        BuildPhysicsTable(part);
    }
}
```

### 5. Return Values for Unused Methods

For methods not used by your process type, return safe defaults:

```cpp
// For unused GPIL methods
return DBL_MAX; // Won't limit step

// For unused DoIt methods
return pParticleChange; // Return unchanged particle
```

### 6. Verbosity and Debugging

Use verbosity levels consistently:

```cpp
if (verboseLevel > 0) {
    G4cout << "MyProcess: Warning - something unusual" << G4endl;
}

if (verboseLevel > 1) {
    G4cout << "MyProcess: Detailed info - energy = " << energy << G4endl;
}
```

### 7. Process Naming

Use descriptive, unique names:

```cpp
MyProcess::MyProcess()
    : G4VProcess("MyComptonScattering", fElectromagnetic) {
    SetProcessSubType(fComptonScattering); // Use standard sub-types
}
```

### 8. IsApplicable Implementation

Be specific about which particles your process applies to:

```cpp
G4bool MyProcess::IsApplicable(const G4ParticleDefinition& particle) {
    // Only for electrons and positrons
    return (&particle == G4Electron::Electron() ||
            &particle == G4Positron::Positron());
}
```

### 9. Error Handling

Use G4Exception for serious errors:

```cpp
if (energy < 0) {
    G4Exception("MyProcess::PostStepDoIt",
                "MyProcess001",
                FatalException,
                "Negative energy encountered");
}
```

### 10. Secondary Production

When creating secondaries, set their properties correctly:

```cpp
// Create secondary particle
G4DynamicParticle* secondary = new G4DynamicParticle(
    G4Gamma::Gamma(),
    direction,
    kineticEnergy);

// Set creation time and position
G4Track* secondaryTrack = new G4Track(secondary,
                                       track.GetGlobalTime(),
                                       track.GetPosition());

// Set creator process
secondaryTrack->SetCreatorProcess(this);

// Add to particle change
fParticleChange.AddSecondary(secondaryTrack);
```

## Common Pitfalls

1. **Forgetting to call ClearNumberOfInteractionLengthLeft()** in DoIt methods leads to incorrect interaction spacing

2. **Not setting pParticleChange** causes crashes when DoIt is called

3. **Wrong enable flags** prevents process from being invoked correctly

4. **Modifying shared data in DoIt methods** causes race conditions in multi-threaded mode

5. **Not checking previousStepSize sign** in GPIL can lead to incorrect interaction lengths

6. **Returning 0 or negative values from GPIL** causes simulation to hang or crash

7. **Not implementing BuildWorkerPhysicsTable** leads to table rebuilding in every worker (inefficient)

## Version History

Key changes from header comments (G4VProcess.hh:34-36):
- **2 December 1995, G.Cosmo**: First implementation based on object model
- **18 December 1996, H.Kurashige**: New Physics scheme

## See Also

- [G4ProcessManager](./g4processmanager.md) - Manages processes for each particle type
- [G4ProcessTable](./g4processtable.md) - Global table of all processes
- [G4Track](../track/g4track.md) - Represents a particle being tracked
- [G4Step](../track/g4step.md) - Represents a step in the tracking
- [G4VParticleChange](./g4vparticlechange.md) - Describes changes to particle state
- [G4ParticleChange](./g4particlechange.md) - Concrete implementation for general changes
- [G4SteppingManager](../tracking/g4steppingmanager.md) - Controls the stepping loop
- [G4PhysicsTable](../utils/g4physicstable.md) - Container for physics tables
- [Physics Process Overview](../processes.md) - High-level process documentation
