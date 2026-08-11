// Metro configurado para monorepo npm workspaces.
//
// Sem isso o bundler nao enxerga packages/* : ele so observa a pasta do app e
// so resolve node_modules a partir dela. As duas listas abaixo resolvem isso.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Observar o monorepo inteiro, para editar packages/* recarregar o app.
config.watchFolders = [monorepoRoot];

// 2. Resolver node_modules do app e depois o hoisted da raiz.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// NAO ligar `disableHierarchicalLookup`. Ele aparece em varios guias de
// monorepo, mas impede o Metro de enxergar dependencias aninhadas — e pacotes
// do proprio Expo dependem disso (@expo/metro-runtime vive dentro de
// expo-router/node_modules). Ligar essa opcao quebra o bundle na primeira
// importacao do entry point.

// 3. Reconhecer .sql como fonte — as migracoes do drizzle-kit sao arquivos SQL
//    importados pelo babel-plugin-inline-import.
config.resolver.sourceExts.push('sql');

module.exports = config;
