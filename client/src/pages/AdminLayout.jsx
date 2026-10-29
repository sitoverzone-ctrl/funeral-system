import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Space, Typography, Tag, Modal } from 'antd'
import { 
  DashboardOutlined, 
  TeamOutlined, 
  FileTextOutlined, 
  DatabaseOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  UserOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  BookOutlined,
  ToolOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { Text, Title } = Typography

export default function AdminLayout({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false)
  const [theme, setTheme] = useState({ primary: '#1f3a8a', hover: '#1e40af' })

  // ตรวจสอบสิทธิ์ Dev เพื่อเด้ง Modal ต้อนรับเฉพาะเซสชันแรก
  useEffect(() => {
    if (user?.role === 'dev') {
      const hasWelcomed = sessionStorage.getItem('dev_welcomed_session')
      if (!hasWelcomed) {
        setIsDevModalOpen(true)
        sessionStorage.setItem('dev_welcomed_session', 'true')
      }
    }
  }, [user])

  // ตรวจสอบว่าเป็น Master Dev หลักที่ติดมากับโปรแกรมหรือไม่ (รหัส DEV)
  const isMasterDev = user?.role === 'dev' && (user?.code?.toUpperCase() === 'DEV' || user?.isMasterDev)

  // รายการเมนูด้านข้าง (เพิ่มเมนู "รีเซ็ตระบบทั้งหมด (Dev Only)" ไว้ล่างสุดสำหรับ Master Dev)
  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'หน้าหลัก (Dashboard)' },
    { key: '/members', icon: <TeamOutlined />, label: 'จัดการข้อมูลสมาชิก' },
    { 
      key: 'receipts-group', 
      icon: <FileTextOutlined />, 
      label: 'ระบบใบเสร็จรับเงิน',
      children: [
        { key: '/receipts/normal', label: 'ออกใบเสร็จรับเงิน' },
        { key: '/receipts/backdate', label: 'ใบเสร็จย้อนหลัง' },
        { key: '/receipts/group', label: 'ใบเสร็จกลุ่มหมู่บ้าน' },
        { key: '/receipts/advance-edit', label: 'แก้ไขชำระล่วงหน้าข้ามปี' },
        { key: '/receipts/summary-report', label: 'รายงานสรุปใบเสร็จรายวัน' },
        { key: '/receipts/collector-summary', label: 'รายงานตามผู้รับเงิน' }
      ]
    },
    {
      key: 'members-ops',
      icon: <TeamOutlined />,
      label: 'งานทะเบียนสมาชิก',
      children: [
        { key: '/members/rights-status', label: 'ปรับสถานภาพรายบุคคล' },
        { key: '/members/date-rights', label: 'ปรับสิทธิตามช่วงวันที่' },
        { key: '/members/resign-status', label: 'ลาออก / ให้ออก / ขาดสิทธิ' },
        { key: '/members/dead-welfare', label: 'บันทึกสมาชิกเสียชีวิต' },
        { key: '/members/edit-corpse-order', label: 'แก้ไขลำดับศพ' },
        { key: '/members/travel-expense', label: 'หักเงินสงเคราะห์' }
      ]
    },
    {
      key: 'reports-group',
      icon: <BarChartOutlined />,
      label: 'รายงานระบบ',
      children: [
        { key: '/reports/notice', label: 'ออกหนังสือแจ้งเตือน' },
        { key: '/reports/notice-advance', label: 'หนังสือแจ้งเตือนล่วงหน้า' },
        { key: '/reports/notice-a4', label: 'ออกหนังสือเตือน A4' },
        { key: '/reports/summary-members', label: 'รายงานสรุปสมาชิก' },
        { key: '/reports/members-by-type', label: 'รายงานสมาชิกแยกประเภท' },
        { key: '/reports/payment-summary', label: 'รายงานสรุปการชำระล่วงหน้า' },
        { key: '/reports/form-4-r1', label: 'ทะเบียนสมาชิก SK1' },
        { key: '/reports/form-4', label: 'ทะเบียนสมาชิก SK4' },
        { key: '/reports/form-11-alive', label: 'ทะเบียนเสียชีวิต SK11' },
        { key: '/reports/form-12', label: 'ชำระล่วงหน้าสิ้นปี SK12' },
        { key: '/reports/status-registry', label: 'ทะเบียนพ้นสภาพ' },
        { key: '/reports/village-payment', label: 'สมาชิกตามหมู่บ้าน' },
        { key: '/reports/advance-payment', label: 'แจ้งชำระเงินล่วงหน้า' },
        { key: '/reports/balance-check-list', label: 'ตรวจสอบยอดคงเหลือ' }
      ]
    },
    {
      key: 'accounting-group',
      icon: <BookOutlined />,
      label: 'บัญชีและการเงิน',
      children: [
        { key: '/accounting/ledger/87', label: 'บัญชีแยกประเภท (ฝาก 87)' },
        { key: '/accounting/ledger/88', label: 'บัญชีแยกประเภท (ฝาก 88)' },
        { key: '/accounting/disbursement/87', label: 'ถอน/เบิกจ่าย (บัญชี 87)' },
        { key: '/accounting/disbursement/88', label: 'ถอน/เบิกจ่าย (บัญชี 88)' }
      ]
    },
    {
      key: 'closing-group',
      icon: <CalculatorOutlined />,
      label: 'ปิดสิ้นงวด / สิ้นปี',
      children: [
        { key: '/closing/process', label: 'ประมวลผลยอดคงเหลือใหม่' },
        { key: '/closing/year', label: 'ปิดบัญชีสิ้นปี' }
      ]
    },
    {
      key: 'admin-group',
      icon: <ToolOutlined />,
      label: 'จัดการระบบ / ตั้งค่า',
      children: [
        { key: '/admin/org', label: 'ข้อมูลหน่วยงาน' },
        { key: '/admin/money-type', label: 'จัดการประเภทเงิน' },
        { key: '/admin/villages', label: 'ข้อมูลหมู่บ้าน' },
        { key: '/admin/edit-price', label: 'แก้ไขยอดค้างชำระ' },
        { key: '/admin/edit-rights', label: 'แก้ไขสถานภาพสมาชิก' },
        { key: '/admin/cfg-member-reg', label: 'ตั้งค่าลำดับสมาชิก' },
        { key: '/admin/cfg-receipt', label: 'ตั้งค่าลำดับใบเสร็จ' },
        { key: '/admin/cfg-welfare-sue', label: 'ตั้งค่าเครื่องพิมพ์ใบเสร็จ' },
        { key: '/admin/cfg-deposit-sue', label: 'ตั้งค่าเครื่องพิมพ์สมุด' },
        { key: '/admin/cfg-salary-sue', label: 'ตั้งค่าเครื่องพิมพ์หนังสือเตือน' },
        ...(isMasterDev ? [
          { key: '/admin/users', label: 'จัดการผู้ใช้งานระบบ' },
          { key: '/admin/reset', label: '🗑️ รีเซ็ตระบบทั้งหมด (Dev Only)' }
        ] : [])
      ]
    },
    { key: '/query/balance', icon: <DatabaseOutlined />, label: 'สอบถามยอดคงเหลือสมาชิก' },
    { key: '/backup/data', icon: <SettingOutlined />, label: 'สำรองและกู้คืนข้อมูล' }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed} 
        theme="dark" 
        width={260} 
        style={{ overflowY: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
          <Text strong style={{ color: '#fff', fontSize: 14 }}>
            {collapsed ? 'ฌาปนกิจ' : 'สมาคมฌาปนกิจสงเคราะห์'}
          </Text>
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user?.role === 'dev' ? (
              <div 
                onClick={() => setIsDevModalOpen(true)}
                style={{ 
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                  border: '1px solid #38bdf8',
                  padding: '4px 14px',
                  borderRadius: 20,
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <ThunderboltOutlined style={{ color: '#38bdf8', fontSize: 16 }} />
                <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>
                  DEV SUPREME MODE: ACTIVE
                </span>
              </div>
            ) : (
              <Tag color="geekblue" style={{ fontSize: 13, fontWeight: 'bold', padding: '4px 12px' }}>
                ยินดีต้อนรับคุณ {user?.name} ({user?.role === 'manager' ? 'ผู้จัดการ' : 'เจ้าหน้าที่'})
              </Tag>
            )}
          </div>

          <Space>
            <Text type="secondary">ผู้ใช้งาน:</Text>
            <Text strong>{user?.name} ({user?.role || 'staff'})</Text>
            <Button type="primary" danger ghost icon={<LogoutOutlined />} onClick={onLogout} size="small">
              ออกจากระบบ
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: '16px', background: '#f1f5f9', padding: '24px', borderRadius: '8px', overflowY: 'auto', flex: 1 }}>
          <Outlet context={{ user, theme, setTheme }} />
        </Content>
      </Layout>

      {/* Modal ต้อนรับสุดอลังการสำหรับ Dev โดยเฉพาะ */}
      <Modal
        open={isDevModalOpen}
        onCancel={() => setIsDevModalOpen(false)}
        footer={[
          <Button 
            key="enter" 
            type="primary" 
            size="large"
            icon={<RocketOutlined />}
            onClick={() => setIsDevModalOpen(false)}
            style={{ 
              background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)', 
              border: 'none', 
              fontWeight: 'bold',
              width: '100%',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.5)'
            }}
          >
            เข้าสู่ระบบควบคุมสูงสุด (ROOT ACCESS) 🚀
          </Button>
        ]}
        centered
        width={550}
        bodyStyle={{ 
          background: '#090d16', 
          borderRadius: 12, 
          border: '2px solid #0284c7',
          boxShadow: '0 0 30px rgba(2, 132, 199, 0.3)',
          padding: 24,
          color: '#f8fafc'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            width: 70, height: 70, margin: '0 auto 12px auto', 
            borderRadius: '50%', background: 'rgba(2, 132, 199, 0.15)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed #38bdf8'
          }}>
            <CodeOutlined style={{ fontSize: 32, color: '#38bdf8' }} />
          </div>
          <Tag color="cyan" style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 }}>
            SYSTEM ROOT ACCESS GRANTED
          </Tag>
          <Title level={3} style={{ color: '#f8fafc', margin: 0, textShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }}>
            ยินดีต้อนรับท่านผู้นำทางเทคนิค
          </Title>
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>
            สมาคมฌาปนกิจสงเคราะห์ (Core Architecture v2.6)
          </Text>
        </div>

        <div style={{ background: '#111827', padding: 14, borderRadius: 8, border: '1px solid #1f2937', marginBottom: 16 }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}><UserOutlined /> ผู้ใช้งานระบบ:</Text>
              <Text strong style={{ color: '#38bdf8' }}>{user?.name} (Dev)</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}><ApiOutlined /> สถานะเซิร์ฟเวอร์:</Text>
              <Tag color="success" style={{ margin: 0 }}>ONLINE / LOW LATENCY</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}><SafetyCertificateOutlined /> สิทธิ์การเข้าถึง:</Text>
              <Tag color="purple" style={{ margin: 0 }}>FULL PRIVILEGE (BYPASS ALL)</Tag>
            </div>
          </Space>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11, color: '#64748b' }}>
            * ระบบพร้อมซิงค์ฐานข้อมูล พิมพ์สมุด PR9 และจัดการระบบเครื่องพิมพ์อัตโนมัติ 100%
          </Text>
        </div>
      </Modal>
    </Layout>
  )
}