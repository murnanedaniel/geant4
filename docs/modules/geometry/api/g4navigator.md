# G4Navigator

**Location**: `source/geometry/navigation/include/G4Navigator.hh`
**Source**: `source/geometry/navigation/src/G4Navigator.cc`

## Overview

G4Navigator is the **core navigation engine** in Geant4, responsible for tracking particles through complex detector geometries. It provides critical services for locating particles in the geometry hierarchy, computing distances to boundaries, maintaining navigation history, and optimizing safety calculations. Every particle step in a Geant4 simulation relies on G4Navigator to navigate safely and efficiently through the geometry tree.

The navigator maintains a complete history of the current location in the geometry hierarchy, handles transformations between coordinate systems, manages boundary crossings, computes exit normals, and implements sophisticated optimization strategies including voxelization, safety spheres, and zero-step detection.

## Key Features

- **Hierarchical Navigation**: Manages position in nested geometry tree with full history
- **Point Location**: Locates points in geometry with optional relative search optimization
- **Distance Calculation**: Computes distances to boundaries (ComputeStep) and safety distances
- **Boundary Handling**: Detects and processes volume entry/exit with proper normal calculation
- **Coordinate Transformation**: Handles local/global transformations throughout hierarchy
- **Safety Optimization**: Caches safety spheres to skip geometry checks
- **Voxelization Support**: Uses spatial optimization for volumes with many daughters
- **Zero-Step Protection**: Detects and handles stuck particles at boundaries
- **Exit Normal Calculation**: Computes surface normals at boundaries with frame transformations
- **Replica Navigation**: Specialized handling for replica, parameterized, and regular volumes
- **State Management**: Save/restore state for parasitic calls (e.g., field propagation)
- **Multi-Threading Safe**: Designed for thread-safe navigation in parallel simulations

## Class Definition

