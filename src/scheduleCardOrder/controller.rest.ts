import { readFileSync } from "fs";
import { join } from "path";
import { bignumber, ceil } from "mathjs";
const WxPay = require("wechatpay-node-v3");

import { Controller, Get, Post, Body, Patch, Delete, SetMetadata, UseGuards } from "@nestjs/common";

import { Page, PageRes, EnumMapOption } from "qqlx-cdk";
import {
    ENUM_MARKET_ROLE,
    PATH_MARKET_CARD_ORDER,
    ENUM_PAY_STATUS_WECHAT,
    postScheduleCardOrderDto,
    postScheduleCardOrderRes,
    getScheduleCardOrderDto,
    getScheduleCardOrderRes,
    patchScheduleCardOrderDto,
    patchScheduleCardOrderRes,
    ScheduleCard,
    ScheduleCardOrder,
    ScheduleCardOrderJoined,
    ENUM_LOG,
    MAP_ENUM_PAY_STATUS_WECHAT,
} from "qqlx-core";
import { UserDTO } from "qqlx-sdk";

import { CorpLock } from "global/lock.corp";
import { MarketGuard } from "global/market.guard";
import { ScheduleCardDao } from "dao/scheduleCard";
import { ScheduleCardOrderDao } from "dao/scheduleCardOrder";

import { LogRemote } from "remote/log";
import { ScheduleCardOrderService } from "src/scheduleCardOrder/service";

@Controller(PATH_MARKET_CARD_ORDER)
@UseGuards(MarketGuard)
export class ScheduleCardOrderController extends CorpLock {
    private CONFIG_JSON_FILE_JSON: Record<string, any>;
    private payment: any;

    constructor(
        private readonly LogRemote: LogRemote,
        //
        private readonly ScheduleCardDao: ScheduleCardDao,
        private readonly ScheduleCardOrderDao: ScheduleCardOrderDao,
        private readonly scheduleCardOrderService: ScheduleCardOrderService
    ) {
        super();

        const CONFIG_JSON_FILE = readFileSync(join(process.cwd(), "../qqlx-config.json"));
        this.CONFIG_JSON_FILE_JSON = JSON.parse(CONFIG_JSON_FILE.toString());

        this.payment = new WxPay({
            appid: this.CONFIG_JSON_FILE_JSON.ZQSY_MP_APPID,
            mchid: this.CONFIG_JSON_FILE_JSON.ZQSY_PAY_MCHID,
            publicKey: readFileSync(join(process.cwd(), "../wechat-pay/apiclient_cert.pem")),
            privateKey: readFileSync(join(process.cwd(), "../wechat-pay/apiclient_key.pem")),
        });
    }

    @Post()
    @SetMetadata("MarketRole", null)
    async postScheduleCardOrder(@Body("dto") dto: postScheduleCardOrderDto, @Body("UserDTO") UserDTO: UserDTO): Promise<postScheduleCardOrderRes> {
        // 创建本地订单
        if (!dto.corpId) throw new Error(`请选择主体`);
        const card = await this.ScheduleCardDao.findOne(dto.schema?.cardId);
        if (!card) throw new Error(`找不到支付商品`);
        if (card.isDisabled) throw new Error(`无效的时长卡`);
        const orderLocal = await this.ScheduleCardOrderDao.create({
            corpId: dto.corpId,
            cardId: card._id,
            amount: parseInt(ceil(bignumber(Number(card.amount) || 0), bignumber(100)).toString()),
            statusWeChatPay: ENUM_PAY_STATUS_WECHAT.NOTPAY,
        });

        // 创建微信订单
        const params = {
            appid: this.CONFIG_JSON_FILE_JSON.ZQSY_MP_APPID,
            mchid: this.CONFIG_JSON_FILE_JSON.ZQSY_PAY_MCHID,
            out_trade_no: orderLocal._id,
            description: card.title,
            notify_url: "https://qqlx.tech/qqlx/user",
            amount: { total: Number(card.amount), currency: "CNY" },
        };
        const PayUrl = "/v3/pay/transactions/native";
        const nonce_str = Math.random().toString(36).substring(2, 15);
        const timestamp = parseInt(+new Date() / 1000 + "").toString();
        const signature = this.payment.getSignature("POST", nonce_str, timestamp, PayUrl, params);
        const authorization = this.payment.getAuthorization(nonce_str, timestamp, signature);
        let info = await fetch(`https://api.mch.weixin.qq.com${PayUrl}`, {
            method: "post",
            body: JSON.stringify(params),
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Accept-Language": "en",
                Authorization: authorization,
            },
        });
        info = await info.json();
        // this.LogRemote.log(ENUM_LOG.INFO, PATH_MARKET_CARD_ORDER, UserDTO.chain, { name: "postScheduleCardOrder", wx_response: info });
        // { code_url: 'weixin://wxpay/bizpayurl?pr=AjygadNzz' }

