import type { ComponentType, SVGProps } from 'react'
import { stagger } from '../lib/useReveal'
import { CalendarIcon, CrownIcon, EyeIcon, GlobeIcon, ImageIcon, PaletteIcon, TrophyIcon, UsersIcon } from '../ui/Icons'
import styles from './Features.module.css'

type Feature = { icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; text: string }

const FEATURES: Feature[] = [
  { icon: CalendarIcon, title: 'Agenda de verdade', text: 'Horários de 30 em 30 minutos dentro do expediente, folga para o mesmo dia, bloqueios e agenda trancada por barbeiro.' },
  { icon: CrownIcon, title: 'Clube de assinatura', text: 'Planos mensais com créditos de corte, barba e extras. Quem assina vê "Incluso" ao agendar; quem não assina paga avulso.' },
  { icon: TrophyIcon, title: 'Fidelidade', text: 'Pontos por atendimento, níveis e recompensas com as regras que a barbearia definir.' },
  { icon: PaletteIcon, title: 'Marca própria', text: 'Logo, cores, fotos e textos seus. Tema claro e escuro seguem o celular do cliente.' },
  { icon: GlobeIcon, title: 'Domínio próprio', text: 'Aponte o DNS pelas instruções do painel e pronto. Enquanto propaga, um endereço grátis já funciona.' },
  { icon: UsersIcon, title: 'Equipe e acessos', text: 'Dono, gestor e barbeiro entram no painel com o que cada um precisa. O barbeiro vê a própria agenda.' },
  { icon: EyeIcon, title: 'Publique quando quiser', text: 'Tudo o que você muda vira rascunho com prévia ao vivo. Vai para o ar só quando você publica.' },
  { icon: ImageIcon, title: 'Banco de imagens', text: 'Envie fotos e logos ou escolha da biblioteca. Toda imagem do app sai dali.' },
]

export function Features() {
  return (
    <section className={`section ${styles.section}`} id="recursos">
      <div className="container">
        <div className="sectionHead" data-reveal>
          <p className="eyebrow">Recursos</p>
          <h2 className="h2">
            Tudo o que uma barbearia usa no dia a dia. <em>Nada de sobra.</em>
          </h2>
        </div>
        <ul className={styles.grid}>
          {FEATURES.map((feature, index) => (
            <li key={feature.title} className={styles.item} data-reveal style={stagger(index % 4)}>
              <span className={styles.icon}>
                <feature.icon />
              </span>
              <div className={styles.copy}>
                <h3 className={styles.title}>{feature.title}</h3>
                <p className={styles.text}>{feature.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