```cpp
class G4Navigator
{
  public:
    // Constructor and destructor
    G4Navigator();
    ~G4Navigator();

    // Main navigation methods
    G4VPhysicalVolume* LocateGlobalPointAndSetup(
                            const G4ThreeVector& point,
                            const G4ThreeVector* direction = nullptr,
                            const G4bool relativeSearch = true,
                            const G4bool ignoreDirection = true);

    void LocateGlobalPointWithinVolume(const G4ThreeVector& position);

    G4double ComputeStep(const G4ThreeVector& pGlobalpoint,
                        const G4ThreeVector& pDirection,
                        const G4double pCurrentProposedStepLength,
                        G4double& pNewSafety);

    G4double ComputeSafety(const G4ThreeVector& globalpoint,
                          const G4double pProposedMaxLength = DBL_MAX,
                          const G4bool keepState = true);

    // History and state management
    G4TouchableHistory* CreateTouchableHistory() const;
    inline const G4NavigationHistory* GetHistory() const;
    inline void SetWorldVolume(G4VPhysicalVolume* pWorld);
    inline G4VPhysicalVolume* GetWorldVolume() const;

    void ResetHierarchyAndLocate(const G4ThreeVector& p,
                                const G4ThreeVector& direction,
                                const G4TouchableHistory& h);

    // State save/restore for parasitic calls
    void SetSavedState();
    void RestoreSavedState();

    // Boundary crossing state
    inline G4bool EnteredDaughterVolume() const;
    inline G4bool ExitedMotherVolume() const;
    inline G4VPhysicalVolume* GetCurrentVolume() const;

    // Exit normal methods
    G4ThreeVector GetLocalExitNormal(G4bool* valid);
    G4ThreeVector GetGlobalExitNormal(const G4ThreeVector& point, G4bool* valid);

    // Safety sphere methods
    inline G4ThreeVector GetPreviousSafetySphere Origin() const;
    inline G4double GetPreviousSafety() const;

    // Tolerances and limits
    inline G4double GetSurfaceTolerance() const;
    inline void SetPushVerbosity(G4bool mode);

    // Volume characterization
    EVolume VolumeType(const G4VPhysicalVolume* pVol) const;
    EVolume CharacteriseDaughters(const G4LogicalVolume* pLog) const;
    G4int GetDaughtersRegularStructureId(const G4LogicalVolume* pLog) const;

    // Checking and debugging
    inline G4bool IsCheckModeActive() const;
    inline void SetVerboseLevel(G4int level);
    inline G4int GetVerboseLevel() const;
    G4bool CheckOverlaps(G4int res = 1000, G4double tol = 0.0, G4bool verbose = true);

    // Information access
    inline G4bool IsOutsideWorld() const;
    inline G4bool WasLimitedByGeometry() const;

  protected:
    // Internal helper methods
    void SetupHierarchy();
    void ResetStackAndState();
    G4ThreeVector ComputeLocalPoint(const G4ThreeVector& rGlobPoint) const;
    G4ThreeVector ComputeLocalAxis(const G4ThreeVector& rGlobAxis) const;

  private:
    // Navigation history
    G4NavigationHistory fHistory;

    // State flags
    G4bool fEnteredDaughter;
    G4bool fExitedMother;
    G4bool fExiting;
    G4bool fEntering;
    G4bool fLocatedOutsideWorld;
    G4bool fWasLimitedByGeometry;
    G4bool fLastStepWasZero;
    G4bool fValidExitNormal;
    G4bool fCalculatedExitNormal;
    G4bool fChangedGrandMotherRefFrame;

    // Exit normal vectors
    G4ThreeVector fExitNormal;
    G4ThreeVector fGrandMotherExitNormal;
    G4ThreeVector fExitNormalGlobalFrame;

    // Blocking and location tracking
    G4VPhysicalVolume* fBlockedPhysicalVolume;
    G4int fBlockedReplicaNo;
    G4ThreeVector fLastLocatedPointLocal;
    G4ThreeVector fLastStepEndPointLocal;
    G4ThreeVector fStepEndPoint;

    // Safety sphere caching
    G4ThreeVector fPreviousSftOrigin;
    G4double fPreviousSafety;

    // Tolerances
    G4double kCarTolerance;
    G4double fMinStep;
    G4double fSqTol;

    // Sub-navigators
    G4NormalNavigation fnormalNav;
    G4VoxelNavigation* fpvoxelNav;
    G4ParameterisedNavigation fparamNav;
    G4ReplicaNavigation freplicaNav;
    G4RegularNavigation fregularNav;
    G4VExternalNavigation* fpExternalNav;

    // Safety calculator
    G4SafetyCalculator* fpSafetyCalculator;
    G4VoxelSafety* fpVoxelSafety;

    // State saving for parasitic calls
    struct G4SaveNavigatorState {
        G4ThreeVector sExitNormal;
        G4bool sValidExitNormal;
        G4bool sExiting, sEntering;
        G4VPhysicalVolume* spBlockedPhysicalVolume;
        G4int sBlockedReplicaNo;
        G4int sLastStepWasZero;
        G4bool sLocatedOutsideWorld;
        G4bool sWasLimitedByGeometry;
        G4bool sEnteredDaughter, sExitedMother;
        G4ThreeVector sLastLocatedPointLocal;
        G4ThreeVector sPreviousSftOrigin;
        G4double sPreviousSafety;
    } fSaveState;

    // Zero-step protection
    G4int fActionThreshold_NoZeroSteps;
    G4int fAbandonThreshold_NoZeroSteps;
    G4int fNumberZeroSteps;

    // Configuration flags
    G4bool fCheck;
    G4int fVerbose;
    G4bool fPushed, fWarnPush;
};
```

## Core Navigation Methods

### LocateGlobalPointAndSetup()

**Signature**:
```cpp
G4VPhysicalVolume* LocateGlobalPointAndSetup(
    const G4ThreeVector& point,
    const G4ThreeVector* direction = nullptr,
    const G4bool relativeSearch = true,
    const G4bool ignoreDirection = true);
```
**Line**: `source/geometry/navigation/src/G4Navigator.cc:130-586`

Locates a point in the geometry hierarchy and sets up navigation state.

**Parameters**:
- `point` - Global position to locate
- `direction` - Optional direction vector (for resolving edge ambiguities)
- `relativeSearch` - If true, search relative to current position (optimization)
- `ignoreDirection` - If false, use direction to resolve boundary ambiguities

**Returns**: Physical volume containing the point, or nullptr if outside world

