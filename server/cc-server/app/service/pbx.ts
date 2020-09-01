import { Service } from 'egg';

/**
 * Test Service
 */
export default class PbxService extends Service {

  /**
   * 查询指定账户下pbx 并检查是否满足https的条件
   */
  public async checkPbxHttps(account: string) {
    const { ctx } = this;
    try {
      const product = await ctx.service.base.bill.platform_account_product.findOneById(account);
      if (!product) {
        return false;
      }
      // 一个账户可开通多个pbx，用于大业务量
      const pbxList = product.pbx;
      if (!pbxList || pbxList.length === 0) {
        return false;
      }
      const pbxIds = pbxList.filter((pbx: any) => !!pbx.PBX).map((pbx: any) => pbx.PBX);
      if (pbxIds.length !== pbxList.length) {
        return false;
      }
      const pbxAllowHttpsCount = await ctx.service.base.platform_cc_pbx.counPbxAllowHttpsCount(pbxIds);
      if (pbxAllowHttpsCount !== pbxIds.length) {
        return false;
      }

      return true;
    } catch (error) {
      ctx.logger.error('PbxService-checkPbxHttps', error);
      return false;
    }
  }
}
