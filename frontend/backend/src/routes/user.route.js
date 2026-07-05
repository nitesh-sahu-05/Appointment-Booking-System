const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const { userRegister, userLogin, logout, userProfile } = require("../controllers/user.controller")
const router = express.Router()

router.post('/register', userRegister)
router.post('/login', userLogin)
router.get('/profile', authMiddleware, userProfile)
router.get('/logout', authMiddleware, logout)





module.exports = router