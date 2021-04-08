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
import rewire from 'rewire';
import axios from 'axios';

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

// /**
//  * WARNING: HARDCODED
//  * 
//  * Returns a location in the TV area.
//  * 
//  * TV area: 
//  * X-coordinate: xLoc > 250 && xLoc < 360
//  * Y-coordinate: yLoc > 770 && yLoc < 900
//  * 
//  * @returns a location in the TV area
//  */
//  function generateLocationInTVArea(): UserLocation {
//   const xMin = Math.ceil(251);
//   const xMax = Math.floor(359);

//   const yMin = Math.ceil(771);
//   const yMax = Math.floor(899);

//   return {
//     rotation: 'back',
//     moving: Math.random() < 0.5,
//     x: Math.floor(Math.random() * (xMax - xMin + 1)) + xMin,
//     y: Math.floor(Math.random() * (yMax - yMin + 1)) + yMin
//   };
// }

// /**
//  * WARNING: HARDCODED
//  * 
//  * Returns a location NOT in the TV area.
//  * 
//  * TV area:
//  * X-coordinate: xLoc > 250 && xLoc < 360
//  * Y-coordinate: yLoc > 770 && yLoc < 900
//  * 
//  * @returns a location not in the TV area
//  */
//  function generateLocationNotInTVArea(): UserLocation {
//   let x = Math.floor(Math.random() * 1000); // Generates a number 0-1000
//   let y = Math.floor(Math.random() * 1000); // Generates a number 0-1000

//   // if x is between 251-359, generate a new number 0-1000
//   while (x > 250 && x < 360) {
//     x = Math.floor(Math.random() * 1000);
//   }

//   // if y is between 771-899, generate a new number 0-1000
//   while (y > 770 && y < 900) {
//     y = Math.floor(Math.random() * 1000);
//   }

