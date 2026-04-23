import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { IaraLogo } from '@/components/iara-logo'

export const metadata: Metadata = {
  title: 'Termos do Programa de Afiliados',
  description: 'Regras, comissões e condições do programa de indicação do Iara Hub.',
}

export default function TermosAfiliadosPage() {
  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8] px-4 py-10 sm:py-16">
      {/* Header */}
      <header className="max-w-3xl mx-auto mb-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar pro site
        </Link>
        <IaraLogo size="sm" layout="horizontal" />
      </header>

      <main className="max-w-3xl mx-auto prose-editorial">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase font-semibold text-iara-400 mb-4">Documento legal</p>
          <h1 className="font-display font-black text-[clamp(32px,5vw,52px)] leading-[1.02] tracking-display mb-4">
            Termos do <span className="font-editorial font-normal text-iara-300/95">Programa</span> de Afiliados
          </h1>
          <p className="text-[#9b9bb5] text-sm">
            Última atualização: 22 de abril de 2026 · Vigência: a partir da data de aceite pelo afiliado
          </p>
        </div>

        <Secao titulo="1. Sobre este documento">
          <P>
            Estes são os Termos e Condições do <Strong>Programa de Afiliados do Iara Hub</Strong>, operado pela plataforma
            <Strong> iarahubapp.com.br</Strong>, de propriedade da empresa mantenedora do serviço (doravante, "Iara Hub").
            Ao se cadastrar no programa — seja clicando em "Aceito os termos" na área de afiliados, compartilhando um link de
            indicação ou recebendo qualquer comissão — você ("Afiliado") declara ter lido, compreendido e concordado
            integralmente com todas as cláusulas abaixo.
          </P>
          <P>
            Se não concorda com qualquer cláusula, <Strong>não participe do programa</Strong>.
          </P>
        </Secao>

        <Secao titulo="2. Quem pode participar">
          <P>
            Pode participar qualquer pessoa física ou jurídica que:
          </P>
          <Lista itens={[
            'Tenha pelo menos 18 anos completos ou seja pessoa jurídica regularmente constituída',
            'Seja titular de uma conta ativa no Iara Hub (qualquer plano, inclusive gratuito)',
            'Tenha chave PIX válida em seu próprio CPF ou CNPJ (para recebimento)',
            'Não esteja em situação de fraude comprovada ou estorno em excesso junto ao Iara Hub',
            'Não seja funcionário, sócio ou prestador direto contratado da Iara Hub',
          ]} />
          <P>
            Menores de idade, pessoas em situação de cadastro duplicado ou que utilizem identidades falsas serão
            <Strong> automaticamente desligadas do programa</Strong>, com perda de todas as comissões pendentes.
          </P>
        </Secao>

        <Secao titulo="3. Como funciona a indicação">
          <P>
            Cada afiliado recebe um <Strong>link único de indicação</Strong> gerado automaticamente pela plataforma, no formato
            <code className="px-1.5 py-0.5 rounded bg-[#0d0d1a] text-iara-300 text-[13px] mx-1">iarahubapp.com.br/?ref=SEUCODIGO</code>.
          </P>
          <P>
            Quando uma pessoa clica nesse link e visita qualquer página do Iara Hub, um <Strong>cookie de rastreamento é armazenado
            no navegador dela por até 30 (trinta) dias corridos</Strong>. Se essa pessoa criar uma conta e assinar qualquer plano pago
            dentro desse período, a indicação é atribuída ao afiliado que forneceu o link.
          </P>
          <P>
            Em caso de <Strong>conflito entre múltiplos links</Strong> (pessoa clicou em links de afiliados diferentes), vale a regra
            <Strong> "último clique antes do cadastro"</Strong>: o afiliado cujo link foi clicado por último recebe a comissão.
          </P>
          <P>
            Cookies de rastreamento podem ser apagados pelo próprio visitante a qualquer momento. Se isso acontecer antes do
            cadastro, a indicação <Strong>não será atribuída</Strong>, e o Iara Hub não se responsabiliza.
          </P>
        </Secao>

        <Secao titulo="4. Comissões">
          <P>O afiliado receberá comissão calculada sobre cada assinatura paga realizada por pessoa indicada, nas seguintes condições:</P>

          <CardNumerico titulo="Primeira venda — 50%" valor="50%">
            <P>
              Cinquenta por cento (50%) do valor líquido da <Strong>primeira fatura paga</Strong> pela pessoa indicada, após o término
              do período de teste gratuito (trial) e desconto das taxas de processamento de pagamento.
            </P>
          </CardNumerico>

          <CardNumerico titulo="Recorrência — 10% por 12 meses" valor="10% × 12m">
            <P>
              Dez por cento (10%) do valor líquido das <Strong>12 (doze) faturas seguintes</Strong> pagas pela pessoa indicada,
              somando no máximo 12 cobranças recorrentes após a primeira venda.
            </P>
            <P>
              Após esse período de 12 meses, a comissão recorrente <Strong>cessa automaticamente</Strong>, mesmo que a pessoa
              indicada continue assinando. Não há renovação ou extensão.
            </P>
          </CardNumerico>

          <P>
            <Strong>Valor líquido</Strong> significa: valor pago pela pessoa indicada <Strong>menos</Strong> taxas de processamento do
            provedor de pagamento (Stripe), impostos incidentes sobre a receita do Iara Hub, e eventuais estornos, reembolsos ou
            chargebacks.
          </P>
          <P>
            As comissões <Strong>não incidem</Strong> sobre: upgrades de plano de usuários preexistentes (pessoas que já eram clientes
            antes da indicação), compras realizadas fora do sistema oficial de pagamento, ou pagamentos recebidos via canais
            alternativos não integrados ao provedor oficial.
          </P>
        </Secao>

        <Secao titulo="5. Pagamento das comissões">
          <P>
            O pagamento das comissões é feito <Strong>mensalmente, até o dia 10 (dez) do mês subsequente</Strong> ao da apuração,
            exclusivamente via PIX, para a chave PIX cadastrada pelo afiliado no painel.
          </P>
          <P>
            <Strong>Valor mínimo para pagamento: R$ 50,00 (cinquenta reais)</Strong>. Valores acumulados abaixo desse mínimo
            permanecerão pendentes e serão somados ao saldo do mês seguinte até atingirem o mínimo.
          </P>
          <P>
            O afiliado é <Strong>integralmente responsável</Strong> pela declaração dos valores recebidos junto à Receita Federal
            e pelo recolhimento de tributos incidentes sobre essa renda (IRPF, ISS, etc). O Iara Hub <Strong>não retém imposto
            na fonte</Strong> e não fornece contracheque, já que não há vínculo empregatício.
          </P>
          <P>
            O afiliado concorda em fornecer <Strong>dados cadastrais verídicos</Strong> (nome completo, CPF ou CNPJ, chave PIX).
            Dados incorretos ou desatualizados podem atrasar ou inviabilizar o pagamento, sem responsabilização da Iara Hub.
          </P>
          <P>
            O Iara Hub emitirá comprovante de pagamento para fins contábeis a pedido do afiliado, por e-mail ou via painel.
          </P>
        </Secao>

        <Secao titulo="6. Estornos, reembolsos e chargebacks">
          <P>
            Se uma pessoa indicada <Strong>cancelar sua assinatura com reembolso</Strong>, ou disputar o pagamento junto ao banco
            (chargeback), ou tiver a fatura estornada por qualquer motivo:
          </P>
          <Lista itens={[
            'A comissão referente a essa venda será automaticamente cancelada, ainda que já tenha sido apurada',
            'Se o valor já foi pago ao afiliado, será descontado do saldo de comissões futuras',
            'Se o afiliado não tiver saldo futuro suficiente, poderá ser acionado para devolução do valor recebido indevidamente',
          ]} />
          <P>
            Em casos de <Strong>fraude comprovada</Strong> (uso de cartão não autorizado, criação de contas falsas, etc.), o Iara Hub
            pode cancelar todas as comissões relacionadas ao afiliado envolvido e encerrar sua participação no programa, sem
            aviso prévio.
          </P>
        </Secao>

        <Secao titulo="7. Conduta vedada">
          <P>São práticas <Strong>expressamente proibidas</Strong> e sujeitam o afiliado à exclusão imediata do programa com perda de comissões pendentes:</P>
          <Lista itens={[
            'Autoindicação: cadastrar-se com dados próprios, de familiar direto ou de pessoa jurídica da qual seja sócio usando o próprio link',
            'Spam massivo: envio não solicitado de mensagens com o link de indicação em larga escala (SMS, WhatsApp, email, Telegram)',
            'Uso de robôs, automações ou geradores de tráfego falso para inflar cliques no link',
            'Compra de anúncios pagando pela palavra-chave "Iara Hub" ou variações (Google Ads, Meta Ads, TikTok Ads) — essa palavra é reservada à marca',
            'Promessa falsa do produto: inventar features, resultados garantidos, depoimentos falsos ou números inventados',
            'Desconto não autorizado: prometer "desconto exclusivo" que não seja oferecido oficialmente pela Iara Hub',
            'Uso de marca registrada de terceiros ou concorrentes em comparações desleais',
            'Promoção em sites de conteúdo ilegal, adulto, pirataria ou de temática ofensiva',
          ]} />
        </Secao>

        <Secao titulo="8. Uso de marca e materiais">
          <P>
            O afiliado pode usar o <Strong>nome "Iara Hub", o logotipo oficial e os materiais promocionais</Strong> (banners, imagens,
            textos) disponibilizados no painel exclusivamente para fins de divulgação legítima do programa, sem alterações, cortes
            ou montagens que distorçam a identidade visual.
          </P>
          <P>
            O afiliado <Strong>não pode se identificar como funcionário, representante oficial ou porta-voz</Strong> da Iara Hub.
            Deve ficar claro na comunicação que é divulgação independente por afiliação.
          </P>
          <P>
            A Iara Hub pode solicitar a remoção de qualquer conteúdo promocional a qualquer momento, e o afiliado se compromete
            a atender em até 72 horas.
          </P>
        </Secao>

        <Secao titulo="9. Transparência obrigatória (LGPD e CDC)">
          <P>
            Em conformidade com o Código de Defesa do Consumidor (CDC) e boas práticas de marketing digital, o afiliado se
            compromete a <Strong>declarar publicamente</Strong> que está fazendo divulgação remunerada ao recomendar o Iara Hub.
          </P>
          <P>
            Expressões sugeridas: <em>"Contém link de afiliado"</em>, <em>"Ganho comissão se você assinar pelo meu link"</em>,
            <em>"#publi #afiliado"</em>. Essa declaração protege tanto o afiliado quanto a Iara Hub perante órgãos reguladores.
          </P>
        </Secao>

        <Secao titulo="10. Proteção de dados">
          <P>
            Para executar o programa, o Iara Hub coleta e processa dados do afiliado (nome, CPF/CNPJ, email, chave PIX,
            histórico de indicações e pagamentos) conforme a <Strong>Lei Geral de Proteção de Dados (Lei 13.709/18)</Strong>.
            A <Link href="/privacidade" className="text-iara-400 hover:text-iara-300 underline">Política de Privacidade</Link>
            detalha como esses dados são armazenados e tratados.
          </P>
          <P>
            O afiliado pode solicitar exclusão completa de seus dados a qualquer momento, o que implica automaticamente o
            encerramento da participação no programa.
          </P>
        </Secao>

        <Secao titulo="11. Alterações nos termos e nas comissões">
          <P>
            A Iara Hub reserva-se o direito de <Strong>alterar estes termos a qualquer momento</Strong>, mediante aviso prévio de
            30 (trinta) dias enviado por email aos afiliados ativos. Alterações nos percentuais de comissão <Strong>aplicam-se
            apenas a novas indicações</Strong>; comissões de indicações já ativadas seguem as regras vigentes no momento da ativação.
          </P>
          <P>
            Se o afiliado discordar das alterações, pode encerrar sua participação no programa a qualquer momento, e receberá
            as comissões pendentes conforme apuração normal, desde que atinjam o valor mínimo.
          </P>
        </Secao>

        <Secao titulo="12. Encerramento da participação">
          <P>
            Qualquer das partes pode encerrar a participação no programa a qualquer momento:
          </P>
          <Lista itens={[
            'O afiliado pode solicitar o encerramento por email ou pelo próprio painel, perdendo acesso ao link a partir da data do pedido',
            'A Iara Hub pode desligar o afiliado em caso de violação destes termos, fraude comprovada, ou ação que prejudique a marca',
            'Em ambos os casos, as comissões já apuradas e devidas serão pagas no próximo ciclo mensal regular',
            'Comissões recorrentes em andamento (dos 12 meses) são interrompidas imediatamente após o encerramento',
          ]} />
        </Secao>

        <Secao titulo="13. Limitação de responsabilidade">
          <P>
            A Iara Hub não se responsabiliza por:
          </P>
          <Lista itens={[
            'Falhas técnicas temporárias no rastreamento de cookies (por bloqueadores, navegador anônimo, ou apagamento voluntário pelo visitante)',
            'Cliques ou indicações não registradas por problemas fora do controle da plataforma (provedores de email bloqueando, redes sociais alterando algoritmo)',
            'Expectativa de faturamento do afiliado — nenhum valor mínimo é garantido',
            'Decisões da pessoa indicada (ela pode cancelar, fazer downgrade, ou contestar a qualquer momento)',
            'Impostos ou obrigações acessórias decorrentes do recebimento das comissões pelo afiliado',
          ]} />
        </Secao>

        <Secao titulo="14. Foro e legislação aplicável">
          <P>
            Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de São Paulo/SP como competente para
            dirimir eventuais controvérsias, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </P>
          <P>
            Eventuais conflitos serão preferencialmente resolvidos pela via extrajudicial, mediante contato com o suporte do
            Iara Hub em <Link href="/ajuda" className="text-iara-400 hover:text-iara-300 underline">iarahubapp.com.br/ajuda</Link>
            ou pelo email <Strong>iarahubapp@gmail.com</Strong>.
          </P>
        </Secao>

        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-[#5a5a7a] mb-3">Em caso de dúvidas sobre estes termos:</p>
          <Link href="/ajuda" className="text-sm text-iara-400 hover:text-iara-300 font-semibold">
            Central de Ajuda →
          </Link>
          <p className="text-[11px] text-[#3a3a5a] tracking-[0.18em] uppercase mt-8">
            © {new Date().getFullYear()} Iara Hub · Documento v1
          </p>
        </div>
      </main>
    </div>
  )
}

/* ─── Componentes auxiliares de leitura ─────────────────────── */
function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display font-bold text-[#f1f1f8] text-[22px] sm:text-[26px] mb-4 leading-tight">{titulo}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-[#c1c1d8] leading-[1.7]">{children}</p>
}
function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-[#f1f1f8] font-semibold">{children}</strong>
}
function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-2 my-3">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3 text-[14px] text-[#c1c1d8] leading-[1.65]">
          <span className="text-iara-400 flex-shrink-0 mt-1">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
function CardNumerico({ titulo, valor, children }: { titulo: string; valor: string; children: React.ReactNode }) {
  return (
    <div className="my-4 p-5 rounded-2xl border border-iara-700/25 bg-gradient-to-br from-iara-950/30 to-[#0a0a14]">
      <div className="flex items-start justify-between mb-3 gap-4 flex-wrap">
        <p className="font-display font-bold text-[#f1f1f8] text-[16px]">{titulo}</p>
        <p className="font-display font-black tabular-nums text-iara-400 text-lg">{valor}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
