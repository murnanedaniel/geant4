# G4ios API Documentation

## Overview

The G4ios system provides global I/O stream objects `G4cout` and `G4cerr` that replace standard `std::cout` and `std::cerr` in Geant4. These streams support output redirection, thread-safe operation in multi-threaded mode, and custom destination handling for GUI integration or logging systems.

::: tip Header File
**Location:** `source/global/management/include/G4ios.hh`
**Authors:** H.Yoshida, M.Nagamatu - November 1998
:::

## Global Stream Objects

### G4cout

`source/global/management/include/G4ios.hh:43-44, 52-53`

Standard output stream for Geant4.

**Single-Threaded:**
```cpp
extern G4GLOB_DLL std::ostream G4cout;
```

**Multi-Threaded:**
```cpp
extern G4GLOB_DLL std::ostream*& _G4cout_p();
#define G4cout (*_G4cout_p())
```

**Usage:** Equivalent to `std::cout` but thread-aware and redirectable

**Example:**
```cpp
G4cout << "Hello from Geant4!" << G4endl;
G4cout << "Energy: " << energy/MeV << " MeV" << G4endl;
```

### G4cerr

`source/global/management/include/G4ios.hh:45-46, 54`

Error output stream for Geant4.

**Single-Threaded:**
```cpp
extern G4GLOB_DLL std::ostream G4cerr;
```

**Multi-Threaded:**
```cpp
extern G4GLOB_DLL std::ostream*& _G4cerr_p();
#define G4cerr (*_G4cerr_p())
```

**Usage:** Equivalent to `std::cerr` but thread-aware and redirectable

**Example:**
```cpp
G4cerr << "ERROR: Invalid parameter value" << G4endl;
G4cerr << "WARNING: Configuration may be suboptimal" << G4endl;
```

### G4cin

`source/global/management/include/G4ios.hh:66`

Standard input stream (simple alias).

```cpp
#define G4cin std::cin
```

**Usage:** Direct alias to `std::cin`, not customized

**Example:**
```cpp
G4int value;
G4cout << "Enter a value: ";
G4cin >> value;
```

### G4endl

`source/global/management/include/G4ios.hh:67`

End-line manipulator (simple alias).

```cpp
#define G4endl std::endl
```

**Usage:** Direct alias to `std::endl`, flushes the stream

**Example:**
```cpp
G4cout << "First line" << G4endl;
G4cout << "Second line" << G4endl;
```

### G4debug (Optional)

`source/global/management/include/G4ios.hh:43, 46`

Debug output stream (multi-threaded mode only).

**Multi-Threaded:**
```cpp
extern G4GLOB_DLL std::ostream*& _G4debug_p();
#define G4debug (*_G4debug_p())
```

**Usage:** Additional debug stream, may be disabled in production builds

## Initialization and Finalization

### G4iosInitialization()

`source/global/management/include/G4ios.hh:58`

```cpp
void G4iosInitialization();
```

Initializes the G4ios system.

**When Called:** Automatically during Geant4 initialization

**User Calls:** Rarely needed (handled by RunManager)

**Behavior:**
- Sets up stream objects
- Configures default destinations
- Thread-local initialization in MT mode

### G4iosFinalization()

`source/global/management/include/G4ios.hh:59`

```cpp
void G4iosFinalization();
```

Cleans up the G4ios system.

**When Called:** Automatically during Geant4 shutdown

**Behavior:**
- Flushes all streams
- Releases resources
- Thread-local cleanup in MT mode

## Output Redirection

### G4iosSetDestination()

`source/global/management/include/G4ios.hh:62-64`

```cpp
void G4iosSetDestination(G4coutDestination* sink);
```

Redirects G4cout and G4cerr to a custom destination.

**Parameters:**
- `sink`: Pointer to custom destination handler (or `nullptr` to restore default)

**Ownership:** Caller retains ownership - must call with `nullptr` before destroying

**Use Cases:**
- GUI integration (display output in window)
- Logging to files
- Network streaming
- Custom formatting

