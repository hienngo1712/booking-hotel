import "./newRoom.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import { useState, useEffect } from "react";
import useFetch from "../../hooks/useFetch";
import axios from "axios";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import 'react-toastify/dist/ReactToastify.css';
import Loading from "../../components/loading/Loading";
import { toast } from "react-toastify";

const NewRoom = ({ inputs, title }) => {
  const [file, setFile] = useState("");
  const [info, setInfo] = useState({});
  const [hotelId, setHotelId] = useState(undefined);
  const [rooms, setRooms] = useState([]);
  const [ load, setLoad ] = useState(false);
  
  const { data, loading, error } = useFetch("/hotels")
  const handleChange = (e) => {
    setInfo((prev) => ({...prev, [e.target.id]: e.target.value}));
  }
  useEffect(() => {
    if (data && data.length > 0) {
      setHotelId(data[0]._id);
    }
  }, [data]);
  const handleClick = async (e) => {
    e.preventDefault();
    setLoad(true);
    const roomNumber = rooms.split(",").map((room) => ({ number: room.trim() }));
    
    const dataRoom = new FormData();
    dataRoom.append("file", file);
    dataRoom.append("upload_preset", "upload");
    try {
      const uploadRes = await axios.post("https://api.cloudinary.com/v1_1/dy1rrvnwh/image/upload", dataRoom)

      const {url} = uploadRes.data;
      const newRoom = {
        ...info,
        roomNumber,
        img: url,
        hotelId: hotelId
      }
      await axios.post(`/rooms/${hotelId}`,newRoom)
      toast.success("Tạo phòng thành công!")
    } catch (err) {
      toast.error("Tạo phòng thất bại!")
    }
    setLoad(false);
  }

  return load ? <Loading /> : (
    <div className="new">
      <Sidebar />
      <div className="newContainer">
        <Navbar />
        <div className="top">
          <h1>{title}</h1>
        </div>
        <div className="bottom">
          <div className="left">
            <img
              src={
                file
                  ? URL.createObjectURL(file)
                  : "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg"
              }
              alt=""
            />
          </div>
          <div className="right">
            <form>
              <div className="formInput">
                <label htmlFor="file">
                  Image: <DriveFolderUploadOutlinedIcon className="icon" />
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
              </div>
              {inputs.map((input) => (
                <div className="formInput" key={input.id}>
                  <label>{input.label}</label>
                  <input id={input.id} type={input.type} onChange={handleChange} placeholder={input.placeholder} />
                </div>
              ))}
              <div className="formInput">
                <label>Rooms</label>
                <textarea onChange={e => setRooms(e.target.value)} placeholder="give comma between room numbers." />
              </div>
              <div className="formInput">
                <label>Choose a hotel</label>
                <select id="hotelId" onChange={e => setHotelId(e.target.value)}>
                  {loading ? "loading" : data && data.map(hotel => {
                    return <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
                  })}
                </select>
              </div>
              <button onClick={handleClick}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewRoom;
