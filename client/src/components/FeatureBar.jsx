import { Armchair, QrCode, ShieldCheck, Ticket } from 'lucide-react';
const features = [
  { Icon: Ticket, title: 'Book Tickets Instantly', detail: 'Movies · Events · Sports' },
  { Icon: QrCode, title: 'QR Ticket Access', detail: 'Secure & paperless entry' },
  { Icon: ShieldCheck, title: 'Anti-Piracy Secured', detail: 'Smart theatre protection' },
  { Icon: Armchair, title: 'Smart Seat Access', detail: 'Digital access at your seat' },
];
export default function FeatureBar() {
  return <section className="feature-bar" id="features">{features.map(({ Icon, title, detail }) => <div className="feature-item" key={title}><Icon /><span><b>{title}</b><small>{detail}</small></span></div>)}</section>;
}
