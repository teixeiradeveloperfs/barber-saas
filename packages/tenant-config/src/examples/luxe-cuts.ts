import type {
  AchievementDef,
  Barber,
  EarnRule,
  LegalDocument,
  Level,
  Plan,
  Reward,
  Service,
  ServiceCategory,
  AppConfigInput,
} from '../schema.js'

/**
 * Tenant de exemplo, usado em dev e como semente. Fotos em
 * apps/frontend/public (créditos em public/images/CREDITS.md).
 * Textos legais são exemplo: revisão jurídica antes de publicar.
 */

const COMPANY = 'Luxe Cuts Tecnologia Ltda'
const CONTACT = 'contato@luxecuts.com.br'
const DPO = 'privacidade@luxecuts.com.br'

const barbers: Barber[] = [
  {
    id: 'tony',
    name: 'Tony Barbosa',
    tier: 'Pro',
    rating: 4.8,
    reviews: 128,
    specialties: ['Degradê', 'Barba'],
    nextAvailable: { label: 'Hoje · 10:00', today: true },
    image: '/images/barbers/tony.jpg',
  },
  {
    id: 'lucas',
    name: 'Lucas Navalha',
    tier: null,
    rating: 4.6,
    reviews: 74,
    specialties: ['Corte clássico', 'Navalha'],
    nextAvailable: { label: 'Hoje · 14:30', today: true },
    image: '/images/barbers/lucas.jpg',
  },
  {
    id: 'andre',
    name: 'André Ferreira',
    tier: 'Pro',
    rating: 4.9,
    reviews: 212,
    specialties: ['Fade', 'Desenhos'],
    nextAvailable: { label: 'Sex 18 · 09:00', today: false },
    image: '/images/barbers/andre.jpg',
  },
  {
    id: 'rafa',
    name: 'Rafa Menezes',
    tier: 'Novo',
    rating: 4.7,
    reviews: 41,
    specialties: ['Corte social', 'Barba'],
    nextAvailable: { label: 'Hoje · 16:30', today: true },
    image: '/images/barbers/rafa.jpg',
  },
  {
    id: 'diego',
    name: 'Diego Santana',
    tier: 'Pro',
    rating: 4.8,
    reviews: 156,
    specialties: ['Pigmentação', 'Degradê'],
    nextAvailable: { label: 'Sáb 19 · 11:00', today: false },
    image: '/images/barbers/diego.jpg',
  },
  {
    id: 'caio',
    name: 'Caio Lima',
    tier: null,
    rating: 4.5,
    reviews: 63,
    specialties: ['Infantil', 'Corte clássico'],
    nextAvailable: { label: 'Hoje · 13:00', today: true },
    image: '/images/barbers/caio.jpg',
  },
]

const serviceCategories: ServiceCategory[] = [
  { id: 'cabelo', name: 'Cabelo', hint: 'Do clássico ao degradê, com acabamento na navalha.' },
  { id: 'barba', name: 'Barba', hint: 'Toalha quente, navalha e finalização com óleo.' },
  { id: 'combos', name: 'Combos', hint: 'Mais de um serviço no mesmo horário, com desconto.' },
  { id: 'extras', name: 'Extras', hint: 'Detalhes que fecham o visual.' },
]

const services: Service[] = [
  {
    id: 'corte',
    name: 'Corte clássico',
    description: 'Tesoura e máquina, lavagem e finalização com pomada.',
    category: 'cabelo',
    durationMin: 25,
    price: 18,
    popular: true,
  },
  {
    id: 'fade',
    name: 'Degradê (skin fade)',
    description: 'Transição zerada na navalha, acabamento milimétrico.',
    category: 'cabelo',
    durationMin: 30,
    price: 22,
    popular: true,
  },
  {
    id: 'social',
    name: 'Corte social',
    description: 'Baixo nas laterais, topo penteado. Clássico de trabalho.',
    category: 'cabelo',
    durationMin: 25,
    price: 18,
  },
  {
    id: 'infantil',
    name: 'Corte infantil',
    description: 'Até 10 anos, com paciência e cadeira adaptada.',
    category: 'cabelo',
    durationMin: 25,
    price: 15,
  },
  {
    id: 'barba',
    name: 'Barba completa',
    description: 'Toalha quente, desenho, navalha e óleo pós-barba.',
    category: 'barba',
    durationMin: 20,
    price: 15,
    popular: true,
  },
  {
    id: 'barba-navalha',
    name: 'Barba na navalha',
    description: 'Raspagem completa na navalha com espuma quente.',
    category: 'barba',
    durationMin: 25,
    price: 18,
  },
  {
    id: 'combo',
    name: 'Corte + barba',
    description: 'Os dois serviços no mesmo horário, R$ 3 a menos.',
    category: 'combos',
    durationMin: 50,
    price: 30,
    popular: true,
  },
  {
    id: 'combo-completo',
    name: 'Corte + barba + sobrancelha',
    description: 'Visual completo, ideal antes de evento.',
    category: 'combos',
    durationMin: 60,
    price: 36,
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    description: 'Limpeza e alinhamento na navalha.',
    category: 'extras',
    durationMin: 10,
    price: 8,
  },
  {
    id: 'pigmentacao',
    name: 'Pigmentação',
    description: 'Preenche falhas na barba ou no cabelo por até 15 dias.',
    category: 'extras',
    durationMin: 20,
    price: 25,
  },
  {
    id: 'hidratacao',
    name: 'Hidratação',
    description: 'Máscara e massagem no couro cabeludo.',
    category: 'extras',
    durationMin: 15,
    price: 20,
  },
]

