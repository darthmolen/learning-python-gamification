import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useResource } from './useResource.ts';

/**
 * Everything the SPA reads is a request now, and a request has three answers rather than one.
 * This is the whole of that, so nine screens do not each invent their own version of it.
 */
describe('useResource', () => {
  it('starts loading', () => {
    const { result } = renderHook(() => useResource(() => new Promise<number>(() => {}), []));
    expect(result.current.status).toBe('loading');
  });

  it('resolves to the value', async () => {
    const { result } = renderHook(() => useResource(() => Promise.resolve(41 + 1), []));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toEqual({ status: 'ready', value: 42 });
  });

  it('reports a failure rather than throwing it at the screen', async () => {
    const { result } = renderHook(() => useResource(() => Promise.reject(new Error('no route')), []));

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current).toEqual({ status: 'failed', error: 'no route' });
  });

  it('reloads when its dependencies change', async () => {
    let area = 3;
    const { result, rerender } = renderHook(() => useResource(() => Promise.resolve(area), [area]));

    await waitFor(() => expect(result.current).toEqual({ status: 'ready', value: 3 }));

    area = 5;
    rerender();
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', value: 5 }));
  });

  /**
   * He clicks Area 3, changes his mind, clicks Area 5. If the slower first request is allowed to
   * land last it overwrites the second, and the screen shows Collections under a heading that
   * says State and Objects. The stale one is discarded rather than raced.
   */
  it('ignores a slow answer to a question that was already replaced', async () => {
    let resolveFirst: (n: number) => void = () => {};
    let call = 0;

    const { result, rerender } = renderHook(({ key }: { key: number }) =>
      useResource(() => {
        call += 1;
        return call === 1
          ? new Promise<number>((resolve) => { resolveFirst = resolve; })
          : Promise.resolve(key);
      }, [key]),
      { initialProps: { key: 3 } },
    );

    rerender({ key: 5 });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', value: 5 }));

    resolveFirst(3);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toEqual({ status: 'ready', value: 5 });
  });
});
