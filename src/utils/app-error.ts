export class AppError extends Error {
  constructor(
    public message: string,
    public statusText: string,
    public statusCode: number,
  ) {
    super(message);
    this.statusText = statusText;
    this.statusCode = statusCode;
  }
}
