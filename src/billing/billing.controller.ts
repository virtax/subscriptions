import { Controller, Get, Param, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { FilterBillingRecordDto } from './dto/filter-billing-record.dto';

@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  findAll(@Query() filter: FilterBillingRecordDto) {
    return this.billingService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(+id);
  }
}
