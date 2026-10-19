import { stagger } from '../lib/useReveal'
import { ChevronIcon } from '../ui/Icons'
import styles from './Faq.module.css'

const QUESTIONS = [
  {
    q: 'Quanto custa?',
    a: 'Um plano só, com tudo incluso e sem limite de barbeiros, clientes, agendamentos ou mensagens. Paga por mês no Pix Automático ou no cartão, sem fidelidade. Quem entra na inauguração vira sócio fundador e trava o valor para sempre.',
  },
  {
    q: 'E se eu não gostar?',
    a: 'Você tem 7 dias de teste depois da compra. Se não gostar, cancele no painel (Início, Sua assinatura) a qualquer momento dentro desse prazo e devolvemos 100% do valor. Depois dos 7 dias, pode cancelar quando quiser: não há novas cobranças e o app fica no ar até o fim do mês pago.',
  },
  {
    q: 'Preciso publicar um app nas lojas?',
    a: 'Não. O app roda no navegador e o cliente instala na tela inicial em dois toques. Sem taxa de loja, sem esperar aprovação, sem atualização para baixar.',
  },
  {
    q: 'Posso usar o meu domínio?',
    a: 'Sim. O painel mostra os registros de DNS que você precisa criar e verifica sozinho quando estiverem no ar. Até propagar, a barbearia já funciona num endereço grátis da plataforma.',
  },
  {
    q: 'Como funciona o Clube de assinatura?',
    a: 'Você cria os planos e define os créditos de cada um (cortes, barbas, extras). Quem assina vê "Incluso" ao agendar; quem não assina paga avulso. A cobrança recorrente hoje fica com a barbearia; a integração com pagamento vem em seguida.',
  },
  {
    q: 'Meus barbeiros precisam entrar no painel?',
    a: 'Só se você quiser. Cada barbeiro pode ter acesso à própria agenda para marcar atendido ou falta. Um gestor faz isso pela equipe toda, e o dono controla o resto.',
  },
  {
    q: 'Tenho mais de uma unidade. E aí?',
    a: 'Cada unidade é uma barbearia no Sua Barbearia, com app, agenda, equipe e domínio próprios. Você troca entre elas no mesmo painel, com o mesmo login.',
  },
  {
    q: 'O que acontece quando eu mudo algo?',
    a: 'Marca, textos, serviços e horários viram rascunho com prévia ao vivo e só vão para o ar quando você publica. Equipe e agenda são operação: valem no app na hora.',
  },
]

export function Faq() {
  return (
    <section className={`section ${styles.section}`} id="perguntas">
      <div className={`container ${styles.grid}`}>
        <div className="sectionHead" data-reveal style={{ marginBottom: 0 }}>
          <p className="eyebrow">Perguntas</p>
          <h2 className="h2">
            O que os donos <em>perguntam</em> antes de ligar.
          </h2>
          <p className="lead">Não achou a sua? Fale com a gente no WhatsApp pelo botão no fim da página.</p>
        </div>
        <div className={styles.list}>
          {QUESTIONS.map((item, index) => (
            <details key={item.q} className={styles.item} data-reveal style={stagger(index)}>
              <summary className={styles.summary}>
                <span>{item.q}</span>
                <ChevronIcon className={styles.chevron} />
              </summary>
              <p className={styles.answer}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
