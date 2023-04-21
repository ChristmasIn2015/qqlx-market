import { Injectable } from "@nestjs/common";
import { Schema, Prop, SchemaFactory, InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Intro as _, ENUM_INTRO, ENUM_PROJECT } from "qqlx-core";
import { MongooseDao } from "qqlx-sdk";

@Schema()
export class Intro implements _ {
    @Prop({ default: "", required: true })
    groupId: string;
    @Prop({
        default: ENUM_INTRO.TITLE,
        enum: [ENUM_INTRO.TITLE, ENUM_INTRO.DESC, ENUM_INTRO.IMAGE, ENUM_INTRO.VIDEO],
    })
    type: ENUM_INTRO;
    @Prop({ default: "" })
    content: string;

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
export const IntroSchema = SchemaFactory.createForClass(Intro).set("versionKey", false);

@Injectable()
export class IntroDao extends MongooseDao<Intro> {
    constructor(@InjectModel(Intro.name) private model: Model<Intro>) {
        super(model);
    }
}