**Example:**
```cpp
// Create custom destination
MyCustomDestination* dest = new MyCustomDestination();
G4iosSetDestination(dest);

// All G4cout/G4cerr now go to custom destination
G4cout << "This goes to custom destination" << G4endl;

// Restore default before destroying
G4iosSetDestination(nullptr);
delete dest;
```

## Custom Destination Class

To redirect output, inherit from `G4coutDestination`:

```cpp
class G4coutDestination
{
 public:
  virtual ~G4coutDestination() = default;

  // Override these methods
  virtual G4int ReceiveG4cout(const G4String& msg) = 0;
  virtual G4int ReceiveG4cerr(const G4String& msg) = 0;
  virtual G4int ReceiveG4debug(const G4String& msg) { return 0; }
};
```

### ReceiveG4cout()
Called when output is sent to G4cout.

**Parameters:**
- `msg`: The output string

**Returns:** Typically 0 (unused)

### ReceiveG4cerr()
Called when output is sent to G4cerr.

**Parameters:**
- `msg`: The error/warning string

**Returns:** Typically 0 (unused)

### ReceiveG4debug()
Called when output is sent to G4debug (optional).

**Parameters:**
- `msg`: The debug string

**Returns:** Typically 0 (unused)

## Usage Examples

### Basic Output

```cpp
void PrintEventInfo(const G4Event* event)
{
    G4cout << "=== Event " << event->GetEventID() << " ===" << G4endl;
    G4cout << "Number of primaries: "
           << event->GetNumberOfPrimaryVertex() << G4endl;
    G4cout << "Processing complete" << G4endl;
}
```

### Error Reporting

```cpp
void ValidateParameters(G4double energy)
{
    if (energy < 0) {
        G4cerr << "ERROR: Negative energy not allowed!" << G4endl;
        G4cerr << "  Requested energy: " << energy << G4endl;
        return;
    }

    if (energy > 100*TeV) {
        G4cerr << "WARNING: Energy " << energy/TeV << " TeV is very high"
               << G4endl;
    }
}
```

### Formatted Output

```cpp
void PrintStatistics(G4int nEvents, G4double time)
{
    G4cout << std::fixed << std::setprecision(2);
    G4cout << "Simulation Statistics:" << G4endl;
    G4cout << "  Events:     " << std::setw(10) << nEvents << G4endl;
    G4cout << "  Time:       " << std::setw(10) << time << " s" << G4endl;
    G4cout << "  Rate:       " << std::setw(10) << nEvents/time
           << " events/s" << G4endl;
}
```

### File Redirection (Simple)

```cpp
class FileDestination : public G4coutDestination
{
 public:
  FileDestination(const G4String& filename)
  {
    fOutFile.open(filename);
  }

  ~FileDestination()
  {
    if (fOutFile.is_open()) {
      fOutFile.close();
    }
  }

  G4int ReceiveG4cout(const G4String& msg) override
  {
    if (fOutFile.is_open()) {
      fOutFile << msg << std::flush;
    }
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    if (fOutFile.is_open()) {
      fOutFile << "ERROR: " << msg << std::flush;
    }
    return 0;
  }

 private:
  std::ofstream fOutFile;
};

// Usage
FileDestination* fileDest = new FileDestination("output.log");
G4iosSetDestination(fileDest);

// All output goes to file
G4cout << "This goes to output.log" << G4endl;

// Restore and cleanup
G4iosSetDestination(nullptr);
delete fileDest;
```

### GUI Integration

```cpp
class GUIDestination : public G4coutDestination
{
 public:
  GUIDestination(GUITextWidget* widget) : fWidget(widget) {}

  G4int ReceiveG4cout(const G4String& msg) override
  {
    if (fWidget) {
      fWidget->AppendText(msg, GUITextWidget::COLOR_BLACK);
      fWidget->ScrollToEnd();
    }
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    if (fWidget) {
      fWidget->AppendText(msg, GUITextWidget::COLOR_RED);
      fWidget->ScrollToEnd();
    }
    return 0;
  }

 private:
  GUITextWidget* fWidget;
};

// In GUI initialization
GUITextWidget* outputWidget = CreateOutputWidget();
GUIDestination* guiDest = new GUIDestination(outputWidget);
G4iosSetDestination(guiDest);

// All Geant4 output appears in GUI
```

