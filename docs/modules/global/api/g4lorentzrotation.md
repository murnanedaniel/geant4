# G4LorentzRotation API Documentation

## Overview

`G4LorentzRotation` represents a general Lorentz transformation in Minkowski spacetime. It is an alias to CLHEP's `HepLorentzRotation` class. This class combines spatial rotations with Lorentz boosts to form general transformations between inertial reference frames in special relativity.

Lorentz transformations preserve the Minkowski metric and are fundamental for relativistic particle physics calculations, coordinate transformations, and analyzing particle decays and collisions.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/G4LorentzRotation.hh`
**Implementation:** CLHEP library (`CLHEP/Vector/LorentzRotation.h`)
:::

## Type Definition

`source/global/HEPGeometry/include/G4LorentzRotation.hh:33`

```cpp
using G4LorentzRotation = CLHEP::HepLorentzRotation;
```

**Purpose:** 4×4 Lorentz transformation matrix for relativistic operations

**Mathematical Representation:**
- 4×4 matrix Λ satisfying: Λᵀ η Λ = η
- Where η is the Minkowski metric diag(1, 1, 1, -1)
- Preserves four-vector inner products

**Components:**
- **Spatial rotations:** 3×3 rotation submatrix
- **Boosts:** Lorentz boosts (velocity transformations)
- **Mixed:** Combined rotation + boost transformations

## Constructors

```cpp
// Identity transformation
G4LorentzRotation();

// From rotation matrix
G4LorentzRotation(const G4RotationMatrix& rotation);

// From boost vector (velocity)
G4LorentzRotation(const G4ThreeVector& boost);

// From boost components
G4LorentzRotation(G4double bx, G4double by, G4double bz);

// Copy constructor
G4LorentzRotation(const G4LorentzRotation& other);
```

## Basic Transformations

### Rotations

```cpp
// Rotate around axis
G4LorentzRotation& rotate(G4double angle, const G4ThreeVector& axis);

// Rotate around coordinate axes
G4LorentzRotation& rotateX(G4double angle);
G4LorentzRotation& rotateY(G4double angle);
G4LorentzRotation& rotateZ(G4double angle);

// Set rotation component
G4LorentzRotation& setRotation(const G4RotationMatrix& rotation);
```

### Boosts

```cpp
// Boost along direction with velocity beta
G4LorentzRotation& boost(G4double bx, G4double by, G4double bz);
G4LorentzRotation& boost(const G4ThreeVector& beta);

// Boost along coordinate axes
G4LorentzRotation& boostX(G4double beta);
G4LorentzRotation& boostY(G4double beta);
G4LorentzRotation& boostZ(G4double beta);
```

## Composition and Inversion

### Combining Transformations

```cpp
// Multiply transformations (apply right-to-left)
G4LorentzRotation operator * (const G4LorentzRotation& other) const;
G4LorentzRotation& operator *= (const G4LorentzRotation& other);

// Transform four-vector
G4LorentzVector operator * (const G4LorentzVector& p) const;
```

### Inverse Operations

```cpp
// Inverse transformation
G4LorentzRotation inverse() const;
G4LorentzRotation& invert();

// Transpose (for pure rotations = inverse)
G4LorentzRotation& transpose();
```

## Properties and Queries

### Decomposition

```cpp
// Extract rotation part
G4RotationMatrix getRotation() const;

// Extract boost vector
G4ThreeVector boostVector() const;

// Get matrix elements (row, col) [0-3]
G4double xx() const;  // Row 0, Col 0
G4double xy() const;  // Row 0, Col 1
// ... (16 total accessors)

G4double tt() const;  // Time-time component
G4double tx() const;  // Time-space components
// ...
```

### Identity and Comparison

```cpp
// Check if identity transformation
bool isIdentity() const;

// Comparison
bool operator == (const G4LorentzRotation& other) const;
bool operator != (const G4LorentzRotation& other) const;
```

## Usage Examples

### Creating Lorentz Transformations

```cpp
#include "G4LorentzRotation.hh"

// Identity transformation
G4LorentzRotation identity;

// Pure rotation (45 degrees around Z)
G4LorentzRotation rotation;
rotation.rotateZ(45*deg);

// Pure boost (beta = 0.8 along X)
G4LorentzRotation boost;
boost.boostX(0.8);

