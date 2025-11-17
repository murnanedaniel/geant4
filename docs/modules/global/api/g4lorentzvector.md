# G4LorentzVector API Documentation

## Overview

`G4LorentzVector` represents a four-vector in Minkowski spacetime, combining spatial coordinates (or momentum) with time (or energy). It is an alias to CLHEP's `HepLorentzVector` class. This is the fundamental class for representing relativistic four-momenta, spacetime positions, and performing Lorentz-invariant calculations in particle physics.

The four-vector contains components (px, py, pz, E) for momentum-energy or (x, y, z, t) for spacetime position.

::: tip Header File
**Location:** `source/global/HEPGeometry/include/G4LorentzVector.hh`
**Implementation:** CLHEP library (`CLHEP/Vector/LorentzVector.h`)
:::

## Type Definition

`source/global/HEPGeometry/include/G4LorentzVector.hh:33`

```cpp
using G4LorentzVector = CLHEP::HepLorentzVector;
```

**Purpose:** 4D vector for relativistic physics calculations

**Components:**
- **Spatial/Momentum:** (px, py, pz) or (x, y, z)
- **Temporal/Energy:** E or t

**Internal Representation:**
- Four `double` values
- Approximately 32 bytes (4 × 8 bytes)

## Constructors

```cpp
// Default constructor - zero four-vector
G4LorentzVector();

// From components (px, py, pz, E)
G4LorentzVector(G4double px, G4double py, G4double pz, G4double E);

// From 3-vector and scalar
G4LorentzVector(const G4ThreeVector& p, G4double E);

// Copy constructor
G4LorentzVector(const G4LorentzVector& other);
```

## Component Access

### Momentum-Energy Notation

```cpp
// Get momentum components
G4double px() const;
G4double py() const;
G4double pz() const;

// Get energy component
G4double e() const;
G4double t() const;  // Alternative name (time)

// Set components
void setPx(G4double px);
void setPy(G4double py);
void setPz(G4double pz);
void setE(G4double E);
void setT(G4double t);

// Set all components
void set(G4double px, G4double py, G4double pz, G4double E);
void setVect(const G4ThreeVector& p);
void setVectM(const G4ThreeVector& p, G4double mass);
void setVectMag(const G4ThreeVector& p, G4double magnitude);
```

### Position-Time Notation

```cpp
// Get position components
G4double x() const;
G4double y() const;
G4double z() const;

// Set position components
void setX(G4double x);
void setY(G4double y);
void setZ(G4double z);
```

### Vector Access

```cpp
// Get 3-vector part
G4ThreeVector vect() const;
G4ThreeVector getV() const;  // Alternative

// Array-style access [0=px, 1=py, 2=pz, 3=E]
G4double operator[](int i) const;
G4double& operator[](int i);
```

## Lorentz-Invariant Quantities

### Mass and Magnitude

```cpp
// Invariant mass: m² = E² - p²
G4double m() const;
G4double mag() const;           // Same as m()
G4double invariantMass() const; // Same as m()

// Invariant mass squared: m² = E² - p²
G4double m2() const;
G4double mag2() const;  // Same as m2()

// Transverse mass: mt² = E² - pz²
G4double mt() const;
G4double mt2() const;

// Magnitude of 3-momentum
G4double rho() const;    // |p|
G4double rho2() const;   // |p|²
```

### Energy and Momentum

```cpp
// Total energy
G4double e() const;
G4double t() const;

// 3-momentum magnitude
G4double p() const;   // |p|
G4double p2() const;  // |p|²

// Transverse momentum (perpendicular to z-axis)
G4double perp() const;   // pt
G4double perp2() const;  // pt²
G4double pt() const;     // Same as perp()
G4double pt2() const;    // Same as perp2()

// Transverse energy: Et = E * sin(theta)
G4double et() const;
G4double et2() const;
```

### Kinematic Variables

