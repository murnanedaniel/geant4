# G4FastSimulationVector

## Overview

`G4FastSimulationVector` is a specialized container class that extends `std::vector<T*>` with additional methods for managing pointers to fast simulation objects. It provides convenient operations for removing elements and cleaning up memory, simplifying the management of model and manager collections in the fast simulation framework.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastSimulationVector.hh`
**Implementation:** `source/processes/parameterisation/include/G4FastSimulationVector.icc` (inline)
**Type:** Template Container Class
:::

## Purpose

This class provides:
- **Pointer management**: Store pointers to fast simulation objects
- **Safe removal**: Remove elements by pointer or index
- **Memory cleanup**: Clear and delete all pointed-to objects
- **STL compatibility**: Inherits from `std::vector<T*>`, fully compatible
- **Internal use**: Primarily used by framework, not typically by users

## Class Definition

**Lines 48-65** in `source/processes/parameterisation/include/G4FastSimulationVector.hh`

```cpp
template<class T>
class G4FastSimulationVector : public std::vector<T*>
{
    using std_pvector = std::vector<T*>;
    using iterator = typename std_pvector::iterator;
    using const_iterator = typename std_pvector::const_iterator;

  public:
    G4FastSimulationVector() = default;
    virtual ~G4FastSimulationVector() = default;

    // Remove element by pointer
    T* remove(const T* element);

    // Remove element by index
    T* removeAt(G4int index);

    // Clear and delete all elements
    void clearAndDestroy();
};
```

## Template Parameter

**Type**: `T` must be a pointer type (e.g., `G4VFastSimulationModel*`, `G4FastSimulationManager*`)

**Usage**:
```cpp
// Used internally by the framework
G4FastSimulationVector<G4VFastSimulationModel> modelList;
G4FastSimulationVector<G4FastSimulationManager> managerList;
```

## Methods

### remove

**Implementation** in `G4FastSimulationVector.icc`:

```cpp
template<class T>
T* G4FastSimulationVector<T>::remove(const T* element)
```

**Purpose**: Remove an element by comparing pointer values.

**Parameters**:
- `element`: Pointer to the element to remove

**Return**: Pointer to the removed element, or `nullptr` if not found

**Behavior**:
- Searches for element by pointer comparison
- If found, removes from vector (does NOT delete)
- Returns pointer to removed element
- Caller is responsible for deletion if needed

**Example** (internal framework use):
```cpp
G4FastSimulationVector<G4VFastSimulationModel> modelList;

// Add models
modelList.push_back(model1);
modelList.push_back(model2);

// Remove model2 (doesn't delete it)
G4VFastSimulationModel* removed = modelList.remove(model2);

if (removed != nullptr) {
    // Can still use or delete the model
    delete removed;
}
```

### removeAt

**Implementation** in `G4FastSimulationVector.icc`:

```cpp
template<class T>
T* G4FastSimulationVector<T>::removeAt(G4int index)
```

**Purpose**: Remove an element by index.

**Parameters**:
- `index`: Zero-based index of element to remove

**Return**: Pointer to the removed element

**Behavior**:
- Removes element at specified index
- Does NOT delete the pointed-to object
- Caller responsible for deletion

**Example** (internal framework use):
```cpp
G4FastSimulationVector<G4VFastSimulationModel> modelList;

// Remove first model
if (modelList.size() > 0) {
    G4VFastSimulationModel* removed = modelList.removeAt(0);
    delete removed;
}
```

### clearAndDestroy

**Implementation** in `G4FastSimulationVector.icc`:

```cpp
template<class T>
void G4FastSimulationVector<T>::clearAndDestroy()
```

**Purpose**: Delete all pointed-to objects and clear the vector.

**Behavior**:
1. Iterates through all elements
2. Calls `delete` on each pointer
3. Clears the vector

**Important**: Destructive operation - all objects are deleted!

**Example** (internal framework use):
```cpp
G4FastSimulationVector<G4VFastSimulationModel> modelList;

// ... add models ...

