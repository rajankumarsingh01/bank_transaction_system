const userModel = require("../../modules/users/user.model")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../../models/blackList.model")

async function authMiddleware(req, res, next) {

    const token = req.headers.authorization?.split(" ")[ 1 ] || req.cookies.accessToken

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try {

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await userModel.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user no longer exists"
            })
        }

        req.user = user

        return next()

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {

    const token = req.headers.authorization?.split(" ")[ 1 ] || req.cookies.accessToken

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user no longer exists"
            })
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        req.user = user

        return next()
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

}


async function authAdminMiddleware(req, res, next) {

    const token = req.headers.authorization?.split(" ")[ 1 ] || req.cookies.accessToken

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await userModel.findById(decoded.userId).select("+isAdmin")

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user no longer exists"
            })
        }

        if (!user.isAdmin) {
            return res.status(403).json({
                message: "Forbidden access, admin privileges required"
            })
        }

        req.user = user

        return next()
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware,
    authAdminMiddleware
}