**Algorithm**:
```cpp
G4VPhysicalVolume* LocateGlobalPointAndSetup(...) {
    G4bool notKnownContained = true;

    if (!relativeSearch) {
        // Absolute search: start from world volume
        ResetStackAndState();
    } else {
        // Relative search: start from current location
        if (fWasLimitedByGeometry) {
            // Process boundary crossing from last step
            if (fExiting) {
                // Step ended exiting volume - move up in hierarchy
                fBlockedPhysicalVolume = fHistory.GetTopVolume();
                fBlockedReplicaNo = fHistory.GetTopReplicaNo();
                fHistory.BackLevel();  // Go up one level

                if (fHistory.GetDepth() == 0) {
                    // Exited world
                    fLocatedOutsideWorld = true;
                    return nullptr;
                }
            } else if (fEntering) {
                // Step ended entering volume - move down in hierarchy
                switch (VolumeType(fBlockedPhysicalVolume)) {
                    case kNormal:
                        fHistory.NewLevel(fBlockedPhysicalVolume, kNormal, copyNo);
                        break;
                    case kReplica:
                        freplicaNav.ComputeTransformation(replicaNo, volume);
                        fHistory.NewLevel(volume, kReplica, replicaNo);
                        break;
                    case kParameterised:
                        // Update solid and material for this replica
                        pParam->ComputeTransformation(replicaNo, volume);
                        pSolid = pParam->ComputeSolid(replicaNo, volume);
                        pLogical->SetSolid(pSolid);
                        fHistory.NewLevel(volume, kParameterised, replicaNo);
                        break;
                }
            }
        }
    }

    // PHASE 1: Search upward until containing volume found
    while (notKnownContained) {
        targetSolid = fHistory.GetTopVolume()->GetLogicalVolume()->GetSolid();
        localPoint = fHistory.GetTopTransform().TransformPoint(globalPoint);
        insideCode = targetSolid->Inside(localPoint);

        if (insideCode == kInside) {
            break;  // Found containing volume
        }

        if (insideCode == kOutside) {
            // Move up in hierarchy
            if (fHistory.GetDepth() == 0) {
                fLocatedOutsideWorld = true;
                return nullptr;
            }
            fBlockedPhysicalVolume = fHistory.GetTopVolume();
            fHistory.BackLevel();
            continue;
        }

        // insideCode == kSurface
        // Check if exiting based on direction
        if (considerDirection) {
            G4ThreeVector normal = targetSolid->SurfaceNormal(localPoint);
            G4bool directionExiting = (normal.dot(localDirection) > 0);
            if (!directionExiting) {
                break;  // On surface but not exiting
            }
        }

        // Exiting this level
        fBlockedPhysicalVolume = fHistory.GetTopVolume();
        fHistory.BackLevel();
    }

    // PHASE 2: Search downward to deepest containing volume
    do {
        targetPhysical = fHistory.GetTopVolume();
        targetLogical = targetPhysical->GetLogicalVolume();

        switch (CharacteriseDaughters(targetLogical)) {
            case kNormal:
                if (targetLogical->GetVoxelHeader() != nullptr) {
                    // Use voxel navigation (optimized)
                    noResult = GetVoxelNavigator().LevelLocate(
                        fHistory, fBlockedPhysicalVolume, fBlockedReplicaNo,
                        globalPoint, pGlobalDirection, considerDirection, localPoint);
                } else {
                    // Use normal navigation
                    noResult = fnormalNav.LevelLocate(...);
                }
                break;

            case kReplica:
                noResult = freplicaNav.LevelLocate(...);
                break;

            case kParameterised:
                if (GetDaughtersRegularStructureId(targetLogical) != 1) {
                    noResult = fparamNav.LevelLocate(...);
                } else {
                    // Regular structure
                    noResult = fregularNav.LevelLocate(...);
                }
                break;
        }

        if (noResult) {
            // Entered a daughter volume
            fBlockedPhysicalVolume = nullptr;
            fEntering = false;
            fEnteredDaughter = true;
        }
    } while (noResult);  // Continue until deepest level

    fLastLocatedPointLocal = localPoint;
    fLocatedOutsideWorld = false;

    return targetPhysical;
}
```

**Performance Optimization**: `relativeSearch=true` dramatically improves performance by starting from current location rather than world volume.

**Example**:
```cpp
G4Navigator* navigator = new G4Navigator();
navigator->SetWorldVolume(worldPV);

// Initial location (absolute search)
G4ThreeVector point(10*cm, 20*cm, 30*cm);
G4VPhysicalVolume* volume = navigator->LocateGlobalPointAndSetup(point,
                                                                  nullptr,
                                                                  false);  // absolute
G4cout << "Located in: " << volume->GetName() << G4endl;

// Subsequent location nearby (relative search - faster)
G4ThreeVector nearbyPoint(10.1*cm, 20*cm, 30*cm);
G4VPhysicalVolume* nearbyVolume = navigator->LocateGlobalPointAndSetup(
                                      nearbyPoint,
                                      nullptr,
                                      true);  // relative search
```

