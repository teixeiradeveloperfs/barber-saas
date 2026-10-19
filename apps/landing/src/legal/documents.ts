/**
 * Documentos legais do Sua Barbearia (lado da plataforma: barbearia assinante,
 * visitantes do site e parceiros). Parágrafo é string; lista é array.
 * `[[whatsapp]]`, `[[instagram]]`, `[[termos]]`, `[[privacidade]]` e
 * `[[parceiros]]` viram links na página.
 */

export type Block = string | string[]
export type LegalSection = { id: string; title: string; body: Block[] }
export type LegalDocument = {
  path: string
  title: string
  /** Pontos principais em linguagem simples, no topo da página. */
  summary: string[]
  sections: LegalSection[]
}

const WHO =
  'O Sua Barbearia é desenvolvido e operado pela AUTOMAGROUP LTDA (Automa Group), sociedade empresária limitada inscrita no CNPJ 49.526.426/0001-72, com sede em Salvador/BA, doravante "Automa", "nós" ou "Sua Barbearia".'

export const TERMS: LegalDocument = {
  path: '/termos',
  title: 'Termos de Uso e Assinatura',
  summary: [
    'Um plano mensal com tudo incluso, cobrado por Pix Automático ou cartão de crédito pelo Asaas. Não guardamos dados do seu cartão.',
    '7 dias de garantia: cancele no painel até 7 dias depois do primeiro pagamento e devolvemos 100%.',
    'Sem fidelidade e sem multa. Depois dos 7 dias, cancele quando quiser: não há novas cobranças e o app fica no ar até o fim do período pago.',
    'A marca, as fotos e os dados dos seus clientes são da sua barbearia. Nós só usamos para fazer o sistema funcionar.',
    'O sócio fundador mantém o preço travado enquanto a assinatura continuar ativa.',
  ],
  sections: [
    {
      id: 'quem-somos',
      title: '1. Quem somos',
      body: [WHO, 'Fale com a gente pelo [[whatsapp]] ou pelo Instagram [[instagram]].'],
    },
    {
      id: 'aceite',
      title: '2. Aceite destes termos',
      body: [
        'Estes termos regem a assinatura e o uso do Sua Barbearia pela barbearia (a "Assinante"). Ao concluir a compra, criar a senha do painel ou usar o sistema, você declara que leu e concorda com eles e com a [[privacidade]].',
        'Quem aceita declara ter 18 anos ou mais e poderes para contratar em nome da barbearia.',
      ],
    },
    {
      id: 'servico',
      title: '3. O que o Sua Barbearia entrega',
      body: [
        'O Sua Barbearia é um software como serviço, acessado pela internet, formado por:',
        [
          'app dos clientes da barbearia, com a marca dela, no subdomínio gratuito barberosbr.com ou em domínio próprio;',
          'painel da barbearia: agenda, equipe, serviços, clube de assinatura, recompensas, indicação de clientes, avisos por WhatsApp, acessos e relatórios;',
          'atualizações e melhorias, que entram no plano sem custo extra.',
        ],
        'O plano não tem limite de barbeiros, clientes ou agendamentos. Podemos agir em casos de uso que ameacem a estabilidade do serviço para as demais barbearias (por exemplo, automações que disparam requisições em massa), sempre avisando antes quando possível.',
        'Funcionalidades podem mudar para melhor. Se retirarmos algo relevante que você usa, avisamos com pelo menos 30 dias.',
      ],
    },
    {
      id: 'conta',
      title: '4. Conta, acessos e equipe',
      body: [
        'Você é responsável por manter sua senha em sigilo e pelas ações feitas com os acessos que criar no painel (dono, gestor e barbeiro). Remova o acesso de quem sair da equipe.',
        'Se perceber uso indevido da sua conta, avise a gente na hora pelo [[whatsapp]].',
      ],
    },
    {
      id: 'preco',
      title: '5. Plano, preço e cobrança',
      body: [
        'O valor da mensalidade é o exibido no site e no checkout no momento da compra. A cobrança é mensal e recorrente, na mesma data do primeiro pagamento.',
        'Formas de pagamento: Pix Automático (você autoriza uma vez no banco e as mensalidades são debitadas automaticamente) ou cartão de crédito. Os pagamentos são processados pelo Asaas, instituição de pagamento autorizada pelo Banco Central. Os dados do cartão vão direto para o Asaas: o BarberOS não recebe nem guarda o número do cartão.',
        'Sócio fundador: quem assina durante a oferta de inauguração mantém o valor contratado travado, sem reajuste, enquanto a assinatura continuar ativa. Se a assinatura for cancelada, a condição de fundador não volta numa nova assinatura.',
        'Para quem não é fundador, o preço pode ser reajustado. Avisamos por e-mail com pelo menos 30 dias de antecedência, e você pode cancelar antes de o novo valor valer.',
      ],
    },
    {
      id: 'garantia',
      title: '6. Garantia de 7 dias e reembolso',
      body: [
        'Você tem 7 dias corridos, contados do primeiro pagamento, para testar. Se não gostar, cancele pelo painel (Início › Sua assinatura) dentro desse prazo e devolvemos 100% do que foi pago, sem precisar justificar.',
        'No Pix, o estorno costuma cair em instantes. No cartão, o prazo para aparecer na fatura depende do banco emissor (normalmente até 10 dias úteis). Ao cancelar dentro da garantia, o app e o painel da barbearia saem do ar na hora.',
        'Esta garantia atende e amplia o direito de arrependimento previsto no Código de Defesa do Consumidor, quando aplicável.',
      ],
    },
    {
      id: 'cancelamento',
      title: '7. Cancelamento',
      body: [
        'Não existe fidelidade nem multa. Você cancela quando quiser pelo próprio painel, sem precisar falar com ninguém.',
        'Depois dos 7 dias de garantia, o cancelamento interrompe as próximas cobranças, mas o período já pago não é reembolsado. O app continua no ar até o fim desse período e depois é suspenso.',
        'Revogar a autorização do Pix Automático no seu banco também cancela a assinatura.',
      ],
    },
    {
      id: 'atraso',
      title: '8. Mensalidade em atraso',
      body: [
        'Se uma mensalidade não for paga, o painel avisa e mostra o link da fatura. Com mais de 10 dias de atraso, podemos suspender o app e o painel até o pagamento. Pagou, tudo volta como estava.',
        'Não cobramos multa nem juros por atraso da mensalidade do BarberOS.',
      ],
    },
    {
      id: 'dados-barbearia',
      title: '9. Conteúdo e dados da barbearia',
      body: [
        'Tudo o que a barbearia coloca no BarberOS continua sendo dela: marca, logo, fotos, textos, preços, equipe e o cadastro dos clientes. Você nos dá apenas a permissão necessária para guardar, processar e exibir esse conteúdo enquanto o serviço estiver ativo.',
        'Em relação aos dados dos clientes da barbearia, a barbearia é a controladora e a Automa atua como operadora, tratando esses dados só para prestar o serviço, conforme a [[privacidade]] e a Lei Geral de Proteção de Dados (LGPD).',
        'A barbearia é responsável por ter o direito de usar as imagens e marcas que publicar e por informar seus clientes sobre como trata os dados deles. O app traz modelos de termos e privacidade para o cliente final, que a barbearia deve revisar e adaptar.',
        'Não usamos a marca, as fotos ou os números da sua barbearia na nossa divulgação sem a sua autorização. Podemos usar estatísticas agregadas e anônimas (por exemplo, total de agendamentos na plataforma).',
      ],
    },
    {
      id: 'whatsapp',
      title: '10. Avisos por WhatsApp',
      body: [
        'O recurso de WhatsApp conecta o número da própria barbearia ao BarberOS, de forma parecida com o WhatsApp Web, para enviar lembretes e avisos de agendamento aos clientes. Essa conexão não é uma integração oficial da Meta.',
        'A Meta pode limitar ou bloquear números por critérios próprios. O BarberOS reduz esse risco enviando só mensagens ligadas a agendamentos, com intervalo entre elas, mas não pode garantir que isso não aconteça. Recomendamos usar um número dedicado à barbearia.',
        'A barbearia é responsável pelo conteúdo das mensagens que configurar e por usar o recurso apenas com clientes que agendaram com ela. É proibido usar o BarberOS para envio de mensagens em massa ou publicidade não solicitada.',
      ],
    },
    {
      id: 'dominio',
      title: '11. Domínio próprio',
      body: [
        'O subdomínio em barberosbr.com é gratuito enquanto a assinatura estiver ativa. Se usar domínio próprio, o registro e a renovação dele são seus e ele continua seu depois do cancelamento. Basta apontar o domínio conforme as instruções do painel.',
      ],
    },
    {
      id: 'proibido',
      title: '12. Uso proibido',
      body: [
        'Não é permitido usar o BarberOS para:',
        [
          'qualquer atividade ilegal ou que viole direitos de terceiros;',
          'enviar spam ou mensagens não solicitadas;',
          'cadastrar dados de pessoas sem base legal para isso;',
          'tentar acessar contas, dados ou partes do sistema sem autorização, ou prejudicar seu funcionamento;',
          'copiar, revender, sublicenciar ou fazer engenharia reversa do software.',
        ],
        'Em caso de violação, podemos suspender a conta, avisando o motivo. Em situações graves ou ilegais, a suspensão pode ser imediata.',
      ],
    },
    {
      id: 'disponibilidade',
      title: '13. Disponibilidade e suporte',
      body: [
        'Trabalhamos para manter o BarberOS disponível o tempo todo, mas nenhum serviço na internet está livre de falhas. Manutenções programadas são feitas preferencialmente fora do horário comercial.',
        'O suporte é pelo [[whatsapp]], em dias úteis, em horário comercial. Problemas que tiram o app do ar têm prioridade.',
      ],
    },
    {
      id: 'responsabilidade',
      title: '14. Responsabilidades',
      body: [
        'O BarberOS é uma ferramenta de gestão. A relação da barbearia com os clientes dela (atendimento, preços, faltas, cancelamentos e pagamentos) é de responsabilidade da barbearia. O BarberOS não intermedeia pagamentos entre a barbearia e seus clientes.',
        'Não respondemos por danos indiretos, como lucros cessantes ou perda de clientes, nem por falhas causadas por terceiros fora do nosso controle (operadoras, bancos, provedores de internet, Meta). Fora os casos de dolo ou culpa grave, nossa responsabilidade total fica limitada ao valor pago pela barbearia nos 3 meses anteriores ao fato.',
      ],
    },
    {
      id: 'fim',
      title: '15. Depois do cancelamento',
      body: [
        'Até 30 dias depois do fim da assinatura, você pode pedir pelo [[whatsapp]] uma cópia dos seus clientes e agendamentos em planilha. Depois de 90 dias, apagamos os dados da barbearia, salvo o que a lei obriga a guardar (como registros de cobrança e fiscais).',
      ],
    },
    {
      id: 'propriedade',
      title: '16. Propriedade intelectual',
      body: ['O software, a marca BarberOS, o layout e a documentação pertencem à Automa. A assinatura dá o direito de uso do serviço enquanto estiver ativa, sem transferir propriedade.'],
    },
    {
      id: 'alteracoes',
      title: '17. Mudanças nestes termos',
      body: ['Podemos atualizar estes termos. Mudanças relevantes são avisadas por e-mail ou no painel com pelo menos 15 dias de antecedência. Se não concordar, você pode cancelar antes de elas valerem.'],
    },
    {
      id: 'foro',
      title: '18. Lei aplicável e foro',
      body: ['Estes termos seguem as leis do Brasil. Fica eleito o foro da comarca de Salvador/BA, ressalvado o direito de quem se enquadra como consumidor de propor ação no foro do seu domicílio.'],
    },
  ],
}