```cpp
// Rapidity: y = 0.5 * ln[(E+pz)/(E-pz)]
G4double rapidity() const;

// Pseudorapidity: η = -ln[tan(θ/2)]
G4double pseudoRapidity() const;
G4double eta() const;  // Same as pseudoRapidity()

// Velocity: β = p/E
G4double beta() const;
G4ThreeVector boostVector() const;

// Gamma factor: γ = E/m
G4double gamma() const;
```

### Angular Properties

```cpp
// Polar angle theta (with respect to z-axis)
G4double theta() const;
G4double getTheta() const;

// Azimuthal angle phi
G4double phi() const;
G4double getPhi() const;

// Cosine of theta
G4double cosTheta() const;

// Angle between two four-vectors (in 3-space)
G4double angle(const G4ThreeVector& v) const;
G4double angle(const G4LorentzVector& v) const;
```

## Four-Vector Operations

### Arithmetic Operations

```cpp
// Addition
G4LorentzVector operator + (const G4LorentzVector& other) const;
G4LorentzVector& operator += (const G4LorentzVector& other);

// Subtraction
G4LorentzVector operator - (const G4LorentzVector& other) const;
G4LorentzVector& operator -= (const G4LorentzVector& other);

// Unary negation
G4LorentzVector operator - () const;

// Scalar multiplication
G4LorentzVector operator * (G4double scalar) const;
G4LorentzVector& operator *= (G4double scalar);

// Scalar division
G4LorentzVector operator / (G4double scalar) const;
G4LorentzVector& operator /= (G4double scalar);
```

### Four-Vector Products

```cpp
// Minkowski inner product: E1*E2 - p1·p2
G4double dot(const G4LorentzVector& other) const;
G4double operator * (const G4LorentzVector& other) const;

// Comparison
bool operator == (const G4LorentzVector& other) const;
bool operator != (const G4LorentzVector& other) const;
```

## Lorentz Transformations

### Boosts

```cpp
// Boost along arbitrary direction
G4LorentzVector& boost(G4double bx, G4double by, G4double bz);
G4LorentzVector& boost(const G4ThreeVector& beta);

// Boost along specific axes
G4LorentzVector& boostX(G4double beta);
G4LorentzVector& boostY(G4double beta);
G4LorentzVector& boostZ(G4double beta);
```

### Rotations

```cpp
// Rotate around axis
G4LorentzVector& rotate(G4double angle, const G4ThreeVector& axis);

// Rotate around specific axes
G4LorentzVector& rotateX(G4double angle);
G4LorentzVector& rotateY(G4double angle);
G4LorentzVector& rotateZ(G4double angle);

// Rotate using Euler angles
G4LorentzVector& rotateUz(const G4ThreeVector& newZ);
```

### General Transformations

```cpp
// Transform by rotation matrix
G4LorentzVector& transform(const G4RotationMatrix& rotation);

// Apply Lorentz transformation
G4LorentzVector& operator *= (const G4LorentzRotation& lorentz);
G4LorentzVector operator * (const G4LorentzRotation& lorentz) const;
```

## Usage Examples

### Particle Four-Momentum

```cpp
#include "G4LorentzVector.hh"

// Create four-momentum for 10 GeV electron
G4double mass = 0.511*MeV;  // Electron mass
G4double energy = 10*GeV;
G4double momentum = std::sqrt(energy*energy - mass*mass);

G4ThreeVector p(0, 0, momentum);
G4LorentzVector fourMomentum(p, energy);

// Alternative: from mass and 3-momentum
G4ThreeVector p3(0, 0, 10*GeV);
G4LorentzVector fourMom;
fourMom.setVectM(p3, mass);

// Access components
G4cout << "Energy: " << fourMomentum.e()/GeV << " GeV" << G4endl;
G4cout << "Momentum: " << fourMomentum.rho()/GeV << " GeV/c" << G4endl;
G4cout << "Mass: " << fourMomentum.m()/MeV << " MeV/c²" << G4endl;
```

### Relativistic Kinematics

