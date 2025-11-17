# G4Timer

High-precision timer for measuring elapsed CPU and wall-clock time

## Overview

`G4Timer` provides a platform-independent interface for measuring elapsed time during code execution. It tracks three types of time measurements: real (wall-clock) time using C++ high-resolution chrono, user CPU time, and system CPU time. The timer follows a simple start-stop paradigm and is suitable for performance measurement and profiling of single execution blocks.

G4Timer uses `std::chrono::high_resolution_clock` for real time measurements, providing nanosecond precision on most modern platforms. CPU times are measured using POSIX `times()` system calls on Unix/Linux and equivalent Windows APIs.

This timer is ideal for measuring the performance of discrete operations. For accumulated timing across multiple execution slices, use `G4SliceTimer` instead.

## Source Location

**Header:** `/home/user/geant4/source/global/management/include/G4Timer.hh`

**Inline Implementation:** `/home/user/geant4/source/global/management/include/G4Timer.icc`

**Source:** `/home/user/geant4/source/global/management/src/G4Timer.cc`

**Author:** P. Kent (1995)

**Revision:** G. Cosmo (1997) - Added Windows timing support

## Class Definition

```cpp
class G4Timer
{
 public:
  inline void Start();
  inline void Stop();
  inline G4bool IsValid() const;
  inline const char* GetClockTime() const;
  G4double GetRealElapsed() const;
  G4double GetSystemElapsed() const;
  G4double GetUserElapsed() const;

 private:
  G4bool fValidTimes{false};
  using clock_type = std::chrono::high_resolution_clock;
  std::chrono::time_point<clock_type> fStartRealTime, fEndRealTime;
  tms fStartTimes, fEndTimes;
};
```

## Public Methods

### Timer Control

#### Start()
```cpp
inline void Start()
```

**Purpose:** Start the timer and begin measuring elapsed time.

**Behavior:**
- Resets the validity flag to false
- Records the current CPU times using `times()` system call
- Records the current real time using `std::chrono::high_resolution_clock::now()`
- Can be called multiple times, but each call resets the start point

**Thread Safety:** Not thread-safe. Each thread should use its own timer instance.

**Example:**
```cpp
G4Timer timer;
timer.Start();
// Code to measure...
```

**Source:** `G4Timer.icc` lines 32-37

---

#### Stop()
```cpp
inline void Stop()
```

**Purpose:** Stop the timer and finalize time measurements.

**Behavior:**
- Records the current CPU times at stop point
- Records the current real time at stop point
- Sets the validity flag to true, enabling elapsed time queries
- Must be called after `Start()` to obtain valid measurements

**Thread Safety:** Not thread-safe. Use separate timer instances per thread.

**Example:**
```cpp
timer.Stop();
G4cout << "Elapsed time: " << timer.GetRealElapsed() << " s" << G4endl;
```

**Source:** `G4Timer.icc` lines 39-44

---

#### IsValid()
```cpp
inline G4bool IsValid() const
```

**Purpose:** Check if the timer has valid measurements.

**Returns:**
- `true` if `Stop()` has been called after `Start()`
- `false` if timer hasn't been stopped or `Start()` was called without subsequent `Stop()`

**Use Case:** Verify timer state before calling elapsed time methods.

**Example:**
```cpp
if (timer.IsValid()) {
  G4cout << timer.GetRealElapsed() << " seconds" << G4endl;
}
```

**Source:** `G4Timer.icc` line 46

---

### Time Retrieval Methods

#### GetRealElapsed()
```cpp
G4double GetRealElapsed() const
```

**Purpose:** Get the elapsed real (wall-clock) time between `Start()` and `Stop()`.

**Returns:** Elapsed real time in seconds (double precision)

**Behavior:**
- Throws `G4Exception` with `FatalException` severity if timer is not valid
- Computes difference between end and start time points using chrono duration
- Provides nanosecond-level precision on most platforms

**Real Time Definition:** Wall-clock time that includes:
- Actual CPU computation time
- Time waiting for I/O operations
- Time when process is not scheduled (OS multitasking)
- Time spent in other threads (for multi-threaded applications)

