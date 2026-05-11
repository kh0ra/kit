/* eslint-disable react-hooks/rules-of-hooks */

import { ReactiveActionSource } from '@solana/subscribable';

import { RequestResult, useRequest } from '../useRequest';

const slotSource = null as unknown as ReactiveActionSource<{ slot: bigint }>;

// [DESCRIBE] useRequest
{
    // Infers T from the source
    useRequest(slotSource) satisfies RequestResult<{ slot: bigint }>;

    // The source argument accepts null
    useRequest<{ slot: bigint }>(null) satisfies RequestResult<{ slot: bigint }>;

    // Options accept a `perRequestSignal` factory
    useRequest(slotSource, { perRequestSignal: () => AbortSignal.timeout(5_000) });

    // `refresh` accepts no args (uses the factory), an `{ signal }` override, or `{ signal: undefined }`
    // to opt out of the factory entirely.
    const { refresh } = useRequest(slotSource);
    refresh();
    refresh({ signal: AbortSignal.timeout(1_000) });
    refresh({ signal: undefined });
    // @ts-expect-error - signal must be an AbortSignal (or undefined)
    refresh({ signal: 'nope' });
}
