import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="w-full text-center py-4 text-xs text-gray-400">
    © 2025 The Boat Scanner ·{' '}
    <Link to="/privacy" className="underline hover:text-gray-200">
      Privacy Policy
    </Link>{' '}
    ·{' '}
    <Link to="/terms" className="underline hover:text-gray-200">
      Terms of Service
    </Link>{' '}
    ·{' '}
    <Link to="/support" className="underline hover:text-gray-200">
      Support
    </Link>
  </footer>
);

export default Footer;
