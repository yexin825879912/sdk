import { Service } from 'egg';

/**
 * 模拟从consul获取的配置
 */
export default class SystemService extends Service {
  /**
   * 获取websocket的IP地址
   */
  public async getSocketPushServiceAddress() {
    const { ctx } = this;
    try {
      const { domain, services } = await this.getCcSocketPush();
      const domainValue = JSON.parse(domain.data.Value);
      const domainInfo = domainValue.domain;
      const weightInfo = domainValue.weight;
      const internal2external = domainValue.internal2external;

      // 获取健康的cc-socket-push地址
      const addresses: any[] = [];
      for (const obj of services.data) {
        const address = obj.Service.Address;
        if (addresses.indexOf(address) === -1) {
          addresses.push(address);
        }
      }
      const serviceSize = addresses.length;

      if (serviceSize === 0) {
        return;
      }
      if (serviceSize === 1) {
        const serviceDomain = domainInfo[addresses[0]];
        return serviceDomain;
      }

      // 如果是配置的集群 计算规则从其中选出一台服务器
      const connections = await ctx.service.baseModel.app_push_client.aggregatePushServerIp();
      let minConnectionCount = -1;
      let minConnectionService = '';

      for (let i = 0; i < serviceSize; i++) {
        const serviceAddress = addresses[i];
        const serviceWeight = weightInfo[serviceAddress];
        if (serviceWeight) {
          for (let j = 0; j < connections.length; j++) {
            if (serviceAddress === connections[j]._id || internal2external[connections[j]._id] === serviceAddress) {
              const count = connections[j].count;
              const connectionCount = count / serviceWeight;
              if (minConnectionCount === -1 || connectionCount < minConnectionCount) {
                minConnectionCount = connectionCount;
                minConnectionService = serviceAddress;
              }
              break;
            } else {
              if (j === connections.length - 1) {
                minConnectionCount = 0;
                minConnectionService = serviceAddress;
                break;
              }
            }
          }
        }
      }

      // minConnectionService为空时, 从addresses中随机取出一个.
      if (!minConnectionService) {
        const randomNum = Math.floor(Math.random() * serviceSize);
        minConnectionService = addresses[randomNum];
      }

      const returnServiceDomain = domainInfo[minConnectionService];

      return returnServiceDomain;
    } catch (error) {
      ctx.logger.error('MockConsulService-getSocketPushServiceAddress', error);
    }
  }

  /**
   * 获取各平台的链接
    {
        androidAppUrl: "https://fs-im-package.7moor.com/7moorapp.png"
        chatSdkUrl: "https://webchat.7moor.com/javascripts/7moorInit.js?accessId=afe18be0-dc75-11ea-b3bd-dd6b4f7f5ae0&autoShow=false&language=ZHCN&newMsgNotPop=true"
        iosAppUrl: "https://fs-im-kefu.7moor.com/im/93ffa810-9b29-11e8-a3a3-3fff656a70d3/2019-02-26%2018:22:08/1551176528966/iOS_code.png"
        platform_type: "ali"
        restApi: "http://apis.7moor.com"
        restApi_https: "https://apis.7moor.com"
        showWxHelper: "https://fs-im-kefu.7moor.com/im/165d68b0-416a-11e9-b587-d30c10c82a96/2019-03-19%2014:08:46/1552975726272/%E4%BA%8C%E7%BB%B4%E7%A0%811.png"
        updateUrl: "http://www.7moor.com/update"
        webchat: "http://webchat.7moor.com"
        webchat_https: "https://webchat.7moor.com"
        ydx: "http://dx.7moor.com"
        ydx_https: "https://dx.7moor.com"
        ykf: "http://kf7.7moor.com"
        ykf_https: "https://kf.7moor.com"
    }
   */
  public async getPlatformUrls() {
    const { ctx, app } = this;

    let result: any = {};
    try {
      const str = app.m7Consul.constants('platform_urls', 'v');

      if (str) {
        result = JSON.parse(str);
      }
      return result;
    } catch (error) {
      ctx.logger.error('MockConsulService-getPlatformUrls error', error);
      return result;
    }
  }

