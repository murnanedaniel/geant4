# G4SliceTimer

Accumulating timer for measuring elapsed time across multiple execution slices

## Overview

`G4SliceTimer` is a specialized timer class designed for measuring accumulated time across multiple start-stop cycles. Unlike `G4Timer`, which measures a single execution block, `G4SliceTimer` accumulates timing measurements over multiple "slices" of execution, making it ideal for profiling repeated operations, iterative algorithms, or code that runs in discrete phases.

The timer maintains running totals of real (wall-clock), user CPU, and system CPU time, allowing you to measure the cumulative performance of operations that are called multiple times throughout an application's lifetime. The accumulated times can be cleared and restarted at any point.

This timer is particularly useful for measuring the total time spent in frequently-called functions, callbacks, or event processing loops where you want to know the aggregate time rather than individual call times.

## Source Location

**Header:** `/home/user/geant4/source/global/management/include/G4SliceTimer.hh`

**Inline Implementation:** `/home/user/geant4/source/global/management/include/G4SliceTimer.icc`

**Source:** `/home/user/geant4/source/global/management/src/G4SliceTimer.cc`

**Author:** M. Asai (2006) - Derived from G4Timer implementation

## Class Definition

```cpp
class G4SliceTimer
{
 public:
  G4SliceTimer();

  inline void Start();
  inline void Stop();
  inline void Clear();
  inline G4bool IsValid() const;
  G4double GetRealElapsed() const;
  G4double GetSystemElapsed() const;
  G4double GetUserElapsed() const;

 private:
  clock_t fStartRealTime, fEndRealTime;
  tms fStartTimes, fEndTimes;
  G4double fRealElapsed = 0.0, fSystemElapsed = 0.0, fUserElapsed = 0.0;
  G4bool fValidTimes = true;
};
```

## Key Differences from G4Timer

| Feature | G4Timer | G4SliceTimer |
|---------|---------|--------------|
| **Measurement** | Single start-stop cycle | Accumulates multiple cycles |
| **Use Case** | One-time operation timing | Repeated operation timing |
| **Clear Method** | No clear (implicit on Start) | Explicit Clear() method |
| **Time Storage** | Calculated on demand | Accumulated in member variables |
| **Real Time Clock** | std::chrono::high_resolution_clock | POSIX times() return value |
| **Initial State** | Invalid (must Start/Stop) | Valid (initialized to 0) |
| **Typical Use** | "How long did this take?" | "How much total time in this?" |

## Public Methods

### Constructor

#### G4SliceTimer()
```cpp
G4SliceTimer()
```

**Purpose:** Construct a timer object with accumulated times initialized to zero.

**Behavior:**
- Initializes all accumulated time values to 0.0
- Sets validity flag to true
- Timer is ready to use immediately

**Example:**
```cpp
G4SliceTimer timer;  // Ready to use
G4cout << timer.GetRealElapsed() << G4endl;  // Returns 0.0
```

**Source:** `G4SliceTimer.cc` line 58

---

### Timer Control

#### Start()
```cpp
inline void Start()
```

**Purpose:** Start a new timing slice.

**Behavior:**
- Sets validity flag to false (timing in progress)
- Records current time as start point using `times()` system call
- Returns value from `times()` is stored as start real time
- Does NOT reset accumulated times (use Clear() for that)
- Can be called multiple times for multiple timing slices

**Thread Safety:** Not thread-safe. Each thread should use its own timer instance.

**Example:**
```cpp
G4SliceTimer timer;

// First slice
timer.Start();
ProcessBatch1();
timer.Stop();

// Second slice - accumulates with first
timer.Start();
ProcessBatch2();
timer.Stop();

// Total time for both batches
G4cout << "Total: " << timer.GetRealElapsed() << " s" << G4endl;
```

**Source:** `G4SliceTimer.icc` lines 31-35

---

#### Stop()
```cpp
inline void Stop()
```

**Purpose:** Stop the current timing slice and accumulate the elapsed time.

**Behavior:**
- Records current time as end point using `times()` system call
- Calculates elapsed time for this slice (end - start)
- **Adds** the slice time to accumulated totals:
  - `fRealElapsed += (fEndRealTime - fStartRealTime)`
  - `fSystemElapsed += (fEndTimes.tms_stime - fStartTimes.tms_stime)`
  - `fUserElapsed += (fEndTimes.tms_utime - fStartTimes.tms_utime)`
- Sets validity flag to true
- Must be called after `Start()` to accumulate time

**Key Feature:** Time is accumulated, not replaced!

**Example:**
```cpp
timer.Start();
DoWork();
timer.Stop();  // Adds time to accumulated total

timer.Start();
DoMoreWork();
timer.Stop();  // Adds MORE time to accumulated total

// GetRealElapsed() returns sum of both work periods
```

