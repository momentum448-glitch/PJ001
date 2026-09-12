import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';

type CombatSceneInternals = Record<string, any>;

/**
 * Device-tuned M1 combat scene.
 *
 * M1.6 preserves the accepted phone tuning and M1.5 soft aim, then completes
 * the sandbox loop with a clean automatic checkpoint respawn.
 */
export class TunedGameScene extends GameScene {
  private readonly softAimRange = 155;
  private readonly softAimConeDeg = 28;
  private readonly softAimMaxCorrectionDeg = 14;
  private readonly softAimStrength = 0.6;
  private readonly respawnDelayMs = 1200;

  private attackAimDirection = new Phaser.Math.Vector2(1, 0);
  private respawnAt = 0;
  private respawnPending = false;
  private deathCount = 0;
  private checkpointMarker!: Phaser.GameObjects.Arc;
  private respawnStatus!: Phaser.GameObjects.Text;

  constructor() {
    super();

    const scene = this as unknown as CombatSceneInternals;

    Object.assign(scene, {
      playerMoveSpeed: 195,
      dodgeSpeed: 450
    });

    const baseTryAttack = scene.tryAttack.bind(this);
    scene.tryAttack = () => {
      if (!scene.playerDown && !scene.isDodging && scene.attackPhase === 'idle') {
        this.attackAimDirection.copy(this.chooseAttackDirection(scene));
      }
      baseTryAttack();
    };

    const basePositionAttackHitbox = scene.positionAttackHitbox.bind(this);
    scene.positionAttackHitbox = () => {
      const manualFacing = scene.facing;
      scene.facing = this.attackAimDirection;
      basePositionAttackHitbox();
      scene.facing = manualFacing;
    };

    const baseEnemyHit = scene.onEnemyAttackHitsPlayer.bind(this);
    scene.onEnemyAttackHitsPlayer = () => {
      const wasDown = Boolean(scene.playerDown);
      baseEnemyHit();
      if (!wasDown && scene.playerDown) {
        this.beginRespawn(scene);
      }
    };

    const baseUpdatePlayerHud = scene.updatePlayerHud.bind(this);
    scene.updatePlayerHud = () => {
      baseUpdatePlayerHud();
      if (scene.playerHpText) {
        scene.playerHpText.setText(`HP ${scene.playerHp}/${scene.playerMaxHp} · DEATHS ${this.deathCount}`);
      }
    };
  }

