# G4Task

Task wrapper template for G4ThreadPool task execution.

## Header

```cpp
#include "G4Task.hh"
```

## Source Location

- Header: `source/global/management/include/G4Task.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/Task.hh`

## Overview

G4Task is a type alias template to `PTL::Task`, representing a unit of work that can be executed by G4ThreadPool. Tasks encapsulate functions with arguments and provide future-based result retrieval.

## Type Definition

```cpp
template <typename _Ret, typename _Arg, typename... _Args>
using G4Task = PTL::Task<_Ret, _Arg, _Args...>;
```

## Template Parameters

- `_Ret`: Return type of the task function
- `_Arg`: Primary argument type
- `_Args...`: Additional argument types (variadic)

## Key Features

- Future-based result retrieval
- Variadic template support
- Packaged task semantics
- Thread pool integration
- Exception propagation

## Usage Patterns

### Pattern 1: Void Task

```cpp
#include "G4Task.hh"

auto task = std::make_shared<G4Task<void>>([]() {
    std::cout << "Task executing" << std::endl;
});

pool.add_task(std::move(task));
task->wait();  // Wait for completion
```

### Pattern 2: Task with Return Value

```cpp
auto task = std::make_shared<G4Task<int>>([]() {
    return 42;
});

pool.add_task(std::move(task));
int result = task->get();  // Blocks until complete, returns 42
```

### Pattern 3: Task with Arguments

```cpp
auto task = std::make_shared<G4Task<double, int, double>>(
    [](int x, double y) {
        return x * y;
    },
    5, 3.14
);

pool.add_task(std::move(task));
double result = task->get();  // Returns 15.7
```

## Methods

### operator()()
```cpp
void operator()()
```
Executes the task.

---

### get_future()
```cpp
future_type get_future()
```
Returns future for retrieving result.

---

### wait()
```cpp
void wait()
```
Waits for task completion.

---

### get()
```cpp
RetT get()
```
Waits and returns result.

## See Also

- G4VTask - Base task class
- G4ThreadPool - Thread pool for task execution
- G4TaskGroup - Task grouping
- G4TaskManager - High-level task management

## Notes

1. **PTL Backend**: Implemented in Parallel Tasking Library
2. **Future-Based**: Uses std::future semantics
3. **Exception Safe**: Exceptions propagated through future

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