**Critical Flags Set**:
- `fEntering` / `fExiting` - Boundary crossing status
- `fEnteredDaughter` / `fExitedMother` - Hierarchy change direction
- `fBlockedPhysicalVolume` - Last crossed volume (for next step)
- `fLocatedOutsideWorld` - If point is outside geometry

### LocateGlobalPointWithinVolume()

**Signature**: `void LocateGlobalPointWithinVolume(const G4ThreeVector& position)`
**Line**: `source/geometry/navigation/src/G4Navigator.cc:601-651`

Updates navigator state for point known to be within current volume.

**Purpose**: Faster than full locate when particle hasn't crossed boundary.

**Algorithm**:
```cpp
void LocateGlobalPointWithinVolume(const G4ThreeVector& pGlobalpoint) {
    fLastLocatedPointLocal = ComputeLocalPoint(pGlobalpoint);
    fLastTriedStepComputation = false;
    fChangedGrandMotherRefFrame = false;

    // Update sub-navigators (especially voxel info)
    G4VPhysicalVolume* motherPhysical = fHistory.GetTopVolume();
    G4LogicalVolume* motherLogical = motherPhysical->GetLogicalVolume();

    switch (CharacteriseDaughters(motherLogical)) {
        case kNormal:
            GetVoxelNavigator().RelocateWithinVolume(motherPhysical,
                                                     fLastLocatedPointLocal);
            break;
        case kParameterised:
            fparamNav.RelocateWithinVolume(motherPhysical, fLastLocatedPointLocal);
            break;
        // ... other cases
    }

    // Reset state variables
    fBlockedPhysicalVolume = nullptr;
    fBlockedReplicaNo = -1;
    fEntering = false;
    fEnteredDaughter = false;
    fExiting = false;
    fExitedMother = false;
}
```

**Use Case**: Called when step was limited by physics, not geometry.

**Example**:
```cpp
G4double stepLength = navigator->ComputeStep(position, direction, proposedStep, safety);

if (actualStep < stepLength) {
    // Step limited by physics, not geometry
    // Update position without full relocation
    G4ThreeVector newPosition = position + actualStep * direction;
    navigator->LocateGlobalPointWithinVolume(newPosition);
} else {
    // Step limited by geometry - boundary crossed
    // Need full locate
    navigator->LocateGlobalPointAndSetup(newPosition, &direction, true, false);
}
```

### ComputeStep()

**Signature**:
```cpp
G4double ComputeStep(const G4ThreeVector& pGlobalpoint,
                    const G4ThreeVector& pDirection,
                    const G4double pCurrentProposedStepLength,
                    G4double& pNewSafety);
```
**Line**: `source/geometry/navigation/src/G4Navigator.cc:751-1097`

**Most Performance-Critical Method**: Computes distance to next geometry boundary.

**Parameters**:
- `pGlobalpoint` - Current global position
- `pDirection` - Movement direction (unit vector)
- `pCurrentProposedStepLength` - Maximum step length to consider
- `pNewSafety` [out] - Updated safety distance

**Returns**: Distance to boundary (≤ proposedStepLength), or kInfinity if no boundary

