import './style.css';

import ConwayGame from './ConwayGame';
import MainScene from './scenes/mainScene';

const config = {
  autoResize: true,
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [MainScene],
};

new ConwayGame(new Phaser.Game(config)); // tslint:disable-line no-unused-expression

window.addEventListener('resize', () => {
  if (ConwayGame.instance.scene.scenes.length === 0) { return; }
  ConwayGame.instance.scene.scenes[0].events.emit('resize');
});
