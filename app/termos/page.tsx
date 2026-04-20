import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso — Iara',
  description: 'Termos e condições de uso da plataforma Iara.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#f1f1f8]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#6b6b8a] hover:text-iara-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-sm text-[#6b6b8a] mb-10">
          Última atualização: abril de 2026
        </p>

        <div className="space-y-10 text-sm text-[#c1c1d8] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">1. Aceitação dos termos</h2>
            <p>
              Ao criar uma conta e utilizar a plataforma <strong className="text-[#f1f1f8]">Iara</strong>,
              você concorda integralmente com estes Termos de Uso e com nossa{' '}
              <Link href="/privacidade" className="text-iara-400 hover:underline">Política de Privacidade</Link>.
              Se não concordar com qualquer parte, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">2. O serviço</h2>
            <p>
              A Iara é uma plataforma SaaS que oferece ferramentas de inteligência artificial para
              criadores de conteúdo, incluindo: geração de roteiros, carrosseis, thumbnails, stories,
              mídia kit, análise de oratória, calendário editorial e métricas. O serviço é fornecido
              no estado em que se encontra, podendo ser atualizado ou descontinuado a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">3. Conta e responsabilidade</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Você é responsável por manter a segurança das credenciais de acesso.</li>
              <li>Cada conta é pessoal e intransferível.</li>
              <li>Você deve ter pelo menos 18 anos para usar a plataforma.</li>
              <li>É proibido compartilhar, vender ou transferir sua conta para terceiros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">4. Uso aceitável</h2>
            <p className="mb-3">É expressamente proibido usar a Iara para:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Gerar conteúdo ilegal, difamatório, discriminatório, pornográfico ou que viole direitos de terceiros.</li>
              <li>Criar desinformação, notícias falsas ou conteúdo enganoso.</li>
              <li>Violar direitos autorais ou propriedade intelectual de terceiros.</li>
              <li>Realizar engenharia reversa, scraping automatizado ou sobrecarregar os servidores.</li>
              <li>Usar a plataforma para fins concorrenciais sem autorização expressa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">5. Conteúdo gerado pela IA</h2>
            <p>
              O conteúdo gerado pelos módulos de IA é fornecido como sugestão e ponto de partida.
              A Iara não garante precisão, originalidade ou adequação de todo conteúdo gerado.
              Você é o único responsável por revisar, editar e publicar o conteúdo, garantindo
              que esteja em conformidade com as políticas das plataformas e a legislação aplicável.
              O uso do conteúdo gerado é de sua inteira responsabilidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">6. Propriedade intelectual</h2>
            <p>
              O conteúdo gerado com o auxílio da plataforma a partir de suas entradas (textos, fotos,
              descrições) pertence a você. A Iara não reivindica propriedade sobre os conteúdos
              produzidos. A plataforma em si — código, design, marca, logotipo — é propriedade
              exclusiva dos desenvolvedores da Iara e não pode ser reproduzida sem autorização.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">7. Disponibilidade e suporte</h2>
            <p>
              A Iara se esforça para manter a plataforma disponível 24/7, mas não garante
              disponibilidade ininterrupta. Manutenções programadas e eventos fora do nosso controle
              podem causar indisponibilidades temporárias. Não nos responsabilizamos por perdas
              decorrentes de interrupções do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">8. Limitação de responsabilidade</h2>
            <p>
              Na máxima extensão permitida pela legislação brasileira, a Iara não se responsabiliza
              por danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso ou
              incapacidade de uso da plataforma, incluindo perda de receita, dados ou oportunidades
              de negócio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">9. Suspensão e encerramento</h2>
            <p>
              Reservamos o direito de suspender ou encerrar contas que violem estes termos, sem aviso
              prévio em casos graves. Em caso de encerramento por nossa iniciativa sem justa causa,
              notificaremos com antecedência mínima de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">10. Alterações nos termos</h2>
            <p>
              Podemos modificar estes termos a qualquer momento. Mudanças significativas serão
              comunicadas por e-mail com antecedência mínima de 15 dias. O uso continuado após
              as alterações implica aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">11. Lei aplicável e foro</h2>
            <p>
              Estes Termos são regidos pela legislação brasileira. Eventuais disputas serão
              submetidas ao foro da comarca onde o serviço estiver sediado, com renúncia a qualquer
              outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">12. Contato</h2>
            <p>
              Dúvidas sobre estes termos:{' '}
              <a href="mailto:contato@iara.app" className="text-iara-400 hover:underline">
                contato@iara.app
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[#1a1a2e] flex gap-4 text-xs text-[#4a4a6a]">
          <Link href="/privacidade" className="hover:text-iara-400 transition-colors">Política de Privacidade</Link>
          <Link href="/" className="hover:text-iara-400 transition-colors">Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
