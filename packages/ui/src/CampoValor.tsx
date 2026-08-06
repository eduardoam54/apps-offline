import { formatarNumero, type Centavos } from '@repo/core';
import { Text, TextInput, View } from 'react-native';

import { useTema } from './contexto';

type Props = {
  valor: Centavos;
  aoMudar: (centavos: Centavos) => void;
  rotulo?: string;
  autoFoco?: boolean;
  erro?: string | null;
};

/** 999.999.999,99 — teto que nenhuma caderneta de bairro alcanca. */
const MAXIMO_DIGITOS = 11;

/**
 * Campo de dinheiro.
 *
 * O valor e montado da direita para a esquerda: cada digito empurra os outros
 * para o lado, entao digitar 4-2-0-0 produz R$ 42,00. O comerciante nunca
 * precisa achar a virgula no teclado, e nao existe estado intermediario
 * invalido — o campo sempre contem um valor em centavos coerente.
 *
 * E o motivo de o teclado ser `number-pad` e nao `decimal-pad`: nao ha separador
 * para digitar.
 */
export function CampoValor({ valor, aoMudar, rotulo, autoFoco = false, erro }: Props) {
  const tema = useTema();

  function digitou(texto: string) {
    const digitos = texto.replace(/\D/g, '').slice(0, MAXIMO_DIGITOS);
    aoMudar(digitos === '' ? 0 : Number(digitos));
  }

  return (
    <View style={{ gap: tema.espaco.xs }}>
      {rotulo != null && (
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            fontWeight: tema.peso.medio,
            color: tema.cores.textoSecundario,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          {rotulo}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: tema.espaco.sm,
          borderBottomWidth: 2,
          borderBottomColor: erro ? tema.cores.divida : tema.cores.borda,
          paddingBottom: tema.espaco.sm,
        }}>
        <Text
          style={{
            fontSize: tema.fonte.titulo,
            fontWeight: tema.peso.forte,
            color: tema.cores.textoFraco,
          }}>
          R$
        </Text>

        <TextInput
          value={formatarNumero(valor)}
          onChangeText={digitou}
          keyboardType="number-pad"
          autoFocus={autoFoco}
          selectTextOnFocus={false}
          style={{
            flex: 1,
            fontSize: tema.fonte.gigante,
            fontWeight: tema.peso.destaque,
            color: tema.cores.texto,
            padding: 0,
          }}
        />
      </View>

      {erro != null && erro !== '' && (
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erro}</Text>
      )}
    </View>
  );
}
