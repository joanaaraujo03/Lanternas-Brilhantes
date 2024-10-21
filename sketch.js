//VARIÁVEIS

let capture; // captura de vídeo.
let w = 800;
let h = 600;
let clearButton;
let startButton;
let showCanvas = false; // inicialmente n aparece
let trailPoints = []; // armazenar posição para traços
let brightnessThreshold = 200; // o brilho mínimo necessário 
let previousPixels = []; // comparar o movimento anterior c/ atual
let paintingActive = true; // Para controlar se a pintura está ativa

let toggleButton;

let brushColor; // Variável para a cor do pincel

let lastMovementTime = 0; // detetar a última vez que o movimento foi detectado

let previousPosition = { x: 0, y: 0 }; // Para comparar o movimento anterior com o atual

// Sons para movimentos
let upSound, downSound, leftSound, rightSound;

//carregar sons que serão usados
function preload() {
    upSound = loadSound('up.mp3');
    downSound = loadSound('down.mp3');
    leftSound = loadSound('left.mp3');
    rightSound = loadSound('right.mp3');
}

//Iniciar o canva
function setup() {
    createCanvas(w, h);
    capture = createCapture(VIDEO, () => {
        console.log('Capture ready.');
    });
    capture.size(w, h);
    capture.hide();

    // botão de início
    startButton = createButton('Já liguei');
startButton.class('start-button'); 
startButton.position((windowWidth - startButton.width) / 2, windowHeight / 2);

    startButton.mousePressed(startDrawing);

    //botão de limpar tela
    clearButton = createButton('Limpar Tela');
    clearButton.position(10, 50);
    clearButton.mousePressed(clearCanvas);
    clearButton.hide(); // Esconder inicialmente

    // Criar botão de alternar pintura
    toggleButton = createButton('Parar Pintura');
    toggleButton.position(10, 90);
    toggleButton.mousePressed(togglePainting);
    toggleButton.hide(); // n aparece inicialmente
}

//quando Já liguei" é pressionado.
function startDrawing() {
    startButton.hide(); // Esconder o botão de início
    clearButton.show(); // Mostrar botão de limpar
    toggleButton.show(); // Mostrar botão toggle
    showCanvas = true;
}

//para limpar a tela
function clearCanvas() {
    trailPoints = []; // Limpar
    background(255); // Limpar a tela para branco
    stopSounds(); // Parar sons
}

//lógica do botão toggle
function togglePainting() {
    paintingActive = !paintingActive; // Alternar o estado da pintura
    toggleButton.html(paintingActive ? 'Parar Pintura' : 'Retomar Pintura'); // Mudar o texto do botão
    if (!paintingActive) {
        stopSounds(); // Parar todos os sons ao parar a pintura
    }
}

// para sons
function stopSounds() {
    // Parar todos os sons
    upSound.stop();
    downSound.stop();
    leftSound.stop();
    rightSound.stop();
}

//mostra as pinceladas
function draw() {
    if (showCanvas) {
        image(capture, 0, 0, w, h); // Exibir frame da câmara
        capture.loadPixels();
        
        if (capture.pixels.length > 0) { // Garantir que há pixels para processar
            let brightest = findBrightest(capture); // Encontrar o ponto mais brilhante

            // Desenhar o traço do movimento apenas se o brilho estiver acima do limite minimo e se a pintura estiver ativa
            if (brightest.brightness >= brightnessThreshold && paintingActive) {
                trailPoints.push(brightest.position); // guarda no array a posição

                if (trailPoints.length > 100) { // Limitar o tamanho do traço
                    trailPoints.shift();
                }
                
                // Desenhar o traço com um estilo aleatório
                drawTrail();
            }
        }

        // Detectar movimento 
        detectMovement();

        // Desenhar  pinceladas
        drawTrail(); // Sempre desenhar as pinceladas, independentemente do estado da pintura
      
    } else {
        background(255); 
        fill(0);
        textSize(16); // Ajustar o tamanho do texto
        textAlign(CENTER, CENTER);
        text("Ligue a lanterna do telemóvel e desfrute!", w / 2, h / 2 - 30);
    }
}

