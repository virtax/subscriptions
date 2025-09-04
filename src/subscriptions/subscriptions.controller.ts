import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { FilterSubscriptionDto } from './dto/filter-subscription.dto';

@Controller('api/v1/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  findAll(@Query() filter: FilterSubscriptionDto) {
    return this.subscriptionsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    if (updateSubscriptionDto.user_id) {
      throw new BadRequestException(["You can't change user_id"]);
    }
    if (updateSubscriptionDto.plan_start_date) {
      throw new BadRequestException(["You can't change plan_start_date"]);
    }
    if (updateSubscriptionDto.billing_cycle_start_date) {
      throw new BadRequestException([
        "You can't change billing_cycle_start_date",
      ]);
    }
    if (updateSubscriptionDto.billing_cycle_end_date) {
      throw new BadRequestException([
        "You can't change billing_cycle_end_date",
      ]);
    }
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(+id);
  }
}
