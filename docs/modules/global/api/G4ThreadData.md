# G4ThreadData

Thread-local data container for task execution context.

## Header

```cpp
#include "G4ThreadData.hh"
```

## Source Location

- Header: `source/global/management/include/G4ThreadData.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/ThreadData.hh`

## Overview

G4ThreadData is a type alias to `PTL::ThreadData`, providing thread-local context information for task execution, including thread pool reference, current queue, and task depth tracking.

## Type Definition

```cpp
using G4ThreadData = PTL::ThreadData;
```

## Class Structure

```cpp
class ThreadData {
public:
    bool is_main = false;
    bool within_task = false;
    intmax_t task_depth = 0;
    ThreadPool* thread_pool = nullptr;
    VUserTaskQueue* current_queue = nullptr;
    TaskStack<VUserTaskQueue*> queue_stack = {};

    static ThreadData*& GetInstance();
    void update();
};
```

## Members

### is_main
```cpp
bool is_main
```
True if this is the main thread.

---

### within_task
```cpp
bool within_task
```
True if currently executing within a task.

---

### task_depth
```cpp
intmax_t task_depth
```
Current task nesting depth.

---

### thread_pool
```cpp
ThreadPool* thread_pool
```
Pointer to associated thread pool.

---

### current_queue
```cpp
VUserTaskQueue* current_queue
```
Current task queue.

---

### queue_stack
```cpp
TaskStack<VUserTaskQueue*> queue_stack
```
Stack of queues for nested task execution.

## Methods

### GetInstance()
```cpp
static ThreadData*& GetInstance()
```
Returns thread-local instance.

**Returns:** Reference to thread-local ThreadData pointer

---

### update()
```cpp
void update()
```
Updates thread data from current state.

## Usage

Typically accessed via GetInstance() within tasks:

```cpp
void MyTask() {
    ThreadData* data = ThreadData::GetInstance();

    if (data->is_main) {
        std::cout << "Executing on main thread" << std::endl;
    }

    std::cout << "Task depth: " << data->task_depth << std::endl;

    if (data->within_task) {
        std::cout << "Nested task execution" << std::endl;
    }
}
```

## Threading Patterns

### Check Thread Context

```cpp
void ProcessItem() {
    auto* data = G4ThreadData::GetInstance();

    if (data && data->within_task) {
        // We're in a task - can process efficiently
        ProcessInTask();
    } else {
        // Not in task context - different path
        ProcessDirectly();
    }
}
```

### Access Thread Pool

```cpp
void NeedThreadPool() {
    auto* data = G4ThreadData::GetInstance();
    if (data && data->thread_pool) {
        auto pool_size = data->thread_pool->size();
        std::cout << "Pool size: " << pool_size << std::endl;
    }
}
```

### Track Task Depth

```cpp
void RecursiveTask() {
    auto* data = G4ThreadData::GetInstance();
    if (data) {
        std::cout << "Current depth: " << data->task_depth << std::endl;

        if (data->task_depth < MAX_DEPTH) {
            // Can recurse deeper
            SubmitNestedTask();
        }
    }
}
```

## Thread Safety

- **Thread-Local**: Each thread has its own instance
- **No Synchronization**: No locks needed (thread-local data)
- **GetInstance()**: Thread-safe singleton access

## Performance Notes

- **Minimal Overhead**: Simple struct access
- **Thread-Local**: No cache conflicts between threads
- **Stack-Based**: Queue stack for efficient nesting

## Best Practices

1. **Check nullptr**: Always check if GetInstance() returns valid pointer
2. **Read-Only**: Don't modify unless you know what you're doing
3. **Use within Tasks**: Primarily useful within task execution
4. **Task Depth**: Use for controlling recursion depth

## See Also

- G4ThreadPool - Associated thread pool
- G4VUserTaskQueue - Task queue type
- PTL::ThreadData - Implementation

## Notes

1. **PTL Backend**: Implemented in PTL
2. **Thread-Local**: Uses thread-local storage
3. **Context Tracking**: Maintains execution context
4. **Automatic Management**: Managed by thread pool

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
