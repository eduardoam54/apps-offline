import { describe, expect, it } from 'vitest';

import { aplicarTemplate, linkWhatsApp, paraFormatoWhatsApp } from './whatsapp';

describe('paraFormatoWhatsApp', () => {
  it('acrescenta o DDI em numero nacional', () => {
    expect(paraFormatoWhatsApp('11987654321')).toBe('5511987654321'); // celular
    expect(paraFormatoWhatsApp('1132654321')).toBe('551132654321'); // fixo
  });

  it('aceita numero ja formatado pelo usuario', () => {
    expect(paraFormatoWhatsApp('(11) 98765-4321')).toBe('5511987654321');
    expect(paraFormatoWhatsApp('11 98765 4321')).toBe('5511987654321');
  });

  it('nao duplica o DDI de quem ja tem', () => {
    expect(paraFormatoWhatsApp('5511987654321')).toBe('5511987654321');
    expect(paraFormatoWhatsApp('+55 11 98765-4321')).toBe('5511987654321');
  });

  it('trata o DDD 55 sem confundir com codigo de pais', () => {
    // Santa Maria/RS usa DDD 55. Prefixar por prefixo em vez de comprimento
    // transformaria esse numero valido em lixo.
    expect(paraFormatoWhatsApp('55999998888')).toBe('5555999998888');
    expect(paraFormatoWhatsApp('5532101234')).toBe('555532101234');
  });

  it('devolve null quando nao da para usar', () => {
    expect(paraFormatoWhatsApp(null)).toBeNull();
    expect(paraFormatoWhatsApp('')).toBeNull();
    expect(paraFormatoWhatsApp('98765')).toBeNull();
    expect(paraFormatoWhatsApp('sem numero')).toBeNull();
  });
});

describe('linkWhatsApp', () => {
  it('monta a url com a mensagem codificada', () => {
    const link = linkWhatsApp('11987654321', 'Oi João, tudo bem?');
    expect(link).toBe('https://wa.me/5511987654321?text=Oi%20Jo%C3%A3o%2C%20tudo%20bem%3F');
  });

  it('devolve null sem telefone utilizavel', () => {
    expect(linkWhatsApp(null, 'oi')).toBeNull();
    expect(linkWhatsApp('123', 'oi')).toBeNull();
  });
});

describe('aplicarTemplate', () => {
  it('substitui as variaveis', () => {
    expect(
      aplicarTemplate('Oi {cliente}, você está em {valor} na {loja}.', {
        cliente: 'João',
        valor: 'R$ 42,00',
        loja: 'Mercadinho do Zé',
      })
    ).toBe('Oi João, você está em R$ 42,00 na Mercadinho do Zé.');
  });

  it('apaga variavel desconhecida em vez de mostrar crua', () => {
    // Mandar "Oi {nome}" para o cliente e pior do que mandar "Oi ".
    expect(aplicarTemplate('Oi {nome}!', { cliente: 'João' })).toBe('Oi !');
  });

  it('nao mexe em texto sem variavel', () => {
    expect(aplicarTemplate('Bom dia!', {})).toBe('Bom dia!');
  });

  it('substitui a mesma variavel varias vezes', () => {
    expect(aplicarTemplate('{cliente}, {cliente}!', { cliente: 'Ana' })).toBe('Ana, Ana!');
  });
});
