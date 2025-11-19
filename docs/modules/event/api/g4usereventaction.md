# G4UserEventAction API Documentation

## Overview

`G4UserEventAction` is the base class for user-defined actions executed at the beginning and end of each event. It provides hooks for event initialization, finalization, and sub-event merging in parallel processing. This class is part of the optional user action framework and is commonly used for event-level data collection, initialization, and analysis.

::: tip Header File
**Location:** `source/event/include/G4UserEventAction.hh`
**Source:** `source/event/src/G4UserEventAction.cc`
:::

## Class Declaration

```cpp
class G4UserEventAction
{
  public:
    G4UserEventAction();
    virtual ~G4UserEventAction() = default;

    virtual void SetEventManager(G4EventManager* value);

    virtual void BeginOfEventAction(const G4Event* anEvent);
    virtual void EndOfEventAction(const G4Event* anEvent);

    virtual void MergeSubEvent(G4Event* masterEvent, const G4Event* subEvent);

  protected:
    G4EventManager* fpEventManager = nullptr;
};
```

## Key Characteristics

- **Optional User Action**: Not mandatory but commonly used
- **Event Lifecycle Hooks**: BeginOfEventAction() and EndOfEventAction()
- **Read-Only Access**: Event object is const (cannot be modified)
- **Sub-Event Support**: MergeSubEvent() for advanced parallel processing
- **Thread-Local**: Each worker thread has its own instance in MT mode

## Important Notes

::: warning Key Restrictions
- Event object is const in Begin/EndOfEventAction - **cannot modify event**
- To store event data, use G4Run::RecordEvent() or custom run class
- For event modification, use G4UserEventInformation
:::

::: tip Thread Safety
In multi-threaded mode:
- Each worker thread has separate instance
- Events processed independently per thread
- No synchronization needed between threads
- Results merged at run level
:::

## Constructors and Destructor

### Constructor
`source/event/include/G4UserEventAction.hh:53`

```cpp
G4UserEventAction();
```

Default constructor initializing the event action.

**Example:**
```cpp
class MyEventAction : public G4UserEventAction {
public:
    MyEventAction() : G4UserEventAction() {
        // Initialize event-level variables
        fTotalEdep = 0.;
        fEventCounter = 0;
    }

private:
    G4double fTotalEdep;
    G4int fEventCounter;
};
```

### Destructor
`source/event/include/G4UserEventAction.hh:54`

```cpp
virtual ~G4UserEventAction() = default;
```

Virtual destructor for proper cleanup in derived classes.

## Virtual Methods

### BeginOfEventAction()
`source/event/include/G4UserEventAction.hh:57`

```cpp
virtual void BeginOfEventAction(const G4Event* anEvent);
```

**Purpose:** Hook called at the beginning of event processing

**Parameters:**
- `anEvent`: Pointer to G4Event object (const - read-only)

**When Called:**
- After primary particles are generated
- Before any tracking begins
- After G4Event object is created

**Use Cases:**
- Initialize event-level variables
- Reset counters and accumulators
- Print event information
- Set user event information
- Initialize analysis structures

**Example:**
```cpp
void MyEventAction::BeginOfEventAction(const G4Event* event)
{
    // Get event ID
    G4int eventID = event->GetEventID();

    // Print progress
    if (eventID % 1000 == 0) {
        G4cout << ">>> Event " << eventID << G4endl;
    }

    // Reset event-level data
    fEnergyDeposit = 0.;
    fHitPositions.clear();

    // Attach custom event information
    auto eventInfo = new MyEventInfo();
    eventInfo->SetEventID(eventID);
    event->SetUserInformation(eventInfo);

    // Initialize histograms for this event
    if (fAnalysisManager) {
        fAnalysisManager->FillNtupleIColumn(0, eventID);
    }
}
```

