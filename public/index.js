/** @private @enum {number|string} */
const options_ = {
  FRAMES_PER_SECOND: 60,
  MIN_DOT_DIAMETER: 10,
  MAX_DOT_DIAMETER: 100,
  DOT_GENERATION_RATE: 1000,
  DOT_RESPAWN_DELAY: 1000,
  STROKE_COLOR: 'black',
  STROKE_WIDTH: 1,
  BOARD_INNER_PADDING: 5,
  BOARD_QUERY_SELECTOR: 'canvas',
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
    this.board_ = document.querySelector(this.BOARD_QUERY_SELECTOR);

    /** @private {!Context} */
    this.ctx_ = this.board_.getContext('2d');
    this.ctx_.strokeStyle = this.STROKE_COLOR;
    this.ctx_.lineWidth = this.STROKE_WIDTH;

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
   * Returns the query selector for the board.
   * @return {number}
   */
  get BOARD_QUERY_SELECTOR() {
    return options_.BOARD_QUERY_SELECTOR;
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
  get DOT_GENERATION_RATE() {
    return options_.DOT_GENERATION_RATE;
  }

  /**
   * Returns the number of milliseconds before a replacement dot should appear.
   * @return {number}
   */
  get DOT_RESPAWN_DELAY() {
    return options_.DOT_RESPAWN_DELAY;
  }

  /**
   * Returns the color of the stroke.
   * @return {string}
   */
  get STROKE_COLOR() {
    return options_.STROKE_COLOR;
  }

  /**
   * Returns the width of the stroke.
   * @return {number}
   */
  get STROKE_WIDTH() {
    return options_.STROKE_WIDTH;
  }

  /**
   * Returns the amount of padding for the board.
   * @return {number}
   */
  get BOARD_INNER_PADDING() {
    return options_.BOARD_INNER_PADDING;
  }

  /**
   * Returns the number of frames per second.
   * @return {number}
   */
  get FRAMES_PER_SECOND() {
    return options_.FRAMES_PER_SECOND;
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
   * @param {!MouseEvent} e
   * @private
   */
  setSpeed_(e) {
    this.speed_ = parseInt(e.target.value, 10);
  }

  /**
   * Returns a random number between min and max diameter options_.
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
        let score = Math.round(this.MAX_DOT_DIAMETER / diameter);
        this.addToScore_(score);
        setTimeout(this.addDot_.bind(this), this.DOT_RESPAWN_DELAY);
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
   * Renders the dots.
   * @private
   */
  render_() {
    // reset board
    this.ctx_.clearRect(0, 0, this.boardWidth_, this.boardHeight_);

    const dy = this.speed_ / this.FRAMES_PER_SECOND;

    this.ctx_.beginPath();
    this.dots_.forEach((dot) => {
      dot.y += dy;
      this.ctx_.moveTo(dot.x + dot.r, dot.y);
      this.ctx_.arc(dot.x, dot.y, dot.r, 0, this.radians_, false);
      this.ctx_.closePath();
    });
    this.ctx_.stroke();

    this.expireDots_();
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
   * Remove dots that have gone off the board
   */
  expireDots_() {
    let isExpired = false;
    let i = 0;

    if (!this.dots_.length) {
      return;
    }

    do {
      if (i < this.dots_.length &&
          this.dots_[i].y - this.dots_[i].r - this.STROKE_WIDTH >
          this.boardHeight_) {
        i++;
        isExpired = true;
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
   * @return {number} Number of milliseconds to display a frame.
   */
  getFramerate(fps) {
    return 1000 / fps;
  }

  /**
   * Begins the game.
   */
  begin() {
    const frameRate = this.getFramerate(this.FRAMES_PER_SECOND);
    this.fpsInterval_ = setInterval(this.render_.bind(this), frameRate);
    this.newDotInterval_ = setInterval(this.addDot_.bind(this),
        this.DOT_GENERATION_RATE);
    this.addDot_();
  }
}

const dotGame = new DotGame();
dotGame.begin();
