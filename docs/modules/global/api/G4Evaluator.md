# G4Evaluator

## Overview

G4Evaluator is a powerful mathematical expression evaluator for Geant4. It is a typedef to CLHEP's HepTool::Evaluator class, providing the ability to parse and evaluate arithmetic expressions, manage variables, register functions, and work with units. This is particularly useful for reading parameters from configuration files, implementing macro commands, and performing runtime calculations based on string expressions.

**Source Location**: `/source/global/management/include/G4Evaluator.hh`

**Implementation**: CLHEP Evaluator (`CLHEP/Evaluator/Evaluator.h`)

**Author**: Evgeni Chernyaev (CLHEP implementation)

## Class Definition

```cpp
using G4Evaluator = HepTool::Evaluator;
```

G4Evaluator provides access to all HepTool::Evaluator functionality.

## Key Features

- **Expression Evaluation**: Parse and evaluate mathematical expressions
- **Variables**: Define and use named variables in expressions
- **Functions**: Register custom functions (0-5 parameters)
- **Operators**: Arithmetic (+, -, *, /, ^, **) and logical (==, !=, <, <=, >, >=, &&, ||)
- **Standard Math**: Built-in mathematical functions (sin, cos, exp, etc.)
- **Unit System**: Support for Geant4 units in expressions
- **Error Handling**: Detailed error reporting with position information

## Status Codes

```cpp
enum {
    OK,                         // Everything OK
    WARNING_EXISTING_VARIABLE,  // Redefinition of existing variable
    WARNING_EXISTING_FUNCTION,  // Redefinition of existing function
    WARNING_BLANK_STRING,       // Empty input string
    ERROR_NOT_A_NAME,           // Invalid symbol in name
    ERROR_SYNTAX_ERROR,         // Syntax error
    ERROR_UNPAIRED_PARENTHESIS, // Unpaired parenthesis
    ERROR_UNEXPECTED_SYMBOL,    // Unexpected symbol
    ERROR_UNKNOWN_VARIABLE,     // Non-existing variable
    ERROR_UNKNOWN_FUNCTION,     // Non-existing function
    ERROR_EMPTY_PARAMETER,      // Function call has empty parameter
    ERROR_CALCULATION_ERROR     // Error during calculation
};
```

## Public Methods

### Constructor and Destructor

```cpp
G4Evaluator();
~G4Evaluator();
```

### Expression Evaluation

```cpp
double evaluate(const char* expression);
```

**Parameters**:
- `expression` - Mathematical expression to evaluate

**Returns**: Result of the evaluation

**Description**: Evaluates an arithmetic expression. Supports numbers, variables, functions, and operators.

### Status and Error Handling

```cpp
int status() const;
```
Returns status of the last operation.

```cpp
int error_position() const;
```
Returns position in the input string where the error occurred.

```cpp
void print_error() const;
```
Prints error message to stderr if status indicates an error.

```cpp
std::string error_name() const;
```
Returns a string describing the error.

### Variable Management

```cpp
void setVariable(const char* name, double value);
```
Defines a variable with a numeric value.

```cpp
void setVariable(const char* name, const char* expression);
```
Defines a variable using an expression.

```cpp
bool findVariable(const char* name) const;
```
Checks if a variable exists.

```cpp
void removeVariable(const char* name);
```
Removes a variable from the dictionary.

### Function Registration

```cpp
void setFunction(const char* name, double (*fun)());
void setFunction(const char* name, double (*fun)(double));
void setFunction(const char* name, double (*fun)(double, double));
void setFunction(const char* name, double (*fun)(double, double, double));
void setFunction(const char* name, double (*fun)(double, double, double, double));
void setFunction(const char* name, double (*fun)(double, double, double, double, double));
```

Register functions with 0 to 5 parameters.

```cpp
bool findFunction(const char* name, int npar) const;
```
Checks if a function with specified number of parameters exists.

```cpp
void removeFunction(const char* name, int npar);
```
Removes a function from the dictionary.

### Initialization

```cpp
void clear();
```
Clears all variables and functions.

