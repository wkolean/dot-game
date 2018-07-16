/** @private @enum {number|string} */
const options_ = {
  FRAMES_PER_SECOND: 60,
  MIN_DOT_DIAMETER: 10,
  MAX_DOT_DIAMETER: 100,
  NEW_DOT_GENERATION_DELAY: 1000,
  DOT_RESPAWN_DELAY: 1000,
  STROKE_COLOR: 'rgba(0, 0, 0, 1)',
  STROKE_WIDTH: 1,
  DOT_FILL_COLOR: 'rgba(255, 255, 255, 1)',
  BOARD_INNER_PADDING: 5,
  BOARD_QUERY_SELECTOR: 'canvas',
  SPEED_QUERY_SELECTOR: '#speed',
  SCORE_QUERY_SELECTOR: '#score',
  DOT_START_ANGLE: 0,
  DOT_END_ANGLE: Math.PI / 180 * 360,
};

/**
 * @fileOverview Dot Game.
 * Dots move from the top to the bottom of the screen. A player tries to click
 * on the dots, and receives points when they are successful.
 */
class DotGame {
  /**
   * @constructor
   */
  constructor() {
    /** @private {!Element} */
    this.board_ = document.querySelector(this.BOARD_QUERY_SELECTOR);

    /** @private {!Context} */
    this.ctx_ = this.board_.getContext('2d');

    const boundingRect = this.board_.getBoundingClientRect();

    /** @private {number} */
    this.boardWidth_ = boundingRect.width;

    /** @private {number} */
    this.boardHeight_ = boundingRect.height;

    /** @private {Object} */
    this.boardOffsets_ = {
      x: boundingRect.left,
      y: boundingRect.top,
    };

    this.board_.width = this.boardWidth_;
    this.board_.height= this.boardHeight_;

    /** @private {!Element} */
    this.speedInput_ = document.querySelector(this.SPEED_QUERY_SELECTOR);

    /** @private {number} */
    this.score_ = 0;

    /** @private {!Element} */
    this.scoreElement_ = document.querySelector(this.SCORE_QUERY_SELECTOR);

    /** @private {number} */
    this.speed_ = 0;

    /** @private {number} */
    this.fpsInterval_ = null;

    /** @private {number} */
    this.newDotInterval_ = null;

    /** @private {Array<Object>} */
    this.dots_ = [];

    this.setSpeed_();
    this.addListeners_();
  }

  /**
   * Returns the number of frames per second.
   * @return {number}
   */
  get FRAMES_PER_SECOND() {
    return options_.FRAMES_PER_SECOND;
  }

  /**
   * Returns the minimum diameter for a dot.
   * @return {number}
   */
  get MIN_DOT_DIAMETER() {
    return options_.MIN_DOT_DIAMETER;
  }

  /**
   * Returns the maximum diameter for a dot.
   * @return {number}
   */
  get MAX_DOT_DIAMETER() {
    return options_.MAX_DOT_DIAMETER;
  }

  /**
   * Returns the number of milliseconds to wait before creating a new dot.
   * @return {number}
   */
  get NEW_DOT_GENERATION_DELAY() {
    return options_.NEW_DOT_GENERATION_DELAY;
  }

  /**
   * Returns the number of milliseconds before a replacement dot should appear.
   * @return {number}
   */
  get DOT_RESPAWN_DELAY() {
    return options_.DOT_RESPAWN_DELAY;
  }

  /**
   * Returns the color of the dot stroke.
   * @return {string}
   */
  get STROKE_COLOR() {
    return options_.STROKE_COLOR;
  }

  /**
   * Returns the width of the dot stroke.
   * @return {number}
   */
  get STROKE_WIDTH() {
    return options_.STROKE_WIDTH;
  }

  /**
   * Returns the dot fill color.
   * @return {string}
   */
  get DOT_FILL_COLOR() {
    return options_.DOT_FILL_COLOR;
  }

  /**
   * Returns the amount of left and right padding for the board.
   * @return {number}
   */
  get BOARD_INNER_PADDING() {
    return options_.BOARD_INNER_PADDING;
  }

  /**
   * Returns the query selector for the board.
   * @return {string}
   */
  get BOARD_QUERY_SELECTOR() {
    return options_.BOARD_QUERY_SELECTOR;
  }

  /**
   * Returns the query selector for the speed component.
   * @return {string}
   */
  get SPEED_QUERY_SELECTOR() {
    return options_.SPEED_QUERY_SELECTOR;
  }

  /**
   * Returns the query selector for the score element.
   * @return {string}
   */
  get SCORE_QUERY_SELECTOR() {
    return options_.SCORE_QUERY_SELECTOR;
  }

  /**
   * Returns the starting angle in radians for drawing a dot.
   * @return {number}
   */
  get DOT_START_ANGLE() {
    return options_.DOT_START_ANGLE;
  }

  /**
   * Returns the ending angle in radians for drawing a dot.
   * @return {number}
   */
  get DOT_END_ANGLE() {
    return options_.DOT_END_ANGLE;
  }

