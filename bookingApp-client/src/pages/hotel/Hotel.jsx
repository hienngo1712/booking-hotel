import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import MailList from "../../components/mailList/MailList";
import Footer from "../../components/footer/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleArrowLeft,
  faCircleArrowRight,
  faCircleXmark,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import { useLocation, useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import { AuthContext } from "../../context/AuthContext";
import Reserve from "../../components/reserve/Reserve.jsx";
import Loading from "../../components/loading/Loading.jsx";

const Hotel = () => {
  const location = useLocation();
  const id = location.pathname.split("/")[2];
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const { data, loading, error } = useFetch(`/hotels/find/${id}`);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Lấy dữ liệu từ SearchContext
  const context = useContext(SearchContext);
  const { dates: contextDates, options: contextOptions } = context || {};

  // Lấy dữ liệu từ localStorage (nếu có)
  const storedData = JSON.parse(localStorage.getItem("searchData")) || {};

  // Khởi tạo state với giá trị từ context hoặc localStorage
  const [dates, setDates] = useState(
    contextDates?.length ? contextDates : storedData.dates || []
  );
  const [options, setOptions] = useState(
    contextOptions || storedData.options || { adult: 1, children: 0, room: 1 }
  );
  const ggMap = "https://www.google.com/maps/embed?pb=" + data.ggMap
  useEffect(() => {
    if (contextDates && contextDates.length > 0) {
      // Nếu dữ liệu từ SearchContext tồn tại, sử dụng nó
      setDates(contextDates);
      setOptions(contextOptions);
    } else {
      // Nếu không, lấy dữ liệu từ localStorage
      const searchData = localStorage.getItem("searchData");
      if (searchData) {
        const parsedData = JSON.parse(searchData);
        setDates(parsedData.dates);
        setOptions(parsedData.options);
      } else {
        // Nếu không có dữ liệu trong localStorage, chuyển hướng về trang tìm kiếm
        navigate("/");
      }
    }
  }, [contextDates, contextOptions, navigate]);

  const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
  function dayDifference(date1, date2) {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(timeDiff / MILLISECONDS_PER_DAY);
    return diffDays;
  } // Tính chênh lệch số ngày

  const days = dayDifference(
    new Date(dates[0].endDate),
    new Date(dates[0].startDate)
  );

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    let newSlideNumber;

    if (direction === "l") {
      newSlideNumber = slideNumber === 0 ? 5 : slideNumber - 1;
    } else {
      newSlideNumber = slideNumber === 5 ? 0 : slideNumber + 1;
    }

    setSlideNumber(newSlideNumber);
  };

  const handleClick = () => {
    if (user) {
      setOpenModal(true);
    } else {
      navigate("/login");
    }
  };

  const formatCurrency = (number) => {
    return new Intl.NumberFormat("vi-VN").format(number);
  };

  return (
    <div>
      <Navbar />
      <Header type="list" />
      {loading ? (
        <Loading />
      ) : (
        <div className="hotelContainer">
          {open && (
            <div className="slider">
              <FontAwesomeIcon
                icon={faCircleXmark}
                className="close"
                onClick={() => setOpen(false)}
              />
              <FontAwesomeIcon
                icon={faCircleArrowLeft}
                className="arrow"
                onClick={() => handleMove("l")}
              />
              <div className="sliderWrapper">
                <img
                  src={data.photos[slideNumber]}
                  alt=""
                  className="sliderImg"
                />
              </div>
              <FontAwesomeIcon
                icon={faCircleArrowRight}
                className="arrow"
                onClick={() => handleMove("r")}
              />
            </div>
          )}
          <div className="hotelWrapper">
            <button onClick={handleClick} className="bookNow">
              Đặt phòng ngay
            </button>
            <h1 className="hotelTitle">{data.name}</h1>
            <div className="hotelAddress">
              <FontAwesomeIcon icon={faLocationDot} />
              <span>{data.address}</span>
            </div>
            <span className="hotelDistance">
              Vị trí tuyệt vời – Cách trung tâm {data.distance}m
            </span>
            <span className="hotelPriceHighlight">
              Đặt phòng trên {data.cheapestPrice}
              <small>VNĐ</small> ở địa điểm này và nhận ngay một chuyến taxi sân
              bay miễn phí
            </span>
            <div className="hotelImages">
              {data.photos?.slice(0, 5).map((photo, i) => (
                <div className="hotelImgWrapper" key={i}>
                  <img
                    onClick={() => handleOpen(i)}
                    src={photo}
                    alt=""
                    className="hotelImg"
                  />
                </div>
              ))}
              {data.photos?.length > 5 && (
                <div
                  className="hotelImgWrapper"
                  onClick={() => handleOpen(5)} // Mở ảnh đầu tiên khi click vào
                >
                  <div className="hotelImgOverlay">
                    <span>+{data.photos.length - 5}</span>
                  </div>
                  <img
                    src={data.photos[5]} // Hiển thị ảnh thứ 6
                    alt=""
                    className="hotelImg"
                  />
                </div>
              )}
            </div>
            <div className="hotelDetails">
              <div className="hotelDetailsTexts">
                <h1 className="hotelTitle">{data.title}</h1>
                <p className="hotelDesc">{data.desc}</p>
              </div>
              <div className="hotelDetailsPrice">
                <h1>
                  Hoàn hảo cho {days === 0 ? 1 + " ngày" : days + " đêm"} ở đây
                </h1>
                <span>
                  Nằm ở vị trí tuyệt vời, địa điểm này sẽ là nơi nghỉ chân lý
                  tưởng giúp bạn có một kỳ nghỉ không thể nào quên
                </span>
                <h2>
                  <b>
                    {days === 0
                      ? formatCurrency(data.cheapestPrice * options.room)
                      : formatCurrency(
                          days * data.cheapestPrice * options.room
                        )}{" "}
                    <small>VNĐ</small>
                  </b>{" "}
                  ({days === 0 ? 1 + " ngày" : days + " đêm"})
                </h2>
                <button onClick={handleClick}>Đặt ngay</button>

                <div className="hotelMap">
                  <iframe
                    src = { ggMap }
                    width="400"
                    height="300"
                    style={{ border: 0 }}
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
          <MailList />
          <Footer />
        </div>
      )}
      {openModal && <Reserve setOpen={setOpenModal} hotelId={id} />}
    </div>
  );
};

export default Hotel;
