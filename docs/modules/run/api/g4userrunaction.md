# G4UserRunAction API Documentation

## Overview

`G4UserRunAction` is the base class for user-defined actions executed at the beginning and end of each run. It provides hooks for run initialization, finalization, and custom run object creation. This class is a fundamental part of Geant4's user action framework, allowing users to implement run-level data collection, analysis setup/teardown, and run statistics management.

::: tip Header File
**Location:** `source/run/include/G4UserRunAction.hh`
**Source:** `source/run/src/G4UserRunAction.cc`
:::

## Class Declaration

```cpp
class G4UserRunAction
{
  public:
    G4UserRunAction();
    virtual ~G4UserRunAction() = default;

    virtual G4Run* GenerateRun() { return nullptr; }
    virtual void BeginOfRunAction(const G4Run* aRun) {}
    virtual void EndOfRunAction(const G4Run* aRun) {}

    inline virtual void SetMaster(G4bool val = true) { isMaster = val; }
    inline G4bool IsMaster() const { return isMaster; }

  protected:
    G4bool isMaster = true;
};
```

## Key Characteristics

- **User Override Class**: Designed to be subclassed with user-defined behavior
- **Run Lifecycle Hooks**: BeginOfRunAction() and EndOfRunAction() called by G4RunManager
- **Custom Run Creation**: GenerateRun() allows instantiation of derived G4Run classes
- **MT-Aware**: IsMaster() flag distinguishes master vs worker thread context
- **Non-Intrusive**: Does not modify G4Run objects (const access only)

## Important Notes

::: warning Key Restrictions
- User should **NOT** modify the contents of the G4Run object
- All G4Run parameters are const-qualified to enforce read-only access
- Modifications to run data should be done through custom G4Run subclasses
:::

::: tip Thread Safety
In multi-threaded mode:
- Master thread has `isMaster = true`
- Worker threads have `isMaster = false`
- Different instances run on different threads
- Use IsMaster() to implement thread-specific behavior
:::

## Constructors and Destructor

### Constructor
`source/run/include/G4UserRunAction.hh:55`

```cpp
G4UserRunAction();
```

Default constructor initializing the action class.

**Default Initialization:**
- `isMaster = true` (sequential mode or master thread)

**Example:**
```cpp
class MyRunAction : public G4UserRunAction {
public:
    MyRunAction() : G4UserRunAction() {
        // Initialize your run-level variables
    }
};
```

### Destructor
`source/run/include/G4UserRunAction.hh:56`

```cpp
virtual ~G4UserRunAction() = default;
```

Virtual destructor for proper cleanup in derived classes.

## Virtual Methods

### GenerateRun()
`source/run/include/G4UserRunAction.hh:58`

```cpp
virtual G4Run* GenerateRun();
```

**Purpose:** Factory method to create custom G4Run objects

**Returns:**
- Pointer to user-defined G4Run subclass
- `nullptr` (default) causes G4RunManager to create standard G4Run

**When Called:** Before BeginOfRunAction(), at run initialization

**Example:**
```cpp
class MyRun : public G4Run {
public:
    MyRun() : G4Run(), totalEdep(0.), eventCount(0) {}

    void RecordEvent(const G4Event* evt) override {
        if (evt) {
            totalEdep += GetEventEnergy(evt);
            eventCount++;
        }
        G4Run::RecordEvent(evt);
    }

    void Merge(const G4Run* localRun) override {
        const MyRun* local = static_cast<const MyRun*>(localRun);
        totalEdep += local->totalEdep;
        eventCount += local->eventCount;
        G4Run::Merge(localRun);
    }

    G4double GetTotalEdep() const { return totalEdep; }
    G4int GetEventCount() const { return eventCount; }

private:
    G4double totalEdep;
    G4int eventCount;
};

class MyRunAction : public G4UserRunAction {
public:
    G4Run* GenerateRun() override {
        return new MyRun();  // Return custom run object
    }
};
```

::: tip Custom Run Objects
GenerateRun() is essential for:
- Accumulating run statistics
- Implementing event recording
- Multi-threaded run merging
- Custom data storage
:::

### BeginOfRunAction()
`source/run/include/G4UserRunAction.hh:59`

```cpp
virtual void BeginOfRunAction(const G4Run* aRun);
```

**Purpose:** Hook called at the beginning of each run

**Parameters:**
- `aRun`: Pointer to G4Run object (const - read-only access)

**When Called:**
- After run initialization
- After GenerateRun() creates run object
- Before any events are processed

**Thread Context:**
- Sequential mode: Called once
- MT mode: Called in master thread and each worker thread

