# G4PhysicsModelCatalog

## Overview

G4PhysicsModelCatalog is a **singleton registry** that maintains a catalog of all physics models in Geant4, assigning each model a unique integer ID and string name. This enables model identification in tracks, scoring, and analysis, providing stable, version-independent model identifiers for reproducibility across different Geant4 versions and physics lists.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsModelCatalog.hh` (lines 1-119)
- Implementation: `source/global/management/src/G4PhysicsModelCatalog.cc` (lines 1-774)

## Purpose

G4PhysicsModelCatalog provides:

1. **Model identification**: Unique IDs for physics models
2. **Name-to-ID mapping**: Convert model names to IDs and vice versa
3. **Plotting support**: Contiguous indices for histogram bins
4. **Version stability**: IDs remain constant across Geant4 versions
5. **Physics list independence**: Same IDs regardless of physics list
6. **Analysis reproducibility**: Track which models created particles

## Key Concepts

### Model ID vs. Model Index

**Model ID:**
- Large, non-contiguous positive integers (10,000 - 39,999)
- Unique identifier for each model
- Organized by category (EM: 10,000-19,999, HAD: 20,000-29,999, Other: 30,000-39,999)
- **Stable across Geant4 versions** - never changes
- Used in Geant4 code and G4Track

**Model Index:**
- Small, contiguous integers (0, 1, 2, ...)
- Position in internal vector
- Convenient for array indexing and plotting
- May change between versions (as new models added)
- Use for histograms, not for identification

**Example:**
```
Model: "model_FTFP"
  Model ID: 22100 (unique, permanent)
  Model Index: 42 (depends on total number of models)
```

## Model ID Ranges

```
EM Models:        10,000 - 19,999
  General EM:     10,000 - 10,999
  DNA:            11,000 - 11,999
  Optical:        12,000 - 12,999

Hadronic Models:  20,000 - 29,999
  Gamma/Lepto:    20,000 - 20,999
  Elastic/QE:     21,000 - 21,999
  String models:  22,000 - 22,999
  Cascade:        23,000 - 23,999
  De-excitation:  24,000 - 24,999
  Data-driven:    25,000 - 25,999
  Other HAD:      26,000 - 26,999

Other Models:     30,000 - 39,999
  Biasing:        30,000 - 30,999
  Channeling:     31,000 - 31,999
```

## Public Methods

### Initialization

```cpp
static void Initialize();
```

Initialize the catalog (automatically called when needed).

**Note:** Usually not called directly - happens automatically on first use.

### ID ↔ Name Conversion

```cpp
static const G4String GetModelNameFromID(const G4int modelID);
```

Get model name from its unique ID.

**Example:**
```cpp
G4int modelID = 22100;
G4String name = G4PhysicsModelCatalog::GetModelNameFromID(modelID);
// Returns: "model_FTFP"
```

---

```cpp
static G4int GetModelID(const G4String& modelName);
```

Get model ID from its name.

**Example:**
```cpp
G4String name = "model_FTFP";
G4int modelID = G4PhysicsModelCatalog::GetModelID(name);
// Returns: 22100
```

### Index ↔ ID/Name Conversion

```cpp
static const G4String GetModelNameFromIndex(const G4int modelIndex);
static G4int GetModelID(const G4int modelIndex);
static G4int GetModelIndex(const G4int modelID);
static G4int GetModelIndex(const G4String& modelName);
```

Convert between model index (position in catalog) and ID/name.

**Example:**
```cpp
// Get model at index 42
G4String name = G4PhysicsModelCatalog::GetModelNameFromIndex(42);
G4int id = G4PhysicsModelCatalog::GetModelID(42);

// Find index of a model
G4int index = G4PhysicsModelCatalog::GetModelIndex(22100);  // By ID
G4int index = G4PhysicsModelCatalog::GetModelIndex("model_FTFP");  // By name
```

### Query Methods

```cpp
static G4int Entries();
```

Get total number of registered models.

**Example:**
```cpp
G4cout << "Total models registered: "
       << G4PhysicsModelCatalog::Entries() << G4endl;