**Source:** `G4SliceTimer.icc` lines 37-44

---

#### Clear()
```cpp
inline void Clear()
```

**Purpose:** Reset all accumulated time measurements to zero.

**Behavior:**
- Sets `fRealElapsed = 0.0`
- Sets `fSystemElapsed = 0.0`
- Sets `fUserElapsed = 0.0`
- Does NOT affect validity flag
- Allows reusing timer for new measurement series

**When to use:**
- Starting a new timing session
- Resetting statistics
- Beginning a new phase of profiling

**Example:**
```cpp
G4SliceTimer timer;

// First measurement session
timer.Start();
Phase1();
timer.Stop();
G4cout << "Phase 1: " << timer.GetRealElapsed() << " s" << G4endl;

// Reset for new session
timer.Clear();

// Second measurement session (independent)
timer.Start();
Phase2();
timer.Stop();
G4cout << "Phase 2: " << timer.GetRealElapsed() << " s" << G4endl;
```

**Source:** `G4SliceTimer.icc` lines 46-51

---

#### IsValid()
```cpp
inline G4bool IsValid() const
```

**Purpose:** Check if the timer is in a valid state for querying results.

**Returns:**
- `true` if timer is stopped (not currently timing)
- `false` if timer is currently running (between Start() and Stop())
- Initially `true` (timer starts in valid state with zero times)

**Use Case:** Verify timer state before calling elapsed time methods.

**Note:** Unlike G4Timer, this timer is valid initially and after Clear().

**Example:**
```cpp
G4SliceTimer timer;

if (timer.IsValid()) {  // true - initial state
  G4cout << timer.GetRealElapsed() << G4endl;  // 0.0
}

timer.Start();
if (!timer.IsValid()) {  // false - timing in progress
  G4cout << "Timer is running..." << G4endl;
}

timer.Stop();
if (timer.IsValid()) {  // true - timing complete
  G4cout << timer.GetRealElapsed() << G4endl;
}
```

**Source:** `G4SliceTimer.icc` line 53

---

### Time Retrieval Methods

#### GetRealElapsed()
```cpp
G4double GetRealElapsed() const
```

**Purpose:** Get the accumulated real (wall-clock) time across all timing slices.

**Returns:** Total accumulated real time in seconds (double precision)

**Behavior:**
- Returns `fRealElapsed / sysconf(_SC_CLK_TCK)`
- Converts accumulated clock ticks to seconds
- Does NOT throw exception if invalid (unlike G4Timer)
- Returns accumulated total from all Start/Stop cycles

**Real Time Definition:** Accumulated wall-clock time that includes:
- Actual CPU computation time
- Time waiting for I/O operations
- Time when process is not scheduled
- All delays and overhead across all slices

**Example:**
```cpp
G4SliceTimer timer;

for (G4int event = 0; event < 100; event++) {
  timer.Start();
  ProcessEvent(event);
  timer.Stop();
}

// Total wall-clock time for all 100 events
G4double totalTime = timer.GetRealElapsed();
G4double avgTime = totalTime / 100.0;

G4cout << "Total time: " << totalTime << " s" << G4endl;
G4cout << "Average per event: " << avgTime << " s" << G4endl;
```

**Source:** `G4SliceTimer.cc` lines 61-64

---

#### GetSystemElapsed()
```cpp
G4double GetSystemElapsed() const
```

**Purpose:** Get the accumulated system CPU time across all timing slices.

**Returns:** Total accumulated system CPU time in seconds (double precision)

**Behavior:**
- Returns `fSystemElapsed / sysconf(_SC_CLK_TCK)`
- Converts accumulated clock ticks to seconds
- Does NOT throw exception if invalid
- Sums system time from all Start/Stop cycles

**System Time Definition:** Accumulated CPU time spent in kernel:
- All system calls across all slices
- File I/O operations
- Memory management
- Process/thread operations

**Example:**
```cpp
G4SliceTimer timer;

for (G4int i = 0; i < 1000; i++) {
  timer.Start();
  WriteResults(i);  // I/O operation
  timer.Stop();
}

G4double sysTime = timer.GetSystemElapsed();
G4double avgSysTime = sysTime / 1000.0;

G4cout << "Total system time: " << sysTime << " s" << G4endl;
G4cout << "Avg system per call: " << avgSysTime << " s" << G4endl;

// High system time indicates I/O bottleneck
```

**Source:** `G4SliceTimer.cc` lines 67-70

---

#### GetUserElapsed()
```cpp
G4double GetUserElapsed() const
```

**Purpose:** Get the accumulated user CPU time across all timing slices.

**Returns:** Total accumulated user CPU time in seconds (double precision)

**Behavior:**
- Returns `fUserElapsed / sysconf(_SC_CLK_TCK)`
- Converts accumulated clock ticks to seconds
- Does NOT throw exception if invalid
- Sums user time from all Start/Stop cycles

