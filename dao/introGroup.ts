import { Injectable } from "@nestjs/common";
import { Schema, Prop, SchemaFactory, InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { IntroGroup as _, ENUM_INTRO, ENUM_PROJECT } from "qqlx-core";
import { MongooseDao } from "qqlx-sdk";

@Schema()
export class IntroGroup implements _ {
    @Prop({
        default: ENUM_PROJECT.KDBGS,
        enum: [ENUM_PROJECT.KDBGS, ENUM_PROJECT.OA],
    })
    scope: ENUM_PROJECT;
    @Prop({ default: "", required: true })
    path: string;
    @Prop({ default: "" })
    actions: string;

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
export const IntroGroupSchema = SchemaFactory.createForClass(IntroGroup).set("versionKey", false);

@Injectable()
export class IntroGroupDao extends MongooseDao<IntroGroup> {
    constructor(@InjectModel(IntroGroup.name) private model: Model<IntroGroup>) {
        super(model);
    }
}