const levels: Level[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    min: 0,
    perks: ['1 ponto a cada R$ 1 em serviços', '1 selo por corte concluído'],
  },
  {
    id: 'prata',
    name: 'Prata',
    min: 500,
    perks: ['Pontos em dobro no mês do aniversário', 'Lembrete prioritário de horários livres'],
  },
  {
    id: 'ouro',
    name: 'Ouro',
    min: 1500,
    perks: ['10% de desconto em produtos', 'Agenda aberta 48h antes para você'],
  },
  {
    id: 'platina',
    name: 'Platina',
    min: 4000,
    perks: ['Corte grátis no mês do aniversário', 'Fila prioritária de encaixe'],
  },
]

const rewards: Reward[] = [
  { id: 'sobrancelha', name: 'Sobrancelha grátis', description: 'Vale para qualquer barbeiro.', cost: 150 },
  { id: 'barba', name: 'Barba grátis', description: 'Junto de um corte agendado.', cost: 300 },
  { id: 'desconto10', name: '10% no próximo corte', description: 'Aplicado no pagamento.', cost: 400 },
  { id: 'pomada', name: 'Pomada modeladora Luxe', description: 'Retire na recepção.', cost: 800 },
  { id: 'corte', name: 'Corte grátis', description: 'Qualquer corte do catálogo.', cost: 1000 },
]

const earnRules: EarnRule[] = [
  { id: 'servico', label: 'Serviços concluídos', points: '1 ponto por R$ 1' },
  { id: 'selo', label: 'Corte concluído', points: '+1 selo' },
  { id: 'incluso', label: 'Serviço incluso no plano (sócios)', points: '+15 pontos' },
  { id: 'renovacao', label: 'Renovação do plano', points: '+200 pontos' },
  { id: 'clube', label: 'Entrar no Clube', points: '+100 pontos' },
  { id: 'avaliacao', label: 'Avaliar o atendimento', points: '+20 pontos' },
  { id: 'indicacao', label: 'Amigo indicado que cortar', points: '+150 pontos' },
  { id: 'aniversario', label: 'Mês do aniversário (a partir de Prata)', points: 'Pontos em dobro' },
]

const achievements: AchievementDef[] = [
  { id: 'primeiro', name: 'Primeiro corte', description: 'Concluiu o primeiro atendimento.', target: 1 },
  { id: 'casa', name: 'Cliente de casa', description: 'Dez cortes concluídos.', target: 10 },
  { id: 'fiel', name: 'Fiel', description: 'Renovou o plano três vezes.', target: 3 },
  { id: 'sequencia3', name: 'Em dia', description: 'Três meses seguidos sem falhar.', target: 3 },
  { id: 'sequencia6', name: 'Meio ano em dia', description: 'Seis meses seguidos sem falhar.', target: 6 },
  { id: 'explorador', name: 'Explorador', description: 'Cortou com três barbeiros diferentes.', target: 3 },
  { id: 'critico', name: 'Crítico', description: 'Avaliou cinco atendimentos.', target: 5 },
  { id: 'embaixador', name: 'Embaixador', description: 'Indicou um amigo que cortou.', target: 1 },
]

