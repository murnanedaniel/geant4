# G4coutDestination

## Overview

`G4coutDestination` is the abstract base class for handling output from Geant4's global output streams (`G4cout`, `G4cerr`, `G4debug`). It provides a flexible mechanism to redirect, transform, and customize output messages in both sequential and multi-threaded applications.

**Category:** Global/Management - I/O System
**Authors:** H. Yoshida, M. Nagamatu (November 1998)

## Source Locations

**Header:** `/source/global/management/include/G4coutDestination.hh`
**Source:** `/source/global/management/src/G4coutDestination.cc`

## Class Definition

```cpp
class G4coutDestination
{
 public:
  using Transformer = std::function<G4bool(G4String&)>;

  G4coutDestination() = default;
  virtual ~G4coutDestination() = default;

  // Transformer management
  void AddDebugTransformer(const Transformer& t);
  void AddDebugTransformer(Transformer&& t);
  void AddCoutTransformer(const Transformer& t);
  void AddCoutTransformer(Transformer&& t);
  void AddCerrTransformer(const Transformer& t);
  void AddCerrTransformer(Transformer&& t);
  virtual void ResetTransformers();

  // Message handlers (virtual - override in derived classes)
  virtual G4int ReceiveG4debug(const G4String& msg);
  virtual G4int ReceiveG4cout(const G4String& msg);
  virtual G4int ReceiveG4cerr(const G4String& msg);

  // Internal message handling
  G4int ReceiveG4debug_(const G4String& msg);
  G4int ReceiveG4cout_(const G4String& msg);
  G4int ReceiveG4cerr_(const G4String& msg);

 protected:
  static G4coutDestination* masterG4coutDestination;
  std::vector<Transformer> transformersDebug;
  std::vector<Transformer> transformersCout;
  std::vector<Transformer> transformersCerr;
};
```

## Member Types

### Transformer

```cpp
using Transformer = std::function<G4bool(G4String&)>;
```

**Purpose:** Function type for transforming output messages.

**Parameters:**
- `G4String& msg` - Message to transform (modifiable reference)

**Return Value:**
- `true` - Message should continue processing
- `false` - Message should be discarded

**Example:**
```cpp
// Add prefix to messages
auto prefixTransformer = [](G4String& msg) -> G4bool {
    msg = "PREFIX: " + msg;
    return true;
};
destination->AddCoutTransformer(prefixTransformer);

// Filter out messages containing "DEBUG"
auto filterTransformer = [](G4String& msg) -> G4bool {
    return !G4StrUtil::contains(msg, "DEBUG");
};
destination->AddCoutTransformer(filterTransformer);
```

## Public Methods

### Constructor and Destructor

#### G4coutDestination()

```cpp
G4coutDestination() = default;
```

**Purpose:** Default constructor.

**Usage:** Typically called by derived class constructors.

#### ~G4coutDestination()

```cpp
virtual ~G4coutDestination() = default;
```

**Purpose:** Virtual destructor for proper cleanup of derived classes.

### Transformer Management

#### AddDebugTransformer()

```cpp
void AddDebugTransformer(const Transformer& t);
void AddDebugTransformer(Transformer&& t);
```

**Purpose:** Adds a transformer function for G4debug messages.

**Parameters:**
- `t` - Transformer function (by reference or move)

**Details:** Transformers are applied in the order they are added.

**Example:**
```cpp
destination->AddDebugTransformer([](G4String& msg) -> G4bool {
    msg = "[DEBUG] " + msg;
    return true;
});
```

#### AddCoutTransformer()

```cpp
void AddCoutTransformer(const Transformer& t);
void AddCoutTransformer(Transformer&& t);
```

**Purpose:** Adds a transformer function for G4cout messages.

**Parameters:**
- `t` - Transformer function (by reference or move)

**Example:**
```cpp
// Add timestamp to cout messages
destination->AddCoutTransformer([](G4String& msg) -> G4bool {
    std::time_t now = std::time(nullptr);
    msg = std::ctime(&now) + msg;
    return true;
});
```

#### AddCerrTransformer()

```cpp
void AddCerrTransformer(const Transformer& t);
void AddCerrTransformer(Transformer&& t);
```

**Purpose:** Adds a transformer function for G4cerr messages.

**Parameters:**
- `t` - Transformer function (by reference or move)

**Note:** Error messages cannot be completely removed from the stream by transformers (they always proceed even if transformer returns false).

