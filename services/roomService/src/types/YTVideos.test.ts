import { YTVideo, getDefaultVideos } from './YTVideo';


describe('getDefaultVideos', () => {
  let videoList: YTVideo[];
  beforeEach(() => {
    videoList= getDefaultVideos();
  });
  it('should contain 10 default videos', () => {
    expect(videoList).toHaveLength(10);
  });
  it('should contain first Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=5kcdRBHM7kM',
      title: 'Super Mario Odyssey - Nintendo Switch Presentation 2017 Trailer',
      channel: 'Nintendo',
      duration: '02:42',
    });
  });
  it('should contain second Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=YqeW9_5kURI',
      title: 'Major Lazer & DJ Snake - Lean On (feat. MØ) (Official Music Video)',
      channel: 'Major Lazer',
      duration: '02:59',
    });
  });
  it('should contain third Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=1GnpegxJRYk',
      title: 'Erik Myers - Taco Bell Application (Stand-up Clip)',
      channel: 'Laugh Factory',
      duration: '02:20',
    });
  });
  it('should contain fourth Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=PlpjPCssEXE',
      title: "Marvel's Loki - Official Trailer (2021) Tom Hiddleston, Owen Wilson",
      channel: 'IGN',
      duration: '02:44',
    });
  });
  it('should contain fifth Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=pTrTOMahg6A',
      title: 'Chic-Fil-A be like...(Original Tik Tok)',
      channel: 'Thee BlackBadger',
      duration: '00:33',
    });
  });
  it('should contain sixth Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=leL_bsHEZdM',
      title: 'Key & Peele - Gangsta Standoff',
      channel: 'Key & Peele',
      duration: '02:49',
    });
  });
  it('should contain seventh Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=cg1rtWXHSKU',
      title: 'Captain America vs Ultron - Fight Scene - Avengers: Age of Ultron - Movie CLIP HD',
      channel: 'TopMovieClips',
      duration: '03:52',
    });
  });
  it('should contain eighth Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=rR4n-0KYeKQ',
      title: 'how we write/review code in big tech companies',
      channel: 'Joma Tech',
      duration: '01:11',
    });
  });
  it('should contain ninth Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=D7y_hoT_YZI',
      title: 'Reversing a linked list | GeeksforGeeks',
      channel: 'GeeksforGeeks',
      duration: '01:44',
    });
  });
  it('should contain tenth Video info', () => {
    expect(videoList).toContainEqual({
      url: 'https://www.youtube.com/watch?v=kXaWHHN_fxs',
      title: 'Movie hackers vs real programmers #shorts',
      channel: 'Mansoor Codes',
      duration: '00:31',
    });
  });
});