// From boost vector
G4ThreeVector betaVec(0.6, 0, 0.8);  // Speed 1.0c (relativistic)
G4LorentzRotation transform(betaVec);
```

### Transforming Four-Vectors

```cpp
// Transform particle four-momentum
void TransformParticle(G4LorentzVector& fourMomentum,
                      const G4LorentzRotation& transform) {
    fourMomentum = transform * fourMomentum;
}

// Alternative: in-place transformation
void TransformInPlace(G4LorentzVector& p,
                     const G4LorentzRotation& L) {
    p *= L;
}

// Example: boost particle to different frame
G4LorentzVector pLab(1*GeV, 2*GeV, 3*GeV, 4*GeV);

G4ThreeVector beta(0.5, 0, 0);  // Moving frame
G4LorentzRotation toMovingFrame;
toMovingFrame.boost(-beta);  // Negative for frame transformation

G4LorentzVector pMoving = toMovingFrame * pLab;
G4cout << "In moving frame: " << pMoving << G4endl;
```

### Boost to Center-of-Mass Frame

```cpp
// Create boost to CM frame for two-particle system
G4LorentzRotation BoostToCM(const G4LorentzVector& p1,
                           const G4LorentzVector& p2) {
    // Total four-momentum
    G4LorentzVector pTotal = p1 + p2;

    // Boost vector (negative of system velocity)
    G4ThreeVector betaCM = -pTotal.boostVector();

    // Create transformation
    G4LorentzRotation toCM;
    toCM.boost(betaCM);

    return toCM;
}

// Usage example
G4LorentzVector beam(0, 0, 100*GeV, 100*GeV);
G4LorentzVector target(0, 0, 0, 0.938*GeV);  // Proton at rest

G4LorentzRotation toCM = BoostToCM(beam, target);

G4LorentzVector beamCM = toCM * beam;
G4LorentzVector targetCM = toCM * target;

G4cout << "Beam in CM: " << beamCM << G4endl;
G4cout << "Target in CM: " << targetCM << G4endl;
```

### Combining Rotations and Boosts

```cpp
// Create transformation: first boost, then rotate
G4LorentzRotation CreateComplexTransform(const G4ThreeVector& boost,
                                        G4double angle,
                                        const G4ThreeVector& axis) {
    G4LorentzRotation transform;

    // Apply boost
    transform.boost(boost);

    // Apply rotation (spatial)
    transform.rotate(angle, axis);

    return transform;
}

// Order matters!
G4LorentzRotation transform1;
transform1.boostX(0.5);
transform1.rotateZ(45*deg);

G4LorentzRotation transform2;
transform2.rotateZ(45*deg);
transform2.boostX(0.5);

// transform1 != transform2 (non-commutative)
```

### Inverse Transformations

```cpp
// Go from lab frame to rest frame and back
void RoundTripTransformation(const G4LorentzVector& labMomentum) {
    // Create boost to rest frame
    G4ThreeVector beta = labMomentum.boostVector();
    G4LorentzRotation toRest;
    toRest.boost(-beta);

    // Transform to rest frame
    G4LorentzVector rest = toRest * labMomentum;
    G4cout << "Rest frame: " << rest << G4endl;
    // Should be (0, 0, 0, mass)

    // Transform back to lab
    G4LorentzRotation toLab = toRest.inverse();
    G4LorentzVector backToLab = toLab * rest;

    G4cout << "Back to lab: " << backToLab << G4endl;
    // Should equal labMomentum
}
```

### Decay in Flight

```cpp
// Particle decay: transform from rest frame to lab frame
struct DecayKinematics {
    G4LorentzVector parent;
    std::vector<G4LorentzVector> daughters;
};

DecayKinematics DecayInFlight(const G4LorentzVector& parentLab,
                              const std::vector<G4LorentzVector>& daughtersRest) {
    DecayKinematics result;
    result.parent = parentLab;

    // Create boost from rest frame to lab frame
    G4ThreeVector beta = parentLab.boostVector();
    G4LorentzRotation toLab;
    toLab.boost(beta);

    // Transform each daughter
    for (const auto& pRest : daughtersRest) {
        G4LorentzVector pLab = toLab * pRest;
        result.daughters.push_back(pLab);
    }

    return result;
}

// Example: pion decay π⁺ → μ⁺ + νμ
G4LorentzVector pionLab(1*GeV, 0, 5*GeV, 5.1*GeV);

