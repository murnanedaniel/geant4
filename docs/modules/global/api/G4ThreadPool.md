# G4ThreadPool

Efficient thread pool that accepts work in the form of tasks.

## Header

```cpp
#include "G4ThreadPool.hh"
```

## Source Location

- Header: `source/global/management/include/G4ThreadPool.hh`
- Implementation: PTL (Parallel Tasking Library) - `source/externals/ptl/include/PTL/ThreadPool.hh`

## Overview

G4ThreadPool is a type alias to `PTL::ThreadPool`, providing an efficient thread pool implementation for task-based parallelism in Geant4. The thread pool manages a fixed number of worker threads that execute tasks from a queue, enabling work-stealing and load-balancing across threads.

This is the foundation for Geant4's task-based threading model, which complements the traditional event-level parallelism.

## Type Definition

```cpp
using G4ThreadPool = PTL::ThreadPool;
```

## Key Features

- Task-based parallelism
- Work-stealing task queues
- Support for both native and TBB (Threading Building Blocks) backends
- Thread affinity control
- Customizable task queues
- Thread initialization/finalization hooks

## Configuration

### Config Structure

```cpp
struct Config {
    bool init = true;                    // Initialize immediately
    bool use_tbb = false;                // Use TBB backend
    bool use_affinity = false;           // Set thread affinity
    int verbose = 0;                     // Verbosity level
    int priority = 0;                    // Thread priority
    size_type pool_size = hardware_concurrency();
    VUserTaskQueue* task_queue = nullptr;  // Custom task queue
    affinity_func_t set_affinity;        // Affinity function
    initialize_func_t initializer;       // Thread init function
    finalize_func_t finalizer;           // Thread cleanup function
};
```

## Constructor

```cpp
explicit ThreadPool(const Config& config)
```

Creates and configures a thread pool.

**Example:**
```cpp
G4ThreadPool::Config config;
config.pool_size = 8;
config.use_affinity = true;
config.verbose = 1;

G4ThreadPool pool(config);
```

## Core Methods

### Thread Pool Management

#### initialize_threadpool()
```cpp
size_type initialize_threadpool(size_type size)
```
Starts the worker threads.

**Parameters:**
- `size`: Number of threads to create

**Returns:** Number of threads created

---

#### destroy_threadpool()
```cpp
size_type destroy_threadpool()
```
Destroys all worker threads and cleans up resources.

**Returns:** Number of threads destroyed

---

#### resize()
```cpp
void resize(size_type n)
```
Resizes the thread pool.

**Parameters:**
- `n`: New thread pool size

---

#### size()
```cpp
size_type size() const
```
Returns the number of threads in the pool.

**Returns:** Thread count

---

#### is_alive()
```cpp
bool is_alive()
```
Checks if the thread pool is active.

**Returns:** `true` if alive, `false` otherwise

### Task Submission

#### add_task()
```cpp
size_type add_task(task_pointer&& task, int bin = -1)
```
Adds a single task to the pool.

**Parameters:**
- `task`: Shared pointer to task
- `bin`: Optional bin/queue index (-1 for automatic)

**Returns:** Queue index where task was inserted

**Example:**
```cpp
auto task = std::make_shared<G4Task<void>>([]() {
    std::cout << "Task executed" << std::endl;
});
pool.add_task(std::move(task));
```

---

#### add_tasks()
```cpp
template <typename ListT>
size_type add_tasks(ListT& container)
```
Adds multiple tasks from a container.

**Parameters:**
- `container`: Container of task pointers (vector, deque, etc.)

**Returns:** Number of tasks added

### Thread Control

#### execute_on_all_threads()
```cpp
template <typename FuncT>
void execute_on_all_threads(FuncT&& func)
```
Executes a function on all worker threads.

**Parameters:**
- `func`: Function to execute on each thread

**Example:**
```cpp
pool.execute_on_all_threads([]() {
    std::cout << "Initializing thread "
              << std::this_thread::get_id() << std::endl;
});
```

---

#### execute_on_specific_threads()
```cpp
template <typename FuncT>
void execute_on_specific_threads(const std::set<std::thread::id>& tids,
                                 FuncT&& func)
```
Executes a function on specific threads.

**Parameters:**
- `tids`: Set of thread IDs
- `func`: Function to execute

### Accessors

#### get_queue()
```cpp
task_queue_t* get_queue() const
```
Returns the task queue.

**Returns:** Pointer to task queue

---

#### get_thread()
```cpp
Thread* get_thread(size_type n) const
Thread* get_thread(std::thread::id id) const
```
Gets a specific thread by index or ID.

**Returns:** Pointer to thread

---

#### get_task_arena()
```cpp
tbb_task_arena_t* get_task_arena()
```
Gets the TBB task arena (when using TBB backend).

**Returns:** Pointer to TBB task arena

---

#### is_tbb_threadpool()
```cpp
bool is_tbb_threadpool() const
```
Checks if using TBB backend.

**Returns:** `true` if TBB, `false` if native

### Configuration Methods

#### set_initialization() / set_finalization()
```cpp
void set_initialization(initialize_func_t f)
void set_finalization(finalize_func_t f)
```
Sets custom thread initialization/finalization functions.

---

#### set_affinity()
```cpp
void set_affinity(affinity_func_t f)
void set_affinity(intmax_t i, Thread& thread) const
```
Sets thread affinity function or for specific thread.

---

