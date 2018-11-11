/**
 * Hold the Phaser's instance game.
 */
export default class ConwayGame {
  /**
   * Phaser instance game available accross the app.
   */
  public static instance: Phaser.Game;

  /**
   * Save a newreference to a phaser instance.
   * @param game Phaser's instance game to save.
   */
  constructor(game: Phaser.Game) {
    ConwayGame.instance = game;
  }
}
