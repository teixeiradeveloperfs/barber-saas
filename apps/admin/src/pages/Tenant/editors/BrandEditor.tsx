import type { Logo, ThemeSide } from '@barber/tenant-config'
import { Card } from '../../../components/Card/Card'
import { ColorField } from '../../../editor/fields/ColorField'
import { Grid, Stack, Subheading } from '../../../editor/fields/Grid'
import { ImageField } from '../../../editor/fields/ImageField'
import { useEditor } from '../../../editor/useEditor'
import { Segmented } from '../../../ui/Segmented/Segmented'
import { TextField } from '../../../ui/TextField/TextField'
import styles from './editors.module.css'

export function BrandEditor() {
  const { working, patch, issue } = useEditor()
  const { brand } = working

  function setLogo(logo: Logo) {
    patch((config) => ({ ...config, brand: { ...config.brand, logo } }))
  }
  const image = brand.logo.kind === 'image' ? brand.logo : null
  function setImage(next: Partial<Extract<Logo, { kind: 'image' }>>) {
    setLogo({ kind: 'image', url: image?.url ?? '', urlLight: image?.urlLight, alt: image?.alt, size: image?.size, ...next })
  }
  function setTheme(side: 'dark' | 'light', next: Partial<ThemeSide>) {
    patch((config) => ({
      ...config,
      brand: { ...config.brand, theme: { ...config.brand.theme, [side]: { ...config.brand.theme[side], ...next } } },
    }))
  }

  return (
    <>
      <Card title="Identidade" description="Nome e logo aparecem no topo do app, na tela inicial e no ícone instalado.">
        <Stack>
          <TextField label="Nome da barbearia" value={working.name} onChange={(name) => patch((config) => ({ ...config, name }))} error={issue('name')} />
          <Segmented
            aria-label="Tipo de logo"
            value={brand.logo.kind}
            onChange={(kind) =>
              setLogo(
                kind === 'wordmark'
                  ? { kind: 'wordmark', first: working.name.split(' ')[0] ?? working.name, second: working.name.split(' ').slice(1).join(' ') || 'Barbearia' }
                  : { kind: 'image', url: '', alt: working.name },
              )
            }
            options={[
              { value: 'wordmark', label: 'Texto com tesoura' },
              { value: 'image', label: 'Imagem' },
            ]}
          />
          {brand.logo.kind === 'wordmark' ? (
            <Grid>
              <TextField label="Primeira palavra" value={brand.logo.first} onChange={(first) => setLogo({ kind: 'wordmark', first, second: brand.logo.kind === 'wordmark' ? brand.logo.second : '' })} error={issue('brand.logo.first')} hint="Fica antes da tesoura." />
              <TextField label="Segunda palavra" value={brand.logo.second} onChange={(second) => setLogo({ kind: 'wordmark', first: brand.logo.kind === 'wordmark' ? brand.logo.first : '', second })} error={issue('brand.logo.second')} hint="Fica depois da tesoura." />
            </Grid>
          ) : (
            <Grid>
              <ImageField label="Arquivo do logo" value={brand.logo.url} onChange={(url) => setImage({ url: url ?? '' })} error={issue('brand.logo.url')} required hint="PNG ou SVG com fundo transparente, altura mínima de 80px. Usado no tema escuro." />
              <ImageField label="Logo no tema claro" value={brand.logo.urlLight} onChange={(urlLight) => setImage({ urlLight })} error={issue('brand.logo.urlLight')} hint="Opcional. Sem ele, o mesmo arquivo serve nos dois temas." />
              <div className={styles.sizeField}>
                <span className={styles.sizeLabel}>Tamanho do logo</span>
                <Segmented
                  aria-label="Tamanho do logo"
                  value={brand.logo.size ?? 'medio'}
                  onChange={(size) => setImage({ size })}
                  options={[
                    { value: 'pequeno', label: 'Pequeno' },
                    { value: 'medio', label: 'Médio' },
                    { value: 'grande', label: 'Grande' },
                  ]}
                />
                <span className={styles.sizeHint}>O app já aumenta sozinho logos quase quadrados (emblemas). Use para ajustar no preview.</span>
              </div>
              <TextField label="Texto alternativo" value={brand.logo.alt ?? ''} onChange={(alt) => setImage({ alt: alt || undefined })} hint="Lido por leitores de tela." />
            </Grid>
          )}
          <ImageField label="Favicon" value={brand.faviconUrl} onChange={(faviconUrl) => patch((config) => ({ ...config, brand: { ...config.brand, faviconUrl } }))} aspect="square" hint="Ícone da aba e do app instalado. Quadrado, 512×512." />
        </Stack>
      </Card>

      <Card title="Fotos" description="Imagens grandes de fundo. Sem foto, o app usa a padrão da plataforma.">
        <Grid>
          <ImageField label="Foto da tela inicial" value={brand.photos.hero} onChange={(hero) => patch((config) => ({ ...config, brand: { ...config.brand, photos: { ...config.brand.photos, hero } } }))} error={issue('brand.photos.hero')} hint="Vertical funciona melhor no celular." />
          <ImageField label="Foto do login" value={brand.photos.auth} onChange={(auth) => patch((config) => ({ ...config, brand: { ...config.brand, photos: { ...config.brand.photos, auth } } }))} error={issue('brand.photos.auth')} />
        </Grid>
      </Card>

      <Card title="Cores" description="Uma cor de destaque para cada tema. As demais cores do app se ajustam sozinhas.">
        <Stack>
          {(['dark', 'light'] as const).map((side) => (
            <div key={side}>
              <Subheading hint={side === 'dark' ? 'Padrão do app à noite ou para quem prefere escuro.' : 'Usado quando o cliente escolhe o tema claro.'}>{side === 'dark' ? 'Tema escuro' : 'Tema claro'}</Subheading>
              <Grid cols={2}>
                <ColorField label="Destaque" value={brand.theme[side].accent} onChange={(accent) => setTheme(side, { accent: accent ?? '#000000' })} error={issue(`brand.theme.${side}.accent`)} />
                <ColorField label="Texto sobre destaque" value={brand.theme[side].onAccent} onChange={(onAccent) => setTheme(side, { onAccent })} optional error={issue(`brand.theme.${side}.onAccent`)} />
                <ColorField label="Destaque claro" value={brand.theme[side].accentHi} onChange={(accentHi) => setTheme(side, { accentHi })} optional error={issue(`brand.theme.${side}.accentHi`)} />
                <ColorField label="Destaque escuro" value={brand.theme[side].accentLo} onChange={(accentLo) => setTheme(side, { accentLo })} optional error={issue(`brand.theme.${side}.accentLo`)} />
              </Grid>
            </div>
          ))}
        </Stack>
      </Card>
    </>
  )
}