```cpp
void setStdMath();
```
Sets standard mathematical functions and constants (pi, e, sin, cos, etc.).

```cpp
void setSystemOfUnits(double meter = 1.0, double kilogram = 1.0,
                      double second = 1.0, double ampere = 1.0,
                      double kelvin = 1.0, double mole = 1.0,
                      double candela = 1.0);
```
Sets the system of units. For Geant4, call with appropriate parameters.

## Usage Examples

### Basic Expression Evaluation

```cpp
#include "G4Evaluator.hh"

G4Evaluator eval;
eval.setStdMath();  // Enable standard math functions

// Simple arithmetic
double result = eval.evaluate("2 + 3 * 4");
G4cout << "Result: " << result << G4endl;  // Output: 14

// Check status
if (eval.status() != G4Evaluator::OK) {
    eval.print_error();
}
```

### Using Variables

```cpp
G4Evaluator eval;
eval.setStdMath();

// Define variables
eval.setVariable("length", 100.0);
eval.setVariable("width", 50.0);
eval.setVariable("height", 30.0);

// Use in expressions
double volume = eval.evaluate("length * width * height");
G4cout << "Volume: " << volume << G4endl;  // Output: 150000

// Variables can reference other variables
eval.setVariable("area", "length * width");
double area = eval.evaluate("area");
G4cout << "Area: " << area << G4endl;  // Output: 5000
```

### Working with Geant4 Units

```cpp
#include "G4Evaluator.hh"
#include "G4SystemOfUnits.hh"

G4Evaluator eval;
eval.setStdMath();

// Set Geant4 system of units
eval.setSystemOfUnits(1.e+3, 1./1.60217733e-25, 1.e+9, 1./1.60217733e-10,
                      1.0, 1.0, 1.0);

// Now can use units in expressions
eval.setVariable("mm", 1.0);
eval.setVariable("cm", 10.0);
eval.setVariable("m", 1000.0);
eval.setVariable("MeV", 1.0);
eval.setVariable("GeV", 1000.0);

double distance = eval.evaluate("5 * cm");  // 50 mm (internal units)
double energy = eval.evaluate("2 * GeV");   // 2000 MeV (internal units)

G4cout << "Distance: " << distance << " mm" << G4endl;
G4cout << "Energy: " << energy << " MeV" << G4endl;
```

### Mathematical Functions

```cpp
G4Evaluator eval;
eval.setStdMath();  // Enables: sin, cos, tan, exp, log, sqrt, etc.

// Trigonometric functions
eval.setVariable("degree", 3.14159265358979323846/180.0);
double result = eval.evaluate("sin(30*degree)");
G4cout << "sin(30°): " << result << G4endl;  // Output: 0.5

// Other math functions
double expResult = eval.evaluate("exp(2)");      // e^2
double logResult = eval.evaluate("log(100)");    // ln(100)
double sqrtResult = eval.evaluate("sqrt(16)");   // 4
double powResult = eval.evaluate("2^10");        // 1024
```

### Custom Functions

```cpp
// Define custom functions
double square(double x) {
    return x * x;
}

double distance2D(double x, double y) {
    return std::sqrt(x*x + y*y);
}

double volume(double l, double w, double h) {
    return l * w * h;
}

// Register with evaluator
G4Evaluator eval;
eval.setStdMath();

eval.setFunction("square", square);
eval.setFunction("dist2D", distance2D);
eval.setFunction("volume", volume);

// Use in expressions
double result1 = eval.evaluate("square(5)");           // 25
double result2 = eval.evaluate("dist2D(3, 4)");        // 5
double result3 = eval.evaluate("volume(2, 3, 4)");     // 24

G4cout << "square(5): " << result1 << G4endl;
G4cout << "dist2D(3,4): " << result2 << G4endl;
G4cout << "volume(2,3,4): " << result3 << G4endl;
```

### Logical Expressions

