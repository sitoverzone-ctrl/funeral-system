import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, DatePicker, Button, Typography, Row, Col, Input, Space, message } from 'antd'
import { PrinterOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberSummaryReport() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ดึงชื่อสมาคมจาก LocalStorage
  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์')

  // ช่วงวันที่เลือก (เริ่มต้น: ต้นเดือนปัจจุบัน, ถึง: สิ้นเดือนปัจจุบัน)
  const [startDate, setStartDate] = useState(dayjs().startOf('month'))
  const [endDate, setEndDate] = useState(dayjs().endOf('month'))

  // สถิติสมาชิกทั้งหมด (เริ่มต้นเป็น 0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [eligibleMembers, setEligibleMembers] = useState(0)
  const [totalNewMembers, setTotalNewMembers] = useState(0)

  // สถิติตามช่วงวันที่ (เริ่มต้นเป็น 0)
  const [periodStats, setPeriodStats] = useState({
    newMembers: 0,
    resigned: 0,
    dismissed: 0,
    passedAway: 0,
    passedAwayBeforeEligible: 0,
    rejected: 0,
  })

  // ฟังก์ชันคำนวณและประมวลผลข้อมูลสมาชิกจาก localStorage จริง 100%
  const calculateReport = () => {
    try {
      const savedOrg = localStorage.getItem('funeral_organization_info')
      if (savedOrg) {
        const parsedOrg = JSON.parse(savedOrg)
        if (parsedOrg.name) setOrgName(parsedOrg.name)
      }

      const savedMembers = JSON.parse(localStorage.getItem('funeral_members')) || []

      // 1. คำนวณภาพรวมสมาชิกทั้งหมดในระบบจากข้อมูลจริง
      setTotalMembers(savedMembers.length)
      setEligibleMembers(savedMembers.filter(m => m.isEligible !== false && m.status !== 'ไม่ผ่านอนุมัติ').length)
      
      // สมาชิกใหม่ทั้งหมด (นับจากปีปัจจุบันที่สมัคร)
      const currentYear = dayjs().year()
      setTotalNewMembers(savedMembers.filter(m => m.registerDate && dayjs(m.registerDate).year() === currentYear).length)

      // 2. คำนวณช่วงวันที่ตามเงื่อนไขที่เลือก
      let newCount = 0
      let resignCount = 0
      let dismissCount = 0
      let deadCount = 0
      let deadBeforeEligibleCount = 0
      let rejectCount = 0

      savedMembers.forEach(m => {
        const regDate = m.registerDate ? dayjs(m.registerDate) : null
        const actionDate = m.statusDate ? dayjs(m.statusDate) : regDate

        // ตรวจสอบสมาชิกใหม่ช่วงวันที่
        if (regDate && (regDate.isAfter(startDate.startOf('day')) || regDate.isSame(startDate.startOf('day'))) && 
                    (regDate.isBefore(endDate.endOf('day')) || regDate.isSame(endDate.endOf('day')))) {
          newCount++
        }

        // ตรวจสอบสถานะอื่นๆ ตามช่วงวันที่
        if (actionDate && (actionDate.isAfter(startDate.startOf('day')) || actionDate.isSame(startDate.startOf('day'))) && 
                          (actionDate.isBefore(endDate.endOf('day')) || actionDate.isSame(endDate.endOf('day')))) {
          if (m.status === 'ลาออก') resignCount++
          if (m.status === 'ให้ออก' || m.status === 'ถูกให้ออก') dismissCount++
          if (m.status === 'เสียชีวิต' || m.status === 'ตาย') deadCount++
          if (m.status === 'เสียชีวิตก่อนรับสิทธิ์') deadBeforeEligibleCount++
          if (m.status === 'ไม่ผ่านอนุมัติ') rejectCount++
        }
      })

      setPeriodStats({
        newMembers: newCount,
        resigned: resignCount,
        dismissed: dismissCount,
        passedAway: deadCount,
        passedAwayBeforeEligible: deadBeforeEligibleCount,
        rejected: rejectCount,
      })

      message.success('ซิงค์ข้อมูลสรุปสมาชิกตามฐานข้อมูลจริงเรียบร้อย')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก')
    }
  }

  // โหลดและซิงค์ข้อมูลทันทีที่เปิดหน้า และคอยฟัง Event เมื่อมีการเปลี่ยนข้อมูลใน localStorage
  useEffect(() => {
    calculateReport()

    const handleStorageChange = () => calculateReport()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [startDate, endDate])

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', padding: 16 }}>
      
      {/* กรอบหลักภายนอก */}
      <Card 
        bodyStyle={{ background: '#bae6fd', padding: 16, borderRadius: 8 }}
        style={{ borderRadius: 10, border: '2px solid #0284c7', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        {/* แถบเลือกช่วงวันที่ (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#e0f2fe', padding: '12px 16px', borderRadius: 6, marginBottom: 16, border: '1px solid #7dd3fc', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Text strong style={{ color: '#0369a1' }}>วันที่ตั้งแต่</Text>
          <DatePicker 
            value={startDate} 
            onChange={(d) => d && setStartDate(d)} 
            format="D MMMM YYYY" 
            style={{ width: 180, fontWeight: 'bold' }} 
          />
          <Text strong style={{ color: '#0369a1' }}>ถึงวันที่</Text>
          <DatePicker 
            value={endDate} 
            onChange={(d) => d && setEndDate(d)} 
            format="D MMMM YYYY" 
            style={{ width: 180, fontWeight: 'bold' }} 
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={calculateReport}
            style={{ background: '#0284c7', fontWeight: 'bold' }}
          >
            แสดงข้อมูล
          </Button>
        </div>

        {/* ส่วนพื้นที่ที่จะสั่งพิมพ์ */}
        <div id="printable-report-area">
          <div className="print-header" style={{ textAlign: 'center', marginBottom: 16, display: 'none' }}>
            <div style={{ fontSize: '16pt', fontWeight: 'bold' }}>{orgName}</div>
            <div style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: 4 }}>รายงานสรุปสถิติข้อมูลสมาชิก</div>
            <div style={{ fontSize: '10.5pt', marginTop: 4 }}>
              ตั้งแต่วันที่ {startDate.format('D MMMM YYYY')} ถึงวันที่ {endDate.format('D MMMM YYYY')}
            </div>
          </div>

          {/* กล่องเนื้อหารายงาน */}
          <div style={{ background: '#e0f2fe', padding: 20, borderRadius: 8, border: '1px solid #7dd3fc' }}>
            
            {/* กรอบกลุ่ม 1: สมาชิกทั้งหมด */}
            <fieldset style={{ border: '1px solid #38bdf8', borderRadius: 8, padding: '12px 24px 20px 24px', marginBottom: 20, background: '#f0f9ff' }}>
              <legend style={{ width: 'auto', padding: '0 10px', color: '#0369a1', fontWeight: 'bold', fontSize: 15 }}>
                สมาชิกทั้งหมด
              </legend>
              
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกทั้งหมด</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={totalMembers.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16, color: '#0f172a', background: '#fff' }} />
                  </Col>
                </Row>

                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกได้รับสิทธิ์ทั้งหมด</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={eligibleMembers.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16, color: '#0f172a', background: '#fff' }} />
                  </Col>
                </Row>

                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกใหม่ทั้งหมด</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={totalNewMembers.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16, color: '#0f172a', background: '#fff' }} />
                  </Col>
                </Row>
              </Space>
            </fieldset>

            {/* กรอบกลุ่ม 2: สมาชิกในช่วงวันที่ตามเงื่อนไขที่เลือก */}
            <fieldset style={{ border: '1px solid #38bdf8', borderRadius: 8, padding: '12px 24px 20px 24px', background: '#f0f9ff' }}>
              <legend style={{ width: 'auto', padding: '0 10px', color: '#0369a1', fontWeight: 'bold', fontSize: 15 }}>
                สมาชิกในช่วงวันที่ตามเงื่อนไขที่เลือก
              </legend>

              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกใหม่ในช่วงวันที่</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={periodStats.newMembers.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 15, background: '#fff' }} />
                  </Col>
                </Row>

                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกลาออกช่วงวันที่</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={periodStats.resigned.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 15, background: '#fff' }} />
                  </Col>
                </Row>

                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกถูกให้ออกช่วงวันที่</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={periodStats.dismissed.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 15, background: '#fff' }} />
                  </Col>
                </Row>

                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกตายในช่วงวันที่</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={periodStats.passedAway.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 15, background: '#fff' }} />
                  </Col>
                </Row>

                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกตายก่อนรับสิทธิ์ช่วงวันที่</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={periodStats.passedAwayBeforeEligible.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 15, background: '#fff' }} />
                  </Col>
                </Row>

                <Row align="middle" justify="end">
                  <Col span={14} style={{ textAlign: 'right', paddingRight: 16 }}>
                    <Text strong style={{ color: '#1e293b' }}>จำนวนสมาชิกไม่ผ่านอนุมัติในช่วงวันที่</Text>
                  </Col>
                  <Col span={8}>
                    <Input value={periodStats.rejected.toLocaleString()} readOnly style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 15, background: '#fff' }} />
                  </Col>
                </Row>
              </Space>
            </fieldset>

          </div>
        </div>

        {/* แถบปุ่มคำสั่งด้านล่าง (ซ่อนตอนพิมพ์) */}
        <Row justify="end" className="no-print" style={{ marginTop: 16, gap: 12 }}>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={() => window.print()} 
            style={{ background: '#334155', minWidth: 100, fontWeight: 'bold' }}
          >
            พิมพ์
          </Button>
          <Button 
            icon={<CloseOutlined />} 
            onClick={() => window.history.back()}
            style={{ minWidth: 100, fontWeight: 'bold' }}
          >
            ปิด
          </Button>
        </Row>
      </Card>

      {/* สไตล์การพิมพ์ A4 แนวตั้ง ไม่ชิดขอบ และซ่อนแถบเมนูด้านบน */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 12mm;
            top: 12mm;
            width: calc(100% - 24mm);
            background: #fff !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}