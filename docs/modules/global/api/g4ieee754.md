# G4IEEE754

## Overview

G4IEEE754 provides low-level utilities for manipulating IEEE 754 floating-point representations through type-punning and bit operations. This namespace enables high-performance mathematical operations by directly accessing and modifying the binary representation of floating-point numbers, a technique used extensively in optimized implementations of transcendental functions.

**Source Location:**
- Header: `/source/global/management/include/G4IEEE754.hh` (header-only implementation)

## Key Features

- **Type-safe bit manipulation** via union-based type punning
- **Zero-overhead conversions** between float/double and integer representations
- **Standard-compliant** IEEE 754 binary64 (double) and binary32 (float) support
- **Cross-platform compatibility** (relies on IEEE 754 standard)
- **Thread-safe** (all functions are stateless and const)
- **Header-only** implementation for maximum inlining

## IEEE 754 Background

### Binary64 (Double Precision) Format

A 64-bit double is represented as:

```
|-------|-----------|---------------------------------------------------|
| Sign  | Exponent  |                   Mantissa                       |
| 1 bit | 11 bits   |                   52 bits                        |
|-------|-----------|---------------------------------------------------|
  63      62-52                           51-0

Value = (-1)^sign × 2^(exponent - 1023) × (1 + mantissa/2^52)
```

**Components:**
- **Sign bit (1 bit):** 0 = positive, 1 = negative
- **Exponent (11 bits):** Biased by 1023 (range: -1023 to +1024)
- **Mantissa (52 bits):** Fractional part with implicit leading 1

**Special Values:**
- **Zero:** exponent = 0, mantissa = 0
- **Denormalized:** exponent = 0, mantissa ≠ 0
- **Infinity:** exponent = 2047, mantissa = 0
- **NaN:** exponent = 2047, mantissa ≠ 0

### Binary32 (Single Precision) Format

A 32-bit float is represented as:

```
|-------|-----------|--------------------------|
| Sign  | Exponent  |        Mantissa          |
| 1 bit | 8 bits    |        23 bits           |
|-------|-----------|--------------------------|
  31      30-23              22-0

Value = (-1)^sign × 2^(exponent - 127) × (1 + mantissa/2^23)
```

**Components:**
- **Sign bit (1 bit):** 0 = positive, 1 = negative
- **Exponent (8 bits):** Biased by 127 (range: -127 to +128)
- **Mantissa (23 bits):** Fractional part with implicit leading 1

## Union Type: ieee754

### Definition

```cpp
union ieee754 {
    ieee754() = default;
    ieee754(G4double thed) { d = thed; }
    ieee754(uint64_t thell) { ll = thell; }
    ieee754(G4float thef) { f[0] = thef; }
    ieee754(uint32_t thei) { i[0] = thei; }

    G4double d;      // 64-bit double
    G4float f[2];    // Two 32-bit floats
    uint32_t i[2];   // Two 32-bit unsigned integers
    uint64_t ll;     // 64-bit unsigned integer
    uint16_t s[4];   // Four 16-bit unsigned integers
};
```

### Purpose

The `ieee754` union enables **type punning** - interpreting the same memory as different types. This allows:

1. **Accessing bit patterns** of floating-point numbers
2. **Direct manipulation** of exponent and mantissa
3. **Fast construction** of specific floating-point values
4. **Extraction** of sign, exponent, mantissa separately

### Members

| Member | Type | Size | Purpose |
|--------|------|------|---------|
| `d` | G4double | 64 bits | Double precision floating-point |
| `f[2]` | G4float[2] | 2 × 32 bits | Two single precision floats |
| `i[2]` | uint32_t[2] | 2 × 32 bits | Two 32-bit unsigned integers |
| `ll` | uint64_t | 64 bits | 64-bit unsigned integer |
| `s[4]` | uint16_t[4] | 4 × 16 bits | Four 16-bit unsigned integers |

### Constructors

```cpp
ieee754()                    // Default constructor
ieee754(G4double thed)       // Construct from double
ieee754(uint64_t thell)      // Construct from 64-bit uint
ieee754(G4float thef)        // Construct from float
ieee754(uint32_t thei)       // Construct from 32-bit uint
```

