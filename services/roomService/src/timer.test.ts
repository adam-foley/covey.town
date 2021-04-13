import Timer from './timer';

describe('CoveyTownController', () => {
  let timer : Timer
  let delay : number
  let createTimerTime : number  
  beforeEach(() => {
    jest.useFakeTimers();
    delay = 60000
    createTimerTime = new Date().getTime();
    Date.now = jest.fn().mockImplementation(()=> createTimerTime);
    timer = new Timer(() => { return true; }, delay);
  });
  afterEach(() =>{
    timer.clearTimer();
  });
  it('should get elapsed seconds for the current timer when time has elapsed', () => {
    /* Set the time of Date.now to be 35000 milliseconds from when the timer was created
       meaning that there should be 35 seconds elapsed on the timer. */
    Date.now = jest.fn().mockImplementation(()=> createTimerTime + 35000);
    expect(timer.getElapsedSeconds()).toBe(35);
  });
  it('should get elapsed seconds for the current timer when time has not elapsed', () => {
    /* Set the time of Date.now to be equal to when the timer was created
    meaning that there should be o seconds elapsed on the timer. */
    Date.now = jest.fn().mockImplementation(()=> createTimerTime + 0);
    expect(timer.getElapsedSeconds()).toBe(0);
  });
  it('should call clearTimeout when clearTimer is called', () => {
    timer.clearTimer()
    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });
  it('should call function when timer is completed', () => {
    // fast forwards the timer, causing the settimeout function to be called.
    jest.runAllTimers();
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });
});
