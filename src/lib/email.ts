import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Claude Ads <noreply@claudeads.com>";

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Bienvenido a Claude Ads",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">Bienvenido a Claude Ads, ${name}!</h1>
        <p>Gracias por unirte. Ya puedes empezar a generar copy publicitario profesional con IA.</p>
        <p>Tu plan gratuito incluye 10 generaciones por mes. Si necesitas mas, consulta nuestros planes Pro y Agency.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/generate" style="display: inline-block; background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Empezar a generar</a>
      </div>
    `,
  });
}

export async function sendUsageAlertEmail(to: string, used: number, limit: number) {
  const pct = Math.round((used / limit) * 100);
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Has usado el ${pct}% de tus generaciones`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Alerta de uso</h2>
        <p>Has usado <strong>${used} de ${limit}</strong> generaciones este mes (${pct}%).</p>
        <p>Considera actualizar tu plan para no quedarte sin generaciones.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/billing" style="display: inline-block; background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver planes</a>
      </div>
    `,
  });
}

export async function sendUpgradeNudgeEmail(to: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Desbloquea todo el potencial de Claude Ads",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Llegaste al limite</h2>
        <p>Has agotado tus generaciones gratuitas de este mes.</p>
        <p>Con <strong>Pro ($19/mes)</strong> obtienes 100 generaciones, todas las plataformas, exportar y mas.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="display: inline-block; background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Actualizar ahora</a>
      </div>
    `,
  });
}