**Algorithm**:
```cpp
G4double ComputeStep(const G4ThreeVector& pGlobalpoint,
                    const G4ThreeVector& pDirection,
                    const G4double pCurrentProposedStepLength,
                    G4double& pNewSafety) {
    // Transform to local coordinates
    G4ThreeVector localDirection = ComputeLocalAxis(pDirection);
    G4double Step = kInfinity;

    // Reset exit normal state
    fExitNormalGlobalFrame = G4ThreeVector(0, 0, 0);
    fChangedGrandMotherRefFrame = false;
    fGrandMotherExitNormal = G4ThreeVector(0, 0, 0);
    fCalculatedExitNormal = false;

    G4ThreeVector newLocalPoint = ComputeLocalPoint(pGlobalpoint);

    // Check if point moved significantly from last location
    if (newLocalPoint != fLastLocatedPointLocal) {
        G4double moveLenSq = (newLocalPoint - fLastLocatedPointLocal).mag2();
        if (moveLenSq >= fSqTol) {
            // Relocate within volume
            LocateGlobalPointWithinVolume(pGlobalpoint);
        }
    }

    G4VPhysicalVolume* motherPhysical = fHistory.GetTopVolume();
    G4LogicalVolume* motherLogical = motherPhysical->GetLogicalVolume();

    // Delegate to appropriate sub-navigator based on daughter type
    switch (CharacteriseDaughters(motherLogical)) {
        case kNormal:
            if (motherLogical->GetVoxelHeader() != nullptr) {
                // Voxel navigation (optimized for many daughters)
                Step = GetVoxelNavigator().ComputeStep(
                    fLastLocatedPointLocal, localDirection,
                    pCurrentProposedStepLength, pNewSafety,
                    fHistory, fValidExitNormal, fExitNormal,
                    fExiting, fEntering,
                    &fBlockedPhysicalVolume, fBlockedReplicaNo);
            } else {
                // Normal navigation (loop through daughters)
                Step = fnormalNav.ComputeStep(...);
            }
            break;

        case kReplica:
            Step = freplicaNav.ComputeStep(...);
            break;

        case kParameterised:
            if (GetDaughtersRegularStructureId(motherLogical) == 1) {
                // Regular navigation (skip voxels of same material)
                Step = fregularNav.ComputeStepSkippingEqualMaterials(...);
            } else {
                Step = fparamNav.ComputeStep(...);
            }
            break;
    }

    // Check for zero steps
    if (Step == 0.0) {
        ++fNumberZeroSteps;
        if (fNumberZeroSteps > fActionThreshold_NoZeroSteps) {
            // Stuck particle - take action
            if (fNumberZeroSteps > fAbandonThreshold_NoZeroSteps) {
                G4Exception("G4Navigator::ComputeStep()", "GeomNav1002",
                           EventMustBeAborted, "Track stuck at boundary");
            }
        }
    } else {
        fNumberZeroSteps = 0;
    }

    fWasLimitedByGeometry = (Step < pCurrentProposedStepLength);
    fLastTriedStepComputation = true;

    return Step;
}
```

**Performance Optimizations**:
1. **Voxel Navigation**: Uses spatial subdivision for volumes with many daughters
2. **Regular Navigation**: Skips voxels with identical materials
3. **Early Relocation Check**: Avoids redundant LocateWithinVolume calls
4. **Safety Sphere**: Pre-computed safety distances skip checks

**Example**:
```cpp
G4ThreeVector position(10*cm, 0, 0);
G4ThreeVector direction(1, 0, 0);
G4double proposedStep = 5*cm;
G4double safety;

G4double distance = navigator->ComputeStep(position, direction,
                                           proposedStep, safety);

if (distance < proposedStep) {
    G4cout << "Will hit boundary at: " << distance/mm << " mm" << G4endl;

    // Take step to boundary
    G4ThreeVector newPosition = position + distance * direction;
    navigator->LocateGlobalPointAndSetup(newPosition, &direction, true, false);

    if (navigator->EnteredDaughterVolume()) {
        G4cout << "Entered: " << navigator->GetCurrentVolume()->GetName() << G4endl;
    } else if (navigator->ExitedMotherVolume()) {
        G4cout << "Exited mother volume" << G4endl;
    }
} else {
    G4cout << "No boundary within proposed step" << G4endl;
    G4cout << "Safety distance: " << safety/mm << " mm" << G4endl;
}
```

### ComputeSafety()

**Signature**:
```cpp
G4double ComputeSafety(const G4ThreeVector& globalpoint,
                      const G4double pProposedMaxLength = DBL_MAX,
                      const G4bool keepState = true);
```
**Line**: `source/geometry/navigation/src/G4Navigator.cc` (various implementations)

Computes isotropic safety - maximum radius sphere around point that contains no boundaries.

**Parameters**:
- `globalpoint` - Point to compute safety from
- `pProposedMaxLength` - Maximum safety to compute (optimization)
- `keepState` - If true, preserve navigator state

**Returns**: Safety distance (radius of largest sphere with no boundaries)

**Algorithm**:
```cpp
G4double ComputeSafety(const G4ThreeVector& globalpoint,
                      const G4double pProposedMaxLength,
                      const G4bool keepState) {
    // Check safety sphere cache
    G4double distSq = (globalpoint - fPreviousSftOrigin).mag2();
    if (distSq < fPreviousSafety * fPreviousSafety) {
        // Inside cached safety sphere
        return std::sqrt(fPreviousSafety * fPreviousSafety - distSq);
    }

    // Need to compute new safety
    G4double safety;

    // Use appropriate safety calculator
    if (fHistory.GetTopVolumeType() != kReplica) {
        G4VPhysicalVolume* motherPhysical = fHistory.GetTopVolume();
        G4LogicalVolume* motherLogical = motherPhysical->GetLogicalVolume();

        if (motherLogical->GetVoxelHeader() != nullptr) {
            // Use voxel safety (optimized)
            safety = fpVoxelSafety->ComputeSafety(localPoint, fHistory,
                                                  pProposedMaxLength);
        } else {
            // Use normal safety calculation
            safety = fnormalNav.ComputeSafety(localPoint, fHistory,
                                             pProposedMaxLength);
        }
    } else {
        safety = freplicaNav.ComputeSafety(...);
    }

    // Update safety sphere cache
    fPreviousSftOrigin = globalpoint;
    fPreviousSafety = safety;

    return safety;
}
```

