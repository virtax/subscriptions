import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column('text')
  name: string;

  @Column('numeric', { precision: 15, scale: 2 })
  price_per_month: number;

  @Column('int')
  qr_code_limit: number;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
