import { useEffect, useState } from 'react';

/**
 * One request, three answers.
 *
 * Phase 2 read everything synchronously because everything was a fixture. It is the internet
 * now, so it is a promise — and a promise has a loading state and a failure state whether or
 * not a screen wants them. This is the whole of that, written once, so nine screens do not each
 * invent their own version.
 */
export type Resource<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'failed'; error: string };

export function useResource<T>(load: () => Promise<T>, deps: unknown[]): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>({ status: 'loading' });

  useEffect(() => {
    /*
     * He clicks Area 3, changes his mind, clicks Area 5. If the slower first request lands last
     * it overwrites the second, and the screen shows Collections under a heading that reads
     * State and Objects — a bug that only appears on a slow link, which is the one link this
     * runs over: his laptop to the parent's machine across the house.
     */
    let current = true;
    setResource({ status: 'loading' });

    load().then(
      (value) => {
        if (current) setResource({ status: 'ready', value });
      },
      (cause: unknown) => {
        if (current) {
          setResource({
            status: 'failed',
            error: cause instanceof Error ? cause.message : String(cause),
          });
        }
      },
    );

    return () => {
      current = false;
    };
    // `load` is a fresh closure every render; the deps the caller names are the real ones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return resource;
}