**Caching**: Safety sphere dramatically improves performance for multiple safety queries.

**Use Case**: Determining if particle can travel proposed distance without geometry checks.

**Example**:
```cpp
G4ThreeVector position(10*cm, 5*cm, 0);
G4double safety = navigator->ComputeSafety(position);

G4cout << "Safety radius: " << safety/mm << " mm" << G4endl;
G4cout << "Can move " << safety << " in any direction without hitting boundary" << G4endl;

// Use safety to skip geometry checks
G4double proposedStep = 1*mm;
if (proposedStep < safety) {
    // Guaranteed no boundary crossing - skip ComputeStep
    G4cout << "Step is safe, no boundary check needed" << G4endl;
} else {
    // Must check for boundaries
    G4double distance = navigator->ComputeStep(position, direction,
                                               proposedStep, safety);
}
```

## Exit Normal Methods

### GetLocalExitNormal() / GetGlobalExitNormal()

**Purpose**: Retrieve surface normal at boundary crossing.

**Signature**:
```cpp
G4ThreeVector GetLocalExitNormal(G4bool* valid);
G4ThreeVector GetGlobalExitNormal(const G4ThreeVector& point, G4bool* valid);
```

**Parameters**:
- `valid` [out] - Set to true if normal is reliable

**Returns**: Unit normal vector pointing outward from exited volume

**Algorithm** (GetGlobalExitNormal):
```cpp
G4ThreeVector GetGlobalExitNormal(const G4ThreeVector& point, G4bool* valid) {
    if (!fCalculatedExitNormal) {
        // Compute exit normal on demand
        G4ThreeVector localNormal = GetLocalExitNormal(&fValidExitNormal);

        // Transform to global frame
        if (fChangedGrandMotherRefFrame) {
            // Normal requires transformation through multiple frames
            fExitNormalGlobalFrame = fGrandMotherExitNormal;
        } else {
            // Transform from current level to global
            G4AffineTransform& tf = fHistory.GetTopTransform();
            fExitNormalGlobalFrame = tf.InverseTransformAxis(localNormal);
        }

        fCalculatedExitNormal = true;
    }

    *valid = fValidExitNormal;
    return fExitNormalGlobalFrame;
}
```

**Example**:
```cpp
G4double step = navigator->ComputeStep(position, direction, proposedStep, safety);

// Take step to boundary
G4ThreeVector endPoint = position + step * direction;
navigator->LocateGlobalPointAndSetup(endPoint, &direction, true, false);

if (navigator->ExitedMotherVolume()) {
    G4bool validNormal;
    G4ThreeVector normal = navigator->GetGlobalExitNormal(endPoint, &validNormal);

    if (validNormal) {
        G4cout << "Exit normal: " << normal << G4endl;

        // Check if normal points outward (should be opposite to direction)
        G4double cosAngle = normal.dot(direction);
        G4cout << "Cos(angle): " << cosAngle << " (should be < 0)" << G4endl;
    } else {
        G4cout << "Normal is not valid (non-convex surface or edge)" << G4endl;
    }
}
```

## State Management

### SetSavedState() / RestoreSavedState()

**Purpose**: Save/restore navigator state for parasitic calls (e.g., field propagation).

**Line**: SetSavedState: `source/geometry/navigation/src/G4Navigator.cc:663-689`

**Use Case**: When making "what-if" queries without affecting main navigation state.

**Example**:
```cpp
// Save current state
navigator->SetSavedState();

// Make parasitic call (doesn't affect main tracking)
G4ThreeVector testPoint = position + 0.1*mm * testDirection;
G4VPhysicalVolume* testVolume = navigator->LocateGlobalPointAndSetup(testPoint);

// Check result
if (testVolume != nullptr) {
    G4cout << "Test point is in: " << testVolume->GetName() << G4endl;
}

// Restore original state
navigator->RestoreSavedState();
// Navigator state now exactly as before parasitic call
```

### ResetHierarchyAndLocate()

