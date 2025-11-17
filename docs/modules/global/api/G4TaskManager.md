# G4TaskManager

High-level manager for wrapping functions into tasks and submitting to thread pool.

## Header

```cpp
#include "G4TaskManager.hh"
```

## Source Location

- Header: `source/global/management/include/G4TaskManager.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/TaskManager.hh`

## Overview

G4TaskManager is a type alias to `PTL::TaskManager`, providing high-level task management. It simplifies task creation and submission by wrapping functions automatically.

## Type Definition

```cpp
using G4TaskManager = PTL::TaskManager;
```

## Key Features

- Automatic task wrapping
- Thread pool management
- Singleton access pattern
- Async task execution
- Task group integration

## Core Methods

### Singleton Access

#### GetInstance()
```cpp
static TaskManager* GetInstance()
```
Returns thread-local singleton instance.

---

#### GetInstanceIfExists()
```cpp
static TaskManager* GetInstanceIfExists()
```
Returns instance if exists, nullptr otherwise.

### Accessors

#### thread_pool()
```cpp
ThreadPool* thread_pool() const
```
Returns associated thread pool.

---

#### size()
```cpp
size_type size() const
```
Returns thread pool size.

### Task Submission

#### async()
```cpp
template <typename RetT, typename FuncT, typename... Args>
std::shared_ptr<PackagedTask<RetT, Args...>> async(FuncT&& func, Args&&... args)
```
Submits asynchronous task and returns future.

**Example:**
```cpp
auto mgr = G4TaskManager::GetInstance();
auto task = mgr->async<int>([]() { return 42; });
int result = task->get();
```

---

#### exec()
```cpp
template <typename RetT, typename ArgT, typename FuncT, typename... Args>
void exec(TaskGroup<RetT, ArgT>& tg, FuncT&& func, Args&&... args)
```
Executes task within a task group.

### Finalization

#### finalize()
```cpp
void finalize()
```
Destroys thread pool and cleans up.

## Usage Patterns

### Pattern 1: Basic Async

```cpp
auto mgr = G4TaskManager::GetInstance();

auto task1 = mgr->async<void>([]() {
    std::cout << "Task 1" << std::endl;
});

auto task2 = mgr->async<int>([]() {
    return 100;
});

task1->wait();
int val = task2->get();
```

### Pattern 2: With Task Group

```cpp
G4TaskManager* mgr = G4TaskManager::GetInstance();
G4TaskGroup<void> tg;

for (int i = 0; i < 10; i++) {
    mgr->exec(tg, [i]() {
        ProcessItem(i);
    });
}

tg.join();  // Wait for all tasks
```

### Pattern 3: Custom Thread Pool

```cpp
G4ThreadPool* pool = new G4ThreadPool(config);
G4TaskManager* mgr = new G4TaskManager(pool);

// Use custom manager
auto task = mgr->async<double>(ComputeSomething);
```

## Thread Safety

- **Thread-Local Singleton**: Each thread can have its own instance
- **Thread-Safe Submission**: Task submission is thread-safe
- **Shared Pool**: Multiple managers can share thread pool

## Best Practices

1. Use `GetInstance()` for singleton access
2. Call `finalize()` before program exit
3. Prefer `async()` for simple task submission
4. Use task groups for related tasks
5. Manage thread pool lifecycle carefully

## See Also

- G4ThreadPool - Thread pool backend
- G4TaskGroup - Task grouping and synchronization
- G4Task - Task wrapper
- PTL::TaskManager - Implementation details

## Notes

1. **Thread-Local**: Singleton is thread-local
2. **PTL Backend**: Implemented in PTL
3. **Lazy Creation**: Thread pool created on first use
4. **Auto-Finalize**: Destructor calls finalize()

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
