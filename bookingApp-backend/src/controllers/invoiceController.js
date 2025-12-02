import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import Invoice from '../models/Invoice.js';
import { createError } from '../utils/error.js';
import 'dotenv/config';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay'


import QRCode from 'qrcode'

export const createInvoice =  async (req, res, next) => {
    const newInvoice = new Invoice(req.body);
    try {
        const savedInvoice = await newInvoice.save();
        res.status(200).json("Invoice is saved successfully")
    } catch (err) {
        next(err);
    }
}

export const deleteInvoice = async (req, res, next) => {
    try {
        await Invoice.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json("Invoice has been deleted")
    } catch(err) {
        next(err);
    }
}

export const getInvoiceById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const invoice = await Invoice.findById(id);
      res.status(200).json(invoice);
    } catch (error) {
      next(error);
    }
  };

export const getInvoiceByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const invoices = await Invoice.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error in getInvoicesByUser:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const getAllInvoice = async (req, res, next) => {
    try {
        const invoices = await Invoice.find();
        res.status(200).json(invoices)
    } catch(err) {
        next(err);
    }
}

export const paymentCredit = async (req, res, next) => {
    const { amount, cardDetails } = req.body;

    // Giả lập kiểm tra thông tin thẻ (thay bằng logic thực tế nếu dùng Stripe, v.v.)
    if (!cardDetails || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Thông tin thẻ hoặc số tiền không hợp lệ' });
    }

    // Giả lập thanh toán thành công
    setTimeout(() => {
        res.status(200).json({ success: true, message: 'Thanh toán bằng thẻ tín dụng thành công' });
    }, 1000); // Giả lập độ trễ 1 giây
}

export const paymentVnpay = async (req, res, next) => {
    const { amount, userId, InvoiceId } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!amount || !userId) {
        return res.status(400).json({ success: false, message: 'Thiếu amount hoặc userId' });
    }

    let invoice;

    if(!InvoiceId) {
        // Tìm invoice mới nhất với userId và status = 0
        invoice = await Invoice.findOne({ 
            userId: userId, 
            status: 0 
        }).sort({ createdAt: -1 }); // Sắp xếp theo ngày tạo giảm dần để lấy mới nhất

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy invoice phù hợp' });
        }
    } 

    // Tạo giá trị vnp_TxnRef ngẫu nhiên và độc nhất
    const generateUniqueTxnRef = () => {
        const timestamp = Date.now().toString(); // Thời gian hiện tại
        const randomStr = Math.random().toString(36).substring(2, 8); // Chuỗi ngẫu nhiên 6 ký tự
        return `${timestamp}${randomStr}`; // Kết hợp timestamp + random để đảm bảo độc nhất
    };
    const vnp_TxnRef = generateUniqueTxnRef();

    try {
        const vnpay = new VNPay({
            // Thông tin cấu hình bắt buộc
            tmnCode: 'KSKVARLY',
            secureSecret: 'OZR6QA9K912RUDW4D6C2PAKC20CH5YAP',
            vnpayHost: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            
            // Cấu hình tùy chọn
            testMode: true,                // Chế độ test
            hashAlgorithm: 'SHA512',      // Thuật toán mã hóa
            enableLog: true,              // Bật/tắt ghi log
            loggerFn: ignoreLogger,       // Hàm xử lý log tùy chỉnh
        });
    
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // Tăng ngày thêm 1 ngày
        const vnpayResponese = await vnpay.buildPaymentUrl({
            vnp_Amount: amount,
            vnp_IpAddr: '127.0.0.1',
            vnp_TxnRef: vnp_TxnRef,
            vnp_OrderInfo: `${InvoiceId ? InvoiceId : invoice._id}`,
            vnp_ReturnUrl: `http://localhost:3000/payment-success/${InvoiceId ? InvoiceId : invoice._id}`,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow)
        })
    
        res.status(201).json(vnpayResponese);
    } catch (error) {
        next(error);
    }
}

export const checkPaymentVnp = async (req, res, next) => {
    const invoiceId = req.params.id; // Lấy invoiceId từ URL
  
    try {
      const vnpay = new VNPay({
        tmnCode: 'KSKVARLY',
        secureSecret: ' OZR6QA9K912RUDW4D6C2PAKC20CH5YAP',
      });
  
      // Kiểm tra tính hợp lệ của chữ ký từ VNPay
      const isValid = vnpay.verifyReturnUrl(req.query);
      if (!isValid) {
        return res.status(400).json({ success: false, reason: 'invalid_signature' });
      }
  
      const { vnp_ResponseCode, vnp_OrderInfo } = req.query;
  
      if (vnp_OrderInfo !== invoiceId) {
        return res.status(400).json({ success: false, reason: 'invoice_mismatch' });
      }
  
      if (vnp_ResponseCode === '00') {
        // Thanh toán thành công
        const invoice = await Invoice.findByIdAndUpdate(
          invoiceId,
          { status: 2 }, // Cập nhật thành "Đã thanh toán"
          { new: true }
        );
        if (!invoice) {
          return res.status(404).json({ success: false, reason: 'invoice_not_found' });
        }
        res.status(200).json({ success: true });
      } else if (vnp_ResponseCode === '24') {
        // Người dùng hủy giao dịch
        res.status(400).json({ success: false, reason: 'cancelled' });
      } else {
        // Các lỗi khác từ VNPay
        res.status(400).json({ success: false, reason: vnp_ResponseCode });
      }
    } catch (error) {
      console.error('Error in checkPaymentVnp:', error);
      res.status(500).json({ success: false, reason: 'server_error' });
    }
  };

