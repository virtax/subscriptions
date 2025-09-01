// import { Subscription } from 'src/subscriptions/entities/subscription.entity';

import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column('text')
  name: string;

  @Column('text')
  email: string;
}
