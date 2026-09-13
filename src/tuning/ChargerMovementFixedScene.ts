import Phaser from 'phaser';
import { ChargerGameScene } from './ChargerGameScene';

type ChargerSceneInternals = Record<string, any>;

/**
 * Hotfix for M2.2: ChargerGameScene.layoutCharger() was calling
 * body.updateFromGameObject() every frame, which resynced the Arcade body
 * from the display object and prevented velocity-driven charge movement.
 *
 * This override lets Arcade Physics own movement. We only reposition/sync
 * when the charger actually escapes the safe viewport bounds.
 */
export class ChargerMovementFixedScene extends ChargerGameScene {
  constructor() {
    super();

    const scene = this as unknown as ChargerSceneInternals;
    scene.layoutCharger = () => {
      if (!scene.chargerAlive || !scene.charger || !scene.chargerBody) {
        return;
      }

      const width = this.scale.width;
      const height = this.scale.height;
      const clampedX = Phaser.Math.Clamp(scene.charger.x, 28, width - 28);
      const clampedY = Phaser.Math.Clamp(scene.charger.y, 92, height - 28);

      if (clampedX !== scene.charger.x || clampedY !== scene.charger.y) {
        scene.charger.setPosition(clampedX, clampedY);
        scene.chargerBody.updateFromGameObject();
      }

      scene.updateChargerHud?.();

      if (scene.chargerPhase === 'windup') {
        scene.positionChargerTelegraph?.();
      }
    };
  }
}
