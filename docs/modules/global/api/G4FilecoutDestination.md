# G4FilecoutDestination

## Overview

`G4FilecoutDestination` is a concrete implementation of `G4coutDestination` that redirects Geant4 output streams (`G4cout`, `G4cerr`, `G4debug`) to a file. It provides a simple way to capture simulation output to disk instead of the console.

**Category:** Global/Management - I/O System
**Base Class:** G4coutDestination
**Author:** A. Dotti (SLAC) - April 2017

## Source Locations

**Header:** `/source/global/management/include/G4FilecoutDestination.hh`
**Source:** `/source/global/management/src/G4FilecoutDestination.cc`

## Class Definition

```cpp
class G4FilecoutDestination : public G4coutDestination
{
 public:
  explicit G4FilecoutDestination(
    const G4String& fname,
    std::ios_base::openmode mode = std::ios_base::app);
  ~G4FilecoutDestination() override;

  void SetFileName(const G4String& fname);
  void Open(std::ios_base::openmode mode = std::ios_base::app);
  void Close();

  G4int ReceiveG4debug(const G4String& msg) override;
  G4int ReceiveG4cout(const G4String& msg) override;
  G4int ReceiveG4cerr(const G4String& msg) override;

 private:
  G4String m_name;
  std::ios_base::openmode m_mode;
  std::unique_ptr<std::ofstream> m_output;
};
```

## Public Methods

### Constructor and Destructor

#### G4FilecoutDestination()

```cpp
explicit G4FilecoutDestination(
    const G4String& fname,
    std::ios_base::openmode mode = std::ios_base::app);
```

**Purpose:** Constructs a file output destination with specified filename and open mode.

**Parameters:**
- `fname` - Name of the output file
- `mode` - File open mode (default: `std::ios_base::app` for append)

**Details:**
- File is not opened immediately in constructor
- Call `Open()` explicitly to start writing
- Default mode appends to existing file

