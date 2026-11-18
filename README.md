Orçamentos LM

SaaS para criar, enviar e acompanhar orçamentos profissionais em poucos minutos.

🔗 Acesse: [https://www.orcamentoslm.com.br/]

🇺🇸 SaaS for small service businesses to create, send and track professional quotes, with digital signature, PDF generation and recurring billing (Pix and credit card).

🎯 O problema

Pequenos prestadores de serviço (instaladores, técnicos, autônomos) ainda fazem orçamentos à mão, no Word ou no WhatsApp. O resultado parece pouco profissional, se perde fácil e não há como saber se o cliente abriu, aprovou ou se o serviço foi executado.

💡 A solução

Uma plataforma web onde o profissional monta o orçamento com a própria marca, gera o PDF, envia por link ou WhatsApp, e o cliente assina digitalmente pelo celular. Tudo fica organizado num painel, com agenda de execução e notificações.

✨ Funcionalidades

Para o profissional

Criação de orçamentos com vários modelos de layout
Logo da empresa com editor de recorte de imagem
Pré-visualização e geração de PDF
Compartilhamento por link público e mensagem pronta para WhatsApp
Assinatura digital do cliente direto na tela
Agendamento da execução do serviço e marcação de serviço executado
Painel com resumo dos orçamentos e notificações
Tutorial guiado para novos usuários

Planos e pagamentos

Plano Free e plano Pro (R$ 19,90/mês)
Assinatura recorrente integrada ao Asaas, com Pix e cartão de crédito
Período de teste, cancelamento e controle de acesso até o fim do período pago

Área administrativa

Gestão de usuários: alteração de plano e suspensão de conta
Registro de eventos do sistema (login, logout e outros)
Análise de tráfego da landing page
Central de dúvidas enviadas pelos usuários

Marketing

Landing page própria
Integração com Google Ads para medir conversões
🛠️ Tecnologias
Camada	Tecnologia
Frontend	Next.js 15 (App Router), React 18, TypeScript
Estilo	Tailwind CSS
Autenticação e armazenamento	Supabase (Auth e Storage)
Pagamentos	Asaas (Pix e cartão, assinatura recorrente)
Comunicação com a API	Axios, API REST própria
Hospedagem	Vercel
Backend	[COLOQUE AQUI: ex. Node.js + Express + PostgreSQL] (repositório privado)
🏗️ Arquitetura
Usuário (navegador)
      │
      ▼
Frontend (Next.js · Vercel)  ──►  Supabase Auth / Storage
      │
      ▼
API REST (backend privado)  ──►  Banco de dados
      │
      ▼
Asaas (cobrança Pix / cartão)

O frontend cuida da interface, autenticação e geração de pré-visualizações. Regras de negócio, geração de PDF, assinaturas e cobrança ficam na API.

📸 Telas
<!-- Tire prints e arraste para cá no editor do GitHub -->
Painel	Criação de orçamento	Assinatura do cliente
[print]	[print]	[print]
🚀 Rodando localmente
bash
git clone https://github.com/orcamento-saas/orcamento-frontend.git
cd orcamento-frontend
npm install

Crie um arquivo .env.local com:

env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
bash
npm run dev

O backend é privado, então algumas funcionalidades dependem da API em produção.

👤 Autor

Luiz Marcelo Mota · Desenvolvedor | Automação e Integração de Sistemas

[LinkedIn](COLOQUE AQUI O LINK) · GitHub
