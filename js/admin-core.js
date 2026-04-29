// ============================================================
// js/admin-core.js — Núcleo da área administrativa (frontend only)
// ------------------------------------------------------------
// Toda a persistência (inscrições, cursos, vagas, notificações)
// vive no localStorage do navegador. O servidor Express é usado
// APENAS para enviar emails (formulário de contacto, inscrição
// e e-mail marketing).
//
// API exposta (`window.AdminCore`):
//   getInscricoes()        — lista de inscrições (texto)
//   saveInscricoes(arr)    — substitui a lista
//   deleteInscricao(id)    — remove uma inscrição
//   getCursos / saveCursos — gerir cursos
//   getVagas  / saveVagas  — gerir vagas
//   addNotification(msg, type)
//   notificaTodasAsAbas(tipo, mensagem)
//   iniciarMonitor()       — observa mudanças noutras abas
//   sendEmail(to, subject, body) — envia através de /send-email
//   formatDate(s)
// ============================================================

// ── localStorage seguro (com gestão de quota) ──────────────
function adminSafeSetItem(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (err1) {
        const isQuota = err1 && (err1.name === 'QuotaExceededError'
                       || err1.code === 22 || err1.code === 1014);
        if (!isQuota) { console.warn('[AdminCore] setItem falhou:', err1); return false; }

        console.warn('[AdminCore] Quota cheia — a libertar espaço…');
        ['ultima_notificacao', 'notifications', '_cache_temp'].forEach(k => {
            try { localStorage.removeItem(k); } catch {}
        });
        try { localStorage.setItem(key, value); return true; } catch {}

        if (key === 'inscricoes') {
            try {
                let arr = JSON.parse(value);
                if (Array.isArray(arr) && arr.length > 1) {
                    while (arr.length > 1) {
                        const remover = Math.max(1, Math.floor(arr.length * 0.25));
                        arr = arr.slice(0, arr.length - remover);
                        try {
                            localStorage.setItem(key, JSON.stringify(arr));
                            console.warn(`[AdminCore] Mantidas só ${arr.length} inscrições mais recentes em cache.`);
                            return true;
                        } catch {}
                    }
                }
            } catch {}
        }
        console.warn('[AdminCore] localStorage cheio; cache desactivada para esta chave.');
        return false;
    }
}

