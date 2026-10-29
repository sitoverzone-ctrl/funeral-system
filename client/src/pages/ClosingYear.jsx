import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Space, message, Spin, Alert, Modal, Statistic, Row, Col } from 'antd'
import { CalendarOutlined, LockOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text, Paragraph } = Typography

export default function ClosingYear() {
  const { theme, user } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ตรวจสอบสิทธิ์: เฉพาะ Manager หรือ Dev เท่านั้น
  const userRole = user?.role || 'dev'
  const isManagerOrDev = userRole === 'manager' || userRole === 'dev' || user?.name?.includes('Dev') || user?.name?.includes('ผู้จัดการ')

  // State เก็บชื่อสมาคมจากหน้าข้อมูลหน่วยงาน
  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์ การเกษตรเซกา')

  const [loading, setLoading] = useState(false)
  const [lastYearClosed, setLastYearClosed] = useState(() => {
    return localStorage.getItem('funeral_last_closed_year') || '2568'
  })

  // โหลดชื่อสมาคมเมื่อเปิดหน้า
  useEffect(() => {
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
  }, [])

  const currentYearTh = dayjs().year() + 543

  const handleProcessYearClosing = () => {
    if (!isManagerOrDev) {
      message.error('ขออภัย! เฉพาะผู้จัดการ (Manager) หรือ Dev เท่านั้นที่มีสิทธิ์ทำการปิดสิ้นปีบัญชี')
      return
    }

    Modal.confirm({
      title: '⚠️ ยืนยันการปิดสิ้นปีบัญชี',
      content: `ระบบของ "${orgName}" จะทำการประมวลผลสรุปยอดบัญชีประจำปี และล็อกข้ามไปปีถัดไป คุณต้องการปิดสิ้นปีบัญชี ${currentYearTh} หรือไม่?`,
      okText: 'ยืนยันปิดสิ้นปี',
      okButtonProps: { danger: true },
      cancelText: 'ยกเลิก',
      onOk: () => {
        setLoading(true)
        setTimeout(() => {
          localStorage.setItem('funeral_last_closed_year', String(currentYearTh))
          setLastYearClosed(String(currentYearTh))

          setLoading(false)
          message.success(`ปิดสิ้นปีบัญชี พ.ศ. ${currentYearTh} ของ "${orgName}" เรียบร้อยแล้ว!`)
        }, 1200)
      }
    })
  }

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      <Card 
        title={<Space><CalendarOutlined style={{ color: primaryColor }} /><span>ประมวลผลปิดสิ้นปีบัญชี ({orgName})</span></Space>}
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${primaryColor}` }}
      >
        <Alert
          message="คำเตือนสำคัญ"
          description="การปิดสิ้นปีบัญชีเป็นการสรุปยอดเงินทั้งหมดประจำปี และจัดทำงบหน้าสะสมยอดไปปีถัดไป กรุณาตรวจสอบความถูกต้องของรายงานสรุปใบเสร็จและบัญชีแยกประเภทให้เรียบร้อยก่อนทำรายการ"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Statistic title="ปีบัญชีปัจจุบัน" value={currentYearTh} />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Statistic title="ปิดสิ้นปีล่าสุดพ.ศ." value={lastYearClosed} valueStyle={{ color: '#059669' }} />
            </div>
          </Col>
        </Row>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <Paragraph style={{ marginBottom: 8 }}>
            <Text strong>สถานะสิทธิ์ผู้ใช้งาน:</Text> <TagColor role={userRole} isAllowed={isManagerOrDev} />
          </Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>
            <Text type="secondary">ระบบความปลอดภัยจำกัดสิทธิ์เฉพาะผู้จัดการหรือ Dev เพื่อป้องกันการปิดบัญชีซ้ำซ้อน</Text>
          </Paragraph>
        </div>

        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Spin spinning={loading} tip="กำลังประมวลผลปิดสิ้นปีบัญชี...">
            <Button 
              type="primary" 
              danger
              size="large" 
              icon={<LockOutlined />} 
              onClick={handleProcessYearClosing}
              style={{ height: 45, paddingInline: 32, fontSize: 16 }}
            >
              ดำเนินการปิดสิ้นปีบัญชี พ.ศ. {currentYearTh}
            </Button>
          </Spin>
        </div>
      </Card>
    </div>
  )
}

function TagColor({ role, isAllowed }) {
  return (
    <span style={{ color: isAllowed ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
      {role?.toUpperCase()} ({isAllowed ? 'มีสิทธิ์ดำเนินการ' : 'จำกัดสิทธิ์'})
    </span>
  )
}