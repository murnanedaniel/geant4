# G4ProcessTable

**File**: `source/processes/management/include/G4ProcessTable.hh`

## Overview

G4ProcessTable is a global registry that maintains comprehensive bookkeeping of all physics processes registered across all particle types in a Geant4 simulation. Implemented as a thread-local singleton, it provides centralized access to query, activate, deactivate, and manage processes throughout the simulation lifecycle.

## Class Description

G4ProcessTable serves as the central repository for tracking the association between physics processes (G4VProcess) and particle process managers (G4ProcessManager). Each process may be registered with multiple process managers, representing its application to different particle types. The table enables:

- **Global process lookup**: Find processes by name, type, subtype, or particle
- **Process activation control**: Enable or disable processes globally or per-particle
- **Process-particle associations**: Track which processes apply to which particles
- **Process lifecycle management**: Register and deregister process instances

**Key Features**:
- Thread-local singleton pattern for thread safety
- Bidirectional mapping between processes and particle process managers
- Support for global and particle-specific process control
- Comprehensive query interface for process discovery

**Location**: `source/processes/management/include/G4ProcessTable.hh:48`

## Design Pattern: Thread-Local Singleton

G4ProcessTable uses the thread-local singleton pattern to ensure each thread has its own process table instance while maintaining a single global access point per thread.

```cpp
// Accessing the singleton instance
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();
```

**Thread Safety**: Each worker thread in multi-threaded mode has its own process table, preventing race conditions during process registration and lookup.

## Type Definitions

### G4ProcTableVector

```cpp
using G4ProcTableVector = std::vector<G4ProcTblElement*>;
```

Vector of process table elements, where each element represents a process and its associated process managers.

**Location**: `source/processes/management/include/G4ProcessTable.hh:54`

### G4ProcNameVector

```cpp
using G4ProcNameVector = std::vector<G4String>;
```

Vector of process names for quick name-based lookups.

**Location**: `source/processes/management/include/G4ProcessTable.hh:55`

## Constructor & Destructor

### Constructor (Private)

```cpp
G4ProcessTable();
```

Private default constructor enforcing singleton pattern.

**Location**: `source/processes/management/include/G4ProcessTable.hh:145`

**Note**: Cannot be called directly. Use GetProcessTable() to obtain the singleton instance.

### Destructor

```cpp
~G4ProcessTable();
```

Destroys the process table and cleans up all registered process instances.

**Location**: `source/processes/management/include/G4ProcessTable.hh:57`

**Behavior**:
- Deletes all G4ProcTblElement objects
- Deletes all process instances except transportation, parallel, and parameterisation processes
- Clears internal vectors and temporary buffers

**Note**: Automatically called at end of thread execution. Users should not delete the process table manually.

### Deleted Copy Operations

```cpp
G4ProcessTable(const G4ProcessTable&) = delete;
G4ProcessTable& operator=(const G4ProcessTable&) = delete;
G4bool operator==(const G4ProcessTable &right) const = delete;
G4bool operator!=(const G4ProcessTable &right) const = delete;
```

Copy construction, assignment, and comparison operators are explicitly disabled.

**Location**: `source/processes/management/include/G4ProcessTable.hh:60-63`

## Singleton Access

### GetProcessTable

```cpp
static G4ProcessTable* GetProcessTable();
```

Returns the thread-local singleton instance of the process table.

**Returns**: Pointer to the G4ProcessTable instance for the current thread

**Location**: `source/processes/management/include/G4ProcessTable.hh:66`

**Usage Example**:
```cpp
// Get the singleton instance
G4ProcessTable* theTable = G4ProcessTable::GetProcessTable();

// Use the table to find a process
G4VProcess* compton = theTable->FindProcess("compt", "gamma");
```

**Thread Safety**: Returns different instances for different threads in multi-threaded mode.

## Table Information Methods

### Length

```cpp
inline G4int Length() const;
```

Returns the number of unique processes registered in the table.

**Returns**: Number of process table elements (unique processes)

