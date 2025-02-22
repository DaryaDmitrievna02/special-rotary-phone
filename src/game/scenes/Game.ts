import "phaser";

const REEL_COUNT = 5;
const SYMBOLS_PER_REEL = 20;
const VISIBLE_SYMBOLS = 4;
const GLOBAL_DURATION = 5200;
const PADDING_BETWEEN_SYMBOLS = 20;
const MOBILE_BREAKPOINT = 1000;
const SYMBOL_SIZE_DESKTOP = 100;
const SYMBOL_SIZE_MOBILE = 80;
const MOBILE_SLOT_WIDTH_PERCENT = 0.9;

export class Game extends Phaser.Scene {
    private reels: Phaser.GameObjects.Container[] = [];
    private reelTweens: Phaser.Tweens.Tween[] = [];
    private isMobile: boolean;
    private symbolHeight: number;
    private slotWidth: number;
    private slotHeight: number;
    private startX: number;
    private startY: number;
    private slotMask: Phaser.Display.Masks.GeometryMask;
    private startButton: Phaser.GameObjects.Sprite;
    private stopButton: Phaser.GameObjects.Sprite;
    private repeatButton: Phaser.GameObjects.Sprite;

    constructor() {
        super("Game");
        this.isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        this.symbolHeight = this.isMobile
            ? SYMBOL_SIZE_MOBILE
            : SYMBOL_SIZE_DESKTOP;
        this.slotHeight = this.symbolHeight * VISIBLE_SYMBOLS;
        if (this.isMobile) {
            this.slotWidth = window.innerWidth * MOBILE_SLOT_WIDTH_PERCENT;
        } else {
            this.slotWidth =
                REEL_COUNT * this.symbolHeight +
                (REEL_COUNT - 1) * PADDING_BETWEEN_SYMBOLS +
                60;
        }
        this.startX = (window.innerWidth - this.slotWidth) / 2;
        this.startY = (window.innerHeight - this.slotHeight) / 2;
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
        this.scale.on("resize", (size: { width: number; height: number }) => {
            bg.setDisplaySize(size.width, size.height);
        });
        const slotWindow = this.add.graphics();
        slotWindow.fillStyle(0xffffff, 1);
        slotWindow.fillRect(
            this.startX,
            this.startY,
            this.slotWidth,
            this.slotHeight
        );
        this.slotMask = slotWindow.createGeometryMask();
        for (let i = 0; i < REEL_COUNT; i++) {
            const reelX =
                this.startX +
                i * (this.symbolHeight + PADDING_BETWEEN_SYMBOLS) +
                this.symbolHeight / 2;
            const reelY = this.startY;
            const reelContainer = this.add.container(reelX, reelY);
            for (let j = 0; j < SYMBOLS_PER_REEL; j++) {
                const sprite = this.add.sprite(
                    0,
                    j * this.symbolHeight,
                    this.getRandomSymbolKey()
                );
                sprite.setScale(this.isMobile ? 0.07 : 0.09);
                sprite.setOrigin(0.5, 0);
                reelContainer.add(sprite);
            }
            reelContainer.setMask(this.slotMask);
            this.reels.push(reelContainer);
        }
        this.startButton = this.add
            .sprite(100, window.innerHeight - 50, "button")
            .setInteractive()
            .setScale(0.15)
            .on("pointerdown", () => this.startSpin());
        this.stopButton = this.add
            .sprite(200, window.innerHeight - 50, "button")
            .setInteractive()
            .setScale(0.15)
            .on("pointerdown", () => this.stopSpin());
        this.repeatButton = this.add
            .sprite(300, window.innerHeight - 50, "button")
            .setInteractive()
            .setScale(0.15)
            .on("pointerdown", () => this.repeatSpin());
    }

    startSpin(): void {
        if (this.reelTweens.length > 0) return;
        this.reels.forEach((reel, i) => {
            const tween = this.tweens.add({
                targets: reel,
                y: reel.y + SYMBOLS_PER_REEL * this.symbolHeight,
                duration: GLOBAL_DURATION,
                ease: "Linear",
                repeat: -1,
                delay: i * 100,
                onUpdate: () => {
                    this.wrapSymbols(reel);
                },
                onRepeat: () => this.resetReelPosition(reel),
            });
            this.reelTweens[i] = tween;
        });
    }

    wrapSymbols(reel: Phaser.GameObjects.Container): void {
        for (const symbol of reel.list) {
            const sprite = symbol as Phaser.GameObjects.Sprite;
            const symbolY: number = sprite.y + reel.y;

            if (
                symbolY >
                Math.round(
                    window.innerHeight * 0.2 * VISIBLE_SYMBOLS +
                        this.symbolHeight
                )
            ) {
                // 150 (startY) + 300 (mask height)
                sprite.y -= VISIBLE_SYMBOLS * this.symbolHeight * 3;
            }
        }
    }

    // Сброс позиции риля
    resetReelPosition(reel: Phaser.GameObjects.Container): void {
        reel.y = this.startY - this.symbolHeight * 4;
        reel.list.forEach((symbol, index: number) => {
            (symbol as Phaser.GameObjects.Sprite).y = index * this.symbolHeight; // Исходные позиции
        });
    }

    stopSpin(): void {
        this.reels.forEach((reel, i) => {
            if (this.reelTweens[i]) {
                const currentY = reel.y;
                const remainder = currentY % this.symbolHeight;
                const targetY =
                    Math.abs(remainder) < this.symbolHeight / 2
                        ? currentY - remainder
                        : currentY + (this.symbolHeight - remainder);
                this.stopAnimation(this.reelTweens[i], reel, targetY);
            }
        });
        this.reelTweens = [];
    }

    repeatSpin(): void {
        const count = 5;
        for (let i = 0; i < count; i++) {
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
        tween.stop();
        this.tweens.add({
            targets: reel,
            y: targetY,
            duration: 600,
            ease: "Cubic.easeOut",
            onComplete: () => {
                this.tweens.add({
                    targets: reel,
                    y: reel.y - 3,
                    duration: 80,
                    ease: "Sine.easeInOut",
                    yoyo: true,
                });
            },
        });
    }

    getRandomSymbolKey(): string {
        const r = Math.floor(Math.random() * 10) + 1;
        return String(r);
    }
}

// slotWindow.lineStyle(3, 0xff0000); // Толщина 3px, красный цвет
// slotWindow.strokeRect(
//     slotWidth,
//     slotHeight,
//     window.innerWidth - slotWidth * 2,
//     slotHeight + slotHeight
// );
// slotWindow.moveTo(slotWidth + 100, slotHeight);
// slotWindow.lineTo(slotWidth + 100, slotHeight * 3);
// slotWindow.moveTo(slotWidth + 200, slotHeight);
// slotWindow.lineTo(slotWidth + 200, slotHeight * 3);
// slotWindow.moveTo(slotWidth + 300, slotHeight);
// slotWindow.lineTo(slotWidth + 300, slotHeight * 3);
// slotWindow.moveTo(slotWidth + 400, slotHeight);
// slotWindow.lineTo(slotWidth + 400, slotHeight * 3);
// slotWindow.moveTo(slotWidth + 500, slotHeight);
// slotWindow.lineTo(slotWidth + 500, slotHeight * 3);
// slotWindow.strokePath();

