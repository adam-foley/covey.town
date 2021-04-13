/**
 * The Timer provides a wrapper for setting/clearing timeouts and allows for getting the number of elapsed
 * milliseconds and number of remaining milliseconds in timeout. The class was adapted from Reddit user
 * DreamOfAWhale's simple timer implementation from: 
 * https://www.reddit.com/r/learnjavascript/comments/hzc3ux/how_to_find_the_remaining_time_in_settimeout/
 */
export default class Timer {
  private _timer;

  private _endTime: number;

  private _videoLength = 0;

  constructor(fn: () => void, delay: number) {
    this._timer = setTimeout(fn, delay);
    this._endTime = new Date().getTime() + delay;
    this._videoLength = delay;
  }

  clearTimer(): void{
    clearTimeout(this._timer);
  }

  getElapsedSeconds(): number {
    const remainingMiliseconds = (this._endTime - Date.now());
    console.log(remainingMiliseconds)
    const elapsedMiliseconds = this._videoLength - remainingMiliseconds;
    return elapsedMiliseconds / 1000;
  }

}