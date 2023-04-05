import { randomUUID } from "crypto";

import { CanActivate, Injectable, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import { ENUM_MARKET_ROLE, ENUM_ERROR_CODE } from "qqlx-core";
import { UserDTO } from "qqlx-sdk";

import { UserRemote } from "remote/user";
import { MarketRoleDao } from "dao/role";

@Injectable()
export class MarketGuard implements CanActivate {
    constructor(
        //
        private readonly reflector: Reflector,
        private readonly UserRemote: UserRemote,
        private readonly MarketRoleDao: MarketRoleDao
    ) {}

    async canActivate(context: ExecutionContext) {
        const request: Request = context.switchToHttp().getRequest();

        const authorization = request.header("Authorization");
        const userInfo = await this.UserRemote.getUserInfo({ jwtString: authorization });

        const demands: ENUM_MARKET_ROLE[] = this.reflector.get("MarketRole", context.getHandler());
        if (demands) {
            const roles = await this.MarketRoleDao.query({ userId: userInfo.userId });
            if (roles.length === 0) throw ENUM_ERROR_CODE.ROLE_BRAND_BELOW;

            const matched = [];
            for (const demand of demands) {
                const match = roles.find((e) => e.role === demand);
                if (match) {
                    matched.push(match);
                    break;
                }
            }
            if (matched.length === 0) throw ENUM_ERROR_CODE.ROLE_BRAND_BELOW;
        }

        const UserDTO: UserDTO = { chain: randomUUID(), userInfo };
        request.body.UserDTO = UserDTO;

        return true;
    }
}
