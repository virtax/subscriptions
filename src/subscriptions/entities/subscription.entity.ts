import { User } from 'src/users/entities/user.entity';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Index,
} from 'typeorm';

import { Plan } from './plan.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToOne(() => User, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({
    type: 'timestamp',
  })
  plan_start_date: Date;

  @Column({
    type: 'timestamp',
  })
  @Index()
  billing_cycle_start_date: Date;

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  billing_cycle_end_date: Date;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  outstanding_credit: number;

  @Column('int', { default: 0 })
  current_qrcode_usage: number;
}