**Example:**
```cpp
// Add ERROR prefix to error messages
destination->AddCerrTransformer([](G4String& msg) -> G4bool {
    G4StrUtil::to_upper(msg);
    msg = "ERROR: " + msg;
    return true;
});
```

#### ResetTransformers()

```cpp
virtual void ResetTransformers();
```

**Purpose:** Clears all registered transformers for debug, cout, and cerr streams.

**Details:** Removes all transformer functions, resetting to default behavior.

**Example:**
```cpp
destination->ResetTransformers();  // Clear all message transformers
```

### Message Handling (Virtual)

#### ReceiveG4debug()

```cpp
virtual G4int ReceiveG4debug(const G4String& msg);
```

**Purpose:** Handles debug messages after transformers have been applied.

**Parameters:**
- `msg` - Transformed debug message

**Return Value:**
- `0` - Success
- `-1` - Failure

**Override:** Derived classes should override to implement custom handling.

**Default Implementation:** Outputs to `std::cout`.

#### ReceiveG4cout()

```cpp
virtual G4int ReceiveG4cout(const G4String& msg);
```

**Purpose:** Handles standard output messages after transformers have been applied.

**Parameters:**
- `msg` - Transformed output message

**Return Value:**
- `0` - Success
- `-1` - Failure

**Override:** Derived classes should override to implement custom handling.

**Default Implementation:** Outputs to `std::cout`.

#### ReceiveG4cerr()

```cpp
virtual G4int ReceiveG4cerr(const G4String& msg);
```

**Purpose:** Handles error messages after transformers have been applied.

**Parameters:**
- `msg` - Transformed error message

**Return Value:**
- `0` - Success
- `-1` - Failure

**Override:** Derived classes should override to implement custom handling.

**Default Implementation:** Outputs to `std::cerr`.

### Internal Message Handling

#### ReceiveG4debug_()

```cpp
G4int ReceiveG4debug_(const G4String& msg);
```

**Purpose:** Internal method called by G4debug stream to handle log messages.

**Details:**
- Applies all registered debug transformers in order
- Calls `ReceiveG4debug()` if transformers allow message to proceed
- Should not be called directly by user code

#### ReceiveG4cout_()

```cpp
G4int ReceiveG4cout_(const G4String& msg);
```

**Purpose:** Internal method called by G4cout stream to handle messages.

**Details:**
- Applies all registered cout transformers in order
- Calls `ReceiveG4cout()` if transformers allow message to proceed
- Should not be called directly by user code

#### ReceiveG4cerr_()

```cpp
G4int ReceiveG4cerr_(const G4String& msg);
```

**Purpose:** Internal method called by G4cerr stream to handle error messages.

**Details:**
- Applies all registered cerr transformers in order
- Always calls `ReceiveG4cerr()` regardless of transformer return values
- Error messages cannot be completely suppressed
- Should not be called directly by user code

## Protected Members

### masterG4coutDestination

```cpp
static G4coutDestination* masterG4coutDestination;
```

**Purpose:** Pointer to master thread's cout destination in multi-threaded mode.

**Usage:** For MT applications where derived classes want to intercept thread outputs.

**Details:** Needed for some G4UI sessions like GUIs to collect output from all threads.

### transformersDebug, transformersCout, transformersCerr

```cpp
std::vector<Transformer> transformersDebug;
std::vector<Transformer> transformersCout;
std::vector<Transformer> transformersCerr;
```

**Purpose:** Vectors storing transformer functions for each stream type.

**Details:** Transformers are applied in the order they were added.

## Usage Patterns

### Basic Custom Destination

```cpp
class MyCustomDestination : public G4coutDestination
{
 public:
  G4int ReceiveG4cout(const G4String& msg) override {
    // Custom handling - e.g., write to custom log
    myLogFile << msg << std::endl;
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override {
    myErrorLog << "ERROR: " << msg << std::endl;
    return 0;
  }

 private:
  std::ofstream myLogFile{"output.log"};
  std::ofstream myErrorLog{"errors.log"};
};

// Use the custom destination
auto dest = new MyCustomDestination();
G4iosSetDestination(dest);
```

### Message Filtering

```cpp
auto dest = new G4coutDestination();

// Filter out verbose messages
dest->AddCoutTransformer([](G4String& msg) -> G4bool {
    if (G4StrUtil::contains(msg, "VERBOSE")) {
        return false;  // Discard message
    }
    return true;  // Keep message
});

G4iosSetDestination(dest);
```

### Message Formatting

