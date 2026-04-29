/**
 * ========================================================
 * js/emailSender.js
 * ========================================================
 * Funções JavaScript vanilla para envio de emails reais
 * para a instituição MARA E LU.
 * 
 * Usa o serviço de email via API do servidor (replitMail)
 * que está configurado no backend.
 * 
 * Email da instituição: complex.maraelu@gmail.com
 * ========================================================
 */

// Configuração global
const EMAIL_CONFIG = {
  INSTITUICAO_EMAIL: 'complex.maraelu@gmail.com',
  INSTITUICAO_NOME: 'MARA E LU',
  API_ENDPOINT: '/api/enviar-email', // Endpoint do servidor
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. FUNÇÃO PRINCIPAL: Enviar Email Genérico
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function enviarEmailParaInstituicao(opcoes) {
  const {
    assunto = 'Mensagem da Plataforma MARA E LU',
    htmlCorpo = '',
    textoCorpo = '',
    remetente = 'noreply@maraelu.com',
    nomeRemetente = 'MARA E LU - Sistema Automático',
    contatoRemetente = null, // Email do remetente real (para responder)
  } = opcoes;

  console.log('[v0] Iniciando envio de email para:', EMAIL_CONFIG.INSTITUICAO_EMAIL);

  try {
    const payload = {
      para: EMAIL_CONFIG.INSTITUICAO_EMAIL,
      assunto: assunto,
      html: htmlCorpo,
      texto: textoCorpo,
      remetente: remetente,
      nomeRemetente: nomeRemetente,
      contatoRemetente: contatoRemetente,
    };

    console.log('[v0] Payload do email:', payload);

    const resposta = await fetch(EMAIL_CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[v0] Status da resposta:', resposta.status);

    const dados = await resposta.json();

    console.log('[v0] Resposta do servidor:', dados);

    if (!resposta.ok) {
      throw new Error(dados.erro || `Erro HTTP ${resposta.status}`);
    }

    console.log('[v0] Email enviado com sucesso!');
    return {
      sucesso: true,
      mensagem: 'Email enviado com sucesso para a instituição.',
      dados: dados,
    };
  } catch (erro) {
    console.error('[v0] Erro ao enviar email:', erro.message);
    return {
      sucesso: false,
      mensagem: `Erro ao enviar email: ${erro.message}`,
      erro: erro,
    };
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 2. NOTIFICAÇÃO DE NOVA INSCRIÇÃO
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function enviarEmailNovaInscricao(dadosInscricao) {
  const {
    nome = 'Desconhecido',
    email = 'nao-informado@exemplo.com',
    telefone = 'Não informado',
    curso = 'Não especificado',
    dataInscricao = new Date().toLocaleDateString('pt-AO'),
  } = dadosInscricao;

  const htmlCorpo = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Nova Inscrição Recebida</h2>
        
        <p style="color: #4b5563; margin: 0 0 20px 0;">Uma nova inscrição foi recebida na plataforma MARA E LU:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Nome:</strong> ${escaparHtml(nome)}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${escaparHtml(email)}</p>
          <p style="margin: 8px 0;"><strong>Telefone:</strong> ${escaparHtml(telefone)}</p>
          <p style="margin: 8px 0;"><strong>Curso de Interesse:</strong> ${escaparHtml(curso)}</p>
          <p style="margin: 8px 0;"><strong>Data da Inscrição:</strong> ${dataInscricao}</p>
        </div>
        
        <p style="color: #4b5563; margin: 20px 0;">Por favor, verifique e processe esta inscrição o quanto antes.</p>
        
        <p style="color: #9ca3af; font-size: 12px; margin: 30px 0 0 0;">
          Este é um email automático do sistema MARA E LU. Não responda diretamente a este email.
        </p>
      </div>
    </div>
  `;

  const textoCorpo = `
Nova Inscrição Recebida

Nome: ${nome}
Email: ${email}
Telefone: ${telefone}
Curso: ${curso}
Data: ${dataInscricao}

Este é um email automático do sistema MARA E LU.
  `;

  return enviarEmailParaInstituicao({
    assunto: `[NOVA INSCRIÇÃO] ${nome} - ${curso}`,
    htmlCorpo: htmlCorpo,
    textoCorpo: textoCorpo,
    contatoRemetente: email,
  });
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 3. NOTIFICAÇÃO DE CONTACTO (Formulário de Contacto)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function enviarEmailContacto(dadosContacto) {
  const {
    nome = 'Desconhecido',
    email = 'nao-informado@exemplo.com',
    telefone = 'Não informado',
    assunto = 'Sem assunto',
    mensagem = 'Sem mensagem',
  } = dadosContacto;

  const htmlCorpo = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Mensagem de Contacto Recebida</h2>
        
        <p style="color: #4b5563; margin: 0 0 20px 0;">Uma nova mensagem foi recebida via formulário de contacto:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Nome:</strong> ${escaparHtml(nome)}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${escaparHtml(email)}</p>
          <p style="margin: 8px 0;"><strong>Telefone:</strong> ${escaparHtml(telefone)}</p>
          <p style="margin: 8px 0;"><strong>Assunto:</strong> ${escaparHtml(assunto)}</p>
        </div>
        
        <h3 style="color: #1f2937; margin: 20px 0 10px 0;">Mensagem:</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 0 0 20px 0; white-space: pre-wrap; word-break: break-word;">
          ${escaparHtml(mensagem)}
        </div>
        
        <p style="color: #4b5563; margin: 20px 0;">
          <strong>Responda para:</strong> ${escaparHtml(email)}
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin: 30px 0 0 0;">
          Este é um email automático do sistema MARA E LU. Não responda diretamente a este email.
        </p>
      </div>
    </div>
  `;

  const textoCorpo = `
Mensagem de Contacto Recebida

Nome: ${nome}
Email: ${email}
Telefone: ${telefone}
Assunto: ${assunto}

Mensagem:
${mensagem}

Responda para: ${email}

Este é um email automático do sistema MARA E LU.
  `;

  return enviarEmailParaInstituicao({
    assunto: `[CONTACTO] ${assunto} - ${nome}`,
    htmlCorpo: htmlCorpo,
    textoCorpo: textoCorpo,
    contatoRemetente: email,
  });
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 4. EMAIL DE TESTE (para verificar se está funcionando)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function enviarEmailTeste() {
  const agora = new Date().toLocaleString('pt-AO');

  const htmlCorpo = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Email de Teste - Sistema MARA E LU</h2>
        
        <p style="color: #4b5563; margin: 0 0 20px 0;">Este é um email de teste automático do sistema MARA E LU.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Data/Hora do Teste:</strong> ${agora}</p>
          <p style="margin: 8px 0;"><strong>Status:</strong> ✓ Sistema de emails funcionando corretamente</p>
          <p style="margin: 8px 0;"><strong>Endpoint:</strong> ${EMAIL_CONFIG.API_ENDPOINT}</p>
        </div>
        
        <p style="color: #4b5563; margin: 20px 0;">
          Se recebeu este email, significa que o sistema de emails está operacional e pronto para enviar notificações em tempo real.
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin: 30px 0 0 0;">
          Este é um email automático do sistema MARA E LU.
        </p>
      </div>
    </div>
  `;

  const textoCorpo = `
Email de Teste - Sistema MARA E LU

Data/Hora: ${agora}
Status: Sistema de emails funcionando corretamente
Endpoint: ${EMAIL_CONFIG.API_ENDPOINT}

Se recebeu este email, o sistema está operacional.
  `;

  return enviarEmailParaInstituicao({
    assunto: '[TESTE] Sistema de Emails - MARA E LU',
    htmlCorpo: htmlCorpo,
    textoCorpo: textoCorpo,
  });
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 5. FUNÇÃO UTILITÁRIA: Escapar HTML
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
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

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 6. FUNÇÃO DE TESTE RÁPIDA (no console do navegador)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
async function testarEmailsComFeedback() {
  console.clear();
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  TESTE DE ENVIO DE EMAILS - MARA E LU      ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Teste 1: Email de teste direto
  console.log('📧 [1/4] Enviando email de teste...');
  const teste = await enviarEmailTeste();
  console.log('Resultado:', teste.sucesso ? '✓ ENVIADO' : '✗ ERRO', '\n');

  // Teste 2: Simular nova inscrição
  console.log('📧 [2/4] Enviando notificação de nova inscrição...');
  const inscricao = await enviarEmailNovaInscricao({
    nome: 'João Silva',
    email: 'joao.silva@exemplo.com',
    telefone: '+244 930 123 456',
    curso: 'Informática',
    dataInscricao: new Date().toLocaleDateString('pt-AO'),
  });
  console.log('Resultado:', inscricao.sucesso ? '✓ ENVIADO' : '✗ ERRO', '\n');

  // Teste 3: Simular mensagem de contacto
  console.log('📧 [3/4] Enviando notificação de contacto...');
  const contacto = await enviarEmailContacto({
    nome: 'Maria Santos',
    email: 'maria.santos@exemplo.com',
    telefone: '+244 930 654 321',
    assunto: 'Dúvidas sobre o curso de Informática',
    mensagem: 'Gostaria de saber mais sobre o currículo do curso de Informática e os horários disponíveis.',
  });
  console.log('Resultado:', contacto.sucesso ? '✓ ENVIADO' : '✗ ERRO', '\n');

  // Resumo final
  console.log('╔════════════════════════════════════════════╗');
  console.log('║           RESUMO DOS TESTES                ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`✓ Email de Teste: ${teste.sucesso ? 'ENVIADO' : 'FALHOU'}`);
  console.log(`✓ Inscrição: ${inscricao.sucesso ? 'ENVIADO' : 'FALHOU'}`);
  console.log(`✓ Contacto: ${contacto.sucesso ? 'ENVIADO' : 'FALHOU'}`);
  console.log(`\nEmail da Instituição: ${EMAIL_CONFIG.INSTITUICAO_EMAIL}`);
  console.log(`Endpoint API: ${EMAIL_CONFIG.API_ENDPOINT}`);
}

// Exportar funções para uso global (se necessário)
window.enviarEmailParaInstituicao = enviarEmailParaInstituicao;
window.enviarEmailNovaInscricao = enviarEmailNovaInscricao;
window.enviarEmailContacto = enviarEmailContacto;
window.enviarEmailTeste = enviarEmailTeste;
window.testarEmailsComFeedback = testarEmailsComFeedback;
window.EMAIL_CONFIG = EMAIL_CONFIG;

console.log('✓ Sistema de Emails Carregado');
console.log('  Use: testarEmailsComFeedback() para testar todos os emails');
console.log('  Use: enviarEmailTeste() para teste rápido');
