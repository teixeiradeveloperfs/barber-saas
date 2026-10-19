import { z } from 'zod'

/* ---------- primitivos ---------- */

const hex = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'cor em hexadecimal')
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug em minúsculas com hifens')
const time = z.string().regex(/^\d{2}:\d{2}$/, 'hora no formato HH:MM')

/* ---------- marca ---------- */

export const themeSideSchema = z.object({
  /** Cor de destaque: botões, estrelas, ícones ativos. */
  accent: hex,
  /** Topo e base do gradiente dos botões. Sem informar, derivam de accent. */
  accentHi: hex.optional(),
  accentLo: hex.optional(),
  /** Cor do texto sobre o accent. */
  onAccent: hex.optional(),
})

export const logoSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('wordmark'), first: z.string().min(1), second: z.string().min(1) }),
  z.object({
    kind: z.literal('image'),
    url: z.string().min(1),
    /** Variante para o tema claro. Sem ela, `url` serve nos dois temas. */
    urlLight: z.string().optional(),
    alt: z.string().optional(),
    /** Ajuste fino sobre o tamanho automático (o app já aumenta emblemas quase quadrados). */
    size: z.enum(['pequeno', 'medio', 'grande']).optional(),
  }),
])

export const brandSchema = z.object({
  logo: logoSchema,
  faviconUrl: z.string().optional(),
  photos: z.object({
    hero: z.string().optional(),
    auth: z.string().optional(),
  }),
  theme: z.object({
    dark: themeSideSchema,
    light: themeSideSchema,
  }),
})

/* ---------- textos ---------- */

export const copySchema = z.object({
  splashHeadline: z.string(),
  splashCta: z.string().default('Começar'),
  /** Aceita {nome} para o primeiro nome do cliente. */
  homeTitle: z.string().default('Eleve seu estilo, {nome}.'),
  homeSubtitle: z.string(),
  authClaim: z.string(),
  searchPlaceholder: z.string().default('Buscar barbeiros, cortes...'),
})

/* ---------- local e contato ---------- */

export const addressSchema = z.object({
  street: z.string(),
  complement: z.string().optional(),
  district: z.string(),
  city: z.string(),
  state: z.string().length(2),
  zip: z.string(),
  lat: z.number(),
  lng: z.number(),
})

export const contactSchema = z.object({
  phone: z.string(),
  /** Só dígitos com DDI, ex.: 5511987654321 */
  whatsapp: z.string().regex(/^\d{10,15}$/),
  instagram: z.string().optional(),
  email: z.string().email().optional(),
})

export const openingHoursSchema = z.object({
  /** 0 = domingo ... 6 = sábado */
  day: z.number().int().min(0).max(6),
  open: time.optional(),
  close: time.optional(),
})

/* ---------- equipe e catálogo ---------- */

export const barberSchema = z.object({
  id: slug,
  name: z.string(),
  tier: z.enum(['Pro', 'Novo']).nullable(),
  rating: z.number().min(0).max(5),
  reviews: z.number().int().min(0),
  specialties: z.array(z.string()),
  nextAvailable: z.object({ label: z.string(), today: z.boolean() }),
  image: z.string(),
})

export const serviceCategoryIdSchema = z.enum(['cabelo', 'barba', 'combos', 'extras'])

export const serviceCategorySchema = z.object({
  id: serviceCategoryIdSchema,
  name: z.string(),
  hint: z.string(),
})

export const serviceSchema = z.object({
  id: slug,
  name: z.string(),
  description: z.string(),
  category: serviceCategoryIdSchema,
  durationMin: z.number().int().positive(),
  price: z.number().min(0),
  popular: z.boolean().optional(),
})

/* ---------- fidelidade ---------- */

export const levelSchema = z.object({
  id: z.enum(['bronze', 'prata', 'ouro', 'platina']),
  name: z.string(),
  min: z.number().int().min(0),
  perks: z.array(z.string()),
})

export const rewardSchema = z.object({
  id: slug,
  name: z.string(),
  description: z.string(),
  cost: z.number().int().positive(),
})

export const earnRuleSchema = z.object({
  id: slug,
  label: z.string(),
  points: z.string(),
})

export const achievementSchema = z.object({
  id: slug,
  name: z.string(),
  description: z.string(),
  target: z.number().int().positive(),
})

export const loyaltySchema = z.object({
  enabled: z.boolean().default(true),
  stampsPerCard: z.number().int().positive().default(10),
  renewalBonus: z.number().int().min(0).default(200),
  welcomeBonus: z.number().int().min(0).default(100),
  pointsPerCovered: z.number().int().min(0).default(15),
  levels: z.array(levelSchema).min(1),
  rewards: z.array(rewardSchema),
  earnRules: z.array(earnRuleSchema),
  achievements: z.array(achievementSchema),
})

/* ---------- clube ---------- */

const credits = z.union([z.number().int().min(0), z.literal('ilimitado')])

export const planSchema = z.object({
  id: slug,
  name: z.string(),
  tagline: z.string(),
  price: z.number().min(0),
  covers: z.object({
    cabelo: credits,
    barba: credits,
    extras: z.array(z.string()),
  }),
  includes: z.array(z.string()),
  highlight: z.boolean().optional(),
})

export const clubSchema = z.object({
  enabled: z.boolean().default(true),
  name: z.string().default('Clube'),
  plans: z.array(planSchema),
  perks: z.array(z.object({ title: z.string(), text: z.string() })),
})

