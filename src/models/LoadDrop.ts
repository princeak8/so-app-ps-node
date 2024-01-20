// src/models/PowerDrop.js
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, EntitySchema, Timestamp } from 'typeorm';
  import PowerStation from './PowerStation';
  
  @Entity({name: "power_drops"})
  class PowerDrop extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => PowerStation, (powerStation: { powerDrops: any; }) => powerStation.powerDrops)
    @JoinColumn({ name: 'power_station_id' })
    powerStation: any;
  
    @Column({ type: 'float' })
    load: number;
  
    @Column({ type: 'float' })
    previous_load: number;

    @Column({ type: 'float' })
    reference_load: number;
  
    @Column({ type: 'timestamp' })
    time_of_drop: Timestamp;

    @Column({ type: 'character', length: 100 })
    calculation_type: String;
  
    @Column({ type: 'timestamp', nullable: true })
    acknowledged_at: Timestamp;
  
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Timestamp;
  
    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Timestamp;
  }
  
  export default PowerDrop;
  