**Signature**:
```cpp
G4VPhysicalVolume* ResetHierarchyAndLocate(const G4ThreeVector& p,
                                          const G4ThreeVector& direction,
                                          const G4TouchableHistory& h);
```
**Line**: `source/geometry/navigation/src/G4Navigator.cc:100-110`

Resets navigator history to given touchable and locates point.

**Use Case**: Restoring navigation state from stored touchable.

## History and Touchable

### GetHistory() / CreateTouchableHistory()

**Example**:
```cpp
// Get current navigation history
const G4NavigationHistory* history = navigator->GetHistory();
G4cout << "Current depth: " << history->GetDepth() << G4endl;

// Create touchable for current location
G4TouchableHistory* touchable = navigator->CreateTouchableHistory();

// Later, restore this location
navigator->ResetHierarchyAndLocate(point, direction, *touchable);
```

## Volume Characterization

### VolumeType() / CharacteriseDaughters()

**Purpose**: Determine navigation strategy for volume.

**Returns**:
- `kNormal` - Regular positioned volumes
- `kReplica` - Replica volumes (linear, circular, etc.)
- `kParameterised` - Parameterized volumes
- `kExternal` - External navigation (user-defined)

**Example**:
```cpp
G4VPhysicalVolume* volume = navigator->GetCurrentVolume();
EVolume volType = navigator->VolumeType(volume);

switch (volType) {
    case kNormal:
        G4cout << "Normal volume" << G4endl;
        break;
    case kReplica:
        G4cout << "Replica volume" << G4endl;
        break;
    case kParameterised:
        G4cout << "Parameterised volume" << G4endl;
        break;
}
```

## Performance Considerations

### Computational Complexity

| Operation | Complexity | Optimization |
|-----------|------------|--------------|
| **LocateGlobalPointAndSetup** (absolute) | O(depth × siblings) | Start from world |
| **LocateGlobalPointAndSetup** (relative) | O(1) to O(depth) | Start from current |
| **ComputeStep** (voxelized) | O(log N + k) | Spatial subdivision |
| **ComputeStep** (non-voxelized) | O(N) | Check all daughters |
| **ComputeSafety** (cached) | O(1) | Safety sphere check |
| **ComputeSafety** (fresh) | O(N) | Check all boundaries |

Where:
- depth = hierarchy depth
- siblings = number of sister volumes
- N = number of daughter volumes
- k = daughters in relevant voxels

### Best Practices

#### 1. Use Relative Search

```cpp
// GOOD: Relative search for subsequent steps
navigator->LocateGlobalPointAndSetup(point1, nullptr, false);  // Initial (absolute)
navigator->LocateGlobalPointAndSetup(point2, nullptr, true);   // Subsequent (relative)

// BAD: Always absolute search
navigator->LocateGlobalPointAndSetup(point1, nullptr, false);
navigator->LocateGlobalPointAndSetup(point2, nullptr, false);  // Slow!
```

#### 2. Leverage Safety Sphere

```cpp
// GOOD: Use safety to skip geometry checks
G4double safety = navigator->ComputeSafety(position);
if (proposedStep < safety) {
    // Skip ComputeStep - guaranteed safe
} else {
    distance = navigator->ComputeStep(...);
}

// BAD: Always compute step
distance = navigator->ComputeStep(...);  // Unnecessary if within safety
```

#### 3. Use LocateWithinVolume When Appropriate

```cpp
// GOOD: Different methods for different cases
if (stepLimitedByGeometry) {
    // Boundary crossed - need full locate
    navigator->LocateGlobalPointAndSetup(newPosition, &direction, true, false);
} else {
    // Step limited by physics - just update position
    navigator->LocateGlobalPointWithinVolume(newPosition);
}

// BAD: Always use full locate
navigator->LocateGlobalPointAndSetup(newPosition, &direction, true, false);
```

#### 4. Enable Voxelization for Complex Volumes

```cpp
// For logical volumes with many daughters (>4), create voxels
G4LogicalVolume* complexLV = new G4LogicalVolume(...);
// Add many daughters...
for (int i = 0; i < 1000; ++i) {
    new G4PVPlacement(..., complexLV);
}

// Geant4 automatically creates voxels during geometry optimization
// Can verify: complexLV->GetVoxelHeader() != nullptr after geometry closed
```

## Common Usage Patterns

### Pattern 1: Particle Tracking Loop