```cpp
G4Evaluator eval;

eval.setVariable("x", 10.0);
eval.setVariable("y", 20.0);

// Comparison operators
double result1 = eval.evaluate("x < y");      // 1 (true)
double result2 = eval.evaluate("x == 10");    // 1 (true)
double result3 = eval.evaluate("x != y");     // 1 (true)

// Logical operators
double result4 = eval.evaluate("(x < 15) && (y > 15)");  // 1 (true)
double result5 = eval.evaluate("(x > 15) || (y > 15)");  // 1 (true)

// Use in conditional logic
if (eval.evaluate("x < y") != 0) {
    G4cout << "x is less than y" << G4endl;
}
```

### Reading Configuration Files

```cpp
void ReadConfigFile(const G4String& filename, G4Evaluator& eval) {
    std::ifstream file(filename);
    G4String line;

    eval.setStdMath();

    while (std::getline(file, line)) {
        // Skip comments and empty lines
        if (line.empty() || line[0] == '#') continue;

        // Parse "name = expression" format
        size_t equalPos = line.find('=');
        if (equalPos != std::string::npos) {
            G4String name = line.substr(0, equalPos);
            G4String expr = line.substr(equalPos + 1);

            // Trim whitespace
            name.erase(0, name.find_first_not_of(" \t"));
            name.erase(name.find_last_not_of(" \t") + 1);
            expr.erase(0, expr.find_first_not_of(" \t"));
            expr.erase(expr.find_last_not_of(" \t") + 1);

            // Set variable
            eval.setVariable(name.c_str(), expr.c_str());

            if (eval.status() != G4Evaluator::OK) {
                G4cerr << "Error in line: " << line << G4endl;
                eval.print_error();
            }
        }
    }
}

// config.txt:
// # Detector parameters
// detector_length = 100
// detector_width = 50
// detector_height = 30
// detector_volume = detector_length * detector_width * detector_height

// Usage:
G4Evaluator eval;
ReadConfigFile("config.txt", eval);
double volume = eval.evaluate("detector_volume");
```

### Parameter Validation

```cpp
class DetectorParameterValidator {
private:
    G4Evaluator fEval;

public:
    DetectorParameterValidator() {
        fEval.setStdMath();
    }

    bool ValidateParameters(const std::map<G4String, G4String>& params) {
        // Set all parameters as variables
        for (const auto& pair : params) {
            fEval.setVariable(pair.first.c_str(), pair.second.c_str());

            if (fEval.status() != G4Evaluator::OK) {
                G4cerr << "Invalid parameter: " << pair.first << G4endl;
                fEval.print_error();
                return false;
            }
        }

        // Validate constraints
        if (fEval.evaluate("length > 0") == 0) {
            G4cerr << "Length must be positive" << G4endl;
            return false;
        }

        if (fEval.evaluate("width > 0 && width <= length") == 0) {
            G4cerr << "Width must be positive and <= length" << G4endl;
            return false;
        }

        return true;
    }
};
```

### Error Handling

```cpp
void SafeEvaluate(G4Evaluator& eval, const char* expression) {
    double result = eval.evaluate(expression);

    if (eval.status() != G4Evaluator::OK) {
        G4cerr << "Error evaluating: " << expression << G4endl;
        G4cerr << "Error at position: " << eval.error_position() << G4endl;
        G4cerr << "Error type: " << eval.error_name() << G4endl;
        eval.print_error();
    } else {
        G4cout << expression << " = " << result << G4endl;
    }
}

// Usage
G4Evaluator eval;
eval.setStdMath();

SafeEvaluate(eval, "2 + 3");              // OK
SafeEvaluate(eval, "sin(30)");            // OK
SafeEvaluate(eval, "unknown_var + 5");    // ERROR: Unknown variable
SafeEvaluate(eval, "2 + + 3");            // ERROR: Syntax error
SafeEvaluate(eval, "2 + (3 * 4");         // ERROR: Unpaired parenthesis
```

### Messenger Integration