**Common Patterns:**
```cpp
// Pattern 1: Simple logging
void MyEventAction::BeginOfEventAction(const G4Event* event) {
    if (event->GetEventID() % 100 == 0) {
        G4cout << "Processing event " << event->GetEventID() << G4endl;
    }
}

// Pattern 2: Initialize custom event info
void MyEventAction::BeginOfEventAction(const G4Event* event) {
    auto info = new MyEventInfo();
    event->SetUserInformation(info);
}

// Pattern 3: Access primary particles
void MyEventAction::BeginOfEventAction(const G4Event* event) {
    G4PrimaryVertex* vertex = event->GetPrimaryVertex();
    if (vertex) {
        G4PrimaryParticle* primary = vertex->GetPrimary();
        G4cout << "Primary: " << primary->GetParticleDefinition()->GetParticleName()
               << " with energy " << primary->GetKineticEnergy()/MeV << " MeV" << G4endl;
    }
}
```

### EndOfEventAction()
`source/event/include/G4UserEventAction.hh:58`

```cpp
virtual void EndOfEventAction(const G4Event* anEvent);
```

**Purpose:** Hook called at the end of event processing

**Parameters:**
- `anEvent`: Pointer to G4Event object (const - read-only)

**When Called:**
- After all tracking is complete
- After all hits are collected
- Before event deletion

**Use Cases:**
- Extract and analyze hits collections
- Fill histograms and ntuples
- Calculate event statistics
- Write event data to file
- Print event summary
- Mark events to keep

**Example:**
```cpp
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    // Check if event was aborted
    if (event->IsAborted()) {
        return;
    }

    // Get hits collection
    G4HCofThisEvent* hitsCollection = event->GetHCofThisEvent();
    if (!hitsCollection) return;

    // Access specific hits collection
    G4int hcID = G4SDManager::GetSDMpointer()->GetCollectionID("CalorimeterHC");
    auto caloHC = static_cast<CalorimeterHitsCollection*>(
        hitsCollection->GetHC(hcID));

    // Analyze hits
    G4double totalEdep = 0.;
    if (caloHC) {
        for (size_t i = 0; i < caloHC->entries(); ++i) {
            totalEdep += (*caloHC)[i]->GetEdep();
        }
    }

    // Fill histograms
    auto analysisManager = G4AnalysisManager::Instance();
    analysisManager->FillH1(0, totalEdep);
    analysisManager->FillNtupleDColumn(0, totalEdep);
    analysisManager->AddNtupleRow();

    // Print event summary
    G4cout << "Event " << event->GetEventID()
           << ": Total energy deposit = " << totalEdep/MeV << " MeV" << G4endl;

    // Keep interesting events
    if (totalEdep > fEnergyThreshold) {
        G4EventManager::GetEventManager()->KeepTheCurrentEvent();
    }
}
```

**Common Patterns:**
```cpp
// Pattern 1: Analyze hits
void MyEventAction::EndOfEventAction(const G4Event* event) {
    auto hitsCollection = event->GetHCofThisEvent();
    if (hitsCollection) {
        ProcessHitsCollections(hitsCollection);
    }
}

// Pattern 2: Fill analysis
void MyEventAction::EndOfEventAction(const G4Event* event) {
    auto info = static_cast<MyEventInfo*>(event->GetUserInformation());
    if (info) {
        FillHistograms(info->GetTotalEdep(), info->GetHitCount());
    }
}

// Pattern 3: Conditional event keeping
void MyEventAction::EndOfEventAction(const G4Event* event) {
    if (IsInterestingEvent(event)) {
        G4EventManager::GetEventManager()->KeepTheCurrentEvent();
    }
}

// Pattern 4: Print summary
void MyEventAction::EndOfEventAction(const G4Event* event) {
    G4cout << "Event " << event->GetEventID() << " complete. "
           << GetEventStatistics(event) << G4endl;
}
```

### MergeSubEvent()
`source/event/include/G4UserEventAction.hh:61`

```cpp
virtual void MergeSubEvent(G4Event* masterEvent, const G4Event* subEvent);
```

**Purpose:** Merge results from sub-event into master event (advanced feature)

**Parameters:**
- `masterEvent`: Main event to merge into (non-const - can be modified)
- `subEvent`: Sub-event with results from worker thread (const)

**When Called:**
- During sub-event parallel processing
- After sub-event completes in worker thread
- Before sub-event deletion

**Default Behavior:**
- Geant4 automatically merges trajectories and scores
- User must merge hits collections and user information

