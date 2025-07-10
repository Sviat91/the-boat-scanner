/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

// Google Identity Services API types
interface GoogleAccounts {
  id: {
    initialize: (config: any) => void;
    renderButton: (element: HTMLElement, options: any) => void;
    prompt: (callback?: (notification: any) => void) => void;
    disableAutoSelect: () => void;
  };
}

interface GoogleAPI {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleAPI;
  }
}

export {};
