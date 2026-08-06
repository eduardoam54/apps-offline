const { withGradleProperties } = require('expo/config-plugins');

/**
 * Sobe o heap da JVM que compila o app.
 *
 * Existe porque `android/` e gerado pelo prebuild e nao e versionado: editar
 * `gradle.properties` na mao funciona ate o proximo `expo prebuild --clean`, e
 * ai o build volta a quebrar. Como plugin, o ajuste e reaplicado toda vez que a
 * pasta nativa e regerada.
 *
 * O template do Expo vem com `-Xmx2048m`. Com esse valor o D8 estoura a memoria
 * no merge das dex deste app:
 *
 *     com.android.builder.dexing.DexArchiveMergerException
 *     Caused by: java.lang.OutOfMemoryError: Java heap space
 *
 * A mensagem parece defeito de codigo e nao e — nada no app mudou, so nao coube
 * na memoria. Custou um build inteiro para descobrir, entao fica registrado.
 *
 * 3584m e escolhido para caber junto com o emulador numa maquina de 16 GB. Se o
 * build ainda falhar por memoria, feche o emulador antes de compilar: ele
 * sozinho consome alguns GB.
 */
const JVMARGS = '-Xmx3584m -XX:MaxMetaspaceSize=1024m';

module.exports = function withHeapDoGradle(config) {
  return withGradleProperties(config, (cfg) => {
    const propriedades = cfg.modResults;
    const entrada = { type: 'property', key: 'org.gradle.jvmargs', value: JVMARGS };

    const existente = propriedades.findIndex(
      (p) => p.type === 'property' && p.key === 'org.gradle.jvmargs'
    );

    if (existente >= 0) {
      propriedades[existente] = entrada;
    } else {
      propriedades.push(entrada);
    }

    return cfg;
  });
};
