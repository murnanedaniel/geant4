# G4UserTaskQueue

Concrete task queue implementation with work-stealing and load balancing.

## Header

```cpp
#include "G4UserTaskQueue.hh"
```

## Source Location

- Header: `source/global/management/include/G4UserTaskQueue.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/UserTaskQueue.hh`

## Overview

G4UserTaskQueue is a type alias to `PTL::UserTaskQueue`, providing a concrete implementation of VUserTaskQueue with work-stealing capabilities and sub-queue management for efficient load balancing.

## Type Definition

```cpp
using G4UserTaskQueue = PTL::UserTaskQueue;
```

## Key Features

- Work-stealing algorithm
- Per-thread sub-queues
- Thread affinity support
- Random work stealing for load balancing
- Thread-specific task execution

## Core Methods

### GetTask()
```cpp
task_pointer GetTask(intmax_t subq = -1, intmax_t nitr = -1)
```
Retrieves a task from the queue, potentially stealing from other sub-queues.

**Parameters:**
- `subq`: Preferred sub-queue index (-1 for automatic)
- `nitr`: Number of steal attempts (-1 for default)

**Returns:** Task pointer or nullptr

---

### InsertTask()
```cpp
intmax_t InsertTask(task_pointer&& task, ThreadData* data = nullptr, intmax_t subq = -1)
```
Inserts a task into the queue.

**Parameters:**
- `task`: Task to insert
- `data`: Thread data
- `subq`: Target sub-queue (-1 for automatic)

**Returns:** Sub-queue index where inserted

---

### size() / empty()
```cpp
size_type size() const
bool empty() const
```
Query queue state.

---

### ExecuteOnAllThreads()
```cpp
void ExecuteOnAllThreads(ThreadPool* tp, function_type f)
```
Executes function on all worker threads.

## Work-Stealing Behavior

The queue implements work-stealing to balance load:

1. Thread tries its own sub-queue first
2. If empty, randomly steals from other sub-queues
3. Ensures good load distribution

## Usage

Typically used internally by G4ThreadPool. Can be customized for specific needs.

```cpp
// Custom queue configuration
G4ThreadPool::Config config;
config.task_queue = new G4UserTaskQueue(nthreads);
G4ThreadPool pool(config);
```

## See Also

- G4VUserTaskQueue - Abstract base class
- G4ThreadPool - Uses this queue by default
- PTL::UserTaskQueue - Implementation

## Notes

1. **Work-Stealing**: Automatic load balancing
2. **Default Queue**: Used by default in G4ThreadPool
3. **PTL Backend**: Implemented in PTL

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
