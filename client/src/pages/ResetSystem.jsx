import { useState } from 'react'
import { Card, Button, Input, Typography, message, Modal } from 'antd'
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useOutletContext } from 'react-router-dom'

const { Title, Text } = Typography

export default function ResetSystem() {
  const context = useOutletContext() || {}
  const theme = context.theme || { primary: '#1f3a8a' }
  
  const [password, setPassword] = useState('')

  const handleReset = () => {
    if (!password.trim()) {
      message.error('❌ กรุณากรอกรหัสผ่านเพื่อยืนยันการรีเซ็ตระบบ')
      return
    }

    Modal.confirm({
      title: '⚠️ คำเตือนสูงสุด: ยืนยันการรีเซ็ตและล้างข้อมูลทั้งหมด?',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: 'การกระทำนี้จะลบข้อมูลสมาชิก, ใบเสร็จ, บัญชีการเงิน, ข้อมูลพนักงาน และการตั้งค่าอื่นๆ ทั้งหมดในระบบให้หายไปอย่างถาวร (โดยจะคงข้อมูลหน่วยงาน / ตั้งค่าสมาคมไว้) ไม่สามารถกู้คืนได้!',
      okText: 'ยืนยันล้างข้อมูล',
      okButtonProps: { danger: true },
      cancelText: 'ยกเลิก',
      onOk() {
        // 1. สำรองข้อมูลที่เกี่ยวกับหน่วยงาน/สมาคมทั้งหมดก่อนเคลียร์
        const savedOrgData = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.toLowerCase().includes('org') || key.toLowerCase().includes('unit') || key.toLowerCase().includes('association') || key.toLowerCase().includes('funeral_org'))) {
            savedOrgData.push({ key, value: localStorage.getItem(key) })
          }
        }

        // 2. ล้างข้อมูลทั้งหมดใน localStorage
        localStorage.clear()

        // 3. นำข้อมูลหน่วยงานที่สำรองไว้คืนค่ากลับมา
        savedOrgData.forEach(item => {
          localStorage.setItem(item.key, item.value)
        })

        message.success('🗑️ รีเซ็ตระบบทั้งหมดเรียบร้อยแล้ว (โดยคงข้อมูลหน่วยงานไว้ครบถ้วน)')
        // เด้งกลับไปหน้า Login ทันที
        window.location.href = '/login'
      }
    })
  }

  return (
    <div style={{ maxWidth: 900, margin: '20px auto' }}>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '6px solid #ef4444' }}>
        <Title level={3} style={{ color: '#ef4444', marginBottom: 8 }}>
          🗑️ รีเซ็ตระบบทั้งหมด (System Factory Reset)
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 15 }}>
          ฟังก์ชันนี้สงวนสิทธิ์เฉพาะ Master Dev เท่านั้น ใช้สำหรับล้างข้อมูลการใช้งานทั้งหมดในโปรแกรมเพื่อเริ่มต้นใหม่ โดยระบบจะ<strong>คงข้อมูลหน่วยงาน / ตั้งค่าสมาคม & โลโก้</strong>ไว้อัตโนมัติ
        </Text>

        <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, border: '1px solid #fecaca', marginBottom: 24 }}>
          <Text style={{ color: '#b91c1c', fontSize: 14 }}>
            ⚠️ <strong>ข้อควรระวัง:</strong> ข้อมูลสมาชิก, ยอดเงิน, ใบเสร็จ, และประวัติการทำรายการจะถูกลบเกลี้ยง แต่ข้อมูลหน่วยงานของคุณจะไม่ถูกลบ
          </Text>
        </div>

        <div style={{ marginBottom: 24, maxWidth: 500 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>กรอกรหัสผ่านของคุณเพื่อยืนยันการล้างข้อมูล:</Text>
          <Input.Password 
            placeholder="กรอกรหัสผ่าน..." 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            size="large"
          />
        </div>

        <Button 
          type="primary" 
          danger 
          size="large" 
          icon={<DeleteOutlined />} 
          onClick={handleReset}
        >
          ดำเนินการรีเซ็ตล้างข้อมูล (เก็บข้อมูลหน่วยงานไว้)
        </Button>
      </Card>
    </div>
  )
}