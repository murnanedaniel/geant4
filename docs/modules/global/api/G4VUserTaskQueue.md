# G4VUserTaskQueue

Abstract base class for custom task queue implementations.

## Header

```cpp
#include "G4VUserTaskQueue.hh"
```

## Source Location

- Header: `source/global/management/include/G4VUserTaskQueue.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/VUserTaskQueue.hh`

## Overview

G4VUserTaskQueue is a type alias to `PTL::VUserTaskQueue`, providing the abstract interface for task queues used by G4ThreadPool. Inherit from this to create custom queue implementations with specialized scheduling.

## Type Definition

```cpp
using G4VUserTaskQueue = PTL::VUserTaskQueue;
```

## Interface

```cpp
class VUserTaskQueue {
public:
    virtual task_pointer GetTask(intmax_t subq = -1, intmax_t nitr = -1) = 0;
    virtual intmax_t InsertTask(task_pointer&&, ThreadData* = nullptr,
                                intmax_t subq = -1) = 0;
    virtual void Wait() = 0;
    virtual intmax_t GetThreadBin() const = 0;
    virtual void resize(intmax_t) = 0;

    virtual size_type size() const = 0;
    virtual bool empty() const = 0;
    virtual size_type bin_size(size_type bin) const = 0;
    virtual bool bin_empty(size_type bin) const = 0;

    virtual void ExecuteOnAllThreads(ThreadPool* tp, function_type f) = 0;
    virtual void ExecuteOnSpecificThreads(ThreadIdSet tid_set,
                                         ThreadPool* tp, function_type f) = 0;

    virtual VUserTaskQueue* clone() = 0;

    intmax_t workers() const;
};
```

## Pure Virtual Methods

Must be implemented by derived classes:

- `GetTask()` - Retrieve task for execution
- `InsertTask()` - Add task to queue
- `Wait()` - Wait for tasks
- `GetThreadBin()` - Get thread's bin/sub-queue
- `resize()` - Resize queue
- `size()` / `empty()` - Query state
- `bin_size()` / `bin_empty()` - Query sub-queue state
- `ExecuteOnAllThreads()` - Execute on all threads
- `ExecuteOnSpecificThreads()` - Execute on specific threads
- `clone()` - Create copy of queue

## Custom Queue Example

```cpp
class PriorityTaskQueue : public G4VUserTaskQueue {
public:
    PriorityTaskQueue(intmax_t nworkers)
        : G4VUserTaskQueue(nworkers) {}

    task_pointer GetTask(intmax_t subq, intmax_t nitr) override {
        // Custom priority-based retrieval
        return GetHighestPriorityTask();
    }

    intmax_t InsertTask(task_pointer&& task, ThreadData* data,
                       intmax_t subq) override {
        // Custom priority-based insertion
        int priority = task->GetPriority();
        queues[priority].push(std::move(task));
        return priority;
    }

    // Implement other pure virtuals...
};
```

## Usage

```cpp
// Use custom queue in thread pool
G4ThreadPool::Config config;
config.task_queue = new PriorityTaskQueue(nthreads);
G4ThreadPool pool(config);
```

## See Also

- G4UserTaskQueue - Concrete implementation
- G4ThreadPool - Uses task queues
- PTL::VUserTaskQueue - Implementation base

## Notes

1. **Abstract Base**: Cannot instantiate directly
2. **Customization Point**: Implement for custom scheduling
3. **Work-Stealing**: G4UserTaskQueue implements work-stealing
4. **Priority Queues**: Possible via custom implementation

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