**Usage Example:**
```cpp
G4IEEE754::ieee754 x(3.14159);  // Initialize with double
uint64_t bits = x.ll;            // Access as 64-bit integer

G4IEEE754::ieee754 y(0x3FF0000000000000ULL);  // 1.0 in binary
G4double value = y.d;            // Access as double
```

## Function Reference

### Double to Uint64 Conversion

```cpp
inline uint64_t dp2uint64(G4double x)
```

Converts a double to its 64-bit unsigned integer representation.

**Parameters:**
- `x`: Double precision floating-point value

**Returns:**
- 64-bit unsigned integer with identical bit pattern

**Bit Layout:**
```
uint64_t result:
  Bit 63:    Sign bit
  Bits 62-52: Exponent (11 bits)
  Bits 51-0:  Mantissa (52 bits)
```

**Usage:**
```cpp
G4double pi = 3.141592653589793;
uint64_t pi_bits = G4IEEE754::dp2uint64(pi);
// pi_bits = 0x400921FB54442D18

// Extract exponent
uint64_t exponent_bits = (pi_bits >> 52) & 0x7FF;
int exponent = (int)exponent_bits - 1023;  // Unbiased: 1

// Extract mantissa
uint64_t mantissa_bits = pi_bits & 0xFFFFFFFFFFFFFULL;
```

**Applications:**
- Fast exponent extraction
- Mantissa manipulation
- Sign bit testing
- Bit-level floating-point comparisons

### Uint64 to Double Conversion

```cpp
inline G4double uint642dp(uint64_t ll)
```

Converts a 64-bit unsigned integer to its double representation.

**Parameters:**
- `ll`: 64-bit unsigned integer representing IEEE 754 binary64

**Returns:**
- Double precision floating-point value with identical bit pattern

**Usage:**
```cpp
// Construct 2.0: sign=0, exp=1024 (biased), mantissa=0
uint64_t two_bits = ((uint64_t)1024) << 52;  // 0x4000000000000000
G4double two = G4IEEE754::uint642dp(two_bits);  // 2.0

// Construct infinity
uint64_t inf_bits = 0x7FF0000000000000ULL;
G4double inf = G4IEEE754::uint642dp(inf_bits);  // +infinity

// Construct NaN
uint64_t nan_bits = 0x7FF8000000000000ULL;
G4double nan = G4IEEE754::uint642dp(nan_bits);  // NaN
```

**Applications:**
- Fast power-of-2 construction (as used in G4Exp)
- Creating special values (infinity, NaN)
- Mantissa reconstruction after manipulation
- Bit-level floating-point synthesis

### Uint32 to Float Conversion

```cpp
inline G4float uint322sp(G4int x)
```

Converts a 32-bit integer to its single-precision float representation.

**Parameters:**
- `x`: 32-bit integer (G4int, typically int32_t)

**Returns:**
- Single precision floating-point value (G4float)

**Bit Layout:**
```
G4int input:
  Bit 31:    Sign bit
  Bits 30-23: Exponent (8 bits)
  Bits 22-0:  Mantissa (23 bits)
```

**Usage:**
```cpp
// Construct 1.0f: sign=0, exp=127 (biased), mantissa=0
G4int one_bits = 0x3F800000;
G4float one = G4IEEE754::uint322sp(one_bits);  // 1.0f

// Construct 2^n efficiently
G4int n = 5;
G4int pow2_bits = (n + 127) << 23;
G4float pow2_5 = G4IEEE754::uint322sp(pow2_bits);  // 32.0f
```

**Applications:**
- Fast single-precision exponential (G4Expf)
- Power-of-2 construction
- Float special value creation

### Float to Uint32 Conversion

```cpp
inline uint32_t sp2uint32(G4float x)
```

Converts a single-precision float to its 32-bit unsigned integer representation.

**Parameters:**
- `x`: Single precision floating-point value (G4float)

**Returns:**
- 32-bit unsigned integer with identical bit pattern

