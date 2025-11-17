# G4BuffercoutDestination

## Overview

`G4BuffercoutDestination` is a buffering output destination that accumulates messages in memory before writing them to standard output. This reduces I/O overhead and improves performance in applications with high-frequency output, especially useful in multi-threaded simulations.

**Category:** Global/Management - I/O System
**Base Class:** G4coutDestination
**Author:** A. Dotti (SLAC) - April 2017

## Source Locations

**Header:** `/source/global/management/include/G4BuffercoutDestination.hh`
**Source:** `/source/global/management/src/G4BuffercoutDestination.cc`

## Class Definition

```cpp
class G4BuffercoutDestination : public G4coutDestination
{
 public:
  explicit G4BuffercoutDestination(std::size_t maxSize = 0);
  ~G4BuffercoutDestination() override;

  G4int ReceiveG4debug(const G4String& msg) override;
  G4int ReceiveG4cout(const G4String& msg) override;
  G4int ReceiveG4cerr(const G4String& msg) override;

  virtual G4int FlushG4debug();
  virtual G4int FlushG4cout();
  virtual G4int FlushG4cerr();

  virtual void Finalize();

  void SetMaxSize(std::size_t max);
  std::size_t GetMaxSize() const;

 protected:
  std::size_t m_maxSize = 0;

  class BufferImpl;
  std::unique_ptr<BufferImpl> m_buffer_dbg;
  std::unique_ptr<BufferImpl> m_buffer_out;
  std::unique_ptr<BufferImpl> m_buffer_err;
};
```

## Public Methods

### Constructor and Destructor

#### G4BuffercoutDestination()

```cpp
explicit G4BuffercoutDestination(std::size_t maxSize = 0);
```

**Purpose:** Constructs a buffered output destination with specified maximum buffer size.

**Parameters:**
- `maxSize` - Maximum buffer size in characters (default: 0 = unlimited)

**Details:**
- Creates three separate buffers for debug, cout, and cerr streams
- Size of 0 means infinite buffer (limited only by available memory)
- Non-zero size triggers automatic flush when buffer reaches limit
- Buffers are independent for each stream type

**Example:**
```cpp
// Unlimited buffer
auto dest1 = new G4BuffercoutDestination();

// 1MB buffer (auto-flush when full)
auto dest2 = new G4BuffercoutDestination(1024 * 1024);

// 64KB buffer
auto dest3 = new G4BuffercoutDestination(64 * 1024);
```

#### ~G4BuffercoutDestination()

```cpp
~G4BuffercoutDestination() override;
```

**Purpose:** Destructor that automatically flushes all buffers.

**Details:**
- Ensures no buffered messages are lost
- Writes all pending output before destruction
- Safe cleanup of buffer resources

### Message Handling (Override)

#### ReceiveG4debug()

```cpp
G4int ReceiveG4debug(const G4String& msg) override;
```

**Purpose:** Adds debug message to buffer instead of immediate output.

**Parameters:**
- `msg` - Debug message to buffer

**Return Value:**
- `0` - Message buffered successfully
- `-1` - Buffer operation failed

**Details:**
- Message stored in debug buffer
- Auto-flushes if buffer reaches maximum size
- No immediate I/O overhead

**Example:**
```cpp
auto dest = new G4BuffercoutDestination(1024);
G4iosSetDestination(dest);

G4debug << "Debug info" << G4endl;
// Message buffered, not yet output
```

#### ReceiveG4cout()

```cpp
G4int ReceiveG4cout(const G4String& msg) override;
```

**Purpose:** Adds output message to buffer.

**Parameters:**
- `msg` - Output message to buffer

**Return Value:**
- `0` - Message buffered successfully
- `-1` - Buffer operation failed

**Details:**
- Primary buffering method for normal output
- Significantly improves performance for high-frequency output
- Buffer auto-flushes when reaching max size

**Example:**
```cpp
auto dest = new G4BuffercoutDestination(10000);
G4iosSetDestination(dest);

// These are buffered, not immediately written
for (int i = 0; i < 1000; ++i) {
    G4cout << "Event " << i << " processed" << G4endl;
}
// All output buffered, minimal I/O operations
```

#### ReceiveG4cerr()

```cpp
G4int ReceiveG4cerr(const G4String& msg) override;
```

**Purpose:** Adds error message to buffer.

**Parameters:**
- `msg` - Error message to buffer

**Return Value:**
- `0` - Message buffered successfully
- `-1` - Buffer operation failed

**Details:**
- Error messages are buffered separately
- Consider smaller buffer or immediate flush for errors
- Critical errors should be flushed immediately

### Buffer Flushing

#### FlushG4debug()

```cpp
virtual G4int FlushG4debug();
```

**Purpose:** Writes all buffered debug messages to standard output.

