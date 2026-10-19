import { describe, expect, it } from 'vitest';
import { replyIntent } from './notifications.service.js';
import { phoneFromChatId, phoneKey, withCountry } from './phone.js';
import { DEFAULTS, exampleValues, render } from './templates.js';
import { mapStatus } from './whatsapp.service.js';

describe('telefones', () => {
  it('põe o 55 em número brasileiro sem DDI', () => {
    expect(withCountry('(11) 98765-4321')).toBe('5511987654321');
    expect(withCountry('5511987654321')).toBe('5511987654321');
  });
  it('trata o mesmo celular com e sem o nono dígito como igual', () => {
    expect(phoneKey('5511987654321')).toBe(phoneKey('551187654321'));
    expect(phoneKey('5511987654321')).not.toBe(phoneKey('5521987654321'));
  });
  it('tira o telefone do chatId', () => {
    expect(phoneFromChatId('5511987654321@c.us')).toBe('5511987654321');
    expect(phoneFromChatId('12345@lid')).toBeNull();
  });
});

describe('textos', () => {
  it('troca as variáveis e deixa as desconhecidas', () => {
    expect(render('Oi, {nome}! {xyz}', { nome: 'Rafael' })).toBe('Oi, Rafael! {xyz}');
  });
  it('todo padrão só usa variáveis conhecidas', () => {
    const values = exampleValues();
    for (const template of Object.values(DEFAULTS)) expect(render(template.text, values)).not.toMatch(/\{\w+\}/);
  });
});

describe('resposta ao lembrete', () => {
  it('reconhece confirmar e cancelar', () => {
    for (const text of ['1', ' Sim ', 'confirmo', 'tô indo']) expect(replyIntent(text)).toBe('confirmar');
    for (const text of ['2', 'Não', 'cancelar', 'nao vou']) expect(replyIntent(text)).toBe('cancelar');
  });
  it('ignora conversa comum', () => {
    for (const text of ['oi', '1 hora atrasado', 'sim, mas posso ir mais tarde?', '12']) expect(replyIntent(text)).toBeNull();
  });
});

describe('estado da sessão', () => {
  it('traduz o estado do WAHA', () => {
    expect(mapStatus('WORKING')).toBe('CONECTADO');
    expect(mapStatus('SCAN_QR_CODE')).toBe('AGUARDANDO_QR');
    expect(mapStatus('PASSKEY_REQUIRED')).toBe('AGUARDANDO_QR');
    expect(mapStatus('FAILED')).toBe('FALHOU');
    expect(mapStatus('STOPPED')).toBe('DESCONECTADO');
  });
});
