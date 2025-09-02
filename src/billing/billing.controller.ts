import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingRecordDto } from './dto/create-billing-record.dto';
import { UpdateBillingRecordDto } from './dto/update-billing-record.dto';
import { FilterBillingRecordDto } from './dto/filter-billing-record.dto';

@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) { }

  // @Post()
  // create(@Body() createBillingRecordDto: CreateBillingRecordDto) {
  //   return this.billingService.create(createBillingRecordDto);
  // }

  @Get()
  findAll(@Query() filter: FilterBillingRecordDto) {
    return this.billingService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(+id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateBillingRecordDto: UpdateBillingRecordDto,
  // ) {
  //   return this.billingService.update(+id, updateBillingRecordDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.billingService.remove(+id);
  // }
}
