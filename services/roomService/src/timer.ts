/**
 * The Timer provides a wrapper for setting/clearing timeouts and allows for getting the number of elapsed
 * seconds in timeout. The class was adapted from Reddit user DreamOfAWhale's simple timer implementation from: 
 * https://www.reddit.com/r/learnjavascript/comments/hzc3ux/how_to_find_the_remaining_time_in_settimeout/
 */
export default class Timer {
  /** The setTimout instance that will be used to keep time */
  private _timer;

  /** The end time of the setTimeout based on the provided delay (milliseconds until the function within the setTimeout is called) */
  private _timerEndTime: number;

  /** The length of the timer (in milliseconds)  */
  private _timerLength = 0;

  /**
   * Constructs a new Timer and will call the specified function after the lengthOfTimer has elapsed.
   * @param fn The function to call.
   * @param lengthOfTimer The length of time (milliseconds) until function is called.
   */
  constructor(fn: () => void, lengthOfTimer: number) {
    // Create the setTimeout based on the length of desired timer.
    this._timer = setTimeout(fn, lengthOfTimer);
    // Calculate the "end time" of the timer based on the UTC time now and the length of timer.
    this._timerEndTime = new Date().getTime() + lengthOfTimer;
    // Set the length of the timer.
    this._timerLength = lengthOfTimer;
  }

  /** Clears the timer */
  clearTimer(): void{
    clearTimeout(this._timer);
  }

  /** Returns the seconds that have elapsed since the timer was created */
  getElapsedSeconds(): number {
    // Remaining milliseconds between the end time of the timer and the current UTC time.
    const remainingMiliseconds = (this._timerEndTime - Date.now());
    // Elapsed miliseconds between the length of the timer and the reminaing milliseconds on the timer.
    const elapsedMiliseconds = this._timerLength - remainingMiliseconds;
    // Return converted elpased seconds.
    return elapsedMiliseconds / 1000;
  }

}