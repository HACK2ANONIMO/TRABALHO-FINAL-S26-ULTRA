// ============================================================
// js/server/replitMail.js — Envio de emails via Replit Mail
// ------------------------------------------------------------
// Usa o serviço nativo de envio de emails do Replit (não exige
// SMTP nem credenciais externas).
//
// Suporta dois cenários:
//   1) Sem `to`  — envia para a caixa de correio verificada da
//                  conta Replit (a "nossa" caixa da escola).
//   2) Com `to`  — envia também para o(s) endereço(s) indicado(s)
//                  (string ou array). Útil para confirmar a
//                  inscrição ao próprio candidato.
// ============================================================

const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const execFileP = promisify(execFile);

/**
 * Obtém um token de identidade temporário para autenticar o pedido.
 */
async function getAuthToken() {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    if (!hostname) {
        throw new Error('REPLIT_CONNECTORS_HOSTNAME não definido — Replit Mail só funciona dentro do Replit.');
    }
    const { stdout } = await execFileP(
        'replit',
        ['identity', 'create', '--audience', `https://${hostname}`],
        { encoding: 'utf8' }
    );
    const token = stdout.trim();
    if (!token) throw new Error('Token de identidade Replit não obtido.');
    return { authToken: `Bearer ${token}`, hostname };
}

/**
 * Envia um email via Replit Mail.
 * @param {{
 *   subject:string,
 *   text?:string,
 *   html?:string,
 *   to?:string|string[],
 *   cc?:string|string[]
 * }} message
 */
async function sendEmail(message) {
    const { hostname, authToken } = await getAuthToken();
    const payload = {
        subject: message.subject,
        text: message.text,
        html: message.html,
    };
    if (message.to)  payload.to  = message.to;
    if (message.cc)  payload.cc  = message.cc;
    if (message.bcc) payload.bcc = message.bcc;

    const response = await fetch(`https://${hostname}/api/v2/mailer/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Replit-Authentication': authToken,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Falha no envio (HTTP ${response.status})`);
    }
    return await response.json();
}

module.exports = { sendEmail };
