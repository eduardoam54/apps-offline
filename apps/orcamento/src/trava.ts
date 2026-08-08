import { gravarConfig, lerConfig } from '@repo/core/db';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

import { db } from '@/db';

/**
 * Trava do app.
 *
 * Mesmo mecanismo do fiado (`apps/fiado/src/trava.ts`) — ver os comentarios lá
 * sobre o que um PIN de 4 dígitos protege de fato e o que não protege.
 *
 * Chaves proprias, e não `CHAVES.pinHash` de `@repo/core/db`: aquelas são do
 * fiado, o mecanismo de chave/valor é que é compartilhado. Bancos são
 * separados por app de qualquer forma, então não há colisão possível, mas as
 * chaves ficam declaradas aqui — igual `CHAVES_EMPRESA` em `useEmpresa.ts`.
 */

const CHAVES_TRAVA = {
  pinHash: 'pin_hash',
  pinSal: 'pin_sal',
  biometriaAtiva: 'biometria_ativa',
} as const;

async function calcularHash(pin: string, sal: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sal}:${pin}`);
}

export async function temPinDefinido(): Promise<boolean> {
  return (await lerConfig(db, CHAVES_TRAVA.pinHash)) !== '';
}

export async function definirPin(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('O PIN precisa ter 4 números.');
  }

  const sal = Array.from(Crypto.getRandomBytes(16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await gravarConfig(db, CHAVES_TRAVA.pinSal, sal);
  await gravarConfig(db, CHAVES_TRAVA.pinHash, await calcularHash(pin, sal));
}

export async function verificarPin(pin: string): Promise<boolean> {
  const [hashGuardado, sal] = await Promise.all([
    lerConfig(db, CHAVES_TRAVA.pinHash),
    lerConfig(db, CHAVES_TRAVA.pinSal),
  ]);

  if (hashGuardado === '' || sal === '') return false;
  return (await calcularHash(pin, sal)) === hashGuardado;
}

export async function removerPin(): Promise<void> {
  await gravarConfig(db, CHAVES_TRAVA.pinHash, '');
  await gravarConfig(db, CHAVES_TRAVA.pinSal, '');
  await gravarConfig(db, CHAVES_TRAVA.biometriaAtiva, 'nao');
}

export async function biometriaDisponivel(): Promise<boolean> {
  const [temHardware, temCadastro] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return temHardware && temCadastro;
}

export async function biometriaLigada(): Promise<boolean> {
  return (await lerConfig(db, CHAVES_TRAVA.biometriaAtiva)) === 'sim';
}

export async function ligarBiometria(ligada: boolean): Promise<void> {
  await gravarConfig(db, CHAVES_TRAVA.biometriaAtiva, ligada ? 'sim' : 'nao');
}

/**
 * Pede a digital ou o rosto.
 *
 * `disableDeviceFallback` fica ligado de proposito: o desbloqueio alternativo
 * do proprio aparelho e a senha do celular, que quem esta com ele na mao ja
 * passou. Cair nela esvaziaria a trava. Quem nao usar biometria digita o PIN
 * do app.
 */
export async function autenticarComBiometria(): Promise<boolean> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear o app',
    cancelLabel: 'Usar PIN',
    disableDeviceFallback: true,
  });

  return resultado.success;
}
