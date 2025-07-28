import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import policy from '@/assets/privacy_policy.md?raw';

export default function Privacy() {
  return (
    <main className='flex justify-center px-4 py-12'>
      <div className='prose dark:prose-invert max-w-prose bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8'>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{policy}</ReactMarkdown>
      </div>
    </main>
  );
}