**Use Cases:**
- Sub-event parallelism (advanced)
- Merging custom hits collections
- Merging user event information
- Combining sub-event statistics

**Example:**
```cpp
void MyEventAction::MergeSubEvent(G4Event* masterEvent,
                                  const G4Event* subEvent)
{
    // Get hits collections
    G4HCofThisEvent* masterHC = masterEvent->GetHCofThisEvent();
    G4HCofThisEvent* subHC = subEvent->GetHCofThisEvent();

    if (!masterHC || !subHC) return;

    // Merge calorimeter hits
    G4int caloHCID =
        G4SDManager::GetSDMpointer()->GetCollectionID("CalorimeterHC");

    auto masterCaloHC = static_cast<CalorimeterHitsCollection*>(
        masterHC->GetHC(caloHCID));
    auto subCaloHC = static_cast<CalorimeterHitsCollection*>(
        subHC->GetHC(caloHCID));

    if (masterCaloHC && subCaloHC) {
        // Copy hits from sub-event to master
        for (size_t i = 0; i < subCaloHC->entries(); ++i) {
            masterCaloHC->insert(new CalorimeterHit(*(*subCaloHC)[i]));
        }
    }

    // Merge user event information
    auto masterInfo = static_cast<MyEventInfo*>(
        masterEvent->GetUserInformation());
    auto subInfo = static_cast<MyEventInfo*>(
        subEvent->GetUserInformation());

    if (masterInfo && subInfo) {
        masterInfo->Merge(subInfo);
    }
}
```

::: tip Sub-Event Parallelism
Sub-event parallelism is an advanced feature for processing parts of a single event in parallel. Most users don't need this and can leave MergeSubEvent() with default implementation.
:::

### SetEventManager()
`source/event/include/G4UserEventAction.hh:55`

```cpp
virtual void SetEventManager(G4EventManager* value);
```

**Purpose:** Set pointer to event manager (called by framework)

**Parameters:**
- `value`: Pointer to G4EventManager

::: warning Internal Use
This method is called by G4EventManager. Users typically **do not** need to call or override this.
:::

## Complete Usage Examples

### Basic Event Action

```cpp
// MyEventAction.hh
#ifndef MyEventAction_h
#define MyEventAction_h 1

#include "G4UserEventAction.hh"
#include "globals.hh"

class G4Event;

class MyEventAction : public G4UserEventAction
{
public:
    MyEventAction();
    virtual ~MyEventAction() = default;

    virtual void BeginOfEventAction(const G4Event*) override;
    virtual void EndOfEventAction(const G4Event*) override;
};

#endif

// MyEventAction.cc
#include "MyEventAction.hh"
#include "G4Event.hh"
#include "G4EventManager.hh"

MyEventAction::MyEventAction() : G4UserEventAction()
{}

void MyEventAction::BeginOfEventAction(const G4Event* event)
{
    G4int eventID = event->GetEventID();
    if (eventID % 1000 == 0) {
        G4cout << ">>> Event " << eventID << G4endl;
    }
}

void MyEventAction::EndOfEventAction(const G4Event* event)
{
    G4cout << "Event " << event->GetEventID() << " completed" << G4endl;
}
```

### With Hits Collection Analysis

```cpp
#include "G4SDManager.hh"
#include "G4HCofThisEvent.hh"
#include "CalorimeterHit.hh"

class MyEventAction : public G4UserEventAction
{
public:
    virtual void EndOfEventAction(const G4Event*) override;

private:
    G4int fCaloHCID = -1;
};

void MyEventAction::EndOfEventAction(const G4Event* event)
{
    // Get hits collection ID (once)
    if (fCaloHCID == -1) {
        fCaloHCID =
            G4SDManager::GetSDMpointer()->GetCollectionID("CalorimeterHC");
    }

    // Get hits collection
    G4HCofThisEvent* hitsCollections = event->GetHCofThisEvent();
    if (!hitsCollections) return;

    auto caloHC = static_cast<CalorimeterHitsCollection*>(
        hitsCollections->GetHC(fCaloHCID));

    if (!caloHC) return;

    // Analyze hits
    G4double totalEdep = 0.;
    G4int nHits = 0;

    for (size_t i = 0; i < caloHC->entries(); ++i) {
        auto hit = (*caloHC)[i];
        totalEdep += hit->GetEdep();
        nHits++;
    }

    G4cout << "Event " << event->GetEventID()
           << ": " << nHits << " hits, "
           << totalEdep/MeV << " MeV deposited" << G4endl;
}
```

