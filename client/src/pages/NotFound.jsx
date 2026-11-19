import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
export default function NotFound() {
  return <div className="app-shell"><Navbar /><main className="details-page"><p className="section-overline">404 · PAGE NOT FOUND</p><h1>This screen is not available.</h1><Link className="button button-gold" to="/">Return to CineLockz</Link></main><Footer /></div>;
}
