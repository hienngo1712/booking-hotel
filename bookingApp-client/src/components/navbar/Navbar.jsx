import { useContext, useState } from "react";
import "./navbar.css"
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import axios from "axios";
import Loading from "../loading/Loading";
const Navbar = () => {
  const navigate = useNavigate();
  const { user, dispatch } = useContext(AuthContext);
  const [ load, setLoad ] = useState(false);
  const handleClick = () => {
      Swal.fire({
        title: 'Bạn có chắc muốn đăng xuất không',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Đăng xuất',
      }).then((result) => {
        if (result.isConfirmed) {
          setLoad(true);
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
          axios.post("/auth/logout")
          setLoad(false);
          navigate('/');
        }
      })
    }
  return load ? <Loading /> : (
    <div className="navbar">
      <div className="navContainer">
        <Link to="/">
          <span className="logo">lamabooking</span>
        </Link>
        {user ? (
          <div className="navItems">
            <button className="navSub">VNĐ</button>       
            <button className="navImg">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/800px-Flag_of_Vietnam.svg.png" alt="Việt Nam" />
            </button> 
            <button className="navSub">
              <Link to="/register-hotel">Đăng ký chỗ nghỉ của bạn</Link>
            </button>

            <Link className="navInfo" to={`/info/${user._id}`}>
              {user.username}
            </Link>
            
            <button onClick={handleClick} className="navButton">Log out</button>
          </div>
            
        ) : <div className="navItems">
          <button className="navSub">VNĐ</button>       
          <button className="navImg">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/800px-Flag_of_Vietnam.svg.png" alt="Việt Nam" />
          </button> 
          <button className="navSub">
            <Link to="/register-hotel">Đăng ký chỗ nghỉ của bạn</Link>
          </button>
          <button className="navButton">
            <Link to="/login">Đăng ký</Link>
          </button>
          <button className="navButton">
            <Link to="/login">Đăng nhập</Link>
          </button>
        </div>
        }
      </div>
    </div>
  )
}

export default Navbar