const AdminCore = {
    /**
     * Devolve as inscrições directamente do localStorage.
     * Sem servidor — toda a persistência é local.
     */
    getInscricoes: function() {
        try { return JSON.parse(localStorage.getItem('inscricoes') || '[]'); }
        catch (e) { console.error('Erro ao ler inscrições:', e); return []; }
    },

    /**
     * Salva (substitui) a lista de inscrições no localStorage e
     * dispara um StorageEvent para sincronizar outras abas abertas.
     */
    saveInscricoes: function(data) {
        try {
            const previous = localStorage.getItem('inscricoes');
            const next = JSON.stringify(data);
            adminSafeSetItem('inscricoes', next);

            const evt = new StorageEvent('storage', {
                key: 'inscricoes',
                oldValue: previous,
                newValue: next,
                url: location.href,
                storageArea: localStorage
            });
            window.dispatchEvent(evt);
        } catch (e) {
            console.error('Erro ao salvar inscrições:', e);
        }
    },

    /**
     * Apaga uma inscrição da lista e do IndexedDB (via AppStorage se disponível).
     */
    deleteInscricao: function(id) {
        try {
            const inscricoes = this.getInscricoes();
            const idx = inscricoes.findIndex(i => i.id === id);
            if (idx === -1) return false;
            inscricoes.splice(idx, 1);
            this.saveInscricoes(inscricoes);

            // Apagar também os ficheiros base64 do IndexedDB se possível
            try {
                if (window.AppStorage && AppStorage.apagarInscricao) {
                    AppStorage.apagarInscricao(id);
                }
            } catch {}
            return true;
        } catch (e) {
            console.error('Erro ao excluir inscrição:', e);
            return false;
        }
    },

    /**
     * Notificação visível no sino do header admin.
     */
    addNotification: function(msg, type = 'info') {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications.unshift({
            id: Date.now(),
            message: msg,
            type: type,
            date: new Date().toISOString(),
            read: false
        });
        adminSafeSetItem('notifications', JSON.stringify(notifications.slice(0, 50)));
    },

    /**
     * Formatação de data para pt-PT.
     */
    formatDate: function(dateStr) {
        if (!dateStr) return '---';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-PT') + ' ' +
               d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Envio de email via servidor (Replit Mail).
     * Continua disponível mesmo sem SQLite porque é apenas um proxy.
     */
    sendEmail: async function(to, subject, body) {
        console.log(`[EMAIL] Para: ${to} | Assunto: ${subject}`);
        try {
            const res = await fetch('/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, text: body })
            });
            return await res.json();
        } catch (e) {
            console.warn('Servidor de email indisponível.');
            return { ok: false, error: 'Servidor offline' };
        }
    },

    // ── Cursos ─────────────────────────────────────────────
    getCursos: function() {
        try { return JSON.parse(localStorage.getItem('cursos') || '[]'); }
        catch (e) { console.error('Erro ao ler cursos:', e); return []; }
    },
    saveCursos: function(data) {
        try {
            const previous = localStorage.getItem('cursos');
            const next = JSON.stringify(data);
            adminSafeSetItem('cursos', next);
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'cursos', oldValue: previous, newValue: next,
                url: location.href, storageArea: localStorage
            }));
        } catch (e) { console.error('Erro ao salvar cursos:', e); }
    },

    // ── Vagas ──────────────────────────────────────────────
    getVagas: function() {
        try { return JSON.parse(localStorage.getItem('vagas') || '[]'); }
        catch (e) { console.error('Erro ao ler vagas:', e); return []; }
    },
    saveVagas: function(data) {
        try {
            const previous = localStorage.getItem('vagas');
            const next = JSON.stringify(data);
            adminSafeSetItem('vagas', next);
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'vagas', oldValue: previous, newValue: next,
                url: location.href, storageArea: localStorage
            }));
        } catch (e) { console.error('Erro ao salvar vagas:', e); }
    },

    /**
     * Notifica todas as abas abertas de que algo mudou.
     */
    notificaTodasAsAbas: function(tipo, mensagem) {
        const notif = { tipo, mensagem, timestamp: Date.now() };
        adminSafeSetItem('ultima_notificacao', JSON.stringify(notif));
        this.addNotification(mensagem, tipo);
    },

    /**
     * Inicia o monitor: detecta nova inscrição (via crescimento da
     * lista no localStorage) e mensagens de outras abas.
     */
    iniciarMonitor: function() {
        let ultimoTotal = this.getInscricoes().length;
        let ultimoNotifKey = localStorage.getItem('ultima_notificacao');

        setInterval(() => {
            const inscricoes = this.getInscricoes();
            const totalActual = inscricoes.length;

            if (totalActual > ultimoTotal) {
                const nova = inscricoes[0];
                const nome = nova?.nomeCompleto || nova?.nome || 'Novo candidato';
                this.addNotification(`Nova inscrição recebida: ${nome}`, 'success');
                ultimoTotal = totalActual;
                AdminCore._actualizarContadorNotif();
            }

            const notifActual = localStorage.getItem('ultima_notificacao');
            if (notifActual && notifActual !== ultimoNotifKey) {
                ultimoNotifKey = notifActual;
                AdminCore._actualizarContadorNotif();
            }
        }, 5000);
    },

    _actualizarContadorNotif: function() {
        const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        const naoLidas = notifs.filter(n => !n.read).length;
        const badge = document.getElementById('notif-count');
        if (badge) {
            badge.textContent = naoLidas > 0 ? naoLidas : '0';
            badge.style.background = naoLidas > 0 ? '#ef4444' : '#9ca3af';
        }
    },

    marcarTodasLidas: function() {
        const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifs.forEach(n => n.read = true);
        adminSafeSetItem('notifications', JSON.stringify(notifs));
        this._actualizarContadorNotif();
    }
};

window.AdminCore = AdminCore;

// Inicialização leve em qualquer página admin
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try { AdminCore._actualizarContadorNotif(); } catch {}
    });
}
