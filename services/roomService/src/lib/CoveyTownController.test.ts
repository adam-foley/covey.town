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
import { EXPECTATION_FAILED } from 'http-status-codes';

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
    });
  });
});
