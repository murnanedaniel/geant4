# G4coutFormatters

## Overview

`G4coutFormatters` is a namespace providing utilities for applying predefined formatting styles to Geant4 output streams. It includes built-in formatters (like "syslog" and "default") and a registration system for custom user-defined formatters, enabling consistent output styling across applications.

**Category:** Global/Management - I/O Formatting
**Type:** Namespace (not a class)
**Author:** A. Dotti (SLAC) - April 2017

## Source Locations

**Header:** `/source/global/management/include/G4coutFormatters.hh`
**Source:** `/source/global/management/src/G4coutFormatters.cc`

## Namespace Contents

```cpp
namespace G4coutFormatters
{
  // Built-in formatter IDs
  namespace ID
  {
    static const G4String SYSLOG  = "syslog";
    static const G4String DEFAULT = "default";
  }

  // Type definitions
  using SetupStyle_f = std::function<G4int(G4coutDestination*)>;
  using String_V = std::vector<G4String>;

  // Formatter management functions
  String_V Names();
  G4int HandleStyle(G4coutDestination* dest, const G4String& style);

  void SetMasterStyle(const G4String& style);
  G4String GetMasterStyle();

  void SetupStyleGlobally(const G4String& style);

  void RegisterNewStyle(const G4String& name, SetupStyle_f& formatter);
}
```

## Nested Namespaces

### ID

```cpp
namespace G4coutFormatters::ID
{
  static const G4String SYSLOG  = "syslog";
  static const G4String DEFAULT = "default";
}
```

**Purpose:** Predefined formatter identifiers.

**Built-in Formatters:**

#### SYSLOG
- **Name:** `"syslog"`
- **Style:** Unix syslog-like format with severity levels
- **Format:** `[LEVEL] timestamp: message`
- **Example:** `[INFO] 2025-11-17 10:30:45: Simulation started`

#### DEFAULT
- **Name:** `"default"`
- **Style:** Standard Geant4 output format
- **Format:** Plain message output
- **Example:** `Simulation started`

## Type Definitions

### SetupStyle_f

```cpp
using SetupStyle_f = std::function<G4int(G4coutDestination*)>;
```

**Purpose:** Function type for formatter setup functions.

**Parameters:**
- `G4coutDestination*` - Destination to apply formatting to

**Return Value:**
- `0` - Success
- Non-zero - Error

**Description:** A function that configures a destination with specific formatting by adding transformers.

**Example:**
```cpp
// Define a custom formatter function
SetupStyle_f myFormatter = [](G4coutDestination* dest) -> G4int {
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        msg = "CUSTOM: " + msg;
        return true;
    });
    return 0;
};
```

### String_V

```cpp
using String_V = std::vector<G4String>;
```

**Purpose:** Vector of strings for listing formatter names.

## Functions

### Names()

```cpp
String_V Names();
```

**Purpose:** Returns list of all registered formatter names.

**Return Value:** Vector containing names of all available formatters (built-in and custom).

**Details:**
- Includes built-in formatters ("default", "syslog")
- Includes all custom registered formatters
- Useful for displaying available options to users

**Example:**
```cpp
auto formatters = G4coutFormatters::Names();
G4cout << "Available formatters:" << G4endl;
for (const auto& name : formatters) {
    G4cout << "  - " << name << G4endl;
}
// Output:
//   - default
//   - syslog
//   - myCustomFormatter (if registered)
```

### HandleStyle()

```cpp
G4int HandleStyle(G4coutDestination* dest, const G4String& style);
```

**Purpose:** Applies a named formatter style to a destination.

**Parameters:**
- `dest` - Destination to configure
- `style` - Name of formatter to apply

**Return Value:**
- `0` - Formatter applied successfully
- Non-zero - Formatter not found or error

**Details:**
- Looks up formatter by name
- Calls the formatter's setup function
- Works with both built-in and custom formatters

**Example:**
```cpp
auto dest = new G4coutDestination();

// Apply syslog style
G4int result = G4coutFormatters::HandleStyle(dest, "syslog");
if (result == 0) {
    G4iosSetDestination(dest);
    G4cout << "Message" << G4endl;
    // Output: [INFO] 2025-11-17 10:30:45: Message
}
```

### SetMasterStyle()

```cpp
void SetMasterStyle(const G4String& style);
```

**Purpose:** Sets the formatter style for the master thread.

**Parameters:**
- `style` - Name of formatter to use for master thread

**Details:**
- Stores style name for master thread
- Applied during master thread initialization
- Used in multi-threaded applications

