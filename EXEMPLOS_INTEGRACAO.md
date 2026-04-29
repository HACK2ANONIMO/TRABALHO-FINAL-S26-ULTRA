# 📌 Exemplos Práticos de Integração

Copie e cole estes exemplos diretamente no seu código para integrar emails.

---

## 1️⃣ Integração com Formulário de Inscrição

### Ficheiro: `inscrever-se.html`

**Localize a função que salva a inscrição em localStorage e adicione:**

```javascript
// Dentro da função de submit do formulário de inscrição
async function submeterInscricao() {
  // ... seu código de validação aqui ...
  
  // Salvar em localStorage
  const inscricoes = JSON.parse(localStorage.getItem('inscricoes') || '[]');
  inscricoes.push(inscricao);
  localStorage.setItem('inscricoes', JSON.stringify(inscricoes));
  
  // 🆕 ADICIONAR ISTO:
  // ─────────────────────────────────────────────────────────
  try {
    console.log('[EMAIL] Enviando notificação de inscrição...');
    
    const resultado = await enviarEmailNovaInscricao({
      nome: inscricao.nomeCompleto,
      email: inscricao.email,
      telefone: inscricao.telefone || 'Não informado',
      curso: inscricao.cursoLabel || inscricao.curso,
      dataInscricao: new Date().toLocaleDateString('pt-AO'),
    });
    
    if (resultado.sucesso) {
      console.log('[EMAIL] ✓ Email enviado com sucesso!');
      // Mostrar notificação visual se desejar
      mostrarNotificacao('Inscrição recebida! Um email foi enviado para a instituição.', 'success');
    } else {
      console.warn('[EMAIL] ✗ Falha ao enviar email:', resultado.mensagem);
      // Mesmo assim salva a inscrição, mas avisa que email falhou
      mostrarNotificacao('Inscrição registada, mas erro ao enviar email.', 'warn');
    }
  } catch (erro) {
    console.error('[EMAIL] Erro ao enviar:', erro);
    mostrarNotificacao('Inscrição registada, mas error ao notificar instituição.', 'warn');
  }
  // ─────────────────────────────────────────────────────────
  
  // Redirecionar ou limpar formulário
  // location.href = 'inscricao-confirmada.html';
}
```

**Adicione também o script no head do HTML:**

```html
<script src="js/emailSender.js"></script>
```

---

## 2️⃣ Integração com Formulário de Contacto

### Ficheiro: `contacto.html`

**O formulário já tem integração via `/api/contacto`, mas pode adicionar feedback local:**

```javascript
// Dentro do event listener do formulário
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const dados = {
    nome: this.nome.value.trim(),
    email: this.email.value.trim(),
    telefone: this.telefone.value.trim(),
    assunto: this.assunto.value.trim(),
    mensagem: this.mensagem.value.trim(),
  };

  // Enviar via API existente (já está implementado)
  try {
    const resposta = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    
    if (resposta.ok) {
      console.log('[CONTACTO] ✓ Mensagem enviada com sucesso!');
      
      // 🆕 ADICIONAR ISTO (opcional, para feedback extra):
      // ─────────────────────────────────────────────────────────
      // Enviar também uma cópia interna para logs
      await enviarEmailContacto(dados).catch(e => {
        console.warn('[BACKUP EMAIL] Falha:', e.message);
      });
      // ─────────────────────────────────────────────────────────
      
      this.reset();
      mostrarPopup('Mensagem enviada com sucesso!', 'success');
    }
  } catch (erro) {
    console.error('[CONTACTO] Erro:', erro);
    mostrarPopup('Erro ao enviar mensagem. Tente novamente.', 'error');
  }
});
```

---

## 3️⃣ Integração com Dashboard Admin

### Ficheiro: `Dashboard2.html`

**Quando aprovar uma inscrição, envie notificação:**

