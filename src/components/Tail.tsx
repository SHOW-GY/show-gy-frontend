import logo from '../assets/image/logo.png';
import '../styles/design.css';
import '../styles/home.css';


const Tail = () => {
  return (
    <div className="tail">
      <div className="tail-content">
        <div className="tail-logo">
          <div className="tail-logo-icon"><img src={logo} alt="Logo" /></div>
          <span className="tail-logo-text">SHOW-GY</span>
        </div>
        <div className="tail-info">
          (15588) 경기도 안산시 상록구 한양대학로 55<br />
          © 2026 Document Summary Project. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default Tail;