**User Time Definition:** Accumulated CPU time in user space:
- All computational work across all slices
- Algorithm execution time
- Data processing
- Physics calculations

**Example:**
```cpp
G4SliceTimer timer;

for (G4int particle = 0; particle < particleCount; particle++) {
  timer.Start();
  CalculateTrajectory(particle);
  timer.Stop();
}

G4double userTime = timer.GetUserElapsed();
G4double avgUserTime = userTime / particleCount;

G4cout << "Total CPU time: " << userTime << " s" << G4endl;
G4cout << "Avg CPU per particle: " << avgUserTime << " s" << G4endl;
```

**Source:** `G4SliceTimer.cc` lines 73-76

---

## Understanding Accumulated Timing

### How Accumulation Works

```cpp
G4SliceTimer timer;

// Slice 1: 1.0 seconds
timer.Start();
Sleep(1000);  // 1 second
timer.Stop();
// Accumulated: 1.0s

// Slice 2: 2.0 seconds
timer.Start();
Sleep(2000);  // 2 seconds
timer.Stop();
// Accumulated: 1.0s + 2.0s = 3.0s

// Slice 3: 1.5 seconds
timer.Start();
Sleep(1500);  // 1.5 seconds
timer.Stop();
// Accumulated: 3.0s + 1.5s = 4.5s

G4cout << timer.GetRealElapsed() << G4endl;  // 4.5s
```

### Internal State Diagram

```
[Constructed] --> fValidTimes = true, accumulated times = 0
      |
      v
   Start() --> fValidTimes = false (timing in progress)
      |
      v
   Stop() --> fValidTimes = true, times += this_slice
      |
      v
   Start() --> fValidTimes = false
      |
      v
   Stop() --> fValidTimes = true, times += this_slice
      |
      v
   Clear() --> fValidTimes = true (unchanged), accumulated times = 0
```

### Comparison with G4Timer

**G4Timer (non-accumulating):**
```cpp
G4Timer timer;

timer.Start();
DoWork1();  // 1.0 seconds
timer.Stop();
G4cout << timer.GetRealElapsed() << G4endl;  // 1.0s

timer.Start();  // Resets! Previous time lost
DoWork2();  // 2.0 seconds
timer.Stop();
G4cout << timer.GetRealElapsed() << G4endl;  // 2.0s (NOT 3.0s)
```

**G4SliceTimer (accumulating):**
```cpp
G4SliceTimer timer;

timer.Start();
DoWork1();  // 1.0 seconds
timer.Stop();
G4cout << timer.GetRealElapsed() << G4endl;  // 1.0s

timer.Start();  // Continues accumulation
DoWork2();  // 2.0 seconds
timer.Stop();
G4cout << timer.GetRealElapsed() << G4endl;  // 3.0s (accumulated)
```

## Stream Output Operator

```cpp
std::ostream& operator<<(std::ostream& os, const G4SliceTimer& t)
```

**Purpose:** Print accumulated timer measurements to an output stream.

**Output Format (when valid):**
```
User = 1.234s Real = 2.345s Sys = 0.567s
```

**Output Format (when invalid - timing in progress):**
```
User = ****s Real = ****s Sys = ****s
```

**Note:** Unlike G4Timer, does NOT show CPU utilization percentage.

**Example:**
```cpp
G4SliceTimer timer;

for (G4int i = 0; i < 10; i++) {
  timer.Start();
  DoWork();
  timer.Stop();
}

G4cout << "Accumulated timing: " << timer << G4endl;
// Output: Accumulated timing: User = 5.23s Real = 6.45s Sys = 0.12s
```

**Source:** `G4SliceTimer.cc` lines 41-55

## Performance Measurement Examples

### Example 1: Event Loop Profiling

```cpp
void ProfileEventLoop() {
  G4SliceTimer totalTimer, physicsTimer, geometryTimer;

  for (G4int event = 0; event < numberOfEvents; event++) {
    totalTimer.Start();

    // Time physics calculations
    physicsTimer.Start();
    CalculatePhysics(event);
    physicsTimer.Stop();

    // Time geometry queries
    geometryTimer.Start();
    NavigateGeometry(event);
    geometryTimer.Stop();

    totalTimer.Stop();
  }

  G4cout << "\n=== Event Loop Profile ===" << G4endl;
  G4cout << "Total time: " << totalTimer.GetRealElapsed() << " s" << G4endl;
  G4cout << "Physics time: " << physicsTimer.GetRealElapsed() << " s ("
         << (physicsTimer.GetRealElapsed() / totalTimer.GetRealElapsed() * 100.0)
         << "%)" << G4endl;
  G4cout << "Geometry time: " << geometryTimer.GetRealElapsed() << " s ("
         << (geometryTimer.GetRealElapsed() / totalTimer.GetRealElapsed() * 100.0)
         << "%)" << G4endl;
}
```

