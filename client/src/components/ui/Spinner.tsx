export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5 border' : size === 'lg' ? 'w-8 h-8 border-2' : 'w-5 h-5 border-2';
  return <span className={`${cls} inline-block border-current border-t-transparent rounded-full animate-spin`} aria-label="Loading" />;
}
