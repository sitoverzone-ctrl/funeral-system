import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, DatePicker, Table, Space, message } from 'antd'
import { PrinterOutlined, SearchOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberRegisterReportSK1() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ดึงข้อมูลหน่วยงานจาก localStorage
  const [orgInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('funeral_organization_info')) || {}
    } catch {
      return {}
    }
  })

  const [startDate, setStartDate] = useState(dayjs().startOf('month'))
  const [endDate, setEndDate] = useState(dayjs().endOf('month'))
  const [reportData, setReportData] = useState([])

  // ฟังก์ชันซิงค์และกรองข้อมูลสมาชิกตามช่วงวันที่สมัคร
  const handleSearchData = () => {
    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []

      if (members.length === 0) {
        message.warning('ไม่พบข้อมูลสมาชิกในระบบ (funeral_members)')
      }

      // กรองตามวันที่สมัคร (registerDate, regDate, created_at, หรือ date)
      const filtered = members.filter(m => {
        const rawDate = m.registerDate || m.regDate || m.created_at || m.date
        if (!rawDate) return true 
        const mDate = dayjs(rawDate)
        return (
          (mDate.isSame(startDate, 'day') || mDate.isAfter(startDate, 'day')) &&
          (mDate.isSame(endDate, 'day') || mDate.isBefore(endDate, 'day'))
        )
      })

      const formattedRows = filtered.map((m, idx) => {
        const mId = String(m.id || m.memberId || '')
        const fullName = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        const group = m.group || m.groupId || m.village || '0'
        const regDateRaw = m.registerDate || m.regDate || m.created_at || m.date
        const regDateFormatted = regDateRaw ? dayjs(regDateRaw).format('DD/MM/YYYY') : '-'
        
        const birthDateRaw = m.birthDate || m.dob || m.birthday
        const birthDateFormatted = birthDateRaw ? dayjs(birthDateRaw).format('DD/MM/YYYY') : '-'

        const address = m.address || m.addr || '-'
        const spouse = m.spouse || m.husband || m.wife || '-'
        const beneficiary = m.beneficiary || m.receiver || fullName 
        const manager = m.manager || m.guarantor || '-' 

        return {
          key: mId || idx + 1,
          no: idx + 1,
          memberId: mId,
          group: group,
          memberName: fullName,
          regDate: regDateFormatted,
          birthDate: birthDateFormatted,
          address: address,
          spouse: spouse,
          beneficiary: beneficiary,
          manager: manager,
          note: m.note || '-'
        }
      })

      setReportData(formattedRows)
      message.success(`ซิงค์ข้อมูลทะเบียน ส.ณ.ก.1 สำเร็จ (${formattedRows.length} รายการ)`)
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการซิงค์ข้อมูล')
    }
  }

  // โหลดข้อมูลอัตโนมัติเมื่อเปิดหน้า
  useEffect(() => {
    handleSearchData()
  }, [])

  const columns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: 45, align: 'center' },
    { title: 'ชื่อสมาชิก', dataIndex: 'memberName', key: 'memberName', width: 160 },
    { title: 'เลขที่สมาชิก', dataIndex: 'memberId', key: 'memberId', width: 80, align: 'center' },
    { title: 'ว-ด-ป สมัคร', dataIndex: 'regDate', key: 'regDate', width: 90, align: 'center' },
    { title: 'ว-ด-ป เกิด', dataIndex: 'birthDate', key: 'birthDate', width: 90, align: 'center' },
    { title: 'ชื่อสามี-ภรรยา ที่อยู่ปัจจุบัน', dataIndex: 'address', key: 'address', width: 240, render: (v, r) => `${r.spouse !== '-' ? r.spouse + ' / ' : ''}${v}` },
    { title: 'ชื่อผู้รับเงินสงเคราะห์', dataIndex: 'beneficiary', key: 'beneficiary', width: 150 },
    { title: 'ชื่อผู้จัดการศพที่ระบุไว้', dataIndex: 'manager', key: 'manager', width: 150 },
    { title: 'หมายเหตุ', dataIndex: 'note', key: 'note', width: 75, align: 'center' }
  ]

  return (
    <div style={{ maxWidth: 1250, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์สำหรับการพิมพ์ (Print Style Sheet) ขยายเกือบชิดขอบ A4 แนวนอน */}
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
            left: 2mm;
            top: 2mm;
            width: calc(100% - 4mm);
            background: #fff !important;
            padding: 0 !important;
          }
          .no-print { 
            display: none !important; 
          }
          .print-only { 
            display: block !important; 
          }
          .ant-card { 
            border: none !important; 
            box-shadow: none !important; 
            background: transparent !important; 
          }
          .ant-card-body { 
            padding: 0 !important; 
          }
          .ant-table { 
            font-size: 11pt !important; 
            width: 100% !important;
          }
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
          @page { 
            size: A4 landscape; 
            margin: 0mm; 
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
            <span>รายงาน ส.ณ.ก.1 (ทะเบียนสมาชิก)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="no-print" style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={3} style={{ textAlign: 'right' }}><Text strong>วันที่สมัครตั้งแต่</Text></Col>
            <Col xs={24} sm={5}>
              <DatePicker 
                value={startDate} 
                onChange={(val) => val && setStartDate(val)} 
                format="DD/MM/YYYY" 
                style={{ width: '100%' }} 
              />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>ถึงวันที่</Text></Col>
            <Col xs={24} sm={5}>
              <DatePicker 
                value={endDate} 
                onChange={(val) => val && setEndDate(val)} 
                format="DD/MM/YYYY" 
                style={{ width: '100%' }} 
              />
            </Col>

            <Col xs={24} sm={4}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearchData}
                style={{ background: primaryColor, width: '100%' }}
              >
                แสดงข้อมูล
              </Button>
            </Col>
          </Row>
          <div style={{ marginTop: 6, fontSize: '11px', color: '#64748b' }} className="no-print">
            หมายเหตุ: ใช้กระดาษ A4 แนวนอน (Landscape)
          </div>
        </div>

        {/* พื้นที่สั่งพิมพ์ */}
        <div id="printable-report-area">
          {/* ส่วนหัวรายงานสำหรับสั่งพิมพ์ */}
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', marginBottom: 4 }}>
              <span>แบบ ส.ณ.ก.1</span>
              <span>หน้า : 1</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold' }}>ทะเบียนสมาชิก</h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'normal' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์'}</h3>
          </div>

          <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: 16 }}>
            <Table 
              dataSource={reportData} 
              columns={columns} 
              rowKey="key"
              size="small"
              bordered
              pagination={false}
              locale={{ emptyText: 'ไม่พบข้อมูลสมาชิกในช่วงวันที่เลือก' }}
            />
          </div>
        </div>

        <Row justify="space-between" align="middle" style={{ marginTop: 12 }} className="no-print">
          <Col>
            <Space size={16}>
              <div>
                <Text strong style={{ marginRight: 8 }}>จำนวน:</Text>
                <input 
                  value={reportData.length} 
                  readOnly 
                  style={{ width: 80, textAlign: 'center', fontWeight: 'bold', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px' }} 
                />
                <Text style={{ marginLeft: 4 }}>คน</Text>
              </div>
            </Space>
          </Col>
          <Col className="no-print">
            <Space>
              <Button 
                type="primary" 
                icon={<PrinterOutlined />} 
                onClick={() => window.print()} 
                style={{ background: '#334155', fontWeight: 'bold' }}
              >
                พิมพ์
              </Button>
              <Button 
                icon={<CloseOutlined />} 
                onClick={() => window.history.back()}
                style={{ fontWeight: 'bold' }}
              >
                ปิด
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}