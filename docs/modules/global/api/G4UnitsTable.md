# G4UnitsTable

## Overview

The G4UnitsTable system provides comprehensive unit conversion utilities for Geant4 simulations. It consists of four classes that work together to manage units, convert between them, and automatically format physical quantities with appropriate units for output. The system organizes units by category (Length, Time, Energy, etc.) and provides automatic conversion to the most appropriate unit for display.

**Source Location**: `/source/global/management/include/G4UnitsTable.hh`

**Author**: M. Maire (1998), G. Cosmo (2001 STL migration)

## Key Classes

### G4UnitDefinition

Defines individual units with their name, symbol, value, and category.

#### Constructor

```cpp
G4UnitDefinition(const G4String& name,
                 const G4String& symbol,
                 const G4String& category,
                 G4double value);
```

**Parameters**:
- `name` - Full name of the unit (e.g., "millimeter")
- `symbol` - Short symbol (e.g., "mm")
- `category` - Dimensional category (e.g., "Length")
- `value` - Conversion factor to internal units

#### Public Methods

**Accessors**:
```cpp
const G4String& GetName() const;
const G4String& GetSymbol() const;
G4double GetValue() const;
```

**Printing**:
```cpp
void PrintDefinition();
```
Prints the unit definition to output.

#### Static Methods

**Table Management**:
```cpp
static void BuildUnitsTable();
static void PrintUnitsTable();
static void ClearUnitsTable();
static G4UnitsTable& GetUnitsTable();
```

**Unit Queries**:
```cpp
static G4bool IsUnitDefined(const G4String& name);
static G4double GetValueOf(const G4String& name);
static G4String GetCategory(const G4String& name);
```

**Multithreading Support** (when `G4MULTITHREADED` is defined):
```cpp
static G4UnitsTable& GetUnitsTableShadow();
```

### G4UnitsCategory

Groups related units by dimensional category (e.g., all length units together).

#### Constructor

```cpp
explicit G4UnitsCategory(const G4String& name);
```

**Parameters**:
- `name` - Category name (e.g., "Length", "Energy", "Time")

#### Public Methods

**Accessors**:
```cpp
const G4String& GetName() const;
G4UnitsContainer& GetUnitsList();
G4int GetNameMxLen() const;  // Maximum name length in this category
G4int GetSymbMxLen() const;  // Maximum symbol length in this category
```

**Name Length Management**:
```cpp
void UpdateNameMxLen(G4int len);
void UpdateSymbMxLen(G4int len);
```
Updates maximum lengths for formatting alignment.

**Printing**:
```cpp
void PrintCategory();
```
Prints all units in this category.

### G4UnitsTable

Container for all unit categories. Implementation varies based on multithreading.

#### Multithreaded Version

```cpp
class G4UnitsTable : public std::vector<G4UnitsCategory*>
{
public:
    G4UnitsTable() = default;
    ~G4UnitsTable();

    void Synchronize();
    G4bool Contains(const G4UnitDefinition*, const G4String&);
};
```

#### Single-threaded Version

```cpp
using G4UnitsTable = std::vector<G4UnitsCategory*>;
```

### G4BestUnit

Automatically converts physical quantities to the most appropriate unit for display.

#### Constructors

```cpp
G4BestUnit(G4double internalValue, const G4String& category);
G4BestUnit(const G4ThreeVector& internalValue, const G4String& category);
```

**Parameters**:
- `internalValue` - Value in Geant4 internal units (scalar or vector)
- `category` - Unit category (e.g., "Length", "Energy", "Time")

#### Public Methods

**Accessors**:
```cpp
G4double* GetValue();
const G4String& GetCategory() const;
std::size_t GetIndexOfCategory() const;
```

**Conversion**:
```cpp
operator G4String() const;
```
Converts to formatted string with best unit.

**Output**:
```cpp
friend std::ostream& operator<<(std::ostream&, const G4BestUnit& VU);
```

## Usage Examples

### Defining Custom Units

```cpp
// Define a new unit: foot = 304.8 mm
G4UnitDefinition("foot", "ft", "Length", 304.8*mm);

// Define energy unit: erg = 1e-7 joule
G4UnitDefinition("erg", "erg", "Energy", 1.e-7*joule);
```

### Building the Units Table

```cpp
// Initialize the standard units table
G4UnitDefinition::BuildUnitsTable();

// Print all defined units
G4UnitDefinition::PrintUnitsTable();
```

### Using G4BestUnit for Output

