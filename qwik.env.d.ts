// This file can be used to add references for global types like `vite/client`.

// Add global `vite/client` types. For more info, see: https://vitejs.dev/guide/features#client-types
/// <reference types="vite/client" />

declare global {
  interface Window {
    THREE: any;
    jsyaml: any;
    IS_LOGGED_IN?: boolean;
    PORTAL_DATA?: any;
    app?: any;
  }
  const THREE: any;
  const jsyaml: any;
}

export {};
