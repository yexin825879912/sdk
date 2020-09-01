import { Service } from 'egg';

/**
 * bill数据库
 * 'platform_account',
 *  计费首先开通账户 自定义主键例如：N00000003057
 * db.getCollection('platform_account').find({'name':'yexin'})
 */
// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class Platform_account extends Service {

  /**
   * 根据账户名称查询
   */
  public async findOneByName(accountName) {
    const { ctx, app } = this;
    try {
      const platformAccount = await app.commonDB.db('bill').collection('platform_account').findOne({
        name: accountName,
      });
      return platformAccount;
    } catch (error) {
      ctx.logger.error('Platform_account-findOneByName', error);
    }
  }
}
