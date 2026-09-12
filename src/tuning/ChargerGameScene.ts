import Phaser from 'phaser';
import { TunedGameScene } from './TunedGameScene';

type CombatSceneInternals = Record<string, any>;
type ChargerPhase = 'idle' | 'windup' | 'charge' | 'recovery';

/**
 * M2.2 layers a committed charger archetype on top of the device-accepted
 * M2.1 melee + ranged encounter. The charger never deals passive contact
 * damage: only overlap during the explicit charge phase can hurt the player.
 */
export class ChargerGameScene extends TunedGameScene {
  private readonly chargerMaxHp = 3;
  private readonly chargerWindupMs = 650;
  private readonly chargerSpeed = 360;
  private readonly chargerDurationMs = 420;
  private readonly chargerRecoveryMs = 650;
  private readonly chargerCooldownMs = 900;
  private readonly chargerAggroRange = 520;

  private charger!: Phaser.GameObjects.Rectangle;
  private chargerBody!: Phaser.Physics.Arcade.Body;
  private chargerHpText!: Phaser.GameObjects.Text;
  private chargerTelegraph!: Phaser.GameObjects.Rectangle;

  private chargerHp = this.chargerMaxHp;
  private chargerAlive = true;
  private chargerPhase: ChargerPhase = 'idle';
  private chargerPhaseEndsAt = 0;
  private nextChargeAt = 0;
  private chargerDirection = new Phaser.Math.Vector2(1, 0);
  private chargerAttackId = 0;
  private lastPlayerHitChargeId = -1;
  private chargerLastHitAttackId = -1;
  private chargerRespawnGeneration = 0;

