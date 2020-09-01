import { Application } from 'egg';
import { action } from './middleware/action';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.home.index);
  // login before
  router.get('/system/getUpNf', controller.system.getUpNf);

  // login controll
  router.get('/login/checkAccountHttps', controller.login.checkAccountHttps);
  router.get('/login/loginForSafe', controller.login.loginForSafe);
  router.get('/login/loginToAuthCenter', controller.login.loginToAuthCenter);
};