**Usage:**
```cpp
G4float pi = 3.14159265f;
uint32_t pi_bits = G4IEEE754::sp2uint32(pi);
// pi_bits = 0x40490FDB

// Extract exponent
uint32_t exponent_bits = (pi_bits >> 23) & 0xFF;
int exponent = (int)exponent_bits - 127;  // Unbiased: 1

// Extract sign
bool is_negative = (pi_bits >> 31) != 0;  // false

// Extract mantissa
uint32_t mantissa_bits = pi_bits & 0x7FFFFF;
```

**Applications:**
- Fast exponent extraction (G4Logf)
- Sign bit testing
- Mantissa extraction
- Float comparison without NaN issues

## Usage Examples

### Fast Exponent Extraction (Used in G4Log)

```cpp
#include "G4IEEE754.hh"

G4double GetExponent(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);

    // Extract 11-bit exponent from positions [52:62]
    uint64_t exponent_biased = (bits >> 52) & 0x7FFULL;

    // Unbias (subtract 1023)
    int exponent = (int)exponent_biased - 1023;

    return exponent;
}

// Example: GetExponent(8.0) = 3  (since 8.0 = 2^3)
```

### Fast Mantissa Extraction (Used in G4Log)

```cpp
#include "G4IEEE754.hh"

G4double GetMantissa(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);

    // Clear exponent and sign, keep mantissa
    bits &= 0x000FFFFFFFFFFFFFULL;

    // Set exponent to 1023 (represents ×2^0)
    bits |= 0x3FF0000000000000ULL;

    // Now bits represents 1.0 + mantissa
    return G4IEEE754::uint642dp(bits);
}

// Example: GetMantissa(3.5) ≈ 1.75
// (since 3.5 = 1.75 × 2^1)
```

### Fast Power-of-2 Construction (Used in G4Exp)

```cpp
#include "G4IEEE754.hh"

G4double PowerOfTwo(int n) {
    // Create double with value 2^n
    // Just set exponent to (n + 1023), mantissa = 0

    uint64_t bits = (((uint64_t)(n + 1023)) << 52);
    return G4IEEE754::uint642dp(bits);
}

// Examples:
// PowerOfTwo(0) = 1.0
// PowerOfTwo(3) = 8.0
// PowerOfTwo(-2) = 0.25
```

### Fast Mantissa Normalization (Used in G4Log)

```cpp
#include "G4IEEE754.hh"

// Extract mantissa and exponent like frexp()
G4double GetMantissaExponent(G4double x, G4double& exponent) {
    uint64_t bits = G4IEEE754::dp2uint64(x);

    // Extract exponent
    uint64_t exp_bits = (bits >> 52);
    exponent = (int)(exp_bits) - 1023;

    // Set mantissa to [0.5, 1.0) range
    // Clear exponent bits
    bits &= 0x800FFFFFFFFFFFFFULL;  // Keep sign and mantissa

    // Set exponent to represent ×2^(-1) = 0.5
    const uint64_t half_exp = 0x3FE0000000000000ULL;
    bits |= half_exp;

    return G4IEEE754::uint642dp(bits);
}

// Example:
// G4double exp;
// G4double m = GetMantissaExponent(12.0, exp);
// Result: m ≈ 0.75, exp = 4  (since 12.0 = 0.75 × 2^4)
```

### Sign Bit Testing

```cpp
#include "G4IEEE754.hh"

bool IsNegative(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);
    return (bits >> 63) != 0;  // Check sign bit
}

bool IsNegativeFloat(G4float x) {
    uint32_t bits = G4IEEE754::sp2uint32(x);
    return (bits >> 31) != 0;
}

// Works correctly for -0.0 (which has sign bit = 1)
```

### Fast Absolute Value

```cpp
#include "G4IEEE754.hh"

G4double FastAbs(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);
    bits &= 0x7FFFFFFFFFFFFFFFULL;  // Clear sign bit
    return G4IEEE754::uint642dp(bits);
}

G4float FastAbsf(G4float x) {
    uint32_t bits = G4IEEE754::sp2uint32(x);
    bits &= 0x7FFFFFFF;  // Clear sign bit
    return G4IEEE754::uint322sp(bits);
}

// Faster than std::fabs() on some platforms
```

