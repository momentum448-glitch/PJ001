import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';

type CombatSceneInternals = Record<string, any>;

/**
 * Device-tuned M1 combat scene.
 *
 * M1.5 keeps the accepted M1.4 phone tuning and adds a deliberately small,
 * attack-local aim correction. The player's real facing is never changed by
 * aim assist, and there is no persistent target or lock-on state.
 */
export class TunedGameScene extends GameScene {
  private readonly softAimRange = 155;
  private readonly softAimConeDeg = 28;
  private readonly softAimMaxCorrectionDeg = 14;
  private readonly softAimStrength = 0.6;
  private attackAimDirection = new Phaser.Math.Vector2(1, 0);

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
  }

  create(): void {
    super.create();

    const scene = this as unknown as CombatSceneInternals;
    this.attackAimDirection.copy(scene.facing);
    scene.title.setText('PJ001 · M1.5 Soft Aim');
    scene.subtitle.setText('Near-miss attacks get a small forward correction · no lock-on');
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
}