```cpp
class MyDetectorMessenger : public G4UImessenger {
private:
    MyDetector* fDetector;
    G4Evaluator fEval;

public:
    MyDetectorMessenger(MyDetector* det) : fDetector(det) {
        fEval.setStdMath();

        // Set up Geant4 units
        fEval.setVariable("mm", 1.0);
        fEval.setVariable("cm", 10.0);
        fEval.setVariable("m", 1000.0);
        fEval.setVariable("MeV", 1.0);

        // Create command
        fLengthCmd = new G4UIcmdWithAString("/mydet/setLength", this);
        fLengthCmd->SetGuidance("Set detector length (can use expressions)");
        fLengthCmd->SetParameterName("length", false);
    }

    void SetNewValue(G4UIcommand* command, G4String newValue) {
        if (command == fLengthCmd) {
            double length = fEval.evaluate(newValue.c_str());

            if (fEval.status() == G4Evaluator::OK) {
                fDetector->SetLength(length);
            } else {
                G4cerr << "Invalid expression: " << newValue << G4endl;
                fEval.print_error();
            }
        }
    }
};

// Can now use: /mydet/setLength 10*cm
// Or: /mydet/setLength 2*detector_radius + 5*mm
```

### Dynamic Geometry Parameters

```cpp
class ParametricDetector {
private:
    G4Evaluator fEval;
    std::map<G4String, G4String> fExpressions;

public:
    ParametricDetector() {
        fEval.setStdMath();
        SetupUnits();
        SetupDefaultParameters();
    }

    void SetupUnits() {
        fEval.setVariable("mm", 1.0);
        fEval.setVariable("cm", 10.0);
        fEval.setVariable("deg", 3.14159265358979323846/180.0);
    }

    void SetupDefaultParameters() {
        DefineParameter("radius", "10*cm");
        DefineParameter("height", "2*radius");
        DefineParameter("thickness", "0.1*radius");
        DefineParameter("segments", "8");
        DefineParameter("angle", "360*deg/segments");
    }

    void DefineParameter(const G4String& name, const G4String& expr) {
        fExpressions[name] = expr;
        fEval.setVariable(name.c_str(), expr.c_str());
    }

    G4double GetParameter(const G4String& name) {
        return fEval.evaluate(name.c_str());
    }

    void UpdateParameter(const G4String& name, const G4String& newExpr) {
        DefineParameter(name, newExpr);

        // Re-evaluate all dependent parameters
        for (const auto& pair : fExpressions) {
            fEval.setVariable(pair.first.c_str(), pair.second.c_str());
        }
    }
};
```

## Best Practices

### 1. Initialize with Standard Math

```cpp
// GOOD: Enable standard functions
G4Evaluator eval;
eval.setStdMath();
// Now can use sin, cos, exp, log, etc.

// AVOID: Forgetting to initialize
G4Evaluator eval;
eval.evaluate("sin(30)");  // ERROR: Unknown function
```

### 2. Always Check Status

```cpp
// GOOD: Check for errors
double result = eval.evaluate(expression);
if (eval.status() != G4Evaluator::OK) {
    eval.print_error();
    // Handle error
}

// AVOID: Ignoring errors
double result = eval.evaluate(expression);
// Result may be undefined if error occurred
```

### 3. Use Variables for Clarity

```cpp
// GOOD: Readable with variables
eval.setVariable("detector_radius", 10.0);
eval.setVariable("detector_length", 50.0);
double volume = eval.evaluate("pi * detector_radius^2 * detector_length");

// AVOID: Magic numbers
double volume = eval.evaluate("3.14159 * 10^2 * 50");
```

### 4. Set Up Units Once

```cpp
// Create helper function
void SetupGeant4Units(G4Evaluator& eval) {
    eval.setVariable("mm", 1.0);
    eval.setVariable("cm", 10.0);
    eval.setVariable("m", 1000.0);
    eval.setVariable("MeV", 1.0);
    eval.setVariable("GeV", 1000.0);
    eval.setVariable("deg", CLHEP::degree);
    eval.setVariable("rad", CLHEP::radian);
}

// Use in code
G4Evaluator eval;
eval.setStdMath();
SetupGeant4Units(eval);
```

### 5. Validate Input Expressions