```

---

```cpp
static G4int GetMinAllowedModelIDValue();  // Returns 10000
static G4int GetMaxAllowedModelIDValue();  // Returns 39999
```

Get valid range for model IDs.

### Diagnostic

```cpp
static void PrintAllInformation();
```

Print complete catalog (all model IDs, indices, and names).

**Example output:**
```
====================================================
=== G4PhysicsModelCatalog::PrintAllInformation() ===
====================================================
SIZE (i.e. number of models in the catalog)=200
    index=0     modelName=model_EM                  modelID=10000
    index=1     modelName=model_DeltaElectron       modelID=10010
    index=2     modelName=model_DeltaEBelowCut      modelID=10011
    ...
```

## Usage in Geant4

### Track Creator Model ID

G4Track stores the ID of the model that created it:

```cpp
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    const std::vector<const G4Track*>* secondaries =
        step->GetSecondaryInCurrentStep();

    for (auto* track : *secondaries) {
        G4int creatorModelID = track->GetCreatorModelID();

        if (creatorModelID > 0) {
            G4String modelName =
                G4PhysicsModelCatalog::GetModelNameFromID(creatorModelID);

            G4cout << "Secondary created by: " << modelName
                   << " (ID: " << creatorModelID << ")" << G4endl;
        }
    }
}
```

### Analysis and Histogramming

Use model **index** (not ID) for histogram binning:

```cpp
// Create histogram with bins for each model
G4int nModels = G4PhysicsModelCatalog::Entries();
G4AnalysisManager* analysisManager = G4AnalysisManager::Instance();

analysisManager->CreateH1("CreatorModels",
                         "Secondary Creator Models",
                         nModels, 0, nModels);

// Fill in event processing
void FillCreatorModel(const G4Track* track)
{
    G4int modelID = track->GetCreatorModelID();

    if (modelID > 0) {
        G4int modelIndex = G4PhysicsModelCatalog::GetModelIndex(modelID);
        analysisManager->FillH1(0, modelIndex);  // Use index for binning
    }
}
```

### Model Filtering in Scoring

```cpp
// Score only secondaries from specific models
class MySD : public G4VSensitiveDetector
{
public:
    G4bool ProcessHits(G4Step* step, G4TouchableHistory*) override
    {
        const G4Track* track = step->GetTrack();
        G4int modelID = track->GetCreatorModelID();

        // Only score particles from FTFP model
        if (modelID == G4PhysicsModelCatalog::GetModelID("model_FTFP")) {
            // Record hit...
            return true;
        }

        return false;
    }
};
```

## Complete Example: Model Statistics

```cpp
#include "G4PhysicsModelCatalog.hh"
#include <map>

class ModelStatistics
{
public:
    void RecordSecondary(const G4Track* track)
    {
        G4int modelID = track->GetCreatorModelID();

        if (modelID > 0) {
            modelCounts[modelID]++;
        }
    }

    void PrintReport() const
    {
        G4cout << "\\n=== Model Statistics ===" << G4endl;
        G4cout << "Total models that created particles: "
               << modelCounts.size() << G4endl;

        // Sort by count
        std::vector<std::pair<G4int, G4int>> sorted;
        for (const auto& pair : modelCounts) {
            sorted.push_back({pair.second, pair.first});  // {count, modelID}
        }
        std::sort(sorted.rbegin(), sorted.rend());

        // Print top 20
        G4cout << "\\nTop 20 models by particle count:" << G4endl;
        G4cout << "Count\\tModel ID\\tModel Name" << G4endl;

        for (size_t i = 0; i < std::min(sorted.size(), size_t(20)); ++i) {
            G4int count = sorted[i].first;
            G4int modelID = sorted[i].second;
            G4String name = G4PhysicsModelCatalog::GetModelNameFromID(modelID);

            G4cout << count << "\\t" << modelID << "\\t" << name << G4endl;
        }
    }

    void SaveToFile(const G4String& filename) const
    {
        std::ofstream out(filename);

        out << "# Model ID, Model Name, Count\\n";

        for (const auto& pair : modelCounts) {
            G4int modelID = pair.first;
            G4int count = pair.second;
            G4String name = G4PhysicsModelCatalog::GetModelNameFromID(modelID);

            out << modelID << ", " << name << ", " << count << "\\n";
        }

        out.close();
        G4cout << "Statistics saved to " << filename << G4endl;
    }

private:
    std::map<G4int, G4int> modelCounts;  // modelID -> count
};

