# G4VTask

Abstract base class for thread pool tasks.

## Header

```cpp
#include "G4VTask.hh"
```

## Source Location

- Header: `source/global/management/include/G4VTask.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/VTask.hh`

## Overview

G4VTask is a type alias to `PTL::VTask`, providing the abstract base class for all tasks in the thread pool system. It defines the interface that all tasks must implement.

## Type Definition

```cpp
using G4VTask = PTL::VTask;
```

## Interface

```cpp
class VTask {
public:
    virtual ~VTask() = default;
    virtual void operator()() = 0;  // Execute task

    bool is_native_task() const;
    intmax_t depth() const;
};
```

## Methods

### operator()()
```cpp
virtual void operator()() = 0
```
Pure virtual function to execute the task. Must be implemented by derived classes.

---

### is_native_task()
```cpp
bool is_native_task() const
```
Checks if task is native (non-TBB).

**Returns:** `true` for native tasks, `false` for TBB tasks

---

### depth()
```cpp
intmax_t depth() const
```
Returns task nesting depth.

**Returns:** Depth value

## Usage

Typically not used directly. Use G4Task<> template instead.

```cpp
// Derived task class
class MyTask : public G4VTask {
public:
    void operator()() override {
        // Task implementation
        DoWork();
    }
};
```

## See Also

- G4Task - Concrete task template
- G4ThreadPool - Thread pool
- G4TaskGroup - Task grouping

## Notes

1. **Abstract Base**: Not instantiated directly
2. **Polymorphic**: Enables runtime polymorphism
3. **PTL Backend**: Implemented in PTL

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
