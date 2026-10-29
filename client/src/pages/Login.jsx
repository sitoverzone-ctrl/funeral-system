import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, KeyOutlined, BankOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [orgData, setOrgData] = useState({
    name: 'สมาคมฌาปนกิจสงเคราะห์ การเกษตรเซกา',
    logo: ''
  })

  // โหลดข้อมูลชื่อสมาคมและโลโก้ที่บันทึกไว้จากหน้าข้อมูลหน่วยงาน
  useEffect(() => {
    const savedOrg = localStorage.getItem('funeral_organization_info')
    if (savedOrg) {
      try {
        const parsed = JSON.parse(savedOrg)
        setOrgData({
          name: parsed.name || 'สมาคมฌาปนกิจสงเคราะห์ การเกษตรเซกา',
          logo: parsed.logo || ''
        })
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const handleFinish = (values) => {
    setLoading(true)
    setTimeout(() => {
      // ดึงข้อมูลพนักงานจาก localStorage ถ้ายังไม่มีให้สร้างบัญชีเริ่มต้น Dev ให้อัตโนมัติทันที
      let savedStaff = JSON.parse(localStorage.getItem('funeral_staff_users'))
      const defaultDev = { 
        key: '1', 
        code: 'Dev', 
        password: '258025', 
        name: 'นักพัฒนาสูงสุด', 
        role: 'dev', 
        status: 'ใช้งาน', 
        duration: 'ไม่มีวันหมดอายุ', 
        expiryDate: 'ไม่มีวันหมดอายุ' 
      }

      if (!savedStaff || !Array.isArray(savedStaff) || savedStaff.length === 0) {
        savedStaff = [defaultDev]
        localStorage.setItem('funeral_staff_users', JSON.stringify(savedStaff))
      } else if (!savedStaff.some(s => s.code.toUpperCase() === 'DEV')) {
        savedStaff.push(defaultDev)
        localStorage.setItem('funeral_staff_users', JSON.stringify(savedStaff))
      }

      const inputCode = values.code.trim().toUpperCase()
      const inputPassword = values.password ? values.password.trim() : ''
      const found = savedStaff.find(s => s.code.toUpperCase() === inputCode)

      if (found) {
        if (found.password && found.password !== inputPassword) {
          message.error('❌ รหัสผ่านไม่ถูกต้อง')
          setLoading(false)
          return
        }

        if (found.status === 'ระงับการใช้งาน') {
          message.error('❌ รหัสผู้ใช้นี้ถูกระงับการใช้งานแล้ว')
          setLoading(false)
          return
        }

        if (found.expiryDate && found.expiryDate !== 'ไม่มีวันหมดอายุ') {
          const isExpired = dayjs().isAfter(dayjs(found.expiryDate), 'day')
          if (isExpired) {
            message.error('❌ รหัสผู้ใช้นี้หมดอายุแล้ว กรุณาติดต่อผู้จัดการหรือ Dev เพื่อต่ออายุ')
            setLoading(false)
            return
          }
        }

        const roleName = found.role === 'staff' ? 'เจ้าหน้าที่' : found.role === 'manager' ? 'ผู้จัดการ' : 'Dev'
        message.success(`ยินดีต้อนรับคุณ ${found.name} (${roleName})`)
        onLogin(found)
      } else {
        message.error('❌ ไม่พบรหัสผู้ใช้นี้ในระบบ')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* แสดงโลโก้ที่อัปโหลดจากหน้าข้อมูลหน่วยงาน (หากมี) หรือแสดงไอคอนสำรอง */}
          {orgData.logo ? (
            <img 
              src={orgData.logo} 
              alt="Org Logo" 
              style={{ 
                width: 90, 
                height: 90, 
                objectFit: 'contain', 
                margin: '0 auto 12px auto',
                borderRadius: '50%',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                background: '#fff',
                padding: 4
              }} 
            />
          ) : (
            <div style={{ width: 90, height: 90, margin: '0 auto 12px auto', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BankOutlined style={{ fontSize: 40, color: '#1e3a8a' }} />
            </div>
          )}

          <Title level={4} style={{ color: '#1e3a8a', margin: '0 0 4px 0' }}>เข้าสู่ระบบ</Title>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', paddingInline: 12 }}>{orgData.name}</Text>
        </div>

        <Form layout="vertical" onFinish={handleFinish} initialValues={{ code: '', password: '' }}>
          <Form.Item label={<Text strong>รหัสผู้ใช้ (Staff ID)</Text>} name="code" rules={[{ required: true, message: 'กรุณากรอกรหัสผู้ใช้' }]}>
            <Input prefix={<UserOutlined style={{ color: '#1e3a8a' }} />} placeholder="รหัสผู้ใช้" size="large" />
          </Form.Item>
          <Form.Item label={<Text strong>รหัสผ่าน (Password)</Text>} name="password" rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}>
            <Input.Password prefix={<KeyOutlined style={{ color: '#1e3a8a' }} />} placeholder="รหัสผ่าน" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block style={{ background: '#1f3a8a', fontWeight: 'bold' }}>
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            กรุณากรอกรหัสเจ้าหน้าที่
          </Text>
        </div>
      </Card>
    </div>
  )
}