import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveVector = new Phaser.Math.Vector2();
  private joystickPointerId: number | null = null;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private attackButton!: Phaser.GameObjects.Arc;
  private attackLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('game');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#14221c');

    this.add.grid(640, 360, 1280, 720, 64, 64, 0x1d3329, 1, 0x29483a, 0.55);
    this.add.text(24, 20, 'PJ001 · Milestone 0', {
      fontSize: '24px',
      color: '#e9f5ef'
    }).setScrollFactor(0);

    this.add.text(24, 52, 'Move with touch joystick or arrow keys · tap ATTACK', {
      fontSize: '15px',
      color: '#a9c9b8'
    }).setScrollFactor(0);

    this.player = this.add.rectangle(640, 360, 52, 52, 0x68d391).setStrokeStyle(3, 0xeafff2);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, 1280, 720);

    this.cursors = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);

    this.joystickBase = this.add.circle(150, 570, 72, 0xffffff, 0.12)
      .setStrokeStyle(3, 0xffffff, 0.28)
      .setScrollFactor(0);
    this.joystickKnob = this.add.circle(150, 570, 32, 0xffffff, 0.35).setScrollFactor(0);

    this.attackButton = this.add.circle(1120, 570, 62, 0xe56565, 0.72)
      .setStrokeStyle(4, 0xffd0d0, 0.8)
      .setScrollFactor(0)
      .setInteractive();
    this.attackLabel = this.add.text(1120, 570, 'ATTACK', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    this.attackButton.on('pointerdown', () => this.performAttack());
    this.attackLabel.setInteractive().on('pointerdown', () => this.performAttack());

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < this.scale.width * 0.5 && this.joystickPointerId === null) {
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
        this.joystickPointerId = null;
        this.moveVector.set(0, 0);
        this.joystickKnob.setPosition(this.joystickBase.x, this.joystickBase.y);
      }
    });
  }

  update(): void {
    const keyboardVector = new Phaser.Math.Vector2(
      Number(Boolean(this.cursors.right?.isDown)) - Number(Boolean(this.cursors.left?.isDown)),
      Number(Boolean(this.cursors.down?.isDown)) - Number(Boolean(this.cursors.up?.isDown))
    );

    const movement = keyboardVector.lengthSq() > 0 ? keyboardVector.normalize() : this.moveVector;
    const speed = 260;
    this.playerBody.setVelocity(movement.x * speed, movement.y * speed);
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const origin = new Phaser.Math.Vector2(this.joystickBase.x, this.joystickBase.y);
    const delta = new Phaser.Math.Vector2(pointer.x - origin.x, pointer.y - origin.y);
    const maxDistance = 72;

    if (delta.length() > maxDistance) {
      delta.setLength(maxDistance);
    }

    this.joystickKnob.setPosition(origin.x + delta.x, origin.y + delta.y);
    this.moveVector.copy(delta).scale(1 / maxDistance);
  }

  private performAttack(): void {
    const slash = this.add.circle(this.player.x + 48, this.player.y, 34, 0xffe08a, 0.85);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scale: 1.6,
      duration: 160,
      ease: 'Quad.Out',
      onComplete: () => slash.destroy()
    });

    this.cameras.main.shake(70, 0.0025);
  }
}