**Example:**
```cpp
timer.Start();
PerformSimulation();
timer.Stop();
G4double wallTime = timer.GetRealElapsed();
G4cout << "Wall time: " << wallTime << " s" << G4endl;
```

**Source:** `G4Timer.cc` lines 113-122

---

#### GetSystemElapsed()
```cpp
G4double GetSystemElapsed() const
```

**Purpose:** Get the elapsed system CPU time between `Start()` and `Stop()`.

**Returns:** Elapsed system CPU time in seconds (double precision)

**Behavior:**
- Throws `G4Exception` with `FatalException` severity if timer is not valid
- Computes difference in `tms_stime` fields from start and end
- Converts clock ticks to seconds using `sysconf(_SC_CLK_TCK)`

**System Time Definition:** CPU time spent in the kernel on behalf of the process:
- System calls (file I/O, network, process management)
- Kernel operations triggered by the process
- Page fault handling
- Signal handling
- Does NOT include time in user code

**Example:**
```cpp
timer.Start();
ReadLargeFile();  // Involves system I/O
timer.Stop();
G4double sysTime = timer.GetSystemElapsed();
G4cout << "System time: " << sysTime << " s" << G4endl;
```

**Source:** `G4Timer.cc` lines 124-133

---

#### GetUserElapsed()
```cpp
G4double GetUserElapsed() const
```

**Purpose:** Get the elapsed user CPU time between `Start()` and `Stop()`.

**Returns:** Elapsed user CPU time in seconds (double precision)

**Behavior:**
- Throws `G4Exception` with `FatalException` severity if timer is not valid
- Computes difference in `tms_utime` fields from start and end
- Converts clock ticks to seconds using `sysconf(_SC_CLK_TCK)`

**User Time Definition:** CPU time spent executing user-space code:
- Actual computational work in your application
- Physics calculations, algorithms, data processing
- Does NOT include time in system calls
- Does NOT include time waiting for I/O

**Example:**
```cpp
timer.Start();
PerformPhysicsCalculations();
timer.Stop();
G4double userTime = timer.GetUserElapsed();
G4cout << "User time: " << userTime << " s" << G4endl;
```

**Source:** `G4Timer.cc` lines 135-144

---

#### GetClockTime()
```cpp
inline const char* GetClockTime() const
```

**Purpose:** Get the current system date and time as a string.

**Returns:** Pointer to a static string containing the current date and time in ASCII format (e.g., "Mon Jan 1 12:00:00 2024\n")

**Behavior:**
- Calls `time()` to get current time
- Converts to local time using `localtime()`
- Formats as string using `asctime()`
- Independent of timer state (can be called anytime)

**Note:** The returned pointer points to static storage that may be overwritten by subsequent calls.

**Example:**
```cpp
G4Timer timer;
G4cout << "Simulation started at: " << timer.GetClockTime() << G4endl;
timer.Start();
// Run simulation...
timer.Stop();
G4cout << "Simulation ended at: " << timer.GetClockTime() << G4endl;
```

**Source:** `G4Timer.icc` lines 48-56

## Understanding Time Types

### Real Time (Wall-Clock Time)

**What it measures:** The actual elapsed time from a human perspective, as you would measure with a stopwatch.

**Components:**
- User CPU time (computation)
- System CPU time (kernel operations)
- I/O wait time
- Time when process is not scheduled
- Idle time

**When to use:**
- Measuring total execution time from user perspective
- Profiling operations with significant I/O
- Understanding overall performance including system overhead
- Comparing different algorithms end-to-end

**Example Scenario:**
```cpp
// Real time > User + System time due to I/O wait
timer.Start();
ReadGeometryFromFile();  // I/O operation
ProcessGeometry();        // Computation
timer.Stop();

// Real time = 5.0 seconds (includes I/O wait)
// User time = 1.0 seconds (computation only)
// System time = 0.5 seconds (file system calls)
// Wait time = 3.5 seconds (disk I/O)
```

### User Time

**What it measures:** CPU time spent executing your application code in user space.

**Components:**
- Physics calculations
- Algorithm execution
- Data structure manipulation
- Memory allocation in user space

**When to use:**
- Profiling computational algorithms
- Comparing CPU efficiency of different implementations
- Identifying CPU-intensive code sections
- Performance tuning of calculations

