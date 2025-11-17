# G4Timer API Documentation

## Overview

`G4Timer` is a utility class for measuring elapsed time during simulation. It can measure real (wall-clock) time, user CPU time, and system CPU time. The timer is useful for performance profiling, benchmarking, and monitoring simulation progress.

::: tip Header File
**Location:** `source/global/management/include/G4Timer.hh`
**Author:** P.Kent - August 1995
**Revision:** G.Cosmo - April 1997 (Windows support)
:::

## Class Declaration

`source/global/management/include/G4Timer.hh:108-124`

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

## Time Measurement Types

### Real Time (Wall-Clock Time)
- **Definition**: Actual elapsed time in the real world
- **Includes**: CPU time + I/O wait + sleep time + everything else
- **Use Case**: Overall performance, user-visible runtime

### User Time
- **Definition**: CPU time spent executing user code
- **Excludes**: System calls, kernel time
- **Use Case**: Pure computation time measurement

### System Time
- **Definition**: CPU time spent in kernel on behalf of the process
- **Includes**: System calls, I/O operations, memory management
- **Use Case**: I/O-intensive operation profiling

## Core Methods

### Start()

`source/global/management/include/G4Timer.hh:111`

```cpp
inline void Start();
```

Starts or restarts the timer.

**Behavior:**
- Records current real, user, and system times
- Can be called multiple times to restart
- Previous measurements are lost when restarted

**Example:**
```cpp
G4Timer timer;
timer.Start();

// Run simulation
DoWork();

timer.Stop();
```

### Stop()

`source/global/management/include/G4Timer.hh:112`

```cpp
inline void Stop();
```

Stops the timer and records end times.

**Behavior:**
- Records current real, user, and system times
- Calculates elapsed times
- Timer becomes valid (IsValid() returns true)
- Can be called multiple times; uses last stop time

**Example:**
```cpp
timer.Start();
ProcessEvents();
timer.Stop();

G4cout << "Processing took " << timer.GetRealElapsed() << " seconds" << G4endl;
```

### IsValid()

`source/global/management/include/G4Timer.hh:113`

```cpp
inline G4bool IsValid() const;
```

Checks if timer has been properly started and stopped.

**Returns:**
- `true`: Both Start() and Stop() have been called
- `false`: Timer not properly initialized

**Example:**
```cpp
timer.Start();
DoWork();
timer.Stop();

if (timer.IsValid()) {
    G4cout << "Elapsed: " << timer.GetRealElapsed() << " s" << G4endl;
} else {
    G4cout << "Timer not valid!" << G4endl;
}
```

## Time Retrieval Methods

### GetRealElapsed()

`source/global/management/include/G4Timer.hh:115`

```cpp
G4double GetRealElapsed() const;
```

Returns elapsed real (wall-clock) time.

**Returns:** Elapsed time in seconds

**Precision:** Microsecond resolution (uses `std::chrono::high_resolution_clock`)

**Example:**
```cpp
timer.Start();
SimulateRun();
timer.Stop();

G4double realTime = timer.GetRealElapsed();
G4cout << "Simulation completed in " << realTime << " seconds" << G4endl;
```

### GetUserElapsed()

`source/global/management/include/G4Timer.hh:117`

```cpp
G4double GetUserElapsed() const;
```

Returns elapsed user CPU time.

**Returns:** User CPU time in seconds

**Note:** Measures actual CPU time spent in user-space code

**Example:**
```cpp
G4double userTime = timer.GetUserElapsed();
G4cout << "CPU time (user): " << userTime << " seconds" << G4endl;
```

### GetSystemElapsed()

`source/global/management/include/G4Timer.hh:116`

```cpp
G4double GetSystemElapsed() const;
```

Returns elapsed system CPU time.

**Returns:** System CPU time in seconds

**Note:** Measures CPU time spent in kernel on behalf of the process

**Example:**
```cpp
G4double systemTime = timer.GetSystemElapsed();
G4cout << "CPU time (system): " << systemTime << " seconds" << G4endl;
```

### GetClockTime()

`source/global/management/include/G4Timer.hh:114`

```cpp
inline const char* GetClockTime() const;
```

Returns current clock time as a string.

**Returns:** C-string with current time (e.g., "14:23:45")

**Note:** Returns current time, not elapsed time

**Example:**
```cpp
G4cout << "Simulation started at: " << timer.GetClockTime() << G4endl;
```

## Stream Output Operator

