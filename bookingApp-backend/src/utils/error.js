// Khởi tạo hàm hiển thị lỗi dùng chung
export const createError = (status, message) => {
    const err = new Error();
    err.status = status;
    err.message = message;
    return err;
}