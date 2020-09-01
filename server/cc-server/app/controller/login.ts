import { Controller } from 'egg';
import * as _ from 'lodash';
import * as nodeRSA from 'node-rsa';


export default class LoginController extends Controller {
  /**
   * 检查账户满足HTTPS请求
   */
  public async checkAccountHttps() {
    const { ctx } = this;
    const bizData = ctx.request.body;
    let isAllowHttps = true;
    const allNodes = {
      manager_call_url: true,
      manager_interface_url: true,
      manager_tab_url: true,
      manager_dialout_url: true,
      pbx_https: true,
    };
    if (!bizData.accountName) {
      ctx.body = 'login_password_common_error'; // 登录名或密码错误。(不统计错误次数时使用，括号内文字不返回前台)
      return;
    }
    let accountName = bizData.accountName;
    if (accountName.indexOf('@') !== -1) {
      accountName = accountName.substring(accountName.indexOf('@') + 1);
    }
    try {
      const platformAccount = await ctx.service.base.bill.platform_account.findOneByName(accountName);
      if (!platformAccount) {
        ctx.body = 'login_password_common_error';
        return;
      }
      // 对接配置是否支持HTTPS链接
      const [
        callUrls,
        interfaceUrls,
        tabUrls,
        dialoutUrls,
        isPbxAllow,
        imGlobalSet,
      ] = await Promise.all([
        ctx.service.base.manager_call_url(platformAccount._id),
        ctx.service.base.manager_interface_url(platformAccount._id),
        ctx.service.base.manager_tab_url(platformAccount._id),
        ctx.service.base.manager_dialout_url(platformAccount._id),
        ctx.service.pbx.checkPbxHttps(platformAccount._id),
        ctx.service.base.app_kefu_global_set(platformAccount._id),
      ]);
      for (const callUrl of callUrls) {
        if (callUrl.url && callUrl.url.indexOf('http://') !== -1) {
          allNodes.manager_call_url = false;
          break;
        }
      }
      for (const interfaceUrl of interfaceUrls) {
        if (interfaceUrl.url && interfaceUrl.url.indexOf('http://') !== -1) {
          allNodes.manager_interface_url = false;
          break;
        }
      }
      for (const tabUrl of tabUrls) {
        if (tabUrl.url && tabUrl.url.indexOf('http://') !== -1) {
          allNodes.manager_tab_url = false;
          break;
        }
      }
      for (const dialoutUrl of dialoutUrls) {
        if (dialoutUrl.url && dialoutUrl.url.indexOf('http://') !== -1) {
          allNodes.manager_dialout_url = false;
          break;
        }
      }
      allNodes.pbx_https = isPbxAllow;
      ctx.body.videoChatOn = imGlobalSet ? imGlobalSet.videoChatOn : '0';

      for (const i in allNodes) {
        if (!allNodes[i]) {
          isAllowHttps = false;
          break;
        }
      }

      ctx.body.isAllow = isAllowHttps;
    } catch (error) {
      ctx.logger.error('LoginController - checkAccountHttps', error);
    }
  }

  /**
   * 获取登陆时需要用到的密钥
   */
  public async loginForSafe() {
    const { ctx, app } = this;
    try {
      // redis数据库
      const randomKey = app.m7Utils.UUID.generateShortUuid(app.m7Utils.UUID.generateRandomId());
      // 生成随机码和设置过期时间
      await app.ccRedis.db(1).setex(randomKey, 20, 1);
      // 生成公钥、私钥
      const secretKey = 'system_secret_key';
      const res: any = await app.ccRedis.db(1).hgetall(secretKey);
      if (res) {
        const publicKey: string = res.publicKey;
        ctx.body = {
          secret: publicKey,
          num: randomKey,
        };
        return;
      }
      const key = new nodeRSA({ b: 512 });
      key.setOptions({ encryptionScheme: 'pkcs1' });
      const privateKey = key.exportKey('pkcs1-private-pem');
      const publicKey = key.exportKey('pkcs1-public-pem');
      const setData = [ 'publicKey', publicKey, 'privateKey', privateKey ];
      await app.ccRedis.db(1).hmset(secretKey, setData);
      await app.ccRedis.db(1).expire(secretKey, 24 * 60 * 60);
      ctx.body = {
        secret: publicKey,
        num: randomKey,
      };
    } catch (error) {
      ctx.logger.error('LoginController-loginForSafe', error);
      ctx.body.success = false;
    }
  }

  /**
   * 登陆主要的认证业务逻辑
   * session应该是在其它服务存储到Redis中的
   */
  public async loginToAuthCenter() {
    const { ctx, app } = this;
    const bizData = ctx.request.body;
    const data: any = bizData.data;
    try {
      // 公钥 私钥文件对比
      if (data && data.safeKey) {
        const secretKey = 'system_secret_key';
        const keyDoc: any = await app.ccRedis.db(1).hgetall(secretKey);
        if (!keyDoc || _.isEmpty(keyDoc)) {
          ctx.body = false;
          return;
        }
        const privateKey: string = keyDoc.privateKey;
        const key = new nodeRSA(privateKey);
        const resultDoc = key.decrypt(data.safeKey, 'utf8');
        const obj = await app.ccRedis.db(1).get(resultDoc.split(':')[1]);
        if (!obj) {
          ctx.result.success = false;
          ctx.logger.error('randomKey_not_find');
          return ctx.sendError('randomKey_not_find');
        }
        data.password = resultDoc.split(':')[0];
        bizData.data = data;
      }
      const action: any = { ...bizData, action: 'login', clientIp: ctx.ip };
      const ipMessage = ctx.result.ipMessage;
      const rsponse = await ctx.service.authCenter.agentAuthLogin(action);
      ctx.result = {
        ...rsponse,
        ipMessage,
      };
      if (!rsponse.success) {
        ctx.body = false;
        return;
      }
      // 返回坐席的基础数据
      if (rsponse.user) {
        const token = await ctx.service.socketPush.generateSocketPushToken(rsponse.user);
        ctx.result.token = token;
        ctx.m7Session = rsponse; // 这块的数据很多，并返回给前端呢
        ctx.service.customer.emitCustSaleWait({});
      }
      ctx.body = true;
    } catch (error) {
      ctx.logger.error('LoginController-loginToAuthCenter', error);
    }
  }
}
