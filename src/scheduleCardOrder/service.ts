import { Injectable } from "@nestjs/common";

import { EnumMapOption, MongodbSort } from "qqlx-cdk";
import { ENUM_PAY_STATUS_WECHAT, MAP_ENUM_PAY_STATUS_WECHAT, ENUM_ERROR_CODE } from "qqlx-core";
import { ScheduleCardOrderJoined } from "qqlx-core";

import { ScheduleCardDao } from "dao/scheduleCard";
import { ScheduleCardOrderDao } from "dao/scheduleCardOrder";

@Injectable()
export class ScheduleCardOrderService {
    constructor(private readonly ScheduleCardOrderDao: ScheduleCardOrderDao, private readonly ScheduleCardDao: ScheduleCardDao) {}

    async getLastActiveOrder(corpId: string): Promise<ScheduleCardOrderJoined> {
        const orders: ScheduleCardOrderJoined[] = await this.ScheduleCardOrderDao.aggregate([
            { $match: { corpId, statusWeChatPay: ENUM_PAY_STATUS_WECHAT.SUCCESS } },
            { $sort: { timeCreate: MongodbSort.DES } },
            { $lookup: { from: "schedulecards", localField: "cardId", foreignField: "_id", as: "joinCard" } },
        ]);
        orders.forEach((e) => (e.joinCard = e.joinCard[0]));
        return orders[0] || null;
    }

    async isCorpEmpower(corpId: string) {
        const now = Date.now();
        const last = await this.getLastActiveOrder(corpId);
        if (last) {
            const deadLine = last.timeCreate + (last.joinCard?.schedule || 0);
            if (now > deadLine) throw ENUM_ERROR_CODE.SCHEDULE_MARKET_BELOW;
        } else throw ENUM_ERROR_CODE.SCHEDULE_MARKET_BELOW;
    }

    /** 赠送一张金额最小的礼品卡 */
    async empowerCorp(corpId: string) {
        const minis = await this.ScheduleCardDao.query({ isDisabled: false }, { sortKey: "amount", sortValue: MongodbSort.ASC });
        const mini = minis[0];
        if (mini) {
            const schema = this.ScheduleCardOrderDao.getSchema();
            schema.corpId = corpId;
            schema.cardId = mini._id;
            schema.amount = mini.amount / 100;
            schema.statusWeChatPay = ENUM_PAY_STATUS_WECHAT.SUCCESS;
            await this.ScheduleCardOrderDao.create(schema);
        }
    }
}
