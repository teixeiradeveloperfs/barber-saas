import { startTransition, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { Dialog } from '../../components/Dialog/Dialog'
import { LogOutIcon, TrashIcon } from '../../components/icons/Icons'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import styles from './profile.module.css'

export function AccountActions() {
  const navigate = useNavigate()
  const { logout } = useCustomerAuth()
  const [open, setOpen] = useState(false)

  // Na mesma transição: senão o guard da área do cliente redireciona para o login antes do splash.
  function signOut() {
    startTransition(() => {
      navigate('/', { replace: true })
      logout()
    })
  }

  return (
    <section className={styles.card} aria-labelledby="conta">
      <header className={styles.cardHead}>
        <h2 id="conta" className={styles.cardTitle}>
          Conta
        </h2>
      </header>

      <div className={styles.accountRow}>
        <div>
          <span className={styles.blockTitle}>Sair da conta</span>
          <span className={styles.blockHint}>Você continua cadastrado e entra de novo quando quiser.</span>
        </div>
        <Button variant="ghost" onClick={signOut}>
          <LogOutIcon />
          Sair
        </Button>
      </div>

      <div className={styles.accountRow}>
        <div>
          <span className={styles.blockTitle}>Excluir conta</span>
          <span className={styles.blockHint}>Apaga seus dados e cancela agendamentos futuros. Pedido vai para a barbearia.</span>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          <TrashIcon />
          Excluir
        </Button>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Excluir sua conta"
        actions={
          <Button size="lg" onClick={() => setOpen(false)}>
            Entendi
          </Button>
        }
      >
        <p>
          Por enquanto a exclusão é feita pela barbearia: fale com a recepção pelo WhatsApp e peça a remoção
          dos seus dados. Agendamentos futuros são cancelados no mesmo pedido.
        </p>
      </Dialog>
    </section>
  )
}