**Location**: `source/processes/management/include/G4ProcessTable.hh:70`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:50`

**Usage Example**:
```cpp
G4ProcessTable* theTable = G4ProcessTable::GetProcessTable();
G4cout << "Total processes registered: " << theTable->Length() << G4endl;
```

**Note**: Each process appears once regardless of how many particles use it.

## Process Registration Methods

### Insert

```cpp
G4int Insert(G4VProcess* aProcess, G4ProcessManager* aProcMgr);
```

Registers a process with a process manager, creating or updating the process table entry.

**Parameters**:
- `aProcess`: Pointer to the process to register
- `aProcMgr`: Pointer to the process manager using this process

**Returns**:
- Index in the process table where the process is stored
- -1 if registration failed (null arguments)

**Location**: `source/processes/management/include/G4ProcessTable.hh:73`

**Behavior**:
- If process already exists: adds the process manager to the existing entry (if not already present)
- If process is new: creates a new table element and adds both process and process manager
- Automatically updates the process name vector

**Usage Example**:
```cpp
// Typically called automatically by G4ProcessManager::AddProcess()
G4VProcess* myProcess = new MyCustomProcess();
G4ProcessManager* procMgr = particle->GetProcessManager();
G4ProcessTable* theTable = G4ProcessTable::GetProcessTable();
G4int index = theTable->Insert(myProcess, procMgr);
```

**Note**: Usually called internally by the framework during process manager operations.

### Remove

```cpp
G4int Remove(G4VProcess* aProcess, G4ProcessManager* aProcMgr);
```

Removes a process-manager association from the table.

**Parameters**:
- `aProcess`: Pointer to the process
- `aProcMgr`: Pointer to the process manager to dissociate

**Returns**:
- Index where the process was found
- -1 if not found or removal failed

**Location**: `source/processes/management/include/G4ProcessTable.hh:74`

**Behavior**:
- Removes the process manager from the process's table element
- If no process managers remain, deletes the entire table element
- Does not delete the process object itself

**Usage Example**:
```cpp
// Remove process from a specific particle's process manager
theTable->Remove(myProcess, procMgr);
```

**Note**: Usually called internally when processes are removed from process managers.

### RegisterProcess

```cpp
void RegisterProcess(G4VProcess* ptr);
```

Registers a process instance for lifecycle management and cleanup.

**Parameters**:
- `ptr`: Pointer to the process to register

**Location**: `source/processes/management/include/G4ProcessTable.hh:90`

**Behavior**:
- Adds process to internal registry for later deletion
- Prevents duplicate registrations
- Processes registered here will be deleted when the table is destroyed (except transportation, parallel, and parameterisation processes)

**Usage Example**:
```cpp
G4VProcess* myProcess = new MyCustomProcess();
G4ProcessTable::GetProcessTable()->RegisterProcess(myProcess);
```

**Note**: Should be called for dynamically allocated processes to ensure proper cleanup.

### DeRegisterProcess

```cpp
void DeRegisterProcess(G4VProcess* ptr);
```

Removes a process from the lifecycle management registry.

**Parameters**:
- `ptr`: Pointer to the process to deregister

**Location**: `source/processes/management/include/G4ProcessTable.hh:91`

**Behavior**:
- Removes process from deletion list
- Sets the entry to nullptr but doesn't shrink the vector
- Process will not be deleted when table is destroyed

**Usage Example**:
```cpp
// Take ownership of process lifetime management
theTable->DeRegisterProcess(myProcess);
delete myProcess; // Now user is responsible for deletion
```

## Process Lookup Methods

### FindProcess (by name and particle name)

```cpp
G4VProcess* FindProcess(const G4String& processName,
                        const G4String& particleName) const;
```

Finds a process by its name for a specific particle (specified by name).

**Parameters**:
- `processName`: Name of the process (e.g., "compt", "eIoni")
- `particleName`: Name of the particle (e.g., "gamma", "e-")

**Returns**:
- Pointer to the process if found
- nullptr if not found

**Location**: `source/processes/management/include/G4ProcessTable.hh:78`

**Usage Example**:
```cpp
// Find Compton scattering for gamma
G4VProcess* compton = theTable->FindProcess("compt", "gamma");
if (compton) {
    G4cout << "Found: " << compton->GetProcessName() << G4endl;
}

// Find ionization for electrons
G4VProcess* eIoni = theTable->FindProcess("eIoni", "e-");
```

**Note**: Returns nullptr with verbose warning (verboseLevel > 1) if process not found for that particle.

### FindProcess (by name and particle definition)

```cpp
inline G4VProcess* FindProcess(const G4String& processName,
                               const G4ParticleDefinition* particle) const;
```

Finds a process by its name for a specific particle (specified by pointer).

**Parameters**:
- `processName`: Name of the process
- `particle`: Pointer to the particle definition

**Returns**:
- Pointer to the process if found
- nullptr if not found or particle is null

**Location**: `source/processes/management/include/G4ProcessTable.hh:80`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:74`

**Usage Example**:
```cpp
G4ParticleDefinition* gamma = G4Gamma::GammaDefinition();
G4VProcess* photoElectric = theTable->FindProcess("phot", gamma);
```

### FindProcess (by name and process manager)

```cpp
G4VProcess* FindProcess(const G4String& processName,
                        const G4ProcessManager* processManager) const;
```

Finds a process by its name within a specific process manager.

**Parameters**:
- `processName`: Name of the process
- `processManager`: Pointer to the process manager

**Returns**:
- Pointer to the process if found in that process manager
- nullptr if not found

