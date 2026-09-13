// app/sell/page.js
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function SellPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // State สำหรับฟอร์มขายสินค้า
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)

  // ดึงรายการสินค้าทั้งหมดเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    fetchProducts()
  }, [])

  // ฟังก์ชันดึงรายการสินค้าจาก Supabase
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

  // ค้นหาข้อมูลสินค้าที่ถูกเลือกอยู่ในปัจจุบัน
  const selectedProduct = products.find((p) => p.id === selectedProductId)

  // คำนวณยอดรวมอัตโนมัติ (ราคา x จำนวน)
  const totalPrice = selectedProduct ? Number(selectedProduct.price) * Number(quantity || 0) : 0

  // ฟังก์ชันดำเนินการขายสินค้า
  const handleSell = async (e) => {
    e.preventDefault()

    if (!selectedProduct) {
      alert('กรุณาเลือกสินค้าที่ต้องการขาย')
      return
    }

    const sellQty = parseInt(quantity)
    if (isNaN(sellQty) || sellQty <= 0) {
      alert('กรุณากรอกจำนวนที่ต้องการขายให้ถูกต้อง')
      return
    }

    // 1. ตรวจสอบสต็อกคงเหลือ
    if (selectedProduct.stock < sellQty) {
      alert(`สินค้าคงเหลือไม่พอ (มีคงเหลือเพียง ${selectedProduct.stock} ${selectedProduct.unit})`)
      return
    }

    setSubmitting(true)

    try {
      // 2. บันทึกรายการลงตาราง sales
      const { error: salesError } = await supabase
        .from('sales')
        .insert([
          {
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: sellQty,
            total_price: totalPrice,
            sold_at: new Date().toISOString()
          }
        ])

      if (salesError) throw salesError

      // 3. ตัดสต็อกสินค้าในตาราง products
      const newStock = selectedProduct.stock - sellQty
      const { error: productError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedProduct.id)

      if (productError) throw productError

      // 4. แสดงข้อความสำเร็จและรีเซ็ตฟอร์ม
      alert('บันทึกการขายสำเร็จ!')
      setSelectedProductId('')
      setQuantity(1)
      
      // ดึงข้อมูลสินค้าใหม่เพื่ออัปเดตสต็อกล่าสุด
      await fetchProducts()

    } catch (error) {
      alert('เกิดข้อผิดพลาดในการทำรายการ: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h2>บันทึกการขายสินค้า (Sell)</h2>

      {loading ? (
        <p style={{ marginTop: '1rem' }}>กำลังโหลดรายการสินค้า...</p>
      ) : (
        <form onSubmit={handleSell} style={{ marginTop: '1rem', maxWidth: '500px' }}>
          {/* Dropdown เลือกสินค้า */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 'bold' }}>เลือกสินค้า</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={submitting}
            >
              <option value="">-- กรุณาเลือกสินค้า --</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {Number(item.price).toLocaleString()} บาท (คงเหลือ: {item.stock} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* แสดงรายละเอียดสินค้าที่เลือก */}
          {selectedProduct && (
            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <p><strong>SKU:</strong> {selectedProduct.sku}</p>
              <p><strong>ราคาต่อหน่วย:</strong> {Number(selectedProduct.price).toLocaleString()} บาท</p>
              <p><strong>คงเหลือในสต็อก:</strong> {selectedProduct.stock} {selectedProduct.unit}</p>
            </div>
          )}

          {/* ช่องกรอกจำนวน */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 'bold' }}>จำนวนที่ขาย</label>
            <input
              type="number"
              min="1"
              max={selectedProduct ? selectedProduct.stock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!selectedProductId || submitting}
            />
          </div>

          {/* แสดงราคารวมคำนวณอัตโนมัติ */}
          <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#e6f0fa', borderRadius: '4px' }}>
            <h3 style={{ color: '#0066cc', display: 'flex', justifyContent: 'space-between' }}>
              <span>ราคารวมทั้งหมด:</span>
              <span>{totalPrice.toLocaleString()} บาท</span>
            </h3>
          </div>

          {/* ปุ่มยืนยันการขาย */}
          <button
            type="submit"
            disabled={!selectedProductId || submitting}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', backgroundColor: '#28a745' }}
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกการขาย'}
          </button>
        </form>
      )}
    </div>
  )
}
