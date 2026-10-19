import { stagger } from '../lib/useReveal'
import { CheckIcon } from '../ui/Icons'
import styles from './Ends.module.css'

const ENDS = [
  {
    eyebrow: 'App do cliente',
    title: 'Para quem corta com você',
    text: 'Um app com o nome e a cara da sua barbearia, no seu endereço. Instala na tela inicial, sem loja.',
    points: ['Escolhe o barbeiro e um horário livre em segundos', 'Vê o plano do Clube e os créditos do mês', 'Acompanha pontos, nível e recompensas', 'Consulta e cancela o agendamento pelo código'],
    shot: { src: '/shots/app-agendar.webp', alt: 'Tela de agendamento do app: barbeiro, serviços e horários livres do dia', kind: 'phone' as const },
  },
  {
    eyebrow: 'Painel da equipe',
    title: 'Para quem toca a barbearia',
    text: 'O dia inteiro, barbeiro por barbeiro. Quem entra vê só o que precisa: dono, gestor ou barbeiro.',
    points: ['Grade do dia de meia em meia hora: confirmar, atendido, faltou', 'Bloqueios e agenda trancada por barbeiro', 'Marca, textos, serviços e fotos com prévia ao vivo', 'Domínio próprio conectado em minutos'],
    shot: { src: '/shots/painel-agenda-mobile.webp', alt: 'Painel do Sua Barbearia no celular: agenda do dia com a equipe e os atendimentos para confirmar', kind: 'phone' as const },
  },
]

export function Ends() {
  return (
    <section className="section" id="produto">
      <div className="container">
        <div className="sectionHead" data-reveal>
          <p className="eyebrow">Duas pontas, um sistema</p>
          <h2 className="h2">
            O app dos clientes e o painel da equipe, <em>ligados</em>.
          </h2>
          <p className="lead">O que a equipe muda no painel vale no app na hora: horários, equipe, serviços. O que o cliente agenda aparece na grade do barbeiro no mesmo instante.</p>
        </div>
        <div className={styles.grid}>
          {ENDS.map((end, index) => (
            <article key={end.title} className={styles.card} data-reveal style={stagger(index)}>
              <div className={[styles.media, end.shot.kind === 'phone' ? styles.mediaPhone : styles.mediaPanel].join(' ')}>
                <img src={end.shot.src} alt={end.shot.alt} loading="lazy" width={end.shot.kind === 'phone' ? 390 : 1440} height={end.shot.kind === 'phone' ? 844 : 900} />
              </div>
              <div className={styles.body}>
                <p className="eyebrow">{end.eyebrow}</p>
                <h3 className={styles.title}>{end.title}</h3>
                <p className={styles.text}>{end.text}</p>
                <ul className={styles.points}>
                  {end.points.map((point) => (
                    <li key={point}>
                      <CheckIcon />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
