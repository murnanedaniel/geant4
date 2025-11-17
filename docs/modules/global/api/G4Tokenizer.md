# G4Tokenizer

## Overview

G4Tokenizer is a simple yet efficient string tokenization utility for splitting strings into tokens based on delimiter characters. It derives from the Rogue Wave RWTokenizer implementation and uses STL strings internally. The tokenizer maintains state to allow sequential extraction of tokens from a string.

**Source Location**: `/source/global/management/include/G4Tokenizer.hh`

**Author**: G. Cosmo (2001)

## Class Definition

```cpp
class G4Tokenizer
{
public:
    G4Tokenizer(const G4String& stn);
    G4String operator()(const char* str = " \t\n", std::size_t l = 0);

private:
    G4String string2tokenize;
    std::size_t actual;
};
```

## Constructor

```cpp
G4Tokenizer(const G4String& stn)
```

**Parameters**:
- `stn` - The string to be tokenized

**Description**: Initializes the tokenizer with the string to be split. Sets the internal position to the beginning of the string.

## Member Functions

### operator()

```cpp
G4String operator()(const char* str = " \t\n", std::size_t l = 0)
```

**Parameters**:
- `str` - String containing delimiter characters (default: space, tab, newline)
- `l` - Length of delimiter string (default: 0, auto-calculated)

**Returns**: Next token from the string, or empty string if no more tokens

**Description**: Extracts and returns the next token from the string. The function:
1. Skips leading delimiters
2. Finds the next delimiter
3. Returns the substring between delimiters
4. Advances the internal position for next call

**Behavior**:
- First call returns first token
- Subsequent calls return next tokens
- Returns empty string when no more tokens exist
- Each call advances the internal position

## Usage Examples

### Basic Tokenization

```cpp
#include "G4Tokenizer.hh"

// Simple space-separated tokens
G4String line = "alpha beta gamma delta";
G4Tokenizer tokenizer(line);

G4String token;
while (!(token = tokenizer()).empty()) {
    G4cout << "Token: " << token << G4endl;
}

// Output:
// Token: alpha
// Token: beta
// Token: gamma
// Token: delta
```

### Custom Delimiters

```cpp
// Comma-separated values
G4String csv = "apple,banana,cherry,date";
G4Tokenizer tokenizer(csv);

G4String token;
while (!(token = tokenizer(",")).empty()) {
    G4cout << "Item: " << token << G4endl;
}

// Output:
// Item: apple
// Item: banana
// Item: cherry
// Item: date
```

### Multiple Delimiters

```cpp
// Split on multiple delimiters: space, comma, semicolon
G4String data = "x=10, y=20; z=30 w=40";
G4Tokenizer tokenizer(data);

G4String token;
while (!(token = tokenizer(" ,;")).empty()) {
    G4cout << "Token: " << token << G4endl;
}

// Output:
// Token: x=10
// Token: y=20
// Token: z=30
// Token: w=40
```

### Parsing Key-Value Pairs

```cpp
G4String config = "length=100mm energy=5MeV particle=gamma";
G4Tokenizer tokenizer(config);

G4String token;
while (!(token = tokenizer()).empty()) {
    // Further split each token on '='
    G4Tokenizer pairTokenizer(token);
    G4String key = pairTokenizer("=");
    G4String value = pairTokenizer("=");

    G4cout << "Key: " << key << ", Value: " << value << G4endl;
}

// Output:
// Key: length, Value: 100mm
// Key: energy, Value: 5MeV
// Key: particle, Value: gamma
```

### Processing Command-Line Arguments

```cpp
void ProcessCommand(const G4String& commandLine) {
    G4Tokenizer tokenizer(commandLine);

    // Get command name
    G4String command = tokenizer();

    // Get arguments
    std::vector<G4String> arguments;
    G4String arg;
    while (!(arg = tokenizer()).empty()) {
        arguments.push_back(arg);
    }

    G4cout << "Command: " << command << G4endl;
    G4cout << "Arguments: " << arguments.size() << G4endl;
    for (const auto& a : arguments) {
        G4cout << "  - " << a << G4endl;
    }
}

// Usage
ProcessCommand("/gun/position 0 0 -10 cm");
// Output:
// Command: /gun/position
// Arguments: 4
//   - 0
//   - 0
//   - -10
//   - cm
```

### Parsing Data Files

