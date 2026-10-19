# Xadrez 3D ♟️

Um jogo de xadrez em três dimensões desenvolvido com **JavaScript**, **Three.js** e **chess.js**. O projeto reúne um tabuleiro 3D interativo, uma interface monocromática e modos de partida para jogar com outra pessoa ou contra o computador.

##Link do jogo

https://sophialilithlima-crypto.github.io/Xadrez/

## Sobre o projeto

O **Xadrez 3D** foi criado como um projeto de estudo de desenvolvimento web, com foco em gráficos 3D, interação com o usuário, lógica de jogos e publicação de aplicações no GitHub Pages.

A proposta é combinar a experiência visual de um tabuleiro tridimensional com a validação das regras tradicionais do xadrez. O design utiliza preto, branco e tons de cinza para manter o contraste e deixar o tabuleiro como elemento central da interface.

## Funcionalidades

- **Tabuleiro tridimensional:** cena renderizada com Three.js, com perspectiva, iluminação, materiais e moldura.
- **Design monocromático:** interface em preto, branco e tons de cinza.
- **Dois modos de jogo:** partida local para duas pessoas no mesmo dispositivo ou partida contra o computador.
- **Três níveis de dificuldade:** iniciante, intermediário e avançado.
- **Movimentos legais destacados:** ao selecionar uma peça, o jogo indica as casas para as quais ela pode se mover e diferencia as possibilidades de captura.
- **Última jogada destacada:** ajuda a acompanhar o andamento da partida.
- **Histórico de movimentos:** permite acompanhar as jogadas realizadas.
- **Manual integrado:** apresenta as peças, seus movimentos e regras importantes.
- **Promoção de peão:** permite escolher a peça para a qual o peão será promovido ao alcançar a última fileira.
- **Reinício da partida:** permite começar um novo jogo.
- **Opção de desfazer:** no modo contra o computador, a opção respeita o fluxo de turnos e fica disponível antes da resposta do computador.
- **Publicação automatizada:** workflow do GitHub Actions preparado para compilar e publicar o projeto no GitHub Pages.

## Tecnologias utilizadas

| Tecnologia | Aplicação no projeto |
| --- | --- |
| [JavaScript](https://developer.mozilla.org/docs/Web/JavaScript) | Lógica do jogo, eventos e interação com o usuário |
| [Three.js](https://threejs.org/) | Criação e renderização do tabuleiro e das peças em 3D |
| [chess.js](https://github.com/jhlywa/chess.js) | Validação de movimentos e regras do xadrez |
| [Vite](https://vite.dev/) | Servidor de desenvolvimento e compilação para produção |
| HTML5 | Estrutura da página |
| CSS3 | Estilização da interface e adaptação a diferentes telas |
| [GitHub Actions](https://github.com/features/actions) | Automação da publicação no GitHub Pages |

## Como jogar

1. Abra o jogo e escolha um modo de partida.
2. Se escolher jogar contra o computador, selecione um nível de dificuldade.
3. Clique em uma peça para selecioná-la.
4. Observe as casas destacadas para identificar os movimentos legais.
5. Clique na casa de destino para realizar a jogada.
6. Continue até que a partida termine ou inicie uma nova partida.

No xadrez tradicional, **as peças brancas sempre fazem o primeiro movimento**. O objetivo é dar xeque-mate no rei adversário.

### Modos de jogo

- **Duas pessoas:** duas pessoas jogam alternadamente no mesmo dispositivo.
- **Contra o computador:** a pessoa joga com as peças brancas e o computador joga com as peças pretas.

### Níveis de dificuldade

- **Iniciante:** utiliza escolhas mais simples e imprevisíveis.
- **Intermediário:** considera mais possibilidades antes de escolher uma jogada.
- **Avançado:** realiza uma busca mais profunda e avalia melhor a posição.

A inteligência artificial é uma implementação simples de busca e avaliação para este projeto. Ela **não é um motor profissional de xadrez** e não pretende substituir ferramentas especializadas, como o Stockfish.

## Regras de xadrez

O projeto utiliza a biblioteca `chess.js` para validar as jogadas de acordo com as regras do xadrez. Isso inclui movimentos legais, alternância de turnos e a restrição de jogadas que deixariam o próprio rei em xeque. Também são contempladas regras especiais, como:

- **Roque:** movimento especial realizado entre o rei e uma torre, quando as condições necessárias são atendidas.
- **En passant:** captura especial de peão que só pode ser feita imediatamente após determinado avanço de um peão adversário.
- **Promoção:** quando um peão alcança a última fileira, deve ser promovido a dama, torre, bispo ou cavalo.
- **Xeque-mate:** situação em que o rei está em xeque e não existe uma jogada legal para escapar.
- **Afogamento:** situação de empate em que o jogador da vez não está em xeque, mas não possui movimentos legais.
- **Empates previstos pelas regras:** incluindo condições como repetição de posição e material insuficiente, conforme reconhecidas pela biblioteca.

O manual disponível dentro do jogo apresenta uma introdução às peças e às regras básicas.

## Executar o projeto localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado — o npm é incluído com ele.
- [Git](https://git-scm.com/), caso queira clonar o repositório pelo terminal.
- Um navegador moderno compatível com WebGL para visualizar a cena 3D.

### 1. Clonar o repositório

```bash
git clone https://github.com/sophialilithlima-crypto/Xadrez.git
cd Xadrez
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O Vite mostrará um endereço local no terminal. Abra o endereço informado; normalmente é `http://localhost:5173/`.

### 4. Criar a versão de produção

Para compilar o projeto:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

Para testar a versão compilada localmente:

```bash
npm run preview
```

## Estrutura do projeto

```text
Xadrez/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
└── LICENSE
```

### Principais arquivos

- `src/main.js`: inicializa a cena 3D, cria o tabuleiro e as peças, trata as interações, gerencia os modos de jogo e integra a lógica de xadrez.
- `src/style.css`: define a aparência da interface e seus ajustes para diferentes tamanhos de tela.
- `index.html`: documento HTML de entrada da aplicação.
- `package.json`: lista as dependências e os comandos disponíveis.
- `vite.config.js`: configura o Vite e o caminho-base utilizado na publicação.
- `.github/workflows/deploy.yml`: define as etapas automatizadas de compilação e publicação no GitHub Pages.
- `LICENSE`: contém os termos de licença mantidos no repositório.

## Objetivos de aprendizagem

Este projeto permite praticar conceitos de:

- programação com JavaScript;
- criação de cenas e objetos tridimensionais com Three.js;
- eventos e interação entre usuário e objetos 3D;
- integração de bibliotecas externas;
- organização de um projeto web;
- lógica de jogos baseados em turnos;
- controle de versão com Git e GitHub;
- automação de build e deploy com GitHub Actions.

## Possíveis melhorias futuras

- animações mais elaboradas para movimentos e capturas;
- efeitos sonoros opcionais;
- relógio de xadrez configurável;
- controles adicionais de câmera e acessibilidade;
- integração com um motor de xadrez especializado para partidas mais desafiadoras.

## Licença

Este projeto mantém a licença MIT presente no repositório. Consulte o arquivo [`LICENSE`](LICENSE) para ler os termos completos.

---

Desenvolvido como projeto pessoal de estudo de programação e desenvolvimento web 3D.