### Creating Special Values

```cpp
#include "G4IEEE754.hh"

G4double GetPositiveInfinity() {
    // Exponent = 2047, mantissa = 0
    uint64_t inf_bits = 0x7FF0000000000000ULL;
    return G4IEEE754::uint642dp(inf_bits);
}

G4double GetNegativeInfinity() {
    uint64_t inf_bits = 0xFFF0000000000000ULL;
    return G4IEEE754::uint642dp(inf_bits);
}

G4double GetQuietNaN() {
    // Exponent = 2047, mantissa != 0 (with MSB set for quiet)
    uint64_t nan_bits = 0x7FF8000000000000ULL;
    return G4IEEE754::uint642dp(nan_bits);
}

G4double GetNegativeZero() {
    uint64_t neg_zero = 0x8000000000000000ULL;
    return G4IEEE754::uint642dp(neg_zero);
}
```

### Fast Float Floor (Used in G4Exp)

```cpp
#include "G4IEEE754.hh"

G4double FastFloor(G4double x) {
    int32_t n = int32_t(x);

    // Adjust for negative values
    uint32_t sign_bit = (G4IEEE754::sp2uint32((G4float)x) >> 31);
    n -= sign_bit;

    return n;
}

// Vectorizes better than std::floor()
// Note: Doesn't handle edge cases like -0.0 correctly
```

### Checking for Special Values

```cpp
#include "G4IEEE754.hh"

bool IsInfinity(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);
    // Infinity: exponent = 2047, mantissa = 0
    return ((bits & 0x7FFFFFFFFFFFFFFFULL) == 0x7FF0000000000000ULL);
}

bool IsNaN(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);
    uint64_t abs_bits = bits & 0x7FFFFFFFFFFFFFFFULL;
    // NaN: exponent = 2047, mantissa != 0
    return (abs_bits > 0x7FF0000000000000ULL);
}

bool IsFinite(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);
    // Finite: exponent < 2047
    return ((bits & 0x7FF0000000000000ULL) != 0x7FF0000000000000ULL);
}
```

### Bit-Level Comparison (Handling NaN)

```cpp
#include "G4IEEE754.hh"

// Regular comparison fails with NaN
// (x == y) returns false if either is NaN

bool BitwiseEqual(G4double x, G4double y) {
    uint64_t x_bits = G4IEEE754::dp2uint64(x);
    uint64_t y_bits = G4IEEE754::dp2uint64(y);
    return x_bits == y_bits;
}

// This can distinguish +0.0 from -0.0, and compare NaN values
```

### Next Representable Value

```cpp
#include "G4IEEE754.hh"

G4double NextAfter(G4double x) {
    // Find next representable double after x
    uint64_t bits = G4IEEE754::dp2uint64(x);

    if(x >= 0.0) {
        bits++;  // Next larger magnitude
    } else {
        bits--;  // Next smaller magnitude
    }

    return G4IEEE754::uint642dp(bits);
}

// Useful for numerical analysis and testing
```

## Performance Characteristics

### Conversion Overhead

All conversion functions have **zero runtime overhead** when:
- Compiler optimization enabled (-O2 or higher)
- Functions are inlined (header-only design)
- No actual data movement occurs (same memory, different interpretation)

**Typical assembly output:**
```asm
; G4double x = G4IEEE754::uint642dp(bits);
; Usually compiles to ZERO instructions (just register reuse)
; Or at most a register move instruction
```

### Comparison with Standard Functions

| Operation | G4IEEE754 | Standard Library | Speedup |
|-----------|-----------|------------------|---------|
| Get exponent | `dp2uint64` + shift | `frexp()` | ~5-10x |
| Set exponent | shift + `uint642dp` | `ldexp()` | ~5-10x |
| Get sign | `dp2uint64` + shift | `signbit()` | ~2-3x |
| Absolute value | Clear bit + `uint642dp` | `fabs()` | ~1.5-2x |
| Power of 2 | shift + `uint642dp` | `pow(2, n)` | ~50-100x |

