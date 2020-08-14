import './style.css';

import ConwayGame from './ConwayGame';
import MainScene from './scenes/mainScene';

const config = {
  autoResize: true,
  backgroundColor: '0x191A1A',
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [MainScene],
};

new ConwayGame(new Phaser.Game(config)); // tslint:disable-line no-unused-expression
