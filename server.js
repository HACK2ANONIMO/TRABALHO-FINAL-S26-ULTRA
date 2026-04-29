// ============================================================
// server.js — Servidor mínimo do Colégio Mara & Lú
// ------------------------------------------------------------
// Responsabilidades (apenas duas):
//   1. Servir os ficheiros estáticos do frontend (HTML/CSS/JS).
//   2. Enviar emails reais via Replit Mail para a escola e para o
//      candidato/visitante (formulário de inscrição e de contacto).
//
// IMPORTANTE:
//   - Não há mais base de dados (SQLite removido).
//   - Toda a persistência (inscrições, cursos, vagas, notificações,
//     pedidos admin) vive no localStorage do navegador.
//   - A autenticação do administrador é feita inteiramente no
//     frontend (entrar.html → ADMIN/admin123 → sessionStorage).
// ============================================================

const express     = require('express');
const cors        = require('cors');
const bodyParser  = require('body-parser');
const path        = require('path');

require('dotenv').config();

const { sendEmail } = require('./js/server/replitMail');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Helper para escapar HTML em strings vindas do utilizador
const escapar = s => String(s == null ? '' : s)
    .replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

// ------------------------------------------------------------
// API — Notificação de nova inscrição (chamada pelo frontend
// depois de gravar a inscrição em localStorage).
// ------------------------------------------------------------
app.post('/api/notify-inscricao', async (req, res) => {
    const insc = req.body || {};
    if (!insc.id || !insc.nomeCompleto) {
        return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
    }

    // 1) Email para a escola
    try {
        const htmlEscola = `
            <h2>Nova inscrição recebida</h2>
            <p><strong>Código:</strong> ${escapar(insc.id)}</p>
            <p><strong>Nome:</strong> ${escapar(insc.nomeCompleto)}</p>
            <p><strong>BI/Documento:</strong> ${escapar(insc.documento || 'N/D')}</p>
            <p><strong>Telefone:</strong> ${escapar(insc.telefone || 'N/D')}</p>
            <p><strong>Email:</strong> ${escapar(insc.email || 'N/D')}</p>
            <p><strong>Classe:</strong> ${escapar(insc.classe || 'N/D')}</p>
            <p><strong>Curso:</strong> ${escapar(insc.cursoLabel || insc.curso || 'N/D')}</p>
        `;
        await sendEmail({
            subject: `Nova inscrição: ${insc.nomeCompleto}`,
            html: htmlEscola,
            text: `Nova inscrição: ${insc.id} — ${insc.nomeCompleto}\n` +
                  `BI: ${insc.documento}\nTelefone: ${insc.telefone}\n` +
                  `Email: ${insc.email}\nClasse: ${insc.classe}`,
        });
    } catch (e) {
        console.warn('[Email] Notificação à escola falhou:', e.message);
    }

    // 2) Confirmação ao candidato (se indicou email)
    if (insc.email && /.+@.+\..+/.test(insc.email)) {
        try {
            const htmlCandidato = `
                <h2>Recebemos a sua inscrição, ${escapar(insc.nomeCompleto)}!</h2>
                <p>Obrigado por se inscrever no <strong>Colégio Mara &amp; Lú</strong>.</p>
                <p>Guarde o seguinte código para consultar o estado da sua inscrição:</p>
                <p style="font-size:1.4rem;font-weight:700;color:#4C1D95;">${escapar(insc.id)}</p>
                <p><strong>Curso/Classe:</strong>
                   ${escapar(insc.cursoLabel || insc.curso || '')}
                   ${insc.classe ? '— Classe ' + escapar(insc.classe) : ''}</p>
                <hr>
                <p style="color:#6b7280;font-size:0.9rem;">Mensagem automática.
                   Para mais informações: +244 930 768 386 ou
                   <a href="mailto:complex.maraelu@gmail.com">complex.maraelu@gmail.com</a>.</p>
            `;
            await sendEmail({
                to: insc.email,
                subject: `Inscrição registada — código ${insc.id}`,
                html: htmlCandidato,
                text: `Olá ${insc.nomeCompleto}, recebemos a sua inscrição no Colégio Mara & Lú.\n\n` +
                      `Código de inscrição: ${insc.id}\n` +
                      `Classe/Curso: ${insc.classe || ''} ${insc.cursoLabel || insc.curso || ''}\n\n` +
                      `Guarde este código para consultar o estado em qualquer altura.\n\n— Colégio Mara & Lú`,
            });
        } catch (e) {
            console.warn('[Email] Confirmação ao candidato falhou:', e.message);
        }
    }

    res.json({ ok: true });
});

