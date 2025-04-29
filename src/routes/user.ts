import express from 'express';
import { userLogin, userRegister } from '../controller/user/authentication/authentication';
import {
  userLoginMiddleware,
  userRegisterMiddleware,
  userTokenCheckMiddleware,
} from '../middleware/user/userMiddleware';
import { addBid, getBidListUser, getMarketListUser } from '../controller/user/market-management/market-management';
import { getProfileData, getSingleAdmin, postUpdateProfile } from '../controller/user/profile/profile';
import { getTransactionsList, postRequestAddMoney, postWithdrawMoney } from '../controller/user/wallet-management/wallet-management';
import { getGameListuser } from '../controller/user/game-management/game-management';

const route = express.Router();
// test
route
// Auth
  .post('/register', userRegisterMiddleware, userRegister)
  .post('/login', userLoginMiddleware, userLogin)
  // Profile
  .post('/update-profile', userTokenCheckMiddleware, postUpdateProfile)
  .get('/get-profile', userTokenCheckMiddleware, getProfileData)
  .get('/get-admin-profile', userTokenCheckMiddleware, getSingleAdmin)
  // Market Management
  .get('/market-list', userTokenCheckMiddleware, getMarketListUser)
  .post('/add-bid', userTokenCheckMiddleware, addBid)
  .get('/get-bid-list', userTokenCheckMiddleware, getBidListUser)
  // Game Management
  .get('/game-list', userTokenCheckMiddleware, getGameListuser)
  // Wallet Management
  .get('/transactions-list', userTokenCheckMiddleware, getTransactionsList)
  .post('/request-add-money', userTokenCheckMiddleware, postRequestAddMoney)
  .post('/request-withdraw-money', userTokenCheckMiddleware, postWithdrawMoney)
export default route;
