import { Controller } from "@nestjs/common";
import { EventPattern, MessagePattern } from "@nestjs/microservices";

import { ToResponse, empowerCorpDto, empowerCorpRes, isCorpEmpowerDto, isCorpEmpowerRes } from "qqlx-sdk";

import { ScheduleCardOrderService } from "src/scheduleCardOrder/service";

@Controller()
export class ScheduleCardOrderRpc {
    constructor(private readonly ScheduleCardOrderService: ScheduleCardOrderService) {}

    @MessagePattern("empowerCorp")
    @ToResponse()
    async empowerCorp(dto: empowerCorpDto): Promise<empowerCorpRes> {
        await this.ScheduleCardOrderService.empowerCorp(dto.corpId);
        return null;
    }

    @MessagePattern("isCorpEmpower")
    @ToResponse()
    async isCorpEmpower(dto: isCorpEmpowerDto): Promise<isCorpEmpowerRes> {
        await this.ScheduleCardOrderService.isCorpEmpower(dto.corpId);
        return null;
    }
}