`source/global/management/include/G4Timer.hh:126`

```cpp
std::ostream& operator<<(std::ostream& os, const G4Timer& t);
```

Formatted output of timer measurements.

**Output Format:**
```
User=<user_time>s Real=<real_time>s Sys=<system_time>s
```

If timer is not valid, prints `**s` for each time.

**Example:**
```cpp
timer.Start();
DoWork();
timer.Stop();

G4cout << "Timing: " << timer << G4endl;
// Output: User=1.234s Real=1.256s Sys=0.022s
```

## Usage Examples

### Basic Timing

```cpp
void TimedSimulation()
{
    G4Timer timer;

    // Start timing
    timer.Start();

    // Run simulation
    runManager->BeamOn(1000);

    // Stop timing
    timer.Stop();

    // Print results
    if (timer.IsValid()) {
        G4cout << "Simulation timing:" << G4endl;
        G4cout << "  Real time:   " << timer.GetRealElapsed() << " s" << G4endl;
        G4cout << "  User time:   " << timer.GetUserElapsed() << " s" << G4endl;
        G4cout << "  System time: " << timer.GetSystemElapsed() << " s" << G4endl;
    }
}
```

### Performance Profiling

```cpp
void ProfileInitialization()
{
    G4Timer geometryTimer, physicsTimer, totalTimer;

    totalTimer.Start();

    // Time geometry construction
    geometryTimer.Start();
    runManager->SetUserInitialization(new MyDetectorConstruction());
    geometryTimer.Stop();

    // Time physics list initialization
    physicsTimer.Start();
    runManager->SetUserInitialization(new MyPhysicsList());
    physicsTimer.Stop();

    totalTimer.Stop();

    // Report timing breakdown
    G4cout << "\n=== Initialization Timing ===" << G4endl;
    G4cout << "Geometry:    " << geometryTimer << G4endl;
    G4cout << "Physics:     " << physicsTimer << G4endl;
    G4cout << "Total:       " << totalTimer << G4endl;

    // Calculate percentages
    G4double total = totalTimer.GetRealElapsed();
    G4cout << "\nBreakdown:" << G4endl;
    G4cout << "  Geometry: " << (geometryTimer.GetRealElapsed()/total)*100
           << "%" << G4endl;
    G4cout << "  Physics:  " << (physicsTimer.GetRealElapsed()/total)*100
           << "%" << G4endl;
}
```

### Event Loop Timing

```cpp
class TimedRunAction : public G4UserRunAction
{
 public:
  void BeginOfRunAction(const G4Run* run) override
  {
    fRunTimer.Start();
    G4cout << "Run " << run->GetRunID() << " started at: "
           << fRunTimer.GetClockTime() << G4endl;
  }

  void EndOfRunAction(const G4Run* run) override
  {
    fRunTimer.Stop();

    G4int nEvents = run->GetNumberOfEvent();
    G4double realTime = fRunTimer.GetRealElapsed();
    G4double userTime = fRunTimer.GetUserElapsed();

    G4cout << "\n=== Run " << run->GetRunID() << " Completed ===" << G4endl;
    G4cout << "Events processed: " << nEvents << G4endl;
    G4cout << "Total time:       " << fRunTimer << G4endl;
    G4cout << "Time per event:   " << realTime/nEvents << " s" << G4endl;
    G4cout << "Event rate:       " << nEvents/realTime << " events/s" << G4endl;
  }

 private:
  G4Timer fRunTimer;
};
```

### Comparing Different Configurations

```cpp
void CompareConfigurations()
{
    G4Timer timer1, timer2;

    // Configuration 1
    G4cout << "Testing Configuration 1..." << G4endl;
    SetupConfiguration1();
    timer1.Start();
    runManager->BeamOn(1000);
    timer1.Stop();

    // Configuration 2
    G4cout << "Testing Configuration 2..." << G4endl;
    SetupConfiguration2();
    timer2.Start();
    runManager->BeamOn(1000);
    timer2.Stop();

    // Compare results
    G4cout << "\n=== Performance Comparison ===" << G4endl;
    G4cout << "Configuration 1: " << timer1 << G4endl;
    G4cout << "Configuration 2: " << timer2 << G4endl;

    G4double speedup = timer1.GetRealElapsed() / timer2.GetRealElapsed();
    G4cout << "Speedup: " << speedup << "x" << G4endl;
}
```

### Cumulative Timing

