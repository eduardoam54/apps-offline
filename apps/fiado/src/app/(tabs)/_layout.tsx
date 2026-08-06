import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTema } from '@repo/ui';
import { Tabs } from 'expo-router';

export default function LayoutAbas() {
  const tema = useTema();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tema.cores.primaria },
        headerTintColor: tema.cores.textoInverso,
        headerTitleStyle: { fontWeight: tema.peso.forte, fontSize: tema.fonte.subtitulo },
        tabBarActiveTintColor: tema.cores.primaria,
        tabBarInactiveTintColor: tema.cores.textoFraco,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: tema.fonte.micro, fontWeight: tema.peso.medio },
        sceneStyle: { backgroundColor: tema.cores.superficie },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