**Example Scenario:**
```cpp
// User time measures only computation
timer.Start();
for (G4int i = 0; i < 1000000; i++) {
  G4double result = CalculatePhysicsInteraction();  // Pure computation
}
timer.Stop();

// User time ≈ Real time (no I/O or system overhead)
```

### System Time

**What it measures:** CPU time spent in the kernel executing on behalf of your process.

**Components:**
- File I/O system calls (open, read, write, close)
- Network operations
- Process/thread management
- Memory management (page faults)
- Signal handling

**When to use:**
- Identifying I/O bottlenecks
- Detecting excessive system call overhead
- Profiling file or network operations
- Debugging resource management issues

**Example Scenario:**
```cpp
// High system time indicates system call overhead
timer.Start();
for (G4int i = 0; i < 10000; i++) {
  WriteToFile(data);  // Frequent system calls
}
timer.Stop();

// Real time = 10.0 seconds
// User time = 1.0 seconds
// System time = 3.0 seconds (high - many write() calls)
// I/O wait = 6.0 seconds
```

### Time Relationships

**In single-threaded applications:**
```
Real Time ≥ User Time + System Time
```

The difference is time spent waiting (I/O, scheduling, etc.).

**In multi-threaded applications (G4MULTITHREADED):**
```
Real Time ≤ User Time + System Time
```

Multiple CPU cores can execute simultaneously, so CPU time accumulates faster than wall-clock time.

**CPU Utilization:**
```cpp
G4double cpuUtil = (timer.GetUserElapsed() + timer.GetSystemElapsed())
                   / timer.GetRealElapsed() * 100.0;
```
- 100% = Single core fully utilized
- 400% = Four cores fully utilized (multi-threaded)
- <100% = I/O bound or underutilized

## Stream Output Operator

```cpp
std::ostream& operator<<(std::ostream& os, const G4Timer& t)
```

**Purpose:** Print timer measurements to an output stream.

**Output Format (when valid):**
```
User=1.234s Real=2.345s Sys=0.567s
```

**Multi-threaded builds (G4MULTITHREADED) also show CPU utilization:**
```
User=8.5s Real=2.1s Sys=0.3s [Cpu=419%]
```

**Output Format (when invalid):**
```
User=****s Real=****s Sys=****s
```

**Example:**
```cpp
G4Timer timer;
timer.Start();
DoWork();
timer.Stop();
G4cout << "Timing: " << timer << G4endl;
// Output: User=1.23s Real=1.50s Sys=0.10s
```

**Source:** `G4Timer.cc` lines 84-111

## Performance Measurement Examples

### Basic Timing Pattern

```cpp
#include "G4Timer.hh"

void MeasureOperation() {
  G4Timer timer;

  timer.Start();
  PerformSimulation();
  timer.Stop();

  G4cout << "Total time: " << timer << G4endl;
  G4cout << "Real elapsed: " << timer.GetRealElapsed() << " s" << G4endl;
}
```

### Comparing Algorithm Performance

```cpp
void CompareAlgorithms() {
  G4Timer timer1, timer2;

  // Algorithm 1
  timer1.Start();
  AlgorithmA();
  timer1.Stop();

  // Algorithm 2
  timer2.Start();
  AlgorithmB();
  timer2.Stop();

  G4cout << "Algorithm A - User: " << timer1.GetUserElapsed() << " s" << G4endl;
  G4cout << "Algorithm B - User: " << timer2.GetUserElapsed() << " s" << G4endl;

  if (timer1.GetUserElapsed() < timer2.GetUserElapsed()) {
    G4cout << "Algorithm A is faster" << G4endl;
  } else {
    G4cout << "Algorithm B is faster" << G4endl;
  }
}
```

### Profiling I/O vs Computation

