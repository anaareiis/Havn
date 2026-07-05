# Havn

Havn é um app de finanças pessoais construído com [Expo](https://expo.dev) e TypeScript.

## Conceitos

- **Âncoras** — assinaturas e contas fixas recorrentes.
- **Maré** — sincronização offline-first dos dados locais com o backend.
- **Porto** — segurança do app (PIN e biometria).

## Stack

- [Expo](https://expo.dev) (React Native)
- TypeScript
- ESLint (`eslint-config-expo`) + Prettier

## Estrutura do projeto

```
.
├── App.tsx           # Ponto de entrada do app
├── index.ts          # Registro do componente raiz (Expo)
└── src/
    ├── screens/      # Telas do app
    ├── components/   # Componentes reutilizáveis
    ├── lib/          # Lógica de negócio, serviços e integrações
    └── hooks/        # Hooks customizados
```

## Como rodar

Instale as dependências:

```bash
npm install
```

Inicie o projeto:

```bash
npm start
```

Abra o app no [Expo Go](https://expo.dev/go) escaneando o QR code, ou rode diretamente em um emulador:

```bash
npm run android
npm run ios
npm run web
```

## Qualidade de código

```bash
npm run lint           # ESLint
npm run format         # Formata com Prettier
npm run format:check   # Verifica formatação sem alterar arquivos
```
