import { useState } from 'react'
import { Card, Form, Input, Button, Typography, Alert } from 'antd'

const { Title, Text } = Typography

export default function Login({ onLogin }) {
  const [error, setError] = useState('')

  const submit = (v) => {
    // ชั่วคราว: รหัสทดสอบ เปลี่ยนเป็นตรวจกับเครื่องแม่ภายหลัง
    if (v.username === 'admin' && v.password === '1234') {
      onLogin({ username: v.username, org: v.org || '-', level: 2 })
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
  }

  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center' }}>
      <Card style={{ width: 420 }}>
        <Text type="secondary">ระบบฌาปนกิจสงเคราะห์การเกษตรเซกา จำกัด</Text>
        <Title level={3} style={{ marginTop: 0 }}>เข้าสู่ระบบ</Title>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="username" label="ชื่อผู้ใช้" rules={[{ required: true }]}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="org" label="หน่วยงาน">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="รหัสผ่าน" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>เข้าสู่ระบบ</Button>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>กรุณากรอกรหัสเจ้าหน้าที่</Text>
      </Card>
    </div>
  )
}