        const payUrl = info["code_url"];
        if (!payUrl) throw new Error(`支付异常，请重新尝试`);
        return payUrl;
    }

    @Post("/get")
    @SetMetadata("MarketRole", null)
    async getScheduleCardOrder(@Body("dto") dto: getScheduleCardOrderDto, @Body("UserDTO") UserDTO: UserDTO): Promise<getScheduleCardOrderRes> {
        dto.page.startTime = 0;
        dto.page.endTime = Number.MAX_SAFE_INTEGER;

        const page = (await this.ScheduleCardOrderDao.page(
            {
                corpId: dto.corpId,
                statusWeChatPay: { $in: [ENUM_PAY_STATUS_WECHAT.USERPAYING, ENUM_PAY_STATUS_WECHAT.SUCCESS] },
            },
            dto.page
        )) as PageRes<ScheduleCardOrderJoined>;

        page.list = await this.ScheduleCardOrderDao.aggregate([
            { $match: { _id: { $in: page.list.map((e) => e._id) } } },
            { $lookup: { localField: "cardId", from: "schedulecards", foreignField: "_id", as: "joinCard" } },
        ]);
        page.list.forEach((e) => {
            e.joinCard = e.joinCard[0];
            e.amount /= 100;
        });

        return page;
    }

    @Patch()
    @SetMetadata("MarketRole", null)
    async patchScheduleCardOrder(@Body("dto") dto: patchScheduleCardOrderDto, @Body("UserDTO") UserDTO: UserDTO): Promise<patchScheduleCardOrderRes> {
        const orders = await this.ScheduleCardOrderDao.query({
            corpId: dto.corpId,
            statusWeChatPay: { $in: [ENUM_PAY_STATUS_WECHAT.NOTPAY, ENUM_PAY_STATUS_WECHAT.USERPAYING] },
        });
        for (let order of orders) {
            const info = await this.payment.query({ out_trade_no: order._id });
            if (info.status !== 200) continue;
            await this.setOrderStatus(order.corpId, order._id, info.trade_state);
        }
        return null;
    }

    private setOrderStatus(corpId: string, orderId: string, STATE_REMOTE: string) {
        return new Promise(async (resolve, reject) => {
            const lock = this.getLock(corpId);
            lock.acquire("schedule-order", async () => {
                try {
                    const textMap: Record<string, EnumMapOption> = {};
                    for (const arr of MAP_ENUM_PAY_STATUS_WECHAT) {
                        const option = arr[1];
                        option && (textMap[option.text_en] = option);
                    }

                    const match = textMap[STATE_REMOTE];
                    const order = await this.ScheduleCardOrderDao.findOne(orderId);

                    if (order && match) {
                        const now = Date.now();
                        const updater = { statusWeChatPay: match.value, timeCreate: now };

                        if (match.value === ENUM_PAY_STATUS_WECHAT.SUCCESS) {
                            const last = await this.scheduleCardOrderService.getLastActiveOrder(order.corpId);
                            if (last) {
                                const deadLine = last.timeCreate + (last.joinCard?.schedule || 0);
                                updater.timeCreate = now > deadLine ? now : deadLine;
                            }
                        }
                        await this.ScheduleCardOrderDao.updateOne(orderId, updater);
                    }

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });

        //   {
        //     status: 200,
        //     amount: { currency: 'CNY', payer_currency: 'CNY', payer_total: 1, total: 1 },
        //     appid: '******',
        //     attach: '',
        //     bank_type: 'OTHERS',
        //     mchid: '******',
        //     out_trade_no: '635822806714583',
        //     payer: { openid: '******' },
        //     promotion_detail: [],
        //     success_time: '2022-07-30T01:23:27+08:00',
        //     trade_state: 'SUCCESS',
        //     trade_state_desc: '支付成功',
        //     trade_type: 'NATIVE',
        //     transaction_id: '4200001476202207302271417363'
        //   }
    }
}