// Daughter momenta in pion rest frame (calculated separately)
std::vector<G4LorentzVector> daughtersRest = {
    G4LorentzVector(0.03, 0, 0.03, 0.11),  // Muon
    G4LorentzVector(-0.03, 0, -0.03, 0.03)  // Neutrino
};

DecayKinematics decay = DecayInFlight(pionLab, daughtersRest);
```

### Scattering Angle Transformation

```cpp
// Calculate scattering angle in different frames
struct ScatteringAngles {
    G4double thetaLab;
    G4double thetaCM;
};

ScatteringAngles AnalyzeScattering(const G4LorentzVector& initialLab,
                                  const G4LorentzVector& finalLab,
                                  const G4LorentzVector& target) {
    ScatteringAngles angles;

    // Lab frame angle
    angles.thetaLab = initialLab.angle(finalLab.vect());

    // Transform to CM frame
    G4LorentzRotation toCM = BoostToCM(initialLab, target);

    G4LorentzVector initialCM = toCM * initialLab;
    G4LorentzVector finalCM = toCM * finalLab;

    // CM frame angle
    angles.thetaCM = initialCM.angle(finalCM.vect());

    return angles;
}
```

### Thomas Precession (Advanced)

```cpp
// Thomas precession for successive non-collinear boosts
G4LorentzRotation ThomasPrecession(const G4ThreeVector& beta1,
                                  const G4ThreeVector& beta2) {
    // First boost
    G4LorentzRotation L1;
    L1.boost(beta1);

    // Second boost
    G4LorentzRotation L2;
    L2.boost(beta2);

    // Combined transformation
    G4LorentzRotation L12 = L2 * L1;

    // Pure boost equivalent to L12
    G4ThreeVector beta12 = L12.boostVector();
    G4LorentzRotation Lpure;
    Lpure.boost(beta12);

    // Thomas rotation = L12 * Lpure^(-1)
    G4LorentzRotation thomas = L12 * Lpure.inverse();

    return thomas;
}
```

### Wigner Rotation

```cpp
// Wigner rotation for spin transformation
G4LorentzRotation WignerRotation(const G4LorentzVector& pInitial,
                                const G4LorentzVector& pFinal) {
    // Boost to rest frame of initial momentum
    G4ThreeVector beta1 = pInitial.boostVector();
    G4LorentzRotation toRest1;
    toRest1.boost(-beta1);

    // Boost to rest frame of final momentum
    G4ThreeVector beta2 = pFinal.boostVector();
    G4LorentzRotation toRest2;
    toRest2.boost(-beta2);

    // Combined transformation
    G4LorentzRotation combined = toRest2.inverse() * toRest1;

    return combined;
}
```

### Frame Transformation Utilities

```cpp
// Create transformation from one frame to another
class FrameTransformer {
public:
    FrameTransformer(const G4LorentzVector& frame)
        : fToRest(), fToLab()
    {
        G4ThreeVector beta = frame.boostVector();
        fToRest.boost(-beta);
        fToLab.boost(beta);
    }

    G4LorentzVector ToRestFrame(const G4LorentzVector& p) const {
        return fToRest * p;
    }

    G4LorentzVector ToLabFrame(const G4LorentzVector& p) const {
        return fToLab * p;
    }

    const G4LorentzRotation& GetToRest() const { return fToRest; }
    const G4LorentzRotation& GetToLab() const { return fToLab; }

private:
    G4LorentzRotation fToRest;
    G4LorentzRotation fToLab;
};

// Usage
G4LorentzVector beam(0, 0, 50*GeV, 50*GeV);
FrameTransformer transformer(beam);

G4LorentzVector particle(1*GeV, 2*GeV, 3*GeV, 4*GeV);
G4LorentzVector pRest = transformer.ToRestFrame(particle);
G4LorentzVector pBack = transformer.ToLabFrame(pRest);
```

### Rapidity Transformations

```cpp
// Boost by rapidity (alternative to velocity)
G4LorentzRotation RapidityBoost(G4double rapidity,
                               const G4ThreeVector& direction) {
    // Convert rapidity to beta
    G4double beta = std::tanh(rapidity);

    G4ThreeVector betaVec = beta * direction.unit();

    G4LorentzRotation boost;
    boost.boost(betaVec);

    return boost;
}

