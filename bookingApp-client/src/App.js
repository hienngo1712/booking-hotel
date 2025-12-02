import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Home from "./pages/home/Home";
import Hotel from "./pages/hotel/Hotel";
import List from "./pages/list/List";
import Login from "./pages/login/Login";
import Book from "./pages/book/Book";
import Info from "./pages/info/Info";
import RegisterHotel from "./pages/registerHotel/RegisterHotel";
import PaymentSuccess from "./pages/paymentSuccess/paymentSuccess";
import HotelList from "./pages/hotelList/HotelList";
import RoomList from "./pages/hotelList/RoomList";
import { ToastContainer } from "react-toastify";
import ChatBox from "./components/chatbox/ChatBox";
import Revenue from "./pages/revenue/Revenue";
import { GoogleOAuthProvider } from "@react-oauth/google";
function App() {
  const googleClientId = process.env.REACT_APP_GG_CLIENT_ID;
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/hotels" element={<List/>}/>
          <Route path="/hotels/:id" element={<Hotel/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/book/:id" element={<Book/>}/>
          <Route path="/info/:id" element={<Info/>}/>
          <Route path="/register-hotel/" element={<RegisterHotel/>}/>
          <Route path="/hotel-list/" element={<HotelList/>}/>
          <Route path="/revenue/" element={<Revenue/>}/>
          <Route path="/room-list/:hotelId" element={<RoomList/>}/>
          <Route path="/payment-success/:id" element={<PaymentSuccess/>}/>
        </Routes>
        <ToastContainer />
        <ChatBox />
      </BrowserRouter>
    </GoogleOAuthProvider>
    
  );
}

export default App;
