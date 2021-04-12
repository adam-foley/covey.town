import Timer from './timer';

// ADAM
describe('CoveyTownController', () => {
  let timer : Timer
  let delay : number
  beforeEach(() => {
    jest.useFakeTimers();
    delay = 1000
    timer = new Timer(() => { return true }, delay)
  });
  afterEach(() =>{
    timer.clearTimer() 
  });
  it('constructor should set the end time property', () => {
    let createTime = new Date().getTime()
    expect(timer.endTime).toBe(createTime + delay)
  });
  it('constructor should set the video length property', () => {
    expect(timer.videoLength).toBeCloseTo(delay)
  });
  // it('constructor should set the id property', () => {
  //   let delay = 1000
  //   const timer = new Timer(() => { return true}, delay)
  //   expect(timer.id["ref"]).toBe(setTimeout)
  // });
  it('should get remaining milliseconds for the current timer', () => {

    // const Date().time() = jest.fn()
    // Date().time().mockReturnValueOnce(0).mockReturnValueOnce(300);
    
    // jest.advanceTimersByTime(300);
    // //const elapsed = 500
    let trueTimeRemaining = timer.endTime - new Date().getTime()
    let timerTimeRemaining = timer.getRemainingMiliseconds()
    //expect(timer.getRemainingMiliseconds()).toBe(1000)

    setTimeout(() => { 
      expect( trueTimeRemaining - timerTimeRemaining).toBeLessThan(5)}
      ,1000)
  });
  it('should get elapsed milliseconds for the current timer', () => {
    /*const elapsed = 500
    setTimeout(() => { 
      let trueTimeElapsedSeconds = timer.videoLength - timer.getRemainingMiliseconds()
      let timerTimeElapsedSeconds = timer.getElapsedMiliseconds()
      expect( trueTimeElapsedSeconds - timerTimeElapsedSeconds).toBeLessThan(5)}
      ,elapsed)*/

    timer.getRemainingMiliseconds = jest.fn(() => 300)
    expect(timer.getElapsedMiliseconds()).toBe(701)

  });
  it('should get remaining milliseconds for the current timer', () => {
    const elapsed = 500
    setTimeout(() => { 
      let trueTimeElapsedSeconds = timer.videoLength - timer.getRemainingMiliseconds()
      let timerTimeElapsedSeconds = timer.getElapsedMiliseconds()
      expect( trueTimeElapsedSeconds - timerTimeElapsedSeconds).toBeLessThan(5)}
      ,elapsed)
  });
  it('should get elapsed seconds for the current timer', () => {
    const elapsed = 500
    let trueTimeElapsedSeconds = timer.videoLength - timer.getRemainingMiliseconds()
    let timerTimeElapsedSeconds = timer.getElapsedMiliseconds()
    expect( trueTimeElapsedSeconds - timerTimeElapsedSeconds).toBeLessThan(5)
  });
  it('should call function when time is elapsed',() => {
    const elapsed = 500
    setTimeout(() => { 
      let trueTimeElapsedSeconds = timer.videoLength - timer.getRemainingMiliseconds()
      let timerTimeElapsedSeconds = timer.getElapsedMiliseconds()
      expect( trueTimeElapsedSeconds - timerTimeElapsedSeconds).toBeLessThan(5)}
      ,elapsed)
  });
  it('should clear time out when clearTimer is called', () => {
    timer.clearTimer()
    expect(clearTimeout).toHaveBeenCalledTimes(1)
    expect(timer).toBeNull
  });
});
