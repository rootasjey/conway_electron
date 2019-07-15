import { Control } from '../const/control';

export default class ButtonsControl extends Phaser.GameObjects.GameObject {
  private buttonsList: {
    editionMode: Phaser.GameObjects.Container,
    play: Phaser.GameObjects.Container,
    pause: Phaser.GameObjects.Container,
    restart: Phaser.GameObjects.Container,
    seeds: Phaser.GameObjects.Container,
  };

  constructor(scene: Phaser.Scene) {
    super(scene, 'ButtonsControl');

    this.buttonsList = {
      editionMode: this.createEditionModeButton(),
      play: this.createPlayButton(),
      pause: this.createPauseButton(),
      restart: this.createRestartButton(),
      seeds: this.createSeedsButton(),
    };

    this.listToEvents();
  }

  private listToEvents() {
    this.scene.events.on('controlChanged', this.controlChanged, this);

    return this;
  }

  private controlChanged(config: ControlChangedConfig) {
    const { newControl } = config;
    const { play, pause } = this.buttonsList;

    switch (newControl) {
      case Control.pause:
        pause.setVisible(false);
        play.setVisible(true);
        break;

      case Control.play:
        play.setVisible(false);
        pause.setVisible(true);
        break;

      case Control.editionModeAdd:
        // console.log('should show edtition add');
        break;

      case Control.editionModeRemove:
        // console.log('should show edtition remove');
        break;

      default:
        break;
    }
  }

  private createEditionModeButton() {
    const { innerWidth: x } = window;
    const y = 190;
    const color = 0xFFC312;

    const r1 = this.scene.add.rectangle(0, 0, 10, 50, color);
    const r2 = this.scene.add.rectangle(0, 0, 50, 10, color);

    const editionMode = this.scene.add
      .container(x - 50, y, [r1, r2])
      .setSize(50, 100)
      .setInteractive()
      .setAlpha(.8)
      .setDepth(2);

    editionMode.once('destroy', () => {
      r1.destroy();
      r2.destroy();
    });

    editionMode.on('pointerdown', () => {
      this.scene.events.emit('control:toggleEditionMode');
    });

    editionMode
      .on('pointerover', () => {
        editionMode.setAlpha(1);
      })
      .on('pointerout', () => {
        editionMode.setAlpha(.8);
      });

    return editionMode;
  }

  private createPauseButton() {
    const { innerWidth: x } = window;
    const y = 40;

    // Pause button
    const r1 = this.scene.add.rectangle(0, 0, 10, 50, 0x6666ff);
    const r2 = this.scene.add.rectangle(20, 0, 10, 50, 0x6666ff);

    const pause = this.scene.add
      .container(x - 60, y, [r1, r2])
      .setSize(50, 100)
      .setInteractive()
      .setAlpha(.8)
      .setVisible(false)
      .setDepth(2);

    pause.once('destroy', () => {
      r1.destroy();
      r2.destroy();
    });

    pause.on('pointerdown', () => {
      this.scene.events.emit('control:pause');
    });

    pause
      .on('pointerover', () => {
        pause.setAlpha(1);
      })
      .on('pointerout', () => {
        pause.setAlpha(.8);
      });

    return pause;
  }

  private createPlayButton() {
    const { innerWidth: x } = window;
    const y = 40;

    const triangle = this.scene.add.triangle(0, 0, 0, 0, 0, 45, 45, 22.5, 0xe84118);

    const play = this.scene.add
      .container(x - 45, y, [triangle])
      .setSize(50, 60)
      .setInteractive()
      .setAlpha(.8)
      .setDepth(2);

    play.on('pointerdown', () => {
      this.scene.events.emit('control:play');
    });

    play
      .on('pointerover', () => {
        play.setAlpha(1);
      })
      .on('pointerout', () => {
        play.setAlpha(.8);
      });

    return play;
  }

  private createRestartButton() {
    const { innerWidth: x } = window;
    const y = 40;

    const circle = this.scene.add
      .circle(0, 10, 20)
      .setStrokeStyle(10, 0x00a8ff);

    const triangle = this.scene.add
      .triangle(-17, 5, 0, 0, 0, 30, 30, 8, 0x00a8ff)
      .setRotation(39);

    const restart = this.scene.add
      .container(
        x - 45,
        y + 60,
        [circle, triangle],
      )
      .setSize(50, 60)
      .setInteractive()
      .setAlpha(.8)
      .setDepth(2);

    restart.once('destroy', () => {
      circle.destroy();
      triangle.destroy();
    });

    restart
      .on('pointerup', () => {
        this.scene.events.emit('control:restart');
      })
      .on('pointerover', () => {
        restart.setAlpha(1);
      })
      .on('pointerout', () => {
        restart.setAlpha(.8);
      });

    return restart;
  }

  private createSeedsButton() {
    const { innerWidth: x, innerHeight: y } = window;
    const color = 0xA3CB38;
    const borderColor = 0x009432;
    const w = 70;
    const h = 30;

    const textX = -w;
    const textY = 20 - h;
    const style = { fontFamily: 'Arial', fontSize: 20, color: '#009432' };

    const r1 = this.scene.add
      .rectangle((w / 2) - (w + 10), 0, w, h, color)
      .setStrokeStyle(4, borderColor);

    const text = this.scene.add
      .text(textX, textY, 'seeds', style)
      .setDepth(1);

    const seeds = this.scene.add
      .container((x - 10), y - h, [r1, text])
      .setSize(w * 2, h * 2)
      .setInteractive()
      .setDepth(4);

    seeds.once('destroy', () => {
      r1.destroy();
      text.destroy();
    });

    seeds
      .on('pointerdown', () => {
        this.scene.events.emit('control:toggleSeedsPanel');
      })
      .on('pointerover', () => {
        seeds.setScale(1.1, 1.1);
      })
      .on('pointerout', () => {
        seeds.setScale(1, 1);
      });

    return seeds;
  }
}
