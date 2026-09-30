# 🕯️ The Black Residence — 2D Survival Horror

Um jogo de survival horror 2D top-down desenvolvido em **JavaScript puro (ES Modules) e HTML5 Canvas**, com renderização modular, sistema de iluminação dinâmica com cone de lanterna e escuridão global, inteligência artificial com máquina de estados (FSM) e áudio procedural gerado em tempo real via Web Audio API.

---

## 🎮 Mecânicas do Jogo

- **Sistema de Mapa em Grid (Matriz 24x18):**
  - Residência fechada composta por diferentes cômodos (foyer, biblioteca, aposento principal, sala e porão).
  - Paredes e mobílias com colisão física sólida contínua (com deslizamento suave nos eixos X e Y).

- **Iluminação Global & Lanterna Dinâmica:**
  - Tela totalmente imersa na escuridão negra com recorte dinâmico via `destination-out`.
  - Aura de visão ambiente de 360° ao redor do sobrevivente.
  - Cone de lanterna direcional com micro-oscilações de bateria e partículas de poeira suspensas no ar.
  - Olhos vermelhos da criatura cortam a escuridão.

- **Inteligência Artificial do Inimigo (Máquina de Estados FSM):**
  - **`Espera`**: Patrulha em velocidade reduzida pelos cômodos da mansão com olhos em tom âmbar.
  - **`Perseguição`**: Dispara se o sobrevivente entrar no raio de visão (Raycast com linha de visão direta), se aproximar demais ou correr nos tablados. Aumenta a velocidade, emite guincho e busca o jogador implacavelmente.
  - **`Atordoado`**: Ao ser atingido por 3 tiros do revólver, o monstro fica completamente paralisado (`speed = 0`) por 6 segundos com olhos apagados e estrelas giratórias, permitindo que o jogador escape em segurança!

- **Sistema de Armamento & Combate:**
  - **Revólver .38**: Localizado no aposento a leste da residência (com 6 projéteis).
  - **Caixas de Munição**: Espalhadas pela residência para recarregar.
  - **Balística & Impacto**: Projéteis com rastro luminoso, faíscas em paredes e névoa/sangue ao atingir a criatura.
  - **Clarão do Disparo (Muzzle Flash)**: Ilumina instantaneamente a sala escura no momento de cada tiro.

- **Objetivo & Escape:**
  - 3 chaves douradas antigas espalhadas pelos cantos da residência.
  - Ao reunir as 3 chaves, o portão de ferro ao norte é destrancado para o escape final.

- **Modo Administrador (Debug do Mapa):**
  - Botão no cabeçalho ou tecla **`L`** para acender todas as luzes da residência instantaneamente e exibir o anel de alcance e estado da IA do inimigo.

---

## 🕹️ Controles

| Tecla / Ação | Função |
| :--- | :--- |
| **W, A, S, D** ou **Setas** | Movimentação em 4 direções |
| **Mouse** / **Movimento** | Direcionar feixe da lanterna e mira |
| **Clique Esquerdo** / **Espaço** | Atirar (3 tiros paralisam o monstro) |
| **Shift** | Correr (consome fôlego e faz ruído) |
| **L** | Modo Administrador (Ligar/Desligar Luzes) |
| **R** | Reiniciar partida após vitória ou morte |

---

## 🚀 Como Executar Localmente

Como o projeto utiliza **JavaScript puro e Canvas**, não há necessidade de etapa de compilação ou build:

1. Clone o repositório:
```bash
git clone https://github.com/SEU-USUARIO/survival-horror-2d.git
cd survival-horror-2d
```

2. Inicie qualquer servidor estático local:
```bash
# Com Python:
python -m http.server 3000

# Ou com Node.js / npx:
npx serve . -p 3000
```

3. Abra seu navegador em:
```
http://localhost:3000
```

---

## 📁 Estrutura de Arquivos

```
SurvivalGame/
├── index.html          # Marcação semântica, HUD e telas de início/derrota/vitória
├── style.css           # Tema escuro atmosférico com tipografia Cinzel e Syne
├── package.json        # Configuração de ES Modules ("type": "module")
├── .gitignore          # Arquivos ignorados pelo Git
├── README.md           # Documentação completa do projeto
└── src/
    ├── main.js         # Loop principal, input manager e integração do jogo
    ├── map.js          # Matriz do mapa, colisões e raycasting de linha de visão
    ├── player.js       # Entidade do jogador, movimentação e inventário
    ├── enemy.js        # IA com máquina de estados ('Espera' e 'Perseguição')
    ├── lighting.js     # Sistema de escuridão e iluminação por lanterna
    └── audio.js        # Sintetizador procedural de áudio (Web Audio API)
```

---

## 📜 Licença

Distribuído sob a licença MIT.