### With Analysis (ROOT/CSV)

```cpp
#include "g4root.hh"  // Or g4csv.hh, g4xml.hh

class MyEventAction : public G4UserEventAction
{
public:
    MyEventAction();
    virtual ~MyEventAction() = default;

    virtual void BeginOfEventAction(const G4Event*) override;
    virtual void EndOfEventAction(const G4Event*) override;

private:
    G4int fCaloHCID;
    G4double fEnergyThreshold;
};

MyEventAction::MyEventAction()
    : G4UserEventAction(),
      fCaloHCID(-1),
      fEnergyThreshold(10.0*MeV)
{}

void MyEventAction::BeginOfEventAction(const G4Event* event)
{
    // Get collection ID once
    if (fCaloHCID == -1) {
        fCaloHCID =
            G4SDManager::GetSDMpointer()->GetCollectionID("CalorimeterHC");
    }
}

void MyEventAction::EndOfEventAction(const G4Event* event)
{
    // Get hits collection
    auto hitsCollections = event->GetHCofThisEvent();
    if (!hitsCollections) return;

    auto caloHC = static_cast<CalorimeterHitsCollection*>(
        hitsCollections->GetHC(fCaloHCID));
    if (!caloHC) return;

    // Calculate total energy
    G4double totalEdep = 0.;
    for (size_t i = 0; i < caloHC->entries(); ++i) {
        totalEdep += (*caloHC)[i]->GetEdep();
    }

    // Fill ntuple
    auto analysisManager = G4AnalysisManager::Instance();
    analysisManager->FillNtupleIColumn(0, event->GetEventID());
    analysisManager->FillNtupleDColumn(1, totalEdep);
    analysisManager->FillNtupleIColumn(2, caloHC->entries());
    analysisManager->AddNtupleRow();

    // Fill histogram
    analysisManager->FillH1(0, totalEdep);

    // Keep interesting events
    if (totalEdep > fEnergyThreshold) {
        G4EventManager::GetEventManager()->KeepTheCurrentEvent();
    }
}
```

### With User Event Information

```cpp
// MyEventInfo.hh
#include "G4VUserEventInformation.hh"
#include <vector>

class MyEventInfo : public G4VUserEventInformation
{
public:
    MyEventInfo() : fTotalEdep(0.), fNHits(0) {}
    virtual ~MyEventInfo() = default;

    virtual void Print() const override {
        G4cout << "Total Edep: " << fTotalEdep/MeV << " MeV, "
               << "Hits: " << fNHits << G4endl;
    }

    void AddEnergy(G4double edep) { fTotalEdep += edep; }
    void AddHit() { fNHits++; }

    G4double GetTotalEdep() const { return fTotalEdep; }
    G4int GetNHits() const { return fNHits; }

private:
    G4double fTotalEdep;
    G4int fNHits;
};

// MyEventAction.cc
void MyEventAction::BeginOfEventAction(const G4Event* event)
{
    // Create and attach event info
    auto eventInfo = new MyEventInfo();
    event->SetUserInformation(eventInfo);
}

void MyEventAction::EndOfEventAction(const G4Event* event)
{
    // Retrieve event info
    auto eventInfo =
        static_cast<MyEventInfo*>(event->GetUserInformation());

    if (eventInfo) {
        G4cout << "Event " << event->GetEventID() << ": ";
        eventInfo->Print();

        // Use event info for analysis
        auto analysisManager = G4AnalysisManager::Instance();
        analysisManager->FillNtupleDColumn(0, eventInfo->GetTotalEdep());
        analysisManager->FillNtupleIColumn(1, eventInfo->GetNHits());
        analysisManager->AddNtupleRow();
    }
}
```

### Multi-threaded Application

