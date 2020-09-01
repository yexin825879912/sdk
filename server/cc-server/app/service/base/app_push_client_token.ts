import { Service } from 'egg';

/**
 * cc 库
 * app_push_client_token
 */
// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class App_push_client_token extends Service {

  /**
   * 停用已经启用的websocket
   */
  public async disableSokcet(account: string) {
    const { ctx, app } = this;
    try {
      const array = await app.commonDB.db().collection('manager_tab_url').findOne({ accountId: account });
      return array;
    } catch (error) {
      ctx.logger.error('App_push_client_token-disableSokcet', error);
      return [];
    }
  }
}
