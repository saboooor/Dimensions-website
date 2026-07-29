// This file can be used to add references for global types like `vite/client`.

// Add global `vite/client` types. For more info, see: https://vitejs.dev/guide/features#client-types
/// <reference types="vite/client" />

declare global {
  interface Window {
    THREE: unknown;
    jsyaml: unknown;
    IS_LOGGED_IN?: boolean;
    PORTAL_DATA?: unknown;
    app?: unknown;
  }
  const THREE: unknown;
  const jsyaml: unknown;
}

declare module 'minecraft-assets' {
  const mcAssets: (version: string) => {
    directory: string;
    [key: string]: any;
  };
  export default mcAssets;
}

export {};