const plans: Plan[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    tagline: 'Para quem corta toda quinzena.',
    price: 59,
    covers: { cabelo: 2, barba: 0, extras: [] },
    includes: ['2 cortes por mês', 'Prioridade na agenda', 'Selos e pontos normais'],
  },
  {
    id: 'completo',
    name: 'Completo',
    tagline: 'Cabelo e barba sempre em dia.',
    price: 89,
    covers: { cabelo: 2, barba: 2, extras: ['sobrancelha'] },
    includes: ['2 cortes por mês', '2 barbas por mês', 'Sobrancelha inclusa', 'Prioridade na agenda'],
    highlight: true,
  },
  {
    id: 'ilimitado',
    name: 'Ilimitado',
    tagline: 'Sem contar. Cortou, voltou.',
    price: 149,
    covers: { cabelo: 'ilimitado', barba: 'ilimitado', extras: ['sobrancelha', 'hidratacao'] },
    includes: ['Cortes ilimitados', 'Barba ilimitada', 'Sobrancelha e hidratação inclusas', 'Produto do mês'],
  },
]

const clubPerks = [
  { title: 'Cortes garantidos', text: 'Preço fixo por mês, sem surpresa no caixa.' },
  { title: 'Prioridade na agenda', text: 'Horários abrem para sócios antes de todo mundo.' },
  { title: 'Pontos em dobro na renovação', text: '+200 pontos toda vez que o plano renova.' },
  { title: 'Cancele quando quiser', text: 'Sem fidelidade. Você usa até o fim do ciclo pago.' },
]

const terms: LegalDocument = {
  title: 'Termos de uso',
  subtitle:
    'As regras para usar o Luxe Cuts, em linguagem direta. Ao criar uma conta, você concorda com o que está aqui.',
  updatedAt: '17 de setembro de 2026',
  sections: [
    {
      id: 'aceitacao',
      title: 'Aceitação dos termos',
      paragraphs: [
        `Estes Termos de uso regulam o acesso e o uso do aplicativo e do site Luxe Cuts, operados por ${COMPANY}. Ao criar uma conta ou usar qualquer parte do serviço, você declara ter lido e aceitado estas condições.`,
        'Se você não concorda com algum ponto, não use o serviço. Podemos atualizar estes termos de tempos em tempos; avisaremos sobre mudanças relevantes por e-mail ou dentro do aplicativo.',
      ],
    },
    {
      id: 'servico',
      title: 'O que é o serviço',
      paragraphs: [
        'O Luxe Cuts conecta clientes a barbearias e barbeiros parceiros. Pela plataforma você encontra profissionais, compara avaliações, agenda horários e, quando disponível, paga pelo atendimento.',
        'Nós não prestamos o serviço de barbearia. Cada atendimento é responsabilidade do profissional ou do estabelecimento parceiro que você escolheu.',
      ],
    },
    {
      id: 'conta',
      title: 'Cadastro e conta',
      paragraphs: [
        'Para agendar você precisa de uma conta com nome, e-mail válido e senha. As informações precisam ser verdadeiras e atualizadas.',
        'A conta é pessoal. Você é responsável por manter a senha em sigilo e por tudo que acontecer com ela. Se notar acesso indevido, avise a gente imediatamente.',
      ],
      bullets: [
        'É preciso ter pelo menos 16 anos para criar uma conta.',
        'Uma pessoa, uma conta. Contas duplicadas podem ser encerradas.',
        'Podemos suspender contas que violem estes termos ou a lei.',
      ],
    },
    {
      id: 'agendamentos',
      title: 'Agendamentos e cancelamentos',
      paragraphs: [
        'Ao confirmar um agendamento, você reserva o horário de um profissional. Chegue no horário; atrasos podem encurtar ou cancelar o atendimento, a critério da barbearia.',
        'Cancelamentos gratuitos podem ser feitos até 2 horas antes do horário marcado. Depois disso, a barbearia pode aplicar a política de cancelamento informada na página dela antes da confirmação.',
        'Faltas repetidas sem aviso podem limitar sua capacidade de agendar pela plataforma.',
      ],
    },
    {
      id: 'pagamentos',
      title: 'Pagamentos',
      paragraphs: [
        'Quando o pagamento é feito pelo aplicativo, ele é processado por parceiros de pagamento certificados. Não armazenamos os dados completos do seu cartão.',
        'Os preços exibidos são definidos por cada barbearia e podem incluir taxas de serviço informadas antes da confirmação. Reembolsos seguem a política de cancelamento aplicável ao agendamento.',
      ],
    },
    {
      id: 'conduta',
      title: 'Conduta na plataforma',
      paragraphs: [
        'Esperamos respeito entre clientes e profissionais. Avaliações devem refletir experiências reais e não podem conter ofensas, discriminação ou dados pessoais de terceiros.',
      ],
      bullets: [
        'Não use o serviço para fins ilegais ou para assediar alguém.',
        'Não tente acessar contas, dados ou sistemas que não são seus.',
        'Não copie, raspe ou redistribua conteúdo da plataforma sem autorização.',
      ],
    },
    {
      id: 'parceiros',
      title: 'Barbearias e profissionais parceiros',
      paragraphs: [
        'Barbearias e barbeiros usam o Luxe Cuts por meio de um contrato próprio. Eles são responsáveis pelas informações que publicam, pelos preços, pela disponibilidade e pela qualidade do atendimento.',
        'Fazemos verificações básicas de cadastro, mas não garantimos resultados de nenhum serviço prestado por parceiros.',
      ],
    },
    {
      id: 'propriedade',
      title: 'Propriedade intelectual',
      paragraphs: [
        `A marca Luxe Cuts, o logotipo, o design e o código da plataforma pertencem à ${COMPANY}. Você pode usar o serviço, mas não pode reproduzir ou modificar esses elementos sem permissão por escrito.`,
        'As fotos e textos publicados por barbearias pertencem a elas, que nos autorizam a exibi-los na plataforma.',
      ],
    },
    {
      id: 'responsabilidade',
      title: 'Limitação de responsabilidade',
      paragraphs: [
        'Trabalhamos para manter o serviço disponível e correto, mas ele é oferecido como está. Não nos responsabilizamos por indisponibilidades temporárias, por informações fornecidas por parceiros nem por danos decorrentes de atendimentos realizados por terceiros.',
        'Nada nestes termos limita direitos que a lei garante a você como consumidor.',
      ],
    },
    {
      id: 'alteracoes',
      title: 'Alterações e encerramento',
      paragraphs: [
        'Podemos alterar, suspender ou encerrar funcionalidades do serviço. Você pode encerrar sua conta a qualquer momento nas configurações. Agendamentos futuros precisam ser cancelados antes.',
      ],
    },
    {
      id: 'contato',
      title: 'Contato',
      paragraphs: [
        `Dúvidas sobre estes termos: ${CONTACT}. Estes termos são regidos pelas leis do Brasil e o foro competente é o da comarca de São Paulo, SP, salvo direito do consumidor em contrário.`,
      ],
    },
  ],
}

