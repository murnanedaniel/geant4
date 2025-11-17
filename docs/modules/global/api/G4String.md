# G4String

## Overview

`G4String` is Geant4's string class, providing a `std::string`-compliant implementation with additional utilities. It currently inherits from `std::string` but should be treated as an interface-compatible type. The companion `G4StrUtil` namespace provides additional string manipulation functions.

**Category:** Global/Management - String Utilities
**Base Class:** std::string
**Author:** G. Cosmo (November 1999)

## Source Locations

**Header:** `/source/global/management/include/G4String.hh`
**Implementation:** Inline (G4String.icc)

## Class Definition

```cpp
class G4String : public std::string
{
 public:
  // Enumerations (deprecated)
  enum caseCompare { exact, ignoreCase };
  enum stripType { leading, trailing, both };

  // Standard std::string interface
  using std::string::string;
  using std::string::operator=;

  // Constructors
  G4String() = default;
  G4String(const std::string& s);
  G4String(const G4String& s);
  G4String(std::string&& s);
  G4String(G4String&& s);

  // Assignment operators
  G4String& operator=(const G4String& s);
  G4String& operator=(G4String&& s);

  // Deprecated conversion operator
  operator const char*() const;

  // Deprecated subscript operators
  reference operator[](int index);
  const_reference operator[](int index) const;

  // Deprecated methods
  [[deprecated]] G4int compareTo(std::string_view, caseCompare mode = exact) const;
  [[deprecated]] std::istream& readLine(std::istream&, G4bool skipWhite = true);
  [[deprecated]] G4String& remove(size_type index);
  [[deprecated]] G4bool contains(const std::string& s) const;
  [[deprecated]] G4bool contains(char c) const;
  [[deprecated]] G4String strip(stripType type = trailing, char ch = ' ');
  [[deprecated]] void toLower();
  [[deprecated]] void toUpper();
};
```

## Public Interface

### Constructors

G4String supports all `std::string` constructors plus copy/move from `std::string`:

```cpp
// Default
G4String s1;

// From C-string
G4String s2("Hello");

// From std::string
std::string stdStr = "World";
G4String s3(stdStr);

// Copy
G4String s4(s2);

// Move
G4String s5(std::move(s2));

// Substring
G4String s6("Hello World", 5);  // "Hello"

// Character repetition
G4String s7(5, 'x');  // "xxxxx"
```

### Standard std::string Methods

All `std::string` methods are available. Common operations:

#### String Information

```cpp
G4String str = "Geant4";

std::size_t len = str.length();     // 6
std::size_t sz = str.size();        // 6
bool empty = str.empty();           // false
char first = str.front();           // 'G'
char last = str.back();             // '4'
const char* cstr = str.c_str();     // "Geant4\0"
```

#### String Modification

```cpp
G4String str = "Hello";

str.append(" World");               // "Hello World"
str += "!";                         // "Hello World!"
str.insert(5, ",");                 // "Hello, World!"
str.erase(5, 1);                    // "Hello World!"
str.replace(0, 5, "Goodbye");       // "Goodbye World!"
str.clear();                        // ""
```

#### String Searching

```cpp
G4String str = "Geant4 Physics";

std::size_t pos = str.find("Physics");          // 7
std::size_t rpos = str.rfind("a");              // 2
bool found = (str.find("Geant4") != G4String::npos);  // true

if (str.find("Missing") == G4String::npos) {
    // Substring not found
}
```

#### Substring Operations

```cpp
G4String str = "Geant4 Simulation";

G4String sub = str.substr(0, 6);    // "Geant4"
G4String end = str.substr(7);       // "Simulation"
```

#### Comparison

```cpp
G4String s1 = "apple";
G4String s2 = "banana";

bool equal = (s1 == s2);           // false
bool less = (s1 < s2);             // true
int cmp = s1.compare(s2);          // < 0
```

### Deprecated Methods

These methods are deprecated and should be replaced with standard or `G4StrUtil` functions:

#### compareTo() [DEPRECATED]

```cpp
[[deprecated("Use std::string::compare or G4StrUtil::icompare")]]
G4int compareTo(std::string_view s, caseCompare mode = exact) const;
```

**Replacement:**
```cpp
// Old (deprecated)
G4int result = str.compareTo("other", G4String::ignoreCase);

// New
G4int result = G4StrUtil::icompare(str, "other");
```

#### readLine() [DEPRECATED]

```cpp
[[deprecated("Use std::getline plus G4StrUtil::lstrip")]]
std::istream& readLine(std::istream& is, G4bool skipWhite = true);
```

**Replacement:**
```cpp
// Old (deprecated)
G4String line;
line.readLine(input);

// New
G4String line;
std::getline(input, line);
G4StrUtil::lstrip(line);  // If skipWhite needed
```

