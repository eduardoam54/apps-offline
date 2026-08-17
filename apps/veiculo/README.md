# Veículo — Manutenção e abastecimento

**Status:** MVP completo (fases 0–6) · **Ordem:** 3º app a ser desenvolvido

Registro de manutenção, abastecimento e documentos do veículo, com alertas por
quilometragem.

## Público

Motorista de aplicativo, dono de frota pequena (2 a 5 carros), motociclista,
entusiasta que cuida do próprio carro.

## Proposta

Saber quando trocar o óleo pelo **km rodado**, não pela data — que é como manutenção
de verdade funciona. E saber quanto o carro realmente consome e custa.

## MVP (v1)

- Cadastro de veículo: apelido, placa, marca/modelo, km atual.
- Abastecimento: litros, valor, km, tanque cheio ou parcial.
- Cálculo automático de consumo médio (km/l) e custo por km.
- Manutenções: tipo, km, valor, oficina, observação.
- Alertas por quilometragem (ex.: óleo a cada 10.000 km) **e** por data
  (IPVA, seguro, licenciamento).
- Histórico completo e gasto total acumulado.

## Fora do escopo da v1

Integração com OBD2, preço de combustível online, localização de posto, controle de
corridas e ganhos de motorista de app, multas.

## Modelo de dados

```
veiculo        id · apelido · placa · marca_modelo · km_atual · criado_em
abastecimento  id · veiculo_id · data · km · litros · valor_total_centavos
               · tanque_cheio · criado_em
manutencao     id · veiculo_id · data · km · tipo · valor_centavos
               · oficina · observacao
lembrete       id · veiculo_id · tipo · km_alvo · data_alvo · concluido
```

Consumo médio só é calculado entre **dois abastecimentos de tanque cheio** — é a
única forma de o número ser confiável. Abastecimento parcial entra no custo, mas
não no cálculo de km/l.

Valores em centavos, inteiro.

## Monetização

Gratuito: 1 veículo, histórico completo, todos os alertas.

Pago (vitalício): múltiplos veículos, relatório de custos em PDF, backup.

O limite por veículo é natural e não frustra — quem tem um carro só usa o app
inteiro de graça e vira divulgador. Quem tem frota paga sem reclamar.

## Nota

Este app **não compartilha** a entidade `cliente` com os outros dois. Ele aproveita
a infraestrutura (banco, design, paywall, build), não o domínio. Por isso vem por
último: quando chegar a vez dele, toda essa base já estará madura e testada em
produção.
