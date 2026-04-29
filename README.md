# Colégio Mara & Lú — Site Educacional

Site institucional do Colégio Mara & Lú (Luanda, Angola), construído com tecnologias web fundamentais sem frameworks JavaScript.

---

## Tecnologias utilizadas

| Camada      | Tecnologia                        |
|-------------|-----------------------------------|
| Frontend    | HTML5, CSS3, JavaScript Vanilla   |
| Backend     | Node.js + Express                 |
| Base de dados local | localStorage (browser)  |
| Ícones      | Font Awesome 6                    |
| Tipografia  | Google Fonts (Inter)              |

---

## Estrutura de ficheiros

```
/
├── index.html                 # Página principal (homepage)
├── sobre.html                 # Sobre o colégio
├── cursos.html                # Catálogo de cursos para visitantes
├── contacto.html              # Formulário de contacto
├── inscrever-se.html          # Formulário de inscrição de alunos
├── consultar-inscricao.html   # Consulta de estado de inscrição
├── entrar.html                # Login da área administrativa
├── desenvolvedores.html       # Página da equipa de desenvolvimento
├── politica-privacidade.html  # Política de privacidade
├── termos-servico.html        # Termos de serviço
│
├── admin/
│   ├── Dashboard2.html        # Painel principal (métricas, inscrições recentes)
│   ├── lista-inscricoes.html  # Lista completa de inscrições com filtros
│   ├── todas-inscricoes.html  # Vista alternativa de todas as inscrições
│   ├── aprovados.html         # Inscrições aprovadas
│   ├── vagas.html             # Gestão de vagas disponíveis (CRUD)
│   └── cursos-admin.html      # Gestão de cursos (CRUD)
│
├── css/
│   └── styles.css             # Estilos globais do site
│
├── js/
│   ├── main.js                # Lógica principal: formulários, validações, UI
│   └── admin-core.js          # Núcleo administrativo: dados, notificações, sync
│
├── images/                    # Imagens e logótipos
├── server.js                  # Servidor Express (porta 5000)
└── README.md                  # Este ficheiro
```

---

## Acesso à área administrativa

| Campo         | Valor      |
|---------------|------------|
| Utilizador    | `ADMIN`    |
| Palavra-passe | `admin123` |

Aceder via: `/entrar.html` → redireciona para `Dashboard2.html`

> **Nota:** A autenticação é simulada no cliente (localStorage). Para produção, deve ser migrada para um backend seguro com JWT ou sessões HTTP.

---

## Dados armazenados (localStorage)

| Chave                | Conteúdo                                          |
|----------------------|---------------------------------------------------|
| `inscricoes`         | Lista de inscrições submetidas por candidatos     |
| `notifications`      | Notificações internas do painel admin             |
| `sessao_ativa`       | Sessão do administrador autenticado               |
| `cursos`             | Lista de cursos geridos pelo admin                |
| `vagas`              | Lista de vagas disponíveis                        |
| `ultima_notificacao` | Última notificação para sincronização entre abas  |

---

## Funcionalidades principais

### Site público
- **Inscrição de alunos** — formulário com validações completas:
  - Nº de BI duplicado detectado automaticamente
  - Telefone deve começar com 9 e ter 9 dígitos
  - Classes 10ª–13ª bloqueadas ao turno Tarde
  - 13ª Classe seleciona automaticamente o curso Informática
  - Classes abaixo da 10ª ocultam o campo de curso
- **Consulta de inscrição** — por ID ou BI, mostra estado actual
- **Catálogo de cursos** — lista os cursos disponíveis
- **Formulário de contacto** — envia por FormSubmit para `complex.maraelu@gmail.com`

### Painel administrativo
- **Dashboard** — métricas de inscrições (total, pendentes, aprovadas)
- **Lista de inscrições** — filtros por estado, busca por nome/ID
- **Aprovação/Rejeição** — alterar estado de cada inscrição
- **Gestão de Cursos** — adicionar, editar, eliminar cursos (CRUD)
- **Gestão de Vagas** — adicionar, editar, eliminar vagas (CRUD)
- **Sistema de notificações** — detecta novos cadastros em tempo real (polling a cada 5s)
- **Sincronização entre abas** — alterações numa aba reflectem-se nas outras

### Cursos padrão pré-carregados
Ao abrir `cursos-admin.html` pela primeira vez, os seguintes cursos são carregados automaticamente:
1. **Informática (Técnico)** — Tecnologia de Informação (INF)
2. **Gestão e Administração** — Gestão Empresarial (GES)
3. **Construção Civil** — Engenharia e Construção (CC)

---

## Servidor

```bash
node server.js
```

Corre na porta `5000` em `0.0.0.0`. Serve os ficheiros estáticos e tem um endpoint `/send-email` para envio de emails.

---

## Contacto da escola

- **Email:** complex.maraelu@gmail.com
- **Localização:** Luanda, Angola

---

## Equipa de desenvolvimento

Projecto desenvolvido pela equipa técnica do Colégio Mara & Lú.  
Para suporte: complex.maraelu@gmail.com
