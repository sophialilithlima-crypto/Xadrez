# Xadrez 3D

Jogo de xadrez em 3D feito com Three.js e `chess.js`.

## Funcionalidades

- Partida local para duas pessoas no mesmo dispositivo.
- Partida contra o computador nos níveis iniciante, intermediário e avançado.
- Validação dos movimentos pelas regras de xadrez usando `chess.js`.
- Destaque de movimentos legais, histórico, manual e reinício de partida.
- Opção de desfazer no modo contra o robô limitada ao intervalo antes da resposta do computador, para não desfazer uma jogada do robô.

## Executar no computador

Requer Node.js instalado.

```bash
npm install
npm run dev
```

Abra o endereço local que o Vite mostrar no terminal.

Para testar a compilação de produção:

```bash
npm run build
npm run preview
```

## Publicar no GitHub Pages

1. Confira que o repositório se chama exatamente `Xadrez` e que a branch principal é `main`.
2. Mantenha no repositório o `LICENSE` MIT que já existe nele. Este pacote não inclui um arquivo `LICENSE` para não substituir o original.
3. Copie os arquivos deste pacote para a raiz do seu repositório, mesclando as pastas e substituindo somente os arquivos correspondentes. Não apague o `LICENSE`.
4. Envie as alterações para o GitHub na branch `main`.
5. Em **Settings → Pages**, selecione a publicação por **GitHub Actions**, se essa opção ainda não estiver definida.
6. Abra a aba **Actions** e verifique se o workflow “Publicar Xadrez 3D no GitHub Pages” terminou com sucesso.

Como o repositório esperado é `Xadrez`, o Vite está configurado com `base: '/Xadrez/'`. Caso o nome do repositório mude, esse caminho também precisará mudar.

## Observação sobre a IA

Os níveis usam estratégias progressivamente mais cuidadosas, com busca e avaliação material/posicional nos níveis superiores. Isso é uma IA simples de jogo, não um motor profissional como Stockfish.

## Atualização visual

Esta versão inclui tema verde-floresta/marfim/dourado, melhorias visuais no tabuleiro e nos painéis, animação de movimento, sons opcionais, destaque de xeque e última jogada, histórico reorganizado, rotação do tabuleiro e alternância de qualidade gráfica. Consulte `MELHORIAS-DE-DESIGN.txt` para ver as mudanças e as instruções de execução.
