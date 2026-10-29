import { useState, useEffect } from 'react'
import { Layout, Menu, Button, Space, Typography, Tooltip, Dropdown, message, ConfigProvider, Modal, Input } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  TeamOutlined, 
  FileTextOutlined, 
  SearchOutlined, 
  DatabaseOutlined, 
  LogoutOutlined,
  HomeOutlined,
  BgColorsOutlined,
  SaveOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  BookOutlined
} from '@ant-design/icons'

const { Header, Content } = Layout
const { Text } = Typography

// ธีมสีทั้งหมด
const THEMES = {
  blue: { name: 'น้ำเงินคลาสสิก', primary: '#1f3a8a', hover: '#1e40af' },
  green: { name: 'เขียวมรกต', primary: '#065f46', hover: '#047857' },
  purple: { name: 'ม่วงหลวง', primary: '#581c87', hover: '#6b21a8' },
  dark: { name: 'เทาดำเข้ม', primary: '#1e293b', hover: '#334155' },
  yellow: { name: 'เหลืองทอง', primary: '#b45309', hover: '#d97706' },
  red: { name: 'แดงทับทิม', primary: '#991b1b', hover: '#b91c1c' },
  pink: { name: 'ชมพูบานเย็น', primary: '#be185d', hover: '#db2777' },
  brown: { name: 'น้ำตาลไม้', primary: '#78350f', hover: '#92400e' }
}

