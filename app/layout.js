import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Mini POS',
  description: 'ระบบขายหน้าร้านขนาดเล็ก',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="navbar">
          <div className="nav-container">
            <h1 className="logo">Mini POS</h1>
            <nav className="nav-links">
              <Link href="/">จัดการสินค้า</Link>
              <Link href="/sell">บันทึกการขาย</Link>
              <Link href="/history">ประวัติการขาย</Link>
            </nav>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