  /**
   * 获取前端更新文件[因为前端是单页面应用，客户端可能会缓存]
   * 返回的是一个数组，每个元素包含js文件名称，以及更新日期
    {
        "_id" : ObjectId("5605020aaa834c330dcd7f8a"),
        "date" : "20150926",
        "type" : "cc_in",
        "upFile" : [
            "javascripts/app.js",
            "javascripts/report.js",
            "javascripts/handler.js",
            "javascripts/customer.js"
        ]
    }
   */
  public async getUpateConfig() {
    const { ctx, app } = this;
    try {
      // YYYY-MM-DD 获取前14天的日期
      let twoWeeksAgoDate = app.m7Utils.DateTime.getStartDate(14);
      twoWeeksAgoDate = twoWeeksAgoDate.replace(/-/g, '');

      const dbConfig = await ctx.service.baseModel.system_update_config.findGteTwoWeeksAgoDate(twoWeeksAgoDate);
      const resultList: any[] = [];
      const tempList: any[] = [];
      for (const config of dbConfig) {
        const list = config.upFile || [];
        const date = config.date;
        for (const file of list) {
          if (tempList.indexOf(file) !== -1) {
            continue;
          }
          tempList.push(file);
          resultList.push({ js: file, date });
        }
      }

      return resultList;
    } catch (error) {
      ctx.logger.error('MockConsulService-getUpateConfig error', error);
      return [];
    }
  }

  /**
   * 附件上传大小限制
   * attachmentMaxSize: "50mb"
   */
  public async getAttachmentMaxSize() {
    const { ctx } = this;
    let attachmentMaxSize = '100mb';
    try {
      const kv = await ctx.service.baseConfig.consul.getKV({ key: '_constants/attachment_max_size' });
      if (kv.success && kv.data && kv.data.Value) {
        attachmentMaxSize = kv.data.Value;
      }
    } catch (error) {
      ctx.logger.error(`Failed to get attachment max size from consul, use default: ${attachmentMaxSize}`);
      ctx.logger.error('MockConsulService-getAttachmentMaxSize error', error);
    }
    return attachmentMaxSize;
  }

  /**
   * 获取域名
   * 请求的数据类似于 data:  {"localTime":1598868307988,"domain":"kf.7moor.com"}
   */
  public async isOem() {
    const { ctx } = this;
    const bizData = ctx.request.body.data;

    if (!bizData.domain) {
      return false;
    }

    try {
      const res = await ctx.service.baseConfig.consul.getKV({ key: '_constants/domains_7moor' });
      let isOem = false;

      if (res.success && res.data && res.data.Value && bizData.domain) {
        const domain = bizData.domain.trim();
        const domains7moor = res.data.Value.split(',').map(domainItem => {
          return domainItem.trim();
        });
        isOem = domain && domains7moor.indexOf(domain) === -1;
      }

      return isOem;
    } catch (error) {
      ctx.logger.error('MockConsulService-isOem error', error);
      return false;
    }
  }

  /**
   * 获取socket服务器列表以及权重
   * 结构类似于
    {
        "domain": {
            "58.87.118.20": "http://58.87.118.20:3105",
            "172.21.0.16": "http://58.87.118.20:3105"
        },
        "weight": {
            "58.87.118.20": 1,
            "172.21.0.16": 1
        },
        "internal2external": {
            "58.87.118.20": "172.21.0.16",
            "172.21.0.16": "58.87.118.20"
        }
    }
   */
  private async getCcSocketPush() {
    const { ctx, app } = this;
    try {
      const serviceInfo = app.m7Consul.serviceInfo;
      const serviceName = 'cc-socket-push';
      let version_tag = serviceInfo.version_tag;
      // 获取socket推送服务的版本
      if (serviceInfo.remote_versions && serviceInfo.remote_versions[serviceName]) {
        version_tag = serviceInfo.remote_versions[serviceName];
      } else if (serviceInfo.remote_version) {
        version_tag = serviceInfo.remote_version;
      }
      const key = `_gw/_vt_${version_tag}/_sn_${serviceName}/domain_weight`;
      const domain = await ctx.service.baseConfig.consul.getKV({ key });
      if (!domain || !domain.success || !domain.data) {
        return;
      }
      // 获取健康的cc-socket-push服务
      const internalServices = await ctx.service.baseConfig.consul.getServiceAddress({
        service: serviceName,
        passing: true,
        tag: version_tag,
      });
      if (!internalServices || !internalServices.success) {
        return;
      }
      let services = internalServices;

      if (services.data.length === 0) {
        const externalServices = await ctx.service.common.consul.getServiceAddress({
          service: serviceName,
          passing: true,
          tag: `${version_tag}-www`,
        });
        services = externalServices;
      }
      return { domain, services };
    } catch (error) {
      ctx.logger.error('MockConsulService-getCcSocketPush', error);
    }
  }
}
