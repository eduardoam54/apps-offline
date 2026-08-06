/**
 * Aritmetica de dinheiro.
 *
 * REGRA ABSOLUTA: valor monetario e sempre inteiro, em centavos. Nenhum `float`
 * atravessa este modulo. R$ 12,50 e o numero 1250 — nunca 12.5.
 *
 * O motivo nao e purismo: 0.1 + 0.2 === 0.30000000000000004 em ponto flutuante.
 * Num app de divida, um centavo de divergencia entre o extrato e o saldo destroi
 * a confianca do comerciante no app inteiro.
 */

/** Valor monetario em centavos. Sempre inteiro. */
export type Centavos = number;

/** Quantidade em milesimos. 1,5 kg = 1500. Mesmo motivo dos centavos. */
export type Milesimos = number;

export function ehCentavosValido(valor: unknown): valor is Centavos {
  return typeof valor === 'number' && Number.isSafeInteger(valor);
}

function exigirCentavos(valor: Centavos, origem: string): void {
  if (!ehCentavosValido(valor)) {
    throw new Error(`${origem}: esperava centavos inteiros, recebeu ${valor}`);
  }
}

/**
 * Converte o que o comerciante digitou em centavos.
 *
 * Aceita "12,50", "12.50", "1.234,56", "1234", "R$ 12,50" e vazio.
 * Retorna null quando nao da para interpretar — o chamador decide o que fazer,
 * porque "0" e uma resposta valida e diferente de "nao entendi".
 */
export function parseValorBR(texto: string): Centavos | null {
  if (typeof texto !== 'string') return null;

  const limpo = texto.replace(/[R$\s ]/gi, '');
  if (limpo === '') return null;
  if (!/^-?[\d.,]+$/.test(limpo)) return null;

  const negativo = limpo.startsWith('-');
  const corpo = negativo ? limpo.slice(1) : limpo;

  const ultimaVirgula = corpo.lastIndexOf(',');
  const ultimoPonto = corpo.lastIndexOf('.');

  let inteiros: string;
  let decimais: string;

  if (ultimaVirgula === -1 && ultimoPonto === -1) {
    // Sem separador: quem digita "42" quer R$ 42,00, nao 42 centavos.
    inteiros = corpo;
    decimais = '';
  } else if (ultimaVirgula !== -1) {
    // Havendo virgula, ela decide: em portugues virgula e SEMPRE decimal.
    // Por isso "12,555" nao e doze mil e quinhentos — e invalido.
    inteiros = corpo.slice(0, ultimaVirgula).replace(/[.,]/g, '');
    decimais = corpo.slice(ultimaVirgula + 1);
  } else {
    // So ponto: e o unico caso ambiguo. "1.234" sao mil duzentos e trinta e
    // quatro reais; "1.23" e um real e vinte e tres centavos.
    const antes = corpo.slice(0, ultimoPonto);
    const depois = corpo.slice(ultimoPonto + 1);
    const multiplosPontos = corpo.indexOf('.') !== ultimoPonto;
    const grupoDeMilhar =
      depois.length === 3 && (multiplosPontos || (antes.length >= 1 && antes.length <= 3));

    if (grupoDeMilhar) {
      inteiros = corpo.replace(/\./g, '');
      decimais = '';
    } else {
      inteiros = antes.replace(/\./g, '');
      decimais = depois;
    }
  }

  if (decimais.length > 2) return null;
  if (!/^\d*$/.test(inteiros) || !/^\d*$/.test(decimais)) return null;
  if (inteiros === '' && decimais === '') return null;

  const reais = inteiros === '' ? 0 : Number(inteiros);
  const cents = decimais === '' ? 0 : Number(decimais.padEnd(2, '0'));

  if (!Number.isFinite(reais) || !Number.isFinite(cents)) return null;

  const total = reais * 100 + cents;
  if (!Number.isSafeInteger(total)) return null;

  return negativo ? -total : total;
}

