## Purpose

This glossary defines the **authoritative vocabulary** for the system.

All terms are:

* **Normative** (must be followed in code and UI)
* **Programmatically enforceable** where possible
* **Cross-domain consistent** (math ↔ music ↔ UI ↔ implementation)

Any ambiguity between terms is considered a **defect**.

---

## Term: Distance

**Domain(s):**

* Metric Space
* Graph Theory
* Music Theory
* UI

**Definition (Formal):**
A function `d: X × X → ℝ` such that:

1. `d(x,y) ≥ 0`
2. `d(x,y) = 0 ⇔ x ≡ y` (under canonical equivalence)
3. `d(x,y) = d(y,x)`
4. `d(x,z) ≤ d(x,y) + d(y,z)`

**Definition (Musical):**
The minimal total voice-leading motion between two **canonical pitch-class sets**.

**Definition (UI Contract):**
A scalar cost used for:

* ranking
* pathfinding
* clustering

**Distance MUST NOT be inferred from visual spacing.**

**Invariants (Testable):**

* Triangle inequality holds for all triples
* Symmetry holds
* `d(A,B) = 0 ⇒ canonicalize(A) === canonicalize(B)`
* Transposition invariance:

  ```
  d(T(A), T(B)) = d(A,B)
  ```

**Examples:**

* `d([0,4,7], [0,3,7]) = 1`

**Related Code:**

* `voice-leading/utils/chordDistance.ts`

---

## Term: Metric

**Domain(s):**

* Metric Space

**Definition (Formal):**
A pair `(X, d)` where `d` satisfies all metric axioms.

**System Role:**
Defines the **global geometry** of the application.

**Invariants:**

* All distance computations MUST use the same metric instance
* Changing the metric is a **breaking system-wide change**

**Engineering Constraint:**

* Metric must be injected/configured centrally (no local overrides)

---

## Term: Node

**Domain(s):**

* Graph Theory

**Definition (Formal):**
An element `v ∈ V` in graph `G = (V, E)`.

**Definition (System):**
A **canonical pitch-class set instance**

**UI Representation:**
A rendered shape derived from the set

**Invariants:**

* 1:1 mapping:

  ```
  node.id ↔ canonicalPitchClassSet
  ```
* Stable identity across renders

---

## Term: Edge

**Domain(s):**

* Graph Theory

**Definition (Formal):**
A pair `(u, v)` with optional weight `w`.

**Definition (System):**
A valid transformation between two nodes

**Invariants:**

* `weight(u,v) = d(u,v)`
* Symmetry:

  ```
  weight(u,v) = weight(v,u)
  ```

---

## Term: Path

**Domain(s):**

* Graph Theory

**Definition (Formal):**
A sequence of nodes `[v₀, v₁, ..., vₙ]`

**System Meaning:**
A harmonic progression

**Invariant:**

```
cost(path) = Σ d(vᵢ, vᵢ₊₁)
```

---

## Term: Geodesic

**Domain(s):**

* Metric Space
* Graph Theory

**Definition (Formal):**
A path minimizing total distance

**System Meaning:**
Optimal voice-leading progression

**Invariants:**

* No alternative path has lower cost
* Non-uniqueness allowed

---

## Term: Pitch Class

**Domain(s):**

* Music Theory

**Definition (Formal):**
An integer in ℤ₁₂

**Invariants:**

* Values ∈ `{0,…,11}`
* All operations are modulo 12

---

## Term: Pitch-Class Set

**Domain(s):**

* Music Theory
* Set Theory

**Definition (Formal):**
A set `S ⊆ ℤ₁₂`

**Invariants:**

* No duplicates
* Order-independent
* Equality is set equality (not array equality)

---

## Term: Chord

**Domain(s):**

* Music Theory

**Definition (Formal):**
A tuple:

```
Chord = (PitchClassSet, Interpretation)
```

**Interpretation Includes:**

* root
* quality
* extensions

**Critical Rule:**
A chord is **not equal** to its pitch-class set.

---

## Term: Root

**Domain(s):**

* Music Theory

**Definition:**
A selected pitch class used as an interpretive reference

**Invariants:**

* Optional
* Not derivable from structure alone
* Must not affect:

  * equality
  * distance

---

## Term: Transposition

**Domain(s):**

* Music Theory
* Group Theory

**Definition:**

```
Tₙ(x) = (x + n) mod 12
```

**Invariant:**

* Isometry:

  ```
  d(Tₙ(A), Tₙ(B)) = d(A,B)
  ```

---

## Term: Inversion

**Domain(s):**

* Music Theory

**Definition:**

```
I(x) = (-x) mod 12
```

**Invariant:**

* Distance preserved **iff metric is inversion-invariant**

---

## Term: Recontextualization

**Domain(s):**

* Music Theory
* UI

**Definition:**
A relabeling operation over a fixed pitch-class set

**System Meaning:**

* Changes chord name / root
* Does not change structure

**Invariants:**

* Structural identity preserved
* Distance invariant:

  ```
  d(A,B) = 0
  ```

**Test Condition:**

```
canonicalize(A) === canonicalize(B)
```

---

## Term: Canonicalization

**Domain(s):**

* Computer Science
* Mathematics

**Definition:**
A function:

```
canonicalize: X → X̂
```

mapping all equivalent inputs to a unique representative

**Invariants:**

* Idempotent:

  ```
  f(f(x)) = f(x)
  ```
* Equality guarantee:

  ```
  x ~ y ⇒ f(x) === f(y)
  ```

---

## Term: Shape

**Domain(s):**

* UI
* Geometry

**Definition:**
A geometric encoding of a **pitch-class set**

**Critical Constraint:**
Shape MUST NOT encode:

* root
* chord naming
* interpretation

---

## Term: Embedding

**Domain(s):**

* Mathematics

**Definition:**
A mapping:

```
f: X → Y
```

**System Meaning:**
Mapping harmonic structures into visual space

**Invariants:**

* Must explicitly declare:

  * metric-preserving OR
  * non-metric-preserving

---

## Term: Chromatic Circle

**Domain(s):**

* Music Theory
* UI

**Definition:**
A cyclic embedding of ℤ₁₂

---

# Critical Distinctions (Normative)

## Transformation vs Recontextualization

| Type                     | Distance  | Structural Change |
| ------------------------ | --------- | ----------------- |
| Transformation           | ≥ 0       | Yes               |
| Isometric Transformation | preserved | Yes               |
| Recontextualization      | 0         | No                |

---

## Chord vs Pitch-Class Set

* Pitch-class set → **structure**
* Chord → **structure + interpretation**

Violating this distinction introduces semantic bugs.

---

## Canonical vs Display

| Layer     | Purpose             |
| --------- | ------------------- |
| Canonical | computation         |
| Display   | user interpretation |

They MUST be decoupled.

---

## Metric Distance vs Visual Proximity

These are **independent systems**.

It is a defect if:

* UI implies metric meaning without explicit mapping

---

# JSDoc Contract

```ts
/**
 * Computes metric distance.
 * MUST satisfy all invariants in glossary#distance
 */
function chordDistance(a, b) {}

/**
 * Returns canonical representative.
 * MUST be idempotent.
 */
function canonicalizeChord(chord) {}
```

---

# Audit Rules (Enforceable)

The following are **lint-level violations**:

1. Using “chord” when “pitch-class set” is intended
2. Using visual spacing as distance
3. Treating root as structural
4. Calling relabeling a transformation
5. Encoding interpretation in shape

---

# Design Principle

This glossary is a **specification**, not documentation.

Every term must support at least one of:

* a unit test
* a type constraint
* a runtime assertion
