import { Service } from 'egg';

/**
 * bill数据库
 * 'platform_cc_pbx',
 */
// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class Platform_cc_pbx extends Service {

  /**
   * 查询满足条件的pbx数目
   */
  public async counPbxAllowHttpsCount(pbxIds) {
    const { ctx, app } = this;
    try {
      const pbxAllowHttpsCount = await app.commonDB.db('bill').collection('platform_cc_pbx').count(
        { _id: { $in: pbxIds }, assDomain: { $nin: [ null, '' ] } },
      );
      return pbxAllowHttpsCount;
    } catch (error) {
      ctx.logger.error('Platform_account_product-findOneById', error);
    }
  }
}
