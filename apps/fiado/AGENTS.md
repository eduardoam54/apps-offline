# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

Este projeto usa Expo SDK 57 / React Native 0.86. Duas diferencas que ja
custaram tempo aqui:

- as rotas ficam em `src/app`, nao em `app`
- `<Tabs>` do `expo-router` continua sendo a API estavel; `NativeTabs`
  (`expo-router/unstable-native-tabs`) vem no template mas e instavel e nao e
  usada neste app

As convencoes do projeto — dinheiro em centavos, saldo derivado, soft delete,
armadilhas do monorepo — estao no `CLAUDE.md` da raiz.