**Location**: `source/processes/management/include/G4ProcessTable.hh:82`

**Usage Example**:
```cpp
G4ProcessManager* procMgr = particle->GetProcessManager();
G4VProcess* proc = theTable->FindProcess("msc", procMgr);
```

**Note**: More efficient than name-based lookup if you already have the process manager.

### FindProcess (by type and particle)

```cpp
G4VProcess* FindProcess(G4ProcessType processType,
                        const G4ParticleDefinition* particle) const;
```

Finds the first process of a given type for a specific particle.

**Parameters**:
- `processType`: Type of process (e.g., fElectromagnetic, fHadronic)
- `particle`: Pointer to the particle definition

**Returns**:
- Pointer to the first process of that type
- nullptr if no process of that type exists for the particle

**Location**: `source/processes/management/include/G4ProcessTable.hh:84`

**Usage Example**:
```cpp
// Find first electromagnetic process for electrons
G4ParticleDefinition* electron = G4Electron::ElectronDefinition();
G4VProcess* emProcess = theTable->FindProcess(fElectromagnetic, electron);

// Find first hadronic process for protons
G4ParticleDefinition* proton = G4Proton::ProtonDefinition();
G4VProcess* hadProcess = theTable->FindProcess(fHadronic, proton);
```

**Note**: Returns only the first matching process. Use FindProcesses() to get all processes of a type.

### FindProcess (by subtype and particle)

```cpp
G4VProcess* FindProcess(G4int processSubType,
                        const G4ParticleDefinition* particle) const;
```

Finds the first process with a specific subtype for a particle.

**Parameters**:
- `processSubType`: Process subtype integer identifier
- `particle`: Pointer to the particle definition

**Returns**:
- Pointer to the first process with that subtype
- nullptr if not found

**Location**: `source/processes/management/include/G4ProcessTable.hh:86`

**Usage Example**:
```cpp
// Find Compton scattering by subtype
G4ParticleDefinition* gamma = G4Gamma::GammaDefinition();
G4VProcess* compton = theTable->FindProcess(fComptonScattering, gamma);

// Find Bremsstrahlung by subtype
G4ParticleDefinition* electron = G4Electron::ElectronDefinition();
G4VProcess* brem = theTable->FindProcess(fBremsstrahlung, electron);
```

**Note**: Subtypes are defined in `G4ProcessType.hh` and specific process headers.

## Process Collection Methods

### FindProcesses (all processes)

```cpp
inline G4ProcessVector* FindProcesses();
```

Returns a vector containing all processes in the table.

**Returns**: New G4ProcessVector containing pointers to all registered processes

**Location**: `source/processes/management/include/G4ProcessTable.hh:94`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:111`

**Usage Example**:
```cpp
G4ProcessVector* allProcesses = theTable->FindProcesses();
G4cout << "Total processes: " << allProcesses->size() << G4endl;
for (size_t i = 0; i < allProcesses->size(); ++i) {
    G4cout << "  " << (*allProcesses)[i]->GetProcessName() << G4endl;
}
delete allProcesses; // User must delete the vector
```

**Important**: The returned vector is dynamically allocated. User is responsible for deletion.

### FindProcesses (by process manager)

```cpp
inline G4ProcessVector* FindProcesses(const G4ProcessManager* pManager);
```

Returns a vector containing all processes managed by a specific process manager.

**Parameters**:
- `pManager`: Pointer to the process manager

**Returns**: New G4ProcessVector containing copies of processes for that particle

**Location**: `source/processes/management/include/G4ProcessTable.hh:95`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:119`

**Usage Example**:
```cpp
G4ParticleDefinition* gamma = G4Gamma::GammaDefinition();
G4ProcessManager* procMgr = gamma->GetProcessManager();
G4ProcessVector* gammaProcesses = theTable->FindProcesses(procMgr);

G4cout << "Processes for gamma:" << G4endl;
for (size_t i = 0; i < gammaProcesses->size(); ++i) {
    G4cout << "  " << (*gammaProcesses)[i]->GetProcessName() << G4endl;
}
delete gammaProcesses;
```

**Important**: Returns a new vector that must be deleted by the user.

### FindProcesses (by name)

```cpp
inline G4ProcessVector* FindProcesses(const G4String& processName);
```

Returns a vector containing all instances of processes with the given name.

**Parameters**:
- `processName`: Name of the process to search for

**Returns**: New G4ProcessVector containing all processes with that name

**Location**: `source/processes/management/include/G4ProcessTable.hh:96`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:129`

**Usage Example**:
```cpp
// Find all ionization processes
G4ProcessVector* ionizationProcs = theTable->FindProcesses("ionIoni");
G4cout << "Found " << ionizationProcs->size()
       << " ionization processes" << G4endl;
