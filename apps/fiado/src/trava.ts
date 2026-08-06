import { CHAVES, gravarConfig, lerConfig } from '@repo/core/db';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

import { db } from '@/db';

/**
 * Trava do app.
 *
 * SEJAMOS HONESTOS SOBRE O QUE ISTO PROTEGE. Um PIN de 4 digitos tem dez mil
 * combinacoes; nenhum algoritmo de hash torna isso resistente a quem tenha o
 * arquivo do banco em maos e paciencia. O sal impede apenas que o hash seja
 * comparado contra uma tabela pronta.
 *
 * Esta trava serve contra o caso real do balconista: alguem pega o celular
 * destravado no balcao e bisbilhota quanto os vizinhos devem. Ela nao serve
 * contra pericia forense — e o app nao promete isso em lugar nenhum.
 *
 * O PIN nao pode ser recuperado. Perdeu, so restaurando um backup.
 */

async function calcularHash(pin: string, sal: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sal}:${pin}`);
}

export async function temPinDefinido(): Promise<boolean> {
  return (await lerConfig(db, CHAVES.pinHash)) !== '';
}

export async function definirPin(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('O PIN precisa ter 4 números.');
  }

  const sal = Array.from(Crypto.getRandomBytes(16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await gravarConfig(db, CHAVES.pinSal, sal);
  await gravarConfig(db, CHAVES.pinHash, await calcularHash(pin, sal));
}

export async function verificarPin(pin: string): Promise<boolean> {
  const [hashGuardado, sal] = await Promise.all([
    lerConfig(db, CHAVES.pinHash),
    lerConfig(db, CHAVES.pinSal),
  ]);

  if (hashGuardado === '' || sal === '') return false;
  return (await calcularHash(pin, sal)) === hashGuardado;
}

export async function removerPin(): Promise<void> {
  await gravarConfig(db, CHAVES.pinHash, '');
  await gravarConfig(db, CHAVES.pinSal, '');
  await gravarConfig(db, CHAVES.biometriaAtiva, 'nao');
}

export async function biometriaDisponivel(): Promise<boolean> {
  const [temHardware, temCadastro] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return temHardware && temCadastro;
}

export async function biometriaLigada(): Promise<boolean> {
  return (await lerConfig(db, CHAVES.biometriaAtiva)) === 'sim';
}

export async function ligarBiometria(ligada: boolean): Promise<void> {
  await gravarConfig(db, CHAVES.biometriaAtiva, ligada ? 'sim' : 'nao');
}

/**
 * Pede a digital ou o rosto.
 *
 * `disableDeviceFallback` fica ligado de proposito: o desbloqueio alternativo do
 * proprio aparelho e a senha do celular, que quem esta com ele na mao ja passou.
 * Cair nela esvaziaria a trava. Quem nao usar biometria digita o PIN do app.
 */
export async function autenticarComBiometria(): Promise<boolean> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear a caderneta',
    cancelLabel: 'Usar PIN',
    disableDeviceFallback: true,
  });

  return resultado.success;
}
