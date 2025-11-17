# G4ProcessManager

**File**: `source/processes/management/include/G4ProcessManager.hh`

## Overview

G4ProcessManager is the central class for managing all physics processes that a particle can undergo during tracking. Each particle type (G4ParticleDefinition) has its own process manager that collects and organizes all applicable physics processes. The process manager maintains multiple process vectors optimized for different tracking stages and provides methods to add, remove, configure, and query processes.

During tracking, the G4TrackingManager queries the process manager to:
- Determine which processes are active for the particle
- Get process interaction lengths to limit the step size
- Execute the appropriate DoIt methods to apply physics interactions

## Class Description

G4ProcessManager organizes processes into specialized vectors based on when they are invoked during tracking:

- **Process List**: Master vector containing all processes registered for the particle
- **AtRest Processes**: Invoked when a particle is at rest (e.g., decay, absorption)
- **AlongStep Processes**: Invoked continuously along the step (e.g., ionization, energy loss)
- **PostStep Processes**: Invoked at the end of a step (e.g., discrete interactions, boundaries)

Each category maintains two vectors:
- **GPIL Vector**: For GetPhysicalInteractionLength methods (step limitation)
- **DoIt Vector**: For DoIt methods (physics execution)

This architecture allows the tracking system to efficiently determine step sizes and apply physics interactions in the correct sequence.

## Enumerations

### G4ProcessVectorTypeIndex

```cpp
enum G4ProcessVectorTypeIndex {
  typeGPIL = 0,  // for GetPhysicalInteractionLength
  typeDoIt = 1   // for DoIt
};
```

Identifies which type of process vector to access.

**Location**: `source/processes/management/include/G4ProcessManager.hh:71-75`

**Usage**:
- `typeGPIL`: Access the GetPhysicalInteractionLength vector (used for step limitation)
- `typeDoIt`: Access the DoIt vector (used for applying physics)

### G4ProcessVectorDoItIndex

```cpp
enum G4ProcessVectorDoItIndex {
  idxAll = -1,        // for all DoIt/GPIL
  idxAtRest = 0,      // for AtRestDoIt/GPIL
  idxAlongStep = 1,   // for AlongStepDoIt/GPIL
  idxPostStep = 2,    // for PostStepDoIt/GPIL
  NDoit = 3
};
```

Identifies which process category (tracking stage) to access.

**Location**: `source/processes/management/include/G4ProcessManager.hh:76-83`

**Values**:
- `idxAll`: Refers to all categories
- `idxAtRest`: Processes invoked when particle is at rest
- `idxAlongStep`: Processes invoked continuously along the step
- `idxPostStep`: Processes invoked at the end of the step
- `NDoit`: Total number of DoIt categories (3)

### G4ProcessVectorOrdering

```cpp
enum G4ProcessVectorOrdering {
  ordInActive = -1,   // ordering parameter to indicate InActive DoIt
  ordDefault = 1000,  // default ordering parameter
  ordLast = 9999      // ordering parameter to indicate the last DoIt
};
```

Defines special ordering parameter values for process registration.

**Location**: `source/processes/management/include/G4ProcessManager.hh:87-92`

**Values**:
- `ordInActive`: Process is not active for this DoIt type (value: -1)
- `ordDefault`: Default ordering when not specified (value: 1000)
- `ordLast`: Process should be invoked last (value: 9999)

**Ordering Rules**:
- Lower values are executed first
- Negative values indicate the process is inactive for that category
- Processes with identical ordering are executed in registration order
- Use specific values (0-9998) for precise control of execution order

## Constructors & Destructor

### Constructor

```cpp
G4ProcessManager(const G4ParticleDefinition* aParticleType);
```

Creates a process manager for a specific particle type.

**Parameters**:
- `aParticleType`: Pointer to the particle definition this manager belongs to

**Location**: `source/processes/management/include/G4ProcessManager.hh:100-101`

**Behavior**:
- Initializes all internal process vectors (6 vectors total: 3 categories × 2 types)
- Creates the process attribute vector for metadata storage
- Sets up the process manager messenger for UI commands
- Associates the manager with the specified particle type

**Example**:
```cpp
// Typically called internally by G4ParticleDefinition
G4ProcessManager* pManager = new G4ProcessManager(G4Electron::Definition());
```

**Note**: Process managers are usually created automatically by particle definitions. Users rarely need to construct them directly.

### Copy Constructor

```cpp
G4ProcessManager(G4ProcessManager& right);
```

Creates a copy of an existing process manager.

**Parameters**:
- `right`: Process manager to copy from

**Location**: `source/processes/management/include/G4ProcessManager.hh:103-104`

**Usage**: Often used when copying particle definitions or setting up similar physics configurations.

**Warning**: Processes themselves are not copied; only pointers to processes are copied, so both managers share the same process instances.

### Deleted Default Constructor and Assignment

```cpp
G4ProcessManager() = delete;
G4ProcessManager& operator=(const G4ProcessManager&) = delete;
```

Default construction and assignment operations are explicitly disabled.

**Location**: `source/processes/management/include/G4ProcessManager.hh:106-108`

**Reason**: A process manager must always be associated with a particle type.

### Destructor

```cpp
~G4ProcessManager();
```

