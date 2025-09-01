import { Subscription } from 'src/subscriptions/entities/subscription.entity';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('billing_records', {
  orderBy: {
    id: 'ASC',
  },
})
export class BillingRecord {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Subscription, {
    eager: true,
    onDelete: 'CASCADE', // This is the key for database-level cascade delete
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Negative for credits, positive for charges

  @Column()
  description: string;
}