**Example:**
```cpp
// Before initialization
G4coutFormatters::SetMasterStyle("syslog");

// Master thread will use syslog formatting
```

### GetMasterStyle()

```cpp
G4String GetMasterStyle();
```

**Purpose:** Returns the currently set master thread formatter style.

**Return Value:** Name of formatter set for master thread (empty if none).

**Example:**
```cpp
G4String masterStyle = G4coutFormatters::GetMasterStyle();
G4cout << "Master uses: " << masterStyle << G4endl;
```

### SetupStyleGlobally()

```cpp
void SetupStyleGlobally(const G4String& style);
```

**Purpose:** Applies a formatter style to all threads (master and workers).

**Parameters:**
- `style` - Name of formatter to apply globally

**Details:**
- Should be called in main() after RunManager creation
- Applies to master and all worker threads
- Convenient way to set consistent formatting across application

**Typical Usage:**
```cpp
int main(int argc, char** argv)
{
    auto runManager = new G4MTRunManager();
    runManager->SetNumberOfThreads(4);

    // Apply formatting to all threads
    G4coutFormatters::SetupStyleGlobally("syslog");

    // Initialize and run
    runManager->Initialize();
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

### RegisterNewStyle()

```cpp
void RegisterNewStyle(const G4String& name, SetupStyle_f& formatter);
```

**Purpose:** Registers a custom formatter for use by name.

**Parameters:**
- `name` - Unique name for the formatter
- `formatter` - Setup function implementing the formatter

**Details:**
- Adds custom formatter to registry
- Formatter can then be used with `HandleStyle()` or `SetupStyleGlobally()`
- Names should be unique (overwrites existing)

**Example:**
```cpp
// Define custom formatter
SetupStyle_f myFormatter = [](G4coutDestination* dest) -> G4int {
    // Add prefix to all messages
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        msg = ">> " + msg;
        return true;
    });

    // Add timestamp to errors
    dest->AddCerrTransformer([](G4String& msg) -> G4bool {
        std::time_t now = std::time(nullptr);
        char buf[64];
        std::strftime(buf, sizeof(buf), "[%Y-%m-%d %H:%M:%S] ",
                      std::localtime(&now));
        msg = G4String(buf) + msg;
        return true;
    });

    return 0;
};

// Register the formatter
G4coutFormatters::RegisterNewStyle("myStyle", myFormatter);

// Use it
G4coutFormatters::SetupStyleGlobally("myStyle");
```

## Built-in Formatters

### Default Formatter

**Name:** `"default"`

**Description:** Standard Geant4 output with no modifications.

**Output Example:**
```
Geant4 version 11.0
Physics process initialized
Event 0 processed
Run completed
```

**Usage:**
```cpp
G4coutFormatters::HandleStyle(dest, "default");
// or
G4coutFormatters::SetupStyleGlobally("default");
```

### Syslog Formatter

**Name:** `"syslog"`

**Description:** Unix syslog-style formatting with severity levels and timestamps.

**Format:**
- Adds timestamp to messages
- Prefixes with severity level
- Compatible with log aggregation tools

**Output Example:**
```
[INFO]  2025-11-17 10:30:45: Geant4 version 11.0
[INFO]  2025-11-17 10:30:46: Physics process initialized
[INFO]  2025-11-17 10:31:00: Event 0 processed
[ERROR] 2025-11-17 10:31:05: Invalid geometry detected
[INFO]  2025-11-17 10:32:00: Run completed
```

**Usage:**
```cpp
G4coutFormatters::HandleStyle(dest, "syslog");
// or
G4coutFormatters::SetupStyleGlobally("syslog");
```

## Usage Patterns

### Basic Formatter Application

```cpp
auto dest = new G4coutDestination();

// Apply syslog formatting
G4coutFormatters::HandleStyle(dest, "syslog");

G4iosSetDestination(dest);

G4cout << "Application started" << G4endl;
// Output: [INFO] 2025-11-17 10:30:45: Application started
```

### Global Formatting Setup

```cpp
int main(int argc, char** argv)
{
    auto runManager = new G4RunManager();

    // Apply formatting globally
    G4coutFormatters::SetupStyleGlobally("syslog");

    // All subsequent output uses syslog format
    runManager->Initialize();
    runManager->BeamOn(100);

    delete runManager;
    return 0;
}
```

### Custom Formatter Registration

```cpp
// Define custom JSON-style formatter
SetupStyle_f jsonFormatter = [](G4coutDestination* dest) -> G4int {
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        std::time_t now = std::time(nullptr);
        std::stringstream ss;
        ss << R"({"timestamp": )" << now
           << R"(, "level": "INFO", "message": ")" << msg << R"("})";
        msg = ss.str();
        return true;
    });

    dest->AddCerrTransformer([](G4String& msg) -> G4bool {
        std::time_t now = std::time(nullptr);
        std::stringstream ss;
        ss << R"({"timestamp": )" << now
           << R"(, "level": "ERROR", "message": ")" << msg << R"("})";
        msg = ss.str();
        return true;
    });

    return 0;
};

