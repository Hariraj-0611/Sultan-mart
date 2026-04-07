import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api/client'
import { addItem, setQty, removeItem, selectCartItems, selectCartTotal } from '../store/cartSlice'
import { Search, SlidersHorizontal, ShoppingCart, Star, X, Plus, Minus, ArrowRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

function ProductCard({ product }) {
  const dispatch = useDispatch()
  const discount = product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price)
    ? Math.round((1 - parseFloat(product.selling_price) / parseFloat(product.mrp)) * 100) : 0

  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #dce6ef', overflow:'hidden', transition:'all .18s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.09)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' }}>
      <Link to={`/store/product/${product.id}`} style={{ textDecoration:'none', display:'block', position:'relative' }}>
        {discount > 0 && (
          <div style={{ position:'absolute', top:10, left:10, background:'#e67e22', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>
            -{discount}%
          </div>
        )}
        <div style={{ height:150, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {product.image ? <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontSize:40 }}>📦</span>}
        </div>
        <div style={{ padding:'12px 14px 6px' }}>
          <p style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>{product.category_name}</p>
          <p style={{ fontSize:13, fontWeight:600, color:'#1c2833', lineHeight:1.4, marginBottom:4 }}>{product.name}</p>
          <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:6 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={10} fill="#f59e0b" color="#f59e0b" />)}
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize:15, fontWeight:800, color:'#1a3c5e' }}>₹{product.selling_price}</span>
            {discount > 0 && <span style={{ fontSize:11, color:'#94a3b8', textDecoration:'line-through' }}>₹{product.mrp}</span>}
          </div>
        </div>
      </Link>
      <div style={{ padding:'8px 14px 14px' }}>
        <button onClick={() => { dispatch(addItem(product)); toast.success('Added to cart') }}
          style={{ width:'100%', padding:'8px', borderRadius:8, border:'none', background:'#1a3c5e', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <ShoppingCart size={12} /> Add to Cart
        </button>
      </div>
    </div>
  )
}