```cpp
void ReadDataFile(const G4String& filename) {
    std::ifstream file(filename);
    G4String line;

    while (std::getline(file, line)) {
        // Skip empty lines and comments
        if (line.empty() || line[0] == '#') continue;

        G4Tokenizer tokenizer(line);

        G4String particleName = tokenizer();
        G4String energyStr = tokenizer();
        G4String countStr = tokenizer();

        if (!particleName.empty() && !energyStr.empty()) {
            G4double energy = std::stod(energyStr);
            G4int count = countStr.empty() ? 1 : std::stoi(countStr);

            G4cout << "Particle: " << particleName
                   << ", Energy: " << energy
                   << " MeV, Count: " << count << G4endl;
        }
    }
}

// File content:
// # Particle data
// gamma 5.0 100
// electron 1.0 50
// neutron 10.0
```

### Parsing Path Strings

```cpp
G4String path = "/home/user/geant4/data/materials.txt";
G4Tokenizer tokenizer(path);

// Split on path separator
std::vector<G4String> pathComponents;
G4String component;
while (!(component = tokenizer("/")).empty()) {
    pathComponents.push_back(component);
}

G4cout << "Path components:" << G4endl;
for (const auto& comp : pathComponents) {
    G4cout << "  " << comp << G4endl;
}

// Get filename (last component)
if (!pathComponents.empty()) {
    G4String filename = pathComponents.back();
    G4cout << "Filename: " << filename << G4endl;
}
```

### Whitespace Handling

```cpp
// String with various whitespace
G4String text = "  alpha  \t\t beta\n\ngamma  ";
G4Tokenizer tokenizer(text);

// Default delimiters handle all whitespace
G4String token;
while (!(token = tokenizer()).empty()) {  // Uses " \t\n" by default
    G4cout << "[" << token << "]" << G4endl;
}

// Output:
// [alpha]
// [beta]
// [gamma]
```

### Extracting Fixed Number of Tokens

```cpp
G4ThreeVector ParseVector(const G4String& vectorStr) {
    G4Tokenizer tokenizer(vectorStr);

    G4String xStr = tokenizer();
    G4String yStr = tokenizer();
    G4String zStr = tokenizer();

    if (xStr.empty() || yStr.empty() || zStr.empty()) {
        G4Exception("ParseVector", "InvalidFormat",
                    FatalException, "Expected three values");
    }

    return G4ThreeVector(std::stod(xStr),
                        std::stod(yStr),
                        std::stod(zStr));
}

// Usage
G4ThreeVector pos = ParseVector("10.5 20.3 -5.7");
G4cout << "Position: " << pos << G4endl;
```

### Building Token Vectors

```cpp
std::vector<G4String> SplitString(const G4String& str,
                                  const char* delimiters = " \t\n") {
    std::vector<G4String> tokens;
    G4Tokenizer tokenizer(str);

    G4String token;
    while (!(token = tokenizer(delimiters)).empty()) {
        tokens.push_back(token);
    }

    return tokens;
}

// Usage
G4String data = "proton electron gamma neutron";
std::vector<G4String> particles = SplitString(data);

G4cout << "Found " << particles.size() << " particles" << G4endl;
for (const auto& p : particles) {
    G4cout << "  - " << p << G4endl;
}
```

## Best Practices

### 1. Check for Empty Tokens

```cpp
G4Tokenizer tokenizer(line);
G4String token = tokenizer();

if (!token.empty()) {
    // Process token
} else {
    // No token found or end of string
}
```

### 2. Use Default Delimiters for General Text

```cpp
// GOOD: Default handles common whitespace
G4Tokenizer tokenizer(text);
while (!(token = tokenizer()).empty()) {
    ProcessToken(token);
}

// AVOID: Unless you specifically need custom delimiters
while (!(token = tokenizer(" ")).empty()) {
    ProcessToken(token);  // Doesn't handle tabs/newlines
}
```

### 3. Create New Tokenizer for Each String

```cpp
// GOOD: Fresh tokenizer for each string
void ProcessLines(const std::vector<G4String>& lines) {
    for (const auto& line : lines) {
        G4Tokenizer tokenizer(line);  // New tokenizer each iteration
        // Process tokens...
    }
}

// AVOID: Reusing tokenizer (can't reset position)
G4Tokenizer tokenizer("");  // Can't change string
```

### 4. Combine with String Conversion

```cpp
G4String numberList = "1.5 2.3 3.7 4.1";
G4Tokenizer tokenizer(numberList);

std::vector<G4double> numbers;
G4String token;
while (!(token = tokenizer()).empty()) {
    numbers.push_back(std::stod(token));  // String to double
}
```

### 5. Handle Edge Cases

```cpp
void SafeTokenize(const G4String& str) {
    if (str.empty()) {
        G4cout << "Empty string" << G4endl;
        return;
    }

    G4Tokenizer tokenizer(str);
    G4String token;
    G4int count = 0;

    while (!(token = tokenizer()).empty()) {
        count++;
        ProcessToken(token);
    }

    if (count == 0) {
        G4cout << "No tokens found" << G4endl;
    }
}
```

