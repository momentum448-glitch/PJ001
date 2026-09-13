import Phaser from 'phaser';
import { ChargerMovementFixedScene } from './ChargerMovementFixedScene';

type CombatSceneInternals = Record<string, any>;
type CleavePhase = 'idle' | 'startup' | 'recovery';

/**
 * M2.3 adds the first active player skill without redesigning the future
 * three-skill layout. Cleave is a cooldown-only frontal multi-target tool.
 */
export class CleaveGameScene extends ChargerMovementFixedScene {
  private readonly cleaveCooldownMs = 2800;
  private readonly cleaveStartupMs = 120;
  private readonly cleaveRecoveryMs = 260;
  private readonly cleaveRange = 130;
  private readonly cleaveArcDeg = 110;

  private cleaveButton!: Phaser.GameObjects.Arc;
  private cleaveLabel!: Phaser.GameObjects.Text;
  private cleaveVisual!: Phaser.GameObjects.Graphics;
  private cleavePhase: CleavePhase = 'idle';
  private cleaveReadyAt = 0;
  private cleaveDirection = new Phaser.Math.Vector2(1, 0);
  private cleaveGeneration = 0;

  constructor() {
    super();

    const scene = this as unknown as CombatSceneInternals;

    const baseTryAttack = scene.tryAttack.bind(this);
    scene.tryAttack = () => {
      if (this.cleavePhase === 'idle') {
        baseTryAttack();
      }
    };

    const baseTryDodge = scene.tryDodge.bind(this);
    scene.tryDodge = () => {
      if (this.cleavePhase === 'idle') {
        baseTryDodge();
      }
    };

    const baseBeginRespawn = scene.beginRespawn.bind(this);
    scene.beginRespawn = (combat: CombatSceneInternals) => {
      this.cancelCleave(false);
      baseBeginRespawn(combat);
    };

    const baseFinishRespawn = scene.finishRespawn.bind(this);
    scene.finishRespawn = (combat: CombatSceneInternals) => {
      baseFinishRespawn(combat);
      this.cancelCleave(true);
      combat.subtitle?.setText('CLEAVE groups in front · basic attack stays faster');
    };
  }

