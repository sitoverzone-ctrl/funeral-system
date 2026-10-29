import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, Input, DatePicker, Space, message, InputNumber } from 'antd'
import { PrinterOutlined, FileTextOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberReportSK4() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ดึงข้อมูลหน่วยงานจาก localStorage (ถ้ามี) สำหรับชื่อสมาคมเริ่มต้น
  const [orgInfo, setOrgInfo] = useState({})
  const [reportDate, setReportDate] = useState(dayjs())
  const [regNo, setRegNo] = useState('')
  const [province, setProvince] = useState('บึงกาฬ')
  const [cashInHand, setCashInHand] = useState(0)
  
  // รายการบัญชีธนาคาร (เริ่มต้นเป็นค่าว่างให้ผู้ใช้กรอกเอง)
  const [bankAccounts, setBankAccounts] = useState([
    { key: 1, bankName: '', accountType: '', accountNumber: '', balance: 0 },
  ])

  // ผู้ลงนาม (นายกสมาคม)
  const [presidentName, setPresidentName] = useState('')

  useEffect(() => {
    try {
      const savedOrg = localStorage.getItem('funeral_organization_info')
      if (savedOrg) {
        const parsedOrg = JSON.parse(savedOrg)
        setOrgInfo(parsedOrg)
        if (parsedOrg.regNo || parsedOrg.registrationNo) {
          setRegNo(parsedOrg.regNo || parsedOrg.registrationNo)
        }
        if (parsedOrg.province) {
          setProvince(parsedOrg.province)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ฟังก์ชันจัดการเพิ่ม/ลบแถวบัญชีธนาคาร
  const handleAddRow = () => {
    setBankAccounts([
      ...bankAccounts,
      { key: Date.now(), bankName: '', accountType: '', accountNumber: '', balance: 0 }
    ])
  }

  const handleDeleteRow = (key) => {
    setBankAccounts(bankAccounts.filter(item => item.key !== key))
  }

  const handleRowChange = (key, field, value) => {
    setBankAccounts(bankAccounts.map(item => {
      if (item.key === key) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  // แปลงเดือนเป็นภาษาไทย
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  const reportDay = reportDate ? reportDate.date() : ''
  const reportMonth = reportDate ? thaiMonths[reportDate.month()] : ''
  const reportYear = reportDate ? reportDate.year() + 543 : ''

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์การพิมพ์ A4 แนวตั้ง ชิดขอบพอดีตามแบบฟอร์มราชการ ส.ณ.ก.4 */}
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
            left: 10mm;
            top: 10mm;
            width: calc(100% - 20mm);
            background: #fff !important;
            font-family: 'Sarabun', 'TH Sarabun PSK', Arial, sans-serif !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11pt !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
            color: #000 !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            text-align: center !important;
            font-weight: bold !important;
          }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <Card 
        title={
          <Space className="no-print">
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>จัดทำรายงาน ส.ณ.ก.4 (รายงานจำนวนเงินที่มีอยู่ในมือและธนาคาร)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* แผงฟอร์มกรอกข้อมูล (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#f8fafc', padding: 16, borderRadius: 6, marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>วันที่ออกรายงาน</Text>
              <DatePicker value={reportDate} onChange={setReportDate} format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Col>
            <Col xs={24} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>ทะเบียนเลขที่</Text>
              <Input value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="เช่น ๒๗/๒๖๘๙" />
            </Col>
            <Col xs={24} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>จังหวัด</Text>
              <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="เช่น บึงกาฬ" />
            </Col>
            <Col xs={24} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>ชื่อนายกสมาคม (ผู้ลงนาม)</Text>
              <Input value={presidentName} onChange={e => setPresidentName(e.target.value)} placeholder="ระบุชื่อ-นามสกุลผู้ลงนาม" />
            </Col>
            <Col xs={24} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>เงินสดในมือ (บาท)</Text>
              <InputNumber 
                value={cashInHand} 
                onChange={val => setCashInHand(val || 0)} 
                style={{ width: '100%' }} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Col>
            <Col xs={24} md={18} style={{ paddingTop: 20 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow} style={{ background: primaryColor, fontWeight: 'bold' }}>
                เพิ่มแถวบัญชีธนาคาร
              </Button>
            </Col>
          </Row>
        </div>

        {/* ตารางกรอกข้อมูลบัญชีธนาคารบนหน้าจอ (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8, color: primaryColor }}>กรอกรายละเอียดบัญชีธนาคาร:</Text>
          {bankAccounts.map((item, index) => (
            <Row gutter={[8, 8]} key={item.key} align="middle" style={{ marginBottom: 8, background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <Col xs={24} md={7}>
                <Input placeholder="ชื่อธนาคาร" value={item.bankName} onChange={e => handleRowChange(item.key, 'bankName', e.target.value)} />
              </Col>
              <Col xs={24} md={5}>
                <Input placeholder="ประเภทบัญชี (เช่น ออมทรัพย์)" value={item.accountType} onChange={e => handleRowChange(item.key, 'accountType', e.target.value)} />
              </Col>
              <Col xs={24} md={5}>
                <Input placeholder="เลขที่บัญชี" value={item.accountNumber} onChange={e => handleRowChange(item.key, 'accountNumber', e.target.value)} />
              </Col>
              <Col xs={24} md={5}>
                <InputNumber 
                  placeholder="ยอดเงินคงเหลือ" 
                  value={item.balance} 
                  onChange={val => handleRowChange(item.key, 'balance', val)} 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Col>
              <Col xs={24} md={2} style={{ textAlign: 'center' }}>
                <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteRow(item.key)} />
              </Col>
            </Row>
          ))}
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน A4 ตามแบบ ส.ณ.ก.4 ทางการ */}
        <div id="printable-report-area" style={{ background: '#fff', padding: '10px 20px', fontSize: '11pt', lineHeight: 1.6 }}>
          
          {/* หัวแบบ ส.ณ.ก.4 */}
          <div style={{ textAlign: 'right', fontSize: '11pt', marginBottom: 10 }}>
            แบบ ส.ณ.ก.๔
          </div>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', marginBottom: 4 }}>
            แบบการรายงานจำนวนเงินที่มีอยู่ในมือและธนาคาร
          </div>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', marginBottom: 25 }}>
            ตามพระราชบัญญัติการฌาปนกิจสงเคราะห์ พ.ศ. 2545
          </div>

          {/* ชื่อสมาคม และทะเบียนเลขที่ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: '11pt' }}>
            <span>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์......................................................'}</span>
            <span>ทะเบียนเลขที่ {regNo || '........................'} จังหวัด{province || '........................'}</span>
          </div>

          {/* ข้อ 1 & 2 */}
          <div style={{ marginBottom: 12 }}>
            1. จำนวนเงินที่มีอยู่ในมือ ณ วันที่ {reportDay || '.......'} {reportMonth || '................................'} พ.ศ. {reportYear || '............'}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            มีจำนวน {cashInHand > 0 ? cashInHand.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '....................................................'} บาท
          </div>
          <div style={{ marginBottom: 15 }}>
            2. จำนวนเงินฝากธนาคาร ณ วันที่ {reportDay || '.......'} {reportMonth || '................................'} พ.ศ. {reportYear || '............'}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; มีดังนี้
          </div>

          {/* ตารางแสดงธนาคาร */}
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 25, fontSize: '11pt' }} border="1">
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'center' }}>
                <th style={{ padding: '8px', width: '35%' }}>ธนาคาร</th>
                <th style={{ padding: '8px', width: '20%' }}>ประเภท</th>
                <th style={{ padding: '8px', width: '25%' }}>เลขที่บัญชี</th>
                <th style={{ padding: '8px', width: '20%' }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.length > 0 ? (
                bankAccounts.map((acc, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px 8px' }}>{acc.bankName || '&nbsp;'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{acc.accountType || '&nbsp;'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{acc.accountNumber || '&nbsp;'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      {acc.balance !== 0 ? Number(acc.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '&nbsp;'}
                    </td>
                  </tr>
                ))
              ) : null}
              {/* แถวว่างเสริมให้ฟอร์มดูเต็มตามแบบฟอร์มกระดาษทางการ หากมีน้อยกว่า 4 แถว */}
              {Array.from({ length: Math.max(0, 4 - bankAccounts.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`}>
                  <td style={{ padding: '14px 8px' }}>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ข้อความรับรอง */}
          <div style={{ marginBottom: 40, textIndent: '40px', textAlign: 'justify', fontSize: '11pt', lineHeight: 1.8 }}>
            ทั้งนี้ ได้แนบสำเนาสมุดเงินสดที่มียอด ณ วันที่ {reportDay || '.......'} {reportMonth || '................................'} พ.ศ. {reportYear || '............'} ตามข้อ (1) และสำเนาสมุดเงินฝากธนาคารที่มียอด ณ วันที่ {reportDay || '.......'} {reportMonth || '................................'} พ.ศ. {reportYear || '............'} ตามข้อ (2) มาพร้อมนี้ และรับรองสำเนาไว้เรียบร้อยแล้ว
          </div>

          {/* ส่วนลงนาม */}
          <div style={{ float: 'right', width: '320px', textAlign: 'center', fontSize: '11pt', marginTop: 10 }}>
            <div style={{ marginBottom: 35 }}>
              ลงชื่อ ............................................................................ นายกสมาคม หรือ<br />
              ({presidentName || '............................................................'}) กรรมการผู้ได้รับมอบหมาย
            </div>
            <div>
              วันที่ ............ เดือน ............................................ พ.ศ. ................
            </div>
          </div>
          <div style={{ clear: 'both' }}></div>

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