## Common Pitfalls

### 1. Not Checking for Empty Result

```cpp
// WRONG: Assumes tokens exist
G4Tokenizer tokenizer(input);
G4String token = tokenizer();
G4double value = std::stod(token);  // Crashes if empty!

// CORRECT: Check before using
if (!token.empty()) {
    G4double value = std::stod(token);
}
```

### 2. Delimiter Length Parameter

```cpp
// Usually not needed - auto-calculated
tokenizer(",");  // Correct, length auto-calculated

// Only specify if you need substring of delimiters
tokenizer(delims, 2);  // Use only first 2 chars of delims
```

### 3. Assuming Token Count

```cpp
// WRONG: Assumes exactly 3 tokens
G4Tokenizer tokenizer(input);
G4String x = tokenizer();
G4String y = tokenizer();
G4String z = tokenizer();
// What if input has only 2 tokens? z is empty!

// CORRECT: Verify token count
std::vector<G4String> tokens = SplitString(input);
if (tokens.size() >= 3) {
    // Safe to use tokens[0], tokens[1], tokens[2]
}
```

### 4. Forgetting Multiple Delimiters

```cpp
// WRONG: Only splits on comma
G4String mixed = "a,b c;d";  // Has comma, space, and semicolon
G4Tokenizer tokenizer(mixed);
while (!(token = tokenizer(",")).empty()) {  // Only finds "a" and "b c;d"
    Process(token);
}

// CORRECT: Include all delimiters
while (!(token = tokenizer(",; ")).empty()) {  // Finds "a", "b", "c", "d"
    Process(token);
}
```

## Thread Safety

**Thread-Safe**: Yes, with proper usage

**Considerations**:
- Each thread should create its own G4Tokenizer instance
- No shared state between tokenizers
- No static or global data

**Safe Usage**:
```cpp
// Each thread can safely use its own tokenizer
void ProcessStringInThread(const G4String& str) {
    G4Tokenizer tokenizer(str);  // Thread-local instance

    G4String token;
    while (!(token = tokenizer()).empty()) {
        ProcessToken(token);  // Thread-safe if ProcessToken is safe
    }
}
```

**Unsafe Usage**:
```cpp
// WRONG: Sharing tokenizer between threads
static G4Tokenizer sharedTokenizer("some string");  // NOT thread-safe

void ThreadFunction() {
    G4String token = sharedTokenizer();  // Race condition!
}
```

## Performance Considerations

### 1. Efficient for Sequential Access

```cpp
// GOOD: Single pass through string
G4Tokenizer tokenizer(longString);
while (!(token = tokenizer()).empty()) {
    Process(token);
}
```

### 2. Not Suitable for Random Access

```cpp
// INEFFICIENT: Can't access tokens randomly
// Must tokenize from start each time to get Nth token
```

### 3. Consider Alternatives for Complex Parsing

```cpp
// For complex parsing, consider:
// - std::regex for pattern matching
// - std::stringstream for formatted input
// - Dedicated parsers for structured data (JSON, XML)

// G4Tokenizer is best for simple, delimiter-based splitting
```

## Advanced Usage

### Nested Tokenization

```cpp
// Parse nested structure: "key1=val1,val2;key2=val3,val4"
G4String data = "length=10,20,30;energy=5,10,15";
G4Tokenizer outerTokenizer(data);

G4String pair;
while (!(pair = outerTokenizer(";")).empty()) {
    G4Tokenizer pairTokenizer(pair);
    G4String key = pairTokenizer("=");
    G4String values = pairTokenizer("=");

    G4cout << "Key: " << key << G4endl;

    G4Tokenizer valueTokenizer(values);
    G4String value;
    while (!(value = valueTokenizer(",")).empty()) {
        G4cout << "  Value: " << value << G4endl;
    }
}
```

### Integration with Geant4 UI Commands

```cpp
class MyMessenger : public G4UImessenger {
    void SetNewValue(G4UIcommand* command, G4String newValue) {
        if (command == myVectorCmd) {
            G4Tokenizer tokenizer(newValue);
            G4double x = std::stod(tokenizer());
            G4double y = std::stod(tokenizer());
            G4double z = std::stod(tokenizer());
            myDetector->SetPosition(G4ThreeVector(x, y, z));
        }
    }
};
```

## Related Classes

- **G4String**: Geant4 string type (typedef to std::string)
- **G4UIcommand**: Uses tokenization for command parsing
- **G4Evaluator**: For expression evaluation (more advanced than simple tokenization)

## See Also

- [G4String Documentation](G4String.md)
- [C++ std::string reference](https://en.cppreference.com/w/cpp/string/basic_string)
- [Geant4 UI Commands](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/Control/commands.html)
