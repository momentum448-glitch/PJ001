import Phaser from 'phaser';

type AttackPhase = 'idle' | 'startup' | 'active' | 'recovery';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveVector = new Phaser.Math.Vector2();
  private facing = new Phaser.Math.Vector2(1, 0);
  private joystickPointerId: number | null = null;
  private background!: Phaser.GameObjects.Graphics;
  private controlShade!: Phaser.GameObjects.Rectangle;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private attackButton!: Phaser.GameObjects.Arc;
  private attackLabel!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private facingIndicator!: Phaser.GameObjects.Line;
  private attackHitbox!: Phaser.GameObjects.Zone;
  private attackHitboxBody!: Phaser.Physics.Arcade.Body;
  private attackVisual!: Phaser.GameObjects.Rectangle;
  private attackPhase: AttackPhase = 'idle';
  private joystickRadius = 54;

  private readonly attackStartupMs = 90;
  private readonly attackActiveMs = 90;
  private readonly attackRecoveryMs = 170;
  private readonly attackReach = 62;
  private readonly attackHitboxLength = 74;
  private readonly attackHitboxWidth = 58;

  constructor() {
    super('game');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#14221c');
    this.input.addPointer(2);

    this.background = this.add.graphics().setDepth(-10);
    this.controlShade = this.add.rectangle(0, 0, 10, 10, 0x07100c, 0.12)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(5);

    this.title = this.add.text(18, 16, 'PJ001 · M1.1 Combat', {
      fontSize: '18px',
      color: '#e9f5ef'
    }).setScrollFactor(0).setDepth(10);

    this.subtitle = this.add.text(18, 42, 'Facing + startup / active / recovery', {
      fontSize: '12px',
      color: '#a9c9b8'
    }).setScrollFactor(0).setDepth(10);

    this.player = this.add.rectangle(0, 0, 46, 46, 0x68d391)
      .setStrokeStyle(3, 0xeafff2)
      .setDepth(2);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);

    this.facingIndicator = this.add.line(0, 0, 0, 0, 34, 0, 0xfff1a8, 0.9)
      .setLineWidth(3)
      .setOrigin(0, 0.5)
      .setDepth(3);

    this.attackHitbox = this.add.zone(0, 0, this.attackHitboxLength, this.attackHitboxWidth).setDepth(4);
    this.physics.add.existing(this.attackHitbox);
    this.attackHitboxBody = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    this.attackHitboxBody.setAllowGravity(false);
    this.attackHitboxBody.setImmovable(true);
    this.attackHitboxBody.enable = false;

    this.attackVisual = this.add.rectangle(0, 0, this.attackHitboxLength, this.attackHitboxWidth, 0xffdf7a, 0)
      .setStrokeStyle(2, 0xfff0ad, 0)
      .setDepth(3);

    this.cursors = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);

    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0xffffff, 0.07)
      .setStrokeStyle(2, 0xffffff, 0.2)
      .setScrollFactor(0)
      .setDepth(10);
    this.joystickKnob = this.add.circle(0, 0, 23, 0xffffff, 0.25)
      .setScrollFactor(0)
      .setDepth(11);

    this.attackButton = this.add.circle(0, 0, 49, 0xe56565, 0.58)
      .setStrokeStyle(3, 0xffd0d0, 0.62)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive();
    this.attackLabel = this.add.text(0, 0, 'ATTACK', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11).setInteractive();

    this.attackButton.on('pointerdown', () => this.tryAttack());
    this.attackLabel.on('pointerdown', () => this.tryAttack());

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const height = this.scale.height;
      if (
        pointer.x < this.scale.width * 0.5 &&
        pointer.y > height * 0.56 &&
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
    this.updateFacingIndicator();
  }

  update(): void {
    const keyboardVector = new Phaser.Math.Vector2(
      Number(Boolean(this.cursors.right?.isDown)) - Number(Boolean(this.cursors.left?.isDown)),
      Number(Boolean(this.cursors.down?.isDown)) - Number(Boolean(this.cursors.up?.isDown))
    );

    const movement = keyboardVector.lengthSq() > 0 ? keyboardVector.normalize() : this.moveVector;
    if (movement.lengthSq() > 0.01) {
      this.facing.copy(movement).normalize();
    }

    const speed = 235;
    this.playerBody.setVelocity(movement.x * speed, movement.y * speed);
    this.updateFacingIndicator();

    if (this.attackPhase === 'active') {
      this.positionAttackHitbox();
    }
  }

  private layout(width: number, height: number): void {
    const safeSide = Phaser.Math.Clamp(width * 0.035, 14, 26);
    const safeBottom = Phaser.Math.Clamp(height * 0.052, 36, 62);
    this.joystickRadius = Phaser.Math.Clamp(width * 0.08, 49, 58);
    const attackRadius = Phaser.Math.Clamp(width * 0.072, 45, 53);

    this.redrawBackground(width, height);

    const overlayHeight = Phaser.Math.Clamp(height * 0.19, 165, 235);
    this.controlShade
      .setPosition(0, height - overlayHeight)
      .setSize(width, overlayHeight);

    const joystickX = safeSide + this.joystickRadius + 6;
    const controlsY = height - safeBottom - this.joystickRadius - 10;
    this.joystickBase
      .setPosition(joystickX, controlsY)
      .setRadius(this.joystickRadius);
    this.joystickKnob.setPosition(joystickX, controlsY);

    const attackX = width - safeSide - attackRadius - 8;
    const attackY = height - safeBottom - attackRadius - 12;
    this.attackButton
      .setPosition(attackX, attackY)
      .setRadius(attackRadius);
    this.attackLabel.setPosition(attackX, attackY);

    this.title.setPosition(safeSide, 16);
    this.subtitle.setPosition(safeSide, 42);

    this.physics.world.setBounds(0, 0, width, height);
    this.playerBody.setCollideWorldBounds(true);

    if (this.player.x === 0 && this.player.y === 0) {
      this.player.setPosition(width * 0.5, height * 0.42);
    } else {
      this.player.setPosition(
        Phaser.Math.Clamp(this.player.x, 28, width - 28),
        Phaser.Math.Clamp(this.player.y, 72, height - 28)
      );
    }

    this.updateFacingIndicator();
    if (this.attackPhase === 'active') {
      this.positionAttackHitbox();
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

  private updateFacingIndicator(): void {
    if (!this.facingIndicator || !this.player) {
      return;
    }

    const length = 34;
    this.facingIndicator.setTo(
      this.player.x,
      this.player.y,
      this.player.x + this.facing.x * length,
      this.player.y + this.facing.y * length
    );
  }

  private tryAttack(): void {
    if (this.attackPhase !== 'idle') {
      return;
    }

    this.attackPhase = 'startup';
    this.attackButton.setAlpha(0.72);
    this.attackVisual.setAlpha(0.14).setStrokeStyle(2, 0xfff0ad, 0.28);
    this.positionAttackHitbox();

    this.time.delayedCall(this.attackStartupMs, () => {
      if (this.attackPhase !== 'startup') {
        return;
      }
      this.beginActiveAttack();
    });
  }

  private beginActiveAttack(): void {
    this.attackPhase = 'active';
    this.positionAttackHitbox();
    this.attackHitboxBody.enable = true;
    this.attackHitboxBody.updateFromGameObject();
    this.attackVisual.setAlpha(0.48).setStrokeStyle(2, 0xfff0ad, 0.9);
    this.cameras.main.shake(45, 0.0018);

    this.time.delayedCall(this.attackActiveMs, () => {
      if (this.attackPhase !== 'active') {
        return;
      }
      this.beginRecovery();
    });
  }

  private beginRecovery(): void {
    this.attackPhase = 'recovery';
    this.attackHitboxBody.enable = false;
    this.attackVisual.setAlpha(0.08).setStrokeStyle(2, 0xfff0ad, 0.18);

    this.time.delayedCall(this.attackRecoveryMs, () => {
      if (this.attackPhase !== 'recovery') {
        return;
      }
      this.attackPhase = 'idle';
      this.attackVisual.setAlpha(0).setStrokeStyle(2, 0xfff0ad, 0);
      this.attackButton.setAlpha(1);
    });
  }

  private positionAttackHitbox(): void {
    const centerDistance = this.attackReach;
    const x = this.player.x + this.facing.x * centerDistance;
    const y = this.player.y + this.facing.y * centerDistance;
    const horizontal = Math.abs(this.facing.x) >= Math.abs(this.facing.y);
    const width = horizontal ? this.attackHitboxLength : this.attackHitboxWidth;
    const height = horizontal ? this.attackHitboxWidth : this.attackHitboxLength;

    this.attackHitbox.setPosition(x, y).setSize(width, height);
    this.attackHitboxBody.setSize(width, height);
    this.attackHitboxBody.updateFromGameObject();
    this.attackVisual
      .setPosition(x, y)
      .setSize(width, height)
      .setRotation(Math.atan2(this.facing.y, this.facing.x));
  }
}
