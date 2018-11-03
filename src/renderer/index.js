import MainScene from './scenes/mainScene';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [MainScene],
};

window.game = new Phaser.Game(config);
