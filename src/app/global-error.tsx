"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Algo salio mal</h2>
            <p className="text-gray-400 text-sm">{error.message || "Error inesperado"}</p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-semibold text-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
