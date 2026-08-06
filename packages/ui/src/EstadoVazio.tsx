import { Text, View } from 'react-native';

import { Botao } from './Botao';
import { useTema } from './contexto';

type Props = {
  titulo: string;
  texto?: string;
  acao?: { titulo: string; aoTocar: () => void };
};

/**
 * Estado vazio.
 *
 * Toda lista do app tem um. Lista vazia sem explicacao parece app quebrado, e o
 * comerciante que acha que o app quebrou volta para o caderno de papel.
 */
export function EstadoVazio({ titulo, texto, acao }: Props) {
  const tema = useTema();

  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: tema.espaco.xxxl,
        paddingHorizontal: tema.espaco.lg,
        gap: tema.espaco.sm,
      }}>
      <Text
        style={{
          fontSize: tema.fonte.subtitulo,
          fontWeight: tema.peso.forte,
          color: tema.cores.texto,
          textAlign: 'center',
        }}>
        {titulo}
      </Text>

      {texto != null && (
        <Text
          style={{
            fontSize: tema.fonte.corpo,
            color: tema.cores.textoSecundario,
            textAlign: 'center',
            lineHeight: 24,
          }}>
          {texto}
        </Text>
      )}

      {acao != null && (
        <Botao
          titulo={acao.titulo}
          aoTocar={acao.aoTocar}
          estilo={{ marginTop: tema.espaco.lg, paddingHorizontal: tema.espaco.xxl }}
        />
      )}
    </View>
  );
}
