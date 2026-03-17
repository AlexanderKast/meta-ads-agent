import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Eliminacion de Datos - Claude Ads",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Solicitud de Eliminacion de Datos</h1>

        <div className="space-y-6 text-text-secondary text-sm">
          <p>
            De acuerdo con las politicas de Meta Platform y regulaciones de privacidad aplicables,
            puedes solicitar la eliminacion de todos tus datos almacenados en Claude Ads.
          </p>

          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Que datos eliminamos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Informacion de tu cuenta (nombre, email)</li>
              <li>Tokens de acceso de plataformas conectadas (Meta, Google, TikTok, LinkedIn)</li>
              <li>Historial de generaciones de copy</li>
              <li>Templates guardados</li>
              <li>Perfiles de marca</li>
              <li>Campanas y metricas almacenadas</li>
              <li>Datos de facturacion (se notifica a Stripe para eliminacion)</li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Como solicitar eliminacion</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Desde la app:</strong> Ve a tu Dashboard {'->'} Configuracion {'->'} Eliminar cuenta.
                Esto eliminara todos tus datos inmediatamente.
              </li>
              <li>
                <strong>Por email:</strong> Envia un email a <strong>privacy@claudeads.com</strong> con
                el asunto &quot;Solicitud de eliminacion de datos&quot; incluyendo el email de tu cuenta.
              </li>
            </ol>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Plazos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Eliminacion inmediata de datos operativos al procesar la solicitud.</li>
              <li>Eliminacion de backups dentro de 30 dias.</li>
              <li>Confirmacion por email una vez completada la eliminacion.</li>
            </ul>
          </div>

          <p className="text-text-dim text-xs">
            URL de callback para eliminacion de datos de Meta: <code>{process.env.NEXT_PUBLIC_APP_URL || "https://claudeads.com"}/data-deletion</code>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