#### remove() [DEPRECATED]

```cpp
[[deprecated("Use std::string::erase")]]
G4String& remove(size_type index);
```

**Replacement:**
```cpp
// Old (deprecated)
str.remove(5);

// New
str.erase(5);
```

#### contains() [DEPRECATED]

```cpp
[[deprecated("Use G4StrUtil::contains")]]
G4bool contains(const std::string& s) const;
G4bool contains(char c) const;
```

**Replacement:**
```cpp
// Old (deprecated)
if (str.contains("substring")) { }

// New
if (G4StrUtil::contains(str, "substring")) { }
```

#### strip() [DEPRECATED]

```cpp
[[deprecated("Use G4StrUtil::strip functions")]]
G4String strip(stripType type = trailing, char ch = ' ');
```

**Replacement:**
```cpp
// Old (deprecated)
G4String trimmed = str.strip(G4String::both);

// New
G4String trimmed = G4StrUtil::strip_copy(str);
```

#### toLower() / toUpper() [DEPRECATED]

```cpp
[[deprecated("Use G4StrUtil::to_lower/to_upper")]]
void toLower();
void toUpper();
```

**Replacement:**
```cpp
// Old (deprecated)
str.toLower();
str.toUpper();

// New
G4StrUtil::to_lower(str);
G4StrUtil::to_upper(str);
```

### Deprecated Conversion Operator

```cpp
[[deprecated("Use std::string::c_str() for const char* conversion")]]
operator const char*() const;
```

**Replacement:**
```cpp
// Old (implicit conversion - deprecated)
void func(const char* s);
G4String str = "hello";
func(str);  // Implicit conversion (deprecated)

// New (explicit conversion)
func(str.c_str());
```

## G4StrUtil Namespace

Additional string manipulation functions:

### Case Conversion

#### to_lower()

```cpp
void to_lower(G4String& str);
G4String to_lower_copy(G4String str);
```

**Purpose:** Convert string to lowercase.

**Example:**
```cpp
G4String str = "HELLO";
G4StrUtil::to_lower(str);       // str = "hello"

G4String lower = G4StrUtil::to_lower_copy("WORLD");  // "world"
```

#### to_upper()

```cpp
void to_upper(G4String& str);
G4String to_upper_copy(G4String str);
```

**Purpose:** Convert string to uppercase.

**Example:**
```cpp
G4String str = "hello";
G4StrUtil::to_upper(str);       // str = "HELLO"

G4String upper = G4StrUtil::to_upper_copy("world");  // "WORLD"
```

### Whitespace Stripping

#### lstrip()

```cpp
void lstrip(G4String& str, char ch = ' ');
G4String lstrip_copy(G4String str, char ch = ' ');
```

**Purpose:** Remove leading characters.

**Example:**
```cpp
G4String str = "   hello";
G4StrUtil::lstrip(str);         // str = "hello"

G4String trimmed = G4StrUtil::lstrip_copy("  world");  // "world"
```

#### rstrip()

```cpp
void rstrip(G4String& str, char ch = ' ');
G4String rstrip_copy(G4String str, char ch = ' ');
```

**Purpose:** Remove trailing characters.

**Example:**
```cpp
G4String str = "hello   ";
G4StrUtil::rstrip(str);         // str = "hello"

G4String trimmed = G4StrUtil::rstrip_copy("world  ");  // "world"
```

#### strip()

```cpp
void strip(G4String& str, char ch = ' ');
G4String strip_copy(G4String str, char ch = ' ');
```

**Purpose:** Remove leading and trailing characters.

**Example:**
```cpp
G4String str = "  hello  ";
G4StrUtil::strip(str);          // str = "hello"

G4String trimmed = G4StrUtil::strip_copy("  world  ");  // "world"

// Strip specific character
G4String path = "///path///";
G4StrUtil::strip(path, '/');    // path = "path"
```

### String Testing

#### contains()

```cpp
G4bool contains(const G4String& str, std::string_view ss);
G4bool contains(const G4String& str, char c);
G4bool contains(const G4String& str, const char* ss);
G4bool contains(const G4String& str, const G4String& ss);
```

**Purpose:** Check if string contains substring.

**Example:**
```cpp
G4String str = "Geant4 Physics";

if (G4StrUtil::contains(str, "Physics")) {
    // Found
}

if (G4StrUtil::contains(str, '4')) {
    // Character found
}

if (!G4StrUtil::contains(str, "Chemistry")) {
    // Not found
}
```

#### starts_with()

```cpp
bool starts_with(const G4String& str, std::string_view prefix);
bool starts_with(const G4String& str, char prefix);
bool starts_with(const G4String& str, const char* prefix);
bool starts_with(const G4String& str, const G4String& prefix);
```

**Purpose:** Check if string starts with prefix.