const privacy: LegalDocument = {
  title: 'Política de privacidade',
  subtitle:
    'O que coletamos, por que coletamos e o que você pode fazer a respeito. Escrita para ser lida, não só aceita.',
  updatedAt: '17 de setembro de 2026',
  sections: [
    {
      id: 'dados',
      title: 'Quais dados coletamos',
      paragraphs: [
        'Coletamos apenas o necessário para o serviço funcionar e melhorar. Os dados vêm de três lugares: do que você informa, do uso do aplicativo e de parceiros.',
      ],
      bullets: [
        'Cadastro: nome, e-mail, telefone (opcional) e foto de perfil (opcional).',
        'Uso: agendamentos, barbearias favoritas, avaliações e histórico de atendimentos.',
        'Dispositivo: modelo, sistema operacional, idioma e identificadores técnicos para segurança.',
        'Localização aproximada, só quando você autoriza, para mostrar barbearias perto de você.',
        'Pagamento: os dados do cartão ficam com o processador de pagamento, não com a gente.',
      ],
    },
    {
      id: 'uso',
      title: 'Como usamos os dados',
      paragraphs: [
        'Usamos seus dados para operar o serviço, personalizar sugestões, enviar confirmações e lembretes de agendamento, prevenir fraudes e cumprir obrigações legais.',
        'Comunicações de marketing só chegam se você aceitar, e você pode cancelar a qualquer momento pelo link no rodapé do e-mail ou nas configurações.',
      ],
    },
    {
      id: 'compartilhamento',
      title: 'Com quem compartilhamos',
      paragraphs: [
        'Compartilhamos dados apenas com quem precisa deles para prestar o serviço, sempre com contratos que exigem o mesmo cuidado que temos.',
      ],
      bullets: [
        'Barbearias e profissionais: seu nome, foto e horário do agendamento.',
        'Processadores de pagamento, provedores de nuvem e ferramentas de e-mail e análise.',
        'Autoridades, quando houver obrigação legal ou ordem judicial.',
        'Nunca vendemos seus dados pessoais.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies e tecnologias parecidas',
      paragraphs: [
        'No site usamos cookies essenciais para manter você conectado e cookies de análise para entender o uso das telas. Você pode desativar os de análise nas configurações do navegador ou nas preferências do site sem perder funcionalidades.',
      ],
    },
    {
      id: 'localizacao',
      title: 'Localização',
      paragraphs: [
        'A localização é usada só no momento da busca, para calcular distâncias e ordenar resultados. Não mantemos um histórico dos lugares por onde você passou. A permissão pode ser revogada no sistema operacional a qualquer hora.',
      ],
    },
    {
      id: 'retencao',
      title: 'Por quanto tempo guardamos',
      paragraphs: [
        'Mantemos seus dados enquanto a conta existir. Depois do encerramento, excluímos ou anonimizamos em até 30 dias, exceto o que a lei exige guardar por mais tempo, como registros fiscais de pagamento.',
      ],
    },
    {
      id: 'direitos',
      title: 'Seus direitos (LGPD)',
      paragraphs: [
        'A Lei Geral de Proteção de Dados garante que você pode, a qualquer momento e sem custo:',
      ],
      bullets: [
        'Confirmar se tratamos seus dados e acessar uma cópia deles.',
        'Corrigir dados incompletos ou desatualizados.',
        'Pedir a exclusão de dados desnecessários ou tratados sem base legal.',
        'Revogar consentimentos e se opor a tratamentos específicos.',
        'Solicitar a portabilidade dos dados para outro serviço.',
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      paragraphs: [
        'Usamos criptografia em trânsito e em repouso, controle de acesso por função e monitoramento contínuo. Nenhum sistema é infalível; se houver um incidente que afete você, avisaremos conforme a lei exige.',
      ],
    },
    {
      id: 'menores',
      title: 'Menores de idade',
      paragraphs: [
        'O serviço não é destinado a menores de 16 anos. Se descobrirmos uma conta criada por alguém abaixo dessa idade sem autorização dos responsáveis, ela será encerrada e os dados excluídos.',
      ],
    },
    {
      id: 'alteracoes',
      title: 'Alterações nesta política',
      paragraphs: [
        'Quando mudarmos algo relevante, avisaremos por e-mail ou dentro do aplicativo antes de a mudança valer. A data no topo mostra a última atualização.',
      ],
    },
    {
      id: 'contato',
      title: 'Contato e encarregado',
      paragraphs: [
        `Para exercer seus direitos ou tirar dúvidas, fale com nosso encarregado de proteção de dados: ${DPO}. Respondemos em até 15 dias.`,
      ],
    },
  ],
}

export const luxeCuts: AppConfigInput = {
  id: 'luxe-cuts',
  name: 'Luxe Cuts',
  domains: ['luxe-cuts.localhost'],
  brand: {
    logo: { kind: 'wordmark', first: 'Luxe', second: 'Cuts' },
    faviconUrl: '/favicon.svg',
    photos: { hero: '/hero.jpg', auth: '/images/auth.jpg' },
    theme: {
      dark: { accent: '#e2d3a8', accentHi: '#eee3c4', accentLo: '#d8c59a', onAccent: '#141312' },
      light: { accent: '#b3955a', accentHi: '#e8d9ae', accentLo: '#cdb77f', onAccent: '#141312' },
    },
  },
  copy: {
    splashHeadline: 'Encontre os melhores barbeiros e agende seu corte na hora.',
    splashCta: 'Começar',
    homeTitle: 'Eleve seu estilo, {nome}.',
    homeSubtitle: 'Escolha seu barbeiro, veja os horários livres e agende em segundos.',
    authClaim: 'Seu barbeiro favorito, a um toque de distância.',
    searchPlaceholder: 'Buscar barbeiros, cortes...',
  },
  contact: {
    phone: '(11) 3456-7890',
    whatsapp: '5511987654321',
    instagram: 'luxecuts',
    email: CONTACT,
  },
  address: {
    street: 'Rua Augusta, 1200',
    complement: 'Loja 3',
    district: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    zip: '01304-001',
    lat: -23.5558,
    lng: -46.662,
  },
  hours: [
    { day: 0 },
    { day: 1, open: '10:00', close: '22:00' },
    { day: 2, open: '10:00', close: '22:00' },
    { day: 3, open: '10:00', close: '22:00' },
    { day: 4, open: '10:00', close: '22:00' },
    { day: 5, open: '10:00', close: '22:00' },
    { day: 6, open: '09:00', close: '18:00' },
  ],
  parking: 'Estacionamento conveniado no nº 1180, 2 horas grátis com o carimbo da recepção.',
  barbers,
  serviceCategories,
  services,
  loyalty: {
    enabled: true,
    stampsPerCard: 10,
    renewalBonus: 200,
    welcomeBonus: 100,
    pointsPerCovered: 15,
    levels,
    rewards,
    earnRules,
    achievements,
  },
  club: {
    enabled: true,
    name: 'Clube Luxe',
    plans,
    perks: clubPerks,
  },
  legal: { terms, privacy },
  features: { pwa: true, googleLogin: true, installBanner: true },
}
