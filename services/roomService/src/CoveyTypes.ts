export type Direction = 'front' | 'back' | 'left' | 'right';
export type UserLocation = {
  x: number;
  y: number;
  rotation: Direction;
  moving: boolean;
};
export type CoveyTownList = { friendlyName: string; coveyTownID: string; currentOccupancy: number; maximumOccupancy: number }[];

/** 
 * Represents the state of a video, with url, timestamp, and whether video is playing
 */
export type YoutubeVideoInfo = {
  url: string;
  timestamp: number;
  isPlaying: boolean;
};

export type VideoActionTimeStamp = {
  actionType: string;
  actionDate: Date;
};