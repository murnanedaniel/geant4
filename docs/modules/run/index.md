# Run Module

**Location**: `source/run/`

## Overview

The run module is the central control system for Geant4 simulations, managing the event loop, multithreading, and the overall lifecycle of a simulation. It provides run managers that orchestrate detector construction, physics initialization, event processing, and user actions.

## Module Statistics

- **Header Files**: 15+ files in `include/`
- **Core Classes**: 4 main run managers + supporting infrastructure
- **Threading Models**: Serial, Multi-threaded (MT), Task-based with optional TBB
- **Total Lines**: ~8,000+ lines of header and implementation code

## Architecture

The run module provides different run manager implementations for various execution models:

```
G4RunManager (sequential/serial)
    ↓ extends
G4MTRunManager (multi-threaded with worker threads)
    ↓ extends
G4TaskRunManager (task-based parallelism with thread pool)
```

### Design Principles

1. **Singleton Pattern**: Only one run manager instance per application (or per thread in MT mode)
2. **State Machine**: Manages application states (PreInit, Init, Idle, GeomClosed, EventProc)
3. **User Customization**: Mandatory and optional user action classes for custom behavior
4. **Thread Safety**: Separate worker and master thread coordination in MT modes
5. **Factory Pattern**: G4RunManagerFactory for simplified run manager creation

## Execution Models

### Sequential Mode (G4RunManager)
- Single-threaded execution
- Simplest model for small simulations
- Full control and easy debugging
- Events processed serially

### Multi-Threaded Mode (G4MTRunManager)
- Worker threads process events in parallel
- Master thread manages initialization and aggregation
- One geometry instance per thread
- Automatic load balancing across workers

### Task-Based Mode (G4TaskRunManager)
- Events submitted as asynchronous tasks to thread pool
- Better load balancing for heterogeneous event workloads
- Supports TBB (Threading Building Blocks) integration
- Allows user-defined sub-event task submission

## Core Classes

### Run Managers

#### [G4RunManager](./api/g4runmanager.md)
The sequential run manager controlling the entire simulation lifecycle in single-threaded mode.

**Key Features**:
- Central control for initialization, event loop, and termination
- User action registration (detector, physics, primary generator, event/run/tracking actions)
- Geometry and physics initialization
- Event generation and processing control

**File**: `G4RunManager.hh`

#### [G4MTRunManager](./api/g4mtrunmanager.md)
Multi-threaded run manager that extends G4RunManager with worker thread management.

**Key Features**:
- Worker thread creation and synchronization
- Master/worker thread coordination
- Parallel event processing
- Thread-local geometry and physics instances
- Per-thread random number sequences

**File**: `G4MTRunManager.hh`

#### [G4TaskRunManager](./api/g4taskrunmanager.md)
Task-based run manager using a thread pool and task queue for advanced parallelism.

**Key Features**:
- Asynchronous task submission
- Configurable grainsize for task batching
- TBB integration support
- User-accessible task manager for sub-event parallelism
- Better load balancing for variable event complexity

**File**: Source files (see README.md for details)

#### G4RunManagerFactory
Factory for creating appropriate run manager based on type or environment variables.

**Key Features**:
- Simplified run manager creation
- Environment variable override support (`G4RUN_MANAGER_TYPE`, `G4FORCE_RUN_MANAGER_TYPE`)
- Type-safe enumeration or string-based selection
- Automatic fallback to available implementations

**File**: `G4RunManagerFactory.hh`

### Run Data

#### [G4Run](./api/g4run.md)
Represents a single run containing multiple events and run-level data.

**Key Features**:
- Event counting and storage
- Hits and digi collection tables
- Random number status recording
- Merge operations for multi-threaded runs
- User-extensible for custom run data

**File**: `G4Run.hh`

## User Actions

The run module defines interfaces for user customization at different stages:

### Mandatory User Classes

#### G4VUserDetectorConstruction
- Define detector geometry
- Specify materials and volumes
- Register sensitive detectors
- **Required** in all modes

#### G4VUserPhysicsList
- Define particles and their properties
- Register physics processes
- Set production cuts
- **Required** in all modes

#### G4VUserPrimaryGeneratorAction
- Generate primary particles for events
- Set particle properties (type, energy, position, direction)
- **Required** in all modes (via G4VUserActionInitialization in MT)

### Optional User Actions

#### G4UserRunAction
- Actions at beginning and end of each run
- Run-level data initialization and output
- Merging in multi-threaded mode

#### G4UserEventAction
- Actions at beginning and end of each event
- Event-level data collection
- Trajectory/hits management

#### G4UserStackingAction
- Control secondary particle stacking
- Kill, postpone, or prioritize tracks
- Event-level track management

#### G4UserTrackingAction
- Actions at beginning and end of each track
- Pre/post-tracking user hooks
- Track-level data collection

#### G4UserSteppingAction
- Actions at each simulation step
- Most granular control
- Step-by-step physics analysis

## Usage Patterns

