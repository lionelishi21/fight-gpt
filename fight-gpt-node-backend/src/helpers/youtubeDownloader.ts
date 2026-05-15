export class YoutubeBotBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YoutubeBotBlockError';
  }
}
