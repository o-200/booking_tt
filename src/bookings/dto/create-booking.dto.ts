import { IsInt, IsNumber, IsPositive } from "class-validator";

export class CreateBookingDto {
  @IsInt()
  @IsPositive()
  event_id: number;

  @IsInt()
  @IsPositive()
  user_id: string;
}
