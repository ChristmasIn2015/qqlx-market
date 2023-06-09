import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ScheduleCard, ScheduleCardSchema, ScheduleCardDao } from "dao/scheduleCard";
import { ScheduleCardOrder, ScheduleCardOrderSchema, ScheduleCardOrderDao } from "dao/scheduleCardOrder";
import { MarketRole, MarketRoleSchema, MarketRoleDao } from "dao/role";
import { Intro, IntroSchema, IntroDao } from "dao/intro";
import { IntroGroup, IntroGroupSchema, IntroGroupDao } from "dao/introGroup";

import { LogRemote } from "remote/log";
import { UserRemote } from "remote/user";
import { ScheduleCardOrderService } from "src/scheduleCardOrder/service";

import { ScheduleCardController } from "src/scheduleCard/controller.rest";
import { ScheduleCardOrderController } from "src/scheduleCardOrder/controller.rest";
import { AnalysisController } from "src/analysis/controller.rest";
import { IntroGroupController } from "src/introGroup/controller.rest";

import { ScheduleCardOrderRpc } from "src/scheduleCardOrder/controller.rpc";

@Module({
    imports: [
        MongooseModule.forRoot("mongodb://127.0.0.1:27017/qqlx"),
        MongooseModule.forFeature([
            { name: ScheduleCard.name, schema: ScheduleCardSchema },
            { name: ScheduleCardOrder.name, schema: ScheduleCardOrderSchema },
            { name: MarketRole.name, schema: MarketRoleSchema },
            { name: Intro.name, schema: IntroSchema },
            { name: IntroGroup.name, schema: IntroGroupSchema },
        ]),
    ],
    controllers: [
        AnalysisController,
        ScheduleCardController,
        ScheduleCardOrderController,
        IntroGroupController,
        //
        ScheduleCardOrderRpc,
    ],
    providers: [
        ScheduleCardDao,
        ScheduleCardOrderDao,
        MarketRoleDao,
        IntroDao,
        IntroGroupDao,
        //
        LogRemote,
        UserRemote,
        ScheduleCardOrderService,
    ],
})
export class AppModule {}
