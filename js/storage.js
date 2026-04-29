// ============================================================
// js/storage.js — Camada de armazenamento (frontend only)
// ------------------------------------------------------------
// Após a remoção do SQLite, toda a persistência é local:
//   - localStorage (chave 'inscricoes'): lista leve com os dados
//     de texto de cada inscrição (sem ficheiros base64).
//   - IndexedDB (objectStore 'inscricoes'): registos completos,
//     incluindo as fotos e documentos em base64. É aqui que a
//     área administrativa lê os ficheiros.
//
// O servidor Express é usado APENAS para enviar emails
// (para a escola e para o candidato) através do endpoint
// POST /api/notify-inscricao. A inscrição em si nunca é
// guardada no servidor.
//
// API pública (mantém os mesmos nomes para compatibilidade):
//   AppStorage.salvarInscricao(dados)          — grava local + envia emails
//   AppStorage.getInscricaoComFotos(id)        — lê 1 inscrição (com ficheiros)
//   AppStorage.listarInscricoes()              — lista todas (sem ficheiros)
//   AppStorage.salvarPagamento(id, pagamento)  — actualiza estado de pagamento
//   AppStorage.isServidorDisponivel()          — útil para detectar online
// ============================================================

const AppStorage = (() => {

    // ── localStorage seguro (com gestão de quota) ──────────
    function safeSetItem(key, value) {
        try { localStorage.setItem(key, value); return true; }
        catch (err1) {
            const isQuota = err1 && (err1.name === 'QuotaExceededError'
                          || err1.code === 22 || err1.code === 1014);
            if (!isQuota) { console.warn('[Storage] setItem falhou:', err1); return false; }

            console.warn('[Storage] Quota cheia — a libertar espaço…');
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
                                console.warn(`[Storage] Mantidas só ${arr.length} inscrições mais recentes em cache.`);
                                return true;
                            } catch {}
                        }
                    }
                } catch {}
            }
            console.warn('[Storage] Não foi possível guardar no localStorage; cache desactivada para esta chave.');
            return false;
        }
    }

    // ── IndexedDB ──────────────────────────────────────────
    const DB_NAME    = 'MaraLuDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'inscricoes';

    function abrirDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            req.onsuccess = e => resolve(e.target.result);
            req.onerror   = e => reject(e.target.error);
        });
    }

    async function idbSalvar(dados) {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(dados);
            tx.oncomplete = () => resolve(true);
            tx.onerror    = e => reject(e.target.error);
        });
    }

    async function idbLer(id) {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx  = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(id);
            req.onsuccess = e => resolve(e.target.result || null);
            req.onerror   = e => reject(e.target.error);
        });
    }

    async function idbApagar(id) {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror    = e => reject(e.target.error);
        });
    }

    // ── Detecção de servidor (apenas para os emails) ─────
    async function isServidorDisponivel() {
        try {
            const ctrl = new AbortController();
            const t    = setTimeout(() => ctrl.abort(), 2000);
            const r    = await fetch('/api/contacto', { signal: ctrl.signal, method: 'OPTIONS' });
            clearTimeout(t);
            return r.ok || r.status === 204;
        } catch { return false; }
    }

    // ── API pública ────────────────────────────────────────
    return {
        isServidorDisponivel,

        /**
         * Grava uma inscrição:
         *   1. localStorage (sem fotos) → para listagens rápidas no admin.
         *   2. IndexedDB (com fotos)   → para o admin abrir os documentos.
         *   3. Pede ao servidor para enviar emails (escola + candidato).
         *      Se o servidor falhar, a inscrição continua guardada localmente.
         */
        salvarInscricao: async function (dados) {
            const { fotos, ...dadosTexto } = dados;

            // 1. localStorage
            try {
                const lista = JSON.parse(localStorage.getItem('inscricoes') || '[]');
                const idx   = lista.findIndex(i => i.id === dados.id);
                if (idx >= 0) lista[idx] = dadosTexto;
                else           lista.unshift(dadosTexto);
                safeSetItem('inscricoes', JSON.stringify(lista));
            } catch (e) {
                console.warn('[Storage] Erro a actualizar cache local de inscrições:', e.message || e);
            }

            // 2. IndexedDB
            try { await idbSalvar(dados); }
            catch (e) { console.warn('[Storage] Erro ao guardar no IndexedDB:', e); }

            // 3. Notificar servidor para envio de emails
            try {
                await fetch('/api/notify-inscricao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosTexto),
                });
            } catch (e) {
                console.warn('[Storage] Servidor offline — emails não enviados:', e.message);
            }

            return { ok: true, fonte: 'local' };
        },

        /**
         * Devolve uma inscrição (com ficheiros).
         *
         * IMPORTANTE: o localStorage é a "fonte da verdade" para
         * campos de texto (estado, pagamento, etc.) — é lá que o
         * admin grava as alterações. O IndexedDB serve apenas para
         * recuperar os ficheiros base64 (fotos, documentos).
         *
         * Por isso fazemos um merge: começamos pelo registo do IDB
         * (para apanhar os ficheiros) e por cima escrevemos os
         * campos textuais mais recentes do localStorage.
         */
        getInscricaoComFotos: async function (id) {
            let idb = null;
            try { idb = await idbLer(id); } catch {}

            let local = null;
            try {
                const lista = JSON.parse(localStorage.getItem('inscricoes') || '[]');
                local = lista.find(i => i.id === id) || null;
            } catch {}

            if (!idb && !local) return null;
            if (!idb)  return local;
            if (!local) return idb;

            // Merge: ficheiros (fotos) vêm do IDB, restantes campos do localStorage
            const { fotos, ...idbSemFotos } = idb;
            return Object.assign({}, idbSemFotos, local, fotos ? { fotos } : {});
        },

        /**
         * Lista todas as inscrições (sem ficheiros) — usado pelas tabelas admin.
         */
        listarInscricoes: function () {
            try { return JSON.parse(localStorage.getItem('inscricoes') || '[]'); }
            catch { return []; }
        },

        /**
         * Apaga uma inscrição local + IndexedDB.
         */
        apagarInscricao: async function (id) {
            try {
                const lista = JSON.parse(localStorage.getItem('inscricoes') || '[]');
                const nova  = lista.filter(i => i.id !== id);
                safeSetItem('inscricoes', JSON.stringify(nova));
            } catch {}
            try { await idbApagar(id); } catch {}
            return { ok: true };
        },

        /**
         * Actualiza o pagamento de uma inscrição na cache local.
         * (Sem servidor — basta localStorage.)
         */
        salvarPagamento: async function (id, pagamento) {
            if (!id || !pagamento) return { ok: false, erro: 'id e pagamento obrigatórios' };
            try {
                const lista = JSON.parse(localStorage.getItem('inscricoes') || '[]');
                const idx   = lista.findIndex(i => i.id === id);
                if (idx >= 0) {
                    lista[idx].pagamento = pagamento;
                    safeSetItem('inscricoes', JSON.stringify(lista));
                }
                // Replica também na IndexedDB
                try {
                    const completo = await idbLer(id);
                    if (completo) {
                        completo.pagamento = pagamento;
                        await idbSalvar(completo);
                    }
                } catch {}
                return { ok: true };
            } catch (e) {
                console.warn('[Storage] Falha ao actualizar pagamento:', e.message || e);
                return { ok: false, erro: e.message };
            }
        },
    };
})();

window.AppStorage = AppStorage;