**Example:**
```cpp
G4String str = "Geant4";

if (G4StrUtil::starts_with(str, "Geant")) {
    // True
}

if (G4StrUtil::starts_with(str, 'G')) {
    // True
}
```

#### ends_with()

```cpp
bool ends_with(const G4String& str, std::string_view suffix);
bool ends_with(const G4String& str, char suffix);
bool ends_with(const G4String& str, const char* suffix);
bool ends_with(const G4String& str, const G4String& suffix);
```

**Purpose:** Check if string ends with suffix.

**Example:**
```cpp
G4String filename = "data.txt";

if (G4StrUtil::ends_with(filename, ".txt")) {
    // Text file
}

if (G4StrUtil::ends_with(filename, 't')) {
    // Ends with 't'
}
```

### Case-Insensitive Comparison

#### icompare()

```cpp
G4int icompare(std::string_view lhs, std::string_view rhs);
```

**Purpose:** Case-insensitive string comparison.

**Return Value:**
- Negative if lhs < rhs (ignoring case)
- Zero if equal (ignoring case)
- Positive if lhs > rhs (ignoring case)

**Example:**
```cpp
if (G4StrUtil::icompare("HELLO", "hello") == 0) {
    // Strings are equal (case-insensitive)
}

if (G4StrUtil::icompare("apple", "BANANA") < 0) {
    // "apple" comes before "banana"
}
```

### Utility Functions

#### safe_erase() [DEPRECATED]

```cpp
[[deprecated("Use std::string::erase with bounds checking")]]
void safe_erase(G4String& str, G4String::size_type index = 0,
               G4String::size_type count = G4String::npos);
```

**Purpose:** Erase characters only if index is in range.

**Recommendation:** Use `std::string::erase()` with explicit bounds checking.

#### readline() [DEPRECATED]

```cpp
[[deprecated("Use std::getline with G4StrUtil::lstrip")]]
std::istream& readline(std::istream& is, G4String& str,
                      G4bool skipWhite = true);
```

**Purpose:** Read line from stream.

**Recommendation:** Use `std::getline()` plus `G4StrUtil::lstrip()` if needed.

## Usage Patterns

### Basic String Operations

```cpp
// Creation
G4String name = "Detector";
G4String description("Calorimeter Module");

// Concatenation
G4String full = name + " - " + description;
full += " v2.0";

// Modification
full.insert(0, "GEANT4: ");
full.append(" [Active]");

// Search
if (full.find("Calorimeter") != G4String::npos) {
    G4cout << "Found calorimeter" << G4endl;
}
```

### Case-Insensitive Comparison

```cpp
G4String input = "yes";

// Case-insensitive check
if (G4StrUtil::icompare(input, "YES") == 0 ||
    G4StrUtil::icompare(input, "Yes") == 0) {
    // User said yes
}

// Or convert to same case
G4StrUtil::to_lower(input);
if (input == "yes") {
    // User said yes
}
```

### String Trimming

```cpp
// Read user input and trim whitespace
G4String input;
std::getline(std::cin, input);
G4StrUtil::strip(input);  // Remove leading/trailing whitespace

// Process configuration line
G4String config = "  parameter = value  ";
G4StrUtil::strip(config);
// config = "parameter = value"
```

### Path Manipulation

```cpp
G4String path = "/data/simulation/output.root";

// Extract filename
std::size_t pos = path.rfind('/');
G4String filename = (pos != G4String::npos) ? path.substr(pos + 1) : path;
// filename = "output.root"

// Check extension
if (G4StrUtil::ends_with(filename, ".root")) {
    // ROOT file
}

// Strip extension
pos = filename.rfind('.');
if (pos != G4String::npos) {
    G4String basename = filename.substr(0, pos);
    // basename = "output"
}
```

### Command Parsing

```cpp
G4String command = "/run/beamOn 1000";

// Find command and arguments
std::size_t spacePos = command.find(' ');
G4String cmd = command.substr(0, spacePos);
G4String args = (spacePos != G4String::npos) ?
                command.substr(spacePos + 1) : "";

// Trim arguments
G4StrUtil::strip(args);

// Parse argument
G4int numEvents = std::stoi(args);
```

### String Building

```cpp
// Build formatted output
std::stringstream ss;
ss << "Event " << eventID
   << ": Energy = " << energy << " MeV"
   << ", Position = " << position;
G4String output = ss.str();

// Or using concatenation
G4String msg = "Event " + std::to_string(eventID) +
               ": Energy = " + std::to_string(energy) + " MeV";
```

### File Extension Handling