**Note:** Speedup varies by platform, compiler, and optimization level.

## Thread Safety

All functions in G4IEEE754 are **fully thread-safe**:
- **Stateless:** No global variables or shared state
- **Const functions:** No side effects
- **Reentrant:** Safe for concurrent calls
- **No synchronization needed:** No mutex locks required

**Multithreaded Usage:**
```cpp
#include "G4IEEE754.hh"

// Safe to call from any thread without synchronization
#pragma omp parallel for
for(int i = 0; i < N; ++i) {
    uint64_t bits = G4IEEE754::dp2uint64(values[i]);
    // Process bits...
    results[i] = G4IEEE754::uint642dp(processed_bits);
}
```

## Portability Considerations

### IEEE 754 Compliance

G4IEEE754 assumes the platform uses **IEEE 754** floating-point representation:

**Required:**
- Binary64 (double): 1 sign + 11 exponent + 52 mantissa
- Binary32 (float): 1 sign + 8 exponent + 23 mantissa
- Little-endian or big-endian (code handles both)

**Supported Platforms:**
- x86/x86-64 (Intel, AMD)
- ARM (32-bit and 64-bit)
- PowerPC
- SPARC
- MIPS
- RISC-V

**Virtually all modern platforms** comply with IEEE 754.

### Non-Compliant Platforms

On extremely rare non-IEEE 754 platforms:
- Code may produce incorrect results
- Undefined behavior possible
- Use standard library functions instead

### Endianness

The union-based approach is **endian-agnostic** for:
- Full 64-bit/32-bit conversions (works on both big/little endian)

But **endian-sensitive** for:
- Accessing `f[0]` vs `f[1]` in double
- Accessing individual bytes in `s[0-3]`

**Recommendation:** Use `ll` and `d` members for portability.

## Standard Compliance

### C++ Type Punning

The code uses unions for type punning, which is:

**C++:** Implementation-defined behavior (not guaranteed by standard)
**C:** Explicitly allowed (C99, C11)

**In Practice:**
- Works correctly on all major compilers (GCC, Clang, MSVC, ICC)
- Widely used in performance-critical code
- Standard library implementations use similar techniques

**Alternative (C++20+):**
```cpp
// Modern C++20 approach using std::bit_cast
uint64_t bits = std::bit_cast<uint64_t>(x);
```

G4IEEE754 uses union for compatibility with older C++ standards.

## Design Rationale

### Why Direct Bit Manipulation?

**Advantages:**
1. **Performance:** 5-100x faster than standard library equivalents
2. **Determinism:** Exact control over bit patterns
3. **Special values:** Easy creation of infinity, NaN, denormals
4. **Vectorization:** Bit operations vectorize well

**Disadvantages:**
1. **Non-portable:** Assumes IEEE 754 (but universally supported)
2. **Low-level:** Requires understanding of floating-point representation
3. **Maintenance:** More complex than high-level operations

### Use Cases in Geant4

G4IEEE754 is used internally by:
- **G4Log:** Fast mantissa/exponent extraction
- **G4Exp:** Power-of-2 construction
- **G4Pow:** Optimized power calculations

**Not recommended for general application code** unless performance-critical and IEEE 754 details are well understood.

### Alternatives

For portable high-level code, use standard library:
- `std::frexp()` - extract mantissa and exponent
- `std::ldexp()` - construct from mantissa and exponent
- `std::signbit()` - test sign bit
- `std::copysign()` - copy sign between values
- `std::isinf()`, `std::isnan()` - test special values

G4IEEE754 is for **specialized performance optimization** only.

## Bit Patterns Reference

### Common Double Values

