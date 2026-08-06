import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useTema } from './contexto';

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  espacoReservado?: string;
  erro?: string | null;
  tipoTeclado?: KeyboardTypeOptions;
  autoFoco?: boolean;
  multilinha?: boolean;
  maiusculaInicial?: 'none' | 'sentences' | 'words' | 'characters';
  aoEnviar?: () => void;
};

export function CampoTexto({
  rotulo,
  valor,
  aoMudar,
  espacoReservado,
  erro,
  tipoTeclado = 'default',
  autoFoco = false,
  multilinha = false,
  maiusculaInicial = 'words',
  aoEnviar,
}: Props) {
  const tema = useTema();

  return (
    <View style={{ gap: tema.espaco.xs }}>
      <Text
        style={{
          fontSize: tema.fonte.pequeno,
          fontWeight: tema.peso.medio,
          color: tema.cores.textoSecundario,
        }}>
        {rotulo}
      </Text>

      <TextInput
        value={valor}
        onChangeText={aoMudar}
        placeholder={espacoReservado}
        placeholderTextColor={tema.cores.desabilitado}
        keyboardType={tipoTeclado}
        autoFocus={autoFoco}
        multiline={multilinha}
        autoCapitalize={maiusculaInicial}
        onSubmitEditing={aoEnviar}
        returnKeyType={aoEnviar ? 'done' : 'default'}
        style={{
          minHeight: multilinha ? 96 : tema.toque.principal,
          borderWidth: 1,
          borderColor: erro ? tema.cores.divida : tema.cores.bordaForte,
          borderRadius: tema.raio.md,
          paddingHorizontal: tema.espaco.lg,
          paddingVertical: tema.espaco.md,
          fontSize: tema.fonte.corpo,
          color: tema.cores.texto,
          backgroundColor: tema.cores.fundo,
          textAlignVertical: multilinha ? 'top' : 'center',
        }}
      />

      {erro != null && erro !== '' && (
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erro}</Text>
      )}
    </View>
  );
}