//   return {
//     rotation: 'back',
//     moving: Math.random() < 0.5,
//     x: x,
//     y: y
//   };
// }

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
  it('constructor should set the videoList property', () => { // ANDREW 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController["_videoList"]) // Notation is TypeScript's official suggestion for accessing private properties https://github.com/microsoft/TypeScript/issues/19335 
      .toHaveLength(10);
  });
  it('constructor should set the defaultVideoList property', () => { // ANDREW 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController["_defaultVideoList"]) // Notation is TypeScript's official suggestion for accessing private properties https://github.com/microsoft/TypeScript/issues/19335 
      .toHaveLength(10);
  });
  it('constructor should set the defaultVideoInfo property to any video info in defaultVideoList', () => { // ANDREW 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    const defaultURLs = townController["_defaultVideoList"].map((info) => info.url);
    expect(defaultURLs) 
      .toContainEqual(townController["_defaultVideoInfo"].url); // github.com/microsoft/TypeScript/issues/19335 
    expect(townController["_defaultVideoInfo"].isPlaying).toBe(true);
    expect(townController["_defaultVideoInfo"].timestamp).toBe(0);
  });
  it('constructor should set the currentVideoInfo property to match defaultVideoInfo', () => { // ANDREW 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController["_currentVideoInfo"]) 
      .toStrictEqual(townController["_defaultVideoInfo"]); // github.com/microsoft/TypeScript/issues/19335 
  });
  it('constructor should set the masterVideoLength property to number of seconds based on currentVideoInfo', () => { // ANDREW 
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    const firstVideoURL = townController["_defaultVideoInfo"].url;
    const firstVideo = townController["_defaultVideoList"].find((video) => video.url === firstVideoURL);
    const videoHoursMinutesSeconds = firstVideo?.duration.split(':');
    // vidDurationSeconds will never be -1, but it is initialized to overcome typescript checking for undefined
    let vidDurationSeconds: number = -1;
    if (videoHoursMinutesSeconds?.length === 3) {
      vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
    } else if (videoHoursMinutesSeconds) {
      vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
    }
    if (vidDurationSeconds) {
      expect(townController["_masterVideoLength"]).toStrictEqual(vidDurationSeconds);
    }
  });
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
  describe('createTimer', () => { // ANDREW
    it('should create a timer with a setTimeout',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const firstVideoURL = townController["_defaultVideoInfo"].url;
        const firstVideo = townController["_defaultVideoList"].find((video) => video.url === firstVideoURL);
        const videoHoursMinutesSeconds = firstVideo?.duration.split(':');
        let vidDurationSeconds: number = -1;
        if (videoHoursMinutesSeconds?.length === 3) {
          vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
        } else if (videoHoursMinutesSeconds) {
          vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
        }
        townController.createTimer();
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), vidDurationSeconds * 1000);
      });
  });
  describe('destroyTimer', () => { // ANDREW
    it('should destroy a timer with a clearTimeout',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer
        townController.destroyTimer();
        expect(clearTimeout).toBeCalled();
      });
  });
  describe('getMilisecondsForTimer', () => { // ANDREW
    it('should return correct time using masterVideoLength and masterTimeElapsed',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const firstVideoURL = townController["_defaultVideoInfo"].url;
        const firstVideo = townController["_defaultVideoList"].find((video) => video.url === firstVideoURL);
        const videoHoursMinutesSeconds = firstVideo?.duration.split(':');
        let vidDurationSeconds: number = -1;
        if (videoHoursMinutesSeconds?.length === 3) {
          vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
        } else if (videoHoursMinutesSeconds) {
          vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
        }
        expect(townController.getMilisecondsForTimer()).toBe(vidDurationSeconds * 1000);
      });
  });
  describe('addTimerToMasterTimeElapsed', () => { // ANDREW
    it('should update masterTimeElapsed using currentTimer.getElapsedSeconds and masterTimeElapsed',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer
        const currTimer = townController["_currentTimer"];
        if (currTimer) {
          currTimer.getElapsedSeconds = jest.fn(() => 40);
        }
        townController.addTimerToMasterTimeElapsed();
        expect(townController["_masterTimeElapsed"]).toBe(40);
        townController.destroyTimer();
      });
  });
  describe('pauseVideos', () => { // ANDREW
    it('should update masterTimeElapsed if there is a timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer
        const currTimer = townController["_currentTimer"];
        if (currTimer) {
          currTimer.getElapsedSeconds = jest.fn(() => 40);
        }
        townController.pauseVideos();
        expect(townController["_masterTimeElapsed"]).toBe(40);
      });
    it('should destroy timer if there is a timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer
        townController.pauseVideos();
        expect(townController["_currentTimer"]).toBeNull();
        expect(clearTimeout).toBeCalled();
      });
    it('should not update masterTimeElapsed if there is not timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const currTimer = townController["_currentTimer"];
        if (currTimer) {
          currTimer.getElapsedSeconds = jest.fn(() => 40);
        }
        townController.pauseVideos();
        expect(townController["_masterTimeElapsed"]).toBe(0);
      });
    it('should not destroy timer if there is not timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.destroyTimer = jest.fn();
        townController.pauseVideos();
        expect(townController.destroyTimer).not.toBeCalled();
      });
  });
  describe('syncVideos', () => { // ANDREW
    it('should call pauseVideos if there is a timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer so that first if-block runs 
        townController.pauseVideos = jest.fn();
        townController.syncVideos();
        expect(townController.pauseVideos).toBeCalled();
        townController.destroyTimer();
      });
    it('should call playVideos if there is a timer',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.playVideos(); // creates a timer
        townController.playVideos = jest.fn();
        townController.syncVideos();
        expect(townController.playVideos).toHaveBeenCalledTimes(1);
        townController.destroyTimer();
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
        townController.createTimer = jest.fn();
        townController.playVideos();
        expect(townController.createTimer).toBeCalled();
        expect(townController["_currentTimer"]).not.toBeNull();
      });
    it('should not create a timer if there is a timer beforehand',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        jest.useFakeTimers();
        townController.playVideos(); // this call creates the timer 
        townController.createTimer = jest.fn();
        townController.playVideos(); // this call is for actually testing funtionality after a timer exists
        expect(townController.createTimer).not.toBeCalled();
        expect(townController["_currentTimer"]).not.toBeNull();
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
        expect(townController["_listenersInTVAreaMap"].entries()).toContainEqual([newPlayer, mockListener]);
      });
    it('should create a timer if there is no timer beforehand and only one person added to listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const newPlayer = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController.addToTVArea(newPlayer, mockListener);
        expect(townController["_currentTimer"]).not.toBeNull();
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
        townController.createTimer = jest.fn();
        townController.addToTVArea(newPlayer, mockListener);
        expect(townController.createTimer).not.toBeCalled();
      });
    it('should not create a new timer if there is not a timer beforehand and listenersInTVAreaMap has size > 1',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const originalPlayer = new Player('added to map');
        const originalMockListener = mock<CoveyTownListener>();
        const newPlayer = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController["_listenersInTVAreaMap"].set(originalPlayer, originalMockListener);
        townController.createTimer = jest.fn();
        townController.addToTVArea(newPlayer, mockListener);
        expect(townController.createTimer).not.toBeCalled();
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
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController.removeFromTVArea(player);
        expect(townController["_listenersInTVAreaMap"].entries()).not.toContainEqual([player, mockListener]);
      });
    it('should destroy timer if no more people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController.destroyTimer = jest.fn();
        townController.removeFromTVArea(player);
        expect(townController.destroyTimer).toBeCalled();
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
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController["_listenersInTVAreaMap"].set(extraPlayer, extraMockListener);
        townController.destroyTimer = jest.fn();
        townController.removeFromTVArea(player);
        expect(townController.destroyTimer).not.toBeCalled();
      });
    it('should set masterTimeElapsed to zero if no more people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController["_masterTimeElapsed"] = 10;
        townController.removeFromTVArea(player);
        expect(townController["_masterTimeElapsed"]).toBe(0);
      });
    it('should set videoList to default video list if no more people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController["_videoList"] = [];
        townController.removeFromTVArea(player);
        expect(townController["_videoList"]).toHaveLength(10);
      });
    it('should reset defaultVideoInfo if no more people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController["_defaultVideoInfo"] = {
          url: '',
          timestamp: 100,
          isPlaying: false,
        };
        townController.removeFromTVArea(player);
        expect(townController["_defaultVideoInfo"].url).not.toHaveLength(0);
        expect(townController["_defaultVideoInfo"].timestamp).toBe(0);
        expect(townController["_defaultVideoInfo"].isPlaying).toBe(true);
      });
    it('should set currentVideoInfo to defaultVideoInfo if no more people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        townController["_currentVideoInfo"] = {
          url: '',
          timestamp: 100,
          isPlaying: false,
        };
        townController.removeFromTVArea(player);
        expect(townController["_currentVideoInfo"]).toStrictEqual(townController["_defaultVideoInfo"]);
      });
    it('should set masterVideoLength if no more people left in listenersInTVAreaMap',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player = new Player('added to map');
        const mockListener = mock<CoveyTownListener>();
        townController["_listenersInTVAreaMap"].set(player, mockListener);
        const potentialDurations = townController["_defaultVideoList"].map((video) => {
          const videoHoursMinutesSeconds = video.duration.split(':');
          let vidDurationSeconds;
          if (videoHoursMinutesSeconds.length === 3) {
            vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
          } else {
            vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
          }
          return vidDurationSeconds;
        })
        townController.removeFromTVArea(player);
        expect(potentialDurations).toContainEqual(townController["_masterVideoLength"]);
      });
  });
  describe('chooseNextVideo', () => { // ANDREW
    it('should destroy current timer',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.destroyTimer = jest.fn();
        townController.chooseNextVideo();
        expect(townController.destroyTimer).toBeCalled();
      });
    it('should set masterTimeElapsed to 0',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_masterTimeElapsed"] = 100;
        townController.chooseNextVideo();
        expect(townController["_masterTimeElapsed"]).toBe(0);
      });
    it('should set masterVideoLength to duration in videoList with most votes',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
        const videoHoursMinutesSeconds = townController["_defaultVideoList"][0].duration.split(':');
        let vidDurationSeconds;
        if (videoHoursMinutesSeconds.length === 3) {
          vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 3600 + parseInt(videoHoursMinutesSeconds[1], 10) * 60 + parseInt(videoHoursMinutesSeconds[2], 10);
        } else {
          vidDurationSeconds = parseInt(videoHoursMinutesSeconds[0], 10) * 60 + parseInt(videoHoursMinutesSeconds[1], 10);
        }
        townController.chooseNextVideo();
        expect(townController["_masterVideoLength"]).toBe(vidDurationSeconds);
      });
    it('should set currentVideoInfo url based on video in videoList with most votes',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
        townController.chooseNextVideo();
        expect(townController["_currentVideoInfo"].url).toStrictEqual(townController["_defaultVideoList"][0].url);
      });
    it('should set currentVideoInfo url based on video in videoList with most votes - multiple voted urls',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
        townController["_videoURLVotes"].set(townController["_defaultVideoList"][1].url, 2);
        townController.chooseNextVideo();
        expect(townController["_currentVideoInfo"].url).toStrictEqual(townController["_defaultVideoList"][1].url);
      });
    it('should create new currentTimer',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.createTimer = jest.fn();
        townController.chooseNextVideo();
        expect(townController.createTimer).toBeCalled();
        expect(townController["_currentTimer"]).not.toBeNull();
      });
    it('should reset videoURLVotes',
      () => {
        jest.useFakeTimers();
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_videoURLVotes"].set(townController["_defaultVideoList"][0].url, 1);
        townController["_videoURLVotes"].set(townController["_defaultVideoList"][1].url, 2);
        townController.chooseNextVideo();
        expect(townController["_videoURLVotes"].size).toBe(0);
      });
  });
  describe('voteForVideo', () => { // ANDREW
    it('should add vote for URL that has not been seen before',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController.voteForVideo('testURL');
        expect(townController["_videoURLVotes"].get('testURL')).toBe(1);
      });
    it('should add vote for URL that has been seen before',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_videoURLVotes"].set('testURL', 1);
        townController.voteForVideo('testURL');
        expect(townController["_videoURLVotes"].get('testURL')).toBe(2);
      });
    it('should add vote for correct URL where other URLs have been voted for',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_videoURLVotes"].set('testURL', 1);
        townController["_videoURLVotes"].set('anotherTestURL', 5);
        townController.voteForVideo('testURL');
        expect(townController["_videoURLVotes"].get('testURL')).toBe(2);
      });
    it('should add vote for correct URL where other URLs have been voted for and URL has not been seen before',
      () => {
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        townController["_videoURLVotes"].set('anotherTestURL', 5);
        townController.voteForVideo('testURL');
        expect(townController["_videoURLVotes"].get('testURL')).toBe(1);
      });
  });
  // describe('addVideoToVideoList', () => { // ANDREW - Have not figured out proper way to mock axios and return right data
  //   it('should add URL to videoList if approved',
  //     async () => {
  //       const townName = `FriendlyNameTest-${nanoid()}`;
  //       const townController = new CoveyTownController(townName, false);
  //       jest.mock('axios');
  //       // const mockedAxios = axios as jest.Mocked<typeof axios>
  //       const mock = jest.spyOn(axios, 'get');
  //       const vidData = {items: [{snippet: 'fake title', contentDetails: 'PT3M21S'}]};
  //       const vidResponse = {data: vidData};
  //       mock.mockReturnValueOnce(() => Promise.resolve(vidResponse));
  //       // mockedAxios.get.mockReturnValueOnce(() => Promise.resolve(vidResponse));
  //       // axios.get.mockResolvedValue(vidResponse);
  //       const mockListener = mock<CoveyTownListener>();
  //       await townController.addVideoToVideoList('fakeURL', mockListener);
  //       expect(townController["_videoList"]).toContainEqual({url: 'fakeURL', title: 'fake title', channel: 'fake title', duration: '03:21'});
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
        const mockListener = mock<CoveyTownListener>();
        townController["_videoList"].push({
          url: 'testURL',
          title: 'test title',
          channel: 'test channel',
          duration: '02:35',
        })
        townController.addVideoToVideoList = jest.fn();
        townController.checkNewURLValidity('testURL', mockListener);
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
    beforeEach(() => {
      const townName = `town listeners and events tests ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      mockListeners.forEach(mockReset);
      jest.useFakeTimers();
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
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
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
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.playVideos();
      expect(mockListeners[0].onVideoSyncing).toBeCalled();
      expect(mockListeners[1].onVideoSyncing).toBeCalled();
    });
    it('should notify added listeners in tv area that the video player is to be synced when syncVideos is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.playVideos();
      testingTown.syncVideos();
      expect(mockListeners[0].onVideoSyncing).toHaveBeenCalledTimes(2);
      expect(mockListeners[1].onVideoSyncing).toHaveBeenCalledTimes(2);
    });
    it('should notify added listeners in tv area to be synced when addToTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      expect(mockListeners[0].onVideoSyncing).toBeCalled();
      expect(mockListeners[1].onVideoSyncing).toBeCalled();
    });
    it('should notify added listeners in tv area to display voting widget when addToTVArea is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const secondPlayer = new Player('second player');
      await testingTown.addPlayer(secondPlayer);
      
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
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
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.addToTVArea(player, mockListeners[0]);
      testingTown.addToTVArea(secondPlayer, mockListeners[1]);
      expect(mockListeners[0].onUpdatingNextVideoOptions).toBeCalled();
      expect(mockListeners[1].onUpdatingNextVideoOptions).toBeCalled();
    });
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
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
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
      testingTown["_listenersInTVAreaMap"].set(player, mockListeners[0]);
      testingTown["_listenersInTVAreaMap"].set(secondPlayer, mockListeners[1]);
      testingTown.removeFromTVArea(player);
      testingTown.removeFromTVArea(secondPlayer);
      testingTown.playVideos();
      mockListeners.forEach(listener => expect(listener.onVideoSyncing).not.toBeCalled());
    });
  });
  describe('townSubscriptionHandler', () => {
    const mockSocket = mock<Socket>();
    let testingTown: CoveyTownController;
    let player: Player;
    let session: PlayerSession;
    beforeEach(async () => {
      const townName = `connectPlayerSocket tests ${nanoid()}`;
      testingTown = CoveyTownsStore.getInstance().createTown(townName, false);
      mockReset(mockSocket);
      player = new Player('test player');
      session = await testingTown.addPlayer(player);
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
      it('should add a town listener, which should emit "playerPaused" to the socket when a player pauses when listener in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.addToTVArea(player, testingTown["_listeners"][0]);
        testingTown.pauseVideos();
        expect(mockSocket.emit).toBeCalledWith('playerPaused');
      });
      it('should add a town listener, which should not emit "playerPaused" to the socket when a player pauses when listener not in listenersInTVAreaMap', async () => {
        TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.pauseVideos();
        expect(mockSocket.emit).not.toBeCalledWith('playerPaused');
      });
    });
  });
});
