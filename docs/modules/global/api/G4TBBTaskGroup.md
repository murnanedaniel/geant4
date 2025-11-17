# G4TBBTaskGroup

Intel TBB (Threading Building Blocks) task group wrapper.

## Header

```cpp
#include "G4TBBTaskGroup.hh"
```

## Source Location

- Header: `source/global/management/include/G4TBBTaskGroup.hh`
- Implementation: PTL - `source/externals/ptl/include/PTL/TaskGroup.hh`

## Overview

G4TBBTaskGroup is a type alias template to `PTL::TaskGroup`, identical to G4TaskGroup. In newer PTL versions, TaskGroup automatically handles TBB backend when configured, making this a compatibility alias.

## Type Definition

```cpp
template <typename Tp, typename Arg = Tp>
using G4TBBTaskGroup = PTL::TaskGroup<Tp, Arg>;
```

## Relationship to G4TaskGroup

```cpp
// These are identical
G4TaskGroup<int> tg1;
G4TBBTaskGroup<int> tg2;
```

## Usage

Use exactly like G4TaskGroup. The TBB backend is selected via ThreadPool configuration, not by type choice.

```cpp
// TBB backend enabled via ThreadPool config
G4ThreadPool::Config config;
config.use_tbb = true;
G4ThreadPool pool(config);

// This group will use TBB internally
G4TBBTaskGroup<void> tg(&pool);
tg.exec([]() { DoWork(); });
tg.join();
```

## See Also

- G4TaskGroup - Primary task group interface (identical)
- G4ThreadPool - Thread pool configuration
- Intel TBB - Threading Building Blocks library

## Notes

1. **Compatibility Alias**: Provided for backward compatibility
2. **No Functional Difference**: Identical to G4TaskGroup
3. **TBB Selection**: Controlled by ThreadPool config, not type
4. **Prefer G4TaskGroup**: Use G4TaskGroup in new code

## Authors

- Jonathan R. Madsen - PTL Implementation (May 28, 2020)
