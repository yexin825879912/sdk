import { Service } from 'egg';

/**
 * Test Service
 */
export default class AuthCenterService extends Service {

  /**
     * 认证中心登陆
     */
  public async agentAuthLogin(action: any) {
    const { ctx } = this;
    try {
      const res: any = await ctx.service.http.sendJsonPost('url', action, {
        dataType: 'json',
      });
      return res.data;
    } catch (error) {
      ctx.logger.error('AuthCenterService-agentAuthLogin', error);
    }
  }
}
