// app/sell/page.js
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function SellPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // State สำหรับการเลือกสินค้าปัจจุบัน
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)

  // State สำหรับตะกร้าสินค้า (Cart) รวมหลายรายการ
  const [cart, setCart] = useState([])

  useEffect(() => {
    fetchProducts()
  }, [])

  // ดึงรายการสินค้าทั้งหมด
  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      alert('เกิดข้อผิดพลาดในการดึงรายการสินค้า: ' + error.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  // คำนวณราคารวมของทั้งตะกร้า
  const grandTotal = cart.reduce((sum, item) => sum + item.total_price, 0)

  // ฟังก์ชันเพิ่มสินค้าเข้าตะกร้า
  const handleAddToCart = (e) => {
    e.preventDefault()

    if (!selectedProduct) {
      alert('กรุณาเลือกสินค้า')
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      alert('กรุณากรอกจำนวนที่ถูกต้อง')
      return
    }

    // คำนวณจำนวนที่เคยใส่ในตะกร้าไปแล้ว (ถ้ามี)
    const existingCartItem = cart.find((item) => item.product_id === selectedProduct.id)
    const currentInCartQty = existingCartItem ? existingCartItem.quantity : 0
    const totalRequestQty = currentInCartQty + qty

    // ตรวจสอบสต็อกคงเหลือ
    if (selectedProduct.stock < totalRequestQty) {
      alert(`สินค้าคงเหลือไม่พอ! (ในสต็อกมี ${selectedProduct.stock} ${selectedProduct.unit}, ในตะกร้ามีแล้ว ${currentInCartQty} ${selectedProduct.unit})`)
      return
    }

    if (existingCartItem) {
      // ถ้ามีสินค้านี้ในตะกร้าแล้ว ให้เพิ่มจำนวน
      setCart(
        cart.map((item) =>
          item.product_id === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                total_price: (item.quantity + qty) * Number(selectedProduct.price)
              }
            : item
        )
      )
    } else {
      // ถ้ายังไม่มี ให้เพิ่มเป็นรายการใหม่
      setCart([
        ...cart,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          price: Number(selectedProduct.price),
          unit: selectedProduct.unit,
          quantity: qty,
          total_price: qty * Number(selectedProduct.price)
        }
      ])
    }

    // รีเซ็ตฟอร์มเลือกสินค้า
    setSelectedProductId('')
    setQuantity(1)
  }

  // ลบสินค้าออกจากตะกร้า
  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId))
  }

  // ฟังก์ชันยืนยันการชำระเงิน / ขายสินค้าทั้งหมดในตะกร้า
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('ตะกร้าสินค้าว่างเปล่า')
      return
    }

    if (!confirm(`ยืนยันการชำระเงิน ยอดรวมทั้งสิ้น ${grandTotal.toLocaleString()} บาท?`)) return

    setSubmitting(true)

    try {
      const soldAt = new Date().toISOString()

      // 1. เตรียมข้อมูล insert ลงตาราง sales ทุกรายการในตะกร้า
      const salesData = cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        total_price: item.total_price,
        sold_at: soldAt
      }))

      const { error: salesError } = await supabase.from('sales').insert(salesData)
      if (salesError) throw salesError

      // 2. อัปเดตตัดสต็อกสินค้าในตาราง products ทีละรายการ
      for (const item of cart) {
        const prod = products.find((p) => p.id === item.product_id)
        if (prod) {
          const newStock = prod.stock - item.quantity
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id)

          if (updateError) throw updateError
        }
      }

      alert('บันทึกการขายเรียบร้อยแล้ว!')
      setCart([]) // ล้างตะกร้า
      await fetchProducts() // รีโหลดสต็อกล่าสุด

    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกการขาย: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* 1. ส่วนสรุปราคารวมด้านบนสุด (ตัวหนังสือขนาดใหญ่) */}
      <div
        className="card"
        style={{
          background: '#10b981',
          color: '#ffffff',
          textAlign: 'center',
          padding: '1.5rem',
          borderRadius: '12px'
        }}
      >
        <span style={{ fontSize: '1.2rem', opacity: 0.9 }}>ยอดชำระรวมทั้งหมด</span>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', margin: '0.2rem 0' }}>
          {grandTotal.toLocaleString()} <span style={{ fontSize: '1.8rem' }}>บาท</span>
        </h1>
        <span style={{ fontSize: '0.95rem', opacity: 0.85 }}>
          รายการในตะกร้า: {cart.length} รายการ
        </span>
      </div>

      {/* 2. ส่วนเนื้อหาหลักแบ่งเป็น 2 ฝั่ง (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* ฝั่งซ้าย: ฟอร์มเลือกและเพิ่มสินค้า */}
        <div className="card">
          <h2>เลือกสินค้าเข้าตะกร้า</h2>
          {loading ? (
            <p style={{ marginTop: '1rem' }}>กำลังโหลดรายการสินค้า...</p>
          ) : (
            <form onSubmit={handleAddToCart} style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold' }}>รายการสินค้า</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({Number(item.price).toLocaleString()} ฿) - เหลือ {item.stock} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <p><strong>รหัส SKU:</strong> {selectedProduct.sku}</p>
                  <p><strong>ราคาต่อหน่วย:</strong> {Number(selectedProduct.price).toLocaleString()} บาท</p>
                  <p><strong>สต็อกคงเหลือ:</strong> {selectedProduct.stock} {selectedProduct.unit}</p>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold' }}>จำนวน</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct ? selectedProduct.stock : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!selectedProductId}
                />
              </div>

              <button
                type="submit"
                disabled={!selectedProductId}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0066cc', fontSize: '1rem' }}
              >
                + เพิ่มเข้าตะกร้า
              </button>
            </form>
          )}
        </div>

        {/* ฝั่งขวา: ตารางรายการในตะกร้าสินค้า */}
        <div className="card">
          <h2>ตะกร้าสินค้าปัจจุบัน</h2>
          {cart.length === 0 ? (
            <p style={{ marginTop: '1.5rem', color: '#777', textAlign: 'center' }}>ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>รวม</th>
                    <th style={{ textAlign: 'center' }}>ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{item.total_price.toLocaleString()} ฿</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveFromCart(item.product_id)}
                          style={{ backgroundColor: '#dc3545', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={handleCheckout}
                disabled={submitting}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#28a745',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                {submitting ? 'กำลังบันทึก...' : `ยืนยันชำระเงิน (${grandTotal.toLocaleString()} บาท)`}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
