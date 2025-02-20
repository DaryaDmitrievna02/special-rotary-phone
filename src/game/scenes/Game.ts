import "phaser";

export class Game extends Phaser.Scene {
    private reels: Phaser.GameObjects.Container[]; // Массив контейнеров для рилей
    private reelTweens: Phaser.Tweens.Tween[]; // Массив для хранения активных tween‑ов вращения
    private symbolsPerReel: number; // Общее количество символов в риле
    private visibleSymbols: number; // Количество видимых символов
    private symbolHeight: number; // Высота символа
    private globalDuration: number; // Глобальная длительность анимации
    private slotMask: Phaser.Display.Masks.GeometryMask; // Маска для отображения слотов
    private startButton: Phaser.GameObjects.Sprite; // Кнопка "Старт"
    private stopButton: Phaser.GameObjects.Sprite; // Кнопка "Стоп"
    private repeatButton: Phaser.GameObjects.Sprite; // Кнопка "Стоп"

    constructor() {
        super("Game");
        this.reels = []; // Массив контейнеров для рилей
        this.reelTweens = []; // Массив для хранения активных tween‑ов вращения
        this.symbolsPerReel = 20; // Общее количество символов в риле
        this.visibleSymbols = 4; // Количество видимых символов
        this.symbolHeight = 100; // Высота символа
        this.globalDuration = 2200; // Глобальная длительность анимации
    }

    preload(): void {
        this.load.image("1", "assets/1.png");
        this.load.image("2", "assets/2.png");
        this.load.image("3", "assets/3.png");
        this.load.image("4", "assets/4.png");
        this.load.image("5", "assets/5.png");
        this.load.image("6", "assets/6.png");
        this.load.image("7", "assets/7.png");
        this.load.image("8", "assets/8.png");
        this.load.image("9", "assets/9.png");
        this.load.image("10", "assets/10.png");

        this.load.image("bomb", "assets/bomb.png");
        this.load.image("button", "assets/start.png");
        this.load.image("background", "assets/background.png");
    }

    create(): void {
        const bg = this.add.image(0, 0, "background").setOrigin(0, 0);
        bg.setDisplaySize(window.innerWidth, window.innerHeight);
        this.scale.on(
            "resize",
            (gameSize: { width: number; height: number }) => {
                bg.setDisplaySize(gameSize.width, gameSize.height);
            }
        );
        const slotWindow: Phaser.GameObjects.Graphics = this.add.graphics();
        slotWindow.fillStyle(0xffffff);

        const slotWidth = Math.round(window.innerWidth * 0.3);
        const slotHeight = Math.round(window.innerHeight * 0.2);

        slotWindow.fillRect(
            slotWidth,
            slotHeight,
            Math.round(window.innerWidth - slotWidth * 2),
            slotHeight + slotHeight
        );

        slotWindow.lineStyle(3, 0xff0000); // Толщина 3px, красный цвет
        slotWindow.strokeRect(
            slotWidth,
            slotHeight,
            window.innerWidth - slotWidth * 2,
            slotHeight + slotHeight
        );
        slotWindow.moveTo(slotWidth + 100, slotHeight);
        slotWindow.lineTo(slotWidth + 100, slotHeight * 3);
        slotWindow.moveTo(slotWidth + 200, slotHeight);
        slotWindow.lineTo(slotWidth + 200, slotHeight * 3);
        slotWindow.moveTo(slotWidth + 300, slotHeight);
        slotWindow.lineTo(slotWidth + 300, slotHeight * 3);
        slotWindow.moveTo(slotWidth + 400, slotHeight);
        slotWindow.lineTo(slotWidth + 400, slotHeight * 3);
        slotWindow.moveTo(slotWidth + 500, slotHeight);
        slotWindow.lineTo(slotWidth + 500, slotHeight * 3);
        slotWindow.strokePath();

        this.slotMask = slotWindow.createGeometryMask();

        // Параметры для рилей
        const reelCount: number = 6; // число рилей
        const spacingX: number = 0; // горизонтальное расстояние между рилями
        const startX: number = Math.round(slotWidth + this.symbolHeight / 2);
        const startY: number = Math.round(slotHeight + this.symbolHeight / 2); // начальная Y

        for (let i = 0; i < reelCount; i++) {
            const reelContainer: Phaser.GameObjects.Container =
                this.add.container(startX + i * (100 + spacingX), startY);

            for (let j = 0; j < this.symbolsPerReel; j++) {
                const symbol: Phaser.GameObjects.Sprite = this.add.sprite(
                    0,
                    j * this.symbolHeight,
                    `${this.getRandom()}`
                );
                symbol.setScale(0.09);
                symbol.setOrigin(0.5, 0.5); // Centering horizontally
                reelContainer.add(symbol);
            }

            reelContainer.setMask(this.slotMask);
            this.reels.push(reelContainer);
        }

        this.startButton = this.add
            .sprite(slotWidth + 200, slotHeight * 4, "button")
            .setInteractive()
            .setScale(0.2)
            .on("pointerdown", () => this.startSpin());

        this.stopButton = this.add
            .sprite(slotWidth + 400, slotHeight * 4, "button")
            .setInteractive()
            .setScale(0.2)
            .on("pointerdown", () => this.stopSpin());

        this.repeatButton = this.add
            .sprite(slotWidth + 600, slotHeight * 4, "button")
            .setInteractive()
            .setScale(0.2)
            .on("pointerdown", () => this.repeatSpin());
    }