export const cancelInvoice = async (req, res) => {
    const { invoiceId } = req.params;

    try {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy invoice' });
        }

        if (invoice.status === 3 || invoice.status === 4) {
        return res.status(400).json({ success: false, message: 'Không thể hủy đơn đã hoàn thành hoặc đã hủy' });
        }

        // Cập nhật trạng thái thành "Đã hủy" (4)
        invoice.status = 4;
        await invoice.save();

        // Hoàn lại tính khả dụng của phòng
        for (const room of invoice.rooms) {
        await Room.updateOne(
            { _id: room.roomId, 'roomNumber.number': room.roomNumber },
            { $pull: { 'roomNumber.$.unavailableDates': { $in: invoice.date } } }
        );
        }

        res.status(200).json({ success: true, message: 'Hủy đặt phòng thành công' });
    } catch (error) {
        console.error('Error in cancelInvoice:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

export const showInvoice = async (req, res, next) => {
  try {
    // Lấy tối đa 6 hóa đơn, sắp xếp theo createdAt giảm dần
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 }) // Mới nhất trước
      .limit(6); // Tối đa 6 bản ghi

    // Chuẩn bị dữ liệu trả về
    const result = await Promise.all(
      invoices.map(async (invoice) => {
        const customerName = invoice.name

        // Lấy thông tin phòng (giả định chỉ lấy phòng đầu tiên để đơn giản)
        const room = invoice.rooms.length
          ? await Room.findById(invoice.rooms[0].roomId).select("title hotelId")
          : null;
        const roomTitle = room ? room.title : "Unknown";

        // Lấy thông tin khách sạn
        const hotel = room
          ? await Hotel.findById(room.hotelId).select("name photos")
          : null;
        const hotelName = hotel ? hotel.name : "Unknown";
        const hotelPhoto = hotel && hotel.photos.length ? hotel.photos[0] : "";

        // Format ngày ở
        const checkIn = new Date(invoice.date[0]);
        const checkOut = new Date(invoice.date[invoice.date.length - 1]);
        const dateRange = `${checkIn.getDate()}/${
          checkIn.getMonth() + 1
        }/${checkIn.getFullYear()} - ${checkOut.getDate()}/${
          checkOut.getMonth() + 1
        }/${checkOut.getFullYear()}`;

        // Ánh xạ trạng thái
        const mapStatus = (status) => {
          switch (status) {
            case 0:
              return "Đang chờ xử lý";
            case 1:
              return "Thanh toán sau";
            case 2:
              return "Đã thanh toán";
            case 3:
              return "Đã hoàn thành";
            case 4:
              return "Đã hủy";
            default:
              return "Không xác định";
          }
        };

        return {
          id: invoice._id.toString(),
          hotel: hotelName,
          hotelImg: hotelPhoto,
          customer: customerName,
          roomType: roomTitle,
          dateRange,
          amount: invoice.totalPrice,
          status: mapStatus(invoice.status),
        };
      })
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const showInvoiceDetail = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Lấy hóa đơn theo id
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return next(createError(404, "Hóa đơn không tồn tại"));
    }

    // Lấy thông tin khách hàng từ hóa đơn
    const customerName = invoice.name;

    // Lấy thông tin phòng (giả định chỉ lấy phòng đầu tiên để đơn giản)
    const room = invoice.rooms.length
      ? await Room.findById(invoice.rooms[0].roomId).select("title hotelId")
      : null;
    const roomTitle = room ? room.title : "Unknown";

    // Lấy thông tin khách sạn
    const hotel = room
      ? await Hotel.findById(room.hotelId).select("name photos")
      : null;
    const hotelName = hotel ? hotel.name : "Unknown";
    const hotelPhoto = hotel && hotel.photos.length ? hotel.photos[0] : "";

    // Format ngày ở
    const checkIn = new Date(invoice.date[0]);
    const checkOut = new Date(invoice.date[invoice.date.length - 1]);
    const dateRange = `${checkIn.getDate()}/${
      checkIn.getMonth() + 1
    }/${checkIn.getFullYear()} - ${checkOut.getDate()}/${
      checkOut.getMonth() + 1
    }/${checkOut.getFullYear()}`;

    // Ánh xạ trạng thái
    const mapStatus = (status) => {
      switch (status) {
        case 0:
          return "Đang chờ xử lý";
        case 1:
          return "Thanh toán sau";
        case 2:
          return "Đã thanh toán";
        case 3:
          return "Đã hoàn thành";
        case 4:
          return "Đã hủy";
        default:
          return "Không xác định";
      }
    };

    // Tạo object kết quả
    const result = {
      id: invoice._id.toString(),
      hotel: hotelName,
      hotelImg: hotelPhoto,
      customer: customerName,
      address: invoice.address,
      phone: invoice.phone,
      email: invoice.email,
      roomType: roomTitle,
      adults: invoice.adults,
      children: invoice.children,
      note: invoice.note,
      dateRange,
      discount: invoice.discount,
      amount: invoice.totalPrice,
      status: mapStatus(invoice.status),
      createdAt: invoice.createdAt,

    };

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const completeInvoice = async (req, res, next) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 3 } },
      { new: true }
    );
    if (!updatedInvoice) {
      return next(createError(404, 'Invoice not found'));
    }
    res.status(200).json(updatedInvoice);
  } catch (err) {
    next(err);
  }
}

export const countInvoice = async (req, res, next) => {
    
    try {
        const invoiceCount = await Invoice.countDocuments();
        
        res.status(200).json(invoiceCount)
    } catch(err) {
        next(err);
    }
}