delete ionizationProcs;
```

**Note**: Typically returns one process, but could return multiple if processes share names.

**Important**: Returns a new vector that must be deleted by the user.

### FindProcesses (by type)

```cpp
inline G4ProcessVector* FindProcesses(G4ProcessType processType);
```

Returns a vector containing all processes of the specified type.

**Parameters**:
- `processType`: Type of process to search for

**Returns**: New G4ProcessVector containing all processes of that type

**Location**: `source/processes/management/include/G4ProcessTable.hh:97`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:138`

**Usage Example**:
```cpp
// Find all electromagnetic processes
G4ProcessVector* emProcs = theTable->FindProcesses(fElectromagnetic);
G4cout << "Electromagnetic processes:" << G4endl;
for (size_t i = 0; i < emProcs->size(); ++i) {
    G4cout << "  " << (*emProcs)[i]->GetProcessName() << G4endl;
}
delete emProcs;

// Find all hadronic processes
G4ProcessVector* hadProcs = theTable->FindProcesses(fHadronic);
delete hadProcs;
```

**Important**: Returns a new vector that must be deleted by the user.

## Process Activation Methods

The SetProcessActivation methods allow global or selective enabling/disabling of processes without removing them from process managers. Inactive processes are skipped during simulation stepping.

### SetProcessActivation (by name, global)

```cpp
void SetProcessActivation(const G4String& processName,
                         G4bool fActive);
```

Activates or deactivates a process globally for all particles that use it.

**Parameters**:
- `processName`: Name of the process
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:101`

**Usage Example**:
```cpp
// Disable Compton scattering globally
theTable->SetProcessActivation("compt", false);

// Re-enable it later
theTable->SetProcessActivation("compt", true);

// Disable all bremsstrahlung processes
theTable->SetProcessActivation("eBrem", false);
```

**Effect**: Affects the process for all particles that have it registered.

### SetProcessActivation (by name and particle name)

```cpp
void SetProcessActivation(const G4String& processName,
                         const G4String& particleName,
                         G4bool fActive);
```

Activates or deactivates a process for a specific particle (by name).

**Parameters**:
- `processName`: Name of the process
- `particleName`: Name of the particle (or "ALL" for all particles)
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:103`

**Usage Example**:
```cpp
// Disable ionization only for positrons
theTable->SetProcessActivation("eIoni", "e+", false);

// Disable Compton for all particles (using "ALL")
theTable->SetProcessActivation("compt", "ALL", false);

// Enable photoelectric effect for gammas
theTable->SetProcessActivation("phot", "gamma", true);
```

**Special Value**: Use `particleName = "ALL"` to apply to all particles.

### SetProcessActivation (by name and particle definition)

```cpp
inline void SetProcessActivation(const G4String& processName,
                                const G4ParticleDefinition* particle,
                                G4bool fActive);
```

Activates or deactivates a process for a specific particle (by pointer).

**Parameters**:
- `processName`: Name of the process
- `particle`: Pointer to the particle definition
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:106`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:85`

**Usage Example**:
```cpp
G4ParticleDefinition* electron = G4Electron::ElectronDefinition();
theTable->SetProcessActivation("msc", electron, false);

G4ParticleDefinition* gamma = G4Gamma::GammaDefinition();
theTable->SetProcessActivation("compt", gamma, true);
```

### SetProcessActivation (by name and process manager)

```cpp
void SetProcessActivation(const G4String& processName,
                         G4ProcessManager* processManager,
                         G4bool fActive);
```

Activates or deactivates a process for a specific process manager.

**Parameters**:
- `processName`: Name of the process
- `processManager`: Pointer to the process manager
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:109`

**Usage Example**:
```cpp
G4ProcessManager* procMgr = particle->GetProcessManager();
theTable->SetProcessActivation("msc", procMgr, false);
```

**Note**: Most specific activation method - affects only the specified process manager.

### SetProcessActivation (by type, global)

```cpp
void SetProcessActivation(G4ProcessType processType,
                         G4bool fActive);
```

Activates or deactivates all processes of a specific type globally.

**Parameters**:
- `processType`: Type of processes to activate/deactivate
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:112`

**Usage Example**:
```cpp
// Disable all electromagnetic processes
theTable->SetProcessActivation(fElectromagnetic, false);

// Enable all hadronic processes
theTable->SetProcessActivation(fHadronic, true);

// Disable all optical processes
theTable->SetProcessActivation(fOptical, false);
```

**Effect**: Affects all particles that have processes of this type.

**Warning**: Use with caution - disabling entire process types can significantly alter simulation behavior.

### SetProcessActivation (by type and particle name)

```cpp
void SetProcessActivation(G4ProcessType processType,
                         const G4String& particleName,
                         G4bool fActive);
```

Activates or deactivates all processes of a type for a specific particle (by name).

