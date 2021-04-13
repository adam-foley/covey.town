import {nanoid} from 'nanoid';
import {mock, mockReset} from 'jest-mock-extended';
import {Socket} from 'socket.io';
import TwilioVideo from './TwilioVideo';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';
import CoveyTownListener from '../types/CoveyTownListener';
import {UserLocation} from '../CoveyTypes';
import PlayerSession from '../types/PlayerSession';
import {townSubscriptionHandler} from '../requestHandlers/CoveyTownRequestHandlers';
import CoveyTownsStore from './CoveyTownsStore';
import * as TestUtils from '../client/TestUtils';
import { getDefaultVideos, YTVideo } from '../types/YTVideo';

jest.mock('./TwilioVideo');

const mockGetTokenForTown = jest.fn();
// eslint-disable-next-line
// @ts-ignore it's a mock
TwilioVideo.getInstance = () => ({
  getTokenForTown: mockGetTokenForTown,
});

function generateTestLocation(): UserLocation {
  return {
    rotation: 'back',
    moving: Math.random() < 0.5,
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
  };
}

describe('CoveyTownController', () => {
  beforeEach(() => {
    mockGetTokenForTown.mockClear();
  });
  it('constructor should set the friendlyName property', () => { // Included in handout
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController.friendlyName)
      .toBe(townName);
  });
  // it('constructor should set the videoList property', () => { // ANDREW 
  //   const townName = `FriendlyNameTest-${nanoid()}`;
  //   const townController = new CoveyTownController(townName, false);
  //   expect(townController["_videoList"]) // Notation is TypeScript's official suggestion for accessing private properties https://github.com/microsoft/TypeScript/issues/19335 
  //     .toHaveLength(10);
  // });
  // it('constructor should set the defaultVideoList property', () => { // ANDREW 
  //   const townName = `FriendlyNameTest-${nanoid()}`;
  //   const townController = new CoveyTownController(townName, false);
  //   expect(townController["_defaultVideoList"]) // Notation is TypeScript's official suggestion for accessing private properties https://github.com/microsoft/TypeScript/issues/19335 
  //     .toHaveLength(10);
  // });
  // it('constructor should set the defaultVideoInfo property to any video info in defaultVideoList', () => { // ANDREW 
  //   const townName = `FriendlyNameTest-${nanoid()}`;
  //   const townController = new CoveyTownController(townName, false);
  //   const defaultURLs = townController["_defaultVideoList"].map((info) => info.url);
  //   expect(defaultURLs) 
  //     .toContainEqual(townController["_defaultVideoInfo"].url); // github.com/microsoft/TypeScript/issues/19335 
  //   expect(townController["_defaultVideoInfo"].isPlaying).toBe(true);
  //   expect(townController["_defaultVideoInfo"].timestamp).toBe(0);
  // });
  // it('constructor should set the currentVideoInfo property to match defaultVideoInfo', () => { // ANDREW 
  //   const townName = `FriendlyNameTest-${nanoid()}`;
  //   const townController = new CoveyTownController(townName, false);
  //   expect(townController["_currentVideoInfo"]) 
  //     .toStrictEqual(townController["_defaultVideoInfo"]); // github.com/microsoft/TypeScript/issues/19335 
  // });
  // it('constructor should set the masterVideoLength property to number of seconds based on currentVideoInfo', () => { // ANDREW 
  //   const townName = `FriendlyNameTest-${nanoid()}`;
  //   const townController = new CoveyTownController(townName, false);
  //   const firstVideoURL = townController["_defaultVideoInfo"].url;
  //   const firstVideo = townController["_defaultVideoList"].find((video) => video.url === firstVideoURL);
  //   const videoHoursMinutesSeconds = firstVideo?.duration.split(':');
  //   // vidDurationSeconds will never be -1, but it is initialized to overcome typescript checking for undefined
  //   let vidDurationSeconds = -1;
  //   if (videoHoursMinutesSeconds?.length === 3) {
  //     vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
  //   } else if (videoHoursMinutesSeconds) {
  //     vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
  //   }
  //   if (vidDurationSeconds) {
  //     expect(townController["_masterVideoLength"]).toStrictEqual(vidDurationSeconds);
  //   }
  // });
  describe('addPlayer', () => { // Included in handout
    it('should use the coveyTownID and player ID properties when requesting a video token',
      async () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayerSession = await townController.addPlayer(new Player(nanoid()));
        expect(mockGetTokenForTown).toBeCalledTimes(1);
        expect(mockGetTokenForTown).toBeCalledWith(townController.coveyTownID, newPlayerSession.player.id);
      });
  });
  // describe('createTimer', () => { // ANDREW
  //   it('should create a timer with a setTimeout',
  //     () => {
  //       jest.useFakeTimers();
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       // const firstVideoURL = townController["_defaultVideoInfo"].url;
  //       // const firstVideo = townController["_defaultVideoList"].find((video) => video.url === firstVideoURL);
  //       // const videoHoursMinutesSeconds = firstVideo?.duration.split(':');
  //       // let vidDurationSeconds = -1;
  //       // if (videoHoursMinutesSeconds?.length === 3) {
  //       //   vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
  //       // } else if (videoHoursMinutesSeconds) {
  //       //   vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
  //       // }
  //       townController.createTimer();
  //       expect(setTimeout).toHaveBeenCalledTimes(1);
  //       // expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), vidDurationSeconds * 1000);
  //     });
  // });
  // describe('destroyTimer', () => { // ANDREW
  //   it('should destroy a timer with a clearTimeout',
  //     () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       townController.playVideos(); // creates a timer
  //       townController.destroyTimer();
  //       expect(clearTimeout).toBeCalled();
  //     });
  // });
  // describe('getMilisecondsForTimer', () => { // ANDREW
  //   it('should return correct time using masterVideoLength and masterTimeElapsed',
  //     () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       const firstVideoURL = townController["_defaultVideoInfo"].url;
  //       const firstVideo = townController["_defaultVideoList"].find((video) => video.url === firstVideoURL);
  //       const videoHoursMinutesSeconds = firstVideo?.duration.split(':');
  //       let vidDurationSeconds = -1;
  //       if (videoHoursMinutesSeconds?.length === 3) {
  //         vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
  //       } else if (videoHoursMinutesSeconds) {
  //         vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
  //       }
  //       expect(townController.getMilisecondsForTimer()).toBe(vidDurationSeconds * 1000);
  //     });
  // });
  // describe('addTimerToMasterTimeElapsed', () => { // ANDREW
  //   it('should update masterTimeElapsed using currentTimer.getElapsedSeconds and masterTimeElapsed',
  //     () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       townController.playVideos(); // creates a timer
  //       const currTimer = townController["_currentTimer"];
  //       if (currTimer) {
  //         currTimer.getElapsedSeconds = jest.fn(() => 40);
  //       }
  //       townController.addTimerToMasterTimeElapsed();
  //       expect(townController["_masterTimeElapsed"]).toBe(40);
  //       townController.destroyTimer();
  //     });
  // });
  describe('pauseVideos', () => { // ANDREW
    // it('should update masterTimeElapsed if there is a timer',
    //   () => {
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController.playVideos(); // creates a timer
    //     const currTimer = townController["_currentTimer"];
    //     if (currTimer) {
    //       currTimer.getElapsedSeconds = jest.fn(() => 40);
    //     }
    //     townController.pauseVideos();
    //     expect(townController["_masterTimeElapsed"]).toBe(40);
    //   });
    it('should destroy timer if there is a timer',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer
        townController.pauseVideos();
        // expect(townController["_currentTimer"]).toBeNull();
        expect(clearTimeout).toBeCalled();
      });
    // it('should not update masterTimeElapsed if there is not timer',
    //   () => {
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     const currTimer = townController["_currentTimer"];
    //     if (currTimer) {
    //       currTimer.getElapsedSeconds = jest.fn(() => 40);
    //     }
    //     townController.pauseVideos();
    //     expect(townController["_masterTimeElapsed"]).toBe(0);
    //   });
    // it('should not destroy timer if there is not timer',
    //   () => {
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController.destroyTimer = jest.fn();
    //     townController.pauseVideos();
    //     expect(townController.destroyTimer).not.toBeCalled();
    //   });
  });
  describe('syncVideos', () => { // ANDREW
    it('should call pauseVideos if there is a timer',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer so that first if-block runs 
        townController.pauseVideos = jest.fn();
        townController.syncVideos();
        expect(townController.pauseVideos).toBeCalled();
        // townController.destroyTimer();
      });
    it('should call playVideos if there is a timer',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer
        townController.playVideos = jest.fn();
        townController.syncVideos();
        expect(townController.playVideos).toHaveBeenCalledTimes(1);
        // townController.destroyTimer();
      });
    it('should not call pauseVideos if there is not a timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.pauseVideos = jest.fn();
        townController.syncVideos();
        expect(townController.pauseVideos).not.toBeCalled();
      });
    it('should not call playVideos if there is not a timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos = jest.fn();
        townController.syncVideos();
        expect(townController.playVideos).not.toBeCalled();
      });
  });
  describe('playVideos', () => { // ANDREW
    it('should create a timer if there is not a timer beforehand',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        jest.useFakeTimers();
        // townController.createTimer = jest.fn();
        townController.playVideos();
        expect(setTimeout).toBeCalled();
        // expect(townController.createTimer).toBeCalled();
        // expect(townController["_currentTimer"]).not.toBeNull();
      });
    it('should not create a timer if there is a timer beforehand',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        jest.useFakeTimers();
        townController.playVideos(); // this call creates the timer 
        // townController.createTimer = jest.fn();
        townController.playVideos(); // this call is for actually testing funtionality after a timer exists
        expect(setTimeout).not.toHaveBeenCalledTimes(2);
        // expect(townController["_currentTimer"]).not.toBeNull();
      });
  });
  describe('addToTVArea', () => { // ANDREW
    it('should add new player and listener to listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayer = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController.addToTVArea(newPlayer, mockListener);
        townController.playVideos();
        expect(mockListener.onVideoSyncing).toBeCalled();
        // expect(townController["_listenersInTVAreaMap"].entries()).toContainEqual([newPlayer, mockListener]);
      });
    it('should create a timer if there is no timer beforehand and only one person added to listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayer = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController.addToTVArea(newPlayer, mockListener);
        // expect(townController["_currentTimer"]).not.toBeNull();
        expect(setTimeout).toBeCalled();
      });
    it('should not create a new timer if there is a timer beforehand',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayer = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController.playVideos(); // creates a timer
        // townController.createTimer = jest.fn();
        townController.addToTVArea(newPlayer, mockListener);
        expect(setTimeout).not.toHaveBeenCalledTimes(2);
      });
    it('should not create a new timer if there is not a timer beforehand and listenersInTVAreaMap has size > 1',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const originalPlayer = new Player('added to map');
        const originalMockListener = mock<CoveyTownListener>();
        const newPlayer = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController.addToTVArea(originalPlayer, originalMockListener);
        townController.pauseVideos();
        // townController["_listenersInTVAreaMap"].set(originalPlayer, originalMockListener);
        // townController.createTimer = jest.fn();
        townController.addToTVArea(newPlayer, mockListener);
        expect(setTimeout).not.toHaveBeenCalledTimes(2);
      });
  });
  describe('removeFromTVArea', () => { // ANDREW
    it('should remove player and listener from listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        // townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController.addToTVArea(player, mockListener);
        townController.removeFromTVArea(player);
        townController.pauseVideos();
        expect(mockListener.onPlayerPaused).not.toBeCalled();
        // expect(townController["_listenersInTVAreaMap"].entries()).not.toContainEqual([player, mockListener]);
      });
    it('should destroy timer if no more people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        // townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController.addToTVArea(player, mockListener);
        // townController.destroyTimer = jest.fn();
        townController.removeFromTVArea(player);
        expect(clearTimeout).toBeCalled();
      });
    it('should not destroy timer if people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        const extraPlayer = new Player('added to map');
        const extraMockListener = mock<CoveyTownListener>();
        // townController["_listenersInTVAreaMap"].set(player, mockListener);
        // townController["_listenersInTVAreaMap"].set(extraPlayer, extraMockListener);
        townController.addToTVArea(player, mockListener);
        townController.addToTVArea(extraPlayer, extraMockListener);
        // townController.destroyTimer = jest.fn();
        townController.removeFromTVArea(player);
        expect(clearTimeout).not.toBeCalled();
      });
    // it('should set masterTimeElapsed to zero if no more people left in listenersInTVAreaMap',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     const player = new Player('added to map');
    //     const mockListener = mock<CoveyTownListener>();
    //     townController["_listenersInTVAreaMap"].set(player, mockListener);
    //     townController["_masterTimeElapsed"] = 10;
    //     townController.removeFromTVArea(player);
    //     expect(townController["_masterTimeElapsed"]).toBe(0);
    //   });
    // it('should set videoList to default video list if no more people left in listenersInTVAreaMap',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     const player = new Player('added to map');
    //     const mockListener = mock<CoveyTownListener>();
    //     townController["_listenersInTVAreaMap"].set(player, mockListener);
    //     townController["_videoList"] = [];
    //     townController.removeFromTVArea(player);
    //     expect(townController["_videoList"]).toHaveLength(10);
    //   });
    // it('should reset defaultVideoInfo if no more people left in listenersInTVAreaMap',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     const player = new Player('added to map');
    //     const mockListener = mock<CoveyTownListener>();
    //     townController["_listenersInTVAreaMap"].set(player, mockListener);
    //     townController["_defaultVideoInfo"] = {
    //       url: '',
    //       timestamp: 100,
    //       isPlaying: false,
    //     };
    //     townController.removeFromTVArea(player);
    //     expect(townController["_defaultVideoInfo"].url).not.toHaveLength(0);
    //     expect(townController["_defaultVideoInfo"].timestamp).toBe(0);
    //     expect(townController["_defaultVideoInfo"].isPlaying).toBe(true);
    //   });
    // it('should set currentVideoInfo to defaultVideoInfo if no more people left in listenersInTVAreaMap',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     const player = new Player('added to map');
    //     const mockListener = mock<CoveyTownListener>();
    //     townController["_listenersInTVAreaMap"].set(player, mockListener);
    //     townController["_currentVideoInfo"] = {
    //       url: '',
    //       timestamp: 100,
    //       isPlaying: false,
    //     };
    //     townController.removeFromTVArea(player);
    //     expect(townController["_currentVideoInfo"]).toStrictEqual(townController["_defaultVideoInfo"]);
    //   });
    // it('should set masterVideoLength if no more people left in listenersInTVAreaMap',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     const player = new Player('added to map');
    //     const mockListener = mock<CoveyTownListener>();
    //     townController["_listenersInTVAreaMap"].set(player, mockListener);
    //     const potentialDurations = townController["_defaultVideoList"].map((video) => {
    //       const videoHoursMinutesSeconds = video.duration.split(':');
    //       let vidDurationSeconds;
    //       if (videoHoursMinutesSeconds.length === 3) {
    //         vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
    //       } else {
    //         vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
    //       }
    //       return vidDurationSeconds;
    //     });
    //     townController.removeFromTVArea(player);
    //     expect(potentialDurations).toContainEqual(townController["_masterVideoLength"]);
    //   });
  });
  describe('chooseNextVideo', () => { // ANDREW
    it('should destroy current timer',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('test player');
        // townController.destroyTimer = jest.fn();
        const mockListener = mock<CoveyTownListener>();
        townController.addToTVArea(player, mockListener); // creates a timer that will later be cleared
        townController.chooseNextVideo();
        expect(clearTimeout).toBeCalled();
      });
    // it('should set masterTimeElapsed to 0',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController["_masterTimeElapsed"] = 100;
    //     townController.chooseNextVideo();
    //     expect(townController["_masterTimeElapsed"]).toBe(0);
    //   });
    // it('should set masterVideoLength to duration in videoList with most votes',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
    //     const videoHoursMinutesSeconds = townController["_defaultVideoList"][0].duration.split(':');
    //     let vidDurationSeconds;
    //     if (videoHoursMinutesSeconds.length === 3) {
    //       vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
    //     } else {
    //       vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
    //     }
    //     townController.chooseNextVideo();
    //     expect(townController["_masterVideoLength"]).toBe(vidDurationSeconds);
    //   });
    // it('should set currentVideoInfo url based on video in videoList with most votes',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
    //     townController.chooseNextVideo();
    //     expect(townController["_currentVideoInfo"].url).toStrictEqual(townController["_defaultVideoList"][0].url);
    //   });
    // it('should set currentVideoInfo url based on video in videoList with most votes - multiple voted urls',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
    //     townController["_videoURLVotes"].set(townController["_defaultVideoList"][1].url, 2);
    //     townController.chooseNextVideo();
    //     expect(townController["_currentVideoInfo"].url).toStrictEqual(townController["_defaultVideoList"][1].url);
    //   });
    // it('should create new currentTimer',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController.createTimer = jest.fn();
    //     townController.chooseNextVideo();
    //     expect(townController.createTimer).toBeCalled();
    //     expect(townController["_currentTimer"]).not.toBeNull();
    //   });
    // it('should reset videoURLVotes',
    //   () => {
    //     jest.useFakeTimers();
    //     const townName = `FriendlyNameTest-${nanoid()}`;
    //     const townController = new CoveyTownController(townName, false);
    //     townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
    //     townController["_videoURLVotes"].set(townController["_defaultVideoList"][1].url, 2);
    //     townController.chooseNextVideo();
    //     expect(townController["_videoURLVotes"].size).toBe(0);
    //   });
  });
  // describe('voteForVideo', () => { // ANDREW
  //   it('should add vote for URL that has not been seen before',
  //     () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       townController.voteForVideo('testURL');
  //       expect(townController["_videoURLVotes"].get('testURL')).toBe(1);
  //     });
  //   it('should add vote for URL that has been seen before',
  //     () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       townController["_videoURLVotes"].set('testURL', 1);
  //       townController.voteForVideo('testURL');
  //       expect(townController["_videoURLVotes"].get('testURL')).toBe(2);
  //     });
  //   it('should add vote for correct URL where other URLs have been voted for',
  //     () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       townController["_videoURLVotes"].set('testURL', 1);
  //       townController["_videoURLVotes"].set('anotherTestURL', 5);
  //       townController.voteForVideo('testURL');
  //       expect(townController["_videoURLVotes"].get('testURL')).toBe(2);
  //     });
  //   it('should add vote for correct URL where other URLs have been voted for and URL has not been seen before',
  //     () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       townController["_videoURLVotes"].set('anotherTestURL', 5);
  //       townController.voteForVideo('testURL');
  //       expect(townController["_videoURLVotes"].get('testURL')).toBe(1);
  //     });
  // });

  
  // describe('addVideoToVideoList', () => { // ANDREW - Have not figured out proper way to mock axios and return right data
  //   it('should add URL to videoList if approved',
  //     async () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       const axios = require('axios');
  //       jest.mock('axios');
  //       // const mockAxios = jest.genMockFromModule('axios')
  //       // this is the key to fix the axios.create() undefined error!
  //       //mockAxios.create = jest.fn(() => mockAxios)

  //       // let someObject : any
  //       // someObject.get.mockImplementationOnce(() => Promise.resolve(vidResponse));

  //       // Instance - 463
  //       // axios.create.mockImplementationOnce(() => someObject)
        

  //       // const addVideoToVideoList = require('./CoveyTownController');
        
  //       // const mockedAxios = axios as jest.Mocked<typeof axios>
  //       // const mock = jest.spyOn(axios, 'get');
  //       const vidData = {items: [{snippet: {title: 'fake title', channelTitle: 'fake channel'}, contentDetails: {duration: 'PT3M21S'}}]};
  //       const vidResponse = {data: vidData};
  //       axios.create.mockImplementation(() => axios);
  //       // axios.get.mockImplementation(() => {
  //       //   return vidResponse;
  //       // })
  //       // mock.mockReturnValueOnce(() => Promise.resolve(vidResponse));
  //       // mockedAxios.get.mockReturnValueOnce(() => Promise.resolve(vidResponse));
  //       // await axios.get.mockResolvedValue(vidResponse);
  //       await axios.get.mockImplementationOnce(() => Promise.resolve(vidResponse));
  //       const mockListener = mock<CoveyTownListener>();
  //       await townController.addVideoToVideoList('https://www.youtube.com/watch?v=wUqZQTp_gpI', mockListener);
  //       // expect(mockListener.onUnableToAddVideo).toBeCalled();
  //       expect(townController["_videoList"]).toContainEqual({url: 'https://www.youtube.com/watch?v=wUqZQTp_gpI', title: 'fake title', channel: 'fake channel', duration: '03:21'});
  //     });
  // });
  describe('checkNewURLValidity', () => { // ANDREW
    it('should call addVideoToVideoList if URL has not been seen before',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const mockListener = mock<CoveyTownListener>();
        townController.addVideoToVideoList = jest.fn();
        townController.checkNewURLValidity('testURL', mockListener);
        expect(townController.addVideoToVideoList).toBeCalled();
      });
    it('should not call addVideoToVideoList if URL has been seen before',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const defaultVideoList: YTVideo[] = getDefaultVideos();
        const mockListener = mock<CoveyTownListener>();
        // townController["_videoList"].push({
        //   url: 'testURL',
        //   title: 'test title',
        //   channel: 'test channel',
        //   duration: '02:35',
        // });
        townController.addVideoToVideoList = jest.fn();
        townController.checkNewURLValidity(defaultVideoList[0].url, mockListener);
        expect(townController.addVideoToVideoList).not.toBeCalled();
      });
  });
  // describe('formatDuration', () => { // ANDREW - have not figured out how to test un-exported function. Can't get rewire to work
  //   it('should format time under a minute',
  //     () => {
  //       const app = rewire('./CoveyTownController');
  //       const formatVidDuration = app.__get__('formatDuration');
  //       expect(formatVidDuration('PT3M21S')).toStrictEqual('03:21');
  //     });
  // });
  describe('town listeners and events', () => {
    let testingTown: CoveyTownController;
    const mockListeners = [mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>()];
    let defaultVideoList: YTVideo[];
    beforeEach(() => {
      const townName = `town listeners and events tests ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      mockListeners.forEach(mockReset);
      jest.useFakeTimers();
      defaultVideoList = getDefaultVideos();
    });
    it('should notify added listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const newLocation = generateTestLocation();
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.updatePlayerLocation(player, newLocation);
      mockListeners.forEach(listener => expect(listener.onPlayerMoved).toBeCalledWith(player));
    });
    it('should notify added listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.destroySession(session);
      mockListeners.forEach(listener => expect(listener.onPlayerDisconnected).toBeCalledWith(player));
    });
    it('should notify added listeners of new players when addPlayer is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));

      const player = new Player('test player');
      await testingTown.addPlayer(player);
      mockListeners.forEach(listener => expect(listener.onPlayerJoined).toBeCalledWith(player));

    });
    it('should notify added listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.disconnectAllPlayers();
      mockListeners.forEach(listener => expect(listener.onTownDestroyed).toBeCalled());

    });
    it('should notify added listeners in tv area that the video player is to be paused when pauseVideos is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.playVideos();
      testingTown.pauseVideos();
      expect(mockListeners[0].onPlayerPaused).toBeCalled();
      expect(mockListeners[1].onPlayerPaused).toBeCalled();
    });

    it('should notify added listeners in tv area that the video player is to be synced when playVideos is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.pauseVideos();
      testingTown.playVideos();
      expect(mockListeners[0].onVideoSyncing).toHaveBeenCalledTimes(2);
      expect(mockListeners[1].onVideoSyncing).toHaveBeenCalledTimes(2);
    });
    it('should notify added listeners in tv area that the video player is to be synced when syncVideos is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      // testingTown.playVideos(); // creates a timer so that syncVideos will 
      testingTown.syncVideos();
      expect(mockListeners[0].onVideoSyncing).toHaveBeenCalledTimes(2);
      expect(mockListeners[1].onVideoSyncing).toHaveBeenCalledTimes(2);
    });
    it('should notify added listener in tv area to be synced when addToTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.addToTVArea(player, mockListeners[0]);
      expect(mockListeners[0].onVideoSyncing).toBeCalled();
    });
    it('should notify added listeners in tv area to display voting widget when addToTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      expect(mockListeners[0].onDisplayVotingWidget).toBeCalled();
      expect(mockListeners[1].onDisplayVotingWidget).toBeCalled();
    });
    it('should notify added listeners in tv area to update next-video options when addToTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      expect(mockListeners[0].onUpdatingNextVideoOptions).toBeCalledWith(defaultVideoList);
      expect(mockListeners[1].onUpdatingNextVideoOptions).toBeCalledWith(defaultVideoList);
    });
    it('should notify added listeners in tv area to call onDisableControlButtons when removeFromTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.removeFromTVArea(player);
      expect(mockListeners[0].onDisableControlButtons).toBeCalled();
      testingTown.removeFromTVArea(secondPlayer);
      expect(mockListeners[1].onDisableControlButtons).toBeCalled();
    });
    it('should notify added listeners in tv area to call onEnableVoting when removeFromTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.removeFromTVArea(player);
      expect(mockListeners[0].onEnableVoting).toBeCalled();
      testingTown.removeFromTVArea(secondPlayer);
      expect(mockListeners[1].onEnableVoting).toBeCalled();
    });
    it('should notify added listeners in tv area to call onResetVideoOptions when removeFromTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.removeFromTVArea(player);
      expect(mockListeners[0].onResetVideoOptions).toBeCalled();
      testingTown.removeFromTVArea(secondPlayer);
      expect(mockListeners[1].onResetVideoOptions).toBeCalled();
    });
    it('should notify added listeners in tv area to call onVideoSyncing with most highly voted video when chooseNextVideo is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      // testingTown["_videoURLVotes"].set(testingTown["_defaultVideoList"][0].url, 1);
      testingTown.voteForVideo('testURL1');
      testingTown.chooseNextVideo();
      expect(mockListeners[0].onVideoSyncing).toBeCalledWith({
        url: 'testURL1',
        timestamp: 0,
        isPlaying: true,
      });
      expect(mockListeners[1].onVideoSyncing).toBeCalledWith({
        url: 'testURL1',
        timestamp: 0,
        isPlaying: true,
      });
    });
    it('should notify added listeners in tv area to call onEnableVoting when chooseNextVideo is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.chooseNextVideo();
      expect(mockListeners[0].onEnableVoting).toBeCalled();
      expect(mockListeners[1].onEnableVoting).toBeCalled();
    });
    it('should notify added listeners in tv area to call onUpdatingNextVideoOptions when chooseNextVideo is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.chooseNextVideo();
      expect(mockListeners[0].onUpdatingNextVideoOptions).toBeCalledWith(defaultVideoList);
      expect(mockListeners[1].onUpdatingNextVideoOptions).toBeCalledWith(defaultVideoList);
    });
    // it('should notify added listeners in tv area to call onUpdatingNextVideoOptions when addVideoToVideoList is called', async () => {
    //   axios.create.mockImplementation((config) => axios);
    //   axios.get.mockImplementation(() => {})
    //   // NEED TO FIGURE OUT HOW TO MOCK AXIOS TO TEST ALL OF THE LISTENER METHODS THAT SHOULD BE CALLED AFTER SUCCESSFUL API CALL
    // });
    it('should not notify removed listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const newLocation = generateTestLocation();
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.updatePlayerLocation(player, newLocation);
      expect(listenerRemoved.onPlayerMoved).not.toBeCalled();
    });
    it('should not notify removed listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerDisconnected).not.toBeCalled();

    });
    it('should not notify removed listeners of new players when addPlayer is called', async () => {
      const player = new Player('test player');

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      const session = await testingTown.addPlayer(player);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerJoined).not.toBeCalled();
    });
    it('should not notify removed listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.disconnectAllPlayers();
      expect(listenerRemoved.onTownDestroyed).not.toBeCalled();
    });
    it('should not notify listeners not in tv area that the video player is to be paused when pauseVideos is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.playVideos(); // create a timer so that pauseVideos will attempt to pause videos
      testingTown.pauseVideos();
      mockListeners.forEach(listener => expect(listener.onPlayerPaused).not.toBeCalled());
    });
    it('should not notify listeners removed from tv area that the video player is to be paused when pauseVideos is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.playVideos(); // create a timer so that pauseVideos will attempt to pause videos
      testingTown.removeFromTVArea(player);
      testingTown.removeFromTVArea(secondPlayer);
      testingTown.pauseVideos();
      mockListeners.forEach(listener => expect(listener.onPlayerPaused).not.toBeCalled());
    });
    it('should not notify listeners not in tv area that the video player is to be synced when playVideos is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.playVideos();
      mockListeners.forEach(listener => expect(listener.onVideoSyncing).not.toBeCalled());
    });
    it('should not notify listeners removed from tv area that the video player is to be synced when playVideos is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.removeFromTVArea(player);
      testingTown.removeFromTVArea(secondPlayer);
      testingTown.playVideos();
      // onVideoSyncing will have been called once already from adding players and listeners to TV Area
      mockListeners.forEach(listener => expect(listener.onVideoSyncing).not.toHaveBeenCalledTimes(2));
    });
    it('should not notify listeners not in tv area that the video player is to be synced when syncVideos is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.playVideos();
      testingTown.syncVideos();

      mockListeners.forEach(listener => expect(listener.onVideoSyncing).not.toBeCalled());
    });
    it('should not notify listeners removed from tv area that the video player is to be synced when syncVideos is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      // testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      testingTown.removeFromTVArea(player);
      testingTown.removeFromTVArea(secondPlayer);
      testingTown.playVideos();
      testingTown.syncVideos();
      // onVideoSyncing will have been called once already from adding players and listeners to TV Area
      mockListeners.forEach(listener => expect(listener.onVideoSyncing).not.toHaveBeenCalledTimes(2));
    });
    it('should not notify listeners not in tv area to call onDisableControlButtons when removeFromTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.removeFromTVArea(player);
      expect(mockListeners[0].onDisableControlButtons).not.toBeCalled();
      testingTown.removeFromTVArea(secondPlayer);
      expect(mockListeners[1].onDisableControlButtons).not.toBeCalled();
    });
    it('should not notify listeners not in tv area to call onEnableVoting when removeFromTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.removeFromTVArea(player);
      expect(mockListeners[0].onEnableVoting).not.toBeCalled();
      testingTown.removeFromTVArea(secondPlayer);
      expect(mockListeners[1].onEnableVoting).not.toBeCalled();
    });
    it('should not notify listeners not in tv area to call onResetVideoOptions when removeFromTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.removeFromTVArea(player);
      expect(mockListeners[0].onResetVideoOptions).not.toBeCalled();
      testingTown.removeFromTVArea(secondPlayer);
      expect(mockListeners[1].onResetVideoOptions).not.toBeCalled();
    });
    it('should not notify listeners not in tv area to call onVideoSyncing with most highly voted video when chooseNextVideo is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      // testingTown["_videoURLVotes"].set(testingTown["_defaultVideoList"][0].url, 1);
      testingTown.voteForVideo(defaultVideoList[0].url);
      testingTown.chooseNextVideo();
      expect(mockListeners[0].onVideoSyncing).not.toBeCalledWith({
        url: defaultVideoList[0].url,
        timestamp: 0,
        isPlaying: true,
      });
      expect(mockListeners[1].onVideoSyncing).not.toBeCalledWith({
        url: defaultVideoList[0].url,
        timestamp: 0,
        isPlaying: true,
      });
    });
    it('should not notify listeners not in tv area to call onEnableVoting when chooseNextVideo is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.chooseNextVideo();
      expect(mockListeners[0].onEnableVoting).not.toBeCalled();
      expect(mockListeners[1].onEnableVoting).not.toBeCalled();
    });
    it('should not notify added listeners not in tv area to call onUpdatingNextVideoOptions when chooseNextVideo is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.chooseNextVideo();
      expect(mockListeners[0].onUpdatingNextVideoOptions).not.toBeCalledWith(defaultVideoList);
      expect(mockListeners[1].onUpdatingNextVideoOptions).not.toBeCalledWith(defaultVideoList);
    });
  });
  describe('townSubscriptionHandler', () => {
    const mockSocket = mock<Socket>();
    let testingTown: CoveyTownController;
    let player: Player;
    let session: PlayerSession;
    let defaultVideoList: YTVideo[];
    beforeEach(async () => {
      const townName = `connectPlayerSocket tests ${nanoid()}`;
      testingTown = CoveyTownsStore.getInstance().createTown(townName, false);
      mockReset(mockSocket);
      player = new Player('test player');
      session = await testingTown.addPlayer(player);
      defaultVideoList = getDefaultVideos();
    });
    it('should reject connections with invalid town IDs by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(nanoid(), session.sessionToken, mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    it('should reject connections with invalid session tokens by calling disconnect', async () => {
      TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, nanoid(), mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    describe('with a valid session token', () => {
      it('should add a town listener, which should emit "newPlayer" to the socket when a player joins', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        await testingTown.addPlayer(player);
        expect(mockSocket.emit).toBeCalledWith('newPlayer', player);
      });
      it('should add a town listener, which should emit "playerMoved" to the socket when a player moves', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.updatePlayerLocation(player, generateTestLocation());
        expect(mockSocket.emit).toBeCalledWith('playerMoved', player);

      });
      it('should add a town listener, which should emit "playerDisconnect" to the socket when a player disconnects', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.destroySession(session);
        expect(mockSocket.emit).toBeCalledWith('playerDisconnect', player);
      });
      it('should add a town listener, which should emit "townClosing" to the socket and disconnect it when disconnectAllPlayers is called', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.disconnectAllPlayers();
        expect(mockSocket.emit).toBeCalledWith('townClosing');
        expect(mockSocket.disconnect).toBeCalledWith(true);
      });
      it('should add a town listener, which should emit "playerPaused" to the socket when a player pauses when listener in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.addToTVArea(player, testingTown.listeners[0]);
        testingTown.pauseVideos();
        expect(mockSocket.emit).toBeCalledWith('playerPaused');
      });
      it('should add a town listener, which should not emit "playerPaused" to the socket when a player pauses when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.pauseVideos();
        expect(mockSocket.emit).not.toBeCalledWith('playerPaused');
      });
      // TODO - Figure out how to check that mockSocket.emit was called with one of the default video infos, it just needs to be one of the 10
      // it('should add a town listener, which should emit "videoSynchronization" to the socket when a player syncs when listener in listenersInTVAreaMap', async () => {
      //   TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
      //   townSubscriptionHandler(mockSocket);
      //   testingTown.addToTVArea(player, testingTown["_listeners"][0]);
      //   testingTown.syncVideos();
      //   const emission = mockSocket.emit.mock.calls.find(call => call[0] === 'videoSynchronization');
      //   let vidSyncSocketEmissionData;
      //   if (emission) {
      //     vidSyncSocketEmissionData = emission[1];
      //   }
      //   // const vidSyncSocketEmissionData = mockSocket.emit.mock.calls.find(call => call[0] === 'videoSynchronization')[1];
      //   expect(defaultVideoList).toContainEqual(vidSyncSocketEmissionData);
      //   // expect(mockSocket.emit).toBeCalledWith('videoSynchronization', {
      //   //   url: testingTown["_defaultVideoInfo"].url,
      //   //   timestamp: testingTown["_defaultVideoInfo"].timestamp,
      //   //   isPlaying: testingTown["_defaultVideoInfo"].isPlaying,
      //   // });
      // });
      it('should add a town listener, which should not emit "videoSynchronization" to the socket when a player pauses when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.syncVideos();
        expect(mockSocket.emit).not.toBeCalledWith('videoSynchronization', expect.anything());
      });
      it('should add a town listener, which should emit "enableVotingButton" to the socket when the next video is chosen when listener in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.addToTVArea(player, testingTown.listeners[0]);
        testingTown.chooseNextVideo();
        expect(mockSocket.emit).toBeCalledWith('enableVotingButton');
      });
      it('should add a town listener, which should not emit "enableVotingButton" to the socket when the next video is chosen when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.chooseNextVideo();
        expect(mockSocket.emit).not.toBeCalledWith('enableVotingButton');
      });
      it('should add a town listener, which should emit "disablePlayPauseButtons" to the socket when a player is removed from TV area when listener in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.addToTVArea(player, testingTown.listeners[0]);
        testingTown.removeFromTVArea(player);
        expect(mockSocket.emit).toBeCalledWith('disablePlayPauseButtons');
      });
      it('should add a town listener, which should not emit "disablePlayPauseButtons" to the socket when a player is removed from TV area when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.removeFromTVArea(player);
        expect(mockSocket.emit).not.toBeCalledWith('disablePlayPauseButtons');
      });
      it('should add a town listener, which should emit "nextVideoOptions" to the socket when a player is added to TV area when listener in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.addToTVArea(player, testingTown.listeners[0]);
        expect(mockSocket.emit).toBeCalledWith('nextVideoOptions', defaultVideoList);
      });
      it('should add a town listener, which should not emit "nextVideoOptions" to the socket when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        expect(mockSocket.emit).not.toBeCalledWith('nextVideoOptions', defaultVideoList);
      });
      it('should add a town listener, which should emit resetVideoOptions to the socket when a player is removed from TV area when listener in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.addToTVArea(player, testingTown.listeners[0]);
        testingTown.removeFromTVArea(player);
        expect(mockSocket.emit).toBeCalledWith('resetVideoOptions');
      });
      it('should add a town listener, which should not emit resetVideoOptions to the socket when a player is removed from TV area when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.removeFromTVArea(player);
        expect(mockSocket.emit).not.toBeCalledWith('resetVideoOptions');
      });
      it('should add a town listener, which should emit "displayVotingWidget" to the socket when a player is added to TV area when listener in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.addToTVArea(player, testingTown.listeners[0]);
        expect(mockSocket.emit).toBeCalledWith('displayVotingWidget');
      });
      it('should add a town listener, which should not emit "displayVotingWidget" to the socket when a player is added to TV area when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        expect(mockSocket.emit).not.toBeCalledWith('displayVotingWidget');
      });

      // TODO : socket.emit -> onVideoAdded, unableToAddVideo, unableToUseURL


      describe('when a socket disconnect event is fired', () => {
        it('should remove the town listener for that socket, and stop sending events to it', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            const newPlayer = new Player('should not be notified');
            await testingTown.addPlayer(newPlayer);
            expect(mockSocket.emit).not.toHaveBeenCalledWith('newPlayer', newPlayer);
          } else {
            fail('No disconnect handler registered');
          }
        });
        it('should destroy the session corresponding to that socket', async () => {
          TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            mockReset(mockSocket);
            TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
            townSubscriptionHandler(mockSocket);
            expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
          } else {
            fail('No disconnect handler registered');
          }

        });
      });

      it('should forward playerMovement events from the socket to subscribed listeners', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        // find the 'playerMovement' event handler for the socket, which should have been registered after the socket was connected
        const playerMovementHandler = mockSocket.on.mock.calls.find(call => call[0] === 'playerMovement');
        if (playerMovementHandler && playerMovementHandler[1]) {
          const newLocation = generateTestLocation();
          player.location = newLocation;
          playerMovementHandler[1](newLocation);
          expect(mockListener.onPlayerMoved).toHaveBeenCalledWith(player);
        } else {
          fail('No playerMovement handler registered');
        }
      });
      it('should forward clientPaused events from the socket to subscribed listeners in TV area if timer exists', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        const newPlayer = new Player('test player');
        // testingTown["_listenersInTVAreaMap"].set(newPlayer, mockListener);
        testingTown.addToTVArea(newPlayer, mockListener);
        testingTown.playVideos(); // creates timer so that pauseVideos actually tells listeners to pause
        // find the 'clientPaused' event handler for the socket, which should have been registered after the socket was connected
        const clientPausedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientPaused');
        if (clientPausedHandler && clientPausedHandler[1]) {
          clientPausedHandler[1]();
          expect(mockListener.onPlayerPaused).toBeCalled();
        } else {
          fail('No clientPaused handler registered');
        }
      });
      it('should not forward clientPaused events from the socket to subscribed listeners in TV area if timer does not exists', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        const newPlayer = new Player('test player');
        // testingTown["_listenersInTVAreaMap"].set(newPlayer, mockListener);
        testingTown.addToTVArea(newPlayer, mockListener);
        testingTown.pauseVideos();
        // find the 'clientPaused' event handler for the socket, which should have been registered after the socket was connected
        const clientPausedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientPaused');
        if (clientPausedHandler && clientPausedHandler[1]) {
          clientPausedHandler[1]();
          expect(mockListener.onPlayerPaused).not.toHaveBeenCalledTimes(2);
        }
      });
      it('should forward clientPlayed events from the socket to subscribed listeners', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        const newPlayer = new Player('test player');
        // testingTown["_listenersInTVAreaMap"].set(newPlayer, mockListener);
        testingTown.addToTVArea(newPlayer, mockListener);
        // find the 'clientPlayed' event handler for the socket, which should have been registered after the socket was connected
        const clientPlayedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientPlayed');
        if (clientPlayedHandler && clientPlayedHandler[1]) {
          clientPlayedHandler[1]();
          expect(mockListener.onVideoSyncing).toBeCalled();
        } else {
          fail('No clientPlayed handler registered');
        }
      });
      it('should forward clientEnteredTVArea events from the socket to subscribed listeners to emit socket messages', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        // find the 'clientEnteredTVArea' event handler for the socket, which should have been registered after the socket was connected
        const clientEnteredTVAreaHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientEnteredTVArea');
        if (clientEnteredTVAreaHandler && clientEnteredTVAreaHandler[1]) {
          clientEnteredTVAreaHandler[1]();
          expect(mockSocket.emit).toHaveBeenCalledWith('videoSynchronization', expect.anything());
          expect(mockSocket.emit).toHaveBeenCalledWith('displayVotingWidget');
          expect(mockSocket.emit).toHaveBeenCalledWith('nextVideoOptions', defaultVideoList);
        } else {
          fail('No clientEnteredTVArea handler registered');
        }
      });
      it('should forward clientSynced events from the socket to subscribed listener in TV Area', async () => {
        jest.useFakeTimers();
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        const newPlayer = new Player('test player');
        // testingTown["_listenersInTVAreaMap"].set(newPlayer, mockListener);
        testingTown.addToTVArea(newPlayer, mockListener);
        // find the 'clientSynced' event handler for the socket, which should have been registered after the socket was connected
        const clientSyncedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientSynced');
        if (clientSyncedHandler && clientSyncedHandler[1]) {
          clientSyncedHandler[1]();
          expect(mockListener.onVideoSyncing).toBeCalledWith({
            url: expect.any(String), 
            timestamp: 0,
            isPlaying: true,
          });
        } else {
          fail('No clientSynced handler registered');
        }
      });
      it('should forward clientLeftTVArea events from the socket to subscribed listeners', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);

        townSubscriptionHandler(mockSocket);
        const { token, coveyTownID } = mockSocket.handshake.auth as { token: string; coveyTownID: string };
        const townController = CoveyTownsStore.getInstance()
          .getControllerForTown(coveyTownID);
        const s = townController?.getSessionByToken(token);

        const mockListener = mock<CoveyTownListener>();
        if (s && s.player && townController) {
          // townController["_listenersInTVAreaMap"].set(s.player, mockListener);
          townController.addToTVArea(s.player, mockListener);
        }
        const clientLeftTVAreaHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientLeftTVArea');
        if (clientLeftTVAreaHandler && clientLeftTVAreaHandler[1]) {
          clientLeftTVAreaHandler[1]();
          expect(mockListener.onDisableControlButtons).toBeCalled();
          expect(mockListener.onEnableVoting).toBeCalled();
          expect(mockListener.onResetVideoOptions).toBeCalled();
        } else {
          fail('No clientLeftTVArea handler registered');
        }
      });
      it('should forward clientVoted events from the socket and update videoURLVotes property of controller', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        const newPlayer = new Player('test player');

        // testingTown["_listenersInTVAreaMap"].set(newPlayer, mockListener);
        testingTown.addToTVArea(newPlayer, mockListener);
        // find the 'clientVoted' event handler for the socket, which should have been registered after the socket was connected
        const clientVotedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientVoted');
        if (clientVotedHandler && clientVotedHandler[1]) {
          clientVotedHandler[1]('testURL1');
          clientVotedHandler[1]('testURL2');
          clientVotedHandler[1]('testURL2');
          testingTown.chooseNextVideo();
          expect(mockListener.onVideoSyncing).toHaveBeenCalledWith({
            url: 'testURL2', 
            timestamp: 0,
            isPlaying: true,
          });
        } else {
          fail('No clientVoted handler registered');
        }
      });
      it('should forward clientProposedNewURL events from the socket and call addVideoToVideoList in controller', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        testingTown.addVideoToVideoList = jest.fn();
        const clientProposedNewURLHandler = mockSocket.on.mock.calls.find(call => call[0] === 'clientProposedNewURL');
        if (clientProposedNewURLHandler && clientProposedNewURLHandler[1]) {
          clientProposedNewURLHandler[1]('testURL1', mockListener);
          expect(testingTown.addVideoToVideoList).toHaveBeenCalledWith('testURL1', expect.anything());
        } else {
          fail('No clientProposedNewURL handler registered');
        }
      });
    });
  });
});
