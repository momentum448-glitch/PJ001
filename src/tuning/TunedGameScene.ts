import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';

type CombatSceneInternals = Record<string, any>;

type RangedProjectile = {
  orb: Phaser.GameObjects.Arc;
  body: Phaser.Physics.Arcade.Body;
};

/**
 * Device-tuned combat scene.
 *
 * M2.1 preserves the accepted M1 phone tuning and introduces a second,
 * deliberately simple ranged enemy so mixed-threat readability can be tested
 * before skills or the charger archetype are added.
 */
export class TunedGameScene extends GameScene {
  private readonly softAimRange = 155;
  private readonly softAimConeDeg = 28;
  private readonly softAimMaxCorrectionDeg = 14;
  private readonly softAimStrength = 0.6;
  private readonly respawnDelayMs = 1200;

  private readonly rangedMaxHp = 2;
  private readonly rangedWindupMs = 700;
  private readonly rangedCooldownMs = 1400;
  private readonly rangedProjectileSpeed = 220;
  private readonly rangedAggroRange = 620;

  private attackAimDirection = new Phaser.Math.Vector2(1, 0);
  private respawnAt = 0;
  private respawnPending = false;
  private deathCount = 0;
  private checkpointMarker!: Phaser.GameObjects.Arc;
  private respawnStatus!: Phaser.GameObjects.Text;

  private rangedEnemy!: Phaser.GameObjects.Rectangle;
  private rangedBody!: Phaser.Physics.Arcade.Body;
  private rangedHpText!: Phaser.GameObjects.Text;
  private rangedTelegraph!: Phaser.GameObjects.Rectangle;
  private rangedHp = this.rangedMaxHp;
  private rangedAlive = true;
  private rangedWindup = false;
  private rangedFireAt = 0;
  private nextRangedAttackAt = 0;
  private rangedAimDirection = new Phaser.Math.Vector2(-1, 1).normalize();
  private rangedLastHitAttackId = -1;
  private rangedRespawnGeneration = 0;
  private readonly projectiles = new Set<RangedProjectile>();

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
    scene.title.setText('PJ001 · M2.1 Mixed Encounter');
    scene.subtitle.setText('Melee + ranged shooter · dodge the projectile');

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

    this.rangedEnemy = this.add.rectangle(0, 0, 44, 44, 0x8b72df)
      .setStrokeStyle(3, 0xd9d0ff)
      .setDepth(2);
    this.physics.add.existing(this.rangedEnemy);
    this.rangedBody = this.rangedEnemy.body as Phaser.Physics.Arcade.Body;
    this.rangedBody.setAllowGravity(false).setImmovable(true).setCollideWorldBounds(true);