/** 1250 -> "12,50". Sem simbolo de moeda. */
export function formatarNumero(centavos: Centavos): string {
  exigirCentavos(centavos, 'formatarNumero');

  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100);
  const resto = abs % 100;

  const reaisComPonto = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}${reaisComPonto},${String(resto).padStart(2, '0')}`;
}

/** 1250 -> "R$ 12,50". */
export function formatarBRL(centavos: Centavos): string {
  const negativo = centavos < 0;
  const texto = formatarNumero(Math.abs(centavos));
  return `${negativo ? '-' : ''}R$ ${texto}`;
}

/** Soma segura: valida que tudo e inteiro e que nao estourou o limite. */
export function somar(...valores: Centavos[]): Centavos {
  let total = 0;
  for (const v of valores) {
    exigirCentavos(v, 'somar');
    total += v;
  }
  if (!Number.isSafeInteger(total)) {
    throw new Error('somar: resultado estourou o inteiro seguro');
  }
  return total;
}

export function subtrair(a: Centavos, b: Centavos): Centavos {
  exigirCentavos(a, 'subtrair');
  exigirCentavos(b, 'subtrair');
  return a - b;
}

/**
 * Total de um item: valor unitario x quantidade.
 *
 * Quantidade vem em milesimos, entao dividimos por 1000 e arredondamos —
 * 0,350 kg a R$ 25,90/kg da R$ 9,065, que vira R$ 9,07.
 */
export function totalDoItem(
  valorUnitario: Centavos,
  quantidade: Milesimos
): Centavos {
  exigirCentavos(valorUnitario, 'totalDoItem/valor');
  if (!Number.isSafeInteger(quantidade)) {
    throw new Error(`totalDoItem: quantidade deve ser inteiro em milesimos, recebeu ${quantidade}`);
  }
  const bruto = (valorUnitario * quantidade) / 1000;
  const total = Math.round(bruto);
  if (!Number.isSafeInteger(total)) {
    throw new Error('totalDoItem: resultado estourou o inteiro seguro');
  }
  return total;
}

/**
 * Le a quantidade digitada e devolve milesimos inteiros.
 *
 * Aceita "1", "1,5", "0,350" e "2.5". Diferente do dinheiro, aqui a virgula e o
 * ponto sao ambos separador decimal e nao existe agrupamento de milhar: ninguem
 * vende 1.500 kg de pao de uma vez, mas vende 1,5.
 *
 * Devolve null para vazio, texto invalido ou zero — quantidade zero num item de
 * venda e sempre erro de digitacao.
 */
export function parseQuantidade(texto: string): Milesimos | null {
  if (typeof texto !== 'string') return null;

  const limpo = texto.replace(/\s/g, '').replace(',', '.');
  if (limpo === '' || limpo === '.') return null;
  if (!/^\d*\.?\d*$/.test(limpo)) return null;

  const numero = Number(limpo);
  if (!Number.isFinite(numero) || numero <= 0) return null;

  const milesimos = Math.round(numero * 1000);
  if (!Number.isSafeInteger(milesimos) || milesimos <= 0) return null;

  return milesimos;
}

/** 1500 -> "1,5" · 1000 -> "1" · 350 -> "0,35". Sem zero a direita sobrando. */
export function formatarQuantidade(milesimos: Milesimos): string {
  if (!Number.isSafeInteger(milesimos)) {
    throw new Error(`formatarQuantidade: esperava milesimos inteiros, recebeu ${milesimos}`);
  }

  const inteiro = Math.floor(milesimos / 1000);
  const resto = milesimos % 1000;
  if (resto === 0) return String(inteiro);

  const decimais = String(resto).padStart(3, '0').replace(/0+$/, '');
  return `${inteiro},${decimais}`;
}

/**
 * Divide um total em N parcelas sem perder nem inventar centavo.
 *
 * A soma das parcelas devolvidas e SEMPRE exatamente igual ao total. O resto da
 * divisao vai para a ULTIMA parcela: R$ 100,00 em 3x devolve
 * [33,33 · 33,33 · 33,34]. E a convencao que o comerciante anuncia como
 * "3x de 33,33" com o ajuste no final.
 */
export function dividirParcelas(total: Centavos, quantidade: number): Centavos[] {
  exigirCentavos(total, 'dividirParcelas');
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw new Error(`dividirParcelas: quantidade invalida (${quantidade})`);
  }
  if (total < 0) {
    throw new Error('dividirParcelas: nao se parcela valor negativo');
  }

  const base = Math.floor(total / quantidade);
  const parcelas = new Array<Centavos>(quantidade).fill(base);
  parcelas[quantidade - 1] = total - base * (quantidade - 1);
  return parcelas;
}