  create(): void {
    super.create();

    const scene = this as unknown as CombatSceneInternals;
    this.attackAimDirection.copy(scene.facing);
    scene.title.setText('PJ001 · M1.6 Sandbox');
    scene.subtitle.setText('Fight · dodge · die · respawn · repeat');

    this.checkpointMarker = this.add.circle(0, 0, 30, 0x7fd9ff, 0.08)
      .setStrokeStyle(2, 0x9be5ff, 0.42)
      .setDepth(0);

    this.respawnStatus = this.add.text(0, 74, '', {
      fontSize: '14px',
      color: '#e8fbff',
      backgroundColor: '#0b2027cc',
      padding: { x: 8, y: 5 },
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(20).setVisible(false);

    scene.updatePlayerHud();
    this.layoutM16Hud();
  }

  update(): void {
    super.update();

    this.layoutM16Hud();

    if (this.respawnPending) {
      const remaining = Math.max(0, this.respawnAt - this.time.now);
      this.respawnStatus
        .setVisible(true)
        .setText(`RESPAWN ${Math.max(0.1, remaining / 1000).toFixed(1)}s`);

      if (remaining <= 0) {
        this.finishRespawn(this as unknown as CombatSceneInternals);
      }
    }
  }

  private chooseAttackDirection(scene: CombatSceneInternals): Phaser.Math.Vector2 {
    const manualFacing = (scene.facing as Phaser.Math.Vector2).clone().normalize();

    if (!scene.enemyAlive || !scene.enemy?.visible || !scene.player || !scene.enemy) {
      return manualFacing;
    }

    const toEnemy = new Phaser.Math.Vector2(
      scene.enemy.x - scene.player.x,
      scene.enemy.y - scene.player.y
    );
    const distance = toEnemy.length();

    if (distance < 0.001 || distance > this.softAimRange) {
      return manualFacing;
    }

    toEnemy.normalize();

    const facingAngle = Math.atan2(manualFacing.y, manualFacing.x);
    const targetAngle = Math.atan2(toEnemy.y, toEnemy.x);
    const delta = Phaser.Math.Angle.Wrap(targetAngle - facingAngle);
    const deltaDeg = Phaser.Math.RadToDeg(Math.abs(delta));

    if (deltaDeg > this.softAimConeDeg) {
      return manualFacing;
    }

    const maxCorrection = Phaser.Math.DegToRad(this.softAimMaxCorrectionDeg);
    const correction = Phaser.Math.Clamp(
      delta * this.softAimStrength,
      -maxCorrection,
      maxCorrection
    );
    const correctedAngle = facingAngle + correction;

    return new Phaser.Math.Vector2(
      Math.cos(correctedAngle),
      Math.sin(correctedAngle)
    ).normalize();
  }

  private beginRespawn(scene: CombatSceneInternals): void {
    if (this.respawnPending) {
      return;
    }

    this.deathCount += 1;
    this.respawnPending = true;
    this.respawnAt = this.time.now + this.respawnDelayMs;

    scene.playerBody?.setVelocity(0, 0);
    scene.moveVector?.set(0, 0);
    scene.releaseJoystick?.();

    scene.attackPhase = 'idle';
    if (scene.attackHitboxBody) {
      scene.attackHitboxBody.enable = false;
    }
    scene.attackVisual?.setAlpha(0).setStrokeStyle(2, 0xfff0ad, 0);
    scene.attackButton?.setAlpha(0.35);

    scene.isDodging = false;
    scene.dodgeEndsAt = 0;
    scene.player?.setAlpha(1);
    scene.dodgeButton?.setAlpha(0.35);

    scene.cancelEnemyAttack?.();
    if (scene.enemyAttackHitboxBody) {
      scene.enemyAttackHitboxBody.enable = false;
    }
    scene.enemyBody?.setVelocity(0, 0);

    scene.updatePlayerHud?.();
    scene.subtitle?.setText('DOWN · checkpoint respawn is automatic');
  }

  private finishRespawn(scene: CombatSceneInternals): void {
    this.respawnPending = false;
    this.respawnAt = 0;

    const width = this.scale.width;
    const height = this.scale.height;
    const checkpointX = width * 0.5;
    const checkpointY = height * 0.56;

    scene.playerDown = false;
    scene.playerHp = scene.playerMaxHp;
    scene.player
      ?.setPosition(checkpointX, checkpointY)
      .setAlpha(1)
      .setScale(1)
      .setFillStyle(0x68d391)
      .setStrokeStyle(3, 0xeafff2, 1);
    scene.playerBody?.setVelocity(0, 0);
    scene.playerBody?.updateFromGameObject();

    scene.moveVector?.set(0, 0);
    scene.facing?.set(1, 0);
    this.attackAimDirection.set(1, 0);
    scene.joystickPointerId = null;
    scene.joystickKnob?.setPosition(scene.joystickBase.x, scene.joystickBase.y);

    scene.attackPhase = 'idle';
    scene.attackId += 1;
    scene.lastEnemyHitAttackId = -1;
    if (scene.attackHitboxBody) {
      scene.attackHitboxBody.enable = false;
    }
    scene.attackVisual?.setAlpha(0).setStrokeStyle(2, 0xfff0ad, 0);
    scene.attackButton?.setAlpha(1);

    scene.isDodging = false;
    scene.dodgeEndsAt = 0;
    scene.dodgeReadyAt = this.time.now;
    scene.dodgeButton?.setAlpha(1);
    scene.dodgeLabel?.setText('DODGE');

    this.resetEnemyForFreshFight(scene, width, height);

    scene.updateFacingIndicator?.();
    scene.updatePlayerHud?.();
    scene.updateEnemyHud?.();
    scene.subtitle?.setText('Fight · dodge · die · respawn · repeat');

    this.respawnStatus.setText('RESPAWNED').setVisible(true);
    this.time.delayedCall(550, () => {
      if (!this.respawnPending) {
        this.respawnStatus.setVisible(false);
      }
    });
  }

  private resetEnemyForFreshFight(scene: CombatSceneInternals, width: number, height: number): void {
    scene.cancelEnemyAttack?.();
    scene.enemyAttackPhase = 'idle';
    scene.enemyAttackId += 1;
    scene.lastPlayerHitEnemyAttackId = -1;
    if (scene.enemyAttackHitboxBody) {
      scene.enemyAttackHitboxBody.enable = false;
    }
    scene.enemyAttackVisual
      ?.setFillStyle(0xff4b3e, 0)
      .setStrokeStyle(2, 0xffc1a8, 0);

    scene.enemyHp = scene.enemyMaxHp;
    scene.enemyAlive = true;
    scene.lastEnemyHitAttackId = -1;
    scene.enemy
      ?.setPosition(width * 0.5, height * 0.30)
      .setAlpha(1)
      .setScale(1)
      .setAngle(0)
      .setFillStyle(0xd95c5c)
      .setStrokeStyle(3, 0xffc4c4, 1)
      .setVisible(true);
    if (scene.enemyBody) {
      scene.enemyBody.enable = true;
      scene.enemyBody.setVelocity(0, 0);
      scene.enemyBody.updateFromGameObject();
    }
    scene.nextEnemyAttackAt = this.time.now + 1000;
  }

  private layoutM16Hud(): void {
    if (!this.checkpointMarker || !this.respawnStatus) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    this.checkpointMarker.setPosition(width * 0.5, height * 0.56);
    this.respawnStatus.setPosition(width * 0.5, 74);
  }
}
