// app/page.js
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

  // State สำหรับฟอร์มเพิ่มสินค้าใหม่
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: 'กล่อง'
  })

  // State สำหรับเก็บข้อมูลระหว่างแก้ไขสินค้า
  const [editFormData, setEditFormData] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: ''
  })

  // ดึงรายการสินค้าเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    fetchProducts()
  }, [])

  // ฟังก์ชันดึงข้อมูลสินค้าทั้งหมดจาก Supabase
  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  // ฟังก์ชันเพิ่มสินค้าใหม่
  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!formData.sku || !formData.name || !formData.price || !formData.stock || !formData.unit) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }

    const { error } = await supabase
      .from('products')
      .insert([
        {
          sku: formData.sku,
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          unit: formData.unit
        }
      ])

    if (error) {
      alert('ไม่สามารถเพิ่มสินค้าได้: ' + error.message)
    } else {
      // ล้างฟอร์มและรีโหลดข้อมูล
      setFormData({ sku: '', name: '', price: '', stock: '', unit: 'กล่อง' })
      fetchProducts()
    }
  }

  // เริ่มต้นการแก้ไขสินค้าแบบ Inline
  const handleStartEdit = (product) => {
    setEditingId(product.id)
    setEditFormData({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit
    })
  }

  // บันทึกข้อมูลสินค้าที่แก้ไข
  const handleSaveEdit = async (id) => {
    const { error } = await supabase
      .from('products')
      .update({
        sku: editFormData.sku,
        name: editFormData.name,
        price: parseFloat(editFormData.price),
        stock: parseInt(editFormData.stock),
        unit: editFormData.unit
      })
      .eq('id', id)

    if (error) {
      alert('ไม่สามารถแก้ไขข้อมูลได้: ' + error.message)
    } else {
      setEditingId(null)
      fetchProducts()
    }
  }

  // ฟังก์ชันลบสินค้า
  const handleDeleteProduct = async (id, productName) => {
    if (!confirm(`คุณต้องการลบสินค้า "${productName}" ใช่หรือไม่?`)) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      alert('ไม่สามารถลบสินค้าได้: ' + error.message)
    } else {
      fetchProducts()
    }
  }

  return (
    <div>
      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleAddProduct} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label>SKU</label>
              <input
                type="text"
                placeholder="เช่น TEA-SLP-SM"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div>
              <label>ชื่อสินค้า</label>
              <input
                type="text"
                placeholder="ชื่อสินค้า"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label>ราคา</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label>จำนวนคงเหลือ</label>
              <input
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
            <div>
              <label>หน่วยนับ</label>
              <input
                type="text"
                placeholder="กล่อง, ชิ้น ฯลฯ"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" style={{ marginTop: '0.5rem' }}>+ เพิ่มสินค้า</button>
        </form>
      </div>

      {/* ตารางแสดงรายการสินค้า */}
      <div className="card">
        <h2>รายการสินค้าทั้งหมด</h2>
        {loading ? (
          <p style={{ marginTop: '1rem' }}>กำลังโหลดข้อมูล...</p>
        ) : products.length === 0 ? (
          <p style={{ marginTop: '1rem' }}>ยังไม่มีรายการสินค้า</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>ชื่อสินค้า</th>
                <th>ราคา</th>
                <th>คงเหลือ</th>
                <th>หน่วย</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  {editingId === item.id ? (
                    // แถวแสดงผลตอนแก้ไข (Inline Edit)
                    <>
                      <td>
                        <input
                          type="text"
                          value={editFormData.sku}
                          onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.price}
                          onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editFormData.stock}
                          onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editFormData.unit}
                          onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                        />
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          style={{ backgroundColor: '#28a745', marginRight: '0.5rem' }}
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ backgroundColor: '#6c757d' }}
                        >
                          ยกเลิก
                        </button>
                      </td>
                    </>
                  ) : (
                    // แถวแสดงผลปกติ
                    <>
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td>{Number(item.price).toLocaleString()} บาท</td>
                      <td>{item.stock}</td>
                      <td>{item.unit}</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleStartEdit(item)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id, item.name)}
                          style={{ backgroundColor: '#dc3545' }}
                        >
                          ลบ
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
