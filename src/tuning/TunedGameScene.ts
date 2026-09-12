import { GameScene } from '../scenes/GameScene';

/**
 * Device-tuned M1.4 values. Kept in a tiny wrapper so the combat scene stays
 * unchanged while we validate feel on the target phone.
 */
export class TunedGameScene extends GameScene {
  constructor() {
    super();

    Object.assign(this as unknown as Record<string, number>, {
      playerMoveSpeed: 195,
      dodgeSpeed: 450
    });
  }
}
