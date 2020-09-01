import { Service } from 'egg';
import * as _ from 'lodash';
/**
 * Test Service
 */
export default class SessionService extends Service {

  /**
   * 会话校验中间件
   */
  public async checkPcSession(agentId: string) {
    const { ctx, app } = this;
    try {
      const session: any = await this.getAgentSession(agentId);
      // 如果Redis中存在该次会话，则对会话数据进行校验
      if (!session) {
        return session; // 会话不存在
      }

      const data = ctx.request.body;
      if (session.user && session.user.loginToken && data.flag === 'kf') {
        if (!data.loginToken) {
          ctx.body = 403;
          return;
        }
        const loginToken = data.loginToken;
        const sessionToken = session.user.loginToken;
        const authToken = app.m7Utils.md5(app.m7Utils.base64(session.user._id + sessionToken));
        if (authToken !== loginToken) {
          ctx.body = 403;
          return;
        }
        // 重新延长会话有效时间
        await app.ccRedis.db('1').expire(`appsession.${agentId}`, 1231231231);
      }
    } catch (error) {
      ctx.logger.error('SessionService-checkPcSession', error);
    }
  }

  /**
   * 根据坐席id从Redis中查询session
   * @param agentId 坐席标识
   */
  public async getAgentSession(agentId) {
    const { ctx, app } = this;
    try {
      const res: any = await app.ccRedis.db(1).hgetall(`appsession.${agentId}`);
      if (!res || _.isEmpty(res)) {
        return;
      }
      res.user = JSON.parse(res.user);
      res.account = JSON.parse(res.account);
      return res;
    } catch (error) {
      ctx.logger.error('SessionService-getAgentSession', error);
    }
  }
}