```javascript
// Função para aprovar inscrição
async function aprovarInscricao(idInscricao) {
  // Buscar inscrição
  const inscricoes = JSON.parse(localStorage.getItem('inscricoes') || '[]');
  const inscricao = inscricoes.find(i => i.id === idInscricao);
  
  if (!inscricao) {
    alert('Inscrição não encontrada');
    return;
  }
  
  // Marcar como aprovada
  inscricao.status = 'aprovada';
  inscricao.dataAprovacao = new Date().toLocaleString('pt-AO');
  localStorage.setItem('inscricoes', JSON.stringify(inscricoes));
  
  // 🆕 ENVIAR EMAIL DE APROVAÇÃO:
  // ─────────────────────────────────────────────────────────
  try {
    console.log('[ADMIN] Enviando email de aprovação...');
    
    const resultado = await enviarEmailParaInstituicao({
      assunto: `✓ [APROVADA] Inscrição de ${inscricao.nomeCompleto}`,
      htmlCorpo: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #10b981;">Inscrição Aprovada</h2>
          <p><strong>Candidato:</strong> ${escaparHtml(inscricao.nomeCompleto)}</p>
          <p><strong>Curso:</strong> ${escaparHtml(inscricao.cursoLabel || inscricao.curso)}</p>
          <p><strong>Classe:</strong> ${escaparHtml(inscricao.classe || 'N/A')}</p>
          <p><strong>Data de Aprovação:</strong> ${inscricao.dataAprovacao}</p>
          <p style="color: #059669; font-weight: bold;">✓ Esta inscrição foi aprovada no sistema.</p>
        </div>
      `,
      textoCorpo: `Inscrição aprovada: ${inscricao.nomeCompleto} - ${inscricao.cursoLabel}`,
    });
    
    if (resultado.sucesso) {
      console.log('[ADMIN] ✓ Email de aprovação enviado!');
      mostrarNotificacao('Inscrição aprovada! Email enviado à instituição.', 'success');
    }
  } catch (erro) {
    console.error('[ADMIN] Erro ao enviar email:', erro);
  }
  // ─────────────────────────────────────────────────────────
  
  // Atualizar interface
  atualizarListaInscricoes();
}
```

---

## 4️⃣ Email Customizado (Avançado)

### Para qualquer cenário personalizado:

```javascript
// Exemplo: Enviar relatório mensal
async function enviarRelatórioMensal() {
  const mes = new Date().toLocaleString('pt-AO', { month: 'long', year: 'numeric' });
  const inscricoes = JSON.parse(localStorage.getItem('inscricoes') || '[]');
  const total = inscricoes.length;
  
  const resultado = await enviarEmailParaInstituicao({
    assunto: `Relatório Mensal - ${mes}`,
    htmlCorpo: `
      <div style="font-family: Arial; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #1f2937;">Relatório de Inscrições</h2>
        <p><strong>Período:</strong> ${mes}</p>
        <p><strong>Total de Inscrições:</strong> ${total}</p>
        
        <h3 style="color: #6366f1;">Distribuição por Curso</h3>
        ${gerarTabelaCursos(inscricoes)}
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Este é um relatório automático gerado pelo sistema MARA E LU.
        </p>
      </div>
    `,
    textoCorpo: `Relatório Mensal - Total de ${total} inscrições em ${mes}`,
  });
  
  return resultado;
}

// Função auxiliar
function gerarTabelaCursos(inscricoes) {
  const cursos = {};
  inscricoes.forEach(i => {
    const curso = i.cursoLabel || i.curso || 'Sem curso';
    cursos[curso] = (cursos[curso] || 0) + 1;
  });
  
  let html = '<table style="width:100%; border-collapse: collapse;">';
  Object.entries(cursos).forEach(([curso, qtd]) => {
    html += `<tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px;">${curso}</td>
      <td style="padding: 8px; text-align: right;"><strong>${qtd}</strong></td>
    </tr>`;
  });
  html += '</table>';
  
  return html;
}
```

---

## 5️⃣ Email com Confirmação Visual

### Adicionar feedback visual ao utilizador:

```javascript
// Integração com toast/notificação visual
async function enviarComNotificacao(tipo, dados) {
  // Mostrar "carregando"
  mostrarToast('📧 A enviar email...', 'loading');
  
  try {
    let resultado;
    
    if (tipo === 'inscricao') {
      resultado = await enviarEmailNovaInscricao(dados);
    } else if (tipo === 'contacto') {
      resultado = await enviarEmailContacto(dados);
    } else {
      resultado = await enviarEmailParaInstituicao(dados);
    }
    
    // Mostrar resultado
    if (resultado.sucesso) {
      mostrarToast('✓ Email enviado com sucesso!', 'success', 3000);
    } else {
      mostrarToast('✗ Erro ao enviar email', 'error', 3000);
    }
    
    return resultado;
  } catch (erro) {
    mostrarToast('✗ Erro: ' + erro.message, 'error', 3000);
    throw erro;
  }
}