    this.rangedHpText = this.add.text(0, 0, 'RANGED HP 2/2', {
      fontSize: '11px',
      color: '#e6ddff',
      backgroundColor: '#241b45bb',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    this.rangedTelegraph = this.add.rectangle(0, 0, 116, 16, 0xffb347, 0)
      .setStrokeStyle(2, 0xffe1a3, 0)
      .setDepth(1);

    this.physics.add.overlap(scene.attackHitbox, this.rangedEnemy, () => this.onAttackHitsRanged(scene));

    scene.updatePlayerHud();
    this.resetRangedForFreshFight();
    this.layoutM2Hud();
  }

  update(): void {
    super.update();

    const scene = this as unknown as CombatSceneInternals;
    this.layoutM2Hud();
    this.updateRangedEncounter(scene);
    this.updateProjectiles(scene);

    if (this.respawnPending) {
      const remaining = Math.max(0, this.respawnAt - this.time.now);
      this.respawnStatus
        .setVisible(true)
        .setText(`RESPAWN ${Math.max(0.1, remaining / 1000).toFixed(1)}s`);

      if (remaining <= 0) {
        this.finishRespawn(scene);
      }
    }
  }

  private chooseAttackDirection(scene: CombatSceneInternals): Phaser.Math.Vector2 {
    const manualFacing = (scene.facing as Phaser.Math.Vector2).clone().normalize();
    const candidates: Array<{ x: number; y: number }> = [];

    if (scene.enemyAlive && scene.enemy?.visible) {
      candidates.push({ x: scene.enemy.x, y: scene.enemy.y });
    }
    if (this.rangedAlive && this.rangedEnemy?.visible) {
      candidates.push({ x: this.rangedEnemy.x, y: this.rangedEnemy.y });
    }

    let bestDelta: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    const facingAngle = Math.atan2(manualFacing.y, manualFacing.x);

    for (const candidate of candidates) {
      const toTarget = new Phaser.Math.Vector2(candidate.x - scene.player.x, candidate.y - scene.player.y);
      const distance = toTarget.length();
      if (distance < 0.001 || distance > this.softAimRange) {
        continue;
      }

      const targetAngle = Math.atan2(toTarget.y, toTarget.x);
      const delta = Phaser.Math.Angle.Wrap(targetAngle - facingAngle);
      const deltaDeg = Phaser.Math.RadToDeg(Math.abs(delta));
      if (deltaDeg > this.softAimConeDeg) {
        continue;
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        bestDelta = delta;
      }
    }

    if (bestDelta === null) {
      return manualFacing;
    }

    const maxCorrection = Phaser.Math.DegToRad(this.softAimMaxCorrectionDeg);
    const correction = Phaser.Math.Clamp(
      bestDelta * this.softAimStrength,
      -maxCorrection,
      maxCorrection
    );
    const correctedAngle = facingAngle + correction;

    return new Phaser.Math.Vector2(Math.cos(correctedAngle), Math.sin(correctedAngle)).normalize();
  }

  private updateRangedEncounter(scene: CombatSceneInternals): void {
    if (!this.rangedAlive || scene.playerDown || this.respawnPending) {
      this.hideRangedTelegraph();
      return;
    }

    this.rangedHpText.setPosition(this.rangedEnemy.x, this.rangedEnemy.y - 38);

    if (this.rangedWindup) {
      this.positionRangedTelegraph();
      if (this.time.now >= this.rangedFireAt) {
        this.fireRangedProjectile(scene);
      }
      return;
    }

    if (this.time.now < this.nextRangedAttackAt) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.rangedEnemy.x,
      this.rangedEnemy.y,
      scene.player.x,
      scene.player.y
    );

    if (distance <= this.rangedAggroRange) {
      this.beginRangedWindup(scene);
    } else {
      this.nextRangedAttackAt = this.time.now + 300;
    }
  }

  private beginRangedWindup(scene: CombatSceneInternals): void {
    const toPlayer = new Phaser.Math.Vector2(
      scene.player.x - this.rangedEnemy.x,
      scene.player.y - this.rangedEnemy.y
    );
    if (toPlayer.lengthSq() < 0.001) {
      toPlayer.set(0, 1);
    }

    this.rangedAimDirection.copy(toPlayer.normalize());
    this.rangedWindup = true;
    this.rangedFireAt = this.time.now + this.rangedWindupMs;
    this.rangedEnemy.setStrokeStyle(4, 0xffd27a, 1);
    this.rangedTelegraph.setFillStyle(0xffb347, 0.28).setStrokeStyle(2, 0xffe1a3, 0.78);
    this.positionRangedTelegraph();
  }

  private positionRangedTelegraph(): void {
    const angle = Math.atan2(this.rangedAimDirection.y, this.rangedAimDirection.x);
    this.rangedTelegraph
      .setPosition(
        this.rangedEnemy.x + this.rangedAimDirection.x * 58,
        this.rangedEnemy.y + this.rangedAimDirection.y * 58
      )
      .setRotation(angle);
  }

  private hideRangedTelegraph(): void {
    if (!this.rangedTelegraph) {
      return;
    }
    this.rangedTelegraph.setFillStyle(0xffb347, 0).setStrokeStyle(2, 0xffe1a3, 0);
  }

