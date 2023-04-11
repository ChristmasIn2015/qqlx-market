import { Controller, Get, Post, Body, Patch, Delete, SetMetadata, UseGuards } from "@nestjs/common";

import {
    ENUM_MARKET_ROLE,
    PATH_MARKET_CARD,
    ENUM_PROJECT,
    postScheduleCardDto,
    postScheduleCardRes,
    getScheduleCardDto,
    getScheduleCardRes,
    patchScheduleCardDto,
    patchScheduleCardRes,
    deleteScheduleCardDto,
    deleteScheduleCardRes,
} from "qqlx-core";
import { UserDTO } from "qqlx-sdk";

import { ScheduleCardDao } from "dao/scheduleCard";

import { MarketGuard } from "global/market.guard";

@Controller(PATH_MARKET_CARD)
@UseGuards(MarketGuard)
export class ScheduleCardController {
    constructor(
        //
        private readonly ScheduleCardDao: ScheduleCardDao
    ) {}

    @Post()
    @SetMetadata("MarketRole", [ENUM_MARKET_ROLE.ROOT])
    async postScheduleCard(@Body("dto") dto: postScheduleCardDto, @Body("UserDTO") UserDTO: UserDTO): Promise<postScheduleCardRes> {
        if (!dto.schema?.title) throw new Error("请输入礼品卡名称");

        const schema = this.ScheduleCardDao.getSchema();
        schema.scope = ENUM_PROJECT.KDBGS;
        schema.title = dto.schema?.title;
        schema.desc = dto.schema?.desc;
        schema.schedule = Number(dto.schema?.schedule) || 0;
        schema.amount = Number(dto.schema?.amount);

        await this.ScheduleCardDao.create(schema);
        return null;
    }

    @Post("/get")
    async getScheduleCard(@Body("dto") dto: getScheduleCardDto, @Body("UserDTO") UserDTO: UserDTO): Promise<getScheduleCardRes> {
        const results = await this.ScheduleCardDao.query({ scope: dto.scope });
        return results.map((e) => {
            e.amount /= 100;
            return e;
        });
    }

    @Patch()
    @SetMetadata("MarketRole", [ENUM_MARKET_ROLE.ROOT])
    async patchScheduleCard(@Body("dto") dto: patchScheduleCardDto, @Body("UserDTO") UserDTO: UserDTO): Promise<patchScheduleCardRes> {
        if (!dto.schema?.title) throw new Error("请输入礼品卡名称");

        const updater = {
            title: dto.schema?.title,
            desc: dto.schema?.desc,
            isDisabled: dto.schema?.isDisabled,
        };
        await this.ScheduleCardDao.updateOne(dto.schema?._id, updater);
        return null;
    }

    @Post("/delete")
    @SetMetadata("MarketRole", [ENUM_MARKET_ROLE.ROOT])
    async deleteScheduleCard(@Body("dto") dto: deleteScheduleCardDto, @Body("UserDTO") UserDTO: UserDTO): Promise<deleteScheduleCardRes> {
        const exist = await this.ScheduleCardDao.findOne(dto.cardId);
        if (!exist) throw new Error(`找不到礼品卡`);

        await this.ScheduleCardDao.updateOne(exist._id, { isDisabled: !exist.isDisabled });
        return null;
    }
}
