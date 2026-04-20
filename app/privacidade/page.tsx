import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade — Iara',
  description: 'Como a Iara coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
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

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-[#6b6b8a] mb-10">
          Última atualização: abril de 2026 · Em conformidade com a Lei nº 13.709/2018 (LGPD)
        </p>

        <div className="space-y-10 text-sm text-[#c1c1d8] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">1. Quem somos</h2>
            <p>
              A <strong className="text-[#f1f1f8]">Iara</strong> é uma plataforma de assessoria com inteligência
              artificial para criadores de conteúdo. O controlador dos dados pessoais é o responsável pelo
              serviço, com contato disponível pelo e-mail{' '}
              <a href="mailto:privacidade@iara.app" className="text-iara-400 hover:underline">
                privacidade@iara.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">2. Dados que coletamos</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[#f1f1f8]">Conta:</strong> e-mail e nome completo.</li>
              <li><strong className="text-[#f1f1f8]">Perfil de criador:</strong> nicho, tom de voz, plataformas, objetivo e informações que você preenche voluntariamente.</li>
              <li><strong className="text-[#f1f1f8]">Conteúdos gerados:</strong> roteiros, carrosseis, thumbnails e stories criados com o auxílio da IA são processados em tempo real e não são armazenados permanentemente.</li>
              <li><strong className="text-[#f1f1f8]">Análises de voz:</strong> gravações de áudio enviadas para o módulo de oratória. O áudio é enviado para transcrição e descartado após o processamento; apenas os resultados e feedbacks são salvos.</li>
              <li><strong className="text-[#f1f1f8]">Fotos:</strong> imagens que você carrega voluntariamente no banco de fotos.</li>
              <li><strong className="text-[#f1f1f8]">Métricas:</strong> dados de redes sociais que você insere manualmente ou conecta voluntariamente.</li>
              <li><strong className="text-[#f1f1f8]">Dados de uso:</strong> logs de acesso, erros e informações técnicas para manutenção da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">3. Base legal e finalidade</h2>
            <p className="mb-3">
              Tratamos seus dados com base nas seguintes hipóteses legais previstas na LGPD (art. 7º):
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[#f1f1f8]">Execução de contrato</strong> (art. 7º, V): para criar sua conta e fornecer os módulos da plataforma.</li>
              <li><strong className="text-[#f1f1f8]">Legítimo interesse</strong> (art. 7º, IX): para melhorar a qualidade do serviço e prevenir fraudes.</li>
              <li><strong className="text-[#f1f1f8]">Consentimento</strong> (art. 7º, I): para envio de comunicações de marketing, quando solicitado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">4. Compartilhamento com terceiros</h2>
            <p className="mb-3">
              Para operar a plataforma, utilizamos os seguintes fornecedores de tecnologia:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-[#f1f1f8]">Anthropic (Claude API):</strong> processamento de textos pela IA.
                Conteúdos enviados são sujeitos à{' '}
                <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener" className="text-iara-400 hover:underline">
                  política de privacidade da Anthropic
                </a>
                .
              </li>
              <li>
                <strong className="text-[#f1f1f8]">OpenAI (Whisper):</strong> transcrição de áudio no módulo de oratória e para vídeos sem legenda.
              </li>
              <li>
                <strong className="text-[#f1f1f8]">Supabase:</strong> banco de dados, autenticação e armazenamento de arquivos, com servidores na AWS.
              </li>
              <li>
                <strong className="text-[#f1f1f8]">Vercel:</strong> hospedagem da aplicação.
              </li>
            </ul>
            <p className="mt-3">
              Não vendemos, alugamos nem comercializamos seus dados pessoais com terceiros para fins de publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">5. Transferência internacional</h2>
            <p>
              Seus dados podem ser processados em servidores localizados nos Estados Unidos pelos fornecedores
              listados acima. Essas transferências são realizadas com base em cláusulas contratuais padrão
              que garantem nível adequado de proteção, conforme art. 33 da LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">6. Tempo de retenção</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Dados de conta e perfil: enquanto sua conta estiver ativa.</li>
              <li>Análises de voz e histórico: enquanto você não solicitar exclusão.</li>
              <li>Fotos do banco: enquanto você não as remover ou excluir sua conta.</li>
              <li>Logs técnicos: até 90 dias.</li>
            </ul>
            <p className="mt-3">
              Após a exclusão da conta, todos os dados são removidos permanentemente em até 30 dias,
              salvo obrigação legal de retenção.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">7. Seus direitos (LGPD, art. 18)</h2>
            <p className="mb-3">Você pode, a qualquer momento:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[#f1f1f8]">Acessar</strong> seus dados: faça download completo em <Link href="/dashboard/perfil" className="text-iara-400 hover:underline">Meu Perfil → Exportar dados</Link>.</li>
              <li><strong className="text-[#f1f1f8]">Corrigir</strong> dados incompletos ou incorretos diretamente no perfil.</li>
              <li><strong className="text-[#f1f1f8]">Deletar</strong> sua conta e todos os dados em <Link href="/dashboard/perfil" className="text-iara-400 hover:underline">Meu Perfil → Excluir conta</Link>.</li>
              <li><strong className="text-[#f1f1f8]">Portabilidade:</strong> exporte seus dados em formato JSON.</li>
              <li><strong className="text-[#f1f1f8]">Revogar consentimento</strong> para comunicações de marketing.</li>
              <li><strong className="text-[#f1f1f8]">Peticionar à ANPD</strong> em caso de violação dos seus direitos.</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer direito, entre em contato: {' '}
              <a href="mailto:privacidade@iara.app" className="text-iara-400 hover:underline">
                privacidade@iara.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">8. Cookies</h2>
            <p className="mb-3">Utilizamos apenas cookies essenciais para:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Manter sua sessão autenticada (cookie de sessão do Supabase).</li>
              <li>Lembrar suas preferências de privacidade.</li>
            </ul>
            <p className="mt-3">
              Não usamos cookies de rastreamento ou publicidade. Você pode recusar cookies não essenciais
              no banner de consentimento sem perda de funcionalidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">9. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso
              não autorizado, incluindo: autenticação segura, HTTPS em todas as comunicações, isolamento
              de dados por usuário com Row Level Security (RLS) no banco de dados, e acesso restrito
              dos colaboradores pelo princípio do menor privilégio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">10. Menores de idade</h2>
            <p>
              A plataforma não é destinada a menores de 18 anos. Se você tiver conhecimento de que
              um menor cadastrou uma conta, entre em contato para que possamos excluir os dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">11. Alterações nesta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Mudanças significativas serão comunicadas
              por e-mail ou notificação dentro da plataforma com antecedência mínima de 15 dias.
              A data de última atualização está sempre indicada no topo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">12. Contato e DPO</h2>
            <p>
              Para dúvidas, solicitações ou incidentes de privacidade, entre em contato com nosso
              encarregado de proteção de dados (DPO):
              <br />
              <a href="mailto:privacidade@iara.app" className="text-iara-400 hover:underline">
                privacidade@iara.app
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[#1a1a2e] flex gap-4 text-xs text-[#4a4a6a]">
          <Link href="/termos" className="hover:text-iara-400 transition-colors">Termos de Uso</Link>
          <Link href="/" className="hover:text-iara-400 transition-colors">Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