```cpp
auto dest = new G4coutDestination();

// Add thread ID and timestamp
dest->AddCoutTransformer([](G4String& msg) -> G4bool {
    std::stringstream ss;
    ss << "[" << std::this_thread::get_id() << "] ";
    msg = ss.str() + msg;
    return true;
});

// Convert to uppercase
dest->AddCoutTransformer([](G4String& msg) -> G4bool {
    G4StrUtil::to_upper(msg);
    return true;
});

G4iosSetDestination(dest);
```

### Multi-Threaded Setup

```cpp
class MTAwareDestination : public G4coutDestination
{
 public:
  MTAwareDestination(G4int threadId) : m_threadId(threadId) {}

  G4int ReceiveG4cout(const G4String& msg) override {
    // Thread-specific handling
    std::lock_guard<std::mutex> lock(m_mutex);
    std::cout << "[Thread " << m_threadId << "] " << msg << std::endl;

    // Forward to master if needed
    if (masterG4coutDestination) {
      masterG4coutDestination->ReceiveG4cout(msg);
    }
    return 0;
  }

 private:
  G4int m_threadId;
  static std::mutex m_mutex;
};

// In worker thread initialization
auto workerDest = new MTAwareDestination(G4Threading::GetThreadId());
G4iosSetDestination(workerDest);
```

## Best Practices

### 1. Always Override Virtual Methods

When creating custom destinations, override at least the `ReceiveG4cout()` and `ReceiveG4cerr()` methods:

```cpp
class MyDestination : public G4coutDestination
{
  G4int ReceiveG4cout(const G4String& msg) override {
    // Implementation required
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override {
    // Implementation required
    return 0;
  }
};
```

### 2. Use Transformers for Message Modification

Use transformers for message formatting/filtering rather than duplicating logic in derived classes:

```cpp
// GOOD: Use transformer
dest->AddCoutTransformer([](G4String& msg) {
    msg = "INFO: " + msg;
    return true;
});

// AVOID: Modifying in ReceiveG4cout if only formatting
```

### 3. Return Appropriate Status Codes

Always return `0` for success and `-1` for failure in Receive methods:

```cpp
G4int ReceiveG4cout(const G4String& msg) override {
    try {
        processMessage(msg);
        return 0;  // Success
    }
    catch (...) {
        return -1;  // Failure
    }
}
```

### 4. Thread Safety in Multi-Threaded Applications

Ensure thread-safe access when using shared resources:

```cpp
class ThreadSafeDestination : public G4coutDestination
{
  G4int ReceiveG4cout(const G4String& msg) override {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_output << msg << std::endl;
    return 0;
  }

 private:
  std::mutex m_mutex;
  std::ofstream m_output;
};
```

### 5. Don't Suppress Error Messages

Error messages should always be visible. If filtering cerr messages, ensure critical errors pass through:

```cpp
dest->AddCerrTransformer([](G4String& msg) -> G4bool {
    // Even if returning false, errors still proceed
    if (isCriticalError(msg)) {
        // Add special marking
        msg = "CRITICAL: " + msg;
    }
    return true;  // Always allow errors
});
```

### 6. Clean Up Resources

Ensure proper cleanup in destructor if managing resources:

```cpp
class FileDestination : public G4coutDestination
{
 public:
  ~FileDestination() override {
    if (m_file.is_open()) {
      m_file.close();
    }
  }

 private:
  std::ofstream m_file;
};
```

### 7. Set Destination Before Output

Always set the destination before generating output:

```cpp
// GOOD
auto dest = new MyDestination();
G4iosSetDestination(dest);
G4cout << "This message goes to custom destination" << G4endl;

// WRONG - message goes to default destination
G4cout << "This message is lost" << G4endl;
auto dest = new MyDestination();
G4iosSetDestination(dest);
```

## Thread Safety

- The base class uses vectors for transformers which are not thread-safe for modification
- Add all transformers before multi-threaded execution begins
- Override methods should implement their own thread safety if needed
- Use derived classes like `G4LockcoutDestination` for thread-safe output

## See Also

- **G4FilecoutDestination** - File-based output destination
- **G4MTcoutDestination** - Multi-threaded output handler
- **G4LockcoutDestination** - Thread-safe output with mutex locking
- **G4MulticoutDestination** - Chain multiple destinations
- **G4BuffercoutDestination** - Buffered output
- **G4coutFormatters** - Pre-defined message formatters
- **G4ios** - Global I/O stream definitions
