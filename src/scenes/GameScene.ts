import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveVector = new Phaser.Math.Vector2();
  private joystickPointerId: number | null = null;
  private background!: Phaser.GameObjects.Graphics;
  private controlShade!: Phaser.GameObjects.Rectangle;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private attackButton!: Phaser.GameObjects.Arc;
  private attackLabel!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private joystickRadius = 64;

  constructor() {
    super('game');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#14221c');
    this.input.addPointer(2);

    this.background = this.add.graphics().setDepth(-10);
    this.controlShade = this.add.rectangle(0, 0, 10, 10, 0x07100c, 0.2)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(5);

    this.title = this.add.text(20, 18, 'PJ001 · Responsive Playtest', {
      fontSize: '20px',
      color: '#e9f5ef'
    }).setScrollFactor(0).setDepth(10);

    this.subtitle = this.add.text(20, 46, 'Move with joystick · tap ATTACK', {
      fontSize: '13px',
      color: '#a9c9b8'
    }).setScrollFactor(0).setDepth(10);

    this.player = this.add.rectangle(0, 0, 46, 46, 0x68d391)
      .setStrokeStyle(3, 0xeafff2)
      .setDepth(2);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);

    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0xffffff, 0.085)
      .setStrokeStyle(2, 0xffffff, 0.22)
      .setScrollFactor(0)
      .setDepth(10);
    this.joystickKnob = this.add.circle(0, 0, 27, 0xffffff, 0.28)
      .setScrollFactor(0)
      .setDepth(11);

    this.attackButton = this.add.circle(0, 0, 56, 0xe56565, 0.62)
      .setStrokeStyle(3, 0xffd0d0, 0.68)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive();
    this.attackLabel = this.add.text(0, 0, 'ATTACK', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11).setInteractive();

    this.attackButton.on('pointerdown', () => this.performAttack());
    this.attackLabel.on('pointerdown', () => this.performAttack());

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const height = this.scale.height;
      if (
        pointer.x < this.scale.width * 0.5 &&
        pointer.y > height * 0.58 &&
        this.joystickPointerId === null
      ) {
        this.joystickPointerId = pointer.id;
        this.updateJoystick(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joystickPointerId && pointer.isDown) {
        this.updateJoystick(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joystickPointerId) {
        this.releaseJoystick();
      }
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.layout(gameSize.width, gameSize.height);
    });

    this.layout(this.scale.width, this.scale.height);
  }

  update(): void {
    const keyboardVector = new Phaser.Math.Vector2(
      Number(Boolean(this.cursors.right?.isDown)) - Number(Boolean(this.cursors.left?.isDown)),
      Number(Boolean(this.cursors.down?.isDown)) - Number(Boolean(this.cursors.up?.isDown))
    );

    const movement = keyboardVector.lengthSq() > 0 ? keyboardVector.normalize() : this.moveVector;
    const speed = 235;
    this.playerBody.setVelocity(movement.x * speed, movement.y * speed);
  }

  private layout(width: number, height: number): void {
    const safeSide = Phaser.Math.Clamp(width * 0.035, 14, 28);
    const safeBottom = Phaser.Math.Clamp(height * 0.035, 24, 44);
    this.joystickRadius = Phaser.Math.Clamp(width * 0.092, 56, 66);
    const attackRadius = Phaser.Math.Clamp(width * 0.081, 50, 58);

    this.redrawBackground(width, height);

    const overlayHeight = Phaser.Math.Clamp(height * 0.23, 210, 300);
    this.controlShade
      .setPosition(0, height - overlayHeight)
      .setSize(width, overlayHeight);

    const joystickX = safeSide + this.joystickRadius + 8;
    const controlsY = height - safeBottom - this.joystickRadius - 8;
    this.joystickBase
      .setPosition(joystickX, controlsY)
      .setRadius(this.joystickRadius);
    this.joystickKnob.setPosition(joystickX, controlsY);

    const attackX = width - safeSide - attackRadius - 10;
    const attackY = height - safeBottom - attackRadius - 12;
    this.attackButton
      .setPosition(attackX, attackY)
      .setRadius(attackRadius);
    this.attackLabel.setPosition(attackX, attackY);

    this.title.setPosition(safeSide, 18);
    this.subtitle.setPosition(safeSide, 46);

    this.physics.world.setBounds(0, 0, width, height);
    this.playerBody.setCollideWorldBounds(true);

    if (this.player.x === 0 && this.player.y === 0) {
      this.player.setPosition(width * 0.5, height * 0.42);
    } else {
      this.player.setPosition(
        Phaser.Math.Clamp(this.player.x, 28, width - 28),
        Phaser.Math.Clamp(this.player.y, 76, height - 28)
      );
    }
  }

  private redrawBackground(width: number, height: number): void {
    const grid = 64;
    this.background.clear();
    this.background.fillStyle(0x173126, 1);
    this.background.fillRect(0, 0, width, height);
    this.background.lineStyle(1, 0x29483a, 0.5);

    for (let x = 0; x <= width; x += grid) {
      this.background.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += grid) {
      this.background.lineBetween(0, y, width, y);
    }
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const origin = new Phaser.Math.Vector2(this.joystickBase.x, this.joystickBase.y);
    const delta = new Phaser.Math.Vector2(pointer.x - origin.x, pointer.y - origin.y);

    if (delta.length() > this.joystickRadius) {
      delta.setLength(this.joystickRadius);
    }

    this.joystickKnob.setPosition(origin.x + delta.x, origin.y + delta.y);
    this.moveVector.copy(delta).scale(1 / this.joystickRadius);
  }

  private releaseJoystick(): void {
    this.joystickPointerId = null;
    this.moveVector.set(0, 0);
    this.joystickKnob.setPosition(this.joystickBase.x, this.joystickBase.y);
  }

  private performAttack(): void {
    const slash = this.add.circle(this.player.x + 44, this.player.y, 30, 0xffe08a, 0.82).setDepth(3);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scale: 1.55,
      duration: 150,
      ease: 'Quad.Out',
      onComplete: () => slash.destroy()
    });

    this.cameras.main.shake(60, 0.0022);
  }
}