**Return Value:**
- `0` - Flush successful
- `-1` - Flush failed

**Details:**
- Outputs to `std::cout`
- Clears debug buffer after writing
- Can be overridden to flush to different destination

**Example:**
```cpp
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);

G4debug << "Debug 1" << G4endl;
G4debug << "Debug 2" << G4endl;

dest->FlushG4debug();  // Write both messages now
```

#### FlushG4cout()

```cpp
virtual G4int FlushG4cout();
```

**Purpose:** Writes all buffered output messages to standard output.

**Return Value:**
- `0` - Flush successful
- `-1` - Flush failed

**Details:**
- Outputs to `std::cout`
- Clears output buffer after writing
- Main method for periodic buffer flushing

**Example:**
```cpp
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);

// Buffer many messages
for (int i = 0; i < 10000; ++i) {
    G4cout << "Event " << i << G4endl;
}

// Write all at once
dest->FlushG4cout();
```

#### FlushG4cerr()

```cpp
virtual G4int FlushG4cerr();
```

**Purpose:** Writes all buffered error messages to standard error.

**Return Value:**
- `0` - Flush successful
- `-1` - Flush failed

**Details:**
- Outputs to `std::cerr`
- Clears error buffer after writing
- Important for ensuring error visibility

**Example:**
```cpp
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);

G4cerr << "Error 1" << G4endl;
G4cerr << "Error 2" << G4endl;

dest->FlushG4cerr();  // Ensure errors are displayed
```

#### Finalize()

```cpp
virtual void Finalize();
```

**Purpose:** Flushes all buffers (debug, cout, and cerr).

**Details:**
- Convenience method to flush everything
- Calls `FlushG4debug()`, `FlushG4cout()`, and `FlushG4cerr()`
- Should be called before application exit
- Automatically called by destructor

**Example:**
```cpp
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);

// ... application runs ...

// Ensure all output is written
dest->Finalize();
```

### Buffer Configuration

#### SetMaxSize()

```cpp
void SetMaxSize(std::size_t max);
```

**Purpose:** Sets or changes the maximum buffer size.

**Parameters:**
- `max` - New maximum size in characters (0 = unlimited)

**Details:**
- Can be changed at runtime
- If current buffer exceeds new size, flush is triggered
- Applies to all three buffers (debug, cout, cerr)

**Example:**
```cpp
auto dest = new G4BuffercoutDestination();

// Start with small buffer
dest->SetMaxSize(1024);

// Later increase for better performance
dest->SetMaxSize(1024 * 1024);

// Unlimited buffering
dest->SetMaxSize(0);
```

#### GetMaxSize()

```cpp
std::size_t GetMaxSize() const;
```

**Purpose:** Returns the current maximum buffer size.

**Return Value:** Maximum buffer size in characters (0 = unlimited)

**Example:**
```cpp
auto dest = new G4BuffercoutDestination(4096);
std::size_t size = dest->GetMaxSize();
// Returns: 4096

G4cout << "Buffer size: " << size << " bytes" << G4endl;
```

## Usage Patterns

### Basic Buffered Output

```cpp
// Create buffered destination with 1MB buffer
auto dest = new G4BuffercoutDestination(1024 * 1024);
G4iosSetDestination(dest);

// High-frequency output is buffered
for (int i = 0; i < 100000; ++i) {
    G4cout << "Event " << i << " processed" << G4endl;
}

// Flush at end
dest->Finalize();
delete dest;
```

### Periodic Flushing

```cpp
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);

const int flushInterval = 1000;
for (int i = 0; i < 100000; ++i) {
    G4cout << "Processing event " << i << G4endl;

    // Flush every N events
    if (i % flushInterval == 0) {
        dest->FlushG4cout();
    }
}

dest->Finalize();
```

### Event-Based Flushing

```cpp
class MyEventAction : public G4UserEventAction
{
 public:
  MyEventAction(G4BuffercoutDestination* dest) : m_dest(dest) {}

  void EndOfEventAction(const G4Event* event) override
  {
    // Flush buffer at end of each event
    m_dest->FlushG4cout();

    // Or only every N events
    if (event->GetEventID() % 100 == 0) {
        m_dest->FlushG4cout();
    }
  }

 private:
  G4BuffercoutDestination* m_dest;
};
```

### Run-Based Buffering

```cpp
class MyRunAction : public G4UserRunAction
{
 public:
  void BeginOfRunAction(const G4Run* run) override
  {
    // Create buffered destination for entire run
    m_dest = new G4BuffercoutDestination();  // Unlimited buffer
    G4iosSetDestination(m_dest);

    G4cout << "=== Run " << run->GetRunID() << " Started ===" << G4endl;
  }

  void EndOfRunAction(const G4Run* run) override
  {
    G4cout << "=== Run " << run->GetRunID() << " Ended ===" << G4endl;

    // Flush everything at end of run
    m_dest->Finalize();
    delete m_dest;
    m_dest = nullptr;
  }

 private:
  G4BuffercoutDestination* m_dest = nullptr;
};
```

