
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const dogJumpImg = new Image();
        dogJumpImg.src = 'img/dog-pulando.png'; 

        const dogLeftImg = new Image();
        dogLeftImg.src = 'img/dog-left.png'; 

        const dogRightImg = new Image();
        dogRightImg.src = 'img/dog-right.png';

        const shirtImg = new Image();
        shirtImg.src = 'img/camiseta.png';

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
        let platforms = [];
        let shirts = [];
        let totalPlatformsCreated = 0;

        const keys = { left: false, right: false };

        window.addEventListener('keydown', (e) => {
            if (isGameOver || isWin) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    initGame();
                }
                return;
            }

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
            }

            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
        });

        function handleTouch(x) {
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
            if (isGameOver || isWin) initGame();
        });

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
                shirts.push({
                    x: newPlat.x + platformWidth / 2 - 15,
                    y: newPlat.y - 32,
                    width: 30,
                    height: 30,
                    platformRef: newPlat
                });
            }

            totalPlatformsCreated++;
            return newPlat;
        }

        function initGame() {
            score = 0;
            shirtsCollected = 0;
            totalPlatformsCreated = 0;
            isGameOver = false;
            isWin = false;
            keys.left = false;
            keys.right = false;

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
            grad.addColorStop(0, '#eaecee');
            grad.addColorStop(1, '#000007');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        function drawPlatforms() {
            platforms.forEach(plat => {
                if (plat.broken) return;

                if (plat.type === 'normal') {
                    ctx.fillStyle = '#000000';
                    ctx.strokeStyle = '#ebebeb';
                } else if (plat.type === 'moving') {
                    ctx.fillStyle = '#ebeef0';
                    ctx.strokeStyle = '#111111';
                } else if (plat.type === 'broken') {
                    ctx.fillStyle = '#8b8b8b';
                    ctx.strokeStyle = '#f00909';
                }

                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(plat.x, plat.y, platformWidth, platformHeight, 6);
                ctx.fill();
                ctx.stroke();

                if (plat.type === 'broken') {
                    ctx.strokeStyle = '#95a5a6';
                    ctx.beginPath();
                    ctx.moveTo(plat.x + 20, plat.y);
                    ctx.lineTo(plat.x + 35, plat.y + platformHeight);
                    ctx.stroke();
                }
            });
        }

        function drawShirts() {
            shirts.forEach(shirt => {
                if (shirtImg.complete && shirtImg.width > 0) {
                    ctx.drawImage(shirtImg, shirt.x, shirt.y, shirt.width, shirt.height);
                } else {
                    ctx.fillStyle = '#e74c3c';
                    ctx.beginPath();
                    ctx.roundRect(shirt.x, shirt.y, shirt.width, shirt.height - 5, 4);
                    ctx.fill();

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillText('', shirt.x + 6, shirt.y + 20);
                }
            });
        }

    
        function drawPlayer() {
            const size = player.radius * 2.2;

            let currentImg = dogRightImg;
            if (player.vy < 0) {
                currentImg = dogJumpImg;
            } else {
                currentImg = (player.facing === 'left') ? dogLeftImg : dogRightImg;
            }

            if (currentImg.complete && currentImg.width > 0) {
                ctx.drawImage(currentImg, player.x - player.radius, player.y - player.radius, size, size);
            } else {
                ctx.fillStyle = '#e67e22';
                ctx.beginPath();
                ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function drawUI() {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            
            ctx.fillText(`Camisetas: ${shirtsCollected}/${TOTAL_SHIRTS}`, 15, 35);
            ctx.fillText(`Alt: ${Math.floor(score)}m`, canvas.width - 110, 35);

            ctx.shadowBlur = 0;

            if (isGameOver || isWin) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.textAlign = 'center';

                if (isWin) {
                    ctx.fillStyle = '#2ecc71';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText('🎉 MISSÃO CUMPRIDA! 🎉', canvas.width / 2, canvas.height / 2 - 50);

                    ctx.fillStyle = '#fff';
                    ctx.font = '19px sans-serif';
                    ctx.fillText(`Você pegou as ${TOTAL_SHIRTS} camisetas!`, canvas.width / 2, canvas.height / 2);
                    ctx.fillText(`Pontuação Final: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 35);

                    ctx.fillStyle = '#f1c40f';
                    ctx.font = '16px sans-serif';
                    ctx.fillText('Toque ou pressione Enter para jogar novamente', canvas.width / 2, canvas.height / 2 + 85);
                } else if (isGameOver) {
                    ctx.fillStyle = '#e74c3c';
                    ctx.font = 'bold 32px sans-serif';
                    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

                    ctx.fillStyle = '#fff';
                    ctx.font = '18px sans-serif';
                    ctx.fillText(`Camisetas Coletadas: ${shirtsCollected}/${TOTAL_SHIRTS}`, canvas.width / 2, canvas.height / 2 + 10);

                    ctx.fillStyle = '#f39c12';
                    ctx.font = '16px sans-serif';
                    ctx.fillText('Toque ou pressione Enter para tentar novamente', canvas.width / 2, canvas.height / 2 + 65);
                }

                ctx.textAlign = 'left';
            }
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
                    shirt.x = shirt.platformRef.x + platformWidth / 2 - 15;
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
                updatePlayer();
                timeAccumulator -= FRAME_DURATION;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawBackground();
            drawPlatforms();
            drawShirts();
            drawPlayer();
            drawUI();

            requestAnimationFrame(gameLoop);
        }

        initGame();
        requestAnimationFrame(gameLoop);