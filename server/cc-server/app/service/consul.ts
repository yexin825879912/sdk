import { Service } from 'egg';

export default class ConsulService extends Service {
  /**
   * 获取consul配置
   * @param options 查询条件
   */
  public async getKV(options: any): Promise<any> {
    const { ctx, app } = this;
    const result: any = {
      success: false,
    };
    try {
      const data = await app.m7Consul.consul.kv.get(options);
      result.success = true;
      result.data = data;
      return result;
    } catch (error) {
      ctx.logger.error('ConsulService-getKV', error);
    }
  }

  /**
   * 获取健康的服务地址
   * @param options 查询条件
   */
  public async getServiceAddress(options: any): Promise<any> {
    const { ctx, app } = this;
    const result: any = {
      success: false,
    };
    try {
      const data = app.m7Consul.consul.health.service(options);
      result.success = true;
      result.data = data;
    } catch (error) {
      ctx.logger.error('ConsulService-getServiceAddress', error);
    }
  }
}