// ------------------------------------------------------------
// API — Contacto (envia email à escola + auto-resposta ao remetente)
// ------------------------------------------------------------
app.post('/api/contacto', async (req, res) => {
    const { nome, email, telefone, assunto, mensagem } = req.body || {};
    if (!nome || !email || !assunto || !mensagem) {
        return res.status(400).json({ error: 'Preencha nome, email, assunto e mensagem.' });
    }
    try {
        const html = `
            <h2>Nova mensagem de contacto</h2>
            <p><strong>De:</strong> ${escapar(nome)} &lt;${escapar(email)}&gt;</p>
            <p><strong>Telefone:</strong> ${escapar(telefone || 'N/D')}</p>
            <p><strong>Assunto:</strong> ${escapar(assunto)}</p>
            <hr>
            <p style="white-space:pre-wrap">${escapar(mensagem)}</p>
        `;
        await sendEmail({
            subject: `[Contacto Mara&Lú] ${assunto}`,
            html,
            text: `De: ${nome} <${email}>\nTelefone: ${telefone}\n` +
                  `Assunto: ${assunto}\n\n${mensagem}`,
        });

        if (/.+@.+\..+/.test(email)) {
            try {
                await sendEmail({
                    to: email,
                    subject: `Recebemos a sua mensagem — Mara & Lú`,
                    html: `
                        <h2>Olá ${escapar(nome)}, recebemos a sua mensagem!</h2>
                        <p>Obrigado por contactar o <strong>Colégio Mara &amp; Lú</strong>.
                           A nossa equipa irá responder em até 24 horas úteis.</p>
                        <p><strong>Assunto:</strong> ${escapar(assunto)}</p>
                        <hr>
                        <p style="color:#6b7280;font-size:0.9rem;">Mensagem automática.
                           Em caso de urgência, ligue para +244 930 768 386 (08h–16h).</p>
                    `,
                    text: `Olá ${nome}, recebemos a sua mensagem sobre "${assunto}".\n\n` +
                          `Iremos responder em até 24 horas úteis.\n\n— Colégio Mara & Lú`,
                });
            } catch (e2) {
                console.warn('[Contacto] Falhou confirmação ao remetente:', e2.message);
            }
        }

        res.json({ ok: true });
    } catch (e) {
        console.error('[Contacto] erro:', e.message);
        res.status(500).json({ error: 'Não foi possível enviar a mensagem agora. Tente mais tarde.' });
    }
});

// ------------------------------------------------------------
// API — Email marketing (sem auth no servidor; o frontend já valida sessão)
// ------------------------------------------------------------
app.post('/send-email', async (req, res) => {
    const { subject, text, html, to } = req.body || {};
    if (!subject) return res.status(400).json({ error: 'subject required' });
    try {
        const info = await sendEmail({ subject, text, html, to });
        res.json({ ok: true, info });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/send-email-batch', async (req, res) => {
    const { recipients, subject, text, html } = req.body || {};
    if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'recipients required' });
    }
    if (!subject) return res.status(400).json({ error: 'subject required' });

    const results = [];
    for (const dest of recipients) {
        try {
            const info = await sendEmail({ to: dest, subject, text, html });
            results.push({ to: dest, ok: true, info });
        } catch (e) {
            results.push({ to: dest, ok: false, error: e.message });
        }
    }
    const allOk = results.every(r => r.ok);
    res.json({ ok: allOk, results });
});

// ------------------------------------------------------------
// Estáticos & arranque
// ------------------------------------------------------------
app.use(express.static(path.join(__dirname, '.')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log('Server running on', PORT));