//percorre os pixeis para encontrar o mais brilhante aka ver onde está a lanterna
function findBrightest(video) {
    let brightestValue = 0; // começa no 0 para indicar que não há nenhum pixel brilhante
  
    let brightestPosition = { x: 0, y: 0 }; 
  
    let pixels = video.pixels;
    let i = 0; // Passar por todos os pixels capturados

  //ALTURA
    for (let y = 0; y < h; y++) {
      
      //largura
        for (let x = 0; x < w; x++) {
            let r = pixels[i++];
            let g = pixels[i++];
            let b = pixels[i++];
            i++; // Ignorar alfa
            let brightness = 0.3 * r + 0.59 * g + 0.11 * b; // Fórmula de luminosidade- com base nos componentes de cor vermelho (R), verde (G) e azul (B)

          // se a luminosidade encontrada for maior que o valor encontrado até ent
            if (brightness > brightestValue) {
                brightestValue = brightness; //atualiza para o novo valor
              
                brightestPosition = { x: x, y: y }; // Atualizar a posição
            }
        }
    }

    // Verificar a direção do movimento e tocar som apenas se a pintura estiver ativa
    if (paintingActive) {
        detectDirection(previousPosition, brightestPosition);
    }

    // Atualizar a posição anterior
    previousPosition = brightestPosition;
    
    return { position: brightestPosition, brightness: brightestValue }; // return tanto a posição como o brilho
}


//detetar a direção do movimento
function detectDirection(prev, curr) {
  
  // Cálculo das diferenças nas coordenadas x e y
    let dx = curr.x - prev.x; //movimento na horinzontal
    let dy = curr.y - prev.y; //movimento na vertical

  //abs- math.abs devolve o valor absoluto das diferenças calculadas
    if (abs(dx) > abs(dy)) { // Movimento horizontal
        if (dx > 10) {
            rightSound.play(); // Movimento para a direita
        } else if (dx < -10) {
            leftSound.play(); // Movimento para a esquerda
        }
    } else { // Movimento vertical
        if (dy > 10) {
            downSound.play(); // Movimento para baixo
        } else if (dy < -10) {
            upSound.play(); // Movimento para cima
        }
    }
}

// desenhar as pinceladas
function drawTrail() {
    let shapeType = floor(random(3)); // Escolher entre 3 tipos de formas
    brushColor = generateRandomColor(); //  cor aleatória para o pincel
    stroke(brushColor);
    strokeWeight(5);
    noFill();

    switch (shapeType) {
        case 0: // Linha
            beginShape();
            for (let p of trailPoints) {
                vertex(p.x, p.y);
            }
            endShape();
            break;
        case 1: // Círculo
            for (let p of trailPoints) {
                ellipse(p.x, p.y, random(10, 30)); // Tamanho aleatório
            }
            break;
        case 2: // Estrela 
            for (let p of trailPoints) {
                drawStar(p.x, p.y, random(10, 20), random(5, 10), 5); // Forma de estrela
            }
            break;
    }
}

//desenhar estrelas 
function drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape(); //começa a formar a estrela
  
  // loop para percorrer varios ângulos
    for (let a = 0; a < TWO_PI ; a += angle) {
      
        let sx = x + cos(a) * radius2; // Ponto externo
        let sy = y + sin(a) * radius2; // Ponto externo
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1; // Ponto interno
        sy = y + sin(a + halfAngle) * radius1; //// Ponto interno
        vertex(sx, sy);
    }
    endShape(CLOSE); //une os pontos para fechar a estrela
}

// detetar movimento
function detectMovement() {
    // Comparar a captura atual com a captura anterior
  
  //se pixel estiver a 0 é pq é o primeiro movimento
    if (previousPixels.length === 0) {
        previousPixels = capture.pixels.slice(); // Inicializar na primeira execução
        return;
    }

    let movementDetected = false; // serve para saber se algum movimento foi detetado.

  //calcula o brilho atual e o brilho anterior 
    for (let i = 0; i < capture.pixels.length; i += 4) {
        let currentBrightness = 0.3 * capture.pixels[i] + 0.59 * capture.pixels[i + 1] + 0.11 * capture.pixels[i + 2];
        let previousBrightness = 0.3 * previousPixels[i] + 0.59 * previousPixels[i + 1] + 0.11 * previousPixels[i + 2];

      //Se a diferença for maior que 50, significa que houve uma mudança significativa de brilho,
      
        if (abs(currentBrightness - previousBrightness) > 50) { // Limiar de detecção de movimento
            movementDetected = true; // passa a vdd
            break;
        }
    }

    if (movementDetected) {
        lastMovementTime = millis(); // Atualizar o tempo da última detecção de movimento
        brushColor = generateRandomColor(); // Mudar a cor aleatoriamente
    }

    // Armazena a captura atual 
    previousPixels = capture.pixels.slice();
}

//alterar a cor do pincel aleatoriamente
function generateRandomColor() {
    return color(random(255), random(255), random(255)); // cor aleatória
}