```cpp
// Calculate kinematic variables
void AnalyzeParticle(const G4LorentzVector& fourMomentum) {
    G4cout << "Four-momentum analysis:" << G4endl;
    G4cout << "  Energy: " << fourMomentum.e()/GeV << " GeV" << G4endl;
    G4cout << "  Momentum: " << fourMomentum.rho()/GeV << " GeV/c" << G4endl;
    G4cout << "  Transverse momentum: " << fourMomentum.pt()/GeV
           << " GeV/c" << G4endl;
    G4cout << "  Mass: " << fourMomentum.m()/GeV << " GeV/c²" << G4endl;
    G4cout << "  Rapidity: " << fourMomentum.rapidity() << G4endl;
    G4cout << "  Pseudorapidity: " << fourMomentum.eta() << G4endl;
    G4cout << "  Beta: " << fourMomentum.beta() << G4endl;
    G4cout << "  Gamma: " << fourMomentum.gamma() << G4endl;
    G4cout << "  Theta: " << fourMomentum.theta()/deg << " deg" << G4endl;
    G4cout << "  Phi: " << fourMomentum.phi()/deg << " deg" << G4endl;
}
```

### Conservation Laws

```cpp
// Check energy-momentum conservation
bool CheckConservation(const std::vector<G4LorentzVector>& initial,
                      const std::vector<G4LorentzVector>& final,
                      G4double tolerance = 1*keV) {
    // Sum initial four-momenta
    G4LorentzVector totalInitial;
    for (const auto& p : initial) {
        totalInitial += p;
    }

    // Sum final four-momenta
    G4LorentzVector totalFinal;
    for (const auto& p : final) {
        totalFinal += p;
    }

    // Check conservation
    G4LorentzVector difference = totalFinal - totalInitial;

    G4bool energyConserved = std::abs(difference.e()) < tolerance;
    G4bool momentumConserved = difference.vect().mag() < tolerance;

    if (!energyConserved) {
        G4cout << "Energy not conserved! Delta E = "
               << difference.e()/keV << " keV" << G4endl;
    }
    if (!momentumConserved) {
        G4cout << "Momentum not conserved! Delta p = "
               << difference.vect().mag()/keV << " keV/c" << G4endl;
    }

    return energyConserved && momentumConserved;
}
```

### Two-Body Decay

```cpp
// Calculate decay products in rest frame
struct DecayProducts {
    G4LorentzVector particle1;
    G4LorentzVector particle2;
};

DecayProducts TwoBodyDecay(G4double parentMass,
                          G4double mass1,
                          G4double mass2,
                          const G4ThreeVector& direction) {
    DecayProducts products;

    // Momentum magnitude in rest frame
    G4double E1 = (parentMass*parentMass + mass1*mass1 - mass2*mass2) /
                  (2 * parentMass);
    G4double E2 = (parentMass*parentMass + mass2*mass2 - mass1*mass1) /
                  (2 * parentMass);

    G4double p = std::sqrt(E1*E1 - mass1*mass1);

    // Create four-momenta
    G4ThreeVector p1 = p * direction.unit();
    G4ThreeVector p2 = -p1;

    products.particle1.set(p1.x(), p1.y(), p1.z(), E1);
    products.particle2.set(p2.x(), p2.y(), p2.z(), E2);

    return products;
}

// Boost decay products to lab frame
void BoostToLab(const G4LorentzVector& parent,
                DecayProducts& products) {
    G4ThreeVector boostVec = parent.boostVector();

    products.particle1.boost(boostVec);
    products.particle2.boost(boostVec);
}
```

### Lorentz Boosts

