import { YoutubeVideoInfo } from '../CoveyTypes';
import Player from './Player';
import { YTVideo } from './YTVideo';

/**
 * A listener for player-related events in each town
 */
export default interface CoveyTownListener {
  /**
   * Called when a player joins a town
   * @param newPlayer the new player
   */
  onPlayerJoined(newPlayer: Player): void;

  /**
   * Called when a player's location changes
   * @param movedPlayer the player that moved
   */
  onPlayerMoved(movedPlayer: Player): void;

  /**
   * Called when a player disconnects from the town
   * @param removedPlayer the player that disconnected
   */
  onPlayerDisconnected(removedPlayer: Player): void;

  /**
   * Called when a town is destroyed, causing all players to disconnect
   */
  onTownDestroyed(): void;

  /**
   * Called a user should pause video
   */
  onPlayerPaused(): void;

  /**
   * Called when a user should load their video player up to the given URL and timestamp as well as
   * either play or pause video
   * 
   * @param videoInfo The current url, timestamp, and playing status that video player should load up
   */
  onVideoSyncing(videoInfo: YoutubeVideoInfo): void;

  /**
   * Called when a user should re-enable their voting button when new video starts
   */
  onEnableVoting(): void;

  /**
   * Called when a user should disable play/pause, sync, and mute/unmute buttons after leaving TV area
   */
  onDisableControlButtons(): void;

  /**
   * Called when a user should display the current video options for next video in their voting widget
   * 
   * @param videoList The list of videos that should be displayed in table
   */
  onUpdatingNextVideoOptions(videoList: YTVideo[]): void;

  /**
   * Called when a user should reset their video options to vote on to an empty list
   */
  onResetVideoOptions(): void;

  /**
   * Called when a user should display their voting widget after joining the stream
   */
  onDisplayVotingWidget(): void;

  /**
   * Called when a video that can be voted on is added to the list of current videos, and
   * the user should be notified that they have another option to vote on
   */
  onVideoAdded(): void;

  /**
   * Called when a video that was submitted by user cannot be added to the list of videos
   * to vote on since it is not a valid Youtube URL, and the user should be notified as such
   */
  onUnableToAddVideo(): void;

  /**
   * Called when a video that was submitted by user cannot be added to the list of videos
   * to vote on since it is not in the format of a Youtube URL, and the user should be notified as such
   */
  onUnableToUseURL(): void;
}