### Basic Sequential Application

```cpp
#include "G4RunManager.hh"
#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"
#include "MyPrimaryGeneratorAction.hh"

int main() {
    auto* runManager = new G4RunManager;

    runManager->SetUserInitialization(new MyDetectorConstruction);
    runManager->SetUserInitialization(new MyPhysicsList);
    runManager->SetUserAction(new MyPrimaryGeneratorAction);

    runManager->Initialize();
    runManager->BeamOn(1000);  // Process 1000 events

    delete runManager;
    return 0;
}
```

### Multi-Threaded Application

```cpp
#include "G4MTRunManager.hh"
#include "G4RunManagerFactory.hh"
#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"
#include "MyActionInitialization.hh"

int main() {
    // Use factory for automatic selection
    auto* runManager = G4RunManagerFactory::CreateRunManager(G4RunManagerType::MT);
    runManager->SetNumberOfThreads(4);

    runManager->SetUserInitialization(new MyDetectorConstruction);
    runManager->SetUserInitialization(new MyPhysicsList);
    runManager->SetUserInitialization(new MyActionInitialization);

    runManager->Initialize();
    runManager->BeamOn(10000);  // Process 10000 events across 4 threads

    delete runManager;
    return 0;
}
```

### Task-Based Application with Custom Tasks

```cpp
#include "G4TaskRunManager.hh"
#include "G4RunManagerFactory.hh"

int main() {
    auto* runManager = G4RunManagerFactory::CreateRunManager(G4RunManagerType::Tasking);

    // ... initialization ...

    runManager->Initialize();
    runManager->BeamOn(10000);

    // Access task manager for custom parallelism
    auto* taskManager = G4TaskRunManager::GetTaskManager();
    auto future = taskManager->async<int>(myFunction, arg1, arg2);
    int result = future.get();

    delete runManager;
    return 0;
}
```

## State Management

The run manager controls application states through a finite state machine:

| State | Description |
|-------|-------------|
| `PreInit` | Before initialization |
| `Init` | During initialization |
| `Idle` | Initialized, ready to run |
| `GeomClosed` | Geometry optimized for tracking |
| `EventProc` | Processing events |
| `Quit` | Application terminating |
| `Abort` | Abnormal termination |

State transitions are managed automatically but can be queried via `G4StateManager`.

## Multi-Threading Details

### Thread Types

- **Master Thread**: Initializes geometry and physics, collects results
- **Worker Threads**: Process events in parallel with thread-local resources
- **G4WorkerRunManager**: Automatically instantiated per worker (user doesn't construct)

### Thread-Local Resources

Each worker thread maintains:
- Independent geometry navigator
- Thread-local physics tables
- Separate random number generator
- Thread-local user actions
- Independent event manager

### Synchronization

- Barriers for initialization and run termination
- Automatic merging of G4Run objects
- Thread-safe output and scoring

## Task-Based Parallelism

The task-based model (G4TaskRunManager) provides:

### Grainsize Control

```bash
# Environment variables
export G4FORCE_GRAINSIZE=50          # 50 tasks total
export G4FORCE_EVENTS_PER_TASK=10    # 10 events per task
```

### Task Groups

```cpp
// Get thread pool from task run manager
auto* threadPool = G4TaskRunManager::GetThreadPool();

// Create task group with join operation
auto sumResults = [](int& lhs, int rhs) { return lhs += rhs; };
task_group<int> taskGroup(sumResults, threadPool);

// Submit tasks
taskGroup.exec(computeFunction, arg1);
taskGroup.exec(computeFunction, arg2);

// Wait and collect results
int total = taskGroup.join();
```

## Build Configuration

The run module is a core component and is always built. Threading support depends on CMake configuration:

```cmake
# Enable multi-threading
-DGEANT4_BUILD_MULTITHREADED=ON

# Enable TBB support (requires TBB installation)
-DGEANT4_USE_TBB=ON
```

## Version History

- **Geant4 1.0**: G4RunManager introduced (M. Asai, 1996)
- **Geant4 10.0**: G4MTRunManager added (X. Dong, A. Dotti, 2013)
- **Geant4 10.6**: G4TaskRunManager introduced
- **Geant4 10.7**: G4RunManagerFactory added for simplified creation
- **Geant4 11.x**: Enhanced tasking system with PTL integration

## See Also

- [Event Module](../event/) - Event structure and generation
- [Tracking Module](../tracking/) - Track and step processing
- [Materials Module](../materials/) - Material definitions used in geometry
- [Processes Module](../processes/) - Physics processes invoked during stepping

## External References

- [Geant4 User Guide: Getting Started](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/GettingStarted/index.html)
- [Geant4 Multi-threading Guide](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/Fundamentals/multithreading.html)
- [PTL (Parallel Tasking Library)](https://github.com/jrmadsen/PTL)
- [Intel TBB Documentation](https://www.intel.com/content/www/us/en/developer/tools/oneapi/onetbb.html)
