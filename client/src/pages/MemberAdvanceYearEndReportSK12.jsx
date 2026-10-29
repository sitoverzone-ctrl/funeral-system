import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, Select, InputNumber, Space, message, Divider } from 'antd'
import { PrinterOutlined, SyncOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberAdvanceYearEndReportSK12() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [orgInfo, setOrgInfo] = useState({})
  const [selectedYear, setSelectedYear] = useState(String(dayjs().year() + 543))

  const [prevAdvance, setPrevAdvance] = useState(0)       
  const [receivedAdvance, setReceivedAdvance] = useState(0) 
  const [deadCount, setDeadCount] = useState(0)           
  const [deadAmount, setDeadAmount] = useState(0)         
  const [refundCount, setRefundCount] = useState(0)       
  const [refundAmount, setRefundAmount] = useState(0)     

  const loadRealData = () => {
    try {
      const savedOrg = localStorage.getItem('funeral_organization_info')
      if (savedOrg) {
        setOrgInfo(JSON.parse(savedOrg))
      }

      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      const receipts = JSON.parse(localStorage.getItem('funeral_receipts')) || JSON.parse(localStorage.getItem('receipts')) || []
      const advancePayments = JSON.parse(localStorage.getItem('funeral_advance_payments')) || []

      const targetBuddhistYear = Number(selectedYear)
      
      const yearReceipts = receipts.filter(r => {
        if (!r.date) return false
        const rYear = dayjs(r.date).year() + 543
        return rYear === targetBuddhistYear
      })

      const totalReceiptAdvance = yearReceipts.reduce((sum, r) => sum + Number(r.advance || r.advanceAmount || 0), 0)
      const totalTableAdvance = advancePayments
        .filter(item => String(item.year) === String(targetBuddhistYear))
        .reduce((sum, item) => sum + Number(item.amount || item.advance || 0), 0)

      const calculatedReceived = totalReceiptAdvance > 0 ? totalReceiptAdvance : totalTableAdvance
      setReceivedAdvance(calculatedReceived)

      const deadInYear = members.filter(m => {
        const isDead = m.status === 'เสียชีวิต' || m.status === 'ตาย' || m.deathDate || m.statusDate
        if (!isDead) return false

        const rawDeathDate = m.deathDate || m.statusDate
        if (!rawDeathDate) return false
        const dYear = dayjs(rawDeathDate).year() + 543
        return dYear === targetBuddhistYear
      })

      setDeadCount(deadInYear.length)
      const calculatedDeadAmount = deadInYear.length * 1775 * 50
      setDeadAmount(calculatedDeadAmount > 0 ? calculatedDeadAmount : 0)
      setPrevAdvance(0)
      setRefundCount(0)
      setRefundAmount(0)

      message.success(`ซิงค์ข้อมูลประจำปี พ.ศ. ${selectedYear} สำเร็จ`)
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการซิงค์ข้อมูล')
    }
  }

  useEffect(() => {
    loadRealData()
  }, [selectedYear])

  const remainingAdvance = (Number(prevAdvance) + Number(receivedAdvance)) - (Number(deadAmount) + Number(refundAmount))

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์การพิมพ์: A4 แนวตั้ง ขยับชิดขอบด้านบนขึ้น ตัวหนังสือ 12pt */}
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
            left: 15mm;
            top: 8mm;
            width: calc(100% - 30mm);
            background: #fff !important;
            font-family: 'Sarabun', 'TH Sarabun PSK', Arial, sans-serif !important;
            font-size: 12pt !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <Card 
        title={
          <Space className="no-print">
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>รายงาน ส.ณ.ก.12 (รายการเงินสงเคราะห์ล่วงหน้าคงเหลือ ณ วันสิ้นปีปิดบัญชี)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* แผงควบคุมหน้าจอ (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#f8fafc', padding: 16, borderRadius: 6, marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>ประจำปี พ.ศ. (สิ้นปี 31 ธันวาคม)</Text>
              <Select 
                value={selectedYear} 
                onChange={setSelectedYear} 
                style={{ width: '100%' }}
                options={[
                  { value: '2570', label: '31 ธันวาคม 2570' },
                  { value: '2569', label: '31 ธันวาคม 2569' },
                  { value: '2568', label: '31 ธันวาคม 2568' },
                  { value: '2567', label: '31 ธันวาคม 2567' },
                ]}
              />
            </Col>
            <Col xs={24} md={8} style={{ paddingTop: 20 }}>
              <Button type="dashed" icon={<SyncOutlined />} onClick={loadRealData} style={{ width: '100%', fontWeight: 'bold' }}>
                ซิงค์ข้อมูลจริงจากระบบ
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Text strong>เงินสงเคราะห์ล่วงหน้าจากปีก่อนยกมา (บาท):</Text>
              <InputNumber value={prevAdvance} onChange={setPrevAdvance} style={{ width: '100%', marginTop: 4 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>รับเงินสงเคราะห์ล่วงหน้าระหว่างปี (บาท):</Text>
              <InputNumber value={receivedAdvance} onChange={setReceivedAdvance} style={{ width: '100%', marginTop: 4 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>สมาชิกตายระหว่างปี (ราย):</Text>
              <InputNumber value={deadCount} onChange={setDeadCount} style={{ width: '100%', marginTop: 4 }} />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>โอนจ่ายเป็นเงินสงเคราะห์ (บาท):</Text>
              <InputNumber value={deadAmount} onChange={setDeadAmount} style={{ width: '100%', marginTop: 4 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>จ่ายคืนเงินล่วงหน้าให้สมาชิก (ราย):</Text>
              <InputNumber value={refundCount} onChange={setRefundCount} style={{ width: '100%', marginTop: 4 }} />
            </Col>
            <Col xs={24} md={12}>
              <Text strong>จ่ายคืนเป็นเงิน (บาท):</Text>
              <InputNumber value={refundAmount} onChange={setRefundAmount} style={{ width: '100%', marginTop: 4 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Col>
          </Row>
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน A4 แนวตั้ง ชิดบน */}
        <div id="printable-report-area" style={{ background: '#fff', padding: '10px 30px', fontSize: '12pt', lineHeight: 2.1, maxWidth: '750px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'right', fontSize: '12pt', marginBottom: 10 }}>
            แบบ ส.ณ.ก.๑๒
          </div>

          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15pt', marginBottom: 6 }}>
            {orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์การเกษตรเซกา'}
          </div>

          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', marginBottom: 25, textDecoration: 'underline' }}>
            รายการเงินสงเคราะห์ล่วงหน้าคงเหลือ ณ วันสิ้นปีปิดบัญชี
          </div>

          <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>- เงินสงเคราะห์ล่วงหน้าจากปีก่อนยกมา</span>
              <span>จำนวน {Number(prevAdvance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>- รับเงินสงเคราะห์ล่วงหน้าระหว่างปี</span>
              <span>จำนวน {Number(receivedAdvance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>- โอนเงินสงเคราะห์ล่วงหน้าไปจ่ายเป็นเงินสงเคราะห์</span>
              <span>จำนวน ................................... บาท</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>- ให้สมาชิกที่ตายในระหว่างปี จำนวน <b>{deadCount}</b> ราย</span>
              <span>จำนวน {Number(deadAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>- จ่ายคืนเงินสงเคราะห์ล่วงหน้าให้สมาชิก จำนวน <b>{refundCount}</b> ราย</span>
              <span>จำนวน {Number(refundAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 'bold' }}>
              <span>- เงินสงเคราะห์ล่วงหน้าคงเหลือ ณ วันสิ้นปีปิดบัญชี</span>
              <span>จำนวน {Number(remainingAdvance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
            </div>

            <div style={{ marginTop: 15, textAlign: 'center', fontStyle: 'italic' }}>
              (31 ธันวาคม พ.ศ. {selectedYear})
            </div>
          </div>

          {/* ส่วนลงนาม จัดกึ่งกลางขวา */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40 }}>
            <div style={{ textAlign: 'center', width: '320px', fontSize: '12pt' }}>
              <div style={{ marginBottom: 30 }}>
                ลงชื่อ............................................................................<br />
                (............................................................)<br />
                นายกสมาคมฌาปนกิจสงเคราะห์
              </div>
            </div>
          </div>

        </div>

        {/* แถบปุ่มคำสั่งด้านล่าง (ซ่อนตอนพิมพ์) */}
        <Row justify="end" className="no-print" style={{ marginTop: 24 }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              onClick={() => window.print()} 
              style={{ background: '#334155', fontWeight: 'bold', minWidth: 100 }}
            >
              พิมพ์
            </Button>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => window.history.back()}
              style={{ fontWeight: 'bold', minWidth: 100 }}
            >
              ปิด
            </Button>
          </Space>
        </Row>
      </Card>
    </div>
  )
}