### Example 2: Method Profiling with Call Counts

```cpp
class MethodProfiler {
private:
  G4SliceTimer timer;
  G4int callCount;

public:
  MethodProfiler() : callCount(0) {}

  void StartCall() {
    timer.Start();
    callCount++;
  }

  void EndCall() {
    timer.Stop();
  }

  void PrintStatistics(const G4String& methodName) {
    G4double totalTime = timer.GetRealElapsed();
    G4double avgTime = (callCount > 0) ? totalTime / callCount : 0.0;

    G4cout << methodName << " statistics:" << G4endl;
    G4cout << "  Calls: " << callCount << G4endl;
    G4cout << "  Total time: " << totalTime << " s" << G4endl;
    G4cout << "  Average time: " << avgTime << " s" << G4endl;
    G4cout << "  Time per call: " << (avgTime * 1000.0) << " ms" << G4endl;
  }

  void Reset() {
    timer.Clear();
    callCount = 0;
  }
};

// Usage
MethodProfiler profiler;

for (G4int i = 0; i < 1000; i++) {
  profiler.StartCall();
  MyFrequentMethod();
  profiler.EndCall();
}

profiler.PrintStatistics("MyFrequentMethod");
```

### Example 3: Phase-Based Profiling

```cpp
class PhaseProfiler {
private:
  struct PhaseData {
    G4SliceTimer timer;
    G4String name;
  };

  std::vector<PhaseData> phases;
  G4int currentPhase;

public:
  void AddPhase(const G4String& name) {
    PhaseData phase;
    phase.name = name;
    phases.push_back(phase);
  }

  void StartPhase(G4int phase) {
    if (phase >= 0 && phase < phases.size()) {
      currentPhase = phase;
      phases[phase].timer.Start();
    }
  }

  void EndPhase(G4int phase) {
    if (phase >= 0 && phase < phases.size()) {
      phases[phase].timer.Stop();
    }
  }

  void PrintReport() {
    G4double totalTime = 0.0;
    for (const auto& phase : phases) {
      totalTime += phase.timer.GetRealElapsed();
    }

    G4cout << "\n=== Phase Profile Report ===" << G4endl;
    for (const auto& phase : phases) {
      G4double time = phase.timer.GetRealElapsed();
      G4double percent = (totalTime > 0) ? (time / totalTime * 100.0) : 0.0;

      G4cout << phase.name << ":" << G4endl;
      G4cout << "  Time: " << time << " s" << G4endl;
      G4cout << "  Percentage: " << percent << "%" << G4endl;
    }
    G4cout << "Total: " << totalTime << " s" << G4endl;
  }
};

// Usage
PhaseProfiler profiler;
profiler.AddPhase("Initialization");
profiler.AddPhase("Event Processing");
profiler.AddPhase("Finalization");

// During execution
for (G4int event = 0; event < 100; event++) {
  profiler.StartPhase(0);
  Initialize(event);
  profiler.EndPhase(0);

  profiler.StartPhase(1);
  ProcessEvent(event);
  profiler.EndPhase(1);

  profiler.StartPhase(2);
  Finalize(event);
  profiler.EndPhase(2);
}

profiler.PrintReport();
```

### Example 4: Callback Timing

```cpp
class TimedCallback {
private:
  G4SliceTimer timer;
  std::function<void()> callback;

public:
  TimedCallback(std::function<void()> cb) : callback(cb) {}

  void Execute() {
    timer.Start();
    callback();
    timer.Stop();
  }

  G4double GetTotalTime() const {
    return timer.GetRealElapsed();
  }

  void Reset() {
    timer.Clear();
  }
};

// Usage
TimedCallback timedSave([](){ SaveResults(); });

for (G4int i = 0; i < 100; i++) {
  ProcessData(i);
  timedSave.Execute();
}

G4cout << "Total time spent saving: "
       << timedSave.GetTotalTime() << " s" << G4endl;
```

### Example 5: Comparative Performance Analysis

