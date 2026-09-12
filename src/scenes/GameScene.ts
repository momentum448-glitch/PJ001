import Phaser from 'phaser';

type AttackPhase = 'idle' | 'startup' | 'active' | 'recovery';
type EnemyAttackPhase = 'idle' | 'windup' | 'active' | 'recovery';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private playerHpText!: Phaser.GameObjects.Text;
  private playerHp = 5;
  private playerDown = false;

  private enemy!: Phaser.GameObjects.Rectangle;
  private enemyBody!: Phaser.Physics.Arcade.Body;
  private enemyHpText!: Phaser.GameObjects.Text;
  private enemyHp = 3;
  private enemyAlive = true;
  private lastEnemyHitAttackId = -1;

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
  private attackId = 0;

  private enemyAttackHitbox!: Phaser.GameObjects.Zone;
  private enemyAttackHitboxBody!: Phaser.Physics.Arcade.Body;
  private enemyAttackVisual!: Phaser.GameObjects.Rectangle;
  private enemyAttackPhase: EnemyAttackPhase = 'idle';
  private enemyAttackDirection = new Phaser.Math.Vector2(0, 1);
  private enemyAttackId = 0;
  private lastPlayerHitEnemyAttackId = -1;
  private nextEnemyAttackAt = 0;

  private joystickRadius = 54;

  private readonly playerMaxHp = 5;
  private readonly playerMoveSpeed = 205;
  private readonly attackStartupMs = 90;
  private readonly attackActiveMs = 90;
  private readonly attackRecoveryMs = 170;
  private readonly attackReach = 62;
  private readonly attackHitboxLength = 74;
  private readonly attackHitboxWidth = 58;

  private readonly enemyMaxHp = 3;
  private readonly enemyKnockbackSpeed = 255;
  private readonly enemyAggroRange = 260;
  private readonly enemyAttackWindupMs = 620;
  private readonly enemyAttackActiveMs = 150;
  private readonly enemyAttackRecoveryMs = 620;
  private readonly enemyAttackCooldownMs = 520;
  private readonly enemyAttackReach = 66;
  private readonly enemyAttackLength = 96;
  private readonly enemyAttackWidth = 76;

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

    this.title = this.add.text(18, 16, 'PJ001 · M1.3 Combat', {
      fontSize: '18px',
      color: '#e9f5ef'
    }).setScrollFactor(0).setDepth(10);

    this.subtitle = this.add.text(18, 42, 'Enemy telegraphs before damage · contact alone is safe', {
      fontSize: '11px',
      color: '#a9c9b8'
    }).setScrollFactor(0).setDepth(10);

    this.player = this.add.rectangle(0, 0, 46, 46, 0x68d391)
      .setStrokeStyle(3, 0xeafff2)
      .setDepth(2);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);

    this.playerHpText = this.add.text(0, 16, 'PLAYER HP 5/5', {
      fontSize: '12px',
      color: '#dfffea',
      backgroundColor: '#0c291baa',
      padding: { x: 6, y: 3 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    this.enemy = this.add.rectangle(0, 0, 50, 50, 0xd95c5c)
      .setStrokeStyle(3, 0xffc4c4)
      .setDepth(2);
    this.physics.add.existing(this.enemy);
    this.enemyBody = this.enemy.body as Phaser.Physics.Arcade.Body;
    this.enemyBody.setCollideWorldBounds(true);
    this.enemyBody.setDrag(1100, 1100);
    this.enemyBody.setMaxVelocity(320, 320);

    this.enemyHpText = this.add.text(0, 0, 'HP 3/3', {
      fontSize: '12px',
      color: '#ffd9d9',
      backgroundColor: '#351717aa',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(4);

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

    this.enemyAttackHitbox = this.add.zone(0, 0, this.enemyAttackLength, this.enemyAttackWidth).setDepth(4);
    this.physics.add.existing(this.enemyAttackHitbox);
    this.enemyAttackHitboxBody = this.enemyAttackHitbox.body as Phaser.Physics.Arcade.Body;
    this.enemyAttackHitboxBody.setAllowGravity(false);
    this.enemyAttackHitboxBody.setImmovable(true);
    this.enemyAttackHitboxBody.enable = false;

    this.enemyAttackVisual = this.add.rectangle(
      0,
      0,
      this.enemyAttackLength,
      this.enemyAttackWidth,
      0xffa43a,
      0
    ).setStrokeStyle(3, 0xffd27a, 0).setDepth(1);

    this.physics.add.overlap(this.attackHitbox, this.enemy, () => this.onAttackHitsEnemy());
    this.physics.add.overlap(this.enemyAttackHitbox, this.player, () => this.onEnemyAttackHitsPlayer());

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
      if (
        pointer.x < this.scale.width * 0.5 &&
        pointer.y > this.scale.height * 0.56 &&
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

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => this.layout(gameSize.width, gameSize.height));

    this.layout(this.scale.width, this.scale.height);
    this.updateFacingIndicator();
    this.updateEnemyHud();
    this.updatePlayerHud();
    this.nextEnemyAttackAt = this.time.now + 1200;
  }

  update(): void {
    const keyboardVector = new Phaser.Math.Vector2(
      Number(Boolean(this.cursors.right?.isDown)) - Number(Boolean(this.cursors.left?.isDown)),
      Number(Boolean(this.cursors.down?.isDown)) - Number(Boolean(this.cursors.up?.isDown))
    );

    const movement = keyboardVector.lengthSq() > 0 ? keyboardVector.normalize() : this.moveVector;
    if (!this.playerDown && movement.lengthSq() > 0.01) {
      this.facing.copy(movement).normalize();
    }

    if (this.playerDown) {
      this.playerBody.setVelocity(0, 0);
    } else {
      this.playerBody.setVelocity(
        movement.x * this.playerMoveSpeed,
        movement.y * this.playerMoveSpeed
      );
    }

    this.updateFacingIndicator();

    if (this.attackPhase === 'active') {
      this.positionAttackHitbox();
    }

    if (this.enemyAlive) {
      this.updateEnemyHud();
    }

    if (this.enemyAttackPhase !== 'idle') {
      this.positionEnemyAttackArea();
    }

    if (
      this.enemyAlive &&
      !this.playerDown &&
      this.enemyAttackPhase === 'idle' &&
      this.time.now >= this.nextEnemyAttackAt
    ) {
      const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
      if (distance <= this.enemyAggroRange) {
        this.beginEnemyWindup();
      } else {
        this.nextEnemyAttackAt = this.time.now + 280;
      }
    }
  }

  private layout(width: number, height: number): void {
    const safeSide = Phaser.Math.Clamp(width * 0.035, 14, 26);
    const safeBottom = Phaser.Math.Clamp(height * 0.052, 36, 62);
    this.joystickRadius = Phaser.Math.Clamp(width * 0.08, 49, 58);
    const attackRadius = Phaser.Math.Clamp(width * 0.072, 45, 53);

    this.redrawBackground(width, height);

    const overlayHeight = Phaser.Math.Clamp(height * 0.19, 165, 235);
    this.controlShade.setPosition(0, height - overlayHeight).setSize(width, overlayHeight);

    const joystickX = safeSide + this.joystickRadius + 6;
    const controlsY = height - safeBottom - this.joystickRadius - 10;
    this.joystickBase.setPosition(joystickX, controlsY).setRadius(this.joystickRadius);
    this.joystickKnob.setPosition(joystickX, controlsY);

    const attackX = width - safeSide - attackRadius - 8;
    const attackY = height - safeBottom - attackRadius - 12;
    this.attackButton.setPosition(attackX, attackY).setRadius(attackRadius);
    this.attackLabel.setPosition(attackX, attackY);

    this.title.setPosition(safeSide, 16);
    this.subtitle.setPosition(safeSide, 42);
    this.playerHpText.setPosition(width - safeSide, 16);

    this.physics.world.setBounds(0, 0, width, height);
    this.playerBody.setCollideWorldBounds(true);
    this.enemyBody.setCollideWorldBounds(true);

    if (this.player.x === 0 && this.player.y === 0) {
      this.player.setPosition(width * 0.5, height * 0.56);
    } else {
      this.player.setPosition(
        Phaser.Math.Clamp(this.player.x, 28, width - 28),
        Phaser.Math.Clamp(this.player.y, 72, height - 28)
      );
    }

    if (this.enemy.x === 0 && this.enemy.y === 0) {
      this.enemy.setPosition(width * 0.5, height * 0.32);
      this.enemyBody.updateFromGameObject();
    } else if (this.enemyAlive) {
      this.enemy.setPosition(
        Phaser.Math.Clamp(this.enemy.x, 30, width - 30),
        Phaser.Math.Clamp(this.enemy.y, 92, height - 30)
      );
      this.enemyBody.updateFromGameObject();
    }

    this.updateFacingIndicator();
    this.updateEnemyHud();
    if (this.attackPhase === 'active') {
      this.positionAttackHitbox();
    }
    if (this.enemyAttackPhase !== 'idle') {
      this.positionEnemyAttackArea();
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
    const length = 34;
    this.facingIndicator.setTo(
      this.player.x,
      this.player.y,
      this.player.x + this.facing.x * length,
      this.player.y + this.facing.y * length
    );
  }

  private tryAttack(): void {
    if (this.playerDown || this.attackPhase !== 'idle') {
      return;
    }

    this.attackId += 1;
    this.attackPhase = 'startup';
    this.attackButton.setAlpha(0.72);
    this.attackVisual.setAlpha(0.14).setStrokeStyle(2, 0xfff0ad, 0.28);
    this.positionAttackHitbox();

    this.time.delayedCall(this.attackStartupMs, () => {
      if (this.attackPhase === 'startup') {
        this.beginActiveAttack();
      }
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
      if (this.attackPhase === 'active') {
        this.beginRecovery();
      }
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
    const x = this.player.x + this.facing.x * this.attackReach;
    const y = this.player.y + this.facing.y * this.attackReach;
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

  private onAttackHitsEnemy(): void {
    if (!this.enemyAlive || this.attackPhase !== 'active' || this.lastEnemyHitAttackId === this.attackId) {
      return;
    }

    this.lastEnemyHitAttackId = this.attackId;
    this.enemyHp = Math.max(0, this.enemyHp - 1);

    const knockback = new Phaser.Math.Vector2(this.enemy.x - this.player.x, this.enemy.y - this.player.y);
    if (knockback.lengthSq() < 0.001) {
      knockback.copy(this.facing);
    } else {
      knockback.normalize();
    }

    this.enemyBody.setVelocity(
      knockback.x * this.enemyKnockbackSpeed,
      knockback.y * this.enemyKnockbackSpeed
    );

    this.enemy.setFillStyle(0xffffff).setScale(1.12);
    this.time.delayedCall(70, () => {
      if (this.enemyAlive) {
        this.enemy.setFillStyle(0xd95c5c).setScale(1);
      }
    });

    const impact = this.add.circle(this.enemy.x, this.enemy.y, 18, 0xfff2a8, 0.95).setDepth(6);
    this.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 2.1,
      duration: 130,
      ease: 'Quad.Out',
      onComplete: () => impact.destroy()
    });

    const damageText = this.add.text(this.enemy.x, this.enemy.y - 34, '-1', {
      fontSize: '20px',
      color: '#fff2a8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(7);
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 32,
      alpha: 0,
      duration: 360,
      ease: 'Quad.Out',
      onComplete: () => damageText.destroy()
    });

    this.cameras.main.shake(75, 0.0042);
    this.updateEnemyHud();

    if (this.enemyHp <= 0) {
      this.defeatEnemy();
    }
  }

  private beginEnemyWindup(): void {
    if (!this.enemyAlive || this.playerDown || this.enemyAttackPhase !== 'idle') {
      return;
    }

    const toPlayer = new Phaser.Math.Vector2(this.player.x - this.enemy.x, this.player.y - this.enemy.y);
    if (Math.abs(toPlayer.x) >= Math.abs(toPlayer.y)) {
      this.enemyAttackDirection.set(Math.sign(toPlayer.x) || 1, 0);
    } else {
      this.enemyAttackDirection.set(0, Math.sign(toPlayer.y) || 1);
    }

    this.enemyAttackId += 1;
    this.enemyAttackPhase = 'windup';
    this.positionEnemyAttackArea();
    this.enemyAttackVisual
      .setFillStyle(0xffa43a, 0.2)
      .setStrokeStyle(3, 0xffd27a, 0.75);
    this.enemy.setStrokeStyle(4, 0xffd27a, 1);

    this.time.delayedCall(this.enemyAttackWindupMs, () => {
      if (this.enemyAttackPhase === 'windup' && this.enemyAlive && !this.playerDown) {
        this.beginEnemyActiveAttack();
      }
    });
  }

  private beginEnemyActiveAttack(): void {
    this.enemyAttackPhase = 'active';
    this.positionEnemyAttackArea();
    this.enemyAttackHitboxBody.enable = true;
    this.enemyAttackHitboxBody.updateFromGameObject();
    this.enemyAttackVisual
      .setFillStyle(0xff4b3e, 0.58)
      .setStrokeStyle(3, 0xffc1a8, 0.95);
    this.enemy.setStrokeStyle(4, 0xffffff, 1);
    this.cameras.main.shake(55, 0.0024);

    this.time.delayedCall(this.enemyAttackActiveMs, () => {
      if (this.enemyAttackPhase === 'active') {
        this.beginEnemyRecovery();
      }
    });
  }

  private beginEnemyRecovery(): void {
    this.enemyAttackPhase = 'recovery';
    this.enemyAttackHitboxBody.enable = false;
    this.enemyAttackVisual
      .setFillStyle(0xff4b3e, 0.08)
      .setStrokeStyle(2, 0xffc1a8, 0.18);
    if (this.enemyAlive) {
      this.enemy.setStrokeStyle(3, 0xffc4c4, 1);
    }

    this.time.delayedCall(this.enemyAttackRecoveryMs, () => {
      if (this.enemyAttackPhase !== 'recovery') {
        return;
      }
      this.enemyAttackPhase = 'idle';
      this.enemyAttackVisual
        .setFillStyle(0xff4b3e, 0)
        .setStrokeStyle(2, 0xffc1a8, 0);
      this.nextEnemyAttackAt = this.time.now + this.enemyAttackCooldownMs;
    });
  }

  private positionEnemyAttackArea(): void {
    const x = this.enemy.x + this.enemyAttackDirection.x * this.enemyAttackReach;
    const y = this.enemy.y + this.enemyAttackDirection.y * this.enemyAttackReach;
    const horizontal = Math.abs(this.enemyAttackDirection.x) > 0;
    const width = horizontal ? this.enemyAttackLength : this.enemyAttackWidth;
    const height = horizontal ? this.enemyAttackWidth : this.enemyAttackLength;

    this.enemyAttackHitbox.setPosition(x, y).setSize(width, height);
    this.enemyAttackHitboxBody.setSize(width, height);
    this.enemyAttackHitboxBody.updateFromGameObject();
    this.enemyAttackVisual
      .setPosition(x, y)
      .setSize(width, height);
  }

  private onEnemyAttackHitsPlayer(): void {
    if (
      this.playerDown ||
      this.enemyAttackPhase !== 'active' ||
      this.lastPlayerHitEnemyAttackId === this.enemyAttackId
    ) {
      return;
    }

    this.lastPlayerHitEnemyAttackId = this.enemyAttackId;
    this.playerHp = Math.max(0, this.playerHp - 1);
    this.updatePlayerHud();

    this.player.setFillStyle(0xffffff).setScale(1.1);
    this.time.delayedCall(90, () => {
      if (!this.playerDown) {
        this.player.setFillStyle(0x68d391).setScale(1);
      }
    });

    const damageText = this.add.text(this.player.x, this.player.y - 38, '-1 HP', {
      fontSize: '20px',
      color: '#ffb1aa',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(7);
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 420,
      ease: 'Quad.Out',
      onComplete: () => damageText.destroy()
    });

    this.cameras.main.shake(100, 0.006);

    if (this.playerHp <= 0) {
      this.playerDown = true;
      this.playerBody.setVelocity(0, 0);
      this.player.setFillStyle(0x7d9186).setScale(1);
      this.subtitle.setText('PLAYER DOWN · reload page to reset · death/respawn comes in M1.6');
      this.cancelEnemyAttack();
    }
  }

  private cancelEnemyAttack(): void {
    this.enemyAttackPhase = 'idle';
    this.enemyAttackHitboxBody.enable = false;
    this.enemyAttackVisual
      .setFillStyle(0xff4b3e, 0)
      .setStrokeStyle(2, 0xffc1a8, 0);
    if (this.enemyAlive) {
      this.enemy.setStrokeStyle(3, 0xffc4c4, 1);
    }
    this.nextEnemyAttackAt = this.time.now + 1000;
  }

  private defeatEnemy(): void {
    this.enemyAlive = false;
    this.cancelEnemyAttack();
    this.enemyBody.enable = false;
    this.enemyHpText.setText('DEFEATED').setColor('#fff2a8');

    this.tweens.add({
      targets: this.enemy,
      alpha: 0,
      scale: 1.5,
      angle: 20,
      duration: 240,
      ease: 'Quad.In',
      onComplete: () => {
        this.enemy.setVisible(false);
        this.time.delayedCall(900, () => this.respawnEnemy());
      }
    });
  }

  private respawnEnemy(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.enemyHp = this.enemyMaxHp;
    this.enemyAlive = true;
    this.lastEnemyHitAttackId = -1;
    this.enemy
      .setPosition(width * 0.5, height * 0.3)
      .setAlpha(1)
      .setScale(1)
      .setAngle(0)
      .setFillStyle(0xd95c5c)
      .setStrokeStyle(3, 0xffc4c4, 1)
      .setVisible(true);
    this.enemyBody.enable = true;
    this.enemyBody.setVelocity(0, 0);
    this.enemyBody.updateFromGameObject();
    this.nextEnemyAttackAt = this.time.now + 950;
    this.updateEnemyHud();
  }

  private updateEnemyHud(): void {
    this.enemyHpText.setPosition(this.enemy.x, this.enemy.y - 42);
    if (this.enemyAlive) {
      this.enemyHpText
        .setText(`HP ${this.enemyHp}/${this.enemyMaxHp}`)
        .setColor('#ffd9d9')
        .setVisible(true);
    }
  }

  private updatePlayerHud(): void {
    this.playerHpText
      .setText(`PLAYER HP ${this.playerHp}/${this.playerMaxHp}`)
      .setColor(this.playerHp <= 2 ? '#ffb1aa' : '#dfffea');
  }
}
