import { describe, expect, it } from 'vitest';

import {
  avisoDeLimite,
  LIMITE_CLIENTES_GRATIS,
  podeCadastrarCliente,
  recursoLiberado,
  vagasRestantes,
} from './plano';

describe('recursoLiberado', () => {
  it('libera exportar so no plano pago', () => {
    expect(recursoLiberado('exportar', 'pago')).toBe(true);
    expect(recursoLiberado('exportar', 'gratis')).toBe(false);
  });
});

describe('podeCadastrarCliente', () => {
  it('deixa cadastrar enquanto ha vaga no gratuito', () => {
    expect(podeCadastrarCliente('gratis', 0)).toBe(true);
    expect(podeCadastrarCliente('gratis', LIMITE_CLIENTES_GRATIS - 1)).toBe(true);
  });

  it('barra o cadastro ao encher', () => {
    expect(podeCadastrarCliente('gratis', LIMITE_CLIENTES_GRATIS)).toBe(false);
  });

  it('nao tem limite no plano pago', () => {
    expect(podeCadastrarCliente('pago', 500)).toBe(true);
  });

  it('barra so o cadastro novo de quem ja passou do limite', () => {
    // Restaurou um backup de 40 clientes no plano gratuito. Nao pode cadastrar
    // o 41o, mas nada mais e bloqueado: o dado ja e dele.
    expect(podeCadastrarCliente('gratis', 40)).toBe(false);
    expect(vagasRestantes('gratis', 40)).toBe(0);
  });
});

describe('vagasRestantes', () => {
  it('conta quantas sobram', () => {
    expect(vagasRestantes('gratis', 0)).toBe(LIMITE_CLIENTES_GRATIS);
    expect(vagasRestantes('gratis', LIMITE_CLIENTES_GRATIS - 2)).toBe(2);
  });

  it('nunca fica negativa', () => {
    // Numero negativo vazaria para a tela como "faltam -25 clientes".
    expect(vagasRestantes('gratis', 40)).toBe(0);
  });

  it('e null quando nao ha limite', () => {
    expect(vagasRestantes('pago', 500)).toBeNull();
  });
});

describe('avisoDeLimite', () => {
  it('fica quieto enquanto sobra folga', () => {
    expect(avisoDeLimite('gratis', 0)).toBe('nenhum');
    expect(avisoDeLimite('gratis', LIMITE_CLIENTES_GRATIS - 4)).toBe('nenhum');
  });

  it('avisa antes de encher, nao na hora', () => {
    // Descobrir o limite so com o cliente esperando no balcao e o caminho mais
    // curto para uma avaliacao de uma estrela.
    expect(avisoDeLimite('gratis', LIMITE_CLIENTES_GRATIS - 3)).toBe('perto');
    expect(avisoDeLimite('gratis', LIMITE_CLIENTES_GRATIS - 1)).toBe('perto');
  });

  it('diz quando encheu', () => {
    expect(avisoDeLimite('gratis', LIMITE_CLIENTES_GRATIS)).toBe('cheio');
    expect(avisoDeLimite('gratis', 40)).toBe('cheio');
  });

  it('nunca avisa no plano pago', () => {
    expect(avisoDeLimite('pago', 500)).toBe('nenhum');
  });
});