```cpp
double EvaluateWithValidation(G4Evaluator& eval, const G4String& expr,
                               double minValue, double maxValue) {
    double result = eval.evaluate(expr.c_str());

    if (eval.status() != G4Evaluator::OK) {
        G4Exception("EvaluateWithValidation", "InvalidExpression",
                    FatalException, expr.c_str());
    }

    if (result < minValue || result > maxValue) {
        G4Exception("EvaluateWithValidation", "OutOfRange",
                    FatalException, "Result out of valid range");
    }

    return result;
}
```

## Common Pitfalls

### 1. Forgetting setStdMath()

```cpp
// WRONG: Standard functions not available
G4Evaluator eval;
eval.evaluate("sin(30)");  // ERROR: Unknown function 'sin'

// CORRECT: Initialize standard math
G4Evaluator eval;
eval.setStdMath();
eval.evaluate("sin(30)");  // OK
```

### 2. Variable Name Conflicts

```cpp
// CAREFUL: Variables can shadow each other
eval.setVariable("x", 10.0);
eval.setVariable("x", 20.0);  // WARNING: Redefining 'x'
// Now x = 20
```

### 3. Expression Syntax Errors

```cpp
// Common syntax errors:
eval.evaluate("2 * * 3");      // ERROR: Double operator
eval.evaluate("(2 + 3");       // ERROR: Unpaired parenthesis
eval.evaluate("2 3");          // ERROR: Missing operator
eval.evaluate("func(,3)");     // ERROR: Empty parameter
```

### 4. Not Handling All Error Types

```cpp
// INCOMPLETE: Only checks for errors
if (eval.status() != G4Evaluator::OK) {
    // Handle error
}

// BETTER: Distinguish warnings from errors
int status = eval.status();
if (status >= G4Evaluator::ERROR_NOT_A_NAME) {
    // Fatal error
    eval.print_error();
    throw std::runtime_error("Evaluation failed");
} else if (status != G4Evaluator::OK) {
    // Warning (e.g., variable redefinition)
    G4cout << "Warning: " << eval.error_name() << G4endl;
}
```

## Thread Safety

**Thread-Safe**: Each thread should have its own G4Evaluator instance

**Considerations**:
- G4Evaluator maintains internal state (variables, functions)
- Not safe to share instance between threads
- Create separate evaluator for each thread

**Safe Usage**:
```cpp
// Each thread creates its own evaluator
void ThreadFunction() {
    G4Evaluator localEval;  // Thread-local
    localEval.setStdMath();

    double result = localEval.evaluate("sin(30)");
    // Safe - no sharing between threads
}
```

**Unsafe Usage**:
```cpp
// WRONG: Sharing evaluator between threads
static G4Evaluator sharedEval;  // Dangerous!

void ThreadFunction1() {
    sharedEval.setVariable("x", 10);  // Race condition!
}

void ThreadFunction2() {
    double x = sharedEval.evaluate("x");  // May get wrong value!
}
```

## Performance Considerations

### 1. Pre-compute Constant Expressions

```cpp
// INEFFICIENT: Re-evaluating in loop
for (int i = 0; i < 1000000; ++i) {
    double radius = eval.evaluate("detector_radius * 2");
    ProcessData(radius);
}

// EFFICIENT: Evaluate once
double radius = eval.evaluate("detector_radius * 2");
for (int i = 0; i < 1000000; ++i) {
    ProcessData(radius);
}
```

### 2. Cache Variable Values

```cpp
// Set variables once
eval.setVariable("pi", 3.14159265358979323846);
eval.setVariable("radius", 10.0);

// Reuse for multiple evaluations
double area = eval.evaluate("pi * radius^2");
double circumference = eval.evaluate("2 * pi * radius");
```

## Related Classes

- **G4UIcommand**: Can use G4Evaluator for parameter parsing
- **G4GDMLEvaluator**: Extended evaluator for GDML file parsing
- **G4tgrEvaluator**: Text geometry evaluator (derived from G4Evaluator)

## See Also

- [CLHEP Evaluator Documentation](https://proj-clhep.web.cern.ch/proj-clhep/manual/UserGuide/Evaluator/evaluator.html)
- [G4UIcommand Documentation](G4UIcommand.md)
- [Geant4 GDML Documentation](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/Detector/Geometry/geomGDML.html)