  /**
   * Adds event listeners.
   * @private
   */
  addListeners_() {
    this.speedInput_.addEventListener('input', (e) => this.setSpeed_(e));
    this.board_.addEventListener('mousedown', (e) => this.hitAttempt_(e));
    this.board_.addEventListener('touchstart', (e) => this.hitAttempt_(e));
  }

  /**
   * Changes speed.
   * @param {?MouseEvent} e
   * @private
   */
  setSpeed_(e) {
    this.speed_ = parseInt(this.speedInput_.value, 10);
  }

  /**
   * Returns a random number between min and max diameter options.
   * @return {number}
   * @private
   */
  getRandomRadius_() {
    const diameter = this.getRandomNumber_(this.MIN_DOT_DIAMETER,
        this.MAX_DOT_DIAMETER);
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
    const padding = this.BOARD_INNER_PADDING;
    const min = radius + this.STROKE_WIDTH + padding;
    const max = this.boardWidth_ - radius - this.STROKE_WIDTH - padding;
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
   * @param {!MouseEvent} e
   * @private
   */
  hitAttempt_(e) {
    e.preventDefault();
    const x = e.pageX - this.boardOffsets_.x;
    const y = e.pageY - this.boardOffsets_.y;

    this.scoreDots_(x, y);
  }

  /**
   * Removes the dots hit by the user and updates the score.
   * @param {number} x
   * @param {number} y
   */
  scoreDots_(x, y) {
    this.dots_ = this.dots_.filter((dot) => {
      this.ctx_.beginPath();
      this.drawDot_(dot);
      this.ctx_.closePath();
      if (this.ctx_.isPointInPath(x, y)) {
        let score = this.calculateDotScore(dot.r);
        this.addToScore_(score);
        setTimeout(this.addDot_.bind(this), this.DOT_RESPAWN_DELAY);
        return false;
      }
      return true;
    });
  }

  /**
   * Calculates the user's score based on the size of the dot.
   * The score value is inversely proportional to the size of the dot,
   * with MIN_DOT_DIAMETER dots worth 10 points, and MAX_DOT_DIAMETER
   * dots worth 1 point.
   *
   * @param {number} radius Radius of the dot.
   * @return {number} Score value.
   * @private
   */
  calculateDotScore(radius) {
    const diameter = radius * 2;
    const score = Math.round(this.MAX_DOT_DIAMETER / diameter);
    return score;
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
   * Renders the dots.
   * @private
   */
  render_() {
    // reset board
    this.ctx_.clearRect(0, 0, this.boardWidth_, this.boardHeight_);

    const dy = this.speed_ / this.FRAMES_PER_SECOND;

    this.dots_.forEach((dot) => {
      dot.y += dy;
      this.ctx_.beginPath();
      this.drawDot_(dot);
      this.ctx_.closePath();
      this.ctx_.stroke();
    });

    this.expireDots_();
  }

  /**
   * Draws dot.
   * @param {object} dot Dot settings.
   * @private
   */
  drawDot_(dot) {
    this.ctx_.strokeStyle = this.STROKE_COLOR;
    this.ctx_.lineWidth = this.STROKE_WIDTH;
    this.ctx_.arc(dot.x, dot.y, dot.r, this.DOT_START_ANGLE,
        this.DOT_END_ANGLE, false);
    this.ctx_.fillStyle = this.DOT_FILL_COLOR;
    this.ctx_.fill();
  }

  /**
   * Adds a new dot.
   * @private
   */
  addDot_() {
    const radius = this.getRandomRadius_();
    const x = this.getRandomX_(radius);
    // position dot offscreen
    const y = -radius - this.STROKE_WIDTH;

    let dot = {
      r: radius,
      x: x,
      y: y,
    };

    this.dots_.push(dot);
  }

  /**
   * Removes dots that have gone off the board.
   * @private
   */
  expireDots_() {
    let isExpired = true;
    let i = 0;

    if (!this.dots_.length) {
      return;
    }

    do {
      if (i < this.dots_.length &&
          this.dots_[i].y - this.dots_[i].r - this.STROKE_WIDTH >
          this.boardHeight_) {
        i++;
      } else {
        isExpired = false;
      }
    } while (isExpired);

    if (i) {
      this.dots_.splice(0, i);
    }
  }

  /**
   * Returns the number of milliseconds for the requested framerate.
   * @param {number} fps Frames per second.
   * @return {number} Number of milliseconds to display each frame.
   */
  getFramerate(fps) {
    return 1000 / fps;
  }

  /**
   * Begins the game.
   */
  begin() {
    const frameRate = this.getFramerate(this.FRAMES_PER_SECOND);
    this.addDot_();
    this.fpsInterval_ = setInterval(this.render_.bind(this), frameRate);
    this.newDotInterval_ = setInterval(this.addDot_.bind(this),
        this.NEW_DOT_GENERATION_DELAY);
  }
}

const dotGame = new DotGame();
dotGame.begin();
