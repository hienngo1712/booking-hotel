import { useContext, useEffect, useState } from "react"
import Footer from "../../components/footer/Footer"
import Header from "../../components/header/Header"
import MailList from "../../components/mailList/MailList"
import Navbar from "../../components/navbar/Navbar"
import "./book.css"
import { useLocation, useNavigate, Link } from "react-router-dom"
import useFetch from "../../hooks/useFetch"
import { SearchContext } from "../../context/SearchContext"
import { format } from "date-fns";
import axios from "axios"
import Loading from "../../components/loading/Loading"

const Book = () => {
    const [countries, setCountries] = useState([]);
    const location = useLocation();
    const id = location.pathname.split('/')[2];
    const { data, loading, error } = useFetch(`/rooms/${id}`);
    const navigate = useNavigate();
    const [ load, setLoad] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        country: '',
        address: '',
        phone: '',
        note: ''
    });

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(null);
    const [couponMessage, setCouponMessage] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('cash'); // Mặc định là thẻ tín dụng

    const context = useContext(SearchContext);
    const { dates: contextDates, options: contextOptions } = context || {};

    const storedData = JSON.parse(localStorage.getItem("searchData")) || {};
    const userData = JSON.parse(localStorage.getItem("user")) || {};

    const [dates, setDates] = useState(contextDates?.length ? contextDates : storedData.dates || []);
    const [options, setOptions] = useState(contextOptions || storedData.options || { adult: 1, children: 0, room: 1 });
    
    const [subtotal, setSubtotal] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    
    useEffect(() => {
        if (contextDates?.length > 0) {
          setDates(contextDates);
          setOptions(contextOptions);
        } else if (storedData.dates?.length > 0) {
          setDates(storedData.dates);
          setOptions(storedData.options);
        } else {
          navigate("/");
        }
      }, [contextDates, contextOptions, storedData, navigate]);

    const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
    function dayDifference(date1, date2) {
        const timeDiff = Math.abs(date2.getTime() - date1.getTime());
        const diffDays = Math.ceil(timeDiff / MILLISECONDS_PER_DAY);
        return diffDays === 0 ? 1 : diffDays;
    }

    const days = (dates && dates.length > 0) 
    ? dayDifference(new Date(dates[0].endDate), new Date(dates[0].startDate)) 
    : 0;

    const getDatesInRange = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];
      let currentDate = new Date(start.getTime());
      while (currentDate <= end) {
        dates.push(new Date(currentDate).getTime());
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const formatCurrency = (number) => {
      return new Intl.NumberFormat('vi-VN').format(number);
    };

    useEffect(() => {
    if (data && data.price && dates.length > 0) {
        const roomCount = Number(options.room) || 1;
        const pricePerNight = Number(data.price) || 0;
        const currentDays = days > 0 ? days : 1; 

        const newSubtotal = currentDays * roomCount * pricePerNight;
        const discountValue = discount ? Number(discount.value) : 0;
        
        setSubtotal(newSubtotal);
        setTotalPrice(newSubtotal - discountValue);
    }
}, [data, days, options, discount, dates]);

    useEffect(() => {
        fetch('https://open.oapi.vn/location/countries')
            .then((response) => response.json())
            .then((data) => {
                const sortedCountries = data.data.sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                setCountries(sortedCountries);
            })
            .catch((error) => console.error('Error fetching countries:', error));
    }, []);

    const alldates = getDatesInRange(dates[0].startDate, dates[0].endDate);
    const isAvailable = (roomNumber) => {
        const isFound = roomNumber.unavailableDates.some(date => alldates.includes(new Date(date).getTime()));
        return !isFound;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode) {
            setCouponMessage('Vui lòng nhập mã giảm giá');
            return;
        }

        try {
            const response = await axios.get(`/discounts/${couponCode}`);
            if (response.data.success) {
                setDiscount(response.data.data);
                setCouponMessage(`Mã giảm giá ${couponCode} (${response.data.data.value}$) đã được áp dụng`);
            } else {
                setDiscount(null);
                setCouponMessage(response.data.message);
            }
        } catch (error) {
            setDiscount(null);
            setCouponMessage('Mã giảm giá không hợp lệ');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
          setLoad(true);
    
          // Kiểm tra phòng khả dụng
          const availableRooms = data.roomNumber?.filter((room) => isAvailable(room)) || [];
          if (availableRooms.length < options.room) {
            setLoad(false);
            alert("Không đủ phòng trống!");
            return;
          }
    
          const selectedRoomNumbers = availableRooms.slice(0, options.room);
          const subtotal = days * options.room * data.price;
          const discountValue = discount && discount.value < subtotal ? discount.value : 0;
          const totalPrice = subtotal - discountValue;
    
          const rooms = selectedRoomNumbers.map((room) => ({
            roomId: id,
            price: data.price,
            roomNumber: room.number,
          }));
    
          const invoiceData = {
            name: formData.name,
            email: formData.email,
            age: parseInt(formData.age) || 0,
            country: formData.country,
            address: formData.address,
            phone: formData.phone,
            note: formData.note,
            rooms,
            date: alldates.map((date) => new Date(date)),
            adults: options.adult,
            children: options.children,
            totalPrice,
            discount: discountValue,
            userId: userData._id?.toString() || "",
            status: paymentMethod === "cash" ? 1 : 0,
          };
    
          let invoiceResponse;
          try {
            invoiceResponse = await axios.post(`/invoices/`, invoiceData);
          } catch (error) {
            throw new Error("Lỗi khi tạo hóa đơn: " + error.message);
          }
    
          try {
            // Cập nhật unavailableDates cho từng phòng
            await Promise.all(
              selectedRoomNumbers.map((room) =>
                axios.put(`/rooms/availability/${id}/${room.number}`, { dates: alldates })
              )
            );
          } catch (error) {
            console.log("Lỗi khi cập nhật phòng: " + error.message);
          }
    
          if (paymentMethod === "qr") {
            try {
              const qrResponse = await axios.post("/invoices/payment/vnpay", {
                amount: totalPrice,
                userId: userData._id,
                invoiceId: invoiceResponse.data._id,
              });
              window.location.href = qrResponse.data;
            } catch (error) {
              console.log("Lỗi khi tạo thanh toán QR: " + error.message);
            }
          }
    
          // Lấy thông tin khách sạn
          let hotelData = { name: "Unknown Hotel", address: "Unknown Address" };
          try {
            const hotelResponse = await axios.get(`/hotels/find/${data.hotelId}`);
            if (hotelResponse.data) {
              hotelData = hotelResponse.data;
            }
          } catch (error) {
            console.error("Lỗi khi lấy thông tin khách sạn:", error);
          }
    
          const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          };
    
          const emailData = {
            name: formData.name,
            email: formData.email,
            age: parseInt(formData.age) || 0,
            country: formData.country,
            address: formData.address,
            phone: formData.phone,
            room: data.title,
            roomNumber: selectedRoomNumbers.map((room) => room.number).join(","),
            hotel: hotelData.name,
            hotelAddress: hotelData.address,
            date: dates[0]
              ? `Từ ngày ${formatDate(dates[0].startDate)} đến ngày ${formatDate(dates[0].endDate)}`
              : "N/A",
          };
    
          try {
            await axios.post("/email", { email: emailData.email, emailData });
          } catch (error) {
            console.error("Lỗi khi gửi email:", error);
            // Không rollback vì email không ảnh hưởng đến logic đặt phòng
          }
    
          setLoad(false);
          alert(
            paymentMethod === "cash"
              ? "Đặt phòng thành công, vui lòng thanh toán sau!" 
              : "Đặt phòng và thanh toán thành công!"
          );
        } catch (error) {
          console.error("Lỗi khi đặt phòng:", error);
          alert(error.message || "Có lỗi xảy ra khi đặt phòng!");
          setLoad(false);
        }
      };

    return load ? <Loading /> : (
        <div>
            <Navbar />
            <Header type="list"/>
            <div className="bookContainer">
                <div className="container">
                    <form className="checkout-section" onSubmit={handleSubmit}>
                        <h2>Xác nhận đặt phòng</h2>
                        
                        <div className="section">
                            <h3>Thông tin liên hệ</h3>
                            <div className="form-group">
                                <input type="email" name="email" placeholder="Email" onChange={handleInputChange} required/>
                                <input type="tel" name="phone" placeholder="Số điện thoại" onChange={handleInputChange} required/>
                            </div>
                        </div>

                        <div className="section">
                            <h3>Thông tin chi tiết</h3>
                            <div className="form-group">
                                <input type="text" name="name" placeholder="Họ và tên" onChange={handleInputChange} required/>
                                <input type="number" name="age" placeholder="Tuổi" onChange={handleInputChange} required/>
                            </div>
                            <div className="form-group">
                                <select name="country" onChange={handleInputChange} required>
                                  <option value="">---- Quốc gia ----</option>
                                    {countries.map((country) => {
                                         return <option key={country.id} value={country.niceName}>
                                            {country.niceName}
                                        </option>
                                    })}
                                </select>
                                <input type="text" name="address" placeholder="Địa chỉ" onChange={handleInputChange} required/>
                            </div>
                            <div className="form-group">
                                <textarea name="note" placeholder="Thông tin thêm" onChange={handleInputChange}></textarea>
                            </div>
                        </div>

                        <div className="section">
                            <h3>Giảm giá</h3>
                            <div className="form-group coupon-group">
                                <input 
                                    type="text" 
                                    placeholder="Mã giảm giá" 
                                    value={couponCode} 
                                    onChange={(e) => setCouponCode(e.target.value)} 
                                />
                                <button className="apply-coupon" onClick={handleApplyCoupon}>Áp dụng</button>
                            </div>
                            {couponMessage && (
                                <div className={`coupon-message ${discount ? 'success' : 'error'}`}>
                                    {couponMessage} {discount && <button onClick={() => { setDiscount(null); setCouponMessage(''); }}>Remove</button>}
                                </div>
                            )}
                        </div>

                        <div className="section">
                            <h3>Phương thức thanh toán</h3>
                            <div className="payment-options">
                                <label>
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="qr" 
                                        checked={paymentMethod === 'qr'} 
                                        onChange={() => setPaymentMethod('qr')} 
                                    /> 
                                    <p>Ví điện tử VNPay</p>
                                </label>
                                <label>
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="cash" 
                                        checked={paymentMethod === 'cash'} 
                                        onChange={() => setPaymentMethod('cash')} 
                                    /> 
                                    <p>Thanh toán khi trả phòng</p>
                                </label>
                            </div>

                            {paymentMethod === 'cash' && (
                                <div className="cash-section">
                                    <h4>Thanh toán khi trả phòng</h4>
                                    <p>Bạn sẽ thanh toán bằng tiền mặt khi trả phòng tại khách sạn.</p>
                                </div>
                            )}

                            <button type="submit" className="confirm-btn">
                                {paymentMethod === 'qr' ? `Xác nhận và thanh toán ${formatCurrency(totalPrice)} đ` : 'Xác nhận đặt phòng'}
                            </button>
                        </div>
                    </form>

                    <div className="order-details">
                        <h2>Chi tiết hóa đơn <span className="edit-icon">✎</span></h2>
                        <div className="order-item">
                            <img src={data.img} alt={data.title}/>
                            <div className="order-info">
                                <div className="rating">
                                    <h3>{options.room} x {data.title}</h3>
                                    <span>5.0</span> (400 đánh giá)
                                </div>
                                <p>{formatCurrency(data.price)} <u>đ</u></p>
                            </div>
                        </div>
                        <div className="traveler-info">
                            <h4>Thông tin phòng đặt</h4>
                            <p>
                                <span>Ngày nhận:</span>
                                <span>
                                {dates[0]?.startDate
                                    ? format(new Date(dates[0].startDate), "dd/MM/yyyy")
                                    : "N/A"}
                                </span>
                            </p>
                            <p>
                                <span>Ngày trả:</span>
                                <span>
                                {dates[0]?.endDate
                                    ? format(new Date(dates[0].endDate), "dd/MM/yyyy")
                                    : "N/A"}
                                </span>
                            </p>
                            <p><span>Thời gian:</span><span>{days} đêm</span></p>
                            <p><span>Người lớn:</span><span>{options.adult}</span></p>
                            <p><span>Trẻ em:</span><span>{options.children}</span></p>
                        </div>
                        <div className="payment-info">
                            <h4>Thông tin thanh toán</h4>
                            <p><span>Tổng số tiền:</span> <span>{formatCurrency(subtotal)} <u>đ</u></span></p>
                            <p><span>Giảm giá:</span> <span>{discount ? "-" + formatCurrency(discount.value) : 0} <u>đ</u></span></p>
                            <p className="total">Tổng cộng phải trả: <span>{formatCurrency(totalPrice)} <u>đ</u></span></p>
                        </div>
                    </div>
                </div>
            </div>
            <MailList/>
            <Footer/>
        </div>
    );
};

export default Book;