```cpp
void CompareImplementations() {
  const G4int ITERATIONS = 1000;

  G4SliceTimer implementationA, implementationB;

  // Test implementation A
  for (G4int i = 0; i < ITERATIONS; i++) {
    implementationA.Start();
    AlgorithmA();
    implementationA.Stop();
  }

  // Test implementation B
  for (G4int i = 0; i < ITERATIONS; i++) {
    implementationB.Start();
    AlgorithmB();
    implementationB.Stop();
  }

  G4cout << "\n=== Performance Comparison ===" << G4endl;
  G4cout << "Implementation A:" << G4endl;
  G4cout << "  Total: " << implementationA.GetUserElapsed() << " s" << G4endl;
  G4cout << "  Average: " << (implementationA.GetUserElapsed() / ITERATIONS * 1000.0)
         << " ms" << G4endl;

  G4cout << "Implementation B:" << G4endl;
  G4cout << "  Total: " << implementationB.GetUserElapsed() << " s" << G4endl;
  G4cout << "  Average: " << (implementationB.GetUserElapsed() / ITERATIONS * 1000.0)
         << " ms" << G4endl;

  G4double speedup = implementationA.GetUserElapsed() /
                     implementationB.GetUserElapsed();
  G4cout << "\nSpeedup: " << speedup << "x" << G4endl;

  if (speedup > 1.1) {
    G4cout << "Implementation B is faster" << G4endl;
  } else if (speedup < 0.9) {
    G4cout << "Implementation A is faster" << G4endl;
  } else {
    G4cout << "Performance is similar" << G4endl;
  }
}
```

### Example 6: Resource Usage Analysis

```cpp
void AnalyzeResourceUsage() {
  G4SliceTimer timer;

  for (G4int i = 0; i < numberOfOperations; i++) {
    timer.Start();
    PerformOperation(i);
    timer.Stop();
  }

  G4double realTime = timer.GetRealElapsed();
  G4double userTime = timer.GetUserElapsed();
  G4double sysTime = timer.GetSystemElapsed();
  G4double cpuTime = userTime + sysTime;

  G4cout << "\n=== Resource Usage Analysis ===" << G4endl;
  G4cout << "Real time: " << realTime << " s" << G4endl;
  G4cout << "User time: " << userTime << " s ("
         << (userTime / realTime * 100.0) << "%)" << G4endl;
  G4cout << "System time: " << sysTime << " s ("
         << (sysTime / realTime * 100.0) << "%)" << G4endl;
  G4cout << "CPU time: " << cpuTime << " s ("
         << (cpuTime / realTime * 100.0) << "%)" << G4endl;

  G4double waitTime = realTime - cpuTime;
  if (waitTime > 0) {
    G4cout << "Wait time: " << waitTime << " s ("
           << (waitTime / realTime * 100.0) << "%)" << G4endl;
  }

  // Analyze bottlenecks
  if (sysTime > userTime) {
    G4cout << "\nWARNING: System time exceeds user time!" << G4endl;
    G4cout << "This suggests I/O or system call bottleneck." << G4endl;
  }

  if (waitTime > cpuTime) {
    G4cout << "\nWARNING: Wait time exceeds CPU time!" << G4endl;
    G4cout << "This suggests I/O bound operation." << G4endl;
  }

  G4double efficiency = cpuTime / realTime * 100.0;
  if (efficiency < 50.0) {
    G4cout << "\nWARNING: Low CPU efficiency (" << efficiency << "%)" << G4endl;
    G4cout << "Consider optimizing I/O or reducing wait times." << G4endl;
  }
}
```

## Profiling Patterns

### Pattern 1: Hierarchical Profiling

```cpp
class HierarchicalProfiler {
private:
  struct Node {
    G4String name;
    G4SliceTimer timer;
    std::vector<Node*> children;
    Node* parent;

    Node(const G4String& n, Node* p = nullptr)
      : name(n), parent(p) {}
  };

  Node* root;
  Node* current;

public:
  HierarchicalProfiler() {
    root = new Node("Root");
    current = root;
  }

  void EnterScope(const G4String& name) {
    Node* child = new Node(name, current);
    current->children.push_back(child);
    current = child;
    current->timer.Start();
  }

  void ExitScope() {
    if (current && current != root) {
      current->timer.Stop();
      current = current->parent;
    }
  }

  void PrintTree(Node* node = nullptr, G4int depth = 0) {
    if (!node) node = root;

    G4String indent(depth * 2, ' ');
    if (node != root) {
      G4cout << indent << node->name << ": "
             << node->timer.GetRealElapsed() << " s" << G4endl;
    }

    for (auto child : node->children) {
      PrintTree(child, depth + 1);
    }
  }
};

// Usage
HierarchicalProfiler profiler;

profiler.EnterScope("MainLoop");
  for (G4int i = 0; i < 100; i++) {
    profiler.EnterScope("ProcessEvent");
      profiler.EnterScope("Physics");
        DoPhysics();
      profiler.ExitScope();

      profiler.EnterScope("Geometry");
        DoGeometry();
      profiler.ExitScope();
    profiler.ExitScope();
  }
profiler.ExitScope();

profiler.PrintTree();
```

### Pattern 2: Statistical Profiling

