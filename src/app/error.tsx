"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-bold">Something went wrong!</h2>
          <p className="text-sm text-gray-600">{error.message}</p>
          <button
            onClick={() => reset()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