export default function Shell({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [currentThemeKey, setCurrentThemeKey] = useState(() => {
    return localStorage.getItem('funeral_theme') || 'blue'
  })

  useEffect(() => {
    localStorage.setItem('funeral_theme', currentThemeKey)
  }, [currentThemeKey])

  const activeTheme = THEMES[currentThemeKey] || THEMES.blue

  // ฟังก์ชันรีเซ็ตข้อมูลทั้งหมด พร้อมระบบกรอกรหัสยืนยัน 258025
  const handleSystemReset = () => {
    const userRole = user?.role || ''
    const userName = user?.name || user?.username || ''
    const isDev = userRole === 'dev' || userName.includes('Dev') || userName.includes('พุทธิพงศ์')

    if (!isDev) {
      message.error('❌ ขออภัย! เฉพาะผู้พัฒนา (Dev) เท่านั้นที่มีสิทธิ์รีเซ็ตข้อมูลระบบ')
      return
    }

    let enteredPassword = ''

    Modal.confirm({
      title: '⚠️ คำเตือนขั้นสูงสุด: ยืนยันการรีเซ็ตข้อมูลระบบทั้งหมด?',
      content: (
        <div>
          <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: 8 }}>
            การกระทำนี้จะลบข้อมูลสมาชิกให้กลับสู้การเริ่มต้นหรือซีเซ็ตระบบใหม่ทั้งหมด
          </p>
          <p style={{ marginBottom: 12 }}>โดยจะเก็บรักษาไว้เฉพาะ <b>"ข้อมูลหน่วยงาน"</b> เท่านั้น</p>
          <p style={{ fontWeight: 'bold', marginBottom: 4, color: '#1e293b' }}>
            กรุณากรอกรหัสผ่านยืนยัน
          </p>
          <Input.Password 
            placeholder="กรอกรหัสยืนยัน 6 หลัก" 
            onChange={(e) => { enteredPassword = e.target.value }} 
            style={{ width: '100%', fontWeight: 'bold' }}
            maxLength={6}
          />
        </div>
      ),
      okText: 'ยืนยันล้างข้อมูลทั้งหมด',
      okButtonProps: { danger: true },
      cancelText: 'ยกเลิก',
      onOk: () => {
        if (enteredPassword !== '258025') {
          message.error('❌ รหัสยืนยันไม่ถูกต้อง! ยกเลิกการรีเซ็ตข้อมูลระบบ')
          return Promise.reject()
        }

        try {
          const savedOrgInfo = localStorage.getItem('funeral_organization_info')
          const savedTheme = localStorage.getItem('funeral_theme')

          localStorage.clear()

          if (savedOrgInfo) {
            localStorage.setItem('funeral_organization_info', savedOrgInfo)
          }
          if (savedTheme) {
            localStorage.setItem('funeral_theme', savedTheme)
          }

          message.success('🧹 รีเซ็ตข้อมูลระบบทั้งหมดเรียบร้อยแล้ว (ยกเว้นข้อมูลหน่วยงาน)')
          setTimeout(() => {
            window.location.href = '/'
          }, 1200)
        } catch (err) {
          console.error(err)
          message.error('❌ เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล')
        }
      }
    })
  }

  const items = [
    {
      key: 'file_group', 
      label: 'บันทึก', 
      icon: <SaveOutlined />,
      children: [
        { key: '/settings/database', label: 'กำหนดเชื่อมต่อฐานข้อมูล' },
        { key: '/settings/printer', label: 'กำหนดเครื่องพิมพ์' },
        { key: '/logout-app', label: 'ออกจากโปรแกรม' },
      ],
    },
    {
      key: 'members_group', 
      label: 'ข้อมูลสมาชิก', 
      icon: <TeamOutlined />,
      children: [
        { key: '/members', label: 'ข้อมูลสมาชิก' },
        { key: '/members/rights-status', label: 'บันทึกปรับสถานะสมาชิกให้ได้รับสิทธิ รายบุคคล' },
        { key: '/members/date-rights', label: 'บันทึกปรับสถานะภาพสมาชิกให้ได้รับสิทธิ ตามช่วงวันที่' },
        { key: '/members/resign-status', label: 'บันทึกสมาชิกลาออก ให้ออก ขาดสิทธิ หรือตายก่อนได้รับสิทธิ' },
        { key: '/members/dead-welfare', label: 'บันทึกสมาชิกเสียชีวิต ที่ได้รับเงินสวัสดิการ' },
        { key: '/members/edit-corpse-order', label: 'แก้ไขลำดับศพใหม่' },
        { key: '/members/travel-expense', label: 'การดำเนินงานหักเงินสงเคราะห์' },
      ],
    },
    {
      key: 'receipt_group', 
      label: 'ใบเสร็จรับเงิน', 
      icon: <FileTextOutlined />,
      children: [
        { key: '/receipts/normal', label: 'ใบเสร็จรับเงิน' },
        { key: '/receipts/history', label: 'ใบเสร็จรับเงินย้อนหลัง' },
        { key: '/receipts/group', label: 'ใบเสร็จรับเงินเป็นกลุ่มหมู่บ้าน' },
        { key: '/receipts/advance-edit', label: 'บันทึกแก้ไขรายการชำระล่วงหน้าข้ามปี' },
        { key: '/receipts/summary-report', label: 'รายงานสรุปใบเสร็จรับรายวัน' },
        { key: '/receipts/collector-summary', label: 'รายงานสรุปใบเสร็จรายวันตามผู้รับเงิน' },
      ],
    },
    {
      key: 'close', 
      label: 'ปิดสิ้นงวด', 
      icon: <CalendarOutlined />,
      children: [
        { key: '/closing/process', label: 'ประมวลผลยอดคงเหลือใหม่' },
        { key: '/closing/year', label: 'ปิดสิ้นปี' },
      ],
    },
    { 
      key: 'query', 
      label: 'สอบถาม', 
      icon: <SearchOutlined />, 
      children: [{ key: '/query/balance', label: 'สอบถามยอดคงเหลือ' }] 
    },
    {
      key: 'reports_group', 
      label: 'รายงาน', 
      icon: <BarChartOutlined />,
      children: [
        { key: '/reports/notice', label: 'ออกหนังสือเตือน' },
        { key: '/reports/notice-advance', label: 'ออกหนังสือแจ้งประจำปีล่วงหน้า' },
        { key: '/reports/notice-a4', label: 'ออกหนังสือเตือน (A4)' },
        { key: '/reports/summary-members', label: 'รายงานสรุปจำนวนสมาชิก' },
        { key: '/reports/members-by-type', label: 'รายงานรายชื่อสมาชิกแยกประเภท' },
        { key: '/reports/resign-list', label: 'รายงานทะเบียนรับจ่ายสมาชิกรายคน' },
        { key: '/reports/payment-summary', label: 'รายงานการชำระเงินทดลองจ่ายรายปี' },
        { key: '/reports/form-4-r1', label: 'รายงาน ส.ฌ.ก 1 (แบบทะเบียนสมาชิก)' },
        { key: '/reports/form-4', label: 'รายงาน ส.ฌ.ก 4' },
        { key: '/reports/form-11-alive', label: 'รายงาน ส.ฌ.ก. 11 (ทะเบียนผู้เสียชีวิต)' },
        { key: '/reports/form-11-alive-r1', label: 'รายงาน ส.ฌ.ก. 11 (ทะเบียนผู้เสียชีวิต รูปแบบ ส.ก.ฌ. 1)' },
        { key: '/reports/form-12', label: 'รายงาน ส.ฌ.ก. 12' },
        { key: '/reports/status-registry', label: 'รายงาน ทะเบียนสมาชิกพ้นสภาพ' },
        { key: '/reports/status-registry-r1', label: 'รายงาน ทะเบียนสมาชิกพ้นสภาพ (รูปแบบ ส.ก.ฌ. 1)' },
        { key: '/reports/village-payment', label: 'พิมพ์รายชื่อตามหมู่บ้าน' },
        { key: '/reports/advance-payment', label: 'พิมพ์รายชื่อสมาชิกแจ้งให้ชำระเงินสงเคราะห์ล่วงหน้า' },
        { key: '/reports/life-insurance-list', label: 'พิมพ์รายชื่อผู้เสียชีวิต' },
        { key: '/reports/balance-check-list', label: 'พิมพ์รายชื่อตรวจสอบยอดคงเหลือ' },
      ],
    },
    {
      key: 'admin_group', 
      label: 'จัดการระบบ', 
      icon: <SettingOutlined />,
      children: [
        { key: '/admin/org', label: 'ข้อมูลหน่วยงาน' },
        { key: '/admin/users', label: 'ข้อมูลผู้ใช้ (เจ้าหน้าที่)' },
        { key: '/admin/money-type', label: 'ข้อมูลประเภทเงิน' },
        //{ key: '/admin/villages', label: 'ข้อมูลชื่อหมู่บ้าน' },
        { key: '/admin/edit-price', label: 'แก้ไขค้างชำระยกมา' },
        { key: '/admin/edit-rights', label: 'แก้ไขสถานภาพสิทธิ กรณีสิทธิผิด' },
        { key: '/admin/edit-welfare-date', label: 'แก้ไขรายการหักเงินสงเคราะห์ ตามวันที่ตัดตาย' },
        { key: '/admin/edit-deposit-date', label: 'แก้ไขล้างรายการหักเงินบำรุง ตามวันที่หัก' },
        { key: '/admin/cfg-member-reg', label: 'กำหนดลำดับทะเบียนสมาชิก' },
        { key: '/admin/cfg-receipt', label: 'กำหนดลำดับใบเสร็จ' },
        { key: '/admin/cfg-receipt-backdate', label: 'กำหนดลำดับใบเสร็จย้อนหลัง' },
        { key: '/admin/cfg-village-meeting', label: 'กำหนดลำดับใบเสร็จรับเงินตามกลุ่มหมู่บ้าน' },
        { key: '/admin/cfg-welfare-sue', label: 'กำหนดเครื่องพิมพ์ใบเสร็จ' },
        { key: '/admin/cfg-deposit-sue', label: 'กำหนดเครื่องพิมพ์สมุด' },
        { key: '/admin/cfg-salary-sue', label: 'กำหนดเครื่องพิมพ์หนังสือเตือน' },
        { type: 'divider' },
        { key: 'system-reset-action', label: <span style={{ color: '#dc2626', fontWeight: 'bold' }}>🗑️ รีเซ็ตระบบทั้งหมด (Dev Only)</span> },
      ],
    },
    {
      key: 'backup_group', 
      label: 'สำรองข้อมูล', 
      icon: <DatabaseOutlined />,
      children: [
        { key: '/backup/data', label: 'สำรองข้อมูล' },
      ],
    },
    { 
      key: '/', 
      label: 'หน้าหลัก', 
      icon: <HomeOutlined /> 
    },
    {
      key: 'ledger_group', 
      label: 'บัญชีแยกประเภท', 
      icon: <BookOutlined />,
      children: [
        { key: '/accounting/ledger/87', label: 'บัญชี 87 ฝากเงิน' },
        { key: '/accounting/disbursement/87', label: 'บัญชี 87 ถอนเงิน' },
        { key: '/accounting/ledger/88', label: 'บัญชี 88 ฝากเงิน' },
        { key: '/accounting/disbursement/88', label: 'บัญชี 88 ถอนเงิน' },
      ],
    },
  ]

  const themeDropdownItems = {
    items: Object.keys(THEMES).map((key) => ({
      key,
      label: (
        <Space>
          <span style={{ 
            display: 'inline-block', 
            width: 14, 
            height: 14, 
            borderRadius: '50%', 
            background: THEMES[key].primary 
          }} />
          <Text strong={currentThemeKey === key}>{THEMES[key].name}</Text>
        </Space>
      ),
      onClick: () => {
        setCurrentThemeKey(key)
        message.success(`เปลี่ยนธีมเป็น "${THEMES[key].name}" เรียบร้อยแล้ว`)
      }
    }))
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: activeTheme.primary,
          },
        }}
      >
        <Header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: activeTheme.primary, 
          padding: '0 16px', 
          height: '52px', 
          lineHeight: '52px',
          transition: 'background 0.3s ease'
        }}>
          <Text strong style={{ color: '#fff', marginRight: 24, whiteSpace: 'nowrap', fontSize: '15px' }}>
            ระบบฌาปนกิจสงเคราะห์
          </Text>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={items}
            onClick={({ key }) => {
              if (key === '/logout-app') {
                onLogout()
              } else if (key === 'system-reset-action') {
                handleSystemReset()
              } else if (key.startsWith('/')) {
                navigate(key)
              }
            }}
            style={{ flex: 1, background: 'transparent', borderBottom: 'none' }}
            selectable={false}
          />

          <Space size="middle">
            <Text style={{ color: '#fff', fontSize: '13px' }}>
              ผู้ใช้งาน: {user?.name || user?.username || 'admin'} ({user?.role === 'staff' ? 'เจ้าหน้าที่' : user?.role === 'manager' ? 'ผู้จัดการ' : 'Dev'})
            </Text>

            <Dropdown menu={themeDropdownItems} placement="bottomRight" trigger={['click']}>
              <Button 
                size="small"
                icon={<BgColorsOutlined />} 
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: '#fff', 
                  borderColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                เปลี่ยนธีม
              </Button>
            </Dropdown>

            <Button size="small" onClick={onLogout} danger>ออก</Button>
          </Space>
        </Header>
      </ConfigProvider>

      {/* แถบปุ่มไอคอนลัด (Toolbar) ด้านล่าง */}
      <div style={{ background: '#e2e8f0', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #cbd5e1' }}>
        <Tooltip title="หน้าหลัก">
          <Button icon={<HomeOutlined />} onClick={() => navigate('/')} size="small" />
        </Tooltip>
        <Tooltip title="ข้อมูลสมาชิก">
          <Button icon={<TeamOutlined />} onClick={() => navigate('/members')} size="small" />
        </Tooltip>
        <Tooltip title="ใบเสร็จรับเงิน">
          <Button icon={<FileTextOutlined />} onClick={() => navigate('/receipts/normal')} size="small" />
        </Tooltip>
        <Tooltip title="สอบถามยอดคงเหลือ">
          <Button icon={<SearchOutlined />} onClick={() => navigate('/query/balance')} size="small" />
        </Tooltip>
        <Tooltip title="สำรองข้อมูล">
          <Button icon={<DatabaseOutlined />} onClick={() => navigate('/backup/data')} size="small" />
        </Tooltip>
        <div style={{ borderLeft: '1px solid #94a3b8', height: '16px', margin: '0 4px' }} />
        <Tooltip title="ออกจากระบบ">
          <Button icon={<LogoutOutlined />} onClick={onLogout} size="small" danger />
        </Tooltip>
      </div>

      <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 92px)' }}>
        <Outlet context={{ user, currentTheme: currentThemeKey, theme: activeTheme }} />
      </Content>
    </Layout>
  )
}