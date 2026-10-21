import { Layout, Menu, Button, Space, Typography } from 'antd'
import { Outlet } from 'react-router-dom'

const { Header, Content } = Layout
const { Text } = Typography

const items = [
  { key: 'file', label: 'แฟ้ม' },
  {
    key: 'members', label: 'ข้อมูลสมาชิก',
    children: [
      { key: 'm1', label: 'ข้อมูลสมาชิก' },
      { key: 'm2', label: 'ปรับสิทธิสมาชิก รายบุคคล' },
      { key: 'm3', label: 'ปรับสิทธิสมาชิก ตามช่วงวันที่' },
      { key: 'm4', label: 'บันทึกลาออก ให้ออก ขาดสิทธิ' },
    ],
  },
  {
    key: 'receipt', label: 'ใบเสร็จรับเงิน',
    children: [
      { key: 'r1', label: 'ใบเสร็จรับเงิน' },
      { key: 'r2', label: 'ใบเสร็จรับเงินย้อนหลัง' },
      { key: 'r3', label: 'ใบเสร็จรับเงินเป็นกลุ่มหมู่บ้าน' },
    ],
  },
  {
    key: 'close', label: 'ปิดสิ้นงวด',
    children: [
      { key: 'c1', label: 'ประมวลผลยอดคงเหลือใหม่' },
      { key: 'c2', label: 'ปิดสิ้นปี' },
    ],
  },
  { key: 'query', label: 'สอบถาม', children: [{ key: 'q1', label: 'สอบถามยอดคงเหลือ' }] },
  { key: 'report', label: 'รายงาน' },
  { key: 'admin', label: 'จัดการระบบ' },
  { key: 'backup', label: 'สำรองข้อมูล' },
]

export default function Shell({ user, onLogout }) {
  return (
    <Layout style={{ minHeight: '100%' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#1f3a8a', padding: '0 16px' }}>
        <Text strong style={{ color: '#fff', marginRight: 24, whiteSpace: 'nowrap' }}>
          ระบบฌาปนกิจสงเคราะห์
        </Text>
        <Menu
          theme="dark"
          mode="horizontal"
          items={items}
          style={{ flex: 1, background: 'transparent' }}
          selectable={false}
        />
        <Space>
          <Text style={{ color: '#fff' }}>{user.username}</Text>
          <Button size="small" onClick={onLogout}>ออก</Button>
        </Space>
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  )
}