export default function StoreShop() {
  const dispatch    = useDispatch()
  const cartItems   = useSelector(selectCartItems)
  const cartTotal   = useSelector(selectCartTotal)
  const cartCount   = cartItems.reduce((s, i) => s + i.qty, 0)
  const delivery    = cartTotal >= 500 ? 0 : 40
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const PAGE_SIZE = 12

  const search   = searchParams.get('search') || ''
  const catName  = searchParams.get('cat')    || ''
  const catId    = searchParams.get('category') || ''
  const sort     = searchParams.get('sort')   || ''
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''

  useEffect(() => {
    api.get('/inventory/categories/flat/').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE }
    if (search)  params.search   = search
    if (catId)   params.category = catId
    if (catName && !catId) {
      const found = categories.find(c => c.name === catName)
      if (found) params.category = found.id
    }

    api.get('/ecommerce/catalog/', { params })
      .then(r => {
        let data = r.data.results || r.data
        if (sort === 'price_asc')  data = [...data].sort((a,b) => parseFloat(a.selling_price) - parseFloat(b.selling_price))
        if (sort === 'price_desc') data = [...data].sort((a,b) => parseFloat(b.selling_price) - parseFloat(a.selling_price))
        // Client-side price filter
        if (minPrice) data = data.filter(p => parseFloat(p.selling_price) >= parseFloat(minPrice))
        if (maxPrice) data = data.filter(p => parseFloat(p.selling_price) <= parseFloat(maxPrice))
        setProducts(data)
        setTotal(r.data.count || data.length)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, catName, catId, sort, minPrice, maxPrice, page, categories])

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    p.delete('page')
    setPage(1)
    setSearchParams(p)
  }

  const clearFilters = () => { setSearchParams({}); setPage(1) }
  const hasFilters = search || catName || catId || sort || minPrice || maxPrice

  return (
    <div style={{ maxWidth:1400, margin:'0 auto', padding:'24px', display:'flex', gap:24 }}>

      {/* ── Sidebar Filters ── */}
      <aside style={{ width:210, flexShrink:0 }}>
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #dce6ef', overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #eef2f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:14, color:'#1c2833', display:'flex', alignItems:'center', gap:6 }}>
              <SlidersHorizontal size={14} /> Filters
            </span>
            {hasFilters && (
              <button onClick={clearFilters} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#e67e22', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #eef2f6' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Search</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, border:'1.5px solid #dce6ef', borderRadius:8, padding:'7px 10px' }}>
              <Search size={13} color="#94a3b8" />
              <input style={{ flex:1, border:'none', outline:'none', fontSize:12, color:'#1c2833' }}
                placeholder="Product name..."
                value={search}
                onChange={e => setParam('search', e.target.value)} />
            </div>
          </div>

          {/* Price Range */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #eef2f6' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Price Range (₹)</p>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input type="number" placeholder="Min" value={minPrice} onChange={e => setParam('min_price', e.target.value)}
                style={{ width:'100%', padding:'6px 8px', border:'1.5px solid #dce6ef', borderRadius:7, fontSize:12, outline:'none' }} />
              <span style={{ color:'#94a3b8', fontSize:12 }}>–</span>
              <input type="number" placeholder="Max" value={maxPrice} onChange={e => setParam('max_price', e.target.value)}
                style={{ width:'100%', padding:'6px 8px', border:'1.5px solid #dce6ef', borderRadius:7, fontSize:12, outline:'none' }} />
            </div>
          </div>

          {/* Categories */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #eef2f6' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Category</p>
            {[{ id:'', name:'All' }, ...categories].map(c => (
              <button key={c.id} onClick={() => { setParam('category', c.id); setParam('cat', '') }}
                style={{ display:'block', width:'100%', textAlign:'left', padding:'6px 10px', borderRadius:7, fontSize:12, fontWeight: catId==c.id ? 700 : 400,
                  background: catId==c.id ? '#e8f0f7' : 'none', color: catId==c.id ? '#1a3c5e' : '#475569',
                  border:'none', cursor:'pointer', marginBottom:2 }}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Sort By</p>
            {[['','Default'],['price_asc','Price: Low to High'],['price_desc','Price: High to Low']].map(([val, label]) => (
              <button key={val} onClick={() => setParam('sort', val)}
                style={{ display:'block', width:'100%', textAlign:'left', padding:'6px 10px', borderRadius:7, fontSize:12, fontWeight: sort===val ? 700 : 400,
                  background: sort===val ? '#e8f0f7' : 'none', color: sort===val ? '#1a3c5e' : '#475569',
                  border:'none', cursor:'pointer', marginBottom:2 }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Products ── */}
      <div style={{ flex:1 }}>
        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'#64748b' }}>
            {loading ? 'Loading...' : <><strong style={{ color:'#1c2833' }}>{total}</strong> products found</>}
            {(catName || catId) && <span style={{ color:'#e67e22', marginLeft:6 }}>in {catName || 'selected category'}</span>}
          </p>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background:'#fff', borderRadius:12, height:280, border:'1px solid #dce6ef', animation:'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:12, border:'1px solid #dce6ef' }}>
            <span style={{ fontSize:48 }}>🔍</span>
            <p style={{ fontSize:16, fontWeight:600, color:'#475569', marginTop:12 }}>No products found</p>
            <p style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>Try adjusting your filters</p>
            <button onClick={clearFilters} style={{ marginTop:16, padding:'8px 20px', borderRadius:8, border:'none', background:'#1a3c5e', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:28 }}>
                {[...Array(Math.ceil(total / PAGE_SIZE))].map((_, i) => (
                  <button key={i} onClick={() => setPage(i+1)}
                    style={{ width:36, height:36, borderRadius:8, border:'1.5px solid', fontSize:13, fontWeight:600, cursor:'pointer',
                      borderColor: page===i+1 ? '#1a3c5e' : '#dce6ef',
                      background:  page===i+1 ? '#1a3c5e' : '#fff',
                      color:       page===i+1 ? '#fff'    : '#475569' }}>
                    {i+1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Sticky Cart Panel ── */}
      <aside style={{ width:280, flexShrink:0 }}>
        <div style={{ position:'sticky', top:90, background:'#fff', borderRadius:14, border:'1px solid #dce6ef', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>

          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ShoppingCart size={16} color="#fff" />
              <span style={{ fontWeight:800, fontSize:14, color:'#fff' }}>My Cart</span>
            </div>
            {cartCount > 0 && (
              <span style={{ background:'#f59e0b', color:'#fff', borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:800 }}>
                {cartCount} item{cartCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Items */}
          <div style={{ maxHeight:380, overflowY:'auto', padding:'8px 0' }}>
            {cartItems.length === 0 ? (
              <div style={{ padding:'32px 16px', textAlign:'center', color:'#94a3b8' }}>
                <ShoppingCart size={32} style={{ margin:'0 auto 10px', display:'block', opacity:.25 }} />
                <p style={{ fontSize:13 }}>Your cart is empty</p>
                <p style={{ fontSize:11, marginTop:4 }}>Add products to see them here</p>
              </div>
            ) : cartItems.map(item => (
              <div key={item.product.id} style={{ display:'flex', gap:10, padding:'10px 14px', borderBottom:'1px solid #f8fafc', alignItems:'center' }}>
                <div style={{ width:44, height:44, borderRadius:8, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  {item.product.image
                    ? <img src={item.product.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize:20 }}>📦</span>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'#1c2833', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.product.name}</p>
                  <p style={{ fontSize:12, color:'#1a3c5e', fontWeight:700 }}>₹{(parseFloat(item.product.selling_price) * item.qty).toFixed(2)}</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                  <button onClick={() => dispatch(setQty({ id: item.product.id, qty: item.qty - 1 }))}
                    style={{ width:22, height:22, borderRadius:6, border:'1.5px solid #dce6ef', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Minus size={10} color="#475569" />
                  </button>
                  <span style={{ fontSize:12, fontWeight:700, minWidth:18, textAlign:'center' }}>{item.qty}</span>
                  <button onClick={() => dispatch(setQty({ id: item.product.id, qty: item.qty + 1 }))}
                    style={{ width:22, height:22, borderRadius:6, border:'1.5px solid #dce6ef', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Plus size={10} color="#475569" />
                  </button>
                  <button onClick={() => dispatch(removeItem(item.product.id))}
                    style={{ width:22, height:22, borderRadius:6, border:'1.5px solid #fecaca', background:'#fef2f2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:2 }}>
                    <X size={10} color="#dc2626" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div style={{ padding:'12px 14px', borderTop:'1px solid #f1f5f9', background:'#f8fafc' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:4 }}>
                <span>Delivery</span>
                <span style={{ fontWeight:600, color: delivery===0?'#16a34a':'#1c2833' }}>{delivery===0?'FREE':'₹'+delivery}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:800, color:'#1c2833', marginBottom:12 }}>
                <span>Total</span>
                <span style={{ color:'#e67e22' }}>₹{(cartTotal + delivery).toFixed(2)}</span>
              </div>
              <Link to="/store/cart"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px', borderRadius:10, background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', color:'#fff', textDecoration:'none', fontWeight:700, fontSize:13, boxShadow:'0 3px 10px rgba(26,60,94,.25)' }}>
                Checkout <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}