  private fireRangedProjectile(scene: CombatSceneInternals): void {
    this.rangedWindup = false;
    this.hideRangedTelegraph();
    this.rangedEnemy.setStrokeStyle(3, 0xd9d0ff, 1);
    this.nextRangedAttackAt = this.time.now + this.rangedCooldownMs;

    const orb = this.add.circle(
      this.rangedEnemy.x + this.rangedAimDirection.x * 30,
      this.rangedEnemy.y + this.rangedAimDirection.y * 30,
      10,
      0xb89cff,
      0.95
    ).setStrokeStyle(2, 0xf2ecff, 0.9).setDepth(5);

    this.physics.add.existing(orb);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setCircle(10);
    body.setVelocity(
      this.rangedAimDirection.x * this.rangedProjectileSpeed,
      this.rangedAimDirection.y * this.rangedProjectileSpeed
    );

    const projectile: RangedProjectile = { orb, body };
    this.projectiles.add(projectile);

    this.physics.add.overlap(orb, scene.player, () => {
      if (!this.projectiles.has(projectile)) {
        return;
      }
      this.destroyProjectile(projectile);
      this.onProjectileHitsPlayer(scene);
    });
  }

  private onProjectileHitsPlayer(scene: CombatSceneInternals): void {
    if (scene.playerDown || this.respawnPending || scene.isDodging) {
      return;
    }

    scene.playerHp = Math.max(0, scene.playerHp - 1);
    scene.updatePlayerHud?.();
    scene.player?.setFillStyle(0xffffff).setScale(1.1);
    this.time.delayedCall(90, () => {
      if (!scene.playerDown && !scene.isDodging) {
        scene.player?.setFillStyle(0x68d391).setScale(1);
      }
    });

    const damageText = this.add.text(scene.player.x, scene.player.y - 38, '-1 HP', {
      fontSize: '20px',
      color: '#d9c8ff',
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
    this.cameras.main.shake(90, 0.0048);

    if (scene.playerHp <= 0) {
      scene.playerDown = true;
      scene.isDodging = false;
      scene.playerBody?.setVelocity(0, 0);
      scene.player?.setAlpha(1).setFillStyle(0x7d9186).setScale(1);
      this.beginRespawn(scene);
    }
  }

  private updateProjectiles(scene: CombatSceneInternals): void {
    const margin = 40;
    const width = this.scale.width;
    const height = this.scale.height;

    for (const projectile of Array.from(this.projectiles)) {
      if (
        projectile.orb.x < -margin ||
        projectile.orb.x > width + margin ||
        projectile.orb.y < -margin ||
        projectile.orb.y > height + margin ||
        scene.playerDown
      ) {
        this.destroyProjectile(projectile);
      }
    }
  }

  private destroyProjectile(projectile: RangedProjectile): void {
    if (!this.projectiles.delete(projectile)) {
      return;
    }
    projectile.body.enable = false;
    projectile.orb.destroy();
  }

  private clearProjectiles(): void {
    for (const projectile of Array.from(this.projectiles)) {
      this.destroyProjectile(projectile);
    }
  }

  private onAttackHitsRanged(scene: CombatSceneInternals): void {
    if (
      !this.rangedAlive ||
      scene.attackPhase !== 'active' ||
      this.rangedLastHitAttackId === scene.attackId
    ) {
      return;
    }

    this.rangedLastHitAttackId = scene.attackId;
    this.rangedHp = Math.max(0, this.rangedHp - 1);
    this.rangedEnemy.setFillStyle(0xffffff).setScale(1.1);
    this.time.delayedCall(70, () => {
      if (this.rangedAlive) {
        this.rangedEnemy.setFillStyle(0x8b72df).setScale(1);
      }
    });

    const impact = this.add.circle(this.rangedEnemy.x, this.rangedEnemy.y, 16, 0xe8ddff, 0.95).setDepth(6);
    this.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 2,
      duration: 130,
      ease: 'Quad.Out',
      onComplete: () => impact.destroy()
    });

    this.updateRangedHud();
    this.cameras.main.shake(65, 0.0034);

    if (this.rangedHp <= 0) {
      this.defeatRangedEnemy();
    }
  }

