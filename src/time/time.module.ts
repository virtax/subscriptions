import { Module } from '@nestjs/common';
import { TimeService } from './time.service';
import { TimeController } from './time.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  exports: [TimeService],
  controllers: [TimeController],
  providers: [TimeService],
})
export class TimeModule {}