  create(): void {
    super.create();

    const scene = this as unknown as CombatSceneInternals;
    scene.title.setText('PJ001 · M2.3 Cleave');
    scene.subtitle.setText('CLEAVE groups in front · basic attack stays faster');

    this.cleaveVisual = this.add.graphics().setDepth(4).setAlpha(0);

    this.cleaveButton = this.add.circle(0, 0, 36, 0xd9a441, 0.62)
      .setStrokeStyle(3, 0xffe4a6, 0.72)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive();

    this.cleaveLabel = this.add.text(0, 0, 'CLEAVE', {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11).setInteractive();

    this.cleaveButton.on('pointerdown', () => this.tryCleave());
    this.cleaveLabel.on('pointerdown', () => this.tryCleave());

    this.cleaveReadyAt = this.time.now;
    this.layoutCleaveControl();
  }

  update(): void {
    super.update();
    this.layoutCleaveControl();
    this.updateCleaveButton();
  }

  private tryCleave(): void {
    const scene = this as unknown as CombatSceneInternals;

    if (
      scene.playerDown ||
      scene.respawnPending ||
      scene.isDodging ||
      scene.attackPhase !== 'idle' ||
      this.cleavePhase !== 'idle' ||
      this.time.now < this.cleaveReadyAt
    ) {
      return;
    }

    const aim = typeof scene.chooseAttackDirection === 'function'
      ? scene.chooseAttackDirection(scene)
      : (scene.facing as Phaser.Math.Vector2).clone().normalize();

    this.cleaveDirection.copy(aim).normalize();
    this.cleavePhase = 'startup';
    this.cleaveReadyAt = this.time.now + this.cleaveCooldownMs;
    this.cleaveGeneration += 1;
    const generation = this.cleaveGeneration;

    this.cleaveButton.setAlpha(0.38);
    this.drawCleaveArc(scene, 0.16);

    this.time.delayedCall(this.cleaveStartupMs, () => {
      if (this.cleavePhase !== 'startup' || generation !== this.cleaveGeneration || scene.playerDown) {
        return;
      }
      this.impactCleave(scene, generation);
    });
  }

  private impactCleave(scene: CombatSceneInternals, generation: number): void {
    if (generation !== this.cleaveGeneration || this.cleavePhase !== 'startup') {
      return;
    }

    this.cleavePhase = 'recovery';
    this.drawCleaveArc(scene, 0.48);
    this.cameras.main.shake(70, 0.0032);

    let hitCount = 0;

    if (scene.enemyAlive && scene.enemy?.visible && this.targetInsideCleave(scene, scene.enemy)) {
      this.damageMelee(scene);
      hitCount += 1;
    }

    if (scene.rangedAlive && scene.rangedEnemy?.visible && this.targetInsideCleave(scene, scene.rangedEnemy)) {
      this.damageRanged(scene);
      hitCount += 1;
    }

    if (scene.chargerAlive && scene.charger?.visible && this.targetInsideCleave(scene, scene.charger)) {
      this.damageCharger(scene);
      hitCount += 1;
    }

    if (hitCount > 0) {
      const text = this.add.text(scene.player.x, scene.player.y - 54, `${hitCount} HIT CLEAVE`, {
        fontSize: '15px',
        color: '#ffe6a6',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(8);
      this.tweens.add({
        targets: text,
        y: text.y - 28,
        alpha: 0,
        duration: 420,
        ease: 'Quad.Out',
        onComplete: () => text.destroy()
      });
    }

    this.time.delayedCall(this.cleaveRecoveryMs, () => {
      if (generation !== this.cleaveGeneration || this.cleavePhase !== 'recovery') {
        return;
      }
      this.cleavePhase = 'idle';
    });
  }

  private targetInsideCleave(scene: CombatSceneInternals, target: Phaser.GameObjects.GameObject & { x: number; y: number }): boolean {
    const toTarget = new Phaser.Math.Vector2(target.x - scene.player.x, target.y - scene.player.y);
    const distance = toTarget.length();
    if (distance < 0.001 || distance > this.cleaveRange) {
      return false;
    }

    const targetAngle = Math.atan2(toTarget.y, toTarget.x);
    const cleaveAngle = Math.atan2(this.cleaveDirection.y, this.cleaveDirection.x);
    const delta = Math.abs(Phaser.Math.Angle.Wrap(targetAngle - cleaveAngle));
    return Phaser.Math.RadToDeg(delta) <= this.cleaveArcDeg * 0.5;
  }

  private damageMelee(scene: CombatSceneInternals): void {
    scene.enemyHp = Math.max(0, scene.enemyHp - 1);
    this.flashCleaveTarget(scene.enemy, 0xd95c5c);
    this.pushFromPlayer(scene, scene.enemy, scene.enemyBody, 175);
    scene.updateEnemyHud?.();
    this.spawnCleaveImpact(scene.enemy.x, scene.enemy.y);

    if (scene.enemyHp <= 0) {
      scene.defeatEnemy?.();
    }
  }

  private damageRanged(scene: CombatSceneInternals): void {
    scene.rangedHp = Math.max(0, scene.rangedHp - 1);
    this.flashCleaveTarget(scene.rangedEnemy, 0x8b72df);
    scene.updateRangedHud?.();
    this.spawnCleaveImpact(scene.rangedEnemy.x, scene.rangedEnemy.y);

    if (scene.rangedHp <= 0) {
      scene.defeatRangedEnemy?.();
    }
  }

  private damageCharger(scene: CombatSceneInternals): void {
    scene.chargerHp = Math.max(0, scene.chargerHp - 1);
    const restoreColor = scene.chargerPhase === 'charge' ? 0xff8a4f : 0xe09b45;
    this.flashCleaveTarget(scene.charger, restoreColor);
    scene.updateChargerHud?.();
    this.spawnCleaveImpact(scene.charger.x, scene.charger.y);

    if (scene.chargerHp <= 0) {
      scene.defeatCharger?.();
    }
  }

  private flashCleaveTarget(target: Phaser.GameObjects.Rectangle, restoreColor: number): void {
    target.setFillStyle(0xffffff).setScale(1.12);
    this.time.delayedCall(80, () => {
      if (target.active && target.visible) {
        target.setFillStyle(restoreColor).setScale(1);
      }
    });
  }

  private pushFromPlayer(
    scene: CombatSceneInternals,
    target: { x: number; y: number },
    body: Phaser.Physics.Arcade.Body | undefined,
    speed: number
  ): void {
    if (!body?.enable) {
      return;
    }

    const push = new Phaser.Math.Vector2(target.x - scene.player.x, target.y - scene.player.y);
    if (push.lengthSq() < 0.001) {
      push.copy(this.cleaveDirection);
    } else {
      push.normalize();
    }
    body.setVelocity(push.x * speed, push.y * speed);
  }

  private spawnCleaveImpact(x: number, y: number): void {
    const impact = this.add.circle(x, y, 18, 0xffe2a1, 0.92).setDepth(7);
    this.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 2.2,
      duration: 150,
      ease: 'Quad.Out',
      onComplete: () => impact.destroy()
    });
  }

  private drawCleaveArc(scene: CombatSceneInternals, alpha: number): void {
    if (!this.cleaveVisual || !scene.player) {
      return;
    }

    const angle = Math.atan2(this.cleaveDirection.y, this.cleaveDirection.x);
    const halfArc = Phaser.Math.DegToRad(this.cleaveArcDeg * 0.5);

    this.cleaveVisual.clear();
    this.cleaveVisual.fillStyle(0xffc857, 0.34);
    this.cleaveVisual.lineStyle(3, 0xffedb5, 0.9);
    this.cleaveVisual.beginPath();
    this.cleaveVisual.moveTo(scene.player.x, scene.player.y);
    this.cleaveVisual.arc(
      scene.player.x,
      scene.player.y,
      this.cleaveRange,
      angle - halfArc,
      angle + halfArc,
      false
    );
    this.cleaveVisual.closePath();
    this.cleaveVisual.fillPath();
    this.cleaveVisual.strokePath();
    this.cleaveVisual.setAlpha(alpha);

    this.tweens.killTweensOf(this.cleaveVisual);
    this.tweens.add({
      targets: this.cleaveVisual,
      alpha: 0,
      duration: this.cleaveStartupMs + 180,
      ease: 'Quad.Out'
    });
  }

  private cancelCleave(resetCooldown: boolean): void {
    this.cleaveGeneration += 1;
    this.cleavePhase = 'idle';
    this.cleaveVisual?.clear().setAlpha(0);

    if (resetCooldown) {
      this.cleaveReadyAt = this.time.now;
    }

    this.cleaveButton?.setAlpha(1);
    this.cleaveLabel?.setText('CLEAVE');
  }

  private updateCleaveButton(): void {
    if (!this.cleaveButton || !this.cleaveLabel) {
      return;
    }

    const scene = this as unknown as CombatSceneInternals;
    if (scene.playerDown || scene.respawnPending || this.cleavePhase !== 'idle') {
      this.cleaveButton.setAlpha(0.35);
      if (this.cleavePhase !== 'idle') {
        this.cleaveLabel.setText('CLEAVE');
      }
      return;
    }

    const remaining = Math.max(0, this.cleaveReadyAt - this.time.now);
    if (remaining > 0) {
      this.cleaveButton.setAlpha(0.35);
      this.cleaveLabel.setText(`${Math.ceil(remaining / 100) / 10}s`);
    } else {
      this.cleaveButton.setAlpha(1);
      this.cleaveLabel.setText('CLEAVE');
    }
  }

  private layoutCleaveControl(): void {
    if (!this.cleaveButton || !this.cleaveLabel) {
      return;
    }

    const scene = this as unknown as CombatSceneInternals;
    if (!scene.attackButton || !scene.dodgeButton) {
      return;
    }

    const width = this.scale.width;
    const safeSide = Phaser.Math.Clamp(width * 0.035, 14, 26);
    const radius = Phaser.Math.Clamp(width * 0.052, 32, 38);

    const x = width - safeSide - radius - 14;
    const y = Math.max(108, scene.dodgeButton.y - 86);

    this.cleaveButton.setPosition(x, y).setRadius(radius);
    this.cleaveLabel.setPosition(x, y);
  }
}
