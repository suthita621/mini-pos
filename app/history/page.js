// app/history/page.js
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function HistoryPage() {
  const [salesHistory, setSalesHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // ดึงข้อมูลประวัติการขายเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetchSalesHistory()
  }, [])

  // ฟังก์ชันดึงรายการขายจาก Supabase เรียงจากล่าสุดไปเก่าสุด
  const fetchSalesHistory = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false })

    if (error) {
      alert('เกิดข้อผิดพลาดในการดึงประวัติการขาย: ' + error.message)
    } else {
      setSalesHistory(data || [])
    }
    setLoading(false)
  }

  // คำนวณยอดขายรวมทั้งหมด (Sum of total_price)
  const grandTotal = salesHistory.reduce((sum, item) => sum + Number(item.total_price || 0), 0)

  // ฟังก์ชันแปลงรูปแบบวันเวลาให้อ่านง่าย
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      {/* สรุปยอดขายรวมทั้งหมด */}
      <div className="card" style={{ background: '#e6f0fa', borderLeft: '5px solid #0066cc' }}>
        <h3 style={{ color: '#0052a3' }}>ยอดขายรวมทั้งหมด</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0066cc', marginTop: '0.5rem' }}>
          {grandTotal.toLocaleString()} บาท
        </p>
      </div>

      {/* ตารางแสดงประวัติการขาย */}
      <div className="card">
        <h2>ประวัติการขาย (Sales History)</h2>

        {loading ? (
          <p style={{ marginTop: '1rem' }}>กำลังโหลดข้อมูล...</p>
        ) : salesHistory.length === 0 ? (
          <p style={{ marginTop: '1rem' }}>ยังไม่มีรายการขายในระบบ</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>วันเวลาที่ขาย</th>
                <th>ชื่อสินค้า</th>
                <th>จำนวน</th>
                <th>ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.sold_at)}</td>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.total_price).toLocaleString()} บาท</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
