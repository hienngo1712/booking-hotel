import "./newHotel.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useState } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from "../../components/loading/Loading";
import { useEffect } from "react";

const NewHotel = ({ inputs, title }) => {
  const [files, setFiles] = useState([]);
  const [info, setInfo] = useState({});
  const [ load, setLoad ] = useState(false);
  const [ city, setCity ] = useState([]);
  
  const handleChange = (e) => {
    setInfo((prev) => ({...prev, [e.target.id]: e.target.value}));
  }
  
  const handleClick = async (e) => {
    e.preventDefault();
    setLoad(true);
    try {
      const list = await Promise.all(
        Object.values(files).map(async (file) => {
          const data = new FormData();
          data.append("file", file);
          data.append("upload_preset", "upload");
          const uploadRes = await axios.post(
            "https://api.cloudinary.com/v1_1/dy1rrvnwh/image/upload",
            data
          );
          
          const { url } = uploadRes.data;
          return url;
        })
      );
      
      const newhotel = {
        ...info,
        photos: list,
      };
      
      await axios.post("/hotels", newhotel);
      toast.success("Tạo nơi cư trú thành công!");
    } catch (err) {
      toast.error("Tạo nơi cư trú không thành công!");
    }
    setLoad(false);
  };

  useEffect(() => {
      fetch('https://open.oapi.vn/location/provinces?page=0&size=63&query=')
          .then((response) => response.json())
          .then((data) => {
              setCity(data.data);
          })
          .catch((error) => console.error('Error fetching countries:', error));
  }, []);

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
            <div className="image-preview">
              {files.length !== 0 ? files.slice(0, 5).map((file, index) => (
                <img key={index} src={URL.createObjectURL(file)} alt={`preview-${index}`} />
              )): <img src="https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg" alt=""/>}
              {files.length > 5 && (
                <div className="more-images">+{files.length - 5} ảnh khác</div>
              )}
            </div>
            <p>Đã chọn {files.length} ảnh</p>
          </div>
          <div className="right">
            <form>
              <div className="formInput">
                <label htmlFor="file">
                  Ảnh: <DriveFolderUploadOutlinedIcon className="icon" />
                </label>
                <input
                  type="file"
                  id="file"
                  multiple
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files); // Chuyển FileList thành mảng
                    setFiles(selectedFiles);
                  }}
                  style={{ display: "none" }}
                />
              </div>

              {inputs.map((input) => (
                <div className="formInput" key={input.id}>
                  <label>{input.label}</label>
                  <input type={input.type} placeholder={input.placeholder} id={input.id} onChange={handleChange}/>
                </div>
              ))}

              <div className="formInput">
                <label>Tỉnh/ Thành phố</label>
                <select id="city" onChange={handleChange}>
                  {city.map((c) => {
                    return <option key={c.id} value={c.name}>{c.name}</option>
                  })}
                </select>
              </div>

              <div className="formInput">
                <label>Nổi bật</label>
                <select id="featured" onChange={handleChange}>
                  <option value={false}>Không</option>
                  <option value={true}>Có</option>
                </select>
              </div>
              <button onClick={handleClick}>Gửi</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewHotel;
