export default class SectionQuestion {
  public maxMarks: number;
  public part: number;
  public co: number[];
  constructor(maxMarks: number, part: number, co: number[]) {
    this.co = co;
    this.maxMarks = maxMarks;
    this.part = part;
  }
  public getMaxMarks(): number {
    return this.maxMarks;
  }
  public getPart(): number {
    return this.part;
  }
  public getCo(): number[] {
    return this.co;
  }
}
