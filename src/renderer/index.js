import './style.css';

import MainScene from './scenes/mainScene';

const config = {
  autoResize: true,
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [MainScene],
};

window.game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  if (window.game.scene.scenes.length === 0) { return; }
  window.game.scene.scenes[0].events.emit('resize')
});
