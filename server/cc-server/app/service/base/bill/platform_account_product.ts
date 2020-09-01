import { Service } from 'egg';

/**
 * bill数据库
 * 'platform_account_product',
 *  计费首先开通账户，然后在该账户下开通产品，主键以账户名_产品名
 *  例如N00000003057_cc,N00000003057_robot
 * db.getCollection('platform_account_product').find({_id:/N00000003057/})
 */
// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class Platform_account_product extends Service {

  /**
   * 根据计费账户查询开通云客服产品的基础信息
   * 例如关键的pbx信息
   */
  public async findOneById(account) {
    const { ctx, app } = this;
    try {
      const product = await app.commonDB.db('bill').collection('platform_account_product').findOne({ _id: `${account}_cc` });
      return product;
    } catch (error) {
      ctx.logger.error('Platform_account_product-findOneById', error);
    }
  }
}