**Parameters**:
- `processType`: Type of processes
- `particleName`: Name of the particle (or "ALL"/"all" for all particles)
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:114`

**Usage Example**:
```cpp
// Disable all EM processes for electrons only
theTable->SetProcessActivation(fElectromagnetic, "e-", false);

// Disable all hadronic processes for all particles
theTable->SetProcessActivation(fHadronic, "ALL", false);
```

**Special Values**: Use `particleName = "ALL"` or `particleName = "all"` for all particles.

### SetProcessActivation (by type and particle definition)

```cpp
inline void SetProcessActivation(G4ProcessType processType,
                                const G4ParticleDefinition* particle,
                                G4bool fActive);
```

Activates or deactivates all processes of a type for a specific particle (by pointer).

**Parameters**:
- `processType`: Type of processes
- `particle`: Pointer to the particle definition
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:117`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:98`

**Usage Example**:
```cpp
G4ParticleDefinition* proton = G4Proton::ProtonDefinition();
theTable->SetProcessActivation(fHadronic, proton, false);
```

### SetProcessActivation (by type and process manager)

```cpp
void SetProcessActivation(G4ProcessType processType,
                         G4ProcessManager* processManager,
                         G4bool fActive);
```

Activates or deactivates all processes of a type for a specific process manager.

**Parameters**:
- `processType`: Type of processes
- `processManager`: Pointer to the process manager
- `fActive`: true to activate, false to deactivate

**Location**: `source/processes/management/include/G4ProcessTable.hh:120`

**Usage Example**:
```cpp
G4ProcessManager* procMgr = particle->GetProcessManager();
theTable->SetProcessActivation(fElectromagnetic, procMgr, false);
```

## Information Access Methods

### GetNameList

```cpp
inline G4ProcNameVector* GetNameList();
```

Returns a pointer to the internal vector of process names.

**Returns**: Pointer to G4ProcNameVector (vector of G4String)

**Location**: `source/processes/management/include/G4ProcessTable.hh:125`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:58`

**Usage Example**:
```cpp
G4ProcessTable::G4ProcNameVector* names = theTable->GetNameList();
G4cout << "Registered process names:" << G4endl;
for (const auto& name : *names) {
    G4cout << "  " << name << G4endl;
}
// Do NOT delete - this is the internal vector
```

**Warning**: Returns pointer to internal data. Do not delete or modify.

### GetProcTableVector

```cpp
inline G4ProcTableVector* GetProcTableVector();
```

Returns a pointer to the internal vector of process table elements.

**Returns**: Pointer to G4ProcTableVector (vector of G4ProcTblElement*)

**Location**: `source/processes/management/include/G4ProcessTable.hh:128`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:66`

**Usage Example**:
```cpp
G4ProcessTable::G4ProcTableVector* elements = theTable->GetProcTableVector();
for (auto* element : *elements) {
    if (element) {
        G4cout << element->GetProcessName() << G4endl;
    }
}
// Do NOT delete - this is the internal vector
```

**Warning**: Returns pointer to internal data. Do not delete or modify. Advanced use only.

## Diagnostic Methods

### DumpInfo

```cpp
void DumpInfo(G4VProcess* process,
              const G4ParticleDefinition* particle = nullptr);
```

Dumps detailed information about a process and its associations.

**Parameters**:
- `process`: Pointer to the process to dump
- `particle`: Optional pointer to particle (nullptr for all particles using this process)

**Location**: `source/processes/management/include/G4ProcessTable.hh:131`

**Behavior**:
- Calls process->DumpInfo() with current verbose level
- Lists all particles that use this process
- If verboseLevel > 2, also dumps process manager information

**Usage Example**:
```cpp
// Dump info for Compton scattering across all particles
G4VProcess* compton = theTable->FindProcess("compt", "gamma");
if (compton) {
    theTable->DumpInfo(compton);
}

// Dump info for ionization specifically for electrons
G4ParticleDefinition* electron = G4Electron::ElectronDefinition();
G4VProcess* eIoni = theTable->FindProcess("eIoni", electron);
if (eIoni) {
    theTable->DumpInfo(eIoni, electron);
}
```

**Output Level**: Controlled by SetVerboseLevel().

## Verbosity Control

### SetVerboseLevel

```cpp
inline void SetVerboseLevel(G4int value);
```

Sets the verbosity level for process table operations.

**Parameters**:
- `value`: Verbosity level (0 = silent, 1 = warnings, 2+ = detailed info)

**Location**: `source/processes/management/include/G4ProcessTable.hh:136`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:34`

**Usage Example**:
```cpp
// Silent mode
theTable->SetVerboseLevel(0);

// Warning messages only (default)
theTable->SetVerboseLevel(1);

// Detailed operation info
theTable->SetVerboseLevel(2);

// Maximum verbosity
theTable->SetVerboseLevel(3);
```

