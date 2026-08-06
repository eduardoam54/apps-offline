/**
 * Entrada principal de @repo/core — APENAS logica pura.
 *
 * Nada aqui importa expo-sqlite nem qualquer modulo nativo, para este arquivo
 * poder ser carregado pelo vitest no Node sem simular o React Native.
 *
 * O acesso ao banco vive no subcaminho `@repo/core/db`.
 */
export * from './money';
export * from './date';
export * from './id';
export * from './texto';
