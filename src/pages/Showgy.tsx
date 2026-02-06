import Layout from '../components/Layout';
import '../styles/information.css';

import sukjae from '../assets/image/Suckjae.gif';
import yongmin from '../assets/image/Yongmin.webp';
import chaewoo from '../assets/image/Chaewoo.png';
import sungchul from '../assets/image/sungchul.png';
import wonjun from '../assets/image/Wonjun.jpg';
import gaeun from '../assets/image/Gaeun.jpg';
import hyojin from '../assets/image/Hyojin.jpg';

export default function Showgy() {
  const characters = [
    {
      id: 1,
      name: '임석재',
      department: 'Company : Lotte Innovate',
      role: 'Role : Team Mentor',
      image: sukjae
    },
    {
      id: 2,
      name: '김용민',
      department: 'Major : Computer Science',
      role: 'Role : Leader/Backend Developer',
      image: yongmin
    },
    {
      id: 3,
      name: '이채우',
      department: 'Major : Computer Science',
      role: 'Role : Model Training Developer',
      image: chaewoo
    },
    {
      id: 4,
      name: '박성철',
      department: 'Major : Mathematical Data Science',
      role: 'Role : Frontend Developer',
      image: sungchul
    },
    {
      id: 5,
      name: '황원준',
      department: 'Major : Mathematical Data Science',
      role: 'Role : Backend Developer',
      image: wonjun
    },
    {
      id: 6,
      name: '이가은',
      department: 'Major : Artificial Intelligence',
      role: 'Role : Model Training Developer',
      image: gaeun
    },
    {
      id: 7,
      name: '김효진',
      department: 'Major : Mathematical Data Science',
      role: 'Role : Frontend Developer',
      image: hyojin
    },
  ];

  return (
    <Layout activeMenu="showgy">
      <div className="information-container">
        <div className="information-header">
          <h1 className="information-title">INFORMATION OF SHOW-GY</h1>
          <div className="information-underline"></div>
        </div>

        <div className="characters-grid">
          {characters.map((character) => (
            <div key={character.id} className="character-card">
              <div className="character-image-wrapper">
                <img src={character.image} alt={character.name} />
              </div>
              <div className="character-info">
                <div className="character-name">{character.name}</div>
                <div className="character-details">
                  <div className="detail-row">
                    <span className="detail-label">{character.department}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{character.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