```cpp
class CumulativeTimer
{
 public:
  void StartTiming()
  {
    fTimer.Start();
  }

  void StopTiming()
  {
    fTimer.Stop();
    if (fTimer.IsValid()) {
      fTotalReal += fTimer.GetRealElapsed();
      fTotalUser += fTimer.GetUserElapsed();
      fTotalSystem += fTimer.GetSystemElapsed();
      fCount++;
    }
  }

  void PrintStatistics() const
  {
    G4cout << "=== Cumulative Timing Statistics ===" << G4endl;
    G4cout << "Number of measurements: " << fCount << G4endl;
    G4cout << "Total real time:        " << fTotalReal << " s" << G4endl;
    G4cout << "Total user time:        " << fTotalUser << " s" << G4endl;
    G4cout << "Total system time:      " << fTotalSystem << " s" << G4endl;

    if (fCount > 0) {
      G4cout << "Average real time:      " << fTotalReal/fCount << " s" << G4endl;
      G4cout << "Average user time:      " << fTotalUser/fCount << " s" << G4endl;
    }
  }

 private:
  G4Timer fTimer;
  G4double fTotalReal = 0.0;
  G4double fTotalUser = 0.0;
  G4double fTotalSystem = 0.0;
  G4int fCount = 0;
};
```

### I/O Performance Analysis

```cpp
void AnalyzeIOPerformance()
{
    G4Timer timer;

    timer.Start();
    WriteOutputFile();  // I/O intensive
    timer.Stop();

    G4double realTime = timer.GetRealElapsed();
    G4double userTime = timer.GetUserElapsed();
    G4double systemTime = timer.GetSystemElapsed();
    G4double cpuTime = userTime + systemTime;

    G4cout << "I/O Performance Analysis:" << G4endl;
    G4cout << "  Real time:   " << realTime << " s" << G4endl;
    G4cout << "  CPU time:    " << cpuTime << " s" << G4endl;
    G4cout << "  I/O wait:    " << (realTime - cpuTime) << " s" << G4endl;
    G4cout << "  CPU usage:   " << (cpuTime/realTime)*100 << "%" << G4endl;

    if (cpuTime < realTime * 0.5) {
        G4cout << "  -> I/O bound operation" << G4endl;
    } else {
        G4cout << "  -> CPU bound operation" << G4endl;
    }
}
```

### Progress Monitoring

```cpp
class ProgressMonitor
{
 public:
  void StartMonitoring(G4int totalEvents)
  {
    fTotalEvents = totalEvents;
    fTimer.Start();
    fLastReportTime = 0.0;
  }

  void UpdateProgress(G4int currentEvent)
  {
    fTimer.Stop();
    G4double elapsed = fTimer.GetRealElapsed();

    // Report every 10 seconds
    if (elapsed - fLastReportTime > 10.0) {
      G4double eventsPerSecond = currentEvent / elapsed;
      G4double remaining = (fTotalEvents - currentEvent) / eventsPerSecond;

      G4cout << "Progress: " << currentEvent << "/" << fTotalEvents
             << " (" << (currentEvent*100.0/fTotalEvents) << "%)" << G4endl;
      G4cout << "  Rate: " << eventsPerSecond << " events/s" << G4endl;
      G4cout << "  Estimated time remaining: " << remaining/60.0
             << " minutes" << G4endl;

      fLastReportTime = elapsed;
    }

    fTimer.Start();  // Continue timing
  }

 private:
  G4Timer fTimer;
  G4int fTotalEvents = 0;
  G4double fLastReportTime = 0.0;
};
```

### Benchmarking

```cpp
void BenchmarkPhysicsProcesses()
{
    struct ProcessTiming {
        G4String name;
        G4Timer timer;
        G4int callCount = 0;
    };

    std::map<G4String, ProcessTiming> timings;

    // Initialize process list
    std::vector<G4String> processes = {
        "Transportation", "Ionization", "MultipleScattering", "Bremsstrahlung"
    };

    for (const auto& procName : processes) {
        timings[procName].name = procName;
    }

    // Measure each process (simplified example)
    for (auto& [name, timing] : timings) {
        timing.timer.Start();
        // Simulate process calls
        for (G4int i = 0; i < 10000; ++i) {
            CallProcess(name);
            timing.callCount++;
        }
        timing.timer.Stop();
    }

    // Report results
    G4cout << "\n=== Physics Process Benchmark ===" << G4endl;
    G4cout << std::setw(20) << "Process"
           << std::setw(12) << "Calls"
           << std::setw(15) << "Total Time"
           << std::setw(15) << "Per Call" << G4endl;
    G4cout << std::string(62, '-') << G4endl;

    for (const auto& [name, timing] : timings) {
        G4double total = timing.timer.GetRealElapsed();
        G4double perCall = total / timing.callCount;

        G4cout << std::setw(20) << name
               << std::setw(12) << timing.callCount
               << std::setw(15) << total
               << std::setw(15) << perCall << G4endl;
    }
}
```