#### set_verbose()
```cpp
void set_verbose(int level)
int get_verbose() const
```
Controls verbosity level.

### Notification

#### notify() / notify_all()
```cpp
void notify()
void notify_all()
void notify(size_type n)
```
Wakes sleeping threads to process tasks.

## Threading Patterns

### Pattern 1: Basic Thread Pool

```cpp
#include "G4ThreadPool.hh"
#include "G4Task.hh"

void BasicThreadPool() {
    // Create thread pool with 4 threads
    G4ThreadPool::Config config;
    config.pool_size = 4;
    G4ThreadPool pool(config);

    pool.initialize_threadpool(4);

    // Submit tasks
    for (int i = 0; i < 100; i++) {
        auto task = std::make_shared<G4Task<void>>([i]() {
            std::cout << "Processing task " << i << std::endl;
        });
        pool.add_task(std::move(task));
    }

    // Clean up
    pool.destroy_threadpool();
}
```

### Pattern 2: Thread Initialization

```cpp
void ThreadPoolWithInit() {
    G4ThreadPool::Config config;
    config.pool_size = 8;
    config.initializer = []() {
        std::cout << "Thread " << std::this_thread::get_id()
                  << " initialized" << std::endl;
        // Initialize thread-local resources
    };
    config.finalizer = []() {
        std::cout << "Thread " << std::this_thread::get_id()
                  << " finalizing" << std::endl;
        // Clean up thread-local resources
    };

    G4ThreadPool pool(config);
    pool.initialize_threadpool(8);
}
```

### Pattern 3: Thread Affinity

```cpp
void ThreadPoolWithAffinity() {
    G4ThreadPool::Config config;
    config.pool_size = 4;
    config.use_affinity = true;
    config.set_affinity = [](intmax_t thread_id) {
        // Pin thread to specific core
        return thread_id % std::thread::hardware_concurrency();
    };

    G4ThreadPool pool(config);
    pool.initialize_threadpool(4);
}
```

### Pattern 4: TBB Backend

```cpp
void TBBThreadPool() {
    G4ThreadPool::Config config;
    config.use_tbb = true;  // Use Intel TBB
    config.pool_size = 8;

    G4ThreadPool pool(config);
    pool.initialize_threadpool(8);

    // TBB handles scheduling internally
}
```

### Pattern 5: Execute on All Threads

```cpp
void InitializeAllThreads(G4ThreadPool& pool) {
    // Initialize geometry on all threads
    pool.execute_on_all_threads([]() {
        InitializeThreadLocalGeometry();
    });

    // Initialize physics on all threads
    pool.execute_on_all_threads([]() {
        InitializeThreadLocalPhysics();
    });
}
```

## Master vs Worker Thread Usage

### Master Thread Creates Pool

```cpp
void MasterThread() {
    if (G4Threading::IsMasterThread()) {
        // Master creates and manages pool
        G4ThreadPool::Config config;
        config.pool_size = G4Threading::G4GetNumberOfCores();

        G4ThreadPool* pool = new G4ThreadPool(config);
        pool->initialize_threadpool(config.pool_size);

        // Submit work to pool
        SubmitTasks(pool);

        // Clean up
        pool->destroy_threadpool();
        delete pool;
    }
}
```

### Worker Threads Execute Tasks

```cpp
// Worker threads automatically execute tasks from queue
// No explicit worker thread code needed
// Pool manages worker lifecycle
```

### Per-Thread Initialization

```cpp
void SetupThreadPool() {
    G4ThreadPool::Config config;
    config.initializer = []() {
        // Called once per worker thread at startup
        if (G4Threading::IsWorkerThread()) {
            InitializeWorkerData();
        }
    };

    G4ThreadPool pool(config);
    pool.initialize_threadpool(4);
}
```

## Thread Safety Guarantees

### Thread-Safe Operations
- `add_task()` - Concurrent task submission
- `execute_on_all_threads()` - Safe from master thread
- `get_queue()` - Thread-safe accessor
- `notify()` / `notify_all()` - Thread-safe notification

### Synchronization
- Internal mutexes protect task queue
- Condition variables for thread wake-up
- Thread-safe task stealing

## Performance Notes

### Advantages
- **Work Stealing**: Automatic load balancing
- **Task Granularity**: Fine-grained parallelism
- **Scalability**: Efficient with many small tasks
- **Low Overhead**: Minimal synchronization

### Tuning
- **Pool Size**: Match CPU core count for CPU-bound work
- **Task Granularity**: Balance overhead vs parallelism
- **Affinity**: Enable on NUMA systems
- **TBB**: Consider for complex task graphs

## Best Practices

1. **Size Pool Appropriately**: Match core count
2. **Initialize Once**: Reuse pool across runs
3. **Batch Small Tasks**: Avoid excessive task overhead
4. **Use Affinity on NUMA**: Improves cache locality
5. **Clean Up Properly**: Call `destroy_threadpool()`

## See Also

- G4Task - Task wrapper template
- G4TaskManager - High-level task management
- G4TaskGroup - Task grouping and joining
- G4VUserTaskQueue - Custom task queue interface
- G4ThreadData - Thread-local data management

## Notes

1. **PTL Backend**: Implemented in Parallel Tasking Library
2. **TBB Support**: Optional Intel TBB integration
3. **Work Stealing**: Automatic load balancing
4. **Task-Based**: Complements event-level parallelism
5. **Future-Ready**: Foundation for task-based Geant4

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