// Usage in simulation
class MyEventAction : public G4UserEventAction
{
public:
    void EndOfEventAction(const G4Event* event) override
    {
        // Get all secondaries in event
        for (G4int i = 0; i < event->GetNumberOfPrimaryVertex(); ++i) {
            G4PrimaryVertex* vertex = event->GetPrimaryVertex(i);
            // Process vertex...
        }
    }

private:
    ModelStatistics stats;
};
```

## Example: Identify Bremsstrahlung Photons

```cpp
// Check if gamma was created by bremsstrahlung
G4bool IsBremsstrahlungPhoton(const G4Track* track)
{
    if (track->GetDefinition() != G4Gamma::Definition()) {
        return false;
    }

    G4int modelID = track->GetCreatorModelID();

    // Check for bremsstrahlung model IDs
    return (modelID == 10020 ||  // model_Bremsstrahlung
            modelID == 10021);   // model_SplitBremsstrahlung
}

// Count bremsstrahlung vs. other photon production
void AnalyzePhotonProduction(const G4Step* step)
{
    for (auto* track : *step->GetSecondaryInCurrentStep()) {
        if (track->GetDefinition() == G4Gamma::Definition()) {
            G4int modelID = track->GetCreatorModelID();
            G4String modelName =
                G4PhysicsModelCatalog::GetModelNameFromID(modelID);

            if (modelID == 10020 || modelID == 10021) {
                nBrems++;
            } else if (modelID == 10022) {
                nCompton++;
            } else if (modelID == 10023) {
                nAnnihilation++;
            } else {
                nOther++;
            }

            G4cout << "Photon from " << modelName << G4endl;
        }
    }
}
```

## Registered Models (Selected Examples)

### EM Models (10,000 - 19,999)

```cpp
10000  model_EM
10010  model_DeltaElectron
10020  model_Bremsstrahlung
10040  model_Fluorescence
11000  model_DNA
12020  model_Cerenkov
12030  model_Scintillation
```

### Hadronic Models (20,000 - 29,999)

```cpp
21000  model_hElasticLHEP
22100  model_FTFP  (Fritiof string + Precompound)
22200  model_QGSP  (Quark-gluon string + Precompound)
23000  model_BertiniCascade
23100  model_G4BinaryCascade
24000  model_PRECO (Precompound)
25000  model_NeutronHPCapture
```

### Other Models (30,000 - 39,999)

```cpp
30010  model_GenBiasForceCollision
31010  model_channeling
```

**Complete list:** See source file or call `G4PhysicsModelCatalog::PrintAllInformation()`

## Version Stability Guarantee

**Starting from Geant4 11.0:**
- Model IDs are **permanent** - never change
- Model names are **permanent** - never change
- New models added only at end with new IDs
- Model indices may change (depends on insertion order)

**Use model IDs (not indices) for:**
- Persistent storage
- Analysis comparisons across versions
- Documentation and publication

## Thread Safety

G4PhysicsModelCatalog is **thread-safe** for read operations after initialization.

**Safe:**
```cpp
// Worker threads
void Worker() {
    G4int id = G4PhysicsModelCatalog::GetModelID("model_FTFP");  // Safe
    G4String name = G4PhysicsModelCatalog::GetModelNameFromID(22100);  // Safe
}
```

**Note:** Initialization happens automatically in master thread before workers start.

## Performance

All lookups are **O(n)** linear search through vector (typically ~200 models).

**Typical times:**
- GetModelNameFromID: ~50-100 ns
- GetModelID (by name): ~100-200 ns

**Optimization:** Cache frequently used IDs:
```cpp
// Cache at initialization
static const G4int ftfpModelID =
    G4PhysicsModelCatalog::GetModelID("model_FTFP");

// Use cached value
if (track->GetCreatorModelID() == ftfpModelID) {
    // Fast comparison
}
```

## Common Use Cases

1. **Secondary tracking**: Identify which model created each particle
2. **Scoring filters**: Score only specific model contributions
3. **Analysis histograms**: Bin by creator model
4. **Debugging**: Trace particle origins
5. **Validation**: Compare model contributions across physics lists

## Related Classes

- G4Track - Stores creator model ID
- G4VProcess - Sets creator model ID
- G4VEmModel, G4HadronicInteraction - Physics models that use catalog

## See Also

- Application Developer Guide, "Tracking and Track"
- G4Track::GetCreatorModelID()
- G4Track::SetCreatorModelID()
- Geant4 11.0 Release Notes - Model catalog introduction
