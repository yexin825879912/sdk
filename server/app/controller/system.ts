import { Controller } from 'egg';

export default class SystemController extends Controller {
  /**
   * 首次请求云客服系统 前端项目页面
   * 登陆页面的第二个接口
   */
  public async getUpNf() {
    const { ctx } = this;
    const bizData = ctx.request.body;

    // 调整服务器和客户端浏览器的时间
    const localTimestamp = bizData.localTimestamp;
    let diff = 0;
    if (localTimestamp) {
      diff = new Date().getTime() - localTimestamp;
      ctx.result.serverDiffTime = diff;
    }

    // 获取服务端时间戳
    ctx.result.serverTime = Date.now();

    // 是否是私有云 通过配置获取
    ctx.result.privatization = false;

    try {
      const [
        socketAddress,
        // newSkillUrlConfig,
        updateFiles,
        // oemInfo,
        isOem,
        platformUrls,
        // isSliderOpen,
        // isRealTimeExport,
        // newSkillImg,
        attachmentMaxSize,
      ] = await Promise.all([
        ctx.service.system.getSocketPushServiceAddress(),
        // ctx.service.system.getNewSkillUrlConfig(), //
        ctx.service.system.getUpdateConfig(),
        // ctx.service.system.getOemInfo(), // 获取OEM信息
        ctx.service.system.isOem(), // 判断是否是OEM
        ctx.service.system.getPlatformUrls(),
        // ctx.service.system.isSliderOpen(), //
        // ctx.service.system.getRealTimeExportFlag(), // 获取实时导出标志
        // ctx.service.system.getNewSkillImgConfig(), // 获取图片链接
        ctx.service.system.getAttachmentMaxSize(),
      ]);

      if (socketAddress) {
        ctx.result.ccPushUrl = socketAddress;
      }
      Object.assign(ctx.result, {
        // ...newSkillUrlConfig,
        isNew: true,
        list: updateFiles,
        // ...oemInfo,
        // isOem,
        platform_urls: platformUrls,
        // is_open_slider: isSliderOpen,
        // isRealTimeExport,
        // ...newSkillImg,
        attachmentMaxSize,
      });
    } catch (error) {
      ctx.logger.error('SystemController getUpNf error', error);
    }
  }
}