// Example: boost by 3 units of rapidity along Z
G4LorentzRotation rapidBoost = RapidityBoost(3.0, G4ThreeVector(0, 0, 1));
```

### Matrix Decomposition

```cpp
// Extract rotation and boost from general Lorentz transformation
struct LorentzDecomposition {
    G4RotationMatrix rotation;
    G4ThreeVector boost;
};

LorentzDecomposition Decompose(const G4LorentzRotation& L) {
    LorentzDecomposition result;

    // Extract rotation
    result.rotation = L.getRotation();

    // Extract boost
    result.boost = L.boostVector();

    // Verify: should be able to reconstruct L
    G4LorentzRotation reconstructed(result.rotation);
    reconstructed.boost(result.boost);

    return result;
}
```

## Common Patterns

### Boost to Rest Frame

```cpp
// Most common pattern: boost to particle rest frame
G4ThreeVector beta = particle.boostVector();
G4LorentzRotation toRest;
toRest.boost(-beta);  // Negative for inverse transformation

G4LorentzVector rest = toRest * particle;
```

### Sequential Transformations

```cpp
// Apply multiple transformations
G4LorentzRotation total = transform3 * transform2 * transform1;
// Applies transform1, then transform2, then transform3
```

### Inverse Boost

```cpp
// Go back to original frame
G4LorentzRotation forward;
forward.boost(beta);

G4LorentzRotation backward = forward.inverse();
// Equivalent to: backward.boost(-beta);
```

## Physical Considerations

### Velocity Limits

```cpp
// Beta must satisfy |β| < 1 for physical transformations
bool IsPhysicalBoost(const G4ThreeVector& beta) {
    return beta.mag() < 1.0;
}

// Safe boost creation
G4LorentzRotation SafeBoost(const G4ThreeVector& beta) {
    G4LorentzRotation L;

    if (beta.mag() >= 1.0) {
        G4cerr << "Warning: superluminal boost!" << G4endl;
        // Use beta just below speed of light
        G4ThreeVector safeBeta = 0.9999 * beta.unit();
        L.boost(safeBeta);
    } else {
        L.boost(beta);
    }

    return L;
}
```

### Lorentz Invariants

```cpp
// Verify transformation preserves invariant mass
bool CheckInvariance(const G4LorentzVector& p,
                    const G4LorentzRotation& L) {
    G4LorentzVector pTransformed = L * p;

    G4double m1 = p.m();
    G4double m2 = pTransformed.m();

    return std::abs(m1 - m2) < 1e-9;  // Numerical tolerance
}
```

## Thread Safety

`G4LorentzRotation` is:
- **Value type:** Copied, not shared
- **No mutable state:** Safe for concurrent use
- **Thread-safe:** Each thread has independent instances

Lorentz transformations can be created and applied safely in multi-threaded applications.

## Performance Notes

1. **Cache transformations:** Computing boosts and rotations is expensive
   ```cpp
   // Compute once
   G4LorentzRotation toCM = BoostToCM(p1, p2);

   // Reuse for multiple particles
   for (auto& particle : particles) {
       particle = toCM * particle;
   }
   ```

2. **Use inverse() judiciously:** Matrix inversion has computational cost
   ```cpp
   // If you need both forward and inverse, compute both
   G4LorentzRotation forward;
   forward.boost(beta);
   G4LorentzRotation backward = forward.inverse();
   ```

3. **Pass by const reference:**
   ```cpp
   void Apply(const G4LorentzRotation& L);  // Good
   void Apply(G4LorentzRotation L);         // Copies 128 bytes
   ```

## Related Classes

- [G4LorentzVector](g4lorentzvector.md) - Four-vectors transformed by `G4LorentzRotation`
- [G4RotationMatrix](g4rotationmatrix.md) - 3×3 spatial rotation matrices
- [G4ThreeVector](g4threevector.md) - 3D velocity/boost vectors
- [G4DynamicParticle](g4dynamicparticle.md) - Particle dynamics with Lorentz transformations

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- CLHEP HepLorentzRotation documentation - Detailed CLHEP implementation
- Special Relativity - Theoretical background
- Lorentz Group - Mathematical structure

---

::: info Source Reference
Type definition in:
- Header: `source/global/HEPGeometry/include/G4LorentzRotation.hh`
- Implementation: CLHEP library (`CLHEP/Vector/LorentzRotation.h`)
:::