  constructor() {
    super();

    const scene = this as unknown as CombatSceneInternals;

    const baseChooseAttackDirection = scene.chooseAttackDirection.bind(this);
    scene.chooseAttackDirection = (combat: CombatSceneInternals) => {
      const manualFacing = (combat.facing as Phaser.Math.Vector2).clone().normalize();
      const candidates: Array<{ x: number; y: number }> = [];

      if (combat.enemyAlive && combat.enemy?.visible) {
        candidates.push({ x: combat.enemy.x, y: combat.enemy.y });
      }
      if (scene.rangedAlive && scene.rangedEnemy?.visible) {
        candidates.push({ x: scene.rangedEnemy.x, y: scene.rangedEnemy.y });
      }
      if (this.chargerAlive && this.charger?.visible) {
        candidates.push({ x: this.charger.x, y: this.charger.y });
      }

      if (candidates.length === 0) {
        return baseChooseAttackDirection(combat);
      }

      const range = 155;
      const coneDeg = 28;
      const maxCorrection = Phaser.Math.DegToRad(14);
      const strength = 0.6;
      const facingAngle = Math.atan2(manualFacing.y, manualFacing.x);
      let bestDelta: number | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const candidate of candidates) {
        const toTarget = new Phaser.Math.Vector2(
          candidate.x - combat.player.x,
          candidate.y - combat.player.y
        );
        const distance = toTarget.length();
        if (distance < 0.001 || distance > range) {
          continue;
        }

        const targetAngle = Math.atan2(toTarget.y, toTarget.x);
        const delta = Phaser.Math.Angle.Wrap(targetAngle - facingAngle);
        if (Phaser.Math.RadToDeg(Math.abs(delta)) > coneDeg) {
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

      const correction = Phaser.Math.Clamp(bestDelta * strength, -maxCorrection, maxCorrection);
      const correctedAngle = facingAngle + correction;
      return new Phaser.Math.Vector2(Math.cos(correctedAngle), Math.sin(correctedAngle)).normalize();
    };

    const baseBeginRespawn = scene.beginRespawn.bind(this);
    scene.beginRespawn = (combat: CombatSceneInternals) => {
      this.cancelChargerAttack();
      baseBeginRespawn(combat);
    };

    const baseFinishRespawn = scene.finishRespawn.bind(this);
    scene.finishRespawn = (combat: CombatSceneInternals) => {
      baseFinishRespawn(combat);
      this.resetChargerForFreshFight();
      combat.subtitle?.setText('Melee + ranged + charger · read three threat types');
    };
  }

  create(): void {
    super.create();

    const scene = this as unknown as CombatSceneInternals;
    scene.title.setText('PJ001 · M2.2 Charger');
    scene.subtitle.setText('Melee + ranged + charger · read three threat types');

    this.charger = this.add.rectangle(0, 0, 50, 50, 0xe09b45)
      .setStrokeStyle(3, 0xffdfaa)
      .setDepth(2);
    this.physics.add.existing(this.charger);
    this.chargerBody = this.charger.body as Phaser.Physics.Arcade.Body;
    this.chargerBody.setAllowGravity(false).setCollideWorldBounds(true);
    this.chargerBody.setMaxVelocity(this.chargerSpeed, this.chargerSpeed);

    this.chargerHpText = this.add.text(0, 0, 'CHARGER HP 3/3', {
      fontSize: '11px',
      color: '#ffe3ba',
      backgroundColor: '#44280fbb',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    this.chargerTelegraph = this.add.rectangle(0, 0, 190, 32, 0xff7a3d, 0)
      .setStrokeStyle(3, 0xffd0a5, 0)
      .setOrigin(0, 0.5)
      .setDepth(1);

    this.physics.add.overlap(scene.attackHitbox, this.charger, () => this.onAttackHitsCharger(scene));
    this.physics.add.overlap(this.charger, scene.player, () => this.onChargerTouchesPlayer(scene));

    this.resetChargerForFreshFight();
  }

  update(): void {
    super.update();

    const scene = this as unknown as CombatSceneInternals;
    this.layoutCharger();
    this.updateCharger(scene);
  }

  private updateCharger(scene: CombatSceneInternals): void {
    if (!this.chargerAlive || scene.playerDown || scene.respawnPending) {
      this.chargerBody?.setVelocity(0, 0);
      this.hideChargerTelegraph();
      return;
    }

    this.updateChargerHud();

    if (this.chargerPhase === 'windup') {
      this.positionChargerTelegraph();
      if (this.time.now >= this.chargerPhaseEndsAt) {
        this.beginCharge();
      }
      return;
    }

    if (this.chargerPhase === 'charge') {
      this.chargerBody.setVelocity(
        this.chargerDirection.x * this.chargerSpeed,
        this.chargerDirection.y * this.chargerSpeed
      );
      if (this.time.now >= this.chargerPhaseEndsAt) {
        this.beginRecovery();
      }
      return;
    }

    if (this.chargerPhase === 'recovery') {
      this.chargerBody.setVelocity(0, 0);
      if (this.time.now >= this.chargerPhaseEndsAt) {
        this.chargerPhase = 'idle';
        this.nextChargeAt = this.time.now + this.chargerCooldownMs;
        this.charger.setStrokeStyle(3, 0xffdfaa, 1);
      }
      return;
    }

    this.chargerBody.setVelocity(0, 0);
    if (this.time.now < this.nextChargeAt) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.charger.x,
      this.charger.y,
      scene.player.x,
      scene.player.y
    );

    if (distance <= this.chargerAggroRange) {
      this.beginChargerWindup(scene);
    } else {
      this.nextChargeAt = this.time.now + 300;
    }
  }

  private beginChargerWindup(scene: CombatSceneInternals): void {
    const toPlayer = new Phaser.Math.Vector2(
      scene.player.x - this.charger.x,
      scene.player.y - this.charger.y
    );
    if (toPlayer.lengthSq() < 0.001) {
      toPlayer.set(0, 1);
    }

    this.chargerDirection.copy(toPlayer.normalize());
    this.chargerPhase = 'windup';
    this.chargerPhaseEndsAt = this.time.now + this.chargerWindupMs;
    this.charger.setStrokeStyle(5, 0xff704d, 1);
    this.chargerTelegraph
      .setFillStyle(0xff7a3d, 0.22)
      .setStrokeStyle(3, 0xffd0a5, 0.78);
    this.positionChargerTelegraph();
  }

  private beginCharge(): void {
    this.chargerPhase = 'charge';
    this.chargerAttackId += 1;
    this.chargerPhaseEndsAt = this.time.now + this.chargerDurationMs;
    this.hideChargerTelegraph();
    this.charger.setStrokeStyle(5, 0xfff1bf, 1).setFillStyle(0xff8a4f);
    this.chargerBody.setVelocity(
      this.chargerDirection.x * this.chargerSpeed,
      this.chargerDirection.y * this.chargerSpeed
    );
  }

  private beginRecovery(): void {
    this.chargerPhase = 'recovery';
    this.chargerPhaseEndsAt = this.time.now + this.chargerRecoveryMs;
    this.chargerBody.setVelocity(0, 0);
    this.charger.setFillStyle(0xe09b45).setStrokeStyle(3, 0xb97935, 0.75);
  }

  private onChargerTouchesPlayer(scene: CombatSceneInternals): void {
    if (
      this.chargerPhase !== 'charge' ||
      scene.playerDown ||
      scene.respawnPending ||
      scene.isDodging ||
      this.lastPlayerHitChargeId === this.chargerAttackId
    ) {
      return;
    }

    this.lastPlayerHitChargeId = this.chargerAttackId;
    scene.playerHp = Math.max(0, scene.playerHp - 1);
    scene.updatePlayerHud?.();

    scene.player?.setFillStyle(0xffffff).setScale(1.12);
    this.time.delayedCall(90, () => {
      if (!scene.playerDown && !scene.isDodging) {
        scene.player?.setFillStyle(0x68d391).setScale(1);
      }
    });

    const damageText = this.add.text(scene.player.x, scene.player.y - 38, '-1 CHARGE', {
      fontSize: '18px',
      color: '#ffd0a6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(7);
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 28,
      alpha: 0,
      duration: 420,
      ease: 'Quad.Out',
      onComplete: () => damageText.destroy()
    });
    this.cameras.main.shake(100, 0.0054);

    if (scene.playerHp <= 0) {
      scene.playerDown = true;
      scene.isDodging = false;
      scene.playerBody?.setVelocity(0, 0);
      scene.player?.setAlpha(1).setFillStyle(0x7d9186).setScale(1);
      scene.beginRespawn?.(scene);
    }
  }

  private onAttackHitsCharger(scene: CombatSceneInternals): void {
    if (
      !this.chargerAlive ||
      scene.attackPhase !== 'active' ||
      this.chargerLastHitAttackId === scene.attackId
    ) {
      return;
    }

    this.chargerLastHitAttackId = scene.attackId;
    this.chargerHp = Math.max(0, this.chargerHp - 1);
    this.charger.setFillStyle(0xffffff).setScale(1.1);
    this.time.delayedCall(75, () => {
      if (this.chargerAlive) {
        const fill = this.chargerPhase === 'charge' ? 0xff8a4f : 0xe09b45;
        this.charger.setFillStyle(fill).setScale(1);
      }
    });

    const impact = this.add.circle(this.charger.x, this.charger.y, 18, 0xffd6a6, 0.95).setDepth(6);
    this.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 2,
      duration: 140,
      ease: 'Quad.Out',
      onComplete: () => impact.destroy()
    });
    this.cameras.main.shake(70, 0.0036);
    this.updateChargerHud();

    if (this.chargerHp <= 0) {
      this.defeatCharger();
    }
  }