```cpp
// Automatic unit selection for scalar values
G4double distance = 1234.5*mm;  // Internal value in mm
G4cout << "Distance: " << G4BestUnit(distance, "Length") << G4endl;
// Output: "Distance: 1.2345 m" (automatically chose meters)

// Automatic unit selection for vectors
G4ThreeVector position(10*cm, 20*cm, 30*cm);
G4cout << "Position: " << G4BestUnit(position, "Length") << G4endl;
// Output: "Position: (100 200 300) mm"

// Energy example
G4double energy = 0.511*MeV;
G4cout << "Energy: " << G4BestUnit(energy, "Energy") << G4endl;
// Output: "Energy: 511 keV"

// Time example
G4double time = 1.5e-9*second;
G4cout << "Time: " << G4BestUnit(time, "Time") << G4endl;
// Output: "Time: 1.5 ns"
```

### Querying Units

```cpp
// Check if a unit is defined
if (G4UnitDefinition::IsUnitDefined("meter")) {
    G4cout << "Meter is defined" << G4endl;
}

// Get conversion value
G4double meterValue = G4UnitDefinition::GetValueOf("m");
G4double cmToMm = G4UnitDefinition::GetValueOf("cm") /
                   G4UnitDefinition::GetValueOf("mm");  // = 10

// Get category of a unit
G4String category = G4UnitDefinition::GetCategory("joule");
// Returns: "Energy"
```

### Custom Unit Categories

```cpp
// Create a custom category for dose
G4UnitsCategory* doseCategory = new G4UnitsCategory("Dose");

// Add units to the category
G4UnitDefinition("gray", "Gy", "Dose", 1.0*gray);
G4UnitDefinition("milligray", "mGy", "Dose", 0.001*gray);
G4UnitDefinition("rad", "rad", "Dose", 0.01*gray);

// Use with G4BestUnit
G4double dose = 2.5*gray;
G4cout << "Dose: " << G4BestUnit(dose, "Dose") << G4endl;
```

### Working with Different Unit Systems

```cpp
// Convert from one unit to another
G4double lengthInCm = 150.0;  // 150 cm
G4double lengthInMm = lengthInCm * cm;  // Convert to internal units (mm)
G4double lengthInMeters = lengthInMm / m;  // Convert to meters
// lengthInMeters = 1.5

// Energy conversion
G4double energyInGeV = 2.0;
G4double energyInMeV = energyInGeV * GeV / MeV;  // = 2000
```

### Standard Unit Categories

The following standard categories are available:
- **Length**: meter (m), centimeter (cm), millimeter (mm), micrometer (um), nanometer (nm), etc.
- **Time**: second (s), millisecond (ms), microsecond (us), nanosecond (ns), picosecond (ps)
- **Energy**: joule (J), MeV, keV, GeV, TeV, eV
- **Angle**: radian (rad), degree (deg), milliradian (mrad)
- **Mass**: kilogram (kg), gram (g), milligram (mg)
- **Temperature**: kelvin (K)
- **Amount of substance**: mole (mol)
- **Electric charge**: coulomb (C), eplus (positron charge)
- **Luminous intensity**: candela (cd)

## Best Practices

### 1. Always Use G4BestUnit for Output

```cpp
// GOOD: Automatic unit selection
G4cout << "Energy: " << G4BestUnit(energy, "Energy") << G4endl;

// AVOID: Manual unit selection (less readable)
G4cout << "Energy: " << energy/MeV << " MeV" << G4endl;
```

### 2. Define Custom Units at Initialization

```cpp
void MyDetectorConstruction::ConstructMaterials() {
    // Define specialized units once at startup
    if (!G4UnitDefinition::IsUnitDefined("barn")) {
        G4UnitDefinition("barn", "b", "Area", 1.e-28*m2);
    }
}
```

### 3. Use Internal Units in Calculations

```cpp
// All internal calculations use Geant4 base units
G4double trackLength = 10.0*cm;  // Store in internal units (mm)
G4double velocity = 0.5*c_light; // Use physics constants

// Only convert for output
G4cout << "Track length: " << G4BestUnit(trackLength, "Length") << G4endl;
```

### 4. Consistent Unit Categories

```cpp
// Use consistent categories for related quantities
G4BestUnit(position.mag(), "Length");     // Not "Distance"
G4BestUnit(momentum.mag(), "Energy");      // MeV/c in Geant4
G4BestUnit(kineticEnergy, "Energy");       // Same category
```

### 5. Handle Unit Table Cleanup

```cpp
// In your main() or cleanup code
G4UnitDefinition::ClearUnitsTable();  // Clean up at end
```

## Thread Safety

### Multithreaded Mode (`G4MULTITHREADED` defined)

**Thread-Local Storage**:
- Each thread has its own `G4UnitsTable` (thread-local)
- Shadow table shared across threads for synchronization
- Use `Synchronize()` to update from shadow table

