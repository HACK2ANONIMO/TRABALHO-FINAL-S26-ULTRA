# 📧 Sistema de Emails - MARA E LU

## Visão Geral

O sistema de emails foi completamente integrado com **JavaScript vanilla** (sem dependências externas). Ele permite enviar emails reais para a instituição **MARA E LU** em diversos cenários:

- ✉️ **Notificações de novas inscrições**
- 💬 **Mensagens de contacto**
- 🧪 **Emails de teste**
- ✨ **Emails customizados**

**Email da instituição:** `complex.maraelu@gmail.com`

---

## 📁 Ficheiros Adicionados

### 1. `js/emailSender.js` (338 linhas)
Módulo principal com todas as funções de email em JavaScript vanilla.

**Funções disponíveis:**
- `enviarEmailParaInstituicao(opcoes)` - Função genérica para enviar emails
- `enviarEmailNovaInscricao(dadosInscricao)` - Notifica sobre nova inscrição
- `enviarEmailContacto(dadosContacto)` - Notifica sobre mensagem de contacto
- `enviarEmailTeste()` - Email de teste simples
- `testarEmailsComFeedback()` - Testa todos os emails no console

### 2. `teste-emails.html` (517 linhas)
Página interativa para testar o sistema de emails com interface visual.

**Testes disponíveis:**
- 🧪 Email de Teste
- 📝 Nova Inscrição
- 💬 Mensagem de Contacto
- ✨ Email Customizado
- 🚀 Teste Completo (todos juntos)

### 3. Novo endpoint no `server.js`
```javascript
POST /api/enviar-email
```
Processa requisições de email do `emailSender.js`.

---

## 🚀 Como Usar

### Opção 1: Página de Teste Interativa (Recomendado)

1. **Abra no navegador:**
   ```
   http://localhost:5000/teste-emails.html
   ```

2. **Clique em qualquer botão de teste** para enviar emails

3. **Veja os logs em tempo real** na página

### Opção 2: Console do Navegador (F12)

Execute diretamente no console do navegador:

```javascript
// Teste simples
await enviarEmailTeste()

// Teste de nova inscrição
await enviarEmailNovaInscricao({
  nome: 'João Silva',
  email: 'joao@exemplo.com',
  telefone: '+244 930 123 456',
  curso: 'Informática',
  dataInscricao: new Date().toLocaleDateString('pt-AO')
})

// Teste de contacto
await enviarEmailContacto({
  nome: 'Maria Santos',
  email: 'maria@exemplo.com',
  telefone: '+244 930 654 321',
  assunto: 'Dúvidas sobre cursos',
  mensagem: 'Gostaria de saber mais...'
})

// Teste completo (4 emails)
await testarEmailsComFeedback()
```

### Opção 3: Integração em Código

Adicione o script ao seu HTML:

```html
<script src="js/emailSender.js"></script>
```

Depois use em qualquer página:

```javascript
// Quando o formulário de inscrição é submetido
document.getElementById('inscricao-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const resultado = await enviarEmailNovaInscricao({
    nome: document.getElementById('nome').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    curso: document.getElementById('curso').value,
  });
  
  if (resultado.sucesso) {
    console.log('Email enviado com sucesso!');
  } else {
    console.error('Erro ao enviar email:', resultado.mensagem);
  }
});
```

---

## 🔧 Integração com Formulários Existentes

### Formulário de Inscrição (`inscrever-se.html`)

Adicione após a inscrição ser gravada no `localStorage`:

```javascript
// Após salvar inscrição em localStorage
if (inscricaoSalva) {
  await enviarEmailNovaInscricao({
    nome: inscricao.nomeCompleto,
    email: inscricao.email,
    telefone: inscricao.telefone,
    curso: inscricao.curso,
  });
}
```

### Formulário de Contacto (`contacto.html`)

O formulário já possui integração (via `/api/contacto`), mas pode usar também:

```javascript
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const resultado = await enviarEmailContacto({
    nome: contactForm.nome.value,
    email: contactForm.email.value,
    telefone: contactForm.telefone.value,
    assunto: contactForm.assunto.value,
    mensagem: contactForm.mensagem.value,
  });
  
  if (resultado.sucesso) {
    // Mostrar mensagem de sucesso
  }
});
```

---

## 📊 Estrutura de Dados

### Notificação de Inscrição
```javascript
{
  nome: string,           // Nome completo
  email: string,          // Email do candidato
  telefone: string,       // Telefone (opcional)
  curso: string,          // Curso de interesse
  dataInscricao: string   // Data no formato local
}
```

