import express from 'express';
import { addMarket, getBidListAdmin, getGamesListNames, getMarketListAdmin, getMarketListNames, getSingleMarketAdmin, updateMarket } from '../controller/admin/market-management/market-management';
import { adminLogin, adminRegister } from '../controller/admin/authentication/authentication';
import {  adminTokenCheckMiddleware } from '../middleware/admin/adminMiddleware';
import { adminAddMoney, adminRemoveMoney, getAllTransactionsList, postUpdateTransactionStatus } from '../controller/admin/wallet-management/wallet-management';
import { getAllBids, getAllUsersList, getDashboardStats, getSingleuser, getUserTransactionsList, postAdminUpdateUserProfile } from '../controller/admin/user/user';
import { addGame, getGameListAdmin, getSingleGameAdmin, updateGame } from '../controller/admin/game-management/game-management';
import { deleteWinData, getWinList, getWinnersList, postAddWinData, postDeclareWinners } from '../controller/admin/winnings-management/winnings-management';


const route = express.Router();

route.post('/register', adminRegister)
.post('/login', adminLogin)
// Market Management
.post('/add-market',adminTokenCheckMiddleware, addMarket)
.patch('/update-market',adminTokenCheckMiddleware, updateMarket)
.get('/get-market-list',adminTokenCheckMiddleware, getMarketListAdmin)
.get('/get-market-list-names',adminTokenCheckMiddleware, getMarketListNames)
.get('/get-game-list-names',adminTokenCheckMiddleware, getGamesListNames)
.get('/get-single-market-list',adminTokenCheckMiddleware, getSingleMarketAdmin)
// Game Management
.post('/add-game',adminTokenCheckMiddleware, addGame)
.patch('/update-game',adminTokenCheckMiddleware, updateGame)
.get('/get-game-list',adminTokenCheckMiddleware, getGameListAdmin)
.get('/get-single-game-list',adminTokenCheckMiddleware, getSingleGameAdmin)
// Wallet Management
.get('/all-transactions-list',adminTokenCheckMiddleware, getAllTransactionsList)
.get('/all-bid-list',adminTokenCheckMiddleware, getBidListAdmin)
.post('/update-transaction-status',adminTokenCheckMiddleware, postUpdateTransactionStatus)
.post('/admin-remove-money',adminTokenCheckMiddleware, adminRemoveMoney)
.post('/admin-add-money',adminTokenCheckMiddleware, adminAddMoney)
// user
.get('/user-list',adminTokenCheckMiddleware, getAllUsersList)
.get('/single-user',adminTokenCheckMiddleware, getSingleuser)
.get('/single-transaction',adminTokenCheckMiddleware, getUserTransactionsList)
.get('/get-dashboard-stats',adminTokenCheckMiddleware, getDashboardStats)
.get('/get-all-bids',adminTokenCheckMiddleware, getAllBids)
.post('/post-admin-update-user-profile',adminTokenCheckMiddleware, postAdminUpdateUserProfile)
// Winning Management
.post('/add-win-data',adminTokenCheckMiddleware, postAddWinData)
.get('/get-winners-list',adminTokenCheckMiddleware, getWinnersList)
.get('/get-win-list',adminTokenCheckMiddleware, getWinList)
.delete('/delete-win-data',adminTokenCheckMiddleware, deleteWinData)
.post('/post-declare-winners',adminTokenCheckMiddleware, postDeclareWinners)

export default route;
