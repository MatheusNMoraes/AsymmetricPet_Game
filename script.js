
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const shirtsValue = document.getElementById('shirtsValue');
        const heightValue = document.getElementById('heightValue');
        const shirtProgress = document.getElementById('shirtProgress');
        const progressBar = shirtProgress.parentElement;
        const controlsHint = document.getElementById('controlsHint');
        const collectToast = document.getElementById('collectToast');
        const endScreen = document.getElementById('endScreen');
        const endTitle = document.getElementById('endTitle');
        const endMessage = document.getElementById('endMessage');
        const finalScore = document.getElementById('finalScore');
        const restartButton = document.getElementById('restartButton');
        const menuScreen = document.getElementById('menuScreen');
        const startButton = document.getElementById('startButton');
        let controlsHintTimeout = null;
        let previousEndState = false;
        let isGameStarted = false;

        const dogJumpImg = new Image();
        dogJumpImg.src = 'img/dog-pulando.png'; 

        const dogFallImg = new Image();
        dogFallImg.src = 'img/dog-decendo.png';

        const dogLeftImg = new Image();
        dogLeftImg.src = 'img/dog-left.png'; 

        const dogRightImg = new Image();
        dogRightImg.src = 'img/dog-right.png';

        const shirtImages = [
            'img/camiseta.png',
            'img/camiseta-cavera.png',
            'img/camisetaArmadillosB.png'
        ].map(src => {
            const image = new Image();
            image.src = src;
            image.onerror = () => console.error(`Não foi possível carregar o modelo de camiseta: ${src}`);
            return image;
        });

        const player = {
            x: 0,
            y: 0,
            radius: 24,
            vy: 0,
            vx: 0,
            speed: 5.5,
            gravity: 0.4,
            jumpForce: -12.5,
            facing: 'right' 
        };

        let score = 0;
        let shirtsCollected = 0;
        const TOTAL_SHIRTS = 6;
        let isGameOver = false;
        let isWin = false;

        const platformWidth = 75;
        const platformHeight = 15;
        const shirtWidth = 40;
        const shirtHeight = 32;
        let platforms = [];
        let shirts = [];
        let totalPlatformsCreated = 0;

        const keys = { left: false, right: false };

        window.addEventListener('keydown', (e) => {
            if (isGameOver || isWin) {
                if (e.target === restartButton) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    initGame();
                }
                return;
            }

            if (!isGameStarted) {
                if (e.target === startButton) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    initGame();
                }
                return;
            }

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
            }

            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = true;
                hideControlsHint();
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = true;
                hideControlsHint();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
        });

        function handleTouch(x) {
            hideControlsHint();
            if (isGameOver || isWin) {
                initGame();
                return;
            }
            if (x < canvas.width / 2) {
                keys.left = true;
                keys.right = false;
            } else {
                keys.right = true;
                keys.left = false;
            }
        }

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touchX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
            handleTouch(touchX);
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys.left = false;
            keys.right = false;
        });

        canvas.addEventListener('mousedown', () => {
            hideControlsHint();
        });

        function hideControlsHint() {
            controlsHint.hidden = true;
            window.clearTimeout(controlsHintTimeout);
        }

        function showControlsHint() {
            controlsHint.hidden = false;
            window.clearTimeout(controlsHintTimeout);
            controlsHintTimeout = window.setTimeout(hideControlsHint, 5000);
        }

        function showCollectionFeedback() {
            collectToast.hidden = false;
            collectToast.classList.remove('is-visible');
            void collectToast.offsetWidth;
            collectToast.classList.add('is-visible');
        }

        collectToast.addEventListener('animationend', () => {
            collectToast.hidden = true;
            collectToast.classList.remove('is-visible');
        });

        restartButton.addEventListener('click', initGame);
        startButton.addEventListener('click', initGame);

        function createPlatform(yPosition, referencePlatform) {
            let x = Math.random() * (canvas.width - platformWidth);
            if (referencePlatform) {
                const verticalGap = referencePlatform.y - yPosition;
                const discriminant = player.jumpForce ** 2 - 2 * player.gravity * verticalGap;
                const timeToLand = discriminant > 0
                    ? (-player.jumpForce + Math.sqrt(discriminant)) / player.gravity
                    : 0;
                const maxDistance = player.speed * timeToLand + player.radius + platformWidth / 2;
                const referenceCenter = referencePlatform.x + platformWidth / 2;
                const reachablePositions = [];

                for (let candidate = 0; candidate <= canvas.width - platformWidth; candidate += 1) {
                    const candidateCenter = candidate + platformWidth / 2;
                    const directDistance = Math.abs(candidateCenter - referenceCenter);
                    const wrappedDistance = canvas.width - directDistance;
                    if (Math.min(directDistance, wrappedDistance) <= maxDistance) {
                        reachablePositions.push(candidate);
                    }
                }

                if (reachablePositions.length > 0) {
                    x = reachablePositions[Math.floor(Math.random() * reachablePositions.length)];
                } else {
                    x = referencePlatform.x;
                }
            }

            const rand = Math.random();
            let type = 'normal';

            if (score > 250) {
                if (rand < 0.22) type = 'moving';
                else if (rand < 0.40) type = 'broken';
            }

            const newPlat = {
                x: x,
                y: yPosition,
                type: type,
                vx: type === 'moving' ? (Math.random() < 0.5 ? 2 : -2) : 0,
                broken: false
            };

            if (
                shirtsCollected + shirts.length < TOTAL_SHIRTS &&
                type === 'normal' &&
                totalPlatformsCreated % 5 === 0
            ) {
                const shirtImage = shirtImages[Math.floor(Math.random() * shirtImages.length)];
                shirts.push({
                    x: newPlat.x + platformWidth / 2 - shirtWidth / 2,
                    y: newPlat.y - shirtHeight - 2,
                    width: shirtWidth,
                    height: shirtHeight,
                    image: shirtImage,
                    platformRef: newPlat
                });
            }

            totalPlatformsCreated++;
            return newPlat;
        }

        function initGame() {
            isGameStarted = true;
            menuScreen.hidden = true;
            score = 0;
            shirtsCollected = 0;
            totalPlatformsCreated = 0;
            isGameOver = false;
            isWin = false;
            keys.left = false;
            keys.right = false;
            previousEndState = false;
            endScreen.hidden = true;
            collectToast.hidden = true;
            collectToast.classList.remove('is-visible');
            showControlsHint();

            player.x = canvas.width / 2;
            player.y = 400;
            player.vy = 0;
            player.vx = 0;

            platforms = [];
            shirts = [];

            const startingPlatform = {
                x: canvas.width / 2 - platformWidth / 2,
                y: 500,
                type: 'normal',
                vx: 0,
                broken: false
            };
            platforms.push(startingPlatform);

            let y = 420;
            while (y > 0) {
                y -= Math.random() * 40 + 55;
                const referencePlatform = platforms[platforms.length - 1];
                platforms.push(createPlatform(y, referencePlatform));
            }
        }

        function drawBackground() {
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, '#f2f0e9');
            grad.addColorStop(0.58, '#d7d4cb');
            grad.addColorStop(1, '#aaa79f');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const vignette = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                canvas.width * 0.2,
                canvas.width / 2,
                canvas.height / 2,
                canvas.height * 0.72
            );
            vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.16)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        function drawPlatforms() {
            platforms.forEach(plat => {
                if (plat.broken) return;

                if (plat.type === 'normal') {
                    ctx.fillStyle = '#171717';
                    ctx.strokeStyle = '#f4f1e8';
                } else if (plat.type === 'moving') {
                    ctx.fillStyle = '#f4f1e8';
                    ctx.strokeStyle = '#171717';
                } else if (plat.type === 'broken') {
                    ctx.fillStyle = '#77746e';
                    ctx.strokeStyle = '#171717';
                }

                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y, platformWidth, platformHeight, 6);
                ctx.fill();
                ctx.stroke();

                if (plat.type === 'broken') {
                    ctx.strokeStyle = '#f4f1e8';
                    ctx.beginPath();
                    ctx.moveTo(plat.x + 20, plat.y);
                    ctx.lineTo(plat.x + 35, plat.y + platformHeight);
                    ctx.stroke();
                }
            });
        }

        function drawShirts() {
            shirts.forEach(shirt => {
                if (shirt.image.complete && shirt.image.naturalWidth > 0) {
                    ctx.save();
                    ctx.filter = 'grayscale(1) contrast(1.1)';
                    ctx.drawImage(shirt.image, shirt.x, shirt.y, shirt.width, shirt.height);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#f4f1e8';
                    ctx.strokeStyle = '#171717';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(shirt.x, shirt.y, shirt.width, shirt.height - 5, 4);
                    ctx.fill();
                    ctx.stroke();
                }
            });
        }

    
        function drawPlayer() {
            const size = player.radius * 2.2;

            let currentImg = dogRightImg;
            if (player.vy < 0) {
                currentImg = dogJumpImg;
            } else if (player.vy > 0) {
                currentImg = dogFallImg;
            } else {
                currentImg = (player.facing === 'left') ? dogLeftImg : dogRightImg;
            }

            if (currentImg.complete && currentImg.width > 0) {
                ctx.save();
                ctx.drawImage(currentImg, player.x - player.radius, player.y - player.radius, size, size);
                ctx.restore();
            } else {
                ctx.fillStyle = '#171717';
                ctx.beginPath();
                ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function updateInterface() {
            const collected = `${shirtsCollected}/${TOTAL_SHIRTS}`;
            shirtsValue.textContent = collected;
            heightValue.textContent = Math.floor(score);
            shirtProgress.style.width = `${(shirtsCollected / TOTAL_SHIRTS) * 100}%`;
            progressBar.setAttribute('aria-valuenow', shirtsCollected);

            const isEnded = isGameOver || isWin;
            endScreen.hidden = !isEnded;
            if (!isEnded) {
                previousEndState = false;
                return;
            }

            endTitle.textContent = isWin ? 'Missão cumprida!' : 'Fim de jogo';
            endMessage.textContent = isWin
                ? `Você coletou as ${TOTAL_SHIRTS} camisetas!`
                : `Você coletou ${collected} camisetas.`;
            finalScore.textContent = Math.floor(score);

            if (!previousEndState) {
                restartButton.focus();
            }
            previousEndState = true;
        }

        function updatePlayer() {
            if (isGameOver || isWin) return;

            if (keys.left) {
                player.vx = -player.speed;
                player.facing = 'left';
            } else if (keys.right) {
                player.vx = player.speed;
                player.facing = 'right';
            } else {
                player.vx = 0;
            }

            player.x += player.vx;

            if (player.x + player.radius < 0) player.x = canvas.width + player.radius;
            else if (player.x - player.radius > canvas.width) player.x = -player.radius;

 
            player.vy += player.gravity;
            player.y += player.vy;


            platforms.forEach(plat => {
                if (plat.type === 'moving') {
                    plat.x += plat.vx;
                    if (plat.x <= 0 || plat.x + platformWidth >= canvas.width) {
                        plat.vx *= -1;
                    }
                }
            });

            shirts.forEach(shirt => {
                if (shirt.platformRef) {
                    shirt.x = shirt.platformRef.x + platformWidth / 2 - shirt.width / 2;
                }
            });

            if (player.y < canvas.height / 2 && player.vy < 0) {
                const diff = (canvas.height / 2) - player.y;
                player.y = canvas.height / 2;

                platforms.forEach(plat => plat.y += diff);
                shirts.forEach(shirt => shirt.y += diff);

                score += diff;
            }

            platforms = platforms.filter(plat => plat.y < canvas.height + 50);
            shirts = shirts.filter(shirt => shirt.y < canvas.height + 50);


            const highestPlatform = platforms.reduce(
                (highest, platform) => platform.y < highest.y ? platform : highest,
                platforms[0]
            );
            if (highestPlatform.y > 60) {
                const newY = highestPlatform.y - (Math.random() * 40 + 55);
                platforms.push(createPlatform(newY, highestPlatform));
            }

            if (player.vy > 0) {
                const landedPlatform = platforms.find(plat => {
                    if (plat.broken) return false;
                    const prevFootY = (player.y - player.vy) + player.radius;
                    const currentFootY = player.y + player.radius;

                    return (
                        player.x + player.radius * 0.5 > plat.x &&
                        player.x - player.radius * 0.5 < plat.x + platformWidth &&
                        prevFootY <= plat.y &&
                        currentFootY >= plat.y
                    );
                });

                if (landedPlatform) {
                    player.y = landedPlatform.y - player.radius;
                    player.vy = player.jumpForce;
                    if (landedPlatform.type === 'broken') {
                        landedPlatform.broken = true;
                    }
                }
            }

            shirts = shirts.filter(shirt => {
                const nearestX = Math.max(shirt.x, Math.min(player.x, shirt.x + shirt.width));
                const nearestY = Math.max(shirt.y, Math.min(player.y, shirt.y + shirt.height));
                const distX = player.x - nearestX;
                const distY = player.y - nearestY;

                if (distX * distX + distY * distY < player.radius ** 2) {
                    shirtsCollected++;
                    showCollectionFeedback();
                    if (shirtsCollected >= TOTAL_SHIRTS) {
                        isWin = true;
                    }
                    return false;
                }
                return true;
            });

            if (player.y - player.radius > canvas.height) {
                isGameOver = true;
            }
        }

        const FRAME_DURATION = 1000 / 60;
        let previousFrameTime = null;
        let timeAccumulator = 0;

        function gameLoop(timestamp) {
            const elapsed = previousFrameTime === null ? 0 : Math.min(timestamp - previousFrameTime, 100);
            previousFrameTime = timestamp;
            timeAccumulator += elapsed;

            while (timeAccumulator >= FRAME_DURATION) {
                if (isGameStarted) updatePlayer();
                timeAccumulator -= FRAME_DURATION;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawBackground();
            drawPlatforms();
            drawShirts();
            drawPlayer();
            updateInterface();

            requestAnimationFrame(gameLoop);
        }

        requestAnimationFrame(gameLoop);