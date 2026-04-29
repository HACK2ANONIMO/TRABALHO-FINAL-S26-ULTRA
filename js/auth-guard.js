// ============================================================
// js/auth-guard.js — Protecção das páginas administrativas
// ------------------------------------------------------------
// Carregar como PRIMEIRO <script> em qualquer página da área
// administrativa (Dashboard, listas, aprovados, cursos, vagas,
// gestão de pedidos, email-marketing, etc.).
//
// Funcionamento (apenas frontend):
//   - Verifica se existe `sessao_ativa` no sessionStorage.
//   - Se sim, deixa a página continuar.
//   - Se não, redirecciona para entrar.html (sem entrada no histórico).
//
// A sessão é criada em entrar.html quando o utilizador
// introduz credenciais válidas (ADMIN/admin123).
// ============================================================

(function () {
    // Evita loop infinito se este script for carregado em entrar.html
    if (/entrar\.html(\?|$|#)/i.test(window.location.pathname + window.location.search)) return;

    let sessao = null;
    try { sessao = JSON.parse(sessionStorage.getItem('sessao_ativa') || 'null'); } catch (_) {}

    if (!sessao || !sessao.usuario) {
        window.location.replace('entrar.html');
    }
})();
