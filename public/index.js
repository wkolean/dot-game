/** @enum {number|string} */
const options = {
  FRAMES_PER_SECOND: 30,
  MIN_DOT_DIAMETER: 10,
  MAX_DOT_DIAMETER: 100,
  DOT_GENERATION_RATE: 1000,
  DOT_RESPAWN_DELAY: 1000,
  STROKE_COLOR: 'black',
  STROKE_WIDTH: 1,
  BOARD_INNER_PADDING: 5,
};

/**
 * @fileOverview Dot Game
 */
class DotGame {
  /**
   * @constructor
   */
  constructor() {
    /** @private {!Element} */
    this.canvas_ = document.querySelector('canvas');

    /** @private {!Context} */
    this.ctx_ = this.canvas_.getContext('2d');
    this.ctx_.strokeStyle = DotGame.strokeColor;
    this.ctx_.lineWidth = DotGame.strokeWidth;

    const boundingRect = this.canvas_.getBoundingClientRect();

    /** @private {number} */
    this.boardWidth_ = boundingRect.width;

    /** @private {number} */
    this.boardHeight_ = boundingRect.height;

    /** @private {Object} */
    this.boardOffsets_ = {
      x: boundingRect.left,
      y: boundingRect.top,
    };

    this.canvas_.width = this.boardWidth_;
    this.canvas_.height= this.boardHeight_;

    /** @private {!Element} */
    this.speedInput_ = document.querySelector('#speed');

    /** @private {number} */
    this.score_ = 0;

    /** @private {!Element} */
    this.scoreElement_ = document.querySelector('#score');

    /** @private {number} */
    this.speed_ = this.speedInput_.value;

    /** @private {number} */
    this.fpsInterval_ = null;

    /** @private {number} */
    this.radians_ = (Math.PI / 180 * 360);

    /** @private {Array<Object>} */
    this.dots_ = [];

    this.addListeners_();
  }

  /**
   * Returns the minimum diameter for a dot.
   * @return {number}
   */
  static get minDiameter() {
    return options.MIN_DOT_DIAMETER;
  }

  /**
   * Returns the maximum diameter for a dot.
   * @return {number}
   */
  static get maxDiameter() {
    return options.MAX_DOT_DIAMETER;
  }

  /**
   * Returns the number of milliseconds to wait before creating a new dot.
   * @return {number}
   */
  static get newDotRate() {
    return options.DOT_GENERATION_RATE;
  }

  /**
   * Returns the number of milliseconds before a replacement dot should appear.
   * @return {number}
   */
  static get dotRespawnRate() {
    return options.DOT_RESPAWN_DELAY;
  }

  /**
   * Returns the color of the stroke.
   * @return {string}
   */
  static get strokeColor() {
    return options.STROKE_COLOR;
  }

  /**
   * Returns the width of the stroke.
   * @return {number}
   */
  static get strokeWidth() {
    return options.STROKE_WIDTH;
  }

  /**
   * Returns the amount of padding for the board.
   * @return {number}
   */
  static get boardPadding() {
    return options.BOARD_INNER_PADDING;
  }

  /**
   * Returns the number of frames per second.
   * @return {number}
   */
  static get fps() {
    return options.FRAMES_PER_SECOND;
  }

  /**
   * Adds event listeners.
   * @private
   */
  addListeners_() {
    this.speedInput_.addEventListener('input', (e) => this.setSpeed_(e));
    this.canvas_.addEventListener('mousedown', (e) => this.hitAttempt_(e));
    this.canvas_.addEventListener('touchstart', (e) => this.hitAttempt_(e));
  }

  /**
   * Changes speed.
   * @param {!MouseEvent} e
   * @private
   */
  setSpeed_(e) {
    this.speed_ = parseInt(e.target.value, 10);
  }

  /**
   * Returns a random number between min and max diameter options.
   * @return {number}
   * @private
   */
  getRandomRadius_() {
    const diameter = this.getRandomNumber_(DotGame.minDiameter,
        DotGame.maxDiameter);
    const radius = diameter / 2;
    return radius;
  }

  /**
   * Returns a random X position.
   * @param {number} radius Radius of the dot.
   * @return {number} X position.
   * @private
   */
  getRandomX_(radius) {
    const padding = DotGame.boardPadding;
    const min = radius + DotGame.strokeWidth + padding;
    const max = this.boardWidth_ - radius - DotGame.strokeWidth - padding;
    return this.getRandomNumber_(min, max);
  }

  /**
   * Returns a random number between min and max inclusive.
   * @param {number} min
   * @param {number} max
   * @return {number}
   * @private
   */
  getRandomNumber_(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Checks if user pressed on a dot.
   * @param {?MouseEvent} e
   * @private
   */
  hitAttempt_(e) {
    e.preventDefault();
    const x = e.pageX - this.boardOffsets_.x;
    const y = e.pageY - this.boardOffsets_.y;

    if (this.ctx_.isPointInPath(x, y)) {
      this.scoreDots_(x, y);
    }
  }

  /**
   * Removes the dots that contain the x and y coordinates
   * @param {number} x
   * @param {number} y
   */
  scoreDots_(x, y) {
    this.dots_ = this.dots_.filter((dot) => {
      this.ctx_.beginPath();
      this.ctx_.arc(dot.x, dot.y, dot.r, 0, this.radians_, false);
      this.ctx_.closePath();
      if (this.ctx_.isPointInPath(x, y)) {
        let diameter = dot.r * 2;
        let score = Math.round(DotGame.maxDiameter / diameter);
        this.addToScore_(score);
        setTimeout(this.addDot_.bind(this), DotGame.dotRespawnRate);
        return false;
      }
      return true;
    });
  }

  /**
   * Increments the user's score.
   * @param {number} score
   * @private
   */
  addToScore_(score) {
    this.score_ += score;
    this.scoreElement_.textContent = this.score_;
  }

  /**
   * Updates the board.
   * @private
   */
  updateBoard() {
    window.requestAnimationFrame(this.render_.bind(this));
  }

  /**
   * Renders the dots.
   * @private
   */
  render_() {
    // reset board
    this.ctx_.clearRect(0, 0, this.boardWidth_, this.boardHeight_);

    const dy = this.speed_ / DotGame.fps;

    this.ctx_.beginPath();
    this.dots_.forEach((dot) => {
      dot.y += dy;
      this.ctx_.moveTo(dot.x + dot.r, dot.y);
      this.ctx_.arc(dot.x, dot.y, dot.r, 0, this.radians_, false);
      this.ctx_.closePath();
    });
    this.ctx_.stroke();
  }

  /**
   * Adds a new dot.
   * @private
   */
  addDot_() {
    const radius = this.getRandomRadius_();
    const x = this.getRandomX_(radius);
    const y = -radius;

    let dot = {
      r: radius,
      x: x,
      y: y,
    };

    this.dots_.push(dot);
  }

  /**
   * Returns the number of milliseconds for the requested framerate.
   * @param {number} fps Frames per second.
   * @return {number} Number of milliseconds to display a frame.
   */
  getFramerate(fps) {
    return 1000 / fps;
  }

  /**
   * Begins the game.
   */
  begin() {
    const fps = this.getFramerate(DotGame.FRAMES_PER_SECOND);
    this.fpsInterval_ = setInterval(this.updateBoard.bind(this), fps);
    this.newDotInterval_ = setInterval(this.addDot_.bind(this),
        DotGame.newDotRate);
  }
}

const dotGame = new DotGame();
dotGame.begin();
