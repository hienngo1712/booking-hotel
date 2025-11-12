import "./newHotel.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Loading from "../../components/loading/Loading";


const UpdateHotel = ({ inputs, title }) => {
  const location = useLocation();
  const id = location.pathname.split("/")[3];
  const [files, setFiles] = useState([]);
  const [info, setInfo] = useState({});
  const [ load, setLoad ] = useState(false);


  const { data, loading, error } = useFetch(`/hotels/find/${id}`)

  useEffect(() => {
    if (data) {
      setInfo({
        name: data.name || "",
        type: data.type || "",
        city: data.city || "",
        address: data.address || "",
        distance: data.distance || "",
        title: data.title || "",
        desc: data.desc || "",
        cheapestPrice: data.cheapestPrice || "",
        featured: data.featured || false
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const value = e.target.id === "featured" ? e.target.value === "true" : e.target.value;
    setInfo((prev) => ({ ...prev, [e.target.id]: value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    setLoad(true);
    try {
      let updatedHotel = { ...info };

      // Nếu có ảnh mới được upload
      if (files.length > 0) {
        const list = await Promise.all(
          files.map(async (file) => {
            const data = new FormData();
            data.append("file", file);
            data.append("upload_preset", "upload");
            const uploadRes = await axios.post(
              "https://api.cloudinary.com/v1_1/dy1rrvnwh/image/upload",
              data
            );
            return uploadRes.data.url;
          })
        );
        updatedHotel.photos = list;
      }

      // Gửi request PUT để update hotel
      await axios.put(`/hotels/${id}`, updatedHotel);
      toast.success("Cập nhật nơi cư trú thành công");
    } catch (err) {
      console.log(err);
      toast.error("Có lỗi xảy ra: " + err.message);
    }
    setLoad(false)
  };

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
              {files.length > 0 ? (
                files.slice(0, 5).map((file, index) => (
                  <img key={index} src={URL.createObjectURL(file)} alt={`preview-${index}`} />
                ))
              ) : data?.photos?.length > 0 ? (
                data.photos.slice(0, 5).map((photo, index) => (
                  <img key={index} src={photo} alt={`hotel-${index}`} />
                ))
              ) : (
                <img src="https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg" alt="no-image" />
              )}
              {(files.length > 5 || (!files.length && data?.photos?.length > 5)) && (
                <div className="more-images">
                  +{(files.length || data?.photos?.length) - 5} ảnh khác
                </div>
              )}
            </div>
            <p>Đã chọn {files.length || data?.photos?.length || 0} ảnh</p>
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
                  <input
                    type={input.type}
                    placeholder={input.placeholder}
                    id={input.id}
                    onChange={handleChange}
                    value={info[input.id] || ""}
                  />
                </div>
              ))}
              <div className="formInput">
                <label>Nổi bật</label>
                <select id="featured" onChange={handleChange} value={info.featured}>
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

export default UpdateHotel;