```cpp
G4String GetFileExtension(const G4String& filename)
{
    std::size_t pos = filename.rfind('.');
    if (pos != G4String::npos && pos < filename.length() - 1) {
        return filename.substr(pos + 1);
    }
    return "";
}

G4String ext = GetFileExtension("data.txt");  // "txt"
G4StrUtil::to_lower(ext);

if (ext == "root") {
    // Handle ROOT file
} else if (ext == "txt" || ext == "dat") {
    // Handle text file
}
```

### Configuration File Parsing

```cpp
void ParseConfigLine(const G4String& line)
{
    // Skip comments and empty lines
    G4String trimmed = G4StrUtil::strip_copy(line);
    if (trimmed.empty() || G4StrUtil::starts_with(trimmed, "#")) {
        return;
    }

    // Parse key=value
    std::size_t eqPos = trimmed.find('=');
    if (eqPos != G4String::npos) {
        G4String key = G4StrUtil::strip_copy(trimmed.substr(0, eqPos));
        G4String value = G4StrUtil::strip_copy(trimmed.substr(eqPos + 1));

        // Process configuration
        ProcessConfig(key, value);
    }
}
```

## Best Practices

### 1. Use std::string Interface

```cpp
// GOOD - Standard interface
G4String str = "hello";
str.append(" world");
std::size_t len = str.length();

// AVOID - Deprecated methods
str.toLower();  // Deprecated
```

### 2. Use G4StrUtil for Extended Operations

```cpp
// GOOD - Use G4StrUtil
G4StrUtil::to_lower(str);
if (G4StrUtil::contains(str, "test")) { }

// AVOID - Deprecated G4String methods
str.toLower();
if (str.contains("test")) { }
```

### 3. Explicit const char* Conversion

```cpp
// GOOD - Explicit conversion
void func(const char* s);
G4String str = "hello";
func(str.c_str());

// AVOID - Implicit conversion (deprecated)
func(str);  // Will be removed
```

### 4. Use Modern C++ String Features

```cpp
// GOOD - C++17 features
if (str.find("test") != G4String::npos) { }
G4String sub = str.substr(0, 5);

// Or use G4StrUtil helpers
if (G4StrUtil::contains(str, "test")) { }
```

### 5. Prefer In-Place Modifications

```cpp
// GOOD - Modify in place
G4String str = "  hello  ";
G4StrUtil::strip(str);

// LESS EFFICIENT - Create copy
G4String str = "  hello  ";
str = G4StrUtil::strip_copy(str);
```

### 6. Handle Empty Strings

```cpp
// GOOD - Check for empty
if (!str.empty()) {
    char first = str.front();
    // Safe to access
}

// WRONG - No check
char first = str.front();  // Undefined if empty!
```

### 7. Use string_view for Function Parameters

```cpp
// GOOD - Accept string_view for flexibility
void ProcessString(std::string_view sv)
{
    // Can accept G4String, std::string, const char*
}

ProcessString(G4String("hello"));
ProcessString(std::string("hello"));
ProcessString("hello");

// LESS FLEXIBLE - Only G4String
void ProcessString(const G4String& str)
{
    // Only accepts G4String
}
```

## Migration Guide

### From Deprecated Methods

| Deprecated | Replacement |
|------------|-------------|
| `str.toLower()` | `G4StrUtil::to_lower(str)` |
| `str.toUpper()` | `G4StrUtil::to_upper(str)` |
| `str.contains("x")` | `G4StrUtil::contains(str, "x")` |
| `str.strip()` | `G4StrUtil::strip(str)` |
| `str.remove(5)` | `str.erase(5)` |
| `str.compareTo("x", ignoreCase)` | `G4StrUtil::icompare(str, "x")` |
| `str.readLine(is)` | `std::getline(is, str)` |
| `const char* p = str` | `const char* p = str.c_str()` |

### Example Migration

```cpp
// OLD CODE (deprecated)
G4String str = "  HELLO WORLD  ";
str.strip(G4String::both);
str.toLower();
if (str.contains("hello")) {
    G4cout << "Found" << G4endl;
}

// NEW CODE (recommended)
G4String str = "  HELLO WORLD  ";
G4StrUtil::strip(str);
G4StrUtil::to_lower(str);
if (G4StrUtil::contains(str, "hello")) {
    G4cout << "Found" << G4endl;
}
```

## Thread Safety

- G4String is as thread-safe as `std::string`
- Safe for concurrent reads
- Not safe for concurrent writes without synchronization
- G4StrUtil functions are thread-safe (no shared state)

## Performance Notes

- In-place operations (`to_lower`, `strip`) are faster than copy versions
- `contains()` is O(n) search
- Case-insensitive operations create temporary lowercase copies
- String concatenation with `+` may create temporaries; use `append()` or `+=` for better performance

## See Also

- **std::string** - Base class with full interface
- **std::string_view** - Non-owning string view (C++17)
- **G4ios** - I/O stream definitions
- **G4cout** - Output stream (uses G4String)