**Open Modes:**
- `std::ios_base::app` - Append to existing file
- `std::ios_base::trunc` - Overwrite existing file
- `std::ios_base::out` - Write mode (creates if doesn't exist)
- Combinations: `std::ios_base::out | std::ios_base::app`

**Example:**
```cpp
// Append mode (default)
auto dest1 = new G4FilecoutDestination("output.log");

// Overwrite mode
auto dest2 = new G4FilecoutDestination("output.log", std::ios_base::trunc);

// Write mode
auto dest3 = new G4FilecoutDestination("simulation.txt", std::ios_base::out);
```

#### ~G4FilecoutDestination()

```cpp
~G4FilecoutDestination() override;
```

**Purpose:** Destructor that automatically closes the file if open.

**Details:**
- Ensures file is properly closed and flushed
- Safe to call even if file was never opened

### File Management

#### SetFileName()

```cpp
void SetFileName(const G4String& fname);
```

**Purpose:** Sets or changes the output filename.

**Parameters:**
- `fname` - New filename

**Details:**
- Does not affect already-open file
- Takes effect on next `Open()` call
- Useful for changing output file without recreating the object

**Example:**
```cpp
auto dest = new G4FilecoutDestination("run1.log");
dest->Open();
// ... output goes to run1.log ...
dest->Close();

dest->SetFileName("run2.log");
dest->Open();
// ... output now goes to run2.log ...
```

#### Open()

```cpp
void Open(std::ios_base::openmode mode = std::ios_base::app);
```

**Purpose:** Opens the output file for writing.

**Parameters:**
- `mode` - File open mode (default: `std::ios_base::app`)

**Details:**
- Must be called before output can be written
- If file is already open, closes it first
- Uses filename set in constructor or by `SetFileName()`
- Default mode appends to preserve existing content

**Example:**
```cpp
auto dest = new G4FilecoutDestination("output.log");
dest->Open();  // Open for appending

G4iosSetDestination(dest);
G4cout << "This goes to file" << G4endl;
```

#### Close()

```cpp
void Close();
```

**Purpose:** Closes the output file and flushes all pending writes.

**Details:**
- Safe to call multiple times
- File can be reopened with `Open()` after closing
- Automatically called by destructor

**Example:**
```cpp
auto dest = new G4FilecoutDestination("output.log");
dest->Open();

// Write some output
G4cout << "Simulation data" << G4endl;

dest->Close();  // Explicitly close and flush

// Can reopen later
dest->Open();
```

### Message Handling (Override)

#### ReceiveG4debug()

```cpp
G4int ReceiveG4debug(const G4String& msg) override;
```

**Purpose:** Writes debug messages to the file.

**Parameters:**
- `msg` - Debug message to write

**Return Value:**
- `0` - Message written successfully
- `-1` - Error (file not open)

**Details:**
- Only writes if file is open
- Automatically flushes after each message

#### ReceiveG4cout()

```cpp
G4int ReceiveG4cout(const G4String& msg) override;
```

**Purpose:** Writes standard output messages to the file.

**Parameters:**
- `msg` - Output message to write

**Return Value:**
- `0` - Message written successfully
- `-1` - Error (file not open)

**Details:**
- Primary method for capturing simulation output
- Automatically flushes after each message

#### ReceiveG4cerr()

```cpp
G4int ReceiveG4cerr(const G4String& msg) override;
```

**Purpose:** Writes error messages to the file.

**Parameters:**
- `msg` - Error message to write

**Return Value:**
- `0` - Message written successfully
- `-1` - Error (file not open)

**Details:**
- Writes error messages to same file as cout
- Consider using separate file destination for errors

## Usage Patterns

### Basic File Output

```cpp
// Create and open file destination
auto fileDest = new G4FilecoutDestination("simulation.log");
fileDest->Open();

// Set as current destination
G4iosSetDestination(fileDest);

// All output now goes to file
G4cout << "Starting simulation..." << G4endl;
G4cout << "Event 1 processed" << G4endl;

// Clean up
fileDest->Close();
delete fileDest;
```

### Separate Files for Output and Errors

```cpp
// Create destinations for cout and cerr
auto coutDest = new G4FilecoutDestination("output.log");
auto cerrDest = new G4FilecoutDestination("errors.log");

coutDest->Open();
cerrDest->Open();

// Use MulticoutDestination to route differently
auto multiDest = new G4MulticoutDestination();

// Override to route cerr separately
class SplitDestination : public G4coutDestination
{
 public:
  SplitDestination(G4FilecoutDestination* out, G4FilecoutDestination* err)
    : outDest(out), errDest(err) {}

  G4int ReceiveG4cout(const G4String& msg) override {
    return outDest->ReceiveG4cout(msg);
  }

  G4int ReceiveG4cerr(const G4String& msg) override {
    return errDest->ReceiveG4cerr(msg);
  }

 private:
  G4FilecoutDestination* outDest;
  G4FilecoutDestination* errDest;
};

auto splitDest = new SplitDestination(coutDest, cerrDest);
G4iosSetDestination(splitDest);
```

### Timestamped Log Files

```cpp
// Generate timestamped filename
std::time_t now = std::time(nullptr);
std::tm* ltm = std::localtime(&now);
std::stringstream ss;
ss << "simulation_"
   << (1900 + ltm->tm_year) << "-"
   << (1 + ltm->tm_mon) << "-"
   << ltm->tm_mday << "_"
   << ltm->tm_hour << "-"
   << ltm->tm_min << "-"
   << ltm->tm_sec
   << ".log";

auto dest = new G4FilecoutDestination(ss.str());
dest->Open(std::ios_base::trunc);  // Start fresh
G4iosSetDestination(dest);
```

### Run-Specific Logging

```cpp
class RunLogger
{
 public:
  void BeginOfRunAction(const G4Run* run)
  {
    std::stringstream ss;
    ss << "run_" << run->GetRunID() << ".log";

    m_dest = new G4FilecoutDestination(ss.str());
    m_dest->Open(std::ios_base::trunc);
    G4iosSetDestination(m_dest);

    G4cout << "=== Run " << run->GetRunID() << " Started ===" << G4endl;
  }

  void EndOfRunAction(const G4Run* run)
  {
    G4cout << "=== Run " << run->GetRunID() << " Completed ===" << G4endl;
    m_dest->Close();
    delete m_dest;
    m_dest = nullptr;
  }

 private:
  G4FilecoutDestination* m_dest = nullptr;
};
```

### Buffered File Writing

```cpp
// Combine with BuffercoutDestination for better performance
class BufferedFileDestination : public G4BuffercoutDestination
{
 public:
  explicit BufferedFileDestination(const G4String& fname)
    : G4BuffercoutDestination(1024 * 1024)  // 1MB buffer
    , m_fileDest(fname)
  {
    m_fileDest.Open();
  }

  G4int FlushG4cout() override {
    // Flush to file instead of console
    return 0;  // Custom implementation
  }

 private:
  G4FilecoutDestination m_fileDest;
};
```

### Conditional File Output

```cpp
auto dest = new G4FilecoutDestination("verbose.log");

// Only write verbose messages to file
dest->AddCoutTransformer([](G4String& msg) -> G4bool {
    return G4StrUtil::contains(msg, "VERBOSE");
});

dest->Open();
G4iosSetDestination(dest);

// VERBOSE messages go to file, others to console
G4cout << "VERBOSE: Detailed information" << G4endl;  // To file
G4cout << "Normal message" << G4endl;  // Suppressed
```

### Multi-Threaded File Output

```cpp
// Each thread writes to its own file
void InitializeWorkerThread(G4int threadId)
{
    std::stringstream ss;
    ss << "thread_" << threadId << ".log";

    auto dest = new G4FilecoutDestination(ss.str());
    dest->Open(std::ios_base::trunc);

    // Add thread prefix
    dest->AddCoutTransformer([threadId](G4String& msg) -> G4bool {
        std::stringstream prefix;
        prefix << "[Thread " << threadId << "] ";
        msg = prefix.str() + msg;
        return true;
    });

    G4iosSetDestination(dest);
}
```

## Best Practices

### 1. Always Open Before Use

```cpp
// GOOD
auto dest = new G4FilecoutDestination("output.log");
dest->Open();
G4iosSetDestination(dest);

// WRONG - File not opened
auto dest = new G4FilecoutDestination("output.log");
G4iosSetDestination(dest);  // Messages will be lost
```

### 2. Explicitly Close Important Files

```cpp
// GOOD - Explicit close ensures flush
auto dest = new G4FilecoutDestination("critical.log");
dest->Open();
// ... simulation ...
dest->Close();  // Ensure all data written
delete dest;

// RISKY - Relies on destructor
auto dest = new G4FilecoutDestination("output.log");
dest->Open();
// ... simulation ...
delete dest;  // Destructor closes, but less explicit
```

### 3. Use Appropriate Open Modes

```cpp
// For new simulation run - overwrite
auto dest = new G4FilecoutDestination("output.log", std::ios_base::trunc);

// For continuing/appending - preserve existing
auto dest = new G4FilecoutDestination("output.log", std::ios_base::app);

// For critical data - fail if exists
auto dest = new G4FilecoutDestination("output.log",
    std::ios_base::out | std::ios_base::excl);
```

### 4. Check File Accessibility

```cpp
auto dest = new G4FilecoutDestination("/path/to/output.log");
dest->Open();

// Verify file is actually open
G4cout << "Test message" << G4endl;

// If using return codes
if (dest->ReceiveG4cout("Test") == -1) {
    G4cerr << "ERROR: Cannot write to file" << G4endl;
}
```

### 5. Use Relative Paths Carefully

```cpp
// GOOD - Absolute path
auto dest = new G4FilecoutDestination("/home/user/logs/output.log");

// CAREFUL - Relative to working directory
auto dest = new G4FilecoutDestination("output.log");

// BETTER - Construct full path
G4String logDir = std::getenv("G4_LOG_DIR");
if (logDir.empty()) logDir = ".";
G4String fullPath = logDir + "/output.log";
auto dest = new G4FilecoutDestination(fullPath);
```

### 6. Handle Long-Running Simulations

```cpp
// For very long runs, periodically close/reopen to ensure data is saved
class PeriodicFlushDestination : public G4FilecoutDestination
{
 public:
  using G4FilecoutDestination::G4FilecoutDestination;

  G4int ReceiveG4cout(const G4String& msg) override {
    auto result = G4FilecoutDestination::ReceiveG4cout(msg);

    if (++m_count % 1000 == 0) {
      // Periodically flush
      Close();
      Open();
    }

    return result;
  }

 private:
  std::size_t m_count = 0;
};
```

### 7. Consider Disk Space

```cpp
// Monitor file size and rotate if needed
class RotatingFileDestination : public G4FilecoutDestination
{
 public:
  RotatingFileDestination(const G4String& fname, std::size_t maxSize)
    : G4FilecoutDestination(fname), m_maxSize(maxSize) {}

  G4int ReceiveG4cout(const G4String& msg) override {
    m_currentSize += msg.length();

    if (m_currentSize > m_maxSize) {
      // Rotate file
      Close();
      // Rename old file, open new one
      m_currentSize = 0;
    }

    return G4FilecoutDestination::ReceiveG4cout(msg);
  }

 private:
  std::size_t m_maxSize;
  std::size_t m_currentSize = 0;
};
```

## Performance Considerations

### File I/O Overhead

- Each message triggers a write operation
- Use buffering for high-frequency output
- Consider combining with `G4BuffercoutDestination`

### Thread Contention

- Multiple threads writing to same file can cause contention
- Use separate files per thread or thread-safe locking
- See `G4MTcoutDestination` for MT-aware alternatives

### Disk Speed

- SSD vs HDD can significantly impact performance
- Local disk faster than network filesystem
- Consider in-memory buffering for network storage

## Thread Safety

- **Not thread-safe** for concurrent writes to same file
- Use separate instances per thread
- Or combine with `G4LockcoutDestination` for locking
- File is managed via `std::unique_ptr` for exception safety

## Common Pitfalls

### Forgetting to Open the File

```cpp
// WRONG
auto dest = new G4FilecoutDestination("output.log");
G4iosSetDestination(dest);
// No output - file never opened!

// CORRECT
auto dest = new G4FilecoutDestination("output.log");
dest->Open();
G4iosSetDestination(dest);
```

### File Permission Issues

```cpp
// May fail silently if no write permission
auto dest = new G4FilecoutDestination("/root/output.log");
dest->Open();  // Fails but no exception

// Better: Check and use writable location
auto dest = new G4FilecoutDestination("./output.log");
```

### Premature Deletion

```cpp
// WRONG - Destination deleted while still in use
{
    auto dest = new G4FilecoutDestination("output.log");
    dest->Open();
    G4iosSetDestination(dest);
    delete dest;  // Destination deleted!
}
G4cout << "Lost message" << G4endl;  // Undefined behavior

// CORRECT - Keep destination alive
auto dest = new G4FilecoutDestination("output.log");
dest->Open();
G4iosSetDestination(dest);
// ... use throughout simulation ...
delete dest;  // Delete at end
```

## See Also

- **G4coutDestination** - Base class documentation
- **G4MTcoutDestination** - Multi-threaded file output
- **G4BuffercoutDestination** - Buffering for better performance
- **G4MulticoutDestination** - Route to multiple files
- **G4iosSetDestination()** - Setting active destination
- **G4cout, G4cerr, G4debug** - Global output streams