Destroys the process manager and cleans up internal vectors.

**Location**: `source/processes/management/include/G4ProcessManager.hh:110-111`

**Note**: Does not delete the processes themselves, only the vectors containing them.

## Comparison Operators

### Equality Operators

```cpp
G4bool operator==(const G4ProcessManager& right) const;
G4bool operator!=(const G4ProcessManager& right) const;
```

Compare two process managers for equality.

**Location**: `source/processes/management/include/G4ProcessManager.hh:113-114`

## Process List Access Methods

### GetProcessList

```cpp
inline G4ProcessVector* GetProcessList() const;
```

Returns the master list containing all processes registered for this particle.

**Returns**: Pointer to the complete process vector

**Location**: `source/processes/management/include/G4ProcessManager.hh:116-117`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:38-41`

**Example**:
```cpp
G4ProcessVector* processList = pManager->GetProcessList();
for (G4int i = 0; i < processList->size(); ++i) {
  G4VProcess* process = (*processList)[i];
  G4cout << "Process: " << process->GetProcessName() << G4endl;
}
```

### GetProcessListLength

```cpp
inline G4int GetProcessListLength() const;
```

Returns the total number of processes registered.

**Returns**: Number of processes in the process list

**Location**: `source/processes/management/include/G4ProcessManager.hh:119-120`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:44-47`

### GetProcessIndex

```cpp
inline G4int GetProcessIndex(G4VProcess* aProcess) const;
```

Returns the index of a process in the master process list.

**Parameters**:
- `aProcess`: Pointer to the process to locate

**Returns**: Index in the process list, or -1 if not found

