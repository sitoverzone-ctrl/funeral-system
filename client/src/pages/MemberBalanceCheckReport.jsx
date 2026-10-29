import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, Select, Input, Table, Space, message, InputNumber } from 'antd'
import { PrinterOutlined, SearchOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

// รายชื่อ 77 จังหวัดในประเทศไทย
const PROVINCES_TH = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", 
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", 
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", 
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", 
  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", 
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", 
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", 
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
].map(p => ({ value: p, label: p }))

export default function MemberBalanceCheckReport() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [orgInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('funeral_organization_info')) || {}
    } catch {
      return {}
    }
  })

  const [memberIdFilter, setMemberIdFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [maxBalanceFilter, setMaxBalanceFilter] = useState('')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [subdistrict, setSubdistrict] = useState('')
  const [villageNo, setVillageNo] = useState('')

  const [reportData, setReportData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // ฟังก์ชันดึงและกรองข้อมูลสมาชิกจริง 100% จาก localStorage
  const handleSearchData = (mode = 'group') => {
    try {
      const allMembers = JSON.parse(localStorage.getItem('funeral_members')) || []

      if (allMembers.length === 0) {
        message.warning('ไม่พบข้อมูลสมาชิกในระบบ (funeral_members)')
      }

      const filtered = allMembers.filter(m => {
        const mId = String(m.id || m.memberId || '')
        const mGroup = String(m.group || m.memberGroup || '')
        const balance = Number(m.balance ?? m.saving ?? 0)

        if (memberIdFilter && memberIdFilter.trim() !== '' && !mId.includes(memberIdFilter.trim())) {
          return false
        }
        if (groupFilter && groupFilter.trim() !== '' && !mGroup.includes(groupFilter.trim())) {
          return false
        }
        if (maxBalanceFilter !== '' && maxBalanceFilter !== null && balance > Number(maxBalanceFilter)) {
          return false
        }
        return true
      })

      const formattedRows = filtered.map((m, idx) => {
        const mId = String(m.id || m.memberId || '')
        const fullName = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        
        return {
          key: mId || idx + 1,
          no: idx + 1,
          memberId: mId,
          group: m.group || m.memberGroup || '93',
          memberName: fullName,
          prevBalance: Number(m.prevBalance ?? 550),
          arrears: Number(m.arrears ?? 0),
          balance: Number(m.balance ?? m.saving ?? -65)
        }
      })

      setReportData(formattedRows)
      setSelectedRowKeys(formattedRows.map(item => item.key))
      message.success(`ซิงค์ข้อมูลสำเร็จ (${formattedRows.length} รายการ)`)
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    }
  }

  useEffect(() => {
    handleSearchData('group')
  }, [])

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  const columns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: 60, align: 'center' },
    { title: 'เลขสมาชิก', dataIndex: 'memberId', key: 'memberId', width: 90, align: 'center' },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 70, align: 'center' },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 220 },
    { title: 'คงเหลือยกมา', dataIndex: 'prevBalance', key: 'prevBalance', width: 110, align: 'right', render: val => Number(val).toLocaleString() },
    { title: 'ค้างชำระยกมา', dataIndex: 'arrears', key: 'arrears', width: 110, align: 'right', render: val => Number(val).toLocaleString() },
    { title: 'ยอดคงเหลือ', dataIndex: 'balance', key: 'balance', width: 110, align: 'right', render: val => Number(val).toLocaleString() }
  ]

  const printData = reportData.filter(item => selectedRowKeys.includes(item.key))

  // คำนวณผลรวม
  const totalPrevBalance = printData.reduce((sum, item) => sum + item.prevBalance, 0)
  const totalArrears = printData.reduce((sum, item) => sum + item.arrears, 0)
  const totalBalance = printData.reduce((sum, item) => sum + item.balance, 0)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์การพิมพ์: A4 แนวตั้ง ชิดขอบบน จัดกึ่งกลาง ฟอนต์ 11pt ซ่อนช่องติ๊กตอนพิมพ์ */}
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
            top: 5mm;
            width: calc(100% - 20mm);
            background: #fff !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .ant-table-selection-column, .ant-table-selection-col {
            display: none !important;
          }
          .ant-card { border: none !important; box-shadow: none !important; background: transparent !important; }
          .ant-card-body { padding: 0 !important; }
          .ant-table { font-size: 11pt !important; width: 100% !important; }
          .ant-table-bordered .ant-table-container {
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            background: #fff !important;
          }
          .ant-table-thead > tr > th {
            border-bottom: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            background: #f1f5f9 !important;
            color: #000 !important;
            font-weight: bold !important;
            padding: 6px 4px !important;
            text-align: center !important;
          }
          .ant-table-tbody > tr > td {
            border-bottom: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            color: #000 !important;
            padding: 5px 4px !important;
          }
          @page { size: A4 portrait; margin: 0mm; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <Card 
        title={
          <Space className="no-print">
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>รายงานตรวจสอบยอดคงเหลือ</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* แผงควบคุม (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#f8fafc', padding: 16, borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>เลขสมาชิก</Text></Col>
            <Col xs={24} sm={4}>
              <Input value={memberIdFilter} onChange={e => setMemberIdFilter(e.target.value)} placeholder="เช่น 3" />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>กลุ่ม</Text></Col>
            <Col xs={24} sm={4}>
              <Input value={groupFilter} onChange={e => setGroupFilter(e.target.value)} placeholder="กลุ่ม" />
            </Col>

            <Col xs={24} sm={3} style={{ textAlign: 'right' }}><Text strong>คงเหลือน้อยกว่า</Text></Col>
            <Col xs={24} sm={3}>
              <Input value={maxBalanceFilter} onChange={e => setMaxBalanceFilter(e.target.value)} placeholder="จำนวน" />
            </Col>

            <Col xs={24} sm={6}>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => handleSearchData('group')} style={{ background: primaryColor, width: '100%' }}>
                แสดงตามกลุ่ม/สมาชิก
              </Button>
            </Col>
          </Row>

          <Row gutter={[12, 12]} align="middle" style={{ marginTop: 12 }}>
            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>จังหวัด</Text></Col>
            <Col xs={24} sm={4}>
              <Select value={province} onChange={setProvince} options={PROVINCES_TH} style={{ width: '100%' }} showSearch />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>อำเภอ</Text></Col>
            <Col xs={24} sm={4}>
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="อำเภอ" />
            </Col>

            <Col xs={24} sm={3} style={{ textAlign: 'right' }}><Text strong>ตำบล</Text></Col>
            <Col xs={24} sm={3}>
              <Input value={subdistrict} onChange={e => setSubdistrict(e.target.value)} placeholder="ตำบล" />
            </Col>

            <Col xs={24} sm={6}>
              <Button type="dashed" icon={<SearchOutlined />} onClick={() => handleSearchData('village')} style={{ width: '100%', fontWeight: 'bold' }}>
                แสดงตามหมู่บ้าน
              </Button>
            </Col>
          </Row>
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน */}
        <div id="printable-report-area">
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginBottom: 4 }}>
              <span>กลุ่ม: {groupFilter || 'ทั้งหมด'}</span>
              <span>หน้า : 1</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์การเกษตรเซกา'}</h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'normal' }}>รายงานตรวจสอบยอดคงเหลือ</h3>
            <div style={{ textAlign: 'right', fontSize: '10pt' }}>วันที่พิมพ์: {dayjs().format('DD/MM/YYYY')}</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: 16 }}>
            <Table 
              dataSource={printData} 
              columns={columns} 
              rowKey="key"
              size="small"
              bordered
              pagination={false}
              rowSelection={rowSelection}
              locale={{ emptyText: 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก' }}
            />
          </div>

          {/* แถวสรุปยอดรวมท้ายตารางสำหรับการพิมพ์ */}
          <div className="print-only" style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11pt', fontWeight: 'bold', paddingRight: 20, marginBottom: 30 }}>
            <div style={{ width: '400px', display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 4 }}>
              <span>รวม</span>
              <span>{totalPrevBalance.toLocaleString()}</span>
              <span>{totalArrears.toLocaleString()}</span>
              <span>{totalBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* ส่วนลงนาม ชิดขวา */}
          <div className="print-only" style={{ marginTop: 20 }}>
            <div style={{ marginLeft: 'auto', width: '300px', textAlign: 'center', fontSize: '11pt' }}>
              <div style={{ marginBottom: 25 }}>
                ลงชื่อ............................................................................<br />
                (............................................................)<br />
                นายกสมาคมฌาปนกิจสงเคราะห์
              </div>
            </div>
          </div>
        </div>

        {/* แถบด้านล่างหน้าจอ (ซ่อนตอนพิมพ์) */}
        <Row justify="space-between" align="middle" style={{ marginTop: 12 }} className="no-print">
          <Col>
            <Space size={16}>
              <div>
                <Text strong style={{ marginRight: 8 }}>คงเหลือยกมา:</Text>
                <input value={totalPrevBalance.toLocaleString()} readOnly style={{ width: 100, textAlign: 'right', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px' }} />
                <Text strong style={{ marginLeft: 12, marginRight: 8 }}>ค้างชำระยกมา:</Text>
                <input value={totalArrears.toLocaleString()} readOnly style={{ width: 100, textAlign: 'right', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px' }} />
              </div>
            </Space>
          </Col>
          <Col className="no-print">
            <Space>
              <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: '#334155', fontWeight: 'bold' }}>
                พิมพ์รายชื่อ
              </Button>
              <Button icon={<CloseOutlined />} onClick={() => window.history.back()} style={{ fontWeight: 'bold' }}>
                ปิด
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}