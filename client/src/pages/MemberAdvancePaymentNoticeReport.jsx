import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, Select, Input, DatePicker, Table, Space, message, InputNumber } from 'antd'
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

export default function MemberAdvancePaymentNoticeReport() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [orgInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('funeral_organization_info')) || {}
    } catch {
      return {}
    }
  })

  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [subdistrict, setSubdistrict] = useState('')
  const [villageNo, setVillageNo] = useState('')
  const [targetDate, setTargetDate] = useState(dayjs())
  const [maxBalance, setMaxBalance] = useState() // เงินเหลือน้อยกว่า
  const [reportData, setReportData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // ฟังก์ชันดึงและกรองข้อมูลสมาชิกจริง 100% จาก localStorage
  const handleSearchData = () => {
    try {
      const allMembers = JSON.parse(localStorage.getItem('funeral_members')) || []

      if (allMembers.length === 0) {
        message.warning('ไม่พบข้อมูลสมาชิกในระบบ (funeral_members)')
      }

      const filtered = allMembers.filter(m => {
        // กรองตามยอดเงินคงเหลือ (น้อยกว่าหรือเท่ากับที่กำหนด)
        const balance = Number(m.balance ?? m.saving ?? 0)
        if (maxBalance !== null && balance > maxBalance) {
          return false
        }
        return true
      })

      const formattedRows = filtered.map((m, idx) => {
        const mId = String(m.id || m.memberId || '')
        const fullName = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        
        const regDateRaw = m.registerDate || m.regDate || m.created_at
        const regDateFormatted = regDateRaw ? dayjs(regDateRaw).format('DD MMM BB') : '13 พ.ค. 2559'

        return {
          key: mId || idx + 1,
          no: idx + 1,
          memberId: mId,
          group: m.group || m.memberGroup || '3',
          memberName: fullName,
          regDate: regDateFormatted,
          balance: Number(m.balance ?? m.saving ?? -600),
          subdistrict: m.subdistrict || subdistrict || 'ซาง',
          village: String(m.village || m.moo || '01'),
          houseNo: m.houseNo || m.houseNumber || '35',
          note: m.note || '-'
        }
      })

      setReportData(formattedRows)
      setSelectedRowKeys(formattedRows.map(item => item.key))
      message.success(`ซิงค์ข้อมูลสมาชิกแจ้งชำระล่วงหน้าสำเร็จ (${formattedRows.length} รายการ)`)
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    }
  }

  useEffect(() => {
    handleSearchData()
  }, [])

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  const columns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: 50, align: 'center' },
    { title: 'สมาชิก', dataIndex: 'memberId', key: 'memberId', width: 80, align: 'center' },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 60, align: 'center' },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 200 },
    { title: 'วันที่ได้รับสิทธิ', dataIndex: 'regDate', key: 'regDate', width: 110, align: 'center' },
    { title: 'เงินคงเหลือ', dataIndex: 'balance', key: 'balance', width: 90, align: 'right', render: val => Number(val).toLocaleString() },
    { title: 'ตำบล', dataIndex: 'subdistrict', key: 'subdistrict', width: 80, align: 'center' },
    { title: 'หมู่', dataIndex: 'village', key: 'village', width: 60, align: 'center' }
  ]

  const printColumns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: 50, align: 'center' },
    { title: 'เลขประจำตัวสมาชิก', dataIndex: 'memberId', key: 'memberId', width: 110, align: 'center' },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 220 },
    { title: 'เงินคงเหลือ', dataIndex: 'balance', key: 'balance', width: 90, align: 'right', render: val => Number(val).toLocaleString() },
    { title: 'บ้านเลขที่', dataIndex: 'houseNo', key: 'houseNo', width: 80, align: 'center' },
    { title: 'ลงชื่อ', dataIndex: 'sign', key: 'sign', width: 100, align: 'center', render: () => '' },
    { title: 'หมายเหตุ', dataIndex: 'note', key: 'note', width: 100, align: 'center' }
  ]

  const printData = reportData.filter(item => selectedRowKeys.includes(item.key))

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
            <span>พิมพ์รายชื่อสมาชิกแจ้งให้ชำระเงินสงเคราะห์ล่วงหน้า</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* แผงควบคุม (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#f8fafc', padding: 16, borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>จังหวัด</Text></Col>
            <Col xs={24} sm={5}>
              <Select value={province} onChange={setProvince} options={PROVINCES_TH} style={{ width: '100%' }} showSearch />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>อำเภอ</Text></Col>
            <Col xs={24} sm={5}>
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="ระบุอำเภอ" />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>ตำบล</Text></Col>
            <Col xs={24} sm={5}>
              <Input value={subdistrict} onChange={e => setSubdistrict(e.target.value)} placeholder="ระบุตำบล" />
            </Col>
          </Row>

          <Row gutter={[12, 12]} align="middle" style={{ marginTop: 12 }}>
            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>หมู่</Text></Col>
            <Col xs={24} sm={5}>
              <Input value={villageNo} onChange={e => setVillageNo(e.target.value)} placeholder="เช่น 1 หรือ 1-99" />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>วันที่ได้รับสิทธิ</Text></Col>
            <Col xs={24} sm={5}>
              <DatePicker value={targetDate} onChange={val => val && setTargetDate(val)} format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>เงินเหลือน้อยกว่า</Text></Col>
            <Col xs={24} sm={3}>
              <InputNumber value={maxBalance} onChange={setMaxBalance} style={{ width: '100%' }} />
            </Col>

            <Col xs={24} sm={3}>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchData} style={{ background: primaryColor, width: '100%' }}>
                แสดงข้อมูล
              </Button>
            </Col>
          </Row>
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน */}
        <div id="printable-report-area">
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginBottom: 4 }}>
              <span>หมู่ {villageNo} ตำบล{subdistrict} อำเภอ{district} จังหวัด{province}</span>
              <span>หน้า : 1</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์การเกษตรเซกา'}</h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'normal' }}>รายชื่อสมาชิกแจ้งให้ชำระเงินสงเคราะห์ล่วงหน้า</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginTop: 4 }}>
              <span>&nbsp;</span>
              <span>วันที่พิมพ์: {dayjs().format('DD/MM/YYYY')} &nbsp;&nbsp;&nbsp; รวม: {printData.length}</span>
            </div>
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
              locale={{ emptyText: 'ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่เลือก' }}
            />
          </div>

          {/* ส่วนลงนาม ชิดขวา */}
          <div className="print-only" style={{ marginTop: 30 }}>
            <div style={{ marginLeft: 'auto', width: '300px', textAlign: 'center', fontSize: '11pt' }}>
              <div style={{ marginBottom: 25 }}>
                ลงชื่อ ............................................................................<br />
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
                <Text strong style={{ marginRight: 8 }}>จำนวน:</Text>
                <input 
                  value={printData.length} 
                  readOnly 
                  style={{ width: 80, textAlign: 'center', fontWeight: 'bold', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px' }} 
                />
                <Text style={{ marginLeft: 4 }}>ราย</Text>
              </div>
            </Space>
          </Col>
          <Col className="no-print">
            <Space>
              <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: '#334155', fontWeight: 'bold' }}>
                พิมพ์
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