**Example:**
```cpp
void MyRunAction::BeginOfRunAction(const G4Run* run) {
    G4cout << "=== Run " << run->GetRunID() << " Start ===" << G4endl;
    G4cout << "Number of events to process: "
           << run->GetNumberOfEventToBeProcessed() << G4endl;

    // Master thread: Setup output files
    if (IsMaster()) {
        OpenOutputFile();
        InitializeHistograms();
    }
    // Worker threads: Initialize thread-local data
    else {
        InitializeThreadLocalData();
    }

    // Reset run-level counters
    ResetCounters();
}
```

**Common Use Cases:**
- Open output files
- Initialize histograms/ROOT trees
- Reset run-level statistics
- Setup analysis tools
- Print run information
- Configure thread-specific resources

### EndOfRunAction()
`source/run/include/G4UserRunAction.hh:60`

```cpp
virtual void EndOfRunAction(const G4Run* aRun);
```

**Purpose:** Hook called at the end of each run

**Parameters:**
- `aRun`: Pointer to G4Run object (const - read-only access)

**When Called:**
- After all events are processed
- After worker runs are merged (MT mode)
- Before run object deletion

**Thread Context:**
- Sequential mode: Called once
- MT mode: Called in master thread and each worker thread

**Example:**
```cpp
void MyRunAction::EndOfRunAction(const G4Run* run) {
    G4cout << "=== Run " << run->GetRunID() << " Complete ===" << G4endl;
    G4cout << "Events processed: " << run->GetNumberOfEvent() << G4endl;

    // Access custom run data
    const MyRun* myRun = static_cast<const MyRun*>(run);

    // Master thread: Write final results
    if (IsMaster()) {
        G4cout << "Total energy deposited: "
               << myRun->GetTotalEdep() / GeV << " GeV" << G4endl;

        WriteResults(myRun);
        CloseOutputFile();
        FinalizeHistograms();
    }
    // Worker threads: Cleanup thread-local resources
    else {
        CleanupThreadLocalData();
    }

    PrintRunSummary(run);
}
```

**Common Use Cases:**
- Write final results
- Close output files
- Calculate run statistics
- Print run summary
- Save histograms
- Cleanup resources
- Performance reporting

## Thread Management Methods

### SetMaster()
`source/run/include/G4UserRunAction.hh:62`

```cpp
inline virtual void SetMaster(G4bool val = true);
```

**Purpose:** Set master thread flag

**Parameters:**
- `val`: `true` for master thread, `false` for worker thread (default: `true`)

**When Called:** By G4RunManager during initialization

::: warning User Code
Users typically **do not** call this method. G4RunManager sets it automatically.
:::

### IsMaster()
`source/run/include/G4UserRunAction.hh:63`

```cpp
inline G4bool IsMaster() const;
```

**Purpose:** Check if running in master thread

**Returns:**
- `true` if master thread (sequential mode or MT master)
- `false` if worker thread

**Example:**
```cpp
void MyRunAction::BeginOfRunAction(const G4Run* run) {
    if (IsMaster()) {
        // Master thread: Setup shared resources
        fOutputFile = new TFile("results.root", "RECREATE");
    } else {
        // Worker threads: Setup thread-local resources
        G4int threadID = G4Threading::G4GetThreadId();
        fThreadFile = new TFile(Form("worker_%d.root", threadID), "RECREATE");
    }
}
```

## Complete Usage Examples

### Basic Run Action

```cpp
// MyRunAction.hh
#ifndef MyRunAction_h
#define MyRunAction_h 1

#include "G4UserRunAction.hh"
#include "globals.hh"

class G4Run;

class MyRunAction : public G4UserRunAction
{
public:
    MyRunAction();
    virtual ~MyRunAction() = default;

    virtual void BeginOfRunAction(const G4Run*) override;
    virtual void EndOfRunAction(const G4Run*) override;
};

#endif

// MyRunAction.cc
#include "MyRunAction.hh"
#include "G4Run.hh"
#include "G4RunManager.hh"

MyRunAction::MyRunAction() : G4UserRunAction()
{
    // Constructor
}

void MyRunAction::BeginOfRunAction(const G4Run* run)
{
    G4cout << "### Run " << run->GetRunID() << " start." << G4endl;
}

void MyRunAction::EndOfRunAction(const G4Run* run)
{
    G4cout << "### Run " << run->GetRunID() << " ended." << G4endl;
    G4cout << "    Number of events processed: "
           << run->GetNumberOfEvent() << G4endl;
}
```

### Advanced: Custom Run with Statistics

