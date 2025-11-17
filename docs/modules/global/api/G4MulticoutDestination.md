# G4MulticoutDestination

## Overview

`G4MulticoutDestination` is a container class that allows routing output to multiple destinations simultaneously. It extends both `G4coutDestination` and `std::vector<G4coutDestinationUPtr>`, enabling users to chain multiple output handlers in a single job (e.g., console + file + GUI).

**Category:** Global/Management - I/O System
**Base Classes:** `G4coutDestination`, `std::vector<G4coutDestinationUPtr>`
**Author:** A. Dotti (SLAC) - April 2017

## Source Locations

**Header:** `/source/global/management/include/G4MulticoutDestination.hh`

## Type Definitions

```cpp
using G4coutDestinationUPtr = std::unique_ptr<G4coutDestination>;
using G4coutDestinationVector = std::vector<G4coutDestinationUPtr>;
```

**Purpose:** Type aliases for managing owned destination pointers.

## Class Definition

```cpp
class G4MulticoutDestination
  : public G4coutDestination
  , public G4coutDestinationVector
{
 public:
  G4MulticoutDestination() = default;
  ~G4MulticoutDestination() override = default;

  G4int ReceiveG4debug(const G4String& msg) override;
  G4int ReceiveG4cout(const G4String& msg) override;
  G4int ReceiveG4cerr(const G4String& msg) override;

  // Inherits all std::vector methods:
  // push_back(), pop_back(), size(), clear(), etc.
};
```

## Public Methods

### Constructor and Destructor

#### G4MulticoutDestination()

```cpp
G4MulticoutDestination() = default;
```

**Purpose:** Constructs an empty multi-destination container.

**Details:**
- Starts with no child destinations
- Add destinations using `push_back()` or other vector methods
- Owns all child destinations via `std::unique_ptr`

**Example:**
```cpp
auto multi = new G4MulticoutDestination();
// Empty container, ready to add destinations
```

#### ~G4MulticoutDestination()

```cpp
~G4MulticoutDestination() override = default;
```

**Purpose:** Destructor that automatically cleans up all child destinations.

**Details:**
- `std::unique_ptr` automatically deletes owned destinations
- Child destinations destroyed in reverse order of addition
- Safe cleanup guaranteed

### Message Handling (Override)

#### ReceiveG4debug()

```cpp
G4int ReceiveG4debug(const G4String& msg) override;
```

**Purpose:** Forwards debug messages to all child destinations.

