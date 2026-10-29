import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Row, Col, Card, Typography, Space, Button, Tag, Divider, Statistic } from 'antd'
import { 
  UserOutlined, 
  UserDeleteOutlined, 
  UserAddOutlined, 
  TeamOutlined,
  FileTextOutlined, 
  SearchOutlined, 
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  BankOutlined,
  WalletOutlined,
  DollarCircleOutlined,
  HeartOutlined,
  UserSwitchOutlined,
  StopOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function Dashboard() {
  const navigate = useNavigate()
  const outletContext = useOutletContext() || {}
  const user = outletContext.user || { name: 'เจ้าหน้าที่', role: 'staff', code: 'ST001' }
  
  const theme = outletContext.theme || { primary: '#1f3a8a', hover: '#1e40af' }
  const primaryColor = theme.primary || '#1f3a8a'
  const hoverColor = theme.hover || primaryColor

  const [bankBalance88, setBankBalance88] = useState(0)
  const [bankBalance87, setBankBalance87] = useState(0)
  const [cashBalance87, setCashBalance87] = useState(0)
  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์')

  const [memberStats, setMemberStats] = useState({
    active: 0,
    newMember: 0,
    noRight: 0,
    dead: 0,
    resign: 0,
    fired: 0,
    totalAlive: 0,
    deadAccumulated: 0,
    noRightAccumulated: 0,
    resignAccumulated: 0,
    firedAccumulated: 0,
    totalDeduction: 0
  })

  // ฟังก์ชันดึงและคำนวณข้อมูลทั้งหมดจาก localStorage แบบเรียลไทม์ 100%
  const loadAllData = () => {
    const savedOrg = localStorage.getItem('funeral_organization_info')
    if (savedOrg) {
      try {
        const parsedOrg = JSON.parse(savedOrg)
        if (parsedOrg.name) {
          setOrgName(parsedOrg.name)
        }
      } catch (e) {
        console.error(e)
      }
    }

    const rawBank88 = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
    const disbursements88 = JSON.parse(localStorage.getItem('funeral_disbursements_88')) || []
    const totalDisbursed88 = disbursements88.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    setBankBalance88(Math.max(0, rawBank88 - totalDisbursed88))

    const rawBank87 = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
    const rawCash87 = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
    const disbursements87 = JSON.parse(localStorage.getItem('funeral_disbursements_87')) || []
    const totalDisbursed87 = disbursements87.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    let remainingDisburse = totalDisbursed87
    let netCash87 = rawCash87
    let netBank87 = rawBank87

    if (netCash87 >= remainingDisburse) {
      netCash87 -= remainingDisburse
    } else {
      remainingDisburse -= netCash87
      netCash87 = 0
      netBank87 = Math.max(0, netBank87 - remainingDisburse)
    }

    setBankBalance87(netBank87)
    setCashBalance87(netCash87)

    const savedMembers = JSON.parse(localStorage.getItem('funeral_members')) || []
    const currentYear = dayjs().year()

    let activeCount = 0
    let newCount = 0
    let noRightCount = 0
    let deadCount = 0
    let resignCount = 0
    let firedCount = 0

    let deadAcc = 0
    let noRightAcc = 0
    let resignAcc = 0
    let firedAcc = 0
    let totalDed = 0

    savedMembers.forEach(m => {
      const status = m.status || 'ปกติ'
      const regDate = m.regDate || m.registerDate ? dayjs(m.regDate || m.registerDate) : null
      const regYear = regDate && regDate.isValid() ? regDate.year() : currentYear
      const isThisYear = regYear === currentYear

      if (status === 'เสียชีวิต' || status === 'ตาย') {
        deadAcc++
        if (isThisYear) deadCount++
        totalDed += Number(m.deduction || m.funeralFee || 0)
      } else if (status === 'ขาดสิทธิ' || status === 'ขาดสิทธิ์') {
        noRightAcc++
        if (isThisYear) noRightCount++
      } else if (status === 'ลาออก') {
        resignAcc++
        if (isThisYear) resignCount++
      } else if (status === 'ให้ออก' || status === 'ถูกให้ออก') {
        firedAcc++
        if (isThisYear) firedCount++
      } else if (status === 'สมาชิกใหม่' || status === 'new') {
        newCount++
        activeCount++
      } else {
        activeCount++
      }
    })

    setMemberStats({
      active: activeCount,
      newMember: newCount,
      noRight: noRightCount,
      dead: deadCount,
      resign: resignCount,
      fired: firedCount,
      totalAlive: activeCount + newCount,
      deadAccumulated: deadAcc,
      noRightAccumulated: noRightAcc,
      resignAccumulated: resignAcc,
      firedAccumulated: firedAcc,
      totalDeduction: totalDed
    })
  }

  useEffect(() => {
    loadAllData()
    window.addEventListener('storage', loadAllData)
    const interval = setInterval(loadAllData, 1000)

    return () => {
      window.removeEventListener('storage', loadAllData)
      clearInterval(interval)
    }
  }, [])

  const roleText = user?.role === 'staff' 
    ? 'เจ้าหน้าที่ (Staff - เพิ่ม/แก้ไขได้)' 
    : user?.role === 'manager' 
    ? 'ผู้จัดการ (Manager - จัดการเต็มรูปแบบ)' 
    : 'นักพัฒนา (Dev - สิทธิ์สูงสุด)'

  const stats = [
    { title: 'สมาชิกได้รับสิทธิ', value: memberStats.active, color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleOutlined style={{ fontSize: 26, color: '#10b981' }} />, unit: 'ราย' },
    { title: 'สมาชิกใหม่ (ปีนี้)', value: memberStats.newMember, color: '#0284c7', bg: '#f0f9ff', icon: <UserAddOutlined style={{ fontSize: 26, color: '#0284c7' }} />, unit: 'ราย' },
    { title: 'ขาดสิทธิ (ปีนี้)', value: memberStats.noRight, color: '#f59e0b', bg: '#fffbeb', icon: <ExclamationCircleOutlined style={{ fontSize: 26, color: '#f59e0b' }} />, unit: 'ราย' },
    { title: 'เสียชีวิต (ปีนี้)', value: memberStats.dead, color: '#ef4444', bg: '#fef2f2', icon: <HeartOutlined style={{ fontSize: 26, color: '#ef4444' }} />, unit: 'ราย' },
    { title: 'ลาออก (ปีนี้)', value: memberStats.resign, color: '#6b7280', bg: '#f9fafb', icon: <UserSwitchOutlined style={{ fontSize: 26, color: '#6b7280' }} />, unit: 'ราย' },
    { title: 'ให้ออก (ปีนี้)', value: memberStats.fired, color: '#8b5cf6', bg: '#f5f3ff', icon: <StopOutlined style={{ fontSize: 26, color: '#8b5cf6' }} />, unit: 'ราย' },
  ]

  const totalAccumulated = [
    { label: 'เสียชีวิต (สะสม)', value: memberStats.deadAccumulated, color: '#ef4444', icon: <UserDeleteOutlined style={{ color: '#ef4444' }} /> },
    { label: 'ขาดสิทธิ (สะสม)', value: memberStats.noRightAccumulated, color: '#f59e0b', icon: <ExclamationCircleOutlined style={{ color: '#f59e0b' }} /> },
    { label: 'ลาออก (สะสม)', value: memberStats.resignAccumulated, color: '#6b7280', icon: <UserOutlined style={{ color: '#6b7280' }} /> },
    { label: 'ให้ออก (สะสม)', value: memberStats.firedAccumulated, color: '#8b5cf6', icon: <CloseCircleOutlined style={{ color: '#8b5cf6' }} /> },
  ]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Card ต้อนรับผู้ใช้งาน */}
      <Card style={{ marginBottom: 20, borderRadius: 8, background: `linear-gradient(135deg, ${primaryColor} 0%, ${hoverColor} 100%)`, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
              👋 ยินดีต้อนรับ, {user?.name || 'ผู้ใช้งานระบบ'}
            </Title>
            <Text style={{ color: '#e2e8f0', fontSize: 14 }}>
              🏛️ ระบบบริหารจัดการ{orgName}
            </Text>
          </Col>
          <Col>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '8px 16px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              <Text style={{ color: '#cbd5e1', fontSize: 12, display: 'block' }}>🛡️ ระดับสิทธิ์ของคุณ:</Text>
              <Text strong style={{ color: '#fff', fontSize: 14 }}>{roleText}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ================= 1. กรอบหัวข้อ: การเงิน ================= */}
      <Card 
        title={
          <Space>
            <DollarCircleOutlined style={{ color: primaryColor, fontSize: 18 }} />
            <Text strong style={{ fontSize: 16, color: primaryColor }}>สรุปข้อมูลการเงิน (ยอดคงเหลือสุทธิหลังหักเบิกจ่าย)</Text>
          </Space>
        } 
        style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card size="middle" style={{ borderRadius: 8, borderLeft: '5px solid #2563eb', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', height: '100%' }}>
              <Statistic 
                title={<Text strong style={{ fontSize: 14, color: '#1d4ed8' }}>🏦 ยอดฝากธนาคาร (บัญชี 88สุทธิ)</Text>}
                value={bankBalance88} 
                precision={2} 
                suffix="บาท" 
                valueStyle={{ color: '#1d4ed8', fontWeight: 'bold', fontSize: 24 }}
                prefix={<BankOutlined />}
              />
              <Divider style={{ margin: '10px 0' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>💳 หักยอดถอนเงินสงเคราะห์ศพแล้ว</Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card size="middle" style={{ borderRadius: 8, borderLeft: '5px solid #0284c7', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', height: '100%' }}>
              <Statistic 
                title={<Text strong style={{ fontSize: 14, color: '#0369a1' }}>🏦 ยอดฝากธนาคาร (บัญชี 87สุทธิ)</Text>}
                value={bankBalance87} 
                precision={2} 
                suffix="บาท" 
                valueStyle={{ color: '#0369a1', fontWeight: 'bold', fontSize: 24 }}
                prefix={<BankOutlined />}
              />
              <Divider style={{ margin: '10px 0' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>📋 หักยอดเบิกจ่ายสำนักงานแล้ว</Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card size="middle" style={{ borderRadius: 8, borderLeft: '5px solid #059669', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', height: '100%' }}>
              <Statistic 
                title={<Text strong style={{ fontSize: 14, color: '#047857' }}>💰 ยอดเงินสดในมือ (บัญชี 87สุทธิ)</Text>}
                value={cashBalance87} 
                precision={2} 
                suffix="บาท" 
                valueStyle={{ color: '#047857', fontWeight: 'bold', fontSize: 24 }}
                prefix={<WalletOutlined />}
              />
              <Divider style={{ margin: '10px 0' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>💵 รายได้เงินสดหักค่าใช้จ่ายสำนักงานแล้ว</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ================= 2. กรอบหัวข้อ: ข้อมูลสมาชิก (ซิงค์สดเรียลไทม์) ================= */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space>
              <TeamOutlined style={{ color: primaryColor, fontSize: 18 }} />
              <Text strong style={{ fontSize: 16, color: primaryColor }}>ข้อมูลสมาชิกและสถิติภาพรวม (ซิงค์สดเรียลไทม์)</Text>
            </Space>
            <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12, margin: 0 }}>
              📅 ปีงบประมาณ {dayjs().year() + 543}
            </Tag>
          </div>
        }
        style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {stats.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={4} key={index}>
              <Card 
                bodyStyle={{ padding: '16px' }}
                style={{ borderRadius: 8, borderLeft: `4px solid ${item.color}`, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>{item.title}</Text>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 26, fontWeight: 'bold', color: '#0f172a' }}>
                        {item.value.toLocaleString()}
                      </span>
                      <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>{item.unit}</Text>
                    </div>
                  </div>
                  <div style={{ background: item.bg, padding: 8, borderRadius: 8 }}>
                    {item.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="📊 ยอดสะสมรวมทั้งหมด & ยอดเงินสงเคราะห์" size="small" style={{ borderRadius: 8, height: '100%' }}>
              <Row gutter={[16, 16]}>
                {totalAccumulated.map((item, i) => (
                  <Col span={12} key={i}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 13 }}>{item.label}</Text>
                        <div style={{ fontSize: 22, fontWeight: 'bold', color: item.color, marginTop: 4 }}>
                          {item.value.toLocaleString()} <span style={{ fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>ราย</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 24, padding: 8, background: '#fff', borderRadius: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {item.icon}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              <div style={{ marginTop: 16, background: '#fef2f2', padding: '12px 16px', borderRadius: 8, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <DollarCircleOutlined style={{ color: '#b91c1c', fontSize: 18 }} />
                  <Text style={{ color: '#b91c1c', fontWeight: 'bold' }}>ยอดหักเงินสงเคราะห์ศพ (รวมผู้เสียชีวิต):</Text>
                </Space>
                <Text strong style={{ fontSize: 18, color: '#b91c1c' }}>{memberStats.totalDeduction.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</Text>
              </div>

              <Divider style={{ margin: '16px 0 12px 0' }} />

              <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <ArrowUpOutlined style={{ color: primaryColor }} />
                  <Text style={{ color: '#1e40af' }}>สมาชิกคงสภาพรวมทั้งสิ้น:</Text>
                </Space>
                <Text strong style={{ fontSize: 18, color: primaryColor }}>{memberStats.totalAlive.toLocaleString()} ราย</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="⚡ ทางลัดการใช้งานด่วน" size="small" style={{ borderRadius: 8, height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button 
                  type="primary" 
                  icon={<TeamOutlined />} 
                  block 
                  size="large"
                  style={{ height: 48, textAlign: 'left', background: primaryColor }}
                  onClick={() => navigate('/members')}
                >
                  จัดการข้อมูลสมาชิก / ค้นหา
                </Button>
                
                <Button 
                  icon={<FileTextOutlined />} 
                  block 
                  size="large"
                  style={{ height: 48, textAlign: 'left' }}
                  onClick={() => navigate('/receipts/normal')}
                >
                  ออกใบเสร็จรับเงิน
                </Button>

                <Button 
                  icon={<SearchOutlined />} 
                  block 
                  size="large"
                  style={{ height: 48, textAlign: 'left' }}
                  onClick={() => navigate('/query/balance')}
                >
                  ตรวจสอบยอดคงเหลือสมาชิก
                </Button>

                <Button 
                  icon={<CalculatorOutlined />} 
                  block 
                  size="large"
                  style={{ height: 48, textAlign: 'left' }}
                  onClick={() => navigate('/closing/process')}
                >
                  ประมวลผลยอดคงเหลือใหม่ (สิ้นงวด)
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

    </div>
  )
} 