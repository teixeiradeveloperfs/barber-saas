/** Modelos de e-mail da plataforma. HTML simples em tabela (clientes de e-mail) + texto puro. */

function escape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function layout(title: string, body: string, cta?: { label: string; url: string }, footer = 'Você recebeu este e-mail porque assinou o BarberOS.') {
  const button = cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${escape(cta.url)}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#e2d3a8;color:#141312;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;font-size:15px">${escape(cta.label)}</a></td></tr>`
    : '';
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#0b0b0c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0c;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#18181b;border-radius:20px;padding:32px">
<tr><td style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#f3eee3;padding-bottom:24px">Barber<span style="color:#e2d3a8">OS</span></td></tr>
<tr><td style="font-family:Arial,sans-serif;font-size:22px;line-height:1.3;color:#f3eee3;padding-bottom:12px">${escape(title)}</td></tr>
<tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#c9c4ba;padding-bottom:16px">${body}</td></tr>
${button}
<tr><td style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#7d7a74;border-top:1px solid #2a2a2f;padding-top:16px">${escape(footer)} Dúvidas? Fale com a gente pelo WhatsApp em <a href="https://barberosbr.com" style="color:#e2d3a8">barberosbr.com</a>.</td></tr>
</table></td></tr></table></body></html>`;
}

function reais(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Pagamento confirmado: link para criar a senha e começar. */
export function welcomeEmail(input: { name: string; shopName: string; link: string; priceCents: number; founder: boolean; method: string }) {
  const first = input.name.trim().split(/\s+/)[0] ?? input.name;
  const plan = `${reais(input.priceCents)}/mês${input.founder ? ', travado para sempre como sócio fundador' : ''}`;
  const method = input.method === 'CARTAO' ? 'no cartão de crédito' : 'no Pix Automático';
  const title = `Pronto, ${first}! A ${input.shopName} já está no BarberOS.`;
  const body = `Pagamento confirmado. Sua assinatura fica em ${escape(plan)}, cobrada ${method}.<br><br>Agora crie a sua senha do painel. Depois são 6 passos rápidos para deixar o app da barbearia com a sua cara: dados, marca, serviços, equipe e horários.<br><br><strong>Você tem 7 dias de teste:</strong> se não gostar, cancele no painel (Início › Sua assinatura) e devolvemos 100% do valor.<br><br>O link vale por 7 dias.`;
  return {
    subject: `Crie sua senha: a ${input.shopName} já está no BarberOS`,
    html: layout(title, body, { label: 'Criar minha senha', url: input.link }),
    text: `${title}\n\nPagamento confirmado. Sua assinatura fica em ${plan}, cobrada ${method}.\n\nCrie a sua senha do painel (o link vale por 7 dias):\n${input.link}\n\nDepois são 6 passos rápidos para deixar o app da barbearia com a sua cara.\n\nVocê tem 7 dias de teste: se não gostar, cancele no painel (Início > Sua assinatura) e devolvemos 100% do valor.`,
  };
}

/** Aviso para quem opera a plataforma: nova venda pelo site. */
export function saleEmail(input: { name: string; email: string; phone: string; shopName: string; priceCents: number; founder: boolean; method: string; origin: string | null }) {
  const title = `Nova venda: ${input.shopName}`;
  const lines = [
    `${escape(input.name)} · ${escape(input.email)} · ${escape(input.phone)}`,
    `${reais(input.priceCents)}/mês${input.founder ? ' · sócio fundador' : ''} · ${input.method === 'CARTAO' ? 'cartão' : 'Pix Automático'}`,
    input.origin ? `Origem: ${escape(input.origin)}` : 'Origem: direto',
  ];
  return {
    subject: `Nova venda pelo site: ${input.shopName}`,
    html: layout(title, lines.join('<br>')),
    text: `${title}\n\n${lines.join('\n').replace(/&amp;/g, '&')}`,
  };
}

/** Link para redefinir a senha do painel (reenvio do primeiro acesso). */
export function accessLinkEmail(input: { name: string; link: string }) {
  const first = input.name.trim().split(/\s+/)[0] ?? input.name;
  const title = `${first}, aqui está seu link de acesso.`;
  const body = 'Use o botão abaixo para criar ou trocar a sua senha do painel do BarberOS. O link vale por 7 dias e só funciona uma vez.';
  return { subject: 'Seu link de acesso ao BarberOS', html: layout(title, body, { label: 'Definir minha senha', url: input.link }), text: `${title}\n\n${body}\n${input.link}` };
}

/** Assinatura cancelada pelo dono (com ou sem reembolso). */
export function cancelEmail(input: { name: string; shopName: string; refundedCents: number | null; accessUntil: Date | null }) {
  const first = input.name.trim().split(/\s+/)[0] ?? input.name;
  const until = input.accessUntil ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' }).format(input.accessUntil) : null;
  const title = `${first}, sua assinatura foi cancelada.`;
  const body =
    input.refundedCents !== null
      ? `Cancelamos a assinatura da ${escape(input.shopName)} dentro dos 7 dias de teste. O reembolso de ${reais(input.refundedCents)} já foi pedido: no Pix cai em instantes; no cartão aparece na fatura em até 10 dias úteis. O app saiu do ar.`
      : `Cancelamos a assinatura da ${escape(input.shopName)}. Não haverá novas cobranças.${until ? ` O app continua no ar até ${until}.` : ''}`;
  return { subject: `Assinatura cancelada: ${input.shopName}`, html: layout(title, `${body}<br><br>Se mudar de ideia, é só assinar de novo em barberosbr.com.`), text: `${title}\n\n${body.replace(/&amp;/g, '&')}\n\nSe mudar de ideia, é só assinar de novo em barberosbr.com.` };
}

const PARTNER_FOOTER = 'Você recebeu este e-mail porque é parceiro do BarberOS.';

/** Parceiro cadastrado pelo site: link para criar a senha e o link de indicação. */
export function affiliateWelcomeEmail(input: { name: string; link: string; terms: string; shareLink: string }) {
  const first = input.name.trim().split(/\s+/)[0] ?? input.name;
  const title = `${first}, bem-vindo ao programa de parceiros.`;
  const body = `Você ganha <strong>${escape(input.terms)}</strong> das barbearias que assinarem pelo seu link.<br><br>Seu link: <a href="${escape(input.shareLink)}" style="color:#e2d3a8">${escape(input.shareLink)}</a><br><br>Crie sua senha para acompanhar indicações, ganhos e pedir saques por Pix no painel. O link de acesso vale por 7 dias.`;
  return {
    subject: 'Seu acesso de parceiro BarberOS',
    html: layout(title, body, { label: 'Criar minha senha', url: input.link }, PARTNER_FOOTER),
    text: `${title}\n\nVocê ganha ${input.terms} das barbearias que assinarem pelo seu link.\n\nSeu link: ${input.shareLink}\n\nCrie sua senha (vale por 7 dias):\n${input.link}`,
  };
}

/** Aviso para quem opera a plataforma: parceiro pediu saque. */
export function withdrawalRequestedEmail(input: { name: string; email: string; amountCents: number }) {
  const title = `Saque pedido: ${reais(input.amountCents)}`;
  const body = `${escape(input.name)} (${escape(input.email)}) pediu o saque das comissões. Pague em Parceiros, no painel.`;
  return { subject: `Saque de parceiro: ${reais(input.amountCents)}`, html: layout(title, body, undefined, PARTNER_FOOTER), text: `${title}\n\n${input.name} (${input.email}) pediu o saque das comissões. Pague em Parceiros, no painel.` };
}

/** Saque pago ou recusado. */
export function withdrawalDecidedEmail(input: { name: string; amountCents: number; paid: boolean; note: string | null }) {
  const first = input.name.trim().split(/\s+/)[0] ?? input.name;
  const title = input.paid ? `${first}, seu saque de ${reais(input.amountCents)} foi pago.` : `${first}, seu saque não foi aprovado.`;
  const body = input.paid
    ? 'O Pix foi enviado para a chave cadastrada no painel. Obrigado por indicar o BarberOS.'
    : `O valor de ${reais(input.amountCents)} voltou para o seu saldo disponível.${input.note ? `<br><br>Motivo: ${escape(input.note)}` : ''}`;
  return { subject: input.paid ? `Saque pago: ${reais(input.amountCents)}` : 'Saque não aprovado', html: layout(title, body, undefined, PARTNER_FOOTER), text: `${title}\n\n${body.replace(/<br>/g, '\n').replace(/&amp;/g, '&')}` };
}
