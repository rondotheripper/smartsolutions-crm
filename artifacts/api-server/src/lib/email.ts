import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFICATION_EMAIL = "diogoagrelos0511@gmail.com";
const FROM_EMAIL = "SmartSolutions CRM <onboarding@resend.dev>";

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

export async function sendFollowupNotification(opts: {
  clientName: string;
  companyName: string;
  scheduledAt: string;
  reason: string;
  priority: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping email notification.");
    return;
  }

  const priorityLabel: Record<string, string> = {
    alta: "🔴 Alta",
    media: "🟡 Média",
    baixa: "🔵 Baixa",
  };

  const date = new Date(opts.scheduledAt);
  const formattedDate = date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    console.log(`[email] Sending follow-up notification to ${NOTIFICATION_EMAIL} for client: ${opts.clientName}`);
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `Follow-up agendado: ${opts.clientName} — ${formattedDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0B0B; color: #F5F5F5; border-radius: 12px; overflow: hidden;">
          <div style="background: #E60000; padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 20px; color: white;">SmartSolutions CRM</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">Follow-up agendado</p>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px; width: 140px;">Cliente</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 15px;">${opts.clientName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px;">Empresa</td>
                <td style="padding: 10px 0;">${opts.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px;">Data / Hora</td>
                <td style="padding: 10px 0; font-weight: bold; color: #E60000;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px;">Assunto</td>
                <td style="padding: 10px 0;">${opts.reason}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888; font-size: 13px;">Prioridade</td>
                <td style="padding: 10px 0;">${priorityLabel[opts.priority] ?? opts.priority}</td>
              </tr>
            </table>
          </div>
          <div style="padding: 16px 32px; border-top: 1px solid #2a2a2a; color: #555; font-size: 12px;">
            SmartSolutions CRM — Notificação automática
          </div>
        </div>
      `,
    });
    console.log("[email] Resend response:", JSON.stringify(response));
  } catch (err) {
    console.error("[email] Failed to send follow-up notification:", err);
  }
}