### Dual Output (Console + File)

```cpp
class DualDestination : public G4coutDestination
{
 public:
  DualDestination(const G4String& filename)
  {
    fLogFile.open(filename);
  }

  ~DualDestination()
  {
    if (fLogFile.is_open()) {
      fLogFile.close();
    }
  }

  G4int ReceiveG4cout(const G4String& msg) override
  {
    // Send to both console and file
    std::cout << msg << std::flush;

    if (fLogFile.is_open()) {
      fLogFile << msg << std::flush;
    }

    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    // Send to both console and file (with marker)
    std::cerr << msg << std::flush;

    if (fLogFile.is_open()) {
      fLogFile << "[ERROR] " << msg << std::flush;
    }

    return 0;
  }

 private:
  std::ofstream fLogFile;
};

// Usage
DualDestination* dual = new DualDestination("simulation.log");
G4iosSetDestination(dual);

// Output goes to both console and file
```

### Timestamped Logging

```cpp
class TimestampedDestination : public G4coutDestination
{
 public:
  TimestampedDestination(const G4String& filename)
  {
    fLogFile.open(filename);
  }

  ~TimestampedDestination()
  {
    if (fLogFile.is_open()) {
      fLogFile.close();
    }
  }

  G4int ReceiveG4cout(const G4String& msg) override
  {
    WriteWithTimestamp(msg, "INFO");
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    WriteWithTimestamp(msg, "ERROR");
    return 0;
  }

 private:
  void WriteWithTimestamp(const G4String& msg, const G4String& level)
  {
    if (!fLogFile.is_open()) return;

    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);

    fLogFile << "[" << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S")
             << "] [" << level << "] " << msg << std::flush;
  }

  std::ofstream fLogFile;
};
```

### Filtering Output

```cpp
class FilteredDestination : public G4coutDestination
{
 public:
  void SetVerbosity(G4int level) { fVerbosity = level; }

  G4int ReceiveG4cout(const G4String& msg) override
  {
    // Only show detailed messages at high verbosity
    if (msg.contains("Track") && fVerbosity < 2) {
      return 0;  // Suppress
    }

    if (msg.contains("Step") && fVerbosity < 3) {
      return 0;  // Suppress
    }

    // Show message
    std::cout << msg << std::flush;
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    // Always show errors
    std::cerr << msg << std::flush;
    return 0;
  }

 private:
  G4int fVerbosity = 1;
};
```

### Network Streaming

```cpp
class NetworkDestination : public G4coutDestination
{
 public:
  NetworkDestination(const G4String& host, G4int port)
    : fHost(host), fPort(port)
  {
    ConnectToServer();
  }

  ~NetworkDestination()
  {
    DisconnectFromServer();
  }

  G4int ReceiveG4cout(const G4String& msg) override
  {
    if (fConnected) {
      SendMessage("INFO", msg);
    }
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    if (fConnected) {
      SendMessage("ERROR", msg);
    }
    return 0;
  }

 private:
  void ConnectToServer() { /* TCP socket connection */ }
  void DisconnectFromServer() { /* Close connection */ }
  void SendMessage(const G4String& level, const G4String& msg) {
    /* Send over network */
  }

  G4String fHost;
  G4int fPort;
  G4bool fConnected = false;
};
```

## Multi-Threading Behavior

### Thread-Local Streams

In multi-threaded mode:
- Each worker thread has its own stream objects
- Master thread has separate streams
- Output from different threads is independent

### Thread-Safe Destinations

```cpp
class ThreadSafeDestination : public G4coutDestination
{
 public:
  G4int ReceiveG4cout(const G4String& msg) override
  {
    std::lock_guard<std::mutex> lock(fMutex);
    fLogFile << "[Thread " << G4Threading::G4GetThreadId() << "] "
             << msg << std::flush;
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    std::lock_guard<std::mutex> lock(fMutex);
    fLogFile << "[Thread " << G4Threading::G4GetThreadId() << "] ERROR: "
             << msg << std::flush;
    return 0;
  }

 private:
  std::mutex fMutex;
  std::ofstream fLogFile{"mt_output.log"};
};
```

