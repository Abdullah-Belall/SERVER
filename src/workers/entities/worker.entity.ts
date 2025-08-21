import { AbsenceEntity } from 'src/absence/entities/absence.entity';
import { AdvanceEntity } from 'src/advances/entities/advance.entity';
import { ContactsEntity } from 'src/contacts/entities/contacts.entity';
import { DeductionEntity } from 'src/deduction/entities/deduction.entity';
import { RoleEnum } from 'src/types/enums/user.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'workers' })
export class WorkersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column()
  user_name: string;
  @Column({ type: 'int', nullable: true })
  salary: number;
  @Column()
  password: string;
  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.ADMIN })
  role: RoleEnum;
  @OneToMany(() => ContactsEntity, (contact) => contact.worker, {
    cascade: true,
  })
  contacts: ContactsEntity[];
  @OneToMany(() => AdvanceEntity, (advance) => advance.worker, {
    cascade: true,
  })
  advances: AdvanceEntity[];
  @OneToMany(() => AbsenceEntity, (absence) => absence.worker, {
    cascade: true,
  })
  absences: AbsenceEntity[];
  @OneToMany(() => DeductionEntity, (advance) => advance.worker, {
    cascade: true,
  })
  deductions: DeductionEntity[];
  @Column({ default: false })
  is_banned: boolean;
  @Column({ nullable: true })
  banned_reason: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
