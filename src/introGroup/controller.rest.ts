import { Controller, Get, Post, Body, Patch, Delete, SetMetadata, UseGuards, Put } from "@nestjs/common";

import {
    ENUM_MARKET_ROLE,
    PATH_INTRO_GROUP,
    ENUM_PROJECT,
    postIntroGroupDto,
    postIntroGroupRes,
    getIntroGroupDto,
    getIntroGroupRes,
    putIntroGroupDto,
    putIntroGroupRes,
    deleteIntroGroupDto,
    deleteIntroGroupRes,
} from "qqlx-core";
import { UserDTO } from "qqlx-sdk";

import { IntroDao } from "dao/intro";
import { IntroGroupDao } from "dao/introGroup";

import { MarketGuard } from "global/market.guard";
import { trimObject } from "qqlx-cdk";

@Controller(PATH_INTRO_GROUP)
@UseGuards(MarketGuard)
export class IntroGroupController {
    constructor(
        //
        private readonly IntroDao: IntroDao,
        private readonly IntroGroupDao: IntroGroupDao
    ) {}

    @Post()
    @SetMetadata("MarketRole", [ENUM_MARKET_ROLE.ROOT, ENUM_MARKET_ROLE.BASE])
    async postIntroGroup(@Body("dto") dto: postIntroGroupDto, @Body("UserDTO") UserDTO: UserDTO): Promise<postIntroGroupRes> {
        const group = await this.IntroGroupDao.create(dto.group);

        for (const intro of dto.intros) {
            intro.groupId = group._id;
            await this.IntroDao.create(intro);
        }

        return null;
    }

    @Post("/get")
    async getIntroGroup(@Body("dto") dto: getIntroGroupDto): Promise<getIntroGroupRes> {
        const search = dto.search;
        const match = {
            scope: search.scope,
            ...(search.path && { path: search.path }),
        };
        const results = await this.IntroGroupDao.aggregate([
            { $match: {} },
            { $lookup: { from: "intros", localField: "_id", foreignField: "groupId", as: "joinIntros" } },
            //
        ]);
        return results;
    }

    @Put()
    @SetMetadata("MarketRole", [ENUM_MARKET_ROLE.ROOT])
    async putIntroGroup(@Body("dto") dto: putIntroGroupDto, @Body("UserDTO") UserDTO: UserDTO): Promise<putIntroGroupRes> {
        const group = await this.IntroGroupDao.findOne(dto.group._id);
        if (!group) throw new Error(`找不到群组`);

        // 更新群组
        await this.IntroGroupDao.updateOne(group._id, {
            path: dto.group.path,
            actions: dto.group.actions,
        });

        // 删除之前的说明
        const intros = await this.IntroDao.query({ groupId: group._id });
        await this.IntroDao.deleteMany(intros.map((e) => e._id));

        // 添加新说明
        for (const intro of dto.intros) {
            intro.groupId = group._id;
            await this.IntroDao.create(intro);
        }
        return null;
    }

    @Post("/delete")
    @SetMetadata("MarketRole", [ENUM_MARKET_ROLE.ROOT])
    async deleteIntroGroup(@Body("dto") dto: deleteIntroGroupDto, @Body("UserDTO") UserDTO: UserDTO): Promise<deleteIntroGroupRes> {
        const exist = await this.IntroGroupDao.findOne(dto.groupId);
        if (!exist) throw new Error(`找不到群组`);

        // 删除群组
        await this.IntroGroupDao.delete(exist._id);

        // 删除之前的说明
        const intros = await this.IntroDao.query({ groupId: exist._id });
        await this.IntroDao.deleteMany(intros.map((e) => e._id));
        return null;
    }
}