### Per-Thread Files

```cpp
class PerThreadDestination : public G4coutDestination
{
 public:
  PerThreadDestination()
  {
    G4int threadID = G4Threading::G4GetThreadId();
    fLogFile.open("thread_" + std::to_string(threadID) + ".log");
  }

  ~PerThreadDestination()
  {
    if (fLogFile.is_open()) {
      fLogFile.close();
    }
  }

  G4int ReceiveG4cout(const G4String& msg) override
  {
    if (fLogFile.is_open()) {
      fLogFile << msg << std::flush;
    }
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    if (fLogFile.is_open()) {
      fLogFile << "ERROR: " << msg << std::flush;
    }
    return 0;
  }

 private:
  std::ofstream fLogFile;
};
```

## Performance Considerations

1. **Buffering**: G4cout is buffered; use `std::flush` or `G4endl` to force output
2. **String Construction**: Building complex strings can be expensive; consider pre-formatting
3. **Frequency**: Avoid excessive output in tight loops (e.g., per-step output)
4. **Redirection Overhead**: Custom destinations add overhead; keep processing minimal

## Best Practices

1. **Always Use G4cout/G4cerr**: Never use `std::cout`/`std::cerr` directly in Geant4 code
2. **Flush Important Messages**: Use `G4endl` for messages that should appear immediately
3. **Manage Destination Lifetime**: Always reset to `nullptr` before destroying custom destination
4. **Thread Safety**: Protect shared resources in custom destinations with mutexes
5. **Error Handling**: Always use `G4cerr` for errors, never `G4cout`

## Common Pitfalls

### 1. Using std::cout Instead

**Problem:**
```cpp
std::cout << "Energy: " << energy << std::endl;  // Wrong!
```

**Solution:**
```cpp
G4cout << "Energy: " << energy << G4endl;  // Correct
```

### 2. Not Resetting Destination

**Problem:**
```cpp
MyDestination* dest = new MyDestination();
G4iosSetDestination(dest);
// ... use it ...
delete dest;  // CRASH! Still registered
```

**Solution:**
```cpp
MyDestination* dest = new MyDestination();
G4iosSetDestination(dest);
// ... use it ...
G4iosSetDestination(nullptr);  // Reset first
delete dest;
```

### 3. Forgetting to Flush

**Problem:**
```cpp
G4cout << "Critical message";  // May not appear immediately
CriticalOperation();  // Crash before message appears
```

**Solution:**
```cpp
G4cout << "Critical message" << G4endl;  // Flushes immediately
CriticalOperation();
```

### 4. Not Thread-Safe Custom Destination

**Problem:**
```cpp
// Multiple threads writing to same file without synchronization
class BadDestination : public G4coutDestination {
  G4int ReceiveG4cout(const G4String& msg) override {
    fFile << msg;  // RACE CONDITION!
    return 0;
  }
  std::ofstream fFile;
};
```

**Solution:** Use mutex protection (see Thread-Safe Destinations example)

## Migration from Legacy Code

### Old Style (Pre-Geant4 10.0)
```cpp
#include <iostream>
std::cout << "Message" << std::endl;
```

### New Style
```cpp
#include "G4ios.hh"
G4cout << "Message" << G4endl;
```

### Benefits
- Thread-safe in MT mode
- Redirectable
- Consistent across Geant4
- GUI integration support

## See Also

- [G4coutDestination](./g4coutdestination.md) - Base class for custom destinations
- [G4Exception](./g4exception.md) - Exception handling (uses G4cerr)
- [Multi-Threading Guide](../guides/multithreading.md) - MT considerations
- [Global Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/global/management/include/G4ios.hh`
- Source: `source/global/management/src/G4ios.cc`
- Destination: `source/global/management/include/G4coutDestination.hh`
:::
