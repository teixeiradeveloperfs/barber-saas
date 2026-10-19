export const TENANT_TABS = [
  { to: '', label: 'Visão geral', end: true },
  { to: 'marca', label: 'Marca' },
  { to: 'imagens', label: 'Imagens' },
  { to: 'textos', label: 'Textos' },
  { to: 'local', label: 'Local e horários' },
  { to: 'servicos', label: 'Serviços' },
  { to: 'clube', label: 'Clube' },
  { to: 'fidelidade', label: 'Recompensas' },
  { to: 'indicacao', label: 'Indicação' },
  { to: 'legal', label: 'Legal' },
  { to: 'recursos', label: 'Recursos' },
] as const

export type TenantTab = (typeof TENANT_TABS)[number]['to']
