/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

// Google Identity Services API types
interface GoogleIdConfig {
  client_id: string;
  callback: (response: { credential: string }) => void;
  ux_mode?: 'popup' | 'redirect';
  auto_select?: boolean;
  itp_support?: boolean;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  type?: 'standard' | 'icon';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface GooglePromptNotification {
  isDisplayed(): boolean;
  isNotDisplayed(): boolean;
  getNotDisplayedReason(): string;
  isSkippedMoment(): boolean;
  getSkippedReason(): string;
  isDismissedMoment(): boolean;
  getDismissedReason(): string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: GoogleIdConfig) => void;
    renderButton: (element: HTMLElement, options: GoogleButtonConfig) => void;
    prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
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
