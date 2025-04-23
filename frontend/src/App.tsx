import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BookList, { CartProvider } from './BookList';
import Cart from './Cart';
import AdminBooks from './AdminBooks';

const App = () => {
  return (
    <Router>
      <CartProvider>
        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/adminbooks" element={<AdminBooks />} />
        </Routes>
      </CartProvider>
    </Router>
  );
};

export default App;
