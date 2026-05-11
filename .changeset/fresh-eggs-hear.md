---
'@solana/react': minor
---

Add `useRequest` — a React hook for one-shot async reads. Pass either an async function `(signal) => Promise<T>` or a memoized `ReactiveActionSource<T>` (satisfied by `PendingRpcRequest`). The hook fires the call on mount, re-fires whenever the source identity changes, and aborts the in-flight call on cleanup.

```tsx
// `ReactiveActionSource` (e.g. `PendingRpcRequest`):
const source = useMemo(() => client.rpc.getLatestBlockhash(), [client]);
const { data, error, refresh } = useRequest(source);

// Bare async function:
const fetcher = useCallback(
    (signal: AbortSignal) => fetch(`/api/users/${userId}`, { signal }).then(r => r.json()),
    [userId],
);
const { data, error, refresh } = useRequest(fetcher);
```

The result reports `status` as one of `loading | success | error | disabled`. A request in flight is always `loading`; the `isLoading` boolean disambiguates "first load with nothing to show" (`true`) from "refresh in flight with stale `data`/`error` still visible" (`false`). Pass `null` for the source to gate the request off — useful while inputs aren't yet known. The result then reports `status: 'disabled'`.

Optional `perRequestSignal: () => AbortSignal` is a factory invoked on every attempt (initial fire + every `refresh()`). Each attempt gets a fresh signal that's composed with the store's internal per-dispatch controller via `AbortSignal.any`. The natural use is per-attempt timeouts: `perRequestSignal: () => AbortSignal.timeout(5_000)` gives every attempt its own 5-second clock that resets on refresh. The factory is held in a ref synced to the latest render, so inline closures are fine — no `useCallback` needed. `refresh()` also accepts an optional `{ signal }` override to replace the factory for one specific attempt.

The new `RequestResult<T>` and `UseRequestOptions` types are exported alongside the hook so plugin hooks built on top can declare their return shape against them.