### Notificação de Contacto
```javascript
{
  nome: string,     // Nome do visitante
  email: string,    // Email de contacto
  telefone: string, // Telefone (opcional)
  assunto: string,  // Assunto da mensagem
  mensagem: string  // Conteúdo da mensagem
}
```

### Resposta do Servidor
```javascript
{
  ok: boolean,                    // Sucesso (true/false)
  mensagem: string,               // Descrição do resultado
  para: string,                   // Email destinatário
  assunto: string,                // Assunto enviado
  data: string,                   // ISO timestamp
  info: object,                   // Info do servidor
  // OU
  erro: string                    // Mensagem de erro (se falhar)
}
```

---

## 🔍 Debugging

### Ativar Logs Detalhados

Abra a consola do navegador (F12) e veja os logs:

```
[v0] Iniciando envio de email para: complex.maraelu@gmail.com
[v0] Payload do email: {...}
[v0] Status da resposta: 200
[v0] Email enviado com sucesso!
```

### Verificar Configuração

```javascript
// No console do navegador
console.log(EMAIL_CONFIG)

// Resultado:
{
  INSTITUICAO_EMAIL: 'complex.maraelu@gmail.com',
  INSTITUICAO_NOME: 'MARA E LU',
  API_ENDPOINT: '/api/enviar-email'
}
```

### Testar Conexão com API

```javascript
// Teste a rota diretamente
fetch('/api/enviar-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    para: 'complex.maraelu@gmail.com',
    assunto: 'Teste de Conexão',
    html: '<p>Teste</p>',
    texto: 'Teste'
  })
}).then(r => r.json()).then(console.log)
```

---

## ⚙️ Configuração

Para alterar o email da instituição, edite `js/emailSender.js`:

```javascript
const EMAIL_CONFIG = {
  INSTITUICAO_EMAIL: 'seu-email@exemplo.com', // ← Alterar aqui
  INSTITUICAO_NOME: 'MARA E LU',
  API_ENDPOINT: '/api/enviar-email',
};
```

---

## ✅ Checklist de Teste

- [ ] Página `teste-emails.html` abre sem erros
- [ ] Email de Teste envia com sucesso
- [ ] Notificação de Inscrição envia com sucesso
- [ ] Notificação de Contacto envia com sucesso
- [ ] Email aparece na caixa de entrada de `complex.maraelu@gmail.com`
- [ ] Logs aparecem na página e no console (F12)
- [ ] Formulários de inscrição e contacto funcionam normalmente
- [ ] Sem erros na consola do navegador

---

## 🐛 Resolução de Problemas

### Erro: "fetch is not defined"
- Certifique-se de que está usando um navegador moderno
- Não funcionará em versões muito antigas do IE

### Erro: "Email endpoint não responde"
- Verifique se o servidor está rodando (`npm start`)
- Verifique se está na URL correta (ex: `http://localhost:5000`)

### Email não chegando
- Verifique a caixa de spam de `complex.maraelu@gmail.com`
- Veja os logs no servidor (console onde rodou `npm start`)
- Tente usar a página de teste (`teste-emails.html`)

### Erro CORS
- Verifique se o servidor tem CORS ativado em `server.js`
- Deve estar: `app.use(cors({ origin: true, credentials: true }))`

---

## 📝 Exemplos Práticos

### Integração com Validação
```javascript
async function enviarInscricaoComValidacao(dados) {
  // Validar dados
  if (!dados.nome || !dados.email) {
    return { sucesso: false, mensagem: 'Nome e email obrigatórios' };
  }
  
  // Enviar email
  const resultado = await enviarEmailNovaInscricao(dados);
  
  // Salvar em localStorage
  if (resultado.sucesso) {
    const inscricoes = JSON.parse(localStorage.getItem('inscricoes') || '[]');
    inscricoes.push(dados);
    localStorage.setItem('inscricoes', JSON.stringify(inscricoes));
  }
  
  return resultado;
}
```

### Integração com Feedback Visual
```javascript
async function enviarComFeedback() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  
  try {
    const resultado = await enviarEmailTeste();
    
    if (resultado.sucesso) {
      mostrarMensagem('✓ Email enviado com sucesso!', 'success');
    } else {
      mostrarMensagem('✗ Erro: ' + resultado.mensagem, 'error');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
}
```

---

## 📞 Suporte

Para problemas, dúvidas ou sugestões:
- Email: `complex.maraelu@gmail.com`
- Telefone: `+244 930 768 386`
- Horário: 08h - 16h (seg-sex)

---

**Última atualização:** 29 de Abril de 2026
**Versão:** 1.0
**Autor:** v0 (Vercel AI)
