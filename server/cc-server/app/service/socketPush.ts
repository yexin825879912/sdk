import { Service } from 'egg';

/**
 * 与cc-socket-push交流的服务
 */
export default class SocketPushService extends Service {

  /**
   * 生成websoket链接的token
   * 坐席端websocket链接需要进行token验证使用
   */
  public async generateSocketPushToken(data: string) {

  }

  /**
   * 套接字接入认证
   * 机器的socket连接数有限制，每认证一次，在redis里计数
   * 一个坐席一个socket，客户购买的坐席数量是否超过限制
   */
  public async pushSocketAuthorized() {
    const { ctx, app } = this;
    const data = ctx.request.body.data;

    const token = app.m7Utils.md5(data.token);
  }
}