```cpp
void ProfileOperations() {
  G4Timer ioTimer, computeTimer;

  // Measure I/O
  ioTimer.Start();
  ReadDataFromFile("input.dat");
  ioTimer.Stop();

  // Measure computation
  computeTimer.Start();
  ProcessData();
  computeTimer.Stop();

  G4cout << "I/O Operation:" << G4endl;
  G4cout << "  Real: " << ioTimer.GetRealElapsed() << " s" << G4endl;
  G4cout << "  System: " << ioTimer.GetSystemElapsed() << " s" << G4endl;

  G4cout << "Computation:" << G4endl;
  G4cout << "  Real: " << computeTimer.GetRealElapsed() << " s" << G4endl;
  G4cout << "  User: " << computeTimer.GetUserElapsed() << " s" << G4endl;

  // Analyze results
  G4double ioOverhead = ioTimer.GetSystemElapsed() / ioTimer.GetRealElapsed();
  G4cout << "I/O system overhead: " << (ioOverhead * 100.0) << "%" << G4endl;
}
```

### Nested Timing (Sub-operation Profiling)

```cpp
void ProfileComplexOperation() {
  G4Timer totalTimer, subTimer;

  totalTimer.Start();

  // Sub-operation 1
  subTimer.Start();
  InitializeGeometry();
  subTimer.Stop();
  G4cout << "Geometry init: " << subTimer.GetRealElapsed() << " s" << G4endl;

  // Sub-operation 2
  subTimer.Start();
  BuildPhysicsList();
  subTimer.Stop();
  G4cout << "Physics list: " << subTimer.GetRealElapsed() << " s" << G4endl;

  // Sub-operation 3
  subTimer.Start();
  RunSimulation();
  subTimer.Stop();
  G4cout << "Simulation: " << subTimer.GetRealElapsed() << " s" << G4endl;

  totalTimer.Stop();
  G4cout << "Total: " << totalTimer.GetRealElapsed() << " s" << G4endl;
}
```

### Performance Regression Testing

```cpp
G4bool CheckPerformance() {
  const G4double MAX_ALLOWED_TIME = 5.0;  // seconds

  G4Timer timer;
  timer.Start();
  RunBenchmark();
  timer.Stop();

  G4double elapsed = timer.GetRealElapsed();
  G4bool passed = (elapsed <= MAX_ALLOWED_TIME);

  G4cout << "Benchmark time: " << elapsed << " s" << G4endl;
  G4cout << "Maximum allowed: " << MAX_ALLOWED_TIME << " s" << G4endl;
  G4cout << "Status: " << (passed ? "PASSED" : "FAILED") << G4endl;

  return passed;
}
```

## Profiling Patterns

### Pattern 1: Event Loop Profiling

```cpp
void ProfileEventLoop() {
  G4Timer totalTimer, eventTimer;
  G4double minTime = 1e9, maxTime = 0.0, avgTime = 0.0;

  totalTimer.Start();

  for (G4int i = 0; i < numberOfEvents; i++) {
    eventTimer.Start();
    ProcessEvent(i);
    eventTimer.Stop();

    G4double eventTime = eventTimer.GetRealElapsed();
    avgTime += eventTime;
    if (eventTime < minTime) minTime = eventTime;
    if (eventTime > maxTime) maxTime = eventTime;
  }

  totalTimer.Stop();
  avgTime /= numberOfEvents;

  G4cout << "Event Statistics:" << G4endl;
  G4cout << "  Total events: " << numberOfEvents << G4endl;
  G4cout << "  Min time: " << minTime << " s" << G4endl;
  G4cout << "  Max time: " << maxTime << " s" << G4endl;
  G4cout << "  Avg time: " << avgTime << " s" << G4endl;
  G4cout << "  Total time: " << totalTimer.GetRealElapsed() << " s" << G4endl;
}
```

### Pattern 2: Conditional Timing

```cpp
class TimedOperation {
private:
  G4Timer timer;
  G4bool enabled;

public:
  TimedOperation(G4bool enable = true) : enabled(enable) {
    if (enabled) timer.Start();
  }

  ~TimedOperation() {
    if (enabled) {
      timer.Stop();
      G4cout << "Operation took: " << timer.GetRealElapsed() << " s" << G4endl;
    }
  }
};

// Usage:
void Function() {
  TimedOperation timing(verboseLevel > 1);
  // Work is automatically timed if verbose
  DoWork();
}  // Timer reports on destruction
```

### Pattern 3: Cumulative Profiling

