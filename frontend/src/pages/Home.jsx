import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, Gamepad2, MapPin, MessageSquare, Ticket, Trophy,
  Atom, Server, Database, Cog, Radio, User, Target,
} from 'lucide-react';
import heroImg from '../assets/hero.png';

const INK = '#16213E';
const MUTED = '#556070';
const ORANGE = '#FF7448';
const CYAN = '#24D2D4';

const features = [
  { icon: Search, tint: '#FFE7DE', color: ORANGE, title: 'Real-Time Event Search', desc: 'Find events by location, type, and date.' },
  { icon: Gamepad2, tint: '#D9F6F6', color: CYAN, title: 'Esports & Sports Focus', desc: 'Explore both online and in-person events.' },
  { icon: MapPin, tint: '#FFE7DE', color: ORANGE, title: 'Interactive Maps', desc: 'See events happening in your area and get directions.' },
  { icon: MessageSquare, tint: '#D9F6F6', color: CYAN, title: 'Real-Time Chat', desc: 'Connect with other attendees before, during, and after events.' },
  { icon: Ticket, tint: '#FFE7DE', color: ORANGE, title: 'Secure Ticketing', desc: 'Purchase tickets and manage registrations effortlessly.' },
  { icon: Trophy, tint: '#D9F6F6', color: CYAN, title: 'Compete & Rank', desc: 'Track your standings and climb the community leaderboards.' },
];

const tech = [
  { icon: Atom, color: CYAN, title: 'React', desc: 'Powers a fast, responsive interface for browsing events.' },
  { icon: Server, color: '#5FA744', title: 'Node.js', desc: 'Handles the server logic and real-time connections.' },
  { icon: Database, color: '#3A6EA5', title: 'PostgreSQL', desc: 'Stores events, users, and community data reliably.' },
  { icon: Cog, color: ORANGE, title: 'Faktory job queue', desc: 'Runs background jobs for notifications and processing.' },
  { icon: Radio, color: '#8B5CF6', title: 'Real-time Chat', desc: 'WebSocket-driven messaging across every event.' },
];

