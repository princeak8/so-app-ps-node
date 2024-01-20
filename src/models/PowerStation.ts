import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, EntitySchema } from 'typeorm';

@Entity({name: "power_stations"})
@Unique(['identifier']) // Ensures uniqueness of the 'identifier' column
class PowerStation extends BaseEntity {
  @PrimaryGeneratedColumn()
    id: number;

  @Column({ type: "varchar" })
    name: string;

  @Column({ unique: true, type: "varchar" })
  identifier: string;
}

export default PowerStation