// Clean up at end of run
modelList.clearAndDestroy();  // Deletes all models, clears vector
```

## Internal Framework Usage

This class is used internally by the fast simulation framework for managing collections:

### In G4FastSimulationManager

**Lines 154-156** in `G4FastSimulationManager.hh`:

```cpp
G4FastSimulationVector<G4VFastSimulationModel> ModelList;
G4FastSimulationVector<G4VFastSimulationModel> fInactivatedModels;
G4FastSimulationVector<G4VFastSimulationModel> fApplicableModelList;
```

**Usage**:
- `ModelList`: Active models for this manager
- `fInactivatedModels`: Temporarily disabled models
- `fApplicableModelList`: Models applicable to current particle type

### In G4GlobalFastSimulationManager

**Lines 152-153** in `G4GlobalFastSimulationManager.hh`:

```cpp
G4FastSimulationVector<G4FastSimulationManager> ManagedManagers;
G4FastSimulationVector<G4FastSimulationManagerProcess> fFSMPVector;
```

**Usage**:
- `ManagedManagers`: All fast simulation managers in the geometry
- `fFSMPVector`: All fast simulation manager processes

## STL Compatibility

Since `G4FastSimulationVector` inherits from `std::vector<T*>`, all standard vector operations are available:

```cpp
G4FastSimulationVector<G4VFastSimulationModel> models;

// Standard vector operations work
models.push_back(model);
models.size();
models.empty();
models.clear();  // Doesn't delete objects
models.begin();
models.end();
models[i];
models.at(i);

// Range-based for loop
for (auto* model : models) {
    // Use model...
}

// Iterator-based loop
for (auto it = models.begin(); it != models.end(); ++it) {
    G4VFastSimulationModel* model = *it;
    // Use model...
}
```

## Key Differences from std::vector

| **Operation** | **std::vector::clear()** | **clearAndDestroy()** |
|---------------|-------------------------|----------------------|
| Removes elements | Yes | Yes |
| Deletes pointed objects | No | Yes |
| Safe for subsequent use | Yes | Yes (but objects gone) |

| **Operation** | **std::vector::erase()** | **remove()/removeAt()** |
|---------------|--------------------------|-------------------------|
| Removes element | Yes | Yes |
| Deletes pointed object | No | No |
| Returns removed pointer | No | Yes |

## When to Use (User Perspective)

**Typical users should NOT use this class directly**. It's an internal framework class.

However, if you're implementing advanced custom fast simulation infrastructure, you might use it:

```cpp
// Advanced: Custom model manager
class MyCustomModelManager
{
private:
    G4FastSimulationVector<MyCustomModel> fModels;

public:
    void AddModel(MyCustomModel* model) {
        fModels.push_back(model);
    }

    void RemoveModel(MyCustomModel* model) {
        MyCustomModel* removed = fModels.remove(model);
        if (removed) {
            delete removed;
        }
    }

    ~MyCustomModelManager() {
        fModels.clearAndDestroy();  // Clean up all models
    }
};
```

## Complete Internal Framework Example

This shows how the framework uses the class internally:

```cpp
// In G4FastSimulationManager.cc
void G4FastSimulationManager::AddFastSimulationModel(
    G4VFastSimulationModel* model)
{
    ModelList.push_back(model);
    fLastCrossedParticle = nullptr;  // Force rebuild of applicable list
}

void G4FastSimulationManager::RemoveFastSimulationModel(
    G4VFastSimulationModel* model)
{
    // Try to remove from active list
    if (ModelList.remove(model) == nullptr) {
        // Not in active list, try inactivated list
        fInactivatedModels.remove(model);
    }
    fLastCrossedParticle = nullptr;
}

G4bool G4FastSimulationManager::InActivateFastSimulationModel(
    const G4String& modelName)
{
    for (size_t i = 0; i < ModelList.size(); ++i) {
        if (ModelList[i]->GetName() == modelName) {
            // Move from active to inactive list
            G4VFastSimulationModel* model = ModelList.removeAt(i);
            fInactivatedModels.push_back(model);
            fLastCrossedParticle = nullptr;
            return true;
        }
    }
    return false;
}

