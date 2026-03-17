import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Politica de Privacidad - Claude Ads",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16 prose prose-invert prose-sm">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Politica de Privacidad</h1>
        <p className="text-text-dim text-xs mb-8">Ultima actualizacion: 17 de marzo de 2026</p>

        <section className="space-y-4 text-text-secondary text-sm">
          <h2 className="text-lg font-semibold text-text-primary">1. Informacion que recopilamos</h2>
          <p>Claude Ads (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la plataforma&quot;) recopila la siguiente informacion cuando usas nuestro servicio:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Informacion de cuenta:</strong> Nombre, direccion de email y foto de perfil cuando te registras via Google OAuth o magic link.</li>
            <li><strong>Datos de uso:</strong> Informacion sobre como usas la plataforma, incluyendo generaciones realizadas, plataformas seleccionadas y preferencias.</li>
            <li><strong>Cuentas publicitarias conectadas:</strong> Cuando conectas tus cuentas de Meta Ads, Google Ads, TikTok Ads o LinkedIn Ads, almacenamos tokens de acceso encriptados (AES-256-GCM) para operar en tu nombre.</li>
            <li><strong>Contenido generado:</strong> Los textos publicitarios que generas y las configuraciones de campanas que creas.</li>
            <li><strong>Datos de pago:</strong> Procesados directamente por Stripe. No almacenamos numeros de tarjeta.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">2. Como usamos tu informacion</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proveer y mejorar el servicio de generacion de copy publicitario.</li>
            <li>Crear, gestionar y optimizar campanas publicitarias en las plataformas conectadas.</li>
            <li>Leer metricas de rendimiento de tus campanas para analisis y optimizacion.</li>
            <li>Enviar notificaciones relacionadas con tu cuenta (uso, limites, facturacion).</li>
            <li>Cumplir con obligaciones legales.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">3. Integraciones con plataformas de anuncios</h2>
          <p>Cuando conectas una plataforma publicitaria:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Meta Ads:</strong> Solicitamos permisos de <code>ads_management</code>, <code>ads_read</code> y <code>business_management</code> para crear campanas y leer metricas en tu nombre.</li>
            <li><strong>Google Ads:</strong> Solicitamos acceso via OAuth con scope <code>adwords</code> para gestionar campanas.</li>
            <li><strong>TikTok Ads:</strong> Solicitamos permisos de creacion y lectura de campanas y reportes.</li>
            <li><strong>LinkedIn Ads:</strong> Solicitamos permisos <code>r_ads</code>, <code>rw_ads</code> y <code>r_ads_reporting</code>.</li>
          </ul>
          <p>Puedes desconectar cualquier plataforma en cualquier momento desde la seccion de Integraciones. Al desconectar, revocamos el acceso y eliminamos los tokens almacenados.</p>

          <h2 className="text-lg font-semibold text-text-primary">4. Almacenamiento y seguridad</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Los datos se almacenan en Supabase (infraestructura AWS) con encriptacion en reposo.</li>
            <li>Los tokens de acceso de plataformas se encriptan con AES-256-GCM antes de almacenarse.</li>
            <li>Las comunicaciones se realizan exclusivamente via HTTPS/TLS.</li>
            <li>Los datos de pago son procesados por Stripe bajo su propia politica de seguridad PCI-DSS.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">5. Comparticion de datos</h2>
          <p>No vendemos ni compartimos tu informacion personal con terceros, excepto:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Proveedores de IA:</strong> Los prompts se envian a Google Gemini o Anthropic Claude para generar copy. No incluyen datos personales.</li>
            <li><strong>Plataformas publicitarias:</strong> Los datos de campana se envian a la plataforma que selecciones (Meta, Google, TikTok, LinkedIn).</li>
            <li><strong>Procesador de pagos:</strong> Stripe procesa los pagos de suscripcion.</li>
            <li><strong>Requerimiento legal:</strong> Si la ley lo exige.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">6. Retencion de datos</h2>
          <p>Retenemos tu informacion mientras tu cuenta este activa. Al eliminar tu cuenta, eliminamos todos los datos asociados dentro de 30 dias, excepto lo requerido por ley.</p>

          <h2 className="text-lg font-semibold text-text-primary">7. Tus derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acceder a tus datos personales.</li>
            <li>Corregir informacion inexacta.</li>
            <li>Solicitar la eliminacion de tu cuenta y datos.</li>
            <li>Desconectar plataformas publicitarias en cualquier momento.</li>
            <li>Exportar tus datos generados.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">8. Cookies</h2>
          <p>Usamos cookies esenciales para autenticacion y sesion. Opcionalmente usamos PostHog para analytics anonimos del producto.</p>

          <h2 className="text-lg font-semibold text-text-primary">9. Cambios a esta politica</h2>
          <p>Podemos actualizar esta politica periodicamente. Notificaremos cambios significativos por email o dentro de la plataforma.</p>

          <h2 className="text-lg font-semibold text-text-primary">10. Contacto</h2>
          <p>Para preguntas sobre privacidad, contactanos en: <strong>privacy@claudeads.com</strong></p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
