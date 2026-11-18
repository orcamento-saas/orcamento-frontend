# Orçamentos LM

**SaaS para criar, enviar e acompanhar orçamentos profissionais em poucos minutos.**

🔗 **Acesse:** [https://www.orcamentoslm.com.br/]

> 🇺🇸 *SaaS for small service businesses to create, send and track professional quotes, with digital signature, PDF generation and recurring billing (Pix and credit card).*

---

## 🎯 O problema

Pequenos prestadores de serviço (instaladores, técnicos, autônomos) ainda fazem orçamentos à mão, no Word ou no WhatsApp. O resultado parece pouco profissional, se perde fácil e não há como saber se o cliente abriu, aprovou ou se o serviço foi executado.

## 💡 A solução

Uma plataforma web onde o profissional monta o orçamento com a própria marca, gera o PDF, envia por link ou WhatsApp, e o cliente **assina digitalmente pelo celular**. Tudo fica organizado num painel, com agenda de execução e notificações.

---

## ✨ Funcionalidades

**Para o profissional**
- Cadastro e login com **e-mail e senha** ou **conta Google**, com recuperação de senha
- Criação de orçamentos com **3 modelos de layout**: Simples, Moderno e Profissional
- **Logo da empresa** com editor de recorte de imagem
- Pré-visualização e **geração de PDF**
- **Compartilhamento** por link público, mensagem pronta para WhatsApp e e-mail
- **Assinatura digital** do cliente direto na tela
- **Agendamento** da execução do serviço e marcação de serviço executado
- Painel com resumo dos orçamentos e **notificações**
- Tutorial guiado para novos usuários

**Planos e pagamentos**
- Plano **Free** e plano **Pro (R$ 19,90/mês)**
- Assinatura recorrente integrada ao **Asaas**, com **Pix e cartão de crédito**
- Suporte a período de teste, cancelamento e acesso Pro mantido até o fim do período pago

**Área administrativa**
- Gestão de usuários: alteração de plano e suspensão de conta
- Registro de eventos do sistema: logins, orçamentos criados e assinados, cobranças (webhooks do Asaas) e erros
- **Análise de tráfego** da landing page
- Central de dúvidas enviadas pelos usuários

**Marketing e conformidade**
- Landing page própria
- Integração com **Google Ads** para medir conversões
- Páginas de **Termos de Uso** e **Política de Privacidade**

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript |
| Estilo | Tailwind CSS |
| Autenticação e armazenamento | Supabase (Auth com e-mail/senha e Google, Storage) |
| Pagamentos | Asaas (Pix e cartão, assinatura recorrente) |
| Comunicação com a API | API REST própria (fetch) |
| Hospedagem | Vercel |
| Backend | [COLOQUE AQUI: ex. Node.js + Express + PostgreSQL] (repositório privado) |

---

## 🏗️ Arquitetura

```
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
```

O frontend cuida da interface, autenticação e geração de pré-visualizações. Regras de negócio, geração de PDF, assinaturas e cobrança ficam na API.

---

## 📸 Telas

<!-- Tire prints e arraste para cá no editor do GitHub -->
| Painel | Criação de orçamento | Assinatura do cliente |
|---|---|---|
| [print] | [print] | [print] |

---

## 🚀 Rodando localmente

```bash
git clone https://github.com/orcamento-saas/orcamento-frontend.git
cd orcamento-frontend
npm install
```

Crie um arquivo `.env.local` com:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

```bash
npm run dev
```

> O backend é privado, então algumas funcionalidades dependem da API em produção.

---

## 👤 Autor

**Luiz Marcelo Mota** · Desenvolvedor | Automação e Integração de Sistemas

[LinkedIn](COLOQUE AQUI O LINK) · [GitHub](https://github.com/luizmarcelolm)
