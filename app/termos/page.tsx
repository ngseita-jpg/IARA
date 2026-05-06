import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso — Iara Hub',
  description: 'Termos e condições de uso da plataforma Iara Hub. LGPD, uso aceitável, anti-fraude.',
}

// IMPORTANTE: versao em lib/termos-versao.ts e' a fonte de verdade.
// Texto abaixo mostra ela visualmente.
import { TERMOS_VERSAO_ATUAL } from '@/lib/termos-versao'

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
        <p className="text-sm text-[#6b6b8a] mb-2">
          Versão {TERMOS_VERSAO_ATUAL} · vigente desde 4 de maio de 2026
        </p>
        <p className="text-xs text-[#4a4a6a] mb-10">
          Operado por Iara Hub Tecnologia Ltda — registrado no Brasil. Estes termos se aplicam a contas criadas a partir de 4 de maio de 2026. Contas anteriores estão sob a versão 2026-04-01 dos termos, podendo migrar voluntariamente.
        </p>

        <div className="space-y-10 text-sm text-[#c1c1d8] leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">1. Aceitação e capacidade legal</h2>
            <p>
              Ao criar conta e usar a plataforma <strong className="text-[#f1f1f8]">Iara Hub</strong> (&ldquo;Iara&rdquo;, &ldquo;plataforma&rdquo; ou &ldquo;serviço&rdquo;), você declara: (a) ter no mínimo 18 anos completos; (b) ter capacidade civil plena; (c) ter lido, compreendido e concordado integralmente com estes Termos de Uso e com nossa{' '}
              <Link href="/privacidade" className="text-iara-400 hover:underline">Política de Privacidade</Link>.
              Se você usa a plataforma em nome de pessoa jurídica, declara ter poderes para vincular a entidade.
              Se discorda de qualquer cláusula, NÃO crie conta nem use o serviço.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">2. Descrição do serviço</h2>
            <p>
              A Iara é uma plataforma SaaS de assessoria com inteligência artificial para criadores de conteúdo, profissionais liberais e marcas. Inclui geração de roteiros, carrosseis, thumbnails, stories, mídia kit, análise de oratória, planejamento editorial, métricas e ferramentas auxiliares. O serviço é oferecido em planos gratuito e pagos. Recursos podem ser modificados, adicionados ou removidos com aviso prévio razoável.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">3. Cadastro e segurança da conta</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Cada conta é <strong className="text-[#f1f1f8]">pessoal, individual e intransferível</strong>.</li>
              <li>Você deve fornecer informações verdadeiras e mantê-las atualizadas.</li>
              <li>Você é integralmente responsável pela guarda das credenciais e por toda atividade realizada na sua conta.</li>
              <li>Notifique imediatamente qualquer suspeita de uso não autorizado em {' '}
                <a href="mailto:ngseita@gmail.com" className="text-iara-400 hover:underline">ngseita@gmail.com</a>.
              </li>
              <li>A Iara pode adotar verificação por captcha, e-mail e telefone a qualquer momento para prevenir fraude.</li>
            </ul>
          </section>

          {/* 4 — CHAVE: anti-compartilhamento */}
          <section>
            <h2 className="text-lg font-semibold text-amber-400 mb-3">4. Uso compartilhado e abusivo — proibição expressa</h2>
            <p className="mb-3">
              Cada assinatura cobre <strong className="text-[#f1f1f8]">um (1) único usuário pessoa física</strong>. Você pode acessar de múltiplos dispositivos próprios (celular, desktop, tablet), desde que TODOS pertençam a você e sejam usados por você.
            </p>
            <p className="mb-3">São consideradas <strong className="text-amber-400">infrações graves</strong>, sujeitas a banimento imediato sem reembolso:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Compartilhar credenciais com terceiros (parentes, sócios, equipes, agências, alunos).</li>
              <li>Revender, sublicenciar, alugar ou disponibilizar o acesso a terceiros, gratuita ou onerosamente.</li>
              <li>Criar múltiplas contas para burlar limites de plano gratuito ou trial.</li>
              <li>Usar nome, e-mail ou dados de pessoa diferente da que efetivamente utiliza a conta.</li>
              <li>Tentar burlar rate limits via VPN, proxies, scripts automatizados ou rotação de IP.</li>
              <li>Acessar a partir de mais de 3 IPs distintos em um período de 24 horas (forte indício de compartilhamento).</li>
              <li>Realizar engenharia reversa, scraping, mineração de dados ou ataques à infraestrutura.</li>
              <li>Sobrecarregar intencionalmente os servidores (denial of service, geração massiva).</li>
            </ul>
            <p className="mt-3 text-amber-300/80 text-xs">
              Detecção: monitoramos padrões de uso (IPs, dispositivos, frequência) por meios automatizados. Em caso de suspeita, podemos solicitar verificação adicional. A continuidade do uso anômalo após pedido de verificação implica banimento.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">5. Conteúdo proibido</h2>
            <p className="mb-3">É expressamente proibido usar a Iara para gerar, publicar ou distribuir:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Conteúdo ilegal sob a legislação brasileira (Marco Civil da Internet, Código Penal, LGPD).</li>
              <li>Material discriminatório (raça, gênero, orientação sexual, religião, classe).</li>
              <li>Conteúdo sexualmente explícito ou erótico, especialmente envolvendo menores.</li>
              <li>Difamação, calúnia, injúria contra pessoa física ou jurídica.</li>
              <li>Desinformação, fake news, conteúdo enganoso sobre saúde, eleições ou direitos.</li>
              <li>Promessas de resultado garantido em saúde, finanças ou outras áreas reguladas, em desacordo com o respectivo conselho profissional.</li>
              <li>Material que viole direitos autorais, marca registrada, segredo industrial ou imagem de terceiros.</li>
              <li>Phishing, malware, golpes, esquemas de pirâmide ou correntes.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">6. Conteúdo gerado por IA — responsabilidade do usuário</h2>
            <p className="mb-3">
              O conteúdo produzido pelos módulos de IA é fornecido como <strong className="text-[#f1f1f8]">sugestão automatizada</strong>, podendo conter imprecisões factuais, erros gramaticais ou semelhanças com material existente. A Iara não garante:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Originalidade absoluta dos textos ou imagens.</li>
              <li>Conformidade automática com regulamentações setoriais (CFM, CFO, CRP, OAB, CRN, etc.).</li>
              <li>Aprovação pelas plataformas de destino (Instagram, YouTube, TikTok, etc.).</li>
              <li>Resultados comerciais (engajamento, conversão, vendas).</li>
            </ul>
            <p className="mt-3">
              Você assume integral responsabilidade pela revisão, edição e publicação. Profissionais regulamentados (médicos, dentistas, advogados, psicólogos, nutricionistas, etc.) declaram conhecer e respeitar as normas de seus respectivos conselhos ao publicar conteúdo gerado.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">7. Propriedade intelectual</h2>
            <p className="mb-3">
              <strong className="text-[#f1f1f8]">Seu conteúdo:</strong> textos, imagens e dados que você fornece como entrada permanecem de sua titularidade. Você concede à Iara licença não-exclusiva, mundial e gratuita, limitada ao tempo de vigência da conta, para processar essas entradas exclusivamente para fornecer o serviço.
            </p>
            <p className="mb-3">
              <strong className="text-[#f1f1f8]">Saída gerada:</strong> textos, carrosseis, roteiros e demais materiais gerados pela IA com base em suas entradas pertencem a você. A Iara não reivindica titularidade sobre o resultado, mas se reserva o direito de usar dados anonimizados e agregados (sem identificação pessoal) para melhorar modelos e produtos.
            </p>
            <p>
              <strong className="text-[#f1f1f8]">Plataforma:</strong> código-fonte, design, marca &ldquo;Iara Hub&rdquo;, logotipo, identidade visual e demais elementos da plataforma são propriedade exclusiva da Iara Hub Tecnologia Ltda. Reprodução não autorizada é proibida.
            </p>
          </section>

          {/* 8 — LGPD */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">8. Proteção de dados (LGPD)</h2>
            <p className="mb-3">
              A Iara é controladora dos dados pessoais que você fornece. Tratamos seus dados com base em: (a) execução de contrato (Lei 13.709/2018, art. 7º, V); (b) cumprimento de obrigação legal; (c) legítimo interesse para prevenção de fraude. A íntegra está na{' '}
              <Link href="/privacidade" className="text-iara-400 hover:underline">Política de Privacidade</Link>.
            </p>
            <p className="mb-3"><strong className="text-[#f1f1f8]">Seus direitos como titular (art. 18 LGPD):</strong></p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Confirmação da existência de tratamento, acesso aos dados, correção e atualização.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade — solicitação de seus dados em formato legível.</li>
              <li>Eliminação dos dados pessoais tratados com seu consentimento.</li>
              <li>Revogação do consentimento a qualquer momento.</li>
              <li>Informação sobre uso compartilhado e consequências da negativa de consentimento.</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer direito, envie e-mail para{' '}
              <a href="mailto:ngseita@gmail.com" className="text-iara-400 hover:underline">ngseita@gmail.com</a>{' '}
              identificando-se. Respondemos em até 15 dias úteis.
            </p>
            <p className="mt-3 text-xs text-[#6b6b8a]">
              Infraestrutura: dados armazenados em Supabase (banco de dados) e Vercel (aplicação). Servidores localizados nos EUA com criptografia em trânsito (TLS) e em repouso (AES-256). Pagamentos processados pela Stripe (PCI-DSS Level 1) — não armazenamos dados de cartão.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">9. Cookies e tecnologias de monitoramento</h2>
            <p>
              Usamos cookies essenciais (autenticação, segurança), funcionais (preferências) e analíticos (métricas de uso, correção de bugs). Cookies analíticos exigem seu consentimento ativo (banner LGPD). Você pode desabilitar a qualquer momento nas configurações do navegador, mas alguns recursos podem deixar de funcionar.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">10. Pagamentos, trial, cancelamento e reembolso</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[#f1f1f8]">Trial:</strong> 3 dias gratuitos com cobrança automática ao final, salvo cancelamento prévio.</li>
              <li><strong className="text-[#f1f1f8]">Cobrança:</strong> recorrente mensal ou anual, conforme escolha. Renovação automática.</li>
              <li><strong className="text-[#f1f1f8]">Cancelamento:</strong> a qualquer momento via área &ldquo;Minha Conta&rdquo;. Sem multas.</li>
              <li><strong className="text-[#f1f1f8]">Reembolso:</strong> não há reembolso por períodos já cobrados. Após cancelar, você mantém acesso até o fim do ciclo pago.</li>
              <li><strong className="text-[#f1f1f8]">Cupons:</strong> exclusivos e intransferíveis. Uso indevido cancela o desconto e a conta.</li>
              <li><strong className="text-[#f1f1f8]">Aumentos de preço:</strong> comunicados com 30 dias de antecedência. Você pode cancelar antes da nova cobrança.</li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">11. Disponibilidade e SLA</h2>
            <p>
              Buscamos disponibilidade 24/7. Não garantimos uptime contratual (SLA). Manutenções programadas serão comunicadas com antecedência razoável. Eventos de força maior, falha de provedores terceiros (Stripe, Anthropic, OpenAI, Vercel, Supabase) ou ataques externos podem causar indisponibilidades temporárias sem direito a compensação.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">12. Limitação de responsabilidade</h2>
            <p>
              Na máxima extensão permitida pela lei brasileira, a Iara não se responsabiliza por danos indiretos, lucros cessantes, perda de oportunidade comercial ou de dados decorrentes do uso ou impossibilidade de uso da plataforma. A responsabilidade total da Iara, em qualquer hipótese, fica limitada ao valor pago por você nos 12 meses imediatamente anteriores ao evento.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">13. Suspensão e banimento</h2>
            <p>
              Reservamos o direito de suspender ou encerrar contas que violem estes termos. Casos graves (abuso, fraude, conteúdo proibido, ataque) implicam banimento imediato sem aviso e sem reembolso. Casos leves recebem notificação prévia com prazo de 7 dias para regularização. Após 30 dias suspensa sem regularização, a conta é encerrada e os dados podem ser anonimizados ou excluídos.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">14. Alterações dos termos</h2>
            <p>
              Podemos modificar estes termos. Mudanças não materiais entram em vigor na publicação. Mudanças materiais (limites, preços, regras de uso) serão comunicadas por e-mail ou no app com 15 dias de antecedência. Você poderá cancelar a conta antes da nova versão entrar em vigor sem nenhum custo. Continuar usando após a vigência implica aceitação.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">15. Lei aplicável e foro</h2>
            <p>
              Estes Termos são regidos pela legislação brasileira, em especial Lei 13.709/2018 (LGPD), Lei 12.965/2014 (Marco Civil) e Lei 8.078/1990 (CDC). Eventuais disputas serão submetidas ao foro da comarca de domicílio do consumidor (CDC) ou, na ausência de relação de consumo, ao foro da comarca da sede da Iara Hub Tecnologia Ltda.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-lg font-semibold text-[#f1f1f8] mb-3">16. Contato e DPO</h2>
            <p>
              Suporte, dúvidas, exercício de direitos LGPD, denúncias de abuso:{' '}
              <a href="mailto:ngseita@gmail.com" className="text-iara-400 hover:underline">
                ngseita@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[#1a1a2e] flex gap-4 text-xs text-[#4a4a6a]">
          <Link href="/privacidade" className="hover:text-iara-400 transition-colors">Política de Privacidade</Link>
          <Link href="/termos/afiliados" className="hover:text-iara-400 transition-colors">Termos de Afiliados</Link>
          <Link href="/" className="hover:text-iara-400 transition-colors">Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