export const PRIVACY: LegalDocument = {
  path: '/privacidade',
  title: 'Política de Privacidade',
  summary: [
    'Coletamos só o necessário para vender, cobrar e fazer o sistema funcionar.',
    'Dados de cartão ficam com o Asaas. O BarberOS nunca vê o número do seu cartão.',
    'Os dados dos clientes da sua barbearia são da barbearia. Nós só tratamos esses dados para prestar o serviço.',
    'Não vendemos dados. Compartilhamos apenas com os fornecedores listados aqui, para o serviço funcionar.',
    'Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento.',
  ],
  sections: [
    {
      id: 'quem',
      title: '1. Quem trata os seus dados',
      body: [
        WHO,
        'A Automa é a controladora dos dados de quem visita o site barberosbr.com, de quem assina (donos e equipe das barbearias) e dos parceiros do programa de indicação.',
        'Em relação aos clientes finais que usam o app de cada barbearia, a controladora é a própria barbearia. A Automa atua como operadora, tratando esses dados em nome dela e só para prestar o serviço.',
      ],
    },
    {
      id: 'coletamos',
      title: '2. Dados que coletamos',
      body: [
        'Assinatura e checkout: nome, e-mail, WhatsApp, CPF ou CNPJ, nome da barbearia e, no cartão, o CEP e o número do endereço do titular (exigidos pelo antifraude).',
        'Pagamento: o status das cobranças e faturas, recebidos do Asaas. Número, validade e código do cartão são enviados direto ao Asaas e não ficam guardados no BarberOS.',
        'Uso do painel: dados que você cadastra (marca, equipe, serviços, horários, agenda), além de registros de acesso (data, hora e IP) para segurança.',
        'Site: páginas visitadas, origem da visita (como utm_source e o site que trouxe você), um identificador da sessão do navegador e, quando ativados, cookies da Meta (Pixel) e do Google (Google tag) para medir anúncios.',
        'Parceiros: nome, e-mail, WhatsApp, chave Pix, barbearias indicadas, comissões e saques.',
      ],
    },
    {
      id: 'clientes-finais',
      title: '3. Dados dos clientes das barbearias',
      body: [
        'No app de cada barbearia, tratamos em nome dela: nome, e-mail, WhatsApp, senha (guardada só como hash, nunca em texto), agendamentos, avaliações, pontos, recompensas, indicações e as mensagens de aviso enviadas pelo WhatsApp da barbearia.',
        'Esses dados são usados apenas para o app funcionar para aquela barbearia. Não cruzamos clientes entre barbearias e não usamos esses dados para marketing do BarberOS.',
        'Quem é cliente de uma barbearia deve fazer os pedidos sobre seus dados diretamente a ela. Se chegarem até nós, encaminhamos e ajudamos a barbearia a responder.',
      ],
    },
    {
      id: 'finalidades',
      title: '4. Para que usamos e com qual base legal',
      body: [
        [
          'Prestar o serviço, criar a conta, cobrar e dar suporte: execução de contrato (LGPD, art. 7º, V).',
          'Guardar registros de cobrança, notas e acessos pelo prazo da lei: cumprimento de obrigação legal (art. 7º, II).',
          'Segurança, prevenção a fraude, métricas de uso e melhoria do produto: legítimo interesse (art. 7º, IX), sempre de forma proporcional.',
          'Cookies de anúncios da Meta e do Google no site: consentimento, que pode ser recusado pelo navegador (art. 7º, I).',
          'E-mails sobre a sua conta (senha, cobrança, avisos importantes): execução de contrato. Comunicações promocionais só com a possibilidade de sair a qualquer momento.',
        ],
      ],
    },
    {
      id: 'compartilhamento',
      title: '5. Com quem compartilhamos',
      body: [
        'Não vendemos dados pessoais. Compartilhamos apenas com fornecedores que ajudam o serviço a funcionar:',
        [
          'Asaas: processamento de pagamentos (Pix Automático e cartão) e transferências de comissão a parceiros;',
          'Resend: envio de e-mails transacionais (senha, boas-vindas, avisos);',
          'Cloudflare: DNS, proteção e entrega segura do site e dos apps;',
          'provedores de servidores onde o sistema e o banco de dados rodam;',
          'Meta (WhatsApp): entrega das mensagens enviadas pelo número conectado pela barbearia;',
          'Meta e Google: medição de anúncios no site, quando os cookies estão ativos;',
          'ViaCEP: consulta de endereço a partir do CEP digitado no cadastro da barbearia.',
        ],
        'Também podemos compartilhar dados quando uma lei ou ordem de autoridade competente exigir.',
        'Alguns desses fornecedores guardam dados fora do Brasil. Nesses casos, a transferência segue a LGPD, com fornecedores que adotam padrões de proteção adequados.',
      ],
    },
    {
      id: 'seguranca',
      title: '6. Segurança',
      body: [
        'Todo o tráfego usa HTTPS. Senhas são guardadas com hash e nunca em texto. O acesso ao painel usa tokens com expiração e respeita o papel de cada pessoa (dono, gestor ou barbeiro). O acesso interno aos dados é restrito a quem precisa para operar o serviço.',
        'Nenhum sistema é 100% seguro. Se houver um incidente que possa trazer risco relevante, avisamos as pessoas afetadas e a Autoridade Nacional de Proteção de Dados (ANPD), como pede a lei.',
      ],
    },
    {
      id: 'retencao',
      title: '7. Por quanto tempo guardamos',
      body: [
        [
          'Dados da conta e da barbearia: enquanto a assinatura estiver ativa e por até 90 dias depois do cancelamento.',
          'Registros de acesso: pelo menos 6 meses, como exige o Marco Civil da Internet.',
          'Registros de cobrança e fiscais: pelo prazo exigido pela legislação fiscal (em geral, 5 anos).',
          'Dados de parceiros: enquanto participar do programa e pelo prazo legal dos pagamentos feitos.',
        ],
      ],
    },
    {
      id: 'direitos',
      title: '8. Seus direitos',
      body: [
        'Pela LGPD, você pode pedir a qualquer momento: confirmação de que tratamos seus dados, acesso, correção, anonimização ou exclusão do que for desnecessário, portabilidade, informação sobre compartilhamentos, e revogação de consentimento.',
        'Faça o pedido pelo [[whatsapp]] ou pelo Instagram [[instagram]]. Respondemos em até 15 dias. Você também pode reclamar à ANPD.',
      ],
    },
    {
      id: 'cookies',
      title: '9. Cookies',
      body: [
        'O site usa armazenamento do navegador para lembrar a origem da visita e o link de parceiro, e para contar uma visita por sessão. Quando ativados, a Meta e o Google usam cookies para medir os anúncios.',
        'Você pode bloquear ou apagar cookies nas configurações do navegador. O site continua funcionando sem eles.',
      ],
    },
    {
      id: 'menores',
      title: '10. Menores de idade',
      body: ['A assinatura e o programa de parceiros são só para maiores de 18 anos. Clientes menores que usam o app de uma barbearia estão sob a responsabilidade dela e de seus responsáveis legais.'],
    },
    {
      id: 'mudancas',
      title: '11. Mudanças nesta política',
      body: ['Podemos atualizar esta política. A data da versão fica no topo da página e mudanças relevantes são avisadas por e-mail ou no painel.'],
    },
  ],
}

