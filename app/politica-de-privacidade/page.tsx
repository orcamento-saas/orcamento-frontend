import type { Metadata } from "next";
import { LegalPublicLayout } from "@/components/LegalPublicLayout";

const RAZAO_SOCIAL = "61.566.513 LUIZ MARCELO LOVATO MOTA";
const CNPJ = "61.566.513/0001-59";

export const metadata: Metadata = {
  title: "Política de privacidade – Orçamentos LM",
  description: "Política de privacidade da plataforma Orçamentos LM.",
};

export default function PoliticaPrivacidadePage() {
  return (
    <LegalPublicLayout title="Política de Privacidade – Orçamentos LM">
      <p className="!mt-0 text-sm text-zinc-500">
        Última atualização: 24 de março de 2026
      </p>

      <p className="mt-6">
        A presente Política de Privacidade descreve como a plataforma Orçamentos LM coleta, utiliza,
        armazena e protege os dados pessoais dos usuários, em conformidade com a legislação vigente,
        especialmente a Lei Geral de Proteção de Dados (LGPD).
      </p>

      <h2 className="mt-10">1. Coleta de Dados</h2>
      <p>
        Coletamos os seguintes dados pessoais dos usuários: nome, e-mail e telefone. Esses dados são
        fornecidos diretamente pelo usuário no momento do cadastro ou utilização da plataforma. Além
        disso, usuários da plataforma podem inserir dados de terceiros (como clientes finais) ao gerar
        orçamentos.
      </p>

      <h2 className="mt-8">2. Uso das Informações</h2>
      <p>
        Os dados coletados são utilizados para criar e gerenciar contas de usuário, permitir a geração e
        gerenciamento de orçamentos, entrar em contato com o usuário quando necessário, melhorar a
        experiência da plataforma e cumprir obrigações legais e regulatórias.
      </p>

      <h2 className="mt-8">3. Dados de Terceiros Inseridos pelos Usuários</h2>
      <p>
        A plataforma permite que usuários cadastrem informações de seus próprios clientes para geração de
        orçamentos. Nesses casos, o usuário é o responsável pelos dados inseridos, enquanto a plataforma
        Orçamentos LM atua como operador desses dados, apenas armazenando e processando conforme instruções do
        usuário.
        O usuário declara que possui autorização para utilizar esses dados conforme a legislação
        aplicável.
      </p>

      <h2 className="mt-8">4. Compartilhamento de Dados</h2>
      <p>
        Os dados poderão ser compartilhados com terceiros apenas quando necessário para o funcionamento da
        plataforma, como serviços de infraestrutura e banco de dados (ex: Supabase) e serviços de pagamento
        (ex: plataformas como Stripe ou similares). Esses terceiros são contratados seguindo critérios de
        segurança e proteção de dados.
      </p>

      <h2 className="mt-8">5. Armazenamento e Segurança</h2>
      <p>
        Os dados são armazenados em ambientes seguros e controlados, com uso de medidas técnicas e
        administrativas para proteção contra acesso não autorizado, vazamentos e alterações indevidas.
        Apesar disso, nenhum sistema é completamente seguro, e não podemos garantir segurança absoluta.
      </p>

      <h2 className="mt-8">6. Retenção de Dados</h2>
      <p>
        Os dados pessoais serão armazenados enquanto a conta do usuário estiver ativa ou enquanto forem
        necessários para cumprimento de obrigações legais. O usuário pode solicitar a exclusão de seus dados
        a qualquer momento.
      </p>

      <h2 className="mt-8">7. Direitos do Usuário</h2>
      <p>
        Nos termos da LGPD, o usuário tem direito de confirmar a existência de tratamento de dados, acessar
        seus dados, corrigir dados incompletos ou desatualizados, solicitar a exclusão de seus dados e
        revogar o consentimento. As solicitações podem ser feitas através do contato informado nesta
        política.
      </p>

      <h2 className="mt-8">8. Cookies e Tecnologias</h2>
      <p>
        A plataforma pode utilizar cookies e tecnologias semelhantes para melhorar a navegação, armazenar
        preferências e analisar o uso da aplicação. O usuário pode configurar seu navegador para bloquear
        cookies, se desejar.
      </p>

      <h2 className="mt-8">9. Planos e Pagamentos</h2>
      <p>
        A plataforma poderá oferecer planos gratuitos e pagos. Para planos pagos, os pagamentos serão
        processados por terceiros especializados, e não armazenamos dados completos de cartão de crédito.
      </p>

      <h2 className="mt-8">10. Alterações nesta Política</h2>
      <p>
        Esta Política de Privacidade pode ser atualizada a qualquer momento, sendo recomendada a revisão
        periódica por parte do usuário.
      </p>

      <h2 className="mt-8">11. Contato</h2>
      <p>
        Em caso de dúvidas ou solicitações relacionadas a esta Política de Privacidade, entre em contato:
      </p>
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
        Ao utilizar a plataforma Orçamentos LM, o usuário declara estar ciente e de acordo com esta Política
        de Privacidade.
      </p>
    </LegalPublicLayout>
  );
}
