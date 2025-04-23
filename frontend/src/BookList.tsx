import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Add CartContext
interface CartItem extends Book {
  quantity: number;
}

export const CartContext = React.createContext<{
  cart: CartItem[];
  addToCart: (book: Book) => void;
  updateQuantity: (bookId: number, quantity: number) => void;
  getCartTotal: () => number;
}>({
  cart: [],
  addToCart: () => {},
  updateQuantity: () => {},
  getCartTotal: () => 0,
});

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    width: '100vw',
    margin: 0,
    padding: 0,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  mainContainer: {
    width: '100%',
    margin: 0,
    backgroundColor: '#fff',
    borderRadius: 0,
    boxShadow: 'none',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '1rem',
  },
  controlsContainer: {
    backgroundColor: '#f8f9fa',
    padding: '0.75rem',
    border: '1px solid #dee2e6',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    width: '100%',
  },
  controlsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2rem',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    marginRight: '0.5rem',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    minWidth: 'max-content',
  },
  tableContainer: {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    border: '1px solid #dee2e6',
  },
  table: {
    width: '100%',
    margin: 0,
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  headerCell: {
    backgroundColor: '#212529',
    color: '#fff',
    padding: '0.75rem 1rem',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  cell: {
    padding: '0.75rem 1rem',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#fff',
    height: '57px', // Fixed height for rows
    verticalAlign: 'middle',
  },
  footer: {
    marginTop: '1.5rem',
    padding: '1rem 0',
    borderTop: '1px solid #dee2e6',
  },
  cartSummary: {
    position: 'fixed' as const,
    top: '1rem',
    right: '1rem',
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: '0.375rem',
    boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
    zIndex: 1000,
    minWidth: '250px',
  },
  addToCartButton: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    borderRadius: '0.2rem',
  }
} as const;

interface Book {
  bookID: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  classification: string;
  category: string;
  pageCount: number;
  price: number;
}

interface BookResponse {
  data: Book[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (book: Book) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.bookID === book.bookID);
      if (existingItem) {
        return currentCart.map(item =>
          item.bookID === book.bookID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...book, quantity: 1 }];
    });
  };

  const updateQuantity = (bookId: number, quantity: number) => {
    setCart(currentCart =>
      currentCart.map(item =>
        item.bookID === bookId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, getCartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

const CartSummary = () => {
  const { cart, getCartTotal } = React.useContext(CartContext);
  const [isExpanded, setIsExpanded] = useState(false);

  if (cart.length === 0) return null;

  return (
    <div style={styles.cartSummary} className="border">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Cart Summary</h5>
        <button 
          className="btn btn-link p-0" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      {isExpanded && (
        <>
          {cart.map(item => (
            <div key={item.bookID} className="d-flex justify-content-between mb-1">
              <small>{item.title} (x{item.quantity})</small>
              <small>${(item.price * item.quantity).toFixed(2)}</small>
            </div>
          ))}
          <hr className="my-2" />
        </>
      )}
      <div className="d-flex justify-content-between">
        <strong>Total:</strong>
        <strong>${getCartTotal().toFixed(2)}</strong>
      </div>
      <Link to="/cart" className="btn btn-primary w-100 mt-2">
        View Cart
      </Link>
    </div>
  );
};

const BookList = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { addToCart } = React.useContext(CartContext);

  // Fetch categories
  useEffect(() => {
    fetch('/api/Books/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const categoryParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : '';
    fetch(`/api/Books?pageNumber=${page}&pageSize=${pageSize}&sortField=${sortField}&sortOrder=${sortOrder}${categoryParam}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch books');
        }
        return res.json();
      })
      .then((data: BookResponse) => {
        setBooks(data.data);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [page, pageSize, sortField, sortOrder, selectedCategory]);

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.mainContainer}>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.mainContainer}>
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.mainContainer}>
        <div style={styles.header}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="h3 mb-0">Book List</h1>
            <Link to="/adminbooks" className="btn btn-outline-primary btn-sm">
              Manage Books
            </Link>
          </div>
        </div>
        
        <div style={styles.controlsContainer}>
          <div style={styles.controlsWrapper}>
            <div style={styles.controlGroup}>
              <label style={styles.label}>Category:</label>
              <select 
                className="form-select form-select-sm"
                style={{ width: '160px' }}
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Page Size:</label>
              <select 
                className="form-select form-select-sm" 
                style={{ width: '80px' }}
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.controlGroup}>
              <label style={styles.label}>Sort By:</label>
              <select 
                className="form-select form-select-sm"
                style={{ width: '140px' }}
                value={sortField} 
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="publisher">Publisher</option>
                <option value="isbn">ISBN</option>
                <option value="classification">Classification</option>
                <option value="category">Category</option>
                <option value="pagecount">Page Count</option>
                <option value="price">Price</option>
              </select>
            </div>
            
            <div style={styles.controlGroup}>
              <label style={styles.label}>Order:</label>
              <select 
                className="form-select form-select-sm"
                style={{ width: '120px' }}
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table} className="table table-hover">
              <thead>
                <tr>
                  <th style={{...styles.headerCell, width: '18%'}}>Title</th>
                  <th style={{...styles.headerCell, width: '13%'}}>Author</th>
                  <th style={{...styles.headerCell, width: '13%'}}>Publisher</th>
                  <th style={{...styles.headerCell, width: '13%'}}>ISBN</th>
                  <th style={{...styles.headerCell, width: '11%'}}>Classification</th>
                  <th style={{...styles.headerCell, width: '11%'}}>Category</th>
                  <th style={{...styles.headerCell, width: '5%', textAlign: 'right'}}>Pages</th>
                  <th style={{...styles.headerCell, width: '8%', textAlign: 'right'}}>Price</th>
                  <th style={{...styles.headerCell, width: '8%'}}></th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.bookID}>
                    <td style={styles.cell}>{book.title}</td>
                    <td style={styles.cell}>{book.author}</td>
                    <td style={styles.cell}>{book.publisher}</td>
                    <td style={styles.cell}>{book.isbn}</td>
                    <td style={styles.cell}>{book.classification}</td>
                    <td style={styles.cell}>{book.category}</td>
                    <td style={{...styles.cell, textAlign: 'right'}}>{book.pageCount}</td>
                    <td style={{...styles.cell, textAlign: 'right'}}>${book.price.toFixed(2)}</td>
                    <td style={styles.cell}>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        style={styles.addToCartButton}
                        onClick={() => addToCart(book)}
                      >
                        Add to Cart
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Add empty rows to maintain height when less data */}
                {books.length < pageSize && Array(pageSize - books.length).fill(0).map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                    <td style={styles.cell}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.footer}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="small text-muted">
              Showing {books.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} books
            </div>
            
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <li 
                    key={pageNum} 
                    className={`page-item ${page === pageNum ? 'active' : ''}`}
                  >
                    <button 
                      className="page-link" 
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <CartSummary />
      </div>
    </div>
  );
};

export default BookList;