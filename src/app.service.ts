import { Injectable } from '@nestjs/common';
import { TimeService } from './time/time.service';
import moment from 'moment';

@Injectable()
export class AppService {
  constructor(private readonly timeService: TimeService) {}

  getHello(): string {
    const currentTime = moment(this.timeService.getCurrentTime());
    return `Hello! The current mocked time is ${currentTime.toISOString()}`;
  }
}