```cpp
class PerformanceTracker {
private:
  struct Section {
    G4int callCount;
    G4double totalTime;
    G4double minTime;
    G4double maxTime;
  };

  std::map<G4String, Section> sections;
  G4Timer timer;

public:
  void StartSection(const G4String& name) {
    timer.Start();
  }

  void EndSection(const G4String& name) {
    timer.Stop();
    G4double elapsed = timer.GetRealElapsed();

    Section& sec = sections[name];
    sec.callCount++;
    sec.totalTime += elapsed;
    if (sec.callCount == 1 || elapsed < sec.minTime) sec.minTime = elapsed;
    if (sec.callCount == 1 || elapsed > sec.maxTime) sec.maxTime = elapsed;
  }

  void PrintReport() {
    G4cout << "\n=== Performance Report ===" << G4endl;
    for (auto& pair : sections) {
      const G4String& name = pair.first;
      const Section& sec = pair.second;
      G4double avgTime = sec.totalTime / sec.callCount;

      G4cout << name << ":" << G4endl;
      G4cout << "  Calls: " << sec.callCount << G4endl;
      G4cout << "  Total: " << sec.totalTime << " s" << G4endl;
      G4cout << "  Avg: " << avgTime << " s" << G4endl;
      G4cout << "  Min: " << sec.minTime << " s" << G4endl;
      G4cout << "  Max: " << sec.maxTime << " s" << G4endl;
    }
  }
};
```

### Pattern 4: Scope-Based RAII Timing

```cpp
class ScopedTimer {
private:
  G4Timer& timer;
  const G4String name;

public:
  ScopedTimer(G4Timer& t, const G4String& n) : timer(t), name(n) {
    G4cout << "Starting: " << name << G4endl;
    timer.Start();
  }

  ~ScopedTimer() {
    timer.Stop();
    G4cout << "Finished: " << name << " in "
           << timer.GetRealElapsed() << " s" << G4endl;
  }
};

// Usage:
void ComplexFunction() {
  G4Timer timer;

  {
    ScopedTimer st(timer, "Phase 1");
    DoPhase1();
  }  // Automatically stopped and reported

  {
    ScopedTimer st(timer, "Phase 2");
    DoPhase2();
  }  // Automatically stopped and reported
}
```

## Thread Safety Notes

### Non-Thread-Safe Design

`G4Timer` is **NOT thread-safe**. The class does not use internal locking or synchronization mechanisms.

**Reason:** Timer measurements are inherently per-thread. Synchronization overhead would corrupt timing measurements.

### Multi-Threaded Usage Patterns

#### Pattern 1: Thread-Local Timers (Recommended)

```cpp
// Each thread gets its own timer
void WorkerThread() {
  G4Timer localTimer;  // Thread-local

  localTimer.Start();
  DoThreadWork();
  localTimer.Stop();

  // Thread-safe if using thread-safe logging
  G4cout << "Thread time: " << localTimer.GetRealElapsed() << " s" << G4endl;
}
```

#### Pattern 2: Thread-Specific Storage

```cpp
class Manager {
private:
  G4ThreadLocal static G4Timer* threadTimer;

public:
  static void StartTiming() {
    if (!threadTimer) threadTimer = new G4Timer();
    threadTimer->Start();
  }

  static void StopTiming() {
    if (threadTimer) {
      threadTimer->Stop();
      G4cout << "Thread time: " << threadTimer->GetRealElapsed() << G4endl;
    }
  }
};

G4ThreadLocal G4Timer* Manager::threadTimer = nullptr;
```

#### Pattern 3: Master Thread Only

```cpp
void MultiThreadedSimulation() {
  G4Timer masterTimer;

  // Only master thread uses timer
  if (G4Threading::IsMasterThread()) {
    masterTimer.Start();
  }

  // All threads do work
  RunParallelSimulation();

  // Only master thread stops timer
  if (G4Threading::IsMasterThread()) {
    masterTimer.Stop();
    G4cout << "Total time: " << masterTimer.GetRealElapsed() << " s" << G4endl;
  }
}
```

### CPU Time in Multi-Threaded Context

In multi-threaded builds (G4MULTITHREADED), CPU time behavior differs:

```cpp
// 4-core system, 4 threads fully utilized
timer.Start();
RunParallelSimulation();  // 4 threads working
timer.Stop();

G4double real = timer.GetRealElapsed();    // 2.0 seconds
G4double user = timer.GetUserElapsed();    // 8.0 seconds
G4double sys = timer.GetSystemElapsed();   // 0.5 seconds

// Total CPU time > Real time (parallel execution)
G4double cpuUtil = (user + sys) / real * 100.0;  // 425%
```

The stream operator automatically shows this:
```
User=8.0s Real=2.0s Sys=0.5s [Cpu=425%]
```

## Best Practices

### 1. Always Check Validity

```cpp
// GOOD
timer.Start();
DoWork();
timer.Stop();
if (timer.IsValid()) {
  G4double time = timer.GetRealElapsed();
}

// BAD - May throw exception
timer.Start();
G4double time = timer.GetRealElapsed();  // ERROR: Not stopped!
```

### 2. Match Start/Stop Calls

```cpp
// GOOD - Balanced calls
timer.Start();
DoWork();
timer.Stop();

// BAD - Multiple starts without stop
timer.Start();
DoWork1();
timer.Start();  // Resets timer! Previous timing lost
DoWork2();
timer.Stop();   // Only measures DoWork2
```

### 3. Choose Appropriate Time Metric

```cpp
// Use USER time for CPU-bound algorithms
timer.Start();
SortLargeArray();  // Pure computation
timer.Stop();
G4double cpuTime = timer.GetUserElapsed();

// Use REAL time for I/O-bound operations
timer.Start();
LoadGeometry();  // I/O operation
timer.Stop();
G4double totalTime = timer.GetRealElapsed();

// Use SYSTEM time to identify I/O bottlenecks
if (timer.GetSystemElapsed() > timer.GetUserElapsed()) {
  G4cout << "WARNING: I/O bound operation" << G4endl;
}
```

### 4. Minimize Timer Overhead

```cpp
// GOOD - Timer outside loop
timer.Start();
for (G4int i = 0; i < 1000000; i++) {
  FastOperation();
}
timer.Stop();

// BAD - Timer overhead affects measurement
for (G4int i = 0; i < 1000000; i++) {
  timer.Start();  // Overhead!
  FastOperation();
  timer.Stop();   // Overhead!
}
```

### 5. Use Descriptive Output

```cpp
// GOOD - Clear context
G4cout << "Geometry construction: " << timer.GetRealElapsed() << " s" << G4endl;

// BETTER - More information
G4cout << "Geometry construction:" << G4endl;
G4cout << "  Real time: " << timer.GetRealElapsed() << " s" << G4endl;
G4cout << "  User time: " << timer.GetUserElapsed() << " s" << G4endl;
G4cout << "  CPU efficiency: "
       << (timer.GetUserElapsed() / timer.GetRealElapsed() * 100.0)
       << "%" << G4endl;
```

### 6. Handle Exceptions Properly

```cpp
// GOOD - Exception-safe timing
timer.Start();
try {
  RiskyOperation();
  timer.Stop();
} catch (const G4Exception& e) {
  // Timer may not be stopped - don't query times
  G4cout << "Operation failed: " << e.what() << G4endl;
  // Don't call timer.GetRealElapsed() here!
}
```

### 7. Use Stream Operator for Quick Output

```cpp
// GOOD - Compact and informative
timer.Start();
DoWork();
timer.Stop();
G4cout << "Performance: " << timer << G4endl;
// Output: Performance: User=1.23s Real=1.50s Sys=0.10s

// Instead of verbose:
G4cout << "User=" << timer.GetUserElapsed()
       << "s Real=" << timer.GetRealElapsed()
       << "s Sys=" << timer.GetSystemElapsed() << "s" << G4endl;
```

### 8. Profile Representative Workloads

```cpp
// GOOD - Realistic workload
timer.Start();
for (G4int i = 0; i < 10000; i++) {
  ProcessEvent();  // Typical event
}
timer.Stop();
G4double avgTime = timer.GetRealElapsed() / 10000.0;

// BAD - Timing is too short to be accurate
timer.Start();
ProcessSingleEvent();  // 0.0001 seconds - imprecise
timer.Stop();
```

