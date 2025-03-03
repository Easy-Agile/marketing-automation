export class AttachableError extends Error {
  constructor(msg: string, public attachment: string) {
    super(msg);
    this.attachment = attachment;
  }
}

export class SimpleError extends Error {
  simple: boolean;
  constructor(msg: string) {
    super(msg);
    this.simple = true;
  }
}