export const PARTNER_TERMS: LegalDocument = {
  path: '/termos-parceiros',
  title: 'Termos do Programa de Parceiros',
  summary: [
    'Você ganha uma comissão sobre as mensalidades pagas pelas barbearias que assinarem pelo seu link. As regras em vigor ficam no seu painel.',
    'A comissão fica disponível depois da carência, que cobre a garantia de 7 dias das barbearias.',
    'Saque por Pix para uma chave no seu nome, a partir do valor mínimo.',
    'Não vale indicar a si mesmo, fazer spam ou anunciar se passando pelo BarberOS.',
    'Não há vínculo de emprego. Você indica quando e como quiser.',
  ],
  sections: [
    {
      id: 'quem',
      title: '1. O programa',
      body: [
        WHO,
        'O Programa de Parceiros remunera quem indica o BarberOS para barbearias. Ao se cadastrar em barberosbr.com/parceiros ou entrar no programa pelo painel, você concorda com estes termos, com os [[termos]] no que couber e com a [[privacidade]].',
      ],
    },
    {
      id: 'quem-pode',
      title: '2. Quem pode participar',
      body: ['Pessoas maiores de 18 anos, com CPF regular e chave Pix em seu nome (ou no CNPJ da sua empresa). Donos de barbearias assinantes também podem participar.'],
    },
    {
      id: 'indicacao',
      title: '3. Como a indicação é contada',
      body: [
        'Cada parceiro tem um link com código próprio. A barbearia que abrir o seu link e assinar pelo checkout do site em até 90 dias, no mesmo navegador, fica ligada a você.',
        'Cada barbearia fica ligada a um único parceiro: vale o primeiro link registrado na compra. Vendas fechadas por outros canais podem ser atribuídas pela Automa se ficar comprovado que vieram do parceiro.',
        'Não contam: a assinatura da sua própria barbearia ou de quem usa o mesmo e-mail que você, e indicações feitas enquanto a sua conta de parceiro estiver suspensa.',
      ],
    },
    {
      id: 'comissao',
      title: '4. Comissão',
      body: [
        'A comissão é calculada sobre cada mensalidade efetivamente paga pela barbearia indicada, conforme as regras em vigor exibidas no seu painel e em barberosbr.com/parceiros (percentual ou valor fixo, e por quantas mensalidades).',
        'Mudanças nas regras valem só para mensalidades pagas depois da mudança. Comissões já geradas não mudam. Mudanças para pior são avisadas com pelo menos 15 dias de antecedência.',
        'A comissão fica pendente durante a carência informada no painel, contada do pagamento, e depois fica disponível para saque.',
        'Se a mensalidade for estornada, reembolsada ou contestada (por exemplo, na garantia de 7 dias ou em chargeback), a comissão correspondente é cancelada. Se ela já tiver sido sacada, o valor é descontado das próximas comissões.',
      ],
    },
    {
      id: 'saque',
      title: '5. Saque',
      body: [
        'Com saldo disponível igual ou maior que o mínimo informado no painel, você pede o saque de todo o disponível. O pagamento é feito por Pix na chave cadastrada, em até 5 dias úteis depois do pedido.',
        'A chave precisa estar em seu nome. Podemos recusar o saque, informando o motivo, se a chave não for do titular ou se houver suspeita de fraude. Nesse caso, o valor volta ao seu saldo.',
        'Você é responsável pelos tributos sobre o que receber. A Automa pode pedir documentos fiscais quando a lei exigir.',
      ],
    },
    {
      id: 'conduta',
      title: '6. Conduta',
      body: [
        'Não é permitido:',
        [
          'enviar spam, mensagens em massa ou contatos não solicitados;',
          'se apresentar como funcionário, sócio ou representante oficial do BarberOS ou da Automa;',
          'fazer promessas que o produto não cumpre, ou oferecer descontos e condições que não existem;',
          'comprar anúncios usando a marca BarberOS como palavra-chave, ou criar perfis e sites que imitem os oficiais;',
          'criar cadastros falsos, indicar a si mesmo por outra conta ou manipular a atribuição de qualquer forma.',
        ],
      ],
    },
    {
      id: 'suspensao',
      title: '7. Suspensão e saída',
      body: [
        'Se estes termos forem descumpridos, podemos suspender a conta de parceiro e cancelar as comissões ligadas à irregularidade, informando o motivo. Comissões legítimas continuam sendo pagas.',
        'Você pode sair quando quiser, falando com a gente. Pagamos o saldo disponível acima do mínimo.',
        'A Automa pode encerrar o programa avisando com 30 dias de antecedência. Nesse caso, todo o saldo gerado até o encerramento é pago, mesmo abaixo do mínimo, depois da carência.',
      ],
    },
    {
      id: 'vinculo',
      title: '8. Sem vínculo',
      body: ['A participação não cria vínculo de emprego, sociedade, representação comercial nem exclusividade entre você e a Automa. Você decide quando, como e se vai indicar.'],
    },
    {
      id: 'foro',
      title: '9. Lei e foro',
      body: ['Estes termos seguem as leis do Brasil. Fica eleito o foro da comarca de Salvador/BA. Dúvidas? Fale com a gente pelo [[whatsapp]].'],
    },
  ],
}

export const DOCUMENTS = [TERMS, PRIVACY, PARTNER_TERMS]