**Location**: `source/processes/management/include/G4ProcessManager.hh:122-123`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:50-55`

## Process Vector Access Methods

### GetProcessVector

```cpp
inline G4ProcessVector* GetProcessVector(
    G4ProcessVectorDoItIndex idx,
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns a specific process vector by category and type.

**Parameters**:
- `idx`: Process category (idxAtRest, idxAlongStep, or idxPostStep)
- `typ`: Vector type (typeGPIL or typeDoIt), defaults to typeGPIL

**Returns**: Pointer to the requested process vector, or nullptr if invalid index

**Location**: `source/processes/management/include/G4ProcessManager.hh:125-129`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:83-97`

**Example**:
```cpp
// Get the PostStep GPIL vector
G4ProcessVector* postStepGPIL =
    pManager->GetProcessVector(idxPostStep, typeGPIL);

// Get the AlongStep DoIt vector
G4ProcessVector* alongStepDoIt =
    pManager->GetProcessVector(idxAlongStep, typeDoIt);
```

### GetAtRestProcessVector

```cpp
inline G4ProcessVector* GetAtRestProcessVector(
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns the AtRest process vector (for stationary particles).

**Parameters**:
- `typ`: Vector type (typeGPIL or typeDoIt), defaults to typeGPIL

**Returns**: Pointer to the AtRest process vector

**Location**: `source/processes/management/include/G4ProcessManager.hh:131-137`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:100-105`

**Usage**: AtRest processes are invoked when particles come to rest (e.g., muon decay, neutron capture).

### GetAlongStepProcessVector

```cpp
inline G4ProcessVector* GetAlongStepProcessVector(
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns the AlongStep process vector (for continuous processes).

**Parameters**:
- `typ`: Vector type (typeGPIL or typeDoIt), defaults to typeGPIL

**Returns**: Pointer to the AlongStep process vector

**Location**: `source/processes/management/include/G4ProcessManager.hh:138-143`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:108-113`

**Usage**: AlongStep processes are invoked continuously during tracking (e.g., ionization, multiple scattering).

### GetPostStepProcessVector

```cpp
inline G4ProcessVector* GetPostStepProcessVector(
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns the PostStep process vector (for discrete processes).

**Parameters**:
- `typ`: Vector type (typeGPIL or typeDoIt), defaults to typeGPIL

**Returns**: Pointer to the PostStep process vector

**Location**: `source/processes/management/include/G4ProcessManager.hh:145-150`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:116-121`

**Usage**: PostStep processes are invoked at step boundaries (e.g., electromagnetic interactions, transportation).

## Process Index Query Methods

### GetProcessVectorIndex

```cpp
G4int GetProcessVectorIndex(
    G4VProcess* aProcess,
    G4ProcessVectorDoItIndex idx,
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns the index of a process within a specific process vector.

**Parameters**:
- `aProcess`: Pointer to the process
- `idx`: Process category (idxAtRest, idxAlongStep, idxPostStep)
- `typ`: Vector type (typeGPIL or typeDoIt), defaults to typeGPIL

**Returns**: Index within the specified vector, or -1 if not found or inactive

**Location**: `source/processes/management/include/G4ProcessManager.hh:152-156`

### GetAtRestIndex

```cpp
inline G4int GetAtRestIndex(
    G4VProcess* aProcess,
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns the index of a process in the AtRest process vector.

**Parameters**:
- `aProcess`: Pointer to the process
- `typ`: Vector type, defaults to typeGPIL

**Returns**: Index in the AtRest vector, or -1 if not active

**Location**: `source/processes/management/include/G4ProcessManager.hh:157-160`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:124-130`

### GetAlongStepIndex

```cpp
inline G4int GetAlongStepIndex(
    G4VProcess* aProcess,
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns the index of a process in the AlongStep process vector.

**Parameters**:
- `aProcess`: Pointer to the process
- `typ`: Vector type, defaults to typeGPIL

**Returns**: Index in the AlongStep vector, or -1 if not active

**Location**: `source/processes/management/include/G4ProcessManager.hh:161-164`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:133-139`

### GetPostStepIndex

```cpp
inline G4int GetPostStepIndex(
    G4VProcess* aProcess,
    G4ProcessVectorTypeIndex typ = typeGPIL
) const;
```

Returns the index of a process in the PostStep process vector.

**Parameters**:
- `aProcess`: Pointer to the process
- `typ`: Vector type, defaults to typeGPIL

**Returns**: Index in the PostStep vector, or -1 if not active

**Location**: `source/processes/management/include/G4ProcessManager.hh:165-169`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:142-148`

## Process Registration Methods

### AddProcess

```cpp
G4int AddProcess(
    G4VProcess* aProcess,
    G4int ordAtRestDoIt = ordInActive,
    G4int ordAlongStepDoIt = ordInActive,
    G4int ordPostStepDoIt = ordInActive
);
```

Adds a process to the process manager with specified ordering for each category.

**Parameters**:
- `aProcess`: Pointer to the process to add
- `ordAtRestDoIt`: Ordering for AtRest category (default: inactive)
- `ordAlongStepDoIt`: Ordering for AlongStep category (default: inactive)
- `ordPostStepDoIt`: Ordering for PostStep category (default: inactive)

**Returns**: Index in the process list, or negative value on error

**Location**: `source/processes/management/include/G4ProcessManager.hh:171-182`

**Ordering Rules**:
- Use `ordInActive` (-1) to disable the process for that category
- Use positive integers to set execution order (lower executes first)
- Use `ordDefault` (1000) for standard ordering
- Use `ordLast` (9999) to execute last

**Example**:
```cpp
// Add multiple scattering (AlongStep and PostStep)
pManager->AddProcess(new G4MultipleScattering,
                     ordInActive,  // Not active at rest
                     1,            // First in AlongStep
                     1);           // First in PostStep

// Add ionization (AlongStep and PostStep)
pManager->AddProcess(new G4eIonisation,
                     ordInActive,  // Not active at rest
                     2,            // Second in AlongStep
                     2);           // Second in PostStep

// Add transportation (PostStep only, must be last)
pManager->AddProcess(new G4Transportation,
                     ordInActive,  // Not active at rest
                     ordInActive,  // Not active in AlongStep
                     ordLast);     // Last in PostStep
```

**Important**: The process is added to the master process list and to the appropriate category vectors based on non-negative ordering values.

### AddRestProcess

```cpp
inline G4int AddRestProcess(G4VProcess* aProcess, G4int ord = ordDefault);
```

Convenience method to add a process active only at rest.

**Parameters**:
- `aProcess`: Pointer to the AtRest process
- `ord`: Ordering parameter for AtRest category (default: ordDefault)

**Returns**: Index in the process list

**Location**: `source/processes/management/include/G4ProcessManager.hh:196`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:151-154`

**Equivalent to**: `AddProcess(aProcess, ord, ordInActive, ordInActive)`

**Example**:
```cpp
// Add muon decay (only active at rest)
pManager->AddRestProcess(new G4Decay());
```

### AddContinuousProcess

```cpp
inline G4int AddContinuousProcess(G4VProcess* aProcess, G4int ord = ordDefault);
```

Convenience method to add a continuous process (active only along step).

**Parameters**:
- `aProcess`: Pointer to the AlongStep process
- `ord`: Ordering parameter for AlongStep category (default: ordDefault)

**Returns**: Index in the process list

**Location**: `source/processes/management/include/G4ProcessManager.hh:198`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:157-160`

**Equivalent to**: `AddProcess(aProcess, ordInActive, ord, ordInActive)`

**Example**:
```cpp
// Add Cherenkov radiation (continuous process)
pManager->AddContinuousProcess(new G4Cerenkov());
```

### AddDiscreteProcess

```cpp
inline G4int AddDiscreteProcess(G4VProcess* aProcess, G4int ord = ordDefault);
```

Convenience method to add a discrete process (active only at post step).

**Parameters**:
- `aProcess`: Pointer to the PostStep process
- `ord`: Ordering parameter for PostStep category (default: ordDefault)

**Returns**: Index in the process list

**Location**: `source/processes/management/include/G4ProcessManager.hh:197`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:163-166`

**Equivalent to**: `AddProcess(aProcess, ordInActive, ordInActive, ord)`

**Example**:
```cpp
// Add Compton scattering (discrete process)
pManager->AddDiscreteProcess(new G4ComptonScattering());
```

## Process Ordering Methods

### GetProcessOrdering

```cpp
G4int GetProcessOrdering(
    G4VProcess* aProcess,
    G4ProcessVectorDoItIndex idDoIt
);
```

Returns the current ordering parameter for a process in a specific category.

**Parameters**:
- `aProcess`: Pointer to the process
- `idDoIt`: Process category (idxAtRest, idxAlongStep, or idxPostStep)

**Returns**: Current ordering value, or ordInActive if not active in that category

**Location**: `source/processes/management/include/G4ProcessManager.hh:205-208`

### SetProcessOrdering

```cpp
void SetProcessOrdering(
    G4VProcess* aProcess,
    G4ProcessVectorDoItIndex idDoIt,
    G4int ordDoIt = ordDefault
);
```

Sets the ordering parameter for a process in a specific category.

**Parameters**:
- `aProcess`: Pointer to the process (must already be added via AddProcess)
- `idDoIt`: Process category to modify
- `ordDoIt`: New ordering value (default: ordDefault)

**Location**: `source/processes/management/include/G4ProcessManager.hh:210-221`

**Important Notes**:
- The process must have been added via AddProcess before calling this method
- Processes with the same ordering are invoked in the order they were added
- Setting ordering to 0 will be changed to a non-zero value
- Use this to fine-tune execution order after initial registration

**Example**:
```cpp
// First add the process
pManager->AddProcess(bremsstrahlung, -1, -1, 3);

// Later, modify its PostStep ordering
pManager->SetProcessOrdering(bremsstrahlung, idxPostStep, 5);
```

### SetProcessOrderingToFirst

```cpp
void SetProcessOrderingToFirst(
    G4VProcess* aProcess,
    G4ProcessVectorDoItIndex idDoIt
);
```

Sets a process to be executed first in its category.

**Parameters**:
- `aProcess`: Pointer to the process
- `idDoIt`: Process category

**Location**: `source/processes/management/include/G4ProcessManager.hh:222-229`

**Warning**: If called for multiple processes, the last one called will be first. Earlier calls will be shifted to later positions.

**Example**:
```cpp
// Ensure multiple scattering is first in AlongStep
pManager->SetProcessOrderingToFirst(multipleScattering, idxAlongStep);
```

### SetProcessOrderingToSecond

```cpp
void SetProcessOrderingToSecond(
    G4VProcess* aProcess,
    G4ProcessVectorDoItIndex idDoIt
);
```

Sets a process to ordering 1, making it execute just after processes with ordering 0.

**Parameters**:
- `aProcess`: Pointer to the process
- `idDoIt`: Process category

**Location**: `source/processes/management/include/G4ProcessManager.hh:231-239`

**Warning**: If called for multiple processes, the last one called will execute first among those at ordering 1.

### SetProcessOrderingToLast

```cpp
void SetProcessOrderingToLast(
    G4VProcess* aProcess,
    G4ProcessVectorDoItIndex idDoIt
);
```

Sets a process to be executed last in its category.

**Parameters**:
- `aProcess`: Pointer to the process
- `idDoIt`: Process category

**Location**: `source/processes/management/include/G4ProcessManager.hh:241-248`

**Critical Use Case**: Transportation must always be last in the PostStep category.

**Warning**: If called for multiple processes, the last one called will precede others.

**Example**:
```cpp
// Transportation must always be last in PostStep
pManager->SetProcessOrderingToLast(transportation, idxPostStep);
```

## Process Removal and Activation Methods

### RemoveProcess (by pointer)

```cpp
G4VProcess* RemoveProcess(G4VProcess* aProcess);
```

Removes a process from the process manager.

**Parameters**:
- `aProcess`: Pointer to the process to remove

**Returns**: Pointer to the removed process, or nullptr on error

**Location**: `source/processes/management/include/G4ProcessManager.hh:252-253`

**Effect**: The process is removed from all vectors (master list and category vectors).

**Note**: The process object itself is not deleted; only removed from management.

### RemoveProcess (by index)

```cpp
G4VProcess* RemoveProcess(G4int index);
```

Removes a process by its index in the process list.

**Parameters**:
- `index`: Index in the master process list

**Returns**: Pointer to the removed process, or nullptr on error

**Location**: `source/processes/management/include/G4ProcessManager.hh:253`

### SetProcessActivation (by pointer)

```cpp
G4VProcess* SetProcessActivation(G4VProcess* aProcess, G4bool fActive);
```

Activates or deactivates a process.

**Parameters**:
- `aProcess`: Pointer to the process
- `fActive`: True to activate, false to deactivate

**Returns**: Pointer to the process, or nullptr on error

**Location**: `source/processes/management/include/G4ProcessManager.hh:258-259`

**Usage**: Temporarily disable a process without removing it. More efficient than removal and re-addition.

**Example**:
```cpp
// Deactivate Compton scattering
pManager->SetProcessActivation(comptonProcess, false);

// Later, reactivate it
pManager->SetProcessActivation(comptonProcess, true);
```

### SetProcessActivation (by index)

```cpp
G4VProcess* SetProcessActivation(G4int index, G4bool fActive);
```

Activates or deactivates a process by index.

**Parameters**:
- `index`: Index in the master process list
- `fActive`: True to activate, false to deactivate

**Returns**: Pointer to the process, or nullptr on error

**Location**: `source/processes/management/include/G4ProcessManager.hh:259`

### GetProcessActivation (by pointer)

```cpp
G4bool GetProcessActivation(G4VProcess* aProcess) const;
```

Checks if a process is currently active.

**Parameters**:
- `aProcess`: Pointer to the process

**Returns**: True if active, false if inactive

**Location**: `source/processes/management/include/G4ProcessManager.hh:264`

### GetProcessActivation (by index)

```cpp
G4bool GetProcessActivation(G4int index) const;
```

Checks if a process is active by index.

**Parameters**:
- `index`: Index in the master process list

**Returns**: True if active, false if inactive

**Location**: `source/processes/management/include/G4ProcessManager.hh:265`

## Particle Type Methods

### GetParticleType

```cpp
inline G4ParticleDefinition* GetParticleType() const;
```

Returns the particle definition this process manager belongs to.

**Returns**: Pointer to the G4ParticleDefinition

**Location**: `source/processes/management/include/G4ProcessManager.hh:268-269`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:169-172`

### SetParticleType

```cpp
inline void SetParticleType(const G4ParticleDefinition* aParticleType);
```

Sets the particle type for this process manager.

**Parameters**:
- `aParticleType`: Pointer to the particle definition

**Location**: `source/processes/management/include/G4ProcessManager.hh:270-271`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:32-35`

**Warning**: Rarely needed; particle type is set during construction. Changing it after processes are added may cause inconsistencies.

## Process Query Methods

### GetProcess

```cpp
G4VProcess* GetProcess(const G4String& processName) const;
```

Retrieves a process by its name.

**Parameters**:
- `processName`: Name of the process to find

**Returns**: Pointer to the process, or nullptr if not found

**Location**: `source/processes/management/include/G4ProcessManager.hh:273-274`

**Example**:
```cpp
G4VProcess* msc = pManager->GetProcess("msc");
if (msc != nullptr) {
  G4cout << "Multiple scattering is registered" << G4endl;
}
```

## Tracking Lifecycle Methods

### StartTracking

```cpp
void StartTracking(G4Track* aTrack = nullptr);
```

Called by G4TrackingManager at the start of tracking for each track.

**Parameters**:
- `aTrack`: Pointer to the track being started (default: nullptr)

**Location**: `source/processes/management/include/G4ProcessManager.hh:276-279`

**Effect**: Calls StartTracking() on all registered processes, allowing them to initialize track-specific data.

**Note**: This is an internal method; users should not call it directly.

### EndTracking

```cpp
void EndTracking();
```

Called by G4TrackingManager at the end of tracking for each track.

**Location**: `source/processes/management/include/G4ProcessManager.hh:277`

**Effect**: Calls EndTracking() on all registered processes, allowing them to clean up track-specific data.

**Note**: This is an internal method; users should not call it directly.

## Diagnostic Methods

### DumpInfo

```cpp
void DumpInfo();
```

Prints detailed information about all registered processes and their configuration.

**Location**: `source/processes/management/include/G4ProcessManager.hh:282`

**Output**: Lists all processes with their ordering in each category.

**Example**:
```cpp
G4ProcessManager* pManager = G4Electron::Definition()->GetProcessManager();
pManager->DumpInfo();
```

### SetVerboseLevel

```cpp
inline void SetVerboseLevel(G4int value);
```

Sets the verbosity level for diagnostic output.

**Parameters**:
- `value`: Verbosity level (0 = silent, 1 = warnings, 2 = detailed)

**Location**: `source/processes/management/include/G4ProcessManager.hh:284-285`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:175-178`

### GetVerboseLevel

```cpp
inline G4int GetVerboseLevel() const;
```

Returns the current verbosity level.

**Returns**: Current verbosity value (0-2)

**Location**: `source/processes/management/include/G4ProcessManager.hh:285-289`

**Implementation**: `source/processes/management/include/G4ProcessManager.icc:181-184`

## Constants

### SizeOfProcVectorArray

```cpp
enum { SizeOfProcVectorArray = 6 };
```

Total number of internal process vectors.

**Value**: 6 (3 categories × 2 types each)

**Location**: `source/processes/management/include/G4ProcessManager.hh:291`

**Breakdown**:
- AtRest GPIL (index 0)
- AtRest DoIt (index 1)
- AlongStep GPIL (index 2)
- AlongStep DoIt (index 3)
- PostStep GPIL (index 4)
- PostStep DoIt (index 5)

## Understanding the Process Ordering System

### Ordering Parameter Fundamentals

The ordering parameter determines the sequence in which processes are invoked within each category. Understanding this system is crucial for building correct physics lists:

**Basic Rules**:
1. **Lower values execute first**: A process with ordering 1 runs before ordering 2
2. **Negative values mean inactive**: Use -1 (ordInActive) to disable a category
3. **Same ordering uses registration order**: Processes added earlier execute first
4. **Special values have meaning**:
   - `ordInActive` (-1): Process not active in this category
   - `ordDefault` (1000): Default middle-range ordering
   - `ordLast` (9999): Guaranteed to execute last

### Why Ordering Matters

**AlongStep Processes**: Order affects how energy loss and scattering combine:
```cpp
// Typical AlongStep ordering for charged particles
pManager->AddProcess(multipleScattering, -1, 1, 1);  // First
pManager->AddProcess(ionization,         -1, 2, 2);  // Second
pManager->AddProcess(bremsstrahlung,     -1, 3, 3);  // Third
```

**PostStep Processes**: Order determines which interaction is selected:
```cpp
// Transportation MUST be last
pManager->AddProcess(photoelectric, -1, -1, 1);
pManager->AddProcess(compton,       -1, -1, 2);
pManager->AddProcess(conversion,    -1, -1, 3);
pManager->AddProcess(transportation, -1, -1, ordLast);  // Always last
```

### The Three Process Vectors Explained

#### AtRest Processes

**When Used**: Particle has zero kinetic energy

**Typical Processes**:
- Particle decay (e.g., muon → electron + neutrinos)
- Capture at rest (e.g., muon nuclear capture)
- Annihilation at rest (e.g., positron annihilation)

**Key Behavior**: Only ONE AtRest process is selected based on which returns the shortest mean lifetime.

**Example**:
```cpp
// Muon at rest can decay or be captured
pManager->AddRestProcess(new G4Decay());
pManager->AddRestProcess(new G4MuonMinusCaptureAtRest());
// The process with shorter lifetime will be selected
```

#### AlongStep Processes

**When Used**: Continuously throughout the step

**Typical Processes**:
- Ionization energy loss
- Bremsstrahlung energy loss
- Multiple scattering
- Cherenkov radiation
- Transition radiation

**Key Behavior**: ALL active AlongStep processes are invoked in order. Each contributes to the step limit and modifies the track.

**Example**:
```cpp
// All these processes act during the step
pManager->AddProcess(msc,      -1, 1, 1);  // Deflects trajectory
pManager->AddProcess(ioni,     -1, 2, 2);  // Loses energy
pManager->AddProcess(brem,     -1, 3, 3);  // Loses energy, creates photon
pManager->AddProcess(cerenkov, -1, 4, -1); // Creates optical photons
```

#### PostStep Processes

**When Used**: At the end of the step

**Typical Processes**:
- Discrete electromagnetic interactions (photoelectric, Compton, pair production)
- Hadronic interactions
- Decay in flight
- Boundary processes
- Transportation (special - always last)

**Key Behavior**: Only ONE PostStep process is selected based on which returns the shortest interaction length. Transportation is special and must always be last.

**Example**:
```cpp
// One of these will be selected based on interaction length
pManager->AddDiscreteProcess(new G4PhotoElectricEffect());
pManager->AddDiscreteProcess(new G4ComptonScattering());
pManager->AddDiscreteProcess(new G4GammaConversion());

// Transportation must be last to handle geometry boundaries
pManager->AddProcess(new G4Transportation(), -1, -1, ordLast);
```

## Usage Examples

### Example 1: Building an Electron Physics List

```cpp
void AddElectronProcesses() {
  G4ParticleDefinition* particle = G4Electron::Electron();
  G4ProcessManager* pManager = particle->GetProcessManager();

  // Multiple scattering (AlongStep + PostStep)
  G4MultipleScattering* msc = new G4MultipleScattering();
  pManager->AddProcess(msc, -1, 1, 1);

  // Ionization (AlongStep + PostStep)
  G4eIonisation* ioni = new G4eIonisation();
  pManager->AddProcess(ioni, -1, 2, 2);

  // Bremsstrahlung (AlongStep + PostStep)
  G4eBremsstrahlung* brem = new G4eBremsstrahlung();
  pManager->AddProcess(brem, -1, 3, 3);

  // Transportation (PostStep only, must be last)
  G4Transportation* trans = new G4Transportation();
  pManager->AddProcess(trans, -1, -1, ordLast);
}
```

### Example 2: Building a Photon Physics List

```cpp
void AddPhotonProcesses() {
  G4ParticleDefinition* particle = G4Gamma::Gamma();
  G4ProcessManager* pManager = particle->GetProcessManager();

  // Photoelectric effect (discrete PostStep)
  pManager->AddDiscreteProcess(new G4PhotoElectricEffect());

  // Compton scattering (discrete PostStep)
  pManager->AddDiscreteProcess(new G4ComptonScattering());

  // Pair production (discrete PostStep)
  pManager->AddDiscreteProcess(new G4GammaConversion());

  // Rayleigh scattering (discrete PostStep)
  pManager->AddDiscreteProcess(new G4RayleighScattering());

  // Transportation (must be last)
  pManager->AddProcess(new G4Transportation(), -1, -1, ordLast);
}
```

### Example 3: Adding Decay to All Particles

```cpp
void AddDecayProcess() {
  G4Decay* decayProcess = new G4Decay();

  auto particleIterator = G4ParticleTable::GetParticleTable()->GetIterator();
  particleIterator->reset();

  while ((*particleIterator)()) {
    G4ParticleDefinition* particle = particleIterator->value();
    G4ProcessManager* pManager = particle->GetProcessManager();

    if (pManager && particle->GetPDGLifeTime() > 0.0) {
      // Add decay as AtRest and PostStep (for decay in flight)
      pManager->AddProcess(decayProcess,
                           ordDefault,  // AtRest
                           -1,          // Not AlongStep
                           ordDefault); // PostStep
    }
  }
}
```

### Example 4: Modifying Process Ordering After Registration

```cpp
void CustomizeElectronPhysics() {
  G4ProcessManager* pManager = G4Electron::Definition()->GetProcessManager();

  // Find the bremsstrahlung process
  G4VProcess* brem = pManager->GetProcess("eBrem");

  if (brem != nullptr) {
    // Change its ordering to be before ionization in AlongStep
    pManager->SetProcessOrdering(brem, idxAlongStep, 1);
    pManager->SetProcessOrdering(brem, idxPostStep, 1);

    // Update ionization ordering
    G4VProcess* ioni = pManager->GetProcess("eIoni");
    if (ioni != nullptr) {
      pManager->SetProcessOrdering(ioni, idxAlongStep, 2);
      pManager->SetProcessOrdering(ioni, idxPostStep, 2);
    }
  }
}
```

### Example 5: Temporarily Deactivating Processes

```cpp
void DeactivateBremsstrahlung() {
  auto particleIterator = G4ParticleTable::GetParticleTable()->GetIterator();
  particleIterator->reset();

  while ((*particleIterator)()) {
    G4ParticleDefinition* particle = particleIterator->value();
    G4ProcessManager* pManager = particle->GetProcessManager();

    if (pManager) {
      G4VProcess* brem = pManager->GetProcess("eBrem");
      if (brem != nullptr) {
        // Deactivate without removing
        pManager->SetProcessActivation(brem, false);
        G4cout << "Deactivated bremsstrahlung for "
               << particle->GetParticleName() << G4endl;
      }
    }
  }
}
```

### Example 6: Diagnostic - Listing All Processes for a Particle

```cpp
void ListProcesses(const G4String& particleName) {
  G4ParticleDefinition* particle =
      G4ParticleTable::GetParticleTable()->FindParticle(particleName);

  if (particle == nullptr) {
    G4cout << "Particle " << particleName << " not found!" << G4endl;
    return;
  }

  G4ProcessManager* pManager = particle->GetProcessManager();
  if (pManager == nullptr) {
    G4cout << "No process manager for " << particleName << G4endl;
    return;
  }

  G4cout << "\nProcesses for " << particleName << ":" << G4endl;
  G4cout << "Total processes: " << pManager->GetProcessListLength() << G4endl;

  G4ProcessVector* processList = pManager->GetProcessList();
  for (G4int i = 0; i < processList->size(); ++i) {
    G4VProcess* process = (*processList)[i];
    G4cout << "  [" << i << "] " << process->GetProcessName();

    // Check which categories are active
    G4int atRestIdx = pManager->GetAtRestIndex(process);
    G4int alongStepIdx = pManager->GetAlongStepIndex(process);
    G4int postStepIdx = pManager->GetPostStepIndex(process);

    G4cout << " (AtRest:" << atRestIdx
           << ", AlongStep:" << alongStepIdx
           << ", PostStep:" << postStepIdx << ")" << G4endl;
  }
}
```

## Best Practices for Physics List Development

### 1. Always Add Transportation Last

Transportation handles geometry boundaries and must be the last PostStep process:

```cpp
// CORRECT
pManager->AddProcess(transportation, -1, -1, ordLast);

// WRONG - will cause tracking errors
pManager->AddDiscreteProcess(transportation);
```

### 2. Use Standard Ordering for Electromagnetic Processes

Follow this proven sequence for charged particles:

```cpp
// AlongStep ordering
1. Multiple scattering
2. Ionization
3. Bremsstrahlung (if applicable)
4. Other energy loss processes

// PostStep ordering (same as AlongStep for consistency)
```

### 3. Don't Mix Add Methods Inappropriately

Be consistent with process types:

```cpp
// CORRECT - discrete process added as discrete
pManager->AddDiscreteProcess(new G4ComptonScattering());

// WRONG - using AddProcess with wrong categories
pManager->AddProcess(new G4ComptonScattering(), -1, 5, -1); // AlongStep wrong!
```

### 4. Check Process Registration Success

Always verify processes were added successfully:

```cpp
G4int index = pManager->AddProcess(myProcess, -1, 1, 1);
if (index < 0) {
  G4Exception("MyPhysicsList::ConstructProcess()",
              "EM0001", FatalException,
              "Failed to add process!");
}
```

### 5. Use Process Activation Instead of Removal

For temporary changes, activation is more efficient:

```cpp
// GOOD - can easily reactivate
pManager->SetProcessActivation(process, false);
// ... later ...
pManager->SetProcessActivation(process, true);

// LESS EFFICIENT - need to re-add and re-configure
G4VProcess* proc = pManager->RemoveProcess(process);
// ... later ...
pManager->AddProcess(proc, order1, order2, order3);
```

### 6. Verify Process Configuration with DumpInfo

During development, use DumpInfo to verify your configuration:

```cpp
void MyPhysicsList::ConstructProcess() {
  // ... add all processes ...

  #ifdef G4VERBOSE
  if (verboseLevel > 1) {
    G4cout << "\n=== Electron Process Configuration ===" << G4endl;
    G4Electron::Definition()->GetProcessManager()->DumpInfo();
  }
  #endif
}
```

### 7. Handle Process Ordering Modifications Carefully

When modifying ordering after initial registration:

```cpp
// Get current ordering first
G4int currentOrdering = pManager->GetProcessOrdering(process, idxAlongStep);

// Make informed decision
if (currentOrdering > 5) {
  pManager->SetProcessOrdering(process, idxAlongStep, 3);
}
```

### 8. Use Appropriate Convenience Methods

Leverage the simplified methods when appropriate:

```cpp
// GOOD - clear intent
pManager->AddDiscreteProcess(new G4PhotoElectricEffect());

// UNNECESSARY COMPLEXITY - same result but less clear
pManager->AddProcess(new G4PhotoElectricEffect(), -1, -1, ordDefault);
```

### 9. Document Custom Ordering Choices

Always comment non-standard ordering:

```cpp
// Custom ordering: Bremsstrahlung before ionization
// Reason: Testing energy loss sequence dependence
pManager->AddProcess(brem, -1, 1, 1);  // First
pManager->AddProcess(ioni, -1, 2, 2);  // Second (non-standard)
```

### 10. Test Process Manager State Before Modifications

Ensure the process manager is in a valid state:

```cpp
if (pManager == nullptr) {
  G4Exception("MyPhysicsList", "PHYS001", FatalException,
              "Process manager is null!");
  return;
}

if (pManager->GetProcessListLength() == 0) {
  G4cout << "Warning: No processes registered yet" << G4endl;
}
```

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Transportation Not Last

**Problem**: Transportation added with wrong ordering

**Symptom**: Particles escape volumes or tracking errors

**Solution**:
```cpp
// Always use ordLast for transportation
pManager->AddProcess(new G4Transportation(), -1, -1, ordLast);
```

### Pitfall 2: Confusing Process Categories

**Problem**: Adding AlongStep process as discrete or vice versa

**Symptom**: Process never invoked or incorrect physics

**Solution**: Understand process types and use appropriate methods
```cpp
// G4eIonisation is AlongStep + PostStep
pManager->AddProcess(ioni, -1, 1, 1);  // CORRECT

// NOT this:
pManager->AddDiscreteProcess(ioni);  // WRONG - misses AlongStep!
```

### Pitfall 3: Forgetting to Add Process to Master List

**Problem**: Using SetProcessOrdering before AddProcess

**Symptom**: Process not found errors

**Solution**: Always AddProcess first:
```cpp
// CORRECT order
pManager->AddProcess(myProcess, -1, -1, 5);
pManager->SetProcessOrdering(myProcess, idxPostStep, 3);

// WRONG order
pManager->SetProcessOrdering(myProcess, idxPostStep, 3);  // ERROR!
pManager->AddProcess(myProcess, -1, -1, 5);
```

### Pitfall 4: Shared Process Objects Between Particles

**Problem**: Reusing same process instance for multiple particles

**Symptom**: Process state corruption, wrong cross sections

**Solution**: Create separate instances or verify process supports sharing:
```cpp
// WRONG
G4VProcess* decay = new G4Decay();
electronManager->AddRestProcess(decay);
muonManager->AddRestProcess(decay);  // Same instance!

// CORRECT
electronManager->AddRestProcess(new G4Decay());
muonManager->AddRestProcess(new G4Decay());  // Separate instances
```

## Data Members

### Process Vectors

```cpp
G4ProcessVector* theProcVector[SizeOfProcVectorArray];
```

Array of six process vectors for GPIL and DoIt methods.

**Location**: `source/processes/management/include/G4ProcessManager.hh:325-326`

**Array Layout**:
- `theProcVector[0]`: AtRest GPIL
- `theProcVector[1]`: AtRest DoIt
- `theProcVector[2]`: AlongStep GPIL
- `theProcVector[3]`: AlongStep DoIt
- `theProcVector[4]`: PostStep GPIL
- `theProcVector[5]`: PostStep DoIt

### Process Attributes

```cpp
G4ProcessAttrVector* theAttrVector;
```

Vector storing process attributes (ordering, activation status, etc.).

**Location**: `source/processes/management/include/G4ProcessManager.hh:328-329`

### Particle Association

```cpp
const G4ParticleDefinition* theParticleType;
```

Pointer to the particle definition this manager belongs to.

**Location**: `source/processes/management/include/G4ProcessManager.hh:331-332`

### Process List

```cpp
G4ProcessVector* theProcessList;
G4int numberOfProcesses;
```

Master list of all processes and count.

**Location**: `source/processes/management/include/G4ProcessManager.hh:334-336`

### State Flags

```cpp
G4bool duringTracking;
G4bool isSetOrderingFirstInvoked[NDoit];
G4bool isSetOrderingLastInvoked[NDoit];
```

Internal state tracking for tracking status and ordering methods.

**Location**: `source/processes/management/include/G4ProcessManager.hh:338-341`

### Verbosity

```cpp
G4int verboseLevel;
```

Controls diagnostic output (0 = silent, 1 = warnings, 2 = detailed).

**Location**: `source/processes/management/include/G4ProcessManager.hh:343`

## See Also

- [G4VProcess](./g4vprocess.md) - Base class for all physics processes
- [G4ProcessVector](./g4processvector.md) - Vector container for processes
- [G4ProcessAttribute](./g4processattribute.md) - Process metadata and attributes
- [G4ParticleDefinition](../particles/api/g4particledefinition.md) - Particle definitions that own process managers
- [G4Transportation](./g4transportation.md) - Special process for geometry navigation
- [Physics List Guide](../guides/physics-lists.md) - Comprehensive guide to building physics lists
- [Process Categories](../guides/process-categories.md) - Understanding AtRest, AlongStep, and PostStep
