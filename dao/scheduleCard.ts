import { Injectable } from "@nestjs/common";
import { Schema, Prop, SchemaFactory, InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { ScheduleCard as _ScheduleCard, ENUM_PROJECT } from "qqlx-core";
import { MongooseDao } from "qqlx-sdk";

@Schema()
export class ScheduleCard implements _ScheduleCard {
    @Prop({ default: "" })
    title: string;
    @Prop({ default: "" })
    desc: string;
    @Prop({
        default: ENUM_PROJECT.KDBGS,
        enum: [ENUM_PROJECT.KDBGS, ENUM_PROJECT.OA],
    })
    scope: ENUM_PROJECT;

    @Prop({ default: 0 })
    schedule: number;
    @Prop({
        default: 0,
        get: (value) => (value = (Number(value) || 0) / 100),
        set: (value) => (value = (Number(value) || 0) * 100),
    })
    amount: number;
    @Prop({ default: false })
    isDisabled: boolean;

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
export const ScheduleCardSchema = SchemaFactory.createForClass(ScheduleCard).set("versionKey", false);

@Injectable()
export class ScheduleCardDao extends MongooseDao<ScheduleCard> {
    constructor(@InjectModel(ScheduleCard.name) private model: Model<ScheduleCard>) {
        super(model);
    }
}