```cpp
G4Navigator* navigator = new G4Navigator();
navigator->SetWorldVolume(worldPV);

G4ThreeVector position = initialPosition;
G4ThreeVector direction = initialDirection;
G4double totalDistance = 0;

// Initial location
G4VPhysicalVolume* currentVolume = navigator->LocateGlobalPointAndSetup(
                                        position, nullptr, false);

while (totalDistance < maxTrackLength) {
    // Compute next step
    G4double proposedStep = 1*cm;
    G4double safety;
    G4double step = navigator->ComputeStep(position, direction,
                                           proposedStep, safety);

    // Move to new position
    position = position + step * direction;
    totalDistance += step;

    // Update navigation
    currentVolume = navigator->LocateGlobalPointAndSetup(position,
                                                         &direction,
                                                         true,  // relative
                                                         false); // use direction

    // Process boundary crossing
    if (navigator->EnteredDaughterVolume()) {
        G4cout << "Entered: " << currentVolume->GetName() << G4endl;
    } else if (navigator->ExitedMotherVolume()) {
        G4cout << "Exited mother" << G4endl;

        // Get exit normal
        G4bool validNormal;
        G4ThreeVector normal = navigator->GetGlobalExitNormal(position,
                                                              &validNormal);
        if (validNormal) {
            // Process reflection, refraction, etc.
        }
    }

    if (step == 0) {
        G4cout << "Warning: Zero step!" << G4endl;
        break;  // Avoid infinite loop
    }
}
```

### Pattern 2: Geometry Sampling

```cpp
// Sample points in geometry to check material distribution
for (int i = 0; i < nPoints; ++i) {
    G4ThreeVector testPoint = GetRandomPoint();

    G4VPhysicalVolume* volume = navigator->LocateGlobalPointAndSetup(
                                    testPoint, nullptr, false);

    if (volume != nullptr) {
        G4Material* material = volume->GetLogicalVolume()->GetMaterial();
        G4cout << "Point " << testPoint << " is in " << material->GetName() << G4endl;
    } else {
        G4cout << "Point " << testPoint << " is outside world" << G4endl;
    }
}
```

### Pattern 3: Safety-Based Optimization

```cpp
// Skip detailed tracking in regions with large safety
G4ThreeVector position = currentPosition;
G4double remainingPath = totalPathLength;

while (remainingPath > 0) {
    G4double safety = navigator->ComputeSafety(position);

    if (remainingPath < safety) {
        // Can travel remaining distance without geometry checks
        position = position + remainingPath * direction;
        navigator->LocateGlobalPointWithinVolume(position);
        break;
    }

    // Need to check for boundaries
    G4double newSafety;
    G4double step = navigator->ComputeStep(position, direction,
                                           remainingPath, newSafety);

    position = position + step * direction;
    remainingPath -= step;

    navigator->LocateGlobalPointAndSetup(position, &direction, true, false);

    // Process boundary if needed
}
```

## See Also

- [G4NavigationHistory](g4navigationhistory.md) - History stack for geometry hierarchy
- [G4VoxelNavigation](g4voxelnavigation.md) - Voxel-based spatial optimization
- [G4TouchableHistory](g4touchablehistory.md) - Geometric location handle
- [G4VPhysicalVolume](g4vphysicalvolume.md) - Physical volume placement
- [G4VSolid](g4vsolid.md) - Solid shapes with Inside/Distance methods
- [Geometry Module Overview](../index.md) - Complete module documentation

## References

### Source Files
- Header: `source/geometry/navigation/include/G4Navigator.hh`
- Implementation: `source/geometry/navigation/src/G4Navigator.cc`
- Sub-navigators: `source/geometry/navigation/include/G4*Navigation.hh`

### Key Algorithms
- **Hierarchy Traversal**: Up-then-down search through volume tree
- **Voxel Optimization**: Spatial subdivision for fast daughter lookup
- **Safety Sphere**: Cached isotropic safety for skip-ahead optimization
- **Zero-Step Detection**: Stuck particle prevention
- **Exit Normal Calculation**: Frame transformations for surface normals

### Performance Tips
1. Use relative search for sequential steps (10-100× faster)
2. Enable voxelization for volumes with >4 daughters
3. Use safety sphere to skip ComputeStep when safe
4. Use LocateWithinVolume when step limited by physics
5. Save/restore state for parasitic calls (field propagation)

### External Documentation
- [Geant4 User Guide: Navigation](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomNav.html)
- [Geant4 Physics Reference Manual: Transportation](http://geant4-userdoc.web.cern.ch/geant4-userdoc/UsersGuides/PhysicsReferenceManual/html/index.html)
