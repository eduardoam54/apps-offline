import { Pressable, Text, View } from 'react-native';

import { useTema } from './contexto';

type Props = {
  titulo: string;
  subtitulo?: string | null;
  /** Ja formatado pelo chamador — este pacote nao sabe o que o numero significa. */
  valor?: string;
  corValor?: string;
  rodape?: string | null;
  aoTocar?: () => void;
};

/**
 * Linha de lista com um valor a direita.
 *
 * Componente generico de proposito: serve para cliente com saldo, lancamento do
 * extrato e parcela de acordo. Quem decide o que o valor significa — e de que
 * cor ele fica — e a tela que usa.
 */
export function LinhaLista({ titulo, subtitulo, valor, corValor, rodape, aoTocar }: Props) {
  const tema = useTema();

  const conteudo = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: tema.espaco.md,
        minHeight: tema.toque.principal,
        paddingVertical: tema.espaco.md,
        paddingHorizontal: tema.espaco.lg,
        backgroundColor: tema.cores.fundo,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: tema.fonte.corpo,
            fontWeight: tema.peso.forte,
            color: tema.cores.texto,
          }}>
          {titulo}
        </Text>

        {subtitulo != null && subtitulo !== '' && (
          <Text
            numberOfLines={1}
            style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
            {subtitulo}
          </Text>
        )}

        {rodape != null && rodape !== '' && (
          <Text numberOfLines={1} style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
            {rodape}
          </Text>
        )}
      </View>

      {valor != null && (
        <Text
          style={{
            fontSize: tema.fonte.subtitulo,
            fontWeight: tema.peso.destaque,
            color: corValor ?? tema.cores.texto,
          }}>
          {valor}
        </Text>
      )}
    </View>
  );

  if (aoTocar == null) return conteudo;

  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {conteudo}
    </Pressable>
  );
}

export function Separador() {
  const tema = useTema();
  return <View style={{ height: 1, backgroundColor: tema.cores.borda, marginLeft: tema.espaco.lg }} />;
}
