import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { TimeService } from './time.service';
import { SetTimeDto } from './dto/set-time.dto';

@Controller('api/v1/time')
export class TimeController {
  constructor(private readonly timeService: TimeService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  setTime(@Body() setTimeDto: SetTimeDto) {
    if (setTimeDto?.time) {
      this.timeService.setMockedTime(new Date(setTimeDto.time));
    } else {
      this.timeService.setMockedTime(null);
    }
  }

  @Get()
  getTime() {
    return this.timeService.getCurrentTime().toISOString();
  }
}
