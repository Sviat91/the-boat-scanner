import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="w-full text-center py-4 text-xs text-gray-400 mt-auto">
    © 2025 The Boat Scanner ·{' '}
    <Link to="/privacy" className="underline hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
      Privacy Policy
    </Link>
  </footer>
);

export default Footer;
