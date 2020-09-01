import { Context } from 'egg';

/**
 * 每次请求和返回的日志打印
 * session会话检查
 * 由于是存在多种内网服务调用，所以这个session校验中间件多是针对，外网前端座席端请求的session校验
 */
export default {
  log: async (ctx: Context, next: () => Promise<any>) => {
    const data = ctx.request.body;
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : data;
    ctx.logger.info(`get request [${ctx.tracer.traceId}] from [${ctx.ip}]: ${dataStr}`);
    await next();
    ctx.logger.info(`response [${ctx.tracer.traceId}] to client: ${JSON.stringify(ctx.body)}`);        
  },
  checkSession: async (ctx: Context, next: () => Promise<any>) => {
    if (!ctx.request.body.sessionId) {
      ctx.sendError('not_found_redis_session');
      return;
    }

    let dbSession: any;
    try {
      dbSession = await ctx.service.session.checkPcSession(ctx.request.body.sessionId);
    } catch (e) {
      ctx.logger.error(e);
    }
    if (ctx.status === 403) {
      return ctx.sendResult();
    }
    if (!dbSession) {
      ctx.sendError('not_found_redis_session');
      return;
    }

    dbSession.clientFlag = ctx.request.body.flag || '';
    ctx.m7Session = dbSession;

    await next();
  },
}