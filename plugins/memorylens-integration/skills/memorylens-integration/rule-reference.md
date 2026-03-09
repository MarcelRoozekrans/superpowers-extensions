# MemoryLens Rule Reference

Quick reference for the 10 built-in analysis rules. Use **`get_rules`** for live metadata including per-project overrides.

## Critical

### ML001 — Event Handler Leak

**Category:** Leak
**Trigger:** Event handler subscriptions without corresponding unsubscriptions.
**Impact:** Objects retained indefinitely via event delegate chains.
**Fix pattern:** Unsubscribe in `Dispose()` or use weak event pattern.

### ML002 — Static Collection Growing Unbounded

**Category:** Leak
**Trigger:** Static `List<T>`, `Dictionary<K,V>`, or `ConcurrentDictionary<K,V>` that only grows.
**Impact:** Unbounded memory growth over application lifetime.
**Fix pattern:** Add eviction policy, use `ConditionalWeakTable`, or scope the collection lifetime.

## High

### ML003 — Disposable Object Not Disposed

**Category:** Leak
**Trigger:** `IDisposable` instances that are not disposed or wrapped in `using`.
**Impact:** Unmanaged resources (connections, handles, streams) not released.
**Fix pattern:** Add `using` statement or `Dispose()` call. Consider `IAsyncDisposable` for async resources.

### ML004 — Large Object Heap Fragmentation

**Category:** Fragmentation
**Trigger:** Frequent allocation and deallocation of objects > 85KB on the LOH.
**Impact:** Memory fragmentation leading to `OutOfMemoryException` despite available memory.
**Fix pattern:** Use `ArrayPool<T>`, pre-allocate buffers, or enable LOH compaction via `GCSettings.LargeObjectHeapCompactionMode`.

## Medium

### ML005 — Object Retained Longer Than Expected

**Category:** Retention
**Trigger:** Objects surviving more GC generations than expected for their usage pattern.
**Impact:** Increased memory pressure, longer GC pauses.
**Fix pattern:** Review object lifetime scope. Consider `ObjectPool<T>` for frequently created/destroyed objects.

### ML006 — Excessive Allocations in Hot Path

**Category:** Allocation
**Trigger:** High allocation rate in frequently executed code paths.
**Impact:** GC pressure, potential GC pauses affecting latency.
**Fix pattern:** Use `Span<T>`, `stackalloc`, `ArrayPool<T>`, or cache computed values.

### ML007 — Closure Retaining Unexpected References

**Category:** Retention
**Trigger:** Lambda/delegate closures capturing variables with longer lifetimes than intended.
**Impact:** Objects retained by closure scope even after logical use ends.
**Fix pattern:** Extract captured variables to local scope, use static lambdas where possible.

## Low

### ML008 — Array/List Resizing Without Capacity Hint

**Category:** Allocation
**Trigger:** `List<T>` or `StringBuilder` growing through repeated resizing without initial capacity.
**Impact:** Unnecessary allocations and copies during growth.
**Fix pattern:** Provide initial capacity when the approximate size is known.

### ML009 — Finalizer Without Dispose Pattern

**Category:** Pattern
**Trigger:** Class has a finalizer (`~ClassName`) but does not implement `IDisposable`.
**Impact:** Objects promoted to Gen2 for finalization, delayed cleanup.
**Fix pattern:** Implement the full Dispose pattern (`IDisposable` + `Dispose(bool)` + `GC.SuppressFinalize`).

### ML010 — String Interning Opportunity

**Category:** Pattern
**Trigger:** Many duplicate string instances with identical content.
**Impact:** Unnecessary memory usage for repeated strings.
**Fix pattern:** Use `string.Intern()` for known repeated values, or use `StringPool` from CommunityToolkit.

## Per-Project Configuration

Create `.memorylens.json` in your project root to customize rules:

```json
{
  "rules": {
    "ML001": { "enabled": true, "severity": "critical" },
    "ML006": { "enabled": false },
    "ML010": { "severity": "medium" }
  }
}
```