**Parameters:**
- `msg` - Debug message (potentially modified by this destination's transformers)

**Return Value:**
- `0` - All child destinations succeeded
- `-1` - One or more child destinations failed

**Details:**
- Applies transformers attached to this instance first
- Then forwards to each child destination's `ReceiveG4debug_()` method
- Each child applies its own transformers
- All children receive the message even if one fails

**Example:**
```cpp
auto multi = new G4MulticoutDestination();
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));
multi->push_back(G4coutDestinationUPtr(new G4FilecoutDestination("debug.log")));

G4iosSetDestination(multi);
G4debug << "Debug info" << G4endl;
// Sent to both console and file
```

#### ReceiveG4cout()

```cpp
G4int ReceiveG4cout(const G4String& msg) override;
```

**Purpose:** Forwards output messages to all child destinations.

**Parameters:**
- `msg` - Output message (after this destination's transformers)

**Return Value:**
- `0` - All child destinations succeeded
- `-1` - One or more child destinations failed

**Details:**
- Primary method for multi-destination routing
- Message sent to all children sequentially
- Children process independently with their own transformers

**Implementation:**
```cpp
G4int ReceiveG4cout(const G4String& msg) override
{
  G4bool result = true;
  std::for_each(begin(), end(), [&](G4coutDestinationUPtr& e) {
    result &= (e->ReceiveG4cout_(msg) == 0);
  });
  return (result ? 0 : -1);
}
```

**Example:**
```cpp
auto multi = new G4MulticoutDestination();

// Console output
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

// File output
auto fileDest = new G4FilecoutDestination("output.log");
fileDest->Open();
multi->push_back(G4coutDestinationUPtr(fileDest));

G4iosSetDestination(multi);
G4cout << "Message" << G4endl;
// Appears on both console and in file
```

#### ReceiveG4cerr()

```cpp
G4int ReceiveG4cerr(const G4String& msg) override;
```

**Purpose:** Forwards error messages to all child destinations.

**Parameters:**
- `msg` - Error message

**Return Value:**
- `0` - All child destinations succeeded
- `-1` - One or more child destinations failed

**Details:**
- Error forwarding to all children
- Useful for sending errors to multiple logs
- All children receive errors even if some fail

**Example:**
```cpp
auto multi = new G4MulticoutDestination();
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

auto errorFile = new G4FilecoutDestination("errors.log");
errorFile->Open();
multi->push_back(G4coutDestinationUPtr(errorFile));

G4iosSetDestination(multi);
G4cerr << "Error occurred" << G4endl;
// Error shown on console and logged to file
```

### Vector Methods (Inherited)

Since `G4MulticoutDestination` inherits from `std::vector<G4coutDestinationUPtr>`, all vector methods are available:

#### push_back()

```cpp
void push_back(G4coutDestinationUPtr&& dest);
```

**Purpose:** Adds a destination to the container.

**Parameters:**
- `dest` - Unique pointer to destination (ownership transferred)

**Example:**
```cpp
multi->push_back(G4coutDestinationUPtr(new G4FilecoutDestination("log.txt")));
```

#### emplace_back()

```cpp
template<typename T, typename... Args>
void emplace_back(Args&&... args);
```

**Purpose:** Constructs destination in-place.

**Example:**
```cpp
// C++14 and later
multi->emplace_back(std::make_unique<G4FilecoutDestination>("log.txt"));
```

#### size()

```cpp
std::size_t size() const;
```

**Purpose:** Returns number of child destinations.

#### clear()

```cpp
void clear();
```

**Purpose:** Removes and destroys all child destinations.

#### pop_back()

```cpp
void pop_back();
```

**Purpose:** Removes last destination.

## Usage Patterns

### Basic Multiple Destinations

```cpp
// Output to both console and file
auto multi = new G4MulticoutDestination();

// Add console output
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

// Add file output
auto fileDest = new G4FilecoutDestination("simulation.log");
fileDest->Open();
multi->push_back(G4coutDestinationUPtr(fileDest));

G4iosSetDestination(multi);

// All output goes to both destinations
G4cout << "Starting simulation" << G4endl;
```

### Console + Multiple Log Files

```cpp
auto multi = new G4MulticoutDestination();

// Console
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

// General log
auto generalLog = new G4FilecoutDestination("general.log");
generalLog->Open();
multi->push_back(G4coutDestinationUPtr(generalLog));

// Detailed log
auto detailedLog = new G4FilecoutDestination("detailed.log");
detailedLog->Open();
multi->push_back(G4coutDestinationUPtr(detailedLog));

// Summary log
auto summaryLog = new G4FilecoutDestination("summary.log");
summaryLog->Open();
multi->push_back(G4coutDestinationUPtr(summaryLog));

G4iosSetDestination(multi);
// Output goes to console + 3 log files
```

### Filtered Multi-Destination

```cpp
auto multi = new G4MulticoutDestination();

// All messages to console
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

// Only errors to error log
auto errorDest = new G4FilecoutDestination("errors.log");
errorDest->Open();
errorDest->AddCoutTransformer([](G4String& msg) -> G4bool {
    return false;  // Suppress cout messages
});
multi->push_back(G4coutDestinationUPtr(errorDest));

// Only verbose messages to verbose log
auto verboseDest = new G4FilecoutDestination("verbose.log");
verboseDest->Open();
verboseDest->AddCoutTransformer([](G4String& msg) -> G4bool {
    return G4StrUtil::contains(msg, "VERBOSE");
});
multi->push_back(G4coutDestinationUPtr(verboseDest));

G4iosSetDestination(multi);

G4cout << "Normal message" << G4endl;        // Console + error log (suppressed)
G4cout << "VERBOSE: Details" << G4endl;      // All three destinations
G4cerr << "Error!" << G4endl;                // All three destinations
```

### Thread-Specific Multi-Destination

```cpp
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto multi = new G4MulticoutDestination();

    // Thread-local console output
    auto console = new G4coutDestination();
    console->AddCoutTransformer([threadId](G4String& msg) -> G4bool {
        msg = "[T" + std::to_string(threadId) + "] " + msg;
        return true;
    });
    multi->push_back(G4coutDestinationUPtr(console));

    // Thread-specific log file
    std::stringstream ss;
    ss << "thread_" << threadId << ".log";
    auto fileDest = new G4FilecoutDestination(ss.str());
    fileDest->Open();
    multi->push_back(G4coutDestinationUPtr(fileDest));

    // Forward to master
    multi->push_back(G4coutDestinationUPtr(new G4MasterForwardcoutDestination()));

    G4iosSetDestination(multi);
    // Output goes to: console, thread file, and master
}
```

### Buffered + Immediate Output

```cpp
auto multi = new G4MulticoutDestination();

// Immediate console output for monitoring
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

// Buffered file output for performance
auto buffered = new G4BuffercoutDestination(10 * 1024 * 1024);
multi->push_back(G4coutDestinationUPtr(buffered));

G4iosSetDestination(multi);

// See output immediately on console
// File output buffered for performance
for (int i = 0; i < 100000; ++i) {
    G4cout << "Event " << i << G4endl;
}

// Flush buffered destination at end
static_cast<G4BuffercoutDestination*>((*multi)[1].get())->Finalize();
```

### Different Formatting Per Destination

```cpp
auto multi = new G4MulticoutDestination();

// Plain console output
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

// Timestamped file output
auto fileDest = new G4FilecoutDestination("timestamped.log");
fileDest->Open();
fileDest->AddCoutTransformer([](G4String& msg) -> G4bool {
    std::time_t now = std::time(nullptr);
    char timeStr[64];
    std::strftime(timeStr, sizeof(timeStr), "[%Y-%m-%d %H:%M:%S] ",
                  std::localtime(&now));
    msg = G4String(timeStr) + msg;
    return true;
});
multi->push_back(G4coutDestinationUPtr(fileDest));

// Uppercase file output
auto upperDest = new G4FilecoutDestination("uppercase.log");
upperDest->Open();
upperDest->AddCoutTransformer([](G4String& msg) -> G4bool {
    G4StrUtil::to_upper(msg);
    return true;
});
multi->push_back(G4coutDestinationUPtr(upperDest));

G4iosSetDestination(multi);

G4cout << "test message" << G4endl;
// Console: test message
// timestamped.log: [2025-11-17 10:30:45] test message
// uppercase.log: TEST MESSAGE
```

### Dynamic Destination Management

```cpp
class DynamicMultiDestination
{
 public:
  DynamicMultiDestination()
  {
    m_multi = new G4MulticoutDestination();
    G4iosSetDestination(m_multi);
  }

  void AddLogFile(const G4String& filename)
  {
    auto fileDest = new G4FilecoutDestination(filename);
    fileDest->Open();
    m_multi->push_back(G4coutDestinationUPtr(fileDest));
  }

  void RemoveLastDestination()
  {
    if (!m_multi->empty()) {
      m_multi->pop_back();
    }
  }

  void ClearAll()
  {
    m_multi->clear();
  }

  std::size_t GetDestinationCount() const
  {
    return m_multi->size();
  }

 private:
  G4MulticoutDestination* m_multi;
};

// Usage
DynamicMultiDestination manager;
manager.AddLogFile("run1.log");
manager.AddLogFile("run2.log");
G4cout << "Count: " << manager.GetDestinationCount() << G4endl;  // 2
```

### Hierarchical Transformers

```cpp
auto multi = new G4MulticoutDestination();

// Multi-destination applies prefix to ALL children
multi->AddCoutTransformer([](G4String& msg) -> G4bool {
    msg = "GLOBAL: " + msg;
    return true;
});

// First child adds its own prefix
auto dest1 = new G4coutDestination();
dest1->AddCoutTransformer([](G4String& msg) -> G4bool {
    msg = "DEST1: " + msg;
    return true;
});
multi->push_back(G4coutDestinationUPtr(dest1));

// Second child adds different prefix
auto dest2 = new G4FilecoutDestination("log.txt");
dest2->Open();
dest2->AddCoutTransformer([](G4String& msg) -> G4bool {
    msg = "DEST2: " + msg;
    return true;
});
multi->push_back(G4coutDestinationUPtr(dest2));

G4iosSetDestination(multi);
G4cout << "message" << G4endl;

// dest1 receives: DEST1: GLOBAL: message
// dest2 receives: DEST2: GLOBAL: message
```

## Best Practices

### 1. Use Unique Pointers for Ownership

```cpp
// GOOD - Ownership transferred to container
auto fileDest = new G4FilecoutDestination("log.txt");
fileDest->Open();  // Configure before transfer
multi->push_back(G4coutDestinationUPtr(fileDest));
// fileDest now owned by multi, don't delete manually

// AVOID - Managing lifetime manually
G4FilecoutDestination* fileDest = new G4FilecoutDestination("log.txt");
multi->push_back(G4coutDestinationUPtr(fileDest));
delete fileDest;  // WRONG - already owned by multi!
```

### 2. Configure Destinations Before Adding

```cpp
// GOOD - Configure then add
auto fileDest = new G4FilecoutDestination("log.txt");
fileDest->Open();
fileDest->AddCoutTransformer(myTransformer);
multi->push_back(G4coutDestinationUPtr(fileDest));

// HARDER - Configure after adding (requires accessing element)
multi->push_back(G4coutDestinationUPtr(new G4FilecoutDestination("log.txt")));
static_cast<G4FilecoutDestination*>((*multi)[0].get())->Open();
```

### 3. Order Matters for Some Use Cases

```cpp
// If one destination depends on side effects of another,
// order is important (destinations processed sequentially)

// Example: Log to file, then forward to master
multi->push_back(G4coutDestinationUPtr(fileDest));  // First
multi->push_back(G4coutDestinationUPtr(forwarder)); // Second
```

### 4. Consider Performance Impact

```cpp
// Each destination adds overhead
// GOOD - Reasonable number of destinations
multi->push_back(dest1);  // Console
multi->push_back(dest2);  // Primary log
multi->push_back(dest3);  // Error log

// AVOID - Excessive destinations (performance impact)
for (int i = 0; i < 100; ++i) {
    multi->push_back(/*...*/);  // Too many!
}
```

### 5. Use Clear Destination Purposes

```cpp
// GOOD - Each destination has clear purpose
auto multi = new G4MulticoutDestination();
multi->push_back(consoleOutput);      // User feedback
multi->push_back(mainLog);            // Complete record
multi->push_back(errorLog);           // Filtered errors only
multi->push_back(performanceMetrics); // Timing data only

// AVOID - Redundant or unclear purposes
multi->push_back(file1);  // Same as file2?
multi->push_back(file2);  // Same as file1?
```

### 6. Clean Up Properly

```cpp
// GOOD - Let unique_ptr handle cleanup
{
    auto multi = new G4MulticoutDestination();
    multi->push_back(/*...*/);
    multi->push_back(/*...*/);
    G4iosSetDestination(multi);
    // ... use ...
    delete multi;  // Automatically deletes all children
}

// OK - Explicit clear before delete
auto multi = new G4MulticoutDestination();
// ... use ...
multi->clear();  // Explicit cleanup
delete multi;
```

### 7. Handle Failures Gracefully

```cpp
// Check return values if critical
G4int result = multi->ReceiveG4cout("Important message");
if (result != 0) {
    // One or more destinations failed
    // Consider fallback or error handling
}
```

## Performance Considerations

### Sequential Processing

- Messages sent to each destination sequentially
- Total time = sum of individual destination times
- N destinations = N times the overhead

### Transformer Application

- Multi-destination transformers applied once
- Each child's transformers applied independently
- Minimize transformers for better performance

### Typical Overhead

- 2-3 destinations: Minimal impact (~2-3x single destination)
- 5-10 destinations: Noticeable impact
- >10 destinations: Significant overhead

## Common Pitfalls

### Using Raw Pointers

```cpp
// WRONG - Memory leak or double delete
G4FilecoutDestination* fileDest = new G4FilecoutDestination("log.txt");
multi->push_back(G4coutDestinationUPtr(fileDest));
delete fileDest;  // WRONG - unique_ptr already owns it!

// CORRECT - Transfer ownership
auto fileDest = new G4FilecoutDestination("log.txt");
fileDest->Open();
multi->push_back(G4coutDestinationUPtr(fileDest));
// Don't delete - multi owns it now
```

### Accessing Deleted Destinations

```cpp
// WRONG
auto multi = new G4MulticoutDestination();
auto fileDest = new G4FilecoutDestination("log.txt");
fileDest->Open();
multi->push_back(G4coutDestinationUPtr(fileDest));
multi->clear();  // fileDest deleted!
fileDest->Close();  // CRASH - already deleted

// CORRECT
auto multi = new G4MulticoutDestination();
auto fileDest = new G4FilecoutDestination("log.txt");
fileDest->Open();
multi->push_back(G4coutDestinationUPtr(fileDest));
// fileDest now owned by multi - don't access directly
```

### Not Opening File Destinations

```cpp
// WRONG - File not opened
auto fileDest = new G4FilecoutDestination("log.txt");
multi->push_back(G4coutDestinationUPtr(fileDest));
// Output to file will fail!

// CORRECT - Open before adding
auto fileDest = new G4FilecoutDestination("log.txt");
fileDest->Open();
multi->push_back(G4coutDestinationUPtr(fileDest));
```

## Thread Safety

- Container itself is not thread-safe for modification
- Add all destinations before multi-threaded execution
- Each child destination's thread safety is independent
- Use separate `G4MulticoutDestination` per thread in MT

## See Also

- **G4coutDestination** - Base class for all destinations
- **G4FilecoutDestination** - File output destination
- **G4BuffercoutDestination** - Buffered output
- **G4MasterForwardcoutDestination** - Master thread forwarding
- **G4LockcoutDestination** - Thread-safe output
- **G4MTcoutDestination** - Multi-threaded output (uses MulticoutDestination internally)
- **std::vector** - Base container class
- **std::unique_ptr** - Smart pointer for ownership