    startSpin(): void {
        if (this.reelTweens.length > 0) return;

        setTimeout(() => {
            this.stopSpin();
        }, 2000);

        this.reels.forEach(
            (reel: Phaser.GameObjects.Container, index: number) => {
                const tween: Phaser.Tweens.Tween = this.tweens.add({
                    targets: reel,
                    y: reel.y + this.symbolsPerReel * this.symbolHeight,
                    duration: this.globalDuration,
                    ease: "Linear",
                    repeat: -1,
                    delay: index * 100,
                    onUpdate: () => this.wrapSymbols(reel),
                    onRepeat: () => this.resetReelPosition(reel),
                });
                this.reelTweens[index] = tween;
            }
        );
    }

    // Корректировка
    wrapSymbols(reel: Phaser.GameObjects.Container): void {
        for (const symbol of reel.list) {
            const sprite = symbol as Phaser.GameObjects.Sprite;
            const symbolY: number = sprite.y + reel.y;

            if (symbolY > Math.round(window.innerHeight * 0.2 * 3 + 100)) {
                // 150 (startY) + 300 (mask height)
                sprite.y -= this.symbolsPerReel * this.symbolHeight;
            }
        }
    }

    // Сброс позиции риля
    resetReelPosition(reel: Phaser.GameObjects.Container): void {
        reel.y = -600;
        reel.list.forEach((symbol, index: number) => {
            (symbol as Phaser.GameObjects.Sprite).y = index * this.symbolHeight; // Исходные позиции
        });
    }

    stopSpin(): void {
        setTimeout(() => {
            this.reels.forEach(
                async (reel: Phaser.GameObjects.Container, index: number) => {
                    if (this.reelTweens[index]) {
                        const currentY: number = Math.round(reel.y);
                        const remainder: number = Math.round(
                            currentY % this.symbolHeight
                        );
                        const targetY: number =
                            remainder < Math.round(this.symbolHeight / 2)
                                ? currentY - remainder
                                : currentY + (this.symbolHeight - remainder);

                        this.stopAnimation(
                            this.reelTweens[index],
                            reel,
                            targetY
                        );
                    }
                }
            );
            this.reelTweens = [];
        }, 500);
    }

    drawContainerBorder(reel: Phaser.GameObjects.Container) {
        const border = this.add.graphics();
        border.lineStyle(3, 0xff0000); // Толщина 3px, красный цвет
        border.strokeRect(-50, -50, 200, 500);

        reel.add(border);
    }

    repeatSpin(): void {
        const repeatCount: number = 5;

        for (let i = 0; i < repeatCount; i++) {
            setTimeout(() => {
                this.startSpin();
            }, i * 5000);
        }
    }

    stopAnimation(
        tween: Phaser.Tweens.Tween,
        reel: Phaser.GameObjects.Container,
        targetY: number
    ): void {
        console.log(reel.y);

        console.log("Work");
        this.tweens.add({
            targets: reel,
            y: targetY + 500,
            duration: 2000,
            ease: "Cubic.easeOut",

            onActive: () => tween.stop(),
            onComplete: () => {
                console.log("FINISHED");
                console.log(reel.y);

                this.tweens.add({
                    targets: reel,
                    y: reel.y - 5,
                    duration: 60,
                    ease: "Bounce.easeOut",
                    yoyo: true,
                });
            },
        });
    }

    getRandom(): number {
        return Math.floor(Math.random() * 10) + 1;
    }
}