/* ---------- indicação ---------- */

/** O que alguém ganha na indicação. Vira cupom real, aplicado no valor do agendamento. */
export const referralRewardSchema = z.object({
  kind: z.enum(['nenhum', 'desconto_percentual', 'desconto_valor', 'servico_gratis']).default('nenhum'),
  /** Porcentagem (1 a 100) ou valor em reais, conforme o tipo. */
  value: z.number().min(0).default(0),
  /** Serviço grátis: qual. */
  serviceId: z.string().optional(),
  /** Validade em dias depois de ganhar (0 = não expira). */
  validDays: z.number().int().min(0).default(90),
})

export const referralSchema = z.object({
  enabled: z.boolean().default(false),
  headline: z.string().default('Indique um amigo e ganhe'),
  /** Quem indica ganha quando o amigo conclui o primeiro atendimento. */
  referrer: referralRewardSchema.default({ kind: 'desconto_percentual', value: 20, validDays: 90 }),
  /** O amigo ganha ao criar a conta com o link e usa já no primeiro agendamento. */
  referred: referralRewardSchema.default({ kind: 'desconto_percentual', value: 10, validDays: 30 }),
  /** Máximo de recompensas por indicação que uma pessoa ganha por mês (0 = sem limite). */
  monthlyLimit: z.number().int().min(0).default(0),
})

/* ---------- legal ---------- */

export const legalSectionSchema = z.object({
  id: slug,
  title: z.string(),
  paragraphs: z.array(z.string()),
  bullets: z.array(z.string()).optional(),
})

export const legalDocumentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  updatedAt: z.string(),
  sections: z.array(legalSectionSchema),
})

/* ---------- tenant ---------- */

export const appConfigSchema = z.object({
  /** Identificador estável, também usado no subdomínio grátis. */
  id: slug,
  name: z.string().min(1),
  /** Domínios que resolvem para este tenant. Informativo no front. */
  domains: z.array(z.string()).default([]),
  brand: brandSchema,
  copy: copySchema,
  contact: contactSchema,
  address: addressSchema,
  hours: z.array(openingHoursSchema).length(7),
  parking: z.string().optional(),
  barbers: z.array(barberSchema),
  serviceCategories: z.array(serviceCategorySchema),
  services: z.array(serviceSchema),
  loyalty: loyaltySchema,
  club: clubSchema,
  referral: referralSchema.default({ enabled: false, headline: 'Indique um amigo e ganhe', referrer: { kind: 'desconto_percentual', value: 20, validDays: 90 }, referred: { kind: 'desconto_percentual', value: 10, validDays: 30 }, monthlyLimit: 0 }),
  legal: z.object({
    terms: legalDocumentSchema,
    privacy: legalDocumentSchema,
  }),
  features: z
    .object({
      pwa: z.boolean().default(true),
      googleLogin: z.boolean().default(true),
      installBanner: z.boolean().default(true),
    })
    .default({ pwa: true, googleLogin: true, installBanner: true }),
})

export type AppConfig = z.infer<typeof appConfigSchema>
export type AppConfigInput = z.input<typeof appConfigSchema>
export type ThemeSide = z.infer<typeof themeSideSchema>
export type Logo = z.infer<typeof logoSchema>
export type Brand = z.infer<typeof brandSchema>
export type Copy = z.infer<typeof copySchema>
export type Address = z.infer<typeof addressSchema>
export type Contact = z.infer<typeof contactSchema>
export type OpeningHours = z.infer<typeof openingHoursSchema>
export type Barber = z.infer<typeof barberSchema>
export type ServiceCategoryId = z.infer<typeof serviceCategoryIdSchema>
export type ServiceCategory = z.infer<typeof serviceCategorySchema>
export type Service = z.infer<typeof serviceSchema>
export type Level = z.infer<typeof levelSchema>
export type LevelId = Level['id']
export type Reward = z.infer<typeof rewardSchema>
export type EarnRule = z.infer<typeof earnRuleSchema>
export type AchievementDef = z.infer<typeof achievementSchema>
export type Loyalty = z.infer<typeof loyaltySchema>
export type Referral = z.infer<typeof referralSchema>
export type ReferralReward = z.infer<typeof referralRewardSchema>
export type Credits = z.infer<typeof credits>
export type Plan = z.infer<typeof planSchema>
export type Club = z.infer<typeof clubSchema>
export type LegalSection = z.infer<typeof legalSectionSchema>
export type LegalDocument = z.infer<typeof legalDocumentSchema>

/** Valida e aplica defaults. Lança ZodError se o config estiver inválido. */
export function parseAppConfig(input: unknown): AppConfig {
  return appConfigSchema.parse(input)
}

/** "20% de desconto", "R$ 15 de desconto", "Corte grátis". Nulo quando não ganha nada. */
export function referralRewardLabel(reward: { kind: string; value: number; serviceId?: string }, services: { id: string; name: string }[]) {
  if (reward.kind === 'desconto_percentual' && reward.value > 0) return `${Math.round(reward.value)}% de desconto`
  if (reward.kind === 'desconto_valor' && reward.value > 0) return `R$ ${reward.value.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(reward.value) ? 0 : 2 })} de desconto`
  if (reward.kind === 'servico_gratis' && reward.serviceId) {
    const service = services.find((item) => item.id === reward.serviceId)
    return service ? `${service.name} grátis` : null
  }
  return null
}
