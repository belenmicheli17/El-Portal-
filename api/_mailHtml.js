// Diseño común de los mails escritos en código (colores y letra del Portal).
// Brevo los manda igual; esto es solo el HTML. Lo usan enviar-mail.js y recordatorio-perfil.js.
// Empieza con "_" para que Vercel no lo publique como una función aparte.
export const escaparHtml = (t) => String(t || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// botonSecundario / enlaceSecundario (opcionales): un segundo botón, con borde, debajo del principal
export function armarMailHtml({ titulo, parrafos, boton, enlace, posdata, botonSecundario = '', enlaceSecundario = '' }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;padding:0;background:#F4F7F7;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F7;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:24px;overflow:hidden;">
        <tr><td style="background:#1A3D3D;padding:22px 32px;">
          <span style="font-size:18px;font-weight:bold;color:#FFFFFF;letter-spacing:0.5px;">El Portal Veterinario</span>
        </td></tr>
        <tr><td style="padding:32px 32px 8px 32px;">
          <h1 style="margin:0 0 18px 0;font-size:24px;line-height:1.25;color:#1A3D3D;">${escaparHtml(titulo)}</h1>
          ${parrafos.map((p) => `<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#333333;">${p}</p>`).join('')}
        </td></tr>
        <tr><td style="padding:12px 32px 28px 32px;">
          <a href="${enlace}" style="display:inline-block;background:#2D6A6A;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:14px;">${escaparHtml(boton)}</a>
          ${botonSecundario && enlaceSecundario ? `<br><a href="${enlaceSecundario}" style="display:inline-block;margin-top:12px;background:#FFFFFF;color:#2D6A6A;text-decoration:none;font-size:16px;font-weight:bold;padding:12px 26px;border-radius:14px;border:2px solid #2D6A6A;">${escaparHtml(botonSecundario)}</a>` : ''}
        </td></tr>
        ${posdata ? `<tr><td style="padding:0 32px 28px 32px;"><p style="margin:0;font-size:14px;line-height:1.6;color:#666666;">${posdata}</p></td></tr>` : ''}
        <tr><td style="background:#FFFFFF;border-top:1px solid #E8EFEF;padding:18px 32px;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#666666;">Portal Veterinario · <a href="https://www.portalveterinario.ar" style="color:#2D6A6A;">portalveterinario.ar</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
