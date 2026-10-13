// // import { Link, useNavigate } from 'react-router-dom';
// // import { useAuth } from '../context/AuthContext';

// // export default function Navbar() {
// //   const { user, logout } = useAuth();
// //   const nav = useNavigate();
// //   return (
// //     <header className="navbar">
// //       <Link to="/" className="brand">Traffic<span>Guard</span></Link>
// //       <nav>
// //         <Link to="/search">Pay challan</Link>
// //         <Link to="/receipts">Find receipt</Link>
// //         {user ? (
// //           <>
// //             <Link to="/dashboard">Dashboard</Link>
// //             <Link to="/change-password" className="small">Password</Link>
// //             <span className="pill">{user.role.replace('_', ' ')}</span>
// //             <button className="btn ghost" onClick={() => { logout(); nav('/'); }}>Logout</button>
// //           </>
// //         ) : (
// //           <>
// //             <Link to="/login">Login</Link>
// //             <Link to="/register" className="btn">Register</Link>
// //           </>
// //         )}
// //       </nav>
// //     </header>
// //   );
// // }

// import { Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { Brand } from './Sidebar';

// const TITLES = [['/dashboard', 'Dashboard'], ['/search', 'Check & pay challan'], ['/receipts', 'Find receipt'], ['/receipt/', 'Payment receipt'], ['/verify', 'Find receipt'],
//   ['/change-password', 'Account & password'], ['/login', 'Sign in'], ['/register', 'Create account']];
// const ROLE = { citizen: 'Citizen', officer: 'Officer', supervisor: 'Supervisor', finance: 'Finance', regional_admin: 'Regional admin', admin: 'Admin' };

// export default function Navbar({ onMenu }) {
//   const { user } = useAuth();
//   const { pathname } = useLocation();
//   const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] || 'Overview';

//   if (user) {
//     return (
//       <header className="header">
//         <button className="menu-btn" aria-label="Open menu" onClick={onMenu}><span /><span /><span /></button>
//         <h1 className="page-title">{title}</h1>
//         <div className="header-right">
//           <Link to="/search" className="btn ghost sm">Pay challan</Link>
//           <span className="pill">{ROLE[user.role]}</span>
//         </div>
//       </header>
//     );
//   }
//   return (
//     <header className="header guest">
//       <Link to="/" className="brand"><Brand /></Link>
//       <nav className="header-right">
//         <Link to="/search" className="nav-link">Pay challan</Link>
//         <Link to="/receipts" className="nav-link">Find receipt</Link>
//         <Link to="/login" className="nav-link">Login</Link>
//         <Link to="/register" className="btn sm">Register</Link>
//       </nav>
//     </header>
//   );
// }


import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Sidebar';

const TITLES = [
  ['/dashboard', 'Dashboard'], 
  ['/search', 'Check & pay challan'], 
  ['/receipts', 'Find receipt'], 
  ['/receipt/', 'Payment receipt'], 
  ['/verify', 'Find receipt'],
  ['/change-password', 'Account & password'], 
  ['/login', 'Sign in'], 
  ['/register', 'Create account']
];

const ROLE = { 
  citizen: 'Citizen', 
  officer: 'Officer', 
  supervisor: 'Supervisor', 
  finance: 'Finance', 
  regional_admin: 'Regional admin', 
  admin: 'Admin' 
};

export default function Navbar({ onMenu }) {
  // 1. Added logout destructuring
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  // 2. Added useNavigate for logout redirection
  const nav = useNavigate(); 
  
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] || 'Overview';

  if (user) {
    return (
      <header className="header">
        <button className="menu-btn" aria-label="Open menu" onClick={onMenu}>
          <span /><span /><span />
        </button>
        <h1 className="page-title">{title}</h1>
        <div className="header-right">
          {/* 3. Added missing links for Dashboard, Search Challan, and Receipts */}
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/search" className="nav-link">Search challan</Link>
          <Link to="/receipts" className="nav-link">Find receipt</Link>
          
          <span className="pill">{ROLE[user.role] || user.role}</span>
          
          {/* 4. Added Logout button with functionality */}
          <button 
            className="btn ghost sm" 
            onClick={() => { 
              logout(); 
              nav('/'); 
            }}
          >
            Logout
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="header guest">
      <Link to="/" className="brand"><Brand /></Link>
      <nav className="header-right">
        <Link to="/search" className="nav-link">Pay challan</Link>
        <Link to="/receipts" className="nav-link">Find receipt</Link>
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/register" className="btn sm">Register</Link>
      </nav>
    </header>
  );
}