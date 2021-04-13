/**
 * The Timer provides a wrapper for setting/clearing timeouts and allows for getting the number of elapsed
 * milliseconds and number of remaining milliseconds in timeout. The class was adapted from Reddit user
 * DreamOfAWhale's simple timer implementation from: 
 * https://www.reddit.com/r/learnjavascript/comments/hzc3ux/how_to_find_the_remaining_time_in_settimeout/
 */
export default class Timer {
  id;

  endTime: number;

  videoLength = 0;

  constructor(fn: () => void, delay: number) {
    this.id = setTimeout(fn, delay);
    this.endTime = new Date().getTime() + delay;
    this.videoLength = delay;
  }

  clearTimer(): void{
    clearTimeout(this.id);
  }

  getRemainingMiliseconds(): number {
    const remainingTime = (this.endTime - new Date().getTime());
    return remainingTime > 0 ? remainingTime : 0;
  }

  getElapsedMiliseconds(): number {
    const elapsedTime = this.videoLength - this.getRemainingMiliseconds() + 1;
    return elapsedTime > 0 ? elapsedTime : 0;
  }

  getElapsedSeconds(): number {
    return this.getElapsedMiliseconds() / 1000;
  }

}