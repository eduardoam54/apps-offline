/**
 * Gera os icones do app a partir de geometria, sem dependencia nenhuma.
 *
 * Por que um script e nao um arquivo de design: a maquina nao tem rasterizador
 * (nem sharp, nem jimp, nem conversor de SVG), e o app estava indo para a loja
 * com o icone azul padrao do template do Expo. Um gerador em codigo resolve
 * isso agora, fica versionado e permite ajustar a marca mudando um numero.
 *
 * Nao pretende ser identidade visual definitiva — e um marco honesto na cor do
 * app, melhor do que o logo de outra ferramenta. Trocar por arte de verdade
 * depois e so substituir os PNGs.
 *
 *     node scripts/gerar-icones.js
 *
 * A marca e uma caderneta: retangulo arredondado branco, lombada mais escura na
 * esquerda e tres linhas pautadas. Tres, e nao cinco, porque abaixo de 48dp
 * linhas finas demais viram uma mancha cinza.
 */
const { deflateSync } = require('node:zlib');
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const VERDE = [0x0f, 0x76, 0x6e];
const VERDE_ESCURO = [0x0b, 0x5c, 0x56];
const BRANCO = [0xff, 0xff, 0xff];

// ---------------------------------------------------------------- PNG

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pedaco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

/** Codifica RGBA de 8 bits. Cada linha leva o byte de filtro 0 na frente. */
function png(largura, altura, pixels) {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(largura, 0);
  cabecalho.writeUInt32BE(altura, 4);
  cabecalho[8] = 8; // bits por canal
  cabecalho[9] = 6; // RGBA
  cabecalho[10] = 0;
  cabecalho[11] = 0;
  cabecalho[12] = 0;

  const linhas = Buffer.alloc(altura * (1 + largura * 4));
  for (let y = 0; y < altura; y++) {
    const destino = y * (1 + largura * 4);
    linhas[destino] = 0;
    pixels.copy(linhas, destino + 1, y * largura * 4, (y + 1) * largura * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', cabecalho),
    pedaco('IDAT', deflateSync(linhas, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- desenho

function tela(lado, fundo) {
  const px = Buffer.alloc(lado * lado * 4);
  if (fundo) {
    for (let i = 0; i < lado * lado; i++) {
      px[i * 4] = fundo[0];
      px[i * 4 + 1] = fundo[1];
      px[i * 4 + 2] = fundo[2];
      px[i * 4 + 3] = 255;
    }
  }
  return px;
}

/**
 * Distancia ate a borda de um retangulo arredondado.
 *
 * Negativa dentro, positiva fora. E o que permite antisserrilhado de verdade
 * sem renderizar em resolucao maior: a cobertura do pixel sai da distancia.
 */
function distancia(px, py, cx, cy, meiaL, meiaA, raio) {
  const qx = Math.abs(px - cx) - meiaL + raio;
  const qy = Math.abs(py - cy) - meiaA + raio;
  const fora = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return Math.min(Math.max(qx, qy), 0) + fora - raio;
}

function retangulo(px, lado, x, y, largura, altura, raio, cor) {
  const cx = x + largura / 2;
  const cy = y + altura / 2;

  const x0 = Math.max(0, Math.floor(x - 2));
  const x1 = Math.min(lado, Math.ceil(x + largura + 2));
  const y0 = Math.max(0, Math.floor(y - 2));
  const y1 = Math.min(lado, Math.ceil(y + altura + 2));

  for (let j = y0; j < y1; j++) {
    for (let i = x0; i < x1; i++) {
      const d = distancia(i + 0.5, j + 0.5, cx, cy, largura / 2, altura / 2, raio);
      const cobertura = Math.min(Math.max(0.5 - d, 0), 1);
      if (cobertura <= 0) continue;

      const p = (j * lado + i) * 4;
      const aAtual = px[p + 3] / 255;
      const aNovo = cobertura + aAtual * (1 - cobertura);

      for (let c = 0; c < 3; c++) {
        px[p + c] = Math.round(
          (cor[c] * cobertura + px[p + c] * aAtual * (1 - cobertura)) / (aNovo || 1)
        );
      }
      px[p + 3] = Math.round(aNovo * 255);
    }
  }
}

/**
 * Desenha a caderneta ocupando `proporcao` do lado da imagem.
 *
 * `corLinhas` sai branco no icone monocromatico, onde o sistema aplica a
 * propria cor e qualquer detalhe colorido some.
 */
function caderneta(px, lado, proporcao, corCapa, corLombada, corLinhas) {
  const l = lado * proporcao;
  const a = l * 1.12;
  const x = (lado - l) / 2;
  const y = (lado - a) / 2;

  retangulo(px, lado, x, y, l, a, l * 0.13, corCapa);

  // Lombada: faixa cheia na esquerda, cantos acompanhando a capa.
  retangulo(px, lado, x, y, l * 0.2, a, l * 0.13, corLombada);

  const margem = x + l * 0.33;
  const larguraLinha = l * 0.5;
  const espessura = a * 0.085;
  const espaco = a * 0.2;
  const primeira = y + a * 0.26;

  // A primeira linha e mais curta: sugere titulo e evita tres barras iguais,
  // que a essa escala parecem um icone de menu.
  for (let n = 0; n < 3; n++) {
    const w = n === 0 ? larguraLinha * 0.62 : larguraLinha;
    retangulo(px, lado, margem, primeira + n * espaco, w, espessura, espessura / 2, corLinhas);
  }
}

// ---------------------------------------------------------------- saida

const LADO = 1024;
const destino = join(__dirname, '..', 'assets', 'images');
mkdirSync(destino, { recursive: true });

function gravar(nome, pixels) {
  writeFileSync(join(destino, nome), png(LADO, LADO, pixels));
  console.log('gerado:', nome);
}

// Icone principal (iOS e Play Store): quadrado cheio, sem transparencia.
const principal = tela(LADO, VERDE);
caderneta(principal, LADO, 0.52, BRANCO, VERDE_ESCURO, VERDE);
gravar('icon.png', principal);

// Adaptativo do Android: fundo e frente separados. A marca vai menor porque o
// sistema recorta a frente num circulo de ~66% do quadrado.
gravar('android-icon-background.png', tela(LADO, VERDE));

const frente = tela(LADO, null);
caderneta(frente, LADO, 0.42, BRANCO, VERDE_ESCURO, VERDE);
gravar('android-icon-foreground.png', frente);

// Monocromatico (tema dinamico do Android 13+): so silhueta, o sistema pinta.
const mono = tela(LADO, null);
caderneta(mono, LADO, 0.42, BRANCO, BRANCO, BRANCO);
gravar('android-icon-monochrome.png', mono);

// Splash: a marca sozinha sobre o verde definido no app.json.
const splash = tela(LADO, null);
caderneta(splash, LADO, 0.62, BRANCO, VERDE_ESCURO, VERDE);
gravar('splash-icon.png', splash);
