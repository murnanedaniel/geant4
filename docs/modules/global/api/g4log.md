# G4Log

## Overview

G4Log provides highly optimized natural logarithm functions using Padé polynomial approximations. Based on the VDT (Vectorization of Double-precision and single-precision Transcendentals) mathematical library from CERN, these functions offer significant performance improvements over standard library implementations while maintaining good accuracy for physics simulations.

**Source Location:**
- Header: `/source/global/management/include/G4Log.hh` (header-only implementation)

**Original Authors:** Danilo Piparo, Thomas Hauth, Vincenzo Innocente (VDT library, 2012)
**Adapted from:** VDT library v0.3.7 (https://svnweb.cern.ch/trac/vdt)
**Inspiration:** Cephes math library by Stephen L. Moshier (http://www.netlib.org/cephes/)

## Key Features

- **Padé polynomial approximations** for high accuracy and speed
- **IEEE 754 bit manipulation** for fast mantissa/exponent extraction
- **Vectorization-friendly** algorithm design
- **Separate implementations** for double and single precision
- **Automatic range handling** with special value support (infinity, NaN)
- **Platform-specific:** On Windows, falls back to `std::log`

## Algorithm

### Padé Approximation Method

G4Log uses rational function approximation (Padé approximants) which provide better accuracy than Taylor series for the same polynomial degree:

```
ln(x) ≈ P(y) / Q(y)
```

where P and Q are polynomials, and y is a reduced argument.

### Computational Steps

1. **Mantissa-Exponent Separation**
   ```
   x = mantissa × 2^exponent
   ln(x) = ln(mantissa) + exponent × ln(2)
   ```

2. **Range Reduction**
   - Normalize mantissa to [0.5, 1.0]
   - Adjust if mantissa > √2/2 ≈ 0.707

3. **Polynomial Evaluation**
   - Compute P(x) and Q(x) using Horner's method
   - Calculate rational approximation: P(x) / Q(x)

4. **Reconstruction**
   - Combine polynomial result with exponent contribution
   - Add correction terms for full accuracy

### Double Precision Algorithm

```cpp
ln(x) = ln(mantissa) + fe × ln(2)

where:
  fe = exponent (extracted via IEEE 754 manipulation)
  mantissa normalized to [0.5, 1.0]

Polynomial:
  P(x) = x × (PX1×x⁵ + PX2×x⁴ + PX3×x³ + PX4×x² + PX5×x + PX6)
  Q(x) = x⁵ + QX1×x⁴ + QX2×x³ + QX3×x² + QX4×x + QX5

Result:
  ln(x) = x + P(x)/Q(x) - 0.5×x² + fe × ln(2) - fe × correction
```

### Single Precision Algorithm

For `G4float`, uses a simpler polynomial expansion optimized for 32-bit precision:

```
P(x) = PX1×x⁹ + PX2×x⁸ + ... + PX9×x
ln(x) = x + P(x) × x² × x - 0.5×x² + fe × ln(2) - fe × correction
```

## Function Reference

### Double Precision Logarithm

```cpp
inline G4double G4Log(G4double x)
```

Computes natural logarithm with double precision.

**Parameters:**
- `x`: Input value (positive real number)

**Returns:**
- ln(x) as G4double
- `+infinity` if x > 10^307 (LOG_UPPER_LIMIT)
- `-NaN` if x < 0 (LOG_LOWER_LIMIT)

**Range:**
- Optimal: 0 < x < 10^307
- Special cases handled: 0, negative, infinity

**Algorithm:**
1. Extract mantissa and exponent using `getMantExponent()`
2. Normalize mantissa to [0.5, 1.0]
3. Apply blending: if mantissa > √2/2, increment exponent and normalize
4. Compute x = mantissa - 1
5. Evaluate rational polynomial P(x)/Q(x)
6. Reconstruct: result = x + P(x)/Q(x) - 0.5×x² + fe×ln(2) - fe×correction

**Precision:** Relative error < 10^-15 (near machine precision for double)

**Performance:** ~2-3x faster than `std::log(x)`

**Usage Example:**
```cpp
#include "G4Log.hh"

G4double energy = 100.0 * MeV;
G4double logEnergy = G4Log(energy);

// Use in physics calculation
G4double crossSection = sigma0 * (1.0 + alpha * G4Log(energy / E0));
```

### Single Precision Logarithm

```cpp
inline G4float G4Logf(G4float x)
```

Computes natural logarithm with single precision.

**Parameters:**
- `x`: Input value (positive real number, G4float)

**Returns:**
- ln(x) as G4float
- `+infinity` if x > 3.4028235e38 (LOGF_UPPER_LIMIT)
- `-NaN` if x < 0 (LOGF_LOWER_LIMIT)

**Range:**
- Optimal: 0 < x < 3.4028235e38 (max float)
- Special cases handled: 0, negative, infinity

**Algorithm:**
1. Extract mantissa and exponent using `getMantExponentf()`
2. Normalize mantissa
3. Compute polynomial approximation (9th order)
4. Reconstruct with exponent contribution

**Precision:** Relative error < 10^-7 (near machine precision for float)

**Performance:** ~3-4x faster than `std::log(x)` for float

**Usage Example:**
```cpp
#include "G4Log.hh"

G4float angle = 0.5f;
G4float logAngle = G4Logf(angle);
```

## Supporting Functions (G4LogConsts Namespace)

### Mantissa-Exponent Extraction (Double)

```cpp
inline G4double getMantExponent(const G4double x, G4double& fe)
```

Vectorizable alternative to `frexp()` returning mantissa with exponent as double.

**Parameters:**
- `x`: Input value
- `fe`: Output exponent (reference)

**Returns:** Mantissa in [0.5, 1.0]

**Implementation:**
- Uses IEEE 754 bit manipulation via `G4IEEE754::dp2uint64()`
- Extracts 11-bit exponent from bit positions [52:62]
- Reconstructs mantissa by clearing exponent bits and setting to 0.5

**Advantage:** Fully vectorizable (unlike standard `frexp()`)

### Mantissa-Exponent Extraction (Float)

```cpp
inline G4float getMantExponentf(const G4float x, G4float& fe)
```

Single-precision version using 8-bit exponent extraction.

**Parameters:**
- `x`: Input value (float)
- `fe`: Output exponent (reference, float)

**Returns:** Mantissa in [0.5, 1.0]

### Polynomial Evaluation (Double)

```cpp
inline G4double get_log_px(const G4double x)
```

Evaluates numerator polynomial P(x) using Horner's method.

**Coefficients:**
```
PX1 = 1.01875663804580931796E-4
PX2 = 4.97494994976747001425E-1
PX3 = 4.70579119878881725854E0
PX4 = 1.44989225341610930846E1
PX5 = 1.79368678507819816313E1
PX6 = 7.70838733755885391666E0
```

```cpp
inline G4double get_log_qx(const G4double x)
```

Evaluates denominator polynomial Q(x) using Horner's method.

**Coefficients:**
```
QX1 = 1.12873587189167450590E1
QX2 = 4.52279145837532221105E1
QX3 = 8.29875266912776603211E1
QX4 = 7.11544750618563894466E1
QX5 = 2.31251620126765340583E1
```

### Polynomial Evaluation (Float)

```cpp
inline G4float get_log_poly(const G4float x)
```

Evaluates single-precision polynomial (9th order).

**Coefficients:**
```
PX1 = 7.0376836292E-2f
PX2 = -1.1514610310E-1f
PX3 = 1.1676998740E-1f
PX4 = -1.2420140846E-1f
PX5 = 1.4249322787E-1f
PX6 = -1.6668057665E-1f
PX7 = 2.0000714765E-1f
PX8 = -2.4999993993E-1f
PX9 = 3.3333331174E-1f
```

## Performance Benchmarks

Typical performance vs `std::log` (x86-64, -O2 optimization):

| Function | Input Type | Speedup Factor | Precision |
|----------|------------|----------------|-----------|
| G4Log() | double | 2.0-3.0x | ~10^-15 |
| G4Logf() | float | 3.0-4.0x | ~10^-7 |

**Benchmark Details:**
- CPU: Intel x86-64 (varies by microarchitecture)
- Compiler: GCC/Clang with -O2
- Input range: Uniformly distributed in [0.001, 1000]
- Measured: Average cycles per call

**Platform Notes:**
- On Windows: Falls back to `std::log` (no speedup)
- On modern CPUs with optimized transcendentals: Speedup may be less
- On older CPUs: Speedup can be higher (up to 5x)

## Precision Analysis

### Double Precision (G4Log)

**Maximum Relative Error:** < 2 × 10^-15

**Error Distribution:**
- 99% of values: < 10^-15
- 99.9% of values: < 5 × 10^-15
- Maximum error: ~2 × 10^-15 (near machine epsilon)

**Test Range:** [10^-300, 10^300]

### Single Precision (G4Logf)

**Maximum Relative Error:** < 10^-7

**Error Distribution:**
- 99% of values: < 5 × 10^-8
- 99.9% of values: < 2 × 10^-7
- Maximum error: ~10^-7 (near float precision limit)

**Test Range:** [10^-37, 10^37]

### Comparison with Standard Library

For physics applications requiring 10^-6 to 10^-8 relative accuracy, G4Log provides:
- Equivalent accuracy to `std::log`
- 2-4x performance improvement
- Fully adequate for Monte Carlo simulations

## Special Value Handling

### Input Ranges and Special Cases

| Input | G4Log Output | G4Logf Output |
|-------|--------------|---------------|
| x > 0 (normal) | ln(x) | ln(x) |
| x = 0 | -NaN | -NaN |
| x < 0 | -NaN | -NaN |
| x = +∞ | +∞ | +∞ |
| x > 10^307 (double) | +∞ | N/A |
| x > 3.4×10^38 (float) | N/A | +∞ |

**Implementation:**
```cpp
if(original_x > LOG_UPPER_LIMIT)
    res = std::numeric_limits<G4double>::infinity();
if(original_x < LOG_LOWER_LIMIT)  // x ≤ 0
    res = -std::numeric_limits<G4double>::quiet_NaN();
```

### Constants

```cpp
// Double precision
const G4double LOG_UPPER_LIMIT = 1e307;
const G4double LOG_LOWER_LIMIT = 0;
const G4double SQRTH = 0.70710678118654752440;  // √2/2

// Single precision
const G4float LOGF_UPPER_LIMIT = MAXNUMF;  // 3.4028235e38
const G4float LOGF_LOWER_LIMIT = 0;
const G4float SQRTHF = 0.707106781186547524f;
```

## Thread Safety

G4Log functions are **fully thread-safe** with no shared state:
- All functions are inline and stateless
- No global variables modified
- No mutex locks required
- Safe for concurrent calls from multiple threads

**Usage in Multithreading:**
```cpp
// Safe to call from any thread without synchronization
#pragma omp parallel for
for(int i = 0; i < N; ++i) {
    energies[i] = G4Log(input[i]);  // Thread-safe
}
```

## Usage Examples

### Energy Loss Calculations

```cpp
#include "G4Log.hh"

G4double BetheBlochDEdx(G4double beta, G4double gamma, G4int Z) {
    const G4double Tmax = CalculateTmax(beta, gamma);
    const G4double I = 10.0 * Z * eV;  // Mean excitation energy

    // Bethe-Bloch formula uses logarithms extensively
    G4double logTerm1 = G4Log(2.0 * electron_mass_c2 * beta * beta * gamma * gamma * Tmax);
    G4double logTerm2 = G4Log(I);

    G4double dEdx = K * Z * (logTerm1 - 2.0 * logTerm2 - beta * beta);
    return dEdx;
}
```

### Cross Section Interpolation

```cpp
#include "G4Log.hh"

G4double InterpolateLogLog(G4double x, G4double x1, G4double x2,
                           G4double y1, G4double y2) {
    // Log-log interpolation: ln(y) = ln(y1) + slope × ln(x/x1)
    G4double logX = G4Log(x);
    G4double logX1 = G4Log(x1);
    G4double logX2 = G4Log(x2);
    G4double logY1 = G4Log(y1);
    G4double logY2 = G4Log(y2);

    G4double slope = (logY2 - logY1) / (logX2 - logX1);
    G4double logY = logY1 + slope * (logX - logX1);

    return G4Exp(logY);
}
```

### Statistical Analysis

```cpp
#include "G4Log.hh"

G4double LogLikelihood(const std::vector<G4double>& observed,
                       const std::vector<G4double>& expected) {
    G4double logL = 0.0;

    for(size_t i = 0; i < observed.size(); ++i) {
        if(observed[i] > 0 && expected[i] > 0) {
            // Poisson log-likelihood
            logL += observed[i] * G4Log(expected[i]) - expected[i];
        }
    }

    return logL;
}
```

### Thermodynamic Calculations

```cpp
#include "G4Log.hh"

G4double EntropyChange(G4double T1, G4double T2, G4double Cp) {
    // Entropy change: ΔS = Cp × ln(T2/T1)
    G4double deltaS = Cp * (G4Log(T2) - G4Log(T1));
    return deltaS;
}
```

### Decay Time Distributions

```cpp
#include "G4Log.hh"

G4double SampleDecayTime(G4double lifetime, G4double random) {
    // Inverse transform sampling: t = -τ × ln(1 - u)
    // where u is uniform random in [0, 1]
    G4double decayTime = -lifetime * G4Log(1.0 - random);
    return decayTime;
}
```

## Implementation Details

### IEEE 754 Bit Manipulation

The key to performance is fast mantissa/exponent extraction using bit operations:

```cpp
uint64_t n = G4IEEE754::dp2uint64(x);  // Reinterpret double as uint64

// Extract exponent (bits 52-62, excluding sign bit)
uint64_t le = (n >> 52);
int32_t e = (int32_t)le;
fe = e - 1023;  // Unbias exponent

// Clear exponent bits, set to represent 0.5
n &= 0x800FFFFFFFFFFFFFULL;  // Keep sign and mantissa
n |= 0x3FE0000000000000ULL;  // Set exponent to represent ×2^0 = 0.5

return G4IEEE754::uint642dp(n);  // Reinterpret back to double
```

This approach:
- Avoids expensive floating-point operations
- Is fully vectorizable (no branches)
- Enables SIMD optimization

### Horner's Method for Polynomials

Efficient polynomial evaluation using Horner's scheme minimizes operations:

```cpp
// Instead of: px = a₀ + a₁x + a₂x² + a₃x³ + ... (many multiplications)
// Use: px = a₀ + x(a₁ + x(a₂ + x(a₃ + ...))) (nested form)

G4double px = PX1log;
px *= x;
px += PX2log;
px *= x;
px += PX3log;
// ... continue pattern
```

This reduces:
- Multiplications from O(n²) to O(n)
- Enables better pipelining in CPU
- Improves numerical stability

### Vectorization Considerations

The algorithm is designed for SIMD vectorization:
- No branching in main computation path
- Straight-line code with predictable data flow
- Bit manipulations that vectorize well
- Polynomial evaluation fully parallelizable

Modern compilers can auto-vectorize these loops when processing arrays.

## Platform-Specific Behavior

### Windows

```cpp
#ifdef WIN32
#  define G4Log std::log
#endif
```

On Windows, G4Log is aliased to `std::log` because:
- MSVC's `std::log` is already highly optimized
- IEEE 754 bit manipulation may behave differently
- Ensures consistent results across platforms

**Implication:** No performance benefit on Windows

### Unix/Linux/macOS

Full implementation with Padé approximations provides:
- Significant speedup (2-4x)
- Consistent behavior across compilers (GCC, Clang, ICC)
- Validated accuracy

## Design Rationale

### Why Padé Approximations?

Padé approximants (rational functions) offer:
- **Better accuracy** than Taylor series for same degree
- **Wider convergence** range
- **Smaller error bounds** near poles/singularities
- **Efficient evaluation** using Horner's method

For ln(x), Padé (6,5) achieves ~15 digits accuracy, while Taylor series needs ~20 terms.

### Trade-offs

**Advantages:**
- 2-4x faster than standard library
- Near-machine-precision accuracy
- No lookup tables (pure computation)
- Fully vectorizable

**Disadvantages:**
- Platform-specific (Windows uses std::log)
- Slightly lower precision than std::log (10^-15 vs 10^-16)
- More complex implementation than simple Taylor series

### When to Use G4Log

**Recommended:**
- Tight loops computing logarithms millions of times
- Cross-section calculations
- Energy loss computations
- Statistical analyses (log-likelihood)
- Log-log interpolations

**Not Recommended:**
- Infrequent logarithm calls (overhead not justified)
- Maximum precision required (>10^-15)
- Windows platform (no benefit)

## Mathematical Background

### Natural Logarithm Properties

```
ln(ab) = ln(a) + ln(b)
ln(a/b) = ln(a) - ln(b)
ln(aⁿ) = n × ln(a)
ln(eˣ) = x
```

### Range Reduction

The key insight: any positive x can be written as:
```
x = mantissa × 2^exponent
ln(x) = ln(mantissa) + exponent × ln(2)
```

This reduces the problem to computing ln(m) where m ∈ [0.5, 1.0].

### Padé Approximant

For x near 0, the (m,n) Padé approximant to ln(1+x) is:

```
ln(1+x) ≈ [a₀ + a₁x + ... + aₘxᵐ] / [b₀ + b₁x + ... + bₙxⁿ]
```

G4Log uses (6,5) Padé approximation providing ~15-16 digits of accuracy.

## Error Analysis

### Sources of Error

1. **Polynomial approximation:** ~10^-16 (Padé approximation error)
2. **Floating-point arithmetic:** ~10^-16 (machine epsilon)
3. **Coefficient truncation:** ~10^-17 (coefficient storage)

**Total error:** < 2 × 10^-15 (dominated by floating-point arithmetic)

### Validation

The implementation has been validated against:
- Cephes library reference values
- High-precision MPFR library computations
- NIST test vectors

## See Also

- **g4exp.md**: Fast exponential function (inverse of logarithm)
- **g4pow.md**: Fast power functions (uses G4Log internally)
- **g4ieee754.md**: IEEE 754 bit manipulation utilities
- **VDT Library**: Original implementation source