**Levels**:
- `0`: Silent - no output
- `1`: Warnings only (e.g., process not found)
- `2`: Operation details (insert, remove, activate)
- `3+`: Full debug information

### GetVerboseLevel

```cpp
inline G4int GetVerboseLevel() const;
```

Returns the current verbosity level.

**Returns**: Current verbose level value

**Location**: `source/processes/management/include/G4ProcessTable.hh:137`

**Implementation**: `source/processes/management/include/G4ProcessTable.icc:42`

**Usage Example**:
```cpp
G4int currentLevel = theTable->GetVerboseLevel();
G4cout << "Current verbose level: " << currentLevel << G4endl;
```

## Data Members

### Static Members

```cpp
static G4ThreadLocal G4ProcessTable* fProcessTable;
```

Thread-local pointer to singleton instance.

**Location**: `source/processes/management/include/G4ProcessTable.hh:158`

### Instance Members

```cpp
G4ProcessTableMessenger* fProcTblMessenger = nullptr;
```

UI messenger for interactive process table commands.

**Location**: `source/processes/management/include/G4ProcessTable.hh:159`

```cpp
G4ProcTableVector* fProcTblVector = nullptr;
```

Main storage vector containing G4ProcTblElement objects.

**Location**: `source/processes/management/include/G4ProcessTable.hh:161`

```cpp
G4ProcNameVector* fProcNameVector = nullptr;
```

Parallel vector of process names for quick lookups.

**Location**: `source/processes/management/include/G4ProcessTable.hh:162`

```cpp
G4ProcTableVector* tmpTblVector = nullptr;
```

Temporary buffer for internal search operations.

**Location**: `source/processes/management/include/G4ProcessTable.hh:164`

```cpp
std::vector<G4VProcess*> fListProcesses;
```

Registry of process instances for lifecycle management.

**Location**: `source/processes/management/include/G4ProcessTable.hh:167`

```cpp
G4int verboseLevel = 1;
```

Control flag for output verbosity.

**Location**: `source/processes/management/include/G4ProcessTable.hh:170`

## Usage Examples

### Basic Process Lookup

```cpp
// Get the process table singleton
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();

// Find a specific process by name for a particle
G4VProcess* compton = processTable->FindProcess("compt", "gamma");
if (compton) {
    G4cout << "Found Compton scattering: "
           << compton->GetProcessName() << G4endl;
}

// Find process by type
G4ParticleDefinition* electron = G4Electron::ElectronDefinition();
G4VProcess* firstEM = processTable->FindProcess(fElectromagnetic, electron);
```

### Global Process Deactivation

```cpp
// Disable a specific process globally
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();
processTable->SetProcessActivation("msc", false);

// Disable all electromagnetic processes
processTable->SetProcessActivation(fElectromagnetic, false);

// Later re-enable them
processTable->SetProcessActivation(fElectromagnetic, true);
```

### Selective Process Control

```cpp
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();

// Disable ionization only for positrons
processTable->SetProcessActivation("eIoni", "e+", false);

// Disable all hadronic processes for neutrons
G4ParticleDefinition* neutron = G4Neutron::NeutronDefinition();
processTable->SetProcessActivation(fHadronic, neutron, false);

// Disable Compton scattering for a specific process manager
G4ProcessManager* gammaPM = G4Gamma::GammaDefinition()->GetProcessManager();
processTable->SetProcessActivation("compt", gammaPM, false);
```

### Querying All Processes

```cpp
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();

// Get all processes in the simulation
G4ProcessVector* allProcs = processTable->FindProcesses();
G4cout << "Total number of processes: " << allProcs->size() << G4endl;

for (size_t i = 0; i < allProcs->size(); ++i) {
    G4VProcess* proc = (*allProcs)[i];
    G4cout << "Process " << i << ": " << proc->GetProcessName()
           << " (Type: " << proc->GetProcessType() << ")" << G4endl;
}

delete allProcs; // User must delete returned vector

// Get all electromagnetic processes
G4ProcessVector* emProcs = processTable->FindProcesses(fElectromagnetic);
G4cout << "\nElectromagnetic processes:" << G4endl;
for (size_t i = 0; i < emProcs->size(); ++i) {
    G4cout << "  " << (*emProcs)[i]->GetProcessName() << G4endl;
}
delete emProcs;
```

### Listing Processes for a Particle

```cpp
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();
G4ParticleDefinition* electron = G4Electron::ElectronDefinition();
G4ProcessManager* eProcMgr = electron->GetProcessManager();

// Get all processes for electrons
G4ProcessVector* electronProcs = processTable->FindProcesses(eProcMgr);

G4cout << "Processes for " << electron->GetParticleName() << ":" << G4endl;
for (size_t i = 0; i < electronProcs->size(); ++i) {
    G4VProcess* proc = (*electronProcs)[i];
    G4cout << "  " << proc->GetProcessName()
           << " - Type: " << proc->GetProcessTypeName(proc->GetProcessType())
           << G4endl;
}

delete electronProcs;
```

