import { backupVeiculoLiberado } from '@repo/core';
import { Botao, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLicenca } from '@/licenca';

export default function TelaAjustes() {
  const tema = useTema();
  const { t } = useTranslation();
  const plano = useLicenca((e) => e.plano);

  function aoTocarBackup() {
    router.push('/backup');
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      <Botao
        titulo={t('ajustes.backupRestauracao')}
        variante="secundario"
        aoTocar={aoTocarBackup}
      />

      <Botao
        titulo={t('ajustes.travaDoApp')}
        variante="secundario"
        aoTocar={() => router.push('/seguranca')}
      />

      <Botao
        titulo={t('ajustes.verPlano')}
        variante="texto"
        aoTocar={() => router.push('/plano')}
      />
    </ScrollView>
  );
}