  private defeatCharger(): void {
    this.chargerAlive = false;
    this.cancelChargerAttack();
    this.chargerRespawnGeneration += 1;
    const generation = this.chargerRespawnGeneration;
    this.chargerBody.enable = false;
    this.chargerHpText.setText('CHARGER DOWN').setColor('#fff2a8');

    this.tweens.add({
      targets: this.charger,
      alpha: 0,
      scale: 1.45,
      duration: 230,
      onComplete: () => {
        this.charger.setVisible(false);
        this.time.delayedCall(1200, () => {
          const scene = this as unknown as CombatSceneInternals;
          if (!scene.respawnPending && generation === this.chargerRespawnGeneration) {
            this.resetChargerForFreshFight();
          }
        });
      }
    });
  }

  private cancelChargerAttack(): void {
    this.chargerPhase = 'idle';
    this.chargerPhaseEndsAt = 0;
    this.hideChargerTelegraph();
    if (this.chargerBody) {
      this.chargerBody.setVelocity(0, 0);
    }
  }

  private resetChargerForFreshFight(): void {
    if (!this.charger) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    this.chargerRespawnGeneration += 1;
    this.chargerHp = this.chargerMaxHp;
    this.chargerAlive = true;
    this.chargerPhase = 'idle';
    this.chargerPhaseEndsAt = 0;
    this.nextChargeAt = this.time.now + 1500;
    this.lastPlayerHitChargeId = -1;
    this.chargerLastHitAttackId = -1;
    this.hideChargerTelegraph();

    this.charger
      .setPosition(width * 0.22, height * 0.23)
      .setAlpha(1)
      .setScale(1)
      .setAngle(0)
      .setFillStyle(0xe09b45)
      .setStrokeStyle(3, 0xffdfaa, 1)
      .setVisible(true);
    this.chargerBody.enable = true;
    this.chargerBody.setVelocity(0, 0);
    this.chargerBody.updateFromGameObject();
    this.updateChargerHud();
  }

  private updateChargerHud(): void {
    if (!this.chargerHpText) {
      return;
    }
    this.chargerHpText.setPosition(this.charger.x, this.charger.y - 40);
    if (this.chargerAlive) {
      this.chargerHpText
        .setText(`CHARGER HP ${this.chargerHp}/${this.chargerMaxHp}`)
        .setColor('#ffe3ba')
        .setVisible(true);
    }
  }

  private positionChargerTelegraph(): void {
    if (!this.chargerTelegraph) {
      return;
    }
    const angle = Math.atan2(this.chargerDirection.y, this.chargerDirection.x);
    this.chargerTelegraph
      .setPosition(this.charger.x, this.charger.y)
      .setRotation(angle);
  }

  private hideChargerTelegraph(): void {
    if (!this.chargerTelegraph) {
      return;
    }
    this.chargerTelegraph
      .setFillStyle(0xff7a3d, 0)
      .setStrokeStyle(3, 0xffd0a5, 0);
  }

  private layoutCharger(): void {
    if (!this.chargerAlive || !this.charger) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    this.charger.setPosition(
      Phaser.Math.Clamp(this.charger.x, 28, width - 28),
      Phaser.Math.Clamp(this.charger.y, 92, height - 28)
    );
    this.chargerBody.updateFromGameObject();
    this.updateChargerHud();

    if (this.chargerPhase === 'windup') {
      this.positionChargerTelegraph();
    }
  }
}
