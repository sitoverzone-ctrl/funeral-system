import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  Input, 
  DatePicker, 
  Select, 
  Button, 
  Table, 
  Typography, 
  Row, 
  Col, 
  Space, 
  InputNumber,
  message 
} from 'antd'
import { 
  FileTextOutlined, 
  SearchOutlined, 
  PrinterOutlined, 
  CheckSquareOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function WarningLetterA4() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // State เก็บชื่อสมาคมจากหน้าข้อมูลหน่วยงาน
  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์')

  // ฟอร์มตั้งค่าหนังสือเตือน
  const [bookNo, setBookNo] = useState('')
  const [issueDate, setIssueDate] = useState(dayjs())
  const [warningYear, setWarningYear] = useState('2569')
  const [subject, setSubject] = useState('หนังสือเตือนประจำปี')
  const [dueDays, setDueDays] = useState(10)

  // ฟิลเตอร์
  const [groupFilter, setGroupFilter] = useState('')
  const [province, setProvince] = useState('ร้อยเอ็ด')

  // ตารางข้อมูลสมาชิก
  const [memberList, setMemberList] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // โหลดข้อมูลสมาชิกและชื่อสมาคมจาก LocalStorage
  const loadMembers = () => {
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

    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    let filtered = rawMembers.filter(m => m.status !== 'เสียชีวิต' && m.status !== 'ลาออก')

    if (groupFilter.trim()) {
      filtered = filtered.filter(m => String(m.group || m.villageGroup || '') === groupFilter.trim())
    }

    const formatted = filtered.map((m, index) => {
      const resolvedId = m.memberId || m.code || m.id || `M${index + 1}`
      const resolvedName = m.name || m.memberName || (m.firstName ? `${m.prefix || ''}${m.firstName} ${m.lastName || ''}` : `สมาชิก ${resolvedId}`)
      const resolvedGroup = m.group || m.villageGroup || '0'
      const resolvedAddress = m.address || `หมู่ ${m.moo || '1'} ต.${m.district || '-'} อ.${m.amphoe || '-'} จ.${m.province || province}`

      const realBalance = Number(m.balance || m.dueAmount || m.arrears || 0)

      return {
        key: resolvedId,
        memberId: resolvedId,
        memberName: resolvedName,
        group: resolvedGroup,
        address: resolvedAddress,
        totalPay: realBalance
      }
    })

    setMemberList(formatted)
    setSelectedRowKeys(formatted.map(i => i.key))
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleSelectAll = () => {
    if (selectedRowKeys.length === memberList.length) {
      setSelectedRowKeys([])
      message.info('ยกเลิกการเลือกทั้งหมดแล้ว')
    } else {
      setSelectedRowKeys(memberList.map(item => item.key))
      message.success('เลือกสมาชิกทั้งหมดแล้ว')
    }
  }

  const handlePrintNames = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('กรุณาเลือกรายการสมาชิกอย่างน้อย 1 รายการ')
      return
    }
    window.print()
  }

  const handlePrintLetters = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('กรุณาเลือกสมาชิกสำหรับพิมพ์หนังสือเตือน')
      return
    }
    window.print()
  }

  const columns = [
    { title: 'เลขที่สมาชิก', dataIndex: 'memberId', key: 'memberId', align: 'center', width: 100 },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 200 },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', align: 'center', width: 70 },
    { title: 'ที่อยู่', dataIndex: 'address', key: 'address', width: 240 },
    { title: 'ยอดที่ต้องชำระ (บาท)', dataIndex: 'totalPay', key: 'totalPay', align: 'right', width: 130, 
      render: v => <strong style={{ color: '#dc2626' }}>{Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> 
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  const selectedMembers = memberList.filter(m => selectedRowKeys.includes(m.key))
  const totalOutstanding = selectedMembers.reduce((sum, item) => sum + item.totalPay, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      {/* ส่วนฟอร์มตั้งค่า (ซ่อนตอนพิมพ์) */}
      <Card 
        className="no-print"
        title={<Space><FileTextOutlined style={{ color: primaryColor }} /><span>ออกหนังสือเตือน (A4)</span></Space>}
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>เลขที่หนังสือ</Text>
            <Input size="large" value={bookNo} onChange={e => setBookNo(e.target.value)} placeholder="ระบุเลขที่..." />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่ออกหนังสือ</Text>
            <DatePicker value={issueDate} onChange={setIssueDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ปีที่เตือน</Text>
            <Select value={warningYear} onChange={setWarningYear} style={{ width: '100%' }} size="large">
              <Option value="2569">2569</Option>
              <Option value="2568">2568</Option>
              <Option value="2567">2567</Option>
            </Select>
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>เรื่อง</Text>
            <Input size="large" value={subject} onChange={e => setSubject(e.target.value)} />
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>กำหนดชำระภายใน (วัน)</Text>
            <InputNumber value={dueDays} onChange={setDueDays} style={{ width: '100%' }} size="large" />
          </Col>
        </Row>
      </Card>

      {/* ฟิลเตอร์ (ซ่อนตอนพิมพ์) */}
      <Card className="no-print" size="small" style={{ borderRadius: 8, marginBottom: 16, background: '#f8fafc' }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={8}>
            <Text type="secondary">กลุ่ม</Text>
            <Input placeholder="ระบุกลุ่ม..." value={groupFilter} onChange={e => setGroupFilter(e.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary">จังหวัด</Text>
            <Select value={province} onChange={setProvince} style={{ width: '100%' }}>
              <Option value="ร้อยเอ็ด">ร้อยเอ็ด</Option>
              <Option value="บึงกาฬ">บึงกาฬ</Option>
            </Select>
          </Col>
          <Col xs={24} md={8} style={{ paddingTop: 18 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadMembers} style={{ background: primaryColor, width: '100%' }}>แสดงข้อมูล</Button>
          </Col>
        </Row>
      </Card>

      {/* ตารางแสดงรายการบนหน้าจอปกติ (ซ่อนตอนพิมพ์) */}
      <div className="no-print" style={{ background: '#fff', padding: 8 }}>
        <Table 
          dataSource={memberList} 
          columns={columns} 
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }} 
          size="small" 
          bordered 
          locale={{ emptyText: 'ยังไม่มีข้อมูลสมาชิก' }}
        />
      </div>

      {/* ส่วนสำหรับพิมพ์รายงานรายชื่อ (แสดงเฉพาะตอนพิมพ์) */}
      <div className="print-report-container" style={{ display: 'none', fontFamily: 'Sarabun, TH Sarabun PSK, Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: 15 }}>
          <div style={{ fontSize: '16pt', fontWeight: 'bold' }}>{orgName}</div>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: 4 }}>รายงานรายชื่อออกหนังสือเตือน ประจำปี {warningYear}</div>
          <div style={{ fontSize: '11pt', marginTop: 4 }}>เลขที่หนังสือ: {bookNo || '-'} | วันที่ออก: {issueDate ? issueDate.format('DD/MM/YYYY') : ''} | กำหนดชำระภายใน {dueDays} วัน</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', tableLayout: 'fixed' }} border="1">
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'center' }}>
              <th style={{ padding: '6px 4px', width: '7%' }}>ที่</th>
              <th style={{ padding: '6px 4px', width: '15%' }}>เลขที่สมาชิก</th>
              <th style={{ padding: '6px 4px', width: '28%' }}>ชื่อ - นามสกุล</th>
              <th style={{ padding: '6px 4px', width: '8%' }}>กลุ่ม</th>
              <th style={{ padding: '6px 4px', width: '27%' }}>ที่อยู่</th>
              <th style={{ padding: '6px 4px', width: '15%' }}>ยอดชำระ (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {selectedMembers.map((m, idx) => (
              <tr key={m.key}>
                <td style={{ textAlign: 'center', padding: '5px 4px', wordBreak: 'break-word' }}>{idx + 1}</td>
                <td style={{ textAlign: 'center', padding: '5px 4px', wordBreak: 'break-word' }}>{m.memberId}</td>
                <td style={{ padding: '5px 6px', wordBreak: 'break-word' }}>{m.memberName}</td>
                <td style={{ textAlign: 'center', padding: '5px 4px', wordBreak: 'break-word' }}>{m.group}</td>
                <td style={{ padding: '5px 6px', wordBreak: 'break-word', fontSize: '9.5pt' }}>{m.address}</td>
                <td style={{ textAlign: 'right', padding: '5px 6px', fontWeight: 'bold', wordBreak: 'break-word' }}>{m.totalPay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, textAlign: 'right', fontSize: '11pt', fontWeight: 'bold' }}>
          รวมยอดเงินที่ต้องชำระทั้งสิ้น: {totalOutstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
        </div>
      </div>

      {/* แผงควบคุมด้านล่าง (ซ่อนตอนพิมพ์) */}
      <Card className="no-print" size="small" style={{ marginTop: 16, borderRadius: 8, background: '#f8fafc' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space size="large">
              <Text>เลือก: <strong style={{ color: primaryColor }}>{selectedRowKeys.length}</strong> ราย</Text>
              <Text>ยอดที่ต้องชำระรวม: <strong style={{ color: '#dc2626' }}>{totalOutstanding.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> บาท</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button size="large" icon={<CheckSquareOutlined />} onClick={handleSelectAll}>
                เลือกทั้งหมด
              </Button>
              <Button size="large" icon={<PrinterOutlined />} onClick={handlePrintNames}>
                พิมพ์รายชื่อ
              </Button>
              <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={handlePrintLetters} style={{ background: '#059669' }}>
                พิมพ์หนังสือเตือน (A4)
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* สไตล์สำหรับการพิมพ์ A4 ไม่ให้ชิดขอบจนเกินไป */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-report-container, .print-report-container * {
            visibility: visible;
          }
          .print-report-container {
            display: block !important;
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
        }
      `}</style>

    </div>
  )
}