```cpp
class StatisticalProfiler {
private:
  G4SliceTimer timer;
  std::vector<G4double> samples;
  G4bool collectSamples;

public:
  StatisticalProfiler(G4bool collect = false)
    : collectSamples(collect) {}

  void Start() {
    timer.Start();
  }

  void Stop() {
    timer.Stop();
    if (collectSamples) {
      // Would need to track individual samples differently
      // This is a simplified example
    }
  }

  void PrintStatistics() {
    G4double total = timer.GetRealElapsed();
    G4int count = samples.size();

    if (count == 0) {
      G4cout << "Total time: " << total << " s" << G4endl;
      return;
    }

    G4double mean = total / count;

    // Calculate standard deviation
    G4double variance = 0.0;
    for (G4double sample : samples) {
      G4double diff = sample - mean;
      variance += diff * diff;
    }
    variance /= count;
    G4double stddev = std::sqrt(variance);

    G4cout << "Statistical Profile:" << G4endl;
    G4cout << "  Samples: " << count << G4endl;
    G4cout << "  Total: " << total << " s" << G4endl;
    G4cout << "  Mean: " << mean << " s" << G4endl;
    G4cout << "  Std Dev: " << stddev << " s" << G4endl;
    G4cout << "  Min: " << *std::min_element(samples.begin(), samples.end())
           << " s" << G4endl;
    G4cout << "  Max: " << *std::max_element(samples.begin(), samples.end())
           << " s" << G4endl;
  }
};
```

### Pattern 3: Conditional Accumulation

```cpp
class ConditionalTimer {
private:
  G4SliceTimer successTimer, failureTimer;
  G4int successCount, failureCount;

public:
  ConditionalTimer() : successCount(0), failureCount(0) {}

  template<typename Func>
  G4bool TimeOperation(Func operation) {
    G4bool success = false;

    if (success = operation()) {
      successTimer.Start();
      // Dummy timing - already executed
      successTimer.Stop();
      successCount++;
    } else {
      failureTimer.Start();
      // Dummy timing - already executed
      failureTimer.Stop();
      failureCount++;
    }

    return success;
  }

  void PrintReport() {
    G4cout << "Success operations: " << successCount << G4endl;
    G4cout << "  Time: " << successTimer.GetRealElapsed() << " s" << G4endl;

    G4cout << "Failed operations: " << failureCount << G4endl;
    G4cout << "  Time: " << failureTimer.GetRealElapsed() << " s" << G4endl;
  }
};
```

### Pattern 4: Budget-Based Profiling

```cpp
class BudgetProfiler {
private:
  G4SliceTimer timer;
  G4double budget;
  G4bool budgetExceeded;

public:
  BudgetProfiler(G4double maxTime) : budget(maxTime), budgetExceeded(false) {}

  void Start() {
    timer.Start();
  }

  void Stop() {
    timer.Stop();
  }

  G4bool IsWithinBudget() {
    G4double elapsed = timer.GetRealElapsed();
    budgetExceeded = (elapsed > budget);
    return !budgetExceeded;
  }

  void PrintStatus() {
    G4double elapsed = timer.GetRealElapsed();
    G4double remaining = budget - elapsed;
    G4double percent = (elapsed / budget) * 100.0;

    G4cout << "Time Budget Status:" << G4endl;
    G4cout << "  Elapsed: " << elapsed << " s" << G4endl;
    G4cout << "  Budget: " << budget << " s" << G4endl;
    G4cout << "  Used: " << percent << "%" << G4endl;

    if (remaining > 0) {
      G4cout << "  Remaining: " << remaining << " s" << G4endl;
    } else {
      G4cout << "  EXCEEDED by: " << (-remaining) << " s" << G4endl;
    }
  }
};

// Usage
BudgetProfiler profiler(10.0);  // 10 second budget

for (G4int i = 0; i < numberOfEvents; i++) {
  profiler.Start();
  ProcessEvent(i);
  profiler.Stop();

  if (!profiler.IsWithinBudget()) {
    G4cout << "Time budget exceeded at event " << i << G4endl;
    break;
  }
}

profiler.PrintStatus();
```

## Thread Safety Notes

### Non-Thread-Safe Design

Like `G4Timer`, `G4SliceTimer` is **NOT thread-safe**. The class does not use internal locking or synchronization.

**Reason:** Each thread should accumulate its own timing statistics independently.

### Multi-Threaded Usage Patterns

#### Pattern 1: Thread-Local Accumulators

```cpp
// Each thread accumulates its own statistics
G4ThreadLocal static G4SliceTimer* threadTimer = nullptr;

void WorkerThread() {
  if (!threadTimer) {
    threadTimer = new G4SliceTimer();
  }

  for (G4int i = 0; i < workItems; i++) {
    threadTimer->Start();
    ProcessWorkItem(i);
    threadTimer->Stop();
  }

  // Thread-local result
  G4cout << "Thread total time: " << threadTimer->GetRealElapsed() << " s" << G4endl;
}
```

#### Pattern 2: Master Aggregation

