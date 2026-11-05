import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      {/* Big 404 */}
      <div className="select-none mb-6">
        <span className="text-[80px] sm:text-[120px] font-black leading-none"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Page not found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="btn-secondary gap-2">
          <ArrowLeft size={15} /> Go back
        </button>
        <Link to="/projects" className="btn-primary gap-2">
          <Home size={15} /> Home
        </Link>
      </div>
    </div>
  );
}
