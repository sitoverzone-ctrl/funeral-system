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
  PrinterOutlined, 
  SearchOutlined, 
  FileTextOutlined, 
  CheckSquareOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function WarningLetter() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // State เก็บชื่อสมาคมจากหน้าข้อมูลหน่วยงาน
  const [orgName, setOrgName] = useState('สมาคมฌาปนกิจสงเคราะห์')

  // ฟอร์มตั้งค่าหนังสือเตือน
  const [docNo, setDocNo] = useState('')
  const [docDate, setDocDate] = useState(dayjs())
  const [warningYear, setWarningYear] = useState(String(dayjs().year() + 543))
  const [subject, setSubject] = useState('จดหมายแจ้งเตือนประจำปี')
  const [dueDays, setDueDays] = useState(10)
  const [annualRate, setAnnualRate] = useState(1500)
  const [maintenance, setMaintenance] = useState(50)
  const [corpseCount, setCorpseCount] = useState(0)

  // ตัวกรองการค้นหา
  const [filterMemberId, setFilterMemberId] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterMinBalance, setFilterMinBalance] = useState('')
  const [filterMinDue, setFilterMinDue] = useState('')
  const [filterProvince, setFilterProvince] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterMoo, setFilterMoo] = useState('')

  const [membersList, setMembersList] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // โหลดข้อมูลสมาชิกและชื่อสมาคมทั้งหมดจาก localStorage จริง
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

    const formatted = rawMembers.map((m, index) => {
      const mId = String(m.id || m.memberId || m.code || `M${index + 1}`)
      const fullName = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'
      const groupCode = m.group || m.groupId || m.village || '1'
      const prov = m.province || ''
      const dist = m.district || m.amphoe || ''
      const mooNo = m.moo || ''
      const bal = Number(m.balance !== undefined ? m.balance : (m.advance !== undefined ? m.advance : 0))
      const due = Number(m.dueAmount || m.arrears || 0)

      return {
        key: mId,
        memberId: mId,
        memberName: fullName,
        group: groupCode,
        province: prov,
        district: dist,
        moo: mooNo,
        balance: bal,
        dueAmount: due
      }
    })

    setMembersList(formatted)
    setSelectedRowKeys(formatted.map(item => item.key))
  }

  useEffect(() => {
    loadMembers()
  }, [])

  // กรองข้อมูลตามเงื่อนไข
  const filteredData = membersList.filter(item => {
    if (filterMemberId && !String(item.memberId).includes(filterMemberId)) return false
    if (filterGroup && String(item.group) !== filterGroup) return false
    if (filterProvince && !String(item.province).includes(filterProvince)) return false
    if (filterDistrict && !String(item.district).includes(filterDistrict)) return false
    if (filterMoo && String(item.moo) !== filterMoo) return false
    if (filterMinBalance !== '' && Number(item.balance) > Number(filterMinBalance)) return false
    if (filterMinDue !== '' && Number(item.dueAmount) < Number(filterMinDue)) return false
    return true
  })

  const handleSelectAll = () => {
    if (selectedRowKeys.length === filteredData.length) {
      setSelectedRowKeys([])
    } else {
      setSelectedRowKeys(filteredData.map(item => item.key))
    }
  }

  const handlePrintList = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('กรุณาเลือกรายการสมาชิกอย่างน้อย 1 รายชื่อเพื่อพิมพ์รายชื่อ')
      return
    }
    window.print()
  }

  const handlePrintLetters = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('กรุณาเลือกรายการสมาชิกอย่างน้อย 1 รายชื่อเพื่อพิมพ์หนังสือเตือน')
      return
    }
    message.success(`กำลังเตรียมพิมพ์หนังสือเตือนจำนวน ${selectedRowKeys.length} ฉบับ...`)
    window.print()
  }

  const columns = [
    { title: 'เลขที่สมาชิก', dataIndex: 'memberId', key: 'memberId', align: 'center', width: 90 },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 180 },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', align: 'center', width: 70 },
    { title: 'หมู่ที่', dataIndex: 'moo', key: 'moo', align: 'center', width: 60 },
    { title: 'ตำบล/อำเภอ (จังหวัด)', key: 'address', width: 150, render: (_, r) => `${r.district ? r.district : '-'}${r.province ? ' (' + r.province + ')' : ''}` },
    { title: 'คงเหลือ (บาท)', dataIndex: 'balance', key: 'balance', align: 'right', render: v => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), width: 110 },
    { title: 'ต้องชำระ (บาท)', dataIndex: 'dueAmount', key: 'dueAmount', align: 'right', render: v => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), width: 110 }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      {/* ส่วนหัวข้อและฟอร์มตั้งค่า (ซ่อนตอนพิมพ์) */}
      <Card 
        className="no-print"
        title={<Space><FileTextOutlined style={{ color: primaryColor }} /><span>ออกหนังสือแจ้งเตือนประจำปี</span></Space>}
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={[16, 12]}>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>เลขที่หนังสือ</Text>
            <Input placeholder="ระบุเลขที่หนังสือ..." value={docNo} onChange={e => setDocNo(e.target.value)} />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>วันที่ออกหนังสือ</Text>
            <DatePicker value={docDate} onChange={setDocDate} format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>ปีที่เตือน</Text>
            <Input value={warningYear} onChange={e => setWarningYear(e.target.value)} />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>กำหนดชำระ (วัน)</Text>
            <InputNumber value={dueDays} onChange={setDueDays} style={{ width: '100%' }} />
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>เรื่อง</Text>
            <Input value={subject} onChange={e => setSubject(e.target.value)} />
          </Col>
          <Col xs={24} md={4}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>อัตราชำระรายปี</Text>
            <InputNumber value={annualRate} onChange={setAnnualRate} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={4}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>ค่าบำรุง</Text>
            <InputNumber value={maintenance} onChange={setMaintenance} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={4}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>จำนวนศพ</Text>
            <InputNumber value={corpseCount} onChange={setCorpseCount} style={{ width: '100%' }} />
          </Col>
        </Row>
      </Card>

      {/* แผงตัวกรองค้นหา (ซ่อนตอนพิมพ์) */}
      <Card className="no-print" size="small" style={{ borderRadius: 8, marginBottom: 16, background: '#f8fafc' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Space>
              <Text strong>เลขสมาชิก:</Text>
              <Input placeholder="เช่น 1, M01" value={filterMemberId} onChange={e => setFilterMemberId(e.target.value)} style={{ width: 120 }} />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Text strong>กลุ่ม:</Text>
              <Input placeholder="กลุ่ม..." value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={{ width: 100 }} />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Text strong>คงเหลือน้อยกว่า:</Text>
              <Input placeholder="จำนวนเงิน" value={filterMinBalance} onChange={e => setFilterMinBalance(e.target.value)} style={{ width: 100 }} />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Text strong>ต้องชำระ:</Text>
              <Input placeholder="จำนวนเงิน" value={filterMinDue} onChange={e => setFilterMinDue(e.target.value)} style={{ width: 100 }} />
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space>
              <Text strong>จังหวัด:</Text>
              <Input placeholder="จังหวัด..." value={filterProvince} onChange={e => setFilterProvince(e.target.value)} style={{ width: 130 }} />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Text strong>อำเภอ:</Text>
              <Input placeholder="อำเภอ..." value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} style={{ width: 120 }} />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Text strong>หมู่:</Text>
              <Input placeholder="หมู่..." value={filterMoo} onChange={e => setFilterMoo(e.target.value)} style={{ width: 100 }} />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadMembers} style={{ background: primaryColor, width: '100%' }}>
              แสดงข้อมูล
            </Button>
          </Col>
        </Row>
      </Card>

      {/* พื้นที่แสดงตารางและหัวกระดาษสำหรับพิมพ์ */}
      <div id="printable-report" style={{ background: '#fff', padding: 4 }}>
        <div className="print-header" style={{ textAlign: 'center', marginBottom: 20, display: 'none' }}>
          <Text strong style={{ fontSize: 16, display: 'block' }}>{orgName}</Text>
          <Text strong style={{ fontSize: 14 }}>รายชื่อสมาชิกรับหนังสือแจ้งเตือนประจำปี พ.ศ. {warningYear}</Text>
        </div>

        <Table 
          dataSource={filteredData} 
          columns={columns} 
          rowSelection={rowSelection}
          pagination={false} 
          size="small" 
          bordered 
          locale={{ emptyText: 'ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่กำหนด' }}
        />
      </div>

      {/* แผงควบคุมด้านล่าง (ซ่อนตอนพิมพ์) */}
      <Card className="no-print" size="small" style={{ marginTop: 16, borderRadius: 8, background: '#f1f5f9' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Text>เลือก: <strong style={{ color: primaryColor }}>{selectedRowKeys.length}</strong> ราย</Text>
              <Text>คงเหลือรวม: <strong>{filteredData.reduce((s, i) => s + i.balance, 0).toLocaleString()}</strong></Text>
              <Text>ค้างชำระรวม: <strong>{filteredData.reduce((s, i) => s + i.dueAmount, 0).toLocaleString()}</strong></Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<CheckSquareOutlined />} onClick={handleSelectAll}>
                เลือกทั้งหมด
              </Button>
              <Button icon={<PrinterOutlined />} onClick={handlePrintList}>
                พิมพ์รายชื่อ
              </Button>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintLetters} style={{ background: primaryColor }}>
                พิมพ์หนังสือเตือน
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* สไตล์สำหรับการพิมพ์ (ซ่อนแถบเมนู และตั้งค่าหน้า A4 ไม่ให้ชิดขอบจนเกินไป) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 10mm;
            top: 10mm;
            width: calc(100% - 20mm);
            background: #fff !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          .ant-table {
            font-size: 9pt !important;
          }
          .ant-table-thead > tr > th {
            background: #f1f5f9 !important;
            color: #000 !important;
            font-weight: bold !important;
          }
        }
      `}</style>

    </div>
  )
}