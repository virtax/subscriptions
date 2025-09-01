import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
  private mockedTime: Date | null = null;

  setMockedTime(time: Date | null) {
    this.mockedTime = time;
  }

  getCurrentTime(): Date {
    return this.mockedTime || new Date();
  }
}
