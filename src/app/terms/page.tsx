import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Terminos de Servicio - Claude Ads",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16 prose prose-invert prose-sm">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Terminos de Servicio</h1>
        <p className="text-text-dim text-xs mb-8">Ultima actualizacion: 17 de marzo de 2026</p>

        <section className="space-y-4 text-text-secondary text-sm">
          <h2 className="text-lg font-semibold text-text-primary">1. Aceptacion de los terminos</h2>
          <p>Al acceder y usar Claude Ads (&quot;el servicio&quot;), aceptas estos terminos de servicio. Si no estas de acuerdo, no uses el servicio.</p>

          <h2 className="text-lg font-semibold text-text-primary">2. Descripcion del servicio</h2>
          <p>Claude Ads es una plataforma SaaS que utiliza inteligencia artificial para generar copy publicitario y gestionar campanas en multiples plataformas de anuncios digitales, incluyendo Meta Ads, Google Ads, TikTok Ads y LinkedIn Ads.</p>

          <h2 className="text-lg font-semibold text-text-primary">3. Cuentas</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Debes proporcionar informacion precisa al registrarte.</li>
            <li>Eres responsable de mantener la seguridad de tu cuenta.</li>
            <li>Debes tener al menos 18 anos para usar el servicio.</li>
            <li>Una persona o entidad legal puede tener una sola cuenta gratuita.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">4. Planes y pagos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Plan Free:</strong> 10 generaciones/mes, 4 plataformas, 1 perfil de marca.</li>
            <li><strong>Plan Pro ($19/mes):</strong> 100 generaciones/mes, todas las plataformas, exportar, 5 perfiles.</li>
            <li><strong>Plan Agency ($49/mes):</strong> Generaciones ilimitadas, API publica, equipo ilimitado.</li>
            <li>Los pagos se procesan via Stripe. Las suscripciones se renuevan automaticamente.</li>
            <li>Puedes cancelar en cualquier momento. El acceso continua hasta el fin del periodo pagado.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">5. Uso aceptable</h2>
          <p>Al usar Claude Ads, te comprometes a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>No generar contenido ilegal, enganoso, difamatorio u ofensivo.</li>
            <li>Cumplir con las politicas publicitarias de cada plataforma donde publiques.</li>
            <li>No usar el servicio para spam o publicidad enganosa.</li>
            <li>No intentar acceder a cuentas de otros usuarios.</li>
            <li>No realizar ingenieria inversa del servicio.</li>
            <li>No exceder los limites de uso de tu plan de manera intencional.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">6. Integraciones con plataformas</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Al conectar plataformas de anuncios, autorizas a Claude Ads a actuar en tu nombre.</li>
            <li>Eres responsable del contenido publicado y del cumplimiento de las politicas de cada plataforma.</li>
            <li>Claude Ads no garantiza la aprobacion de anuncios por parte de las plataformas.</li>
            <li>Los gastos publicitarios en las plataformas corren por tu cuenta, no son parte de la suscripcion de Claude Ads.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">7. Propiedad intelectual</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>El copy generado por la IA te pertenece. Puedes usarlo libremente.</li>
            <li>Claude Ads retiene la propiedad de la plataforma, codigo, diseno y marca.</li>
            <li>No adquieres derechos sobre la tecnologia subyacente.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">8. Limitacion de responsabilidad</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>El servicio se proporciona &quot;tal como esta&quot; sin garantias.</li>
            <li>No garantizamos resultados especificos de campanas publicitarias.</li>
            <li>No somos responsables por perdidas derivadas del uso de copy generado por IA.</li>
            <li>Nuestra responsabilidad maxima se limita al monto pagado en los ultimos 12 meses.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">9. Disponibilidad</h2>
          <p>Nos esforzamos por mantener el servicio disponible 24/7, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimiento programado con aviso previo.</p>

          <h2 className="text-lg font-semibold text-text-primary">10. Terminacion</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Puedes cancelar tu cuenta en cualquier momento.</li>
            <li>Podemos suspender o terminar cuentas que violen estos terminos.</li>
            <li>Al terminar, tus datos seran eliminados segun nuestra politica de privacidad.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary">11. Modificaciones</h2>
          <p>Podemos modificar estos terminos. Los cambios significativos se notificaran con al menos 30 dias de anticipacion. El uso continuado del servicio implica aceptacion de los nuevos terminos.</p>

          <h2 className="text-lg font-semibold text-text-primary">12. Ley aplicable</h2>
          <p>Estos terminos se rigen por las leyes aplicables en la jurisdiccion del usuario. Cualquier disputa se resolvera mediante arbitraje.</p>

          <h2 className="text-lg font-semibold text-text-primary">13. Contacto</h2>
          <p>Para preguntas sobre estos terminos: <strong>legal@claudeads.com</strong></p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