```cpp
// MyRun.hh
#include "G4Run.hh"
#include <map>

class MyRun : public G4Run
{
public:
    MyRun();
    virtual ~MyRun() = default;

    virtual void RecordEvent(const G4Event*) override;
    virtual void Merge(const G4Run*) override;

    G4double GetTotalEdep() const { return fTotalEdep; }
    G4int GetParticleCount(const G4String& name) const;

private:
    G4double fTotalEdep;
    std::map<G4String, G4int> fParticleCount;
};

// MyRun.cc
#include "MyRun.hh"
#include "G4Event.hh"

MyRun::MyRun() : G4Run(), fTotalEdep(0.) {}

void MyRun::RecordEvent(const G4Event* evt)
{
    if (evt) {
        // Extract event data
        fTotalEdep += GetEventEdep(evt);

        // Count particles
        UpdateParticleCounts(evt);

        numberOfEvent++;  // Must increment manually
    }
}

void MyRun::Merge(const G4Run* run)
{
    const MyRun* localRun = static_cast<const MyRun*>(run);

    fTotalEdep += localRun->fTotalEdep;
    numberOfEvent += localRun->numberOfEvent;

    // Merge particle counts
    for (auto& entry : localRun->fParticleCount) {
        fParticleCount[entry.first] += entry.second;
    }
}

// MyRunAction.hh
class MyRunAction : public G4UserRunAction
{
public:
    MyRunAction();
    virtual ~MyRunAction() = default;

    virtual G4Run* GenerateRun() override;
    virtual void BeginOfRunAction(const G4Run*) override;
    virtual void EndOfRunAction(const G4Run*) override;
};

// MyRunAction.cc
G4Run* MyRunAction::GenerateRun()
{
    return new MyRun();
}

void MyRunAction::EndOfRunAction(const G4Run* run)
{
    const MyRun* myRun = static_cast<const MyRun*>(run);

    if (IsMaster()) {
        G4cout << "Total energy deposited: "
               << myRun->GetTotalEdep() / MeV << " MeV" << G4endl;
        G4cout << "Events: " << run->GetNumberOfEvent() << G4endl;
    }
}
```

### Multi-threaded with File I/O

```cpp
class MyRunAction : public G4UserRunAction
{
public:
    MyRunAction();
    virtual ~MyRunAction();

    virtual G4Run* GenerateRun() override;
    virtual void BeginOfRunAction(const G4Run*) override;
    virtual void EndOfRunAction(const G4Run*) override;

private:
    std::ofstream* fOutputFile;
};

MyRunAction::MyRunAction() : G4UserRunAction(), fOutputFile(nullptr)
{}

MyRunAction::~MyRunAction()
{
    if (fOutputFile) {
        fOutputFile->close();
        delete fOutputFile;
    }
}

void MyRunAction::BeginOfRunAction(const G4Run* run)
{
    if (IsMaster()) {
        // Master: Create main output file
        fOutputFile = new std::ofstream("master_output.txt");
        *fOutputFile << "Run " << run->GetRunID() << " started\n";
    } else {
        // Workers: Create thread-specific files
        G4int threadID = G4Threading::G4GetThreadId();
        std::string filename = "worker_" + std::to_string(threadID) + ".txt";
        fOutputFile = new std::ofstream(filename);
        *fOutputFile << "Worker " << threadID << " started\n";
    }
}

void MyRunAction::EndOfRunAction(const G4Run* run)
{
    const MyRun* myRun = static_cast<const MyRun*>(run);

    if (fOutputFile) {
        *fOutputFile << "Events: " << run->GetNumberOfEvent() << "\n";
        *fOutputFile << "Total Edep: " << myRun->GetTotalEdep() << "\n";
        fOutputFile->close();
    }
}

G4Run* MyRunAction::GenerateRun()
{
    return new MyRun();
}
```

### Histogram Management Example

```cpp
#ifdef G4ANALYSIS_USE
#include "g4root.hh"  // Or g4xml.hh, etc.
#endif

class MyRunAction : public G4UserRunAction
{
public:
    virtual void BeginOfRunAction(const G4Run*) override;
    virtual void EndOfRunAction(const G4Run*) override;
};

void MyRunAction::BeginOfRunAction(const G4Run* run)
{
#ifdef G4ANALYSIS_USE
    if (IsMaster()) {
        auto analysisManager = G4AnalysisManager::Instance();

        // Configure output
        analysisManager->SetVerboseLevel(1);
        analysisManager->SetNtupleMerging(true);

        // Create histograms
        analysisManager->CreateH1("Edep", "Energy Deposition", 100, 0., 10*MeV);
        analysisManager->CreateH1("TrackLength", "Track Length", 100, 0., 1*m);

        // Create ntuple
        analysisManager->CreateNtuple("events", "Event Data");
        analysisManager->CreateNtupleDColumn("energy");
        analysisManager->CreateNtupleDColumn("theta");
        analysisManager->CreateNtupleDColumn("phi");
        analysisManager->FinishNtuple();

        // Open output file
        G4String fileName = "run_" + std::to_string(run->GetRunID());
        analysisManager->OpenFile(fileName);
    }
#endif
}

void MyRunAction::EndOfRunAction(const G4Run* run)
{
#ifdef G4ANALYSIS_USE
    if (IsMaster()) {
        auto analysisManager = G4AnalysisManager::Instance();

        // Write and close file
        analysisManager->Write();
        analysisManager->CloseFile();

        G4cout << "Analysis file written for run "
               << run->GetRunID() << G4endl;
    }
#endif
}
```

