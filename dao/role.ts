import { Injectable } from "@nestjs/common";
import { Schema, Prop, SchemaFactory, InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { MarketRole as _, ENUM_MARKET_ROLE } from "qqlx-core";
import { MongooseDao } from "qqlx-sdk";

@Schema()
export class MarketRole implements _ {
    @Prop({ default: "", required: true })
    userId: string;
    @Prop({ default: "", required: true })
    corpId: string;
    @Prop({
        default: ENUM_MARKET_ROLE.BASE,
        enum: [ENUM_MARKET_ROLE.ROOT, ENUM_MARKET_ROLE.BASE],
    })
    role: ENUM_MARKET_ROLE;

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
export const MarketRoleSchema = SchemaFactory.createForClass(MarketRole).set("versionKey", false);

@Injectable()
export class MarketRoleDao extends MongooseDao<MarketRole> {
    constructor(@InjectModel(MarketRole.name) private model: Model<MarketRole>) {
        super(model);
    }
}
