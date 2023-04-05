import { Injectable } from "@nestjs/common";
import { Schema, Prop, SchemaFactory, InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { ScheduleCardOrder as _ScheduleCardOrder, ENUM_PAY_STATUS_WECHAT } from "qqlx-core";
import { MongooseDao } from "qqlx-sdk";

@Schema()
export class ScheduleCardOrder implements _ScheduleCardOrder {
    @Prop({ default: "", required: true })
    corpId: string;
    @Prop({ default: "", required: true })
    cardId: string;
    @Prop({
        default: ENUM_PAY_STATUS_WECHAT.USERPAYING,
        enum: [
            ENUM_PAY_STATUS_WECHAT.CLOSED,
            ENUM_PAY_STATUS_WECHAT.NOTPAY,
            ENUM_PAY_STATUS_WECHAT.PAYERROR,
            ENUM_PAY_STATUS_WECHAT.REFUND,
            ENUM_PAY_STATUS_WECHAT.REVOKED,
            ENUM_PAY_STATUS_WECHAT.SUCCESS,
            ENUM_PAY_STATUS_WECHAT.USERPAYING,
        ],
    })
    statusWeChatPay: ENUM_PAY_STATUS_WECHAT;
    @Prop({
        default: 0,
        get: (value) => (value = (Number(value) || 0) / 100),
        set: (value) => (value = (Number(value) || 0) * 100),
    })
    amount: number;

    @Prop({ required: true })
    _id: string;
    @Prop({ default: 0 })
    timeCreate: number;
    @Prop({ default: 0 })
    timeUpdate: number;
    @Prop({ default: "" })
    timeCreateString: string;
    @Prop({ default: "" })
    timeUpdateString: string;
}
export const ScheduleCardOrderSchema = SchemaFactory.createForClass(ScheduleCardOrder).set("versionKey", false);

@Injectable()
export class ScheduleCardOrderDao extends MongooseDao<ScheduleCardOrder> {
    constructor(@InjectModel(ScheduleCardOrder.name) private model: Model<ScheduleCardOrder>) {
        super(model);
    }
}