**Thread-Safe Operations**:
```cpp
// Each thread can safely access its local table
G4UnitsTable& localTable = G4UnitDefinition::GetUnitsTable();

// Synchronize with master thread
#ifdef G4MULTITHREADED
localTable.Synchronize();
#endif
```

**Best Practices**:
1. **Initialize Once**: Build the units table in the master thread before spawning workers
2. **No Dynamic Units**: Avoid adding units during multithreaded execution
3. **Synchronization**: Call `Synchronize()` if master thread modifies units

```cpp
// In master thread (initialization)
void MyRunManager::Initialize() {
    G4UnitDefinition::BuildUnitsTable();
    // Add any custom units here
}

// In worker threads
void MyWorkerRunManager::Initialize() {
#ifdef G4MULTITHREADED
    G4UnitsTable& table = G4UnitDefinition::GetUnitsTable();
    table.Synchronize();  // Get units from master
#endif
}
```

### Single-Threaded Mode

**Simple Access**:
- Direct access to single global units table
- No synchronization needed
- All operations are inherently thread-safe (no threads)

```cpp
// Simple access in single-threaded mode
G4UnitsTable& table = G4UnitDefinition::GetUnitsTable();
```

### Read Operations (Thread-Safe)

These operations are safe in both modes:
```cpp
// Safe to call from any thread
G4UnitDefinition::IsUnitDefined("meter");
G4UnitDefinition::GetValueOf("cm");
G4UnitDefinition::GetCategory("joule");
G4BestUnit(value, "Energy");  // Read-only formatting
```

### Write Operations (Requires Care)

```cpp
// Only safe during initialization (before threading)
G4UnitDefinition* newUnit = new G4UnitDefinition(...);  // Master thread only

// Not thread-safe during execution
G4UnitDefinition::ClearUnitsTable();  // Call only at cleanup
```

## Common Pitfalls

### 1. Unit Confusion

```cpp
// WRONG: Mixing unit systems
G4double length = 5.0;  // What units?
ProcessLength(length);

// CORRECT: Always specify units
G4double length = 5.0*cm;  // Clear units
ProcessLength(length);
```

### 2. Category Mismatch

```cpp
// WRONG: Using wrong category
G4BestUnit(energy, "Length");  // Energy shown as length!

// CORRECT: Match quantity to category
G4BestUnit(energy, "Energy");
```

### 3. Memory Management

```cpp
// CAREFUL: G4UnitDefinition is managed by table
new G4UnitDefinition("myunit", "mu", "Length", 1.0*m);
// Don't delete this pointer - table owns it

// Cleanup is automatic or via ClearUnitsTable()
```

### 4. Redefining Units

```cpp
// Check before defining
if (!G4UnitDefinition::IsUnitDefined("angstrom")) {
    new G4UnitDefinition("angstrom", "Ang", "Length", 0.1*nm);
}
// Redefining triggers WARNING_EXISTING_VARIABLE
```

## Advanced Features

### Custom Unit Formatting

```cpp
class MyBestUnit : public G4BestUnit {
public:
    MyBestUnit(G4double value, const G4String& category)
        : G4BestUnit(value, category) {}

    // Custom string conversion with more precision
    operator G4String() const {
        std::ostringstream oss;
        oss << std::setprecision(10) << GetValue()[0]
            << " " << /* unit symbol */;
        return oss.str();
    }
};
```

### Programmatic Unit Discovery

```cpp
// Iterate through all categories
G4UnitsTable& table = G4UnitDefinition::GetUnitsTable();
for (auto* category : table) {
    G4cout << "Category: " << category->GetName() << G4endl;

    G4UnitsContainer& units = category->GetUnitsList();
    for (auto* unit : units) {
        G4cout << "  " << unit->GetName()
               << " (" << unit->GetSymbol() << ") = "
               << unit->GetValue() << G4endl;
    }
}
```

### Unit Value Comparison

```cpp
// Compare units programmatically
G4double cmValue = G4UnitDefinition::GetValueOf("cm");
G4double mmValue = G4UnitDefinition::GetValueOf("mm");
G4double ratio = cmValue / mmValue;  // = 10
```

## Related Classes

- **G4SystemOfUnits** (`globals.hh`): Defines base unit constants
- **G4PhysicalConstants** (`G4PhysicalConstants.hh`): Physical constants
- **G4Evaluator**: Can use units in expression evaluation
- **G4UnitsMessenger**: UI commands for unit management

## See Also

- [G4SystemOfUnits Documentation](G4SystemOfUnits.md)
- [G4PhysicalConstants Documentation](G4PhysicalConstants.md)
- [Geant4 User Guide: Units](https://geant4-userdoc.web.cern.ch/UsersGuides/ForApplicationDeveloper/html/Appendix/unitsAndConstants.html)
