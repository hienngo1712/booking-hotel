// Import thư viện nodemailer để gửi email qua SMTP (Simple Mail Transfer Protocol)
import  nodemailer from 'nodemailer';

// Hàm gửi email xác nhận đặt phòng
// email: địa chỉ người nhận
// emailData: đối tượng(object) chứa thông tin đơn đặt phòng
const SendEmailService = async (email, emailData) => {
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for port 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      const info = await transporter.sendMail({
        from: `"Iambooking" <dovinhdai@gmail.com>`, // sender address
        to: email, // list of receivers
        subject: "Xác nhận hóa đơn đặt phòng khách sạn", // Subject line
        text: "", // plain text body
        html: `
          <div>
            <p>Khách hàng: ${emailData.name}</p>
            <p>Địa chỉ: ${emailData.address}</p>
            <p>Số điện thoại: ${emailData.phone}</p>
            <p>Khách sạn: ${emailData.hotel}</p>
            <p>Địa chỉ khách sạn: ${emailData.hotelAddress}</p>
            <p>Loại phòng: ${emailData.room}</p>
            <p>Số phòng: ${emailData.roomNumber}</p>
            <p>Ngày nhận và trả phòng: ${emailData.date}</p>
          </div>
          <br/>
          <b>Cảm ơn bạn đã lựa chọn dịch vụ của Iambooking, chúc bạn có một kỳ nghỉ tuyệt vời!</b>
        `, 
      });
      return info;
}

export default SendEmailService;