### Custom Flush Destination

```cpp
class FileBufferedDestination : public G4BuffercoutDestination
{
 public:
  FileBufferedDestination(const G4String& filename, std::size_t bufSize)
    : G4BuffercoutDestination(bufSize)
    , m_file(filename)
  {}

  ~FileBufferedDestination() override {
    if (m_file.is_open()) {
        Finalize();  // Flush before closing
        m_file.close();
    }
  }

  G4int FlushG4cout() override {
    // Flush to file instead of console
    // (Would need to access buffer contents)
    // This is a conceptual example
    return 0;
  }

 private:
  std::ofstream m_file;
};
```

### Memory-Limited Buffering

```cpp
// For systems with memory constraints
auto dest = new G4BuffercoutDestination(64 * 1024);  // 64KB limit
G4iosSetDestination(dest);

// Buffer auto-flushes when reaching 64KB
for (int i = 0; i < 1000000; ++i) {
    G4cout << "Event data..." << G4endl;
    // Automatic flushes prevent memory overflow
}
```

### Multi-Threaded Buffering

```cpp
// Each thread has its own buffered destination
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();

    // Thread-local buffered destination
    auto dest = new G4BuffercoutDestination(1024 * 1024);

    // Add thread prefix before buffering
    dest->AddCoutTransformer([threadId](G4String& msg) -> G4bool {
        msg = "[T" + std::to_string(threadId) + "] " + msg;
        return true;
    });

    G4iosSetDestination(dest);

    // High-performance buffered output per thread
}
```

### Combining with File Output

```cpp
class BufferedFileDestination : public G4BuffercoutDestination
{
 public:
  BufferedFileDestination(const G4String& fname, std::size_t bufSize)
    : G4BuffercoutDestination(bufSize)
  {
    m_fileDest = new G4FilecoutDestination(fname);
    m_fileDest->Open();
  }

  ~BufferedFileDestination() override {
    Finalize();
    m_fileDest->Close();
    delete m_fileDest;
  }

  G4int FlushG4cout() override {
    // First flush buffer to stdout
    G4BuffercoutDestination::FlushG4cout();

    // Could also write to file here
    return 0;
  }

 private:
  G4FilecoutDestination* m_fileDest;
};
```

## Best Practices

### 1. Choose Appropriate Buffer Size

```cpp
// For high-frequency output - large buffer
auto dest = new G4BuffercoutDestination(10 * 1024 * 1024);  // 10MB

// For moderate output - medium buffer
auto dest = new G4BuffercoutDestination(1024 * 1024);  // 1MB

// For memory-constrained systems - small buffer
auto dest = new G4BuffercoutDestination(64 * 1024);  // 64KB

// For unlimited buffering (careful with memory!)
auto dest = new G4BuffercoutDestination(0);  // Unlimited
```

### 2. Flush at Logical Boundaries

```cpp
// GOOD - Flush at event boundaries
void EndOfEventAction(const G4Event*) {
    bufferedDest->FlushG4cout();
}

// GOOD - Flush at run boundaries
void EndOfRunAction(const G4Run*) {
    bufferedDest->Finalize();
}

// AVOID - Random flushing disrupts buffering benefits
for (int i = 0; i < 1000; ++i) {
    G4cout << "Data" << G4endl;
    if (rand() % 10 == 0) bufferedDest->FlushG4cout();  // Defeats purpose
}
```

### 3. Always Finalize Before Exit

```cpp
// GOOD - Explicit finalization
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);
// ... simulation ...
dest->Finalize();
delete dest;

// OK - Destructor finalizes automatically
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);
// ... simulation ...
delete dest;  // Destructor calls Finalize()

// WRONG - Destination never deleted, buffer never flushed
auto dest = new G4BuffercoutDestination();
G4iosSetDestination(dest);
// ... simulation ...
// Leak - buffered output lost!
```

### 4. Flush Errors Promptly

```cpp
// GOOD - Immediate error flushing
class PromptErrorDestination : public G4BuffercoutDestination
{
 public:
  using G4BuffercoutDestination::G4BuffercoutDestination;

  G4int ReceiveG4cerr(const G4String& msg) override {
    auto result = G4BuffercoutDestination::ReceiveG4cerr(msg);
    FlushG4cerr();  // Flush errors immediately
    return result;
  }
};

// AVOID - Buffering critical errors
// Errors may not appear until much later
```

### 5. Monitor Memory Usage for Unlimited Buffers

