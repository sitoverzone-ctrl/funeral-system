import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Space, message, Spin, Alert, Modal } from 'antd'
import { ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text, Paragraph } = Typography

export default function ClosingProcess() {
  const { theme, user } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ตรวจสอบสิทธิ์: เฉพาะ Manager หรือ Dev เท่านั้น
  const userRole = user?.role || 'dev'
  const isManagerOrDev = userRole === 'manager' || userRole === 'dev' || user?.name?.includes('Dev') || user?.name?.includes('ผู้จัดการ')

  // State เก็บชื่อสมาคมจากหน้าข้อมูลหน่วยงาน
  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์ การเกษตรเซกา')

  const [loading, setLoading] = useState(false)
  const [lastProcessedDate, setLastProcessedDate] = useState(() => {
    return localStorage.getItem('funeral_last_closing_date') || '-'
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

  const handleProcessClosing = () => {
    if (!isManagerOrDev) {
      message.error('ขออภัย! เฉพาะผู้จัดการ (Manager) หรือ Dev เท่านั้นที่มีสิทธิ์ประมวลผลยอดคงเหลือใหม่')
      return
    }

    Modal.confirm({
      title: 'ยืนยันการประมวลผลยอดคงเหลือใหม่',
      content: `ระบบของ "${orgName}" จะทำการคำนวณและปิดยอดคงเหลือประจำงวดปัจจุบัน คุณต้องการดำเนินการต่อหรือไม่?`,
      okText: 'ยืนยันประมวลผล',
      cancelText: 'ยกเลิก',
      onOk: () => {
        setLoading(true)
        setTimeout(() => {
          // ดึงข้อมูลใบเสร็จทั้งหมดมาคำนวณยอดสะสมใหม่
          const rawReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || JSON.parse(localStorage.getItem('receipts')) || []
          const activeReceipts = rawReceipts.filter(item => !item.isCancelled)

          let totalAdvance = 0
          let totalWelfare = 0
          let totalRegister = 0
          let totalMaintenance = 0
          let totalOther = 0

          activeReceipts.forEach(item => {
            totalAdvance += Number(item.advance || item.advanceAmount || 0)
            totalWelfare += Number(item.welfare || item.welfareAmount || 0)
            totalRegister += Number(item.register || item.registerFee || 0)
            totalMaintenance += Number(item.maintenance || item.maintenanceFee || 0)
            totalOther += Number(item.other || 0)
          })

          // บันทึกยอดสรุปประจำงวดลง localStorage พร้อมผูกชื่อสมาคม
          const closingData = {
            orgName,
            processedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            totalAdvance,
            totalWelfare,
            totalRegister,
            totalMaintenance,
            totalOther,
            totalReceiptsCount: activeReceipts.length
          }

          localStorage.setItem('funeral_latest_closing_summary', JSON.stringify(closingData))
          const currentDateStr = dayjs().format('DD/MM/YYYY HH:mm:ss')
          localStorage.setItem('funeral_last_closing_date', currentDateStr)
          setLastProcessedDate(currentDateStr)

          setLoading(false)
          message.success('ประมวลผลยอดคงเหลือใหม่เรียบร้อยแล้ว!')
        }, 1000)
      }
    })
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      <Card 
        title={<Space><ReloadOutlined style={{ color: primaryColor }} /><span>ประมวลผลยอดคงเหลือใหม่ ({orgName})</span></Space>}
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${primaryColor}` }}
      >
        <Alert
          message="คำแนะนำการใช้งาน"
          description="ฟังก์ชันนี้ใช้สำหรับคำนวณและประมวลผลยอดคงเหลือประจำงวดของสมาชิกและบัญชีธนาคารทั้งหมด แนะนำให้ทำรายการนี้เมื่อสิ้นสุดรอบวันหรือสิ้นงวดบัญชี"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <Paragraph style={{ marginBottom: 8 }}>
            <Text strong>สถานะสิทธิ์ผู้ใช้งาน:</Text> <TagColor role={userRole} isAllowed={isManagerOrDev} />
          </Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>
            <Text strong>ประมวลผลล่าสุดเมื่อ:</Text> <Text type="success">{lastProcessedDate}</Text>
          </Paragraph>
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin spinning={loading} tip="กำลังประมวลผลยอดคงเหลือ...">
            <Button 
              type="primary" 
              size="large" 
              icon={<CheckCircleOutlined />} 
              onClick={handleProcessClosing}
              style={{ background: primaryColor, height: 45, paddingInline: 32, fontSize: 16 }}
            >
              เริ่มประมวลผลยอดคงเหลือใหม่
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