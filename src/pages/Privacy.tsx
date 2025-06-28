import { Helmet } from 'react-helmet';
import ReactMarkdown from 'react-markdown';
import Footer from '@/components/Footer';
import privacyPolicy from '../../privacy_policy.md?raw';

const Privacy = () => (
  <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
    <Helmet>
      <title>Privacy Policy – The Boat Scanner</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <main className="flex-grow prose dark:prose-invert max-w-prose mx-auto px-4 py-8">
      <ReactMarkdown>{privacyPolicy}</ReactMarkdown>
    </main>
    <Footer />
  </div>
);

export default Privacy;
