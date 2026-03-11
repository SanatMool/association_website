import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center text-center px-4 pt-20">
      <div>
        <div className="w-20 h-20 bg-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <span className="font-serif text-navy-900 font-bold text-4xl">E</span>
        </div>
        <h1 className="font-serif text-7xl font-bold text-white mb-4">404</h1>
        <h2 className="font-serif text-2xl text-white/80 mb-4">Page Not Found</h2>
        <p className="text-white/50 mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-7 py-3 rounded-xl transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