```cpp
class ThreadedProfiler {
private:
  std::vector<G4SliceTimer*> threadTimers;
  G4Mutex mutex;

public:
  G4SliceTimer* GetThreadTimer() {
    G4AutoLock lock(&mutex);
    G4SliceTimer* timer = new G4SliceTimer();
    threadTimers.push_back(timer);
    return timer;
  }

  void PrintAggregateResults() {
    G4double totalTime = 0.0;
    G4double totalUser = 0.0;
    G4double totalSys = 0.0;

    for (auto timer : threadTimers) {
      totalTime += timer->GetRealElapsed();
      totalUser += timer->GetUserElapsed();
      totalSys += timer->GetSystemElapsed();
    }

    G4cout << "Aggregate Results:" << G4endl;
    G4cout << "  Total real time: " << totalTime << " s" << G4endl;
    G4cout << "  Total user time: " << totalUser << " s" << G4endl;
    G4cout << "  Total system time: " << totalSys << " s" << G4endl;
    G4cout << "  Thread count: " << threadTimers.size() << G4endl;
  }
};
```

## Best Practices

### 1. Use for Repeated Operations

```cpp
// GOOD - Ideal use case
G4SliceTimer timer;
for (G4int i = 0; i < 1000; i++) {
  timer.Start();
  FrequentOperation();
  timer.Stop();
}
G4cout << "Total time: " << timer.GetRealElapsed() << " s" << G4endl;

// BAD - Use G4Timer instead for single operation
G4SliceTimer timer;
timer.Start();
OneTimeOperation();
timer.Stop();
```

### 2. Clear Between Independent Sessions

```cpp
// GOOD - Clear between independent measurements
G4SliceTimer timer;

// Phase 1
for (G4int i = 0; i < 100; i++) {
  timer.Start();
  Phase1Work();
  timer.Stop();
}
G4cout << "Phase 1: " << timer.GetRealElapsed() << " s" << G4endl;

timer.Clear();  // Reset for phase 2

// Phase 2
for (G4int i = 0; i < 100; i++) {
  timer.Start();
  Phase2Work();
  timer.Stop();
}
G4cout << "Phase 2: " << timer.GetRealElapsed() << " s" << G4endl;
```

### 3. Track Call Counts with Timing

```cpp
// GOOD - Maintain count alongside timer
G4SliceTimer timer;
G4int callCount = 0;

for (G4int i = 0; i < iterations; i++) {
  timer.Start();
  Operation();
  timer.Stop();
  callCount++;
}

G4double avgTime = timer.GetRealElapsed() / callCount;
G4cout << "Average: " << avgTime << " s over "
       << callCount << " calls" << G4endl;
```

### 4. Use Appropriate Time Metric

```cpp
// Use USER time for algorithm comparison
timer.Start();
ComputeIntensiveAlgorithm();
timer.Stop();
G4cout << "CPU time: " << timer.GetUserElapsed() << " s" << G4endl;

// Use REAL time for user-facing operations
timer.Clear();
timer.Start();
LoadAndProcessFile();
timer.Stop();
G4cout << "Total time: " << timer.GetRealElapsed() << " s" << G4endl;
```

### 5. Check Validity in Long-Running Code

```cpp
// GOOD - Verify timer state
if (timer.IsValid()) {
  G4cout << "Results: " << timer << G4endl;
} else {
  G4cout << "Warning: Timer still running" << G4endl;
}
```

### 6. Profile Hotspots with High Call Counts

```cpp
// GOOD - Profile frequently-called code
G4SliceTimer navigationTimer, physicsTimer;

for (G4int event = 0; event < 10000; event++) {
  for (G4int step = 0; step < 100; step++) {
    navigationTimer.Start();
    NavigateOneStep();
    navigationTimer.Stop();

    physicsTimer.Start();
    ComputePhysics();
    physicsTimer.Stop();
  }
}

// Shows cumulative impact of each hotspot
G4cout << "Navigation: " << navigationTimer.GetRealElapsed() << " s" << G4endl;
G4cout << "Physics: " << physicsTimer.GetRealElapsed() << " s" << G4endl;
```

### 7. Use Stream Operator for Quick Reports

```cpp
// GOOD - Concise output
G4SliceTimer timer;
RunTimedOperations(timer);
G4cout << "Accumulated: " << timer << G4endl;
// Output: Accumulated: User = 5.2s Real = 6.1s Sys = 0.3s
```

### 8. Reset Carefully

```cpp
// GOOD - Explicit clearing
timer.Clear();
timer.Start();
NewMeasurement();
timer.Stop();

// BAD - Forgetting to clear
timer.Start();  // Adds to previous total!
NewMeasurement();
timer.Stop();
```

### 9. Document Accumulation Scope