// Register it
G4coutFormatters::RegisterNewStyle("json", jsonFormatter);

// Use it
G4coutFormatters::SetupStyleGlobally("json");

G4cout << "Test message" << G4endl;
// Output: {"timestamp": 1700221845, "level": "INFO", "message": "Test message"}
```

### Multi-Threaded Formatting

```cpp
int main()
{
    auto runManager = new G4MTRunManager();
    runManager->SetNumberOfThreads(4);

    // Set master thread formatter
    G4coutFormatters::SetMasterStyle("syslog");

    // Workers will inherit or can have different formatters
    G4coutFormatters::SetupStyleGlobally("syslog");

    runManager->Initialize();
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

### Conditional Formatting

```cpp
int main(int argc, char** argv)
{
    auto runManager = new G4RunManager();

    // Choose formatter based on environment or command-line
    G4String formatter = "default";

    if (getenv("G4_USE_SYSLOG")) {
        formatter = "syslog";
    }

    if (argc > 1 && std::string(argv[1]) == "--json") {
        formatter = "json";
    }

    G4coutFormatters::SetupStyleGlobally(formatter);

    runManager->Initialize();
    runManager->BeamOn(100);

    delete runManager;
    return 0;
}
```

### Application-Specific Formatter

```cpp
// Medical physics application formatter
SetupStyle_f medicalFormatter = [](G4coutDestination* dest) -> G4int {
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        // Add [MEDICAL] prefix
        msg = "[MEDICAL] " + msg;

        // Convert dose units if present
        if (G4StrUtil::contains(msg, " Gy")) {
            // Format dose values specially
        }

        return true;
    });

    return 0;
};

G4coutFormatters::RegisterNewStyle("medical", medicalFormatter);
G4coutFormatters::SetupStyleGlobally("medical");
```

### Verbose/Debug Formatter

```cpp
SetupStyle_f debugFormatter = [](G4coutDestination* dest) -> G4int {
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        // Add file/line info if available (from G4cout context)
        std::stringstream ss;
        ss << "[DEBUG] "
           << "[" << std::this_thread::get_id() << "] "
           << msg;
        msg = ss.str();
        return true;
    });

    return 0;
};

G4coutFormatters::RegisterNewStyle("debug", debugFormatter);

// Enable for debugging
G4coutFormatters::SetupStyleGlobally("debug");
```

### Listing Available Formatters

```cpp
void PrintAvailableFormatters()
{
    auto formatters = G4coutFormatters::Names();

    G4cout << "Available output formatters:" << G4endl;
    for (const auto& name : formatters) {
        G4cout << "  - " << name;

        if (name == G4coutFormatters::GetMasterStyle()) {
            G4cout << " (current master style)";
        }

        G4cout << G4endl;
    }
}

// Usage in help or info command
PrintAvailableFormatters();
```

## Best Practices

### 1. Register Formatters Early

```cpp
// GOOD - Register before use
int main()
{
    // Register custom formatters first
    G4coutFormatters::RegisterNewStyle("myStyle", myFormatter);

    // Then setup
    auto runManager = new G4RunManager();
    G4coutFormatters::SetupStyleGlobally("myStyle");
}

// WRONG - Setup before registration
int main()
{
    auto runManager = new G4RunManager();
    G4coutFormatters::SetupStyleGlobally("myStyle");  // Not registered yet!
    G4coutFormatters::RegisterNewStyle("myStyle", myFormatter);
}
```

### 2. Use SetupStyleGlobally() in main()

```cpp
// GOOD - Global setup in main
int main()
{
    auto runManager = new G4MTRunManager();
    G4coutFormatters::SetupStyleGlobally("syslog");
    // All threads use syslog
}

// AVOID - Manual setup per thread (harder to maintain)
```

### 3. Keep Formatters Simple

```cpp
// GOOD - Simple, focused formatter
SetupStyle_f simpleFormatter = [](G4coutDestination* dest) -> G4int {
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        msg = "[PREFIX] " + msg;
        return true;
    });
    return 0;
};

// AVOID - Complex formatter (hard to debug)
SetupStyle_f complexFormatter = [](G4coutDestination* dest) -> G4int {
    // 100 lines of complex transformation logic...
    return 0;
};
```

### 4. Return Appropriate Status Codes

```cpp
SetupStyle_f safeFormatter = [](G4coutDestination* dest) -> G4int {
    if (!dest) {
        return -1;  // Error
    }

    try {
        dest->AddCoutTransformer(/*...*/);
        return 0;  // Success
    }
    catch (...) {
        return -1;  // Error
    }
};
```

### 5. Document Custom Formatters

```cpp
/// Custom formatter for high-energy physics applications
/// Adds:
/// - Event/run context
/// - Energy unit formatting
/// - Particle names standardization
SetupStyle_f hepFormatter = [](G4coutDestination* dest) -> G4int {
    // Implementation...
    return 0;
};

G4coutFormatters::RegisterNewStyle("hep", hepFormatter);
```

### 6. Test Formatters Thoroughly

```cpp
void TestFormatter(const G4String& formatterName)
{
    auto dest = new G4coutDestination();

    G4int result = G4coutFormatters::HandleStyle(dest, formatterName);
    if (result != 0) {
        G4cerr << "Formatter " << formatterName << " failed" << G4endl;
        delete dest;
        return;
    }

    G4iosSetDestination(dest);

    // Test various message types
    G4cout << "Normal message" << G4endl;
    G4cerr << "Error message" << G4endl;
    G4debug << "Debug message" << G4endl;

    delete dest;
}
```

### 7. Make Formatters Configurable

```cpp
// Formatter factory with configuration
SetupStyle_f CreateTimestampFormatter(bool includeMilliseconds)
{
    return [includeMilliseconds](G4coutDestination* dest) -> G4int {
        dest->AddCoutTransformer(
            [includeMilliseconds](G4String& msg) -> G4bool {
                auto now = std::chrono::system_clock::now();
                // Format based on configuration
                // ...
                return true;
            }
        );
        return 0;
    };
}

auto formatter = CreateTimestampFormatter(true);
G4coutFormatters::RegisterNewStyle("timestamp_ms", formatter);
```

## Common Formatters Examples

### Timestamp Formatter

```cpp
SetupStyle_f timestampFormatter = [](G4coutDestination* dest) -> G4int {
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        auto now = std::chrono::system_clock::now();
        auto time = std::chrono::system_clock::to_time_t(now);
        char buf[32];
        std::strftime(buf, sizeof(buf), "[%H:%M:%S] ", std::localtime(&time));
        msg = G4String(buf) + msg;
        return true;
    });
    return 0;
};

G4coutFormatters::RegisterNewStyle("timestamp", timestampFormatter);
```

### Color Output Formatter

```cpp
SetupStyle_f colorFormatter = [](G4coutDestination* dest) -> G4int {
    // ANSI color codes
    const char* GREEN = "\033[32m";
    const char* RED = "\033[31m";
    const char* RESET = "\033[0m";

    dest->AddCoutTransformer([GREEN, RESET](G4String& msg) -> G4bool {
        msg = G4String(GREEN) + msg + RESET;
        return true;
    });

    dest->AddCerrTransformer([RED, RESET](G4String& msg) -> G4bool {
        msg = G4String(RED) + msg + RESET;
        return true;
    });

    return 0;
};

G4coutFormatters::RegisterNewStyle("color", colorFormatter);
```

### XML Formatter

```cpp
SetupStyle_f xmlFormatter = [](G4coutDestination* dest) -> G4int {
    dest->AddCoutTransformer([](G4String& msg) -> G4bool {
        msg = "<message type=\"info\">" + msg + "</message>";
        return true;
    });

    dest->AddCerrTransformer([](G4String& msg) -> G4bool {
        msg = "<message type=\"error\">" + msg + "</message>";
        return true;
    });

    return 0;
};

G4coutFormatters::RegisterNewStyle("xml", xmlFormatter);
```

## Thread Safety

- Registration functions should be called before multi-threaded execution
- SetupStyleGlobally() is thread-aware
- Custom formatters should be thread-safe
- Built-in formatters are thread-safe

## See Also

- **G4coutDestination** - Destination class that formatters configure
- **G4coutDestination::Transformer** - Transform function type
- **G4ios** - I/O stream definitions
- **G4MTcoutDestination** - Multi-threaded output
- **G4iosSetDestination()** - Setting active destination
