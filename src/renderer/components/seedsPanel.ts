import { Event, ipcRenderer } from 'electron';

export default class SeedsPanel extends Phaser.GameObjects.GameObject {
  private container: Phaser.GameObjects.Container;

  private preferences = {
    borderColor: 0x1B1464,
    color: 0xb2bec3,
    textStyle: { fontFamily: 'Arial', fontSize: 40, color: '#fff' },
  };

  constructor(scene: Phaser.Scene) {
    super(scene, 'SeedsPanel');
    scene.add.existing(this);

    const { innerHeight: h, innerWidth: w } = window;

    const x = w / 2;
    const y = h / 2;

    const { borderColor, color } = this.preferences;

    const textX = w / 2;
    const textY = 10;
    const { textStyle } = this.preferences;

    const background = scene.add
      .rectangle(x, y, w, h, color)
      .setStrokeStyle(5, borderColor);

    const text = scene.add.text(textX, textY, 'seeds', textStyle);

    const seedsBoards = scene.add.container(0, 90);

    this.container = scene.add
      .container(0, 0, [background, text, seedsBoards])
      .setVisible(false)
      .setDepth(3);
  }

  // ~~~~~~~~~~~~~~~~~
  // PUBLIC FUNCTIONS
  // ~~~~~~~~~~~~~~~~~

  public hide() {
    this.container.setVisible(false);

    const seedsBoards = this.container.last as Phaser.GameObjects.Container;
    seedsBoards.removeAll(true);

    return;
  }

  public isVisible() {
    return this.container.visible;
  }

  public show() {
    this.container.setVisible(true);

    const seedsPanel = this.container;

    ipcRenderer.once('get-all-states-reply', (event: Event, seeds: NamedState[]) => {
      seeds
        .filter((seed) => seed.state.length > 0)
        .map((seed, i) => {
          const { name, state } = seed;
          this.createBoard({ i, name, seedsPanel, state });
        });
    });

    ipcRenderer.send('get-all-states');
  }

  // ~~~~~~~~~~~~~~~~~
  // PRIVATE FUNCTIONS
  // ~~~~~~~~~~~~~~~~~

  private createBoard(config: BoardSeedConfig) {
    const { i, name, seedsPanel, state } = config;
    const { innerWidth: panelWidth } = window;

    const seedsBoards = seedsPanel.last as Phaser.GameObjects.Container;

    const rectColor = 0xED4C67;
    const rectMargin = 40;
    const rectWidth = 150;

    const rectPerLine = Math.floor(panelWidth / (rectWidth + rectMargin)) - 1;

    const rectX = (rectWidth + rectMargin) * (i % rectPerLine) + rectWidth;
    const rectY = 100 + (200 * Math.floor(i / rectPerLine));

    const maxStrLength = 20;

    let boardName = name.replace('.json', '');

    boardName = boardName.length > maxStrLength ?
      boardName.substring(0, maxStrLength) + '...' : boardName;

    const style = { fontFamily: 'Arial', fontSize: 20, color: '#fff' };
    const textX = rectX - (rectWidth / 2);
    const textY = rectY + (rectWidth / 1.75);

    const text = this.scene.add.text(textX, textY, `${boardName}`, style);

    const rect = this.scene.add
      .rectangle(rectX, rectY, rectWidth, rectWidth, rectColor)
      .setInteractive();

    rect
      .on('pointerover', () => {
        rect.setScale(1.2, 1.2);
      })
      .on('pointerout', () => {
        rect.setScale(1, 1);
      })
      .on('pointerdown', () => {
        this.scene.events.emit('loadBoard', state);

        seedsPanel.setVisible(false);
        seedsBoards.removeAll(true);
      });

    seedsBoards
      .add(rect)
      .add(text);
  }
}