```cpp
// GOOD - Clear documentation
// Timer accumulates time over all events in the run
G4SliceTimer eventProcessingTimer;

void ProcessRun() {
  eventProcessingTimer.Clear();  // Start fresh for this run

  for (G4int event = 0; event < numberOfEvents; event++) {
    eventProcessingTimer.Start();
    ProcessEvent(event);
    eventProcessingTimer.Stop();
  }

  G4cout << "Total event processing time: "
         << eventProcessingTimer.GetRealElapsed() << " s" << G4endl;
}
```

### 10. Combine with Call Statistics

```cpp
// EXCELLENT - Complete profiling information
class CallTimer {
private:
  G4SliceTimer timer;
  G4int calls;
  G4double minTime, maxTime;
  G4bool firstCall;

public:
  CallTimer() : calls(0), minTime(0), maxTime(0), firstCall(true) {}

  void RecordCall(G4double callTime) {
    calls++;
    if (firstCall || callTime < minTime) minTime = callTime;
    if (firstCall || callTime > maxTime) maxTime = callTime;
    firstCall = false;
  }

  void PrintReport(const G4String& name) {
    G4double total = timer.GetRealElapsed();
    G4double avg = (calls > 0) ? total / calls : 0.0;

    G4cout << name << " Profile:" << G4endl;
    G4cout << "  Calls: " << calls << G4endl;
    G4cout << "  Total: " << total << " s" << G4endl;
    G4cout << "  Average: " << avg << " s" << G4endl;
    G4cout << "  Min: " << minTime << " s" << G4endl;
    G4cout << "  Max: " << maxTime << " s" << G4endl;
  }
};
```

## Common Pitfalls

1. **Forgetting to Clear() between sessions** - Unintentionally accumulates from previous runs
2. **Not tracking call counts** - Can't compute meaningful averages
3. **Mixing independent operations** - Accumulated time loses meaning
4. **Using for single operations** - G4Timer is more appropriate
5. **Sharing across threads** - Race conditions and corrupted measurements
6. **Querying during Start/Stop** - Returns accumulated time, but may not include current slice
7. **Assuming linear accumulation** - OS scheduling can cause variations
8. **Not documenting scope** - Unclear what the accumulated time represents

## Platform Differences

### Real Time Measurement

Unlike G4Timer, G4SliceTimer uses POSIX `times()` return value for real time, not `std::chrono`:

**Unix/Linux/macOS:**
- Real time from `times()` - less precise than chrono
- Resolution: System clock tick (typically 1-10ms)
- May wrap around on very long runs (implementation-dependent)

**Windows:**
- Uses custom `times()` implementation
- Resolution: Milliseconds
- Based on `GetSystemTime()`

### G4Timer vs G4SliceTimer Real Time

```cpp
// G4Timer - Higher precision
G4Timer timer1;
timer1.Start();
FastOperation();  // 0.001 seconds
timer1.Stop();
// Can measure microseconds accurately

// G4SliceTimer - Clock tick resolution
G4SliceTimer timer2;
timer2.Start();
FastOperation();  // 0.001 seconds
timer2.Stop();
// May round to nearest tick (10ms)
```

For very short operations, G4SliceTimer's real time may be less accurate than G4Timer's chrono-based measurement.

## Dependencies

**Standard Headers:**
- `<sys/times.h>` - CPU time measurement (Unix/Linux)
- `<unistd.h>` - POSIX functions (Unix/Linux)
- `<time.h>` - Time functions (Windows)

**Geant4 Headers:**
- `G4Types.hh` - Fundamental type definitions (G4double, G4bool, G4int)
- `G4ios.hh` - I/O stream definitions

## Related Classes

- **G4Timer** - Non-accumulating timer for single operations
- **G4Run** - May use slice timers for per-event timing
- **G4UserEventAction** - Common place to use slice timers
- **G4UserRunAction** - Can aggregate timing statistics

## When to Use G4SliceTimer vs G4Timer

### Use G4SliceTimer when:
- Measuring cumulative time across multiple operations
- Profiling frequently-called functions
- Tracking time in callbacks or event loops
- Building performance statistics over many iterations
- Need to accumulate time with Start/Stop cycles

### Use G4Timer when:
- Measuring single execution block
- Need highest precision real time (chrono)
- One-time performance measurement
- Benchmarking complete operations
- Don't need accumulation

### Example Decision:

```cpp
// Single operation - use G4Timer
G4Timer timer;
timer.Start();
InitializeApplication();
timer.Stop();

// Repeated operation - use G4SliceTimer
G4SliceTimer sliceTimer;
for (G4int i = 0; i < 1000; i++) {
  sliceTimer.Start();
  ProcessEvent(i);
  sliceTimer.Stop();
}
```

## See Also

- **G4Timer** - Non-accumulating high-precision timer
- **Global Module Overview** - `/home/user/geant4/docs/modules/global/overview.md`
- **Performance Profiling Guide** - Geant4 documentation
- POSIX times() manual page
- C++ chrono library documentation
