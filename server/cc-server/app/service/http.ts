import { Service } from 'egg';
import { IncomingHttpHeaders } from 'http';
import * as _ from 'lodash';

/**
 * 多服务间链路追踪traceId
 */
export interface RequestOpt {
  [propName: string]: any;
  /** 请求类型, 默认'application/x-www-form-urlencoded', 当为'json'时设置 'Content-Type: application/json'  */
  contentType?: string;
  /** 默认返回格式为Buffer; 'text',返回为字符串; 'json',返回为解析后的json对象; */
  dataType?: string;
  /** 超时时间 ms 默认30秒 */
  timeout?: number | number[];
  headers?: IncomingHttpHeaders;
  /** 是否记录返回日志，为true时不记录 */
  noResLog?: boolean;
  /** 是否只返回res.data */
  resDataOnly?: boolean;
}

export default class HttpService extends Service {
  /**
   * GET请求
   * @param url url
   * @param options options
   */
  public async sendGet(url: string, options: RequestOpt = {}): Promise<any> {
    return this._sendRequest('sendGet', url, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST请求，contentType: 'application/x-www-form-urlencoded'
   * @param url url
   * @param data data
   * @param options options
   */
  public async sendPost(url: string, data: string | object, options: RequestOpt = {}): Promise<any> {
    return this._sendRequest('sendPost', url, {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      data,
      ...options,
    });
  }

  /**
   * 发送至java服务的POST请求，data转为string，结尾拼接\r\n
   * contentType: 'application/x-www-form-urlencoded'
   * @param url url
   * @param data data
   * @param options options
   */
  public async sendPostToJava(url: string, data: string | object, options: RequestOpt = {}): Promise<any> {
    return this._sendRequest('sendPostToJava', url, {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      data: (typeof data === 'string' ? data : JSON.stringify(data)) + '\r\n',
      ...options,
    });
  }

  /**
   * POST请求，contentType: 'application/json'
   * @param url url
   * @param data data
   * @param options options
   */
  public async sendJsonPost(url: string, data: string | object, options: RequestOpt = {}): Promise<any> {
    return this._sendRequest('sendJsonPost', url, {
      method: 'POST',
      contentType: 'json',
      data,
      ...options,
    });
  }

  /**
   * PUT请求,contentType: 'application/json'
   * @param url url
   * @param data data
   * @param options options
   */
  public async sendJsonPut(url: string, data: string | object, options: RequestOpt = {}): Promise<any> {
    return this._sendRequest('sendJsonPut', url, {
      method: 'PUT',
      contentType: 'json',
      data,
      ...options,
    });
  }

  /**
   * 通用请求，options完全自定义
   * @param url url
   * @param options options
   */
  public async sendRequest(url: string, options: RequestOpt = {}): Promise<any> {
    return this._sendRequest('sendRequest', url, options);
  }

  /**
   * sendDBFile
   * @param url url
   * @param data fileData
   * @param options options
   */
  public async sendDBFile(url: any, data: any, options: RequestOpt = {}) {
    return this._sendRequest('sendDBFile', url, {
      method: 'POST',
      contentType: 'multipart/form-data',
      data,
      ...options,
    });
  }

  private async _sendRequest(funcName: string, url: string, options: RequestOpt) {
    const { ctx, app } = this;
    const requestId = app.m7Utils.UUID.generateUuid();
    const { noResLog, resDataOnly } = options;
    delete options.noResLog;
    delete options.resDataOnly;

    ctx.logger.info(funcName, requestId, 'send request method:', options.method || 'GET', 'url:', url, 'data:',
      typeof options.data === 'string' ? options.data : JSON.stringify(options.data));

    try {
      const res = await ctx.curl(url, {
        timeout: app.constants.HTTP_REQUEST_DEFAULT_TIMEOUT,
        ...options,
      });

      if (!noResLog) {
        let results: any = (res && 'data' in res) ? res.data : '';
        if (results) {
          if (Buffer.isBuffer(results)) {
            results = Buffer.from(results).toString();
          } else if (typeof results === 'object') {
            results = JSON.stringify(results);
          }
        }
        ctx.logger.info(`${funcName} ${requestId} response: status ${res.status} data: ${results}`);
      }

      return resDataOnly ? res.data : res;
    } catch (e) {
      ctx.logger.error(funcName, requestId, 'request error:', e);
      throw e;
    }
  }
}
