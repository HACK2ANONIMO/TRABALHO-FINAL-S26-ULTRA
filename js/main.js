// ============================================================
// js/main.js — Scripts gerais do frontend
// ------------------------------------------------------------
// Responsabilidades:
//   1. Menu de navegação móvel (hambúrguer ↔ X)
//   2. Slider/carrossel da secção hero da página inicial
//   3. Inicialização de dados padrão no localStorage
//   4. Verificação de sessão (redireccionamento login ↔ dashboard)
//   5. Tratamento dos formulários de contacto e login admin
//
// Chaves do localStorage usadas pelo projecto:
//   'inscricoes'         → lista de candidaturas (painel admin)
//   'inscricoes_escola'  → inscrições do formulário público
//   'usuarios_aprovados' → contas com acesso administrativo (dev)
//   'notifications'      → notificações geradas pelas acções
//
// Chave do sessionStorage:
//   'sessao_ativa'       → objecto com dados da sessão admin activa.
//                          Apagado automaticamente ao fechar o separador.
// ============================================================


// ── 1. MENU MÓVEL ────────────────────────────────────────────
// Activa/desactiva o menu de navegação em dispositivos móveis
// ao clicar no botão hambúrguer, trocando o ícone entre ☰ e ✕.
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn'); // Botão hambúrguer
  const mobileNav     = document.querySelector('.mobile-nav');      // Container do menu

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function() {
      // Alterna a classe CSS 'active' que mostra/esconde o menu
      mobileNav.classList.toggle('active');

      // Troca o ícone visual conforme o estado actual do menu
      const icon = mobileMenuBtn.querySelector('span');
      if (mobileNav.classList.contains('active')) {
        icon.textContent = '✕'; // Menu aberto → mostra X para fechar
      } else {
        icon.textContent = '☰'; // Menu fechado → mostra hambúrguer para abrir
      }
    });
  }
});


// ── 2. SLIDER HERO ────────────────────────────────────────────
// Classe que controla o carrossel/slider da secção principal (hero).
// Suporta: navegação manual (prev/next), indicadores clicáveis e
// autoplay de 5 segundos com pausa ao passar o rato.
class HeroSlider {
  constructor() {
    // Selecciona todos os slides e os seus indicadores de posição
    this.slides     = document.querySelectorAll('.slide');
    this.indicators = document.querySelectorAll('.indicator');
    this.prevBtn    = document.querySelector('.slider-btn.prev'); // Botão "anterior"
    this.nextBtn    = document.querySelector('.slider-btn.next'); // Botão "próximo"
    this.currentSlide    = 0;    // Índice do slide actualmente visível
    this.autoPlayInterval = null; // Referência ao setInterval do autoplay

    // Só inicializa se existirem slides na página
    if (this.slides.length > 0) {
      this.init();
    }
  }

  // Regista os listeners de eventos e inicia o autoplay
  init() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevSlide());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextSlide());

    // Cada indicador leva directamente ao slide correspondente
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });

    this.startAutoPlay();

    // Pausa o autoplay quando o rato entra no slider; retoma ao sair
    const slider = document.querySelector('.hero-slider');
    if (slider) {
      slider.addEventListener('mouseenter', () => this.stopAutoPlay());
      slider.addEventListener('mouseleave', () => this.startAutoPlay());
    }
  }

  // Navega para um slide específico pelo índice.
  // Remove 'active' do slide actual e adiciona ao novo.
  goToSlide(index) {
    this.slides[this.currentSlide].classList.remove('active');
    this.indicators[this.currentSlide].classList.remove('active');
    this.currentSlide = index;
    this.slides[this.currentSlide].classList.add('active');
    this.indicators[this.currentSlide].classList.add('active');
  }

  // Avança para o próximo slide (com ciclo: último → primeiro)
  nextSlide() {
    const next = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(next);
  }

  // Recua para o slide anterior (com ciclo: primeiro → último)
  prevSlide() {
    const prev = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prev);
  }

  // Inicia o avanço automático a cada 5 segundos
  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => this.nextSlide(), 5000);
  }

  // Para o avanço automático (usado ao passar o rato)
  stopAutoPlay() {
    clearInterval(this.autoPlayInterval);
  }
}


// ── 3. INICIALIZAÇÃO DO SISTEMA ───────────────────────────────
// Executado quando o DOM está pronto.
// Cria o slider, garante estruturas mínimas no localStorage
// e verifica a sessão para redireccionamento automático.
document.addEventListener('DOMContentLoaded', function() {
  // Instanciar o slider (não faz nada se não houver slides na página)
  new HeroSlider();

  // Garantir que a chave de inscrições públicas existe no localStorage.
  // Evita erros em páginas que lêem esta chave antes de qualquer inscrição.
  if (!localStorage.getItem('inscricoes_escola')) {
    localStorage.setItem('inscricoes_escola', JSON.stringify([]));
  }

  // Garantir que a lista de utilizadores aprovados existe.
  // Em produção, esta verificação deve ser feita no backend.
  if (!localStorage.getItem('usuarios_aprovados')) {
    localStorage.setItem('usuarios_aprovados', JSON.stringify([
      { usuario: 'ADMIN', nome: 'Administrador', role: 'admin' }
    ]));
  }

  // ── Verificação de sessão ──────────────────────────────────
  // Lê a sessão do sessionStorage (termina ao fechar o separador).
  // Redireciona conforme o estado:
  //   • Autenticado + em entrar.html → vai para o dashboard
  //   • Não autenticado + em Dashboard2.html → vai para o login
  const sessaoAtiva = sessionStorage.getItem('sessao_ativa');
  const path        = window.location.pathname;

  if (sessaoAtiva) {
    // Evita que o admin fique preso na página de login estando já autenticado
    if (path.includes('entrar.html')) window.location.href = 'Dashboard2.html';
  } else {
    // Impede acesso directo ao dashboard sem autenticação
    if (path.includes('Dashboard2.html')) window.location.href = 'entrar.html';
  }
});


// ── 4. FORMULÁRIOS ────────────────────────────────────────────
// Nota importante:
//   - O formulário de contacto (contacto.html) e o de inscrição
//     (inscrever-se.html) têm os SEUS PRÓPRIOS handlers inline.
//     Não duplicamos aqui para evitar dupla submissão.
//   - O formulário de login (entrar.html) também tem o seu próprio
//     handler que faz POST a /api/admin/login. Não duplicar aqui.


// ── 5. FUNÇÃO GLOBAL DE LOGOUT ────────────────────────────────
// Apenas remove a chave de sessão do sessionStorage e volta para o login.
// NÃO apaga dados persistidos (inscrições, cursos, etc.) no localStorage.
function logout() {
  try { sessionStorage.removeItem('sessao_ativa'); } catch (_) {}
  window.location.href = 'entrar.html';
}
