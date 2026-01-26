interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_APP_VERSION?: string;
  readonly APP_VERSION?: string;
  readonly VITE_VIBEUSAGE_HTTP_TIMEOUT_MS?: string;
  readonly VITE_VIBEUSAGE_MOCK?: string;
  readonly VITE_VIBEUSAGE_MOCK_NOW?: string;
  readonly VITE_VIBEUSAGE_MOCK_TODAY?: string;
  readonly VITE_VIBEUSAGE_MOCK_SEED?: string;
  readonly VITE_VIBEUSAGE_MOCK_MISSING?: string;
  readonly VITE_VIBEUSAGE_INSFORGE_BASE_URL?: string;
  readonly VITE_INSFORGE_BASE_URL?: string;
  readonly VITE_VIBEUSAGE_INSFORGE_ANON_KEY?: string;
  readonly VITE_INSFORGE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "react" {
  export type Dispatch<T> = (value: T) => void;
  export type SetStateAction<T> = T | ((prev: T) => T);
  export type DependencyList = ReadonlyArray<unknown>;
  export function useState<T>(initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
  export function useEffect(effect: () => void | (() => void), deps?: DependencyList): void;
  export function useMemo<T>(factory: () => T, deps: DependencyList): T;
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: DependencyList,
  ): T;
  export function useRef<T>(value: T): { current: T };
}
