import type { Metadata } from "next";
import { LegalPublicLayout } from "@/components/LegalPublicLayout";

const RAZAO_SOCIAL = "61.566.513 LUIZ MARCELO LOVATO MOTA";
const CNPJ = "61.566.513/0001-59";
const EMPRESA_LEGAL = `${RAZAO_SOCIAL}, CNPJ ${CNPJ}`;

export const metadata: Metadata = {
  title: "Termos de uso – Orçamento Já",
  description: "Termos de uso da plataforma Orçamento Já.",
};

export default function TermosDeUsoPage() {
  return (
    <LegalPublicLayout title="Termos de Uso – Orçamento Já">
      <p className="!mt-0 text-sm text-zinc-500">
        Última atualização: 24 de março de 2026
      </p>

      <p className="mt-6">
        Estes Termos de Uso regulam o acesso e utilização da plataforma Orçamento Já, disponibilizada por{" "}
        {EMPRESA_LEGAL}, em conformidade com a legislação vigente, incluindo a Lei Geral de Proteção de
        Dados (LGPD).
      </p>

      <p className="mt-4">
        Ao utilizar a plataforma, o usuário declara que leu, compreendeu e concorda com estes Termos.
      </p>

      <h2 className="mt-10">1. Objeto da Plataforma</h2>
      <p>
        O Orçamento Já é uma plataforma SaaS que permite aos usuários criar, gerenciar e compartilhar
        orçamentos online, podendo incluir dados de seus próprios clientes.
      </p>

      <h2 className="mt-8">2. Cadastro e Acesso</h2>
      <p>
        Para utilizar a plataforma, o usuário deve realizar cadastro informando dados verdadeiros, completos
        e atualizados. O usuário é responsável por manter a confidencialidade de suas credenciais de acesso
        e por todas as atividades realizadas em sua conta.
      </p>

      <h2 className="mt-8">3. Uso da Plataforma</h2>
      <p>
        O usuário se compromete a utilizar a plataforma de forma legal, ética e de acordo com estes Termos,
        sendo proibido:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Utilizar a plataforma para atividades ilícitas</li>
        <li>Inserir dados falsos ou de terceiros sem autorização</li>
        <li>Tentar acessar sistemas ou dados sem permissão</li>
        <li>Utilizar a plataforma para envio de spam ou práticas abusivas</li>
      </ul>

      <h2 className="mt-8">4. Responsabilidade sobre Dados de Terceiros</h2>
      <p>
        A plataforma permite que o usuário insira dados de seus próprios clientes para geração de
        orçamentos. O usuário é integralmente responsável por esses dados, incluindo sua coleta, uso e
        compartilhamento, devendo garantir que possui base legal para tal, conforme a legislação aplicável.
        O Orçamento Já não se responsabiliza por dados inseridos pelos usuários.
      </p>

      <h2 className="mt-8">5. Planos e Limitações</h2>
      <p>
        A plataforma poderá oferecer planos gratuitos com limitações e planos pagos com funcionalidades
        adicionais. As condições, valores e limitações poderão ser alterados a qualquer momento, mediante
        comunicação prévia ao usuário.
      </p>

      <h2 className="mt-8">6. Pagamentos</h2>
      <p>
        Nos planos pagos, os pagamentos serão processados por plataformas terceiras especializadas. O
        Orçamento Já não armazena dados completos de cartões de crédito. O acesso aos recursos pagos poderá
        ser suspenso em caso de inadimplência.
      </p>

      <h2 className="mt-8">7. Disponibilidade do Serviço</h2>
      <p>
        O Orçamento Já se esforça para manter a plataforma disponível continuamente, porém não garante
        funcionamento ininterrupto ou livre de erros, podendo ocorrer interrupções para manutenção,
        atualizações ou por fatores externos.
      </p>

      <h2 className="mt-8">8. Limitação de Responsabilidade</h2>
      <p>O Orçamento Já não se responsabiliza por:</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Decisões tomadas com base nos orçamentos gerados</li>
        <li>Erros decorrentes de informações inseridas pelos usuários</li>
        <li>Danos indiretos, lucros cessantes ou prejuízos decorrentes do uso da plataforma</li>
        <li>Falhas causadas por serviços de terceiros</li>
      </ul>

      <h2 className="mt-8">9. Propriedade Intelectual</h2>
      <p>
        Todos os direitos relacionados à plataforma, incluindo software, design e funcionalidades, pertencem
        ao Orçamento Já. O usuário não está autorizado a copiar, modificar ou explorar comercialmente a
        plataforma sem autorização.
      </p>

      <h2 className="mt-8">10. Suspensão e Cancelamento</h2>
      <p>
        O Orçamento Já poderá suspender ou cancelar contas que violem estes Termos, sem aviso prévio. O
        usuário pode cancelar sua conta a qualquer momento.
      </p>

      <h2 className="mt-8">11. Alterações nos Termos</h2>
      <p>
        Estes Termos podem ser atualizados a qualquer momento. O uso contínuo da plataforma após alterações
        implica concordância com os novos termos.
      </p>

      <h2 className="mt-8">12. Legislação e Foro</h2>
      <p>
        Estes Termos serão regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
        comarca da sede da empresa para dirimir quaisquer conflitos.
      </p>

      <h2 className="mt-8">13. Contato</h2>
      <p>Em caso de dúvidas, o usuário poderá entrar em contato:</p>
      <p className="mt-2">
        E-mail:{" "}
        <a
          href="mailto:luizmarcellolm@gmail.com"
          className="text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline"
        >
          luizmarcellolm@gmail.com
        </a>
      </p>
      <p className="mt-2">
        Empresa: {RAZAO_SOCIAL} — CNPJ {CNPJ}
      </p>

      <p className="mt-10 border-t border-zinc-200 pt-8">
        Ao utilizar o Orçamento Já, o usuário declara estar ciente e de acordo com estes Termos de Uso.
      </p>
    </LegalPublicLayout>
  );
}
