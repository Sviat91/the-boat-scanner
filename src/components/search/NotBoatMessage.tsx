interface NotBoatMessageProps {
  message: string;
}

export function NotBoatMessage({ message }: NotBoatMessageProps) {
  if (!message) return null;

  return (
    <div className='rounded bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4 text-red-800 dark:text-red-200'>
      {message}
    </div>
  );
}
