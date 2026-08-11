import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTema } from '@repo/ui';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function LayoutAbas() {
  const tema = useTema();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tema.cores.primaria },
        headerTintColor: tema.cores.textoInverso,
        headerTitleStyle: { fontWeight: tema.peso.forte, fontSize: tema.fonte.subtitulo },
        tabBarActiveTintColor: tema.cores.primaria,
        tabBarInactiveTintColor: tema.cores.textoFraco,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: tema.cores.superficieElevada,
          borderTopColor: tema.cores.borda,
        },
        tabBarLabelStyle: { fontSize: tema.fonte.micro, fontWeight: tema.peso.medio },
        sceneStyle: { backgroundColor: tema.cores.superficie },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.orcamentos'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="description" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: t('tab.clientes'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: t('tab.ajustes'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