// Função toast (exemplo simples)
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
  const toast = document.createElement('div');
  toast.textContent = mensagem;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    background: ${
      tipo === 'success' ? '#10b981' :
      tipo === 'error' ? '#ef4444' :
      tipo === 'loading' ? '#3b82f6' :
      '#6b7280'
    };
    color: white;
  `;
  
  document.body.appendChild(toast);
  
  if (duracao) {
    setTimeout(() => toast.remove(), duracao);
  }
  
  return toast;
}
```

---

## 6️⃣ Validação Antes de Enviar

### Garantir que os dados estão corretos:

```javascript
// Função com validação completa
async function enviarComValidacao(tipo, dados) {
  // Validar dados básicos
  const erros = [];
  
  if (!dados.nome || dados.nome.trim().length < 3) {
    erros.push('Nome deve ter pelo menos 3 caracteres');
  }
  
  if (!dados.email || !isEmailValido(dados.email)) {
    erros.push('Email inválido');
  }
  
  if (tipo === 'inscricao') {
    if (!dados.curso) erros.push('Curso é obrigatório');
  }
  
  if (tipo === 'contacto') {
    if (!dados.assunto || dados.assunto.trim().length < 5) {
      erros.push('Assunto deve ter pelo menos 5 caracteres');
    }
    if (!dados.mensagem || dados.mensagem.trim().length < 10) {
      erros.push('Mensagem deve ter pelo menos 10 caracteres');
    }
  }
  
  // Se houver erros, retornar
  if (erros.length > 0) {
    console.warn('[VALIDAÇÃO] Erros encontrados:', erros);
    mostrarToast('Erros encontrados:\n' + erros.join('\n'), 'error');
    return { sucesso: false, erros };
  }
  
  // Se passou validação, enviar
  console.log('[VALIDAÇÃO] ✓ Dados válidos. Enviando...');
  
  if (tipo === 'inscricao') {
    return await enviarEmailNovaInscricao(dados);
  } else {
    return await enviarEmailContacto(dados);
  }
}

// Helper para validar email
function isEmailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

---

## 7️⃣ Testes Unitários

### Testar suas integrações:

```javascript
// Adicione em sua página de testes
async function testarIntegracoes() {
  console.log('🧪 Iniciando testes de integração...\n');
  
  const testes = [
    {
      nome: 'Email de Teste',
      fn: async () => {
        return await enviarEmailTeste();
      }
    },
    {
      nome: 'Inscrição Simulada',
      fn: async () => {
        return await enviarEmailNovaInscricao({
          nome: 'Teste Silva',
          email: 'teste@exemplo.com',
          telefone: '+244 930 123 456',
          curso: 'Informática',
        });
      }
    },
    {
      nome: 'Contacto Simulado',
      fn: async () => {
        return await enviarEmailContacto({
          nome: 'Maria Teste',
          email: 'maria@teste.com',
          telefone: '+244 930 654 321',
          assunto: 'Teste de Integração',
          mensagem: 'Esta é uma mensagem de teste.',
        });
      }
    },
  ];
  
  let passaram = 0;
  let falharam = 0;
  
  for (const teste of testes) {
    try {
      const resultado = await teste.fn();
      if (resultado.sucesso) {
        console.log(`✓ ${teste.nome}`);
        passaram++;
      } else {
        console.log(`✗ ${teste.nome}: ${resultado.mensagem}`);
        falharam++;
      }
    } catch (erro) {
      console.log(`✗ ${teste.nome}: ${erro.message}`);
      falharam++;
    }
  }
  
  console.log(`\n📊 Resultado: ${passaram} passaram, ${falharam} falharam`);
  return falharam === 0;
}
```

---

## 🔒 Dicas de Segurança

```javascript
// ✅ SEMPRE fazer isto:
const html = `
  <p>${escaparHtml(dadosUsuario.nome)}</p> <!-- ESCAPADO -->
`;

// ❌ NUNCA fazer isto:
const html = `
  <p>${dadosUsuario.nome}</p> <!-- NÃO ESCAPADO - XSS RISK! -->
`;

// Usar a função escaparHtml() do emailSender.js
function escaparHtml(texto) {
  if (typeof texto !== 'string') return '';
  const mapa = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return texto.replace(/[&<>"']/g, (char) => mapa[char]);
}
```

---

## 📞 Suporte

Para dúvidas sobre estas integrações, consulte:
- `EMAIL_README.md` - Documentação completa
- `TESTE_RAPIDO.md` - Testes rápidos
- `teste-emails.html` - Exemplo interativo

**Email:** complex.maraelu@gmail.com
**Telefone:** +244 930 768 386

---

**Versão:** 1.0
**Data:** 29 de Abril de 2026
