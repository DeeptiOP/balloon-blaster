class BalloonGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('bestScore'); // Added best score element
        this.timerElement = document.getElementById('timer');
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.restartButton = document.getElementById('restartButton');

        this.canvas.width = 800;
        this.canvas.height = 600;

        this.balloons = [];
        this.particles = [];
        this.scorePopups = [];
        this.backgroundParticles = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('balloonGameBestScore')) || 0;
        this.timeLeft = 60;
        this.gameActive = false;
        this.synth = new Tone.Synth().toDestination();

        this.themes = {
            classic: {
                name: 'Classic Dark',
                backgroundColor: '#1A1A2E',
                particleColors: ['#FF4C4C', '#00D4FF', '#7B2CBF', '#F9C80E', '#8AFFC1'],
                backgroundParticleOpacity: '50'
            },
            sunset: {
                name: 'Sunset',
                backgroundColor: 'rgb(73, 38, 4)',
                particleColors: ['#FF6F61', '#FF9E80', '#FFC75F', '#F15BB5', '#FFB703'],
                backgroundParticleOpacity: '30'
            },
            ocean: {
                name: 'Ocean',
                backgroundColor: '#001F3F',
                particleColors: ['#0077B6', '#00C6D6', '#38B6FF', '#00F5D4', '#CAF0F8'],
                backgroundParticleOpacity: '40'
            },
            forest: {
                name: 'Forest',
                backgroundColor: 'rgb(1, 22, 8)',
                particleColors: ['#2DC653', '#76C893', '#99D98C', '#52B788', '#C4E538'],
                backgroundParticleOpacity: '35'
            },

        };
        

        this.currentTheme = 'classic';
        this.colors = this.themes[this.currentTheme].particleColors;

        this.themeButton = document.getElementById('themeButton');
        if (this.themeButton) {
            this.themeButton.addEventListener('click', () => this.cycleTheme());
        }

        this.initBackgroundParticles();

        this.setupEventListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bestScoreElement.textContent = this.bestScore; // Initialize best score display

    }

    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const scale = containerWidth / this.canvas.width;

        if (scale < 1) {
            this.canvas.style.width = `${containerWidth}px`;
            this.canvas.style.height = `${this.canvas.height * scale}px`;
        } else {
            this.canvas.style.width = `${this.canvas.width}px`;
            this.canvas.style.height = `${this.canvas.height}px`;
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleClick(e);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleClick(touch);
        });

        this.startButton.addEventListener('click', () => this.startGame());
        this.stopButton.addEventListener('click', () => this.stopGame());
        this.restartButton.addEventListener('click', () => this.startGame());
    }

    handleClick(e) {
        if (!this.gameActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        const x = (clientX - rect.left) * scale;
        const y = (clientY - rect.top) * scale;
        const hitRadius = 25;

        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            const dx = balloon.x - x;
            const dy = balloon.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < balloon.radius + hitRadius) {
                this.particles.push(new ParticleSystem(balloon.x, balloon.y, balloon.color, 20));

                this.scorePopups.push({
                    x: balloon.x,
                    y: balloon.y,
                    value: '+10',
                    alpha: 1,
                    life: 1
                });

                this.balloons.splice(i, 1);
                this.updateScore(10);
                this.playPopSound();
                break;
            }
        }
    }

    playPopSound() {
        this.synth.triggerAttackRelease('C6', '0.1');
    }

    startGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.balloons = [];
        this.particles = [];
        this.scorePopups = [];
        this.gameActive = true;
        this.scoreElement.textContent = '0';
        this.startButton.classList.add('d-none');
        this.stopButton.classList.remove('d-none');
        this.restartButton.classList.add('d-none');

        this.gameLoop();
        this.spawnBalloons();
        this.startTimer();
    }

    stopGame() {
        this.gameActive = false;
        clearTimeout(this.spawnTimeout);
        this.stopButton.classList.add('d-none');
        this.restartButton.classList.remove('d-none');
    }

    spawnBalloons() {
        if (!this.gameActive) return;

        const balloon = {
            x: Math.random() * (this.canvas.width - 40) + 20,
            y: this.canvas.height + 30,
            radius: Math.random() * 10 + 15,
            speed: Math.random() * 2 + 1,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
        };

        this.balloons.push(balloon);
        this.spawnTimeout = setTimeout(() => this.spawnBalloons(), Math.random() * 1000 + 500);
    }

    startTimer() {
        const timer = setInterval(() => {
            if (!this.gameActive) {
                clearInterval(timer);
                return;
            }

            this.timeLeft--;
            this.timerElement.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                clearInterval(timer);
                this.gameActive = false;
                this.stopButton.classList.add('d-none');
                this.restartButton.classList.remove('d-none');
            }
        }, 1000);
    }

    updateScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('balloonGameBestScore', this.bestScore);
            this.bestScoreElement.textContent = this.bestScore;
        }
    }

    update() {
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            balloon.y -= balloon.speed;

            if (balloon.y + balloon.radius < 0) {
                this.balloons.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y -= 1;
            popup.alpha -= 0.02;
            popup.life -= 0.02;
            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }

        for (const particle of this.backgroundParticles) {
            particle.y -= particle.speed;
            if (particle.y < 0) {
                particle.y = this.canvas.height;
                particle.x = Math.random() * this.canvas.width;
            }
        }
    }

    draw() {
        this.ctx.fillStyle = this.themes[this.currentTheme].backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const particle of this.backgroundParticles) {
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, particle.color + 'FF');
            gradient.addColorStop(1, particle.color + '00');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const balloon of this.balloons) {
            const gradient = this.ctx.createRadialGradient(
                balloon.x - balloon.radius * 0.3,
                balloon.y - balloon.radius * 0.3,
                balloon.radius * 0.1,
                balloon.x,
                balloon.y,
                balloon.radius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, balloon.color);
            gradient.addColorStop(1, balloon.color);

            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.shadowColor = 'transparent';

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(
                balloon.x - balloon.radius * 0.3,
                balloon.y - balloon.radius * 0.3,
                balloon.radius * 0.2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();

            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(balloon.x, balloon.y + balloon.radius);
            const cp1x = balloon.x - 10;
            const cp1y = balloon.y + balloon.radius + 10;
            const cp2x = balloon.x + 10;
            const cp2y = balloon.y + balloon.radius + 15;
            const endX = balloon.x;
            const endY = balloon.y + balloon.radius + 25;
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            this.ctx.stroke();
        }

        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }

        for (const popup of this.scorePopups) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${popup.alpha})`;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(popup.value, popup.x, popup.y);
            this.ctx.shadowColor = 'transparent';
        }
    }

    gameLoop() {
        if (!this.gameActive) return;

        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    initBackgroundParticles() {
        this.backgroundParticles = [];
        for (let i = 0; i < 50; i++) {
            this.backgroundParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.1,
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }
    }

    cycleTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        this.currentTheme = themeKeys[nextIndex];

        this.colors = this.themes[this.currentTheme].particleColors;
        document.body.style.backgroundColor = this.themes[this.currentTheme].backgroundColor;

        this.backgroundParticles.forEach(particle => {
            particle.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        });

        if (this.themeButton) {
            this.themeButton.textContent = `Theme: ${this.themes[this.currentTheme].name}`;
        }
    }
}

window.addEventListener('load', () => {
    const game = new BalloonGame();
});