```cpp
class MyEventAction : public G4UserEventAction
{
public:
    MyEventAction();
    virtual ~MyEventAction() = default;

    virtual void BeginOfEventAction(const G4Event*) override;
    virtual void EndOfEventAction(const G4Event*) override;

private:
    G4int fPrintModulo;
};

MyEventAction::MyEventAction()
    : G4UserEventAction(),
      fPrintModulo(100)
{}

void MyEventAction::BeginOfEventAction(const G4Event* event)
{
    // Each thread has its own event action instance
    // No synchronization needed

    G4int eventID = event->GetEventID();
    G4int threadID = G4Threading::G4GetThreadId();

    if (eventID % fPrintModulo == 0) {
        G4cout << "Thread " << threadID
               << " processing event " << eventID << G4endl;
    }
}

void MyEventAction::EndOfEventAction(const G4Event* event)
{
    // Thread-safe analysis manager
    auto analysisManager = G4AnalysisManager::Instance();

    // Each thread writes to its own output
    // Framework merges ntuples automatically
    analysisManager->FillNtupleIColumn(0, event->GetEventID());
    analysisManager->FillNtupleDColumn(1, GetEventEnergy(event));
    analysisManager->AddNtupleRow();
}
```

## Registration Pattern

```cpp
// In MyActionInitialization::Build()
#include "MyEventAction.hh"

void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyRunAction);

    // Register event action (optional)
    SetUserAction(new MyEventAction);

    // Optional: Other actions
    SetUserAction(new MyTrackingAction);
    SetUserAction(new MySteppingAction);
}
```

## Thread Safety

### Sequential Mode
- Single instance of MyEventAction
- BeginOfEventAction() and EndOfEventAction() called for each event
- Simple linear execution

### Multi-threaded Mode
- **Separate instance per worker thread**
- Each thread processes independent events
- No shared data between thread instances
- Analysis manager handles thread-safe output
- No manual synchronization needed

### Thread-Safe Practices

::: tip Best Practices
1. **No Shared State**: Avoid static or global variables
2. **Thread-Local Data**: Use member variables (separate per thread)
3. **Analysis Manager**: Use G4AnalysisManager for thread-safe I/O
4. **Event Info**: G4Event is thread-local, safe to use
5. **Hits Collections**: Thread-local, no synchronization needed
:::

## Performance Considerations

1. **Minimize EndOfEvent Work**: Keep processing lightweight
2. **Lazy Initialization**: Get collection IDs once, cache them
3. **Conditional Logging**: Use modulo for periodic output
4. **Analysis Buffering**: Let analysis manager handle buffering
5. **Event Keeping**: Use sparingly - kept events consume memory

## Common Use Cases

### Use Case 1: Energy Spectrum
```cpp
void MyEventAction::EndOfEventAction(const G4Event* event) {
    G4double totalEdep = GetTotalEnergyDeposit(event);
    G4AnalysisManager::Instance()->FillH1(0, totalEdep);
}
```

### Use Case 2: Event Selection
```cpp
void MyEventAction::EndOfEventAction(const G4Event* event) {
    if (IsSignalEvent(event)) {
        G4EventManager::GetEventManager()->KeepTheCurrentEvent();
    }
}
```

### Use Case 3: Progress Monitoring
```cpp
void MyEventAction::BeginOfEventAction(const G4Event* event) {
    if (event->GetEventID() % 1000 == 0) {
        PrintProgress(event->GetEventID());
    }
}
```

### Use Case 4: Custom Data Collection
```cpp
void MyEventAction::EndOfEventAction(const G4Event* event) {
    auto info = static_cast<MyEventInfo*>(event->GetUserInformation());
    SaveToCustomFile(info);
}
```

## See Also

- [G4Event](g4event.md) - Event data container
- [G4EventManager](g4eventmanager.md) - Event processing manager
- [G4UserRunAction](../../run/api/g4userrunaction.md) - Run-level actions
- [G4UserTrackingAction](../../tracking/api/g4usertrackingaction.md) - Track-level actions
- [G4UserSteppingAction](../../tracking/api/g4usersteppingaction.md) - Step-level actions
- [G4VUserActionInitialization](../../run/api/g4vuseractioninitialization.md) - Action registration
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4UserEventAction.hh`
- Source: `source/event/src/G4UserEventAction.cc`
:::