### Debugging Process Setup

```cpp
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();

// Enable verbose output
processTable->SetVerboseLevel(2);

// Check if a process is registered correctly
G4VProcess* myProcess = processTable->FindProcess("myCustomProcess", "e-");
if (myProcess) {
    G4cout << "Process found and registered" << G4endl;
    processTable->DumpInfo(myProcess);
} else {
    G4cout << "WARNING: Process not found!" << G4endl;
}

// List all registered process names
G4ProcessTable::G4ProcNameVector* names = processTable->GetNameList();
G4cout << "\nAll registered processes:" << G4endl;
for (const auto& name : *names) {
    G4cout << "  " << name << G4endl;
}

G4cout << "\nTotal processes: " << processTable->Length() << G4endl;
```

### Energy Cuts Verification

```cpp
// Verify that expected processes are active
G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();
processTable->SetVerboseLevel(1);

std::vector<G4String> criticalProcesses = {
    "eIoni", "eBrem", "compt", "phot", "msc"
};

for (const auto& procName : criticalProcesses) {
    G4VProcess* proc = processTable->FindProcess(procName, "e-");
    if (proc && proc->isAtRestDoItIsEnabled()) {
        G4cout << procName << " is active" << G4endl;
    } else {
        G4cout << "WARNING: " << procName << " not found or inactive!" << G4endl;
    }
}
```

### Runtime Process Switching

```cpp
// Switch between detailed and fast simulation modes
void SetDetailedSimulation(G4bool detailed) {
    G4ProcessTable* processTable = G4ProcessTable::GetProcessTable();

    if (detailed) {
        // Enable all processes for accurate simulation
        processTable->SetProcessActivation(fElectromagnetic, true);
        processTable->SetProcessActivation(fHadronic, true);
        G4cout << "Detailed simulation mode enabled" << G4endl;
    } else {
        // Disable non-critical processes for speed
        processTable->SetProcessActivation("msc", false);
        processTable->SetProcessActivation("eBrem", false);
        G4cout << "Fast simulation mode enabled" << G4endl;
    }
}
```

## Best Practices

### 1. Always Use the Singleton

```cpp
// CORRECT: Use GetProcessTable()
G4ProcessTable* table = G4ProcessTable::GetProcessTable();

// INCORRECT: Never try to create instances
// G4ProcessTable myTable; // Compilation error - constructor is private
```

### 2. Delete Returned Process Vectors

```cpp
// CORRECT: Delete vectors returned by FindProcesses()
G4ProcessVector* procs = table->FindProcesses(fElectromagnetic);
// ... use procs ...
delete procs;

// INCORRECT: Memory leak
// G4ProcessVector* procs = table->FindProcesses(fElectromagnetic);
// ... use procs but never delete ...
```

### 3. Check for nullptr Returns

```cpp
// CORRECT: Always check before using
G4VProcess* proc = table->FindProcess("myProc", "e-");
if (proc) {
    // Use proc safely
    proc->SetVerboseLevel(2);
} else {
    G4cout << "Process not found" << G4endl;
}

// INCORRECT: Potential null pointer dereference
// G4VProcess* proc = table->FindProcess("myProc", "e-");
// proc->SetVerboseLevel(2); // Crash if proc is nullptr!
```

### 4. Use Appropriate Verbosity

```cpp
// For production: quiet operation
table->SetVerboseLevel(0);

// For debugging: detailed information
table->SetVerboseLevel(2);

// Restore original level
G4int oldLevel = table->GetVerboseLevel();
table->SetVerboseLevel(3);
// ... debug operations ...
table->SetVerboseLevel(oldLevel);
```

### 5. Be Careful with Global Deactivation

```cpp
// RISKY: Affects all particles
table->SetProcessActivation("Transportation", false); // Don't do this!

// SAFER: Target specific particles or process managers
table->SetProcessActivation("msc", "e-", false);
```

### 6. Register Processes for Automatic Cleanup

```cpp
// CORRECT: Register processes that should be auto-deleted
G4VProcess* myProc = new MyCustomProcess();
G4ProcessTable::GetProcessTable()->RegisterProcess(myProc);
// Process will be deleted automatically at end of run

// If you manage lifetime yourself
myProc = new MyCustomProcess();
// ... use it ...
delete myProc; // Manual deletion
```

### 7. Don't Modify Internal Vectors

```cpp
// CORRECT: Read-only access
G4ProcessTable::G4ProcNameVector* names = table->GetNameList();
for (const auto& name : *names) {
    G4cout << name << G4endl;
}

// INCORRECT: Don't modify internal data
// names->push_back("NewProcess"); // Don't do this!
// delete names; // Don't delete internal vectors!
```