```cpp
// Boost particle to center-of-mass frame
G4LorentzVector BoostToCM(const G4LorentzVector& particle,
                         const G4LorentzVector& system) {
    G4LorentzVector boosted = particle;
    G4ThreeVector betaCM = -system.boostVector();
    boosted.boost(betaCM);
    return boosted;
}

// Boost from lab to particle rest frame
G4LorentzVector BoostToRestFrame(const G4LorentzVector& particle) {
    G4LorentzVector rest = particle;
    G4ThreeVector beta = -particle.boostVector();
    rest.boost(beta);
    return rest;
    // Result: (0, 0, 0, m)
}

// Example: analyze collision in CM frame
void AnalyzeCollision(const G4LorentzVector& p1,
                     const G4LorentzVector& p2) {
    // Total system
    G4LorentzVector total = p1 + p2;

    // Boost to CM frame
    G4LorentzVector p1_cm = BoostToCM(p1, total);
    G4LorentzVector p2_cm = BoostToCM(p2, total);

    G4cout << "CM energy: " << total.m()/GeV << " GeV" << G4endl;
    G4cout << "Particle 1 in CM: E = " << p1_cm.e()/GeV << " GeV" << G4endl;
    G4cout << "Particle 2 in CM: E = " << p2_cm.e()/GeV << " GeV" << G4endl;
}
```

### Invariant Mass Calculations

```cpp
// Calculate invariant mass of system
G4double InvariantMass(const std::vector<G4LorentzVector>& particles) {
    G4LorentzVector total;
    for (const auto& p : particles) {
        total += p;
    }
    return total.m();
}

// Two-particle invariant mass (e.g., for resonance search)
G4double DileptonMass(const G4LorentzVector& lepton1,
                     const G4LorentzVector& lepton2) {
    G4LorentzVector pair = lepton1 + lepton2;
    return pair.m();
}

// Missing mass calculation
G4double MissingMass(const G4LorentzVector& initial,
                    const std::vector<G4LorentzVector>& detected) {
    G4LorentzVector totalDetected;
    for (const auto& p : detected) {
        totalDetected += p;
    }

    G4LorentzVector missing = initial - totalDetected;
    return missing.m();
}
```

### Scattering Calculations

```cpp
// Mandelstam variables
struct MandelstamVars {
    G4double s;  // (p1 + p2)²
    G4double t;  // (p1 - p3)²
    G4double u;  // (p1 - p4)²
};

MandelstamVars CalculateMandelstam(const G4LorentzVector& p1,
                                  const G4LorentzVector& p2,
                                  const G4LorentzVector& p3,
                                  const G4LorentzVector& p4) {
    MandelstamVars vars;
    vars.s = (p1 + p2).m2();
    vars.t = (p1 - p3).m2();
    vars.u = (p1 - p4).m2();
    return vars;
}

// Scattering angle in CM frame
G4double ScatteringAngleCM(const G4LorentzVector& initialLab,
                          const G4LorentzVector& finalLab,
                          const G4LorentzVector& system) {
    // Boost to CM
    G4LorentzVector initialCM = BoostToCM(initialLab, system);
    G4LorentzVector finalCM = BoostToCM(finalLab, system);

    // Calculate angle
    return initialCM.angle(finalCM.vect());
}
```

### Transverse Variables (Collider Physics)

```cpp
// Missing transverse energy
G4LorentzVector MissingET(const std::vector<G4LorentzVector>& visible) {
    G4double pxMiss = 0, pyMiss = 0;

    for (const auto& p : visible) {
        pxMiss -= p.px();
        pyMiss -= p.py();
    }

    // Assume massless for MET
    G4double ptMiss = std::sqrt(pxMiss*pxMiss + pyMiss*pyMiss);
    return G4LorentzVector(pxMiss, pyMiss, 0, ptMiss);
}

// Transverse mass (for W → lν reconstruction)
G4double TransverseMass(const G4LorentzVector& lepton,
                       const G4LorentzVector& neutrino) {
    G4double mt2 = 2 * lepton.pt() * neutrino.pt() *
                   (1 - std::cos(lepton.phi() - neutrino.phi()));
    return std::sqrt(mt2);
}

// Delta R separation (collider observable)
G4double DeltaR(const G4LorentzVector& p1,
                const G4LorentzVector& p2) {
    G4double deta = p1.eta() - p2.eta();
    G4double dphi = p1.phi() - p2.phi();

    // Wrap phi to [-pi, pi]
    while (dphi > M_PI) dphi -= 2*M_PI;
    while (dphi < -M_PI) dphi += 2*M_PI;

    return std::sqrt(deta*deta + dphi*dphi);
}
```