## Platform-Specific Behavior

### POSIX Systems (Linux, macOS)
`source/global/management/include/G4Timer.hh:75-77`

Uses standard POSIX timing functions:
- `times()` for CPU time
- `sysconf(_SC_CLK_TCK)` for clock tick resolution

### Windows
`source/global/management/include/G4Timer.hh:78-100`

Uses Windows-specific timing:
- Custom `tms` structure definition
- `times()` compatibility wrapper
- May have different precision characteristics

## Precision and Accuracy

### Real Time
- **Precision**: Microseconds (std::chrono::high_resolution_clock)
- **Accuracy**: System-dependent, typically very accurate
- **Resolution**: Platform-dependent, usually nanoseconds

### CPU Time
- **Precision**: Clock ticks (typically 10ms on many systems)
- **Accuracy**: Good for longer measurements (>0.1s)
- **Resolution**: System clock tick period

## Performance Overhead

- **Start/Stop Operations**: < 1 microsecond
- **Memory Footprint**: ~64 bytes per timer
- **Recommendation**: Fine for per-run timing, avoid per-step timing

## Thread Safety

### Multi-Threading Behavior
- `G4Timer` is **NOT thread-safe** by itself
- Each thread should have its own timer instance
- Reading shared timer from multiple threads is unsafe

### Thread-Local Pattern
```cpp
class MyAction : public G4UserAction
{
 public:
  MyAction() { fTimer.Start(); }  // Each thread gets own timer

  void Action() {
    // Use thread-local timer
    fTimer.Stop();
    G4cout << "Thread timing: " << fTimer << G4endl;
    fTimer.Start();
  }

 private:
  G4Timer fTimer;  // Thread-local in MT mode
};
```

## Best Practices

1. **Start Before, Stop After**: Always match Start() and Stop() calls
2. **Check IsValid()**: Verify timer is valid before reading results
3. **Use Appropriate Time**: Real time for overall, CPU time for algorithms
4. **Avoid Short Intervals**: CPU time has limited precision for very short intervals
5. **Profile in Release Mode**: Timing debug builds doesn't reflect production performance

## Common Pitfalls

### 1. Reading Without Stop

**Problem:**
```cpp
timer.Start();
DoWork();
G4double elapsed = timer.GetRealElapsed();  // Not stopped yet!
```

**Solution:**
```cpp
timer.Start();
DoWork();
timer.Stop();  // Must stop first
G4double elapsed = timer.GetRealElapsed();
```

### 2. Forgetting IsValid Check

**Problem:**
```cpp
G4Timer timer;
G4cout << timer.GetRealElapsed();  // Invalid! Will get garbage
```

**Solution:**
```cpp
G4Timer timer;
timer.Start();
DoWork();
timer.Stop();
if (timer.IsValid()) {
    G4cout << timer.GetRealElapsed();
}
```

### 3. Reusing Timer Without Restart

**Problem:**
```cpp
timer.Start();
Work1();
timer.Stop();
// Want to time Work2, but forget to restart
Work2();
timer.Stop();  // Still has Work1 start time!
```

**Solution:**
```cpp
timer.Start();
Work1();
timer.Stop();
// Process Work1 timing

timer.Start();  // Restart for Work2
Work2();
timer.Stop();
```

### 4. Expecting High Precision CPU Time

**Problem:**
```cpp
timer.Start();
QuickOperation();  // Takes 0.001s
timer.Stop();
G4cout << timer.GetUserElapsed();  // May be 0 or imprecise
```

**Solution:** Use real time for short operations, or repeat many times

## See Also

- [G4ios](./g4ios.md) - I/O streams for output
- [G4RunManager](../run/api/g4runmanager.md) - Run control and timing
- [Performance Profiling Guide](../guides/profiling.md) - Optimization techniques
- [Global Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/global/management/include/G4Timer.hh`
- Source: `source/global/management/src/G4Timer.cc`
- Inline: `source/global/management/include/G4Timer.icc`
:::