## Registration Pattern

```cpp
// In your main() or initialization
int main(int argc, char** argv)
{
    // Construct the default run manager
    auto* runManager = G4RunManager::GetRunManager();
    // OR for multi-threaded:
    // auto* runManager = new G4MTRunManager;
    // runManager->SetNumberOfThreads(4);

    // Set mandatory initialization classes
    runManager->SetUserInitialization(new MyDetectorConstruction);
    runManager->SetUserInitialization(new MyPhysicsList);

    // Set user action classes
    runManager->SetUserAction(new MyRunAction);  // Register run action
    runManager->SetUserAction(new MyEventAction);
    // ... other actions

    runManager->Initialize();
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

## Data Members

### Protected Members
`source/run/include/G4UserRunAction.hh:66`

```cpp
protected:
    G4bool isMaster = true;
```

**Purpose:** Thread identification flag

**Access:** Protected - available to derived classes

**Values:**
- `true`: Master thread (sequential or MT master)
- `false`: Worker thread (MT mode only)

## Thread Safety

### Sequential Mode
- Single instance of G4UserRunAction
- BeginOfRunAction() and EndOfRunAction() called once per run
- `isMaster = true` always

### Multi-threaded Mode
- **Master Thread:**
  - One instance with `isMaster = true`
  - BeginOfRunAction() called before worker threads start
  - EndOfRunAction() called after all workers complete
  - Receives merged G4Run from all workers

- **Worker Threads:**
  - Separate instance per thread with `isMaster = false`
  - Each has own BeginOfRunAction() and EndOfRunAction()
  - Each processes subset of events
  - Local G4Run merged into master via G4Run::Merge()

### Thread-Safe Practices

::: tip Best Practices
1. **File I/O:** Use separate files per thread or mutex-protected writes
2. **Histograms:** Use G4AnalysisManager with ntuple merging
3. **Shared Data:** Protect with mutexes or use thread-local storage
4. **Master-Only Operations:** Use `if (IsMaster())` for output files, final summaries
5. **Worker-Only Operations:** Use `if (!IsMaster())` for thread-specific setup
:::

## Performance Considerations

1. **Initialization Overhead:** Keep BeginOfRunAction() lightweight
2. **File I/O:** Buffer writes, avoid frequent disk operations
3. **Memory Management:** Clean up resources in EndOfRunAction()
4. **Custom Runs:** Implement efficient Merge() for MT performance
5. **Statistics:** Use run-level accumulation instead of event-by-event I/O

## Common Patterns

### Pattern 1: Simple Logging
```cpp
void MyRunAction::BeginOfRunAction(const G4Run* run) {
    G4cout << "Run " << run->GetRunID() << " started" << G4endl;
}

void MyRunAction::EndOfRunAction(const G4Run* run) {
    G4cout << "Run " << run->GetRunID() << " completed: "
           << run->GetNumberOfEvent() << " events" << G4endl;
}
```

### Pattern 2: Custom Statistics
```cpp
G4Run* MyRunAction::GenerateRun() {
    return new MyRun();  // Custom run object
}

void MyRunAction::EndOfRunAction(const G4Run* run) {
    const MyRun* myRun = static_cast<const MyRun*>(run);
    PrintStatistics(myRun);
}
```

### Pattern 3: Conditional Master/Worker Behavior
```cpp
void MyRunAction::BeginOfRunAction(const G4Run* run) {
    if (IsMaster()) {
        SetupMasterResources();
    } else {
        SetupWorkerResources();
    }
}
```

## See Also

- [G4Run](g4run.md) - Run data container
- [G4RunManager](g4runmanager.md) - Sequential run management
- [G4MTRunManager](g4mtrunmanager.md) - Multi-threaded run management
- [G4VUserActionInitialization](g4vuseractioninitialization.md) - Action initialization framework
- [G4UserEventAction](../event/api/g4usereventaction.md) - Event-level actions
- [Run Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/run/include/G4UserRunAction.hh`
- Source: `source/run/src/G4UserRunAction.cc`
:::