### Creating Particles with Specific Properties

```cpp
// Create particle from mass and kinematics
G4LorentzVector CreateParticle(G4double mass,
                              G4double pt,
                              G4double eta,
                              G4double phi) {
    // Convert to momentum components
    G4double px = pt * std::cos(phi);
    G4double py = pt * std::sin(phi);
    G4double pz = pt * std::sinh(eta);
    G4double p = pt * std::cosh(eta);
    G4double E = std::sqrt(p*p + mass*mass);

    return G4LorentzVector(px, py, pz, E);
}

// Isotropic particle in rest frame
G4LorentzVector IsotropicDecayProduct(G4double mass,
                                     G4double energy) {
    // Random direction
    G4double cosTheta = 2*G4UniformRand() - 1;
    G4double sinTheta = std::sqrt(1 - cosTheta*cosTheta);
    G4double phi = 2*M_PI*G4UniformRand();

    G4double p = std::sqrt(energy*energy - mass*mass);
    G4double px = p * sinTheta * std::cos(phi);
    G4double py = p * sinTheta * std::sin(phi);
    G4double pz = p * cosTheta;

    return G4LorentzVector(px, py, pz, energy);
}
```

## Common Patterns

### Energy from Mass and Momentum

```cpp
// Set momentum and mass, calculate energy
G4ThreeVector momentum(px, py, pz);
G4LorentzVector fourMom;
fourMom.setVectM(momentum, mass);  // Automatically calculates E
```

### Accessing Components

```cpp
// Momentum-energy notation (particle physics)
G4double E = p4.e();
G4double px = p4.px();

// Position-time notation (spacetime)
G4double t = p4.t();
G4double x = p4.x();
```

### Invariant Checks

```cpp
// Check if four-momentum is physical (m² ≥ 0)
bool IsPhysical(const G4LorentzVector& p) {
    return p.m2() >= 0;
}

// Check if timelike, spacelike, or lightlike
enum FourVectorType { TIMELIKE, SPACELIKE, LIGHTLIKE };

FourVectorType ClassifyFourVector(const G4LorentzVector& p,
                                  G4double tolerance = 1e-9) {
    G4double m2 = p.m2();
    if (m2 > tolerance) return TIMELIKE;
    if (m2 < -tolerance) return SPACELIKE;
    return LIGHTLIKE;
}
```

## Thread Safety

`G4LorentzVector` is:
- **Value type:** Copied, not shared
- **No mutable state:** Safe for concurrent use
- **Thread-safe:** Each thread has independent instances

Four-vectors can be created and manipulated safely in multi-threaded applications.

## Performance Notes

1. **Use m2() instead of m():** Avoid square root when possible
   ```cpp
   if (p.m2() < threshold*threshold) { /* ... */ }  // Fast
   if (p.m() < threshold) { /* ... */ }              // Slow
   ```

2. **Cache frequently used values:**
   ```cpp
   G4double mass = fourMom.m();  // Compute once
   // Use mass multiple times
   ```

3. **Pass by const reference:**
   ```cpp
   void Analyze(const G4LorentzVector& p);  // Good
   void Analyze(G4LorentzVector p);         // Copies 32 bytes
   ```

## Related Classes

- [G4LorentzRotation](g4lorentzrotation.md) - Lorentz transformations
- [G4ThreeVector](g4threevector.md) - 3D momentum/position vectors
- [G4DynamicParticle](g4dynamicparticle.md) - Particle state with four-momentum
- [G4Track](g4track.md) - Particle track with four-momentum

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- CLHEP HepLorentzVector documentation - Detailed CLHEP implementation
- Special Relativity - Theoretical background

---

::: info Source Reference
Type definition in:
- Header: `source/global/HEPGeometry/include/G4LorentzVector.hh`
- Implementation: CLHEP library (`CLHEP/Vector/LorentzVector.h`)
:::