```cpp
// RISKY - Unlimited buffer can grow very large
auto dest = new G4BuffercoutDestination(0);

// BETTER - Set reasonable limit
auto dest = new G4BuffercoutDestination(100 * 1024 * 1024);  // 100MB max

// Or flush periodically
if (eventCount % 1000 == 0) {
    dest->FlushG4cout();
}
```

### 6. Use Thread-Local Buffers in MT

```cpp
// GOOD - Each thread has own buffer (no contention)
void InitializeWorkerThread()
{
    auto dest = new G4BuffercoutDestination(1024 * 1024);
    G4iosSetDestination(dest);
}

// AVOID - Shared buffer between threads (requires locking)
static G4BuffercoutDestination* sharedDest = nullptr;  // Don't share!
```

### 7. Adjust Buffer Size Based on Verbosity

```cpp
// Verbose mode - larger buffer
if (verboseLevel > 1) {
    dest->SetMaxSize(10 * 1024 * 1024);
}
else {
    dest->SetMaxSize(1024 * 1024);
}
```

## Performance Considerations

### I/O Overhead Reduction

- **Unbuffered:** Each message triggers I/O operation (~1-10 microseconds each)
- **Buffered:** I/O only on flush (~1 microsecond per 1000 messages)
- **Speedup:** 100-1000x for high-frequency output

### Memory Usage

- **Small buffers (64KB):** Minimal memory, frequent flushes
- **Medium buffers (1-10MB):** Good balance for most applications
- **Large buffers (>100MB):** Best performance but high memory usage
- **Unlimited buffers:** Can exhaust memory if not flushed

### Flush Frequency

- **Too frequent:** Negates buffering benefits
- **Too infrequent:** Messages delayed, high memory usage
- **Optimal:** At logical boundaries (event/run end)

### Multi-Threading Impact

- Per-thread buffers: No lock contention, best performance
- Shared buffer: Requires locking, serialization overhead
- Recommendation: One buffer per thread

## Common Pitfalls

### Forgetting to Flush

```cpp
// WRONG - Buffer never flushed
{
    auto dest = new G4BuffercoutDestination();
    G4iosSetDestination(dest);
    G4cout << "Important data" << G4endl;
    // Scope ends, data lost if not flushed
}

// CORRECT - Explicit flush
{
    auto dest = new G4BuffercoutDestination();
    G4iosSetDestination(dest);
    G4cout << "Important data" << G4endl;
    dest->Finalize();
    delete dest;
}
```

### Unlimited Buffer Without Flushing

```cpp
// WRONG - Memory grows unbounded
auto dest = new G4BuffercoutDestination(0);  // Unlimited
for (int i = 0; i < 10000000; ++i) {
    G4cout << "Event " << i << " with lots of data..." << G4endl;
}
// May run out of memory!

// CORRECT - Periodic flushing
auto dest = new G4BuffercoutDestination(0);
for (int i = 0; i < 10000000; ++i) {
    G4cout << "Event " << i << " with lots of data..." << G4endl;
    if (i % 10000 == 0) dest->FlushG4cout();
}
```

### Excessive Flushing

```cpp
// WRONG - Defeats purpose of buffering
auto dest = new G4BuffercoutDestination(1024 * 1024);
for (int i = 0; i < 1000; ++i) {
    G4cout << "Data" << G4endl;
    dest->FlushG4cout();  // Flush after every message!
}

// CORRECT - Let buffer work
auto dest = new G4BuffercoutDestination(1024 * 1024);
for (int i = 0; i < 1000; ++i) {
    G4cout << "Data" << G4endl;
}
dest->FlushG4cout();  // Single flush at end
```

### Not Handling Errors Specially

```cpp
// RISKY - Errors buffered with normal output
auto dest = new G4BuffercoutDestination(10 * 1024 * 1024);
// Critical error may not appear until much later

// BETTER - Immediate error flushing
class ErrorFlushDestination : public G4BuffercoutDestination
{
  G4int ReceiveG4cerr(const G4String& msg) override {
    G4BuffercoutDestination::ReceiveG4cerr(msg);
    return FlushG4cerr();  // Flush errors immediately
  }
};
```

## Thread Safety

- **Not thread-safe** for concurrent access to same instance
- Use separate instances per thread in MT applications
- Buffer operations are not protected by mutex
- Combine with `G4LockcoutDestination` if sharing required (not recommended)

## See Also

- **G4coutDestination** - Base class
- **G4FilecoutDestination** - File output destination
- **G4MTcoutDestination** - Multi-threaded output (includes buffering)
- **G4MulticoutDestination** - Multiple destination routing
- **G4LockcoutDestination** - Thread-safe output
- **std::stringbuf** - Underlying buffer mechanism
