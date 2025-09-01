import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';

@Injectable()
export class PlansService {
  constructor(
    @Inject('PLANS_REPOSITORY')
    private plansRepository: Repository<Plan>,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    const plan = this.plansRepository.create(createPlanDto);
    const savedPlan = await this.plansRepository.save(plan);

    return plainToClass(CreatePlanDto, savedPlan);
  }

  async findAll() {
    const plans = await this.plansRepository.find();
    return plans.map((plan) => plainToClass(UpdatePlanDto, plan));
  }

  async findOne(id: number) {
    const plan = await this.plansRepository.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return plainToClass(CreatePlanDto, plan);
  }

  async update(id: number, updatePlanDto: UpdatePlanDto) {
    const plan = await this.plansRepository.preload({
      id: id,
      ...updatePlanDto,
    });
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    const savedPlan = await this.plansRepository.save(plan);
    return plainToClass(UpdatePlanDto, savedPlan);
  }

  async remove(id: number) {
    const result = await this.plansRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
  }
}
