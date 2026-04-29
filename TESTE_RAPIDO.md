# ⚡ Teste Rápido do Sistema de Emails

## 3 Maneiras de Testar os Emails

### 1️⃣ **Página Interativa (Recomendado - 30 segundos)**

```
1. Abra no navegador: http://localhost:5000/teste-emails.html
2. Clique em "Teste Simples" 
3. Veja o resultado nos logs
4. Verifique o email em complex.maraelu@gmail.com
```

**Pronto!** ✓

---

### 2️⃣ **Console do Navegador (F12 - 10 segundos)**

Abra a consola (F12) e copie-cole:

```javascript
await enviarEmailTeste()
```

Você verá:
```
[v0] Iniciando envio de email para: complex.maraelu@gmail.com
[v0] Email enviado com sucesso!
```

**Pronto!** ✓

---

### 3️⃣ **Teste Completo (Todos os 4 tipos)**

No console (F12):

```javascript
await testarEmailsComFeedback()
```

Vai enviar:
1. Email de teste
2. Notificação de inscrição
3. Notificação de contacto
4. Email customizado

E mostrar um relatório.

**Pronto!** ✓

---

## ✅ Como Confirmar que Funcionou

1. **Abra o email** `complex.maraelu@gmail.com`
2. **Procure na caixa de entrada** por emails com:
   - Assunto: `[TESTE] Sistema de Emails`
   - Assunto: `[NOVA INSCRIÇÃO] João Silva Teste`
   - Assunto: `[CONTACTO] Dúvidas sobre Cursos`

3. **Cada email deve ter:**
   - Formatação em HTML
   - Dados simulados corretos
   - Assinatura "Sistema Automático MARA E LU"

---

## 🔧 Se Algo Não Funcionar

### Erro: "enviarEmailTeste is not defined"
- Abra primeiro a página `http://localhost:5000/teste-emails.html`
- OU adicione manualmente no console:
  ```javascript
  <script src="js/emailSender.js"></script>
  ```

### Erro: "API não responde"
- Verifique se o servidor está rodando: `npm start`
- Verifique a porta: `http://localhost:5000`

### Email não chega
- Veja a **caixa de spam** de complex.maraelu@gmail.com
- Veja os **logs do servidor** (onde rodou `npm start`)
- Tente novamente com a **página de teste**

---

## 📊 Resumo

| Teste | Comando | Resultado |
|-------|---------|-----------|
| **Rápido** | Clicar botão em `teste-emails.html` | ✓ Testa 1 email |
| **Console** | `await enviarEmailTeste()` | ✓ Email de teste |
| **Completo** | `await testarEmailsComFeedback()` | ✓ 4 emails diferentes |

---

## 💡 Próximos Passos

Depois de confirmar que está funcionando:

1. **Integre com formulários reais:**
   - `inscrever-se.html` → Enviar email ao inscrever
   - `contacto.html` → Já integrado!

2. **Customize os emails:**
   - Edite `js/emailSender.js`
   - Altere cores, texto, design

3. **Configure produção:**
   - Altere `EMAIL_CONFIG.INSTITUICAO_EMAIL` para email final
   - Teste novamente em produção

---

**⏱️ Tempo total de teste: 1 minuto**

**🎉 Sucesso!**