| Value | Hex Pattern | Binary |
|-------|-------------|--------|
| 0.0 | 0x0000000000000000 | 0 00000000000 0...0 |
| -0.0 | 0x8000000000000000 | 1 00000000000 0...0 |
| 1.0 | 0x3FF0000000000000 | 0 01111111111 0...0 |
| 2.0 | 0x4000000000000000 | 0 10000000000 0...0 |
| 0.5 | 0x3FE0000000000000 | 0 01111111110 0...0 |
| +∞ | 0x7FF0000000000000 | 0 11111111111 0...0 |
| -∞ | 0xFFF0000000000000 | 1 11111111111 0...0 |
| NaN (quiet) | 0x7FF8000000000000 | 0 11111111111 1...0 |

### Common Float Values

| Value | Hex Pattern | Binary |
|-------|-------------|--------|
| 0.0f | 0x00000000 | 0 00000000 00000000000000000000000 |
| -0.0f | 0x80000000 | 1 00000000 00000000000000000000000 |
| 1.0f | 0x3F800000 | 0 01111111 00000000000000000000000 |
| 2.0f | 0x40000000 | 0 10000000 00000000000000000000000 |
| +∞ | 0x7F800000 | 0 11111111 00000000000000000000000 |
| -∞ | 0xFF800000 | 1 11111111 00000000000000000000000 |
| NaN (quiet) | 0x7FC00000 | 0 11111111 10000000000000000000000 |

### Exponent Bias Examples

**Double (bias = 1023):**
- 2^0 = 1.0: exponent bits = 1023 (01111111111₂)
- 2^1 = 2.0: exponent bits = 1024 (10000000000₂)
- 2^-1 = 0.5: exponent bits = 1022 (01111111110₂)
- 2^10 = 1024: exponent bits = 1033

**Float (bias = 127):**
- 2^0 = 1.0f: exponent bits = 127 (01111111₂)
- 2^1 = 2.0f: exponent bits = 128 (10000000₂)
- 2^-1 = 0.5f: exponent bits = 126 (01111110₂)
- 2^10 = 1024f: exponent bits = 137

## Debugging Tips

### Inspecting Bit Patterns

```cpp
#include "G4IEEE754.hh"
#include <iostream>
#include <iomanip>

void PrintDoubleBits(G4double x) {
    uint64_t bits = G4IEEE754::dp2uint64(x);

    uint64_t sign = (bits >> 63) & 1;
    uint64_t exponent = (bits >> 52) & 0x7FF;
    uint64_t mantissa = bits & 0xFFFFFFFFFFFFFULL;

    std::cout << "Value: " << x << "\n";
    std::cout << "Bits: 0x" << std::hex << std::setw(16) << std::setfill('0') << bits << "\n";
    std::cout << "Sign: " << sign << "\n";
    std::cout << "Exponent: " << std::dec << exponent << " (biased), "
              << (int)exponent - 1023 << " (unbiased)\n";
    std::cout << "Mantissa: 0x" << std::hex << mantissa << "\n";
}
```

### Common Mistakes

**Wrong bit mask:**
```cpp
// WRONG: Doesn't preserve sign bit
bits &= 0xFFFFFFFFFFFFFULL;  // Only 52 bits

// CORRECT: Preserve sign bit when clearing exponent
bits &= 0x800FFFFFFFFFFFFFULL;  // 1 + 52 bits
```

**Incorrect exponent bias:**
```cpp
// WRONG: Forgot to unbias
int exp = (bits >> 52) & 0x7FF;

// CORRECT: Unbias by subtracting 1023
int exp = ((bits >> 52) & 0x7FF) - 1023;
```

**Endianness issues:**
```cpp
// AVOID: Accessing array members (endian-sensitive)
G4IEEE754::ieee754 x(3.14);
uint32_t part = x.i[0];  // Which half depends on endianness

// PREFER: Use full-width members
uint64_t bits = x.ll;  // Endian-agnostic
```

## See Also

- **g4log.md**: Uses G4IEEE754 for mantissa extraction
- **g4exp.md**: Uses G4IEEE754 for power-of-2 construction
- **g4pow.md**: Indirectly uses G4IEEE754 via G4Log/G4Exp
- **IEEE 754 Standard**: https://ieeexplore.ieee.org/document/4610935
- **Wikipedia - IEEE 754**: https://en.wikipedia.org/wiki/IEEE_754
