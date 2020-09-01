import { Service } from 'egg';

/**
 * cc数据库
 * 'app_push_client', // 坐席PC端表结构
 */
// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class App_push_client extends Service {

  /**
   * 查询表结构中服务IP地址列表
   */
  public async aggregatePushServerIp() {
    const { ctx, app } = this;
    try {
      const connections = await app.commonDB.db().collection('app_push_client').aggregate([{
        $group: {
          _id: '$pushServerIp',
          count: { $sum: 1 },
        },
      // eslint-disable-next-line newline-per-chained-call
      }]).toArray();
      return connections;
    } catch (error) {
      ctx.logger.error('App_push_client-aggregatePushServerIp', error);
    }
  }
}
