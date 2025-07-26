import React from 'react';

interface Props {
  theme?: string;
}

const GoogleSignInButton: React.FC<Props> = ({ theme }) => (
  <button data-testid="google-signin-button" data-theme={theme}>
    Sign in with Google
  </button>
);

export default GoogleSignInButton;