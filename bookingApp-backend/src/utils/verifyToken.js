import jwt from "jsonwebtoken";
import { createError } from "./error.js";

// Kiểm tra token
export const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token
    // Lỗi 401 do client (khách hàng/người dùng) chưa đăng nhập hoặc nhập token sai 
    if(!token) {
        return next(createError(401, "You are not authenticated!"))
    }

    // Token ko hợp lệ hoặc hết hạn
    jwt.verify(token, process.env.JWT_KEY, (err, user) => {
        if(err) 
            return next(createError(403, "Token is not valid!"));
        req.user = user;
        next();
    })
}

// Xác thực người dùng
export const verifyUser = (req, res, next) => {
    verifyToken(req, res, next,() => {
        if(req.user.id === req.params.id || req.user.isAdmin) {
            next();
        } else {
            // ko có quyền đăng nhập(do đăng nhập ko đúng role - vai trò)
            if(err) return next(createError(403, "You are not authorized!"))
        }
    })
}

export const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, next,() => {
        if(req.user.isAdmin) {
            next();
        } else {
            // tương tự verifyUser
            if(err) return next(createError(403, "You are not authorized!"))
        }
    })
}

export const verifyHotelier = (req, res, next) => {
    verifyToken(req, res, next,() => {
        if(req.user.isHotelier.length > 0 || req.user.isAdmin) {
            next();
        } else {
            // tương tự
            if(err) return next(createError(403, "You are not authorized!"))
        }
    })
}