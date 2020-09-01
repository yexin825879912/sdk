import { Service } from 'egg';

/**
 * cc 库
 * app_kefu_global_set
 */
// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class App_kefu_global_set extends Service {

  /**
   * 查询指定account的全局配置
   * account: 账户标识 例如N00000003057
   */
  public async findByAccount(account: string) {
    const { ctx, app } = this;
    try {
      const array = await app.commonDB.db().collection('app_kefu_global_set').findOne({ account });
      return array;
    } catch (error) {
      ctx.logger.error('App_kefu_global_set-findByAccount', error);
      return [];
    }
  }
}
