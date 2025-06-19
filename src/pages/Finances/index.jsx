// Finances/index.jsx
import { Link } from 'react-router-dom';

export default function Finances() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Finances Dashboard</h1>
      <div className="space-x-4">
        <Link to="/finances/add" className="btn">Add Finance</Link>
        <Link to="/finances/view" className="btn">View Finances</Link>
      </div>
    </div>
  );
}