### 9. Document Timing Points

```cpp
// GOOD - Well documented
// Measure physics list construction time
// Expected: 0.1-0.5 seconds for standard EM physics
timer.Start();
BuildPhysicsList();
timer.Stop();
G4cout << "Physics list build time: " << timer.GetRealElapsed() << " s" << G4endl;

if (timer.GetRealElapsed() > 1.0) {
  G4cout << "WARNING: Physics list build took longer than expected" << G4endl;
}
```

### 10. Use for Optimization Feedback

```cpp
// Iterative optimization with timing feedback
void OptimizeAlgorithm() {
  G4Timer baselineTimer, optimizedTimer;

  // Baseline
  baselineTimer.Start();
  BaselineImplementation();
  baselineTimer.Stop();

  // Optimized
  optimizedTimer.Start();
  OptimizedImplementation();
  optimizedTimer.Stop();

  G4double speedup = baselineTimer.GetUserElapsed() /
                     optimizedTimer.GetUserElapsed();

  G4cout << "Optimization Results:" << G4endl;
  G4cout << "  Baseline: " << baselineTimer.GetUserElapsed() << " s" << G4endl;
  G4cout << "  Optimized: " << optimizedTimer.GetUserElapsed() << " s" << G4endl;
  G4cout << "  Speedup: " << speedup << "x" << G4endl;

  if (speedup < 1.1) {
    G4cout << "WARNING: Optimization had minimal effect" << G4endl;
  }
}
```

## Platform Differences

### Unix/Linux/macOS (POSIX)

- Uses `<sys/times.h>` and `<unistd.h>`
- System call: `times()` from POSIX.1
- Clock tick rate: Retrieved via `sysconf(_SC_CLK_TCK)`
- Typical resolution: 1-10 milliseconds for CPU time
- Real time: Nanosecond precision via `std::chrono::high_resolution_clock`

### Windows (WIN32/MINGW)

- Uses `<time.h>` and Windows-specific APIs
- System call: `GetProcessTimes()` and `GetSystemTime()`
- Clock tick rate: 1000 (milliseconds)
- Resolution: Millisecond precision
- Real time: High-resolution performance counter via chrono

### Clock Tick Conversion

CPU times are stored as clock ticks and converted to seconds:

```cpp
G4double seconds = clockTicks / sysconf(_SC_CLK_TCK);
```

Common `_SC_CLK_TCK` values:
- Linux: 100 (10ms per tick)
- Some Unix: 1000 (1ms per tick)
- Windows: 1000 (1ms per tick)

## Dependencies

**Standard Headers:**
- `<chrono>` - High-resolution clock for real time
- `<sys/times.h>` - CPU time measurement (Unix/Linux)
- `<unistd.h>` - POSIX functions (Unix/Linux)
- `<time.h>` - Time functions (Windows)
- `<iomanip>` - Stream formatting (in .cc file)

**Geant4 Headers:**
- `G4Types.hh` - Fundamental type definitions (G4double, G4bool, G4int)
- `G4ios.hh` - I/O stream definitions
- `G4Exception.hh` - Exception handling

## Related Classes

- **G4SliceTimer** - Accumulating timer for multiple execution slices
- **G4Run** - Uses timers to track run timing
- **G4Event** - May use timers for event processing time
- **G4Run::RecordEvent()** - Often uses timers internally

## Common Pitfalls

1. **Querying times before Stop()** - Throws fatal exception
2. **Restarting timer without analyzing previous result** - Loses timing data
3. **Using same timer instance across threads** - Race conditions and corruption
4. **Timing very short operations** - Resolution limits accuracy
5. **Ignoring timer overhead in tight loops** - Measurement affects results
6. **Comparing User time in multi-threaded context** - Sums all thread CPU time
7. **Forgetting to stop timer in exception paths** - Invalid state
8. **Assuming Real time ≈ User + System time in all cases** - Not true with I/O or multi-threading

## See Also

- **G4SliceTimer** - For accumulated timing measurements
- **Global Module Overview** - `/home/user/geant4/docs/modules/global/overview.md`
- **Run Manager Timing** - G4RunManager timing infrastructure
- POSIX times() manual page
- C++ chrono library documentation
