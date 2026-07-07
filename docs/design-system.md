# Design system — Havn

Tokens em `src/theme/`, componentes base em `src/components/`. Tudo consumido via `useTheme()` (`src/theme/ThemeProvider.tsx`), que resolve light/dark a partir do esquema de cores do sistema (`useColorScheme`).

## Cores

Paleta bruta em `src/theme/colors.ts` (`palette`), semântica em `lightColors` / `darkColors`. Todos os pares texto/fundo abaixo atendem WCAG AA (4.5:1).

| Token           | Light     | Dark      | Uso                                   |
| --------------- | --------- | --------- | ------------------------------------- |
| `background`    | `#F6F8FB` | `#0B1520` | Fundo da tela                         |
| `surface`       | `#FFFFFF` | `#121F2E` | Cards, inputs                         |
| `surfaceAlt`    | `#E6F4FE` | `#08243D` | Realce sutil, badges neutras          |
| `border`        | `#E1E6EC` | `#223247` | Bordas de card/input                  |
| `textPrimary`   | `#0B1520` | `#F6F8FB` | Texto principal                       |
| `textSecondary` | `#5B6B7C` | `#93A5B8` | Texto de apoio, labels                |
| `primary`       | `#0F4C81` | `#4A9FDE` | Ações primárias (azul Havn)           |
| `accent`        | `#C79A45` | `#E0B563` | Destaques, CTAs secundários (dourado) |
| `success`       | `#2E9E6C` | `#4CC38A` | Valores positivos                     |
| `danger`        | `#D14343` | `#E5726B` | Valores negativos, erros              |

## Tipografia

Duas famílias, carregadas via `expo-font` em `App.tsx` (`fontsToLoad`, de `src/theme/typography.ts`):

- **Nunito** (arredondada) — todo texto de UI: títulos, labels, botões, corpo.
- **Space Grotesk** (algarismos tabulares) — qualquer número: saldos, valores de transação, datas em tabela. Garante alinhamento de dígitos em coluna.

```ts
theme.fontFamily.rounded.regular; // Nunito_400Regular
theme.fontFamily.rounded.semibold; // Nunito_600SemiBold
theme.fontFamily.rounded.bold; // Nunito_700Bold
theme.fontFamily.rounded.extrabold; // Nunito_800ExtraBold

theme.fontFamily.tabular.regular; // SpaceGrotesk_400Regular
theme.fontFamily.tabular.medium; // SpaceGrotesk_500Medium
theme.fontFamily.tabular.bold; // SpaceGrotesk_700Bold
```

Escala (`fontSize` / `lineHeight`): `xs 12/16`, `sm 14/20`, `md 16/24`, `lg 20/28`, `xl 24/32`, `xxl 32/40`, `display 40/48`.

## Espaçamento e raio

`src/theme/spacing.ts`, base 4px:

- `spacing`: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`, `xxxl 48`
- `radius`: `sm 6`, `md 10`, `lg 16`, `xl 24`, `full 999`

## Componentes base

Todos em `src/components/`, exportados de `src/components/index.ts`.

- **`Button`** — `variant`: `primary` | `accent` | `outline`; props `label`, `loading`, `disabled`.
- **`Card`** — container com `surface`, borda e `radius.lg`; aceita `style`/`children` como `View`.
- **`Input`** — `label` e `error` opcionais; borda muda de cor em foco/erro.
- **`Badge`** — `variant`: `neutral` | `success` | `danger` | `accent`; pílula com `label`.

Uso:

```tsx
import { Button, Card, Badge, Input } from '../components';
import { useTheme } from '../theme';

const theme = useTheme();
<Button label="Nova transação" variant="primary" onPress={...} />
```