const testimonials = [
  { quote: '“EventHub transformed how I find local gaming tournaments!”', author: 'A smiling gamer', from: '#FF7448', to: '#FFB07A' },
  { quote: '“Great way to discover pickup basketball games!”', author: 'An athlete', from: '#24D2D4', to: '#7FE6E7' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const go = () => navigate(isAuthenticated ? '/events' : '/register');

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", color: INK, background: '#FFFFFF', width: '100%', overflowX: 'hidden' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1180, margin: '0 auto', padding: '22px 32px', height: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 22 }}>
          EventHub <Target size={20} color={ORANGE} strokeWidth={2.5} style={{ marginBottom: -2 }} />
        </div>
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 30, fontSize: 15, fontWeight: 500 }}>
          <a href="#features" className="eh-navlink">Explore</a>
          <a href="#register" className="eh-navlink">Host an Event</a>
          <a href="#features" className="eh-navlink">Features</a>
          <a href="#tech" className="eh-navlink">Pricing</a>
          <button onClick={() => navigate('/login')} className="eh-signin"
            style={{ color: INK, padding: '9px 20px', border: '1px solid #dfe3ea', borderRadius: 8, background: '#f6f7f9', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="eh-reveal eh-hero-grid" style={{ maxWidth: 1180, margin: '0 auto', padding: '60px 32px 80px' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 58, lineHeight: 1.05, margin: '0 0 24px', letterSpacing: '-1px' }}>
            Find Your Next<br />Game-Changing<br />Event
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: MUTED, maxWidth: 460, margin: '0 0 32px' }}>
            Discover sports and esports events near you, connect in real-time, and join the excitement on EventHub. Built for passionate fans and competitive players.
          </p>
          <button onClick={go} className="eh-cta"
            style={{ color: '#fff', fontWeight: 600, fontSize: 17, padding: '16px 34px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
            Explore Events
          </button>
        </div>
        <div>
          <img
            src={heroImg}
            alt="Athletes and gamers celebrating together"
            style={{ width: '100%', height: 'auto', borderRadius: 20, display: 'block', boxShadow: '0 20px 45px rgba(22,33,62,0.12)' }}
          />
        </div>
      </section>

      {/* KEY FEATURES */}
      <section id="features" className="eh-reveal" style={{ maxWidth: 1040, margin: '0 auto', padding: '30px 32px 90px' }}>
        <h2 style={{ fontWeight: 700, fontSize: 34, textAlign: 'center', margin: '0 0 60px' }}>Key Features</h2>
        <div className="eh-feature-grid">
          {features.map((f) => (
            <div key={f.title} className="eh-feature" style={{ textAlign: 'center' }}>
              <div style={{ width: 76, height: 76, borderRadius: 20, background: f.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <f.icon size={34} color={f.color} strokeWidth={2} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 19, margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: MUTED, margin: '0 auto', maxWidth: 240 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BUILT WITH TECH */}
      <section id="tech" style={{ background: '#F7F8FA', padding: '70px 32px' }}>
        <div className="eh-reveal" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontWeight: 700, fontSize: 32, textAlign: 'center', margin: '0 0 50px' }}>Built with Tech</h2>
          <div className="eh-tech-grid">
            {tech.map((t) => (
              <div key={t.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fff', border: '1px solid #ECECEC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <t.icon size={24} color={t.color} strokeWidth={2} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 17, margin: '0 0 4px' }}>{t.title}</h4>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: MUTED, margin: 0 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="eh-reveal" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 32px' }}>
        <div className="eh-testi-grid">
          {testimonials.map((tt) => (
            <div key={tt.author} style={{ display: 'flex', gap: 20, alignItems: 'center', background: '#fff', border: '1px solid #ECECEC', borderRadius: 24, padding: 28, boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${tt.from}, ${tt.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={38} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.4, margin: '0 0 8px' }}>{tt.quote}</p>
                <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>{tt.author}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REGISTER */}
      <section id="register" style={{ background: '#F7F8FA', padding: '70px 32px' }}>
        <div className="eh-reveal" style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontWeight: 700, fontSize: 32, textAlign: 'center', margin: '0 0 40px' }}>Register with EventHub</h2>
          <form onSubmit={(e) => { e.preventDefault(); navigate('/register'); }}>
            <div className="eh-register-grid">
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Name</label>
                <input type="text" className="eh-input" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d3d8e0', borderRadius: 10, fontSize: 15, fontFamily: "'Poppins', sans-serif" }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Email</label>
                <input type="email" className="eh-input" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d3d8e0', borderRadius: 10, fontSize: 15, fontFamily: "'Poppins', sans-serif" }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Location</label>
                <select className="eh-input" style={{ width: '100%', padding: '12px 14px', border: '1px solid #d3d8e0', borderRadius: 10, fontSize: 15, fontFamily: "'Poppins', sans-serif", background: '#fff' }}>
                  <option>Select your city</option>
                  <option>New York</option>
                  <option>Los Angeles</option>
                  <option>Chicago</option>
                  <option>Austin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="eh-cta"
              style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 28, color: '#fff', fontWeight: 600, fontSize: 17, padding: 16, borderRadius: 999, border: 'none', cursor: 'pointer' }}>
              Get Started with EventHub
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: INK, color: '#c4cbda', padding: '50px 32px 30px' }}>
        <div className="eh-footer-grid" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 16 }}>Social Media</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <a href="#" className="eh-footlink">Twitter</a>
              <a href="#" className="eh-footlink">Instagram</a>
              <a href="#" className="eh-footlink">Facebook</a>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>Contact Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <a href="#" className="eh-footlink">About</a>
              <a href="#" className="eh-footlink">Careers</a>
              <a href="#" className="eh-footlink">Contact Us</a>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <span>eventhub@app.com</span>
              <span>EventHub HQ</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1000, margin: '36px auto 0', paddingTop: 20, borderTop: '1px solid #2f3f5e', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8a94aa' }}>
          <span>Get Started with EventHub</span>
          <span>Copyright 2026</span>
        </div>
      </footer>
    </div>
  );
}
