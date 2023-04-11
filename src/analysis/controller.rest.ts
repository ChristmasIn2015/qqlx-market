import { Controller, Get, Post, Body, Patch, Delete, SetMetadata, UseGuards } from "@nestjs/common";

import { ENUM_PROJECT, ENUM_MARKET_ROLE, PATH_MARKET_SCO_ANALYSIS, getScoAnalysisDto, getScoAnalysisRes } from "qqlx-core";
import { UserDTO } from "qqlx-sdk";

import { MarketGuard } from "global/market.guard";
import { ScheduleCardOrderService } from "src/scheduleCardOrder/service";

@Controller(PATH_MARKET_SCO_ANALYSIS)
export class AnalysisController {
    constructor(
        //
        private readonly ScheduleCardOrderService: ScheduleCardOrderService
    ) {}

    @Post("/get")
    async getScoAnalysis(@Body("dto") dto: getScoAnalysisDto): Promise<getScoAnalysisRes> {
        const info = await this.ScheduleCardOrderService.getLastActiveOrder(dto.corpId);
        return {
            lastActiveSCO: info,
        };
    }
}
