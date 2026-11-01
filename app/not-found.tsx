import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-timber-beige min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <p className="font-serif text-7xl text-timber-darkwood mb-4">404</p>
        <h1 className="font-serif text-3xl text-timber-darkwood mb-3">Piece not found</h1>
        <p className="text-timber-muted mb-8">
          The page you were looking for has been moved, sold out, or never existed. Our catalog is
          always worth a browse though.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/shop"
            className="inline-block px-8 py-3 bg-timber-darkwood text-timber-beige"
          >
            Browse the Shop
          </Link>
          <Link
            href="/categories"
            className="inline-block px-8 py-3 border border-timber-darkwood text-timber-darkwood"
          >
            All Categories
          </Link>
          <Link
            href="/"
            className="inline-block px-8 py-3 border border-timber-darkwood/30 text-timber-muted"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