### 8. Use Specific Lookup Methods

```cpp
// EFFICIENT: Direct lookup when you have the process manager
G4ProcessManager* procMgr = particle->GetProcessManager();
G4VProcess* proc = table->FindProcess("eIoni", procMgr);

// LESS EFFICIENT: Lookup by string requires particle table search
G4VProcess* proc2 = table->FindProcess("eIoni", "e-");
```

### 9. Batch Process Activation Changes

```cpp
// EFFICIENT: Make all activation changes together
void ConfigureOpticalSimulation() {
    G4ProcessTable* table = G4ProcessTable::GetProcessTable();

    // Disable non-optical EM processes for photons
    table->SetProcessActivation(fElectromagnetic, "opticalphoton", false);

    // Enable optical processes
    table->SetProcessActivation("OpAbsorption", "opticalphoton", true);
    table->SetProcessActivation("OpRayleigh", "opticalphoton", true);
    table->SetProcessActivation("OpBoundary", "opticalphoton", true);
}
```

### 10. Document Process Modifications

```cpp
// GOOD PRACTICE: Document why processes are modified
class MyDetectorConstruction : public G4VUserDetectorConstruction {
public:
    void ConstructSDandField() override {
        G4ProcessTable* table = G4ProcessTable::GetProcessTable();

        // Disable multiple scattering for this thin detector geometry
        // to improve performance (< 100 um thick sensors)
        table->SetProcessActivation("msc", "e-", false);
        table->SetProcessActivation("msc", "e+", false);

        G4cout << "NOTE: MSC disabled for thin detector optimization" << G4endl;
    }
};
```

## Thread Safety Considerations

G4ProcessTable is thread-local, meaning each worker thread has its own independent instance:

```cpp
// In multi-threaded mode, each thread has its own table
void WorkerRunManager::BeamOn() {
    // This gets a thread-local instance
    G4ProcessTable* table = G4ProcessTable::GetProcessTable();

    // Changes only affect this worker thread
    table->SetProcessActivation("msc", false);
}
```

**Important**: Process activation changes made in one thread do not affect other threads.

## Common Pitfalls

### Pitfall 1: Forgetting to Delete Returned Vectors

```cpp
// MEMORY LEAK:
for (int i = 0; i < 1000; ++i) {
    G4ProcessVector* procs = table->FindProcesses(fElectromagnetic);
    // ... use procs ...
    // Missing: delete procs;
}

// CORRECT:
G4ProcessVector* procs = table->FindProcesses(fElectromagnetic);
// ... use procs ...
delete procs;
```

### Pitfall 2: Using Deactivated Processes

```cpp
// Deactivate a process
table->SetProcessActivation("eIoni", "e-", false);

// Later try to use it - it exists but won't be invoked!
G4VProcess* eIoni = table->FindProcess("eIoni", "e-");
if (eIoni) {
    // FindProcess returns non-null, but process is inactive
    // and won't affect simulation!
}
```

### Pitfall 3: Mixing String and Pointer Lookups

```cpp
// Be consistent with particle specification
G4ParticleDefinition* particle = /* ... */;

// These may give different results if particle name is ambiguous
G4VProcess* p1 = table->FindProcess("proc", particle);
G4VProcess* p2 = table->FindProcess("proc", particle->GetParticleName());
```

## Performance Notes

- **FindProcess** by process manager is faster than by particle name (avoids particle table lookup)
- **FindProcesses** allocates new vectors - avoid calling repeatedly in tight loops
- **GetNameList** and **GetProcTableVector** return internal pointers - very fast, read-only access
- Process activation changes are immediate but may have overhead in large tables

## See Also

- [G4VProcess](./g4vprocess.md) - Base class for all physics processes
- [G4ProcessManager](./g4processmanager.md) - Manages processes for individual particle types
- [G4ParticleDefinition](../particles/g4particledefinition.md) - Particle type definitions
- [G4ProcTblElement](./g4proctblelement.md) - Internal table element structure
- [G4ProcessVector](./g4processvector.md) - Vector container for process pointers
- [Process Management Overview](../index.md#process-management) - High-level process management concepts

## Version History

- **Author**: H. Kurashige, 4 August 1998
- Thread-local singleton support added for multi-threaded Geant4
- UI messenger integration for interactive process control

## Related UI Commands

The G4ProcessTableMessenger provides these commands:

```bash
/process/list                    # List all processes
/process/verbose <level>         # Set verbose level
/process/activate <name> <particle> <flag>    # Activate/deactivate process
/process/dump <processName>      # Dump process information
```

Use these commands interactively or in macro files to control process behavior without recompiling.
