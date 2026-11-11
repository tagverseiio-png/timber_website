import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True once React has hydrated on the client. The modern replacement for the
 * `useState(false) + useEffect(setState(true))` mount-detection pattern, which
 * triggers cascading renders (react-hooks/set-state-in-effect).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
