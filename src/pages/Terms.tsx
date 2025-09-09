import tos from '@/assets/terms_of_service.md?raw';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Terms() {
  return (
    <main className='flex justify-center px-4 py-12'>
      <div className='prose dark:prose-invert max-w-prose bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8'>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{tos}</ReactMarkdown>
      </div>
    </main>
  );
}
