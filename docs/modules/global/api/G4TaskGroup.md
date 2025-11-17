# G4TaskGroup

Task group for independent task execution and joining with result aggregation.

## Header

```cpp
#include "G4TaskGroup.hh"
```

## Source Location

- Header: `source/global/management/include/G4TaskGroup.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/TaskGroup.hh`

## Overview

G4TaskGroup is a type alias template to `PTL::TaskGroup`, providing a mechanism for grouping related tasks that can be executed independently and joined together with optional result aggregation.

## Type Definition

```cpp
template <typename _Tp, typename _Arg = _Tp>
using G4TaskGroup = PTL::TaskGroup<_Tp, _Arg>;
```

## Template Parameters

- `_Tp`: Result type for joining
- `_Arg`: Argument type for tasks (defaults to `_Tp`)

## Key Features

- Independent task execution
- Result aggregation via join function
- Wait/join synchronization
- Future-based result access
- TBB backend support

## Core Methods

### exec()
```cpp
template <typename Func, typename... Args>
void exec(Func func, Args... args)
```
Executes a task in the group.

**Example:**
```cpp
G4TaskGroup<void> tg;
for (int i = 0; i < 10; i++) {
    tg.exec([i]() {
        ProcessTask(i);
    });
}
```

---

### wait()
```cpp
void wait()
```
Waits for all tasks in group to complete.

---

### join()
```cpp
// For non-void return types
Tp join(Tp accum = {})

// For void return types
void join()
```
Waits for all tasks and aggregates results.

**Example:**
```cpp
G4TaskGroup<int> tg([](int& a, int b) { return a + b; });

tg.exec([]() { return 10; });
tg.exec([]() { return 20; });
tg.exec([]() { return 30; });

int total = tg.join(0);  // Returns 60
```

---

### size()
```cpp
intmax_t size() const
```
Returns number of tasks in group.

---

### clear()
```cpp
void clear()
```
Clears task history.

## Usage Patterns

### Pattern 1: Void Task Group

```cpp
G4TaskGroup<void> tg;

for (int i = 0; i < 100; i++) {
    tg.exec([i]() {
        SimulateEvent(i);
    });
}

tg.join();  // Wait for all
```

### Pattern 2: Result Aggregation

```cpp
// Sum aggregation
G4TaskGroup<double> tg([](double& sum, double value) {
    return sum + value;
});

for (int i = 0; i < 10; i++) {
    tg.exec([i]() {
        return ComputePartialResult(i);
    });
}

double total = tg.join(0.0);
```

### Pattern 3: Custom Join Function

```cpp
struct Result {
    int count;
    double energy;
};

auto join_func = [](Result& a, const Result& b) {
    a.count += b.count;
    a.energy += b.energy;
    return a;
};

G4TaskGroup<Result> tg(join_func);

tg.exec([]() { return Result{10, 100.5}; });
tg.exec([]() { return Result{20, 200.3}; });

Result total = tg.join(Result{0, 0.0});
```

### Pattern 4: Nested Task Groups

```cpp
void ProcessDataset() {
    G4TaskGroup<void> outerGroup;

    for (int batch = 0; batch < 10; batch++) {
        outerGroup.exec([batch]() {
            G4TaskGroup<void> innerGroup;

            for (int item = 0; item < 100; item++) {
                innerGroup.exec([batch, item]() {
                    ProcessItem(batch, item);
                });
            }

            innerGroup.join();
        });
    }

    outerGroup.join();
}
```

## Thread Safety

- **Thread-Safe exec()**: Safe to call from multiple threads
- **Safe join()**: Can be called from any thread
- **Internal Synchronization**: Uses mutexes and condition variables

## Performance Notes

### Advantages
- **Fine-Grained Parallelism**: Many small tasks
- **Load Balancing**: Work-stealing scheduler
- **Result Aggregation**: Automatic reduction

### Considerations
- **Task Overhead**: Very small tasks may not benefit
- **Synchronization Cost**: join() waits for all tasks
- **Memory**: Futures stored until join()

## Best Practices

1. **Group Related Tasks**: Put related work in same group
2. **Clear After Join**: Call `clear()` to free memory
3. **Minimize Join Operations**: Batch work before joining
4. **Use Appropriate Return Type**: void for side-effects, value for aggregation
5. **Consider Task Granularity**: Balance overhead vs parallelism

## Common Patterns

### Map-Reduce Pattern

```cpp
// Map phase
G4TaskGroup<std::vector<int>> tg([](auto& a, auto b) {
    a.insert(a.end(), b.begin(), b.end());
    return a;
});

for (auto& data : datasets) {
    tg.exec([&data]() {
        return MapFunction(data);
    });
}

auto mapped = tg.join(std::vector<int>());

// Reduce phase
int result = ReduceFunction(mapped);
```

### Parallel For Pattern

```cpp
template <typename Func>
void ParallelFor(int start, int end, Func func) {
    G4TaskGroup<void> tg;

    int grain_size = (end - start) / G4Threading::G4GetNumberOfCores();

    for (int i = start; i < end; i += grain_size) {
        int this_end = std::min(i + grain_size, end);
        tg.exec([=, &func]() {
            for (int j = i; j < this_end; j++) {
                func(j);
            }
        });
    }

    tg.join();
}
```

## See Also

- G4TBBTaskGroup - TBB-specific task group (alias to G4TaskGroup)
- G4Task - Task wrapper
- G4TaskManager - Task management
- G4ThreadPool - Thread pool backend

## Notes

1. **PTL Backend**: Implemented in PTL
2. **TBB Support**: Can use Intel TBB backend
3. **Future-Based**: Uses std::future internally
4. **Flexible Joining**: Custom join functions supported

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