G4bool G4FastSimulationManager::ActivateFastSimulationModel(
    const G4String& modelName)
{
    for (size_t i = 0; i < fInactivatedModels.size(); ++i) {
        if (fInactivatedModels[i]->GetName() == modelName) {
            // Move from inactive to active list
            G4VFastSimulationModel* model = fInactivatedModels.removeAt(i);
            ModelList.push_back(model);
            fLastCrossedParticle = nullptr;
            return true;
        }
    }
    return false;
}
```

## Memory Management

### Ownership Semantics

The container stores **pointers** and provides convenience methods, but:

- `push_back()`: Does NOT take ownership
- `remove()`/`removeAt()`: Does NOT delete (returns pointer for caller to manage)
- `clearAndDestroy()`: DOES delete all objects (destructive)
- `clear()` (inherited): Does NOT delete

**Typical Pattern**:
```cpp
// Framework creates and manages
G4FastSimulationVector<G4VFastSimulationModel> models;

// Add (framework takes ownership conceptually)
models.push_back(new MyModel());

// Eventually, clean up all at once
models.clearAndDestroy();  // Deletes all models
```

### Avoiding Memory Leaks

```cpp
// WRONG - memory leak
G4FastSimulationVector<MyClass> vec;
vec.push_back(new MyClass());
vec.clear();  // Leaks! Objects not deleted

// CORRECT - no leak
G4FastSimulationVector<MyClass> vec;
vec.push_back(new MyClass());
vec.clearAndDestroy();  // Deletes all objects

// ALSO CORRECT - manual cleanup before clear
for (auto* obj : vec) {
    delete obj;
}
vec.clear();
```

## Best Practices

1. **Use clearAndDestroy for cleanup**: When you're done with all objects

2. **Manual delete after remove**: If you remove individual elements
   ```cpp
   T* removed = vec.remove(element);
   if (removed) delete removed;
   ```

3. **Don't mix ownership models**: Be consistent about who owns the objects

4. **Prefer STL operations**: Use standard vector operations when possible

5. **Document ownership**: Make it clear who's responsible for deletion

## Implementation Notes

The class is template-based and inline-implemented in `.icc` file for performance:

**Lines 64** in header:
```cpp
#include "G4FastSimulationVector.icc"
```

This is a common Geant4 pattern for template classes.

## Advanced: Custom Container

If you need similar functionality for your own classes:

```cpp
template<class T>
class MyPointerVector : public std::vector<T*>
{
public:
    ~MyPointerVector() {
        clearAndDestroy();
    }

    T* remove(const T* element) {
        auto it = std::find(this->begin(), this->end(), element);
        if (it != this->end()) {
            T* removed = *it;
            this->erase(it);
            return removed;
        }
        return nullptr;
    }

    void clearAndDestroy() {
        for (auto* ptr : *this) {
            delete ptr;
        }
        this->clear();
    }
};
```

## Debugging

### Check for Leaks

```cpp
// Track allocations
static int nCreated = 0;
static int nDeleted = 0;

class TrackedModel : public G4VFastSimulationModel {
public:
    TrackedModel() { nCreated++; }
    ~TrackedModel() override { nDeleted++; }
};

// In your code
G4FastSimulationVector<TrackedModel> models;
// ... use models ...
models.clearAndDestroy();

G4cout << "Created: " << nCreated << ", Deleted: " << nDeleted << G4endl;
if (nCreated != nDeleted) {
    G4cerr << "MEMORY LEAK DETECTED!" << G4endl;
}
```

## Limitations

1. **Template only**: Can't store mixed types in one vector
2. **Pointer-only**: Doesn't work with value types
3. **No smart pointers**: Designed for raw pointers only
4. **Manual memory**: No automatic RAII (except `clearAndDestroy`)

## Modern Alternatives

In modern C++, you might prefer:

```cpp
// Modern C++ alternative (not used by Geant4 framework)
std::vector<std::unique_ptr<G4VFastSimulationModel>> models;

// Automatic cleanup
models.clear();  // unique_ptr deletes automatically

// Move semantics
models.push_back(std::make_unique<MyModel>());
```

However, Geant4 uses raw pointers for backward compatibility and explicit control.

## Related Classes

- [G4FastSimulationManager](G4FastSimulationManager.md) - Uses this container for model lists
- [G4GlobalFastSimulationManager](G4GlobalFastSimulationManager.md) - Uses this for manager lists
- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Objects stored in these vectors

## References

- Main overview: [Parameterisation Module](../index.md)
- History: Lines 36-38 in header (first implementation May 2000)
- STL `std::vector` documentation for inherited functionality
