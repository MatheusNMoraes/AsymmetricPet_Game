# AsymmetricPet_Game

## Estrutura

- `index.html`: estrutura da página e ponto de entrada do jogo.
- `css/game.css`: estilos da página e da interface.
- `js/game.js`: lógica do jogo.
- `assets/images/`: imagens originais.
- `assets/images/optimized/`: versões menores usadas pelo jogo.
- `assets/audio/`: efeitos sonoros e som ambiente.

Abra `index.html` no navegador para jogar.

As imagens otimizadas têm dimensões adequadas ao tamanho em que aparecem no jogo.
Se uma imagem original for atualizada, gere novamente sua versão em `optimized/`
antes de alterar as referências do jogo.

Os arquivos de áudio usam carregamento sob demanda; o som ambiente só começa
quando a partida é iniciada. Na hospedagem, configure cache para os arquivos de
`assets/` e compressão Brotli ou gzip para HTML, CSS e JavaScript. As regras
específicas dependem do serviço usado para publicar o site.