  private defeatRangedEnemy(): void {
    this.rangedAlive = false;
    this.rangedWindup = false;
    this.rangedRespawnGeneration += 1;
    const generation = this.rangedRespawnGeneration;
    this.hideRangedTelegraph();
    this.rangedBody.enable = false;
    this.rangedHpText.setText('RANGED DOWN').setColor('#fff2a8');

    this.tweens.add({
      targets: this.rangedEnemy,
      alpha: 0,
      scale: 1.4,
      duration: 220,
      onComplete: () => {
        this.rangedEnemy.setVisible(false);
        this.time.delayedCall(1100, () => {
          if (!this.respawnPending && generation === this.rangedRespawnGeneration) {
            this.resetRangedForFreshFight();
          }
        });
      }
    });
  }

  private updateRangedHud(): void {
    if (!this.rangedHpText) {
      return;
    }
    this.rangedHpText.setPosition(this.rangedEnemy.x, this.rangedEnemy.y - 38);
    if (this.rangedAlive) {
      this.rangedHpText
        .setText(`RANGED HP ${this.rangedHp}/${this.rangedMaxHp}`)
        .setColor('#e6ddff')
        .setVisible(true);
    }
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

    this.rangedWindup = false;
    this.hideRangedTelegraph();
    this.clearProjectiles();
    this.rangedBody?.setVelocity(0, 0);

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

    this.resetMeleeForFreshFight(scene, width, height);
    this.resetRangedForFreshFight();
    this.clearProjectiles();

    scene.updateFacingIndicator?.();
    scene.updatePlayerHud?.();
    scene.updateEnemyHud?.();
    scene.subtitle?.setText('Melee + ranged shooter · dodge the projectile');

    this.respawnStatus.setText('RESPAWNED').setVisible(true);
    this.time.delayedCall(550, () => {
      if (!this.respawnPending) {
        this.respawnStatus.setVisible(false);
      }
    });
  }

  private resetMeleeForFreshFight(scene: CombatSceneInternals, width: number, height: number): void {
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
      ?.setPosition(width * 0.38, height * 0.30)
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

  private resetRangedForFreshFight(): void {
    if (!this.rangedEnemy) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    this.rangedRespawnGeneration += 1;
    this.rangedHp = this.rangedMaxHp;
    this.rangedAlive = true;
    this.rangedWindup = false;
    this.rangedLastHitAttackId = -1;
    this.rangedFireAt = 0;
    this.nextRangedAttackAt = this.time.now + 1250;
    this.hideRangedTelegraph();
    this.rangedEnemy
      .setPosition(width * 0.72, height * 0.24)
      .setAlpha(1)
      .setScale(1)
      .setAngle(0)
      .setFillStyle(0x8b72df)
      .setStrokeStyle(3, 0xd9d0ff, 1)
      .setVisible(true);
    this.rangedBody.enable = true;
    this.rangedBody.setVelocity(0, 0);
    this.rangedBody.updateFromGameObject();
    this.updateRangedHud();
  }

  private layoutM2Hud(): void {
    if (!this.checkpointMarker || !this.respawnStatus) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    this.checkpointMarker.setPosition(width * 0.5, height * 0.56);
    this.respawnStatus.setPosition(width * 0.5, 74);

    if (this.rangedAlive && this.rangedEnemy) {
      this.rangedEnemy.setPosition(
        Phaser.Math.Clamp(this.rangedEnemy.x, 26, width - 26),
        Phaser.Math.Clamp(this.rangedEnemy.y, 90, height - 26)
      );
      this.rangedBody.updateFromGameObject();
      this.updateRangedHud();
      if (this.rangedWindup) {
        this.positionRangedTelegraph();
      }
    }
  }
}
