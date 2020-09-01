import { Service } from 'egg';

/**
 * cc数据库
 * 'system_update_config', // 系统更新设置
 * db.getCollection('system_update_config').find({})
 */
// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class System_update_config extends Service {

  /**
   * 查询最近两周最新的更新文件
   */
  public async findGteTwoWeeksAgoDate(twoWeeksAgoDate) {
    const { ctx, app } = this;
    try {
      const dbConfig = await app.commonDB.db().collection('system_update_config').find({
        type: 'cc_in',
        date: { $gte: twoWeeksAgoDate },
      // eslint-disable-next-line newline-per-chained-call
      }, { sort: { date: -1 } }).toArray();
      if (!dbConfig) {
        return [];
      }
      return dbConfig;
    } catch (error) {
      ctx.logger.error('System_update_config-findGteTwoWeeksAgoDate', error);
    }
  }
}
