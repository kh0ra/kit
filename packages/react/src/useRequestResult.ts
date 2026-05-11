import { ReactiveActionStore } from '@solana/subscribable';
import { useMemo, useSyncExternalStore } from 'react';

import { RequestResult } from './useRequest';

/**
 * Subscribes to a {@link ReactiveActionStore} and maps its `idle | running | success | error`
 * lifecycle onto the {@link RequestResult} shape consumed by `useRequest`.
 *
 * `idle` is ambiguous on its own: it covers both "no source — store is disabled" and "real source,
 * dispatch effect hasn't fired yet on the current render." The `disabled` flag disambiguates:
 * disabled → `status: 'disabled'`, enabled → `status: 'loading'` (the dispatch is about to fire on
 * commit; consumers see a single `loading` paint rather than briefly flashing `disabled`).
 *
 * - `idle` + disabled → `disabled`
 * - `idle` + enabled → `loading` (`isLoading: true` — first paint, no content yet)
 * - `running` with no prior outcome → `loading` (`isLoading: true`)
 * - `running` with a prior success or failure → `loading` (`isLoading: false`, stale `data` / `error` carried)
 * - `success` → `success`
 * - `error` → `error`
 *
 * The action store's built-in stale-while-revalidate carries `state.data` and `state.error`
 * across attempts, so the bridge doesn't need to mirror them.
 *
 * @internal
 */
export function useRequestResult<T>(
    store: ReactiveActionStore<[], T>,
    refresh: (options?: { signal?: AbortSignal | undefined }) => void,
    disabled: boolean,
): RequestResult<T> {
    const state = useSyncExternalStore(store.subscribe, store.getState);
    return useMemo(() => {
        switch (state.status) {
            case 'idle':
                return disabled
                    ? { data: undefined, error: undefined, isLoading: false, refresh, status: 'disabled' }
                    : { data: undefined, error: undefined, isLoading: true, refresh, status: 'loading' };
            case 'running': {
                const hasStaleContent = state.data !== undefined || state.error !== undefined;
                return {
                    data: state.data,
                    error: state.error,
                    isLoading: !hasStaleContent,
                    refresh,
                    status: 'loading',
                };
            }
            case 'success':
                return { data: state.data, error: undefined, isLoading: false, refresh, status: 'success' };
            case 'error':
                return { data: state.data, error: state.error, isLoading: false, refresh, status: 'error' };
        }
    }, [state, refresh, disabled]);
}
